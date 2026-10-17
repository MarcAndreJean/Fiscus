import { describe, expect, it } from '@jest/globals'

import {
  CarExpenseType,
  type ExpenseData,
  ExpenseType,
  type FileJsonItem,
} from '../../../../types'
import { AmountType, emptyAmount, updateAmount } from '../../../../utils/amount'
import { parseApiDate } from '../../../../utils/format'
import {
  buildCreateModels,
  buildUpdateModel,
  draftFromExpense,
  type ExpenseDraft,
  newItemDraft,
  saveSequentially,
  validateExpenseDraft,
} from '../expenseFormModels'

const image: FileJsonItem = { s3key: 'img', fileName: 'a.png', size: 1 }
const pdf: FileJsonItem = { s3key: 'pdf', fileName: 'b.pdf', size: 2 }

const item = (amount: string, overrides = {}) => ({
  ...newItemDraft(ExpenseType.Utilities, true, true),
  amount: updateAmount(emptyAmount(AmountType.TaxesIncluded, true, true), {
    amount,
  }),
  ...overrides,
})

const draft = (overrides: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  ownerId: 'biz',
  invoiceDate: new Date(2025, 5, 3, 9, 7, 5, 0),
  notes: 'n',
  paymentMethod: '',
  items: [item('114.98', { description: 'Phone' }), item('10')],
  ...overrides,
})

const hasNaN = (value: unknown): boolean =>
  typeof value === 'number'
    ? Number.isNaN(value)
    : typeof value === 'object' && value !== null
      ? Object.values(value).some(hasNaN)
      : false

describe('newItemDraft', () => {
  it('gives every item its own key', () => {
    const a = newItemDraft(ExpenseType.Utilities, true, true)
    const b = newItemDraft(ExpenseType.Utilities, true, true)
    expect(a.key).not.toBe(b.key)
  })
})

describe('buildCreateModels', () => {
  const models = buildCreateModels(
    'expense',
    draft(),
    { images: [image], files: [] },
    'u1',
    'group-1',
  )

  it('creates one record per item, sharing the invoice data', () => {
    expect(models).toHaveLength(2)
    for (const model of models) {
      expect(model).toMatchObject({
        userId: 'u1',
        businessId: 'biz',
        expenseGroupId: 'group-1',
        invoiceDate: '2025-06-03T09:07:05.000',
        notes: 'n',
        images: [image],
        files: [],
      })
    }
  })

  it('takes the amounts from each item', () => {
    expect(models[0]).toMatchObject({
      subtotal: 100,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
      hasTps: true,
      hasTvq: true,
    })
    expect(models[1].total).toBe(10)
  })

  it('leaves the description empty when none was typed', () => {
    expect(models[0].description).toBe('Phone')
    expect(models[1].description).toBe('')
  })

  it('trims the description', () => {
    const [model] = buildCreateModels(
      'expense',
      draft({ items: [item('10', { description: '  Paper  ' })] }),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(model.description).toBe('Paper')
  })

  it('reads the usage percentage of business expenses', () => {
    const [model] = buildCreateModels(
      'expense',
      draft({ items: [item('10', { deductiblePercentage: '50' })] }),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(model).toMatchObject({ deductiblePercentage: 50, dpaCategory: null })
  })

  it('files car expenses under the car', () => {
    const [model] = buildCreateModels(
      'car-expense',
      draft({
        ownerId: 'civic',
        items: [item('20', { expenseType: CarExpenseType.Gaz })],
      }),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(model).toMatchObject({ carId: 'civic', expenseType: 'gaz' })
    expect(model).not.toHaveProperty('businessId')
    expect(model).not.toHaveProperty('deductiblePercentage')
  })

  it('never sends NaN', () => {
    expect(models.some(hasNaN)).toBe(false)
  })
})

describe('validateExpenseDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateExpenseDraft('expense', draft())).toBeNull()
  })

  it.each([
    ['no items', draft({ items: [] }), 'errorNoItems'],
    ['no owner', draft({ ownerId: '' }), 'errorOwnerRequired'],
    [
      'an amount that is not a number',
      draft({ items: [item('abc')] }),
      'errorAmountInvalid',
    ],
    ['an empty amount', draft({ items: [item('')] }), 'errorAmountInvalid'],
    [
      'a usage percentage of 0',
      draft({ items: [item('10', { deductiblePercentage: '0' })] }),
      'errorPercentageInvalid',
    ],
  ])('rejects %s', (_, value, key) => {
    expect(validateExpenseDraft('expense', value)).toBe(key)
  })

  it('does not check usage percentages outside business expenses', () => {
    expect(
      validateExpenseDraft(
        'car-expense',
        draft({ items: [item('10', { deductiblePercentage: '' })] }),
      ),
    ).toBeNull()
  })
})

const existingExpense: ExpenseData = {
  id: 'e1',
  userId: 'u1',
  businessId: 'biz',
  expenseGroupId: 'g',
  invoiceDate: '2024-03-01T00:00:00Z',
  description: 'Old',
  expenseType: ExpenseType.Utilities,
  dpaCategory: 'class 8',
  paymentMethod: null,
  subtotal: 1,
  hasTps: false,
  hasTvq: false,
  tps: 0,
  tvq: 0,
  total: 1,
  deductiblePercentage: 100,
  deductibleSubtotal: 1,
  deductibleTps: 0,
  deductibleTvq: 0,
  deductibleTotal: 1,
  notes: '',
  creationDate: '2024-03-02T00:00:00',
  images: [image],
  files: [],
}

