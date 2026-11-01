// @vitest-environment node
/* T7 · S2 (assalt 261101) · El rellotge de la caducitat de les alertes, pur:
   fins quan és vigent una alerta (caducaAl, amb el mateix límit inclusiu
   d'esVigent), quina caducitat cal esperar (properaCaducitat), quant
   (esperaFins) i com es diu la data (dataDeCaducitat, absoluta). */
import { describe, expect, test } from 'vitest';
import {
  MAX_ESPERA_MS, MIN_ESPERA_MS, OPCIONS_CADUCITAT, TEXTOS_ALERTES, VIGENCIA_ALERTA_MS,
  caducaAl, dataDeCaducitat, esInstantRepresentable, esVigent, esperaFins, properaCaducitat
} from './alertesMunicipals.js';

const ARA = Date.parse('2026-11-01T12:00:00.000Z');
const HORA = 3600 * 1000;

describe('caducaAl', () => {
  test('el moment de la targeta més 72 h; sense moment, null', () => {
    expect(VIGENCIA_ALERTA_MS).toBe(72 * HORA);
    expect(caducaAl(ARA)).toBe(ARA + 72 * HORA);
    expect(caducaAl(ARA, HORA)).toBe(ARA + HORA);
    for (const res of [null, undefined, NaN, Infinity, '2026-11-01']) expect(caducaAl(res)).toBeNull();
  });

  test('és el mateix límit que esVigent: vigent fins a caducaAl inclòs, i no el mil·lisegon següent', () => {
    const moment = ARA - 10 * HORA;
    const fi = caducaAl(moment);
    expect(esVigent(moment, fi)).toBe(true);
    expect(esVigent(moment, fi + 1)).toBe(false);
  });
});

describe('properaCaducitat', () => {
  test('la més pròxima que encara no ha passat', () => {
    const alertes = [{ caducaAl: ARA + 5 * HORA }, { caducaAl: ARA + HORA }, { caducaAl: ARA + 70 * HORA }];
    expect(properaCaducitat(alertes, ARA)).toBe(ARA + HORA);
  });

  test('la que caduca ara mateix compta (encara és vigent); la que ja ha passat, no', () => {
    expect(properaCaducitat([{ caducaAl: ARA }, { caducaAl: ARA + HORA }], ARA)).toBe(ARA);
    expect(properaCaducitat([{ caducaAl: ARA - 1 }, { caducaAl: ARA + HORA }], ARA)).toBe(ARA + HORA);
  });

  test('una alerta futura caduca pel seu moment més 72 h', () => {
    const futura = ARA + 24 * HORA;
    expect(properaCaducitat([{ caducaAl: caducaAl(futura) }], ARA)).toBe(futura + 72 * HORA);
  });

  test('sense cap caducitat vàlida, null (cap temporitzador)', () => {
    expect(properaCaducitat([], ARA)).toBeNull();
    expect(properaCaducitat([{ caducaAl: null }, { item: {} }, null], ARA)).toBeNull();
    expect(properaCaducitat(null, ARA)).toBeNull();
    expect(properaCaducitat([{ caducaAl: ARA + HORA }], NaN)).toBeNull();
  });
});

describe('esperaFins', () => {
  test('fins al mil·lisegon després de la caducitat', () => {
    expect(esperaFins(ARA + 5000, ARA)).toBe(5001);
  });

  test('mai menys d’1 s (cap bucle calent) ni més de 2^31 − 1 ms (el sostre de setTimeout)', () => {
    expect(MIN_ESPERA_MS).toBe(1000);
    expect(MAX_ESPERA_MS).toBe(2 ** 31 - 1);
    expect(esperaFins(ARA, ARA)).toBe(1000);
    expect(esperaFins(ARA - 60_000, ARA)).toBe(1000);
    expect(esperaFins(ARA + 40 * 24 * HORA, ARA)).toBe(MAX_ESPERA_MS);
  });

  test('sense quan o sense ara, null', () => {
    expect(esperaFins(null, ARA)).toBeNull();
    expect(esperaFins(ARA, undefined)).toBeNull();
    expect(esperaFins(Infinity, ARA)).toBeNull();
  });
});

describe('dataDeCaducitat (absoluta, en el locale de la interfície)', () => {
  const format = (locale, ms) => new Intl.DateTimeFormat(locale, OPCIONS_CADUCITAT).format(new Date(ms));
  const QUAN = Date.parse('2026-11-03T13:05:00.000Z');

  test('dia de la setmana, dia, mes i hora; cap any ni cap compte enrere', () => {
    expect(OPCIONS_CADUCITAT).toEqual({ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    expect(Object.isFrozen(OPCIONS_CADUCITAT)).toBe(true);
  });

  test('en ca-ES i en-GB, el mateix que Intl.DateTimeFormat', () => {
    expect(dataDeCaducitat(QUAN, 'ca-ES')).toBe(format('ca-ES', QUAN));
    expect(dataDeCaducitat(QUAN, 'en-GB')).toBe(format('en-GB', QUAN));
    expect(dataDeCaducitat(QUAN, 'en-GB')).not.toBe(dataDeCaducitat(QUAN, 'ca-ES'));
  });

  test('sense locale o amb un de no vàlid, ca-ES; sense data, buit', () => {
    expect(dataDeCaducitat(QUAN)).toBe(format('ca-ES', QUAN));
    expect(dataDeCaducitat(QUAN, null)).toBe(format('ca-ES', QUAN));
    expect(dataDeCaducitat(QUAN, 'no_és_un_locale!')).toBe(format('ca-ES', QUAN));
    expect(dataDeCaducitat(null, 'ca-ES')).toBe('');
    expect(dataDeCaducitat(NaN, 'ca-ES')).toBe('');
  });

  test('una data fora del rang de Date (una data triada absurda + 72 h) no llança: buit', () => {
    const maxim = 8.64e15;
    expect(esInstantRepresentable(maxim)).toBe(true);
    expect(esInstantRepresentable(maxim + 1)).toBe(false);
    expect(esInstantRepresentable(Infinity)).toBe(false);
    expect(() => dataDeCaducitat(maxim + 72 * HORA, 'ca-ES')).not.toThrow();
    expect(dataDeCaducitat(maxim + 72 * HORA, 'ca-ES')).toBe('');
  });

  test('el parell i18n porta el buit {data}', () => {
    expect(TEXTOS_ALERTES.vigentFins).toEqual(['section.mur.alertes.vigentFins', 'vigent fins a {data}']);
    expect(Object.isFrozen(TEXTOS_ALERTES.vigentFins)).toBe(true);
  });
});
