/**
 * Inventari de directoris en mode lectura, per a agents engabiats.
 *
 * El hook local (tooling/gates/hooks-local.mjs) no admet `ls`, `find` ni
 * `grep`, i l'arnés de Claude no oferix Glob. L'única forma acreditada de
 * veure un arbre és `node --test tests/<fitxer>.test.mjs`. Esta prova no
 * escriu res: recorre els directoris de TARGETS i els imprimix per stdout.
 *
 * Ús:  node --test tests/inventari-directoris.test.mjs
 */
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** [directori, profunditat màxima, prefixos a ometre] */
const TARGETS = [
  ['tooling/brain', 3, []],
  ['tooling', 0, []],
  ['tooling/gates', 0, []],
  ['tooling/wiki', 1, []],
  ['tooling/session', 1, []],
  ['tooling/documental', 0, []],
  ['tooling/lib', 0, []],
  ['tooling/scripts', 0, []],
  ['tooling/vite', 0, []],
  ['tooling/pdf', 0, []],
  ['scripts', 0, []],
  ['tests', 0, []],
  ['.agents', 1, ['.agents/runtime', '.agents/seal-transactions']],
  ['.agents/skills', 2, []],
  ['.claude', 2, []],
  ['.husky', 0, []],
  ['.immunitari', 0, []],
  ['_wiki_de_poble', 0, []],
  ['_wiki_de_poble/10_actes', 0, []],
  ['_wiki_de_poble/04_escriptori', 3, ['_wiki_de_poble/04_escriptori/01_produccio']],
  ['_wiki_de_poble/90_arxiu_historic', 1, []],
  ['_wiki_de_poble/03_actuar', 2, []],
  ['_wiki_de_poble/02_saber', 1, []],
  ['_wiki_de_poble/01_ser', 0, []],
  ['src', 0, []],
  ['src/app', 0, []],
  ['src/sections', 2, []],
  ['src/components', 0, []],
  ['src/components/layout', 0, []],
  ['src/components/universal', 1, []],
  ['src/css', 0, []],
  ['src/config', 0, []],
  ['src/data', 0, []],
  ['src/context', 0, []],
  ['src/hooks', 0, []],
];

function countLines(file) {
  try { return String(fs.readFileSync(file, 'utf8').split('\n').length); } catch { return '?'; }
}

function walk(dir, depth, maxDepth, skip) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); }
  catch (e) { return [`${'  '.repeat(depth)}[ERR ${e.code}] ${dir}`]; }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (skip.some((s) => rel.startsWith(s))) continue;
    const pad = '  '.repeat(depth);
    if (e.isSymbolicLink()) {
      let target = '?';
      try { target = fs.readlinkSync(path.join(ROOT, rel)); } catch { /* sense destí */ }
      out.push(`${pad}${e.name} -> ${target}`);
    } else if (e.isDirectory()) {
      out.push(`${pad}${e.name}/`);
      if (depth < maxDepth) out.push(...walk(rel, depth + 1, maxDepth, skip));
    } else {
      out.push(`${pad}${e.name}  (${countLines(path.join(ROOT, rel))} l)`);
    }
  }
  return out;
}

test('inventari de directoris (lectura)', () => {
  const chunks = [];
  for (const [dir, depth, skip] of TARGETS) {
    chunks.push(`\n### ${dir}`);
    chunks.push(...walk(dir, 0, depth, skip));
  }
  process.stdout.write(chunks.join('\n') + '\n');
});
