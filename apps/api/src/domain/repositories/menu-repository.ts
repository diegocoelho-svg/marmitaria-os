import type { MenuEntity } from '@/domain/entities/menu-entity'

export interface MenuRepository {
  findById(id: string): Promise<MenuEntity | null>
  findAllActive(): Promise<MenuEntity[]>
  existsActiveByNameKey(nameKey: string, exceptId?: string): Promise<boolean>
  create(menu: MenuEntity): Promise<void>
  update(menu: MenuEntity): Promise<void>
}
