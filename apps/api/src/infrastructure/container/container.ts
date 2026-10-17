import { setupRepositories, type Repositories } from '@/infrastructure/bootstrap/setup-repositories'
import { createDatabase, type Database } from '@/infrastructure/database/postgresql/database'

export type Container = {
  database: Database
  repositories: Repositories
}

export function createContainer(databaseUrl: string): Container {
  const database = createDatabase(databaseUrl)

  return {
    database,
    repositories: setupRepositories(database.db),
  }
}
