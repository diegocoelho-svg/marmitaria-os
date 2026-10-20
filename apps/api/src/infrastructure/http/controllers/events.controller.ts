import { Controller } from '@/infrastructure/http/decorators/controller'
import { Route, type RouteReply, type RouteRequest } from '@/infrastructure/http/decorators/route'
import type { EventStream } from '@/infrastructure/http/sse/event-stream'
import { ResponseClient } from '@/infrastructure/http/sse/response-client'

const streamSchema = {}

const streamHeaders = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  'x-accel-buffering': 'no',
}

@Controller('/events')
export class EventsController {
  constructor(private readonly events: EventStream) {}

  @Route('GET', '/', streamSchema)
  stream(request: RouteRequest<typeof streamSchema>, reply: RouteReply<typeof streamSchema>) {
    if (request.method === 'HEAD') {
      reply.headers(streamHeaders).send()
      return
    }

    const lastEventId = request.headers['last-event-id']

    reply.hijack()
    reply.raw.writeHead(200, streamHeaders)
    reply.raw.flushHeaders()

    const disconnect = this.events.connect(
      new ResponseClient(reply.raw),
      typeof lastEventId === 'string' ? lastEventId : undefined,
    )

    reply.raw.once('close', disconnect)
  }
}
