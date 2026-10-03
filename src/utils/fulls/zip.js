/**
 * zip.js — ZIP mínim sense compressió (mètode STORE) i determinista.
 *
 * Evolució independent de la còpia de la Gestoria (deute declarat: n'hi ha
 * dues fins que la Gestoria migre en un torn propi, amb la reaprovació del
 * Mestre). Prou per a empaquetar un XLSX: una capçalera local per fitxer, el
 * directori central i el registre final. Sense ZIP64, xifrat ni descriptors
 * de dades. Tots els fitxers porten la data DOS fixa 1980-01-01 00:00: la
 * mateixa entrada dona sempre els mateixos bytes, i el fitxer no diu quan
 * s'ha fet. Els noms que no són ASCII porten el bit 11 (nom en UTF-8).
 *
 * `llegeixZip` desfà el que fa `creaZip` (només STORE, amb el CRC comprovat):
 * servix a les proves de qui exporta per a mirar què hi ha dins del paquet.
 * JS pur: sense DOM ni React.
 */

const SIGNATURA_LOCAL = 0x04034b50;
const SIGNATURA_CENTRAL = 0x02014b50;
const SIGNATURA_FINAL = 0x06054b50;
/* Versió 2.0 de l'especificació, amb MS-DOS com a sistema d'origen. */
const VERSIO = 20;
const BIT_UTF8 = 0x0800;
const METODE_STORE = 0;
const HORA_DOS = 0;
/* (1980 - 1980) << 9 | gener << 5 | dia 1 */
const DATA_DOS = 0x0021;
const MIDA_LOCAL = 30;
const MIDA_CENTRAL = 46;
const MIDA_FINAL = 22;
/* 0xFFFF i 0xFFFFFFFF són els senyals de ZIP64: no s'hi pot arribar. */
const MAX_16 = 0xffff;
const MAX_32 = 0xffffffff;

const TAULA_CRC = (() => {
  const taula = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    taula[n] = c >>> 0;
  }
  return taula;
})();

/* Bytes de qualsevol vista o ArrayBuffer (també d'un altre context, com jsdom).
   Un text es codifica en UTF-8. */
function aBytes(valor) {
  if (typeof valor === 'string') return new TextEncoder().encode(valor);
  if (ArrayBuffer.isView(valor)) return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  if (Object.prototype.toString.call(valor) === '[object ArrayBuffer]') return new Uint8Array(valor);
  throw new TypeError('Calen bytes (Uint8Array o ArrayBuffer) o un text.');
}

/**
 * CRC-32 (polinomi 0xEDB88320, el de ZIP i PNG) com a enter sense signe.
 * @param {Uint8Array|ArrayBuffer|string} bytes
 * @returns {number}
 */
