/* Onada 11 (261010; prompt 261010_1730, tasca 2) · estil.js: la llista tancada,
   el cànon contra tokens.css, la validació (injecció, contrast baix, token
   fora de la llista, radi fora de l'escala) i la serialització (buit → ''). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { esHex6 } from './contrast.js';
import {
  CANON, CANON_RADIS, CONTRAST_MINIM, ESCALA_RADIS, PARELLS_DE_CONTRAST, TOKENS_EDITABLES, VERSIO_ESTIL,
  ambCrom, contrastosDe, cromValid, cssDePersonalitzacio, declaracionsDe, normalitzaTo, validaEstil, valorValid
} from './estil.js';

const BUIT = { v: 1, tokens: {}, crom: null };
const NOMS = TOKENS_EDITABLES.map((t) => t.nom);

/* El tema clar de tokens.css: la PRIMERA definició de cada token (la capa 2
   clara va abans del fosc i del Bancal; els cànons de marca es definixen una
   sola vegada), amb els var() resolts. */
function temaClarDeTokensCss() {
  /* Els cànons de marca (--sdp-canon-taronja, --sdp-canon-blau) viuen a design-tokens.css. */
  const css = ['src/css/design-tokens.css', 'src/css/tokens.css'].map((f) => readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n');
  const mapa = {};
  for (const m of css.matchAll(/(--sdp-[\w-]+)\s*:\s*([^;]+);/g)) if (!(m[1] in mapa)) mapa[m[1]] = m[2].trim();
  const resol = (valor, vistos = new Set()) => valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    if (vistos.has(nom) || !(nom in mapa)) throw new Error(`no es resol ${nom}`);
    return resol(mapa[nom], new Set([...vistos, nom]));
  }).trim();
  return (nom) => resol(`var(${nom})`);
}

describe('TOKENS_EDITABLES · la llista tancada', () => {
  test('tots són semàntics --sdp-* de tipus color o radi, sense duplicats, i la llista és immutable', () => {
    expect(Object.isFrozen(TOKENS_EDITABLES)).toBe(true);
    expect(new Set(NOMS).size).toBe(NOMS.length);
    for (const t of TOKENS_EDITABLES) {
      expect(Object.isFrozen(t)).toBe(true);
      expect(t.nom).toMatch(/^--sdp-[a-z-]+$/);
      expect(['color', 'radi']).toContain(t.tipus);
      expect(['fons', 'text', 'accent', 'accio', 'estat', 'radi']).toContain(t.grup);
    }
  });

  test('cap primitiu ni cap --sdp-crom-*: només la capa 2 (tokens.css:9-17)', () => {
    for (const nom of NOMS) expect(nom).not.toMatch(/^--sdp-(pedra|primary|secondary|crom)-/);
    expect(NOMS).not.toContain('--sdp-fons-vel');
  });

  test('els quatre radis de l’escala són de tipus radi; la resta, color', () => {
    const radis = TOKENS_EDITABLES.filter((t) => t.tipus === 'radi').map((t) => t.nom);
    expect(radis).toEqual(['--sdp-radi-s', '--sdp-radi-m', '--sdp-radi-g', '--sdp-radi-xl']);
    expect(ESCALA_RADIS).toEqual(['8px', '12px', '16px', '28px', '999px']);
  });

  test('cada token de la llista existix al tema clar de tokens.css', () => {
    const resol = temaClarDeTokensCss();
    for (const t of TOKENS_EDITABLES) {
      const valor = resol(t.nom);
      if (t.tipus === 'color') expect(esHex6(valor), `${t.nom} = ${valor}`).toBe(true);
      else expect(ESCALA_RADIS, `${t.nom} = ${valor}`).toContain(valor);
    }
  });
});

