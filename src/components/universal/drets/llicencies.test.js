import { expect, test } from 'vitest';
import {
  AUTOR_PER_DEFECTE, LLICENCIES, MARCA_CC0, MAXIM_COPYRIGHT, MAXIM_TEXT_LLIURE,
  llicenciaDe, requereixCC0, reservatsDe, triaDe, valorDe,
} from './llicencies.js';
import { LIMITS_TEXT } from '../../../sections/profile/perfilCamps.js';

/* T39 (ordre del Mestre, 260928) · el catàleg didàctic dels drets d'autor. */

test('el límit és el del CHECK de la columna: 246 de text + 10 de marca = 256', () => {
  expect(MARCA_CC0).toBe(' · CC0 1.0');
  expect(MARCA_CC0.length).toBe(10);
  expect(MAXIM_TEXT_LLIURE).toBe(246);
  expect(MAXIM_TEXT_LLIURE + MARCA_CC0.length).toBe(MAXIM_COPYRIGHT);
  expect(MAXIM_COPYRIGHT).toBe(LIMITS_TEXT.copyright[1]);
});

test('els codis que es desen són els de sempre (les set Creative Commons del selector vell)', () => {
  const codis = LLICENCIES.map((l) => l.codi).filter(Boolean).sort();
  expect(codis).toEqual(['CC BY 4.0', 'CC BY-NC 4.0', 'CC BY-NC-ND 4.0', 'CC BY-NC-SA 4.0', 'CC BY-ND 4.0', 'CC BY-SA 4.0', 'CC0 1.0'].sort());
});

test('cada opció del catàleg porta explicació, exemple de poble i permisos amb text', () => {
  for (const l of LLICENCIES) {
    expect(l.nom, l.id).toBeTruthy();
    expect(l.explicacio, l.id).toBeTruthy();
    expect(l.exemple, l.id).toBeTruthy();
    expect(l.permisos.length, l.id).toBeGreaterThan(0);
    for (const p of l.permisos) expect(p.text, l.id).toBeTruthy();
  }
  expect(Object.isFrozen(LLICENCIES)).toBe(true);
  expect(llicenciaDe('cc-by')?.codi).toBe('CC BY 4.0');
  expect(llicenciaDe('no-existix')).toBeNull();
});

test('triaDe i valorDe fan anada i tornada per a totes les llicències amb codi', () => {
  for (const l of LLICENCIES.filter((x) => x.codi)) {
    expect(triaDe(valorDe(l.id), 'Pep')).toEqual({ id: l.id, text: '' });
  }
});

test('text lliure: la marca CC0 s’afig en desar i es lleva en llegir; el text es talla a 246', () => {
  expect(triaDe('Fotos de la Iaia · CC0 1.0', 'Pep')).toEqual({ id: 'lliure', text: 'Fotos de la Iaia' });
  expect(valorDe('lliure', { text: 'Fotos de la Iaia' })).toBe('Fotos de la Iaia · CC0 1.0');
  expect(valorDe('lliure', { text: 'a'.repeat(300) })).toBe(`${'a'.repeat(246)} · CC0 1.0`);
  expect(valorDe('lliure', { text: 'a'.repeat(300) })).toHaveLength(256);
});

test('«Tots els drets reservats» és «© autor» (o «© Sóc de Poble» sense autor)', () => {
  expect(reservatsDe('Pep')).toBe('© Pep');
  expect(reservatsDe('  ')).toBe(`© ${AUTOR_PER_DEFECTE}`);
  expect(valorDe('reservats', { autor: 'Pep' })).toBe('© Pep');
  expect(triaDe('© Pep', 'Pep')).toEqual({ id: 'reservats', text: '' });
  expect(triaDe('', 'Pep').id).toBe('reservats');
});

test('un valor desconegut preselecciona «actual», que es desa intacte', () => {
  expect(triaDe('© Sóc de Poble', 'Pep')).toEqual({ id: 'actual', text: '' });
  expect(triaDe('Drets de l’Ajuntament', 'Pep').id).toBe('actual');
  expect(valorDe('actual', { actual: 'Drets de l’Ajuntament' })).toBe('Drets de l’Ajuntament');
});

test('CC0 i el text lliure demanen l’acceptació; la resta, no', () => {
  expect(requereixCC0('cc0')).toBe(true);
  expect(requereixCC0('lliure')).toBe(true);
  expect(requereixCC0('cc-by')).toBe(false);
  expect(requereixCC0('reservats')).toBe(false);
  expect(requereixCC0('actual')).toBe(false);
});
