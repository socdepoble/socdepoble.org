// Onada R32 · D-R30-15 i D-R30-16 (aprovades pel Mestre el 16-11-2026 a les 14:32).
// Registres de torn fora de Git amb inventari compacte (commit base + diferències) i lectura intacta
// dels torns antics; preferències locals d'Obsidian fora de Git amb graph.json canònic versionat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture, validDoc, writeDoc, relay, REPO } from './helpers/documental.mjs';
import { openTurn, readTurn, bindPlan, checkTurn, sealTurn, validateDocument, inventory, changes, mutateTurn,
  inventariInicial, inventariVerificat, FORMAT_INVENTARI_INICIAL, FORMAT_INVENTARI_VERIFICAT } from '../tooling/documental/turns.mjs';

const ok = () => ({ valid: true, checks: [{ name: 'fixture', exit: 0 }], errors: [] });
const ENV_GIT = { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_'))), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
function git(root, ...args) {
  const r = spawnSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
    { cwd: root, encoding: 'utf8', env: ENV_GIT });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
const escriu = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
/** Fixture documental dins d'un repositori Git amb un commit base. */
function fixtureGit(t) {
  const root = fixture(t);
  escriu(root, 'src/a.js', 'export const a = 1;\n');
  escriu(root, 'src/b.js', 'export const b = 2;\n');
  escriu(root, 'tooling/eina.mjs', 'export default 1;\n');
  escriu(root, '_wiki_de_poble/02_saber/coneixement.md', '# Coneixement\n');
  fs.symlinkSync('a.js', path.join(root, 'src/enllac.js'));
  git(root, 'init', '-q');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const registre = (root, id) => path.join(root, '.agents/runtime/turns', `${id}.json`);
const plaVinculat = (root, d) => {
  writeDoc(root, d);
  const plan = validDoc(root, { route: 'pla.implementacio', turn: d.turn, suffix: 'pla' });
  writeDoc(root, plan);
  bindPlan(root, d.turn.turn_id, plan.file);
  relay(root, d.turn.turn_id);
  return plan;
};

test('torn nou en un repositori Git: inventari compacte de pocs KB i reconstrucció exacta', t => {
  const root = fixtureGit(t);
  fs.appendFileSync(path.join(root, 'src/a.js'), '// brut abans d’obrir\n');
  fs.rmSync(path.join(root, 'src/b.js'));
  escriu(root, 'src/nou.js', 'export const nou = true;\n');
  const turn = openTurn(root, { actor: 'prova', scope: 'documents' });
  assert.equal(turn.initial.format, FORMAT_INVENTARI_INICIAL);
  assert.match(turn.initial.base, /^[0-9a-f]{40}$/);
  assert.equal(turn.initial.base, git(root, 'rev-parse', 'HEAD').trim());
  assert.deepEqual(Object.keys(turn.initial.diferencies), ['src/a.js', 'src/b.js', 'src/nou.js']);
  assert.equal(turn.initial.diferencies['src/b.js'], null);
  assert.ok(fs.statSync(registre(root, turn.turn_id)).size < 8 * 1024, 'el registre nou pesa pocs KB');
  const llegit = readTurn(root, turn.turn_id);
  assert.deepEqual(changes(inventariInicial(root, llegit), inventory(root)), []);
  assert.equal(Object.keys(inventariInicial(root, llegit)).length, turn.initial.fitxers);
});

test('sense Git (còpia aïllada o fixture) el registre conserva l’inventari complet de sempre', t => {
  const root = fixture(t);
  escriu(root, 'src/a.js', 'export const a = 1;\n');
  const turn = openTurn(root, { actor: 'prova' });
  assert.equal(Object.hasOwn(turn.initial, 'format'), false);
  assert.deepEqual(turn.initial, inventory(root));
  const llegit = readTurn(root, turn.turn_id);
  assert.equal(inventariInicial(root, llegit), llegit.initial);
});

test('una arrel que no és el nivell superior del seu repositori desa l’inventari complet', t => {
  const pare = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r32-pare-'));
  t.after(() => fs.rmSync(pare, { recursive: true, force: true }));
  escriu(pare, 'fora.txt', 'arrel del repositori\n');
  git(pare, 'init', '-q'); git(pare, 'add', '-A'); git(pare, 'commit', '-qm', 'pare');
  const root = path.join(pare, 'sub');
  fs.mkdirSync(root);
  for (const rel of ['.agents/protocolledge.json', 'tooling/wiki/schema.json']) {
    escriu(root, rel, fs.readFileSync(path.join(REPO, rel), 'utf8'));
  }
  for (const route of JSON.parse(fs.readFileSync(path.join(REPO, '.agents/protocolledge.json'), 'utf8')).rutes) {
    escriu(root, route.plantilla, fs.readFileSync(path.join(REPO, route.plantilla), 'utf8'));
  }
  const turn = openTurn(root, { actor: 'prova' });
  assert.equal(Object.hasOwn(turn.initial, 'format'), false);
  assert.deepEqual(turn.initial, inventory(root));
});

test('checkTurn i sealTurn amb inventari compacte: canvis posteriors, zona humana i segell compacte', t => {
  const root = fixtureGit(t);
  const d = validDoc(root, { scope: 'code' });
  assert.equal(d.turn.initial.format, FORMAT_INVENTARI_INICIAL);
  const plan = plaVinculat(root, d);
  // Un fitxer net del commit base que canvia després d'obrir obliga a llegir el blob de Git.
  fs.appendFileSync(path.join(root, 'src/b.js'), '// canvi del torn\n');
  const comprovat = checkTurn(root, d.turn.turn_id);
  assert.deepEqual(comprovat.errors, []);
  assert.ok(comprovat.changed.includes('src/b.js'));
  assert.ok(comprovat.changed.includes(d.file));
  // La zona humana continua vigilada amb l'inventari compacte.
  escriu(root, '_wiki_de_poble/04_escriptori/01_produccio/captura.txt', 'del Mestre\n');
  assert.match(checkTurn(root, d.turn.turn_id).errors.join('\n'), /Zona humana modificada: _wiki_de_poble\/04_escriptori\/01_produccio\/captura\.txt/);
  fs.rmSync(path.join(root, '_wiki_de_poble/04_escriptori/01_produccio'), { recursive: true });

  sealTurn(root, d.turn.turn_id, ok, { close: true });
  const segellat = inventory(root, { files: [d.file, plan.file] });
  const tancat = readTurn(root, d.turn.turn_id, { closed: true });
  assert.equal(tancat.state, 'closed');
  assert.equal(tancat.verification.inventari.format, FORMAT_INVENTARI_VERIFICAT);
  assert.equal(tancat.verification.files[d.file], segellat[d.file]);
  assert.equal(tancat.verification.files[plan.file], segellat[plan.file]);
  assert.equal(tancat.verification.files['src/b.js'], segellat['src/b.js']);
  assert.equal(Object.hasOwn(tancat.verification.files, 'src/a.js'), false, 'un fitxer sense canvis no es repetix al segell');
  assert.ok(fs.statSync(registre(root, d.turn.turn_id)).size < 16 * 1024, 'el registre tancat pesa pocs KB');
  assert.deepEqual(changes(inventariVerificat(root, tancat), segellat), []);
  // Els consumidors de verification.files (porta-documents, arxivat d'enllaços) no canvien.
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), []);
  fs.appendFileSync(path.join(root, d.file), '\nEdició posterior.\n');
  assert.match(validateDocument(root, fs.readFileSync(path.join(root, d.file), 'utf8'), d.file, { closed: true }).join(), /modificat després del tancament/);
});

