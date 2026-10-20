import type { StreamClient } from '@/infrastructure/http/sse/event-stream'

export type SseResponse = {
  write(chunk: string): boolean
  end(): void
  destroy(): void
  once(event: 'drain' | 'close', listener: () => void): void
}

export type ResponseClientLimits = {
  maxQueuedChunks: number
  drainTimeoutMs: number
}

export class ResponseClient implements StreamClient {
  private readonly queue: string[] = []
  private congested = false
  private closed = false
  private drainTimer: NodeJS.Timeout | undefined

  constructor(
    private readonly response: SseResponse,
    private readonly limits: ResponseClientLimits = {
      maxQueuedChunks: 500,
      drainTimeoutMs: 15_000,
    },
  ) {
    response.once('close', () => this.release())
  }

  write(chunk: string): void {
    if (this.closed) {
      return
    }

    if (!this.congested) {
      if (!this.response.write(chunk)) {
        this.waitForDrain()
      }

      return
    }

    if (this.queue.length >= this.limits.maxQueuedChunks) {
      this.abort()
      return
    }

    this.queue.push(chunk)
  }

  end(): void {
    if (this.closed) {
      return
    }

    if (this.congested) {
      this.abort()
      return
    }

    this.release()
    this.response.end()
  }

  private waitForDrain(): void {
    this.congested = true
    this.drainTimer = setTimeout(() => this.abort(), this.limits.drainTimeoutMs)
    this.drainTimer.unref()
    this.response.once('drain', () => this.flush())
  }

  private flush(): void {
    if (this.closed) {
      return
    }

    clearTimeout(this.drainTimer)
    this.congested = false

    for (let chunk = this.queue.shift(); chunk !== undefined; chunk = this.queue.shift()) {
      if (!this.response.write(chunk)) {
        this.waitForDrain()
        return
      }
    }
  }

  private abort(): void {
    this.release()
    this.response.destroy()
  }

  private release(): void {
    this.closed = true
    this.congested = false
    this.queue.length = 0
    clearTimeout(this.drainTimer)
  }
}
