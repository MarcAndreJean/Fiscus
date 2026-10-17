import { cleanParams, type QueryParams } from './client'

/** The API collections; each is also the URL path (/expenses, /car-expenses, ...). */
export type Resource =
  | 'expenses'
  | 'incomes'
  | 'car-expenses'
  | 'house-expenses'
  | 'travel-logs'
  | 'misc-files'

export const queryKeys = {
  /** Prefix of every cached list of a resource; invalidating it refreshes them all. */
  all: (resource: Resource) => [resource] as const,
  list: (resource: Resource, params: QueryParams) =>
    [resource, 'list', cleanParams(params)] as const,
}
