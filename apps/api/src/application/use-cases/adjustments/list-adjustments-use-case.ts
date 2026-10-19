import { AdjustmentOutput } from '@/application/dtos/adjustments/adjustment-output'
import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'

export class ListAdjustmentsUseCase {
  constructor(private readonly adjustments: AdjustmentRepository) {}

  async execute(): Promise<AdjustmentOutput[]> {
    const adjustments = await this.adjustments.findAll()

    return adjustments.map((adjustment) => AdjustmentOutput.from(adjustment))
  }
}
