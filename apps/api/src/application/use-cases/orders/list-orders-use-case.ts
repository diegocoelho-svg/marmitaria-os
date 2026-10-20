import type { ListOrdersInput } from '@/application/dtos/orders/list-orders-input'
import { OrderOutput } from '@/application/dtos/orders/order-output'
import type { Clock } from '@/application/ports/clock'
import type { OrderRepository } from '@/domain/repositories/order-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class ListOrdersUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListOrdersInput): Promise<OrderOutput[]> {
    const businessDate = input.date
      ? LocalDateVO.parse(input.date)
      : LocalDateVO.fromInstant(this.clock.now())
    const orders = await this.orders.findByBusinessDate(businessDate, input.status)

    return orders.map((order) => OrderOutput.from(order))
  }
}
