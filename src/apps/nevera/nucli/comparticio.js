/**
 * La Nevera de Casa · compartir una llista de la compra (`sdp.nevera.llista.v1`), pur.
 *
 * R16-F (arreglat segons la revisió del 261110, G3-09) · Dues formes del
 * mateix paquet, que la persona envia per on vol (ací no hi ha cap xarxa):
 *   · el fitxer: { esquema: 'sdp.nevera.llista.v1', titol, linies: [{ articleId?, nom, especificacio }] }
 *   · l'enllaç: <ruta>#compartida=<base64url de { v: 1, t, l: [[articleId, nom, especificacio]] }>.
 *     Va al fragment (#) i no a la consulta (?): el navegador no l'envia mai
 *     al servidor, i el que porta la llista no queda en cap registre.
 * Llegir-los és JSON.parse i una llista blanca: cap eval, cap HTML, cap clau
 * desconeguda. Noms i especificacions passen per netejaText amb els LIMITS
 * del nucli, i un paquet porta com a molt LIMITS.linies línies, sense
 * repetits. Un article del catàleg (de base o de botiga) viatja pel seu id i,
 * en rebre'l, mana el nom del catàleg i no el que diga el paquet: la
 * previsualització mostra exactament el que s'afegirà. Els propis viatgen
 * pel nom. Fusionar no xafa res: el que ja és a la llista s'hi queda tal com
 * està, especificació inclosa.
 */
import { ARTICLES_BASE, ARTICLES_PRODUCTES } from './cataleg.js';
import { LIMITS, afig, afigPerNom, articlePerId, articlePerNom, clauDeNom, llistaPerId, netejaText } from './nevera.js';

export const ESQUEMA_LLISTA_COMPARTIDA = 'sdp.nevera.llista.v1';
export const PREFIX_FRAGMENT_COMPARTIDA = '#compartida=';
/** El text més llarg que s'accepta: un fitxer de 300 línies plenes no hi arriba. */
export const MAX_TEXT_COMPARTIT = 131072;
/** El testimoni més llarg d'un enllaç. Una llista més llarga es comparteix amb el fitxer. */
export const MAX_TESTIMONI_ENLLAC = 32768;

const CATALEG = new Map([...ARTICLES_BASE, ...ARTICLES_PRODUCTES].map((article) => [article.id, article]));
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const falla = (codi) => ({ ok: false, codi });

/* Una línia rebuda (d'un fitxer, d'un enllaç o de la vista) per la llista blanca, o null. */
function liniaRebuda(cru) {
  if (!esObjecte(cru)) return null;
  const especificacio = netejaText(cru.especificacio, LIMITS.especificacio);
  const deCataleg = typeof cru.articleId === 'string' ? CATALEG.get(cru.articleId) : undefined;
  if (deCataleg) return { articleId: deCataleg.id, nom: deCataleg.nom, especificacio };
  const nom = netejaText(cru.nom, LIMITS.nom);
  return nom ? { articleId: null, nom, especificacio } : null;
}

/* El paquet: les línies netes, sense repetits (per id o pel nom) i com a molt LIMITS.linies. */
function paquetDe(titol, crues, neteja) {
  const linies = [];
  const vistes = new Set();
  for (const cru of crues) {
    if (linies.length >= LIMITS.linies) break;
    const linia = neteja(cru);
    if (!linia) continue;
    const clau = linia.articleId ? `id:${linia.articleId}` : `nom:${clauDeNom(linia.nom)}`;
    if (vistes.has(clau)) continue;
    vistes.add(clau);
    linies.push(Object.freeze(linia));
  }
  return Object.freeze({ esquema: ESQUEMA_LLISTA_COMPARTIDA, titol: netejaText(titol, LIMITS.nom), linies: Object.freeze(linies) });
}

function aBase64Url(text) {
  let binari = '';
  for (const octet of new TextEncoder().encode(text)) binari += String.fromCharCode(octet);
  return btoa(binari).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Llança si el testimoni no és base64 o el text no és UTF-8: qui la crida ho torna 'format'. */
function deBase64Url(testimoni) {
  const base64 = testimoni.replace(/-/g, '+').replace(/_/g, '/');
  const binari = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binari, (caracter) => caracter.charCodeAt(0)));
}

/**
 * El paquet d'una llista de l'estat, amb el nom de cada article (també dels
 * propis, que només coneix este estat). null si la llista no existix.
 */
export function exportaLlistaCompra(estat, llistaId) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) return null;
  return paquetDe(llista.nom, llista.linies, (linia) => {
    const article = articlePerId(estat, linia.articleId);
    if (!article) return null;
    return {
      articleId: CATALEG.has(article.id) ? article.id : null,
      nom: article.nom,
      especificacio: netejaText(linia.especificacio, LIMITS.especificacio)
    };
  });
}

