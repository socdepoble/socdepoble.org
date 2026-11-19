import { PNG_NET, JPEG_NET, WEBP_NET } from './mitjansPublicsNets.js';
const ascii = s => Uint8Array.from(s, c => c.charCodeAt(0));
const join = (...parts) => Uint8Array.from(parts.flatMap(p => [...p]));
const u32 = (n, le = false) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, le); return b; };
const box = (t, p) => join(u32(8 + p.length), ascii(t), p);
const riff = (t, p) => join(ascii('RIFF'), u32(4 + p.length, true), ascii(t), p);
const chunk = (t, p) => join(ascii(t), u32(p.length, true), p, p.length % 2 ? [0] : []);
const eb = (id, p) => join(id, [0x80 + p.length], p);
const movieHeader = new Uint8Array(100); movieHeader.set(u32(1000), 12);
const mvhd = box('mvhd', movieHeader);
const trackHeader = new Uint8Array(84); trackHeader.set(u32(1), 12);
const mediaHeader = new Uint8Array(24); mediaHeader.set(u32(1000), 12);
const handler = new Uint8Array(24); handler.set(ascii('vide'), 8);
const track = box('trak', join(box('tkhd', trackHeader), box('mdia', join(box('mdhd', mediaHeader), box('hdlr', handler), box('minf', box('stbl', []))))));
const mp4 = tail => join(box('ftyp', join(ascii('isom'), u32(0), ascii('mp42'))), ...(tail ? [box('mdat', [1]), box('moov', join(mvhd, track))] : [box('moov', join(mvhd, track)), box('mdat', [1])]));
const frame = () => { const b = new Uint8Array(417); b.set([0xff, 0xfb, 0x90, 0]); return b; };
const wav = () => { const f = new Uint8Array(16), d = new DataView(f.buffer); d.setUint16(0, 1, true); d.setUint16(2, 1, true); d.setUint32(4, 8000, true); d.setUint32(8, 16000, true); d.setUint16(12, 2, true); d.setUint16(14, 16, true); return riff('WAVE', join(chunk('fmt ', f), chunk('data', [0, 0]))); };
const webm = () => join(eb([0x1a, 0x45, 0xdf, 0xa3], eb([0x42, 0x82], ascii('webm'))), eb([0x18, 0x53, 0x80, 0x67], join(eb([0x16, 0x54, 0xae, 0x6b], eb([0xae], join(eb([0xd7], [1]), eb([0x83], [2]), eb([0x86], ascii('A_OPUS'))))), eb([0x1f, 0x43, 0xb6, 0x75], eb([0xa3], [0x81, 0, 0, 0x80, 1])))));
const jpeg = () => join([255, 216, 255, 192, 0, 11, 8, 0, 1, 0, 1, 1, 1, 0x11, 0, 255, 218, 0, 8, 1, 1, 0, 0, 63, 0, 1, 255, 217]);
const webp = () => riff('WEBP', chunk('VP8L', [0x2f, 0, 0, 0, 0, 0]));
const png = () => PNG_NET.slice();
const fixtures = [['video/mp4', () => mp4(false)], ['audio/mp4', () => mp4(true)], ['video/webm', webm], ['audio/wav', wav], ['audio/mpeg', frame], ['image/jpeg', jpeg], ['image/webp', webp], ['image/png', png]];

// VP8 real seguit d'un chunk opac legal; es preserva la mida per a les proves
// de pressupost de transport, sense haver d'inventar pixels o falsificar MIME.
const webpDeMida = n => {
  if (n <= WEBP_NET.length) return WEBP_NET.slice();
  const total = Math.max(n + (n & 1), WEBP_NET.length + 8);
  const bytes = new Uint8Array(total); bytes.set(WEBP_NET);
  bytes.set(ascii('JUNK'), WEBP_NET.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, total - 8, true);
  view.setUint32(WEBP_NET.length + 4, total - WEBP_NET.length - 8, true);
  return bytes;
};
const mp4DeMida = n => { const head = mp4(false); return join(head, box('free', new Uint8Array(n - head.length - 8))); };
const jpegDeMida = n => { const size = n - JPEG_NET.length - 2; return join(JPEG_NET.subarray(0, 2), [255, 254, size >> 8, size & 255], new Uint8Array(size - 2), JPEG_NET.subarray(2)); };
export { ascii, join, u32, box, mp4, wav, webm, jpeg, webp, png, frame, fixtures, mp4DeMida, jpegDeMida, webpDeMida };
