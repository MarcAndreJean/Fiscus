import { describe, expect, it } from '@jest/globals'

import { ExpenseType } from '../../types'
import English from '../en'

describe('English strings', () => {
  it('has a help text for every business expense type, keyed by its stored value', () => {
    const missing = Object.values(ExpenseType).filter(
      (value) => !(value in English.businessExpenseTypeDescription),
    )
    expect(missing).toEqual([])
  })
})
