import { enumLabel, Locales } from '../../../locales'
import { PaymentMethod, type TaxedAmounts } from '../../../types'
import { formatMoney } from '../../../utils/format'

/** One label/value row of the details screen. */
export type EntityField = {
  label: string
  value: string | number | null | undefined
}

/** The payment method row of business expenses and incomes (unknown old values as is). */
export const paymentMethodField = (value: string | null): EntityField => ({
  label: Locales.t('paymentMethod'),
  value: value ? enumLabel(PaymentMethod, 'paymentMethods', value) : null,
})

/** Subtotal, TPS, TVQ and total rows shared by every expense and income. */
export const amountFields = (amounts: TaxedAmounts): EntityField[] => [
  { label: Locales.t('subtotal'), value: formatMoney(amounts.subtotal) },
  {
    label: Locales.t('tps'),
    value: amounts.hasTps
      ? formatMoney(amounts.tps)
      : Locales.t('notApplicable'),
  },
  {
    label: Locales.t('tvq'),
    value: amounts.hasTvq
      ? formatMoney(amounts.tvq)
      : Locales.t('notApplicable'),
  },
  { label: Locales.t('viewerTotal'), value: formatMoney(amounts.total) },
]
