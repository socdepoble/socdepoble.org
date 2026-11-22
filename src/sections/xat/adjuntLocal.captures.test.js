/* IDEA-36 (assalt 261101, T7 · S3) · Les captures de pantalla (PNG) del xat
   es pugen a 2048 px de costat llarg i, si no caben en el sostre de la imatge
   (2.000.000 B), a 1600 i a 1200; després, amb menys qualitat i costat.
   Les fotos comencen a 1200. Sempre
   recodificades (WebP, o JPEG si WebKit no fa WebP), sense EXIF, i mai en PNG. */
import { describe, expect, test, vi } from 'vitest';
import { COSTATS_CAPTURA, COSTAT_FOTO, esCapturaDePantalla, preparaAdjunt } from './adjuntLocal.js';
import { MAXIM_ADJUNT_XAT } from '../../data/xatMultimedia.js';
import { imatgeSenseUbicacio } from '../../components/universal/enquadrament/exifIncrustat.js';
import { JPEG_NET, unix } from '../../../tests/helpers/mitjansPublicsNets.js';

/* v1.2.20 · Gauntlet R1 (L1-01) · La capçalera real del JPEG de canvas de
   WebKit (WKWebView, AppleWebKit/605.1.15: toDataURL('image/jpeg', 0.8) d'un
   canvas de 1200×900), byte a byte: SOI, APP0 JFIF (16), APP1 «Exif\0\0MM»
   (76: l'IFD0 només porta el punter a l'Exif IFD, amb ColorSpace,
   PixelXDimension i PixelYDimension) i APP13 «Photoshop 3.0» (56). Darrere
   va el raster d'1 píxel de JPEG_NET, sense el seu SOI ni el seu APP0. */
const CAPCALERA_WEBKIT = Uint8Array.from(('ffd8ffe000104a46494600010100004800480000'
  + 'ffe1004c4578696600004d4d002a00000008000187690004000000010000001a000000000003a001000300000001'
  + '00010000a002000400000001000004b0a0030004000000010000038400000000'
  + 'ffed003850686f746f73686f7020332e30003842494d04040000000000003842494d0425000000000010'
  + 'd41d8cd98f00b204e9800998ecf8427e').match(/../g), (h) => parseInt(h, 16));
const JPEG_WEBKIT = unix(CAPCALERA_WEBKIT, JPEG_NET.subarray(20));
const enBase64 = (b) => btoa(String.fromCharCode(...b));
/* comprimeix de WebKit: el WebP torna PNG, i el JPEG porta els segments propis. */
const compressorWebKit = () => vi.fn(async (_f, { format }) => (
  format === 'image/webp' ? dataUrl('image/png', PETITA) : `data:image/jpeg;base64,${enBase64(JPEG_WEBKIT)}`
));
const bytesDe = (blob) => new Promise((resolve, reject) => {
  const lector = new FileReader();
  lector.onload = () => resolve(new Uint8Array(lector.result));
  lector.onerror = () => reject(lector.error);
  lector.readAsArrayBuffer(blob);
});
const conte = (bytes, text) => Buffer.from(bytes).includes(Buffer.from(text, 'latin1'));

/* Una data URL de `bytes` bytes descodificats, del format que es demana. */
const dataUrl = (format, bytes) => `data:${format};base64,${btoa('a'.repeat(bytes))}`;
const PETITA = 3;
const GRAN = MAXIM_ADJUNT_XAT.imatge + 1;
const captura = () => new Blob(['captura'], { type: 'image/png' });
const foto = (type = 'image/jpeg') => new Blob(['foto'], { type });
/* comprimeix fals: la mida del resultat per costat, en el format demanat (o PNG si `senseWebp`). */
const compressor = (midaPerCostat, { senseWebp = false } = {}) => vi.fn(async (_f, { maxSize, format }) => (
  senseWebp && format === 'image/webp' ? dataUrl('image/png', PETITA) : dataUrl(format, midaPerCostat[maxSize])
));
const crides = (comprimeix) => comprimeix.mock.calls.map(([, o]) => [o.maxSize, o.format]);

describe('les constants', () => {
  test('2048, 1600 i 1200 per a les captures; 1200 per a les fotos; captura = PNG', () => {
    expect(COSTATS_CAPTURA).toEqual([2048, 1600, 1200]);
    expect(Object.isFrozen(COSTATS_CAPTURA)).toBe(true);
    expect(COSTAT_FOTO).toBe(1200);
    expect(MAXIM_ADJUNT_XAT.imatge).toBe(2_000_000);
    expect(esCapturaDePantalla(captura())).toBe(true);
    for (const type of ['image/jpeg', 'image/webp', 'image/avif', 'image/gif']) expect(esCapturaDePantalla(foto(type)), type).toBe(false);
    expect(esCapturaDePantalla(null)).toBe(false);
  });
});

