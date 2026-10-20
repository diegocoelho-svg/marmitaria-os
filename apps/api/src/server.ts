import { attachLifecycle } from '@/infrastructure/bootstrap/lifecycle'
import { env } from '@/infrastructure/config/env'
import { buildLoggerOptions } from '@/infrastructure/config/logger'
import { createContainer } from '@/infrastructure/container/container'
import { InMemoryEventBus } from '@/infrastructure/events/in-memory-event-bus'
import { buildApp } from '@/infrastructure/http/app'
import { SystemClock } from '@/infrastructure/services/system-clock'
import { UuidGenerator } from '@/infrastructure/services/uuid-generator'

const eventBus = new InMemoryEventBus(({ error, event }) => {
  app.log.error({ err: error, event: event.type }, 'Event handler failed')
})

const container = createContainer({
  databaseUrl: env.DATABASE_URL,
  services: { clock: new SystemClock(), ids: new UuidGenerator(), eventBus },
})

const app = buildApp({
  logger: buildLoggerOptions({ environment: env.NODE_ENV, level: env.LOG_LEVEL }),
  controllers: container.controllers,
})

container.database.pool.on('error', (error) => {
  app.log.error({ err: error }, 'PostgreSQL idle connection failed')
})

attachLifecycle(app, container)

process.once('SIGINT', () => app.close())
process.once('SIGTERM', () => app.close())

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (error) {
  app.log.error(error)
  await app.close()
  process.exit(1)
}
