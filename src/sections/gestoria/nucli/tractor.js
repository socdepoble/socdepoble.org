/**
 * tractor.js — el pipeline dels dos tractors de la Gestoria.
 *
 * executaTractorFactures llig la carpeta que tria la persona (una Font: vegeu
 * ../font/fontNavegador.js), hi localitza el trimestre, aprén dels fulls dels
 * quatre trimestres anteriors (titular, sèrie de les factures emeses i
 * proveïdors habituals), extrau els camps de cada factura i n'audita el
 * trimestre. Torna la proposta del full: el CSV i l'XLSX els genera la UI amb
 * el motor de plantilla, després que la persona l'aprove. executaCreuamentCorreus
 * creua les capçaleres d'una exportació de correu amb les factures. Res no es
 * desa enlloc: tot torna en memòria i el tractor no crida mai `escriu`.
 *
 * FAIL-CLOSED. Abans de tocar la Font o els correus, cada funció exigix
 * l'aprovació vigent del seu tractor (exigeixAprovacio) i comprova que el
 * manifest aprovat és el d'este codi. Els errors d'aprovació ixen tal qual
 * (ErrorAprovacio); la resta, com a ErrorTractor amb codi i missatge en
 * valencià: mai una excepció crua cap a la UI.
 *
 * Este fitxer és dels dos tractors (BASE_GESTORIA de ../tractors.js), però
 * cada manifest només declara els seus mòduls. Per això els específics es
 * carreguen amb import() dinàmic i només després de l'aprovació del tractor
 * que els declara (classifica, pdfText, receptes i fullModel per a les
 * factures; correus per al correu): el codi que s'executa és el que cobrix
 * l'empremta aprovada. Les importacions estàtiques són totes de la base.
 *
 * FONT: { nom, llista(): Promise<[{ ruta, mida, modificat }]>,
 *   llig(ruta): Promise<Uint8Array>, escriu?(ruta, bytes), limitacions? }.
 * Rutes relatives a la carpeta triada, amb «/». `limitacions` (opcional):
 * [{ codi, missatge }] del que la Font no ha pogut llistar.
 * JS pur: sense DOM ni React.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../../tractors/nucli/aprovacio.js';
import { aBytes, jsonCanonic, resolSubtle, sha256Hex } from '../../tractors/nucli/canonic.js';
import { manifestNet } from '../../tractors/nucli/empremta.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from '../tractors.js';
import { SEVERITATS, auditaTrimestre } from './auditoria.js';
import { proveidorPerNomFitxer } from './cataleg.js';
import { decodificaText } from './csv.js';
import { formatData, rangTrimestre } from './dates.js';
import { CAMPS_OBLIGATORIS, clauDuplicat, crearFactura, normalitzaNom, ordenaFactures } from './model.js';
import { normalitzaNif } from './nif.js';
import { aprenProveidors, identificaProveidor } from './proveidors.js';

/* Els codis d'ErrorTractor (també els de la Font) i dels avisos de lectura. */
export const CODIS_TRACTOR = Object.freeze([
  'PARAMETRES_INVALIDS', 'CRIPTO_ABSENT', 'FONT_INVALIDA', 'FONT_ILLEGIBLE', 'FONT_OBLIDADA', 'CARPETA_BUIDA',
  'MASSA_FITXERS', 'TRIMESTRE_NO_TROBAT', 'RUTA_INVALIDA', 'FITXER_ILLEGIBLE', 'FITXER_MASSA_GRAN',
  'SELECTOR_NO_DISPONIBLE', 'SELECCIO_CANCELLADA', 'CAL_GEST', 'SELECTOR_FALLIT',
  'ESCRIPTURA_NO_PERMESA', 'ESCRIPTURA_DENEGADA', 'CARPETA_NO_TROBADA', 'FITXER_JA_EXISTEIX', 'ESCRIPTURA_FALLIDA',
  'ERROR_INTERN'
]);

const MB = 1024 * 1024;
/* Límits explícits; executaTractorFactures i la Font n'admeten d'altres (enters positius). */
export const LIMITS_TRACTOR = Object.freeze({
  /* Una carpeta amb més fitxers és, segurament, una carpeta triada massa amunt. */
  fitxersLlistats: 20000,
  documentsTrimestre: 1500,
  midaFitxer: 25 * MB,
  profunditat: 8,
  midaCorreu: 300 * MB,
  missatgesCorreu: 200000
});

