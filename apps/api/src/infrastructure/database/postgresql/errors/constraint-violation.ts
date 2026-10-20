import { DatabaseError } from 'pg'

export function violatesConstraint(error: Error, constraint: string): boolean {
  const cause = error instanceof DatabaseError ? error : error.cause

  return cause instanceof DatabaseError && cause.constraint === constraint
}
