/**
 * xifratXatCripto.js — les primitives del xifratge d'extrem a extrem dels xats
 * privats (P1-12 / IDEA-19, protocol «sdp-xat-v1»; disseny final §4.1, §4.2,
 * §4.4 i §4.6, pas 2 de §16).
 *
 * JS pur sobre WebCrypto, sense cap dependència: sense DOM, React,
 * emmagatzematge ni xarxa. Com el cofre de la Gestoria
 * (src/sections/gestoria/cofre/nucli/cripto.js), cada funció rep l'objecte
 * `cripto` (subtle i getRandomValues) i cap no el pren d'un global. L'única
 * porta que en posa un per defecte és `creaCriptoXat(cripto = globalThis.crypto)`,
 * que el comprova una vegada i hi lliga totes les primitives. Un entorn sense
 * WebCrypto complet falla tancat (SENSE_CRIPTO), mai amb un generador
 * d'atzar que no siga el criptogràfic.
 *
 * Què hi ha:
 *   · base64url sense farciment i canònic (el no canònic es rebutja: G-13);
 *   · uuid canònic en minúscules → 16 bytes;
 *   · punts P-256 en brut sense comprimir (65 B) validats sobre la corba, i la
 *     JWK pública estricta {kty, crv, x, y}, mai amb «d» (QA-E01, M1-b);
 *   · SHA-256, SHA-512, HMAC-SHA256 i HKDF-SHA256: l'Extract i l'Expand de
 *     l'RFC 5869 fets a mà sobre HMAC (els etiquetats d'HPKE en depenen) i
 *     l'HKDF natiu sobre una CryptoKey (`ckCommit`, `mk`, `Kenc_A`);
 *   · HPKE de l'RFC 9180, mode_base, DHKEM(P-256, HKDF-SHA256), HKDF-SHA256 i
 *     AES-256-GCM (0x0010, 0x0001, 0x0002), amb l'obertura directa a una clau
 *     HKDF per unwrapKey: la `CK` no passa mai per JavaScript (G-18);
 *   · ECDSA P-256 amb SHA-256 (IEEE P1363, 64 B), AES-256-GCM (IV de 12 B i
 *     etiqueta de 128 bits sempre explícita) i PBKDF2-HMAC-SHA256 amb el sòl
 *     d'iteracions del cofre;
 *   · el farciment dels missatges (0x80 i zeros fins a blocs de 256 B) i el
 *     Padmé dels adjunts;
 *   · el número de seguretat de 60 xifres, calcat de libsignal.
 * Els formats binaris SDP* i el protocol viuen en mòduls a part (§8.1).
 * Els intermedis secrets (DH, entrades i eixides d'HMAC, secrets d'HPKE, claus
 * en brut) es posen a zero en acabar, la part de JavaScript: les còpies internes
 * del motor no s'hi poden tocar. Els bytes de qui crida no es toquen mai.
 */

export const PROTOCOL = 'sdp-xat-v1';
export const BYTES_PUBLICA = 65;
export const BYTES_SIGNATURA = 64;
export const BYTES_CLAU = 32;
export const BYTES_IV = 12;
export const BYTES_ETIQUETA = 16;
export const BYTES_UUID = 16;
export const BYTES_SAL = 16;
export const ITERACIONS_KDF = 600000;
/* El sòl de les iteracions, com el del cofre: les proves el poden abaixar per
   a no esperar, mai per davall d'este mínim. */
export const MIN_ITERACIONS_PROVES = 1000;
export const MAX_ITERACIONS = 10000000;
export const BLOC_MISSATGE = 256;
export const MAX_MISSATGE_FARCIT = 16384;
/* Les iteracions de l'empremta numèrica de Signal (5.200). */
export const ITERACIONS_NUMERO = 5200;

/* Els identificadors d'HPKE (RFC 9180 §7). L'AEAD 0x0001 només hi és per a
   validar l'apèndix A.3 de l'RFC, que el porta: el protocol usa sempre 0x0002. */
export const HPKE = Object.freeze({
  MODE_BASE: 0x00,
  KEM_P256_HKDF_SHA256: 0x0010,
  KDF_HKDF_SHA256: 0x0001,
  AEAD_AES_128_GCM: 0x0001,
  AEAD_AES_256_GCM: 0x0002
});
/* Les etiquetes exactes de §4.2 (RFC 9180 §4.1 i §5.1). */
export const ETIQUETES_HPKE = Object.freeze({
  EAE_PRK: 'eae_prk',
  SHARED_SECRET: 'shared_secret',
  PSK_ID_HASH: 'psk_id_hash',
  INFO_HASH: 'info_hash',
  SECRET: 'secret',
  KEY: 'key',
  BASE_NONCE: 'base_nonce'
});
const NK_AEAD = Object.freeze({ [HPKE.AEAD_AES_128_GCM]: 16, [HPKE.AEAD_AES_256_GCM]: 32 });
const NN = 12;
const NH = 32;

/* Els paràmetres de P-256 (RFC 5903 §3.1; SEC 2). El cofactor és 1: un punt
   de la corba és sempre del subgrup. */
export const CORBA_P256 = Object.freeze({
  p: 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn,
  b: 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn,
  n: 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
});

const ALG_ECDH = Object.freeze({ name: 'ECDH', namedCurve: 'P-256' });
const ALG_ECDSA = Object.freeze({ name: 'ECDSA', namedCurve: 'P-256' });
const SIGNATURA = Object.freeze({ name: 'ECDSA', hash: 'SHA-256' });
const HMAC = Object.freeze({ name: 'HMAC', hash: 'SHA-256' });
const USOS_AES = Object.freeze(['encrypt', 'decrypt']);
const METODES_SUBTLE = Object.freeze(['digest', 'importKey', 'exportKey', 'generateKey', 'deriveBits', 'deriveKey', 'encrypt', 'decrypt',
  'sign', 'verify', 'unwrapKey']);
const BUIT = new Uint8Array(0);

/* Un error amb codi estable, perquè qui crida decidisca què diu. */
export function errorAmbCodi(codi, missatge) {
  const error = new Error(missatge);
  error.codi = codi;
  return error;
}

