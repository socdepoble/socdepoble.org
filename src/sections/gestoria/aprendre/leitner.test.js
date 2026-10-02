// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  CAIXES_PER_DEFECTE, HORA_VENCIMENT, diaLocal, estatInicial, pendents, proximRepas, reconcilia, respon, venciment
} from './leitner.js';

const UTC = (a, m, d, h = 0, min = 0) => Date.UTC(a, m - 1, d, h, min);
const horaMadrid = ms => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hourCycle: 'h23', hour: 'numeric' }).format(ms));

const baralla = (...targetes) => ({ id: 'prova', versio: '1.0.0', targetes });
const t = (id, versio = '1') => ({ id, versio });

describe('caixes i estat inicial', () => {
  test('intervals per defecte i estat d’una targeta nova', () => {
    expect([...CAIXES_PER_DEFECTE]).toEqual([0, 1, 3, 7, 16, 35]);
    expect(Object.isFrozen(CAIXES_PER_DEFECTE)).toBe(true);
    expect(estatInicial('a', '1')).toEqual({
      cardId: 'a', contentVersion: '1', caixa: 0, dueAt: null, lastReviewedAt: null, repetitions: 0, lapses: 0
    });
    expect(() => estatInicial('', '1')).toThrow(TypeError);
    expect(() => estatInicial('a')).toThrow(TypeError);
  });
});

describe('venciment a les 04:00 de Madrid', () => {
  test('dia normal: 1 dia després a les 04:00 locals (CEST, UTC+2)', () => {
    const ara = UTC(2026, 10, 2, 9);
    expect(venciment(ara, 1)).toBe(UTC(2026, 10, 3, 2));
    expect(venciment(new Date(ara), 7)).toBe(UTC(2026, 10, 9, 2));
  });

  test('canvi d’hora de primavera 2026 (29 de març): sempre les 04:00 locals', () => {
    const dissabte = UTC(2026, 3, 28, 11); // 12:00 CET
    expect(venciment(dissabte, 0)).toBe(UTC(2026, 3, 28, 3)); // 04:00 CET d'eixe dia, ja passat
    expect(venciment(dissabte, 1)).toBe(UTC(2026, 3, 29, 2)); // 04:00 CEST
    expect(venciment(dissabte, 3)).toBe(UTC(2026, 3, 31, 2));
    expect(venciment(dissabte, 1) - dissabte).toBe(15 * 3600 * 1000); // el 29 de març té 23 h
    for (const dies of [1, 3, 7, 16, 35]) expect(horaMadrid(venciment(dissabte, dies))).toBe(HORA_VENCIMENT);
  });

  test('primavera: compta el dia natural de Madrid, no el d’UTC', () => {
    // 23:30 UTC del 28 de març és 00:30 del 29 a Madrid.
    expect(diaLocal(UTC(2026, 3, 28, 23, 30))).toEqual({ a: 2026, m: 3, d: 29 });
    expect(venciment(UTC(2026, 3, 28, 23, 30), 1)).toBe(UTC(2026, 3, 30, 2));
    // 03:30 CEST, just després del salt: la caixa 0 no espera a les 04:00.
    const matinada = UTC(2026, 3, 29, 1, 30);
    expect(venciment(matinada, 0)).toBe(matinada);
    expect(venciment(matinada, 1)).toBe(UTC(2026, 3, 30, 2));
  });

  test('canvi d’hora de tardor 2026 (25 d’octubre): sempre les 04:00 locals', () => {
    const dissabte = UTC(2026, 10, 24, 10); // 12:00 CEST
    expect(venciment(dissabte, 1)).toBe(UTC(2026, 10, 25, 3)); // 04:00 CET
    expect(venciment(dissabte, 1) - dissabte).toBe(17 * 3600 * 1000); // el 25 d'octubre té 25 h
    expect(venciment(UTC(2026, 10, 20, 10), 7)).toBe(UTC(2026, 10, 27, 3));
    for (const dies of [1, 3, 7, 16, 35]) expect(horaMadrid(venciment(dissabte, dies))).toBe(HORA_VENCIMENT);
  });

  test('tardor: les dues 02:30 de la nit repetida cauen al mateix dia', () => {
    const primera = UTC(2026, 10, 25, 0, 30); // 02:30 CEST
    const segona = UTC(2026, 10, 25, 1, 30); // 02:30 CET
    expect(diaLocal(primera)).toEqual(diaLocal(segona));
    expect(venciment(primera, 1)).toBe(UTC(2026, 10, 26, 3));
    expect(venciment(segona, 1)).toBe(UTC(2026, 10, 26, 3));
    expect(venciment(segona, 0)).toBe(segona);
  });

  test('entrades invàlides', () => {
    expect(() => venciment('demà', 1)).toThrow(TypeError);
    expect(() => venciment(Number.NaN, 1)).toThrow(TypeError);
    expect(() => venciment(0, -1)).toThrow(RangeError);
    expect(() => venciment(0, 1.5)).toThrow(RangeError);
  });
});

