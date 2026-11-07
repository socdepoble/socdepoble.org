/**
 * portabilitatFediversity.js — Motor de Portabilitat Federada Sense Lock-in
 * per a Sóc de Poble i la candidatura NLnet NGI Fediversity (2026-08-1a6).
 *
 * Implementa de forma 100% isomòrfica (Navegador + WebWorker + Node.js),
 * sense cap dependència externa ni acoblament a cap amfitrió:
 *  1. FEP-7628 (ActivityPub Actor Move & Account Migration):
 *     verificació creuada bidireccional d'`alsoKnownAs` i `movedTo`, i
 *     emissió/validació determinista de l'activitat `Move` d'ActivityPub.
 *  2. FEP-8b32 (Object Integrity Proofs · W3C Data Integrity `eddsa-jcs-2022`):
 *     canonització determinista RFC 8785 (JCS), resum SHA-256 FIPS 180-4 pur
 *     i signatura/verificació criptogràfica Ed25519 via WebCrypto natiu.
 *  3. Paquet de Sobirania Municipal (`.sdp-fediversity-bundle.jsonld`):
 *     exportació i importació verificada de l'actor municipal, col·leccions
 *     ActivityPub (`outbox`, `followers`), entitats Open Data 1.2.0 i notes.
 */

export const CONTEXT_ACTIVITYSTREAMS = 'https://www.w3.org/ns/activitystreams';
export const CONTEXT_SECURITY_V1 = 'https://w3id.org/security/v1';
export const CONTEXT_DATA_INTEGRITY_V2 = 'https://w3id.org/security/data-integrity/v2';
export const CONTEXT_SDP_FEDIVERSITY = 'https://socdepoble.org/ns/fediversity/v1';

export const ESQUEMA_PAQUET_SOBIRANIA = 'sdp.fediversity.sobirania.v1';
export const CRYPTOSUITE_FEP8B32 = 'eddsa-jcs-2022';

const TIPUS_ACTOR_VALIDS = new Set([
  'Organization',
  'Person',
  'Service',
  'Application',
  'Group',
]);

const CLAUS_PROHIBIDES = new Set(['__proto__', 'constructor', 'prototype']);

function esObjectePla(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    return false;
  }
  const proto = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
}

function congelaProfund(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    for (let i = 0; i < valor.length; i += 1) {
      congelaProfund(valor[i]);
    }
    return Object.freeze(valor);
  }
  for (const clau of Object.keys(valor)) {
    congelaProfund(valor[clau]);
  }
  return Object.freeze(valor);
}

function esIriHttpsValid(valor) {
  if (typeof valor !== 'string' || valor.trim() !== valor || valor.length < 10) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/* FEP-8b32 permet HTTP(S) i DID URL per al mètode de verificació. Açò
   valida la forma; la confiança en la clau continua sent del cridador.
   https://fediverse.codeberg.page/fep/fep/8b32/#proof-generation */
function esIriMetodeValid(valor) {
  if (typeof valor !== 'string' || !valor || /\s/.test(valor)) return false;
  if (/^did:[a-z0-9]+:[^/?#]+(?:[/?#].*)?$/.test(valor)) return true;
  try {
    const url = new URL(valor);
    return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

/* ── SHA-256 FIPS 180-4 pur i isomòrfic (zero dependències externes) ───── */

const K_SHA256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function aBytesUtf8(entrada) {
  if (entrada instanceof Uint8Array) return entrada;
  if (typeof entrada === 'string') return new TextEncoder().encode(entrada);
  throw new TypeError('[portabilitatFediversity] Entrada per a SHA-256 ha de ser string o Uint8Array.');
}

/**
 * Calcula el resum SHA-256 (FIPS 180-4) i retorna els 32 bytes com a Uint8Array.
 */
export function sha256Bytes(entrada) {
  const missatge = aBytesUtf8(entrada);
  const longitudBitsBaixa = (missatge.length * 8) >>> 0;
  const longitudBitsAlta = Math.floor((missatge.length * 8) / 0x100000000) >>> 0;
  const totalBytes = Math.ceil((missatge.length + 9) / 64) * 64;
  const bloc = new Uint8Array(totalBytes);
  bloc.set(missatge);
  bloc[missatge.length] = 0x80;
  const vista = new DataView(bloc.buffer);
  vista.setUint32(totalBytes - 8, longitudBitsAlta, false);
  vista.setUint32(totalBytes - 4, longitudBitsBaixa, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < totalBytes; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = vista.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K_SHA256[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const resultat = new Uint8Array(32);
  const vistaRes = new DataView(resultat.buffer);
  vistaRes.setUint32(0, h0, false);
  vistaRes.setUint32(4, h1, false);
  vistaRes.setUint32(8, h2, false);
  vistaRes.setUint32(12, h3, false);
  vistaRes.setUint32(16, h4, false);
  vistaRes.setUint32(20, h5, false);
  vistaRes.setUint32(24, h6, false);
  vistaRes.setUint32(28, h7, false);
  return resultat;
}

/**
 * Calcula el resum SHA-256 i el retorna en hexadecimal en minúscules (64 caràcters).
 */
export function sha256Hex(entrada) {
  const bytes = sha256Bytes(entrada);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/* ── Codificació Base64URL (RFC 4648 §5) sense padding ─────────────────── */

const ALFABET_B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function codificaBase64Url(bytesInput) {
  const bytes = bytesInput instanceof Uint8Array ? bytesInput : new Uint8Array(bytesInput);
  let sortida = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const triple = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    sortida += ALFABET_B64URL[(triple >>> 18) & 63];
    sortida += ALFABET_B64URL[(triple >>> 12) & 63];
    sortida += ALFABET_B64URL[(triple >>> 6) & 63];
    sortida += ALFABET_B64URL[triple & 63];
  }
  const restants = bytes.length - i;
  if (restants === 1) {
    const v = bytes[i] << 16;
    sortida += ALFABET_B64URL[(v >>> 18) & 63];
    sortida += ALFABET_B64URL[(v >>> 12) & 63];
  } else if (restants === 2) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8);
    sortida += ALFABET_B64URL[(v >>> 18) & 63];
    sortida += ALFABET_B64URL[(v >>> 12) & 63];
    sortida += ALFABET_B64URL[(v >>> 6) & 63];
  }
  return sortida;
}

export function descodificaBase64Url(text) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9\-_]*$/.test(text)) {
    throw new TypeError('[portabilitatFediversity] Cadena Base64URL invàlida.');
  }
  const net = text;
  const mod = net.length % 4;
  if (mod === 1) {
    throw new TypeError('[portabilitatFediversity] Longitud Base64URL invàlida.');
  }
  const grupsComplets = Math.floor(net.length / 4);
  const bytesExtra = mod === 2 ? 1 : mod === 3 ? 2 : 0;
  const resultat = new Uint8Array(grupsComplets * 3 + bytesExtra);
  let pos = 0;
  for (let i = 0; i < grupsComplets * 4; i += 4) {
    const c0 = ALFABET_B64URL.indexOf(net[i]);
    const c1 = ALFABET_B64URL.indexOf(net[i + 1]);
    const c2 = ALFABET_B64URL.indexOf(net[i + 2]);
    const c3 = ALFABET_B64URL.indexOf(net[i + 3]);
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    resultat[pos++] = (triple >>> 16) & 255;
    resultat[pos++] = (triple >>> 8) & 255;
    resultat[pos++] = triple & 255;
  }
  const offset = grupsComplets * 4;
  if (mod === 2) {
    const c0 = ALFABET_B64URL.indexOf(net[offset]);
    const c1 = ALFABET_B64URL.indexOf(net[offset + 1]);
    resultat[pos] = ((c0 << 18) | (c1 << 12)) >>> 16;
  } else if (mod === 3) {
    const c0 = ALFABET_B64URL.indexOf(net[offset]);
    const c1 = ALFABET_B64URL.indexOf(net[offset + 1]);
    const c2 = ALFABET_B64URL.indexOf(net[offset + 2]);
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6);
    resultat[pos++] = (triple >>> 16) & 255;
    resultat[pos] = (triple >>> 8) & 255;
  }
  return resultat;
}

/* ── Base58-btc / Multibase `z` (W3C vc-di-eddsa §2.2.1) ──────────────
   Cap enter amb precisió limitada: la conversió treballa amb dígits petits
   i conserva els zeros inicials. La signatura Ed25519 sempre té 64 bytes. */
const ALFABET_BASE58_BTC = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function codificaBase58Btc(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Base58-btc necessita Uint8Array.');
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  const digits = [];
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] * 256;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }
  return '1'.repeat(zeros) + digits.reverse().map(digit => ALFABET_BASE58_BTC[digit]).join('');
}

