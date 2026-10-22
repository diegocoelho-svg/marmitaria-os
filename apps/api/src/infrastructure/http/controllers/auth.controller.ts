import { loginBodySchema, userSchema } from '@marmitaria/contracts'
import { SessionInvalidError } from '@/application/errors/session-invalid.error'
import type { LoginUseCase } from '@/application/use-cases/auth/login-use-case'
import type { LogoutUseCase } from '@/application/use-cases/auth/logout-use-case'
import type { SessionCookie } from '@/infrastructure/http/auth/session-cookie'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const loginSchema = { body: loginBodySchema, response: { 200: userSchema } }
const logoutSchema = {}
const meSchema = { response: { 200: userSchema } }

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly loginUser: LoginUseCase,
    private readonly logoutUser: LogoutUseCase,
    private readonly cookie: SessionCookie,
  ) {}

  @Route('POST', '/login', loginSchema, { access: 'public' })
  async login(request: RouteRequest<typeof loginSchema>, reply: RouteReply<typeof loginSchema>) {
    const { token, expiresAt, user } = await this.loginUser.execute(request.body)
    this.cookie.write(reply, token, expiresAt)

    return user
  }

  @Route('POST', '/logout', logoutSchema, { access: 'public' })
  async logout(request: RouteRequest<typeof logoutSchema>, reply: RouteReply<typeof logoutSchema>) {
    const token = this.cookie.read(request)

    if (token !== undefined) {
      await this.logoutUser.execute({ token })
    }

    this.cookie.clear(reply)

    return reply.status(204).send()
  }

  @Route('GET', '/me', meSchema)
  async me(request: RouteRequest<typeof meSchema>) {
    if (!request.user) {
      throw new SessionInvalidError()
    }

    return request.user
  }
}
