// @vitest-environment node
/* P6 (ordre del Mestre, 261003) · Qualitat dels fitxers JS/JSX que toca o
   crea el desplegador de la llista en pantalles xicotetes: ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos), i les
   comprovacions de Pedra Seca per text. Patró de
   src/components/universal/workspace/qualitat.test.js, que ja vigila
   AppGridShell.jsx i UniversalWorkspace.jsx; ací, la resta del lot. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/components/layout/AppGridShell.jsx',
  'src/components/layout/AppGridColumn.jsx',
  'src/components/layout/AppGridShell.rail.test.jsx',
  'src/components/layout/AppGridShell.qualitat.test.js',
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.railCompacte.test.jsx',
  /* P6 (revisió adversarial) · Les proves de regressió de F1–F3. */
  'src/components/universal/workspace/UniversalWorkspace.railRevisio.test.jsx'
]);

const esProva = (f) => /\.test\.jsx?$/.test(f);

describe('P6 · el cens', () => {
  test('tots els fitxers del lot existixen', () => {
    expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('P6 · ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

describe('P6 · Pedra Seca', () => {
  test('fora de proves: cap style=, cap hex, res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = readFileSync(path.join(ARREL, fitxer), 'utf8');
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('AppGridShell.css: cap color cru ni style en les regles noves del rail', () => {
    const css = readFileSync(path.join(ARREL, 'src/components/layout/AppGridShell.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const regles = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, selector]) => selector.includes('data-llista') || selector.includes('app-grid-rail'))
      .map(([, , cos]) => cos);
    expect(regles.length).toBeGreaterThan(0);
    for (const cos of regles) {
      expect(cos).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/);
    }
  });
});
