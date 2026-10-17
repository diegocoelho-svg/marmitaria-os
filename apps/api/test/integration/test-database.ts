import { sql } from 'drizzle-orm'
import { afterAll, beforeEach } from 'vitest'
import { createDatabase, type DrizzleExecutor } from '@/infrastructure/database/postgresql/database'

const TEST_DATABASE_NAME = /^\w+_test$/

export function testDatabaseUrl(url = process.env.TEST_DATABASE_URL): string {
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required to run the integration tests')
  }

  const name = new URL(url).pathname.slice(1)

  if (!TEST_DATABASE_NAME.test(name)) {
    throw new Error(`Refusing to use database "${name}": its name must end with _test`)
  }

  return url
}

export function useTestDatabase(): DrizzleExecutor {
  const { db, pool } = createDatabase(testDatabaseUrl())

  beforeEach(async () => {
    await db.execute(sql`
      TRUNCATE
        order_item_adjustments, order_items, orders,
        daily_menu_dishes, daily_menus, menu_dishes, menus,
        size_prices, dishes
    `)
  })

  afterAll(() => pool.end())

  return db
}
