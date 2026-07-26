import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageContext from './language-context';

export default function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.resolvedLanguage === 'ar' ? 'ar' : 'en');
  const isRtl = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    window.localStorage.setItem('thinkers-language', language);
    if (i18n.resolvedLanguage !== language) i18n.changeLanguage(language);
  }, [i18n, isRtl, language]);

  const setLanguage = useCallback(nextLanguage => {
    setLanguageState(nextLanguage === 'ar' ? 'ar' : 'en');
  }, []);

  const value = useMemo(() => ({ language, isRtl, setLanguage }), [isRtl, language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
