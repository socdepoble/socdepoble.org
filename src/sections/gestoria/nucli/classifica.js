/**
 * classifica.js — què és cada document de la carpeta, i qui l'ha emés.
 *
 * Classifica pel nom i la ruta, sense llegir el contingut: el model trimestral
 * ja lliurat, factures, rebuts de pagament (que NO són factures), CSV de
 * factura de proveïdor, extractes, fulls de càlcul i imatges. Els fitxers
 * ocults del sistema (.DS_Store, ._*) no es tornen. També aprén la sèrie de
 * les factures emeses, troba duplicats i llig el CSV de factura de Google.
 * JS pur: sense DOM ni React.
 */
import { CATALEG_PROVEIDORS, proveidorPerNomFitxer } from './cataleg.js';
import { comparaDates, esDataValida, parseData } from './dates.js';
import { parseImport } from './diners.js';
import { parseCsv } from './csv.js';

export const TIPUS_DOCUMENT = Object.freeze([
  'model-trimestral', 'factura', 'rebut', 'csv-factura', 'extracte', 'full-calcul', 'imatge', 'desconegut'
]);

const MODEL_TRIMESTRAL = /^\d{4}-FACTURACIO-.*\.(csv|xlsx)$/i;
const EXTRACTE_BANC = /^account_activities_.*\.csv$/i;
const EXTRACTE = /(^|[^a-z])(extracte|extracto)/;
const CSV_FACTURA_GOOGLE = /^\d{10}\.csv$/;
/* Rebuts i justificants de pagament pel nom (sense accents i en minúscules). «justi» sol, el «Justi_…» dels
   bancs, només si no el seguix cap lletra: així «justicia» o «Justin» no hi casen. */
const REBUT = /(^|[^a-z])(?:receipt|rebut|recibo|justificant|comprovant|comprobante|justi(?=[^a-z]|$))/;
/* «Transferència» és un indici feble: la factura d'un trasllat de domini també la pot dur al nom. */
const TRANSFERENCIA = /(^|[^a-z])transferencia/;
const DIU_FACTURA = /(^|[^a-z])(?:factura|invoice|fra)(?![a-z])/;
const esRebutPelNom = (net) => REBUT.test(net) || (TRANSFERENCIA.test(net) && !DIU_FACTURA.test(net));
const SISTEMA = new Set(['thumbs.db', 'desktop.ini']);
const EXT_IMATGE = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);
const EXT_FULL = new Set(['xls', 'xlsx', 'numbers', 'ods', 'csv']);
/* Carpetes que diuen el sentit: «02_Gastos», «Ingressos», «Factures emeses»... */
const CARPETA_EMESA = /(^|[^a-z])(emeses|emesa|emitides|emitidas|ingressos|ingresos|vendes|ventas|clients|clientes)([^a-z]|$)/;
const CARPETA_REBUDA = /(^|[^a-z])(rebudes|rebuda|recibidas|despeses|gastos|compres|compras|proveidors|proveedores)([^a-z]|$)/;

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const segments = (ruta) => String(ruta ?? '').split(/[\\/]/).filter((s) => s !== '' && s !== '.' && s !== '..');
const nomDe = (ruta) => segments(ruta).pop() ?? '';

function extensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

const esOcult = (ruta) => segments(ruta).some((s) => s.startsWith('.')) || SISTEMA.has(nomDe(ruta).toLowerCase());

/* El sentit que diuen les carpetes de la ruta (no el nom del fitxer), o null. */
function sentitPerCarpeta(ruta) {
  const carpetes = segments(ruta).slice(0, -1).map((s) => senseAccents(s).toLowerCase());
  if (carpetes.some((s) => CARPETA_EMESA.test(s))) return 'emesa';
  if (carpetes.some((s) => CARPETA_REBUDA.test(s))) return 'rebuda';
  return null;
}

/**
 * Cert si el nom del fitxer porta un número de la sèrie de factures emeses.
 * @param {string} nomFitxer nom o ruta
 * @param {RegExp|null} serie la de serieEmesa
 * @returns {'emesa'|null}
 */
export function sentitPerSerie(nomFitxer, serie) {
  if (!(serie instanceof RegExp)) return null;
  const nom = nomDe(nomFitxer);
  return nom && serie.test(nom) ? 'emesa' : null;
}

/**
 * Classifica un document pel nom i la ruta. Els ocults del sistema tornen null.
 * El sentit: 'emesa' per la sèrie pròpia o per la carpeta; 'rebuda' per la
 * carpeta, per un proveïdor del catàleg o perquè és un rebut o un CSV de
 * proveïdor; si no se sap, null.
 * @param {{ ruta: string, mida?: number }} doc
 * @param {{ serie?: RegExp|null }} [opcions]
 * @returns {{ tipus: string, sentit: 'emesa'|'rebuda'|null, motiu: string }|null}
 */
