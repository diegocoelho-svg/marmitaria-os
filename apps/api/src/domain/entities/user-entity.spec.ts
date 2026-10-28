import { describe, expect, it } from 'vitest'
import { type CreateUserInput, UserEntity } from '@/domain/entities/user-entity'
import { UserInvalidNameError } from '@/domain/errors/user-invalid-name.error'
import { UserInvalidRoleError } from '@/domain/errors/user-invalid-role.error'
import { UserInvalidUsernameError } from '@/domain/errors/user-invalid-username.error'
import { assertUserRole } from '@/domain/value-objects/user-role'

const diego = {
  id: 'user-1',
  username: 'diego',
  name: ' Diego ',
  role: 'admin',
  passwordHash: 'hash',
} satisfies CreateUserInput

describe('UserEntity', () => {
  it('is created active with a lowercase username and a trimmed name', () => {
    const user = UserEntity.create({ ...diego, username: '  Diego.Coelho ' })

    expect(user.username).toBe('diego.coelho')
    expect(user.name).toBe('Diego')
    expect(user.active).toBe(true)
  })

  it.each(['ab', 'x'.repeat(33), 'diego coelho', 'diégo', 'diego@casa'])(
    'rejects the username %j',
    (username) => {
      expect(() => UserEntity.create({ ...diego, username })).toThrow(UserInvalidUsernameError)
    },
  )

  it.each(['', '   ', 'x'.repeat(81)])('rejects the name %j', (name) => {
    expect(() => UserEntity.create({ ...diego, name })).toThrow(UserInvalidNameError)
  })

  it('keeps the active flag read from storage', () => {
    expect(UserEntity.restore({ ...diego, active: false }).active).toBe(false)
  })

  it('accepts only the known roles', () => {
    expect(assertUserRole('staff')).toBe('staff')
    expect(() => assertUserRole('cook')).toThrow(UserInvalidRoleError)
  })
})
