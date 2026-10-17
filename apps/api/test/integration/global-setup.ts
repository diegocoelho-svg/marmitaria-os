import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'
import type { TestProject } from 'vitest/node'
import { createDatabase } from '@/infrastructure/database/postgresql/database'
import { testDatabaseUrl } from './test-database'

async function ensureDatabaseExists(url: string): Promise<void> {
  const target = new URL(url)
  const name = target.pathname.slice(1)
  const maintenance = new URL(url)
  maintenance.pathname = '/postgres'

  const client = new Client({ connectionString: maintenance.toString() })
  await client.connect()

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])

    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${name}"`)
    }
  } finally {
    await client.end()
  }
}

export default async function setup(project: TestProject): Promise<void> {
  const url = testDatabaseUrl(project.config.env.TEST_DATABASE_URL)
  await ensureDatabaseExists(url)

  const { db, pool } = createDatabase(url)

  try {
    await migrate(db, { migrationsFolder: 'drizzle' })
  } finally {
    await pool.end()
  }
}
