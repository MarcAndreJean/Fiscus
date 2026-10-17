import type { TaxedAmounts } from './AmountFields'
import type { Attachments } from './FileModels'

export type CarExpenseData = TaxedAmounts &
  Attachments & {
    id: string
    carId: string
    expenseGroupId: string // epoch ms shared by the items of one invoice
    invoiceDate: string
    description: string
    expenseType: CarExpenseType
    notes: string
    creationDate: string
  }

export type CreateCarExpenseModel = Omit<CarExpenseData, 'id' | 'creationDate'>

export type UpdateCarExpenseModel = Omit<
  CreateCarExpenseModel,
  'expenseGroupId'
> & {
  id: string
  oldInvoiceDate: string
}

export type DeleteCarExpenseModel = Pick<CarExpenseData, 'id' | 'invoiceDate'>

export enum CarExpenseType {
  Gaz = 'gaz',
  Oil = 'oil',
  ParkingFees = 'ParkingFees',
  Maintenance = 'maintenance',
  Insurance = 'insurance',
  Repair = 'repair',
  Registration = 'registration',
  Licence = 'license',
  CarWash = 'car_wash',
  Toll = 'toll',
  // Electricity = 'electricity', // zero-emission vehicle
  Unclassified = 'unclassified',
}
