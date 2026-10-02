/**
 * model.js — la Factura de la Gestoria: creació, identitat, validació i totals.
 *
 * Contracte: { id, tipus: 'ingres'|'despesa', data: {a,m,d}|null, num,
 * contrapart, nif, descripcio, subtotal, iva, total (cèntims o null),
 * retencio? (retenció d'IRPF en cèntims, enter no negatiu o null; absent si
 * no se n'ha dit res), moneda? (codi ISO 4217 dels imports; absent vol dir
 * euros, 'XXX' una moneda que no s'ha pogut saber), origen: { fitxer,
 * metode, sha256? }, confianca: { camp: nivell }, estat }.
 * Una factura és 'completa' quan té tots els camps del full, els imports són
 * en euros, l'IVA quadra (amb la retenció descomptada o sense) i no passa del
 * 21 % general, el NIF és vàlid i cap camp s'ha llegit amb confiança baixa;
 * si no, 'pendent'.
 * JS pur: sense DOM ni React.
 */
import { comparaDates, dinsDeRang, esDataValida, formatData, parseData } from './dates.js';
import { formatImport, parseImport, sumaImports } from './diners.js';
import { normalitzaNif, validaNif } from './nif.js';

export const TIPUS_FACTURA = Object.freeze(['ingres', 'despesa']);
export const METODES_ORIGEN = Object.freeze(['model', 'csv-proveidor', 'pdf', 'correu', 'manual']);
export const NIVELLS_CONFIANCA = Object.freeze(['alta', 'mitjana', 'baixa']);
/* Els camps del full per a la gestoria, en l'ordre de les columnes. */
export const CAMPS_OBLIGATORIS = Object.freeze(['data', 'num', 'contrapart', 'nif', 'subtotal', 'iva', 'total']);
/* Tipus d'IVA en percentatge: general, reduït, superreduït, el 5 % de l'electricitat i l'exempt. */
export const TIPUS_IVA_HABITUALS = Object.freeze([0, 4, 5, 10, 21]);
/* Retencions d'IRPF habituals en percentatge: el 7 % de l'inici d'activitat
   professional, el 15 % general dels professionals i el 19 % dels lloguers. */
export const TIPUS_IRPF_HABITUALS = Object.freeze([7, 15, 19]);
/* Els codis que pot tornar validaFactura, en l'ordre en què els emet. */
export const CODIS_INCIDENCIA = Object.freeze([
  'CAMP_BUIT', 'MONEDA_ESTRANGERA', 'IVA_INCOHERENT', 'TIPUS_IVA_INUSUAL', 'NIF_INVALID', 'FORA_TRIMESTRE', 'RETENCIO_IRPF'
]);
const TOLERANCIA_IVA_PUNTS = 0.6;
/* El tipus general: per damunt (amb la tolerància), l'IVA no és d'un tipus espanyol. */
const TIPUS_IVA_MAXIM = 21;
/* La moneda dels imports del full. */
export const MONEDA_DEL_FULL = 'EUR';
/* ISO 4217: «cap moneda» o una que no se sap. */
const MONEDA_DESCONEGUDA = 'XXX';
/* Diferència màxima, en cèntims, entre subtotal + IVA (− retenció) i total. */
const TOLERANCIA_TOTAL = 1;

const CAMPS_IMPORT = new Set(['subtotal', 'iva', 'total']);
/* Qualsevol espai Unicode que no siga l'espai, el tabulador o un salt de
   línia (espais durs i prims inclosos). Classe negada: cap caràcter
   invisible literal al codi font (ESLint no-irregular-whitespace). */
const ESPAIS_DURS = /[^\S\n\r\t ]/g;
/* Sufixos societaris, ja sense punts ni espais («s.l.» → «sl», «s. coop. v.» → «scoopv»). */
const SUFIXOS = new Set([
  'sl', 'slu', 'sll', 'slne', 'slp', 'sa', 'sau', 'sad', 'sal', 'sccl', 'scoop', 'scoopv', 'scv', 'scl', 'coop', 'cb', 'scp',
  'unipersonal', 'sociedadlimitada', 'sociedadanonima', 'ltd', 'limited', 'inc', 'llc', 'llp', 'plc', 'gmbh', 'sarl', 'sas',
  'srl', 'bv', 'nv', 'ag'
]);
const COL = new Intl.Collator('ca', { numeric: true, sensitivity: 'base' });

