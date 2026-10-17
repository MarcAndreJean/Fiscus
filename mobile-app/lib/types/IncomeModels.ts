import type { TaxedAmounts } from './AmountFields'
import type { Attachments } from './FileModels'

export type IncomeItemModel = TaxedAmounts & {
  item: string
}

export type IncomeData = TaxedAmounts &
  Attachments & {
    id: string
    userId: string
    businessId: string
    invoiceDate: string
    clientName: string
    description: string
    notes: string
    paymentMethod: string | null
    creationDate: string
    items: IncomeItemModel[]
  }

export type CreateIncomeModel = Omit<IncomeData, 'id' | 'creationDate'>

export type UpdateIncomeModel = Omit<CreateIncomeModel, 'userId'> & {
  id: string
  oldInvoiceDate: string
}

export type DeleteIncomeModel = Pick<IncomeData, 'id' | 'invoiceDate'>
