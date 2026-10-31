// @vitest-environment node
/**
 * suggerimentPobleLocal.test.js — La proposta de poble, categoria i origen
 * d'un arxiu local (IDEA-54/55 · Onada 261029_1605), contra la llavor real de
 * pobles (MOCK_TOWNS). Mai «és X» si la foto no és a tocar.
 */
import { describe, expect, test } from 'vitest';
import { AMBITS } from './censImatges.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import {
  AMBITS_CATALEG_LOCAL,
  AVISOS_SUGGERIMENT_POBLE,
  CONFIANCES_SUGGERIMENT_POBLE,
  MOTIUS_SUGGERIMENT_POBLE,
  NOMS_POBLE_AMBIGUS,
  RADI_COMARCA_KM,
  RADI_POBLE_ALTA_KM,
  RADI_POBLE_PROPER_KM,
  suggerixPobleLocal
} from './suggerimentPobleLocal.js';

const GPS_TORRE = Object.freeze({ lat: 38.592, lng: -0.418 });
const GPS_ALCOI = Object.freeze({ lat: 38.6985, lng: -0.4743 });
const GPS_FINESTRAT = Object.freeze({ lat: 38.5672, lng: -0.2125 });
const GPS_MADRID = Object.freeze({ lat: 40.4168, lng: -3.7038 });

describe('constants', () => {
  test('els radis i les llistes del contracte', () => {
    expect([RADI_POBLE_ALTA_KM, RADI_POBLE_PROPER_KM, RADI_COMARCA_KM]).toEqual([2.5, 6, 15]);
    expect(NOMS_POBLE_AMBIGUS).toEqual(['relleu', 'sella']);
    expect(CONFIANCES_SUGGERIMENT_POBLE).toEqual(['alta', 'mitjana', 'baixa']);
    expect(MOTIUS_SUGGERIMENT_POBLE).toEqual(['cens', 'gps', 'gps-proximitat', 'gps-comarca', 'nom', 'nom-alies']);
    expect(AVISOS_SUGGERIMENT_POBLE).toEqual(['NOM_AMBIGU', 'GPS_I_NOM_DISCREPEN', 'CENS_I_GPS_DISCREPEN', 'GPS_LLUNY_DELS_POBLES']);
  });

  test('AMBITS_CATALEG_LOCAL és igual a AMBITS del cens (paritat)', () => {
    expect([...AMBITS_CATALEG_LOCAL]).toEqual([...AMBITS]);
  });
});

describe('pel nom de la ruta', () => {
  test.each([
    ['00_inbox/esbos_festa_tibi.png', 'tibi', 'mitjana', 'nom'],
    ['fotos/La Torre de les Maçanes/IMG_0001.jpg', 'la-torre-de-les-macanes', 'mitjana', 'nom'],
    ['gent_de_la_torre/foto.jpg', 'la-torre-de-les-macanes', 'baixa', 'nom-alies'],
    ['mapes/mapa_relleu.png', 'relleu', 'baixa', 'nom']
  ])('%s → %s (%s, %s)', (ruta, id, confianca, motiu) => {
    const s = suggerixPobleLocal({ ruta });
    expect(s.poble?.id).toBe(id);
    expect(s.confianca).toBe(confianca);
    expect(s.motiu).toBe(motiu);
    expect(s.km).toBeNull();
    expect(s.avisos).toEqual([]);
  });

  test('dos pobles empatats: cap poble i NOM_AMBIGU', () => {
    const s = suggerixPobleLocal({ ruta: 'xixona_i_tibi.jpg' });
    expect(s.poble).toBeNull();
    expect(s.confianca).toBeNull();
    expect(s.avisos).toEqual(['NOM_AMBIGU']);
  });

  test('la seqüència més llarga guanya i «la» sola no és cap poble', () => {
    expect(suggerixPobleLocal({ ruta: 'la_torre_de_les_macanes_i_tibi.jpg' }).poble?.id).toBe('la-torre-de-les-macanes');
    expect(suggerixPobleLocal({ ruta: 'la/foto.jpg' }).poble).toBeNull();
  });
});

