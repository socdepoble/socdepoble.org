/* D-v128-2-PREVIA · La vista prèvia d'un fil sense els missatges amagats amb «Elimina per a mi». */
import { describe, expect, test } from 'vitest';
import { previaSenseAmagats, previesSenseAmagats } from '../projeccioAccionsMissatges.js';
import { estatDeLUltim } from '../../../sections/xat/missatges.js';

const JO = 'jo', ANNA = 'anna';
const m = (id, seq, text, extra = {}) => ({ id, seq, text, tipus: 'text', usuariId: ANNA, sender: 'other', ...extra });
const fil = (extra = {}) => ({ id: 'f1', name: 'General', tipus: 'grup', ultimSeq: 3, ultimText: 'secret', ultimTipus: 'text', ultimAutorId: JO, ultimAl: '2026-11-19T08:00:00Z', searchText: 'general secret', ...extra });
const missatges = [m('a', 1, 'hola'), m('b', 2, 'bon dia', { usuariId: JO, sender: 'me' }), m('c', 3, 'secret', { usuariId: JO, sender: 'me' })];
const amagat = (...ids) => Object.fromEntries(ids.map((id) => [id, { missatgeId: id, filId: 'f1', amagat: true }]));

describe('previaSenseAmagats', () => {
  test('l’últim amagat: la vista prèvia és l’últim que encara veus (text, autor, cerca)', () => {
    const f = fil();
    const nou = previaSenseAmagats(f, missatges, amagat('c'), JO);
    expect(nou).toMatchObject({ ultimText: 'bon dia', ultimTipus: 'text', ultimAutorId: JO, searchText: 'general bon dia' });
    // L'ordre, els no llegits i les marques continuen sent els del servidor.
    expect(nou).toMatchObject({ ultimSeq: 3, ultimAl: f.ultimAl, seqPrevia: 2 });
    expect(f.ultimText).toBe('secret');
  });
  test('tots amagats: la vista prèvia buida d’un fil sense missatges', () => {
    expect(previaSenseAmagats(fil(), missatges, amagat('a', 'b', 'c'), JO))
      .toMatchObject({ ultimText: '', ultimTipus: null, ultimAutorId: null, seqPrevia: null, searchText: 'general ' });
  });
  test('les marques de la fila són les del missatge que s’ensenya, no les de l’amagat', () => {
    // El seq 2 (meu) ja l'han llegit; el seq 3 (meu, amagat) només ha arribat al servidor.
    const f = fil({ tipus: 'directe', llegitPelsAltresFinsSeq: 2, rebutPelsAltresFinsSeq: 2 });
    expect(estatDeLUltim(f, JO)).toBe('enviat');
    expect(estatDeLUltim(previaSenseAmagats(f, missatges, amagat('c'), JO), JO)).toBe('llegit');
    // Al revés: l'amagat és el llegit i el visible no. Sense correcció, ultimSeq tal qual.
    const g = fil({ tipus: 'directe', llegitPelsAltresFinsSeq: 0, rebutPelsAltresFinsSeq: 3 });
    expect(estatDeLUltim(previaSenseAmagats(g, missatges, amagat('c'), JO), JO)).toBe('lliurat');
    expect(estatDeLUltim(fil({ tipus: 'directe', llegitPelsAltresFinsSeq: 3 }), JO)).toBe('llegit');
  });
  test('l’autor d’un pendent propi sense usuariId és qui mira', () => {
    const llista = [m('a', null, 'meu', { usuariId: undefined, sender: 'me' }), m('c', 3, 'secret')];
    expect(previaSenseAmagats(fil(), llista, amagat('c'), JO)).toMatchObject({ ultimText: 'meu', ultimAutorId: JO });
  });
  test('el MATEIX objecte si l’amagat no és el de la vista prèvia', () => {
    const f = fil();
    expect(previaSenseAmagats(f, missatges, amagat('a'), JO)).toBe(f);
    expect(previaSenseAmagats(f, missatges, {}, JO)).toBe(f);
  });
  test('l’últim del servidor és més nou que els carregats: no es toca', () => {
    const f = fil({ ultimSeq: 9, ultimText: 'nou del servidor' });
    expect(previaSenseAmagats(f, missatges, amagat('c'), JO)).toBe(f);
  });
  test('sense seq al fil, compta l’últim carregat', () => {
    expect(previaSenseAmagats(fil({ ultimSeq: 0 }), missatges, amagat('c'), JO)).toMatchObject({ ultimText: 'bon dia' });
  });
});

describe('previesSenseAmagats', () => {
  test('la MATEIXA llista sense cap amagat; només canvia el fil afectat', () => {
    const fils = [fil(), fil({ id: 'f2', ultimText: 'altre' })];
    expect(previesSenseAmagats(fils, { f1: missatges }, {}, JO)).toBe(fils);
    expect(previesSenseAmagats(fils, { f1: missatges }, { c: { amagat: false, destacat: true } }, JO)).toBe(fils);
    const nous = previesSenseAmagats(fils, { f1: missatges }, amagat('c'), JO);
    expect(nous).not.toBe(fils);
    expect(nous[0].ultimText).toBe('bon dia');
    expect(nous[1]).toBe(fils[1]);
  });
  test('un fil amb missatges no carregats queda igual', () => {
    const fils = [fil()];
    expect(previesSenseAmagats(fils, {}, amagat('c'), JO)).toBe(fils);
  });
});
