/**
 * tractorEscaner.js — el tractor «Gestoria · Escàner Local de la carpeta»
 * ('gestoria.escaner', manifest a ../../tractors.js).
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): la Gestoria
 * accepta la carpeta arrel sencera, hi troba els extractes del banc i les
 * factures de cada trimestre, avisa dels duplicats, de les dates que no
 * quadren i dels buits, i proposa abocar els extractes al Tauler. Este és
 * l'executor (mapa D, §2): el que llista la Font i en llig bytes. La
 * classificació és el nucli pur (escaner.js).
 *
 * FAIL-CLOSED. Abans de tocar la Font, executaTractorEscaner exigix
 * l'aprovació vigent de 'gestoria.escaner' (exigeixAprovacio) i comprova que
 * el manifest aprovat és el d'este codi (la parella exigeixTractor i
 * mateixManifest es copia de tractorTauler.js, com fa cada tractor: refer-la
 * en comú canviaria les fonts dels altres). Els errors d'aprovació ixen tal
 * qual (ErrorAprovacio); els de la Font, com a ErrorTractor (FONT_OBLIDADA
 * passa tal qual: la carpeta s'ha desenxufat a mitjan lectura); la resta, com
 * a ErrorEscaner amb codi i missatge en valencià.
 *
 * QUÈ LLIG, I PER QUÈ:
 *   · la llista sencera: el nom, la mida i la data de cada fitxer (font.llista);
 *   · els bytes de les factures i dels extractes llegibles que comparteixen la
 *     mida exacta amb un altre (rutesPerEmpremta), només per a calcular-ne
 *     l'empremta sha256 (els duplicats). Mai la identitat, l'arxiu, les
 *     credencials, els documents sensibles pel nom, ni un full o un PDF del banc;
 *   · dels extractes candidats llegibles (banc.llegible, la Norma 43 i el CSV),
 *     només els primers LIMITS_ESCANER.bytesCap bytes (4 kB), tallats a l'última
 *     línia sencera, per a saber el format (formatDelCap). La Font entrega el
 *     fitxer sencer en memòria: la resta es descarta de seguida, i un extracte que
 *     ja s'havia llegit per a l'empremta no es torna a llegir.
 * Res no s'escriu enlloc (mai font.escriu) i res ix d'este ordinador. Un fitxer
 * que no es pot llegir no atura la resta: va a `illegibles` i la radiografia en
 * diu el compte (FONT_LIMITADA, sense cap ruta). Els bytes dels extractes que
 * la persona aboca al Tauler no els llig este tractor: els llig
 * executaTractorTauler, amb l'aprovació de 'gestoria.tauler'.
 *
 * CANCEL·LACIÓ. File.arrayBuffer no admet AbortSignal: entre fitxer i fitxer
 * (i després de cada espera) es mira el senyal; un fitxer ja començat acaba,
 * però els seus bytes es descarten i no se'n comença cap altre ni es torna cap
 * resultat parcial (LECTURA_CANCELLADA).
 * JS pur: sense DOM ni React.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../../../tractors/nucli/aprovacio.js';
import { jsonCanonic, resolSubtle, sha256Hex } from '../../../tractors/nucli/canonic.js';
import { manifestNet } from '../../../tractors/nucli/empremta.js';
import { TRACTOR_ESCANER } from '../../tractors.js';
import { decodificaText } from '../../nucli/csv.js';
import { ErrorTractor, LIMITS_TRACTOR, esRutaOculta } from '../../nucli/tractor.js';
import { LIMITS_TAULER } from '../../tauler/nucli/tractorTauler.js';
import { analitzaCarpeta, classificaArbre, formatDelCap, rutesPerEmpremta } from './escaner.js';

/** Els codis d'ErrorEscaner. */
export const CODIS_TRACTOR_ESCANER = Object.freeze([
  'PARAMETRES_INVALIDS', 'FONT_INVALIDA', 'CARPETA_BUIDA', 'LECTURA_CANCELLADA', 'CRIPTO_ABSENT', 'ERROR_INTERN'
]);
/**
 * Límits explícits; executaTractorEscaner n'admet d'altres (enters positius).
 *   bytesCap     · els bytes del cap d'un extracte candidat que es miren;
 *   midaEmpremta · la mida màxima d'un fitxer per a calcular-ne l'empremta (la de la Font);
 *   midaExtracte · la mida màxima d'un extracte candidat (la que llig el Tauler).
 */
