import { AdjustmentInvalidLabelError } from '@/domain/errors/adjustment-invalid-label.error'
import { Entity } from '@/domain/shared/entity'
import { requiredText } from '@/domain/shared/text'

const LABEL_MAX_LENGTH = 60

export type AdjustmentEntityProps = {
  label: string
  active: boolean
}

export type CreateAdjustmentInput = {
  id: string
  label: string
}

export type RestoreAdjustmentInput = CreateAdjustmentInput & {
  active: boolean
}

export class AdjustmentEntity extends Entity<AdjustmentEntityProps> {
  private constructor(id: string, props: AdjustmentEntityProps) {
    super(id, {
      label: requiredText(props.label, LABEL_MAX_LENGTH, AdjustmentInvalidLabelError),
      active: props.active,
    })
  }

  static create(input: CreateAdjustmentInput): AdjustmentEntity {
    return new AdjustmentEntity(input.id, { label: input.label, active: true })
  }

  static restore(input: RestoreAdjustmentInput): AdjustmentEntity {
    return new AdjustmentEntity(input.id, { label: input.label, active: input.active })
  }

  get label(): string {
    return this.props.label
  }

  get active(): boolean {
    return this.props.active
  }

  relabel(label: string): void {
    this.props.label = requiredText(label, LABEL_MAX_LENGTH, AdjustmentInvalidLabelError)
  }

  activate(): void {
    this.props.active = true
  }

  deactivate(): void {
    this.props.active = false
  }
}