/**
 * L'objecte `cripto`, si té tot el que fa falta (subtle complet i
 * getRandomValues). SENSE_CRIPTO si no: fora d'un context segur `subtle` no
 * existix i el xifrat del xat no ha de fer com si funcionara.
 */
export function exigixCripto(cripto) {
  const subtle = cripto?.subtle;
  if (!subtle || typeof cripto.getRandomValues !== 'function' || METODES_SUBTLE.some((metode) => typeof subtle[metode] !== 'function')) {
    throw errorAmbCodi('SENSE_CRIPTO', 'Este entorn no té WebCrypto complet (crypto.subtle): el xifrat del xat no hi pot funcionar.');
  }
  return cripto;
}

const subtleDe = (cripto) => exigixCripto(cripto).subtle;
const codifica = (text) => new TextEncoder().encode(text);
/* Uint8Array també d'un altre reialme (un iframe, jsdom). */
const esBytes = (valor) => Object.prototype.toString.call(valor) === '[object Uint8Array]';

function exigixBytes(valor, nom) {
  if (!esBytes(valor)) throw new TypeError(`${nom} han de ser bytes (Uint8Array).`);
  return valor;
}

/** Els trossos de bytes, un darrere l'altre. */
export function ajunta(...trossos) {
  let total = 0;
  for (const tros of trossos) total += exigixBytes(tros, 'Els trossos').length;
  const eixida = new Uint8Array(total);
  let posicio = 0;
  for (const tros of trossos) {
    eixida.set(tros, posicio);
    posicio += tros.length;
  }
  return eixida;
}

/** Igualtat de bytes sense eixir abans d'hora (per a kid, compromisos i franqueigs). */
export function bytesIguals(a, b) {
  if (!esBytes(a) || !esBytes(b) || a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a[i] ^ b[i];
  return diferencia === 0;
}

/* I2OSP de l'RFC 8017: n en w bytes, big-endian. */
function i2osp(n, w) {
  if (!Number.isSafeInteger(n) || n < 0 || n >= 256 ** w) throw new RangeError(`${n} no cap en ${w} bytes.`);
  const eixida = new Uint8Array(w);
  for (let i = w - 1, resta = n; i >= 0; i -= 1, resta = Math.floor(resta / 256)) eixida[i] = resta % 256;
  return eixida;
}

/** n bytes aleatoris del generador del sistema. */
export function aleatori(cripto, n) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 65536) throw new RangeError('Entre 0 i 65.536 bytes aleatoris per crida.');
  return exigixCripto(cripto).getRandomValues(new Uint8Array(n));
}

/* ── base64url sense farciment, canònic (§4.1) ─────────────────────────── */

const ALFABET_B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const FORMA_B64URL = /^[A-Za-z0-9_-]*$/;
const valorB64url = (caracter) => (caracter === undefined ? 0 : ALFABET_B64URL.indexOf(caracter));

/** Bytes → base64url sense «=». */
export function aBase64url(bytes) {
  exigixBytes(bytes, 'Els bytes del base64url');
  const trossos = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const queden = bytes.length - i;
    const n = (bytes[i] << 16) | ((queden > 1 ? bytes[i + 1] : 0) << 8) | (queden > 2 ? bytes[i + 2] : 0);
    trossos.push(ALFABET_B64URL[(n >> 18) & 63] + ALFABET_B64URL[(n >> 12) & 63]
      + (queden > 1 ? ALFABET_B64URL[(n >> 6) & 63] : '') + (queden > 2 ? ALFABET_B64URL[n & 63] : ''));
  }
  return trossos.join('');
}

/**
 * base64url → bytes, només si el text és la forma canònica: sense «=», sense
 * «+» ni «/», una llargària possible i els bits sobrers de l'últim caràcter a
 * zero. WebCrypto accepta el no canònic i el servidor podria servir una altra
 * cadena per a la mateixa clau (G-13). Amb `longitud`, exigix eixos bytes.
 * BASE64URL_INVALID si no.
 */
export function deBase64url(text, longitud) {
  const falla = (motiu) => errorAmbCodi('BASE64URL_INVALID', `El text no és base64url canònic (${motiu}).`);
  if (typeof text !== 'string' || !FORMA_B64URL.test(text)) throw falla('forma');
  const resta = text.length % 4;
  if (resta === 1) throw falla('llargària');
  // L'últim caràcter porta 4 bits sobrers (resta 2) o 2 (resta 3): sempre zero.
  const sobrers = resta === 2 ? 15 : resta === 3 ? 3 : 0;
  if (sobrers && (valorB64url(text[text.length - 1]) & sobrers) !== 0) throw falla('bits sobrers');
  const bytes = new Uint8Array(Math.floor(text.length / 4) * 3 + (resta ? resta - 1 : 0));
  if (longitud !== undefined && bytes.length !== longitud) throw falla(`${longitud} bytes`);
  let j = 0;
  for (let i = 0; i < text.length; i += 4) {
    const n = (valorB64url(text[i]) << 18) | (valorB64url(text[i + 1]) << 12) | (valorB64url(text[i + 2]) << 6) | valorB64url(text[i + 3]);
    if (j < bytes.length) bytes[j++] = (n >> 16) & 255;
    if (j < bytes.length) bytes[j++] = (n >> 8) & 255;
    if (j < bytes.length) bytes[j++] = n & 255;
  }
  return bytes;
}

/* ── uuid16 ────────────────────────────────────────────────────────────── */

