import { OrderEntity } from '@/domain/entities/order-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type {
  orderItemAdjustments,
  orderItems,
  orders,
} from '@/infrastructure/database/postgresql/schema'

type OrderRow = typeof orders.$inferSelect
type OrderItemRow = typeof orderItems.$inferSelect
type OrderItemAdjustmentRow = typeof orderItemAdjustments.$inferSelect

export type OrderRecord = OrderRow & {
  items: (OrderItemRow & { adjustments: OrderItemAdjustmentRow[] })[]
}

export type OrderPersistence = {
  order: OrderRow
  items: OrderItemRow[]
  adjustments: OrderItemAdjustmentRow[]
}

export class OrderMapper {
  static fromPersistence(record: OrderRecord): OrderEntity {
    return restoreRecord('orders', record.id, () =>
      OrderEntity.restore({
        id: record.id,
        businessDate: LocalDateVO.parse(record.businessDate),
        ticket: TicketNumberVO.of(record.ticket),
        origin: record.origin,
        customerName: record.customerName ?? undefined,
        items: record.items.map((item) =>
          OrderItemVO.create({
            dishId: item.dishId,
            dishName: item.dishName,
            size: item.size,
            unitPrice: MoneyVO.fromCents(item.unitPriceCents),
            quantity: item.quantity,
            adjustments: item.adjustments.map((adjustment) => ({
              adjustmentId: adjustment.adjustmentId,
              label: adjustment.label,
            })),
            note: item.note ?? undefined,
          }),
        ),
        status: record.status,
        createdAt: record.createdAt,
        startedAt: record.startedAt ?? undefined,
        readyAt: record.readyAt ?? undefined,
        deliveredAt: record.deliveredAt ?? undefined,
        cancelledAt: record.cancelledAt ?? undefined,
      }),
    )
  }

  static toPersistence(order: OrderEntity): OrderPersistence {
    const items = order.items

    return {
      order: {
        id: order.id,
        businessDate: order.businessDate.toString(),
        ticket: order.ticket.value,
        origin: order.origin,
        customerName: order.customerName ?? null,
        status: order.status,
        createdAt: order.createdAt,
        startedAt: order.startedAt ?? null,
        readyAt: order.readyAt ?? null,
        deliveredAt: order.deliveredAt ?? null,
        cancelledAt: order.cancelledAt ?? null,
      },
      items: items.map((item, position) => ({
        orderId: order.id,
        position,
        dishId: item.dishId,
        dishName: item.dishName,
        size: item.size,
        unitPriceCents: item.unitPrice.cents,
        quantity: item.quantity,
        note: item.note ?? null,
      })),
      adjustments: items.flatMap((item, itemPosition) =>
        item.adjustments.map((adjustment, position) => ({
          orderId: order.id,
          itemPosition,
          position,
          adjustmentId: adjustment.adjustmentId,
          label: adjustment.label,
        })),
      ),
    }
  }
}
