import type { AdjustmentEntity } from '@/domain/entities/adjustment-entity'

export interface AdjustmentRepository {
  findById(id: string): Promise<AdjustmentEntity | null>
  findByIds(ids: readonly string[]): Promise<AdjustmentEntity[]>
  findAll(): Promise<AdjustmentEntity[]>
  create(adjustment: AdjustmentEntity): Promise<void>
  update(adjustment: AdjustmentEntity): Promise<void>
}
