import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { escriuGenerat } from '../tooling/scripts/canonada.mjs';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-generated-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
test('canonada genera atòmicament i no toca mtime quan contingut és igual', (t) => {
  const root = fixture(t), rel = 'src/data/wikiManifest.js';
  assert.equal(escriuGenerat(root, rel, 'export const wikiManifest = {};\n'), true);
  const file = path.join(root, rel), before = fs.statSync(file).mtimeMs;
  assert.equal(escriuGenerat(root, rel, 'export const wikiManifest = {};\n'), false);
  assert.equal(fs.statSync(file).mtimeMs, before);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['wikiManifest.js']);
  assert.equal(escriuGenerat(root, rel, 'export const wikiManifest = {items: []};\n'), true);
});
test('canonada rebutja qualsevol destí alié a la llista exacta abans d’escriure', (t) => {
  const root = fixture(t);
  for (const rel of ['.agents/ESTAT.md', '../escape.js', 'src/app/App.jsx', 'public/../src/data/wikiManifest.js']) {
    assert.throws(() => escriuGenerat(root, rel, 'canvi'), /no admés/);
  }
  assert.deepEqual(fs.readdirSync(root), []);
});
test('canonada rebutja symlink/hardlink de fitxer i symlink d’ancestre', (t) => {
  const root = fixture(t), external = path.join(root, 'external'); fs.mkdirSync(external);
  const original = path.join(external, 'original'); fs.writeFileSync(original, 'original');
  const pub = path.join(root, 'public'); fs.symlinkSync(external, pub);
  assert.throws(() => escriuGenerat(root, 'public/slugIndex.json', 'canvi'), /confinat/);
  fs.unlinkSync(pub); fs.mkdirSync(pub);
  const target = path.join(pub, 'slugIndex.json');
  fs.symlinkSync(original, target);
  assert.throws(() => escriuGenerat(root, 'public/slugIndex.json', 'canvi'), /regular/);
  fs.unlinkSync(target); fs.linkSync(original, target);
  assert.throws(() => escriuGenerat(root, 'public/slugIndex.json', 'canvi'), /hardlink/);
  fs.unlinkSync(target); fs.symlinkSync(path.join(root, 'missing'), target);
  assert.throws(() => escriuGenerat(root, 'public/slugIndex.json', 'canvi'), /symlink/);
  assert.equal(fs.readFileSync(original, 'utf8'), 'original');
  assert.deepEqual(fs.readdirSync(pub), ['slugIndex.json']);
});
