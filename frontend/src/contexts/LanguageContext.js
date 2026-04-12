import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'habit_reset_lang';

function detectDefaultLanguage() {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) return saved;

  // 2. Check browser language
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith('da')) return 'da';

  return null; // Will be resolved by geo check
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => detectDefaultLanguage() || 'en');
  const [geoChecked, setGeoChecked] = useState(!!detectDefaultLanguage());

  useEffect(() => {
    // If we already have a saved preference or browser match, skip geo
    if (geoChecked) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        const data = await res.json();
        // If user is in Denmark, default to Danish
        if (data.country_code === 'DK') {
          setLangState('da');
          localStorage.setItem(STORAGE_KEY, 'da');
        }
      } catch (error) {
        // Geo detection failed or aborted — keep English default
        if (error?.name !== 'AbortError') {
          console.error('Geo detection failed:', error);
        }
      } finally {
        setGeoChecked(true);
      }
    })();

    return () => controller.abort();
  }, [geoChecked]);

  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
