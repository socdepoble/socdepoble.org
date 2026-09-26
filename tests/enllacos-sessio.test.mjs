/**
 * Enllaços perduts en mode lectura, per a agents engabiats (el hook local no
 * admet `git diff` amb rutes ni `git show`). Per a cada document de la Wiki
 * modificat respecte de HEAD, resol els enllaços de la versió de HEAD i de la
 * d'ara amb el mateix resolutor de les portes del graf (tooling/wiki/core/
 * parse.mjs) i falla si alguna nota a què s'arribava ja no s'hi arriba.
 * Els enllaços que ja no resolien a HEAD es llisten però no fan fallar: no
 * sostenien cap aresta del graf. No escriu res.
 *
 * Ús:  node --test tests/enllacos-sessio.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../tooling/wiki/lib/frontmatter.mjs';
import { buildResolver, extractLinks, resolveLink } from '../tooling/wiki/core/parse.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = /^_wiki_de_poble\/(?:00_index\.md|0[123]_[^/]+\/.+\.md)$/;
const FORA = /(?:^|\/)(?:node_modules|90_arxiu_historic|\.quarantena-[^/]*)\//;
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const doc = (relPath, content) => ({ relPath, base: path.posix.basename(relPath, '.md'), content });

function univers() {
  return git('ls-files', '-co', '--exclude-standard', '--', '*.md')
    .split('\n').filter((rel) => rel && !FORA.test(rel) && fs.existsSync(path.join(ROOT, rel)))
    .map((rel) => doc(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')));
}

function destins(font, resolver) {
  const resolts = new Set();
  const trencats = new Set();
  for (const enllac of extractLinks(parseFrontmatter(font.content).body)) {
    const r = resolveLink(enllac, font, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== font.relPath) resolts.add(r.doc.relPath);
    else if (r.status === 'unresolved' || r.status === 'ambiguous') trencats.add(enllac.target);
  }
  return { resolts, trencats };
}

test('cap document de la Wiki modificat perd una nota a què arribava (lectura)', () => {
  const modificats = git('diff', '--name-only', 'HEAD').split('\n').filter((nom) => CORPUS.test(nom));
  const docs = univers();
  const resolver = buildResolver(docs);
  const perduts = [];
  const retirats = [];
  for (const rel of modificats) {
    const ara = docs.find((d) => d.relPath === rel);
    if (!ara) continue;
    const abans = destins(doc(rel, git('show', `HEAD:${rel}`)), resolver);
    const despres = destins(ara, resolver);
    for (const desti of abans.resolts) if (!despres.resolts.has(desti)) perduts.push(`${rel} → ${desti}`);
    for (const t of abans.trencats) retirats.push(`${rel} · ${t}`);
  }
  process.stdout.write(`${modificats.length} documents comparats amb HEAD\n`);
  if (retirats.length) process.stdout.write(`Enllaços que ja no resolien a HEAD (informatiu):\n  ${retirats.join('\n  ')}\n`);
  process.stdout.write(`${perduts.length ? `PERDUTS:\n  ${perduts.join('\n  ')}` : '✅ Cap nota abastable perduda'}\n`);
  assert.equal(perduts.length, 0, `${perduts.length} enllaços perduts`);
});
