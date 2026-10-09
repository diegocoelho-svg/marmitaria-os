import type { HealthResponse } from '@marmitaria/contracts'
import type { FastifyInstance } from 'fastify'

export async function healthRoutes(app: FastifyInstance) {
  app.get<{ Reply: HealthResponse }>('/health', async () => ({ status: 'ok' }))
}
