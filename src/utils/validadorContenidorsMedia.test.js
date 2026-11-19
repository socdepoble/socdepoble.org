import { describe, expect, test } from 'vitest';
import { netejaImatgePublica } from '../data/mitjansPublicsNets.js';
import { validaContenidorMedia } from './validadorContenidorsMedia.js';

import { ascii, join, u32, box, mp4, wav, webm, png, frame, fixtures, webpDeMida } from '../../tests/helpers/contenidorsMedia.js';

describe('R32.14 · validació estructural real, independent del MIME declarat', () => {
  for (const [mime, build] of fixtures) {
    test(`${mime}: estructura completa`, () => expect(validaContenidorMedia(build(), mime).mime).toBe(mime));
    test(`${mime}: tots els prefixos truncats`, () => { const b = build(); for (let i = 0; i < b.length; i++) expect(() => validaContenidorMedia(b.subarray(0, i), mime), `offset ${i}`).toThrow(); });
    test(`${mime}: rebutja prefix/sufix políglota i MIME fals`, () => { const b = build(); expect(() => validaContenidorMedia(join(ascii('<script>'), b), mime)).toThrow(); expect(() => validaContenidorMedia(join(b, ascii('<script>')), mime)).toThrow(); expect(() => validaContenidorMedia(b, 'text/html')).toThrow(); });
    test(`${mime}: vistes amb byteOffset`, () => { const b = build(), v = join([9, 9], b, [9]); expect(validaContenidorMedia(v.subarray(2, -1), mime).bytes).toBe(b.length); });
  }
  test('PNG: CRC corrupte', () => { const b = png(); b[29] ^= 1; expect(() => validaContenidorMedia(b, 'image/png')).toThrow(); });
  test('MP4: moov al final, mida64 i mida0 mdat', () => {
    expect(validaContenidorMedia(mp4(true), 'video/mp4').format).toBe('mp4');
    const b = mp4(false), pos = b.length - 9;
    expect(validaContenidorMedia(join(b.subarray(0, pos), [0, 0, 0, 1], ascii('mdat'), [0, 0, 0, 0, 0, 0, 0, 17, 1]), 'video/mp4').format).toBe('mp4');
    b.fill(0, pos, pos + 4); expect(validaContenidorMedia(b, 'video/mp4').format).toBe('mp4');
  });
  test('MP4: no admet moov buit ni caixes fora de rang', () => { const b = mp4(false); b.set(u32(0xffffffff), 0); expect(() => validaContenidorMedia(b, 'video/mp4')).toThrow(); expect(() => validaContenidorMedia(join(box('ftyp', join(ascii('isom'), u32(0))), box('moov', []), box('mdat', [1])), 'video/mp4')).toThrow(); });
  test('WAV: alinear mostres i byte rate', () => { const b = wav(); b[28] ^= 1; expect(() => validaContenidorMedia(b, 'audio/wav')).toThrow(); });
  test('WebM: DocType no és una coincidència de bytes solta', () => { const b = webm(); b[11] = 0; expect(() => validaContenidorMedia(b, 'video/webm')).toThrow(); });
  test('MP3: ID3 sense frames i sync fals no són àudio', () => { expect(() => validaContenidorMedia(ascii('ID3\x04\x00\x00\x00\x00\x00\x00'), 'audio/mpeg')).toThrow(); const b = frame(); b[2] = 0xff; expect(() => validaContenidorMedia(b, 'audio/mpeg')).toThrow(); });
  test('tipus primitius, límit i zero mutacions', () => { expect(() => validaContenidorMedia({}, 'video/mp4')).toThrow(); expect(() => validaContenidorMedia(new Uint8Array(0), 'video/mp4')).toThrow(); const b = mp4(false), copy = b.slice(); validaContenidorMedia(b, 'video/mp4'); expect(b).toEqual(copy); });
});