describe('CANON i PARELLS_DE_CONTRAST', () => {
  test('el cànon és el tema clar de tokens.css, resolt a hex, per a cada token d’un parell', () => {
    const resol = temaClarDeTokensCss();
    for (const [nom, hex] of Object.entries(CANON)) {
      expect(esHex6(hex)).toBe(true);
      expect(resol(nom).toLowerCase(), nom).toBe(hex);
    }
  });

  test('els radis del cànon són els de tokens.css', () => {
    const resol = temaClarDeTokensCss();
    expect(Object.keys(CANON_RADIS)).toEqual(['--sdp-radi-s', '--sdp-radi-m', '--sdp-radi-g', '--sdp-radi-xl']);
    for (const [nom, valor] of Object.entries(CANON_RADIS)) {
      expect(ESCALA_RADIS).toContain(valor);
      expect(resol(nom), nom).toBe(valor);
    }
  });

  test('cada token d’un parell és de la llista i té cànon', () => {
    for (const [text, fons] of PARELLS_DE_CONTRAST) {
      expect(NOMS).toContain(text);
      expect(NOMS).toContain(fons);
      expect(CANON[text]).toBeDefined();
      expect(CANON[fons]).toBeDefined();
    }
  });

  test(`el cànon passa tots els parells a ${CONTRAST_MINIM}:1: un estil buit sempre val`, () => {
    for (const c of contrastosDe({})) expect(c.ratio, `${c.text} sobre ${c.fons}`).toBeGreaterThanOrEqual(CONTRAST_MINIM);
    expect(validaEstil(BUIT)).toEqual([]);
  });

  test('contrastosDe: el personalitzat mana sobre el vigent, i el vigent sobre el cànon', () => {
    const [cos] = contrastosDe({ '--sdp-text-cos': '#ffffff' });
    expect(cos).toMatchObject({ text: '--sdp-text-cos', fons: '--sdp-fons-app', valorText: '#ffffff', passa: false });
    const [ambVigent] = contrastosDe({}, { '--sdp-fons-app': '#000000' });
    expect(ambVigent.valorFons).toBe('#000000');
    expect(ambVigent.valorText).toBe(CANON['--sdp-text-cos']);   // el gris del cànon sobre negre: no passa
    expect(ambVigent.passa).toBe(false);
    const [vigentsAlRevés] = contrastosDe({}, { '--sdp-fons-app': '#000000', '--sdp-text-cos': '#ffffff' });
    expect(vigentsAlRevés.ratio).toBeCloseTo(21, 6);
    expect(vigentsAlRevés.passa).toBe(true);
    const [vigentInvalid] = contrastosDe({}, { '--sdp-fons-app': 'rgb(0,0,0)' });
    expect(vigentInvalid.valorFons).toBe(CANON['--sdp-fons-app']);
  });
});

describe('valorValid i cromValid', () => {
  test('color: només #rrggbb; radi: només l’escala', () => {
    expect(valorValid('--sdp-fons-app', '#ff7300')).toBe(true);
    expect(valorValid('--sdp-fons-app', '#FF7300')).toBe(true);
    for (const v of ['#fff', 'red', 'rgb(0,0,0)', 'var(--sdp-pedra-900)', '#ffffff ', '', null, 7]) expect(valorValid('--sdp-fons-app', v)).toBe(false);
    expect(valorValid('--sdp-radi-s', '12px')).toBe(true);
    for (const v of ['10px', '8 px', '8', '999', 'var(--sdp-radi-m)', '']) expect(valorValid('--sdp-radi-s', v)).toBe(false);
    expect(valorValid('--sdp-radi-s', '#ffffff')).toBe(false);
    expect(valorValid('--sdp-pedra-900', '#ffffff')).toBe(false);
  });

  test('crom: null, undefined o { to } finit entre -180 i 180, sense cap altre camp', () => {
    expect(cromValid(null)).toBe(true);
    expect(cromValid(undefined)).toBe(true);
    expect(cromValid({ to: 0 })).toBe(true);
    expect(cromValid({ to: -180 })).toBe(true);
    expect(cromValid({ to: 180 })).toBe(true);
    for (const c of [{ to: 181 }, { to: 'a' }, { to: NaN }, { to: Infinity }, { to: 10, x: 1 }, {}, [], 'x', 5]) expect(cromValid(c)).toBe(false);
  });

  test('normalitzaTo porta el gir a (-180, 180]', () => {
    expect(normalitzaTo(0)).toBe(0);
    expect(normalitzaTo(190)).toBe(-170);
    expect(normalitzaTo(-190)).toBe(170);
    expect(normalitzaTo(360)).toBe(0);
    expect(normalitzaTo(180)).toBe(180);
    expect(normalitzaTo(-180)).toBe(180);
    expect(normalitzaTo('x')).toBe(0);
    expect(normalitzaTo(NaN)).toBe(0);
  });
});

