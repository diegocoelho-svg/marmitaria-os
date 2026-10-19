import type { MenuEntity } from '@/domain/entities/menu-entity'

export type MenuOutput = {
  id: string
  name: string
  dishIds: string[]
  archivedAt: string | null
}

export const MenuOutput = {
  from(menu: MenuEntity): MenuOutput {
    return {
      id: menu.id,
      name: menu.name,
      dishIds: [...menu.dishIds],
      archivedAt: menu.archivedAt?.toISOString() ?? null,
    }
  },
}
