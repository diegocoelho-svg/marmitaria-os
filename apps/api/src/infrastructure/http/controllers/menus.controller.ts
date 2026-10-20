import {
  createMenuBodySchema,
  idParamsSchema,
  menuSchema,
  updateMenuBodySchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { ArchiveMenuUseCase } from '@/application/use-cases/menus/archive-menu-use-case'
import type { CreateMenuUseCase } from '@/application/use-cases/menus/create-menu-use-case'
import type { GetMenuUseCase } from '@/application/use-cases/menus/get-menu-use-case'
import type { ListMenusUseCase } from '@/application/use-cases/menus/list-menus-use-case'
import type { UpdateMenuUseCase } from '@/application/use-cases/menus/update-menu-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = { response: { 200: z.array(menuSchema) } }
const getSchema = { params: idParamsSchema, response: { 200: menuSchema } }
const createSchema = { body: createMenuBodySchema, response: { 201: menuSchema } }
const updateSchema = {
  params: idParamsSchema,
  body: updateMenuBodySchema,
  response: { 200: menuSchema },
}
const archiveSchema = { params: idParamsSchema, response: { 200: menuSchema } }

@Controller('/menus')
export class MenusController {
  constructor(
    private readonly listMenus: ListMenusUseCase,
    private readonly getMenu: GetMenuUseCase,
    private readonly createMenu: CreateMenuUseCase,
    private readonly updateMenu: UpdateMenuUseCase,
    private readonly archiveMenu: ArchiveMenuUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list() {
    return this.listMenus.execute()
  }

  @Route('GET', '/:id', getSchema)
  async get(request: RouteRequest<typeof getSchema>) {
    return this.getMenu.execute(request.params)
  }

  @Route('POST', '/', createSchema)
  async create(request: RouteRequest<typeof createSchema>, reply: RouteReply<typeof createSchema>) {
    reply.status(201)

    return this.createMenu.execute(request.body)
  }

  @Route('PATCH', '/:id', updateSchema)
  async update(request: RouteRequest<typeof updateSchema>) {
    return this.updateMenu.execute({ ...request.body, id: request.params.id })
  }

  @Route('POST', '/:id/archive', archiveSchema)
  async archive(request: RouteRequest<typeof archiveSchema>) {
    return this.archiveMenu.execute(request.params)
  }
}