const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Els 16 bytes d'un uuid canònic en minúscules; UUID_INVALID si no ho és (§4.1). */
export function uuid16(text) {
  if (typeof text !== 'string' || !FORMA_UUID.test(text)) {
    throw errorAmbCodi('UUID_INVALID', 'Un uuid del xat ha de ser canònic i en minúscules.');
  }
  const hex = text.replaceAll('-', '');
  const bytes = new Uint8Array(BYTES_UUID);
  for (let i = 0; i < BYTES_UUID; i += 1) bytes[i] = Number.parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

/* ── Punts P-256 i JWK pública ─────────────────────────────────────────── */

function enterDe(bytes, des, fins) {
  let n = 0n;
  for (let i = des; i < fins; i += 1) n = (n << 8n) | BigInt(bytes[i]);
  return n;
}

const modP = (x) => ((x % CORBA_P256.p) + CORBA_P256.p) % CORBA_P256.p;

/**
 * Una pública P-256 en brut sense comprimir és vàlida: 65 B, 0x04 davant,
 * coordenades menors que p i y² = x³ − 3x + b (mod p). La comprovació és
 * pròpia, a més de la del motor, perquè cada motor no rebutja igual (§15.18) i
 * Safari no importa les comprimides (recon_plataformes §1.1).
 */
export function esPuntP256(raw) {
  if (!esBytes(raw) || raw.length !== BYTES_PUBLICA || raw[0] !== 0x04) return false;
  const x = enterDe(raw, 1, 33);
  const y = enterDe(raw, 33, 65);
  if (x >= CORBA_P256.p || y >= CORBA_P256.p) return false;
  return modP(y * y) === modP(x * x * x - 3n * x + CORBA_P256.b);
}

/** El mateix punt, si és vàlid; PUNT_INVALID si no. */
export function exigixPuntP256(raw) {
  if (!esPuntP256(raw)) throw errorAmbCodi('PUNT_INVALID', 'La clau pública no és un punt vàlid de la corba P-256.');
  return raw;
}

const MEMBRES_JWK = 'crv,kty,x,y';

/** La JWK pública estricta {kty, crv, x, y} d'un punt vàlid (la forma d'`emissor_pub_jwk`, §4.5.2). */
export function jwkDePublica(raw) {
  exigixPuntP256(raw);
  return Object.freeze({ kty: 'EC', crv: 'P-256', x: aBase64url(raw.subarray(1, 33)), y: aBase64url(raw.subarray(33, 65)) });
}

/**
 * El punt en brut d'una JWK pública estricta: un objecte pla amb exactament
 * kty «EC», crv «P-256» i x, y en base64url canònic de 32 B, sobre la corba.
 * JWK_AMB_PRIVADA si porta «d» (encara que la resta siga correcta);
 * JWK_INVALID per a qualsevol altra forma; PUNT_INVALID si no és de la corba.
 */
export function publicaDeJwk(jwk) {
  const falla = (motiu) => errorAmbCodi('JWK_INVALID', `La clau pública JWK no és vàlida (${motiu}).`);
  if (jwk === null || typeof jwk !== 'object' || Array.isArray(jwk)) throw falla('no és un objecte');
  if ('d' in jwk) throw errorAmbCodi('JWK_AMB_PRIVADA', 'La JWK porta la part privada («d»): no s’accepta mai.');
  const prototip = Object.getPrototypeOf(jwk);
  if (prototip !== Object.prototype && prototip !== null) throw falla('no és un objecte pla');
  const membres = Reflect.ownKeys(jwk);
  if (membres.some((membre) => typeof membre !== 'string') || [...membres].sort().join(',') !== MEMBRES_JWK) throw falla('membres');
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw falla('kty o crv');
  let x;
  let y;
  try {
    x = deBase64url(jwk.x, 32);
    y = deBase64url(jwk.y, 32);
  } catch {
    throw falla('x o y');
  }
  return exigixPuntP256(ajunta(Uint8Array.of(0x04), x, y));
}

/* ── Claus asimètriques ────────────────────────────────────────────────── */

/** Una pública ECDH (per a rebre sobres) des del brut, validada. */
export async function importaPublicaDh(cripto, raw) {
  return subtleDe(cripto).importKey('raw', exigixPuntP256(raw), ALG_ECDH, true, []);
}

/** Una pública ECDSA (per a verificar) des del brut, validada. */
export async function importaPublicaSignatura(cripto, raw) {
  return subtleDe(cripto).importKey('raw', exigixPuntP256(raw), ALG_ECDSA, true, ['verify']);
}

/** Els 65 B en brut d'una CryptoKey pública, validats. */
export async function exportaPublica(cripto, clauPublica) {
  return exigixPuntP256(new Uint8Array(await subtleDe(cripto).exportKey('raw', clauPublica)));
}

/**
 * Una parella ECDH P-256. No extraïble per defecte; extraïble només per a fer
 * la còpia de la identitat una sola vegada (§4.3), i després es torna a
 * importar no extraïble.
 */
export async function generaParellaDh(cripto, { extraible = false } = {}) {
  return subtleDe(cripto).generateKey(ALG_ECDH, extraible === true, ['deriveBits']);
}

/** Una parella ECDSA P-256, amb la mateixa regla d'extraïble que la ECDH. */
export async function generaParellaSignatura(cripto, { extraible = false } = {}) {
  return subtleDe(cripto).generateKey(ALG_ECDSA, extraible === true, ['sign', 'verify']);
}

/** El secret ECDH (la coordenada x, 32 B) entre una privada i una pública en brut validada. */
export async function secretDh(cripto, privada, publicaRaw) {
  const publica = await importaPublicaDh(cripto, publicaRaw);
  return new Uint8Array(await subtleDe(cripto).deriveBits({ name: 'ECDH', public: publica }, privada, 256));
}

/* ── Hash, HMAC i HKDF ─────────────────────────────────────────────────── */

export async function sha256(cripto, dades) {
  return new Uint8Array(await subtleDe(cripto).digest('SHA-256', exigixBytes(dades, 'Les dades')));
}

export async function sha512(cripto, dades) {
  return new Uint8Array(await subtleDe(cripto).digest('SHA-512', exigixBytes(dades, 'Les dades')));
}

/**
 * HMAC-SHA256. WebCrypto rebutja les claus HMAC de longitud zero; HMAC farcix
 * amb zeros tota clau més curta que el bloc de 64 B (RFC 2104 §2), així que la
 * clau buida i 32 zeros són la mateixa clau (§4.2, CS-15).
 */
export async function hmacSha256(cripto, clau, dades) {
  const subtle = subtleDe(cripto);
  exigixBytes(clau, 'La clau HMAC');
  exigixBytes(dades, 'Les dades');
  const material = await subtle.importKey('raw', clau.length === 0 ? new Uint8Array(NH) : clau, HMAC, false, ['sign']);
  return new Uint8Array(await subtle.sign('HMAC', material, dades));
}

/** HKDF-Extract (RFC 5869 §2.2): una sal buida és HashLen zeros. */
export async function hkdfExtract(cripto, sal, ikm) {
  return hmacSha256(cripto, exigixBytes(sal, 'La sal'), exigixBytes(ikm, 'L’IKM'));
}

/** HKDF-Expand (RFC 5869 §2.3), fet a mà sobre HMAC: l'HKDF de WebCrypto ajunta les dues meitats. */
export async function hkdfExpand(cripto, prk, info, longitud) {
  const subtle = subtleDe(cripto);
  exigixBytes(prk, 'El PRK');
  exigixBytes(info, 'La info');
  if (prk.length < NH) throw new RangeError('El PRK fa almenys 32 bytes.');
  if (!Number.isSafeInteger(longitud) || longitud < 1 || longitud > 255 * NH) throw new RangeError('HKDF-Expand dona entre 1 i 8.160 bytes.');
  const clau = await subtle.importKey('raw', prk, HMAC, false, ['sign']);
  const okm = new Uint8Array(Math.ceil(longitud / NH) * NH);
  let t = BUIT;
  try {
    for (let i = 1; (i - 1) * NH < longitud; i += 1) {
      // El bloc porta T(i − 1), que és part de l'OKM: també es posa a zero.
      const bloc = ajunta(t, info, Uint8Array.of(i));
      t.fill(0);
      try {
        t = new Uint8Array(await subtle.sign('HMAC', clau, bloc));
      } finally {
        bloc.fill(0);
      }
      okm.set(t, (i - 1) * NH);
    }
    return okm.slice(0, longitud);
  } finally {
    t.fill(0);
    okm.fill(0);
  }
}

/**
 * Una clau HKDF no extraïble des de 32 bytes (la `CK` del qui segella, `FK`
 * d'un adjunt). CLAU_INVALIDA per a qualsevol altra mida: una `CK` buida o
 * tallada donaria claus que qualsevol pot calcular.
 */
export async function importaClauHkdf(cripto, bytes) {
  if (exigixBytes(bytes, 'El material HKDF').length !== BYTES_CLAU) throw errorAmbCodi('CLAU_INVALIDA', 'Una clau HKDF del xat són 32 bytes.');
  return subtleDe(cripto).importKey('raw', bytes, 'HKDF', false, ['deriveBits', 'deriveKey']);
}

const paramsHkdf = (sal, info) => ({ name: 'HKDF', hash: 'SHA-256', salt: exigixBytes(sal, 'La sal'), info: exigixBytes(info, 'La info') });

/** HKDF-SHA256 natiu des d'una clau HKDF: `longitud` bytes (ckCommit, §4.5.1). */
export async function derivaBitsHkdf(cripto, clauHkdf, sal, info, longitud) {
  if (!Number.isSafeInteger(longitud) || longitud < 1 || longitud > 255 * NH) throw new RangeError('HKDF dona entre 1 i 8.160 bytes.');
  return new Uint8Array(await subtleDe(cripto).deriveBits(paramsHkdf(sal, info), clauHkdf, longitud * 8));
}

/** Una AES-256-GCM no extraïble derivada per HKDF-SHA256 (la `mk` d'un missatge, la `Kenc_A` d'un adjunt). */
export async function derivaClauAesHkdf(cripto, clauHkdf, sal, info, usos = USOS_AES) {
  return subtleDe(cripto).deriveKey(paramsHkdf(sal, info), clauHkdf, { name: 'AES-GCM', length: 256 }, false, [...usos]);
}

const FORMA_ETIQUETA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** La info d'una derivació del protocol: «sdp-xat-v1/<nom>» ‖ 0x00 ‖ context (§4.1). */
export function infoHkdf(nom, ...context) {
  if (typeof nom !== 'string' || !FORMA_ETIQUETA.test(nom)) throw new TypeError('Una etiqueta HKDF és ASCII en minúscules, xifres i guions.');
  return ajunta(codifica(`${PROTOCOL}/${nom}`), Uint8Array.of(0x00), ...context);
}

/* ── HPKE, RFC 9180, mode_base (§4.2) ──────────────────────────────────── */

const PREFIX_HPKE = codifica('HPKE-v1');

function nkDe(aead) {
  const nk = NK_AEAD[aead];
  if (!nk) throw errorAmbCodi('SUITE_DESCONEGUDA', 'L’AEAD d’HPKE ha de ser 0x0002 (AES-256-GCM); 0x0001 només per als vectors.');
  return nk;
}

/** suite_id del KEM: "KEM" ‖ I2OSP(0x0010, 2). */
export const suiteIdKem = () => ajunta(codifica('KEM'), i2osp(HPKE.KEM_P256_HKDF_SHA256, 2));

/** suite_id d'HPKE: "HPKE" ‖ KEM ‖ KDF ‖ AEAD, de 2 bytes cadascun. */
export function suiteIdHpke(aead = HPKE.AEAD_AES_256_GCM) {
  nkDe(aead);
  return ajunta(codifica('HPKE'), i2osp(HPKE.KEM_P256_HKDF_SHA256, 2), i2osp(HPKE.KDF_HKDF_SHA256, 2), i2osp(aead, 2));
}

const etiquetaHpke = (etiqueta) => {
  if (typeof etiqueta !== 'string') throw new TypeError('L’etiqueta d’HPKE és un text.');
  return codifica(etiqueta);
};

/** LabeledExtract(sal, etiqueta, ikm) = HKDF-Extract(sal, "HPKE-v1" ‖ suite_id ‖ etiqueta ‖ ikm). L'entrada (porta el DH) es posa a zero. */
export async function labeledExtract(cripto, suiteId, sal, etiqueta, ikm) {
  const entrada = ajunta(PREFIX_HPKE, suiteId, etiquetaHpke(etiqueta), ikm);
  try {
    return await hkdfExtract(cripto, sal, entrada);
  } finally {
    entrada.fill(0);
  }
}

/** LabeledExpand(prk, etiqueta, info, L) = HKDF-Expand(prk, I2OSP(L, 2) ‖ "HPKE-v1" ‖ suite_id ‖ etiqueta ‖ info, L). */
export async function labeledExpand(cripto, suiteId, prk, etiqueta, info, longitud) {
  return hkdfExpand(cripto, prk, ajunta(i2osp(longitud, 2), PREFIX_HPKE, suiteId, etiquetaHpke(etiqueta), info), longitud);
}

/** ExtractAndExpand de DHKEM: shared_secret = LabeledExpand(LabeledExtract("", "eae_prk", dh), "shared_secret", enc ‖ pkR, 32). */
export async function secretCompartitDhkem(cripto, dh, enc, pkR) {
  const suite = suiteIdKem();
  const eaePrk = await labeledExtract(cripto, suite, BUIT, ETIQUETES_HPKE.EAE_PRK, dh);
  try {
    return await labeledExpand(cripto, suite, eaePrk, ETIQUETES_HPKE.SHARED_SECRET, ajunta(enc, pkR), NH);
  } finally {
    eaePrk.fill(0);
  }
}

/**
 * L'horari de claus de mode_base (RFC 9180 §5.1): context = 0x00 ‖
 * psk_id_hash ‖ info_hash, secret = LabeledExtract(shared_secret, "secret",
 * ""), i key (Nk) i base_nonce (12 B) per LabeledExpand. Qui el crida en posa
 * a zero els bytes.
 * @returns {Promise<{ context: Uint8Array, secret: Uint8Array, key: Uint8Array, baseNonce: Uint8Array }>}
 */
export async function horariBase(cripto, secretCompartit, info, { aead = HPKE.AEAD_AES_256_GCM } = {}) {
  const nk = nkDe(aead);
  const suite = suiteIdHpke(aead);
  const pskIdHash = await labeledExtract(cripto, suite, BUIT, ETIQUETES_HPKE.PSK_ID_HASH, BUIT);
  const infoHash = await labeledExtract(cripto, suite, BUIT, ETIQUETES_HPKE.INFO_HASH, exigixBytes(info, 'La info'));
  const context = ajunta(Uint8Array.of(HPKE.MODE_BASE), pskIdHash, infoHash);
  const secret = await labeledExtract(cripto, suite, exigixBytes(secretCompartit, 'El secret compartit'), ETIQUETES_HPKE.SECRET, BUIT);
  const key = await labeledExpand(cripto, suite, secret, ETIQUETES_HPKE.KEY, context, nk);
  const baseNonce = await labeledExpand(cripto, suite, secret, ETIQUETES_HPKE.BASE_NONCE, context, NN);
  return { context, secret, key, baseNonce };
}

function netejaHorari(horari) {
  if (!horari) return;
  horari.secret.fill(0);
  horari.key.fill(0);
  horari.baseNonce.fill(0);
}

const paramsAead = (iv, aad) => ({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 });

/* Encap de DHKEM: una efímera ECDH no extraïble que no ix d'ací. Només en
   tornen enc (la pública en brut, 65 B) i dh (la coordenada x); la referència
   a la privada es perd en tornar (QA-E03). */
async function encap(subtle, clauR) {
  const efimera = await subtle.generateKey(ALG_ECDH, false, ['deriveBits']);
  const enc = exigixPuntP256(new Uint8Array(await subtle.exportKey('raw', efimera.publicKey)));
  const dh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: clauR }, efimera.privateKey, 256));
  return { enc, dh };
}

