/**
 * Cerca de text en mode lectura, per a agents engabiats (sense grep).
 * Edita PATRONS i DIRS, executa `node --test tests/cerca-sessio.test.mjs`.
 * No escriu res.
 */
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLOSOS = new Set(['node_modules', '.git', 'dist', '90_arxiu_historic', '.obsidian', '__pycache__', 'runtime', 'seal-transactions', '.quarantena-260830']);

const PATRONS = [
  /sdp-bloc\b/,
  /app-grid-column--left/,
  /app-grid-bg-esquerra/,
  /sdp-wiki-workspace/,
  /sdp-cataleg\b/,
  /sdp-workspace-nav-item\[aria-current/,
  /aria-current="page"\]/,
  /sdp-workspace-detail--editor/,
  /btn-publish|EDITAR|Editar/,
  /copyright/i,
  /sdp-pedra-600/,
];
const DIRS = ['src/css', 'src/components/universal', 'src/components/layout', 'src/sections/notes', 'src/sections/wiki-de-poble', 'src/sections/disseny'];
const EXT = /\.(css|jsx?|mjs)$/;

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (EXCLOSOS.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (EXT.test(e.name)) yield full;
  }
}

test('cerca de sessió (lectura)', () => {
  const out = [];
  for (const dir of DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, file);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const p of PATRONS) if (p.test(line)) { out.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`); break; }
      });
    }
  }
  process.stdout.write(`\n${out.join('\n')}\n(${out.length} coincidències)\n`);
});
