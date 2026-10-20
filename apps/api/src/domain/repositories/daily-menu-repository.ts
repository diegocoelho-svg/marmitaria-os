import type { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export interface DailyMenuRepository {
  findById(id: string): Promise<DailyMenuEntity | null>
  findByDate(date: LocalDateVO): Promise<DailyMenuEntity | null>
  findBetween(from: LocalDateVO, to: LocalDateVO): Promise<DailyMenuEntity[]>
  create(dailyMenu: DailyMenuEntity): Promise<void>
  update(dailyMenu: DailyMenuEntity): Promise<void>
}
