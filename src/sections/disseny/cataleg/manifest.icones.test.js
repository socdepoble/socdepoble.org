/* Ordre del Mestre (261007) · «Substitueix el maó genèric (🧱) per emojis
   distints i amb sentit semàntic per a cada espècimen». Cada espècimen del
   catàleg porta el seu emoji (ICONES_ESPECIMENS): cap no hereta el de la
   categoria, cap no es repetix dins de la seua categoria i tots són emojis
   RGI que es veuen a Safari 16 (Unicode 13 o anteriors, sense seqüències
   ZWJ). Les categories conserven el seu. */
import { expect, test } from 'vitest';
import { CATALOG_CATEGORIES, CATALOG_ITEMS, ICONES_ESPECIMENS } from './manifest.js';
/* Revisió del 261007 (M2-14) · La guarda és una sola, compartida amb
   iconesWiki.test.js. */
import { defecteSafari16 as defecte } from '../../../../tests/helpers/guardaEmojisSafari16.js';

test('la guarda de versió trau el que Safari 16 no pinta i deixa passar el que sí', () => {
  // Sondes: 🪪 (14), 🫠 (14), 🪿 (15), ⚙ sense selector (text) i una unió que
  // no és RGI; 🪶 (13), 🧱 (11), ⚙️ i ©️ amb selector passen.
  expect(['🪪', '🫠', '🪿', '⚙', '🍅‍🍅'].map(defecte)).toEqual([
    'és posterior a Unicode 13', 'és posterior a Unicode 13', 'és posterior a Unicode 13',
    'no és un sol emoji', 'no és un emoji RGI complet (falta el selector U+FE0F?)'
  ]);
  expect(['🪶', '🧱', '⚙️', '©️'].map(defecte)).toEqual([null, null, null, null]);
});

/* Revisió del 261007 (M2-14) · Els forats de la guarda: els tres cors
   d'Emoji 15.0 (U+1FA75–U+1FA77) i les banderes, que són parells
   d'indicadors regionals antics encara que la bandera siga nova (🇨🇶, Emoji
   16). Una seqüència ZWJ RGI tampoc passa. */
test('M2-14 · la guarda també trau els cors d’Emoji 15, les banderes i les seqüències ZWJ', () => {
  const cors = [0x1FA75, 0x1FA76, 0x1FA77].map((punt) => String.fromCodePoint(punt));
  expect(cors.map(defecte)).toEqual(cors.map(() => 'és posterior a Unicode 13'));
  const bandera = (a, b) => String.fromCodePoint(0x1F1E6 + a.charCodeAt(0) - 65, 0x1F1E6 + b.charCodeAt(0) - 65);
  expect([bandera('C', 'Q'), bandera('E', 'S')].map(defecte)).toEqual(['és una bandera', 'és una bandera']);
  expect(defecte(String.fromCodePoint(0x1F469, 0x200D, 0x1F33E))).toBe('és una seqüència ZWJ');
});

test('cada espècimen porta el seu emoji propi, vàlid a Safari 16', () => {
  const dolents = CATALOG_ITEMS
    .map((item) => [item.id, item.icon, item.icon ? defecte(item.icon) : 'sense emoji: hereta el de la categoria'])
    .filter(([, , motiu]) => motiu);
  expect(dolents).toEqual([]);
  expect(CATALOG_ITEMS.length).toBeGreaterThanOrEqual(86);
});

test('cap emoji repetit dins d’una categoria, i el maó genèric ja no és a cap espècimen', () => {
  for (const categoria of CATALOG_CATEGORIES) {
    const emojis = CATALOG_ITEMS.filter((item) => item.categoryIds[0] === categoria.id).map((item) => item.icon);
    expect(new Set(emojis).size, categoria.id).toBe(emojis.length);
  }
  expect(CATALOG_ITEMS.filter((item) => item.icon === '🧱').map((item) => item.id)).toEqual([]);
});

test('la taula no porta cap espècimen que no existisca, i les categories conserven el seu emoji', () => {
  const ids = new Set(CATALOG_ITEMS.map((item) => item.id));
  const sobrants = Object.entries(ICONES_ESPECIMENS)
    .flatMap(([categoria, slugs]) => Object.keys(slugs).map((slug) => `${categoria}-${slug}`))
    .filter((id) => !ids.has(id));
  expect(sobrants).toEqual([]);
  expect(CATALOG_CATEGORIES.map((categoria) => [categoria.id, categoria.icon])).toEqual([
    ['fonaments', '🧱'], ['estructura', '📐'], ['formularis', '📝'], ['superposicions', '🗂️'],
    ['retroalimentacio', '🔔'], ['navegacio', '🧭'], ['inventari', '📦'], ['emoticones', '🌻']
  ]);
});