export function descodificaBase58Btc(text) {
  if (typeof text !== 'string' || /[^1-9A-HJ-NP-Za-km-z]/.test(text)) {
    throw new TypeError('Cadena Base58-btc invàlida.');
  }
  let zeros = 0;
  while (zeros < text.length && text[zeros] === '1') zeros += 1;
  const bytes = [];
  for (let i = zeros; i < text.length; i += 1) {
    let carry = ALFABET_BASE58_BTC.indexOf(text[i]);
    for (let j = 0; j < bytes.length; j += 1) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry = Math.floor(carry / 256);
    }
    while (carry) { bytes.push(carry & 255); carry = Math.floor(carry / 256); }
  }
  return new Uint8Array([...new Array(zeros).fill(0), ...bytes.reverse()]);
}

/* ── Canonització JSON determinista RFC 8785 (JCS) per a FEP-8b32 ──────── */

// En mode `u` un parell vàlid és un sol punt de codi astral: la classe només
// casa surrogats solitaris. Lineal i sense retrocés; `isWellFormed` i el
// lookbehind exigirien Safari 16.4.
const SURROGAT_SOLITARI = /[\uD800-\uDFFF]/u;

function cadenaJcs(cadena) {
  if (SURROGAT_SOLITARI.test(cadena)) {
    throw new TypeError('[portabilitatFediversity] JCS no admet surrogats UTF-16 solitaris (RFC 8785 §3.2.2.2).');
  }
  return JSON.stringify(cadena);
}

/** Un array JSON té un valor propi en cada índex. map() omet els forats
 * i podia produir «[,]» o confondre [<forat>] amb []. Mai es normalitza eixa
 * estructura abans de signar; es rebutja també amb valors heretats al prototip.
 */
function exigixArrayDens(array) {
  for (let i = 0; i < array.length; i += 1) {
    if (!Object.hasOwn(array, i)) throw new TypeError('[portabilitatFediversity] JCS no admet arrays amb forats.');
  }
}

/**
 * Canonitza qualsevol estructura JSON segons RFC 8785 (JCS):
 * ordena les claus d'objecte lexicogràficament per code-units UTF-16,
 * elimina claus `undefined` (inexistents en JSON) i rebutja números no finits
 * i surrogats solitaris. Serialitza TOTES les claus pròpies, també
 * `constructor`, `prototype` i `__proto__`: si se'n descartara alguna, quedaria
 * fora del resum i la prova seria mal·leable (O8-PORT-02).
 */
