/**
 * Registre local precomptable: JSON complet encadenat, sense DOM ni xarxa.
 * No és la huella fiscal de l'AEAT ni acredita conformitat Veri*Factu.
 * Detecta retocs i enllaços trencats; una àncora conservada fora del llibre
 * detecta també truncaments i reescriptures. Qui controle llibre i àncora
 * pot refer tota la cadena. No hi ha signatura, remissió ni persistència.
 * `data` és el dia comptable; `instant: null` vol dir hora desconeguda.
 */
import { jsonCanonic, sha256Hex } from '../../tractors/nucli/canonic.js';
import { formatData, parseData } from './dates.js';

export const SCHEMA_INTEGRITAT = 'sdp.gestoria.integritat.v1';
export const TIPUS_REGISTRE_INTEGRITAT = Object.freeze(['esborrany', 'tiquet', 'assentament']);
/* Límits abans de copiar/serialitzar. Afegir verifica tot el llibre: O(n)
   per operació, fins a 10.000 registres; no és una ingesta massiva en lot. */
export const LIMITS_INTEGRITAT = Object.freeze({ profunditat: 32, nodes: 200_000, bytes: 16 * 1024 * 1024, cadena: 1024 * 1024, registres: 10_000 });
const HASH = /^[0-9a-f]{64}$/;
const CAMPS = ['schema', 'ordre', 'id', 'tipus', 'data', 'instant', 'dades', 'hash_anterior', 'hash_actual'];
const codificador = new TextEncoder();

const error = (codi) => Object.assign(new TypeError(`Registre d'integritat: ${codi}.`), { codi });
const congela = (v) => {
  if (v && typeof v === 'object') { Object.values(v).forEach(congela); Object.freeze(v); }
  return v;
};

/* JSON de dades, mai getters, símbols ni propietats que el JSON amagaria.
   La instantània es pren abans del primer await: no hi ha canvi de dades
   entre el que es verifica i el que es torna. */
function comprovaJson(valor) {
  const pendents = [{ valor, profunditat: 0 }];
  const ancestres = new Set();
  let nodes = 0;
  let bytes = 0;
  const comptaText = (text) => {
    if (text.length > LIMITS_INTEGRITAT.cadena) throw error('LIMIT_CADENA');
    const mida = codificador.encode(JSON.stringify(text)).byteLength;
    if (mida > LIMITS_INTEGRITAT.cadena) throw error('LIMIT_CADENA');
    bytes += mida;
  };
  while (pendents.length) {
    const item = pendents.pop();
    const v = item.valor;
    if (item.eixida) { ancestres.delete(v); continue; }
    if (++nodes > LIMITS_INTEGRITAT.nodes) throw error('LIMIT_NODES');
    if (item.profunditat > LIMITS_INTEGRITAT.profunditat) throw error('LIMIT_PROFUNDITAT');
    if (typeof v === 'string') comptaText(v);
    else if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) bytes += String(v).length;
    else if (typeof v === 'object') {
      if (ancestres.has(v)) throw error('JSON_INVALID');
      const array = Array.isArray(v);
      const proto = Object.getPrototypeOf(v);
      if (!array && proto !== null && Object.getPrototypeOf(proto) !== null) throw error('JSON_INVALID');
      if (array && v.length > LIMITS_INTEGRITAT.nodes) throw error('LIMIT_NODES');
      const claus = Reflect.ownKeys(v);
      if (claus.length > LIMITS_INTEGRITAT.nodes) throw error('LIMIT_NODES');
      if (array && claus.length !== v.length + 1) throw error('JSON_INVALID');
      ancestres.add(v);
      pendents.push({ valor: v, eixida: true });
      bytes += 2;
      for (const k of claus) {
        if (array && k === 'length') continue;
        const d = Object.getOwnPropertyDescriptor(v, k);
        if (typeof k !== 'string' || !d.enumerable || !('value' in d)
          || (array && (!/^\d+$/.test(k) || String(Number(k)) !== k || Number(k) >= v.length))) throw error('JSON_INVALID');
        if (!array) { comptaText(k); bytes++; }
        bytes++;
        if (nodes + pendents.length >= LIMITS_INTEGRITAT.nodes) throw error('LIMIT_NODES');
        pendents.push({ valor: d.value, profunditat: item.profunditat + 1 });
      }
    } else throw error('JSON_INVALID');
    if (bytes > LIMITS_INTEGRITAT.bytes) throw error('LIMIT_BYTES');
  }
}

export function copiaJsonIntegritat(valor) {
  comprovaJson(valor);
  return congela(JSON.parse(jsonCanonic(valor)));
}

const clausExactes = (v, camps) => v && !Array.isArray(v) && typeof v === 'object'
  && Object.keys(v).length === camps.length && camps.every((k) => Object.hasOwn(v, k));
