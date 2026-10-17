import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core'

export const dishes = pgTable('dishes', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull(),
})
