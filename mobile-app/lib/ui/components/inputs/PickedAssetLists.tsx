import type { DocumentPickerAsset } from 'expo-document-picker'
import type { ImagePickerAsset } from 'expo-image-picker'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTheme } from 'react-native-paper'

import { humanizeFileSize, truncateFileName } from '../../../utils/files'

const MAX_NAME_LENGTH = 24

/** The files picked for upload (not saved yet), with their sizes. */
export const PickedFileList = ({ files }: { files: DocumentPickerAsset[] }) => {
  const theme = useTheme()
  if (files.length === 0) return null
  return (
    <View style={[styles.container, styles.input]}>
      {files.map((file) => (
        <View
          key={file.uri}
          style={[
            styles.container,
            styles.fileItem,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text style={styles.caption}>
            {truncateFileName(
              file.file?.name ?? file.name ?? '',
              MAX_NAME_LENGTH,
            )}{' '}
            ({humanizeFileSize(file.size)})
          </Text>
        </View>
      ))}
    </View>
  )
}

/** Thumbnails of the images picked for upload (not saved yet), with their sizes. */
export const PickedImageList = ({ images }: { images: ImagePickerAsset[] }) => {
  const theme = useTheme()
  if (images.length === 0) return null
  return (
    <View style={[styles.imageContainer, styles.input]}>
      {images.map((image) => (
        <View key={image.uri}>
          <Image style={styles.image} source={{ uri: image.uri }} />
          <Text
            style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
          >
            {truncateFileName(image.fileName ?? '', MAX_NAME_LENGTH)} (
            {humanizeFileSize(image.fileSize)})
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  fileItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  caption: {
    textAlign: 'right',
  },
  image: {
    width: 200,
    height: 200,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    justifyContent: 'center',
  },
})
