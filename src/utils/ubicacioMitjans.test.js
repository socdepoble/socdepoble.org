import { describe, expect, test, vi } from 'vitest';
import { deflateSync, inflateSync } from 'node:zlib';
import { extreuCoordenadesMitja, inspeccionaUbicacioMitja, senseUbicacioVideo, LIMITS_UBICACIO_MITJANS } from './ubicacioMitjans.js';
import { concatena, gpsTorre, jpegAmbExif, tiff } from '../../tests/helpers/jpegProva.js';

const text = s => new TextEncoder().encode(s);
const fourcc = s => Uint8Array.from([...s], c => c.charCodeAt(0));
const u16 = n => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n); return b; };
const u32 = n => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n); return b; };
const u64 = n => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, BigInt(n)); return b; };
const full = (version = 0) => Uint8Array.of(version, 0, 0, 0);
const box = (type, ...parts) => { const b = concatena(...parts); return concatena(u32(b.length + 8), typeof type === 'number' ? u32(type) : fourcc(type), b); };
const box64 = (type, ...parts) => { const b = concatena(...parts); return concatena(u32(1), fourcc(type), u64(b.length + 16), b); };
const ftyp = (major = 'isom') => box('ftyp', text(major), u32(0), text(major));
const hdlr = type => box('hdlr', full(), u32(0), text(type), new Uint8Array(12));
const track = type => box('trak', box('tkhd', text('pista')), box('mdia', hdlr(type), box('minf', box('stbl'))));
const ISO = '+38.591900-000.418400+456.70/';
const GPS = { lat: 38.5919, lng: -0.4184, altitud: 456.7 };
const xyz = (iso = ISO, prefix = false) => box('©xyz', ...(prefix ? [u16(text(iso).length), u16(0)] : []), text(iso));
const keyed = (iso = ISO, { legacy = false, index = 2, dataType = 1 } = {}) => {
  const key = name => box('mdta', text(name));
  return box('meta', ...(legacy ? [] : [full()]), hdlr('mdta'), box('keys', full(), u32(2), key('com.apple.quicktime.title'), key('com.apple.quicktime.location.ISO6709')),
    box('ilst', box(1, box('data', u32(1), u32(0), text('+11.000-022.000/'))), box(index, box('data', u32(dataType), u32(0), text(iso)))));
};
const movie = (meta = box('udta', xyz()), { audio = true, major = 'isom', extra = new Uint8Array() } = {}) => new Blob([
  ftyp(major), box('moov', track('vide'), ...(audio ? [track('soun')] : []), meta, extra), box('mdat', text('IMATGES_I_SONS_SENSE_CANVIS'))
], { type: major === 'qt  ' ? 'video/quicktime' : 'video/mp4' });
const bytes = blob => typeof blob.arrayBuffer === 'function' ? blob.arrayBuffer().then(b => new Uint8Array(b)) : new Promise((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(new Uint8Array(r.result)); r.onerror = () => reject(r.error); r.readAsArrayBuffer(blob);
});
const str = async blob => new TextDecoder().decode(await bytes(blob));
function webp(exif, pixels = new Uint8Array()) {
  const chunk = (type, b) => concatena(text(type), (() => { const v = new Uint8Array(4); new DataView(v.buffer).setUint32(0, b.length, true); return v; })(), b, ...(b.length & 1 ? [Uint8Array.of(0)] : []));
  const body = concatena(text('WEBP'), chunk('VP8 ', pixels), chunk('EXIF', exif));
  const size = new Uint8Array(4); new DataView(size.buffer).setUint32(0, body.length, true); return new Blob([text('RIFF'), size, body], { type: 'image/webp' });
}
function png(exif) {
  const chunk = (type, b) => concatena(u32(b.length), text(type), b, u32(0));
  return new Blob([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10), chunk('IHDR', new Uint8Array(13)), chunk('IDAT', text('PIXELS')), chunk('eXIf', exif), chunk('IEND', new Uint8Array())], { type: 'image/png' });
}
function heic({ method = 0, ordre = 'MM', offsetTiff = 0, badOffset = null, ilocVersion = 1, twoExif = false, external = false, length = null, xmp = false, infeVersion = 2 } = {}) {
  const exif = concatena(u32(offsetTiff), new Uint8Array(offsetTiff), tiff({ ordre, gps: gpsTorre() }));
  const infe = (id, type = 'Exif') => box('infe', full(infeVersion), infeVersion === 3 ? u32(id) : u16(id), u16(0), text(type), Uint8Array.of(0));
  const info = box('iinf', full(), u16(twoExif || xmp ? 2 : 1), infe(1), ...(twoExif ? [infe(2)] : xmp ? [infe(2, 'mime')] : []));
  const iloc = offset => box('iloc', full(ilocVersion), Uint8Array.of(0x44, 0), ...(ilocVersion === 2 ? [u32(1), u32(1)] : [u16(1), u16(1)]),
    ...(ilocVersion ? [u16(method)] : []), u16(external ? 1 : 0), u16(1), u32(badOffset ?? offset), u32(length ?? exif.length));
  const header = ftyp('heic');
  const meta = offset => box('meta', full(), info, iloc(offset), ...(method === 1 ? [box('idat', exif)] : []));
  return new Blob([header, meta(method === 1 ? 0 : header.length + meta(0).length + 8), ...(method === 0 ? [box('mdat', exif, text('PIXELS'))] : [box('mdat', text('PIXELS'))])], { type: 'image/heic' });
}

