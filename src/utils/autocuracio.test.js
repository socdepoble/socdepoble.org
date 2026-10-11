/* Onada 12 (261011; ordres 261011_0130, punt 7) · El registre local de les
   autoreparacions: tipus tancats, anell de 20, comptador per clau i cap text
   llarg. I llistaDe, la tolerància de les llistes que venen de fora. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { TIPUS_INCIDENT, _reiniciaAutocuracio, incidents, llistaDe, registraIncident } from './autocuracio.js';

let avis;
beforeEach(() => { _reiniciaAutocuracio(); avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { avis.mockRestore(); });

test('registraIncident compta per clau i torna les vegades; el més recent va primer', () => {
  expect(registraIncident('panell', 'llista', 'fallback')).toBe(1);
  expect(registraIncident('panell', 'llista', 'fallback')).toBe(2);
  expect(registraIncident('ruta', 'mur', 'fallback')).toBe(1);
  expect(incidents().map(({ tipus, on, accio, vegades }) => [tipus, on, accio, vegades])).toEqual([
    ['ruta', 'mur', 'fallback', 1], ['panell', 'llista', 'fallback', 2], ['panell', 'llista', 'fallback', 1]
  ]);
  expect(Number.isNaN(Date.parse(incidents()[0].moment))).toBe(false);
});

test('un tipus de fora de la llista tancada no es registra', () => {
  expect(TIPUS_INCIDENT).toEqual(['panell', 'ruta', 'tros', 'dades', 'arrencada']);
  for (const tipus of ['error', '', undefined, null, 'constructor']) expect(registraIncident(tipus, 'x', 'y')).toBe(0);
  expect(incidents()).toEqual([]);
});

test('l’anell guarda 20 entrades, les etiquetes es tallen i incidents() torna còpies', () => {
  for (let i = 0; i < 25; i++) registraIncident('dades', 'towns', 'llista-buida');
  expect(incidents()).toHaveLength(20);
  expect(incidents()[0].vegades).toBe(25);
  registraIncident('ruta', 'x'.repeat(200), 'fallback');
  expect(incidents()[0].on).toHaveLength(40);
  incidents()[0].on = 'mutat';
  expect(incidents()[0].on).toBe('x'.repeat(40));
});

test('el mapa de claus no creix sense límit: de la clau 51 endavant no s’anota res', () => {
  for (let i = 0; i < 50; i++) expect(registraIncident('ruta', `seccio-${i}`, 'fallback')).toBe(1);
  expect(registraIncident('ruta', 'una-altra', 'fallback')).toBe(0);
  // Una clau ja coneguda es continua comptant.
  expect(registraIncident('ruta', 'seccio-0', 'fallback')).toBe(2);
});

test('una etiqueta que no es pot passar a text no fa petar el registre (es crida des de componentDidCatch)', () => {
  expect(() => registraIncident('panell', Object.create(null), 'fallback')).not.toThrow();
  expect(incidents()[0]).toMatchObject({ tipus: 'panell', on: '', accio: 'fallback' });
});

test('llistaDe: una llista torna intacta (la mateixa referència) i no anota res', () => {
  const pobles = [{ id: 'sella' }];
  expect(llistaDe(pobles, 'towns')).toBe(pobles);
  expect(llistaDe([], 'towns')).toEqual([]);
  expect(incidents()).toEqual([]);
  expect(avis).not.toHaveBeenCalled();
});

test('llistaDe: un valor absent és buit sense incident; un objecte o un text, buit amb un incident i un sol avís', () => {
  for (const absent of [null, undefined, 0, '', false]) expect(llistaDe(absent, 'towns')).toEqual([]);
  expect(incidents()).toEqual([]);
  expect(llistaDe({ id: 'sella' }, 'towns')).toEqual([]);
  expect(llistaDe('sella', 'towns')).toEqual([]);
  expect(llistaDe({ id: 'post' }, 'feedPosts')).toEqual([]);
  expect(incidents().map(({ tipus, on, accio, vegades }) => [tipus, on, accio, vegades])).toEqual([
    ['dades', 'feedPosts', 'llista-buida', 1], ['dades', 'towns', 'llista-buida', 2], ['dades', 'towns', 'llista-buida', 1]
  ]);
  // Un avís per clau, no un per càrrega; i mai el contingut del valor.
  expect(avis).toHaveBeenCalledTimes(2);
  expect(avis.mock.calls.flat().join(' ')).not.toContain('sella');
});