describe('validaEstil', () => {
  test('la forma: objecte, v = 1, només v/tokens/crom, tokens objecte', () => {
    expect(validaEstil(null)).toHaveLength(1);
    expect(validaEstil('x')).toHaveLength(1);
    expect(validaEstil([])).toHaveLength(1);
    expect(validaEstil({ v: 2, tokens: {}, crom: null })).toEqual([`La versió de l’estil ha de ser ${VERSIO_ESTIL}.`]);
    expect(validaEstil({ ...BUIT, css: 'body{}' })).toEqual(['Camp desconegut a l’estil: css.']);
    expect(validaEstil({ v: 1, tokens: [], crom: null })).toEqual(['Els tokens han de ser un objecte { nom: valor }.']);
    expect(validaEstil({ v: 1, tokens: {} })).toEqual([]);
  });

  test('token fora de la llista, color invàlid, radi fora de l’escala', () => {
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-pedra-900': '#ffffff' } })).toEqual(['Token fora de la llista: --sdp-pedra-900.']);
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-crom-capcalera': '#ffffff' } })).toEqual(['Token fora de la llista: --sdp-crom-capcalera.']);
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-fons-app': 'red' } })).toEqual(['Valor invàlid per a --sdp-fons-app: cal un color #rrggbb.']);
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-radi-s': '10px' } }))
      .toEqual([`Valor invàlid per a --sdp-radi-s: cal un radi de l'escala (${ESCALA_RADIS.join(', ')}).`]);
  });

  test('injecció: cap valor amb ;, }, url(, barra invertida, expression, < o > passa', () => {
    for (const valor of ['#ffffff; } body { display: none', '#ffffff}', 'url(x)', '#ffffff\\', 'expression(1)', '<style>', '#ffffff>']) {
      expect(validaEstil({ ...BUIT, tokens: { '--sdp-fons-app': valor } })).toHaveLength(1);
      expect(declaracionsDe({ ...BUIT, tokens: { '--sdp-fons-app': valor } })).toEqual([]);
    }
  });

  test('contrast baix: el text de cos blanc sobre el fons canònic de l’app es rebutja; el negre passa', () => {
    const errors = validaEstil({ ...BUIT, tokens: { '--sdp-text-cos': '#ffffff' } });
    expect(errors).toHaveLength(2);   // sobre l'app i sobre la targeta
    for (const e of errors) expect(e).toMatch(/^Contrast insuficient de --sdp-text-cos sobre --sdp-fons-(app|targeta): \d+\.\d\d:1 \(cal 7:1\)\.$/);
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-text-cos': '#000000' } })).toEqual([]);
    /* Un parell amb els dos canviats es jutja amb els dos valors nous (la roca invertida: 21:1). */
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-sobre-roca': '#000000', '--sdp-fons-roca': '#ffffff' } })).toEqual([]);
    expect(validaEstil({ ...BUIT, tokens: { '--sdp-sobre-roca': '#000000' } })).toHaveLength(1);
  });

  test('crom invàlid', () => {
    expect(validaEstil({ ...BUIT, crom: { to: 200 } })).toEqual(['El crom ha de ser null o { to } amb un gir entre -180 i 180 graus.']);
    expect(validaEstil({ ...BUIT, crom: { to: 20 } })).toEqual([]);
  });
});

describe('cssDePersonalitzacio', () => {
  test('buit, invàlid o sense cap valor vàlid → cadena buida', () => {
    expect(cssDePersonalitzacio(BUIT)).toBe('');
    expect(cssDePersonalitzacio(null)).toBe('');
    expect(cssDePersonalitzacio({})).toBe('');
    expect(cssDePersonalitzacio({ v: 1, tokens: { '--sdp-fons-app': 'red', '--sdp-pedra-900': '#ffffff' } })).toBe('');
  });

  test('només línies --sdp-x: valor; dins del bloc base i del bloc del tema fosc, en l’ordre de la llista', () => {
    const css = cssDePersonalitzacio({ v: 1, tokens: { '--sdp-radi-s': '12px', '--sdp-fons-app': '#ffffff' }, crom: { to: 10 } });
    expect(css).toBe([
      ':root, :host, .sdp-root {',
      '  --sdp-fons-app: #ffffff;',
      '  --sdp-radi-s: 12px;',
      '}',
      ':root[data-theme="dark"], :host([data-theme="dark"]), :root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root {',
      '  --sdp-fons-app: #ffffff;',
      '  --sdp-radi-s: 12px;',
      '}',
      ''
    ].join('\n'));
  });

  test('un valor injectat no arriba al CSS; els altres sí', () => {
    const css = cssDePersonalitzacio({ v: 1, tokens: { '--sdp-fons-app': '#ffffff; } * { background: url(x) }', '--sdp-radi-m': '16px' } });
    expect(css).not.toMatch(/url\(|\*|background/);
    expect(css).toContain('  --sdp-radi-m: 16px;');
    expect(css).not.toContain('--sdp-fons-app');
    /* Cada línia del cos és exactament `--sdp-x: valor;`. */
    for (const linia of css.split('\n').filter((l) => l.startsWith('  '))) expect(linia).toMatch(/^ {2}--sdp-[a-z-]+: (#[0-9a-f]{6}|\d+px);$/i);
  });

  test('el crom no és CSS: no apareix al text', () => {
    expect(cssDePersonalitzacio({ v: 1, tokens: { '--sdp-radi-s': '8px' }, crom: { to: 90 } })).not.toMatch(/crom|90/);
  });
});

describe('ambCrom', () => {
  test('sense base: tokens buits; gir 0 → crom null; el gir es normalitza; la base no es toca', () => {
    expect(ambCrom(null, 0)).toEqual({ v: 1, tokens: {}, crom: null });
    expect(ambCrom(undefined, 30)).toEqual({ v: 1, tokens: {}, crom: { to: 30 } });
    const base = { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: { to: 5 } };
    const nou = ambCrom(base, 190);
    expect(nou).toEqual({ v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: { to: -170 } });
    expect(nou.tokens).not.toBe(base.tokens);
    expect(base.crom).toEqual({ to: 5 });
    expect(validaEstil(nou)).toEqual([]);
  });
});
