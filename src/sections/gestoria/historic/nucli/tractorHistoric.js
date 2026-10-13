/**
 * tractorHistoric.js — el tractor «Gestoria · Històric del banc i despesa en
 * IA» ('gestoria.historic', manifest a ../../tractors.js).
 *
 * Onada 6, ordre del Mestre (261009): «importar tot l'històric (des de l'any
 * passat fins al trimestre passat)» i «calcular les despeses massives en IA».
 * És un tractor NOU, separat dels tres signats (decisió per defecte 6 de la
 * nit del 261009): cap font dels altres canvia i les seues aprovacions
 * continuen valent.
 *
 * FAIL-CLOSED, com el del Tauler (tauler/nucli/tractorTauler.js): abans de
 * tocar cap fitxer, executaTractorHistoric exigix l'aprovació vigent de
 * 'gestoria.historic' i que el manifest aprovat siga el d'este codi. Els bytes
 * de cada fitxer es demanen (arrayBuffer) DESPRÉS de l'aprovació. Un senyal
 * (AbortSignal) cancel·la entre etapes: el fitxer començat acaba, els seus
 * bytes es descarten i no se'n comença cap més.
 *
 * Els fitxers: fins a 60 extractes, de 10 MB com a molt cadascun, en Norma 43
 * (EXTENSIONS_NORMA43) o el CSV de moviments del banc.
 *
 * CLASSIFICA DINS. El text dels conceptes, el comerç de la targeta i el rebut
 * SEPA només viuen ací dins, el temps de classificar cada moviment
 * (despeses/nucli/categories.js, amb les regles de la persona). Si hi ha
 * Norma 43 i CSV alhora, abans de classificar es fusionen (el CSV aporta el
 * comerç de les compres amb targeta). La lectura que torna és la REDUÏDA del
 * Tauler (reduixC43, reduixCsv) més, per a cada moviment, un identificador
 * opac (una empremta FNV-1a de compte, dates, import i ordinal: cap text; si
 * dos comptes acabats igual el compartixen, el segon el du desambiguat, vegeu
 * desambiguaIds),
 * la categoria, el proveïdor, la confiança i el codi del motiu. Mai ix d'ací
 * el text dels conceptes, el comerç, les referències, el document, el SEPA,
 * el nom del titular ni el nom del fitxer (només a l'avís d'un fitxer que no
 * s'ha pogut llegir). Res no es desa i res ix d'este ordinador.
 * JS pur: sense DOM ni React.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../../../tractors/nucli/aprovacio.js';
import { jsonCanonic } from '../../../tractors/nucli/canonic.js';
import { manifestNet } from '../../../tractors/nucli/empremta.js';
import { classificaMoviment, validaRegla } from '../../despeses/nucli/categories.js';
import { llegeixC43, textDelsConceptes } from '../../nucli/c43.js';
import { decodificaText } from '../../nucli/csv.js';
import { formatData } from '../../nucli/dates.js';
import { fusionaMoviments, llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import { EXTENSIONS_NORMA43, reduixC43, reduixCsv } from '../../tauler/nucli/tractorTauler.js';
import { TRACTOR_HISTORIC } from '../../tractors.js';

const MB = 1024 * 1024;
/** Límits explícits; executaTractorHistoric n'admet d'altres (enters positius). */
export const LIMITS_HISTORIC = Object.freeze({ fitxers: 60, midaFitxer: 10 * MB, regles: 200 });
/** El que accepta el selector de fitxers de l'Històric. */
export const ACCEPTA_HISTORIC = [...EXTENSIONS_NORMA43, 'csv'].map((ext) => `.${ext}`).join(',');
/** Els codis d'ErrorHistoric i dels avisos de lectura. */
export const CODIS_TRACTOR_HISTORIC = Object.freeze([
  'PARAMETRES_INVALIDS', 'MASSA_FITXERS', 'TIPUS_DESCONEGUT', 'FITXER_MASSA_GRAN', 'FITXER_ILLEGIBLE', 'REGLA_INVALIDA',
  'LECTURA_CANCELLADA'
]);

