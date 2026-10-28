export const orderStatuses: readonly ['received', 'preparing', 'ready', 'delivered', 'cancelled'] =
  ['received', 'preparing', 'ready', 'delivered', 'cancelled']

export type OrderStatus = (typeof orderStatuses)[number]

export function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.some((status) => status === value)
}

const transitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to)
}