const textNet = (valor) => (valor == null ? '' : String(valor).replace(ESPAIS_DURS, ' ').trim());

function importDe(valor) {
  if (Number.isSafeInteger(valor)) return valor;
  return typeof valor === 'string' ? parseImport(valor) : null;
}

/* La retenció es guarda en positiu: moltes factures l'escriuen amb el signe
   menys («-150,00 €») perquè resta del total. */
function retencioEscrita(valor) {
  const cents = importDe(valor);
  return cents === null ? null : Math.abs(cents);
}

/* Retenció d'una Factura en cèntims (positiva), o 0 si no en té. */
const retencioDe = (f) => (Number.isSafeInteger(f?.retencio) ? Math.abs(f.retencio) : 0);

/* La moneda escrita, com a codi ISO en majúscules. Buida: no se n'ha dit res
   (euros). Qualsevol altra cosa que no siga un codi no es pren per euros. */
function monedaEscrita(valor) {
  if (valor == null) return null;
  const net = textNet(valor).toUpperCase();
  if (net === '') return null;
  return /^[A-Z]{3}$/.test(net) ? net : MONEDA_DESCONEGUDA;
}

/* Cert si la factura diu que els seus imports no són en euros. */
const enAltraMoneda = (f) => typeof f?.moneda === 'string' && f.moneda !== MONEDA_DEL_FULL;

/* El total que descompta la retenció. En una rectificativa (base negativa)
   la retenció també va amb el signe girat i, per tant, hi suma. */
const totalAmbRetencio = (f, retencio) => f.subtotal + f.iva + (f.subtotal < 0 ? retencio : -retencio);

function confiancaNeta(confianca) {
  const neta = {};
  if (!confianca || typeof confianca !== 'object') return neta;
  for (const [camp, nivell] of Object.entries(confianca)) if (NIVELLS_CONFIANCA.includes(nivell)) neta[camp] = nivell;
  return neta;
}

/**
 * FNV-1a de 64 bits sobre l'UTF-8 del text, en 16 xifres hexadecimals.
 * @param {string} text
 * @returns {string}
 */
