import type { SessionEntity } from '@/domain/entities/session-entity'

export interface SessionRepository {
  findById(id: string): Promise<SessionEntity | null>
  create(session: SessionEntity): Promise<void>
  renew(session: SessionEntity, previousExpiry: Date): Promise<boolean>
  delete(id: string): Promise<void>
  deleteExpired(id: string, now: Date): Promise<void>
}