test('un commit nou després d’obrir no altera l’inventari inicial del torn', t => {
  const root = fixtureGit(t);
  const turn = openTurn(root, { actor: 'prova' });
  const abans = inventory(root);
  fs.appendFileSync(path.join(root, 'src/a.js'), '// commit posterior\n');
  // També un enllaç simbòlic net en obrir que després apunta a un altre lloc: es llig el blob 120000.
  fs.rmSync(path.join(root, 'src/enllac.js'));
  fs.symlinkSync('b.js', path.join(root, 'src/enllac.js'));
  git(root, 'add', '-A'); git(root, 'commit', '-qm', 'posterior');
  assert.deepEqual(changes(inventariInicial(root, readTurn(root, turn.turn_id)), abans), []);
  assert.deepEqual(checkTurn(root, turn.turn_id).changed.filter(p => p.startsWith('src/')), ['src/a.js', 'src/enllac.js']);
});

test('els torns antics amb inventari complet es lligen, es comproven i es segellen igual', t => {
  const root = fixtureGit(t);
  const d = validDoc(root);
  // Registre llegat: `initial` és el mapa complet, com els 492 torns versionats fins a bdefec55a.
  mutateTurn(root, d.turn.turn_id, turn => { turn.initial = inventariInicial(root, turn); });
  const llegat = readTurn(root, d.turn.turn_id);
  assert.equal(Object.hasOwn(llegat.initial, 'format'), false);
  assert.equal(inventariInicial(root, llegat), llegat.initial);
  plaVinculat(root, d);
  assert.deepEqual(checkTurn(root, d.turn.turn_id).errors, []);
  sealTurn(root, d.turn.turn_id, ok, { close: true });
  const tancat = readTurn(root, d.turn.turn_id, { closed: true });
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), []);
  assert.deepEqual(changes(inventariVerificat(root, tancat), inventory(root, { files: [d.file] })), []);
  // Un segell llegat (verification.files complet, sense certificat) es retorna tal qual.
  const segellLlegat = { ...tancat, verification: { at: tancat.verification.at, files: inventory(root), checks: tancat.verification.checks } };
  assert.equal(inventariVerificat(root, segellLlegat), segellLlegat.verification.files);
});

