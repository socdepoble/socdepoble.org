/**
 * enllacos.js — troba les URL d'un missatge i les torna com a segments
 * (XAT-B05): text pla i enllaços amb el domini i l'avís de domini enganyós.
 *
 * Mai es construïx HTML: qui pinta rep un array i decidix els nodes. Així el
 * text d'una altra persona no s'injecta mai com a marcatge.
 */

const PATRO_URL = /https?:\/\/[^\s<>"'`]+/gi;
/* Puntuació que sol tancar una frase i no forma part de l'adreça. */
const PUNTUACIO_FINAL = '.,;:!?)]}';

/* Gauntlet 261025_0545 (RX-04) · L'adreça sense la puntuació del final, des
   del final cap arrere. L'expressió d'abans (/[.,;:!?)\]}]+$/, sense àncora a
   l'esquerra) tornava a recórrer des de cada punt una tira que no acaba
   l'adreça: quadràtic, i cada bombolla i cada tecla de la cerca ho pagaven. */
function senseCua(brut) {
  let fi = brut.length;
  while (fi > 0 && PUNTUACIO_FINAL.includes(brut[fi - 1])) fi -= 1;
  return brut.slice(0, fi);
}

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
    const brut = senseCua(coincidencia[0]);
    const inici = coincidencia.index;

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

/* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · La ruta interna d'un
   document de la Wiki de Poble, tal com la cita la IAIA local
   (data/iaiaLocal.js · rutaDeDocumentWiki): «/wikidepoble?item=<slug>», a
   l'inici del text o darrere d'un espai, i mai acabada en punt. */
const PATRO_RUTA_WIKI = /(^|\s)(\/wikidepoble\?item=[\w.~%-]*[\w~%-])/g;

/**
 * Parteix els segments de text de `segments` (els de segmentaEnllacos) on hi
 * ha una ruta de la Wiki de Poble, que passa a ser un segment
 * { tipus: 'ruta', text, ruta }. Els enllaços externs no es toquen. Funció
 * pura; només la demana la bombolla de la IAIA MarIA.
 */
export function segmentaRutesDeLaWiki(segments) {
  return (Array.isArray(segments) ? segments : []).flatMap((segment) => {
    if (segment?.tipus !== 'text') return [segment];
    const parts = [];
    let ultim = 0;
    for (const coincidencia of segment.text.matchAll(PATRO_RUTA_WIKI)) {
      const inici = coincidencia.index + coincidencia[1].length;
      const ruta = coincidencia[2];
      if (inici > ultim) parts.push({ tipus: 'text', text: segment.text.slice(ultim, inici) });
      parts.push({ tipus: 'ruta', text: ruta, ruta });
      ultim = inici + ruta.length;
    }
    if (!parts.length) return [segment];
    if (ultim < segment.text.length) parts.push({ tipus: 'text', text: segment.text.slice(ultim) });
    return parts;
  });
}
