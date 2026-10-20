import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'

export interface TicketCounterRepository {
  next(businessDate: LocalDateVO): Promise<TicketNumberVO>
}
