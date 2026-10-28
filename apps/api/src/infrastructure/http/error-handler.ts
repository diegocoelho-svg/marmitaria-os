import type { ErrorResponse } from '@marmitaria/contracts'
import type { FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import {
  ApplicationError,
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from '@/application/errors/application-error'
import { DomainError } from '@/domain/errors/domain-error'
import { StaleWriteError } from '@/domain/errors/stale-write.error'

type HttpError = {
  statusCode: number
  body: ErrorResponse
}

const INTERNAL_ERROR: HttpError = {
  statusCode: 500,
  body: { code: 'internal_error', message: 'Internal server error' },
}

export function setupErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler<Error>((error, request, reply) => {
    const { statusCode, body } = toHttpError(error)

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Request failed')
    }

    return reply.status(statusCode).send(body)
  })

  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      code: 'route.not_found',
      message: `Route ${request.method} ${request.url} was not found`,
    }),
  )
}

export function toHttpError(error: Error): HttpError {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return { statusCode: 400, body: { code: 'request.invalid', message: error.message } }
  }

  if (error instanceof UnauthenticatedError) {
    return describe(401, error)
  }

  if (error instanceof ForbiddenError) {
    return describe(403, error)
  }

  if (error instanceof NotFoundError) {
    return describe(404, error)
  }

  if (error instanceof ConflictError || error instanceof StaleWriteError) {
    return describe(409, error)
  }

  if (error instanceof BusinessRuleError || error instanceof DomainError) {
    return describe(422, error)
  }

  const statusCode = 'statusCode' in error ? error.statusCode : undefined

  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    return { statusCode, body: { code: 'request.invalid', message: error.message } }
  }

  return INTERNAL_ERROR
}

function describe(statusCode: number, error: ApplicationError | DomainError): HttpError {
  return { statusCode, body: { code: error.code, message: error.message } }
}
