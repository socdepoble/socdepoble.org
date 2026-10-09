// @vitest-environment node
/* La pantalla de Facturació i el dibuix del QR passen per les portes del repo
   (Onada 6, 261009; el patró de qualitatPanell.test.js): ESLint del projecte
   amb zero missatges, cada classe del JSX amb la seua regla (les pròpies,
   dins del bloc de la Gestoria de modules.css), className només literal o
   ternària de literals, i cap estil en línia, color hex, h1 ni finestra
   nova. Els patrons es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const PANTALLA = 'src/sections/gestoria/facturar';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const DE_LA_PANTALLA = fitxersDe(PANTALLA);
/* Els fitxers nous del carril de facturació (Onada 6): el dibuix del QR i l'XML de prova, amb les seues proves. */
const QR = [
  'src/sections/gestoria/facturacio/qrDibuix.js', 'src/sections/gestoria/facturacio/registre/xmlAeat.js',
  'src/sections/gestoria/facturacio/qrDibuix.test.js', 'src/sections/gestoria/facturacio/registre/xmlAeat.test.js'
];
const CODI = DE_LA_PANTALLA.filter((f) => !/\.test\.jsx?$/.test(f) && !f.includes('/__fixtures__/'));
const JSX = CODI.filter((f) => f.endsWith('.jsx'));

function blocGestoria() {
  const css = llig('src/css/modules.css');
  const marca = '/* ── GESTORIA PANELL (261002) ── */';
  const inici = css.indexOf(marca);
  expect(inici).toBeGreaterThan(-1);
  let profunditat = 0;
  for (let i = css.indexOf('{', inici); i < css.length; i++) {
    if (css[i] === '{') profunditat += 1;
    if (css[i] === '}') profunditat -= 1;
    if (profunditat === 0) return css.slice(inici, i + 1);
  }
  throw new Error('El bloc de la Gestoria no es tanca.');
}

describe('ESLint', () => {
  test('zero missatges a la pantalla de Facturació i al dibuix del QR, proves incloses', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([...DE_LA_PANTALLA, ...QR].map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats.length).toBe(DE_LA_PANTALLA.length + QR.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, PANTALLA, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 60000);
});

describe('CSS i JSX', () => {
  test('tota classe del JSX té regla: la pròpia al bloc de la Gestoria i la resta al full canònic', () => {
    const bloc = blocGestoria();
    const canonic = ['modules.css', 'components.css', 'sdp.css', 'layout.css', 'base.css', 'utilities.css']
      .map((f) => llig(`src/css/${f}`)).join('\n');
    for (const fitxer of JSX) {
      const classes = [...llig(fitxer).matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
        .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
        .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
      for (const classe of classes) {
        const propia = classe.startsWith('sdp-gestoria-');
        expect(propia || /^sdp-/.test(classe), `${fitxer}: ${classe} sense prefix`).toBe(true);
        expect((propia ? bloc : canonic).includes(`.${classe}`), `${fitxer}: .${classe} no té regla`).toBe(true);
      }
    }
  });

  test('className només literal o ternària de literals', () => {
    for (const fitxer of JSX) {
      for (const [, expressio] of llig(fitxer).matchAll(/className=\{([^}]*)\}/g)) {
        expect(expressio.trim(), `${fitxer}: className={${expressio}}`).toMatch(/^[^?'"`]+\?\s*'[^']*'\s*:\s*'[^']*'$/);
      }
    }
  });

  test('la factura en paper: la tinta i el paper són els tokens de la roca, i la impressió amaga la resta del document', () => {
    const bloc = blocGestoria();
    expect(bloc).toMatch(/\.sdp-gestoria-factura__full \{[^}]*background: var\(--sdp-sobre-roca\);[^}]*color: var\(--sdp-fons-roca\);/);
    expect(bloc).toMatch(/\.sdp-gestoria-factura__qr-tinta \{ fill: var\(--sdp-fons-roca\); \}/);
    expect(bloc).toMatch(/\.sdp-gestoria-factura-impresa \{ display: none; \}/);
    expect(bloc).toMatch(/@media print \{[\s\S]*html\.sdp-gestoria-imprimint body > :not\(\.sdp-gestoria-factura-impresa\) \{ display: none; \}/);
  });

  /* Correcció de la revisió (261009): el <style> sense capa d'index.html fixa l'alçada de html i body al
     100 % i guanya a qualsevol declaració normal de @layer components. En paper, l'alçada s'allibera amb
     !important (la important de capa li guanya) i el body deixa de ser flex i contenidor. */
  test('en imprimir, html i body allarguen amb la factura: l’alçada amb !important, en bloc i sense contenidor', () => {
    const indexHtml = llig('index.html');
    expect(indexHtml).toMatch(/<style>\s*html, body, #root \{[^}]*height: 100%;/);
    const impressio = blocGestoria().slice(blocGestoria().indexOf('@media print {'));
    const regla = /html\.sdp-gestoria-imprimint,\s*html\.sdp-gestoria-imprimint body \{([^}]*)\}/.exec(impressio)?.[1] ?? '';
    for (const declaracio of ['display: block;', 'height: auto !important;', 'overflow: visible;', 'container-type: normal;']) {
      expect(regla, declaracio).toContain(declaracio);
    }
    // L'única !important del bloc de la Gestoria (sense comptar els comentaris) és esta.
    expect(blocGestoria().replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g)).toHaveLength(1);
  });
});

describe('higiene del codi', () => {
  test('cap estil en línia, color hex, h1, finestra nova ni HTML cru', () => {
    const vetats = [
      [/\sstyle=\{/, 'style= al JSX'],
      [/#[0-9a-fA-F]{6}\b/, 'color hex'],
      [new RegExp(['<h', '1[\\s>]'].join('')), 'h1'],
      [new RegExp(['window\\.op', 'en\\s*\\('].join('')), 'finestra nova'],
      [new RegExp(['inner', 'HTML|dangerously', 'SetInnerHTML'].join('')), 'HTML cru'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline']
    ];
    for (const fitxer of [...CODI, QR[0], QR[1]]) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });

  test('els nuclis de la pantalla, el dibuix del QR i l’XML de prova són purs: sense React ni DOM', () => {
    for (const fitxer of [...CODI.filter((f) => f.includes('/nucli/')), QR[0], QR[1]]) {
      expect(llig(fitxer), fitxer).not.toMatch(/from 'react'|\bdocument\.|\bwindow\.|from 'node:/);
    }
  });
});
