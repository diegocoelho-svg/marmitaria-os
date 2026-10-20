import { dishSchema, menuSchema, orderSchema, streamEventSchema } from '@marmitaria/contracts'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { useTestApp } from '@test/integration/test-app'

type Frame = { id: string; event: string; data: string }

const field = (block: string, name: string) =>
  new RegExp(`^${name}: (.*)$`, 'm').exec(block)?.[1] ?? ''

describe('/api/events', () => {
  const { app, clock } = useTestApp()
  const streams: Array<() => void> = []
  let baseUrl: string
  let frango: string

  const openStream = async (lastEventId?: string) => {
    const abort = new AbortController()
    const response = await fetch(`${baseUrl}/api/events`, {
      headers: new Headers(lastEventId ? [['last-event-id', lastEventId]] : []),
      signal: abort.signal,
    })
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    streams.push(() => abort.abort())

    if (!reader) {
      throw new Error('The event stream has no body')
    }

    const next = async (): Promise<Frame> => {
      for (;;) {
        const end = buffer.indexOf('\n\n')

        if (end >= 0) {
          const block = buffer.slice(0, end)
          buffer = buffer.slice(end + 2)

          if (!block.startsWith(':')) {
            return {
              id: field(block, 'id'),
              event: field(block, 'event'),
              data: field(block, 'data'),
            }
          }
        } else {
          const { value, done } = await reader.read()

          if (done) {
            throw new Error('The event stream ended')
          }

          buffer += decoder.decode(value, { stream: true })
        }
      }
    }

    return { response, next, close: () => abort.abort() }
  }

  const post = async (url: string, payload: object) =>
    (await app.inject({ method: 'POST', url, payload })).json()

  const createOrder = async () =>
    orderSchema.parse(
      await post('/api/orders', {
        origin: 'counter',
        items: [{ dishId: frango, size: 'medium', quantity: 1 }],
      }),
    )

  beforeAll(async () => {
    baseUrl = await app.listen({ host: '127.0.0.1', port: 0 })
  })

  beforeEach(async () => {
    clock.set('2026-10-17T15:00:00Z')
    frango = dishSchema.parse(await post('/api/dishes', { name: 'Frango grelhado' })).id
    await app.inject({
      method: 'PUT',
      url: '/api/size-prices/medium',
      payload: { priceCents: 2500 },
    })
    const menu = menuSchema.parse(
      await post('/api/menus', { name: 'Cardápio A', dishIds: [frango] }),
    )
    await app.inject({
      method: 'PUT',
      url: '/api/daily-menus/2026-10-17',
      payload: { menuId: menu.id },
    })
  })

  afterEach(() => {
    streams.splice(0).forEach((close) => close())
  })

  it('greets a screen and pushes the orders taken afterwards', async () => {
    const stream = await openStream()

    const ready = await stream.next()
    const order = await createOrder()
    const created = await stream.next()

    expect(stream.response.headers.get('content-type')).toBe('text/event-stream; charset=utf-8')
    expect(ready).toMatchObject({ event: 'ready', data: '{}' })
    expect(created.event).toBe('order.created')
    expect(created.id).not.toBe(ready.id)
    expect(streamEventSchema.parse(JSON.parse(created.data))).toEqual({
      type: 'order.created',
      aggregateId: order.id,
      occurredAt: '2026-10-17T15:00:00.000Z',
      businessDate: '2026-10-17',
      ticket: 1,
    })
  })

  it('replays what a screen missed while it was disconnected', async () => {
    const first = await openStream()
    const { id: cursor } = await first.next()
    first.close()

    const order = await createOrder()
    await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      payload: { status: 'preparing' },
    })
    const second = await openStream(cursor)
    const missed = [await second.next(), await second.next()]

    expect(missed.map((frame) => frame.event)).toEqual(['order.created', 'order.started'])
  })

  it('asks a screen with an unknown cursor to reset', async () => {
    const stream = await openStream('previous-boot:12')

    const frame = await stream.next()

    expect(frame.event).toBe('reset')
  })

  it('answers HEAD with the stream headers without opening a stream', async () => {
    const response = await app.inject({ method: 'HEAD', url: '/api/events' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/event-stream; charset=utf-8')
    expect(response.body).toBe('')
  })

  it('ends the open streams when the server closes', async () => {
    const stream = await openStream()
    await stream.next()

    await app.close()

    await expect(stream.next()).rejects.toThrow('The event stream ended')
  })
})
