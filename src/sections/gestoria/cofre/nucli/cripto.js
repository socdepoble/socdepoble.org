/**
 * cripto.js — el nucli criptogràfic del cofre de la Gestoria.
 *
 * Onada 6, ordre del Mestre (261009): «seguretat 1000x1000». Factures i dades
 * bancàries de la vida personal i del projecte: si viuen al navegador, viuen
 * xifrades. JS pur sobre WebCrypto natiu, sense cap dependència: sense DOM,
 * React, emmagatzematge ni xarxa. L'objecte `cripto` (subtle i
 * getRandomValues) s'injecta sempre; ningú d'ací el pren de cap global.
 *
 * El disseny és de sobre:
 *   · KDF: PBKDF2-HMAC-SHA-256 de 600.000 iteracions, sal aleatòria de 16 B i
 *     paràmetres versionats { v: 1, kdf, iter, sal }. Argon2id no és a
 *     WebCrypto: si arriba, serà una v2 dins del mateix camp de versió.
 *   · KEK: AES-KW-256 derivada, NO extraïble; només embolcalla i
 *     desembolcalla.
 *   · DEK: AES-GCM-256 aleatòria, embolcallada dues vegades: amb la KEK de la
 *     frase de pas i amb la KEK d'un codi de recuperació de 128 bits (base32 en
 *     grups de 4, que la pantalla mostra una sola vegada). La DEK de treball es
 *     desembolcalla NO extraïble i viu només en memòria.
 *   · Registres: IV aleatori de 12 B per a cada xifrat, AAD
 *     'sdp.gestoria.cofre.v1|<col·lecció>|<id>' (un registre no es pot canviar
 *     de lloc) i text en clar farcit fins a múltiples de 4 KiB (la mida no diu
 *     res del contingut).
 *   · Una frase errònia fa fallar el desembolcallat d'AES-KW (la comprovació
 *     d'integritat de l'RFC 3394): error controlat i res desxifrat.
 * La frase es normalitza en NFC: «caçà» escrit en dos teclats és la mateixa
 * clau. Els bytes secrets (frase i codi) es posen a zero en acabar.
 */

export const VERSIO_COFRE = 1;
export const KDF = 'PBKDF2-HMAC-SHA-256';
export const ITERACIONS_KDF = 600000;
/* El sòl de les iteracions: el valor de producció. Les proves el poden
   abaixar (opció del cofre) per a no esperar, mai per davall d'este mínim. */
export const MIN_ITERACIONS_PROVES = 1000;
const MAX_ITERACIONS = 10000000;
export const BYTES_SAL = 16;
export const BYTES_IV = 12;
export const BYTES_CODI = 16;
/* AES-KW d'una clau de 32 B: 32 + 8 de la comprovació d'integritat. */
export const BYTES_DEK_EMBOLCALLADA = 40;
export const BLOC_FARCIT = 4096;
export const MAX_BYTES_VALOR = 16 * 1024 * 1024;
export const PREFIX_AAD = 'sdp.gestoria.cofre.v1';
export const MIN_CARACTERS = 12;
export const MIN_PARAULES = 4;
const MIN_DIFERENTS = 5;
const MAX_CARACTERS = 1024;

/* Un error amb codi estable, perquè la pantalla decidisca què diu. */
export function errorAmbCodi(codi, missatge) {
  const error = new Error(missatge);
  error.codi = codi;
  return error;
}

const codifica = (text) => new TextEncoder().encode(text);

/** n bytes aleatoris del generador del sistema. */
export function aleatori(cripto, n) {
  return cripto.getRandomValues(new Uint8Array(n));
}

/* ── Base64 (estàndard, amb farciment) ─────────────────────────────────── */

const ALFABET_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const FORMA_B64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** Bytes → base64. */
export function aBase64(bytes) {
  const trossos = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : null;
    const c = i + 2 < bytes.length ? bytes[i + 2] : null;
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    trossos.push(ALFABET_B64[(n >> 18) & 63] + ALFABET_B64[(n >> 12) & 63]
      + (b === null ? '=' : ALFABET_B64[(n >> 6) & 63]) + (c === null ? '=' : ALFABET_B64[n & 63]));
  }
  return trossos.join('');
}

