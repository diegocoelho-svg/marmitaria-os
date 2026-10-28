import { beforeEach, describe, expect, it } from 'vitest'
import { SessionInvalidError } from '@/application/errors/session-invalid.error'
import { AuthenticateUseCase } from '@/application/use-cases/auth/authenticate-use-case'
import { SessionEntity } from '@/domain/entities/session-entity'
import { UserEntity } from '@/domain/entities/user-entity'
import { FakeSessionRepository, FakeUserRepository } from '@test/fakes/fake-repositories'
import { FakeClock, SequentialSessionTokens } from '@test/fakes/fake-services'

const signedInAt = new Date('2026-10-20T12:00:00Z')

class SessionsRenewedRightAfterRead extends FakeSessionRepository {
  override async findById(id: string) {
    const found = await super.findById(id)
    const stored = this.store.get(id)

    if (stored) {
      const previousExpiry = stored.expiresAt
      stored.renew(new Date('2026-11-19T11:59:59Z'))
      await this.renew(stored, previousExpiry)
    }

    return found
  }
}

describe('AuthenticateUseCase', () => {
  let users: FakeUserRepository
  let sessions: FakeSessionRepository
  let clock: FakeClock
  let useCase: AuthenticateUseCase

  const addUser = (active: boolean) =>
    users.create(
      UserEntity.restore({
        id: 'user-1',
        username: 'maria',
        name: 'Maria',
        role: 'staff',
        active,
        passwordHash: 'hashed:segredo-forte',
      }),
    )

  beforeEach(async () => {
    users = new FakeUserRepository()
    sessions = new FakeSessionRepository()
    clock = new FakeClock(signedInAt)
    useCase = new AuthenticateUseCase(sessions, users, new SequentialSessionTokens(), clock)

    await sessions.create(
      SessionEntity.start({ id: 'id:token-1', userId: 'user-1', now: signedInAt }),
    )
  })

  it('identifies the user of a valid session without renewing it the same day', async () => {
    await addUser(true)
    clock.set('2026-10-20T20:00:00Z')

    expect(await useCase.execute({ token: 'token-1' })).toEqual({
      user: { id: 'user-1', username: 'maria', name: 'Maria', role: 'staff' },
      renewedUntil: null,
    })
  })

  it('renews the session once a day has passed', async () => {
    await addUser(true)
    clock.set('2026-10-25T09:00:00Z')

    const output = await useCase.execute({ token: 'token-1' })

    expect(output.renewedUntil).toBe('2026-11-24T09:00:00.000Z')
    expect((await sessions.findById('id:token-1'))?.expiresAt).toEqual(
      new Date('2026-11-24T09:00:00Z'),
    )
  })

  it('renews only once when requests arrive together', async () => {
    await addUser(true)
    clock.set('2026-10-25T09:00:00Z')

    const outputs = await Promise.all(
      Array.from({ length: 6 }, () => useCase.execute({ token: 'token-1' })),
    )

    expect(outputs.filter((output) => output.renewedUntil !== null)).toHaveLength(1)
  })

  it('refuses an unknown token', async () => {
    await addUser(true)

    await expect(useCase.execute({ token: 'token-9' })).rejects.toThrow(SessionInvalidError)
  })

  it('refuses and forgets an expired session', async () => {
    await addUser(true)
    clock.set('2026-11-19T12:00:00Z')

    await expect(useCase.execute({ token: 'token-1' })).rejects.toThrow(SessionInvalidError)
    expect(await sessions.findById('id:token-1')).toBeNull()
  })

  it('keeps a session that another request renewed right before the sweep', async () => {
    await addUser(true)
    const racing = new SessionsRenewedRightAfterRead()
    await racing.create(
      SessionEntity.start({ id: 'id:token-1', userId: 'user-1', now: signedInAt }),
    )
    clock.set('2026-11-19T12:00:00Z')
    const late = new AuthenticateUseCase(racing, users, new SequentialSessionTokens(), clock)

    await expect(late.execute({ token: 'token-1' })).rejects.toThrow(SessionInvalidError)
    expect((await racing.findById('id:token-1'))?.expiresAt).toEqual(
      new Date('2026-12-19T11:59:59Z'),
    )
  })

  it('refuses the session of an inactive user', async () => {
    await addUser(false)

    await expect(useCase.execute({ token: 'token-1' })).rejects.toThrow(SessionInvalidError)
  })
})
