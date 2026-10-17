import { describe, expect, it } from '@jest/globals'

import {
  defaultEntryDate,
  formatDate,
  formatMoney,
  keepDateIfUnchanged,
  maskSecret,
  parseApiDate,
  summaryLine,
  toApiDateTime,
} from '../format'

describe('formatMoney', () => {
  it('shows zero as an amount, not as missing', () => {
    expect(formatMoney(0)).toBe('$0.00')
  })

  it('rounds to cents with thousands separators', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
  })

  it.each([null, undefined])('shows %p as a dash', (value) => {
    expect(formatMoney(value)).toBe('-')
  })
})

describe('formatDate', () => {
  it('keeps the date part of an ISO timestamp', () => {
    expect(formatDate('2025-06-03T10:00:00.000')).toBe('2025-06-03')
  })

  it.each([null, undefined, ''])('shows %p as a dash', (value) => {
    expect(formatDate(value)).toBe('-')
  })
})

describe('toApiDateTime', () => {
  it('formats a local date the way the API stores it', () => {
    expect(toApiDateTime(new Date(2025, 5, 3, 9, 7, 5, 42))).toBe(
      '2025-06-03T09:07:05.042',
    )
  })
})

describe('defaultEntryDate', () => {
  it('uses today but in the selected year', () => {
    const now = new Date(2026, 9, 17, 14, 30)
    expect(defaultEntryDate(2024, now)).toEqual(new Date(2024, 9, 17, 14, 30))
  })
})

describe('maskSecret', () => {
  it('shows only the last four characters', () => {
    expect(maskSecret('abcdefgh1234')).toBe('••••1234')
  })

  it('shows nothing for an empty value', () => {
    expect(maskSecret('')).toBe('')
  })
})

describe('summaryLine', () => {
  it('joins the parts that have a value', () => {
    expect(summaryLine('2025-06-03', '', null, '$5.00', undefined)).toBe(
      '2025-06-03 · $5.00',
    )
  })
})

describe('keepDateIfUnchanged', () => {
  it('keeps the stored text when the date was not changed', () => {
    expect(
      keepDateIfUnchanged(
        '2024-03-01T00:00:00Z',
        parseApiDate('2024-03-01T00:00:00Z'),
      ),
    ).toBe('2024-03-01T00:00:00Z')
  })

  it('formats a changed date for the API', () => {
    expect(
      keepDateIfUnchanged(
        '2024-03-01T00:00:00Z',
        new Date(2025, 0, 2, 3, 4, 5, 6),
      ),
    ).toBe('2025-01-02T03:04:05.006')
  })
})

describe('parseApiDate', () => {
  it('reads a local timestamp as is', () => {
    expect(parseApiDate('2025-06-03T09:07:05.042')).toEqual(
      new Date(2025, 5, 3, 9, 7, 5, 42),
    )
  })

  it.each(['2024-03-01T00:00:00Z', '2024-03-01T00:00:00+00:00', '2024-03-01'])(
    'keeps the calendar day of %p',
    (stored) => {
      expect(parseApiDate(stored)).toEqual(new Date(2024, 2, 1, 0, 0, 0, 0))
    },
  )

  it('lets keepDateIfUnchanged recognise an untouched UTC date', () => {
    expect(
      keepDateIfUnchanged(
        '2024-03-01T00:00:00Z',
        parseApiDate('2024-03-01T00:00:00Z'),
      ),
    ).toBe('2024-03-01T00:00:00Z')
  })
})
