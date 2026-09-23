import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {sha} from '../tooling/documental/core.mjs';
import {verificaSegell} from '../tooling/gates/segella.mjs';
import {snapshotPreparedFiles} from '../tooling/gates/git-staged.mjs';
import {REPO} from './helpers/documental.mjs';
function setup(t) {
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp git ')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const rel of ['tooling','.husky','AGENTS.md','.agents/AGENTS.md','.agents/PROTOCOL_PETORRETA.md','.agents/protocolledge.json']) {
  fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});
  fs.cpSync(path.join(REPO,rel),path.join(root,rel),{recursive:true,filter:p=>!p.includes('/node_modules')&&!p.includes('/.husky/_')});
 }
 fs.symlinkSync(path.join(REPO,'node_modules'),path.join(root,'node_modules'),'dir');
 fs.writeFileSync(path.join(root,'package.json'),'{"type":"module"}');
 fs.writeFileSync(path.join(root,'.gitignore'),'.sdp-reflex/\nnode_modules\n.husky/_/\n');
 fs.writeFileSync(path.join(root,'probe.txt'),'original');
 const env={...process.env,SDP_ARREL:root,HUSKY:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1'};
 for(const k of Object.keys(env)) if(k.startsWith('GIT_')&&!['GIT_CONFIG_GLOBAL','GIT_CONFIG_NOSYSTEM'].includes(k)) delete env[k];
 const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,env,encoding:'utf8',maxBuffer:8*1024*1024});
 const good=(cmd,args)=>{const r=run(cmd,args);assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
 good('git',['init','--quiet']);good('git',['config','user.name','Fixture']);good('git',['config','user.email','fixture@example.invalid']);
 good('git',['add','.']);good('git',['commit','--quiet','-m','fixture']);
 const reflex=(...args)=>good(process.execPath,['tooling/wiki/reflex_petorreta.mjs',...args]);
 reflex('init');
 return {root,run,good,reflex};
}
function lease(f, {operation='git-commit',scope='probe.txt',makePlan}={}) {
 const opened=JSON.parse(f.reflex('open','--intent=Verificar arbre Git de prova','--risk=high',`--scope=${scope}`,`--operation=${operation}`,'--json'));
 const {session:s,nonce}=opened,dir=path.join(f.root,s.bootstrap.path);
 const boundPlan=makePlan?.(s.sessionId);
 const prompt=path.join(dir,'260923_2030_PROMPT_prova_del_circuit_de_git_amb_lease_real.md');
 const manifest=path.join(dir,'manifest.json');
 fs.writeFileSync(prompt,`---\ntype: prompt\nstatus: esborrany\ndescription: Prova funcional del circuit Git amb lease real i arbre preparat.\n---\n# Prova de Git\nReflex-Session: ${s.sessionId}\nIntent-SHA256: ${s.intentSha256}\nRules-SHA256: ${s.rulesDigest}\n${boundPlan ? `Plan-SHA256: ${sha(JSON.stringify(boundPlan))}\n` : ''}## Context\n${'La prova comprova bytes preparats en un repositori temporal privat. '.repeat(7)}\n## Tasques\nVerificar el tree, materialitzar-lo i consumir el rebut després del commit.\n## Riscos\n${'No es toca el repositori compartit ni dades externes. '.repeat(6)}\n## Criteris d’acceptació\nRebut vigent, tree exacte i replay denegat.\n`);
 fs.writeFileSync(manifest,JSON.stringify({sources:[{path:scope,reason:'Target de prova',classification:'internal',role:'target'}]}));
 f.reflex('seal',`--session=${s.sessionId}`,`--nonce=${nonce}`,`--petorreta=${prompt}`,`--manifest=${manifest}`);
 return path.join(f.root,'.sdp-reflex/sessions',`${s.sessionId}.json`);
}
test('Husky init idempotent i Git denega commit real sense lease',t=>{
 const f=setup(t);f.reflex('init');assert.equal(f.good('git',['config','--get','core.hooksPath']).trim(),'.husky/_');
 fs.writeFileSync(path.join(f.root,'probe.txt'),'nou');f.good('git',['add','probe.txt']);
 const commit=f.run('git',['commit','-m','denegat']);assert.notEqual(commit.status,0);assert.match(commit.stderr+commit.stdout,/REFLEX|active|ENOENT|lease/);
});
test('lease Git real vincula índex divergent, materialitza bytes staged, consumix i denega replay',t=>{
 const f=setup(t);const receipt=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'staged');f.good('git',['add','probe.txt']);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'worktree diferent');
 f.reflex('verify','--operation=git-commit','--staged',`--receipt=${receipt}`);
 const dest=fs.mkdtempSync(path.join(os.tmpdir(),'sdp pending '));fs.chmodSync(dest,0o700);t.after(()=>fs.rmSync(dest,{recursive:true,force:true}));
 f.reflex('materialize-tree',`--receipt=${receipt}`,`--destination=${dest}`);
 assert.equal(fs.readFileSync(path.join(dest,'probe.txt'),'utf8'),'staged');
 const tree=f.good('git',['write-tree']).trim(),parent=f.good('git',['rev-parse','HEAD']).trim();
 // Plumbing creates the already verified fixture tree; consumption still checks tree and ancestry.
 const commit=f.good('git',['commit-tree',tree,'-p',parent,'-m','fixture accepted']).trim();f.good('git',['update-ref','HEAD',commit]);
 f.reflex('consume-commit',`--receipt=${receipt}`);
 assert.equal(JSON.parse(fs.readFileSync(receipt,'utf8')).status,'consumed');
 assert.notEqual(f.run(process.execPath,['tooling/wiki/reflex_petorreta.mjs','consume-commit',`--receipt=${receipt}`]).status,0);
});
for(const hook of ['pre-merge-commit','pre-applypatch','post-applypatch']) test(`${hook} executa la cadena i propaga denegació`,t=>{
 const f=setup(t);const r=f.run('sh',[`.husky/${hook}`]);assert.notEqual(r.status,0);
});
test('doctor rebutja hook amb només comentaris',t=>{
 const f=setup(t);fs.writeFileSync(path.join(f.root,'.husky/post-commit'),'#!/bin/sh\n# exec node tooling/wiki/reflex_petorreta.mjs consume-commit\n');
 const r=f.run(process.execPath,['tooling/wiki/reflex_petorreta.mjs','doctor','--ci','--json']);assert.notEqual(r.status,0);assert.match(r.stdout,/post-commit.*marcador/);
});

