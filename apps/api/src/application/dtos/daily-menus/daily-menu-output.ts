import type { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'

export type DailyMenuOutput = {
  id: string
  date: string
  sourceMenuId: string
  dishIds: string[]
}

export const DailyMenuOutput = {
  from(dailyMenu: DailyMenuEntity): DailyMenuOutput {
    return {
      id: dailyMenu.id,
      date: dailyMenu.date.toString(),
      sourceMenuId: dailyMenu.sourceMenuId,
      dishIds: [...dailyMenu.dishIds],
    }
  },
}
