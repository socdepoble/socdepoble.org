import { expect, test } from 'vitest';
import { CODI_BACKEND_INABASTABLE, CODI_ENTRADA, ambCodi, esBackendInabastable } from './errorsBackend.js';

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