test('l’esmena d’archive-links al segell compacte es desfà per comprovar l’empremta', t => {
  const root = fixtureGit(t);
  const d = validDoc(root);
  plaVinculat(root, d);
  sealTurn(root, d.turn.turn_id, ok, { close: true });
  const tancat = readTurn(root, d.turn.turn_id, { closed: true });
  const de = tancat.verification.files[d.file], a = 'f'.repeat(64);
  const esmenat = structuredClone(tancat);
  esmenat.verification.files[d.file] = a;
  assert.throws(() => inventariVerificat(root, esmenat), /no reconstruïble/);
  esmenat.history.push({ action: 'archive-links', at: new Date().toISOString(), file: d.file, fromHash: de, toHash: a });
  assert.equal(inventariVerificat(root, esmenat)[d.file], a);
});

test('un inventari compacte manipulat, d’un commit absent o de format desconegut falla tancat', t => {
  const root = fixtureGit(t);
  const turn = openTurn(root, { actor: 'prova' });
  const amb = canvi => { const copia = structuredClone(readTurn(root, turn.turn_id)); canvi(copia.initial); return copia; };
  assert.throws(() => inventariInicial(root, amb(i => { i.sha256 = '0'.repeat(64); })), /empremta no casa/);
  assert.throws(() => inventariInicial(root, amb(i => { i.base = 'a'.repeat(40); })), /no és llegible/);
  assert.throws(() => inventariInicial(root, amb(i => { i.base = '--output=/tmp/x'; })), /invàlid/);
  assert.throws(() => inventariInicial(root, amb(i => { i.format = 'sdp.inventari.futur.v9'; })), /invàlid/);
  assert.throws(() => inventariInicial(root, amb(i => { i.diferencies['src/a.js'] = 'no-és-un-hash'; })), /invàlid/);
  const file = registre(root, turn.turn_id);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  raw.initial.format = 'sdp.inventari.futur.v9';
  fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`);
  assert.throws(() => readTurn(root, turn.turn_id), /Inventari inicial del torn invàlid/);
});

test('les variables GIT_* d’un hook no desvien el commit base ni la reconstrucció a un altre repositori', t => {
  const root = fixtureGit(t);
  const altre = fixtureGit(t);
  // Dos fixtures fets en el mateix segon tenen el mateix commit: sense divergir, el HEAD no és cap oracle.
  escriu(altre, 'src/c.js', 'export const c = 3;\n');
  git(altre, 'add', '-A'); git(altre, 'commit', '-qm', 'altre');
  const head = git(root, 'rev-parse', 'HEAD').trim();
  assert.notEqual(git(altre, 'rev-parse', 'HEAD').trim(), head);
  const abans = process.env.GIT_DIR;
  process.env.GIT_DIR = path.join(altre, '.git');
  try {
    const turn = openTurn(root, { actor: 'prova' });
    assert.equal(turn.initial.format, FORMAT_INVENTARI_INICIAL);
    assert.equal(turn.initial.base, head);
    assert.equal(Object.hasOwn(turn.initial.diferencies, 'src/c.js'), false, "l'arbre de l'altre repositori no entra a les diferències");
    // ls-tree i cat-file del commit base també es fan al repositori de l'arrel.
    assert.deepEqual(changes(inventariInicial(root, readTurn(root, turn.turn_id)), inventory(root)), []);
  } finally { if (abans === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = abans; }
});

/* L'arxivat d'enllaços (porta-olivera --arxiva, tooling/documental/arxiu-enllacos.mjs) decidix el `relocated`
   dels torns oberts segons si el document mogut era a l'inventari inicial: amb un registre compacte ho ha de
   preguntar a inventariInicial(), no a les claus del descriptor. Rèplica de T8 d'olivera-arxiva-enllacos
   dins d'un repositori Git, on els torns nous són compactes. */
const PORTA_OLIVERA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const DESK = '_wiki_de_poble/04_escriptori';
const X = '250101_0900_prompt_consumit.md', XS = '250101_0900_prompt_consumit';
const INDEX_FM = '---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n';
const arxiva = root => spawnSync(process.execPath, [PORTA_OLIVERA, '--arxiva', '--nom', X],
  { cwd: root, env: { ...ENV_GIT, SDP_ARREL: root }, encoding: 'utf8', timeout: 60000 });

test('--arxiva amb torns compactes: els oberts que veien X (net al commit base) reben relocated i tanquen sense «Document eliminat sense relleu»', t => {
  const root = fixture(t);
  escriu(root, `${DESK}/${X}`, '# Consumit\n\n## Secció\n');
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), `${INDEX_FM}\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n`);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[t](../${DESK}/${X})\n`);
  git(root, 'init', '-q'); git(root, 'add', '-A'); git(root, 'commit', '-qm', 'base');
  const codi = openTurn(root, { actor: 'prova', scope: 'code' });
  const autor = openTurn(root, { actor: 'prova', scope: 'documents' });
  for (const turn of [codi, autor]) {
    assert.equal(turn.initial.format, FORMAT_INVENTARI_INICIAL);
    assert.equal(Object.hasOwn(turn.initial.diferencies, `${DESK}/${X}`), false, 'X és net: només la reconstrucció sap que hi era');
  }
  const r = arxiva(root);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  for (const id of [codi.turn_id, autor.turn_id]) {
    assert.ok((readTurn(root, id).relocated || []).includes(`${DESK}/${X}`), `${id}: relocated ha d'incloure ${X}`);
    const errors = checkTurn(root, id).errors;
    assert.ok(!errors.some(e => e.includes(`Document eliminat sense relleu: ${DESK}/${X}`)), `${id}: ${errors.join('\n')}`);
  }
});

