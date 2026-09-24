/**
 * Tractor d'orfes de `tooling/brain/`.
 *
 * Per a cada script del cervell, busca qui l'anomena a tot el repositori
 * (package.json, hooks, husky, cron, Makefile, altres scripts, skills, Wiki).
 * Un script que només s'anomena a si mateix, o que només l'anomena
 * `90_arxiu_historic/`, és un orfe.
 *
 * Mode informe: imprimix el mapa de referències per stdout.
 * Mode porta:   falla si apareix un orfe que no siga a PERMESOS.
 *
 * Ús:  node --test tests/tractor-orfes-brain.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = 'tooling/brain';
const EXCLOSOS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '90_arxiu_historic', '.obsidian',
  '__pycache__', '.quarantena-260830', '.vite', 'runtime', 'seal-transactions', '.brain-reports', '.sdp-paperera']);
const EXTENSIONS_TEXT = new Set(['.mjs', '.js', '.cjs', '.jsx', '.ts', '.json', '.md', '.sh', '.py', '.txt', '.yaml', '.yml', '.toml', '.cfg', '.ini', '.html', '.css', '']);

/** Orfes acceptats: viuen per un cridador que este mapa no compta com a executor. */
const PERMESOS = new Set([
  'tooling/brain/farcell.mjs' // el crida crear_bundle.mjs (dins de brain), que mana AGENTS.md §6
]);

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (EXCLOSOS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && EXTENSIONS_TEXT.has(path.extname(e.name))) yield full;
  }
}

function inventariBrain() {
  const out = [];
  for (const file of walk(path.join(ROOT, BRAIN))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (/\.(mjs|js|cjs|py|sh)$/.test(rel)) out.push(rel);
  }
  return out.sort();
}

export function mapaReferencies(root = ROOT) {
  const scripts = inventariBrain();
  const noms = scripts.map((rel) => ({ rel, base: path.basename(rel), sense: path.basename(rel).replace(/\.[^.]+$/, '') }));
  const refs = Object.fromEntries(scripts.map((s) => [s, []]));
  for (const file of walk(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const { rel: script, base } of noms) {
      if (rel === script) continue;
      if (text.includes(base)) refs[script].push(rel);
    }
  }
  return { scripts, refs };
}

function classifica(refs) {
  const dinsBrain = refs.filter((r) => r.startsWith(`${BRAIN}/`));
  const executors = refs.filter((r) => /^(package\.json|\.husky\/|\.claude\/settings|\.agents\/hooks|\.agents\/cron\/|tooling\/gates\/run-portes|tooling\/wiki\/Makefile|scripts\/|tooling\/brain\/maintain\.sh|\.github\/)/.test(r));
  const codi = refs.filter((r) => /\.(mjs|js|cjs|py|sh)$/.test(r) && !r.startsWith(`${BRAIN}/`));
  // Una skill o la Constitució que manen executar un script el mantenen viu
  // encara que cap pipeline el cride: és una eina de la persona o de l'agent.
  const normatius = refs.filter((r) => /^(\.agents\/skills\/[^/]+\/SKILL\.md|AGENTS\.md|CLAUDE\.md)$/.test(r));
  const docs = refs.filter((r) => /\.(md|txt)$/.test(r) && !normatius.includes(r));
  return { dinsBrain, executors, codi, normatius, docs };
}

test('mapa de referències de tooling/brain', () => {
  const { scripts, refs } = mapaReferencies();
  const files = [];
  const orfes = [];
  for (const script of scripts) {
    const c = classifica(refs[script]);
    const viu = c.executors.length || c.codi.length || c.normatius.length;
    const nomes = c.dinsBrain.length && !viu ? 'només dins de brain' : '';
    const linia = `${viu ? '●' : c.docs.length ? '◐' : '○'} ${script}\n    executors: ${c.executors.join(', ') || '—'}\n    codi: ${c.codi.join(', ') || '—'}\n    normatius: ${c.normatius.join(', ') || '—'}\n    brain: ${c.dinsBrain.join(', ') || '—'}\n    docs: ${c.docs.length ? c.docs.slice(0, 6).join(', ') + (c.docs.length > 6 ? ` … (+${c.docs.length - 6})` : '') : '—'}${nomes ? `\n    ${nomes}` : ''}`;
    files.push(linia);
    if (!viu && !PERMESOS.has(script)) orfes.push(script);
  }
  process.stdout.write(`\n### tooling/brain · ${scripts.length} scripts\n● cridat per un executor, per codi o manat per una skill · ◐ només anomenat en docs · ○ ningú\n\n${files.join('\n')}\n\n### Orfes (cap executor, codi ni skill que els cride): ${orfes.length}\n${orfes.map((o) => `  - ${o}`).join('\n')}\n`);
  // Mode informe: la porta s'activa quan PERMESOS reculla la decisió del Mestre.
  if (process.env.SDP_PORTA_ORFES === '1') assert.deepEqual(orfes, [], `Orfes a tooling/brain: ${orfes.join(', ')}`);
});
