import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Switch, Text, TextInput } from 'react-native-paper'
import { Dropdown } from 'react-native-paper-dropdown'

import { enumOptions, Locales } from '../../../locales'
import {
  AmountType,
  type AmountState,
  updateAmount,
} from '../../../utils/amount'
import { formatMoney } from '../../../utils/format'

type Props = {
  value: AmountState
  onChange: (next: AmountState) => void
}

/** Amount, tax mode and TPS/TVQ switches, with the computed breakdown below. */
const AmountInput = ({ value, onChange }: Props) => {
  const amountTypeOptions = React.useMemo(
    () => enumOptions(AmountType, 'amountType'),
    [],
  )
  const change = (patch: Parameters<typeof updateAmount>[1]) =>
    onChange(updateAmount(value, patch))
  const { result } = value

  return (
    <View style={styles.container}>
      <View style={styles.input}>
        <Dropdown
          mode="outlined"
          label={Locales.t('amountTypeLabel')}
          options={amountTypeOptions}
          value={value.amountType}
          onSelect={(type) =>
            type && change({ amountType: type as AmountType })
          }
        />
      </View>
      <TextInput
        mode="outlined"
        style={styles.input}
        label={Locales.t('amount')}
        keyboardType="decimal-pad"
        enterKeyHint="done"
        value={value.amount}
        onChangeText={(amount) => change({ amount })}
        right={<TextInput.Affix text="$" />}
      />
      {value.amountType !== AmountType.NoTaxes && (
        <>
          <View style={styles.switchRow}>
            <Text variant="titleMedium">{Locales.t('hasTpsLabel')}</Text>
            <Switch
              value={value.hasTps}
              onValueChange={(hasTps) => change({ hasTps })}
            />
          </View>
          <View style={styles.switchRow}>
            <Text variant="titleMedium">{Locales.t('hasTvqLabel')}</Text>
            <Switch
              value={value.hasTvq}
              onValueChange={(hasTvq) => change({ hasTvq })}
            />
          </View>
        </>
      )}
      <View style={styles.input}>
        <Text style={styles.summary}>
          {Locales.t('subtotal')}: {formatMoney(result.subtotal)}
        </Text>
        {result.hasTps && (
          <Text style={styles.summary}>
            {Locales.t('tps')}: {formatMoney(result.tps)}
          </Text>
        )}
        {result.hasTvq && (
          <Text style={styles.summary}>
            {Locales.t('tvq')}: {formatMoney(result.tvq)}
          </Text>
        )}
        <Text style={styles.summary}>
          {Locales.t('viewerTotal')}: {formatMoney(result.total)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  summary: {
    textAlign: 'right',
  },
})

export default AmountInput
