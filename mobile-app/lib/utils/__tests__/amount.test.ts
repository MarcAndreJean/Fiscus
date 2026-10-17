import { describe, expect, it } from '@jest/globals'

import {
  AmountType,
  amountFromEntity,
  computeAmountResult,
  emptyAmount,
  sumAmounts,
  updateAmount,
} from '../amount'

describe('computeAmountResult', () => {
  it('splits a taxes-included amount into subtotal, TPS and TVQ', () => {
    expect(
      computeAmountResult(114.98, true, true, AmountType.TaxesIncluded),
    ).toEqual({
      subtotal: 100,
      hasTps: true,
      hasTvq: true,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
    })
  })

  it('adds TPS and TVQ to a taxes-excluded amount', () => {
    expect(
      computeAmountResult(100, true, true, AmountType.TaxesExcluded),
    ).toEqual({
      subtotal: 100,
      hasTps: true,
      hasTvq: true,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
    })
  })

  it('ignores the tax flags when there are no taxes', () => {
    expect(computeAmountResult(50, true, true, AmountType.NoTaxes)).toEqual({
      subtotal: 50,
      hasTps: false,
      hasTvq: false,
      tps: 0,
      tvq: 0,
      total: 50,
    })
  })
})

describe('emptyAmount', () => {
  it('starts at zero instead of NaN', () => {
    const state = emptyAmount(AmountType.TaxesIncluded, true, true)
    expect(state.amount).toBe('')
    expect(state.result).toEqual({
      subtotal: 0,
      hasTps: true,
      hasTvq: true,
      tps: 0,
      tvq: 0,
      total: 0,
    })
  })
})

describe('updateAmount', () => {
  const start = emptyAmount(AmountType.TaxesIncluded, true, true)

  it('accepts a comma as the decimal separator', () => {
    expect(updateAmount(start, { amount: '114,98' }).result).toMatchObject({
      subtotal: 100,
      tps: 5,
      tvq: 9.98,
      total: 114.98,
    })
  })

  it('keeps the typed text as is', () => {
    expect(updateAmount(start, { amount: '114,98' }).amount).toBe('114,98')
  })

  it('computes zero for text that is not a number', () => {
    expect(updateAmount(start, { amount: 'x' }).result.total).toBe(0)
  })

  it('turns both taxes off when switching to no taxes', () => {
    expect(
      updateAmount(start, { amountType: AmountType.NoTaxes }),
    ).toMatchObject({ hasTps: false, hasTvq: false })
  })

  it('turns both taxes back on when leaving no taxes', () => {
    const noTaxes = updateAmount(start, { amountType: AmountType.NoTaxes })
    expect(
      updateAmount(noTaxes, { amountType: AmountType.TaxesExcluded }),
    ).toMatchObject({ hasTps: true, hasTvq: true })
  })

  it('recomputes when a tax is switched off', () => {
    const withAmount = updateAmount(start, { amount: '105' })
    expect(updateAmount(withAmount, { hasTvq: false }).result).toMatchObject({
      tps: 5,
      tvq: 0,
      subtotal: 100,
    })
  })
})

describe('amountFromEntity', () => {
  it('starts an edit from the stored values', () => {
    expect(
      amountFromEntity({
        subtotal: 10,
        hasTps: true,
        hasTvq: true,
        tps: 0.5,
        tvq: 1,
        total: 11.5,
      }),
    ).toEqual({
      amount: '11.5',
      amountType: AmountType.TaxesIncluded,
      hasTps: true,
      hasTvq: true,
      result: {
        subtotal: 10,
        hasTps: true,
        hasTvq: true,
        tps: 0.5,
        tvq: 1,
        total: 11.5,
      },
    })
  })

  it('uses no taxes when neither tax was charged', () => {
    expect(
      amountFromEntity({
        subtotal: 40,
        hasTps: false,
        hasTvq: false,
        tps: 0,
        tvq: 0,
        total: 40,
      }).amountType,
    ).toBe(AmountType.NoTaxes)
  })
})

describe('sumAmounts', () => {
  it('adds amounts to the cent and keeps a tax when any line has it', () => {
    expect(
      sumAmounts([
        {
          subtotal: 0.1,
          hasTps: true,
          hasTvq: false,
          tps: 0.01,
          tvq: 0,
          total: 0.11,
        },
        {
          subtotal: 0.2,
          hasTps: false,
          hasTvq: true,
          tps: 0,
          tvq: 0.02,
          total: 0.22,
        },
      ]),
    ).toEqual({
      subtotal: 0.3,
      hasTps: true,
      hasTvq: true,
      tps: 0.01,
      tvq: 0.02,
      total: 0.33,
    })
  })

  it('gives zero for no lines', () => {
    expect(sumAmounts([])).toEqual({
      subtotal: 0,
      hasTps: false,
      hasTvq: false,
      tps: 0,
      tvq: 0,
      total: 0,
    })
  })
})