export const LIMITS_ESCANER = Object.freeze({
  bytesCap: 4096,
  midaEmpremta: LIMITS_TRACTOR.midaFitxer,
  midaExtracte: LIMITS_TAULER.midaFitxer
});
/** Les fases del progrés, en ordre. */
export const FASES_ESCANER = Object.freeze(['llistant', 'empremtes', 'reconeixent', 'classificant']);

const MB = 1024 * 1024;
const SALT_DE_LINIA = 0x0a;

export class ErrorEscaner extends Error {
  constructor(codi, missatge, { cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorEscaner';
    this.codi = codi;
  }
}

function comprovaCancelLacio(signal) {
  if (signal?.aborted) throw new ErrorEscaner('LECTURA_CANCELLADA', 'L’anàlisi de la carpeta s’ha cancel·lat.');
}

const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
/* Un límit vàlid és un enter positiu; si no, val el de LIMITS_ESCANER. */
const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);
const mida = (n) => `${Math.max(1, Math.round(n / MB))} MB`;

function extensio(ruta) {
  const nom = String(ruta).split('/').pop() ?? '';
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

/* Un error de la UI que pinta el progrés no atura l'anàlisi. */
function informa(onProgres, fase, fet, total) {
  if (typeof onProgres !== 'function') return;
  try {
    onProgres({ fase, fet, total });
  } catch {
    /* res: el progrés és un avís, no part del resultat */
  }
}

function mateixManifest(rebut, propi) {
  try {
    return jsonCanonic(manifestNet(rebut)) === jsonCanonic(manifestNet(propi));
  } catch {
    return false;
  }
}

/* La porta: l'aprovació vigent, i que siga la del manifest d'este codi. */
async function exigeixTractor(aprovacio, subtle) {
  try {
    await exigeixAprovacio({ ...aprovacio, subtle });
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${TRACTOR_ESCANER.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== TRACTOR_ESCANER.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este (${TRACTOR_ESCANER.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, TRACTOR_ESCANER)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${TRACTOR_ESCANER.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

function subtleDe(subtle) {
  try {
    return resolSubtle(subtle);
  } catch (error) {
    throw new ErrorEscaner('CRIPTO_ABSENT', "Cal WebCrypto per a reconéixer els duplicats: obri l'app en https o en localhost.", { cause: error });
  }
}

/* El cap d'un fitxer com a text: els primers `maxim` bytes, tallats a l'última línia sencera si n'hi ha. */
function capDe(bytes, maxim) {
  if (bytes.length <= maxim) return decodificaText(bytes);
  const tros = bytes.subarray(0, maxim);
  const salt = tros.lastIndexOf(SALT_DE_LINIA);
  return decodificaText(salt > 0 ? tros.subarray(0, salt + 1) : tros);
}

/* Les entrades de la llista: rutes de text, sense ocults, amb la mida i la data si són números. */
function entradesDe(crues) {
  return crues
    .filter((e) => e && typeof e.ruta === 'string' && e.ruta !== '' && !esRutaOculta(e.ruta))
    .map((e) => ({
      ruta: e.ruta,
      mida: Number.isFinite(e.mida) && e.mida >= 0 ? e.mida : null,
      modificat: Number.isFinite(e.modificat) ? e.modificat : null
    }));
}

/* Les limitacions de la Font, només el codi i el missatge (les de l'última llista). */
const limitacionsDe = (font) => (Array.isArray(font?.limitacions) ? font.limitacions : [])
  .filter((l) => l && typeof l.missatge === 'string')
  .map((l) => ({ codi: typeof l.codi === 'string' ? l.codi : null, missatge: l.missatge }));

const aErrorPropi = (error) => (error instanceof ErrorEscaner || error instanceof ErrorTractor || error instanceof ErrorAprovacio
  ? error
  : new ErrorEscaner('ERROR_INTERN', "S'ha produït un error inesperat i l'anàlisi s'ha aturat. No s'ha desat res.", { cause: error }));

/* Llig un fitxer per la Font. Un fitxer que no es pot llegir torna null i s'apunta; la Font oblidada atura. */
async function llegeix(font, ruta, illegibles, signal) {
  let bytes = null;
  let fallada = null;
  try {
    bytes = await font.llig(ruta);
  } catch (error) {
    if (error?.codi === 'FONT_OBLIDADA') throw error;
    fallada = error;
  }
  // Fora del catch: ni el rebuig de l'últim fitxer pot ocultar la cancel·lació.
  comprovaCancelLacio(signal);
  if (fallada || !(bytes instanceof Uint8Array)) {
    const massa = fallada?.codi === 'FITXER_MASSA_GRAN';
    illegibles.push({
      ruta,
      codi: massa ? 'FITXER_MASSA_GRAN' : 'FITXER_ILLEGIBLE',
      missatge: massa ? `«${ruta}» és massa gran: no s'ha llegit.` : `«${ruta}» no s'ha pogut llegir.`
    });
    return null;
  }
  return bytes;
}

/**
 * El tractor «Gestoria · Escàner Local de la carpeta». FAIL-CLOSED (vegeu la capçalera).
 * @param {object} p
 * @param {{ nom?: string, llista: () => Promise<Array<{ ruta: string, mida?: number, modificat?: number }>>,
 *   llig: (ruta: string) => Promise<Uint8Array>, limitacions?: Array<{ codi?: string, missatge: string }> }} p.font
 *   la de font/fontNavegador.js (només lectura: mai es crida `escriu`)
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.escaner')
 * @param {SubtleCrypto} [p.subtle]
 * @param {{ a: number, m: number, d: number }|null} [p.avui] el dia d'avui, per als buits (un objecte pla, mai un Date)
 * @param {AbortSignal} [p.signal] cancel·lació cooperativa entre fitxers
 * @param {(p: { fase: string, fet: number, total: number|null }) => void} [p.onProgres]
 * @param {{ bytesCap?: number, midaEmpremta?: number, midaExtracte?: number }} [p.limits]
 * @param {RegExp|null} [p.serie] la sèrie de les factures emeses, si se sap
 * @returns {Promise<{ radiografia: object, documents: object[], duplicats: object[], incongruencies: object[],
 *   buits: object[], alertes: object[], extractes: object[], illegibles: Array<{ ruta: string, codi: string, missatge: string }> }>}
 *   el d'analitzaCarpeta d'escaner.js, més els fitxers que no s'han pogut llegir; mai bytes ni text dels fitxers
 */
export async function executaTractorEscaner({
  font, aprovacio, subtle, avui = null, signal, onProgres, limits = {}, serie = null
} = {}) {
  comprovaCancelLacio(signal);
  await exigeixTractor(aprovacio, subtle);
  comprovaCancelLacio(signal);
  if (!font || typeof font.llista !== 'function' || typeof font.llig !== 'function') {
    throw new ErrorEscaner('FONT_INVALIDA', 'Cal una carpeta triada amb el selector del sistema.');
  }
  const lim = {
    bytesCap: enterPositiu(limits?.bytesCap, LIMITS_ESCANER.bytesCap),
    midaEmpremta: enterPositiu(limits?.midaEmpremta, LIMITS_ESCANER.midaEmpremta),
    midaExtracte: enterPositiu(limits?.midaExtracte, LIMITS_ESCANER.midaExtracte)
  };
  try {
    return await escaneja({ font, subtle, avui, signal, onProgres, lim, serie });
  } catch (error) {
    throw aErrorPropi(error);
  }
}

async function escaneja({ font, subtle, avui, signal, onProgres, lim, serie }) {
  informa(onProgres, 'llistant', 0, null);
  const crues = await font.llista();
  comprovaCancelLacio(signal);
  if (!Array.isArray(crues)) throw new ErrorEscaner('FONT_INVALIDA', 'La carpeta no ha tornat cap llista de fitxers.');
  const limitacions = limitacionsDe(font);
  const entrades = entradesDe(crues);
  if (entrades.length === 0) {
    throw new ErrorEscaner('CARPETA_BUIDA', 'La carpeta no té cap fitxer per a analitzar (una carpeta buida no es veu).');
  }

  /* Què es llig: l'empremta dels que comparteixen mida i el cap dels extractes candidats llegibles. */
  const perEmpremta = rutesPerEmpremta(entrades, { midaMaxima: lim.midaEmpremta, serie });
  const candidats = new Map(classificaArbre(entrades, { serie }).filter((d) => d.banc?.llegible === true).map((d) => [d.ruta, d]));
  const midaDe = new Map(entrades.map((e) => [e.ruta, e.mida]));
  const s = perEmpremta.length ? subtleDe(subtle) : null;
  const empremtes = new Map();
  const formats = {};
  const illegibles = [];
  const reconeix = (ruta, bytes) => {
    const m = midaDe.get(ruta);
    if (Number.isFinite(m) && m > lim.midaExtracte) {
      illegibles.push({ ruta, codi: 'FITXER_MASSA_GRAN', missatge: `«${ruta}» fa més de ${mida(lim.midaExtracte)}: el Tauler no el llegiria.` });
      return;
    }
    formats[ruta] = formatDelCap(capDe(bytes, lim.bytesCap), extensio(ruta));
  };

  for (const [i, ruta] of perEmpremta.entries()) {
    comprovaCancelLacio(signal);
    informa(onProgres, 'empremtes', i, perEmpremta.length);
    const bytes = await llegeix(font, ruta, illegibles, signal);
    if (!bytes) continue;
    empremtes.set(ruta, await sha256Hex(bytes, s));
    comprovaCancelLacio(signal);
    /* Un extracte que també comparteix mida: el cap ix dels mateixos bytes, sense tornar-lo a llegir. */
    if (candidats.has(ruta)) reconeix(ruta, bytes);
  }
  informa(onProgres, 'empremtes', perEmpremta.length, perEmpremta.length);

  const perCap = [...candidats.keys()].filter((ruta) => !empremtes.has(ruta) && !illegibles.some((x) => x.ruta === ruta)).sort(compara);
  for (const [i, ruta] of perCap.entries()) {
    comprovaCancelLacio(signal);
    informa(onProgres, 'reconeixent', i, perCap.length);
    const m = midaDe.get(ruta);
    if (Number.isFinite(m) && m > lim.midaExtracte) {
      illegibles.push({ ruta, codi: 'FITXER_MASSA_GRAN', missatge: `«${ruta}» fa més de ${mida(lim.midaExtracte)}: el Tauler no el llegiria.` });
      continue;
    }
    const bytes = await llegeix(font, ruta, illegibles, signal);
    if (bytes) reconeix(ruta, bytes);
  }
  informa(onProgres, 'reconeixent', perCap.length, perCap.length);

  comprovaCancelLacio(signal);
  informa(onProgres, 'classificant', 0, 1);
  if (illegibles.length) {
    limitacions.push({
      codi: 'FITXER_ILLEGIBLE',
      missatge: illegibles.length === 1
        ? "Un fitxer no s'ha pogut llegir: no se n'ha calculat l'empremta ni el format."
        : `${illegibles.length} fitxers no s'han pogut llegir: no se n'ha calculat l'empremta ni el format.`
    });
  }
  const ambEmpremta = entrades.map((e) => (empremtes.has(e.ruta) ? { ...e, sha256: empremtes.get(e.ruta) } : e));
  const resultat = analitzaCarpeta({
    nom: typeof font.nom === 'string' ? font.nom : '', entrades: ambEmpremta, formats, avui, serie, limitacions
  });
  comprovaCancelLacio(signal);
  informa(onProgres, 'classificant', 1, 1);
  return { ...resultat, illegibles: illegibles.sort((x, y) => compara(x.ruta, y.ruta)) };
}
