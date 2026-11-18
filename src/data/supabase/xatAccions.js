/** R32.7 · Port d'interaccions. Cap fallback ací; absència SQL estructurada. */
import { rpc } from './runtime.js';
import { capturaSessio, jwtPerBackend, usuariDeSessio } from '../identitat.js';
import { backendScope } from '../../config/backendConfig.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = () => Object.assign(new Error('El missatge o l’acció no són vàlids.'), { code: 'XAT_ACCIO_INVALIDA' });
const absent = (cause) => Object.assign(new Error('Este servidor encara no té les accions del xat.'), { code: 'XAT_ACCIONS_SQL_ABSENT', cause });
const primera = (v) => Array.isArray(v) ? v[0] : v;
const TAULES_ACCIONS = new Set(['xat_reaccions', 'xat_missatges_destacats', 'xat_missatges_fixats', 'xat_missatges_amagats']);
function esAbsenciaSql(error, nom, code) {
  if (['PGRST202', 'PGRST205'].includes(code)) return true;
  if (!['42883', '42P01'].includes(code)) return false;
  const textos = [];
  if (typeof error?.message === 'string' && error.message.length <= 65536) {
    // runtime.js preserva el codi estructurat i el cos JSON dins d'ErrorSupabase.
    const cos = /^Supabase \d{3}:\s*(\{[\s\S]*\})$/.exec(error.message)?.[1];
    if (cos) {
      try {
        const detall = JSON.parse(cos);
        textos.push(detall?.message, detall?.details);
      } catch { /* Sense objecte identificable, no s'activa el fallback. */ }
    } else textos.push(error.message);
  }
  textos.push(error?.details);
  for (const text of textos) {
    if (typeof text !== 'string' || text.length > 65536) continue;
    const patro = code === '42883'
      ? /\bfunction\s+((?:"?[a-z_][a-z0-9_$]*"?\s*\.\s*)?"?[a-z_][a-z0-9_$]*"?)\s*\([^\r\n]{0,2048}?\)\s+does not exist\b/i
      : /\b(?:relation|table)\s+((?:"?[a-z_][a-z0-9_$]*"?\s*\.\s*)?"?[a-z_][a-z0-9_$]*"?)\s+does not exist\b/i;
    const objecte = patro.exec(text)?.[1];
    if (!objecte) continue;
    const parts = objecte.replaceAll('"', '').replace(/\s/g, '').split('.');
    if (parts.length > 1 && parts[0] !== 'public') return false;
    const identificador = parts.at(-1);
    // El nom de l'RPC al CONTEXT PL/pgSQL no acredita què falta. Només
    // l'objecte declarat «does not exist» pot activar este camí local.
    return code === '42883' ? identificador === nom : TAULES_ACCIONS.has(identificador);
  }
  return false;
}
function guarda(config) {
  const sessio = capturaSessio(), scope = backendScope(config), usuari = usuariDeSessio()?.id;
  return () => {
    sessio();
    if (config.signal?.aborted || backendScope(config) !== scope) throw new DOMException('Operació cancel·lada.', 'AbortError');
    if (!usuari || !jwtPerBackend(config) || !usuariDeSessio()) throw Object.assign(new Error('Cal tornar a iniciar sessió.'), { code: 'sessio-caducada', status: 401 });
    if (usuariDeSessio().id !== usuari) throw new DOMException('La sessió ha canviat.', 'AbortError');
  };
}
function estat(v) {
  if (!v || !UUID.test(v.missatgeId) || !UUID.test(v.filId) || !Array.isArray(v.reaccions)
    || ['destacat', 'fixat', 'amagat'].some(k => typeof v[k] !== 'boolean')
    || v.reaccions.some(r => typeof r?.emoji !== 'string' || [...r.emoji].length < 1 || [...r.emoji].length > 16
      || !Number.isSafeInteger(r.total) || r.total < 1 || typeof r.meua !== 'boolean')) throw invalid();
  // Whitelist: ni fixat_per ni els UUID d'altres operadors travessen el port.
  return { missatgeId: v.missatgeId, filId: v.filId, reaccions: v.reaccions.map(({ emoji, total, meua }) => ({ emoji, total, meua })), destacat: v.destacat, fixat: v.fixat, amagat: v.amagat };
}
async function crida(nom, params, config) {
  const comprova = guarda(config); comprova();
  try {
    const v = primera(await rpc(nom, params, config, { signal: config.signal }));
    comprova(); return v;
  } catch (error) {
    comprova();
    if (error?.status === 401 || error?.status === 403) throw error;
    const code = String(error?.postgrestCode ?? error?.sqlstate ?? error?.code ?? '');
    if (esAbsenciaSql(error, nom, code)) throw absent(error);
    throw error;
  }
}
export async function carregaAccionsMissatges({ filId = null, missatgeIds = [], nomesDestacats = false, despresDeId = null, limit = 100 } = {}, config = {}) {
  if ((filId !== null && !UUID.test(filId)) || (!filId && !nomesDestacats) || !Array.isArray(missatgeIds)
    || missatgeIds.length > 100 || missatgeIds.some(id => !UUID.test(id)) || (despresDeId !== null && !UUID.test(despresDeId))
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw invalid();
  const v = await crida('xat_accions_missatges', { p_fil_id: filId, p_ids: missatgeIds, p_nomes_destacats: Boolean(nomesDestacats), p_despres_de_id: despresDeId, p_limit: limit }, config);
  if (!v || !Array.isArray(v.missatges) || v.missatges.length > limit || typeof v.teMes !== 'boolean'
    || (v.teMes && !UUID.test(v.seguentId))) throw invalid();
  const missatges = v.missatges.map(estat);
  const ids = new Set(missatgeIds);
  if (new Set(missatges.map(m => m.missatgeId)).size !== missatges.length
    || missatges.some(m => (filId && m.filId !== filId) || (ids.size && !ids.has(m.missatgeId))
      || (nomesDestacats && !m.destacat) || (despresDeId && m.missatgeId <= despresDeId))
    || (v.teMes && missatges.at(-1)?.missatgeId !== v.seguentId)) throw invalid();
  return { missatges, teMes: v.teMes, seguentId: v.teMes ? v.seguentId : null };
}
async function muta(nom, dades, extra, config) {
  if (!UUID.test(dades?.filId) || !UUID.test(dades?.missatgeId)) throw invalid();
  const v = estat(await crida(nom, { p_fil_id: dades.filId, p_missatge_id: dades.missatgeId, ...extra }, config));
  if (v.filId !== dades.filId || v.missatgeId !== dades.missatgeId) throw invalid();
  return v;
}
export function alternaReaccio(dades, config = {}) {
  if (typeof dades?.emoji !== 'string' || [...dades.emoji].length < 1 || [...dades.emoji].length > 16 || !dades.emoji.trim() || typeof dades.activa !== 'boolean') return Promise.reject(invalid());
  return muta('xat_alterna_reaccio', dades, { p_emoji: dades.emoji, p_activa: dades.activa }, config);
}
export function alternaDestacat(dades, config = {}) {
  if (typeof dades?.actiu !== 'boolean') return Promise.reject(invalid());
  return muta('xat_alterna_destacat', dades, { p_actiu: dades.actiu }, config);
}
export function alternaFixat(dades, config = {}) {
  if (typeof dades?.actiu !== 'boolean') return Promise.reject(invalid());
  return muta('xat_alterna_fixat', dades, { p_actiu: dades.actiu }, config);
}
export const eliminaPerAMi = (dades, config = {}) => muta('xat_elimina_per_a_mi', dades, {}, config);
