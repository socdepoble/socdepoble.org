/**
 * xifratXatFormats.js — els formats binaris del protocol `sdp-xat-v1`
 * (P1-12 / IDEA-19, pas 3 del disseny final: `_investigacio_ia_de_poble/
 * 261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` §4 i §5).
 *
 * Tot el que se signa, es fa hash o va a l'AAD és binari de format fix: 4 bytes
 * de màgia ASCII i 1 byte de versió 0x01, mai JSON reserialitzat (§4.1). Ací
 * només es construïx i s'analitza: cap clau, cap xifratge, cap firma. L'únic
 * càlcul és el SHA-256 que el format mateix definix (kid, hash d'una
 * declaració, envHash, hash de `cos` i de la capçalera, codi curt), amb l'objecte
 * `cripto` injectat com al cofre: ningú d'ací el pren de cap global, i sense
 * `subtle` falla tancat (SENSE_CRIPTO). Encara no té cap consumidor.
 *
 * L'analitzador és estricte, i el constructor no emet res que l'analitzador no
 * accepte (cada construcció es torna a analitzar abans d'eixir):
 *   · màgia i versió; mida exacta, sense cap byte sobrer ni cap camp tallat;
 *   · enters dins del seu rang: època i versió d'equip d'1 a 2³¹ − 1 (les
 *     columnes del servidor són `integer`), 1..256 membres d'època (D-20),
 *     1..64 d'equip, iteracions de 600.000 a 10.000.000;
 *   · codificació canònica: uuid en minúscules i mai el nul; tot zeros només on
 *     el format diu «absent», i llavors es llig null; públiques sense comprimir
 *     (0x04 ‖ x ‖ y) amb x, y < p; escalars d'1 a n − 1; base64url sense
 *     farciment ni bits sobrers; `cos` tornat a serialitzar i comparat byte a byte;
 *   · llistes ordenades per usuari16 i sense repetir.
 * Una fallada és FORMAT_INVALID amb `format`, `camp` i `motiu` (una paraula
 * estable); res no es torna a mitges, i el text que ve de fora (`cos` d'un altre,
 * un JWK del servidor) mai no entra al missatge ni al `camp` de l'error. Les
 * entrades només es lligen de propietats pròpies: res d'heretat d'un prototip
 * contaminat, cap forat d'una llista. Si un membre és la IAIA, qui pot signar
 * què, quin `kid` està fixat o si una època encadena amb l'anterior és cosa del
 * protocol (xifratXatProtocol.js), no d'ací: este mòdul només garantix bytes ben
 * formats i una sola codificació per a cada valor.
 */
import { MAX_VIDEO_MS, MIME_XAT } from './xatMultimedia.js';

export const VERSIO_FORMAT = 1;

/* Les màgies de §4.1. `SDPT` en té dues formes (l'AAD i el que se signa), que
   només distingix la mida. La còpia (`copia`) i la càrrega `P` no en porten:
   comencen directament pel byte de versió. */
export const MAGIES = Object.freeze({
  kid: 'SDPI', declaracioClau: 'SDPK', epoca: 'SDPE', infoSobre: 'SDPS', capcalera: 'SDPM',
  franqueig: 'SDPF', firmaMissatge: 'SDPG', adjunt: 'SDPA', metaGrup: 'SDPD', equip: 'SDPQ',
  entradaFrase: 'SDPR', embolcallRk: 'SDPW', copia: 'SDPB', llibreta: 'SDPT',
  fragmentSocial: 'SDPH', codiCurt: 'SDPV'
});

export const BYTES_UUID = 16;
export const BYTES_KID = 16;
export const BYTES_HASH = 32;
export const BYTES_PUNT = 65;
export const BYTES_FIRMA = 64;
export const BYTES_CLAU = 32;
export const BYTES_SAL = 16;
export const BYTES_CT_SOBRE = 48;
export const BYTES_NONCE_FRANQUEIG = 32;
export const BYTES_ETIQUETA_GCM = 16;

export const MAX_EPOCA = 2147483647;
export const MAX_MEMBRES_EPOCA = 256;
export const MAX_MEMBRES_EQUIP = 64;
export const TIPUS_FIL = Object.freeze({ directe: 1, entitat: 2, grup: 3 });
export const MOTIU_EPOCA = Object.freeze({
  genesi: 1, alta: 2, baixa: 3, depuracio: 4, eixida: 5, clau: 6, rotacio: 7, administradores: 8, equip: 9
});
/* Compte: els rols de l'època i els de l'equip no tenen els mateixos números (§4.5.1 i §4.8). */
export const ROL_EPOCA = Object.freeze({ membre: 0, administradora: 1, propietaria: 2 });
export const ROL_EQUIP = Object.freeze({ propietaria: 1, administradora: 2 });

/* `cos` i els adjunts (§4.6.1 i §4.7). TEXT_MAXIM és el de sempre
   (src/data/supabase/xat.js:49), comptat en unitats UTF-16 com fa el client. */
export const TEXT_MAXIM = 4096;
export const MAX_BYTES_COS = 16249;
export const MAX_BYTES_MINIATURA = 8192;
export const CLASSE_ADJUNT = Object.freeze({ foto: 2, veu: 3, video: 4 });
/* Els sostres en clar: el del vídeo baixa a 19.922.943 B perquè el blob farcit amb Padmé
   càpia en els 20.000.000 del bucket (§4.7). */
export const MAXIM_CLAR_ADJUNT = Object.freeze({ 2: 2_000_000, 3: 3_000_000, 4: 19_922_943 });
export const BLOC_CARREGA = 256;
export const MAX_CARREGA_FARCIDA = 16384;

/* La frase (§5.1-5.2): les iteracions dins de l'AAD i els seus límits, com el cofre. */
export const ITERACIONS_FRASE = 600000;
export const MIN_ITERACIONS_PROVES = 1000;
export const MAX_ITERACIONS_FRASE = 10000000;
export const PARAULES_FRASE = 6;
export const MIN_LLINDAR_SOCIAL = 3;

/* Les etiquetes HKDF de §4.5.1, §4.6.3, §4.7 i §4.9 (es posen seguides de 0x00). */
export const ETIQUETES = Object.freeze({
  compromisEpoca: 'sdp-xat-v1/compromis-epoca', missatge: 'sdp-xat-v1/missatge',
  adjunt: 'sdp-xat-v1/adjunt', metaGrup: 'sdp-xat-v1/meta-grup'
});

/* ── Errors ────────────────────────────────────────────────────────────── */

/* Un error amb codi estable, com el del cofre, perquè el protocol decidisca què diu. */
function errorAmbCodi(codi, missatge) {
  const error = new Error(missatge);
  error.codi = codi;
  return error;
}

/* FORMAT_INVALID. `motiu`: tipus, magia, versio, truncat, sobrants, mida, rang, no-canonic,
   desordenat, duplicat, incoherent, desconegut o falta. */
function rebuig(motiu, missatge, camp = null) {
  return Object.assign(errorAmbCodi('FORMAT_INVALID', missatge), { motiu, format: null, camp });
}

/* Posa el format i el camp a un rebuig que encara no els porta (el més intern guanya el camp). */
function situa(error, format, camp) {
  if (error?.codi === 'FORMAT_INVALID') {
    error.format ??= format;
    error.camp ??= camp;
  }
  return error;
}

function enCamp(format, camp, fn) {
  try {
    return fn();
  } catch (error) {
    throw situa(error, format, camp);
  }
}

/* ── Bytes ─────────────────────────────────────────────────────────────── */

const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const deHex = (hex) => Uint8Array.from(hex.match(/../g), (parell) => parseInt(parell, 16));
const esZeros = (bytes) => bytes.every((byte) => byte === 0);
/* Una còpia de veres (Buffer#slice de Node seria una vista). */
const copiaDe = (bytes) => new Uint8Array(bytes);

