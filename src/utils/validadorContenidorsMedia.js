/** R32.14. Validador estructural O(bytes), sense DOM, I/O o descodificador.
 * Rebutja truncaments, MIME fals i dades fora del contenidor. No acredita el
 * còdec ni detecta codi amagat dins de metadades/mostres legítimes. PNG
 * té CRC; JPEG, WebP, MP4 i WAV no tenen un CRC global al format.
 * Referències: W3C PNG3, Apple QTFF, WebM Container Guidelines, RIFF WebP.
 */
import { validaEstructuraImatge } from '../data/mitjansPublicsNets.js';

const MAX_BYTES = 150_000_000;
const fail = () => { throw Object.assign(new TypeError('El contenidor multimèdia és invàlid o està incomplet.'), { code: 'format', codi: 'contenidor-media-invalid' }); };
const must = v => { if (!v) fail(); };
const text = (b, p, n) => { let s = ''; for (let i = p; i < p + n; i++) s += String.fromCharCode(b[i]); return s; };
const be32 = (b, p) => b[p] * 0x1000000 + b[p + 1] * 65536 + b[p + 2] * 256 + b[p + 3];
const le16 = (b, p) => b[p] + b[p + 1] * 256;
const le32 = (b, p) => b[p] + b[p + 1] * 256 + b[p + 2] * 65536 + b[p + 3] * 0x1000000;

