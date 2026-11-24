import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {durableMutation, digest} from '../tooling/lib/mutacio-durable.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = ['8f942f10-1817-4c69-a0aa-8b150e87ad2d', '80fc6d64-9125-45e2-87e6-2c1f5950164b'];
const originals = ids.map(id => JSON.parse(fs.readFileSync(path.join(ROOT, '.agents/seal-transactions', `${id}.json`), 'utf8')));
const clone = value => structuredClone(value);
async function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3290-'));
  fs.mkdirSync(path.join(root, '.agents/seal-transactions'), {recursive: true});
  fs.mkdirSync(path.join(root, '.agents/runtime'), {recursive: true});
  try { await fn(root); } finally { fs.rmSync(root, {recursive: true, force: true}); }
}
const put = (root, entry, name = entry.id) => fs.writeFileSync(path.join(root, '.agents/seal-transactions', `${name}.json`), JSON.stringify(entry));
const log = (root, entries) => fs.writeFileSync(path.join(root, '.agents/runtime/segell.log'), entries.map(e => JSON.stringify(e)).join('\n') + '\n');
const mutate = root => durableMutation(root, [{path: 'result.txt', before: null, content: 'ok'}]);
test('les dues evidències versionades permeten una mutació ordinària sense journal runtime antic', () => fixture(async root => {
  originals.forEach(e => put(root, e));
  await mutate(root); assert.equal(fs.readFileSync(path.join(root, 'result.txt'), 'utf8'), 'ok');
}));
test('les dues seqüències històriques reals passen amb payload terminal exacte', () => fixture(async root => {
  const [a,b] = originals; originals.forEach(e => put(root, e));
  log(root, [{...a,state:'reviewed-recovery'},a,{...b,state:'prepared'},{...b,state:'verified'},b]);
  await mutate(root);
}));
const bad = [
  ['revisió incompleta',0,e=>{delete e.reviewSha256;}],
  ['sessió recuperadora invàlida',1,e=>{e.recoverySession='bad';}],
  ['rebut original buit',1,e=>{e.originalReceipt={};}],
  ['identitat pending alterada amb SHA recalculat',1,e=>{const p=JSON.parse(e.pendingRaw);p.session='bad';e.pendingRaw=JSON.stringify(p);e.pendingSHA=digest(e.pendingRaw);}],
  ['id',0,e=>{e.id='incorrecte';}], ['motiu buit',0,e=>{e.reason='  ';}],
  ['motiu tipus',1,e=>{e.reason={};}], ['origen absent',0,e=>{delete e.recovers;}],
  ['origen propi',0,e=>{e.recovers=e.id;}], ['segell invàlid',0,e=>{e.afterSeal='x';}],
  ['fitxers buits',0,e=>{e.files=[];}], ['fitxers repetits',0,e=>{e.files.push(clone(e.files[0]));}],
  ['ruta traversal',0,e=>{e.files[0].path='../secret';}], ['ruta control',0,e=>{e.files[0].path='bad\npath';}],
  ['hash invàlid',0,e=>{e.files[0].before='x';}], ['estat alié',0,e=>{e.state='reviewed';}],
  ['schema alié',1,e=>{e.schema='sdp.reviewed-recovery.evidence.v2';}],
  ['pending alterat',1,e=>{e.pendingRaw+=' ';}], ['origen divergent',1,e=>{e.originalMutation=e.id;}],
  ['fitxer divergent',1,e=>{e.files[0].after='a'.repeat(64);e.files[0].actual=e.files[0].after;}],
  ['actual divergent',1,e=>{e.files[0].actual='b'.repeat(64);}], ['origen no fallit',1,e=>{e.originalState='accepted';}]
];
for (const [name,index,change] of bad) test(`refusa ${name} abans d’escriure`, () => fixture(async root => {
  const e=clone(originals[index]); change(e); put(root,e,ids[index]);
  await assert.rejects(mutate(root)); assert.equal(fs.existsSync(path.join(root,'result.txt')), false);
}));
test('refusa nom d’evidència divergent', () => fixture(async root => {
  put(root, originals[0], ids[1]); await assert.rejects(mutate(root));
}));
test('refusa terminal històric divergent del journal', () => fixture(async root => {
  put(root, originals[0]); log(root,[{...originals[0],reason:'diferent'}]); await assert.rejects(mutate(root));
}));
test('refusa journal històric encara no terminal', () => fixture(async root => {
  const e=originals[1];put(root,e);log(root,[{...e,state:'prepared'},{...e,state:'verified'}]);await assert.rejects(mutate(root));
}));
test('accepted ordinari sense journal continua refusat', () => fixture(async root => {
  const e={id:ids[0],state:'accepted',files:[{path:'old.txt',before:null,after:'a'.repeat(64)}]};put(root,e);await assert.rejects(mutate(root));
}));
test('accepted ordinari sense preparació continua refusat', () => fixture(async root => {
  const e={id:ids[0],state:'accepted',files:[{path:'old.txt',before:null,after:'a'.repeat(64)}]};put(root,e);log(root,[e]);await assert.rejects(mutate(root));
}));
for (const kind of ['reviewed-recovery','reviewed-interrupted-mutation']) test(`no permet usar ${kind} com mutació nova`, () => fixture(async root => {
  await assert.rejects(durableMutation(root,[{path:'result.txt',before:null,content:'bad'}],{metadata:{kind}}));
  assert.equal(fs.existsSync(path.join(root,'result.txt')),false);
}));
test('metadades prepare tampoc poden reservar tipus històric', () => fixture(async root => {
  await assert.rejects(durableMutation(root,[{path:'result.txt',before:null,content:'bad'}],{prepare:async()=>({metadata:{kind:'reviewed-recovery'}})}));
  assert.equal(fs.existsSync(path.join(root,'result.txt')),false);
}));
