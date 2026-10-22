import { parseArgs } from 'node:util'
import { CreateUserUseCase } from '@/application/use-cases/users/create-user-use-case'
import { env } from '@/infrastructure/config/env'
import { createDatabase } from '@/infrastructure/database/postgresql/database'
import { PgUserRepository } from '@/infrastructure/database/postgresql/pg-user-repository'
import { ScryptPasswordHasher } from '@/infrastructure/services/scrypt-password-hasher'
import { UuidGenerator } from '@/infrastructure/services/uuid-generator'

const USAGE = 'Usage: create-admin --username <username> --name <name> --password <password>'

const { values } = parseArgs({
  options: {
    username: { type: 'string' },
    name: { type: 'string' },
    password: { type: 'string' },
  },
})

const { username, name, password } = values

if (username === undefined || name === undefined || password === undefined) {
  console.error(USAGE)
  process.exit(1)
}

const { db, pool } = createDatabase(env.DATABASE_URL)
const createUser = new CreateUserUseCase(
  new PgUserRepository(db),
  new ScryptPasswordHasher(),
  new UuidGenerator(),
)

try {
  const admin = await createUser.execute({ username, name, password, role: 'admin' })
  console.log(`Administrator ${admin.username} created`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await pool.end()
}
