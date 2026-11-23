/* tests/portes-cadena-maquetacio-canonica.test.mjs — v1.2.23 · L4-01 i L8-07 (Gauntlet R1).
   La porta de maquetació canònica (IDEA-319, Codex R32.44, lot 01) existia i passava, però cap cadena l'executava:
   ni `npm run porta`, ni el hook (run-portes --nomes-portes), ni el diagnòstic, ni el cens. La Porta Cadena tampoc
   no la veia òrfena, perquè ix per process.exitCode i no per process.exit(). Ara hi és una vegada; com que
   package.json no li dona cap script, es crida amb node (la Porta Cadena la compta per l'ordre).
   I el README d'enginyeria diu les xifres de passos i portes que declara run-portes.mjs, no unes d'abans. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { passos, seleccionaPassos } from '../tooling/gates/run-portes.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = 'tooling/gates/tractor-maquetacio-canonica.mjs';
const esMaquetacio = (pas) => pas.cmd === 'node' && pas.args?.[0] === PORTA;

test('v1.2.23 · L4-01 i L8-07 · la Maquetació canònica corre a la cadena: porta, hook, diagnòstic i cens', () => {
  assert.equal(passos.filter((pas) => pas.args?.includes(PORTA)).length, 1, 'un sol pas a la cadena');
  const pas = passos.find(esMaquetacio);
  assert.ok(pas, `pas «node ${PORTA}»`);
  assert.deepEqual([pas.readOnly, pas.prova, pas.potMutar], [true, undefined, undefined]);
  // Si package.json li dona un script, el pas l'ha de dir (C7 i C4 de la Porta Cadena); si no, es crida amb node.
  const pkg = JSON.parse(fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8'));
  const scripts = Object.entries(pkg.scripts).filter(([, cos]) => String(cos).includes(PORTA)).map(([nom]) => nom);
  if (scripts.length) assert.ok(scripts.includes(pas.script), `el pas usa l'script de package.json (${scripts.join(', ')})`);
  else assert.equal(pas.script, undefined, 'sense script a package.json, el pas no n\'inventa cap');
  for (const mode of [{}, { nomesPortes: true }, { diagnostic: true }, { cens: true }, { cens: true, ambMutacions: true }]) {
    assert.equal(seleccionaPassos(mode).filter(esMaquetacio).length, 1, JSON.stringify(mode));
  }
});

test('v1.2.23 · L4-01 i L8-07 · la Porta Cadena la veu a la cadena i la porta passa amb 0 infraccions a l\'arbre', () => {
  // No se n'avalua el verd global de la Porta Cadena: depén de l'arbre sencer.
  const cadena = spawnSync(process.execPath, ['tooling/gates/tractor-cadena.mjs', '--json'], { cwd: ARREL, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.ok(JSON.parse(cadena.stdout).cadena.includes('tractor-maquetacio-canonica.mjs'), cadena.stderr);
  // La mateixa ordre que executa la cadena, amb --json per a llegir-ne el resultat.
  const porta = spawnSync(process.execPath, [PORTA, '--json'], { cwd: ARREL, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const informe = JSON.parse(porta.stdout);
  assert.deepEqual(informe.issues, [], informe.issues.map((i) => `${i.file}:${i.line} [${i.code}] ${i.message}`).join('\n'));
  assert.deepEqual([porta.status, informe.ok], [0, true], porta.stderr);
});

test('v1.2.23 · L4-01 · el README d\'enginyeria diu els passos i les portes que declara run-portes.mjs', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'README.md'), 'utf8');
  const portes = passos.filter((pas) => !pas.prova).length;
  const bateries = passos.filter((pas) => pas.prova).length;
  const xifra = (re) => {
    const m = re.exec(readme);
    assert.ok(m, `README: ${re}`);
    return Number(m[1]);
  };
  assert.deepEqual([
    xifra(/declara \*\*(\d+) passos\*\*/),
    xifra(/declara \*\*\d+ passos\*\*: (\d+) portes/),
    xifra(/declara \*\*\d+ passos\*\*: \d+ portes i (\d+) bateries/),
    xifra(/`run-portes\.mjs --nomes-portes`: (\d+) portes/),
    xifra(/\*\*`--nomes-portes`:\*\* les (\d+) portes/),
    xifra(/\*\*`--cens`:\*\* (\d+) portes/),
    xifra(/\*\*`--diagnostic`:\*\* (\d+) portes/)
  ], [
    passos.length, portes, bateries,
    seleccionaPassos({ nomesPortes: true }).length,
    seleccionaPassos({ nomesPortes: true }).length,
    seleccionaPassos({ cens: true }).length,
    seleccionaPassos({ diagnostic: true }).length
  ]);
});