const esHash = (v) => typeof v === 'string' && HASH.test(v);
const esInstant = (v) => v === null || (typeof v === 'string' && v.length === 24
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v);
const esId = (v) => typeof v === 'string' && v.trim() === v && v.length > 0 && v.length <= 200;
const esDataIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && formatData(parseData(v), 'aaaa-mm-dd') === v;
const esEvent = (v) => clausExactes(v, ['id', 'tipus', 'data', 'instant', 'dades']) && esId(v.id)
  && TIPUS_REGISTRE_INTEGRITAT.includes(v.tipus) && esDataIso(v.data) && esInstant(v.instant);
const esRegistre = (v) => clausExactes(v, CAMPS) && v.schema === SCHEMA_INTEGRITAT
  && Number.isSafeInteger(v.ordre) && v.ordre > 0
  && esEvent({ id: v.id, tipus: v.tipus, data: v.data, instant: v.instant, dades: v.dades })
  && (v.hash_anterior === null || esHash(v.hash_anterior)) && esHash(v.hash_actual);
const cos = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'hash_actual'));

/** Verifica el llibre sencer en ordre d'addició; l'àncora és {ordre, hash_actual}. */
export async function verificaRegistreIntegritat(registres, { ancora = null, subtle } = {}) {
  let llibre;
  try {
    if (Array.isArray(registres) && registres.length > LIMITS_INTEGRITAT.registres) throw error('LIMIT_REGISTRES');
    llibre = copiaJsonIntegritat(registres);
  } catch (e) { return congela({ valida: false, incidencies: [{ codi: e?.codi ?? 'JSON_INVALID', posicio: null }], total: 0, ultima: null }); }
  if (!Array.isArray(llibre)) throw error('LLIBRE_INVALID');
  const a = ancora === null ? null : copiaJsonIntegritat(ancora);
  if (a !== null && (!clausExactes(a, ['ordre', 'hash_actual']) || !Number.isSafeInteger(a.ordre) || a.ordre < 1 || !esHash(a.hash_actual))) throw error('ANCORA_INVALIDA');
  const incidencies = [];
  const afig = (codi, posicio) => incidencies.push({ codi, posicio });
  let anterior = null;
  let instant = null;
  for (const [i, r] of llibre.entries()) {
    if (!esRegistre(r)) { afig('REGISTRE_INVALID', i); continue; }
    if (r.ordre !== i + 1) afig('ORDRE_INVALID', i);
    if (r.hash_anterior !== anterior) afig('ENLLAC_TRENCAT', i);
    if (await sha256Hex(jsonCanonic(cos(r)), subtle) !== r.hash_actual) afig('HASH_ALTERAT', i);
    if (r.instant !== null) {
      if (instant !== null && r.instant < instant) afig('TEMPS_ENRERE', i);
      instant = r.instant;
    }
    anterior = r.hash_actual;
  }
  if (a && !llibre.some((r) => r?.ordre === a.ordre && r?.hash_actual === a.hash_actual)) afig('ANCORA_ABSENT', null);
  const ultim = llibre.at(-1);
  return congela({ valida: incidencies.length === 0, incidencies, total: llibre.length,
    ultima: esRegistre(ultim) ? { ordre: ultim.ordre, hash_actual: ultim.hash_actual } : null });
}

/** Retorna un llibre nou: mai modifica l'anterior. hashEsperat és obligatori
 * (null per al primer). Si es desa, el consumidor ha de fer el CAS dins de
 * la mateixa transacció de persistència; esta funció no simula un magatzem. */
export async function afegixRegistreIntegritat(registres, event, { hashEsperat, ancora = null, subtle } = {}) {
  if (Array.isArray(registres) && registres.length >= LIMITS_INTEGRITAT.registres) throw error('LIMIT_REGISTRES');
  const llibre = copiaJsonIntegritat(registres);
  const entrada = copiaJsonIntegritat(event);
  if (!Array.isArray(llibre) || !esEvent(entrada)) throw error('ENTRADA_INVALIDA');
  if (hashEsperat !== null && !esHash(hashEsperat)) throw error('CAS_OBLIGATORI');
  if ((llibre.at(-1)?.hash_actual ?? null) !== hashEsperat) throw error('CADENA_CANVIADA');
  if (!(await verificaRegistreIntegritat(llibre, { ancora, subtle })).valida) throw error('CADENA_INVALIDA');
  const ultimInstant = [...llibre].reverse().find((r) => r.instant !== null)?.instant;
  if (entrada.instant !== null && ultimInstant && entrada.instant < ultimInstant) throw error('TEMPS_ENRERE');
  const nou = { schema: SCHEMA_INTEGRITAT, ordre: llibre.length + 1, ...entrada, hash_anterior: hashEsperat };
  const hash_actual = await sha256Hex(jsonCanonic(nou), subtle);
  return congela([...llibre, { ...nou, hash_actual }]);
}