/**
 * SealBase(pkR, info, aad, pt) amb una sola encriptació (seq 0, nonce =
 * base_nonce), kem_context = enc ‖ pkR. PUNT_INVALID si pkR no és un punt
 * vàlid.
 * @returns {Promise<{ enc: Uint8Array, ct: Uint8Array }>}
 */
export async function segellaBase(cripto, { pkR, info, aad = BUIT, pt, aead = HPKE.AEAD_AES_256_GCM }) {
  const subtle = subtleDe(cripto);
  nkDe(aead);
  exigixBytes(info, 'La info');
  exigixBytes(aad, 'L’AAD');
  exigixBytes(pt, 'El text en clar');
  const { enc, dh } = await encap(subtle, await importaPublicaDh(cripto, pkR));
  let compartit;
  let horari;
  try {
    compartit = await secretCompartitDhkem(cripto, dh, enc, pkR);
    horari = await horariBase(cripto, compartit, info, { aead });
    const clau = await subtle.importKey('raw', horari.key, { name: 'AES-GCM' }, false, ['encrypt']);
    const ct = new Uint8Array(await subtle.encrypt(paramsAead(horari.baseNonce, aad), clau, pt));
    return { enc, ct };
  } finally {
    dh.fill(0);
    compartit?.fill(0);
    netejaHorari(horari);
  }
}

