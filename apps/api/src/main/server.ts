import { buildApp } from '../infra/http/app'
import { buildLoggerOptions } from '../infra/http/logger'
import { env } from './env'

const app = buildApp({ logger: buildLoggerOptions(env) })

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
