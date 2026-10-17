import { describe, expect, it } from '@jest/globals'

import { enumLabel } from '../../../locales/enumLabel'
import {
  CarExpenseType,
  type CarExpenseData,
  type ExpenseData,
  ExpenseType,
  type TravelLogData,
} from '../../../types'
import { carExpenseFields } from '../car-expenses/carExpenseFields'
import { expenseFields } from '../expenses/expenseFields'
import { incomeFields } from '../incomes/incomeFields'
import { travelLogFields } from '../travel-logs/travelLogFields'

const valueOf = (fields: { label: string; value: unknown }[], label: string) =>
  fields.find((field) => field.label === label)?.value

const expense: ExpenseData = {
  id: 'e1',
  userId: 'u',
  businessId: 'biz',
  expenseGroupId: '1',
  invoiceDate: '2025-06-03T10:00:00.000',
  description: 'Paper',
  expenseType: ExpenseType.Unclassified,
  dpaCategory: null,
  paymentMethod: null,
  subtotal: 0,
  hasTps: false,
  hasTvq: true,
  tps: 0,
  tvq: 1.5,
  total: 1.5,
  deductiblePercentage: 50,
  deductibleSubtotal: 0,
  deductibleTps: 0,
  deductibleTvq: 0.75,
  deductibleTotal: 0.75,
  notes: '',
  creationDate: '2025-06-04T08:00:00.000',
  images: [],
  files: [],
}

describe('enumLabel', () => {
  it('translates a stored enum value', () => {
    expect(enumLabel(CarExpenseType, 'carExpenseType', 'car_wash')).toBe(
      'Car wash',
    )
  })

  it('shows an unknown value as is', () => {
    expect(enumLabel(CarExpenseType, 'carExpenseType', 'teleport')).toBe(
      'teleport',
    )
  })
})

describe('expenseFields', () => {
  const fields = expenseFields(expense)

  it('shows a zero amount instead of hiding it', () => {
    expect(valueOf(fields, 'Subtotal')).toBe('$0.00')
  })

  it('marks a tax that was not charged', () => {
    expect(valueOf(fields, 'TPS')).toBe('N/A')
    expect(valueOf(fields, 'TVQ')).toBe('$1.50')
  })

  it('formats dates and the deductible part', () => {
    expect(valueOf(fields, 'Invoice date')).toBe('2025-06-03')
    expect(valueOf(fields, 'Deductible %')).toBe('50%')
    expect(valueOf(fields, 'Deductible Total')).toBe('$0.75')
  })
})

describe('carExpenseFields', () => {
  it('translates the type and names the car', () => {
    const car: CarExpenseData = {
      ...expense,
      carId: 'civic',
      expenseType: CarExpenseType.CarWash,
    }
    const fields = carExpenseFields(car)
    expect(valueOf(fields, 'Type')).toBe('Car wash')
    expect(valueOf(fields, 'Car')).toBe('civic')
  })
})

describe('travelLogFields', () => {
  it('shows distance and consumption with units, or a dash when unknown', () => {
    const log: TravelLogData = {
      id: 't',
      userId: 'u',
      carId: 'civic',
      businessId: 'biz',
      travelDate: '2025-03-01T08:00:00.000',
      reason: 'Client visit',
      notes: '',
      totalKm: 0,
      consumption: null,
      creationDate: '2025-03-01T09:00:00.000',
      images: [],
      files: [],
    }
    const fields = travelLogFields(log)
    expect(valueOf(fields, 'Total KM')).toBe('0 km')
    expect(valueOf(fields, 'Consumption')).toBeNull()
  })
})

describe('payment method row', () => {
  it.each([
    ['creditCard', 'Credit card'],
    ['unknow', 'unknow'],
    [null, null],
  ])('shows %p as %p', (paymentMethod, expected) => {
    const fields = expenseFields({ ...expense, paymentMethod })
    expect(valueOf(fields, 'Payment method')).toBe(expected)
  })
})

describe('incomeFields', () => {
  it('lists each invoice line with its total', () => {
    const line = { subtotal: 10, hasTps: false, hasTvq: false, tps: 0, tvq: 0 }
    const fields = incomeFields({
      id: 'i',
      userId: 'u',
      businessId: 'b',
      invoiceDate: '2025-01-01T00:00:00.000',
      clientName: 'ACME',
      description: '',
      subtotal: 30,
      hasTps: false,
      hasTvq: false,
      tps: 0,
      tvq: 0,
      total: 30,
      notes: '',
      paymentMethod: null,
      creationDate: '',
      items: [
        { ...line, item: 'Design', total: 10 },
        { ...line, item: '', subtotal: 20, total: 20 },
      ],
      images: [],
      files: [],
    })
    expect(valueOf(fields, 'Design')).toBe('$10.00')
    expect(valueOf(fields, 'Line 2')).toBe('$20.00')
  })
})
