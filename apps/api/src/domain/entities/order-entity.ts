import { OrderBusinessDateMismatchError } from '@/domain/errors/order-business-date-mismatch.error'
import { OrderEmptyError } from '@/domain/errors/order-empty.error'
import { OrderInconsistentStateError } from '@/domain/errors/order-inconsistent-state.error'
import { OrderInvalidCustomerNameError } from '@/domain/errors/order-invalid-customer-name.error'
import { OrderInvalidOriginError } from '@/domain/errors/order-invalid-origin.error'
import { OrderInvalidStatusError } from '@/domain/errors/order-invalid-status.error'
import { OrderInvalidTransitionError } from '@/domain/errors/order-invalid-transition.error'
import { OrderTimeWentBackwardsError } from '@/domain/errors/order-time-went-backwards.error'
import type { OrderEvent } from '@/domain/events/order-events'
import { AggregateRoot } from '@/domain/shared/aggregate-root'
import { copyInstant } from '@/domain/shared/instant'
import { optionalText } from '@/domain/shared/text'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import type { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import { canTransition, isOrderStatus, type OrderStatus } from '@/domain/value-objects/order-status'
import type { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'

const CUSTOMER_NAME_MAX_LENGTH = 60

export const orderOrigins: readonly ['counter', 'whatsapp'] = ['counter', 'whatsapp']

export type OrderOrigin = (typeof orderOrigins)[number]

const progression: readonly ['startedAt', 'readyAt', 'deliveredAt'] = [
  'startedAt',
  'readyAt',
  'deliveredAt',
]

type Milestone = (typeof progression)[number] | 'cancelledAt'

const milestoneNames: readonly Milestone[] = [...progression, 'cancelledAt']

const progressByStatus: Record<Exclude<OrderStatus, 'cancelled'>, number> = {
  received: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
}

export type OrderEntityProps = {
  readonly businessDate: LocalDateVO
  readonly ticket: TicketNumberVO
  readonly origin: OrderOrigin
  readonly customerName: string | undefined
  readonly items: readonly OrderItemVO[]
  readonly createdAt: Date
  status: OrderStatus
  startedAt: Date | undefined
  readyAt: Date | undefined
  deliveredAt: Date | undefined
  cancelledAt: Date | undefined
}

export type CreateOrderInput = {
  id: string
  businessDate: LocalDateVO
  ticket: TicketNumberVO
  origin: OrderOrigin
  customerName?: string | undefined
  items: readonly OrderItemVO[]
  now: Date
}

export type RestoreOrderInput = Omit<CreateOrderInput, 'now' | 'origin'> & {
  origin: string
  status: string
  createdAt: Date
  startedAt?: Date | undefined
  readyAt?: Date | undefined
  deliveredAt?: Date | undefined
  cancelledAt?: Date | undefined
}

export class OrderEntity extends AggregateRoot<OrderEntityProps, OrderEvent> {
  private constructor(input: RestoreOrderInput) {
    if (!isOrderOrigin(input.origin)) {
      throw new OrderInvalidOriginError(input.origin)
    }

    if (!isOrderStatus(input.status)) {
      throw new OrderInvalidStatusError(input.status)
    }

    if (input.items.length === 0) {
      throw new OrderEmptyError()
    }

    const customerName = optionalText(
      input.customerName,
      CUSTOMER_NAME_MAX_LENGTH,
      OrderInvalidCustomerNameError,
    )
    const createdAt = copyInstant(input.createdAt)

    if (!input.businessDate.equals(LocalDateVO.fromInstant(createdAt))) {
      throw new OrderBusinessDateMismatchError()
    }

    super(input.id, {
      businessDate: input.businessDate,
      ticket: input.ticket,
      origin: input.origin,
      customerName,
      items: [...input.items],
      status: input.status,
      createdAt,
      startedAt: optionalInstant(input.startedAt),
      readyAt: optionalInstant(input.readyAt),
      deliveredAt: optionalInstant(input.deliveredAt),
      cancelledAt: optionalInstant(input.cancelledAt),
    })

    this.total()
  }

  static create(input: CreateOrderInput): OrderEntity {
    const order = new OrderEntity({
      id: input.id,
      businessDate: input.businessDate,
      ticket: input.ticket,
      origin: input.origin,
      customerName: input.customerName,
      items: input.items,
      status: 'received',
      createdAt: input.now,
    })
    order.record({ type: 'order.created', ...order.snapshot(input.now) })

    return order
  }

  static restore(input: RestoreOrderInput): OrderEntity {
    const order = new OrderEntity(input)
    order.assertConsistentHistory()

    return order
  }

  get businessDate(): LocalDateVO {
    return this.props.businessDate
  }

  get ticket(): TicketNumberVO {
    return this.props.ticket
  }

  get origin(): OrderOrigin {
    return this.props.origin
  }

  get customerName(): string | undefined {
    return this.props.customerName
  }

  get items(): readonly OrderItemVO[] {
    return [...this.props.items]
  }

  get status(): OrderStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  get startedAt(): Date | undefined {
    return this.milestone('startedAt')
  }

  get readyAt(): Date | undefined {
    return this.milestone('readyAt')
  }

  get deliveredAt(): Date | undefined {
    return this.milestone('deliveredAt')
  }

  get cancelledAt(): Date | undefined {
    return this.milestone('cancelledAt')
  }

  total(): MoneyVO {
    return this.props.items.reduce((sum, item) => sum.add(item.subtotal()), MoneyVO.zero())
  }

  start(now: Date): void {
    this.transition('preparing', 'startedAt', now)
    this.record({ type: 'order.started', ...this.snapshot(now) })
  }

  markReady(now: Date): void {
    this.transition('ready', 'readyAt', now)
    this.record({ type: 'order.ready', ...this.snapshot(now) })
  }

  deliver(now: Date): void {
    this.transition('delivered', 'deliveredAt', now)
    this.record({ type: 'order.delivered', ...this.snapshot(now) })
  }

  cancel(now: Date): void {
    this.transition('cancelled', 'cancelledAt', now)
    this.record({ type: 'order.cancelled', ...this.snapshot(now) })
  }

  private transition(to: OrderStatus, milestone: Milestone, now: Date): void {
    if (!canTransition(this.props.status, to)) {
      throw new OrderInvalidTransitionError(this.props.status, to)
    }

    const at = copyInstant(now)

    if (at.getTime() < this.lastChangeAt()) {
      throw new OrderTimeWentBackwardsError()
    }

    this.props[milestone] = at
    this.props.status = to
  }

  private lastChangeAt(): number {
    const changes = milestoneNames.flatMap((milestone) => this.props[milestone]?.getTime() ?? [])

    return Math.max(this.props.createdAt.getTime(), ...changes)
  }

  private assertConsistentHistory(): void {
    const { status, cancelledAt, deliveredAt } = this.props
    const reached = progression.filter((milestone) => this.props[milestone] !== undefined)
    const isPrefix = reached.every((milestone, index) => progression[index] === milestone)
    const cancelled = cancelledAt !== undefined
    const matchesStatus =
      status === 'cancelled'
        ? cancelled && deliveredAt === undefined
        : !cancelled && reached.length === progressByStatus[status]

    const sequence: Milestone[] = cancelled ? [...reached, 'cancelledAt'] : reached
    let previous = this.props.createdAt.getTime()
    const chronological = sequence.every((milestone) => {
      const at = this.props[milestone]?.getTime() ?? previous
      const ordered = at >= previous
      previous = at
      return ordered
    })

    if (!isPrefix || !matchesStatus || !chronological) {
      throw new OrderInconsistentStateError(this.id, status)
    }
  }

  private milestone(name: Milestone): Date | undefined {
    const at = this.props[name]

    return at === undefined ? undefined : new Date(at)
  }

  private snapshot(now: Date) {
    return {
      aggregateId: this.id,
      occurredAt: copyInstant(now),
      businessDate: this.props.businessDate.toString(),
      ticket: this.props.ticket.value,
    }
  }
}

function isOrderOrigin(value: string): value is OrderOrigin {
  return orderOrigins.some((origin) => origin === value)
}

function optionalInstant(instant: Date | undefined): Date | undefined {
  return instant === undefined ? undefined : copyInstant(instant)
}
