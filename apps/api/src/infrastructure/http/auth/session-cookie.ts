import type { SerializeOptions } from '@fastify/cookie'
import type { FastifyReply, FastifyRequest } from 'fastify'

export const SESSION_COOKIE = 'marmitaria_session'

export type SessionCookieOptions = {
  secure: boolean
}

export class SessionCookie {
  constructor(private readonly options: SessionCookieOptions) {}

  read(request: FastifyRequest): string | undefined {
    return request.cookies[SESSION_COOKIE]
  }

  write(reply: FastifyReply, token: string, expiresAt: string): void {
    this.set(reply, token, new Date(expiresAt))
  }

  clear(reply: FastifyReply): void {
    this.set(reply, '', new Date(0))
  }

  private set(reply: FastifyReply, value: string, expires: Date): void {
    reply.header(
      'set-cookie',
      reply.server.serializeCookie(SESSION_COOKIE, value, { ...this.attributes(), expires }),
    )
  }

  private attributes(): SerializeOptions {
    return { path: '/api', httpOnly: true, sameSite: 'strict', secure: this.options.secure }
  }
}