function concatena(trossos) {
  const eixida = new Uint8Array(trossos.reduce((total, tros) => total + tros.length, 0));
  let i = 0;
  for (const tros of trossos) {
    eixida.set(tros, i);
    i += tros.length;
  }
  return eixida;
}

/* Ordre de bytes (per als uuid canònics, el mateix que l'ordre del text en minúscules). */
function comparaBytes(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

/** Igualtat de dos Uint8Array (dades públiques: no cal temps constant). */
export const igualsBytes = (a, b) => a instanceof Uint8Array && b instanceof Uint8Array && comparaBytes(a, b) === 0;

const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
  && [Object.prototype, null].includes(Object.getPrototypeOf(valor));

/* Només una propietat pròpia: un valor heretat (Object.prototype contaminat) no és mai una entrada. */
const propi = (objecte, clau) => (Object.hasOwn(objecte, clau) ? objecte[clau] : undefined);

/* Enter sense signe en big-endian de `mida` bytes. */
function aEnter(valor, mida) {
  const eixida = new Uint8Array(mida);
  let resta = valor;
  for (let i = mida - 1; i >= 0; i -= 1) {
    eixida[i] = resta % 256;
    resta = Math.floor(resta / 256);
  }
  return eixida;
}

/* El contrari; null si no cap en un enter segur de JavaScript (2⁵³ − 1). */
function deEnter(bytes) {
  if (bytes.length === 8 && (bytes[0] !== 0 || bytes[1] > 0x1f)) return null;
  let valor = 0;
  for (const byte of bytes) valor = valor * 256 + byte;
  return valor;
}

function exigixBytes(valor, mida) {
  if (!(valor instanceof Uint8Array)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  if (valor.length !== mida) throw rebuig('mida', `Calen ${mida} bytes, no ${valor.length}.`);
  return valor;
}

function noZeros(bytes) {
  if (esZeros(bytes)) throw rebuig('no-canonic', 'Tot zeros vol dir «absent», i ací cal un valor.');
  return bytes;
}

/* Les claus que porta un objecte d'entrada: cap de desconeguda i cap de les requerides absent. Amb
   `anomena: false` (el que ve de fora) l'error no repetix el nom de la clau, que és text d'un altre. */
function exigixClaus(valors, permeses, requerides, { anomena = true } = {}) {
  if (!esObjectePla(valors)) throw rebuig('tipus', 'Calen els valors en un objecte.');
  for (const clau of Object.keys(valors)) {
    if (permeses.includes(clau)) continue;
    throw anomena ? rebuig('desconegut', `Camp desconegut: ${clau}.`, clau) : rebuig('desconegut', 'Hi ha un camp desconegut.');
  }
  for (const clau of requerides) if (propi(valors, clau) === undefined) throw rebuig('falta', `Falta el camp ${clau}.`, clau);
}

/* ── P-256: codificació canònica dels punts i dels escalars ─────────────── */

/* p i n de la corba (SEC 2). Que el punt siga de la corba ho comprova importKey al protocol:
   ací només es rebutja el que no és una codificació única. */
const P256_P = deHex('ffffffff00000001000000000000000000000000ffffffffffffffffffffffff');
const P256_N = deHex('ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');

function exigixCoordenada(bytes) {
  if (comparaBytes(bytes, P256_P) >= 0) throw rebuig('no-canonic', 'Una coordenada de P-256 ha de ser menor que p.');
  return bytes;
}

function exigixEscalar(bytes) {
  if (esZeros(bytes) || comparaBytes(bytes, P256_N) >= 0) throw rebuig('rang', 'Un escalar de P-256 va d’1 a n − 1.');
  return bytes;
}

/* Les públiques van en brut sense comprimir (Safari no importa les comprimides, §4.1). */
function exigixPunt(bytes) {
  if (bytes[0] !== 0x04) throw rebuig('no-canonic', 'Una pública va sense comprimir: 0x04 ‖ x ‖ y.');
  exigixCoordenada(bytes.subarray(1, 33));
  exigixCoordenada(bytes.subarray(33, 65));
  return bytes;
}

/* ── uuid16 ────────────────────────────────────────────────────────────── */

const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function uuid16(uuid) {
  if (typeof uuid !== 'string' || !FORMA_UUID.test(uuid)) throw rebuig('no-canonic', 'Un uuid va en la forma canònica, en minúscules.');
  return noZeros(deHex(uuid.slice(0, 8) + uuid.slice(9, 13) + uuid.slice(14, 18) + uuid.slice(19, 23) + uuid.slice(24)));
}

function uuidDe16(bytes) {
  noZeros(exigixBytes(bytes, BYTES_UUID));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Els 16 bytes d'un uuid canònic en minúscules (mai el nul, que vol dir «absent»). */
export const bytesUuid = (uuid) => enCamp('uuid', null, () => uuid16(uuid));
/** El contrari: 16 bytes (no tots zeros) → uuid canònic en minúscules. */
export const uuidDeBytes = (bytes) => enCamp('uuid', null, () => uuidDe16(bytes));

/* ── base64url canònic (§4.1: sense farciment; el servidor el torna a codificar i compara) ── */

const ALFABET_B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALOR_B64URL = new Map(Array.from(ALFABET_B64URL, (c, i) => [c, i]));

function b64u(bytes) {
  if (!(bytes instanceof Uint8Array)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  let eixida = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const queden = Math.min(3, bytes.length - i);
    const n = (bytes[i] << 16) | ((queden > 1 ? bytes[i + 1] : 0) << 8) | (queden > 2 ? bytes[i + 2] : 0);
    eixida += ALFABET_B64URL[(n >> 18) & 63] + ALFABET_B64URL[(n >> 12) & 63];
    if (queden > 1) eixida += ALFABET_B64URL[(n >> 6) & 63];
    if (queden > 2) eixida += ALFABET_B64URL[n & 63];
  }
  return eixida;
}

function deB64u(text, mida = null) {
  if (typeof text !== 'string') throw rebuig('tipus', 'Cal un text en base64url.');
  if (text.length % 4 === 1) throw rebuig('no-canonic', 'Cap base64url no té una llargària de 4k + 1.');
  // Amb mida fixa, un text massa llarg (un servidor hostil) es rebutja abans de reservar res.
  if (mida !== null && text.length > 4 * Math.ceil(mida / 3)) throw rebuig('mida', `Calen ${mida} bytes.`);
  const bytes = new Uint8Array(Math.floor((text.length * 3) / 4));
  let acumulat = 0;
  let bits = 0;
  let j = 0;
  for (const c of text) {
    const valor = VALOR_B64URL.get(c);
    if (valor === undefined) throw rebuig('no-canonic', 'Caràcter fora del base64url (sense farciment).');
    acumulat = ((acumulat << 6) | valor) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[j++] = (acumulat >> bits) & 255;
    }
  }
  // Els 2 o 4 bits sobrers de l'últim caràcter són sempre zero: si no, és una altra cadena per als mateixos bytes.
  if ((acumulat & ((1 << bits) - 1)) !== 0) throw rebuig('no-canonic', 'Els bits sobrers del base64url han de ser zero.');
  if (mida !== null && bytes.length !== mida) throw rebuig('mida', `Calen ${mida} bytes, no ${bytes.length}.`);
  return bytes;
}

/** Bytes → base64url sense farciment. */
export const aBase64Url = (bytes) => enCamp('base64url', null, () => b64u(bytes));
/** base64url canònic → bytes (amb `mida`, exacta). Rebutja el farciment, els bits sobrers i tot caràcter de fora. */
export const deBase64Url = (text, mida = null) => enCamp('base64url', null, () => deB64u(text, mida));

/* ── La pública efímera com a JWK estricte (§4.5.2, xat_claus_fil.emissor_pub_jwk) ── */

/** 65 B → {crv, kty, x, y}: mai `d`, i en l'ordre de claus de l'RFC 7638. */
export const jwkDelPunt = (punt) => enCamp('jwk', null, () => {
  exigixPunt(exigixBytes(punt, BYTES_PUNT));
  return Object.freeze({ crv: 'P-256', kty: 'EC', x: b64u(punt.subarray(1, 33)), y: b64u(punt.subarray(33)) });
});

/** Un JWK públic de P-256 amb exactament kty, crv, x i y → 65 B (com private.xat_jwk_punt). */
export const puntDelJwk = (jwk) => enCamp('jwk', null, () => {
  exigixClaus(jwk, ['crv', 'kty', 'x', 'y'], ['crv', 'kty', 'x', 'y'], { anomena: false });
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw rebuig('rang', 'Només P-256 (kty EC).', 'crv');
  return exigixPunt(concatena([Uint8Array.of(0x04), enCamp(null, 'x', () => deB64u(jwk.x, 32)), enCamp(null, 'y', () => deB64u(jwk.y, 32))]));
});

/* ── Els tipus de camp: mida fixa, com s'escriu el valor i com es llig ─── */

const fix = (mida, comprova = (bytes) => bytes) => Object.freeze({
  mida, escriu: (valor) => comprova(exigixBytes(valor, mida)), llig: (bytes) => copiaDe(comprova(bytes))
});
/* Absent (null o sense posar) s'escriu tot zeros; uns bytes tot zeros no s'accepten com a valor. */
const opcional = (mida, comprova = (bytes) => bytes) => Object.freeze({
  mida, opcional: true,
  escriu: (valor) => (valor === null || valor === undefined ? new Uint8Array(mida) : noZeros(comprova(exigixBytes(valor, mida)))),
  llig: (bytes) => (esZeros(bytes) ? null : copiaDe(comprova(bytes)))
});
const enter = (mida, minim, maxim) => Object.freeze({
  mida,
  escriu: (valor) => {
    if (!Number.isSafeInteger(valor) || valor < minim || valor > maxim) throw rebuig('rang', `Cal un enter de ${minim} a ${maxim}.`);
    return aEnter(valor, mida);
  },
  llig: (bytes) => {
    const valor = deEnter(bytes);
    if (valor === null || valor < minim || valor > maxim) throw rebuig('rang', `Cal un enter de ${minim} a ${maxim}.`);
    return valor;
  }
});

/* Els 6 índexs d'11 bits de la frase en 9 B, big-endian; els 6 bits sobrers, a zero (§5.1). */
const INDEXS_FRASE = Object.freeze({
  mida: 9,
  escriu: (valor) => {
    // Array.from fa de cada forat un undefined: una casella buida no s'escriu com l'índex 0.
    const indexs = Array.isArray(valor) ? Array.from(valor) : null;
    if (indexs === null || indexs.length !== PARAULES_FRASE
        || indexs.some((index) => !Number.isSafeInteger(index) || index < 0 || index > 2047)) {
      throw rebuig('rang', `La frase són ${PARAULES_FRASE} índexs de 0 a 2.047.`);
    }
    const eixida = new Uint8Array(9);
    let bit = 0;
    for (const index of indexs) {
      for (let k = 10; k >= 0; k -= 1) {
        if ((index >> k) & 1) eixida[bit >> 3] |= 0x80 >> (bit & 7);
        bit += 1;
      }
    }
    return eixida;
  },
  llig: (bytes) => {
    if (bytes[8] & 0x3f) throw rebuig('no-canonic', 'Els 6 bits sobrers de la frase han de ser zero.');
    const indexs = [];
    let bit = 0;
    for (let p = 0; p < PARAULES_FRASE; p += 1) {
      let index = 0;
      for (let k = 0; k < 11; k += 1) {
        index = (index << 1) | ((bytes[bit >> 3] >> (7 - (bit & 7))) & 1);
        bit += 1;
      }
      indexs.push(index);
    }
    return Object.freeze(indexs);
  }
});

const CAMP = Object.freeze({
  uuid: Object.freeze({ mida: BYTES_UUID, escriu: uuid16, llig: uuidDe16 }),
  uuidOpcional: Object.freeze({
    mida: BYTES_UUID, opcional: true,
    escriu: (valor) => (valor === null || valor === undefined ? new Uint8Array(BYTES_UUID) : uuid16(valor)),
    llig: (bytes) => (esZeros(bytes) ? null : uuidDe16(bytes))
  }),
  kid: fix(BYTES_KID, noZeros),
  kidOpcional: opcional(BYTES_KID),
  hash: fix(BYTES_HASH, noZeros),
  hashOpcional: opcional(BYTES_HASH),
  bytes32: fix(32),
  bytes16: fix(16),
  punt: fix(BYTES_PUNT, exigixPunt),
  escalar: fix(32, exigixEscalar),
  coordenada: fix(32, exigixCoordenada),
  /* Època i versió d'equip: u32be d'1 a 2³¹ − 1 (int4send al SQL dona els mateixos bytes). */
  numero: enter(4, 1, MAX_EPOCA),
  ms: enter(8, 0, Number.MAX_SAFE_INTEGER),
  comptador: enter(8, 1, Number.MAX_SAFE_INTEGER),
  indexsFrase: INDEXS_FRASE
});

/* ── El motor: un esquema és la màgia, els camps en ordre, la llista i la resta ── */

function defineix(nom, { magia = nom, camps, llista = null, resta = null, comprova = null, secret = false }) {
  const prefix = magia === null ? Uint8Array.of(VERSIO_FORMAT) : concatena([ascii(magia), Uint8Array.of(VERSIO_FORMAT)]);
  const suma = (llistaCamps) => llistaCamps.reduce((total, [, tipus]) => total + tipus.mida, 0);
  return Object.freeze({
    nom, prefix, camps, llista, resta, comprova, secret,
    midaFixa: prefix.length + suma(camps) + (llista ? 2 : 0),
    midaEntrada: llista ? suma(llista.camps) : 0
  });
}

const requerides = (camps) => camps.filter(([, tipus]) => !tipus.opcional).map(([nom]) => nom);

/* Posa a zero els bytes d'uns valors llegits (els d'un esquema secret, la còpia en clar). */
const esborra = (valors) => {
  for (const valor of Object.values(valors)) if (valor instanceof Uint8Array) valor.fill(0);
};

function construeix(esquema, valors, opcions) {
  const { nom, camps, llista, resta } = esquema;
  const extra = [llista?.nom, resta?.nom].filter(Boolean);
  enCamp(nom, null, () => exigixClaus(valors, [...camps.map(([camp]) => camp), ...extra], [...requerides(camps), ...extra]));
  const trossos = [esquema.prefix, ...camps.map(([camp, tipus]) => enCamp(nom, camp, () => tipus.escriu(propi(valors, camp))))];
  if (llista) {
    const entrades = valors[llista.nom];
    if (!Array.isArray(entrades)) throw situa(rebuig('tipus', 'Els membres van en una llista.'), nom, llista.nom);
    if (entrades.length < llista.min || entrades.length > llista.max) {
      throw situa(rebuig('rang', `De ${llista.min} a ${llista.max} membres.`), nom, llista.nom);
    }
    const nomsEntrada = llista.camps.map(([camp]) => camp);
    // Array.from i no map: un forat de la llista arriba com a undefined i falla com a tipus.
    const codificades = Array.from(entrades, (entrada, k) => {
      enCamp(nom, `${llista.nom}[${k}]`, () => exigixClaus(entrada, nomsEntrada, requerides(llista.camps)));
      return concatena(llista.camps.map(([camp, tipus]) => enCamp(nom, `${llista.nom}[${k}].${camp}`, () => tipus.escriu(propi(entrada, camp)))));
    });
    /* L'ordre canònic és el de l'usuari16, que va primer: qui crida no ha d'ordenar res. */
    codificades.sort(comparaBytes);
    trossos.push(aEnter(entrades.length, 2), ...codificades);
  }
  if (resta) trossos.push(enCamp(nom, resta.nom, () => resta.escriu(valors[resta.nom])));
  const bytes = concatena(trossos);
  const llegit = llegix(esquema, bytes, opcions);
  // La relectura de comprovació no deixa cap còpia secreta viva: qui crida només ha d'esborrar l'entrada i l'eixida.
  if (esquema.secret) esborra(llegit);
  return bytes;
}

function llegix(esquema, bytes, opcions) {
  const { nom, prefix, camps, llista, resta, midaFixa, midaEntrada } = esquema;
  const falla = (motiu, missatge, camp = null) => situa(rebuig(motiu, missatge), nom, camp);
  if (!(bytes instanceof Uint8Array)) throw falla('tipus', 'Calen bytes (Uint8Array).');
  if (bytes.length < prefix.length) throw falla('truncat', 'Falten bytes.');
  if (!igualsBytes(bytes.subarray(0, prefix.length - 1), prefix.subarray(0, prefix.length - 1))) {
    throw falla('magia', `No és ${nom}: la màgia no hi és.`);
  }
  if (bytes[prefix.length - 1] !== VERSIO_FORMAT) throw falla('versio', `${nom}: versió desconeguda.`);
  if (bytes.length < midaFixa) throw falla('truncat', 'Falten bytes.');
  let n = 0;
  let total = midaFixa;
  if (llista) {
    n = deEnter(bytes.subarray(midaFixa - 2, midaFixa));
    if (n < llista.min || n > llista.max) throw falla('rang', `De ${llista.min} a ${llista.max} membres.`, llista.nom);
    total = midaFixa + n * midaEntrada;
  }
  if (!resta && bytes.length !== total) {
    throw falla(bytes.length < total ? 'truncat' : 'sobrants', bytes.length < total ? 'Falten bytes.' : 'Sobren bytes al final.');
  }
  const valors = {};
  let i = prefix.length;
  const llig = (camp, tipus) => {
    const tros = bytes.subarray(i, i + tipus.mida);
    i += tipus.mida;
    return enCamp(nom, camp, () => tipus.llig(tros));
  };
  try {
    for (const [camp, tipus] of camps) valors[camp] = llig(camp, tipus);
    if (llista) {
      i += 2;
      const midaClau = llista.camps[0][1].mida;
      const entrades = [];
      let anterior = null;
      for (let k = 0; k < n; k += 1) {
        const clau = bytes.subarray(i, i + midaClau);
        const ordre = anterior === null ? 1 : comparaBytes(clau, anterior);
        if (ordre === 0) throw falla('duplicat', 'Un membre repetit.', `${llista.nom}[${k}]`);
        if (ordre < 0) throw falla('desordenat', 'Els membres van ordenats per usuari16.', `${llista.nom}[${k}]`);
        anterior = clau;
        const entrada = {};
        for (const [camp, tipus] of llista.camps) entrada[camp] = llig(`${llista.nom}[${k}].${camp}`, tipus);
        entrades.push(Object.freeze(entrada));
      }
      valors[llista.nom] = Object.freeze(entrades);
    }
    if (resta) valors[resta.nom] = enCamp(nom, resta.nom, () => resta.llig(bytes.subarray(i)));
    if (esquema.comprova) enCamp(nom, null, () => esquema.comprova(valors, opcions));
  } catch (error) {
    // Una lectura secreta que falla a mitges tampoc no deixa vius els camps que ja havia copiat.
    if (esquema.secret) esborra(valors);
    throw error;
  }
  return Object.freeze(valors);
}

/* ── Regles entre camps (les que es poden comprovar amb els bytes sols) ── */

function comprovaEpoca(v) {
  // §4.5.3.1-2 i el CHECK `(epoca = 1) = (prev_hash is null)` del servidor.
  if ((v.epoca === 1) !== (v.prevHash === null)) throw rebuig('incoherent', 'prevHash va a zeros si i només si e = 1.', 'prevHash');
  // La gènesi és e = 1 i només e = 1 (§4.5.1, §4.5.4): si no, una rotació voluntària disfressada de
  // gènesi eludiria el sostre del motiu 7 (§4.5.5) i la cadena pintaria una gènesi a mig fil.
  if ((v.epoca === 1) !== (v.motiu === MOTIU_EPOCA.genesi)) throw rebuig('incoherent', 'Motiu 1 (gènesi) si i només si e = 1.', 'motiu');
  if ((v.tipusFil === TIPUS_FIL.entitat) !== (v.refEquip !== null)) {
    throw rebuig('incoherent', 'refEquip va (i només va) en un xat amb una entitat; si no, zeros.', 'refEquip');
  }
  if (v.tipusFil === TIPUS_FIL.directe && v.membres.length !== 2) {
    throw rebuig('incoherent', 'Un directe entre persones té exactament dos membres.', 'membres');
  }
  // Amb una entitat: l'interlocutor i almenys una persona de l'equip (§4.5.3.1, §4.8.6).
  if (v.tipusFil === TIPUS_FIL.entitat && v.membres.length < 2) {
    throw rebuig('incoherent', 'Un xat amb una entitat té l’interlocutor i almenys una persona de l’equip.', 'membres');
  }
  // L'autor sempre s'embolcalla un sobre per a si mateix (§4.5.2), amb la clau que declara.
  const autor = v.membres.find((membre) => membre.usuari === v.autor);
  if (!autor || !igualsBytes(autor.kid, v.kidAutor)) {
    throw rebuig('incoherent', 'L’autor és membre de la seua època, amb el seu kid.', 'membres');
  }
  // La gènesi d'un grup la fa una administradora (§4.5.3.1).
  if (v.tipusFil === TIPUS_FIL.grup && v.epoca === 1 && autor.rol === ROL_EPOCA.membre) {
    throw rebuig('incoherent', 'La gènesi d’un grup la signa una administradora.', 'membres');
  }
}

function comprovaEquip(v) {
  if ((v.versio === 1) !== (v.prevHash === null)) throw rebuig('incoherent', 'prevHash va a zeros si i només si v = 1.', 'prevHash');
  // Només una propietària signa la versió següent (§4.8.1): un equip sense cap no es podria tornar a canviar.
  if (!v.membres.some((membre) => membre.rol === ROL_EQUIP.propietaria)) {
    throw rebuig('incoherent', 'Un equip té almenys una propietària.', 'membres');
  }
  // La v = 1 la signa una propietària (§4.8.1): l'única prova signada és que s'hi llista com a tal, amb el seu kid.
  const autor = v.membres.find((membre) => membre.usuari === v.autor);
  if (v.versio === 1 && (!autor || autor.rol !== ROL_EQUIP.propietaria || !igualsBytes(autor.kid, v.kidAutor))) {
    throw rebuig('incoherent', 'La v = 1 la signa una propietària de la llista, amb el seu kid.', 'membres');
  }
}

function minimIteracions(opcions) {
  const minim = (opcions === undefined || opcions === null ? undefined : propi(opcions, 'minIteracions')) ?? ITERACIONS_FRASE;
  if (!Number.isSafeInteger(minim) || minim < MIN_ITERACIONS_PROVES || minim > MAX_ITERACIONS_FRASE) {
    throw new TypeError(`minIteracions va de ${MIN_ITERACIONS_PROVES} a ${MAX_ITERACIONS_FRASE}.`);
  }
  return minim;
}

function comprovaIteracions(v, opcions) {
  if (v.iteracions < minimIteracions(opcions)) {
    throw rebuig('rang', `Les iteracions van de ${minimIteracions(opcions)} a ${MAX_ITERACIONS_FRASE}.`, 'iteracions');
  }
}

/* ── Els esquemes de §4 i §5, camp a camp i en l'ordre exacte ──────────── */

const C = CAMP;
const ESQUEMA = Object.freeze({
  /* §4.3 · kid = SHA-256(SDPI)[0..16): 151 B. */
  entradaKid: defineix('SDPI', { camps: [['usuari', C.uuid], ['sigPub', C.punt], ['dhPub', C.punt]] }),
  /* §4.3 · Declaració de clau: 175 B (el SQL la llig a 1-5, 6-21, 22-86, 87-151, 152-167, 168-175). */
  declaracioClau: defineix('SDPK', {
    camps: [['usuari', C.uuid], ['sigPub', C.punt], ['dhPub', C.punt], ['kidAnterior', C.kidOpcional], ['creatMs', C.ms]]
  }),
  /* §4.5.1 · Declaració d'època: 295 + 65·n B (425 un directe). */
  epoca: defineix('SDPE', {
    camps: [
      ['fil', C.uuid], ['epoca', C.numero], ['tipusFil', enter(1, 1, 3)], ['prevHash', C.hashOpcional],
      ['autor', C.uuid], ['kidAutor', C.kid], ['sigPubAutor', C.punt], ['dhPubAutor', C.punt],
      ['motiu', enter(1, 1, 9)], ['creatMs', C.ms], ['ckCommit', C.bytes32], ['refEquip', C.hashOpcional]
    ],
    llista: {
      nom: 'membres', min: 1, max: MAX_MEMBRES_EPOCA,
      camps: [['usuari', C.uuid], ['kid', C.kid], ['rol', enter(1, 0, 2)], ['envHash', C.hash]]
    },
    comprova: comprovaEpoca
  }),
  /* §4.5.2 · info del sobre. El disseny en diu 88 B, però els seus camps en sumen 89
     (5 + 16 + 4 + 16 + 16 + 16 + 16): mana l'ordre dels camps, com a la sonda de la revisió. */
  infoSobre: defineix('SDPS', {
    camps: [['fil', C.uuid], ['epoca', C.numero], ['receptor', C.uuid], ['kidReceptor', C.kid], ['autor', C.uuid], ['kidAutor', C.kid]]
  }),
  /* §4.6.3 · La capçalera H, que és l'AAD: 169 B. */
  capcalera: defineix('SDPM', {
    camps: [
      ['fil', C.uuid], ['id', C.uuid], ['emissor', C.uuid], ['kidEmissor', C.kid], ['comOrg', C.uuidOpcional],
      ['epoca', C.numero], ['hashEpoca', C.hash], ['respostaA', C.uuidOpcional], ['tf', C.bytes32]
    ]
  }),
  /* §4.6.3 · El que entra a l'HMAC del franqueig: 57 B de capçalera i la càrrega P sencera. */
  entradaFranqueig: defineix('SDPF', {
    camps: [['fil', C.uuid], ['id', C.uuid], ['emissor', C.uuid], ['epoca', C.numero]],
    resta: Object.freeze({
      nom: 'carrega',
      escriu: (valor) => { llegixCarrega(valor); return valor; },
      llig: (bytes) => { llegixCarrega(bytes); return copiaDe(bytes); }
    })
  }),
  /* §4.6.2 · El que se signa en entitats i grups (Hc): 137 B. */
  entradaFirmaMissatge: defineix('SDPG', {
    camps: [
      ['fil', C.uuid], ['id', C.uuid], ['emissor', C.uuid], ['kidEmissor', C.kid], ['comOrg', C.uuidOpcional],
      ['epoca', C.numero], ['respostaA', C.uuidOpcional], ['hashCos', C.hash]
    ]
  }),
  /* §4.7 · AAD d'un adjunt: 53 B. */
  aadAdjunt: defineix('SDPA', { camps: [['fil', C.uuid], ['adjunt', C.uuid], ['emissor', C.uuid]] }),
  /* §4.9 · AAD del títol i la descripció d'un grup: 25 B. */
  aadMetaGrup: defineix('SDPD', { camps: [['fil', C.uuid], ['epoca', C.numero]] }),
  /* §4.8 · Equip d'una entitat: 229 + 33·n B. El disseny no diu l'ordre dels membres; s'hi aplica
     el de SDPE perquè la mateixa llista done un sol hash (refEquip). */
  equip: defineix('SDPQ', {
    camps: [
      ['org', C.uuid], ['versio', C.numero], ['prevHash', C.hashOpcional], ['autor', C.uuid], ['kidAutor', C.kid],
      ['sigPubAutor', C.punt], ['dhPubAutor', C.punt], ['creatMs', C.ms]
    ],
    llista: { nom: 'membres', min: 1, max: MAX_MEMBRES_EQUIP, camps: [['usuari', C.uuid], ['kid', C.kid], ['rol', enter(1, 1, 2)]] },
    comprova: comprovaEquip
  }),
  /* §5.1 · Entrada de la KDF de la frase: 15 B (la KDF va sobre els índexs, mai sobre el text). */
  entradaFrase: defineix('SDPR', { camps: [['llistaVersio', enter(1, 1, 255)], ['indexs', C.indexsFrase]] }),
  /* §5.1 · AAD de rk_ct: 57 B, amb les iteracions dins. */
  aadEmbolcallRk: defineix('SDPW', {
    camps: [['usuari', C.uuid], ['kid', C.kid], ['iteracions', enter(4, 1, MAX_ITERACIONS_FRASE)], ['sal', C.bytes16]],
    comprova: comprovaIteracions
  }),
  /* §5.1 · AAD de la còpia: 37 B. */
  aadCopia: defineix('SDPB', { camps: [['usuari', C.uuid], ['kid', C.kid]] }),
  /* §5.1 · La còpia en clar: 0x01 ‖ d‖x‖y d'IK_sig ‖ d‖x‖y d'IK_dh ‖ K_ll, 225 B. Porta secrets: qui
     la construïx o la llig posa a zero els bytes d'entrada i d'eixida en acabar; les còpies de dins
     (la relectura del constructor, una lectura que falla a mitges) les esborra el motor. */
  copia: defineix('copia', {
    magia: null, secret: true,
    camps: [
      ['sigD', C.escalar], ['sigX', C.coordenada], ['sigY', C.coordenada],
      ['dhD', C.escalar], ['dhX', C.coordenada], ['dhY', C.coordenada], ['clauLlibreta', C.bytes32]
    ]
  }),
  /* §5.5 · La llibreta: l'AAD (29 B) i el que se signa (61 B), amb la mateixa màgia. */
  aadLlibreta: defineix('SDPT', { camps: [['usuari', C.uuid], ['comptador', C.comptador]] }),
  entradaFirmaLlibreta: defineix('SDPT-firma', {
    magia: 'SDPT', camps: [['usuari', C.uuid], ['comptador', C.comptador], ['hashXifrat', C.hash]]
  }),
  /* §5.6.3 / §21 · info del sobre d'un fragment social: 87 B; k = 3 fix. N no forma part de SDPH. */
  infoFragment: defineix('SDPH', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['x', enter(1, 1, 255)],
      ['llindar', enter(1, MIN_LLINDAR_SOCIAL, MIN_LLINDAR_SOCIAL)], ['amic', C.uuid], ['kidAmic', C.kid]
    ]
  }),
  /* §5.6.2 / §21.2 · Transcripció T del SAS de verificació social: 175 B (interoperable amb xifratXatRecuperacio). */
  entradaCodiCurt: defineix('SDPV', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['peticio', C.uuid], ['epk', C.punt],
      ['amic', C.uuid], ['kidAmic', C.kid], ['x', enter(1, 1, 255)], ['caducaMs', C.ms]
    ]
  })
});

