/**
 * csv.js — lectura i escriptura de CSV, i decodificació dels bytes d'un fitxer.
 *
 * Llig el full de la gestoria (separador coma, o punt i coma en el format
 * antic) i els CSV dels proveïdors. Segueix l'RFC 4180 amb tolerància: BOM
 * fora, salts CRLF, LF o CR, cometes doblades i salts de línia dins de cometes.
 * Una cometa a mitjan camp sense cometes és un caràcter més, i una cometa que
 * no es tanca s'emporta la resta del text al seu camp. JS pur: sense DOM.
 */

/* El BOM es fa des del punt de codi: cap caràcter invisible literal al codi. */
const BOM = String.fromCharCode(0xfeff);
const CANDIDATS = [',', ';', '\t'];
const FORMULA = /^[-=+@\t\r]/;

/* Bytes de 0x80 a 0x9F en windows-1252; els cinc que no hi són es queden com el byte (com fa WHATWG). */
const WINDOWS_1252 = [
  0x20AC, 0x81, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8D, 0x017D, 0x8F,
  0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x9D, 0x017E, 0x0178
];

function comprovaDelimitador(delimitador) {
  if (typeof delimitador !== 'string' || delimitador.length !== 1 || '"\r\n'.includes(delimitador)) {
    throw new RangeError(`Delimitador de CSV no vàlid: ${JSON.stringify(delimitador)}`);
  }
  return delimitador;
}

/**
 * Endevina el delimitador comptant comes, punts i comes i tabuladors fora de
 * cometes a les primeres línies no buides. En cas d'empat (o de cap), la coma.
 * @param {string} text
 * @param {{ linies?: number }} [opcions]
 * @returns {',' | ';' | '\t'}
 */
export function detectaDelimitador(text, { linies = 10 } = {}) {
  const comptes = new Map(CANDIDATS.map((c) => [c, 0]));
  let entreCometes = false;
  let vistes = 0;
  let liniaAmbText = false;
  for (let i = 0; i < text.length && vistes < linies; i += 1) {
    const c = text[i];
    if (c === '"') {
      entreCometes = !entreCometes;
      liniaAmbText = true;
    } else if (entreCometes) {
      continue;
    } else if (c === '\n' || c === '\r') {
      if (liniaAmbText) vistes += 1;
      liniaAmbText = false;
    } else {
      liniaAmbText = true;
      if (comptes.has(c)) comptes.set(c, comptes.get(c) + 1);
    }
  }
  let millor = ',';
  for (const c of CANDIDATS) if (comptes.get(c) > comptes.get(millor)) millor = c;
  return millor;
}

/**
 * Llig un CSV i en torna les files com a llistes de cadenes. Una línia buida
 * és [''] i el salt final no afig cap fila.
 * @param {string} text
 * @param {{ delimitador?: 'auto' | ',' | ';' | '\t' }} [opcions]
 * @returns {string[][]}
 */
export function parseCsv(text, { delimitador = 'auto' } = {}) {
  if (typeof text !== 'string') return [];
  const font = text.startsWith(BOM) ? text.slice(1) : text;
  const sep = delimitador === 'auto' ? detectaDelimitador(font) : comprovaDelimitador(delimitador);
  const files = [];
  let fila = [];
  let camp = '';
  let entreCometes = false;
  let iniciDeCamp = true;
  let pendent = false;
  for (let i = 0; i < font.length; i += 1) {
    const c = font[i];
    if (entreCometes) {
      if (c !== '"') camp += c;
      else if (font[i + 1] === '"') {
        camp += '"';
        i += 1;
      } else entreCometes = false;
      continue;
    }
    if (c === '"' && iniciDeCamp) {
      entreCometes = true;
      iniciDeCamp = false;
      pendent = true;
    } else if (c === sep) {
      fila.push(camp);
      camp = '';
      iniciDeCamp = true;
      pendent = true;
    } else if (c === '\r' || c === '\n') {
      fila.push(camp);
      files.push(fila);
      fila = [];
      camp = '';
      iniciDeCamp = true;
      pendent = false;
      if (c === '\r' && font[i + 1] === '\n') i += 1;
    } else {
      camp += c;
      iniciDeCamp = false;
      pendent = true;
    }
  }
  if (pendent) {
    fila.push(camp);
    files.push(fila);
  }
  return files;
}

const textDe = (valor) => (valor == null ? '' : String(valor));

/**
 * Escriu files com a CSV. Posa entre cometes (i en dobla les de dins) els
 * camps amb el delimitador, cometes o salts de línia. Cada fila acaba amb el
 * salt, també l'última. Per defecte: coma, CRLF i BOM d'UTF-8.
 * @param {Array<Array<unknown>>} files
 * @param {{ delimitador?: string, salt?: string, bom?: boolean }} [opcions]
 * @returns {string}
 */
export function serialitzaCsv(files, { delimitador = ',', salt = '\r\n', bom = true } = {}) {
  const sep = comprovaDelimitador(delimitador);
  const cometes = (text) => (text.includes(sep) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  const linies = (files ?? []).map((fila) => (fila ?? []).map((valor) => cometes(textDe(valor))).join(sep));
  return (bom ? BOM : '') + linies.map((linia) => linia + salt).join('');
}

/**
 * Neutralitza una cel·la de text que un full de càlcul llegiria com a fórmula
 * (comença per = + - @, tabulador o retorn): hi anteposa una cometa simple.
 * @param {unknown} valor
 * @returns {string}
 */
export function protegeixFormula(valor) {
  const text = textDe(valor);
  return FORMULA.test(text) ? `'${text}` : text;
}

function aBytes(bytes) {
  if (bytes instanceof Uint8Array) return bytes;
  if (Object.prototype.toString.call(bytes) === '[object ArrayBuffer]') return new Uint8Array(bytes);
  if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  throw new TypeError('Calen bytes (Uint8Array o ArrayBuffer) per a decodificar el text.');
}

function decodificaWindows1252(bytes) {
  const trossos = [];
  const tros = [];
  for (const b of bytes) {
    tros.push(b >= 0x80 && b <= 0x9F ? WINDOWS_1252[b - 0x80] : b);
    if (tros.length === 8192) trossos.push(String.fromCharCode(...tros.splice(0)));
  }
  trossos.push(String.fromCharCode(...tros));
  return trossos.join('');
}

/**
 * Decodifica els bytes d'un fitxer de text: UTF-16LE si porta el seu BOM;
 * si no, UTF-8 estricte (sense BOM); i si no és UTF-8 vàlid, windows-1252.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {{ text: string, codificacio: 'utf-8' | 'utf-16le' | 'windows-1252' }}
 */
export function decodificaTextDetallat(bytes) {
  const b = aBytes(bytes);
  if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) return { text: new TextDecoder('utf-16le').decode(b), codificacio: 'utf-16le' };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(b), codificacio: 'utf-8' };
  } catch {
    return { text: decodificaWindows1252(b), codificacio: 'windows-1252' };
  }
}

/**
 * El text d'uns bytes (vegeu decodificaTextDetallat).
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {string}
 */
export const decodificaText = (bytes) => decodificaTextDetallat(bytes).text;
