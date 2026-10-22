import { and, eq } from 'drizzle-orm'
import type { SessionEntity } from '@/domain/entities/session-entity'
import type { SessionRepository } from '@/domain/repositories/session-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { SessionMapper } from '@/infrastructure/database/postgresql/mappers/session-mapper'
import { sessions } from '@/infrastructure/database/postgresql/schema'

export class PgSessionRepository implements SessionRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<SessionEntity | null> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id))

    return row ? SessionMapper.fromPersistence(row) : null
  }

  async create(session: SessionEntity): Promise<void> {
    await this.db.insert(sessions).values(SessionMapper.toPersistence(session))
  }

  async renew(session: SessionEntity, previousExpiry: Date): Promise<boolean> {
    const renewed = await this.db
      .update(sessions)
      .set({ expiresAt: session.expiresAt })
      .where(and(eq(sessions.id, session.id), eq(sessions.expiresAt, previousExpiry)))
      .returning({ id: sessions.id })

    return renewed.length > 0
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, id))
  }
}
