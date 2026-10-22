import { beforeEach, describe, expect, it } from 'vitest'
import { InvalidCredentialsError } from '@/application/errors/invalid-credentials.error'
import { LoginUseCase } from '@/application/use-cases/auth/login-use-case'
import { UserEntity } from '@/domain/entities/user-entity'
import { FakeSessionRepository, FakeUserRepository } from '@test/fakes/fake-repositories'
import { FakeClock, FakePasswordHasher, SequentialSessionTokens } from '@test/fakes/fake-services'

class CountingPasswordHasher extends FakePasswordHasher {
  hashes = 0
  verifications = 0

  override async hash(password: string): Promise<string> {
    this.hashes += 1

    return super.hash(password)
  }

  override async verify(password: string, hash: string): Promise<boolean> {
    this.verifications += 1

    return super.verify(password, hash)
  }
}

describe('LoginUseCase', () => {
  let users: FakeUserRepository
  let sessions: FakeSessionRepository
  let useCase: LoginUseCase

  beforeEach(async () => {
    users = new FakeUserRepository()
    sessions = new FakeSessionRepository()
    useCase = new LoginUseCase(
      users,
      sessions,
      new FakePasswordHasher(),
      new SequentialSessionTokens(),
      new FakeClock(new Date('2026-10-20T12:00:00Z')),
    )

    await users.create(
      UserEntity.create({
        id: 'user-1',
        username: 'diego',
        name: 'Diego',
        role: 'admin',
        passwordHash: 'hashed:segredo-forte',
      }),
    )
  })

  it('opens a session for the right password, ignoring the username case', async () => {
    const output = await useCase.execute({ username: ' Diego ', password: 'segredo-forte' })

    expect(output).toEqual({
      token: 'token-1',
      expiresAt: '2026-11-19T12:00:00.000Z',
      user: { id: 'user-1', username: 'diego', name: 'Diego', role: 'admin' },
    })
    expect(await sessions.findById('id:token-1')).toMatchObject({ userId: 'user-1' })
  })

  it('answers a wrong password and an unknown user the same way', async () => {
    await expect(useCase.execute({ username: 'diego', password: 'outra-senha' })).rejects.toThrow(
      InvalidCredentialsError,
    )
    await expect(useCase.execute({ username: 'maria', password: 'segredo-forte' })).rejects.toThrow(
      InvalidCredentialsError,
    )
    expect(sessions.store.all()).toEqual([])
  })

  it('spends the same password work on known and unknown users', async () => {
    const passwords = new CountingPasswordHasher()
    const counted = new LoginUseCase(
      users,
      sessions,
      passwords,
      new SequentialSessionTokens(),
      new FakeClock(),
    )
    const prepared = passwords.hashes

    await expect(counted.execute({ username: 'maria', password: 'x' })).rejects.toThrow()
    await expect(counted.execute({ username: 'diego', password: 'x' })).rejects.toThrow()

    expect(prepared).toBe(1)
    expect(passwords.hashes).toBe(1)
    expect(passwords.verifications).toBe(2)
  })

  it('holds every sign in until the decoy hash is ready', async () => {
    let releaseDecoy = () => {}

    class SlowDecoyHasher extends FakePasswordHasher {
      override hash(password: string): Promise<string> {
        return new Promise((resolve) => {
          releaseDecoy = () => resolve(`hashed:${password}`)
        })
      }
    }

    const slow = new LoginUseCase(
      users,
      sessions,
      new SlowDecoyHasher(),
      new SequentialSessionTokens(),
      new FakeClock(),
    )
    let settled = false
    const login = slow
      .execute({ username: 'diego', password: 'segredo-forte' })
      .finally(() => (settled = true))

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(settled).toBe(false)

    releaseDecoy()
    await expect(login).resolves.toMatchObject({ user: { username: 'diego' } })
  })

  it('refuses an inactive user even with the right password', async () => {
    await users.create(
      UserEntity.restore({
        id: 'user-2',
        username: 'maria',
        name: 'Maria',
        role: 'staff',
        active: false,
        passwordHash: 'hashed:segredo-forte',
      }),
    )

    await expect(useCase.execute({ username: 'maria', password: 'segredo-forte' })).rejects.toThrow(
      InvalidCredentialsError,
    )
  })
})
