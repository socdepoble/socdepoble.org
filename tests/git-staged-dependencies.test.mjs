/* P0-22 (B1.3, marató 261101) · Pre-commit de veres: dependències per paquet i temps per pas a git-staged.mjs.
   Abans: un enllaç sencer de node_modules (Vitest no trobava 'react' a l'arbre preparat) i un tall únic
   de 120 s que les portes (~120 s amb càrrega) no complien mai. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire, syncBuiltinESMExports} from 'node:module';
import {parse} from 'acorn';
import {enllacaDependencies, executaValidadors, PASSOS_HOOK, runChecked, tempsDelPas, TEMPS_PAS_MS} from '../tooling/gates/git-staged.mjs';

function temporal(t, prefix = 'sdp deps ') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  return dir;
}

/* Un node_modules sintètic: paquet pla, paquet amb àmbit, .bin amb un executable enllaçat
   i els fitxers punt que no han de viatjar (cachés i el lock intern de npm). */
function origenSintetic(base) {
  const origen = path.join(base, 'node_modules');
  for (const dir of ['a', '@b/c', '@b/d', '.bin', '.vite/deps']) fs.mkdirSync(path.join(origen, dir), {recursive: true});
  fs.writeFileSync(path.join(origen, 'a/index.js'), 'export default 1;\n');
  fs.writeFileSync(path.join(origen, '@b/c/index.js'), 'export default 2;\n');
  fs.writeFileSync(path.join(origen, '@b/.DS_Store'), '');
  fs.symlinkSync('../a/index.js', path.join(origen, '.bin/a'));
  fs.writeFileSync(path.join(origen, '.package-lock.json'), '{}');
  return origen;
}

test('enllacaDependencies: node_modules real amb un enllaç per paquet, també dins dels àmbits', (t) => {
  const base = temporal(t);
  const origen = origenSintetic(base);
  const desti = path.join(base, 'arbre/node_modules');
  fs.mkdirSync(path.dirname(desti));
  enllacaDependencies(origen, desti);

  const arrel = fs.lstatSync(desti);
  assert.ok(arrel.isDirectory() && !arrel.isSymbolicLink(), 'node_modules ha de ser un directori real, no un enllaç sencer');
  assert.equal(arrel.mode & 0o777, 0o700);
  assert.equal(fs.readlinkSync(path.join(desti, 'a')), path.join(origen, 'a'));
  const ambit = fs.lstatSync(path.join(desti, '@b'));
  assert.ok(ambit.isDirectory() && !ambit.isSymbolicLink(), 'un @àmbit és un directori real amb un enllaç per paquet');
  assert.equal(fs.readlinkSync(path.join(desti, '@b/c')), path.join(origen, '@b/c'));
  assert.equal(fs.readlinkSync(path.join(desti, '@b/d')), path.join(origen, '@b/d'));
  assert.equal(fs.readlinkSync(path.join(desti, '.bin')), path.join(origen, '.bin'));
  // Es resol fins al paquet real, també l'executable relatiu de .bin.
  assert.equal(fs.readFileSync(path.join(desti, '@b/c/index.js'), 'utf8'), 'export default 2;\n');
  assert.equal(fs.readFileSync(path.join(desti, '.bin/a'), 'utf8'), 'export default 1;\n');
  // Les cachés i el lock intern no s'enllacen: el que escriga Vitest queda dins del temporal.
  for (const absent of ['.vite', '.package-lock.json', '@b/.DS_Store']) {
    assert.equal(fs.existsSync(path.join(desti, absent)), false, `${absent} no s'ha d'enllaçar`);
  }
  fs.mkdirSync(path.join(desti, '.vite'));
  assert.equal(fs.readdirSync(path.join(origen, '.vite')).join(), 'deps', 'una caché nova no toca l’origen');
});

test('enllacaDependencies falla tancat: destí existent o origen absent', (t) => {
  const base = temporal(t);
  const origen = origenSintetic(base);
  const desti = path.join(base, 'ja-hi-és');
  fs.mkdirSync(desti);
  assert.throws(() => enllacaDependencies(origen, desti), {code: 'EEXIST'});
  const nou = path.join(base, 'nou');
  assert.throws(() => enllacaDependencies(path.join(base, 'no-existix'), nou), {code: 'ENOENT'});
  assert.equal(fs.existsSync(nou), false, 'sense origen no es crea cap destí a mig fer');
});

/* El hook esborra l'arbre preparat sencer (fs.rmSync recursiu, git-staged.mjs:finally). Si
   seguira els enllaços, buidaria el node_modules viu de tots els carrils. */
test('esborrar l’arbre preparat com el hook no toca el node_modules d’origen', (t) => {
  const base = temporal(t);
  const origen = origenSintetic(base);
  const arbre = path.join(base, 'sdp-index-prova');
  fs.mkdirSync(arbre);
  enllacaDependencies(origen, path.join(arbre, 'node_modules'));
  fs.rmSync(arbre, {recursive: true, force: true});
  assert.equal(fs.existsSync(arbre), false);
  for (const viu of ['a/index.js', '@b/c/index.js', '.bin/a', '.package-lock.json']) {
    assert.ok(fs.existsSync(path.join(origen, viu)), `${viu} ha de sobreviure`);
  }
});

