import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'staff'])

export const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  name: z.string(),
  role: userRoleSchema,
})

export const loginBodySchema = z.object({
  username: z.string().max(64),
  password: z.string().max(256),
})

export type UserRole = z.infer<typeof userRoleSchema>
export type User = z.infer<typeof userSchema>
export type LoginBody = z.infer<typeof loginBodySchema>
