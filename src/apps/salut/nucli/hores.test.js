// @vitest-environment node
/* Salut · hores i jornades: la micció de les 03:00 és de la jornada d'abans,
   les nits creuen la mitjanit i els dos dies de canvi d'hora fan jornades de
   23 i 25 hores amb intervals exactes gràcies a l'ofset. */
import { describe, expect, test } from 'vitest';
import {
  assignaJornades, dataCurta, dataLocalDe, diesEntre, dillunsDe, esData, esMoment, esOfset, etiquetaData, etiquetaDataLlarga,
  instantDe, jornadaDe, jornadesAmbApunts, limitsJornada, minutsEntre, momentLocal, periodeDe, sumaDies
} from './hores.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}, ofsetMin = 120) => ({ id: uuid(), tipus, moment, ofsetMin, ...camps });
const PERSONA = { horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00' };

describe('formes', () => {
  test('dates, moments i ofsets', () => {
    expect(esData('2026-10-02')).toBe(true);
    expect(esData('2026-02-29')).toBe(false);
    expect(esData('2028-02-29')).toBe(true);
    expect(esData('2026-13-01')).toBe(false);
    expect(esMoment('2026-10-02T03:10')).toBe(true);
    expect(esMoment('2026-10-02T24:00')).toBe(false);
    expect(esMoment('2026-10-02 03:10')).toBe(false);
    expect(esOfset(120)).toBe(true);
    expect(esOfset(900)).toBe(false);
    expect(esOfset(1.5)).toBe(false);
  });

  test('aritmètica de dates i etiquetes sense dependre d’ICU', () => {
    expect(sumaDies('2026-02-28', 1)).toBe('2026-03-01');
    expect(sumaDies('2026-01-01', -1)).toBe('2025-12-31');
    expect(diesEntre('2026-09-30', '2026-10-03')).toBe(3);
    expect(dillunsDe('2026-10-02')).toBe('2026-09-28');
    expect(dillunsDe('2026-09-28')).toBe('2026-09-28');
    expect(dataCurta('2026-10-02')).toBe('02/10/2026');
    expect(etiquetaData('2026-10-02')).toBe('dv. 02/10/2026');
    expect(etiquetaDataLlarga('2026-10-02')).toBe('divendres, 2 d’octubre');
  });

  test('dataLocalDe: el dia de casa d’un instant desat en UTC (SAL-07)', () => {
    /* Les 01:30 del 6 al rellotge de casa: en UTC encara pot ser el 5. */
    expect(dataLocalDe(new Date(2026, 9, 6, 1, 30).toISOString())).toBe('2026-10-06');
    expect(dataLocalDe(new Date(2026, 9, 5, 23, 59).toISOString())).toBe('2026-10-05');
  });

  test('momentLocal llig el rellotge i l’ofset d’una Date', () => {
    const ara = new Date(2026, 9, 2, 7, 5);
    const { moment, ofsetMin } = momentLocal(ara);
    expect(moment).toBe('2026-10-02T07:05');
    expect(ofsetMin).toBe(-ara.getTimezoneOffset());
  });
});

describe('jornades', () => {
  test('una micció a les 03:10 és de la jornada d’abans', () => {
    expect(jornadaDe('2026-10-03T03:10', '07:00')).toBe('2026-10-02');
    expect(jornadaDe('2026-10-03T07:00', '07:00')).toBe('2026-10-03');
    expect(jornadaDe('2026-10-03T06:59')).toBe('2026-10-02');
  });

  test('l’alçada apuntada mana sobre l’habitual, i l’apunt d’alçar-se és de la seua data', () => {
    const apunts = assignaJornades([
      a('son', '2026-10-03T06:30', { event: 'alcar-se' }),
      a('miccio', '2026-10-03T06:45', { mesura: 'no-mesurat' }),
      a('miccio', '2026-10-03T06:10', { mesura: 'no-mesurat' }),
      a('miccio', '2026-10-04T06:45', { mesura: 'no-mesurat' })
    ], PERSONA);
    expect(apunts.map((x) => x.jornada)).toEqual(['2026-10-03', '2026-10-03', '2026-10-02', '2026-10-03']);
    expect(jornadesAmbApunts(apunts)).toEqual(['2026-10-03', '2026-10-02']);
  });

  test('una nit que creua la mitjanit és de la jornada en què s’adorm', () => {
    const apunts = assignaJornades([
      a('son', '2026-10-05T07:00', { event: 'alcar-se' }),
      a('miccio', '2026-10-05T22:15', { mesura: 'no-mesurat' }),
      a('son', '2026-10-05T23:30', { event: 'adormir-se' }),
      a('miccio', '2026-10-06T01:00', { mesura: 'no-mesurat' }),
      a('miccio', '2026-10-06T04:00', { mesura: 'no-mesurat' }),
      a('son', '2026-10-06T07:30', { event: 'alcar-se' })
    ], PERSONA);
    const limits = limitsJornada('2026-10-05', apunts, PERSONA);
    expect(limits.estimat).toBe(false);
    expect(limits.adormir.moment).toBe('2026-10-05T23:30');
    expect(limits.alcarSeguent.moment).toBe('2026-10-06T07:30');
    const miccions = apunts.filter((x) => x.tipus === 'miccio');
    expect(miccions.map((x) => x.jornada)).toEqual(['2026-10-05', '2026-10-05', '2026-10-05']);
    expect(miccions.map((x) => periodeDe(x, limits))).toEqual(['dia', 'nit', 'nit']);
  });

  test('tornar-se a adormir després d’un despertar no torna a començar la nit (SAL-01)', () => {
    const apunts = assignaJornades([
      a('son', '2026-10-05T07:00', { event: 'alcar-se' }),
      a('son', '2026-10-05T22:00', { event: 'gitar-se' }),
      a('son', '2026-10-05T22:30', { event: 'adormir-se' }),
      a('miccio', '2026-10-06T02:00', { mesura: 'no-mesurat' }),
      a('son', '2026-10-06T02:00', { event: 'despertar' }),
      a('son', '2026-10-06T02:10', { event: 'gitar-se' }),
      a('son', '2026-10-06T02:20', { event: 'adormir-se' }),
      a('son', '2026-10-06T07:00', { event: 'alcar-se' })
    ], PERSONA);
    const limits = limitsJornada('2026-10-05', apunts, PERSONA);
    expect(limits.gitar.moment).toBe('2026-10-05T22:00');
    expect(limits.adormir.moment).toBe('2026-10-05T22:30');
    expect(periodeDe(apunts.find((x) => x.tipus === 'miccio'), limits)).toBe('nit');
  });

  test('si el despertar és l’únic apunt de la nit, l’inici és l’habitual (estimat)', () => {
    const apunts = assignaJornades([
      a('son', '2026-10-05T07:00', { event: 'alcar-se' }),
      a('son', '2026-10-06T02:00', { event: 'despertar' }),
      a('son', '2026-10-06T02:20', { event: 'adormir-se' })
    ], PERSONA);
    const limits = limitsJornada('2026-10-05', apunts, PERSONA, { ofsetDe: () => 120 });
    expect(limits.gitar).toBeNull();
    expect(limits.adormir).toMatchObject({ moment: '2026-10-05T22:00', estimat: true });
  });

  test('sense apunts de son, els límits són les hores habituals i es marquen estimats', () => {
    const apunts = assignaJornades([a('miccio', '2026-10-05T12:00', { mesura: 'no-mesurat' })], { horaAlcarHabitual: '08:00', horaGitarHabitual: '00:30' });
    const limits = limitsJornada('2026-10-05', apunts, { horaAlcarHabitual: '08:00', horaGitarHabitual: '00:30' }, { ofsetDe: () => 120 });
    expect(limits.estimat).toBe(true);
    expect(limits.alcar.moment).toBe('2026-10-05T08:00');
    /* Gitar-se a les 00:30 és ja l'endemà de calendari. */
    expect(limits.adormir.moment).toBe('2026-10-06T00:30');
    expect(limits.duradaMin).toBe(24 * 60);
  });
});

describe('canvi d’hora', () => {
  test('primavera: la jornada dura 23 hores i l’interval de la nit és d’una hora real', () => {
    const apunts = assignaJornades([
      a('son', '2026-03-28T07:00', { event: 'alcar-se' }, 60),
      a('miccio', '2026-03-29T01:30', { mesura: 'no-mesurat' }, 60),
      a('miccio', '2026-03-29T03:30', { mesura: 'no-mesurat' }, 120),
      a('son', '2026-03-29T07:00', { event: 'alcar-se' }, 120)
    ], PERSONA);
    const limits = limitsJornada('2026-03-28', apunts, PERSONA);
    expect(limits.duradaMin).toBe(23 * 60);
    const [primera, segona] = apunts.filter((x) => x.tipus === 'miccio');
    expect(minutsEntre(primera, segona)).toBe(60);
    expect(primera.jornada).toBe('2026-03-28');
    expect(segona.jornada).toBe('2026-03-28');
  });

  test('tardor: la jornada dura 25 hores i les dos 02:30 són a una hora de distància', () => {
    const apunts = assignaJornades([
      a('son', '2026-10-24T07:00', { event: 'alcar-se' }, 120),
      a('miccio', '2026-10-25T02:30', { mesura: 'no-mesurat' }, 120),
      a('miccio', '2026-10-25T02:30', { mesura: 'no-mesurat' }, 60),
      a('son', '2026-10-25T07:00', { event: 'alcar-se' }, 60)
    ], PERSONA);
    const limits = limitsJornada('2026-10-24', apunts, PERSONA);
    expect(limits.duradaMin).toBe(25 * 60);
    const [primera, segona] = apunts.filter((x) => x.tipus === 'miccio');
    expect(minutsEntre(primera, segona)).toBe(60);
    expect(instantDe(segona.moment, segona.ofsetMin) - instantDe(primera.moment, primera.ofsetMin)).toBe(3600000);
  });
});
