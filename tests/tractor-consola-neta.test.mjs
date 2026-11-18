import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { recullFonts, recullMapa, estatHooksGit, hooksGit } from '../tooling/brain/mapa-consola.mjs';
import { construeixIndex } from '../tooling/brain/build_skills_index.mjs';
import { esEsborranyEnCurs, checkDocuments } from '../tooling/gates/porta-documents.mjs';
import { recullConsola, rebutsAcreditats, productorsDeLaInstantania } from '../tooling/vite/consola-iaia.mjs';
import { auditaConsola, reutilitzacionsImatges } from '../tooling/gates/tractor-consola-neta.mjs';
import { fixture, validDoc, writeDoc } from './helpers/documental.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { openTurn } from '../tooling/documental/turns.mjs';
const git = (root, ...args) => execFileSync('git', ['--no-optional-locks','-c','maintenance.auto=false','-c','gc.auto=0','-c','user.name=Fixture','-c','user.email=test@example.invalid','-c','commit.gpgsign=false',...args], { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' } }).trim();
const put = (root, file, content) => { fs.mkdirSync(path.dirname(path.join(root,file)), {recursive:true}); fs.writeFileSync(path.join(root,file), content); };
const options = { diagnostic:false, plataforma:'linux', home:'/nonexistent', ara:Date.parse('2026-11-17T20:00:00Z') };
function mas(t) {
  const root=fixture(t);
  put(root,'.agents/skills/core-exemple/SKILL.md','---\ntype: skill\nstatus: canonic\nname: core-exemple\ndescription: Una skill de prova\ntriggers_on: [exemple]\ncontracte.llig: [font.md]\n---\n# Exemple\n');
  put(root,'font.md','# Font\n'); put(root,'AGENTS.md','# BIOS\n'); put(root,'CLAUDE.md','@.agents/skills/core-exemple/SKILL.md\n');
  put(root,'package.json',JSON.stringify({scripts:{prepare:'husky'}}));
  put(root,'.husky/pre-commit','#!/bin/sh\nnode tooling/check.mjs\n'); put(root,'tooling/check.mjs','export {};\n');
  git(root,'init','-q'); git(root,'add','.'); git(root,'commit','-qm','fixture');
  return root;
}
function editTurn(root, turn, fn) {
  const file=path.join(root,'.agents/runtime/turns',`${turn.turn_id}.json`); const value=JSON.parse(fs.readFileSync(file)); fn(value); fs.writeFileSync(file,JSON.stringify(value));
}

test('absent generated index and catalogue derive from canonical sources without writes', t=>{
  const root=mas(t), before=fs.readdirSync(path.join(root,'.agents'));
  const f=recullFonts(root,options);
  assert.deepEqual(f.skillsIndex,construeixIndex(root)); assert.deepEqual(f.skillsClaude,['core-exemple']);
  assert.deepEqual(f.derivades,{index:'derivat',cataleg:'derivat'});
  assert.deepEqual(fs.readdirSync(path.join(root,'.agents')),before);
  assert.equal(fs.existsSync(path.join(root,'.claude/skills')),false);
});
test('existing stale generated index remains red instead of being replaced in memory',t=>{
  const root=mas(t); put(root,'.agents/skills_index.json',JSON.stringify({core:[],plugins:{}}));
  assert.ok(recullMapa(root,options).avisos.some(a=>a.node==='document:.agents/skills_index.json'&&a.codi==='font-absent'));
});
test('existing catalogue with missing or divergent source stays red',t=>{
  const root=mas(t); put(root,'.claude/skills/core-exemple/SKILL.md','different');
  assert.ok(recullFonts(root,options).absents.some(a=>a.ruta==='.claude/skills/core-exemple'));
});
test('ephemeral absence is not a missing file, while tracked referenced deletion is red',t=>{
  const root=mas(t); const f=path.join(root,'.agents/skills/core-exemple/SKILL.md');
  fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('[font.md]','[font.md, .sdp-paperera, .agents/runtime/turns, .agents/runtime, .immunitari, .agents/runtime/secret.json]'));
  put(root,'.agents/runtime/secret.json','{}'); git(root,'add','.agents/runtime/secret.json'); fs.unlinkSync(path.join(root,'.agents/runtime/secret.json'));
  let m=recullMapa(root,options);
  for (const ruta of ['.agents/runtime', '.agents/runtime/turns', '.sdp-paperera', '.immunitari']) assert.equal(m.avisos.some(a=>a.node===`document:${ruta}`&&a.codi==='fitxer-absent'),false,ruta);
  assert.ok(m.avisos.some(a=>a.node==='document:.agents/runtime/secret.json'&&a.codi==='fitxer-absent'));
  fs.unlinkSync(path.join(root,'font.md')); m=recullMapa(root,options);
  assert.ok(m.avisos.some(a=>a.node==='document:font.md'&&a.codi==='fitxer-absent'));
});
test('no hooks source cannot appear alive; a declared clean-clone Husky source is programmed',t=>{
  const root=mas(t); assert.equal(estatHooksGit(root).estats['pre-commit'],'programat');
  fs.unlinkSync(path.join(root,'.husky/pre-commit'));
  assert.equal(estatHooksGit(root).estats['pre-commit'],'mort'); assert.equal(hooksGit(root)['pre-commit'],'');
});
test('installed executable status belongs to each hook independently',t=>{
  const root=mas(t); git(root,'config','core.hooksPath','.husky/_');
  put(root,'.husky/_/pre-commit','#!/bin/sh\nexit 0\n'); fs.chmodSync(path.join(root,'.husky/_/pre-commit'),0o755);
  put(root,'.husky/post-commit','node tooling/check.mjs'); put(root,'.husky/_/post-commit','#!/bin/sh\nexit 0\n'); fs.chmodSync(path.join(root,'.husky/_/post-commit'),0o644);
  assert.equal(estatHooksGit(root).estats['pre-commit'],'viu'); assert.equal(estatHooksGit(root).estats['post-commit'],'programat');
  fs.rmSync(path.join(root,'.husky/_/pre-commit')); fs.mkdirSync(path.join(root,'.husky/_/pre-commit'));
  assert.equal(estatHooksGit(root).estats['pre-commit'],'programat','a real Husky source still awaits installation when its generated wrapper is invalid');
});
test('a custom hooks directory and an unrelated prepare=husky never accredit a hook directory',t=>{
  const root=mas(t);fs.mkdirSync(path.join(root,'custom-hooks/pre-commit'),{recursive:true});git(root,'config','core.hooksPath','custom-hooks');
  assert.equal(estatHooksGit(root).estats['pre-commit'],'mort');assert.equal(hooksGit(root)['pre-commit'],'');
});
test('failed Git inventory cannot pardon an absent ephemeral contract',t=>{
  const root=mas(t), f=path.join(root,'.agents/skills/core-exemple/SKILL.md');
  fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('[font.md]','[.sdp-paperera]'));
  fs.rmSync(path.join(root,'.git'),{recursive:true,force:true});
  assert.ok(recullMapa(root,options).avisos.some(a=>a.node==='document:.sdp-paperera'&&a.codi==='fitxer-absent'));
});
test('an absent exact ephemeral directory with a tracked descendant remains red',t=>{
  const root=mas(t),f=path.join(root,'.agents/skills/core-exemple/SKILL.md');
  fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('[font.md]','[.immunitari]'));
  put(root,'.immunitari/tracked.json','{}');git(root,'add','.immunitari/tracked.json');
  fs.rmSync(path.join(root,'.immunitari'),{recursive:true});
  assert.ok(recullMapa(root,options).avisos.some(a=>a.node==='document:.immunitari'&&a.codi==='fitxer-absent'));
  const previous=process.env.GIT_INDEX_FILE;
  try {
    process.env.GIT_INDEX_FILE=path.join(root,'index-alie-absent');
    assert.ok(recullMapa(root,options).avisos.some(a=>a.node==='document:.immunitari'&&a.codi==='fitxer-absent'),'an injected empty index cannot pardon a tracked descendant');
  } finally { if(previous===undefined)delete process.env.GIT_INDEX_FILE;else process.env.GIT_INDEX_FILE=previous; }
});
test('linked worktree observes common-dir effective hooks and its actual source',t=>{
  const root=mas(t), work=path.join(os.tmpdir(),`sdp-worktree-${path.basename(root)}`);
  t.after(()=>fs.rmSync(work,{recursive:true,force:true}));
  const hooks=path.join(root,'.git','hooks-shared'); put(root,'.git/hooks-shared/pre-commit','#!/bin/sh\nnode tooling/check.mjs\n'); fs.chmodSync(path.join(hooks,'pre-commit'),0o755);
  git(root,'config','core.hooksPath',hooks); git(root,'worktree','add','--detach',work,'HEAD');
  assert.equal(estatHooksGit(work).estats['pre-commit'],'viu'); assert.match(hooksGit(work)['pre-commit'],/tooling\/check/);
});
test('public-only draft exclusion requires an active unexpired receipt; closure remains strict',t=>{
  const root=mas(t), turn=openTurn(root,{scope:'documents'}), file='_wiki_de_poble/04_escriptori/261117_2100_auditoria_curs.md';
  createDraft(root,turn.turn_id,{route:'auditoria',file,title:'En curs',description:'Draft legítim encara incomplet'});
  const raw=fs.readFileSync(path.join(root,file),'utf8'); const ara=Date.now();
  assert.equal(esEsborranyEnCurs(root,raw,file,ara),true);
  assert.ok(checkDocuments(root,{instantania:true,ara}).enCurs.includes(file));
  assert.equal(checkDocuments(root).valid,false);
  assert.throws(()=>checkDocuments(root,{instantania:true,staged:true}),/no substituïx/);
  editTurn(root,turn,r=>r.expiresAt=new Date(ara-1).toISOString());
  assert.equal(esEsborranyEnCurs(root,raw,file,ara),false);
  assert.equal(checkDocuments(root,{instantania:true,ara}).valid,false);
});
test('future turn and future receipt never exempt drafts',t=>{
  const root=mas(t), d=validDoc(root); writeDoc(root,d); const ara=Date.now();
  editTurn(root,d.turn,r=>r.createdAt=new Date(ara+10000).toISOString());
  assert.equal(esEsborranyEnCurs(root,d.content,d.file,ara),false);
  editTurn(root,d.turn,r=>{r.createdAt=new Date(ara-1000).toISOString();Object.values(r.receipts)[0].issuedAt=new Date(ara+10000).toISOString();});
  assert.equal(esEsborranyEnCurs(root,d.content,d.file,ara),false); assert.deepEqual(rebutsAcreditats(root,ara),[]);
});
test('tampered receipt template never exempts a draft',t=>{
  const root=mas(t),d=validDoc(root);writeDoc(root,d);const ara=Date.now();
  editTurn(root,d.turn,r=>Object.values(r.receipts)[0].templateHash='0'.repeat(64));
  assert.equal(esEsborranyEnCurs(root,d.content,d.file,ara),false);
});
test('failed creation and prepared creation never exempt a draft',t=>{
  const root=mas(t), d=validDoc(root);writeDoc(root,d);const ara=Date.now();
  editTurn(root,d.turn,r=>Object.values(r.receipts)[0].creation={state:'prepared',preparedAt:new Date(ara-100).toISOString()});
  assert.equal(esEsborranyEnCurs(root,d.content,d.file,ara),false);
  editTurn(root,d.turn,r=>Object.values(r.receipts)[0].creation={state:'failed',preparedAt:new Date(ara-100).toISOString(),failedAt:new Date(ara-10).toISOString(),absent:true});
  assert.equal(esEsborranyEnCurs(root,d.content,d.file,ara),false);
});
test('pulse is ordered by the issued time rather than receipt insertion order',t=>{
  const root=mas(t), d=validDoc(root);writeDoc(root,d);
  const d2=validDoc(root,{turn:d.turn,suffix:'segon'});writeDoc(root,d2);
  const ara=Date.now();
  editTurn(root,d.turn,r=>{const values=Object.values(r.receipts);values[0].issuedAt=new Date(ara-50).toISOString();values[1].issuedAt=new Date(ara-10).toISOString();r.createdAt=new Date(ara-100).toISOString();});
  const p=rebutsAcreditats(root,ara);assert.equal(p.length,2);assert.equal(p[0].t,new Date(ara-10).toISOString());
});
test('pulse credits a valid receipt with opaque metadata and no private paths; future legacy pulse is rejected',t=>{
  const root=mas(t),d=validDoc(root);writeDoc(root,d); const ara=Date.now();
  put(root,'.agents/.diari_sessio.jsonl',JSON.stringify({tipus:'matrix.rebut',t:new Date(ara+10000).toISOString(),peticio_sha256:'bad',fonts:[]})+'\n');
  const p=recullConsola({arrel:root,ara}); assert.equal(p.rebuts.length,1); assert.equal(p.rebuts[0].origen,'torn-acreditat');
  assert.deepEqual(p.rebuts[0].fonts,[]); assert.equal(JSON.stringify(p.rebuts).includes(d.file),false); assert.equal(JSON.stringify(p.rebuts).includes(root),false);
});
test('pulse rejects a document changed after a sealed closure',t=>{
  const root=mas(t),d=validDoc(root);writeDoc(root,d);
  editTurn(root,d.turn,r=>{r.state='closed';r.verification={files:{[d.file]:'0'.repeat(64)},checks:[{name:'valid',exit:0}]};});
  assert.deepEqual(rebutsAcreditats(root,Date.now()),[]);
});
test('snapshot producers use the requested fixture root, not the module checkout',t=>{
  const root=mas(t); const c=productorsDeLaInstantania({arrel:root,ara:options.ara}).consola();
  assert.deepEqual(c.skills.map(s=>s.nom),['core-exemple']); assert.equal(c.generat,new Date(options.ara).toISOString());
});
test('image audit detects equal bytes at different paths and never claims zero for missing images',t=>{
  const root=mas(t); put(root,'public/assets/a.jpg','same');put(root,'public/assets/b.jpg','same');
  const r=reutilitzacionsImatges(root,{a:{imatge:'/assets/a.jpg'},b:{imatge:'/assets/b.jpg'},c:{imatge:'/assets/missing.jpg'}});
  assert.equal(r.reutilitzacions,1);assert.deepEqual(r.grups,[['a','b']]);assert.deepEqual(r.absents,['c']);
});
test('gate reports referenced tracked loss red and unreferenced tracked removal separately',async t=>{
  const root=mas(t); put(root,'unused.js','export {};'); git(root,'add','unused.js'); fs.unlinkSync(path.join(root,'unused.js'));
  let r=await auditaConsola(root,{ara:options.ara,imatges:{}});
  assert.ok(r.motor.perdutsVersionats.includes('unused.js'));assert.equal(r.motor.perdutsReferenciats.includes('unused.js'),false);
  fs.unlinkSync(path.join(root,'font.md'));r=await auditaConsola(root,{ara:options.ara,imatges:{}});
  assert.ok(r.motor.perdutsReferenciats.includes('font.md'));assert.equal(r.motor.valid,false);
});

