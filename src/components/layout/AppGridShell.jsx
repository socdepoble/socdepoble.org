import { useLayoutEffect, useRef, useState, createContext, useContext, useMemo, useCallback } from 'react';
import { getVal, setVal } from '../../config/storage.js';
import AppGridResizer from './AppGridResizer';

const AppGridContext = createContext(null);
export { AppGridContext };

const COLUMN_LIMITS = Object.freeze({
  left: { min: 200, max: 420 },
  middle: { min: 240, max: 520 },
});
const DEFAULT_COLUMN_WIDTHS = Object.freeze({ left: 260, middle: 280 });
const PRESETS = Object.freeze({
  compacta: { left: 210, middle: 250 },
  defecte: DEFAULT_COLUMN_WIDTHS,
  ampla: { left: 300, middle: 340 }
});
/* Torn 260930 (T1) · Només lectura, per a saber quin preset és el d'ara:
   el full «Ajustos» del Xat hi posa el ✓ (amplariaColumnes.presetDeMides).
   Aplicar-lo continua sent cosa d'applyPreset. */
export { PRESETS as PRESETS_COLUMNES };
const RIGHT_COLUMN_MIN = 320;
const RESIZER_WIDTH = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const SANEJA_AMPLADA = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : def;
};

/* T6 · Les columnes tancades per a una mida i un panell. La mateixa regla
   pinta inert i aria-hidden i la llig la guarda del focus. */
const COLUMNES = Object.freeze(['left', 'middle', 'right']);
const columnesTancades = (mida, panell) => ({
  left: mida !== 'ample' && panell !== 'left',
  middle: mida === 'estret' && panell !== 'middle',
  right: mida === 'estret' && panell !== null,
});

/* L'element enfocat, llegit a l'arrel del node: dins del Shadow DOM tancat de
   l'encastat (PedraSecaEmbed), document.activeElement és l'amfitrió. */
function focusActiu(node) {
  const arrel = node?.getRootNode?.();
  return arrel && 'activeElement' in arrel ? arrel.activeElement : null;
}

/* Un control a l'abast: connectat, actiu i fora de tot subarbre amagat. */
const esAlAbast = (el) => Boolean(el?.isConnected) && !el.disabled
  && !el.closest('[aria-hidden="true"], [inert], [hidden]');

export function useAppGrid() {
  const ctx = useContext(AppGridContext);
  if (!ctx) throw new Error('useAppGrid ha de ser utilitzat dins de AppGridShell');
  return ctx;
}

