import { Locales } from './i18n'

/**
 * The translated label of a stored enum value, e.g.
 * enumLabel(CarExpenseType, 'carExpenseType', 'car_wash') → "Car wash".
 * Locale keys use the enum member names; the API stores the values.
 */
export const enumLabel = (
  enumObject: Record<string, string>,
  prefix: string,
  value: string,
): string => {
  const member = Object.keys(enumObject).find(
    (key) => enumObject[key] === value,
  )
  return member ? Locales.t(`${prefix}.${member}`) : value
}

/** Dropdown options for every member of an enum. */
export const enumOptions = (
  enumObject: Record<string, string>,
  prefix: string,
): { label: string; value: string }[] =>
  Object.entries(enumObject).map(([member, value]) => ({
    label: Locales.t(`${prefix}.${member}`),
    value,
  }))
