import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Button } from 'react-native-paper'

import { PickedFileList, PickedImageList } from './PickedAssetLists'
import type { FileUploadInputProps } from './fileUploadTypes'
import { Locales } from '../../../locales'

const FileUploadInputCore = ({
  files,
  onFileChange,
  images,
  onImageChange,
}: FileUploadInputProps) => {
  const [cameraStatus, requestCameraPermission] =
    ImagePicker.useCameraPermissions()
  const [galleryStatus, requestGalleryPermission] =
    ImagePicker.useMediaLibraryPermissions()

  const takePicture = async () => {
    // Opening the camera without permission throws, so stop if the user said no.
    const permission = cameraStatus?.granted
      ? cameraStatus
      : await requestCameraPermission()
    if (!permission.granted) return
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    })

    if (!result.canceled) {
      onImageChange(images.concat(result.assets))
    }
  }

  const pickImages = async () => {
    if (galleryStatus?.granted !== true) {
      await requestGalleryPermission()
    }
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // No allowsEditing: it cannot be combined with allowsMultipleSelection.
      quality: 0.95,
      allowsMultipleSelection: true,
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

  return (
    <View style={{ width: '100%' }}>
      <View style={[style.container, style.input]}>
        <Button
          icon="file"
          mode="outlined"
          onPress={pickFiles}
          children={Locales.t('pickFiles')}
        />
      </View>
      <PickedFileList files={files} />

      <View style={[style.container, style.input]}>
        <Button
          icon="camera"
          mode="outlined"
          onPress={takePicture}
          children={Locales.t('takePicture')}
        />
      </View>
      <View style={[style.container, style.input]}>
        <Button
          icon="image"
          mode="outlined"
          onPress={pickImages}
          children={Locales.t('pickImages')}
        />
      </View>
      <PickedImageList images={images} />
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
})

export default FileUploadInputCore
