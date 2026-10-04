import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/* Q7 (Mestre, 261004) · Noto Sans de casa, sense Google Fonts. Mesurat al
   navegador: el woff2 és variable en wght (100-900) i no té eix wdth.
   Procediment: _wiki_de_poble/04_escriptori/02_investigacio_ia/
   261003_1330_onada4_claude/FONTS_LOCALS.txt. jsdom no carrega fonts: es
   comproven els fitxers. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

const INDEX = llig('index.html');
const FONTS = senseComentaris(llig('public/fonts/noto-sans.css'));
const WOFF2_NORMAL = 'o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2';
const WOFF2_ESTRET = 'noto-sans-wdth-wght-latin.woff2';

/** Les cares de noto-sans.css: { descriptor: valor }, amb `src` com a llista d'URL. */
function cares(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const cara = {};
    for (const declaracio of m[1].split(';')) {
      const dos = declaracio.indexOf(':');
      if (dos === -1) continue;
      cara[declaracio.slice(0, dos).trim()] = declaracio.slice(dos + 1).trim().replace(/\s+/g, ' ');
    }
    cara.urls = [...(cara.src || '').matchAll(/url\(([^)]+)\)/g)].map((u) => u[1].replace(/['"]/g, ''));
    return cara;
  });
}

describe('index.html · fonts de casa', () => {
  test('cap servidor de Google Fonts: ni full, ni preconnect, ni domini', () => {
    expect(INDEX).not.toMatch(/fonts\.googleapis/);
    expect(INDEX).not.toMatch(/fonts\.gstatic/);
    expect(INDEX).not.toMatch(/rel="preconnect"/);
  });

  test('carrega /fonts/noto-sans.css una sola vegada i precarrega el woff2 que hi apunta', () => {
    expect(INDEX.split('<link rel="stylesheet" href="/fonts/noto-sans.css" />')).toHaveLength(2);
    const preload = `<link rel="preload" href="/fonts/${WOFF2_NORMAL}" as="font" type="font/woff2" crossorigin />`;
    expect(INDEX.split(preload)).toHaveLength(2);
    // El preload va abans del full: el navegador demana el woff2 sense esperar el CSS.
    expect(INDEX.indexOf(preload)).toBeLessThan(INDEX.indexOf('href="/fonts/noto-sans.css"'));
    expect(existsSync(resolve(ARREL, 'public/fonts', WOFF2_NORMAL))).toBe(true);
  });
});

describe('public/fonts/noto-sans.css · una cara per amplada, amb rangs', () => {
  const llista = cares(FONTS);

  test('dues cares de Noto Sans, recta, swap i el mateix subconjunt llatí', () => {
    expect(llista).toHaveLength(2);
    for (const cara of llista) {
      expect(cara['font-family']).toBe("'Noto Sans'");
      expect(cara['font-style']).toBe('normal');
      expect(cara['font-display']).toBe('swap');
      expect(cara['unicode-range']).toBe(llista[0]['unicode-range']);
    }
    expect(llista[0]['unicode-range']).toMatch(/^U\+0000-00FF, /);
  });

  test('amplada normal: pes en rang 400-800 sobre el woff2 variable, mai pesos solts', () => {
    const normal = llista.find((c) => c['font-stretch'] === '100%');
    expect(normal['font-weight']).toBe('400 800');
    expect(normal.urls).toEqual([`./${WOFF2_NORMAL}`]);
  });

  test('amplades estretes 62.5-87.5%: primer el variable wdth+wght i, si no hi és, el d’amplada normal', () => {
    const estreta = llista.find((c) => c['font-stretch'] === '62.5% 87.5%');
    expect(estreta['font-weight']).toBe('400 800');
    expect(estreta.urls).toEqual([`./${WOFF2_ESTRET}`, `./${WOFF2_NORMAL}`]);
  });

  test('cada cara acaba en un fitxer que existix: cap src remot i cap cara sense recurs', () => {
    for (const cara of llista) {
      expect(cara.urls.every((u) => u.startsWith('./') && u.endsWith('.woff2'))).toBe(true);
      expect(existsSync(resolve(ARREL, 'public/fonts', cara.urls.at(-1)))).toBe(true);
    }
  });
});

describe('tipografia estreta · el contracte d’ús arriba al Shadow DOM', () => {
  test('index.css importa tipografia-estreta.css una sola vegada i sense layer()', () => {
    const index = senseComentaris(llig('src/css/index.css'));
    const imports = [...index.matchAll(/@import[^;]*tipografia-estreta\.css[^;]*;/g)].map((m) => m[0]);
    expect(imports).toEqual(["@import url('./tipografia-estreta.css');"]);
  });

  test('les classes viuen a @layer components i només consumixen els tokens d’amplada', () => {
    const full = senseComentaris(llig('src/css/tipografia-estreta.css'));
    expect(full.trim()).toMatch(/^@layer components \{[\s\S]*\}$/);
    expect(full).toMatch(/\.sdp-text-estret \{\s*font-stretch: var\(--sdp-font-amplada-semi\);\s*\}/);
    expect(full).toMatch(/\.sdp-text-estret--molt \{\s*font-stretch: var\(--sdp-font-amplada-estreta\);\s*\}/);
    expect(full).not.toMatch(/\d+(\.\d+)?%/);
  });
});
