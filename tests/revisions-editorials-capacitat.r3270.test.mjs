import test from 'node:test';
import assert from 'node:assert/strict';
import {laboratoriRevisions,plain} from './fixtures/revisions-editorials-realms.mjs';
test('C11 · més de 512 edicions locals tenen rebut i recàrrega íntegra',()=>{
 const lab=laboratoriRevisions();try{const a=lab.realm().api;
  for(let n=1;n<=600;n++)a.desaRevisioEditorial('mur','capacitat',{title:`Edició ${n}`});
  assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:capacitat')),true);
  assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur','capacitat')),{title:'Edició 600'});
 }finally{lab.close();}
});
test('C11 · historial pendent es drena després del límit antic sense perdre identitats',()=>{
 const lab=laboratoriRevisions();try{const a=lab.realm().api;
  for(let n=1;n<=530;n++)a.desaRevisioEditorialAmbHistorial('mur','hist',{title:`Hist ${n}`});
  const last=a.historialRevisionsEditorials('mur','hist').at(-1);
  assert.equal(a.historialPersistit(last),true);
  const fresh=lab.realm().api.historialRevisionsEditorials('mur','hist');assert.equal(fresh.at(-1).campsNous.title,'Hist 530');assert.equal(fresh.length,20);
 }finally{lab.close();}
});