export class ErrorTractor extends Error {
  constructor(codi, missatge, { detalls = null, cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorTractor';
    this.codi = codi;
    this.detalls = detalls;
  }
}

const SISTEMA = new Set(['thumbs.db', 'desktop.ini', '__macosx', '$recycle.bin']);
const MODEL_ANTERIOR = /facturacio/i;
const ANTERIORS = 4;
/* Avisos MISSATGE_ILLEGIBLE un per un; a partir d'ací, un de sol amb el compte. */
const MAX_AVISOS_ILLEGIBLES = 20;
/* Des d'esta puntuació d'identificaProveidor (nom, domini o NIF), un camp copiat del registre té confiança mitjana. */
const PUNTS_SEGURS = 80;
const CARPETA_ANY_T = /^(\d{4})[\s_-]+([1-4])\s*t(?:[\s_.(-].*)?$/i;
const CARPETA_T_ANY = /^([1-4])\s*t[\s_-]+(\d{4})(?:[\s_.(-].*)?$/i;
const CAMPS_IMPORT = new Set(['subtotal', 'iva', 'total']);
const MISSATGE_SENSE_INFLATE = 'Este navegador no pot descomprimir PDF: les factures en PDF queden pendents perquè les '
  + 'revises a mà. Amb Chrome, Firefox o Safari 16.4 o posterior es lligen soles.';

/* G3T-01. Un justificant o comprovant bancari pel text (sense accents i en minúscules): «Justificante de
   transferencia», «Comprobante de pago», «Comprovant de la transferència», «Orden de transferencia»... */
const JUSTIFICANT_PEL_TEXT = new RegExp(String.raw`(^|[^a-z])(?:(?:justificante|justificant|comprobante|comprovant)\s+`
  + String.raw`(?:de\s+(?:la\s+|una\s+)?|d['’]\s*(?:una\s+)?)(?:transferencia|pago|pagament|operacion|operacio|orden|ordre|`
  + String.raw`cargo|carrec|abono|ingreso|ingres)|(?:orden|ordre)\s+de\s+transferencia)(?![a-z])`, 'g');
/* El títol sol, en una línia: «Comprobante», «Justificant». */
const TITOL_JUSTIFICANT = /(?:^|\n)[ \t]*(?:justificante|justificant|comprobante|comprovant)[ \t]*(?:\n|$)/;
/* Just davant, no compta: una negació («no es un justificante de pago», «no sirve como…») ni la forma de
   pagament d'una factura («Forma de pago: orden de transferencia»). */
const DAVANT_NO_COMPTA = new RegExp(String.raw`(?:(?:^|[^a-z])(?:no|not|ni)(?:\s+[a-z]+){0,3}|`
  + String.raw`(?:forma|medio|metodo|modo|condiciones)\s+de\s+pago|(?:forma|metode|mode)\s+de\s+pagament|payment\s+method)\s*:?\s*$`);
const FINESTRA_DAVANT = 30;

/* G3T-04. Etiquetes que citen una factura (no el número del mateix rebut): «Invoice number», «Factura nº»,
   «Número de factura», «Factura num.». Sobre el fragment plegat (sense accents, minúscules). */
const CITA_FACTURA = new RegExp(String.raw`(^|[^a-z0-9])(?:invoice\s*#|(?:invoice\s*(?:number|num\.?|no\.?|n[º°]|id)|`
  + String.raw`(?:numero|num\.?|n\.?\s?[º°o]\.?)\s*(?:de\s+|del\s+)?(?:la\s+)?(?:factura|fra\.?)|`
  + String.raw`(?:factura|fra\.?)\s*(?:numero|num\.?|n\.?\s?[º°o]\.?))(?![a-z]))`);

/* G3T-R01. El sentit pel proveïdor que diu el text: la puntuació mínima de detectaProveidor (la de
   PROVEIDOR_SEGUR de receptes.js), els motius que identifiquen de veres (NIF, domini, nom del fitxer), les
   etiquetes del client (sobre el text plegat) i les línies de la capçalera quan no n'hi ha cap. */
const PUNTS_SENTIT = 50;
const MOTIU_FORT = /^(?:nif:|domini:|fitxer$)/;
const ETIQUETA_CLIENT = /(^|[^a-z])(?:bill(?:ed)?\s+to|facturar\s+a|datos\s+del\s+cliente|dades\s+del\s+client|cliente|client|customer|destinatari[oa]?)(?![a-z])/;
const LINIES_EMISSOR = 4;

/* G3T-02. El missatge de cada motiu pel qual una còpia no es compta dues vegades. */
const MISSATGE_COPIA = Object.freeze({
  contingut: (nom) => `Té el mateix contingut que «${nom}»: no es compta dues vegades.`,
  text: (nom) => `És una còpia de «${nom}» amb el mateix text: no es compta dues vegades. Si no és la mateixa factura, torna-la a la proposta.`,
  id: (nom) => `És una còpia de «${nom}» (mateix nom, mida i identificador del PDF, que no es pot llegir): no es compta dues vegades.`
});

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
const segmentsDe = (ruta) => String(ruta ?? '').split(/[\\/]/).filter((s) => s !== '' && s !== '.');
const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
const etiquetaTrimestre = (any, t) => `${any}_${t}T`;
const avis = (codi, severitat, missatge, extra = {}) => ({ codi, severitat, missatge, ...extra });
const mida = (n) => (n >= MB ? `${Math.round(n / MB)} MB` : `${Math.max(1, Math.ceil(n / 1024))} kB`);

function nomDe(ruta) {
  const s = segmentsDe(ruta);
  return s.length ? s[s.length - 1] : '';
}

function extensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

function senseExtensio(ruta) {
  const punt = ruta.lastIndexOf('.');
  return punt > ruta.lastIndexOf('/') + 1 ? ruta.slice(0, punt) : ruta;
}

/**
 * Cert si algun segment de la ruta és ocult o del sistema (.DS_Store, .git,
 * ._x, __MACOSX, Thumbs.db, desktop.ini): eixos no es llisten ni es lligen.
 * @param {string} ruta
 * @returns {boolean}
 */
export function esRutaOculta(ruta) {
  return segmentsDe(ruta).some((s) => s.startsWith('.') || SISTEMA.has(s.toLowerCase()));
}

/**
 * El trimestre que diu el nom d'una carpeta: «2026_3T», «2026-3T», «2026 3T»,
 * «3T_2026» (minúscules o majúscules), amb una cua opcional darrere d'un
 * separador («2026_3T revisat»); null si no ho diu.
 * @param {string} nom
 * @returns {{ any: number, t: number }|null}
 */
export function trimestreDeCarpeta(nom) {
  const text = String(nom ?? '').trim();
  let r = CARPETA_ANY_T.exec(text);
  if (r) return { any: Number(r[1]), t: Number(r[2]) };
  r = CARPETA_T_ANY.exec(text);
  return r ? { any: Number(r[2]), t: Number(r[1]) } : null;
}

function trimestresAnteriors(any, t) {
  const anteriors = [];
  let [a, q] = [any, t];
  for (let i = 0; i < ANTERIORS; i += 1) {
    q -= 1;
    if (q === 0) {
      q = 4;
      a -= 1;
    }
    anteriors.push({ any: a, t: q });
  }
  return anteriors;
}

function limitsDe(limits) {
  const lim = { ...LIMITS_TRACTOR };
  for (const [clau, valor] of Object.entries(limits ?? {})) {
    if (Object.prototype.hasOwnProperty.call(LIMITS_TRACTOR, clau) && Number.isSafeInteger(valor) && valor > 0) lim[clau] = valor;
  }
  return lim;
}

function informa(onProgres, fase, fet, total) {
  if (typeof onProgres !== 'function') return;
  try {
    onProgres({ fase, fet, total });
  } catch {
    /* un error de la UI que pinta el progrés no atura l'anàlisi */
  }
}

function subtleDe(subtle) {
  try {
    return resolSubtle(subtle);
  } catch (error) {
    throw new ErrorTractor('CRIPTO_ABSENT', "Cal WebCrypto per a reconéixer els duplicats: obri l'app en https o en localhost.", { cause: error });
  }
}

const aErrorTractor = (error) => (error instanceof ErrorTractor || error instanceof ErrorAprovacio
  ? error
  : new ErrorTractor('ERROR_INTERN', "S'ha produït un error inesperat i l'anàlisi s'ha aturat. No s'ha desat res.", { cause: error }));

function mateixManifest(rebut, propi) {
  try {
    return jsonCanonic(manifestNet(rebut)) === jsonCanonic(manifestNet(propi));
  } catch {
    return false;
  }
}

/* La porta: l'aprovació vigent, i que siga la del manifest d'este codi. */
async function exigeixTractor(aprovacio, subtle, propi) {
  try {
    await exigeixAprovacio({ ...aprovacio, subtle });
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${propi.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== propi.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este (${propi.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, propi)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${propi.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

/* ── La carpeta ─────────────────────────────────────────────────────────── */

async function llistaFont(font, lim, avisos) {
  let crues;
  try {
    crues = await font.llista();
  } catch (error) {
    if (error instanceof ErrorTractor) throw error;
    throw new ErrorTractor('FONT_ILLEGIBLE', "No s'ha pogut llegir el contingut de la carpeta triada.", { cause: error });
  }
  if (!Array.isArray(crues)) throw new ErrorTractor('FONT_ILLEGIBLE', 'La carpeta triada no ha tornat cap llista de fitxers.');
  if (crues.length > lim.fitxersLlistats) {
    throw new ErrorTractor('MASSA_FITXERS',
      `La carpeta té més de ${lim.fitxersLlistats} fitxers: tria la carpeta de la facturació, no una de més amunt.`);
  }
  let parcial = false;
  for (const l of Array.isArray(font.limitacions) ? font.limitacions : []) {
    if (!l || typeof l.missatge !== 'string') continue;
    avisos.push(avis(typeof l.codi === 'string' ? l.codi : 'FONT_LIMITADA', 'mitjana', l.missatge));
    parcial = true;
  }
  const entrades = [];
  for (const e of crues) {
    if (!e || typeof e.ruta !== 'string') continue;
    const segs = segmentsDe(e.ruta);
    if (segs.length === 0 || segs.includes('..')) continue;
    const ruta = segs.join('/');
    if (esRutaOculta(ruta)) continue;
    entrades.push({
      ruta,
      original: e.ruta,
      segs,
      mida: Number.isFinite(e.mida) ? e.mida : null,
      modificat: Number.isFinite(e.modificat) ? e.modificat : null
    });
  }
  if (entrades.length === 0) {
    throw new ErrorTractor('CARPETA_BUIDA', 'La carpeta triada no té cap fitxer (sense comptar els ocults del sistema).');
  }
  entrades.sort((x, y) => compara(x.ruta, y.ruta));
  return { entrades, parcial };
}

/* Les carpetes de trimestre de la llista: la més exterior de cada ruta. */
function carpetesDeTrimestre(entrades) {
  const carpetes = new Map();
  for (const e of entrades) {
    for (let i = 0; i < e.segs.length - 1; i += 1) {
      const q = trimestreDeCarpeta(e.segs[i]);
      if (!q) continue;
      const prefix = e.segs.slice(0, i + 1).join('/');
      if (!carpetes.has(prefix)) {
        carpetes.set(prefix, { prefix, pare: e.segs.slice(0, i).join('/'), profunditat: i, ...q, fitxers: 0 });
      }
      carpetes.get(prefix).fitxers += 1;
      break;
    }
  }
  return carpetes;
}

function localitza(entrades, nomFont, any, t, avisos) {
  const carpetes = carpetesDeTrimestre(entrades);
  const etiqueta = etiquetaTrimestre(any, t);
  const iguals = [...carpetes.values()].filter((c) => c.any === any && c.t === t)
    .sort((x, y) => x.profunditat - y.profunditat || y.fitxers - x.fitxers || compara(x.prefix, y.prefix));
  if (iguals.length > 0) {
    const [triada, ...altres] = iguals;
    if (altres.length > 0) {
      avisos.push(avis('CARPETES_TRIMESTRE_DIVERSES', 'mitjana',
        `Hi ha més d'una carpeta ${etiqueta}: s'ha llegit «${triada.prefix}» i no ${altres.map((c) => `«${c.prefix}»`).join(', ')}.`));
    }
    return { carpetes, prefix: triada.prefix, pare: triada.pare };
  }
  const delNom = trimestreDeCarpeta(nomFont);
  if (delNom && delNom.any === any && delNom.t === t) return { carpetes, prefix: '', pare: null };
  const trobats = [...new Set([...carpetes.values()].map((c) => etiquetaTrimestre(c.any, c.t)))].sort();
  if (delNom || trobats.length > 0) {
    const que = delNom ? `has triat la carpeta del ${delNom.t}T de ${delNom.any}` : `hi ha ${trobats.join(', ')}`;
    throw new ErrorTractor('TRIMESTRE_NO_TROBAT',
      `No hi ha cap carpeta del ${t}T de ${any} (${etiqueta}, ${any}-${t}T o ${t}T_${any}): ${que}.`,
      { detalls: delNom ? [etiquetaTrimestre(delNom.any, delNom.t)] : trobats });
  }
  if (entrades.some((e) => e.segs.length === 1)) {
    avisos.push(avis('CARPETA_SENSE_TRIMESTRE', 'mitjana',
      `La carpeta triada no té cap subcarpeta de trimestre (com ${etiqueta}): s'han llegit els seus fitxers com si foren del ${t}T de ${any}.`));
    return { carpetes, prefix: '', pare: null };
  }
  throw new ErrorTractor('TRIMESTRE_NO_TROBAT', `No s'ha trobat la carpeta ${etiqueta} (també valen ${any}-${t}T i ${t}T_${any}).`);
}

/* Els fitxers de la carpeta del trimestre, sense els de subcarpetes d'altres trimestres. */
function documentsDelTrimestre(entrades, prefix, any, t) {
  const n = prefix === '' ? 0 : prefix.split('/').length;
  return entrades.filter((e) => {
    if (n > 0 && !e.ruta.startsWith(`${prefix}/`)) return false;
    return !e.segs.slice(n, -1).some((s) => {
      const q = trimestreDeCarpeta(s);
      return q && (q.any !== any || q.t !== t);
    });
  });
}

/* Els fulls «…FACTURACIO….csv» dels quatre trimestres anteriors (millor en carpetes germanes). */
function modelsAnteriors(entrades, carpetes, pare, any, t) {
  const trobats = [];
  const senseCsv = [];
  for (const q of trimestresAnteriors(any, t)) {
    const [carpeta] = [...carpetes.values()].filter((c) => c.any === q.any && c.t === q.t)
      .sort((x, y) => Number(y.pare === pare) - Number(x.pare === pare) || x.profunditat - y.profunditat || compara(x.prefix, y.prefix));
    if (!carpeta) continue;
    const fulls = entrades.filter((e) => e.ruta.startsWith(`${carpeta.prefix}/`) && MODEL_ANTERIOR.test(senseAccents(nomDe(e.ruta))));
    const csv = fulls.filter((e) => extensio(nomDe(e.ruta)) === 'csv');
    if (csv.length > 0) trobats.push(...csv.map((entrada) => ({ entrada, ...q })));
    else if (fulls.length > 0) senseCsv.push(q);
  }
  return { trobats, senseCsv };
}

async function llegeixFitxer(font, entrada, lim, avisa) {
  const massaGran = () => avisa(avis('FITXER_MASSA_GRAN', 'mitjana', `Fa més de ${mida(lim.midaFitxer)}: no s'ha llegit.`));
  if (Number.isFinite(entrada.mida) && entrada.mida > lim.midaFitxer) {
    massaGran();
    return null;
  }
  let bytes;
  try {
    bytes = aBytes(await font.llig(entrada.original));
  } catch (error) {
    if (error?.codi === 'FONT_OBLIDADA') throw error;
    if (error?.codi === 'FITXER_MASSA_GRAN') massaGran();
    else avisa(avis('FITXER_ILLEGIBLE', 'mitjana', "No s'ha pogut llegir el fitxer: potser s'ha mogut o no hi ha permís."));
    return null;
  }
  if (bytes.length > lim.midaFitxer) {
    massaGran();
    return null;
  }
  return bytes;
}

async function lectorDeModels(llegeixModel) {
  if (typeof llegeixModel === 'function') return llegeixModel;
  try {
    const modul = await import('./fullModel.js');
    return typeof modul.llegeixModelCsv === 'function' ? modul.llegeixModelCsv : null;
  } catch {
    return null;
  }
}

/* Una factura de l'historial que apareix en dos fulls només compta una vegada. */
function senseRepetides(factures) {
  const vistes = new Set();
  return factures.filter((f) => {
    const [qui, num] = clauDuplicat(f).split('|');
    const clau = qui && num ? `${f.tipus}|${qui}|${num}|${formatData(f.data, 'aaaa-mm-dd')}` : f.id;
    if (vistes.has(clau)) return false;
    vistes.add(clau);
    return true;
  });
}

/* ── Extracció ──────────────────────────────────────────────────────────── */

function teValor(x, camp) {
  if (camp === 'data') return Boolean(x?.data);
  if (CAMPS_IMPORT.has(camp)) return Number.isSafeInteger(x?.[camp]);
  return String(x?.[camp] ?? '').trim() !== '';
}

/* 'extreta' si la factura és completa; 'parcial' si s'ha llegit algun camp; si no, 'manual'. */
function estatDocument(factura, extrets) {
  if (factura.estat === 'completa') return 'extreta';
  return CAMPS_OBLIGATORIS.some((camp) => teValor(extrets, camp)) ? 'parcial' : 'manual';
}

function proveidorDelText(f, ctx, { text, nomFitxer, nif, contrapart }) {
  const deteccio = text ? ctx.receptes.detectaProveidor({ text, nomFitxer }) : { proveidor: null };
  const nifNet = ctx.nifsPropis.includes(normalitzaNif(nif)) ? '' : nif;
  return identificaProveidor({ nif: nifNet, nom: contrapart || deteccio.proveidor?.nom || '', nomFitxer }, ctx.registre);
}

const plega = (text) => senseAccents(text).toLowerCase();

/* G3T-01: el text diu que és un justificant o un comprovant de pagament (i no és una negació ni la forma de pagament). */
function esJustificantPelText(text) {
  const net = plega(text);
  if (TITOL_JUSTIFICANT.test(net)) return true;
  for (const m of net.matchAll(JUSTIFICANT_PEL_TEXT)) {
    const inici = m.index + m[1].length;
    if (!DAVANT_NO_COMPTA.test(net.slice(Math.max(0, inici - FINESTRA_DAVANT), inici))) return true;
  }
  return false;
}

/* G3T-04: el número de factura que cita un rebut, o null. Només val el que la recepta ha llegit darrere d'una
   etiqueta que cita una factura, o el que té el format de número del proveïdor del catàleg: el número del
   mateix rebut («Receipt number …») no és cap cita. */
function numeroCitatDe(camps, ctx, { text, nomFitxer }) {
  const num = String(camps.num ?? '').trim();
  if (!num) return null;
  if (CITA_FACTURA.test(plega(camps.fragments?.num ?? ''))) return num;
  const { proveidor } = ctx.receptes.detectaProveidor({ text, nomFitxer });
  const patrons = (proveidor?.patronsNum ?? []).map((re) => new RegExp(re.source, re.flags.replace(/[gy]/g, '')));
  return patrons.some((re) => re.test(num)) ? num : null;
}

/* G3T-10: el document no fa cap fila; es queda per fer a mà, amb el motiu al document i a les incidències. */
function senseFila(f, ctx) {
  const nom = nomDe(f.ruta);
  f.estat = 'manual';
  if (f.pdf?.xifrat) {
    f.avisos.push(avis('PDF_XIFRAT', 'mitjana', "El PDF està protegit i no s'ha pogut llegir: no va al full. Desa'l sense "
      + "protecció (obri'l i exporta'l com a PDF) i torna a analitzar, o afig la factura a mà."));
    ctx.incidencies.push(avis('PDF_XIFRAT', 'mitjana', `«${nom}» està protegit i no s'ha pogut llegir: no va al full. `
      + "Desa'l sense protecció i torna a analitzar, o afig la factura a mà.", { fitxer: f.ruta }));
    return;
  }
  /* Sense bytes, el document ja porta el motiu (FITXER_ILLEGIBLE o FITXER_MASSA_GRAN). */
  if (f.pdf) {
    f.avisos.push(avis('PDF_SENSE_DADES', 'mitjana', "No s'ha pogut llegir cap dada d'este PDF (potser és escanejat): no va al full. "
      + 'Si és una factura, afig-la a mà.'));
  }
  ctx.incidencies.push(avis('PDF_SENSE_DADES', 'mitjana', `No s'ha pogut llegir cap dada de «${nom}»: no va al full. `
    + 'Si és una factura, afig-la a mà.', { fitxer: f.ruta }));
}

/* G3T-R01: la capçalera de l'emissor és el text de davant de la primera etiqueta del client («Bill to»,
   «Facturar a», «Cliente»...) o, sense cap etiqueta, les primeres línies. Si hi ix un NIF o un nom propi,
   l'emissor és el titular: la factura és emesa encara que en el concepte cite un proveïdor. */
function emissorPropi(text, ctx) {
  const net = plega(text);
  const etiqueta = ETIQUETA_CLIENT.exec(net);
  const capcalera = etiqueta ? net.slice(0, etiqueta.index + etiqueta[1].length) : net.split('\n').slice(0, LINIES_EMISSOR).join('\n');
  const compacta = capcalera.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (ctx.nifsPropis.some((nif) => nif.length >= 5 && compacta.includes(nif))) return true;
  const paraules = ` ${normalitzaNom(capcalera)} `;
  return ctx.nomsPropis.map(normalitzaNom).some((nom) => nom.length >= 3 && paraules.includes(` ${nom} `));
}

/* G3T-R01: el sentit 'rebuda' pel text només si el proveïdor del catàleg queda ben identificat (puntuació de
   PUNTS_SENTIT o més, amb el NIF, el domini o el nom del fitxer: unes paraules del concepte no hi basten) i
   l'emissor no és el titular. */
function rebudaPelText(deteccio, text, ctx) {
  if (!deteccio?.proveidor || deteccio.puntuacio < PUNTS_SENTIT) return false;
  if (!deteccio.motius.some((motiu) => MOTIU_FORT.test(motiu))) return false;
  return !emissorPropi(text, ctx);
}

/* Les opcions de la recepta: els NIF i els noms del titular (G3T-03), que mai no són la contrapart. */
const opcionsRecepta = (ctx, tipus, nomFitxer) => ({ tipus, nifsPropis: ctx.nifsPropis, nomsPropis: ctx.nomsPropis, nomFitxer });

function extreuPdf(f, ctx) {
  const nomFitxer = nomDe(f.ruta);
  const text = f.pdf?.text ?? '';
  for (const missatge of f.pdf?.avisos ?? []) f.avisos.push(avis('LECTURA_PDF', 'info', missatge));
  let tipus = f.sentit === 'emesa' ? 'ingres' : 'despesa';
  let camps = ctx.receptes.extreuCamps(text, opcionsRecepta(ctx, tipus, nomFitxer));
  /* G3T-01: un justificant bancari amb nom de factura és un rebut. Una factura amb base i IVA no ho és mai. */
  if (esJustificantPelText(text) && !(Number.isSafeInteger(camps.subtotal) && Number.isSafeInteger(camps.iva))) {
    f.tipus = 'rebut';
    f.sentit = f.sentit === 'emesa' ? 'emesa' : 'rebuda';
    f.motiu = 'justificant o comprovant de pagament pel text: no és una factura';
    f.avisos.push(avis('REBUT_PEL_CONTINGUT', 'mitjana', 'El text diu que és un justificant o un comprovant de pagament: '
      + "s'ha tractat com a rebut i no va al full. Si és una factura, afig-la a mà."));
    extreuRebut(f, ctx);
    return;
  }
  if (f.sentit === null && ctx.serie && camps.num && ctx.serie.test(camps.num)) {
    tipus = 'ingres';
    f.sentit = 'emesa';
    f.motiu = `${f.motiu}; el número és de la teua sèrie de factures emeses`;
    camps = ctx.receptes.extreuCamps(text, opcionsRecepta(ctx, tipus, nomFitxer));
  }
  /* G3T-10: sense cap camp llegit del document no hi ha fila buida. Sense descompressor és l'excepció: les
     factures en PDF queden totes pendents a la taula (PDF_SENSE_DESCOMPRESSOR), llevat de les xifrades. */
  const capCamp = !CAMPS_OBLIGATORIS.some((camp) => teValor(camps, camp));
  if (f.pdf?.xifrat || (capCamp && !ctx.sensePdf)) {
    senseFila(f, ctx);
    return;
  }
  /* G3T-14: el text és d'un proveïdor del catàleg ben identificat i l'emissor no és el titular: és una
     factura rebuda (G3T-R01, vegeu rebudaPelText). */
  if (f.sentit === null && text) {
    const deteccio = ctx.receptes.detectaProveidor({ text, nomFitxer });
    if (rebudaPelText(deteccio, text, ctx)) {
      f.sentit = 'rebuda';
      f.motiu = `${f.motiu}; el text és de ${deteccio.proveidor.nom}, un proveïdor del catàleg`;
    }
  }
  if (f.sentit === null) {
    ctx.senseSentit += 1;
    f.avisos.push(avis('SENTIT_DESCONEGUT', 'baixa', "No se sap si és emesa o rebuda: s'ha proposat com a despesa."));
  }
  posaFactura(f, ctx, { camps, tipus, text, nomFitxer });
}

/* La factura de la proposta amb els camps que ha llegit la recepta, i l'estat del document. */
function posaFactura(f, ctx, { camps, tipus, text, nomFitxer }) {
  const dades = {
    tipus,
    data: camps.data,
    num: camps.num,
    contrapart: camps.contrapart,
    nif: camps.nif,
    descripcio: camps.descripcio,
    subtotal: camps.subtotal,
    iva: camps.iva,
    total: camps.total,
    /* La retenció i la moneda, tal com les llig la recepta: crearFactura les valida. */
    ...(camps.retencio !== undefined ? { retencio: camps.retencio } : {}),
    ...(camps.moneda ? { moneda: camps.moneda } : {}),
    /* G3T-R04: el document es presenta com a abonament (imports en negatiu): validaFactura ho avisa. */
    ...(camps.abonament === true ? { abonament: true } : {})
  };
  const confianca = { ...camps.confianca };
  if (tipus === 'despesa') {
    const r = proveidorDelText(f, ctx, { text, nomFitxer, nif: dades.nif, contrapart: dades.contrapart });
    if (r) {
      f.proveidor = r.proveidor.clau;
      const nivell = r.puntuacio >= PUNTS_SEGURS ? 'mitjana' : 'baixa';
      if (!dades.contrapart && r.proveidor.nom) {
        dades.contrapart = r.proveidor.nom;
        confianca.contrapart = nivell;
      }
      if (!dades.nif && r.proveidor.nif) {
        dades.nif = r.proveidor.nif;
        confianca.nif = nivell;
      }
    }
  }
  /* Sense descompressor, sense text o xifrat: la proposta la revisa la persona. */
  const pendent = ctx.sensePdf || !f.pdf || f.pdf.xifrat || text.trim() === '';
  f.factura = crearFactura({
    ...dades,
    origen: { fitxer: f.ruta, metode: 'pdf', ...(f.sha256 ? { sha256: f.sha256 } : {}) },
    confianca,
    ...(pendent ? { estat: 'pendent' } : {})
  });
  if (camps.fragments && Object.keys(camps.fragments).length > 0) f.fragments = camps.fragments;
  f.estat = estatDocument(f.factura, camps);
}

function extreuCsv(f, ctx) {
  f.estat = 'ignorada';
  if (typeof f.text !== 'string') return;
  const nomFitxer = nomDe(f.ruta);
  const parcial = ctx.classifica.llegeixCsvFacturaProveidor(f.text, { proveidor: proveidorPerNomFitxer(nomFitxer) });
  if (!parcial) {
    f.avisos.push(avis('CSV_SENSE_FACTURA', 'baixa', "No s'hi ha trobat cap número ni import de factura."));
    return;
  }
  const r = identificaProveidor({ nif: parcial.nif, nom: parcial.contrapart, nomFitxer }, ctx.registre);
  if (r) f.proveidor = r.proveidor.clau;
  f.factura = crearFactura({ ...parcial, origen: { fitxer: f.ruta, metode: 'csv-proveidor', sha256: f.sha256 } });
  f.estat = f.factura.estat === 'completa' ? 'extreta' : 'parcial';
}

/* Un rebut no és una factura: només se'n trau el proveïdor, l'import i el número de factura que cita, per a l'auditoria. */
function extreuRebut(f, ctx) {
  f.estat = 'ignorada';
  f.numeroCitat = null;
  const text = f.pdf?.text ?? '';
  if (text.trim() === '') return;
  const nomFitxer = nomDe(f.ruta);
  const camps = ctx.receptes.extreuCamps(text, opcionsRecepta(ctx, 'despesa', nomFitxer));
  /* Un import en una altra moneda no es pot comparar amb els totals en euros. */
  if (Number.isSafeInteger(camps.total) && !camps.moneda) f.import = camps.total;
  f.numeroCitat = numeroCitatDe(camps, ctx, { text, nomFitxer });
  const r = proveidorDelText(f, ctx, { text, nomFitxer, nif: camps.nif, contrapart: camps.contrapart });
  if (r) f.proveidor = r.proveidor.clau;
}

/* G3T-03: els noms propis sense buits ni repetits (per normalitzaNom), en l'ordre en què arriben. */
function nomsUnics(noms) {
  const vistos = new Set();
  const unics = [];
  for (const nom of noms) {
    const net = typeof nom === 'string' ? nom.trim() : '';
    const clau = normalitzaNom(net);
    if (!clau || vistos.has(clau)) continue;
    vistos.add(clau);
    unics.push(net);
  }
  return unics;
}

/* G3T-03: la marca de la sèrie emesa. Un nom que ix de client en dues o més factures emeses amb NIF de client
   diferents no és cap client (un client no té dos NIF): és el de l'emissor, que la plantilla posa al costat de
   l'etiqueta del client. Amb un sol client, o sense NIF, no es deduïx res. */
function marquesDeLaSerie(fitxes) {
  const perNom = new Map();
  for (const f of fitxes) {
    const factura = f.factura;
    if (factura?.tipus !== 'ingres' || factura.origen?.metode !== 'pdf') continue;
    const clau = normalitzaNom(factura.contrapart);
    const nif = normalitzaNif(factura.nif);
    if (!clau || !nif) continue;
    const vist = perNom.get(clau) ?? { nom: factura.contrapart.trim(), nifs: new Set() };
    vist.nifs.add(nif);
    perNom.set(clau, vist);
  }
  return [...perNom.values()].filter((v) => v.nifs.size >= 2).map((v) => v.nom);
}

/* G3T-03: amb la marca deduïda, es tornen a llegir les factures emeses que la portaven de client. */
function rellegixEmeses(fitxes, ctx) {
  const marques = marquesDeLaSerie(fitxes);
  if (marques.length === 0) return;
  ctx.nomsPropis = nomsUnics([...ctx.nomsPropis, ...marques]);
  const deLaMarca = new Set(marques.map(normalitzaNom));
  for (const f of fitxes) {
    if (f.factura?.tipus !== 'ingres' || f.factura.origen?.metode !== 'pdf' || !deLaMarca.has(normalitzaNom(f.factura.contrapart))) continue;
    const text = f.pdf?.text ?? '';
    const nomFitxer = nomDe(f.ruta);
    const camps = ctx.receptes.extreuCamps(text, opcionsRecepta(ctx, 'ingres', nomFitxer));
    posaFactura(f, ctx, { camps, tipus: 'ingres', text, nomFitxer });
  }
}

/* G3T-02: per què una còpia del grup és la mateixa que l'original, o null. El mateix sha256; o, en una còpia
   pel nom, el mateix text (que no siga buit) o, si cap dels dos es pot llegir, el mateix /ID del PDF. */
const textNormalitzat = (f) => {
  if (f.pdf) return String(f.pdf.text ?? '').replace(/\s+/g, ' ').trim();
  return typeof f.text === 'string' ? f.text.replace(/\s+/g, ' ').trim() : null;
};

function motiuDeCopia(original, copia) {
  if (original.sha256 && original.sha256 === copia.sha256) return 'contingut';
  const [x, y] = [textNormalitzat(original), textNormalitzat(copia)];
  if (x === null || y === null) return null;
  if (x !== '' && x === y) return 'text';
  const id = original.pdf?.id;
  if (x === '' && y === '' && typeof id === 'string' && id !== '' && id === copia.pdf?.id) return 'id';
  return null;
}

/* Si una factura en PDF ja ve del CSV del proveïdor (mateix nom o mateix NIF i número), guanya el CSV. */
function aparellaAmbCsv(fitxes) {
  const csvs = fitxes.filter((f) => f.factura && f.tipus === 'csv-factura');
  if (csvs.length === 0) return;
  for (const f of fitxes) {
    if (!f.factura || f.factura.origen.metode !== 'pdf' || f.factura.tipus !== 'despesa') continue;
    const base = senseExtensio(f.ruta).toLowerCase();
    const clau = clauDuplicat(f.factura);
    const [qui, num] = clau.split('|');
    const parella = csvs.find((c) => senseExtensio(c.ruta).toLowerCase() === base)
      ?? (qui && num ? csvs.find((c) => clauDuplicat(c.factura) === clau) : undefined);
    if (!parella) continue;
    f.factura = null;
    f.facturaId = parella.factura.id;
    f.estat = 'ignorada';
    f.avisos.push(avis('MATEIXA_FACTURA', 'info', `La mateixa factura ja s'ha llegit del CSV «${nomDe(parella.ruta)}», que és més fiable.`));
  }
}

function sortidaDocument(f) {
  const facturaId = f.factura ? f.factura.id : f.facturaId;
  return {
    ruta: f.ruta,
    tipus: f.tipus,
    sentit: f.sentit,
    motiu: f.motiu,
    estat: f.estat,
    avisos: f.avisos,
    ambit: 'trimestre',
    ...(facturaId ? { facturaId } : {}),
    ...(f.proveidor ? { proveidor: f.proveidor } : {}),
    ...(f.copiaDe ? { copiaDe: f.copiaDe } : {}),
    ...(f.tipus === 'rebut' ? { numeroCitat: f.numeroCitat ?? null } : {}),
    /* L'import d'un rebut (cèntims, en euros): la revisió el torna a casar amb la proposta d'ara. */
    ...(f.tipus === 'rebut' && Number.isSafeInteger(f.import) ? { import: f.import } : {}),
    ...(f.fragments ? { fragments: f.fragments } : {})
  };
}

/* G3T-02: la còpia pel nom fusionada es pot tornar a la proposta. La seua factura (la de l'original, amb el
   fitxer de la còpia) va a les excloses, i el document la porta com a facturaId. */
function facturesExcloses(fitxes) {
  const perRuta = new Map(fitxes.map((f) => [f.ruta, f]));
  const excloses = [];
  for (const f of fitxes) {
    const original = f.restaurable ? perRuta.get(f.copiaDe)?.factura : null;
    if (!original) continue;
    const copia = crearFactura({
      ...original,
      id: '',
      origen: { fitxer: f.ruta, metode: original.origen.metode, ...(f.sha256 ? { sha256: f.sha256 } : {}) }
    });
    f.facturaId = copia.id;
    excloses.push(copia);
  }
  return excloses;
}

const pes = (severitat) => {
  const i = SEVERITATS.indexOf(severitat);
  return i < 0 ? SEVERITATS.length : i;
};

async function analitzaCarpeta({ font, any, t, subtle, inflate, avui, onProgres, nifsTitular, nomsTitular, llegeixModel, limits }) {
  if (!rangTrimestre(any, t)) throw new ErrorTractor('PARAMETRES_INVALIDS', `El trimestre no és vàlid: ${String(any)} ${String(t)}T.`);
  if (!font || typeof font.llista !== 'function' || typeof font.llig !== 'function') {
    throw new ErrorTractor('FONT_INVALIDA', 'No hi ha cap carpeta per llegir: tria-la amb el selector.');
  }
  if (inflate !== null && typeof inflate !== 'function') {
    throw new ErrorTractor('PARAMETRES_INVALIDS', 'El descompressor de PDF ha de ser una funció o null.');
  }
  const s = subtleDe(subtle);
  const lim = limitsDe(limits);
  const progres = (fase, fet, total) => informa(onProgres, fase, fet, total);
  const [classifica, lectorPdf, receptes] = await Promise.all([
    import('./classifica.js'), import('./pdfText.js'), import('./receptes.js')
  ]);
  const avisos = [];

  progres('llistant', 0, 1);
  const llistat = await llistaFont(font, lim, avisos);
  let parcial = llistat.parcial;
  const { entrades } = llistat;
  const { carpetes, prefix, pare } = localitza(entrades, typeof font.nom === 'string' ? font.nom : '', any, t, avisos);
  progres('llistant', 1, 1);

  /* Historial: titular, sèrie i proveïdors dels trimestres anteriors. */
  const { trobats, senseCsv } = modelsAnteriors(entrades, carpetes, pare, any, t);
  for (const q of senseCsv) {
    avisos.push(avis('MODEL_SENSE_CSV', 'baixa',
      `El full del ${q.t}T de ${q.any} no és en CSV: no s'ha pogut llegir per a l'historial. Desa'l també en CSV.`));
  }
  if (trobats.length === 0) {
    avisos.push(avis('SENSE_HISTORIAL', 'info',
      "No s'ha trobat cap full (…FACTURACIO….csv) dels quatre trimestres anteriors: sense historial no es pot saber quins proveïdors facturen cada mes."));
  }
  const docsHistorial = [];
  const titulars = [];
  const trimestresLlegits = new Set();
  let historial = [];
  if (trobats.length > 0) {
    const lector = await lectorDeModels(llegeixModel);
    if (!lector) avisos.push(avis('LECTOR_MODEL_ABSENT', 'mitjana', "No s'ha pogut carregar el lector de fulls: l'historial no s'ha llegit."));
    for (const [k, { entrada, any: qa, t: qt }] of trobats.entries()) {
      progres('historial', k, trobats.length);
      const doc = {
        ruta: entrada.ruta, tipus: 'model-trimestral', sentit: null, motiu: `full lliurat del ${qt}T de ${qa}`,
        estat: 'ignorada', avisos: [], ambit: 'historial'
      };
      docsHistorial.push(doc);
      if (!lector) continue;
      const bytes = await llegeixFitxer(font, entrada, lim, (a) => doc.avisos.push(a));
      if (!bytes) continue;
      let model;
      try {
        model = lector(decodificaText(bytes), { fitxer: entrada.ruta });
      } catch {
        doc.avisos.push(avis('MODEL_ILLEGIBLE', 'mitjana', "No s'ha pogut llegir com a full de la gestoria."));
        continue;
      }
      const llista = (camp) => (Array.isArray(model?.[camp]) ? model[camp] : []);
      const factures = [...llista('ingressos'), ...llista('despeses')].filter((f) => f && typeof f === 'object');
      historial.push(...factures);
      for (const a of llista('avisos')) {
        doc.avisos.push(avis(String(a?.codi ?? 'MODEL'), SEVERITATS.includes(a?.severitat) ? a.severitat : 'baixa', String(a?.missatge ?? '')));
      }
      if (typeof model?.titular === 'string' && model.titular.trim() !== '') {
        const ordre = (Number.isInteger(model.any) ? model.any : qa) * 4 + (Number.isInteger(model.t) ? model.t : qt);
        titulars.push({ titular: model.titular.trim(), ordre });
      }
      doc.estat = 'extreta';
      doc.motiu = `full lliurat del ${qt}T de ${qa}: ${factures.length} factures per a l'historial`;
      trimestresLlegits.add(etiquetaTrimestre(qa, qt));
    }
    progres('historial', trobats.length, trobats.length);
  }
  historial = senseRepetides(historial);
  const titular = titulars.sort((x, y) => y.ordre - x.ordre)[0]?.titular ?? '';
  if (!titular) avisos.push(avis('TITULAR_DESCONEGUT', 'info', "No s'ha trobat el titular als fulls anteriors: escriu-lo a la proposta."));
  const serie = classifica.serieEmesa(historial);

  /* Els documents del trimestre, classificats pel nom i la carpeta. */
  const perRuta = new Map(entrades.map((e) => [e.ruta, e]));
  let classificats = classifica.classificaDocuments(
    documentsDelTrimestre(entrades, prefix, any, t).map((e) => ({ ruta: e.ruta, ...(e.mida === null ? {} : { mida: e.mida }) })),
    { serie }
  );
  if (classificats.length > lim.documentsTrimestre) {
    avisos.push(avis('MASSA_DOCUMENTS', 'alta',
      `La carpeta del trimestre té ${classificats.length} documents: només s'han analitzat els ${lim.documentsTrimestre} primers.`));
    classificats = classificats.slice(0, lim.documentsTrimestre);
    parcial = true;
  }
  const fitxes = classificats.map((c) => ({
    ruta: c.ruta, entrada: perRuta.get(c.ruta), mida: c.mida, tipus: c.tipus, sentit: c.sentit, motiu: c.motiu, estat: 'ignorada', avisos: []
  }));
  const esPdfFitxa = (f) => extensio(nomDe(f.ruta)) === 'pdf';
  for (const f of fitxes) {
    if (f.tipus === 'model-trimestral') {
      f.avisos.push(avis('FULL_JA_FET', 'info', 'Ja hi ha un full de la gestoria en esta carpeta: la proposta es fa de nou amb els documents.'));
    } else if (f.tipus === 'imatge') {
      f.estat = 'manual';
      f.avisos.push(avis('IMATGE', 'info', 'Si és una factura fotografiada, afig-la a mà a la proposta.'));
    }
  }

  /* Lectura: només els candidats (factures en PDF, CSV de proveïdor i rebuts en PDF). */
  const candidats = fitxes.filter((f) => (f.tipus === 'factura' && esPdfFitxa(f)) || f.tipus === 'csv-factura' || (f.tipus === 'rebut' && esPdfFitxa(f)));
  const textPerSha = new Map();
  let pdfsLlegits = 0;
  for (const [k, f] of candidats.entries()) {
    progres('llegint', k, candidats.length);
    const bytes = await llegeixFitxer(font, f.entrada, lim, (a) => f.avisos.push(a));
    if (!bytes) {
      parcial = true;
      continue;
    }
    f.sha256 = await sha256Hex(bytes, s);
    if (f.tipus === 'csv-factura') {
      f.text = decodificaText(bytes);
    } else {
      if (!textPerSha.has(f.sha256)) textPerSha.set(f.sha256, await lectorPdf.extreuTextPdf(bytes, { inflate }));
      f.pdf = textPerSha.get(f.sha256);
      pdfsLlegits += 1;
    }
  }
  progres('llegint', candidats.length, candidats.length);

  /* Duplicats: una còpia amb el mateix contingut no es compta dues vegades. Una còpia pel nom (marca de còpia
     i mida a ±1 %) tampoc, si té el mateix text o, sense text, el mateix /ID del PDF (G3T-02): esta es pot
     tornar a la proposta. Dos documents diferents amb noms semblants es queden tots dos, amb POSSIBLE_COPIA. */
  const duplicats = classifica.detectaDuplicats(fitxes.map((f) => ({
    ruta: f.ruta, ...(Number.isFinite(f.mida) ? { mida: f.mida } : {}), ...(f.sha256 ? { sha256: f.sha256 } : {})
  })));
  const fitxaDe = new Map(fitxes.map((f) => [f.ruta, f]));
  for (const grup of duplicats) {
    const [original, ...copies] = grup.documents;
    const fo = fitxaDe.get(original.ruta);
    for (const d of copies) {
      const f = fitxaDe.get(d.ruta);
      const motiu = motiuDeCopia(fo, f);
      if (motiu) {
        f.copiaDe = original.ruta;
        f.estat = 'ignorada';
        f.restaurable = motiu !== 'contingut';
        f.avisos.push(avis('DUPLICAT', 'info', MISSATGE_COPIA[motiu](nomDe(original.ruta))));
      } else {
        f.avisos.push(avis('POSSIBLE_COPIA', 'baixa', `Pareix una còpia de «${nomDe(original.ruta)}»: revisa si és la mateixa factura.`));
      }
    }
  }

  /* NIF del titular: els que diu la persona i els que es repetixen en factures de proveïdors diferents. */
  const textos = fitxes.filter((f) => !f.copiaDe && f.pdf?.text).map((f) => ({ text: f.pdf.text, nomFitxer: nomDe(f.ruta) }));
  const nifsPropis = [...new Set([
    ...(Array.isArray(nifsTitular) ? nifsTitular : []).map(normalitzaNif).filter(Boolean),
    ...receptes.nifsRecurrents(textos)
  ])];
  const registre = aprenProveidors(historial, { nifsPropis });

  /* G3T-03: els noms del titular (el dels fulls anteriors i els que diu la persona) no són mai la contrapart. */
  const nomsPropis = nomsUnics([titular, ...(Array.isArray(nomsTitular) ? nomsTitular : [])]);
  const ctx = { classifica, receptes, serie, nifsPropis, nomsPropis, registre, sensePdf: inflate === null, senseSentit: 0, incidencies: [] };
  const extraibles = candidats.filter((f) => !f.copiaDe);
  for (const [k, f] of extraibles.entries()) {
    progres('extraient', k, extraibles.length);
    if (f.tipus === 'csv-factura') extreuCsv(f, ctx);
    else if (f.tipus === 'rebut') extreuRebut(f, ctx);
    else extreuPdf(f, ctx);
  }
  rellegixEmeses(extraibles, ctx);
  progres('extraient', extraibles.length, extraibles.length);
  aparellaAmbCsv(fitxes);
  const excloses = facturesExcloses(fitxes);

  /* Auditoria del trimestre. Una còpia que no compta (copiaDe) no s'audita com un document més: no s'ha
     llegit, i un rebut sense import ni cita donaria un REBUT_SENSE_FACTURA fals. Els grups de duplicats
     arriben a part (`duplicats`). L'historial servix per a la sèrie emesa entre trimestres i per a les
     factures d'altres trimestres que cita un rebut. */
  progres('auditant', 0, 1);
  const factures = fitxes.map((f) => f.factura).filter(Boolean);
  const auditoria = auditaTrimestre({
    any,
    t,
    factures,
    documents: fitxes.filter((f) => !f.copiaDe).map((f) => ({
      ruta: f.ruta,
      tipus: f.tipus,
      ...(Number.isFinite(f.mida) ? { mida: f.mida } : {}),
      ...(f.sha256 ? { sha256: f.sha256 } : {}),
      ...(f.proveidor ? { proveidor: f.proveidor } : {}),
      ...(Number.isSafeInteger(f.import) ? { import: f.import } : {}),
      /* G3T-04: el número de factura que cita el rebut (string o null), per a casar-lo pel número. */
      ...(f.tipus === 'rebut' ? { numeroCitat: f.numeroCitat ?? null } : {})
    })),
    proveidors: registre,
    correus: null,
    nifsPropis,
    avui,
    duplicats,
    historial
  });
  const incidencies = [...auditoria.incidencies, ...ctx.incidencies];
  if (inflate === null && pdfsLlegits > 0) incidencies.push(avis('PDF_SENSE_DESCOMPRESSOR', 'info', MISSATGE_SENSE_INFLATE));
  if (ctx.senseSentit > 0) {
    incidencies.push(avis('SENTIT_DESCONEGUT', 'baixa', ctx.senseSentit === 1
      ? "Una factura no diu si és emesa o rebuda: s'ha proposat com a despesa. Revisa-la."
      : `${ctx.senseSentit} factures no diuen si són emeses o rebudes: s'han proposat com a despeses. Revisa-les.`));
  }
  incidencies.sort((x, y) => pes(x.severitat) - pes(y.severitat));
  progres('auditant', 1, 1);

  return {
    proposta: {
      titular,
      any,
      t,
      ingressos: ordenaFactures(factures.filter((f) => f.tipus === 'ingres')),
      despeses: ordenaFactures(factures.filter((f) => f.tipus === 'despesa'))
    },
    documents: [...fitxes.map(sortidaDocument), ...docsHistorial],
    excloses,
    incidencies,
    cobertura: {
      ...auditoria.cobertura,
      carpeta: parcial ? 'parcial' : auditoria.cobertura.carpeta,
      carpetaTrimestre: prefix,
      historial: [...trimestresLlegits]
    },
    avisos,
    proveidors: registre,
    nifsPropis,
    nomsPropis: ctx.nomsPropis,
    historial
  };
}

/**
 * El tractor «Gestoria · Full trimestral de factures». FAIL-CLOSED: abans de
 * cridar cap mètode de la font exigix l'aprovació (vegeu la capçalera).
 * @param {object} p
 * @param {object} p.font la carpeta triada (contracte Font)
 * @param {number} p.any
 * @param {number} p.t trimestre (1-4)
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.factures'): { manifest, empremta, registres, claus, origen, rpId, ara }
 * @param {SubtleCrypto} [p.subtle] per defecte, crypto.subtle
 * @param {null|((b: Uint8Array) => Promise<Uint8Array>)} [p.inflate] inflateNavegador(); null: els PDF queden pendents
 * @param {{a:number,m:number,d:number}|null} [p.avui] sense avisos de mesos que encara no han arribat
 * @param {(p: { fase: string, fet: number, total: number }) => void} [p.onProgres]
 *   fases: 'llistant', 'historial', 'llegint', 'extraient', 'auditant'
 * @param {string[]} [p.nifsTitular] els NIF del titular, si se saben
 * @param {string[]} [p.nomsTitular] els noms del titular i de les seues marques, si se saben (G3T-03)
 * @param {(text: string, o: { fitxer: string }) => object} [p.llegeixModel] el lector de fulls
 *   (per defecte, llegeixModelCsv de fullModel.js)
 * @param {object} [p.limits] els de LIMITS_TRACTOR que es vulguen canviar
 * @returns {Promise<{ proposta: { titular: string, any: number, t: number, ingressos: object[], despeses: object[] },
 *   documents: object[], excloses: object[], incidencies: object[], cobertura: object, avisos: object[], proveidors: object[],
 *   nifsPropis: string[], nomsPropis: string[], historial: object[] }>}
 *   historial: les Factures dels fulls dels quatre trimestres anteriors, cada una una sola vegada (la mateixa llista que
 *   rep auditaTrimestre per a la sèrie emesa entre trimestres i les factures d'altres trimestres que cita un rebut).
 *   nomsPropis: els noms que mai no són la contrapart (G3T-03): el titular dels fulls anteriors, els de nomsTitular i
 *   la marca de la sèrie emesa, si es deduïx (un nom que ix de client en factures emeses amb NIF diferents).
 *   documents: cada un { ruta, tipus, sentit, motiu, estat, avisos, ambit, facturaId?, proveidor?, copiaDe?, numeroCitat?,
 *   import?, fragments? }; numeroCitat (string o null) només als rebuts: el número de factura que citen; import (cèntims,
 *   en euros) només als rebuts que en diuen un. excloses: les factures
 *   de les còpies pel nom que no es compten (G3T-02), per si la persona les vol tornar a la proposta; el document de
 *   la còpia les porta com a facturaId. Un PDF del qual no s'ha llegit cap camp no fa cap fila: el document queda
 *   'manual' i hi ha una incidència PDF_XIFRAT o PDF_SENSE_DADES amb el fitxer (G3T-10), llevat de quan no hi ha
 *   descompressor (inflate null): llavors les factures en PDF continuen pendents a la proposta, llevat de les xifrades.
 */
export async function executaTractorFactures({
  font, any, t, aprovacio, subtle, inflate = null, avui = null, onProgres = () => {},
  nifsTitular = [], nomsTitular = [], llegeixModel = null, limits = {}
} = {}) {
  await exigeixTractor(aprovacio, subtle, TRACTOR_FACTURES);
  try {
    return await analitzaCarpeta({ font, any, t, subtle, inflate, avui, onProgres, nifsTitular, nomsTitular, llegeixModel, limits });
  } catch (error) {
    throw aErrorTractor(error);
  }
}

/* ── Correu ─────────────────────────────────────────────────────────────── */

async function creuaCorreus({ fitxers, any, t, factures, proveidors, limits }) {
  if (!rangTrimestre(any, t)) throw new ErrorTractor('PARAMETRES_INVALIDS', `El trimestre no és vàlid: ${String(any)} ${String(t)}T.`);
  if (!Array.isArray(fitxers) || fitxers.length === 0) {
    throw new ErrorTractor('PARAMETRES_INVALIDS', 'Cal almenys una exportació de correu (.mbox o .eml).');
  }
  const lim = limitsDe(limits);
  const { esCorreuDeFactura, resumCorreu, separaMbox } = await import('./correus.js');
  const avisos = [];
  const resums = [];
  let parcial = false;
  let truncat = false;
  let illegibles = 0;
  for (const fitxer of fitxers) {
    if (truncat) break;
    const nom = typeof fitxer?.nom === 'string' && fitxer.nom !== '' ? fitxer.nom : 'sense nom';
    if (typeof fitxer?.text !== 'string') {
      avisos.push(avis('FITXER_ILLEGIBLE', 'mitjana', `«${nom}» no és text: no s'ha llegit.`, { fitxer: nom }));
      parcial = true;
      continue;
    }
    if (fitxer.text.length > lim.midaCorreu) {
      avisos.push(avis('FITXER_MASSA_GRAN', 'mitjana', `«${nom}» fa més de ${mida(lim.midaCorreu)}: no s'ha llegit. Exporta només el trimestre.`, { fitxer: nom }));
      parcial = true;
      continue;
    }
    let numero = 0;
    for (const missatge of separaMbox(fitxer.text)) {
      if (resums.length >= lim.missatgesCorreu) {
        truncat = true;
        break;
      }
      numero += 1;
      /* Només capçaleres: el resum no porta mai el cos, i el missatge sencer no es guarda.
         Un missatge que no es pot resumir (mal format o fet expressament) se salta: no atura la resta. */
      let resum;
      try {
        resum = resumCorreu(missatge);
        const { es, motiu } = esCorreuDeFactura(resum);
        resum = { ...resum, esFactura: es, motiuFactura: motiu, fitxer: nom };
      } catch {
        illegibles += 1;
        parcial = true;
        if (illegibles <= MAX_AVISOS_ILLEGIBLES) {
          avisos.push(avis('MISSATGE_ILLEGIBLE', 'mitjana', `El missatge ${numero} de «${nom}» no s’ha pogut llegir i s’ha saltat.`, { fitxer: nom, numero }));
        }
        continue;
      }
      resums.push(resum);
    }
  }
  if (illegibles > MAX_AVISOS_ILLEGIBLES) {
    const mes = illegibles - MAX_AVISOS_ILLEGIBLES;
    avisos.push(avis('MISSATGE_ILLEGIBLE', 'mitjana', mes === 1
      ? 'Un missatge més tampoc no s’ha pogut llegir i s’ha saltat.'
      : `${mes} missatges més tampoc no s’han pogut llegir i s’han saltat.`));
  }
  if (truncat) {
    avisos.push(avis('MASSA_CORREUS', 'mitjana', `Només s'han revisat els ${lim.missatgesCorreu} primers missatges.`));
    parcial = true;
  }
  const auditoria = auditaTrimestre({
    any,
    t,
    factures: (Array.isArray(factures) ? factures : []).filter(Boolean),
    documents: [],
    proveidors: Array.isArray(proveidors) ? proveidors : null,
    correus: resums
  });
  return {
    incidencies: auditoria.incidencies.filter((i) => String(i.codi).startsWith('CORREU_')),
    cobertura: { ...auditoria.cobertura, ...(parcial ? { correu: 'parcial' } : {}) },
    correus: resums.filter((c) => c.esFactura),
    avisos
  };
}

/**
 * El tractor «Gestoria · Creuament amb el correu». FAIL-CLOSED: abans de
 * llegir cap correu exigix l'aprovació de 'gestoria.correus'.
 * @param {object} p
 * @param {Array<{ nom: string, text: string }>} p.fitxers exportacions .mbox o .eml, ja en text
 * @param {number} p.any
 * @param {number} p.t
 * @param {object[]} [p.factures] les del trimestre (les de la proposta)
 * @param {object[]|null} [p.proveidors] el registre que torna executaTractorFactures
 * @param {object} p.aprovacio el de contextAprovacio('gestoria.correus')
 * @param {SubtleCrypto} [p.subtle]
 * @param {object} [p.limits] midaCorreu i missatgesCorreu
 * @returns {Promise<{ incidencies: object[], cobertura: object, correus: object[], avisos: object[] }>}
 *   correus: els resums (sense cos) dels correus de factura; cobertura.correu: 'revisat' o 'parcial'
 */
export async function executaCreuamentCorreus({
  fitxers, any, t, factures = [], proveidors = null, aprovacio, subtle, limits = {}
} = {}) {
  await exigeixTractor(aprovacio, subtle, TRACTOR_CORREUS);
  try {
    return await creuaCorreus({ fitxers, any, t, factures, proveidors, limits });
  } catch (error) {
    throw aErrorTractor(error);
  }
}
