/** A calendar quarter: Q1 is January to March, Q4 is October to December. */
export type Quarter = 1 | 2 | 3 | 4

export const QUARTERS: readonly Quarter[] = [1, 2, 3, 4]

/** The first and last day of a quarter, as local dates. */
export const quarterRange = (
  year: number,
  quarter: Quarter,
): { fromDate: Date; toDate: Date } => ({
  fromDate: new Date(year, (quarter - 1) * 3, 1),
  // Day 0 of the next quarter's first month is the last day of this quarter.
  toDate: new Date(year, quarter * 3, 0),
})

export const currentQuarter = (now: Date = new Date()): Quarter =>
  (Math.floor(now.getMonth() / 3) + 1) as Quarter

/** A quarter that has not started yet has nothing to report. */
export const isQuarterStarted = (
  year: number,
  quarter: Quarter,
  now: Date = new Date(),
): boolean => quarterRange(year, quarter).fromDate <= now

/** The quarter itself when it has started, else the latest quarter of that year that has. */
export const clampQuarter = (
  year: number,
  quarter: Quarter,
  now: Date = new Date(),
): Quarter => {
  const started = QUARTERS.filter((q) => isQuarterStarted(year, q, now))
  return started.includes(quarter)
    ? quarter
    : (started[started.length - 1] ?? 1)
}
