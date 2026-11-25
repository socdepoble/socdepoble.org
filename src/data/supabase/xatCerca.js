import { rpc, getResolvedConfig } from './runtime.js';
import { capturaSessio, usuariDeSessio } from '../identitat.js';
import { backendScope } from '../../config/backendConfig.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function sessio(config) {
  if (getResolvedConfig(config).runtimeDataMode !== 'remote' || !usuariDeSessio()?.id) throw Object.assign(new Error('Cerca remota no disponible.'), { code: 'sense-capacitat' });
  const comprovaSessio = capturaSessio(), backend = backendScope(config);
  return () => { comprovaSessio(); config.signal?.throwIfAborted(); if (backend !== backendScope(config)) throw new DOMException('Àmbit canviat.', 'AbortError'); };
}
function validaFiles(files, filId) {
  if (!Array.isArray(files) || files.some(m => !uuid.test(m.id) || m.fil_id !== filId || m.esborrat_al || !Number.isSafeInteger(Number(m.seq)) || Number(m.seq) < 1)) throw new TypeError('Resposta de cerca invàlida.');
  return files.map(m => ({ id: m.id, filId: m.fil_id, seq: Number(m.seq), text: m.cos, tipus: m.tipus, usuariId: m.usuari_id, autorNom: m.autor_nom,
    creatAl: m.creat_al, respostaA: m.resposta_a, metadades: m.metadades, esborratAl: null }));
}
export async function cercaMissatgesFil(filId, consulta, { limit = 50, abansDe = null, ...config } = {}) {
  if (!uuid.test(filId) || typeof consulta !== 'string' || !consulta.trim() || consulta.length > 256 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError('Consulta invàlida.');
  if (abansDe !== null && (typeof abansDe !== 'object' || !Number.isSafeInteger(abansDe.seq) || abansDe.seq < 1 || typeof abansDe.creatAl !== 'string' || !Number.isFinite(Date.parse(abansDe.creatAl)))) throw new TypeError('Cursor de cerca invàlid.');
  const comprova = sessio(config); comprova();
  const files = await rpc('xat_cerca_missatges_fil_v2', { p_fil_id: filId, p_consulta: consulta, p_limit: limit, p_abans_de: abansDe?.creatAl ?? null, p_abans_seq: abansDe?.seq ?? null }, config, { signal: config.signal });
  comprova(); return validaFiles(files, filId);
}
export async function cercaMissatgesFilPaginada(filId, consulta, config = {}) {
  const missatges = await cercaMissatgesFil(filId, consulta, config), ultim = missatges.at(-1);
  return { missatges, seguent: missatges.length === (config.limit ?? 50) && ultim ? { creatAl: ultim.creatAl, seq: ultim.seq } : null };
}
export async function carregaMissatgeFilPerId(filId, id, config = {}) {
  if (!uuid.test(filId) || !uuid.test(id)) throw new TypeError('Citació invàlida.');
  const comprova = sessio(config); comprova();
  const files = await rpc('xat_missatge_fil_per_id', { p_fil_id: filId, p_id: id }, config, { signal: config.signal });
  comprova(); return validaFiles(files, filId)[0] ?? null;
}
