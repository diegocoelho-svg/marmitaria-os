import { describe, expect, it } from 'vitest'
import type { ApplicationEvent } from '@/application/ports/event-bus'
import {
  type EventHandlerFailure,
  InMemoryEventBus,
} from '@/infrastructure/events/in-memory-event-bus'

const published = (aggregateId: string): ApplicationEvent => ({
  type: 'daily_menu.published',
  aggregateId,
  occurredAt: new Date('2026-10-17T15:00:00Z'),
  date: '2026-10-20',
  sourceMenuId: 'menu-a',
  dishIds: ['frango'],
})

describe('InMemoryEventBus', () => {
  it('delivers each event to every subscriber in order', async () => {
    const bus = new InMemoryEventBus(() => {})
    const first: string[] = []
    const second: string[] = []
    bus.subscribe((event) => {
      first.push(event.aggregateId)
    })
    bus.subscribe(async (event) => {
      second.push(event.aggregateId)
    })

    await bus.publish([published('a'), published('b')])

    expect(first).toEqual(['a', 'b'])
    expect(second).toEqual(['a', 'b'])
  })

  it('stops delivering after unsubscribing', async () => {
    const bus = new InMemoryEventBus(() => {})
    const received: string[] = []
    const unsubscribe = bus.subscribe((event) => {
      received.push(event.aggregateId)
    })

    unsubscribe()
    await bus.publish([published('a')])

    expect(received).toEqual([])
  })

  it('reports a failing handler without stopping the others', async () => {
    const failures: EventHandlerFailure[] = []
    const bus = new InMemoryEventBus((failure) => failures.push(failure))
    const received: string[] = []
    bus.subscribe(() => {
      throw new Error('screen disconnected')
    })
    bus.subscribe((event) => {
      received.push(event.aggregateId)
    })

    await bus.publish([published('a')])

    expect(received).toEqual(['a'])
    expect(failures).toEqual([{ error: new Error('screen disconnected'), event: published('a') }])
  })
})
