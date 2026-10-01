/**
 * traductor.js — El Traductor Sobirà (ordre del Mestre, 260930 · via B).
 *
 * Client NEUTRE del servei de traducció que oferix l'amfitrió. No sap res del
 * proveïdor (DeepL) ni de l'amfitrió (WordPress): només el contracte acordat
 * amb Codex (auditoria 260930_2150, ronda D1, que accepta el lot proposat a
 * l'auditoria 260930_2145 amb dues esmenes):
 *   POST {url}  { textos: string[], desti, origen: 'CA', format: 'text'|'html' }
 *   200 → { traduccions: string[], origen: 'CA', desti, cache: boolean }
 *   error → { code, message, data: { status } }, el format de WP REST.
 * Esmena 1 de Codex: servei públic amb pressupost al servidor, sense nonce ni
 * galetes (credentials: 'omit'). Esmena 2: l'URL arriba per externalConfig
 * (traductorUrl), i no hi ha cap traductor-nonce.
 * La clau i l'URL del proveïdor no ixen mai del servidor: ací no n'hi ha cap.
 * Si demà un altre amfitrió (Sollutia) oferix el mateix contracte, n'hi ha
 * prou de canviar l'URL (Model B). La vista tria el missatge pel codi, mai
 * pel text del servidor (errorsBackend.js).
 */
import { CODI_BACKEND_INABASTABLE } from './errorsBackend.js';

export const ORIGEN_TRADUCCIO = 'CA';

/* La llista TANCADA de destins: el servidor rebutja qualsevol altre valor.
   `cap` és com ho diu una frase («Traduint al castellà…») i `lang` va a
   l'atribut lang del text traduït (lector de pantalla, guionat). */
export const LLENGUES_TRADUCCIO = Object.freeze([
  Object.freeze({ codi: 'ES', nom: 'Castellà', cap: 'al castellà', lang: 'es' }),
  Object.freeze({ codi: 'EN-GB', nom: 'Anglés', cap: 'a l’anglés', lang: 'en-GB' }),
  Object.freeze({ codi: 'FR', nom: 'Francés', cap: 'al francés', lang: 'fr' }),
  Object.freeze({ codi: 'DE', nom: 'Alemany', cap: 'a l’alemany', lang: 'de' }),
]);

export const llenguaDeTraduccio = (codi) => LLENGUES_TRADUCCIO.find((llengua) => llengua.codi === codi) || null;

/* Els límits del servidor per petició (wordpress-plugin/includes/traduccio.php,
   ronda D1): 50 textos, 5000 caràcters Unicode i 20000 bytes de text entre
   tots, i 32768 bytes de cos JSON (ací, amb marge per a la resta del cos).
   `lots`: les peticions seguides que una pàgina pot gastar. El servidor
   compta 30 peticions cada 10 minuts per client i 10000 caràcters al dia:
   `caractersPagina` és eixe pressupost diari. Una pàgina més llarga no es
   traduïx a mitges ni s'emporta el pressupost de tot el poble (ronda C9-2:
   4 lots de 5000 en permetien 20000, el doble del que el servidor dona). */
export const LIMITS_TRADUCCIO = Object.freeze({
  textos: 50, caracters: 5000, bytes: 20000, json: 32000, lots: 4, caractersPagina: 10000
});

const FORMATS = new Set(['text', 'html']);

/** Codis neutrals dels errors. Van a `error.codi`; la vista hi posa el missatge. */
export const CODI_TRADUCCIO = Object.freeze({
  NO_DISPONIBLE: 'traduccio-no-disponible',
  PETICIO_INVALIDA: 'traduccio-peticio-invalida',
  MASSA_LLARGA: 'traduccio-massa-llarga',
  SERVIDOR: 'traduccio-servidor',
  RESPOSTA_INVALIDA: 'traduccio-resposta-invalida',
  INABASTABLE: CODI_BACKEND_INABASTABLE,
  CANCELLADA: 'traduccio-cancellada',
});

