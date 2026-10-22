import { format } from 'date-fns'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, Snackbar, Surface, Text } from 'react-native-paper'

import ReportPeriodPicker from './ReportPeriodPicker'
import { useDownloadReport } from '../../../api'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import type { ReportDownloadResult } from '../../../types'
import LoadingIndicator from '../shared/LoadingIndicator'

/** A local date as the report endpoints expect it (YYYY-MM-DD). */
const toReportDate = (date: Date): string => format(date, 'yyyy-MM-dd')

const ReportSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Surface style={style.section}>
    <Text style={style.sectionTitle} variant="titleMedium">
      {title}
    </Text>
    <Divider style={style.divider} />
    {children}
  </Surface>
)

const ReportsPage = () => {
  const auth = useAuth()

  const {
    downloadTravelLogsReport,
    downloadIncomesReport,
    downloadExpensesReport,
    downloadHouseExpensesReport,
    downloadCarExpensesReport,
    downloadMiscFilesReport,
    downloadDuplicatesReport,
    isLoading: isAuthLoading,
  } = useDownloadReport()

  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1),
  )
  const [toDate, setToDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 11, 31),
  )

  const [message, setMessage] = useState({ visible: false, content: '' })
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  const showMessage = (content: string) =>
    setMessage({ visible: true, content })

  const handleDownload = async (
    reportKey: string,
    download: () => Promise<ReportDownloadResult>,
  ) => {
    if (!fromDate || !toDate) {
      showMessage(Locales.t('reportsSelectDates'))
      return
    }

    setLoadingReport(reportKey)
    // A failed download is reported in the result; it never throws.
    const result = await download()
    setLoadingReport(null)
    showMessage(
      result.success
        ? Locales.t('reportsDownloadSuccess')
        : result.error || Locales.t('reportsDownloadError'),
    )
  }

  /** One report button; while a report downloads, every button is disabled. */
  const downloadButton = (
    reportKey: string,
    icon: string,
    label: string,
    download: () => Promise<ReportDownloadResult>,
  ) => (
    <Button
      key={reportKey}
      mode="outlined"
      icon={icon}
      style={style.downloadButton}
      loading={loadingReport === reportKey}
      disabled={loadingReport !== null}
      onPress={() => handleDownload(reportKey, download)}
    >
      {label}
    </Button>
  )

  if (isAuthLoading) {
    return <LoadingIndicator />
  }

  const fromDateStr = fromDate ? toReportDate(fromDate) : ''
  const toDateStr = toDate ? toReportDate(toDate) : ''

  const travelLogCombinations = auth.businessIds.flatMap((businessId) =>
    auth.carIds.map((carId) => ({ businessId, carId })),
  )

  return (
    <>
      <ReportPeriodPicker
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      <ScrollView style={style.container}>
        {travelLogCombinations.length > 0 && (
          <ReportSection title={Locales.t('titleTravelLogs')}>
            {travelLogCombinations.map(({ businessId, carId }) =>
              downloadButton(
                `travel-${businessId}-${carId}`,
                'map-outline',
                `${Locales.t('titleTravelLogs')} - ${businessId} / ${carId}`,
                () =>
                  downloadTravelLogsReport(
                    fromDateStr,
                    toDateStr,
                    businessId,
                    carId,
                  ),
              ),
            )}
          </ReportSection>
        )}

        {auth.businessIds.length > 0 && (
          <ReportSection title={Locales.t('titleIncomes')}>
            {auth.businessIds.map((businessId) =>
              downloadButton(
                `income-${businessId}`,
                'account-cash-outline',
                `${Locales.t('titleIncomes')} - ${businessId}`,
                () => downloadIncomesReport(fromDateStr, toDateStr, businessId),
              ),
            )}
          </ReportSection>
        )}

        {auth.businessIds.length > 0 && (
          <ReportSection title={Locales.t('titleExpenses')}>
            {auth.businessIds.map((businessId) =>
              downloadButton(
                `expense-${businessId}`,
                'bank-transfer-out',
                `${Locales.t('titleExpenses')} - ${businessId}`,
                () =>
                  downloadExpensesReport(fromDateStr, toDateStr, businessId),
              ),
            )}
          </ReportSection>
        )}

        {auth.houseIds.length > 0 && (
          <ReportSection title={Locales.t('titleHouseExpenses')}>
            {downloadButton(
              'house-expenses',
              'home-outline',
              Locales.t('reportsDownloadHouseExpenses'),
              () => downloadHouseExpensesReport(fromDateStr, toDateStr),
            )}
          </ReportSection>
        )}

        {auth.carIds.length > 0 && (
          <ReportSection title={Locales.t('titleCarExpenses')}>
            {downloadButton(
              'car-expenses',
              'car-outline',
              Locales.t('reportsDownloadCarExpenses'),
              () => downloadCarExpensesReport(fromDateStr, toDateStr),
            )}
          </ReportSection>
        )}

        <ReportSection title={Locales.t('titleMiscFiles')}>
          {downloadButton(
            'misc-files',
            'file-outline',
            Locales.t('reportsDownloadMiscFiles'),
            () => downloadMiscFilesReport(fromDateStr, toDateStr),
          )}
        </ReportSection>

        <ReportSection title={Locales.t('titleDuplicates')}>
          {downloadButton(
            'duplicates',
            'content-duplicate',
            Locales.t('reportsDownloadDuplicates'),
            () => downloadDuplicatesReport(fromDateStr, toDateStr),
          )}
        </ReportSection>

        <View style={style.bottomPadding} />
      </ScrollView>

      <Snackbar
        visible={message.visible}
        onDismiss={() => setMessage({ ...message, visible: false })}
        onIconPress={() => setMessage({ ...message, visible: false })}
        duration={3000}
      >
        {message.content}
      </Snackbar>
    </>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  section: {
    margin: 8,
    padding: 16,
    elevation: 1,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  downloadButton: {
    marginBottom: 8,
  },
  bottomPadding: {
    height: 24,
  },
})

export default ReportsPage
