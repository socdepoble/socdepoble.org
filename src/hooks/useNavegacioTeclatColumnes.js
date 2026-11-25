/**
 * useNavegacioTeclatColumnes.js — IDEA-355 (Onada v1.2.25 · Lot G4)
 *
 * Navegació universal per teclat (↑ / ↓ / ← / → / Home / End) sobre qualsevol
 * pantalla muntada dins d'AppGridShell (#app-grid-sidebar, #app-grid-list,
 * #app-grid-main): /xat, /disseny, /notes, /wikidepoble, /multimedia, /control,
 * /consola i les 9 micro-apps amb ClosaAplicacio.
 *
 * Basat en `modern-web-guidance` (`spatial-navigation` + `accessibility`) i
 * 100 % compatible amb `IDEA-58` (`navegacioTeclat.js` a UniversalWorkspace):
 *   · Respecta sempre `event.defaultPrevented` (els manejadors específics de
 *     UniversalWorkspace i les graelles 2D [data-graella-teclat] tenen prioritat).
 *   · Travessa Shadow DOM / Web Component llegint `event.composedPath?.()[0]`.
 *   · Guarda d'or absoluta: mai captura tecles dins d'editors (TipTap / .ProseMirror,
 *     [contenteditable], :read-write), camps (<input>, <textarea>, <select>,
 *     textbox/combobox/searchbox/slider/spinbutton, ràdios natius), IME o
 *     diàlegs/menús oberts.
 *   · Fletxes verticals (↑/↓/Home/End) en columnes de llista: focus visible +
 *     `scrollIntoView({ block: 'nearest', inline: 'nearest' })` + activació en
 *     viu (.click()) per a files de llista de Columna 2 (converses del Xat,
 *     fitxes de micro-apps) o elements amb `data-teclat-viu="true"`.
 *   · Fletxes horitzontals (←/→): salt visible entre columnes obertes
 *     (#app-grid-sidebar ↔ #app-grid-list ↔ #app-grid-main), sense `preventDefault`
 *     si no hi ha columna destí disponible.
 */
import { useCallback } from 'react';

const TECLES_VERTICALS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End']);
const TECLES_HORITZONTALS = new Set(['ArrowLeft', 'ArrowRight']);
const INPUTS_SENSE_CURSOR = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'color']);
const ROLS_EDITABLES = new Set(['textbox', 'combobox', 'searchbox', 'slider', 'spinbutton']);
const SELECTOR_MODALS = 'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
const NO_DISPONIBLE = '[hidden], [inert], [aria-hidden="true"], dialog:not([open])';
const IDS_COLUMNES = Object.freeze(['app-grid-sidebar', 'app-grid-list', 'app-grid-main']);
/* GEM-13 · El peu de la columna de navegació (P1-71, `peuNavegacio`: la Barra
   de volums de /multimedia) porta les seues accions: les fletxes de l'arbre no
   hi entren ni ixen d'ell. No és ni origen ni destí del salt entre columnes. */
const SELECTOR_PEU_COLUMNA = '.sdp-workspace-column__peu';

const SELECTOR_ENFOCABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const SELECTOR_ITEMS_LLISTA = [
  '.sdp-gestor-fitxa',
  '.sdp-xat-fila',
  '[data-fila-teclat]',
  '.sdp-workspace-nav-item:not(.sdp-workspace-folder-toggle)',
  '.nav-item',
  '[role="option"]',
  '[role="tab"]',
  '[role="listitem"] > button:not([disabled])',
  '[role="listitem"] > a[href]',
  'li > button:not([disabled])',
  'li > a[href]'
].join(', ');

function disponible(el) {
  if (!el || el.nodeType !== 1 || !el.isConnected || el.disabled === true) return false;
  return !el.closest(NO_DISPONIBLE);
}

/**
 * Llig l'element origen real travessant Shadow DOM quan existix.
 */
export function origenRealDeTecla(event) {
  const natiu = event?.nativeEvent;
  const cami = typeof event?.composedPath === 'function'
    ? event.composedPath()
    : (typeof natiu?.composedPath === 'function' ? natiu.composedPath() : null);
  const primer = Array.isArray(cami) && cami.length > 0 ? cami[0] : event?.target;
  if (!primer) return null;
  return primer.nodeType === 1 ? primer : primer.parentElement || null;
}

/**
 * Guarda estricta contra interferències amb editors (TipTap / ProseMirror),
 * camps de formulari, ràdios natius, IME i capes modals/menús oberts.
 */
export function esOrigenEditableOModal(event) {
  if (!event || event.defaultPrevented) return true;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return true;
  if (event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) return true;

  const el = origenRealDeTecla(event);
  if (!el || el.nodeType !== 1) return true;

  if (el.closest(SELECTOR_MODALS)) return true;
  if (el.closest('.ProseMirror, .tiptap')) return true;
  if (el.matches('textarea, select')) return true;
  if (el.matches('input')) {
    if (!INPUTS_SENSE_CURSOR.has(el.type)) return true;
    if (el.type === 'radio') return true;
  }
  const editable = el.closest('[contenteditable]');
  if (editable && editable.getAttribute('contenteditable') !== 'false') return true;
  try {
    if (typeof el.matches === 'function' && el.matches(':read-write') && !el.matches('button, a, summary')) {
      return true;
    }
  } catch {
    /* jsdom o motors sense :read-write complet */
  }
  const rol = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
  if (ROLS_EDITABLES.has(rol)) return true;
  return false;
}

