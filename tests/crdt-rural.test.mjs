import test from 'node:test';
import assert from 'node:assert/strict';
import * as crdt from '../src/data/crdtRural.js';
const note=(content,title='Títol')=>({title,content,slug:'nota',folderId:'camp',tags:[],prioritat:'normal',updatedAt:'2026-11-03T00:00:00Z'});
const empty=()=>crdt.estatCrdtRuralBuit();
const change=(base,replica,comptador,content,title)=>crdt.canviaCrdtRural(base,{id:'nota',replica,comptador,nota:note(content,title)});
const join=(...states)=>states.reduce((a,b)=>crdt.fusionaCrdtRural(a,b),empty());
const text=s=>crdt.projectaCrdtRural(s).notes[0]?.content;

test('RGA real preserva insercions concurrents sense còpies de conflicte',()=>{
 const genesis=change(empty(),'base',1,'abc');
 const a=change(genesis,'A',1,'aXbc'),b=change(genesis,'B',1,'abYc');
 const s=join(genesis,a,b);assert.equal(text(s),'aXbYc');assert.equal(crdt.projectaCrdtRural(s).notes.length,1);
 assert.equal(a.ops.length,1);assert.ok(JSON.stringify(a).length<1000);
});

test('join commutatiu, associatiu, idempotent en permutacions i particions',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'aXbc'),b=change(g,'B',1,'abYc'),c=change(g,'C',1,'abcZ');
 const all=[g,a,b,c], expected=join(...all);
 function perms(xs){if(!xs.length)return [[]];return xs.flatMap((x,i)=>perms(xs.filter((_,j)=>j!==i)).map(t=>[x,...t]));}
 for(const p of perms(all)){assert.deepEqual(join(...p),expected);assert.deepEqual(join(join(p[0],p[1]),join(p[2],p[3])),expected);}
 assert.deepEqual(join(expected,expected),expected);
});

test('orphans fora d’ordre es conserven i s’activen quan arriben predecessors/àncores',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'aXbc'),s=join(g,a),b=change(s,'B',1,'aXYbc');
 const pending=join(b,a);assert.equal(crdt.projectaCrdtRural(pending).pendents,2);assert.equal(crdt.projectaCrdtRural(pending).notes.length,0);
 assert.equal(text(join(pending,g)),'aXYbc');
});

test('el comptador del mateix escriptor no implica observació d’un formulari vell',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'aXbc'),b=change(g,'A',2,'abYc');
 assert.equal(text(join(g,a,b)),'aXbYc');
 const ta=change(g,'A',3,'abc','Títol A'),tb=change(g,'A',4,'abc','Títol B');
 assert.deepEqual(crdt.projectaCrdtRural(join(g,ta,tb)).notes[0].variants.title.sort(),['Títol A','Títol B']);
});

test('replace i delete concurrents conserven els caràcters no observats; delete causal sí elimina',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'TEXT NOU');
 const d=crdt.canviaCrdtRural(g,{id:'nota',replica:'D',comptador:1,elimina:true});
 assert.equal(text(join(g,a,d)),'TEXT NOU');
 const merged=join(g,a,d),later=crdt.canviaCrdtRural(merged,{id:'nota',replica:'D',comptador:2,elimina:true});
 assert.equal(crdt.projectaCrdtRural(join(merged,later)).notes.length,0);
 assert.equal(crdt.projectaCrdtRural(join(merged,later)).esborrades.length,1);
});

test('DOT equivocation, getters, cicles i referències falses fallen tancats',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'aXbc'),other=change(g,'A',1,'aQbc');
 assert.throws(()=>join(g,a,other));
 let getters=0;const accessor=Object.defineProperty({},'ops',{get(){getters++;return [];},enumerable:true});assert.throws(()=>crdt.fusionaCrdtRural(empty(),accessor));assert.equal(getters,0);
 const c={};c.self=c;assert.throws(()=>crdt.fusionaCrdtRural(empty(),c));
 const forged=structuredClone(a);forged.ops[0].insert.after=['unknown:1',0];assert.throws(()=>join(g,forged));
});


test('editar text no resol implícitament metadades concurrents; resolució explícita sí',()=>{
 const g=change(empty(),'base',1,'abc'),a=change(g,'A',1,'abc','A'),b=change(g,'B',1,'abc','B');
 const merged=join(g,a,b),n=crdt.projectaCrdtRural(merged).notes[0];
 const c=change(merged,'C',1,'abcX',n.title),actual=join(merged,c);
 assert.deepEqual(crdt.projectaCrdtRural(actual).notes[0].variants.title.sort(),['A','B']);
 const d=crdt.canviaCrdtRural(actual,{id:'nota',replica:'C',comptador:2,nota:note('abcX',n.title),resol:['title']});
 assert.equal(crdt.projectaCrdtRural(join(actual,d)).notes[0].variants.title,undefined);
});


test('un text unit de més de 20.000 caràcters admet una edició xicoteta sense truncament',()=>{
 const g=change(empty(),'base',1,'a'.repeat(12000));const a=change(g,'A',1,'a'.repeat(12000)+'X'.repeat(6000)),b=change(g,'B',1,'a'.repeat(12000)+'Y'.repeat(6000));
 const merged=join(g,a,b),old=text(merged);assert.equal(old.length,24000);const delta=change(merged,'C',1,old+'Z');assert.equal(text(join(merged,delta)),old+'Z');assert.ok(JSON.stringify(delta).length<1500);
});