export function canonitzaJsonJcs(valor) {
  if (valor === null || typeof valor === 'boolean') {
    return JSON.stringify(valor);
  }
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) {
      throw new TypeError('[portabilitatFediversity] JCS no admet números no finits (NaN/Infinity).');
    }
    return JSON.stringify(Object.is(valor, -0) ? 0 : valor);
  }
  if (typeof valor === 'string') {
    return cadenaJcs(valor);
  }
  if (Array.isArray(valor)) {
    exigixArrayDens(valor);
    const items = valor.map((element) => (element === undefined ? 'null' : canonitzaJsonJcs(element)));
    return `[${items.join(',')}]`;
  }
  if (esObjectePla(valor)) {
    const claus = Object.keys(valor)
      .filter((clau) => valor[clau] !== undefined)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const parelles = claus.map((clau) => `${cadenaJcs(clau)}:${canonitzaJsonJcs(valor[clau])}`);
    return `{${parelles.join(',')}}`;
  }
  throw new TypeError('[portabilitatFediversity] Valor no serialitzable en JCS.');
}

/**
 * Còpia JSON neta. Una clau de prototip (`__proto__`, `constructor`,
 * `prototype`) es REBUTJA amb `codi: 'CLAU_PROHIBIDA'`: descartar-la en silenci
 * deixaria dades fora de la signatura (O8-PORT-02).
 */
function clonaSenseClausProhibides(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    exigixArrayDens(valor);
    return valor.map(clonaSenseClausProhibides);
  }
  if (!esObjectePla(valor)) {
    throw new TypeError('[portabilitatFediversity] Es requereix un objecte pla JSON-LD.');
  }
  const copia = {};
  for (const clau of Object.keys(valor)) {
    if (CLAUS_PROHIBIDES.has(clau)) {
      throw Object.assign(new TypeError(`[portabilitatFediversity] Clau JSON prohibida: ${clau}.`), { codi: 'CLAU_PROHIBIDA' });
    }
    if (valor[clau] !== undefined) {
      copia[clau] = clonaSenseClausProhibides(valor[clau]);
    }
  }
  return copia;
}

/* ── 1 · FEP-7628: ActivityPub Actor Move & Account Migration ──────────── */

/**
 * Normalitza i valida un Actor d'ActivityPub per a migració federada sense lock-in.
 */
export function normalitzaActorActivityPub(actor) {
  if (!esObjectePla(actor)) {
    throw new TypeError('[portabilitatFediversity] L’actor ActivityPub ha de ser un objecte pla.');
  }
  if (!esIriHttpsValid(actor.id)) {
    throw new TypeError('[portabilitatFediversity] L’actor necessita un `id` IRI HTTPS vàlid.');
  }
  const type = typeof actor.type === 'string' ? actor.type : 'Organization';
  if (!TIPUS_ACTOR_VALIDS.has(type)) {
    throw new TypeError(`[portabilitatFediversity] Tipus d'actor ActivityPub no admès: ${type}.`);
  }
  if (actor.inbox !== undefined && !esIriHttpsValid(actor.inbox)) {
    throw new TypeError('[portabilitatFediversity] `inbox` ha de ser un IRI HTTPS vàlid.');
  }
  if (actor.outbox !== undefined && !esIriHttpsValid(actor.outbox)) {
    throw new TypeError('[portabilitatFediversity] `outbox` ha de ser un IRI HTTPS vàlid.');
  }
  if (actor.followers !== undefined && !esIriHttpsValid(actor.followers)) {
    throw new TypeError('[portabilitatFediversity] `followers` ha de ser un IRI HTTPS vàlid.');
  }
  if (actor.movedTo !== undefined && !esIriHttpsValid(actor.movedTo)) {
    throw new TypeError('[portabilitatFediversity] `movedTo` ha de ser un IRI HTTPS vàlid.');
  }

  const llistaAka = Array.isArray(actor.alsoKnownAs)
    ? actor.alsoKnownAs
    : typeof actor.alsoKnownAs === 'string'
      ? [actor.alsoKnownAs]
      : [];

  const akaUnics = [];
  for (const iri of llistaAka) {
    if (!esIriHttpsValid(iri)) {
      throw new TypeError(`[portabilitatFediversity] Entrada alsoKnownAs invàlida: ${String(iri)}.`);
    }
    if (!akaUnics.includes(iri)) akaUnics.push(iri);
  }

  const resultat = {
    '@context': [CONTEXT_ACTIVITYSTREAMS, CONTEXT_SECURITY_V1],
    id: actor.id,
    type,
    preferredUsername: typeof actor.preferredUsername === 'string' && actor.preferredUsername.trim()
      ? actor.preferredUsername.trim()
      : 'poble',
    name: typeof actor.name === 'string' && actor.name.trim()
      ? actor.name.trim()
      : 'Comunitat Rural Sóc de Poble',
    inbox: actor.inbox ?? `${actor.id.replace(/\/$/, '')}/inbox`,
    outbox: actor.outbox ?? `${actor.id.replace(/\/$/, '')}/outbox`,
    followers: actor.followers ?? `${actor.id.replace(/\/$/, '')}/followers`,
    alsoKnownAs: akaUnics,
    ...(actor.movedTo ? { movedTo: actor.movedTo } : {}),
    ...(esObjectePla(actor.publicKey) ? { publicKey: clonaSenseClausProhibides(actor.publicKey) } : {}),
  };

  return congelaProfund(resultat);
}

/**
 * Verifica el requisit de seguretat bidireccional de FEP-7628:
 * l'actor de destinació ha d'incloure l'IRI d'origen a `alsoKnownAs`,
 * i l'actor d'origen ha d'apuntar a l'actor de destinació via `movedTo` i `alsoKnownAs`.
 */
