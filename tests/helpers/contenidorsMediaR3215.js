// Independent libavif/Pillow12.2 encoded 8x8 RGB fixture.
export const AVIF_REAL = Uint8Array.from(atob('AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAJgAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAACAAAAAgAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAALm1kYXQSAAoIGAi/aICGg0IyGBTHh4ZlAgggnkAAAJBLsrmsYMeLcEZaTg=='), c => c.charCodeAt(0));
import { deflateSync } from 'node:zlib';
export const ascii = text => Uint8Array.from(text, c => c.charCodeAt(0));
export const join = (...parts) => Uint8Array.from(parts.flatMap(value => [...value]));
const u32 = (n, little = false) => { const out = new Uint8Array(4); new DataView(out.buffer).setUint32(0, n, little); return out; };
export function oggPage(payload, flags, { sequence = 0, serial = 3215, granule = 0n, laces = [payload.length] } = {}) {
  const out = join(ascii('OggS'), [0, flags], new Uint8Array(8), u32(serial, true), u32(sequence, true), u32(0), [laces.length], laces, payload);
  new DataView(out.buffer).setBigUint64(6, granule, true);
  // Separate bit-at-a-time oracle; production uses a lookup table.
  let crc = 0;
  for (const byte of out) { crc ^= byte << 24; for (let bit = 0; bit < 8; bit++) crc = (crc << 1) ^ (crc < 0 ? 0x04c11db7 : 0); }
  new DataView(out.buffer).setUint32(22, crc >>> 0, true); return out;
}
export const ogg = () => join(
  oggPage(join(ascii('OpusHead'), [1, 1, 0, 0], u32(48000, true), [0, 0, 0]), 2),
  oggPage(join(ascii('OpusTags'), u32(0), u32(0)), 0, { sequence: 1 }),
  oggPage([0xf8, 0xff, 0xfe], 4, { sequence: 2, granule: 960n })
);
export function protectedMp3({ version = 3, mono = false } = {}) {
  const hz = 44100 / (version === 3 ? 1 : version === 2 ? 2 : 4), bitrate = version === 3 ? 128 : 80;
  const frame = new Uint8Array(Math.floor((version === 3 ? 144000 : 72000) * bitrate / hz));
  frame.set([255, 0xe2 | version << 3, 0x90, mono ? 0xc0 : 0]);
  const side = version === 3 ? mono ? 17 : 32 : mono ? 9 : 17;
  let crc = 0xffff;
  for (const byte of [frame[2], frame[3], ...frame.subarray(6, 6 + side)]) for (let bit = 7; bit >= 0; bit--) {
    const carry = (crc >>> 15) ^ ((byte >>> bit) & 1); crc = (crc << 1) & 0xffff; if (carry) crc ^= 0x8005;
  }
  frame[4] = crc >>> 8; frame[5] = crc & 255; return frame;
}
export function pdf({ extra = '', content = 'q Q', indirect = false, filter = '' } = {}) {
  const bytes = content instanceof Uint8Array ? content : ascii(content);
  const data = [ascii('<< /Type /Catalog /Pages 2 0 R ' + extra + ' >>'), ascii('<< /Type /Pages /Count 1 /Kids [3 0 R] >>'), ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 10 10] /Resources << >> /Contents 4 0 R >>'), join(ascii(`<< /Length ${indirect ? '5 0 R' : bytes.length} ${filter} >>\nstream\n`), bytes, ascii('\nendstream'))];
  if (indirect) data.push(ascii(String(bytes.length)));
  let out = ascii('%PDF-1.7\n%\x80\x81\x82\x83\n'); const offsets = [0];
  for (let i = 0; i < data.length; i++) { offsets.push(out.length); out = join(out, ascii(`${i + 1} 0 obj\n`), data[i], ascii('\nendobj\n')); }
  const xref = out.length;
  out = join(out, ascii(`xref\n0 ${data.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${data.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return out;
}
export function pdfObjectStream({ body = '<< /Note (/JS is literal text) >>', flate = true, bomb = false, predictor = false } = {}) {
  let out = ascii('%PDF-1.7\n'); const offsets = [0];
  const add = (id, data) => { offsets[id] = out.length; out = join(out, ascii(`${id} 0 obj\n`), data, ascii('\nendobj\n')); };
  add(1, ascii('<< /Type /Catalog /Pages 2 0 R >>')); add(2, ascii('<< /Type /Pages /Count 0 /Kids [] >>'));
  const original = ascii('4 0 ' + (bomb ? ' '.repeat(2000000) + body : body)), encoded = flate ? deflateSync(original) : original;
  add(3, join(ascii(`<< /Type /ObjStm /N 1 /First 4 /Length ${encoded.length} ${flate ? '/Filter /FlateDecode' : ''} >>\nstream\n`), encoded, ascii('\nendstream')));
  offsets[5] = out.length;
  let rows = join([0], u32(0), [255, 255], ...[1, 2, 3].map(id => join([1], u32(offsets[id]), [0, 0])), [2], u32(3), [0, 0], [1], u32(offsets[5]), [0, 0]);
  let parms = '';
  if (predictor) {
    const predicted = []; for (let i = 0; i < rows.length; i += 7) predicted.push(2, ...rows.subarray(i, i + 7).map((v, j) => (v - (i ? rows[i - 7 + j] : 0)) & 255));
    rows = deflateSync(Uint8Array.from(predicted)); parms = '/Filter /FlateDecode /DecodeParms << /Predictor 12 /Columns 7 >>';
  }
  add(5, join(ascii(`<< /Type /XRef /Size 6 /Root 1 0 R /W [1 4 2] /Length ${rows.length} ${parms} >>\nstream\n`), rows, ascii('\nendstream')));
  return join(out, ascii(`startxref\n${offsets[5]}\n%%EOF\n`));
}

export const AVIF_SEQUENCE_REAL = Uint8Array.from(atob('AAAALGZ0eXBhdmlzAAAAAGF2aWZhdmlzbXNmMWlzbzhtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAPlAAAAIgAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAACAAAAAgAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAACxm1vb3YAAAB4bXZoZAEAAAAAAAAA5yTWagAAAADnJNZqAAAD6P//////////AAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAJGdHJhawAAAGh0a2hkAQAAAQAAAADnJNZqAAAAAOck1moAAAABAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAAALGVkdHMAAAAkZWxzdAEAAAEAAAABAAAAAAAAAMgAAAAAAAAAAAABAAAAAAGqbWRpYQAAACxtZGhkAQAAAAAAAADnJNZqAAAAAOck1moAAAPoAAAAAAAAAMhVxAAAAAAAIWhkbHIAAAAAAAAAAHBpY3QAAAAAAAAAAAAAAAAAAAABVW1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAARVzdGJsAAAAlXN0c2QAAAAAAAAAAQAAAIVhdjAxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABCkFPTSBDb2RpbmcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABBjY3N0AAAAAHwAAAAAAAAYc3R0cwAAAAAAAAABAAAAAgAAAGQAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAIAAAABAAAAHHN0c3oAAAAAAAAAAAAAAAIAAAAiAAAAHgAAABRzdGNvAAAAAAAAAAEAAAPlAAAAFHN0c3MAAAAAAAAAAQAAAAEAAABIbWRhdBIACgwAAAABF+bXzICGg0IyEBAAoAAAAkAAAAB5TNLoHcUSADIaMAPAgAAARqAAAAJAAACAAB7l/PBHeQ/nqog='), c => c.charCodeAt(0));
export function avifWithProperty(type, payload, essential = true) {
  const box = (type, data) => join(u32(data.length + 8), ascii(type), data);
  const ipco = box('ipco', join(AVIF_REAL.subarray(177, 244), box(type, payload)));
  const ipma = box('ipma', join(AVIF_REAL.subarray(252, 262), [5], AVIF_REAL.subarray(263, 267), [essential ? 0x85 : 5]));
  const meta = box('meta', join(AVIF_REAL.subarray(40, 161), box('iprp', join(ipco, ipma))));
  const result = join(AVIF_REAL.subarray(0, 32), meta, AVIF_REAL.subarray(267));
  new DataView(result.buffer).setUint32(113, result.length - 38); return result;
}
