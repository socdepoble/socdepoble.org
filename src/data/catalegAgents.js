/* R21.5 · Catalogue repair is by declared identity and historical provenance,
   never by a person's first name. SQL uses the same constants/predicate. */
import { AGENTS } from './agentsSeed.js';

export const MAXIM_AGENTS_CATALEG = 4096;
export const MAXIM_BYTES_CATALEG = 2 * 1024 * 1024;
/* ECMAScript String.trim characters, also passed explicitly to PostgreSQL
   btrim by the migration. This includes NBSP and the Unicode separators. */
export const CARACTERS_TRIM_CATALEG = '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
const UUID_CATALEG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalitzaIdCataleg(id) {
  if (typeof id !== 'string') return null;
  const clean = id.trim();
  return UUID_CATALEG.test(clean) ? clean.toLowerCase() : id;
}
export const AGENTS_CANONICS = Object.freeze(AGENTS.map(agent => Object.freeze({ ...agent })));
const CANONICS = new Set(AGENTS_CANONICS.map(agent => agent.id));
/* Exact IDs from ae9a9bdb5^:src/data/agentsSeed.js (the removed fictional
   catalogue). A real Andreu, Vicent or Pepica with another ID survives. */
export const IDS_FICCIO_LEGACY = Object.freeze([
  '11111111-1a1a-0001-0000-000000000001',
  '11111111-1a1a-0001-0000-000000000002',
  '11111111-1a1a-0001-0000-000000000003',
  '11111111-1111-4111-a111-000000000009',
  '11111111-1111-4111-a111-000000000003',
  '11111111-1111-4111-a111-000000000004',
  '11111111-1111-4111-a111-000000000005',
  '11111111-1111-4111-a111-000000000008',
  '11111111-1111-4111-a111-000000000007',
  '11111111-0000-0000-0000-000000000004',
  '11111111-1111-4111-a111-000000000010',
  '11111111-1111-4111-a111-000000000011'
]);
const FICCIO = new Set(IDS_FICCIO_LEGACY);
const objecte = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && Boolean(value.trim());

export function esAgentFicticiLegacy(agent) {
  if (!objecte(agent)) return false;
  const id = normalitzaIdCataleg(agent.id);
  if (CANONICS.has(id)) return false;
  if (FICCIO.has(id)) return true;
  const type = typeof agent.type === 'string' ? agent.type.trim().toUpperCase() : '';
  return type === 'AI' || type === 'ANIMAL';
}

// Invalid JSON shapes are not rendered. This is a display-only safeguard;
// the SQL migration never silently destroys an unparseable catalogue.
function fitxaPublicable(agent) {
  if (!objecte(agent) || !text(agent.id) || !text(agent.name)) return false;
  const fields = ['type', 'avatar_url', 'avatarName', 'role', 'tag', 'color', 'calendarCategory', 'lema', 'town_name', 'short_bio', 'created_at', 'last_message_content', 'hero_url', 'hero_video_url'];
  return fields.every(field => agent[field] == null || typeof agent[field] === 'string');
}

/** Fixed canonical order; real extras, duplicate IDs, order and metadata survive. */
export function hidrataCatalegAgents(payload) {
  const canonical = AGENTS_CANONICS.map(agent => ({ ...agent }));
  if (!Array.isArray(payload) || payload.length > MAXIM_AGENTS_CATALEG) return canonical;
  try {
    if (new TextEncoder().encode(JSON.stringify(payload)).length > MAXIM_BYTES_CATALEG) return canonical;
  } catch { return canonical; }
  const extras = payload.filter(agent => fitxaPublicable(agent) && !CANONICS.has(normalitzaIdCataleg(agent.id)) && !esAgentFicticiLegacy(agent));
  return [...canonical, ...extras];
}