/** Les mides fixes dels formats (en bytes) i les de les dues declaracions amb llista. */
export const MIDES = Object.freeze({
  ...Object.fromEntries(Object.entries(ESQUEMA).filter(([, esquema]) => !esquema.llista && !esquema.resta)
    .map(([nom, esquema]) => [nom, esquema.midaFixa])),
  capcaleraFranqueig: ESQUEMA.entradaFranqueig.midaFixa,
  entradaHashSobre: BYTES_PUNT + BYTES_CT_SOBRE,
  capcaleraCarrega: 38
});
export const midaEpoca = (n) => ESQUEMA.epoca.midaFixa + ESQUEMA.epoca.midaEntrada * n;
export const midaEquip = (n) => ESQUEMA.equip.midaFixa + ESQUEMA.equip.midaEntrada * n;

/* SDPI */
export const construeixEntradaKid = (valors) => construeix(ESQUEMA.entradaKid, valors);
export const llegixEntradaKid = (bytes) => llegix(ESQUEMA.entradaKid, bytes);
/* SDPK */
export const construeixDeclaracioClau = (valors) => construeix(ESQUEMA.declaracioClau, valors);
export const llegixDeclaracioClau = (bytes) => llegix(ESQUEMA.declaracioClau, bytes);
/* SDPE: els membres s'ordenen sols; la lectura els torna ordenats. */
export const construeixEpoca = (valors) => construeix(ESQUEMA.epoca, valors);
export const llegixEpoca = (bytes) => llegix(ESQUEMA.epoca, bytes);
/* SDPS */
export const construeixInfoSobre = (valors) => construeix(ESQUEMA.infoSobre, valors);
export const llegixInfoSobre = (bytes) => llegix(ESQUEMA.infoSobre, bytes);
/* SDPM */
export const construeixCapcalera = (valors) => construeix(ESQUEMA.capcalera, valors);
export const llegixCapcalera = (bytes) => llegix(ESQUEMA.capcalera, bytes);
/* SDPF */
export const construeixEntradaFranqueig = (valors) => construeix(ESQUEMA.entradaFranqueig, valors);
export const llegixEntradaFranqueig = (bytes) => llegix(ESQUEMA.entradaFranqueig, bytes);
/* SDPG */
export const construeixEntradaFirmaMissatge = (valors) => construeix(ESQUEMA.entradaFirmaMissatge, valors);
export const llegixEntradaFirmaMissatge = (bytes) => llegix(ESQUEMA.entradaFirmaMissatge, bytes);
/* SDPA */
export const construeixAadAdjunt = (valors) => construeix(ESQUEMA.aadAdjunt, valors);
export const llegixAadAdjunt = (bytes) => llegix(ESQUEMA.aadAdjunt, bytes);
/* SDPD */
export const construeixAadMetaGrup = (valors) => construeix(ESQUEMA.aadMetaGrup, valors);
export const llegixAadMetaGrup = (bytes) => llegix(ESQUEMA.aadMetaGrup, bytes);
/* SDPQ */
export const construeixEquip = (valors) => construeix(ESQUEMA.equip, valors);
export const llegixEquip = (bytes) => llegix(ESQUEMA.equip, bytes);
/* SDPR */
export const construeixEntradaFrase = (valors) => construeix(ESQUEMA.entradaFrase, valors);
export const llegixEntradaFrase = (bytes) => llegix(ESQUEMA.entradaFrase, bytes);
/* SDPW: { minIteracions } baixa el sòl només a les proves, mai per davall de MIN_ITERACIONS_PROVES. */
export const construeixAadEmbolcallRk = (valors, opcions) => construeix(ESQUEMA.aadEmbolcallRk, valors, opcions);
export const llegixAadEmbolcallRk = (bytes, opcions) => llegix(ESQUEMA.aadEmbolcallRk, bytes, opcions);
/* SDPB */
export const construeixAadCopia = (valors) => construeix(ESQUEMA.aadCopia, valors);
export const llegixAadCopia = (bytes) => llegix(ESQUEMA.aadCopia, bytes);
/* La còpia en clar */
export const construeixCopia = (valors) => construeix(ESQUEMA.copia, valors);
export const llegixCopia = (bytes) => llegix(ESQUEMA.copia, bytes);
/* SDPT */
export const construeixAadLlibreta = (valors) => construeix(ESQUEMA.aadLlibreta, valors);
export const llegixAadLlibreta = (bytes) => llegix(ESQUEMA.aadLlibreta, bytes);
export const construeixEntradaFirmaLlibreta = (valors) => construeix(ESQUEMA.entradaFirmaLlibreta, valors);
export const llegixEntradaFirmaLlibreta = (bytes) => llegix(ESQUEMA.entradaFirmaLlibreta, bytes);
/* SDPH */
export const construeixInfoFragment = (valors) => construeix(ESQUEMA.infoFragment, valors);
export const llegixInfoFragment = (bytes) => llegix(ESQUEMA.infoFragment, bytes);
/* SDPV */
export const construeixEntradaCodiCurt = (valors) => construeix(ESQUEMA.entradaCodiCurt, valors);
export const llegixEntradaCodiCurt = (bytes) => llegix(ESQUEMA.entradaCodiCurt, bytes);