export function classificaDocument(doc, { serie = null } = {}) {
  const ruta = String(doc?.ruta ?? '');
  const nom = nomDe(ruta);
  if (!nom || esOcult(ruta)) return null;
  const ext = extensio(nom);
  const net = senseAccents(nom).toLowerCase();
  const perCarpeta = sentitPerCarpeta(ruta);
  const delCataleg = proveidorPerNomFitxer(nom);
  const sentitFactura = () => {
    if (sentitPerSerie(nom, serie)) return { sentit: 'emesa', motiu: 'porta un número de la teua sèrie de factures emeses' };
    if (perCarpeta) return { sentit: perCarpeta, motiu: `és dins d'una carpeta de factures ${perCarpeta === 'emesa' ? 'emeses' : 'rebudes'}` };
    if (delCataleg) return { sentit: 'rebuda', motiu: `el nom és el dels fitxers de ${delCataleg.nom}` };
    return { sentit: null, motiu: 'no se sap si és emesa o rebuda' };
  };
  const resultat = (tipus, sentit, motiu) => ({ tipus, sentit, motiu });

  if (MODEL_TRIMESTRAL.test(nom)) return resultat('model-trimestral', null, 'full trimestral per a la gestoria (AAAA-FACTURACIO-…)');
  if (EXTRACTE_BANC.test(nom)) return resultat('extracte', null, 'extracte de moviments del banc (account_activities_…)');
  if (CSV_FACTURA_GOOGLE.test(nom)) return resultat('csv-factura', 'rebuda', 'CSV de factura de proveïdor (número de 10 xifres)');
  if (['pdf', ...EXT_IMATGE].includes(ext) && esRebutPelNom(net)) {
    return resultat('rebut', perCarpeta === 'emesa' ? 'emesa' : 'rebuda', 'rebut o justificant de pagament: no és una factura');
  }
  if (EXTRACTE.test(net) && ['pdf', ...EXT_FULL].includes(ext)) return resultat('extracte', null, 'extracte bancari pel nom');
  if (ext === 'pdf') {
    const { sentit, motiu } = sentitFactura();
    return resultat('factura', sentit, `factura en PDF; ${motiu}`);
  }
  if (EXT_FULL.has(ext)) return resultat('full-calcul', null, 'full de càlcul');
  if (EXT_IMATGE.has(ext)) {
    const { sentit } = sentitFactura();
    return resultat('imatge', sentit, 'imatge: pot ser una factura fotografiada, cal completar-la a mà');
  }
  return resultat('desconegut', null, 'tipus de fitxer desconegut');
}

/**
 * Classifica una llista de documents i en lleva els ocults del sistema.
 * @param {Array<{ ruta: string, mida?: number }>} documents
 * @param {{ serie?: RegExp|null }} [opcions]
 * @returns {Array<object>} cada document amb tipus, sentit i motiu
 */
export function classificaDocuments(documents, opcions = {}) {
  const classificats = [];
  for (const doc of documents ?? []) {
    const c = classificaDocument(doc, opcions);
    if (c) classificats.push({ ...doc, ...c });
  }
  return classificats;
}

/* Fitxes de lletres i de xifres d'un número de factura: «F26 0001» → F, 26, 0001. */
const fitxesNum = (num) => String(num ?? '').trim().match(/[A-Za-z]+|\d+/g) ?? [];
const formaDe = (fitxes) => fitxes.map((f) => (/^\d/.test(f) ? 'd' : 'l')).join('');
const SEPARADOR = '[\\s._/-]*';

/**
 * Aprén la sèrie de les factures emeses dels números dels ingressos: la forma
 * de la factura més recent, generalitzada amb totes les de la mateixa forma.
 * «F26 0001» dona /F[\s._/-]*26[\s._/-]*0*\d{1,4}/i (amb vores perquè no
 * case dins d'una altra paraula ni d'un número més llarg). Una sèrie sense
 * cap lletra es confondria amb les dates dels noms de fitxer: torna null.
 * @param {Array<object|string>} ingressosHistorics Factures (o números)
 * @returns {RegExp|null}
 */
