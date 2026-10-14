import { AggregateRoot } from '../shared/aggregate-root'
import { DomainError } from '../errors/domain-error'
import { toTimestamp } from '../shared/instant'
import { LocalDate } from '../value-objects/local-date'
import type { DailyMenuEvent } from '../events/daily-menu-events'
import { dishSelection, sameSelection } from '../shared/dish-selection'
import type { Menu } from './menu'

type FromMenuInput = {
  id: string
  date: LocalDate
  menu: Menu
  now: Date
}

type DailyMenuProps = {
  id: string
  date: LocalDate
  sourceMenuId: string
  dishIds: readonly string[]
}

export class DailyMenu extends AggregateRoot<DailyMenuEvent> {
  #sourceMenuId: string
  #dishIds: string[]

  private constructor(
    readonly id: string,
    readonly date: LocalDate,
    sourceMenuId: string,
    dishIds: readonly string[],
  ) {
    super()
    this.#sourceMenuId = sourceMenuId
    this.#dishIds = dishSelection(dishIds)
  }

  static fromMenu(input: FromMenuInput): DailyMenu {
    assertEditable(input.date, input.now)
    assertApplicable(input.menu)

    const dailyMenu = new DailyMenu(input.id, input.date, input.menu.id, input.menu.dishIds)
    dailyMenu.record({ type: 'daily_menu.published', ...dailyMenu.snapshot(input.now) })

    return dailyMenu
  }

  static restore(props: DailyMenuProps): DailyMenu {
    return new DailyMenu(props.id, props.date, props.sourceMenuId, props.dishIds)
  }

  get sourceMenuId(): string {
    return this.#sourceMenuId
  }

  get dishIds(): readonly string[] {
    return [...this.#dishIds]
  }

  applyMenu(menu: Menu, now: Date): void {
    assertEditable(this.date, now)
    assertApplicable(menu)
    this.change(menu.id, menu.dishIds, now)
  }

  setDishes(dishIds: readonly string[], now: Date): void {
    assertEditable(this.date, now)
    this.change(this.#sourceMenuId, dishSelection(dishIds), now)
  }

  private change(sourceMenuId: string, dishIds: readonly string[], now: Date): void {
    if (sourceMenuId === this.#sourceMenuId && sameSelection(dishIds, this.#dishIds)) return

    this.#sourceMenuId = sourceMenuId
    this.#dishIds = [...dishIds]
    this.record({ type: 'daily_menu.updated', ...this.snapshot(now) })
  }

  private snapshot(now: Date) {
    return {
      aggregateId: this.id,
      occurredAt: new Date(toTimestamp(now)),
      date: this.date.toString(),
      sourceMenuId: this.#sourceMenuId,
      dishIds: [...this.#dishIds],
    }
  }
}

function assertEditable(date: LocalDate, now: Date): void {
  if (date.isBefore(LocalDate.fromInstant(now))) {
    throw new DomainError('daily_menu.past_date', 'Past daily menus cannot be changed')
  }
}

function assertApplicable(menu: Menu): void {
  if (menu.isArchived) {
    throw new DomainError('menu.archived', 'Menu is archived')
  }
}
