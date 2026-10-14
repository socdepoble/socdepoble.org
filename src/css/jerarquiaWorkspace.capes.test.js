/* Decisió del Mestre, 14-10-2026 (pla 261013_1930, front 1b) · Jerarquia de la
   1a columna de UniversalWorkspace: els contenidors van en Taronja 400 amb un
   token de LLETRA propi, --sdp-crom-contenidor-text, declarat una sola vegada
   al :root clar (tractor-crom, K1):
     · contenidor pur: la capçalera de grup (.sdp-workspace-group-heading), que
       només plega;
     · contenidor-enllaç: el nom de la carpeta amb fills, l'únic nom de fila amb
       aria-expanded (CategoryBranch, UniversalWorkspace.arbre.test.jsx), i el
       seu desplegador, el germà adjacent.
   Les fulles continuen en --sdp-crom-text, la selecció blava (T62b) no es toca
   i les icones hereten per currentColor. Amb el ratolí, el blanc de sempre,
   com «Sistema» (jerarquiaBarraLateral.capes.test.js, el model d'esta prova).
   L'ordre nomenava tokens que no existixen: un var() a un token absent es
   resol a buit i el color s'hereta sense que res avise.
   jsdom no resol la cascada: es comproven les regles escrites, el contrast es
   calcula amb la fórmula WCAG 2.x sobre els valors de tokens.css en els quatre
   modes, i els selectors pintats es passen pel DOM real del component (jsdom
   sí que sap si un selector casa). Cada guarda es prova també contra regles
   que no complixen: si no les detectara, no guardaria res. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from '../components/universal/workspace/UniversalWorkspace.jsx';

vi.mock('../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
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
const FULLS_SRC = fullsCss(resolve(ARREL, 'src'));
const relatiu = (abs) => abs.slice(ARREL.length + 1);

const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const MODULES = llig('src/css/modules.css');

const TOKEN = '--sdp-crom-contenidor-text';
const GRUP = '--sdp-crom-grup-text';
const NAV = '--sdp-workspace-nav-fons';
const VEL = '--sdp-crom-hover';
const GUARDA = '@media (hover: hover) and (pointer: fine)';
const SEL_GRUP = '.sdp-workspace-group-heading > .sdp-workspace-nav-item';
const SEL_CARPETA = '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-expanded]:not([aria-current="page"]):not(.sdp-workspace-folder-toggle)';
const SEL_DESPLEGADOR = '.sdp-workspace-folder-row > .sdp-workspace-nav-item:not([aria-current="page"]) + .sdp-workspace-folder-toggle';
const PINTATS = [SEL_GRUP, SEL_CARPETA, SEL_DESPLEGADOR];
/* Els noms que portaven el pla i el prompt: cap existix. */
const FANTASMES = ['--sdp-accent-taronja', '--sdp-orange', '--sdp-orange-accessible', '--sdp-radius-pill'];

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
const contrastHex = (x, y) => {
  const [a, b] = [lluminancia(x), lluminancia(y)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const contrast = (mapa, a, b) => contrastHex(hex(mapa, a), hex(mapa, b));
/** El vel translúcid compost sobre un fons opac, arrodonit a 8 bits com el pintat. */
function compost(mapa, vel, fons) {
  const v = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(hex(mapa, vel));
  if (!v) throw new Error(`No és un rgba(): ${vel}`);
  const alfa = Number(v[4]);
  const base = /^#([0-9a-f]{6})$/.exec(hex(mapa, fons))[1];
  return `#${[0, 1, 2].map((k) => Math.round(Number(v[k + 1]) * alfa + parseInt(base.slice(2 * k, 2 * k + 2), 16) * (1 - alfa))
    .toString(16).padStart(2, '0')).join('')}`;
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

/* ── Guardes ─────────────────────────────────────────────────────────── */
const ultimCompost = (s) => s.split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
/** Els selectors que pinten amb el token, regla a regla. */
const pintadesDe = (css) => regles(css).filter((r) => declaracions(r.cos).some(([, v]) => v.includes(`var(${TOKEN})`)));
const selectorsPintats = (css) => pintadesDe(css).flatMap((r) => r.selectors);

/** Les fallades de la jerarquia en un modules.css donat. */
function auditaContenidors(css, declarats) {
  const fallades = [];
  const R = regles(css);
  const pintades = pintadesDe(css);
  const selectors = pintades.flatMap((r) => r.selectors);
  if ([...selectors].sort().join(' | ') !== [...PINTATS].sort().join(' | ')) {
    fallades.push(`selectors pintats: ${selectors.join(' | ') || 'cap'}`);
  }
  /* A components (legacy perdria contra components i el Bancal), i només la lletra. */
  for (const r of pintades) {
    if (r.context.join(' | ') !== '@layer components') fallades.push(`el color viu a [${r.context.join(', ')}]`);
    for (const [p, v] of declaracions(r.cos)) if (v.includes(`var(${TOKEN})`) && p !== 'color') fallades.push(`pinta ${p}, no la lletra`);
  }
  for (const s of selectors) {
    /* La capçalera de grup mai porta aria-current: només plega. */
    const deGrup = s === SEL_GRUP;
    /* Combinador de fill: el títol plegable de la capçalera de columna també
       és .sdp-workspace-nav-item[aria-expanded] (AppGridColumn.jsx). */
    if (!s.startsWith('.sdp-workspace-group-heading > ') && !s.startsWith('.sdp-workspace-folder-row > ')) fallades.push(`sense combinador de fill: ${s}`);
    if (!deGrup && !s.includes(':not([aria-current="page"])')) fallades.push(`no exclou l’actiu: ${s}`);
    /* El desplegador també porta aria-expanded i la classe del nom: només el
       pinta el selector del germà, que sap si el nom és l'actiu. */
    if (s.includes('[aria-expanded]') && !s.includes(':not(.sdp-workspace-folder-toggle)')) fallades.push(`el nom també casa amb el desplegador: ${s}`);
    if (/app-grid-col-header/.test(s)) fallades.push(`toca la capçalera de columna: ${s}`);
    if (/svg|__icon|nav-glyph|group-chevron/.test(ultimCompost(s))) fallades.push(`pinta una icona a banda: ${s}`);
    if (s.includes(':has(')) fallades.push(`:has() fora del Baseline 2022: ${s}`);
  }
  /* Amb el ratolí, el blanc de sempre i només dins de la guarda. */
  for (const s of PINTATS) {
    const hover = R.filter((r) => r.selectors.includes(`${s}:hover`));
    if (hover.length !== 1
      || hover[0].context.join(' | ') !== ['@layer components', GUARDA].join(' | ')
      || valorDe(hover[0], 'color') !== 'var(--sdp-crom-text)') {
      fallades.push(`el hover no torna al blanc dins de la guarda de ratolí, a components: ${s}`);
    }
  }
  /* Cap fantasma a les regles dels contenidors. */
  const propies = R.filter((r) => r.selectors.some((s) => PINTATS.includes(s) || PINTATS.includes(s.replace(/:hover$/, '')) || selectors.includes(s)));
  for (const r of propies) {
    for (const [, valor] of declaracions(r.cos)) {
      for (const m of valor.matchAll(/var\(\s*(--[\w-]+)/g)) if (!declarats.has(m[1])) fallades.push(`token fantasma ${m[1]}`);
    }
  }
  return fallades;
}

/** On es cita un token: [`full: selector { propietat }`]. */
function usosDe(token) {
  return FULLS_SRC.flatMap((abs) => regles(readFileSync(abs, 'utf8')).flatMap((r) => declaracions(r.cos)
    .filter(([, v]) => v.includes(`var(${token})`))
    .flatMap(([p]) => r.selectors.map((s) => `${relatiu(abs)}: ${s} { ${p} }`)))).sort();
}

/* ── Fixtures: regles que no complixen ── */
const AMB_HOVER = (selectors) => `${GUARDA} { ${selectors.map((s) => `${s}:hover`).join(', ')} { color: var(--sdp-crom-text); } }`;
const LITERAL_CARPETA = '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-expanded]:not([aria-current="page"])';

describe('les guardes detecten les regles que no complixen', () => {
  test('abans del torn: cap regla pinta els contenidors', () => {
    const fallades = auditaContenidors('@layer components { .sdp-workspace-nav-item { color: inherit; } }', DECLARATS);
    expect(fallades).toContain('selectors pintats: cap');
    expect(fallades).toContain(`el hover no torna al blanc dins de la guarda de ratolí, a components: ${SEL_GRUP}`);
  });

  test('un selector ample pinta també el títol plegable de la columna i l’actiu', () => {
    const ample = '.sdp-workspace-nav-item[aria-expanded]';
    const fallades = auditaContenidors(`@layer components { ${ample} { color: var(${TOKEN}); } }`, DECLARATS);
    expect(fallades).toContain(`sense combinador de fill: ${ample}`);
    expect(fallades).toContain(`no exclou l’actiu: ${ample}`);
  });

  test('el selector del nom sense excloure el desplegador: el desplegador de l’actiu es pintaria', () => {
    const css = `@layer components { ${SEL_GRUP}, ${LITERAL_CARPETA}, ${SEL_DESPLEGADOR} { color: var(${TOKEN}); } ${AMB_HOVER(PINTATS)} }`;
    expect(auditaContenidors(css, DECLARATS)).toContain(`el nom també casa amb el desplegador: ${LITERAL_CARPETA}`);
  });

  test('a legacy, sense el hover, amb una icona pintada a banda o amb un fantasma', () => {
    const legacy = auditaContenidors(`@layer legacy { ${PINTATS.join(', ')} { color: var(${TOKEN}); } }`, DECLARATS);
    expect(legacy).toContain('el color viu a [@layer legacy]');
    expect(legacy).toContain(`el hover no torna al blanc dins de la guarda de ratolí, a components: ${SEL_CARPETA}`);
    const icona = `${SEL_GRUP} svg`;
    expect(auditaContenidors(`@layer components { ${icona} { color: var(${TOKEN}); } }`, DECLARATS)).toContain(`pinta una icona a banda: ${icona}`);
    const fantasma = auditaContenidors(`@layer components { ${PINTATS.join(', ')} { color: var(--sdp-orange-accessible); } }`, DECLARATS);
    expect(fantasma).toContain('token fantasma --sdp-orange-accessible');
  });
});

/* ── Els fulls d'ara ─────────────────────────────────────────────────── */
describe('el token de lletra dels contenidors · tokens.css', () => {
  test('es declara una sola vegada a tot src, al :root clar, amb la Taronja 400; mai al fosc ni al Bancal (K1)', () => {
    const patro = new RegExp(`${TOKEN}\\s*:`, 'g');
    const on = FULLS_SRC.flatMap((abs) => (senseComentaris(readFileSync(abs, 'utf8')).match(patro) || []).map(() => relatiu(abs)));
    expect(on).toEqual(['src/css/tokens.css']);
    expect(tokensDe(bloc(TOKENS, SEL_CLAR))[TOKEN]).toBe('var(--sdp-primary-400)');
    for (const selector of [SEL_FOSC, SEL_BANCAL, SEL_BANCAL_FOSC]) expect(tokensDe(bloc(TOKENS, selector))[TOKEN]).toBeUndefined();
  });

  test('no és el token de grup de la roca ni el de fons de l’actiu, i és el to de l’anell de focus del crom', () => {
    const cru = tokensDe(bloc(TOKENS, SEL_CLAR))[TOKEN];
    expect(cru).not.toMatch(/--sdp-crom-grup-text|--sdp-crom-actiu-fons|--sdp-primary-500/);
    expect(hex(CLAR, TOKEN)).not.toBe(hex(CLAR, GRUP));
    expect(hex(CLAR, TOKEN)).toBe(hex(CLAR, '--sdp-crom-focus'));
  });

  test.each(Object.keys(MODES))('en %s: la mateixa Taronja 400 sobre la mateixa columna, 4,5:1 o més', (mode) => {
    const mapa = MODES[mode];
    expect(hex(mapa, TOKEN)).toBe(hex(CLAR, TOKEN));
    expect(hex(mapa, NAV)).toBe(hex(CLAR, NAV));
    expect(contrast(mapa, TOKEN, NAV)).toBeGreaterThanOrEqual(4.5);
  });

  test('al to canònic fa 5,17:1 sobre la columna', () => {
    expect(Math.abs(contrast(CLAR, TOKEN, NAV) - 5.17)).toBeLessThan(0.005 + 1e-9);
  });

  test('amb el ratolí baixaria del 4,5:1 sobre el vel: per això el hover torna al blanc, AAA', () => {
    const vel = compost(CLAR, VEL, NAV);
    expect(contrastHex(hex(CLAR, TOKEN), vel)).toBeLessThan(4.5);
    expect(contrastHex(hex(CLAR, '--sdp-crom-text'), vel)).toBeGreaterThanOrEqual(7);
  });

  test('el token de grup de la roca no arriba al 4,5:1 sobre esta columna', () => {
    expect(contrast(CLAR, GRUP, NAV)).toBeLessThan(4.5);
  });

  test('la línia del token no porta cap xifra de contrast (C2 la mesuraria contra la targeta blanca)', () => {
    const linia = TOKENS.split('\n').find((l) => new RegExp(`^\\s*${TOKEN}\\s*:`).test(l));
    expect(linia).toBeTruthy();
    expect(linia).not.toMatch(/\d+[.,]\d+\s*:\s*1/);
  });
});

describe('veracitat del comentari del token', () => {
  const TEXT = comentariAbans(TOKENS, `${TOKEN}:`);
  const COMENTARIS = [
    { diu: '5,17:1', que: 'la Taronja 400 sobre la columna', mesura: () => contrast(CLAR, TOKEN, NAV) },
    { diu: '3,92:1', que: 'la Taronja 400 sobre el vel de hover', mesura: () => contrastHex(hex(CLAR, TOKEN), compost(CLAR, VEL, NAV)) },
    { diu: '4,11:1', que: 'el cànon sobre la columna', mesura: () => contrast(CLAR, GRUP, NAV) }
  ];

  test.each(COMENTARIS)('diu «$diu» ($que) i és el contrast real', ({ diu, mesura }) => {
    expect(TEXT).toContain(diu);
    const declarat = Number(diu.replace(':1', '').replace(',', '.'));
    expect(Math.abs(mesura() - declarat)).toBeLessThan(0.005 + 1e-9);
  });

  test('els hex que nomena són els valors reals de la columna, del token i del vel compost', () => {
    const nomenats = [...new Set([...TEXT.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()))].sort();
    expect(nomenats).toEqual([hex(CLAR, NAV), hex(CLAR, TOKEN), compost(CLAR, VEL, NAV)].sort());
  });
});

describe('les regles · modules.css', () => {
  test('cap fallada: els tres contenidors en el token, a components, i el hover blanc dins de la guarda', () => {
    expect(auditaContenidors(MODULES, DECLARATS)).toEqual([]);
  });

  test('a tot src, només pinten amb el token els tres contenidors de modules.css, i només la lletra', () => {
    expect(usosDe(TOKEN)).toEqual(PINTATS.map((s) => `src/css/modules.css: ${s} { color }`).sort());
  });

  test('el token de grup de la roca conserva el seu cens de dos usos (jerarquiaBarraLateral)', () => {
    expect(usosDe(GRUP)).toEqual([
      'src/apps/plataforma/apps.css: .sdp-app-barra__grup { color }',
      'src/css/layout.css: nav.app-sidebar .nav-item--desplegable { color }'
    ]);
  });

  test('cap regla dona color propi al xebró del grup: segueix el botó per currentColor', () => {
    const xebro = regles(MODULES).filter((r) => r.selectors.some((s) => ultimCompost(s).includes('sdp-workspace-group-chevron')));
    expect(xebro.length).toBeGreaterThan(0);
    for (const r of xebro) expect(declaracions(r.cos).filter(([p]) => /^(color|fill|stroke)$/.test(p))).toEqual([]);
  });

  test('cap token fantasma de l’ordre existix ni es cita a modules.css', () => {
    const sense = senseComentaris(MODULES);
    for (const fantasma of FANTASMES) {
      expect(DECLARATS.has(fantasma), fantasma).toBe(false);
      expect(sense.includes(`var(${fantasma})`), fantasma).toBe(false);
    }
  });
});

/* ── El DOM real: quins elements casen amb els selectors pintats ── */
const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'carpetes', options: [{ id: 1, label: 'Wiki' }, { id: 2, parentId: 1, label: 'Saber' }, { id: 4, label: 'Mur' }] },
    { id: 'etiquetes', label: 'ETIQUETES', options: [{ id: 10, label: 'Fonaments' }] }
  ],
  items: [
    { id: 'portada', title: 'Portada de la Wiki', categoryIds: [1] },
    { id: 'saber', title: 'Com sabem', categoryIds: [2] },
    { id: 'cronica', title: 'Crònica del Mur', categoryIds: [4] },
    { id: 'fonament', title: 'Un fonament', categoryIds: [10] }
  ]
});

