import { OrderOutput } from '@/application/dtos/orders/order-output'
import { OrderNotFoundError } from '@/application/errors/order-not-found.error'
import type { OrderRepository } from '@/domain/repositories/order-repository'

export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: { id: string }): Promise<OrderOutput> {
    const order = await this.orders.findById(input.id)

    if (!order) {
      throw new OrderNotFoundError(input.id)
    }

    return OrderOutput.from(order)
  }
}
