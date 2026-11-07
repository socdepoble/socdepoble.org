import { getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { capturaConsultaRevisionsSeed, capturaRevisioSeed, capturaRespostaRevisioSeed, errorRevisioSeed } from '../seedRevisions.js';

const configured = config => {
  const resolved = getResolvedConfig(config);
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig || !resolved.tenantId) throw errorRevisioSeed('no-disponible');
  return resolved;
};
function failure(cause) {
  if (cause?.name === 'AbortError') throw cause;
  const message = String(cause?.message || '');
  const code = message.includes('SDP-SEED-003') ? 'conflicte-versio'
    : message.includes('SDP-SEED-002') || cause?.status === 403 ? 'sense-permis'
      : message.includes('SDP-SEED-004') || cause?.status === 404 ? 'no-disponible'
        : message.includes('SDP-SEED-001') ? 'seed-invalid' : 'editorial-error';
  throw errorRevisioSeed(code, cause);
}
export async function loadSeedRevisions(input, config = {}) {
  const query = capturaConsultaRevisionsSeed(input), resolved = configured(config), checkSession = capturaSessio();
  if (!query.ids.length) return [];
  let rows;
  try {
    rows = await request(`/rest/v1/seed_revisions?select=section,seed_id,payload,version,source_version&tenant_id=eq.${encodeURIComponent(resolved.tenantId)}&section=eq.${query.seccio}&seed_id=in.(${query.ids.join(',')})`, config, { signal: config.signal, anonim: true });
  } catch (cause) { failure(cause); }
  checkSession();
  if (!Array.isArray(rows) || rows.length > query.ids.length) throw errorRevisioSeed('resposta-invalida');
  const seen = new Set(), result = [];
  for (const row of rows) {
    if (row?.section !== query.seccio || !query.ids.includes(row?.seed_id) || seen.has(row.seed_id)) throw errorRevisioSeed('resposta-invalida');
    seen.add(row.seed_id);
    /* Àrbitre R11 (R33-L2-03) · Una fila que el lector no pot acceptar es descarta
       sola: la peça es mostra canònica i la resta de revisions continua. */
    try {
      result.push(capturaRespostaRevisioSeed({ seccio: row.section, id: row.seed_id, camps: row.payload, versio: row.version, fontVersio: row.source_version }));
    } catch (error) {
      if (error?.code !== 'seed-invalid') throw error;
    }
  }
  return result;
}
export async function desaRevisioSeed(input, config = {}) {
  const revision = capturaRevisioSeed(input), resolved = configured(config), checkSession = capturaSessio();
  if (!getCurrentUser()?.id) throw errorRevisioSeed('sense-sessio');
  let result;
  try {
    result = await rpc('desa_revisio_seed', { p_tenant_id: resolved.tenantId, p_section: revision.seccio, p_seed_id: revision.id, p_payload: revision.camps, p_version: revision.versio, p_source_version: revision.fontVersio }, config, { signal: config.signal });
  } catch (cause) { failure(cause); }
  checkSession();
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  const row = capturaRespostaRevisioSeed(result);
  if (row.seccio !== revision.seccio || row.id !== revision.id || row.fontVersio !== revision.fontVersio || row.versio !== revision.versio + 1
    || Object.entries(revision.camps).some(([key, value]) => JSON.stringify(row.camps[key]) !== JSON.stringify(value))) throw errorRevisioSeed('resposta-invalida');
  return row;
}
