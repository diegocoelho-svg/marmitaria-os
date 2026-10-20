import { defineController } from '@/infrastructure/http/decorators/route-registry'

export function Controller(prefix: string) {
  return (target: { prototype: object }): void => {
    defineController(target.prototype, prefix)
  }
}
