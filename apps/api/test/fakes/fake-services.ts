import type { Clock } from '@/application/ports/clock'
import type { ApplicationEvent, EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { PasswordHasher } from '@/application/ports/password-hasher'
import type { IssuedToken, SessionTokens } from '@/application/ports/session-tokens'
import type { Repositories, UnitOfWork } from '@/application/ports/unit-of-work'
import type { FakeRepositories } from '@test/fakes/fake-repositories'

export class FakeClock implements Clock {
  constructor(private current = new Date('2026-10-17T15:00:00Z')) {}

  now(): Date {
    return new Date(this.current)
  }

  set(at: Date | string): void {
    this.current = new Date(at)
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0

  next(): string {
    this.counter += 1

    return `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`
  }
}

export class RecordingEventBus implements EventBus {
  readonly published: ApplicationEvent[] = []

  async publish(events: readonly ApplicationEvent[]): Promise<void> {
    this.published.push(...events)
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`
  }
}

export class SequentialSessionTokens implements SessionTokens {
  private counter = 0

  issue(): IssuedToken {
    this.counter += 1
    const token = `token-${this.counter}`

    return { token, id: this.idOf(token) }
  }

  idOf(token: string): string {
    return `id:${token}`
  }
}

export class FakeUnitOfWork implements UnitOfWork {
  constructor(private readonly repositories: FakeRepositories & Repositories) {}

  async run<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
    const rollbacks = Object.values(this.repositories).map((repository) =>
      repository.store.checkpoint(),
    )

    try {
      return await work(this.repositories)
    } catch (error) {
      rollbacks.forEach((rollback) => rollback())
      throw error
    }
  }
}
