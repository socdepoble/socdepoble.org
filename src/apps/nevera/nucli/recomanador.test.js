// @vitest-environment node
/* La Nevera de Casa · el recomanador de receptes (pur i determinista).
   Onada 12 (261011; ordres 261011_0130, punt 6). Receptes sintètiques per a
   les regles (cobertura, substituts, caducitat, ordre) i el receptari de
   llavor per als invariants. El dia d'«avui» el posa cada prova: al nucli no
   hi ha rellotge. */
import { describe, expect, test } from 'vitest';
import { RECEPTES, faltaPerCuinar, recomana } from './index.js';
/* Correcció del refutador (261011, R5) · El que només miren les proves s'importa del fitxer, no de la façana. */
import { FINESTRA_APROFITAMENT, GRUPS_RECEPTA, MAX_FALTEN_QUASI, diaAbsolut, enumera, quanCaduca } from './recomanador.js';

const cal = (id, o = []) => ({ id, quantitat: '1', opcional: false, o });
const siVols = (id) => ({ id, quantitat: '1', opcional: true, o: [] });
const recepta = (id, nom, ingredients) => ({ id, nom, resum: nom, racions: 4, ingredients });
const tinc = (...ids) => ids.map((ingredient) => ({ ingredient }));
const una = (receptes, existencies, opcions) => recomana(receptes, existencies, opcions)[0];

const PISTO = recepta('pisto', 'Pisto', [cal('tomaca'), cal('pebrot'), cal('carabasso'), cal('ceba'), cal('oli'), siVols('all')]);
/* 2026-10-11 és diumenge. */
const AVUI = '2026-10-11';

describe('els dies, sense rellotge', () => {
  test('diaAbsolut conta els dies des de l’1 de gener de 1970 i refusa el que no és un dia', () => {
    expect(diaAbsolut('1970-01-01')).toBe(0);
    expect(diaAbsolut('1970-01-02')).toBe(1);
    expect(diaAbsolut('1969-12-31')).toBe(-1);
    expect(diaAbsolut('2000-03-01') - diaAbsolut('2000-02-28')).toBe(2);
    expect(diaAbsolut('2026-03-01') - diaAbsolut('2026-02-28')).toBe(1);
    expect(diaAbsolut('2026-10-11')).toBe(20737);
    for (const dolent of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-1-1', '11/10/2026', '', null, 20261011]) {
      expect(diaAbsolut(dolent), String(dolent)).toBeNull();
    }
  });

  test('quanCaduca: hui, demà, el dia de la setmana dins de sis dies i, més enllà, la data', () => {
    expect(quanCaduca(0, '2026-10-11')).toBe('hui');
    expect(quanCaduca(1, '2026-10-12')).toBe('demà');
    expect(quanCaduca(4, '2026-10-15')).toBe('dijous');
    expect(quanCaduca(6, '2026-10-17')).toBe('dissabte');
    expect(quanCaduca(7, '2026-10-18')).toBe('el 18/10');
  });

  test('enumera', () => {
    expect(enumera([])).toBe('');
    expect(enumera(['cebes'])).toBe('cebes');
    expect(enumera(['cebes', 'alls'])).toBe('cebes i alls');
    expect(enumera(['cebes', 'alls', 'sal'])).toBe('cebes, alls i sal');
  });
});

