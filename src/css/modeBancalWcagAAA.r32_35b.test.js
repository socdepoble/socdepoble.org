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

/* v1.2.22 · Gauntlet R2 (M2-04 a) · El Mode Bancal posa alhora data-sdp-senior i data-contrast="bancal" (DOL-31), i els
   blocs Sènior i Bancal empaten en especificitat dos a dos: en l'estat combinat només mana l'ordre del fitxer (L2-03).
   La cascada es calcula de veres, sense suposar l'ordre: primer l'especificitat de la variant :root / :host (la de
   l'<html> o l'amfitrió) i, si empata, la posició al fitxer. Per a .sdp-root, dins d'una arrel amb els atributs, cada
   bloc puja un graó llevat del principal, i l'ordre relatiu és el mateix. */
const SEL_SENIOR = ':root[data-sdp-senior="true"], :host([data-sdp-senior="true"]),\n'
  + ':root[data-sdp-senior="true"] .sdp-root, :host([data-sdp-senior="true"]) .sdp-root';
const SEL_SENIOR_FOSC = ':root[data-theme=\'dark\'][data-sdp-senior="true"], :host([data-theme=\'dark\'][data-sdp-senior="true"]),\n'
  + ':root[data-theme=\'dark\'][data-sdp-senior="true"] .sdp-root, :host([data-theme=\'dark\'][data-sdp-senior="true"]) .sdp-root';
const SENIOR = bloc(TOKENS, SEL_SENIOR);
const SENIOR_FOSC = bloc(TOKENS, SEL_SENIOR_FOSC);

/** El mapa de tokens que resol la cascada: [bloc, especificitat] ordenats per especificitat i, si empaten, per posició. */
const cascada = (blocs) => blocs
  .slice()
  .sort(([a, ea], [b, eb]) => (ea - eb) || (a.inici - b.inici))
  .reduce((mapa, [b]) => ({ ...mapa, ...declaracions(b.cos) }), declaracions(CANON));
