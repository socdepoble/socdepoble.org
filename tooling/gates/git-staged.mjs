#!/usr/bin/env node
/** One sequential Git orchestrator. All validators see the same prepared tree. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {esMain} from '../lib/arrel.mjs';
import {sha} from '../documental/core.mjs';
import {PROJECT_DIR, materializePendingTree, pendingTreeForReceipt} from '../wiki/reflex_petorreta.mjs';
/* P0-22 (B1.3, 261101) · Temps per pas. Les portes tarden ~120 s a l'arbre preparat amb càrrega i la suite
   ràpida ~70 s (i creix): un tall únic de 120 s no les deixava passar mai. Els valors només pugen:
   SDP_HOOK_TEMPS_PAS_S allarga un pas però mai el baixa del seu mínim (sostre de 24 h). */
export const TEMPS_PAS_MS = Object.freeze({defecte:120_000, portes:600_000, proves:300_000});
const SOSTRE_PAS_MS = 86_400_000;
export function tempsDelPas(clau, env = process.env) {
  if (!Object.hasOwn(TEMPS_PAS_MS, clau)) throw new Error(`Pas sense temps declarat: ${clau}`);
  const minim = TEMPS_PAS_MS[clau];
  const segons = Number(env.SDP_HOOK_TEMPS_PAS_S);
  if (!Number.isFinite(segons) || segons <= 0) return minim;
  return Math.max(minim, Math.min(Math.ceil(segons * 1000), SOSTRE_PAS_MS));
}
/* Validadors de l'arbre preparat, en ordre, cadascun amb el seu pas de temps.
   T4 (261024_1800, P1-10): run-portes --nomes-portes executa les portes i el linter, però no les seues
   bateries de proves (documental, node i el Vitest sencer d'uns 9 min). Ací les substituïx la suite
   ràpida (vitest.precommit.config.js més les proves de node de seguretat, migracions i documental).
   El contracte de teclat per superfícies corre separat, també sobre este arbre preparat.
   La suite sencera continua per Onada. P0-22 (261101): cap pas comparteix ja l'antic tall únic de 120 s. */
export const PASSOS_HOOK = Object.freeze([
  {cmd:process.execPath, args:['tooling/gates/porta-documents.mjs','--staged'], pas:'defecte'},
  {cmd:process.execPath, args:['tooling/gates/tancament.mjs','--check'], pas:'defecte'},
  {cmd:process.execPath, args:['tooling/gates/run-portes.mjs','--nomes-portes'], pas:'portes'},
  {cmd:process.execPath, args:['tooling/gates/teclat-superficies.mjs'], pas:'proves'},
  {cmd:'npm', args:['run','test:precommit'], pas:'proves'},
].map(pas => Object.freeze({...pas, args:Object.freeze(pas.args)})));
/* Sense pas explícit («verify --staged», plumbing de Git) també val tempsDelPas: així
   SDP_HOOK_TEMPS_PAS_S allarga tots els talls, com diu el missatge. */
export function runChecked(command, args, cwd, env, timeout = tempsDelPas('defecte', env ?? process.env)) {
  const run = spawnSync(command, args, {cwd, env, encoding:'utf8', timeout, maxBuffer:16*1024*1024});
  if (run.error?.code === 'ETIMEDOUT') throw new Error(`${command} ${args.join(' ')}: temps esgotat als ${Math.round(timeout/1000)} s (SDP_HOOK_TEMPS_PAS_S l'allarga). ${run.stderr || run.stdout || ''}`.trim());
  if (run.error || run.status !== 0) throw new Error(`${command} ${args.join(' ')}: ${run.error?.message || run.stderr || run.stdout || `exit ${run.status}`}`);
  return run.stdout;
}
/** node_modules REAL amb un enllaç per paquet (també dins dels @àmbits, i .bin). Amb un enllaç sencer,
    Vitest resol el directori fora de l'arbre i no troba 'react' (P0-22, reproduït 261101). Els altres
    fitxers punt (.vite, .cache, .package-lock.json) no s'enllacen: les cachés queden dins del temporal. */
