// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  MAX_ABSENTS_LLISTATS, PREFIX_RECOMANAT, compacta, comprovaEmissio, forats, foratsDeNumeros, llegixNumSerie,
  llegixNumSerieLlegat, numSerie, seguentNumSerie
} from './serie.js';

const A2026 = { prefix: 'A', any: 2026 };
/* El coixinet de les formes pintades del llegat, a part: la porta de qualitat no hi ha de veure un color. */
const COIXINET = '#';

describe('el número de sèrie', () => {
  test('prefix, any i número de quatre xifres com a mínim', () => {
    expect(numSerie({ ...A2026, numero: 1 })).toBe('A2026-0001');
    expect(numSerie({ ...A2026, numero: 12345 })).toBe('A2026-12345');
    expect(numSerie({ prefix: 'RT', any: 2027, numero: 7 })).toBe('RT2027-0007');
  });

  test('refusa prefixos, anys i números que no són de la forma', () => {
    for (const dolent of [
      { prefix: 'a', any: 2026, numero: 1 }, { prefix: 'A1', any: 2026, numero: 1 }, { prefix: '', any: 2026, numero: 1 },
      { prefix: 'A', any: 26, numero: 1 }, { prefix: 'A', any: 2026, numero: 0 }, { prefix: 'A', any: 2026, numero: 1.5 },
      { prefix: 'A', any: 2026, numero: 1000000000 }
    ]) expect(() => numSerie(dolent), JSON.stringify(dolent)).toThrow(expect.objectContaining({ codi: 'SERIE_INVALIDA' }));
  });

  test('llegixNumSerie només admet la forma canònica', () => {
    expect(llegixNumSerie('A2026-0001')).toEqual({ prefix: 'A', any: 2026, numero: 1 });
    expect(llegixNumSerie('RT2026-0012')).toEqual({ prefix: 'RT', any: 2026, numero: 12 });
    for (const dolent of ['A2026-1', 'A2026-00001', 'A2026-0000', 'a2026-0001', 'A26-0001', 'FAC/2026/1', null]) {
      expect(llegixNumSerie(dolent), String(dolent)).toBeNull();
    }
  });

  test('llegixNumSerie no llança amb un any d’abans de 2000: no és de la sèrie', () => {
    expect(llegixNumSerie('A1999-0001')).toBeNull();
    expect(forats(['A1999-0001', 'A2026-0001'], A2026).ultim).toBe(1);
  });

  test('el prefix recomanat: les rectificatives, en sèrie pròpia', () => {
    expect(PREFIX_RECOMANAT).toMatchObject({ F1: 'A', F2: 'T', R1: 'R', R5: 'RT' });
    expect(Object.isFrozen(PREFIX_RECOMANAT)).toBe(true);
  });
});

describe('el següent número, sense forats', () => {
  test('una sèrie nova comença per 1 i cada any recomença', () => {
    expect(seguentNumSerie([], A2026)).toBe('A2026-0001');
    expect(seguentNumSerie(['A2025-0001', 'A2025-0002'], A2026)).toBe('A2026-0001');
  });

  test('l’últim més u, i les altres sèries no compten', () => {
    expect(seguentNumSerie(['A2026-0001', 'T2026-0001', 'A2026-0002', 'A2025-0007', 'text lliure'], A2026)).toBe('A2026-0003');
  });

  test('un forat o un repetit para l’emissió fins que s’explique', () => {
    expect(() => seguentNumSerie(['A2026-0001', 'A2026-0003'], A2026))
      .toThrow(expect.objectContaining({ codi: 'SERIE_AMB_FORATS', detalls: { absents: [2], nombreAbsents: 1, repetits: [] } }));
    expect(() => seguentNumSerie(['A2026-0001', 'A2026-0001'], A2026))
      .toThrow(expect.objectContaining({ codi: 'SERIE_AMB_FORATS' }));
  });

  test('forats: absents, repetits i l’últim', () => {
    expect(forats(['A2026-0005', 'A2026-0002', 'A2026-0002'], A2026)).toEqual({ absents: [1, 3, 4], nombreAbsents: 3, repetits: [2], ultim: 5 });
    expect(forats([], A2026)).toEqual({ absents: [], nombreAbsents: 0, repetits: [], ultim: 0 });
  });

  test('un número altíssim no penja res: la llista es talla i el compte és sencer', () => {
    const r = forats(['A2026-999999999'], A2026);
    expect(r.absents).toHaveLength(MAX_ABSENTS_LLISTATS);
    expect(r.nombreAbsents).toBe(999999998);
  });

  /* Integració final 261004: abans RegExp.test() convertia el prefix en text,
     la comparació estricta amb els usats no en trobava cap i es proposava un
     número ja emés. */
  test('el prefix ha de ser un text: una llista o un String objecte no proposen mai un número repetit', () => {
    const usats = ['A2026-0001', 'A2026-0002'];
    for (const prefix of [['A'], new String('A'), { toString: () => 'A' }]) {
      expect(() => seguentNumSerie(usats, { prefix, any: 2026 }), String(prefix)).toThrow(expect.objectContaining({ codi: 'SERIE_INVALIDA' }));
      expect(() => numSerie({ prefix, any: 2026, numero: 1 }), String(prefix)).toThrow(expect.objectContaining({ codi: 'SERIE_INVALIDA' }));
    }
    // Ni passen la guarda del llegat amb una sèrie que s'hi confondria.
    expect(() => comprovaEmissio({ prefix: ['F'], any: 2026 }, { llegat: [{ prefix: 'F', any: 2026 }] }))
      .toThrow(expect.objectContaining({ codi: 'SERIE_INVALIDA' }));
    expect(seguentNumSerie(usats, A2026)).toBe('A2026-0003');
  });

  test('cal la llista de números', () => {
    expect(() => forats(null, A2026)).toThrow(TypeError);
  });

  test('foratsDeNumeros: el mateix compte sobre números ja llegits', () => {
    expect(foratsDeNumeros([3, 1, 1])).toEqual({ absents: [2], nombreAbsents: 1, repetits: [1], ultim: 3 });
    expect(foratsDeNumeros([])).toEqual({ absents: [], nombreAbsents: 0, repetits: [], ultim: 0 });
  });
});