export function hashFnv1a(text) {
  let h = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(String(text))) {
    h ^= BigInt(byte);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

/**
 * Id estable d'una factura: el mateix contingut dona sempre el mateix id.
 * Hash de tipus|data|num|nif|total|origen.fitxer.
 */
export function idEstable(f) {
  const parts = [
    f?.tipus ?? '', formatData(f?.data, 'aaaa-mm-dd'), textNet(f?.num), normalitzaNif(f?.nif),
    Number.isSafeInteger(f?.total) ? f.total : '', f?.origen?.fitxer ?? ''
  ];
  return `f_${hashFnv1a(parts.join('|'))}`;
}

/**
 * Crea una Factura completa a partir d'una de parcial. La data i els imports
 * poden arribar com a text (es lligen amb parseData i parseImport). Sense
 * tipus vàlid és 'despesa'; sense mètode vàlid, 'manual'. L'estat es calcula,
 * però un 'pendent' explícit es respecta. La retenció d'IRPF és opcional: si
 * la parcial no en diu res, la Factura no porta el camp; si en diu, es guarda
 * en cèntims positius (un «-150,00 €» val 15000) o null si no es pot llegir.
 * La moneda també és opcional: absent (o buida) vol dir euros; un codi es
 * guarda en majúscules, i qualsevol altre valor, com a 'XXX'.
 * @param {object} [parcial]
 * @returns {object} Factura
 */
export function crearFactura(parcial = {}) {
  const p = parcial ?? {};
  const origen = p.origen ?? {};
  const moneda = monedaEscrita(p.moneda);
  const factura = {
    id: '',
    tipus: p.tipus === 'ingres' ? 'ingres' : 'despesa',
    data: parseData(p.data),
    num: textNet(p.num),
    contrapart: textNet(p.contrapart),
    nif: textNet(p.nif),
    descripcio: textNet(p.descripcio),
    subtotal: importDe(p.subtotal),
    iva: importDe(p.iva),
    total: importDe(p.total),
    ...(p.retencio !== undefined ? { retencio: retencioEscrita(p.retencio) } : {}),
    ...(moneda ? { moneda } : {}),
    origen: {
      fitxer: typeof origen.fitxer === 'string' && origen.fitxer !== '' ? origen.fitxer : null,
      metode: METODES_ORIGEN.includes(origen.metode) ? origen.metode : 'manual',
      ...(typeof origen.sha256 === 'string' && origen.sha256 !== '' ? { sha256: origen.sha256 } : {})
    },
    confianca: confiancaNeta(p.confianca),
    estat: 'pendent'
  };
  factura.id = typeof p.id === 'string' && p.id.trim() !== '' ? p.id.trim() : idEstable(factura);
  factura.estat = p.estat === 'pendent' ? 'pendent' : estatFactura(factura);
  return factura;
}

/**
 * Nom per a comparar contraparts: minúscules, sense diacrítics ni puntuació,
 * i sense els sufixos societaris del final (S.L., S.A.U., SCCL, Ltd, GmbH...).
 * Mai buida un nom que només és un sufix.
 * @param {string} text
 * @returns {string}
 */
export function normalitzaNom(text) {
  if (text == null) return '';
  const fitxes = String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’·]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  let canvi = true;
  while (canvi) {
    canvi = false;
    for (const n of [3, 2, 1]) {
      if (fitxes.length > n && SUFIXOS.has(fitxes.slice(-n).join(''))) {
        fitxes.splice(-n, n);
        canvi = true;
        break;
      }
    }
  }
  return fitxes.join(' ');
}

/**
 * Clau per a detectar duplicats: «<NIF normalitzat o nom normalitzat>|<NÚM>»,
 * amb el número sense espais i en majúscules.
 */
export function clauDuplicat(f) {
  const qui = normalitzaNif(f?.nif) || normalitzaNom(f?.contrapart);
  const num = String(f?.num ?? '').replace(/\s+/g, '').toUpperCase();
  return `${qui}|${num}`;
}

function esBuit(f, camp) {
  const valor = f?.[camp];
  if (camp === 'data') return !esDataValida(valor);
  if (CAMPS_IMPORT.has(camp)) return !Number.isSafeInteger(valor);
  return textNet(valor) === '';
}

const quadraAmb = (f, total) => Math.abs(total - f.total) <= TOLERANCIA_TOTAL;

/* subtotal + IVA = total (± 1 cèntim) o, si hi ha retenció d'IRPF, també
   subtotal + IVA − retenció = total. */
function ivaQuadra(f) {
  if (quadraAmb(f, f.subtotal + f.iva)) return true;
  const retencio = retencioDe(f);
  return retencio > 0 && quadraAmb(f, totalAmbRetencio(f, retencio));
}

/* Un tipus és habitual si el percentatge cau a 0,6 punts d'un dels coneguts o
   si l'IVA és, a 1 cèntim, el que donaria eixe tipus (imports xicotets). */
function tipusIvaHabitual(subtotal, iva) {
  const percentatge = (iva / subtotal) * 100;
  return TIPUS_IVA_HABITUALS.some((tipus) => Math.abs(percentatge - tipus) <= TOLERANCIA_IVA_PUNTS
    || Math.abs(iva - Math.round((subtotal * tipus) / 100)) <= 1);
}

/* Inusual i, a més, per damunt del 21 % general (amb la tolerància): sol ser
   la base i l'IVA llegits al revés. */
const tipusPerDamunt = (subtotal, iva) => !tipusIvaHabitual(subtotal, iva)
  && (iva / subtotal) * 100 > TIPUS_IVA_MAXIM + TOLERANCIA_IVA_PUNTS;

