// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Gauntlet f6 (31-10-2026) · Dos ordres del Mestre del 30-10-2026 al prompt
   2208 (T3.1), per al tauler públic de /legal (TaulerTelemetria.jsx):
     · 23:30 · Les explicacions es lligen amb el cos de paràgraf de la pàgina:
       cap regla seua declara --sdp-text-meta ni --sdp-text-suau.
     · 23:34 · Un Quadre de Comandament net i reutilitzable (.sdp-quadre) per
       a la Gestoria, el TPV i la Botiga: graella KPI que mai deixa una
       targeta òrfena, xifra gran (h3, 800, tabular-nums), gràfica i rànquing
       en caixa emmarcada, i cap regla lligada a la telemetria.
   I una del 31-10-2026 (00:20), que porta el quadre al seu full, taulers.css:
     · Full dedicat, importat per index.css darrere de modules.css i dins de
       @layer components; modules.css ja no en porta cap regla.
     · Targetes KPI baixes (etiqueta i xifra) i l'explicació fora.
     · Gràfica de dues sèries (visitants davant, vistes darrere) amb el
       detall del punt triat, i rànquing d'una línia amb barra de proporció.
   jsdom no aplica capes ni calcula graelles: es comprova la regla escrita. */

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares } (pares: els blocs que la contenen). */
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

const declaracions = (cos) => cos.split(';')
  .map((d) => d.trim())
  .filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);

const MODULS = regles(llig('src/css/modules.css'));
const TAULERS = regles(llig('src/css/taulers.css'));
/** Declaracions d'un selector dins de `@layer components` i de res més (sense @container ni @media). */
const de = (prelud, full = TAULERS) => Object.fromEntries(full
  .filter((r) => r.prelud === prelud && r.pares.join(' | ') === '@layer components')
  .flatMap((r) => declaracions(r.cos)));

test('23:30 · cap regla de les explicacions del tauler declara la mida meta ni el color suau', () => {
  const explicacions = MODULS.filter((r) => /\.sdp-telemetria__(nota|pista|estat)\b|\.sdp-telemetria \.sdp-buit__text\b/.test(r.prelud));
  expect(explicacions.map((r) => r.prelud).sort()).toEqual([
    '.sdp-telemetria .sdp-buit__text', '.sdp-telemetria__estat', '.sdp-telemetria__nota'
  ]);
  for (const regla of explicacions) expect(regla.cos, regla.prelud).not.toMatch(/--sdp-text-meta|--sdp-text-suau/);
  /* Al quadre, només les marques de l'eix («00», «06»…) van menudes i suaus:
     cap text que s'haja de llegir (període, detall, rànquing, avisos, peu). */
  expect(TAULERS.filter((r) => /--sdp-text-meta|--sdp-text-suau/.test(r.cos)).map((r) => r.prelud)).toEqual(['.sdp-quadre__marca']);
  expect(TAULERS.filter((r) => /pista/.test(r.prelud) && !/__pista\b/.test(r.prelud))).toEqual([]);
  expect(TAULERS.some((r) => /\.sdp-quadre__pista\b/.test(r.prelud) && /font-size|color/.test(r.cos))).toBe(false);
});

test('23:30 · el quadre i el text de l’estat buit porten el cos de paràgraf (base.css, p)', () => {
  expect(de('.sdp-quadre')).toMatchObject({
    color: 'var(--sdp-text-cos)', 'font-size': 'var(--sdp-fluid-cos)', 'line-height': 'var(--sdp-leading-cos)'
  });
  expect(de('.sdp-telemetria .sdp-buit__text', MODULS)).toMatchObject({
    color: 'var(--sdp-text-cos)', 'font-size': 'var(--sdp-fluid-cos)', 'line-height': 'var(--sdp-leading-cos)'
  });
});

