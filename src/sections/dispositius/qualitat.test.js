// @vitest-environment node
/* Qualitat de Dispositius (P5, Mestre 261003). Patró de
   src/sections/admin/qualitat.test.js: ESLint amb la configuració del projecte
   i zero missatges (l'equivalent de --max-warnings=0) sobre tots els fitxers
   de la secció, i comprovacions per text. Els patrons vetats es componen a
   trossos perquè les portes que llegixen src/ no els troben ací. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const DIR = 'src/sections/dispositius';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PRODUCCIO = [`${DIR}/DevicesSection.jsx`, `${DIR}/devicesRuntime.js`];
const PROVES = [
  `${DIR}/DevicesSection.test.jsx`,
  `${DIR}/devicesRuntime.test.js`,
  `${DIR}/__fixtures__/canalFals.js`,
  `${DIR}/qualitat.test.js`
];
const TOTS = [...PRODUCCIO, ...PROVES];

describe('el cens', () => {
  test('tots els fitxers de la secció existixen', () => {
    expect(TOTS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers de la secció', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${DIR}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('per text', () => {
  test('producció: res fora del Baseline 2022, cap lookbehind, cap emmagatzematge directe', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge directe']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = senseComentaris(llig(fitxer));
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('Pedra Seca: cap style= ni color cru en producció', () => {
    const estil = new RegExp(['\\bsty', 'le='].join(''));
    const cru = new RegExp(['#[0-9a-fA-F]{3,8}\\b|\\brgb', 'a?\\(|\\bhsl', 'a?\\('].join(''));
    for (const fitxer of PRODUCCIO) {
      const codi = senseComentaris(llig(fitxer));
      expect(estil.test(codi), fitxer).toBe(false);
      expect(cru.test(codi), fitxer).toBe(false);
    }
  });
});
