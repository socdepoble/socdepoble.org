/**
 * Onada 6 (pla 261009_0245, ítem 4: «El fil de xat específic també es dirà
 * 'Gent de la Torre'») · Un sol constructor per al xat d'un poble i una funció
 * de presentació per als fils ja creats. Cap nom de poble escrit al codi.
 */
import { describe, expect, test } from 'vitest';
import { filsAmbLaGentDelPoble, nomDeLaGentDelPoble, objecteDelPobleXat, titolDelFilDelPoble } from './xatDelPoble.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { objecteDe, rutaXatDePagina } from '../../config/navigation.js';
import { mapejaFil } from '../xat/missatges.js';

describe('objecteDelPobleXat · el xat d’un poble es diu com la seua gent', () => {
  test('per a cada fitxa de la llavor: el subjecte de sempre i el títol de la gent', () => {
    for (const town of MOCK_TOWNS) {
      const objecte = objecteDelPobleXat(town);
      expect(objecte).toMatchObject({ tipus: 'poble', id: town.id, titol: town.author, ruta: `/pobles/${town.id}` });
      // El mateix fil que abans (el subjecte no canvia), amb un altre títol.
      const abans = new URL(rutaXatDePagina(objecteDe(town, 'pobles')), 'http://localhost').searchParams;
      const ara = new URL(rutaXatDePagina(objecte), 'http://localhost').searchParams;
      expect(ara.get('sobre')).toBe(abans.get('sobre'));
      expect(ara.get('ruta')).toBe(abans.get('ruta'));
      expect(ara.get('titol')).toBe(town.author);
    }
  });

  test('un poble inventat sense author rep el nom derivat', () => {
    expect(objecteDelPobleXat({ id: 'el-campello', title: 'El Campello' }).titol).toBe('Gent del Campello');
    expect(nomDeLaGentDelPoble({ id: 'i', name: 'Ibi' })).toBe("Gent d'Ibi");
  });

  test('sense nom de gent, el títol de sempre; sense fitxa, null', () => {
    expect(objecteDelPobleXat({ id: 'x' })).toMatchObject({ tipus: 'poble', id: 'x', titol: '' });
    expect(objecteDelPobleXat(null)).toBeNull();
  });
});

describe('titolDelFilDelPoble · presentació dels fils ja creats', () => {
  const TORRE = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
  const comunitat = (subjecte, titol = 'La Torre de les Maçanes') => ({ tipus: 'comunitat', titol, subjecte });

  test('la comunitat d’un poble, pel seu id o per la seua ruta: el nom de la gent', () => {
    expect(titolDelFilDelPoble(comunitat({ tipus: 'poble', id: TORRE.id, ruta: `/pobles/${TORRE.id}` }), MOCK_TOWNS)).toBe('Gent de la Torre');
    // En remot el servidor pot guardar un altre id: la ruta canònica el troba.
    expect(titolDelFilDelPoble(comunitat({ tipus: 'poble', id: 'uuid-del-node', ruta: `/pobles/${TORRE.id}` }), MOCK_TOWNS)).toBe('Gent de la Torre');
    // Una fila de la llista (esComunitat, title).
    expect(titolDelFilDelPoble({ esComunitat: true, title: 'Sella', subjecte: { tipus: 'poble', id: 'sella' } }, MOCK_TOWNS)).toBe('Gent de Sella');
  });

  test('el General, els Avisos, un xat que no és d’un poble o un poble que no és a les fitxes: el títol que porta', () => {
    const subjecte = { tipus: 'poble', id: TORRE.id, ruta: `/pobles/${TORRE.id}` };
    expect(titolDelFilDelPoble({ tipus: 'grup', titol: 'General', subjecte }, MOCK_TOWNS)).toBe('General');
    expect(titolDelFilDelPoble({ tipus: 'canal', titol: 'Avisos', subjecte }, MOCK_TOWNS)).toBe('Avisos');
    expect(titolDelFilDelPoble(comunitat({ tipus: 'entitat', id: 'socdepoble' }, 'Sóc de Poble'), MOCK_TOWNS)).toBe('Sóc de Poble');
    expect(titolDelFilDelPoble(comunitat({ tipus: 'poble', id: 'enlloc', ruta: '/pobles/enlloc' }, 'Enlloc'), MOCK_TOWNS)).toBe('Enlloc');
    expect(titolDelFilDelPoble(comunitat({ tipus: 'poble', id: TORRE.id }), null)).toBe('La Torre de les Maçanes');
    expect(titolDelFilDelPoble(null, MOCK_TOWNS)).toBe('');
  });
});

/* Integració Xat i Pobles (Onada 6) · La llista sencera del xat, amb la forma
   de veres (mapejaFil de la Conversa del port), tal com la vestix el
   proveïdor (XatContext, filsVisibles). */
