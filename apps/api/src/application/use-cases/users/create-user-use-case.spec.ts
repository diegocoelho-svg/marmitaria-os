import { beforeEach, describe, expect, it } from 'vitest'
import { PasswordInvalidLengthError } from '@/application/errors/password-invalid-length.error'
import { UsernameTakenError } from '@/application/errors/username-taken.error'
import { CreateUserUseCase } from '@/application/use-cases/users/create-user-use-case'
import { UserInvalidUsernameError } from '@/domain/errors/user-invalid-username.error'
import { FakeUserRepository } from '@test/fakes/fake-repositories'
import { FakePasswordHasher, SequentialIdGenerator } from '@test/fakes/fake-services'

describe('CreateUserUseCase', () => {
  let users: FakeUserRepository
  let useCase: CreateUserUseCase

  beforeEach(() => {
    users = new FakeUserRepository()
    useCase = new CreateUserUseCase(users, new FakePasswordHasher(), new SequentialIdGenerator())
  })

  it('stores the password hash, never the password', async () => {
    const output = await useCase.execute({
      username: 'Diego',
      name: 'Diego',
      role: 'admin',
      password: 'segredo-forte',
    })

    expect(output).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      username: 'diego',
      name: 'Diego',
      role: 'admin',
    })
    expect((await users.findById(output.id))?.passwordHash).toBe('hashed:segredo-forte')
  })

  it.each(['1234567', 'x'.repeat(257)])(
    'accepts only passwords that can be used to sign in (length %#)',
    async (password) => {
      await expect(
        useCase.execute({ username: 'diego', name: 'Diego', role: 'admin', password }),
      ).rejects.toThrow(PasswordInvalidLengthError)
      await expect(
        useCase.execute({
          username: 'diego',
          name: 'Diego',
          role: 'admin',
          password: password.length > 8 ? 'x'.repeat(256) : '12345678',
        }),
      ).resolves.toMatchObject({ username: 'diego' })
    },
  )

  it('rejects a username already taken, ignoring case', async () => {
    await useCase.execute({ username: 'diego', name: 'Diego', role: 'admin', password: '12345678' })

    await expect(
      useCase.execute({ username: 'DIEGO', name: 'Outro', role: 'staff', password: '12345678' }),
    ).rejects.toThrow(UsernameTakenError)
  })

  it('validates the username', async () => {
    await expect(
      useCase.execute({ username: 'd', name: 'Diego', role: 'admin', password: '12345678' }),
    ).rejects.toThrow(UserInvalidUsernameError)
  })
})
