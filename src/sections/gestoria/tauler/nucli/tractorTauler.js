/**
 * tractorTauler.js — el tractor «Gestoria · Tauler de l'empresa»
 * ('gestoria.tauler', manifest a ../../tractors.js).
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA): llegir els bancs des
 * del Tauler és una lectura nova de dades personals, i per això té el seu
 * propi tractor, separat dels dos signats (MAPA §4, pas 1, decisió A2).
 *
 * FAIL-CLOSED. Abans de tocar cap fitxer, executaTractorTauler exigix
 * l'aprovació vigent de 'gestoria.tauler' (exigeixAprovacio) i comprova que
 * el manifest aprovat és el d'este codi. Els errors d'aprovació ixen tal qual
 * (ErrorAprovacio); la resta, com a ErrorTauler amb codi i missatge en
 * valencià. Els bytes de cada fitxer es demanen (arrayBuffer) DESPRÉS de
 * l'aprovació.
 *
 * Els fitxers: els que tria la persona amb el selector del sistema (objectes
 * File: { name, size, arrayBuffer() }). Per l'extensió:
 *   · Norma 43 (EXTENSIONS_NORMA43) · llegeixC43 de nucli/c43.js;
 *   · .csv · el CSV de moviments del banc, llegeixMovimentsCsv;
 *   · .json · la configuració de l'empresa (l'esquema de
 *     facturacio/configEmpresa.js): només se'n queda el nom i la població
 *     del domicili fiscal, per a la boina personal (identitatDeConfig).
 * Un fitxer d'un altre tipus, massa gran o que no es pot llegir no atura la
 * resta: torna com a avís. Res no es desa enlloc i res ix d'este ordinador.
 *
 * LA LECTURA REDUÏDA (ordre del Mestre, 261004, privacitat): el fitxer es
 * llig sencer en memòria, però el tractor només torna el que les xifres del
 * Tauler necessiten (reduixC43, reduixCsv). De cada compte: l'entitat, els
 * quatre últims dígits, la moneda, les dates i els saldos. De cada moviment:
 * les dates, l'import, el concepte comú de la norma (el codi genèric de dues
 * xifres) i, si n'hi ha, l'import en l'altra moneda. Del CSV: les dates,
 * l'import i el saldo de cada fila. Dels avisos: el codi i la severitat. Mai
 * ix d'ací l'oficina, el nom del titular, el text dels conceptes, les
 * referències, el document ni el rebut SEPA (el creditor, el seu
 * identificador amb el NIF i el mandat), ni el nom del fitxer, que només
 * apareix a l'avís d'un fitxer que no s'ha pogut llegir. La fitxa ho diu així.
 * JS pur: sense DOM ni React.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../../../tractors/nucli/aprovacio.js';
import { jsonCanonic } from '../../../tractors/nucli/canonic.js';
import { manifestNet } from '../../../tractors/nucli/empremta.js';
import { TRACTOR_TAULER } from '../../tractors.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { decodificaText } from '../../nucli/csv.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';

const MB = 1024 * 1024;
/** Límits explícits; executaTractorTauler n'admet d'altres (enters positius). */
export const LIMITS_TAULER = Object.freeze({ fitxers: 24, midaFitxer: 10 * MB });
/** Les extensions dels extractes en Norma 43 que donen els bancs. */
export const EXTENSIONS_NORMA43 = Object.freeze(['n43', 'aeb', 'c43', 'q43', 'txt', 'dat']);
/** El que accepta el selector de fitxers del Tauler. */
export const ACCEPTA_TAULER = [...EXTENSIONS_NORMA43, 'csv', 'json'].map((ext) => `.${ext}`).join(',');
/* L'esquema de la configuració de l'empresa (ESQUEMA_CONFIG_EMPRESA de
   facturacio/configEmpresa.js). Es copia el text i no s'importa: el tractor
   del Tauler no ha de dependre del carril de facturació, i una prova
   comprova que són iguals. */
export const ESQUEMA_CONFIG = 'sdp.gestoria.config-empresa.v1';
/** Els codis d'ErrorTauler i dels avisos de lectura. */
export const CODIS_TRACTOR_TAULER = Object.freeze([
  'PARAMETRES_INVALIDS', 'MASSA_FITXERS', 'TIPUS_DESCONEGUT', 'FITXER_MASSA_GRAN', 'FITXER_ILLEGIBLE', 'CONFIG_INVALIDA',
  'LECTURA_CANCELLADA'
]);
const MAX_TEXT = 120;