describe('la sèrie de l’eina externa: un llegat tancat', () => {
  test('reconeix les formes pintades i les compara compactes, sense espais ni coixinet', () => {
    for (const forma of ['F26 0001', 'F260001', `${COIXINET}F260001`, ' f26 0001 ', `${COIXINET} F26 0001`]) {
      expect(llegixNumSerieLlegat(forma), forma).toEqual({ prefix: 'F', any: 2026, numero: 1 });
    }
    expect(llegixNumSerieLlegat(`${COIXINET}F250042`)).toEqual({ prefix: 'F', any: 2025, numero: 42 });
    expect(llegixNumSerieLlegat('F23 12345')).toEqual({ prefix: 'F', any: 2023, numero: 12345 });
    expect(compacta(`${COIXINET}F26 0001`)).toBe('F260001');
    expect(compacta(7)).toBe('');
  });

  test('un número del programa no és mai del llegat, ni a l’inrevés', () => {
    for (const no of ['A2026-0001', 'F26-0001', 'F260000', 'F26001', '260001', 'FAC/2026/1', null, 7]) {
      expect(llegixNumSerieLlegat(no), String(no)).toBeNull();
    }
    expect(llegixNumSerie('F260001')).toBeNull();
    // Un número del llegat entre els usats no compta mai en una sèrie del programa.
    expect(forats(['F260001', 'F260002'], { prefix: 'F', any: 2026 }).ultim).toBe(0);
  });

  test('el programa no emet en una sèrie que es confon amb una del llegat (mateix prefix i any)', () => {
    const llegat = [{ prefix: 'F', any: 2026 }];
    expect(() => comprovaEmissio({ prefix: 'F', any: 2026 }, { llegat })).toThrow(expect.objectContaining({ codi: 'SERIE_CONFUSA' }));
    expect(() => seguentNumSerie([], { prefix: 'F', any: 2026 }, { llegat })).toThrow(/F26 de l'eina externa, que queda tancada/);
    expect(() => comprovaEmissio({ prefix: 'F', any: 2026 }, { llegat: { series: llegat } })).toThrow(expect.objectContaining({ codi: 'SERIE_CONFUSA' }));
    // La sèrie nova per defecte és la del programa, i comença per l'1.
    expect(seguentNumSerie([], { prefix: 'A', any: 2027 }, { llegat })).toBe('A2027-0001');
    // La regla és prefix i any: un altre any del mateix prefix no es confon.
    expect(seguentNumSerie([], { prefix: 'F', any: 2027 }, { llegat })).toBe('F2027-0001');
    expect(() => comprovaEmissio(A2026, { llegat: 'F' })).toThrow(TypeError);
  });

  test('un llegat mal format no s’ignora: TypeError, mai una sèrie confusa que passa sense avís', () => {
    const malFormats = [
      ['F26 0001'], // un número pintat, no una sèrie: primer passa per sembraLlegat
      [{ prefix: 'F', any: 26 }], // l'any de dues xifres
      [{ prefix: 'f', any: 2026 }], [{ prefix: ['F'], any: 2026 }], [{ prefix: 'F', any: '2026' }], [{ prefix: 'F' }],
      [null], [7],
      // Una entrada bona no tapa una de dolenta.
      [{ prefix: 'A', any: 2026 }, { prefix: 'F', any: 26 }]
    ];
    for (const llegat of malFormats) {
      expect(() => comprovaEmissio({ prefix: 'F', any: 2026 }, { llegat }), JSON.stringify(llegat)).toThrow(TypeError);
      expect(() => comprovaEmissio({ prefix: 'F', any: 2026 }, { llegat: { series: llegat } }), JSON.stringify(llegat)).toThrow(TypeError);
    }
    expect(() => seguentNumSerie([], { prefix: 'F', any: 2026 }, { llegat: ['F26 0001'] })).toThrow(/entrada 1 del llegat/);
    // Les entrades de sembraLlegat porten més camps (l'últim, els forats): són ben formades.
    expect(() => comprovaEmissio(A2026, { llegat: [{ prefix: 'F', any: 2026, ultim: 3, vistos: 3 }] })).not.toThrow();
    expect(() => comprovaEmissio(A2026, { llegat: [] })).not.toThrow();
  });

  test('la data de pas és configuració: abans del pas, el programa no emet', () => {
    const pas = { dataPas: '2027-01-01' };
    expect(() => seguentNumSerie([], A2026, { ...pas, dataExpedicio: '2026-12-31' })).toThrow(expect.objectContaining({ codi: 'ABANS_DEL_PAS' }));
    expect(seguentNumSerie([], { prefix: 'A', any: 2027 }, { ...pas, dataExpedicio: '2027-01-01' })).toBe('A2027-0001');
    expect(() => comprovaEmissio({ prefix: 'A', any: 2027 }, pas)).toThrow(/data d'expedició/);
    expect(() => comprovaEmissio({ prefix: 'A', any: 2027 }, { dataPas: '01/01/2027', dataExpedicio: '2027-01-02' })).toThrow(/data de pas/);
    // Sense data de pas decidida, no es comprova.
    expect(seguentNumSerie([], { prefix: 'A', any: 2027 })).toBe('A2027-0001');
  });
});
