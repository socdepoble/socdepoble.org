// @vitest-environment node
/* Pla 261004_0050 · Fulls de la closca i del layout: layout.css,
   AppGridShell.css, sdp.css, utilities.css, PerfilShell.css i
   catalegColleccio.css. jsdom no resol la cascada ni pinta: es comproven les
   regles escrites, i el contrast es calcula amb la fórmula WCAG 2.x sobre els
   valors de tokens.css, en clar i en fosc, seguint el token que nomena cada
   regla (si la regla canvia de token, la xifra canvia amb ella).
   Cada guarda es prova també contra una còpia literal de les regles d'abans
   del torn: si no les detectara, la guarda no guardaria res.
   Decisions del Mestre: Q1 (AAA sempre i Mode Bancal), Q2 (tàctil de 48px),
   Q4 (calaixos de 280ms) i Q5 (títol fluid). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

const RUTES = [
  'src/css/layout.css',
  'src/components/layout/AppGridShell.css',
  'src/css/sdp.css',
  'src/css/utilities.css',
  'src/sections/profile/PerfilShell.css',
  'src/components/PedraSeca/catalegColleccio.css'
];
const CSS = Object.fromEntries(RUTES.map((ruta) => [ruta, senseComentaris(llig(ruta))]));
const LAYOUT = CSS['src/css/layout.css'];
const GRAELLA = CSS['src/components/layout/AppGridShell.css'];
/* base.css (mateixa capa `legacy`, abans que layout.css) porta l'anell de
   focus de la closca, barra mòbil inclosa, i l'apagador de moviment reduït. */
const BASE = senseComentaris(llig('src/css/base.css'));

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
const cosDe = (llista, selector) => llista.filter((r) => r.selectors.includes(selector)).map((r) => r.cos).join('; ');
const tokenDe = (cos, propietat) => declaracions(cos).filter(([p]) => p === propietat).pop()?.[1].match(/^var\((--[\w-]+)\)/)?.[1];

