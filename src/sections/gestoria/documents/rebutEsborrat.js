/**
 * rebutEsborrat.js — el rebut de cada esborrat definitiu que confirma una persona.
 *
 * Cap esborrat sense rebut i cap rebut sense una confirmació vàlida (MAPA de
 * l'empresa i de la llar, §3.1 P6). El rebut NO porta contingut: ni text, ni
 * nom de fitxer, ni ruta. Només el tipus, el sha256 del document, la data,
 * la regla de termini aplicada (amb la data mínima i si s'ha esborrat abans),
 * la confirmació que s'ha donat i qui ha dit que sí (un rol o un àlies, només
 * lletres: mai un document d'identitat ni un correu).
 *
 * VERIFICABLE. L'empremta és el sha256 del JSON canònic del rebut sense
 * l'empremta (el mateix JSON canònic que l'aprovació dels tractors): canviar
 * un sol camp la trenca. Cada rebut pot apuntar a l'empremta de l'anterior i
 * formar una cadena on no es pot llevar ni reordenar cap rebut sense que es
 * veja. Un tipus que no s'esborra mai des de l'app no té rebut possible.
 *
 * MAI «dins de termini» per defecte: si el termini no es pot saber (falta la
 * data que el fixa), si el document encara és vigent o si una condició del
 * tipus no s'ha complit, no hi ha rebut. «abansDelTermini: false» només vol
 * dir que el termini es coneix i ja ha passat, o que el tipus no en té cap
 * i les seues condicions s'han complit.
 * JS pur: sense DOM ni React; cap xarxa. El resum el fa WebCrypto (`subtle`).
 */
import { jsonCanonic, sha256Hex } from '../../tractors/nucli/canonic.js';
import { formatData, parseData } from '../nucli/dates.js';
import { ETIQUETES_DATA, ETIQUETES_FET, esTipus, fitxaTipus, tipusDocument } from './catalegTipus.js';
import { CONFIRMACIONS, confirmacioValida, dataMinimaEsborrat } from './plaNeteja.js';

export const SCHEMA_REBUT = 'sdp.rebut.esborrat.v1';
export const CODIS_REBUT = Object.freeze([
  'DADES_INVALIDES', 'TIPUS_MAI', 'DOCUMENT_VIGENT', 'TERMINI_DESCONEGUT', 'CONDICIO_PENDENT', 'CONFIRMACIO_INVALIDA'
]);

/** Els camps d'un rebut, tots i només estos. */
export const CAMPS_REBUT = Object.freeze([
  'abansDelTermini', 'anterior', 'confirmacio', 'data', 'dataMinima', 'empremta', 'qui', 'regla', 'schema', 'sha256', 'tipus'
]);

