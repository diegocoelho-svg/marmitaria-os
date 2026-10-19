import Fastify, { type FastifyServerOptions } from 'fastify'
import { healthRoutes } from '@/infrastructure/http/routes/health'

export function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify(options)

  app.register(healthRoutes, { prefix: '/api' })

  return app
}
