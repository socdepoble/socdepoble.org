/**
 * tractorIdentitat.js — el tractor «Gestoria · Fitxa d’identitat i
 * Finestreta» ('gestoria.identitat', manifest a ../../tractors.js).
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): extraure les dades
 * legals dels papers de la persona i tindre-les preparades per a omplir
 * tràmits. Auditoria Codex 261013_1510 §2.1 (ID-H1, ID-H2): un model privat
 * separat, propostes que la persona revisa i cofre local; res a
 * public.profiles, a cap metadata ni a la xarxa. És un tractor NOU, separat
 * dels d'abans: cap font dels altres canvia i les seues aprovacions continuen
 * valent.
 *
 * FAIL-CLOSED, com el del Tauler i el de l'Històric: abans de tocar la Font,
 * ni tan sols per a llistar-ne els noms, s'exigix l'aprovació vigent de
 * 'gestoria.identitat' i que el manifest aprovat siga el d'este codi. Dos
 * passos, cadascun amb la seua porta:
 *   · planificaTractorIdentitat: llista la carpeta i decidix pel nom i les
 *     carpetes (filtreDocuments.decidixLectura, amb la ruta relativa a la
 *     carpeta triada) què es llig, què no i què cal demanar. Cap byte: és la
 *     taula «Què llegiré i què no» que la persona veu abans de llegir.
 *   · executaTractorIdentitat: torna a llistar i a decidir (no es fia de cap
 *     llista de fora) i llig NOMÉS els 'llegir' i els 'demanar' que la
 *     persona ha marcat. Un 'ometre' (salut, banc, credencials, renda,
 *     herència, model 145, imatges, fora d'abast) no s'obri mai, encara que
 *     vinga marcat.
 * De cada fitxer llegit: l'empremta sha256, el text (un PDF generat per
 * màquina, extreuTextPdf, o text pla) i les propostes de l'extractor. Els
 * bytes i el text es deixen anar en acabar el fitxer: l'eixida només porta
 * decisions (ruta, decisió, tipus, organisme i motiu), propostes (camp,
 * valor, regla, confiança i font) i avisos. Sense OCR: un PDF xifrat o
 * escanejat dona un avís i cap proposta, i les dades s'entren a mà. Un
 * senyal (AbortSignal) cancel·la entre fitxers. Res es desa ni ix d'este
 * ordinador. JS pur: sense DOM ni React.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../../../tractors/nucli/aprovacio.js';
import { jsonCanonic, sha256Hex } from '../../../tractors/nucli/canonic.js';
import { manifestNet } from '../../../tractors/nucli/empremta.js';
import { decodificaText } from '../../nucli/csv.js';
import { extreuTextPdf } from '../../nucli/pdfText.js';
import { TRACTOR_IDENTITAT } from '../../tractors.js';
import { extreuPropostes, teSalut } from './extractorIdentitat.js';
import { decidixLectura } from './filtreDocuments.js';

const MB = 1024 * 1024;
/** Límits explícits; els dos executors n'admeten d'altres (enters positius). */
export const LIMITS_IDENTITAT = Object.freeze({ fitxers: 60, midaFitxer: 10 * MB });
/** Els codis d'ErrorIdentitat. */
export const CODIS_TRACTOR_IDENTITAT = Object.freeze(['PARAMETRES_INVALIDS', 'FONT_INVALIDA', 'MASSA_FITXERS', 'LECTURA_CANCELLADA']);
/** Els codis dels avisos: cap porta text del document, només la ruta del fitxer. */
export const CODIS_AVIS_IDENTITAT = Object.freeze([
  'FONT_LIMITADA', 'FITXER_MASSA_GRAN', 'FITXER_ILLEGIBLE', 'PDF_XIFRAT', 'PDF_SENSE_TEXT', 'PDF_INCOMPLET', 'SALUT'
]);

export class ErrorIdentitat extends Error {
  constructor(codi, missatge, { cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorIdentitat';
    this.codi = codi;
  }
}

/* Congela un objecte i tot el que en penja. */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

function comprovaCancelLacio(signal) {
  if (signal?.aborted) throw new ErrorIdentitat('LECTURA_CANCELLADA', 'La lectura dels papers s’ha cancel·lat.');
}

const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);
const avis = (codi, severitat, missatge, ruta = null) => ({ codi, severitat, missatge, ruta });
const mida = (n) => `${Math.max(1, Math.round(n / MB))} MB`;

