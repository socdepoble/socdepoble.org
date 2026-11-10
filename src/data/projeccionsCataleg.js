/** P0-59 · References to one canonical entity, projected into chosen surfaces.
 * A reference contains display text only: no private recipe, stock, price,
 * photo or source mutation. Authority comes from mapped row columns/RLS.
 */
export const DESTINS_CATALEG = Object.freeze(['mur', 'mercat', 'rebost', 'bar', 'receptes', 'herbari', 'llavors']);
export const FONTS_CATALEG = Object.freeze(['herbari', 'llavors', 'receptes', 'nevera', 'bar']);
export const DESTINS_PRIVATS_CATALEG = Object.freeze(['rebost', 'bar']);
/* PRODNM-02 (R15b) · El Rebost i el Bar viuen dins d'apps amb porta de build.
   La seua ruta existix només amb el mateix literal que el manifest de l'app
   (nevera/manifest.js, bar/manifest.js): sense VITE_SDP_APP_NEVERA ni
   VITE_SDP_APP_BAR, el build de producció plega la branca i el dist no porta
   ni la ruta ni el destí. Es llig en cada crida perquè les proves puguen
   canviar l'entorn (vi.stubEnv). */
const rutesDelBuild = () => ({ herbari: '/page/herbari', llavors: '/page/banc-de-llavors', receptes: '/page/receptes',
  ...(import.meta.env.DEV || import.meta.env.VITE_SDP_APP_NEVERA === '1' ? { nevera: '/app/nevera/rebost' } : {}),
  ...(import.meta.env.DEV || import.meta.env.VITE_SDP_APP_BAR === '1' ? { bar: '/app/bar/cataleg' } : {}) });
/* El destí privat de cada app: sense l'app al build, el selector no l'oferix. */
const APP_DEL_DESTI = Object.freeze({ rebost: 'nevera', bar: 'bar' });
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const pla = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export const errorProjeccioCataleg = (codi, cause) => Object.assign(new Error('No s’ha pogut desar la publicació transversal.'), { codi, code: codi, ...(cause ? { cause } : {}) });
const invalid = () => { throw errorProjeccioCataleg('projeccio-invalida'); };
function camps(value, permesos) {
  if (!pla(value)) invalid();
  const net = {};
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !permesos.includes(key) || !descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
    net[key] = descriptor.value;
  }
  return net;
}
function text(value, maxim, obligatori = false) {
  if (value === undefined && !obligatori) return '';
  if (typeof value !== 'string' || value.length > maxim || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || (obligatori && !value.trim())) invalid();
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const next = value.charCodeAt(++i); if (!(next >= 0xdc00 && next <= 0xdfff)) invalid(); }
    else if (c >= 0xdc00 && c <= 0xdfff) invalid();
  }
  return value;
}
export function capturaFontCataleg(input) {
  const { font, id, title, subtitle, lead } = camps(input, ['font', 'id', 'title', 'subtitle', 'lead']);
  if (!FONTS_CATALEG.includes(font) || typeof id !== 'string' || !ID.test(id)) invalid();
  return { font, id, title: text(title, 300, true), subtitle: text(subtitle, 500), lead: text(lead, 2000) };
}
export function capturaDestinsCataleg(input) {
  if (!Array.isArray(input) || input.length > DESTINS_CATALEG.length || Reflect.ownKeys(input).length !== input.length + 1) invalid();
  const valors = Array.from({ length: input.length }, (_, i) => {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(i));
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !DESTINS_CATALEG.includes(descriptor.value)) invalid();
    return descriptor.value;
  });
  if (new Set(valors).size !== valors.length) invalid();
  return DESTINS_CATALEG.filter(desti => valors.includes(desti));
}
export function capturaAbastProjeccions(input) {
  const { tenantId, ownerId, backendId } = camps(input, ['tenantId', 'ownerId', 'backendId']);
  if (typeof tenantId !== 'string' || !UUID.test(tenantId) || typeof ownerId !== 'string' || !UUID.test(ownerId) || typeof backendId !== 'string' || !backendId || backendId.length > 1000 || backendId.includes('\0')) invalid();
  return { tenantId: tenantId.toLowerCase(), ownerId: ownerId.toLowerCase(), backendId };
}
export const clauFontCataleg = font => { const net = capturaFontCataleg(font); return JSON.stringify([net.font, net.id]); };
/** La ruta de la font, o null si la seua app no és en este build. */
export const rutaFontCataleg = font => { const rutes = rutesDelBuild(); return typeof font === 'string' && Object.hasOwn(rutes, font) ? rutes[font] : null; };
/** PRODNM-02 · Els destins que es poden triar en este build, en l'ordre de
 * DESTINS_CATALEG. La validació de les files continua amb la llista sencera. */
export const destinsOferitsCataleg = () => DESTINS_CATALEG.filter(desti => !Object.hasOwn(APP_DEL_DESTI, desti) || rutaFontCataleg(APP_DEL_DESTI[desti]) !== null);
export { portaMarcaProjeccioCataleg } from './marcaProjeccioCataleg.js';
export function destinsPerAudiencia(destins, audiencia) {
  if (!['publica', 'privada'].includes(audiencia)) invalid();
  return capturaDestinsCataleg(destins).filter(desti => DESTINS_PRIVATS_CATALEG.includes(desti) === (audiencia === 'privada'));
}
export function payloadProjeccioCataleg({ font, destins, audiencia }) {
  const net = capturaFontCataleg(font), seleccionats = capturaDestinsCataleg(destins);
  if (destinsPerAudiencia(seleccionats, audiencia).length !== seleccionats.length) invalid();
  return { type: 'feed', title: net.title, subtitle: net.subtitle, entradilla: net.lead, description: net.lead,
    projeccioCataleg: { v: 1, font: net.font, id: net.id, destins: seleccionats, audiencia } };
}
/** Only mapped rows: ownerUserId is supplied from authoritative row columns.
 * Invalid markers never turn into a public destination or a source entity. */
