/**
 * Auditoria de seguretat 261019 (F4 i F12) · getFirstImage i semblaHtml
 * (detailHelpers.jsx) tornen exactament el mateix que les expressions d'abans,
 * i en temps lineal: un valor del payload amb molts '<img' (o '<a') i cap '>'
 * ja no congela el Mur, el Mercat ni el detall.
 */
import { describe, expect, test } from 'vitest';
import { getFirstImage, semblaHtml } from './detailHelpers.jsx';

/* Les expressions d'abans, només com a oracle de la prova. */
const IMG_D_ABANS = /<img[^>]+src="([^">]+)"/;
const HTML_D_ABANS = /<[a-z][\s\S]*>/i;
const getFirstImageDAbans = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    const match = val.match(IMG_D_ABANS);
    return match ? match[1] : val;
  }
  if (Array.isArray(val) && val.length > 0) return getFirstImageDAbans(val[0]);
  return null;
};

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

function textsAleatoris(trossos, quantitat, llargariaMaxima, llavor) {
  const atzar = generador(llavor);
  return Array.from({ length: quantitat }, () => {
    const llargaria = atzar(llargariaMaxima + 1);
    let text = '';
    for (let i = 0; i < llargaria; i += 1) text += trossos[atzar(trossos.length)];
    return text;
  });
}

describe('getFirstImage', () => {
  test('els casos de sempre', () => {
    expect(getFirstImage('<p><img class="x" src="/assets/a.png" alt=""></p>')).toBe('/assets/a.png');
    expect(getFirstImage('/assets/b.png')).toBe('/assets/b.png');
    expect(getFirstImage(['<img src="/c.png">', '/d.png'])).toBe('/c.png');
    expect(getFirstImage(null)).toBeNull();
    expect(getFirstImage({ src: '/e.png' })).toBeNull();
    expect(getFirstImage([])).toBeNull();
  });

  test('voraç com l’expressió: dins de la mateixa etiqueta mana l’últim src="…"', () => {
    const html = '<img data-src="/primer.png" src="/segon.png">';
    expect(getFirstImage(html)).toBe(getFirstImageDAbans(html));
    expect(getFirstImage(html)).toBe('/segon.png');
  });

  test('torna el mateix que l’expressió d’abans en milers de textos aleatoris', () => {
    const trossos = ['<img', '<IMG', ' ', 'src="', 'data-src="', '"', '>', 'a', '/x.png', '<', 'src=', 'img'];
    for (const text of textsAleatoris(trossos, 4000, 24, 20261019)) {
      expect(getFirstImage(text)).toBe(getFirstImageDAbans(text));
    }
  });

  test('un text de molts <img sense cap > es resol en temps lineal', () => {
    const atac = `/a${'<img'.repeat(200000)}`;
    const inici = performance.now();
    expect(getFirstImage(atac)).toBe(atac);
    expect(getFirstImage(`/a${'<img src="'.repeat(50000)}`)).toBe('<img src=');
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('semblaHtml', () => {
  test('els casos de sempre', () => {
    expect(semblaHtml('<p>Hola</p>')).toBe(true);
    expect(semblaHtml('<B x')).toBe(false);
    expect(semblaHtml('<B>')).toBe(true);
    expect(semblaHtml('<a')).toBe(false);
    expect(semblaHtml('a < b > c')).toBe(false);
    expect(semblaHtml('text pla')).toBe(false);
    expect(semblaHtml('')).toBe(false);
  });

  test('torna el mateix que l’expressió d’abans en milers de textos aleatoris', () => {
    const trossos = ['<', '>', 'a', 'Z', '1', ' ', '\n', 'é', '<a', 'ſ', 'K'];
    for (const text of textsAleatoris(trossos, 4000, 24, 19102026)) {
      expect(semblaHtml(text)).toBe(HTML_D_ABANS.test(text));
    }
  });

  test('un cos de molts <a sense cap > es resol en temps lineal', () => {
    const inici = performance.now();
    expect(semblaHtml('<a'.repeat(200000))).toBe(false);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});
