/**
 * Lector de notícies · les dreceres de teclat de les notícies, a la manera de
 * Feedly (E1 del Gauntlet, 261016; estudi de docs.feedly.com, «Keyboard
 * shortcuts»: les tecles d'un sol caràcter del seu lector).
 *
 *   J / K           la notícia següent / anterior de la llista que es veu, i
 *                   l'obri (la navegació de selecció de l'espai: push)
 *   N / P           la fila següent / anterior, sense obrir-la: el focus hi va
 *   O               obri la fila del focus; amb una notícia oberta, la tanca
 *   M               commuta llegida / no llegida
 *   S               commuta «Per a després»
 *   V               obri l'original en una pestanya nova (noopener)
 *   Maj+A           marca com a llegides les de la llista que es veu (amb una
 *                   cerca, només els resultats: com «Marca-ho tot com a llegit»)
 *   Maj+J / Maj+K   la carpeta següent / anterior de l'arbre, en l'ordre en què
 *                   es pinta: «Hui», «Per a després» i cada categoria seguida
 *                   de les seues fonts
 * La fila on és la persona és la que té el focus a la llista i, si no, la
 * notícia oberta. M, S i V hi actuen.
 *
 * WCAG 2.1.4 (Character Key Shortcuts) · Les dreceres només valen amb el focus
 * DINS de la closca del Lector: amb el focus a l'amfitrió (un camp de la pàgina
 * de WordPress) o perdut (el body) no fan res. Callen on calla Esc (Lector.jsx ·
 * ESC_ALIE i ambDialegObert): un camp de text, un element editable, un diàleg
 * obert (l'Índex de secció o un modal propi) o un panell superposat que tapa
 * el detall (en mitjana i en estret). Cap tecla amb Ctrl, ⌘ o Alt: són del
 * navegador i de l'amfitrió. Una tecla que ja ha atès un altre (defaultPrevented:
 * la UniversalToolbar, el PageFrame) no es torna a atendre; la que s'atén, es
 * marca (preventDefault). Mantenir premuda una tecla només repetix el moviment
 * (J, K, N, P, Maj+J, Maj+K), mai una acció (V obriria una pestanya per cada
 * repetició).
 *
 * El focus · Cap drecera el roba: només es mou si ja és dins de la closca. Si
 * una drecera fa desaparéixer la fila enfocada (una altra carpeta, llevar-la de
 * «Per a després»), el focus va a la fila de l'arbre de la carpeta nova o a la
 * fila veïna de la llista, perquè la drecera següent continue valent.
 *
 * Zero píxels: no pinta res. S'escolta a l'arrel del node (el document o, en
 * l'encastat, l'arrel ombra), com Esc.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { DESPRES, urlAbsoluta } from '../nucli/index.js';
import { ESC_ALIE, ambDialegObert, focusLliure } from './Lector.jsx';
import { opcioDeCarpeta } from './navegacio.js';

/* Les files de la llista, en l'ordre en què es veuen (el de `visibleItemIds`): les fitxes de la
   columna del mig o, plegada, els botons del seu rail de documents. Només n'hi ha una de les dues. */
const FITXES = '#app-grid-list .sdp-gestor-llista > li > .sdp-gestor-fitxa, #app-grid-list .sdp-workspace-rail--documents li > button';
/* La fila de l'arbre de la carpeta triada; al rail de la navegació plegada, la seua arrel. */
const FILA_TRIADA = '#app-grid-sidebar [aria-current="page"]';
const ARREL_TRIADA = '#app-grid-sidebar [aria-current="true"]';
/* Una columna que la closca té tancada (AppGridShell la marca inert): el navegador no hi enfoca res. */
const COLUMNA_TANCADA = '[inert]';

const DRECERES = Object.freeze({
  j: 'seguent', k: 'anterior', n: 'tria-seguent', p: 'tria-anterior', o: 'obri', m: 'llegit', s: 'despres', v: 'original'
});
const DRECERES_AMB_MAJ = Object.freeze({ a: 'tot-llegit', j: 'carpeta-seguent', k: 'carpeta-anterior' });
const REPETIBLES = new Set(['seguent', 'anterior', 'tria-seguent', 'tria-anterior', 'carpeta-seguent', 'carpeta-anterior']);

/**
 * L'acció d'una tecla, o null si no n'és cap: la lletra sense Ctrl, ⌘ ni Alt (Maj només per a A,
 * J i K). Amb el bloqueig de majúscules, la lletra és la mateixa. Una tecla ja atesa, en plena
 * composició (IME) o repetida (si no és un moviment), cap.
 */
