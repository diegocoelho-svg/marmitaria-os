import { DailyMenuPastDateError } from '@/domain/errors/daily-menu-past-date.error'
import { MenuArchivedError } from '@/domain/errors/menu-archived.error'
import type { DailyMenuEvent } from '@/domain/events/daily-menu-events'
import { AggregateRoot } from '@/domain/shared/aggregate-root'
import { copyInstant } from '@/domain/shared/instant'
import { DishSelectionVO } from '@/domain/value-objects/dish-selection-vo'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { MenuEntity } from '@/domain/entities/menu-entity'

export type DailyMenuEntityProps = {
  readonly date: LocalDateVO
  sourceMenuId: string
  dishes: DishSelectionVO
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
    dishes: DishSelectionVO,
  ) {
    super(id, { date, sourceMenuId, dishes })
  }

  static fromMenu(input: FromMenuInput): DailyMenuEntity {
    assertEditable(input.date, input.now)
    assertApplicable(input.menu)

    const dailyMenu = new DailyMenuEntity(input.id, input.date, input.menu.id, input.menu.dishes)
    dailyMenu.record({ type: 'daily_menu.published', ...dailyMenu.snapshot(input.now) })

    return dailyMenu
  }

  static restore(input: RestoreDailyMenuInput): DailyMenuEntity {
    return new DailyMenuEntity(
      input.id,
      input.date,
      input.sourceMenuId,
      DishSelectionVO.of(input.dishIds),
    )
  }

  get date(): LocalDateVO {
    return this.props.date
  }

  get sourceMenuId(): string {
    return this.props.sourceMenuId
  }

  get dishIds(): readonly string[] {
    return this.props.dishes.dishIds
  }

  applyMenu(menu: MenuEntity, now: Date): void {
    assertEditable(this.props.date, now)
    assertApplicable(menu)
    this.change(menu.id, menu.dishes, now)
  }

  setDishes(dishIds: readonly string[], now: Date): void {
    assertEditable(this.props.date, now)
    this.change(this.props.sourceMenuId, DishSelectionVO.of(dishIds), now)
  }

  private change(sourceMenuId: string, dishes: DishSelectionVO, now: Date): void {
    if (sourceMenuId === this.props.sourceMenuId && dishes.equals(this.props.dishes)) return

    this.props.sourceMenuId = sourceMenuId
    this.props.dishes = dishes
    this.record({ type: 'daily_menu.updated', ...this.snapshot(now) })
  }

  private snapshot(now: Date) {
    return {
      aggregateId: this.id,
      occurredAt: copyInstant(now),
      date: this.props.date.toString(),
      sourceMenuId: this.props.sourceMenuId,
      dishIds: this.props.dishes.dishIds,
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
