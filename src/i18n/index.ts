import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh.json';
import en from './en.json';
import vi from './vi.json';
import { normalizeLanguage } from '../lib/localization.ts';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zhCN },
      en: { translation: en },
      vi: { translation: vi },
    },
    supportedLngs: ['vi', 'en', 'zh'],
    load: 'languageOnly',
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

i18n.on('languageChanged', language => {
  if (typeof document !== 'undefined') document.documentElement.lang = normalizeLanguage(language);
});
