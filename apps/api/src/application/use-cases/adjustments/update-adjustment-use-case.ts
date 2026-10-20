import { AdjustmentOutput } from '@/application/dtos/adjustments/adjustment-output'
import type { UpdateAdjustmentInput } from '@/application/dtos/adjustments/update-adjustment-input'
import { AdjustmentNotFoundError } from '@/application/errors/adjustment-not-found.error'
import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'

export class UpdateAdjustmentUseCase {
  constructor(private readonly adjustments: AdjustmentRepository) {}

  async execute(input: UpdateAdjustmentInput): Promise<AdjustmentOutput> {
    const adjustment = await this.adjustments.findById(input.id)

    if (!adjustment) {
      throw new AdjustmentNotFoundError(input.id)
    }

    if (input.label !== undefined) {
      adjustment.relabel(input.label)
    }

    if (input.active === true) {
      adjustment.activate()
    } else if (input.active === false) {
      adjustment.deactivate()
    }

    await this.adjustments.update(adjustment)

    return AdjustmentOutput.from(adjustment)
  }
}
