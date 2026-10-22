import fastifyCookie from '@fastify/cookie'
import Fastify, { type FastifyServerOptions } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { UserOutput } from '@/application/dtos/users/user-output'
import { rejectCrossSiteWrites } from '@/infrastructure/http/auth/reject-cross-site-writes'
import {
  registerControllers,
  type RouteGuard,
} from '@/infrastructure/http/decorators/route-registry'
import { setupErrorHandling } from '@/infrastructure/http/error-handler'

declare module 'fastify' {
  interface FastifyRequest {
    user: UserOutput | null
  }
}

export type AppOptions = FastifyServerOptions & {
  controllers: readonly object[]
  guard: RouteGuard
  publicOrigin?: string | undefined
}

export function buildApp({ controllers, guard, publicOrigin, ...options }: AppOptions) {
  const app = Fastify(options).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  setupErrorHandling(app)
  app.register(fastifyCookie)
  app.decorateRequest('user', null)
  app.addHook('onRequest', rejectCrossSiteWrites(publicOrigin))

  app.register(
    async (api) => {
      registerControllers(api.withTypeProvider<ZodTypeProvider>(), controllers, guard)
    },
    { prefix: '/api' },
  )

  return app
}

export type App = ReturnType<typeof buildApp>
