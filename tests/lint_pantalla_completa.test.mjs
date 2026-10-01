/** Porta executable de la pantalla completa del Calendari (ordre del Mestre,
 *  261001: «Botó de Pantalla Completa al Calendari»). El hook del projecte no
 *  deixa executar `npm run lint`: ací es linten amb l'API d'ESLint (la
 *  configuració de `npm run lint`, zero avisos) els fitxers que el carril ha
 *  tocat o afegit i que cap altra porta no lintava, i es comproven com a text
 *  les regles de Pedra Seca: cap `style=`, cap `:has()`, cap full propi
 *  importat i tota classe del JSX nou declarada als fulls canònics.
 *  CalendariSection.jsx i les seues proves ja els vigila lint_calendari.
 *  Cap import relatiu: tot es resol des de l'arrel del repositori. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');

const JSX_NOU = [
  'src/components/PedraSeca/organismes/PantallaCompleta.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPantallaCompleta.jsx'
];
const CARRIL = [
  ...JSX_NOU,
  'src/components/PedraSeca/organismes/PantallaCompleta.test.jsx',
  'src/components/PedraSeca/hooks/usePantallaCompleta.js',
  'src/components/PedraSeca/hooks/usePantallaCompleta.test.jsx',
  // La xarxa del focus perdut dins d'un <soc-de-poble> (revisió de la pantalla completa).
  'src/components/PedraSeca/organismes/modalLocal.js',
  'src/components/PedraSeca/organismes/CalendariMes.jsx',
  'src/components/PedraSeca/organismes/CalendariMes.test.jsx',
  'src/components/PedraSeca/organismes/CalendariEsdeveniments.jsx',
  'src/components/PedraSeca/organismes/CalendariEsdeveniments.test.jsx',
  'src/components/PedraSeca/organismes/NavegacioPeriode.jsx',
  'src/components/PedraSeca/organismes/NavegacioPeriode.test.jsx',
  'src/sections/mur/CalendariMur.jsx',
  'src/sections/disseny/cataleg/registre.js',
  'src/sections/disseny/cataleg/manifest.js',
  'src/sections/disseny/cataleg/detailRegistry.jsx',
  'src/css/pantallaCompleta.capes.test.js',
  'tests/lint_pantalla_completa.test.mjs'
];
const CSS_CANONIC = fs.readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => `src/css/${f}`);

test('tots els fitxers del carril existixen', () => {
  assert.deepEqual(CARRIL.filter((f) => !fs.existsSync(path.join(ARREL, f))), []);
});

test('ESLint: zero missatges (avisos inclosos) als fitxers del carril', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(CARRIL.map((f) => path.join(ARREL, f)));
  const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`));
  assert.equal(resultats.length, CARRIL.length, 'ESLint no ha linat tots els fitxers del carril');
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

test('Pedra Seca: cap style=, cap :has() ni cap full propi importat', () => {
  const dolents = [];
  for (const f of CARRIL.filter((ruta) => ruta.startsWith('src/') && !ruta.endsWith('.test.js'))) {
    llig(f).split('\n').forEach((linia, i) => {
      if (/\sstyle=\{/.test(linia)) dolents.push(`${f}:${i + 1} style=`);
      if (/^\s*import\s+[^;]*\.css['"]/.test(linia)) dolents.push(`${f}:${i + 1} import de CSS`);
      if (/:has\(/.test(linia)) dolents.push(`${f}:${i + 1} :has()`);
    });
  }
  assert.deepEqual(dolents, []);
});

test('tota classe del JSX nou té regla als fulls canònics', () => {
  const declarades = new Set();
  for (const f of CSS_CANONIC) for (const m of llig(f).matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) declarades.add(m[1]);
  const orfes = [];
  for (const f of JSX_NOU) {
    const text = llig(f);
    const classes = [
      ...[...text.matchAll(/className="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)),
      ...[...text.matchAll(/className=\{\[\s*'([^']*)'/g)].flatMap((m) => m[1].split(/\s+/))
    ].filter(Boolean);
    for (const c of classes) if (!declarades.has(c)) orfes.push(`${c} (${path.basename(f)})`);
  }
  assert.deepEqual(orfes, []);
});
