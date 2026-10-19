/**
 * Onada 6 (pla 261009_0245, ítems 2, 5 i 11; prompt 261009_0230, punt 6) ·
 * Les publicacions d'un poble i el seu naixement, casats per DADES: el
 * poble_id de la publicació o el seu lloc fet slug, contra l'id, el slug i el
 * nom de la fitxa. Cap nom de poble escrit al codi: les proves recorren les
 * fitxes de la llavor i un poble inventat.
 */
import { describe, expect, test } from 'vitest';
import {
  clausDelPoble, esDelPoble, itemsDelPoble, pobleDeLaPublicacio, poblesAmbNaixement, publicacionsDelPoble
} from './publicacionsDelPoble.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { CALENDAR_EVENTS } from '../mur/eventsSeed.js';

/* Un poble que no és a la llavor ni enlloc del codi. */
const INVENTAT = Object.freeze({ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP' });

describe('pobleDeLaPublicacio · la clau del poble d’una publicació', () => {
  test('poble_id mana sobre el text del lloc', () => {
    expect(pobleDeLaPublicacio({ poble_id: 'sella', author_location: 'Relleu' })).toBe('sella');
  });

  test('sense poble_id, el primer lloc que porta, fet slug', () => {
    expect(pobleDeLaPublicacio({ author_location: 'La Torre de les Maçanes', town_name: 'Sella' })).toBe('la-torre-de-les-macanes');
    expect(pobleDeLaPublicacio({ town_name: 'Penàguila' })).toBe('penaguila');
    expect(pobleDeLaPublicacio({ population: 'Orxeta' })).toBe('orxeta');
    expect(pobleDeLaPublicacio({ location: 'El Campello' })).toBe('el-campello');
  });

  test('un poble_id que no és un poble cau al lloc; res, null', () => {
    expect(pobleDeLaPublicacio({ poble_id: '   ', author_location: 'Tibi' })).toBe('tibi');
    expect(pobleDeLaPublicacio({ poble_id: { id: 'x' }, town_name: 'Xixona' })).toBe('xixona');
    expect(pobleDeLaPublicacio({})).toBeNull();
    expect(pobleDeLaPublicacio(null)).toBeNull();
    expect(pobleDeLaPublicacio({ author_location: '—' })).toBeNull();
  });
});

/* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · El lloc d'una
   persona amb diversos pobles ('A · B'): la publicació és del principal, a la
   seua pestanya «Gent de …» i a cap altra. */
describe('pobleDeLaPublicacio · una persona amb diversos pobles', () => {
  test('el lloc «A · B» és del poble principal; una ela geminada no parteix el nom', () => {
    expect(pobleDeLaPublicacio({ author_location: 'La Torre de les Maçanes · Xixona' })).toBe('la-torre-de-les-macanes');
    expect(pobleDeLaPublicacio({ town_name: 'Xixona · La Torre de les Maçanes' })).toBe('xixona');
    expect(pobleDeLaPublicacio({ author_location: 'Bel·lús · Xixona' })).toBe('bellus');
    const torre = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
    const xixona = MOCK_TOWNS.find((town) => town.id === 'xixona');
    expect(esDelPoble({ author_location: 'La Torre de les Maçanes · Xixona' }, torre)).toBe(true);
    expect(esDelPoble({ author_location: 'La Torre de les Maçanes · Xixona' }, xixona)).toBe(false);
    // Mana el poble_id, si en porta.
    expect(pobleDeLaPublicacio({ poble_id: 'xixona', author_location: 'La Torre de les Maçanes · Xixona' })).toBe('xixona');
  });
});

describe('esDelPoble · per a cada fitxa de la llavor, sense casos a mà', () => {
  test('una publicació amb el nom del poble hi cau, i en cap altre', () => {
    for (const town of MOCK_TOWNS) {
      const item = { id: `p-${town.id}`, author_location: town.title };
      expect(MOCK_TOWNS.filter((altre) => esDelPoble(item, altre)).map((altre) => altre.id), town.id).toEqual([town.id]);
    }
  });

  test('i també per poble_id (l’id de la fitxa)', () => {
    for (const town of MOCK_TOWNS) {
      expect(MOCK_TOWNS.filter((altre) => esDelPoble({ poble_id: town.id }, altre)).map((altre) => altre.id)).toEqual([town.id]);
    }
  });

  test('un poble inventat funciona sense tocar codi', () => {
    expect(clausDelPoble(INVENTAT)).toEqual(['vilanova-de-prova-sdp']);
    expect(esDelPoble({ author_location: 'Vilanova de Prova SdP' }, INVENTAT)).toBe(true);
    expect(esDelPoble({ poble_id: 'vilanova-de-prova-sdp' }, INVENTAT)).toBe(true);
    expect(MOCK_TOWNS.some((town) => esDelPoble({ author_location: 'Vilanova de Prova SdP' }, town))).toBe(false);
  });

  test('una fitxa remota amb només `name` o amb slug propi també casa', () => {
    expect(esDelPoble({ author_location: 'Ibi' }, { id: '7f1c', name: 'Ibi' })).toBe(true);
    expect(esDelPoble({ poble_id: 'la-vila' }, { id: 'u-1', slug: 'la-vila', title: 'La Vila Joiosa' })).toBe(true);
  });

  /* Límit documentat: un lloc escrit d'una altra manera no casa. */
  test('límit: «La Torre» a seques no és «La Torre de les Maçanes»', () => {
    const torre = MOCK_TOWNS.find((town) => town.title === 'La Torre de les Maçanes');
    expect(esDelPoble({ author_location: 'La Torre' }, torre)).toBe(false);
  });
});

describe('publicacionsDelPoble · les targetes del poble en l’ordre del Mur', () => {
  const FONTS = {
    feedPosts: [
      { id: 'f1', type: 'feed', title: 'Vella', author_location: 'Vilanova de Prova SdP', created_at: '2026-09-01T10:00:00Z' },
      { id: 'f2', type: 'feed', title: 'D’un altre', author_location: 'Sella', created_at: '2026-09-05T10:00:00Z' },
      { id: 'f3', type: 'feed', title: 'Triada', poble_id: 'vilanova-de-prova-sdp', publish_date: '2026-09-10T10:00:00Z', created_at: '2026-09-02T10:00:00Z' },
      { id: 'sistema', type: 'sistema', isSystem: true, title: 'Pàgina', author_location: 'Vilanova de Prova SdP' },
      { title: 'Sense id', author_location: 'Vilanova de Prova SdP' }
    ],
    marketItems: [{ id: 'm1', type: 'product', title: 'Mel', population: 'Vilanova de Prova SdP', created_at: '2026-09-04T10:00:00Z' }],
    events: [{ id: 'e1', type: 'event', title: 'Ball', date: '2026-09-20', time: '22:00', author_location: 'Vilanova de Prova SdP' }]
  };

  test('Mur, Mercat i Agenda, de més nova a més vella pel moment de la targeta; sense sistema, sense id ni altres pobles', () => {
    const entrades = publicacionsDelPoble(FONTS, INVENTAT);
    expect(entrades.map(({ id }) => id)).toEqual(['events:e1', 'mur:f3', 'mercat:m1', 'mur:f1']);
    expect(entrades.map(({ seccio }) => seccio)).toEqual(['events', 'mur', 'mercat', 'mur']);
    // L'acte porta el seu model; la resta, cap.
    expect(entrades[0].esdeveniment).not.toBeNull();
    expect(entrades.slice(1).every(({ esdeveniment }) => esdeveniment === null)).toBe(true);
    // L'element cru, el que pinta la targeta canònica.
    expect(entrades[2].item).toBe(FONTS.marketItems[0]);
  });

  test('sense cap, la mateixa constant buida; sense fitxa o sense fonts, també', () => {
    const buida = publicacionsDelPoble(FONTS, { id: 'cap-ni-un', title: 'Cap ni un' });
    expect(buida).toEqual([]);
    expect(Object.isFrozen(buida)).toBe(true);
    expect(publicacionsDelPoble(FONTS, null)).toBe(buida);
    expect(publicacionsDelPoble(null, INVENTAT)).toBe(buida);
  });

  test('sense repetits: un mateix element dues vegades a la mateixa llista', () => {
    const repetit = { id: 'r1', author_location: 'Vilanova de Prova SdP', created_at: '2026-09-01T10:00:00Z' };
    expect(itemsDelPoble({ feedPosts: [repetit, repetit] }, INVENTAT)).toHaveLength(1);
  });

  test('la llavor: la Torre té l’Aplec, la samarreta i el Mac Mini; la resta de pobles, res', () => {
    const fonts = { feedPosts: [], marketItems: MOCK_MARKET_ITEMS, events: CALENDAR_EVENTS };
    const perPoble = Object.fromEntries(MOCK_TOWNS.map((town) => [town.id, publicacionsDelPoble(fonts, town).map(({ id }) => id).sort()]));
    expect(perPoble['la-torre-de-les-macanes']).toEqual(['events:aplec-2023', 'mercat:mac-mini-m4', 'mercat:samarreta-socdepoble']);
    expect(MOCK_TOWNS.filter((town) => town.id !== 'la-torre-de-les-macanes').every((town) => perPoble[town.id].length === 0)).toBe(true);
  });
});

describe('naixement del poble (requisit 15 de l’Onada 5)', () => {
  const POBLE = Object.freeze({ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP', created_at: '2026-08-20T08:00:00.000Z' });
  const ALTRE = Object.freeze({ id: 'altre', title: 'Altre', created_at: '2026-08-01T08:00:00.000Z' });
  const TOWNS = Object.freeze([POBLE, ALTRE]);
  const naixDe = (fonts, town = POBLE) => poblesAmbNaixement([town], fonts)[0].created_at;

  test('el més antic entre la fitxa i el created_at de les publicacions que DECLAREN el poble', () => {
    expect(naixDe({ feedPosts: [{ id: 'p', poble_id: POBLE.id, created_at: '2026-09-01T10:00:00Z' }] })).toBe(POBLE.created_at);
    expect(naixDe({
      feedPosts: [{ id: 'p', poble_id: POBLE.id, created_at: '2026-09-01T10:00:00Z' }],
      marketItems: [{ id: 'm', poble_id: POBLE.id, created_at: '2026-08-02T10:00:00Z' }]
    })).toBe('2026-08-02T10:00:00Z');
  });

  /* Revisió adversarial de l'Onada 6 · El text del lloc d'abans no data cap
     poble: casa la publicació a la pestanya, però no en mou el naixement. */
  test('una publicació casada només pel text del lloc no fa nàixer el poble, encara que siga més vella', () => {
    const fonts = { feedPosts: [{ id: 'p', author_location: 'Vilanova de Prova SdP', created_at: '2026-02-15T12:00:00Z' }] };
    expect(itemsDelPoble(fonts, POBLE)).toHaveLength(1);
    expect(poblesAmbNaixement(TOWNS, fonts)).toBe(TOWNS);
  });

  test('la creació real: ni la data triada al calendari ni el dia d’un acte', () => {
    expect(naixDe({ feedPosts: [{ id: 'p', poble_id: POBLE.id, publish_date: '1950-01-01T08:00:00Z', created_at: '2026-09-01T10:00:00Z' }] })).toBe(POBLE.created_at);
    expect(naixDe({ events: [{ id: 'e', type: 'event', poble_id: POBLE.id, date: '2023-01-29' }] })).toBe(POBLE.created_at);
  });

  test('sense data a la fitxa, la primera publicació declarada; sense res, la fitxa tal qual (cap data inventada)', () => {
    const senseData = { id: 'x', title: 'X' };
    expect(naixDe({ feedPosts: [{ id: 'p', poble_id: 'x', created_at: '2026-09-01T10:00:00Z' }] }, senseData)).toBe('2026-09-01T10:00:00Z');
    expect(poblesAmbNaixement([senseData], { feedPosts: [] })[0]).toBe(senseData);
    const brossa = { id: 'x', created_at: 'demà' };
    expect(poblesAmbNaixement([brossa], { feedPosts: [{ id: 'p', poble_id: 'x', created_at: 'brossa' }] })[0]).toBe(brossa);
  });

  test('casa per l’id, el slug o el nom de la fitxa, i torna la MATEIXA llista (i fitxa) si cap no canvia', () => {
    expect(poblesAmbNaixement(TOWNS, { feedPosts: [] })).toBe(TOWNS);
    expect(poblesAmbNaixement(TOWNS, { feedPosts: [{ id: 'p', poble_id: 'altre', created_at: '2026-09-01T00:00:00Z' }] })).toBe(TOWNS);
    const amb = poblesAmbNaixement(TOWNS, { marketItems: [{ id: 'm', poble_id: 'vilanova-de-prova-sdp', created_at: '2026-08-03T10:00:00Z' }] });
    expect(amb).not.toBe(TOWNS);
    expect(amb[0]).toEqual({ ...POBLE, created_at: '2026-08-03T10:00:00Z' });
    expect(amb[1]).toBe(ALTRE);
    // Una fitxa remota amb un id opac casa pel slug o pel nom.
    const remot = { id: '7f1c', slug: 'la-vila', title: 'La Vila Joiosa', created_at: '2026-08-20T08:00:00Z' };
    expect(poblesAmbNaixement([remot], { feedPosts: [{ id: 'p', poble_id: 'la-vila', created_at: '2026-08-01T08:00:00Z' }] })[0].created_at).toBe('2026-08-01T08:00:00Z');
    expect(poblesAmbNaixement([remot], { feedPosts: [{ id: 'p', poble_id: 'la-vila-joiosa', created_at: '2026-08-02T08:00:00Z' }] })[0].created_at).toBe('2026-08-02T08:00:00Z');
    // Una pàgina del sistema no fa nàixer cap poble.
    expect(poblesAmbNaixement(TOWNS, { feedPosts: [{ id: 's', isSystem: true, poble_id: 'altre', created_at: '2020-01-01T00:00:00Z' }] })).toBe(TOWNS);
  });

  /* La llavor (també la de supabase/seed.sql, amb les mateixes dates): el
     Mac Mini (15-02-2026) i la samarreta casen amb la Torre per `population`,
     però no la declaren. Cap fitxa canvia: /pobles es pinta com abans. */
  test('la llavor amb les seues dates crues no canvia cap fitxa', () => {
    const fonts = { feedPosts: [], marketItems: MOCK_MARKET_ITEMS, events: CALENDAR_EVENTS };
    expect(MOCK_MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4').created_at).toBe('2026-02-15T12:00:00.000Z');
    expect(publicacionsDelPoble(fonts, MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes'))).toHaveLength(3);
    expect(poblesAmbNaixement(MOCK_TOWNS, fonts)).toBe(MOCK_TOWNS);
  });

  test('sense fitxes, la constant buida', () => {
    expect(poblesAmbNaixement(null, { feedPosts: [] })).toEqual([]);
  });
});
