import React from 'react'
import { View } from 'react-native'
import { Button, HelperText, Text, TextInput } from 'react-native-paper'
import { DatePickerInput } from 'react-native-paper-dates'

import IncomeLineFields from './IncomeLineFields'
import { useIncomeForm } from './useIncomeForm'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import type { IncomeData } from '../../../types'
import { sumAmounts } from '../../../utils/amount'
import { formatMoney } from '../../../utils/format'
import AmountInput from '../inputs/AmountInput'
import AttachmentsField from '../inputs/AttachmentsField'
import OwnerDropdown from '../inputs/OwnerDropdown'
import PaymentMethodDropdown from '../inputs/PaymentMethodDropdown'
import FormScreen, { formStyles } from '../shared/FormScreen'

const IncomeForm = ({ existing }: { existing?: IncomeData }) => {
  const auth = useAuth()
  const form = useIncomeForm(existing)
  const { draft } = form
  const linesTotal = sumAmounts(draft.lines.map((line) => line.amount.result))

  return (
    <FormScreen
      title={Locales.t(existing ? 'editIncomeTitle' : 'createIncomeTitle')}
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
      <DatePickerInput
        locale="en"
        label={Locales.t('invoiceDate')}
        value={draft.invoiceDate}
        onChange={(invoiceDate) =>
          invoiceDate && form.updateDraft({ invoiceDate })
        }
        inputMode="start"
        style={formStyles.input}
        mode="outlined"
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('clientName')}
        value={draft.clientName}
        enterKeyHint="done"
        onChangeText={(clientName) => form.updateDraft({ clientName })}
      />
      <TextInput
        mode="outlined"
        style={formStyles.input}
        label={Locales.t('description')}
        value={draft.description}
        enterKeyHint="done"
        onChangeText={(description) => form.updateDraft({ description })}
      />
      <PaymentMethodDropdown
        value={draft.paymentMethod}
        onChange={(paymentMethod) => form.updateDraft({ paymentMethod })}
      />
      <Text variant="titleMedium" style={formStyles.input}>
        {Locales.t('invoiceLines')}
      </Text>
      {draft.lines.map((line) => (
        <IncomeLineFields
          key={line.key}
          line={line}
          onChange={(patch) => form.updateLine(line.key, patch)}
          onRemove={() => form.removeLine(line.key)}
        />
      ))}
      <Button
        icon="plus"
        mode="outlined"
        onPress={form.addLine}
        style={formStyles.input}
      >
        {Locales.t('addLine')}
      </Button>
      {draft.lines.length > 0 ? (
        <View style={formStyles.input}>
          <HelperText type="info" visible>
            {Locales.t('invoiceLinesHint')}
          </HelperText>
          <Text variant="titleMedium">
            {Locales.t('viewerTotal')}: {formatMoney(linesTotal.total)}
          </Text>
        </View>
      ) : (
        <AmountInput
          value={draft.amount}
          onChange={(amount) => form.updateDraft({ amount })}
        />
      )}
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

export default IncomeForm
