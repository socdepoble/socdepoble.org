/* P0-22 (B1.3, marató 261101) · Porta Reflex a l'arbre preparat del pre-commit.
   Abans, `doctor --ci` comparava amb HEAD (`git status`) també dins de l'arbre temporal del hook:
   tot commit que tocara AGENTS.md, tooling/ crític o el corpus de la Wiki queia per «canvis durables»
   (i, sense actualitzar el lock, per «baseline divergent»). Ara, només allí, certifica l'índex. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {esArbrePreparat} from '../tooling/wiki/reflex_petorreta.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REFLEX = path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs');
const TMP = fs.realpathSync(os.tmpdir());
const DURABLES = /canvis durables/;
const DIVERGENT = /baseline divergent/;

/* Entorn net: sense GIT_*, SDP_PRE_COMMIT ni SDP_ARREL heretats (un hook pare els exporta) ni configuració global. */
function entorn(extra = {}) {
  const env = {...process.env};
  for (const k of Object.keys(env)) if (k.startsWith('GIT_') || k === 'SDP_PRE_COMMIT' || k === 'SDP_ARREL') delete env[k];
  return {...env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', ...extra};
}
function bo(cmd, args, cwd, env = entorn()) {
  const r = spawnSync(cmd, args, {cwd, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  assert.equal(r.status, 0, `${cmd} ${args.join(' ')}\n${r.stderr}${r.stdout}`);
  return r.stdout;
}
function escriu(root, rel, text) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), {recursive: true});
  fs.writeFileSync(path.join(root, rel), text);
}
function temporal(t, prefix) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(TMP, prefix)));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  return dir;
}
/* Un Mas mínim amb marcador d'arrel, regles i un corpus de Wiki amb el seu lock. No cal que el
   doctor isca verd sencer (falten fitxers crítics): la prova mira només les dues troballes del defecte. */
function mas(t) {
  const root = temporal(t, 'sdp doctor ');
  escriu(root, '.agents/AGENTS.md', '# Regles\n');
  escriu(root, '.agents/PROTOCOL_PETORRETA.md', '# Protocol\n');
  escriu(root, 'AGENTS.md', '# Agents\n');
  escriu(root, '.gitignore', '.sdp-reflex/\nnode_modules\n');
  escriu(root, '_wiki_de_poble/02_saber/nota.md', '# Nota\n\nPrimera versió.\n');
  fs.mkdirSync(path.join(root, '_wiki_de_poble/.obsidian'), {recursive: true});
  fs.copyFileSync(path.join(REPO, '_wiki_de_poble/.obsidian/graph.json'), path.join(root, '_wiki_de_poble/.obsidian/graph.json'));
  const env = entorn({SDP_ARREL: root});
  const lock = () => escriu(root, 'tooling/wiki/wiki-baseline.lock.json', bo(process.execPath, [REFLEX, 'baseline'], root, env));
  lock();
  bo('git', ['init', '--quiet'], root);
  bo('git', ['config', 'user.name', 'Fixture'], root);
  bo('git', ['config', 'user.email', 'fixture@example.invalid'], root);
  bo('git', ['add', '.'], root);
  bo('git', ['commit', '--quiet', '-m', 'fixture'], root);
  return {root, lock, env};
}
/* Materialitza l'índex com git-staged.mjs: arrel privada «sdp-index-*» al temporal, Git amb
   alternates cap als objectes de l'origen, HEAD = HEAD previ i índex = arbre preparat. */
function arbrePreparat(t, root) {
  const dir = temporal(t, 'sdp-index-');
  fs.chmodSync(dir, 0o700);
  bo('git', ['checkout-index', '--all', `--prefix=${dir}/`], root);
  const tree = bo('git', ['write-tree'], root).trim();
  const head = bo('git', ['rev-parse', 'HEAD'], root).trim();
  bo('git', ['init', '--quiet'], dir);
  fs.writeFileSync(path.join(dir, '.git/objects/info/alternates'), `${path.join(root, '.git/objects')}\n`);
  bo('git', ['update-ref', 'HEAD', head], dir);
  bo('git', ['read-tree', tree], dir);
  return dir;
}
function doctor(arrel, extra = {}) {
  const r = spawnSync(process.execPath, [REFLEX, 'doctor', '--ci', '--json'], {cwd: arrel, env: entorn({SDP_ARREL: arrel, ...extra}), encoding: 'utf8'});
  assert.ok(r.stdout.trim().startsWith('{'), r.stderr + r.stdout);
  return JSON.parse(r.stdout).findings.join('\n');
}
/* canvisDurables s'executa contra l'arrel del procés (PROJECT_DIR): un fill amb SDP_ARREL. */
function canvis(root, paths, preparat) {
  const codi = `const m = await import(${JSON.stringify(pathToFileURL(REFLEX).href)});
process.stdout.write(JSON.stringify(await m.canvisDurables(${JSON.stringify(paths)}, { preparat: ${preparat} })));`;
  return JSON.parse(bo(process.execPath, ['--input-type=module', '-e', codi], root, entorn({SDP_ARREL: root})));
}