/** §4.5.1 · envHash = SHA-256(enc65 ‖ ct48): el que entra al hash, 113 B. */
export const construeixEntradaHashSobre = (enc, ct) => enCamp('envHash', null, () => concatena([
  enCamp(null, 'enc', () => exigixPunt(exigixBytes(enc, BYTES_PUNT))), enCamp(null, 'ct', () => exigixBytes(ct, BYTES_CT_SOBRE))
]));

/* ── Les etiquetes HKDF (la derivació és de xifratXatCripto; ací només els bytes) ── */

const etiqueta = (text) => concatena([ascii(text), Uint8Array.of(0)]);

/** info de ckCommit: "sdp-xat-v1/compromis-epoca" ‖ 0x00 ‖ u32be(e); la sal és uuid16(fil). */
export const infoCompromisEpoca = (epoca) => enCamp('info', 'epoca', () => concatena([etiqueta(ETIQUETES.compromisEpoca), C.numero.escriu(epoca)]));
/** info de mk: "sdp-xat-v1/missatge" ‖ 0x00 ‖ SHA-256(H); la sal és uuid16(id). */
export const infoClauMissatge = (hashCapcalera) => enCamp('info', 'hashCapcalera', () => concatena([etiqueta(ETIQUETES.missatge), C.hash.escriu(hashCapcalera)]));
/** info de Kenc_A: "sdp-xat-v1/adjunt" ‖ 0x00 ‖ fil16; la sal és uuid16(adjunt). */
export const infoClauAdjunt = (fil) => enCamp('info', 'fil', () => concatena([etiqueta(ETIQUETES.adjunt), uuid16(fil)]));
/** info de K_meta: "sdp-xat-v1/meta-grup" ‖ 0x00 ‖ u32be(e); la sal és uuid16(fil). */
export const infoMetaGrup = (epoca) => enCamp('info', 'epoca', () => concatena([etiqueta(ETIQUETES.metaGrup), C.numero.escriu(epoca)]));

