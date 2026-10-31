import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';

/* T62 · L'estat actiu dels menús secundaris passa de taronja a blau.
   jsdom no resol la cascada ni pinta: es comproven les regles dels fulls.
   · 2a columna (fitxes de llistat, menú d'Admin): --sdp-accio-subtil i
     --sdp-accio, en clar i en fosc.
   · 1a columna de crom (arbre, rail del Xat, rails plegats): els tokens
     --sdp-crom-seleccio-*, declarats una sola vegada al :root clar.
   · La barra principal i les capçaleres conserven --sdp-crom-actiu-*.
   T62b (ordre del Mestre, 260928) · A la 1a columna, fons blau fort i
   text i icona obligatòriament blancs. La vora de l'arrel del rail plegat
   es queda en Blau 400 (--sdp-crom-seleccio-vora). */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full (també les de dins de @media i @layer). */
function regles(css) {
  const eixida = [];
  for (const m of senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelud = m[1].split(';').pop().trim();
    if (!prelud || prelud.startsWith('@')) continue;
    eixida.push({
      selectors: prelud.split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
      cos: m[2].replace(/\s+/g, ' ').trim(),
    });
  }
  return eixida;
}

/** Cossos de les regles que nomenen el selector, sol o com a últim compost. */
const cossos = (full, selector) => regles(full)
  .filter((r) => r.selectors.some((s) => s === selector || s.endsWith(` ${selector}`)))
  .map((r) => r.cos);

const declara = (cos, propietat, valor) => new RegExp(`(^|;)\\s*${propietat}\\s*:\\s*${valor.replace(/[()]/g, '\\$&')}\\s*(;|$)`).test(cos);

/** Declaracions d'un cos: [[propietat, valor], …]. */
const declaracions = (cos) => cos.split(';')
  .map((d) => d.split(':'))
  .filter((p) => p.length >= 2)
  .map(([prop, ...valor]) => [prop.trim(), valor.join(':').trim()]);

const modules = llig('src/css/modules.css');
const perfil = llig('src/sections/profile/PerfilShell.css');
const layout = llig('src/css/layout.css');
const tokens = llig('src/css/tokens.css');
const especimen = llig('src/sections/disseny/cataleg/detalls/EspecimenColor.jsx');

/* ── A · 2a columna i menú d'Admin ── */
const ACTIUS_ACCIO = [
  { full: modules, nom: 'A1', selector: '.sdp-gestor-fitxa[aria-current="true"]', vora: 'border-left-color' },
  { full: modules, nom: 'A2', selector: '.sdp-bloc-list--notes .sdp-gestor-fitxa[aria-current="true"]', vora: 'border-inline-start-color' },
  { full: modules, nom: 'A3', selector: '.univ-manager-facet-item--active', vora: null },
  { full: perfil, nom: 'A4', selector: '.perfil-identitat[aria-current="true"]', vora: 'border-left-color' },
];

test.each(ACTIUS_ACCIO)('$nom · $selector pinta l’actiu amb --sdp-accio-subtil i --sdp-accio', ({ full, selector, vora }) => {
  const trobats = regles(full).filter((r) => r.selectors.includes(selector)).map((r) => r.cos);
  expect(trobats.length).toBeGreaterThan(0);
  expect(trobats.some((c) => declara(c, 'background', 'var(--sdp-accio-subtil)'))).toBe(true);
  if (vora) expect(trobats.some((c) => declara(c, vora, 'var(--sdp-accio)'))).toBe(true);
});

/* ── C · 1a columna de crom i rails plegats ── */
const SELECCIO = { background: 'var(--sdp-crom-seleccio-fons)', color: 'var(--sdp-crom-seleccio-text)' };
const ACTIUS_CROM = [
  { nom: 'C1', selector: '.sdp-workspace-nav-item[aria-current="page"]', props: SELECCIO },
  { nom: 'C1 cel·la', selector: '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-current="page"] + .sdp-workspace-folder-toggle', props: SELECCIO },
  { nom: 'C1 espaiador', selector: '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-current="page"] + .sdp-workspace-folder-toggle-spacer', props: SELECCIO },
  { nom: 'C2', selector: '.sdp-workspace-rail__boto[aria-current="page"]', props: { ...SELECCIO, 'border-color': 'var(--sdp-crom-seleccio-fons)' } },
  { nom: 'C2 documents', selector: '.sdp-workspace-rail--documents .sdp-workspace-rail__boto[aria-current="true"]', props: { ...SELECCIO, 'border-color': 'var(--sdp-crom-seleccio-fons)' } },
  { nom: 'C2 arrel', selector: '.sdp-workspace-rail__boto[aria-current="true"]', props: { 'border-color': 'var(--sdp-crom-seleccio-vora)' } },
];