/**
 * Base64 → bytes. Llança TypeError si el text no és base64 canònic: forma,
 * farciment i bits sobrers a zero («AB==» no val per «AA==»).
 */
export function deBase64(text) {
  if (typeof text !== 'string' || !FORMA_B64.test(text)) throw new TypeError('No és un text en base64.');
  const farciment = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  // L'últim caràcter amb dades porta 4 (amb «==») o 2 (amb «=») bits sobrers, sempre zero.
  const sobrers = farciment === 2 ? 15 : farciment === 1 ? 3 : 0;
  if (sobrers && (ALFABET_B64.indexOf(text[text.length - farciment - 1]) & sobrers) !== 0) {
    throw new TypeError('El base64 no és canònic: els bits sobrers no són zero.');
  }
  const bytes = new Uint8Array((text.length / 4) * 3 - farciment);
  let j = 0;
  for (let i = 0; i < text.length; i += 4) {
    const n = (ALFABET_B64.indexOf(text[i]) << 18) | (ALFABET_B64.indexOf(text[i + 1]) << 12)
      | ((text[i + 2] === '=' ? 0 : ALFABET_B64.indexOf(text[i + 2])) << 6) | (text[i + 3] === '=' ? 0 : ALFABET_B64.indexOf(text[i + 3]));
    if (j < bytes.length) bytes[j++] = (n >> 16) & 255;
    if (j < bytes.length) bytes[j++] = (n >> 8) & 255;
    if (j < bytes.length) bytes[j++] = n & 255;
  }
  return bytes;
}

/* ── Codi de recuperació: 128 bits en base32, en grups de 4 ────────────── */

const ALFABET_B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CARACTERS_CODI = 26;
/* Les confusions de lectura: el base32 no té 0, 1 ni 8. */
const CONFUSIONS = Object.freeze({ 0: 'O', 1: 'I', 8: 'B' });

/** 16 bytes → «ABCD-EFGH-…-XY» (26 caràcters en grups de 4). */
export function codiDeBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== BYTES_CODI) throw new TypeError(`El codi són ${BYTES_CODI} bytes.`);
  let valor = 0;
  let bits = 0;
  let eixida = '';
  for (const byte of bytes) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      eixida += ALFABET_B32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
    valor &= (1 << bits) - 1;
  }
  if (bits > 0) eixida += ALFABET_B32[(valor << (5 - bits)) & 31];
  return eixida.match(/.{1,4}/g).join('-');
}

/**
 * El codi tal com l'escriu la persona (minúscules, espais i guions
 * admesos) → 16 bytes. CODI_INVALID si no té la forma d'un codi.
 */
export function bytesDelCodi(text) {
  const net = typeof text === 'string'
    ? text.toUpperCase().replace(/[\s-]/g, '').replace(/[018]/g, (c) => CONFUSIONS[c])
    : '';
  if (net.length !== CARACTERS_CODI || [...net].some((c) => !ALFABET_B32.includes(c))) {
    throw errorAmbCodi('CODI_INVALID', `El codi de recuperació són ${CARACTERS_CODI} lletres i xifres, en grups de 4 (ABCD-EFGH-…).`);
  }
  const bytes = new Uint8Array(BYTES_CODI);
  let valor = 0;
  let bits = 0;
  let j = 0;
  for (const c of net) {
    valor = (valor << 5) | ALFABET_B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      if (j < BYTES_CODI) bytes[j++] = (valor >>> (bits - 8)) & 255;
      bits -= 8;
    }
    valor &= (1 << bits) - 1;
  }
  // Els 2 bits sobrers del final són sempre zero: si no ho són, hi ha una lletra mal copiada.
  if (valor !== 0) throw errorAmbCodi('CODI_INVALID', 'El codi de recuperació no és correcte: revisa l’última lletra.');
  return bytes;
}

/* ── La frase de pas ───────────────────────────────────────────────────── */

