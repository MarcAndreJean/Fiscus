import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper'
import { Dropdown } from 'react-native-paper-dropdown'

import type { ExpenseItemDraft } from './expenseFormModels'
import { Locales } from '../../../locales'
import { ExpenseType } from '../../../types'
import AmountInput from '../inputs/AmountInput'

type Props = {
  item: ExpenseItemDraft
  typeOptions: { label: string; value: string }[]
  typeDescriptionPrefix?: string
  showDeductible: boolean
  /** Shows the CCA class field when the item is a CCA expense. */
  showDpaCategory: boolean
  removable: boolean
  onChange: (patch: Partial<ExpenseItemDraft>) => void
  onRemove: () => void
}

/** One invoice line: description, type, amount and (business only) usage percentage. */
const ExpenseItemFields = ({
  item,
  typeOptions,
  typeDescriptionPrefix,
  showDeductible,
  showDpaCategory,
  removable,
  onChange,
  onRemove,
}: Props) => {
  const theme = useTheme()

  return (
    <Surface
      style={[styles.container, { borderColor: theme.colors.outlineVariant }]}
      elevation={1}
    >
      <View style={styles.header}>
        <Text variant="titleMedium">{Locales.t('expenseItem')}</Text>
        {removable && (
          <IconButton
            icon="delete"
            accessibilityLabel={Locales.t('delete')}
            onPress={onRemove}
          />
        )}
      </View>

      <TextInput
        mode="outlined"
        style={styles.input}
        label={Locales.t('description')}
        value={item.description}
        enterKeyHint="done"
        onChangeText={(description) => onChange({ description })}
      />

      <View style={styles.input}>
        <Dropdown
          mode="outlined"
          label={Locales.t('expenseType')}
          options={typeOptions}
          value={item.expenseType}
          onSelect={(expenseType) => expenseType && onChange({ expenseType })}
        />
        {typeDescriptionPrefix && (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {Locales.t(`${typeDescriptionPrefix}.${item.expenseType}`, {
              defaultValue: '',
            })}
          </Text>
        )}
      </View>

      <AmountInput
        value={item.amount}
        onChange={(amount) => onChange({ amount })}
      />

      {showDpaCategory &&
        item.expenseType === ExpenseType.CapitalCostAllowance && (
          <TextInput
            mode="outlined"
            style={styles.input}
            label={Locales.t('dpaCategoryLabel')}
            value={item.dpaCategory}
            enterKeyHint="done"
            onChangeText={(dpaCategory) => onChange({ dpaCategory })}
          />
        )}

      {showDeductible && (
        <TextInput
          mode="outlined"
          style={styles.input}
          label={Locales.t('usagePercentage')}
          keyboardType="numeric"
          enterKeyHint="done"
          value={item.deductiblePercentage}
          onChangeText={(deductiblePercentage) =>
            onChange({ deductiblePercentage })
          }
          right={<TextInput.Affix text="%" />}
        />
      )}
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
})

export default ExpenseItemFields
