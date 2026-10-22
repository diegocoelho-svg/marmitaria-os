import { UserInvalidRoleError } from '@/domain/errors/user-invalid-role.error'

export const userRoles: readonly ['admin', 'staff'] = ['admin', 'staff']

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export function assertUserRole(value: string): UserRole {
  if (!isUserRole(value)) {
    throw new UserInvalidRoleError(value)
  }

  return value
}
