import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from '@/infrastructure/database/postgresql/schema/users'

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_user_id_index').on(table.userId)],
)
