/**
 * enllacos.js — troba les URL d'un missatge i les torna com a segments
 * (XAT-B05): text pla i enllaços amb el domini i l'avís de domini enganyós.
 *
 * Mai es construïx HTML: qui pinta rep un array i decidix els nodes. Així el
 * text d'una altra persona no s'injecta mai com a marcatge.
 *
 * Gauntlet del Bloc B (QA-B01..B03, onada 261029_1605) · Les adreces i les
 * marques de la negreta (IDEA-53, negreta.js) ixen d'una sola tokenització,
 * tokenitzaText: una passada d'esquerra a dreta, lineal i sense cap expressió
 * amb retrocés. Una adreça és una peça opaca, mai s'hi busquen marques, i
 * l'asterisc del final només és de la negreta si en tanca una d'oberta.
 * L'enllaç de la bombolla, la cita, la previa de la llista i l'extracte de
 * la cerca diuen, així, el mateix.
 */

const PATRO_URL = /https?:\/\/[^\s<>"'`]+/gi;
/* Puntuació que sol tancar una frase i no forma part de l'adreça. */
const PUNTUACIO_FINAL = '.,;:!?)]}';

/* IDEA-53 (pla 261029_1605, Bloc B) · Les marques de la negreta, a l'estil
   WhatsApp (`*text*` i `**text**`): una tira d'exactament un o dos asteriscs.
   La d'obertura va a l'inici o darrere d'una vora (cap lletra, número, marca,
   asterisc ni SUBSTITUT) i la seguix un caràcter que no és espai ni «)]}».
   La de tancament té l'amplada de l'oberta, no va darrere d'un espai ni de
   «([{» i la seguix el final o una vora. Mai travessa un salt de línia. */

/** Un enllaç dins del text virtual de negreta.js (segmentaNegreta): un
    caràcter d'ús privat que compta com a part d'una paraula, igual que una
    adreça dins del text cru. Es construïx pel seu punt de codi (U+E000): el
    caràcter cru no es veu al codi font. */
export const SUBSTITUT = String.fromCharCode(0xe000);
const NO_VORA = /[\p{L}\p{N}\p{M}*]/u;
const ESPAI = /\s/u;
const TANCA_GRUP = ')]}';
const OBRI_GRUP = '([{';

const esVora = (c) => c === undefined || (c !== SUBSTITUT && !NO_VORA.test(c));
const esBuit = (c) => c === undefined || ESPAI.test(c);
const esAlt = (c) => c !== undefined && c >= '\uD800' && c <= '\uDBFF';
const esBaix = (c) => c !== undefined && c >= '\uDC00' && c <= '\uDFFF';
/* El caràcter sencer (punt de codi) d'abans de `i` i el de `j`: una lletra
   de fora del pla bàsic (𝐀, 𠀋) també és de paraula, no una vora. */
const anterior = (font, i) => (esBaix(font[i - 1]) && esAlt(font[i - 2]) ? font.slice(i - 2, i) : font[i - 1]);
const seguent = (font, j) => (esAlt(font[j]) && esBaix(font[j + 1]) ? font.slice(j, j + 2) : font[j]);

/** Un domini amb etiquetes punycode («xn--») pot imitar-ne un altre. */
export function esHostSospitos(host) {
  return String(host || '').toLowerCase().split('.').some((part) => part.startsWith('xn--'));
}

/* Quantes tires d'exactament `amplada` asteriscs té brut[0, fi): una volta. */
function tiresDAmplada(brut, fi, amplada) {
  let tires = 0;
  let i = 0;
  while (i < fi) {
    if (brut[i] !== '*') {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < fi && brut[j] === '*') j += 1;
    if (j - i === amplada) tires += 1;
    i = j;
  }
  return tires;
}

/* L'adreça d'una coincidència de PATRO_URL, o null si no és una adreça web.
   Gauntlet 261025_0545 (RX-04) · La puntuació del final no és de l'adreça:
   es lleva des del final cap arrere, en temps lineal (l'expressió d'abans,
   sense àncora a l'esquerra, era quadràtica).
   Gauntlet del Bloc B (QA-B01, QA-B02) · Els asteriscs de la cua són de
   l'adreça, llevat d'un o dos que tanquen una negreta d'eixa amplada oberta
   abans (`obertes[amplada]`): «https://example.test/search?q=foo*» es queda
   sencera i «**https://example.test/**» tanca la negreta sense absorbir
   «**». Com el parèntesi de GFM, tampoc no es lleva el que s'aparella amb
   un altre de dins de l'adreça: en «*mira https://a.b/?q=*x* ara*», «*x*»
   és de l'adreça i la negreta tanca després d'«ara». Se'n lleva com a molt
   un tancament. Davant seu queda l'adreça (de paraula) o un signe de
   PUNTUACIO_FINAL, i darrere un altre signe, un espai o el final: és el
   mateix tancament que veurà la passada de tokenitzaText. */
function adrecaDe(brut, obertes) {
  let fi = brut.length;
  let tancada = false;
  while (fi > 0) {
    const c = brut[fi - 1];
    if (PUNTUACIO_FINAL.includes(c)) {
      fi -= 1;
    } else if (c === '*' && !tancada) {
      let k = fi - 1;
      while (brut[k - 1] === '*') k -= 1;
      const tira = Math.min(fi - k, 2);
      const amplada = obertes[tira] ? tira : Number(Boolean(obertes[1]));
      if (!amplada || tiresDAmplada(brut, fi - amplada, amplada) % 2 === 1) break;
      /* QA-R2-06 · Si el que es llevaria inclou el primer asterisc de la tira
         i una tira senar de barres l'escapa, no tanca res: és de l'adreça.
         Una volta cap arrere per les barres, una sola vegada. */
      if (fi - amplada === k) {
        let b = k;
        while (b > 0 && brut[b - 1] === '\\') b -= 1;
        if ((k - b) % 2 === 1) break;
      }
      fi -= amplada;
      tancada = true;
    } else {
      break;
    }
  }
  const text = brut.slice(0, fi);
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:' || !url.hostname) return null;
  return { text, href: url.href, host: url.hostname, sospitos: esHostSospitos(url.hostname) };
}

/**
 * Gauntlet del Bloc B (QA-B01..B03) · La tokenització única del text d'un
 * missatge: les adreces web i les marques de la negreta, en una sola passada
 * d'esquerra a dreta. Lineal: cada caràcter es mira una vegada, i PATRO_URL
 * (una classe repetida sense res darrere) no fa retrocés.
 *   · Una adreça és una peça opaca de paraula: mai es busquen marques dins
 *     d'ella (`?q=*x*` es queda sencera) i, al seu costat, compta com una
 *     lletra (com SUBSTITUT al text virtual de segmentaNegreta).
 *   · L'asterisc del final d'una adreça només és de la negreta si en tanca
 *     una d'oberta (adrecaDe).
 * @param {string} text
 * @param {boolean} [ambAdreces=true] false: només les marques (el text
 *   virtual de segmentaNegreta, on cada enllaç ja és SUBSTITUT)
 * @returns {{
 *   adreces: Array<{ inici: number, text: string, href: string, host: string, sospitos: boolean }>,
 *   marques: Array<{ obre: number, tanca: number, amplada: 1|2 }>
 * }} índexs UTF-16; les marques, ordenades i sense solapar-se
 */
export function tokenitzaText(text, ambAdreces = true) {
  const font = String(text ?? '');
  const adreces = [];
  const marques = [];
  /* On comença l'obertura pendent de cada amplada (-1: cap). */
  let obert1 = -1;
  let obert2 = -1;
  /* On acaba l'última adreça: una tira just darrere la té davant, i és de paraula. */
  let finalDAdreca = -1;
  /* QA-R2-06 · Quantes barres invertides seguides hi ha just abans de `i`:
     es compta en la mateixa passada (cap mirada arrere), i torna a 0 amb
     qualsevol altre caràcter, una adreça, una tira d'asteriscs o un salt. */
  let barres = 0;
  const candidates = ambAdreces ? font.matchAll(PATRO_URL) : null;
  let candidata = candidates ? candidates.next().value : undefined;
  let i = 0;
  while (i < font.length) {
    while (candidata && candidata.index < i) candidata = candidates.next().value;
    if (candidata && candidata.index === i) {
      const adreca = adrecaDe(candidata[0], [false, obert1 >= 0, obert2 >= 0]);
      candidata = candidates.next().value;
      if (adreca) {
        adreces.push({ inici: i, ...adreca });
        i += adreca.text.length;
        finalDAdreca = i;
        barres = 0;
        continue;
      }
      /* Una coincidència que no és una adreça web és text, caràcter a caràcter. */
    }
    const c = font[i];
    if (c === '\n') {
      obert1 = -1;
      obert2 = -1;
      barres = 0;
      i += 1;
      continue;
    }
    if (c !== '*') {
      barres = c === '\\' ? barres + 1 : 0;
      i += 1;
      continue;
    }
    let j = i + 1;
    while (font[j] === '*') j += 1;
    /* QA-R2-06 (criteri del prompt 2258: escapes «\*») · Una tira SENAR de
       barres escapa el primer asterisc: és text, no obri ni tanca res, i la
       resta de la tira (si n'hi ha) el té davant, com una lletra. Una tira
       PARELL no escapa: les barres són text i l'asterisc fa el de sempre. Les
       barres es pinten tal qual: no es canvia el text de ningú. */
    const escapat = barres % 2 === 1;
    barres = 0;
    const inici = escapat ? i + 1 : i;
    const amplada = j - inici;
    if (amplada >= 1 && amplada <= 2) {
      const abans = escapat ? '*' : (i === finalDAdreca ? SUBSTITUT : anterior(font, i));
      const despres = seguent(font, j);
      const obert = amplada === 1 ? obert1 : obert2;
      if (obert >= 0 && !esBuit(abans) && !OBRI_GRUP.includes(abans) && esVora(despres)) {
        marques.push({ obre: obert, tanca: inici, amplada });
        obert1 = -1;
        obert2 = -1;
      } else if (obert < 0 && esVora(abans) && !esBuit(despres) && !TANCA_GRUP.includes(despres)) {
        if (amplada === 1) obert1 = inici;
        else obert2 = inici;
      }
    }
    i = j;
  }
  return { adreces, marques };
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

  for (const { inici, text: adreca, href, host, sospitos } of tokenitzaText(font).adreces) {
    if (inici > ultim) segments.push({ tipus: 'text', text: font.slice(ultim, inici) });
    segments.push({ tipus: 'enllac', text: adreca, href, host, sospitos });
    ultim = inici + adreca.length;
  }

  if (ultim < font.length) segments.push({ tipus: 'text', text: font.slice(ultim) });
  return segments;
}

/* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · La ruta interna d'un
   document de la Wiki de Poble, tal com la cita la IAIA local
   (data/iaiaLocal.js · rutaDeDocumentWiki): «/wikidepoble?item=<slug>», a
   l'inici del text o darrere d'un espai, i mai acabada en punt.
   IDEA-56 (pla 261029_1605, Bloc F.2) · I les rutes de les seccions que cita
   l'Atles de la IAIA (data/iaiaLocal.js · RUTA_INTERNA, la mateixa llista
   tancada; enllacos.test.js les compara): una fitxa de poble, una pàgina, o
   una secció. Acaben en un blanc, al final, o en puntuació de frase seguida
   d'un blanc o del final: «/mercat.» fa enllaç a /mercat i deixa el punt;
   «/xat/123», «/mercatx», «/mercat?x=1» o «/mercat*» es queden en text. Cap
   «*» ni cap salt de línia dins de la ruta (negreta.js la tracta com a peça
   opaca). Lineal: només comença en una «/» darrere d'un blanc. */
const PATRO_RUTA_WIKI = /(^|\s)(\/wikidepoble\?item=[\w.~%-]*[\w~%-]|\/(?:pobles\/[a-z0-9-]+|page\/[a-z0-9_-]+|projecte|constitucio|anima|roadmap|versions|fedivers|xat|mur|mercat|pobles|notes|multimedia|javillinares|rentonar)(?=$|\s|[.,;:!](?=\s|$)))/g;

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