/** El text del fitxer: JSON amb sagnat i un salt final. */
export function serialitzaLlistaCompartida(paquet) {
  const linies = paquet.linies.map(({ articleId, nom, especificacio }) => (articleId ? { articleId, nom, especificacio } : { nom, especificacio }));
  return `${JSON.stringify({ esquema: ESQUEMA_LLISTA_COMPARTIDA, titol: paquet.titol, linies }, null, 2)}\n`;
}

/**
 * L'enllaç: `ruta` (sense fragment) i el paquet al fragment. Un article del
 * catàleg hi va només amb l'id; les cel·les buides del final no hi van.
 * @returns {{ ok: true, url: string } | { ok: false, codi: 'massa-llarga' }}
 */
export function enllacLlistaCompartida(paquet, ruta) {
  const l = paquet.linies.map(({ articleId, nom, especificacio }) => {
    const fila = articleId ? [articleId, '', especificacio] : ['', nom, especificacio];
    while (fila.length && fila[fila.length - 1] === '') fila.pop();
    return fila;
  });
  const testimoni = aBase64Url(JSON.stringify({ v: 1, t: paquet.titol, l }));
  if (testimoni.length > MAX_TESTIMONI_ENLLAC) return falla('massa-llarga');
  return { ok: true, url: `${String(ruta).split('#')[0]}${PREFIX_FRAGMENT_COMPARTIDA}${testimoni}` };
}

/**
 * Llig el que ha rebut la persona: el text d'un fitxer, un enllaç sencer, el
 * fragment (#compartida=…) o el testimoni sol.
 * @returns {{ ok: true, paquet: object }
 *         | { ok: false, codi: 'buit' | 'massa-gran' | 'format' | 'sense-articles' }}
 */
export function importaLlistaCompra(text) {
  if (typeof text !== 'string' || text.trim() === '') return falla('buit');
  const net = text.trim();
  if (net.length > MAX_TEXT_COMPARTIT) return falla('massa-gran');
  let cru;
  try {
    if (net.startsWith('{')) {
      cru = JSON.parse(net);
    } else {
      const inici = net.indexOf(PREFIX_FRAGMENT_COMPARTIDA);
      const testimoni = inici >= 0 ? net.slice(inici + PREFIX_FRAGMENT_COMPARTIDA.length) : net;
      if (!BASE64URL.test(testimoni)) return falla('format');
      cru = JSON.parse(deBase64Url(testimoni));
    }
  } catch {
    return falla('format');
  }
  let paquet = null;
  if (esObjecte(cru) && cru.esquema === ESQUEMA_LLISTA_COMPARTIDA && Array.isArray(cru.linies)) {
    paquet = paquetDe(cru.titol, cru.linies, liniaRebuda);
  } else if (esObjecte(cru) && cru.v === 1 && Array.isArray(cru.l)) {
    const files = cru.l.map((fila) => (Array.isArray(fila) ? { articleId: fila[0], nom: fila[1], especificacio: fila[2] } : null));
    paquet = paquetDe(cru.t, files, liniaRebuda);
  }
  if (!paquet) return falla('format');
  return paquet.linies.length ? { ok: true, paquet } : falla('sense-articles');
}

/**
 * Afig a la llista `llistaId` les línies del paquet que encara no hi són,
 * amb les mateixes operacions que «Necessite…». El que ja hi és es conserva
 * (també la seua especificació); el que no hi cap (els límits de la llista o
 * dels propis) es descarta sencer, sense deixar cap article propi orfe.
 * @returns {{ estat: object, afegits: number, conservats: number, descartats: number }}
 */
export function fusionaLlistaCompartida(estat, llistaId, paquet) {
  const resum = { afegits: 0, conservats: 0, descartats: 0 };
  if (!llistaPerId(estat, llistaId) || !esObjecte(paquet) || !Array.isArray(paquet.linies)) return { estat, ...resum };
  let actual = estat;
  for (const linia of paquetDe('', paquet.linies, liniaRebuda).linies) {
    const abans = llistaPerId(actual, llistaId).linies;
    const article = linia.articleId ? articlePerId(actual, linia.articleId) : articlePerNom(actual, linia.nom);
    if (article && abans.some((fila) => fila.articleId === article.id)) {
      resum.conservats += 1;
      continue;
    }
    const opcions = linia.especificacio ? { especificacio: linia.especificacio } : {};
    const seguent = article ? afig(actual, llistaId, article.id, opcions) : afigPerNom(actual, llistaId, linia.nom, opcions);
    if (llistaPerId(seguent, llistaId).linies.length > abans.length) {
      actual = seguent;
      resum.afegits += 1;
    } else {
      resum.descartats += 1;
    }
  }
  return { estat: actual, ...resum };
}
