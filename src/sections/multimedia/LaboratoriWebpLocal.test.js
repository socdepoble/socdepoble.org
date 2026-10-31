// @vitest-environment node
/**
 * LaboratoriWebpLocal.test.js — Gauntlet 261029 c1 (lab-webp-mateix-pes-fals):
 * la diferència de pes del Laboratori WebP porta signe. Una WebP més pesada
 * que l'original no és «mateix pes». La prova del component (el text de la
 * fitxa) és a GestorMultimediaLocal.detall.test.jsx, «laboratori WebP».
 */
import { describe, expect, test } from 'vitest';
/* Gauntlet 261029 (cicle 1) · Viu a suportGestorLocal.js: els .jsx només exporten components (Fast Refresh). */
import { comparaPesWebp } from './suportGestorLocal.js';

describe('comparaPesWebp', () => {
  test('menys, igual i més, amb el percent arredonit sobre l’original', () => {
    expect(comparaPesWebp(2000, 500)).toEqual({ tipus: 'menys', percent: 75 });
    expect(comparaPesWebp(1000, 1000)).toEqual({ tipus: 'igual', percent: 0 });
    /* La reproducció del Gauntlet: foto_festa.png (2.647 B) → WebP de 36.982 B. */
    expect(comparaPesWebp(2647, 36982)).toEqual({ tipus: 'mes', percent: 1297 });
    expect(comparaPesWebp(1000, 1500)).toEqual({ tipus: 'mes', percent: 50 });
  });

  test('una diferència que s’arredonix a 0 % és «igual» (ni «-0 %» ni «+0 %»)', () => {
    expect(comparaPesWebp(100000, 99800)).toEqual({ tipus: 'igual', percent: 0 });
    expect(comparaPesWebp(100000, 100300)).toEqual({ tipus: 'igual', percent: 0 });
    expect(comparaPesWebp(100000, 99400)).toEqual({ tipus: 'menys', percent: 1 });
  });

  test('mides no vàlides: null (cap text inventat)', () => {
    for (const [abans, despres] of [[0, 10], [-1, 10], [NaN, 10], [10, NaN], [10, -1], [undefined, 10], ['10', 5], [Infinity, 5]]) {
      expect(comparaPesWebp(abans, despres)).toBeNull();
    }
  });
});
