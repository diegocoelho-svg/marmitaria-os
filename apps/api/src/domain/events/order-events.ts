import type { DomainEvent } from '@/domain/events/domain-event'

type OrderSnapshot = Readonly<{
  businessDate: string
  ticket: number
}>

export type OrderCreated = DomainEvent<'order.created'> & OrderSnapshot

export type OrderStarted = DomainEvent<'order.started'> & OrderSnapshot

export type OrderReady = DomainEvent<'order.ready'> & OrderSnapshot

export type OrderDelivered = DomainEvent<'order.delivered'> & OrderSnapshot

export type OrderCancelled = DomainEvent<'order.cancelled'> & OrderSnapshot

export type OrderEvent = OrderCreated | OrderStarted | OrderReady | OrderDelivered | OrderCancelled
