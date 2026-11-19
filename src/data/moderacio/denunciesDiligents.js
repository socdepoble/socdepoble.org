/** Pure LSSI review contract. Reporting never decides legality or hides content.
 * Identity, quotas and moderator authority are determined only by the server.
 */
export const ESTATS_DENUNCIA_DILIGENT = Object.freeze(['rebuda', 'en_revisio', 'ocultacio_cautelar', 'arxivada', 'resolta']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const MOTIUS = ['ofensiu', 'spam_frau', 'desinformacio', 'altre'];
const TRANSICIONS = Object.freeze({ rebuda: ['en_revisio', 'arxivada'], en_revisio: ['ocultacio_cautelar', 'arxivada', 'resolta'], ocultacio_cautelar: ['arxivada', 'resolta'], arxivada: [], resolta: [] });
const invalid = () => Object.assign(new TypeError('Contracte de denúncia diligent invàlid.'), { code: 'LSSI_DILIGENT_INVALID' });
function fields(value, allowed) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
  const out = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !allowed.includes(key) || !d || !d.enumerable || !Object.hasOwn(d, 'value')) throw invalid();
    out[key] = d.value;
  }
  return out;
}
function uuid(value) { if (typeof value !== 'string' || !UUID.test(value)) throw invalid(); return value.toLowerCase(); }
function text(value, max) { if (typeof value !== 'string' || value.length > max * 2 + 256 || !value.trim() || Array.from(value.trim()).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw invalid(); return value.trim(); }
export function normalitzaDenunciaDiligent(value) {
  const v = fields(value, ['publicacioId', 'motiu', 'detall', 'operacioId']);
  if (!MOTIUS.includes(v.motiu)) throw invalid();
  return Object.freeze({ publicacioId: uuid(v.publicacioId), motiu: v.motiu, detall: text(v.detall, 1000), operacioId: uuid(v.operacioId) });
}
export function transicioDenunciaDiligentPermesa(anterior, estat) { return typeof anterior === 'string' && Object.hasOwn(TRANSICIONS, anterior) && TRANSICIONS[anterior].includes(estat); }
export function normalitzaRevisioDiligent(value) {
  const v = fields(value, ['id', 'estatEsperat', 'versio', 'estat', 'justificacio', 'operacioId']);
  if (!Number.isSafeInteger(v.versio) || v.versio < 1 || v.versio >= 2147483647 || !transicioDenunciaDiligentPermesa(v.estatEsperat, v.estat)) throw invalid();
  return Object.freeze({ id: uuid(v.id), estatEsperat: v.estatEsperat, versio: v.versio, estat: v.estat, justificacio: text(v.justificacio, 2000), operacioId: uuid(v.operacioId) });
}
export function rebutDenunciaDiligent(value) {
  const v = fields(value, ['id', 'estat', 'versio', 'repetida']);
  if (!ESTATS_DENUNCIA_DILIGENT.includes(v.estat) || !Number.isSafeInteger(v.versio) || v.versio < 1 || typeof v.repetida !== 'boolean') throw invalid();
  return Object.freeze({ id: uuid(v.id), estat: v.estat, versio: v.versio, repetida: v.repetida });
}
export function filaDenunciaDiligent(value) {
  const v = fields(value, ['id', 'publicacioId', 'motiu', 'detall', 'estat', 'versio']);
  if (!ESTATS_DENUNCIA_DILIGENT.includes(v.estat) || !Number.isSafeInteger(v.versio) || v.versio < 1 || !MOTIUS.includes(v.motiu)) throw invalid();
  return Object.freeze({ id: uuid(v.id), publicacioId: uuid(v.publicacioId), motiu: v.motiu, detall: v.detall === null || v.detall === '' ? '' : text(v.detall, 1000), estat: v.estat, versio: v.versio });
}
