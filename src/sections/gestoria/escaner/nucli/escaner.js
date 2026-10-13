/**
 * escaner.js — l'Escàner Local: què hi ha a la carpeta arrel de la Gestoria.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): la Gestoria accepta
 * la carpeta arrel sencera, hi troba els extractes del banc i les factures de
 * cada trimestre, avisa dels duplicats, de les dates que no quadren i dels
 * buits, i proposa abocar els extractes al Tauler. Este és el nucli pur (mapa
 * D, §1). L'executor (tractorEscaner.js, amb l'aprovació de 'gestoria.escaner')
 * és qui llista la Font i llig bytes; ací només arriba el que n'ha tret:
 * l'empremta sha256 dels fitxers que comparteixen mida amb un altre
 * (rutesPerEmpremta) i el format dels primers bytes dels extractes candidats
 * (formatDelCap). Proposa i mai mou ni esborra res (documents/plaNeteja.js).
 *
 * LES CATEGORIES (CATEGORIES_ESCANER). Precedència, de més a menys:
 *   arxiu      · dins d'una carpeta d'arxiu, d'històric o de quarantena: es
 *                llista i es compta, però no s'aboca mai ni se'n llig res;
 *   identitat  · dins de la carpeta de la identitat legal, o un document
 *                d'identitat pel nom (sensibilitat 'identitat' del catàleg);
 *   bancs      · un extracte candidat (candidatBanc);
 *   factures   · la família de factures de nucli/classifica.js dins d'una
 *                carpeta de trimestre (2026_3T, la semàntica del Full) o d'any;
 *   burocracia · dins d'una carpeta de tràmits, o un tràmit pel catàleg;
 *   codi       · codi font, fitxers de disseny i còpies automàtiques;
 *   altres     · la resta.
 *
 * IDENTITAT SENSE LLEGIR CAP BYTE (ordre del Mestre, 13-10-2026, pla 261013_1405,
 * front H): la carpeta de la identitat legal es reconeix pel nom i se'n compten
 * les carpetes i els fitxers (radiografia.identitat), perquè la UI hi puga posar
 * la pista cap a la vista «Identitat i Finestreta». rutesPerEmpremta no en torna
 * cap ruta i candidatBanc no en proposa cap. El mateix val per a l'arxiu, per a
 * les credencials i per als documents sensibles pel nom: només es llegixen
 * factures i extractes (l'empremta dels que comparteixen mida i el cap dels
 * extractes candidats), i res més.
 *
 * LES DATES DELS NOMS són indicis i no veredictes. El prefix aammdd_hhmm és la
 * data en què es va arxivar el fitxer, mai la de la factura; compten els
 * trimestres escrits («2025-4T»), les dates senceres (2026-10-02) i els mesos
 * («-11-2025», «_202601»). Per això les severitats són baixes i els textos
 * diuen «revisa-ho».
 *
 * LÍMITS HONESTOS. La Font només llista fitxers (font/fontNavegador.js): una
 * carpeta buida és invisible. Sense carpetes (on el navegador només deixa triar
 * fitxers) no hi ha trimestres ni bancs per la ruta, i la radiografia ho avisa.
 *
 * Determinista i independent de l'ordre de l'entrada. L'eixida porta rutes,
 * mides, dates i recomptes, mai bytes ni text dels fitxers.
 * JS pur: sense DOM, sense React i sense xarxa.
 */
import { SEVERITATS } from '../../nucli/auditoria.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { classificaDocument as classificaPerNom, detectaDuplicats } from '../../nucli/classifica.js';
import { comparaDates, esDataValida, formatData, rangTrimestre, trimestreDe } from '../../nucli/dates.js';
import { llegeixExtracteCsv } from '../../nucli/extracteCsv.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import { LIMITS_TRACTOR, esRutaOculta, trimestreDeCarpeta } from '../../nucli/tractor.js';
import { classificaDocument as fitxaPelNom, classificaDocuments } from '../../documents/classificaDocument.js';
import { EXTENSIONS_NORMA43, LIMITS_TAULER } from '../../tauler/nucli/tractorTauler.js';

/** L'esquema de la radiografia. */
export const ESQUEMA_RADIOGRAFIA = 'sdp.gestoria.radiografia.v1';
/** Les categories de l'Escàner (la precedència és la de la capçalera). */
export const CATEGORIES_ESCANER = Object.freeze(['bancs', 'factures', 'identitat', 'burocracia', 'arxiu', 'codi', 'altres']);
/** Els codis de les troballes i dels avisos de l'Escàner. */
export const CODIS_ESCANER = Object.freeze([
  'DUPLICAT_EXACTE', 'DUPLICAT_ENTRE_TRIMESTRES', 'POSSIBLE_COPIA', 'DATA_FORA_TRIMESTRE', 'ARXIVAT_ABANS_DEL_TRIMESTRE',
  'TRIMESTRE_SENSE_CARPETA', 'MES_SENSE_EXTRACTE', 'FORAT_SERIE', 'EXTRACTE_NO_LLEGIBLE', 'CSV_ALTRE_FORMAT',
  'EXTRACTES_SOLAPATS_POSSIBLES', 'MASSA_EXTRACTES', 'CREDENCIAL_SOLTA', 'FONT_LIMITADA'
]);
/**
 * La severitat de cada codi (les de nucli/auditoria.js). Dues excepcions:
 * DATA_FORA_TRIMESTRE és 'baixa' quan el que no quadra és una data o un mes
 * (i 'mitjana' amb un trimestre escrit al nom), i CREDENCIAL_SOLTA és
 * 'mitjana' per a un .key, que també pot ser una presentació.
 */
export const SEVERITAT_ESCANER = Object.freeze({
  DUPLICAT_EXACTE: 'info', DUPLICAT_ENTRE_TRIMESTRES: 'alta', POSSIBLE_COPIA: 'baixa', DATA_FORA_TRIMESTRE: 'mitjana',
  ARXIVAT_ABANS_DEL_TRIMESTRE: 'info', TRIMESTRE_SENSE_CARPETA: 'mitjana', MES_SENSE_EXTRACTE: 'mitjana', FORAT_SERIE: 'baixa',
  EXTRACTE_NO_LLEGIBLE: 'baixa', CSV_ALTRE_FORMAT: 'baixa', EXTRACTES_SOLAPATS_POSSIBLES: 'mitjana', MASSA_EXTRACTES: 'mitjana',
  CREDENCIAL_SOLTA: 'alta', FONT_LIMITADA: 'mitjana'
});
/** Els formats que torna formatDelCap: els dos que llig el Tauler, un CSV de banc d'un altre format i res. */
export const FORMATS_CAP = Object.freeze(['n43', 'csv-tauler', 'csv-altre', 'no']);

