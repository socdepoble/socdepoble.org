import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as compiler from '../tooling/wiki/compile-wiki-to-app.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = '_wiki_de_poble/02_saber/architecture/api_port_neutral_i_allotjament_model_b.md';
const document = (title, body, extra = '') => `---\ntype: document\nvisibility: public\ntitle: ${title}\ndate: 2026-01-01T00:00:00Z\nupdated: 2026-01-02T00:00:00Z\nrevisions: 3\nmur: false\n${extra}---\n${body}`;
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3274-wiki-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (relative, text) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
  const a = '_wiki_de_poble/02_saber/architecture/a.md';
  const b = '_wiki_de_poble/03_actuar/b.md';
  put(a, document('A', '# A\n\n[[b|Anar a B]] i `[[literal]]`.\n'));
  put(b, document('B', '# B\n'));
  return { root, put, a, b };
}
function selected(...args) {
  assert.equal(typeof compiler.construeixManifestSelectiu, 'function', 'Cal la selecció canònica explícita; cap fallback complet');
  return compiler.construeixManifestSelectiu(...args);
}

test('selective public API exists alongside the existing read-only/full APIs', () => {
  for (const name of ['construeixManifestSelectiu', 'construeixManifest', 'compila', 'verificaEnllacos']) assert.equal(typeof compiler[name], 'function', name);
});
test('one selected document keeps canonical links, editorial metadata and category', t => {
  const f = fixture(t), result = selected(f.root, [f.a]);
  assert.equal(result.items.length, 1); assert.equal(result.omesos.size, 0);
  const item = result.items[0];
  assert.equal(item.id, 'a'); assert.equal(item.title, 'A');
  assert.equal(item.categoryId, 'folder:02_saber/architecture');
  assert.equal(item.date, '2026-01-01T00:00:00Z'); assert.equal(item.updated, '2026-01-02T00:00:00Z');
  assert.equal(item.revisions, 3); assert.equal(item.mur, false);
  assert.equal(item.attributes.visibility, 'public');
  assert.equal(item.content, '# A\n\n[Anar a B](?item=b) i `[[literal]]`.\n');
});
test('full generation remains exactly equal to selection of the same files and order', t => {
  const f = fixture(t);
  assert.deepEqual(selected(f.root, [f.a, f.b]), compiler.construeixManifest(f.root));
  assert.deepEqual(selected(f.root, [f.b, f.a]).items.map(x => x.id), ['b', 'a']);
});
test('selecting one body never opens other public or private bodies', t => {
  const f = fixture(t), unrelated = f.put('_wiki_de_poble/01_ser/not-selected.md', document('Other', 'SENTINEL'));
  const privateFile = f.put('_wiki_de_poble/04_escriptori/not-selected.md', 'PRIVATE_SENTINEL');
  const opened = [], realOpen = fs.openSync;
  t.mock.method(fs, 'openSync', (file, ...args) => { const absolute = typeof file === 'string' ? path.resolve(file) : ''; opened.push(absolute); assert.notEqual(absolute, unrelated); assert.notEqual(absolute, privateFile); return realOpen(file, ...args); });
  assert.equal(selected(f.root, [f.a]).items.length, 1);
  assert.deepEqual(opened, [path.join(f.root, f.a)]);
});
const invalid = [
  ['absolute', f => path.join(f.root, f.a)],
  ['traversal', () => '../outside.md'],
  ['dot component', () => '_wiki_de_poble/02_saber/./a.md'],
  ['empty component', () => '_wiki_de_poble//02_saber/a.md'],
  ['backslash', () => '_wiki_de_poble\\02_saber\\a.md'],
  ['control', () => '_wiki_de_poble/02_saber/a\u0000.md'],
  ['private tree', () => '_wiki_de_poble/04_escriptori/secret.md'],
  ['outside Wiki', () => 'src/public.md'],
];
for (const [name, value] of invalid) test('invalid selection fails before reading any body: ' + name, t => {
  const f = fixture(t); f.put('_wiki_de_poble/04_escriptori/secret.md', 'PRIVATE'); f.put('src/public.md', document('Outside', 'OUTSIDE'));
  const open = t.mock.method(fs, 'openSync', () => { throw Error('A body was read before validation'); });
  assert.throws(() => selected(f.root, [f.a, value(f)]), TypeError); assert.equal(open.mock.callCount(), 0);
});
test('empty, duplicate and non-string selections reject before reading', t => {
  const f = fixture(t), open = t.mock.method(fs, 'openSync', () => { throw Error('Unexpected read'); });
  for (const values of [[], [f.a, f.a], [f.a, null], 'a.md', null]) assert.throws(() => selected(f.root, values), TypeError);
  assert.equal(open.mock.callCount(), 0);
});
test('a selected symlink is rejected before opening its target', t => {
  const f = fixture(t), link = '_wiki_de_poble/02_saber/link.md';
  fs.symlinkSync(path.join(f.root, f.a), path.join(f.root, link));
  const open = t.mock.method(fs, 'openSync', () => { throw Error('Symlink body read'); });
  assert.throws(() => selected(f.root, [link]), TypeError); assert.equal(open.mock.callCount(), 0);
});
test('private metadata cannot become a public selected item', t => {
  const f = fixture(t), relative = '_wiki_de_poble/02_saber/private.md';
  f.put(relative, document('Private', 'PRIVATE').replace('visibility: public', 'visibility: private'));
  const result = selected(f.root, [relative]); assert.deepEqual(result.items, []); assert.deepEqual([...result.omesos], ['private']);
});
test('malformed frontmatter is omitted by the same canonical parser', t => {
  const f = fixture(t), relative = '_wiki_de_poble/02_saber/malformed.md';
  f.put(relative, '---\ntitle: Missing end\n'); assert.deepEqual(selected(f.root, [relative]).items, []);
});
test('selective and full dry read APIs never write a generated file', t => {
  const f = fixture(t), write = t.mock.method(fs, 'writeFileSync', () => { throw Error('Unexpected generation'); });
  selected(f.root, [f.a]); compiler.construeixManifest(f.root); compiler.compila({ root: f.root, write: false });
  assert.equal(write.mock.callCount(), 0); assert.equal(fs.existsSync(path.join(f.root, compiler.OUT_REL)), false);
});
test('the actual Model B entry equals its one-item canonical production source', async () => {
  const result = selected(repo, [source]);
  assert.equal(result.items.length, 1); assert.equal(result.omesos.size, 0);
  const { wikiManifest } = await import(pathToFileURL(path.join(repo, 'src/data/wikiManifest.js')).href);
  assert.deepEqual(wikiManifest.items.find(x => x.id === 'api_port_neutral_i_allotjament_model_b'), result.items[0]);
  const text = result.items[0].content.replaceAll('**', '');
  for (const phrase of ['67 capacitats atòmiques opcionals', '190 mètodes en total', '253 casos sobre 190 mètodes']) assert.ok(text.includes(phrase), phrase);
});
