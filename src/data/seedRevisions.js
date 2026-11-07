/** P1-75 · Per-piece CAS for published seed revisions. Authority is server-owned. */
export const SECCIONS_REVISIO_SEED = Object.freeze(['mur', 'events']);
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const CAMPS = Object.freeze({ title: 4000, subtitle: 4000, lead: 4000, content: 600000, heroImage: 4000,
  logoImage: 4000, copyright: 4000, icon: 4000, publishDate: 4000, tags: 50 });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export const errorRevisioSeed = (code, cause) => Object.assign(new Error('No s’ha pogut completar la revisió de la llavor.'), { code, codi: code, ...(cause ? { cause } : {}) });
const invalid = () => { throw errorRevisioSeed('seed-invalid'); };
function values(object, keys) {
  if (!plain(object)) invalid();
  const result = {};
  for (const key of Reflect.ownKeys(object)) {
    const d = Object.getOwnPropertyDescriptor(object, key);
    if (typeof key !== 'string' || !keys.includes(key) || !d?.enumerable || !Object.hasOwn(d, 'value')) invalid();
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
export function capturaCampsRevisioSeed(input) {
  const camps = values(input, Object.keys(CAMPS));
  if (!Object.keys(camps).length) invalid();
  for (const [key, value] of Object.entries(camps)) {
    if (key === 'tags') {
      if (!Array.isArray(value) || value.length > CAMPS.tags || Reflect.ownKeys(value).length !== value.length + 1) invalid();
      camps.tags = Array.from({ length: value.length }, (_, i) => {
        const d = Object.getOwnPropertyDescriptor(value, String(i));
        if (!d || !Object.hasOwn(d, 'value')) invalid();
        return text(d.value, 80);
      });
    } else if (key !== 'publishDate' || value !== null) camps[key] = text(value, CAMPS[key]);
  }
  if (new TextEncoder().encode(JSON.stringify(camps)).byteLength > 700000) invalid();
  return camps;
}
export function capturaConsultaRevisionsSeed(input) {
  const { seccio, ids } = values(input, ['seccio', 'ids']);
  if (!SECCIONS_REVISIO_SEED.includes(seccio) || !Array.isArray(ids) || ids.length > 200
    || Reflect.ownKeys(ids).length !== ids.length + 1) invalid();
  const copy = Array.from({ length: ids.length }, (_, i) => {
    const d = Object.getOwnPropertyDescriptor(ids, String(i));
    if (!d || !Object.hasOwn(d, 'value') || typeof d.value !== 'string' || !ID.test(d.value)) invalid();
    return d.value;
  });
  if (new Set(copy).size !== copy.length) invalid();
  return { seccio, ids: copy };
}
function capturaRevisio(input, maxim) {
  const { seccio, id, camps, versio, fontVersio } = values(input, ['seccio', 'id', 'camps', 'versio', 'fontVersio']);
  capturaConsultaRevisionsSeed({ seccio, ids: [id] });
  if (!Number.isSafeInteger(versio) || versio < 0 || versio > maxim) invalid();
  if (!Number.isSafeInteger(fontVersio) || fontVersio < 1 || fontVersio > 2147483647) invalid();
  return { seccio, id, camps: capturaCampsRevisioSeed(camps), versio, fontVersio };
}
export const capturaRevisioSeed = input => capturaRevisio(input, 2147483646);
export function capturaRespostaRevisioSeed(input) {
  const row = capturaRevisio(input, 2147483647);
  if (row.versio < 1) invalid();
  return row;
}
/** Same explicit publication flags as the SQL authority/read policy. An absent
 * flag denotes the historical, public app_content seed; explicit draft wins. */
export function esFontPublicaRevisioSeed(font) {
  const pending = [font]; let visited = 0;
  while (pending.length) {
    const layer = pending.pop();
    if (++visited > 64 || !plain(layer)) return false;
    for (const key of ['visibility', 'status', 'isPublished', 'attributes', 'payload']) {
      const descriptor = Object.getOwnPropertyDescriptor(layer, key);
      if (!descriptor) continue;
      if (!Object.hasOwn(descriptor, 'value')) return false;
      const value = descriptor.value;
      if (key === 'visibility' && !['public', 'publica'].includes(value)) return false;
      if (key === 'status' && !['published', 'public', 'publicat'].includes(value)) return false;
      if (key === 'isPublished' && value !== true) return false;
      if ((key === 'attributes' || key === 'payload') && value !== null) pending.push(value);
    }
  }
  return true;
}
/** Additional P2-08 resource in the existing account export. Old servers are
 * explicit about this unavailable resource; malformed/foreign rows never form
 * a partial, apparently successful personal export. */
export function capturaExportacioRevisionsSeed(dades, actorId) {
  if (!Object.hasOwn(dades, 'seed_revisions')) return { ...dades, seed_revisions: { error: 'SDP-SEED-EXPORT-NO-DISPONIBLE' } };
  if (!Array.isArray(dades.seed_revisions)) throw errorRevisioSeed('seed-export-invalid');
  const seen = new Set();
  const rows = dades.seed_revisions.map(value => {
    try {
      const row = values(value, ['id', 'tenant_id', 'section', 'seed_id', 'payload', 'version', 'source_version', 'author_id', 'created_at', 'updated_at']);
      if (typeof actorId !== 'string' || !actorId || row.author_id !== actorId || typeof row.id !== 'string' || !ID.test(row.id)
        || (row.tenant_id !== null && (typeof row.tenant_id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.tenant_id)))
        || !['created_at', 'updated_at'].every(key => typeof row[key] === 'string' && Number.isFinite(Date.parse(row[key])))) throw errorRevisioSeed('seed-export-invalid');
      const revision = capturaRespostaRevisioSeed({ seccio: row.section, id: row.seed_id, camps: row.payload, versio: row.version, fontVersio: row.source_version });
      const identity = JSON.stringify([row.tenant_id, row.section, row.seed_id]);
      if (seen.has(identity)) throw errorRevisioSeed('seed-export-invalid'); seen.add(identity);
      return { ...row, payload: revision.camps };
    } catch (cause) { throw errorRevisioSeed('seed-export-invalid', cause); }
  });
  return { ...dades, seed_revisions: rows };
}
const CLAUS = Object.freeze({ title: 'title', subtitle: 'post_subtitle', lead: 'entradilla', content: 'content',
  heroImage: 'image_url', logoImage: 'logo_image', copyright: 'copyright', icon: 'icon', publishDate: 'publish_date', tags: 'tags' });
/** Àrbitre R11 (R33-L2-01) · Tota peça d'app_content porta la versió de la seua
 * fila com a font: és la que exigix el CAS de desa_revisio_seed, també abans
 * de la primera revisió (versió 0). Sense versió de fila vàlida, cap marca. */
export function marcaFontRevisioSeed(items, fontVersio) {
  if (!Number.isSafeInteger(fontVersio) || fontVersio < 1) return items;
  return items.map(item => (plain(item) ? { ...item, _seedFontVersio: fontVersio } : item));
}
export function aplicaRevisionsSeed(items, revisions, fontVersio) {
  const byId = new Map(revisions.map(row => [row.id, row]));
  return items.map(item => {
    const row = byId.get(item.id);
    if (!row || row.fontVersio !== fontVersio) return item;
    const result = { ...item, _seedRevisioVersio: row.versio, _seedFontVersio: row.fontVersio };
    for (const [key, value] of Object.entries(row.camps)) result[CLAUS[key]] = Array.isArray(value) ? [...value] : value;
    if (Object.hasOwn(row.camps, 'content')) result.editorial_format = 'html-r6';
    return result;
  });
}
