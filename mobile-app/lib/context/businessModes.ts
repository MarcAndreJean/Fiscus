export type BusinessMode =
  | 'expenses'
  | 'incomes'
  | 'car-expenses'
  | 'house-expenses'
  | 'travel-logs'
  | 'misc-files'
  | 'reports'

/** The sections of the Business tab, in menu order. */
export const BUSINESS_MODES: {
  mode: BusinessMode
  titleKey: string
  icon: string
  dividerBefore?: boolean
}[] = [
  { mode: 'expenses', titleKey: 'titleExpenses', icon: 'bank-transfer-out' },
  { mode: 'car-expenses', titleKey: 'titleCarExpenses', icon: 'car-outline' },
  {
    mode: 'house-expenses',
    titleKey: 'titleHouseExpenses',
    icon: 'home-outline',
  },
  {
    mode: 'incomes',
    titleKey: 'titleIncomes',
    icon: 'account-cash-outline',
    dividerBefore: true,
  },
  {
    mode: 'travel-logs',
    titleKey: 'titleTravelLogs',
    icon: 'map-outline',
    dividerBefore: true,
  },
  {
    mode: 'misc-files',
    titleKey: 'titleMiscFiles',
    icon: 'file-outline',
    dividerBefore: true,
  },
  {
    mode: 'reports',
    titleKey: 'titleReports',
    icon: 'file-download-outline',
    dividerBefore: true,
  },
]
