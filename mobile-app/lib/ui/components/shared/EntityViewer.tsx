import * as FileSystem from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import { router } from 'expo-router'
import * as Sharing from 'expo-sharing'
import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  List,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper'

import ConfirmDialog from './ConfirmDialog'
import type { EntityField } from './EntityField'
import { useSubmit } from './useSubmit'
import { type ApiClient, useApiClient } from '../../../api/client'
import { getFileUrl } from '../../../api/files'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import type { FileJsonItem } from '../../../types'
import { getMimeType, humanizeFileSize } from '../../../utils/files'

// Android intent flag: lets the app that opens the file read it from this app's storage.
const FLAG_GRANT_READ_URI_PERMISSION = 1

/** Opens a stored file: in a new tab on the web, with the default app on Android, in the share sheet on iOS. */
async function openFile(api: ApiClient, file: FileJsonItem) {
  const url = await getFileUrl(api, file.s3key)
  if (Platform.OS === 'web') {
    Linking.openURL(url)
    return
  }
  const { uri } = await FileSystem.downloadAsync(
    url,
    FileSystem.documentDirectory + file.fileName,
  )
  if (Platform.OS === 'android') {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: await FileSystem.getContentUriAsync(uri),
      flags: FLAG_GRANT_READ_URI_PERMISSION,
      type: getMimeType(file.fileName),
    })
  } else if (await Sharing.isAvailableAsync()) {
    // The iOS share sheet previews the file and offers the apps that can open it.
    await Sharing.shareAsync(uri, { UTI: getMimeType(file.fileName) })
  }
}