export class ErrorHistoric extends Error {
  constructor(codi, missatge, { cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorHistoric';
    this.codi = codi;
  }
}

function comprovaCancelLacio(signal) {
  if (signal?.aborted) throw new ErrorHistoric('LECTURA_CANCELLADA', 'La lectura de l’històric s’ha cancel·lat.');
}

const avis = (codi, missatge, fitxer) => Object.freeze({ codi, severitat: 'mitjana', missatge, fitxer });
const mida = (n) => `${Math.max(1, Math.round(n / MB))} MB`;
const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);

function extensio(nom) {
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
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${TRACTOR_HISTORIC.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== TRACTOR_HISTORIC.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este (${TRACTOR_HISTORIC.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, TRACTOR_HISTORIC)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${TRACTOR_HISTORIC.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

/**
 * Una empremta FNV-1a de 32 bits, en hexadecimal: un identificador opac i
 * estable, no un resum criptogràfic. No porta cap text del banc.
 * @param {string} text
 * @returns {string}
 */
export function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/* Els identificadors dels moviments d'un compte d'un extracte: compte, dates i
   import, amb l'ordinal dels iguals dins del MATEIX extracte. Així el mateix
   moviment té el mateix id en dos extractes que se solapen, siga quin siga
   l'ordre dels fitxers, i una reclassificació desada continua valent. */
function creaIds() {
  const vistos = new Map();
  return (compte, m) => {
    const base = [compte, formatData(m?.dataOperacio, 'aaaa-mm-dd'), formatData(m?.dataValor, 'aaaa-mm-dd'), m?.centims ?? ''].join('|');
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    return `m${fnv1a(`${base}|${n}`)}${n > 1 ? `-${n}` : ''}`;
  };
}

const comparaText = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/*
 * Revisió adversarial 13-10-2026, troballes FIN-4 i TI-1. Des de GES-A2, dos
 * comptes de la mateixa entitat acabats en els mateixos quatre dígits són dos
 * comptes, però la clau dels id (entitat i sufix) era la mateixa: el mateix
 * moviment (dates i import) en tots dos tenia el mateix id, i reclassificar-ne
 * un canviava l'altre. Ara, dins d'una lectura, un id que fan dos comptes
 * diferents (`idCompte`) amb la mateixa clau el conserva el primer, tal com
 * era (les reclassificacions desades continuen valent), i els altres el
 * reben desambiguat amb el seu ordinal: m + FNV-1a de «id|ordinal». Els
 * moviments que no coincidixen no canvien mai.
 * L'ordre dels comptes no depén de la sal de la sessió (que canvia els
 * `idCompte` en cada sessió) ni de l'ordre dels fitxers: primer l'oficina de
 * la capçalera (que només es mira ací i no ix); amb la mateixa oficina, la
 * llista ordenada dels id dels seus moviments; i, si encara empaten (els
 * mateixos moviments), l'`idCompte`. L'únic que en pot deduir qui veja els
 * id és que un compte va abans que l'altre: res de cap xifra. Un hash sense
 * sal del número sencer seria estable fins i tot llegint els comptes per
 * separat, però amb 32 bits i l'entitat i el sufix coneguts es desfà provant
 * números; i el número sencer no ix de c43.js.
 * `trams`: un per compte de cada extracte, { clau, qui, oficina, compte }, on
 * `compte` és el reduït (se li canvien els id dels moviments).
 */
function desambiguaIds(trams) {
  const perClau = new Map();
  for (const tram of trams) {
    if (!perClau.has(tram.clau)) perClau.set(tram.clau, new Map());
    const perQui = perClau.get(tram.clau);
    if (!perQui.has(tram.qui)) perQui.set(tram.qui, { qui: tram.qui, oficina: tram.oficina, trams: [] });
    perQui.get(tram.qui).trams.push(tram);
  }
  for (const perQui of perClau.values()) {
    if (perQui.size < 2) continue;
    const comptes = [...perQui.values()].map((c) => ({
      ...c, firma: [...new Set(c.trams.flatMap((t) => t.compte.moviments.map((m) => m.id)))].sort().join(',')
    })).sort((x, y) => comparaText(x.oficina, y.oficina) || comparaText(x.firma, y.firma) || comparaText(x.qui, y.qui));
    const presos = new Set();
    comptes.forEach((c, i) => {
      const propis = new Set();
      for (const { compte } of c.trams) {
        compte.moviments = compte.moviments.map((m) => {
          propis.add(m.id);
          return presos.has(m.id) ? { ...m, id: `m${fnv1a(`${m.id}|${i + 1}`)}` } : m;
        });
      }
      for (const id of propis) presos.add(id);
    });
  }
}

const classificacioDe = (c) => ({ categoria: c.categoria, proveidor: c.proveidor, confianca: c.confianca, motiu: c.motiu });

async function bytesDe(fitxer) {
  const dades = await fitxer.arrayBuffer();
  return dades instanceof Uint8Array ? dades : new Uint8Array(dades);
}

/**
 * Les regles de la persona, comprovades. Una regla no vàlida atura la
 * lectura: millor dir-ho que classificar a mitges.
 * @param {unknown} regles
 * @param {number} maxim
 * @returns {Array<{ patro: string, categoria: string, proveidor: string|null }>}
 */
function reglesValides(regles, maxim) {
  if (regles == null) return [];
  if (!Array.isArray(regles)) throw new ErrorHistoric('REGLA_INVALIDA', 'Les regles han de ser una llista.');
  if (regles.length > maxim) throw new ErrorHistoric('REGLA_INVALIDA', `Com a molt ${maxim} regles.`);
  regles.forEach((regla, i) => {
    const errors = validaRegla(regla);
    if (errors.length) throw new ErrorHistoric('REGLA_INVALIDA', `La regla ${i + 1} no és vàlida: ${errors[0]}`);
  });
  return regles.map((r) => ({ patro: String(r.patro), categoria: r.categoria, proveidor: r.proveidor ?? null }));
}

/**
 * El tractor «Gestoria · Històric del banc i despesa en IA». FAIL-CLOSED (vegeu la capçalera).
 * @param {object} p
 * @param {ArrayLike<{ name: string, size?: number, arrayBuffer: () => Promise<ArrayBuffer> }>} p.fitxers
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.historic')
 * @param {SubtleCrypto} [p.subtle]
 * @param {Array<{ patro: string, categoria: string, proveidor?: string|null }>} [p.regles] les de la persona
 * @param {{ fitxers?: number, midaFitxer?: number, regles?: number }} [p.limits]
 * @param {AbortSignal} [p.signal]
 * @returns {Promise<{ extractes: Array<{ lectura: object }>, csv: Array<{ lectura: object }>,
 *   avisos: Array<{ codi: string, severitat: string, missatge: string, fitxer: string }>,
 *   classificats: Record<string, number> }>}
 *   `lectura`: la reduïda del Tauler amb { id, categoria, proveidor, confianca, motiu } a cada moviment.
 */
export async function executaTractorHistoric({ fitxers, aprovacio, subtle, regles = [], limits = {}, signal } = {}) {
  comprovaCancelLacio(signal);
  await exigeixTractor(aprovacio, subtle);
  comprovaCancelLacio(signal);
  const lim = {
    fitxers: enterPositiu(limits.fitxers, LIMITS_HISTORIC.fitxers),
    midaFitxer: enterPositiu(limits.midaFitxer, LIMITS_HISTORIC.midaFitxer),
    regles: enterPositiu(limits.regles, LIMITS_HISTORIC.regles)
  };
  const propies = reglesValides(regles, lim.regles);
  const llista = fitxers && typeof fitxers.length === 'number' ? Array.from(fitxers) : [];
  if (llista.length === 0) throw new ErrorHistoric('PARAMETRES_INVALIDS', 'Tria almenys un extracte del banc.');
  if (llista.length > lim.fitxers) {
    throw new ErrorHistoric('MASSA_FITXERS', `Com a molt ${lim.fitxers} fitxers de colp: tria els extractes del període que vols veure.`);
  }

  /* 1. Llegir (les lectures senceres només viuen dins d'esta crida). */
  const lecturesC43 = [];
  const lecturesCsv = [];
  const avisos = [];
  for (const fitxer of llista) {
    comprovaCancelLacio(signal);
    const nom = typeof fitxer?.name === 'string' && fitxer.name !== '' ? fitxer.name : 'sense nom';
    const ext = extensio(nom);
    if (![...EXTENSIONS_NORMA43, 'csv'].includes(ext)) {
      avisos.push(avis('TIPUS_DESCONEGUT', `«${nom}» no és un extracte del banc (Norma 43 o CSV): no s’ha llegit.`, nom));
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
    comprovaCancelLacio(signal);
    if (illegible) {
      avisos.push(avis('FITXER_ILLEGIBLE', `«${nom}» no s’ha pogut llegir.`, nom));
      continue;
    }
    if (bytes.length > lim.midaFitxer) {
      avisos.push(avis('FITXER_MASSA_GRAN', `«${nom}» fa més de ${mida(lim.midaFitxer)}: no s’ha llegit.`, nom));
      continue;
    }
    if (ext === 'csv') lecturesCsv.push(llegeixMovimentsCsv(decodificaText(bytes)));
    else lecturesC43.push(llegeixC43(bytes));
  }
  comprovaCancelLacio(signal);

  /* 2. El comerç de les compres amb targeta: del CSV a la Norma 43, si hi ha totes dues. Extracte a
     extracte: si dos extractes se solapen, les dues còpies del mateix moviment reben el comerç i la
     sèrie es quede la que es quede, la classificació és la mateixa. */
  const filesCsv = lecturesCsv.flatMap((l) => l.moviments ?? []);
  const comercDe = new Map();
  if (filesCsv.length) {
    for (const lectura of lecturesC43) {
      const delExtracte = (lectura.comptes ?? []).flatMap((c) => c.moviments ?? []);
      if (!delExtracte.length) continue;
      const { moviments } = fusionaMoviments(delExtracte, filesCsv);
      moviments.forEach((m, i) => { if (m.comerc) comercDe.set(delExtracte[i], m.comerc); });
    }
  }

  /* 3. Classificar dins i reduir: cap text ix d'ací. */
  const classificats = {};
  const compta = (c) => { classificats[c.categoria] = (classificats[c.categoria] ?? 0) + 1; };
  /* Cada compte de cada extracte, per a desambiguaIds (revisió adversarial 13-10-2026, troballes FIN-4 i TI-1). */
  const tramsIds = [];
  const extractes = lecturesC43.map((lectura) => {
    const reduida = reduixC43(lectura);
    reduida.comptes.forEach((compte, k) => {
      const sencer = lectura.comptes[k];
      const clauCompte = `${compte.capcalera.entitat ?? ''}-${compte.capcalera.compte4 ?? ''}`;
      const idCompte = compte.capcalera.idCompte;
      tramsIds.push({
        clau: clauCompte,
        qui: typeof idCompte === 'string' && idCompte !== '' ? `opac:${idCompte}` : `sufix:${clauCompte}`,
        oficina: sencer.capcalera?.oficina ?? '',
        compte
      });
      const idDe = creaIds();
      compte.moviments = compte.moviments.map((m, j) => {
        const original = sencer.moviments[j];
        const classificacio = classificaMoviment({
          comerc: comercDe.get(original) ?? '', sepa: original.sepa, text: textDelsConceptes(original),
          centims: original.centims, conceptComu: original.conceptComu, regles: propies
        });
        compta(classificacio);
        return { ...m, id: idDe(clauCompte, m), ...classificacioDe(classificacio) };
      });
    });
    return { lectura: reduida };
  });
  desambiguaIds(tramsIds);
  const csv = lecturesCsv.map((lectura) => {
    const reduida = reduixCsv(lectura);
    const idDe = creaIds();
    reduida.moviments = reduida.moviments.map((m, j) => {
      const original = lectura.moviments[j];
      const classificacio = classificaMoviment({
        comerc: original.comerc ?? '', text: original.concepte, centims: original.centims, regles: propies
      });
      compta(classificacio);
      return { ...m, id: idDe('csv', m), ...classificacioDe(classificacio) };
    });
    return { lectura: reduida };
  });
  comprovaCancelLacio(signal);
  return { extractes, csv, avisos, classificats };
}
