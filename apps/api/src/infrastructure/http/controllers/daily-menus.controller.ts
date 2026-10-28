import {
  applyMenuBodySchema,
  dailyMenuParamsSchema,
  dailyMenuSchema,
  listDailyMenusQuerySchema,
  setDailyMenuDishesBodySchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { ApplyMenuUseCase } from '@/application/use-cases/daily-menus/apply-menu-use-case'
import type { GetDailyMenuUseCase } from '@/application/use-cases/daily-menus/get-daily-menu-use-case'
import type { GetTodayDailyMenuUseCase } from '@/application/use-cases/daily-menus/get-today-daily-menu-use-case'
import type { ListDailyMenusUseCase } from '@/application/use-cases/daily-menus/list-daily-menus-use-case'
import type { SetDailyMenuDishesUseCase } from '@/application/use-cases/daily-menus/set-daily-menu-dishes-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = {
  querystring: listDailyMenusQuerySchema,
  response: { 200: z.array(dailyMenuSchema) },
}
const todaySchema = { response: { 200: dailyMenuSchema } }
const getSchema = { params: dailyMenuParamsSchema, response: { 200: dailyMenuSchema } }
const applyMenuSchema = {
  params: dailyMenuParamsSchema,
  body: applyMenuBodySchema,
  response: { 200: dailyMenuSchema },
}
const setDishesSchema = {
  params: dailyMenuParamsSchema,
  body: setDailyMenuDishesBodySchema,
  response: { 200: dailyMenuSchema },
}

@Controller('/daily-menus')
export class DailyMenusController {
  constructor(
    private readonly listDailyMenus: ListDailyMenusUseCase,
    private readonly getTodayDailyMenu: GetTodayDailyMenuUseCase,
    private readonly getDailyMenu: GetDailyMenuUseCase,
    private readonly applyMenu: ApplyMenuUseCase,
    private readonly setDailyMenuDishes: SetDailyMenuDishesUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list(request: RouteRequest<typeof listSchema>) {
    return this.listDailyMenus.execute(request.query)
  }

  @Route('GET', '/today', todaySchema)
  async today() {
    return this.getTodayDailyMenu.execute()
  }

  @Route('GET', '/:date', getSchema)
  async get(request: RouteRequest<typeof getSchema>) {
    return this.getDailyMenu.execute(request.params)
  }

  @Route('PUT', '/:date', applyMenuSchema, { access: 'admin' })
  async apply(request: RouteRequest<typeof applyMenuSchema>) {
    return this.applyMenu.execute({ ...request.body, date: request.params.date })
  }

  @Route('PUT', '/:date/dishes', setDishesSchema, { access: 'admin' })
  async setDishes(request: RouteRequest<typeof setDishesSchema>) {
    return this.setDailyMenuDishes.execute({ ...request.body, date: request.params.date })
  }
}
