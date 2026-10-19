import { describe, expect, test } from 'vitest';
import { formataPoble, llistaDePobles, nomDeLaGent, nomDeLaGentDelPoble, poblePrincipal, slugDelPoble } from './nomsDelPoble.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { rutaDeSubjecte } from '../../data/contracte.js';

describe('nomDeLaGent · l’article es contrau i s’apostrofa com mana l’IEC', () => {
  test.each([
    ['El Campello', 'Gent del Campello'],
    ['Els Poblets', 'Gent dels Poblets'],
    ['La Torre de les Maçanes', 'Gent de la Torre de les Maçanes'],
    ['la Torre de les Maçanes', 'Gent de la Torre de les Maçanes'],
    ['Les Coves de Vinromà', 'Gent de les Coves de Vinromà'],
    ["L'Alfàs del Pi", "Gent de l'Alfàs del Pi"],
    ['L’Alfàs del Pi', "Gent de l'Alfàs del Pi"],
    ['Orxeta', "Gent d'Orxeta"],
    ['Alcoleja', "Gent d'Alcoleja"],
    ['Ibi', "Gent d'Ibi"],
    ['Hondón de las Nieves', "Gent d'Hondón de las Nieves"],
    ['Uixó', "Gent d'Uixó"],
    ['Iecla', 'Gent de Iecla'],
    ['Huelva', 'Gent de Huelva'],
    ['Yátova', 'Gent de Yátova'],
    ['Elx', "Gent d'Elx"],
    ['Xixona', 'Gent de Xixona'],
    ['  Sella  ', 'Gent de Sella']
  ])('%s → %s', (nom, gent) => {
    expect(nomDeLaGent(nom)).toBe(gent);
  });

  test('sense nom no hi ha gent', () => {
    expect(nomDeLaGent('')).toBe('');
    expect(nomDeLaGent('   ')).toBe('');
    expect(nomDeLaGent(null)).toBe('');
  });

  test('l’apòstrof és el recte (U+0027), com el de la llavor', () => {
    expect(nomDeLaGent('Orxeta')).not.toContain('’');
    expect(MOCK_TOWNS.find((town) => town.id === 'orxeta').author).toBe(nomDeLaGent('Orxeta'));
  });
});

describe('paritat amb la llavor de /pobles', () => {
  test('town.author || nomDeLaGent(town.title) dona l’autor que ja pinta cada targeta', () => {
    for (const town of MOCK_TOWNS) {
      expect(town.author || nomDeLaGent(town.title)).toBe(town.author);
    }
  });

  test('la regla reproduïx l’autor de tots els pobles de la llavor menys el nom curt de la Torre', () => {
    const ambNomPropi = MOCK_TOWNS.filter((town) => town.author !== nomDeLaGent(town.title)).map((town) => town.id);
    expect(ambNomPropi).toEqual(['la-torre-de-les-macanes']);
  });

  test('sense author, la fitxa rep el nom derivat', () => {
    const senseAutor = { ...MOCK_TOWNS.find((town) => town.id === 'penaguila'), author: undefined };
    expect(senseAutor.author || nomDeLaGent(senseAutor.title)).toBe('Gent de Penàguila');
  });

  /* Onada 6 (pla 261009_0245, ítem 4) · La mateixa regla, d'una fitxa. */
  test('nomDeLaGentDelPoble: l’author de la fitxa mana; sense, nomDeLaGent del seu nom; sense fitxa, buit', () => {
    for (const town of MOCK_TOWNS) expect(nomDeLaGentDelPoble(town)).toBe(town.author);
    expect(nomDeLaGentDelPoble({ id: 'el-campello', title: 'El Campello' })).toBe('Gent del Campello');
    expect(nomDeLaGentDelPoble({ id: 'i', name: 'Ibi', author: '   ' })).toBe("Gent d'Ibi");
    expect(nomDeLaGentDelPoble(null)).toBe('');
    expect(nomDeLaGentDelPoble({ id: 'x' })).toBe('');
  });
});

describe('slugDelPoble · l’id de la fitxa i la clau de /pobles/<id>', () => {
  test.each([
    ['La Torre de les Maçanes', 'la-torre-de-les-macanes'],
    ["Callosa d'en Sarrià", 'callosa-d-en-sarria'],
    ['Vila-real', 'vila-real'],
    /* El punt volat és un diacrític per a seleccioUrl: la l·l queda ll. */
    ['Bel·lús', 'bellus'],
    ['  El Campello ', 'el-campello']
  ])('%s → %s', (nom, slug) => {
    expect(slugDelPoble(nom)).toBe(slug);
    expect(rutaDeSubjecte('poble', slug)).toBe(`/pobles/${slug}`);
  });

  test('dona exactament l’id de cada poble de la llavor', () => {
    for (const town of MOCK_TOWNS) expect(slugDelPoble(town.title)).toBe(town.id);
  });

  test('un nom sense lletres ni xifres, o d’un alfabet que no cap en una ruta, no té slug', () => {
    expect(slugDelPoble('')).toBeNull();
    expect(slugDelPoble('—·—')).toBeNull();
    expect(slugDelPoble(null)).toBeNull();
    expect(slugDelPoble('Αθήνα')).toBeNull();
  });
});

/* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · Els pobles d'una
   persona ('A · B', el primer el principal). La ela geminada (l·l) porta el
   mateix punt volat que el separador i no ha de partir el nom; el separador
   amb un espai a un sol costat, o entre lletres que no són eles, sí. */
describe('llistaDePobles, formataPoble i poblePrincipal · els pobles d’una persona', () => {
  test('la ela geminada no parteix el nom del poble', () => {
    expect(llistaDePobles('Bel·lús')).toEqual(['Bel·lús']);
    expect(llistaDePobles('Vil·la Nova')).toEqual(['Vil·la Nova']);
    expect(llistaDePobles('COL·LEGI')).toEqual(['COL·LEGI']);
    expect(formataPoble('Bel·lús ·Xixona')).toBe('Bel·lús · Xixona');
    expect(formataPoble(['Bel·lús', 'Xixona'])).toBe('Bel·lús · Xixona');
    expect(llistaDePobles(formataPoble(['Bel·lús', 'Xixona']))).toEqual(['Bel·lús', 'Xixona']);
    expect(llistaDePobles('Xixona· Bel·lús')).toEqual(['Xixona', 'Bel·lús']);
    expect(poblePrincipal('Vil·la Nova · Sella')).toBe('Vil·la Nova');
    expect(poblePrincipal('Bel·lús')).toBe('Bel·lús');
  });

  test('el separador tolerant, els repetits i els buits, com sempre', () => {
    expect(llistaDePobles(' La Torre de les Maçanes ·Xixona · · La Torre de les Maçanes ')).toEqual(['La Torre de les Maçanes', 'Xixona']);
    expect(llistaDePobles('Sella·Relleu')).toEqual(['Sella', 'Relleu']);
    expect(formataPoble('Relleu · Sella')).toBe('Relleu · Sella');
    expect(llistaDePobles(null)).toEqual([]);
    expect(formataPoble('')).toBe('');
    expect(poblePrincipal('Xixona · La Torre de les Maçanes')).toBe('Xixona');
    expect(poblePrincipal(undefined)).toBe('');
  });

  test('el principal fet slug és un poble; la cadena sencera no', () => {
    expect(slugDelPoble(poblePrincipal('La Torre de les Maçanes · Xixona'))).toBe('la-torre-de-les-macanes');
    expect(slugDelPoble('La Torre de les Maçanes · Xixona')).toBe('la-torre-de-les-macanes-xixona');
  });
});