/** Error tipat: `codi` (CODI_TRADUCCIO), `status` HTTP i `codiServidor`
 *  (el `code` de WP REST, p. ex. 'sdp_traduccio_limit'). El missatge és el
 *  codi: cap text del servidor ni del proveïdor puja cap a la vista. */
export class ErrorTraductor extends Error {
  constructor(codi, { status = null, codiServidor = null, cause } = {}) {
    super(codi);
    this.name = 'ErrorTraductor';
    this.codi = codi;
    this.status = status;
    this.codiServidor = codiServidor;
    if (cause !== undefined) this.cause = cause;
  }
}

/** Caràcters Unicode (punts de codi), com els compta el servidor (preg_match_all('/./us')). */
export const caractersDe = (text) => Array.from(String(text)).length;

/** Bytes UTF-8, sense dependre de TextEncoder. */
export function bytesDe(text) {
  let bytes = 0;
  for (const car of String(text)) {
    const cp = car.codePointAt(0);
    bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/**
 * L'URL del servei si és del MATEIX origen que la pàgina (http o https, sense
 * credencials a l'URL); si no, ''. Res de fetch a dominis externs: la guarda
 * de configAmfitrio (Codex) ja ho filtra, i esta és la segona porta.
 */
export function urlDeServei(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const lloc = globalThis.location;
  try {
    const adreca = new URL(url.trim(), lloc?.href);
    if (adreca.protocol !== 'https:' && adreca.protocol !== 'http:') return '';
    if (adreca.username || adreca.password) return '';
    if (lloc?.origin && adreca.origin !== lloc.origin) return '';
    return adreca.href;
  } catch {
    return '';
  }
}

/**
 * Parteix un text massa llarg per a una sola petició en trossos de com a molt
 * `maxim` caràcters, tallant en un espai si n'hi ha cap. Un text curt torna tal qual.
 */
export function partixText(text, maxim = LIMITS_TRADUCCIO.caracters) {
  const punts = Array.from(String(text));
  if (punts.length <= maxim) return [String(text)];
  const trossos = [];
  let inici = 0;
  while (inici < punts.length) {
    let fi = Math.min(inici + maxim, punts.length);
    if (fi < punts.length) {
      const espai = punts.lastIndexOf(' ', fi - 1);
      if (espai > inici) fi = espai + 1;
    }
    trossos.push(punts.slice(inici, fi).join(''));
    inici = fi;
  }
  return trossos;
}

/**
 * Agrupa els textos en lots que respecten els límits del servidor, en ordre.
 * null si un text tot sol no hi cap (qui crida l'ha de partir abans).
 */
export function partixEnLots(textos, limits = LIMITS_TRADUCCIO) {
  const lots = [];
  let lot = [];
  let caracters = 0;
  let bytes = 0;
  let json = 0;
  for (const text of textos) {
    const c = caractersDe(text);
    const b = bytesDe(text);
    const j = bytesDe(JSON.stringify(text)) + 1;
    if (c > limits.caracters || b > limits.bytes || j > limits.json) return null;
    if (lot.length && (lot.length >= limits.textos || caracters + c > limits.caracters
      || bytes + b > limits.bytes || json + j > limits.json)) {
      lots.push(lot);
      lot = [];
      caracters = 0;
      bytes = 0;
      json = 0;
    }
    lot.push(text);
    caracters += c;
    bytes += b;
    json += j;
  }
  if (lot.length) lots.push(lot);
  return lots;
}

const esAvortament = (error, signal) => error?.name === 'AbortError' || signal?.aborted === true;

/**
 * creaTraductor({ url, fetch }) → { disponible, tradueix(textos, desti, { format, signal }) }.
 * Sense URL vàlida (socdepoble.org, sense amfitrió que oferisca el servei),
 * `disponible` és false i `tradueix` llança NO_DISPONIBLE sense cap petició.
 * `tradueix` fa UNA petició (un lot) i valida la resposta: mateix ordre i
 * mateixa longitud que `textos`, només cadenes, i el mateix destí.
 */
export function creaTraductor({ url, fetch: fetchPropi } = {}) {
  const adreca = urlDeServei(url);
  /* El fetch global es llig en cada petició, no en crear el client: el client
     viu en un useMemo i un fetch substituït després (proves, un polyfill)
     no s'ha de quedar vell. */
  const fer = (opcions) => (fetchPropi ? fetchPropi(adreca, opcions) : globalThis.fetch(adreca, opcions));
  const disponible = Boolean(adreca && (fetchPropi || typeof globalThis.fetch === 'function'));

  async function tradueix(textos, desti, { format = 'text', signal } = {}) {
    if (!disponible) throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
    const valids = Array.isArray(textos) && textos.length > 0 && textos.length <= LIMITS_TRADUCCIO.textos
      && textos.every((text) => typeof text === 'string');
    if (!valids || !llenguaDeTraduccio(desti) || !FORMATS.has(format)) {
      throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
    }
    let resposta;
    try {
      resposta = await fer({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ textos, desti, origen: ORIGEN_TRADUCCIO, format }),
        // Esmena 1 de Codex (D1): públic, sense galetes ni nonce de WordPress.
        credentials: 'omit',
        cache: 'no-store',
        signal,
      });
    } catch (error) {
      if (esAvortament(error, signal)) throw new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA, { cause: error });
      throw new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0, cause: error });
    }
    let cos = null;
    try {
      cos = await resposta.json();
    } catch (error) {
      if (esAvortament(error, signal)) throw new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA, { cause: error });
      cos = null;
    }
    if (!resposta.ok) {
      throw new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, {
        status: resposta.status,
        codiServidor: typeof cos?.code === 'string' ? cos.code : null,
      });
    }
    const traduccions = cos?.traduccions;
    const bona = Array.isArray(traduccions) && traduccions.length === textos.length
      && traduccions.every((text) => typeof text === 'string')
      && (cos.desti === undefined || cos.desti === desti);
    if (!bona) throw new ErrorTraductor(CODI_TRADUCCIO.RESPOSTA_INVALIDA, { status: resposta.status });
    return { traduccions: [...traduccions], desti, cache: cos.cache === true };
  }

  return Object.freeze({ disponible, tradueix });
}

