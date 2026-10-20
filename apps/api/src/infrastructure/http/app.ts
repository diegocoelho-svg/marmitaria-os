import Fastify, { type FastifyServerOptions } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { registerControllers } from '@/infrastructure/http/decorators/route-registry'
import { setupErrorHandling } from '@/infrastructure/http/error-handler'

export type AppOptions = FastifyServerOptions & {
  controllers: readonly object[]
}

export function buildApp({ controllers, ...options }: AppOptions) {
  const app = Fastify(options).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  setupErrorHandling(app)

  app.register(
    async (api) => {
      registerControllers(api.withTypeProvider<ZodTypeProvider>(), controllers)
    },
    { prefix: '/api' },
  )

  return app
}
