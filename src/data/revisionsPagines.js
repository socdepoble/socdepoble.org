/** R32.44 · Contracte de revisions servidor. El DTO local de Gemini es manté separat. */
import { esTokenPublicacio } from './publicacionsCas.js';

export const UUID_REVISIO = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const esUuidRevisio = value => typeof value === 'string' && UUID_REVISIO.test(value);
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const SECCIONS = new Set(['sistema', 'mur', 'mercat', 'events']);
const CAMPS = { title: 4000, subtitle: 4000, lead: 4000, content: 600000, heroImage: 4000, logoImage: 4000, copyright: 4000, icon: 4000, publishDate: 4000, tags: 50, mostrarAlMur: 1 };
const invalid = () => { throw new TypeError('Revisió de pàgina invàlida.'); };
export function capturaObjecteRevisio(input, allowed) {
  if (!input || typeof input !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) invalid();
  const result = {};
  for (const key of Reflect.ownKeys(input)) {
    const d = Object.getOwnPropertyDescriptor(input, key);
    if (typeof key !== 'string' || !allowed.includes(key) || !d?.enumerable || !Object.hasOwn(d, 'value')) invalid();
    result[key] = d.value;
  }
  return result;
}
const text = (value, max) => {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) invalid();
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const next = value.charCodeAt(++i); if (!(next >= 0xdc00 && next <= 0xdfff)) invalid(); }
    else if (c >= 0xdc00 && c <= 0xdfff) invalid();
  }
  return value;
};
export function capturaCampsPagina(input) {
  const fields = capturaObjecteRevisio(input, Object.keys(CAMPS));
  if (!Object.keys(fields).length) invalid();
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'mostrarAlMur') { if (typeof value !== 'boolean') invalid(); }
    else if (key === 'tags') {
      if (!Array.isArray(value) || value.length > 50 || Reflect.ownKeys(value).length !== value.length + 1) invalid();
      fields.tags = Array.from({ length: value.length }, (_, i) => {
        const d = Object.getOwnPropertyDescriptor(value, String(i));
        if (!d || !Object.hasOwn(d, 'value')) invalid();
        return text(d.value, 80);
      });
    } else if (key !== 'publishDate' || value !== null) fields[key] = text(value, CAMPS[key]);
  }
  if (new TextEncoder().encode(JSON.stringify(fields)).byteLength > 700000) invalid();
  return fields;
}
export function recursRevisioPagina(seccio, id) {
  if (!SECCIONS.has(seccio) || typeof id !== 'string' || !ID.test(id)) invalid();
  if (seccio === 'sistema' || !esUuidRevisio(id)) {
    if (!['sistema', 'mur', 'events'].includes(seccio)) invalid();
    return { seccio, id, slug: id, itemId: null };
  }
  return { seccio, id: id.toLowerCase(), slug: null, itemId: id.toLowerCase() };
}
export function capturaConsultaPagina(input) {
  const q = capturaObjecteRevisio(input, ['seccio', 'id', 'limit', 'abansVersio']);
  const r = recursRevisioPagina(q.seccio, q.id), limit = q.limit ?? 20, abansVersio = q.abansVersio ?? null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || abansVersio !== null && (!Number.isInteger(abansVersio) || abansVersio < 1)) invalid();
  return { ...r, limit, abansVersio };
}
export function capturaDesadaPagina(input, restore = false) {
  const q = capturaObjecteRevisio(input, ['seccio', 'id', 'camps', 'versio', 'operationId', 'actorEntityId', ...(restore ? ['restauraVersio'] : [])]);
  const r = recursRevisioPagina(q.seccio, q.id);
  if (!Number.isInteger(q.versio) || q.versio < 0 || q.versio >= 2147483647 || !esUuidRevisio(q.operationId)
    || q.actorEntityId != null && !esUuidRevisio(q.actorEntityId)) invalid();
  if (restore && (!Number.isInteger(q.restauraVersio) || q.restauraVersio < 1 || q.camps !== undefined)) invalid();
  return { ...r, versio: q.versio, operationId: q.operationId.toLowerCase(), actorEntityId: q.actorEntityId?.toLowerCase() ?? null,
    ...(restore ? { restauraVersio: q.restauraVersio } : { camps: capturaCampsPagina(q.camps) }) };
}
export function capturaFilaPagina(input) {
  const row = capturaObjecteRevisio(input, ['id', 'tenant_id', 'section_id', 'slug', 'item_id', 'version_num', 'author_id', 'actor_entity_id', 'payload_jsonb', 'created_at', 'operation_id', 'restored_from', 'replay']);
  const resource = recursRevisioPagina(row.section_id, row.slug ?? row.item_id);
  if (resource.slug !== row.slug || resource.itemId !== row.item_id || !esUuidRevisio(row.id) || !esUuidRevisio(row.tenant_id)
    || !Number.isInteger(row.version_num) || row.version_num < 1 || row.version_num > 2147483647
    || row.author_id !== null && !esUuidRevisio(row.author_id) || row.actor_entity_id !== null && !esUuidRevisio(row.actor_entity_id)
    || !esUuidRevisio(row.operation_id) || !esTokenPublicacio(row.created_at)
    || row.restored_from !== null && (!Number.isInteger(row.restored_from) || row.restored_from < 1 || row.restored_from >= row.version_num)
    || row.replay !== undefined && typeof row.replay !== 'boolean') invalid();
  return Object.freeze({ ...resource, revisionId: row.id, tenantId: row.tenant_id, versio: row.version_num,
    authorId: row.author_id, actorEntityId: row.actor_entity_id, camps: Object.freeze(capturaCampsPagina(row.payload_jsonb)),
    desadaEl: row.created_at, operationId: row.operation_id, restauradaDe: row.restored_from, ...(row.replay === undefined ? {} : { replay: row.replay }) });
}
/** Compatible amb historialRevisionsEditorials.js de Gemini: cap nom privat es deduïx d'un UUID. */
export function historialPaginaAContracteLocal(rows) {
  if (!Array.isArray(rows)) invalid();
  const sorted = [...rows].sort((a, b) => a.versio - b.versio);
  return Object.freeze(sorted.map((row, index) => Object.freeze({ versio: row.versio, desadaEl: row.desadaEl, autorNom: null,
    campsAnteriors: index > 0 && sorted[index - 1].versio === row.versio - 1 ? sorted[index - 1].camps : null, campsNous: row.camps })));
}
