import { Locales } from '../../../locales'
import type { IncomeData } from '../../../types'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  amountFields,
  type EntityField,
  paymentMethodField,
} from '../shared/EntityField'

export const incomeFields = (income: IncomeData): EntityField[] => [
  { label: Locales.t('clientName'), value: income.clientName },
  { label: Locales.t('description'), value: income.description },
  { label: Locales.t('invoiceDate'), value: formatDate(income.invoiceDate) },
  ...income.items.map((line, index) => ({
    label: line.item || `${Locales.t('invoiceLine')} ${index + 1}`,
    value: formatMoney(line.total),
  })),
  ...amountFields(income),
  paymentMethodField(income.paymentMethod),
  { label: Locales.t('businessId'), value: income.businessId },
  { label: Locales.t('notes'), value: income.notes },
  { label: Locales.t('creationDate'), value: formatDate(income.creationDate) },
]
