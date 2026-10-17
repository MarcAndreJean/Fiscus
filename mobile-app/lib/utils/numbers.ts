const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/

/** Reads a number typed by the user; accepts "12,50" as well as "12.50". */
export const parseDecimal = (text: string): number | null => {
  const normalized = text.trim().replace(',', '.')
  return DECIMAL.test(normalized) ? Number(normalized) : null
}

/** A percentage from 1 to 100, or null. */
export const parsePercentage = (text: string): number | null => {
  const value = parseDecimal(text)
  return value !== null && value >= 1 && value <= 100 ? value : null
}