test('tempsDelPas: mínims per pas que SDP_HOOK_TEMPS_PAS_S només pot pujar', () => {
  assert.deepEqual({...TEMPS_PAS_MS}, {defecte: 120_000, portes: 600_000, proves: 300_000});
  assert.ok(Object.isFrozen(TEMPS_PAS_MS));
  assert.equal(tempsDelPas('portes', {}), 600_000);
  assert.equal(tempsDelPas('proves', {}), 300_000);
  assert.equal(tempsDelPas('defecte', {}), 120_000);
  assert.equal(tempsDelPas('portes', {SDP_HOOK_TEMPS_PAS_S: '900'}), 900_000);
  assert.equal(tempsDelPas('defecte', {SDP_HOOK_TEMPS_PAS_S: '900'}), 900_000);
  // Mai rebaixa el mínim d'un pas.
  assert.equal(tempsDelPas('portes', {SDP_HOOK_TEMPS_PAS_S: '60'}), 600_000);
  // Valors no vàlids: el mínim, mai menys.
  for (const brut of ['abc', '-5', '0', 'Infinity', '', 'NaN']) {
    assert.equal(tempsDelPas('proves', {SDP_HOOK_TEMPS_PAS_S: brut}), 300_000, `«${brut}»`);
  }
  // spawnSync exigix un enter: una fracció s'arredonix cap amunt; un valor desmesurat té sostre de 24 h.
  const fraccio = tempsDelPas('portes', {SDP_HOOK_TEMPS_PAS_S: '700.0005'});
  assert.ok(Number.isInteger(fraccio) && fraccio >= 700_000, String(fraccio));
  assert.equal(tempsDelPas('portes', {SDP_HOOK_TEMPS_PAS_S: '1e12'}), 86_400_000);
  assert.throws(() => tempsDelPas('inventat', {}), /Pas sense temps declarat/);
  assert.throws(() => tempsDelPas('toString', {}), /Pas sense temps declarat/);
});

test('runChecked respecta el temps del pas i diu que s’ha esgotat', (t) => {
  const cwd = temporal(t);
  assert.equal(runChecked(process.execPath, ['-e', 'process.stdout.write("ok")'], cwd, process.env), 'ok');
  const inici = Date.now();
  assert.throws(() => runChecked(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], cwd, process.env, 1000), /temps esgotat als 1 s/);
  assert.ok(Date.now() - inici < 4000, 'el tall ha de ser el del pas, no un de fix');
  assert.throws(() => runChecked(process.execPath, ['-e', 'console.error("roig"); process.exit(7)'], cwd, process.env, 5000), /roig/);
});

/* Sense pas explícit («verify --staged», plumbing de Git) runChecked també pren tempsDelPas('defecte') de
   l'entorn de la crida (correcció L09-ARB-02): el missatge de tall diu que SDP_HOOK_TEMPS_PAS_S l'allarga.
   S'espia spawnSync amb syncBuiltinESMExports per no haver d'esperar 120 s reals. */
test('runChecked sense pas explícit: 120 s per defecte, i SDP_HOOK_TEMPS_PAS_S també l’allarga', () => {
  const cp = createRequire(import.meta.url)('node:child_process');
  const original = cp.spawnSync;
  const vist = [];
  cp.spawnSync = (cmd, args, opcions) => { vist.push(opcions.timeout); return {status: 0, stdout: 'ok', stderr: ''}; };
  syncBuiltinESMExports();
  try {
    for (const env of [{}, {SDP_HOOK_TEMPS_PAS_S: '900'}, {SDP_HOOK_TEMPS_PAS_S: '30'}]) runChecked('git', ['write-tree'], os.tmpdir(), env);
    runChecked('git', ['write-tree'], os.tmpdir(), {SDP_HOOK_TEMPS_PAS_S: '900'}, 5000);
  } finally {
    cp.spawnSync = original;
    syncBuiltinESMExports();
  }
  assert.deepEqual(vist, [120_000, 900_000, 120_000, 5000]);
});

/* Els temps mesurats el 261101 a l'arbre preparat amb càrrega (10-11 en 10 CPU): portes 119,9 s i
   test:precommit ~72 s. Cap pas pot tornar a compartir el tall de 120 s que les portes no complien. */
test('cada validador del hook té el seu pas de temps, per damunt del que s’ha mesurat', () => {
  assert.deepEqual(PASSOS_HOOK.map(({cmd, args, pas}) => [cmd === process.execPath ? 'node' : cmd, args.join(' '), tempsDelPas(pas, {})]), [
    ['node', 'tooling/gates/porta-documents.mjs --staged', 120_000],
    ['node', 'tooling/gates/tancament.mjs --check', 120_000],
    ['node', 'tooling/gates/run-portes.mjs --nomes-portes', 600_000],
    ['npm', 'run test:precommit', 300_000],
  ]);
  assert.ok(Object.isFrozen(PASSOS_HOOK) && PASSOS_HOOK.every((pas) => Object.isFrozen(pas) && Object.isFrozen(pas.args)));
});

