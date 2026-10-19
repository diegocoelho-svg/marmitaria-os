import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { Repositories } from '@/application/ports/unit-of-work'
import { setupControllers } from '@/infrastructure/bootstrap/setup-controllers'
import { setupRepositories } from '@/infrastructure/bootstrap/setup-repositories'
import { setupUseCases, type UseCases } from '@/infrastructure/bootstrap/setup-use-cases'
import { createDatabase, type Database } from '@/infrastructure/database/postgresql/database'
import { DrizzleUnitOfWork } from '@/infrastructure/database/postgresql/drizzle-unit-of-work'

export type Services = {
  clock: Clock
  ids: IdGenerator
  eventBus: EventBus
}

export type ContainerOptions = {
  databaseUrl: string
  services: Services
}

export type Container = {
  database: Database
  repositories: Repositories
  useCases: UseCases
  controllers: object[]
}

export function createContainer({ databaseUrl, services }: ContainerOptions): Container {
  const database = createDatabase(databaseUrl)
  const repositories = setupRepositories(database.db)
  const useCases = setupUseCases({
    ...services,
    repositories,
    unitOfWork: new DrizzleUnitOfWork(database.db),
  })

  return { database, repositories, useCases, controllers: setupControllers(useCases) }
}
