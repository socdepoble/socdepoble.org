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
 * `llegeixZip` desfà el que fa `creaZip` i llig també els ZIP d'Excel,
 * LibreOffice o Numbers: STORE i DEFLATE (mètode 8, amb el motor pur de
 * inflate.js), amb el CRC i la mida comprovats. Rebutja ZIP64, xifrat i
 * paquets de diversos discos. L'opció `nomes` tria quines entrades es
 * descomprimixen (un XLSX pot portar imatges i gràfics que no calen). Els
 * noms es lligen en UTF-8 o, si no ho són i no porten el bit 11, en CP437.
 * JS pur: sense DOM ni React.
 */
import { ErrorInflate, inflateRawPur } from './inflate.js';

const SIGNATURA_LOCAL = 0x04034b50;
const SIGNATURA_CENTRAL = 0x02014b50;
const SIGNATURA_FINAL = 0x06054b50;
/* El localitzador del registre final de ZIP64, just davant del registre final. */
const SIGNATURA_LOCALITZADOR_ZIP64 = 0x07064b50;
const MIDA_LOCALITZADOR_ZIP64 = 20;
const METODE_DEFLATE = 8;
const BIT_XIFRAT = 0x0001;
/* El comentari del registre final té com a molt 0xFFFF bytes. */
const MAX_COMENTARI = 0xffff;
/* Sostre per defecte de tot el que es descomprimix en una lectura (contra les bombes). */
const LIMIT_EIXIDA = 64 * 1024 * 1024;
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

/* Els bytes de 0x80 a 0xFF en CP437, la codificació dels noms que no porten
   el bit 11 (APPNOTE, apèndix D): la d'eines antigues de Windows. */
const CP437 = [
  0x00C7, 0x00FC, 0x00E9, 0x00E2, 0x00E4, 0x00E0, 0x00E5, 0x00E7, 0x00EA, 0x00EB, 0x00E8, 0x00EF, 0x00EE, 0x00EC, 0x00C4, 0x00C5,
  0x00C9, 0x00E6, 0x00C6, 0x00F4, 0x00F6, 0x00F2, 0x00FB, 0x00F9, 0x00FF, 0x00D6, 0x00DC, 0x00A2, 0x00A3, 0x00A5, 0x20A7, 0x0192,
  0x00E1, 0x00ED, 0x00F3, 0x00FA, 0x00F1, 0x00D1, 0x00AA, 0x00BA, 0x00BF, 0x2310, 0x00AC, 0x00BD, 0x00BC, 0x00A1, 0x00AB, 0x00BB,
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556, 0x2555, 0x2563, 0x2551, 0x2557, 0x255D, 0x255C, 0x255B, 0x2510,
  0x2514, 0x2534, 0x252C, 0x251C, 0x2500, 0x253C, 0x255E, 0x255F, 0x255A, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256C, 0x2567,
  0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256B, 0x256A, 0x2518, 0x250C, 0x2588, 0x2584, 0x258C, 0x2590, 0x2580,
  0x03B1, 0x00DF, 0x0393, 0x03C0, 0x03A3, 0x03C3, 0x00B5, 0x03C4, 0x03A6, 0x0398, 0x03A9, 0x03B4, 0x221E, 0x03C6, 0x03B5, 0x2229,
  0x2261, 0x00B1, 0x2265, 0x2264, 0x2320, 0x2321, 0x00F7, 0x2248, 0x00B0, 0x2219, 0x00B7, 0x221A, 0x207F, 0x00B2, 0x25A0, 0x00A0
];

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

const ERROR_ZIP64 = "ZIP64 no admés: el fitxer és massa gran o l'ha fet una eina que no es pot llegir.";

/* El registre final es busca des del final cap arrere, perquè darrere pot
   anar un comentari de fins a 0xFFFF bytes (creaZip no en posa, però altres
   eines sí). El primer que es troba és el bo si el seu comentari cap dins del
   fitxer: així una signatura que aparega dins del comentari no enganya. */
function registreFinal(b, vista) {
  const minim = Math.max(0, b.length - MIDA_FINAL - MAX_COMENTARI);
  for (let fi = b.length - MIDA_FINAL; fi >= minim; fi -= 1) {
    if (b[fi] === 0x50 && vista.getUint32(fi, true) === SIGNATURA_FINAL && fi + MIDA_FINAL + vista.getUint16(fi + 20, true) <= b.length) return fi;
  }
  throw new TypeError('No és un ZIP (falta el registre final).');
}

/* El nom d'una entrada. En UTF-8 si ho és, porte o no el bit 11 (moltes eines
   no el posen); si no ho és i no porta el bit, en CP437, la codificació
   original dels noms de ZIP. Amb el bit i sense ser UTF-8, el ZIP està malmés.
   Es descodifica abans del filtre `nomes`: cap error del navegador en anglés. */
function nomEntrada(bytes, flags, descodificador) {
  try {
    return descodificador.decode(bytes);
  } catch {
    if ((flags & BIT_UTF8) !== 0) throw new TypeError("Nom d'entrada malmés dins del ZIP: diu que és UTF-8 i no ho és.");
    let nom = '';
    for (const b of bytes) nom += String.fromCharCode(b < 0x80 ? b : CP437[b - 0x80]);
    return nom;
  }
}

