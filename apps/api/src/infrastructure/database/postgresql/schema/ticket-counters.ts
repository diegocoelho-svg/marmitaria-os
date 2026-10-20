import { sql } from 'drizzle-orm'
import { bigint, check, date, pgTable } from 'drizzle-orm/pg-core'

export const dailyTicketCounters = pgTable(
  'daily_ticket_counters',
  {
    businessDate: date('business_date', { mode: 'string' }).primaryKey(),
    lastTicket: bigint('last_ticket', { mode: 'number' }).notNull(),
  },
  (table) => [check('daily_ticket_counters_last_ticket_positive', sql`${table.lastTicket} >= 1`)],
)