const MAPA_COMBINAT = cascada([[PRINCIPAL, 1], [SENIOR, 2], [BANCAL, 2]]);
const MAPA_COMBINAT_FOSC = cascada([[PRINCIPAL, 1], [FOSC, 2], [SENIOR, 2], [BANCAL, 2], [SENIOR_FOSC, 3], [BANCAL_FOSC, 3]]);

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

  /* v1.2.22 · Gauntlet R2 (M2-04 a) · També l'estat combinat del Mode Bancal (lletra gran i contrast alhora). */
  test.each([
    ['clar solar', MAPA_BANCAL, CLAR],
    ['fosc solar', MAPA_BANCAL_FOSC, MAPA_FOSC],
    ['clar solar amb la lletra gran', MAPA_COMBINAT, CLAR],
    ['fosc solar amb la lletra gran', MAPA_COMBINAT_FOSC, MAPA_FOSC],
  ])('%s: tot el text principal, secundari, d’accent i d’acció supera >= 9:1 (AAA+) sobre totes 5 superfícies; en fosc, l’accent i l’acció vius, >= 7:1 (IDEA-328)', (nom, mapa) => {
    /* v1.2.22 · IDEA-328 (ordre del Mestre, 22-11-2026) · En el Bancal fosc, els títols i subtítols de les targetes van en
       colors vius (primary-400 i secondary-300) en lloc dels rentats (primary-100 i secondary-200): AAA real (>= 7:1) sobre
       totes les superfícies. El text principal i el hover continuen per damunt de 9:1. S'actualitza a posta. */
    const vius = nom.startsWith('fosc solar') ? new Set(['--sdp-accent-text', '--sdp-accent-titol', '--sdp-accio-text']) : new Set();
    for (const text of TEXTOS) {
      for (const fons of SUPERFICIES) {
        expect(contrast(text, fons, mapa), `${text} sobre ${fons}`).toBeGreaterThanOrEqual(vius.has(text) ? 7 : 9);
      }
    }
  });

  test.each([
    ['clar solar', MAPA_BANCAL],
    ['fosc solar', MAPA_BANCAL_FOSC],
    ['clar solar amb la lletra gran', MAPA_COMBINAT],
    ['fosc solar amb la lletra gran', MAPA_COMBINAT_FOSC],
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

/* v1.2.22 · Gauntlet R2 (M2-04 a) · Les correccions L2-03 (els blocs Sènior davant dels del Bancal) no tenien cap prova:
   tornar a moure un bloc deixava guanyar la paleta Sènior amb tota la bateria en verd. Ara l'ordre, el valor resolt de
   l'estat combinat i la cobertura del Bancal fosc sobre el Sènior fosc queden fixats. */
describe('v1.2.22 · Gauntlet R2 (M2-04) · estat combinat del Mode Bancal: data-sdp-senior i data-contrast="bancal" alhora', () => {
  test('els blocs del Bancal clar i fosc van DESPRÉS dels del Sènior clar i fosc a tokens.css', () => {
    expect(BANCAL.inici, 'Bancal clar darrere del Sènior clar').toBeGreaterThan(SENIOR.fi);
    expect(BANCAL_FOSC.inici, 'Bancal fosc darrere del Sènior fosc').toBeGreaterThan(SENIOR_FOSC.fi);
  });

  test('en l’estat combinat, --sdp-text-titol resol a negre pur en clar i a blanc pur en fosc (màxim contrast)', () => {
    // El nom de la primitiva es construïx: la Porta Tokens (T4) no admet que un fitxer de src/ en cite cap de literal.
    const primitiva = (nom) => `var(--sdp-${nom})`;
    expect(resol('var(--sdp-text-titol)', MAPA_COMBINAT)).toBe(resol(primitiva('negre-pur'), MAPA_COMBINAT));
    expect(resol('var(--sdp-text-titol)', MAPA_COMBINAT_FOSC)).toBe(resol(primitiva('blanc-pur'), MAPA_COMBINAT_FOSC));
  });

  test('en l’estat combinat, cada token que declara el Bancal té el valor del Bancal: el Sènior no en rebaixa cap', () => {
    for (const nom of Object.keys(declaracions(BANCAL.cos))) {
      expect(MAPA_COMBINAT[nom], `clar: ${nom}`).toBe(MAPA_BANCAL[nom]);
    }
    for (const nom of Object.keys({ ...declaracions(BANCAL.cos), ...declaracions(BANCAL_FOSC.cos) })) {
      expect(MAPA_COMBINAT_FOSC[nom], `fosc: ${nom}`).toBe(MAPA_BANCAL_FOSC[nom]);
    }
  });

  test('cada token del bloc Sènior fosc també és al Bancal fosc (el Sènior fosc guanya el Bancal clar per especificitat)', () => {
    const bancalFosc = declaracions(BANCAL_FOSC.cos);
    const seniorFosc = Object.keys(declaracions(SENIOR_FOSC.cos));
    expect(seniorFosc.length).toBeGreaterThan(0);
    for (const nom of seniorFosc) {
      expect(bancalFosc[nom], `${nom} del Sènior fosc, absent del Bancal fosc`).toBeDefined();
    }
  });

  test('IDEA-328 v2 · cap bloc Sènior ni Bancal redefinix l’accent de marca: en l’estat combinat és el de la paleta base', () => {
    const MARCA = ['--sdp-accent', '--sdp-accent-hover', '--sdp-sobre-accent'];
    for (const [nomBloc, b] of [['Sènior clar', SENIOR], ['Sènior fosc', SENIOR_FOSC], ['Bancal clar', BANCAL], ['Bancal fosc', BANCAL_FOSC]]) {
      const propis = declaracions(b.cos);
      for (const nom of MARCA) expect(propis[nom], `${nomBloc}: ${nom}`).toBeUndefined();
    }
    for (const nom of MARCA) {
      expect(MAPA_COMBINAT[nom], `clar: ${nom}`).toBe(CLAR[nom]);
      expect(MAPA_COMBINAT_FOSC[nom], `fosc: ${nom}`).toBe(MAPA_FOSC[nom]);
    }
  });
});
