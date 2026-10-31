// @vitest-environment node
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · El Diagnòstic
   del Mas (DiagnosiConsola.jsx), fixat sobre la regla escrita: «un bloc de
   text continu (estil terminal / <pre> amb tipografia monoespaiada i format
   net)». jsdom no calcula capes ni tipografies (mateix patró que la resta de
   proves *.capes de src/css). Diu què declara el full i on:
     · les tres regles viuen al bloc § CONSOLA de modules.css, a
       @layer components;
     · el <pre> és el bloc monoespaiat de la casa (fons subtil, radi s,
       --sdp-font-mono, --sdp-text-small) però es plega: pre-wrap i tall a
       qualsevol punt, perquè en mòbil cap línia llarga obriga scroll
       horitzontal;
     · només tokens semàntics: cap color cru, cap token primitiu, cap ombra,
       cap transició. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const FULL = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Les regles fulla d'un full: { prelud, cos, pares } (els pares són els @layer, @media… que l'embolcallen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.slice(tros.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' '), fills: false });
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
const declaracions = (r) => Object.fromEntries(r.cos.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
  const tall = d.indexOf(':');
  return [d.slice(0, tall).trim(), d.slice(tall + 1).trim()];
}));

const MODULS = regles(FULL);
/* Revisió adversarial 13-10-2026, troballa PS-1 · l'enllaç de l'accés ràpid
   entra a la llista: viu al mateix bloc i passa les mateixes lleis. */
const ENLLAC_ACCES = '.sdp-consola__acces > ul > li > a';
const SELECTORS = ['.sdp-consola__diagnosi', '.sdp-consola__acces > ul', '.sdp-consola__acces > ul > li', ENLLAC_ACCES, '.sdp-consola__diagnosi-text'];
const deSelector = (s) => MODULS.filter((r) => r.prelud.split(',').map((x) => x.trim()).includes(s));
const unaRegla = (s) => {
  const totes = deSelector(s);
  expect(totes, s).toHaveLength(1);
  return totes[0];
};

describe('on viu', () => {
  test('cada regla és única, a @layer components i sense cap @media ni :hover', () => {
    for (const s of SELECTORS) {
      expect(unaRegla(s).pares, s).toEqual(['@layer components']);
      expect(s).not.toMatch(/:hover|:has\(/);
    }
  });

  test('dins del bloc § CONSOLA de modules.css, darrere de l’Índex de la Consola', () => {
    const net = senseComentaris(FULL);
    const consola = FULL.indexOf('/* ── CONSOLA');
    const explorador = FULL.indexOf('/* ── EXPLORADOR');
    expect(consola).toBeGreaterThan(-1);
    expect(explorador).toBeGreaterThan(consola);
    for (const s of SELECTORS) {
      const on = FULL.indexOf(`${s} {`);
      expect(on, s).toBeGreaterThan(FULL.indexOf('.sdp-consola__index {'));
      expect(on, s).toBeLessThan(explorador);
      expect(net.split(`${s} {`).length - 1, s).toBe(1);
    }
  });
});

describe('el bloc de text pla', () => {
  test('monoespaiat, del cos de text de la casa (16px, sòl de 14px) i amb el fons subtil i el radi s', () => {
    expect(declaracions(unaRegla('.sdp-consola__diagnosi-text'))).toEqual({
      margin: 'var(--sdp-space-4) 0 0',
      padding: 'var(--sdp-space-4)',
      'border-radius': 'var(--sdp-radi-s)',
      background: 'var(--sdp-fons-subtil)',
      color: 'var(--sdp-text-cos)',
      'font-family': 'var(--sdp-font-mono)',
      'font-size': 'var(--sdp-text-small)',
      'line-height': 'var(--sdp-leading-cos)',
      'white-space': 'pre-wrap',
      'overflow-wrap': 'anywhere'
    });
  });

  test('es plega: cap `white-space: pre` ni cap scroll horitzontal propi', () => {
    const d = declaracions(unaRegla('.sdp-consola__diagnosi-text'));
    expect(d['white-space']).toBe('pre-wrap');
    expect(d.overflow).toBeUndefined();
    expect(d['overflow-x']).toBeUndefined();
    expect(d['max-height']).toBeUndefined();
  });
});

describe('l’accés ràpid i la secció', () => {
  test('una fila d’enllaços que es plega, centrada davall de l’H2, sense pics ni sagnat', () => {
    expect(declaracions(unaRegla('.sdp-consola__acces > ul'))).toEqual({
      display: 'flex',
      'flex-wrap': 'wrap',
      'justify-content': 'center',
      gap: 'var(--sdp-space-2) var(--sdp-space-4)',
      margin: '0',
      padding: '0',
      'list-style': 'none'
    });
    expect(declaracions(unaRegla('.sdp-consola__acces > ul > li'))).toEqual({ margin: '0', padding: '0' });
  });

  /* Revisió adversarial 13-10-2026, troballa PS-1 · Pedra Seca §6: cap
     element interactiu baixa de --sdp-touch. Sense la regla, cada enllaç era
     text en línia d'una línia d'alt i esta prova no en troba cap (unaRegla
     exigix exactament una). Només l'àrea de toc: cap lletra, color, vora,
     fons ni farcit propis, perquè el text es pinta igual que abans. */
  test('cada enllaç arriba al sòl tàctil (--sdp-touch) en les dues direccions, amb el text centrat i sense cap altra pell', () => {
    expect(declaracions(unaRegla(ENLLAC_ACCES))).toEqual({
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-block-size': 'var(--sdp-touch)',
      'min-inline-size': 'var(--sdp-touch)'
    });
    const tokens = readFileSync(path.join(process.cwd(), 'src/css/tokens.css'), 'utf8');
    expect(tokens).toMatch(/--sdp-touch[:]\s*48px\s*;/);
  });

  test('separada de l’Índex per dalt amb el mateix aire que l’Índex de les xifres', () => {
    const index = declaracions(unaRegla('.sdp-consola__index'));
    expect(declaracions(unaRegla('.sdp-consola__diagnosi'))).toEqual({ 'margin-top': index['margin-top'] });
    expect(index['margin-top']).toBe('var(--sdp-space-8)');
  });
});

describe('Pedra Seca', () => {
  test('només tokens semàntics: cap color cru, cap token primitiu, cap ombra, cap transició, cap rem fora de la graella', () => {
    for (const s of SELECTORS) {
      const r = unaRegla(s);
      expect(r.cos, s).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
      expect(r.cos, s).not.toMatch(/--sdp-(pedra|terra|cel|oliva|primary)-\d/);
      const d = declaracions(r);
      expect(d['box-shadow'], s).toBeUndefined();
      expect(d.transition, s).toBeUndefined();
      for (const rem of r.cos.match(/(\d*\.?\d+)rem\b/g) ?? []) expect((parseFloat(rem) * 4) % 1, `${s} · ${rem}`).toBe(0);
    }
  });

  test('els tokens que fa servir existixen a tokens.css', () => {
    const tokens = readFileSync(path.join(process.cwd(), 'src/css/tokens.css'), 'utf8');
    const usats = new Set(SELECTORS.flatMap((s) => unaRegla(s).cos.match(/--sdp-[a-z0-9-]+/g) ?? []));
    expect(usats.size).toBeGreaterThan(5);
    for (const t of usats) expect(tokens, t).toMatch(new RegExp(`${t}\\s*:`));
  });
});