describe('TIFF existent, sense descodificar imatges', () => {
  test.each(['MM', 'II'])('JPEG %s: coordenades i altitud rescatades abans del canvas', async ordre => {
    const original = new Blob([jpegAmbExif({ ordre, gps: gpsTorre() })], { type: '' });
    const before = await bytes(original);
    expect(await extreuCoordenadesMitja(original)).toEqual(GPS);
    expect(await bytes(original)).toEqual(before);
  });
  test('EXIF sud/est, davall de la mar i sense altitud', async () => {
    expect(await extreuCoordenadesMitja(new Blob([jpegAmbExif({ gps: gpsTorre({ latRef: 'S', lngRef: 'E', altRef: 1 }) })]))).toEqual({ lat: -GPS.lat, lng: -GPS.lng, altitud: -GPS.altitud });
    expect(await extreuCoordenadesMitja(new Blob([jpegAmbExif({ gps: gpsTorre({ alt: null }) })]))).toEqual({ ...GPS, altitud: null });
  });
  test('JPEG sense GPS és inspecció completa; GPS amb denominador zero és explícitament il·legible', async () => {
    expect(await inspeccionaUbicacioMitja(new Blob([jpegAmbExif({})]))).toMatchObject({ completa: true, coordenades: null, format: 'jpeg' });
    expect(await inspeccionaUbicacioMitja(new Blob([jpegAmbExif({ gps: gpsTorre({ lat: [[38, 0], [1, 1], [1, 1]] }) })]))).toMatchObject({ completa: false, coordenades: null, motiu: 'gps-illegible' });
  });
  test('WebP amb EXIF darrere de píxels grans: només capçaleres i TIFF, sense llegir els píxels', async () => {
    const original = webp(tiff({ gps: gpsTorre() }), new Uint8Array(3_000_000));
    const realSlice = original.slice.bind(original), calls = [];
    vi.spyOn(original, 'slice').mockImplementation((a, b) => { calls.push([a, b]); return realSlice(a, b); });
    expect(await extreuCoordenadesMitja(original)).toEqual(GPS);
    expect(calls.reduce((n, [a, b]) => n + b - a, 0)).toBeLessThan(2000);
    expect(calls.every(([a, b]) => b <= 20 || a >= 3_000_020)).toBe(true);
  });
  test('PNG eXIf reutilitza el TIFF conegut', async () => { expect(await extreuCoordenadesMitja(png(tiff({ gps: gpsTorre() })))).toEqual(GPS); });
  test('JPEG truncat a cada byte anterior al final d’EXIF no inventa ubicació', async () => {
    const b = jpegAmbExif({ gps: gpsTorre() });
    for (let n = 0; n < b.length - 12; n++) expect(await extreuCoordenadesMitja(new Blob([b.subarray(0, n)]))).toBeNull();
  });
  test('punter GPS fora del TIFF i IFD circular no passen', async () => {
    const b = tiff({ gps: gpsTorre() }), v = new DataView(b.buffer, b.byteOffset, b.byteLength), n = v.getUint16(8);
    for (let i = 0; i < n; i++) if (v.getUint16(10 + i * 12) === 0x8825) v.setUint32(18 + i * 12, 0xffffffff);
    expect(await extreuCoordenadesMitja(webp(b))).toBeNull();
  });
});

