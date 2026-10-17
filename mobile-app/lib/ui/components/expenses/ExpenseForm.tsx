import React from 'react'
import { Button, TextInput } from 'react-native-paper'
import { DatePickerInput } from 'react-native-paper-dates'

import ExpenseItemFields from './ExpenseItemFields'
import type { AnyExpense } from './expenseFormModels'
import type { ExpenseKind } from './expenseKinds'
import { useExpenseForm } from './useExpenseForm'
import { enumOptions, Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import AttachmentsField from '../inputs/AttachmentsField'
import OwnerDropdown from '../inputs/OwnerDropdown'
import PaymentMethodDropdown from '../inputs/PaymentMethodDropdown'
import FormScreen, { formStyles } from '../shared/FormScreen'

type Props = {
  kind: ExpenseKind
  /** The record to edit; omitted to create new ones. */
  existing?: AnyExpense
}

const ExpenseForm = ({ kind, existing }: Props) => {
  const auth = useAuth()
  const form = useExpenseForm(kind, existing)
  const { config, draft } = form
  const typeOptions = React.useMemo(
    () => enumOptions(config.typeEnum, config.typeLabelPrefix),
    [config],
  )

  return (
    <FormScreen
      title={Locales.t(existing ? config.editTitleKey : config.createTitleKey)}
      submitLabel={Locales.t(existing ? 'saveChanges' : 'save')}
      onSubmit={form.submit}
      isSaving={form.isSaving}
      error={form.error}
      onDismissError={form.clearError}
    >
      <OwnerDropdown
        label={Locales.t(config.ownerLabelKey)}
        ids={config.ownerIds(auth)}
        value={draft.ownerId}
        onChange={(ownerId) => form.updateDraft({ ownerId })}
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
        label={Locales.t('notes')}
        multiline
        value={draft.notes}
        onChangeText={(notes) => form.updateDraft({ notes })}
      />

      {config.hasPaymentAndDpa && (
        <PaymentMethodDropdown
          value={draft.paymentMethod}
          onChange={(paymentMethod) => form.updateDraft({ paymentMethod })}
        />
      )}

      {draft.items.map((item) => (
        <ExpenseItemFields
          key={item.key}
          item={item}
          typeOptions={typeOptions}
          typeDescriptionPrefix={config.typeDescriptionPrefix}
          showDeductible={config.hasDeductible}
          showDpaCategory={config.hasPaymentAndDpa}
          removable={!existing && draft.items.length > 1}
          onChange={(patch) => form.updateItem(item.key, patch)}
          onRemove={() => form.removeItem(item.key)}
        />
      ))}

      {!existing && (
        <Button
          icon="plus"
          mode="outlined"
          onPress={form.addItem}
          style={formStyles.input}
        >
          {Locales.t('addItem')}
        </Button>
      )}

      <AttachmentsField {...form.attachments.fieldProps} />
    </FormScreen>
  )
}

export default ExpenseForm