const sobreInvalid = () => errorAmbCodi('SOBRE_INVALID', 'El sobre no s’ha pogut obrir: no és per a esta clau o l’han manipulat.');

/* Decap i horari del receptor. pkR és la pròpia pública en brut (kem_context).
   L'enc passa per la validació pròpia abans d'arribar al motor: un motor que
   no rebutjara un punt fora de la corba deixaria provar IK_dh amb punts
   triats (atac de corba invàlida, §15.18). */
async function obertura(cripto, { skR, pkR, enc, info, aead }) {
  const subtle = subtleDe(cripto);
  const clauE = await importaPublicaDh(cripto, enc);
  const dh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: clauE }, skR, 256));
  let compartit;
  try {
    compartit = await secretCompartitDhkem(cripto, dh, enc, pkR);
    return await horariBase(cripto, compartit, info, { aead });
  } finally {
    dh.fill(0);
    compartit?.fill(0);
  }
}

function exigixEntradesObertura({ pkR, enc, info, aad, ct, aead }) {
  nkDe(aead);
  exigixPuntP256(pkR);
  for (const [valor, nom] of [[enc, 'L’enc'], [info, 'La info'], [aad, 'L’AAD'], [ct, 'El xifrat']]) exigixBytes(valor, nom);
}

/**
 * OpenBase: el text en clar d'un sobre (seq 0). SOBRE_INVALID si no és per a
 * esta clau, si l'enc no és un punt vàlid o si res del sobre, la info o l'AAD
 * no és el d'origen.
 */
