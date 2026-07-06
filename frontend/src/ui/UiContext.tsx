import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, ar, TranslationType } from '../translations';

type Theme = 'dark' | 'light';

type UiContextState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  t: TranslationType;
};

const UiContext = createContext<UiContextState | undefined>(undefined);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') === 'light' ? 'light' : 'dark'));
  const [lang, setLangState] = useState<'en' | 'ar'>(() => (localStorage.getItem('lang') === 'ar' ? 'ar' : 'en'));

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light-mode');
    else root.classList.remove('light-mode');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((p) => (p === 'dark' ? 'light' : 'dark'));
  const setLang = (l: 'en' | 'ar') => setLangState(l);

  const t = useMemo(() => (lang === 'ar' ? ar : en), [lang]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, lang, setLang, t }), [theme, lang, t]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
