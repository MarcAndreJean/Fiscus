import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper'

import type { IncomeLineDraft } from './incomeFormModels'
import { Locales } from '../../../locales'
import AmountInput from '../inputs/AmountInput'

type Props = {
  line: IncomeLineDraft
  onChange: (patch: Partial<IncomeLineDraft>) => void
  onRemove: () => void
}

/** One invoice line of an income: what was billed and its amount. */
const IncomeLineFields = ({ line, onChange, onRemove }: Props) => {
  const theme = useTheme()

  return (
    <Surface
      style={[styles.container, { borderColor: theme.colors.outlineVariant }]}
      elevation={1}
    >
      <View style={styles.header}>
        <Text variant="titleMedium">{Locales.t('invoiceLine')}</Text>
        <IconButton
          icon="delete"
          accessibilityLabel={Locales.t('delete')}
          onPress={onRemove}
        />
      </View>
      <TextInput
        mode="outlined"
        style={styles.input}
        label={Locales.t('description')}
        value={line.item}
        enterKeyHint="done"
        onChangeText={(item) => onChange({ item })}
      />
      <AmountInput
        value={line.amount}
        onChange={(amount) => onChange({ amount })}
      />
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

export default IncomeLineFields
