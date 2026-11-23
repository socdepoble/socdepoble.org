/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Gauntlet R1 del carril A (P2) · MP4 sintètics com els que ix de
   MediaRecorder a Chromium (fragmentat: moov amb mvex, parelles moof + mdat i un mfra amb tfra al final) i un MP4 pla
   (taules stco o co64 que apunten a les mostres), amb les capçaleres que validaFitxerMedia exigix. Per a les proves
   de src/utils/ubicacioMp4.js i de la preparació dels adjunts del xat. */
import { ascii, box, join, u32 } from './contenidorsMedia.js';

const u64 = (n) => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, BigInt(n)); return b; };
const ambValor = (n, valor, pos) => { const d = new Uint8Array(n); new DataView(d.buffer).setUint32(pos, valor); return d; };
const hdlr = (handler) => { const d = new Uint8Array(24); d.set(ascii(handler), 8); return box('hdlr', d); };
const taula = (tipus, valors) => box(tipus, join(u32(0), u32(valors.length), ...valors.map((v) => (tipus === 'co64' ? u64(v) : u32(v)))));
const trak = (handler, id, stco = taula('stco', [])) => box('trak', join(box('tkhd', ambValor(84, id, 12)),
  box('mdia', join(box('mdhd', ambValor(24, 1000, 12)), hdlr(handler), box('minf', box('stbl', stco))))));
const FTYP = box('ftyp', join(ascii('iso5'), u32(512), ascii('iso5'), ascii('iso6'), ascii('mp41')));
const MVHD = box('mvhd', ambValor(100, 1000, 12));

/** Les caixes de primer nivell: [{ tipus, inici, fi }]. */
export function caixesPrimerNivell(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), r = [];
  for (let p = 0; p + 8 <= bytes.length;) {
    const mida = v.getUint32(p) || bytes.length - p;
    r.push({ tipus: String.fromCharCode(...bytes.subarray(p + 4, p + 8)), inici: p, fi: p + mida });
    p += mida;
  }
  return r;
}

/** Els moof_offset de cada tfra del mfra. */
export function offsetsTfra(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const mfra = caixesPrimerNivell(bytes).find((c) => c.tipus === 'mfra');
  if (!mfra) return [];
  const r = [];
  for (let p = mfra.inici + 8; p < mfra.fi;) {
    const mida = v.getUint32(p);
    if (String.fromCharCode(...bytes.subarray(p + 4, p + 8)) === 'tfra') {
      const versio = bytes[p + 8], ample = versio === 1 ? 8 : 4, mides = v.getUint32(p + 16), n = v.getUint32(p + 20);
      const pas = 2 * ample + ((mides >> 4) & 3) + ((mides >> 2) & 3) + (mides & 3) + 3;
      for (let i = 0; i < n; i += 1) {
        const q = p + 24 + i * pas + ample;
        r.push(ample === 8 ? Number(v.getBigUint64(q)) : v.getUint32(q));
      }
    }
    p += mida;
  }
  return r;
}

/** Un MP4 fragmentat de Chromium: vídeo i so, dos fragments i el mfra. `base`: els tfhd porten base_data_offset
 * (l'inici del seu moof) en lloc de default-base-is-moof. `tfraVersio` 0 o 1. `udta`: una caixa udta dins del moov. */
export function mp4Fragmentat({ base = false, tfraVersio = 1, udta = null, mostres = ['MOSTRES-1-AMB-SO', 'MOSTRES-2-AMB-SO'], extraPrimerNivell = null } = {}) {
  const moov = box('moov', join(MVHD, trak('vide', 1), trak('soun', 2), box('mvex', box('trex', new Uint8Array(24))), ...(udta ? [udta] : [])));
  const moof = (seq, inici) => box('moof', join(box('mfhd', join(u32(0), u32(seq))),
    box('traf', join(box('tfhd', base ? join(u32(0x000001), u32(1), u64(inici)) : join(u32(0x020000), u32(1))),
      box('tfdt', join(u32(0x01000000), u64(0))), box('trun', join(u32(1), u32(0)))))));
  const parts = [FTYP, moov, ...(extraPrimerNivell ? [extraPrimerNivell] : [])];
  const offsets = [];
  let pos = parts.reduce((n, p) => n + p.length, 0);
  mostres.forEach((text, i) => {
    offsets.push(pos);
    const m = moof(i + 1, pos), d = box('mdat', ascii(text));
    parts.push(m, d); pos += m.length + d.length;
  });
  const entrades = offsets.map((o, i) => (tfraVersio === 1 ? join(u64(i * 1000), u64(o)) : join(u32(i * 1000), u32(o))));
  const tfra = box('tfra', join(Uint8Array.of(tfraVersio, 0, 0, 0), u32(1), u32(0), u32(offsets.length), ...entrades.map((e) => join(e, Uint8Array.of(1, 1, 1)))));
  const midaMfra = 8 + tfra.length + 16;
  parts.push(box('mfra', join(tfra, box('mfro', join(u32(0), u32(midaMfra))))));
  return { blob: new Blob(parts, { type: 'video/mp4' }), offsetsMoof: offsets };
}

/** Un MP4 pla: les taules (stco o co64) apunten a l'inici de cada mostra dins de l'mdat. `moovAlFinal`: mdat primer. */
export function mp4Pla({ co64 = false, moovAlFinal = false, mostres = ['MOSTRA-A', 'MOSTRA-B', 'MOSTRA-C'] } = {}) {
  const tipus = co64 ? 'co64' : 'stco';
  const mdat = box('mdat', ascii(mostres.join('')));
  const moov = (valors) => box('moov', join(MVHD, trak('vide', 1, taula(tipus, valors)), trak('soun', 2)));
  const relatius = mostres.reduce((r, m, i) => [...r, i ? r[i - 1] + mostres[i - 1].length : 0], []);
  const provisional = moov(relatius);
  const iniciMdat = FTYP.length + (moovAlFinal ? 0 : provisional.length) + 8;
  const valors = relatius.map((r) => iniciMdat + r);
  const parts = moovAlFinal ? [FTYP, mdat, moov(valors)] : [FTYP, moov(valors), mdat];
  return { blob: new Blob(parts, { type: 'video/mp4' }), valors, mostres };
}

/** Les entrades de la primera taula stco/co64 del moov. */
export function valorsTaula(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let p = 0; p + 8 <= bytes.length; p += 1) {
    const t = String.fromCharCode(...bytes.subarray(p + 4, p + 8));
    if (t !== 'stco' && t !== 'co64') continue;
    const n = v.getUint32(p + 12);
    if (!n) continue;
    return Array.from({ length: n }, (_, i) => (t === 'co64' ? Number(v.getBigUint64(p + 16 + i * 8)) : v.getUint32(p + 16 + i * 4)));
  }
  return [];
}
export { u64 };