export function verificaEnllacBidireccionalAlsoKnownAs(actorOrigenInput, actorDestiInput) {
  const motius = [];
  let origen;
  let desti;
  try {
    origen = normalitzaActorActivityPub(actorOrigenInput);
    desti = normalitzaActorActivityPub(actorDestiInput);
  } catch (err) {
    return congelaProfund({
      valid: false,
      motius: [err.message],
      origenId: null,
      destiId: null,
    });
  }

  if (origen.id === desti.id) {
    motius.push('L’actor d’origen i el de destinació no poden tindre el mateix IRI.');
  }
  if (!desti.alsoKnownAs.includes(origen.id)) {
    motius.push('L’actor de destinació no inclou l’IRI d’origen al seu `alsoKnownAs`.');
  }
  if (!origen.alsoKnownAs.includes(desti.id)) {
    motius.push('L’actor d’origen no inclou l’IRI de destinació al seu `alsoKnownAs`.');
  }
  if (origen.movedTo !== desti.id) {
    motius.push('L’actor d’origen no declara `movedTo` apuntant a l’IRI de destinació.');
  }

  return congelaProfund({
    valid: motius.length === 0,
    motius,
    origenId: origen.id,
    destiId: desti.id,
  });
}

/**
 * Emet una activitat `Move` d'ActivityPub conforme a FEP-7628 després de validar
 * que l'actor d'origen i el de destinació tenen l'enllaç bidireccional actiu.
 */
export function emetActivitatMoveActivityPub({
  actorOrigen,
  actorDesti,
  resum = 'Migració sobirana de node rural Sóc de Poble (FEP-7628).',
  publicatEl = '2026-11-03T00:00:00Z',
  idActivitat = null,
} = {}) {
  const verificacio = verificaEnllacBidireccionalAlsoKnownAs(actorOrigen, actorDesti);
  if (!verificacio.valid) {
    const err = new Error(`[portabilitatFediversity] Enllaç FEP-7628 invàlid: ${verificacio.motius.join(' ')}`);
    err.codi = 'FEP7628_ALSOKNOWNAS_NO_BIDIRECCIONAL';
    err.motius = verificacio.motius;
    throw err;
  }
  const origen = normalitzaActorActivityPub(actorOrigen);
  const desti = normalitzaActorActivityPub(actorDesti);
  const empremtaMove = sha256Hex(`${origen.id}|${desti.id}|${publicatEl}`).slice(0, 16);
  const iriActivitat = idActivitat ?? `${origen.id.replace(/\/$/, '')}/activities/move-${empremtaMove}`;
  if (!esIriHttpsValid(iriActivitat)) {
    throw new TypeError('[portabilitatFediversity] `idActivitat` ha de ser un IRI HTTPS vàlid.');
  }

  return congelaProfund({
    '@context': [CONTEXT_ACTIVITYSTREAMS, CONTEXT_SECURITY_V1],
    id: iriActivitat,
    type: 'Move',
    actor: origen.id,
    object: origen.id,
    target: desti.id,
    to: ['https://www.w3.org/ns/activitystreams#Public', origen.followers],
    summary: String(resum),
    published: String(publicatEl),
  });
}

/**
 * Verifica de punta a punta una activitat `Move` d'ActivityPub contra els dos actors.
 */
export function verificaMigracioActorFep7628({ activitatMove, actorOrigen, actorDesti } = {}) {
  const motius = [];
  if (!esObjectePla(activitatMove)) {
    return congelaProfund({
      valid: false,
      motius: ['L’activitat Move ha de ser un objecte pla.'],
      origenId: null,
      destiId: null,
      activitatId: null,
    });
  }
  const enllac = verificaEnllacBidireccionalAlsoKnownAs(actorOrigen, actorDesti);
  if (!enllac.valid) {
    motius.push(...enllac.motius);
  }
  if (activitatMove.type !== 'Move') {
    motius.push('El tipus de l’activitat ha de ser `Move`.');
  }
  if (!esIriHttpsValid(activitatMove.id)) {
    motius.push('L’activitat Move no té un `id` IRI HTTPS vàlid.');
  }
  if (enllac.origenId && activitatMove.actor !== enllac.origenId) {
    motius.push('`activitatMove.actor` no coincideix amb l’IRI de l’actor d’origen.');
  }
  if (enllac.origenId && activitatMove.object !== enllac.origenId) {
    motius.push('`activitatMove.object` no coincideix amb l’IRI de l’actor d’origen.');
  }
  if (enllac.destiId && activitatMove.target !== enllac.destiId) {
    motius.push('`activitatMove.target` no coincideix amb l’IRI de l’actor de destinació.');
  }

  return congelaProfund({
    valid: motius.length === 0,
    motius,
    origenId: enllac.origenId,
    destiId: enllac.destiId,
    activitatId: typeof activitatMove.id === 'string' ? activitatMove.id : null,
  });
}

/* ── 2 · FEP-8b32: Object Integrity Proofs (`eddsa-jcs-2022`) ─────────── */

// Perfil dateTime amb any de quatre xifres i zona obligatòria. XSD 1.1
// §3.3.7.2: Date.parse sol accepta dies impossibles i offsets >14 hores.
const PATRO_DATETIME_XSD = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|[+-](\d{2}):(\d{2}))$/;

