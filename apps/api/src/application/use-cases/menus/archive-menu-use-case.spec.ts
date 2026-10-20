import { beforeEach, describe, expect, it } from 'vitest'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import { ArchiveMenuUseCase } from '@/application/use-cases/menus/archive-menu-use-case'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { FakeMenuRepository } from '@test/fakes/fake-repositories'
import { FakeClock } from '@test/fakes/fake-services'

describe('ArchiveMenuUseCase', () => {
  let menus: FakeMenuRepository
  let clock: FakeClock
  let useCase: ArchiveMenuUseCase

  beforeEach(async () => {
    menus = new FakeMenuRepository()
    clock = new FakeClock(new Date('2026-10-17T15:00:00Z'))
    useCase = new ArchiveMenuUseCase(menus, clock)
    await menus.create(MenuEntity.create({ id: 'a', name: 'Cardápio A', dishIds: ['frango'] }))
  })

  it('archives a menu at the current instant', async () => {
    const output = await useCase.execute({ id: 'a' })

    expect(output.archivedAt).toBe('2026-10-17T15:00:00.000Z')
    expect(await menus.findAllActive()).toEqual([])
  })

  it('keeps the first archive instant when archived again', async () => {
    await useCase.execute({ id: 'a' })
    clock.set('2026-10-18T15:00:00Z')

    const output = await useCase.execute({ id: 'a' })

    expect(output.archivedAt).toBe('2026-10-17T15:00:00.000Z')
  })

  it('rejects an unknown menu', async () => {
    await expect(useCase.execute({ id: 'z' })).rejects.toBeInstanceOf(MenuNotFoundError)
  })
})