describe('buildUpdateModel', () => {
  const existing = existingExpense

  it('keeps the id and the stored date when the date was not changed', () => {
    const model = buildUpdateModel(
      'expense',
      existing,
      draft({
        invoiceDate: parseApiDate(existing.invoiceDate),
        items: [item('10')],
      }),
      { images: [image], files: [] },
      { images: [], files: [pdf] },
    )
    expect(model).toMatchObject({
      id: 'e1',
      oldInvoiceDate: '2024-03-01T00:00:00Z',
      invoiceDate: '2024-03-01T00:00:00Z',
      dpaCategory: null, // the edited item is not a CCA expense
      images: [image],
      files: [pdf],
      total: 10,
    })
    expect(model).not.toHaveProperty('userId')
    expect(model).not.toHaveProperty('expenseGroupId')
  })

  it('sends the new date in the API format when it changed', () => {
    const model = buildUpdateModel(
      'expense',
      existing,
      draft({ items: [item('10')] }),
      { images: [], files: [] },
      { images: [], files: [] },
    )
    expect(model.oldInvoiceDate).toBe('2024-03-01T00:00:00Z')
    expect(model.invoiceDate).toBe('2025-06-03T09:07:05.000')
    expect(hasNaN(model)).toBe(false)
  })
})

describe('draftFromExpense', () => {
  it('starts an edit from the saved record', () => {
    const car = {
      id: 'c1',
      carId: 'civic',
      expenseGroupId: 'g',
      invoiceDate: '2025-02-01T08:00:00.000',
      description: 'Fill-up',
      expenseType: CarExpenseType.Gaz,
      subtotal: 40,
      hasTps: true,
      hasTvq: false,
      tps: 2,
      tvq: 0,
      total: 42,
      notes: 'n',
      creationDate: '2025-02-01T09:00:00',
      images: [image],
      files: [],
    }
    const result = draftFromExpense('car-expense', car)
    expect(result).toMatchObject({
      ownerId: 'civic',
      notes: 'n',
      invoiceDate: new Date(2025, 1, 1, 8, 0, 0, 0),
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      description: 'Fill-up',
      expenseType: 'gaz',
      amount: { amount: '42', result: { tps: 2, total: 42 } },
    })
  })

  it('starts with an empty description when an old record has none', () => {
    const { description: _, ...withoutDescription } = existingExpense
    const result = draftFromExpense(
      'expense',
      withoutDescription as ExpenseData,
    )
    expect(result.items[0].description).toBe('')
  })
})

describe('saveSequentially', () => {
  it('saves in order and reports how many succeeded before a failure', async () => {
    const sent: number[] = []
    const result = await saveSequentially([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('boom')
      sent.push(n)
    })
    expect(sent).toEqual([1])
    expect(result.saved).toBe(1)
    expect((result.error as Error).message).toBe('boom')
  })

  it('reports no error when everything was saved', async () => {
    const result = await saveSequentially([1, 2], async () => {})
    expect(result).toEqual({ saved: 2, error: undefined })
  })
})

describe('payment method and DPA class', () => {
  const cca = (dpaCategory: string) =>
    item('500', { expenseType: ExpenseType.CapitalCostAllowance, dpaCategory })

  it('sends the payment method and the CCA class of CCA items only', () => {
    const [ccaModel, otherModel] = buildCreateModels(
      'expense',
      draft({
        paymentMethod: 'interac',
        items: [cca(' Class 8 '), item('10', { dpaCategory: 'ignored' })],
      }),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(ccaModel).toMatchObject({
      paymentMethod: 'interac',
      dpaCategory: 'Class 8',
    })
    expect(otherModel).toMatchObject({
      paymentMethod: 'interac',
      dpaCategory: null,
    })
  })

  it('sends no payment method when none is chosen', () => {
    const [model] = buildCreateModels(
      'expense',
      draft(),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(model).toMatchObject({ paymentMethod: null })
  })

  it('leaves both out of car and house expenses', () => {
    const [model] = buildCreateModels(
      'car-expense',
      draft({
        paymentMethod: 'cash',
        items: [item('10', { expenseType: CarExpenseType.Gaz })],
      }),
      { images: [], files: [] },
      'u1',
      'g',
    )
    expect(model).not.toHaveProperty('paymentMethod')
    expect(model).not.toHaveProperty('dpaCategory')
  })

  it('starts an edit with the saved payment method and CCA class', () => {
    const saved = {
      ...existingExpense,
      expenseType: ExpenseType.CapitalCostAllowance,
      dpaCategory: 'Class 50',
      paymentMethod: 'creditCard',
    }
    const start = draftFromExpense('expense', saved)
    expect(start.paymentMethod).toBe('creditCard')
    expect(start.items[0].dpaCategory).toBe('Class 50')
    const model = buildUpdateModel(
      'expense',
      saved,
      { ...start, paymentMethod: '' },
      { images: [], files: [] },
      { images: [], files: [] },
    )
    expect(model).toMatchObject({
      dpaCategory: 'Class 50',
      paymentMethod: null,
    })
  })
})
