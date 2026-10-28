import { afterAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AccessDeniedError } from '@/application/errors/access-denied.error'
import { SessionInvalidError } from '@/application/errors/session-invalid.error'
import { buildApp } from '@/infrastructure/http/app'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'
import type { RouteGuard } from '@/infrastructure/http/decorators/route-registry'

const greetSchema = {
  params: z.object({ name: z.string().min(2) }),
  querystring: z.object({ times: z.coerce.number().int().positive().default(1) }),
  response: { 200: z.object({ greeting: z.string() }) },
}

const echoSchema = {
  body: z.object({ value: z.number() }),
  response: { 201: z.object({ value: z.number() }) },
}

const purgeSchema = {}

@Controller('/greetings')
class GreetingsController {
  constructor(private readonly prefix: string) {}

  @Route('GET', '/:name', greetSchema, { access: 'public' })
  async greet(request: RouteRequest<typeof greetSchema>) {
    const greeting = `${this.prefix} ${request.params.name}`.repeat(request.query.times)

    return { greeting, secret: 'not serialized' }
  }

  @Route('POST', '/', echoSchema)
  async echo(request: RouteRequest<typeof echoSchema>, reply: RouteReply<typeof echoSchema>) {
    reply.status(201)

    return request.body
  }

  @Route('DELETE', '/', purgeSchema, { access: 'admin' })
  async purge(_request: RouteRequest<typeof purgeSchema>, reply: RouteReply<typeof purgeSchema>) {
    return reply.status(204).send()
  }
}

class UndecoratedController {}

const guard: RouteGuard = async (request, _reply, access) => {
  const role = request.headers['x-role']

  if (role === undefined) {
    throw new SessionInvalidError()
  }

  if (access === 'admin' && role !== 'admin') {
    throw new AccessDeniedError()
  }
}

describe('registerControllers', () => {
  const app = buildApp({ controllers: [new GreetingsController('Olá')], guard })

  afterAll(() => app.close())

  it('routes requests to the controller method under its prefix', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/greetings/Ana?times=2' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ greeting: 'Olá AnaOlá Ana' })
  })

  it('maps the root path to the controller prefix and honors the reply status', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/greetings',
      headers: { 'x-role': 'staff' },
      payload: { value: 42 },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ value: 42 })
  })

  it('rejects requests that do not match the schema', async () => {
    const params = await app.inject({ method: 'GET', url: '/api/greetings/A' })
    const body = await app.inject({
      method: 'POST',
      url: '/api/greetings',
      headers: { 'x-role': 'staff' },
      payload: { value: 'x' },
    })

    expect(params.statusCode).toBe(400)
    expect(params.json()).toMatchObject({ code: 'request.invalid' })
    expect(body.statusCode).toBe(400)
  })

  it('guards every route that does not opt out', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/greetings',
      payload: { value: 42 },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'auth.unauthenticated' })
  })

  it('passes the required access to the guard', async () => {
    const staff = await app.inject({
      method: 'DELETE',
      url: '/api/greetings',
      headers: { 'x-role': 'staff' },
    })
    const admin = await app.inject({
      method: 'DELETE',
      url: '/api/greetings',
      headers: { 'x-role': 'admin' },
    })

    expect(staff.statusCode).toBe(403)
    expect(staff.json()).toMatchObject({ code: 'auth.forbidden' })
    expect(admin.statusCode).toBe(204)
  })

  it('refuses writes sent from another site', async () => {
    const send = (origin: string) =>
      app.inject({
        method: 'POST',
        url: '/api/greetings',
        headers: { 'x-role': 'staff', host: 'marmitaria.local', origin },
        payload: { value: 42 },
      })

    const foreign = await send('https://evil.example')
    const opaque = await send('null')
    const own = await send('https://marmitaria.local')

    expect(foreign.statusCode).toBe(403)
    expect(foreign.json()).toMatchObject({ code: 'request.cross_site' })
    expect(opaque.statusCode).toBe(403)
    expect(own.statusCode).toBe(201)
  })

  it('compares the scheme too when the public origin is configured', async () => {
    const published = buildApp({
      controllers: [new GreetingsController('Olá')],
      guard,
      publicOrigin: 'https://marmitaria.local',
    })
    const send = (origin: string) =>
      published.inject({
        method: 'POST',
        url: '/api/greetings',
        headers: { 'x-role': 'staff', host: 'api:3333', origin },
        payload: { value: 42 },
      })

    const plain = await send('http://marmitaria.local')
    const secure = await send('https://marmitaria.local')
    await published.close()

    expect(plain.statusCode).toBe(403)
    expect(secure.statusCode).toBe(201)
  })

  it('answers unknown routes with a structured 404', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/unknown' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      code: 'route.not_found',
      message: 'Route GET /api/unknown was not found',
    })
  })

  it('refuses a controller without @Controller', async () => {
    const broken = buildApp({ controllers: [new UndecoratedController()], guard })

    await expect(broken.ready()).rejects.toThrow(
      'UndecoratedController is not decorated with @Controller',
    )
  })
})
