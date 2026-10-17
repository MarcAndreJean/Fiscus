import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Dropdown } from 'react-native-paper-dropdown'

import { Locales } from '../../../locales'

/** The first year that has records. */
export const FIRST_YEAR = 2020
export const ALL = 'all'

export const useYearOptions = () =>
  React.useMemo(() => {
    const options = []
    for (let year = new Date().getFullYear(); year >= FIRST_YEAR; year--) {
      options.push({ label: String(year), value: String(year) })
    }
    return options
  }, [])

export const YearFilter = ({
  value,
  onChange,
}: {
  value: number
  onChange: (year: number) => void
}) => {
  const options = useYearOptions()
  return (
    <View style={styles.filter}>
      <Dropdown
        mode="outlined"
        label={Locales.t('year')}
        options={options}
        value={String(value)}
        onSelect={(year) => year && onChange(parseInt(year, 10))}
      />
    </View>
  )
}

/** A business/car/house picker, hidden when there is only one id to choose from. */
export const IdFilter = ({
  label,
  ids,
  value,
  onChange,
  allowAll = false,
}: {
  label: string
  ids: string[]
  value: string
  onChange: (id: string) => void
  allowAll?: boolean
}) => {
  if (ids.length <= 1) return null
  const options = ids.map((id) => ({ label: id, value: id }))
  if (allowAll) options.push({ label: Locales.t('all'), value: ALL })
  return (
    <View style={styles.filter}>
      <Dropdown
        mode="outlined"
        label={label}
        options={options}
        value={value}
        onSelect={(id) => id && onChange(id)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  filter: {
    flex: 1,
  },
})
