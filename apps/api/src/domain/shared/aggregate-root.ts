import type { DomainEvent } from '../events/domain-event'

export abstract class AggregateRoot<E extends DomainEvent<string>> {
  #events: E[] = []

  protected record(event: E): void {
    this.#events.push(event)
  }

  pullEvents(): E[] {
    const events = this.#events
    this.#events = []
    return events
  }
}
