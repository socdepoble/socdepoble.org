/**
 * Revisió R1 · contrast i Bancal (pla 261004_0050, Q1 del Mestre: AAA sempre).
 *
 * Text blanc sobre el blau de marca (--sdp-accio, #0984E3) fa 3,87:1: ni AA
 * per a text de 16px o menys. La superfície de control amb text blanc és
 * --sdp-accio-control (9,21:1) i el seu hover, --sdp-accio-control-hover
 * (7,20:1), estables en clar i en fosc: el mateix parell de .sdp-boto--primari,
 * de CONNECTAR, de la píndola premuda i del .sdp-boto del Perfil.
 *
 * I cap hover baixa de banda: en fosc --sdp-accio-hover és un blau clar
 * (secondary-400) i la icona blanca hi feia 2,66:1, per davall del 3:1 de
 * WCAG 1.4.11. L'any del quadrat (opacitat 0,8) passava de 7,84:1 a 5,37:1.
 *
 * La prova llig els fulls de veres i resol els tokens fins al hex en els
 * quatre modes: clar, fosc, Bancal i Bancal fosc.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const MODULES = senseComentaris(llig('src/css/modules.css'));
const COMPONENTS = senseComentaris(llig('src/css/components.css'));

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
const CLARS = ['clar', 'bancal'];
const FOSCS = ['fosc', 'bancal fosc'];

function hex(valor, mapa, vistos = new Set()) {
  const net = valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
  return net;
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
/** El blanc a una opacitat sobre un fons opac, en hex. */
function sobre(fons, alfa) {
  const canals = fons.slice(1).match(/../g).map((x) => parseInt(x, 16));
  return `#${canals.map((c) => Math.round(255 * alfa + c * (1 - alfa)).toString(16).padStart(2, '0')).join('')}`;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Les declaracions de la regla `selector { … }` (selector exacte; els salts de línia entre selectors, lliures). */
function regla(full, selector) {
  const patro = esc(selector).replace(/,\\n|,\n/g, ',\\s*');
  const m = new RegExp(`(?:^|\\n)[ \\t]*${patro}\\s*\\{([^}]*)\\}`).exec(full);
  expect(m, `falta la regla ${selector}`).not.toBeNull();
  return Object.fromEntries([...m[1].matchAll(/(?:^|;)\s*(background(?:-color)?|color|opacity)\s*:\s*([^;]+)/g)]
    .map(([, prop, valor]) => [prop.replace('background-color', 'background'), valor.trim()]));
}

describe('text blanc sobre una superfície blava: 7:1 o més (Q1, AAA sempre)', () => {
  const CASOS = [
    ['píndola de Sistema (clar)', MODULES, '.sdp-badge-system', CLARS],
    ['píndola d’accent (fosc)', MODULES, ':root[data-theme="dark"] .sdp-badge-accent,\n:host([data-theme="dark"]) .sdp-badge-accent', FOSCS],
    ['comptador de no llegits del Xat', MODULES, '.sdp-xat-pastilla', [...CLARS, ...FOSCS]],
    ['píndola d’acció del Xat', MODULES, '.sdp-xat-pindola', [...CLARS, ...FOSCS]],
    ['botonera de classificació i drets d’autor', MODULES, '.sdp-classificacio-botonera > .sdp-boto, .sdp-copyright-selector', [...CLARS, ...FOSCS]]
  ];
  for (const [nom, full, selector, modes] of CASOS) {
    test(`${nom}: el text i el fons`, () => {
      const r = regla(full, selector);
      for (const mode of modes) {
        const mapa = MODES[mode];
        expect(ratio(hex(r.color, mapa), hex(r.background, mapa)), `${nom} · ${mode}`).toBeGreaterThanOrEqual(7);
      }
    });
  }

  for (const [nom, full, repos, hover] of [
    ['píndola d’acció del Xat', MODULES, '.sdp-xat-pindola', '.sdp-xat-pindola:hover']
  ]) {
    test(`${nom}: el hover continua AAA en tots els modes`, () => {
      const color = regla(full, repos).color;
      const fons = regla(full, hover).background;
      for (const [mode, mapa] of Object.entries(MODES)) {
        expect(ratio(hex(color, mapa), hex(fons, mapa)), `${nom} · hover · ${mode}`).toBeGreaterThanOrEqual(7);
      }
    });
  }
});

describe('cap hover baixa de banda', () => {
  for (const [nom, repos, hover] of [
    ['descàrrega', '.download-card-btn', '.download-card-btn:hover'],
    ['Conversa nova (+)', '.sdp-xat-nova', '.sdp-xat-nova:hover'],
    ['Enviar del compositor', '.sdp-xat-compositor__envia', '.sdp-xat-compositor__envia:hover:not(:disabled)']
  ]) {
    test(`icona blanca de «${nom}»: 3:1 o més en hover i mai menys que en repòs`, () => {
      const r = regla(MODULES, repos);
      const fonsHover = regla(MODULES, hover).background;
      for (const [mode, mapa] of Object.entries(MODES)) {
        const icona = hex(r.color, mapa);
        const enRepos = ratio(icona, hex(r.background, mapa));
        const enHover = ratio(icona, hex(fonsHover, mapa));
        expect(enHover, `${nom} · ${mode}`).toBeGreaterThanOrEqual(3);
        expect(enHover, `${nom} · ${mode}`).toBeGreaterThanOrEqual(enRepos - 1e-9);
      }
    });
  }

  test('la paperera d’un fitxer: el roig del hover continua AAA sobre la targeta, també en fosc', () => {
    const repos = regla(MODULES, '.file-item-action').color;
    const hover = regla(MODULES, '.file-item-action:hover').color;
    for (const [mode, mapa] of Object.entries(MODES)) {
      const targeta = hex('var(--sdp-fons-targeta)', mapa);
      expect(ratio(hex(repos, mapa), targeta), `repòs · ${mode}`).toBeGreaterThanOrEqual(7);
      // Abans: --sdp-error, que no canvia amb el tema: 2,94:1 en fosc.
      expect(ratio(hex(hover, mapa), targeta), `hover · ${mode}`).toBeGreaterThanOrEqual(7);
    }
  });

  test('l’any del quadrat-botó: opac en passar-hi per damunt, AAA sobre el grafit clar', () => {
    const repos = regla(COMPONENTS, '.sp-card-calendar-badge__any');
    const hover = regla(COMPONENTS, 'button.sp-card-calendar-badge:hover .sp-card-calendar-badge__any');
    expect(Number(repos.opacity)).toBeLessThan(1);
    expect(hover.opacity).toBe('1');
    const fonsHover = regla(COMPONENTS, 'button.sp-card-calendar-badge:hover').background;
    for (const [mode, mapa] of Object.entries(MODES)) {
      const fons = hex(fonsHover, mapa);
      expect(ratio(hex('var(--sdp-crom-text)', mapa), fons), mode).toBeGreaterThanOrEqual(7);
      // Abans: el blanc al 80 % sobre el grafit clar, 5,37:1.
      expect(ratio(sobre(fons, Number(repos.opacity)), fons), mode).toBeLessThan(7);
    }
  });
});
