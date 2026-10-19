/**
 * Auditoria de seguretat 261019 (R3) · Els src de les <img> de la presentació
 * (DetallMultimedia.jsx · srcsDeLesImg i imatgesDeLaPresentacio) són
 * exactament els que donava l'expressió d'abans, en el mateix ordre, i en
 * temps lineal: una presentació amb molts '<img' (o '<img src=') i cap '>' ja
 * no congela el panell.
 */
import { describe, expect, test } from 'vitest';
import { imatgesDeLaPresentacio, srcsDeLesImg } from './DetallMultimedia.jsx';
import { esFontImatgePropia } from '../../utils/sanitize.js';

/* L'expressió d'abans, només com a oracle de la prova. */
const IMG_D_ABANS = /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const srcsDAbans = (html) => [...html.matchAll(IMG_D_ABANS)].map((trossos) => trossos[1] ?? trossos[2] ?? '');
const imatgesDAbans = (html) => {
  if (typeof html !== 'string' || !html) return [];
  const fonts = [];
  for (const trossos of html.matchAll(IMG_D_ABANS)) {
    const font = (trossos[1] ?? trossos[2] ?? '').replaceAll('&amp;', '&').trim();
    if (font && esFontImatgePropia(font) && !fonts.includes(font)) fonts.push(font);
  }
  return fonts;
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

/* Tots els textos fets d'entre 0 i `maxim` trossos. */
function totsElsTextos(trossos, maxim) {
  let nivell = [''];
  const tots = [''];
  for (let n = 1; n <= maxim; n += 1) {
    nivell = nivell.flatMap((text) => trossos.map((tros) => text + tros));
    tots.push(...nivell);
  }
  return tots;
}

describe('srcsDeLesImg', () => {
  test('els casos de sempre', () => {
    expect(srcsDeLesImg('<p><img class="x" src="/assets/a.png"><IMG\nsrc = \'/assets/b.png\'></p>')).toEqual(['/assets/a.png', '/assets/b.png']);
    expect(srcsDeLesImg('<img data-src="/x.png" src="/y.png">')).toEqual(['/y.png']);
    expect(srcsDeLesImg('<imgx src="/a.png">')).toEqual([]);
    // El tram de l'etiqueta acaba en el primer '>', però el valor el pot passar.
    expect(srcsDeLesImg('<img alt="a>b" src="/a.png">')).toEqual([]);
    expect(srcsDeLesImg('<img src="/a>b.png">')).toEqual(['/a>b.png']);
    expect(srcsDeLesImg('<img src="/a.png')).toEqual([]);
    expect(srcsDeLesImg(null)).toEqual([]);
  });

  test('torna el mateix que l’expressió d’abans en tots els textos curts i en milers d’aleatoris', () => {
    const trossos = ['<img', '<IMG', '<imgx', '<img_', '<im', ' ', '\n', ' ', 'src', 'SRC', 'ſrc', '=', '"', "'", '>',
      'a', ' src="', " src='", ' src=', '<'];
    for (const text of [...totsElsTextos(trossos, 3), ...textsAleatoris(trossos, 6000, 30, 20261019)]) {
      expect(srcsDeLesImg(text)).toEqual(srcsDAbans(text));
    }
  });

  test('una presentació de molts <img sense cap > es resol en temps lineal', () => {
    const inici = performance.now();
    expect(srcsDeLesImg('<img'.repeat(200000))).toEqual([]);
    expect(srcsDeLesImg('<img src='.repeat(40000))).toEqual([]);
    expect(srcsDeLesImg('<img src="'.repeat(40000))).toEqual(Array(20000).fill('<img src='));
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('imatgesDeLaPresentacio', () => {
  test('torna el mateix que abans en milers de presentacions aleatòries', () => {
    const trossos = ['<img', '<IMG', ' ', 'src=', '"', "'", '>', '/assets/a.png', '/assets/b.png?x=1&amp;y=2',
      'https://fora.example/c.png', 'sdp-media://mitjans/u/d.webp', '&amp;', '<p>', ' src="'];
    for (const html of textsAleatoris(trossos, 4000, 24, 19102026)) {
      expect(imatgesDeLaPresentacio(html)).toEqual(imatgesDAbans(html));
    }
  });

  test('una presentació d’atac no congela el panell', () => {
    const inici = performance.now();
    expect(imatgesDeLaPresentacio('<img src='.repeat(40000))).toEqual([]);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});
