/** How a business expense or an income was paid (a record may also hold free text). */
export enum PaymentMethod {
  Cash = 'cash',
  Interac = 'interac',
  Check = 'check',
  WireTransfer = 'wireTransfer',
  CreditCard = 'creditCard',
  DebitCard = 'debitCard',
}
