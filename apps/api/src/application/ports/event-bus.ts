import type { DailyMenuEvent } from '@/domain/events/daily-menu-events'
import type { OrderEvent } from '@/domain/events/order-events'

export type ApplicationEvent = DailyMenuEvent | OrderEvent

export interface EventBus {
  publish(events: readonly ApplicationEvent[]): Promise<void>
}
