import { getResolvedConfig, rpc } from './runtime.js';
import { validaPresenciaXat, validaRitmeXat } from '../xatRitme.js';
import { usuariDeSessio, versioSessio } from '../identitat.js';

const unavailable = () => Object.assign(new Error('El ritme d’esta conversa encara no està disponible.'), { code: 'SENSE_CAPACITAT_RITME' });
async function crida(nom, body, config) {
  const resolved = getResolvedConfig(config);
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig) throw unavailable();
  const actor = usuariDeSessio()?.id, epoch = versioSessio;
  const canvi = () => new DOMException('La sessió del xat ha canviat.', 'AbortError');
  if (config.ritmeActorId !== undefined && config.ritmeActorId !== actor) throw canvi();
  try {
    const res = await rpc(nom, body, config, { signal: config.signal, timeoutMs: 8000 });
    if (actor !== usuariDeSessio()?.id || epoch !== versioSessio || config.signal?.aborted) throw canvi();
    return res;
  }
  catch (error) { if (error?.status === 404) throw unavailable(); throw error; }
}
export async function loadRitmeXat(filId, config = {}) {
  return validaRitmeXat(await crida('xat_ritme', { p_fil_id: filId }, config));
}
export async function actualitzaPresenciaXat(filId, value, config = {}) {
  const p = validaPresenciaXat(value);
  const res = await crida('xat_presencia', { p_fil_id: filId, p_instancia: p.instancia, p_revisio: p.revisio, p_escrivint: p.escrivint }, config);
  if (res?.acceptat !== true) throw Object.assign(new Error('Presència no confirmada.'), { code: 'BACKEND_RESPOSTA_INVALIDA' });
  return { acceptat: true };
}
