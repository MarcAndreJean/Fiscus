import { afterEach, describe, expect, it } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import {
  findCachedEntity,
  invalidateEntity,
  replaceCachedEntity,
} from '../entities'
import { parseExpense } from '../expenses'
import { parseIncome } from '../incomes'
import { queryKeys } from '../queryKeys'

// Cached queries start garbage-collection timers; clearing each client stops them,
// so Jest can exit cleanly.
const clients: QueryClient[] = []
const newClient = () => {
  const client = new QueryClient()
  clients.push(client)
  return client
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
})

describe('queryKeys', () => {
  it('puts every list of a resource under the resource key', () => {
    expect(queryKeys.list('expenses', { year: 2025, month: null })).toEqual([
      'expenses',
      'list',
      { year: 2025 },
    ])
    expect(queryKeys.all('expenses')).toEqual(['expenses'])
  })
})

describe('findCachedEntity', () => {
  it('finds an entity in any cached list of the resource', () => {
    const client = newClient()
    client.setQueryData(queryKeys.list('expenses', {}), [
      { id: 'a' },
      { id: 'b' },
    ])
    client.setQueryData(queryKeys.list('incomes', {}), [{ id: 'z' }])
    expect(findCachedEntity(client, 'expenses', 'b')).toEqual({ id: 'b' })
  })

  it('returns undefined when nothing is cached for that id', () => {
    const client = newClient()
    client.setQueryData(queryKeys.list('expenses', {}), [{ id: 'a' }])
    expect(findCachedEntity(client, 'expenses', 'z')).toBeUndefined()
    expect(findCachedEntity(newClient(), 'expenses', 'a')).toBeUndefined()
  })

  it('prefers the most recently fetched copy when several lists hold it', () => {
    // A travel log can sit in the "All" list and in a filtered list at once.
    const client = newClient()
    client.setQueryData(
      queryKeys.list('travel-logs', { businessId: 'b1' }),
      [{ id: 't', reason: 'old' }],
      { updatedAt: 1000 },
    )
    client.setQueryData(
      queryKeys.list('travel-logs', {}),
      [{ id: 't', reason: 'new' }],
      { updatedAt: 2000 },
    )
    expect(findCachedEntity(client, 'travel-logs', 't')).toEqual({
      id: 't',
      reason: 'new',
    })
  })
})

describe('replaceCachedEntity', () => {
  it('puts the saved version in every list that holds the entity', () => {
    const client = newClient()
    const year = queryKeys.list('expenses', { year: 2025 })
    const month = queryKeys.list('expenses', { year: 2025, month: 6 })
    const other = queryKeys.list('expenses', { year: 2024 })
    client.setQueryData(year, [
      { id: 'a', total: 1 },
      { id: 'b', total: 2 },
    ])
    client.setQueryData(month, [{ id: 'a', total: 1 }])
    client.setQueryData(other, [{ id: 'c', total: 3 }])

    replaceCachedEntity(client, 'expenses', { id: 'a', total: 9 })

    expect(client.getQueryData(year)).toEqual([
      { id: 'a', total: 9 },
      { id: 'b', total: 2 },
    ])
    expect(client.getQueryData(month)).toEqual([{ id: 'a', total: 9 }])
    expect(client.getQueryData(other)).toEqual([{ id: 'c', total: 3 }])
  })
})

describe('invalidateEntity', () => {
  it('marks every list of the resource stale and leaves other resources alone', async () => {
    const client = newClient()
    const expenses = queryKeys.list('expenses', { year: 2025 })
    const incomes = queryKeys.list('incomes', { year: 2025 })
    client.setQueryData(expenses, [{ id: 'a' }])
    client.setQueryData(incomes, [{ id: 'b' }])

    await invalidateEntity(client, 'expenses')

    expect(client.getQueryState(expenses)?.isInvalidated).toBe(true)
    expect(client.getQueryState(incomes)?.isInvalidated).toBe(false)
  })
})

describe('parsers', () => {
  it('turns the stored JSON attachment lists into arrays', () => {
    const expense = parseExpense({
      id: 'a',
      images: '[{"s3key":"k","fileName":"f.png","size":1}]',
      files: '[]',
    })
    expect(expense.images[0].s3key).toBe('k')
    expect(expense.files).toEqual([])
  })

  it('parses income items too', () => {
    const income = parseIncome({
      id: 'i',
      items: '[{"item":"hours","subtotal":100}]',
      images: 'not json',
    })
    expect(income.items).toEqual([{ item: 'hours', subtotal: 100 }])
    expect(income.images).toEqual([])
  })
})
