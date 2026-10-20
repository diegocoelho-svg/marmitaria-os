import type { ChangeOrderStatusInput } from '@/application/dtos/orders/change-order-status-input'
import { OrderOutput } from '@/application/dtos/orders/order-output'
import { OrderNotFoundError } from '@/application/errors/order-not-found.error'
import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import type { OrderEntity } from '@/domain/entities/order-entity'
import type { OrderRepository } from '@/domain/repositories/order-repository'

export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ChangeOrderStatusInput): Promise<OrderOutput> {
    const order = await this.orders.findById(input.id)

    if (!order) {
      throw new OrderNotFoundError(input.id)
    }

    const expectedStatus = order.status
    this.apply(order, input.status, this.clock.now())
    await this.orders.update(order, expectedStatus)
    await this.eventBus.publish(order.pullEvents())

    return OrderOutput.from(order)
  }

  private apply(order: OrderEntity, status: ChangeOrderStatusInput['status'], now: Date): void {
    switch (status) {
      case 'preparing':
        return order.start(now)
      case 'ready':
        return order.markReady(now)
      case 'delivered':
        return order.deliver(now)
      case 'cancelled':
        return order.cancel(now)
    }
  }
}
