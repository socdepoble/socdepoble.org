// @vitest-environment node
/* P1-64 · De les publicacions del Mur als punts del Mapa Fotogràfic, amb el
   contracte de dades del Mestre (261028): verd per al GPS real de la foto
   (geolocalitzacio de la principal amb origen 'exif' i fotos_geo), ocre per a
   l'estimada (la foto amb GPS més pròxima en el temps de la MATEIXA
   publicació), la del poble (poble_id) i la indicada per l'autor. També les
   guardes de privacitat: cap perfil, avatar, xat ni àmbit de persona; les
   coordenades tal com es van desar; cap estimació entre publicacions; i el
   codi del nucli no parla amb cap servidor. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  MAX_FOTOS_PER_PUBLICACIO, TIPUS_DEL_MAPA, coordenadesDelPoble, esPublicacioDelMapa, fotosDeLaPublicacio, puntsDelMapa
} from './puntsDelMapa.js';
import { TESSELES } from './mapConfig.js';

const FOTO = (nom) => `/assets/uploads/gent/veina/mur/${nom}.webp`;
const GPS = (lat, lng, extra = {}) => ({ lat, lng, precisio: 'exacta', precisio_m: 1, origen: 'exif', ...extra });

const A = {
  id: 'a', type: 'feed', title: 'Les fonts de la Torre', poble_id: 'la-torre-de-les-macanes',
  image_url: FOTO('a1'), geolocalitzacio: GPS(38.5919, -0.4184), dataCaptura: '2026-10-12T10:00:00+02:00',
  fotos_geo: [
    { src: FOTO('a2'), lat: 38.6009, lng: -0.4184, precisio: 'exacta', precisio_m: 1, dataCaptura: '2026-10-12T11:00:00+02:00' },
    { src: FOTO('a3'), lat: null, lng: null, dataCaptura: '2026-10-12T10:40:00+02:00' }
  ]
};
const B = { id: 'b', type: 'feed', title: 'Penàguila sense GPS', poble_id: 'penaguila', image_url: FOTO('b1') };
const C = {
  id: 'c', type: 'patrimoni', title: 'El castell', image: [FOTO('c1')],
  geolocalitzacio: { lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000, origen: 'exif' }, dataCaptura: '2026-10-11T09:00:00+02:00'
};
const D = {
  id: 'd', type: 'event', title: 'Viatge al Pont du Gard', image_url: FOTO('d1'),
  geolocalitzacio: GPS(43.9475, 4.535), dataCaptura: '2026-10-13T12:00:00+02:00'
};

describe('quins elements entren', () => {
  test('només publicacions, actes i patrimoni; mai perfil, avatar, xat, persona, sistema ni Mercat', () => {
    expect(TIPUS_DEL_MAPA).toEqual(['feed', 'post', 'publicacio', 'event', 'patrimoni']);
    for (const item of [A, B, C, D, { id: 1, type: 'post' }]) expect(esPublicacioDelMapa(item)).toBe(true);
    const fora = [
      { id: 'p', type: 'persona', image_url: FOTO('p'), geolocalitzacio: GPS(38.59, -0.41) },
      { id: 'v', type: 'avatar', image_url: FOTO('v'), geolocalitzacio: GPS(38.59, -0.41) },
      { id: 'x', type: 'xat', image_url: FOTO('x'), geolocalitzacio: GPS(38.59, -0.41) },
      { id: 'm', type: 'feed', ambit: 'persona', image_url: FOTO('m'), geolocalitzacio: GPS(38.59, -0.41) },
      { id: 's', type: 'sistema', isSystem: true, image_url: FOTO('s') },
      { id: 'r', type: 'product', image_url: FOTO('r'), poble_id: 'xixona' },
      { type: 'feed', image_url: FOTO('n') },
      null, 'brossa'
    ];
    for (const item of fora) expect(esPublicacioDelMapa(item)).toBe(false);
    expect(puntsDelMapa(fora)).toEqual({ fotos: [], parades: [], pendents: [] });
  });

  test('la cara de qui signa no és cap foto de la publicació', () => {
    const fotos = fotosDeLaPublicacio({ id: 'z', type: 'feed', image_url: FOTO('cara'), author_avatar: FOTO('cara'), images: [FOTO('z1')] });
    expect(fotos.map((f) => f.src)).toEqual([FOTO('z1')]);
  });
});

describe('les fotos d’una publicació', () => {
  test('la principal, les de fotos_geo i les de la galeria, sense repetides i amb un sostre', () => {
    const fotos = fotosDeLaPublicacio({ ...A, images: [FOTO('a1'), FOTO('a4')] });
    expect(fotos.map((f) => [f.src, f.origen, f.principal])).toEqual([
      [FOTO('a1'), 'exif', true], [FOTO('a2'), 'exif', false], [FOTO('a3'), null, false], [FOTO('a4'), null, false]
    ]);
    expect(fotos[0]).toMatchObject({ id: `feed:a|${FOTO('a1')}`, lat: 38.5919, lng: -0.4184, precisio: 'exacta', precisio_m: 1, dataCaptura: '2026-10-12T10:00:00+02:00' });
    const moltes = fotosDeLaPublicacio({ id: 'g', type: 'feed', images: Array.from({ length: 40 }, (_, i) => FOTO(`g${i}`)) });
    expect(moltes).toHaveLength(MAX_FOTOS_PER_PUBLICACIO);
  });

  test('una latitud de text no és cap lloc; una principal sense origen és indicada, no GPS', () => {
    const [text] = fotosDeLaPublicacio({ id: 't', type: 'feed', image_url: FOTO('t'), geolocalitzacio: { lat: '38.59', lng: -0.42, origen: 'exif' } });
    expect(text).toMatchObject({ lat: null, lng: null, origen: null });
    const [sense] = fotosDeLaPublicacio({ id: 'u', type: 'feed', image_url: FOTO('u'), geolocalitzacio: { lat: 38.59, lng: -0.42 } });
    expect(sense.origen).toBe('manual');
    const [ambPrecisio] = fotosDeLaPublicacio({ id: 'w', type: 'feed', image_url: FOTO('w'), geolocalitzacio: { lat: 38.6, lng: -0.4, precisio: '100m', origen: 'exif' } });
    expect(ambPrecisio).toMatchObject({ precisio: '100m', precisio_m: 100 });
  });

  test('una foto de fora es pinta sense miniatura: no es demana cap imatge externa', () => {
    const [fora] = fotosDeLaPublicacio({ id: 'e', type: 'feed', image_url: 'https://example.com/foto.jpg', geolocalitzacio: GPS(38.6, -0.4) });
    expect(fora).toMatchObject({ src: 'https://example.com/foto.jpg', miniatura: null, lat: 38.6 });
    expect(fotosDeLaPublicacio(A)[0].miniatura).toBe(FOTO('a1'));
  });

  test('D3 · una pujada pròpia (sdp-media://) és miniatura: el renderitzador la resol pel port', () => {
    const ref = 'sdp-media://mitjans/veina/mur/pujada.webp';
    const [pujada] = fotosDeLaPublicacio({ id: 'p', type: 'feed', image_url: ref, geolocalitzacio: GPS(38.6, -0.4) });
    expect(pujada).toMatchObject({ src: ref, miniatura: ref });
  });
});

describe('els punts del mapa', () => {
  const punts = puntsDelMapa([B, A, D, C]);

  test('verd per al GPS (també arrodonit al poble), ocre per a l’estimada i per al poble', () => {
    const per = Object.fromEntries(punts.fotos.map((f) => [f.src, f]));
    expect(per[FOTO('a1')]).toMatchObject({ estat: 'gps', lloc: 'La Torre de les Maçanes', publicacio: 'feed:a', titol: 'Les fonts de la Torre', poble_id: 'la-torre-de-les-macanes' });
    expect(per[FOTO('a2')].estat).toBe('gps');
    expect(per[FOTO('a3')]).toMatchObject({ estat: 'estimada', referencia: `feed:a|${FOTO('a2')}`, diferencia_s: 1200, incertesaAlta: false, lat: 38.6009, lng: -0.4184 });
    expect(per[FOTO('b1')]).toMatchObject({ estat: 'poble', lat: 38.6315, lng: -0.3892, lloc: 'Penàguila' });
    // Una precisió 'poble' és real però arrodonida: verda, amb les coordenades tal com es van desar.
    expect(per[FOTO('c1')]).toMatchObject({ estat: 'gps', lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000 });
    expect(per[FOTO('d1')]).toMatchObject({ estat: 'gps', lat: 43.9475, lng: 4.535, lloc: null });
    expect(punts.pendents).toEqual([]);
  });

  test('ordre de captura per a tot el conjunt; la foto sense data, al final', () => {
    expect(punts.fotos.map((f) => f.src)).toEqual([FOTO('c1'), FOTO('a1'), FOTO('a3'), FOTO('a2'), FOTO('d1'), FOTO('b1')]);
    expect(punts.fotos.map((f) => f.ordre)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(puntsDelMapa([B, A, D, C])).toEqual(punts);
  });

  test('parades: una per lloc de cada publicació, al lloc de la primera foto, en ordre de primera visita', () => {
    expect(punts.parades.map((p) => [p.id, p.estat, p.lloc, p.fotos.map((i) => punts.fotos[i].src), p.estimada])).toEqual([
      ['patrimoni:c~0', 'gps', 'La Torre de les Maçanes', [FOTO('c1')], false],
      // a1 i a3 (estimada al lloc de a2, a 1,0008 km) no caben dins d'1 km de la primera: a2 i a3 fan parada.
      ['feed:a~0', 'gps', 'La Torre de les Maçanes', [FOTO('a1')], false],
      ['feed:a~1', 'estimada', 'La Torre de les Maçanes', [FOTO('a3'), FOTO('a2')], true],
      ['event:d~0', 'gps', null, [FOTO('d1')], false],
      ['feed:b~0', 'poble', 'Penàguila', [FOTO('b1')], true]
    ]);
    expect(punts.parades[1]).toMatchObject({ lat: 38.5919, lng: -0.4184, precisio: 'exacta', precisio_m: 1, dataCaptura: '2026-10-12T10:00:00+02:00', titol: 'Les fonts de la Torre' });
    expect(punts.fotos.every((f) => punts.parades[f.parada].fotos.includes(punts.fotos.indexOf(f)))).toBe(true);
  });

  /* Emowe M1 · Cada punt porta d'on ve el lloc (origen) i, si no és el seu, com
     s'ha deduït (inferencia); la parada, els de la seua primera foto. Les
     publicacions d'entrada no es toquen (congelades a fons: un canvi llançaria). */
  test('M1 · fotos i parades porten origen i inferència per separat, i les publicacions d’entrada no canvien', () => {
    const congela = (valor) => {
      if (valor && typeof valor === 'object') { Object.values(valor).forEach(congela); Object.freeze(valor); }
      return valor;
    };
    const entrada = congela(structuredClone([B, A, D, C]));
    const r = puntsDelMapa(entrada);
    expect(entrada).toEqual([B, A, D, C]);
    const per = Object.fromEntries(r.fotos.map((f) => [f.src, f]));
    expect(per[FOTO('a1')]).toMatchObject({ estat: 'gps', origen: 'exif', inferencia: null });
    expect(per[FOTO('a3')]).toMatchObject({
      estat: 'estimada', origen: null, inferencia: { tipus: 'estimada', referencia: `feed:a|${FOTO('a2')}`, diferencia_s: 1200, incertesaAlta: false }
    });
    expect(per[FOTO('b1')]).toMatchObject({ estat: 'poble', origen: null, inferencia: { tipus: 'poble', referencia: null, incertesaAlta: true } });
    expect(r.parades.map((p) => [p.id, p.origen, p.inferencia?.tipus ?? null])).toEqual([
      ['patrimoni:c~0', 'exif', null],
      ['feed:a~0', 'exif', null],
      ['feed:a~1', null, 'estimada'],
      ['event:d~0', 'exif', null],
      ['feed:b~0', null, 'poble']
    ]);
    // Cap punt barreja els dos.
    expect([...r.fotos, ...r.parades].every((p) => p.origen === null || p.inferencia === null)).toBe(true);
  });

  test('escala: 1 000 publicacions de 25 fotos, en una sola passada (abans, una volta sencera per parada: 7 s)', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: `e${i}`, type: 'feed', image_url: FOTO(`e${i}`), geolocalitzacio: GPS(38 + (i % 40) * 0.05, -1 + Math.floor(i / 40) * 0.05),
      dataCaptura: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}T10:00:00+02:00`,
      fotos_geo: Array.from({ length: 24 }, (_, k) => ({
        src: FOTO(`e${i}_${k}`), lat: 38 + (i % 40) * 0.05 + k * 0.02, lng: -1 + Math.floor(i / 40) * 0.05,
        dataCaptura: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}T${String(10 + Math.floor(k / 4)).padStart(2, '0')}:${String((k % 4) * 15).padStart(2, '0')}:30+02:00`
      }))
    }));
    const inici = performance.now();
    const molts = puntsDelMapa(items);
    expect(performance.now() - inici).toBeLessThan(2000);
    expect(molts.fotos).toHaveLength(25000);
    // Cada foto és exactament a la llista de la seua parada, una vegada i en ordre.
    const vistes = molts.parades.flatMap((parada) => parada.fotos);
    expect(vistes).toHaveLength(25000);
    expect(new Set(vistes).size).toBe(25000);
    expect(molts.parades.every((parada, k) => parada.fotos.every((i, j) => molts.fotos[i].parada === k && (j === 0 || parada.fotos[j - 1] < i)))).toBe(true);
  });

  test('un canvi de dia fa parada nova encara que siga al mateix lloc', () => {
    const dosDies = puntsDelMapa([{
      id: 'r', type: 'feed', image_url: FOTO('r1'), geolocalitzacio: GPS(38.5919, -0.4184), dataCaptura: '2026-10-12T10:00:00+02:00',
      fotos_geo: [{ src: FOTO('r2'), lat: 38.5919, lng: -0.4184, dataCaptura: '2026-10-13T10:00:00+02:00' }]
    }]);
    expect(dosDies.parades).toHaveLength(2);
  });

  test('cap estimació travessa publicacions: sense GPS germà, el poble o pendent', () => {
    const veina = { id: 'v', type: 'feed', image_url: FOTO('v1'), dataCaptura: '2026-10-12T10:41:00+02:00', poble_id: 'xixona' };
    const orfe = { id: 'o', type: 'feed', image_url: FOTO('o1'), dataCaptura: '2026-10-12T10:41:00+02:00' };
    const resultat = puntsDelMapa([A, veina, orfe]);
    expect(resultat.fotos.find((f) => f.src === FOTO('v1'))).toMatchObject({ estat: 'poble', lat: 38.5398, lng: -0.5085 });
    expect(resultat.pendents.map((f) => [f.src, f.estat, f.publicacio])).toEqual([[FOTO('o1'), 'pendent', 'feed:o']]);
    expect(resultat.fotos.some((f) => f.publicacio === 'feed:o')).toBe(false);
  });

  test('el poble: de les fitxes de /pobles i, si no hi és, de la llavor', () => {
    expect(coordenadesDelPoble('penaguila')).toEqual({ lat: 38.6315, lng: -0.3892, title: 'Penàguila', comarca: "L'Alcoià" });
    expect(coordenadesDelPoble('poble-nou', [{ id: 'poble-nou', title: 'Poble Nou', lat: '38.7', lng: -0.5 }])).toMatchObject({ lat: 38.7, lng: -0.5, title: 'Poble Nou' });
    expect(coordenadesDelPoble('xixona', [{ id: 'xixona', title: 'Xixona', lat: null, lng: null }])).toMatchObject({ lat: 38.5398 });
    expect(coordenadesDelPoble('no-existix')).toBeNull();
    expect(coordenadesDelPoble('<script>')).toBeNull();
    expect(coordenadesDelPoble(null)).toBeNull();
  });
});

