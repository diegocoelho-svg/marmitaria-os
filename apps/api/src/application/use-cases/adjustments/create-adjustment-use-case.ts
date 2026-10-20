import { AdjustmentOutput } from '@/application/dtos/adjustments/adjustment-output'
import type { CreateAdjustmentInput } from '@/application/dtos/adjustments/create-adjustment-input'
import type { IdGenerator } from '@/application/ports/id-generator'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'

export class CreateAdjustmentUseCase {
  constructor(
    private readonly adjustments: AdjustmentRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateAdjustmentInput): Promise<AdjustmentOutput> {
    const adjustment = AdjustmentEntity.create({ id: this.ids.next(), label: input.label })

    await this.adjustments.create(adjustment)

    return AdjustmentOutput.from(adjustment)
  }
}
