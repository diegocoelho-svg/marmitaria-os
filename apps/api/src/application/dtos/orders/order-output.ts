import type { OrderEntity, OrderOrigin } from '@/domain/entities/order-entity'
import type { AdjustmentSnapshot, OrderItemVO } from '@/domain/value-objects/order-item-vo'
import type { OrderStatus } from '@/domain/value-objects/order-status'
import type { Size } from '@/domain/value-objects/size'

export type OrderItemOutput = {
  dishId: string
  dishName: string
  size: Size
  unitPriceCents: number
  quantity: number
  subtotalCents: number
  adjustments: AdjustmentSnapshot[]
  note: string | null
}

export type OrderOutput = {
  id: string
  businessDate: string
  ticket: number
  origin: OrderOrigin
  customerName: string | null
  status: OrderStatus
  items: OrderItemOutput[]
  totalCents: number
  createdAt: string
  startedAt: string | null
  readyAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}

export const OrderOutput = {
  from(order: OrderEntity): OrderOutput {
    return {
      id: order.id,
      businessDate: order.businessDate.toString(),
      ticket: order.ticket.value,
      origin: order.origin,
      customerName: order.customerName ?? null,
      status: order.status,
      items: order.items.map(itemOutput),
      totalCents: order.total().cents,
      createdAt: order.createdAt.toISOString(),
      startedAt: order.startedAt?.toISOString() ?? null,
      readyAt: order.readyAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
    }
  },
}

function itemOutput(item: OrderItemVO): OrderItemOutput {
  return {
    dishId: item.dishId,
    dishName: item.dishName,
    size: item.size,
    unitPriceCents: item.unitPrice.cents,
    quantity: item.quantity,
    subtotalCents: item.subtotal().cents,
    adjustments: [...item.adjustments],
    note: item.note ?? null,
  }
}