export async function obriBase(cripto, { skR, pkR, enc, info, aad = BUIT, ct, aead = HPKE.AEAD_AES_256_GCM }) {
  const subtle = subtleDe(cripto);
  exigixEntradesObertura({ pkR, enc, info, aad, ct, aead });
  let horari;
  try {
    horari = await obertura(cripto, { skR, pkR, enc, info, aead });
    const clau = await subtle.importKey('raw', horari.key, { name: 'AES-GCM' }, false, ['decrypt']);
    return new Uint8Array(await subtle.decrypt(paramsAead(horari.baseNonce, aad), clau, ct));
  } catch {
    throw sobreInvalid();
  } finally {
    netejaHorari(horari);
  }
}

/**
 * OpenBase directe a una clau HKDF no extraïble, sense que el text en clar (la
 * `CK` de l'època) passe per JavaScript: unwrapKey('raw', ct, clauHPKE,
 * AES-GCM amb base_nonce i l'AAD, 'HKDF', false, ['deriveBits', 'deriveKey'])
 * (§4.2, G-18). El xifrat ha de fer `bytesClau` + 16 (48 B per a una `CK`).
 * SOBRE_INVALID com obriBase.
 */
export async function obriBaseAClauHkdf(cripto, { skR, pkR, enc, info, aad = BUIT, ct, aead = HPKE.AEAD_AES_256_GCM, bytesClau = BYTES_CLAU }) {
  const subtle = subtleDe(cripto);
  exigixEntradesObertura({ pkR, enc, info, aad, ct, aead });
  if (!Number.isSafeInteger(bytesClau) || bytesClau < 1) throw new RangeError('La clau embolcallada fa almenys 1 byte.');
  if (ct.length !== bytesClau + BYTES_ETIQUETA) throw sobreInvalid();
  let horari;
  try {
    horari = await obertura(cripto, { skR, pkR, enc, info, aead });
    const clau = await subtle.importKey('raw', horari.key, { name: 'AES-GCM' }, false, ['unwrapKey']);
    return await subtle.unwrapKey('raw', ct, clau, paramsAead(horari.baseNonce, aad), 'HKDF', false, ['deriveBits', 'deriveKey']);
  } catch {
    throw sobreInvalid();
  } finally {
    netejaHorari(horari);
  }
}

/* ── AES-256-GCM (§4.1, §4.6.3) ────────────────────────────────────────── */

function exigixAes256(clau) {
  if (clau?.algorithm?.name !== 'AES-GCM' || clau.algorithm.length !== 256) {
    throw errorAmbCodi('CLAU_INVALIDA', 'La clau ha de ser AES-256-GCM.');
  }
  return clau;
}

/** Una AES-256-GCM no extraïble des de 32 bytes. */
export async function importaClauAesGcm(cripto, bytes, usos = USOS_AES) {
  if (exigixBytes(bytes, 'La clau AES').length !== BYTES_CLAU) throw errorAmbCodi('CLAU_INVALIDA', 'Una clau AES-256-GCM són 32 bytes.');
  return subtleDe(cripto).importKey('raw', bytes, { name: 'AES-GCM' }, false, [...usos]);
}

/**
 * Xifra amb AES-256-GCM: IV aleatori de 12 B i etiqueta de 128 bits. L'IV ve
 * sempre del generador de `cripto` i cap opció el fixa: repetir un IV amb la
 * mateixa clau trenca GCM. Els vectors l'injecten pel `cripto`.
 * @returns {Promise<{ iv: Uint8Array, xifrat: Uint8Array }>} xifrat = text ‖ etiqueta.
 */
export async function xifraAesGcm(cripto, clau, { dades, aad = BUIT } = {}) {
  const subtle = subtleDe(cripto);
  exigixAes256(clau);
  exigixBytes(dades, 'Les dades');
  exigixBytes(aad, 'L’AAD');
  const iv = aleatori(cripto, BYTES_IV);
  const xifrat = new Uint8Array(await subtle.encrypt(paramsAead(iv, aad), clau, dades));
  return { iv, xifrat };
}

/** Desxifra AES-256-GCM. XIFRAT_MANIPULAT si la clau, l'IV, l'AAD o el xifrat no són els d'origen. */
export async function desxifraAesGcm(cripto, clau, { xifrat, aad = BUIT, iv } = {}) {
  const subtle = subtleDe(cripto);
  exigixAes256(clau);
  exigixBytes(aad, 'L’AAD');
  const manipulat = () => errorAmbCodi('XIFRAT_MANIPULAT', 'El xifrat no supera la comprovació d’integritat: no s’ha desxifrat res.');
  if (!esBytes(iv) || iv.length !== BYTES_IV || !esBytes(xifrat) || xifrat.length < BYTES_ETIQUETA) throw manipulat();
  try {
    return new Uint8Array(await subtle.decrypt(paramsAead(iv, aad), clau, xifrat));
  } catch {
    throw manipulat();
  }
}

/* ── ECDSA P-256 (§4.1) ────────────────────────────────────────────────── */

/** Signatura ECDSA P-256/SHA-256 en IEEE P1363 (r ‖ s, 64 B). És mal·leable: mai no és un identificador. */
export async function signa(cripto, privada, dades) {
  return new Uint8Array(await subtleDe(cripto).sign(SIGNATURA, privada, exigixBytes(dades, 'Les dades')));
}

/**
 * Verifica una signatura de 64 B amb una pública (en brut validada o
 * CryptoKey). Fals per a una signatura de mida errònia o que no verifica;
 * PUNT_INVALID si la pública en brut no és de la corba (és una manipulació, no
 * una signatura dolenta).
 */
export async function verificaSignatura(cripto, publica, signatura, dades) {
  const subtle = subtleDe(cripto);
  exigixBytes(dades, 'Les dades');
  const clau = esBytes(publica) ? await importaPublicaSignatura(cripto, publica) : publica;
  if (!esBytes(signatura) || signatura.length !== BYTES_SIGNATURA) return false;
  try {
    return await subtle.verify(SIGNATURA, clau, signatura, dades);
  } catch {
    return false;
  }
}