test('public document selection never refreshes index for aged, changed, new, staged or removed files',async t=>{
  const indexState=root=>{const p=path.join(root,'.git/index');return {bytes:fs.readFileSync(p).toString('hex'),mtime:fs.statSync(p).mtimeMs};};
  const check=root=>{const before=indexState(root);const result=checkDocuments(root,{instantania:true,ara:Date.now()});assert.deepEqual(indexState(root),before,'public selection must not change index bytes or mtime');return result;};
  await t.test('unchanged bytes with aged worktree mtime',t=>{
    const root=mas(t),file=path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md');
    fs.utimesSync(file,new Date('2020-01-01'),new Date('2020-01-01'));
    assert.equal(check(root).checked,0);
  });
  await t.test('content modification',t=>{
    const root=mas(t),file=path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md');
    fs.appendFileSync(file,'\nA real content change.\n');assert.equal(check(root).checked,1);
  });
  await t.test('new untracked document',t=>{
    const root=mas(t);put(root,'_wiki_de_poble/04_escriptori/261117_2200_informe_nou.md','No frontmatter');
    const r=check(root);assert.equal(r.checked,1);assert.equal(r.valid,false);
  });
  await t.test('staging remains authoritative in its strict mode',t=>{
    const root=mas(t),rel='_wiki_de_poble/04_escriptori/00_index_escriptori.md';const raw=fs.readFileSync(path.join(root,rel));
    put(root,rel,'Invalid staging');git(root,'add',rel);fs.writeFileSync(path.join(root,rel),raw);
    assert.equal(check(root).checked,0);assert.equal(checkDocuments(root,{staged:true}).valid,false);
  });
  await t.test('removed tracked document is not read from its old path',t=>{
    const root=mas(t),d=validDoc(root);writeDoc(root,d);git(root,'add','.');git(root,'commit','-qm','document');fs.unlinkSync(path.join(root,d.file));
    assert.equal(check(root).checked,0);
  });
});
