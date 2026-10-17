import { isNull, sql } from 'drizzle-orm'
import { bigint, check, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sizeEnum } from '@/infrastructure/database/postgresql/schema/enums'

export const sizePrices = pgTable(
  'size_prices',
  {
    id: uuid('id').primaryKey(),
    size: sizeEnum('size').notNull(),
    priceCents: bigint('price_cents', { mode: 'number' }).notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validTo: timestamp('valid_to', { withTimezone: true }),
  },
  (table) => [
    check('size_prices_price_cents_positive', sql`${table.priceCents} > 0`),
    check(
      'size_prices_valid_period',
      sql`${table.validTo} IS NULL OR ${table.validTo} > ${table.validFrom}`,
    ),
    uniqueIndex('size_prices_open_size_unique').on(table.size).where(isNull(table.validTo)),
  ],
)
