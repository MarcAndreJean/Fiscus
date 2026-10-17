import React from 'react'
import { View } from 'react-native'
import { TextInput } from 'react-native-paper'
import { DatePickerInput } from 'react-native-paper-dates'
import { Dropdown } from 'react-native-paper-dropdown'

import { useMiscFileForm } from './useMiscFileForm'
import { enumOptions, Locales } from '../../../locales'
import { MiscFileCategory, type MiscFileData } from '../../../types'
import AttachmentsField from '../inputs/AttachmentsField'
import FormScreen, { formStyles } from '../shared/FormScreen'

const MiscFileForm = ({ existing }: { existing?: MiscFileData }) => {
  const form = useMiscFileForm(existing)
  const { draft } = form
  const categoryOptions = React.useMemo(
    () => enumOptions(MiscFileCategory, 'miscFileCategory'),
    [],
  )

  return (
    <FormScreen
      title={Locales.t(existing ? 'editMiscFileTitle' : 'createMiscFileTitle')}
      submitLabel={Locales.t(existing ? 'saveChanges' : 'save')}
      onSubmit={form.submit}
      isSaving={form.isSaving}
      error={form.error}
      onDismissError={form.clearError}
    >
      <DatePickerInput
        locale="en"
        label={Locales.t('viewerDate')}
        value={draft.date}
        onChange={(date) => date && form.updateDraft({ date })}
        inputMode="start"
        style={formStyles.input}
        mode="outlined"
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('description')}
        value={draft.description}
        enterKeyHint="done"
        onChangeText={(description) => form.updateDraft({ description })}
      />
      <View style={formStyles.input}>
        <Dropdown
          mode="outlined"
          label={Locales.t('viewerCategory')}
          options={categoryOptions}
          value={draft.category}
          onSelect={(category) =>
            category &&
            form.updateDraft({ category: category as MiscFileCategory })
          }
        />
      </View>
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('amountOptional')}
        value={draft.amount}
        keyboardType="decimal-pad"
        enterKeyHint="done"
        onChangeText={(amount) => form.updateDraft({ amount })}
        right={<TextInput.Affix text="$" />}
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('notes')}
        multiline
        value={draft.notes}
        onChangeText={(notes) => form.updateDraft({ notes })}
      />
      <AttachmentsField {...form.attachments.fieldProps} />
    </FormScreen>
  )
}

export default MiscFileForm