describe('MP4/MOV: ubicació només de caixes identificades', () => {
  test.each([false, true])('©xyz amb capçalera QuickTime=%s', async prefix => {
    expect(await extreuCoordenadesMitja(movie(box('udta', xyz(ISO, prefix))))).toEqual(GPS);
  });
  test.each([false, true])('keys/ilst ISO6709, meta antic=%s i clau numèrica correcta', async legacy => {
    expect(await extreuCoordenadesMitja(movie(keyed(ISO, { legacy }), { major: 'qt  ' }))).toEqual(GPS);
  });
  test('no confon un títol ISO6709 amb la clau GPS; data d’un tipus diferent no es declara llegida', async () => {
    expect(await inspeccionaUbicacioMitja(movie(keyed(ISO, { index: 1 })))).toMatchObject({ completa: false, coordenades: null });
    expect(await inspeccionaUbicacioMitja(movie(keyed(ISO, { dataType: 21 })))).toMatchObject({ completa: false, coordenades: null });
  });
  test.each(['+91.000-000.100/', '+38.000-181.000/', '+00.000+000.000/', '+38.0-000.1', 'NaN', '+38.0-000.1+1e309/'])('ISO invàlid %s no inventa coordenades', async iso => {
    expect(await extreuCoordenadesMitja(movie(box('udta', xyz(iso))))).toBeNull();
  });
  test('sense altitud, null; angles límit i altitud negativa són vàlids', async () => {
    expect(await extreuCoordenadesMitja(movie(box('udta', xyz('-90.0+180.0-12.5/'))))).toEqual({ lat: -90, lng: 180, altitud: -12.5 });
    expect(await extreuCoordenadesMitja(movie(box('udta', xyz('+38.0-000.1/'))))).toEqual({ lat: 38, lng: -0.1, altitud: null });
  });
  test('moov darrere d’un mdat gran: cap lectura travessa mostres', async () => {
    const data = box('mdat', new Uint8Array(4_000_000)), head = ftyp(), tail = box('moov', track('vide'), keyed());
    const original = new Blob([head, data, tail]), realSlice = original.slice.bind(original), reads = [];
    vi.spyOn(original, 'slice').mockImplementation((a, b) => { reads.push([a, b]); return realSlice(a, b); });
    expect(await extreuCoordenadesMitja(original)).toEqual(GPS);
    expect(reads.every(([a, b]) => b <= head.length + 8 || a >= head.length + data.length)).toBe(true);
    expect(reads.reduce((n, [a, b]) => n + b - a, 0)).toBeLessThan(5000);
  });
  test('moov buit no vol dir vídeo mut; hdlr vide sense soun verificat sí; soun dona si', async () => {
    expect((await inspeccionaUbicacioMitja(new Blob([ftyp(), box('moov')]))).audioEsperat).toBe('desconegut');
    expect((await inspeccionaUbicacioMitja(movie(new Uint8Array(), { audio: false }))).audioEsperat).toBe('no');
    expect((await inspeccionaUbicacioMitja(movie())).audioEsperat).toBe('si');
    expect((await inspeccionaUbicacioMitja(movie(new Uint8Array(), { audio: false, extra: track('meta') }))).audioEsperat).toBe('desconegut');
  });
  test('truncat, mida64 fora del rang segur i profunditat excessiva són incomplets', async () => {
    const huge = concatena(u32(1), text('moov'), u64(9007199254740992n));
    expect((await inspeccionaUbicacioMitja(new Blob([ftyp(), huge]))).completa).toBe(false);
    expect((await inspeccionaUbicacioMitja(new Blob([ftyp(), u32(1000), text('moov')]))).completa).toBe(false);
    let nested = box('udta', xyz()); for (let i = 0; i < 10; i++) nested = box('moov', nested);
    expect((await inspeccionaUbicacioMitja(new Blob([ftyp(), nested]))).motiu).toBe('limit-metadades');
  });
  test('pressupost de caixes, text i TIFF és dur', async () => {
    const many = Array.from({ length: LIMITS_UBICACIO_MITJANS.caixes + 1 }, () => box('free'));
    expect((await inspeccionaUbicacioMitja(new Blob([ftyp(), ...many]))).motiu).toBe('limit-metadades');
    expect((await inspeccionaUbicacioMitja(movie(box('udta', xyz('x'.repeat(5000)))))).motiu).toBe('limit-metadades');
    expect((await inspeccionaUbicacioMitja(webp(new Uint8Array(LIMITS_UBICACIO_MITJANS.tiff + 7)))).motiu).toBe('limit-metadades');
  });
  test('pressupost global de lectures: molts GPS vàlids no superen 2 MB', async () => {
    const original = movie(box('udta', ...Array.from({ length: 600 }, () => xyz(ISO.padEnd(4096, ' ')))));
    const realSlice = original.slice.bind(original), reads = [];
    vi.spyOn(original, 'slice').mockImplementation((a, b) => { reads.push([a, b]); return realSlice(a, b); });
    expect((await inspeccionaUbicacioMitja(original)).motiu).toBe('limit-metadades');
    expect(reads.reduce((n, [a, b]) => n + b - a, 0)).toBeLessThanOrEqual(LIMITS_UBICACIO_MITJANS.bytes);
  });
  test('mdat com a primera caixa: ni la detecció inicial llig una mostra', async () => {
    const data = box('mdat', new Uint8Array(2000)), tail = box('moov', track('vide'), keyed()), original = new Blob([data, tail]);
    const realSlice = original.slice.bind(original), reads = [];
    vi.spyOn(original, 'slice').mockImplementation((a, b) => { reads.push([a, b]); return realSlice(a, b); });
    expect(await extreuCoordenadesMitja(original)).toEqual(GPS);
    expect(reads.every(([a, b]) => b <= 8 || a >= data.length)).toBe(true);
  });
});

