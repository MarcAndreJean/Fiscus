import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Snackbar, Surface } from 'react-native-paper'

import { styles as screenStyles } from '../../styles'

type Props = {
  title: string
  children: React.ReactNode
  submitLabel: string
  onSubmit: () => void
  isSaving: boolean
  error: string | null
  onDismissError: () => void
}

/** Frame of a create/edit modal: title, scrolling fields, submit button and errors. */
const FormScreen = ({
  title,
  children,
  submitLabel,
  onSubmit,
  isSaving,
  error,
  onDismissError,
}: Props) => (
  <Surface style={screenStyles.screen}>
    <Stack.Screen options={{ title }} />
    <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {children}
      <View style={styles.submit}>
        <Button
          icon="send"
          mode="contained"
          loading={isSaving}
          disabled={isSaving}
          onPress={onSubmit}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>

    <Snackbar
      visible={error !== null}
      onDismiss={onDismissError}
      onIconPress={onDismissError}
    >
      {error}
    </Snackbar>
  </Surface>
)

export const formStyles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  submit: {
    marginBottom: 16,
  },
})

export default FormScreen
