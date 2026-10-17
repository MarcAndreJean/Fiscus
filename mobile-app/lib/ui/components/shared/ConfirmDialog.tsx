import React from 'react'
import { Button, Dialog, HelperText, Portal, Text } from 'react-native-paper'

import { Locales } from '../../../locales'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onDismiss: () => void
}

const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel,
  loading = false,
  error = null,
  onConfirm,
  onDismiss,
}: Props) => (
  <Portal>
    <Dialog visible={visible} onDismiss={loading ? undefined : onDismiss}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">{message}</Text>
        {error && (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={loading}>
          {Locales.t('cancel')}
        </Button>
        <Button onPress={onConfirm} loading={loading} disabled={loading}>
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
)

export default ConfirmDialog