import {createHash} from 'node:crypto';
import {laboratoriCapacitat,fullPrefix,uid,sembraOperacions,pla} from './fixtures/revisions-editorials-capacitat.mjs';
import {creaLotEditorial,lligLotEditorial,MAX_CHARS_LOGICS_EDITORIALS} from '../src/data/lotsDiariEditorial.js';
const naked=k=>k.slice('sdp_embed_'.length);
function logical(lab,canal='revisions'){
 const result=new Map();
 for(const [key,raw] of lab.disk){if(!key.startsWith(fullPrefix(canal)))continue;
  const value=JSON.parse(raw);let texts;
  if(key.includes('lot.v1.')){
   let prev='';texts=value.rows.map(([p,s,m])=>{assert(p+s<=prev.length);prev=prev.slice(0,p)+m+(s?prev.slice(-s):'');return prev;});
   assert.equal(texts.length,value.count);assert.equal(texts.reduce((n,s)=>n+s.length,0),value.chars);
   assert.equal(createHash('sha256').update(JSON.stringify([value.prefix,texts])).digest('hex'),value.hash);
  }else texts=[raw];
  for(const text of texts){const op=JSON.parse(text);if(result.has(op.id))assert.equal(result.get(op.id),text);result.set(op.id,text);}
 }return result;
}
function run(name,fn){test(name,()=>{const lab=laboratoriCapacitat();try{return fn(lab);}finally{lab.close();}});}
run('C11 · quatre compactacions consecutives conserven exactament la unió oberta',lab=>{
 const a=lab.realm().api,expected=new Map();
 for(let round=0;round<4;round++){
  sembraOperacions(lab,300,{from:round*300+1});for(const [k,v]of logical(lab))expected.set(k,v);
  a.gestionaDiariEditorial();assert.deepEqual(logical(lab),expected);
  assert([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix())).length<256);
 }
 assert.equal(expected.size,1200);assert.equal(lab.realm().api.revisioEditorial('mur','seed').title,'T1200');
});
run('C11 · dos compactadors superposats i writer intercalat retenen tots els IDs',lab=>{
 sembraOperacions(lab,300);const expected=logical(lab),a=lab.realm().api,b=lab.realm().api;
 let entered=false;lab.hook((phase,key)=>{if(!entered&&phase==='beforeSet'&&key.includes('.lot.v1.')){entered=true;lab.hook(null);b.desaRevisioEditorial('mur','seed',{lead:'B durant compactació'});b.gestionaDiariEditorial();}});
 a.gestionaDiariEditorial();assert(entered);const final=logical(lab);for(const [id,text]of expected)assert.equal(final.get(id),text);
 assert.equal(final.size,301);assert.deepEqual(pla(lab.realm().api.revisioEditorial('mur','seed')),{title:'T300',lead:'B durant compactació'});
});
run('C11 · quota i setItem silenciós del lot no retiren originals; RAM es reintenta',lab=>{
 sembraOperacions(lab,512);const a=lab.realm().api,before=new Map(lab.disk);
 lab.hook((phase,key)=>{if(phase==='beforeSet'&&key.includes('.lot.v1.'))throw new DOMException('quota','QuotaExceededError');});
 a.desaRevisioEditorial('mur','quota',{title:'RAM'});assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:quota')),false);assert.deepEqual(lab.disk,before);
 assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).records[0].entrada.camps.title,'RAM');
 lab.hook((phase,key)=>phase==='beforeSet'&&key.includes('.lot.v1.')?false:undefined);a.gestionaDiariEditorial();assert.deepEqual(lab.disk,before);
 lab.hook(null);assert.equal(a.gestionaDiariEditorial().revisions.complet,true);assert.equal(lab.realm().api.revisioEditorial('mur','quota').title,'RAM');
 assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).total,0);
});
run('C11 · readback del lot fallit deixa originals; retirada reprén sense nou espai',lab=>{
 sembraOperacions(lab,300);const expected=logical(lab),a=lab.realm().api;let deny=null;
 lab.hook((phase,key)=>{if(phase==='afterSet'&&key.includes('.lot.v1.'))deny=key;if(phase==='beforeGet'&&key===deny){deny=null;throw new DOMException('denied','SecurityError');}});
 a.gestionaDiariEditorial();assert.equal([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix())).length,301);assert.deepEqual(logical(lab),expected);
 lab.hook(phase=>{if(phase==='beforeSet')throw new DOMException('quota','QuotaExceededError');});
 a.gestionaDiariEditorial();assert.equal([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix())).length,1);assert.deepEqual(logical(lab),expected);
});
run('C11 · retirada parcial i claus alienes: el contenidor verificat permet reprendre',lab=>{
 sembraOperacions(lab,300);lab.disk.set('alien-key','preserva');const expected=logical(lab),a=lab.realm().api;let removed=0;
 lab.hook(phase=>{if(phase==='beforeRemove'&&++removed>10)throw new DOMException('quota','QuotaExceededError');});
 a.gestionaDiariEditorial();assert.deepEqual(logical(lab),expected);assert.equal(lab.disk.get('alien-key'),'preserva');assert(lab.disk.size>2);
 lab.hook(null);a.gestionaDiariEditorial();assert.deepEqual(logical(lab),expected);assert.equal(lab.disk.size,2);
});
run('C11 · canvi dels bytes capturats es conserva i bloqueja persistència nova',lab=>{
 sembraOperacions(lab,300);const a=lab.realm().api,target=fullPrefix()+uid(1);let changed=false;
 lab.hook((phase,key)=>{if(!changed&&phase==='afterSet'&&key.includes('.lot.v1.')){changed=true;lab.disk.set(target,'{');}});
 const result=a.gestionaDiariEditorial();assert(changed);assert.equal(result.revisions.disponible,false);assert.equal(lab.disk.get(target),'{');
 a.desaRevisioEditorial('mur','pendent',{title:'RAM'});assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:pendent')),false);assert.equal(lab.disk.get(target),'{');
});
run('C11 · duplicate exacte es deduplica; mateix ID divergent falla tancat',lab=>{
 sembraOperacions(lab,300);const original=lab.disk.get(fullPrefix()+uid(1)),a=lab.realm().api;a.gestionaDiariEditorial();
 lab.disk.set(fullPrefix()+uid(1),original);assert.equal(logical(lab).size,300);a.gestionaDiariEditorial();assert.equal([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix())).length,1);
 lab.disk.set(fullPrefix()+uid(1),JSON.stringify({...JSON.parse(original),d:{title:'CONFLICTE'}}));const before=new Map(lab.disk);
 a.desaRevisioEditorial('mur','pendent',{title:'RAM'});assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:pendent')),false);a.gestionaDiariEditorial();assert.deepEqual(lab.disk,before);
});
run('C11 · ACK legacy i referència d’entrada sobreviuen lots; ACK vell no cobrix camp nou',lab=>{
 sembraOperacions(lab,3);const p=fullPrefix();lab.disk.set(p+uid(4),JSON.stringify({v:1,n:4,id:uid(4),k:'mur:seed',t:'a',b:'/'+[1,2,3].map(uid).join('/'),s:{versio:8}}));
 const a=lab.realm().api,entry=a.carregaMapa().get('mur:seed');assert.equal(entry.servidor.versio,8);
 a.gestionaDiariEditorial();assert.equal(a.carregaMapa(true).get('mur:seed'),entry);assert.equal(lab.realm().api.carregaMapa().get('mur:seed').servidor.versio,8);
 const b=lab.realm().api;b.desaRevisioEditorial('mur','seed',{lead:'NOU'});
 const oldMap=a.carregaMapa();oldMap.set('mur:seed',a.marcaConfirmacioRevisio(entry,{versio:9}));a.persisteixMapa(oldMap);
 const fresh=lab.realm().api.carregaMapa().get('mur:seed');assert.equal(fresh.camps.lead,'NOU');assert.equal(fresh.servidor,undefined);
});
run('C11 · historial amb commit però readback perdut es reconeix dins del lot',lab=>{
 sembraOperacions(lab,512,{canal:'historial'});const a=lab.realm().api,b=lab.realm().api;let denied=null,armed=true;
 lab.hook((phase,key)=>{if(armed&&phase==='afterSet'&&key.startsWith(fullPrefix('historial'))&&!key.includes('.lot.v1.')){armed=false;denied=key;}if(phase==='beforeGet'&&key===denied){denied=null;throw new DOMException('denied','SecurityError');}});
 a.desaRevisioEditorialAmbHistorial('mur','one',{title:'First'});lab.hook(null);b.gestionaDiariEditorial();
 assert.equal([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix('historial'))).length,1);
 a.desaRevisioEditorialAmbHistorial('mur','one',{title:'Second'});
 const list=lab.realm().api.historialRevisionsEditorials('mur','one');assert.deepEqual(pla(list.map(e=>e.campsNous.title)),['First','Second']);assert.equal(logical(lab,'historial').size,514);
});
run('C11 · límit lògic material refusa l’operació extra i conserva export/RAM',lab=>{
 const prefix=naked(fullPrefix()),ops=Array.from({length:16384},(_,i)=>JSON.stringify({v:1,n:i+1,id:uid(i+1),k:'mur:seed',t:'p',d:{title:String(i)},at:null}));
 const lot=creaLotEditorial(prefix,ops);lab.disk.set(fullPrefix()+'lot.v1.'+lot.hash,JSON.stringify(lot));
 const a=lab.realm().api,before=new Map(lab.disk);a.desaRevisioEditorial('mur','limitat',{title:'RAM'});
 assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:limitat')),false);assert.deepEqual(lab.disk,before);
 assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).records[0].entrada.camps.title,'RAM');
 const page=a.exportaDiariEditorial({mida:1});assert.equal(page.records.length,1);assert.equal(page.inventariComplet,true);assert.equal(page.records[0].text,[...before.values()][0]);
});
test('C11 · decoder valida dimensions abans d’expandir i SHA no substituïx l’esquema',()=>{
 const prefix='publicacions.revisions.ops.v1.',texts=[JSON.stringify({v:1,n:1,id:uid(1),k:'mur:x',t:'p',d:{title:'Unicode 🏡 à'},at:null})];
 const valid=creaLotEditorial(prefix,texts),key=prefix+'lot.v1.'+valid.hash;
 assert.deepEqual(lligLotEditorial(prefix,key,valid),texts);
 for(const change of [{chars:MAX_CHARS_LOGICS_EDITORIALS+1},{count:16385},{count:0},{hash:'0'.repeat(64)},{rows:[[Number.MAX_SAFE_INTEGER,1,'x']]},{rows:[[0,-1,'x']]},{rows:[[0,0,'x']],chars:1},{extra:true}])assert.throws(()=>lligLotEditorial(prefix,key,{...valid,...change}));
 let touched=false;const bomb={...valid,chars:MAX_CHARS_LOGICS_EDITORIALS+1,get rows(){touched=true;throw Error('expanded');}};
 assert.throws(()=>lligLotEditorial(prefix,key,bomb));assert.equal(touched,false);
});

