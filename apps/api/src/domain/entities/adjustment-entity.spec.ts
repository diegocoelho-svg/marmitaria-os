import { describe, expect, it } from 'vitest'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { AdjustmentInvalidLabelError } from '@/domain/errors/adjustment-invalid-label.error'

describe('AdjustmentEntity', () => {
  it('is created active with a trimmed label', () => {
    const adjustment = AdjustmentEntity.create({ id: 'adjustment-1', label: '  Sem farofa ' })

    expect(adjustment.label).toBe('Sem farofa')
    expect(adjustment.active).toBe(true)
  })

  it.each(['', '   ', 'x'.repeat(61)])('rejects the label %j', (label) => {
    expect(() => AdjustmentEntity.create({ id: 'adjustment-1', label })).toThrow(
      AdjustmentInvalidLabelError,
    )
  })

  it('relabels and toggles availability', () => {
    const adjustment = AdjustmentEntity.create({ id: 'adjustment-1', label: 'Sem farofa' })

    adjustment.relabel('Farofa → salada')
    adjustment.deactivate()

    expect(adjustment.label).toBe('Farofa → salada')
    expect(adjustment.active).toBe(false)

    adjustment.activate()
    expect(adjustment.active).toBe(true)
  })

  it('keeps the label when relabeling fails', () => {
    const adjustment = AdjustmentEntity.create({ id: 'adjustment-1', label: 'Sem farofa' })

    expect(() => adjustment.relabel(' ')).toThrow(AdjustmentInvalidLabelError)
    expect(adjustment.label).toBe('Sem farofa')
  })

  it('restores an inactive adjustment', () => {
    const adjustment = AdjustmentEntity.restore({
      id: 'adjustment-1',
      label: 'Sem feijão',
      active: false,
    })

    expect(adjustment.active).toBe(false)
  })
})
