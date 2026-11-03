import { ArrowLeft, Undo2 } from 'lucide-react';
import { useContext, useState, useRef, useEffect, useLayoutEffect, useId, forwardRef, useCallback } from 'react';
import { AppGridContext } from '../layout/AppGridShell';
import { PUNTS_DE_TALL } from '../layout/graella.js';
import { useMenuEmergent } from '../PedraSeca/hooks/useMenuEmergent.js';
import { useCapaEnrere } from '../PedraSeca/hooks/useCapaEnrere.js';
import {
  IconaCitacio, IconaCursiva, IconaDesplega, IconaDivisor, IconaLlista, IconaLlistaNumerada, IconaMesEines, IconaNegreta, IconaRatllat,
  IconaSubtargeta, IconaTargeta
} from './richText/iconesBarra.jsx';

/* Ordre del Mestre (261026_2126, prompt Tasca 3 i pla 261026_1615 §6) · Una
   sola mida de glif, la de les capçaleres de columna: 24px (abans 20), dins de
   la cel·la tàctil de 48px (--sdp-bloc-control, modules.css).
   IDEA-59 / P1-72 (Mestre 261101, punt 4) · Els glifs del format són els
   propis de richText/iconesBarra.jsx (mateix contracte que lucide: 24 × 24,
   traç de currentColor); la tornada i el desfer continuen sent els de lucide,
   els mateixos de la resta de l'app. */
const MIDA_ICONA_EINES = 24;
const iconProps = { size: MIDA_ICONA_EINES, strokeWidth: 2, 'aria-hidden': true, focusable: false };

/* IDEA-59 / P1-72 (punt 2) · El desplegable d'encapçalaments, en l'ordre
   exacte del Mestre: H3 (la secció natural del cos, la primera), H4, H5, H6
   i, al final del tot, H2. Cada nivell porta la ranura de sempre de la barra
   muda (formatState / formatActions): l'H3 i l'H2 conserven les d'abans
   (isSubheading/toggleSubheading i isHeading/toggleHeading). El nom de cada
   nivell és el parell [clau, reserva] del traductor. */
const NIVELLS_ENCAPCALAMENT = Object.freeze([
  { nivell: 3, estat: 'isSubheading', accio: 'toggleSubheading', nom: ['section.notes.format.nivell.h3', 'Títol de secció'] },
  { nivell: 4, estat: 'isH4', accio: 'toggleH4', nom: ['section.notes.format.nivell.h4', 'Subtítol de secció'] },
  { nivell: 5, estat: 'isH5', accio: 'toggleH5', nom: ['section.notes.format.nivell.h5', 'Apartat'] },
  { nivell: 6, estat: 'isH6', accio: 'toggleH6', nom: ['section.notes.format.nivell.h6', 'Subapartat'] },
  { nivell: 2, estat: 'isHeading', accio: 'toggleHeading', nom: ['section.notes.format.nivell.h2', 'Encapçalament gran'] }
]);

/* IDEA-59 / P1-72 (punt 4) · Les eines de format, per prioritat. Les
   principals van a la primera fila mentre hi caben; les que no hi caben, i
   les secundàries, a la segona fila del botó «⋯» (just a sota). */
const EINES_PRINCIPALS = Object.freeze(['encapcalament', 'negreta', 'cursiva', 'llista', 'llistaNumerada']);
/* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · Darrere del divisor, les dues
   eines d'inserció de targetes: la Subtargeta i la Targeta incrustada. Només
   es pinten si el motor n'oferix l'acció (vegeu `eina`). */
const EINES_SECUNDARIES = Object.freeze(['ratllat', 'citacio', 'divisor', 'subtargeta', 'targeta']);

/* T7 (P2) · El tall de la barra d'eines ve de la font única de la graella.
   IDEA-59 / P1-72 · També torna l'amplària mesurada: la barra ampla la fa
   servir per a decidir quantes eines caben a la primera fila. */
