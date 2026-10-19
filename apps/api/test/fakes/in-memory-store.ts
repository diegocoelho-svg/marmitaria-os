export class InMemoryStore<T extends { id: string }> {
  private readonly records = new Map<string, T>()

  constructor(private readonly copy: (entity: T) => T) {}

  get(id: string): T | null {
    const record = this.records.get(id)

    return record ? this.copy(record) : null
  }

  all(): T[] {
    return [...this.records.values()].map((record) => this.copy(record))
  }

  insert(entity: T): void {
    if (this.records.has(entity.id)) {
      throw new Error(`Record ${entity.id} already exists`)
    }

    this.records.set(entity.id, this.copy(entity))
  }

  replace(entity: T): void {
    if (!this.records.has(entity.id)) {
      throw new Error(`Record ${entity.id} does not exist`)
    }

    this.records.set(entity.id, this.copy(entity))
  }
}
