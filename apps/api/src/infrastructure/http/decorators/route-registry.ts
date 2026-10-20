import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export type ZodFastifyInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>

type RouteRegistration = (app: ZodFastifyInstance, controller: object, prefix: string) => void

const prefixes = new WeakMap<object, string>()
const routes = new WeakMap<object, RouteRegistration[]>()

export function defineController(prototype: object, prefix: string): void {
  prefixes.set(prototype, prefix)
}

export function defineRoute(prototype: object, registration: RouteRegistration): void {
  routes.set(prototype, [...(routes.get(prototype) ?? []), registration])
}

export function registerControllers(app: ZodFastifyInstance, controllers: readonly object[]): void {
  for (const controller of controllers) {
    const prototype: object = Object.getPrototypeOf(controller)
    const prefix = prefixes.get(prototype)

    if (prefix === undefined) {
      throw new Error(`${controller.constructor.name} is not decorated with @Controller`)
    }

    for (const register of routes.get(prototype) ?? []) {
      register(app, controller, prefix)
    }
  }
}
