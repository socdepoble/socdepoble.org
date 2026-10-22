/* Pla 261022_1425 (emojis grans i paritat WhatsApp) · Les peces pures del
   calaix d'emoticones del xat: on entra l'emoticona i on queda el cursor, la
   tria «Del poble» (les mateixes entrades del catàleg Emojis XL) i les
   recents en memòria. */
import { afterEach, describe, expect, test } from 'vitest';
import { GRUPS_EMOJIS } from '../disseny/cataleg/dades/emojisUnicode18.js';
import { emojiSol } from '../../utils/emoji.js';
import {
  EMOTICONES_DEL_POBLE, MAXIM_RECENTS, buidaRecents, codiDe, inserixAlCursor, llegixRecents, recordaRecent
} from './emoticonesXat.js';

afterEach(buidaRecents);

describe('inserixAlCursor', () => {
  test('entra on és el cursor i el cursor queda just darrere (en unitats UTF-16: 🍅 en són dues)', () => {
    expect(inserixAlCursor('Bon dia', '🍅', 3, 3)).toEqual({ valor: 'Bon🍅 dia', cursor: 5 });
    expect(inserixAlCursor('Bon dia', '❤️', 0, 0)).toEqual({ valor: '❤️Bon dia', cursor: 2 });
  });

  test('un tros seleccionat se’n va i l’emoticona ocupa el seu lloc', () => {
    expect(inserixAlCursor('Bon dia', '👋', 0, 3)).toEqual({ valor: '👋 dia', cursor: 2 });
  });

  test('sense posició coneguda, al final; fora de rang, a la vora; un final abans de l’inici no esborra res', () => {
    expect(inserixAlCursor('Hola', '🙂')).toEqual({ valor: 'Hola🙂', cursor: 6 });
    expect(inserixAlCursor('Hola', '🙂', null, null)).toEqual({ valor: 'Hola🙂', cursor: 6 });
    expect(inserixAlCursor('Hola', '🙂', 99, 120)).toEqual({ valor: 'Hola🙂', cursor: 6 });
    expect(inserixAlCursor('Hola', '🙂', -4, -1)).toEqual({ valor: '🙂Hola', cursor: 2 });
    expect(inserixAlCursor('Hola', '🙂', 3, 1)).toEqual({ valor: 'Hol🙂a', cursor: 5 });
    expect(inserixAlCursor('Hola', '🙂', 2)).toEqual({ valor: 'Ho🙂la', cursor: 4 });
    expect(inserixAlCursor(null, '🙂', 0, 0)).toEqual({ valor: '🙂', cursor: 2 });
  });

  test('si passaria del límit, no entra (el maxLength del camp no frena el codi); sense glif, tampoc', () => {
    expect(inserixAlCursor('a'.repeat(4095), '🍅', 0, 0, 4096)).toBeNull();
    expect(inserixAlCursor('a'.repeat(4094), '🍅', 0, 0, 4096).valor).toHaveLength(4096);
    // Amb un tros seleccionat, compta el que se’n va.
    expect(inserixAlCursor('a'.repeat(4096), '🍅', 0, 2, 4096).valor).toHaveLength(4096);
    expect(inserixAlCursor('Hola', '', 0, 0)).toBeNull();
  });
});