describe('una captura (PNG)', () => {
  test('a 2048 px en WebP 0,8 sense EXIF cru per defecte, en un sol intent si hi cap', async () => {
    const comprimeix = compressor({ 2048: PETITA });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(comprimeix).toHaveBeenCalledOnce();
    expect(comprimeix.mock.calls[0][1]).toEqual({ maxSize: 2048, quality: 0.8, conservaExif: false, format: 'image/webp' });
    expect(a).toMatchObject({ tipus: 'imatge', duradaMs: null });
    expect(a.fitxer.type).toBe('image/webp');
    expect(a.fitxer.size).toBe(PETITA);
  });

  test('el client deixa marge: 2.000.000 B exactes encara es redueixen', async () => {
    const comprimeix = compressor({ 2048: MAXIM_ADJUNT_XAT.imatge, 1600: PETITA });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp'], [1600, 'image/webp']]);
    expect(a.fitxer.size).toBe(PETITA);
  });

  test('si a 2048 passa dels 2 MB, prova 1600; si encara en passa, 1200', async () => {
    const a1600 = compressor({ 2048: GRAN, 1600: PETITA });
    expect((await preparaAdjunt(captura(), { comprimeix: a1600 })).fitxer.size).toBe(PETITA);
    expect(crides(a1600)).toEqual([[2048, 'image/webp'], [1600, 'image/webp']]);

    const a1200 = compressor({ 2048: GRAN, 1600: GRAN, 1200: PETITA });
    expect((await preparaAdjunt(captura(), { comprimeix: a1200 })).fitxer.size).toBe(PETITA);
    expect(crides(a1200)).toEqual([[2048, 'image/webp'], [1600, 'image/webp'], [1200, 'image/webp']]);
  });

  test('si ni a 1200 hi cap, continua abaixant qualitat i costat sense tornar un blob invàlid', async () => {
    const comprimeix = compressor({ 2048: GRAN, 1600: GRAN, 1200: GRAN, 960: PETITA });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(comprimeix).toHaveBeenCalledTimes(6);
    expect(a.fitxer.size).toBe(PETITA);
    expect(comprimeix.mock.calls.map(([, o]) => [o.maxSize, o.quality])).toEqual([
      [2048, 0.8], [1600, 0.8], [1200, 0.8], [1200, 0.68], [1200, 0.55], [960, 0.8]
    ]);
  });

  test('a WebKit (WebP → PNG) demana JPEG al mateix costat i els costats següents ja van en JPEG', async () => {
    const comprimeix = compressor({ 2048: GRAN, 1600: PETITA }, { senseWebp: true });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp'], [2048, 'image/jpeg'], [1600, 'image/jpeg']]);
    expect(a.fitxer.type).toBe('image/jpeg');
    for (const [, opcions] of comprimeix.mock.calls) expect(opcions).toMatchObject({ quality: 0.8, conservaExif: false });
  });

  test('v1.2.20 · L1-01: amb la capçalera real de WebKit, el JPEG preparat és un punt fix de la comprovació del transport', async () => {
    expect(CAPCALERA_WEBKIT.length).toBe(2 + 18 + 78 + 58);
    expect(Array.from(JPEG_NET.subarray(20, 22))).toEqual([0xff, 0xdb]);
    // Sense canonicalitzar, el transport en llevava l'APP1 i l'APP13: 136 B menys.
    expect(imatgeSenseUbicacio(JPEG_WEBKIT).bytes.length).toBe(JPEG_WEBKIT.length - 136);
    const comprimeix = compressorWebKit();
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp'], [2048, 'image/jpeg']]);
    expect(a.fitxer.type).toBe('image/jpeg');
    const pujat = await bytesDe(a.fitxer);
    expect(conte(pujat, 'Photoshop 3.0')).toBe(false);
    expect(conte(pujat, 'Exif\0\0')).toBe(false);
    const net = imatgeSenseUbicacio(pujat);
    expect(net.format).toBe('image/jpeg');
    expect(Array.from(net.bytes)).toEqual(Array.from(pujat));
  });

  test('un resultat només en PNG és error humà de codificació, sense provar cap altre costat', async () => {
    const comprimeix = vi.fn(async () => dataUrl('image/png', PETITA));
    await expect(preparaAdjunt(captura(), { comprimeix })).rejects.toMatchObject({ code: 'foto-codificacio' });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp'], [2048, 'image/jpeg']]);
  });

  test('cancel·lada entre dos intents: AbortError i cap intent més', async () => {
    const controller = new AbortController();
    const comprimeix = vi.fn(async (_f, { maxSize, format }) => {
      controller.abort();
      return dataUrl(format, maxSize === 2048 ? GRAN : PETITA);
    });
    await expect(preparaAdjunt(captura(), { comprimeix, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(comprimeix).toHaveBeenCalledOnce();
  });
});

describe('una foto', () => {
  test.each(['image/jpeg', 'image/webp', 'image/avif', 'image/gif'])('%s: si 1200 passa dels 2 MB, redueix qualitat i després costat', async (type) => {
    const comprimeix = compressor({ 1200: GRAN, 960: PETITA });
    const a = await preparaAdjunt(foto(type), { comprimeix });
    expect(crides(comprimeix)).toEqual([[1200, 'image/webp'], [1200, 'image/webp'], [1200, 'image/webp'], [960, 'image/webp']]);
    expect(a.fitxer.size).toBe(PETITA);
  });
});
