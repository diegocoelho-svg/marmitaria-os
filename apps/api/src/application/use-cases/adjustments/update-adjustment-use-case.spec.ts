import { beforeEach, describe, expect, it } from 'vitest'
import { AdjustmentNotFoundError } from '@/application/errors/adjustment-not-found.error'
import { UpdateAdjustmentUseCase } from '@/application/use-cases/adjustments/update-adjustment-use-case'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { FakeAdjustmentRepository } from '@test/fakes/fake-repositories'

describe('UpdateAdjustmentUseCase', () => {
  let adjustments: FakeAdjustmentRepository
  let useCase: UpdateAdjustmentUseCase

  beforeEach(async () => {
    adjustments = new FakeAdjustmentRepository()
    useCase = new UpdateAdjustmentUseCase(adjustments)
    await adjustments.create(AdjustmentEntity.create({ id: 'sem-farofa', label: 'Sem farofa' }))
  })

  it('relabels and deactivates an adjustment', async () => {
    const output = await useCase.execute({
      id: 'sem-farofa',
      label: 'Farofa → salada',
      active: false,
    })

    expect(output).toEqual({ id: 'sem-farofa', label: 'Farofa → salada', active: false })
    expect(await adjustments.findById('sem-farofa')).toMatchObject({
      label: 'Farofa → salada',
      active: false,
    })
  })

  it('reactivates an adjustment', async () => {
    await useCase.execute({ id: 'sem-farofa', active: false })

    await expect(useCase.execute({ id: 'sem-farofa', active: true })).resolves.toMatchObject({
      active: true,
    })
  })

  it('rejects an unknown adjustment', async () => {
    await expect(useCase.execute({ id: 'sem-feijao', active: false })).rejects.toBeInstanceOf(
      AdjustmentNotFoundError,
    )
  })
})
