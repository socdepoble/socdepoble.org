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
import {auditaSkills} from '../tooling/brain/fronteres-skills.mjs';
import {copiaTornsLocals, enllacaDependencies, executaValidadors, PASSOS_HOOK, runChecked, tempsDelPas, TEMPS_PAS_MS} from '../tooling/gates/git-staged.mjs';

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
    ['node', 'tooling/gates/teclat-superficies.mjs', 300_000],
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
    ['node', 'tooling/gates/teclat-superficies.mjs', dir, '1', 300_000, true],
    ['npm', 'run test:precommit', dir, '1', 300_000, true],
  ]);
  assert.equal(fs.readlinkSync(path.join(dir, 'node_modules/@b/c')), path.join(origen, '@b/c'));

  // SDP_HOOK_TEMPS_PAS_S de l'entorn del hook allarga els passos curts i mai rebaixa el de les portes.
  const llarg = path.join(base, 'sdp-index-llarg');
  fs.mkdirSync(llarg, {mode: 0o700});
  crides.length = 0;
  executaValidadors(llarg, {SDP_PRE_COMMIT: '1', SDP_HOOK_TEMPS_PAS_S: '400'}, {run, origen});
  assert.deepEqual(crides.map((c) => c[4]), [400_000, 400_000, 600_000, 400_000, 400_000]);

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

  // Una barrera de teclat també frena test:precommit; no és un registre ornamental.
  const teclatRoig = path.join(base, 'sdp-index-teclat-roig');
  fs.mkdirSync(teclatRoig, {mode: 0o700});
  crides.length = 0;
  const fallaTeclat = (cmd, args, ...resta) => {
    run(cmd, args, ...resta);
    if (args[0] === 'tooling/gates/teclat-superficies.mjs') throw new Error('teclat roig');
    return '';
  };
  assert.throws(() => executaValidadors(teclatRoig, {SDP_PRE_COMMIT: '1'}, {run: fallaTeclat, origen}), /teclat roig/);
  assert.equal(crides.at(-1)[1], 'tooling/gates/teclat-superficies.mjs');
  assert.ok(!crides.some(c => c[1] === 'run test:precommit'));

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

/* R32 · D-R30-15: els registres de torn són locals (.gitignore) i no viatgen a l'índex. Sense la còpia, el
   primer commit d'un document amb rebut d'un torn nou es bloqueja a porta-documents --staged («Registre de torn
   absent»). copiaTornsLocals només copia registres regulars amb nom de torn, amb 0600, i mai no trepitja el que
   l'arbre preparat ja porta (un registre històric encara versionat, materialitzat des de l'índex). */
const torn = (n) => `torn_00000000-0000-4000-8000-${String(n).padStart(12, '0')}.json`;
function magatzemViu(base) {
  const origen = path.join(base, 'viu'), font = path.join(origen, '.agents/runtime/turns'), fora = path.join(base, 'fora');
  fs.mkdirSync(font, {recursive: true});
  fs.mkdirSync(fora);
  const posa = (rel, text) => { fs.writeFileSync(path.join(font, rel), text); fs.chmodSync(path.join(font, rel), 0o644); };
  posa(torn(1), '{"torn":1}');
  posa(torn(2), '{"torn":2,"on":"disc"}');
  // Noms que no són registres de torn: locks, temporals, majúscules, ocults i altres fitxers.
  for (const alie of [`${torn(1)}.lock`, `${torn(1)}.tmp`, 'torn_ABC.json', `.${torn(3)}`, 'notes.txt', 'torn_.json.bak']) posa(alie, 'alie');
  // Un directori amb nom de registre, un symlink i un hardlink cap a fora del magatzem.
  fs.mkdirSync(path.join(font, torn(4)));
  fs.writeFileSync(path.join(fora, 'secret.json'), '{"fora":true}');
  fs.symlinkSync(path.join(fora, 'secret.json'), path.join(font, torn(5)));
  fs.writeFileSync(path.join(fora, 'dur.json'), '{"dur":true}');
  fs.linkSync(path.join(fora, 'dur.json'), path.join(font, torn(6)));
  return {origen, font};
}

