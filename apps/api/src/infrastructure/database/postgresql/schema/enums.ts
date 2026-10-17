import { pgEnum } from 'drizzle-orm/pg-core'
import { orderOrigins } from '@/domain/entities/order-entity'
import { orderStatuses } from '@/domain/value-objects/order-status'
import { sizes } from '@/domain/value-objects/size'

export const sizeEnum = pgEnum('size', sizes)

export const orderStatusEnum = pgEnum('order_status', orderStatuses)

export const orderOriginEnum = pgEnum('order_origin', orderOrigins)