export class ErrorTauler extends Error {
  constructor(codi, missatge, { cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorTauler';
    this.codi = codi;
  }
}

/* File.arrayBuffer no admet AbortSignal. Quan acaba, descartem els bytes
   d'una lectura cancel·lada i no comencem cap fitxer més ni tornem parcials. */
function comprovaCancelLacio(signal) {
  if (signal?.aborted) throw new ErrorTauler('LECTURA_CANCELLADA', 'La lectura dels extractes s’ha cancel·lat.');
}

const avis = (codi, missatge, fitxer) => Object.freeze({ codi, severitat: 'mitjana', missatge, fitxer });
const mida = (n) => `${Math.max(1, Math.round(n / MB))} MB`;

function extensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

/* Un límit vàlid és un enter positiu; si no, val el de LIMITS_TAULER. */
const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);

/* Un text d'una línia i de com a molt MAX_TEXT caràcters, o ''. */
function textNet(valor) {
  if (typeof valor !== 'string') return '';
  const net = valor.replace(/\s+/g, ' ').trim();
  return net.length <= MAX_TEXT ? net : '';
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
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${TRACTOR_TAULER.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== TRACTOR_TAULER.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este (${TRACTOR_TAULER.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, TRACTOR_TAULER)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${TRACTOR_TAULER.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

/**
 * La identitat de la boina personal a partir de la configuració de
 * l'empresa: el nom comercial (o el legal) i la població del domicili
 * fiscal. Res més: ni el NIF, ni l'adreça, ni els comptes.
 * @param {object} config
 * @returns {{ nom: string, poble: string }|null}
 */
export function identitatDeConfig(config) {
  if (!config || typeof config !== 'object' || config.esquema !== ESQUEMA_CONFIG) return null;
  const nom = textNet(config.nomComercial) || textNet(config.nom);
  if (!nom) return null;
  const fiscal = Array.isArray(config.domicilis) ? config.domicilis.find((d) => d && d.id === config.domiciliFiscal) : null;
  return { nom, poble: textNet(fiscal?.poblacio) };
}

/* Una data { a, m, d } copiada, o null: la lectura reduïda no compartix cap objecte amb la sencera. */
const dataDe = (d) => (d && typeof d === 'object' ? { a: d.a, m: d.m, d: d.d } : null);
/* D'un avís, només el codi i la severitat: el missatge pot citar línies i referències de l'extracte. */
const avisReduit = (a) => ({ codi: a?.codi ?? null, severitat: a?.severitat ?? null });

/* Un moviment de la Norma 43, reduït a les dates, l'import, el concepte comú i l'import en divisa. */
function movimentReduit(m) {
  const reduit = {
    dataOperacio: dataDe(m?.dataOperacio),
    dataValor: dataDe(m?.dataValor),
    centims: m?.centims ?? null,
    conceptComu: typeof m?.conceptComu === 'string' ? m.conceptComu : ''
  };
  if (m?.divisa) reduit.divisa = { moneda: m.divisa.moneda ?? null, centims: m.divisa.centims ?? null };
  return reduit;
}

/**
 * La lectura de la Norma 43 que guarda el Tauler (vegeu la capçalera).
 * @param {object} lectura el que torna llegeixC43
 * @returns {{ comptes: Array<{ capcalera: { entitat: string, compte4: string, dataInicial: object|null,
 *   dataFinal: object|null, saldoInicial: number|null, divisa: string|null }, moviments: object[],
 *   peu: { saldoFinal: number|null }|null }>, avisos: Array<{ codi: string, severitat: string }> }}
 */
export function reduixC43(lectura) {
  return {
    comptes: (lectura?.comptes ?? []).map((compte) => {
      const cap = compte?.capcalera ?? {};
      return {
        capcalera: {
          entitat: cap.entitat ?? null,
          compte4: cap.compte4 ?? null,
          dataInicial: dataDe(cap.dataInicial),
          dataFinal: dataDe(cap.dataFinal),
          saldoInicial: cap.saldoInicial ?? null,
          divisa: cap.divisa ?? null
        },
        moviments: (compte?.moviments ?? []).map(movimentReduit),
        peu: compte?.peu ? { saldoFinal: compte.peu.saldoFinal ?? null } : null
      };
    }),
    avisos: (lectura?.avisos ?? []).map(avisReduit)
  };
}

/**
 * La lectura del CSV del banc que guarda el Tauler: ni el concepte ni el comerç.
 * @param {object} lectura el que torna llegeixMovimentsCsv
 * @returns {{ moviments: Array<{ fila: number, dataOperacio: object|null, dataValor: object|null,
 *   centims: number|null, saldo: number|null }>, avisos: Array<{ codi: string, severitat: string }> }}
 */
export function reduixCsv(lectura) {
  return {
    moviments: (lectura?.moviments ?? []).map((f) => ({
      fila: f?.fila ?? null,
      dataOperacio: dataDe(f?.dataOperacio),
      dataValor: dataDe(f?.dataValor),
      centims: f?.centims ?? null,
      saldo: f?.saldo ?? null
    })),
    avisos: (lectura?.avisos ?? []).map(avisReduit)
  };
}

async function bytesDe(fitxer) {
  const dades = await fitxer.arrayBuffer();
  return dades instanceof Uint8Array ? dades : new Uint8Array(dades);
}

/**
 * El tractor «Gestoria · Tauler de l'empresa». FAIL-CLOSED (vegeu la capçalera).
 * @param {object} p
 * @param {ArrayLike<{ name: string, size?: number, arrayBuffer: () => Promise<ArrayBuffer> }>} p.fitxers
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.tauler')
 * @param {SubtleCrypto} [p.subtle]
 * @param {{ fitxers?: number, midaFitxer?: number }} [p.limits]
 * @param {AbortSignal} [p.signal] cancel·lació cooperativa entre etapes
 * @returns {Promise<{ extractes: Array<{ lectura: object }>, csv: Array<{ lectura: object }>,
 *   identitat: { nom: string, poble: string }|null, avisos: Array<{ codi: string, severitat: string, missatge: string, fitxer: string }> }>}
 *   `lectura`: la reduïda (reduixC43, reduixCsv), mai la sencera.
 */
export async function executaTractorTauler({ fitxers, aprovacio, subtle, limits = {}, signal } = {}) {
  comprovaCancelLacio(signal);
  await exigeixTractor(aprovacio, subtle);
  comprovaCancelLacio(signal);
  const lim = {
    fitxers: enterPositiu(limits.fitxers, LIMITS_TAULER.fitxers),
    midaFitxer: enterPositiu(limits.midaFitxer, LIMITS_TAULER.midaFitxer)
  };
  const llista = fitxers && typeof fitxers.length === 'number' ? Array.from(fitxers) : [];
  if (llista.length === 0) throw new ErrorTauler('PARAMETRES_INVALIDS', 'Tria almenys un extracte del banc.');
  if (llista.length > lim.fitxers) {
    throw new ErrorTauler('MASSA_FITXERS', `Com a molt ${lim.fitxers} fitxers de colp: tria només els extractes que vols veure.`);
  }
  const extractes = [];
  const csv = [];
  const avisos = [];
  let identitat = null;
  for (const fitxer of llista) {
    comprovaCancelLacio(signal);
    const nom = typeof fitxer?.name === 'string' && fitxer.name !== '' ? fitxer.name : 'sense nom';
    const ext = extensio(nom);
    if (![...EXTENSIONS_NORMA43, 'csv', 'json'].includes(ext)) {
      avisos.push(avis('TIPUS_DESCONEGUT', `«${nom}» no és un extracte del banc (Norma 43 o CSV) ni la configuració: no s’ha llegit.`, nom));
      continue;
    }
    if (Number.isFinite(fitxer.size) && fitxer.size > lim.midaFitxer) {
      avisos.push(avis('FITXER_MASSA_GRAN', `«${nom}» fa més de ${mida(lim.midaFitxer)}: no s’ha llegit.`, nom));
      continue;
    }
    let bytes;
    let illegible = false;
    try {
      bytes = await bytesDe(fitxer);
    } catch {
      illegible = true;
    }
    // Fora del catch: ni el rebuig de l'últim fitxer pot ocultar l'abort.
    comprovaCancelLacio(signal);
    if (illegible) {
      avisos.push(avis('FITXER_ILLEGIBLE', `«${nom}» no s’ha pogut llegir.`, nom));
      continue;
    }
    if (bytes.length > lim.midaFitxer) {
      avisos.push(avis('FITXER_MASSA_GRAN', `«${nom}» fa més de ${mida(lim.midaFitxer)}: no s’ha llegit.`, nom));
      continue;
    }
    if (ext === 'json') {
      let config = null;
      try {
        config = JSON.parse(decodificaText(bytes));
      } catch {
        config = null;
      }
      const llegida = identitatDeConfig(config);
      if (llegida) identitat = llegida;
      else avisos.push(avis('CONFIG_INVALIDA', `«${nom}» no és la configuració de l’empresa (${ESQUEMA_CONFIG}): la boina continua sense nom.`, nom));
    } else if (ext === 'csv') {
      csv.push({ lectura: reduixCsv(llegeixMovimentsCsv(decodificaText(bytes))) });
    } else {
      extractes.push({ lectura: reduixC43(llegeixC43(bytes)) });
    }
  }
  comprovaCancelLacio(signal);
  return { extractes, csv, identitat, avisos };
}
