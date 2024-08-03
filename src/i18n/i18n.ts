import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importing translation files
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationES from './locales/es/translation.json';

// Resources object
const resources: Resource = {
    en: { translation: translationEN },
    fr: { translation: translationFR },
    es: { translation: translationES }
  };

  i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    load: 'languageOnly',  // or 'all' if you want to include region specific variations like 'en-US'
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie']
    },
    interpolation: {
      escapeValue: false
    }
  });


export default i18n;
