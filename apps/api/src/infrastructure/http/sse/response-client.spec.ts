import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrderEvent } from '@/domain/events/order-events'
import { EventStream } from '@/infrastructure/http/sse/event-stream'
import { ResponseClient, type SseResponse } from '@/infrastructure/http/sse/response-client'

class FakeResponse implements SseResponse {
  readonly written: string[] = []
  ended = false
  destroyed = false
  private accepting = true
  private readonly listeners = { drain: new Set<() => void>(), close: new Set<() => void>() }

  write(chunk: string): boolean {
    this.written.push(chunk)

    return this.accepting
  }

  end(): void {
    this.ended = true
    this.emit('close')
  }

  destroy(): void {
    this.destroyed = true
    this.emit('close')
  }

  once(event: 'drain' | 'close', listener: () => void): void {
    this.listeners[event].add(listener)
  }

  congest(): void {
    this.accepting = false
  }

  drain(): void {
    this.accepting = true
    this.emit('drain')
  }

  private emit(event: 'drain' | 'close'): void {
    const listeners = [...this.listeners[event]]
    this.listeners[event].clear()
    listeners.forEach((listener) => listener())
  }
}

const orderCreated = (ticket: number): OrderEvent => ({
  type: 'order.created',
  aggregateId: `00000000-0000-4000-8000-${String(ticket).padStart(12, '0')}`,
  occurredAt: new Date('2026-10-17T15:00:00Z'),
  businessDate: '2026-10-17',
  ticket,
})

const limits = { maxQueuedChunks: 3, drainTimeoutMs: 1_000 }

describe('ResponseClient', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds chunks while the response is congested and sends them in order on drain', () => {
    const response = new FakeResponse()
    const client = new ResponseClient(response, limits)
    response.congest()

    client.write('a')
    client.write('b')
    client.write('c')
    response.drain()

    expect(response.written).toEqual(['a', 'b', 'c'])
    expect(response.destroyed).toBe(false)
  })

  it('drops a client whose queue goes over the limit', () => {
    const response = new FakeResponse()
    const client = new ResponseClient(response, limits)
    response.congest()

    ;['a', 'b', 'c', 'd', 'e'].forEach((chunk) => client.write(chunk))
    response.drain()

    expect(response.destroyed).toBe(true)
    expect(response.written).toEqual(['a'])
  })

  it('drops a client that does not drain in time', () => {
    vi.useFakeTimers()
    const response = new FakeResponse()
    const client = new ResponseClient(response, limits)
    response.congest()

    client.write('a')
    vi.advanceTimersByTime(1_000)

    expect(response.destroyed).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ends a healthy response and destroys a congested one', () => {
    const healthy = new FakeResponse()
    const congested = new FakeResponse()
    const clients = [new ResponseClient(healthy, limits), new ResponseClient(congested, limits)]
    congested.congest()
    clients.forEach((client) => client.write('a'))

    clients.forEach((client) => client.end())

    expect([healthy.ended, healthy.destroyed]).toEqual([true, false])
    expect([congested.ended, congested.destroyed]).toEqual([false, true])
  })

  it('keeps a healthy screen up to date while a slow one falls behind', () => {
    const stream = new EventStream({ epoch: 'boot' })
    const slow = new FakeResponse()
    const healthy = new FakeResponse()
    stream.connect(new ResponseClient(slow, limits))
    stream.connect(new ResponseClient(healthy, limits))
    slow.congest()

    ;[1, 2, 3, 4, 5, 6].forEach((ticket) => stream.record(orderCreated(ticket)))

    expect(healthy.written).toHaveLength(7)
    expect(slow.destroyed).toBe(true)
  })

  it('delivers a replay larger than the response buffer to a healthy reader', () => {
    const stream = new EventStream({ epoch: 'boot' })
    ;[1, 2, 3, 4, 5].forEach((ticket) => stream.record(orderCreated(ticket)))
    const response = new FakeResponse()
    response.congest()

    stream.connect(new ResponseClient(response, { ...limits, maxQueuedChunks: 5 }), 'boot:0')
    response.drain()

    expect(response.written.map((chunk) => /^id: (.+)$/m.exec(chunk)?.[1])).toEqual([
      'boot:1',
      'boot:2',
      'boot:3',
      'boot:4',
      'boot:5',
    ])
  })
})
