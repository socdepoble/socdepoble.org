import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { validaContenidorMedia } from './validadorContenidorsMedia.js';
import { AVIF_REAL, ascii, join, ogg, oggPage, pdf, pdfObjectStream, protectedMp3 } from '../../tests/helpers/contenidorsMediaR3215.js';
const validate = (b, mime) => validaContenidorMedia(b, mime);
const fails = (b, mime) => expect(() => validate(b, mime)).toThrow();

describe('R32.15 OGG CRC32 direct and page continuity', () => {
  test('Opus container and Ogg application MIME; every CRC bit matters', () => {
    const bytes = ogg(); expect(validate(bytes, 'audio/ogg').format).toBe('ogg'); expect(validate(bytes, 'application/ogg').format).toBe('ogg');
    for (let at = 0; at < bytes.length; at++) { const mutant = bytes.slice(); mutant[at] ^= 1; fails(mutant, 'audio/ogg'); }
  });
  test('continued packets cross pages, including a zero terminal lace', () => {
    const data = new Uint8Array(255).fill(1);
    const valid = join(oggPage(data, 2, { laces: [255], granule: 0xffffffffffffffffn }), oggPage([], 5, { sequence: 1, laces: [0], granule: 0n }));
    expect(validate(valid, 'audio/ogg').format).toBe('ogg');
    fails(join(oggPage(data, 2, { laces: [255], granule: 0xffffffffffffffffn }), oggPage([], 4, { sequence: 1, laces: [0] })), 'audio/ogg');
  });
  test('sequence, flags, serial and EOS are checked after recomputing valid CRCs', () => {
    for (const bad of [oggPage([1], 4), oggPage([1], 2), join(oggPage([1], 2), oggPage([1], 4, { sequence: 2 })), join(oggPage([1], 2), oggPage([1], 5, { sequence: 1 })), join(oggPage([1], 6), oggPage([1], 4, { sequence: 1 }))]) fails(bad, 'audio/ogg');
    expect(validate(join(oggPage([1], 6), oggPage([2], 6, { serial: 3216 })), 'application/ogg').format).toBe('ogg');
  });
});
describe('R32.15 AVIF actual libavif file and coherent item metadata', () => {
  test('Pillow/libavif 8x8 image; offset views, no mutation', () => { const original = AVIF_REAL.slice(), wrapped = join([1], original, [1]); expect(validate(wrapped.subarray(1, -1), 'image/avif').format).toBe('avif'); expect(original).toEqual(AVIF_REAL); });
  test('every truncated prefix and external suffix is rejected', () => { for (let n = 0; n < AVIF_REAL.length; n++) fails(AVIF_REAL.subarray(0, n), 'image/avif'); fails(join(AVIF_REAL, ascii('<script>')), 'image/avif'); });
  test('primary ID, iloc offset, AV1 property and associations cannot be forged', () => {
    for (const [at, byte] of [[90, 2], [116, 255], [213 + 8, 0], [244 + 20, 127]]) { const b = AVIF_REAL.slice(); b[at] = byte; fails(b, 'image/avif'); }
  });
});
describe('R32.15 PDF lexical structure, stream boundaries and active actions', () => {
  for (const name of ['JS', 'JavaScript', 'Launch', 'RichMedia', 'EmbeddedFiles', 'SubmitForm', 'ImportData']) {
    for (const form of [name, [...name].map(c => '#' + c.charCodeAt(0).toString(16)).join('')]) test(`reject active PDF name /${form}`, () => fails(pdf({ extra: `/${form} (payload)` }), 'application/pdf'));
  }
  test('valid direct and forward indirect Length, literal strings and binary streams have no false names', () => {
    for (const indirect of [true, false]) expect(validate(pdf({ extra: '/Title (/JS /JavaScript /Launch)', content: ascii('random /JS /JavaScript endstream /RichMedia bytes'), indirect }), 'application/pdf').format).toBe('pdf');
  });
  test('xref stream, PNG predictor and bounded compressed object streams are parsed', () => {
    for (const flate of [false, true]) for (const predictor of [false, true]) expect(validate(pdfObjectStream({ flate, predictor }), 'application/pdf').format).toBe('pdf');
    for (const body of ['<< /JS (x) >>', '<< /#4a#61vaScript (x) >>', '<< /Launch 1 >>']) fails(pdfObjectStream({ body }), 'application/pdf');
    fails(pdfObjectStream({ bomb: true }), 'application/pdf');
  });
  test('reject missing structure, forged startxref, truncated data and polyglot suffixes', () => {
    const bytes = pdf();
    for (const b of [ascii('%PDF-1.7\n%%EOF'), join(bytes, ascii('<script>')), bytes.subarray(0, bytes.length - 4), ascii(new TextDecoder().decode(bytes).replace(/startxref\n[0-9]+/, 'startxref\n0')), ascii(new TextDecoder().decode(bytes).replace('/Length 3', '/Length 1'))]) fails(b, 'application/pdf');
  });
});
describe('R32.15 real MPEG LayerIII protected-bit scope', () => {
  for (const version of [3, 2, 0]) for (const mono of [true, false]) test(`CRC16 MPEG version${version} mono${mono}`, () => {
    const b = protectedMp3({ version, mono }); expect(validate(b, 'audio/mpeg').format).toBe('mp3');
    const bad = b.slice(); bad[6] ^= 1; fails(bad, 'audio/mpeg');
    const changed = b.slice(); changed[changed.length - 1] ^= 1; expect(validate(changed, 'audio/mpeg').format).toBe('mp3'); // main_data is outside MPEG CRC coverage
    const wrong = b.slice(); wrong[4] ^= 1; fails(wrong, 'audio/mpeg');
  });
});

