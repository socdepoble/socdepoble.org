// @vitest-environment node
/* T3 (prompt 261006_0224) · Qualitat de la prova de les apps locals
   (App.appsLocals.test.jsx): ESLint amb la configuració del projecte i zero
   missatges (l'equivalent de --max-warnings=0), com sections/plugins/
   qualitat.test.js, i cap caràcter fora de l'alfabet llatí en els
   identificadors (una lletra ciríl·lica es llig igual i és un altre nom). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const LOT = Object.freeze(['src/app/App.appsLocals.test.jsx', 'src/app/qualitat.appsLocals.test.js']);

describe('qualitat de la prova de les apps locals', () => {
  test('ESLint: zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(LOT.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(LOT.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/app/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);

  test('cap lletra grega ni ciríl·lica (es lligen com les llatines i fan noms diferents)', () => {
    for (const fitxer of LOT) {
      const codi = readFileSync(path.join(ARREL, fitxer), 'utf8');
      expect(codi.match(/[\p{Script=Greek}\p{Script=Cyrillic}]/gu), fitxer).toBeNull();
    }
  });
});
