import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { UsernameTakenError } from '@/application/errors/username-taken.error'
import { UserEntity } from '@/domain/entities/user-entity'
import { PgUserRepository } from '@/infrastructure/database/postgresql/pg-user-repository'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgUserRepository', () => {
  const repository = new PgUserRepository(useTestDatabase())

  const user = (username: string) =>
    UserEntity.create({
      id: randomUUID(),
      username,
      name: 'Diego',
      role: 'admin',
      passwordHash: 'scrypt$hash',
    })

  it('round-trips a user found by id or username', async () => {
    const diego = user('diego')

    await repository.create(diego)

    expect(await repository.findById(diego.id)).toEqual(diego)
    expect(await repository.findByUsername('diego')).toEqual(diego)
    expect(await repository.findByUsername('maria')).toBeNull()
    expect(await repository.findById(randomUUID())).toBeNull()
  })

  it('turns a repeated username into a conflict', async () => {
    await repository.create(user('diego'))

    await expect(repository.create(user('Diego'))).rejects.toThrow(UsernameTakenError)
  })
})
