import { z } from 'zod'

export const adjustmentSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  active: z.boolean(),
})

export const createAdjustmentBodySchema = z.object({
  label: z.string(),
})

export const updateAdjustmentBodySchema = z.object({
  label: z.string().optional(),
  active: z.boolean().optional(),
})

export type Adjustment = z.infer<typeof adjustmentSchema>
export type CreateAdjustmentBody = z.infer<typeof createAdjustmentBodySchema>
export type UpdateAdjustmentBody = z.infer<typeof updateAdjustmentBodySchema>