/* Gauntlet f8 (31-10-2026) · La graella auto-fit de les 23:34 només evitava
   l'òrfena amb una columna o amb cinc; amb dues o tres (l'espècimen a 1440,
   per exemple) deixava un forat a l'última fila. Ara és flex amb base
   d'11rem: l'última fila creix i no hi ha cap forat a cap amplada. */
test('23:34 · les targetes KPI: cap baixa d’11rem i cap queda òrfena amb un forat al costat', () => {
  expect(de('.sdp-quadre__xifres')).toMatchObject({ display: 'flex', 'flex-wrap': 'wrap' });
  expect(de('.sdp-quadre__xifra').flex).toBe('1 1 11rem');
  expect(de('.sdp-quadre__xifra')['min-inline-size']).toBe('0');
});

test('23:34 · la xifra, gran i grossa', () => {
  expect(de('.sdp-quadre__valor')).toMatchObject({
    'font-size': 'var(--sdp-text-h3)', 'font-weight': '800', 'font-variant-numeric': 'tabular-nums'
  });
});

test('23:34 · la gràfica i el rànquing, cadascun en una caixa emmarcada amb tokens', () => {
  for (const prelud of ['.sdp-quadre__grafica', '.sdp-quadre__ranquing']) {
    expect(de(prelud).border, prelud).toBe('1px solid var(--sdp-vora)');
    expect(de(prelud)['border-radius'], prelud).toMatch(/^var\(--sdp-radi-[a-z]+\)$/);
  }
  expect(de('.sdp-quadre__fila')['border-block-end']).toBe('1px solid var(--sdp-vora)');
});

test('23:34 · el quadre és reutilitzable: cap regla seua depén de la telemetria, i el tauler ja no en porta de pròpies', () => {
  const delQuadre = TAULERS.filter((r) => r.prelud.includes('.sdp-quadre'));
  expect(delQuadre.length).toBeGreaterThan(0);
  for (const regla of TAULERS) expect(regla.prelud).not.toMatch(/sdp-telemetria|sdp-histograma/);
  expect(MODULS.filter((r) => /\.sdp-telemetria__(tauler|xifres|xifra|valor|pista|seccio|en-linia|punt)\b/.test(r.prelud))).toEqual([]);
  expect(MODULS.some((r) => r.prelud.includes('.sdp-telemetria') && /\b(block-size|height)\s*:\s*96rem/.test(r.cos))).toBe(false);
});

