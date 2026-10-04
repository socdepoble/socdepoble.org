/**
 * C4 · Capçaleres de columna d'AppGridShell a AAA (Q1 del Mestre: AAA sempre,
 * en tots els modes).
 *
 * Mesura al navegador (261004, /notes, /disseny i /app/nevera; clar, fosc,
 * Bancal i Bancal fosc, idèntica en els quatre perquè el crom no canvia):
 * el text de les capçaleres anava en --sdp-crom-actiu-fons, el taronja cànon,
 * que és un token de FONS (el de l'entrada activa, amb --sdp-crom-actiu-text
 * damunt). Com a lletra de 16px/600 sobre el crom feia
 *   · 4,11:1 sobre Grafit 700 (capçalera base: apps, Admin),
 *   · 4,98:1 sobre Pissarra 750 (fila 2 del Workspace: «Tot»),
 *   · 5,91:1 sobre Carbó 800 (fila 1: NOTES, DISSENY, Converses),
 * i l'opció activa del menú d'ordenació, 4,11:1. Cap arribava a 7:1.
 *
 * El text passa a --sdp-crom-text, el token de lletra del crom; les icones
 * conserven el taronja (objectes no textuals, WCAG 1.4.11: 3:1 o més).
 * Els anells de focus de la capçalera pintaven --sdp-focus, que canvia amb el
 * tema: en clar, Blau 700 sobre el crom, 1,47:1 (mesurat amb Tab sobre «Tot»).
 * Passen a --sdp-crom-focus, l'anell de la closca. La prova llig els fulls de
 * veres i resol els tokens fins al hex.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const GRAELLA = senseComentaris(llig('src/components/layout/AppGridShell.css'));
const MODULES = senseComentaris(llig('src/css/modules.css'));

const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}
const CLAR = { ...declaracions(CANON), ...declaracions(bloc(TOKENS, ':root, :host, .sdp-root')) };
const FOSC = { ...CLAR, ...declaracions(bloc(TOKENS, ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root')) };
const B = declaracions(bloc(TOKENS, ':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root'));
const BF = declaracions(bloc(TOKENS, ':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root'));
const MODES = {
  clar: CLAR,
  fosc: FOSC,
  bancal: { ...CLAR, ...B },
  'bancal fosc': { ...FOSC, ...B, ...BF }
};

function hex(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}
/** Un color opac de sis xifres; un rgba() es compon sobre el fons opac. */
function opac(valor, fons) {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(valor);
  if (!m) return valor;
  const alfa = Number(m[4]);
  const base = fons.slice(1).match(/../g).map((x) => parseInt(x, 16));
  return `#${[1, 2, 3].map((i, k) => Math.round(Number(m[i]) * alfa + base[k] * (1 - alfa)).toString(16).padStart(2, '0')).join('')}`;
}
function lum(h) {
  expect(h, 'color opac de sis xifres').toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = h.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [la, lb] = [lum(a), lum(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
/** Contrast d'una lletra (token) sobre un fons (token) en un mode. */
const contrast = (color, fons, mapa) => {
  const f = hex(fons, mapa);
  return ratio(opac(hex(color, mapa), f), f);
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Les declaracions de color i fons de la regla `selector { … }` (selector exacte). */
function regla(full, selector) {
  const patro = esc(selector).replace(/,\\n|,\n/g, ',\\s*');
  const m = new RegExp(`(?:^|\\n)[ \\t]*${patro}\\s*\\{([^}]*)\\}`).exec(full);
  expect(m, `falta la regla ${selector}`).not.toBeNull();
  return Object.fromEntries([...m[1].matchAll(/(?:^|;)\s*(background(?:-color)?|color)\s*:\s*([^;]+)/g)]
    .map(([, prop, valor]) => [prop.replace('background-color', 'background'), valor.trim()]));
}

/* Els fons de capçalera de columna: la base, --dark i --dark-intens
   (AppGridShell.css), les dues files i el carril del Workspace i la gradació
   de la columna esquerra (modules.css). Tots són crom: no canvien amb el tema. */
const FONS_CAPCALERA = [
  'var(--sdp-crom-capcalera)',
  'var(--sdp-crom-subcapcalera)',
  'var(--sdp-crom-subcapcalera-fosca)',
  'var(--sdp-crom-capcalera-profunda)',
  'var(--sdp-workspace-fila1-fons)',
  'var(--sdp-workspace-fila2-fons)',
  'var(--sdp-workspace-nav-fons)'
];

/** Fons declarats per a l'element capçalera (no els seus fills) en un full. */
function fonsDeCapcalera(full) {
  const eixida = [];
  for (const m of full.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelud = m[1].split(';').pop().trim();
    if (!prelud || prelud.startsWith('@')) continue;
    const delElement = prelud.split(',').map((s) => s.trim()).some((s) => {
      const ultim = s.split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
      return /\.app-grid-col-header(?![\w-]*__)/.test(ultim) && !/\.app-grid-col-header__/.test(ultim);
    });
    if (!delElement) continue;
    const fons = /(?:^|;)\s*background(?:-color)?\s*:\s*(var\(--[\w-]+\))\s*(?:;|$)/.exec(m[2]);
    if (fons) eixida.push(`${prelud.replace(/\s+/g, ' ')} → ${fons[1]}`);
  }
  return eixida;
}

describe('C4 · el cens de fons de capçalera és el que mesura la prova', () => {
  test('cada fons pla que AppGridShell.css i modules.css donen a una capçalera és a FONS_CAPCALERA', () => {
    const trobats = [...fonsDeCapcalera(GRAELLA), ...fonsDeCapcalera(MODULES)];
    expect(trobats.length).toBeGreaterThan(5);
    const fora = trobats.filter((t) => !FONS_CAPCALERA.includes(t.split(' → ')[1]));
    expect(fora).toEqual([]);
  });
});

describe('C4 · el text de les capçaleres de columna fa 7:1 o més sobre tots els fons i en tots els modes', () => {
  const TEXTOS = [
    ['títol de columna', '.app-grid-col-header__titol'],
    ['rètol de les accions de text i del títol plegable', '.app-grid-col-header__accio-text > span,\n.app-grid-col-header__plegable .sdp-workspace-nav-item__label']
  ];
  for (const [nom, selector] of TEXTOS) {
    test(nom, () => {
      const { color } = regla(GRAELLA, selector);
      expect(color, `${selector} declara color`).toBeDefined();
      for (const [mode, mapa] of Object.entries(MODES)) {
        for (const fons of FONS_CAPCALERA) {
          expect(contrast(color, fons, mapa), `${nom} · ${fons} · ${mode}`).toBeGreaterThanOrEqual(7);
        }
      }
    });
  }

  test('el text no pinta amb un token de fons: --sdp-crom-actiu-fons és el fons de l’entrada activa', () => {
    for (const [, selector] of TEXTOS) {
      expect(regla(GRAELLA, selector).color).not.toMatch(/--sdp-crom-actiu-fons/);
    }
  });
});

describe('C4 · menú d’ordenació: AAA en repòs, actiu i hover', () => {
  test('títol, opció i opció activa, 7:1 o més sobre el seu fons en tots els modes', () => {
    const menu = regla(GRAELLA, '.sdp-workspace-sort-menu').background;
    const titol = regla(GRAELLA, '.sdp-workspace-sort-menu__title').color;
    const opcio = regla(GRAELLA, '.sdp-workspace-sort-menu__option').color;
    const actiu = regla(GRAELLA, '.sdp-workspace-sort-menu__option.active');
    for (const [mode, mapa] of Object.entries(MODES)) {
      expect(contrast(titol, menu, mapa), `títol · ${mode}`).toBeGreaterThanOrEqual(7);
      expect(contrast(opcio, menu, mapa), `opció · ${mode}`).toBeGreaterThanOrEqual(7);
      expect(contrast(actiu.color, actiu.background ?? menu, mapa), `activa · ${mode}`).toBeGreaterThanOrEqual(7);
    }
  });

  test('l’opció activa no es distingix només pel color de la lletra: porta cel·la pròpia', () => {
    const actiu = regla(GRAELLA, '.sdp-workspace-sort-menu__option.active');
    expect(actiu.background).toBeDefined();
    expect(actiu.background).not.toBe(regla(GRAELLA, '.sdp-workspace-sort-menu').background);
  });

  test('en passar el ratolí per damunt de l’opció activa, el contrast continua AAA', () => {
    const actiu = regla(GRAELLA, '.sdp-workspace-sort-menu__option.active');
    const hover = regla(GRAELLA, '.sdp-workspace-sort-menu__option.active:hover');
    for (const [mode, mapa] of Object.entries(MODES)) {
      expect(contrast(hover.color ?? actiu.color, hover.background, mapa), `activa · hover · ${mode}`).toBeGreaterThanOrEqual(7);
    }
  });
});

/** El color de l'anell (outline o outline-color) de la regla `selector`. */
function anell(full, selector) {
  const patro = esc(selector).replace(/,\\n|,\n/g, ',\\s*');
  const m = new RegExp(`(?:^|\\n)[ \\t]*${patro}\\s*\\{([^}]*)\\}`).exec(full);
  expect(m, `falta la regla ${selector}`).not.toBeNull();
  const decl = /(?:^|;)\s*outline(?:-color)?\s*:[^;]*?(var\(--[\w-]+\))/.exec(m[1]);
  expect(decl, `${selector} declara el color de l'anell`).not.toBeNull();
  return decl[1];
}

describe('C4 · els anells de focus de la capçalera es veuen sobre el crom en tots els modes', () => {
  const GRUP = '.app-grid-col-header .btn-icon:focus-visible,\n.app-grid-col-header__accio:focus-visible,\n'
    + '.app-grid-col-header__accio-icon:focus-visible,\n.app-grid-col-header__accio-text:focus-visible,\n'
    + '.univ-manager-inbox-header-btn:focus-visible,\n.univ-manager-header-search-trigger:focus-visible,\n'
    + '.univ-manager-header-search input:focus-visible';
  const ANELLS = [
    ['capçalera replegable', '.app-grid-col-header--replegable:focus-visible'],
    ['títol amb icona', '.app-grid-col-header__plec:focus-visible'],
    ['botons de la capçalera', GRUP]
  ];

  test('l’anell general (--sdp-focus) no servix sobre el crom: en clar no arriba a 3:1', () => {
    // La raó del canvi: --sdp-focus canvia amb el tema i la capçalera no.
    expect(contrast('var(--sdp-focus)', 'var(--sdp-workspace-fila2-fons)', MODES.clar)).toBeLessThan(3);
    expect(contrast('var(--sdp-focus)', 'var(--sdp-crom-capcalera)', MODES.clar)).toBeLessThan(3);
  });

  for (const [nom, selector] of ANELLS) {
    test(`${nom}: 3:1 o més sobre tots els fons de capçalera`, () => {
      const color = anell(GRAELLA, selector);
      expect(color).not.toBe('var(--sdp-focus)');
      for (const [mode, mapa] of Object.entries(MODES)) {
        for (const fons of FONS_CAPCALERA) {
          expect(contrast(color, fons, mapa), `${nom} · ${fons} · ${mode}`).toBeGreaterThanOrEqual(3);
        }
      }
    });
  }

  test('dins del botó blau de control (CREAR), l’anell també fa 3:1 o més', () => {
    const color = anell(GRAELLA, GRUP);
    const fons = regla(GRAELLA, '.app-grid-col-header__accio').background;
    for (const [mode, mapa] of Object.entries(MODES)) {
      expect(contrast(color, fons, mapa), mode).toBeGreaterThanOrEqual(3);
    }
  });

  test('opcions del menú d’ordenació: l’anell fa 3:1 o més sobre el fons del menú', () => {
    const color = anell(GRAELLA, '.sdp-workspace-sort-menu__option:focus-visible');
    const menu = regla(GRAELLA, '.sdp-workspace-sort-menu').background;
    for (const [mode, mapa] of Object.entries(MODES)) {
      expect(contrast(color, menu, mapa), mode).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('C4 · les icones de capçalera conserven el taronja i el mínim no textual', () => {
  test('3:1 o més (WCAG 1.4.11) sobre tots els fons i en tots els modes', () => {
    const SELECTORS = [
      '.app-grid-col-header .btn-icon,\n.app-grid-col-header .btn-icon:hover:not(:disabled),\n.app-grid-col-header .btn-icon:active:not(:disabled),\n.app-grid-col-header__accio-icon,\n.app-grid-col-header__accio-icon:hover:not(:disabled)',
      '.app-grid-col-header__plec'
    ];
    for (const selector of SELECTORS) {
      const { color } = regla(GRAELLA, selector);
      expect(color).toBe('var(--sdp-crom-actiu-fons)');
      for (const [mode, mapa] of Object.entries(MODES)) {
        for (const fons of FONS_CAPCALERA) {
          expect(contrast(color, fons, mapa), `${selector} · ${fons} · ${mode}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});
