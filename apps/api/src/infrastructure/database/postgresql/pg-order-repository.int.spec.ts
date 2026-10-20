import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { OrderEntity } from '@/domain/entities/order-entity'
import { OrderInconsistentStateError } from '@/domain/errors/order-inconsistent-state.error'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import { CorruptedRecordError } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import { PgOrderRepository } from '@/infrastructure/database/postgresql/pg-order-repository'
import { orders } from '@/infrastructure/database/postgresql/schema'
import { present, seedAdjustment, seedDish, violates } from '@test/integration/fixtures'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgOrderRepository', () => {
  const db = useTestDatabase()
  const repository = new PgOrderRepository(db)
  const now = new Date('2026-10-17T15:00:00Z')
  let frango: string
  let bife: string

  beforeEach(async () => {
    frango = await seedDish(db, 'Frango grelhado')
    bife = await seedDish(db, 'Bife acebolado')
  })

  const item = (dishId: string, quantity = 1, cents = 2500) =>
    OrderItemVO.create({
      dishId,
      dishName: 'Frango grelhado',
      size: 'medium',
      unitPrice: MoneyVO.fromCents(cents),
      quantity,
    })

  const order = (ticket: number, items: readonly OrderItemVO[] = [item(frango)], at = now) => {
    const created = OrderEntity.create({
      id: randomUUID(),
      businessDate: LocalDateVO.fromInstant(at),
      ticket: TicketNumberVO.of(ticket),
      origin: 'counter',
      items,
      now: at,
    })
    created.pullEvents()

    return created
  }

  it('round-trips an order with its item snapshots', async () => {
    const complete = OrderEntity.create({
      id: randomUUID(),
      businessDate: LocalDateVO.fromInstant(now),
      ticket: TicketNumberVO.of(42),
      origin: 'whatsapp',
      customerName: 'Maria',
      items: [
        OrderItemVO.create({
          dishId: bife,
          dishName: 'Bife acebolado',
          size: 'large',
          unitPrice: MoneyVO.fromCents(3200),
          quantity: 2,
          adjustments: [
            { adjustmentId: await seedAdjustment(db, 'Sem cebola'), label: 'Sem cebola' },
            {
              adjustmentId: await seedAdjustment(db, 'Farofa → salada'),
              label: 'Farofa → salada',
            },
          ],
          note: 'Bem passado',
        }),
        item(frango),
      ],
      now,
    })
    complete.pullEvents()

    await repository.create(complete)

    expect(await repository.findById(complete.id)).toEqual(complete)
  })

  it('returns null for an unknown id', async () => {
    expect(await repository.findById(randomUUID())).toBeNull()
  })

  it('rejects a repeated ticket on the same day and accepts it on another day', async () => {
    await repository.create(order(1))

    await expect(repository.create(order(1))).rejects.toMatchObject(
      violates('orders_business_date_ticket_unique'),
    )
    await expect(
      repository.create(order(1, [item(frango)], new Date('2026-10-18T15:00:00Z'))),
    ).resolves.toBeUndefined()
  })

  it('persists status transitions and their instants', async () => {
    const delivered = order(1)
    const cancelled = order(2)
    await repository.create(delivered)
    await repository.create(cancelled)

    delivered.start(new Date('2026-10-17T15:05:00Z'))
    delivered.markReady(new Date('2026-10-17T15:20:00Z'))
    delivered.deliver(new Date('2026-10-17T15:25:00Z'))
    cancelled.cancel(new Date('2026-10-17T15:10:00Z'))
    delivered.pullEvents()
    cancelled.pullEvents()
    await repository.update(delivered, 'received')
    await repository.update(cancelled, 'received')

    expect(await repository.findById(delivered.id)).toEqual(delivered)
    expect(await repository.findById(cancelled.id)).toEqual(cancelled)
  })

  it('rejects an update from a copy read before another update', async () => {
    const current = order(1)
    await repository.create(current)
    const stale = present(await repository.findById(current.id))

    current.start(new Date('2026-10-17T15:05:00Z'))
    current.markReady(new Date('2026-10-17T15:20:00Z'))
    current.deliver(new Date('2026-10-17T15:25:00Z'))
    current.pullEvents()
    await repository.update(current, 'received')
    stale.cancel(new Date('2026-10-17T15:30:00Z'))

    await expect(repository.update(stale, 'received')).rejects.toBeInstanceOf(StaleWriteError)
    expect(await repository.findById(current.id)).toEqual(current)
  })

  it('persists the largest safe integers', async () => {
    const byTicketAndPrice = order(Number.MAX_SAFE_INTEGER, [
      item(frango, 1, Number.MAX_SAFE_INTEGER),
    ])
    const byQuantity = order(1, [item(frango, Number.MAX_SAFE_INTEGER, 1)])

    await repository.create(byTicketAndPrice)
    await repository.create(byQuantity)

    expect(await repository.findById(byTicketAndPrice.id)).toEqual(byTicketAndPrice)
    expect(await repository.findById(byQuantity.id)).toEqual(byQuantity)
  })

  it('rolls back the order when an item cannot be stored', async () => {
    const broken = order(1, [item(frango), item(randomUUID())])

    await expect(repository.create(broken)).rejects.toMatchObject(
      violates('order_items_dish_id_dishes_id_fk'),
    )
    expect(await repository.findById(broken.id)).toBeNull()
  })

  it('reports a stored order that breaks the domain rules as corrupted', async () => {
    const received = order(1)
    await repository.create(received)
    await db.update(orders).set({ status: 'delivered' }).where(eq(orders.id, received.id))

    const found = repository.findById(received.id)

    await expect(found).rejects.toBeInstanceOf(CorruptedRecordError)
    await expect(found).rejects.toMatchObject({
      cause: expect.any(OrderInconsistentStateError),
    })
  })
})
