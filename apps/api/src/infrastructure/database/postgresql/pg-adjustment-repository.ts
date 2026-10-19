import { asc, eq, inArray } from 'drizzle-orm'
import type { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { AdjustmentMapper } from '@/infrastructure/database/postgresql/mappers/adjustment-mapper'
import { adjustments } from '@/infrastructure/database/postgresql/schema'

export class PgAdjustmentRepository implements AdjustmentRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<AdjustmentEntity | null> {
    const [row] = await this.db.select().from(adjustments).where(eq(adjustments.id, id))

    return row ? AdjustmentMapper.fromPersistence(row) : null
  }

  async findByIds(ids: readonly string[]): Promise<AdjustmentEntity[]> {
    if (ids.length === 0) return []

    const rows = await this.db
      .select()
      .from(adjustments)
      .where(inArray(adjustments.id, [...ids]))

    return rows.map((row) => AdjustmentMapper.fromPersistence(row))
  }

  async findAll(): Promise<AdjustmentEntity[]> {
    const rows = await this.db
      .select()
      .from(adjustments)
      .orderBy(asc(adjustments.label), asc(adjustments.id))

    return rows.map((row) => AdjustmentMapper.fromPersistence(row))
  }

  async create(adjustment: AdjustmentEntity): Promise<void> {
    await this.db.insert(adjustments).values(AdjustmentMapper.toPersistence(adjustment))
  }

  async update(adjustment: AdjustmentEntity): Promise<void> {
    const { id, ...row } = AdjustmentMapper.toPersistence(adjustment)

    await this.db.update(adjustments).set(row).where(eq(adjustments.id, id))
  }
}
