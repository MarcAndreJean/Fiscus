export type ReportType =
  | 'travel-logs'
  | 'incomes'
  | 'expenses'
  | 'house-expenses'
  | 'car-expenses'
  | 'misc-files'
  | 'duplicates'

export type ReportParams = {
  fromDate: string // YYYY-MM-DD
  toDate: string // YYYY-MM-DD
  userId?: string
  businessId?: string
  carId?: string
}

export type ReportDownloadResult = {
  success: boolean
  filename: string
  error?: string
}
