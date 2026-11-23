// @vitest-environment node
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Gauntlet R1 del carril A (P2) · El vídeo que el navegador recomprimix
   (MediaRecorder: Chrome, Android) torna a portar dins el lloc rescatat abans de comprimir (moov/udta/©xyz), amb els
   desplaçaments absoluts corregits; i si el contenidor no ho admet amb garanties, es queda com estava (null). */
import { describe, expect, test } from 'vitest';
import { ambUbicacioMp4, iso6709 } from './ubicacioMp4.js';
import { inspeccionaUbicacioMitja, senseUbicacioVideo } from './ubicacioMitjans.js';
import { validaFitxerMedia } from './validadorContenidorsMedia.js';
import { ascii, box, u32 } from '../../tests/helpers/contenidorsMedia.js';
import { caixesPrimerNivell, mp4Fragmentat, mp4Pla, offsetsTfra, valorsTaula } from '../../tests/helpers/mp4Fragmentat.js';

const LLOC = { lat: 38.5919, lng: -0.4184, altitud: 456.7 };
const ISO = '+38.5919-000.4184+456.7/';
const bytes = async (blob) => new Uint8Array(await blob.arrayBuffer());
const latin = async (blob) => new TextDecoder('latin1').decode(await bytes(blob));
const mostresDe = async (blob) => (await latin(blob)).match(/MOSTRES?-[A-Z0-9-]+/g);

describe('ISO 6709', () => {
  test('signe, zeros a l’esquerra, fins a set decimals i altitud opcional', () => {
    expect(iso6709(LLOC)).toBe(ISO);
    expect(iso6709({ lat: -33.8688197, lng: 151.2092955, altitud: -3.25 })).toBe('-33.8688197+151.2092955-3.25/');
    expect(iso6709({ lat: 0.0000001, lng: -179.9999999 })).toBe('+00.0000001-179.9999999/');
    expect(iso6709({ lat: 91, lng: 0 })).toBeNull();
    expect(iso6709(null)).toBeNull();
  });
});

describe('MP4 fragmentat de Chromium: el lloc torna dins i el mfra continua apuntant als moof', () => {
  test.each([1, 0])('tfra versió %i, default-base-is-moof', async (tfraVersio) => {
    const { blob, offsetsMoof } = mp4Fragmentat({ tfraVersio });
    expect((await inspeccionaUbicacioMitja(blob)).coordenades).toBeNull();
    const resultat = await ambUbicacioMp4(blob, LLOC);
    expect(resultat.lloc).toEqual({ lat: LLOC.lat, lng: LLOC.lng });
    const nou = resultat.fitxer;
    expect(nou.type).toBe('video/mp4');
    expect(await inspeccionaUbicacioMitja(nou)).toMatchObject({ coordenades: LLOC, completa: true, audioEsperat: 'si' });
    expect(await latin(nou)).toContain(ISO);
    await expect(validaFitxerMedia(nou)).resolves.toMatchObject({ format: 'mp4' });
    const delta = nou.size - blob.size;
    expect(delta).toBeGreaterThan(0);
    // Cada moof_offset apunta a l'inici d'un moof en el fitxer nou; les mostres no canvien.
    const b = await bytes(nou);
    const moofs = caixesPrimerNivell(b).filter((c) => c.tipus === 'moof').map((c) => c.inici);
    expect(offsetsTfra(b)).toEqual(moofs);
    expect(moofs).toEqual(offsetsMoof.map((o) => o + delta));
    expect(await mostresDe(nou)).toEqual(await mostresDe(blob));
    // «Amaga el lloc» el sap llevar sense moure cap byte de lloc.
    const net = await senseUbicacioVideo(nou);
    expect(net.net).toBe(true);
    expect(net.fitxer.size).toBe(nou.size);
    expect((await inspeccionaUbicacioMitja(net.fitxer)).coordenades).toBeNull();
    expect(await latin(net.fitxer)).not.toContain(ISO);
  });

  test('tfhd amb base_data_offset: es desplaça amb el moof', async () => {
    const { blob, offsetsMoof } = mp4Fragmentat({ base: true });
    const nou = (await ambUbicacioMp4(blob, LLOC)).fitxer;
    const b = await bytes(nou), v = new DataView(b.buffer);
    const delta = nou.size - blob.size;
    const bases = caixesPrimerNivell(b).filter((c) => c.tipus === 'moof').map((c) => {
      const tfhd = new TextDecoder('latin1').decode(b.subarray(c.inici, c.fi)).indexOf('tfhd') + c.inici - 4;
      return Number(v.getBigUint64(tfhd + 16));
    });
    expect(bases).toEqual(offsetsMoof.map((o) => o + delta));
  });

  test('un udta que ja hi era: el ©xyz hi va dins (un sol udta) i les mides creixen juntes', async () => {
    const udta = box('udta', box('©too', ascii('Chromium')));
    const { blob } = mp4Fragmentat({ udta });
    const nou = (await ambUbicacioMp4(blob, LLOC)).fitxer;
    const text = await latin(nou);
    expect(text.split('udta').length - 1).toBe(1);
    expect(text.indexOf('©xyz')).toBeGreaterThan(text.indexOf('©too'));
    expect((await inspeccionaUbicacioMitja(nou)).coordenades).toEqual(LLOC);
    await expect(validaFitxerMedia(nou)).resolves.toMatchObject({ format: 'mp4' });
  });
});

