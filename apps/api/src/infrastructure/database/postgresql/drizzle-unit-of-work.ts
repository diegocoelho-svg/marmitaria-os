import type { Repositories, UnitOfWork } from '@/application/ports/unit-of-work'
import { setupRepositories } from '@/infrastructure/bootstrap/setup-repositories'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: DrizzleExecutor) {}

  run<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(setupRepositories(tx)))
  }
}
