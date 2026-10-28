import { describe, expect, it } from 'vitest'
import { ScryptPasswordHasher } from '@/infrastructure/services/scrypt-password-hasher'

const hasher = new ScryptPasswordHasher({ N: 1024, r: 8, p: 1 })

describe('ScryptPasswordHasher', () => {
  it('verifies the password it hashed and nothing else', async () => {
    const hash = await hasher.hash('segredo-forte')

    expect(hash).toMatch(/^scrypt\$1024\$8\$1\$/)
    expect(hash).not.toContain('segredo-forte')
    expect(await hasher.verify('segredo-forte', hash)).toBe(true)
    expect(await hasher.verify('segredo-fraco', hash)).toBe(false)
  })

  it('salts every hash', async () => {
    expect(await hasher.hash('segredo-forte')).not.toBe(await hasher.hash('segredo-forte'))
  })

  it('rejects hashes in an unknown format', async () => {
    expect(await hasher.verify('segredo-forte', 'segredo-forte')).toBe(false)
    expect(await hasher.verify('segredo-forte', 'bcrypt$10$abc')).toBe(false)
  })
})