function columnesObertesDe(arrel) {
  if (!arrel?.querySelector) return [];
  return IDS_COLUMNES
    .map((id) => arrel.querySelector(`#${id}`))
    .filter((col) => col && col.getAttribute('data-obert') === 'true' && disponible(col));
}

function enfocaSuau(el) {
  if (!el || typeof el.focus !== 'function') return false;
  el.focus({ preventScroll: true });
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return true;
}

function destiDeColumna(columna) {
  if (!columna || !disponible(columna)) return null;
  const preferits = [
    columna.querySelector('[aria-current="true"]'),
    columna.querySelector('[aria-current="page"]'),
    columna.querySelector('[aria-selected="true"]'),
    columna.querySelector(SELECTOR_ITEMS_LLISTA),
    columna.querySelector(SELECTOR_ENFOCABLE),
    columna.querySelector('[tabindex="-1"]')
  ];
  return preferits.find((el) => el && disponible(el) && !el.closest(SELECTOR_PEU_COLUMNA)) || null;
}

function itemsDeColumna(columna) {
  if (!columna?.querySelectorAll) return [];
  const vist = new Set();
  const llista = [];
  for (const el of columna.querySelectorAll(SELECTOR_ITEMS_LLISTA)) {
    if (!vist.has(el) && disponible(el) && !el.closest('[data-graella-teclat]') && !el.closest(SELECTOR_PEU_COLUMNA)) {
      vist.add(el);
      llista.push(el);
    }
  }
  return llista;
}

function haDActivarEnViu(columna, desti) {
  if (!columna || !desti) return false;
  if (desti.getAttribute('data-teclat-viu') === 'false' || columna.getAttribute('data-teclat-viu') === 'false') {
    return false;
  }
  if (desti.getAttribute('data-teclat-viu') === 'true' || columna.getAttribute('data-teclat-viu') === 'true') {
    return true;
  }
  if (columna.id === 'app-grid-list') {
    return desti.matches('.sdp-gestor-fitxa, .sdp-xat-fila, [data-fila-teclat], [role="option"], li > button, li > a[href]');
  }
  return false;
}

/**
 * Manejador pur reutilitzable en proves i dins del hook `useNavegacioTeclatColumnes`.
 */
export function gestionaNavegacioTeclatColumnes(event, arrel) {
  if (!arrel) return false;
  const esVertical = TECLES_VERTICALS.has(event.key);
  const esHoritzontal = TECLES_HORITZONTALS.has(event.key);
  if (!esVertical && !esHoritzontal) return false;
  if (esOrigenEditableOModal(event)) return false;

  const origen = origenRealDeTecla(event);
  if (!origen || !arrel.contains(origen)) return false;
  if (origen.closest('[data-graella-teclat], [role="tablist"], [role="radiogroup"], [role="separator"], .sdp-gestor-llista, .sdp-workspace-groups, .sdp-workspace-rail')) {
    return false;
  }
  if (origen.closest(SELECTOR_PEU_COLUMNA)) return false;

  const columnes = columnesObertesDe(arrel);
  if (columnes.length === 0) return false;

  const idxColumna = columnes.findIndex((col) => col.contains(origen));
  if (idxColumna < 0) return false;
  const columnaActual = columnes[idxColumna];

  if (esHoritzontal) {
    const destiIdx = event.key === 'ArrowRight' ? idxColumna + 1 : idxColumna - 1;
    if (destiIdx < 0 || destiIdx >= columnes.length) return false;
    const objectiu = destiDeColumna(columnes[destiIdx]);
    if (!objectiu) return false;
    event.preventDefault();
    enfocaSuau(objectiu);
    return true;
  }

  // Fletxes verticals només en columnes de navegació o llistat (mai segrestem el scroll del detall #app-grid-main)
  if (columnaActual.id === 'app-grid-main') return false;

  const items = itemsDeColumna(columnaActual);
  if (items.length === 0) return false;
  const itemActual = items.find((item) => item === origen || item.contains(origen));
  const idxActual = itemActual ? items.indexOf(itemActual) : -1;
  if (idxActual < 0) return false;

  let idxNou = idxActual;
  if (event.key === 'ArrowDown') idxNou = Math.min(items.length - 1, idxActual + 1);
  else if (event.key === 'ArrowUp') idxNou = Math.max(0, idxActual - 1);
  else if (event.key === 'Home') idxNou = 0;
  else if (event.key === 'End') idxNou = items.length - 1;

  event.preventDefault();
  if (idxNou === idxActual) return true;

  const seguent = items[idxNou];
  enfocaSuau(seguent);
  if (haDActivarEnViu(columnaActual, seguent) && typeof seguent.click === 'function') {
    seguent.click();
    enfocaSuau(seguent);
  }
  return true;
}

/**
 * Hook universal per a AppGridShell: retorna un manejador React `onKeyDown`
 * perquè s'execute en fase de bombolla DESPRÉS dels gestors específics dels fills
 * (com `UniversalWorkspace` / IDEA-58 i les graelles 2D), respectant `defaultPrevented`.
 */
export function useNavegacioTeclatColumnes(arrelRef, { actiu = true } = {}) {
  return useCallback((event) => {
    if (!actiu) return;
    const arrel = arrelRef?.current || event?.currentTarget || null;
    gestionaNavegacioTeclatColumnes(event, arrel);
  }, [arrelRef, actiu]);
}
