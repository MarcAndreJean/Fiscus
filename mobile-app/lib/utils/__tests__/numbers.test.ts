import { describe, expect, it } from '@jest/globals'

import { parseDecimal, parsePercentage } from '../numbers'

describe('parseDecimal', () => {
  it.each([
    ['12,50', 12.5],
    [' 7 ', 7],
    ['0', 0],
    ['-3.25', -3.25],
  ])('reads %p as %p', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '1.2.3', '12abc'])('rejects %p', (text) => {
    expect(parseDecimal(text)).toBeNull()
  })
})

describe('parsePercentage', () => {
  it.each([
    ['50', 50],
    ['1', 1],
    ['100', 100],
    ['12,5', 12.5],
  ])('reads %p as %p', (text, expected) => {
    expect(parsePercentage(text)).toBe(expected)
  })

  it.each(['0', '101', '-5', '', 'half'])('rejects %p', (text) => {
    expect(parsePercentage(text)).toBeNull()
  })
})
