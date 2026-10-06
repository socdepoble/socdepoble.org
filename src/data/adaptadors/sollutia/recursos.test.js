import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { RECURSOS } from './recursos.js';

/* ENX-13 (261006) · La mateixa fixture que valida F3 de tractor-adaptadors.
   F3 només comprova que el traductor no llance; ací es fixa la forma del DTO. */
const FIXTURE = resolve(process.cwd(), 'tests/frontissa/fixtures/sollutia/perfil.json');
const { recurs, forma } = JSON.parse(readFileSync(FIXTURE, 'utf8'));

test('el perfil de Sollutia ix com a DTO tancat: exactament id, email, name i display_name', () => {
  expect(recurs).toBe('perfil');
  const dto = RECURSOS.perfil.traductor(forma);
  expect(Object.keys(dto).sort()).toEqual(['display_name', 'email', 'id', 'name']);
  expect(dto).toEqual({ id: forma.uuid, email: forma.email, name: forma.name, display_name: forma.name });
  expect(Object.isFrozen(dto)).toBe(true);
});

test('un camp nou de Sollutia no travessa el traductor', () => {
  const dto = RECURSOS.perfil.traductor({ ...forma, secret: 'no-es-dto', _sollutia: true });
  expect(dto).not.toHaveProperty('secret');
  expect(dto).not.toHaveProperty('_sollutia');
  expect(dto).not.toHaveProperty('identitats');
  expect(dto).not.toHaveProperty('avatar');
});

test('display_name mana sobre name; id mana sobre uuid', () => {
  const dto = RECURSOS.perfil.traductor({ id: 'a', uuid: 'b', email: 'c@d.test', name: 'N', display_name: 'D' });
  expect(dto).toEqual({ id: 'a', email: 'c@d.test', name: 'D', display_name: 'D' });
});

test('una forma incompleta falla tancat', () => {
  const t = RECURSOS.perfil.traductor;
  expect(() => t(null)).toThrow('Manca payload');
  expect(() => t('perfil')).toThrow('Manca payload');
  expect(() => t({ email: 'c@d.test', name: 'N' })).toThrow('Manca id');
  expect(() => t({ id: 'a', name: 'N' })).toThrow('Manca email');
  expect(() => t({ id: 'a', email: 'c@d.test' })).toThrow('Manca display_name');
});
