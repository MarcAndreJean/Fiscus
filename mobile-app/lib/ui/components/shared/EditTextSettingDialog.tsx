import React from 'react'
import { Button, Dialog, Portal, TextInput } from 'react-native-paper'

import { Locales } from '../../../locales'

type Props = {
  visible: boolean
  label: string
  value: string
  onSubmit: (value: string) => void
  onDismiss: () => void
}

/** A dialog with one text field; the value is only applied when the user confirms. */
const EditTextSettingDialog = ({
  visible,
  label,
  value,
  onSubmit,
  onDismiss,
}: Props) => {
  const [draft, setDraft] = React.useState(value)

  React.useEffect(() => {
    if (visible) setDraft(value)
  }, [visible, value])

  const submit = () => onSubmit(draft)

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{label}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label={label}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            autoCapitalize="none"
            autoFocus
            returnKeyType="done"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{Locales.t('cancel')}</Button>
          <Button onPress={submit}>{Locales.t('ok')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

export default EditTextSettingDialog
