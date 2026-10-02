/**
 * zip.js — ZIP mínim sense compressió (mètode STORE) i determinista.
 *
 * Prou per a empaquetar un XLSX: una capçalera local per fitxer, el directori
 * central i el registre final (EOCD). Sense ZIP64, xifrat ni descriptors de
 * dades. Tots els fitxers porten la data DOS fixa 1980-01-01 00:00, i així la
 * mateixa entrada dona sempre els mateixos bytes. Els noms que no són ASCII
 * porten el bit 11 (nom en UTF-8). JS pur: sense DOM ni React.
 */

const SIGNATURA_LOCAL = 0x04034b50;
const SIGNATURA_CENTRAL = 0x02014b50;
const SIGNATURA_FINAL = 0x06054b50;
/* Versió 2.0 de l'especificació (APPNOTE), amb el sistema MS-DOS com a origen. */
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

/* Accepta qualsevol vista de bytes o ArrayBuffer, també d'un altre context (iframe, jsdom). */
function aBytes(valor) {
  if (ArrayBuffer.isView(valor)) return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  if (Object.prototype.toString.call(valor) === '[object ArrayBuffer]') return new Uint8Array(valor);
  throw new TypeError('Calen bytes (Uint8Array o ArrayBuffer).');
}

/**
 * CRC-32 (polinomi 0xEDB88320, el de ZIP i PNG) com a enter sense signe.
 * @param {Uint8Array|ArrayBuffer} bytes
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
  if (typeof nom !== 'string' || nom === '' || nom.startsWith('/') || nom.includes('\\')) {
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
 * @param {Array<{ nom: string, dades: Uint8Array }>} entrades nom: ruta relativa amb '/'.
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
  u16(0); // número d'aquest disc
  u16(0); // disc del directori central
  u16(fitxers.length);
  u16(fitxers.length);
  u32(midaCentral);
  u32(midaLocals);
  u16(0); // llargària del comentari
  return eixida;
}
