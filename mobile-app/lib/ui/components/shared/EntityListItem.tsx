import React from 'react'
import { IconButton, List, Menu } from 'react-native-paper'

import ConfirmDialog from './ConfirmDialog'
import { useSubmit } from './useSubmit'
import { Locales } from '../../../locales'

type Props = {
  title: string
  description: string
  icon: string
  onPress: () => void
  onEdit: () => void
  /** Deletes the entry; errors are shown in the confirm dialog. */
  onDelete: () => Promise<unknown>
}

const EntityListItem = ({
  title,
  description,
  icon,
  onPress,
  onEdit,
  onDelete,
}: Props) => {
  const [menuVisible, setMenuVisible] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const deletion = useSubmit(onDelete, () => setConfirming(false))

  return (
    <>
      <List.Item
        title={title}
        description={description}
        descriptionNumberOfLines={2}
        onPress={onPress}
        left={(props) => <List.Icon {...props} icon={icon} />}
        right={() => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              title={Locales.t('edit')}
              onPress={() => {
                setMenuVisible(false)
                onEdit()
              }}
            />
            <Menu.Item
              leadingIcon="delete"
              title={Locales.t('delete')}
              onPress={() => {
                setMenuVisible(false)
                setConfirming(true)
              }}
            />
          </Menu>
        )}
      />
      <ConfirmDialog
        visible={confirming}
        title={Locales.t('deleteConfirmTitle')}
        message={Locales.t('deleteConfirmMessage')}
        confirmLabel={Locales.t('delete')}
        loading={deletion.isSaving}
        error={deletion.error}
        onConfirm={deletion.submit}
        onDismiss={() => {
          setConfirming(false)
          deletion.clearError()
        }}
      />
    </>
  )
}

export default EntityListItem
