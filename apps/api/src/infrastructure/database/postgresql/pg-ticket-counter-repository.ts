import { sql } from 'drizzle-orm'
import type { TicketCounterRepository } from '@/domain/repositories/ticket-counter-repository'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { dailyTicketCounters } from '@/infrastructure/database/postgresql/schema'

export class PgTicketCounterRepository implements TicketCounterRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async next(businessDate: LocalDateVO): Promise<TicketNumberVO> {
    const [counter] = await this.db
      .insert(dailyTicketCounters)
      .values({ businessDate: businessDate.toString(), lastTicket: 1 })
      .onConflictDoUpdate({
        target: dailyTicketCounters.businessDate,
        set: { lastTicket: sql`${dailyTicketCounters.lastTicket} + 1` },
      })
      .returning({ lastTicket: dailyTicketCounters.lastTicket })

    if (!counter) {
      throw new Error(`No ticket was reserved for ${businessDate.toString()}`)
    }

    return TicketNumberVO.of(counter.lastTicket)
  }
}
