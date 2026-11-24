import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {empremta, REGISTRE} from '../tooling/gates/frontissa-contingut.mjs';
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
 fs.writeFileSync(path.join(root,'.gitignore'),'.sdp-reflex/\nnode_modules\n.husky/_/\n.agents/runtime/*.lock\n');
 fs.writeFileSync(path.join(root,'probe.txt'),'original');
 /* La frontissa és el primer pas del pre-commit i llig el contingut i els seus consumidors.
    Un Mas sintètic mínim (com a frontissa-contingut.test.mjs), no el src/ real: la prova
    és del circuit de Git i no ha de dependre de les pàgines vives. */
 for(const [rel,text] of [['src/sections/text/pageContent.js',"export const PAGE_COPY = { projecte: { title: 'P', html: '<p>p</p>' } };\n"],
  ['src/config/systemPages.js',"export const SYSTEM_PAGES = [{ key: 'projecte' }];\nexport const COVER_PAGE_KEYS = {};\n"],
  ['src/config/sections.js','export const SECTIONS = [];\n']]) {
  fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),text);
 }
 const env={...process.env,SDP_ARREL:root,HUSKY:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1'};
 for(const k of Object.keys(env)) if(k.startsWith('GIT_')&&!['GIT_CONFIG_GLOBAL','GIT_CONFIG_NOSYSTEM'].includes(k)) delete env[k];
 const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,env,encoding:'utf8',maxBuffer:8*1024*1024});
 const good=(cmd,args)=>{const r=run(cmd,args);assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
 // Seed only this synthetic fixture. Human/agent CLI authorization is tested in frontissa-dual-cas.
 fs.writeFileSync(path.join(root,REGISTRE),JSON.stringify({schema:'sdp.contingut.v1',claus:{projecte:{...empremta({title:'P',html:'<p>p</p>'}),aprovat_per:'Fixture',data:'2026-11-23'}}}));
 good('git',['init','--quiet']);
 // The hook fixture owns no background maintenance. Auto-packing can outlive
 // commit and race its teardown (ENOTEMPTY in .git/objects/info or pack).
 good('git',['config','gc.auto','0']);good('git',['config','maintenance.auto','false']);
 good('git',['config','user.name','Fixture']);good('git',['config','user.email','fixture@example.invalid']);
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
/* Sense lease, qui denega ha de ser el Reflex i no una porta prèvia a mig muntar: l'antiga
   regex casava amb qualsevol «ENOENT», també el d'un fitxer absent de la frontissa, i donava
   verd. Ara només val l'ENOENT d'active.json, i darrere de git-staged. La cadena del pre-commit
   va amb `|| exit 1`, i per això la línia de git-staged ja demostra que les tres portes
   anteriors han eixit amb 0; les línies d'èxit ho diuen per nom. Git passa l'eixida dels
   hooks per stderr, i sh .husky/<hook> per stdout: es mira la unió. */
function denegaElReflex(r) {
 const eixida=r.stderr+r.stdout;assert.notEqual(r.status,0,eixida);
 assert.match(eixida,/✅ \[Frontissa\] 1\/1 claus estructurals amb empremta aprovada\./);
 assert.match(eixida,/✅ \[Taxonomia\] 0 fitxers conformes\./);
 // El motiu és que no hi ha lease activa: el Reflex no troba .sdp-reflex/active.json.
 assert.match(eixida,/reflex_petorreta\.mjs verify --operation=git-commit --staged: ❌ \[REFLEX\] ENOENT: [^\n]*\/\.sdp-reflex\/active\.json/);
}
test('Husky init idempotent i Git denega commit real sense lease',t=>{
 const f=setup(t);f.reflex('init');assert.equal(f.good('git',['config','--get','core.hooksPath']).trim(),'.husky/_');
 fs.writeFileSync(path.join(f.root,'probe.txt'),'nou');f.good('git',['add','probe.txt']);
 denegaElReflex(f.run('git',['commit','-m','denegat']));
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
for(const hook of ['pre-merge-commit','pre-applypatch']) test(`${hook} executa la cadena i propaga denegació`,t=>{
 const f=setup(t);denegaElReflex(f.run('sh',[`.husky/${hook}`]));
});
// post-applypatch no passa per la cadena: delega en post-commit, que consumix el rebut (consume-commit).
test('post-applypatch delega en post-commit i propaga la denegació del Reflex',t=>{
 const f=setup(t);const r=f.run('sh',['.husky/post-applypatch']);
 assert.notEqual(r.status,0,r.stderr+r.stdout);assert.match(r.stderr,/^❌ \[REFLEX\] ENOENT: [^\n]*\/\.sdp-reflex\/active\.json/m);
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

/* Avortament canònic (deute del checkpoint Fediversity 261104): un pre-commit fallit deixava
   una lease git-commit que no es podia consumir sense commit ni alliberar sense falsificar-ne
   el consum. `abort` la tanca com a `aborted`, sense consumedAt ni commit. */
const reflexRun=(f,...args)=>f.run(process.execPath,['tooling/wiki/reflex_petorreta.mjs',...args]);
test('abort canònic: lease git-commit sense commit queda avortada (no consumida), allibera active.json i permet una lease nova',t=>{
 const f=setup(t);const receipt=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'staged');f.good('git',['add','probe.txt']);
 f.reflex('verify','--operation=git-commit','--staged',`--receipt=${receipt}`);
 // Cap commit: simula un pre-commit que falla després del binding.
 assert.notEqual(reflexRun(f,'abort',`--receipt=${receipt}`).status,0,'abort sense motiu ha de fallar');
 f.reflex('abort',`--receipt=${receipt}`,'--reason=pre-commit fallit');
 const stored=JSON.parse(fs.readFileSync(receipt,'utf8'));
 assert.equal(stored.status,'aborted');assert.equal(stored.abortReason,'pre-commit fallit');
 assert.equal(stored.consumedAt,undefined);assert.equal(stored.commit,undefined);
 assert.equal(stored.abortHead,f.good('git',['rev-parse','HEAD']).trim());
 assert.equal(fs.existsSync(path.join(f.root,'.sdp-reflex/active.json')),false);
 for(const args of [['consume-commit',`--receipt=${receipt}`],['abort',`--receipt=${receipt}`,'--reason=x'],
  ['verify','--operation=git-commit','--staged',`--receipt=${receipt}`]]) assert.notEqual(reflexRun(f,...args).status,0,args[0]);
 const second=lease(f);assert.notEqual(second,receipt);
 assert.equal(JSON.parse(fs.readFileSync(second,'utf8')).status,'sealed');
});
test('abort no toca rebuts tancats ni amaga un commit fet ni una mutació completada',t=>{
 const f=setup(t);
 // A: rebut ja consumit amb consume-commit; abort falla i no canvia cap byte.
 const consumed=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'A');f.good('git',['add','probe.txt']);
 f.reflex('verify','--operation=git-commit','--staged',`--receipt=${consumed}`);
 const commitA=f.good('git',['commit-tree',f.good('git',['write-tree']).trim(),'-p',f.good('git',['rev-parse','HEAD']).trim(),'-m','A']).trim();
 f.good('git',['update-ref','HEAD',commitA]);f.reflex('consume-commit',`--receipt=${consumed}`);
 const bytes=fs.readFileSync(consumed);
 assert.notEqual(reflexRun(f,'abort',`--receipt=${consumed}`,'--reason=x').status,0);
 assert.deepEqual(fs.readFileSync(consumed),bytes);
 // B: el commit ja s'ha fet (HEAD s'ha mogut); abort el denega i consume-commit encara el tanca.
 const moved=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'B');f.good('git',['add','probe.txt']);
 f.reflex('verify','--operation=git-commit','--staged',`--receipt=${moved}`);
 const commitB=f.good('git',['commit-tree',f.good('git',['write-tree']).trim(),'-p',commitA,'-m','B']).trim();
 f.good('git',['update-ref','HEAD',commitB]);
 const r=reflexRun(f,'abort',`--receipt=${moved}`,'--reason=amagar el commit');
 assert.notEqual(r.status,0);assert.match(r.stderr,/HEAD/);
 assert.equal(JSON.parse(fs.readFileSync(moved,'utf8')).status,'sealed');
 f.reflex('consume-commit',`--receipt=${moved}`);
 assert.equal(JSON.parse(fs.readFileSync(moved,'utf8')).status,'consumed');
 // C: una mutació de govern completada s'ha de tancar amb consume, no esborrar-la.
 const scope='.agents/skills/a/SKILL.md';
 fs.mkdirSync(path.dirname(path.join(f.root,scope)),{recursive:true});fs.writeFileSync(path.join(f.root,scope),'A0');
 verificaSegell(f.root,{update:true});
 let plan;
 const governed=lease(f,{operation:'governance-write',scope,makePlan:session=>(plan={schema:'sdp.mutation.v1',session,operationId:'fixture-write',files:[{path:scope,before:sha('A0'),content:'A1'}]})});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp plan '));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'plan.json');fs.writeFileSync(file,JSON.stringify(plan));
 const ex=f.run(process.execPath,['tooling/gates/executor-mutacio.mjs',file,governed]);assert.equal(ex.status,0,ex.stderr);
 const govBytes=fs.readFileSync(governed);
 const rc=reflexRun(f,'abort',`--receipt=${governed}`,'--reason=x');
 assert.notEqual(rc.status,0);assert.match(rc.stderr,/consume/);
 assert.deepEqual(fs.readFileSync(governed),govBytes);
 f.reflex('consume',`--receipt=${governed}`);
});
/* La finestra de l'editor: pre-commit ja ha vinculat l'arbre i Git encara no ha escrit el commit.
   La cadena sencera del pre-commit no passa en la fixture (falta la plantilla de la Wiki), així que
   el pre-commit de la fixture fa només el pas del Reflex que fa git-staged.mjs (verify --staged);
   commit-msg i post-commit són els reals. */
test('commit-msg revalida la lease: un abort amb l’editor obert fa fallar el commit real; sense abort, el commit es consumix',t=>{
 const f=setup(t);
 fs.writeFileSync(path.join(f.root,'.husky/pre-commit'),'#!/bin/sh\nexec node tooling/wiki/reflex_petorreta.mjs verify --operation=git-commit --staged\n');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-editor-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const editor=(abort)=>{const file=path.join(dir,abort?'avorta.sh':'escriu.sh');
  fs.writeFileSync(file,`#!/bin/sh\n${abort?`node tooling/wiki/reflex_petorreta.mjs abort --reason=editor-obert >/dev/null || exit 1\n`:''}echo missatge > "$1"\n`);fs.chmodSync(file,0o755);return file;};
 const aborted=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'editor');f.good('git',['add','probe.txt']);
 const head=f.good('git',['rev-parse','HEAD']).trim();
 const r=f.run('git',['-c',`core.editor=${editor(true)}`,'commit']);
 assert.notEqual(r.status,0,r.stdout+r.stderr);assert.match(r.stderr,/commit-msg/);
 assert.equal(f.good('git',['rev-parse','HEAD']).trim(),head);
 const stored=JSON.parse(fs.readFileSync(aborted,'utf8'));
 assert.equal(stored.status,'aborted');assert.equal(stored.commit,undefined);assert.equal(stored.abortHead,head);
 const consumed=lease(f);
 const ok=f.run('git',['-c',`core.editor=${editor(false)}`,'commit']);assert.equal(ok.status,0,ok.stdout+ok.stderr);
 const done=JSON.parse(fs.readFileSync(consumed,'utf8'));
 assert.equal(done.status,'consumed');assert.equal(done.commit,f.good('git',['rev-parse','HEAD']).trim());
});
test('abort accepta una lease que no pot haver produït el commit que ha mogut HEAD',t=>{
 const f=setup(t);
 const foreign=(name)=>{fs.writeFileSync(path.join(f.root,name),name);f.good('git',['add',name]);
  const c=f.good('git',['commit-tree',f.good('git',['write-tree']).trim(),'-p',f.good('git',['rev-parse','HEAD']).trim(),'-m',name]).trim();
  f.good('git',['update-ref','HEAD',c]);return c;};
 // Lease sense git-commit: un commit d'una altra mà (--no-verify) no la bloqueja.
 const plain=lease(f,{operation:'governance-write'});
 const seal=JSON.parse(fs.readFileSync(plain,'utf8')).baselineAtSeal.head;
 const c1=foreign('alie1.txt');
 f.reflex('abort',`--receipt=${plain}`,'--reason=tasca abandonada');
 let stored=JSON.parse(fs.readFileSync(plain,'utf8'));
 assert.equal(stored.status,'aborted');assert.equal(stored.consumedAt,undefined);
 assert.equal(stored.abortHead,c1);assert.equal(stored.baselineAtSeal.head,seal);assert.notEqual(seal,c1);
 // Lease git-commit vinculada; el commit aliè no té l'arbre vinculat: tampoc la bloqueja.
 const bound=lease(f);
 fs.writeFileSync(path.join(f.root,'probe.txt'),'vinculat');f.good('git',['add','probe.txt']);
 f.reflex('verify','--operation=git-commit','--staged',`--receipt=${bound}`);
 f.good('git',['reset','-q','--','probe.txt']);foreign('alie2.txt');
 f.reflex('abort',`--receipt=${bound}`,'--reason=pre-commit fallit');
 stored=JSON.parse(fs.readFileSync(bound,'utf8'));assert.equal(stored.status,'aborted');assert.equal(stored.commit,undefined);
});
test('abort d’un claim reclamat amb escriptura feta deixa signat que els scopes han canviat',t=>{
 const f=setup(t),scope='.agents/skills/a/SKILL.md';
 fs.mkdirSync(path.dirname(path.join(f.root,scope)),{recursive:true});fs.writeFileSync(path.join(f.root,scope),'A0');
 verificaSegell(f.root,{update:true});
 let plan;
 const receipt=lease(f,{operation:'governance-write',scope,makePlan:session=>(plan={schema:'sdp.mutation.v1',session,operationId:'fixture-write',files:[{path:scope,before:sha('A0'),content:'A1'}]})});
 // Un mutador que mor entre claim i complete, després d'escriure.
 const code=`const m=await import(${JSON.stringify(path.join(f.root,'tooling/wiki/reflex_petorreta.mjs'))});
 const fs=await import('node:fs');const target=${JSON.stringify(path.join(f.root,scope))};
 await m.claimReceiptForMutation({receiptPath:${JSON.stringify(receipt)},operation:'governance-write',targets:[target],planDigest:${JSON.stringify(sha(JSON.stringify(plan)))}});
 fs.writeFileSync(target,'A1');`;
 const child=f.run(process.execPath,['--input-type=module','-e',code]);assert.equal(child.status,0,child.stderr);
 assert.equal(JSON.parse(fs.readFileSync(receipt,'utf8')).claims['governance-write'].status,'claimed');
 const r=reflexRun(f,'abort',`--receipt=${receipt}`,'--reason=proces mort');
 assert.equal(r.status,0,r.stderr);assert.match(r.stderr,/abortScopesChanged/);
 const stored=JSON.parse(fs.readFileSync(receipt,'utf8'));
 assert.equal(stored.status,'aborted');assert.equal(stored.claims['governance-write'].status,'aborted');
 assert.equal(stored.abortScopesChanged,true);assert.notEqual(stored.abortScopeDigest,stored.scopeSnapshotAtSeal.digest);
});
test('Frontissa CLI agent previsualitza el pla i completa un claim Reflex real', t => {
 const f=setup(t), scope=REGISTRE;
 fs.writeFileSync(path.join(f.root,'src/sections/text/pageContent.js'),"export const PAGE_COPY={projecte:{title:'P',html:'<p>poble revisat explícitament</p>'}};\n");
 // Keep bootstrap skill sealing independent of the content registry.
 fs.mkdirSync(path.join(f.root,'.agents/skills/fixture'),{recursive:true});
 fs.writeFileSync(path.join(f.root,'.agents/skills/fixture/SKILL.md'),'Fixture');verificaSegell(f.root,{update:true});
 const command=['tooling/gates/frontissa-contingut.mjs','--aprova','projecte','--per','Fixture','--motiu','Revisió agent amb claim real'];
 let session, bound;
 const receipt=lease(f,{operation:'governance-write',scope,makePlan:id=>{session=id;bound=JSON.parse(f.good(process.execPath,[...command,'--session',id,'--pla'])).plan;return bound;}});
 const result=f.good(process.execPath,[...command,'--session',session,'--rebut',receipt]);assert.match(result,/✅ \[Frontissa\] aprova/);
 const audit=fs.readdirSync(path.join(f.root,'.agents/seal-transactions')).map(name=>JSON.parse(fs.readFileSync(path.join(f.root,'.agents/seal-transactions',name)))).find(r=>r.kind==='frontissa-agent');
 assert.equal(audit.planHash,sha(JSON.stringify(bound)));assert.equal(audit.claim,`${session}:governance-write`);assert.equal(verificaSegell(f.root).ok,true);
 assert.equal(JSON.parse(fs.readFileSync(receipt)).claims['governance-write'].status,'completed');
 assert.notEqual(f.run(process.execPath,[...command,'--session',session,'--rebut',receipt]).status,0);
});
