import type { Attachments } from './FileModels'

export type MiscFileData = Attachments & {
  id: string
  userId: string
  date: string
  description: string
  notes: string
  category: MiscFileCategory
  amount: number | null
  creationDate: string
}

export type CreateMiscFileModel = Omit<MiscFileData, 'id' | 'creationDate'>

export type UpdateMiscFileModel = Omit<CreateMiscFileModel, 'userId'> & {
  id: string
  oldDate: string
}

export type DeleteMiscFileModel = Pick<MiscFileData, 'id' | 'date'>

export enum MiscFileCategory {
  Medical = 'medical',
  CarAnnualKm = 'carAnnualKm',
  CarRelated = 'carRelated',
  HouseRelated = 'houseRelated',
  BusinessRelated = 'businessRelated',
  Personal = 'personal',
  Others = 'others',
}
