import type { Href } from 'expo-router'

export type EntityKind =
  | 'expense'
  | 'car-expense'
  | 'house-expense'
  | 'income'
  | 'travel-log'
  | 'misc-file'

const DETAILS = {
  expense: '/expense-details',
  'car-expense': '/car-expense-details',
  'house-expense': '/house-expense-details',
  income: '/income-details',
  'travel-log': '/travel-log-details',
  'misc-file': '/misc-file-details',
} as const

const FORMS = {
  expense: '/expense-form',
  'car-expense': '/car-expense-form',
  'house-expense': '/house-expense-form',
  income: '/income-form',
  'travel-log': '/travel-log-form',
  'misc-file': '/misc-file-form',
} as const

export const detailsRoute = (kind: EntityKind, id: string): Href => ({
  pathname: DETAILS[kind],
  params: { id },
})

/** The create form, or the edit form when an id is given. */
export const formRoute = (kind: EntityKind, id?: string): Href =>
  id ? { pathname: FORMS[kind], params: { id } } : FORMS[kind]

/** Every modal route with its default header title (forms set "Edit ..." themselves). */
export const MODAL_SCREENS: { name: string; titleKey: string }[] = [
  { name: 'expense-form', titleKey: 'createExpenseTitle' },
  { name: 'car-expense-form', titleKey: 'createCarExpenseTitle' },
  { name: 'house-expense-form', titleKey: 'createHouseExpenseTitle' },
  { name: 'income-form', titleKey: 'createIncomeTitle' },
  { name: 'travel-log-form', titleKey: 'createTravelLogTitle' },
  { name: 'misc-file-form', titleKey: 'createMiscFileTitle' },
  { name: 'expense-details', titleKey: 'viewExpenseTitle' },
  { name: 'car-expense-details', titleKey: 'viewCarExpenseTitle' },
  { name: 'house-expense-details', titleKey: 'viewHouseExpenseTitle' },
  { name: 'income-details', titleKey: 'viewIncomeTitle' },
  { name: 'travel-log-details', titleKey: 'viewTravelLogTitle' },
  { name: 'misc-file-details', titleKey: 'viewMiscFileTitle' },
]