test('executor CLI verifica lease i claim reals abans de publicar el segell',t=>{
 const f=setup(t),scope='.agents/skills/a/SKILL.md';
 fs.mkdirSync(path.dirname(path.join(f.root,scope)),{recursive:true});fs.writeFileSync(path.join(f.root,scope),'A0');
 verificaSegell(f.root,{update:true});
 let plan;
 const receipt=lease(f,{operation:'governance-write',scope,makePlan:session=>(plan={schema:'sdp.mutation.v1',session,operationId:'fixture-write',files:[{path:scope,before:sha('A0'),content:'A1'}]})});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp plan '));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'plan.json');fs.writeFileSync(file,JSON.stringify(plan));
 const r=f.run(process.execPath,['tooling/gates/executor-mutacio.mjs',file,receipt]);
 assert.equal(r.status,0,r.stderr);assert.equal(verificaSegell(f.root).ok,true);
 const stored=JSON.parse(fs.readFileSync(receipt,'utf8'));assert.equal(stored.claims['governance-write'].status,'completed');
 assert.notEqual(f.run(process.execPath,['tooling/gates/executor-mutacio.mjs',file,receipt]).status,0);
});

test('snapshot staged inclou rebuts runtime i fitxers fora del cens de torn',t=>{
 const f=setup(t),file='.agents/runtime/receipt.json';fs.mkdirSync(path.dirname(path.join(f.root,file)),{recursive:true});fs.writeFileSync(path.join(f.root,file),'{}');f.good('git',['add',file]);
 const before=snapshotPreparedFiles(f.root,process.env);fs.writeFileSync(path.join(f.root,file),'{}\n');assert.notEqual(snapshotPreparedFiles(f.root,process.env),before);
});
