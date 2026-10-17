import type { SizePriceEntity } from '@/domain/entities/size-price-entity'
import type { Size } from '@/domain/value-objects/size'

export interface SizePriceRepository {
  findValidAt(size: Size, at: Date): Promise<SizePriceEntity | null>
  findOpenBySize(size: Size): Promise<SizePriceEntity | null>
  create(price: SizePriceEntity): Promise<void>
  close(price: SizePriceEntity): Promise<void>
}
