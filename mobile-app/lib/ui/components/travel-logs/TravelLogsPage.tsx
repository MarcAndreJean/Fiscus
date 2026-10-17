import { router } from 'expo-router'
import React from 'react'

import { useDeleteTravelLog, useTravelLogs } from '../../../api/travelLogs'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { useAuth } from '../../../settings'
import { formatDate, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { ALL, IdFilter, YearFilter } from '../shared/ListFilters'

const TravelLogsPage = () => {
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  // This page can also show every business or car at once, so its filters are local.
  const [businessId, setBusinessId] = React.useState(
    appContext.currentBusinessId,
  )
  const [carId, setCarId] = React.useState(appContext.currentCarId)
  const query = useTravelLogs({
    year: appContext.currentYear,
    businessId: businessId === ALL ? null : businessId,
    carId: carId === ALL ? null : carId,
  })
  const deleteTravelLog = useDeleteTravelLog()

  return (
    <EntityListPage
      filters={
        <>
          <YearFilter
            value={appContext.currentYear}
            onChange={(year) => updateAppContext({ currentYear: year })}
          />
          <IdFilter
            label={Locales.t('businessId')}
            ids={auth.businessIds}
            value={businessId}
            onChange={setBusinessId}
            allowAll
          />
          <IdFilter
            label={Locales.t('carId')}
            ids={auth.carIds}
            value={carId}
            onChange={setCarId}
            allowAll
          />
        </>
      }
      items={query.data}
      isLoading={query.isLoading}
      error={query.error}
      refetch={query.refetch}
      keyOf={(log) => log.id}
      renderItem={(log) => (
        <EntityListItem
          title={log.reason || formatDate(log.travelDate)}
          description={summaryLine(
            formatDate(log.travelDate),
            log.totalKm === null ? null : `${log.totalKm} km`,
            log.carId,
            log.businessId,
          )}
          icon="map-marker"
          onPress={() => router.push(detailsRoute('travel-log', log.id))}
          onEdit={() => router.push(formRoute('travel-log', log.id))}
          onDelete={() =>
            deleteTravelLog.mutateAsync({
              id: log.id,
              travelDate: log.travelDate,
            })
          }
        />
      )}
      onCreate={
        auth.businessIds.length && auth.carIds.length
          ? () => router.push(formRoute('travel-log'))
          : undefined
      }
    />
  )
}

export default TravelLogsPage
