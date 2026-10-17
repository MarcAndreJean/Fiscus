import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  travelLogFields,
  Locales,
  useCachedTravelLog,
  useDeleteTravelLog,
} from '@/lib'

const TravelLogDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const travelLog = useCachedTravelLog(id)
  const deleteTravelLog = useDeleteTravelLog()

  return (
    <DetailsScreen found={!!travelLog}>
      {travelLog && (
        <EntityViewer
          id={travelLog.id}
          title={travelLog.reason || Locales.t('titleTravelLogs')}
          icon="map-marker"
          fields={travelLogFields(travelLog)}
          images={travelLog.images}
          files={travelLog.files}
          onEdit={() => router.push(formRoute('travel-log', travelLog.id))}
          onDelete={() =>
            deleteTravelLog.mutateAsync({
              id: travelLog.id,
              travelDate: travelLog.travelDate,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default TravelLogDetails
