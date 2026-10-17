import type { TaxedAmounts } from './AmountFields'
import type { Attachments } from './FileModels'

export type HouseExpenseData = TaxedAmounts &
  Attachments & {
    id: string
    houseId: string
    expenseGroupId: string // epoch ms shared by the items of one invoice
    invoiceDate: string
    description: string
    expenseType: HouseExpenseType
    notes: string
    creationDate: string
  }

export type CreateHouseExpenseModel = Omit<
  HouseExpenseData,
  'id' | 'creationDate'
>

export type UpdateHouseExpenseModel = Omit<
  CreateHouseExpenseModel,
  'expenseGroupId'
> & {
  id: string
  oldInvoiceDate: string
}

export type DeleteHouseExpenseModel = Pick<
  HouseExpenseData,
  'id' | 'invoiceDate'
>

export enum HouseExpenseType {
  Maintenance = 'maintenance',
  Electricity = 'electricity',
  Insurance = 'insurance',
  Internet = 'internet',
  Rent = 'rent',
  // Heating = 'heating',
  // MortgageInterest = 'mortgageInterest',
  // Phone = 'phone',
  Unclassified = 'unclassified',
}