/**
 * Traduïx tots els textos d'una pàgina amb el mínim de peticions, una darrere
 * de l'altra: el servidor respon 503 «ocupat» a dos lots alhora del mateix
 * client. Un text massa llarg es parteix i es torna a ajuntar. Si la pàgina
 * passa de `limits.caractersPagina` caràcters o necessita més de
 * `limits.lots` peticions, MASSA_LLARGA sense cap petició.
 * La primera fallada ho para tot: mai es torna una traducció a mitges.
 */
export async function tradueixTot(traductor, textos, desti, { signal, limits = LIMITS_TRADUCCIO } = {}) {
  const total = textos.reduce((suma, text) => suma + caractersDe(text), 0);
  if (Number.isFinite(limits.caractersPagina) && total > limits.caractersPagina) {
    throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
  }
  const peces = [];
  const mapa = [];
  for (const text of textos) {
    const trossos = partixText(text, limits.caracters);
    mapa.push([peces.length, trossos.length]);
    peces.push(...trossos);
  }
  const lots = partixEnLots(peces, limits);
  if (!lots) throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
  if (lots.length > limits.lots) throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
  const eixida = [];
  for (const lot of lots) {
    const { traduccions } = await traductor.tradueix(lot, desti, { format: 'text', signal });
    eixida.push(...traduccions);
  }
  return mapa.map(([inici, quants]) => (quants === 1
    ? eixida[inici]
    : eixida.slice(inici, inici + quants).map((tros) => tros.trim()).join(' ')));
}