/* ── `cos`: JSON canònic UTF-8 (§4.6.1, §4.7) ──────────────────────────── */

const CLAUS_COS = Object.freeze(['a', 'mini', 't']);
const CLAUS_ADJUNT = Object.freeze(['b', 'c', 'd', 'h', 'id', 'k', 'm']);
const CLASSE_DEL_TIPUS = Object.freeze({ imatge: CLASSE_ADJUNT.foto, veu: CLASSE_ADJUNT.veu, video: CLASSE_ADJUNT.video });
const RIFF = ascii('RIFF');
const WEBP = ascii('WEBP');

/* El text: 1..TEXT_MAXIM unitats, cap control C0 fora de \t i \n, cap meitat de parell suplent sola
   (TextEncoder la canviaria per U+FFFD i el SQL del franqueig s'hi trenca, IS-07). */
function exigixText(text) {
  if (typeof text !== 'string') throw rebuig('tipus', 'El text és una cadena.');
  if (text.length < 1 || text.length > TEXT_MAXIM) throw rebuig('rang', `El text va d’1 a ${TEXT_MAXIM} caràcters.`);
  for (let i = 0; i < text.length; i += 1) {
    const unitat = text.charCodeAt(i);
    if (unitat < 0x20 && unitat !== 0x09 && unitat !== 0x0a) throw rebuig('no-canonic', 'Cap caràcter de control fora de la tabulació i el salt de línia.');
    if (unitat >= 0xd800 && unitat <= 0xdbff) {
      const seguent = text.charCodeAt(i + 1);
      if (!(seguent >= 0xdc00 && seguent <= 0xdfff)) throw rebuig('no-canonic', 'Una meitat de parell suplent sola.');
      i += 1;
    } else if (unitat >= 0xdc00 && unitat <= 0xdfff) {
      throw rebuig('no-canonic', 'Una meitat de parell suplent sola.');
    }
  }
  return text;
}

