// @vitest-environment node
/* Burocràcia · els avisos a 15, 7 i 2 dies, amb el dia fix que passa qui
   crida (cap rellotge real). Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaTitular } from '../../identitat/nucli/titular.js';
import { avisosDe, datesDAvis, LLINDARS, MISSATGES, nivellDe } from './avisos.js';
import { calendariObligacions } from './obligacions.js';

describe('datesDAvis i nivellDe', () => {
  test('les tres dates d’avís d’un venciment', () => {
    expect(LLINDARS).toEqual([15, 7, 2]);
    expect(datesDAvis('2026-10-20')).toEqual([{ dies: 15, data: '2026-10-05' }, { dies: 7, data: '2026-10-13' }, { dies: 2, data: '2026-10-18' }]);
    expect(datesDAvis('2026-03-01', { llindars: [2, 7] })).toEqual([{ dies: 7, data: '2026-02-22' }, { dies: 2, data: '2026-02-27' }]);
    expect(() => datesDAvis('2026-02-30')).toThrow(/aaaa-mm-dd/);
  });

  test.each([
    [16, null], [15, { nivell: 'avis', llindar: 15 }], [8, { nivell: 'avis', llindar: 15 }], [7, { nivell: 'proper', llindar: 7 }],
    [3, { nivell: 'proper', llindar: 7 }], [2, { nivell: 'urgent', llindar: 2 }], [1, { nivell: 'urgent', llindar: 2 }],
    [0, { nivell: 'hui', llindar: 0 }], [-1, { nivell: 'vencut', llindar: null }]
  ])('a %i dies, %o', (dies, esperat) => {
    expect(nivellDe(dies)).toEqual(esperat);
  });

  test('amb un sol llindar, tot el que el creua és urgent', () => {
    expect(nivellDe(5, { llindars: [10] })).toEqual({ nivell: 'urgent', llindar: 10 });
  });

  test('els llindars es validen', () => {
    expect(() => nivellDe(5, { llindars: [] })).toThrow(RangeError);
    expect(() => nivellDe(5, { llindars: [0] })).toThrow(RangeError);
    expect(() => nivellDe(1.5)).toThrow(TypeError);
  });
});

describe('avisosDe', () => {
  const elements = [
    { id: 'prova_a', venciment: '2026-10-20', presenta: 'gestoria', categoria: 'fiscal' },
    { id: 'prova_b', venciment: '2026-10-30', presenta: 'titular', categoria: 'cotitzacio' },
    { id: 'prova_c', venciment: '2026-10-07', presenta: 'titular' },
    { id: 'prova_d', venciment: null, pendent: 'Falten dades.' },
    { id: 'prova_e', venciment: '2026-10-06', complit: true },
    { id: 'prova_f', venciment: '2026-10-01', presenta: 'gestoria' },
    { id: 'prova_g', venciment: '2026-09-01' },
    { id: 'prova_h', venciment: '2026-10-05', presenta: 'titular' }
  ];

  test('del més urgent al menys; sense pendents, complits ni vençuts antics', () => {
    const avisos = avisosDe(elements, '2026-10-05');
    expect(avisos.map((a) => [a.id, a.diesRestants, a.nivell])).toEqual([
      ['prova_f', -4, 'vencut'], ['prova_h', 0, 'hui'], ['prova_c', 2, 'urgent'], ['prova_a', 15, 'avis']
    ]);
    expect(Object.isFrozen(avisos[0])).toBe(true);
  });

  test('el missatge diu «el teu termini» o demana confirmar-ho amb la gestoria; mai «t’ho presentem»', () => {
    const avisos = Object.fromEntries(avisosDe(elements, '2026-10-05').map((a) => [a.id, a]));
    expect(avisos.prova_a).toMatchObject({ presenta: 'gestoria', missatge: MISSATGES.gestoria, categoria: 'fiscal', venciment: '2026-10-20', llindar: 15 });
    expect(avisos.prova_c).toMatchObject({ presenta: 'titular', missatge: 'El teu termini.', categoria: 'administratiu' });
    expect(avisos.prova_f.missatge).toBe(MISSATGES.vencut);
    expect(Object.values(MISSATGES).join(' ')).not.toMatch(/presentem/);
  });

  test('els vençuts s’avisen 7 dies; amb null, sempre', () => {
    expect(avisosDe(elements, '2026-10-05', { diesVencuts: null }).map((a) => a.id)).toContain('prova_g');
    expect(avisosDe(elements, '2026-10-16', { diesVencuts: 0 }).map((a) => [a.id, a.nivell])).toEqual([['prova_a', 'proper'], ['prova_b', 'avis']]);
  });

  test('entrades que no valen', () => {
    expect(() => avisosDe(elements, '05/10/2026')).toThrow(/aaaa-mm-dd/);
    expect(() => avisosDe('no', '2026-10-05')).toThrow(TypeError);
    expect(() => avisosDe([{ id: 'prova_x', venciment: '2026-13-01' }], '2026-10-05')).toThrow(/prova_x no és una data/);
    expect(() => avisosDe(elements, '2026-10-05', { diesVencuts: -1 })).toThrow(RangeError);
  });

  test('amb el calendari d’obligacions: el 3T del 303 i del 130, quinze dies abans', () => {
    const titular = creaTitular({ id: 'tit_prova_activitat', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat de prova', persona: 'tit_prova_llar' });
    const { ocurrencies } = calendariObligacions(2026, { titular, regimIva: 'general', estimacioIrpf: 'directa', retencio70: false, intracomunitari: false, reta: true });
    const avisos = avisosDe(ocurrencies, '2026-10-05');
    expect(avisos.map((a) => [a.id, a.nivell, a.presenta])).toEqual([
      ['tgss-reta:2026:09', 'vencut', 'titular'], ['aeat-130:2026:3T', 'avis', 'gestoria'], ['aeat-303:2026:3T', 'avis', 'gestoria']
    ]);
  });
});
