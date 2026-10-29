import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const content = body => `---\ntype: document\nstatus: canonic\ndescription: Fixture de consulta de backlinks sense modificació.\ntags: [govern]\n---\n# Prova\n\n${body}\n\n## Vincles\n`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-backlinks-qa-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, body] of Object.entries({
    '01_ser/font.md': '[[desti]]', '02_saber/desti.md': 'Document de destí.',
    '90_arxiu_historic/arxiu.md': '[[desti]]',
    '04_escriptori/01_produccio/huma.md': '[[desti]]',
    '04_escriptori/02_investigacio_ia/recerca.md': '[[desti]]'
  })) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content(body));
  }
  return root;
}
function snapshot(root, prefix = '') {
  const found = {};
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(found, snapshot(root, rel));
    else found[rel] = createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
  }
  return found;
}
const run = (script, args, cwd) => spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
  cwd, encoding: 'utf8', timeout: 10000
});

test('el teixidor antic sense dry-run falla abans de modificar cap document', t => {
  const root = fixture(t), before = snapshot(root);
  const child = run('scripts/teixidor-backlinks.mjs', [`--dir=${root}`], os.tmpdir());
  assert.equal(child.error, undefined);
  assert.equal(child.status, 2, child.stderr);
  assert.match(child.stderr, /ESCRIPTURA RETIRADA/u);
  assert.equal(child.stdout, '');
  assert.deepEqual(snapshot(root), before);
});

test('dry-run conserva hashes i exclou arxiu i zones protegides de cerca i cens', t => {
  const root = fixture(t), before = snapshot(root);
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${root}`], os.tmpdir());
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Trobats 2 fitxers markdown/u);
  assert.match(child.stdout, /DRY-RUN/u);
  assert.doesNotMatch(child.stdout, /arxiu\.md|huma\.md|recerca\.md/u);
  assert.deepEqual(snapshot(root), before);
});

test('l enllaçador existent ja rebutja write i no necessita retirar la consulta', t => {
  const root = fixture(t), before = snapshot(root);
  const child = run('scripts/enllacat-intelligent-wiki.mjs', ['--write', `--root=${root}`], os.tmpdir());
  assert.equal(child.error, undefined);
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /--write retirat/u);
  assert.deepEqual(snapshot(root), before);
});

test('el bloqueig per defecte precedix fins i tot la lectura d un directori absent', t => {
  const root = fixture(t);
  const child = run('scripts/teixidor-backlinks.mjs', [`--dir=${path.join(root, 'absent')}`], os.tmpdir());
  assert.equal(child.status, 2);
  assert.match(child.stderr, /ESCRIPTURA RETIRADA/u);
  assert.doesNotMatch(child.stderr, /Directori no trobat/u);
});

test('enllaços explícits no incorporen documents externs ni de zones protegides', t => {
  const root = fixture(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-backlinks-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const external = path.join(outside, 'extern.md');
  fs.writeFileSync(external, content('Document sintètic alié al corpus seleccionat.'));
  const source = path.join(root, '01_ser/font.md');
  fs.writeFileSync(source, content(`[[desti]]\n[[${path.relative(path.dirname(source), external).replace(/\.md$/, '')}]]\n[[../04_escriptori/01_produccio/huma]]`));
  const before = snapshot(root), externalBefore = fs.readFileSync(external, 'utf8');
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${root}`], os.tmpdir());
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Mapa de 1 destins amb backlinks/u);
  assert.doesNotMatch(child.stdout, /Modificaria: .*extern|Modificaria: .*huma/u);
  assert.deepEqual(snapshot(root), before);
  assert.equal(fs.readFileSync(external, 'utf8'), externalBefore);
});