function missatgeMoneda(moneda) {
  const quina = moneda === MONEDA_DESCONEGUDA ? 'una moneda que no és l’euro' : moneda;
  return `Els imports d’esta factura són en ${quina}, i el full va en euros. Escriu-los en euros (l’import del càrrec al banc `
    + 'o el canvi oficial del dia de la factura, art. 79.Once de la Llei de l’IVA) i marca «Els imports ja són en euros».';
}

/* Percentatge amb un decimal com a molt i coma decimal: 15 → «15», 7,5 → «7,5». */
const percentatgeDe = (part, base) => String(Math.round((part / Math.abs(base)) * 1000) / 10).replace('.', ',');

function etiqueta(camp, tipus) {
  const etiquetes = {
    data: 'la data',
    num: 'el número de factura',
    contrapart: tipus === 'ingres' ? 'el client' : 'el proveïdor',
    nif: 'el NIF o CIF',
    subtotal: 'el subtotal (base imposable)',
    iva: "l'IVA",
    total: 'el total'
  };
  return etiquetes[camp];
}

/* Missatge de RETENCIO_IRPF: només imports, cap dada de la contrapart. */
function missatgeRetencio(f, retencio, ambImports) {
  const sobreBase = !esBuit(f, 'subtotal') && f.subtotal !== 0 ? ` (${percentatgeDe(retencio, f.subtotal)} % de la base)` : '';
  let total = '';
  if (ambImports && quadraAmb(f, totalAmbRetencio(f, retencio))) total = ' i el total ja la descompta';
  else if (ambImports && quadraAmb(f, f.subtotal + f.iva)) total = ' i el total no la descompta';
  return `La factura porta una retenció d'IRPF de ${formatImport(retencio)}${sobreBase}${total}. `
    + 'El full de la gestoria no té columna de retenció: cal decidir com es declara.';
}

/**
 * Revisa una factura i en torna les incidències: CAMP_BUIT (una per camp),
 * MONEDA_ESTRANGERA (alta: els imports no són en euros), IVA_INCOHERENT,
 * TIPUS_IVA_INUSUAL (baixa; alta si passa del 21 % general), NIF_INVALID,
 * FORA_TRIMESTRE (si es dona el rang del trimestre) i RETENCIO_IRPF
 * (informativa, si porta retenció).
 * @param {object} f Factura
 * @param {{ rang?: { inici: object, fi: object } }} [opcions]
 * @returns {Array<{ codi: string, severitat: string, missatge: string, camp?: string, fitxer?: string, facturaId?: string }>}
 */
