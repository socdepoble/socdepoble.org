/**
 * R32.5 · Resum anual per a una gestoria humana. JS pur, sense efectes.
 *
 * Rep les operacions de historic/nucli/operacions.js, també amb imports BigInt
 * o cadenes decimals enteres. NO transforma moviments bancaris en factures ni
 * decidix deduïbilitat: exigix els imports i els dos indicadors explícits.
 * Les devolucions/rectificacions duen base, IVA i retenció amb signe negatiu.
 * Com simulacio.js, el cost deduïble inclou l'IVA que no es deduïx en IVA.
 * En ISP, l'IVA autoliquidat forma part del repercutit i del suportat: els
 * camps autoliquidat són un desglossament, no un import addicional.
 *
 * Totes les sumes usen BigInt. En el model exportable els cèntims són cadenes
 * decimals: JSON no representa BigInt i un Number podria perdre precisió.
 * No hi ha rellotge, identificadors aleatoris ni ordenació dependent de locale.
 * Cap tipus fiscal, liquidació, presentació ni certificació Verifactu.
 */
import { serialitzaCsv } from '../../nucli/csv.js';
import { esDataValida, formatData, trimestreDe } from '../../nucli/dates.js';

export const AVIS_RESUM_ANUAL_GESTORIA = "Esborrany d'autoorganització per a revisió per gestoria humana — No Verifactu";

export const CAMPS_RESUM_ANUAL_GESTORIA = Object.freeze([
  'ingressos', 'despesesDeduibles', 'despesesNoDeduibles',
  'baseIvaRepercutit', 'ivaRepercutit', 'baseIvaSuportat', 'ivaSuportat',
  'baseIvaSuportatDeduible', 'ivaSuportatDeduible', 'baseIvaAutoliquidat', 'ivaAutoliquidat',
  'retencionsIrpfSuportades', 'retencionsIrpfPracticades'
]);

const TRACTAMENTS = Object.freeze(['interior', 'exempt', 'sense-iva', 'isp-intracomunitari', 'isp-extracomunitari']);
const ORIGENS = Object.freeze(['banc', 'factura', 'manual']);
const esIsp = (tractament) => tractament === 'isp-intracomunitari' || tractament === 'isp-extracomunitari';
const comparaText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const buit = () => Object.fromEntries(CAMPS_RESUM_ANUAL_GESTORIA.map((camp) => [camp, 0n]));
const exportable = (totals) => Object.freeze(Object.fromEntries(CAMPS_RESUM_ANUAL_GESTORIA.map((camp) => [camp, String(totals[camp])])));

function centims(valor, camp, index) {
  if (typeof valor === 'bigint') return valor;
  if (Number.isSafeInteger(valor)) return BigInt(valor);
  if (typeof valor === 'string' && /^-?(?:0|[1-9]\d*)$/.test(valor)) return BigInt(valor);
  throw new TypeError(`Operació ${index + 1}: ${camp} ha de ser cèntims enters exactes.`);
}

function normalitza(op, index) {
  if (!op || !esDataValida(op.data) || !['ingres', 'despesa'].includes(op.tipus)) {
    throw new TypeError(`Operació ${index + 1}: data o tipus invàlid.`);
  }
  if (!TRACTAMENTS.includes(op.tractament) || (op.tipus === 'ingres' && esIsp(op.tractament))) {
    throw new TypeError(`Operació ${index + 1}: tractament d'IVA invàlid.`);
  }
  if (typeof op.deduibleIva !== 'boolean' || typeof op.deduibleIrpf !== 'boolean') {
    throw new TypeError(`Operació ${index + 1}: cal indicar la deduïbilitat explícitament.`);
  }
  const base = centims(op.base, 'base', index);
  const iva = centims(op.iva, 'iva', index);
  const retencio = centims(op.retencio, 'retencio', index);
  if ((base >= 0n && (iva < 0n || retencio < 0n)) || (base < 0n && (iva > 0n || retencio > 0n))) {
    throw new RangeError(`Operació ${index + 1}: signes incoherents amb la base.`);
  }
  if (['exempt', 'sense-iva'].includes(op.tractament) && (iva !== 0n || op.deduibleIva)) {
    throw new RangeError(`Operació ${index + 1}: una operació sense IVA no pot aportar IVA deduïble.`);
  }
  if (op.id != null && (typeof op.id !== 'string' || !op.id.trim() || op.id.length > 200)) {
    throw new TypeError(`Operació ${index + 1}: identificador invàlid.`);
  }
  if (op.origen != null && !ORIGENS.includes(op.origen)) throw new TypeError(`Operació ${index + 1}: origen invàlid.`);
  return Object.freeze({
    id: op.id ?? null, data: formatData(op.data, 'aaaa-mm-dd'), trimestre: `T${trimestreDe(op.data)}`,
    tipus: op.tipus, tractament: op.tractament, origen: op.origen ?? 'manual',
    base: String(base), iva: String(iva), retencio: String(retencio),
    deduibleIva: op.deduibleIva, deduibleIrpf: op.deduibleIrpf
  });
}

