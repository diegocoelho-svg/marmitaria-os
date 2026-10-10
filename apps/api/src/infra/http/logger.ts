import type { FastifyServerOptions } from 'fastify'

export type LoggerConfig = {
  environment: 'development' | 'test' | 'production'
  level: string
}

export function buildLoggerOptions(
  config: LoggerConfig,
): NonNullable<FastifyServerOptions['logger']> {
  if (config.environment === 'test') return false

  return {
    level: config.level,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    ...(config.environment === 'development' && {
      transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } },
    }),
  }
}
