import { Locales } from '../../../locales'
import { enumLabel } from '../../../locales/enumLabel'
import { type HouseExpenseData, HouseExpenseType } from '../../../types'
import { formatDate } from '../../../utils/format'
import { amountFields, type EntityField } from '../shared/EntityField'

export const houseExpenseTypeLabel = (expense: HouseExpenseData): string =>
  enumLabel(HouseExpenseType, 'houseExpenseType', expense.expenseType)

/** The description, or the expense type when there is none (lists and details agree). */
export const houseExpenseTitle = (expense: HouseExpenseData): string =>
  expense.description || houseExpenseTypeLabel(expense)

export const houseExpenseFields = (
  expense: HouseExpenseData,
): EntityField[] => [
  { label: Locales.t('description'), value: expense.description },
  { label: Locales.t('invoiceDate'), value: formatDate(expense.invoiceDate) },
  {
    label: Locales.t('viewerExpenseType'),
    value: houseExpenseTypeLabel(expense),
  },
  ...amountFields(expense),
  { label: Locales.t('houseId'), value: expense.houseId },
  { label: Locales.t('notes'), value: expense.notes },
  { label: Locales.t('creationDate'), value: formatDate(expense.creationDate) },
]
