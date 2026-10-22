import type { FastifyRequest } from 'fastify'
import { CrossSiteRequestError } from '@/infrastructure/http/errors/cross-site-request.error'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function rejectCrossSiteWrites(publicOrigin: string | undefined) {
  const isOwnOrigin = (origin: string, request: FastifyRequest) => {
    if (!URL.canParse(origin)) {
      return false
    }

    const { host, origin: normalized } = new URL(origin)

    return publicOrigin === undefined ? host === request.host : normalized === publicOrigin
  }

  return async (request: FastifyRequest): Promise<void> => {
    const { origin } = request.headers

    if (SAFE_METHODS.has(request.method) || origin === undefined) {
      return
    }

    if (!isOwnOrigin(origin, request)) {
      throw new CrossSiteRequestError()
    }
  }
}