/*
 * La llargària «efectiva»: cada tram de caràcters iguals o consecutius
 * (aaa, 1234, abc, 1212, cba) compta com a molt 2. «123456789012» en fa 4 i
 * «aaa bbb ccc ddd», 11; una frase normal quasi no en perd cap (la «ll» de
 * «vella» continua comptant 2).
 */
function llargariaEfectiva(caracters) {
  let total = 0;
  let tram = 0;
  let anterior = null;
  for (const c of caracters) {
    const punt = c.codePointAt(0);
    tram = anterior !== null && Math.abs(punt - anterior) <= 1 ? tram + 1 : 1;
    if (tram <= 2) total += 1;
    anterior = punt;
  }
  return total;
}

/**
 * La frase de pas avaluada: és vàlida amb 12 caràcters o 4 paraules (de 3
 * lletres o més), almenys 5 caràcters diferents i sense ser previsible
 * (seqüències i repeticions com «123456789012» o «aaa bbb ccc ddd»). Una
 * paraula que només és un tram de caràcters iguals o consecutius («aaa»,
 * «abc») no compta. El mínim és de compatibilitat amb l'encàrrec; el nivell és
 * un indicador senzill, sense pretensions de mesurar l'entropia.
 * @param {string} frase
 * @returns {{ valida: boolean, nivell: 'buida'|'curta'|'repetida'|'previsible'|'llarga'|'justa'|'bona'|'molt-bona',
 *   caracters: number, paraules: number, motiu: string }}
 */
