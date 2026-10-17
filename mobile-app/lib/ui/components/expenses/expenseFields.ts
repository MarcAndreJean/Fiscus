import { Locales } from '../../../locales'
import { enumLabel } from '../../../locales/enumLabel'
import { type ExpenseData, ExpenseType } from '../../../types'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  amountFields,
  type EntityField,
  paymentMethodField,
} from '../shared/EntityField'

export const expenseTypeLabel = (expense: ExpenseData): string =>
  enumLabel(ExpenseType, 'businessExpenseType', expense.expenseType)

/** The description, or the expense type when there is none (lists and details agree). */
export const expenseTitle = (expense: ExpenseData): string =>
  expense.description || expenseTypeLabel(expense)

export const expenseFields = (expense: ExpenseData): EntityField[] => [
  { label: Locales.t('description'), value: expense.description },
  { label: Locales.t('invoiceDate'), value: formatDate(expense.invoiceDate) },
  { label: Locales.t('viewerExpenseType'), value: expenseTypeLabel(expense) },
  ...amountFields(expense),
  {
    label: Locales.t('viewerDeductiblePercentage'),
    value: `${expense.deductiblePercentage}%`,
  },
  {
    label: Locales.t('viewerDeductibleTotal'),
    value: formatMoney(expense.deductibleTotal),
  },
  paymentMethodField(expense.paymentMethod),
  { label: Locales.t('businessId'), value: expense.businessId },
  { label: Locales.t('dpaCategory'), value: expense.dpaCategory },
  { label: Locales.t('notes'), value: expense.notes },
  { label: Locales.t('creationDate'), value: formatDate(expense.creationDate) },
]