/* cos.a = {b, c, d, h, id, k, m}: tots set, sempre. `k` (FK) i `h` (SHA-256 del blob) van en
   base64url dins del JSON i com a bytes fora. `d` és la durada en ms (null en una foto). */
function normalitzaAdjunt(a, codificat) {
  exigixClaus(a, CLAUS_ADJUNT, CLAUS_ADJUNT, { anomena: !codificat });
  enCamp(null, 'a.id', () => uuid16(a.id));
  const { c, m, b, d } = a;
  if (!Object.values(CLASSE_ADJUNT).includes(c)) throw rebuig('rang', 'La classe és 2 (foto), 3 (veu) o 4 (vídeo).', 'a.c');
  if (typeof m !== 'string' || !Object.prototype.hasOwnProperty.call(MIME_XAT, m) || CLASSE_DEL_TIPUS[MIME_XAT[m]] !== c) {
    throw rebuig('rang', 'El MIME és un dels admesos al xat i de la seua classe.', 'a.m');
  }
  if (!Number.isSafeInteger(b) || b < 1 || b > MAXIM_CLAR_ADJUNT[c]) throw rebuig('rang', `De 1 a ${MAXIM_CLAR_ADJUNT[c]} bytes en clar.`, 'a.b');
  const duradaBona = c === CLASSE_ADJUNT.foto
    ? d === null
    : Number.isSafeInteger(d) && d >= 1 && (c !== CLASSE_ADJUNT.video || d <= MAX_VIDEO_MS);
  if (!duradaBona) throw rebuig('rang', 'La durada és null en una foto i 1..n ms en la veu i el vídeo.', 'a.d');
  const k = enCamp(null, 'a.k', () => (codificat ? deB64u(a.k, BYTES_CLAU) : exigixBytes(a.k, BYTES_CLAU)));
  const h = enCamp(null, 'a.h', () => noZeros(codificat ? deB64u(a.h, BYTES_HASH) : exigixBytes(a.h, BYTES_HASH)));
  return Object.freeze({ b, c, d, h: copiaDe(h), id: a.id, k: copiaDe(k), m });
}

