import React from 'react'
import { View } from 'react-native'
import { Dropdown } from 'react-native-paper-dropdown'

import { formStyles } from '../shared/FormScreen'

type Props = {
  label: string
  ids: string[]
  value: string
  onChange: (id: string) => void
}

/** Picks the business, car or house a record belongs to (locked when there is only one). */
const OwnerDropdown = ({ label, ids, value, onChange }: Props) => (
  <View style={formStyles.input}>
    <Dropdown
      mode="outlined"
      label={label}
      disabled={ids.length <= 1}
      options={ids.map((id) => ({ label: id, value: id }))}
      value={value}
      onSelect={(id) => id && onChange(id)}
    />
  </View>
)

export default OwnerDropdown
