import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { discoverNodeTests, validateManifest, runNodeSuite, runCi } from '../tooling/tests/run-node-tests.mjs';
import { passos, seleccionaPassos } from '../tooling/gates/run-portes.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const entry = (name, suite = 'primary') => ({ path: name, suite, reason: 'Fixture sintètica' });
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-node-suites-'));
  const files = ['tests/a.test.mjs', 'tests/nested/b.test.mjs', 'tooling/gates/c.test.mjs'];
  for (const name of files) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), '');
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = { schema: 'sdp.node-suites.v1', requiredPrimary: [files[0]], files: [entry(files[0]), entry(files[1], 'laboratory'), entry(files[2], 'session')] };
  return { root, files, manifest };
}

test('el manifest viu classifica cada prova i protegeix les cobertures noves de CI i T5', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tooling/tests/node-suite-manifest.json'), 'utf8'));
  const catalog = validateManifest(ROOT, manifest);
  assert.equal(catalog.files.length, manifest.files.length);
  for (const name of ['tests/conformitat-amfitrio.test.mjs', 'tests/migracio-xat-de-pagina.test.mjs', 'tests/cognitive-preflight.test.mjs', 'tests/plantilla-viva-escriptori.test.mjs', 'tests/cognitive-document-handoff.test.mjs', 'tests/cognitive-hook-safety.test.mjs', 'tests/migracio-convergencia-perfil.test.mjs']) {
    assert.ok(catalog.suites.primary.includes(name), `${name}: fora de la cadena primària`);
    assert.ok(manifest.requiredPrimary.includes(name), `${name}: cobertura no protegida`);
  }
});

test('la descoberta és recursiva i totes les eines entren al cens', (t) => {
  const { root, files } = fixture(t);
  assert.deepEqual(discoverNodeTests(root), [...files].sort());
});

test('una prova nova sense classificació bloqueja la cadena', (t) => {
  const { root, manifest } = fixture(t);
  fs.writeFileSync(path.join(root, 'tests/new.test.mjs'), '');
  assert.throws(() => validateManifest(root, manifest), /sense classificar: tests\/new\.test\.mjs/);
});

test('no s’accepten dobles assignacions, entrades absents ni exclusions sense motiu', (t) => {
  const { root, manifest } = fixture(t);
  assert.throws(() => validateManifest(root, { ...manifest, files: [...manifest.files, manifest.files[0]] }), /duplicada/);
  assert.throws(() => validateManifest(root, { ...manifest, files: [...manifest.files, entry('tests/absent.test.mjs')] }), /sense prova/);
  assert.throws(() => validateManifest(root, { ...manifest, files: [{ ...manifest.files[0], reason: '' }, ...manifest.files.slice(1)] }), /motiu explícits/);
  assert.throws(() => validateManifest(root, { ...manifest, files: [{ ...manifest.files[0], suite: 'ignored' }, ...manifest.files.slice(1)] }), /suite/);
});

test('la cobertura requerida no es pot excloure canviant-ne la categoria', (t) => {
  const { root, manifest } = fixture(t);
  assert.throws(() => validateManifest(root, { ...manifest, files: [{ ...manifest.files[0], suite: 'session' }, ...manifest.files.slice(1)] }), /Cobertura primària absent/);
});

test('cada corredor selecciona els fitxers exactes i conserva els codis de fallada', (t) => {
  const { root, manifest } = fixture(t);
  const catalog = validateManifest(root, manifest);
  for (const suite of ['primary', 'laboratory', 'session', 'all']) {
    let invocation;
    assert.equal(runNodeSuite(root, catalog, suite, (...args) => { invocation = args; return { status: 7 }; }), 7);
    assert.deepEqual(invocation[1], ['--test', '--test-concurrency=2', ...(suite === 'all' ? catalog.files : catalog.suites[suite])]);
    assert.equal(invocation[2].cwd, root);
  }
  assert.equal(runNodeSuite(root, catalog, 'primary', () => ({ status: null, signal: 'SIGTERM' })), 1);
  assert.throws(() => runNodeSuite(root, catalog, 'absent'), /desconeguda/);
});

test('CI executa Node i Vitest run, també amb Node roig, i qualsevol fallada conserva exit 1', (t) => {
  const { root, manifest } = fixture(t);
  const catalog = validateManifest(root, manifest);
  for (const statuses of [[1, 0], [0, 1], [0, 0]]) {
    const calls = [];
    const code = runCi(root, catalog, (...args) => { calls.push(args); return { status: statuses[calls.length - 1] }; });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1][1], [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--maxWorkers=2']);
    assert.equal(code, statuses.every((status) => status === 0) ? 0 : 1);
  }
});


test('el mode de CI manté totes les portes i elimina només les bateries ja executades', () => {
  const proves = new Set(['test:documental', 'test:node', 'test']);
  const esBateria = pas => pas.cmd === 'npm' && pas.args[0] === 'run' && proves.has(pas.args[1]);
  const bateries = passos.filter(esBateria);
  assert.deepEqual(bateries.map(pas => pas.args[1]).sort(), [...proves].sort());
  assert.deepEqual(seleccionaPassos(), passos, 'el mode complet conserva totes les bateries');
  const portes = seleccionaPassos({ nomesPortes: true });
  assert.deepEqual(portes, passos.filter(pas => !esBateria(pas)), 'només es lleva la bateria duplicada; cap porta');
  assert.equal(portes.length, passos.length - 3);
  for (const nom of ['Porta Build', 'Porta Reflex', 'Segell de skills', 'Tractor Cognitiu', 'Porta RLS', 'Linter']) {
    assert.ok(portes.some(pas => pas.nom === nom), `${nom}: porta perduda`);
  }
  assert.deepEqual(seleccionaPassos({ diagnostic: true }), passos.filter(pas => pas.readOnly));
  assert.throws(() => seleccionaPassos({ diagnostic: true, nomesPortes: true }), /modes diferents/);
});


test('la comanda real del workflow arriba al CLI de les portes amb --nomes-portes', (t) => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/wiki-integrity.yml'), 'utf8');
  const command = /^\s+run: (npm run \S+ -- --nomes-portes)\s*$/m.exec(workflow)?.[1];
  assert.ok(command, 'ordre explícita de només portes absent del workflow');
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    private: true, scripts: { porta: 'node argv.cjs', gate: 'npm run porta' }
  }));
  fs.writeFileSync(path.join(root, 'argv.cjs'), 'process.stdout.write("SDP_ARGV:" + JSON.stringify(process.argv.slice(2)) + "\\n");\n');
  const result = spawnSync('npm', command.split(/\s+/).slice(1), {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, npm_config_update_notifier: 'false' }
  });
  assert.equal(result.status, 0, result.stderr);
  const args = /^SDP_ARGV:(.+)$/m.exec(result.stdout)?.[1];
  assert.ok(args, 'el CLI fill no ha rebut la comanda');
  assert.deepEqual(JSON.parse(args), ['--nomes-portes'], 'npm ha consumit el flag en una capa intermèdia');
});
