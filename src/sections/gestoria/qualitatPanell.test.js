// @vitest-environment node
/* Les portes del repo aplicades a la UI de la Gestoria (panell, hook,
   vista prèvia i entregables): ESLint del projecte amb zero avisos, el bloc
   CSS propi al final de modules.css amb només tokens declarats, cada classe
   amb regla, className només literal o ternària de literals, i cap API ni
   patró vetat. Els patrons es componen a trossos perquè les portes que
   llegixen src/ no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria';
const CODI = ['nucli/entregables.js', 'useGestoria.js', 'PanellGestoria.jsx', 'VistaPreviaFull.jsx'].map((f) => `${CARRIL}/${f}`);
const PROVES = [
  'nucli/entregables.test.js', 'useGestoria.test.jsx', 'PanellGestoria.test.jsx', 'VistaPreviaFull.test.jsx', 'qualitatPanell.test.js'
].map((f) => `${CARRIL}/${f}`);
const JSX = CODI.filter((f) => f.endsWith('.jsx'));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const MARCA = '/* ── GESTORIA PANELL (261002) ── */';
function blocPanell() {
  const css = llig('src/css/modules.css');
  const inici = css.indexOf(MARCA);
  expect(inici, 'falta el bloc del panell de la Gestoria a modules.css').toBeGreaterThan(-1);
  expect(css.indexOf(MARCA, inici + 1), 'el marcador ha de ser únic').toBe(-1);
  const obri = css.indexOf('{', inici);
  let profunditat = 0;
  for (let i = obri; i < css.length; i++) {
    if (css[i] === '{') profunditat += 1;
    if (css[i] === '}') profunditat -= 1;
    if (profunditat === 0) return css.slice(inici, i + 1);
  }
  throw new Error('El bloc del panell no es tanca.');
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, al codi i a les proves del carril', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([...CODI, ...PROVES].map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CODI.length + PROVES.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARRIL, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 60000);
});

