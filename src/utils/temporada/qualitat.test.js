// @vitest-environment node
/* Temporada · qualitat de src/utils/temporada/, proves incloses.
   ESLint amb la configuració del projecte i zero missatges (com
   --max-warnings=0), i les promeses de la capçalera d'index.js: JS pur (cap
   rellotge, cap atzar, cap DOM, cap xarxa, cap emmagatzematge), cap
   dependència fora de la carpeta, res fora del Baseline 2022 i la font de les
   dades declarada. Els patrons vetats es componen a trossos perquè les portes
   que llegixen src/ no els troben ací (patró de src/utils/fulls/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARPETA = 'src/utils/temporada';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const TOTS = readdirSync(path.join(ARREL, CARPETA)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${CARPETA}/${f}`).sort();
const PRODUCCIO = TOTS.filter((f) => !esProva(f));

describe('el cens', () => {
  test('tres fitxers de producció i les seues proves', () => {
    expect(PRODUCCIO).toEqual([`${CARPETA}/dades.js`, `${CARPETA}/index.js`, `${CARPETA}/paraules.js`]);
    for (const nom of ['dades', 'index', 'paraules', 'cobertura', 'qualitat']) expect(TOTS).toContain(`${CARPETA}/${nom}.test.js`);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARPETA, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('JS pur', () => {
  test('cap rellotge, atzar, temporitzador, DOM, React ni global del navegador', () => {
    const impurs = new RegExp(['\\b(?:Da', 'te|React|use[A-Z]\\w*|win', 'dow|docu', 'ment|navi', 'gator|global', 'This|set', 'Timeout|set', 'Interval|queue', 'Microtask)\\b|Math\\.ran', 'dom|cryp', 'to\\.'].join(''));
    for (const fitxer of PRODUCCIO) expect(senseComentaris(llig(fitxer)).match(impurs), fitxer).toBeNull();
    /* Sonda: el patró casa amb el que veta. */
    expect(impurs.test(['new Da', 'te()'].join(''))).toBe(true);
  });

  test('cap xarxa ni emmagatzematge, proves incloses; cap adreça de fora', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch('],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['\\bWebSo', 'cket\\b|\\bEventSo', 'urce\\b|sendBea', 'con'].join('')), 'socket o beacon'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB|document\\.coo', 'kie'].join('')), 'emmagatzematge'],
      [new RegExp(['https?', ':\\/\\/'].join('')), 'adreça']
    ];
    const trobats = TOTS.filter((f) => f !== `${CARPETA}/qualitat.test.js`)
      .flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('la producció només s’importa a ella mateixa (cap paquet, cap fitxer de fora)', () => {
    const especificadors = (codi) => [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\1/g)].map((m) => m[2]);
    const fora = PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => !/^\.\/[a-z]+\.js$/.test(e)).map((e) => `${f}: ${e}`));
    expect(fora).toEqual([]);
    expect(especificadors(llig(`${CARPETA}/dades.js`))).toEqual([]);
    expect(especificadors(llig(`${CARPETA}/paraules.js`))).toEqual([]);
  });
});

describe('Baseline 2022 i higiene', () => {
  test('res fora del Baseline (ni lookbehind) i cap global escrita', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter invisible ni terme vetat (proves incloses)', () => {
    const invisible = new RegExp(['[^\\S\\n\\r\\t ]', '[\\u00AD\\u200B-\\u200F\\u2060-\\u2064\\uFFFE\\uFFFF]'].join('|'), 'u');
    const vetat = new RegExp(['Local-', 'First|Offline-', 'First'].join(''));
    const trobats = TOTS.flatMap((f) => {
      const codi = llig(f);
      return [invisible.test(codi) && `${f}: caràcter invisible`, vetat.test(codi) && `${f}: terme vetat`].filter(Boolean);
    });
    expect(trobats).toEqual([]);
  });

  test('les dades declaren la font i que no està verificada', () => {
    const dades = llig(`${CARPETA}/dades.js`);
    expect(dades).toMatch(/FONT\./);
    expect(dades).toMatch(/NO VERIFICAT/);
    expect(dades).toMatch(/pendent de revisió/);
  });
});
