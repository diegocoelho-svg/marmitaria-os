export abstract class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export abstract class NotFoundError extends ApplicationError {}

export abstract class ConflictError extends ApplicationError {}

export abstract class BusinessRuleError extends ApplicationError {}

export abstract class UnauthenticatedError extends ApplicationError {}

export abstract class ForbiddenError extends ApplicationError {}
