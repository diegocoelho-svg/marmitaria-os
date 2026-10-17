import { isNull, sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { dishes } from '@/infrastructure/database/postgresql/schema/dishes'

export const menus = pgTable(
  'menus',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('menus_active_name_key_unique').on(table.nameKey).where(isNull(table.archivedAt)),
  ],
)

export const menuDishes = pgTable(
  'menu_dishes',
  {
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id),
  },
  (table) => [
    primaryKey({ columns: [table.menuId, table.position] }),
    unique('menu_dishes_menu_dish_unique').on(table.menuId, table.dishId),
    check('menu_dishes_position_non_negative', sql`${table.position} >= 0`),
  ],
)
