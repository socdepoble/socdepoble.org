/**
 * P1-64 (pla 261028_1526 §3.1.1 i §3.7.1; contracte de dades del Mapa, Mestre
 * 261028) · La ubicació d'una publicació del Mur (geolocalitzacio, el hero) i
 * l'índex de les fotos del cos (fotos_geo) es netegen en escriure-les
 * (mapSectionSubmissionToItem, branca 'mur') i en llegir-les
 * (elementDeFilaPublicada): les dades d'un veí no són fiables i el servidor no
 * les valida.
 */
import { describe, expect, test } from 'vitest';
import {
  MAX_FOTOS_GEO, MESURES_DEL_MAPA, ORIGENS_DEL_MAPA, PRECISIONS_DEL_MAPA, atributsDEtiqueta, elementDeFilaPublicada,
  etiquetesDImatge, mapSectionSubmissionToItem,
} from './mapejadorSeccions.js';
import { PRECISIONS } from '../components/universal/enquadrament/geolocalitzacio.js';

const SRC = 'sdp-media://mitjans/t/u/notes/font.webp';
const SRC2 = '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.webp';
const CONTINGUT = `<p>La font</p><img src="${SRC}" alt="Font"><img src="${SRC2}" alt="Torre">`;
const FOTO = Object.freeze({ src: SRC, lat: 38.592, lng: -0.418, precisio: '100m', precisio_m: 100, dataCaptura: '2017-05-14T10:22:33' });
const textHostil = () => JSON.parse('{"toString":0}');

const escriu = (payload) => mapSectionSubmissionToItem({ id: 'p1', sectionId: 'mur', payload: { content: CONTINGUT, ...payload } });
const llig = (payload) => elementDeFilaPublicada({ id: 'p1', payload: { content: CONTINGUT, ...payload }, createdAt: 'x', updatedAt: 'y' });

describe('P1-64 · el vocabulari del Mapa', () => {
  test('les precisions són les de PRECISIONS (geolocalitzacio.js) i els orígens, exif i manual', () => {
    expect(PRECISIONS_DEL_MAPA).toEqual(PRECISIONS.map((p) => p.valor));
    expect(MESURES_DEL_MAPA).toEqual(Object.fromEntries(PRECISIONS.map((p) => [p.valor, { decimals: p.decimals, precisio_m: p.precisio_m }])));
    expect(ORIGENS_DEL_MAPA).toEqual(['exif', 'manual']);
    expect(MAX_FOTOS_GEO).toBe(24);
  });
});

describe.each([['en escriure (mapSectionSubmissionToItem)', escriu], ['en llegir (elementDeFilaPublicada)', llig]])('P1-64 · fotos_geo %s', (_cami, net) => {
  test('una foto del contracte passa tal qual; dataCaptura absent, null', () => {
    const senseData = Object.fromEntries(Object.entries(FOTO).filter(([clau]) => clau !== 'dataCaptura'));
    expect(net({ fotos_geo: [FOTO, { ...senseData, src: SRC2 }] }).fotos_geo).toEqual([FOTO, { ...senseData, src: SRC2, dataCaptura: null }]);
  });

  test('objectes estranys, números en text, claus de més, un src aliè o absent del cos: fora', () => {
    const fotos = [
      FOTO,
      { ...FOTO, lat: '38.592' },
      { ...FOTO, precisio_m: '100' },
      { ...FOTO, precisio: 'metre' },
      { ...FOTO, lat: 0, lng: 0 },
      { ...FOTO, lat: 91 },
      { ...FOTO, extra: 1 },
      { ...FOTO, src: textHostil() },
      { ...FOTO, src: 'https://fora.example/x.webp' },
      { ...FOTO, src: 'sdp-media://mitjans/t/u/notes/no-hi-es.webp' },
      { ...FOTO, src: 'javascript:alert(1)' },
      { ...FOTO, dataCaptura: 'ahir' },
      { ...FOTO, dataCaptura: textHostil() },
      [SRC, 38.592, -0.418],
      'text',
      null,
      textHostil(),
    ];
    expect(net({ fotos_geo: fotos }).fotos_geo).toEqual([FOTO]);
  });

  test('com a molt 24, en ordre', () => {
    const fotos = Array.from({ length: 30 }, (_, i) => ({ ...FOTO, lat: 38 + i / 1000 }));
    const netes = net({ fotos_geo: fotos }).fotos_geo;
    expect(netes).toHaveLength(MAX_FOTOS_GEO);
    expect(netes.map((f) => f.lat)).toEqual(fotos.slice(0, 24).map((f) => f.lat));
  });

  test('si no és una llista, la clau se’n va', () => {
    for (const valor of [FOTO, 'x', 5, textHostil(), null]) expect(net({ fotos_geo: valor })).not.toHaveProperty('fotos_geo');
  });

  test('sense cos, cap foto de l’índex no es pot comprovar: fora', () => {
    const element = net({ content: '', fotos_geo: [FOTO] });
    expect(element.fotos_geo ?? []).toEqual([]);
  });
});