export function useCompactControls() {
  const [amplada, setAmplada] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setAmplada(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, compact: amplada != null && amplada < PUNTS_DE_TALL.eines, amplada };
}

const BlocIcon = forwardRef(function BlocIcon({ icon: Icon, active, label, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="sdp-bloc-icon"
      aria-pressed={active}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon {...iconProps} />
    </button>
  );
});

const BlocAction = forwardRef(function BlocAction({ label, active, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="sdp-bloc-action"
      aria-pressed={active}
      {...props}
    >
      {children}
      <span className="sdp-bloc-action__label">{label}</span>
    </button>
  );
});

/* Gauntlet 2 · 261101 · Y-Notes (G2-MO-02, WCAG 2.4.3) · Un esdeveniment
   d'una finestra modal que s'ha obert damunt de la barra no és «fora»: la
   fitxa de «Proposa Card» s'obri des de dins de les opcions compactes i, en
   tancar-se, torna el focus a Proposa Card. Si un clic o l'Escape de la
   fitxa les plegaven, el focus queia al <body>. La modal és un <dialog>
   obert que no conté la barra (a la SPA, el clic al vel també hi apunta) o,
   en l'encastat del WordPress, la barra inert (modalLocal.js marca inert
   tota l'arrel menys la capa del diàleg, i des de la finestra no es veu
   l'interior d'una arrel d'ombra tancada). */
function esDUnaCapaModal(event, contenidor) {
  if (contenidor.closest('[inert]')) return true;
  return event.composedPath().some((node) => node?.localName === 'dialog' && node.open && !node.contains(contenidor));
}

/* Un clic fora del contenidor (també des d'una arrel d'ombra tancada) o
   Escape tanquen un desplegable. `enEscape` decidix on torna el focus.
   Gauntlet 261101 · X-C-notes (C-01) · Només per a les opcions de format
   compactes del botó «⋯», que no són cap menú (role=group): el desplegable
   d'encapçalaments fa servir useMenuEmergent.
   Gauntlet 2 · 261101 · Y-Notes (G2-N-01) · L'Escape que tanca les opcions
   queda consumit (preventDefault), com el de useMenuEmergent: l'Escape del
   detall (gestionaEscapeDelDetall, IDEA-58), que espera a la finestra i
   s'hi apunta durant la mateixa tecla, ja el veu atés i no porta el focus a
   la fitxa de la Columna 2. Esta escolta s'apunta en obrir les opcions, i
   per això sempre corre abans. Un Escape que algú ja ha atés no és seu. */
function useTancaFora(obert, contenidorRef, tanca, enEscape) {
  /* P0-24b (T2b, prompt 261102_1532) · Obertes, les opcions són a la pila de
     l'Arrere d'Android amb el camí del seu Escape (enEscape). */
  useCapaEnrere(obert, enEscape);
  useEffect(() => {
    if (!obert || !contenidorRef.current) return undefined;
    const root = contenidorRef.current.getRootNode();
    const outside = (event, fromWindow = false) => {
      const path = event.composedPath();
      // Window cannot see inside a closed shadow root; handle those events there.
      if (fromWindow && root.host && path.includes(root.host)) return;
      if (path.includes(contenidorRef.current) || esDUnaCapaModal(event, contenidorRef.current)) return;
      tanca();
    };
    const escape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || esDUnaCapaModal(event, contenidorRef.current)) return;
      event.preventDefault();
      enEscape();
    };
    const outsideWindow = (event) => outside(event, true);
    window.addEventListener('pointerdown', outsideWindow);
    root.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      root.removeEventListener('pointerdown', outside);
      window.removeEventListener('pointerdown', outsideWindow);
      window.removeEventListener('keydown', escape);
    };
  }, [obert, contenidorRef, tanca, enEscape]);
}

/* Gauntlet 261101 · X-C-notes (C-01) · Les files del desplegable que el
   teclat recorre: les dels nivells amb acció (les desactivades se salten). */
