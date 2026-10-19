import {
  adjustmentSchema,
  createAdjustmentBodySchema,
  idParamsSchema,
  updateAdjustmentBodySchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { CreateAdjustmentUseCase } from '@/application/use-cases/adjustments/create-adjustment-use-case'
import type { ListAdjustmentsUseCase } from '@/application/use-cases/adjustments/list-adjustments-use-case'
import type { UpdateAdjustmentUseCase } from '@/application/use-cases/adjustments/update-adjustment-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = { response: { 200: z.array(adjustmentSchema) } }
const createSchema = { body: createAdjustmentBodySchema, response: { 201: adjustmentSchema } }
const updateSchema = {
  params: idParamsSchema,
  body: updateAdjustmentBodySchema,
  response: { 200: adjustmentSchema },
}

@Controller('/adjustments')
export class AdjustmentsController {
  constructor(
    private readonly listAdjustments: ListAdjustmentsUseCase,
    private readonly createAdjustment: CreateAdjustmentUseCase,
    private readonly updateAdjustment: UpdateAdjustmentUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list() {
    return this.listAdjustments.execute()
  }

  @Route('POST', '/', createSchema)
  async create(request: RouteRequest<typeof createSchema>, reply: RouteReply<typeof createSchema>) {
    reply.status(201)

    return this.createAdjustment.execute(request.body)
  }

  @Route('PATCH', '/:id', updateSchema)
  async update(request: RouteRequest<typeof updateSchema>) {
    return this.updateAdjustment.execute({ ...request.body, id: request.params.id })
  }
}
