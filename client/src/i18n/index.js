import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import kg from './locales/kg.json';
import en from './locales/en.json';

const resources = {
  ru: { translation: ru },
  kg: { translation: kg },
  en: { translation: en }
};

// Get saved language from localStorage or use default
const savedLanguage = localStorage.getItem('language') || 'kg';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'kg',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: [] // Disable caching to force reload
    }
  });

export default i18n;