export function serieEmesa(ingressosHistorics) {
  const mostres = [];
  for (const x of ingressosHistorics ?? []) {
    if (x && typeof x === 'object' && x.tipus && x.tipus !== 'ingres') continue;
    const fitxes = fitxesNum(typeof x === 'string' ? x : x?.num);
    if (fitxes.length > 0) mostres.push({ fitxes, forma: formaDe(fitxes), data: typeof x === 'object' ? x.data : null });
  }
  if (mostres.length === 0) return null;
  const recents = mostres.filter((m) => esDataValida(m.data)).sort((x, y) => comparaDates(y.data, x.data));
  let forma = recents[0]?.forma;
  if (!forma) {
    const comptes = new Map();
    for (const m of mostres) comptes.set(m.forma, (comptes.get(m.forma) ?? 0) + 1);
    forma = [...comptes.entries()].reduce((x, y) => (y[1] > x[1] ? y : x))[0];
  }
  if (!forma.includes('l') || !forma.endsWith('d')) return null;
  const iguals = mostres.filter((m) => m.forma === forma).map((m) => m.fitxes);
  const parts = [...forma].map((tipus, k) => {
    const valors = iguals.map((fitxes) => fitxes[k]);
    const llargaries = valors.map((v) => v.length);
    const [min, max] = [Math.min(...llargaries), Math.max(...llargaries)];
    if (k === forma.length - 1) {
      const significatives = valors.map((v) => v.replace(/^0+(?=\d)/, '').length);
      return `0*\\d{1,${Math.max(4, ...significatives)}}`;
    }
    if (tipus === 'l') {
      const majuscules = valors.map((v) => v.toUpperCase());
      return majuscules.every((v) => v === majuscules[0]) ? majuscules[0] : `[a-z]{${min},${max}}`;
    }
    if (valors.every((v) => v === valors[0])) return valors[0];
    return min === max ? `\\d{${min}}` : `\\d{${min},${max}}`;
  });
  return new RegExp(`(?:^|[^a-z0-9])${parts.join(SEPARADOR)}(?![0-9])`, 'i');
}

/* Marques de còpia al final del nom: « copia», « - copia», « còpia 2», « copy», « (1)». */
const MARCA_COPIA = /(?:\s+-)?\s+(?:copia|copy)(?:\s+\(?\d+\)?)?$|\s*\(\d+\)$/;

function clauDeNom(ruta) {
  const parts = segments(ruta);
  const nom = parts.pop() ?? '';
  const punt = nom.lastIndexOf('.');
  const ext = punt > 0 ? nom.slice(punt).toLowerCase() : '';
  let arrel = senseAccents(punt > 0 ? nom.slice(0, punt) : nom).toLowerCase();
  let marca = false;
  while (MARCA_COPIA.test(arrel)) {
    arrel = arrel.replace(MARCA_COPIA, '');
    marca = true;
  }
  return { clau: `${parts.join('/').toLowerCase()}/${arrel}${ext}`, marca };
}

