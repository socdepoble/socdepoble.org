/**
 * Ordre del Mestre (261007, prompt 261007_1628, peça C) · La preferència
 * «Mostrar al Panell de Control» té una sola regla i un sol id per al Perfil i
 * per al Panell:
 *  · estaAlPanell: la regla de ControlSection (utilitatsAmagades). Una
 *    utilitat només falta amb un false explícit;
 *  · les preferències desades abans amb l'id de l'aplicació ('metriques',
 *    'lector-rss') es lligen com les de l'id del Panell ('consola', 'rss')
 *    mentre este no en tinga cap de pròpia (ALIES_DEL_PANELL). No s'esborra res.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { STORAGE_PREFIX } from '../../config/storage.js';
import {
  CLAU_UTILITATS_ACTIVES, CLAU_UTILITATS_LLEGAT, desaUtilitatActiva, estaAlPanell, llegixUtilitatsActives, subscriuUtilitatsActives
} from './utilitatsActives.js';

const CLAU_PROPIA = STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES;
const neteja = () => {
  localStorage.removeItem(CLAU_PROPIA);
  localStorage.removeItem(CLAU_UTILITATS_LLEGAT);
};
beforeEach(neteja);
afterEach(neteja);

describe('estaAlPanell · la regla del Panell', () => {
  test('sense preferència, malmesa o amb qualsevol valor que no siga false, hi és', () => {
    expect(estaAlPanell('rss')).toBe(true);
    for (const valor of ['no és JSON', 'null', '[]', '5', JSON.stringify({ rss: 0 }), JSON.stringify({ rss: 'false' }), JSON.stringify({ rss: null })]) {
      localStorage.setItem(CLAU_UTILITATS_LLEGAT, valor);
      expect(estaAlPanell('rss'), valor).toBe(true);
    }
  });

  test('només un false explícit la lleva', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ rss: false, consola: true }));
    expect(estaAlPanell('rss')).toBe(false);
    expect(estaAlPanell('consola')).toBe(true);
  });
});

describe('les preferències desades amb l’id vell', () => {
  test.each([
    ['la clau de llegat', CLAU_UTILITATS_LLEGAT],
    ['la clau amb prefix', CLAU_PROPIA]
  ])('a %s, «metriques» i «lector-rss» valen per a «consola» i «rss»', (_que, clau) => {
    localStorage.setItem(clau, JSON.stringify({ metriques: false, 'lector-rss': false, gestoria: true }));
    expect(llegixUtilitatsActives()).toEqual({ metriques: false, 'lector-rss': false, gestoria: true, consola: false, rss: false });
    expect(estaAlPanell('consola')).toBe(false);
    expect(estaAlPanell('rss')).toBe(false);
  });

  test('si l’id del Panell ja en té una, mana la seua', () => {
    localStorage.setItem(CLAU_PROPIA, JSON.stringify({ metriques: false, consola: true }));
    expect(estaAlPanell('consola')).toBe(true);
  });

  test('desar per l’id del Panell conserva l’id vell (no s’esborra res) i el nou mana', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ 'lector-rss': false }));
    expect(desaUtilitatActiva('rss', true)).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ 'lector-rss': false, rss: true });
    expect(estaAlPanell('rss')).toBe(true);
    // La clau de llegat no es toca: només es llig.
    expect(JSON.parse(localStorage.getItem(CLAU_UTILITATS_LLEGAT))).toEqual({ 'lector-rss': false });
  });

  test('llegir no escriu res al disc', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ metriques: false }));
    llegixUtilitatsActives();
    expect(localStorage.getItem(CLAU_PROPIA)).toBeNull();
  });
});

test('desar avisa qui escolta, i deixar d’escoltar el desconnecta', () => {
  const avisos = [];
  const deixa = subscriuUtilitatsActives(() => avisos.push(estaAlPanell('consola')));
  desaUtilitatActiva('consola', false);
  deixa();
  desaUtilitatActiva('consola', true);
  expect(avisos).toEqual([false]);
});
