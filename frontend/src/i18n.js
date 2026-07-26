import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enCourses from './locales/en/courses.json';
import enAi from './locales/en/ai.json';
import enVerification from './locales/en/verification.json';
import enCheckout from './locales/en/checkout.json';
import enAdmin from './locales/en/admin.json';
import enNotifications from './locales/en/notifications.json';
import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arCourses from './locales/ar/courses.json';
import arAi from './locales/ar/ai.json';
import arVerification from './locales/ar/verification.json';
import arCheckout from './locales/ar/checkout.json';
import arAdmin from './locales/ar/admin.json';
import arNotifications from './locales/ar/notifications.json';

const savedLanguage = typeof window === 'undefined' ? null : window.localStorage.getItem('thinkers-language');
const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, dashboard: enDashboard, courses: enCourses, ai: enAi, verification: enVerification, checkout: enCheckout, admin: enAdmin, notifications: enNotifications },
    ar: { common: arCommon, dashboard: arDashboard, courses: arCourses, ai: arAi, verification: arVerification, checkout: arCheckout, admin: arAdmin, notifications: arNotifications },
  },
  lng: savedLanguage === 'ar' || savedLanguage === 'en' ? savedLanguage : browserLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  supportedLngs: ['en', 'ar'],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
