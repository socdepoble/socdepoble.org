/**
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre) · Les regles
 * escrites del quadrat, del títol de la targeta, de l'escala d'encapçalaments
 * i del gran botó de les pàgines. jsdom no pinta: es llig el full (mateix
 * patró que UniversalCard.vinyeta.capes.test.jsx) i els contrastos es
 * calculen amb la fórmula WCAG sobre els hex reals de tokens.css (com
 * css/navegacio-secundaria.capes.test.js).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (css) => senseComentaris(css).replace(/\s+/g, ' ');
const components = net(llig('src/css/components.css'));
const layout = net(llig('src/css/layout.css'));
const tokens = senseComentaris(llig('src/css/tokens.css'));

/* El cos de la primera regla amb eixa llista de selectors, exacta. */
function cos(css, selectors) {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelud = m[1].split(';').pop().trim();
    if (prelud.split(',').map((s) => s.trim()).join(', ') === selectors) return m[2].trim();
  }
  return null;
}
const FOSC_QUADRAT = ':root[data-theme="dark"] .sp-card-calendar-badge, :host([data-theme="dark"]) .sp-card-calendar-badge';
const declara = (text, propietat, valor) => text !== null
  && text.split(';').map((d) => d.trim()).includes(`${propietat}: ${valor}`);

/* La regla viu dins d'un bloc `@layer components {` encara obert. */
const dinsDeComponents = (css, marca) => {
  const index = css.indexOf(marca);
  const abans = css.slice(0, index);
  const capa = abans.lastIndexOf('@layer components {');
  if (index < 0 || capa < 0) return false;
  const tram = abans.slice(capa);
  return tram.split('{').length - tram.split('}').length === 1;
};

/* ── Tokens i contrast WCAG ── El primer valor de cada token és el del tema
   clar; el bloc fosc només redefinix semàntics. */
