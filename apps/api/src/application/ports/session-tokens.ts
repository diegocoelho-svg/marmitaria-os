export type IssuedToken = {
  token: string
  id: string
}

export interface SessionTokens {
  issue(): IssuedToken
  idOf(token: string): string
}
