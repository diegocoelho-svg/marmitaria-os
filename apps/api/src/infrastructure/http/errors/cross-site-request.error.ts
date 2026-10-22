import { ForbiddenError } from '@/application/errors/application-error'

export class CrossSiteRequestError extends ForbiddenError {
  constructor() {
    super('request.cross_site', 'Requests that change data must come from this site')
  }
}
