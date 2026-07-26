import { useCallback, useEffect, useMemo, useState } from 'react';
import ThemeContext from './theme-context';

const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getInitialPreference = () => {
  if (typeof window === 'undefined') return 'system';
  const saved = window.localStorage.getItem('thinkers-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'system';
};

export default function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getInitialPreference);
  const [theme, setResolvedTheme] = useState(() => typeof document === 'undefined' ? 'light' : document.documentElement.dataset.theme || 'light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = preference === 'system' ? systemTheme() : preference;
      setResolvedTheme(resolved);
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    if (preference === 'system') media.addEventListener('change', apply);
    if (preference === 'system') window.localStorage.removeItem('thinkers-theme');
    else window.localStorage.setItem('thinkers-theme', preference);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const useSystemTheme = useCallback(() => setPreference('system'), []);

  const value = useMemo(() => ({
    theme,
    preference,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: setPreference,
    useSystemTheme,
  }), [preference, theme, toggleTheme, useSystemTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
