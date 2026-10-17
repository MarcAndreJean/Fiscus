import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import React from 'react'
import { type DropzoneState, useDropzone } from 'react-dropzone'
import { StyleSheet, Text, View } from 'react-native'
import { Button, useTheme } from 'react-native-paper'

import { PickedFileList, PickedImageList } from './PickedAssetLists'
import type { FileUploadInputProps } from './fileUploadTypes'
import { Locales } from '../../../locales'
import { readWebFileAsBase64 } from '../../../utils/files'

type DropZoneProps = {
  dropzone: DropzoneState
  hint: string
  dropHint: string
  buttonIcon: string
  buttonLabel: string
  onPick: () => void
}

/** An area that accepts dragged files, with a button to pick them instead. */
const DropZone = ({
  dropzone,
  hint,
  dropHint,
  buttonIcon,
  buttonLabel,
  onPick,
}: DropZoneProps) => {
  const theme = useTheme()
  const dragging = {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  }
  return (
    <div
      {...dropzone.getRootProps()}
      style={{
        ...style.dropZone,
        borderColor: theme.colors.outlineVariant,
        ...(dropzone.isDragActive ? dragging : {}),
        ...style.input,
        minHeight: 100,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <input {...dropzone.getInputProps()} />
      <Text style={[style.dropText, { color: theme.colors.onSurfaceVariant }]}>
        {dropzone.isDragActive ? dropHint : hint}
      </Text>
      <Button
        icon={buttonIcon}
        mode="outlined"
        onPress={onPick}
        style={{ marginTop: 8 }}
      >
        {buttonLabel}
      </Button>
    </div>
  )
}

const WebFileUploadInputCore = ({
  files,
  onFileChange,
  images,
  onImageChange,
}: FileUploadInputProps) => {
  const pickImages = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: true,
      base64: true,
    })

    if (!result.canceled) {
      onImageChange(images.concat(result.assets))
    }
  }

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync()

    if (!result.canceled) {
      onFileChange(files.concat(result.assets))
    }
  }

  const fileDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        file,
      }))
      onFileChange([...files, ...newFiles])
    },
    noClick: false,
    noKeyboard: true,
  })

  const imageDropzone = useDropzone({
    onDrop: async (acceptedFiles) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith('image/'),
      )

      const newImages = await Promise.all(
        imageFiles.map(async (file) => {
          const base64 = await readWebFileAsBase64(file)
          return {
            uri: URL.createObjectURL(file),
            width: 0,
            height: 0,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            file,
            base64,
          }
        }),
      )

      onImageChange([...images, ...newImages])
    },
    accept: {
      'image/*': [],
    },
    noClick: false,
    noKeyboard: true,
  })

  return (
    <View style={{ width: '100%' }}>
      <DropZone
        dropzone={fileDropzone}
        hint={Locales.t('dragFilesHere')}
        dropHint={Locales.t('dropFilesHere')}
        buttonIcon="file"
        buttonLabel={Locales.t('selectFiles')}
        onPick={pickFiles}
      />
      <PickedFileList files={files} />

      <DropZone
        dropzone={imageDropzone}
        hint={Locales.t('dragImagesHere')}
        dropHint={Locales.t('dropImagesHere')}
        buttonIcon="image"
        buttonLabel={Locales.t('selectImages')}
        onPick={pickImages}
      />
      <PickedImageList images={images} />
    </View>
  )
}

const style = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  dropZone: {
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropText: {
    textAlign: 'center',
    marginBottom: 8,
  },
})

export default WebFileUploadInputCore
