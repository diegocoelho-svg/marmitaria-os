import { EventOutput } from '@/application/dtos/events/event-output'
import type { ApplicationEvent } from '@/application/ports/event-bus'

export type StreamClient = {
  write(chunk: string): void
  end(): void
}

export type EventStreamOptions = {
  epoch: string
  capacity?: number
  heartbeatMs?: number
}

const CURSOR = /^(.+):(\d+)$/

export class EventStream {
  private sequence = 0
  private readonly history: string[] = []
  private readonly clients = new Set<StreamClient>()
  private heartbeat: NodeJS.Timeout | undefined
  private readonly epoch: string
  private readonly capacity: number
  private readonly heartbeatMs: number

  constructor({ epoch, capacity = 500, heartbeatMs = 15_000 }: EventStreamOptions) {
    this.epoch = epoch
    this.capacity = capacity
    this.heartbeatMs = heartbeatMs
  }

  record(event: ApplicationEvent): void {
    this.sequence += 1
    const frame = this.frame(event.type, JSON.stringify(EventOutput.from(event)))

    this.history.push(frame)

    if (this.history.length > this.capacity) {
      this.history.shift()
    }

    this.clients.forEach((client) => client.write(frame))
  }

  connect(client: StreamClient, lastEventId?: string): () => void {
    const catchUp =
      lastEventId === undefined
        ? [this.frame('ready', '{}')]
        : (this.missedSince(lastEventId) ?? [this.frame('reset', '{}')])

    catchUp.forEach((frame) => client.write(frame))
    this.clients.add(client)
    this.startHeartbeat()

    return () => this.disconnect(client)
  }

  close(): void {
    this.clients.forEach((client) => client.end())
    this.clients.clear()
    this.stopHeartbeat()
  }

  private disconnect(client: StreamClient): void {
    this.clients.delete(client)

    if (this.clients.size === 0) {
      this.stopHeartbeat()
    }
  }

  private missedSince(lastEventId: string): string[] | null {
    const match = CURSOR.exec(lastEventId)

    if (!match || match[1] !== this.epoch) {
      return null
    }

    const seen = Number(match[2])
    const oldest = this.sequence - this.history.length

    if (seen < oldest || seen > this.sequence) {
      return null
    }

    return this.history.slice(seen - oldest)
  }

  private frame(event: string, data: string): string {
    return `id: ${this.epoch}:${this.sequence}\nevent: ${event}\ndata: ${data}\n\n`
  }

  private startHeartbeat(): void {
    if (this.heartbeat) {
      return
    }

    this.heartbeat = setInterval(() => {
      this.clients.forEach((client) => client.write(': ping\n\n'))
    }, this.heartbeatMs)
    this.heartbeat.unref()
  }

  private stopHeartbeat(): void {
    clearInterval(this.heartbeat)
    this.heartbeat = undefined
  }
}
