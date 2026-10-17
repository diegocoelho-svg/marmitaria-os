import { and, asc, eq } from 'drizzle-orm'
import type { OrderEntity } from '@/domain/entities/order-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import type { OrderRepository } from '@/domain/repositories/order-repository'
import type { OrderStatus } from '@/domain/value-objects/order-status'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { OrderMapper } from '@/infrastructure/database/postgresql/mappers/order-mapper'
import {
  orderItemAdjustments,
  orderItems,
  orders,
} from '@/infrastructure/database/postgresql/schema'

export class PgOrderRepository implements OrderRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const record = await this.db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          orderBy: asc(orderItems.position),
          with: { adjustments: { orderBy: asc(orderItemAdjustments.position) } },
        },
      },
    })

    return record ? OrderMapper.fromPersistence(record) : null
  }

  async create(order: OrderEntity): Promise<void> {
    const persistence = OrderMapper.toPersistence(order)

    await this.db.transaction(async (tx) => {
      await tx.insert(orders).values(persistence.order)
      await tx.insert(orderItems).values(persistence.items)

      if (persistence.adjustments.length > 0) {
        await tx.insert(orderItemAdjustments).values(persistence.adjustments)
      }
    })
  }

  async update(order: OrderEntity, expectedStatus: OrderStatus): Promise<void> {
    const { id, status, startedAt, readyAt, deliveredAt, cancelledAt } =
      OrderMapper.toPersistence(order).order

    const updated = await this.db
      .update(orders)
      .set({ status, startedAt, readyAt, deliveredAt, cancelledAt })
      .where(and(eq(orders.id, id), eq(orders.status, expectedStatus)))
      .returning({ id: orders.id })

    if (updated.length === 0) {
      throw new StaleWriteError('Order', id)
    }
  }
}
