import type {
  ContextConfigDefault,
  FastifyReply,
  FastifyRequest,
  HTTPMethods,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
  RouteHandlerMethod,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { defineRoute } from '@/infrastructure/http/decorators/route-registry'

export type RouteSchema = {
  params?: z.ZodType
  querystring?: z.ZodType
  body?: z.ZodType
  response?: Record<number, z.ZodType>
}

export type RouteRequest<S extends RouteSchema> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression,
  S,
  ZodTypeProvider
>

export type RouteReply<S extends RouteSchema> = FastifyReply<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  ContextConfigDefault,
  S,
  ZodTypeProvider
>

type FastifyRouteHandler<S extends RouteSchema> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  RouteGenericInterface,
  ContextConfigDefault,
  S,
  ZodTypeProvider
>

export type RouteHandler<S extends RouteSchema> = (
  request: RouteRequest<S>,
  reply: RouteReply<S>,
) => ReturnType<FastifyRouteHandler<S>>

export function Route<S extends RouteSchema>(method: HTTPMethods, path: string, schema: S) {
  return (
    prototype: object,
    name: string,
    descriptor: { value?: RouteHandler<S> | undefined },
  ): void => {
    const handler = descriptor.value

    if (!handler) {
      throw new Error(`@Route on ${name} must decorate a method`)
    }

    defineRoute(prototype, (app, controller, prefix) => {
      app.route({
        method,
        url: path === '/' ? prefix : `${prefix}${path}`,
        schema,
        handler: (request, reply) => handler.call(controller, request, reply),
      })
    })
  }
}
