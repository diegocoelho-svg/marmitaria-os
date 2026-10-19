import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  date,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { dishes } from '@/infrastructure/database/postgresql/schema/dishes'
import {
  orderOriginEnum,
  orderStatusEnum,
  sizeEnum,
} from '@/infrastructure/database/postgresql/schema/enums'

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey(),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    ticket: bigint('ticket', { mode: 'number' }).notNull(),
    origin: orderOriginEnum('origin').notNull(),
    customerName: text('customer_name'),
    status: orderStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (table) => [
    unique('orders_business_date_ticket_unique').on(table.businessDate, table.ticket),
    check('orders_ticket_positive', sql`${table.ticket} >= 1`),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id),
    dishName: text('dish_name').notNull(),
    size: sizeEnum('size').notNull(),
    unitPriceCents: bigint('unit_price_cents', { mode: 'number' }).notNull(),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    note: text('note'),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.position] }),
    check('order_items_position_non_negative', sql`${table.position} >= 0`),
    check('order_items_unit_price_cents_positive', sql`${table.unitPriceCents} > 0`),
    check('order_items_quantity_positive', sql`${table.quantity} >= 1`),
  ],
)

export const orderItemAdjustments = pgTable(
  'order_item_adjustments',
  {
    orderId: uuid('order_id').notNull(),
    itemPosition: integer('item_position').notNull(),
    position: integer('position').notNull(),
    adjustmentId: uuid('adjustment_id').notNull(),
    label: text('label').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.itemPosition, table.position] }),
    unique('order_item_adjustments_item_adjustment_unique').on(
      table.orderId,
      table.itemPosition,
      table.adjustmentId,
    ),
    foreignKey({
      name: 'order_item_adjustments_item_fk',
      columns: [table.orderId, table.itemPosition],
      foreignColumns: [orderItems.orderId, orderItems.position],
    }).onDelete('cascade'),
    check('order_item_adjustments_position_non_negative', sql`${table.position} >= 0`),
  ],
)
