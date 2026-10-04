import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createTranslator, desaIdiomaTriat, esLlenguaSuportada, llegeixIdiomaTriat, resolIdioma } from '../../config/i18n';
import {
  ESDEVENIMENT_CONTRAST, PREFERENCIES_CONTRAST, PREFERENCIES_TEMA, readContrastPreference, readThemePreference, resolveContrast,
  resolveTheme, sistemaDemanaContrast, subscriuContrastSistema, writeContrastPreference, writeThemePreference
} from '../../config/theme';
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

  /* Torn 260930 (T1) · Les tres opcions de WhatsApp («Igual que el sistema»,
     «Mode clar», «Mode fosc») del full «Ajustos» del Xat. toggleTheme és
     binari i no sap tornar a 'system': este setter sí, i desa la tria igual.
     La barra negra continua amb toggleTheme. */
  const setTheme = useCallback((preferencia) => {
    if (!PREFERENCIES_TEMA.includes(preferencia)) return;
    writeThemePreference(preferencia);
    setThemePreference(preferencia);
  }, []);

  // === CONTRAST · MODE BANCAL (D6, Q1 del Mestre, 261004) ===
  /* La preferència ('normal', 'bancal', 'sistema') i el que diu el sistema
     es lligen en el primer pintat, no en un efecte: qui ve amb «Bancal» o
     amb el telèfon en contrast alt no veu mai un fotograma normal. App.jsx
     posa l'atribut abans de pintar. Si l'emmagatzematge no hi és (mode
     privat), la tria val igual mentre dura la pàgina. */
  const [contrastPreference, setContrastPreference] = useState(() => readContrastPreference());
  const [systemContrast, setSystemContrast] = useState(sistemaDemanaContrast);

  useEffect(() => {
    // Torna a llegir per si ha canviat entre el pintat i l'efecte.
    setSystemContrast(sistemaDemanaContrast());
    return subscriuContrastSistema(setSystemContrast);
  }, []);

  const contrastMode = resolveContrast(contrastPreference, systemContrast);

  /* W4-12 · Un sol estat per a tots els controls (el full «Ajustos» del Xat,
     el Panell de Disseny) i per a totes les instàncies de la pàgina: la tria
     d'una arriba a les altres pel canal de theme.js. L'oient només posa
     l'estat (no desa ni reemet), així que no hi ha bucle; un valor desconegut
     no fa res. Cada instància escriu l'atribut a la seua arrel (App.jsx). */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alCanviarContrast = (event) => {
      const preferencia = event?.detail?.contrast;
      if (PREFERENCIES_CONTRAST.includes(preferencia)) setContrastPreference(preferencia);
    };
    window.addEventListener(ESDEVENIMENT_CONTRAST, alCanviarContrast);
    return () => window.removeEventListener(ESDEVENIMENT_CONTRAST, alCanviarContrast);
  }, []);

  const setContrast = useCallback((preferencia) => {
    if (!PREFERENCIES_CONTRAST.includes(preferencia)) return;
    writeContrastPreference(preferencia);
    setContrastPreference(preferencia);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ESDEVENIMENT_CONTRAST, { detail: { contrast: preferencia } }));
    }
  }, []);

  const stateValue = useMemo(() => ({
    language,
    t: translator,
    locale,
    themeMode,
    themePreference,
    systemDark,
    contrastMode,
    contrastPreference,
    externalConfig,
    status: globalStatus
  }), [language, translator, locale, themeMode, themePreference, systemDark, contrastMode, contrastPreference, externalConfig, globalStatus]);

  const actionsValue = useMemo(() => ({
    setLanguage: setLanguageFn,
    toggleTheme,
    setTheme,
    setContrast,
    t: translator,
    resolveAsset,
    normalizeSearchText,
    setGlobalStatus
  }), [setLanguageFn, toggleTheme, setTheme, setContrast, translator, setGlobalStatus]);

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

/* W4-13 · Per a les peces que també es pinten soltes, fora de l'App (els
   espècimens del catàleg a allLoaders.test.jsx): null sense UIProvider, en
   lloc de llançar. Dins de l'App són l'estat i les accions de sempre. */
export function useUIStateOpcional() {
  return useContext(UIContext);
}

export function useUIActionsOpcional() {
  return useContext(UIActionsContext);
}
