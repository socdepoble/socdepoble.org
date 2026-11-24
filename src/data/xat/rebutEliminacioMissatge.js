/** Rebut públic de l'RPC d'eliminació; cap camp d'autoritat travessa el port. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidMissatgeValid = v => typeof v === 'string' && UUID.test(v);
function instantValid(value) {
  if (typeof value !== 'string' || value.length > 35) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return false;
  const [, y, month, day, hour, minute, second, zone] = m;
  const leap = +y % 4 === 0 && (+y % 100 !== 0 || +y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return +y >= 1 && +month >= 1 && +month <= 12 && +day >= 1 && +day <= days[+month - 1]
    && +hour <= 23 && +minute <= 59 && +second <= 59
    && (zone === 'Z' || (+zone.slice(1, 3) <= 14 && +zone.slice(4) <= 59 && (+zone.slice(1, 3) !== 14 || +zone.slice(4) === 0)))
    && Number.isFinite(Date.parse(value));
}
export function rebutEliminacioMissatge(value, { filId, missatgeId } = {}) {
  if (!uuidMissatgeValid(filId) || !uuidMissatgeValid(missatgeId) || !value || typeof value !== 'object'
    || value.filId !== filId || value.missatgeId !== missatgeId || value.esborrat !== true
    || !instantValid(value.esborratAl) || !Array.isArray(value.reaccions) || value.reaccions.length
    || value.destacat !== false || value.fixat !== false || typeof value.amagat !== 'boolean') {
    throw Object.assign(new Error('El servidor no ha confirmat l’eliminació del missatge.'), { code: 'XAT_ACCIO_INVALIDA' });
  }
  return { missatgeId, filId, reaccions: [], destacat: false, fixat: false,
    amagat: value.amagat, esborrat: true, esborratAl: value.esborratAl };
}
