import { format } from 'date-fns'

const money = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
})

export const formatMoney = (value: number | null | undefined): string =>
  value === null || value === undefined ? '-' : money.format(value)

/** The date part (YYYY-MM-DD) of an ISO timestamp. */
export const formatDate = (iso: string | null | undefined): string =>
  iso ? iso.slice(0, 10) : '-'

/** A local date in the format the API stores (no time zone). */
export const toApiDateTime = (date: Date): string =>
  format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS")

/** Today's month, day and time, in the year the user is looking at. */
export const defaultEntryDate = (year: number, now: Date = new Date()): Date =>
  new Date(
    year,
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  )

export const maskSecret = (value: string): string =>
  value ? `••••${value.slice(-4)}` : ''

/** The non-empty parts joined with a middle dot, for one-line list summaries. */
export const summaryLine = (...parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join(' · ')

/**
 * A stored date as the date the user picked. The app stores local times without a zone;
 * a stored date may also carry a UTC zone ("...Z") or be date-only, and their calendar day is
 * kept instead of being shifted into the local time zone.
 */
export const parseApiDate = (stored: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(stored)) {
    const [year, month, day] = stored.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const date = new Date(stored)
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(stored)) return date
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  )
}

/** The stored date text when the date was not changed, else the new date for the API. */
export const keepDateIfUnchanged = (stored: string, date: Date): string =>
  parseApiDate(stored).getTime() === date.getTime()
    ? stored
    : toApiDateTime(date)
