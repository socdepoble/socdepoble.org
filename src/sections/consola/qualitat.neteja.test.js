// @vitest-environment node
/* Neteja 261007 (prompt 261007_1628, peça D: Consola, només canvis píxel
   idèntics) · ESLint amb la configuració del projecte i zero missatges
   (avisos inclosos) als fitxers d'esta passada que no són ja als panys de
   src/sections/consola/qualitat.test.js i src/config/qualitat.amfitrioAdmin.test.js:
   el hook genèric de les fonts de desenvolupament, les seues proves i els
   fitxers on només ha canviat un comentari ranci. Patró dels altres panys.
   Esmena del revisor adversarial (peça D) · mapa/useMapa.js ja és al pany
   d'amfitrió (qualitat.amfitrioAdmin.test.js) i no es repetix ací. */
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = [
  'src/sections/consola/useFontDev.js',
  'src/sections/consola/useFontDev.test.js',
  'src/sections/consola/mapa/tonsMapa.test.js',
  'src/sections/consola/xifresMas.neteja.test.js',
  'src/sections/consola/ConsolaSection.neteja.test.jsx',
  'src/sections/consola/qualitat.neteja.test.js',
  // Només el comentari ranci.
  'src/sections/consola/mapa/actorsMapa.test.js',
  'src/components/universal/PanellCrom.jsx',
  'src/app/guards/guardaConsola.test.js'
];

describe('ESLint de la neteja 261007 de la Consola', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});
