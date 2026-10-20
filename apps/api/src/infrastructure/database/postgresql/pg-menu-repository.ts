import { and, asc, eq, isNull, ne } from 'drizzle-orm'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import type { MenuEntity } from '@/domain/entities/menu-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import type { MenuRepository } from '@/domain/repositories/menu-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { violatesConstraint } from '@/infrastructure/database/postgresql/errors/constraint-violation'
import { MenuMapper } from '@/infrastructure/database/postgresql/mappers/menu-mapper'
import { menuDishes, menus } from '@/infrastructure/database/postgresql/schema'

const ACTIVE_NAME_UNIQUE = 'menus_active_name_key_unique'

export class PgMenuRepository implements MenuRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<MenuEntity | null> {
    const record = await this.db.query.menus.findFirst({
      where: eq(menus.id, id),
      with: { dishes: { orderBy: asc(menuDishes.position) } },
    })

    return record ? MenuMapper.fromPersistence(record) : null
  }

  async findAllActive(): Promise<MenuEntity[]> {
    const records = await this.db.query.menus.findMany({
      where: isNull(menus.archivedAt),
      orderBy: [asc(menus.nameKey), asc(menus.id)],
      with: { dishes: { orderBy: asc(menuDishes.position) } },
    })

    return records.map((record) => MenuMapper.fromPersistence(record))
  }

  async existsActiveByNameKey(nameKey: string, exceptId?: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: menus.id })
      .from(menus)
      .where(
        and(
          eq(menus.nameKey, nameKey),
          isNull(menus.archivedAt),
          exceptId === undefined ? undefined : ne(menus.id, exceptId),
        ),
      )
      .limit(1)

    return row !== undefined
  }

  async create(menu: MenuEntity): Promise<void> {
    const persistence = MenuMapper.toPersistence(menu)

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(menus).values(persistence.menu)
        await tx.insert(menuDishes).values(persistence.dishes)
      })
    } catch (error) {
      if (error instanceof Error && violatesConstraint(error, ACTIVE_NAME_UNIQUE)) {
        throw new MenuNameTakenError(menu.name)
      }

      throw error
    }
  }

  async update(menu: MenuEntity): Promise<void> {
    const { menu: row, dishes } = MenuMapper.toPersistence(menu)
    const { id, ...changes } = row

    try {
      await this.db.transaction(async (tx) => {
        const updated = await tx
          .update(menus)
          .set(changes)
          .where(and(eq(menus.id, id), isNull(menus.archivedAt)))
          .returning({ id: menus.id })

        if (updated.length === 0) {
          throw new StaleWriteError('Menu', id)
        }

        await tx.delete(menuDishes).where(eq(menuDishes.menuId, id))
        await tx.insert(menuDishes).values(dishes)
      })
    } catch (error) {
      if (error instanceof Error && violatesConstraint(error, ACTIVE_NAME_UNIQUE)) {
        throw new MenuNameTakenError(menu.name)
      }

      throw error
    }
  }
}
