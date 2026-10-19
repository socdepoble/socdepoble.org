/**
 * Auditoria de seguretat 261019 (R1, R2 i R4) · stripMarkdownImages,
 * llevaScriptsIEstils i llevaEtiquetes (contentHelpers.js) tornen exactament
 * el mateix que les expressions d'abans, i en temps lineal: un cos amb molts
 * '![', '<script' o '<' i cap tancament ja no congela /cerca, el Mur ni
 * Multimèdia.
 */
import { describe, expect, test } from 'vitest';
import { llevaEtiquetes, llevaScriptsIEstils, stripMarkdownImages, toFeedSummary, toMediaDescription } from './contentHelpers.js';

/* Les expressions d'abans, només com a oracle de la prova. */
const imatgesDAbans = (value) => String(value || '').replace(/!\[[^\]]*\]\([^)]+\)/g, '');
const codiDAbans = (text) => text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
const etiquetesDAbans = (text) => text.replace(/<[^>]*>/g, ' ');

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

const provaDiferencial = (funcio, oracle, trossos, { exhaustiu, llavor }) => {
  for (const text of [...totsElsTextos(trossos, exhaustiu), ...textsAleatoris(trossos, 4000, 40, llavor)]) {
    expect(funcio(text)).toBe(oracle(text));
  }
};

describe('stripMarkdownImages', () => {
  test('els casos de sempre', () => {
    expect(stripMarkdownImages('Hola ![una foto](/assets/a.png) món')).toBe('Hola  món');
    expect(stripMarkdownImages('![](/a.png)![b](c)z')).toBe('z');
    expect(stripMarkdownImages('![a![b](c)')).toBe('');
    expect(stripMarkdownImages('![a]() ![a] (x) ![a](x')).toBe('![a]() ![a] (x) ![a](x');
    expect(stripMarkdownImages(null)).toBe('');
    expect(toFeedSummary('![a](b)\n\n\n\nText')).toBe('\n\nText');
    expect(toMediaDescription(`${'x'.repeat(200)}![a](b)`)).toBe('x'.repeat(180));
  });

  test('torna el mateix que l’expressió d’abans en tots els textos curts i en milers d’aleatoris', () => {
    provaDiferencial(stripMarkdownImages, imatgesDAbans, ['!', '[', ']', '(', ')', '![', '](', 'a', '\n'], { exhaustiu: 5, llavor: 20261019 });
  });

  test('un text de molts ![ sense tancar es resol en temps lineal', () => {
    const inici = performance.now();
    expect(stripMarkdownImages('!['.repeat(160000))).toBe('!['.repeat(160000));
    expect(stripMarkdownImages('![]('.repeat(40000))).toBe('![]('.repeat(40000));
    expect(stripMarkdownImages(`${'!['.repeat(80000)}](x)`)).toBe('');
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('llevaScriptsIEstils', () => {
  test('els casos de sempre', () => {
    expect(llevaScriptsIEstils('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p> <p>b</p>');
    expect(llevaScriptsIEstils('<STYLE type="x">p{}</style>c')).toBe(' c');
    expect(llevaScriptsIEstils('<scriptx>a</script>')).toBe(' ');
    expect(llevaScriptsIEstils('<script>a<style>b</style>c</script>')).toBe(' ');
    expect(llevaScriptsIEstils('<script>a</style>')).toBe('<script>a</style>');
    expect(llevaScriptsIEstils('<script>a</script >')).toBe('<script>a</script >');
    expect(llevaScriptsIEstils('<script>a</script><script>b')).toBe(' <script>b');
    expect(llevaScriptsIEstils(undefined)).toBe('');
  });

  test('torna el mateix que l’expressió d’abans en tots els textos curts i en milers d’aleatoris', () => {
    const trossos = ['<script', '<SCRIPT', '</script>', '</SCRIPT>', '<style', '</StYlE>', '<', '/', '>', 'x',
      'ſ', '</ſcript>', '</scrıpt>', 'İ', 'K', '<scr', 'ipt>', '</', 'script', 'style'];
    provaDiferencial(llevaScriptsIEstils, codiDAbans, trossos, { exhaustiu: 3, llavor: 19102026 });
  });

  test('un text de molts <script sense tancar es resol en temps lineal', () => {
    const inici = performance.now();
    expect(llevaScriptsIEstils('<script'.repeat(40000))).toBe('<script'.repeat(40000));
    expect(llevaScriptsIEstils(`${'<script <style'.repeat(40000)}</style>`)).toBe('<script  ');
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('llevaEtiquetes', () => {
  test('els casos de sempre', () => {
    expect(llevaEtiquetes('<p>Hola <b>món</b></p>')).toBe(' Hola  món  ');
    expect(llevaEtiquetes('a < b > c')).toBe('a   c');
    expect(llevaEtiquetes('<<a>b')).toBe(' b');
    expect(llevaEtiquetes('a < b')).toBe('a < b');
    expect(llevaEtiquetes('')).toBe('');
    expect(llevaEtiquetes(null)).toBe('');
  });

  test('torna el mateix que l’expressió d’abans en tots els textos curts i en milers d’aleatoris', () => {
    provaDiferencial(llevaEtiquetes, etiquetesDAbans, ['<', '>', 'a', ' ', '<a', '>>', '\n'], { exhaustiu: 6, llavor: 261019 });
  });

  test('un text de molts < i cap > es resol en temps lineal', () => {
    const inici = performance.now();
    expect(llevaEtiquetes('<'.repeat(160000))).toBe('<'.repeat(160000));
    expect(llevaEtiquetes(`${'<'.repeat(160000)}>`)).toBe(' ');
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});
