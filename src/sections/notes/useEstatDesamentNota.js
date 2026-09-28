/* ═══════════════════════════════════════════════════════════════════
   T47b (ordre del Mestre, 260928) · LA PLOMA A NOTES

   L'estat de desament d'una nota (GlobalSaveManager) llegit amb
   useSyncExternalStore, i traduït a la prop `estatDesament` = { estat,
   detall } que UniversalEditorShell pinta amb EstatDesament (skill
   sdp-universal-editor §1): la ploma apareix amb canvis pendents i
   desapareix quan el servidor ho ha confirmat.

   'sessio' es pinta com a 'pendent': dins de Notes la persona és dins
   de la sessió de React, i el desat ix sol quan la sessió es renova o
   el Bloc torna a carregar. No és «cal tornar a entrar».
   ═══════════════════════════════════════════════════════════════════ */
import { useCallback, useSyncExternalStore } from 'react';
import { bgSaveManager } from './GlobalSaveManager.js';

const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]), pestanya: false });

/* Com es diu cada camp en una frase («El servidor encara no pot guardar …»).
   T47 (ordre del Mestre, 260928) · També els de text: la ploma no diu mai el
   nom intern d'un camp. */
const NOMS_CAMPS = Object.freeze({
  title: 'el títol',
  subtitle: 'el subtítol',
  lead: 'l’entradilla',
  content: 'el cos',
  icon: 'l’emoticona',
  copyright: 'els drets d’autor',
  heroImage: 'la imatge de capçalera',
  logoImage: 'la imatge del títol',
  folderId: 'la carpeta',
  categories: 'les categories',
  tags: 'les etiquetes',
  /* T40 (ordre del Mestre, 260928) · columna opcional publish_date (D2). */
  publishDate: 'la data de publicació',
});
function llista(noms) {
  if (noms.length < 2) return noms.join('');
  return `${noms.slice(0, -1).join(', ')} i ${noms.at(-1)}`;
}

/** Els noms de persona dels camps; els que no en tenen es compten, però no es nomenen. */
function nomsDels(camps) {
  const noms = [...new Set(camps.filter(camp => Object.hasOwn(NOMS_CAMPS, camp)).map(camp => NOMS_CAMPS[camp]))];
  const altres = camps.filter(camp => !Object.hasOwn(NOMS_CAMPS, camp)).length;
  if (altres === 1) noms.push(noms.length ? 'un altre camp' : 'un camp de la nota');
  else if (altres > 1) noms.push(noms.length ? 'altres camps' : 'alguns camps de la nota');
  return llista(noms);
}

/* T47 (ordre del Mestre, 260928) · Sense IndexedDB (Firefox 100–114 en privat)
   el gestor guarda l'esborrany en memòria: la ploma no pot dir «dispositiu». */
export const DETALL_PESTANYA = 'Este navegador no deixa guardar còpia en el dispositiu: fins que el servidor confirme el desat, el canvi només es guarda en esta pestanya.';
const lloc = (pestanya) => (pestanya ? 'només es guarda en esta pestanya' : 'es guarda en este dispositiu');

/** { estat, problema, quarantena, pestanya } del gestor → { estat, detall } per a la barra taronja.
 * `conflicte`: la nota s'ha obert amb un esborrany D01 (draftConflict) que el
 * gestor encara no ha tocat; no és «tot desat», espera una decisió (T47). */
export function estatPerAlEditor(desament = NET, { conflicte = false } = {}) {
  const { estat = 'net', problema = null, quarantena = [], pestanya = false } = desament;
  if (problema?.tipus === 'temporal') {
    const motiu = problema.missatge ? ` (${problema.missatge})` : '';
    return { estat: 'error', detall: `No s’ha pogut desar${motiu}. Es tornarà a provar sol; mentrestant, el canvi ${lloc(pestanya)}.` };
  }
  if (problema?.tipus === 'conflicte' || (conflicte && estat === 'net')) {
    return { estat: 'error', detall: `Hi ha una versió més recent d’esta nota. El teu esborrany ${lloc(pestanya)} fins que tries quina vols conservar.` };
  }
  if (problema?.tipus === 'local') return { estat: 'error', detall: problema.missatge };
  if (problema?.tipus === 'validacio') return { estat: 'error', detall: `${problema.missatge} El canvi ${lloc(pestanya)}.` };
  if (problema && problema.tipus !== 'sessio') {
    return { estat: 'error', detall: `No s’ha pogut desar: ${problema.missatge}. El canvi ${lloc(pestanya)}.` };
  }
  if (estat === 'sessio') return { estat: 'pendent', detall: pestanya ? DETALL_PESTANYA : '' };
  if (estat === 'error' && quarantena.length) {
    return { estat: 'error', detall: `El servidor encara no pot guardar ${nomsDels(quarantena)}: ${lloc(pestanya)}.` };
  }
  if (pestanya && (estat === 'pendent' || estat === 'enviant')) return { estat, detall: DETALL_PESTANYA };
  return { estat, detall: '' };
}

/** L'estat de desament de la nota `id` en l'àmbit `scope`; sense tots dos, net. */
export function useEstatDesamentNota(scope, id, gestor = bgSaveManager) {
  const actiu = scope != null && scope !== '' && id != null;
  const subscriu = useCallback((oient) => gestor.subscriu(oient), [gestor]);
  const llig = useCallback(() => (actiu ? gestor.estat(scope, id) : NET), [gestor, actiu, scope, id]);
  return useSyncExternalStore(subscriu, llig, llig);
}
