import { boolean, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { userRoleEnum } from '@/infrastructure/database/postgresql/schema/enums'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    username: text('username').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull(),
    active: boolean('active').notNull(),
    passwordHash: text('password_hash').notNull(),
  },
  (table) => [unique('users_username_unique').on(table.username)],
)
