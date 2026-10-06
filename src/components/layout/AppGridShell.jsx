import { useLayoutEffect, useRef, useState, createContext, useContext, useMemo, useCallback } from 'react';
import { getVal, setVal } from '../../config/storage.js';
import AppGridResizer from './AppGridResizer';
import { COLUMNES, PUNTS_DE_TALL, columnesTancades, midaDeGraella } from './graella.js';

const AppGridContext = createContext(null);
export { AppGridContext };

const COLUMN_LIMITS = Object.freeze({
  left: { min: 200, max: 340 },
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
/* T7 (P2) · Els punts de tall, el rail plegat i les columnes tancades
   (columnesTancades) viuen a graella.js: una sola font per al JS, i la seua
   prova de capes vigila les xifres de la CSS. */
const RIGHT_COLUMN_MIN = PUNTS_DE_TALL.detall;
const RESIZER_WIDTH = PUNTS_DE_TALL.separador;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const SANEJA_AMPLADA = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : def;
};

/* L'element enfocat, llegit a l'arrel del node: dins del Shadow DOM tancat de
   l'encastat (PedraSecaEmbed), document.activeElement és l'amfitrió. */
function focusActiu(node) {
  const arrel = node?.getRootNode?.();
  return arrel && 'activeElement' in arrel ? arrel.activeElement : null;
}

/* Un control a l'abast: connectat, actiu i fora de tot subarbre amagat.
   P6 · També fora d'un <dialog> tancat: la roda de la navegació hi té el seu
   Dialeg sempre muntat, i el navegador no enfoca res d'un diàleg sense
   `open` (el panell s'obria i el focus es perdia). */
const esAlAbast = (el) => Boolean(el?.isConnected) && !el.disabled
  && !el.closest('[aria-hidden="true"], [inert], [hidden], dialog:not([open])');

/* MD (ordre del Mestre, 261003) · Els panells que es poden obrir en estret. */
const PANELLS = Object.freeze(['left', 'middle']);

/* MD · El panell d'eixida en estret: un valor, o una funció que el torna en
   el moment d'entrar-hi (així qui munta la closca recorda el nivell entre
   remuntatges). Qualsevol altra cosa és el detall (null). */
function resolPanell(valor) {
  const panell = typeof valor === 'function' ? valor() : valor;
  return PANELLS.includes(panell) ? panell : null;
}

const ENFOCABLES = 'button, a[href], input, select, textarea, [tabindex]';
const esEnfocable = (el) => el.matches(ENFOCABLES) && esAlAbast(el);

/* MD · On va el focus en obrir un panell: l'element actual que es pot
   enfocar (la fitxa d'on es venia, la carpeta activa), el contenidor del
   panell (tabindex=-1, l'aside de la llista) o el primer control (el títol
   de la columna). */
function destiDelPanell(seccio) {
  const actual = [...seccio.querySelectorAll('[aria-current]')]
    .find((el) => el.getAttribute('aria-current') !== 'false' && esEnfocable(el));
  return actual
    || [...seccio.querySelectorAll('[tabindex="-1"]')].find(esAlAbast)
    || [...seccio.querySelectorAll(ENFOCABLES)].find((el) => el.getAttribute('tabindex') !== '-1' && esEnfocable(el))
    || null;
}

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
  /* `leftIcon` i `middleIcon` s'accepten i no es pinten ací: les icones de
     columna les pinta cada capçalera (AppGridColumn). */
  leftCollapsed = false,
  middleCollapsed = false,
  initialPane = null,
  /* MD (ordre del Mestre, 261003) · Mestre-detall en estret. Totes tres
     opcionals: sense, la closca és la d'abans (el detall és la vista
     d'eixida i cap tornada).
       · panellEstret: 'left' | 'middle' | null, o una funció que el torna.
         S'obri només en MUNTAR (el primer mesurament), no a cada canvi de
         la consulta. Revisió: una closca ja muntada que passa d'ample a
         estret (finestra encaixada, Split View, l'amfitrió que s'estreny)
         es queda amb el detall, com abans: la persona que escrivia no perd
         l'editor ni el focus. Mitja → estret, com ara.
       · tornaEstret: on torna el detall si no se'n coneix cap panell
         d'abans. Amb ell, el context oferix tornaDelDetall.
       · onPanell(panell): avisa, en estret, de cada panell assentat (null
         és el detall). */
  panellEstret = null,
  tornaEstret = null,
  onPanell = null,
  /* P6 (ordre del Mestre, 261003) · La llista plegada en rail en pantalles
     xicotetes. Totes dues opcionals i false per defecte: sense, la closca
     és la d'abans (el Xat i les apps la munten a mà i no les passen).
       · railMitja: en «mitja», middleCollapsed plega la llista en el rail
         de --app-grid-col-collapsed i el detall n'ocupa l'espai. En repòs
         (desplegada) no canvia cap píxel.
       · railEstret: en «estret», un rail de --app-grid-col-collapsed a
         l'esquerra del detall (#app-grid-rail, la primera columna estreta,
         sempre a la vista amb el detall). La columna de la llista continua
         sent el panell del mestre-detall: tancada amb el detall a la vista,
         i el seu panell i el de la navegació tapen rail i detall. El rail
         és buit: qui munta la closca hi pinta amb un portal (nodeRail).
     El context ho diu amb llistaPlegable (en esta mida, la llista té el
     desplegador), llistaEnRail (ara es pinta en rail) i nodeRail. */
  railMitja = false,
  railEstret = false,
  /* Barres (ordre del Mestre, 261004: «les dues barres de la Wiki han
     d'estar sempre presents plegades, o com a mínim una d'elles visible que
     permeta desplegar l'altra»). Opcional i false per defecte: sense, la
     closca és la d'abans (el Xat i les apps no la passen).
       · railEsquerra: en «mitja», la navegació és un rail fix de
         --app-grid-col-collapsed a l'esquerra (data-esquerra="rail"), oberta
         i a l'abast; desplegar-la obri el panell de sempre per damunt. El
         rail viu en el coixí de la graella: el detall conserva el seu mínim.
     El context ho diu amb ambRailNavegacio (en esta mida, la navegació té
     rail) i navegacioEnRail (ara es pinta en rail: cap panell obert). */
  railEsquerra = false,
  'aria-label': ariaLabel = 'Graella de l\'aplicació',
  className = '',
}) {
  const [mida, setMida] = useState('ample');
  const [pageWidth, setPageWidth] = useState(0);
  /* MD (revisió) · Si ja s'ha pintat un render amb la mida mesurada. Estat i
     no ref: el doble efecte de StrictMode torna a mesurar abans del render
     següent i ha de llegir «encara no» (el panell d'eixida, el mateix). */
  const [mesurada, setMesurada] = useState(false);
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
  const mesuradaRef = useRef(mesurada);
  useLayoutEffect(() => {
    widthsRef.current = columnWidths;
    midaRef.current = mida;
    mesuradaRef.current = mesurada;
  }, [columnWidths, mida, mesurada]);

  /* MD · Les propietats del mestre-detall, llegides pel mesurament i pels
     efectes. Declarat ABANS del mesurament: en muntar ja hi són. */
  const panellEstretRef = useRef(panellEstret);
  const onPanellRef = useRef(onPanell);
  useLayoutEffect(() => {
    panellEstretRef.current = panellEstret;
    onPanellRef.current = onPanell;
  }, [panellEstret, onPanell]);
  /* Barres · resizeColumn és un callback estable: llig d'ací si la closca
     dona rail a la navegació. */
  const railEsquerraRef = useRef(railEsquerra);
  useLayoutEffect(() => {
    railEsquerraRef.current = railEsquerra;
  }, [railEsquerra]);
  /* MD · L'últim panell obert en estret (d'on es ve) i el que ha d'enfocar
     el commit que l'òbriga (obriPanell). */
  const ultimPanell = useRef(null);
  const focusPendent = useRef(null);

  /* P6 · El rail d'estret (#app-grid-rail): el node, en estat perquè qui
     munta la closca hi puga pintar amb un portal en el render següent, i en
     ref per a la guarda del focus. Ref estable: un ref en línia el tornaria
     a posar a null i a l'element a cada render. */
  const [nodeRail, setNodeRail] = useState(null);
  const railRef = useRef(null);
  const refRail = useCallback((node) => {
    railRef.current = node;
    setNodeRail(node);
  }, []);
  /* P6 (revisió) · Si el focus era al rail quan la closca ix d'estret (girar
     el mòbil, l'amfitrió que s'eixampla). El rail es desmunta en eixe commit
     i el focus cauria a <body>: la guarda el porta a la llista. */
  const focusAlRail = useRef(false);

  const measureRef = useRef(null);

  const collapsedRef = useRef({ left: leftCollapsed, middle: middleCollapsed });

  const lastPersistedRef = useRef(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const measure = () => {
      const w = page.clientWidth;
      setPageWidth(w);
      const novaMida = midaDeGraella(w, collapsedRef.current, widthsRef.current);
      const primera = !mesuradaRef.current;
      setMesurada(true);

      const prevMida = midaRef.current;
      if (prevMida !== novaMida) {
        if (prevMida === 'estret') focusAlRail.current = Boolean(railRef.current?.contains(focusActiu(page)));
        midaDemanada.current = novaMida;
        setMida(novaMida);
        if (novaMida === 'ample') demanaPanell(null);
        /* MD · En muntar, el panell d'eixida; sense panellEstret, o d'ample
           a estret amb la closca ja muntada, el detall (null), com sempre. */
        if (novaMida === 'estret' && prevMida === 'ample') {
          demanaPanell(primera ? resolPanell(panellEstretRef.current) : null);
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

  const resizeColumn = useCallback((column, requestedWidth) => {
    const containerWidth = pageRef.current?.clientWidth || 0;
    setColumnWidths((current) => {
      const otherColumn = column === 'left' ? 'middle' : 'left';
      // En mitjà el menú és un panell superposat; en ample, un rail plegat
      // ocupa 56px. La mida desada del menú desplegat no lleva espai al xat.
      // Barres (261004) · En mitjà amb railEsquerra, el rail fix també en
      // lleva: el de la columna plegada.
      const enMitjaAmbRail = midaRef.current === 'mitja' && railEsquerraRef.current;
      const otherWidth = midaRef.current !== 'ample' && otherColumn === 'left'
        ? (enMitjaAmbRail ? PUNTS_DE_TALL.plegada : 0)
        : collapsedRef.current[otherColumn] ? PUNTS_DE_TALL.plegada : current[otherColumn];
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

  /* Barres (261004) · En «mitja», amb railEsquerra, la navegació és un rail
     fix: oberta i a l'abast (graella.js), i el panell desplegat la cobrix. */
  const esquerraEnRail = mida === 'mitja' && railEsquerra;
  const navegacioEnRail = esquerraEnRail && panellObert !== 'left';
  const tancada = columnesTancades(mida, panellObert, { railEsquerra });

  /* P6 · Si la llista té desplegador en esta mida i si ara es pinta en
     rail. En «ample» mana el plegat de sempre (has-middle-collapsed).
       · mitja: la columna de la llista, plegada, és el rail.
       · estret: el rail és #app-grid-rail, muntat mentre dura estret (així
         obrir i tancar un panell no fa refluir l'editor de davall) i tancat
         (inert, aria-hidden) quan un panell el tapa. */
  const llistaPlegable = (mida === 'mitja' && railMitja) || (mida === 'estret' && railEstret);
  const ambRailEstret = mida === 'estret' && railEstret;
  const railTancat = ambRailEstret && panellObert !== null;
  const llistaEnRail = (mida === 'mitja' && railMitja && middleCollapsed) || (ambRailEstret && !railTancat);
  const graellaAmbRail = (mida === 'mitja' && railMitja && middleCollapsed) || ambRailEstret;

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
    let actiu = focusActiu(page);
    /* P6 (revisió) · Fora d'estret el rail ja no hi és: si el focus hi era i
       ha caigut fora de la closca, va on es pinta ara el contingut del rail,
       la llista (la fitxa actual, com en obrir-ne el panell). */
    if (focusAlRail.current && mida !== 'estret') {
      focusAlRail.current = false;
      if (page && (!actiu || !page.contains(actiu)) && middleRef.current) {
        destiDelPanell(middleRef.current)?.focus({ preventScroll: true });
        actiu = focusActiu(page);
      }
    }
    if (!page || !actiu || !page.contains(actiu)) return;
    /* Barres · La mateixa regla que pinta inert: amb el rail de «mitja», la
       navegació no es tanca i el focus que hi és no es mou. */
    const tancades = columnesTancades(mida, panellObert, { railEsquerra });
    const seccions = { left: leftRef, middle: middleRef, right: rightRef };
    /* P6 · El rail d'estret es tanca amb qualsevol panell obert: si el focus
       hi era (el menú o la lupa del rail), tampoc no s'hi pot quedar. */
    const rail = mida === 'estret' && panellObert !== null ? railRef.current : null;
    const columna = COLUMNES
      .map((clau) => (tancades[clau] ? seccions[clau].current : null))
      .concat(rail)
      .find((el) => el?.contains(actiu));
    if (!columna) return;
    const obridor = [...page.querySelectorAll(`[data-obri-columna][aria-controls~="${columna.id}"]`)].find(esAlAbast);
    if (obridor) obridor.focus({ preventScroll: true });
    else actiu.blur();
  }, [mida, panellObert, railEsquerra]);

  /* MD · En estret, cada panell assentat és el nivell on és la persona:
     es recorda d'on es ve (tornaDelDetall) i se n'avisa (onPanell). Amb un
     altre panell ja demanat en el mateix lot, espera, com la guarda. */
  useLayoutEffect(() => {
    if (mida !== 'estret') return;
    if (panellDemanat.current !== panellObert || midaDemanada.current !== mida) return;
    if (panellObert) ultimPanell.current = panellObert;
    onPanellRef.current?.(panellObert);
  }, [mida, panellObert]);

  /* MD · El focus del panell que s'acaba d'obrir amb obriPanell. Declarat
     DESPRÉS de la guarda: si el detall o la llista es tanquen amb el focus
     a dins i sense obridor, la guarda l'allibera i ací va al panell nou, en
     el mateix commit i sense moure cap scroll (la llista conserva el seu). */
  useLayoutEffect(() => {
    if (panellDemanat.current !== panellObert || midaDemanada.current !== mida) return;
    const panell = focusPendent.current;
    focusPendent.current = null;
    if (!panell || panell !== panellObert) return;
    const seccio = (panell === 'left' ? leftRef : middleRef).current;
    const desti = seccio ? destiDelPanell(seccio) : null;
    desti?.focus({ preventScroll: true });
  }, [mida, panellObert]);

  // En mitjà la CSS limita la llista per deixar 320px al detall. El drag i
  // el teclat han de començar en eixa amplària visible, no en la desada.
  // Barres (261004) · Amb el rail fix de la navegació, la graella en té
  // menys: el coixí del rail.
  const middleVisibleWidth = mida === 'mitja' && pageWidth > 0
    ? Math.min(columnWidths.middle, pageWidth - RIGHT_COLUMN_MIN - (esquerraEnRail ? PUNTS_DE_TALL.plegada : 0))
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

  /* MD · Obrir un panell i portar-hi el focus (l'obridor de carpetes de la
     llista, la tornada del detall). */
  const obriPanell = useCallback((panell) => {
    focusPendent.current = panell;
    demanaPanell(panell);
  }, [demanaPanell]);

  /* MD · La fletxa ← del detall (barra blava i barra d'eines): en estret,
     amb el detall a la vista i tornaEstret, obri el panell de què s'ha
     vingut. Fora d'això, null: cada fletxa fa el d'abans. */
  const potTornar = mida === 'estret' && panellObert === null && PANELLS.includes(tornaEstret);
  const tornaDelDetall = useMemo(
    () => (potTornar ? () => obriPanell(ultimPanell.current ?? tornaEstret) : null),
    [potTornar, obriPanell, tornaEstret]
  );

  const ctxValue = useMemo(() => ({
    mida,
    panellObert,
    setPanellObert: demanaPanell,
    tancaPanells,
    obriPanell,
    tornaDelDetall,
    llistaPlegable,
    llistaEnRail,
    nodeRail: ambRailEstret ? nodeRail : null,
    ambRailNavegacio: esquerraEnRail,
    navegacioEnRail,
    columnWidths,
    applyPreset
  }), [mida, panellObert, demanaPanell, columnWidths, tancaPanells, obriPanell, tornaDelDetall, llistaPlegable, llistaEnRail, ambRailEstret, nodeRail, esquerraEnRail, navegacioEnRail, applyPreset]);

  return (
    <AppGridContext.Provider value={ctxValue}>
      <div ref={pageRef} className={`app-grid-page ${className}`.trim()}>

        {children}

        <article
          className="app-grid-shell"
          data-layout={mida}
          data-panell={panellObert || ''}
          data-llista={graellaAmbRail ? 'rail' : undefined}
          data-esquerra={esquerraEnRail ? 'rail' : undefined}
          aria-label={ariaLabel}
        >


          <div className={contentMods}>
            <div className="app-grid-backdrop" aria-hidden="true" onClick={tancaPanells} />
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
            {mida !== 'estret' && !(middleCollapsed && mida === 'ample') && !graellaAmbRail ? (
              <AppGridResizer
                className="app-grid-resizer--middle"
                label={`Redimensionar ${middleTitle}`}
                value={middleVisibleWidth}
                min={COLUMN_LIMITS.middle.min}
                max={COLUMN_LIMITS.middle.max}
                onResize={(value) => resizeColumn('middle', value)}
              />
            ) : null}
            {ambRailEstret ? (
              <div
                ref={refRail}
                className="app-grid-rail"
                id="app-grid-rail"
                data-obert={!railTancat}
                inert={railTancat ? "true" : undefined}
                aria-hidden={railTancat ? true : undefined}
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
