// @vitest-environment node
/* Fase D (261020, tasca 1) · Els botons de marca de l'entrada nativa
   (EntradaNativa.jsx): jsdom no calcula ni capes ni mides, i es comprova la
   regla escrita, com a components.abast.capes.test.js.
     · Les regles noves viuen dins de @layer components i cap porta hexadecimal:
       els colors són tokens --sdp-marca-* del full de tokens.
     · Apple és negre en clar i blanc en fosc (HIG, decisió D3).
     · Tots dos botons fan 48px: Apple sense vora ni farciment vertical i amb el
       logotip dimensionat per token; Google amb la vora d'1px.
     · La lletra d'Apple no baixa dels 14px. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const declaracions = (cos) => Object.fromEntries(cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));

const COMPONENTS = regles(llig('src/css/components.css'));
const MODULS = regles(llig('src/css/modules.css'));
const TOKENS = regles(llig('src/css/tokens.css'));
const regla = (fulles, prelud) => fulles.find((r) => r.prelud === prelud);
const NOVES = [
  '.sdp-boto--marca', '.sdp-boto--apple', '.sdp-boto--google', '.sdp-boto__logotip', '.sdp-boto__logotip--apple',
  '.sdp-boto__logotip--google', '.sdp-logotip-google__blau', '.sdp-logotip-google__verd', '.sdp-logotip-google__groc',
  '.sdp-logotip-google__roig'
];
const HEX = /#[0-9a-f]{3,8}\b/i;
const CLAR = ':root, :host, .sdp-root';
const FOSC = ':root[data-theme="dark"], :host([data-theme="dark"]), :root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root';
const tokenDe = (prelud, nom) => TOKENS.filter((r) => r.prelud === prelud).map((r) => declaracions(r.cos)[nom]).find(Boolean);

describe('les regles noves', () => {
  test.each(NOVES)('%s és dins de @layer components, sense hexadecimals i sense :hover', (prelud) => {
    const r = regla(COMPONENTS, prelud);
    expect(r, prelud).toBeTruthy();
    expect(r.pares).toEqual(['@layer components']);
    expect(HEX.test(r.cos), r.cos).toBe(false);
    if (prelud !== '.sdp-boto__logotip') expect(r.cos).toMatch(/var\(--sdp-/);
  });

  test('cap regla dels botons de marca porta :hover', () => {
    expect(COMPONENTS.filter((r) => /sdp-boto--(?:marca|apple|google)/.test(r.prelud) && r.prelud.includes(':hover'))).toEqual([]);
  });

  test('la columna dels botons és a modules.css, dins de @layer components', () => {
    const r = regla(MODULS, '.onboarding-entrada-nativa');
    expect(r.pares).toEqual(['@layer components']);
    expect(declaracions(r.cos)).toMatchObject({ display: 'flex', 'flex-direction': 'column', gap: 'var(--sdp-space-3)', width: '100%' });
  });
});

describe('les mides de 48px', () => {
  test('Apple: sense vora ni farciment vertical, i el logotip per token', () => {
    expect(declaracions(regla(COMPONENTS, '.sdp-boto--apple').cos)).toMatchObject({ border: '0', 'padding-block': '0' });
    expect(declaracions(regla(COMPONENTS, '.sdp-boto__logotip--apple').cos)).toEqual({
      'block-size': 'var(--sdp-marca-apple-logotip)', 'inline-size': 'var(--sdp-marca-apple-logotip)'
    });
  });

  test('Google: la vora d’1px de la seua guia', () => {
    expect(declaracions(regla(COMPONENTS, '.sdp-boto--google').cos).border).toBe('1px solid var(--sdp-marca-google-vora)');
  });

  test('el sòl de .sdp-boto és el de la Llei de Vida', () => {
    expect(declaracions(regla(COMPONENTS, '.sdp-boto').cos)['min-height']).toBe('var(--sdp-touch-min)');
  });
});

describe('els tokens de marca', () => {
  test('Apple és negre en clar i blanc en fosc; el text, a l’inrevés', () => {
    expect(tokenDe(CLAR, '--sdp-marca-apple-fons')).toBe('#000000');
    expect(tokenDe(CLAR, '--sdp-marca-apple-text')).toBe('#ffffff');
    expect(tokenDe(FOSC, '--sdp-marca-apple-fons')).toBe('#ffffff');
    expect(tokenDe(FOSC, '--sdp-marca-apple-text')).toBe('#000000');
  });

  test('els quatre colors de la G no canvien amb el tema', () => {
    for (const color of ['blau', 'verd', 'groc', 'roig']) {
      expect(tokenDe(CLAR, `--sdp-marca-google-${color}`), color).toMatch(/^#[0-9a-f]{6}$/);
      expect(tokenDe(FOSC, `--sdp-marca-google-${color}`), color).toBeUndefined();
    }
  });

  test('la lletra d’Apple és de 14px o més (en rem de 16px)', () => {
    const valor = tokenDe(CLAR, '--sdp-marca-apple-lletra');
    expect(valor).toMatch(/^[\d.]+rem$/);
    expect(Number.parseFloat(valor) * 16).toBeGreaterThanOrEqual(14);
  });
});
