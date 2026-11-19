/** Exportació precomptable determinista. El JSON conté el llibre COMPLET;
 * el CSV selecciona el trimestre o l'any pel dia comptable de cada registre.
 * El manifest no és una signatura: cal conservar-ne l'empremta fora del
 * paquet per descobrir una substitució coherent de tots els fitxers.
 * No desa, no esborra ni envia dades; no acredita conformitat fiscal.
 */
import { aBytes, desdeUtf8, igualsBytes, jsonCanonic, sha256Hex, utf8 } from '../../tractors/nucli/canonic.js';
import { protegeixFormula, serialitzaCsv } from './csv.js';
import { formatData, rangTrimestre } from './dates.js';
import { copiaJsonIntegritat, verificaRegistreIntegritat } from './registreIntegritat.js';

export const SCHEMA_EXPORTACIO_INTEGRITAT = 'sdp.gestoria.exportacio-integritat.v1';
export const ABAST_EXPORTACIO_INTEGRITAT = 'llibre_complet_amb_seleccio_periode';
const TIPUS_JSON = 'application/json;charset=utf-8';
const TIPUS_CSV = 'text/csv;charset=utf-8';
const MAX_BYTES = 32 * 1024 * 1024;
const MAX_FITXERS = 16;
const MAX_BYTES_TOTALS = 64 * 1024 * 1024;
const error = (codi) => Object.assign(new TypeError(`Exportació d'integritat: ${codi}.`), { codi });
const claus = (v, noms) => v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).length === noms.length && noms.every((k) => Object.hasOwn(v, k));

export function periodeIntegritat(periode) {
  if (!periode || typeof periode !== 'object' || Array.isArray(periode)
    || Object.keys(periode).some((k) => !['any', 'trimestre'].includes(k))) throw error('PERIODE_INVALID');
  const { any, trimestre = null } = periode;
  if (!Number.isInteger(any) || any < 1000 || any > 9999 || (trimestre !== null && ![1, 2, 3, 4].includes(trimestre))) throw error('PERIODE_INVALID');
  const rang = trimestre === null ? { inici: { a: any, m: 1, d: 1 }, fi: { a: any, m: 12, d: 31 } } : rangTrimestre(any, trimestre);
  return copiaJsonIntegritat({ any, trimestre, inici: formatData(rang.inici, 'aaaa-mm-dd'), fi: formatData(rang.fi, 'aaaa-mm-dd') });
}

function fitxer(nom, tipus, dades) {
  const propis = aBytes(dades).slice();
  return Object.freeze({ nom, tipus, get dades() { return propis.slice(); } });
}

function copiaFitxer(f, disponibles = MAX_BYTES) {
  const nom = f?.nom;
  const tipus = f?.tipus;
  if (typeof nom !== 'string' || nom.length < 1 || nom.length > 240
    || /[\u0000-\u001f\u007f/\\]/.test(nom) || typeof tipus !== 'string' || tipus.length > 150) throw error('FITXER_INVALID');
  const bytes = aBytes(f.dades);
  if (bytes.byteLength > Math.min(MAX_BYTES, disponibles)) throw error('FITXER_MASSA_GRAN');
  return fitxer(nom, tipus, bytes);
}

function copiaFitxers(llista) {
  if (!Array.isArray(llista) || llista.length > MAX_FITXERS) throw error('LIMIT_FITXERS');
  let bytes = 0;
  return llista.map((f) => {
    const copia = copiaFitxer(f, MAX_BYTES_TOTALS - bytes);
    bytes += copia.dades.byteLength;
    return copia;
  });
}

function csvDelLlibre(registres) {
  const files = [['Ordre', 'Identificador', 'Tipus', 'Data comptable', 'Instant UTC (buit si desconegut)', 'JSON complet', 'hash_anterior', 'hash_actual']];
  for (const r of registres) files.push([r.ordre, ...[r.id, r.tipus, r.data, r.instant ?? '', jsonCanonic(r.dades), r.hash_anterior ?? '', r.hash_actual].map(protegeixFormula)]);
  return utf8(serialitzaCsv(files, { delimitador: ';' }));
}

const selecciona = (llibre, periode) => llibre.filter((r) => r.data >= periode.inici && r.data <= periode.fi);

/** Cada adjunt queda inclòs al manifest pels bytes que realment es lliuren.
 * Les empremtes conegudes i les àncores es reben del canal de confiança del
 * consumidor, mai es prenen com a autoritat del mateix paquet importat. */
