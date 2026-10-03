/* Revisió de MD (261003) · On comença el mestre-detall en estret i la memòria
   del nivell per mòdul (nivellMestreDetall.js). La capa efímera és el
   sessionStorage de jsdom: cada prova comença com una pestanya nova. */
import { beforeEach, describe, expect, test } from 'vitest';
import { entradaMestreDetall, nivellRecordat, recordaNivell } from './nivellMestreDetall.js';
import { STORAGE_PREFIX } from '../../../config/storage.js';

beforeEach(() => sessionStorage.clear());

describe('la forma curta, sense memòria (com abans)', () => {
  test.each([
    ['navegacio', 'left'],
    [true, 'left'],
    ['detall', null]
  ])('%s → %s', (prop, esperat) => {
    expect(entradaMestreDetall(prop)).toBe(esperat);
  });
});

describe('{ clau, element }: la secció diu qui és i l’element de la URL crua', () => {
  test('sense element, la navegació, encara que es recorde un altre nivell', () => {
    recordaNivell('notes', null, null);
    expect(entradaMestreDetall({ clau: 'notes', element: null })).toBe('left');
    expect(entradaMestreDetall({ clau: 'notes', element: '' })).toBe('left');
    expect(entradaMestreDetall({ clau: 'notes' })).toBe('left');
  });

  test('amb un element i cap record (una pestanya nova, un enllaç compartit), el detall', () => {
    expect(entradaMestreDetall({ clau: 'notes', element: 'n7' })).toBeNull();
  });

  test.each(['left', 'middle', null])('amb el mateix element de quan es va deixar el mòdul, el nivell on era (%s)', (nivell) => {
    recordaNivell('notes', 'n1', nivell);
    expect(entradaMestreDetall({ clau: 'notes', element: 'n1' })).toBe(nivell);
  });

  test('amb un altre element (la Cerca, el Xat), el detall', () => {
    recordaNivell('notes', 'n1', 'left');
    expect(entradaMestreDetall({ clau: 'notes', element: 'n2' })).toBeNull();
  });

  test('cada mòdul té la seua entrada: la Wiki no trepitja el Bloc', () => {
    recordaNivell('notes', 'n1', 'left');
    recordaNivell('wiki', 'n1', 'middle');
    expect(entradaMestreDetall({ clau: 'notes', element: 'n1' })).toBe('left');
    expect(entradaMestreDetall({ clau: 'wiki', element: 'n1' })).toBe('middle');
  });

  test('els ids es comparen com a text', () => {
    recordaNivell('admin', 7, 'middle');
    expect(nivellRecordat('admin', '7')).toBe('middle');
  });
});

describe('la capa efímera: res que no siga seu', () => {
  test('una clau invàlida ni es desa ni es llig', () => {
    expect(recordaNivell('Notes Personals', 'n1', 'left')).toBe(false);
    expect(recordaNivell('', 'n1', 'left')).toBe(false);
    expect(nivellRecordat('../notes', 'n1')).toBeUndefined();
    expect(sessionStorage.length).toBe(0);
  });

  test('un nivell que no existix no es desa', () => {
    expect(recordaNivell('notes', 'n1', 'right')).toBe(false);
    expect(recordaNivell('notes', 'n1', undefined)).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  test('un valor corrupte o d’una altra forma s’ignora: l’element torna a manar', () => {
    sessionStorage.setItem(`${STORAGE_PREFIX}mestre-detall:notes`, '{trencat');
    expect(entradaMestreDetall({ clau: 'notes', element: 'n1' })).toBeNull();
    sessionStorage.setItem(`${STORAGE_PREFIX}mestre-detall:notes`, JSON.stringify({ element: 'n1', nivell: 'right' }));
    expect(entradaMestreDetall({ clau: 'notes', element: 'n1' })).toBeNull();
  });

  test('una sola entrada per mòdul, amb el prefix de la capa', () => {
    recordaNivell('notes', 'n1', 'left');
    recordaNivell('notes', 'n2', 'middle');
    expect(sessionStorage.length).toBe(1);
    expect(JSON.parse(sessionStorage.getItem(`${STORAGE_PREFIX}mestre-detall:notes`))).toEqual({ element: 'n2', nivell: 'middle' });
  });
});