describe('filsAmbLaGentDelPoble · els fils del xat amb el nom de la gent', () => {
  const TORRE = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
  /* Un poble inventat: cap fitxa de la llavor, cap author; l'article es contrau. */
  const INVENTAT = { id: 'olivera-inventada', title: "L'Olivera Inventada" };
  const subjecteDe = (id, ruta, titol) => ({ tipus: 'poble', id, ruta, titol });
  /* La comunitat d'un poble amb els seus Avisos i el seu General, com els crea
     el servidor: tots tres amb el subjecte, el títol congelat amb el nom del poble. */
  const filsDelPoble = (prefix, subjecte) => [
    { id: `${prefix}-c`, tipus: 'comunitat', titol: subjecte.titol, subjecte, ultimText: 'Bon dia' },
    { id: `${prefix}-a`, tipus: 'canal', titol: 'Avisos', comunitatId: `${prefix}-c`, subjecte },
    { id: `${prefix}-g`, tipus: 'grup', titol: 'General', comunitatId: `${prefix}-c`, subjecte }
  ].map((conversa) => mapejaFil(conversa));
  const IAIA = mapejaFil({ id: 'p-iaia', tipus: 'grup', titol: 'IAIA MarIA', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" } });
  const DIRECTE = mapejaFil({ id: 'd-pepa', tipus: 'directe', titol: 'Pepa' });

  test('la comunitat es diu com la gent; els Avisos i el General conserven el nom i el seu subjecte porta la gent', () => {
    const fils = [...filsDelPoble('t', subjecteDe(TORRE.id, `/pobles/${TORRE.id}`, TORRE.title)), IAIA, DIRECTE];
    const vestits = filsAmbLaGentDelPoble(fils, MOCK_TOWNS);
    const [comunitatT, avisos, general] = vestits;
    expect([comunitatT.name, comunitatT.title]).toEqual([TORRE.author, TORRE.author]);
    expect(comunitatT.avatar_url).toBe(TORRE.avatar_url);
    expect([avisos.avatar_url, general.avatar_url]).toEqual([null, null]);
    expect(comunitatT.searchText).toBe(`${TORRE.author} bon dia`.toLowerCase());
    expect([avisos.name, general.name]).toEqual(['Avisos', 'General']);
    expect(vestits.slice(0, 3).map((fil) => fil.subjecte.titol)).toEqual([TORRE.author, TORRE.author, TORRE.author]);
    // El que va al servidor no canvia: tipus, id i ruta del subjecte.
    expect(general.subjecte).toEqual({ ...fils[2].subjecte, titol: TORRE.author });
    // La IAIA i un directe, la mateixa referència.
    expect(vestits[3]).toBe(IAIA);
    expect(vestits[3].name).toBe('IAIA MarIA');
    expect(vestits[4]).toBe(DIRECTE);
    // No muta l'entrada.
    expect(fils[0].name).toBe(TORRE.title);
  });

  test('un poble inventat també: pel seu id o, en remot, per la ruta canònica', () => {
    const towns = [...MOCK_TOWNS, INVENTAT];
    const perId = filsAmbLaGentDelPoble(filsDelPoble('i', subjecteDe(INVENTAT.id, `/pobles/${INVENTAT.id}`, INVENTAT.title)), towns);
    expect(perId[0].name).toBe("Gent de l'Olivera Inventada");
    expect(perId[2].subjecte.titol).toBe("Gent de l'Olivera Inventada");
    const perRuta = filsAmbLaGentDelPoble(filsDelPoble('r', subjecteDe('44444444-4444-4444-8444-444444444444', `/pobles/${INVENTAT.id}`, INVENTAT.title)), towns);
    expect(perRuta[0].name).toBe("Gent de l'Olivera Inventada");
    expect(perRuta[0].subjecte.id).toBe('44444444-4444-4444-8444-444444444444');
  });

  test('sense fitxes, amb un poble que no hi és o ja vestida: la MATEIXA llista', () => {
    const fils = [...filsDelPoble('t', subjecteDe(TORRE.id, `/pobles/${TORRE.id}`, TORRE.title)), IAIA];
    expect(filsAmbLaGentDelPoble(fils, [])).toBe(fils);
    expect(filsAmbLaGentDelPoble(fils, undefined)).toBe(fils);
    expect(filsAmbLaGentDelPoble(fils, [INVENTAT])).toBe(fils);
    const vestits = filsAmbLaGentDelPoble(fils, MOCK_TOWNS);
    expect(filsAmbLaGentDelPoble(vestits, MOCK_TOWNS)).toBe(vestits);
    expect(filsAmbLaGentDelPoble(null, MOCK_TOWNS)).toBeNull();
  });
});
