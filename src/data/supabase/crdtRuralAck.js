/** Explicit, optional durable-ACK transport. Missing SQL never confirms a DOT. */
import { capturaSessio } from '../identitat.js';
import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { preparaSincronitzacioCrdtRural, registraAckCrdtRural } from '../crdtRural.js';
import { canonitzaJsonJcs } from '../federacio/portabilitatFediversity.js';
const error = code => Object.assign(new Error(code), { code });
export async function confirmaCapturaCrdtRural(input, config = {}) {
  const p = preparaSincronitzacioCrdtRural(input?.crdt, input?.requestId);
  if (canonitzaJsonJcs(p) !== canonitzaJsonJcs(input)) throw error('RURAL_CRDT_INVALID');
  const c = getResolvedConfig(config), check = capturaSessio(), actor = getCurrentUser()?.id;
  if (c.runtimeDataMode !== 'remote' || !c.hasSupabaseConfig || !actor) throw error('RURAL_CRDT_ACK_UNAVAILABLE');
  const authority = new URL(c.supabaseUrl).origin;
  if (!authority.startsWith('https://') || authority !== c.supabaseUrl) throw error('RURAL_CRDT_ACK_UNAVAILABLE');
  let reply;
  try {
    reply = await rpc('confirma_captura_crdt_rural', { p_tenant: c.tenantId, p_request: p.requestId,
      p_capture: canonitzaJsonJcs(p.crdt), p_sha256: p.sha256, p_frontier: p.frontera }, config, { signal: config.signal });
  } catch (cause) {
    // Only structural absence is classified unavailable. ACL and transport
    // errors propagate; callers preserve their complete current operation set.
    if (['42883', 'PGRST202', 'PGRST205'].includes(cause?.code)) throw Object.assign(error('RURAL_CRDT_ACK_UNAVAILABLE'), { cause });
    throw cause;
  }
  check();
  if (config.signal?.aborted || actor !== getCurrentUser()?.id) throw new DOMException('Operació cancel·lada.', 'AbortError');
  if (!reply || typeof reply !== 'object' || Array.isArray(reply)
    || Object.keys(reply).sort().join(',') !== 'ack_remot_confirmat,confirmatEl,frontera,requestId,sha256') throw error('RURAL_CRDT_ACK_INVALID');
  const ack = { schema: 'sdp.rural.remote-ack.v1', requestId: reply.requestId, sha256: reply.sha256,
    frontera: reply.frontera, autoritat: authority, confirmatEl: reply.confirmatEl, ack_remot_confirmat: reply.ack_remot_confirmat };
  registraAckCrdtRural(p.crdt, p, ack, authority);
  return Object.freeze(ack);
}
