import { userSchema } from '@marmitaria/contracts'
import { describe, expect, it } from 'vitest'
import { SESSION_COOKIE } from '@/infrastructure/http/auth/session-cookie'
import { TEST_PASSWORD, useTestApp } from '@test/integration/test-app'

describe('/api/auth', () => {
  const { app, clock } = useTestApp()

  const login = (username: string, password: string) =>
    app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password } })

  const sessionOf = (response: Awaited<ReturnType<typeof login>>) => {
    const cookie = response.cookies.find(({ name }) => name === SESSION_COOKIE)

    if (!cookie) {
      throw new Error('The response did not set the session cookie')
    }

    return cookie
  }

  const me = (token?: string) =>
    app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: token === undefined ? {} : { [SESSION_COOKIE]: token },
    })

  it('signs in with a protected session cookie', async () => {
    clock.set('2026-10-17T15:00:00Z')

    const response = await login('Staff', TEST_PASSWORD)
    const cookie = sessionOf(response)

    expect(response.statusCode).toBe(200)
    expect(userSchema.parse(response.json())).toMatchObject({ username: 'staff', role: 'staff' })
    expect(cookie).toMatchObject({
      path: '/api',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      expires: new Date('2026-11-16T15:00:00Z'),
    })

    const current = await me(cookie.value)
    expect(current.statusCode).toBe(200)
    expect(current.json()).toEqual(response.json())
  })

  it('refuses wrong credentials without telling which part failed', async () => {
    const wrongPassword = await login('admin', 'senha-errada')
    const unknownUser = await login('ninguem', TEST_PASSWORD)

    expect(wrongPassword.statusCode).toBe(401)
    expect(wrongPassword.json()).toEqual(unknownUser.json())
    expect(wrongPassword.json()).toMatchObject({ code: 'auth.invalid_credentials' })
    expect(wrongPassword.cookies).toEqual([])
  })

  it('asks to sign in when the session is missing or unknown', async () => {
    const missing = await me()
    const unknown = await me('token-desconhecido')

    expect(missing.statusCode).toBe(401)
    expect(missing.json()).toMatchObject({ code: 'auth.unauthenticated' })
    expect(unknown.statusCode).toBe(401)
  })

  it('signs out and forgets the session', async () => {
    const { value } = sessionOf(await login('admin', TEST_PASSWORD))

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: { [SESSION_COOKIE]: value },
    })

    expect(response.statusCode).toBe(204)
    expect(sessionOf(response)).toMatchObject({ value: '', path: '/api' })
    expect((await me(value)).statusCode).toBe(401)
  })

  it('extends the cookie of a session in use on a later day', async () => {
    clock.set('2026-10-17T15:00:00Z')
    const { value } = sessionOf(await login('admin', TEST_PASSWORD))

    clock.set('2026-10-20T08:00:00Z')
    const response = await me(value)

    expect(response.statusCode).toBe(200)
    expect(sessionOf(response).expires).toEqual(new Date('2026-11-19T08:00:00Z'))
  })

  it('refuses oversized credentials', async () => {
    const response = await login('admin', 'x'.repeat(257))

    expect(response.statusCode).toBe(400)
  })
})
