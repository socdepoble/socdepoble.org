/** Porta executable del carril Calendari (ordre del Mestre, 261001; torn
 *  torn_ddd7a133, tasques 1, 2 i 3). El hook del projecte no deixa executar
 *  `npm run lint`: ací es linten amb l'API d'ESLint (la configuració de
 *  `npm run lint`, zero avisos) els fitxers que el carril ha tocat o afegit, i
 *  es comproven com a text les regles de Pedra Seca que vigila el pre-commit:
 *  cap `style=`, cap full propi importat des del JSX, tota classe del JSX nou
 *  declarada als fulls canònics i Supabase fora de la interfície (Model B).
 *  També la taxonomia: AgendaMur.jsx i AgendaSection.jsx queden sense cap
 *  importador (els esborra el Mestre) i /calendari munta CalendariSection.
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
  'src/sections/calendari/CalendariSection.jsx',
  'src/sections/mur/CalendariMur.jsx',
  'src/sections/mur/TargetaDelMur.jsx'
];
const JS_CARRIL = [
  ...JSX_NOU,
  'src/sections/calendari/calendariGlobal.js',
  'src/sections/calendari/calendariGlobal.test.js',
  'src/sections/calendari/CalendariSection.test.jsx',
  'src/sections/mur/CalendariMur.test.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/mur/MurSection.agenda.test.jsx',
  'src/sections/mur/agendaMur.js',
  'src/sections/mur/targetesMur.js',
  'src/sections/mur/targetesMur.test.js',
  'src/config/sections.js',
  'tests/lint_calendari.test.mjs'
];
const CSS_CANONIC = fs.readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => `src/css/${f}`);

test('tots els fitxers del carril existixen', () => {
  assert.deepEqual(JS_CARRIL.filter((f) => !fs.existsSync(path.join(ARREL, f))), []);
});

test('ESLint: zero missatges (avisos inclosos) als fitxers del carril', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(JS_CARRIL.map((f) => path.join(ARREL, f)));
  const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`));
  assert.equal(resultats.length, JS_CARRIL.length, 'ESLint no ha linat tots els fitxers del carril');
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

test('Pedra Seca: cap style=, cap full propi importat, cap :has() i Supabase fora de la interfície', () => {
  const dolents = [];
  for (const f of JS_CARRIL.filter((ruta) => ruta.startsWith('src/'))) {
    llig(f).split('\n').forEach((linia, i) => {
      if (/\sstyle=\{/.test(linia)) dolents.push(`${f}:${i + 1} style=`);
      if (/^\s*import\s+[^;]*\.css['"]/.test(linia)) dolents.push(`${f}:${i + 1} import de CSS`);
      if (/:has\(/.test(linia)) dolents.push(`${f}:${i + 1} :has()`);
      if (/@supabase\/supabase-js|from\s+['"][^'"]*\/supabase\/[^'"]*['"]/.test(linia)) dolents.push(`${f}:${i + 1} Supabase`);
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
      ...[...text.matchAll(/navegacioClassName="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/))
    ].filter(Boolean);
    for (const c of classes) if (!declarades.has(c)) orfes.push(`${c} (${path.basename(f)})`);
  }
  assert.deepEqual(orfes, []);
});

/* Els fitxers de src/ (menys els antics mateixos), per a buscar-hi importadors. */
function fitxersDeSrc() {
  return fs.readdirSync(path.join(ARREL, 'src'), { recursive: true })
    .map((f) => `src/${String(f).split(path.sep).join('/')}`)
    .filter((f) => /\.(js|jsx|mjs)$/.test(f));
}

test('taxonomia: AgendaMur.jsx i AgendaSection.jsx no tenen cap importador; /calendari munta CalendariSection', () => {
  const importadors = fitxersDeSrc()
    .filter((f) => !f.endsWith('/AgendaMur.jsx') && !f.endsWith('/AgendaSection.jsx'))
    .filter((f) => /['"][^'"]*\/(AgendaMur(\.jsx)?|agenda\/AgendaSection(\.jsx)?)['"]/.test(llig(f)));
  assert.deepEqual(importadors, []);
  const app = llig('src/app/App.jsx');
  assert.match(app, /const CalendariSection = lazy\(\(\) => import\('\.\.\/sections\/calendari\/CalendariSection'\)\);/);
  assert.match(app, /<Route path="calendari" element=\{<CalendariSection \/>\} \/>/);
  assert.doesNotMatch(app, /AgendaSection/);
});

test('taxonomia: la pestanya del Mur diu «Calendari» i conserva el valor intern', () => {
  const mur = llig('src/sections/mur/MurSection.jsx');
  assert.match(mur, /\{ valor: 'events', text: 'Calendari' \}/);
  assert.doesNotMatch(mur, /text: 'Agenda'/);
  assert.match(mur, /<CalendariMur actes=\{sortedEvents\}/);
});