test.each(ACTIUS_CROM)('$nom · $selector pinta amb --sdp-crom-seleccio-*', ({ selector, props }) => {
  const propis = regles(modules).filter((r) => r.selectors.includes(selector)).map((r) => r.cos);
  expect(propis.length).toBeGreaterThan(0);
  for (const [propietat, valor] of Object.entries(props)) {
    expect(propis.some((c) => declara(c, propietat, valor)), `${selector} { ${propietat}: ${valor} }`).toBe(true);
  }
});

test('cap selector d’actiu de navegació secundària cita --sdp-accent, i els de crom tampoc --sdp-crom-actiu', () => {
  const infraccions = [];
  for (const { full, selector } of ACTIUS_ACCIO) {
    for (const c of cossos(full, selector)) if (/--sdp-accent/.test(c)) infraccions.push(`${selector} { ${c} }`);
  }
  for (const { selector } of ACTIUS_CROM) {
    for (const c of cossos(modules, selector)) {
      if (/--sdp-accent|--sdp-crom-actiu/.test(c)) infraccions.push(`${selector} { ${c} }`);
      /* Closca: les propietats de color només admeten --sdp-crom-* (tractor-crom K3). */
      for (const m of c.matchAll(/var\(\s*(--[\w-]+)/g)) if (!m[1].startsWith('--sdp-crom-')) infraccions.push(`${selector} cita ${m[1]}`);
    }
  }
  expect(infraccions).toEqual([]);
});

/* ── T62b · Icones de la cel·la activa: obligatòriament blanques ── */
const ICONES_ACTIVES = [
  '.sdp-workspace-nav-item[aria-current="page"] .sdp-workspace-nav-item__icon',
  '.sdp-workspace-nav-item[aria-current="page"] svg',
  '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-current="page"] + .sdp-workspace-folder-toggle svg',
  '.sdp-workspace-rail__boto[aria-current="page"] svg',
  '.sdp-workspace-rail--documents .sdp-workspace-rail__boto[aria-current="true"] svg',
];

test.each(ICONES_ACTIVES)('T62b · %s pinta la icona amb --sdp-crom-seleccio-text', (selector) => {
  const propis = regles(modules).filter((r) => r.selectors.includes(selector)).map((r) => r.cos);
  expect(propis.length, `falta la regla ${selector}`).toBeGreaterThan(0);
  expect(propis.some((c) => declara(c, 'color', 'var(--sdp-crom-seleccio-text)'))).toBe(true);
});

/* ── T62b · Marcador blanc de 3px (decisió del Mestre, 260928) ──
   A la cel·la activa de C1 i de C2, un pseudo-element a l'inici de línia
   amb el token de text de la selecció: l'estat no depén només del color
   (WCAG 1.4.1). No pot desplaçar res: la regla de la cel·la activa només
   guanya `position: relative`, i ni ella ni el marcador toquen coixí,
   marge, amplària de la cel·la ni vora; cap ombra. */
const MARCADORS = [
  { nom: 'C1', cella: '.sdp-workspace-nav-item[aria-current="page"]', inici: '0' },
  { nom: 'C2', cella: '.sdp-workspace-rail__boto[aria-current="page"]', inici: '-2px' },
  { nom: 'C2 documents', cella: '.sdp-workspace-rail--documents .sdp-workspace-rail__boto[aria-current="true"]', inici: '-2px' },
];
/* La cel·la no pot canviar res que moga el contingut; el marcador, que és
   absolut, pot tindre la seua amplària, però cap coixí, marge, vora ni ombra. */
const NO_DESPLACEN = /^(padding|padding-[\w-]+|margin|margin-[\w-]+|width|min-width|max-width|inline-size|border|border-width|border-[\w-]*-width|gap|box-shadow|display)$/;
const NO_AL_MARCADOR = /^(padding|padding-[\w-]+|margin|margin-[\w-]+|border|border-[\w-]+|box-shadow|outline)$/;

test.each(MARCADORS)('T62b · $nom · la cel·la activa porta el marcador blanc de 3px a l’inici de línia', ({ cella, inici }) => {
  const marcador = regles(modules).filter((r) => r.selectors.includes(`${cella}::before`)).map((r) => r.cos);
  expect(marcador.length, `falta ${cella}::before`).toBeGreaterThan(0);
  const cos = marcador.join(';');
  expect(declara(cos, 'content', "''")).toBe(true);
  expect(declara(cos, 'position', 'absolute')).toBe(true);
  expect(declara(cos, 'inline-size', '3px')).toBe(true);
  expect(declara(cos, 'inset-inline-start', inici)).toBe(true);
  expect(declara(cos, 'inset-block', inici)).toBe(true);
  expect(declara(cos, 'background', 'var(--sdp-crom-seleccio-text)')).toBe(true);
  expect(cos).not.toMatch(/box-shadow|--sdp-accent|--sdp-crom-actiu/);
  const base = regles(modules).filter((r) => r.selectors.includes(cella)).map((r) => r.cos);
  expect(base.some((c) => declara(c, 'position', 'relative')), `${cella} { position: relative }`).toBe(true);
});

test('T62b · el marcador no desplaça cap text ni icona: les cel·les actives no toquen coixí, marge, amplària ni vora', () => {
  const infraccions = [];
  for (const { cella } of MARCADORS) {
    for (const [selector, prohibides] of [[cella, NO_DESPLACEN], [`${cella}::before`, NO_AL_MARCADOR]]) {
      for (const r of regles(modules).filter((regla) => regla.selectors.includes(selector))) {
        for (const [prop] of declaracions(r.cos)) {
          if (prohibides.test(prop)) infraccions.push(`${selector} { ${prop} }`);
        }
      }
    }
  }
  expect(infraccions).toEqual([]);
});

test('T62b · la guarda del desplaçament detecta un coixí a la cel·la i una ombra al marcador', () => {
  const prova = (cos, patro) => declaracions(cos).map(([p]) => p).filter((p) => patro.test(p));
  expect(prova('padding-inline-start: 3px; position: relative', NO_DESPLACEN)).toEqual(['padding-inline-start']);
  expect(prova('border-inline-start-width: 3px; border-color: blue', NO_DESPLACEN)).toEqual(['border-inline-start-width']);
  expect(prova('position: relative; background: blue', NO_DESPLACEN)).toEqual([]);
  expect(prova('box-shadow: inset 3px 0 0 white', NO_AL_MARCADOR)).toEqual(['box-shadow']);
  expect(prova('position: absolute; inset-block: 0; inline-size: 3px', NO_AL_MARCADOR)).toEqual([]);
});

/* Guarda: cap full pot donar a una icona de la navegació de crom un color
   propi que la desvie del text de la cel·la. Només s'admet heretar
   (inherit, currentColor) o, en l'estat actiu (aria-current), el token de
   selecció. Si algú torna a pintar la icona de l'actiu d'un altre color (el
   «fantasma» de sdp-app-grid-shell §2) o toca l'inactiu, la prova cau. */
const ultimCompost = (s) => s.split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
const esIconaNav = (s) => /svg|\.sdp-workspace-nav-item__icon|\.sdp-nav-glyph/.test(ultimCompost(s))
  && /\.sdp-workspace-nav-item|\.sdp-workspace-rail__boto|\.sdp-workspace-folder-toggle|\.sdp-nav-glyph/.test(s);

function guardaIcones(css) {
  const eixida = [];
  for (const r of regles(css)) {
    const icones = r.selectors.filter(esIconaNav);
    if (!icones.length) continue;
    for (const [prop, valor] of declaracions(r.cos)) {
      if (!/^(color|fill|stroke)$/.test(prop)) continue;
      if (/^(inherit|currentcolor)$/i.test(valor)) continue;
      const actius = icones.every((s) => s.includes('[aria-current='));
      if (valor === 'var(--sdp-crom-seleccio-text)' && actius) continue;
      eixida.push(`${icones.join(', ')} { ${prop}: ${valor} }`);
    }
  }
  return eixida;
}

function fullsCss(dir) {
  return readdirSync(dir).flatMap((nom) => {
    if (nom === 'node_modules' || nom.startsWith('.')) return [];
    const abs = join(dir, nom);
    if (statSync(abs).isDirectory()) return fullsCss(abs);
    return nom.endsWith('.css') ? [abs] : [];
  });
}

test('T62b · cap full desvia el color de les icones de la navegació de crom', () => {
  const infraccions = fullsCss(resolve(ARREL, 'src'))
    .flatMap((abs) => guardaIcones(readFileSync(abs, 'utf8')).map((i) => `${abs.slice(ARREL.length + 1)}: ${i}`));
  expect(infraccions).toEqual([]);
});

test('T62b · la guarda d’icones detecta una icona pintada a banda i deixa passar l’herència', () => {
  expect(guardaIcones('.sdp-workspace-nav-item__icon { color: var(--sdp-crom-actiu-fons); }')).toHaveLength(1);
  expect(guardaIcones('.sdp-workspace-nav-item svg { color: var(--sdp-crom-seleccio-text); }')).toHaveLength(1);
  expect(guardaIcones('.sdp-workspace-rail__boto[aria-current="page"] svg { stroke: var(--sdp-crom-focus); }')).toHaveLength(1);
  expect(guardaIcones('.sdp-workspace-nav-item__icon { color: inherit; width: 24px; }')).toEqual([]);
  expect(guardaIcones('.sdp-workspace-nav-item[aria-current="page"] svg { color: var(--sdp-crom-seleccio-text); }')).toEqual([]);
  expect(guardaIcones('.app-grid-col-header__plec > svg { color: red; }')).toEqual([]);
});

test('T62b · l’inactiu no es toca: la icona hereta i l’arrel del rail només porta vora', () => {
  const icona = regles(modules).filter((r) => r.selectors.includes('.sdp-workspace-nav-item__icon')).map((r) => r.cos);
  expect(icona.some((c) => declara(c, 'color', 'inherit'))).toBe(true);
  const boto = regles(modules).filter((r) => r.selectors.includes('.sdp-workspace-rail__boto')).map((r) => r.cos);
  expect(boto.some((c) => declara(c, 'color', 'var(--sdp-crom-text)'))).toBe(true);
  const arrel = regles(modules).filter((r) => r.selectors.includes('.sdp-workspace-rail__boto[aria-current="true"]')).map((r) => r.cos);
  expect(arrel.length).toBeGreaterThan(0);
  for (const c of arrel) expect(declaracions(c).map(([p]) => p)).toEqual(['border-color']);
});

/* ── Tokens ── */
const tall = tokens.indexOf(':root[data-theme="dark"]');
const temaClar = senseComentaris(tokens.slice(0, tall));
const temaFosc = senseComentaris(tokens.slice(tall));

test('la barra principal i les capçaleres conserven --sdp-crom-actiu-* (taronja)', () => {
  expect(tall).toBeGreaterThan(0);
  expect(temaClar).toMatch(/--sdp-crom-actiu-fons\s*:\s*var\(--sdp-primary-500\)\s*;/);
  expect(temaClar).toMatch(/--sdp-crom-actiu-text\s*:\s*var\(--sdp-pedra-900\)\s*;/);
  expect(regles(layout).filter((r) => r.selectors.includes('.nav-item.active')).some((r) => declara(r.cos, 'background', 'var(--sdp-crom-actiu-fons)'))).toBe(true);
});

const TOKENS_SELECCIO = ['--sdp-crom-seleccio-fons', '--sdp-crom-seleccio-text', '--sdp-crom-seleccio-vora'];

test.each(TOKENS_SELECCIO)('%s es declara una sola vegada, al :root clar (K1)', (token) => {
  const patro = new RegExp(`${token}\\s*:`, 'g');
  const nombre = fullsCss(resolve(ARREL, 'src'))
    .reduce((n, abs) => n + (senseComentaris(readFileSync(abs, 'utf8')).match(patro) || []).length, 0);
  expect(nombre).toBe(1);
  expect(temaClar).toMatch(patro);
  expect(temaFosc).not.toMatch(patro);
});

test('T62b · la selecció de crom és blau fort amb text blanc; la vora de l’arrel, blau 400', () => {
  expect(temaClar).toMatch(/--sdp-crom-seleccio-fons\s*:\s*var\(--sdp-secondary-600\)\s*;/);
  expect(temaClar).toMatch(/--sdp-crom-seleccio-text\s*:\s*var\(--sdp-blanc-pur\)\s*;/);
  expect(temaClar).toMatch(/--sdp-crom-seleccio-vora\s*:\s*var\(--sdp-secondary-400\)\s*;/);
});

/* ── Veracitat dels comentaris de contrast (fórmula WCAG, com tractor-cromatic) ── */
function mapa(css) {
  const m = new Map();
  for (const d of css.matchAll(/(--sdp-[\w-]+)\s*:\s*([^;}]+)/g)) if (!m.has(d[1])) m.set(d[1], d[2].trim());
  return m;
}
const canon = mapa(senseComentaris(llig('src/css/design-tokens.css')));
const CLAR = new Map([...canon, ...mapa(temaClar)]);
const FOSC = new Map([...CLAR, ...mapa(temaFosc)]);

