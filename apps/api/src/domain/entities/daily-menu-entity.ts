import { DailyMenuPastDateError } from '../errors/daily-menu-past-date.error'
import { MenuArchivedError } from '../errors/menu-archived.error'
import type { DailyMenuEvent } from '../events/daily-menu-events'
import { AggregateRoot } from '../shared/aggregate-root'
import { dishSelection, sameSelection } from '../shared/dish-selection'
import { copyInstant } from '../shared/instant'
import { LocalDateVO } from '../value-objects/local-date-vo'
import type { MenuEntity } from './menu-entity'

export type DailyMenuEntityProps = {
  readonly date: LocalDateVO
  sourceMenuId: string
  dishIds: string[]
}

export type FromMenuInput = {
  id: string
  date: LocalDateVO
  menu: MenuEntity
  now: Date
}

export type RestoreDailyMenuInput = {
  id: string
  date: LocalDateVO
  sourceMenuId: string
  dishIds: readonly string[]
}

export class DailyMenuEntity extends AggregateRoot<DailyMenuEntityProps, DailyMenuEvent> {
  private constructor(
    id: string,
    date: LocalDateVO,
    sourceMenuId: string,
    dishIds: readonly string[],
  ) {
    super(id, { date, sourceMenuId, dishIds: dishSelection(dishIds) })
  }

  static fromMenu(input: FromMenuInput): DailyMenuEntity {
    assertEditable(input.date, input.now)
    assertApplicable(input.menu)

    const dailyMenu = new DailyMenuEntity(input.id, input.date, input.menu.id, input.menu.dishIds)
    dailyMenu.record({ type: 'daily_menu.published', ...dailyMenu.snapshot(input.now) })

    return dailyMenu
  }

  static restore(input: RestoreDailyMenuInput): DailyMenuEntity {
    return new DailyMenuEntity(input.id, input.date, input.sourceMenuId, input.dishIds)
  }

  get date(): LocalDateVO {
    return this.props.date
  }

  get sourceMenuId(): string {
    return this.props.sourceMenuId
  }

  get dishIds(): readonly string[] {
    return [...this.props.dishIds]
  }

  applyMenu(menu: MenuEntity, now: Date): void {
    assertEditable(this.props.date, now)
    assertApplicable(menu)
    this.change(menu.id, menu.dishIds, now)
  }

  setDishes(dishIds: readonly string[], now: Date): void {
    assertEditable(this.props.date, now)
    this.change(this.props.sourceMenuId, dishSelection(dishIds), now)
  }

  private change(sourceMenuId: string, dishIds: readonly string[], now: Date): void {
    if (sourceMenuId === this.props.sourceMenuId && sameSelection(dishIds, this.props.dishIds)) {
      return
    }

    this.props.sourceMenuId = sourceMenuId
    this.props.dishIds = [...dishIds]
    this.record({ type: 'daily_menu.updated', ...this.snapshot(now) })
  }

  private snapshot(now: Date) {
    return {
      aggregateId: this.id,
      occurredAt: copyInstant(now),
      date: this.props.date.toString(),
      sourceMenuId: this.props.sourceMenuId,
      dishIds: [...this.props.dishIds],
    }
  }
}

function assertEditable(date: LocalDateVO, now: Date): void {
  if (date.isBefore(LocalDateVO.fromInstant(now))) {
    throw new DailyMenuPastDateError()
  }
}

function assertApplicable(menu: MenuEntity): void {
  if (menu.isArchived) {
    throw new MenuArchivedError()
  }
}