function acumula(totals, op) {
  const base = BigInt(op.base);
  const iva = BigInt(op.iva);
  const retencio = BigInt(op.retencio);
  if (op.tipus === 'ingres') {
    totals.ingressos += base;
    totals.retencionsIrpfSuportades += retencio;
    if (op.tractament === 'interior') {
      totals.baseIvaRepercutit += base;
      totals.ivaRepercutit += iva;
    }
  } else {
    const cost = base + (op.deduibleIva ? 0n : iva);
    totals[op.deduibleIrpf ? 'despesesDeduibles' : 'despesesNoDeduibles'] += cost;
    totals.retencionsIrpfPracticades += retencio;
    if (op.tractament === 'interior' || esIsp(op.tractament)) {
      totals.baseIvaSuportat += base;
      totals.ivaSuportat += iva;
      if (op.deduibleIva) {
        totals.baseIvaSuportatDeduible += base;
        totals.ivaSuportatDeduible += iva;
      }
    }
    if (esIsp(op.tractament)) {
      totals.baseIvaAutoliquidat += base;
      totals.ivaAutoliquidat += iva;
      totals.baseIvaRepercutit += base;
      totals.ivaRepercutit += iva;
    }
  }
}

/**
 * Model estable amb T1..T4, total anual i operacions desglossades en cèntims.
 * Valida també les operacions d'altres anys, i declara quantes se n'exclouen.
 * No elimina silenciosament files incorrectes ni duplica un id del mateix any.
 * El zero d'un trimestre buit descriu l'entrada; no certifica cobertura anual.
 */
export function resumAnualGestoria({ any, operacions = [] } = {}) {
  if (!Number.isInteger(any) || any < 1000 || any > 9999) throw new RangeError('Cal un any de quatre xifres.');
  if (!Array.isArray(operacions)) throw new TypeError('Cal una llista d’operacions.');
  const totes = Array.from(operacions, normalitza);
  const detall = totes.filter((op) => op.data.startsWith(`${any}-`));
  const ids = new Set();
  for (const op of detall) {
    if (op.id === null) continue;
    if (ids.has(op.id)) throw new RangeError(`Identificador d'operació duplicat: ${op.id}`);
    ids.add(op.id);
  }
  detall.sort((a, b) => comparaText(a.data, b.data) || comparaText(JSON.stringify(a), JSON.stringify(b)));
  const anual = buit();
  const trimestres = [1, 2, 3, 4].map((t) => {
    const periode = `T${t}`;
    const files = detall.filter((op) => op.trimestre === periode);
    const totals = buit();
    for (const op of files) acumula(totals, op);
    for (const camp of CAMPS_RESUM_ANUAL_GESTORIA) anual[camp] += totals[camp];
    return Object.freeze({ periode, operacions: files.length, totals: exportable(totals) });
  });
  return Object.freeze({
    esquema: 'sdp.gestoria.resum-anual.v1', any, moneda: 'EUR', unitat: 'centims-enters-en-cadenes',
    avis: AVIS_RESUM_ANUAL_GESTORIA,
    cobertura: 'Només les operacions aportades; revisió i completitud pendents de gestoria humana.',
    notaIva: "L'IVA autoliquidat és un desglossament del repercutit i del suportat; no s'ha de sumar una segona vegada.",
    exclososAltresAnys: totes.length - detall.length,
    trimestres: Object.freeze(trimestres),
    anual: Object.freeze({ periode: 'ANUAL', operacions: detall.length, totals: exportable(anual) }),
    detall: Object.freeze(detall)
  });
}

/** CSV: cinc files T1..T4/ANUAL, imports en cèntims i avís en cada fila. */
export function exportaResumAnualGestoria(entrada) {
  const resum = resumAnualGestoria(entrada);
  const capcalera = ['Any', 'Període', 'Moneda', 'Unitat', 'Operacions', ...CAMPS_RESUM_ANUAL_GESTORIA, 'Avís'];
  const files = [...resum.trimestres, resum.anual].map((fila) => [
    resum.any, fila.periode, resum.moneda, 'cèntims enters', fila.operacions,
    ...CAMPS_RESUM_ANUAL_GESTORIA.map((camp) => fila.totals[camp]), resum.avis
  ]);
  return Object.freeze({ resum, json: `${JSON.stringify(resum, null, 2)}\n`, csv: serialitzaCsv([capcalera, ...files], { delimitador: ';' }) });
}
