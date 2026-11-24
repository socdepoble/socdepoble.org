import { getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { capturaConsultaRevisionsSeed, capturaRevisioSeed, capturaRespostaRevisioSeed, errorRevisioSeed } from '../seedRevisions.js';

const configured = config => {
  const resolved = getResolvedConfig(config);
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig || !resolved.tenantId) throw errorRevisioSeed('no-disponible');
  return resolved;
};
function capturaContext(config) {
  const resolved = configured(config), tenant = resolved.tenantId, backend = resolved.supabaseUrl;
  const checkSession = capturaSessio();
  const comprova = () => {
    checkSession();
    const actual = getResolvedConfig(config);
    if (config.signal?.aborted || actual.runtimeDataMode !== 'remote' || !actual.hasSupabaseConfig
      || actual.tenantId !== tenant || actual.supabaseUrl !== backend) throw new DOMException('El context de la revisió ha canviat.', 'AbortError');
  };
  comprova(); return { resolved, comprova };
}
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
  const query = capturaConsultaRevisionsSeed(input), { resolved, comprova } = capturaContext(config);
  if (!query.ids.length) return [];
  const pending = new Set(query.ids), result = [];
  // El cursor és el conjunt finit d'IDs encara no rebuts (màxim200), sense
  // offset ni dependència de la col·lació text del servidor. Cada resposta
  // no buida n'ha de consumir almenys un; el pressupost és N+1 peticions.
  for (let page = 0; page <= query.ids.length; page++) {
    comprova();
    let rows, contentRange = null;
    try {
      rows = await request(`/rest/v1/seed_revisions?select=section,seed_id,payload,version,source_version&tenant_id=eq.${encodeURIComponent(resolved.tenantId)}&section=eq.${query.seccio}&seed_id=in.(${[...pending].join(',')})&order=seed_id.asc&limit=${pending.size}`, config,
        { signal: config.signal, anonim: true, headers: { Prefer: 'count=exact' }, onResponseMetadata: metadata => { contentRange = metadata.contentRange; } });
    } catch (cause) { failure(cause); }
    comprova();
    if (!Array.isArray(rows) || rows.length > pending.size) throw errorRevisioSeed('resposta-invalida');
    for (const row of rows) {
      if (row?.section !== query.seccio || !pending.delete(row?.seed_id)) throw errorRevisioSeed('resposta-invalida');
      /* Àrbitre R11 (R33-L2-03) · Una fila il·legible cau sola i no es torna
         a demanar; la font canònica continua disponible per a eixa peça. */
      try {
        result.push(capturaRespostaRevisioSeed({ seccio: row.section, id: row.seed_id, camps: row.payload, versio: row.version, fontVersio: row.source_version }));
      } catch (error) {
        if (error?.code !== 'seed-invalid') throw error;
      }
    }
    const range = /^0-(\d+)\/(\d+)$/.exec(contentRange || '');
    const complete = range !== null && Number(range[1]) + 1 === rows.length && Number(range[2]) === rows.length;
    if (rows.length === 0 || pending.size === 0 || complete) return result;
  }
  throw errorRevisioSeed('resposta-invalida');
}
export async function desaRevisioSeed(input, config = {}) {
  const revision = capturaRevisioSeed(input), { resolved, comprova } = capturaContext(config);
  if (!getCurrentUser()?.id) throw errorRevisioSeed('sense-sessio');
  let result;
  try {
    result = await rpc('desa_revisio_seed', { p_tenant_id: resolved.tenantId, p_section: revision.seccio, p_seed_id: revision.id, p_payload: revision.camps, p_version: revision.versio, p_source_version: revision.fontVersio }, config, { signal: config.signal });
  } catch (cause) { failure(cause); }
  comprova();
  const row = capturaRespostaRevisioSeed(result);
  if (row.seccio !== revision.seccio || row.id !== revision.id || row.fontVersio !== revision.fontVersio || row.versio !== revision.versio + 1
    || Object.entries(revision.camps).some(([key, value]) => JSON.stringify(row.camps[key]) !== JSON.stringify(value))) throw errorRevisioSeed('resposta-invalida');
  return row;
}