export function enllacaDependencies(origen, desti) {
  const entrades = fs.readdirSync(origen, {withFileTypes:true});
  fs.mkdirSync(desti, {mode:0o700});
  for (const entrada of entrades) {
    if (entrada.name.startsWith('.') && entrada.name !== '.bin') continue;
    const font = path.join(origen, entrada.name), dest = path.join(desti, entrada.name);
    if (entrada.name.startsWith('@') && entrada.isDirectory()) {
      fs.mkdirSync(dest);
      for (const paquet of fs.readdirSync(font)) {
        if (!paquet.startsWith('.')) fs.symlinkSync(path.join(font, paquet), path.join(dest, paquet), 'dir');
      }
    } else fs.symlinkSync(font, dest, 'dir');
  }
}
/** Dins de l'arbre preparat: dependències per paquet i validadors en ordre, cadascun amb el seu temps
    (P0-22). Reutilitza les dependències instal·lades: el hook mai instal·la ni executa scripts de cicle
    de vida. El hook usa els valors per defecte; les proves injecten `run` i `origen`. */
export function executaValidadors(dir, env, {run = runChecked, origen = path.join(PROJECT_DIR,'node_modules')} = {}) {
  // Runtime canònic buit per a Fronteres; mai es copia la paperera privada de l’arbre viu.
  fs.mkdirSync(path.join(dir,'.sdp-paperera'), {mode:0o700});
  enllacaDependencies(origen, path.join(dir,'node_modules'));
  for (const {cmd,args,pas} of PASSOS_HOOK) run(cmd,args,dir,env,tempsDelPas(pas,env));
}
export function snapshotPreparedFiles(root, env) {
  const files=runChecked('git',['ls-files','-z'],root,env).split('\0').filter(Boolean).sort();
  return sha(JSON.stringify(files.map(file=>{
    const target=path.join(root,file), stat=fs.lstatSync(target);
    if (!stat.isFile() || stat.nlink!==1) throw new Error(`Font preparada no regular: ${file}`);
    return [file,stat.mode & 0o777,sha(fs.readFileSync(target))];
  })));
}
export async function verifyPreparedTree(receiptPath) {
  runChecked(process.execPath, ['tooling/wiki/reflex_petorreta.mjs','verify','--operation=git-commit','--staged', ...(receiptPath ? [`--receipt=${receiptPath}`] : [])], PROJECT_DIR, process.env);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'sdp-index-'));
  fs.chmodSync(dir,0o700);
  try {
    const prepared = await materializePendingTree(receiptPath,dir);
    // SDP_PRE_COMMIT: the gates know they run on the prepared tree (tractor-build-previ does not build there).
    const env = {...process.env, SDP_ARREL:dir, SDP_PRE_COMMIT:'1'};
    for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
    runChecked('git',['init','--quiet'],dir,env);
    const objects = runChecked('git',['rev-parse','--git-path','objects'],PROJECT_DIR,process.env).trim();
    fs.mkdirSync(path.join(dir,'.git/objects/info'),{recursive:true});
    fs.writeFileSync(path.join(dir,'.git/objects/info/alternates'),path.resolve(PROJECT_DIR,objects)+'\n');
    runChecked('git',['update-ref','HEAD',(await pendingTreeForReceipt(receiptPath)).headBeforeCommit],dir,env);
    runChecked('git',['read-tree',prepared.tree],dir,env);
    // L'instantani només mira l'índex (git ls-files): node_modules no hi és mai (.gitignore).
    const before = snapshotPreparedFiles(dir,env);
    executaValidadors(dir,env);
    if (before !== snapshotPreparedFiles(dir,env) || runChecked('git',['write-tree'],dir,env).trim() !== prepared.tree) throw new Error('Un validador ha modificat fonts de l’arbre preparat');
    const current = await pendingTreeForReceipt(receiptPath);
    if (current.tree !== prepared.tree) throw new Error('Índex canviat després de validar');
    return {valid:true,tree:prepared.tree};
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
}
if (esMain(import.meta.url)) {
  try { console.log(JSON.stringify(await verifyPreparedTree(process.env.SDP_REFLEX_RECEIPT))); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
