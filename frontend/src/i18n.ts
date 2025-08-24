import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import ar from './locales/ar/translation.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

const stored = (() => {
  try {
    return localStorage.getItem('i18nextLng') || undefined;
  } catch {
    return undefined;
  }
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: stored || (navigator.language ? navigator.language.split('-')[0] : 'fr'),
    fallbackLng: 'fr',
    debug: false,
    interpolation: { 
      escapeValue: false 
    },
    react: { 
      useSuspense: false  // Changed back to false to avoid Suspense issues
    }
  });

export default i18n;