describe('P1-64 · la geolocalitzacio del hero', () => {
  const GEO = Object.freeze({ lat: 38.59, lng: -0.42, altitud: 500, precisio: 'poble', precisio_m: 1000, origen: 'exif' });

  test('en escriure: el contracte passa tal qual; una clau de més, o de mal tipus, se’n va', () => {
    expect(escriu({ geolocalitzacio: GEO }).geolocalitzacio).toEqual(GEO);
    expect(escriu({ geolocalitzacio: { ...GEO, hack: 1, precisio: 'metre', origen: 'gps', precisio_m: '1000' } }).geolocalitzacio)
      .toEqual({ lat: 38.59, lng: -0.42, altitud: 500 });
  });

  test('en escriure: sense unes coordenades del Mapa, la clau no viatja', () => {
    for (const geo of [{ lat: '38.5', lng: -0.4 }, { lat: 0, lng: 0 }, { lat: 38, lng: 181 }, [38, -0.4], 'x', textHostil()]) {
      expect(escriu({ geolocalitzacio: geo })).not.toHaveProperty('geolocalitzacio');
    }
  });

  test('en llegir: conserva precisio, precisio_m i origen vàlids i lleva la resta', () => {
    expect(llig({ geolocalitzacio: GEO }).geolocalitzacio).toEqual(GEO);
    expect(llig({ geolocalitzacio: { ...GEO, hack: 1 } }).geolocalitzacio).toEqual(GEO);
    expect(llig({ geolocalitzacio: { lat: 38.59, lng: -0.42, precisio: 'metre', precisio_m: '1000', origen: textHostil() } }).geolocalitzacio)
      .toEqual({ lat: 38.59, lng: -0.42 });
    expect(llig({ geolocalitzacio: { lat: 38.59, lng: -0.42, origen: 'manual', precisio: 'exacta', precisio_m: 1 } }).geolocalitzacio)
      .toEqual({ lat: 38.59, lng: -0.42, origen: 'manual', precisio: 'exacta', precisio_m: 1 });
  });

  test('dataCaptura continua sent una clau de text', () => {
    expect(llig({ dataCaptura: '2017-05-14T10:22:33' }).dataCaptura).toBe('2017-05-14T10:22:33');
    expect(llig({ dataCaptura: textHostil() })).not.toHaveProperty('dataCaptura');
  });
});

/* Revisió adversarial 261028 · El que el sanejador de lectura deixava passar i
   el contracte no admet (cada cas mata un mutant: MP5, MP14, MP16 i els de la
   precisió). */
