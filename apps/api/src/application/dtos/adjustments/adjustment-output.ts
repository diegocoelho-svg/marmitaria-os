import type { AdjustmentEntity } from '@/domain/entities/adjustment-entity'

export type AdjustmentOutput = {
  id: string
  label: string
  active: boolean
}

export const AdjustmentOutput = {
  from(adjustment: AdjustmentEntity): AdjustmentOutput {
    return { id: adjustment.id, label: adjustment.label, active: adjustment.active }
  },
}
