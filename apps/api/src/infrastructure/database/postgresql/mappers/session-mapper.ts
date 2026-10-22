import { SessionEntity } from '@/domain/entities/session-entity'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { sessions } from '@/infrastructure/database/postgresql/schema'

type SessionRow = typeof sessions.$inferSelect

export class SessionMapper {
  static fromPersistence(row: SessionRow): SessionEntity {
    return restoreRecord('sessions', row.id, () =>
      SessionEntity.restore({ id: row.id, userId: row.userId, expiresAt: row.expiresAt }),
    )
  }

  static toPersistence(session: SessionEntity): SessionRow {
    return { id: session.id, userId: session.userId, expiresAt: session.expiresAt }
  }
}
