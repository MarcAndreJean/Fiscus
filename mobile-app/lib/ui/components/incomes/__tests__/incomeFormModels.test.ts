import { describe, expect, it } from '@jest/globals'

import type { FileJsonItem, IncomeData } from '../../../../types'
import { AmountType, emptyAmount, updateAmount } from '../../../../utils/amount'
import {
  buildIncomeCreateModel,
  buildIncomeUpdateModel,
  draftFromIncome,
  type IncomeDraft,
  newIncomeLine,
  validateIncomeDraft,
} from '../incomeFormModels'

const pdf: FileJsonItem = { s3key: 'pdf', fileName: 'invoice.pdf', size: 3 }

const draft = (overrides: Partial<IncomeDraft> = {}): IncomeDraft => ({
  businessId: 'biz',
  invoiceDate: new Date(2025, 4, 6, 7, 8, 9, 0),
  clientName: 'ACME',
  description: 'Consulting',
  notes: '',
  paymentMethod: 'cheque',
  lines: [],
  amount: updateAmount(emptyAmount(AmountType.TaxesExcluded, true, true), {
    amount: '100',
  }),
  ...overrides,
})

const existing: IncomeData = {
  id: 'i1',
  userId: 'u1',
  businessId: 'biz',
  invoiceDate: '2025-01-15T12:00:00.000',
  clientName: 'Old',
  description: 'd',
  subtotal: 100,
  hasTps: true,
  hasTvq: true,
  tps: 5,
  tvq: 9.98,
  total: 114.98,
  notes: 'n',
  paymentMethod: null,
  creationDate: '2025-01-16T00:00:00',
  items: [
    {
      item: 'hours',
      subtotal: 100,
      hasTps: true,
      hasTvq: true,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
    },
  ],
  images: [],
  files: [pdf],
}

describe('validateIncomeDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateIncomeDraft(draft())).toBeNull()
  })

  it.each([
    ['no business', draft({ businessId: '' }), 'errorOwnerRequired'],
    [
      'an amount that is not a number',
      draft({ amount: { ...draft().amount, amount: 'lots' } }),
      'errorAmountInvalid',
    ],
  ])('rejects %s', (_, value, key) => {
    expect(validateIncomeDraft(value)).toBe(key)
  })
})

describe('buildIncomeCreateModel', () => {
  it('builds the API payload without a payment method', () => {
    const model = buildIncomeCreateModel(
      draft(),
      { images: [], files: [pdf] },
      'u1',
    )
    expect(model).toEqual({
      userId: 'u1',
      businessId: 'biz',
      invoiceDate: '2025-05-06T07:08:09.000',
      clientName: 'ACME',
      description: 'Consulting',
      notes: '',
      subtotal: 100,
      hasTps: true,
      hasTvq: true,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
      items: [],
      paymentMethod: 'cheque',
      images: [],
      files: [pdf],
    })
  })
})

describe('buildIncomeUpdateModel', () => {
  it('keeps the invoice lines and the stored date', () => {
    const model = buildIncomeUpdateModel(
      existing,
      draftFromIncome(existing),
      { images: [], files: [pdf] },
      { images: [], files: [] },
    )
    expect(model).toMatchObject({
      id: 'i1',
      oldInvoiceDate: '2025-01-15T12:00:00.000',
      invoiceDate: '2025-01-15T12:00:00.000',
      items: existing.items,
      files: [pdf],
      total: 114.98,
    })
    expect(model).not.toHaveProperty('userId')
  })
})

describe('income payment method', () => {
  it('sends null when none is chosen and keeps the saved one on edit', () => {
    expect(
      buildIncomeCreateModel(
        draft({ paymentMethod: '' }),
        { images: [], files: [] },
        'u1',
      ).paymentMethod,
    ).toBeNull()
    const start = draftFromIncome({ ...existing, paymentMethod: 'interac' })
    expect(start.paymentMethod).toBe('interac')
  })
})

describe('invoice lines', () => {
  const line = (item: string, amount: string) => ({
    ...newIncomeLine(true, true),
    item,
    amount: updateAmount(emptyAmount(AmountType.TaxesExcluded, true, true), {
      amount,
    }),
  })

  it('makes the income total the sum of its lines', () => {
    const model = buildIncomeCreateModel(
      draft({ lines: [line('Design', '100'), line(' Hosting ', '20')] }),
      { images: [], files: [] },
      'u1',
    )
    expect(model.items).toEqual([
      {
        item: 'Design',
        subtotal: 100,
        hasTps: true,
        hasTvq: true,
        tps: 5,
        tvq: 9.98,
        total: 114.98,
      },
      {
        item: 'Hosting',
        subtotal: 20,
        hasTps: true,
        hasTvq: true,
        tps: 1,
        tvq: 2,
        total: 23,
      },
    ])
    expect(model).toMatchObject({
      subtotal: 120,
      tps: 6,
      tvq: 11.98,
      total: 137.98,
    })
  })

  it('checks every line amount instead of the single amount', () => {
    expect(
      validateIncomeDraft(
        draft({
          amount: { ...draft().amount, amount: '' },
          lines: [line('Design', '100')],
        }),
      ),
    ).toBeNull()
    expect(validateIncomeDraft(draft({ lines: [line('Design', 'x')] }))).toBe(
      'errorAmountInvalid',
    )
  })

  it('opens saved lines for editing with their stored amounts', () => {
    const start = draftFromIncome(existing)
    expect(start.lines).toHaveLength(1)
    expect(start.lines[0]).toMatchObject({
      item: 'hours',
      amount: { amount: '114.98', result: { tvq: 9.98 } },
    })
  })
})
