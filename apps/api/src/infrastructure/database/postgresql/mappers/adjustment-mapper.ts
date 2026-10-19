import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { adjustments } from '@/infrastructure/database/postgresql/schema'

type AdjustmentRow = typeof adjustments.$inferSelect

export class AdjustmentMapper {
  static fromPersistence(row: AdjustmentRow): AdjustmentEntity {
    return restoreRecord('adjustments', row.id, () =>
      AdjustmentEntity.restore({ id: row.id, label: row.label, active: row.active }),
    )
  }

  static toPersistence(adjustment: AdjustmentEntity): AdjustmentRow {
    return { id: adjustment.id, label: adjustment.label, active: adjustment.active }
  }
}
