/* D-B4-4 (Onada R6, Bloc 4; Gauntlet del Node 0: Qwen 2.5 Coder 14B, Qwen 3 8B
   i la IAIA MarIA) · cosPerAPintar no pot rebre res que no siga text sense
   haver-lo passat a text abans de cap replace: cap excepció, cap
   «[object Object]». cosDeLArticle cau en el canònic amb qualsevol element. */
import { describe, expect, test } from 'vitest';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';

const CANONIC = '<p>El document canònic.</p>';

describe('cosPerAPintar · entrades que no són text', () => {
  test('null, undefined, NaN, objectes, llistes, funcions, Symbol i booleans: un cos buit, sense excepció', () => {
    const dolents = [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, {}, { toString: () => '<script>x</script>' }, [], ['<p>a</p>'], () => '<p>f</p>', Symbol('cos'), true, false, 0n];
    for (const valor of dolents) {
      let pintat;
      expect(() => { pintat = cosPerAPintar(valor); }, String(typeof valor)).not.toThrow();
      expect(pintat, String(typeof valor)).toBe('');
    }
  });

  test('un número finit es pinta en xifres', () => {
    expect(cosPerAPintar(42)).toBe('42');
    expect(cosPerAPintar(0)).toBe('0');
  });

  test('una cadena continua igual: sanejada i amb els recursos propis resolts', () => {
    expect(cosPerAPintar('<p>Hola</p>')).toContain('<p>Hola</p>');
    expect(cosPerAPintar('<p>a</p><script>alert(1)</script>')).not.toContain('<script');
    const ambRecurs = cosPerAPintar('<p><a href="/assets/manifest/cartell.pdf">Cartell</a></p>');
    expect(ambRecurs).toContain('cartell.pdf');
    expect(ambRecurs).toContain('Cartell');
    expect(cosPerAPintar('')).toBe('');
  });
});

describe('cosDeLArticle · qualsevol element', () => {
  test('sense element, sense cos o amb un cos que no és text: el canònic', () => {
    for (const item of [null, undefined, {}, { content: null }, { content: 7 }, { content: { html: '<p>x</p>' } }, { content: '   ' }, 'no és cap element']) {
      expect(cosDeLArticle(item, CANONIC), JSON.stringify(item ?? null)).toBe(CANONIC);
    }
  });

  test('un cos HTML propi preval; un text pla, no', () => {
    expect(cosDeLArticle({ content: ' <p>Revisat</p> ' }, CANONIC)).toBe('<p>Revisat</p>');
    expect(cosDeLArticle({ content: 'Text pla vell' }, CANONIC)).toBe(CANONIC);
  });
});
