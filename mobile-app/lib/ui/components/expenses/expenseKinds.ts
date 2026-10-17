import { parseCarExpense } from '../../../api/carExpenses'
import type { RawEntity } from '../../../api/entities'
import { parseExpense } from '../../../api/expenses'
import { parseHouseExpense } from '../../../api/houseExpenses'
import type { Resource } from '../../../api/queryKeys'
import type { AppContextType } from '../../../context/AppContext'
import type { EntityKind } from '../../../navigation'
import type { AuthSettings } from '../../../settings/useAuth'
import {
  type CarExpenseData,
  CarExpenseType,
  type ExpenseData,
  ExpenseType,
  FileCategory,
  type HouseExpenseData,
  HouseExpenseType,
} from '../../../types'

/** Business, car and house expenses share one form; this is what differs. */
export type ExpenseKind = Extract<
  EntityKind,
  'expense' | 'car-expense' | 'house-expense'
>

export type ExpenseKindConfig = {
  resource: Resource
  parse: (raw: RawEntity) => ExpenseData | CarExpenseData | HouseExpenseData
  ownerField: 'businessId' | 'carId' | 'houseId'
  ownerLabelKey: string
  ownerIds: (auth: AuthSettings) => string[]
  currentOwner: (context: AppContextType) => string
  typeEnum: Record<string, string>
  typeLabelPrefix: string
  /** Locale prefix of a help text per type value, when the kind has one. */
  typeDescriptionPrefix?: string
  fileCategory: FileCategory
  /** Business expenses carry a usage (deductible) percentage. */
  hasDeductible: boolean
  /** Business expenses also record how they were paid and a CCA class for CCA items. */
  hasPaymentAndDpa: boolean
  /** The type a new item starts with: the last one saved for this kind. */
  lastType: (context: AppContextType) => string
  rememberType: (type: string) => Partial<AppContextType>
  createTitleKey: string
  editTitleKey: string
}

export const EXPENSE_KINDS: Record<ExpenseKind, ExpenseKindConfig> = {
  expense: {
    resource: 'expenses',
    parse: parseExpense,
    ownerField: 'businessId',
    ownerLabelKey: 'businessId',
    ownerIds: (auth) => auth.businessIds,
    currentOwner: (context) => context.currentBusinessId,
    typeEnum: ExpenseType,
    typeLabelPrefix: 'businessExpenseType',
    typeDescriptionPrefix: 'businessExpenseTypeDescription',
    fileCategory: FileCategory.Expense,
    hasDeductible: true,
    hasPaymentAndDpa: true,
    lastType: (context) => context.lastBusinessExpenseType,
    rememberType: (type) => ({ lastBusinessExpenseType: type as ExpenseType }),
    createTitleKey: 'createExpenseTitle',
    editTitleKey: 'editExpenseTitle',
  },
  'car-expense': {
    resource: 'car-expenses',
    parse: parseCarExpense,
    ownerField: 'carId',
    ownerLabelKey: 'carId',
    ownerIds: (auth) => auth.carIds,
    currentOwner: (context) => context.currentCarId,
    typeEnum: CarExpenseType,
    typeLabelPrefix: 'carExpenseType',
    fileCategory: FileCategory.CarExpense,
    hasDeductible: false,
    hasPaymentAndDpa: false,
    lastType: (context) => context.lastCarExpenseType,
    rememberType: (type) => ({ lastCarExpenseType: type as CarExpenseType }),
    createTitleKey: 'createCarExpenseTitle',
    editTitleKey: 'editCarExpenseTitle',
  },
  'house-expense': {
    resource: 'house-expenses',
    parse: parseHouseExpense,
    ownerField: 'houseId',
    ownerLabelKey: 'houseId',
    ownerIds: (auth) => auth.houseIds,
    currentOwner: (context) => context.currentHouseId,
    typeEnum: HouseExpenseType,
    typeLabelPrefix: 'houseExpenseType',
    fileCategory: FileCategory.HouseExpense,
    hasDeductible: false,
    hasPaymentAndDpa: false,
    lastType: (context) => context.lastHouseExpenseType,
    rememberType: (type) => ({
      lastHouseExpenseType: type as HouseExpenseType,
    }),
    createTitleKey: 'createHouseExpenseTitle',
    editTitleKey: 'editHouseExpenseTitle',
  },
}
