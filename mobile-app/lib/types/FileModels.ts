export type FileJsonItem = {
  s3key: string
  fileName: string
  size: number // in bytes
}

export type Attachments = {
  images: FileJsonItem[]
  files: FileJsonItem[]
}

export type CreateFileModel = {
  fileContent: string // base64
  fileName: string
  userId: string
  tagId: string | null // businessId, carId or houseId
  category: FileCategory
  year: number
}

export enum FileCategory {
  Invoice = 'invoice',
  Expense = 'expense',
  CarExpense = 'car-expense',
  HouseExpense = 'house-expense',
  TravelLog = 'travel-log',
  MiscFile = 'misc-file',
}