export function projeccioCatalegDe(item) {
  try {
    if (!pla(item) || typeof item.id !== 'string' || typeof item.ownerUserId !== 'string' || !UUID.test(item.ownerUserId)) return null;
    const marker = camps(item.projeccioCataleg, ['v', 'font', 'id', 'destins', 'audiencia']);
    if (marker.v !== 1 || !['publica', 'privada'].includes(marker.audiencia)) return null;
    const font = capturaFontCataleg({ font: marker.font, id: marker.id, title: item.title, subtitle: item.subtitle ?? '', lead: item.entradilla ?? item.description ?? '' });
    const destins = capturaDestinsCataleg(marker.destins);
    if (destinsPerAudiencia(destins, marker.audiencia).length !== destins.length) return null;
    if (item.sectionId !== (marker.audiencia === 'privada' ? 'notes' : 'mur')) return null;
    return { id: item.id, ownerId: item.ownerUserId.toLowerCase(), font, destins, audiencia: marker.audiencia,
      local: item._projeccioLocal === true, pendent: item._projeccioPendent === true,
      estat: item._projeccioPendent === true ? 'pendent' : 'confirmat' };
  } catch { return null; }
}
export const esProjeccioCataleg = item => projeccioCatalegDe(item) !== null;
/** Bar/Rebost are private even if a caller forgets `privat`. A local pending
 * projection is visible only to the account that created it. */
export function perDestiCataleg(items, desti, { ownerId = null, privat = false } = {}) {
  if (!DESTINS_CATALEG.includes(desti) || !Array.isArray(items)) return [];
  const privades = privat || DESTINS_PRIVATS_CATALEG.includes(desti);
  const actor = typeof ownerId === 'string' ? ownerId.toLowerCase() : null;
  const ids = new Set(), duplicats = new Set();
  for (const item of items) {
    if (typeof item?.id !== 'string') continue;
    if (ids.has(item.id)) duplicats.add(item.id);
    ids.add(item.id);
  }
  const vistes = new Set(), result = [];
  for (const item of items) {
    const row = projeccioCatalegDe(item);
    if (!row || duplicats.has(row.id) || !row.destins.includes(desti) || ((privades || row.local || row.audiencia === 'privada') && (!actor || row.ownerId !== actor))) continue;
    const key = JSON.stringify([row.ownerId, row.font.font, row.font.id]);
    if (vistes.has(key)) continue;
    vistes.add(key); result.push(item);
  }
  return result;
}
export function itemWorkspaceDeProjeccio(item) {
  const row = projeccioCatalegDe(item);
  if (!row) return null;
  return { id: `projeccio-${row.id}`, title: row.font.title, subtitle: row.font.subtitle, lead: row.font.lead,
    glyph: '↗', categoryIds: ['__projeccions__'], projeccio: row,
    searchText: [row.font.title, row.font.subtitle, row.font.lead].join(' ') };
}
/** UUID derived from the complete scope plus audience; retries update one row.
 * Public/private references never change section_id and never overwrite source. */
export async function idPublicacioProjeccio(abast, font, audiencia, subtil = globalThis.crypto?.subtle) {
  const scope = capturaAbastProjeccions(abast), net = capturaFontCataleg(font);
  if (!['publica', 'privada'].includes(audiencia) || typeof subtil?.digest !== 'function') throw errorProjeccioCataleg('crypto-no-disponible');
  const bytes = new Uint8Array(await subtil.digest('SHA-256', new TextEncoder().encode(JSON.stringify(['sdp-projeccio-cataleg-v1', scope.backendId, scope.tenantId, scope.ownerId, net.font, net.id, audiencia]))));
  bytes[6] = (bytes[6] & 0x0f) | 0x80; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes.slice(0, 16)].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
export function capturaConsultaProjeccionsCataleg(input = {}) {
  const { audiencia = 'publica', cursor = null, limit = 100 } = camps(input, ['audiencia', 'cursor', 'limit']);
  if (!['publica', 'privada'].includes(audiencia) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (cursor !== null && (typeof cursor !== 'string' || cursor.length > 2000))) invalid();
  return { audiencia, cursor, limit };
}
export function capturaCursorProjeccionsCataleg(cursor, scope) {
  if (cursor === null) return null;
  try {
    const row = camps(JSON.parse(cursor), ['tenantId', 'ownerId', 'audiencia', 'instant', 'id']);
    if (row.tenantId !== scope.tenantId || row.ownerId !== scope.ownerId || row.audiencia !== scope.audiencia
      || typeof row.instant !== 'string' || !INSTANT.test(row.instant) || !Number.isFinite(Date.parse(row.instant)) || !UUID.test(row.id)) invalid();
    return row;
  } catch { return invalid(); }
}
export function creaCursorProjeccionsCataleg(item, scope) {
  const cursor = JSON.stringify({ ...scope, instant: item.created_at, id: item.id });
  capturaCursorProjeccionsCataleg(cursor, scope);
  return cursor;
}
