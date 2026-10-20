import {
  changeOrderStatusBodySchema,
  createOrderBodySchema,
  idParamsSchema,
  listOrdersQuerySchema,
  orderSchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { ChangeOrderStatusUseCase } from '@/application/use-cases/orders/change-order-status-use-case'
import type { CreateOrderUseCase } from '@/application/use-cases/orders/create-order-use-case'
import type { GetOrderUseCase } from '@/application/use-cases/orders/get-order-use-case'
import type { ListOrdersUseCase } from '@/application/use-cases/orders/list-orders-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = {
  querystring: listOrdersQuerySchema,
  response: { 200: z.array(orderSchema) },
}
const getSchema = { params: idParamsSchema, response: { 200: orderSchema } }
const createSchema = { body: createOrderBodySchema, response: { 201: orderSchema } }
const changeStatusSchema = {
  params: idParamsSchema,
  body: changeOrderStatusBodySchema,
  response: { 200: orderSchema },
}

@Controller('/orders')
export class OrdersController {
  constructor(
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly createOrder: CreateOrderUseCase,
    private readonly changeOrderStatus: ChangeOrderStatusUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list(request: RouteRequest<typeof listSchema>) {
    return this.listOrders.execute(request.query)
  }

  @Route('GET', '/:id', getSchema)
  async get(request: RouteRequest<typeof getSchema>) {
    return this.getOrder.execute(request.params)
  }

  @Route('POST', '/', createSchema)
  async create(request: RouteRequest<typeof createSchema>, reply: RouteReply<typeof createSchema>) {
    reply.status(201)

    return this.createOrder.execute(request.body)
  }

  @Route('PATCH', '/:id/status', changeStatusSchema)
  async changeStatus(request: RouteRequest<typeof changeStatusSchema>) {
    return this.changeOrderStatus.execute({ ...request.body, id: request.params.id })
  }
}
