import { Locales } from '../../../locales'
import { enumLabel } from '../../../locales/enumLabel'
import { type CarExpenseData, CarExpenseType } from '../../../types'
import { formatDate } from '../../../utils/format'
import { amountFields, type EntityField } from '../shared/EntityField'

export const carExpenseTypeLabel = (expense: CarExpenseData): string =>
  enumLabel(CarExpenseType, 'carExpenseType', expense.expenseType)

/** The description, or the expense type when there is none (lists and details agree). */
export const carExpenseTitle = (expense: CarExpenseData): string =>
  expense.description || carExpenseTypeLabel(expense)

export const carExpenseFields = (expense: CarExpenseData): EntityField[] => [
  { label: Locales.t('description'), value: expense.description },
  { label: Locales.t('invoiceDate'), value: formatDate(expense.invoiceDate) },
  {
    label: Locales.t('viewerExpenseType'),
    value: carExpenseTypeLabel(expense),
  },
  ...amountFields(expense),
  { label: Locales.t('carId'), value: expense.carId },
  { label: Locales.t('notes'), value: expense.notes },
  { label: Locales.t('creationDate'), value: formatDate(expense.creationDate) },
]
