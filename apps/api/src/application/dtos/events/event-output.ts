import type { ApplicationEvent } from '@/application/ports/event-bus'

type Serialized<E> = E extends ApplicationEvent
  ? Omit<E, 'occurredAt'> & { occurredAt: string }
  : never

export type EventOutput = Serialized<ApplicationEvent>

export const EventOutput = {
  from(event: ApplicationEvent): EventOutput {
    return { ...event, occurredAt: event.occurredAt.toISOString() }
  },
}
