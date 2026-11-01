// @vitest-environment node
/* D-5 (pla 261101_1246, assalt 10/10) · La font única dels àlies de poble:
   aliesDelPoble (la fitxa primer, la llavor després) i catalegDePobles (els
   pobles de l'aplicació i, darrere, els municipis de referència), i les
   invariants de la llavor (aliesDePoblesSeed.js). */
import { describe, expect, test } from 'vitest';
import { MAX_ALIES_DE_FITXA, MAX_FORMA_ALIES, aliesDelPoble, catalegDePobles } from './aliesDePobles.js';
import { ALIES_DE_POBLES_SEED, MUNICIPIS_DE_REFERENCIA } from './aliesDePoblesSeed.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { slugDelPoble } from './nomsDelPoble.js';

const formes = (llista) => llista.map((a) => a.forma);
/* La forma de comparació: sense accents, sense majúscules i amb espais simples. */
const clau = (text) => String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

describe('aliesDelPoble', () => {
  test('per l’id de la llavor, i pel nom quan l’id és de la base de dades', () => {
    expect(formes(aliesDelPoble({ id: 'xixona', title: 'Xixona' }))).toEqual(['Jijona']);
    expect(formes(aliesDelPoble({ id: '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', title: 'La Torre de les Maçanes' }))).toEqual(['Torremanzanas', 'la Torre']);
    expect(aliesDelPoble({ id: 'la-torre-de-les-macanes' })[1]).toEqual({ forma: 'la Torre', ambMajuscula: true, majusculaEn: 1 });
    expect(aliesDelPoble({ id: 'tibi', title: 'Tibi' })).toEqual([]);
    for (const res of [null, undefined, 'xixona', 42]) expect(aliesDelPoble(res)).toEqual([]);
    // Una clau del prototip no és cap poble.
    expect(aliesDelPoble({ id: 'constructor', title: 'toString' })).toEqual([]);
  });

  test('els de la fitxa primer (cadenes o objectes), sense repetits, i després els de la llavor', () => {
    const poble = { id: 'xixona', title: 'Xixona', alies: ['Xixona del Torró', { forma: 'JIJONA' }, { forma: 'el Barri', ambMajuscula: true, majusculaEn: 1 }] };
    const llista = aliesDelPoble(poble);
    expect(formes(llista)).toEqual(['Xixona del Torró', 'JIJONA', 'el Barri']);
    expect(llista[2]).toEqual({ forma: 'el Barri', ambMajuscula: true, majusculaEn: 1 });
    expect(Object.isFrozen(llista) && llista.every(Object.isFrozen)).toBe(true);
    // Un poble nou, sense codi: els àlies a la seua fitxa.
    expect(formes(aliesDelPoble({ id: 'benimantell', title: 'Benimantell', alies: ['Benimantel'] }))).toEqual(['Benimantel']);
  });

  test('els de la fitxa que no valen es boten, i se’n lligen com a molt MAX_ALIES_DE_FITXA', () => {
    const dolents = ['', '   ', '!!!', 'x'.repeat(MAX_FORMA_ALIES + 1), 42, null, { forma: 7 }, ['Jijona'], { forma: 'Bo', majusculaEn: -1 }, { forma: 'Bo2', majusculaEn: 1.5, ambMajuscula: 'sí' }];
    const llista = aliesDelPoble({ id: 'nou', title: 'Nou', alies: dolents });
    expect(llista).toEqual([{ forma: 'Bo', ambMajuscula: false, majusculaEn: 0 }, { forma: 'Bo2', ambMajuscula: false, majusculaEn: 0 }]);
    expect(formes(aliesDelPoble({ id: 'nou', title: 'Nou', alies: ['  Dos   espais  '] }))).toEqual(['Dos espais']);
    const molts = Array.from({ length: MAX_ALIES_DE_FITXA + 3 }, (_, n) => `Àlies ${n}`);
    expect(aliesDelPoble({ id: 'nou', title: 'Nou', alies: molts })).toHaveLength(MAX_ALIES_DE_FITXA);
    expect(formes(aliesDelPoble({ id: 'nou', alies: [`a${'x'.repeat(MAX_FORMA_ALIES - 1)}`] }))[0]).toHaveLength(MAX_FORMA_ALIES);
  });
});

