import { describe, expect, test, vi } from 'vitest';
import { MAX_FOTOS_GEO, TEMPS_HERO_MS, fotosGeoDelCos, geoDelHero, precisioDeCoordenades } from './geoDeLesFotos.js';
import { ajustaPrecisioGps } from '../../components/universal/enquadrament/exifIncrustat.js';
import {
  APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, jpegAmbExif, tiff,
} from '../../../tests/helpers/jpegProva.js';

/* P1-64 (pla 261028_1526 §3.1.1; contracte de dades del Mapa, Mestre 261028)
   · L'índex de les fotos del cos (data-* de l'ordre «/» Imatge) i la ubicació
   del hero (el seu EXIF), derivats en publicar. HTML sintètic i JPEG
   sintètics: cap foto real. */

const img = (src, atributs = '') => `<img src="${src}" alt="Foto"${atributs ? ` ${atributs}` : ''}>`;
const GEO = 'data-lat="38.592" data-lng="-0.418" data-precisio="100m" data-captura="2017-05-14T10:22:33"';
const SRC = 'sdp-media://mitjans/t/u/notes/a.webp';
const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const dataUrl = (bytes) => `data:image/jpeg;base64,${aBase64(bytes)}`;

describe('P1-64 · fotosGeoDelCos', () => {
  test('una foto del cos amb el registre: el contracte del Mapa', () => {
    expect(fotosGeoDelCos(`<p>Text</p>${img(SRC, GEO)}`)).toEqual([
      { src: SRC, lat: 38.592, lng: -0.418, precisio: '100m', precisio_m: 100, dataCaptura: '2017-05-14T10:22:33' },
    ]);
  });

  test('sense registre, amb un registre a mitges o estrany, o amb un src aliè: fora', () => {
    const html = [
      img('/assets/neta.webp'),
      img('/assets/sense-precisio.webp', 'data-lat="38.5" data-lng="-0.4"'),
      img('/assets/precisio-estranya.webp', 'data-lat="38.5" data-lng="-0.4" data-precisio="metre"'),
      img('/assets/text.webp', 'data-lat="38.5;x" data-lng="-0.4" data-precisio="poble"'),
      img('/assets/zero.webp', 'data-lat="0" data-lng="0" data-precisio="poble"'),
      img('/assets/fora-de-rang.webp', 'data-lat="91" data-lng="-0.4" data-precisio="poble"'),
      img('https://fora.example/x.webp', GEO),
      img('javascript:alert(1)', GEO),
      /* Revisió adversarial 261028 · Ni un data: (la foto sencera dins del payload) ni el bucket privat. */
      img('data:image/png;base64,iVBORw0KGgo=', GEO),
      img('sdp-media://mitjans_privats/t/u/notes/a.webp', GEO),
    ].join('');
    expect(fotosGeoDelCos(html)).toEqual([]);
  });

  /* Revisió adversarial 261028 (mutant G2) · La repetida va ABANS del sostre: sense la guarda, n'hi hauria dues. */
  test('un src repetit dins dels 24 primers només hi és una vegada (la primera)', () => {
    const html = img(SRC, GEO) + img(SRC, 'data-lat="38.5" data-lng="-0.4" data-precisio="poble"') + img('/assets/b.webp', GEO);
    expect(fotosGeoDelCos(html).map((f) => [f.src, f.lat])).toEqual([[SRC, 38.592], ['/assets/b.webp', 38.592]]);
  });

  /* Revisió adversarial 261028 (ReDoS) · El cos és el de la persona, però tampoc no ha de penjar la publicació. */
  test.each([['«<img » sense tancar', '<img '.repeat(80000)], ['un nom d’atribut llarguíssim', `<img ${'a'.repeat(400000)}>`]])('lineal: %s', (_cas, html) => {
    const inici = performance.now();
    expect(fotosGeoDelCos(html)).toEqual([]);
    expect(performance.now() - inici).toBeLessThan(300);
  });

  test('sense data-captura (o amb una de mala forma), dataCaptura null; un data-lat més precís que la seua precisió s’arrodonix', () => {
    expect(fotosGeoDelCos(img(SRC, 'data-lat="38.591937" data-lng="-0.418426" data-precisio="poble" data-captura="ahir"'))).toEqual([
      { src: SRC, lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000, dataCaptura: null },
    ]);
  });

  test('com a molt 24, en ordre i sense repetir cap src; les entitats d’atribut es desfan', () => {
    const html = Array.from({ length: 30 }, (_, i) => img(`/assets/f${i}.webp?a=1&amp;b=${i}`, GEO)).join('') + img('/assets/f0.webp?a=1&amp;b=0', GEO);
    const fotos = fotosGeoDelCos(html);
    expect(fotos).toHaveLength(MAX_FOTOS_GEO);
    expect(fotos[0].src).toBe('/assets/f0.webp?a=1&b=0');
    expect(fotos.at(-1).src).toBe('/assets/f23.webp?a=1&b=23');
  });

  test('un cos buit o que no és text: cap foto', () => {
    expect(fotosGeoDelCos('')).toEqual([]);
    expect(fotosGeoDelCos(null)).toEqual([]);
    expect(fotosGeoDelCos({ toString: 0 })).toEqual([]);
  });
});

