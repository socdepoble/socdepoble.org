import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mesuraGraf, duplicatsExactes } from './graf.mjs';
import { accionsWorkspace, estatModul } from './moduls.mjs';
import { findDuplicates } from '../../../../tooling/wiki/contradiction_engine.mjs';
import { zoneOf } from '../../../../tooling/wiki/core/corpus_snapshot.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sdp-audit-proof-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
test('reproducció actual: la porta antiga accepta un cicle inaccessible', t => {
  const root=fixture(t);
  fs.mkdirSync(path.join(root,'.agents'));
  fs.writeFileSync(path.join(root,'.agents/AGENTS.md'),'# Marker');
  fs.mkdirSync(path.join(root,'_wiki_de_poble'));
  for (const [file,text] of Object.entries({'00_index.md':'# Índex','a.md':'[[b]]','b.md':'[[a]]'})) {
    fs.writeFileSync(path.join(root,'_wiki_de_poble',file),text);
  }
  const gate=fileURLToPath(new URL('../../../../tooling/gates/tractor-orfandat.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[gate,`--arrel=${root}`],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(mesuraGraf(['index','a','b'],[['a','b'],['b','a']],['index']).unreachable,['a','b']);
});
test('reproducció actual: el detector semàntic omet les carpetes vigents', async t => {
  const root=fixture(t);
  fs.mkdirSync(path.join(root,'02_saber'));
  const text='---\ntype: document\nstatus: canonic\ndescription: Document sintètic per reproduir omissions de corpus.\n---\n'+('mateixa norma sintètica repetida ací '.repeat(20));
  for (const file of ['a.md','b.md']) fs.writeFileSync(path.join(root,'02_saber',file),text);
  assert.deepEqual(await findDuplicates(root),[]);
  assert.equal(duplicatsExactes([{file:'a',text},{file:'b',text}]).length,1);
});
test('reproducció actual: la classificació antiga no reconeix l’arxiu vigent', () => {
  assert.equal(zoneOf('90_arxiu_historic/prova.md'),'fora_taxonomia');
});

test('un cicle amb entrada però sense camí des de l’índex és inaccessible', () => {
  const graph = mesuraGraf(['index','a','b'], [['a','b'],['b','a']], ['index']);
  assert.deepEqual(graph.orphans, []);
  assert.deepEqual(graph.unreachable, ['a','b']);
});
test('un backlink a l’índex no permet descobrir el document', () => {
  const graph = mesuraGraf(['index','a'], [['a','index']], ['index']);
  assert.deepEqual(graph.unreachable, ['a']);
});
test('l’autoenllaç no cura l’orfandat', () => {
  assert.deepEqual(mesuraGraf(['index','a'], [['a','a']], ['index']).orphans, ['a']);
});
test('un índex real resol descoberta; arestes repetides no inflen la mètrica', () => {
  const graph = mesuraGraf(['index','a'], [['index','a'],['index','a']], ['index']);
  assert.deepEqual(graph.unreachable, []);
  assert.equal(graph.edges, 1);
});
test('arrels absents, nodes repetits, corpus buit i arestes desconegudes fallen', () => {
  assert.throws(() => mesuraGraf([], [], ['index']));
  assert.throws(() => mesuraGraf(['a'], [], ['index']));
  assert.throws(() => mesuraGraf(['a','a'], [], ['a']));
  assert.throws(() => mesuraGraf(['a'], [['a','b']], ['a']));
});
test('la igualtat exacta proposa revisió; la semblança no autoritza una fusió', () => {
  const docs = [{file:'a',text:'norma'}, {file:'b',text:'norma'}, {file:'c',text:'norma amb excepció'}];
  const groups = duplicatsExactes(docs);
  assert.deepEqual(groups[0].files, ['a','b']);
  assert.equal(groups[0].requires_human_decision, true);
  assert.equal(docs.length, 3);
});

const manifest = {id:'notes', requires:['notes.read'], entitlement:null, actions:[
  {id:'sort',kind:'view'}, {id:'create',kind:'write',permission:'notes.create'},
  {id:'invalid',kind:'unknown'}
]};
const context = () => ({enabled:{notes:true},capabilities:new Set(['notes.read']),
  entitlements:new Set(),permissions:new Set(),session:'anonymous'});
test('visitant pot ordenar però no crear; tipus desconegut queda denegat', () => {
  assert.deepEqual(accionsWorkspace(manifest,context(),{ready:true}).map(a=>a.id), ['sort']);
});
test('ser membre autenticat no implica poder escriure', () => {
  assert.equal(accionsWorkspace(manifest,{...context(),session:'authenticated'},{ready:true}).length,1);
});
test('permís explícit, estat de càrrega i escriptura en curs són independents', () => {
  const ctx = {...context(),session:'authenticated',permissions:new Set(['notes.create'])};
  assert.equal(accionsWorkspace(manifest,ctx)[1].disabled,true);
  assert.equal(accionsWorkspace(manifest,ctx,{ready:true})[1].disabled,false);
  const actions=accionsWorkspace(manifest,ctx,{ready:true,busy:true});
  assert.equal(actions[0].disabled,false);
  assert.equal(actions[1].disabled,true);
});
test('mòdul apagat o backend incomplet no exposa accions', () => {
  assert.deepEqual(accionsWorkspace(manifest,{...context(),enabled:{}}),[]);
  assert.equal(estatModul(manifest,{...context(),capabilities:new Set()}),'unavailable');
});
test('una subscripció dona disponibilitat però no permisos d’escriptura', () => {
  const paid={...manifest,entitlement:'gestoria'};
  assert.equal(estatModul(paid,context()),'unsubscribed');
  const ctx={...context(),entitlements:new Set(['gestoria'])};
  assert.deepEqual(accionsWorkspace(paid,ctx,{ready:true}).map(a=>a.id),['sort']);
});