/* ── Ordre del Mestre, 31-10-2026 (00:20) ── */
test('00:20 · full dedicat: taulers.css, darrere de modules.css i dins de @layer components; modules.css ja no porta el quadre', () => {
  const index = senseComentaris(llig('src/css/index.css'));
  const imports = [...index.matchAll(/@import\s+url\('([^']+)'\)([^;]*);/g)].map(([, ruta, resta]) => [ruta, resta.trim()]);
  const posicio = imports.findIndex(([ruta]) => ruta === './taulers.css');
  expect(imports[posicio]).toEqual(['./taulers.css', '']);
  expect(imports[posicio - 1][0]).toBe('./modules.css');
  expect(index.match(/taulers\.css/g)).toHaveLength(1);
  expect(TAULERS.length).toBeGreaterThan(0);
  for (const regla of TAULERS) expect(regla.pares[0], regla.prelud).toBe('@layer components');
  expect(MODULS.filter((r) => r.prelud.includes('sdp-quadre'))).toEqual([]);
  // La porta del vocabulari el compta com a full canònic: les seues classes són declarades.
  expect(llig('tooling/gates/tractor-vocabulari.mjs')).toMatch(/FULLS_CANONICS = \[[^\]]*'src\/css\/taulers\.css'/);
});

test('00:20 · només tokens semàntics: cap hex, cap rgb, cap primitiva, cap ombra', () => {
  const net = senseComentaris(llig('src/css/taulers.css'));
  expect(net).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  expect(net).not.toMatch(/\brgba?\(|\bhsla?\(/);
  expect(net).not.toMatch(/--sdp-(pedra|primary|secondary|error|avis|exit)-\d+|--sdp-(blanc|negre)\b|--sdp-canon-/);
  expect(net).not.toMatch(/box-shadow|text-shadow/);
});

test('00:20 · targetes KPI baixes: coixí fi i, quan només en cap una per fila, etiqueta i xifra en una línia', () => {
  expect(de('.sdp-quadre__xifra').padding).toBe('var(--sdp-space-2) var(--sdp-space-3)');
  expect(de('.sdp-quadre__xifres')['container-type']).toBe('inline-size');
  const enLinia = TAULERS.filter((r) => r.prelud === '.sdp-quadre__xifra' && r.pares.some((p) => p.startsWith('@container')));
  expect(enLinia).toHaveLength(1);
  // Dues targetes d'11rem amb el gap de 0,5rem demanen 22,5rem: per davall, una per fila.
  const [, maxim] = enLinia[0].pares[1].match(/max-width:\s*([\d.]+)rem/);
  expect(Number(maxim)).toBeLessThan(22.5);
  expect(Object.fromEntries(declaracions(enLinia[0].cos))).toMatchObject({
    display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'baseline', 'justify-content': 'space-between'
  });
  // L'etiqueta guarda 6rem: si la xifra no les hi deixa, baixa davall i l'etiqueta no es parteix lletra a lletra.
  const etiqueta = TAULERS.filter((r) => r.prelud === '.sdp-quadre__xifra > dt' && r.pares.some((p) => p.startsWith('@container')));
  expect(etiqueta.map((r) => r.cos)).toEqual(['flex: 1 1 6rem;']);
});

test('00:20 · gràfica: dues sèries amb tokens d’acció, geometria exacta en SVG, el punt triat marcat i el dit lliure en vertical', () => {
  expect(de('.sdp-quadre__barra--davant').fill).toBe('var(--sdp-accio-forta)');
  expect(de('.sdp-quadre__barra--darrere').fill).toBe('var(--sdp-accio)');
  expect(de('.sdp-quadre__mostra--davant').background).toBe('var(--sdp-accio-forta)');
  expect(de('.sdp-quadre__mostra--darrere').background).toBe('var(--sdp-accio)');
  expect(de('.sdp-quadre__proporcio-barra').fill).toBe('var(--sdp-accio)');
  /* Gauntlet f8 (F8-CRIT-01 i 05) · Cap escaló: les alçades i les amplades
     són atributs dels <rect>, i ací no queda cap classe de nivell. */
  expect(TAULERS.filter((r) => /--n\d+\b/.test(r.prelud)).map((r) => r.prelud)).toEqual([]);
  expect(de('.sdp-quadre__dibuix')['inline-size']).toBe('min(100%, 1.875rem)');
  expect(de('.sdp-quadre__dibuix, .sdp-quadre__eix')).toMatchObject({ 'block-size': '100%', overflow: 'hidden' });
  expect(de('.sdp-quadre__regio').overflow).toBe('hidden');
  expect(de('.sdp-quadre__barra').rx).toBe('calc(var(--sdp-radi-s) / 2)');
  expect(de('.sdp-quadre__zero').stroke).toBe('var(--sdp-vora-forta)');
  expect(de('.sdp-quadre__barres--negatius .sdp-quadre__pista')['border-block-end']).toBe('2px solid transparent');
  expect(de('.sdp-quadre__barres')['touch-action']).toBe('pan-y');
  expect(de('.sdp-quadre__columna--triada .sdp-quadre__boto').background).toBe('var(--sdp-fons-subtil)');
  expect(de('.sdp-quadre__boto:focus-visible').outline).toBe('var(--sdp-focus-gruix) solid var(--sdp-focus)');
  // El ratolí es mostra amb l'estat de la peça (la mateixa classe que el dit i el teclat), no amb :hover.
  expect(TAULERS.filter((r) => r.prelud.includes(':hover'))).toEqual([]);
  expect(de('.sdp-quadre__detall')).toMatchObject({ color: 'var(--sdp-text-titol)', 'font-weight': '700' });
});

/* Gauntlet f8, F8-CRIT-04 · Les dues sèries es toquen i entre elles no
   arriben a 3:1 (2,38:1 en clar, 2,23:1 en fosc). Un anell de 2px del color
   de la targeta (traç de 4px darrere del farcit) les separa. */
test('f8 · un anell del color de la targeta separa la sèrie de davant de la de darrere', () => {
  expect(de('.sdp-quadre__barra--davant')).toMatchObject({
    stroke: 'var(--sdp-fons-targeta)', 'stroke-width': '4px', 'paint-order': 'stroke'
  });
  expect(de('.sdp-quadre__barra--darrere').stroke).toBeUndefined();
});

/* Gauntlet f8, QDC-02 · El li global de base.css (capa legacy) posa 4px a
   l'esquerra: una franja morta per al ratolí i l'eix a trossos. */
test('f8 · les columnes de la gràfica i els elements de la llegenda no hereten el padding del li global', () => {
  expect(de('.sdp-quadre__columna').padding).toBe('0');
  expect(de('.sdp-quadre__llegenda > li').padding).toBe('0');
  const base = regles(llig('src/css/base.css'));
  expect(base.some((r) => r.prelud === 'li' && /padding-left/.test(r.cos))).toBe(true);
});

/* Gauntlet f8, QDC-03 · En colors forçats foscos, el blau fosc de l'autor
   quedava a 2,28:1 sobre el llenç negre i la columna triada no es veia. */
test('f8 · colors forçats: colors del sistema per a les sèries i una vora de traços per a la columna triada', () => {
  const forcats = Object.fromEntries(TAULERS
    .filter((r) => r.pares.join(' | ') === '@layer components | @media (forced-colors: active)')
    .map((r) => [r.prelud, Object.fromEntries(declaracions(r.cos))]));
  expect(forcats['.sdp-quadre__barra--davant']).toEqual({ fill: 'CanvasText', stroke: 'Canvas' });
  expect(forcats['.sdp-quadre__barra--darrere, .sdp-quadre__proporcio-barra']).toEqual({ fill: 'Highlight' });
  expect(forcats['.sdp-quadre__mostra--davant']).toEqual({ background: 'CanvasText' });
  expect(forcats['.sdp-quadre__mostra--darrere']).toEqual({ background: 'Highlight' });
  expect(forcats['.sdp-quadre__zero']).toEqual({ stroke: 'CanvasText' });
  expect(forcats['.sdp-quadre__columna--triada .sdp-quadre__boto:not(:focus-visible)'])
    .toEqual({ outline: '1px dashed CanvasText', 'outline-offset': '-1px' });
  // Cap color de l'autor hi sobrevisc: només paraules del sistema.
  for (const [prelud, decl] of Object.entries(forcats)) {
    for (const [prop, valor] of Object.entries(decl)) {
      if (/^(fill|stroke|background)$/.test(prop)) expect(valor, prelud).toMatch(/^(CanvasText|Canvas|Highlight)$/);
    }
  }
});

test('00:20 · rànquing d’una línia: nom i codi a l’esquerra, comptador a la dreta i barra suau davall', () => {
  expect(de('.sdp-quadre__fila')).toMatchObject({ display: 'grid', 'grid-template-columns': 'minmax(0, 1fr) auto' });
  expect(de('.sdp-quadre__compte')).toMatchObject({ 'white-space': 'nowrap', 'text-align': 'end', 'font-variant-numeric': 'tabular-nums' });
  expect(de('.sdp-quadre__proporcio')).toMatchObject({ 'grid-column': '1 / -1', 'block-size': 'var(--sdp-space-1)' });
});