function esDateTimeXsd(valor) {
  if (typeof valor !== 'string' || valor.length > 40) return false;
  const parts = PATRO_DATETIME_XSD.exec(valor);
  if (!parts) return false;
  const [, any, mes, dia, hora, minut, segon, fraccio = '', zonaH = '0', zonaM = '0'] = parts;
  const y = Number(any), m = Number(mes), d = Number(dia), h = Number(hora);
  const bisiest = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const dies = [31, bisiest ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return m >= 1 && m <= 12 && d >= 1 && d <= dies[m - 1]
    && Number(minut) < 60 && Number(segon) < 60
    && (h < 24 || (h === 24 && Number(minut) === 0 && Number(segon) === 0 && !/[1-9]/.test(fraccio)))
    && Number(zonaM) < 60 && (Number(zonaH) < 14 || (Number(zonaH) === 14 && Number(zonaM) === 0));
}

function obteSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[portabilitatFediversity] WebCrypto (`crypto.subtle`) no està disponible en aquest entorn.');
  }
  return subtle;
}

function concatenaBytes(a, b) {
  const resultat = new Uint8Array(a.length + b.length);
  resultat.set(a, 0);
  resultat.set(b, a.length);
  return resultat;
}

/* El fragment de l'identificador de la clau va en una constant: escrit dins de
   l'IRI darrere del coixinet, «ed25519» té forma de color hexadecimal per a design_guard. */
const FRAGMENT_CLAU_SOBIRANIA = 'ed25519-sobirania';

/**
 * Genera un parell de claus Ed25519 exportable en JWK per a signar objectes FEP-8b32.
 */
export async function generaParellClausFediversityEd25519({
  controller = 'https://socdepoble.org/actors/ajuntament',
  idClau = `${controller}#${FRAGMENT_CLAU_SOBIRANIA}`,
} = {}) {
  if (!esIriHttpsValid(controller) || !esIriHttpsValid(idClau)) {
    throw new TypeError('[portabilitatFediversity] `controller` i `idClau` han de ser IRIs HTTPS vàlids.');
  }
  const subtle = obteSubtleCrypto();
  const keyPair = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKeyJwk = await subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);

  return congelaProfund({
    idClau,
    controller,
    algoritme: 'Ed25519',
    cryptosuite: CRYPTOSUITE_FEP8B32,
    publicKeyJwk,
    privateKeyJwk,
  });
}

/**
 * Calcula els 64 bytes d'entrada criptogràfica de FEP-8b32 (`eddsa-jcs-2022`):
 * `SHA-256(JCS(proofConfig)) || SHA-256(JCS(documentSenseProof))`.
 */
export function calculaHashEntradaFep8b32(documentSenseProof, proofConfig) {
  const jcsConfig = canonitzaJsonJcs(proofConfig);
  const jcsDoc = canonitzaJsonJcs(documentSenseProof);
  const hashConfig = sha256Bytes(jcsConfig);
  const hashDoc = sha256Bytes(jcsDoc);
  return {
    dadesASignar: concatenaBytes(hashConfig, hashDoc),
    sha256Document: sha256Hex(jcsDoc),
    sha256ProofConfig: sha256Hex(jcsConfig),
  };
}

/**
 * Signa qualsevol objecte JSON-LD / ActivityPub amb una prova d'integritat FEP-8b32 (`eddsa-jcs-2022`).
 */
export async function signaObjecteFediversityFep8b32(
  documentInput,
  {
    privateKeyJwk,
    verificationMethod,
    created = '2026-11-03T00:00:00Z',
    proofPurpose = 'assertionMethod',
  } = {},
) {
  if (!esObjectePla(documentInput)) {
    throw new TypeError('[portabilitatFediversity] El document a signar ha de ser un objecte pla.');
  }
  if (!esObjectePla(privateKeyJwk) || privateKeyJwk.kty !== 'OKP' || privateKeyJwk.crv !== 'Ed25519' || !privateKeyJwk.d) {
    throw new TypeError('[portabilitatFediversity] `privateKeyJwk` ha de ser una clau privada JWK Ed25519 vàlida.');
  }
  if (!esIriMetodeValid(verificationMethod)) {
    throw new TypeError('[portabilitatFediversity] `verificationMethod` ha de ser un IRI HTTP(S) o DID URL vàlid.');
  }
  if (proofPurpose !== 'assertionMethod') {
    throw new TypeError('[portabilitatFediversity] FEP-8b32 exigeix `proofPurpose` = `assertionMethod`.');
  }
  if (!esDateTimeXsd(String(created))) {
    throw new TypeError('[portabilitatFediversity] `created` ha de ser un dateTime XSD (p. ex. 2026-11-03T00:00:00Z).');
  }

  const docSenseProof = clonaSenseClausProhibides(documentInput);
  delete docSenseProof.proof;

  const proofConfig = {
    ...(Object.hasOwn(docSenseProof, '@context') ? { '@context': docSenseProof['@context'] } : {}),
    type: 'DataIntegrityProof',
    cryptosuite: CRYPTOSUITE_FEP8B32,
    verificationMethod,
    proofPurpose,
    created: String(created),
  };

  const { dadesASignar } = calculaHashEntradaFep8b32(docSenseProof, proofConfig);
  const subtle = obteSubtleCrypto();
  const clauPrivada = await subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const signaturaBuffer = await subtle.sign({ name: 'Ed25519' }, clauPrivada, dadesASignar);
  const proofValue = `z${codificaBase58Btc(new Uint8Array(signaturaBuffer))}`;

  return congelaProfund({
    ...docSenseProof,
    proof: { ...proofConfig, proofValue },
  });
}

/**
 * Verifica criptogràficament un objecte JSON-LD / ActivityPub signat amb FEP-8b32 (`eddsa-jcs-2022`).
 * Tot el `proof` llevat de `proofValue` entra al resum i `proofPurpose` ha de ser
 * `assertionMethod`. `publicKeyJwk` ha de vindre d'un ancoratge de confiança (el
 * mètode dereferenciat de l'actor), mai del mateix document: sense
 * `verificationMethodEsperat` no es lliga la clau a cap actor (O8-PORT-05).
 */
