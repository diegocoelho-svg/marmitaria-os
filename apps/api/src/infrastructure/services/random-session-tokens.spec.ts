import { describe, expect, it } from 'vitest'
import { RandomSessionTokens } from '@/infrastructure/services/random-session-tokens'

describe('RandomSessionTokens', () => {
  const tokens = new RandomSessionTokens()

  it('issues unpredictable tokens stored only as their digest', () => {
    const first = tokens.issue()
    const second = tokens.issue()

    expect(first.token).toMatch(/^[\w-]{43}$/)
    expect(first.token).not.toBe(second.token)
    expect(first.id).toMatch(/^[0-9a-f]{64}$/)
    expect(first.id).not.toContain(first.token)
    expect(tokens.idOf(first.token)).toBe(first.id)
  })
})
