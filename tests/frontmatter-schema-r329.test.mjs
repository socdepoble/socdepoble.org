/** R32.9: run the real independent tractor against disposable JSON-schema/YAML corpora. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const tractor=fileURLToPath(new URL('../tooling/wiki/tractor-frontmatter.mjs',import.meta.url));
const canonical=JSON.parse(fs.readFileSync(new URL('../tooling/wiki/schema.json',import.meta.url),'utf8'));
function run(t,{lines='',changeSchema=()=>{}}={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'r329-frontmatter-schema-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const put=(rel,text)=>{fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),text);};
 const schema=structuredClone(canonical);changeSchema(schema);put('tooling/wiki/schema.json',JSON.stringify(schema));put('.agents/AGENTS.md','# Fixture');
 for(const [name,extra,link] of [['a',lines,'b'],['b','','a']]) put(`docs/${name}.md`,`---\ntype: document\nstatus: actiu\ndescription: Document sintètic per a verificar l’esquema de frontmatter.\n${extra}---\n# ${name}\n\n## Vincles\n\n- [[${link}]]\n`);
 const before=fs.readFileSync(path.join(root,'docs/a.md'));const r=spawnSync(process.execPath,[tractor,`--arrel=${root}`,'--arrels=docs','--json','--estricte'],{cwd:root,encoding:'utf8',timeout:10000,env:Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('GIT_')))});
 assert.equal(r.error,undefined);assert.deepEqual(fs.readFileSync(path.join(root,'docs/a.md')),before,'default annotations must not rewrite the document');
 return {...r,data:r.stdout.trim()?JSON.parse(r.stdout):null};
}
const f7=r=>r.data?.fallades.F7.filter(x=>x.n==='docs/a.md')??[];

test('canonical schema accepts both revision endpoints and mur booleans',t=>{
 for(const lines of ['revisions: 0\nmur: false\n','revisions: 9007199254740991\nmur: true\n']) {const r=run(t,{lines});assert.equal(r.status,0,r.stderr);assert.deepEqual(f7(r),[]);}
});
test('canonical revisions reject negative, overflow and fractional values',t=>{
 for(const value of ['-1','9007199254740992','1.5']) {const r=run(t,{lines:`revisions: ${value}\n`});assert.equal(r.status,1,r.stderr);assert.ok(f7(r).some(x=>x.clau==='revisions'));}
});
test('default is an inert annotation and never supplies a required missing value',t=>{
 let r=run(t,{lines:''});assert.equal(r.status,0,r.stderr);assert.deepEqual(f7(r),[]);
 r=run(t,{changeSchema:s=>s.required.push('mur')});assert.equal(r.status,1,r.stderr);assert.ok(r.data.fallades.F1.some(x=>x.n==='docs/a.md'&&x.clau==='mur'));
});
test('default never permits an invalid explicit value',t=>{
 const r=run(t,{lines:'mur: "false"\n'});assert.equal(r.status,1,r.stderr);assert.ok(f7(r).some(x=>x.clau==='mur'));
});
test('number ranges support finite decimals and enforce inclusive limits',t=>{
 const changeSchema=s=>s.properties.prova={type:'number',minimum:-1.5,maximum:2.5};
 for(const value of ['-1.5','2.5','2e0']) {const r=run(t,{lines:`prova: ${value}\n`,changeSchema});assert.equal(r.status,0,r.stderr);}
 for(const value of ['-1.6','2.6','1e309','"1"']) {const r=run(t,{lines:`prova: ${value}\n`,changeSchema});assert.equal(r.status,1,r.stderr);assert.ok(f7(r).some(x=>x.clau==='prova'));}
});
test('range keywords apply to numeric array items as well as scalar properties',t=>{
 const changeSchema=s=>s.properties.prova={type:'array',items:{type:'integer',minimum:0,maximum:2,default:1}};
 let r=run(t,{lines:'prova: [0, 2]\n',changeSchema});assert.equal(r.status,0,r.stderr);
 r=run(t,{lines:'prova: [-1, 3]\n',changeSchema});assert.equal(r.status,1,r.stderr);assert.equal(f7(r).filter(x=>x.clau==='prova[]').length,2);
});
test('unknown scalar and item keywords still fail closed',t=>{
 for(const changeSchema of [s=>s.properties.revisions.multipleOf=2,s=>s.properties.tags.items.unknown=true]) {const r=run(t,{changeSchema});assert.equal(r.status,2);assert.match(r.stderr,/no sap fer complir/);}
});
test('invalid, nonnumeric and inverted schema limits fail closed before scanning data',t=>{
 for(const changeSchema of [s=>s.properties.revisions.minimum='0',s=>s.properties.revisions.maximum=null,s=>s.properties.mur.minimum=0,s=>{s.properties.revisions.minimum=2;s.properties.revisions.maximum=1;}]) {const r=run(t,{changeSchema});assert.equal(r.status,2);assert.match(r.stderr,/numèric|numèrics/);}
});