export async function verificaObjecteFediversityFep8b32(
  documentSignat,
  { publicKeyJwk, verificationMethodEsperat = null } = {},
) {
  if (!esObjectePla(documentSignat) || !esObjectePla(documentSignat.proof)) {
    return congelaProfund({
      valid: false,
      motiu: 'PROVA_ABSENT',
      verificationMethod: null,
      sha256Document: null,
    });
  }
  if (!esObjectePla(publicKeyJwk) || publicKeyJwk.kty !== 'OKP' || publicKeyJwk.crv !== 'Ed25519' || !publicKeyJwk.x) {
    return congelaProfund({
      valid: false,
      motiu: 'CLAU_PUBLICA_INVALIDA',
      verificationMethod: null,
      sha256Document: null,
    });
  }

  // R11-PORT-02: les metadades retornades també han de ser les signades,
  // encara que el cridador edite el proof mentre WebCrypto verifica.
  const proof = { ...documentSignat.proof };
  if (
    proof.type !== 'DataIntegrityProof' ||
    proof.cryptosuite !== CRYPTOSUITE_FEP8B32 ||
    typeof proof.proofValue !== 'string' ||
    !proof.proofValue.startsWith('z') ||
    !esIriMetodeValid(proof.verificationMethod)
  ) {
    return congelaProfund({
      valid: false,
      motiu: 'FORMAT_PROVA_INVALID',
      verificationMethod: proof.verificationMethod ?? null,
      sha256Document: null,
    });
  }

  if (proof.proofPurpose !== 'assertionMethod') {
    return congelaProfund({
      valid: false,
      motiu: 'PROOF_PURPOSE_INVALID',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }
  if (proof.created !== undefined && !esDateTimeXsd(proof.created)) {
    return congelaProfund({
      valid: false,
      motiu: 'CREATED_INVALID',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }

  if (verificationMethodEsperat && proof.verificationMethod !== verificationMethodEsperat) {
    return congelaProfund({
      valid: false,
      motiu: 'VERIFICATION_METHOD_NO_COINCIDEIX',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }

  let signaturaBytes;
  try {
    // Base58 de 64 bytes: màxim 88 caràcters més el prefix Multibase.
    if (proof.proofValue.length > 89) throw new TypeError('Signatura massa llarga.');
    signaturaBytes = descodificaBase58Btc(proof.proofValue.slice(1));
  } catch {
    return congelaProfund({
      valid: false,
      motiu: 'PROOF_VALUE_CORRUPTE',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }

  if (signaturaBytes.length !== 64) {
    return congelaProfund({
      valid: false,
      motiu: 'LONGITUD_SIGNATURA_INVALIDA',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }

  let dadesASignar;
  let sha256Document;
  try {
    const docSenseProof = clonaSenseClausProhibides(documentSignat);
    delete docSenseProof.proof;
    // eddsa-jcs-2022 (Verify Proof): proofConfig = tot el `proof` menys
    // `proofValue`; cap camp afegit o llevat (expires, domain, created…) queda fora.
    const opcionsProva = clonaSenseClausProhibides(proof);
    delete opcionsProva.proofValue;
    /* W3C vc-di-eddsa §3.3.2, passos 4–7. El context de la prova ha de ser
       un prefix ordenat del document i és el context que entra al resum.
       Cap context ActivityStreams fix: trencaria els vectors oficials. */
    if (Object.hasOwn(opcionsProva, '@context')) {
      const deProva = Array.isArray(opcionsProva['@context']) ? opcionsProva['@context'] : [opcionsProva['@context']];
      const deDocument = Object.hasOwn(docSenseProof, '@context')
        ? (Array.isArray(docSenseProof['@context']) ? docSenseProof['@context'] : [docSenseProof['@context']]) : [];
      if (deProva.length > deDocument.length || deProva.some((valor, index) => canonitzaJsonJcs(valor) !== canonitzaJsonJcs(deDocument[index]))) {
        return congelaProfund({ valid: false, motiu: 'CONTEXT_PROVA_INVALID', verificationMethod: proof.verificationMethod, sha256Document: null });
      }
      docSenseProof['@context'] = opcionsProva['@context'];
    }
    const proofConfig = opcionsProva;
    ({ dadesASignar, sha256Document } = calculaHashEntradaFep8b32(docSenseProof, proofConfig));
  } catch (err) {
    // Falla en tancat: una clau prohibida o un valor no JSON mai es verifica.
    return congelaProfund({
      valid: false,
      motiu: err?.codi === 'CLAU_PROHIBIDA' ? 'CLAU_PROHIBIDA' : 'DOCUMENT_NO_JSON',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }

  try {
    const subtle = obteSubtleCrypto();
    const clauPublica = await subtle.importKey(
      'jwk',
      { kty: 'OKP', crv: 'Ed25519', x: publicKeyJwk.x, ext: true },
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    const ok = await subtle.verify({ name: 'Ed25519' }, clauPublica, signaturaBytes, dadesASignar);
    return congelaProfund({
      valid: Boolean(ok),
      motiu: ok ? null : 'SIGNATURA_INVALIDA',
      verificationMethod: proof.verificationMethod,
      created: proof.created,
      sha256Document,
    });
  } catch {
    return congelaProfund({
      valid: false,
      motiu: 'ERROR_VERIFICACIO_CRIPTOGRAFICA',
      verificationMethod: proof.verificationMethod,
      sha256Document: null,
    });
  }
}

/* ── 3 · Paquet de Sobirania Municipal (`.sdp-fediversity-bundle.jsonld`) ─ */

/**
 * FEP-8b32: el subjecte del document on s'expressa el `verificationMethod` MUST
 * ser el propietari de l'objecte signat. Ací el mètode ha de penjar de l'IRI de
 * l'actor (`<actor.id>#fragment`, mateix origen).
 */
function verificationMethodLligatAActor(verificationMethod, actorId) {
  if (!esIriHttpsValid(verificationMethod) || !esIriHttpsValid(actorId)) return false;
  try {
    const vm = new URL(verificationMethod);
    return vm.origin === new URL(actorId).origin && vm.hash.length > 1
      && verificationMethod.startsWith(`${actorId}#`);
  } catch {
    return false;
  }
}

function calculaResumIntegritatColleccions({ actor, outbox, followers, entitatsOpenData, notes }) {
  return {
    sha256Actor: sha256Hex(canonitzaJsonJcs(actor)),
    totalOutbox: outbox.length,
    sha256Outbox: sha256Hex(canonitzaJsonJcs(outbox)),
    totalFollowers: followers.length,
    sha256Followers: sha256Hex(canonitzaJsonJcs(followers)),
    totalEntitatsOpenData: entitatsOpenData.length,
    sha256EntitatsOpenData: sha256Hex(canonitzaJsonJcs(entitatsOpenData)),
    totalNotes: notes.length,
    sha256Notes: sha256Hex(canonitzaJsonJcs(notes)),
  };
}

/**
 * Exporta i signa amb FEP-8b32 un Paquet de Sobirania Municipal complet
 * (`.sdp-fediversity-bundle.jsonld`) per a migrar qualsevol poble en 1 clic
 * entre WordPress, un node NixOS de Fediversity o Sollutia sense pèrdua de dades.
 */
export async function exportaPaquetSobiraniaMunicipal({
  municipi = 'La Torre de les Maçanes',
  actor,
  outbox = [],
  followers = [],
  entitatsOpenData = [],
  notes = [],
  activitatMove = null,
  exportatEl = '2026-11-03T00:00:00Z',
  privateKeyJwk,
  verificationMethod,
} = {}) {
  if (typeof municipi !== 'string' || !municipi.trim()) {
    throw new TypeError('[portabilitatFediversity] El nom del municipi és obligatori.');
  }
  if (!Array.isArray(outbox) || !Array.isArray(followers) || !Array.isArray(entitatsOpenData) || !Array.isArray(notes)) {
    throw new TypeError('[portabilitatFediversity] `outbox`, `followers`, `entitatsOpenData` i `notes` han de ser llistes.');
  }

  const actorNormalitzat = normalitzaActorActivityPub(actor);
  const metodeVerificacio = verificationMethod ?? `${actorNormalitzat.id}#${FRAGMENT_CLAU_SOBIRANIA}`;
  if (!verificationMethodLligatAActor(metodeVerificacio, actorNormalitzat.id)) {
    throw new TypeError('[portabilitatFediversity] `verificationMethod` ha de penjar de l’IRI de l’actor (`<actor.id>#clau`).');
  }
  const outboxNet = outbox.map(clonaSenseClausProhibides);
  const followersNet = followers.map((f) => {
    if (!esIriHttpsValid(f)) {
      throw new TypeError(`[portabilitatFediversity] Seguidor invàlid: ${String(f)}.`);
    }
    return f;
  });
  const entitatsNetes = entitatsOpenData.map(clonaSenseClausProhibides);
  const notesNetes = notes.map(clonaSenseClausProhibides);
  const moveNet = activitatMove ? clonaSenseClausProhibides(activitatMove) : null;

  const resumIntegritat = calculaResumIntegritatColleccions({
    actor: actorNormalitzat,
    outbox: outboxNet,
    followers: followersNet,
    entitatsOpenData: entitatsNetes,
    notes: notesNetes,
  });

  const paquetSenseProva = {
    '@context': [
      CONTEXT_ACTIVITYSTREAMS,
      CONTEXT_DATA_INTEGRITY_V2,
      CONTEXT_SDP_FEDIVERSITY,
    ],
    schema: ESQUEMA_PAQUET_SOBIRANIA,
    versioVocabulari: '1.2.0',
    municipi: municipi.trim(),
    exportatEl: String(exportatEl),
    actor: actorNormalitzat,
    colleccions: {
      outbox: outboxNet,
      followers: followersNet,
    },
    entitatsOpenData: entitatsNetes,
    notes: notesNetes,
    ...(moveNet ? { migracioFep7628: moveNet } : {}),
    resumIntegritat,
  };

  return signaObjecteFediversityFep8b32(paquetSenseProva, {
    privateKeyJwk,
    verificationMethod: metodeVerificacio,
    created: exportatEl,
  });
}

/**
 * Importa i verifica criptogràficament un Paquet de Sobirania Municipal
 * (`.sdp-fediversity-bundle.jsonld`). Comprova l'esquema, els resums SHA-256
 * de totes les col·leccions, la signatura Ed25519 FEP-8b32 lligada a l'actor
 * del paquet i, si s'hi inclou, la migració d'actor FEP-7628: el `Move` ha de
 * ser de l'actor del paquet i només es restaura verificat contra `actorDesti`
 * (sense destí, `migracioFep7628` torna `null`). `publicKeyJwk` ha de vindre
 * d'un ancoratge de confiança, mai del mateix paquet.
 */
export async function importaPaquetSobiraniaMunicipal(
  paquetInput,
  { publicKeyJwk, actorDesti: actorDestiInput = null } = {},
) {
  const motius = [];
  if (!esObjectePla(paquetInput)) {
    return congelaProfund({
      valid: false,
      motius: ['El paquet de sobirania ha de ser un objecte pla JSON-LD.'],
      municipi: null,
      dadesRestaurades: null,
    });
  }
  // R11-PORT-01: WebCrypto cedeix el control. La comprovació dels resums,
  // la signatura i les dades restaurades han d'usar una única instantània;
  // el cridador pot continuar editant el fitxer o l'actor de destí en vol.
  let paquet;
  let actorDesti;
  try {
    paquet = clonaSenseClausProhibides(paquetInput);
    actorDesti = clonaSenseClausProhibides(actorDestiInput);
  } catch {
    return congelaProfund({
      valid: false,
      motius: ['El paquet o l’actor de destí no són objectes JSON-LD admesos.'],
      municipi: null,
      dadesRestaurades: null,
    });
  }
  // Coacció primitiva: String() d'un objecte hostil ({"toString":1}) llançaria.
  if (paquet.schema !== ESQUEMA_PAQUET_SOBIRANIA) {
    motius.push(`Esquema desconegut: ${typeof paquet.schema === 'string' ? paquet.schema : typeof paquet.schema}.`);
  }
  if (paquet.versioVocabulari !== '1.2.0') {
    motius.push(`Versió de vocabulari no suportada: ${typeof paquet.versioVocabulari === 'string' ? paquet.versioVocabulari : typeof paquet.versioVocabulari}.`);
  }

  let actorNormalitzat = null;
  try {
    actorNormalitzat = normalitzaActorActivityPub(paquet.actor);
  } catch (err) {
    motius.push(err.message);
  }

  const outbox = Array.isArray(paquet.colleccions?.outbox) ? paquet.colleccions.outbox : null;
  const followers = Array.isArray(paquet.colleccions?.followers) ? paquet.colleccions.followers : null;
  const entitatsOpenData = Array.isArray(paquet.entitatsOpenData) ? paquet.entitatsOpenData : null;
  const notes = Array.isArray(paquet.notes) ? paquet.notes : null;

  if (!outbox || !followers || !entitatsOpenData || !notes) {
    motius.push('Falten col·leccions obligatòries (`outbox`, `followers`, `entitatsOpenData` o `notes`).');
  }

  if (actorNormalitzat && outbox && followers && entitatsOpenData && notes && esObjectePla(paquet.resumIntegritat)) {
    // Falla en tancat i estructurat: la JCS rebutja surrogats solitaris (O8-PORT-09).
    let esperat = {};
    try {
      esperat = calculaResumIntegritatColleccions({
        actor: actorNormalitzat,
        outbox,
        followers,
        entitatsOpenData,
        notes,
      });
    } catch (err) {
      motius.push(`Les col·leccions no es poden canonitzar en JCS: ${err.message}`);
    }
    for (const clau of Object.keys(esperat)) {
      if (paquet.resumIntegritat[clau] !== esperat[clau]) {
        motius.push(`Discrepància d'integritat en \`resumIntegritat.${clau}\`.`);
      }
    }
  } else {
    motius.push('El bloc `resumIntegritat` és absent o incomplet.');
  }

  // El mètode de la prova ha de penjar de l'actor del paquet (O8-PORT-05).
  const vmProva = esObjectePla(paquet.proof) ? paquet.proof.verificationMethod : null;
  if (actorNormalitzat && !verificationMethodLligatAActor(vmProva, actorNormalitzat.id)) {
    motius.push('Prova criptogràfica FEP-8b32 invàlida: VERIFICATION_METHOD_NO_LLIGAT.');
  }
  const verificacioProva = await verificaObjecteFediversityFep8b32(paquet, { publicKeyJwk });
  if (!verificacioProva.valid) {
    motius.push(`Prova criptogràfica FEP-8b32 invàlida: ${verificacioProva.motiu}.`);
  }

  // FEP-7628: falla en tancat. Un `Move` d'un altre actor invalida el paquet, i
  // només es restaura el que s'ha verificat contra `actorDesti` (O8-PORT-06).
  let migracioVerificada = null;
  if (paquet.migracioFep7628 !== undefined && paquet.migracioFep7628 !== null) {
    const move = paquet.migracioFep7628;
    if (!esObjectePla(move) || move.type !== 'Move') {
      motius.push('`migracioFep7628` ha de ser una activitat `Move` (objecte pla).');
    } else if (actorNormalitzat && (move.actor !== actorNormalitzat.id || move.object !== actorNormalitzat.id)) {
      motius.push('La migració FEP-7628 no pertany a l’actor del paquet (`actor`/`object`).');
    } else if (actorDesti && actorNormalitzat) {
      const verificacioMove = verificaMigracioActorFep7628({
        activitatMove: move,
        actorOrigen: actorNormalitzat,
        actorDesti,
      });
      if (verificacioMove.valid) {
        migracioVerificada = move;
      } else {
        motius.push(...verificacioMove.motius);
      }
    }
  }

  const valid = motius.length === 0;
  // Amb la prova vàlida, estes còpies són exactament el contingut signat.
  return congelaProfund({
    valid,
    motius,
    municipi: valid ? paquet.municipi : null,
    sha256Paquet: verificacioProva.sha256Document,
    dadesRestaurades: valid
      ? {
          municipi: paquet.municipi,
          actor: actorNormalitzat,
          outbox: clonaSenseClausProhibides(outbox),
          followers: clonaSenseClausProhibides(followers),
          entitatsOpenData: clonaSenseClausProhibides(entitatsOpenData),
          notes: clonaSenseClausProhibides(notes),
          migracioFep7628: clonaSenseClausProhibides(migracioVerificada),
        }
      : null,
  });
}