test('opcions ambigües o mutatives no consulten ni escriuen el corpus, encara que porten dry-run', t => {
  const root = fixture(t), before = snapshot(root);
  for (const args of [
    ['--dry-run', '--write', `--dir=${root}`],
    ['--dry-run', '--dry-run', `--dir=${root}`],
    ['--dry-run', `--dir=${root}`, '--dir=/no-ha-de-llegir'],
    ['--dry-run', '--dir='],
    ['--dry-run', '--desconeguda', `--dir=${root}`]
  ]) {
    const child = run('scripts/teixidor-backlinks.mjs', args, os.tmpdir());
    assert.equal(child.status, 2, JSON.stringify({ args, stdout: child.stdout, stderr: child.stderr }));
    assert.equal(child.stdout, '');
  }
  assert.deepEqual(snapshot(root), before);
});

test('dir amb signe igual es conserva sencer', t => {
  const parent = fixture(t);
  const root = path.join(parent, 'corpus=prova');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'font.md'), content('[[desti]]'));
  fs.writeFileSync(path.join(root, 'desti.md'), content('Destí'));
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${root}`], os.tmpdir());
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Trobats 2 fitxers markdown/u);
});

test('un directori protegit no es pot seleccionar directament com a corpus', t => {
  const root = fixture(t), before = snapshot(root);
  for (const rel of ['90_arxiu_historic', '04_escriptori/01_produccio', '04_escriptori/02_investigacio_ia']) {
    const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${path.join(root, rel)}`], os.tmpdir());
    assert.equal(child.status, 2, JSON.stringify({ rel, stdout: child.stdout, stderr: child.stderr }));
    assert.equal(child.stdout, '');
  }
  assert.deepEqual(snapshot(root), before);
});

test('directoris simbòlics no amplien el corpus i no poden ser la seua arrel', t => {
  const root = fixture(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-backlinks-symlink-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'privat.md'), content('[[desti]]'));
  fs.symlinkSync(outside, path.join(root, 'alias'), 'dir');
  fs.symlinkSync(path.join(outside, 'privat.md'), path.join(root, 'alias.md'));
  const before = fs.readFileSync(path.join(outside, 'privat.md'), 'utf8');
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${root}`], os.tmpdir());
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Trobats 2 fitxers markdown/u);
  const aliased = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${path.join(root, 'alias')}`], os.tmpdir());
  assert.equal(aliased.status, 2, aliased.stderr);
  assert.equal(aliased.stdout, '');
  assert.equal(fs.readFileSync(path.join(outside, 'privat.md'), 'utf8'), before);
});

test('els noms iguals es resolen per directori font, sense reutilitzar una altra destinació local', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '01_ser/desti.md'), content('Destí de ser'));
  fs.writeFileSync(path.join(root, '02_saber/font.md'), content('[[desti]]'));
  const before = snapshot(root);
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${root}`], os.tmpdir());
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Mapa de 2 destins amb backlinks/u);
  assert.match(child.stdout, /Modificaria: 01_ser\/desti\.md/u);
  assert.match(child.stdout, /Modificaria: 02_saber\/desti\.md/u);
  assert.deepEqual(snapshot(root), before);
});


test('un ancestre simbòlic tampoc permet seleccionar una arrel protegida amb un nom alié', t => {
  const root = fixture(t);
  const protegit = path.join(root, '04_escriptori/01_produccio/subcorpus');
  fs.mkdirSync(protegit);
  fs.writeFileSync(path.join(protegit, 'pendent.md'), content('Document protegit sintètic.'));
  const abans = fs.readFileSync(path.join(protegit, 'pendent.md'), 'utf8');
  fs.symlinkSync(path.dirname(protegit), path.join(root, 'alias-protegit'), 'dir');
  const child = run('scripts/teixidor-backlinks.mjs', ['--dry-run', `--dir=${path.join(root, 'alias-protegit/subcorpus')}`], os.tmpdir());
  assert.equal(child.status, 2, child.stderr);
  assert.equal(child.stdout, '');
  assert.equal(fs.readFileSync(path.join(protegit, 'pendent.md'), 'utf8'), abans);
});