test('--arxiva amb torns compactes: un obert abans que X existira no rep relocated i el seu registre no es toca; X brut en obrir sí', t => {
  const root = fixtureGit(t);
  const abans = openTurn(root, { actor: 'prova', scope: 'code' });
  assert.equal(abans.initial.format, FORMAT_INVENTARI_INICIAL);
  escriu(root, `${DESK}/${X}`, '# Consumit\n');
  fs.appendFileSync(path.join(root, DESK, '00_index_escriptori.md'), `\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n`);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[[${XS}]]\n`);
  const cru = fs.readFileSync(registre(root, abans.turn_id), 'utf8');
  const autor = openTurn(root, { actor: 'prova', scope: 'documents' });
  assert.ok(Object.hasOwn(autor.initial.diferencies, `${DESK}/${X}`), 'X sense commit: és a les diferències');
  const r = arxiva(root);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(fs.readFileSync(registre(root, abans.turn_id), 'utf8'), cru);
  assert.ok((readTurn(root, autor.turn_id).relocated || []).includes(`${DESK}/${X}`));
});

test('--arxiva amb un torn obert compacte no reconstruïble: s’atura amb exit 2, el nomena i no mou res', t => {
  const root = fixture(t);
  escriu(root, `${DESK}/${X}`, '# Consumit\n\n## Secció\n');
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), `${INDEX_FM}\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n`);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[t](../${DESK}/${X})\n`);
  git(root, 'init', '-q'); git(root, 'add', '-A'); git(root, 'commit', '-qm', 'base');
  const codi = openTurn(root, { actor: 'prova', scope: 'code' });
  openTurn(root, { actor: 'prova', scope: 'documents' });
  // Empremta falsa: el registre es llig (format vàlid), però l'inventari inicial no casa amb el commit base.
  const file = registre(root, codi.turn_id), cru = JSON.parse(fs.readFileSync(file, 'utf8'));
  cru.initial.sha256 = '0'.repeat(64);
  fs.writeFileSync(file, `${JSON.stringify(cru, null, 2)}\n`);
  const abans = fs.readFileSync(file, 'utf8'), estat = fs.readFileSync(path.join(root, '.agents/ESTAT.md'), 'utf8');
  const r = arxiva(root);
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stdout + r.stderr, new RegExp(`${codi.turn_id}: el seu inventari inicial no es pot reconstruir`));
  assert.ok(fs.existsSync(path.join(root, DESK, X)), 'X continua a l’Escriptori');
  assert.equal(fs.readFileSync(file, 'utf8'), abans);
  assert.equal(fs.readFileSync(path.join(root, '.agents/ESTAT.md'), 'utf8'), estat);
});

test('.gitignore (D-R30-15 i D-R30-16): torns i preferències locals d’Obsidian fora; contractes i graph.json dins', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r32-gitignore-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.copyFileSync(path.join(REPO, '.gitignore'), path.join(root, '.gitignore'));
  git(root, 'init', '-q');
  const ignorat = rel => spawnSync('git', ['check-ignore', '-q', '--no-index', rel], { cwd: root, env: ENV_GIT }).status === 0;
  for (const rel of ['.agents/runtime/turns/torn_00000000-0000-4000-8000-000000000000.json', '.agents/runtime/turns/torn_x.json.lock',
    '_wiki_de_poble/.obsidian/app.json', '_wiki_de_poble/.obsidian/appearance.json', '_wiki_de_poble/.obsidian/workspace.json']) {
    assert.equal(ignorat(rel), true, `${rel} ha d'estar ignorat`);
  }
  for (const rel of ['.agents/runtime/contracts/0000.json', '_wiki_de_poble/.obsidian/graph.json', '_wiki_de_poble/.obsidian/core-plugins.json',
    '_wiki_de_poble/.obsidian/community-plugins.json']) {
    assert.equal(ignorat(rel), false, `${rel} ha de continuar versionable`);
  }
});