run('C11 · JSON vàlid amb espais/Unicode conserva els bytes exactes dins del lot',lab=>{
 const prefix=fullPrefix(),one={v:1,n:1,id:uid(1),k:'mur:x',t:'p',d:{title:'à 🏡'},at:null};
 const raw=JSON.stringify(one,null,2)+'\n';lab.disk.set(prefix+uid(1),raw);
 lab.disk.set(prefix+uid(2),JSON.stringify({...one,id:uid(2),n:2,d:{lead:'segon'}}));
 lab.realm().api.gestionaDiariEditorial();assert.equal(logical(lab).get(uid(1)),raw);
});

import {normalitzaGeneracioEditorial,afegeixGeneracioEditorial} from '../src/data/generacionsEditorials.js';
test('C11 · oracle SHA256 independent conserva certificats legacy i resum acotat',()=>{
 const ids=Array.from({length:700},(_,i)=>uid(i+1));let oracle='';
 for(const id of ids)oracle='g1:'+createHash('sha256').update(oracle+'/'+id).digest('hex');
 // Legacy certificates admitted at C8 were bounded to 20k; longer current
 // histories use the 67-character incremental certificate instead.
 const admitted=ids.slice(0,500);let expected='';for(const id of admitted)expected='g1:'+createHash('sha256').update(expected+'/'+id).digest('hex');
 assert.equal(normalitzaGeneracioEditorial('/'+admitted.join('/')),expected);
 assert.equal(ids.reduce((g,id)=>afegeixGeneracioEditorial(g,id),''),oracle);assert.equal(oracle.length,67);
 for(const bad of [null,{},[],true,'/x','g1:'+'x'.repeat(64)])assert.equal(normalitzaGeneracioEditorial(bad),null);
 assert.throws(()=>afegeixGeneracioEditorial('',{toString(){throw Error('coercion');}}),/generation-id/);
});
run('C11 · lots permutats amb 16k IDs iguals es retiren per cobertura sense pèrdua',lab=>{
 const prefix=naked(fullPrefix()),texts=Array.from({length:16384},(_,i)=>JSON.stringify({k:'mur:seed',t:'p',d:{title:'T'},at:null,v:1,id:uid(i+1),n:i+1}));
 let chars=0,count=0;for(let i=0;i<8;i++){
  const ordered=[...texts.slice(i),...texts.slice(0,i)],lot=creaLotEditorial(prefix,ordered),raw=JSON.stringify(lot),key=fullPrefix()+'lot.v1.'+lot.hash;
  if(chars+key.length+raw.length>4*1024*1024)break;chars+=key.length+raw.length;lab.disk.set(key,raw);count++;
 }
 assert(count>=3);const expected=logical(lab),a=lab.realm().api;assert.equal(expected.size,16384);
 a.gestionaDiariEditorial();assert.deepEqual(logical(lab),expected);assert.equal([...lab.disk.keys()].filter(k=>k.startsWith(fullPrefix())).length,1);
});
run('C11 · restauració per ID i tombstones no ressusciten després de compactar historial',lab=>{
 sembraOperacions(lab,300,{canal:'historial'});const a=lab.realm().api;
 a.desaRevisioEditorialAmbHistorial('mur','one',{title:'First'});a.desaRevisioEditorialAmbHistorial('mur','one',{title:'Second'});
 const id=a.identificadorVersioEditorial(a.historialRevisionsEditorials('mur','one')[0]);a.gestionaDiariEditorial();
 const b=lab.realm().api;assert.equal(b.restauraVersioEditorial('mur','one',id).restaurada,true);assert.equal(b.revisioEditorial('mur','one').title,'First');
 assert.equal(b.desferUltimaRevisioEditorial('mur','one').restaurada,true);assert.equal(b.revisioEditorial('mur','one').title,'Second');
 assert.equal(b.restauraVersioEditorial('mur','one',0).restaurada,true);b.gestionaDiariEditorial();
 const c=lab.realm().api;assert.equal(c.revisioEditorial('mur','one'),null);assert.equal(c.historialRevisionsEditorials('mur','one').length,0);
});
run('C11 · removeItem silenciós no acredita espai alliberat; reintent conserva RAM',lab=>{
 sembraOperacions(lab,512);const a=lab.realm().api;
 lab.hook(phase=>phase==='beforeRemove'?false:undefined);
 a.desaRevisioEditorial('mur','pending',{title:'RAM'});assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:pending')),false);
 assert.equal(logical(lab).size,512);assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).records[0].entrada.camps.title,'RAM');
 lab.hook(null);a.gestionaDiariEditorial();assert.equal(lab.realm().api.revisioEditorial('mur','pending').title,'RAM');assert.equal(logical(lab).size,513);
});
test('C11 · un SHA correcte no fa admissible una operació malformada',()=>{
 const prefix=naked(fullPrefix());
 for(const change of [{n:Number.MAX_SAFE_INTEGER+1},{id:{}},{d:{title:'vàlid',origen:'autoritat falsa'}},{extra:true}]){
  const lab=laboratoriCapacitat();try{
   const op={v:1,n:1,id:uid(1),k:'mur:x',t:'p',d:{title:'vàlid'},at:null,...change};
   const lot=creaLotEditorial(prefix,[JSON.stringify(op)]),key=fullPrefix()+'lot.v1.'+lot.hash,raw=JSON.stringify(lot);lab.disk.set(key,raw);
   const a=lab.realm().api;a.desaRevisioEditorial('mur','pending',{title:'RAM'});
   assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:pending')),false);assert.equal(lab.disk.get(key),raw);assert.equal(lab.disk.size,1);
  }finally{lab.close();}
 }
});
run('C11 · quota ACK metadata es conserva fora cache i es drena amb rebut real',lab=>{
 const a=lab.realm().api;a.desaRevisioEditorial('mur','one',{title:'A'});const map=a.carregaMapa(),entry=map.get('mur:one');
 lab.hook((phase,key,value)=>{if(phase==='beforeSet'&&key.includes('.ops.v1.')&&JSON.parse(value).t==='a')throw new DOMException('quota','QuotaExceededError');});
 map.set('mur:one',a.marcaConfirmacioRevisio(entry,{versio:8}));assert.equal(a.persisteixMapa(map),false);
 a.carregaMapa(true);assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).confirmacions.pendents,1);
 lab.hook(null);assert.equal(a.gestionaDiariEditorial().revisions.complet,true);
 assert.equal(lab.realm().api.carregaMapa().get('mur:one').servidor.versio,8);assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).confirmacions.pendents,0);
});
run('C11 · ACK readback perdut+compactació conserva UUID únic i no confirma generació nova',lab=>{
 const a=lab.realm().api,b=lab.realm().api;a.desaRevisioEditorial('mur','one',{title:'A'});const map=a.carregaMapa(),entry=map.get('mur:one');let denied=null,once=true;
 lab.hook((phase,key,value)=>{if(once&&phase==='afterSet'&&key.includes('.ops.v1.')&&JSON.parse(value).t==='a'){once=false;denied=key;}if(phase==='beforeGet'&&key===denied){denied=null;throw new DOMException('denied','SecurityError');}});
 map.set('mur:one',a.marcaConfirmacioRevisio(entry,{versio:8}));assert.equal(a.persisteixMapa(map),false);lab.hook(null);
 const ackIds=[...logical(lab)].filter(([,v])=>JSON.parse(v).t==='a').map(([id])=>id);assert.equal(ackIds.length,1);
 b.gestionaDiariEditorial();b.desaRevisioEditorial('mur','one',{lead:'B nou'});a.gestionaDiariEditorial();
 assert.deepEqual([...logical(lab)].filter(([,v])=>JSON.parse(v).t==='a').map(([id])=>id),ackIds);
 const fresh=lab.realm().api.carregaMapa().get('mur:one');assert.equal(fresh.camps.lead,'B nou');assert.equal(fresh.servidor,undefined);
 assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).confirmacions.pendents,0);
});
run('C11 · cua ACK acotada refusa abans d’acceptar i drena 64 rebuts per passada',lab=>{
 const a=lab.realm().api;a.desaRevisioEditorial('mur','one',{title:'A'});const map=a.carregaMapa();
 for(let n=1;n<=512;n++){const current=map.get('mur:one');map.set('mur:one',a.marcaConfirmacioRevisio(current,{versio:n}));}
 const current=map.get('mur:one');assert.equal(a.marcaConfirmacioRevisio(current,{versio:513}),current);
 let state=a.exportaDiariEditorial({tipus:'pendents',mida:100});assert.equal(state.confirmacions.pendents,512);assert.equal(state.confirmacions.admissionsRefusades,1);assert.equal(state.records.length,100);assert.equal(state.seguent,1);
 for(let pass=1;pass<=8;pass++){
  const result=a.gestionaDiariEditorial();state=a.exportaDiariEditorial({tipus:'pendents'});
  assert.equal(state.confirmacions.pendents,512-pass*64);assert.equal(result.revisions.complet,pass===8);
 }
 assert.equal([...logical(lab)].filter(([,text])=>JSON.parse(text).t==='a').length,512);
 assert.equal(lab.realm().api.carregaMapa().get('mur:one').servidor.versio,512);
});
run('C11 · saturació ACK refusa també una referència durable ja substituïda',lab=>{
 const a=lab.realm().api;a.desaRevisioEditorial('mur','one',{title:'Old'});const stale=a.carregaMapa().get('mur:one');
 a.desaRevisioEditorial('mur','one',{title:'New'});const map=a.carregaMapa();
 for(let n=1;n<=512;n++)map.set('mur:one',a.marcaConfirmacioRevisio(map.get('mur:one'),{versio:n}));
 assert.equal(a.exportaDiariEditorial({tipus:'pendents'}).confirmacions.pendents,512);
 assert.equal(a.marcaConfirmacioRevisio(stale,{versio:9001}),stale);
 const state=a.exportaDiariEditorial({tipus:'pendents'}).confirmacions;assert.equal(state.pendents,512);assert.equal(state.admissionsRefusades,1);
 const fresh=lab.realm().api.carregaMapa().get('mur:one');assert.equal(fresh.camps.title,'New');assert.equal(fresh.servidor,undefined);
});