const HEX64 = /^[0-9a-f]{64}$/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
/* Un rol o un àlies: lletres, espais, punt, apòstrof i guionet. Sense xifres ni @. */
const QUI = /^\p{L}[\p{L} .'’-]{0,63}$/u;

export class ErrorRebut extends Error {
  constructor(codi, missatge) {
    super(missatge);
    this.name = 'ErrorRebut';
    this.codi = codi;
  }
}

const iso = (d) => formatData(d, 'aaaa-mm-dd');

/* La forma i els valors d'un rebut sense mirar l'empremta; torna el primer error o null. */
function errorDeForma(rebut) {
  if (!rebut || typeof rebut !== 'object' || Array.isArray(rebut)) return 'no és un objecte';
  const claus = Object.keys(rebut).sort();
  if (claus.join(',') !== [...CAMPS_REBUT].sort().join(',')) return 'els camps no són els del rebut';
  if (rebut.schema !== SCHEMA_REBUT) return 'esquema desconegut';
  if (!esTipus(rebut.tipus)) return 'el tipus no és del catàleg';
  if (!HEX64.test(rebut.sha256)) return 'el sha256 no és vàlid';
  if (!DATA_ISO.test(rebut.data) || !parseData(rebut.data)) return 'la data no és vàlida';
  if (rebut.dataMinima !== null && (!DATA_ISO.test(rebut.dataMinima) || !parseData(rebut.dataMinima))) return 'la data mínima no és vàlida';
  if (typeof rebut.abansDelTermini !== 'boolean') return 'falta si s’ha esborrat abans del termini';
  // La regla es compara amb l'empremta, no amb el catàleg d'avui: un rebut vell ha de continuar valent.
  if (typeof rebut.regla !== 'string' || rebut.regla.trim() === '') return 'falta la regla de termini aplicada';
  if (!CONFIRMACIONS.includes(rebut.confirmacio)) return 'la confirmació no és vàlida';
  if (typeof rebut.qui !== 'string' || !QUI.test(rebut.qui)) return 'qui confirma no és vàlid';
  if (rebut.anterior !== null && !HEX64.test(rebut.anterior)) return "l'anterior no és una empremta";
  if (!HEX64.test(rebut.empremta)) return "l'empremta no és vàlida";
  return null;
}

/* Refusa el rebut si el termini no es coneix, si el document és vigent o si una condició no s'ha complit. */
function exigixTerminiConegut(tipus, quan) {
  if (quan.vigent.length) {
    const falta = quan.vigent.map((camp) => ETIQUETES_DATA[camp]).join(' ni ');
    throw new ErrorRebut('DOCUMENT_VIGENT', `«${tipus.nom}» encara és vigent (no hi ha ${falta}): el vigent no s'esborra.`);
  }
  if (quan.falten.length || (quan.ambTermini && !quan.data)) {
    const falta = quan.falten.map((camp) => ETIQUETES_DATA[camp]).join(' ni ') || 'la data que fixa el termini';
    throw new ErrorRebut('TERMINI_DESCONEGUT', `Falta ${falta}: sense saber el termini no hi ha rebut.`);
  }
  const pendents = quan.condicions.filter((c) => !c.complida);
  if (pendents.length) {
    const motius = pendents.map((c) => `${c.valor ? '' : 'no '}${ETIQUETES_FET[c.fet]}`).join(' i ');
    throw new ErrorRebut('CONDICIO_PENDENT', `Encara no es pot esborrar: es podrà quan ${motius}.`);
  }
}

/**
 * Fa el rebut d'un esborrat definitiu. Llança ErrorRebut si les dades no
 * valen ('DADES_INVALIDES'), si el tipus no s'esborra mai des de l'app
 * ('TIPUS_MAI'), si el document encara és vigent ('DOCUMENT_VIGENT'), si no
 * es pot saber el termini ('TERMINI_DESCONEGUT'), si una condició del tipus
 * no s'ha complit ('CONDICIO_PENDENT') o si la confirmació no és la que
 * demana el tipus ('CONFIRMACIO_INVALIDA': escrita per als protegits, dos
 * passos o escrita per als altres).
 * @param {{ document: { tipus: string, sha256: string, dates?: object, fets?: object },
 *   confirmacio: { passos?: number, text?: string }, qui: string, ara: object|string,
 *   anterior?: object|string|null }} entrada
 * @param {SubtleCrypto} [subtle]
 * @returns {Promise<object>} el rebut, congelat
 */
export async function creaRebutEsborrat({ document: doc, confirmacio, qui, ara, anterior = null } = {}, subtle) {
  if (!esTipus(doc?.tipus)) throw new ErrorRebut('DADES_INVALIDES', 'El tipus del document no és del catàleg.');
  const sha256 = String(doc?.sha256 ?? '').toLowerCase();
  if (!HEX64.test(sha256)) throw new ErrorRebut('DADES_INVALIDES', "Cal el sha256 del document (64 xifres hexadecimals).");
  const dia = parseData(ara ?? null);
  if (!dia) throw new ErrorRebut('DADES_INVALIDES', "Cal la data de l'esborrat.");
  const persona = typeof qui === 'string' ? qui.trim() : '';
  if (!QUI.test(persona)) throw new ErrorRebut('DADES_INVALIDES', 'Qui confirma: un rol o un àlies, només lletres (mai un document ni un correu).');
  const previa = anterior == null ? null : String(typeof anterior === 'object' ? anterior.empremta : anterior).toLowerCase();
  if (previa !== null && !HEX64.test(previa)) throw new ErrorRebut('DADES_INVALIDES', "L'anterior ha de ser un rebut o la seua empremta.");
  const tipus = tipusDocument(doc.tipus);
  if (tipus.conservacio.some((r) => r.regla === 'mai')) {
    throw new ErrorRebut('TIPUS_MAI', `«${tipus.nom}» no s'esborra mai des de l'app.`);
  }
  const quan = dataMinimaEsborrat(tipus.id, { dates: doc.dates, fets: doc.fets });
  exigixTerminiConegut(tipus, quan);
  const valida = confirmacioValida(tipus.id, sha256, confirmacio);
  if (!valida) {
    throw new ErrorRebut('CONFIRMACIO_INVALIDA', tipus.protegit === 'no'
      ? 'Cal la confirmació en dos passos o el codi escrit.'
      : 'És un tipus protegit: cal escriure el codi de confirmació.');
  }
  const minima = quan.data;
  const cos = {
    schema: SCHEMA_REBUT,
    tipus: tipus.id,
    sha256,
    data: iso(dia),
    regla: fitxaTipus(tipus.id).quanEsborrar,
    dataMinima: minima ? iso(minima) : null,
    abansDelTermini: minima ? iso(dia) < iso(minima) : false,
    confirmacio: valida,
    qui: persona,
    anterior: previa
  };
  const empremta = await sha256Hex(jsonCanonic(cos), subtle);
  return Object.freeze({ ...cos, empremta });
}

/**
 * Comprova un rebut: la forma, els valors i que l'empremta és la del seu contingut.
 * @param {object} rebut
 * @param {SubtleCrypto} [subtle]
 * @returns {Promise<{ valid: boolean, motiu: string }>}
 */
export async function verificaRebut(rebut, subtle) {
  const error = errorDeForma(rebut);
  if (error) return { valid: false, motiu: `Rebut malformat: ${error}.` };
  const cos = { ...rebut };
  delete cos.empremta;
  const esperada = await sha256Hex(jsonCanonic(cos), subtle);
  if (esperada !== rebut.empremta) return { valid: false, motiu: "L'empremta no correspon al contingut: el rebut s'ha alterat." };
  return { valid: true, motiu: 'Rebut íntegre.' };
}

/**
 * Comprova una cadena de rebuts en ordre: cada un íntegre i cada un apuntant
 * a l'anterior (el primer, a cap).
 * @param {object[]} rebuts
 * @param {SubtleCrypto} [subtle]
 * @returns {Promise<{ valid: boolean, motiu: string, index: number|null }>}
 */
export async function verificaCadena(rebuts, subtle) {
  const llista = Array.isArray(rebuts) ? rebuts : [];
  let anterior = null;
  for (let i = 0; i < llista.length; i += 1) {
    const { valid, motiu } = await verificaRebut(llista[i], subtle);
    if (!valid) return { valid: false, motiu, index: i };
    if (llista[i].anterior !== anterior) return { valid: false, motiu: "La cadena està trencada: no apunta a l'anterior.", index: i };
    anterior = llista[i].empremta;
  }
  return { valid: true, motiu: `${llista.length} rebuts encadenats i íntegres.`, index: null };
}
