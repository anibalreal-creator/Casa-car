import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import es from '../i18n/es';
import en from '../i18n/en';
import pt from '../i18n/pt';
import fr from '../i18n/fr';
import zh from '../i18n/zh';
import it from '../i18n/it';
import de from '../i18n/de';

const DICTS = { es, en, pt, it, de, fr, zh };
const STORAGE_KEYS = ['casa_car_lang', 'cc_language'];
const COOKIE_KEY = 'casa_car_lang';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
];

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

function detectClientLanguage() {
  if (typeof window === 'undefined') return 'es';

  for (const key of STORAGE_KEYS) {
    try {
      const value = window.localStorage.getItem(key);
      if (value && DICTS[value]) return value;
    } catch {}
  }

  const cookieValue = readCookie(COOKIE_KEY);
  if (cookieValue && DICTS[cookieValue]) return cookieValue;

  const browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return DICTS[browser] ? browser : 'es';
}

const LanguageContext = createContext({
  lang: 'es',
  language: 'es',
  changeLang: () => {},
  setLanguage: () => {},
  t: (_key, fallback = '') => fallback,
  dict: es,
  languages: LANGUAGE_OPTIONS,
  ready: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = detectClientLanguage();
    setLang(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ready) return;
    try {
      STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, lang));
    } catch {}
    document.documentElement.lang = lang;
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; path=/; max-age=31536000; SameSite=Lax`;
  }, [lang, ready]);

  const value = useMemo(() => {
    const dict = DICTS[lang] || es;
    const setLanguage = (next) => setLang(DICTS[next] ? next : 'es');
    return {
      lang,
      language: lang,
      dict,
      languages: LANGUAGE_OPTIONS,
      ready,
      changeLang: setLanguage,
      setLanguage,
      t: (key, fallback = '') => dict[key] ?? es[key] ?? fallback ?? key,
    };
  }, [lang, ready]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
