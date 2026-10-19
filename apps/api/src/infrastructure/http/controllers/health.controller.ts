import { healthResponseSchema } from '@marmitaria/contracts'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route } from '@/infrastructure/http/decorators/route'

const healthSchema = { response: { 200: healthResponseSchema } }

@Controller('/health')
export class HealthController {
  @Route('GET', '/', healthSchema)
  async check() {
    return { status: 'ok' as const }
  }
}
