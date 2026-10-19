import { z } from 'zod'

export const sizeSchema = z.enum(['small', 'medium', 'large'])

export const sizePriceSchema = z.object({
  size: sizeSchema,
  priceCents: z.number().int(),
  validFrom: z.iso.datetime(),
})

export const sizePriceParamsSchema = z.object({
  size: sizeSchema,
})

export const changeSizePriceBodySchema = z.object({
  priceCents: z.number().int().positive(),
})

export type Size = z.infer<typeof sizeSchema>
export type SizePrice = z.infer<typeof sizePriceSchema>
export type ChangeSizePriceBody = z.infer<typeof changeSizePriceBodySchema>
