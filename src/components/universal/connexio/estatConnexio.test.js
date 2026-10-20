/**
 * T7 (261001) · estatConnexio: l'estat de connexió amb el node, pur. Només
 * el mode remot amb l'última càrrega 'ready' i el dispositiu en línia diu
 * «connectat»; en el dubte, mai verd.
 */
import { expect, test } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { ESTATS_CONNEXIO, estatDeConnexio, estatValid, etiquetaDeConnexio } from './estatConnexio.js';
import { createTranslator } from '../../../config/i18n';

test.each([
  [{ modeRemot: true, status: 'ready', enLinia: true }, 'connectat'],
  [{ modeRemot: true, status: 'loading', enLinia: true }, 'connectant'],
  [{ modeRemot: true, status: undefined, enLinia: true }, 'connectant'],
  [{ modeRemot: true, status: 'error', enLinia: true }, 'desconnectat'],
  [{ modeRemot: true, status: 'ready', enLinia: false }, 'desconnectat'],
  [{ modeRemot: true, status: 'loading', enLinia: false }, 'desconnectat'],
  [{ modeRemot: false, status: 'ready', enLinia: true }, 'desconnectat'],
  [{ modeRemot: false, status: 'loading', enLinia: true }, 'desconnectat']
])('estatDeConnexio(%o) → %s', (entrada, esperat) => {
  expect(estatDeConnexio(entrada)).toBe(esperat);
});

test('sense dades no es diu mai «connectat»', () => {
  expect(estatDeConnexio()).toBe('desconnectat');
  expect(estatDeConnexio({ status: 'ready' })).toBe('desconnectat');
  // enLinia sense valor no és «fora de línia»: només un fals explícit ho és.
  expect(estatDeConnexio({ modeRemot: true, status: 'ready' })).toBe('connectat');
});

test('estatValid: els tres estats passen; la resta és «desconnectat»', () => {
  expect(ESTATS_CONNEXIO).toEqual(['connectat', 'connectant', 'desconnectat']);
  for (const estat of ESTATS_CONNEXIO) expect(estatValid(estat)).toBe(estat);
  for (const dolent of [undefined, null, '', 'verd', 'Connectat', 1]) expect(estatValid(dolent)).toBe('desconnectat');
});

test('etiquetaDeConnexio: el text de cada estat, traduït, i la reserva valenciana sense traductor', () => {
  const ca = createTranslator('ca');
  expect(ESTATS_CONNEXIO.map((estat) => etiquetaDeConnexio(ca, estat))).toEqual(['Connexió activa', 'Connectant…', 'Sense connexió']);
  const en = createTranslator('en');
  expect(ESTATS_CONNEXIO.map((estat) => etiquetaDeConnexio(en, estat))).toEqual(['Connection active', 'Connecting…', 'No connection']);
  expect(etiquetaDeConnexio(undefined, 'connectat')).toBe('Connexió activa');
  expect(etiquetaDeConnexio(null, 'inventat')).toBe('Sense connexió');
});
