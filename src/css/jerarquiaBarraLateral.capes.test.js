// @vitest-environment node
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front C) · Jerarquia de la
   barra lateral: els títols de grup i els desplegables que no són enllaços
   («Sistema» a la barra principal; els grups de la BarraApp de totes les apps:
   Gestoria, Bar i Salut) van en el taronja de Pedra Seca i pes 600; els
   enllaços continuen blancs.
   L'ordre nomenava un token que no existix (només hi ha la rampa
   --sdp-primary-50…900): un var() a un token inexistent es resol a buit i el
   color s'hereta, sense cap canvi a la pantalla. A més, la closca només pinta
   amb --sdp-crom-* (tractor-crom, K3). El substitut és un token de LLETRA de la
   closca, --sdp-crom-grup-text = el cànon, declarat una sola vegada al :root
   clar (K1). Auditoria de Codex 261013_1510 (menú taronja, P2) i mapa C.
   jsdom no resol la cascada ni pinta: es comproven les regles escrites, i el
   contrast es calcula amb la fórmula WCAG 2.x sobre els valors de tokens.css
   en els quatre modes (clar, fosc, Bancal i Bancal fosc). Cada guarda es prova
   també contra una còpia literal de les regles d'abans del torn i contra
   l'ordre al peu de la lletra: si no les detectara, no guardaria res. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
// Decisió del Mestre (30-10-2026) · Els var() de les fixtures es componen: tractor-tokens (T1, T4) llig src sencer.
const varDe = (nom) => ['var(', nom, ')'].join('');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Parteix una llista de selectors per les comes de primer nivell. */
function parteix(preludi) {
  const trossos = [];
  let fondaria = 0;
  let actual = '';
  for (const caracter of preludi) {
    if (caracter === '(' || caracter === '[') fondaria += 1;
    if (caracter === ')' || caracter === ']') fondaria -= 1;
    if (caracter === ',' && fondaria === 0) {
      trossos.push(net(actual));
      actual = '';
    } else {
      actual += caracter;
    }
  }
  if (actual.trim()) trossos.push(net(actual));
  return trossos;
}

/** Regles fulla, amb les @-regles que les embolcallen (@layer, @media…). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let buf = '';
  for (const caracter of senseComentaris(css)) {
    if (caracter === '{') {
      pila.push(net(buf));
      buf = '';
    } else if (caracter === '}') {
      const preludi = pila.pop();
      if (preludi && !preludi.startsWith('@')) {
        eixida.push({ selectors: parteix(preludi), cos: net(buf), context: pila.filter((p) => p.startsWith('@')) });
      }
      buf = '';
    } else if (caracter === ';' && (pila.length === 0 || pila[pila.length - 1].startsWith('@'))) {
      buf = '';
    } else {
      buf += caracter;
    }
  }
  return eixida;
}

const declaracions = (cos) => cos.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
  const dos = d.indexOf(':');
  return [d.slice(0, dos).trim(), d.slice(dos + 1).trim()];
});
/** L'últim valor que la regla dona a la propietat (el que guanya dins d'ella). */
const valorDe = (regla, propietat) => declaracions(regla.cos).filter(([p]) => p === propietat).map(([, v]) => v).pop();

function fullsCss(dir) {
  return readdirSync(dir).flatMap((nom) => {
    if (nom === 'node_modules' || nom.startsWith('.')) return [];
    const abs = join(dir, nom);
    if (statSync(abs).isDirectory()) return fullsCss(abs);
    return nom.endsWith('.css') ? [abs] : [];
  });
}

const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const LAYOUT = llig('src/css/layout.css');
const APPS = llig('src/apps/plataforma/apps.css');

const GRUP = '--sdp-crom-grup-text';
const DESPLEGABLE = 'nav.app-sidebar .nav-item--desplegable';
const TITOL_GRUP = '.sdp-app-barra__grup';
const GUARDA = '@media (hover: hover) and (pointer: fine)';

/* ── Tokens: els quatre modes, resolts fins al hex ── */
/** El cos del bloc que obri `selector {` (selector exacte, a principi de línia). */
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  if (inici < 0) throw new Error(`falta el bloc ${selector}`);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i += 1) {
    if (text[i] === '{') prof += 1;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}