describe.each([['en escriure (mapSectionSubmissionToItem)', escriu], ['en llegir (elementDeFilaPublicada)', llig]])('P1-64 · revisió adversarial %s', (_cami, net) => {
  test('una font que no és d’una foto de l’índex no passa, encara que siga al cos', () => {
    const fora = 'https://fora.example/x.webp';
    const privada = 'sdp-media://mitjans_privats/t/u/notes/a.webp';
    const dades = 'data:image/png;base64,iVBORw0KGgo=';
    const cos = `${CONTINGUT}<img src="${fora}"><img src="${privada}"><img src="${dades}">`;
    const fotos = [fora, privada, dades, ` ${SRC}`].map((src) => ({ ...FOTO, src }));
    expect(net({ content: cos, fotos_geo: [...fotos, FOTO] }).fotos_geo).toEqual([FOTO]);
  });

  test('precisio_m és el de la seua precisió i les coordenades es tornen a arrodonir', () => {
    expect(net({ fotos_geo: [{ ...FOTO, precisio_m: 1 }, { ...FOTO, precisio: 'poble' }] }).fotos_geo ?? []).toEqual([]);
    expect(net({ fotos_geo: [{ ...FOTO, lat: 38.5923456, lng: -0.4181234 }] }).fotos_geo)
      .toEqual([{ ...FOTO, lat: 38.592, lng: -0.418 }]);
    expect(net({ fotos_geo: [{ ...FOTO, precisio: 'poble', precisio_m: 1000, lat: 0.004, lng: 0.004 }] }).fotos_geo ?? []).toEqual([]);
  });

  test('la geolocalitzacio del hero: la precisió mana sobre els metres, les coordenades i l’altitud', () => {
    expect(net({ geolocalitzacio: { lat: 38.5923456, lng: -0.4181234, altitud: 512.4, precisio: 'poble', precisio_m: 1, origen: 'exif' } }).geolocalitzacio)
      .toEqual({ lat: 38.59, lng: -0.42, altitud: 500, precisio: 'poble', precisio_m: 1000, origen: 'exif' });
    expect(net({ geolocalitzacio: { lat: 38.5923456, lng: -0.4181234, altitud: 512.4, precisio: 'exacta', origen: 'manual' } }).geolocalitzacio)
      .toEqual({ lat: 38.59235, lng: -0.41812, altitud: 512.4, precisio: 'exacta', precisio_m: 1, origen: 'manual' });
    // Sense precisió, una fila d'abans: cap metre de més.
    expect(net({ geolocalitzacio: { lat: 38.6, lng: -0.3, precisio_m: 5 } }).geolocalitzacio).toEqual({ lat: 38.6, lng: -0.3 });
  });

  test('sense unes coordenades del Mapa, la clau del hero se’n va sencera; un origen o una altitud estranys, fora', () => {
    for (const geo of [{ lat: 'x', lng: '1e999' }, { precisio: 'poble' }, { lat: 38.5, lng: Number.POSITIVE_INFINITY }, { lat: 0.001, lng: 0.001, precisio: 'poble' }]) {
      expect(net({ geolocalitzacio: geo }), JSON.stringify(geo)).not.toHaveProperty('geolocalitzacio');
    }
    expect(net({ geolocalitzacio: { lat: 38.59, lng: -0.42, origen: 'gps', altitud: '500' } }).geolocalitzacio).toEqual({ lat: 38.59, lng: -0.42 });
  });

  test('dataCaptura: només el text ISO del contracte', () => {
    expect(net({ dataCaptura: '2017-05-14T10:22:33+02:00' }).dataCaptura).toBe('2017-05-14T10:22:33+02:00');
    for (const valor of ['ahir', { any: 2017 }, '2017-05-14 10:22:33']) expect(net({ dataCaptura: valor }), String(valor)).not.toHaveProperty('dataCaptura');
  });
});

describe('P1-64 · revisió adversarial · el cos hostil d’un veí', () => {
  test('una foto que només és dins d’un comentari no és al cos', () => {
    expect(llig({ content: `<!-- <img src="${SRC}"> -->`, fotos_geo: [FOTO] })).not.toHaveProperty('fotos_geo.0');
  });

  /* [ReDoS] Abans, 400 KB de «<img » trigaven uns 7 s (quadràtic). Lineal, uns pocs ms. */
  test.each([
    ['«<img » sense tancar', '<img '.repeat(80000)],
    ['«<img src="» sense tancar', '<img src="'.repeat(40000)],
    ['comentaris sense tancar', '<!--'.repeat(100000)],
    ['un nom d’atribut llarguíssim', `<img ${'a'.repeat(400000)}>`],
    ['espais i cometes soltes', `<img ${' '.repeat(200000)}"${' '.repeat(200000)}>`],
  ])('ReDoS · %s: lineal', (_cas, content) => {
    const inici = performance.now();
    llig({ content, fotos_geo: [FOTO] });
    expect(performance.now() - inici).toBeLessThan(300);
  });

  test('etiquetesDImatge i atributsDEtiqueta: el primer atribut mana; un src dins d’un altre valor no compta', () => {
    expect(etiquetesDImatge('<p>x</p><IMG SRC="/a.webp" alt="a"><img/src="/b.webp"><!-- <img src="/c.webp"> --><img src="/d.webp"')).toEqual([' SRC="/a.webp" alt="a"', '/src="/b.webp"']);
    expect(atributsDEtiqueta(' alt=\' src="sdp-media://mitjans/t/u/a.webp"\' data-lat=38.5 src="/x.webp" src="/y.webp" hidden')).toEqual({
      alt: ' src="sdp-media://mitjans/t/u/a.webp"', 'data-lat': '38.5', src: '/x.webp', hidden: '',
    });
    expect(etiquetesDImatge(null)).toEqual([]);
    expect(atributsDEtiqueta(textHostil())).toEqual({});
  });
});