test('copiaTornsLocals: registres regulars amb 0600; salta noms aliens, directoris, symlinks i hardlinks; no trepitja el materialitzat', (t) => {
  const base = temporal(t);
  const {origen, font} = magatzemViu(base);
  const desti = path.join(base, 'preparat'), dest = path.join(desti, '.agents/runtime/turns');
  // L'arbre preparat ja porta el registre 2, versionat (històric) i materialitzat des de l'índex.
  fs.mkdirSync(dest, {recursive: true});
  fs.writeFileSync(path.join(dest, torn(2)), '{"torn":2,"on":"index"}');
  fs.chmodSync(path.join(dest, torn(2)), 0o644);

  assert.equal(copiaTornsLocals(origen, desti), 1);
  assert.deepEqual(fs.readdirSync(dest).sort(), [torn(1), torn(2)]);
  const copiat = fs.lstatSync(path.join(dest, torn(1)));
  assert.ok(copiat.isFile() && !copiat.isSymbolicLink() && copiat.nlink === 1);
  assert.equal(copiat.mode & 0o777, 0o600);
  assert.equal(fs.readFileSync(path.join(dest, torn(1)), 'utf8'), '{"torn":1}');
  assert.equal(fs.readFileSync(path.join(dest, torn(2)), 'utf8'), '{"torn":2,"on":"index"}', 'l’índex mana: el registre materialitzat no es trepitja');
  assert.equal(fs.lstatSync(path.join(dest, torn(2))).mode & 0o777, 0o644);
  // L'origen no es toca.
  assert.equal(fs.lstatSync(path.join(font, torn(1))).mode & 0o777, 0o644);
  assert.equal(fs.readFileSync(path.join(font, torn(2)), 'utf8'), '{"torn":2,"on":"disc"}');
  // Idempotent: una segona passada no copia ni trepitja res.
  assert.equal(copiaTornsLocals(origen, desti), 0);
  assert.equal(fs.readFileSync(path.join(dest, torn(2)), 'utf8'), '{"torn":2,"on":"index"}');
});

test('copiaTornsLocals: destí sense magatzem rep un directori 0700; sense magatzem d’origen no crea res', (t) => {
  const base = temporal(t);
  const {origen} = magatzemViu(base);
  const desti = path.join(base, 'preparat');
  fs.mkdirSync(desti, {mode: 0o700});
  assert.equal(copiaTornsLocals(origen, desti), 2);
  const dir = fs.lstatSync(path.join(desti, '.agents/runtime/turns'));
  assert.ok(dir.isDirectory() && !dir.isSymbolicLink());
  assert.equal(dir.mode & 0o777, 0o700);
  assert.deepEqual(fs.readdirSync(path.join(desti, '.agents/runtime/turns')).sort(), [torn(1), torn(2)]);
  for (const nom of [torn(1), torn(2)]) assert.equal(fs.lstatSync(path.join(desti, '.agents/runtime/turns', nom)).mode & 0o777, 0o600);

  const buit = path.join(base, 'sense-torns'), altre = path.join(base, 'preparat-buit');
  fs.mkdirSync(buit); fs.mkdirSync(altre);
  assert.equal(copiaTornsLocals(buit, altre), 0);
  assert.deepEqual(fs.readdirSync(altre), [], 'sense origen no es crea cap .agents a l’arbre preparat');
});

/* La crida ha d'anar després de `git read-tree` (l'arbre preparat ja ha materialitzat els registres històrics,
   que no es trepitgen) i abans de l'instantani i dels validadors, sense condició, amb l'arrel viva com a origen. */
test('verifyPreparedTree copia els torns locals entre git read-tree i snapshotPreparedFiles, sense condició', () => {
  const font = fs.readFileSync(new URL('../tooling/gates/git-staged.mjs', import.meta.url), 'utf8');
  const ast = parse(font, {ecmaVersion: 'latest', sourceType: 'module'});
  const decl = ast.body.find((n) => n.type === 'ExportNamedDeclaration' && n.declaration?.id?.name === 'verifyPreparedTree');
  assert.ok(decl, 'verifyPreparedTree exportada');
  const crides = [];
  (function recorre(node) {
    if (Array.isArray(node)) return node.forEach(recorre);
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'copiaTornsLocals') crides.push(node);
    for (const [clau, valor] of Object.entries(node)) if (clau !== 'type' && valor && typeof valor === 'object') recorre(valor);
  })(decl.declaration.body);
  assert.equal(crides.length, 1, 'una sola crida a copiaTornsLocals');
  assert.deepEqual(crides[0].arguments.map((a) => a.type === 'Identifier' ? a.name : a.type), ['PROJECT_DIR', 'dir'], 'de l’arrel viva cap a l’arbre preparat');

  const intent = decl.declaration.body.body.find((n) => n.type === 'TryStatement');
  assert.ok(intent, 'el cos de verifyPreparedTree té el try de l’arbre temporal');
  const cos = intent.block.body;
  const crida = (stmt) => stmt.type === 'ExpressionStatement' ? stmt.expression : stmt.type === 'VariableDeclaration' && stmt.declarations.length === 1 ? stmt.declarations[0].init : null;
  const nom = (stmt) => { const c = crida(stmt); return c?.type === 'CallExpression' && c.callee.type === 'Identifier' ? c.callee.name : null; };
  const readTree = cos.findIndex((stmt) => nom(stmt) === 'runChecked' && crida(stmt).arguments[1]?.type === 'ArrayExpression' && crida(stmt).arguments[1].elements[0]?.value === 'read-tree');
  const copia = cos.findIndex((stmt) => stmt.type === 'ExpressionStatement' && nom(stmt) === 'copiaTornsLocals');
  const instantani = cos.findIndex((stmt) => nom(stmt) === 'snapshotPreparedFiles');
  const validadors = cos.findIndex((stmt) => nom(stmt) === 'executaValidadors');
  assert.ok(readTree >= 0, 'git read-tree al mateix bloc');
  assert.ok(copia >= 0, 'copiaTornsLocals és una sentència directa del bloc, no dins d’una condició');
  assert.ok(instantani >= 0 && validadors >= 0);
  assert.ok(readTree < copia, 'després de git read-tree');
  assert.ok(copia < instantani && instantani < validadors, 'abans de l’instantani i dels validadors');
});

