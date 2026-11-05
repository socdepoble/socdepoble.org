// @vitest-environment node
/* VQ · Fase 3a de l'eina de pobles nous (261030; disseny
   nit/viquipedia_disseny.md §4.2, §4.4 i §6.2) · La part pura: quan una fitxa
   és completa, com s'omplin els buits i quan la pàgina porta el panell. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  CAMPS_DE_FITXA, VERSIO_ALGORITME, campsQueFalten, clauDeViquipedia, entradaAmbDades, esDelMateixPoble,
  fitxaCompleta, fitxaOriginal, hidratacioRevisada, fusionaAmbViquipedia, miniaturaDeCommons, pobleHidratable
} from './fitxaDelPoble.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { TOWNS } from './townsContent.js';

const TORRE_GRAN = Object.freeze({
  src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Torre_Gran_%28Torremanzanas%29_3.jpg/1920px-Torre_Gran_%28Torremanzanas%29_3.jpg',
  fitxer: 'Torre Gran (Torremanzanas) 3.jpg', amplada: 3008, alcada: 2000, autor: 'Relleu', llicencia: 'CC BY-SA 3.0 es',
  llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/es/deed.en',
  fontUrl: 'https://commons.wikimedia.org/wiki/File:Torre_Gran_(Torremanzanas)_3.jpg'
});
const DTO = Object.freeze({
  estat: 'parcial', id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova de Prova',
  content: 'Vilanova de Prova és un municipi inventat per a les proves.', provincia: 'Alacant', comarca: 'L’Alcoià',
  population: '120 hab', population_year: 2025, elevation: 400, area: 12, gentilici: 'vilanoví / vilanovina', shield_url: 'https://upload.wikimedia.org/shield.svg', image_url: TORRE_GRAN.src, avatar_url: TORRE_GRAN.src, lat: 38.6, lng: -0.4, wikidata_id: 'Q1', wikipedia_title: 'Vilanova de Prova',
  copyright: 'Text: Viquipèdia (CC BY-SA 4.0) · Imatges: Wikimedia Commons (vegeu els crèdits)',
  imatges: { hero: TORRE_GRAN, avatar: TORRE_GRAN, reserva: null }
});
const entrada = (dto = DTO) => ({ clau: 'x', llegitEl: Date.UTC(2026, 9, 30), dto });
const INCOMPLET = Object.freeze({ id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova', provincia: 'Alacant' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fitxa completa', () => {
  test('la llavor revisada pot declarar absències reals sense fer-se passar per completa', () => {
    const revisats = MOCK_TOWNS.filter(town => town.wikipedia_hydration);
    expect(revisats.length).toBeGreaterThanOrEqual(21);
    expect(revisats.every(town => hidratacioRevisada(town))).toBe(true);
    expect(TOWNS.length).toBe(MOCK_TOWNS.length);
  });
  test('la foto sola no fa completa una fitxa; el marcador genèric tampoc', () => {
    expect(CAMPS_DE_FITXA).toEqual(expect.arrayContaining(['image_url', 'population_year', 'elevation', 'area', 'gentilici']));
    expect(CAMPS_DE_FITXA).not.toContain('shield_url');
    expect(campsQueFalten(INCOMPLET)).toEqual(CAMPS_DE_FITXA.filter(camp => camp !== 'provincia'));
    const completa = { ...DTO, image_url: '/foto-aportada.jpg' };
    expect(fitxaCompleta(completa)).toBe(true);
    expect(campsQueFalten({ ...completa, image_url: '/hero_nanobanana.png' })).toEqual(['image_url']);
    expect(campsQueFalten({ ...completa, area: null, imageSrc: '/foto.jpg' })).toEqual(['area']);
    expect(campsQueFalten(null)).toEqual(CAMPS_DE_FITXA);
  });
});

describe('la clau i la guarda del mateix poble', () => {
  test('slug, província normalitzada i versió de l’algoritme', () => {
    expect(clauDeViquipedia(INCOMPLET)).toBe(`vilanova-de-prova|alacant|a${VERSIO_ALGORITME}`);
    expect(clauDeViquipedia({ title: 'Vilanova de Prova', provincia: 'Castelló' })).toBe(`vilanova-de-prova|castello|a${VERSIO_ALGORITME}`);
    expect(clauDeViquipedia({ name: 'Vilanova de Prova' })).toBe(`vilanova-de-prova||a${VERSIO_ALGORITME}`);
    expect(clauDeViquipedia({ title: '¿?' })).toBeNull();
    expect(clauDeViquipedia(null)).toBeNull();
  });

  test('una proposta només val per al poble amb el mateix nom', () => {
    expect(esDelMateixPoble(INCOMPLET, DTO)).toBe(true);
    expect(esDelMateixPoble(INCOMPLET, { ...DTO, title: 'Vilanova del Bierzo' })).toBe(false);
    expect(esDelMateixPoble({ title: '' }, DTO)).toBe(false);
    expect(entradaAmbDades(entrada())).toBe(true);
    expect(entradaAmbDades(entrada({ ...DTO, estat: 'sense-article' }))).toBe(false);
    expect(entradaAmbDades(entrada({ ...DTO, estat: 'no-disponible' }))).toBe(false);
  });
});

describe('la fusió', () => {
  test('només ompli els buits, mai cap camp que la fitxa porte, i diu quins', () => {
    const hidratat = fusionaAmbViquipedia(INCOMPLET, entrada());
    expect(hidratat).not.toBe(INCOMPLET);
    expect(hidratat).toMatchObject({
      id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova', provincia: 'Alacant',
      content: DTO.content, comarca: DTO.comarca, population: '120 hab', population_year: 2025, elevation: 400, area: 12, gentilici: 'vilanoví / vilanovina', lat: 38.6, lng: -0.4,
      wikipedia_title: 'Vilanova de Prova', wikidata_id: 'Q1'
    });
    expect(hidratat.fontsDeViquipedia.omplits).toEqual(['content', 'comarca', 'population', 'lat', 'lng', 'wikipedia_title', 'wikidata_id', 'population_year', 'elevation', 'area', 'gentilici']);
    expect(hidratat.fontsDeViquipedia.original).toBe(INCOMPLET);
    expect(hidratat.fontsDeViquipedia.llegitEl).toBe(Date.UTC(2026, 9, 30));
    expect(fitxaOriginal(hidratat)).toBe(INCOMPLET);
    expect(fitxaOriginal(INCOMPLET)).toBe(INCOMPLET);
  });

  test('les fotos remotes només queden en el DTO del panell, i la foto real aportada es conserva', () => {
    const hidratat = fusionaAmbViquipedia(INCOMPLET, entrada());
    expect(hidratat.image_url).toBeUndefined();expect(hidratat.avatar_url).toBeUndefined();expect(hidratat.shield_url).toBeUndefined();
    expect(hidratat.fontsDeViquipedia.dto.imatges.hero).toBe(TORRE_GRAN);
    const fotoLocal = fusionaAmbViquipedia({ ...INCOMPLET, image_url: '/aportada.jpg', avatar_url: '/avatar-aportat.jpg' }, entrada());
    expect(fotoLocal.image_url).toBe('/aportada.jpg');expect(fotoLocal.avatar_url).toBe('/avatar-aportat.jpg');
    expect(fotoLocal.fontsDeViquipedia.dto).toBe(DTO);
  });

  test('torna el MATEIX objecte si no ompli res', () => {
    const complet = { ...DTO, image_url: '/aportada.jpg', avatar_url: '/avatar.jpg' };
    expect(fusionaAmbViquipedia(complet, entrada({ ...DTO, title: complet.title }))).toBe(complet);
    expect(fusionaAmbViquipedia(INCOMPLET, entrada({ ...DTO, estat: 'sense-article' }))).toBe(INCOMPLET);
    expect(fusionaAmbViquipedia(INCOMPLET, entrada({ ...DTO, estat: 'no-disponible' }))).toBe(INCOMPLET);
    expect(fusionaAmbViquipedia(INCOMPLET, entrada({ ...DTO, title: 'Vilanova del Bierzo' }))).toBe(INCOMPLET);
    expect(fusionaAmbViquipedia(INCOMPLET, null)).toBe(INCOMPLET);
    expect(fusionaAmbViquipedia(INCOMPLET, entrada({ ...DTO, content: '', comarca: null, population: null, population_year: null, elevation: null, area: null, gentilici: null, shield_url: null, image_url: null, avatar_url: null, lat: null, lng: null, wikidata_id: null, wikipedia_title: null })))
      .toBe(INCOMPLET);
  });
});

describe('quan la pàgina porta el panell', () => {
  test('fitxa incompleta o ja hidratada, sí; completa, no; a l’app nativa, mai', () => {
    expect(pobleHidratable(INCOMPLET)).toBe(true);
    expect(pobleHidratable(fusionaAmbViquipedia(INCOMPLET, entrada()))).toBe(true);
    expect(pobleHidratable({ ...DTO, image_url: '/aportada.jpg' })).toBe(false);
    expect(pobleHidratable({ ...DTO, wikipedia_provenance: { photo: TORRE_GRAN } })).toBe(true);
    expect(pobleHidratable({ content: '.' })).toBe(false);
    expect(pobleHidratable(null)).toBe(false);
    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } });
    expect(pobleHidratable(INCOMPLET)).toBe(false);
    expect(pobleHidratable({ ...DTO, wikipedia_provenance: { photo: TORRE_GRAN } })).toBe(true);
  });
});

describe('la miniatura de Commons', () => {
  test('1920 → 960 (mida estàndard); la resta, tal qual', () => {
    expect(miniaturaDeCommons(TORRE_GRAN.src)).toBe(TORRE_GRAN.src.replace('/1920px-', '/960px-'));
    expect(miniaturaDeCommons('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/1280px-X.jpg'))
      .toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/960px-X.jpg');
    for (const tal of [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/500px-X.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/ab/X.jpg',
      'https://exemple.org/thumb/a/ab/X.jpg/1920px-X.jpg',
      null
    ]) expect(miniaturaDeCommons(tal)).toBe(tal);
  });
});

test('AH-27 · no associa la data d’un cens nou a una població antiga aportada', () => {
  const town = { ...INCOMPLET, population: '99 hab' };
  const hidratat = fusionaAmbViquipedia(town, entrada());
  expect(hidratat.population).toBe('99 hab');expect(hidratat.population_year).toBeUndefined();
});

test('AH-27 · una revisió parcial caduca i no val amb fonts o camps inventats', () => {
  const ara = Date.now();const marcador = { version: 2, checked_at: new Date(ara).toISOString(), missing: ['area'], source_url: 'https://www.wikidata.org/wiki/Q1', status: 'partial' };
  expect(hidratacioRevisada({ wikipedia_hydration: marcador }, null, ara)).toBe(true);
  expect(hidratacioRevisada({ wikipedia_hydration: marcador }, null, ara + 31 * 86400000)).toBe(false);
  expect(hidratacioRevisada({ wikipedia_hydration: { ...marcador, source_url: 'https://example.org/wiki/Q1' } }, null, ara)).toBe(false);
  expect(hidratacioRevisada({ wikipedia_hydration: { ...marcador, missing: ['inventat'] } }, null, ara)).toBe(false);
});
