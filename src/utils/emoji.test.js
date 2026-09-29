import { expect, test } from 'vitest';
import { EMOTICONA_PER_DEFECTE, emojiInicial, emojiSol, emoticonaDeBarra } from './emoji.js';

/* T34 · la ploma per defecte ha de complir el mateix contracte que el camp `icon`. */
test('EMOTICONA_PER_DEFECTE: la ploma, un sol emoji vàlid', () => {
  expect(EMOTICONA_PER_DEFECTE).toBe('🪶');
  expect(emojiSol(EMOTICONA_PER_DEFECTE)).toBe(EMOTICONA_PER_DEFECTE);
  expect(emojiInicial(`${EMOTICONA_PER_DEFECTE} Nota`)).toBe(EMOTICONA_PER_DEFECTE);
});

test('emojiInicial: el primer grafema si és emoji, i prou', () => {
  expect(emojiInicial('🍅 Tomaques')).toBe('🍅');
  expect(emojiInicial('Tomaques 🍅')).toBeNull();
  expect(emojiInicial('© Sóc de Poble')).toBeNull();
  expect(emojiInicial('')).toBeNull();
  expect(emojiInicial(null)).toBeNull();
});

/* T23 · el camp `icon` d'una nota és UN emoji: text, dos emojis o res no es desen. */
test('emojiSol: un sol emoji, amb espais al voltant tolerats', () => {
  expect(emojiSol('🍅')).toBe('🍅');
  expect(emojiSol(' 🧱 ')).toBe('🧱');
  expect(emojiSol('🇪🇸')).toBe('🇪🇸');
  expect(emojiSol('👩‍🌾')).toBe('👩‍🌾');
  expect(emojiSol('🍅 Tomaques')).toBeNull();
  expect(emojiSol('🍅🧱')).toBeNull();
  expect(emojiSol('ab')).toBeNull();
  expect(emojiSol('')).toBeNull();
  expect(emojiSol(undefined)).toBeNull();
});

/* T51 (ordre del Mestre, 260928) · l'espai central de la barra taronja. En
   edició, sempre el botó (glif null = la ploma de lucide); en lectura, només
   l'emoticona triada. `icon` és el camp cru del document. */
test.each([
  ['edició sense camp', { mode: 'edicio' }, { mostra: 'boto', glif: null, triada: false }],
  ['edició amb cadena buida', { mode: 'edicio', icon: '' }, { mostra: 'boto', glif: null, triada: false }],
  ['edició amb null del servidor', { mode: 'edicio', icon: null }, { mostra: 'boto', glif: null, triada: false }],
  ['edició amb text no vàlid', { mode: 'edicio', icon: 'hola' }, { mostra: 'boto', glif: null, triada: false }],
  ['edició amb 🍅', { mode: 'edicio', icon: '🍅' }, { mostra: 'boto', glif: '🍅', triada: true }],
  ['edició amb la 🪶 triada', { mode: 'edicio', icon: EMOTICONA_PER_DEFECTE }, { mostra: 'boto', glif: '🪶', triada: true }],
  ['lectura sense camp', { mode: 'lectura' }, { mostra: 'res', glif: null, triada: false }],
  ['lectura amb cadena buida', { mode: 'lectura', icon: '' }, { mostra: 'res', glif: null, triada: false }],
  ['lectura amb null', { mode: 'lectura', icon: null }, { mostra: 'res', glif: null, triada: false }],
  ['lectura amb text no vàlid', { mode: 'lectura', icon: '🍅 Tomaques' }, { mostra: 'res', glif: null, triada: false }],
  ['lectura amb 🍅 i espais', { mode: 'lectura', icon: ' 🍅 ' }, { mostra: 'glif', glif: '🍅', triada: true }],
  ['lectura amb la 🪶 triada', { mode: 'lectura', icon: EMOTICONA_PER_DEFECTE }, { mostra: 'glif', glif: '🪶', triada: true }],
  ['mode desconegut: com lectura', { mode: 'altre', icon: '🍅' }, { mostra: 'glif', glif: '🍅', triada: true }],
  ['sense arguments: lectura buida', undefined, { mostra: 'res', glif: null, triada: false }],
])('emoticonaDeBarra · %s', (_nom, entrada, eixida) => {
  expect(emoticonaDeBarra(entrada)).toEqual(eixida);
});
