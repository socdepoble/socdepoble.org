/**
 * ENX-16 (261006) · L'esquema absent es llig pel codi neutral del port, no pel
 * text del proveïdor. La regex de PostgREST queda de reserva: amb Supabase el
 * text pintat és el mateix d'abans.
 */
import { expect, test } from 'vitest';
import { CODI_BACKEND_INABASTABLE, CODI_ENTRADA, CODI_ESQUEMA_ABSENT, CODI_MITJANS } from '../../data/errorsBackend.js';
import { missatgeDeLError } from './abastConnexio.js';

const AVIS = 'El servidor d’este poble encara no admet connexions: falta aplicar-hi la migració de l’origen de les notes. La connexió no s’ha fet.';

test('el codi és neutral i no repetix cap altre del vocabulari', () => {
  expect(CODI_ESQUEMA_ABSENT).toBe('esquema-absent');
  const altres = [...Object.values(CODI_ENTRADA), ...Object.values(CODI_MITJANS), CODI_BACKEND_INABASTABLE, 'sense-capacitat'];
  expect(altres).not.toContain(CODI_ESQUEMA_ABSENT);
});

test('amb error.codi esquema-absent, el mateix avís sense mirar el text', () => {
  expect(missatgeDeLError(Object.assign(new Error('Sollutia 422'), { codi: CODI_ESQUEMA_ABSENT }))).toBe(AVIS);
  expect(missatgeDeLError({ codi: CODI_ESQUEMA_ABSENT })).toBe(AVIS);
});

test('la reserva de PostgREST continua donant el mateix text', () => {
  const cru = new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'origen\' column of \'notes\' in the schema cache"}');
  expect(missatgeDeLError(cru)).toBe(AVIS);
  expect(missatgeDeLError(new Error('column "origen" does not exist (42703)'))).toBe(AVIS);
});

test('un altre codi o cap codi no canvia res', () => {
  expect(missatgeDeLError(Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable' }))).toBe('Error de xarxa');
  expect(missatgeDeLError(Object.assign(new Error('x'), { code: CODI_ESQUEMA_ABSENT }))).toBe('x');
  expect(missatgeDeLError(null)).toBe('No s’ha pogut connectar. Torna-ho a provar.');
});
