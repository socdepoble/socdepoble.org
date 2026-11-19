// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import { identificaAudioNode0, llegeixAudioNode0, MAX_BYTES_AUDIO_NODE0, MAX_FRAGMENTS_AUDIO_NODE0 } from './audioNode0Segur.js';
const ascii = (bytes, offset, text) => { for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i); };
function wav({ rate = 22050, channels = 1, bits = 16, tag = 1, extensible = false, junk = false, samples = 4 } = {}) {
  const fmtSize = extensible ? 40 : tag === 3 ? 18 : 16, dataSize = samples * channels * bits / 8;
  const bytes = new Uint8Array(12 + 8 + fmtSize + (junk ? 10 : 0) + 8 + dataSize + (dataSize & 1)), view = new DataView(bytes.buffer);
  ascii(bytes, 0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); ascii(bytes, 8, 'WAVE'); ascii(bytes, 12, 'fmt '); view.setUint32(16, fmtSize, true);
  view.setUint16(20, extensible ? 0xfffe : tag, true); view.setUint16(22, channels, true); view.setUint32(24, rate, true); view.setUint32(28, rate * channels * bits / 8, true); view.setUint16(32, channels * bits / 8, true); view.setUint16(34, bits, true);
  if (fmtSize >= 18) view.setUint16(36, fmtSize - 18, true);
  if (extensible) { view.setUint16(38, bits, true); view.setUint32(44, tag, true); bytes.set([0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113], 48); }
  let offset = 20 + fmtSize;
  if (junk) { ascii(bytes, offset, 'JUNK'); view.setUint32(offset + 4, 1, true); bytes[offset + 8] = 99; offset += 10; }
  ascii(bytes, offset, 'data'); view.setUint32(offset + 4, dataSize, true);
  return bytes;
}
function frame({ version = 1, bitrateIndex = 9, padding = 0, frequency = 0 } = {}) {
  const bitrate = (version === 1 ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160])[bitrateIndex] * 1000;
  const rate = [44100, 48000, 32000][frequency] / (version === 1 ? 1 : version === 2 ? 2 : 4);
  const bytes = new Uint8Array(Math.floor((version === 1 ? 144 : 72) * bitrate / rate) + padding);
  bytes.set([255, 0xe3 | ((version === 1 ? 3 : version === 2 ? 2 : 0) << 3), (bitrateIndex << 4) | (frequency << 2) | (padding << 1), 0]); return bytes;
}
const join = (...parts) => { const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; } return bytes; };
const mp3 = () => join(frame(), frame({ bitrateIndex: 10, padding: 1 }));
function response(chunks, { type = 'audio/wav', length = null } = {}) {
  let index = 0;
  const reader = { read: vi.fn(async () => index < chunks.length ? { value: chunks[index++], done: false } : { done: true }), cancel: vi.fn(async () => {}), releaseLock: vi.fn() };
  const headers = new Headers({ 'content-type': type }); if (length !== null) headers.set('content-length', String(length));
  const body = { getReader: vi.fn(() => reader), cancel: vi.fn(async () => {}) };
  return { ok: true, headers, body, reader, blob: vi.fn(() => { throw new Error('unbounded blob forbidden'); }) };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test.each([[8000, 1, 8, 1], [22050, 1, 16, 1], [44100, 2, 24, 1], [48000, 2, 32, 1], [16000, 1, 32, 3], [96000, 2, 64, 3]])('WAV profile admits native rate/channel/bit layout %s/%s/%s/%s without a fixed44.1k rule', async (rate, channels, bits, tag) => {
  const bytes = wav({ rate, channels, bits, tag, junk: true }), original = bytes.slice();
  expect(identificaAudioNode0(bytes, 'audio/wav')).toMatchObject({ container: 'wav', sampleRate: rate, channels, bitsPerSample: bits });
  const r = response([bytes.subarray(0, 17), bytes.subarray(17)]), blob = await llegeixAudioNode0(r);
  expect(new Uint8Array(await blob.arrayBuffer())).toEqual(original); expect(bytes).toEqual(original); expect(r.blob).not.toHaveBeenCalled(); expect(r.reader.cancel).not.toHaveBeenCalled(); expect(r.reader.releaseLock).toHaveBeenCalledOnce();
});
test.each([1, 3])('WAVEFORMATEXTENSIBLE recognizes only the declared PCM/float subformat %s', tag => {
  const bytes = wav({ extensible: true, tag, bits: 32, channels: 2 }); expect(identificaAudioNode0(bytes, 'audio/vnd.wave').format).toBe(tag === 1 ? 'pcm' : 'float');
  bytes[59] ^= 1; expect(() => identificaAudioNode0(bytes, 'audio/wav')).toThrow();
});
test('every current seven WAV sample assets passes the profile without modification', () => {
  const dir = new URL('../../public/assets/audio/veus_node0/', import.meta.url), names = fs.readdirSync(dir).filter(n => n.endsWith('.wav'));
  expect(names.length).toBe(7);
  for (const name of names) { const bytes = fs.readFileSync(new URL(name, dir)), before = bytes.slice(); expect(identificaAudioNode0(bytes, 'audio/wav').sampleRate).toBe(22050); expect(bytes).toEqual(before); }
});
test('RIFF length, chunk traversal, fmt/data order and actual frame alignment fail closed', () => {
  const cases = [b => { b[0] = 0; }, b => { b[4]--; }, b => { b[16] = 255; }, b => { b[20] = 2; }, b => { b[22] = 0; }, b => { b[28] = 0; }, b => { b[32] = 3; }, b => { b[36] = 0; }, b => { b[40] = 255; }, b => { b[40] = 1; }];
  for (const mutate of cases) { const bytes = wav(); mutate(bytes); expect(() => identificaAudioNode0(bytes, 'audio/wav')).toThrow(); }
  expect(() => identificaAudioNode0(wav().subarray(0, 43), 'audio/wav')).toThrow();
});
test.each([1, 2, 2.5])('MPEG LayerIII%s verifies complete consecutive VBR frames and preserves bytes', async version => {
  const bytes = join(frame({ version }), frame({ version, bitrateIndex: 10, padding: 1 }));
  expect(identificaAudioNode0(bytes, 'audio/mpeg')).toMatchObject({ container: 'mpeg', version, layer: 3, frames: 2 });
  const blob = await llegeixAudioNode0(response([bytes], { type: 'audio/mpeg' })); expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
});
test('bounded ID3v2.3/v2.4 footer and trailingID3v1 are metadata, never sufficient audio on their own', () => {
  for (const version of [3, 4]) {
    const header = new Uint8Array(10); ascii(header, 0, 'ID3'); header[3] = version; header[9] = 16; if (version === 4) header[5] = 16;
    const footer = version === 4 ? header.slice() : new Uint8Array(); if (footer.length) ascii(footer, 0, '3DI');
    const tag = join(header, new Uint8Array(16), footer), end = new Uint8Array(128); ascii(end, 0, 'TAG');
    expect(identificaAudioNode0(join(tag, mp3(), end), 'audio/mpeg').frames).toBe(2);
    expect(() => identificaAudioNode0(tag, 'audio/mpeg')).toThrow();
    const bad = join(tag, mp3()); bad[6] = 128; expect(() => identificaAudioNode0(bad, 'audio/mpeg')).toThrow();
  }
});
test('reserved MPEG headers, a lone frame, truncated frames and fake magic prefixes reject', () => {
  for (const mutate of [b => { b[1] = 0xeb; }, b => { b[1] = 0xfd; }, b => { b[2] = 0; }, b => { b[2] = 0xfc; }, b => { b[3] = 2; }, b => { b[417] = 0; }]) { const bytes = mp3(); mutate(bytes); expect(() => identificaAudioNode0(bytes, 'audio/mpeg')).toThrow(); }
  for (const bytes of [frame(), mp3().subarray(0, -1), new TextEncoder().encode('ID3<html>error</html>'), new TextEncoder().encode('RIFF0000WAVE<html>error</html>')]) expect(() => identificaAudioNode0(bytes, 'audio/mpeg')).toThrow();
});
test('MIME/container mismatch, HTML, empty/missing streamed body and wrong chunk types reject without unbounded fallback', async () => {
  for (const r of [response([new TextEncoder().encode('<html>error</html>')]), response([wav()], { type: 'audio/mpeg' }), response([mp3()], { type: 'audio/wav' }), response([], { type: 'audio/wav' }), response(['not bytes'])]) await expect(llegeixAudioNode0(r)).rejects.toMatchObject({ code: 'AUDIO_NODE0_INVALID' });
  const r = response([wav()]); delete r.body.getReader; await expect(llegeixAudioNode0(r)).rejects.toMatchObject({ code: 'AUDIO_NODE0_INVALID' }); expect(r.blob).not.toHaveBeenCalled();
});
test('8MiB exact is admitted but declared or streamed bytes above policy cancel before concatenation', async () => {
  const bytes = wav({ samples: (MAX_BYTES_AUDIO_NODE0 - 44) / 2 }); expect(bytes.length).toBe(MAX_BYTES_AUDIO_NODE0);
  expect((await llegeixAudioNode0(response([bytes]))).size).toBe(MAX_BYTES_AUDIO_NODE0);
  const declared = response([wav()], { length: MAX_BYTES_AUDIO_NODE0 + 1 }); await expect(llegeixAudioNode0(declared)).rejects.toMatchObject({ code: 'AUDIO_NODE0_LIMIT' }); expect(declared.body.getReader).not.toHaveBeenCalled(); expect(declared.body.cancel).toHaveBeenCalledOnce();
  const lying = response([new Uint8Array(MAX_BYTES_AUDIO_NODE0), new Uint8Array(1)], { length: 1 }); await expect(llegeixAudioNode0(lying)).rejects.toMatchObject({ code: 'AUDIO_NODE0_LIMIT' }); expect(lying.reader.read).toHaveBeenCalledTimes(2); expect(lying.reader.cancel).toHaveBeenCalledOnce(); expect(lying.reader.releaseLock).toHaveBeenCalledOnce();
});
test('4096 transport fragments includes empty chunks, bounding a reader that starves the timer', async () => {
  const r = response(Array.from({ length: MAX_FRAGMENTS_AUDIO_NODE0 + 1 }, () => new Uint8Array()));
  await expect(llegeixAudioNode0(r)).rejects.toMatchObject({ code: 'AUDIO_NODE0_LIMIT' }); expect(r.reader.read).toHaveBeenCalledTimes(MAX_FRAGMENTS_AUDIO_NODE0 + 1); expect(r.reader.cancel).toHaveBeenCalledOnce(); expect(r.reader.releaseLock).toHaveBeenCalledOnce();
});
test('abort settles even when pending read/cancel ignore it; late body cannot construct a Blob', async () => {
  const r = response([]), control = new AbortController(); let release, blobs = 0;
  r.reader.read.mockImplementation(() => new Promise(resolve => { release = resolve; })); r.reader.cancel.mockImplementation(() => new Promise(() => {}));
  const NativeBlob = Blob; vi.stubGlobal('Blob', class extends NativeBlob { constructor(...args) { super(...args); blobs++; } });
  const pending = llegeixAudioNode0(r, { signal: control.signal }); control.abort(); await expect(pending).rejects.toMatchObject({ code: 'AUDIO_NODE0_ABORTED' });
  release({ value: wav(), done: false }); await Promise.resolve(); expect(blobs).toBe(0); expect(r.reader.cancel).toHaveBeenCalledOnce(); expect(r.reader.releaseLock).toHaveBeenCalledOnce();
});
test('already aborted and reader failures clean up; caller byte policy cannot silently exceed8MiB', async () => {
  const r = response([wav()]), control = new AbortController(); control.abort(); await expect(llegeixAudioNode0(r, { signal: control.signal })).rejects.toMatchObject({ code: 'AUDIO_NODE0_ABORTED' }); expect(r.body.getReader).not.toHaveBeenCalled();
  const broken = response([]); broken.reader.read.mockRejectedValue(new Error('reader failure')); await expect(llegeixAudioNode0(broken)).rejects.toThrow('reader failure'); expect(broken.reader.cancel).toHaveBeenCalledOnce(); expect(broken.reader.releaseLock).toHaveBeenCalledOnce();
  await expect(llegeixAudioNode0(response([wav()]), { maxBytes: MAX_BYTES_AUDIO_NODE0 + 1 })).rejects.toMatchObject({ code: 'AUDIO_NODE0_LIMIT' });
});
