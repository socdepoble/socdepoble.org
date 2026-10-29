import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),SCRIPT=path.join(ROOT,'tooling/wiki/llaurador_indexs.mjs');
const INDEX='_wiki_de_poble/00_index.md',NOTE='_wiki_de_poble/02_saber/nota.md',BEGIN='<!-- LLAURADOR:ADOPCIONS:INICI -->',END='<!-- LLAURADOR:ADOPCIONS:FI -->';
function fixture(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-managed-')));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const put=(rel,text)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};put(INDEX,'# Índex\n');put(NOTE,'# Nota\n');const run=(...flags)=>spawnSync(process.execPath,[SCRIPT,`--arrel=${root}`,...flags],{cwd:root,encoding:'utf8',timeout:5000});const read=()=>fs.readFileSync(path.join(root,INDEX),'utf8');return {root,put,run,read};}
function seed(f){const r=f.run('--escriu');assert.equal(r.status,0,r.stderr);const raw=f.read(),a=raw.indexOf(BEGIN),b=raw.indexOf(END)+END.length;return raw.slice(a,b);}
for(const [name,wrap]of [['tilde',b=>'~~~markdown\n'+b+'\n~~~'],['long fence',b=>'````markdown\n```\n'+b+'\n````'],['inline code',b=>'``exemple '+b.replace(/\n/g,' ')+' final``']]){
 test(`bloc d’exemple ${name} no acredita abast i es conserva mentre s’afig un bloc actiu`,t=>{const f=fixture(t),block=seed(f),example=wrap(block);f.put(INDEX,'# Índex\n\n'+example+'\n');const before=f.read();assert.equal(f.run('--check').status,1);assert.equal(f.read(),before);const write=f.run('--escriu');assert.equal(write.status,0,write.stderr);assert.ok(f.read().includes(example));assert.equal(f.run('--check').status,0);const saved=f.read();assert.equal(f.run('--escriu').status,0);assert.equal(f.read(),saved);});
}
test('exemple abans i després d’una regió activa no canvia la parella seleccionada',t=>{const f=fixture(t),block=seed(f),prefix='~~~markdown\n'+block+'\n~~~',suffix='<!-- exemple\n'+block+'\n-->';f.put(INDEX,'# Índex\n\n'+prefix+'\n\n'+block+'\n\n'+suffix+'\n');const r=f.run('--escriu');assert.equal(r.status,0,r.stderr);assert.ok(f.read().includes(prefix));assert.ok(f.read().includes(suffix));assert.equal(f.run('--check').status,0);});
for(const [name,text]of [['duplicate',BEGIN+'\n'+END+'\n'+BEGIN+'\n'+END],['orphan begin',BEGIN],['orphan end',END],['reversed',END+'\n'+BEGIN],['inline', 'prosa '+BEGIN+'\n'+END],['collision','text \ue000']]){
 test(`marques ${name} fallen abans de qualsevol escriptura`,t=>{const f=fixture(t);f.put(INDEX,'# Índex\n'+text+'\n');const before=f.read(),r=f.run('--escriu');assert.notEqual(r.status,0);assert.equal(f.read(),before);});
}
test('marques escapades són literals i no s’usen per tallar ni reemplaçar',t=>{const f=fixture(t),literal='\\'+BEGIN+'\n\\'+END;f.put(INDEX,'# Índex\n'+literal+'\n[[02_saber/nota]]\n');assert.equal(f.run('--check').status,0);const before=f.read();assert.equal(f.run('--escriu').status,0);assert.equal(f.read(),before);});
test('append dins d’una tanca oberta es rebutja abans d’escriure un bloc inactiu',t=>{const f=fixture(t);f.put(INDEX,'# Índex\n~~~markdown\nexemple sense tancament\n');const before=f.read(),r=f.run('--escriu');assert.notEqual(r.status,0);assert.equal(f.read(),before);});
test('retirar la bastida només elimina la regió activa i preserva l’exemple',t=>{const f=fixture(t),block=seed(f),example='~~~markdown\n'+block+'\n~~~';f.put(INDEX,'# Índex\n[[02_saber/nota]]\n\n'+example+'\n\n'+block+'\n');const r=f.run('--escriu');assert.equal(r.status,0,r.stderr);assert.ok(f.read().includes(example));assert.equal(f.read().split(BEGIN).length-1,1);assert.equal(f.run('--check').status,0);});

test('mostra de comentari amb marques internes es conserva sense substituir-la com a regió',t=>{const f=fixture(t),block=seed(f),example='<!-- exemple\n'+block+'\n-->';f.put(INDEX,'# Índex\n\n'+example+'\n');const before=f.read();const r=f.run('--escriu');assert.equal(r.status,0,r.stderr);assert.equal(f.read(),before);});
test('append dins d’un comentari obert es rebutja abans d’escriure',t=>{const f=fixture(t);f.put(INDEX,'# Índex\n<!-- comentari obert\n');const before=f.read(),r=f.run('--escriu');assert.notEqual(r.status,0);assert.equal(f.read(),before);});
test('la línia d’un enllaç real trencat després del bloc conserva l’offset original',t=>{const f=fixture(t);seed(f);const raw=f.read()+'\n[[absent_real]]\n';f.put(INDEX,raw);const result=f.run('--json');assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.penjats.find(p=>p.desti==='absent_real').linia,raw.split('\n').indexOf('[[absent_real]]')+1);});

test('un segon índex invàlid no deixa el primer escrit parcialment',t=>{
 const f=fixture(t),nested='_wiki_de_poble/02_saber/00_index_local.md';
 f.put(INDEX,'# Índex\n');
 f.put(nested,'# Local\n~~~markdown\ntanca oberta\n');
 const before=f.read(),local=fs.readFileSync(path.join(f.root,nested),'utf8');
 const result=f.run('--escriu');
 assert.notEqual(result.status,0,result.stdout+result.stderr);
 assert.equal(f.read(),before);
 assert.equal(fs.readFileSync(path.join(f.root,nested),'utf8'),local);
});
