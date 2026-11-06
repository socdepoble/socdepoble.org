import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compilaWikiKarpathy, serialitzaCanonica, LIMITS_COMPILADOR} from '../tooling/wiki/lib/karpathyWikiCompiler.js';
import {estructuraMemoriaOral} from '../src/sections/notes/memoriaOral.js';
const sha = value => createHash('sha256').update(value).digest('hex');
const t = [{slug:'agricultura',name:'Agricultura',useFor:['conreu']},{slug:'festa',name:'Festa',useFor:[]},{slug:'vell',name:'Vell',isDeprecatedSynonym:true}];
const cronica = {id:'cronica-1',tipus:'cronica',titol:'La collita',text:'L’agricultura i el conreu. No era una manifestació festada.'};
const compila = fonts => compilaWikiKarpathy(fonts,{tesaurus:t});
test('determinisme de bytes, ordre de fonts i de claus',async()=>{
 const a=await compila([cronica,{id:'abc',tipus:'cronica',titol:'Festa',text:'Una Festa.'}]);
 const b=await compila([{text:'Una Festa.',titol:'Festa',tipus:'cronica',id:'abc'},{text:cronica.text,titol:cronica.titol,tipus:cronica.tipus,id:cronica.id}]);
 assert.equal(serialitzaCanonica(a),serialitzaCanonica(b));
 assert.deepEqual(a.articles.map(a=>a.id),['abc','cronica-1']);
});
test('integritat SHA de tots els fitxers i preservació de font',async()=>{
 const r=await compila([cronica]);
 assert.deepEqual(JSON.parse(r.fonts[0].json),cronica);
 const files=new Map([[r.articles[0].cami,r.articles[0].markdown],[r.fonts[0].cami,r.fonts[0].json],['index.md',r.index],['log.md',r.registre]]);
 for(const f of r.manifest.fitxers) assert.equal(sha(files.get(f.cami)),f.sha256);
 assert.equal(sha(r.fonts[0].json),r.articles[0].frontmatter.sources[0].sha256);
 assert.equal(sha(serialitzaCanonica(cronica)),r.fonts[0].contingutSha256);
 assert.ok(r.articles[0].markdown.includes(`SHA-256: ${sha(r.fonts[0].json)}`));
});
test('SKOS només coincidència de paraula sencera i termes vigents',async()=>{
 const r=await compila([cronica]);
 assert.deepEqual(r.articles[0].conceptes.map(c=>c.id),['agricultura']);
 assert.deepEqual(r.articles[0].conceptes[0].proves,['Agricultura','conreu']);
});
test('consum real de memoriaOral OKF v0.2, sense heretar verificació',async()=>{
 const fitxa=estructuraMemoriaOral('Al poble recordem les festes i els oficis. L’agricultura era la faena de tota la família i els veïns.');
 const font={id:'oral-1',tipus:'memoria-oral',titol:fitxa.titol,okf:fitxa.okf};
 const r=await compila([font]);
 assert.equal(r.articles[0].frontmatter.status,'draft');
 assert.equal(r.articles[0].frontmatter.visibility,'private');
 assert.equal(r.articles[0].frontmatter.verified,undefined);
 assert.equal(JSON.parse(r.fonts[0].json).okf.cos,fitxa.okf.cos);
});
test('catàleg SKOS real en import diferit',async()=>{
 const r=await compilaWikiKarpathy([{...cronica,text:'Agricultura'}]);
 assert.ok(r.articles[0].conceptes.some(c=>c.id==='agricultura'));
});
test('genealogia conserva només relacions explícites i avisa contradiccions',async()=>{
 const genealogia={persones:[{id:'a',nom:'Joan Ferrer',naixement:1960},{id:'b',nom:'Pere Ferrer',naixement:1940}],relacions:[]};
 let r=await compila([{id:'arbre',tipus:'genealogia',titol:'La casa',genealogia}]);
 assert.deepEqual(JSON.parse(r.fonts[0].json).genealogia.relacions,[]);
 genealogia.relacions.push({tipus:'progenitor',origen:'a',desti:'b',certesa:'falta-confirmar',font:'Testimoni oral'});
 r=await compila([{id:'arbre',tipus:'genealogia',titol:'La casa',genealogia}]);
 assert.equal(r.articles[0].avisos.length,1);
 assert.match(r.articles[0].markdown,/progenitor-no-anterior/);
});
test('no publica HTML ni enllaços injectats des de la font',async()=>{
 const r=await compila([{...cronica,titol:'[Mal](javascript:alert(1))',text:'<script>alert(1)</script>\n# Títol\n[x](javascript:alert(1))'}]);
 assert.ok(!r.articles[0].markdown.includes('<script>'));
 assert.ok(!r.index.includes('[Mal](javascript:'));
 assert.equal(JSON.parse(r.fonts[0].json).text,'<script>alert(1)</script>\n# Títol\n[x](javascript:alert(1))');
});
test('rebutja duplicats, traversal, dades il·legals, cicles i accessors',async()=>{
 await assert.rejects(compila([cronica,cronica]),/duplicada/);
 await assert.rejects(compila([{...cronica,id:'../fora'}]),/invàlida/);
 await assert.rejects(compila([{...cronica,text:''}]),/invàlid/);
 assert.throws(()=>serialitzaCanonica({n:NaN}));
 const cyclic={};cyclic.self=cyclic;assert.throws(()=>serialitzaCanonica(cyclic));
 let called=false;const accessor={get id(){called=true;return 'a';}};
 await assert.rejects(compila([accessor]),/Accessor/);assert.equal(called,false);
});
test('límits de corpus, versió OKF i referències genealògiques',async()=>{
 await assert.rejects(compila(Array.from({length:LIMITS_COMPILADOR.fonts+1},()=>cronica)),/Nombre/);
 await assert.rejects(compila([{...cronica,text:'a'.repeat(LIMITS_COMPILADOR.bytesFont)}]),/massa gran/);
 await assert.rejects(compila([{id:'okf',tipus:'memoria-oral',titol:'Oral',okf:{okf_version:'1.0',frontmatter:{type:'Oral',sources:[{}]},cos:'Relat'}}]),/Versió/);
 await assert.rejects(compila([{id:'arbre',tipus:'genealogia',titol:'Casa',genealogia:{persones:[],relacions:[{tipus:'parella',origen:'a',desti:'b'}]}}]),/Relació/);
});
test('entrada no mutada i corpus buit vàlid',async()=>{
 const before=JSON.stringify(cronica);await compila([cronica]);assert.equal(JSON.stringify(cronica),before);
 const r=await compila([]);assert.equal(r.articles.length,0);assert.equal(r.manifest.fitxers.length,2);
});
test('R15 rebutja accessors d’índexs en corpus i arrays niats sense executar-los',async()=>{
 let calls=0;
 const corpus=[];Object.defineProperty(corpus,'0',{get(){calls++;return cronica;},enumerable:true});
 await assert.rejects(compila(corpus),/Accessor/);assert.equal(calls,0);
 const niat=[];Object.defineProperty(niat,'0',{get(){calls++;return 'font';},enumerable:true});
 await assert.rejects(compila([{...cronica,referencies:niat}]),/Accessor/);assert.equal(calls,0);
});
test('R15 no invoca iteradors, map ni getters d’opcions/tesaurus aportats',async()=>{
 let calls=0;
 const corpus=[cronica];Object.defineProperty(corpus,Symbol.iterator,{get(){calls++;throw new Error('iterador');}});
 await assert.rejects(compila(corpus),/Símbols/);assert.equal(calls,0);
 const altre=[cronica];altre.map=()=>{calls++;throw new Error('map');};
 await assert.rejects(compila(altre),/Propietat/);assert.equal(calls,0);
 const opcions={get tesaurus(){calls++;return t;}};
 await assert.rejects(compilaWikiKarpathy([cronica],opcions),/Accessor/);assert.equal(calls,0);
 const tesaurus=[{slug:'agricultura',get name(){calls++;return 'Agricultura';}}];
 await assert.rejects(compilaWikiKarpathy([cronica],{tesaurus}),/Accessor/);assert.equal(calls,0);
});
test('R15 JSON canònic rebutja arrays dispersos i subclasses amb comportament',()=>{
 assert.throws(()=>serialitzaCanonica(new Array(1)),/buit/);
 class AmbComportament extends Array {}
 assert.throws(()=>serialitzaCanonica(new AmbComportament()),/Objecte JSON/);
});
