import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const STORAGE_KEY = 'adbview.language'

// New languages: add a locales/<code>.json (same key shape as es.json),
// register it below, and add it to SUPPORTED_LANGUAGES.
export const SUPPORTED_LANGUAGES = [
  {code: 'es', label: 'Español'},
  {code: 'en', label: 'English'},
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

i18n.use(initReactI18next).init({
  resources: {
    es: {translation: es},
    en: {translation: en},
  },
  lng: localStorage.getItem(STORAGE_KEY) ?? 'es',
  fallbackLng: 'es',
  interpolation: {escapeValue: false},
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export default i18n
