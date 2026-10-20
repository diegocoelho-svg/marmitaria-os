import type { CreateOrderInput } from '@/application/dtos/orders/create-order-input'
import { OrderOutput } from '@/application/dtos/orders/order-output'
import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { buildOrderItems } from '@/application/services/build-order-items'
import { OrderEntity } from '@/domain/entities/order-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class CreateOrderUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderOutput> {
    const now = this.clock.now()
    const businessDate = LocalDateVO.fromInstant(now)

    const order = await this.unitOfWork.run(async (repositories) => {
      const items = await buildOrderItems(repositories, input.items, businessDate, now)
      const created = OrderEntity.create({
        id: this.ids.next(),
        businessDate,
        ticket: await repositories.tickets.next(businessDate),
        origin: input.origin,
        customerName: input.customerName,
        items,
        now,
      })
      await repositories.orders.create(created)

      return created
    })

    await this.eventBus.publish(order.pullEvents())

    return OrderOutput.from(order)
  }
}
