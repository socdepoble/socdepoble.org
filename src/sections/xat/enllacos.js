/**
 * enllacos.js — troba les URL d'un missatge i les torna com a segments
 * (XAT-B05): text pla i enllaços amb el domini i l'avís de domini enganyós.
 *
 * Mai es construïx HTML: qui pinta rep un array i decidix els nodes. Així el
 * text d'una altra persona no s'injecta mai com a marcatge.
 */

const PATRO_URL = /https?:\/\/[^\s<>"'`]+/gi;
/* Puntuació que sol tancar una frase i no forma part de l'adreça. */
const PUNTUACIO_FINAL = /[.,;:!?)\]}]+$/;

/** Un domini amb etiquetes punycode («xn--») pot imitar-ne un altre. */
export function esHostSospitos(host) {
  return String(host || '').toLowerCase().split('.').some((part) => part.startsWith('xn--'));
}

/**
 * @param {string} text
 * @returns {Array<{tipus:'text', text:string} | {tipus:'enllac', text:string, href:string, host:string, sospitos:boolean}>}
 */
export function segmentaEnllacos(text) {
  const font = String(text ?? '');
  if (!font) return [];
  const segments = [];
  let ultim = 0;

  for (const coincidencia of font.matchAll(PATRO_URL)) {
    let brut = coincidencia[0];
    const inici = coincidencia.index;
    const cua = brut.match(PUNTUACIO_FINAL);
    if (cua) brut = brut.slice(0, brut.length - cua[0].length);

    let url;
    try {
      url = new URL(brut);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:' || !url.hostname) continue;

    if (inici > ultim) segments.push({ tipus: 'text', text: font.slice(ultim, inici) });
    segments.push({
      tipus: 'enllac',
      text: brut,
      href: url.href,
      host: url.hostname,
      sospitos: esHostSospitos(url.hostname)
    });
    ultim = inici + brut.length;
  }

  if (ultim < font.length) segments.push({ tipus: 'text', text: font.slice(ultim) });
  return segments;
}