export async function generaExportacioIntegritat({ registres, periode, adjunts = [], ancora = null, subtle } = {}) {
  const llibre = copiaJsonIntegritat(registres);
  const p = periodeIntegritat(copiaJsonIntegritat(periode));
  if (!Array.isArray(adjunts) || adjunts.length > MAX_FITXERS - 3) throw error('ADJUNTS_INVALIDS');
  const annexos = copiaFitxers(adjunts);
  const comprovacio = await verificaRegistreIntegritat(llibre, { ancora, subtle });
  if (!comprovacio.valida) throw error('CADENA_INVALIDA');
  const seleccio = selecciona(llibre, p);
  const base = `gestoria-integritat-${p.any}${p.trimestre === null ? '' : `-${p.trimestre}t`}`;
  const json = fitxer(`${base}.json`, TIPUS_JSON, utf8(jsonCanonic({
    schema: SCHEMA_EXPORTACIO_INTEGRITAT, abast: ABAST_EXPORTACIO_INTEGRITAT, periode: p,
    registres: llibre, seleccio: seleccio.map((r) => r.ordre)
  })));
  const csv = fitxer(`${base}.csv`, TIPUS_CSV, csvDelLlibre(seleccio));
  const nomManifest = `${base}.manifest.json`;
  const fitxers = [csv, json, ...annexos].sort((a, b) => a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0);
  if (new Set([...fitxers.map((f) => f.nom), nomManifest]).size !== fitxers.length + 1) throw error('NOM_DUPLICAT');
  const sumes = await Promise.all(fitxers.map(async (f) => ({ nom: f.nom, tipus: f.tipus, bytes: f.dades.byteLength, sha256: await sha256Hex(f.dades, subtle) })));
  const manifest = fitxer(nomManifest, TIPUS_JSON, utf8(jsonCanonic({
    schema: SCHEMA_EXPORTACIO_INTEGRITAT, abast: ABAST_EXPORTACIO_INTEGRITAT, periode: p,
    registres: llibre.length, seleccionats: seleccio.length, ultima: comprovacio.ultima, fitxers: sumes
  })));
  if ([...fitxers, manifest].reduce((n, f) => n + f.dades.byteLength, 0) > MAX_BYTES_TOTALS) throw error('FITXER_MASSA_GRAN');
  return Object.freeze({ csv, json, manifest, adjunts: Object.freeze(annexos), empremtaManifest: await sha256Hex(manifest.dades, subtle) });
}

function lligJson(fitxerJson) {
  const bytes = fitxerJson.dades;
  if (bytes.byteLength > MAX_BYTES) throw error('FITXER_MASSA_GRAN');
  const text = desdeUtf8(bytes);
  const valor = JSON.parse(text);
  if (text !== jsonCanonic(valor)) throw error('JSON_NO_CANONIC');
  return valor;
}

/** Informe determinista: fitxers extra, absents, retocats o CSV incoherent
 * no passen encara que algú haja actualitzat la seua suma al manifest. */
export async function validaExportacioIntegritat(paquet, { ancora = null, empremtaManifest = null, periode = null, subtle } = {}) {
  try {
    if (!Array.isArray(paquet?.adjunts) || paquet.adjunts.length > MAX_FITXERS - 3) throw error('ADJUNTS_INVALIDS');
    const [csv, json, manifest, ...adjunts] = copiaFitxers([paquet.csv, paquet.json, paquet.manifest, ...paquet.adjunts]);
    const dada = lligJson(json);
    if (!claus(dada, ['schema', 'abast', 'periode', 'registres', 'seleccio']) || dada.schema !== SCHEMA_EXPORTACIO_INTEGRITAT
      || dada.abast !== ABAST_EXPORTACIO_INTEGRITAT || !claus(dada.periode, ['any', 'trimestre', 'inici', 'fi'])) throw error('JSON_INVALID');
    const p = periodeIntegritat({ any: dada.periode.any, trimestre: dada.periode.trimestre });
    if (periode !== null && jsonCanonic(p) !== jsonCanonic(periodeIntegritat(periode))) throw error('PERIODE_INESPERAT');
    const esperat = await generaExportacioIntegritat({ registres: dada.registres, periode: { any: p.any, trimestre: p.trimestre }, adjunts, ancora, subtle });
    for (const [actual, correcte] of [[csv, esperat.csv], [json, esperat.json], [manifest, esperat.manifest]]) {
      if (actual.nom !== correcte.nom || actual.tipus !== correcte.tipus || !igualsBytes(actual.dades, correcte.dades)) throw error('FITXER_INCOHERENT');
    }
    if (empremtaManifest !== null && (typeof empremtaManifest !== 'string' || !/^[0-9a-f]{64}$/.test(empremtaManifest)
      || esperat.empremtaManifest !== empremtaManifest)) throw error('MANIFEST_ALTERAT');
    return Object.freeze({ valida: true, codi: null });
  } catch (e) {
    return Object.freeze({ valida: false, codi: e?.codi ?? 'PAQUET_INVALID' });
  }
}