export function validaFactura(f, { rang } = {}) {
  const incidencies = [];
  const base = {};
  if (f?.origen?.fitxer) base.fitxer = f.origen.fitxer;
  if (f?.id) base.facturaId = f.id;
  const afig = (codi, severitat, missatge, extra = {}) => incidencies.push({ codi, severitat, missatge, ...extra, ...base });
  const retencio = retencioDe(f);

  for (const camp of CAMPS_OBLIGATORIS) {
    if (esBuit(f, camp)) afig('CAMP_BUIT', 'mitjana', `Falta ${etiqueta(camp, f?.tipus)}.`, { camp });
  }
  if (enAltraMoneda(f)) afig('MONEDA_ESTRANGERA', 'alta', missatgeMoneda(f.moneda), { camp: 'moneda' });
  const ambImports = ['subtotal', 'iva', 'total'].every((camp) => !esBuit(f, camp));
  if (ambImports && !ivaQuadra(f)) {
    afig('IVA_INCOHERENT', 'alta', retencio > 0
      ? `Ni subtotal + IVA (${formatImport(f.subtotal + f.iva)}) ni descomptant-ne la retenció d'IRPF (${formatImport(totalAmbRetencio(f, retencio))}) quadren amb el total (${formatImport(f.total)}). Pot ser un error de lectura.`
      : `Subtotal + IVA (${formatImport(f.subtotal + f.iva)}) no quadra amb el total (${formatImport(f.total)}). Pot ser una retenció d'IRPF o un error de lectura.`);
  }
  if (!esBuit(f, 'subtotal') && !esBuit(f, 'iva') && f.subtotal !== 0 && !tipusIvaHabitual(f.subtotal, f.iva)) {
    const percentatge = ((f.iva / f.subtotal) * 100).toFixed(1).replace('.', ',');
    if (tipusPerDamunt(f.subtotal, f.iva)) {
      afig('TIPUS_IVA_INUSUAL', 'alta',
        `Tipus d'IVA del ${percentatge} %, per damunt del ${TIPUS_IVA_MAXIM} % general: revisa si s'han llegit la base i l'IVA al revés.`);
    } else afig('TIPUS_IVA_INUSUAL', 'baixa', `Tipus d'IVA inusual: ${percentatge} %.`);
  }
  if (!esBuit(f, 'nif')) {
    const { valid, tipus } = validaNif(f.nif);
    if (!valid) afig('NIF_INVALID', 'mitjana', `El NIF o CIF «${textNet(f.nif)}» no és vàlid (${tipus}).`);
  }
  if (rang && esDataValida(f?.data) && !dinsDeRang(f.data, rang)) {
    afig('FORA_TRIMESTRE', 'mitjana',
      `La data ${formatData(f.data)} cau fora del període (${formatData(rang.inici)} - ${formatData(rang.fi)}).`);
  }
  if (retencio > 0) afig('RETENCIO_IRPF', 'info', missatgeRetencio(f, retencio, ambImports), { camp: 'retencio' });
  return incidencies;
}

/**
 * 'completa' si té tots els camps, els imports són en euros, l'IVA quadra
 * (amb la retenció descomptada o sense) i no passa del 21 % general, el NIF
 * és vàlid i cap camp té confiança baixa; 'pendent' en qualsevol altre cas.
 */
export function estatFactura(f) {
  if (CAMPS_OBLIGATORIS.some((camp) => esBuit(f, camp))) return 'pendent';
  if (enAltraMoneda(f)) return 'pendent';
  if (!ivaQuadra(f)) return 'pendent';
  if (f.subtotal !== 0 && tipusPerDamunt(f.subtotal, f.iva)) return 'pendent';
  if (!validaNif(f.nif).valid) return 'pendent';
  if (Object.values(f.confianca ?? {}).includes('baixa')) return 'pendent';
  return 'completa';
}

/**
 * Còpia ordenada per data i, dins del mateix dia, per número (amb les xifres
 * com a números: «F-2» abans que «F-10»). Les factures sense data van al
 * final en els dos ordres. No toca la llista original.
 * @param {object[]} llista
 * @param {'asc'|'desc'} [ordre]
 */
export function ordenaFactures(llista, ordre = 'asc') {
  const signe = ordre === 'desc' ? -1 : 1;
  return [...(llista ?? [])].sort((x, y) => {
    const ambData = esDataValida(x?.data);
    if (ambData !== esDataValida(y?.data)) return ambData ? -1 : 1;
    const perData = ambData ? comparaDates(x.data, y.data) : 0;
    const perNum = COL.compare(String(x?.num ?? ''), String(y?.num ?? ''));
    if (perData || perNum) return signe * (perData || perNum);
    const [ix, iy] = [String(x?.id ?? ''), String(y?.id ?? '')];
    return ix < iy ? -1 : ix > iy ? 1 : 0;
  });
}

/**
 * Totals d'una llista de factures en cèntims. incomplet és cert si algun
 * import faltava (i, per tant, la suma no és la de totes).
 */
export function totals(llista) {
  const factures = llista ?? [];
  const [subtotal, iva, total] = ['subtotal', 'iva', 'total'].map((camp) => sumaImports(factures.map((f) => f?.[camp])));
  return {
    subtotal: subtotal.total,
    iva: iva.total,
    total: total.total,
    incomplet: subtotal.incomplet || iva.incomplet || total.incomplet
  };
}