/* ── Tokens: el bloc clar, el fosc (que hi escriu damunt) i els declarats ── */
const TOKENS_CSS = senseComentaris(`${llig('src/css/design-tokens.css')}\n${llig('src/css/tokens.css')}`);
const REGLES_TOKENS = regles(TOKENS_CSS);
const DECLARATS = new Set([...TOKENS_CSS.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

function tema(predicat) {
  const mapa = new Map();
  for (const r of REGLES_TOKENS.filter((x) => x.context.length === 0 && predicat(x.selectors))) {
    for (const [propietat, valor] of declaracions(r.cos)) if (propietat.startsWith('--')) mapa.set(propietat, valor);
  }
  return mapa;
}
const CLAR = tema((s) => s.includes(':root') && s.includes(':host'));
const FOSC = new Map([...CLAR, ...tema((s) => s.includes(':root[data-theme="dark"]'))]);
const TEMES = [['clar', CLAR], ['fosc', FOSC]];

function valor(mapa, nom, salts = 0) {
  const v = mapa.get(nom);
  if (v === undefined) return null;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref && salts < 20 ? valor(mapa, ref[1], salts + 1) : v;
}

/** El color d'un token en un tema, o null si el token no hi és o no és un color. */
function color(mapa, nom) {
  const v = nom ? valor(mapa, nom)?.toLowerCase() : null;
  if (!v) return null;
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  return rgb ? { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) } : null;
}

/** Un color translúcid compost damunt d'un fons opac. */
const sobre = (dalt, baix) => ({
  r: dalt.r * dalt.a + baix.r * (1 - dalt.a),
  g: dalt.g * dalt.a + baix.g * (1 - dalt.a),
  b: dalt.b * dalt.a + baix.b * (1 - dalt.a),
  a: 1
});
const lineal = (canal) => {
  const s = canal / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lluminancia = ({ r, g, b }) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
const contrast = (a, b) => {
  const [clar, fosc] = [lluminancia(a), lluminancia(b)].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
};

/* ── Guardes ─────────────────────────────────────────────────────────── */
const NAV = ':where(.sdp-root.is-compact) nav.mobile-nav';
const ITEM = ':where(.sdp-root.is-compact) .mobile-nav .nav-item';
const CTA = ':where(.sdp-root.is-compact) .mobile-nav__cta';

/** Barra mòbil: fosca en els dos temes (Llei de la Roca), opaca, i cada
    estat amb el seu contrast. Torna la llista de fallades. */
function auditaBarra(css) {
  const rl = regles(css);
  const fallades = [];
  const fonsDe = (t) => color(t, tokenDe(cosDe(rl, NAV), 'background'));
  if (!fonsDe(CLAR) || !fonsDe(FOSC)) return ['la barra no pinta amb cap token de color'];
  if (lluminancia(fonsDe(FOSC)) >= 0.02 || lluminancia(fonsDe(CLAR)) >= 0.02) fallades.push('la barra no és fosca en els dos temes');
  if (/backdrop-filter/.test(cosDe(rl, NAV))) fallades.push('backdrop-filter sobre un fons opac');
  if (declaracions(cosDe(rl, ITEM)).some(([p]) => p === 'opacity')) fallades.push('el rètol depén d’una opacitat');
  for (const [nom, t] of TEMES) {
    const barra = fonsDe(t);
    const estat = (selector, minim, fons = barra, text = null) => {
      const cos = cosDe(rl, selector);
      const fonsEstat = color(t, tokenDe(cos, 'background')) ? sobre(color(t, tokenDe(cos, 'background')), fons) : fons;
      const colorText = text || (color(t, tokenDe(cos, 'color')) ? sobre(color(t, tokenDe(cos, 'color')), fonsEstat) : null);
      if (!colorText) { fallades.push(`${nom}: ${selector} sense color`); return fonsEstat; }
      const ratio = contrast(colorText, fonsEstat);
      if (ratio < minim) fallades.push(`${nom}: ${selector} ${ratio.toFixed(2)}:1`);
      return fonsEstat;
    };
    estat(ITEM, 7);
    estat(`${ITEM}:hover`, 7);
    const fonsActiu = estat(`${ITEM}.active`, 7);
    const textActiu = sobre(color(t, tokenDe(cosDe(rl, `${ITEM}.active`), 'color')) || barra, fonsActiu);
    estat(`${ITEM}.active:hover`, 7, barra, textActiu);
    const anell = color(t, tokenDe(cosDe(rl, '.mobile-nav :focus-visible'), 'outline-color'));
    if (!anell || contrast(anell, barra) < 3) fallades.push(`${nom}: anell de focus per davall de 3:1`);
    const fonsCta = estat(CTA, 7);
    const iconaCta = sobre(color(t, tokenDe(cosDe(rl, CTA), 'color')) || fonsCta, fonsCta);
    const hoverCta = estat(`${CTA}:hover`, 7, barra, iconaCta);
    if (lluminancia(hoverCta) === lluminancia(fonsCta)) fallades.push(`${nom}: el hover del botó central no canvia res`);
  }
  if (!/transform: scale\(var\(--sdp-escala-premut\)\)/.test(cosDe(rl, `${CTA}:active`))) fallades.push('el premut no és l’escala comuna');
  return fallades;
}

const GUARDA = '@media (hover: hover) and (pointer: fine)';
/** Els :hover fora de la guarda de ratolí. Un neutralitzador iguala el hover
    al repòs (la mateixa regla nomena el selector sense :hover): al tàctil no
    pot quedar res enganxat, i no compta. */
function hoversSenseGuarda(css) {
  const fora = [];
  for (const r of regles(css)) {
    if (r.context.includes(GUARDA)) continue;
    for (const s of r.selectors.filter((x) => x.includes(':hover'))) {
      const repos = s.replace(/:hover/g, '').replace(/:not\(:disabled\)$/, '');
      if (!r.selectors.includes(repos)) fora.push(s);
    }
  }
  return fora;
}

/** Mides de lletra literals per davall del sòl de 14px (l'avatar xs és l'excepció). */
function lletraMenuda(css) {
  const dolentes = [];
  for (const r of regles(css)) {
    for (const [p, v] of declaracions(r.cos)) {
      const mida = p === 'font-size' && v.match(/^(\d*\.?\d+)(rem|px)$/);
      if (!mida) continue;
      const px = mida[2] === 'rem' ? Number(mida[1]) * 16 : Number(mida[1]);
      if (px < 14 && !r.selectors.includes('.sdp-avatar--xs')) dolentes.push(`${r.selectors.join(', ')}: ${v}`);
    }
  }
  return dolentes;
}

/* El contracte compartit del pla: el declara tokens.css, no estos fulls. */
const CONTRACTE = ['--sdp-corba-calaix', '--sdp-corba-eixida', '--sdp-durada-base', '--sdp-durada-panell',
  '--sdp-durada-premut', '--sdp-escala-premut', '--sdp-fluid-h1'];
const usats = (css) => [...senseComentaris(css).matchAll(/var\(\s*(--sdp-[\w-]+)/g)].map((m) => m[1]);
const fantasmes = (css) => [...new Set(usats(css).filter((n) => !CONTRACTE.includes(n) && !DECLARATS.has(n)))];

/* ── Còpies literals de regles d'abans del torn (els defectes que es corregixen) ── */
const BARRA_ABANS = `
  .mobile-nav :focus-visible { outline-color: var(--sdp-accent-text); }
  :where(.sdp-root.is-compact) nav.mobile-nav { background: var(--sdp-fons-invers); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-top: 1px solid var(--sdp-crom-buit); }
  :where(.sdp-root.is-compact) .mobile-nav .nav-item { background: none; color: var(--sdp-text-invers); opacity: 0.78; }
  :where(.sdp-root.is-compact) .mobile-nav .nav-item:hover { opacity: 1; color: var(--sdp-accent); background: var(--sdp-crom-hover); }
  :where(.sdp-root.is-compact) .mobile-nav .nav-item.active { opacity: 1; color: var(--sdp-accent); background: var(--sdp-accent-vel); }
  :where(.sdp-root.is-compact) .mobile-nav__cta { background: var(--sdp-accio-forta); color: var(--sdp-text-invers); }
  :where(.sdp-root.is-compact) .mobile-nav__cta:hover { background: var(--sdp-accio-hover); }
  :where(.sdp-root.is-compact) .mobile-nav__cta:active { background: var(--sdp-accio-forta); transform: scale(0.94); }`;
const HOVER_ABANS = '.perfil-identitat:hover { background: var(--sdp-fons-subtil); } @media (hover: hover) { :where(tbody tr:hover) { background: var(--sdp-accent-subtil); } }';
const LLETRA_ABANS = '.sdp-avatar--sm { font-size: 0.68rem; } .sdp-escala__fila { font-size: 0.8rem; } .sdp-avatar--xs { font-size: 0.6rem; }';

describe('les guardes detecten les regles d’abans del torn', () => {
  test('barra mòbil: s’aclaria en fosc, l’actiu no arribava a AAA, l’anell no arribava a 3:1 i el hover del botó central no canviava', () => {
    const fallades = auditaBarra(BARRA_ABANS);
    expect(fallades).toContain('la barra no és fosca en els dos temes');
    expect(fallades).toContain('backdrop-filter sobre un fons opac');
    expect(fallades).toContain('el rètol depén d’una opacitat');
    expect(fallades.some((f) => f.startsWith(`clar: ${ITEM}.active `))).toBe(true);
    expect(fallades).toContain('fosc: anell de focus per davall de 3:1');
    expect(fallades).toContain('clar: el hover del botó central no canvia res');
    expect(fallades).toContain('el premut no és l’escala comuna');
  });

  test('hover sense guarda, guarda incompleta, lletra menuda i token fantasma', () => {
    expect(hoversSenseGuarda(HOVER_ABANS)).toEqual(['.perfil-identitat:hover', ':where(tbody tr:hover)']);
    expect(lletraMenuda(LLETRA_ABANS)).toEqual(['.sdp-avatar--sm: 0.68rem', '.sdp-escala__fila: 0.8rem']);
    expect(fantasmes(BARRA_ABANS)).toEqual(['--sdp-crom-buit']);
  });
});

/* ── Els fulls d'ara ─────────────────────────────────────────────────── */
describe('barra mòbil · Llei de la Roca', () => {
  test('fosca i igual en clar i en fosc; rètol, hover, actiu, focus i botó central en AAA (focus 3:1)', () => {
    expect(auditaBarra(`${BASE}\n${LAYOUT}`)).toEqual([]);
  });

  test('cap escala de premut escrita a mà', () => {
    expect(LAYOUT).not.toMatch(/scale\(\d*\.\d+\)/);
  });
});

describe('Fase B · cap hover enganxat al tàctil', () => {
  test.each(RUTES)('%s: tot :hover va dins de la guarda, llevat dels neutralitzadors', (ruta) => {
    expect(hoversSenseGuarda(CSS[ruta])).toEqual([]);
  });
});

describe('títol de pàgina · jerarquia fluida (Q5)', () => {
  const RL = regles(LAYOUT);
  test('l’H1 pren --sdp-fluid-h1 i una paraula llarga es parteix en compte de retallar-se', () => {
    const cos = cosDe(RL, 'header.page-title h1');
    expect(tokenDe(cos, 'font-size')).toBe('--sdp-fluid-h1');
    expect(cos).toMatch(/overflow-wrap: break-word/);
  });

  test('cap regla per a un h2 dins del títol (skill pedra-seca §4) ni cap clamp() només en vw', () => {
    expect(RL.some((r) => r.selectors.some((s) => /^header\.page-title h2\b/.test(s)))).toBe(false);
    const titols = RL.filter((r) => r.selectors.some((s) => s.startsWith('header.page-title')));
    expect(titols.map((r) => r.cos).join(' ')).not.toMatch(/clamp\(/);
  });
});

describe('moviment · tokens i propietats que s’animen', () => {
  const transicions = RUTES.flatMap((ruta) => regles(CSS[ruta]).flatMap((r) => declaracions(r.cos)
    .filter(([p]) => p === 'transition')
    .map(([, v]) => ({ ruta, selector: r.selectors.join(', '), v }))));
  const propietats = (v) => v.split(',').map((t) => t.trim().split(' ')[0]);

  test('cap durada ni corba literal a les transicions (només el 0s del visibility)', () => {
    const literals = transicions.filter(({ v }) => /cubic-bezier\(/.test(v) || /(?<![\w.-])(?!0s\b)\d*\.?\d+m?s\b/.test(v));
    expect(literals).toEqual([]);
  });

  test('cap transició anima maquetació, ombres ni «all»', () => {
    const dolentes = transicions.filter(({ v }) => propietats(v).some((p) => /^(all|width|height|min-height|max-height|padding|margin|box-shadow)$/.test(p)));
    expect(dolentes).toEqual([]);
  });

  test('els calaixos (barra lateral i panells de la graella) només animen el transform, amb la durada i la corba de calaix (Q4)', () => {
    const calaixos = transicions.filter(({ selector }) => /app-grid-column--(left|middle)|nav\.app-sidebar/.test(selector));
    expect(calaixos.length).toBeGreaterThanOrEqual(6);
    for (const { selector, v } of calaixos) {
      expect(v, selector).toMatch(/^transform var\(--sdp-durada-panell\) var\(--sdp-corba-calaix\)/);
      expect(propietats(v).every((p) => p === 'transform' || p === 'visibility'), selector).toBe(true);
    }
  });

  test('el diàleg natiu entra amb la durada base i la corba d’eixida', () => {
    const dialeg = cosDe(regles(CSS['src/css/sdp.css']), ':where(dialog[open])');
    expect(dialeg).toMatch(/animation: sdp-aparicio var\(--sdp-durada-base\) var\(--sdp-corba-eixida\)/);
  });

  test('un sol apagador global de moviment reduït: el de base.css, que també cobrix el scroll suau', () => {
    expect(LAYOUT).not.toMatch(/prefers-reduced-motion/);
    expect(BASE).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*transition-duration[\s\S]*scroll-behavior: auto/);
  });
});

describe('mides · tàctil (Q2) i sòl de lletra', () => {
  test('cap 44px a mà a la closca: la cel·la tàctil és el token', () => {
    expect(LAYOUT).not.toMatch(/\b44px\b/);
    expect(GRAELLA).not.toMatch(/\b44px\b/);
  });

  test.each(RUTES)('%s: cap mida de lletra per davall de 14px (excepció justificada: l’avatar xs)', (ruta) => {
    expect(lletraMenuda(CSS[ruta])).toEqual([]);
  });
});

describe('Mode Bancal (Q1) · cap translucidesa sobre la roca', () => {
  const ROOT = ':root[data-contrast="bancal"] ';
  const HOST = ':host([data-contrast="bancal"]) ';
  const esBancal = (r) => r.selectors.some((s) => s.includes('[data-contrast="bancal"]'));
  const bancalDe = (ruta) => regles(CSS[ruta]).filter(esBancal);
  const per = (sufix) => bancalDe('src/css/layout.css').filter((r) => r.selectors.includes(`${ROOT}${sufix}`)).map((r) => r.cos).join('; ');

  test.each(RUTES)('%s: cada regla de Bancal porta la forma :root (lloc propi) i la :host (incrustat)', (ruta) => {
    for (const r of bancalDe(ruta)) {
      const roots = r.selectors.filter((s) => s.startsWith(ROOT)).map((s) => s.slice(ROOT.length));
      const hosts = r.selectors.filter((s) => s.startsWith(HOST)).map((s) => s.slice(HOST.length));
      expect(hosts.sort()).toEqual(roots.sort());
    }
  });

  test('opacitat 1 a les icones de les barres i rètols de la closca en un color sòlid', () => {
    expect(per('.bar-black .right-icons .icon')).toMatch(/opacity: 1/);
    expect(per('.bar-actions .icon')).toMatch(/opacity: 1/);
    const retol = color(CLAR, tokenDe(per('.nav-item:not(.active)'), 'color'));
    expect(retol?.a).toBe(1);
  });

  /* Els --sdp-crom-* no es redefinixen al Bancal (tractor-crom, K1): tot text
     pintat amb el blanc translúcid del crom porta la seua regla de Bancal. */
  test.each(RUTES)('%s: tot text en --sdp-crom-text-suau té la seua regla de Bancal amb un color sòlid', (ruta) => {
    const bancal = bancalDe(ruta);
    const cobert = (selector) => bancal.some((r) => color(CLAR, tokenDe(r.cos, 'color'))?.a === 1
      && r.selectors.some((s) => s === `${ROOT}${selector}`
        || (s === `${ROOT}.nav-item:not(.active)` && /\.nav-item$/.test(selector))));
    const sense = regles(CSS[ruta]).filter((r) => !esBancal(r) && tokenDe(r.cos, 'color') === '--sdp-crom-text-suau')
      .flatMap((r) => r.selectors).filter((s) => !cobert(s));
    expect(sense).toEqual([]);
  });
});

describe('controls amb rètol blanc (Q1) · AAA en repòs i en hover', () => {
  const CONTROLS = [
    [regles(GRAELLA), '.app-grid-col-header__accio'],
    [regles(CSS['src/sections/profile/PerfilShell.css']), ':where(.perfil-pagina) .sdp-boto']
  ];
  test.each(TEMES)('en %s: el botó de capçalera de columna i el botó del Perfil fan 7:1 o més', (_nom, t) => {
    for (const [llista, selector] of CONTROLS) {
      const cos = cosDe(llista, selector);
      const text = color(t, tokenDe(cos, 'color'));
      expect(contrast(text, color(t, tokenDe(cos, 'background'))), selector).toBeGreaterThanOrEqual(7);
      const hover = cosDe(llista, `${selector}:hover:not(:disabled)`);
      expect(contrast(text, color(t, tokenDe(hover, 'background'))), `${selector}:hover`).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('tokens · cap fantasma', () => {
  test.each(RUTES)('%s: tot token que nomena, fora del contracte compartit, està declarat', (ruta) => {
    expect(fantasmes(CSS[ruta])).toEqual([]);
  });

  test('els tokens del contracte que consumixen estos fulls estan declarats a tokens.css', () => {
    const consumits = [...new Set(RUTES.flatMap((ruta) => usats(CSS[ruta])).filter((n) => CONTRACTE.includes(n)))].sort();
    expect(consumits).toEqual(CONTRACTE);
    expect(consumits.filter((n) => !DECLARATS.has(n))).toEqual([]);
  });
});
