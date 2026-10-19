import { afterAll } from 'vitest'
import { cleanup } from '@/infrastructure/bootstrap/lifecycle'
import { createContainer } from '@/infrastructure/container/container'
import { InMemoryEventBus } from '@/infrastructure/events/in-memory-event-bus'
import { buildApp } from '@/infrastructure/http/app'
import { UuidGenerator } from '@/infrastructure/services/uuid-generator'
import { FakeClock } from '@test/fakes/fake-services'
import { testDatabaseUrl, useTestDatabase } from '@test/integration/test-database'

export function useTestApp() {
  const db = useTestDatabase()
  const clock = new FakeClock()
  const eventBus = new InMemoryEventBus(({ error }) => {
    throw error
  })
  const container = createContainer({
    databaseUrl: testDatabaseUrl(),
    services: { clock, ids: new UuidGenerator(), eventBus },
  })
  const app = buildApp({ controllers: container.controllers })

  afterAll(async () => {
    await app.close()
    await cleanup(container)
  })

  return { app, db, clock, eventBus }
}
