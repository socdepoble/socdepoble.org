// @vitest-environment node
/* Gauntlet R9 · FBV-01 (verificadora de la ronda R9) · La façana del vídeo editorial (VideoEditorial,
   un EstatBuit) viu dins de .aplec-2023__video, que té el fons de crom: no canvia amb el tema (llei K1).
   Els colors semàntics de l'EstatBuit sí que canvien: en el tema clar, el títol quedava negre sobre
   negre i l'avís no es llegia (mesura amb Chrome de la verificadora). Ací la façana pinta amb el crom.
   jsdom no pinta: es comproven les regles escrites, sense comentaris, i el contrast es calcula amb els
   tokens declarats a tokens.css (els del crom no tenen variant fosca). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (rel) => readFileSync(resolve(process.cwd(), rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const MODULS = llig('src/css/modules.css');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const reglaDe = (selector) => {
  const inici = MODULS.indexOf(`${selector} {`);
  if (inici === -1) return null;
  return net(MODULS.slice(MODULS.indexOf('{', inici) + 1, MODULS.indexOf('}', inici)));
};

const FACANA = '.aplec-2023__video > .video-editorial__facana';

/* Els tokens del tema clar: tot el que hi ha abans del primer bloc fosc. */
const TOKENS = llig('src/css/tokens.css');
const CLAR = TOKENS.slice(0, TOKENS.indexOf(':root[data-theme="dark"]'));
const valorDe = (nom, fons = 0) => {
  const m = CLAR.match(new RegExp(`${nom.replace(/[-]/g, '\\-')}:\\s*([^;]+);`));
  if (!m) throw new Error(`token sense declarar: ${nom}`);
  const valor = m[1].trim();
  const v = valor.match(/^var\((--[\w-]+)\)$/);
  return v ? valorDe(v[1], fons + 1) : valor;
};
const rgb = (valor, sota = null) => {
  const hex = valor.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  const rgba = valor.match(/^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/);
  if (rgba && sota) {
    const a = Number(rgba[4]);
    return [1, 2, 3].map((i, k) => Number(rgba[i]) * a + sota[k] * (1 - a));
  }
  throw new Error(`color no previst: ${valor}`);
};
const luminancia = ([r, g, b]) => {
  const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('FBV-01 · la façana del vídeo pinta amb el crom dins de .aplec-2023__video', () => {
  test('el contenidor continua amb el fons de crom', () => {
    expect(reglaDe('.aplec-2023__video')).toMatch(/background: var\(--sdp-crom-fons\);/);
  });

  test('l’avís, la icona, el títol i l’anell de focus usen els tokens del crom', () => {
    expect(reglaDe(FACANA)).toBe('flex: 1 1 auto; color: var(--sdp-crom-text-suau);');
    expect(reglaDe(`${FACANA} > .sdp-buit`)).toBe('color: inherit;');
    expect(reglaDe(`${FACANA} > .sdp-buit__titol`)).toBe('color: var(--sdp-crom-text);');
    expect(reglaDe(`${FACANA} .sdp-boto:focus-visible`)).toBe('outline-color: var(--sdp-crom-focus);');
  });

  test('les regles són a la capa components, després de la de l’iframe, com les de l’EstatBuit', () => {
    const bloc = MODULS.indexOf('.aplec-2023__video {');
    const capa = MODULS.lastIndexOf('@layer components {', bloc);
    expect(capa).toBeGreaterThan(-1);
    expect(MODULS.indexOf(`${FACANA} {`)).toBeGreaterThan(MODULS.indexOf('.aplec-2023__video iframe {'));
    /* Cap claudàtor de tancament de la capa entre l'obertura i les regles noves. */
    const tros = MODULS.slice(capa, MODULS.indexOf(`${FACANA} .sdp-boto:focus-visible {`));
    expect((tros.match(/\{/g) || []).length).toBe((tros.match(/\}/g) || []).length + 1);
    expect(llig('src/css/components.css')).toMatch(/\.sdp-buit__titol \{[^}]*color: var\(--sdp-text-titol\)/);
  });

  /* Gauntlet R10 · VFC-04 · L'EstatBuit posa la classe sdp-buit a la icona (estats.jsx, que no es toca), i el
     farciment de .sdp-buit (space-10 dalt i baix) deixava la CirclePlay amb 0 d'alt: Chrome la mesurava amb una
     caixa de 56×80 i un contingut de 24×0. Dins de la façana, en tots dos llocs (el crom de l'Aplec i el visor
     d'Anatomia Rural), la icona va sense farciment: la caixa torna a ser de 56×56. */
  test('VFC-04 · dins de la façana, la icona no hereta el farciment de .sdp-buit', () => {
    expect(reglaDe('.video-editorial__facana > svg')).toBe('padding: 0;');
    /* La causa continua sent la mateixa: si l'EstatBuit deixa de posar sdp-buit a la icona, la regla sobra. */
    expect(llig('src/components/PedraSeca/atoms/estats.jsx')).toMatch(/<Icona className="sdp-buit" size=\{56\}/);
    expect(llig('src/css/components.css')).toMatch(/\.sdp-buit \{[^}]*padding: var\(--sdp-space-10\) var\(--sdp-space-4\);/);
    /* A la capa components, com la de .sdp-buit: amb (0,1,1) guanya el (0,1,0) sense cap !important. */
    const capa = MODULS.lastIndexOf('@layer components {', MODULS.indexOf('.video-editorial__facana > svg {'));
    expect(capa).toBe(MODULS.lastIndexOf('@layer components {', MODULS.indexOf('.aplec-2023__video {')));
    const tros = MODULS.slice(capa, MODULS.indexOf('.video-editorial__facana > svg {'));
    expect((tros.match(/\{/g) || []).length).toBe((tros.match(/\}/g) || []).length + 1);
    expect(reglaDe('.video-editorial__facana > svg')).not.toMatch(/!important/);
  });

  test('sobre el fons de crom, el títol i l’avís arriben a AAA (7:1) i l’anell de focus a 3:1', () => {
    const fons = rgb(valorDe('--sdp-crom-fons'));
    expect(contrast(rgb(valorDe('--sdp-crom-text')), fons)).toBeGreaterThanOrEqual(7);
    expect(contrast(rgb(valorDe('--sdp-crom-text-suau'), fons), fons)).toBeGreaterThanOrEqual(7);
    expect(contrast(rgb(valorDe('--sdp-crom-focus')), fons)).toBeGreaterThanOrEqual(3);
    /* El que fallava: el títol semàntic del tema clar sobre el crom. */
    expect(contrast(rgb(valorDe('--sdp-text-titol')), fons)).toBeLessThan(1.5);
  });
});
