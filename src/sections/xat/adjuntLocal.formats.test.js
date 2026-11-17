import { describe, expect, test, vi } from 'vitest';
import { CLAUS_ERROR_ADJUNT, preparaAdjunt, textDErrorAdjunt } from './adjuntLocal.js';
import { MAXIM_ADJUNT_XAT, MISSATGE_QUOTA_XAT, errorAdjuntXat, validaAdjuntXat } from '../../data/xatMultimedia.js';
import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';

const dataUrl = (mime = 'image/webp', bytes = 3) => `data:${mime};base64,${btoa('a'.repeat(bytes))}`;
const comprimeixPetit = () => vi.fn().mockResolvedValue(dataUrl());

describe('formats que dona el selector del mòbil', () => {
  test.each(['image/heic', 'image/heif', 'image/jpg'])('%s arriba al descodificador i sempre ix com a raster net', async (type) => {
    const original = new File(['original-EXIF-GPS'], 'foto', { type });
    const comprimeix = comprimeixPetit();
    const adjunt = await preparaAdjunt(original, { comprimeix });
    expect(comprimeix).toHaveBeenCalledOnce();
    expect(comprimeix.mock.calls[0][0].type).toBe(type === 'image/jpg' ? 'image/jpeg' : type);
    expect(comprimeix.mock.calls[0][1]).toEqual({ maxSize: 1200, quality: 0.8, format: 'image/webp', conservaExif: false });
    expect(adjunt.fitxer).not.toBe(original);
    expect(adjunt).toMatchObject({ tipus: 'imatge', duradaMs: null });
    expect(adjunt.fitxer.type).toBe('image/webp');
    expect(adjunt.fitxer.size).toBe(3);
    expect(() => validaAdjuntXat(adjunt)).not.toThrow();
  });

  test.each([
    ['HEIC', 'image/heic'], ['heif', 'image/heif'], ['JPG', 'image/jpeg'], ['jpeg', 'image/jpeg'],
    ['png', 'image/png'], ['webp', 'image/webp'], ['avif', 'image/avif'], ['gif', 'image/gif']
  ])('type buit amb .%s s’inferix abans de FileReader', async (extensio, mime) => {
    const original = new File(['foto'], `Foto de hui.${extensio}`);
    const comprimeix = comprimeixPetit();
    await preparaAdjunt(original, { comprimeix });
    expect(comprimeix.mock.calls[0][0].type).toBe(mime);
    expect(comprimeix.mock.calls[0][0].size).toBe(original.size);
    expect(comprimeix.mock.calls[0][1].maxSize).toBe(mime === 'image/png' ? 2048 : 1200);
  });

  test.each([['MP4', 'video/mp4'], ['mov', 'video/quicktime'], ['webm', 'video/webm']])('type buit amb .%s conserva durada i passa per neteja de vídeo', async (extensio, mime) => {
    const lligDurada = vi.fn().mockResolvedValue(4000);
    const netejaVideo = vi.fn(async (fitxer) => ({ fitxer, net: false }));
    const comprimeix = comprimeixPetit();
    const adjunt = await preparaAdjunt(new File(['video'], `record.${extensio}`), { comprimeix, lligDurada, netejaVideo });
    expect(adjunt).toMatchObject({ tipus: 'video', duradaMs: 4000, senseUbicacio: false });
    expect(adjunt.fitxer.type).toBe(mime);
    expect(lligDurada.mock.calls[0][0].type).toBe(mime);
    expect(netejaVideo.mock.calls[0][0].type).toBe(mime);
    expect(comprimeix).not.toHaveBeenCalled();
    expect(() => validaAdjuntXat(adjunt)).not.toThrow();
  });

  test.each([
    ['foto.jpg', 'text/plain'], ['foto.heic', 'application/octet-stream'],
    ['foto.jpg.exe', ''], ['foto.svg', ''], ['sense-extensio', ''], ['foto.constructor', '']
  ])('nom %s amb type %s no suplanta un format admés', async (name, type) => {
    const comprimeix = comprimeixPetit();
    await expect(preparaAdjunt(new File(['no-foto'], name, { type }), { comprimeix })).rejects.toMatchObject({ code: 'format' });
    expect(comprimeix).not.toHaveBeenCalled();
  });
});

