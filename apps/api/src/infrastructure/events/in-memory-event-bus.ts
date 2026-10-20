import type { ApplicationEvent, EventBus } from '@/application/ports/event-bus'

export type EventHandler = (event: ApplicationEvent) => void | Promise<void>

export type EventHandlerFailure = {
  error: Error
  event: ApplicationEvent
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Set<EventHandler>()

  constructor(private readonly onHandlerFailure: (failure: EventHandlerFailure) => void) {}

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler)

    return () => {
      this.handlers.delete(handler)
    }
  }

  async publish(events: readonly ApplicationEvent[]): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers) {
        try {
          await handler(event)
        } catch (error) {
          this.onHandlerFailure({
            error: error instanceof Error ? error : new Error(String(error)),
            event,
          })
        }
      }
    }
  }
}
