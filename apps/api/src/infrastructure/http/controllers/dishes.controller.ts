import {
  createDishBodySchema,
  dishSchema,
  idParamsSchema,
  updateDishBodySchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { CreateDishUseCase } from '@/application/use-cases/dishes/create-dish-use-case'
import type { GetDishUseCase } from '@/application/use-cases/dishes/get-dish-use-case'
import type { ListDishesUseCase } from '@/application/use-cases/dishes/list-dishes-use-case'
import type { UpdateDishUseCase } from '@/application/use-cases/dishes/update-dish-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = { response: { 200: z.array(dishSchema) } }
const getSchema = { params: idParamsSchema, response: { 200: dishSchema } }
const createSchema = { body: createDishBodySchema, response: { 201: dishSchema } }
const updateSchema = {
  params: idParamsSchema,
  body: updateDishBodySchema,
  response: { 200: dishSchema },
}

@Controller('/dishes')
export class DishesController {
  constructor(
    private readonly listDishes: ListDishesUseCase,
    private readonly getDish: GetDishUseCase,
    private readonly createDish: CreateDishUseCase,
    private readonly updateDish: UpdateDishUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list() {
    return this.listDishes.execute()
  }

  @Route('GET', '/:id', getSchema)
  async get(request: RouteRequest<typeof getSchema>) {
    return this.getDish.execute(request.params)
  }

  @Route('POST', '/', createSchema)
  async create(request: RouteRequest<typeof createSchema>, reply: RouteReply<typeof createSchema>) {
    reply.status(201)

    return this.createDish.execute(request.body)
  }

  @Route('PATCH', '/:id', updateSchema)
  async update(request: RouteRequest<typeof updateSchema>) {
    return this.updateDish.execute({ ...request.body, id: request.params.id })
  }
}