const blocFosc = tokens.slice(tokens.indexOf(':root[data-theme="dark"], :host([data-theme="dark"])'));
const canon = senseComentaris(llig('src/css/design-tokens.css'));
function mapa(css) {
  const m = new Map();
  for (const d of css.matchAll(/(--sdp-[\w-]+)\s*:\s*([^;}]+)/g)) if (!m.has(d[1])) m.set(d[1], d[2].trim());
  return m;
}
const CLAR = new Map([...mapa(canon), ...mapa(tokens)]);
const FOSC = new Map([...CLAR, ...mapa(blocFosc.slice(0, blocFosc.indexOf('}') + 1))]);
function hex(tema, token, prof = 0) {
  const valor = tema.get(token);
  const v = /^var\(\s*(--[\w-]+)\s*\)$/.exec(valor ?? '');
  if (v && prof < 16) return hex(tema, v[1], prof + 1);
  return valor;
}
const rgb = (h) => {
  const m = /^#([0-9a-f]{6})$/i.exec(h ?? '');
  if (!m) throw new Error(`No és un hex de 6 xifres: ${h}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (c) => {
  const [r, g, b] = c.map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const contrast = (tema, a, b) => ratio(rgb(hex(tema, a)), rgb(hex(tema, b)));
/* Un color amb opacitat damunt d'un fons opac. */
const barreja = (davant, fons, alfa) => davant.map((c, i) => Math.round(alfa * c + (1 - alfa) * fons[i]));

/* El token d'una declaració `propietat: var(--token)` d'una regla, o null. */
const tokenDe = (text, propietat) => {
  const declaracio = (text ?? '').split(';').map((d) => d.trim()).find((d) => d.startsWith(`${propietat}:`));
  return /^[\w-]+:\s*var\(\s*(--[\w-]+)\s*\)$/.exec(declaracio ?? '')?.[1] ?? null;
};

describe('P6 · el quadrat de 128 px: fons fosc d’una columna de navegació i lletra clara', () => {
  const quadrat = cos(components, '.sp-card-calendar-badge');
  const FONS = tokenDe(quadrat, 'background-color');
  const HOVER = tokenDe(cos(components, 'button.sp-card-calendar-badge:hover'), 'background-color');

  /* El color exacte l'ha anat afinant el Mestre (el negre de la barra
     principal, --sdp-crom-fons, o el grafit de la columna de navegació del
     Workspace, --sdp-workspace-nav-fons): la prova exigix que siga el d'una
     de les dues columnes de navegació, sempre amb un token, i que el text hi
     tinga contrast. */
  test('fons: un token, amb el color d’una columna de navegació; lletra --sdp-crom-text; 128 × 128', () => {
    expect(declara(cos(layout, 'nav.app-sidebar'), 'background', 'var(--sdp-crom-fons)')).toBe(true);
    expect(FONS).not.toBeNull();
    const navegacio = ['--sdp-crom-fons', '--sdp-workspace-nav-fons'].map((token) => hex(CLAR, token).toLowerCase());
    expect(navegacio).toContain(hex(CLAR, FONS).toLowerCase());
    expect(declara(quadrat, 'color', 'var(--sdp-crom-text)')).toBe(true);
    expect([declara(quadrat, 'width', '128px'), declara(quadrat, 'height', '128px')]).toEqual([true, true]);
    expect(dinsDeComponents(components, '.sp-card-calendar-badge {')).toBe(true);
  });

  test('cap color cru en les regles del quadrat, del preu i del títol', () => {
    const regles = [
      quadrat,
      cos(components, 'button.sp-card-calendar-badge:hover'),
      cos(components, FOSC_QUADRAT),
      cos(components, '.sp-card-calendar-badge__dia[data-mida]'),
      cos(components, '.sp-card-title')
    ];
    for (const text of regles) {
      expect(text).not.toBeNull();
      expect(text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(text).not.toMatch(/\b(rgba?|hsla?|oklch|color-mix)\(/i);
      /* Revisió de P6 · Llei de tokens.css (capa 1): un component no escriu
         mai una rampa primitiva. El grafit hi arriba pel crom (la closca),
         l'única porta legítima, amb el mateix hex. */
      expect(text).not.toMatch(/var\(\s*--sdp-(pedra|primary|secondary)-/);
    }
  });

  test('contrast de tot el text del quadrat ≥ 4,5:1, en clar i en fosc, també en passar-hi per damunt', () => {
    expect(HOVER).not.toBeNull();
    for (const tema of [CLAR, FOSC]) {
      /* El text gran (dia i preu) i el menut (mes) sobre el fons. */
      expect(contrast(tema, '--sdp-crom-text', FONS)).toBeGreaterThanOrEqual(7);
      /* L'any porta opacitat 0,8. */
      const any = barreja(rgb(hex(tema, '--sdp-crom-text')), rgb(hex(tema, FONS)), 0.8);
      expect(ratio(any, rgb(hex(tema, FONS)))).toBeGreaterThanOrEqual(4.5);
      /* Botó: en passar-hi per damunt. */
      expect(contrast(tema, '--sdp-crom-text', HOVER)).toBeGreaterThanOrEqual(4.5);
    }
    /* La fórmula és la de tractor-cromatic: el blanc sobre el negre del crom, 19,42:1. */
    expect(contrast(CLAR, '--sdp-crom-text', '--sdp-crom-fons').toFixed(2)).toBe('19.42');
  });

  test('anell de focus visible al costat del quadrat (sobre la targeta) i vora en fosc ≥ 3:1', () => {
    expect(contrast(CLAR, '--sdp-focus', '--sdp-fons-targeta')).toBeGreaterThanOrEqual(3);
    expect(contrast(FOSC, '--sdp-focus', '--sdp-fons-targeta')).toBeGreaterThanOrEqual(3);
    expect(declara(cos(components, FOSC_QUADRAT), 'border-color', 'var(--sdp-vora-control)')).toBe(true);
    expect(contrast(FOSC, '--sdp-vora-control', '--sdp-fons-targeta')).toBeGreaterThanOrEqual(3);
  });

  test('el preu: trams de lletra per data-mida i, si no hi cap, parteix línia dins del quadrat', () => {
    const preu = cos(components, '.sp-card-calendar-badge__dia[data-mida]');
    for (const [propietat, valor] of [['max-width', '100%'], ['overflow-wrap', 'anywhere'], ['text-align', 'center']]) {
      expect(declara(preu, propietat, valor), propietat).toBe(true);
    }
    const mides = ['mitjana', 'menuda', 'minima'].map((mida) => {
      const text = cos(components, `.sp-card-calendar-badge__dia[data-mida="${mida}"]`);
      return Number(/font-size: ([\d.]+)rem/.exec(text)[1]);
    });
    /* «gran» és la mida del dia (3.5rem): cada tram, més menut que l'anterior. */
    expect([3.5, ...mides].every((mida, i, totes) => i === 0 || mida < totes[i - 1])).toBe(true);
  });
});

describe('P6 · el títol de la targeta i l’escala d’encapçalaments', () => {
  test('tokens H1–H6 un esglaó amunt, en ordre: 3 · 2.5 · 2 · 1.75 · 1.5 · 1.25rem', () => {
    const escala = [1, 2, 3, 4, 5, 6].map((n) => CLAR.get(`--sdp-text-h${n}`));
    expect(escala).toEqual(['3rem', '2.5rem', '2rem', '1.75rem', '1.5rem', '1.25rem']);
  });

  /* El Mestre ha anat afinant el graó (h4 i després h5): la prova exigix que
     siga un token de l'escala, per davall de l'h3 de pàgina, mai una mida fixa. */
  test('.sp-card-title segueix l’escala (un --sdp-text-hN per davall de l’h3) i porta el filet de l’h3 de base.css', () => {
    const titol = cos(components, '.sp-card-title');
    const token = tokenDe(titol, 'font-size');
    expect(token).toMatch(/^--sdp-text-h[4-6]$/);
    const rem = (nom) => Number(CLAR.get(nom).replace('rem', ''));
    expect(rem(token)).toBeLessThan(rem('--sdp-text-h3'));
    /* Un esglaó amunt respecte del 1.4rem fix d'abans. */
    expect(rem(token)).toBeGreaterThan(1.4);
    expect(titol).not.toMatch(/font-size: [\d.]+rem/);
    const h3 = cos(net(llig('src/css/base.css')), 'h3, .h3');
    expect(declara(h3, 'border-bottom', '1px solid var(--sdp-vora)')).toBe(true);
    expect(declara(titol, 'border-bottom', '1px solid var(--sdp-vora)')).toBe(true);
    /* 12px = --sdp-space-3, el coixí de l'h3. */
    expect(declara(h3, 'padding-bottom', '12px')).toBe(true);
    expect(declara(titol, 'padding-bottom', 'var(--sdp-space-3)')).toBe(true);
    expect(CLAR.get('--sdp-space-3')).toBe('12px');
    /* Derogat per l'ordre del Mestre del 261004 (D-C, xat 06:38) · el títol
       porta l'interlineat de títol (1.2), no el de component (1.15). */
    expect(declara(titol, 'line-height', 'var(--sdp-leading-titol)')).toBe(true);
  });
});

test('P6 · el gran botó de les pàgines: aire amb l’escala d’espais, dins de @layer components', () => {
  const accio = cos(components, '.sdp-pagina-accio');
  expect(declara(accio, 'margin-block', 'var(--sdp-space-8) var(--sdp-space-10)')).toBe(true);
  expect(dinsDeComponents(components, '.sdp-pagina-accio {')).toBe(true);
});
