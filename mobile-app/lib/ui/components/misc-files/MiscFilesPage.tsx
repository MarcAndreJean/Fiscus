import { router } from 'expo-router'
import React from 'react'

import { useDeleteMiscFile, useMiscFiles } from '../../../api/miscFiles'
import { useAppContext } from '../../../context'
import { enumLabel } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { MiscFileCategory } from '../../../types'
import { formatDate, formatMoney, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { YearFilter } from '../shared/ListFilters'

const MiscFilesPage = () => {
  const { appContext, updateAppContext } = useAppContext()
  const query = useMiscFiles({ year: appContext.currentYear })
  const deleteMiscFile = useDeleteMiscFile()

  return (
    <EntityListPage
      filters={
        <YearFilter
          value={appContext.currentYear}
          onChange={(year) => updateAppContext({ currentYear: year })}
        />
      }
      items={query.data}
      isLoading={query.isLoading}
      error={query.error}
      refetch={query.refetch}
      keyOf={(file) => file.id}
      renderItem={(file) => {
        const category = enumLabel(
          MiscFileCategory,
          'miscFileCategory',
          file.category,
        )
        return (
          <EntityListItem
            title={file.description || category}
            description={summaryLine(
              formatDate(file.date),
              category,
              file.amount === null ? null : formatMoney(file.amount),
            )}
            icon="file"
            onPress={() => router.push(detailsRoute('misc-file', file.id))}
            onEdit={() => router.push(formRoute('misc-file', file.id))}
            onDelete={() =>
              deleteMiscFile.mutateAsync({ id: file.id, date: file.date })
            }
          />
        )
      }}
      onCreate={() => router.push(formRoute('misc-file'))}
    />
  )
}

export default MiscFilesPage