test('R32.15 AVIF: 64-bit top boxes and idat-relative extents use exact offsets', async () => {
  const { AVIF_SEQUENCE_REAL } = await import('../../tests/helpers/contenidorsMediaR3215.js');
  expect(validate(AVIF_SEQUENCE_REAL, 'image/avif').format).toBe('avif');
  const box = (type, data, wide = false) => {
    const bytes = new Uint8Array((wide ? 16 : 8) + data.length), view = new DataView(bytes.buffer);
    view.setUint32(0, wide ? 1 : bytes.length); bytes.set(ascii(type), 4);
    if (wide) view.setBigUint64(8, BigInt(bytes.length)); bytes.set(data, wide ? 16 : 8); return bytes;
  };
  const firstWide = join(box('ftyp', AVIF_REAL.subarray(8, 32), true), AVIF_REAL.subarray(32)); new DataView(firstWide.buffer).setUint32(121, 283);
  expect(validate(firstWide, 'image/avif').format).toBe('avif');
  const mdatWide = join(AVIF_REAL.subarray(0, 267), box('mdat', AVIF_REAL.subarray(275), true)); new DataView(mdatWide.buffer).setUint32(113, 283);
  expect(validate(mdatWide, 'image/avif').format).toBe('avif');
  const iloc = [1, 0, 0, 0, 0x44, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 38];
  const relative = join(AVIF_REAL.subarray(0, 32), box('meta', join([0, 0, 0, 0], AVIF_REAL.subarray(44, 91), box('iloc', iloc), AVIF_REAL.subarray(121, 267), box('idat', AVIF_REAL.subarray(275)))));
  expect(validate(relative, 'image/avif').format).toBe('avif');
  const corrupted = relative.slice(); corrupted[118] = 255; fails(corrupted, 'image/avif');
});