describe('cobertura i el que falta', () => {
  test('5 de 6 ingredients: diu què falta i és «quasi»', () => {
    const r = una([recepta('x', 'X', [cal('tomaca'), cal('pebrot'), cal('carabasso'), cal('ceba'), cal('oli'), cal('all')])],
      tinc('tomaca', 'pebrot', 'carabasso', 'oli', 'all'));
    expect(r).toMatchObject({ receptaId: 'x', grup: 'quasi', obligatoris: 6, tinc: 5, titular: 'Tens 5 de 6 ingredients' });
    expect(r.falten).toEqual([{ id: 'ceba', nom: 'cebes', alternatives: [] }]);
    expect(r.frases[0]).toBe('Falten: cebes.');
    expect(r.explicacio).toBe('Tens 5 de 6 ingredients. Falten: cebes. Aprofites el fresc que tens: tomaques, pebrots i carabassó.');
  });

  test('tot: «a punt», i els opcionals que es tenen es diuen', () => {
    const r = una([PISTO], tinc('tomaca', 'pebrot', 'carabasso', 'ceba', 'oli', 'all'));
    expect(r).toMatchObject({ grup: 'a-punt', tinc: 5, obligatoris: 5, falten: [], opcionalsTinc: ['all'], titular: 'Tens els 5 ingredients' });
    expect(r.frases).toEqual(['Aprofites el fresc que tens: tomaques, pebrots i carabassó.', 'Si vols, també hi van (en tens): alls.']);
  });

  test('res: «lluny», i ho diu sense embuts', () => {
    const r = una([PISTO], []);
    expect(r).toMatchObject({ grup: 'lluny', tinc: 0, titular: 'No tens cap dels 5 ingredients' });
    expect(r.frases).toEqual(['Falten: tomaques, pebrots, carabassó, cebes i oli d’oliva.']);
  });

  test('«quasi» és com a molt MAX_FALTEN_QUASI que falten i tindre’n algun', () => {
    expect(MAX_FALTEN_QUASI).toBe(2);
    expect(una([PISTO], tinc('tomaca', 'pebrot', 'carabasso')).grup).toBe('quasi');
    expect(una([PISTO], tinc('tomaca', 'pebrot')).grup).toBe('lluny');
    /* Dos obligatoris i cap a casa: en falten 2, però no se'n té cap. */
    expect(una([recepta('a', 'A', [cal('all'), cal('oli')])], []).grup).toBe('lluny');
    expect(una([recepta('a', 'A', [cal('all'), cal('oli')])], tinc('all')).grup).toBe('quasi');
  });

  test('un opcional que falta no resta, i un obligatori que es té dues vegades compta una', () => {
    const r = una([PISTO], [...tinc('tomaca', 'pebrot', 'carabasso', 'ceba', 'oli'), ...tinc('tomaca')]);
    expect(r).toMatchObject({ grup: 'a-punt', tinc: 5, opcionalsTinc: [] });
  });

  test('una existència d’un ingredient que la taula no coneix, o mal formada, no compta', () => {
    const r = una([PISTO], [{ ingredient: 'unicorn' }, null, 'tomaca', { ingredient: 'tomaca' }]);
    expect(r.tens).toEqual(['tomaca']);
    expect(recomana(null, null)).toEqual([]);
    expect(recomana([null, { id: 'x' }, PISTO], undefined)).toHaveLength(1);
  });
});

describe('substituts', () => {
  const OLLA = recepta('olla', 'Olla', [cal('cigro'), cal('penca', ['bleda'])]);

  test('amb el substitut es té, i ho diu', () => {
    const r = una([OLLA], tinc('cigro', 'bleda'));
    expect(r).toMatchObject({ grup: 'a-punt', tinc: 2, tens: ['cigro', 'bleda'], substitucions: [{ enLlocDe: 'penca', amb: 'bleda' }] });
    expect(r.frases).toContain('Amb bledes en lloc de penques.');
  });

  test('si falten tots dos, la llista de la compra diu el principal i l’alternativa', () => {
    const r = una([OLLA], tinc('cigro'));
    expect(r.falten).toEqual([{ id: 'penca', nom: 'penques', alternatives: ['bledes'] }]);
    expect(r.frases[0]).toBe('Falten: penques (o bledes).');
  });

  test('amb el principal, cap substitució', () => {
    expect(una([OLLA], tinc('cigro', 'penca', 'bleda')).substitucions).toEqual([]);
  });
});

