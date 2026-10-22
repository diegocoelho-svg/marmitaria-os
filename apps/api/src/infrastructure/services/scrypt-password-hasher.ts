import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { PasswordHasher } from '@/application/ports/password-hasher'

type ScryptCost = {
  N: number
  r: number
  p: number
}

const KEY_LENGTH = 64
const SALT_LENGTH = 16
const DEFAULT_COST: ScryptCost = { N: 16_384, r: 8, p: 1 }

export class ScryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: ScryptCost = DEFAULT_COST) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH)
    const key = await derive(password, salt, this.cost)
    const { N, r, p } = this.cost

    return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$')
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, N, r, p, salt, key] = hash.split('$')

    if (algorithm !== 'scrypt' || !salt || !key) {
      return false
    }

    const expected = Buffer.from(key, 'base64')
    const actual = await derive(password, Buffer.from(salt, 'base64'), {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    })

    return actual.length === expected.length && timingSafeEqual(actual, expected)
  }
}

function derive(password: string, salt: Buffer, cost: ScryptCost): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, cost, (error, key) => (error ? reject(error) : resolve(key)))
  })
}
