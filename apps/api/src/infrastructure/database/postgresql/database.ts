import { drizzle, type NodePgDatabase, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import * as schema from '@/infrastructure/database/postgresql/schema'

export type DrizzleExecutor = PgDatabase<NodePgQueryResultHKT, typeof schema>

export type Database = {
  db: NodePgDatabase<typeof schema>
  pool: Pool
}

export function createDatabase(url: string): Database {
  const pool = new Pool({ connectionString: url })

  return { db: drizzle({ client: pool, schema }), pool }
}