describe('respon', () => {
  const ara = UTC(2026, 10, 5, 8); // dilluns 5 d'octubre, 10:00 CEST

  test('cada encert puja una caixa fins a l’última; el venciment seguix els intervals', () => {
    let estat = estatInicial('a', '1');
    const caixes = [];
    for (let i = 0; i < 7; i++) {
      estat = respon(estat, { encert: true, ara });
      caixes.push(estat.caixa);
    }
    expect(caixes).toEqual([1, 2, 3, 4, 5, 5, 5]);
    expect(estat.dueAt).toBe(venciment(ara, 35));
    expect(estat.repetitions).toBe(7);
    expect(estat.lapses).toBe(0);
    expect(estat.lastReviewedAt).toBe(ara);
  });

  test('un error torna a la caixa 0, compta el lapse i venç hui mateix', () => {
    const alta = { ...estatInicial('a', '1'), caixa: 4, dueAt: ara, repetitions: 4 };
    const nou = respon(alta, { encert: false, ara });
    expect(nou).toMatchObject({ caixa: 0, repetitions: 5, lapses: 1, lastReviewedAt: ara });
    expect(nou.dueAt).toBeLessThanOrEqual(ara);
    expect(respon(nou, { encert: true, ara: new Date(ara) }).caixa).toBe(1);
  });

  test('respostes repetides el mateix dia: cada una compta i no muta l’estat', () => {
    const inicial = Object.freeze({ ...estatInicial('a', '1'), barallaId: 'prova' });
    const primera = respon(inicial, { encert: true, ara });
    const segona = respon(primera, { encert: true, ara: ara + 60_000 });
    const tercera = respon(segona, { encert: false, ara: ara + 120_000 });
    expect([primera.caixa, segona.caixa, tercera.caixa]).toEqual([1, 2, 0]);
    expect(tercera).toMatchObject({ repetitions: 3, lapses: 1, barallaId: 'prova' });
    expect(inicial.caixa).toBe(0);
  });

  test('caixes a mida, caixa corrupta i paràmetres invàlids', () => {
    expect(respon(estatInicial('a', '1'), { encert: true, ara }, { caixes: [0, 2] }).dueAt).toBe(venciment(ara, 2));
    expect(respon({ ...estatInicial('a', '1'), caixa: 9 }, { encert: true, ara }, { caixes: [0, 2] }).caixa).toBe(1);
    expect(respon({ ...estatInicial('a', '1'), caixa: 'x' }, { encert: true, ara }).caixa).toBe(1);
    expect(() => respon(estatInicial('a', '1'), { encert: 'sí', ara })).toThrow(TypeError);
    expect(() => respon(estatInicial('a', '1'), { encert: true })).toThrow(TypeError);
    expect(() => respon(estatInicial('a', '1'), { encert: true, ara }, { caixes: [] })).toThrow(RangeError);
    expect(() => respon(null, { encert: true, ara })).toThrow(TypeError);
  });
});

