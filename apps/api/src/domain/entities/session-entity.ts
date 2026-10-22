import { Entity } from '@/domain/shared/entity'
import { copyInstant, toTimestamp } from '@/domain/shared/instant'

const DAY_MS = 24 * 60 * 60 * 1000
const LIFETIME_MS = 30 * DAY_MS
const RENEWAL_INTERVAL_MS = DAY_MS

export type SessionEntityProps = {
  readonly userId: string
  expiresAt: Date
}

export type StartSessionInput = {
  id: string
  userId: string
  now: Date
}

export type RestoreSessionInput = {
  id: string
  userId: string
  expiresAt: Date
}

export class SessionEntity extends Entity<SessionEntityProps> {
  private constructor(id: string, userId: string, expiresAt: Date) {
    super(id, { userId, expiresAt: copyInstant(expiresAt) })
  }

  static start(input: StartSessionInput): SessionEntity {
    return new SessionEntity(input.id, input.userId, expiryFrom(input.now))
  }

  static restore(input: RestoreSessionInput): SessionEntity {
    return new SessionEntity(input.id, input.userId, input.expiresAt)
  }

  get userId(): string {
    return this.props.userId
  }

  get expiresAt(): Date {
    return copyInstant(this.props.expiresAt)
  }

  isExpiredAt(now: Date): boolean {
    return toTimestamp(now) >= toTimestamp(this.props.expiresAt)
  }

  needsRenewalAt(now: Date): boolean {
    return toTimestamp(this.props.expiresAt) - toTimestamp(now) <= LIFETIME_MS - RENEWAL_INTERVAL_MS
  }

  renew(now: Date): void {
    this.props.expiresAt = expiryFrom(now)
  }
}

function expiryFrom(now: Date): Date {
  return new Date(toTimestamp(now) + LIFETIME_MS)
}
