import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { env } from '@/infrastructure/config/env'
import { createDatabase } from '@/infrastructure/database/postgresql/database'

const { db, pool } = createDatabase(env.DATABASE_URL)

try {
  await migrate(db, { migrationsFolder: 'drizzle' })
} finally {
  await pool.end()
}
