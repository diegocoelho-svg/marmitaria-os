import { env } from '@/infrastructure/config/env'
import { buildLoggerOptions } from '@/infrastructure/config/logger'
import { buildApp } from '@/infrastructure/http/app'

const app = buildApp({
  logger: buildLoggerOptions({ environment: env.NODE_ENV, level: env.LOG_LEVEL }),
})

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