/* La miniatura: un WebP (RIFF ‖ mida ‖ WEBP, amb la mida RIFF = mida − 8) de fins a 8 KB. */
function exigixMiniatura(bytes) {
  if (bytes.length < 12 || bytes.length > MAX_BYTES_MINIATURA) throw rebuig('rang', `La miniatura fa de 12 a ${MAX_BYTES_MINIATURA} bytes.`);
  const midaRiff = bytes[4] + bytes[5] * 256 + bytes[6] * 65536 + bytes[7] * 16777216;
  if (!igualsBytes(bytes.subarray(0, 4), RIFF) || !igualsBytes(bytes.subarray(8, 12), WEBP) || midaRiff !== bytes.length - 8) {
    throw rebuig('no-canonic', 'La miniatura és un WebP sencer.');
  }
  return bytes;
}

/* Entrada → {t, a, mini} validat. Al constructor, «absent» és null o sense posar; al JSON, una
   clau absent (un "t": null és una altra codificació i no val). Al JSON, que és d'un altre, cap
   error no repetix el nom d'una clau desconeguda. */
function normalitzaCos(valor, codificat) {
  exigixClaus(valor, CLAUS_COS, [], { anomena: !codificat });
  const absent = (camp) => propi(valor, camp) === undefined || (!codificat && valor[camp] === null);
  const t = absent('t') ? null : enCamp(null, 't', () => exigixText(valor.t));
  const a = absent('a') ? null : enCamp(null, 'a', () => normalitzaAdjunt(valor.a, codificat));
  const mini = absent('mini') ? null : enCamp(null, 'mini', () => {
    if (a === null || a.c === CLASSE_ADJUNT.veu) throw rebuig('incoherent', 'La miniatura només va amb una foto o un vídeo.');
    if (!codificat && !(valor.mini instanceof Uint8Array)) throw rebuig('tipus', 'La miniatura són bytes (Uint8Array).');
    return copiaDe(exigixMiniatura(codificat ? deB64u(valor.mini) : valor.mini));
  });
  if (t === null && a === null) throw rebuig('falta', 'Un missatge porta text, un adjunt o tots dos.', 't');
  return { a, mini, t };
}

/* Claus en ordre (a < mini < t; b < c < d < h < id < k < m), sense espais, enters en decimal i els
   textos escapats com JSON.stringify: és l'única serialització que s'accepta. */
function serialitzaCos({ a, mini, t }) {
  const parts = [];
  if (a !== null) {
    parts.push(`"a":{"b":${a.b},"c":${a.c},"d":${a.d === null ? 'null' : a.d},"h":"${b64u(a.h)}",`
      + `"id":"${a.id}","k":"${b64u(a.k)}","m":${JSON.stringify(a.m)}}`);
  }
  if (mini !== null) parts.push(`"mini":"${b64u(mini)}"`);
  if (t !== null) parts.push(`"t":${JSON.stringify(t)}`);
  const bytes = new TextEncoder().encode(`{${parts.join(',')}}`);
  if (bytes.length > MAX_BYTES_COS) throw rebuig('rang', `«cos» passa de ${MAX_BYTES_COS} bytes.`);
  return bytes;
}

/**
 * {t?, a?, mini?} → els bytes canònics de `cos`. `a` porta `k` i `h` com a Uint8Array de 32 B i
 * `mini`, si hi és, és un Uint8Array. FORMAT_INVALID/rang si no hi cap: el protocol ho tradueix
 * al SDP-XAT-007 de sempre, o torna a provar sense la miniatura.
 */
export const construeixCos = (contingut) => enCamp('cos', null, () => serialitzaCos(normalitzaCos(contingut, false)));

/**
 * Receptor estricte de `cos`: UTF-8 amb `fatal`, JSON, només les claus conegudes i, al final, la
 * mateixa serialització byte a byte (cap espai, cap ordre diferent, cap clau repetida, cap
 * escapament alternatiu). Torna {a, mini, t} (null el que no hi és).
 */
export const llegixCos = (bytes) => enCamp('cos', null, () => {
  if (!(bytes instanceof Uint8Array)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  if (bytes.length < 1 || bytes.length > MAX_BYTES_COS) throw rebuig('rang', `«cos» fa d’1 a ${MAX_BYTES_COS} bytes.`);
  let valor;
  try {
    valor = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes));
  } catch {
    throw rebuig('no-canonic', '«cos» no és JSON en UTF-8 vàlid.');
  }
  const cos = normalitzaCos(valor, true);
  if (!igualsBytes(serialitzaCos(cos), bytes)) throw rebuig('no-canonic', '«cos» no és la forma canònica.');
  return Object.freeze(cos);
});

/* ── La càrrega privada P i el seu farciment (§4.6.1, §4.6.3) ─────────── */

const FLAG_FIRMA = 0x01;