const FILES_NIVELLS = '[role="menuitemradio"]:not(:disabled)';

/* Gauntlet 261101 · X-C-notes (C-01) · La llista oberta del desplegable. El
   comportament és el ÚNIC dels menús emergents de Pedra Seca
   (useMenuEmergent, el de Traduir i Comentar; doctrina C9): en obrir-la el
   focus hi entra, un clic fora o Escape la tanquen (Escape torna al botó i
   queda consumit), les fletxes (en roda), Inici i Fi la recorren, Tab n'ix i
   la tanca (tancaAmbTab) i triar tanca, torna al botó i executa el nivell.
   Només es munta oberta: el hook no escolta res amb el menú tancat. Ací
   només queden el marcatge i el focus inicial, que és el del nivell actiu
   (o l'últim, si s'obri amb la fletxa amunt): el hook enfoca la primera
   fila i este efecte, que corre just després, el porta a `inicial`. Enter
   tria també amb un esdeveniment sense clic natiu (proves, lectors). */
function LlistaNivells({ id, etiqueta, opcions, inicial, botoRef, onTanca, t }) {
  const { ref, tria, mouFocus } = useMenuEmergent({
    files: FILES_NIVELLS, onTria: (opcio) => opcio.executa?.(), onTanca, botoRef, tancaAmbTab: true
  });
  useEffect(() => { ref.current?.children[inicial]?.focus(); }, [ref, inicial]);
  return (
    <div ref={ref} id={id} role="menu" aria-label={etiqueta} className="sdp-editor-tools__menu" onKeyDown={mouFocus}>
      {opcions.map((opcio) => (
        <button
          key={opcio.nivell}
          type="button"
          role="menuitemradio"
          aria-checked={opcio.actiu}
          tabIndex={-1}
          className="sdp-editor-tools__opcio"
          disabled={!opcio.executa}
          onClick={() => tria(opcio)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            tria(opcio);
          }}
        >
          {/* L'espai separa el codi del nom per al lector («H4 Subtítol de
              secció»); dins de la fila flex no es pinta. */}
          <span className="sdp-editor-tools__opcio-codi">{`H${opcio.nivell}`}</span>{' '}
          <span className="sdp-editor-tools__opcio-nom">{t(...opcio.nom)}</span>
        </button>
      ))}
    </div>
  );
}

/* IDEA-59 / P1-72 (punt 2) · El selector d'encapçalaments: un botó de menú
   (patró «menu button» de l'APG) que diu el nivell actiu («H3»; «H» en un
   paràgraf) i obri la llista H3, H4, H5, H6, H2 (LlistaNivells). Teclat
   complet: Enter, Espai, fletxa avall o amunt l'obrin; dins, les fletxes,
   Inici i Fi es mouen, Enter o Espai trien i Escape tanca i torna al botó.
   Triar el nivell que ja és actiu el torna a paràgraf (com els botons
   d'abans, que eren commutadors). Triar un nivell porta el focus a l'editor
   (l'ordre de la barra l'enfoca). Tancat, el node role=menu hi és buit i
   amagat: el botó sempre el pot nomenar (aria-controls).
   Gauntlet 261101 · X-C-notes (C-10, WCAG 2.5.3, etiqueta dins del nom) · El
   nom accessible conté el text visible: «Encapçalament: H4» amb un nivell i
   «Encapçalament (H): Paràgraf» en un paràgraf, on el botó només mostra «H». */