describe('R32.14 · regressions de l’àrbitre independent', () => {
  const eb = (id, p) => join(id, [0x80 + p.length], p);
  const head = () => eb([0x1a, 0x45, 0xdf, 0xa3], eb([0x42, 0x82], ascii('webm')));
  const entry = (number = 1, type = 2, codec = 'A_OPUS') => eb([0xae], join(eb([0xd7], [number]), eb([0x83], [type]), eb([0x86], ascii(codec))));
  const tracks = data => eb([0x16, 0x54, 0xae, 0x6b], data ?? entry());
  const block = (data = [0x81, 0, 0, 0x80, 1]) => eb([0xa3], data);
  const cluster = data => eb([0x1f, 0x43, 0xb6, 0x75], data ?? block());
  const segment = data => join(head(), eb([0x18, 0x53, 0x80, 0x67], data));
  const unknownSegment = data => join(head(), [0x18, 0x53, 0x80, 0x67, 0xff], data);
  const unknownCluster = data => join([0x1f, 0x43, 0xb6, 0x75, 0xff], data);

  test('WebM: Tracks requereix TrackEntry i TrackNumber, tipus i CodecID coherents', () => {
    for (const badTracks of [tracks(eb([0xec], [1])), tracks(eb([0xae], eb([0xd7], [1]))), tracks(entry(0)), tracks(entry(1, 1, 'A_OPUS')), tracks(join(entry(), entry()))]) {
      expect(() => validaContenidorMedia(segment(join(badTracks, cluster())), 'video/webm')).toThrow();
    }
    expect(() => validaContenidorMedia(segment(join(tracks(), cluster(block([0x82, 0, 0, 0x80, 1])))), 'video/webm')).toThrow();
    expect(validaContenidorMedia(segment(join(tracks(entry(127)), cluster(block([0xff, 0, 0, 0x80, 1])))), 'video/webm').format).toBe('webm');
  });
  test('WebM: Tracks i Block no poden fugir del seu nivell EBML', () => {
    for (const bad of [segment(cluster(join(tracks(), block()))), segment(join(tracks(), block())), segment(join(tracks(), eb([0x15, 0x49, 0xa9, 0x66], cluster())))]) {
      expect(() => validaContenidorMedia(bad, 'video/webm')).toThrow();
    }
  });
  test('WebM Live: Segment i Cluster desconeguts delimiten diversos germans, sense niar-los', () => {
    const b = unknownSegment(join(tracks(), unknownCluster(block()), unknownCluster(block()), cluster()));
    expect(validaContenidorMedia(b, 'video/webm').format).toBe('webm');
    expect(() => validaContenidorMedia(segment(join(tracks(), cluster(cluster()))), 'video/webm')).toThrow();
    expect(() => validaContenidorMedia(unknownSegment(join(tracks(), unknownCluster(eb([0x18, 0x53, 0x80, 0x67], [])))), 'video/webm')).toThrow();
  });
  test('WebM: lacing comprova longituds de frames, sense descodificar el còdec', () => {
    const data = tail => segment(join(tracks(), cluster(block([0x81, 0, 0, 0x80 | tail[0], ...tail.slice(1)]))));
    for (const valid of [[2, 1, 1, 10, 20], [4, 1, 10, 20], [6, 1, 0x81, 10, 20]]) expect(validaContenidorMedia(data(valid), 'video/webm').format).toBe('webm');
    for (const invalid of [[2, 1, 255], [2, 1, 5, 10], [4, 2, 10, 20], [6, 1, 0x85, 10], [6, 2, 0x81, 0x80, 10, 20]]) expect(() => validaContenidorMedia(data(invalid), 'video/webm')).toThrow();
  });
  test('MP4: TrackHeader/MediaHeader/Handler són obligatoris; uuid inclou usertype de 16 bytes', () => {
    const header = new Uint8Array(100); header.set(u32(1000), 12);
    const incomplete = join(box('ftyp', join(ascii('isom'), u32(0))), box('moov', join(box('mvhd', header), box('trak', box('mdia', [])))), box('mdat', [1]));
    expect(() => validaContenidorMedia(incomplete, 'video/mp4')).toThrow();
    expect(() => validaContenidorMedia(join(mp4(false), box('uuid', [])), 'video/mp4')).toThrow();
    expect(validaContenidorMedia(join(mp4(false), box('uuid', new Uint8Array(16))), 'video/mp4').format).toBe('mp4');
  });
  test('WAV: IEEE float només té contenidors de 32/64 bits', () => {
    const b = wav(), view = new DataView(b.buffer);
    view.setUint16(20, 3, true); view.setUint16(34, 8, true); view.setUint16(32, 1, true); view.setUint32(28, 8000, true);
    expect(() => validaContenidorMedia(b, 'audio/wav')).toThrow();
  });
  test('WAV extensible valida subformat, bits significatius i channel mask', () => {
    const fmt = new Uint8Array(40), view = new DataView(fmt.buffer);
    view.setUint16(0, 0xfffe, true); view.setUint16(2, 1, true); view.setUint32(4, 8000, true); view.setUint32(8, 16000, true);
    view.setUint16(12, 2, true); view.setUint16(14, 16, true); view.setUint16(16, 22, true); view.setUint16(18, 16, true);
    fmt.set([1, 0, 0, 0, 0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113], 24);
    const file = () => { const payload = join(ascii('WAVE'), ascii('fmt '), u32(fmt.length, true), fmt, ascii('data'), u32(2, true), [0, 0]); return join(ascii('RIFF'), u32(payload.length, true), payload); };
    expect(validaContenidorMedia(file(), 'audio/wav').format).toBe('wav');
    fmt[24] = 99; expect(() => validaContenidorMedia(file(), 'audio/wav')).toThrow(); fmt[24] = 1;
    fmt[28] = 1; expect(() => validaContenidorMedia(file(), 'audio/wav')).toThrow(); fmt[28] = 0;
    view.setUint16(18, 17, true); expect(() => validaContenidorMedia(file(), 'audio/wav')).toThrow(); view.setUint16(18, 16, true);
    view.setUint32(20, 3, true); expect(() => validaContenidorMedia(file(), 'audio/wav')).toThrow();
  });
});


test('la validació estructural compartida conserva imatges privades >5MiB i el límit públic', () => {
  const bytes = webpDeMida(6_000_000);
  expect(validaContenidorMedia(bytes, 'image/webp').bytes).toBe(6_000_000);
  expect(() => netejaImatgePublica(bytes, 'image/webp')).toThrow();
});