describe('HEIC: item Exif i offsets iloc, sense escanejar mdat', () => {
  test.each([0, 1])('construction_method=%s (fitxer o idat)', async method => { expect(await extreuCoordenadesMitja(heic({ method }))).toEqual(GPS); });
  test('Exif TIFF desplaçat, little-endian i iloc version2', async () => { expect(await extreuCoordenadesMitja(heic({ method: 1, ordre: 'II', offsetTiff: 6, ilocVersion: 2 }))).toEqual(GPS); });
  test('iloc v0 i infe v3 també són explícits; XMP MIME no fingix inspecció completa', async () => {
    expect(await extreuCoordenadesMitja(heic({ ilocVersion: 0, infeVersion: 3 }))).toEqual(GPS);
    expect(await inspeccionaUbicacioMitja(heic({ xmp: true }))).toMatchObject({ coordenades: GPS, completa: false, motiu: 'metadades-no-compatibles' });
    expect(await inspeccionaUbicacioMitja(new Blob([ftyp('heic'), box('meta', full())]))).toMatchObject({ completa: false, coordenades: null });
  });
  test.each([{ badOffset: 0 }, { badOffset: 0xffffffff }, { length: 0xffffffff }, { method: 2 }, { external: true }, { twoExif: true }])('offset/context no verificat %j és incomplet', async options => {
    expect(await inspeccionaUbicacioMitja(heic(options))).toMatchObject({ completa: false, coordenades: null });
  });
});

