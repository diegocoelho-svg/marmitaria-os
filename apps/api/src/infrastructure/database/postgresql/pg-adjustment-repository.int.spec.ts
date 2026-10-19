import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { PgAdjustmentRepository } from '@/infrastructure/database/postgresql/pg-adjustment-repository'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgAdjustmentRepository', () => {
  const repository = new PgAdjustmentRepository(useTestDatabase())

  const adjustment = (label: string) => AdjustmentEntity.create({ id: randomUUID(), label })

  it('round-trips an adjustment', async () => {
    const semFarofa = adjustment('Sem farofa')

    await repository.create(semFarofa)

    expect(await repository.findById(semFarofa.id)).toEqual(semFarofa)
    expect(await repository.findById(randomUUID())).toBeNull()
  })

  it('finds by ids ignoring the unknown ones', async () => {
    const semFarofa = adjustment('Sem farofa')
    const semFeijao = adjustment('Sem feijão')
    await repository.create(semFarofa)
    await repository.create(semFeijao)

    expect(await repository.findByIds([semFeijao.id, randomUUID()])).toEqual([semFeijao])
    expect(await repository.findByIds([])).toEqual([])
  })

  it('lists all adjustments by label', async () => {
    const semFeijao = adjustment('Sem feijão')
    const farofaPorSalada = adjustment('Farofa → salada')
    await repository.create(semFeijao)
    await repository.create(farofaPorSalada)

    expect(await repository.findAll()).toEqual([farofaPorSalada, semFeijao])
  })

  it('persists relabeling and deactivation', async () => {
    const semFarofa = adjustment('Sem farofa')
    await repository.create(semFarofa)

    semFarofa.relabel('Sem farofa de mandioca')
    semFarofa.deactivate()
    await repository.update(semFarofa)

    expect(await repository.findById(semFarofa.id)).toEqual(semFarofa)
  })
})
