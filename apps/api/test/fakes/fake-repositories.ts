import { DailyMenuDateTakenError } from '@/application/errors/daily-menu-date-taken.error'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import { UsernameTakenError } from '@/application/errors/username-taken.error'
import type { Repositories } from '@/application/ports/unit-of-work'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { OrderEntity } from '@/domain/entities/order-entity'
import { SessionEntity } from '@/domain/entities/session-entity'
import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { UserEntity } from '@/domain/entities/user-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'
import type { OrderRepository } from '@/domain/repositories/order-repository'
import type { SessionRepository } from '@/domain/repositories/session-repository'
import type { SizePriceRepository } from '@/domain/repositories/size-price-repository'
import type { TicketCounterRepository } from '@/domain/repositories/ticket-counter-repository'
import type { UserRepository } from '@/domain/repositories/user-repository'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { OrderStatus } from '@/domain/value-objects/order-status'
import type { Size } from '@/domain/value-objects/size'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import { InMemoryStore } from '@test/fakes/in-memory-store'

const byName = (a: string, b: string) => a.localeCompare(b)

export class FakeDishRepository implements DishRepository {
  readonly store = new InMemoryStore<DishEntity>((dish) =>
    DishEntity.restore({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      active: dish.active,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findByIds(ids: readonly string[]) {
    return this.store.all().filter((dish) => ids.includes(dish.id))
  }

  async findAll() {
    return this.store.all().sort((a, b) => byName(a.name, b.name))
  }

  async create(dish: DishEntity) {
    this.store.insert(dish)
  }

  async update(dish: DishEntity) {
    this.store.replace(dish)
  }
}

export class FakeAdjustmentRepository implements AdjustmentRepository {
  readonly store = new InMemoryStore<AdjustmentEntity>((adjustment) =>
    AdjustmentEntity.restore({
      id: adjustment.id,
      label: adjustment.label,
      active: adjustment.active,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findByIds(ids: readonly string[]) {
    return this.store.all().filter((adjustment) => ids.includes(adjustment.id))
  }

  async findAll() {
    return this.store.all().sort((a, b) => byName(a.label, b.label))
  }

  async create(adjustment: AdjustmentEntity) {
    this.store.insert(adjustment)
  }

  async update(adjustment: AdjustmentEntity) {
    this.store.replace(adjustment)
  }
}

export class FakeSizePriceRepository implements SizePriceRepository {
  readonly store = new InMemoryStore<SizePriceEntity>((price) =>
    SizePriceEntity.restore({
      id: price.id,
      size: price.size,
      price: price.price,
      validFrom: price.validFrom,
      validTo: price.validTo,
    }),
  )

  async findValidAt(size: Size, at: Date) {
    return this.store.all().find((price) => price.size === size && price.isValidAt(at)) ?? null
  }

  async findOpenBySize(size: Size) {
    return this.store.all().find((price) => price.size === size && price.isOpen) ?? null
  }

  async create(price: SizePriceEntity) {
    this.store.insert(price)
  }

  async close(price: SizePriceEntity) {
    if (price.isOpen) {
      throw new TypeError('Only a closed size price can be stored as closed')
    }

    if (!this.store.get(price.id)?.isOpen) {
      throw new StaleWriteError('SizePrice', price.id)
    }

    this.store.replace(price)
  }
}

export class FakeMenuRepository implements MenuRepository {
  readonly store = new InMemoryStore<MenuEntity>((menu) =>
    MenuEntity.restore({
      id: menu.id,
      name: menu.name,
      dishIds: menu.dishIds,
      archivedAt: menu.archivedAt,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findAllActive() {
    return this.store
      .all()
      .filter((menu) => !menu.isArchived)
      .sort((a, b) => byName(a.nameKey, b.nameKey))
  }

  async existsActiveByNameKey(nameKey: string, exceptId?: string) {
    return this.store
      .all()
      .some((menu) => !menu.isArchived && menu.nameKey === nameKey && menu.id !== exceptId)
  }

  async create(menu: MenuEntity) {
    this.assertNameAvailable(menu)
    this.store.insert(menu)
  }

  async update(menu: MenuEntity) {
    if (this.store.get(menu.id)?.isArchived !== false) {
      throw new StaleWriteError('Menu', menu.id)
    }

    this.assertNameAvailable(menu)
    this.store.replace(menu)
  }

  private assertNameAvailable(menu: MenuEntity) {
    const taken = this.store
      .all()
      .some((other) => !other.isArchived && other.nameKey === menu.nameKey && other.id !== menu.id)

    if (!menu.isArchived && taken) {
      throw new MenuNameTakenError(menu.name)
    }
  }
}

export class FakeDailyMenuRepository implements DailyMenuRepository {
  readonly store = new InMemoryStore<DailyMenuEntity>((dailyMenu) =>
    DailyMenuEntity.restore({
      id: dailyMenu.id,
      date: dailyMenu.date,
      sourceMenuId: dailyMenu.sourceMenuId,
      dishIds: dailyMenu.dishIds,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findByDate(date: LocalDateVO) {
    return this.store.all().find((dailyMenu) => dailyMenu.date.equals(date)) ?? null
  }

  async findBetween(from: LocalDateVO, to: LocalDateVO) {
    return this.store
      .all()
      .filter((dailyMenu) => !dailyMenu.date.isBefore(from) && !to.isBefore(dailyMenu.date))
      .sort((a, b) => byName(a.date.toString(), b.date.toString()))
  }

  async create(dailyMenu: DailyMenuEntity) {
    if (await this.findByDate(dailyMenu.date)) {
      throw new DailyMenuDateTakenError(dailyMenu.date.toString())
    }

    this.store.insert(dailyMenu)
  }

  async update(dailyMenu: DailyMenuEntity) {
    this.store.replace(dailyMenu)
  }
}

export class FakeOrderRepository implements OrderRepository {
  readonly store = new InMemoryStore<OrderEntity>((order) =>
    OrderEntity.restore({
      id: order.id,
      businessDate: order.businessDate,
      ticket: order.ticket,
      origin: order.origin,
      customerName: order.customerName,
      items: order.items,
      status: order.status,
      createdAt: order.createdAt,
      startedAt: order.startedAt,
      readyAt: order.readyAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findByBusinessDate(
    businessDate: LocalDateVO,
    statuses?: readonly OrderStatus[] | undefined,
  ) {
    return this.store
      .all()
      .filter((order) => order.businessDate.equals(businessDate))
      .filter((order) => !statuses || statuses.includes(order.status))
      .sort((a, b) => a.ticket.value - b.ticket.value)
  }

  async create(order: OrderEntity) {
    this.store.insert(order)
  }

  async update(order: OrderEntity, expectedStatus: OrderStatus) {
    if (this.store.get(order.id)?.status !== expectedStatus) {
      throw new StaleWriteError('Order', order.id)
    }

    this.store.replace(order)
  }
}

type TicketCounter = { id: string; last: number }

export class FakeTicketCounterRepository implements TicketCounterRepository {
  readonly store = new InMemoryStore<TicketCounter>((counter) => ({ ...counter }))

  async next(businessDate: LocalDateVO) {
    const current = this.store.get(businessDate.toString())
    const counter = { id: businessDate.toString(), last: (current?.last ?? 0) + 1 }

    if (current) {
      this.store.replace(counter)
    } else {
      this.store.insert(counter)
    }

    return TicketNumberVO.of(counter.last)
  }
}

export class FakeUserRepository implements UserRepository {
  readonly store = new InMemoryStore<UserEntity>((user) =>
    UserEntity.restore({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      active: user.active,
      passwordHash: user.passwordHash,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async findByUsername(username: string) {
    return this.store.all().find((user) => user.username === username) ?? null
  }

  async create(user: UserEntity) {
    if (await this.findByUsername(user.username)) {
      throw new UsernameTakenError(user.username)
    }

    this.store.insert(user)
  }
}

export class FakeSessionRepository implements SessionRepository {
  readonly store = new InMemoryStore<SessionEntity>((session) =>
    SessionEntity.restore({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    }),
  )

  async findById(id: string) {
    return this.store.get(id)
  }

  async create(session: SessionEntity) {
    this.store.insert(session)
  }

  async renew(session: SessionEntity, previousExpiry: Date) {
    if (this.store.get(session.id)?.expiresAt.getTime() !== previousExpiry.getTime()) {
      return false
    }

    this.store.replace(session)

    return true
  }

  async delete(id: string) {
    this.store.remove(id)
  }
}

export type FakeRepositories = {
  dishes: FakeDishRepository
  adjustments: FakeAdjustmentRepository
  sizePrices: FakeSizePriceRepository
  menus: FakeMenuRepository
  dailyMenus: FakeDailyMenuRepository
  orders: FakeOrderRepository
  tickets: FakeTicketCounterRepository
  users: FakeUserRepository
  sessions: FakeSessionRepository
}

export function fakeRepositories(): FakeRepositories & Repositories {
  return {
    dishes: new FakeDishRepository(),
    adjustments: new FakeAdjustmentRepository(),
    sizePrices: new FakeSizePriceRepository(),
    menus: new FakeMenuRepository(),
    dailyMenus: new FakeDailyMenuRepository(),
    orders: new FakeOrderRepository(),
    tickets: new FakeTicketCounterRepository(),
    users: new FakeUserRepository(),
    sessions: new FakeSessionRepository(),
  }
}
