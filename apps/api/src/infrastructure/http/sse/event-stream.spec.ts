import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrderEvent } from '@/domain/events/order-events'
import { EventStream, type StreamClient } from '@/infrastructure/http/sse/event-stream'

class RecordingClient implements StreamClient {
  readonly chunks: string[] = []
  ended = false

  write(chunk: string): void {
    this.chunks.push(chunk)
  }

  end(): void {
    this.ended = true
  }

  events(): string[] {
    return this.chunks.flatMap((chunk) => /^event: (.+)$/m.exec(chunk)?.[1] ?? [])
  }

  ids(): string[] {
    return this.chunks.flatMap((chunk) => /^id: (.+)$/m.exec(chunk)?.[1] ?? [])
  }
}

const orderCreated = (ticket: number): OrderEvent => ({
  type: 'order.created',
  aggregateId: `00000000-0000-4000-8000-${String(ticket).padStart(12, '0')}`,
  occurredAt: new Date('2026-10-17T15:00:00Z'),
  businessDate: '2026-10-17',
  ticket,
})

describe('EventStream', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('greets a new client with the current cursor and forwards the next events', () => {
    const stream = new EventStream({ epoch: 'boot' })
    stream.record(orderCreated(1))
    const client = new RecordingClient()

    stream.connect(client)
    stream.record(orderCreated(2))

    expect(client.chunks).toEqual([
      'id: boot:1\nevent: ready\ndata: {}\n\n',
      'id: boot:2\nevent: order.created\ndata: {"type":"order.created",' +
        '"aggregateId":"00000000-0000-4000-8000-000000000002",' +
        '"occurredAt":"2026-10-17T15:00:00.000Z","businessDate":"2026-10-17","ticket":2}\n\n',
    ])
  })

  it('replays the events a reconnecting client missed', () => {
    const stream = new EventStream({ epoch: 'boot' })
    ;[1, 2, 3].forEach((ticket) => stream.record(orderCreated(ticket)))
    const client = new RecordingClient()

    stream.connect(client, 'boot:1')

    expect(client.ids()).toEqual(['boot:2', 'boot:3'])
    expect(client.events()).toEqual(['order.created', 'order.created'])
  })

  it('sends nothing to a client that is up to date', () => {
    const stream = new EventStream({ epoch: 'boot' })
    stream.record(orderCreated(1))
    const client = new RecordingClient()

    stream.connect(client, 'boot:1')

    expect(client.chunks).toEqual([])
  })

  it.each([
    ['from another boot', 'old-boot:1'],
    ['malformed', 'garbage'],
    ['ahead of the stream', 'boot:9'],
    ['older than the buffer', 'boot:0'],
  ])('asks a client with a cursor %s to reset', (_, lastEventId) => {
    const stream = new EventStream({ epoch: 'boot', capacity: 2 })
    ;[1, 2, 3].forEach((ticket) => stream.record(orderCreated(ticket)))
    const client = new RecordingClient()

    stream.connect(client, lastEventId)

    expect(client.chunks).toEqual(['id: boot:3\nevent: reset\ndata: {}\n\n'])
  })

  it('replays from the oldest buffered event', () => {
    const stream = new EventStream({ epoch: 'boot', capacity: 2 })
    ;[1, 2, 3].forEach((ticket) => stream.record(orderCreated(ticket)))
    const client = new RecordingClient()

    stream.connect(client, 'boot:1')

    expect(client.ids()).toEqual(['boot:2', 'boot:3'])
  })

  it('stops writing to a disconnected client', () => {
    const stream = new EventStream({ epoch: 'boot' })
    const client = new RecordingClient()
    const disconnect = stream.connect(client)

    disconnect()
    stream.record(orderCreated(1))

    expect(client.events()).toEqual(['ready'])
  })

  it('pings connected clients while anyone is listening', () => {
    vi.useFakeTimers()
    const stream = new EventStream({ epoch: 'boot', heartbeatMs: 1_000 })
    const client = new RecordingClient()
    const disconnect = stream.connect(client)

    vi.advanceTimersByTime(2_000)
    disconnect()
    vi.advanceTimersByTime(2_000)

    expect(client.chunks.filter((chunk) => chunk === ': ping\n\n')).toHaveLength(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ends every client on close', () => {
    vi.useFakeTimers()
    const stream = new EventStream({ epoch: 'boot' })
    const clients = [new RecordingClient(), new RecordingClient()]
    clients.forEach((client) => stream.connect(client))

    stream.close()
    stream.record(orderCreated(1))

    expect(clients.map((client) => client.ended)).toEqual([true, true])
    expect(clients.map((client) => client.events())).toEqual([['ready'], ['ready']])
    expect(vi.getTimerCount()).toBe(0)
  })
})
