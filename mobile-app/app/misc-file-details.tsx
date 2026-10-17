import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  miscFileFields,
  Locales,
  useCachedMiscFile,
  useDeleteMiscFile,
} from '@/lib'

const MiscFileDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const miscFile = useCachedMiscFile(id)
  const deleteMiscFile = useDeleteMiscFile()

  return (
    <DetailsScreen found={!!miscFile}>
      {miscFile && (
        <EntityViewer
          id={miscFile.id}
          title={miscFile.description || Locales.t('titleMiscFiles')}
          icon="file"
          fields={miscFileFields(miscFile)}
          images={miscFile.images}
          files={miscFile.files}
          onEdit={() => router.push(formRoute('misc-file', miscFile.id))}
          onDelete={() =>
            deleteMiscFile.mutateAsync({
              id: miscFile.id,
              date: miscFile.date,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default MiscFileDetails
