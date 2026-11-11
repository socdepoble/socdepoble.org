/* Torn 260930 (T1) · Els esborranys per conversa: un Map en memòria per
   clau, que un text buit esborra i que sense clau no toca. */
import { beforeEach, expect, test } from 'vitest';
import { buidaEsborranys, desaEsborrany, esborraEsborrany, llegixEsborrany } from './esborranys.js';

beforeEach(() => buidaEsborranys());

test('desa i llig per clau; les claus no es barregen', () => {
  expect(llegixEsborrany('A:f-1')).toBe('');
  desaEsborrany('A:f-1', 'Mig escrit');
  desaEsborrany('B:f-1', 'Altre àmbit');
  expect(llegixEsborrany('A:f-1')).toBe('Mig escrit');
  expect(llegixEsborrany('B:f-1')).toBe('Altre àmbit');
  expect(llegixEsborrany('A:f-2')).toBe('');
});

test('un text buit i esborraEsborrany l’obliden; buidaEsborranys ho oblida tot', () => {
  desaEsborrany('A:f-1', 'Hola');
  desaEsborrany('A:f-1', '');
  expect(llegixEsborrany('A:f-1')).toBe('');
  desaEsborrany('A:f-1', 'Hola');
  esborraEsborrany('A:f-1');
  expect(llegixEsborrany('A:f-1')).toBe('');
  desaEsborrany('A:f-1', 'Un');
  desaEsborrany('A:f-2', 'Dos');
  buidaEsborranys();
  expect([llegixEsborrany('A:f-1'), llegixEsborrany('A:f-2')]).toEqual(['', '']);
});

/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · El xat no té cap
   hidratació asíncrona que una tecla puga avançar: el magatzem és en memòria
   i la lectura és síncrona (Conversa la fa en muntar, abans del primer
   pintat). I un text només d'espais no és «buit»: només '' oblida l'entrada. */
test('AH-R17-11 · la lectura és síncrona i un text només d’espais es desa tal qual, no esborra', () => {
  desaEsborrany('A:f-1', 'Demà passe pel forn');
  expect(llegixEsborrany('A:f-1')).toBe('Demà passe pel forn');
  desaEsborrany('A:f-2', '   ');
  expect(llegixEsborrany('A:f-2')).toBe('   ');
  expect(llegixEsborrany('A:f-1')).toBe('Demà passe pel forn');
});

test('sense clau no es desa ni es llig res', () => {
  desaEsborrany(null, 'Perdut');
  desaEsborrany('', 'Perdut');
  esborraEsborrany(undefined);
  expect(llegixEsborrany(null)).toBe('');
  expect(llegixEsborrany('null')).toBe('');
  expect(llegixEsborrany('')).toBe('');
});
