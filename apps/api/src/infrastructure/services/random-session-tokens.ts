import { createHash, randomBytes } from 'node:crypto'
import type { IssuedToken, SessionTokens } from '@/application/ports/session-tokens'

const TOKEN_BYTES = 32

export class RandomSessionTokens implements SessionTokens {
  issue(): IssuedToken {
    const token = randomBytes(TOKEN_BYTES).toString('base64url')

    return { token, id: this.idOf(token) }
  }

  idOf(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