export function avaluaFrase(frase) {
  const text = typeof frase === 'string' ? frase.normalize('NFC') : '';
  const caracters = [...text].length;
  const paraules = (text.match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((paraula) => llargariaEfectiva([...paraula.toLowerCase()]) >= 3).length;
  const efectius = llargariaEfectiva([...text.toLowerCase()]);
  const diferents = new Set(text).size;
  const torna = (valida, nivell, motiu) => Object.freeze({ valida, nivell, caracters, paraules, motiu });
  if (caracters === 0) return torna(false, 'buida', 'Escriu una frase de pas.');
  if (caracters > MAX_CARACTERS) return torna(false, 'llarga', `Com a molt ${MAX_CARACTERS} caràcters.`);
  if (caracters < MIN_CARACTERS && paraules < MIN_PARAULES) {
    return torna(false, 'curta', `Massa curta: almenys ${MIN_CARACTERS} caràcters o ${MIN_PARAULES} paraules.`);
  }
  if (diferents < MIN_DIFERENTS) return torna(false, 'repetida', 'Repetix massa caràcters: barreja’n més de diferents.');
  if (efectius < MIN_CARACTERS && paraules < MIN_PARAULES) {
    return torna(false, 'previsible', 'Massa previsible: evita seqüències (1234, abcd) i repeticions (aaa, 1212).');
  }
  if (efectius >= 24 || paraules >= 6) return torna(true, 'molt-bona', 'Molt bona.');
  if (efectius >= 16 || paraules >= 5) return torna(true, 'bona', 'Bona.');
  return torna(true, 'justa', 'Justa: una paraula més la faria més forta.');
}

/** La frase, si és vàlida; si no, CONTRASENYA_FEBLE amb el motiu. */
export function exigixFrase(frase) {
  if (typeof frase !== 'string') throw new TypeError('La frase de pas és un text.');
  const avaluacio = avaluaFrase(frase);
  if (!avaluacio.valida) throw errorAmbCodi('CONTRASENYA_FEBLE', avaluacio.motiu);
  return frase;
}

/* ── KDF, KEK i DEK ────────────────────────────────────────────────────── */

/** Paràmetres nous per a una KEK: versió, KDF, iteracions i sal aleatòria. */
export function nousParametres(cripto, iter = ITERACIONS_KDF) {
  return { v: VERSIO_COFRE, kdf: KDF, iter, sal: aleatori(cripto, BYTES_SAL) };
}

/**
 * Els paràmetres desats d'una KEK ({ v, kdf, iter, sal, dek } en base64),
 * comprovats: versió i KDF coneguts, iteracions entre el mínim i el màxim,
 * sal de 16 B i DEK embolcallada de 40 B. PARAMETRES_DESCONEGUTS si no.
 * @returns {{ v: number, kdf: string, iter: number, sal: Uint8Array, dek: Uint8Array }}
 */
export function llegixParametres(desats, { minIteracions = ITERACIONS_KDF } = {}) {
  const falla = (que) => errorAmbCodi('PARAMETRES_DESCONEGUTS', `Els paràmetres del cofre no són vàlids (${que}).`);
  if (!desats || typeof desats !== 'object') throw falla('falten');
  if (desats.v !== VERSIO_COFRE || desats.kdf !== KDF) throw falla('versió o KDF');
  if (!Number.isSafeInteger(desats.iter) || desats.iter < minIteracions || desats.iter > MAX_ITERACIONS) throw falla('iteracions');
  let sal;
  let dek;
  try {
    sal = deBase64(desats.sal);
    dek = deBase64(desats.dek);
  } catch {
    throw falla('base64');
  }
  if (sal.length !== BYTES_SAL || dek.length !== BYTES_DEK_EMBOLCALLADA) throw falla('mides');
  return { v: desats.v, kdf: desats.kdf, iter: desats.iter, sal, dek };
}

/** Els paràmetres i la DEK embolcallada, en la forma que es desa (base64). */
export const parametresDesats = (parametres, dekEmbolcallada) => Object.freeze({
  v: parametres.v, kdf: parametres.kdf, iter: parametres.iter, sal: aBase64(parametres.sal), dek: aBase64(dekEmbolcallada)
});

/* PBKDF2 → AES-KW-256 no extraïble. `secret` són bytes: es posen a zero en acabar. */
async function derivaKek(cripto, secret, { iter, sal }) {
  try {
    const base = await cripto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey']);
    return await cripto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iter },
      base, { name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  } finally {
    secret.fill(0);
  }
}

/** La KEK d'una frase de pas (normalitzada en NFC). */
export function kekDeFrase(cripto, frase, parametres) {
  if (typeof frase !== 'string') return Promise.reject(new TypeError('La frase de pas és un text.'));
  return derivaKek(cripto, codifica(frase.normalize('NFC')), parametres);
}

/** La KEK dels 16 bytes d'un codi de recuperació (no toca els bytes de qui crida). */
export function kekDelCodi(cripto, codi, parametres) {
  return derivaKek(cripto, Uint8Array.from(codi), parametres);
}

/**
 * Una DEK nova: AES-GCM-256 aleatòria. És EXTRAÏBLE només perquè s'ha
 * d'embolcallar; qui la crea l'embolcalla, la deixa caure i treballa amb la
 * còpia desembolcallada, que no ho és.
 */
export function generaDek(cripto) {
  return cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** La DEK (extraïble) embolcallada amb una KEK: 40 bytes. */
export async function embolcalla(cripto, dek, kek) {
  return new Uint8Array(await cripto.subtle.wrapKey('raw', dek, kek, { name: 'AES-KW' }));
}

/**
 * La DEK d'un embolcall. Per defecte NO extraïble (la de treball); extraïble
 * només per a tornar-la a embolcallar en canviar la frase o el codi.
 * DESEMBOLCALLAT_FALLIT si la KEK no és la bona (frase o codi erronis).
 */
export async function desembolcalla(cripto, embolcallada, kek, { extraible = false } = {}) {
  try {
    return await cripto.subtle.unwrapKey('raw', embolcallada, kek, { name: 'AES-KW' },
      { name: 'AES-GCM', length: 256 }, extraible, ['encrypt', 'decrypt']);
  } catch {
    throw errorAmbCodi('DESEMBOLCALLAT_FALLIT', 'La clau no obri el cofre.');
  }
}

/* ── Registres ─────────────────────────────────────────────────────────── */

const FORMA_COLLECCIO = /^[a-z][a-z0-9-]{0,39}$/;
const FORMA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Una col·lecció és una etiqueta del codi (minúscules, xifres i guions), mai una dada. */
export const esColleccio = (text) => typeof text === 'string' && FORMA_COLLECCIO.test(text);
/** Un id és opac: un UUID v4 en minúscules, com els de crypto.randomUUID(). */
export const esIdOpac = (text) => typeof text === 'string' && FORMA_ID.test(text);

/** Un id opac nou. */
export function nouId(cripto) {
  if (typeof cripto.randomUUID === 'function') return cripto.randomUUID();
  const b = aleatori(cripto, 16);
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function exigixLloc(colleccio, id) {
  if (!esColleccio(colleccio)) throw errorAmbCodi('COLLECCIO_INVALIDA', 'La col·lecció és una etiqueta en minúscules (com «classificacions»).');
  if (!esIdOpac(id)) throw errorAmbCodi('ID_INVALID', 'L’id d’un registre és opac: un UUID v4 (crypto.randomUUID), mai una dada.');
}

/** L'AAD d'un registre: lliga el xifrat a la seua col·lecció i al seu id. */
export const aadDe = (colleccio, id) => codifica(`${PREFIX_AAD}|${colleccio}|${id}`);

/** [longitud en 4 B][bytes][zeros] fins al múltiple de 4 KiB següent. */
export function farceix(bytes) {
  const total = Math.ceil((4 + bytes.length) / BLOC_FARCIT) * BLOC_FARCIT;
  const eixida = new Uint8Array(total);
  new DataView(eixida.buffer).setUint32(0, bytes.length);
  eixida.set(bytes, 4);
  return eixida;
}

/** El contrari de farceix; llança si la forma no quadra. */
export function desfarceix(farcit) {
  if (!(farcit instanceof Uint8Array) || farcit.length < BLOC_FARCIT || farcit.length % BLOC_FARCIT !== 0) {
    throw new TypeError('El farcit no té la mida d’un bloc.');
  }
  const longitud = new DataView(farcit.buffer, farcit.byteOffset, farcit.byteLength).getUint32(0);
  if (longitud > farcit.length - 4) throw new TypeError('La longitud del farcit no quadra.');
  if (farcit.subarray(4 + longitud).some((byte) => byte !== 0)) throw new TypeError('El farcit no és de zeros.');
  return farcit.slice(4, 4 + longitud);
}

/**
 * Xifra un valor (JSON) d'un registre: IV aleatori de 12 B, AAD del lloc i
 * text farcit a 4 KiB. Torna { iv, xifrat } en base64.
 */
export async function xifraValor(cripto, dek, colleccio, id, valor) {
  exigixLloc(colleccio, id);
  const json = JSON.stringify(valor);
  if (json === undefined) throw errorAmbCodi('VALOR_INVALID', 'El valor d’un registre ha de ser JSON (objecte, llista, text, nombre o booleà).');
  const clar = codifica(json);
  if (clar.length > MAX_BYTES_VALOR) throw errorAmbCodi('MASSA_GRAN', 'El registre passa de 16 MiB.');
  const farcit = farceix(clar);
  clar.fill(0);
  const iv = aleatori(cripto, BYTES_IV);
  try {
    const xifrat = new Uint8Array(await cripto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aadDe(colleccio, id), tagLength: 128 }, dek, farcit));
    return Object.freeze({ iv: aBase64(iv), xifrat: aBase64(xifrat) });
  } finally {
    farcit.fill(0);
  }
}

/**
 * Desxifra un registre del seu lloc. REGISTRE_MANIPULAT si el xifrat, l'IV o
 * el lloc (l'AAD) no són els d'origen, o si el contingut no té la forma
 * esperada: res no es torna a mitges.
 */
export async function desxifraValor(cripto, dek, colleccio, id, { iv, xifrat }) {
  exigixLloc(colleccio, id);
  const manipulat = () => errorAmbCodi('REGISTRE_MANIPULAT', 'Un registre del cofre no supera la comprovació d’integritat: no s’ha desxifrat res.');
  let farcit;
  try {
    const bytesIv = deBase64(iv);
    if (bytesIv.length !== BYTES_IV) throw new TypeError('IV');
    farcit = new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv: bytesIv, additionalData: aadDe(colleccio, id), tagLength: 128 },
      dek, deBase64(xifrat)));
  } catch {
    throw manipulat();
  }
  try {
    const clar = desfarceix(farcit);
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(clar));
  } catch {
    throw manipulat();
  } finally {
    farcit.fill(0);
  }
}
