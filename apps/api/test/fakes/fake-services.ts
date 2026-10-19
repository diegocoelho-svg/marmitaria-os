import type { Clock } from '@/application/ports/clock'
import type { ApplicationEvent, EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { Repositories, UnitOfWork } from '@/application/ports/unit-of-work'

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

export class FakeUnitOfWork implements UnitOfWork {
  constructor(private readonly repositories: Repositories) {}

  run<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
    return work(this.repositories)
  }
}
