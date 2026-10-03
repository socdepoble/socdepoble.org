// @vitest-environment node
/* Lector de notícies · l'estat de la persona (estat.js) i les carpetes
   (noticies.js): purs, amb «ara» fix. */
import { describe, expect, test } from 'vitest';
import { msDeData } from './dates.js';
import {
  LIMITS_ESTAT, commutaDespres, commutaSeguiment, esDesat, esLlegit, estatInicial, marcaLlegit, marcaLlegits, marcaNoLlegit,
  normalitzaEstat, seguix
} from './estat.js';
import {
  DESPRES, HUI, articlesDeCarpeta, comptadorsCarpetes, comptadorsFonts, esDeHui, fontsDeCarpeta, ordenaPerData
} from './noticies.js';

const resum = (id, fontId = 'veu', data = '2026-10-03T08:00:00.000Z') => ({
  id, fontId, titol: `Títol ${id}`, enllac: `https://example.org/${id}`, data, autor: null, resum: 'r', imatge: null
});

describe('estat', () => {
  test('marcar llegit, no llegit i llegits en bloc; res canvia → el mateix objecte', () => {
    const inicial = estatInicial();
    const llegit = marcaLlegit(inicial, 'a');
    expect(llegit.llegits).toEqual(['a']);
    expect(marcaLlegit(llegit, 'a')).toBe(llegit);
    expect(marcaLlegit(inicial, 'NO VÀLID')).toBe(inicial);
    expect(marcaLlegits(llegit, ['a', 'b', 'c', 'b']).llegits).toEqual(['a', 'b', 'c']);
    expect(esLlegit(llegit, 'a')).toBe(true);
    expect(marcaNoLlegit(llegit, 'a').llegits).toEqual([]);
    expect(marcaNoLlegit(inicial, 'a')).toBe(inicial);
  });

  test('els llegits tenen límit: els més vells cauen', () => {
    const ids = Array.from({ length: LIMITS_ESTAT.llegits + 3 }, (_, i) => `n${i}`);
    const estat = marcaLlegits(estatInicial(), ids);
    expect(estat.llegits).toHaveLength(LIMITS_ESTAT.llegits);
    expect(estat.llegits[0]).toBe('n3');
  });

  test('per a després guarda el resum (normalitzat), el més nou davant; tornar-lo a tocar el lleva', () => {
    const primer = commutaDespres(estatInicial(), { ...resum('a'), secret: 'fora', titol: '  Títol  a ' });
    expect(primer.despres).toEqual([{ ...resum('a'), titol: 'Títol a' }]);
    const segon = commutaDespres(primer, resum('b'));
    expect(segon.despres.map((d) => d.id)).toEqual(['b', 'a']);
    expect(esDesat(segon, 'a')).toBe(true);
    expect(commutaDespres(segon, resum('a')).despres.map((d) => d.id)).toEqual(['b']);
    expect(commutaDespres(segon, { id: 'x' })).toBe(segon);
  });

  test('seguir i deixar de seguir: es guarden les que NO se seguixen', () => {
    const deixada = commutaSeguiment(estatInicial(), 'veu');
    expect(deixada.noSeguides).toEqual(['veu']);
    expect(seguix(deixada, 'veu')).toBe(false);
    expect(seguix(deixada, 'radio')).toBe(true);
    expect(commutaSeguiment(deixada, 'veu').noSeguides).toEqual([]);
    expect(commutaSeguiment(deixada, 'hui')).toBe(deixada);
  });

  test('normalitzaEstat és la llista blanca: un registre corrupte o amb camps de més es llig net', () => {
    expect(normalitzaEstat(null)).toEqual(estatInicial());
    expect(normalitzaEstat({ llegits: 'trencat', despres: [{ id: 'a' }, resum('b'), resum('b')], noSeguides: ['veu', 'totes', 7], foto: 'x' }))
      .toEqual({ esquema: 1, llegits: [], despres: [resum('b')], noSeguides: ['veu'] });
  });
});

