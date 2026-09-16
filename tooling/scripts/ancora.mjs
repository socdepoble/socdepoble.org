#!/usr/bin/env node
/**
 * ancora.mjs — Xarxa de seguretat de sessió.
 *
 * Fotografia TOT l'arbre de treball (rastrejat i NO rastrejat) dins d'un commit
 * orfe penjat de refs/sdp/ancora/*. No toca l'índex, no toca el worktree, no
 * apareix a `git log`, no es puja mai amb `git push`. És invisible fins que la
 * necessites.
 *
 *   node eines/ancora.mjs --pon "arranc de sessio"   → crea la fotografia
 *   node eines/ancora.mjs --llista                   → què tenim guardat
 *   node eines/ancora.mjs --diferencia <ref>         → què ha canviat des d'allí
 *   node eines/ancora.mjs --torna <ref>              → restaura l'arbre sencer
 *   node eines/ancora.mjs --purga 20                 → conserva només les N últimes
 *
 * Crida-la des de `despertar.mjs` en cada arranc. Costa ~50 ms i és l'única
 * cosa que et salva d'una ordre destructiva que s'haja saltat totes les portes.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', x: '\x1b[0m', d: '\x1b[2m' }
  : { r: '', g: '', y: '', b: '', x: '', d: '' };

function git(args, opcions = {}) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opcions }).trim();
}
function provaGit(args, opcions = {}) {
  try { return { ok: true, eixida: git(args, { stdio: ['pipe', 'pipe', 'ignore'], ...opcions }) }; }
  catch (e) { return { ok: false, eixida: String(e.stdout || e.stderr || e.message) }; }
}

function opcions() {
  const a = process.argv.slice(2); const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const c = a[i].slice(2);
    o[c] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return o;
}

function marcaTermodinàmica() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function pon(motiu) {
  const arrel = git(['rev-parse', '--show-toplevel']);
  const índex = join(arrel, '.git', `index-ancora-${process.pid}`);
  const env = { ...process.env, GIT_INDEX_FILE: índex };
  try {
    const cap = provaGit(['rev-parse', 'HEAD']);
    if (cap.ok) git(['read-tree', 'HEAD'], { env });
    git(['add', '-A'], { env });
    const arbre = git(['write-tree'], { env });

    // Si res no ha canviat des de l'última àncora, no en creem una de nova.
    const última = provaGit(['for-each-ref', '--sort=-creatordate', '--count=1',
      '--format=%(objectname) %(tree)', 'refs/sdp/ancora']);
    if (última.ok && última.eixida) {
      const [commitPrevi, arbrePrevi] = última.eixida.split(' ');
      if (arbrePrevi === arbre) {
        console.log(`${C.d}⚓ arbre idèntic a l'última àncora (${commitPrevi.slice(0, 8)}); no en cal una de nova.${C.x}`);
        return null;
      }
    }

    const argsC = ['commit-tree', arbre, '-m', `ancora: ${motiu}`];
    if (cap.ok) argsC.splice(2, 0, '-p', cap.eixida);
    const commit = git(argsC, { env });
    let ref = `refs/sdp/ancora/${marcaTermodinàmica()}`;
    if (provaGit(['rev-parse', '--verify', `${ref}^{commit}`]).ok) {
      ref = `${ref}_${commit.slice(0, 6)}`;      // mai esclafem una àncora existent
    }
    git(['update-ref', ref, commit]);
    console.log(`${C.g}⚓ àncora ${C.b}${ref}${C.x}${C.g} → ${commit.slice(0, 8)}${C.x}`);
    console.log(`${C.d}   desfer:  node eines/ancora.mjs --torna ${ref}${C.x}`);
    return { ref, commit };
  } finally {
    try { unlinkSync(índex); } catch { /* tant se val */ }
  }
}

const o = opcions();

if (o.llista) {
  const r = provaGit(['for-each-ref', '--sort=-creatordate',
    '--format=%(refname:short)\t%(creatordate:iso-local)\t%(subject)', 'refs/sdp/ancora']);
  console.log(r.eixida || 'Cap àncora.');
  process.exit(0);
}

if (o.diferencia) {
  const r = provaGit(['diff', '--stat', String(o.diferencia)]);
  console.log(r.eixida || 'Sense diferències.');
  process.exit(0);
}

if (o.torna) {
  const ref = String(o.torna);
  if (!provaGit(['rev-parse', '--verify', `${ref}^{commit}`]).ok) {
    console.error(`${C.r}✖ L'àncora «${ref}» no existix.${C.x}`);
    process.exit(1);
  }
  pon(`estat descartat en tornar a ${ref}`);              // àncora de l'àncora: mai un carreró sense eixida
  const r = provaGit(['checkout', ref, '--', '.']);
  if (!r.ok) { console.error(`${C.r}✖ ${r.eixida}${C.x}`); process.exit(1); }
  console.log(`${C.g}✔ Arbre restaurat des de ${ref}.${C.x}`);
  process.exit(0);
}

if (o.purga) {
  const conserva = Number(o.purga) || 20;
  const refs = (provaGit(['for-each-ref', '--sort=-creatordate', '--format=%(refname)',
    'refs/sdp/ancora']).eixida || '').split('\n').filter(Boolean);
  for (const ref of refs.slice(conserva)) git(['update-ref', '-d', ref]);
  console.log(`${C.d}Purgades ${Math.max(0, refs.length - conserva)} àncores; en queden ${Math.min(refs.length, conserva)}.${C.x}`);
  process.exit(0);
}

pon(typeof o.pon === 'string' ? o.pon : 'sessió');
