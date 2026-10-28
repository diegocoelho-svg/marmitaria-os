import type { SessionTokenInput } from '@/application/dtos/auth/session-token-input'
import type { SessionTokens } from '@/application/ports/session-tokens'
import type { SessionRepository } from '@/domain/repositories/session-repository'

export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(input: SessionTokenInput): Promise<void> {
    await this.sessions.delete(this.tokens.idOf(input.token))
  }
}