/* DEFLATE amb el motor pur, amb la mida declarada com a sostre: un flux que
   en dona més, o que està malmés, és un ZIP que no es pot creure. */
function desinfla(crues, mida, nom) {
  try {
    return inflateRawPur(crues, { maxEixida: mida });
  } catch (e) {
    if (!(e instanceof ErrorInflate)) throw e;
    const que = e.codi === 'limit' ? 'Mida descomprimida que no quadra' : 'Dades comprimides malmeses';
    throw new TypeError(`${que}: ${nom}`, { cause: e });
  }
}

/**
 * Llig un ZIP i en torna els fitxers, en l'ordre del directori central.
 * Admet STORE (mètode 0) i DEFLATE (mètode 8). Rebutja ZIP64, el xifrat, els
 * altres mètodes, els paquets de diversos discos i qualsevol CRC o mida que
 * no quadre (TypeError); si el que es descomprimiria passa de `maxEixida`,
 * RangeError.
 * @param {Uint8Array|ArrayBuffer} zip
 * @param {{ nomes?: (nom: string) => boolean, maxEixida?: number }} [opcions]
 *   nomes: només es lligen (i es tornen) les entrades per a les quals torna
 *   true; la resta ni es descomprimixen. maxEixida: sostre de la suma de les
 *   mides descomprimides (64 MiB per defecte).
 * @returns {Array<{ nom: string, dades: Uint8Array }>}
 */
export function llegeixZip(zip, { nomes, maxEixida = LIMIT_EIXIDA } = {}) {
  if (nomes !== undefined && typeof nomes !== 'function') throw new TypeError('llegeixZip: «nomes» ha de ser una funció (nom) => booleà.');
  if (typeof maxEixida !== 'number' || !(maxEixida >= 0)) throw new RangeError('llegeixZip: maxEixida ha de ser un nombre de bytes no negatiu.');
  const b = aBytes(zip);
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const final = registreFinal(b, vista);
  const total = vista.getUint16(final + 10, true);
  const midaCentral = vista.getUint32(final + 12, true);
  let pos = vista.getUint32(final + 16, true);
  const ambLocalitzador = final >= MIDA_LOCALITZADOR_ZIP64 && vista.getUint32(final - MIDA_LOCALITZADOR_ZIP64, true) === SIGNATURA_LOCALITZADOR_ZIP64;
  if (total === MAX_16 || midaCentral === MAX_32 || pos === MAX_32 || ambLocalitzador) throw new TypeError(ERROR_ZIP64);
  if (vista.getUint16(final + 4, true) !== 0 || vista.getUint16(final + 6, true) !== 0 || vista.getUint16(final + 8, true) !== total) {
    throw new TypeError('ZIP de diversos discos: no es pot llegir.');
  }
  const descodificador = new TextDecoder('utf-8', { fatal: true });
  const fitxers = [];
  let resta = Math.floor(maxEixida);
  for (let i = 0; i < total; i += 1) {
    if (pos + MIDA_CENTRAL > b.length || vista.getUint32(pos, true) !== SIGNATURA_CENTRAL) throw new TypeError('Directori central malmés.');
    const flags = vista.getUint16(pos + 8, true);
    const metode = vista.getUint16(pos + 10, true);
    const crc = vista.getUint32(pos + 16, true);
    const comprimida = vista.getUint32(pos + 20, true);
    const mida = vista.getUint32(pos + 24, true);
    const llargNom = vista.getUint16(pos + 28, true);
    const llargExtra = vista.getUint16(pos + 30, true);
    const llargComentari = vista.getUint16(pos + 32, true);
    const local = vista.getUint32(pos + 42, true);
    if (pos + MIDA_CENTRAL + llargNom > b.length) throw new TypeError('Directori central malmés.');
    const nom = nomEntrada(b.subarray(pos + MIDA_CENTRAL, pos + MIDA_CENTRAL + llargNom), flags, descodificador);
    pos += MIDA_CENTRAL + llargNom + llargExtra + llargComentari;
    if (nomes && !nomes(nom)) continue;
    if (comprimida === MAX_32 || mida === MAX_32 || local === MAX_32) throw new TypeError(ERROR_ZIP64);
    if ((flags & BIT_XIFRAT) !== 0) throw new TypeError(`Fitxer xifrat dins del ZIP (no es pot llegir sense la contrasenya): ${nom}`);
    if (metode !== METODE_STORE && metode !== METODE_DEFLATE) throw new TypeError(`Mètode de compressió ${metode} no admés: ${nom}`);
    if (local + MIDA_LOCAL > b.length || vista.getUint32(local, true) !== SIGNATURA_LOCAL) throw new TypeError(`Capçalera local malmesa: ${nom}`);
    const inici = local + MIDA_LOCAL + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true);
    if (inici + comprimida > b.length) throw new TypeError(`Fitxer tallat dins del ZIP: ${nom}`);
    if (mida > resta) throw new RangeError(`El ZIP descomprimit passaria de ${Math.floor(maxEixida)} bytes: ${nom}`);
    const dades = metode === METODE_STORE ? b.slice(inici, inici + comprimida) : desinfla(b.subarray(inici, inici + comprimida), mida, nom);
    if (dades.length !== mida || crc32(dades) !== crc) throw new TypeError(`CRC que no quadra: ${nom}`);
    resta -= mida;
    fitxers.push({ nom, dades });
  }
  return fitxers;
}