describe('reconcilia', () => {
  test('canvi de versió: torna a la caixa 0 com a nova i conserva l’historial', () => {
    const vell = { ...estatInicial('a', '1'), caixa: 3, dueAt: 10, lastReviewedAt: 5, repetitions: 3, barallaId: 'prova' };
    const [nou] = reconcilia([vell], baralla(t('a', '2')));
    expect(nou).toEqual({ ...vell, contentVersion: '2', caixa: 0, dueAt: null });
  });

  test('targetes eliminades fora, ordre de la baralla, sense canvis la mateixa referència', () => {
    const a = { ...estatInicial('a', '1'), caixa: 1, dueAt: 10 };
    const b = { ...estatInicial('b', '1'), caixa: 2, dueAt: 20 };
    const orfe = { ...estatInicial('z', '1'), caixa: 5, dueAt: 1 };
    const resultat = reconcilia([orfe, b, a, null, { cardId: 7 }], baralla(t('a'), t('b')));
    expect(resultat).toHaveLength(2);
    expect(resultat[0]).toBe(a);
    expect(resultat[1]).toBe(b);
    expect(reconcilia(undefined, baralla(t('a')))).toEqual([]);
  });

  test('duplicats: guanya el revisat més tard; baralla invàlida llança', () => {
    const vell = { ...estatInicial('a', '1'), caixa: 4, lastReviewedAt: 1 };
    const recent = { ...estatInicial('a', '1'), caixa: 0, lastReviewedAt: 2 };
    expect(reconcilia([recent, vell], baralla(t('a')))[0]).toBe(recent);
    expect(() => reconcilia([], { targetes: [t('a'), t('a')] })).toThrow(TypeError);
    expect(() => reconcilia([], {})).toThrow(TypeError);
  });
});

describe('pendents i pròxim repàs', () => {
  const ara = UTC(2026, 10, 5, 8);
  const dia = 24 * 3600 * 1000;

  test('vençudes primer (més antiga, caixa més baixa, ordre de la baralla) i després les noves', () => {
    const b = baralla(t('n1'), t('v-caixa2'), t('futura'), t('v-antiga'), t('v-caixa1'), t('n2'), t('v-caixa1-bis'));
    const estats = [
      { ...estatInicial('v-caixa2', '1'), caixa: 2, dueAt: ara - dia },
      { ...estatInicial('futura', '1'), caixa: 3, dueAt: ara + dia },
      { ...estatInicial('v-antiga', '1'), caixa: 4, dueAt: ara - 3 * dia },
      { ...estatInicial('v-caixa1', '1'), caixa: 1, dueAt: ara - dia },
      { ...estatInicial('v-caixa1-bis', '1'), caixa: 1, dueAt: ara - dia }
    ];
    const llista = pendents(estats, b, ara);
    expect(llista.map(p => p.targeta.id)).toEqual(['v-antiga', 'v-caixa1', 'v-caixa1-bis', 'v-caixa2', 'n1', 'n2']);
    expect(llista.map(p => p.nova)).toEqual([false, false, false, false, true, true]);
    expect(llista[4].estat).toEqual(estatInicial('n1', '1'));
    expect(proximRepas(estats, b, ara)).toBe(ara + dia);
  });

  test('el venciment exacte ja compta; un canvi de versió la torna nova; les eliminades no hi són', () => {
    const b = baralla(t('a', '2'), t('b'));
    const estats = [
      { ...estatInicial('a', '1'), caixa: 5, dueAt: ara + 30 * dia },
      { ...estatInicial('b', '1'), caixa: 1, dueAt: ara },
      { ...estatInicial('fora', '1'), caixa: 1, dueAt: ara - dia }
    ];
    const llista = pendents(estats, b, new Date(ara));
    expect(llista.map(p => [p.targeta.id, p.nova, p.estat.caixa])).toEqual([['b', false, 1], ['a', true, 0]]);
    expect(proximRepas(estats, b, ara)).toBeNull();
  });

  test('sense estats, totes són noves en l’ordre de la baralla', () => {
    expect(pendents([], baralla(t('x'), t('y')), ara).map(p => p.targeta.id)).toEqual(['x', 'y']);
  });
});