export default function AppGridShell({
  children,
  leftColumn,
  middleColumn,
  rightColumn,
  leftTitle = 'ESQUERRA',
  middleTitle = 'CENTRE',
  leftIcon: LeftIcon = null,
  middleIcon: MiddleIcon = null,
  leftCollapsed = false,
  middleCollapsed = false,
  initialPane = null,
  'aria-label': ariaLabel = 'Graella de l\'aplicació',
  className = '',
}) {
  const [mida, setMida] = useState('ample');
  const [pageWidth, setPageWidth] = useState(0);
  const [panellObert, setPanellObert] = useState(initialPane);
  /* T6 · El panell i la mida que s'han demanat, encara sense pintar. Si un
     efecte de layout d'un fill (PanellInicialMobil) reobri en el mateix lot
     la columna que este commit tanca, la guarda del focus no hi actua. */
  const panellDemanat = useRef(initialPane);
  const midaDemanada = useRef('ample');
  const demanaPanell = useCallback((valor) => {
    panellDemanat.current = typeof valor === 'function' ? valor(panellDemanat.current) : valor;
    setPanellObert(valor);
  }, []);
  const [columnWidths, setColumnWidths] = useState(() => {
    const brut = getVal('sdp-grid-widths', DEFAULT_COLUMN_WIDTHS) || {};
    return {
      left: SANEJA_AMPLADA(brut.left, COLUMN_LIMITS.left.min, COLUMN_LIMITS.left.max, DEFAULT_COLUMN_WIDTHS.left),
      middle: SANEJA_AMPLADA(brut.middle, COLUMN_LIMITS.middle.min, COLUMN_LIMITS.middle.max, DEFAULT_COLUMN_WIDTHS.middle),
    };
  });
  const pageRef = useRef(null);

  const widthsRef = useRef(columnWidths);
  const midaRef = useRef(mida);
  useLayoutEffect(() => {
    widthsRef.current = columnWidths;
    midaRef.current = mida;
  }, [columnWidths, mida]);

  const measureRef = useRef(null);

  const collapsedRef = useRef({ left: leftCollapsed, middle: middleCollapsed });

  const lastPersistedRef = useRef(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const measure = () => {
      const w = page.clientWidth;
      setPageWidth(w);
      const cw = widthsRef.current;
      const { left, middle } = collapsedRef.current;

      const actualLeft = left ? 56 : cw.left;
      const actualMiddle = middle ? 56 : cw.middle;

      const minAmple = Math.max(
        900,
        actualLeft + actualMiddle + RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2
      );
      
      let novaMida = 'ample';
      if (w < 720) novaMida = 'estret';
      else if (w < minAmple) novaMida = 'mitja';

      const prevMida = midaRef.current;
      if (prevMida !== novaMida) {
        midaDemanada.current = novaMida;
        setMida(novaMida);
        if (novaMida === 'ample') demanaPanell(null);
        if (novaMida === 'estret' && prevMida === 'ample') {
          demanaPanell(null);
        }
      }
      return novaMida;
    };

    measureRef.current = measure;
    measure();

    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(page);

    return () => observer.disconnect();
  }, [demanaPanell]);

  // Plegar o desplegar canvia l'amplària mínima de la graella encara que
  // el contenidor no canvie de mida (i ResizeObserver no ho notifique).
  useLayoutEffect(() => {
    const expandLeft = collapsedRef.current.left && !leftCollapsed;
    const expandMiddle = collapsedRef.current.middle && !middleCollapsed;
    collapsedRef.current = { left: leftCollapsed, middle: middleCollapsed };
    const nextLayout = measureRef.current?.();
    // Una expansió explícita pot deixar de cabre en ample. El panell que
    // s'acaba d'obrir ha de continuar visible quan passa a ser superposat.
    if (expandLeft && (nextLayout === 'mitja' || nextLayout === 'estret')) demanaPanell('left');
    else if (expandMiddle && nextLayout === 'estret') demanaPanell('middle');
  }, [leftCollapsed, middleCollapsed, demanaPanell]);

  useLayoutEffect(() => {
    measureRef.current?.();

    const currentWidths = widthsRef.current;

    // Persisteix només si hi ha un canvi efectiu post-render, evitant ecos inicials.
    if (
      lastPersistedRef.current?.left !== currentWidths.left
      || lastPersistedRef.current?.middle !== currentWidths.middle
    ) {
      lastPersistedRef.current = currentWidths;
      setVal('sdp-grid-widths', currentWidths);
    }
  }, [columnWidths]);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    page.style.setProperty(
      '--app-grid-col-sidebar',
      `${columnWidths.left}px`
    );
    page.style.setProperty(
      '--app-grid-col-list',
      `${columnWidths.middle}px`
    );
  }, [columnWidths.left, columnWidths.middle]);

  const toggleLeft = useCallback(() => setPanellObert((p) => (p === 'left' ? null : 'left')), []);
  const toggleMiddle = useCallback(() => setPanellObert((p) => (p === 'middle' ? null : 'middle')), []);

  const resizeColumn = useCallback((column, requestedWidth) => {
    const containerWidth = pageRef.current?.clientWidth || 0;
    setColumnWidths((current) => {
      const otherColumn = column === 'left' ? 'middle' : 'left';
      // En mitjà el menú és un panell superposat; en ample, un rail plegat
      // ocupa 56px. La mida desada del menú desplegat no lleva espai al xat.
      const otherWidth = midaRef.current !== 'ample' && otherColumn === 'left'
        ? 0
        : collapsedRef.current[otherColumn] ? 56 : current[otherColumn];
      const reservedResizers = midaRef.current === 'ample' ? RESIZER_WIDTH * 2 : 0;
      const availableMax = containerWidth - otherWidth - RIGHT_COLUMN_MIN - reservedResizers;
      const limits = COLUMN_LIMITS[column];
      const max = Math.max(limits.min, Math.min(limits.max, availableMax));
      const nextWidth = clamp(requestedWidth, limits.min, max);
      if (nextWidth === current[column]) return current;
      
      const nextState = { ...current, [column]: nextWidth };
      return nextState;
    });
  }, []);

  const applyPreset = useCallback((presetName) => {
    if (!PRESETS[presetName]) return;
    const nextState = PRESETS[presetName];
    setColumnWidths(nextState);
    setVal('sdp-grid-widths', nextState);
  }, []);

  const tancada = columnesTancades(mida, panellObert);

  const leftRef = useRef(null);
  const middleRef = useRef(null);
  const rightRef = useRef(null);

  /* T6 · Guarda del focus. Tancar una columna li posa inert i aria-hidden en
     este commit; si el focus hi era dins, el navegador el trobaria amagat
     («aria-hidden … retained focus»). Abans que pinte, el porta al primer
     obridor a l'abast d'eixa columna o, si no n'hi ha cap, l'allibera amb
     blur(): les guardes de focus perdut dels consumidors (BotoObriRail,
     XatSection, focusAfterLayout) busquen <body> o null i el recol·loquen.
     Amb un altre panell o una altra mida ja demanats en el mateix lot, espera
     el commit següent.
     Obridor és el control que es declara de la closca amb data-obri-columna i
     nomena la columna amb aria-controls (BotoObriRail). aria-controls sol no
     basta: el detall pot pintar demostracions amb el mateix id, com el
     RailXat de l'espècimen «xat-rail» del catàleg de Disseny. */
  useLayoutEffect(() => {
    if (panellDemanat.current !== panellObert || midaDemanada.current !== mida) return;
    const page = pageRef.current;
    const actiu = focusActiu(page);
    if (!page || !actiu || !page.contains(actiu)) return;
    const tancades = columnesTancades(mida, panellObert);
    const seccions = { left: leftRef, middle: middleRef, right: rightRef };
    const columna = COLUMNES
      .map((clau) => (tancades[clau] ? seccions[clau].current : null))
      .find((el) => el?.contains(actiu));
    if (!columna) return;
    const obridor = [...page.querySelectorAll(`[data-obri-columna][aria-controls~="${columna.id}"]`)].find(esAlAbast);
    if (obridor) obridor.focus({ preventScroll: true });
    else actiu.blur();
  }, [mida, panellObert]);

  // En mitjà la CSS limita la llista per deixar 320px al detall. El drag i
  // el teclat han de començar en eixa amplària visible, no en la desada.
  const middleVisibleWidth = mida === 'mitja' && pageWidth > 0
    ? Math.min(columnWidths.middle, pageWidth - RIGHT_COLUMN_MIN)
    : columnWidths.middle;

  /* Classes modificadores en lloc de :has() (Baseline 2022). */
  const contentMods = [
    'app-grid-content',
    leftCollapsed && mida === 'ample' ? 'has-left-collapsed' : '',
    middleCollapsed && mida === 'ample' ? 'has-middle-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tancaPanells = useCallback(() => demanaPanell(null), [demanaPanell]);

  const ctxValue = useMemo(() => ({
    mida,
    panellObert,
    setPanellObert: demanaPanell,
    tancaPanells,
    columnWidths,
    applyPreset
  }), [mida, panellObert, demanaPanell, columnWidths, tancaPanells, applyPreset]);

  return (
    <AppGridContext.Provider value={ctxValue}>
      <div ref={pageRef} className={`app-grid-page ${className}`.trim()}>

        {children}

        <article
          className="app-grid-shell"
          data-layout={mida}
          data-panell={panellObert || ''}
          aria-label={ariaLabel}
        >


          <div className={contentMods}>
            <section
              ref={leftRef}
              className="app-grid-column app-grid-column--left"
              id="app-grid-sidebar"
              data-obert={!tancada.left}
              inert={tancada.left ? "true" : undefined}
              aria-hidden={tancada.left ? true : undefined}
            >
              {leftColumn}
            </section>
            {mida === 'ample' && !leftCollapsed ? (
              <AppGridResizer
                className="app-grid-resizer--left"
                label={`Redimensionar ${leftTitle}`}
                value={columnWidths.left}
                min={COLUMN_LIMITS.left.min}
                max={COLUMN_LIMITS.left.max}
                onResize={(value) => resizeColumn('left', value)}
              />
            ) : null}
            <section
              ref={middleRef}
              className="app-grid-column app-grid-column--middle"
              id="app-grid-list"
              data-obert={!tancada.middle}
              inert={tancada.middle ? "true" : undefined}
              aria-hidden={tancada.middle ? true : undefined}
            >
              {middleColumn}
            </section>
            {mida !== 'estret' && !(middleCollapsed && mida === 'ample') ? (
              <AppGridResizer
                className="app-grid-resizer--middle"
                label={`Redimensionar ${middleTitle}`}
                value={middleVisibleWidth}
                min={COLUMN_LIMITS.middle.min}
                max={COLUMN_LIMITS.middle.max}
                onResize={(value) => resizeColumn('middle', value)}
              />
            ) : null}
            <section
              ref={rightRef}
              className="app-grid-column app-grid-column--right"
              id="app-grid-main"
              data-obert={!tancada.right}
              inert={tancada.right ? "true" : undefined}
              aria-hidden={tancada.right ? true : undefined}
            >
              {rightColumn}
            </section>
          </div>
        </article>
      </div>
    </AppGridContext.Provider>
  );
}