/* ── PBKDF2-HMAC-SHA256 (§4.1, §5.1) ───────────────────────────────────── */

/* Les iteracions entre el sòl i el màxim; el sòl de qui crida mai baixa de MIN_ITERACIONS_PROVES. */
function exigixIteracions(iteracions, minIteracions) {
  const sol = Math.max(MIN_ITERACIONS_PROVES, Number.isSafeInteger(minIteracions) ? minIteracions : ITERACIONS_KDF);
  if (!Number.isSafeInteger(iteracions) || iteracions < sol || iteracions > MAX_ITERACIONS) {
    throw errorAmbCodi('ITERACIONS_FORA_DE_RANG', `Les iteracions de PBKDF2 han de ser entre ${sol} i ${MAX_ITERACIONS}.`);
  }
  return iteracions;
}

/* Una frase buida o una sal buida donarien una clau que qualsevol pot calcular. */
async function basePbkdf2(subtle, secret, sal, iteracions, minIteracions) {
  if (exigixBytes(secret, 'El secret').length === 0) throw errorAmbCodi('SECRET_BUIT', 'PBKDF2 no deriva res d’un secret buit.');
  if (exigixBytes(sal, 'La sal').length === 0) throw errorAmbCodi('SAL_INVALIDA', 'PBKDF2 necessita una sal.');
  const params = { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: exigixIteracions(iteracions, minIteracions) };
  const base = await subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  return { params, base };
}

/** PBKDF2-HMAC-SHA256 en bytes. Per defecte 600.000 iteracions i cap per davall (ITERACIONS_FORA_DE_RANG). */
export async function pbkdf2Sha256(cripto, secret, sal, { iteracions = ITERACIONS_KDF, minIteracions = ITERACIONS_KDF, bytes = BYTES_CLAU } = {}) {
  const subtle = subtleDe(cripto);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 1024) throw new RangeError('PBKDF2 dona entre 1 i 1.024 bytes.');
  const { params, base } = await basePbkdf2(subtle, secret, sal, iteracions, minIteracions);
  return new Uint8Array(await subtle.deriveBits(params, base, bytes * 8));
}

/** La `KEK_f` de la frase (§5.1): PBKDF2-HMAC-SHA256 amb sal de 16 B → AES-256-GCM no extraïble. SAL_INVALIDA si la sal no fa 16 B. */
export async function kekPbkdf2(cripto, secret, sal, { iteracions = ITERACIONS_KDF, minIteracions = ITERACIONS_KDF, usos = USOS_AES } = {}) {
  const subtle = subtleDe(cripto);
  if (exigixBytes(sal, 'La sal').length !== BYTES_SAL) throw errorAmbCodi('SAL_INVALIDA', 'La sal de la frase són 16 bytes.');
  const { params, base } = await basePbkdf2(subtle, secret, sal, iteracions, minIteracions);
  return subtle.deriveKey(params, base, { name: 'AES-GCM', length: 256 }, false, [...usos]);
}

/* ── Farciment: missatges en blocs de 256 B i Padmé (§4.6.3, §4.7) ─────── */

const bitsDe = (n) => n.toString(2).length;

/**
 * Padmé (Nikitin et al., PETS 2019): E = ⌊log₂ L⌋, S = ⌊log₂ E⌋ + 1, i L
 * arrodonida amunt a un múltiple de 2^(E − S). Sobrecost ≤ 12 %, i la mida
 * farcida només deixa veure O(log log L) bits.
 */
export function midaPadme(longitud) {
  if (!Number.isSafeInteger(longitud) || longitud < 1) throw new RangeError('Padmé mesura una llargària d’almenys 1 byte.');
  const e = bitsDe(longitud) - 1;
  if (e === 0) return longitud;
  const pas = 2 ** (e - bitsDe(e));
  return Math.ceil(longitud / pas) * pas;
}

/* La mida farcida d'un missatge de `longitud` bytes: P ‖ 0x80 fins al múltiple de 256 següent, mínim 256. */
const midaMissatge = (longitud) => Math.max(BLOC_MISSATGE, Math.ceil((longitud + 1) / BLOC_MISSATGE) * BLOC_MISSATGE);

function farcix(bytes, mida) {
  const farcit = new Uint8Array(mida);
  farcit.set(bytes);
  farcit[bytes.length] = 0x80;
  return farcit;
}

/** Pf = P ‖ 0x80 ‖ 0x00… fins al múltiple de 256 següent (de 256 a 16.384 B). MASSA_GRAN si no hi cap. */
export function farcixMissatge(bytes) {
  const mida = midaMissatge(exigixBytes(bytes, 'La càrrega').length);
  if (mida > MAX_MISSATGE_FARCIT) throw errorAmbCodi('MASSA_GRAN', `El missatge farcit passaria de ${MAX_MISSATGE_FARCIT} bytes.`);
  return farcix(bytes, mida);
}

/** bytes ‖ 0x80 ‖ 0x00… fins a la mida Padmé de bytes + 1. */
export function farcixPadme(bytes) {
  return farcix(bytes, midaPadme(exigixBytes(bytes, 'El fitxer').length + 1));
}

const farcimentInvalid = (motiu) => errorAmbCodi('FARCIMENT_INVALID', `El farciment no és vàlid (${motiu}).`);

/* La posició del 0x80 final: l'últim byte no nul ha de ser 0x80. */
function posicioDelMarcador(farcit) {
  let i = farcit.length - 1;
  while (i >= 0 && farcit[i] === 0) i -= 1;
  if (i < 0 || farcit[i] !== 0x80) throw farcimentInvalid('l’últim byte no nul no és 0x80');
  return i;
}

/** El contrari de farcixMissatge, estricte: 0x80 final i la mida canònica. FARCIMENT_INVALID si no. */
export function llevaFarcimentMissatge(farcit) {
  exigixBytes(farcit, 'El farcit');
  if (farcit.length < BLOC_MISSATGE || farcit.length > MAX_MISSATGE_FARCIT || farcit.length % BLOC_MISSATGE !== 0) throw farcimentInvalid('mida');
  const longitud = posicioDelMarcador(farcit);
  if (farcit.length !== midaMissatge(longitud)) throw farcimentInvalid('mida no canònica');
  return farcit.slice(0, longitud);
}

