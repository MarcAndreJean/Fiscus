import React from 'react'
import { TextInput } from 'react-native-paper'
import { DatePickerInput } from 'react-native-paper-dates'

import { useTravelLogForm } from './useTravelLogForm'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import type { TravelLogData } from '../../../types'
import AttachmentsField from '../inputs/AttachmentsField'
import OwnerDropdown from '../inputs/OwnerDropdown'
import FormScreen, { formStyles } from '../shared/FormScreen'

const TravelLogForm = ({ existing }: { existing?: TravelLogData }) => {
  const auth = useAuth()
  const form = useTravelLogForm(existing)
  const { draft } = form

  return (
    <FormScreen
      title={Locales.t(
        existing ? 'editTravelLogTitle' : 'createTravelLogTitle',
      )}
      submitLabel={Locales.t(existing ? 'saveChanges' : 'save')}
      onSubmit={form.submit}
      isSaving={form.isSaving}
      error={form.error}
      onDismissError={form.clearError}
    >
      <OwnerDropdown
        label={Locales.t('businessId')}
        ids={auth.businessIds}
        value={draft.businessId}
        onChange={(businessId) => form.updateDraft({ businessId })}
      />
      <OwnerDropdown
        label={Locales.t('carId')}
        ids={auth.carIds}
        value={draft.carId}
        onChange={(carId) => form.updateDraft({ carId })}
      />
      <DatePickerInput
        locale="en"
        label={Locales.t('viewerTravelDate')}
        value={draft.travelDate}
        onChange={(travelDate) =>
          travelDate && form.updateDraft({ travelDate })
        }
        inputMode="start"
        style={formStyles.input}
        mode="outlined"
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('viewerReason')}
        value={draft.reason}
        enterKeyHint="done"
        onChangeText={(reason) => form.updateDraft({ reason })}
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('travelledKm')}
        value={draft.totalKm}
        keyboardType="decimal-pad"
        enterKeyHint="done"
        onChangeText={(totalKm) => form.updateDraft({ totalKm })}
        right={<TextInput.Affix text="km" />}
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('consumptionOptional')}
        value={draft.consumption}
        keyboardType="decimal-pad"
        enterKeyHint="done"
        onChangeText={(consumption) => form.updateDraft({ consumption })}
        right={<TextInput.Affix text="L/100km" />}
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

export default TravelLogForm
