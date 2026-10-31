import { useContext, useEffect, useRef, useState, useMemo, useCallback, useSyncExternalStore } from 'react';
/* P1-71 (Gauntlet 261029) · Els objectes de context viuen a
   objectesDeContext.js, que no importa res del projecte. */
import { UIActionsContext, UIContext } from './objectesDeContext.js';
import {
  carregaDiccionari, createTranslator, desaIdiomaTriat, esLlenguaSuportada, llegeixIdiomaTriat, llenguaCarregada, resolIdioma,
  subscriuDiccionaris
} from '../../config/i18n';
import { registraIncident } from '../../utils/autocuracio.js';
import {
  ESDEVENIMENT_CONTRAST, ESDEVENIMENT_TEMA, PREFERENCIES_CONTRAST, PREFERENCIES_TEMA, readContrastPreference, readThemePreference,
  resolveContrast, resolveTheme, sistemaDemanaContrast, subscriuContrastSistema, writeContrastPreference, writeThemePreference
} from '../../config/theme';
import { resolveAsset } from '../../config/assetResolver';
import { normalizeSearchText } from '../../config/contentHelpers';

const LANGUAGE_LOCALES = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
  eu: 'eu-ES',
  gl: 'gl-ES'
};

/* Auditoria 261007 (B) · Avisa les altres instàncies de la pàgina de la
   preferència de tema triada (theme.js, ESDEVENIMENT_TEMA). */
function avisaDelTema(preferencia) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ESDEVENIMENT_TEMA, { detail: { theme: preferencia } }));
}

/* Fase D (261020, tasca 4.1) · L1 · Demana un diccionari; si no arriba, en
   queda rastre local (autocuracio, tipus 'tros', com els trossos de ruta de
   RouteErrorBoundary). */
function demanaDiccionari(codi) {
  return carregaDiccionari(codi).then((carregat) => {
    if (!carregat) registraIncident('tros', `idioma-${codi}`, 'fallada');
    return carregat;
  });
}

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

  /* Fase D (261020, tasca 4.1) · L1 · `language` és la llengua demanada (la
     ✓ dels selectors, les API de l'amfitrió); `llenguaDelText`, la que té el
     diccionari en memòria. Mentre el de la demanada no hi és, el text, el
     locale i el lang són el valencià sencer, i canvien quan arriba. L'efecte
     cobrix la llengua de l'amfitrió, l'avís d'una altra instància i un
     remuntatge; una fallada no es reintenta sola (cap bucle). */
  const llenguaDelText = useSyncExternalStore(subscriuDiccionaris, () => llenguaCarregada(language), () => llenguaCarregada(language));
  useEffect(() => { if (llenguaDelText !== language) demanaDiccionari(language); }, [language, llenguaDelText]);

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
    /* L1 · La baixada comença dins del gest; l'efecte espera la mateixa promesa. */
    carregaDiccionari(code);
    setIdiomaTriat(code);
    desaIdiomaTriat(code);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: code } }));
      if (typeof window.sdp_change_language === 'function') {
        window.sdp_change_language(code);
      }
    }
  }, []);

  const translator = useMemo(() => createTranslator(llenguaDelText), [llenguaDelText]);
  const locale = LANGUAGE_LOCALES[llenguaDelText] || 'ca-ES';


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

  /* Auditoria 261007 (B) · La preferència vigent, per a toggleTheme. L'avís a
     les altres instàncies no pot anar dins de l'updater de setState: en
     StrictMode els updaters s'executen dues vegades i n'eixirien dos. Per això
     la preferència següent es calcula fora, des d'esta ref (es posa a cada
     pintat i en cada tria, perquè dos clics seguits no partisquen del mateix
     valor), i després es desa, es posa l'estat i s'avisa. La identitat de
     toggleTheme continua depenent només de systemDark. */
  const preferenciaVigent = useRef(themePreference);
  preferenciaVigent.current = themePreference;

  const toggleTheme = useCallback(() => {
    const prev = preferenciaVigent.current;
    const currentResolved = resolveTheme(prev === 'system' ? (systemDark ? 'dark' : 'light') : prev);
    const next = currentResolved === 'dark' ? 'light' : 'dark';
    preferenciaVigent.current = next;
    writeThemePreference(next);
    setThemePreference(next);
    avisaDelTema(next);
  }, [systemDark]);

  /* Torn 260930 (T1) · Les tres opcions de tema («Igual que el sistema»,
     «Mode clar», «Mode fosc») del full «Ajustos» del Xat. toggleTheme és
     binari i no sap tornar a 'system': este setter sí, i desa la tria igual.
     La barra negra continua amb toggleTheme. */
  const setTheme = useCallback((preferencia) => {
    if (!PREFERENCIES_TEMA.includes(preferencia)) return;
    preferenciaVigent.current = preferencia;
    writeThemePreference(preferencia);
    setThemePreference(preferencia);
    avisaDelTema(preferencia);
  }, []);

  /* Auditoria 261007 (B) · La tria d'una altra instància de la pàgina arriba
     ací pel canal de theme.js. L'oient només posa l'estat (no desa ni reemet),
     així que no hi ha bucle; un valor desconegut no fa res. Amb una sola
     instància, l'avís propi torna a posar el valor que ja hi ha: la pantalla
     és la de sempre (Llei del Píxel). */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alCanviarTema = (event) => {
      const preferencia = event?.detail?.theme;
      if (PREFERENCIES_TEMA.includes(preferencia)) setThemePreference(preferencia);
    };
    window.addEventListener(ESDEVENIMENT_TEMA, alCanviarTema);
    return () => window.removeEventListener(ESDEVENIMENT_TEMA, alCanviarTema);
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
    llenguaDelText,
    t: translator,
    locale,
    themeMode,
    themePreference,
    systemDark,
    contrastMode,
    contrastPreference,
    externalConfig,
    status: globalStatus
  }), [language, llenguaDelText, translator, locale, themeMode, themePreference, systemDark, contrastMode, contrastPreference, externalConfig, globalStatus]);

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
