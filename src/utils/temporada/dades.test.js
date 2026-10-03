// @vitest-environment node
/* Temporada · la integritat de dades.js: el que algú pot trencar en editar-lo
   (una clau repetida, un mes fora de l'any, una plena fora de la temporada,
   un sinònim que no casa o que casa amb un altre producte). */
import { describe, expect, test } from 'vitest';
import { ALIENES, DAVANT_DEL_NOM, FRUITES, HORTALISSES, MARQUES_NO_FRESC, NO_SON_MARQUES } from './dades.js';
import { TEMPORADES, temporadaDe, tramsDeMesos } from './index.js';
import { arrel, paraules } from './paraules.js';

const ENTRADES = [...FRUITES, ...HORTALISSES];
const FORMAT_MESOS = /^(?:[1-9]|1[0-2])(?:-(?:[1-9]|1[0-2]))?(?:,(?:[1-9]|1[0-2])(?:-(?:[1-9]|1[0-2]))?)*$/;

describe('les entrades', () => {
  test('cap entrada es perd en compilar: 22 fruites i 34 hortalisses', () => {
    expect(FRUITES).toHaveLength(22);
    expect(HORTALISSES).toHaveLength(34);
    expect(TEMPORADES.map((t) => t.clau)).toEqual(ENTRADES.map((e) => e.clau));
    expect(TEMPORADES.filter((t) => t.tipus === 'fruita')).toHaveLength(22);
    expect(TEMPORADES.filter((t) => t.tipus === 'hortalissa')).toHaveLength(34);
  });

  test('claus úniques, curtes i en minúscules (poden anar a la URL)', () => {
    const claus = ENTRADES.map((e) => e.clau);
    expect(new Set(claus).size).toBe(claus.length);
    for (const clau of claus) expect(clau).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
  });

  test('les dotze claus que són ids de base de la Nevera hi són (COM S’EDITA, a la capçalera)', () => {
    const claus = new Set(ENTRADES.map((e) => e.clau));
    const compartides = ['alls', 'carabasso', 'cebes', 'creilles', 'encisam', 'llimes', 'maduixes', 'pebrots', 'pomes', 'safanories', 'taronges', 'tomaques'];
    expect(compartides.filter((clau) => !claus.has(clau))).toEqual([]);
  });

  test('ordre alfabètic de clau dins de cada llista', () => {
    for (const llista of [FRUITES, HORTALISSES]) {
      const claus = llista.map((e) => e.clau);
      expect(claus).toEqual([...claus].sort());
    }
  });

  test('noms únics i sense espais sobrers', () => {
    const noms = ENTRADES.map((e) => e.nom);
    expect(new Set(noms).size).toBe(noms.length);
    for (const nom of noms) expect(nom).toBe(nom.trim());
  });

  test('els mesos tenen el format de la capçalera', () => {
    for (const e of ENTRADES) {
      expect(e.mesos, e.clau).toMatch(FORMAT_MESOS);
      expect(e.plens, e.clau).toMatch(FORMAT_MESOS);
    }
  });

  test('cada tram de temporada té almenys un mes ple', () => {
    /* Els mesos d'un tram [inici, fi], amb la volta de l'any. */
    const mesosDelTram = (inici, fi) => (inici <= fi
      ? Array.from({ length: fi - inici + 1 }, (_, i) => inici + i)
      : [...mesosDelTram(inici, 12), ...mesosDelTram(1, fi)]);
    for (const t of TEMPORADES) {
      const trams = tramsDeMesos(t.mesos);
      expect(trams.length, t.clau).toBeGreaterThan(0);
      for (const [inici, fi] of trams) {
        expect(mesosDelTram(inici, fi).some((mes) => t.plens.includes(mes)), `${t.clau} ${inici}-${fi}`).toBe(true);
      }
    }
  });

  test('les dades estan congelades', () => {
    expect(Object.isFrozen(FRUITES)).toBe(true);
    expect(Object.isFrozen(HORTALISSES)).toBe(true);
    for (const e of ENTRADES) {
      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.sinonims)).toBe(true);
    }
    for (const llista of [DAVANT_DEL_NOM, MARQUES_NO_FRESC, ALIENES, NO_SON_MARQUES]) expect(Object.isFrozen(llista)).toBe(true);
  });
});

describe('les marques', () => {
  /* Les arrels de les marques i els femenins que en deriva index.js (-at, -it, -ut → -ad, -id, -ud). */
  const ARRELS = MARQUES_NO_FRESC.flatMap(paraules).map(arrel);
  const DERIVADES = ARRELS.filter((a) => /[aiu]t$/.test(a)).map((a) => `${a.slice(0, -1)}d`);

  test('cada nom de NO_SON_MARQUES fa l’arrel d’un femení derivat (si no, sobraria)', () => {
    for (const nom of NO_SON_MARQUES) {
      const [unica, ...resta] = paraules(nom);
      expect(resta, nom).toEqual([]);
      expect(DERIVADES, nom).toContain(arrel(unica));
      expect(ARRELS, nom).not.toContain(arrel(unica));
    }
  });
});

describe('els sinònims', () => {
  test('cada nom i cada sinònim casen amb la seua entrada', () => {
    for (const e of ENTRADES) {
      for (const text of [e.nom, ...e.sinonims]) expect(temporadaDe(text)?.clau, `${e.clau}: ${text}`).toBe(e.clau);
    }
  });

  test('cap frase (en arrels) és de dues entrades', () => {
    const duenyes = new Map();
    const repetides = [];
    for (const e of ENTRADES) {
      for (const frase of new Set([e.nom, ...e.sinonims].map((text) => paraules(text).map(arrel).join(' ')))) {
        if (duenyes.has(frase)) repetides.push(`${frase}: ${duenyes.get(frase)} i ${e.clau}`);
        else duenyes.set(frase, e.clau);
      }
    }
    expect(repetides).toEqual([]);
  });

  test('cap sinònim comença per una paraula que se salta, una aliena o una xifra', () => {
    const davant = new Set(DAVANT_DEL_NOM.flatMap(paraules));
    const alienes = new Set(ALIENES.flatMap(paraules));
    for (const e of ENTRADES) {
      for (const text of [e.nom, ...e.sinonims]) {
        const [primera] = paraules(text);
        expect(davant.has(primera) || alienes.has(primera) || /^\d+$/.test(primera), `${e.clau}: ${text}`).toBe(false);
      }
    }
  });

  test('cap sinònim porta una marca de producte no fresc', () => {
    const marques = new Set(MARQUES_NO_FRESC.flatMap(paraules).map(arrel));
    for (const e of ENTRADES) {
      for (const text of e.sinonims) {
        expect(paraules(text).map(arrel).filter((a) => marques.has(a)), `${e.clau}: ${text}`).toEqual([]);
      }
    }
  });

  test('les paraules alienes no casen amb res', () => {
    for (const paraula of ALIENES) expect(temporadaDe(paraula), paraula).toBeNull();
  });
});