describe('EMOTICONES_DEL_POBLE', () => {
  const delCataleg = new Map(GRUPS_EMOJIS.flatMap((grup) => grup.emojis.map((entrada) => [entrada[0], entrada])));

  test('les cinc seccions del pla, en ordre', () => {
    expect(EMOTICONES_DEL_POBLE.map((s) => s.id)).toEqual(['cares', 'gestos', 'horta', 'natura', 'festes']);
    expect(EMOTICONES_DEL_POBLE.map((s) => s.nom)).toEqual([
      'Cares i emocions', 'Gestos i cors', 'Horta, camp i menjar', 'Animals i natura', 'Poble, eines i festes'
    ]);
  });

  test('cada emoticona és l’entrada del catàleg Emojis XL tal qual (codi, glif i nom oficial), i és un sol emoji', () => {
    for (const seccio of EMOTICONES_DEL_POBLE) {
      expect(seccio.emojis.length).toBeGreaterThan(0);
      for (const entrada of seccio.emojis) {
        expect(delCataleg.get(entrada[0]), `${seccio.id}: ${entrada[1]}`).toEqual(entrada);
        expect(codiDe(entrada[1])).toBe(entrada[0]);
        expect(emojiSol(entrada[1])).toBe(entrada[1]);
      }
    }
  });

  test('totes són d’Emoji 12.0 o anteriors (Windows 10 i els Android fins al 10 no pinten les d’Emoji 13)', () => {
    /* Els punts de codi d’Emoji 13 i posteriors que cauen prop de la tria: el
       bloc 1FA70–1FAFF fora dels d’Emoji 12, i els d’Emoji 13 del bloc 1F900. */
    const emoji12 = (cp) => (cp >= 0x1FA70 && cp <= 0x1FA73) || (cp >= 0x1FA78 && cp <= 0x1FA7A)
      || (cp >= 0x1FA80 && cp <= 0x1FA82) || (cp >= 0x1FA90 && cp <= 0x1FA95);
    const emoji13 = new Set([0x1F90C, 0x1F972, 0x1F977, 0x1F978, 0x1F9A3, 0x1F9AB, 0x1F9AC, 0x1F9AD, 0x1F9CB, 0x1F6D6, 0x1F6D7, 0x1F6FB, 0x1F6FC]);
    for (const seccio of EMOTICONES_DEL_POBLE) {
      for (const [, glif] of seccio.emojis) {
        for (const c of glif) {
          const cp = c.codePointAt(0);
          expect(cp >= 0x1FA70 && !emoji12(cp), `${glif} (${cp.toString(16)})`).toBe(false);
          expect(emoji13.has(cp), `${glif} (${cp.toString(16)})`).toBe(false);
        }
      }
    }
    const glifs = EMOTICONES_DEL_POBLE.flatMap((s) => s.emojis.map(([, glif]) => glif));
    for (const tretes of ['🫒', '🫑', '🪣', '🪗']) expect(glifs).not.toContain(tretes);
  });

  test('cap emoticona no es repetix entre seccions', () => {
    const glifs = EMOTICONES_DEL_POBLE.flatMap((s) => s.emojis.map(([, glif]) => glif));
    expect(new Set(glifs).size).toBe(glifs.length);
  });
});

describe('recents (en memòria)', () => {
  test('la més nova primer; una repetida puja davant sense duplicar-se', () => {
    recordaRecent('🍅', 'tomato');
    recordaRecent('🔔', 'bell');
    recordaRecent('🍅', 'tomato');
    expect(llegixRecents()).toEqual([['1F345', '🍅', 'tomato'], ['1F514', '🔔', 'bell']]);
  });

  test(`només en recorda ${MAXIM_RECENTS}, i sense nom el nom és el glif`, () => {
    const glifs = Array.from({ length: MAXIM_RECENTS + 3 }, (_, i) => String.fromCodePoint(0x1F600 + i));
    glifs.forEach((glif) => recordaRecent(glif));
    expect(llegixRecents()).toHaveLength(MAXIM_RECENTS);
    expect(llegixRecents()[0]).toEqual([codiDe(glifs.at(-1)), glifs.at(-1), glifs.at(-1)]);
  });

  test('un glif buit o que no és text no hi entra; buidaRecents les oblida', () => {
    recordaRecent('🐐', 'goat');
    recordaRecent('');
    recordaRecent(null);
    expect(llegixRecents()).toHaveLength(1);
    buidaRecents();
    expect(llegixRecents()).toEqual([]);
  });
});
