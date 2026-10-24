#!/usr/bin/env node
/** One sequential Git orchestrator. All validators see the same prepared tree. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {esMain} from '../lib/arrel.mjs';
import {sha} from '../documental/core.mjs';
import {PROJECT_DIR, materializePendingTree, pendingTreeForReceipt} from '../wiki/reflex_petorreta.mjs';
export function runChecked(command, args, cwd, env) {
  const run = spawnSync(command, args, {cwd, env, encoding:'utf8', timeout:120000, maxBuffer:16*1024*1024});
  if (run.error || run.status !== 0) throw new Error(`${command} ${args.join(' ')}: ${run.error?.message || run.stderr || run.stdout || `exit ${run.status}`}`);
  return run.stdout;
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
    // Reuse frozen installed dependencies, never install or run lifecycle scripts from the hook.
    fs.symlinkSync(path.join(PROJECT_DIR,'node_modules'),path.join(dir,'node_modules'),'dir');
    const before = snapshotPreparedFiles(dir,env);
    for (const args of [['tooling/gates/porta-documents.mjs','--staged'],['tooling/gates/tancament.mjs','--check'],['tooling/gates/run-portes.mjs','--nomes-portes']]) {
      runChecked(process.execPath,args,dir,env);
    }
    // T4 (261024_1800, P1-10): run-portes --nomes-portes runs the gates and the linter, and skips its
    // test batteries (documental, node, the full Vitest of ~9 min, which never fit the 120 s cap of a
    // step). The fast suite replaces them here (vitest.precommit.config.js plus the node security,
    // migration and documental tests). The full suite is still run per wave.
    runChecked('npm',['run','test:precommit'],dir,env);
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
