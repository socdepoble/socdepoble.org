/* IDEA-36 (assalt 261101, T7 · S3) · Les captures de pantalla (PNG) del xat
   es pugen a 2048 px de costat llarg i, si no caben en el sostre de la imatge
   (2.000.000 B), a 1600 i a 1200; les fotos, a 1200 com sempre. Sempre
   recodificades (WebP, o JPEG si WebKit no fa WebP), sense EXIF, i mai en PNG. */
import { describe, expect, test, vi } from 'vitest';
import { COSTATS_CAPTURA, COSTAT_FOTO, esCapturaDePantalla, preparaAdjunt } from './adjuntLocal.js';
import { MAXIM_ADJUNT_XAT } from '../../data/xatMultimedia.js';

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
  test('a 2048 px en WebP 0,8 i sense EXIF, en un sol intent si hi cap', async () => {
    const comprimeix = compressor({ 2048: PETITA });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(comprimeix).toHaveBeenCalledOnce();
    expect(comprimeix.mock.calls[0][1]).toEqual({ maxSize: 2048, quality: 0.8, conservaExif: false, format: 'image/webp' });
    expect(a).toMatchObject({ tipus: 'imatge', duradaMs: null });
    expect(a.fitxer.type).toBe('image/webp');
    expect(a.fitxer.size).toBe(PETITA);
  });

  test('el sostre és inclusiu: 2.000.000 B exactes a 2048 hi caben', async () => {
    const comprimeix = compressor({ 2048: MAXIM_ADJUNT_XAT.imatge });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp']]);
    expect(a.fitxer.size).toBe(MAXIM_ADJUNT_XAT.imatge);
  });

  test('si a 2048 passa dels 2 MB, prova 1600; si encara en passa, 1200', async () => {
    const a1600 = compressor({ 2048: GRAN, 1600: PETITA });
    expect((await preparaAdjunt(captura(), { comprimeix: a1600 })).fitxer.size).toBe(PETITA);
    expect(crides(a1600)).toEqual([[2048, 'image/webp'], [1600, 'image/webp']]);

    const a1200 = compressor({ 2048: GRAN, 1600: GRAN, 1200: PETITA });
    expect((await preparaAdjunt(captura(), { comprimeix: a1200 })).fitxer.size).toBe(PETITA);
    expect(crides(a1200)).toEqual([[2048, 'image/webp'], [1600, 'image/webp'], [1200, 'image/webp']]);
  });

  test('si ni a 1200 hi cap, es queda el de 1200 (validaAdjuntXat dirà que no) i no hi ha cap quart intent', async () => {
    const comprimeix = compressor({ 2048: GRAN, 1600: GRAN, 1200: GRAN });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(comprimeix).toHaveBeenCalledTimes(3);
    expect(a.fitxer.size).toBe(GRAN);
  });

  test('a WebKit (WebP → PNG) demana JPEG al mateix costat i els costats següents ja van en JPEG', async () => {
    const comprimeix = compressor({ 2048: GRAN, 1600: PETITA }, { senseWebp: true });
    const a = await preparaAdjunt(captura(), { comprimeix });
    expect(crides(comprimeix)).toEqual([[2048, 'image/webp'], [2048, 'image/jpeg'], [1600, 'image/jpeg']]);
    expect(a.fitxer.type).toBe('image/jpeg');
    for (const [, opcions] of comprimeix.mock.calls) expect(opcions).toMatchObject({ quality: 0.8, conservaExif: false });
  });

  test('un resultat en PNG és error «foto» de seguida, sense provar cap altre costat', async () => {
    const comprimeix = vi.fn(async () => dataUrl('image/png', PETITA));
    await expect(preparaAdjunt(captura(), { comprimeix })).rejects.toMatchObject({ code: 'foto' });
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
  test.each(['image/jpeg', 'image/webp', 'image/avif', 'image/gif'])('%s: un sol intent a 1200 px, encara que el resultat passe dels 2 MB', async (type) => {
    const comprimeix = compressor({ 1200: GRAN });
    const a = await preparaAdjunt(foto(type), { comprimeix });
    expect(crides(comprimeix)).toEqual([[1200, 'image/webp']]);
    expect(a.fitxer.size).toBe(GRAN);
  });
});