describe('opt-out: només resultat verificat, mai falsa neteja', () => {
  test('©xyz i keys/ilst passen a free, mateix pes, tracks i mdat intactes', async () => {
    const original = movie(box('udta', xyz(), keyed())), before = await bytes(original);
    const { fitxer, net } = await senseUbicacioVideo(original);
    expect(net).toBe(true); expect(fitxer.size).toBe(original.size); expect(fitxer.type).toBe(original.type);
    const output = await str(fitxer); expect(output).not.toContain(ISO); expect(output).not.toContain('com.apple.quicktime.location'); expect(output).toContain('IMATGES_I_SONS_SENSE_CANVIS'); expect(output).toContain('tkhd');
    expect(await bytes(original)).toEqual(before); expect(await extreuCoordenadesMitja(fitxer)).toBeNull();
  });
  test('pot netejar metadades corruptes sense fingir que les ha pogudes interpretar', async () => {
    const original = movie(box('udta', text('GPS-corrupt-no-caixes')));
    expect((await inspeccionaUbicacioMitja(original)).completa).toBe(false);
    const net = await senseUbicacioVideo(original); expect(net.net).toBe(true); expect(await str(net.fitxer)).not.toContain('GPS-corrupt');
  });
  test('fixture legacy: udta/meta textuals i trak sense hdlr es lleven per rang extern', async () => {
    const original = new Blob([box('ftyp', text('isom')), box('moov', box('mvhd', text('durada')), box('udta', xyz()),
      box('meta', text('com.apple.quicktime.location.ISO6709'), text(ISO)), box('trak', box('tkhd', text('pista')), box('udta', text(ISO)))), box('mdat', text('IMATGES'))], { type: 'video/mp4' });
    expect(await inspeccionaUbicacioMitja(original)).toMatchObject({ completa: false, audioEsperat: 'desconegut' });
    const net = await senseUbicacioVideo(original); expect(net.net).toBe(true); expect(net.fitxer.size).toBe(original.size);
    const output = await str(net.fitxer); expect(output).not.toContain(ISO); expect(output).not.toMatch(/udta|meta/); expect(output).toContain('tkhd'); expect(output).toContain('IMATGES');
  });
  test('mida64 i top size0 no alteren offsets ni amplien lectura a mdat', async () => {
    const original = new Blob([ftyp('qt  '), box64('moov', track('vide'), box64('udta', xyz())), u32(0), text('mdat'), text('MOSTRES')], { type: 'video/quicktime' });
    const a = await senseUbicacioVideo(original); expect(a.net).toBe(true); expect(a.fitxer.size).toBe(original.size); expect(await str(a.fitxer)).toContain('MOSTRES'); expect(await str(a.fitxer)).not.toContain(ISO);
  });
  test.each(['video/webm', 'image/heic'])('%s no es declara net per error', async type => {
    const original = type === 'image/heic' ? heic() : new Blob(['webm'], { type });
    await expect(senseUbicacioVideo(original)).resolves.toEqual({ fitxer: original, net: false });
  });
  test('pista de metadades, UUID desconegut, caixa tallada o massa metadades no retornen original com a net', async () => {
    for (const original of [movie(new Uint8Array(), { extra: track('meta') }), movie(box('uuid', new Uint8Array(16))), new Blob([ftyp(), u32(100), text('moov')]), movie(box('udta', new Uint8Array(2_000_001)))]) {
      await expect(senseUbicacioVideo(original)).resolves.toEqual({ fitxer: original, net: false });
    }
  });
  test('QuickTime cmov comprimit no fingix GPS absent ni net: la còpia encara conté el GPS', async () => {
    const plain = box('udta', xyz()), compressed = new Uint8Array(deflateSync(plain));
    const original = movie(box('cmov', box('dcom', text('zlib')), box('cmvd', u32(plain.length), compressed)), { major: 'qt  ' });
    expect(await inspeccionaUbicacioMitja(original)).toMatchObject({ completa: false, coordenades: null, motiu: 'metadades-no-compatibles' });
    const result = await senseUbicacioVideo(original); expect(result).toEqual({ fitxer: original, net: false });
    const b = await bytes(result.fitxer), start = new TextDecoder('latin1').decode(b).indexOf('cmvd') + 8;
    expect(new TextDecoder('latin1').decode(inflateSync(b.subarray(start, start + compressed.length)))).toContain(ISO);
  });
  test('cancel·lar abans o durant una lectura propaga AbortError i cap resultat net', async () => {
    const original = movie(), controller = new AbortController(); controller.abort();
    await expect(extreuCoordenadesMitja(original, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    await expect(senseUbicacioVideo(original, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    const pending = new AbortController(), realSlice = original.slice.bind(original); let read;
    vi.spyOn(original, 'slice').mockImplementation((a, b) => { const blob = realSlice(a, b); blob.arrayBuffer = () => new Promise(resolve => { read = resolve; }); return blob; });
    const p = inspeccionaUbicacioMitja(original, { signal: pending.signal }); pending.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' }); read(new ArrayBuffer(8));
  });
});
