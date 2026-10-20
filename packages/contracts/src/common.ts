import { z } from 'zod'

export const uuidSchema = z.uuid().transform((value) => value.toLowerCase())

export const idParamsSchema = z.object({
  id: uuidSchema,
})

export const localDateSchema = z.iso.date()

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export type IdParams = z.infer<typeof idParamsSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
