/**
 * negreta.js — la negreta del xat (IDEA-53, pla 261029_1605, Bloc B), en
 * funcions pures, sense React ni DOM.
 *
 *   · marquesDeNegreta: on són les negretes d'un text, a l'estil WhatsApp:
 *     `*text*` i `**text**`. L'asterisc d'obertura va a l'inici o darrere
 *     d'un caràcter que no és lletra, número ni asterisc, i el seguix un
 *     caràcter que no és espai ni «)]}». El de tancament no va darrere d'un
 *     espai ni de «([{», i el seguix el final o un caràcter que no és lletra,
 *     número ni asterisc. Mai travessa un salt de línia. Una tira de tres o
 *     més asteriscs és text. Lineal: cap expressió regular amb retrocés.
 *     Així «2 * 3 = 6», «2*3*4», «a*b», «* element» i «petons :*» no canvien.
 *     QA-R2-06 · Un asterisc darrere d'una tira senar de barres invertides
 *     («\*hola*») és text: no obri ni tanca; darrere d'una parell, sí. Les
 *     barres es pinten tal qual.
 *     Gauntlet del Bloc B (QA-B01..B03) · La passada és tokenitzaText
 *     (enllacos.js), la mateixa que troba les adreces: mai hi ha cap marca
 *     dins d'una adreça, tampoc a la cita, la previa ni la cerca.
 *   · segmentaNegreta: els segments d'enllacos.js (text, enllaç, ruta) en
 *     trams { negreta, segments }. Els asteriscs només es busquen als
 *     segments de text: un enllaç és una peça opaca i pot anar dins d'una
 *     negreta («*Inscripcions: https://…*»), però mai se'n busquen dins.
 *   · senseMarquesDeNegreta: el text sense les marques que fan negreta (la
 *     previa de la llista, la cita, l'anunci en viu i la cerca).
 *   · commutaNegreta: el que fan [N] i Cmd/Ctrl+B al compositor, amb el
 *     comportament literal del pla (decisió de l'orquestrador, a ratificar
 *     pel Mestre): amb selecció, l'embolica amb `*…*` o la desembolica si ja
 *     era negreta, i la selecció queda sobre el mateix text; sense selecció,
 *     insereix `**` amb el cursor al mig. Cap embolcall automàtic de paraula.
 *   · esDreceraDeNegreta: Cmd+B o Ctrl+B, el que diu el títol del botó.
 *
 * Cap HTML: qui pinta rep trams i decidix els nodes (<strong> de React).
 */

import { SUBSTITUT, tokenitzaText } from './enllacos.js';

/* Gauntlet del Bloc B (QA-B01..B03, onada 261029_1605) · Les regles de les
   marques i la passada que les troba viuen a enllacos.js (tokenitzaText):
   és la mateixa que hi troba les adreces, i una adreça és una peça opaca on
   mai es busquen marques. Ací queda el que necessita el compositor. */
const ESPAI = /\s/u;
const esAlt = (c) => c !== undefined && c >= '\uD800' && c <= '\uDBFF';
const esBaix = (c) => c !== undefined && c >= '\uDC00' && c <= '\uDFFF';

/**
 * @param {string} text
 * @returns {Array<{ obre: number, tanca: number, amplada: 1|2 }>} on comença
 *   la marca d'obertura, on comença la de tancament i quants asteriscs fa
 *   cada una (índexs UTF-16). Ordenades i sense solapar-se. Gauntlet del
 *   Bloc B (QA-B03) · Mai dins d'una adreça: «https://example.test/?q=*x*»
 *   no en té cap, i «**https://example.test/**» en té una que l'embolica.
 */
export function marquesDeNegreta(text) {
  const font = String(text ?? '');
  return font.includes('*') ? tokenitzaText(font).marques : [];
}

/* El tros [desde, fins) de `text` sense les marques de les regions que hi
   cauen senceres. */