function MenuEncapcalaments({ formatState, formatActions, t }) {
  const [obert, setObert] = useState(false);
  const [focusInicial, setFocusInicial] = useState(0);
  const menuId = useId();
  const botoRef = useRef(null);
  const opcions = NIVELLS_ENCAPCALAMENT.map((opcio) => ({
    ...opcio,
    actiu: Boolean(formatState[opcio.estat]),
    executa: typeof formatActions[opcio.accio] === 'function' ? formatActions[opcio.accio] : null
  }));
  const actiu = opcions.find((opcio) => opcio.actiu) || null;
  const disponibles = opcions.map((opcio, index) => (opcio.executa ? index : -1)).filter((index) => index >= 0);
  const etiqueta = t('section.notes.format.encapcalament', 'Encapçalament');
  /* Gauntlet 2 · 261101 · Y-Notes (G2-N-08) · L'ordre i la puntuació del nom
     són de cada llengua: una plantilla del diccionari per cas, amb {codi}, el
     text visible del botó («H4»; «H» en un paràgraf). Cada traducció porta
     {codi} (i18n.idiomes.test.js, paritat de marcadors): el nom sempre conté
     el que es veu (WCAG 2.5.3). */
  const codi = actiu ? `H${actiu.nivell}` : 'H';
  const nomBoto = (actiu
    ? t('section.notes.format.nomNivell', 'Encapçalament: {codi}')
    : t('section.notes.format.nomParagraf', 'Encapçalament ({codi}): Paràgraf')).replace('{codi}', () => codi);

  const tanca = useCallback(() => setObert(false), []);

  const obri = (cap) => {
    if (!disponibles.length) return;
    const delActiu = actiu ? opcions.indexOf(actiu) : -1;
    const inicial = cap === 'ultim' ? disponibles.at(-1)
      : (disponibles.includes(delActiu) ? delActiu : disponibles[0]);
    setFocusInicial(inicial);
    setObert(true);
  };

  return (
    <div className="sdp-editor-tools__nivells" data-eina="encapcalament">
      <button
        ref={botoRef}
        type="button"
        className="sdp-bloc-icon sdp-editor-tools__nivell"
        aria-haspopup="menu"
        aria-expanded={obert}
        aria-controls={menuId}
        aria-label={nomBoto}
        title={nomBoto}
        data-actiu={actiu ? 'true' : undefined}
        disabled={!disponibles.length}
        onClick={() => (obert ? setObert(false) : obri())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter') {
            event.preventDefault();
            obri();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            obri('ultim');
          }
        }}
      >
        <span className="sdp-editor-tools__nivell-actiu" aria-hidden="true">{codi}</span>
        <IconaDesplega {...iconProps} />
      </button>
      {obert ? (
        <LlistaNivells id={menuId} etiqueta={etiqueta} opcions={opcions} inicial={focusInicial}
          botoRef={botoRef} onTanca={tanca} t={t} />
      ) : (
        <div id={menuId} role="menu" aria-label={etiqueta} className="sdp-editor-tools__menu" hidden />
      )}
    </div>
  );
}

