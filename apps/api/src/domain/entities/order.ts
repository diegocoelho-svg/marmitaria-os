import { AggregateRoot } from '../shared/aggregate-root'
import { DomainError } from '../errors/domain-error'
import { toTimestamp } from '../shared/instant'
import { LocalDate } from '../value-objects/local-date'
import { Money } from '../value-objects/money'
import { optionalText } from '../shared/text'
import type { OrderEvent } from '../events/order-events'
import type { OrderItem } from '../value-objects/order-item'
import { canTransition, isOrderStatus, type OrderStatus } from '../value-objects/order-status'
import type { TicketNumber } from '../value-objects/ticket-number'

const CUSTOMER_NAME_MAX_LENGTH = 60

export const orderOrigins = ['counter', 'whatsapp'] as const

export type OrderOrigin = (typeof orderOrigins)[number]

const progression = ['startedAt', 'readyAt', 'deliveredAt'] as const

type Milestone = (typeof progression)[number] | 'cancelledAt'

const milestoneNames: readonly Milestone[] = [...progression, 'cancelledAt']

type Milestones = Partial<Record<Milestone, number>>

const progressByStatus: Record<Exclude<OrderStatus, 'cancelled'>, number> = {
  received: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
}

type CreateOrderInput = {
  id: string
  businessDate: LocalDate
  ticket: TicketNumber
  origin: OrderOrigin
  customerName?: string | undefined
  items: readonly OrderItem[]
  now: Date
}

type OrderProps = Omit<CreateOrderInput, 'now'> & {
  status: OrderStatus
  createdAt: Date
  startedAt?: Date | undefined
  readyAt?: Date | undefined
  deliveredAt?: Date | undefined
  cancelledAt?: Date | undefined
}

export class Order extends AggregateRoot<OrderEvent> {
  readonly origin: OrderOrigin
  readonly customerName: string | undefined
  readonly #items: readonly OrderItem[]
  readonly #createdAt: number
  #status: OrderStatus
  #milestones: Milestones

  private constructor(
    readonly id: string,
    readonly businessDate: LocalDate,
    readonly ticket: TicketNumber,
    origin: string,
    customerName: string | undefined,
    items: readonly OrderItem[],
    status: string,
    createdAt: Date,
    milestones: Partial<Record<Milestone, Date | undefined>>,
  ) {
    super()

    if (!isOrderOrigin(origin)) {
      throw new DomainError('order.invalid_origin', `Invalid order origin: ${origin}`)
    }

    if (!isOrderStatus(status)) {
      throw new DomainError('order.invalid_status', `Invalid order status: ${status}`)
    }

    if (items.length === 0) {
      throw new DomainError('order.empty', 'An order needs at least one item')
    }

    this.origin = origin
    this.customerName = optionalText(
      customerName,
      CUSTOMER_NAME_MAX_LENGTH,
      'order.invalid_customer_name',
    )
    this.#items = [...items]
    this.#status = status
    this.#createdAt = toTimestamp(createdAt)
    this.#milestones = {}

    if (!businessDate.equals(LocalDate.fromInstant(createdAt))) {
      throw new DomainError(
        'order.business_date_mismatch',
        'Business date must match the creation date',
      )
    }

    for (const milestone of milestoneNames) {
      const at = milestones[milestone]
      if (at !== undefined) this.#milestones[milestone] = toTimestamp(at)
    }

    this.total()
  }

  static create(input: CreateOrderInput): Order {
    const order = new Order(
      input.id,
      input.businessDate,
      input.ticket,
      input.origin,
      input.customerName,
      input.items,
      'received',
      input.now,
      {},
    )
    order.record({ type: 'order.created', ...order.snapshot(order.#createdAt) })

    return order
  }

  static restore(props: OrderProps): Order {
    const order = new Order(
      props.id,
      props.businessDate,
      props.ticket,
      props.origin,
      props.customerName,
      props.items,
      props.status,
      props.createdAt,
      {
        startedAt: props.startedAt,
        readyAt: props.readyAt,
        deliveredAt: props.deliveredAt,
        cancelledAt: props.cancelledAt,
      },
    )
    order.assertConsistentHistory()

    return order
  }

  get items(): readonly OrderItem[] {
    return [...this.#items]
  }

  get status(): OrderStatus {
    return this.#status
  }

  get createdAt(): Date {
    return new Date(this.#createdAt)
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

  total(): Money {
    return this.#items.reduce((sum, item) => sum.add(item.subtotal()), Money.zero())
  }

  start(now: Date): void {
    this.transition('preparing', 'startedAt', now)
    this.record({ type: 'order.started', ...this.snapshot(toTimestamp(now)) })
  }

  markReady(now: Date): void {
    this.transition('ready', 'readyAt', now)
    this.record({ type: 'order.ready', ...this.snapshot(toTimestamp(now)) })
  }

  deliver(now: Date): void {
    this.transition('delivered', 'deliveredAt', now)
    this.record({ type: 'order.delivered', ...this.snapshot(toTimestamp(now)) })
  }

  cancel(now: Date): void {
    this.transition('cancelled', 'cancelledAt', now)
    this.record({ type: 'order.cancelled', ...this.snapshot(toTimestamp(now)) })
  }

  private transition(to: OrderStatus, milestone: Milestone, now: Date): void {
    if (!canTransition(this.#status, to)) {
      throw new DomainError(
        'order.invalid_transition',
        `Cannot change order from ${this.#status} to ${to}`,
      )
    }

    const at = toTimestamp(now)

    if (at < this.lastChangeAt()) {
      throw new DomainError('order.time_went_backwards', 'Order changes must move forward in time')
    }

    this.#milestones[milestone] = at
    this.#status = to
  }

  private lastChangeAt(): number {
    return Math.max(this.#createdAt, ...Object.values(this.#milestones))
  }

  private assertConsistentHistory(): void {
    const reached = progression.filter((milestone) => this.#milestones[milestone] !== undefined)
    const isPrefix = reached.every((milestone, index) => progression[index] === milestone)
    const cancelled = this.#milestones.cancelledAt !== undefined
    const matchesStatus =
      this.#status === 'cancelled'
        ? cancelled && this.#milestones.deliveredAt === undefined
        : !cancelled && reached.length === progressByStatus[this.#status]

    const sequence: Milestone[] = cancelled ? [...reached, 'cancelledAt'] : reached
    let previous = this.#createdAt
    const chronological = sequence.every((milestone) => {
      const at = this.#milestones[milestone] ?? previous
      const ordered = at >= previous
      previous = at
      return ordered
    })

    if (!isPrefix || !matchesStatus || !chronological) {
      throw new DomainError(
        'order.inconsistent_state',
        `Order ${this.id} has timestamps inconsistent with status ${this.#status}`,
      )
    }
  }

  private milestone(name: Milestone): Date | undefined {
    const at = this.#milestones[name]

    return at === undefined ? undefined : new Date(at)
  }

  private snapshot(at: number) {
    return {
      aggregateId: this.id,
      occurredAt: new Date(at),
      businessDate: this.businessDate.toString(),
      ticket: this.ticket.value,
    }
  }
}

function isOrderOrigin(value: string): value is OrderOrigin {
  return orderOrigins.some((origin) => origin === value)
}
