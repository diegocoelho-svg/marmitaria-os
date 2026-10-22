import { AccessDeniedError } from '@/application/errors/access-denied.error'
import { SessionInvalidError } from '@/application/errors/session-invalid.error'
import type { AuthenticateUseCase } from '@/application/use-cases/auth/authenticate-use-case'
import type { SessionCookie } from '@/infrastructure/http/auth/session-cookie'
import type { RouteGuard } from '@/infrastructure/http/decorators/route-registry'

export function createSessionGuard(
  authenticate: AuthenticateUseCase,
  cookie: SessionCookie,
): RouteGuard {
  return async (request, reply, access) => {
    const token = cookie.read(request)

    if (token === undefined) {
      throw new SessionInvalidError()
    }

    const { user, renewedUntil } = await authenticate.execute({ token })

    if (renewedUntil !== null) {
      cookie.write(reply, token, renewedUntil)
    }

    if (access === 'admin' && user.role !== 'admin') {
      throw new AccessDeniedError()
    }

    request.user = user
  }
}
