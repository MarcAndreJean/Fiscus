import type { Attachments } from './FileModels'

export type TravelLogData = Attachments & {
  id: string
  userId: string
  carId: string
  businessId: string
  travelDate: string
  reason: string
  notes: string
  totalKm: number | null
  consumption: number | null // L/100 km
  creationDate: string
}

export type CreateTravelLogModel = Omit<TravelLogData, 'id' | 'creationDate'>

// The owner (userId) of a travel log never changes.
export type UpdateTravelLogModel = Omit<CreateTravelLogModel, 'userId'> & {
  id: string
  oldTravelDate: string
}

export type DeleteTravelLogModel = Pick<TravelLogData, 'id' | 'travelDate'>
