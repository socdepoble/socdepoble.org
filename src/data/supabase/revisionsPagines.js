import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { capturaConsultaPagina, capturaDesadaPagina, capturaFilaPagina, esUuidRevisio } from '../revisionsPagines.js';

const uuid = value => esUuidRevisio(value) ? value.toLowerCase() : null;

function context(config) {
  const cfg = { ...config }, backend = getResolvedConfig(cfg), resolved = { ...backend, tenantId: uuid(backend.tenantId) }, user = uuid(getCurrentUser()?.id), session = capturaSessio();
  const check = () => {
    session(); const actual = getResolvedConfig(config);
    if (cfg.signal?.aborted || config.signal !== cfg.signal || actual.supabaseUrl !== resolved.supabaseUrl || uuid(actual.tenantId) !== resolved.tenantId
      || actual.runtimeDataMode !== resolved.runtimeDataMode || !actual.hasSupabaseConfig || uuid(getCurrentUser()?.id) !== user) throw new DOMException('El context de la revisió ha canviat.', 'AbortError');
  };
  if (!user) throw Object.assign(new Error('Cal iniciar sessió.'), { code: 'sense-sessio' });
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig || !resolved.tenantId) throw Object.assign(new Error('Revisions sense servidor configurat.'), { code: 'no-disponible' });
  cfg.tenantId = resolved.tenantId;
  check(); return { cfg, resolved, check, user };
}
function failure(cause) {
  if (cause?.name === 'AbortError') throw cause;
  /* v1.2.23 · R2D-06 (Gauntlet R2) · Com L4-02 a publicacionsPropies.js: el transport (runtime.js) desa el SQLSTATE de
     PostgreSQL a `sqlstate`; `postgrestCode` només porta els PGRST###. El missatge SDP-PAGE-* de la 130 és la segona prova. */
  const sql = cause?.sqlstate ?? cause?.postgrestCode, text = typeof cause?.message === 'string' ? cause.message : '';
  const code = cause?.status === 409 || sql === '40001' || text.includes('SDP-PAGE-003') ? 'conflicte-versio'
    : cause?.status === 404 && cause?.postgrestCode === 'PGRST202' ? 'no-disponible'
      : sql === '42501' || text.includes('SDP-PAGE-002') ? 'sense-permis'
        : sql === '54000' || text.includes('SDP-PAGE-429') ? 'quota-assolida' : 'revisio-error';
  throw Object.assign(new Error('No s’ha confirmat la revisió al servidor. Conserva l’esborrany.'), { code, codi: code, status: code === 'conflicte-versio' ? 409 : cause?.status, cause });
}
const params = (q, tenant) => ({ p_tenant_id: tenant, p_section_id: q.seccio, p_slug: q.slug, p_item_id: q.itemId });
const sameResource = (row, q, tenant) => row.tenantId === tenant && row.seccio === q.seccio && row.id === q.id;
const sameFields = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) =>
  Object.hasOwn(b, k) && (Array.isArray(v) ? Array.isArray(b[k]) && v.length === b[k].length && v.every((x, i) => x === b[k][i]) : v === b[k]));
export async function llistaRevisionsPagina(input, config = {}) {
  const q = capturaConsultaPagina(input), ctx = context(config);
  let rows;
  try { rows = await rpc('llista_revisions_pagina', { ...params(q, ctx.resolved.tenantId), p_limit: q.limit, p_before_version: q.abansVersio }, ctx.cfg, { signal: ctx.cfg.signal }); }
  catch (cause) { ctx.check(); failure(cause); }
  ctx.check();
  if (!Array.isArray(rows) || rows.length > q.limit) throw new TypeError('Historial invàlid.');
  let previous = q.abansVersio ?? Infinity;
  return rows.map(value => {
    const row = capturaFilaPagina(value);
    if (!sameResource(row, q, ctx.resolved.tenantId) || row.versio >= previous) throw new TypeError('Historial fora d’àmbit o d’ordre.');
    previous = row.versio; return row;
  });
}
async function write(input, config, restore) {
  const q = capturaDesadaPagina(input, restore), ctx = context(config);
  let value;
  try {
    value = await rpc(restore ? 'restaura_revisio_pagina' : 'desa_revisio_pagina', { ...params(q, ctx.resolved.tenantId),
      p_expected_version: q.versio, p_operation_id: q.operationId,
      ...(restore ? { p_version_num: q.restauraVersio } : { p_payload_jsonb: q.camps, p_actor_entity_id: q.actorEntityId }) }, ctx.cfg, { signal: ctx.cfg.signal });
  } catch (cause) { ctx.check(); failure(cause); }
  ctx.check();
  const row = capturaFilaPagina(value);
  if (!sameResource(row, q, ctx.resolved.tenantId) || row.versio !== q.versio + 1 || row.operationId !== q.operationId
    || row.authorId !== ctx.user || typeof row.replay !== 'boolean'
    || (!restore && (row.actorEntityId !== q.actorEntityId || !sameFields(row.camps, q.camps)))
    || (restore && row.restauradaDe !== q.restauraVersio)) throw new TypeError('Rebut de revisió invàlid.');
  return row;
}
export const desaRevisioPagina = (input, config = {}) => write(input, config, false);
export const restauraRevisioPagina = (input, config = {}) => write(input, config, true);