describe('el DOM de UniversalWorkspace', () => {
  beforeAll(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    }
    // jsdom no fa layout: sense amplada, la columna esquerra quedaria en rail.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
  });
  afterEach(() => cleanup());

  const munta = () => render(createElement(UniversalWorkspace, { model: MODEL, initialSelection: { categoryId: '__all__', itemId: null } }));
  const boto = (nom) => screen.getByRole('button', { name: nom });

  test('pinta la capçalera de grup, la carpeta amb fills i el seu desplegador; ni les fulles, ni l’actiu, ni el títol de la columna, ni les icones', () => {
    const selector = selectorsPintats(MODULES).join(', ');
    expect(selector).not.toBe('');
    const pinta = (el) => el.matches(selector);
    const { container } = munta();

    expect(pinta(boto('ETIQUETES'))).toBe(true);
    expect(pinta(boto('Wiki'))).toBe(true);
    expect(pinta(boto('Desplegar Wiki'))).toBe(true);
    expect(pinta(boto('Mur'))).toBe(false);
    expect(pinta(boto('Fonaments'))).toBe(false);

    /* El títol plegable és un nav-item amb aria-expanded: només el combinador
       de fill el deixa fora. */
    const plegable = container.querySelector('.app-grid-col-header__plegable');
    expect(plegable).toBeTruthy();
    expect(plegable.matches('.sdp-workspace-nav-item[aria-expanded]')).toBe(true);
    expect(pinta(plegable)).toBe(false);

    const icones = [...container.querySelectorAll('.sdp-workspace-column svg, .sdp-workspace-nav-item__icon, .sdp-workspace-group-chevron')];
    expect(icones.length).toBeGreaterThan(0);
    expect(icones.filter(pinta)).toEqual([]);

    /* La carpeta activa torna a la selecció blava: ni el nom ni el desplegador. */
    fireEvent.click(boto('Wiki'));
    expect(boto('Wiki').getAttribute('aria-current')).toBe('page');
    expect(pinta(boto('Wiki'))).toBe(false);
    expect(pinta(boto('Plegar Wiki'))).toBe(false);
    expect(pinta(boto('Saber'))).toBe(false);
    expect(pinta(boto('ETIQUETES'))).toBe(true);
  });

  test('el selector del nom sense excloure el desplegador casaria amb el desplegador de la carpeta activa', () => {
    munta();
    fireEvent.click(boto('Wiki'));
    expect(boto('Plegar Wiki').matches(LITERAL_CARPETA)).toBe(true);
    expect(boto('Plegar Wiki').matches(SEL_CARPETA)).toBe(false);
  });
});
