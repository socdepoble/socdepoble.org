import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditaDuplicatsPublic, validaRegistreDuplicats, SCHEMA_DUPLICATS } from './tractor-duplicats-public.mjs';

const scratch = path.join(process.cwd(), '.r3243-fixtures');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const empty = () => ({ schema: SCHEMA_DUPLICATS, scope: 'public/assets', groups: [] });
function fixture(t, files = {}) {
  fs.mkdirSync(scratch, { recursive: true });
  const root = fs.mkdtempSync(path.join(scratch, 'duplicats-'));
  fs.mkdirSync(path.join(root, 'public/assets'), { recursive: true });
  t.after(() => { fs.rmSync(root, { recursive: true, force: true }); try { fs.rmdirSync(scratch); } catch { /* fixtures concurrents */ } });
  for (const [name, bytes] of Object.entries(files)) {
    const target = path.join(root, 'public/assets', name);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  }
  return root;
}
function registry(bytes, paths = ['a.png', 'nested/b.png']) {
  return { ...empty(), groups: [{ sha256: digest(bytes), bytes: Buffer.byteLength(bytes),
    paths: paths.map(file => `public/assets/${file}`).sort(), reason: 'URLs històriques sintètiques de fixture.' }] };
}

test('cens buit real i registre buit passen sense omissions', t => {
  const report = auditaDuplicatsPublic({ root: fixture(t), registre: empty() });
  assert.equal(report.valid, true); assert.equal(report.stats.files, 0); assert.equal(report.stats.duplicateGroups, 0);
});
test('parella congelada coincidix en ruta, mida i bytes; auditoria no altera fitxers', t => {
  const bytes = Buffer.from([0, 1, 255, 7]), root = fixture(t, { 'a.png': bytes, 'nested/b.png': bytes });
  const before = fs.readFileSync(path.join(root, 'public/assets/a.png'));
  const report = auditaDuplicatsPublic({ root, registre: registry(bytes) });
  assert.equal(report.valid, true); assert.equal(report.groups[0].allowed, true); assert.equal(report.stats.hashes, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'public/assets/a.png')), before);
});
test('un duplicat nou és bloquejant encara que pese menys de512KiB', t => {
  const report = auditaDuplicatsPublic({ root: fixture(t, { 'a.png': 'x', 'b.png': 'x' }), registre: empty() });
  assert.equal(report.valid, false); assert.equal(report.issues[0].code, 'DP1'); assert.equal(report.stats.hashes, 2);
});
test('un hash conegut no autoritza una tercera còpia fora del pathset congelat', t => {
  const bytes = Buffer.from('frozen'), root = fixture(t, { 'a.png': bytes, 'nested/b.png': bytes, 'new/c.png': bytes });
  const report = auditaDuplicatsPublic({ root, registre: registry(bytes) });
  assert.equal(report.valid, false); assert.equal(report.issues[0].code, 'DP2');
});
test('un byte alterat de mateixa mida falla encara que desfaça el duplicat', t => {
  const root = fixture(t, { 'a.png': 'abcd', 'nested/b.png': 'abce' });
  const report = auditaDuplicatsPublic({ root, registre: registry('abcd') });
  assert.equal(report.valid, false); assert.equal(report.groups.length, 0); assert.equal(report.issues[0].code, 'DP3');
});
test('la mida divergent també falla', t => {
  const report = auditaDuplicatsPublic({ root: fixture(t, { 'a.png': 'abcd', 'nested/b.png': 'abcde' }), registre: registry('abcd') });
  assert.equal(report.valid, false); assert.equal(report.issues[0].code, 'DP3');
});
test('no es retira silenciosament una ruta històrica encara que quede una sola còpia', t => {
  const report = auditaDuplicatsPublic({ root: fixture(t, { 'a.png': 'abcd' }), registre: registry('abcd') });
  assert.equal(report.valid, false); assert.equal(report.issues[0].code, 'DP3'); assert.match(report.issues[0].message, /absent/);
});
test('fitxers diferents de mateixa mida no són duplicats', t => {
  const report = auditaDuplicatsPublic({ root: fixture(t, { 'a.png': 'abcd', 'nested/b.png': 'abce' }), registre: empty() });
  assert.equal(report.valid, true); assert.equal(report.stats.duplicateGroups, 0); assert.equal(report.stats.hashes, 2);
});
test('symlink de fitxer i de directori fallen tancats sense llegir el destí', t => {
  const root = fixture(t, { 'regular.png': 'safe' }), outside = path.join(root, 'outside');
  fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'private.bin'), 'do-not-read');
  fs.symlinkSync(outside, path.join(root, 'public/assets/link-directory'));
  fs.symlinkSync(path.join(outside, 'private.bin'), path.join(root, 'public/assets/link-file'));
  const report = auditaDuplicatsPublic({ root, registre: empty() });
  assert.equal(report.valid, false); assert.equal(report.issues.filter(i => i.code === 'DP0').length, 2); assert.equal(report.stats.hashes, 0);
});
test('public simbòlic tampoc pot evadir el límit de l’arrel', t => {
  const root = fixture(t); fs.rmSync(path.join(root, 'public'), { recursive: true });
  fs.mkdirSync(path.join(root, 'other/assets'), { recursive: true }); fs.symlinkSync(path.join(root, 'other'), path.join(root, 'public'));
  const report = auditaDuplicatsPublic({ root, registre: empty() }); assert.equal(report.valid, false); assert.equal(report.issues[0].code, 'DP0');
});
test('arrel absent, registre corrupte i esquema incorrecte no es convertixen en verd buit', t => {
  const root = fixture(t), file = path.join(root, 'registry.json'); fs.writeFileSync(file, '{broken');
  for (const args of [{ root: root + '/missing', registre: empty() }, { root, registre: file }, { root, registre: {} }]) {
    const result = auditaDuplicatsPublic(args); assert.equal(result.valid, false); assert.equal(result.issues[0].code, 'DP0');
  }
});
test('el registre rebutja wildcard, traversal, rutes repetides i permissió per hash sense rutes', () => {
  const good = registry('abcd');
  for (const paths of [['public/assets/../secret', 'public/assets/a'], ['elsewhere/a', 'public/assets/a'],
    ['public/assets/a', 'public/assets/a'], [], ['public/assets/a\\b', 'public/assets/c'], ['public/assets/*.png', 'public/assets/a.png']]) {
    const value = structuredClone(good); value.groups[0].paths = paths; assert.throws(() => validaRegistreDuplicats(value));
  }
  const duplicate = structuredClone(good); duplicate.groups.push(duplicate.groups[0]); assert.throws(() => validaRegistreDuplicats(duplicate));
});
test('CLI JSON retorna0/1 sobre fixtures explícites i rebutja opcions desconegudes', t => {
  const root = fixture(t), file = path.join(root, 'registry.json'), gate = fileURLToPath(new URL('./tractor-duplicats-public.mjs', import.meta.url));
  fs.writeFileSync(file, JSON.stringify(empty()));
  const run = args => spawnSync(process.execPath, [gate, '--arrel', root, '--registre', file, '--json', ...args], { encoding: 'utf8' });
  const green = run([]); assert.equal(green.status, 0, green.stderr); assert.equal(JSON.parse(green.stdout).valid, true);
  fs.writeFileSync(path.join(root, 'public/assets/a'), 'x'); fs.writeFileSync(path.join(root, 'public/assets/b'), 'x');
  const red = run([]); assert.equal(red.status, 1); assert.equal(JSON.parse(red.stdout).issues[0].code, 'DP1');
  assert.equal(run(['--force']).status, 1);
});
// v1.2.23 · L4-09 (ordre del Mestre 261123) · La porta existia i passava, però cap cadena l'executava: ni `npm run porta`,
// ni el hook (run-portes --nomes-portes), ni el diagnòstic del Mapa. Ara hi és una vegada, amb el seu script.
test('v1.2.23 · L4-09 · la porta corre a la cadena: porta, hook, diagnòstic i cens, amb script porta:duplicats', async () => {
  const { passos, seleccionaPassos } = await import('./run-portes.mjs');
  const arrel = fileURLToPath(new URL('../..', import.meta.url));
  const esDuplicats = pas => pas.cmd === 'node' && pas.args?.[0] === 'tooling/gates/tractor-duplicats-public.mjs';
  assert.equal(passos.filter(esDuplicats).length, 1, 'un sol pas a la cadena');
  const pas = passos.find(esDuplicats);
  assert.deepEqual([pas.script, pas.readOnly, pas.prova, pas.potMutar], ['porta:duplicats', true, undefined, undefined]);
  const pkg = JSON.parse(fs.readFileSync(path.join(arrel, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['porta:duplicats'], 'node tooling/gates/tractor-duplicats-public.mjs');
  for (const mode of [{}, { nomesPortes: true }, { diagnostic: true }, { cens: true }]) {
    assert.equal(seleccionaPassos(mode).filter(esDuplicats).length, 1, JSON.stringify(mode));
  }
  // La porta que vigila les portes la veu a la cadena (no se n'avalua el verd global: depén de l'arbre sencer).
  const cadena = spawnSync(process.execPath, ['tooling/gates/tractor-cadena.mjs', '--json'], { cwd: arrel, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.ok(JSON.parse(cadena.stdout).cadena.includes('tractor-duplicats-public.mjs'), cadena.stderr);
});
