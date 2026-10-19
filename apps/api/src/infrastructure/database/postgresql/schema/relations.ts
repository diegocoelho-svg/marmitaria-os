import { relations } from 'drizzle-orm'
import {
  dailyMenuDishes,
  dailyMenus,
} from '@/infrastructure/database/postgresql/schema/daily-menus'
import { menuDishes, menus } from '@/infrastructure/database/postgresql/schema/menus'
import {
  orderItemAdjustments,
  orderItems,
  orders,
} from '@/infrastructure/database/postgresql/schema/orders'

export const menusRelations = relations(menus, ({ many }) => ({
  dishes: many(menuDishes),
}))

export const menuDishesRelations = relations(menuDishes, ({ one }) => ({
  menu: one(menus, { fields: [menuDishes.menuId], references: [menus.id] }),
}))

export const dailyMenusRelations = relations(dailyMenus, ({ many }) => ({
  dishes: many(dailyMenuDishes),
}))

export const dailyMenuDishesRelations = relations(dailyMenuDishes, ({ one }) => ({
  dailyMenu: one(dailyMenus, {
    fields: [dailyMenuDishes.dailyMenuId],
    references: [dailyMenus.id],
  }),
}))

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  adjustments: many(orderItemAdjustments),
}))

export const orderItemAdjustmentsRelations = relations(orderItemAdjustments, ({ one }) => ({
  item: one(orderItems, {
    fields: [orderItemAdjustments.orderId, orderItemAdjustments.itemPosition],
    references: [orderItems.orderId, orderItems.position],
  }),
}))
