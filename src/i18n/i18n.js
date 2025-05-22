import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import trTranslation from './locales/tr/translation.json';

// Dil kaynakları
const resources = {
  en: {
    translation: enTranslation
  },
  tr: {
    translation: trTranslation
  }
};

i18n
  // Otomatik dil algılama
  .use(LanguageDetector)
  // React ile entegrasyon
  .use(initReactI18next)
  // i18next başlatma
  .init({
    resources,
    fallbackLng: 'en', // Varsayılan dil
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React zaten XSS için güvenli
    },

    // Dil algılama seçenekleri
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    }
  });

export default i18n; 