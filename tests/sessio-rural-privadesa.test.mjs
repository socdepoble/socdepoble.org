import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { creaSessioRural } from '../src/data/sessioRural.js';
import { creaIdbFalsEstructurat } from './helpers/idbFalsEstructurat.js';
import { descodificaBase58Btc, descodificaBase64Url } from '../src/data/federacio/portabilitatFediversity.js';
import { verificaDeltaEmergenciaRural } from '../src/data/pontEmergenciaRural.js';
const abast = { persona:'INTERNAL_ACCOUNT_SENTINEL',tenant:'torre',endpoint:'seed',mode:'seed' };
const opts = { abast, municipi:'La Torre de les Maçanes',crypto:webcrypto,ara:()=>Date.parse('2026-11-03T16:00:00Z'),BroadcastChannel:null };
async function obri(t,extra={}) { const s=await creaSessioRural({...opts,...extra});t.after(()=>s.close());return s; }

test('publica només pseudònim i did:key de la clau signant, mai UUID del compte ni actor inventat', async t=>{
 const s=await obri(t,{motor:'memoria',memoria:new Map()});await s.desaNota({title:'Font',content:'Aigua'});
 const {delta,publicKeyJwk}=await s.exportaDelta();
 assert.equal(JSON.stringify(delta).includes(abast.persona),false);assert.equal(delta.operacions[0].autor,'Dispositiu local');
 assert.match(delta.nodeOrigenId,/^did:key:z6Mk/);const fp=delta.nodeOrigenId.slice(8);
 assert.equal(delta.proof.verificationMethod,`${delta.nodeOrigenId}#${fp}`);const raw=descodificaBase58Btc(fp.slice(1));
 assert.deepEqual([...raw.slice(0,2)],[0xed,1]);assert.deepEqual(raw.slice(2),descodificaBase64Url(publicKeyJwk.x));
 assert.equal((await verificaDeltaEmergenciaRural(delta,{publicKeyJwk,ara:opts.ara()})).valid,true);assert.equal(publicKeyJwk.d,undefined);
});
test('consolida una cua plena local sense ACKremot, preserva notes i permet continuar',async t=>{
 const memoria=new Map();const s=await obri(t,{motor:'memoria',memoria,maxOperacionsCua:2});const antic=await obri(t,{motor:'memoria',memoria});
 await s.desaNota({title:'A',content:'Una'});await s.desaNota({title:'B',content:'Dues'});
 await assert.rejects(s.desaNota({title:'C',content:'Tres'}),{code:'RURAL_DIARI_PLE'});
 const anterior=await s.estat();const nou=await s.consolidaDiari();assert.equal(nou.pendents,0);assert.equal(nou.notes.length,2);assert.equal(nou.bans.length,2);
 assert.deepEqual(nou.notes.map(n=>n.content),anterior.notes.map(n=>n.content));
 await assert.rejects(antic.desaNota({title:'Vella',content:'No ressuscita'}),e=>e.code==='SDP-RURAL-GENERACIO');
 await s.desaNota({title:'C',content:'Tres'});assert.equal((await s.estat()).notes.length,3);
 const reobert=await obri(t,{motor:'memoria',memoria});assert.equal((await reobert.estat()).notes.length,3);
});
test('purga IndexedDB atòmica i acotada, claus anteriors inservibles i altre compte intacte',async t=>{
 const indexedDB=creaIdbFalsEstructurat();const s=await obri(t,{indexedDB});const antic=await obri(t,{indexedDB});
 const altre=await obri(t,{indexedDB,abast:{...abast,persona:'ALTRE_COMPTE'}});
 await s.desaNota({title:'PRIVATE_NOTE_SENTINEL',content:'Només ací'});await altre.desaNota({title:'Altra',content:'Es conserva'});
 await s.esborraTot();await assert.rejects(antic.estat(),e=>e.code==='SDP-RURAL-GENERACIO');
 const reobert=await obri(t,{indexedDB});assert.equal((await reobert.estat()).notes.length,0);assert.equal((await altre.estat()).notes.length,1);
 assert.equal(JSON.stringify(indexedDB.files('sdp-rural-v1','estat')).includes('PRIVATE_NOTE_SENTINEL'),false);
});
test('quota en checkpoint avorta projecció i rotació: el diari anterior continua íntegre',async t=>{
 const indexedDB=creaIdbFalsEstructurat();const s=await obri(t,{indexedDB});await s.desaNota({title:'A',content:'Queda'});
 const abans=await s.estat();indexedDB.omplit=true;await assert.rejects(s.consolidaDiari());indexedDB.omplit=false;
 assert.deepEqual(await s.estat(),abans);assert.equal((await s.consolidaDiari()).pendents,0);
});
test('purga durant generació de claus impedeix retornar un delta amb notes ja esborrades',async t=>{
 let resol,cridat;const obert=new Promise(r=>cridat=r),gate=new Promise(r=>resol=r);
 const crypto={randomUUID:()=>webcrypto.randomUUID(),subtle:new Proxy(webcrypto.subtle,{get(target,key){if(key==='generateKey')return async(...args)=>{cridat();await gate;return target.generateKey(...args);};const v=target[key];return typeof v==='function'?v.bind(target):v;}})};
 const memoria=new Map();const s=await obri(t,{motor:'memoria',memoria,crypto});const altre=await obri(t,{motor:'memoria',memoria});
 await s.desaNota({title:'Privada',content:'No ha d’eixir després'});const exportacio=s.exportaDelta();await obert;await altre.esborraTot();resol();
 await assert.rejects(exportacio,e=>e.code==='SDP-RURAL-GENERACIO');
});

test('còpia pròpia de1001 notes després de consolidar és restaurable, sense injectar estat',async t=>{
 const {exportaPaquetVaultFallback}=await import('../src/data/sincronitzadorCarpetaLocal.js');
 const notes=Array.from({length:1000},(_,i)=>({id:`nota-${i}`,slug:`nota-${i}`,title:`Nota ${i}`,content:'Text',updatedAt:'2026-11-03T16:00:00Z',folderId:'camp',tags:[]}));
 const s=await obri(t,{motor:'memoria',memoria:new Map()});
 await s.importaVault(exportaPaquetVaultFallback({notesApp:notes}));await s.desaNota({title:'1001',content:'Última'});await s.consolidaDiari();
 const paquet=await s.exportaVault();assert.equal(Object.keys(paquet.fitxers).length,1001);
 const altre=await obri(t,{motor:'memoria',memoria:new Map()});assert.equal((await altre.importaVault(paquet)).notes.length,1001);
});
