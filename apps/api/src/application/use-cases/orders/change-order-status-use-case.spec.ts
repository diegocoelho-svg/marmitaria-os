import { beforeEach, describe, expect, it } from 'vitest'
import { OrderNotFoundError } from '@/application/errors/order-not-found.error'
import { ChangeOrderStatusUseCase } from '@/application/use-cases/orders/change-order-status-use-case'
import { OrderEntity } from '@/domain/entities/order-entity'
import { OrderInvalidTransitionError } from '@/domain/errors/order-invalid-transition.error'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import { FakeOrderRepository } from '@test/fakes/fake-repositories'
import { FakeClock, RecordingEventBus } from '@test/fakes/fake-services'

describe('ChangeOrderStatusUseCase', () => {
  let orders: FakeOrderRepository
  let clock: FakeClock
  let eventBus: RecordingEventBus
  let useCase: ChangeOrderStatusUseCase

  beforeEach(async () => {
    orders = new FakeOrderRepository()
    clock = new FakeClock(new Date('2026-10-17T15:00:00Z'))
    eventBus = new RecordingEventBus()
    useCase = new ChangeOrderStatusUseCase(orders, clock, eventBus)

    await orders.create(
      OrderEntity.create({
        id: 'order-1',
        businessDate: LocalDateVO.parse('2026-10-17'),
        ticket: TicketNumberVO.of(7),
        origin: 'counter',
        items: [
          OrderItemVO.create({
            dishId: 'frango',
            dishName: 'Frango grelhado',
            size: 'medium',
            unitPrice: MoneyVO.fromCents(2500),
            quantity: 1,
          }),
        ],
        now: clock.now(),
      }),
    )
  })

  it('moves the order through the kitchen and records each instant', async () => {
    clock.set('2026-10-17T15:05:00Z')
    await useCase.execute({ id: 'order-1', status: 'preparing' })
    clock.set('2026-10-17T15:20:00Z')
    await useCase.execute({ id: 'order-1', status: 'ready' })
    clock.set('2026-10-17T15:25:00Z')

    const output = await useCase.execute({ id: 'order-1', status: 'delivered' })

    expect(output).toMatchObject({
      status: 'delivered',
      startedAt: '2026-10-17T15:05:00.000Z',
      readyAt: '2026-10-17T15:20:00.000Z',
      deliveredAt: '2026-10-17T15:25:00.000Z',
    })
    expect(eventBus.published.map((event) => event.type)).toEqual([
      'order.started',
      'order.ready',
      'order.delivered',
    ])
  })

  it('cancels an order', async () => {
    const output = await useCase.execute({ id: 'order-1', status: 'cancelled' })

    expect(output).toMatchObject({ status: 'cancelled', cancelledAt: '2026-10-17T15:00:00.000Z' })
    expect(await orders.findById('order-1')).toMatchObject({ status: 'cancelled' })
  })

  it('rejects a transition the order does not allow', async () => {
    await expect(useCase.execute({ id: 'order-1', status: 'delivered' })).rejects.toBeInstanceOf(
      OrderInvalidTransitionError,
    )
    expect(eventBus.published).toEqual([])
  })

  it('publishes only the transition that wins a concurrent change', async () => {
    const [started, cancelled] = await Promise.allSettled([
      useCase.execute({ id: 'order-1', status: 'preparing' }),
      useCase.execute({ id: 'order-1', status: 'cancelled' }),
    ])

    expect(started).toMatchObject({ status: 'fulfilled', value: { status: 'preparing' } })
    expect(cancelled).toMatchObject({ status: 'rejected', reason: expect.any(StaleWriteError) })
    expect(eventBus.published.map((event) => event.type)).toEqual(['order.started'])
    expect(await orders.findById('order-1')).toMatchObject({ status: 'preparing' })
  })

  it('rejects an unknown order', async () => {
    await expect(useCase.execute({ id: 'order-2', status: 'preparing' })).rejects.toBeInstanceOf(
      OrderNotFoundError,
    )
  })
})
