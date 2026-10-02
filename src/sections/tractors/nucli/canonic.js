/**
 * canonic.js — bytes, codificacions i JSON canònic de la Porta d'Aprovació.
 *
 * JS pur isomòrfic: sense DOM ni mòduls de Node. Tot el que fa resums rep
 * `subtle` per paràmetre; per defecte, `globalThis.crypto.subtle`.
 */

const codificador = new TextEncoder();
const ALFABET_B64URL = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '-_'].join('');

/* Accepta qualsevol vista de bytes o ArrayBuffer, també d'un altre reialme
   (jsdom), on `instanceof Uint8Array` falla. */
export function aBytes(valor) {
  if (ArrayBuffer.isView(valor)) return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  if (Object.prototype.toString.call(valor) === '[object ArrayBuffer]') return new Uint8Array(valor);
  throw new TypeError('S\'esperaven bytes (Uint8Array o ArrayBuffer).');
}

export function utf8(text) {
  if (typeof text !== 'string') throw new TypeError('utf8() només codifica textos.');
  return codificador.encode(text);
}

export function desdeUtf8(bytes) {
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(aBytes(bytes));
}

export function hex(bytes) {
  const b = aBytes(bytes);
  let eixida = '';
  for (let i = 0; i < b.length; i++) eixida += b[i].toString(16).padStart(2, '0');
  return eixida;
}

export function base64url(bytes) {
  const b = aBytes(bytes);
  let eixida = '';
  let i = 0;
  for (; i + 2 < b.length; i += 3) {
    const n = (b[i] << 16) | (b[i + 1] << 8) | b[i + 2];
    eixida += ALFABET_B64URL[n >> 18] + ALFABET_B64URL[(n >> 12) & 63]
      + ALFABET_B64URL[(n >> 6) & 63] + ALFABET_B64URL[n & 63];
  }
  const resta = b.length - i;
  if (resta === 1) {
    const n = b[i] << 16;
    eixida += ALFABET_B64URL[n >> 18] + ALFABET_B64URL[(n >> 12) & 63];
  } else if (resta === 2) {
    const n = (b[i] << 16) | (b[i + 1] << 8);
    eixida += ALFABET_B64URL[n >> 18] + ALFABET_B64URL[(n >> 12) & 63] + ALFABET_B64URL[(n >> 6) & 63];
  }
  return eixida;
}

/* Admet el farciment final opcional; rebutja l'alfabet de base64 clàssic. */
export function desdeBase64url(text) {
  if (typeof text !== 'string') throw new TypeError('base64url: s\'esperava un text.');
  const net = text.replace(/={1,2}$/, '');
  if (!/^[A-Za-z0-9_-]*$/.test(net) || net.length % 4 === 1) {
    throw new TypeError('base64url: text mal format.');
  }
  const eixida = new Uint8Array(Math.floor((net.length * 3) / 4));
  let acumulat = 0;
  let bits = 0;
  let j = 0;
  for (let i = 0; i < net.length; i++) {
    acumulat = ((acumulat << 6) | ALFABET_B64URL.indexOf(net[i])) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      eixida[j++] = (acumulat >> bits) & 0xff;
    }
  }
  return eixida;
}

export function concatena(...parts) {
  const trossos = parts.map(aBytes);
  const eixida = new Uint8Array(trossos.reduce((suma, t) => suma + t.length, 0));
  let pos = 0;
  for (const t of trossos) {
    eixida.set(t, pos);
    pos += t.length;
  }
  return eixida;
}

export function igualsBytes(a, b) {
  const x = aBytes(a);
  const y = aBytes(b);
  if (x.length !== y.length) return false;
  let diferencia = 0;
  for (let i = 0; i < x.length; i++) diferencia |= x[i] ^ y[i];
  return diferencia === 0;
}

function errorCanonic(cami, motiu) {
  const error = new TypeError(`JSON canònic: ${motiu} a ${cami}.`);
  error.codi = 'JSON_NO_CANONIC';
  return error;
}

function serialitza(valor, ancestres, cami) {
  if (valor === null) return 'null';
  switch (typeof valor) {
    case 'string':
      return JSON.stringify(valor);
    case 'boolean':
      return valor ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(valor)) throw errorCanonic(cami, 'nombre no finit');
      return JSON.stringify(valor);
    case 'object':
      break;
    default:
      throw errorCanonic(cami, `el tipus ${typeof valor} no es pot serialitzar`);
  }
  if (ancestres.has(valor)) throw errorCanonic(cami, 'referència circular');
  ancestres.add(valor);
  try {
    if (Array.isArray(valor)) {
      const elements = [];
      for (let i = 0; i < valor.length; i++) elements.push(serialitza(valor[i], ancestres, `${cami}[${i}]`));
      return `[${elements.join(',')}]`;
    }
    const proto = Object.getPrototypeOf(valor);
    if (Object.prototype.toString.call(valor) !== '[object Object]'
      || (proto !== null && Object.getPrototypeOf(proto) !== null)) {
      throw errorCanonic(cami, 'només s\'admeten objectes plans');
    }
    /* sort() sense comparador ordena per unitats UTF-16, com l'RFC 8785. */
    const claus = Object.keys(valor).sort();
    const parelles = claus.map((clau) => `${JSON.stringify(clau)}:${serialitza(valor[clau], ancestres, `${cami}.${clau}`)}`);
    return `{${parelles.join(',')}}`;
  } finally {
    ancestres.delete(valor);
  }
}

/* Claus ordenades recursivament i sense espais. Rebutja undefined, funcions,
   NaN/Infinity, BigInt, símbols, cicles i objectes no plans (Date, Map...). */
export function jsonCanonic(valor) {
  return serialitza(valor, new Set(), '$');
}

export function resolSubtle(subtle) {
  const s = subtle ?? globalThis.crypto?.subtle;
  if (!s || typeof s.digest !== 'function') {
    throw new Error('Cal WebCrypto (crypto.subtle): obri l\'app en un context segur (https o localhost).');
  }
  return s;
}

export async function sha256(bytesOText, subtle) {
  const dades = typeof bytesOText === 'string' ? utf8(bytesOText) : aBytes(bytesOText);
  return new Uint8Array(await resolSubtle(subtle).digest('SHA-256', dades));
}

export async function sha256Hex(bytesOText, subtle) {
  return hex(await sha256(bytesOText, subtle));
}
