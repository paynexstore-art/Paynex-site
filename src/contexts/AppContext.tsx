import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SiteSettings } from '@/types';
import { getSiteSettings, saveSiteSettings } from '@/lib/storage';

type Lang = 'ar' | 'en';

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'rtl' | 'ltr';
  t: (ar: string, en: string) => string;
  settings: SiteSettings;
  updateSettings: (s: Partial<SiteSettings>) => void;
  isRTL: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('paynex_lang') as Lang) ?? 'ar';
  });
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isRTL = lang === 'ar';

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('paynex_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback((ar: string, en: string) => (lang === 'ar' ? ar : en), [lang]);

  const updateSettings = useCallback((updates: Partial<SiteSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSiteSettings(newSettings);
      return newSettings;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <AppContext.Provider value={{ lang, setLang, dir, t, settings, updateSettings, isRTL }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
