import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createTranslator, desaIdiomaTriat, esLlenguaSuportada, llegeixIdiomaTriat, resolIdioma } from '../../config/i18n';
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
  // === LANGUAGE (T1, decisió del Mestre 260930) ===
  /* La llengua és DERIVADA: tria explícita desada > `language` vàlida de
     l'amfitrió > 'ca' (i18n.js:resolIdioma). El lang de la pàgina amfitriona
     no hi entra: un WordPress en-US ja no força l'anglés. Com que es deriva en
     cada pintat, un canvi posterior d'externalConfig.language (l'API
     element.setLanguage de Sollutia, una config calenta) es veu sense
     reiniciar. Muntar no escriu res: només setLanguage desa la tria. */
  const [idiomaTriat, setIdiomaTriat] = useState(llegeixIdiomaTriat);
  const language = resolIdioma({ triat: idiomaTriat, amfitrio: externalConfig?.language });

  /* Dues instàncies a la mateixa pàgina no divergixen: l'oient només posa
     l'estat (no desa ni reemet), així que no hi ha bucle. */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alCanviarLlengua = (event) => {
      const codi = event?.detail?.language;
      if (esLlenguaSuportada(codi)) setIdiomaTriat(codi);
    };
    window.addEventListener('sdp:language-changed', alCanviarLlengua);
    return () => window.removeEventListener('sdp:language-changed', alCanviarLlengua);
  }, []);

  const setLanguageFn = useCallback((code) => {
    if (!esLlenguaSuportada(code)) return;
    setIdiomaTriat(code);
    desaIdiomaTriat(code);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: code } }));
      if (typeof window.sdp_change_language === 'function') {
        window.sdp_change_language(code);
      }
    }
  }, []);

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

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      const currentResolved = resolveTheme(prev === 'system' ? (systemDark ? 'dark' : 'light') : prev);
      const next = currentResolved === 'dark' ? 'light' : 'dark';
      writeThemePreference(next);
      return next;
    });
  }, [systemDark]);

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
  }), [setLanguageFn, toggleTheme, translator, setGlobalStatus]);

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
