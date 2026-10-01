/** Porta executable del carril A del Calendari (ordre del Mestre, 261001;
 *  torn torn_ddd7a133): «la pastilla porta al període de la targeta i el
 *  calendari el governa la URL». El hook del projecte no deixa executar
 *  `npm run lint` ni `npx eslint`: ací es linten amb l'API d'ESLint (la
 *  configuració de `npm run lint`, zero avisos) els fitxers que el carril A ha
 *  tocat fora de la llista de tests/lint_calendari.test.mjs (que ja lint
 *  CalendariSection, calendariGlobal, CalendariMur i les seues proves), i es
 *  comprova com a text la regla de Pedra Seca que vigila el pre-commit: cap
 *  `style=` ni `:has()`. Cap import relatiu: tot es resol des de l'arrel. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FITXERS = [
  'src/components/universal/editorial.js',
  'src/components/universal/barres/pastillaCalendari.js',
  'src/components/universal/barres/pastillaCalendari.test.jsx',
  'src/components/PedraSeca/organismes/UniversalCard.test.jsx',
  'src/components/universal/EventCard.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenUniversalCard.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenEmoticonaBarra.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPage.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimensUniversals.test.jsx',
  'tests/lint_calendari_mes.test.mjs'
];

test('tots els fitxers del carril A existixen', () => {
  assert.deepEqual(FITXERS.filter((f) => !fs.existsSync(path.join(ARREL, f))), []);
});

test('ESLint: zero missatges (avisos inclosos) als fitxers del carril A', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
  const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`));
  assert.equal(resultats.length, FITXERS.length, 'ESLint no ha linat tots els fitxers del carril A');
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

test('Pedra Seca: cap style= ni :has() als fitxers del carril A', () => {
  const dolents = [];
  for (const f of FITXERS.filter((ruta) => ruta.startsWith('src/'))) {
    fs.readFileSync(path.join(ARREL, f), 'utf8').split('\n').forEach((linia, i) => {
      if (/\sstyle=\{/.test(linia)) dolents.push(`${f}:${i + 1} style=`);
      if (/:has\(/.test(linia)) dolents.push(`${f}:${i + 1} :has()`);
    });
  }
  assert.deepEqual(dolents, []);
});

/* La pastilla ja no porta al dia: cap fitxer de src/ nomena les peces velles
   (rutaCalendariDelDia, diaDeLaPastilla), que s'han retirat d'editorial.js. */
test('cap rastre de les peces velles de la pastilla (rutaCalendariDelDia, diaDeLaPastilla)', () => {
  const fitxers = fs.readdirSync(path.join(ARREL, 'src'), { recursive: true })
    .map((f) => `src/${String(f).split(path.sep).join('/')}`)
    .filter((f) => /\.(js|jsx|mjs)$/.test(f));
  const rastres = fitxers.filter((f) => /rutaCalendariDelDia|diaDeLaPastilla/.test(fs.readFileSync(path.join(ARREL, f), 'utf8')));
  assert.deepEqual(rastres, []);
});
