export type DomainEvent<T extends string> = Readonly<{
  type: T
  aggregateId: string
  occurredAt: Date
}>
