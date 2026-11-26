import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { mapSectionSubmissionToItem } from '../mapejadorSeccions.js';
import { esTokenPublicacio, ordreTokenPublicacio } from '../publicacionsCas.js';
import { esUuidRevisio } from '../revisionsPagines.js';

const uuid = value => esUuidRevisio(value) ? value.toLowerCase() : null;

function snapshot(value, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 20000 || depth > 24) throw new TypeError('Publicació massa complexa.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object' || ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError('Publicació invàlida.');
  const out = Array.isArray(value) ? [] : {};
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key) || !d?.enumerable || !Object.hasOwn(d, 'value')) throw new TypeError('Publicació invàlida.');
    out[key] = snapshot(d.value, depth + 1, budget);
  }
  return out;
}
/** Nou contracte explícit; cap fallback a un upsert sense token si falta l'RPC. */
export async function desaPublicacioPropia(input, config = {}) {
  const sub = snapshot(input);
  if (!sub || Array.isArray(sub)) throw new TypeError('Intent CAS propi invàlid.');
  const cfg = { ...config }, backend = getResolvedConfig(cfg), resolved = { ...backend, tenantId: uuid(backend.tenantId) }, actor = uuid(getCurrentUser()?.id), session = capturaSessio();
  if (!actor) throw Object.assign(new Error('Cal iniciar sessió.'), { codi: 'sense-sessio' });
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig || !resolved.tenantId) throw Object.assign(new Error('Edició sense servidor configurat.'), { codi: 'no-disponible' });
  cfg.tenantId = resolved.tenantId;
  const check = () => {
    session(); const now = getResolvedConfig(config);
    if (cfg.signal?.aborted || config.signal !== cfg.signal || uuid(now.tenantId) !== resolved.tenantId || now.supabaseUrl !== resolved.supabaseUrl
      || now.runtimeDataMode !== resolved.runtimeDataMode || !now.hasSupabaseConfig || uuid(getCurrentUser()?.id) !== actor) throw new DOMException('El context de publicació ha canviat.', 'AbortError');
  };
  if (!sub || Array.isArray(sub) || !uuid(sub.id) || !uuid(sub.operationId) || !['mur', 'mercat', 'events'].includes(sub.sectionId)
    || !Object.hasOwn(sub, 'expectedUpdatedAt') || sub.expectedUpdatedAt !== null && !esTokenPublicacio(sub.expectedUpdatedAt)
    || !sub.payload || Array.isArray(sub.payload) || typeof sub.payload !== 'object' || sub.noteId !== undefined
    || sub.actor !== undefined && (!sub.actor || !['persona', 'entitat'].includes(sub.actor.tipus) || sub.actor.tipus === 'entitat' && !uuid(sub.actor.id))) throw new TypeError('Intent CAS propi invàlid.');
  // PostgreSQL serialitza uuid en minúscules. Només normalitzem la còpia capturada.
  sub.id = uuid(sub.id); sub.operationId = uuid(sub.operationId);
  if (sub.actor?.tipus === 'entitat') sub.actor.id = uuid(sub.actor.id);
  const authorOrg = sub.actor?.tipus === 'entitat' ? sub.actor.id : null;
  const { categoriesSistemaPerPublicar } = await import('../../utils/publicacioSistema.js');
  check();
  const payload = mapSectionSubmissionToItem({ ...sub, ownerUserId: actor, createdAt: '', payload: categoriesSistemaPerPublicar(sub.payload, sub.sectionId) });
  for (const k of ['created_at', 'updated_at', 'updatedAt', 'origen', 'seller', 'autor', 'source', 'srcDelPort']) delete payload[k];
  const title = typeof sub.title === 'string' ? sub.title : payload.title || '', description = typeof sub.description === 'string' ? sub.description : payload.description || payload.summary || '';
  check(); let receipt;
  try {
    receipt = await request('/rest/v1/rpc/publica_section_submission_beta_cas', cfg, { method: 'POST', signal: cfg.signal, body: {
      p_id: sub.id, p_tenant_id: resolved.tenantId, p_section_id: sub.sectionId, p_payload: payload, p_title: title, p_description: description,
      p_author_org_id: authorOrg, p_preserve_author: sub.actor === undefined, p_expected_updated_at: sub.expectedUpdatedAt, p_operation_id: sub.operationId
    } });
  } catch (cause) {
    check();
    /* v1.2.23 · L4-02 (Gauntlet R1) · El transport (runtime.js) desa el SQLSTATE de PostgreSQL a `sqlstate`; `postgrestCode`
       només porta els PGRST###. El missatge SDP-BETA-* de la 130 és la segona prova del mateix rebuig. */
    const sql = cause?.sqlstate ?? cause?.postgrestCode, text = typeof cause?.message === 'string' ? cause.message : '';
    const code = cause?.status === 409 || sql === '40001' || text.includes('SDP-BETA-003') ? 'conflicte-versio'
      : cause?.status === 404 && cause?.postgrestCode === 'PGRST202' ? 'esquema-absent'
        : sql === '42501' || text.includes('SDP-BETA-002') ? 'sense-permis'
          : sql === '54000' || text.includes('SDP-BETA-429') ? 'quota-assolida' : null;
    if (code) throw Object.assign(new Error('No s’ha confirmat la publicació. Conserva l’esborrany i l’operació.'), { codi: code, code, status: code === 'conflicte-versio' ? 409 : cause?.status, cause });
    throw cause;
  }
  check();
  const ack = snapshot(receipt), keys = ['id', 'tenant_id', 'owner_user_id', 'section_id', 'operation_id', 'updated_at', 'created_at', 'author_org_id', 'replay'];
  if (!ack || Array.isArray(ack) || Object.keys(ack).length !== keys.length || !keys.every(k => Object.hasOwn(ack, k))
    || ack.id !== sub.id || ack.tenant_id !== resolved.tenantId || ack.section_id !== sub.sectionId || ack.operation_id !== sub.operationId
    || !esUuidRevisio(ack.owner_user_id) || ack.author_org_id !== null && !esUuidRevisio(ack.author_org_id)
    || sub.actor !== undefined && ack.author_org_id !== authorOrg || ack.author_org_id === null && ack.owner_user_id !== actor
    || sub.expectedUpdatedAt === null && ack.owner_user_id !== actor || typeof ack.replay !== 'boolean'
    || !esTokenPublicacio(ack.updated_at) || !esTokenPublicacio(ack.created_at) || ordreTokenPublicacio(ack.created_at) > ordreTokenPublicacio(ack.updated_at)
    || sub.expectedUpdatedAt !== null && ordreTokenPublicacio(ack.updated_at) <= ordreTokenPublicacio(sub.expectedUpdatedAt)) throw new TypeError('Rebut CAS propi invàlid.');
  return { id: sub.id, sectionId: sub.sectionId, ownerUserId: ack.owner_user_id, authorOrgId: ack.author_org_id,
    title, description, payload, updatedAt: ack.updated_at, createdAt: ack.created_at, operationId: sub.operationId, replay: ack.replay };
}
