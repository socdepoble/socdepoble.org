// @vitest-environment node
/**
 * Onada R26.3 (ordre del Mestre del 14-11-2026, revisió de Gemini §1.B) · El bloc de
 * SelectorOpcionsDesplegable de modules.css (BLOC ONADA R26.2):
 *   1. El resum no es talla mai: cap nowrap, el·lipsi ni overflow amagat (WCAG 1.4.10). El
 *      text sencer es veu; no es confia a un title, que el dit no pot obrir.
 *   2. El ràdio de la píndola activa fa 3:1 o més sobre el fons blau de la píndola (WCAG 1.4.11),
 *      en clar, fosc, Bancal i Bancal fosc. accent-color només pinta el ràdio marcat, i el marcat
 *      és sempre el de la píndola activa (checked i data-actiu ixen del mateix valor === id):
 *      el ràdio sense marcar el dibuixa el navegador i no depén d'este full.
 *   3. Píndola i detall comparteixen la mateixa caixa: l'opció s'estira i porta l'amplada
 *      màxima a partir de 40rem; ni la píndola ni el detall no en tenen una de pròpia.
 * jsdom no calcula capes ni @container: es lligen els fulls i es resolen els tokens fins al hex.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
/* Onada R28 · D-R27-1 (opció b) · El bloc R26.2 viu ara al full diferit, sencer i dins de @layer components;
   modules.css només en conserva la nota. Les assercions no canvien. */
const DIFERIT = llig('src/css/diferit-selector-opcions.css');
const INICI = DIFERIT.indexOf('@layer components');
const FI = DIFERIT.length;
const BLOC = senseComentaris(DIFERIT.slice(INICI, FI));

/** Regles fulla: { selectors, decl, pares } (pares: els preludis dels blocs que la contenen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of css) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) {
        const decl = Object.fromEntries(tros.split(';').map((d) => d.split(':')).filter((p) => p.length > 1)
          .map(([prop, ...resta]) => [prop.trim(), resta.join(':').trim()]));
        eixida.push({ selectors: marc.prelud.split(',').map((x) => x.trim()), decl, pares: pila.map((p) => p.prelud) });
      }
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const REGLES = regles(BLOC);
const delSelector = (selector) => REGLES.filter((r) => r.selectors.includes(selector));
const unaRegla = (selector, pares = ['@layer components']) => {
  const trobades = delSelector(selector).filter((r) => r.pares.join(' | ') === pares.join(' | '));
  expect(trobades, `${selector} dins de ${pares.join(' > ')}`).toHaveLength(1);
  return trobades[0].decl;
};

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
const MODES = { clar: CLAR, fosc: FOSC, bancal: { ...CLAR, ...B }, 'bancal fosc': { ...FOSC, ...B, ...BF } };

function hex(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
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

describe('SelectorOpcionsDesplegable · bloc R26.2 (full diferit, abans a modules.css) amb les correccions R26.3', () => {
  test('el bloc existix i viu dins de @layer components', () => {
    expect(INICI).toBeGreaterThan(-1);
    expect(FI).toBeGreaterThan(INICI);
    expect(REGLES.length).toBeGreaterThan(10);
    expect(REGLES.every((r) => r.pares[0] === '@layer components')).toBe(true);
  });

  test('(1) el resum no es talla: cap nowrap, el·lipsi ni overflow amagat; flex-wrap i frases senceres', () => {
    const delResum = REGLES.filter((r) => r.selectors.some((s) => s.includes('.sdp-selector-opcions__resum')));
    expect(delResum.length).toBeGreaterThanOrEqual(2);
    for (const r of delResum) {
      expect(r.decl['white-space'], r.selectors.join(', ')).toBeUndefined();
      expect(r.decl['text-overflow'], r.selectors.join(', ')).toBeUndefined();
      expect(r.decl.overflow, r.selectors.join(', ')).toBeUndefined();
      expect(r.decl['overflow-x'], r.selectors.join(', ')).toBeUndefined();
      expect(r.decl['line-clamp'], r.selectors.join(', ')).toBeUndefined();
      expect(r.decl['-webkit-line-clamp'], r.selectors.join(', ')).toBeUndefined();
    }
    expect(unaRegla('.sdp-selector-opcions__resum')['flex-wrap']).toBe('wrap');
    const frase = unaRegla('.sdp-selector-opcions__resum > span');
    expect(frase.flex).toBe('1 1 100%');
    expect(frase['overflow-wrap']).toBe('anywhere');
    // Tampoc cap altra regla del bloc no reintrodueix el tall.
    expect(BLOC).not.toMatch(/text-overflow\s*:\s*ellipsis|white-space\s*:\s*nowrap/);
  });

  test('(2) el ràdio marcat fa 3:1 o més sobre el blau de la píndola activa, en els quatre modes', () => {
    const actiu = unaRegla('.sdp-selector-opcions__tria[data-actiu="true"]');
    const radioActiu = unaRegla('.sdp-selector-opcions__tria[data-actiu="true"] input');
    const radioBase = unaRegla('.sdp-selector-opcions__tria input');
    expect(radioActiu['accent-color']).toBe('var(--sdp-sobre-accio)');
    for (const [mode, mapa] of Object.entries(MODES)) {
      expect(ratio(hex(radioActiu['accent-color'], mapa), hex(actiu.background, mapa)), `actiu · ${mode}`)
        .toBeGreaterThanOrEqual(3);
      // El defecte de R26.2: sense la regla de l'actiu, el ràdio heretava el blau del fons.
      expect(ratio(hex(radioBase['accent-color'], mapa), hex(actiu.background, mapa)), `blau sobre blau · ${mode}`)
        .toBeLessThan(3);
    }
  });

  test('(3) píndola i detall comparteixen caixa i eix: l’opció s’estira i porta l’amplada màxima a partir de 40rem', () => {
    const opcio = unaRegla('.sdp-selector-opcions__opcio');
    expect(opcio['align-items']).toBe('stretch');
    expect(opcio['inline-size']).toBe('100%');
    expect(unaRegla('.sdp-selector-opcions__detall')['inline-size']).toBe('100%');
    const ample = ['@layer components', '@container (min-width: 40rem)'];
    expect(unaRegla('.sdp-selector-opcions__opcio', ample)['max-inline-size']).toBe('36rem');
    for (const peca of ['.sdp-selector-opcions__tria', '.sdp-selector-opcions__detall']) {
      for (const r of delSelector(peca)) {
        expect([undefined, '100%'], `${peca} dins de ${r.pares.join(' > ')}`).toContain(r.decl['max-inline-size']);
      }
    }
  });
});
