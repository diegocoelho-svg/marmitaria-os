import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core'

export const adjustments = pgTable('adjustments', {
  id: uuid('id').primaryKey(),
  label: text('label').notNull(),
  active: boolean('active').notNull(),
})