export function accioDeTecla(event) {
  if (!event || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return null;
  const tecla = typeof event.key === 'string' && event.key.length === 1 ? event.key.toLowerCase() : '';
  const taula = event.shiftKey ? DRECERES_AMB_MAJ : DRECERES;
  const accio = Object.hasOwn(taula, tecla) ? taula[tecla] : null;
  if (!accio || (event.repeat && !REPETIBLES.has(accio))) return null;
  return accio;
}

/**
 * Les opcions de l'arbre (Noticies.jsx · opcionsDeLArbre) en l'ordre en què es pinten: cada arrel
 * i, darrere, les seues filles. Els ids.
 */
export function ordreDeLArbre(opcions) {
  const llista = Array.isArray(opcions) ? [...opcions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
  const filles = new Map();
  for (const opcio of llista) {
    if (opcio.parentId != null) filles.set(opcio.parentId, [...(filles.get(opcio.parentId) || []), opcio.id]);
  }
  return llista.filter((opcio) => opcio.parentId == null).flatMap((opcio) => [opcio.id, ...(filles.get(opcio.id) || [])]);
}

/* La fila on és la persona: la del focus, si és una fila de la llista; si no, la notícia oberta.
   Les fitxes només valen si en són tantes com els ids (el mateix ordre: el de l'espai). */
function filaActual(closca, desti, ids, obert) {
  const totes = [...closca.querySelectorAll(FITXES)];
  const fitxes = totes.length === ids.length ? totes : [];
  const delFocus = fitxes.indexOf(desti);
  if (delFocus >= 0) return { fitxes, index: delFocus, id: ids[delFocus], enfocada: true };
  const id = obert == null ? null : String(obert);
  return { fitxes, index: id == null ? -1 : ids.indexOf(id), id, enfocada: false };
}

/* La veïna en la direcció `pas`; sense fila actual, la primera (només cap avant). */
function veina(index, pas, mida) {
  const desti = index < 0 ? (pas > 0 ? 0 : -1) : index + pas;
  return desti >= 0 && desti < mida ? desti : -1;
}

const enfocable = (node) => Boolean(node?.isConnected) && !node.closest(COLUMNA_TANCADA);

/* El resum d'una notícia: el de la llista o el desat (la font ja no la servix), com a Lector.jsx. */
const resumDe = (id, noticies, estat) => noticies.articles.find((article) => article.id === id)
  || estat.despres.find((desat) => desat.id === id)
  || null;

/**
 * Fa l'acció i diu si l'ha feta (llavors es marca la tecla). `entorn`: el de EspaiNoticies
 * ({ lector, noticies, opcions, obert, enTriar, tanca }); `vista`: la del detall
 * ({ selection, ids }). Torna, si cal, on ha d'anar el focus si la fila enfocada desapareix.
 */
function fes(accio, { closca, desti, entorn, vista }) {
  const { lector, noticies, opcions, obert, enTriar, tanca } = entorn;
  const { selection, ids } = vista;
  const categoryId = selection?.categoryId ?? null;
  const fila = filaActual(closca, desti, ids, obert);
  const obri = (itemId) => enTriar({ categoryId, itemId }, { reason: 'user' });
  switch (accio) {
    case 'seguent':
    case 'anterior': {
      const index = veina(fila.index, accio === 'seguent' ? 1 : -1, ids.length);
      if (index < 0) return null;
      obri(ids[index]);
      return {};
    }
    case 'tria-seguent':
    case 'tria-anterior': {
      const index = veina(fila.index, accio === 'tria-seguent' ? 1 : -1, fila.fitxes.length);
      const fitxa = index < 0 ? null : fila.fitxes[index];
      if (!enfocable(fitxa)) return null;
      fitxa.focus();
      return {};
    }
    case 'obri':
      if (fila.enfocada && fila.id !== (obert == null ? null : String(obert))) {
        obri(fila.id);
        return {};
      }
      if (obert == null) return null;
      tanca();
      return {};
    case 'llegit':
      if (fila.id == null) return null;
      if (lector.estat.llegits.includes(fila.id)) lector.accions.marcaNoLlegit(fila.id);
      else lector.accions.marcaLlegit(fila.id);
      return {};
    case 'despres': {
      const resum = fila.id == null ? null : resumDe(fila.id, noticies, lector.estat);
      if (!resum) return null;
      /* A «Per a després», una fila desada que no és la notícia oberta se'n va en llevar-la. */
      const marxa = fila.enfocada && categoryId === opcioDeCarpeta(DESPRES) && fila.id !== String(obert ?? '')
        && lector.estat.despres.some((desat) => desat.id === fila.id);
      lector.accions.commutaDespres(resum);
      return marxa ? { fila: fila.index } : {};
    }
    case 'original': {
      const resum = fila.id == null ? null : resumDe(fila.id, noticies, lector.estat);
      const adreca = urlAbsoluta(resum?.enllac);
      const finestra = closca.ownerDocument?.defaultView;
      if (!adreca || typeof finestra?.open !== 'function') return null;
      finestra.open(adreca, '_blank', 'noopener,noreferrer');
      return {};
    }
    case 'tot-llegit': {
      const llegits = new Set(lector.estat.llegits);
      const pendents = ids.filter((id) => !llegits.has(id));
      if (!pendents.length) return null;
      lector.accions.marcaLlegits(pendents);
      return {};
    }
    case 'carpeta-seguent':
    case 'carpeta-anterior': {
      const ordre = ordreDeLArbre(opcions);
      const index = veina(ordre.indexOf(categoryId), accio === 'carpeta-seguent' ? 1 : -1, ordre.length);
      if (index < 0) return null;
      enTriar({ categoryId: ordre[index], itemId: null }, { reason: 'user' });
      return { carpeta: true };
    }
    default:
      return null;
  }
}

/**
 * Les dreceres de les notícies. Viu dins del detall de l'espai (renderDetail de Noticies.jsx), al
 * mateix lloc amb notícia i sense: no es desmunta en obrir-ne una. No pinta res.
 *   selection, visibleItemIds   els de l'espai (renderDetail): la llista que es veu
 *   entorn   ref de EspaiNoticies: { lector, noticies, opcions, obert, enTriar, tanca }
 *   closca   ref de EspaiNoticies amb la closca (.app-grid-page) on viu l'espai
 */
export function DreceresDeNoticies({ selection = null, visibleItemIds = null, entorn, closca }) {
  const { mida, panellObert } = useClosaAplicacio();
  const vista = useRef(null);
  const pendent = useRef(null);
  const escolta = useRef(null);

  useLayoutEffect(() => {
    /* `crus`: la referència de l'espai, que es conserva mentre els ids no canvien (WorkspaceFrame). */
    vista.current = {
      selection,
      ids: Array.isArray(visibleItemIds) ? visibleItemIds.map(String) : [],
      crus: visibleItemIds,
      tapat: mida !== 'ample' && panellObert !== null
    };
  });

  /* El focus d'una fila que la drecera ha fet desaparéixer: quan l'espai ja ha canviat (una altra
     carpeta o una altra llista), i només si s'ha perdut. */
  useLayoutEffect(() => {
    const espera = pendent.current;
    const node = closca.current;
    if (!espera) return;
    if (!node?.isConnected) {
      pendent.current = null;
      return;
    }
    if ((selection?.categoryId ?? null) === espera.categoryId && visibleItemIds === espera.ids) return;
    pendent.current = null;
    if (!focusLliure(node, null)) return;
    let desti = null;
    if (espera.carpeta) {
      desti = [node.querySelector(FILA_TRIADA), node.querySelector(ARREL_TRIADA)].find(enfocable) || null;
    } else {
      const fitxes = [...node.querySelectorAll(FITXES)];
      desti = fitxes[Math.min(espera.fila, fitxes.length - 1)] || null;
    }
    if (enfocable(desti)) desti.focus({ preventScroll: true });
  });

  /* L'escoltador, a l'arrel de la closca: es posa quan se sap quina és i es lleva en desmuntar. */
  useEffect(() => {
    const node = closca.current;
    if (escolta.current?.node === node) return;
    escolta.current?.lleva();
    escolta.current = null;
    const arrel = node?.getRootNode?.();
    if (!node || typeof arrel?.addEventListener !== 'function') return;
    const tecla = (event) => {
      const accio = accioDeTecla(event);
      const ara = vista.current;
      if (!accio || !ara || ara.tapat || !entorn.current) return;
      const desti = event.target;
      if (!(desti instanceof Node) || !node.contains(desti)) return;
      if (typeof desti.closest === 'function' && desti.closest(ESC_ALIE)) return;
      if (desti.isContentEditable) return;
      if (ambDialegObert(node, arrel, node.ownerDocument)) return;
      pendent.current = null;
      const fet = fes(accio, { closca: node, desti, entorn: entorn.current, vista: ara });
      if (!fet) return;
      event.preventDefault();
      if (fet.carpeta || fet.fila !== undefined) {
        pendent.current = { ...fet, categoryId: ara.selection?.categoryId ?? null, ids: ara.crus };
      }
    };
    arrel.addEventListener('keydown', tecla);
    escolta.current = { node, lleva: () => arrel.removeEventListener('keydown', tecla) };
  });
  useEffect(() => () => {
    escolta.current?.lleva();
    escolta.current = null;
  }, []);

  return null;
}
