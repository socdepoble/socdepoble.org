import { expect, test } from 'vitest';
import {
  CODI_BACKEND_INABASTABLE, CODI_ENTRADA, CODI_PERSONALITZACIO, CODI_SEGON_FACTOR, MISSATGE_PERSONALITZACIO, MISSATGE_SEGON_FACTOR,
  ambCodi, errorDePersonalitzacio, errorDeSegonFactor, esBackendInabastable
} from './errorsBackend.js';

test('T2 · el servidor inabastable es reconeix per codi, per estat 0 o pel TypeError del navegador', () => {
  expect(esBackendInabastable(Object.assign(new Error('x'), { codi: CODI_BACKEND_INABASTABLE }))).toBe(true);
  expect(esBackendInabastable(Object.assign(new Error('x'), { code: CODI_ENTRADA.SERVIDOR_INABASTABLE }))).toBe(true);
  expect(esBackendInabastable(Object.assign(new Error('Error de xarxa'), { status: 0 }))).toBe(true);
  expect(esBackendInabastable(new TypeError('Failed to fetch'))).toBe(true);
  expect(esBackendInabastable(new TypeError('Load failed'))).toBe(true);
});

test('T2 · un error del servidor, un temps esgotat o un error de programa no ho són', () => {
  expect(esBackendInabastable(Object.assign(new Error('Supabase 500'), { status: 500 }))).toBe(false);
  expect(esBackendInabastable(Object.assign(new Error('lent'), { name: 'TimeoutError' }))).toBe(false);
  expect(esBackendInabastable(new TypeError('x is not a function'))).toBe(false);
  expect(esBackendInabastable(null)).toBe(false);
  expect(esBackendInabastable('Failed to fetch')).toBe(false);
});

test('T4 · ambCodi conserva el missatge i la causa', () => {
  const causa = new Error('arrel');
  const error = new Error('Credencials', { cause: causa });
  expect(ambCodi(error, CODI_ENTRADA.CREDENCIALS)).toBe(error);
  expect(error).toMatchObject({ code: 'credencials', message: 'Credencials', cause: causa });
  expect(ambCodi('text', CODI_ENTRADA.MODE_LOCAL)).toMatchObject({ code: 'mode-local', message: 'text' });
  expect(Object.isFrozen(CODI_ENTRADA)).toBe(true);
});

/* Correcció de la revisió T1–T4 (260930) · Una resposta del servidor sense codi
   propi també té codi neutral: la vista no n'ha de llegir el text. */
test('T4 · DESCONEGUT és el codi neutral d’una resposta del servidor sense traducció, i no és «inabastable»', () => {
  expect(CODI_ENTRADA.DESCONEGUT).toBe('desconegut');
  expect(new Set(Object.values(CODI_ENTRADA)).size).toBe(Object.keys(CODI_ENTRADA).length);
  expect(esBackendInabastable(Object.assign(new Error('x'), { code: CODI_ENTRADA.DESCONEGUT, status: 422 }))).toBe(false);
});

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin i la personalització del poble: codis neutrals amb frase. */
test('Onada 11 · CODI_SEGON_FACTOR té els nou codis, congelats, únics i cada un amb una frase en valencià', () => {
  expect(Object.values(CODI_SEGON_FACTOR)).toEqual(['codi-invalid', 'repte-caducat', 'factor-no-trobat', 'nom-repetit', 'massa-factors',
    'no-habilitat', 'sense-sessio', 'no-disponible', 'desconegut']);
  expect(Object.isFrozen(CODI_SEGON_FACTOR) && Object.isFrozen(MISSATGE_SEGON_FACTOR)).toBe(true);
  expect(new Set(Object.values(CODI_SEGON_FACTOR)).size).toBe(9);
  for (const codi of Object.values(CODI_SEGON_FACTOR)) expect(MISSATGE_SEGON_FACTOR[codi], codi).toMatch(/^[A-ZÀ-Ú].*\.$/);
});

test('Onada 11 · CODI_PERSONALITZACIO porta cal-segon-factor amb la frase del Mestre, conflicte-versio i la resta, cada un amb frase', () => {
  expect(Object.values(CODI_PERSONALITZACIO)).toEqual(['cal-segon-factor', 'conflicte-versio', 'clau-invalida', 'sense-sessio', 'no-disponible', 'desconegut']);
  expect(Object.isFrozen(CODI_PERSONALITZACIO) && Object.isFrozen(MISSATGE_PERSONALITZACIO)).toBe(true);
  expect(MISSATGE_PERSONALITZACIO['cal-segon-factor']).toBe('Cal confirmar el segon factor per a desar.');
  for (const codi of Object.values(CODI_PERSONALITZACIO)) expect(MISSATGE_PERSONALITZACIO[codi], codi).toMatch(/^[A-ZÀ-Ú].*\.$/);
});

test('Onada 11 · errorDeSegonFactor i errorDePersonalitzacio porten code, frase i causa; un codi inventat cau a desconegut', () => {
  const causa = Object.assign(new Error('Supabase 422: {"error_code":"mfa_verification_failed"}'), { status: 422 });
  expect(errorDeSegonFactor(CODI_SEGON_FACTOR.CODI_INVALID, causa)).toMatchObject({
    code: 'codi-invalid', message: MISSATGE_SEGON_FACTOR['codi-invalid'], cause: causa
  });
  expect(errorDeSegonFactor(CODI_SEGON_FACTOR.NO_DISPONIBLE)).not.toHaveProperty('cause');
  expect(errorDeSegonFactor('inventat')).toMatchObject({ code: 'desconegut', message: MISSATGE_SEGON_FACTOR.desconegut });
  expect(errorDePersonalitzacio(CODI_PERSONALITZACIO.CAL_SEGON_FACTOR)).toMatchObject({
    code: 'cal-segon-factor', message: 'Cal confirmar el segon factor per a desar.'
  });
  expect(errorDePersonalitzacio('inventat', causa)).toMatchObject({ code: 'desconegut', cause: causa });
  expect(errorDeSegonFactor(CODI_SEGON_FACTOR.DESCONEGUT)).toBeInstanceOf(Error);
});
