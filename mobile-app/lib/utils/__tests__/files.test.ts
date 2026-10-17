import { describe, expect, it } from '@jest/globals'

import {
  getMimeType,
  humanizeFileSize,
  mergeAttachments,
  parseJsonList,
  truncateFileName,
} from '../files'

describe('parseJsonList', () => {
  it('parses a JSON array string', () => {
    expect(parseJsonList('[{"s3key":"k"}]')).toEqual([{ s3key: 'k' }])
  })

  it('returns an array unchanged', () => {
    const list = [{ s3key: 'k' }]
    expect(parseJsonList(list)).toBe(list)
  })

  it.each(['oops', '{"a":1}', null, undefined, 42])(
    'returns an empty list for %p',
    (value) => {
      expect(parseJsonList(value)).toEqual([])
    },
  )
})

describe('humanizeFileSize', () => {
  it.each([
    [512, '512 B'],
    [2048, '2.00 KB'],
    [3 * 1024 * 1024, '3.00 MB'],
    [0, ''],
    [undefined, ''],
  ])('shows %p bytes as %p', (size, expected) => {
    expect(humanizeFileSize(size)).toBe(expected)
  })
})

describe('truncateFileName', () => {
  it('keeps short names', () => {
    expect(truncateFileName('receipt.pdf', 20)).toBe('receipt.pdf')
  })

  it('shortens long names but keeps the extension', () => {
    expect(truncateFileName('a-very-long-receipt-name.pdf', 15)).toBe(
      'a-very-lon….pdf',
    )
  })
})

describe('getMimeType', () => {
  it.each([
    ['scan.PDF', 'application/pdf'],
    ['photo.jpg', 'image/jpeg'],
    [
      'report.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    ['unknown.zzz', 'application/octet-stream'],
    ['noextension', 'application/octet-stream'],
  ])('maps %p to %p', (name, expected) => {
    expect(getMimeType(name)).toBe(expected)
  })
})

describe('mergeAttachments', () => {
  it('appends the new uploads to the kept files', () => {
    const a = { s3key: 'a', fileName: 'a', size: 1 }
    const b = { s3key: 'b', fileName: 'b', size: 1 }
    const c = { s3key: 'c', fileName: 'c', size: 1 }
    expect(
      mergeAttachments({ images: [a], files: [] }, { images: [b], files: [c] }),
    ).toEqual({ images: [a, b], files: [c] })
  })
})