const tokensDe = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const SEL_CLAR = ':root, :host, .sdp-root';
const SEL_FOSC = ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root';
const SEL_BANCAL = ':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root';
const SEL_BANCAL_FOSC = ':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root';
const CLAR = { ...tokensDe(CANON), ...tokensDe(bloc(TOKENS, SEL_CLAR)) };
const FOSC = { ...CLAR, ...tokensDe(bloc(TOKENS, SEL_FOSC)) };
const BANCAL = tokensDe(bloc(TOKENS, SEL_BANCAL));
const MODES = {
  clar: CLAR,
  fosc: FOSC,
  bancal: { ...CLAR, ...BANCAL },
  'bancal fosc': { ...FOSC, ...BANCAL, ...tokensDe(bloc(TOKENS, SEL_BANCAL_FOSC)) }
};

function hex(mapa, token, vistos = new Set()) {
  const valor = mapa[token];
  if (valor === undefined) throw new Error(`falta ${token}`);
  if (vistos.has(token)) throw new Error(`cicle a ${token}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(valor);
  return ref ? hex(mapa, ref[1], new Set([...vistos, token])) : valor.toLowerCase();
}
const lineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lluminancia(color) {
  const m = /^#([0-9a-f]{6})$/.exec(color);
  if (!m) throw new Error(`No és un hex opac de sis xifres: ${color}`);
  const [r, g, b] = [0, 2, 4].map((i) => lineal(parseInt(m[1].slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (mapa, a, b) => {
  const [x, y] = [lluminancia(hex(mapa, a)), lluminancia(hex(mapa, b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ── Guardes ─────────────────────────────────────────────────────────── */
/** Les fallades de la jerarquia en un layout.css i un apps.css donats. */
function auditaJerarquia(layoutCss, appsCss, declarats) {
  const fallades = [];
  const L = regles(layoutCss);
  const A = regles(appsCss);

  /* «Sistema»: una sola regla li dona color, a components (legacy perd contra
     la regla de Bancal, que el tornaria blanc), amb el token de grup i 600. */
  const pintades = L.filter((r) => r.selectors.includes(DESPLEGABLE) && valorDe(r, 'color') !== undefined);
  if (pintades.length !== 1) fallades.push(`«Sistema»: ${pintades.length} regles li donen color`);
  for (const r of pintades) {
    if (r.context.join(' | ') !== '@layer components') fallades.push(`«Sistema»: el color viu a [${r.context.join(', ')}]`);
    if (valorDe(r, 'color') !== `var(${GRUP})`) fallades.push(`«Sistema»: color ${valorDe(r, 'color')}`);
    if (valorDe(r, 'font-weight') !== '600') fallades.push(`«Sistema»: pes ${valorDe(r, 'font-weight')}`);
  }
  /* Amb el ratolí, el blanc de sempre i només dins de la guarda. */
  const hover = L.filter((r) => r.selectors.includes(`${DESPLEGABLE}:hover`));
  if (hover.length !== 1
    || hover[0].context.join(' | ') !== ['@layer components', GUARDA].join(' | ')
    || valorDe(hover[0], 'color') !== 'var(--sdp-crom-text)') {
    fallades.push('«Sistema»: el hover no torna al blanc dins de la guarda de ratolí, a components');
  }

  /* Títol de grup de la BarraApp: el mateix token i 600. */
  const colors = A.filter((r) => r.selectors.includes(TITOL_GRUP)).map((r) => valorDe(r, 'color')).filter(Boolean);
  if (colors.length !== 1 || colors[0] !== `var(${GRUP})`) fallades.push(`títol de grup: color ${colors.join(', ') || 'cap'}`);
  const pesos = A.filter((r) => r.selectors.includes(TITOL_GRUP)).map((r) => valorDe(r, 'font-weight')).filter(Boolean);
  if (pesos.join() !== '600') fallades.push(`títol de grup: pes ${pesos.join(', ') || 'cap'}`);

  /* Cap fantasma a les regles de la jerarquia: un var() a un token que no
     existix es resol a buit i el color s'hereta sense que res avise. */
  const propies = [...L, ...A].filter((r) => r.selectors.some((s) => s.startsWith(DESPLEGABLE) || s === TITOL_GRUP));
  for (const r of propies) {
    for (const [, valor] of declaracions(r.cos)) {
      for (const m of valor.matchAll(/var\(\s*(--[\w-]+)/g)) if (!declarats.has(m[1])) fallades.push(`token fantasma ${m[1]}`);
    }
  }
  return fallades;
}

/** On es cita el token de grup: [`selector { propietat }`]. */
function usosDelToken(css) {
  const eixida = [];
  for (const r of regles(css)) {
    for (const [propietat, valor] of declaracions(r.cos)) {
      if (valor.includes(`var(${GRUP})`)) for (const s of r.selectors) eixida.push(`${s} { ${propietat} }`);
    }
  }
  return eixida;
}

/** El comentari que precedix just la marca (cap altra cosa entremig). */
function comentariAbans(text, marca) {
  const i = text.indexOf(marca);
  if (i < 0) return '';
  const abans = text.slice(0, i);
  const fi = abans.lastIndexOf('*/');
  if (fi < 0 || abans.slice(fi + 2).trim() !== '') return '';
  const ini = abans.lastIndexOf('/*', fi);
  return ini < 0 ? '' : abans.slice(ini, fi + 2);
}

const DECLARATS = new Set([...senseComentaris(`${CANON}\n${TOKENS}`).matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

/* ── Còpies literals d'abans del torn i de l'ordre al peu de la lletra ── */
const LAYOUT_ABANS = `@layer legacy {
  .nav-item { color: var(--sdp-crom-text-suau); font: var(--sdp-font-barra); }
  ${DESPLEGABLE} { border: 0; background: transparent; cursor: pointer; text-align: start; }
}`;
const APPS_ABANS = `${TITOL_GRUP} { margin: 0; padding: var(--sdp-space-2) var(--sdp-space-4); color: var(--sdp-crom-text-suau); font: var(--sdp-font-barra); }`;
/* El taronja escrit a legacy: la regla de Bancal (.nav-item:not(.active),
   0,4,0) el tornaria blanc. */
const LAYOUT_A_LEGACY = `@layer legacy {
  ${DESPLEGABLE} { color: var(${GRUP}); font-weight: 600; }
  ${GUARDA} { ${DESPLEGABLE}:hover { color: var(--sdp-crom-text); } }
}`;
const APPS_LITERAL = `${TITOL_GRUP} { color: ${varDe('--sdp-primary')}; font-weight: 600; }`;

describe('les guardes detecten les regles d’abans del torn i l’ordre al peu de la lletra', () => {
  test('abans: «Sistema» sense color propi, sense hover i el títol de grup en el blanc dels enllaços', () => {
    const fallades = auditaJerarquia(LAYOUT_ABANS, APPS_ABANS, DECLARATS);
    expect(fallades).toContain('«Sistema»: 0 regles li donen color');
    expect(fallades).toContain('«Sistema»: el hover no torna al blanc dins de la guarda de ratolí, a components');
    expect(fallades).toContain('títol de grup: color var(--sdp-crom-text-suau)');
    expect(fallades).toContain('títol de grup: pes cap');
  });

  test('el taronja a legacy no val: el Bancal el repintaria de blanc', () => {
    const fallades = auditaJerarquia(LAYOUT_A_LEGACY, APPS_ABANS, DECLARATS);
    expect(fallades).toContain('«Sistema»: el color viu a [@layer legacy]');
    expect(fallades).toContain('«Sistema»: el hover no torna al blanc dins de la guarda de ratolí, a components');
  });

  test('l’ordre literal: --sdp-primary és un fantasma (el color s’heretaria)', () => {
    expect(DECLARATS.has('--sdp-primary')).toBe(false);
    const fallades = auditaJerarquia(LAYOUT, APPS_LITERAL, DECLARATS);
    expect(fallades).toEqual([`títol de grup: color ${varDe('--sdp-primary')}`, 'token fantasma --sdp-primary']);
  });

  test('el cens d’usos del token caça un enllaç o una capçalera pintats amb ell', () => {
    expect(usosDelToken(`.nav-item { color: var(${GRUP}); }`)).toEqual(['.nav-item { color }']);
    expect(usosDelToken(`@layer components { .app-grid-col-header__titol, .x { background: var(${GRUP}); } }`))
      .toEqual(['.app-grid-col-header__titol { background }', '.x { background }']);
    expect(usosDelToken('.a { color: var(--sdp-crom-text); }')).toEqual([]);
  });
});

/* ── Els fulls d'ara ─────────────────────────────────────────────────── */
describe('el token de lletra de grup · tokens.css', () => {
  test('es declara una sola vegada a tot src, al :root clar, amb el cànon; mai al fosc ni al Bancal (K1)', () => {
    const patro = new RegExp(`${GRUP}\\s*:`, 'g');
    const on = fullsCss(resolve(ARREL, 'src'))
      .flatMap((abs) => (senseComentaris(readFileSync(abs, 'utf8')).match(patro) || []).map(() => abs.slice(ARREL.length + 1)));
    expect(on).toEqual(['src/css/tokens.css']);
    expect(tokensDe(bloc(TOKENS, SEL_CLAR))[GRUP]).toBe(varDe('--sdp-primary-500'));
    for (const selector of [SEL_FOSC, SEL_BANCAL, SEL_BANCAL_FOSC]) expect(tokensDe(bloc(TOKENS, selector))[GRUP]).toBeUndefined();
  });

  test('és taronja i no el groc de sistema ni el token de fons de l’actiu', () => {
    expect(hex(CLAR, GRUP)).toBe(hex(CLAR, '--sdp-canon-taronja'));
    expect(hex(CLAR, GRUP)).not.toBe(hex(CLAR, '--sdp-crom-sistema'));
    expect(tokensDe(bloc(TOKENS, SEL_CLAR))[GRUP]).not.toMatch(/--sdp-crom-actiu-fons/);
  });

  test.each(Object.keys(MODES))('en %s: el mateix taronja sobre la mateixa roca, 7:1 o més; el hover blanc també', (mode) => {
    const mapa = MODES[mode];
    expect(hex(mapa, GRUP)).toBe(hex(CLAR, GRUP));
    expect(hex(mapa, '--sdp-crom-fons')).toBe(hex(CLAR, '--sdp-crom-fons'));
    expect(contrast(mapa, GRUP, '--sdp-crom-fons')).toBeGreaterThanOrEqual(7);
    expect(contrast(mapa, '--sdp-crom-text', '--sdp-crom-fons')).toBeGreaterThanOrEqual(7);
  });

  test('no servix de lletra sobre les capçaleres de columna (C4, 261004): per davall de 7:1 sobre Grafit 700, 750 i 800', () => {
    for (const fons of ['--sdp-crom-capcalera', '--sdp-crom-subcapcalera', '--sdp-crom-subcapcalera-fosca']) {
      expect(contrast(CLAR, GRUP, fons), fons).toBeLessThan(7);
    }
  });
});

describe('veracitat dels comentaris de contrast', () => {
  const COMENTARIS = [
    { on: 'tokens.css', text: comentariAbans(TOKENS, `${GRUP}:`), b: '--sdp-crom-fons', diu: '7,12:1' },
    { on: 'tokens.css', text: comentariAbans(TOKENS, `${GRUP}:`), b: '--sdp-crom-capcalera', diu: '4,11:1' },
    { on: 'layout.css', text: comentariAbans(LAYOUT, `\n@layer components {\n  ${DESPLEGABLE} {`), b: '--sdp-crom-fons', diu: '7,12:1' },
    { on: 'apps.css', text: comentariAbans(APPS, `\n${TITOL_GRUP} {`), b: '--sdp-crom-fons', diu: '7,12:1' }
  ];

  test.each(COMENTARIS)('$on diu «$diu» (el taronja de grup sobre $b) i és el contrast real', ({ text, b, diu }) => {
    expect(text).toContain(diu);
    const declarat = Number(diu.replace(':1', '').replace(',', '.'));
    expect(Math.abs(contrast(CLAR, GRUP, b) - declarat)).toBeLessThan(0.005 + 1e-9);
  });

  test('els hex que nomena el comentari del token són els valors reals de la roca, el cànon i el Grafit 700', () => {
    const text = comentariAbans(TOKENS, `${GRUP}:`);
    const nomenats = [...new Set([...text.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()))].sort();
    expect(nomenats).toEqual([hex(CLAR, '--sdp-crom-fons'), hex(CLAR, GRUP), hex(CLAR, '--sdp-crom-capcalera')].sort());
  });
});

describe('les regles · layout.css i apps.css', () => {
  test('cap fallada: «Sistema» i els títols de grup en taronja i 600, a components, i el hover blanc dins de la guarda', () => {
    expect(auditaJerarquia(LAYOUT, APPS, DECLARATS)).toEqual([]);
  });

  test('la regla de «Sistema» viu en un bloc de components de primer nivell, abans de la portada buida', () => {
    const regla = regles(LAYOUT).filter((r) => r.selectors.includes(DESPLEGABLE) && valorDe(r, 'color') !== undefined);
    expect(regla.map((r) => r.context)).toEqual([['@layer components']]);
    const text = net(senseComentaris(LAYOUT));
    const posicio = text.indexOf(`@layer components { ${DESPLEGABLE} {`);
    expect(posicio).toBeGreaterThan(text.indexOf('@layer legacy {'));
    expect(posicio).toBeLessThan(text.indexOf('.hero-image--buit'));
  });

  test('la T5 de legacy continua sense color: una sola font per al rètol de «Sistema»', () => {
    const t5 = regles(LAYOUT).filter((r) => r.selectors.includes(DESPLEGABLE) && r.context.join() === '@layer legacy');
    expect(t5).toHaveLength(1);
    expect(declaracions(t5[0].cos)).toEqual([['border', '0'], ['background', 'transparent'], ['cursor', 'pointer'], ['text-align', 'start']]);
  });

  test('la regla de Bancal que torna blanc tot .nav-item:not(.active) viu a legacy, i components va darrere a index.css', () => {
    const bancal = regles(LAYOUT).filter((r) => r.selectors.includes(':root[data-contrast="bancal"] .nav-item:not(.active)'));
    expect(bancal).toHaveLength(1);
    expect(bancal[0].context).toEqual(['@layer legacy']);
    expect(valorDe(bancal[0], 'color')).toBe('var(--sdp-crom-text)');
    const ordre = /@layer ([\w, ]+);/.exec(senseComentaris(llig('src/css/index.css')))[1].split(',').map((s) => s.trim());
    expect(ordre.indexOf('components')).toBeGreaterThan(ordre.indexOf('legacy'));
  });

  test('els enllaços continuen blancs, l’actiu amb el seu ple taronja, i el nom de l’app, blanc i 700', () => {
    const L = regles(LAYOUT);
    const base = L.filter((r) => r.selectors.includes('.nav-item')).map((r) => valorDe(r, 'color')).filter(Boolean);
    expect(base).toEqual(['var(--sdp-crom-text-suau)']);
    const actiu = L.filter((r) => r.selectors.includes('.nav-item.active'));
    expect(actiu.map((r) => valorDe(r, 'background')).filter(Boolean)).toEqual(['var(--sdp-crom-actiu-fons)']);
    expect(actiu.map((r) => valorDe(r, 'color')).filter(Boolean)).toEqual(['var(--sdp-crom-actiu-text)']);
    const titol = regles(APPS).filter((r) => r.selectors.includes('.sdp-app-barra__titol'));
    expect(titol.map((r) => [valorDe(r, 'color'), valorDe(r, 'font-weight')])).toEqual([['var(--sdp-crom-text)', '700']]);
  });

  test('a tot src, només pinten amb el token els dos títols que no són enllaços, i només la lletra', () => {
    const usos = fullsCss(resolve(ARREL, 'src'))
      .flatMap((abs) => usosDelToken(readFileSync(abs, 'utf8')).map((u) => `${abs.slice(ARREL.length + 1)}: ${u}`))
      .sort();
    expect(usos).toEqual([
      `src/apps/plataforma/apps.css: ${TITOL_GRUP} { color }`,
      `src/css/layout.css: ${DESPLEGABLE} { color }`
    ]);
  });
});
