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
const RIGHT_COLUMN_MIN = 320;
const RESIZER_WIDTH = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const SANEJA_AMPLADA = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : def;
};
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
        setMida(novaMida);
        if (novaMida === 'ample') setPanellObert(null);
        if (novaMida === 'estret' && prevMida === 'ample') {
          setPanellObert(null);
        }
      }
      return novaMida;
    };

    measureRef.current = measure;
    measure();

    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(page);

    return () => observer.disconnect();
  }, []);

  // Plegar o desplegar canvia l'amplària mínima de la graella encara que
  // el contenidor no canvie de mida (i ResizeObserver no ho notifique).
  useLayoutEffect(() => {
    const expandLeft = collapsedRef.current.left && !leftCollapsed;
    const expandMiddle = collapsedRef.current.middle && !middleCollapsed;
    collapsedRef.current = { left: leftCollapsed, middle: middleCollapsed };
    const nextLayout = measureRef.current?.();
    // Una expansió explícita pot deixar de cabre en ample. El panell que
    // s'acaba d'obrir ha de continuar visible quan passa a ser superposat.
    if (expandLeft && (nextLayout === 'mitja' || nextLayout === 'estret')) setPanellObert('left');
    else if (expandMiddle && nextLayout === 'estret') setPanellObert('middle');
  }, [leftCollapsed, middleCollapsed]);

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

  const tancada = {
    left: mida !== 'ample' && panellObert !== 'left',
    middle: mida === 'estret' && panellObert !== 'middle',
    right: mida === 'estret' && panellObert !== null,
  };

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

  const tancaPanells = useCallback(() => setPanellObert(null), []);

  const ctxValue = useMemo(() => ({
    mida,
    panellObert,
    setPanellObert,
    tancaPanells,
    columnWidths,
    applyPreset
  }), [mida, panellObert, columnWidths, tancaPanells, applyPreset]);

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
          {mida !== 'ample' && (
            <div className="app-grid-headers">
              <button
                type="button"
                className={`app-grid-header-btn ${panellObert === 'left' ? 'active' : ''}`}
                aria-expanded={panellObert === 'left'}
                aria-controls="app-grid-sidebar"
                onClick={toggleLeft}
              >
                {LeftIcon ? <LeftIcon size={18} aria-hidden focusable="false" /> : null}
                <span>{leftTitle}</span>
              </button>
              {mida === 'estret' && (
                <button
                  type="button"
                  className={`app-grid-header-btn ${panellObert === 'middle' ? 'active' : ''}`}
                  aria-expanded={panellObert === 'middle'}
                  aria-controls="app-grid-list"
                  onClick={toggleMiddle}
                >
                  {MiddleIcon ? <MiddleIcon size={18} aria-hidden focusable="false" /> : null}
                  <span>{middleTitle}</span>
                </button>
              )}
            </div>
          )}

          <div className={contentMods}>
            <section
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
