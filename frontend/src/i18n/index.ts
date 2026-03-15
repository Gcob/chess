import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export type MessageSchema = typeof fr

const i18n = createI18n<[MessageSchema], 'fr' | 'en'>({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages: { fr, en },
})

export default i18n
