/**
 * Ordre del Mestre (261007, prompt 261007_1628, peça C) · La preferència
 * «Mostrar al Panell de Control» té una sola regla i un sol id per al Perfil i
 * per al Panell:
 *  · estaAlPanell: la regla de ControlSection (utilitatsAmagades). Una
 *    utilitat només falta amb un false explícit;
 *  · les preferències desades abans amb l'id de l'aplicació ('lector-rss')
 *    es lligen com les de l'id del Panell ('rss') mentre este no en tinga cap
 *    de pròpia (ALIES_DEL_PANELL). No s'esborra res.
 *
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
 * targetes de la Consola i del Cervell ixen del Panell de Control. DEROGAT
 * l'àlies 'metriques' → 'consola' (la Consola de Mètriques porta `panell:
 * null`): una preferència vella de 'metriques' ja no es copia a cap altra
 * clau, ni a «null». Les claus velles es queden al disc, sense efecte.
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
  ])('a %s, «lector-rss» val per a «rss»; «metriques» ja no val per a cap altra clau (Onada 10)', (_que, clau) => {
    localStorage.setItem(clau, JSON.stringify({ metriques: false, 'lector-rss': false, gestoria: true }));
    /* Abans (peça C), també `consola: false`: l'àlies de 'metriques', derogat. */
    expect(llegixUtilitatsActives()).toEqual({ metriques: false, 'lector-rss': false, gestoria: true, rss: false });
    expect(estaAlPanell('rss')).toBe(false);
    expect(estaAlPanell('consola')).toBe(true);
    /* Cap clau «null»: el que escriuria un àlies cap a `panell: null`. */
    expect(Object.keys(llegixUtilitatsActives())).not.toContain('null');
  });

  test('si l’id del Panell ja en té una, mana la seua', () => {
    localStorage.setItem(CLAU_PROPIA, JSON.stringify({ 'lector-rss': false, rss: true }));
    expect(estaAlPanell('rss')).toBe(true);
    expect(llegixUtilitatsActives()).toEqual({ 'lector-rss': false, rss: true });
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
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ 'lector-rss': false }));
    expect(llegixUtilitatsActives()).toEqual({ 'lector-rss': false, rss: false });
    expect(localStorage.getItem(CLAU_PROPIA)).toBeNull();
  });

  /* Onada 10 (261010; decisió del Mestre del 261010) · Les targetes de la
     Consola, el Cervell i Disseny ixen del Panell. Les preferències que algú
     ja tinga desades amb eixes claus (o amb la vella 'metriques') es queden
     on són: ni es tradueixen ni s'esborren, tampoc en desar-ne una altra. */
  test('Onada 10 · les claus de les targetes que han eixit del Panell es queden al disc, sense traduir ni esborrar', () => {
    const velles = { consola: false, cervell: false, disseny: false, metriques: false };
    localStorage.setItem(CLAU_PROPIA, JSON.stringify(velles));
    expect(llegixUtilitatsActives()).toEqual(velles);
    expect(desaUtilitatActiva('rss', false)).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ ...velles, rss: false });
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