function senseMarquesEntre(text, regions, desde, fins) {
  let eixida = '';
  let ultim = desde;
  for (const { obre, tanca, amplada } of regions) {
    if (obre < desde || tanca + amplada > fins) continue;
    eixida += text.slice(ultim, obre) + text.slice(obre + amplada, tanca);
    ultim = tanca + amplada;
  }
  return eixida + text.slice(ultim, fins);
}

/** El text sense les marques que fan negreta; la resta, tal qual. */
export function senseMarquesDeNegreta(text) {
  const font = String(text ?? '');
  const regions = marquesDeNegreta(font);
  return regions.length ? senseMarquesEntre(font, regions, 0, font.length) : font;
}

/**
 * Els segments (segmentaEnllacos / segmentaRutesDeLaWiki) en trams seguits
 * amb la mateixa negreta. Sense cap negreta, un sol tram amb els mateixos
 * objectes (el DOM de sempre).
 * @returns {Array<{ negreta: boolean, segments: Array<object> }>}
 */
export function segmentaNegreta(segments) {
  const llista = Array.isArray(segments) ? segments.filter(Boolean) : [];
  if (!llista.length) return [];
  let virtual = '';
  const inicis = [];
  for (const segment of llista) {
    inicis.push(virtual.length);
    virtual += segment.tipus === 'text' ? String(segment.text ?? '') : SUBSTITUT;
  }
  /* Les adreces ja són SUBSTITUT: la mateixa passada, només amb les marques. */
  const regions = virtual.includes('*') ? tokenitzaText(virtual, false).marques : [];
  if (!regions.length) return [{ negreta: false, segments: llista }];
  /* Cada posició del text virtual: 0 normal, 1 negreta, 2 marca (no es pinta). */
  const estat = new Uint8Array(virtual.length);
  for (const { obre, tanca, amplada } of regions) {
    estat.fill(2, obre, obre + amplada);
    estat.fill(1, obre + amplada, tanca);
    estat.fill(2, tanca, tanca + amplada);
  }
  const trams = [];
  const afig = (negreta, segment) => {
    const darrer = trams.at(-1);
    if (darrer && darrer.negreta === negreta) darrer.segments.push(segment);
    else trams.push({ negreta, segments: [segment] });
  };
  llista.forEach((segment, k) => {
    const inici = inicis[k];
    if (segment.tipus !== 'text') {
      afig(estat[inici] === 1, segment);
      return;
    }
    const text = String(segment.text ?? '');
    let tros = '';
    let negretaDelTros = null;
    for (let p = 0; p < text.length; p += 1) {
      const quin = estat[inici + p];
      if (quin === 2) continue;
      const negreta = quin === 1;
      if (negretaDelTros !== null && negreta !== negretaDelTros) {
        afig(negretaDelTros, { tipus: 'text', text: tros });
        tros = '';
      }
      negretaDelTros = negreta;
      tros += text[p];
    }
    if (tros) afig(negretaDelTros, { tipus: 'text', text: tros });
  });
  return trams;
}

/* ───────────────────────────── Compositor ───────────────────────────── */

const posicio = (text, n) => (Number.isInteger(n) ? Math.min(Math.max(n, 0), text.length) : text.length);
/* Mai partir una parella subrogada (🍅 són dues unitats UTF-16): l'inici
   recula fins a la parella sencera i el final avança. */
const partida = (text, n) => esBaix(text[n]) && esAlt(text[n - 1]);
const alineaAvall = (text, n) => (partida(text, n) ? n - 1 : n);
const alineaAmunt = (text, n) => (partida(text, n) ? n + 1 : n);

/* [a, b) sense espais (ni salts) a les vores. */
function senseEspaisALesVores(text, a, b) {
  let x = a;
  let y = b;
  while (x < y && ESPAI.test(text[x])) x += 1;
  while (y > x && ESPAI.test(text[y - 1])) y -= 1;
  return [x, y];
}

