/**
 * Porta de frontmatter en mode lectura, per a agents engabiats (el hook local
 * no admet `node tooling/wiki/tractor-frontmatter.mjs`). Executa el tractor
 * real amb --json i falla si algun document de la Wiki modificat respecte de
 * HEAD té deute propi: és la mateixa zero tolerància que aplica el tractor
 * als fitxers tocats, però restringida al corpus viu. No escriu res.
 *
 * Ús:  node --test tests/frontmatter-sessio.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = /^_wiki_de_poble\/(?:00_index\.md|0[123]_[^/]+\/.+\.md)$/;

function modificats() {
  const noms = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  return noms.split('\n').filter((nom) => CORPUS.test(nom));
}

function informe() {
  try {
    return execFileSync(process.execPath, ['tooling/wiki/tractor-frontmatter.mjs', '--json'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // Amb deute el tractor ix amb 1, però el JSON ja és a stdout.
    if (error.stdout) return error.stdout;
    throw error;
  }
}

test('frontmatter dels documents de la Wiki modificats (lectura)', () => {
  const objectius = new Set(modificats());
  const text = informe();
  const dades = JSON.parse(text.slice(text.indexOf('{')));
  const trobades = [];
  for (const [llei, items] of Object.entries(dades.fallades)) {
    for (const item of items) {
      if (objectius.has(item.n)) trobades.push(`${item.n} · ${llei} · ${item.clau ?? ''} ${item.detall ?? item.valor ?? ''}`.trim());
    }
  }
  process.stdout.write(`${objectius.size} documents modificats revisats\n${trobades.join('\n') || '✅ Cap deute als documents modificats'}\n`);
  assert.equal(trobades.length, 0, `${trobades.length} fallades de frontmatter`);
});