describe('CSS del panell', () => {
  test('una sola capa components al final del full, amb només tokens declarats i sense fallback', () => {
    const bloc = blocPanell();
    expect(bloc).toMatch(/^\/\* ── GESTORIA PANELL \(261002\) ── \*\/\n@layer components \{/);
    const tokens = llig('src/css/tokens.css');
    const usats = [...new Set([...bloc.matchAll(/var\((--[\w-]+)([^)]*)\)/g)].map((m) => {
      expect(m[2], `fallback a ${m[1]}`).toBe('');
      return m[1];
    }))];
    expect(usats.filter((t) => !new RegExp(`${t}\\s*:`).test(tokens))).toEqual([]);
    expect(bloc).not.toMatch(/box-shadow|--sdp-text-meta|--sdp-ui-sm|5[68]px|\{\s*\}/);
  });

  test('rem en múltiples de 0,25, lletra de 1rem o més i outline només amb :focus-visible', () => {
    const bloc = blocPanell().replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, valor] of bloc.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
    for (const [, valor] of bloc.matchAll(/font-size:\s*([^;]+);/g)) {
      expect(['var(--sdp-text-small)', 'var(--sdp-text-base)', 'var(--sdp-text-h4)', 'var(--sdp-text-h5)']).toContain(valor.trim());
    }
    for (const [, selector] of bloc.matchAll(/([^{}]+)\{[^{}]*outline:/g)) {
      for (const part of selector.split(',')) expect(part.trim(), 'outline sense :focus-visible').toMatch(/:focus-visible$/);
    }
  });

  test('tota classe del JSX té regla: la pròpia al bloc del panell i la resta al full canònic', () => {
    const bloc = blocPanell();
    const canonic = ['modules.css', 'components.css', 'sdp.css', 'layout.css', 'base.css', 'index.css', 'utilities.css', 'wiki.css']
      .map((f) => { try { return llig(`src/css/${f}`); } catch { return ''; } }).join('\n');
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      const classes = [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
        .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
        .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
      expect(classes.length, fitxer).toBeGreaterThan(0);
      for (const classe of classes) {
        const propia = classe.startsWith('sdp-gestoria-');
        expect(propia || /^sdp-/.test(classe), `${fitxer}: ${classe} sense prefix`).toBe(true);
        expect((propia ? bloc : canonic).includes(`.${classe}`), `${fitxer}: .${classe} no té regla`).toBe(true);
      }
    }
  });

  /* Prompt 261014_0400 (ordre del Mestre), front A: el Full trimestral, dins de la closca de pantalla sencera,
     deixa el topall de 80rem; la Facturació, que el pont munta fora de la closca, el conserva. Els camps llargs
     de la taula de revisió s'eixamplen només dins de la closca (LlibreFactures.jsx reutilitza __taula i __cel). */
  test('el Full de la closca ocupa tota l’amplada; la regla base conserva els 80rem', () => {
    const bloc = blocPanell();
    expect(bloc).toMatch(/^\/\* ── GESTORIA PANELL \(261002\) ── \*\/\n@layer components \{/);
    // Fora del @media print de la factura en paper: regles directes de la capa components.
    const capa = bloc.slice(0, bloc.indexOf('@media print {'));
    expect(capa).toMatch(/\n {2}\.sdp-gestoria-panell \{[^}]*\n {4}max-width: 80rem;\n[^}]*\}/);
    expect(capa).toMatch(/\n {2}\.sdp-gestoria-closca \.sdp-gestoria-panell \{ max-width: none; \}\n/);
    expect(capa).toMatch(/\n {2}\.sdp-gestoria-closca \.sdp-gestoria-panell__control\[data-mida="normal"\] \{ min-width: 10rem; \}\n/);
    expect(capa).toMatch(/\n {2}\.sdp-gestoria-closca \.sdp-gestoria-panell__control\[data-mida="ampla"\] \{ min-width: 18rem; \}\n/);
    // Les amplades de sempre continuen per a qualsevol altre lloc.
    expect(capa).toMatch(/\n {2}\.sdp-gestoria-panell__control\[data-mida="ampla"\] \{ min-width: 14rem; \}\n/);
  });

  test('les xifres de la taula de revisió són tabulars; les de la Facturació no canvien', () => {
    const capa = blocPanell().slice(0, blocPanell().indexOf('@media print {'));
    const regles = [...capa.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, cos]) => ({ selector: selector.replace(/\/\*[\s\S]*?\*\//g, '').trim(), cos }));
    const tabulars = regles.filter((r) => /font-variant-numeric: tabular-nums;/.test(r.cos)).flatMap((r) => r.selector.split(',').map((s) => s.trim()));
    expect(tabulars).toEqual(expect.arrayContaining([
      '.sdp-gestoria-closca .sdp-gestoria-panell__cel[data-tipus="import"]',
      '.sdp-gestoria-closca .sdp-gestoria-panell__control[data-tipus="import"]',
      '.sdp-gestoria-panell__cel[data-tipus="percentatge"]'
    ]));
    // Cap regla sense l'abast de la closca posa xifres tabulars a les cel·les d'import (LlibreFactures.jsx:100).
    expect(tabulars.filter((s) => s.startsWith('.sdp-gestoria-panell__cel[data-tipus="import"]'))).toEqual([]);
  });

  test('className només literal o ternària de literals; cap classe d’utilitat', () => {
    const utilitats = /(?:^|\s)sdp-(?:w|h|p|m|gap|bg|border)-|(?:^|\s)sdp-(?:flex|grid)(?:\s|$|-)/;
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      for (const [, expressio] of codi.matchAll(/className=\{([^}]*)\}/g)) {
        expect(expressio.trim(), `${fitxer}: className={${expressio}}`).toMatch(/^[^?'"`]+\?\s*'[^']*'\s*:\s*'[^']*'$/);
      }
      for (const [, literal] of codi.matchAll(/className="([^"]+)"/g)) expect(utilitats.test(literal), `${fitxer}: ${literal}`).toBe(false);
    }
  });
});

describe('higiene del codi', () => {
  test('cap API de xarxa, emmagatzematge, global escrita, HTML cru ni backend', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\(|XMLHttp', 'Request|WebSo', 'cket|EventSo', 'urce|sendBea', 'con'].join('')), 'xarxa'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join(''), 'i'), 'emmagatzematge'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [new RegExp(['inner', 'HTML|outer', 'HTML|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join('')), 'HTML cru'],
      [/\sstyle=\{/, 'style= al JSX'],
      [/from '@\//, 'import amb @/'],
      [new RegExp(['<h', '1[\\s>]'].join('')), 'h1'],
      [new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i'), 'backend'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    for (const fitxer of CODI) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });

  test('el nucli d’entregables és pur: sense React, DOM ni Node', () => {
    const codi = llig(`${CARRIL}/nucli/entregables.js`);
    expect(codi).not.toMatch(/from 'react'|\bdocument\.|\bwindow\.|import\.meta|from 'node:/);
  });

  test('cap color hex, terme vetat ni espai invisible, proves incloses', () => {
    const vetats = [
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp(['Local-', 'First|Offline-', 'First|iOS ', '15|iPad ', 'A10'].join('')), 'terme vetat'],
      [/[^\S\n\r\t ]/, 'espai invisible'],
      [/\b\d{8}[A-Za-z]\b/, 'un literal de DNI']
    ];
    for (const fitxer of [...CODI, ...PROVES]) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });
});
