import { useLayoutEffect, useRef, useState, createContext, useContext } from 'react';
import { getVal, setVal } from '../../config/storage.js';
import AppGridResizer from './AppGridResizer';

const AppGridContext = createContext(null);
export { AppGridContext };

const COLUMN_LIMITS = Object.freeze({
  left: { min: 200, max: 420 },
  middle: { min: 240, max: 520 },
});
const DEFAULT_COLUMN_WIDTHS = Object.freeze({ left: 270, middle: 300 });
const PRESETS = Object.freeze({
  compacta: { left: 220, middle: 260 },
  defecte: DEFAULT_COLUMN_WIDTHS,
  ampla: { left: 320, middle: 380 }
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
  leftCollapsed = false,
  middleCollapsed = false,
  initialPane = null,
  'aria-label': ariaLabel = 'Graella de l\'aplicació',
  className = '',
}) {
  const [mida, setMida] = useState('ample');
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

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const measure = () => {
      const w = page.clientWidth;
      const cw = widthsRef.current;
      const minAmple = Math.max(1090, cw.left + cw.middle + RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2);
      
      let novaMida = 'ample';
      if (w < 720) novaMida = 'estret';
      else if (w < minAmple) novaMida = 'mitja';

      const prevMida = midaRef.current;
      if (prevMida !== novaMida) {
        setMida(novaMida);
        if (novaMida === 'ample') setPanellObert(null);
        if (novaMida === 'estret' && prevMida === 'ample') setPanellObert(null);
      }
    };
    measureRef.current = measure;

    measure();
    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    measureRef.current?.();
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

  const toggleLeft = () => setPanellObert((p) => (p === 'left' ? null : 'left'));
  const toggleMiddle = () => setPanellObert((p) => (p === 'middle' ? null : 'middle'));

  const resizeColumn = (column, requestedWidth) => {
    const containerWidth = pageRef.current?.clientWidth || 0;
    let nextStateToSave = null;
    setColumnWidths((current) => {
      const otherColumn = column === 'left' ? 'middle' : 'left';
      const otherWidth = current[otherColumn];
      const availableMax = containerWidth - otherWidth - RIGHT_COLUMN_MIN - RESIZER_WIDTH * 2;
      const limits = COLUMN_LIMITS[column];
      const max = Math.max(limits.min, Math.min(limits.max, availableMax));
      const nextWidth = clamp(requestedWidth, limits.min, max);
      if (nextWidth === current[column]) return current;
      
      const nextState = { ...current, [column]: nextWidth };
      nextStateToSave = nextState;
      return nextState;
    });
    if (nextStateToSave) setVal('sdp-grid-widths', nextStateToSave);
  };

  const applyPreset = (presetName) => {
    if (!PRESETS[presetName]) return;
    const nextState = PRESETS[presetName];
    setColumnWidths(nextState);
    setVal('sdp-grid-widths', nextState);
  };

  const tancada = {
    left: mida !== 'ample' && panellObert !== 'left',
    middle: mida === 'estret' && panellObert !== 'middle',
    right: mida === 'estret' && panellObert !== null,
  };

  /* Classes modificadores en lloc de :has() (Baseline 2022). */
  const contentMods = [
    'app-grid-content',
    leftCollapsed && mida === 'ample' ? 'has-left-collapsed' : '',
    middleCollapsed && mida === 'ample' ? 'has-middle-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AppGridContext.Provider
      value={{ 
        mida, 
        panellObert, 
        setPanellObert, 
        tancaPanells: () => setPanellObert(null),
        columnWidths,
        applyPreset 
      }}
    >
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
                {leftTitle}
              </button>
              {mida === 'estret' && (
                <button
                  type="button"
                  className={`app-grid-header-btn ${panellObert === 'middle' ? 'active' : ''}`}
                  aria-expanded={panellObert === 'middle'}
                  aria-controls="app-grid-list"
                  onClick={toggleMiddle}
                >
                  {middleTitle}
                </button>
              )}
            </div>
          )}

          <div className={contentMods}>
            <section
              className="app-grid-column app-grid-column--left"
              id="app-grid-sidebar"
              inert={tancada.left ? true : undefined}
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
              inert={tancada.middle ? true : undefined}
              aria-hidden={tancada.middle ? true : undefined}
            >
              {middleColumn}
            </section>
            {mida === 'ample' && !middleCollapsed ? (
              <AppGridResizer
                className="app-grid-resizer--middle"
                label={`Redimensionar ${middleTitle}`}
                value={columnWidths.middle}
                min={COLUMN_LIMITS.middle.min}
                max={COLUMN_LIMITS.middle.max}
                onResize={(value) => resizeColumn('middle', value)}
              />
            ) : null}
            <section
              className="app-grid-column app-grid-column--right"
              id="app-grid-main"
              inert={tancada.right ? true : undefined}
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
