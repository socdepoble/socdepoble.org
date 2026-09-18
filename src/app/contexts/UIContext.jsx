import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTranslator, readStoredLanguage, writeStoredLanguage, normalizeLanguage } from '../../config/i18n';
import { readThemePreference, resolveTheme, writeThemePreference } from '../../config/theme';
import { resolveAsset } from '../../config/assetResolver';
import { normalizeSearchText } from '../../config/contentHelpers';
const UIContext = createContext(null);
const UIActionsContext = createContext(null);

const LANGUAGE_LOCALES = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
  eu: 'eu-ES',
  gl: 'gl-ES'
};

export function UIProvider({ children, externalConfig = {} }) {
  // === LANGUAGE ===
  const [language, setLanguage] = useState(() => {
    if (externalConfig?.language) return normalizeLanguage(externalConfig.language);
    if (typeof document !== 'undefined' && document.documentElement.lang) {
      const htmlLang = document.documentElement.lang.split('-')[0];
      if (['ca', 'es', 'en', 'eu', 'gl'].includes(htmlLang)) {
        return normalizeLanguage(htmlLang);
      }
    }
    return readStoredLanguage();
  });

  useEffect(() => {
    writeStoredLanguage(language);
  }, [language]);

  const setLanguageFn = (code) => {
    setLanguage(code);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: code } }));
      if (typeof window.sdp_change_language === 'function') {
        window.sdp_change_language(code);
      }
    }
  };

  const translator = useMemo(() => createTranslator(language), [language]);
  const locale = LANGUAGE_LOCALES[language] || 'ca-ES';


  // === THEME ===
  const [themePreference, setThemePreference] = useState(() => readThemePreference(externalConfig?.themeMode));
  const [systemDark, setSystemDark] = useState(false);
  
  // === GLOBAL STATUS ===
  const [globalStatus, setGlobalStatus] = useState('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
    };
  }, []);

  const themeMode = resolveTheme(themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference);

  const toggleTheme = () => {
    setThemePreference((prev) => {
      const currentResolved = resolveTheme(prev === 'system' ? (systemDark ? 'dark' : 'light') : prev);
      const next = currentResolved === 'dark' ? 'light' : 'dark';
      writeThemePreference(next);
      return next;
    });
  };

  const stateValue = useMemo(() => ({
    language,
    t: translator,
    locale,
    themeMode,
    themePreference,
    systemDark,
    externalConfig,
    status: globalStatus
  }), [language, translator, locale, themeMode, themePreference, systemDark, externalConfig, globalStatus]);

  const actionsValue = useMemo(() => ({
    setLanguage: setLanguageFn,
    toggleTheme,
    t: translator,
    resolveAsset,
    normalizeSearchText,
    setGlobalStatus
  }), [translator, setGlobalStatus]);

  return (
    <UIContext.Provider value={stateValue}>
      <UIActionsContext.Provider value={actionsValue}>
        {children}
      </UIActionsContext.Provider>
    </UIContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUIState ha de ser usat dins de UIProvider');
  return context;
}

export function useUIActions() {
  const context = useContext(UIActionsContext);
  if (!context) throw new Error('useUIActions ha de ser usat dins de UIProvider');
  return context;
}

export function useUI() {
  return { ...useUIState(), ...useUIActions() };
}