/* El cablejat (correcció L09-ARB-01): executaValidadors és el que crida el hook dins de l'arbre preparat.
   Un `run` injectat captura cada crida; quan arriba el primer validador, les dependències ja han de ser
   per paquet i cada pas ha de dur el seu temps, no l'antic tall únic. */
test('executaValidadors: dependències per paquet abans del primer validador i el temps de cada pas', (t) => {
  const base = temporal(t);
  const origen = origenSintetic(base);
  const crides = [];
  const run = (cmd, args, cwd, env, temps) => {
    const nm = fs.lstatSync(path.join(cwd, 'node_modules'));
    crides.push([cmd === process.execPath ? 'node' : cmd, args.join(' '), cwd, env.SDP_PRE_COMMIT, temps, nm.isDirectory() && !nm.isSymbolicLink()]);
    return '';
  };
  const dir = path.join(base, 'sdp-index-prova');
  fs.mkdirSync(dir, {mode: 0o700});
  executaValidadors(dir, {SDP_PRE_COMMIT: '1'}, {run, origen});
  assert.deepEqual(crides, [
    ['node', 'tooling/gates/porta-documents.mjs --staged', dir, '1', 120_000, true],
    ['node', 'tooling/gates/tancament.mjs --check', dir, '1', 120_000, true],
    ['node', 'tooling/gates/run-portes.mjs --nomes-portes', dir, '1', 600_000, true],
    ['npm', 'run test:precommit', dir, '1', 300_000, true],
  ]);
  assert.equal(fs.readlinkSync(path.join(dir, 'node_modules/@b/c')), path.join(origen, '@b/c'));

  // SDP_HOOK_TEMPS_PAS_S de l'entorn del hook allarga els passos curts i mai rebaixa el de les portes.
  const llarg = path.join(base, 'sdp-index-llarg');
  fs.mkdirSync(llarg, {mode: 0o700});
  crides.length = 0;
  executaValidadors(llarg, {SDP_PRE_COMMIT: '1', SDP_HOOK_TEMPS_PAS_S: '400'}, {run, origen});
  assert.deepEqual(crides.map((c) => c[4]), [400_000, 400_000, 600_000, 400_000]);

  // Un validador roig atura la cadena: els següents no s'executen.
  const roig = path.join(base, 'sdp-index-roig');
  fs.mkdirSync(roig, {mode: 0o700});
  crides.length = 0;
  const falla = (cmd, args, ...resta) => {
    run(cmd, args, ...resta);
    if (args[0] === 'tooling/gates/tancament.mjs') throw new Error('tancament roig');
    return '';
  };
  assert.throws(() => executaValidadors(roig, {SDP_PRE_COMMIT: '1'}, {run: falla, origen}), /tancament roig/);
  assert.deepEqual(crides.map((c) => c[1]), ['tooling/gates/porta-documents.mjs --staged', 'tooling/gates/tancament.mjs --check']);
});

/* verifyPreparedTree necessita un lease i un rebut reals, i les portes senceres no caben en una prova
   unitària. Esta guarda d'AST tanca l'altra meitat del cablejat: el hook delega en executaValidadors
   i no torna a enllaçar node_modules ni a recórrer els validadors pel seu compte (defecte P0-22). */
test('verifyPreparedTree delega en executaValidadors i no té cap camí propi cap als validadors', () => {
  const font = fs.readFileSync(new URL('../tooling/gates/git-staged.mjs', import.meta.url), 'utf8');
  const ast = parse(font, {ecmaVersion: 'latest', sourceType: 'module'});
  const decl = ast.body.find((n) => n.type === 'ExportNamedDeclaration' && n.declaration?.id?.name === 'verifyPreparedTree');
  assert.ok(decl, 'verifyPreparedTree exportada');
  const crides = [], noms = [];
  (function recorre(node) {
    if (Array.isArray(node)) return node.forEach(recorre);
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'Identifier') noms.push(node.name);
    if (node.type === 'CallExpression') crides.push(node);
    for (const [clau, valor] of Object.entries(node)) if (clau !== 'type' && valor && typeof valor === 'object') recorre(valor);
  })(decl.declaration.body);
  const delegacions = crides.filter((c) => c.callee.type === 'Identifier' && c.callee.name === 'executaValidadors');
  assert.equal(delegacions.length, 1, 'una sola crida a executaValidadors');
  assert.deepEqual(delegacions[0].arguments.map((a) => a.name), ['dir', 'env'], 'amb l’arbre preparat i el seu entorn, sense injeccions');
  for (const prohibit of ['symlinkSync', 'enllacaDependencies', 'PASSOS_HOOK', 'tempsDelPas']) {
    assert.ok(!noms.includes(prohibit), `${prohibit} no pot aparéixer dins de verifyPreparedTree`);
  }
});
