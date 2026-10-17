import { parseDecimal } from './numbers'
import type { TaxedAmounts } from '../types/AmountFields'

export const TPS_RATE = 0.05 // federal GST/TPS
export const TVQ_RATE = 0.09975 // Quebec QST/TVQ

export enum AmountType {
  NoTaxes = 'noTaxes',
  TaxesIncluded = 'taxesIncluded', // amount includes TPS/TVQ
  TaxesExcluded = 'taxesExcluded', // amount excludes TPS/TVQ
}

/** What an amount field holds while the user edits it. */
export type AmountState = {
  amount: string
  amountType: AmountType
  hasTps: boolean
  hasTvq: boolean
  result: TaxedAmounts
}

const toCents = (dollars: number): number => Math.round(dollars * 100)
const fromCents = (cents: number): number => cents / 100

// Works in cents so rounding happens once per tax.
const computeInCents = (
  amount: number,
  hasTps: boolean,
  hasTvq: boolean,
  amountType: AmountType,
): TaxedAmounts => {
  switch (amountType) {
    case AmountType.NoTaxes:
      return {
        subtotal: amount,
        hasTps: false,
        hasTvq: false,
        tps: 0,
        tvq: 0,
        total: amount,
      }
    case AmountType.TaxesExcluded: {
      const tps = hasTps ? Math.round(amount * TPS_RATE) : 0
      const tvq = hasTvq ? Math.round(amount * TVQ_RATE) : 0
      return {
        subtotal: amount,
        hasTps,
        hasTvq,
        tps,
        tvq,
        total: amount + tps + tvq,
      }
    }
    case AmountType.TaxesIncluded: {
      const divisor = 1 + (hasTps ? TPS_RATE : 0) + (hasTvq ? TVQ_RATE : 0)
      const tps = hasTps ? Math.round((amount * TPS_RATE) / divisor) : 0
      const tvq = hasTvq ? Math.round((amount * TVQ_RATE) / divisor) : 0
      return {
        subtotal: amount - tps - tvq,
        hasTps,
        hasTvq,
        tps,
        tvq,
        total: amount,
      }
    }
  }
}

export const computeAmountResult = (
  amount: number,
  hasTps: boolean,
  hasTvq: boolean,
  amountType: AmountType,
): TaxedAmounts => {
  const cents = computeInCents(toCents(amount), hasTps, hasTvq, amountType)
  return {
    ...cents,
    subtotal: fromCents(cents.subtotal),
    tps: fromCents(cents.tps),
    tvq: fromCents(cents.tvq),
    total: fromCents(cents.total),
  }
}

export const emptyAmount = (
  amountType: AmountType,
  hasTps: boolean,
  hasTvq: boolean,
): AmountState => ({
  amount: '',
  amountType,
  hasTps,
  hasTvq,
  result: computeAmountResult(0, hasTps, hasTvq, amountType),
})

/** Applies one user change and recomputes the taxes. */
export const updateAmount = (
  state: AmountState,
  patch: Partial<Omit<AmountState, 'result'>>,
): AmountState => {
  const amountType = patch.amountType ?? state.amountType
  const typeChanged = amountType !== state.amountType
  const taxesOn = amountType !== AmountType.NoTaxes
  const hasTps = patch.hasTps ?? (typeChanged ? taxesOn : state.hasTps)
  const hasTvq = patch.hasTvq ?? (typeChanged ? taxesOn : state.hasTvq)
  const amount = patch.amount ?? state.amount
  return {
    amount,
    amountType,
    hasTps,
    hasTvq,
    result: computeAmountResult(
      parseDecimal(amount) ?? 0,
      hasTps,
      hasTvq,
      amountType,
    ),
  }
}

/** Starts editing a saved record from its stored values, so nothing drifts by a cent. */
export const amountFromEntity = (entity: TaxedAmounts): AmountState => ({
  amount: String(entity.total),
  amountType:
    entity.hasTps || entity.hasTvq
      ? AmountType.TaxesIncluded
      : AmountType.NoTaxes,
  hasTps: entity.hasTps,
  hasTvq: entity.hasTvq,
  result: {
    subtotal: entity.subtotal,
    hasTps: entity.hasTps,
    hasTvq: entity.hasTvq,
    tps: entity.tps,
    tvq: entity.tvq,
    total: entity.total,
  },
})

/** Totals of several lines, added in cents; a tax counts as charged if any line has it. */
export const sumAmounts = (lines: TaxedAmounts[]): TaxedAmounts => {
  const cents = (pick: (line: TaxedAmounts) => number) =>
    fromCents(lines.reduce((sum, line) => sum + toCents(pick(line)), 0))
  return {
    subtotal: cents((line) => line.subtotal),
    hasTps: lines.some((line) => line.hasTps),
    hasTvq: lines.some((line) => line.hasTvq),
    tps: cents((line) => line.tps),
    tvq: cents((line) => line.tvq),
    total: cents((line) => line.total),
  }
}