describe('P1-64 · precisioDeCoordenades', () => {
  test('la marca d’ajustaPrecisioGps es recupera de les coordenades', () => {
    expect(precisioDeCoordenades({ lat: 38.59, lng: -0.42 })).toBe('poble');
    expect(precisioDeCoordenades({ lat: 38.592, lng: -0.418 })).toBe('100m');
    expect(precisioDeCoordenades({ lat: 38.5919, lng: -0.4184 })).toBe('exacta');
    expect(precisioDeCoordenades(null)).toBeNull();
  });
});

describe('P1-64 · geoDelHero', () => {
  const ambGps = (precisio) => {
    const bloc = tiff({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() });
    return concatena(SOI, APP0_JFIF, app1Exif(ajustaPrecisioGps(bloc, precisio)), IMATGE);
  };

  test('un data: URL amb GPS: la ubicació amb la precisió del fitxer (el denominador) i la data', async () => {
    expect(await geoDelHero(dataUrl(ambGps('100m')))).toEqual({
      geolocalitzacio: { lat: 38.592, lng: -0.418, altitud: 500, precisio: '100m', precisio_m: 100, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
    });
    expect((await geoDelHero(dataUrl(ambGps('exacta')))).geolocalitzacio).toEqual({
      lat: 38.5919, lng: -0.4184, altitud: 456.7, precisio: 'exacta', precisio_m: 1, origen: 'exif',
    });
  });

  test('sense GPS, només la data; sense EXIF, res', async () => {
    expect(await geoDelHero(dataUrl(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33') })))).toEqual({ dataCaptura: '2017-05-14T10:22:33' });
    expect(await geoDelHero(dataUrl(concatena(SOI, APP0_JFIF, IMATGE)))).toEqual({});
  });

  test('una foto del bucket públic: es resol i es llig per Range amb el temps fitat', async () => {
    const resol = vi.fn(async () => '/assets/uploads/notes/a.webp');
    const llegix = vi.fn(async () => ({ orientacio: 1, gps: { lat: 38.59, lng: -0.42, altitud: 500 }, dataCaptura: '2017-05-14T10:22:33' }));
    expect(await geoDelHero(SRC, { resol, llegix })).toEqual({
      geolocalitzacio: { lat: 38.59, lng: -0.42, altitud: 500, precisio: 'poble', precisio_m: 1000, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
    });
    expect(resol).toHaveBeenCalledWith(SRC, { signal: expect.any(AbortSignal) });
    expect(llegix.mock.calls[0][1]).toMatchObject({ temps: TEMPS_HERO_MS, tempsPrefix: TEMPS_HERO_MS, ambGps: true, ambTiff: true });
  });

  /* Revisió adversarial 261028 (dades, 5) · Una foto '100m' a 38.590, -0.420: les coordenades soles en dirien
     'poble'; amb el bloc TIFF de la lectura, la marca del denominador mana. */
  test('una lectura remota amb el TIFF: la precisió del denominador, no la deduïda', async () => {
    const bloc = ajustaPrecisioGps(tiff({ gps: gpsTorre({ lat: [[38, 1], [35, 1], [2400, 100]], lng: [[0, 1], [25, 1], [1200, 100]] }) }), '100m');
    const llegix = vi.fn(async () => ({ orientacio: 1, gps: { lat: 38.59, lng: -0.42, altitud: 500 }, dataCaptura: null, tiff: bloc }));
    expect((await geoDelHero(SRC, { resol: async () => '/assets/uploads/notes/a.webp', llegix })).geolocalitzacio)
      .toEqual({ lat: 38.59, lng: -0.42, altitud: 500, precisio: '100m', precisio_m: 100, origen: 'exif' });
    const senseTiff = vi.fn(async () => ({ orientacio: 1, gps: { lat: 38.59, lng: -0.42, altitud: 500 }, dataCaptura: null, tiff: 'no' }));
    expect((await geoDelHero(SRC, { resol: async () => '/assets/uploads/notes/a.webp', llegix: senseTiff })).geolocalitzacio.precisio).toBe('poble');
  });

  test('si falla o tarda més del temps, cap clau i cap rebuig: publicar no s’atura', async () => {
    expect(await geoDelHero(SRC, { resol: async () => { throw new Error('xarxa'); } })).toEqual({});
    expect(await geoDelHero(SRC, { resol: async () => '/assets/a.webp', llegix: async () => { throw new Error('404'); } })).toEqual({});
    const penjada = vi.fn(() => new Promise(() => {}));
    expect(await geoDelHero(SRC, { resol: async () => '/assets/a.webp', llegix: penjada, temps: 20 })).toEqual({});
    expect(await geoDelHero(SRC, { resol: async () => 'https://fora.example/a.webp', llegix: penjada })).toEqual({});
    expect(penjada).toHaveBeenCalledTimes(1);
  });

  test('una referència que no és del bucket públic, una ruta del paquet o res: no es resol ni es llig', async () => {
    const resol = vi.fn();
    const llegix = vi.fn();
    for (const src of ['sdp-media://mitjans_privats/t/u/a.webp', '/assets/system/ui/logo.svg', 'https://fora.example/a.webp', '', null]) {
      expect(await geoDelHero(src, { resol, llegix })).toEqual({});
    }
    // Revisió adversarial 261028 (mutant G11) · Ni el port: cap petició per a un hero que no és del bucket públic.
    expect(resol).not.toHaveBeenCalled();
    expect(llegix).not.toHaveBeenCalled();
  });
});
