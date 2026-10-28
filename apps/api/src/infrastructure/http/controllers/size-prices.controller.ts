import {
  changeSizePriceBodySchema,
  sizePriceParamsSchema,
  sizePriceSchema,
} from '@marmitaria/contracts'
import { z } from 'zod'
import type { ChangeSizePriceUseCase } from '@/application/use-cases/size-prices/change-size-price-use-case'
import type { ListSizePricesUseCase } from '@/application/use-cases/size-prices/list-size-prices-use-case'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteRequest } from '@/infrastructure/http/decorators/route'

const listSchema = { response: { 200: z.array(sizePriceSchema) } }
const changeSchema = {
  params: sizePriceParamsSchema,
  body: changeSizePriceBodySchema,
  response: { 200: sizePriceSchema },
}

@Controller('/size-prices')
export class SizePricesController {
  constructor(
    private readonly listSizePrices: ListSizePricesUseCase,
    private readonly changeSizePrice: ChangeSizePriceUseCase,
  ) {}

  @Route('GET', '/', listSchema)
  async list() {
    return this.listSizePrices.execute()
  }

  @Route('PUT', '/:size', changeSchema, { access: 'admin' })
  async change(request: RouteRequest<typeof changeSchema>) {
    return this.changeSizePrice.execute({ ...request.body, size: request.params.size })
  }
}
