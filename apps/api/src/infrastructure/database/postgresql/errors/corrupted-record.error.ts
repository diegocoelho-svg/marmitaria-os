export class CorruptedRecordError extends Error {
  constructor(table: string, id: string, options: ErrorOptions) {
    super(`Record ${id} in ${table} does not satisfy the domain rules`, options)
    this.name = 'CorruptedRecordError'
  }
}

export function restoreRecord<T>(table: string, id: string, restore: () => T): T {
  try {
    return restore()
  } catch (error) {
    throw new CorruptedRecordError(table, id, { cause: error })
  }
}
