// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · qualitat dels fitxers de la PWA:
   ESLint amb la configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0), i comprovacions per text (patró de
   src/config/qualitat.amfitrio.test.js). public/sw.js no passa per cap build:
   el que s'escriu és el que es publica. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const PRODUCCIO = ['public/sw.js', 'src/pwa/registre.js', 'src/main.jsx'];
const PROVES = ['src/pwa/registre.test.js', 'src/pwa/sw.test.js', 'src/pwa/manifest.test.js', 'src/pwa/qualitat.test.js',
  'src/pwa/__fixtures__/tokens.js'];
const TOTS = [...PRODUCCIO, ...PROVES];

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers de la PWA', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

describe('per text', () => {
  test('public/sw.js és un script clàssic vàlid (sense import ni export)', () => {
    expect(() => new vm.Script(llig('public/sw.js'), { filename: 'public/sw.js' })).not.toThrow();
    expect(llig('public/sw.js')).not.toMatch(/^\s*(?:import|export)\b/m);
  });

  test('producció: res fora del Baseline 2022, cap lookbehind, cap emmagatzematge directe', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge directe']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...TOTS, 'public/manifest.webmanifest', 'index.html']) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