/**
 * P = 0x01 ‖ flags ‖ nf32 ‖ u32be(len(cos)) ‖ cos ‖ [σ64]. `nf` va en posició fixa (bytes 3-34 en
 * base 1, la clau de l'HMAC que llig el SQL) i el bit 0 de `flags` diu si hi ha σ.
 */
export const construeixCarrega = (valors) => enCamp('P', null, () => {
  exigixClaus(valors, ['cos', 'firma', 'nf'], ['cos', 'nf']);
  const nf = enCamp(null, 'nf', () => exigixBytes(valors.nf, BYTES_NONCE_FRANQUEIG));
  llegixCos(valors.cos);
  const firma = propi(valors, 'firma') ?? null;
  if (firma !== null) enCamp(null, 'firma', () => exigixBytes(firma, BYTES_FIRMA));
  const bytes = concatena([Uint8Array.of(VERSIO_FORMAT, firma === null ? 0 : FLAG_FIRMA), nf, aEnter(valors.cos.length, 4), valors.cos,
    firma ?? new Uint8Array(0)]);
  llegixCarrega(bytes);
  return bytes;
});

/** P estricte → {signada, nf, cos, contingut, firma}; `contingut` és `cos` ja analitzat. */
export const llegixCarrega = (bytes) => enCamp('P', null, () => {
  if (!(bytes instanceof Uint8Array)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  if (bytes.length < 1) throw rebuig('truncat', 'Falten bytes.');
  if (bytes[0] !== VERSIO_FORMAT) throw rebuig('versio', 'P: versió desconeguda.');
  if (bytes.length < MIDES.capcaleraCarrega) throw rebuig('truncat', 'Falten bytes.');
  if (bytes[1] & ~FLAG_FIRMA) throw rebuig('no-canonic', 'P: bits de flags desconeguts.', 'flags');
  const signada = (bytes[1] & FLAG_FIRMA) !== 0;
  const llargaria = deEnter(bytes.subarray(34, 38));
  if (llargaria < 1 || llargaria > MAX_BYTES_COS) throw rebuig('rang', `«cos» fa d’1 a ${MAX_BYTES_COS} bytes.`, 'cos');
  const total = MIDES.capcaleraCarrega + llargaria + (signada ? BYTES_FIRMA : 0);
  if (bytes.length !== total) {
    throw rebuig(bytes.length < total ? 'truncat' : 'sobrants', bytes.length < total ? 'Falten bytes.' : 'Sobren bytes al final.');
  }
  const cos = copiaDe(bytes.subarray(38, 38 + llargaria));
  return Object.freeze({
    signada, nf: copiaDe(bytes.subarray(2, 34)), cos, contingut: llegixCos(cos),
    firma: signada ? copiaDe(bytes.subarray(38 + llargaria)) : null
  });
});

const midaFarcida = (n) => Math.max(BLOC_CARREGA, Math.ceil(n / BLOC_CARREGA) * BLOC_CARREGA);

/** Pf = P ‖ 0x80 ‖ 0x00… fins al múltiple de 256 següent (mínim 256, màxim 16.384). */
export const farceixCarrega = (carrega) => enCamp('Pf', null, () => {
  llegixCarrega(carrega);
  const mida = midaFarcida(carrega.length + 1);
  if (mida > MAX_CARREGA_FARCIDA) throw rebuig('rang', `La càrrega farcida passa de ${MAX_CARREGA_FARCIDA} bytes.`);
  const farcit = new Uint8Array(mida);
  farcit.set(carrega);
  farcit[carrega.length] = 0x80;
  return farcit;
});

/**
 * El contrari, estricte: múltiple de 256 de 256 a 16.384, l'últim byte no nul és 0x80, cap bloc de
 * zeros de més, i el que queda és una P vàlida. Torna els bytes de P.
 */
export const desfarceixCarrega = (farcit) => enCamp('Pf', null, () => {
  if (!(farcit instanceof Uint8Array)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  if (farcit.length < BLOC_CARREGA || farcit.length > MAX_CARREGA_FARCIDA || farcit.length % BLOC_CARREGA !== 0) {
    throw rebuig('mida', `La càrrega farcida és un múltiple de ${BLOC_CARREGA} de ${BLOC_CARREGA} a ${MAX_CARREGA_FARCIDA} bytes.`);
  }
  let i = farcit.length - 1;
  while (i >= 0 && farcit[i] === 0) i -= 1;
  if (i < 0 || farcit[i] !== 0x80) throw rebuig('no-canonic', 'El farciment és 0x80 i zeros.');
  if (midaFarcida(i + 1) !== farcit.length) throw rebuig('no-canonic', 'El farciment porta un bloc de zeros de més.');
  const carrega = copiaDe(farcit.subarray(0, i));
  llegixCarrega(carrega);
  return carrega;
});

/** La mida que pot tindre el xifrat d'un missatge: |Pf| + 16 (com el CHECK de `xifrat_ct`). */
export const esMidaXifratMissatge = (n) => Number.isSafeInteger(n) && n >= BLOC_CARREGA + BYTES_ETIQUETA_GCM
  && n <= MAX_CARREGA_FARCIDA + BYTES_ETIQUETA_GCM && (n - BYTES_ETIQUETA_GCM) % BLOC_CARREGA === 0;

/* ── Els hash que definix el format (cripto injectat; sense subtle, SENSE_CRIPTO) ── */

async function sha256(cripto, bytes) {
  if (typeof cripto?.subtle?.digest !== 'function') {
    throw errorAmbCodi('SENSE_CRIPTO', 'Cal WebCrypto (crypto.subtle) per a calcular els hash del xat xifrat.');
  }
  return new Uint8Array(await cripto.subtle.digest('SHA-256', bytes));
}

/** kid = SHA-256("SDPI" ‖ 01 ‖ usuari16 ‖ sigPub65 ‖ dhPub65)[0..16) (§4.3). */
export async function kidDe(cripto, valors) {
  const entrada = construeixEntradaKid(valors);
  return (await sha256(cripto, entrada)).slice(0, BYTES_KID);
}

/** Si el `kid` és el de les claus de veres (IS-03: comparar kid és comparar claus, recalculades). */
export async function kidQuadra(cripto, valors) {
  const claus = ['dhPub', 'kid', 'sigPub', 'usuari'];
  enCamp('SDPI', null, () => exigixClaus(valors, claus, claus));
  const { kid, ...publiques } = valors;
  enCamp('SDPI', 'kid', () => exigixBytes(kid, BYTES_KID));
  return igualsBytes(await kidDe(cripto, publiques), kid);
}

/** hash_e = SHA-256(SDPE), d'una declaració ben formada. */
export async function hashEpoca(cripto, declaracio) {
  llegixEpoca(declaracio);
  return sha256(cripto, declaracio);
}

/** El hash d'una versió d'equip (el refEquip de les èpoques d'entitat). */
export async function hashEquip(cripto, declaracio) {
  llegixEquip(declaracio);
  return sha256(cripto, declaracio);
}

/** envHash = SHA-256(enc65 ‖ ct48). */
export async function hashSobre(cripto, enc, ct) {
  return sha256(cripto, construeixEntradaHashSobre(enc, ct));
}

/** SHA-256(cos), el que va a Hc (SDPG). */
export async function hashCos(cripto, cos) {
  llegixCos(cos);
  return sha256(cripto, cos);
}

/** SHA-256(H), el que va a l'info de mk. */
export async function hashCapcalera(cripto, capcalera) {
  llegixCapcalera(capcalera);
  return sha256(cripto, capcalera);
}

/** El codi curt social: u32be(SHA-256(SDPV)[0..4)) mod 10⁶, en 6 xifres (§5.6). */
export async function codiCurtSocial(cripto, valors) {
  const hash = await sha256(cripto, construeixEntradaCodiCurt(valors));
  return String(deEnter(hash.subarray(0, 4)) % 1000000).padStart(6, '0');
}
