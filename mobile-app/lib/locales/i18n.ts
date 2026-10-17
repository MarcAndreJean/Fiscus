import { I18n } from 'i18n-js'

import English from './en'

export const Locales = new I18n({
  en: English,
})

Locales.enableFallback = true