describe('seguretat del nucli', () => {
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
  /* El codi sense comentaris: els comentaris nomenen el que no s'hi fa. */
  const codiDe = (ruta) => llig(ruta).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

  test('ni adreces, ni crides a la xarxa, ni cap geocodificador', () => {
    for (const ruta of ['src/sections/mur/mapaFotografic.js', 'src/sections/mur/puntsDelMapa.js']) {
      const codi = codiDe(ruta);
      for (const vetat of [/https?:/i, /\bfetch\s*\(/, /XMLHttpRequest|sendBeacon|WebSocket/, /nominatim|geocod|reverse/i, /\bimport\s*\(/]) {
        expect([ruta, vetat.test(codi)]).toEqual([ruta, false]);
      }
    }
  });

  test('el renderitzador tampoc no geocodifica ni crida la xarxa; les tessel·les, només l’adreça canònica de l’OSMF', () => {
    const codi = codiDe('src/sections/mur/MapaFotografic.jsx');
    for (const vetat of [/https?:/i, /\bfetch\s*\(/, /XMLHttpRequest|sendBeacon|WebSocket/, /nominatim|geocod|reverse/i, /innerHTML|dangerouslySetInnerHTML/]) {
      expect(vetat.test(codi)).toBe(false);
    }
    // L'únic import() del renderitzador és Leaflet, dins d'un efecte.
    expect([...codi.matchAll(/\bimport\s*\(\s*'([^']+)'/g)].map((m) => m[1])).toEqual(['leaflet']);
    expect(TESSELES.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(TESSELES.atribucio).toContain('OpenStreetMap');
  });
});