describe('descodificador i codificador amb fallada visible', () => {
  test.each(['image/heic', 'image/heif'])('%s que el navegador no pot llegir té alternativa humana específica', async (type) => {
    const cause = new Error('Image.onerror');
    const comprimeix = vi.fn().mockRejectedValue(cause);
    await expect(preparaAdjunt(new Blob(['heic'], { type }), { comprimeix })).rejects.toMatchObject({
      code: 'format-heic', cause, message: expect.stringMatching(/Safari.*JPEG.*PNG/)
    });
    expect(comprimeix).toHaveBeenCalledTimes(2);
    expect(comprimeix.mock.calls.map(([, o]) => o.format)).toEqual(['image/webp', 'image/jpeg']);
  });

  test('type buit amb .heic usa el mateix error específic si falla', async () => {
    await expect(preparaAdjunt(new File(['heic'], 'foto.heic'), { comprimeix: vi.fn().mockRejectedValue(new Error('decode')) })).rejects.toMatchObject({ code: 'format-heic' });
  });

  test('WebP que rebutja encara prova JPEG, sempre sense EXIF', async () => {
    const comprimeix = vi.fn(async (_f, { format }) => {
      if (format === 'image/webp') throw new Error('encoder WebP absent');
      return dataUrl('image/jpeg');
    });
    const adjunt = await preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix });
    expect(adjunt.fitxer.type).toBe('image/jpeg');
    expect(comprimeix).toHaveBeenCalledTimes(2);
    for (const [, opcions] of comprimeix.mock.calls) expect(opcions.conservaExif).toBe(false);
  });

  test.each(['data:,', 'data:image/png;base64,YWJj', 'data:image/jpeg;base64,', 'data:image/jpeg;base64,!!!'])('un canvas sense resultat útil (%s) no deixa error cru ni puja l’original', async (resultat) => {
    const comprimeix = vi.fn().mockResolvedValue(resultat);
    await expect(preparaAdjunt(new Blob(['original'], { type: 'image/jpeg' }), { comprimeix })).rejects.toMatchObject({
      code: 'foto-codificacio', message: expect.stringMatching(/navegador/)
    });
    expect(comprimeix).toHaveBeenCalledTimes(2);
  });

  test('un error del canvas es traduïx a error humà, sense confondre’l amb quota', async () => {
    const cause = new Error('canvas unavailable');
    await expect(preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix: vi.fn().mockRejectedValue(cause) })).rejects.toMatchObject({ code: 'foto-codificacio', cause });
  });

  test('cancel·lar mentre falla el primer intent no inicia fallback JPEG', async () => {
    const controller = new AbortController();
    const comprimeix = vi.fn(async () => { controller.abort(); throw new Error('decode'); });
    await expect(preparaAdjunt(new Blob(['heic'], { type: 'image/heic' }), { comprimeix, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(comprimeix).toHaveBeenCalledOnce();
  });

  test('cancel·lar dins del fallback JPEG no retorna el raster ni prova més qualitats', async () => {
    const controller = new AbortController();
    const comprimeix = vi.fn(async (_f, { format }) => {
      if (format === 'image/webp') return dataUrl('image/png');
      controller.abort();
      return dataUrl('image/jpeg');
    });
    await expect(preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(comprimeix).toHaveBeenCalledTimes(2);
  });

  test.each(Object.entries({ ca, es, en, eu, gl }))('els tres errors nous ixen en %s sense missatge cru', (_idioma, diccionari) => {
    for (const code of ['format-heic', 'foto-mida', 'foto-codificacio']) {
      const clau = CLAUS_ERROR_ADJUNT[code];
      expect(diccionari[clau]).toEqual(expect.any(String));
      expect(diccionari[clau].trim()).not.toBe('');
      const error = Object.assign(errorAdjuntXat(code), { message: 'canvas raw exception' });
      expect(textDErrorAdjunt(error, (key) => diccionari[key])).toBe(diccionari[clau]);
    }
  });
});

describe('pressupost finit de la foto', () => {
  test('a 1200 redueix qualitat abans de perdre resolució', async () => {
    const comprimeix = vi.fn(async (_f, { quality }) => dataUrl('image/webp', quality === 0.55 ? 5 : MAXIM_ADJUNT_XAT.imatge));
    const adjunt = await preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix });
    expect(adjunt.fitxer.size).toBe(5);
    expect(comprimeix.mock.calls.map(([, o]) => [o.maxSize, o.quality])).toEqual([[1200, 0.8], [1200, 0.68], [1200, 0.55]]);
  });

  test.each([960, 768, 640])('un JPEG dens acaba a %s, sense cap intent ni retorn fora de pressupost', async (costatFinal) => {
    const comprimeix = vi.fn(async (_f, { maxSize, format }) => format === 'image/webp' ? dataUrl('image/png') : dataUrl('image/jpeg', maxSize === costatFinal ? 5 : MAXIM_ADJUNT_XAT.imatge));
    const adjunt = await preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix });
    expect(adjunt.fitxer.type).toBe('image/jpeg');
    expect(adjunt.fitxer.size).toBeLessThan(MAXIM_ADJUNT_XAT.imatge);
    expect(comprimeix.mock.calls.at(-1)[1].maxSize).toBe(costatFinal);
    expect(comprimeix.mock.calls.filter(([, o]) => o.format === 'image/webp')).toHaveLength(1);
    expect(() => validaAdjuntXat(adjunt)).not.toThrow();
  });

  test('si ni 640/.55 hi cap, acaba amb error de foto i mai la quota del servidor', async () => {
    const comprimeix = vi.fn(async (_f, { format }) => dataUrl(format, MAXIM_ADJUNT_XAT.imatge));
    const error = await preparaAdjunt(new Blob(['foto'], { type: 'image/jpeg' }), { comprimeix }).catch((e) => e);
    expect(error).toMatchObject({ code: 'foto-mida' });
    expect(error.message).not.toBe(MISSATGE_QUOTA_XAT);
    expect(comprimeix).toHaveBeenCalledTimes(12);
    expect(comprimeix.mock.calls.at(-1)[1]).toMatchObject({ maxSize: 640, quality: 0.55 });
  });

  test('una captura que no entra esgota com a màxim 15 codificacions, amb el fallback JPEG', async () => {
    const comprimeix = vi.fn(async (_f, { format }) => dataUrl(format === 'image/webp' ? 'image/png' : format, MAXIM_ADJUNT_XAT.imatge));
    await expect(preparaAdjunt(new Blob(['captura'], { type: 'image/png' }), { comprimeix })).rejects.toMatchObject({ code: 'foto-mida' });
    expect(comprimeix).toHaveBeenCalledTimes(15);
    expect(comprimeix.mock.calls.at(-1)[1]).toMatchObject({ maxSize: 640, quality: 0.55, format: 'image/jpeg', conservaExif: false });
  });
});