export default function UniversalToolbar({
  onBack,
  onPublish,
  publishDisabled = false,
  /* T5 · una nota connectada no es publica: es compartix. L'etiqueta la
     decidix l'adaptador del document; sense ella, «Publicar» com sempre. */
  publishLabel = null,
  /* T41 (ordre del Mestre, 260928) · Quan PUBLICAR obri una finestra (el
     selector de visibilitat), el botó ho diu: aria-haspopup. La barra continua
     muda: només rep dades. */
  publishPopup = null,
  onDelete,
  deleteDisabled = false,
  /* IDEA-41 (Mestre 261028, Bloc H) · «🎴 Proposa Card»: en ample, el primer
     botó del grup de publicació; en compacte, l'últim de les opcions de
     format. Només si l'editor el demana (onProposaCard). Apagat quan no hi ha
     res a proposar; amb proposaCardDesfer, el mateix botó desfà la proposta.
     La barra continua muda: només rep dades. */
  onProposaCard = null,
  proposaCardDisabled = false,
  proposaCardDesfer = false,
  formatState = {},
  formatActions = {},
  t = (key, fallback) => fallback
}) {
  const gridCtx = useContext(AppGridContext);
  const { ref: containerRef, compact, amplada } = useCompactControls();
  /* IDEA-59 / P1-72 (punt 4) · Un sol estat per al botó «⋯»: en ample obri la
     segona fila (just a sota, dins de la barra); en compacte, les opcions de
     format (el lloc del «Aa» d'abans, la mateixa capa de sempre). */
  const [ampliada, setAmpliada] = useState(false);
  const formatId = useId();
  const segonaId = useId();
  const toggleRef = useRef(null);
  const filaRef = useRef(null);
  const grupRef = useRef(null);
  const tancaAmpliada = useCallback(() => setAmpliada(false), []);
  const tancaAmpliadaITorna = useCallback(() => { setAmpliada(false); toggleRef.current?.focus(); }, []);
  /* En compacte les opcions floten damunt del document: un clic fora o
     Escape les tanquen (i Escape torna el focus a «⋯»), però no els d'una
     finestra modal oberta damunt (la fitxa de Proposa Card). En ample la
     segona fila és part de la barra: només la plega el mateix botó. */
  useTancaFora(compact && ampliada, containerRef, tancaAmpliada, tancaAmpliadaITorna);
  /* Gauntlet 261101 · X-C-notes (C-11, patró «disclosure» de l'APG, WCAG
     2.4.3) · En ample, la segona fila és al DOM darrere del grup de
     publicació: el Tab des de «⋯» passaria abans per Proposa Card, Borrar i
     Publicar. En obrir-la amb «⋯», el focus passa a la primera eina activa
     que s'acaba de mostrar (cap píxel no canvia: després d'un clic de ratolí
     no s'hi pinta cap anell de focus). En compacte les opcions ja són just
     darrere de «⋯» i el focus no es mou. */
  const segonaRef = useRef(null);
  const enfocaSegona = useRef(false);
  useEffect(() => {
    if (!ampliada || !enfocaSegona.current) return;
    enfocaSegona.current = false;
    segonaRef.current?.querySelector('button:not(:disabled)')?.focus();
  }, [ampliada]);

  /* IDEA-59 / P1-72 (punt 4: «les eines que no càpiguen, a la segona barra»)
     · En ample, quantes eines principals caben a la primera fila al costat
     de la tornada, «⋯» i el grup de publicació. Es mesura abans de pintar
     (sense salts) i es recorden les amplàries de cada eina, perquè una eina
     que ja és a la segona fila (plegada) també compte. Sense motor de
     maquetació (o amb la barra amagada) no es mesura res: totes hi caben. */
  const [caben, setCaben] = useState(EINES_PRINCIPALS.length);
  const amplesRef = useRef({});
  useLayoutEffect(() => {
    const fila = filaRef.current;
    const grup = grupRef.current;
    if (compact || !fila || !grup || !fila.clientWidth || typeof getComputedStyle !== 'function') return;
    for (const eina of grup.querySelectorAll(':scope > [data-eina]')) {
      const ample = eina.getBoundingClientRect().width;
      if (ample) amplesRef.current[eina.dataset.eina] = ample;
    }
    const px = (valor) => parseFloat(valor) || 0;
    const estilFila = getComputedStyle(fila);
    const estilGrup = getComputedStyle(grup);
    let ocupat = px(estilFila.paddingLeft) + px(estilFila.paddingRight);
    let germans = 0;
    for (const fill of fila.children) {
      if (fill === grup) continue;
      const ample = fill.getBoundingClientRect().width;
      if (!ample) continue;
      ocupat += ample;
      germans += 1;
    }
    ocupat += germans * px(estilFila.columnGap);
    const extres = px(estilGrup.paddingLeft) + px(estilGrup.paddingRight) + px(estilGrup.borderLeftWidth) + px(estilGrup.borderRightWidth);
    const disponible = Math.floor(fila.clientWidth - ocupat - extres);
    let usat = 0;
    let quantes = 0;
    for (const id of EINES_PRINCIPALS) {
      const ample = amplesRef.current[id];
      if (!ample) break;
      const pas = ample + (quantes ? px(estilGrup.columnGap) : 0);
      if (usat + pas > disponible) break;
      usat += pas;
      quantes += 1;
    }
    if (quantes !== caben) setCaben(quantes);
  }, [compact, amplada, caben, onDelete, onPublish, onProposaCard, publishLabel, t]);

  /* MD (261003) · La mateixa tornada que la fletxa blava quan la closca
     l'oferix (mestre-detall en estret); si no, la d'abans. */
  const handleBack = onBack || gridCtx?.tornaDelDetall || (() => gridCtx?.setPanellObert('middle'));

  /* IDEA-41 · Una cel·la de 48px amb el glif i el nom accessible (aria-label
     i title), ampla o compacta. Revisió adversarial 261028 · La pastilla amb
     el text (181px, 229px com «Desfés la proposta») passava la barra a dues
     files fins a 800-850px d'amplària i, en desfer, la canviava davall del
     punter; la cel·la fa sempre 48px. R2 (revisió final 261028) · En
     compacte, al grup de publicació, els 48px i el gap passaven la barra a
     dues files als telèfons: va dins de les opcions de format, l'última. */
  const etiquetaProposaCard = proposaCardDesfer
    ? t('section.notes.proposaCardDesfer', 'Desfés la proposta')
    : t('section.notes.proposaCard', 'Proposa Card');
  const glifProposaCard = proposaCardDesfer ? <Undo2 {...iconProps} /> : <span aria-hidden="true">🎴</span>;
  const botoProposaCard = typeof onProposaCard !== 'function' ? null : (
    <button type="button" className="sdp-bloc-icon" aria-label={etiquetaProposaCard} title={etiquetaProposaCard}
      disabled={proposaCardDisabled} onClick={onProposaCard}>{glifProposaCard}</button>
  );

  const {
    isList, isOrderedList, isBold, isItalic, isStrike, isCitacio
  } = formatState;
  const {
    toggleList, toggleOrderedList, toggleBold, toggleItalic, toggleStrike, toggleCitacio, insertDivisor,
    insertSubtargeta, insertTargeta
  } = formatActions;

  /* Cada eina, per id (data-eina: la barra en mesura l'amplària). */
  const eina = (id) => {
    switch (id) {
      case 'encapcalament':
        return <MenuEncapcalaments key={id} formatState={formatState} formatActions={formatActions} t={t} />;
      case 'negreta':
        return <BlocIcon key={id} data-eina={id} icon={IconaNegreta} active={isBold}
          label={t('section.notes.format.bold', 'Negreta')} onClick={toggleBold} disabled={!toggleBold} />;
      case 'cursiva':
        return <BlocIcon key={id} data-eina={id} icon={IconaCursiva} active={isItalic}
          label={t('section.notes.format.italic', 'Cursiva')} onClick={toggleItalic} disabled={!toggleItalic} />;
      case 'llista':
        return <BlocIcon key={id} data-eina={id} icon={IconaLlista} active={isList}
          label={t('section.notes.format.list', 'Llista')} onClick={toggleList} disabled={!toggleList} />;
      case 'llistaNumerada':
        return <BlocIcon key={id} data-eina={id} icon={IconaLlistaNumerada} active={isOrderedList}
          label={t('section.notes.format.orderedList', 'Llista numerada')} onClick={toggleOrderedList} disabled={!toggleOrderedList} />;
      /* IDEA-59 / P1-72 (punt 3) · El ratllat es conserva: no és el subratllat. */
      case 'ratllat':
        return <BlocIcon key={id} data-eina={id} icon={IconaRatllat} active={isStrike}
          label={t('section.notes.format.strike', 'Ratllat')} onClick={toggleStrike} disabled={!toggleStrike} />;
      case 'citacio':
        return <BlocIcon key={id} data-eina={id} icon={IconaCitacio} active={isCitacio}
          label={t('section.notes.format.citacio', 'Citació')} onClick={toggleCitacio} disabled={!toggleCitacio} />;
      /* El divisor inserix: no és cap commutador (cap aria-pressed). */
      case 'divisor':
        return <BlocIcon key={id} data-eina={id} icon={IconaDivisor} active={undefined}
          label={t('section.notes.format.divisor', 'Divisor')} onClick={insertDivisor} disabled={!insertDivisor} />;
      /* O4-CLAUDE-2 · Les eines d'inserció de targetes, com el divisor (cap
         aria-pressed), però només quan el motor n'oferix l'acció: un editor
         sense l'extensió o sense el selector de targetes no pinta cap botó
         apagat que no podrà fer res mai. */
      case 'subtargeta':
        return typeof insertSubtargeta !== 'function' ? null : (
          <BlocIcon key={id} data-eina={id} icon={IconaSubtargeta} active={undefined}
            label={t('section.notes.format.subtargeta', 'Subtargeta')} onClick={insertSubtargeta} />
        );
      case 'targeta':
        return typeof insertTargeta !== 'function' ? null : (
          <BlocIcon key={id} data-eina={id} icon={IconaTargeta} active={undefined}
            label={t('section.notes.format.targeta', 'Targeta incrustada')} onClick={insertTargeta} />
        );
      default:
        return null;
    }
  };

  const principals = compact ? EINES_PRINCIPALS : EINES_PRINCIPALS.slice(0, caben);
  const plegades = compact ? [] : EINES_PRINCIPALS.slice(caben);
  const nomOpcions = t('section.notes.format.opcions', 'Opcions de format del text');
  const nomAmplia = compact
    ? t('section.notes.format.menu', 'Format del text')
    : t('section.notes.format.mesEines', 'Més eines');
  const botoAmplia = (
    <button ref={toggleRef} type="button" className="sdp-bloc-icon sdp-editor-tools__amplia"
      aria-label={nomAmplia} title={nomAmplia} aria-expanded={ampliada} aria-controls={compact ? formatId : segonaId}
      onClick={() => {
        enfocaSegona.current = !ampliada && !compact;
        setAmpliada(!ampliada);
      }}>
      <IconaMesEines {...iconProps} />
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="sdp-editor-tools"
      data-compact={compact}
      role="group"
      aria-label={t('section.notes.eines', "Eines de l'editor")}
    >
      <div ref={filaRef} className="sdp-editor-tools__formats">
        <button
          type="button"
          aria-label={t('section.notes.tornaLlista', 'Tornar a la llista')}
          title={t('section.notes.tornaLlista', 'Tornar a la llista')}
          onClick={handleBack}
          className="sdp-bloc-icon d-mobile-only"
        >
          <ArrowLeft {...iconProps} />
        </button>

        {compact ? botoAmplia : null}
        <div ref={grupRef} id={formatId} className="sdp-editor-tools__group sdp-editor-tools__format-options"
          hidden={compact ? !ampliada : principals.length === 0} role="group" aria-label={nomOpcions}>
          {principals.map(eina)}
          {compact ? EINES_SECUNDARIES.map(eina) : null}
          {compact ? botoProposaCard : null}
        </div>
        {compact ? null : botoAmplia}

        <div className="sdp-editor-tools__group sdp-editor-tools__group--publicacio">
          {compact ? null : botoProposaCard}
          {onDelete && (
            <BlocAction
              label={t('section.notes.delete', 'Borrar')}
              disabled={deleteDisabled}
              onClick={onDelete}
            />
          )}
          {onPublish && (
            <BlocAction
              label={publishLabel || t('section.notes.publish', 'Publicar')}
              disabled={publishDisabled}
              aria-haspopup={publishPopup || undefined}
              onClick={onPublish}
            />
          )}
        </div>
      </div>
      {compact ? null : (
        <div ref={segonaRef} id={segonaId} className="sdp-editor-tools__segona-fila" role="group"
          aria-label={t('section.notes.format.mesEines', 'Més eines')} hidden={!ampliada}>
          {plegades.map(eina)}
          {EINES_SECUNDARIES.map(eina)}
        </div>
      )}
    </div>
  );
}