describe('pel GPS', () => {
  test('a tocar de la Torre: alta, gps, menys de 0,1 km', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_TORRE } });
    expect(s.poble).toEqual({ id: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes', comarca: "L'Alacantí" });
    expect(s.confianca).toBe('alta');
    expect(s.motiu).toBe('gps');
    expect(s.km).toBeLessThan(0.1);
    expect(s.categoria).toBe('poble');
  });

  test('Alcoi (6,1 km de Benifallim): mai «és Benifallim», només la comarca', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_ALCOI } });
    expect(s.poble).toBeNull();
    expect(s.comarca).toBe("L'Alcoià");
    expect(s.motiu).toBe('gps-comarca');
    expect(s.confianca).toBe('baixa');
    expect(s.km).toBe(6.1);
    expect(s.categoria).toBeNull();
  });

  test('Finestrat (4,3 km d’Orxeta): «a prop de», confiança baixa', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_FINESTRAT } });
    expect(s.poble?.id).toBe('orxeta');
    expect(s.confianca).toBe('baixa');
    expect(s.motiu).toBe('gps-proximitat');
    expect(s.km).toBe(4.3);
    expect(s.categoria).toBeNull();
  });

  test('GPS de Madrid + madrid_tibi.jpg: Tibi pel nom, baixa, GPS_LLUNY_DELS_POBLES', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_MADRID }, ruta: 'madrid_tibi.jpg' });
    expect(s.poble?.id).toBe('tibi');
    expect(s.confianca).toBe('baixa');
    expect(s.avisos).toEqual(['GPS_LLUNY_DELS_POBLES']);
  });

  test('GPS de la Torre + tibi.jpg: guanya el GPS i GPS_I_NOM_DISCREPEN', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_TORRE }, ruta: 'tibi.jpg' });
    expect(s.poble?.id).toBe('la-torre-de-les-macanes');
    expect(s.avisos).toEqual(['GPS_I_NOM_DISCREPEN']);
  });

  test('GPS proper i nom que coincidixen: la confiança puja a mitjana', () => {
    const s = suggerixPobleLocal({ exif: { gps: GPS_FINESTRAT }, ruta: 'festa_orxeta.jpg' });
    expect(s.poble?.id).toBe('orxeta');
    expect(s.confianca).toBe('mitjana');
    expect(s.avisos).toEqual([]);
  });

  test('un GPS 0/0 (receptor sense senyal) s’ignora; molt lluny sense nom: GPS_LLUNY_DELS_POBLES', () => {
    expect(suggerixPobleLocal({ exif: { gps: { lat: 0, lng: 0 } } }).avisos).toEqual([]);
    const lluny = suggerixPobleLocal({ exif: { gps: GPS_MADRID } });
    expect(lluny.poble).toBeNull();
    expect(lluny.comarca).toBeNull();
    expect(lluny.avisos).toEqual(['GPS_LLUNY_DELS_POBLES']);
  });
});

describe('pel cens', () => {
  test('parellaWeb catalogada: Penàguila, cens, categoria entitat, origen foto', () => {
    const s = suggerixPobleLocal({ parellaWeb: { poble: 'penaguila', ambit: 'entitat', origen: 'foto' } });
    expect(s.poble).toEqual({ id: 'penaguila', nom: 'Penàguila', comarca: "L'Alcoià" });
    expect(s.confianca).toBe('alta');
    expect(s.motiu).toBe('cens');
    expect(s.categoria).toBe('entitat');
    expect(s.motiuCategoria).toBe('cens');
    expect(s.origen).toBe('foto');
    expect(s.motiuOrigen).toBe('cens');
  });

  test('el cens diu un poble i el GPS (fins a 6 km) un altre: CENS_I_GPS_DISCREPEN', () => {
    const s = suggerixPobleLocal({ parellaWeb: { poble: 'tibi' }, exif: { gps: GPS_TORRE } });
    expect(s.poble?.id).toBe('tibi');
    expect(s.avisos).toEqual(['CENS_I_GPS_DISCREPEN']);
  });
});

describe('origen', () => {
  test('exif.camera → foto; nano_ → ia; res → null', () => {
    expect(suggerixPobleLocal({ exif: { camera: { marca: 'Canon', model: null } }, ruta: 'x.jpg' })).toMatchObject({ origen: 'foto', motiuOrigen: 'exif-camera' });
    expect(suggerixPobleLocal({ ruta: '00_inbox/nano_vinyeta.png' })).toMatchObject({ origen: 'ia', motiuOrigen: 'nom-ia' });
    expect(suggerixPobleLocal({ ruta: 'x.jpg' })).toMatchObject({ origen: null, motiuOrigen: null });
    expect(suggerixPobleLocal({ exif: { camera: { marca: '  ', model: '' } }, ruta: 'x.jpg' }).origen).toBeNull();
  });
});

describe('robustesa', () => {
  test('sense entrada, pobles buits o estranys: no peta', () => {
    expect(suggerixPobleLocal()).toMatchObject({ poble: null, confianca: null, avisos: [] });
    expect(suggerixPobleLocal({ ruta: 'tibi.jpg', pobles: [] }).poble).toBeNull();
    expect(suggerixPobleLocal({ ruta: 'tibi.jpg', pobles: [null, 7, {}] }).poble).toBeNull();
    expect(suggerixPobleLocal({ ruta: 42, exif: 'no', parellaWeb: 9 }).poble).toBeNull();
  });

  test('el resultat és congelat i les entrades congelades no es muten', () => {
    const pobles = Object.freeze(MOCK_TOWNS.map((p) => Object.freeze({ ...p })));
    const exif = Object.freeze({ gps: GPS_TORRE, camera: Object.freeze({ marca: 'Nikon', model: 'D3' }) });
    const parellaWeb = Object.freeze({ poble: 'la-torre-de-les-macanes', ambit: 'poble', origen: 'foto' });
    const s = suggerixPobleLocal({ exif, ruta: 'a.jpg', parellaWeb, pobles });
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.avisos)).toBe(true);
    expect(Object.isFrozen(s.poble)).toBe(true);
    expect(s.km).toBe(0);
  });
});
