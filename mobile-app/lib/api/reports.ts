import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'

import { ApiError, cleanParams, errorMessage } from './client'
import { Locales } from '../locales'
import { type AuthSettings, useAuth } from '../settings'
import type { ReportDownloadResult, ReportParams, ReportType } from '../types'
import { XLSX_MIME } from '../utils/files'

/** The report endpoints answer {statusCode, body: base64 xlsx} inside an HTTP 200. */
async function fetchReportBase64(
  report: ReportType,
  params: ReportParams,
  { apiUrl, apiKey }: Pick<AuthSettings, 'apiUrl' | 'apiKey'>,
): Promise<string> {
  if (!apiUrl) throw new Error(Locales.t('apiUrlMissing'))
  const query = new URLSearchParams(
    Object.entries(cleanParams(params)).map(([k, v]) => [k, String(v)]),
  )
  const response = await fetch(`${apiUrl}/report/${report}?${query}`, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ApiError(
      Locales.t('requestFailed', { status: response.status }),
      response.status,
    )
  }
  const result = (await response.json()) as {
    statusCode: number
    message?: string
    body?: string
  }
  if (result.statusCode !== 200 || !result.body) {
    throw new ApiError(
      result.message || Locales.t('reportsDownloadError'),
      result.statusCode,
    )
  }
  return result.body
}

function saveInBrowser(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_MIME }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function saveOnDevice(base64: string, filename: string) {
  const fileUri = FileSystem.documentDirectory + filename
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: XLSX_MIME,
      dialogTitle: Locales.t('reportsSaveDialog', { filename }),
    })
  }
}

export function useDownloadReport() {
  const auth = useAuth()

  const downloadReport = async (
    report: ReportType,
    filename: string,
    params: ReportParams,
  ): Promise<ReportDownloadResult> => {
    try {
      const base64 = await fetchReportBase64(report, params, auth)
      if (Platform.OS === 'web') {
        saveInBrowser(base64, filename)
      } else {
        await saveOnDevice(base64, filename)
      }
      return { success: true, filename }
    } catch (error) {
      return { success: false, filename, error: errorMessage(error) }
    }
  }

  return {
    isLoading: auth.isLoading,
    downloadTravelLogsReport: (
      fromDate: string,
      toDate: string,
      businessId: string,
      carId: string,
    ) =>
      downloadReport(
        'travel-logs',
        `TravelLogs_${businessId}_${carId}_${fromDate}_${toDate}.xlsx`,
        { fromDate, toDate, userId: auth.userId, businessId, carId },
      ),
    downloadIncomesReport: (
      fromDate: string,
      toDate: string,
      businessId: string,
    ) =>
      downloadReport(
        'incomes',
        `Incomes_${businessId}_${fromDate}_${toDate}.xlsx`,
        {
          fromDate,
          toDate,
          userId: auth.userId,
          businessId,
        },
      ),
    downloadExpensesReport: (
      fromDate: string,
      toDate: string,
      businessId: string,
    ) =>
      downloadReport(
        'expenses',
        `Expenses_${businessId}_${fromDate}_${toDate}.xlsx`,
        { fromDate, toDate, userId: auth.userId, businessId },
      ),
    downloadHouseExpensesReport: (fromDate: string, toDate: string) =>
      downloadReport(
        'house-expenses',
        `HouseExpenses_${fromDate}_${toDate}.xlsx`,
        {
          fromDate,
          toDate,
        },
      ),
    downloadCarExpensesReport: (fromDate: string, toDate: string) =>
      downloadReport('car-expenses', `CarExpenses_${fromDate}_${toDate}.xlsx`, {
        fromDate,
        toDate,
      }),
    downloadMiscFilesReport: (fromDate: string, toDate: string) =>
      downloadReport(
        'misc-files',
        `MiscFiles_${auth.userId}_${fromDate}_${toDate}.xlsx`,
        { fromDate, toDate, userId: auth.userId },
      ),
    downloadDuplicatesReport: (fromDate: string, toDate: string) =>
      downloadReport('duplicates', `Duplicates_${fromDate}_${toDate}.xlsx`, {
        fromDate,
        toDate,
      }),
  }
}