function extensio(ruta) {
  const nom = ruta.split('/').pop() ?? '';
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
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
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${TRACTOR_IDENTITAT.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== TRACTOR_IDENTITAT.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este (${TRACTOR_IDENTITAT.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, TRACTOR_IDENTITAT)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${TRACTOR_IDENTITAT.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

function exigeixFont(font) {
  if (!font || typeof font.llista !== 'function' || typeof font.llig !== 'function') {
    throw new ErrorIdentitat('FONT_INVALIDA', 'Cal la carpeta triada amb el selector del sistema.');
  }
}

/* Llista la carpeta i decidix cada fitxer pel nom; les limitacions de la Font, en avisos. */
async function decisionsDe(font, signal) {
  const entrades = await font.llista();
  comprovaCancelLacio(signal);
  const llista = Array.isArray(entrades) ? entrades.filter((e) => typeof e?.ruta === 'string' && e.ruta !== '') : [];
  const decisions = llista.map((e) => {
    const { decisio, tipus, organisme, motiu } = decidixLectura(e.ruta);
    return { ruta: e.ruta, decisio, tipus, organisme, motiu };
  });
  const mides = new Map(llista.map((e) => [e.ruta, Number.isFinite(e.mida) ? e.mida : null]));
  const avisos = (Array.isArray(font.limitacions) ? font.limitacions : [])
    .filter((l) => typeof l?.missatge === 'string')
    .map((l) => avis('FONT_LIMITADA', 'mitjana', l.missatge));
  return { decisions, mides, avisos };
}

function informa(onProgres, progres) {
  if (typeof onProgres !== 'function') return;
  try {
    onProgres(Object.freeze(progres));
  } catch {
    /* qui escolta el progrés no pot aturar la lectura */
  }
}

/**
 * La taula «Què llegiré i què no»: llista la carpeta i decidix cada fitxer
 * pel nom i les carpetes, sense obrir-ne cap. FAIL-CLOSED (vegeu la capçalera).
 * @param {object} p
 * @param {object} p.font la Font de la carpeta triada (font/fontNavegador.js)
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.identitat')
 * @param {SubtleCrypto} [p.subtle]
 * @param {AbortSignal} [p.signal]
 * @returns {Promise<Readonly<{ decisions: Array<{ ruta: string, decisio: 'llegir'|'ometre'|'demanar', tipus: string|null,
 *   organisme: string|null, motiu: string }>, avisos: Array<{ codi: string, severitat: string, missatge: string, ruta: string|null }> }>>}
 */
export async function planificaTractorIdentitat({ font, aprovacio, subtle, signal } = {}) {
  comprovaCancelLacio(signal);
  await exigeixTractor(aprovacio, subtle);
  comprovaCancelLacio(signal);
  exigeixFont(font);
  const { decisions, avisos } = await decisionsDe(font, signal);
  return congela({ decisions, avisos });
}

/* El text d'un fitxer llegit, o l'avís que diu per què no n'hi ha. */
async function textDe(bytes, ext, ruta, inflate) {
  if (ext === 'txt') return { text: decodificaText(bytes), avisos: [] };
  const pdf = await extreuTextPdf(bytes, inflate === undefined ? {} : { inflate });
  if (pdf.xifrat) {
    return { text: '', avisos: [avis('PDF_XIFRAT', 'mitjana', 'El PDF està xifrat: no se n’extrau res. Si el necessites, entra’n les dades a mà.', ruta)] };
  }
  const text = typeof pdf.text === 'string' ? pdf.text : '';
  if (text.trim() === '') {
    return {
      text: '',
      avisos: [avis('PDF_SENSE_TEXT', 'mitjana', 'El PDF no té text: potser és escanejat. Sense reconeixement de text (OCR), les dades s’entren a mà.', ruta)]
    };
  }
  /* Els avisos del lector són frases fixes (pàgines sense text, glifs perduts): cap tros del document. */
  const parcials = (Array.isArray(pdf.avisos) ? pdf.avisos : []).map((m) => avis('PDF_INCOMPLET', 'baixa', String(m), ruta));
  return { text, avisos: parcials };
}

/**
 * El tractor «Gestoria · Fitxa d’identitat i Finestreta». FAIL-CLOSED (vegeu la capçalera).
 * @param {object} p
 * @param {object} p.font la Font de la carpeta triada
 * @param {Iterable<string>} [p.marcats] les rutes 'demanar' que la persona ha marcat; les altres no compten
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.identitat')
 * @param {SubtleCrypto} [p.subtle]
 * @param {null|((b: Uint8Array) => Promise<Uint8Array>)} [p.inflate] el descompressor dels PDF (per defecte, el de pdfText)
 * @param {AbortSignal} [p.signal]
 * @param {(p: { fase: string, fet: number, total: number }) => void} [p.onProgres]
 * @param {{ fitxers?: number, midaFitxer?: number }} [p.limits]
 * @returns {Promise<Readonly<{ decisions: object[], propostes: object[], avisos: object[],
 *   llegits: Array<{ ruta: string, propostes: number }> }>>} cap byte ni cap text del document
 */
export async function executaTractorIdentitat({ font, marcats, aprovacio, subtle, inflate, signal, onProgres, limits = {} } = {}) {
  comprovaCancelLacio(signal);
  await exigeixTractor(aprovacio, subtle);
  comprovaCancelLacio(signal);
  exigeixFont(font);
  if (marcats != null && !Array.isArray(marcats) && !(marcats instanceof Set)) {
    throw new ErrorIdentitat('PARAMETRES_INVALIDS', 'Els fitxers marcats són una llista de rutes.');
  }
  const lim = {
    fitxers: enterPositiu(limits?.fitxers, LIMITS_IDENTITAT.fitxers),
    midaFitxer: enterPositiu(limits?.midaFitxer, LIMITS_IDENTITAT.midaFitxer)
  };
  const triats = new Set(marcats == null ? [] : Array.from(marcats).filter((r) => typeof r === 'string'));
  const { decisions, mides, avisos } = await decisionsDe(font, signal);
  /* Només els permesos i els opacs que la persona ha marcat: un vetat marcat no compta. */
  const aLlegir = decisions.filter((d) => d.decisio === 'llegir' || (d.decisio === 'demanar' && triats.has(d.ruta)));
  if (aLlegir.length > lim.fitxers) {
    throw new ErrorIdentitat('MASSA_FITXERS', `Com a molt ${lim.fitxers} papers de colp: tria una carpeta més concreta o desmarca'n algun.`);
  }

  const propostes = [];
  const llegits = [];
  for (let i = 0; i < aLlegir.length; i += 1) {
    const d = aLlegir[i];
    informa(onProgres, { fase: 'llegint', fet: i, total: aLlegir.length });
    comprovaCancelLacio(signal);
    const midaDeclarada = mides.get(d.ruta);
    if (Number.isFinite(midaDeclarada) && midaDeclarada > lim.midaFitxer) {
      avisos.push(avis('FITXER_MASSA_GRAN', 'mitjana', `Fa més de ${mida(lim.midaFitxer)}: no s’ha llegit.`, d.ruta));
      continue;
    }
    let bytes;
    try {
      bytes = await font.llig(d.ruta);
    } catch (error) {
      /* Una carpeta desenxufada no és un fitxer illegible: la lectura sencera s'atura. */
      if (error?.codi === 'FONT_OBLIDADA') throw error;
      comprovaCancelLacio(signal);
      avisos.push(avis(error?.codi === 'FITXER_MASSA_GRAN' ? 'FITXER_MASSA_GRAN' : 'FITXER_ILLEGIBLE', 'mitjana', 'No s’ha pogut llegir.', d.ruta));
      continue;
    }
    comprovaCancelLacio(signal);
    if (!(bytes instanceof Uint8Array) || bytes.length > lim.midaFitxer) {
      avisos.push(bytes instanceof Uint8Array
        ? avis('FITXER_MASSA_GRAN', 'mitjana', `Fa més de ${mida(lim.midaFitxer)}: no s’ha llegit.`, d.ruta)
        : avis('FITXER_ILLEGIBLE', 'mitjana', 'No s’ha pogut llegir.', d.ruta));
      continue;
    }
    const sha256 = await sha256Hex(bytes, subtle);
    let { text, avisos: delText } = await textDe(bytes, extensio(d.ruta), d.ruta, inflate);
    bytes = null;
    comprovaCancelLacio(signal);
    avisos.push(...delText);
    if (text !== '' && teSalut(text)) {
      avisos.push(avis('SALUT', 'alta', 'Porta dades de salut: no se n’ha proposat res i el text s’ha descartat.', d.ruta));
      text = '';
    }
    const delDocument = text === '' ? [] : extreuPropostes({ tipus: d.tipus ?? 'desconegut', text, font: { ruta: d.ruta, sha256 } });
    text = '';
    propostes.push(...delDocument);
    llegits.push({ ruta: d.ruta, propostes: delDocument.length });
  }
  comprovaCancelLacio(signal);
  informa(onProgres, { fase: 'fet', fet: aLlegir.length, total: aLlegir.length });
  return congela({ decisions, propostes: [...propostes], avisos, llegits });
}
