import { describe, expect, it } from 'vitest'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { PgTicketCounterRepository } from '@/infrastructure/database/postgresql/pg-ticket-counter-repository'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgTicketCounterRepository', () => {
  const db = useTestDatabase()
  const repository = new PgTicketCounterRepository(db)
  const monday = LocalDateVO.parse('2026-10-19')
  const tuesday = LocalDateVO.parse('2026-10-20')

  const values = async (date: LocalDateVO, count: number) => {
    const tickets = []

    for (let index = 0; index < count; index += 1) {
      tickets.push((await repository.next(date)).value)
    }

    return tickets
  }

  it('numbers the tickets of a day from one', async () => {
    expect(await values(monday, 3)).toEqual([1, 2, 3])
  })

  it('restarts the numbering on each business date', async () => {
    await values(monday, 2)

    expect(await values(tuesday, 2)).toEqual([1, 2])
    expect(await values(monday, 1)).toEqual([3])
  })

  it('never hands the same ticket to concurrent reservations', async () => {
    const tickets = await Promise.all(Array.from({ length: 20 }, () => repository.next(monday)))

    expect(tickets.map((ticket) => ticket.value).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    )
  })

  it('gives the ticket back when the transaction rolls back', async () => {
    const failure = new Error('order could not be stored')

    await expect(
      db.transaction(async (tx) => {
        await new PgTicketCounterRepository(tx).next(monday)
        throw failure
      }),
    ).rejects.toBe(failure)

    expect((await repository.next(monday)).value).toBe(1)
  })
})
