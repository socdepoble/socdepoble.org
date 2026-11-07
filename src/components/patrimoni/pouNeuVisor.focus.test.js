/**
 * Bucle 5 (Onada R11) · El contorn del focus del visor únic del Pou de Neu.
 *  · A11Y-04 · Els controls del visor (el coixinet dins de la vista i, a pantalla completa, el HUD
 *    damunt de la vista) tenen el pergamí darrere. Amb --sdp-accio el contorn feia 2,91:1 sobre el
 *    pergamí clar (WCAG 1.4.11 en demana 3:1). Ara és --sdp-focus, el de tot el sistema: la prova
 *    resol els tokens fins al hex (també els color-mix) en clar i en fosc.
 *  · A11Y-05 · La columna desplaçable del HUD a l'escriptori no retalla el contorn (3 px + 3 px) i
 *    la vista deixa marge quan el focus hi arriba amb Tab.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
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

const canals = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16));
const aHex = (c) => `#${c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
/** Resol un valor de token fins a un hex opac: var() i color-mix(in srgb, A p%, B). */
function hex(valor, mapa, vistos = new Set()) {
  const net = valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
  const m = /^color-mix\(in srgb,\s*(#[0-9a-f]{6})\s*(\d+(?:\.\d+)?)?%?\s*,\s*(#[0-9a-f]{6})\s*(\d+(?:\.\d+)?)?%?\s*\)$/i.exec(net);
  if (!m) { expect(net, 'color opac de sis xifres').toMatch(/^#[0-9a-f]{6}$/i); return net.toLowerCase(); }
  const pa = m[2] !== undefined ? Number(m[2]) : 100 - Number(m[4] ?? 50);
  const [a, b] = [canals(m[1]), canals(m[3])];
  return aHex(a.map((x, i) => (x * pa + b[i] * (100 - pa)) / 100));
}
function lum(h) {
  const [r, g, b] = canals(h).map((x) => x / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const regles = [...COMPONENTS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, cos]) => ({ sel: sel.trim(), cos }));

describe('visor del Pou de Neu · contorn del focus (bucle 5)', () => {
  test('A11Y-04 · --sdp-focus fa 3:1 o més sobre el pergamí del visor i sobre la targeta, en clar i en fosc', () => {
    for (const [tema, mapa] of [['clar', CLAR], ['fosc', FOSC]]) {
      const focus = hex('var(--sdp-focus)', mapa);
      for (const fons of ['--sdp-pou-pergami', '--sdp-fons-targeta']) {
        expect(ratio(focus, hex(`var(${fons})`, mapa)), `${tema} · ${fons}`).toBeGreaterThanOrEqual(3);
      }
    }
    // El d'abans no hi arribava: per això es canvia.
    expect(ratio(hex('var(--sdp-accio)', CLAR), hex('var(--sdp-pou-pergami)', CLAR))).toBeLessThan(3);
  });

  test('A11Y-04 · tots els :focus-visible del visor fan servir --sdp-focus (cap --sdp-accio)', () => {
    const focus = regles.filter(({ sel }) => /pou-neu/.test(sel) && /:focus-visible/.test(sel));
    expect(focus.length).toBeGreaterThanOrEqual(3);
    for (const { sel, cos } of focus) {
      expect(cos, sel).toMatch(/outline:\s*3px solid var\(--sdp-focus\)/);
      expect(cos, sel).not.toMatch(/--sdp-accio/);
    }
  });

  test('A11Y-05 · la columna del HUD deixa lloc al contorn i la vista deixa marge en arribar-hi amb Tab', () => {
    const FS = ':is(.pou-neu-card.is-fullscreen, .pou-neu-card:fullscreen)';
    const hud = regles.filter(({ sel, cos }) => sel === `${FS} .pou-neu-hud:not([hidden])` && /overflow-y:\s*auto/.test(cos));
    expect(hud.length).toBe(1);
    expect(hud[0].cos).toMatch(/padding:\s*var\(--sdp-space-2\)/);
    expect(regles.some(({ sel, cos }) => sel === '.pou-neu-interior__vista, .pou-neu-card :is(button, input, select, summary)' && /scroll-margin-block:\s*var\(--sdp-space-2\)/.test(cos))).toBe(true);
    // 8 px (--sdp-space-2) ≥ 3 px de contorn + 3 px de separació.
    expect(CLAR['--sdp-space-2']).toBe('8px');
  });
});