describe('carpetes i comptadors', () => {
  const ara = msDeData('2026-10-03T10:00:00Z');
  const categories = [{ id: 'festes', nom: 'Festes', ordre: 0, icona: null }, { id: 'camp', nom: 'Camp', ordre: 1, icona: null }];
  const fonts = [
    { id: 'veu', nom: 'Veu', categoriaId: 'festes' }, { id: 'radio', nom: 'Ràdio', categoriaId: 'festes' },
    { id: 'coop', nom: 'Cooperativa', categoriaId: 'camp' }
  ];
  const articles = [
    resum('v1', 'veu', '2026-10-03T09:00:00.000Z'), resum('v2', 'veu', '2026-09-30T09:00:00.000Z'),
    resum('r1', 'radio', '2026-10-02T12:00:00.000Z'), resum('c1', 'coop', '2026-10-03T07:00:00.000Z'), resum('c2', 'coop', null)
  ];
  const base = { categories, fonts, articles, ara };

  test('«Hui»: les de les últimes 24 hores de les fonts seguides, de la més nova a la més vella', () => {
    const estat = estatInicial();
    expect(articlesDeCarpeta({ ...base, estat, carpeta: HUI }).map((a) => a.id)).toEqual(['v1', 'c1', 'r1']);
    expect(articlesDeCarpeta({ ...base, estat: commutaSeguiment(estat, 'coop'), carpeta: HUI }).map((a) => a.id)).toEqual(['v1', 'r1']);
    expect(esDeHui(resum('x', 'veu', null), ara)).toBe(false);
  });

  test('una categoria: les seues fonts seguides; una font; una carpeta que no existix → null', () => {
    const estat = estatInicial();
    expect(articlesDeCarpeta({ ...base, estat, carpeta: 'festes' }).map((a) => a.id)).toEqual(['v1', 'r1', 'v2']);
    expect(articlesDeCarpeta({ ...base, estat, carpeta: 'festes', fontId: 'radio' }).map((a) => a.id)).toEqual(['r1']);
    expect(articlesDeCarpeta({ ...base, estat, carpeta: 'camp' }).map((a) => a.id)).toEqual(['c1', 'c2']);
    expect(articlesDeCarpeta({ ...base, estat, carpeta: 'inventada' })).toBeNull();
    expect(fontsDeCarpeta({ ...base, estat, carpeta: 'festes' }).map((f) => f.id)).toEqual(['veu', 'radio']);
    expect(fontsDeCarpeta({ ...base, estat, carpeta: HUI }).map((f) => f.id)).toEqual(['veu', 'radio', 'coop']);
  });

  test('«Per a després»: en l’ordre en què es van desar; la versió viva si encara hi és, la desada si no', () => {
    const vell = { ...resum('vell', 'veu'), titol: 'Ja no és al feed' };
    const estat = commutaDespres(commutaDespres(commutaSeguiment(estatInicial(), 'veu'), vell), { ...resum('r1', 'radio'), titol: 'Títol desat' });
    const llista = articlesDeCarpeta({ ...base, estat, carpeta: DESPRES });
    expect(llista.map((a) => [a.id, a.titol])).toEqual([['r1', 'Títol r1'], ['vell', 'Ja no és al feed']]);
  });

  test('comptadors: no llegides per carpeta i per font; desades a «Per a després»', () => {
    const estat = commutaDespres(marcaLlegit(estatInicial(), 'v1'), resum('v2', 'veu'));
    const carpetes = comptadorsCarpetes({ ...base, estat });
    expect([...carpetes]).toEqual([[HUI, 2], [DESPRES, 1], ['festes', 2], ['camp', 2]]);
    const delesFestes = comptadorsFonts({ ...base, estat, carpeta: 'festes' });
    expect(delesFestes.total).toBe(2);
    expect([...delesFestes.perFont]).toEqual([['radio', 1], ['veu', 1]]);
    expect(comptadorsFonts({ ...base, estat, carpeta: DESPRES })).toEqual({ total: 1, perFont: new Map([['veu', 1]]) });
  });

  test('ordenaPerData no muta i deixa les que no tenen data al final', () => {
    const llista = [resum('a', 'veu', null), resum('b', 'veu', '2026-01-01T00:00:00.000Z'), resum('c', 'veu', '2026-02-01T00:00:00.000Z')];
    expect(ordenaPerData(llista).map((a) => a.id)).toEqual(['c', 'b', 'a']);
    expect(llista.map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });
});
