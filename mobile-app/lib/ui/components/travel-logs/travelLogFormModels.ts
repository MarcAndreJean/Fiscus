import type {
  Attachments,
  CreateTravelLogModel,
  TravelLogData,
  UpdateTravelLogModel,
} from '../../../types'
import { mergeAttachments } from '../../../utils/files'
import {
  keepDateIfUnchanged,
  parseApiDate,
  toApiDateTime,
} from '../../../utils/format'
import { parseDecimal } from '../../../utils/numbers'

/** Number fields stay text while typed; they are parsed on save. */
export type TravelLogDraft = {
  businessId: string
  carId: string
  travelDate: Date
  reason: string
  notes: string
  totalKm: string
  consumption: string // optional, L/100 km
}

export const draftFromTravelLog = (log: TravelLogData): TravelLogDraft => ({
  businessId: log.businessId,
  carId: log.carId,
  travelDate: parseApiDate(log.travelDate),
  reason: log.reason ?? '',
  notes: log.notes ?? '',
  totalKm: log.totalKm == null ? '' : String(log.totalKm),
  consumption: log.consumption == null ? '' : String(log.consumption),
})

export const validateTravelLogDraft = (
  draft: TravelLogDraft,
): string | null => {
  if (!draft.businessId || !draft.carId) return 'errorOwnerRequired'
  const km = parseDecimal(draft.totalKm)
  if (km === null || km < 0) return 'errorKmInvalid'
  if (draft.consumption.trim() && parseDecimal(draft.consumption) === null) {
    return 'errorNumberInvalid'
  }
  return null
}

const fields = (draft: TravelLogDraft) => ({
  businessId: draft.businessId,
  carId: draft.carId,
  reason: draft.reason,
  notes: draft.notes,
  totalKm: parseDecimal(draft.totalKm),
  consumption: parseDecimal(draft.consumption),
})

export const buildTravelLogCreateModel = (
  draft: TravelLogDraft,
  attachments: Attachments,
  userId: string,
): CreateTravelLogModel => ({
  userId,
  travelDate: toApiDateTime(draft.travelDate),
  ...fields(draft),
  ...attachments,
})

export const buildTravelLogUpdateModel = (
  existing: TravelLogData,
  draft: TravelLogDraft,
  kept: Attachments,
  uploaded: Attachments,
): UpdateTravelLogModel => ({
  id: existing.id,
  oldTravelDate: existing.travelDate,
  travelDate: keepDateIfUnchanged(existing.travelDate, draft.travelDate),
  ...fields(draft),
  ...mergeAttachments(kept, uploaded),
})
