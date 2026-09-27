import { expect, test } from 'vitest';
import { emojiInicial, emojiSol } from './emoji.js';

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
