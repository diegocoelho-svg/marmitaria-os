import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'
import type { EventStream } from '@/infrastructure/http/sse/event-stream'

const streamSchema = {}

@Controller('/events')
export class EventsController {
  constructor(private readonly events: EventStream) {}

  @Route('GET', '/', streamSchema)
  stream(request: RouteRequest<typeof streamSchema>, reply: RouteReply<typeof streamSchema>) {
    const lastEventId = request.headers['last-event-id']

    reply.hijack()
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    })
    reply.raw.flushHeaders()

    const disconnect = this.events.connect(
      { write: (chunk) => reply.raw.write(chunk), end: () => reply.raw.end() },
      typeof lastEventId === 'string' ? lastEventId : undefined,
    )

    reply.raw.on('close', disconnect)
  }
}
