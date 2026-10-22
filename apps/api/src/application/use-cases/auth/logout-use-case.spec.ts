import { describe, expect, it } from 'vitest'
import { LogoutUseCase } from '@/application/use-cases/auth/logout-use-case'
import { SessionEntity } from '@/domain/entities/session-entity'
import { FakeSessionRepository } from '@test/fakes/fake-repositories'
import { SequentialSessionTokens } from '@test/fakes/fake-services'

describe('LogoutUseCase', () => {
  it('ends only the session of the given token', async () => {
    const sessions = new FakeSessionRepository()
    const now = new Date('2026-10-20T12:00:00Z')
    await sessions.create(SessionEntity.start({ id: 'id:token-1', userId: 'user-1', now }))
    await sessions.create(SessionEntity.start({ id: 'id:token-2', userId: 'user-1', now }))

    await new LogoutUseCase(sessions, new SequentialSessionTokens()).execute({ token: 'token-1' })
    await new LogoutUseCase(sessions, new SequentialSessionTokens()).execute({ token: 'token-1' })

    expect(sessions.store.all().map((session) => session.id)).toEqual(['id:token-2'])
  })
})
