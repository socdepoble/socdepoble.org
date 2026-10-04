// @vitest-environment node
/* El llegat: l'historial de l'eina externa entra fora de la cadena i només en
   sembra l'auditoria i les sèries tancades. Números sintètics. El coixinet de
   les formes pintades va a part perquè la porta de qualitat no hi veja un color. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ESQUEMA_LLEGAT, sembraLlegat } from './llegat.js';
import { validaRegistre } from './registre/validacio.js';
import { comprovaEmissio, seguentNumSerie } from './serie.js';

const COIXINET = '#';

describe('sembra el llegat', () => {
  test('per sèrie i any: l’últim número, els vistos, els absents i els repetits', () => {
    const llegat = sembraLlegat([
      'F23 0001', 'F230002', `${COIXINET}F230003`,
      'F25 0001', 'F25 0002', 'F25 0004', 'F25 0004',
      { num: 'F26 0001' }, { num: `${COIXINET}F260002` },
      'Factura 7', '', null, { altre: 1 }
    ]);
    expect(llegat.esquema).toBe(ESQUEMA_LLEGAT);
    expect(llegat.series).toEqual([
      { prefix: 'F', any: 2023, vistos: 3, ultim: 3, absents: [], nombreAbsents: 0, repetits: [] },
      { prefix: 'F', any: 2025, vistos: 3, ultim: 4, absents: [3], nombreAbsents: 1, repetits: [4] },
      { prefix: 'F', any: 2026, vistos: 2, ultim: 2, absents: [], nombreAbsents: 0, repetits: [] }
    ]);
    expect(llegat.noReconeguts).toEqual(['Factura 7', '', '', '']);
    expect(Object.isFrozen(llegat.series[1].absents)).toBe(true);
  });

  test('les sèries, ordenades per prefix i any', () => {
    expect(sembraLlegat(['G26 0001', 'F26 0001', 'F24 0001']).series.map((s) => `${s.prefix}${s.any}`)).toEqual(['F2024', 'F2026', 'G2026']);
  });

  test('cal una llista', () => {
    expect(() => sembraLlegat('F26 0001')).toThrow(TypeError);
    expect(sembraLlegat([])).toEqual({ esquema: ESQUEMA_LLEGAT, series: [], noReconeguts: [] });
  });
});

describe('fora de la cadena', () => {
  test('no és mai una alta: ni empremta, ni encadenament, ni registre', () => {
    const llegat = sembraLlegat(['F26 0001']);
    expect(Object.keys(llegat).sort()).toEqual(['esquema', 'noReconeguts', 'series']);
    expect(JSON.stringify(llegat)).not.toMatch(/empremta|tipusRegistre|encadenament|dataHoraHus/);
    expect(validaRegistre(llegat).length).toBeGreaterThan(0);
    expect(validaRegistre(llegat.series[0]).length).toBeGreaterThan(0);
    const font = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/facturacio/llegat.js'), 'utf8');
    expect(font).not.toMatch(/from '\.\/registre\//);
  });

  test('tanca les seues sèries: el programa obri la nova i no continua mai la del llegat', () => {
    const llegat = sembraLlegat(['F26 0001', 'F26 0002', 'F26 0003']);
    expect(() => seguentNumSerie(['F260003'], { prefix: 'F', any: 2026 }, { llegat })).toThrow(expect.objectContaining({ codi: 'SERIE_CONFUSA' }));
    // La sèrie nova del programa comença per l'1: el llegat no hi compta.
    expect(seguentNumSerie(['F260003'], { prefix: 'A', any: 2026 }, { llegat })).toBe('A2026-0001');
    expect(() => comprovaEmissio({ prefix: 'A', any: 2026 }, { llegat })).not.toThrow();
  });
});
