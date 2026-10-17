import { describe, expect, it } from '@jest/globals'

import type { TravelLogData } from '../../../../types'
import {
  buildTravelLogCreateModel,
  buildTravelLogUpdateModel,
  draftFromTravelLog,
  type TravelLogDraft,
  validateTravelLogDraft,
} from '../travelLogFormModels'

const draft = (overrides: Partial<TravelLogDraft> = {}): TravelLogDraft => ({
  businessId: 'biz',
  carId: 'civic',
  travelDate: new Date(2025, 2, 4, 8, 30, 0, 0),
  reason: 'Client visit',
  notes: '',
  totalKm: '12,5',
  consumption: '',
  ...overrides,
})

const existing: TravelLogData = {
  id: 't1',
  userId: 'u1',
  carId: 'civic',
  businessId: 'biz',
  travelDate: '2025-03-04T08:30:00.000',
  reason: 'r',
  notes: '',
  totalKm: 40,
  consumption: null,
  creationDate: '2025-03-04T09:00:00',
  images: [],
  files: [],
}

describe('validateTravelLogDraft', () => {
  it('accepts a draft with an empty reason and no consumption', () => {
    expect(validateTravelLogDraft(draft({ reason: '' }))).toBeNull()
  })

  it.each([
    ['no distance', draft({ totalKm: '' }), 'errorKmInvalid'],
    [
      'a distance that is not a number',
      draft({ totalKm: 'far' }),
      'errorKmInvalid',
    ],
    ['a negative distance', draft({ totalKm: '-3' }), 'errorKmInvalid'],
    [
      'a consumption that is not a number',
      draft({ consumption: 'x' }),
      'errorNumberInvalid',
    ],
    ['no car', draft({ carId: '' }), 'errorOwnerRequired'],
    ['no business', draft({ businessId: '' }), 'errorOwnerRequired'],
  ])('rejects %s', (_, value, key) => {
    expect(validateTravelLogDraft(value)).toBe(key)
  })
})

describe('buildTravelLogCreateModel', () => {
  it('reads comma decimals and sends an empty consumption as null', () => {
    expect(
      buildTravelLogCreateModel(draft(), { images: [], files: [] }, 'u1'),
    ).toEqual({
      userId: 'u1',
      businessId: 'biz',
      carId: 'civic',
      travelDate: '2025-03-04T08:30:00.000',
      reason: 'Client visit',
      notes: '',
      totalKm: 12.5,
      consumption: null,
      images: [],
      files: [],
    })
  })
})

describe('buildTravelLogUpdateModel', () => {
  it('never sends the owner and keeps the stored date', () => {
    const start = draftFromTravelLog(existing)
    expect(start).toMatchObject({ totalKm: '40', consumption: '' })
    const model = buildTravelLogUpdateModel(
      existing,
      { ...start, consumption: '6.8' },
      { images: [], files: [] },
      { images: [], files: [] },
    )
    expect(model).toMatchObject({
      id: 't1',
      oldTravelDate: '2025-03-04T08:30:00.000',
      travelDate: '2025-03-04T08:30:00.000',
      totalKm: 40,
      consumption: 6.8,
    })
    expect(model).not.toHaveProperty('userId')
  })
})

describe('draftFromTravelLog with missing fields', () => {
  it('treats a missing number as empty, not "undefined"', () => {
    const old = { ...existing } as Partial<TravelLogData>
    delete old.totalKm
    delete old.consumption
    const result = draftFromTravelLog(old as TravelLogData)
    expect(result.totalKm).toBe('')
    expect(result.consumption).toBe('')
  })
})