/* Separa la cua d'espais d'un tros: [sense, cua]. */
function separaCua(tros) {
  let fi = tros.length;
  while (fi > 0 && ESPAI.test(tros[fi - 1])) fi -= 1;
  return [tros.slice(0, fi), tros.slice(fi)];
}

/* Separa el cap d'espais d'un tros: [cap, sense]. */
function separaCap(tros) {
  let inici = 0;
  while (inici < tros.length && ESPAI.test(tros[inici])) inici += 1;
  return [tros.slice(0, inici), tros.slice(inici)];
}

/* La regió (negreta) on cau sencer [a, b), marques incloses, o null. */
const regioQueConte = (regions, a, b) => regions.find((r) => r.obre <= a && b <= r.tanca + r.amplada) ?? null;

/**
 * El canvi d'un tros d'una línia [a, b) (sense espais a les vores, a < b):
 * { desde, fins, nou, selInici, selFi } — el tros [desde, fins) del text
 * passa a ser `nou`, i la selecció queda a [desde + selInici, desde + selFi).
 *   · Dins d'una sola negreta: si la cobrix tota (el contingut o sencera), la
 *     desfà; si només n'és un tros, el trau de la negreta i la resta hi queda.
 *   · Si no: l'embolica amb `*…*`, estesa a les negretes que toca (que s'hi
 *     fonen: una negreta dins d'una altra no es pinta).
 */
function canviDelTros(text, regions, a, b) {
  const r = regioQueConte(regions, a, b);
  if (r) {
    const marca = '*'.repeat(r.amplada);
    const ci = r.obre + r.amplada;
    const cf = r.tanca;
    const x = Math.max(a, ci);
    const y = Math.min(b, cf);
    if (x >= y || (x <= ci && y >= cf)) {
      return { desde: r.obre, fins: cf + r.amplada, nou: text.slice(ci, cf), selInici: 0, selFi: cf - ci };
    }
    const [esquerra, cuaEsquerra] = separaCua(text.slice(ci, x));
    const [capDreta, dreta] = separaCap(text.slice(y, cf));
    const abans = esquerra ? `${marca}${esquerra}${marca}${cuaEsquerra}` : cuaEsquerra;
    const despres = dreta ? `${capDreta}${marca}${dreta}${marca}` : capDreta;
    const mig = text.slice(x, y);
    return { desde: r.obre, fins: cf + r.amplada, nou: abans + mig + despres, selInici: abans.length, selFi: abans.length + mig.length };
  }
  let desde = a;
  let fins = b;
  for (const regio of regions) {
    if (regio.obre < b && regio.tanca + regio.amplada > a) {
      desde = Math.min(desde, regio.obre);
      fins = Math.max(fins, regio.tanca + regio.amplada);
    }
  }
  const nucli = senseMarquesEntre(text, regions, desde, fins);
  return { desde, fins, nou: `*${nucli}*`, selInici: 1, selFi: 1 + nucli.length };
}

/* Aplica canvis ordenats i sense solapar-se. */
function aplica(text, canvis) {
  let eixida = '';
  let ultim = 0;
  for (const { desde, fins, nou } of canvis) {
    eixida += text.slice(ultim, desde) + nou;
    ultim = fins;
  }
  return eixida + text.slice(ultim);
}

/**
 * [N] o Cmd/Ctrl+B sobre `valor` amb la selecció [inici, fi). Torna
 * { valor, inici, fi } (el text i la selecció que queden) o null si el
 * resultat passaria de `limit`.
 *   Sense selecció (o només amb espais): insereix `**` amb el cursor al mig
 *   (al final de la selecció d'espais). Tornar a prémer sobre la parella
 *   buida (`*|*`) la lleva.
 *   Amb selecció: si ja és negreta la desfà (o en trau el tros triat); si no,
 *   l'embolica amb `*…*` (línia a línia si n'hi ha més d'una: la negreta no
 *   travessa salts; si totes ja ho eren, les desfà). La selecció queda sobre
 *   el text, sense marques: tornar a prémer desfà.
 */