test('canvisDurables: a l’arbre preparat certifica l’índex; fora, HEAD com sempre', (t) => {
  const {root} = mas(t);
  assert.equal(canvis(root, ['AGENTS.md'], true), '');
  assert.equal(canvis(root, ['AGENTS.md'], false), '');
  assert.equal(canvis(root, [], false), '', 'sense camins durables no es pregunta a Git');
  // Canvi preparat: és el que es comitarà.
  escriu(root, 'AGENTS.md', '# Agents\n\nCanvi preparat.\n');
  bo('git', ['add', 'AGENTS.md'], root);
  assert.equal(canvis(root, ['AGENTS.md'], true), '');
  assert.match(canvis(root, ['AGENTS.md'], false), /AGENTS\.md/);
  // Canvi no preparat damunt: cap dels dos modes el certifica.
  escriu(root, 'AGENTS.md', '# Agents\n\nCanvi sense preparar.\n');
  assert.match(canvis(root, ['AGENTS.md'], true), /AGENTS\.md/);
  assert.match(canvis(root, ['AGENTS.md'], false), /AGENTS\.md/);
  // Fitxer durable nou sense versionar: tampoc.
  escriu(root, 'tooling/wiki/nou.mjs', 'export {};\n');
  assert.match(canvis(root, ['tooling/wiki/nou.mjs'], true), /tooling\/wiki\/nou\.mjs/);
  assert.match(canvis(root, ['tooling/wiki/nou.mjs'], false), /tooling\/wiki\/nou\.mjs/);
});

test('esArbrePreparat: cal l’entorn del hook i l’arrel temporal privada que crea git-staged', (t) => {
  const bona = temporal(t, 'sdp-index-');
  fs.chmodSync(bona, 0o700);
  assert.equal(esArbrePreparat(bona, {SDP_PRE_COMMIT: '1'}), true);
  assert.equal(esArbrePreparat(bona, {}), false, 'sense SDP_PRE_COMMIT');
  assert.equal(esArbrePreparat(bona, {SDP_PRE_COMMIT: 'true'}), false, 'només el valor exacte del hook');
  // Exportar la variable a mà a l'arbre viu no el convertix en arbre preparat. L'arbre viu és una fixture:
  // REPO no servix, perquè dins del hook la mateixa prova corre en un sdp-index-* (correcció L09-ARB-03).
  const viu = path.join(temporal(t, 'sdp viu '), 'socdepoble.org');
  fs.mkdirSync(viu, {mode: 0o700});
  assert.equal(esArbrePreparat(viu, {SDP_PRE_COMMIT: '1'}), false, 'l’arbre viu');
  const altre = temporal(t, 'sdp-altre-');
  fs.chmodSync(altre, 0o700);
  assert.equal(esArbrePreparat(altre, {SDP_PRE_COMMIT: '1'}), false, 'nom sense prefix sdp-index-');
  const nia = path.join(altre, 'sdp-index-nia');
  fs.mkdirSync(nia, {mode: 0o700});
  assert.equal(esArbrePreparat(nia, {SDP_PRE_COMMIT: '1'}), false, 'no és fill directe del temporal');
  const oberta = temporal(t, 'sdp-index-');
  fs.chmodSync(oberta, 0o755);
  assert.equal(esArbrePreparat(oberta, {SDP_PRE_COMMIT: '1'}), false, 'permisos no privats');
  assert.equal(esArbrePreparat(path.join(TMP, 'sdp-index-no-existix-261101'), {SDP_PRE_COMMIT: '1'}), false, 'arrel absent');
});

test('doctor --ci a l’arbre preparat accepta un commit que toca AGENTS.md i el corpus amb el lock al dia', (t) => {
  const {root, lock} = mas(t);
  escriu(root, 'AGENTS.md', '# Agents\n\nRegla nova del commit.\n');
  escriu(root, '_wiki_de_poble/02_saber/nota.md', '# Nota\n\nSegona versió.\n');
  lock();
  bo('git', ['add', 'AGENTS.md', '_wiki_de_poble/02_saber/nota.md', 'tooling/wiki/wiki-baseline.lock.json'], root);
  const dir = arbrePreparat(t, root);

  const dins = doctor(dir, {SDP_PRE_COMMIT: '1'});
  assert.doesNotMatch(dins, DURABLES, dins);
  assert.doesNotMatch(dins, DIVERGENT, dins);
  // El mateix arbre sense l'entorn del hook continua estricte: compara amb HEAD.
  assert.match(doctor(dir), /canvis durables pendents[^\n]*no certifica bytes fora de HEAD/);
  // Exportar SDP_PRE_COMMIT a l'arbre viu no certifica bytes preparats.
  assert.match(doctor(root, {SDP_PRE_COMMIT: '1'}), /canvis durables pendents/);
  // Un byte fora de l'índex dins de l'arbre preparat torna a fer caure la porta.
  fs.appendFileSync(path.join(dir, 'AGENTS.md'), 'Canvi que no es comitarà.\n');
  assert.match(doctor(dir, {SDP_PRE_COMMIT: '1'}), /canvis durables fora de l’índex/);
});

test('doctor --ci a l’arbre preparat continua caient si el lock no acompanya el corpus', (t) => {
  const {root} = mas(t);
  escriu(root, '_wiki_de_poble/02_saber/nota.md', '# Nota\n\nSense recalcular el lock.\n');
  bo('git', ['add', '_wiki_de_poble/02_saber/nota.md'], root);
  const dins = doctor(arbrePreparat(t, root), {SDP_PRE_COMMIT: '1'});
  assert.match(dins, DIVERGENT, dins);
  assert.doesNotMatch(dins, DURABLES, dins);
});
