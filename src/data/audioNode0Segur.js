/** R32.11 · Perfil d'admissió Node0, sense decode ni transformació d'àudio.
 * Política explícita:8MiB/bloc i4096fragments de transport (també els buits).
 * Els4slots del consumidor limiten Blobs en memòria, no la RAM total del procés.
 * RIFF/WAVE PCM/float (també extensible) i MPEG LayerIII amb frames complets.
 * Fonts primàries: Microsoft RIFF/WAVEFORMATEX; FFmpeg MPEG header formulae;
 * ID3.org v2.3/v2.4. No acredita audibilitat, qualitat ni consentiment de veu.
 */
export const MAX_BYTES_AUDIO_NODE0 = 8 * 1024 * 1024;
export const MAX_FRAGMENTS_AUDIO_NODE0 = 4096;
const WAV = new Set(['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave']);
const invalid = () => Object.assign(new Error('El contenidor d’àudio del Node0 no és admés.'), { code: 'AUDIO_NODE0_INVALID' });
const limit = () => Object.assign(new RangeError('L’àudio del Node0 supera el pressupost de lectura.'), { code: 'AUDIO_NODE0_LIMIT' });
const aborted = () => Object.assign(new Error('Lectura d’àudio aturada.'), { name: 'AbortError', code: 'AUDIO_NODE0_ABORTED' });
const ascii = (b, start, size) => String.fromCharCode(...b.subarray(start, start + size));
const byteView = b => ArrayBuffer.isView(b) && Object.prototype.toString.call(b) === '[object Uint8Array]';
function mimeOf(value) {
  if (typeof value !== 'string' || value.length > 256) throw invalid();
  const mime = value.split(';', 1)[0].trim().toLowerCase();
  if (!WAV.has(mime) && mime !== 'audio/mpeg') throw invalid();
  return mime;
}
function wave(b) {
  if (b.length < 44 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WAVE') throw invalid();
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (view.getUint32(4, true) + 8 !== b.length) throw invalid();
  let offset = 12, chunks = 0, format = null, dataBytes = null;
  while (offset < b.length) {
    if (++chunks > MAX_FRAGMENTS_AUDIO_NODE0) throw limit();
    if (offset + 8 > b.length) throw invalid();
    const id = ascii(b, offset, 4), size = view.getUint32(offset + 4, true), start = offset + 8;
    const end = start + size, next = end + (size & 1);
    if (end > b.length || next > b.length) throw invalid();
    if (id === 'fmt ') {
      if (format || dataBytes !== null || size < 16 || size === 17) throw invalid();
      let tag = view.getUint16(start, true);
      const channels = view.getUint16(start + 2, true), sampleRate = view.getUint32(start + 4, true);
      const bytesPerSecond = view.getUint32(start + 8, true), blockAlign = view.getUint16(start + 12, true), bits = view.getUint16(start + 14, true);
      if (size >= 18 && view.getUint16(start + 16, true) + 18 !== size) throw invalid();
      if (tag === 0xfffe) {
        if (size < 40 || view.getUint16(start + 16, true) < 22) throw invalid();
        const validBits = view.getUint16(start + 18, true);
        if (!validBits || validBits > bits || ascii(b, start + 28, 12) !== '\u0000\u0000\u0010\u0000\u0080\u0000\u0000\u00aa\u0000\u0038\u009b\u0071') throw invalid();
        tag = view.getUint32(start + 24, true);
      }
      if (![1, 3].includes(tag) || !channels || !sampleRate
        || !(tag === 1 ? [8, 16, 24, 32] : [32, 64]).includes(bits)
        || blockAlign !== channels * bits / 8 || bytesPerSecond !== sampleRate * blockAlign) throw invalid();
      format = { container: 'wav', format: tag === 1 ? 'pcm' : 'float', channels, sampleRate, bitsPerSample: bits, blockAlign };
    } else if (id === 'data') {
      if (!format || dataBytes !== null || !size || size % format.blockAlign) throw invalid();
      dataBytes = size;
    }
    offset = next;
  }
  if (!format || dataBytes === null || offset !== b.length) throw invalid();
  return Object.freeze({ ...format, dataBytes });
}

// Standard bitrate/frequency numbers, not copied decoder code. VBR is allowed.
const BITRATE_1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATE_2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
function mpegFrame(b, offset) {
  if (offset + 4 > b.length || b[offset] !== 255 || (b[offset + 1] & 0xe0) !== 0xe0) throw invalid();
  const versionBits = (b[offset + 1] >> 3) & 3, layer = (b[offset + 1] >> 1) & 3;
  const rateIndex = b[offset + 2] >> 4, frequency = (b[offset + 2] >> 2) & 3;
  if (versionBits === 1 || layer !== 1 || !rateIndex || rateIndex === 15 || frequency === 3 || (b[offset + 3] & 3) === 2) throw invalid();
  const version = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 2.5;
  const sampleRate = [44100, 48000, 32000][frequency] / (version === 1 ? 1 : version === 2 ? 2 : 4);
  const bitrate = (version === 1 ? BITRATE_1 : BITRATE_2)[rateIndex] * 1000;
  const size = Math.floor((version === 1 ? 144 : 72) * bitrate / sampleRate) + ((b[offset + 2] >> 1) & 1);
  if (size < 6 || offset + size > b.length) throw invalid();
  return { version, layer: 3, sampleRate, size };
}
function mpeg(b) {
  let offset = 0;
  if (ascii(b, 0, 3) === 'ID3') {
    if (b.length < 10 || ![3, 4].includes(b[3]) || b[4] !== 0 || (b[5] & (b[3] === 4 ? 0x0f : 0x1f))) throw invalid();
    let size = 0;
    for (let i = 6; i < 10; i++) { if (b[i] & 0x80) throw invalid(); size = size * 128 + b[i]; }
    const footer = b[3] === 4 && Boolean(b[5] & 0x10);
    offset = 10 + size + (footer ? 10 : 0);
    if (offset > b.length) throw invalid();
    if (footer && (ascii(b, offset - 10, 3) !== '3DI' || b.subarray(offset - 7, offset).some((v, i) => v !== b[i + 3]))) throw invalid();
  }
  let first = null, frames = 0;
  while (offset < b.length) {
    if (b.length - offset === 128 && ascii(b, offset, 3) === 'TAG') { offset += 128; break; }
    const frame = mpegFrame(b, offset);
    if (first && (frame.version !== first.version || frame.sampleRate !== first.sampleRate)) throw invalid();
    first ||= frame; frames++; offset += frame.size;
  }
  // Two complete consecutive headers reduce accidental magic-byte acceptance.
  if (!first || frames < 2 || offset !== b.length) throw invalid();
  return Object.freeze({ container: 'mpeg', version: first.version, layer: 3, sampleRate: first.sampleRate, frames });
}

/** Closed structural profile; no decoder, waveform analysis or byte rewriting. */
export function identificaAudioNode0(bytes, mime) {
  if (!byteView(bytes) || !bytes.byteLength) throw invalid();
  if (bytes.byteLength > MAX_BYTES_AUDIO_NODE0) throw limit();
  return WAV.has(mimeOf(mime)) ? wave(bytes) : mpeg(bytes);
}

const ignoreCancellation = fn => { try { Promise.resolve(fn()).catch(() => {}); } catch { /* best effort after failure */ } };
/** Consume at most8MiB before concatenation, with bounded work even for empty
 * chunks. A transport ignoring abort cannot leave this promise pending.
 * Content-Length is only an early refusal; streamed bytes are authoritative.
 */
export async function llegeixAudioNode0(response, { signal, maxBytes = MAX_BYTES_AUDIO_NODE0 } = {}) {
  let reader, complete = false, cancelled = false;
  const cancelRead = () => {
    if (cancelled) return;
    cancelled = true;
    ignoreCancellation(() => reader ? reader.cancel() : response?.body?.cancel?.());
  };
  try {
    if (signal?.aborted) throw aborted();
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES_AUDIO_NODE0) throw limit();
    if (response?.ok !== true) throw invalid();
    const contentType = response.headers?.get?.('content-type'); mimeOf(contentType);
    const declared = response.headers?.get?.('content-length');
    if (typeof declared === 'string' && /^\d{1,20}$/.test(declared) && BigInt(declared) > BigInt(maxBytes)) throw limit();
    if (typeof response.body?.getReader !== 'function') throw invalid();
    reader = response.body.getReader();
    let rejectAbort;
    const cancellation = new Promise((_resolve, reject) => { rejectAbort = reject; });
    const onAbort = () => { rejectAbort(aborted()); cancelRead(); };
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      if (signal?.aborted) throw aborted();
      const chunks = []; let bytes = 0, count = 0;
      while (true) {
        const part = await Promise.race([reader.read(), cancellation]);
        if (signal?.aborted) throw aborted();
        if (part.done) break;
        if (++count > MAX_FRAGMENTS_AUDIO_NODE0) throw limit();
        if (!byteView(part.value)) throw invalid();
        if (part.value.byteLength > maxBytes - bytes) throw limit();
        bytes += part.value.byteLength;
        if (part.value.byteLength) chunks.push(part.value.slice());
      }
      if (!bytes) throw invalid();
      const joined = new Uint8Array(bytes); let offset = 0;
      for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
      identificaAudioNode0(joined, contentType);
      if (signal?.aborted) throw aborted();
      const blob = new Blob([joined], { type: contentType }); complete = true;
      return blob;
    } finally { signal?.removeEventListener('abort', onAbort); }
  } finally {
    if (!complete) cancelRead();
    if (reader) { try { reader.releaseLock(); } catch { /* pending foreign read may retain its own lock */ } }
  }
}