const EXT_FULLS = new Set(['xls', 'xlsx', 'ods', 'numbers']);
const EXT_CODI = new Set(['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'sh', 'php', 'html', 'htm', 'css', 'scss']);
const EXT_CREDENCIAL = new Set(['pfx', 'p12', 'key', 'pem', 'kdbx', 'ppk', 'jks']);
/* La família de factures de nucli/classifica.js: el que va (o pot anar) al Full d'un trimestre. */
const FAMILIA_FACTURA = new Set(['factura', 'rebut', 'csv-factura', 'model-trimestral', 'full-calcul', 'imatge']);
/* Tipus del catàleg (documents/catalegTipus.js) que són tràmits, encara que siguen un PDF dins d'un trimestre. */
const CATALEG_BUROCRACIA = new Set([
  'model-presentat', 'declaracio-renda', 'notificacio-administrativa', 'rebut-tribut-local', 'expedient-marca', 'subvencio',
  'acte-seguretat-social', 'rebut-cotitzacio', 'informe-vida-laboral', 'demanda-ocupacio', 'model-145', 'incapacitat-temporal'
]);
const CATALEG_CODI = new Set(['codi-antic', 'font-disseny', 'copia-automatica']);
/* Les categories dels fitxers dels quals es pot calcular l'empremta (llegir-ne els bytes): on un duplicat compta doble. */
const AMB_EMPREMTA = new Set(['factures', 'bancs']);
/* Sensibilitats del catàleg que mai es llegixen, encara que el document caiga dins d'un trimestre. */
const SENSIBLES = new Set(['identitat', 'credencial', 'salut']);
const FORMATS_LLEGIBLES = new Set(['n43', 'csv-tauler']);

/* Carpetes, sobre el nom plegat (sense accents i en minúscules): la paraula ha d'obrir un tros del nom.
   «banc» no casa amb «bancal» (un bancal és terra, no diners). */
const CARPETA_ANY = /^(?:19|20)\d{2}$/;
const CARPETA_BANC = /(?:^|[^a-z])(?:banc(?!al)|bank|extract|tresoreria|tesoreria)/;
const CARPETA_IDENTITAT = /(?:^|[^a-z])(?:identitat|identidad|identity|legal)/;
const CARPETA_BUROCRACIA = new RegExp('(?:^|[^a-z])(?:burocracia|tramit|agencia|hisenda|hacienda|aeat|suma(?![a-z])|oepm|'
  + 'kit[^a-z0-9]*digital|seguretat[^a-z0-9]*social|seguridad[^a-z0-9]*social|ajuntament|ayuntamiento|generalitat)');
const CARPETA_ARXIU = /(?:^|[^a-z])(?:arxiu|archivo|archive|historic|quarantena|cuarentena|llegat|legacy)/;
const CARPETA_PROJECTES = /(?:^|[^a-z])(?:projecte|proyecto|project|subvenci)/;
/* Noms d'extracte en Norma 43, i noms de moviments o d'entitat bancària. */
const NOM_N43 = /(?:^|[^a-z0-9])(?:[cnq]43|norma[^a-z0-9]*43|cuaderno[^a-z0-9]*43|quadern[^a-z0-9]*43|aeb|extracte|extracto)/;
const NOM_BANC = new RegExp('(?:^|[^a-z])(?:moviments|movimientos|movements|extracte|extracto|statement|banc(?!al)|bank|'
  + 'caixa[^a-z0-9]*rural|caja[^a-z0-9]*rural|ruralvia|cajamar|santander|bbva|sabadell|ibercaja|unicaja|kutxa|abanca|'
  + 'openbank|revolut|triodos|ing(?![a-z])|wise(?![a-z])|n26)');
/* Marques de còpia al final del nom, les de nucli/classifica.js: « copia», « - copia», « copy 2», « (1)». */
const MARCA_COPIA = /(?:\s+-)?\s+(?:copia|copy)(?:\s+\(?\d+\)?)?$|\s*\(\d+\)$/;
/* Un comptador al final del nom: «invoice-prova-0012» → «invoice-prova-», 0012. */
const COMPTADOR = /^(.*[^0-9])(\d{3,6})$/;

/* Els trossos de data dels noms (sobre el nom plegat i sense extensió). El grup 1 és la vora d'abans, que es
   conserva en llevar el tros; cap número llarg (un identificador de factura) no hi casa. */
const PREFIX_ARXIU = /^(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(?=[\s_-]|$)/;
const T_FACTURACIO = /^()((?:19|20)\d{2})-facturacio-.*[^a-z0-9]([1-4])t$/;
const T_ANY_T = /(^|[^0-9])((?:19|20)\d{2})[\s_-]?(?:([1-4])t|q([1-4]))(?![a-z0-9])/;
const T_T_ANY = /(^|[^a-z0-9])(?:([1-4])t|q([1-4]))[\s_-]?((?:19|20)\d{2})(?![0-9])/;
const T_AA_T = /(^|[^a-z0-9])(\d{2})[\s_-]([1-4])t(?![a-z0-9])/;
const T_SOL = /(^|[_-])([1-4])t(?![a-z0-9])/;
const DATA_ISO = /(^|[^0-9])((?:19|20)\d{2})([-_.])(\d{2})\3(\d{2})(?![0-9])/;
const DATA_DMA = /(^|[^0-9])(\d{2})([-_.])(\d{2})\3((?:19|20)\d{2})(?![0-9])/;
const MES_MA = /(^|[^0-9])(0[1-9]|1[0-2])[-_]((?:19|20)\d{2})(?![0-9])/;
const MES_AM = /(^|[^0-9])((?:19|20)\d{2})[-_](0[1-9]|1[0-2])(?![0-9])/;
const MES_COMPACTE = /([_-])((?:19|20)\d{2})(0[1-9]|1[0-2])(?![0-9])/;

/* Les sèries: quants membres calen, quina densitat i quants buits es diuen com a molt. */
const MIN_SERIE = 3;
const DENSITAT_SERIE = 0.75;
const MAX_MESOS = 120;
const MAX_TRIMESTRES = 80;
const MAX_LLISTATS = 12;

const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const segmentsDe = (ruta) => String(ruta ?? '').split(/[\\/]/).filter((s) => s !== '' && s !== '.');
const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
const dues = (n) => String(n).padStart(2, '0');
const indexMes = ({ a, m }) => a * 12 + (m - 1);
const mesDeIndex = (i) => ({ a: Math.floor(i / 12), m: (i % 12) + 1 });
const etiquetaMes = ({ a, m }) => `${dues(m)}/${a}`;
const indexTrimestre = (any, t) => any * 4 + (t - 1);
const trimestreDeIndex = (i) => ({ any: Math.floor(i / 4), t: (i % 4) + 1 });
const etiquetaTrimestre = (any, t) => (any === null ? `${t}T` : `${t}T de ${any}`);
const troballa = (codi, missatge, extra = {}) => ({ codi, severitat: SEVERITAT_ESCANER[codi], missatge, ...extra });
const llista = (valors) => (valors.length <= MAX_LLISTATS
  ? valors.join(', ')
  : `${valors.slice(0, MAX_LLISTATS).join(', ')} i ${valors.length - MAX_LLISTATS} més`);
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);
const comptaSi = (elements, prova) => elements.reduce((n, x) => n + (prova(x) ? 1 : 0), 0);

function nomDe(ruta) {
  const s = segmentsDe(ruta);
  return s.length ? s[s.length - 1] : '';
}

function extensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

function senseExtensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(0, punt) : nom;
}

function senseMarcaCopia(text) {
  let net = text.trimEnd();
  while (MARCA_COPIA.test(net)) net = net.replace(MARCA_COPIA, '').trimEnd();
  return net;
}

/* ── Les dates dels noms ────────────────────────────────────────────────── */

/* Lleva el primer tros que casa (conservant-ne la vora) i el torna, o null. */
function consumeix(estat, patro) {
  const r = patro.exec(estat.resta);
  if (!r) return null;
  const inici = r.index + r[1].length;
  estat.resta = `${estat.resta.slice(0, inici)} ${estat.resta.slice(r.index + r[0].length)}`;
  return r;
}

/* El primer patró de la llista que casa mana: el seu tros es lleva encara que la data no siga vàlida. */
function primerTros(estat, patrons) {
  for (const [patro, llegeix] of patrons) {
    const r = consumeix(estat, patro);
    if (r) return llegeix(r);
  }
  return null;
}

const dataSiValida = (a, m, d) => (esDataValida({ a, m, d }) ? { a, m, d } : null);
const TROSSOS_TRIMESTRE = Object.freeze([
  [T_FACTURACIO, (r) => ({ any: Number(r[2]), t: Number(r[3]) })],
  [T_ANY_T, (r) => ({ any: Number(r[2]), t: Number(r[3] ?? r[4]) })],
  [T_T_ANY, (r) => ({ any: Number(r[4]), t: Number(r[2] ?? r[3]) })],
  [T_AA_T, (r) => ({ any: 2000 + Number(r[2]), t: Number(r[3]) })],
  [T_SOL, (r) => ({ any: null, t: Number(r[2]) })]
]);
const TROSSOS_DATA = Object.freeze([
  [DATA_ISO, (r) => dataSiValida(Number(r[2]), Number(r[4]), Number(r[5]))],
  [DATA_DMA, (r) => dataSiValida(Number(r[5]), Number(r[4]), Number(r[2]))]
]);
const TROSSOS_MES = Object.freeze([
  [MES_MA, (r) => ({ a: Number(r[3]), m: Number(r[2]) })],
  [MES_AM, (r) => ({ a: Number(r[2]), m: Number(r[3]) })],
  [MES_COMPACTE, (r) => ({ a: Number(r[2]), m: Number(r[3]) })]
]);

/* Les dates del nom i el que en queda (la «resta», plegada), que fa d'arrel de les sèries. */
function fitxesDelNom(nomORuta) {
  const estat = { resta: plega(senseExtensio(nomDe(nomORuta))) };
  let arxiu = null;
  const p = PREFIX_ARXIU.exec(estat.resta);
  if (p && Number(p[4]) < 24 && Number(p[5]) < 60) {
    arxiu = dataSiValida(2000 + Number(p[1]), Number(p[2]), Number(p[3]));
    if (arxiu) estat.resta = estat.resta.slice(p[0].length);
  }
  const trimestre = primerTros(estat, TROSSOS_TRIMESTRE);
  const document = primerTros(estat, TROSSOS_DATA);
  const mes = primerTros(estat, TROSSOS_MES);
  return { arxiu, document, mes, trimestre, resta: estat.resta };
}

/**
 * Les dates que diu el nom d'un fitxer, totes indicis:
 *   · arxiu: el prefix aammdd_hhmm, la data en què es va arxivar (mai la del document);
 *   · trimestre: un «2025-4T», «4T_2025», «26_3T», «_2T» (any null) o el model «AAAA-FACTURACIO-…-1T»;
 *   · document: una data sencera, AAAA-MM-DD, AAAA_MM_DD o DD-MM-AAAA;
 *   · mes: «-11-2025», «_2026_01» o «_202601» (sis xifres justes).
 * Un número llarg (un identificador) no és cap data, i una data que no existix (2026-02-30) és null.
 * @param {string} nom el nom o la ruta
 * @returns {{ arxiu: {a,m,d}|null, document: {a,m,d}|null, mes: {a,m}|null, trimestre: {any: number|null, t: number}|null }}
 */
export function dataDelNom(nom) {
  const { arxiu, document, mes, trimestre } = fitxesDelNom(nom);
  return { arxiu, document, mes, trimestre };
}

/* L'arrel d'una sèrie: el nom sense dates, sense marca de còpia i amb els separadors en un espai. */
function arrelDeSerie(nom) {
  return senseMarcaCopia(fitxesDelNom(nom).resta).replace(/[\s_.-]+/g, ' ').trim();
}

/* L'arrel d'un extracte: a més, sense els anys solts («banc_2026» i «banc» són el mateix compte). */
function arrelDExtracte(nom) {
  return senseMarcaCopia(fitxesDelNom(nom).resta)
    .replace(/(^|[^0-9])(?:19|20)\d{2}(?![0-9])/g, '$1 ')
    .replace(/[\s_.-]+/g, ' ')
    .trim();
}

/* ── La ruta ────────────────────────────────────────────────────────────── */

/**
 * El que diuen les carpetes d'una ruta (no el nom del fitxer): el trimestre de
 * la carpeta de trimestre més exterior (trimestreDeCarpeta, la semàntica del
 * Full), l'any d'una carpeta d'any (2024) i si alguna carpeta és del banc, de
 * la identitat legal, de tràmits, d'arxiu o de projectes.
 * @param {string} ruta relativa a la carpeta triada
 * @returns {{ carpeta: string, trimestre: {any: number, t: number, carpeta: string}|null, any: number|null,
 *   carpetaAny: string|null, carpetaIdentitat: string|null, banc: boolean, identitat: boolean, burocracia: boolean,
 *   arxiu: boolean, projectes: boolean }}
 */
export function contextDeRuta(ruta) {
  const carpetes = segmentsDe(ruta).slice(0, -1);
  const plegades = carpetes.map(plega);
  let trimestre = null;
  let any = null;
  let carpetaAny = null;
  let carpetaIdentitat = null;
  for (let i = 0; i < carpetes.length; i += 1) {
    const cami = carpetes.slice(0, i + 1).join('/');
    const q = trimestre ? null : trimestreDeCarpeta(carpetes[i]);
    if (q) trimestre = { any: q.any, t: q.t, carpeta: cami };
    if (any === null && CARPETA_ANY.test(carpetes[i].trim())) {
      any = Number(carpetes[i].trim());
      carpetaAny = cami;
    }
    if (carpetaIdentitat === null && CARPETA_IDENTITAT.test(plegades[i])) carpetaIdentitat = cami;
  }
  const alguna = (patro) => plegades.some((s) => patro.test(s));
  return {
    carpeta: carpetes.join('/'),
    trimestre,
    any,
    carpetaAny,
    carpetaIdentitat,
    banc: alguna(CARPETA_BANC),
    identitat: carpetaIdentitat !== null,
    burocracia: alguna(CARPETA_BUROCRACIA),
    arxiu: alguna(CARPETA_ARXIU),
    projectes: alguna(CARPETA_PROJECTES)
  };
}

/* ── Els extractes ──────────────────────────────────────────────────────── */

const noCandidat = (motiu = null) => ({ format: null, llegible: false, motiu });

function candidatAmb(ruta, ctx, base, sensibilitat) {
  if (ctx.arxiu) return noCandidat("És en una carpeta d'arxiu: es llista, però no s'aboca mai al Tauler.");
  if (ctx.identitat) return noCandidat("És en la carpeta de la identitat: no se'n llig res.");
  if (SENSIBLES.has(sensibilitat)) return noCandidat("Pel nom és un document sensible: no se'n llig res.");
  const tipus = base?.tipus ?? null;
  if (tipus === 'csv-factura' || tipus === 'model-trimestral') return noCandidat();
  const nom = nomDe(ruta);
  const ext = extensio(nom);
  const net = plega(senseExtensio(nom));
  const diuBanc = tipus === 'extracte' || NOM_BANC.test(net);
  const perOn = ctx.banc ? 'és en la carpeta del banc' : 'el nom diu que són moviments del banc';
  if (EXTENSIONS_NORMA43.includes(ext) && (ctx.banc || diuBanc || NOM_N43.test(net))) {
    return { format: 'n43', llegible: true, motiu: `Possible Norma 43: ${ctx.banc ? perOn : 'el nom ho diu'}.` };
  }
  if (ext === 'csv' && (ctx.banc || diuBanc)) return { format: 'csv', llegible: true, motiu: `Possible CSV de moviments: ${perOn}.` };
  if (EXT_FULLS.has(ext) && (ctx.banc || diuBanc)) {
    return { format: 'xls', llegible: false, motiu: "Full de càlcul del banc: el Tauler no el sap llegir. Exporta'l en Norma 43 o en CSV." };
  }
  if (ext === 'pdf' && (diuBanc || (ctx.banc && tipus !== 'rebut'))) {
    return { format: 'pdf', llegible: false, motiu: "PDF del banc: el Tauler no el sap llegir. Exporta'l en Norma 43 o en CSV." };
  }
  return noCandidat();
}

/**
 * Si un fitxer pot ser un extracte del banc, pel nom i per la carpeta (sense
 * llegir-lo): 'n43' (una extensió de Norma 43 a la carpeta del banc, o amb
 * c43, n43, norma 43, extracte o el nom d'un banc al nom), 'csv', 'xls' o
 * 'pdf'. Els dos últims no els llig el Tauler (llegible false). Res de dins
 * d'una carpeta d'arxiu ni de la identitat, ni cap document sensible pel nom
 * (identitat, credencial, salut del catàleg), no és mai candidat: d'eixos no
 * se'n llig ni el cap.
 * @param {{ ruta: string }} entrada
 * @param {object} [context] el de contextDeRuta (es calcula si no ve)
 * @returns {{ format: 'n43'|'csv'|'xls'|'pdf'|null, llegible: boolean, motiu: string|null }}
 */
export function candidatBanc(entrada, context) {
  const ruta = String(entrada?.ruta ?? '');
  return candidatAmb(ruta, context ?? contextDeRuta(ruta), classificaPerNom({ ruta }), fitxaPelNom({ ruta })?.sensibilitat);
}

function esNorma43(text) {
  try {
    return llegeixC43(text).comptes.some((c) => esDataValida(c?.capcalera?.dataInicial) && esDataValida(c?.capcalera?.dataFinal));
  } catch {
    return false;
  }
}

function esCsvDelTauler(text) {
  try {
    return !llegeixMovimentsCsv(text).avisos.some((a) => a.codi === 'CAPCALERA' || a.codi === 'CSV_BUIT');
  } catch {
    return false;
  }
}

function esAltreCsv(text) {
  try {
    return llegeixExtracteCsv(text).format !== null;
  } catch {
    return false;
  }
}

/**
 * El format d'un extracte pel seu cap (els primers bytes, ja decodificats),
 * amb els lectors canònics, sense copiar-ne cap disposició:
 *   'n43'        · llegeixC43 hi troba un compte amb les dates de l'extracte;
 *   'csv-tauler' · llegeixMovimentsCsv hi troba la capçalera del Tauler;
 *   'csv-altre'  · llegeixExtracteCsv hi troba columnes de data i d'import
 *                  (el CSV d'un altre banc, que el Tauler encara no llig);
 *   'no'         · res d'això.
 * L'extensió mana, com al Tauler: amb una de Norma 43 només es prova la
 * Norma 43, i amb .csv només els CSV; sense extensió, tot.
 * @param {string} text
 * @param {string} [ext] l'extensió del fitxer, amb punt o sense
 * @returns {'n43'|'csv-tauler'|'csv-altre'|'no'}
 */
export function formatDelCap(text, ext = '') {
  if (typeof text !== 'string' || text.trim() === '') return 'no';
  const e = String(ext ?? '').replace(/^\./, '').toLowerCase();
  if ((e === '' || EXTENSIONS_NORMA43.includes(e)) && esNorma43(text)) return 'n43';
  if (e === '' || e === 'csv') {
    if (esCsvDelTauler(text)) return 'csv-tauler';
    if (esAltreCsv(text)) return 'csv-altre';
  }
  return 'no';
}

/* ── L'arbre ────────────────────────────────────────────────────────────── */

const esSha256 = (x) => typeof x === 'string' && /^[0-9a-f]{64}$/i.test(x);

/* Les entrades vàlides, sense ocults ni repetides, per ordre de ruta (i ja no importa l'ordre d'arribada). */
function entradesNetes(entrades) {
  const netes = [];
  for (const e of Array.isArray(entrades) ? entrades : []) {
    if (!e || typeof e.ruta !== 'string') continue;
    const segs = segmentsDe(e.ruta);
    if (segs.length === 0 || segs.includes('..')) continue;
    const ruta = segs.join('/');
    if (esRutaOculta(ruta)) continue;
    netes.push({
      ruta,
      mida: Number.isFinite(e.mida) && e.mida >= 0 ? e.mida : null,
      modificat: Number.isFinite(e.modificat) ? e.modificat : null,
      sha256: esSha256(e.sha256) ? e.sha256.toLowerCase() : null
    });
  }
  netes.sort((x, y) => compara(x.ruta, y.ruta) || (x.mida ?? -1) - (y.mida ?? -1) || compara(x.sha256 ?? '', y.sha256 ?? ''));
  return netes.filter((e, i) => i === 0 || e.ruta !== netes[i - 1].ruta);
}

function categoriaDe(doc) {
  const ctx = doc.context;
  if (ctx.arxiu) return 'arxiu';
  if (ctx.identitat) return 'identitat';
  if (doc.banc.format) return 'bancs';
  if (doc.sensibilitat === 'identitat') return 'identitat';
  const tramit = CATALEG_BUROCRACIA.has(doc.tipus);
  if ((ctx.trimestre || ctx.any !== null) && FAMILIA_FACTURA.has(doc.base?.tipus) && !tramit) return 'factures';
  if (ctx.burocracia || tramit) return 'burocracia';
  if (EXT_CODI.has(doc.extensio) || CATALEG_CODI.has(doc.tipus)) return 'codi';
  return 'altres';
}

/**
 * Classifica l'arbre sencer pels noms, les mides i les rutes (i l'empremta,
 * si n'hi ha): per a cada fitxer, el context de les carpetes, les dates del
 * nom, el tipus de nucli/classifica.js (base), la fitxa del catàleg
 * (documents/classificaDocument.js, amb els duplicats exactes marcats),
 * l'extracte candidat i la categoria. Els ocults del sistema no hi són.
 * @param {Array<{ ruta: string, mida?: number, modificat?: number, sha256?: string }>} entrades
 * @param {{ serie?: RegExp|null }} [opcions] la sèrie de les factures emeses
 * @returns {object[]} per ordre de ruta; mai bytes ni text dels fitxers
 */
export function classificaArbre(entrades, { serie = null } = {}) {
  const netes = entradesNetes(entrades);
  const cataleg = new Map(classificaDocuments(
    netes.map(({ ruta, mida, sha256 }) => (sha256 ? { ruta, mida, sha256 } : { ruta, mida })),
    { serie }
  ).map((c) => [c.ruta, c]));
  return netes.map((e) => {
    const nom = nomDe(e.ruta);
    const context = contextDeRuta(e.ruta);
    const base = classificaPerNom({ ruta: e.ruta, mida: e.mida }, { serie });
    const fitxa = cataleg.get(e.ruta) ?? null;
    const doc = {
      ruta: e.ruta,
      nom,
      carpeta: context.carpeta,
      extensio: extensio(nom),
      mida: e.mida,
      modificat: e.modificat,
      sha256: e.sha256,
      context,
      dates: dataDelNom(nom),
      base: base ? { tipus: base.tipus, sentit: base.sentit } : null,
      tipus: fitxa?.tipus ?? 'desconegut',
      queEs: fitxa?.queEs ?? '',
      sensibilitat: fitxa?.sensibilitat ?? 'desconeguda',
      quanEsborrar: fitxa?.quanEsborrar ?? '',
      revisa: fitxa?.revisa ?? true,
      original: fitxa?.original ?? null,
      banc: candidatAmb(e.ruta, context, base, fitxa?.sensibilitat)
    };
    doc.categoria = categoriaDe(doc);
    return doc;
  });
}

/**
 * Les rutes de les quals l'executor ha de calcular l'empremta sha256: només
 * les factures i els extractes que el Tauler podria llegir (on un duplicat es
 * compta dues vegades) que comparteixen la mida exacta (més de 0 bytes) amb
 * un altre d'ells. Mai la identitat, l'arxiu, una credencial, un document
 * sensible pel nom, un full o un PDF del banc (que no s'aboquen), ni un
 * fitxer de més de `midaMaxima`.
 * @param {Array<{ ruta: string, mida?: number }>} entrades
 * @param {{ midaMaxima?: number, serie?: RegExp|null }} [opcions]
 * @returns {string[]} per ordre de ruta
 */
export function rutesPerEmpremta(entrades, { midaMaxima = LIMITS_TRACTOR.midaFitxer, serie = null } = {}) {
  const sostre = Number.isFinite(midaMaxima) && midaMaxima > 0 ? midaMaxima : LIMITS_TRACTOR.midaFitxer;
  const perMida = new Map();
  for (const doc of classificaArbre(entrades, { serie })) {
    if (!AMB_EMPREMTA.has(doc.categoria) || SENSIBLES.has(doc.sensibilitat) || EXT_CREDENCIAL.has(doc.extensio)) continue;
    if (doc.categoria === 'bancs' && !doc.banc.llegible) continue;
    if (!(Number.isFinite(doc.mida) && doc.mida > 0 && doc.mida <= sostre)) continue;
    perMida.set(doc.mida, [...(perMida.get(doc.mida) ?? []), doc.ruta]);
  }
  return [...perMida.values()].filter((rutes) => rutes.length > 1).flat().sort(compara);
}

/* ── Les troballes ──────────────────────────────────────────────────────── */

const llistaDocs = (classificats) => (Array.isArray(classificats) ? classificats : []).filter((d) => d && d.context && d.dates);

/**
 * Els grups de duplicats (nucli/classifica.js, detectaDuplicats: el mateix
 * sha256, o el mateix nom amb una marca de còpia a la mateixa carpeta i una
 * mida a ±1 %), fora de l'arxiu i de la identitat. Cada grup porta l'original
 * a part i les còpies: l'original no es marca mai.
 *   DUPLICAT_ENTRE_TRIMESTRES (alta) · factures de carpetes de trimestres diferents;
 *   DUPLICAT_EXACTE (info)          · el mateix contingut, a la resta;
 *   POSSIBLE_COPIA (baixa)          · pel nom, sense el mateix sha256.
 * @param {object[]} classificats els de classificaArbre
 * @returns {Array<{ codi, severitat, missatge, motiu: 'contingut'|'nom', original: string, copies: string[], trimestres: string[] }>}
 */
export function duplicatsDe(classificats) {
  const docs = llistaDocs(classificats).filter((d) => d.categoria !== 'arxiu' && d.categoria !== 'identitat')
    .sort((x, y) => compara(x.ruta, y.ruta));
  const perRuta = new Map(docs.map((d) => [d.ruta, d]));
  const grups = detectaDuplicats(docs.map(({ ruta, mida, sha256 }) => (sha256 ? { ruta, mida, sha256 } : { ruta, mida })));
  return grups.map(({ motiu, documents }) => {
    const membres = documents.map((m) => perRuta.get(m.ruta));
    const [original, ...copies] = membres;
    const quarts = [...new Set(membres.filter((d) => d.context.trimestre)
      .map((d) => indexTrimestre(d.context.trimestre.any, d.context.trimestre.t)))].sort((x, y) => x - y);
    const trimestres = quarts.map((i) => trimestreDeIndex(i)).map(({ any, t }) => `${any}_${t}T`);
    const entreTrimestres = quarts.length > 1 && membres.every((d) => d.context.trimestre && d.categoria === 'factures');
    const extra = { motiu, original: original.ruta, copies: copies.map((d) => d.ruta), trimestres };
    if (entreTrimestres) {
      return troballa('DUPLICAT_ENTRE_TRIMESTRES',
        `La mateixa factura és a ${trimestres.length} trimestres (${trimestres.join(', ')}): només ha d'anar al full d'un.`, extra);
    }
    if (motiu === 'contingut') {
      return troballa('DUPLICAT_EXACTE',
        `${plural(copies.length, 'Una còpia', 'còpies')} amb el mateix contingut que «${original.ruta}».`, extra);
    }
    return troballa('POSSIBLE_COPIA',
      `Pel nom pareix una còpia de «${original.ruta}», però el contingut no és el mateix o no s'ha comprovat: revisa-ho.`, extra);
  });
}

/**
 * Les dates dels noms que no quadren amb la carpeta del trimestre, per a les
 * factures i els extractes que hi són. Una troballa per fitxer, la més greu:
 *   DATA_FORA_TRIMESTRE (mitjana)         · el nom diu un altre trimestre («2025-4T» al 2026_1T);
 *   DATA_FORA_TRIMESTRE (baixa)           · una data o un mes del nom d'un altre trimestre;
 *   ARXIVAT_ABANS_DEL_TRIMESTRE (info)    · el prefix aammdd_hhmm és d'abans que el trimestre comence.
 * Arxivar després que el trimestre acabe és el normal: no es diu.
 * @param {object[]} classificats
 * @returns {Array<{ codi, severitat, missatge, ruta: string, diuCarpeta: string, diuNom: string }>}
 */
export function incongruenciesDe(classificats) {
  const troballes = [];
  for (const d of llistaDocs(classificats).sort((x, y) => compara(x.ruta, y.ruta))) {
    if ((d.categoria !== 'factures' && d.categoria !== 'bancs') || !d.context.trimestre) continue;
    const { any, t } = d.context.trimestre;
    const diuCarpeta = etiquetaTrimestre(any, t);
    const { trimestre: tros, document, mes, arxiu } = d.dates;
    const extra = (diuNom) => ({ ruta: d.ruta, diuCarpeta, diuNom });
    if (tros && (tros.t !== t || (tros.any !== null && tros.any !== any))) {
      const diuNom = etiquetaTrimestre(tros.any, tros.t);
      troballes.push(troballa('DATA_FORA_TRIMESTRE',
        `El nom diu ${diuNom} i el fitxer és en la carpeta del ${diuCarpeta}: revisa a quin trimestre va.`, extra(diuNom)));
      continue;
    }
    const data = document ?? (mes ? { a: mes.a, m: mes.m, d: 1 } : null);
    if (data && (data.a !== any || trimestreDe(data) !== t)) {
      const diuNom = document ? formatData(document) : etiquetaMes(mes);
      troballes.push({
        ...troballa('DATA_FORA_TRIMESTRE',
          `El nom porta ${document ? 'la data' : 'el mes'} ${diuNom}, que no és del ${diuCarpeta}: revisa-ho.`, extra(diuNom)),
        severitat: 'baixa'
      });
      continue;
    }
    const rang = rangTrimestre(any, t);
    if (arxiu && rang && comparaDates(arxiu, rang.inici) < 0) {
      const diuNom = formatData(arxiu);
      troballes.push(troballa('ARXIVAT_ABANS_DEL_TRIMESTRE',
        `Es va arxivar el ${diuNom}, abans que el ${diuCarpeta} començara: revisa que siga d'este trimestre.`, extra(diuNom)));
    }
  }
  return troballes;
}

/* Els índexs absents entre des i fins (inclosos), dels últims `maxim` com a molt. */
function forats(des, fins, presents, maxim) {
  const falten = [];
  for (let i = Math.max(des, fins - maxim + 1); i <= fins; i += 1) if (!presents.has(i)) falten.push(i);
  return falten;
}

/* Els mesos del nom de cada sèrie (per arrel): Map<arrel, Set<índex de mes>>. */
function mesosPerSerie(docs) {
  const series = new Map();
  for (const d of docs) {
    if (!d.dates.mes) continue;
    const arrel = arrelDeSerie(d.nom);
    if (!arrel) continue;
    if (!series.has(arrel)) series.set(arrel, new Set());
    series.get(arrel).add(indexMes(d.dates.mes));
  }
  return series;
}

/* Les sèries de comptadors amb zeros davant («invoice-prova-0001»): Map<prefix|amplada, { prefix, amplada, numeros }>. */
function comptadorsDe(docs) {
  const series = new Map();
  for (const d of docs) {
    const r = COMPTADOR.exec(senseMarcaCopia(plega(senseExtensio(d.nom))));
    if (!r) continue;
    const clau = `${r[1]}|${r[2].length}`;
    if (!series.has(clau)) series.set(clau, { prefix: r[1], amplada: r[2].length, numeros: new Set(), zeros: false });
    const serie = series.get(clau);
    serie.numeros.add(Number(r[2]));
    if (r[2].startsWith('0')) serie.zeros = true;
  }
  return series;
}

const densa = (vistos) => vistos.length >= MIN_SERIE && vistos.length / (vistos[vistos.length - 1] - vistos[0] + 1) >= DENSITAT_SERIE;
const ordenats = (conjunt) => [...conjunt].sort((x, y) => x - y);

/**
 * Els buits que es veuen pels noms (mai pel contingut), fora de l'arxiu, de
 * la identitat i dels tràmits:
 *   TRIMESTRE_SENSE_CARPETA (mitjana) · des de la primera carpeta de trimestre fins al trimestre
 *     d'abans d'`avui`, els que no tenen carpeta de trimestre ni d'any;
 *   MES_SENSE_EXTRACTE (mitjana) · en una sèrie mensual d'extractes (dos mesos o més amb la mateixa
 *     arrel), els mesos absents fins a l'últim mes sencer d'abans d'`avui`;
 *   FORAT_SERIE (baixa, una pista) · en una sèrie mensual de factures o en un comptador amb zeros
 *     davant, densos (tres o més, el 75 %), els absents entre el primer i l'últim.
 * Una carpeta buida no es veu (la Font només llista fitxers): és un límit, no un buit.
 * @param {object[]} classificats
 * @param {{ avui?: {a: number, m: number, d: number}|null }} [opcions] sense `avui`, fins a l'últim vist
 * @returns {object[]}
 */
export function buitsDe(classificats, { avui = null } = {}) {
  const docs = llistaDocs(classificats).filter((d) => !d.context.arxiu && !d.context.identitat && !d.context.burocracia);
  const ara = esDataValida(avui) ? avui : null;
  const buits = [];

  const trimestres = new Set();
  const anys = new Set();
  for (const d of docs) {
    if (d.context.trimestre) trimestres.add(indexTrimestre(d.context.trimestre.any, d.context.trimestre.t));
    if (d.context.any !== null) anys.add(d.context.any);
  }
  if (trimestres.size > 0) {
    const vistos = ordenats(trimestres);
    const fins = ara ? indexTrimestre(ara.a, trimestreDe(ara)) - 1 : vistos[vistos.length - 1];
    for (const i of forats(vistos[0], fins, trimestres, MAX_TRIMESTRES)) {
      const { any, t } = trimestreDeIndex(i);
      if (anys.has(any)) continue;
      buits.push(troballa('TRIMESTRE_SENSE_CARPETA',
        `No hi ha cap carpeta del ${t}T de ${any} (com ${any}_${t}T) ni de l'any ${any}. Si hi hagué factures, on són? Una carpeta buida no es veu.`,
        { any, t }));
    }
  }

  const extractes = mesosPerSerie(docs.filter((d) => d.categoria === 'bancs'));
  for (const arrel of [...extractes.keys()].sort(compara)) {
    const vistos = ordenats(extractes.get(arrel));
    if (vistos.length < 2) continue;
    const fins = ara ? indexMes(ara) - 1 : vistos[vistos.length - 1];
    const mesos = forats(vistos[0], fins, extractes.get(arrel), MAX_MESOS).map(mesDeIndex);
    if (mesos.length === 0) continue;
    const falten = mesos.map(etiquetaMes);
    buits.push(troballa('MES_SENSE_EXTRACTE', `De la sèrie «${arrel}» falten els extractes de ${llista(falten)}.`, { serie: arrel, falten, mesos }));
  }

  const factures = docs.filter((d) => d.categoria === 'factures');
  const mensuals = mesosPerSerie(factures);
  for (const arrel of [...mensuals.keys()].sort(compara)) {
    const vistos = ordenats(mensuals.get(arrel));
    if (!densa(vistos)) continue;
    const mesos = forats(vistos[0], vistos[vistos.length - 1], mensuals.get(arrel), MAX_MESOS).map(mesDeIndex);
    if (mesos.length === 0) continue;
    const falten = mesos.map(etiquetaMes);
    buits.push(troballa('FORAT_SERIE', `Pista: a la sèrie mensual «${arrel}» no hi ha ${llista(falten)}; revisa-ho.`, { serie: arrel, falten, mesos }));
  }
  const comptadors = comptadorsDe(factures);
  for (const clau of [...comptadors.keys()].sort(compara)) {
    const { prefix, amplada, numeros, zeros } = comptadors.get(clau);
    const vistos = ordenats(numeros);
    if (!zeros || !densa(vistos)) continue;
    const falten = forats(vistos[0], vistos[vistos.length - 1], numeros, MAX_MESOS).map((n) => String(n).padStart(amplada, '0'));
    if (falten.length === 0) continue;
    buits.push(troballa('FORAT_SERIE', `Pista: a la sèrie «${prefix}…» no hi ha ${llista(falten)}; revisa-ho.`, { serie: prefix, falten }));
  }
  return buits;
}

/* Un document de la identitat legal: dins de la seua carpeta (també la que hi ha dins de l'arxiu) o de la categoria pel
   nom. D'eixos no es diu mai el nom ni la ruta, només la carpeta i el recompte (revisió adversarial 13-10-2026,
   troballes PRIV-2, ORD-1 i FP-1). */
const esDeLaIdentitat = (d) => Boolean(d.context?.identitat) || d.categoria === 'identitat';
/* La carpeta amb què es diu un document de la identitat: la de la identitat legal, o la seua (pel nom). */
const carpetaDeLaIdentitat = (d) => d.context?.carpetaIdentitat ?? d.carpeta ?? '';

function alertaDeCredencial(d) {
  return d.extensio === 'key'
    ? { ...troballa('CREDENCIAL_SOLTA', "Un fitxer .key: si és una clau privada, guarda-la fora d'esta carpeta, en un lloc xifrat. Si és una presentació, no passa res."), severitat: 'mitjana', ruta: d.ruta }
    : { ...troballa('CREDENCIAL_SOLTA', "Una credencial o un certificat amb clau privada solt en la carpeta: guarda'l fora d'ací, en un lloc xifrat."), ruta: d.ruta };
}

/* Les credencials d'una carpeta de la identitat, en una sola alerta: la carpeta i el recompte, cap nom ni cap ruta. */
function alertaDeCarpetaIdentitat(carpeta, docs) {
  const n = docs.length;
  const missatge = n === 1
    ? "Un fitxer de la carpeta de la identitat legal pareix una credencial o un certificat amb clau privada: guarda'l fora d'esta carpeta, en un lloc xifrat. Ací no es diu el seu nom."
    : `${n} fitxers de la carpeta de la identitat legal pareixen credencials o certificats amb clau privada: guarda'ls fora d'esta carpeta, en un lloc xifrat. Ací no es diu el nom de cap.`;
  return {
    ...troballa('CREDENCIAL_SOLTA', missatge),
    severitat: docs.every((d) => d.extensio === 'key') ? 'mitjana' : SEVERITAT_ESCANER.CREDENCIAL_SOLTA,
    identitat: true,
    carpeta,
    n
  };
}

/**
 * Les credencials soltes a la carpeta, també dins de l'arxiu: un certificat
 * amb clau privada (.pfx, .p12), una clau (.pem, .ppk, .jks, .key) o un
 * magatzem de contrasenyes (.kdbx), i el que el catàleg diu credencial pel
 * nom. Una signatura separada (.p7s) no ho és.
 * Les de la identitat legal (la seua carpeta, també dins de l'arxiu, o la
 * categoria pel nom) no porten cap ruta: una alerta per carpeta, amb
 * `identitat: true`, la carpeta i quantes n'hi ha (revisió adversarial
 * 13-10-2026, troballes PRIV-2, ORD-1 i FP-1). La resta, una per fitxer, amb
 * la ruta, com abans.
 * @param {object[]} classificats
 * @returns {Array<{ codi: 'CREDENCIAL_SOLTA', severitat, missatge, ruta: string }
 *   | { codi: 'CREDENCIAL_SOLTA', severitat, missatge, identitat: true, carpeta: string, n: number }>} per ordre de ruta o de carpeta
 */
export function alertesDe(classificats) {
  const credencials = llistaDocs(classificats).filter((d) => EXT_CREDENCIAL.has(d.extensio) || d.tipus === 'credencial-clar');
  const perCarpeta = new Map();
  const alertes = [];
  for (const d of credencials) {
    if (!esDeLaIdentitat(d)) {
      alertes.push(alertaDeCredencial(d));
      continue;
    }
    const carpeta = carpetaDeLaIdentitat(d);
    perCarpeta.set(carpeta, [...(perCarpeta.get(carpeta) ?? []), d]);
  }
  for (const [carpeta, docs] of perCarpeta) alertes.push(alertaDeCarpetaIdentitat(carpeta, docs));
  const clau = (a) => (a.identitat ? a.carpeta : a.ruta);
  return alertes.sort((x, y) => compara(clau(x), clau(y)) || compara(String(Boolean(x.identitat)), String(Boolean(y.identitat))));
}

/* El format amb què el Tauler el llegiria, si el cap ho confirma; sense cap llegit, 'no' (mai se suposa). */
function formatEfectiu(doc, delCap) {
  const { format } = doc.banc;
  if (format === 'xls' || format === 'pdf') return format;
  if (format === 'n43') return delCap === 'n43' ? 'n43' : 'no';
  if (format === 'csv' && (delCap === 'csv-tauler' || delCap === 'csv-altre')) return delCap;
  return 'no';
}

/* Com de recent és un extracte: el mes del nom (o la data, o el trimestre) i, després, la data del fitxer. */
function recenciaDe(doc) {
  const { mes, document, trimestre } = doc.dates;
  let pelNom = -1;
  if (mes) pelNom = indexMes(mes);
  else if (document) pelNom = indexMes(document);
  else if (trimestre && trimestre.any !== null) pelNom = trimestre.any * 12 + trimestre.t * 3 - 1;
  else if (doc.context.trimestre) pelNom = doc.context.trimestre.any * 12 + doc.context.trimestre.t * 3 - 1;
  return [pelNom, doc.modificat ?? -1];
}
const mesRecentPrimer = (x, y) => (y.recencia[0] - x.recencia[0]) || (y.recencia[1] - x.recencia[1]) || compara(x.d.ruta, y.d.ruta);

/**
 * Els extractes que es proposen per al Tauler, un per candidat (categoria
 * bancs), amb el format que n'ha dit el cap (formatDelCap). Es preseleccionen
 * només els que el Tauler llig, i de manera que res no es compte dues vegades
 * (resumTauler.js ajunta tots els CSV sense Norma 43 en un compte):
 *   · tots els 'n43'; amb una Norma 43, també els 'csv-tauler', que només hi afigen el comerç;
 *   · sense Norma 43, dels CSV de la mateixa arrel a la mateixa carpeta («banc» i «banc_2026»),
 *     el més gran (EXTRACTES_SOLAPATS_POSSIBLES); una sèrie de mesos diferents no se solapa;
 *   · el mateix sha256 no s'aboca dues vegades (DUPLICAT_EXACTE, no seleccionable);
 *   · 'csv-altre' (CSV_ALTRE_FORMAT), 'xls', 'pdf' i 'no' (EXTRACTE_NO_LLEGIBLE) no s'aboquen;
 *   · més de `maxim` (LIMITS_TAULER.fitxers): els més recents (MASSA_EXTRACTES).
 * @param {object[]} classificats
 * @param {{ formats?: Record<string, string>|Map<string, string>, maxim?: number }} [opcions] formats: ruta → format del cap
 * @returns {Array<{ ruta, nom, carpeta, mida, format, preseleccionat: boolean, seleccionable: boolean, codi: string|null,
 *   severitat: string|null, motiu: string, solapaAmb: string|null }>} per ordre de ruta
 */
export function triaExtractes(classificats, { formats = {}, maxim = LIMITS_TAULER.fitxers } = {}) {
  const limit = Number.isSafeInteger(maxim) && maxim > 0 ? maxim : LIMITS_TAULER.fitxers;
  const delCap = (ruta) => {
    if (formats instanceof Map) return formats.get(ruta);
    return formats && Object.prototype.hasOwnProperty.call(formats, ruta) ? formats[ruta] : undefined;
  };
  const files = llistaDocs(classificats)
    .filter((d) => d.categoria === 'bancs' && d.banc?.format)
    .sort((x, y) => compara(x.ruta, y.ruta))
    .map((d) => ({
      d, format: formatEfectiu(d, delCap(d.ruta)), preseleccionat: false, seleccionable: false,
      codi: null, motiu: '', solapaAmb: null, recencia: recenciaDe(d)
    }));
  const marca = (fila, codi, motiu, canvis = {}) => Object.assign(fila, { codi, motiu, ...canvis });

  for (const f of files) {
    if (f.format === 'n43') Object.assign(f, { preseleccionat: true, seleccionable: true, motiu: 'Norma 43: el Tauler la llig sencera.' });
    else if (f.format === 'csv-tauler') Object.assign(f, { preseleccionat: true, seleccionable: true, motiu: 'CSV de moviments del banc, en el format del Tauler.' });
    else if (f.format === 'csv-altre') marca(f, 'CSV_ALTRE_FORMAT', "CSV de moviments d'un altre format: el Tauler encara no llig este format.");
    else if (f.format === 'xls' || f.format === 'pdf') marca(f, 'EXTRACTE_NO_LLEGIBLE', f.d.banc.motiu);
    else marca(f, 'EXTRACTE_NO_LLEGIBLE', "No pareix un extracte que el Tauler sàpia llegir.");
  }

  const perSha = new Map();
  for (const f of files.filter((x) => x.seleccionable && x.d.sha256)) {
    const primer = perSha.get(f.d.sha256);
    if (!primer) perSha.set(f.d.sha256, f.d.ruta);
    else {
      marca(f, 'DUPLICAT_EXACTE', `Mateix contingut que «${primer}»: no s'aboca dues vegades.`,
        { preseleccionat: false, seleccionable: false, solapaAmb: primer });
    }
  }

  const lectors = files.filter((f) => f.seleccionable);
  if (lectors.some((f) => f.format === 'n43')) {
    for (const f of lectors.filter((x) => x.format === 'csv-tauler')) {
      f.motiu = 'CSV de moviments del banc: completa la Norma 43 amb el comerç de les compres amb targeta.';
    }
  } else {
    const grups = new Map();
    for (const f of lectors) {
      const clau = `${f.d.carpeta}//${arrelDExtracte(f.d.nom)}`;
      grups.set(clau, [...(grups.get(clau) ?? []), f]);
    }
    for (const membres of grups.values()) {
      if (membres.length < 2) continue;
      const mesos = membres.map((f) => (f.d.dates.mes ? indexMes(f.d.dates.mes) : null));
      if (mesos.every((m) => m !== null) && new Set(mesos).size === mesos.length) continue;
      const [millor, ...altres] = [...membres].sort((x, y) => ((y.d.mida ?? -1) - (x.d.mida ?? -1)) || mesRecentPrimer(x, y));
      for (const f of altres) {
        marca(f, 'EXTRACTES_SOLAPATS_POSSIBLES',
          `Pot repetir els moviments de «${millor.d.ruta}» (el mateix banc en la mateixa carpeta): se n'aboca només el més gran perquè res no es compte dues vegades. Revisa-ho.`,
          { preseleccionat: false, solapaAmb: millor.d.ruta });
      }
    }
  }

  const triats = files.filter((f) => f.preseleccionat).sort(mesRecentPrimer);
  for (const f of triats.slice(limit)) {
    marca(f, 'MASSA_EXTRACTES', `N'hi ha més de ${limit} per abocar: s'han triat els ${limit} més recents.`, { preseleccionat: false });
  }

  return files.map(({ d, format, preseleccionat, seleccionable, codi, motiu, solapaAmb }) => ({
    ruta: d.ruta, nom: d.nom, carpeta: d.carpeta, mida: d.mida, format, preseleccionat, seleccionable, codi,
    severitat: codi ? SEVERITAT_ESCANER[codi] : null, motiu, solapaAmb
  }));
}

/* ── La radiografia ─────────────────────────────────────────────────────── */

const COLUMNA_DE_BASE = Object.freeze({
  factura: 'factures', rebut: 'rebuts', 'model-trimestral': 'fulls', 'full-calcul': 'fulls', 'csv-factura': 'csvProveidor', imatge: 'imatges'
});
const columnaDe = (d) => (d.categoria === 'bancs' ? 'extractes'
  : (d.categoria === 'factures' && COLUMNA_DE_BASE[d.base?.tipus]) || 'altres');

const RESUM_EXTRACTES = Object.freeze({
  DUPLICAT_EXACTE: (n) => `${plural(n, 'Un extracte és còpia', 'extractes són còpies')} d'un altre: no s'aboquen dues vegades.`,
  CSV_ALTRE_FORMAT: (n) => `${plural(n, 'Un CSV de moviments és', 'CSV de moviments són')} d'un format que el Tauler encara no llig.`,
  EXTRACTE_NO_LLEGIBLE: (n) => `${plural(n, 'Un extracte no es pot', 'extractes no es poden')} llegir: exporta'ls del banc en Norma 43 o en CSV.`,
  EXTRACTES_SOLAPATS_POSSIBLES: (n) => `${plural(n, 'Un CSV pot', 'CSV poden')} repetir els moviments d'un altre: revisa quin s'aboca.`,
  MASSA_EXTRACTES: (n) => `${plural(n, 'Un extracte s\'ha', 'extractes s\'han')} quedat fora del límit del Tauler: s'han triat els més recents.`
});
const SENSE_CARPETES = "Cap fitxer és dins d'una subcarpeta: si s'han triat d'un en un (hi ha navegadors, com el de l'iPhone, "
  + 'que no deixen triar carpetes), no es poden saber els trimestres ni els bancs per la carpeta.';

/**
 * La radiografia de la carpeta: només recomptes, sense cap ruta ni cap byte,
 * i la mateixa siga quin siga l'ordre de l'entrada. Els detalls són a les
 * llistes de cada funció. `identitat` és la pista per a la vista «Identitat i
 * Finestreta» (ordre del Mestre, 13-10-2026, pla 261013_1405, front H): les
 * carpetes de la identitat legal i els fitxers de la categoria (també els que
 * ho són pel nom), comptats i mai llegits.
 * @param {{ nom?: string, entrades?: object[], classificats?: object[], duplicats?: object[], incongruencies?: object[],
 *   buits?: object[], alertes?: object[], extractes?: object[], limitacions?: Array<{ codi?: string, missatge: string }> }} parts
 * @returns {object} { esquema, carpeta, fitxers, descartats, perCategoria, factures: { perTrimestre, perAny }, bancs,
 *   identitat: { carpetes, fitxers }, duplicats, incongruencies, buits, alertes, avisos }
 */
export function radiografiaDe({
  nom = '', entrades = [], classificats = [], duplicats = [], incongruencies = [], buits = [], alertes = [], extractes = [],
  limitacions = []
} = {}) {
  const docs = llistaDocs(classificats);
  const llistaDe = (x) => (Array.isArray(x) ? x : []);
  const perCategoria = Object.fromEntries(CATEGORIES_ESCANER.map((c) => [c, 0]));
  for (const d of docs) if (Object.prototype.hasOwnProperty.call(perCategoria, d.categoria)) perCategoria[d.categoria] += 1;

  const perCarpeta = new Map();
  const perAny = new Map();
  for (const d of docs) {
    if (d.categoria === 'arxiu') continue;
    const q = d.context.trimestre;
    if (q) {
      if (!perCarpeta.has(q.carpeta)) {
        perCarpeta.set(q.carpeta, { any: q.any, t: q.t, carpeta: q.carpeta, factures: 0, rebuts: 0, fulls: 0, csvProveidor: 0, imatges: 0, extractes: 0, altres: 0 });
      }
      perCarpeta.get(q.carpeta)[columnaDe(d)] += 1;
    } else if (d.context.any !== null && d.categoria === 'factures') {
      perAny.set(d.context.any, (perAny.get(d.context.any) ?? 0) + 1);
    }
  }

  const files = llistaDe(extractes);
  const perCodi = new Map();
  for (const f of files) if (f && f.codi) perCodi.set(f.codi, (perCodi.get(f.codi) ?? 0) + 1);
  const avisos = [];
  for (const l of llistaDe(limitacions)) if (l && typeof l.missatge === 'string') avisos.push(troballa('FONT_LIMITADA', l.missatge));
  if (docs.length > 0 && docs.every((d) => !d.context.carpeta)) avisos.push(troballa('FONT_LIMITADA', SENSE_CARPETES));
  for (const [codi, n] of perCodi) if (RESUM_EXTRACTES[codi]) avisos.push({ ...troballa(codi, RESUM_EXTRACTES[codi](n)), n });
  avisos.sort((x, y) => (SEVERITATS.indexOf(x.severitat) - SEVERITATS.indexOf(y.severitat)) || compara(x.codi, y.codi) || compara(x.missatge, y.missatge));

  const ambCodi = (llistat, codi) => comptaSi(llistaDe(llistat), (x) => x?.codi === codi);
  const perSeveritat = (llistat) => Object.fromEntries(SEVERITATS.map((s) => [s, comptaSi(llistaDe(llistat), (x) => x?.severitat === s)]));
  return {
    esquema: ESQUEMA_RADIOGRAFIA,
    carpeta: String(nom ?? ''),
    fitxers: docs.length,
    descartats: Math.max(0, llistaDe(entrades).length - docs.length),
    perCategoria,
    factures: {
      perTrimestre: [...perCarpeta.values()].sort((x, y) => (x.any - y.any) || (x.t - y.t) || compara(x.carpeta, y.carpeta)),
      perAny: [...perAny.entries()].map(([any, n]) => ({ any, n })).sort((x, y) => x.any - y.any)
    },
    bancs: {
      candidats: files.length,
      llegibles: comptaSi(files, (f) => FORMATS_LLEGIBLES.has(f?.format)),
      noLlegibles: comptaSi(files, (f) => !FORMATS_LLEGIBLES.has(f?.format)),
      preseleccionats: comptaSi(files, (f) => f?.preseleccionat === true)
    },
    identitat: {
      carpetes: new Set(docs.filter((d) => d.categoria === 'identitat' && d.context.carpetaIdentitat).map((d) => d.context.carpetaIdentitat)).size,
      fitxers: perCategoria.identitat
    },
    duplicats: {
      grups: llistaDe(duplicats).length,
      copies: llistaDe(duplicats).reduce((n, g) => n + (Array.isArray(g?.copies) ? g.copies.length : 0), 0),
      entreTrimestres: ambCodi(duplicats, 'DUPLICAT_ENTRE_TRIMESTRES')
    },
    incongruencies: { total: llistaDe(incongruencies).length, ...perSeveritat(incongruencies) },
    buits: {
      total: llistaDe(buits).length,
      trimestres: ambCodi(buits, 'TRIMESTRE_SENSE_CARPETA'),
      mesos: llistaDe(buits).reduce((n, b) => n + (b?.codi === 'MES_SENSE_EXTRACTE' && Array.isArray(b.falten) ? b.falten.length : 0), 0),
      series: ambCodi(buits, 'FORAT_SERIE')
    },
    /* `credencials` compta fitxers: una alerta d'una carpeta de la identitat en porta `n` (revisió adversarial
       13-10-2026, troballa PRIV-2). `total` compta les files de la Taula · Alertes. */
    alertes: {
      total: llistaDe(alertes).length,
      credencials: llistaDe(alertes).reduce((n, a) => n + (a?.codi !== 'CREDENCIAL_SOLTA' ? 0
        : Number.isSafeInteger(a.n) && a.n > 0 ? a.n : 1), 0)
    },
    avisos
  };
}

/**
 * Tot el pipeline pur d'una passada, per a l'executor: classifica, troba
 * duplicats, incongruències, buits i alertes, tria els extractes i en fa la
 * radiografia.
 * @param {{ nom?: string, entrades: object[], formats?: Record<string, string>|Map<string, string>,
 *   avui?: {a: number, m: number, d: number}|null, serie?: RegExp|null, limitacions?: object[], maxim?: number }} entrada
 * @returns {{ radiografia: object, documents: object[], duplicats: object[], incongruencies: object[], buits: object[],
 *   alertes: object[], extractes: object[] }}
 */
export function analitzaCarpeta({ nom = '', entrades = [], formats = {}, avui = null, serie = null, limitacions = [], maxim } = {}) {
  const documents = classificaArbre(entrades, { serie });
  const duplicats = duplicatsDe(documents);
  const incongruencies = incongruenciesDe(documents);
  const buits = buitsDe(documents, { avui });
  const alertes = alertesDe(documents);
  const extractes = triaExtractes(documents, { formats, maxim });
  const radiografia = radiografiaDe({ nom, entrades, classificats: documents, duplicats, incongruencies, buits, alertes, extractes, limitacions });
  return { radiografia, documents, duplicats, incongruencies, buits, alertes, extractes };
}
