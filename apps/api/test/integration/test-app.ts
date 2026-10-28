import { randomUUID } from 'node:crypto'
import type { InjectOptions } from 'fastify'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { SessionEntity } from '@/domain/entities/session-entity'
import { UserEntity } from '@/domain/entities/user-entity'
import { type UserRole, userRoles } from '@/domain/value-objects/user-role'
import { attachLifecycle } from '@/infrastructure/bootstrap/lifecycle'
import { createContainer } from '@/infrastructure/container/container'
import { InMemoryEventBus } from '@/infrastructure/events/in-memory-event-bus'
import { buildApp } from '@/infrastructure/http/app'
import { SESSION_COOKIE } from '@/infrastructure/http/auth/session-cookie'
import { RandomSessionTokens } from '@/infrastructure/services/random-session-tokens'
import { ScryptPasswordHasher } from '@/infrastructure/services/scrypt-password-hasher'
import { UuidGenerator } from '@/infrastructure/services/uuid-generator'
import { FakeClock } from '@test/fakes/fake-services'
import { testDatabaseUrl, useTestDatabase } from '@test/integration/test-database'

export const TEST_PASSWORD = 'senha-de-teste'

const SESSION_EXPIRY = new Date('2100-01-01T00:00:00Z')

export function useTestApp() {
  const db = useTestDatabase()
  const clock = new FakeClock()
  const passwords = new ScryptPasswordHasher()
  const tokens = new RandomSessionTokens()
  const eventBus = new InMemoryEventBus(({ error }) => {
    throw error
  })
  const container = createContainer({
    databaseUrl: testDatabaseUrl(),
    services: { clock, ids: new UuidGenerator(), eventBus, passwords, tokens },
    sessionCookie: { secure: true },
  })
  const app = buildApp({ controllers: container.controllers, guard: container.guard })
  attachLifecycle(app, container)

  const sessions = { admin: tokens.issue(), staff: tokens.issue() }
  let passwordHash = ''

  beforeAll(async () => {
    passwordHash = await passwords.hash(TEST_PASSWORD)
  })

  beforeEach(async () => {
    for (const role of userRoles) {
      const user = UserEntity.create({
        id: randomUUID(),
        username: role,
        name: `Usuário ${role}`,
        role,
        passwordHash,
      })
      await container.repositories.users.create(user)
      await container.repositories.sessions.create(
        SessionEntity.restore({
          id: sessions[role].id,
          userId: user.id,
          expiresAt: SESSION_EXPIRY,
        }),
      )
    }
  })

  afterAll(async () => {
    await app.close()
  })

  const sessionCookie = (role: UserRole) => `${SESSION_COOKIE}=${sessions[role].token}`

  const inject = (options: InjectOptions, role: UserRole = 'admin') =>
    app.inject({
      ...options,
      cookies: { [SESSION_COOKIE]: sessions[role].token, ...options.cookies },
    })

  return { app, db, clock, eventBus, inject, sessionCookie }
}
