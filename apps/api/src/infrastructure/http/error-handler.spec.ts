import { describe, expect, it } from 'vitest'
import { AccessDeniedError } from '@/application/errors/access-denied.error'
import { DishNotFoundError } from '@/application/errors/dish-not-found.error'
import { DishUnavailableError } from '@/application/errors/dish-unavailable.error'
import { InvalidCredentialsError } from '@/application/errors/invalid-credentials.error'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import { MenuEmptyError } from '@/domain/errors/menu-empty.error'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import { toHttpError } from '@/infrastructure/http/error-handler'

describe('toHttpError', () => {
  it.each([
    [new InvalidCredentialsError(), 401, 'auth.invalid_credentials'],
    [new AccessDeniedError(), 403, 'auth.forbidden'],
    [new DishNotFoundError('frango'), 404, 'dish.not_found'],
    [new MenuNameTakenError('Cardápio A'), 409, 'menu.name_taken'],
    [new StaleWriteError('Order', 'order-1'), 409, 'stale_write'],
    [new DishUnavailableError(['lasanha']), 422, 'dish.unavailable'],
    [new MenuEmptyError(), 422, 'menu.empty'],
  ])('maps %s to %i', (error, statusCode, code) => {
    expect(toHttpError(error)).toEqual({
      statusCode,
      body: { code, message: error.message },
    })
  })

  it('keeps client errors raised by Fastify', () => {
    const error = Object.assign(new Error('Body is not valid JSON'), { statusCode: 400 })

    expect(toHttpError(error)).toEqual({
      statusCode: 400,
      body: { code: 'request.invalid', message: 'Body is not valid JSON' },
    })
  })

  it('hides unexpected errors behind a generic 500', () => {
    expect(toHttpError(new Error('connection refused'))).toEqual({
      statusCode: 500,
      body: { code: 'internal_error', message: 'Internal server error' },
    })
  })
})