describe('se n’acaba', () => {
  test('compta com a tingut, i ho avisa', () => {
    const r = una([PISTO], [...tinc('tomaca', 'pebrot', 'carabasso', 'oli'), { ingredient: 'ceba', estat: 'se-n-acaba' }]);
    expect(r).toMatchObject({ grup: 'a-punt', sAcaben: ['ceba'] });
    expect(r.frases).toContain('Se n’acaben: cebes.');
  });

  /* Correcció del refutador (261011, R2) · La concordança la diu el nombre de l'ingredient (taula). */
  test('concordança: un sol ingredient en singular, «Falta» i «Se n’acaba»; en plural o més d’un, «Falten» i «Se n’acaben»', () => {
    const frase = (ingredients, existencies, inici) => una([recepta('x', 'X', ingredients)], existencies).frases.find((f) => f.startsWith(inici));
    expect(frase([cal('all'), cal('oli')], tinc('all'), 'Falt')).toBe('Falta: oli d’oliva.');
    expect(frase([cal('all'), cal('arros')], tinc('all'), 'Falt')).toBe('Falta: arròs.');
    expect(frase([cal('all'), cal('ou')], tinc('all'), 'Falt')).toBe('Falten: ous.');
    expect(frase([cal('all'), cal('tomaca')], tinc('all'), 'Falt')).toBe('Falten: tomaques.');
    expect(frase([cal('ou'), cal('oli'), cal('sal')], tinc('ou'), 'Falt')).toBe('Falten: oli d’oliva i sal.');
    const sAcaba = (id) => [{ ingredient: id, estat: 'se-n-acaba' }];
    expect(frase([cal('oli'), cal('all')], [...sAcaba('oli'), ...tinc('all')], 'Se n')).toBe('Se n’acaba: oli d’oliva.');
    expect(frase([cal('oli'), cal('all')], [...tinc('oli'), ...sAcaba('all')], 'Se n')).toBe('Se n’acaben: alls.');
    expect(frase([cal('oli'), cal('sal')], [...sAcaba('oli'), ...sAcaba('sal')], 'Se n')).toBe('Se n’acaben: oli d’oliva i sal.');
  });

  test('si d’una altra existència n’hi ha, no avisa', () => {
    const r = una([PISTO], [...tinc('tomaca', 'pebrot', 'carabasso', 'oli', 'ceba'), { ingredient: 'ceba', estat: 'se-n-acaba' }]);
    expect(r.sAcaben).toEqual([]);
  });
});

