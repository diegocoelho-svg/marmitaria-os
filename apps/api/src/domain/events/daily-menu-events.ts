import type { DomainEvent } from './domain-event'

type DailyMenuSnapshot = Readonly<{
  date: string
  sourceMenuId: string
  dishIds: readonly string[]
}>

export type DailyMenuPublished = DomainEvent<'daily_menu.published'> & DailyMenuSnapshot

export type DailyMenuUpdated = DomainEvent<'daily_menu.updated'> & DailyMenuSnapshot

export type DailyMenuEvent = DailyMenuPublished | DailyMenuUpdated
