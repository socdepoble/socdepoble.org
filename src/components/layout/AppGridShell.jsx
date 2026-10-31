import { useLayoutEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { getVal, setVal } from '../../config/storage.js';
import AppGridResizer from './AppGridResizer';
import { COLUMNES, PUNTS_DE_TALL, columnesTancades, midaDeGraella, minimsDeGraella, pistesAjustades } from './graella.js';
/* Ordre d'usabilitat (30-10-2026) · El context viu a contextDeLaGraella.js
   perquè AppGridColumn el puga llegir sense importar la closca; ací es
   reexporta, el mateix objecte.
   Corrector del Gauntlet f4 (30-10-2026) · TextosDeLaColumna hi viu també:
   el nom traduït dels separadors (redimensionaColumna), si qui munta la
   closca el dona. */
import { AppGridContext, TextosDeLaColumna } from './contextDeLaGraella.js';

export { AppGridContext };

const COLUMN_LIMITS = Object.freeze({
  left: { min: 200, max: 340 },
  middle: { min: 240, max: 520 },
});
/* Columnes fixes · Els mínims de sempre i els sòls que valen quan aquells no
   hi caben amb el detall (graella.js, minimsDeGraella: closca de 720 a 761
   amb navegació i llista obertes). */
const MINIMS_COLUMNA = Object.freeze({ left: COLUMN_LIMITS.left.min, middle: COLUMN_LIMITS.middle.min });
const SOLS_COLUMNA = Object.freeze({ left: 160, middle: 180 });
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

/* Corrector del Gauntlet f4 (30-10-2026, separadors-aria-valuemax-fals) · El
   màxim real d'una columna (`column`) en una closca de `amplada` px: el que
   limita resizeColumn i, per això, el que declara el seu separador
   (aria-valuemax) i on porten Fi i l'arrossegament. Abans el separador deia
   sempre 340 o 520, i entre 721 i 800 Fi s'aturava a 219-279 amb el lector
   anunciant «239 de 520».
     · Columnes fixes en «ample»: fins on l'altra, desplegada, queda al seu
       mínim per a esta amplària (minimsDeGraella; plegada, el rail), amb el
       mínim del detall i els dos separadors.
     · Sense (el Xat, les apps): fins on deixa l'altra amb la seua amplada
       (en «mitja», la navegació és un panell i no en resta res; plegada, el
       rail), amb el mínim del detall i, en «ample», els separadors.
   `plegades`: { left, middle }; `amplades`: les desades, { left, middle }. */
function maximDeColumna(column, { amplada, mida, columnesFixes, plegades, amplades }) {
  const otherColumn = column === 'left' ? 'middle' : 'left';
  if (columnesFixes && mida === 'ample') {
    const minims = minimsDeGraella(amplada, plegades, MINIMS_COLUMNA, SOLS_COLUMNA);
    const minimAltra = plegades[otherColumn] ? PUNTS_DE_TALL.plegada : minims[otherColumn];
    const reservat = RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2;
    return Math.max(minims[column], Math.min(COLUMN_LIMITS[column].max, amplada - minimAltra - reservat));
  }
  const otherWidth = mida !== 'ample' && otherColumn === 'left'
    ? 0
    : plegades[otherColumn] ? PUNTS_DE_TALL.plegada : amplades[otherColumn];
  const reservedResizers = mida === 'ample' ? RESIZER_WIDTH * 2 : 0;
  const availableMax = amplada - otherWidth - RIGHT_COLUMN_MIN - reservedResizers;
  const limits = COLUMN_LIMITS[column];
  return Math.max(limits.min, Math.min(limits.max, availableMax));
}

/* Corrector del Gauntlet f4 (30-10-2026) · El nom de cada separador,
   «Redimensionar {nom}»: el tradueix qui munta la closca
   (TextosDeLaColumna.redimensionaColumna); sense, el valencià de sempre.
   Amb una funció, perquè un «$» del títol no es llija com a patró. */
const REDIMENSIONA_COLUMNA = 'Redimensionar {nom}';
const nomDelSeparador = (plantilla, titol) => plantilla.replace('{nom}', () => String(titol ?? ''));

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
     xicotetes. Opcional i false per defecte: sense, la closca és la d'abans
     (el Xat i les apps la munten a mà i no la passen).
       · railEstret: en «estret», un rail de --app-grid-col-collapsed a
         l'esquerra del detall (#app-grid-rail, la primera columna estreta,
         sempre a la vista amb el detall). La columna de la llista continua
         sent el panell del mestre-detall: tancada amb el detall a la vista,
         i el seu panell i el de la navegació tapen rail i detall. El rail
         és buit: qui munta la closca hi pinta amb un portal (nodeRail).
     El context ho diu amb llistaPlegable (en esta mida, la llista té el
     desplegador) i nodeRail. Corrector del Gauntlet f4 (30-10-2026) ·
     llistaEnRail (ara es pinta en rail) només el llegia la llista en rail
     de «mitja» (railMitja, retirat): s'ha retirat del context.
     Decisió 4 del Mestre (30-10-2026 ~15:00) · railMitja (la llista en rail
     en «mitja», 261003) i railEsquerra (la navegació en rail fix en
     «mitja», barres 261004) només els passava l'UniversalWorkspace, que amb
     columnesFixes ja no passa mai per «mitja»: s'han retirat, amb la seua
     CSS i les seues proves. «Mitja» es queda per al Xat i les apps. */
  railEstret = false,
  /* Columnes fixes (ordre del Mestre, 30-10-2026 ~12:45: «fora de mòbil,
     l'UniversalWorkspace ha de mantindre sempre les 3 columnes fixes en la
     graella, mai superposades com a calaix flotant amb fons fosc»).
     Opcional i false per defecte: sense, la closca és la d'abans (el Xat i
     les apps conserven «mitja»). Amb, per damunt d'«estret» la closca és
     sempre «ample» (graella.js, midaDeGraella): desplegar navegació o llista
     les obri dins de la graella, amb els seus separadors, i si les amplades
     desades no hi caben es pinten ajustades (pistesAjustades). Arrossegar un
     separador fa cedir l'altra columna fins al seu mínim abans que el
     detall. Els panells flotants i el vel queden per a «estret» (fins a
     720 inclòs, decisió 1 del Mestre de 30-10-2026 ~15:00). */
  columnesFixes = false,
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
  /* Columnes fixes · El mesurament i resizeColumn en lligen la marca d'ací.
     Si canvia amb la closca muntada, es torna a mesurar. */
  const columnesFixesRef = useRef(columnesFixes);
  useLayoutEffect(() => {
    if (columnesFixesRef.current === columnesFixes) return;
    columnesFixesRef.current = columnesFixes;
    measureRef.current?.();
  }, [columnesFixes]);
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
      const novaMida = midaDeGraella(w, collapsedRef.current, widthsRef.current, { columnesFixes: columnesFixesRef.current });
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

  /* Columnes fixes · Les amplades que es pinten: en «ample» amb columnesFixes,
     les desades repartides a l'espai que hi ha (pistesAjustades); sense, les
     desades, com sempre. Els separadors parteixen d'estes (el que es veu). */
  const ampladesPintades = useMemo(() => (
    columnesFixes && mida === 'ample'
      ? pistesAjustades(
        pageWidth,
        { left: leftCollapsed, middle: middleCollapsed },
        columnWidths,
        MINIMS_COLUMNA,
        SOLS_COLUMNA
      )
      : columnWidths
  ), [columnesFixes, mida, pageWidth, leftCollapsed, middleCollapsed, columnWidths]);
  /* Gauntlet 261030 (cicle 4) · Els mínims dels separadors: amb columnesFixes
     en «ample», els que valen per a esta amplària (minimsDeGraella: per davall
     de 762 amb les dues obertes, els sòls); sense, els de sempre. */
  const minimsPintats = useMemo(() => (
    columnesFixes && mida === 'ample'
      ? minimsDeGraella(pageWidth, { left: leftCollapsed, middle: middleCollapsed }, MINIMS_COLUMNA, SOLS_COLUMNA)
      : MINIMS_COLUMNA
  ), [columnesFixes, mida, pageWidth, leftCollapsed, middleCollapsed]);
  /* Corrector del Gauntlet f4 (30-10-2026) · I els màxims: els reals per a
     esta amplària (maximDeColumna, la regla de resizeColumn). Sense amplària
     mesurada (0), els de sempre. */
  const maximsPintats = useMemo(() => {
    if (!(pageWidth > 0)) return { left: COLUMN_LIMITS.left.max, middle: COLUMN_LIMITS.middle.max };
    const graella = { amplada: pageWidth, mida, columnesFixes, plegades: { left: leftCollapsed, middle: middleCollapsed }, amplades: columnWidths };
    return { left: maximDeColumna('left', graella), middle: maximDeColumna('middle', graella) };
  }, [columnesFixes, mida, pageWidth, leftCollapsed, middleCollapsed, columnWidths]);
  /* El nom dels separadors (TextosDeLaColumna, si qui munta la closca el tradueix). */
  const textosDeLaColumna = useContext(TextosDeLaColumna);
  const redimensiona = textosDeLaColumna?.redimensionaColumna || REDIMENSIONA_COLUMNA;

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    page.style.setProperty(
      '--app-grid-col-sidebar',
      `${ampladesPintades.left}px`
    );
    page.style.setProperty(
      '--app-grid-col-list',
      `${ampladesPintades.middle}px`
    );
  }, [ampladesPintades.left, ampladesPintades.middle]);

  const resizeColumn = useCallback((column, requestedWidth) => {
    const containerWidth = pageRef.current?.clientWidth || 0;
    setColumnWidths((current) => {
      const otherColumn = column === 'left' ? 'middle' : 'left';
      /* Columnes fixes (ordre del Mestre, 30-10-2026) · «L'usuari ha de
         poder moure i redimensionar lliurement les columnes»: la columna
         arrossegada pot créixer fins on l'altra, desplegada, queda al seu
         mínim (plegada, el rail), amb el mínim del detall. Si l'altra no hi
         cap, cedix i es desa: arrossegar és una tria explícita.
         Gauntlet 261030 (cicle 4) · Tot parteix del que es VEU: l'altra
         columna conserva la seua amplada pintada (pistesAjustades), no la
         desada, i només es mou el separador que s'opera; el detall absorbix
         la diferència. Els mínims són els que valen per a esta amplària
         (minimsDeGraella): per davall de 762 els separadors no es congelen. */
      if (columnesFixesRef.current && midaRef.current === 'ample') {
        const plegades = collapsedRef.current;
        const altraPlegada = Boolean(plegades[otherColumn]);
        const minims = minimsDeGraella(containerWidth, plegades, MINIMS_COLUMNA, SOLS_COLUMNA);
        const pintades = pistesAjustades(containerWidth, plegades, current, MINIMS_COLUMNA, SOLS_COLUMNA);
        const minimAltra = altraPlegada ? PUNTS_DE_TALL.plegada : minims[otherColumn];
        const reservat = RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2;
        const maxFix = maximDeColumna(column, { amplada: containerWidth, mida: 'ample', columnesFixes: true, plegades, amplades: current });
        const amplada = clamp(requestedWidth, minims[column], maxFix);
        const seguent = { ...current, [column]: amplada };
        if (!altraPlegada) {
          const espaiAltra = Math.floor(containerWidth - amplada - reservat);
          seguent[otherColumn] = Math.max(minimAltra, Math.min(pintades[otherColumn], espaiAltra));
        }
        return seguent.left === current.left && seguent.middle === current.middle ? current : seguent;
      }
      // En mitjà el menú és un panell superposat; en ample, un rail plegat
      // ocupa 56px. La mida desada del menú desplegat no lleva espai al xat
      // (maximDeColumna, la mateixa regla que declara el separador).
      const limits = COLUMN_LIMITS[column];
      const max = maximDeColumna(column, { amplada: containerWidth, mida: midaRef.current, columnesFixes: false, plegades: collapsedRef.current, amplades: current });
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

  /* P6 · Si la llista té desplegador en esta mida i si ara es pinta en
     rail. En «ample» mana el plegat de sempre (has-middle-collapsed). En
     «estret», el rail és #app-grid-rail, muntat mentre dura estret (així
     obrir i tancar un panell no fa refluir l'editor de davall) i tancat
     (inert, aria-hidden) quan un panell el tapa. */
  const ambRailEstret = mida === 'estret' && railEstret;
  const llistaPlegable = ambRailEstret;
  const railTancat = ambRailEstret && panellObert !== null;

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
    /* La mateixa regla que pinta inert. */
    const tancades = columnesTancades(mida, panellObert);
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
  }, [mida, panellObert]);

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
  // Columnes fixes · En «ample», la pintada (ampladesPintades): sense
  // columnesFixes és la desada, com sempre.
  const middleVisibleWidth = mida === 'mitja' && pageWidth > 0
    ? Math.min(columnWidths.middle, pageWidth - RIGHT_COLUMN_MIN)
    : ampladesPintades.middle;

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
    /* Fase D (261020, L4) · `mesurada` diu si ja hi ha un render amb la mida
       mesurada; només és false al primer commit, sense pintar. */
    mesurada,
    panellObert,
    setPanellObert: demanaPanell,
    tancaPanells,
    obriPanell,
    tornaDelDetall,
    llistaPlegable,
    nodeRail: ambRailEstret ? nodeRail : null,
    columnWidths,
    applyPreset
  }), [mida, mesurada, panellObert, demanaPanell, columnWidths, tancaPanells, obriPanell, tornaDelDetall, llistaPlegable, ambRailEstret, nodeRail, applyPreset]);

  return (
    <AppGridContext.Provider value={ctxValue}>
      <div ref={pageRef} className={`app-grid-page ${className}`.trim()}>

        {children}

        <article
          className="app-grid-shell"
          data-layout={mida}
          data-panell={panellObert || ''}
          data-llista={ambRailEstret ? 'rail' : undefined}
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
                label={nomDelSeparador(redimensiona, leftTitle)}
                value={ampladesPintades.left}
                min={minimsPintats.left}
                max={maximsPintats.left}
                controls="app-grid-sidebar"
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
                label={nomDelSeparador(redimensiona, middleTitle)}
                value={middleVisibleWidth}
                min={minimsPintats.middle}
                max={maximsPintats.middle}
                controls="app-grid-list"
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
