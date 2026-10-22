import { format } from 'date-fns'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { IconButton, SegmentedButtons, Text } from 'react-native-paper'
import { DatePickerInput } from 'react-native-paper-dates'

import {
  clampQuarter,
  currentQuarter,
  isQuarterStarted,
  type Quarter,
  QUARTERS,
  quarterRange,
} from './reportPeriod'
import { Locales } from '../../../locales'

type PeriodMode = 'quarter' | 'custom'

type Props = {
  fromDate: Date | undefined
  toDate: Date | undefined
  onFromDateChange: (date: Date | undefined) => void
  onToDateChange: (date: Date | undefined) => void
}

const summaryDate = (date: Date): string => format(date, 'MMM d, yyyy')

/**
 * Picks the period every report covers: a calendar quarter of a chosen year, or any two dates.
 * Quarter mode fills in the dates; custom mode leaves them as they are for the user to adjust.
 */
const ReportPeriodPicker = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: Props) => {
  const now = new Date()
  const [mode, setMode] = useState<PeriodMode>('custom')
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState<Quarter>(currentQuarter(now))

  const selectQuarter = (nextYear: number, wantedQuarter: Quarter) => {
    const nextQuarter = clampQuarter(nextYear, wantedQuarter, now)
    setYear(nextYear)
    setQuarter(nextQuarter)
    const range = quarterRange(nextYear, nextQuarter)
    onFromDateChange(range.fromDate)
    onToDateChange(range.toDate)
  }

  const changeMode = (value: string) => {
    setMode(value as PeriodMode)
    if (value === 'quarter') selectQuarter(year, quarter)
  }

  const range = quarterRange(year, quarter)

  return (
    <View style={style.container}>
      <SegmentedButtons
        value={mode}
        onValueChange={changeMode}
        buttons={[
          { value: 'quarter', label: Locales.t('reportsPeriodQuarter') },
          { value: 'custom', label: Locales.t('reportsPeriodCustom') },
        ]}
      />

      {mode === 'quarter' ? (
        <>
          <View style={style.yearRow}>
            <IconButton
              icon="chevron-left"
              accessibilityLabel={Locales.t('reportsPreviousYear')}
              onPress={() => selectQuarter(year - 1, quarter)}
            />
            <Text variant="titleMedium">{year}</Text>
            <IconButton
              icon="chevron-right"
              accessibilityLabel={Locales.t('reportsNextYear')}
              disabled={year >= now.getFullYear()}
              onPress={() => selectQuarter(year + 1, quarter)}
            />
          </View>
          <SegmentedButtons
            value={String(quarter)}
            onValueChange={(value) =>
              selectQuarter(year, Number(value) as Quarter)
            }
            buttons={QUARTERS.map((q) => ({
              value: String(q),
              label: Locales.t('reportsQuarter', { quarter: q }),
              disabled: !isQuarterStarted(year, q, now),
            }))}
          />
          <Text style={style.summary} variant="bodyMedium">
            {summaryDate(range.fromDate)} → {summaryDate(range.toDate)}
          </Text>
        </>
      ) : (
        <View style={style.dateRow}>
          <DatePickerInput
            locale="en"
            label={Locales.t('reportsFromDate')}
            value={fromDate}
            onChange={onFromDateChange}
            inputMode="start"
            mode="outlined"
            style={style.dateInput}
          />
          <DatePickerInput
            locale="en"
            label={Locales.t('reportsToDate')}
            value={toDate}
            onChange={onToDateChange}
            inputMode="end"
            mode="outlined"
            style={style.dateInput}
          />
        </View>
      )}
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 8,
    gap: 8,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summary: {
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
})

export default ReportPeriodPicker
