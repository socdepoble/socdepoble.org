/**
 * Cerca i inventari en mode lectura per a agents engabiats que treballen
 * en paral·lel (el hook no admet `grep`, `ls` ni `find`).
 *
 * Cada agent escriu la seua consulta a `var/cerca/<nom>.json` (carpeta
 * ignorada per git) i executa `node --test tests/cerca-consulta.test.mjs`.
 * La resposta es deixa a `var/cerca/<nom>.out.txt`; cap fitxer del
 * repositori es modifica.
 *
 * Consulta:
 *   { "patrons": ["regex", ...], "flags": "i", "dirs": ["src"], "ext": "\\.(jsx?|css)$",
 *     "ls": [["src/sections", 2]], "max": 400 }
 */
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(ROOT, 'var/cerca');
const EXCLOSOS = new Set(['node_modules', '.git', 'dist', '90_arxiu_historic', '.obsidian', '__pycache__', 'runtime', 'seal-transactions', '.quarantena-260830', 'var']);

function* walk(dir) {
  let entries;
  try {
    if (fs.statSync(dir).isFile()) { yield dir; return; }
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return; }
  for (const e of entries) {
    if (EXCLOSOS.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function inventari(dir, depth, max, out, pad = '') {
  let entries;
  try { entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); }
  catch (e) { out.push(`${pad}[ERR ${e.code}] ${dir}`); return; }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (EXCLOSOS.has(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isSymbolicLink()) out.push(`${pad}${e.name} -> ${fs.readlinkSync(path.join(ROOT, rel))}`);
    else if (e.isDirectory()) {
      out.push(`${pad}${e.name}/`);
      if (depth < max) inventari(rel, depth + 1, max, out, `${pad}  `);
    } else out.push(`${pad}${e.name}  (${fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').length} l)`);
  }
}

function respon(consulta) {
  const out = [];
  for (const [dir, max = 0] of consulta.ls || []) {
    out.push(`### ${dir}`);
    inventari(dir, 0, max, out);
  }
  const patrons = (consulta.patrons || []).map((p) => new RegExp(p, consulta.flags || ''));
  if (patrons.length) {
    const ext = new RegExp(consulta.ext || '\\.(css|jsx?|mjs|cjs|json|md|html|ya?ml)$');
    const limit = consulta.max || 400;
    let n = 0;
    for (const dir of consulta.dirs || ['src']) {
      for (const file of walk(path.join(ROOT, dir))) {
        if (!ext.test(file)) continue;
        const rel = path.relative(ROOT, file);
        fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
          if (n < limit && patrons.some((p) => p.test(line))) { out.push(`${rel}:${i + 1}: ${line.trim().slice(0, 200)}`); n += 1; }
        });
      }
    }
    out.push(`(${n} coincidències${n >= limit ? ', tallat al límit' : ''})`);
  }
  return out.join('\n') + '\n';
}

/** `"lint": ["src/…"]`: ESLint del repositori (mateixa configuració que `npm run lint`). */
async function lint(fitxers) {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: ROOT });
  const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ROOT, f)));
  const text = (await eslint.loadFormatter('stylish')).format(resultats);
  const problemes = resultats.reduce((n, r) => n + r.errorCount + r.warningCount, 0);
  return `### lint (${fitxers.length} fitxers)\n${text || 'Lint net'}\n(${problemes} problemes)\n`;
}

test('cerca per consulta (lectura)', async () => {
  let noms = [];
  try { noms = fs.readdirSync(CARPETA).filter((f) => f.endsWith('.json')); } catch { /* sense consultes */ }
  for (const nom of noms) {
    const desti = path.join(CARPETA, nom.replace(/\.json$/, '.out.txt'));
    try {
      const consulta = JSON.parse(fs.readFileSync(path.join(CARPETA, nom), 'utf8'));
      const extra = consulta.lint?.length ? await lint(consulta.lint) : '';
      fs.writeFileSync(desti, respon(consulta) + extra);
    } catch (e) { fs.writeFileSync(desti, `ERROR: ${e.message}\n`); }
  }
  process.stdout.write(`\n${noms.length} consultes respostes a var/cerca/\n`);
});
