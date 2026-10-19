import { beforeEach, describe, expect, it } from 'vitest'
import { ChangeSizePriceUseCase } from '@/application/use-cases/size-prices/change-size-price-use-case'
import { SizePriceZeroPriceError } from '@/domain/errors/size-price-zero-price.error'
import { fakeRepositories, type FakeRepositories } from '@test/fakes/fake-repositories'
import { FakeClock, FakeUnitOfWork, SequentialIdGenerator } from '@test/fakes/fake-services'

describe('ChangeSizePriceUseCase', () => {
  let repositories: FakeRepositories
  let clock: FakeClock
  let useCase: ChangeSizePriceUseCase

  beforeEach(() => {
    const fakes = fakeRepositories()
    repositories = fakes
    clock = new FakeClock(new Date('2026-10-01T12:00:00Z'))
    useCase = new ChangeSizePriceUseCase(
      new FakeUnitOfWork(fakes),
      clock,
      new SequentialIdGenerator(),
    )
  })

  it('creates the first price of a size from now on', async () => {
    const output = await useCase.execute({ size: 'medium', priceCents: 2000 })

    expect(output).toEqual({
      size: 'medium',
      priceCents: 2000,
      validFrom: '2026-10-01T12:00:00.000Z',
    })
  })

  it('closes the current price and opens the new one at the same instant', async () => {
    await useCase.execute({ size: 'medium', priceCents: 2000 })
    clock.set('2026-10-17T15:00:00Z')

    await useCase.execute({ size: 'medium', priceCents: 2200 })

    const { sizePrices } = repositories
    expect(await sizePrices.findValidAt('medium', new Date('2026-10-17T14:59:59Z'))).toMatchObject({
      price: { cents: 2000 },
      validTo: new Date('2026-10-17T15:00:00Z'),
    })
    expect(await sizePrices.findOpenBySize('medium')).toMatchObject({
      price: { cents: 2200 },
      validFrom: new Date('2026-10-17T15:00:00Z'),
    })
  })

  it('keeps the current price when it does not change', async () => {
    const first = await useCase.execute({ size: 'large', priceCents: 2500 })
    clock.set('2026-10-17T15:00:00Z')

    const second = await useCase.execute({ size: 'large', priceCents: 2500 })

    expect(second).toEqual(first)
    expect(repositories.sizePrices.store.all()).toHaveLength(1)
  })

  it('rejects a zero price without touching the current one', async () => {
    await useCase.execute({ size: 'small', priceCents: 1500 })
    clock.set('2026-10-17T15:00:00Z')

    await expect(useCase.execute({ size: 'small', priceCents: 0 })).rejects.toBeInstanceOf(
      SizePriceZeroPriceError,
    )
    expect(await repositories.sizePrices.findOpenBySize('small')).toMatchObject({
      price: { cents: 1500 },
    })
  })
})
