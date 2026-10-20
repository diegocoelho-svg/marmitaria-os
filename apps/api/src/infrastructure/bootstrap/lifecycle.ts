import type { Container } from '@/infrastructure/container/container'
import type { App } from '@/infrastructure/http/app'

export function attachLifecycle(app: App, container: Container): void {
  app.addHook('preClose', async () => {
    container.eventStream.close()
  })
  app.addHook('onClose', async () => {
    await container.database.pool.end()
  })
}
