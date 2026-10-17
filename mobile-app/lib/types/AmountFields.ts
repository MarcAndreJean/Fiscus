/** The money fields every expense and income carries. */
export type TaxedAmounts = {
  subtotal: number
  hasTps: boolean
  hasTvq: boolean
  tps: number
  tvq: number
  total: number
}
