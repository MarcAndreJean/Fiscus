import { Locales } from '../../../locales'
import type { TravelLogData } from '../../../types'
import { formatDate } from '../../../utils/format'
import type { EntityField } from '../shared/EntityField'

export const travelLogFields = (log: TravelLogData): EntityField[] => [
  { label: Locales.t('viewerReason'), value: log.reason },
  { label: Locales.t('viewerTravelDate'), value: formatDate(log.travelDate) },
  {
    label: Locales.t('viewerTotalKm'),
    value: log.totalKm === null ? null : `${log.totalKm} km`,
  },
  {
    label: Locales.t('viewerConsumption'),
    value: log.consumption === null ? null : `${log.consumption} L/100km`,
  },
  { label: Locales.t('businessId'), value: log.businessId },
  { label: Locales.t('carId'), value: log.carId },
  { label: Locales.t('notes'), value: log.notes },
  { label: Locales.t('creationDate'), value: formatDate(log.creationDate) },
]
