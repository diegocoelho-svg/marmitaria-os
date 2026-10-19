import { DatabaseError } from 'pg'

const UNIQUE_VIOLATION = '23505'

export function isUniqueViolation(error: Error, constraint: string): boolean {
  const cause = error instanceof DatabaseError ? error : error.cause

  return (
    cause instanceof DatabaseError &&
    cause.code === UNIQUE_VIOLATION &&
    cause.constraint === constraint
  )
}
