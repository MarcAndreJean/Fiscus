import { describe, expect, it } from '@jest/globals'

import {
  clampQuarter,
  currentQuarter,
  isQuarterStarted,
  type Quarter,
  quarterRange,
} from '../reportPeriod'

describe('quarterRange', () => {
  it.each([
    [1, new Date(2026, 0, 1), new Date(2026, 2, 31)],
    [2, new Date(2026, 3, 1), new Date(2026, 5, 30)],
    [3, new Date(2026, 6, 1), new Date(2026, 8, 30)],
    [4, new Date(2026, 9, 1), new Date(2026, 11, 31)],
  ] as [Quarter, Date, Date][])(
    'covers Q%i from its first day to its last day',
    (quarter, fromDate, toDate) => {
      expect(quarterRange(2026, quarter)).toEqual({ fromDate, toDate })
    },
  )

  it('stays inside the requested year', () => {
    expect(quarterRange(2025, 4)).toEqual({
      fromDate: new Date(2025, 9, 1),
      toDate: new Date(2025, 11, 31),
    })
  })
})

describe('currentQuarter', () => {
  it.each([
    ['January 1', new Date(2026, 0, 1), 1],
    ['March 31, late evening', new Date(2026, 2, 31, 23, 59), 1],
    ['April 1', new Date(2026, 3, 1), 2],
    ['September 30', new Date(2026, 8, 30), 3],
    ['October 20', new Date(2026, 9, 20), 4],
    ['December 31, late evening', new Date(2026, 11, 31, 23, 59), 4],
  ] as [string, Date, Quarter][])('puts %s in Q%i', (_label, now, quarter) => {
    expect(currentQuarter(now)).toBe(quarter)
  })
})

describe('isQuarterStarted', () => {
  it('is true from the first instant of the quarter', () => {
    expect(isQuarterStarted(2026, 4, new Date(2026, 9, 1, 0, 0))).toBe(true)
  })

  it('is false until the first day of the quarter', () => {
    expect(isQuarterStarted(2026, 4, new Date(2026, 8, 30, 23, 59))).toBe(false)
  })

  it('is true for every quarter of a past year', () => {
    const now = new Date(2026, 1, 10)
    expect(
      [1, 2, 3, 4].map((q) => isQuarterStarted(2025, q as Quarter, now)),
    ).toEqual([true, true, true, true])
  })

  it('is false for every quarter of a later year', () => {
    const now = new Date(2026, 10, 10)
    expect(
      [1, 2, 3, 4].map((q) => isQuarterStarted(2027, q as Quarter, now)),
    ).toEqual([false, false, false, false])
  })
})

describe('clampQuarter', () => {
  it('keeps a quarter that has started', () => {
    expect(clampQuarter(2026, 2, new Date(2026, 9, 20))).toBe(2)
  })

  it('keeps the current quarter', () => {
    expect(clampQuarter(2026, 4, new Date(2026, 9, 20))).toBe(4)
  })

  it('falls back to the latest started quarter when the year is the current one', () => {
    expect(clampQuarter(2026, 4, new Date(2026, 1, 10))).toBe(1)
    expect(clampQuarter(2026, 3, new Date(2026, 4, 10))).toBe(2)
  })

  it('keeps any quarter of a past year, even one that is later in the year than today', () => {
    expect(clampQuarter(2025, 4, new Date(2026, 1, 10))).toBe(4)
  })
})
