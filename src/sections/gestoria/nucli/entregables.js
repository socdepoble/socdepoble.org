/**
 * entregables.js — el CSV i l'XLSX del trimestre, i l'empremta de la proposta.
 *
 * generaEntregables maqueta UN sol full amb la plantilla (maquetaFull, a
 * fullModel.js) i n'escriu els dos formats: el CSV (fullACsv) i l'XLSX
 * (fullAXlsx). Com que tots dos ixen del mateix full, diuen el mateix. Cada
 * fitxer porta l'empremta SHA-256 dels bytes que es descarreguen o es desen.
 *
 * Immutables: el full torna congelat, i els bytes només es lliuren com a
 * còpies (cada lectura de `dades` en dona una de nova). Qui modifique la
 * còpia no toca els bytes que resumix l'empremta.
 *
 * empremtaProposta resumix les dades de la proposta que la persona aprova
 * (titular, període i les files amb les huit columnes i la retenció). Les
 * files s'ordenen pel seu JSON canònic: el mateix contingut dona la mateixa
 * empremta encara que la taula les mostre en un altre ordre, i qualsevol
 * canvi d'una sola dada la canvia. Així l'aprovació queda lligada a eixes
 * dades exactes.
 *
 * JS pur: sense DOM ni React. Res no es desa enlloc.
 */
import { jsonCanonic, sha256Hex } from '../../tractors/nucli/canonic.js';
import { formatData } from './dates.js';
import { fullACsv, maquetaFull, nomsFitxers } from './fullModel.js';
import { PLANTILLA_GESTORIA } from './plantilla.js';
import { fullAXlsx } from './xlsx.js';

export const TIPUS_CSV = 'text/csv;charset=utf-8';
export const TIPUS_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/* Versió del contracte de l'empremta: si canvia el que es resumix, canvia el nom. */
export const SCHEMA_PROPOSTA = 'sdp.gestoria.proposta.v1';

const CAMPS_TEXT = ['num', 'contrapart', 'nif', 'descripcio'];
const CAMPS_IMPORT = ['subtotal', 'iva', 'total', 'retencio'];

/* Congela un objecte i tot el que penja d'ell. */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

function comprovaProposta(proposta) {
  if (!proposta || typeof proposta !== 'object') throw new TypeError('Cal una proposta: { titular, any, t, ingressos, despeses }.');
  for (const llista of ['ingressos', 'despeses']) {
    if (proposta[llista] != null && !Array.isArray(proposta[llista])) {
      throw new TypeError(`La proposta té ${llista} però no és una llista de factures.`);
    }
  }
  return proposta;
}

const llistaDe = (valor) => (Array.isArray(valor) ? valor.filter(Boolean) : []);

/* Un fitxer amb els bytes privats: cada lectura de `dades` en torna una còpia. */
function fitxer(nom, tipus, bytes) {
  const propis = bytes.slice();
  return Object.freeze({
    nom,
    tipus,
    get dades() {
      return propis.slice();
    }
  });
}

/**
 * Els dos fitxers del trimestre a partir de la proposta aprovada.
 * @param {object} p
 * @param {{ titular: string, any: number, t: number, ingressos: object[], despeses: object[] }} p.proposta
 * @param {object} [p.plantilla] per defecte, PLANTILLA_GESTORIA
 * @param {SubtleCrypto} [p.subtle] per defecte, crypto.subtle
 * @returns {Promise<{ full: object, csv: { nom: string, tipus: string, dades: Uint8Array },
 *   xlsx: { nom: string, tipus: string, dades: Uint8Array }, empremtes: { csv: string, xlsx: string } }>}
 */
export async function generaEntregables({ proposta, plantilla = PLANTILLA_GESTORIA, subtle } = {}) {
  const { titular, any, t, ingressos, despeses } = comprovaProposta(proposta);
  const full = congela(maquetaFull(plantilla, { titular, any, t, ingressos: llistaDe(ingressos), despeses: llistaDe(despeses) }));
  const noms = nomsFitxers({ any, t, titular }, plantilla);
  const bytesCsv = new TextEncoder().encode(fullACsv(full));
  const bytesXlsx = fullAXlsx(full);
  const [csv, xlsx] = await Promise.all([sha256Hex(bytesCsv, subtle), sha256Hex(bytesXlsx, subtle)]);
  return Object.freeze({
    full,
    csv: fitxer(noms.csv, TIPUS_CSV, bytesCsv),
    xlsx: fitxer(noms.xlsx, TIPUS_XLSX, bytesXlsx),
    empremtes: Object.freeze({ csv, xlsx })
  });
}

const textDe = (valor) => (valor == null ? '' : String(valor));
const importDe = (valor) => (Number.isSafeInteger(valor) ? valor : null);

/* El que compta d'una factura per al full: les huit columnes, el tipus i la retenció. */
function filaCanonica(f) {
  const fila = { tipus: f?.tipus === 'ingres' ? 'ingres' : 'despesa', data: formatData(f?.data, 'aaaa-mm-dd') || null };
  for (const camp of CAMPS_TEXT) fila[camp] = textDe(f?.[camp]);
  for (const camp of CAMPS_IMPORT) fila[camp] = importDe(f?.[camp]);
  return fila;
}

/* Ordre estable: per unitats UTF-16 del JSON canònic de cada fila. */
function filesOrdenades(llista) {
  return llistaDe(llista)
    .map((f) => jsonCanonic(filaCanonica(f)))
    .sort()
    .map((json) => JSON.parse(json));
}

/**
 * SHA-256 (hex) del JSON canònic de la proposta: titular, any, trimestre i
 * les files d'ingressos i de despeses en ordre estable.
 * @param {{ titular: string, any: number, t: number, ingressos: object[], despeses: object[] }} proposta
 * @param {SubtleCrypto} [subtle] per defecte, crypto.subtle
 * @returns {Promise<string>}
 */
export async function empremtaProposta(proposta, subtle) {
  const p = comprovaProposta(proposta);
  return sha256Hex(jsonCanonic({
    schema: SCHEMA_PROPOSTA,
    titular: textDe(p.titular),
    any: Number.isSafeInteger(p.any) ? p.any : null,
    t: Number.isSafeInteger(p.t) ? p.t : null,
    ingressos: filesOrdenades(p.ingressos),
    despeses: filesOrdenades(p.despeses)
  }), subtle);
}
