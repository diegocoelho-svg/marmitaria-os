import { Entity } from './entity'
import type { DomainEvent } from '../events/domain-event'

export abstract class AggregateRoot<Props, E extends DomainEvent<string>> extends Entity<Props> {
  private events: E[] = []

  protected record(event: E): void {
    this.events.push(event)
  }

  pullEvents(): E[] {
    const events = this.events
    this.events = []
    return events
  }
}