const midesProperes = (x, y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 0.01 * Math.max(x, y);

/**
 * Agrupa els documents duplicats: el mateix sha256, o el mateix nom dins de la
 * mateixa carpeta amb una marca de còpia (« copia», « copy», « (1)») i una
 * mida a ±1 %. Dins de cada grup, primer l'original (sense marca).
 * @param {Array<{ ruta: string, mida?: number, sha256?: string }>} documents
 * @returns {Array<{ motiu: 'contingut'|'nom', documents: object[] }>}
 */
export function detectaDuplicats(documents) {
  const docs = (documents ?? []).filter((d) => d && typeof d.ruta === 'string');
  const pare = docs.map((_, i) => i);
  const arrel = (i) => {
    let r = i;
    while (pare[r] !== r) r = pare[r];
    pare[i] = r;
    return r;
  };
  const uneix = (i, j) => {
    pare[arrel(j)] = arrel(i);
  };

  const perSha = new Map();
  const perNom = new Map();
  const noms = docs.map((d) => clauDeNom(d.ruta));
  docs.forEach((d, i) => {
    if (typeof d.sha256 === 'string' && d.sha256 !== '') {
      if (perSha.has(d.sha256)) uneix(perSha.get(d.sha256), i);
      else perSha.set(d.sha256, i);
    }
    const llista = perNom.get(noms[i].clau) ?? [];
    for (const j of llista) {
      if ((noms[i].marca || noms[j].marca) && midesProperes(docs[i].mida, docs[j].mida)) uneix(j, i);
    }
    llista.push(i);
    perNom.set(noms[i].clau, llista);
  });

  const grups = new Map();
  docs.forEach((_, i) => {
    const r = arrel(i);
    grups.set(r, [...(grups.get(r) ?? []), i]);
  });
  const resultat = [];
  for (const indexos of grups.values()) {
    if (indexos.length < 2) continue;
    indexos.sort((x, y) => Number(noms[x].marca) - Number(noms[y].marca) || (docs[x].ruta < docs[y].ruta ? -1 : 1));
    const shas = indexos.map((i) => docs[i].sha256);
    const motiu = shas[0] && shas.every((s) => s === shas[0]) ? 'contingut' : 'nom';
    resultat.push({ motiu, documents: indexos.map((i) => docs[i]) });
  }
  return resultat.sort((x, y) => (x.documents[0].ruta < y.documents[0].ruta ? -1 : 1));
}

/* Claus de les files clau-valor: sense accents, minúscules, sense dos punts ni
   punts d'abreviatura («I.V.A.» → «iva»); el punt decimal d'«21.5%» es queda. */
const clauFila = (text) => senseAccents(text).toLowerCase().replace(/\.(?!\d)/g, '').replace(/:/g, '').replace(/\s+/g, ' ').trim();
const CLAU_NUM = /^(numero de (la )?factura|num de factura|invoice number)$/;
const CLAU_DATA = /^(fecha de (la )?factura|data de (la )?factura|invoice date)$/;
const CLAU_IMPORT = /^(importe de (la )?factura|import de (la )?factura|invoice amount)$/;
const CLAU_CAPCALERA = /^(descripcion|descripcio|description)$/;
const FILA_IVA = /^(iva|vat|igic)\b.*?(\d+(?:[.,]\d+)?)\s*%/;

/**
 * Llig el CSV de factura que descarrega Google (files clau-valor i una taula
 * amb les línies, el subtotal, «I.V.A. (21%)» i el total). Torna una Factura
 * parcial (sense id ni estat: passa-la per crearFactura amb l'origen.fitxer),
 * o null si el text no hi té cap número ni cap import.
 * @param {string} text
 * @param {{ proveidor?: object }} [opcions] l'entrada del catàleg que l'emet (Google per defecte)
 * @returns {object|null}
 */
export function llegeixCsvFacturaProveidor(text, { proveidor = CATALEG_PROVEIDORS.find((p) => p.clau === 'google-cloud') } = {}) {
  let num = '';
  let data = null;
  let importFactura = null;
  let subtotal = null;
  let iva = null;
  let totalTaula = null;
  let percentatge = null;
  let descripcio = '';
  let enTaula = false;
  for (const fila of parseCsv(text)) {
    const cel = fila.map((c) => c.trim());
    const clau = clauFila(cel[0] ?? '');
    const valors = cel.slice(1).filter((c) => c !== '');
    const primer = valors[0] ?? '';
    const darrer = valors[valors.length - 1] ?? '';
    if (!clau) continue;
    if (CLAU_NUM.test(clau)) num = primer;
    else if (CLAU_DATA.test(clau)) data = parseData(primer);
    else if (CLAU_IMPORT.test(clau)) importFactura = parseImport(primer);
    else if (CLAU_CAPCALERA.test(clau)) enTaula = true;
    else if (enTaula && clau.startsWith('subtotal')) subtotal = parseImport(darrer);
    else if (enTaula && FILA_IVA.test(clau)) {
      iva = parseImport(darrer);
      percentatge = Number(FILA_IVA.exec(clau)[2].replace(',', '.'));
    } else if (enTaula && clau.startsWith('total')) totalTaula = parseImport(darrer);
    else if (enTaula && !descripcio) descripcio = cel[0];
  }
  const total = importFactura ?? totalTaula;
  if (!num && total === null && subtotal === null) return null;

  const confianca = {};
  if (num) confianca.num = 'alta';
  if (data) confianca.data = 'alta';
  if (total !== null) confianca.total = 'alta';
  if (subtotal !== null) confianca.subtotal = 'alta';
  if (iva !== null) confianca.iva = 'alta';
  if (subtotal === null && total !== null && iva !== null) {
    subtotal = total - iva;
    confianca.subtotal = 'mitjana';
  }
  if (iva === null && total !== null && subtotal !== null) {
    iva = total - subtotal;
    confianca.iva = 'mitjana';
  }
  if (proveidor) {
    confianca.contrapart = 'mitjana';
    if (proveidor.nif) confianca.nif = 'mitjana';
  }
  return {
    tipus: 'despesa',
    data,
    num,
    contrapart: proveidor?.nom ?? '',
    nif: proveidor?.nif ?? '',
    descripcio,
    subtotal,
    iva,
    total,
    ...(percentatge === null ? {} : { percentatgeIva: percentatge }),
    origen: { fitxer: null, metode: 'csv-proveidor' },
    confianca
  };
}
