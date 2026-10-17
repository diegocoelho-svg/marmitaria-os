import { sql } from 'drizzle-orm'
import { check, date, integer, pgTable, primaryKey, unique, uuid } from 'drizzle-orm/pg-core'
import { dishes } from '@/infrastructure/database/postgresql/schema/dishes'
import { menus } from '@/infrastructure/database/postgresql/schema/menus'

export const dailyMenus = pgTable('daily_menus', {
  id: uuid('id').primaryKey(),
  date: date('date', { mode: 'string' }).notNull().unique(),
  sourceMenuId: uuid('source_menu_id')
    .notNull()
    .references(() => menus.id),
})

export const dailyMenuDishes = pgTable(
  'daily_menu_dishes',
  {
    dailyMenuId: uuid('daily_menu_id')
      .notNull()
      .references(() => dailyMenus.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id),
  },
  (table) => [
    primaryKey({ columns: [table.dailyMenuId, table.position] }),
    unique('daily_menu_dishes_daily_menu_dish_unique').on(table.dailyMenuId, table.dishId),
    check('daily_menu_dishes_position_non_negative', sql`${table.position} >= 0`),
  ],
)