/** The display URL of each image, by s3 key; an image whose URL could not be loaded is left out. */
function useImageUrls(api: ApiClient, images: FileJsonItem[]) {
  const { isLoading: isAuthLoading } = useAuth()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Re-run only when the set of images changes, not on every new array.
  const imageKeys = images.map((image) => image.s3key).join('|')

  useEffect(() => {
    if (isAuthLoading) return
    const keys = imageKeys ? imageKeys.split('|') : []
    let active = true
    setLoading(true)
    Promise.all(
      keys.map(async (key) => {
        try {
          return [key, await getFileUrl(api, key)] as const
        } catch (error) {
          console.error('Error loading image URL:', error)
          return null
        }
      }),
    ).then((entries) => {
      if (!active) return
      setUrls(Object.fromEntries(entries.filter((entry) => entry !== null)))
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [imageKeys, isAuthLoading, api])

  return { urls, loading }
}

const displayValue = (value: EntityField['value']): string =>
  value === null || value === undefined || value === '' ? '-' : String(value)

type Props = {
  id: string
  title: string
  icon: string
  fields: EntityField[]
  images: FileJsonItem[]
  files: FileJsonItem[]
  onEdit: () => void
  /** Deletes the entry; on success the screen closes. */
  onDelete: () => Promise<unknown>
}

const EntityViewer = ({
  id,
  title,
  icon,
  fields,
  images,
  files,
  onEdit,
  onDelete,
}: Props) => {
  const theme = useTheme()
  const api = useApiClient()

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const deletion = useSubmit(onDelete, () => {
    setConfirmingDelete(false)
    router.back()
  })

  const { urls: imageUrls, loading: loadingImages } = useImageUrls(api, images)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const downloadFile = async (file: FileJsonItem) => {
    setDownloadingFile(file.s3key)
    setDownloadError(null)
    try {
      await openFile(api, file)
    } catch {
      setDownloadError(Locales.t('downloadFailed'))
    } finally {
      setDownloadingFile(null)
    }
  }

  return (
    <>
      <ScrollView style={style.container}>
        <Surface style={style.headerSection}>
          <List.Item
            title={title}
            description={`${Locales.t('idLabel')}: ${id}`}
            titleStyle={style.headerTitle}
            descriptionStyle={style.headerDescription}
            descriptionNumberOfLines={1}
            left={(props) => (
              <List.Icon {...props} icon={icon} color={theme.colors.primary} />
            )}
            right={() => (
              <View style={style.headerActions}>
                <IconButton
                  icon="pencil"
                  accessibilityLabel={Locales.t('edit')}
                  onPress={onEdit}
                />
                <IconButton
                  icon="delete"
                  accessibilityLabel={Locales.t('delete')}
                  iconColor={theme.colors.error}
                  onPress={() => setConfirmingDelete(true)}
                />
              </View>
            )}
          />
        </Surface>

        <ConfirmDialog
          visible={confirmingDelete}
          title={Locales.t('deleteConfirmTitle')}
          message={Locales.t('deleteConfirmMessage')}
          confirmLabel={Locales.t('delete')}
          loading={deletion.isSaving}
          error={deletion.error}
          onConfirm={deletion.submit}
          onDismiss={() => {
            setConfirmingDelete(false)
            deletion.clearError()
          }}
        />

        <Surface style={style.section}>
          <Text style={style.sectionTitle} variant="titleMedium">
            {Locales.t('viewerDetails')}
          </Text>
          <Divider style={style.divider} />
          {/* A fixed list that never reorders; labels can repeat (invoice lines). */}
          {fields.map((field, index) => (
            <View
              key={index}
              style={[
                style.fieldRow,
                { borderBottomColor: theme.colors.outlineVariant },
              ]}
            >
              <Text style={style.fieldLabel}>{field.label}</Text>
              <Text style={style.fieldValue}>{displayValue(field.value)}</Text>
            </View>
          ))}
        </Surface>

        {images.length > 0 && (
          <Surface style={style.section}>
            <Text style={style.sectionTitle} variant="titleMedium">
              {Locales.t('viewerImages')} ({images.length})
            </Text>
            <Divider style={style.divider} />
            {loadingImages ? (
              <ActivityIndicator
                animating
                color={theme.colors.primary}
                style={style.loader}
              />
            ) : (
              <View style={style.imageContainer}>
                {images.map((image) => (
                  <View key={image.s3key} style={style.imageWrapper}>
                    {imageUrls[image.s3key] ? (
                      <Pressable
                        onPress={() => setSelectedImage(imageUrls[image.s3key])}
                      >
                        <Image
                          source={{ uri: imageUrls[image.s3key] }}
                          style={style.image}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ) : (
                      <View
                        style={[
                          style.image,
                          style.imagePlaceholder,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <Text>{Locales.t('imageFailedToLoad')}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        style.imageCaption,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {image.fileName}
                      {image.size > 0 && ` (${humanizeFileSize(image.size)})`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Surface>
        )}

        {files.length > 0 && (
          <Surface style={style.section}>
            <Text style={style.sectionTitle} variant="titleMedium">
              {Locales.t('viewerFiles')} ({files.length})
            </Text>
            <Divider style={style.divider} />
            {files.map((file) => (
              <Button
                key={file.s3key}
                mode="outlined"
                icon="file-download"
                style={style.fileButton}
                loading={downloadingFile === file.s3key}
                disabled={downloadingFile !== null}
                onPress={() => downloadFile(file)}
              >
                {file.fileName}
                {file.size > 0 && ` (${humanizeFileSize(file.size)})`}
              </Button>
            ))}
          </Surface>
        )}

        <View style={style.bottomPadding} />

        <Modal
          visible={selectedImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={style.modalContainer}>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={30}
              style={style.modalCloseButton}
              onPress={() => setSelectedImage(null)}
            />
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={style.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </ScrollView>

      <Snackbar
        visible={downloadError !== null}
        onDismiss={() => setDownloadError(null)}
      >
        {downloadError}
      </Snackbar>
    </>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerSection: {
    margin: 8,
    elevation: 1,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  section: {
    margin: 8,
    padding: 16,
    elevation: 1,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: {
    fontWeight: '600',
    flex: 1,
  },
  fieldValue: {
    flex: 2,
    textAlign: 'right',
  },
  loader: {
    marginVertical: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCaption: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 200,
  },
  fileButton: {
    marginBottom: 8,
  },
  bottomPadding: {
    height: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1,
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
})

export default EntityViewer
