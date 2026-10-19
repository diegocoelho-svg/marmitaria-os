import { cleanup } from '@/infrastructure/bootstrap/lifecycle'
import { env } from '@/infrastructure/config/env'
import { buildLoggerOptions } from '@/infrastructure/config/logger'
import { createContainer } from '@/infrastructure/container/container'
import { buildApp } from '@/infrastructure/http/app'

const container = createContainer(env.DATABASE_URL)

const app = buildApp({
  logger: buildLoggerOptions({ environment: env.NODE_ENV, level: env.LOG_LEVEL }),
})

container.database.pool.on('error', (error) => {
  app.log.error({ err: error }, 'PostgreSQL idle connection failed')
})

app.addHook('onClose', () => cleanup(container))

process.once('SIGINT', () => app.close())
process.once('SIGTERM', () => app.close())

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (error) {
  app.log.error(error)
  await app.close()
  process.exit(1)
}
