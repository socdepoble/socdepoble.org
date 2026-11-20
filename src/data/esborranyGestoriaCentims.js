/** R32.16 · Preparació de números per a una gestoria humana.
 * No calcula tipus fiscals ni emet factures/Verifactu: suma únicament els
 * imports explícits aportats. Diners BigInt; eixida decimal en cèntims.
 * SHA-256 acredita integritat dels bytes, no autoria ni completitud fiscal.
 */
import { canonitzaJsonJcs, sha256Hex } from './federacio/portabilitatFediversity.js';

export const AVIS_GESTORIA_CENTIMS = 'Esborrany preparatori per a revisió per gestoria humana — No Verifactu';
const MAX_CENTIMS = 10n ** 30n - 1n;
const MAX_FILES = 100_000;
const CAMPS_IMPORT = ['baseCentims', 'ivaCentims', 'retencioCentims', 'totalCentims'];
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const congela = x => { if (x && typeof x === 'object') { for (const v of Object.values(x)) congela(v); Object.freeze(x); } return x; };

function registre(v, camps) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) throw new TypeError('Cal un registre pla.');
  for (const k of Reflect.ownKeys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (typeof k !== 'string' || !camps.includes(k) || !Object.hasOwn(d, 'value') || !d.enumerable) throw new TypeError('Camp desconegut o accessor.');
  }
  return v;
}
function llista(v) {
  if (!Array.isArray(v) || Object.getPrototypeOf(v) !== Array.prototype || Reflect.ownKeys(v).some(k => typeof k !== 'string' || (k !== 'length' && !/^(?:0|[1-9][0-9]*)$/.test(k))) || v.length > MAX_FILES) throw new TypeError('Cal una llista acotada d’operacions.');
  for (let i = 0; i < v.length; i++) if (!Object.hasOwn(Object.getOwnPropertyDescriptor(v, String(i)) ?? {}, 'value')) throw new TypeError('La llista ha de ser densa i sense accessors.');
  return v;
}
function text(v, camp, maxim = 200, buit = false) {
  if (typeof v !== 'string' || (!buit && !v.trim()) || v.length > maxim || v !== v.normalize('NFC') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(v)) throw new TypeError(`${camp}: text no canònic.`);
  return v;
}
function centims(v, camp) {
  let n;
  if (typeof v === 'bigint') n = v;
  else if (Number.isSafeInteger(v) && !Object.is(v, -0)) n = BigInt(v);
  else if (typeof v === 'string' && v.length <= 31 && /^(?:0|-?[1-9][0-9]{0,29})$/.test(v)) n = BigInt(v);
  else throw new TypeError(`${camp}: calen cèntims enters exactes.`);
  if (n < -MAX_CENTIMS || n > MAX_CENTIMS) throw new RangeError(`${camp}: import fora de rang.`);
  return n;
}
function dataCivil(v) {
  if (typeof v !== 'string' || !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(v)) throw new TypeError('Data civil YYYY-MM-DD obligatòria.');
  const a = Number(v.slice(0, 4)), m = Number(v.slice(5, 7)), d = Number(v.slice(8, 10));
  const dies = [31, a % 4 === 0 && (a % 100 !== 0 || a % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m < 1 || m > 12 || d < 1 || d > dies[m - 1]) throw new RangeError('Data civil impossible.');
  return v;
}
function normalitza(v) {
  registre(v, ['id', 'data', 'tipus', 'concepte', ...CAMPS_IMPORT]);
  const id = text(v.id, 'id'), data = dataCivil(v.data);
  if (!['ingres', 'despesa'].includes(v.tipus)) throw new TypeError('Tipus: ingres o despesa.');
  const base = centims(v.baseCentims, 'baseCentims'), iva = centims(v.ivaCentims, 'ivaCentims'), retencio = centims(v.retencioCentims, 'retencioCentims');
  const signes = [base, iva, retencio].filter(n => n !== 0n).map(n => n < 0n);
  if (signes.some(s => s !== signes[0])) throw new RangeError('Rectificació amb signes incoherents.');
  const total = base + iva - retencio;
  if (total < -MAX_CENTIMS || total > MAX_CENTIMS) throw new RangeError('Total de línia fora de rang.');
  if (v.totalCentims !== undefined && centims(v.totalCentims, 'totalCentims') !== total) throw new RangeError('La línia no quadra: base + IVA − retenció !== total.');
  return { id, data, tipus: v.tipus, concepte: text(v.concepte ?? '', 'concepte', 1000, true), baseCentims: String(base), ivaCentims: String(iva), retencioCentims: String(retencio), totalCentims: String(total) };
}
const buit = () => Object.fromEntries(CAMPS_IMPORT.map(k => [k, 0n]));
const cadena = r => Object.fromEntries(CAMPS_IMPORT.map(k => [k, String(r[k])]));
function totals(files) {
  const ingressos = buit(), despeses = buit();
  for (const f of files) for (const k of CAMPS_IMPORT) (f.tipus === 'ingres' ? ingressos : despeses)[k] += BigInt(f[k]);
  const saldo = Object.fromEntries(CAMPS_IMPORT.map(k => [k, ingressos[k] - despeses[k]]));
  for (const grup of [ingressos, despeses, saldo]) if (grup.baseCentims + grup.ivaCentims - grup.retencioCentims !== grup.totalCentims) throw new Error('Quadratura interna fallida.');
  return { ingressos: cadena(ingressos), despeses: cadena(despeses), saldo: cadena(saldo) };
}
const trimestreDe = data => Math.floor((Number(data.slice(5, 7)) - 1) / 3) + 1;

/** Any complet o un trimestre natural. Es validen també les files excloses;
 * cap malformació ni id repetit s’amaga sota el filtre de període.
 * Els zeros descriuen les files aportades, mai una cobertura completa.
 */
export function resumGestoriaCentims(entrada) {
  registre(entrada, ['any', 'trimestre', 'operacions']);
  const { any, trimestre = null, operacions = [] } = entrada;
  if (!Number.isInteger(any) || any < 1000 || any > 9999) throw new RangeError('Any de quatre xifres obligatori.');
  if (trimestre !== null && (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 4)) throw new RangeError('Trimestre d’1 a 4.');
  const totes = Array.from(llista(operacions), normalitza), ids = new Set();
  for (const f of totes) { if (ids.has(f.id)) throw new RangeError('Identificador d’operació duplicat.'); ids.add(f.id); }
  const detall = totes.filter(f => f.data.startsWith(`${any}-`) && (trimestre === null || trimestreDe(f.data) === trimestre));
  detall.sort((a, b) => cmp(a.data, b.data) || cmp(a.id, b.id));
  const trimestres = (trimestre === null ? [1, 2, 3, 4] : [trimestre]).map(t => {
    const files = detall.filter(f => trimestreDe(f.data) === t);
    return { periode: `${any}-T${t}`, operacions: files.length, totals: totals(files) };
  });
  const total = totals(detall);
  for (const grup of ['ingressos', 'despeses', 'saldo']) for (const k of CAMPS_IMPORT) {
    const suma = trimestres.reduce((n, t) => n + BigInt(t.totals[grup][k]), 0n);
    if (suma !== BigInt(total[grup][k])) throw new Error('Quadratura dels trimestres fallida.');
  }
  return congela({ esquema: 'sdp.gestoria.esborrany-centims.v1', estat: 'esborrany-preparatori', verifactu: false,
    avis: AVIS_GESTORIA_CENTIMS, cobertura: 'Només les operacions aportades; revisió humana i completitud pendents.',
    moneda: 'EUR', unitat: 'centims-enters-en-cadenes', any, trimestre, periode: trimestre === null ? String(any) : `${any}-T${trimestre}`,
    exclososForaPeriode: totes.length - detall.length, operacions: detall.length, detall, trimestres, total,
    quadratura: { sumaLiniesIgualTotal: true, sumaTrimestresIgualTotal: true } });
}

// Tots els textos van entre cometes RFC4180 i sense fórmules de full de càlcul.
// Els imports enters validats es mantenen numèrics, també en negatiu.
function cela(v, numeric = false) {
  let s = String(v);
  if (!numeric && /^[\s]*[=+\-@]/u.test(s)) s = `'${s}`;
  return `"${s.split('"').join('""')}"`;
}
function csvDelResum(r) {
  const cap = ['esquema', 'estat', 'verifactu', 'avis', 'moneda', 'unitat', 'periode', 'tipusFila', 'id', 'data', 'tipus', 'concepte', ...CAMPS_IMPORT];
  const prefix = periode => [r.esquema, r.estat, 'false', r.avis, r.moneda, r.unitat, periode];
  const files = r.detall.map(f => [...prefix(r.periode), 'linia', f.id, f.data, f.tipus, f.concepte, ...CAMPS_IMPORT.map(k => f[k])]);
  const agregats = r.trimestre === null ? [...r.trimestres, { periode: r.periode, totals: r.total }] : [{ periode: r.periode, totals: r.total }];
  for (const t of agregats) for (const grup of ['ingressos', 'despeses', 'saldo']) {
    files.push([...prefix(t.periode), 'resum', '', '', grup, '', ...CAMPS_IMPORT.map(k => t.totals[grup][k])]);
  }
  return cap.map(v => cela(v)).join(';') + '\r\n' + files.map(f => f.map((v, i) => cela(v, i >= 12)).join(';') + '\r\n').join('');
}

/** JSON JCS + LF i CSV UTF-8 CRLF; cada hash cobreix els bytes exactes. */
export function exportaGestoriaCentims(entrada) {
  const resum = resumGestoriaCentims(entrada), json = canonitzaJsonJcs(resum) + '\n', csv = csvDelResum(resum);
  return congela({ resum, json, csv, empremtes: { algorisme: 'SHA-256', json: sha256Hex(json), csv: sha256Hex(csv) } });
}

/** Verifica els bytes d’un export propi. No és signatura d’autoria ni una
 * validació de dades fiscals d’un tercer que torne a calcular els hashes.
 */
export function verificaEmpremtesGestoriaCentims(paquet) {
  registre(paquet, ['resum', 'json', 'csv', 'empremtes']);
  registre(paquet.empremtes, ['algorisme', 'json', 'csv']);
  if (typeof paquet.json !== 'string' || typeof paquet.csv !== 'string' || paquet.json.length > 100_000_000 || paquet.csv.length > 100_000_000) return false;
  return paquet.empremtes.algorisme === 'SHA-256' && paquet.empremtes.json === sha256Hex(paquet.json) && paquet.empremtes.csv === sha256Hex(paquet.csv);
}