function hex(tema, token, prof = 0) {
  const valor = tema.get(token);
  const v = /^var\(\s*(--[\w-]+)\s*\)$/.exec(valor ?? '');
  if (v && prof < 16) return hex(tema, v[1], prof + 1);
  return valor;
}
const rgb = (h) => {
  const m = /^#([0-9a-f]{6})$/i.exec(h ?? '');
  if (!m) throw new Error(`No és un hex de 6 xifres: ${h}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (c) => {
  const [r, g, b] = c.map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (tema, a, b) => {
  const [x, y] = [lum(rgb(hex(tema, a))), lum(rgb(hex(tema, b)))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* Cada xifra es busca on diu que és, no al full sencer: el comentari que
   precedix just la declaració o el selector, o la fila del mostrari. */
function comentariAbans(text, marca) {
  const i = text.indexOf(marca);
  if (i < 0) return '';
  const abans = text.slice(0, i);
  const fi = abans.lastIndexOf('*/');
  if (fi < 0 || abans.slice(fi + 2).trim() !== '') return '';
  const ini = abans.lastIndexOf('/*', fi);
  return ini < 0 ? '' : abans.slice(ini, fi + 2);
}
const filaDe = (text, etiqueta) => text.split('\n').find((l) => l.includes('<tr>') && l.includes(`<td>${etiqueta}</td>`)) ?? '';

// Decisió del Mestre (30-10-2026) · La marca es compon: tractor-tokens (T3) la prendria per una declaració.
const BLOC_SELECCIO = comentariAbans(tokens, ['--sdp-crom-seleccio-fons', ':'].join(''));
const BLOC_A1 = comentariAbans(modules, '\n.sdp-gestor-fitxa[aria-current="true"] {');
const BLOC_C1 = comentariAbans(modules, '\n.sdp-workspace-nav-item[aria-current="page"] {');
const BLOC_MARCADOR = comentariAbans(modules, '\n.sdp-workspace-nav-item[aria-current="page"]::before {');
const BLOC_MARCADOR_RAIL = comentariAbans(modules, '\n  .sdp-workspace-rail__boto[aria-current="page"]::before,');

const NAV = '--sdp-workspace-nav-fons';
const RAIL = '--sdp-workspace-fila1-fons';
const COMENTARIS = [
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-text', b: '--sdp-crom-seleccio-fons', diu: '7,20:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-fons', b: NAV, diu: '1,55:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-fons', b: RAIL, diu: '2,24:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-focus', b: '--sdp-crom-seleccio-fons', diu: '3,33:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-focus', b: NAV, diu: '5,17:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-focus', b: RAIL, diu: '7,44:1' },
  { on: 'tokens.css · selecció', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-vora', b: RAIL, diu: '6,06:1' },
  { on: 'modules.css · C1', text: BLOC_C1, tema: CLAR, a: '--sdp-crom-seleccio-text', b: '--sdp-crom-seleccio-fons', diu: '7,20:1' },
  { on: 'modules.css · A1', text: BLOC_A1, tema: CLAR, a: '--sdp-accio', b: '--sdp-accio-subtil', diu: '3,62:1' },
  { on: 'modules.css · A1', text: BLOC_A1, tema: FOSC, a: '--sdp-accio', b: '--sdp-accio-subtil', diu: '4,01:1' },
  { on: 'modules.css · A1', text: BLOC_A1, tema: CLAR, a: '--sdp-text-titol', b: '--sdp-accio-subtil', diu: '18,13:1' },
  { on: 'modules.css · A1', text: BLOC_A1, tema: FOSC, a: '--sdp-text-titol', b: '--sdp-accio-subtil', diu: '15,52:1' },
  /* Fase E (Q1, 261004): el text suau és el pedra-650; abans, pedra-600 i 6,8:1. */
  { on: 'modules.css · A1', text: BLOC_A1, tema: CLAR, a: '--sdp-text-suau', b: '--sdp-accio-subtil', diu: '8,49:1' },
  { on: 'modules.css · A1', text: BLOC_A1, tema: FOSC, a: '--sdp-text-suau', b: '--sdp-accio-subtil', diu: '10,82:1' },
  { on: 'mostrari · Blanc sobre blau 600', text: filaDe(especimen, 'Blanc sobre blau 600'), tema: CLAR, a: '--sdp-crom-seleccio-text', b: '--sdp-crom-seleccio-fons', diu: '7,20:1' },
  { on: 'mostrari · cel·la i columna', text: filaDe(especimen, 'Blau 600 contra la columna (grafit 700)'), tema: CLAR, a: '--sdp-crom-seleccio-fons', b: NAV, diu: '1,55:1' },
  { on: 'mostrari · cel·la i rail', text: filaDe(especimen, 'Blau 600 contra el rail plegat (carbó 800)'), tema: CLAR, a: '--sdp-crom-seleccio-fons', b: RAIL, diu: '2,24:1' },
  { on: 'mostrari · vora de l’arrel', text: filaDe(especimen, 'Blau 400 contra el rail plegat (carbó 800)'), tema: CLAR, a: '--sdp-crom-seleccio-vora', b: RAIL, diu: '6,06:1' },
  { on: 'mostrari · focus dins', text: filaDe(especimen, 'Focus taronja 400 sobre blau 600'), tema: CLAR, a: '--sdp-crom-focus', b: '--sdp-crom-seleccio-fons', diu: '3,33:1' },
  { on: 'mostrari · focus fora', text: filaDe(especimen, 'Focus taronja 400 contra la columna (grafit 700)'), tema: CLAR, a: '--sdp-crom-focus', b: NAV, diu: '5,17:1' },
  /* T62b · Marcador blanc de 3px (decisió del Mestre, 260928). */
  { on: 'tokens.css · marcador sobre la cel·la', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-text', b: '--sdp-crom-seleccio-fons', diu: '7,20:1' },
  { on: 'tokens.css · marcador i columna', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-text', b: NAV, diu: '11,20:1' },
  { on: 'tokens.css · marcador i rail', text: BLOC_SELECCIO, tema: CLAR, a: '--sdp-crom-seleccio-text', b: RAIL, diu: '16,10:1' },
  { on: 'modules.css · marcador C1', text: BLOC_MARCADOR, tema: CLAR, a: '--sdp-crom-seleccio-text', b: NAV, diu: '11,20:1' },
  { on: 'modules.css · marcador C2', text: BLOC_MARCADOR_RAIL, tema: CLAR, a: '--sdp-crom-seleccio-text', b: RAIL, diu: '16,10:1' },
  { on: 'mostrari · marcador sobre la cel·la', text: filaDe(especimen, 'Marcador blanc sobre blau 600'), tema: CLAR, a: '--sdp-crom-seleccio-text', b: '--sdp-crom-seleccio-fons', diu: '7,20:1' },
  { on: 'mostrari · marcador i columna', text: filaDe(especimen, 'Marcador blanc contra la columna (grafit 700)'), tema: CLAR, a: '--sdp-crom-seleccio-text', b: NAV, diu: '11,20:1' },
  { on: 'mostrari · marcador i rail', text: filaDe(especimen, 'Marcador blanc contra el rail plegat (carbó 800)'), tema: CLAR, a: '--sdp-crom-seleccio-text', b: RAIL, diu: '16,10:1' },
];

test.each(COMENTARIS)('$on diu «$diu» ($a sobre $b) i és el contrast real', ({ text, tema, a, b, diu }) => {
  expect(text).toContain(diu);
  const declarat = Number(diu.replace(':1', '').replace(',', '.'));
  const decimals = diu.split(',')[1].replace(':1', '').length;
  expect(Math.abs(contrast(tema, a, b) - declarat)).toBeLessThan(0.5 * 10 ** -decimals + 1e-9);
});

test('T62b · els hex que nomena el comentari de la selecció són els valors reals dels tokens', () => {
  const nomenats = [...new Set([...BLOC_SELECCIO.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()))].sort();
  const reals = [...new Set(['--sdp-crom-seleccio-fons', '--sdp-crom-seleccio-text', '--sdp-crom-seleccio-vora', '--sdp-crom-focus', NAV, RAIL]
    .map((t) => hex(CLAR, t).toLowerCase()))].sort();
  expect(nomenats).toEqual(reals);
});

test('T62b · el mostrari documenta els tokens de selecció amb el seu valor real (documentació viva)', () => {
  const mostres = [...especimen.matchAll(/'(#[0-9a-f]{6})',\s*'(--sdp-crom-seleccio-[\w-]+)/gi)];
  expect(mostres.map((m) => m[2]).sort()).toEqual([...TOKENS_SELECCIO].sort());
  for (const [, lit, token] of mostres) expect(lit.toLowerCase(), token).toBe(hex(CLAR, token).toLowerCase());
  for (const token of TOKENS_SELECCIO) {
    const classe = token.replace('--sdp-', '.sw-');
    expect(regles(tokens).some((r) => r.selectors.includes(classe) && r.cos.includes(`var(${token})`)), classe).toBe(true);
  }
});

/* ── Design Guard (raw-color): els comentaris també compten ──
   design_guard.mjs escaneja el text sencer dels .css, comentaris inclosos, i
   només calla dins dels blocs de tema (:root, :host, .sdp-root, @media de
   tema) i davant de la llista blanca. Els comentaris de contrast de T62
   nomenen tokens, no hex: un hex fora d'eixos blocs és deute nou. */
const HEX_PERMESOS = new Set(['#000', '#000000', '#fff', '#ffffff', '#ff7300', '#0984e3']);
const OBRE_TEMA = /(:root|:host|\.sdp-root|@media\s*\((?:prefers-color-scheme|prefers-contrast|forced-colors))/;

function hexFora(css) {
  const eixida = [];
  let obert = false;
  let prof = 0;
  css.split(/\r?\n/).forEach((l, i) => {
    if (!obert && OBRE_TEMA.test(l) && l.includes('{')) { obert = true; prof = 0; }
    if (obert) {
      prof += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
      if (prof <= 0) obert = false;
      return;
    }
    for (const m of l.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      if (!HEX_PERMESOS.has(m[0].toLowerCase())) eixida.push(`${i + 1}:${m[0]}`);
    }
  });
  return eixida;
}

test.each([
  ['src/css/modules.css', modules],
  ['src/sections/profile/PerfilShell.css', perfil],
  ['src/css/tokens.css', tokens],
])('%s no porta cap hex cru fora dels blocs de tema (Design Guard)', (_ruta, css) => {
  expect(hexFora(css)).toEqual([]);
});

/* Fixtura, no color de la UI: Design Guard també escaneja aquest .js, i
   ALLOW_RAW_COLOR (dins dels 40 caràcters previs) és la seua justificació. */
const CRU = /* ALLOW_RAW_COLOR */ '#f1f8ff';

test('la guarda de hex detecta un comentari amb hex fora de tema i calla dins del :root', () => {
  expect(hexFora(`/* marcador sobre ${CRU} */\n.a { color: red; }`)).toEqual([`1:${CRU}`]);
  expect(hexFora(`:root {\n  /* ${CRU} */\n  --x: ${CRU};\n}\n.b { color: ${CRU}; }`)).toEqual([`5:${CRU}`]);
  expect(hexFora('.a { color: #0984E3; }')).toEqual([]);
});

test('T62b · text i icona AAA sobre la cel·la; focus, vora de l’arrel i marcador de la 2a columna, 3:1', () => {
  expect(contrast(CLAR, '--sdp-crom-seleccio-text', '--sdp-crom-seleccio-fons')).toBeGreaterThanOrEqual(7);
  expect(contrast(CLAR, '--sdp-crom-focus', '--sdp-crom-seleccio-fons')).toBeGreaterThanOrEqual(3);
  expect(contrast(CLAR, '--sdp-crom-focus', NAV)).toBeGreaterThanOrEqual(3);
  expect(contrast(CLAR, '--sdp-crom-focus', RAIL)).toBeGreaterThanOrEqual(3);
  expect(contrast(CLAR, '--sdp-crom-seleccio-vora', RAIL)).toBeGreaterThanOrEqual(3);
  expect(contrast(CLAR, '--sdp-accio', '--sdp-accio-subtil')).toBeGreaterThanOrEqual(3);
  expect(contrast(FOSC, '--sdp-accio', '--sdp-accio-subtil')).toBeGreaterThanOrEqual(3);
});
