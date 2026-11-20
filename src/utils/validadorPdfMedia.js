/** Strict, bounded PDF envelope/security lexer. Binary streams are skipped only
 * by validated /Length; ObjStm/XRef alone are inflated under one document cap.
 * No image/content-stream decompression, recovery scans or external resources. */
import { inflateRawPur } from './fulls/inflate.js';
const fail = () => { throw Object.assign(new TypeError('El PDF és invàlid o usa una estructura activa/no admesa.'), { code: 'format', codi: 'contenidor-media-invalid' }); };
const must = condition => { if (!condition) fail(); };
const white = c => c === 0 || c === 9 || c === 10 || c === 12 || c === 13 || c === 32;
const delimiter = c => white(c) || [40, 41, 60, 62, 91, 93, 123, 125, 47, 37].includes(c);
const hex = c => c >= 48 && c <= 57 ? c - 48 : c >= 65 && c <= 70 ? c - 55 : c >= 97 && c <= 102 ? c - 87 : -1;
const string = (b, start, end) => { let value = ''; for (let p = start; p < end; p++) value += String.fromCharCode(b[p]); return value; };
const FORBIDDEN = new Set(['JS', 'JavaScript', 'Launch', 'RichMedia', 'EmbeddedFiles', 'EmbeddedFile', 'SubmitForm', 'ImportData', 'Encrypt', 'XFA', 'GoToR', 'GoToE', 'AA']);
const name = v => v?.kind === 'name' ? v.value : null;
const integer = n => Number.isSafeInteger(n) && n >= 0 && n <= 0x7fffffff;
const refKey = ref => `${ref.number}:${ref.generation}`;
class Lexer {
  constructor(bytes, budget, start = 0, end = bytes.length) { this.b = bytes; this.p = start; this.end = end; this.queue = []; this.budget = budget; }
  peek(i = 0) { while (this.queue.length <= i) this.queue.push(this.next()); return this.queue[i]; }
  take() { return this.queue.length ? this.queue.shift() : this.next(); }
  next() {
    const b = this.b;
    while (this.p < this.end) {
      if (white(b[this.p])) this.p++;
      else if (b[this.p] === 37) { while (this.p < this.end && b[this.p] !== 10 && b[this.p] !== 13) this.p++; }
      else break;
    }
    if (this.p === this.end) return null;
    must(++this.budget.tokens <= 2000000);
    const s = this.p, c = b[this.p++];
    if (c === 40) {
      let depth = 1;
      while (depth && this.p < this.end) {
        const v = b[this.p++];
        if (v === 92) { must(this.p < this.end); if (b[this.p++] === 13 && b[this.p] === 10) this.p++; }
        else if (v === 40) { must(++depth <= 64); }
        else if (v === 41) depth--;
      }
      must(depth === 0); return { type: 'string', s };
    }
    if (c === 60 && b[this.p] !== 60) {
      while (this.p < this.end && b[this.p] !== 62) { const v = b[this.p++]; must(white(v) || hex(v) >= 0); }
      must(this.p < this.end); this.p++; return { type: 'string', s };
    }
    if (c === 60 || c === 62) { must(b[this.p++] === c); return { type: c === 60 ? '<<' : '>>', s }; }
    if (c === 91 || c === 93) return { type: c === 91 ? '[' : ']', s };
    if (c === 47) {
      let value = '';
      while (this.p < this.end && !delimiter(b[this.p])) {
        let v = b[this.p++];
        if (v === 35) { must(this.p + 2 <= this.end && hex(b[this.p]) >= 0 && hex(b[this.p + 1]) >= 0); v = hex(b[this.p++]) * 16 + hex(b[this.p++]); }
        must(v !== 0 && value.length < 1024); value += String.fromCharCode(v);
      }
      must(!FORBIDDEN.has(value)); return { type: 'name', value, s };
    }
    must(!delimiter(c));
    while (this.p < this.end && !delimiter(b[this.p])) { this.p++; must(this.p - s <= 128); }
    const value = string(b, s, this.p);
    if (/^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/.test(value)) { const number = Number(value); must(Number.isFinite(number)); return { type: 'number', value: number, s }; }
    return { type: 'word', value, s };
  }
}
function value(lex, depth = 0) {
  must(depth <= 64); const token = lex.take(); must(token);
  if (token.type === 'name') return { kind: 'name', value: token.value };
  if (token.type === 'number') {
    if (integer(token.value) && lex.peek()?.type === 'number' && integer(lex.peek().value) && lex.peek(1)?.value === 'R') {
      const generation = lex.take().value; lex.take(); must(generation <= 65535); return { kind: 'ref', number: token.value, generation };
    }
    return token.value;
  }
  if (token.type === 'string') return { kind: 'string' };
  if (token.type === '[') {
    const values = []; while (lex.peek()?.type !== ']') { must(lex.peek()); values.push(value(lex, depth + 1)); } lex.take(); return values;
  }
  if (token.type === '<<') {
    const map = new Map();
    while (lex.peek()?.type !== '>>') {
      const key = lex.take(); must(key?.type === 'name' && !map.has(key.value)); map.set(key.value, value(lex, depth + 1));
    }
    lex.take(); return map;
  }
  if (token.type === 'word' && ['true', 'false', 'null'].includes(token.value)) return token.value === 'null' ? null : token.value === 'true';
  fail();
}
function keyword(lex, word) { const t = lex.take(); must(t?.type === 'word' && t.value === word); }
function object(lex, lengthOf) {
  const id = lex.take(), generation = lex.take(); must(id?.type === 'number' && integer(id.value) && id.value > 0 && generation?.type === 'number' && integer(generation.value) && generation.value <= 65535); keyword(lex, 'obj');
  const data = value(lex), result = { number: id.value, generation: generation.value, offset: id.s, value: data };
  if (lex.peek()?.value === 'stream') {
    lex.take(); must(data instanceof Map && lex.queue.length === 0);
    while (lex.b[lex.p] === 32 || lex.b[lex.p] === 9) lex.p++;
    must(lex.b[lex.p] === 10 || lex.b[lex.p] === 13); if (lex.b[lex.p++] === 13 && lex.b[lex.p] === 10) lex.p++;
    const length = lengthOf(data.get('Length')); must(integer(length) && length <= lex.end - lex.p);
    result.stream = lex.b.subarray(lex.p, lex.p + length); lex.p += length;
    if (lex.b[lex.p] === 13) { lex.p++; if (lex.b[lex.p] === 10) lex.p++; } else if (lex.b[lex.p] === 10) lex.p++;
    const endPosition = lex.p, end = lex.take(); must(end?.value === 'endstream' && end.s === endPosition); // lexer never searches through stream data
  }
  keyword(lex, 'endobj'); return result;
}
function zlib(bytes, max) {
  must(bytes.length >= 6 && (bytes[0] & 15) === 8 && (bytes[0] >> 4) <= 7 && (bytes[0] * 256 + bytes[1]) % 31 === 0 && !(bytes[1] & 32));
  const out = inflateRawPur(bytes.subarray(2, -4), { maxEixida: max });
  let a = 1, b = 0; for (const byte of out) { a = (a + byte) % 65521; b = (b + a) % 65521; }
  const p = bytes.length - 4, expected = bytes[p] * 0x1000000 + bytes[p + 1] * 65536 + bytes[p + 2] * 256 + bytes[p + 3];
  must(((b * 65536 + a) >>> 0) === expected); return out;
}
function predict(bytes, dict, columns) {
  if (dict === null || dict === undefined) return bytes;
  must(dict instanceof Map); const predictor = dict.get('Predictor') ?? 1;
  if (predictor === 1) return bytes;
  must(predictor >= 10 && predictor <= 15 && (dict.get('Colors') ?? 1) === 1 && (dict.get('BitsPerComponent') ?? 8) === 8 && (dict.get('Columns') ?? 1) === columns && bytes.length % (columns + 1) === 0);
  const out = new Uint8Array(bytes.length / (columns + 1) * columns);
  let write = 0;
  for (let read = 0; read < bytes.length;) {
    const filter = bytes[read++]; must(filter <= 4);
    for (let i = 0; i < columns; i++, write++) {
      const left = i ? out[write - 1] : 0, up = write >= columns ? out[write - columns] : 0, before = i && write >= columns ? out[write - columns - 1] : 0;
      let extra = 0;
      if (filter === 1) extra = left; else if (filter === 2) extra = up; else if (filter === 3) extra = Math.floor((left + up) / 2);
      else if (filter === 4) { const p = left + up - before, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - before); extra = a <= b && a <= c ? left : b <= c ? up : before; }
      out[write] = (bytes[read++] + extra) & 255;
    }
  }
  return out;
}
export function validaPdfMedia(bytes) {
  must(bytes.length >= 20 && string(bytes, 0, 7) === '%PDF-1.' && bytes[7] >= 48 && bytes[7] <= 55 && (bytes[8] === 10 || bytes[8] === 13));
  let end = bytes.length; while (end > 0 && white(bytes[end - 1])) end--;
  must(bytes.length - end <= 1024 && end >= 5 && string(bytes, end - 5, end) === '%%EOF');
  let p = end - 5; while (p > 0 && white(bytes[p - 1])) p--; const numberEnd = p;
  while (p > 0 && bytes[p - 1] >= 48 && bytes[p - 1] <= 57) p--;
  must(numberEnd > p && numberEnd - p <= 10); const startxref = Number(string(bytes, p, numberEnd));
  while (p > 0 && white(bytes[p - 1])) p--;
  must(p >= 9 && string(bytes, p - 9, p) === 'startxref' && integer(startxref) && startxref < p - 9);
  const budget = { tokens: 0, remaining: Math.min(8 * 1024 * 1024, bytes.length * 64 + 65536) }, xrefs = new Map(), revisions = new Set(), byOffset = new Map(), compressed = new Map(), lengths = new Map();
  let root, finalSize;
  const decode = (obj, columns = null) => {
    must(obj.stream && obj.value instanceof Map); const dict = obj.value;
    let filter = dict.get('Filter'); if (Array.isArray(filter)) { must(filter.length === 1); filter = filter[0]; }
    let data;
    if (filter === null || filter === undefined) data = obj.stream;
    else { must(name(filter) === 'FlateDecode'); data = zlib(obj.stream, budget.remaining); }
    must(data.length <= budget.remaining); budget.remaining -= data.length;
    if (columns !== null) data = predict(data, dict.get('DecodeParms'), columns);
    else { const parms = dict.get('DecodeParms'); must(parms === undefined || parms === null || parms instanceof Map && (parms.get('Predictor') ?? 1) === 1); }
    return data;
  };
  const addXref = (id, entry) => { must(integer(id)); if (!xrefs.has(id)) xrefs.set(id, entry); };
  const table = (lex, register = true) => {
    keyword(lex, 'xref'); const seen = new Set(); let maximum = -1;
    while (lex.peek()?.type === 'number') {
      const first = lex.take().value, count = lex.take()?.value; must(integer(first) && integer(count) && first + count <= 1000000);
      for (let i = 0; i < count; i++) {
        const offset = lex.take()?.value, generation = lex.take()?.value, status = lex.take()?.value;
        must(integer(offset) && integer(generation) && generation <= 65535 && ['n', 'f'].includes(status));
        const id = first + i; must(!seen.has(id)); seen.add(id); maximum = Math.max(maximum, id);
        if (register) addXref(id, { type: status === 'n' ? 1 : 0, offset, generation });
      }
    }
    keyword(lex, 'trailer'); const dict = value(lex); must(dict instanceof Map && integer(dict.get('Size')) && dict.get('Size') > maximum); return dict;
  };
  let at = startxref;
  while (at !== undefined) {
    must(integer(at) && at < bytes.length && !revisions.has(at) && revisions.size < 4096); revisions.add(at);
    const lex = new Lexer(bytes, budget, at); must(lex.peek()?.s === at); let trailer;
    if (lex.peek()?.value === 'xref') trailer = table(lex);
    else {
      const obj = object(lex, length => { must(integer(length)); return length; }); trailer = obj.value;
      must(trailer instanceof Map && name(trailer.get('Type')) === 'XRef');
      const widths = trailer.get('W'), size = trailer.get('Size');
      must(Array.isArray(widths) && widths.length === 3 && widths.every(v => integer(v) && v <= 8) && widths[0] <= 1 && widths.reduce((a, b) => a + b, 0) > 0 && integer(size) && size <= 1000000);
      const ranges = trailer.get('Index') ?? [0, size], width = widths.reduce((a, b) => a + b, 0), data = decode(obj, width);
      must(Array.isArray(ranges) && ranges.length % 2 === 0); let read = 0; const seen = new Set();
      const field = n => { must(read + n <= data.length); let v = 0; for (let i = 0; i < n; i++) v = v * 256 + data[read++]; must(Number.isSafeInteger(v)); return v; };
      for (let i = 0; i < ranges.length; i += 2) {
        const first = ranges[i], count = ranges[i + 1]; must(integer(first) && integer(count) && first + count <= size);
        for (let j = 0; j < count; j++) { must(!seen.has(first + j)); seen.add(first + j); const type = widths[0] ? field(widths[0]) : 1, offset = field(widths[1]), generation = field(widths[2]); must(type <= 2); addXref(first + j, { type, offset, generation }); }
      }
      must(read === data.length);
    }
    must(integer(trailer.get('Size')) && !trailer.has('XRefStm'));
    if (root === undefined) root = trailer.get('Root');
    if (finalSize === undefined) finalSize = trailer.get('Size');
    // Linearized PDFs may point /Prev forward to the main EOF xref.
    // Bounds and the visited-offset set reject cycles without assuming order.
    const previous = trailer.get('Prev'); if (previous !== undefined) must(integer(previous)); at = previous;
  }
  must(root?.kind === 'ref'); for (const id of xrefs.keys()) must(id < finalSize);
  const lengthOf = length => {
    if (integer(length)) return length;
    must(length?.kind === 'ref'); const key = refKey(length); if (lengths.has(key)) return lengths.get(key);
    const entry = xrefs.get(length.number); must(entry?.type === 1 && entry.generation === length.generation && entry.offset < bytes.length);
    const obj = object(new Lexer(bytes, budget, entry.offset), () => fail()); must(obj.number === length.number && obj.generation === length.generation && integer(obj.value) && !obj.stream);
    lengths.set(key, obj.value); return obj.value;
  };
  const lex = new Lexer(bytes, budget, 9), objStreams = [];
  while (lex.peek()) {
    const token = lex.peek();
    if (token.type === 'number') {
      const obj = object(lex, lengthOf); must(!byOffset.has(obj.offset)); byOffset.set(obj.offset, obj);
      if (obj.value instanceof Map && name(obj.value.get('Type')) === 'ObjStm') objStreams.push(obj);
    } else if (token.value === 'xref') table(lex, false);
    else if (token.value === 'startxref') { lex.take(); must(integer(lex.take()?.value)); }
    else fail();
  }
  for (const obj of objStreams) {
    const dict = obj.value, count = dict.get('N'), first = dict.get('First'), data = decode(obj);
    must(integer(count) && count > 0 && count <= 100000 && integer(first) && first <= data.length);
    const head = new Lexer(data, budget, 0, first), entries = [], ids = new Set();
    for (let i = 0; i < count; i++) { const id = head.take()?.value, offset = head.take()?.value; must(integer(id) && id > 0 && integer(offset) && first + offset < data.length && (!i || offset > entries[i - 1].offset)); must(!ids.has(id)); ids.add(id); entries.push({ id, offset }); }
    must(!head.take());
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], body = new Lexer(data, budget, first + entry.offset, i + 1 < entries.length ? first + entries[i + 1].offset : data.length), parsed = value(body);
      must(!body.take()); const key = `${obj.number}:${i}`; must(!compressed.has(key)); compressed.set(key, { number: entry.id, generation: 0, value: parsed });
    }
  }
  const resolve = ref => {
    must(ref?.kind === 'ref'); const entry = xrefs.get(ref.number); must(entry && entry.type !== 0);
    if (entry.type === 2) { must(ref.generation === 0); const obj = compressed.get(`${entry.offset}:${entry.generation}`); must(obj?.number === ref.number); return obj; }
    const obj = byOffset.get(entry.offset); must(obj?.number === ref.number && obj.generation === ref.generation && entry.generation === ref.generation); return obj;
  };
  for (const [id, entry] of xrefs) {
    if (entry.type === 1) resolve({ kind: 'ref', number: id, generation: entry.generation });
    if (entry.type === 2) resolve({ kind: 'ref', number: id, generation: 0 });
  }
  // Automatic actions may navigate within this PDF only. URI links remain
  // usable when explicitly clicked, while OpenAction/Next cannot launch them.
  const checkedActions = new Set(), activeActions = new Set();
  const actionValue = entry => entry?.kind === 'ref' ? resolve(entry).value : entry;
  const destination = entry => {
    const dest = actionValue(entry);
    if (Array.isArray(dest)) {
      must(dest[0]?.kind === 'ref' && name(resolve(dest[0]).value?.get?.('Type')) === 'Page');
    } else must(dest?.kind === 'name' || dest?.kind === 'string');
  };
  const automatic = initial => {
    const first = actionValue(initial);
    if (Array.isArray(first)) { destination(first); return; }
    const stack = [{ entry: first, finish: false }];
    while (stack.length) {
      const item = stack.pop(), action = actionValue(item.entry);
      must(action instanceof Map);
      if (item.finish) { activeActions.delete(action); checkedActions.add(action); continue; }
      if (checkedActions.has(action)) continue;
      must(!activeActions.has(action) && name(action.get('S')) === 'GoTo' && action.has('D'));
      destination(action.get('D')); activeActions.add(action); stack.push({ entry: action, finish: true });
      if (action.has('Next')) {
        const next = actionValue(action.get('Next'));
        for (const entry of Array.isArray(next) ? next : [next]) stack.push({ entry, finish: false });
      }
    }
  };
  for (const obj of [...byOffset.values(), ...compressed.values()]) {
    const pending = [obj.value];
    while (pending.length) {
      const entry = pending.pop();
      if (entry instanceof Map) { if (entry.has('OpenAction')) automatic(entry.get('OpenAction')); for (const child of entry.values()) pending.push(child); }
      else if (Array.isArray(entry)) for (const child of entry) pending.push(child);
    }
  }
  const catalog = resolve(root).value; must(catalog instanceof Map && name(catalog.get('Type')) === 'Catalog');
  const pagesRef = catalog.get('Pages'), seenPages = new Set(), pageCounts = new Map();
  const tree = [{ ref: pagesRef, parent: null, finish: false }];
  while (tree.length) {
    const item = tree.pop(), page = resolve(item.ref).value, key = refKey(item.ref);
    must(page instanceof Map); const type = name(page.get('Type'));
    if (item.finish) {
      const total = page.get('Kids').reduce((n, child) => n + pageCounts.get(refKey(child)), 0);
      must(integer(total) && total === page.get('Count')); pageCounts.set(key, total); continue;
    }
    must(!seenPages.has(key) && (type === 'Page' || type === 'Pages')); seenPages.add(key);
    if (item.parent !== null) must(page.get('Parent')?.kind === 'ref' && refKey(page.get('Parent')) === item.parent);
    if (type === 'Page') { must(item.parent !== null); pageCounts.set(key, 1); }
    else {
      must(integer(page.get('Count')) && Array.isArray(page.get('Kids'))); tree.push({ ...item, finish: true });
      for (const child of page.get('Kids')) { must(child?.kind === 'ref'); tree.push({ ref: child, parent: key, finish: false }); }
    }
  }
}
