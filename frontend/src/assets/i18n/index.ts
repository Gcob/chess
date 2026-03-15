import { createI18n } from 'vue-i18n'
import fr from './locales/fr'
import en from './locales/en'

export type MessageSchema = typeof fr

type SupportedLocale = 'fr' | 'en'
const SUPPORTED: SupportedLocale[] = ['fr', 'en']
const STORAGE_KEY = 'locale'

function resolveLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
  if (stored && SUPPORTED.includes(stored)) return stored

  const browser = navigator.language.split('-')[0] as SupportedLocale
  return SUPPORTED.includes(browser) ? browser : 'en'
}

const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  locale: resolveLocale(),
  fallbackLocale: 'en',
  messages: { fr, en },
})

export default i18n
