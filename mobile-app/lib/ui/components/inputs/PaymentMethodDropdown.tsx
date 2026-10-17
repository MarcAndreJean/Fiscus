import React from 'react'
import { View } from 'react-native'
import { Dropdown } from 'react-native-paper-dropdown'

import { enumOptions, Locales } from '../../../locales'
import { PaymentMethod } from '../../../types'
import { formStyles } from '../shared/FormScreen'

type Props = {
  /** '' when not specified. */
  value: string
  onChange: (value: string) => void
}

/** Optional payment method; a free-text value is kept as its own choice. */
const PaymentMethodDropdown = ({ value, onChange }: Props) => {
  const options = React.useMemo(() => {
    const known = enumOptions(PaymentMethod, 'paymentMethods')
    const freeText =
      value && !known.some((option) => option.value === value)
        ? [{ label: value, value }]
        : []
    return [
      { label: Locales.t('notSpecified'), value: '' },
      ...known,
      ...freeText,
    ]
  }, [value])

  return (
    <View style={formStyles.input}>
      <Dropdown
        mode="outlined"
        label={Locales.t('paymentMethod')}
        options={options}
        value={value}
        onSelect={(selected) => onChange(selected ?? '')}
      />
    </View>
  )
}

export default PaymentMethodDropdown