describe('caducitat: gasta primer el que es fa malbé', () => {
  test('el que caduca dins de la finestra es diu amb el dia, el més urgent davant', () => {
    expect(FINESTRA_APROFITAMENT).toBe(7);
    const r = una([PISTO], [
      { ingredient: 'tomaca', caduca: '2026-10-15' }, { ingredient: 'pebrot', caduca: '2026-10-12' },
      { ingredient: 'carabasso', caduca: '2026-11-30' }, ...tinc('ceba', 'oli')
    ], { avui: AVUI });
    expect(r.aprofita).toEqual([
      { id: 'pebrot', nom: 'pebrots', dies: 1, quan: 'demà' }, { id: 'tomaca', nom: 'tomaques', dies: 4, quan: 'dijous' }
    ]);
    expect(r.frases).toContain('Aprofites el que caduca abans: pebrots (demà) i tomaques (dijous).');
    /* Amb dates, la frase del fresc sense data no es repetix. */
    expect(r.frases.some((frase) => frase.startsWith('Aprofites el fresc'))).toBe(false);
  });

  test('un ingredient CADUCAT no es compta mai com a tingut, i la recomanació ho diu', () => {
    const r = una([PISTO], [{ ingredient: 'tomaca', caduca: '2026-10-08' }, ...tinc('pebrot', 'carabasso', 'ceba', 'oli')], { avui: AVUI });
    expect(r).toMatchObject({ grup: 'quasi', tinc: 4, caducats: [{ id: 'tomaca', nom: 'tomaques', des: '2026-10-08' }] });
    expect(r.falten.map((f) => f.id)).toEqual(['tomaca']);
    expect(r.tens).not.toContain('tomaca');
    expect(r.explicacio).toContain('No es compta el que consta caducat: tomaques (des del 08/10).');
  });

  test('si d’un ingredient n’hi ha de caducat i de bo, es té (el bo) i no s’acusa de caducat', () => {
    const r = una([PISTO], [
      { ingredient: 'tomaca', caduca: '2026-10-08' }, { ingredient: 'tomaca', caduca: '2026-10-13' }, ...tinc('pebrot', 'carabasso', 'ceba', 'oli')
    ], { avui: AVUI });
    expect(r).toMatchObject({ grup: 'a-punt', caducats: [] });
    expect(r.aprofita).toEqual([{ id: 'tomaca', nom: 'tomaques', dies: 2, quan: 'dimarts' }]);
  });

  test('el que caduca hui encara es té', () => {
    const r = una([PISTO], [{ ingredient: 'tomaca', caduca: AVUI }, ...tinc('pebrot', 'carabasso', 'ceba', 'oli')], { avui: AVUI });
    expect(r.grup).toBe('a-punt');
    expect(r.aprofita[0]).toMatchObject({ id: 'tomaca', dies: 0, quan: 'hui' });
  });

  test('sense «avui», o amb una data que no ho és, les dates no es miren: res caduca i res té pressa', () => {
    const existencies = [{ ingredient: 'tomaca', caduca: '2000-01-01' }, { ingredient: 'pebrot', caduca: 'demà passat' }, ...tinc('carabasso', 'ceba', 'oli')];
    for (const opcions of [undefined, {}, { avui: 'hui' }]) {
      expect(una([PISTO], existencies, opcions)).toMatchObject({ grup: 'a-punt', aprofita: [], caducats: [] });
    }
    expect(una([PISTO], existencies, { avui: AVUI })).toMatchObject({ grup: 'quasi', aprofita: [] });
  });

  test('un substitut caducat també es diu', () => {
    const r = una([recepta('olla', 'Olla', [cal('cigro'), cal('penca', ['bleda'])])],
      [{ ingredient: 'cigro' }, { ingredient: 'bleda', caduca: '2026-10-01' }], { avui: AVUI });
    expect(r.caducats).toEqual([{ id: 'bleda', nom: 'bledes', des: '2026-10-01' }]);
    expect(r.falten).toHaveLength(1);
  });
});

describe('l’ordre és estable i es pot explicar', () => {
  const A = recepta('a', 'A', [cal('tomaca'), cal('oli')]);
  const B = recepta('b', 'B', [cal('all'), cal('oli')]);
  const C = recepta('c', 'C', [cal('arros'), cal('cigro'), cal('creilla')]);
  const D = recepta('d', 'D', [cal('ou'), cal('pa')]);
  const ordre = (receptes, existencies, opcions) => recomana(receptes, existencies, opcions).map((r) => r.receptaId);

  test('primer el grup: a punt, quasi, lluny', () => {
    expect(GRUPS_RECEPTA).toEqual(['a-punt', 'quasi', 'lluny']);
    expect(ordre([C, D, A], tinc('tomaca', 'oli', 'arros', 'cigro'))).toEqual(['a', 'c', 'd']);
  });

  test('dins del grup, la que gasta el que caduca abans passa davant, encara que l’altra vaja primer al receptari', () => {
    const existencies = [{ ingredient: 'tomaca' }, { ingredient: 'oli' }, { ingredient: 'all', caduca: '2026-10-13' }];
    expect(ordre([A, B], existencies, { avui: AVUI })).toEqual(['b', 'a']);
    /* Sense dia d'avui no hi ha pressa: mana el fresc (la tomaca) i després el receptari. */
    expect(ordre([B, A], existencies)).toEqual(['a', 'b']);
  });

  test('la pressa de dos dies guanya a la de cinc', () => {
    const existencies = [{ ingredient: 'tomaca', caduca: '2026-10-16' }, { ingredient: 'oli' }, { ingredient: 'all', caduca: '2026-10-13' }];
    expect(ordre([A, B], existencies, { avui: AVUI })).toEqual(['b', 'a']);
  });

  test('a igualtat de tot, l’ordre del receptari, i cridar-ho dues vegades dona el mateix', () => {
    const E = recepta('e', 'E', [cal('ou'), cal('pa')]);
    expect(ordre([D, E], tinc('ou', 'pa'))).toEqual(['d', 'e']);
    expect(ordre([E, D], tinc('ou', 'pa'))).toEqual(['e', 'd']);
    const existencies = tinc('tomaca', 'oli', 'ceba', 'ou');
    expect(recomana(RECEPTES, existencies, { avui: AVUI })).toEqual(recomana(RECEPTES, existencies, { avui: AVUI }));
  });

  test('no toca les entrades', () => {
    const existencies = Object.freeze(tinc('tomaca', 'oli').map(Object.freeze));
    expect(() => recomana(RECEPTES, existencies, { avui: AVUI })).not.toThrow();
  });
});

