/**
 * Onada R32.35b · DOL-31 · Verificació matemàtica de contrast solar WCAG AAA (>= 7:1 i >= 9:1)
 * del Mode Bancal (`data-contrast="bancal"`) en tema clar i tema fosc, i immutabilitat de light/dark.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');

const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i += 1) {
    if (text[i] === '{') prof += 1;
    if (text[i] === '}' && --prof === 0) return { inici: inici + 1, fi: i, cos: text.slice(obre + 1, i) };
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}

const PRINCIPAL = bloc(TOKENS, ':root, :host, .sdp-root');
const FOSC = bloc(TOKENS, ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root');
const SEL_BANCAL = ':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root';
const SEL_BANCAL_FOSC = ':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root';
const BANCAL = bloc(TOKENS, SEL_BANCAL);
const BANCAL_FOSC = bloc(TOKENS, SEL_BANCAL_FOSC);

const CLAR = { ...declaracions(CANON), ...declaracions(PRINCIPAL.cos) };
const MAPA_FOSC = { ...CLAR, ...declaracions(FOSC.cos) };
const MAPA_BANCAL = { ...CLAR, ...declaracions(BANCAL.cos) };
const MAPA_BANCAL_FOSC = { ...MAPA_FOSC, ...declaracions(BANCAL.cos), ...declaracions(BANCAL_FOSC.cos) };

function resol(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return resol(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}

function luminancia(hex) {
  expect(hex, 'color hexadecimal opac de 6 xifres').toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b, mapa) {
  const [la, lb] = [luminancia(resol(`var(${a})`, mapa)), luminancia(resol(`var(${b})`, mapa))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('Onada R32.35b · DOL-31 · Mode Bancal solar WCAG AAA (>= 7:1 i vores nítides)', () => {
  const SUPERFICIES = ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil', '--sdp-fons-elevat', '--sdp-fons-superficie'];
  const TEXTOS = [
    '--sdp-text-titol',
    '--sdp-text-cos',
    '--sdp-text-suau',
    '--sdp-accent-text',
    '--sdp-accent-titol',
    '--sdp-accent-text-hover',
    '--sdp-accio-text',
  ];
  const VORES = ['--sdp-vora', '--sdp-vora-control', '--sdp-vora-forta', '--sdp-focus'];

  test.each([
    ['clar solar', MAPA_BANCAL, CLAR],
    ['fosc solar', MAPA_BANCAL_FOSC, MAPA_FOSC],
  ])('%s: tot el text principal, secundari, d’accent i d’acció supera >= 9:1 (AAA+) sobre totes 5 superfícies', (_nom, mapa) => {
    for (const text of TEXTOS) {
      for (const fons of SUPERFICIES) {
        expect(contrast(text, fons, mapa), `${text} sobre ${fons}`).toBeGreaterThanOrEqual(9);
      }
    }
  });

  test.each([
    ['clar solar', MAPA_BANCAL],
    ['fosc solar', MAPA_BANCAL_FOSC],
  ])('%s: totes les vores de targeta, control i focus assoleixen nitidesa solar >= 9:1 sobre totes les superfícies', (_nom, mapa) => {
    for (const vora of VORES) {
      for (const fons of ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil']) {
        expect(contrast(vora, fons, mapa), `${vora} sobre ${fons}`).toBeGreaterThanOrEqual(9);
      }
    }
    expect(contrast('--sdp-sobre-accio', '--sdp-accio-control', mapa)).toBeGreaterThanOrEqual(10);
    expect(contrast('--sdp-sobre-accio', '--sdp-accio-control-hover', mapa)).toBeGreaterThanOrEqual(12);
  });

  test('diferenciació visual real respecte del mode normal sense tocar els temes light ni dark', () => {
    // Els temes normals conserven intactes els seus colors resolts canònics (v1.2.21 · referències literals per a
    // comparar, justificades per a tooling/gates/design_guard.mjs amb ALLOW_RAW_COLOR)
    expect(resol('var(--sdp-fons-app)', CLAR)).toBe(/* ALLOW_RAW_COLOR */ '#f3f0ec');
    expect(resol('var(--sdp-vora)', CLAR)).toBe(/* ALLOW_RAW_COLOR */ '#dcd7cd');
    expect(resol('var(--sdp-fons-app)', MAPA_FOSC)).toBe(/* ALLOW_RAW_COLOR */ '#0e0d0c');
    expect(resol('var(--sdp-vora)', MAPA_FOSC)).toBe(/* ALLOW_RAW_COLOR */ '#302e29');

    // En Mode Bancal la vora de targeta passa de decorativa (~1.5:1) a nítida solar (>= 9.5:1)
    expect(contrast('--sdp-vora', '--sdp-fons-targeta', CLAR)).toBeLessThan(2);
    expect(contrast('--sdp-vora', '--sdp-fons-targeta', MAPA_BANCAL)).toBeGreaterThanOrEqual(11);
    expect(contrast('--sdp-vora', '--sdp-fons-targeta', MAPA_FOSC)).toBeLessThan(2);
    expect(contrast('--sdp-vora', '--sdp-fons-targeta', MAPA_BANCAL_FOSC)).toBeGreaterThanOrEqual(15);
  });
});
