import {webcrypto} from 'node:crypto';
import {creaCuaOperacionsOffline} from '../src/data/cuaOperacionsOffline.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {creaMagatzemAtomicRural,creaPersistenciaLocalRural} from '../src/data/persistenciaLocalRural.js';
import {CarpetaFalsa,instantaniaFalsa} from './helpers/carpetaLocalFalsa.js';
import {creaBloquejosOpfsFalsos} from './helpers/bloquejosOpfsFalsos.js';
const abast={persona:'INTERNAL_ACCOUNT_SENTINEL',tenant:'torre',endpoint:'seed',mode:'seed'};
const setup=()=>{const root=new CarpetaFalsa('opfs'),locks=creaBloquejosOpfsFalsos();return{root,locks,opcions:{abast,motor:'opfs',storage:{getDirectory:async()=>root},locks}};};
const error=code=>e=>e.code===code;
test('OPFS opt-in no simula memòria ni ignora absència de Web Locks',async()=>{
 for(const extra of [{storage:null},{locks:null}]){const {opcions}=setup();const s=creaMagatzemAtomicRural({...opcions,...extra});try{await assert.rejects(s.read('x'),e=>['SDP-RURAL-NO-OPFS','SDP-RURAL-NO-LOCKS'].includes(e.code));}finally{s.close();}}
});
test('OPFS dos escriptors compartixen CAS i batch exclusiu sense trepitjar actualitzacions',async t=>{
 const {opcions,locks,root}=setup(),a=creaMagatzemAtomicRural(opcions),b=creaMagatzemAtomicRural(opcions);t.after(()=>{a.close();b.close();});
 const results=await Promise.all([a.compareAndSwap('x',0,{revision:1,value:'A'}),b.compareAndSwap('x',0,{revision:1,value:'B'})]);assert.equal(results.filter(Boolean).length,1);
 await Promise.all(Array.from({length:12},(_,i)=>(i%2?a:b).actualitzaLot(['counter'],s=>({next:{counter:{revision:(s.counter?.revision??0)+1,value:(s.counter?.value??0)+1}},value:true}))));
 assert.equal((await a.read('counter')).value,12);assert.equal(locks.maxActius,1);assert.equal(root.fills.size,1);assert.equal([...root.fills.keys()].some(k=>k.includes(abast.persona)),false);
});
test('OPFS write/close quota deixa tot el batch anterior intacte i no fabrica ACK',async t=>{
 const {opcions,root}=setup(),s=creaMagatzemAtomicRural(opcions);t.after(()=>s.close());
 await s.actualitzaLot(['a','b'],()=>({next:{a:{revision:1,text:'A'},b:{revision:1,text:'B'}},value:true}));
 const before=instantaniaFalsa(root);root.injectaFallada('close',{error:new DOMException('Quota','QuotaExceededError'),vegades:1});
 await assert.rejects(s.actualitzaLot(['a','b'],()=>({next:{a:null,b:{revision:2,text:'new'}},value:{ack:true}})),error('SDP-RURAL-QUOTA'));
 assert.deepEqual(instantaniaFalsa(root),before);assert.equal((await s.read('a')).text,'A');assert.equal((await s.read('b')).text,'B');
});
test('OPFS avortament/close abans commit desfà batch i allibera pany',async t=>{
 const {opcions}=setup(),s=creaMagatzemAtomicRural(opcions),b=creaMagatzemAtomicRural(opcions);t.after(()=>{s.close();b.close();});
 await s.compareAndSwap('x',0,{revision:1});const ctrl=new AbortController();
 await assert.rejects(s.actualitzaLot(['x'],()=>{ctrl.abort();return{next:{x:{revision:2}},value:true};},{signal:ctrl.signal}),e=>e.name==='AbortError');
 assert.equal((await b.read('x')).revision,1);
 await assert.rejects(s.actualitzaLot(['x'],()=>{s.close();return{next:{x:null},value:true};}),e=>['SDP-RURAL-TANCAT','SDP-RURAL-CANCEL'].includes(e.code));assert.equal((await b.read('x')).revision,1);
});
test('OPFS purga atòmica invalida generació antiga i no toca altre tenant',async t=>{
 const {opcions}=setup(),s=creaMagatzemAtomicRural(opcions),other=creaMagatzemAtomicRural({...opcions,abast:{...abast,tenant:'B'}});t.after(()=>{s.close();other.close();});
 await s.actualitzaLot(['device','notes','queue'],()=>({next:{device:{revision:1,id:'A'},notes:{revision:1,text:'privat'},queue:{revision:1,text:'pending'}},value:true}));await other.compareAndSwap('notes',0,{revision:1,text:'other'});
 const old=creaMagatzemAtomicRural({...opcions,generacio:{clau:'device',id:'A'}});t.after(()=>old.close());
 await s.actualitzaLot(['device','notes','queue'],st=>({next:{device:{revision:st.device.revision+1,id:'B'},notes:null,queue:null},value:true}));
 await assert.rejects(old.compareAndSwap('notes',0,{revision:1,text:'resurrect'}),error('SDP-RURAL-GENERACIO'));assert.equal(await s.read('notes'),null);assert.equal((await other.read('notes')).text,'other');
});
test('OPFS la persistència de col·leccions usa el mateix motor i no queda en memòria',async t=>{
 const {opcions}=setup(),a=creaPersistenciaLocalRural(opcions);await a.desa('notes',[{id:'nota',content:'durable'}]);a.close();
 const b=creaPersistenciaLocalRural(opcions);t.after(()=>b.close());assert.equal((await b.llegix('notes'))[0].content,'durable');
});


test('la cua directa OPFS conserva intents en reobrir i no perd el motor explícit',async t=>{
 const {opcions}=setup(),q=creaCuaOperacionsOffline({...opcions,nodeId:'replica-opfs',crypto:webcrypto});
 await q.enqueueOfflineMutation({resource:'rural.crdt',recordId:'nota',action:'update',changes:{delta:{ops:[]}}});q.close();
 const b=creaCuaOperacionsOffline({...opcions,nodeId:'replica-opfs',crypto:webcrypto});t.after(()=>b.close());assert.equal((await b.peekOfflineQueue()).entries.length,1);
});