describe('MP4 pla: les taules stco i co64 apunten a les mateixes mostres', () => {
  test.each([['stco', false], ['co64', true]])('%s amb el moov davant de l’mdat', async (_nom, co64) => {
    const { blob, valors, mostres } = mp4Pla({ co64 });
    const nou = (await ambUbicacioMp4(blob, LLOC)).fitxer;
    const delta = nou.size - blob.size;
    const b = await bytes(nou), text = new TextDecoder('latin1').decode(b);
    const nous = valorsTaula(b);
    expect(nous).toEqual(valors.map((n) => n + delta));
    nous.forEach((n, i) => expect(text.slice(n, n + mostres[i].length)).toBe(mostres[i]));
    expect((await inspeccionaUbicacioMitja(nou)).coordenades).toEqual(LLOC);
  });

  test('moov al final: les mostres no es mouen i la taula no canvia', async () => {
    const { blob, valors } = mp4Pla({ moovAlFinal: true });
    const nou = (await ambUbicacioMp4(blob, LLOC)).fitxer;
    expect(valorsTaula(await bytes(nou))).toEqual(valors);
    expect((await inspeccionaUbicacioMitja(nou)).coordenades).toEqual(LLOC);
  });
});

describe('Sense garanties, el vídeo es queda com estava (null)', () => {
  const xyzAntic = box('udta', box('©xyz', ascii('+11.0000+022.0000/')));
  test.each([
    ['WebM (cap lloc estàndard)', () => new Blob([ascii('webm')], { type: 'video/webm' }), LLOC],
    ['caixa de primer nivell desconeguda (sidx)', () => mp4Fragmentat({ extraPrimerNivell: box('sidx', new Uint8Array(24)) }).blob, LLOC],
    ['ja porta un ©xyz', () => mp4Fragmentat({ udta: xyzAntic }).blob, LLOC],
    ['meta dins del moov', () => mp4Fragmentat({ udta: box('udta', box('meta', u32(0))) }).blob, LLOC],
    ['coordenades no vàlides', () => mp4Fragmentat().blob, { lat: 91, lng: 0 }],
  ])('%s', async (_cas, crea, lloc) => {
    expect(await ambUbicacioMp4(crea(), lloc)).toBeNull();
  });

  test('un tfra que no apunta a cap moof no es toca', async () => {
    const { blob } = mp4Fragmentat();
    const b = await bytes(blob);
    const mfra = caixesPrimerNivell(b).find((c) => c.tipus === 'mfra');
    // El primer moof_offset (tfra v1: 8 + 4 + 4 + 4 + 4 + 8 bytes des de l'inici del mfra) apunta una mica més enllà.
    const p = mfra.inici + 8 + 24 + 8;
    new DataView(b.buffer).setBigUint64(p, new DataView(b.buffer).getBigUint64(p) + 1n);
    expect(await ambUbicacioMp4(new Blob([b], { type: 'video/mp4' }), LLOC)).toBeNull();
  });

  test('el sostre de mida (MAXIM_ADJUNT_XAT.video) es respecta', async () => {
    const { blob } = mp4Fragmentat();
    expect(await ambUbicacioMp4(blob, LLOC, { maximBytes: blob.size + 10 })).toBeNull();
    expect(await ambUbicacioMp4(blob, LLOC, { maximBytes: blob.size + 100 })).not.toBeNull();
  });

  test('cancel·lat: AbortError', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(ambUbicacioMp4(mp4Fragmentat().blob, LLOC, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('l’entrada no es modifica', async () => {
    const { blob } = mp4Fragmentat({ base: true });
    const abans = await bytes(blob);
    await ambUbicacioMp4(blob, LLOC);
    expect(await bytes(blob)).toEqual(abans);
  });
});
