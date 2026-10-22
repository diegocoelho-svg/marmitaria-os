import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { SessionEntity } from '@/domain/entities/session-entity'
import { UserEntity } from '@/domain/entities/user-entity'
import { PgSessionRepository } from '@/infrastructure/database/postgresql/pg-session-repository'
import { PgUserRepository } from '@/infrastructure/database/postgresql/pg-user-repository'
import { users } from '@/infrastructure/database/postgresql/schema'
import { present } from '@test/integration/fixtures'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgSessionRepository', () => {
  const db = useTestDatabase()
  const repository = new PgSessionRepository(db)
  const now = new Date('2026-10-20T12:00:00Z')
  let userId: string

  beforeEach(async () => {
    const user = UserEntity.create({
      id: randomUUID(),
      username: 'maria',
      name: 'Maria',
      role: 'staff',
      passwordHash: 'scrypt$hash',
    })
    await new PgUserRepository(db).create(user)
    userId = user.id
  })

  const session = (id: string) => SessionEntity.start({ id, userId, now })

  it('round-trips, renews and deletes a session', async () => {
    const current = session('digest-1')
    await repository.create(current)

    expect(await repository.findById('digest-1')).toEqual(current)

    const previousExpiry = current.expiresAt
    current.renew(new Date('2026-10-25T09:00:00Z'))
    expect(await repository.renew(current, previousExpiry)).toBe(true)
    expect(await repository.renew(current, previousExpiry)).toBe(false)
    expect(present(await repository.findById('digest-1')).expiresAt).toEqual(
      new Date('2026-11-24T09:00:00Z'),
    )

    await repository.delete('digest-1')
    expect(await repository.findById('digest-1')).toBeNull()
  })

  it('drops the sessions of a removed user', async () => {
    await repository.create(session('digest-1'))
    await repository.create(session('digest-2'))

    await db.delete(users).where(eq(users.id, userId))

    expect(await repository.findById('digest-1')).toBeNull()
    expect(await repository.findById('digest-2')).toBeNull()
  })
})