test('R32.15 OGG: all BOS pages precede data; chaining requires every old stream EOS', () => {
  fails(join(oggPage([1], 2), oggPage([2], 0, { sequence: 1 }), oggPage([3], 6, { serial: 3216 }), oggPage([4], 4, { sequence: 2 })), 'application/ogg');
});
test('R32.15 PDF: xref Size and duplicate entries fail closed', () => {
  fails(ascii(new TextDecoder().decode(pdf()).replace('/Size 5', '/Size 1')), 'application/pdf');
  fails(pdf({ extra: '/Type /Catalog' }), 'application/pdf');
  fails(pdf({ extra: '/EmbeddedFile << >>' }), 'application/pdf');
  fails(pdf({ extra: '/XFA (script)' }), 'application/pdf');
});

test('R32.15 PDF municipal linealitzat real: /Prev pot apuntar cap avant al xref principal', () => {
  const bytes = new Uint8Array(readFileSync('public/assets/uploads/patrimoni/que-dinem/llibre-que-dinem.pdf'));
  expect(validate(bytes, 'application/pdf').format).toBe('pdf');
});

test('R32.15 reviewer: chained OGG states are counted, never rescanned per chain', () => {
  const pages = []; for (let i = 0; i < 4096; i++) pages.push(oggPage([1], 2, { serial: i }), oggPage([2], 4, { serial: i, sequence: 1 }));
  expect(validate(join(...pages), 'application/ogg').format).toBe('ogg');
});
test('R32.15 reviewer: remote/embedded GoTo and automatic URI actions are refused', () => {
  for (const extra of ['/OpenAction << /S /GoToR /F (file:///etc/passwd) /D [0 /Fit] >>', '/OpenAction << /S /GoToE /D [0 /Fit] >>', '/OpenAction << /S /URI /URI (https://example.invalid) >>', '/OpenAction << /S /GoTo /D [3 0 R /Fit] /Next << /S /URI /URI (https://example.invalid) >> >>', '/AA << /O << /S /URI /URI (https://example.invalid) >> >>']) fails(pdf({ extra }), 'application/pdf');
  for (const extra of ['/OpenAction [3 0 R /Fit]', '/OpenAction << /S /GoTo /D [3 0 R /Fit] >>', '/A << /S /URI /URI (https://example.invalid) >>']) expect(validate(pdf({ extra }), 'application/pdf').format).toBe('pdf');
});
test('R32.15 reviewer: page tree references, parents and counts must match', () => {
  for (const replace of [s => s.replace('/Kids [3 0 R]', '/Kids [9 0 R]'), s => s.replace('/Parent 2 0 R', '/Parent 9 0 R'), s => s.replace('/Count 1', '/Count 9')]) fails(ascii(replace(new TextDecoder().decode(pdf()))), 'application/pdf');
});

test('R32.15 reviewer: essential AVIF properties validate their payload, not only their names', async () => {
  const { avifWithProperty } = await import('../../tests/helpers/contenidorsMediaR3215.js');
  for (const [type, payload] of [['irot', []], ['irot', [4]], ['imir', []], ['imir', [2]], ['pasp', []], ['pasp', new Uint8Array(8)], ['clap', []], ['clap', new Uint8Array(32)], ['colr', ascii('nclx')], ['auxC', [0, 0, 0, 0, 0]], ['a1lx', [0]]]) fails(avifWithProperty(type, payload), 'image/avif');
  const u32 = n => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n); return b; };
  for (const [type, payload] of [['irot', [0]], ['imir', [1]], ['pasp', join(u32(1), u32(1))], ['clap', join(u32(8), u32(1), u32(8), u32(1), u32(0), u32(1), u32(0), u32(1))], ['colr', join(ascii('nclx'), [0, 1, 0, 1, 0, 1, 0])], ['auxC', join([0, 0, 0, 0], ascii('urn:mpeg:mpegB:cicp:systems:auxiliary:alpha'), [0])]]) expect(validate(avifWithProperty(type, payload), 'image/avif').format).toBe('avif');
  expect(validate(avifWithProperty('myto', [], false), 'image/avif').format).toBe('avif');
});
