// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { GRUPS_EMOJIS, TOTAL_EMOJIS, VERSIO_UNICODE_EMOJIS } from './emojisUnicode18.js';

const entrades = GRUPS_EMOJIS.flatMap((grup) => grup.emojis);
const perCodi = new Map(entrades.map((entrada) => [entrada[0], entrada]));

test('el catàleg estàtic conserva exactament les 3972 entrades RGI de la font Unicode 18.0 fixada', () => {
  expect(VERSIO_UNICODE_EMOJIS).toBe('18.0');
  expect(TOTAL_EMOJIS).toBe(3972);
  expect(entrades).toHaveLength(3972);
  expect(perCodi.size).toBe(3972);
  expect(new Set(entrades.map(([, glif]) => glif)).size).toBe(3972);
  expect(GRUPS_EMOJIS.map((grup) => [grup.id, grup.emojis.length])).toEqual([
    ['cares-emocions', 172], ['persones-cos', 2430], ['components', 9], ['animals-natura', 161],
    ['menjar-beguda', 132], ['viatges-llocs', 221], ['activitats', 85], ['objectes', 268], ['simbols', 224], ['banderes', 270]
  ]);
  // Empremta de les seqüències i noms de la font oficial, no del recompte:
  // llevar, repetir, reordenar o canviar qualsevol nom fa fallar la prova.
  expect(createHash('sha256').update(JSON.stringify(entrades)).digest('hex'))
    .toBe('2590ddb07e3c0d4cd7cdf464bbb42175bddfb0cad5f878fdd1c749396cbbac64');
});

test('els glifs corresponen als codis; conserva components, ZWJ, selectors i banderes sense variants duplicades', () => {
  expect(entrades.every(([codi, glif]) => String.fromCodePoint(...codi.split(' ').map((cp) => parseInt(cp, 16))) === glif)).toBe(true);
  expect(perCodi.get('1F3FB')).toEqual(['1F3FB', '🏻', 'light skin tone']);
  expect(perCodi.get('1F469 200D 1F33E')).toEqual(['1F469 200D 1F33E', '👩‍🌾', 'woman farmer']);
  expect(perCodi.get('1F1EA 1F1F8')).toEqual(['1F1EA 1F1F8', '🇪🇸', 'flag: Spain']);
  expect(perCodi.get('1F3F4 E0067 E0062 E0065 E006E E0067 E007F')?.[2]).toBe('flag: England');
  expect(perCodi.get('1FAEB')).toEqual(['1FAEB', '🫫', 'cracking face']);
  expect(perCodi.has('263A FE0F')).toBe(true);
  expect(perCodi.has('263A')).toBe(false);
  expect(perCodi.has('1F642 200D 2194 FE0F')).toBe(true);
  expect(perCodi.has('1F642 200D 2194')).toBe(false);
});

test('la còpia derivada inclou íntegra la llicència Unicode V3 amb copyright i avís de permís', () => {
  const font = readFileSync(new URL('./emojisUnicode18.js', import.meta.url), 'utf8');
  const comentari = font.slice(0, font.indexOf(' */'));
  const notice = comentari.slice(comentari.indexOf(' * UNICODE LICENSE V3')).split('\n')
    .map((linia) => linia.replace(/^ \*(?: )?/, '')).join('\n');
  expect(createHash('sha256').update(`${notice.trimEnd()}\n`).digest('hex'))
    .toBe('e7a93b009565cfce55919a381437ac4db883e9da2126fa28b91d12732bc53d96');
});