describe('la llavor dels àlies', () => {
  const pobles = [...MOCK_TOWNS, ...MUNICIPIS_DE_REFERENCIA];
  const oficials = new Map(pobles.map((p) => [p.id, clau(p.title)]));

  test('cada clau és un poble de la llavor o un municipi de referència', () => {
    expect(Object.keys(ALIES_DE_POBLES_SEED).filter((id) => !oficials.has(id))).toEqual([]);
    expect(Object.isFrozen(ALIES_DE_POBLES_SEED)).toBe(true);
    for (const llista of Object.values(ALIES_DE_POBLES_SEED)) expect(Object.isFrozen(llista) && llista.every(Object.isFrozen)).toBe(true);
  });

  test('cap àlies no és el nom oficial d’un poble (el seu o un altre), ni l’àlies de dos pobles', () => {
    const vistos = new Map();
    const senseArticle = (nom) => nom.replace(/^(?:el|els|la|les) |^l'/, '');
    const noms = new Set([...oficials.values()].flatMap((nom) => [nom, senseArticle(nom)]));
    for (const [id, llista] of Object.entries(ALIES_DE_POBLES_SEED)) {
      for (const { forma } of llista) {
        expect(noms.has(clau(forma)), `${id}: ${forma}`).toBe(false);
        expect(vistos.get(clau(forma)) ?? id, forma).toBe(id);
        vistos.set(clau(forma), id);
      }
    }
  });

  test('els municipis de referència: id, nom, comarca i província; l’id és el del nom; cap no és de la llavor', () => {
    expect(MUNICIPIS_DE_REFERENCIA.map((m) => m.title)).toEqual(['Ibi', 'Castalla', 'Onil', 'Biar', 'Alcoi', 'Alacant', 'València']);
    for (const m of MUNICIPIS_DE_REFERENCIA) {
      expect(Object.isFrozen(m)).toBe(true);
      expect([typeof m.title, typeof m.comarca, typeof m.provincia].every((t) => t === 'string'), m.id).toBe(true);
      expect(m.comarca && m.provincia, m.id).toBeTruthy();
      expect(m.id).toBe(slugDelPoble(m.title));
      expect(MOCK_TOWNS.some((t) => t.id === m.id || clau(t.title) === clau(m.title)), m.id).toBe(false);
    }
  });
});

describe('catalegDePobles', () => {
  test('sense llista (o buida): la llavor i, darrere, els municipis de referència; congelat i memoritzat', () => {
    const cataleg = catalegDePobles();
    expect(cataleg.map((p) => p.id)).toEqual([...MOCK_TOWNS.map((t) => t.id), ...MUNICIPIS_DE_REFERENCIA.map((m) => m.id)]);
    expect(Object.isFrozen(cataleg)).toBe(true);
    expect(catalegDePobles()).toBe(cataleg);
    expect(catalegDePobles([])).toBe(cataleg);
    expect(catalegDePobles('xixona')).toBe(cataleg);
  });

  test('amb els pobles de l’aplicació: primer els seus, sense repetir cap referència (per id o pel nom, també amb un id UUID)', () => {
    const pobles = [
      { id: 'alcoi', title: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant' },
      { id: '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', title: 'València' },
      null,
      { id: 'benimantell', title: 'Benimantell' }
    ];
    const cataleg = catalegDePobles(pobles);
    expect(cataleg.map((p) => p.id)).toEqual(['alcoi', '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', 'benimantell', 'ibi', 'castalla', 'onil', 'biar', 'alacant']);
    expect(cataleg[0]).toBe(pobles[0]);
    expect(catalegDePobles(pobles)).toBe(cataleg);
    // Una llista nova es torna a construir.
    expect(catalegDePobles([...pobles])).not.toBe(cataleg);
  });
});