export function crc32(bytes) {
  const b = aBytes(bytes);
  let crc = 0xffffffff;
  for (let i = 0; i < b.length; i += 1) crc = TAULA_CRC[(crc ^ b[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function preparaEntrada(entrada, vistos, codificador) {
  const { nom, dades } = entrada ?? {};
  if (typeof nom !== 'string' || nom === '' || nom.startsWith('/') || nom.includes('\\') || nom.split('/').includes('..')) {
    throw new TypeError(`Nom de fitxer no vàlid dins del ZIP: ${JSON.stringify(nom)}`);
  }
  if (vistos.has(nom)) throw new RangeError(`Nom repetit dins del ZIP: ${nom}`);
  vistos.add(nom);
  const bytesNom = codificador.encode(nom);
  const contingut = aBytes(dades);
  if (bytesNom.length >= MAX_16 || contingut.length >= MAX_32) throw new RangeError(`Fitxer massa gran per a un ZIP sense ZIP64: ${nom}`);
  return { bytesNom, contingut, crc: crc32(contingut), flags: bytesNom.some((b) => b > 0x7f) ? BIT_UTF8 : 0 };
}

/**
 * Empaqueta fitxers en un ZIP sense compressió, en l'ordre donat.
 * @param {Array<{ nom: string, dades: Uint8Array|ArrayBuffer|string }>} entrades
 *   nom: ruta relativa amb '/', sense '..'; dades: bytes, o text (UTF-8).
 * @returns {Uint8Array}
 */
export function creaZip(entrades) {
  if (!Array.isArray(entrades)) throw new TypeError('creaZip espera una llista de fitxers.');
  if (entrades.length >= MAX_16) throw new RangeError('Massa fitxers per a un ZIP sense ZIP64.');
  const vistos = new Set();
  const codificador = new TextEncoder();
  const fitxers = entrades.map((entrada) => preparaEntrada(entrada, vistos, codificador));
  const midaLocals = fitxers.reduce((suma, f) => suma + MIDA_LOCAL + f.bytesNom.length + f.contingut.length, 0);
  const midaCentral = fitxers.reduce((suma, f) => suma + MIDA_CENTRAL + f.bytesNom.length, 0);
  if (midaLocals >= MAX_32 || midaCentral >= MAX_32) throw new RangeError('ZIP massa gran sense ZIP64.');

  const eixida = new Uint8Array(midaLocals + midaCentral + MIDA_FINAL);
  const vista = new DataView(eixida.buffer);
  let pos = 0;
  const u16 = (valor) => {
    vista.setUint16(pos, valor, true);
    pos += 2;
  };
  const u32 = (valor) => {
    vista.setUint32(pos, valor, true);
    pos += 4;
  };
  const bytes = (valor) => {
    eixida.set(valor, pos);
    pos += valor.length;
  };
  /* Camps comuns a la capçalera local i a la central, de «versió necessària» a «llargària del camp extra». */
  const comuns = (f) => {
    u16(VERSIO);
    u16(f.flags);
    u16(METODE_STORE);
    u16(HORA_DOS);
    u16(DATA_DOS);
    u32(f.crc);
    u32(f.contingut.length);
    u32(f.contingut.length);
    u16(f.bytesNom.length);
    u16(0);
  };

  const desplacaments = fitxers.map((f) => {
    const desplacament = pos;
    u32(SIGNATURA_LOCAL);
    comuns(f);
    bytes(f.bytesNom);
    bytes(f.contingut);
    return desplacament;
  });
  fitxers.forEach((f, i) => {
    u32(SIGNATURA_CENTRAL);
    u16(VERSIO);
    comuns(f);
    u16(0); // llargària del comentari
    u16(0); // disc d'inici
    u16(0); // atributs interns
    u32(0); // atributs externs
    u32(desplacaments[i]);
    bytes(f.bytesNom);
  });
  u32(SIGNATURA_FINAL);
  u16(0); // número d'este disc
  u16(0); // disc del directori central
  u16(fitxers.length);
  u16(fitxers.length);
  u32(midaCentral);
  u32(midaLocals);
  u16(0); // llargària del comentari
  return eixida;
}

/**
 * Llig un ZIP STORE (el que fa creaZip) i en torna els fitxers, en ordre.
 * Rebutja la compressió, el xifrat i qualsevol CRC que no quadre.
 * @param {Uint8Array|ArrayBuffer} zip
 * @returns {Array<{ nom: string, dades: Uint8Array }>}
 */
export function llegeixZip(zip) {
  const b = aBytes(zip);
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const final = b.length - MIDA_FINAL;
  if (final < 0 || vista.getUint32(final, true) !== SIGNATURA_FINAL) {
    throw new TypeError('No és un ZIP sense comentari (falta el registre final).');
  }
  const total = vista.getUint16(final + 10, true);
  let pos = vista.getUint32(final + 16, true);
  const descodificador = new TextDecoder('utf-8', { fatal: true });
  const fitxers = [];
  for (let i = 0; i < total; i += 1) {
    if (vista.getUint32(pos, true) !== SIGNATURA_CENTRAL) throw new TypeError('Directori central malmés.');
    const flags = vista.getUint16(pos + 8, true);
    const metode = vista.getUint16(pos + 10, true);
    const crc = vista.getUint32(pos + 16, true);
    const mida = vista.getUint32(pos + 20, true);
    const llargNom = vista.getUint16(pos + 28, true);
    const llargExtra = vista.getUint16(pos + 30, true);
    const llargComentari = vista.getUint16(pos + 32, true);
    const local = vista.getUint32(pos + 42, true);
    const nom = descodificador.decode(b.subarray(pos + MIDA_CENTRAL, pos + MIDA_CENTRAL + llargNom));
    if (metode !== METODE_STORE || (flags & 1) !== 0) throw new TypeError(`Fitxer comprimit o xifrat: ${nom}`);
    if (vista.getUint32(local, true) !== SIGNATURA_LOCAL) throw new TypeError(`Capçalera local malmesa: ${nom}`);
    const inici = local + MIDA_LOCAL + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true);
    const dades = b.slice(inici, inici + mida);
    if (dades.length !== mida || crc32(dades) !== crc) throw new TypeError(`CRC que no quadra: ${nom}`);
    fitxers.push({ nom, dades });
    pos += MIDA_CENTRAL + llargNom + llargExtra + llargComentari;
  }
  return fitxers;
}