export function commutaNegreta(valor, inici, fi, limit = Infinity) {
  const text = String(valor ?? '');
  const brutInici = posicio(text, inici);
  const brutFi = posicio(text, Number.isInteger(fi) ? fi : inici);
  /* Un cursor dins d'una parella subrogada recula i continua sent un cursor
     (mai una selecció de l'emoticona). */
  const desde = alineaAvall(text, Math.min(brutInici, brutFi));
  const fins = brutInici === brutFi ? desde : alineaAmunt(text, Math.max(brutInici, brutFi));
  const cap = (nou) => (nou.length > limit ? null : nou);
  const [a, b] = senseEspaisALesVores(text, desde, fins);

  if (a === b) {
    const p = fins;
    if (text[p - 1] === '*' && text[p] === '*' && text[p - 2] !== '*' && text[p + 1] !== '*') {
      return { valor: text.slice(0, p - 1) + text.slice(p + 1), inici: p - 1, fi: p - 1 };
    }
    const nou = cap(`${text.slice(0, p)}**${text.slice(p)}`);
    return nou === null ? null : { valor: nou, inici: p + 1, fi: p + 1 };
  }

  const regions = marquesDeNegreta(text);
  if (!text.slice(a, b).includes('\n')) {
    const canvi = canviDelTros(text, regions, a, b);
    const nou = cap(aplica(text, [canvi]));
    return nou === null ? null : { valor: nou, inici: canvi.desde + canvi.selInici, fi: canvi.desde + canvi.selFi };
  }

  /* Diverses línies, cada una sense espais a les vores. Si totes ja són
     negreta, es desfan (o se'n trau el tros triat); si no, s'emboliquen les
     que encara no ho són i les altres no es toquen. */
  const linies = [];
  let p = a;
  for (const linia of text.slice(a, b).split('\n')) {
    const [x, y] = senseEspaisALesVores(text, p, p + linia.length);
    if (x < y) linies.push({ x, y, negreta: Boolean(regioQueConte(regions, x, y)) });
    p += linia.length + 1;
  }
  const totes = linies.every((linia) => linia.negreta);
  const tocades = linies.filter((linia) => totes || !linia.negreta);
  const canvis = tocades.map(({ x, y }) => canviDelTros(text, regions, x, y));
  const nou = cap(aplica(text, canvis));
  if (nou === null) return null;
  /* La selecció, sobre el text: comença on comença el de la primera línia i
     acaba on acaba el de l'última (sense les marques de fora). */
  const primer = tocades[0] === linies[0] ? canvis[0] : null;
  const darrer = tocades.at(-1) === linies.at(-1) ? canvis.at(-1) : null;
  const deltaAbansDelDarrer = canvis.slice(0, -1).reduce((suma, c) => suma + c.nou.length - (c.fins - c.desde), 0);
  return {
    valor: nou,
    inici: primer ? primer.desde + primer.selInici : a,
    fi: darrer ? darrer.desde + deltaAbansDelDarrer + darrer.selFi : b + nou.length - text.length
  };
}

/* ───────────────────────────── La drecera ───────────────────────────── */

/**
 * Cmd+B o Ctrl+B (una de les dues, no totes dues), com diu el títol del botó
 * («Negreta (⌘B / Ctrl+B)»). Ni Maj (Ctrl+Maj+B és la barra d'adreces
 * d'interés), ni Alt (AltGr és Ctrl+Alt a Windows). Una B de qualsevol
 * disposició: e.key, o e.code === 'KeyB' quan la tecla no és una lletra
 * llatina (ciríl·lic, grec). No mira e.repeat: qui crida consumix també la
 * repetició.
 */
export function esDreceraDeNegreta(e) {
  if (!e || e.altKey || e.shiftKey) return false;
  if (Boolean(e.metaKey) === Boolean(e.ctrlKey)) return false;
  const tecla = String(e.key ?? '');
  return tecla.toLowerCase() === 'b' || (!/^[a-z]$/i.test(tecla) && e.code === 'KeyB');
}