/* Runtime exclòs del Git: només l'arrel canònica buida, mai els cossos de paperera o credencials. */
function skillsDePaperera(dir) {
  fs.mkdirSync(path.join(dir, '.agents/skills'), {recursive: true});
  for (const file of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']) {
    fs.writeFileSync(path.join(dir, '.agents', file), file === 'consell.json' ? '{}' : '# fixture\n');
  }
  fs.writeFileSync(path.join(dir, 'package.json'), '{"scripts":{}}');
  for (const [id, llig] of [['core-neteja-brossa', '.agents/AGENTS.md'], ['core-restauracio-segellada', '.sdp-paperera']]) {
    const lloc = path.join(dir, '.agents/skills', id); fs.mkdirSync(lloc);
    fs.writeFileSync(path.join(lloc, 'SKILL.md'), [
      '---', `name: ${id}`, 'type: skill', 'status: canonic', 'description: Fixture de contracte runtime.',
      'triggers_on:', '  - prova', 'contracte.llig:', `  - ${llig}`, 'contracte.escriu:', '  - .sdp-paperera',
      '---', '# Runtime canònic', ''
    ].join('\n'));
  }
}

test('arbre preparat: Fronteres real passa amb la paperera canònica buida abans del primer validador, sense copiar runtime privat', t => {
  const base = temporal(t); const font = path.join(base, 'origen'); fs.mkdirSync(font);
  const origen = origenSintetic(font);
  fs.mkdirSync(path.join(font, '.sdp-paperera'));
  fs.writeFileSync(path.join(font, '.sdp-paperera', 'cos-privat.txt'), 'synthetic-private-trash');
  fs.writeFileSync(path.join(font, 'credencial-sintetica.secret'), 'synthetic-private-credential');
  const dir = path.join(base, 'preparat'); fs.mkdirSync(dir); skillsDePaperera(dir);
  const abans = auditaSkills(dir);
  assert.equal(abans.valid, false);
  assert.deepEqual(abans.noves.map(v => [v.skill, v.regla, v.detall]), [
    ['core-neteja-brossa', 'F1', 'contracte.escriu: absent .sdp-paperera'],
    ['core-restauracio-segellada', 'F1', 'contracte.llig: absent .sdp-paperera'],
    ['core-restauracio-segellada', 'F1', 'contracte.escriu: absent .sdp-paperera']
  ]);
  const crides = [];
  executaValidadors(dir, {}, {origen, run: (_cmd, args) => {
    crides.push(args.join(' '));
    const real = auditaSkills(dir);
    assert.deepEqual(real.noves, [], 'la porta real de Fronteres continua sense cap exempció');
    assert.equal(real.valid, true);
    const runtime = path.join(dir, '.sdp-paperera');
    const stat = fs.lstatSync(runtime);
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink()); assert.equal(stat.mode & 0o777, 0o700);
    assert.deepEqual(fs.readdirSync(runtime), []);
    assert.equal(fs.existsSync(path.join(dir, 'credencial-sintetica.secret')), false);
    return '';
  }});
  assert.deepEqual(crides, PASSOS_HOOK.map(p => p.args.join(' ')));
  assert.deepEqual(fs.readdirSync(dir).sort(), ['.agents', '.sdp-paperera', 'node_modules', 'package.json']);
  assert.equal(fs.readFileSync(path.join(font, '.sdp-paperera/cos-privat.txt'), 'utf8'), 'synthetic-private-trash');
  assert.equal(fs.readFileSync(path.join(font, 'credencial-sintetica.secret'), 'utf8'), 'synthetic-private-credential');
});

test('arbre preparat: una ruta arbitrària absent del contracte continua roja i no es materialitza', t => {
  const base = temporal(t); const origen = origenSintetic(base); const dir = path.join(base, 'preparat'); fs.mkdirSync(dir); skillsDePaperera(dir);
  const skill = path.join(dir, '.agents/skills/core-neteja-brossa/SKILL.md');
  fs.writeFileSync(skill, fs.readFileSync(skill, 'utf8').replace('  - .agents/AGENTS.md', '  - tooling/absent-del-contracte.mjs'));
  let resultat;
  assert.throws(() => executaValidadors(dir, {}, {origen, run: () => {
    resultat = auditaSkills(dir);
    assert.equal(resultat.valid, false);
    assert.deepEqual(resultat.noves.map(v => [v.regla, v.detall]), [['F1', 'contracte.llig: absent tooling/absent-del-contracte.mjs']]);
    throw new Error('Fronteres continua roja');
  }}), /Fronteres continua roja/);
  assert.equal(fs.existsSync(path.join(dir, 'tooling')), false);
  assert.deepEqual(fs.readdirSync(path.join(dir, '.sdp-paperera')), []);
});
