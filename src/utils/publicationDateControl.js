/** Instants editorials purs. La UI resol IANA/DST abans de passar l’offset. */
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const fail = (code = 'R51_PUBLICATION_DATE_INVALID') => { throw Object.assign(new TypeError(code), { code }); };
function instant(parts, offset, milliseconds = 0) {
  const [year, month, day, hour, minute, second] = parts;
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31
      || hour > 23 || minute > 59 || second > 59 || !Number.isInteger(offset) || Math.abs(offset) > 840) fail();
  const wall = Date.UTC(year, month - 1, day, hour, minute, second, milliseconds);
  const calendar = new Date(wall);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) fail();
  const result = new Date(wall - offset * 60000);
  if (result.getUTCFullYear() < 1000 || result.getUTCFullYear() > 9999) fail();
  return result.toISOString();
}
const parts = match => match.slice(1, 7).map(value => Number(value ?? 0));
export function normalizePublicationDate(value) {
  const match = typeof value === 'string' ? ISO.exec(value) : null;
  if (!match) fail();
  let offset = 0;
  if (match[8] !== 'Z') {
    const hours = Number(match[10]), minutes = Number(match[11]);
    if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) fail();
    offset = (hours * 60 + minutes) * (match[9] === '-' ? -1 : 1);
  }
  return instant(parts(match), offset, Number((match[7] ?? '').padEnd(3, '0')));
}
export function publicationDateFromLocal(value, offsetMinutes) {
  const match = typeof value === 'string' ? LOCAL.exec(value) : null;
  if (!match || !Number.isInteger(offsetMinutes)) fail();
  return instant(parts(match), offsetMinutes);
}
export function publicationDateNow(nowMs) {
  if (!Number.isFinite(nowMs) || !Number.isInteger(nowMs)) fail();
  const date = new Date(nowMs), year = date.getUTCFullYear();
  if (!Number.isFinite(date.getTime()) || year < 1000 || year > 9999) fail();
  return date.toISOString();
}
function field(record, key) {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor) return undefined;
  if (!Object.hasOwn(descriptor, 'value')) fail('R51_RECORD_INVALID');
  return descriptor.value;
}
const absent = value => value === undefined || value === null || value === '';
export function publicationSortKey(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail('R51_RECORD_INVALID');
  const explicit = field(record, 'publish_date');
  const selected = absent(explicit) ? field(record, 'created_at') : explicit;
  return absent(selected) ? null : Date.parse(normalizePublicationDate(selected));
}
export function sortPublications(records) {
  if (!Array.isArray(records)) fail('R51_RECORD_INVALID');
  const seen = new Set();
  const captured = records.map(record => {
    const key = publicationSortKey(record), id = field(record, 'id');
    if (typeof id !== 'string' || !id.trim() || seen.has(id)) fail('R51_ID_INVALID');
    seen.add(id);
    return { record, key, id };
  });
  captured.sort((a, b) => {
    if (a.key !== b.key) {
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return b.key - a.key;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return captured.map(item => item.record);
}
