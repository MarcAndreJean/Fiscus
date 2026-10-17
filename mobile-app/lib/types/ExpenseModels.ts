import type { TaxedAmounts } from './AmountFields'
import type { Attachments } from './FileModels'

/** A business expense as the app holds it (attachments already parsed). */
export type ExpenseData = TaxedAmounts &
  Attachments & {
    id: string
    userId: string
    businessId: string
    expenseGroupId: string // epoch ms shared by the items of one invoice
    invoiceDate: string
    description: string
    expenseType: ExpenseType
    dpaCategory: string | null // CCA class, CCA expenses only
    paymentMethod: string | null
    deductiblePercentage: number
    deductibleSubtotal: number // computed by the API
    deductibleTps: number // computed by the API
    deductibleTvq: number // computed by the API
    deductibleTotal: number // computed by the API
    notes: string
    creationDate: string
  }

type ServerFields =
  | 'id'
  | 'creationDate'
  | 'deductibleSubtotal'
  | 'deductibleTps'
  | 'deductibleTvq'
  | 'deductibleTotal'

export type CreateExpenseModel = Omit<ExpenseData, ServerFields>

export type UpdateExpenseModel = Omit<
  CreateExpenseModel,
  'userId' | 'expenseGroupId'
> & {
  id: string
  oldInvoiceDate: string
}

export type DeleteExpenseModel = Pick<ExpenseData, 'id' | 'invoiceDate'>

// CRA T2125 line numbers in comments.
export enum ExpenseType {
  OfficeExpenses = 'officeExpenses', // 8811 - 4I
  OfficeStationeryAndSupplies = 'officeStationeryAndSupplies', // 8860 - 4J
  DeliveryFreightAndExpress = 'deliveryFreightAndExpress', // 9281 - 4T
  MealsAndEntertainment = 'mealsAndEntertainment', // 8522 - 4B
  TravelExpenses = 'TravelExpenses', // 9220 - 4Q
  // BusinessTaxesLicencesAndMemberships = 'businessTaxesLicencesAndMemberships', // 8810 - 4H
  ProfessionalFees = 'professionalFees', // 8871 - 4K
  // ManagementAndAdministrationFees = 'managementAndAdministrationFees', // 8910 - 4L
  // BusinessRent = 'businessRent', // 8960 - 4M
  RepairsAndMaintenance = 'repairsAndMaintenance', // 9060 - 4N
  // SalariesAndWages = 'salariesAndWages', // 9180 - 4O
  // PropertyTaxes = 'propertyTaxes', // 9200 - 4P
  Utilities = 'utilities', // 9224 - 4R
  // FuelCosts = 'fuelCosts', // 9275 - 4S
  Advertising = 'advertising', // 8521 - 4B
  Insurance = 'insurance', // 8710 - 4F
  InterestAndBankCharges = 'interestAndBankCharges', // 8760 - 4G
  BadDebts = 'badDebts', // 8690 - 4E
  CapitalCostAllowance = 'capitalCostAllowance', // 9270 - 4V
  Unclassified = 'unclassified',
}