describe('sobre el receptari de llavor', () => {
  test('amb el rebost buit totes les receptes ixen, cap «a punt», i cada una diu què falta', () => {
    const totes = recomana(RECEPTES, []);
    expect(totes.map((r) => r.receptaId).sort()).toEqual(RECEPTES.map((r) => r.id).sort());
    for (const r of totes) {
      expect(r.grup, r.receptaId).toBe('lluny');
      expect(r.falten.length, r.receptaId).toBe(r.obligatoris);
      expect(r.explicacio, r.receptaId).toMatch(/^No tens cap dels \d+ ingredients\. Falten: /);
    }
  });

  test('pa, tomaques i oli: el pa amb tomaca és a punt i va el primer', () => {
    const totes = recomana(RECEPTES, tinc('pa', 'tomaca', 'oli'));
    expect(totes[0]).toMatchObject({ receptaId: 'pa-amb-tomaca', grup: 'a-punt', explicacio: 'Tens els 3 ingredients. Aprofites el fresc que tens: tomaques.' });
    expect(totes.filter((r) => r.grup === 'a-punt').map((r) => r.receptaId)).toEqual(['pa-amb-tomaca']);
    expect(totes.find((r) => r.receptaId === 'ous-amb-tomaca')).toMatchObject({ grup: 'quasi', frases: expect.arrayContaining(['Falten: ous.']) });
  });

  test('tinc + falten = obligatoris, sempre', () => {
    for (const existencies of [[], tinc('oli'), tinc('tomaca', 'ceba', 'oli', 'ou', 'creilla', 'all', 'pa', 'arros', 'cigro')]) {
      for (const r of recomana(RECEPTES, existencies)) expect(r.tinc + r.falten.length, r.receptaId).toBe(r.obligatoris);
    }
  });
});

describe('faltaPerCuinar: la llista de la compra per a cuinar', () => {
  test('els obligatoris que falten a les receptes «quasi», sense repetits i dient per a què', () => {
    const recomanacions = recomana(RECEPTES, tinc('pa', 'tomaca', 'oli'));
    const falta = faltaPerCuinar(recomanacions);
    expect(new Set(falta.map((f) => f.id)).size).toBe(falta.length);
    const ous = falta.find((f) => f.id === 'ou');
    expect(ous).toMatchObject({ nom: 'Ous' });
    expect(ous.receptes).toContain('Ous amb tomaca');
    const all = falta.find((f) => f.id === 'all');
    expect(all.receptes).toEqual(expect.arrayContaining(['Sopa d’all', 'Allioli']));
    /* Res d'una recepta «lluny» ni d'una «a punt». */
    const quasi = new Set(recomanacions.filter((r) => r.grup === 'quasi').flatMap((r) => r.falten.map((f) => f.id)));
    expect(new Set(falta.map((f) => f.id))).toEqual(quasi);
  });

  test('un altre grup, i res si no hi ha recomanacions', () => {
    const recomanacions = recomana(RECEPTES, []);
    expect(faltaPerCuinar(recomanacions)).toEqual([]);
    expect(faltaPerCuinar(recomanacions, { grup: 'lluny' }).length).toBeGreaterThan(5);
    expect(faltaPerCuinar(null)).toEqual([]);
  });
});
