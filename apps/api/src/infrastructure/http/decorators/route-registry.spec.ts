import { afterAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildApp } from '@/infrastructure/http/app'
import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'

const greetSchema = {
  params: z.object({ name: z.string().min(2) }),
  querystring: z.object({ times: z.coerce.number().int().positive().default(1) }),
  response: { 200: z.object({ greeting: z.string() }) },
}

const echoSchema = {
  body: z.object({ value: z.number() }),
  response: { 201: z.object({ value: z.number() }) },
}

@Controller('/greetings')
class GreetingsController {
  constructor(private readonly prefix: string) {}

  @Route('GET', '/:name', greetSchema)
  async greet(request: RouteRequest<typeof greetSchema>) {
    const greeting = `${this.prefix} ${request.params.name}`.repeat(request.query.times)

    return { greeting, secret: 'not serialized' }
  }

  @Route('POST', '/', echoSchema)
  async echo(request: RouteRequest<typeof echoSchema>, reply: RouteReply<typeof echoSchema>) {
    reply.status(201)

    return request.body
  }
}

class UndecoratedController {}

describe('registerControllers', () => {
  const app = buildApp({ controllers: [new GreetingsController('Olá')] })

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
      payload: { value: 'x' },
    })

    expect(params.statusCode).toBe(400)
    expect(params.json()).toMatchObject({ code: 'request.invalid' })
    expect(body.statusCode).toBe(400)
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
    const broken = buildApp({ controllers: [new UndecoratedController()] })

    await expect(broken.ready()).rejects.toThrow(
      'UndecoratedController is not decorated with @Controller',
    )
  })
})