function boxes(b, start, end, visit, top = false) {
  for (let p = start; p < end;) {
    must(p + 8 <= end);
    let size = be32(b, p), header = 8;
    const type = text(b, p + 4, 4);
    if (size === 1) { must(p + 16 <= end); size = be32(b, p + 8) * 0x100000000 + be32(b, p + 12); header = 16; }
    else if (size === 0) { must(top && type === 'mdat'); size = end - p; }
    must(Number.isSafeInteger(size) && size >= header && size <= end - p);
    if (type === 'uuid') must(size >= header + 16);
    visit(type, p + header, p + size);
    p += size;
  }
}
function mp4(b) {
  let ftyp = false, moov = false, media = false;
  const trackIds = new Set();
  const brands = new Set(['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'dash', 'M4A ', 'M4V ', 'qt  ', 'MSNV']);
  boxes(b, 0, b.length, (type, s, e) => {
    if (type === 'ftyp') {
      must(!ftyp && !moov && !media && e - s >= 8 && (e - s) % 4 === 0);
      let known = brands.has(text(b, s, 4));
      for (let p = s + 8; p < e; p += 4) known ||= brands.has(text(b, p, 4));
      must(known); ftyp = true;
    } else if (type === 'moov') {
      must(ftyp && !moov); let header = false, tracks = 0;
      boxes(b, s, e, (t, a, z) => {
        if (t === 'mvhd') { must(!header && z - a >= (b[a] === 1 ? 112 : 100) && b[a] <= 1 && be32(b, a + (b[a] === 1 ? 20 : 12)) > 0); header = true; }
        if (t === 'trak') {
          let tkhd = false, mdia = false;
          boxes(b, a, z, (child, ts, te) => {
            if (child === 'tkhd') {
              must(!tkhd && b[ts] <= 1 && te - ts >= (b[ts] === 1 ? 96 : 84));
              const id = be32(b, ts + (b[ts] === 1 ? 20 : 12));
              must(id > 0 && !trackIds.has(id)); trackIds.add(id); tkhd = true;
            }
            if (child === 'mdia') {
              must(!mdia); let mdhd = false, hdlr = false, minf = false;
              boxes(b, ts, te, (mediaType, ms, me) => {
                if (mediaType === 'mdhd') { must(!mdhd && b[ms] <= 1 && me - ms >= (b[ms] === 1 ? 36 : 24) && be32(b, ms + (b[ms] === 1 ? 20 : 12)) > 0); mdhd = true; }
                if (mediaType === 'hdlr') { must(!hdlr && me - ms >= 24 && ['vide', 'soun', 'text', 'subt', 'sbtl', 'hint', 'meta', 'mdir', 'auxv', 'tmcd', 'clcp'].includes(text(b, ms + 8, 4))); hdlr = true; }
                if (mediaType === 'minf') { must(!minf && me - ms >= 8); boxes(b, ms, me, () => {}); minf = true; }
              });
              must(mdhd && hdlr && minf); mdia = true;
            }
          });
          must(tkhd && mdia); tracks++;
        }
      });
      must(header && tracks > 0); moov = true;
    } else if (type === 'mdat') { must(ftyp && e > s); media = true; }
    else must(['free', 'skip', 'wide', 'uuid', 'moof', 'mfra', 'sidx', 'styp', 'pdin', 'meta', 'emsg', 'prft'].includes(type));
  }, true);
  must(ftyp && moov && media);
}

function riff(b, kind, visit) {
  must(b.length >= 12 && text(b, 0, 4) === 'RIFF' && text(b, 8, 4) === kind && le32(b, 4) === b.length - 8);
  for (let p = 12; p < b.length;) {
    must(p + 8 <= b.length);
    const n = le32(b, p + 4), end = p + 8 + n, next = end + (n & 1);
    must(next <= b.length && (!(n & 1) || b[end] === 0));
    visit(text(b, p, 4), p + 8, end); p = next;
  }
}
function wav(b) {
  let fmt = false, data = false, align = 0;
  riff(b, 'WAVE', (t, s, e) => {
    if (t === 'fmt ') {
      must(!fmt && !data && e - s >= 16);
      const tag = le16(b, s), channels = le16(b, s + 2), rate = le32(b, s + 4), bits = le16(b, s + 14);
      align = le16(b, s + 12);
      must([1, 3, 0xfffe].includes(tag) && channels >= 1 && channels <= 64 && rate > 0 && rate <= 768000 && [8, 16, 24, 32, 64].includes(bits));
      must(align === channels * bits / 8 && le32(b, s + 8) === rate * align);
      if (tag === 3) must(bits === 32 || bits === 64);
      if (tag === 0xfffe) {
        must(e - s >= 40 && le16(b, s + 16) >= 22 && le16(b, s + 16) === e - s - 18);
        const validBits = le16(b, s + 18), subtype = le32(b, s + 24);
        must(validBits > 0 && validBits <= bits && [1, 3].includes(subtype));
        const guidTail = [0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113];
        for (let i = 0; i < guidTail.length; i++) must(b[s + 28 + i] === guidTail[i]);
        if (subtype === 3) must((bits === 32 || bits === 64) && validBits === bits);
        const mask = le32(b, s + 20); let speakers = 0;
        for (let value = mask; value; value >>>= 1) speakers += value & 1;
        must(mask === 0 || speakers === channels);
      }
      else must(e - s === 16 || e - s >= 18 && le16(b, s + 16) === e - s - 18);
      fmt = true;
    } else if (t === 'data') { must(fmt && !data && e > s && (e - s) % align === 0); data = true; }
  });
  must(fmt && data);
}

function vint(b, p, end, id = false) {
  must(p < end && b[p] !== 0);
  let mask = 128, width = 1;
  while (!(b[p] & mask)) { mask >>= 1; width++; }
  must(width <= (id ? 4 : 8) && p + width <= end);
  let value = id ? b[p] : b[p] & (mask - 1), unknown = !id && value === mask - 1;
  for (let i = 1; i < width; i++) { value = value * 256 + b[p + i]; unknown &&= b[p + i] === 255; }
  must(unknown || Number.isSafeInteger(value));
  return { value, next: p + width, unknown };
}
// Known master levels stop an unknown-sized live Cluster at its next
// Segment-level sibling. Unknown leaf extensions remain opaque and bounded.
const SEGMENT_CHILDREN = new Set([0x114d9b74, 0x1549a966, 0x1654ae6b, 0x1f43b675, 0x1c53bb6b, 0x1254c367, 0x1043a770, 0x1941a469]);
const PARENTS = new Map([
  [0xae, [0x1654ae6b]], [0xe0, [0xae]], [0xe1, [0xae]], [0xa0, [0x1f43b675]],
  [0x4dbb, [0x114d9b74]], [0xbb, [0x1c53bb6b]], [0xb7, [0xbb]],
  [0x7373, [0x1254c367]], [0x67c8, [0x7373, 0x67c8]], [0x63c0, [0x7373]],
]);
function webm(b) {
  let p = 0, doc = false, segment = false, hasTracks = false, blocks = 0;
  const trackNumbers = new Set(), referencedTracks = new Set();
  const element = (at, end) => {
    const id = vint(b, at, end, true), size = vint(b, id.next, end);
    must(!size.unknown || [0x18538067, 0x1f43b675].includes(id.value));
    const e = size.unknown ? end : size.next + size.value;
    must(e <= end); return { id: id.value, s: size.next, e, unknown: size.unknown };
  };
  const uint = el => {
    must(el.e > el.s && el.e - el.s <= 8);
    let n = 0; for (let at = el.s; at < el.e; at++) n = n * 256 + b[at];
    must(Number.isSafeInteger(n)); return n;
  };
  const header = element(p, b.length); must(header.id === 0x1a45dfa3);
  for (p = header.s; p < header.e;) {
    const el = element(p, header.e);
    if (el.id === 0x4282) { must(!doc && el.e - el.s === 4 && text(b, el.s, 4) === 'webm'); doc = true; }
    p = el.e;
  }
  must(doc);
  const block = el => {
    const track = vint(b, el.s, el.e);
    must(Number.isSafeInteger(track.value) && track.value > 0 && track.next + 3 < el.e);
    referencedTracks.add(track.value);
    let at = track.next + 3;
    const lace = (b[track.next + 2] >> 1) & 3;
    if (lace) {
      const frames = b[at++] + 1; must(at < el.e);
      if (lace === 2) must((el.e - at) % frames === 0 && el.e - at >= frames);
      else {
        let total = 0, previous = 0;
        for (let i = 0; i < frames - 1; i++) {
          let size = 0;
          if (lace === 1) {
            let byte; do { must(at < el.e); byte = b[at++]; size += byte; } while (byte === 255);
          } else {
            const sizeVint = vint(b, at, el.e), width = sizeVint.next - at;
            must(Number.isSafeInteger(sizeVint.value));
            size = i === 0 ? sizeVint.value : previous + sizeVint.value - (2 ** (7 * width - 1) - 1);
            at = sizeVint.next;
          }
          must(size > 0 && Number.isSafeInteger(size)); total += size; previous = size;
        }
        must(total < el.e - at);
      }
    }
    blocks++;
  };
  const walk = (s, end, parent, depth, unknown = false) => {
    must(depth <= 16);
    let number = null, type = null, codec = null, entries = 0;
    for (let at = s; at < end;) {
      const el = element(at, end);
      if (SEGMENT_CHILDREN.has(el.id)) {
        if (parent === 0x1f43b675 && unknown) return at;
        must(parent === 0x18538067);
      }
      must(el.id !== 0x18538067 && el.id !== 0x1a45dfa3);
      if (PARENTS.has(el.id)) must(PARENTS.get(el.id).includes(parent));
      if (el.id === 0xbf) must(el.e - el.s === 4);
      if ([0xd7, 0x83, 0x86].includes(el.id)) {
        must(parent === 0xae);
        if (el.id === 0xd7) { must(number === null); number = uint(el); must(number > 0 && !trackNumbers.has(number)); }
        if (el.id === 0x83) { must(type === null); type = uint(el); must([1, 2, 17].includes(type)); }
        if (el.id === 0x86) {
          must(codec === null && el.e > el.s && el.e - el.s <= 128);
          for (let i = el.s; i < el.e; i++) must(b[i] >= 33 && b[i] <= 126);
          codec = text(b, el.s, el.e - el.s);
        }
      }
      if (el.id === 0xa3 || el.id === 0xa1) { must(parent === (el.id === 0xa3 ? 0x1f43b675 : 0xa0)); block(el); }
      if (el.id === 0x1654ae6b) { must(!hasTracks); hasTracks = true; }
      if (el.id === 0xae) entries++;
      let next = el.e;
      if (SEGMENT_CHILDREN.has(el.id) || PARENTS.has(el.id)) next = walk(el.s, el.e, el.id, depth + 1, el.unknown);
      at = next;
    }
    if (parent === 0xae) {
      must(number !== null && type !== null && codec !== null && codec.startsWith(type === 1 ? 'V_' : type === 2 ? 'A_' : 'S_'));
      trackNumbers.add(number);
    }
    if (parent === 0x1654ae6b) must(entries > 0);
    return end;
  };
  for (p = header.e; p < b.length;) {
    const el = element(p, b.length);
    if (el.id === 0x18538067) { must(!segment); segment = true; walk(el.s, el.e, el.id, 0); }
    else must(el.id === 0xec);
    p = el.e;
  }
  must(segment && hasTracks && blocks > 0);
  for (const number of referencedTracks) must(trackNumbers.has(number));
}

function mp3(b) {
  let p = 0, frames = 0, version, rate;
  if (text(b, 0, 3) === 'ID3') {
    must(b.length >= 10 && [2, 3, 4].includes(b[3]) && b[4] !== 255 && (b[5] & (b[3] === 2 ? 0x3f : b[3] === 3 ? 0x1f : 0x0f)) === 0);
    let n = 0; for (let i = 6; i < 10; i++) { must(b[i] < 128); n = n * 128 + b[i]; }
    p = 10 + n;
    if (b[3] === 4 && (b[5] & 0x10)) { must(p + 10 <= b.length && text(b, p, 3) === '3DI'); for (let i = 3; i < 10; i++) must(b[p + i] === b[i]); p += 10; }
    must(p < b.length);
  }
  const v1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const v2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  while (p < b.length) {
    if (frames && p + 128 === b.length && text(b, p, 3) === 'TAG') { p += 128; break; }
    must(p + 4 <= b.length && b[p] === 255 && (b[p + 1] & 0xe0) === 0xe0);
    const v = (b[p + 1] >> 3) & 3, layer = (b[p + 1] >> 1) & 3, index = b[p + 2] >> 4, sampling = (b[p + 2] >> 2) & 3;
    must(v !== 1 && layer === 1 && index > 0 && index < 15 && sampling < 3 && (b[p + 3] & 3) !== 2);
    const hz = [44100, 48000, 32000][sampling] / (v === 3 ? 1 : v === 2 ? 2 : 4);
    if (frames) must(version === v && rate === hz); else { version = v; rate = hz; }
    const size = Math.floor((v === 3 ? 144000 : 72000) * (v === 3 ? v1 : v2)[index] / hz) + ((b[p + 2] >> 1) & 1);
    must(size >= 4 && p + size <= b.length); p += size; frames++;
  }
  must(frames > 0 && p === b.length);
}

/** Només una vista de bytes: no còpia de vídeos de 20 MB. */
export function validaContenidorMedia(bytes, mime) {
  must(bytes instanceof Uint8Array && bytes.length > 0 && bytes.length <= MAX_BYTES && typeof mime === 'string');
  let format;
  if (['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
    // Reutilitza estructura/CRC canònics; el transport aplica el sostre
    // públic/privat corresponent abans de llegir o enviar els bytes.
    try { validaEstructuraImatge(bytes, mime); } catch { fail(); }
    format = mime.slice(6);
  } else if (['video/mp4', 'audio/mp4', 'video/quicktime'].includes(mime)) { mp4(bytes); format = 'mp4'; }
  else if (['video/webm', 'audio/webm'].includes(mime)) { webm(bytes); format = 'webm'; }
  else if (['audio/wav', 'audio/wave', 'audio/x-wav'].includes(mime)) { wav(bytes); format = 'wav'; }
  else if (['audio/mpeg', 'audio/mp3'].includes(mime)) { mp3(bytes); format = 'mp3'; }
  else fail();
  return Object.freeze({ format, mime, bytes: bytes.length });
}

/** Porta de pujada per als set formats validats; el propietari comprova la
 * sessió després de l'await i abans de reservar/enviar cap byte remot. */
export async function validaFitxerMedia(fitxer, { signal } = {}) {
  must(fitxer instanceof Blob && fitxer.size > 0 && fitxer.size <= MAX_BYTES);
  if (signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  const reading = typeof fitxer.arrayBuffer === 'function' ? fitxer.arrayBuffer() : new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(fitxer);
  });
  const buffer = await new Promise((resolve, reject) => {
    const cancel = () => { signal?.removeEventListener('abort', cancel); reject(new DOMException('Operació cancel·lada.', 'AbortError')); };
    signal?.addEventListener('abort', cancel, { once: true });
    Promise.resolve(reading).then(resolve, reject).finally(() => signal?.removeEventListener('abort', cancel));
    if (signal?.aborted) cancel();
  });
  return validaContenidorMedia(new Uint8Array(buffer), fitxer.type);
}
