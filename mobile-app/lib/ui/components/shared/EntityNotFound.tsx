import { router } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Button, Surface, Text } from 'react-native-paper'

import { Locales } from '../../../locales'

/** Shown when a details or edit screen is opened for an entry that is not loaded. */
const EntityNotFound = () => (
  <Surface style={styles.container}>
    <Text variant="bodyLarge" style={styles.message}>
      {Locales.t('entityNotFound')}
    </Text>
    <Button mode="contained" onPress={() => router.back()}>
      {Locales.t('back')}
    </Button>
  </Surface>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    textAlign: 'center',
  },
})

export default EntityNotFound
