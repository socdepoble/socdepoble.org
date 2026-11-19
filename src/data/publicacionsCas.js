/** Opaque PostgREST timestamptz tokens: validate calendar/offset without rounding
 * the original string. BigInt keeps all six microseconds through year 9999. */
export function ordreTokenPublicacio(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d{1,6}))?(Z|([+-])(\d\d):(\d\d))$/.exec(value);
  if (!match || match[1] === '0000') return null;
  const civil = value.slice(0, 19), millis = Date.parse(`${civil}Z`);
  if (!Number.isFinite(millis) || new Date(millis).toISOString().slice(0, 19) !== civil) return null;
  const hours = Number(match[10] ?? 0), minutes = Number(match[11] ?? 0);
  if (hours > 15 || minutes > 59) return null;
  const offset = BigInt(hours * 60 + minutes) * (match[9] === '-' ? -1n : 1n);
  return BigInt(millis) * 1000n + BigInt((match[7] ?? '').padEnd(6, '0')) - offset * 60000000n;
}
export const esTokenPublicacio = value => ordreTokenPublicacio(value) !== null;
