/**
 * deteccioLecturaVeu.js · IDEA-255 (Onada R23) · Detector lleuger per saber si
 * el cos muntat a PageFrame és una pàgina de lectura amb prosa real (articles,
 * pàgines de sistema, fitxes del Mur, Wiki, presentacions d'eines…) i no un
 * editor TipTap, un directori de pestanyes ni una consola d'administració.
 *
 * Viu en un mòdul minúscul sense dependències pesades perquè PageFrame no
 * arrossegue el reproductor ni el servei de veu al paquet d'entrada abans del
 * primer clic de la persona lectora.
 */

export const SELECTOR_EXCLOS_VEU = [
  'button', 'select', 'textarea', 'input', 'script', 'style', 'template', 'svg', 'audio', 'video', 'form', 'nav', 'details',
  '[hidden]', '[aria-hidden="true"]', '.sr-only', '.sdp-sr-only', '.sdp-nomes-lector',
  '[contenteditable]:not([contenteditable="false"])', '.ProseMirror', '.sdp-editor-eines',
  '.sdp-targetes', '.sdp-pagina-accio', '.sdp-veu-lectura-marc', '.sdp-barra-veu',
  '[data-sdp-no-locutar]', '.pou-neu-card', '.sdp-joc-parla', '.sdp-refranyer', '.sdp-banc-veus',
  '.sdp-compra', '.sdp-admin-taxonomia', '.sdp-consola',
  '.sdp-pestanyes', '[role="tabpanel"]', '[role="alert"]', '[role="status"]', 'dialog:not([open])',
  '[data-sdp-e2ee]:not([data-sdp-e2ee="false"])', '[data-e2ee="true"]', '[data-privat="true"]', '[data-sdp-privat="true"]',
].join(', ');

const SELECTOR_PROSA_COS = 'p, blockquote, li, dd';
const MIN_CARACTERS_PROSA = 12;

function dinsDExclos(node, arrel) {
  for (let actual = node; actual && actual !== arrel; actual = actual.parentElement) {
    if (actual.matches?.(SELECTOR_EXCLOS_VEU)) return true;
  }
  return false;
}

/**
 * Torna `true` quan `cosNode` és en mode lectura i conté prosa editorial fora
 * de `.page-intro`, targetes incrustades, formularis, alertes o pestanyes.
 */
export function teProsaDeLectura(cosNode, { enEdicio = false } = {}) {
  if (!cosNode || enEdicio) return false;
  if (cosNode.querySelector?.('[contenteditable]:not([contenteditable="false"]), .ProseMirror, .sdp-editor-eines, nav[aria-label="Territori"]')) {
    return false;
  }
  const candidats = cosNode.querySelectorAll?.(SELECTOR_PROSA_COS);
  if (!candidats || candidats.length === 0) return false;
  for (const node of candidats) {
    if (node.closest?.('.page-intro')) continue;
    if (node.closest?.('section')?.querySelector?.('[data-viquipedia]')) continue;
    if (dinsDExclos(node, cosNode)) continue;
    const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_CARACTERS_PROSA) return true;
  }
  return false;
}