/** El contrari de farcixPadme, estricte: 0x80 final i la mida Padmé exacta. FARCIMENT_INVALID si no. */
export function llevaFarcimentPadme(farcit) {
  exigixBytes(farcit, 'El farcit');
  const longitud = posicioDelMarcador(farcit);
  if (farcit.length !== midaPadme(longitud + 1)) throw farcimentInvalid('mida no canònica');
  return farcit.slice(0, longitud);
}

/* ── Número de seguretat (§4.4) ────────────────────────────────────────── */

/**
 * L'empremta numèrica de libsignal (rust/protocol/src/fingerprint.rs,
 * get_fingerprint): h = SHA-512(0x0000 ‖ clau ‖ id ‖ clau) i, `iteracions` − 1
 * vegades més, h = SHA-512(h ‖ clau). La primera volta porta la clau dues
 * vegades, com libsignal: és el que fixa el vector de libsignal, que §4.4
 * deixava per verificar.
 */
export async function empremtaNumerica(cripto, clau, id, iteracions = ITERACIONS_NUMERO) {
  const subtle = subtleDe(cripto);
  exigixBytes(clau, 'La clau');
  exigixBytes(id, 'L’identificador');
  if (!Number.isSafeInteger(iteracions) || iteracions < 2 || iteracions > 1000000) throw new RangeError('Entre 2 i 1.000.000 d’iteracions.');
  let h = new Uint8Array(await subtle.digest('SHA-512', ajunta(Uint8Array.of(0x00, 0x00), clau, id, clau)));
  for (let i = 1; i < iteracions; i += 1) h = new Uint8Array(await subtle.digest('SHA-512', ajunta(h, clau)));
  return h;
}

/** Les 30 xifres d'una empremta: 6 trossos de 5 B, cadascun u40 mod 100.000 amb 5 xifres. */
export function xifresEmpremta(empremta) {
  if (!esBytes(empremta) || empremta.length < 30) throw new TypeError('Una empremta fa almenys 30 bytes.');
  let xifres = '';
  for (let i = 0; i < 30; i += 5) {
    let n = 0;
    for (let j = i; j < i + 5; j += 1) n = n * 256 + empremta[j];
    xifres += String(n % 100000).padStart(5, '0');
  }
  return xifres;
}

/**
 * La meitat d'una persona (30 xifres): l'empremta de sigPub ‖ dhPub amb
 * l'uuid16 com a identificador. Es calcula una vegada per kid i es desa.
 */
export async function numeroSeguretatPersona(cripto, { usuari, sigPub, dhPub }) {
  const id = uuid16(usuari);
  const clau = ajunta(exigixPuntP256(sigPub), exigixPuntP256(dhPub));
  return xifresEmpremta(await empremtaNumerica(cripto, clau, id));
}

const FORMA_MEITAT = /^\d{30}$/;

function comparaBytes(a, b) {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * El número del parell: les dues meitats en l'ordre de bytes dels uuid, 60
 * xifres en 12 grups de 5 separats per espais. Idèntic als dos aparells.
 * PARELL_INVALID si és la mateixa persona.
 */
export function numeroDelParell(a, b) {
  const ua = uuid16(a?.usuari);
  const ub = uuid16(b?.usuari);
  if (!FORMA_MEITAT.test(a.numero ?? '') || !FORMA_MEITAT.test(b.numero ?? '')) throw new TypeError('Cada meitat són 30 xifres.');
  const ordre = comparaBytes(ua, ub);
  if (ordre === 0) throw errorAmbCodi('PARELL_INVALID', 'Un número de seguretat és de dues persones diferents.');
  return (ordre < 0 ? a.numero + b.numero : b.numero + a.numero).match(/\d{5}/g).join(' ');
}

/** El número del parell calculat des de les claus de les dues persones. */
export async function numeroSeguretatParell(cripto, a, b) {
  const [meitatA, meitatB] = await Promise.all([numeroSeguretatPersona(cripto, a), numeroSeguretatPersona(cripto, b)]);
  return numeroDelParell({ usuari: a.usuari, numero: meitatA }, { usuari: b.usuari, numero: meitatB });
}

/* ── La porta d'entrada ────────────────────────────────────────────────── */

/* La porta no lliga les primitives que tornen secrets d'HPKE en brut (secretDh,
   secretCompartitDhkem, horariBase): només els vectors les importen pel nom. */
const AMB_CRIPTO = Object.freeze({
  aleatori, importaPublicaDh, importaPublicaSignatura, exportaPublica, generaParellaDh, generaParellaSignatura,
  sha256, sha512, hmacSha256, hkdfExtract, hkdfExpand, importaClauHkdf, derivaBitsHkdf, derivaClauAesHkdf,
  labeledExtract, labeledExpand, segellaBase, obriBase, obriBaseAClauHkdf,
  importaClauAesGcm, xifraAesGcm, desxifraAesGcm, signa, verificaSignatura, pbkdf2Sha256, kekPbkdf2,
  empremtaNumerica, numeroSeguretatPersona, numeroSeguretatParell
});
const PURES = Object.freeze({
  aBase64url, deBase64url, uuid16, esPuntP256, exigixPuntP256, jwkDePublica, publicaDeJwk, ajunta, bytesIguals, infoHkdf,
  suiteIdKem, suiteIdHpke, midaPadme, farcixMissatge, llevaFarcimentMissatge, farcixPadme, llevaFarcimentPadme,
  xifresEmpremta, numeroDelParell
});

/**
 * Les primitives lligades a un `cripto`, el de l'entorn per defecte, comprovat
 * una vegada: SENSE_CRIPTO si no és complet. Cap altra funció d'este mòdul pren
 * cap global.
 */
export function creaCriptoXat(cripto = globalThis.crypto) {
  exigixCripto(cripto);
  const lligades = Object.fromEntries(Object.entries(AMB_CRIPTO).map(([nom, primitiva]) => [nom, (...args) => primitiva(cripto, ...args)]));
  return Object.freeze({ ...lligades, ...PURES });
}
