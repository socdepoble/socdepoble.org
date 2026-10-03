// @vitest-environment node
/* Gestoria · nucli · tractor · qualitat: les portes del repo sobre la
   classificació, la lectura de PDF i el tractor de factures, amb totes les
   seues proves, aïllades de la resta del carril perquè altres lots hi
   treballen alhora. ESLint amb la configuració del projecte i zero missatges
   (l'equivalent de --max-warnings=0), i les comprovacions de Pedra Seca per
   text. Els patrons es componen a trossos perquè les portes que llegixen src/
   no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria/nucli';
const PRODUCCIO = ['classifica.js', 'pdfText.js', 'tractor.js'].map((f) => `${CARRIL}/${f}`);
const PROVES = [
  'classifica.test.js', 'pdfText.test.js', 'tractor.test.js', 'tractor.g3t.test.js', 'tractor.correus.test.js', 'tractor.qualitat.test.js'
].map((f) => `${CARRIL}/${f}`);
const TOTS = [...PRODUCCIO, ...PROVES];
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a la classificació, la lectura de PDF, el tractor i les seues proves', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARRIL, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap color hex, terme vetat, literal de DNI, import amb @/ ni espai invisible, proves incloses', () => {
    const vetats = [
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp(['Local-', 'First|Offline-', 'First|iOS ', '15|iPad ', 'A10'].join('')), 'terme vetat'],
      [/\b\d{8}[A-Za-z]\b/, 'un literal de DNI'],
      [/from '@\//, 'import amb @/']
    ];
    const trobats = TOTS.flatMap((fitxer) => {
      const codi = llig(fitxer);
      const invisibles = codi.split('\n').flatMap((linia, i) => [...linia.matchAll(/[^\S\n\r\t ]/g)]
        .map((m) => `${fitxer}:${i + 1} espai invisible U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`));
      return [...vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`), ...invisibles];
    });
    expect(trobats).toEqual([]);
  });

  test('fora de proves: cap xarxa, emmagatzematge del navegador, global escrita, nucli impur ni res fora del Baseline', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\(|XMLHttp', 'Request|WebSo', 'cket|EventSo', 'urce|sendBea', 'con'].join('')), 'xarxa'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge del navegador'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/from 'react'|import\.meta\.glob|\?raw'|from 'node:/, 'nucli impur'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });
});
