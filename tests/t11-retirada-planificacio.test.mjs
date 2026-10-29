import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fixture,REPO} from './helpers/documental.mjs';
import {loadContract,resolveRoute,readContract,sha} from '../tooling/documental/core.mjs';
import {openTurn,deliverContext,validateDocument} from '../tooling/documental/turns.mjs';
import {draft} from '../tooling/wiki/document.mjs';
import {rutesDelNom,inspeccionaText} from '../tooling/gates/porta-plantilla-viva.mjs';
import {carregaConfig,paritat,analitzaNom} from '../tooling/gates/porta-taxonomia.mjs';
import {comprovaDestins,projectaDestins} from '../tooling/brain/destins_canonics.mjs';
const DESK='_wiki_de_poble/04_escriptori';
const OLD='_wiki_de_poble/03_actuar/plantilles/pla.md';
const ARCHIVE='_wiki_de_poble/90_arxiu_historic/plantilles_retirades_261029/pla.md';
const OLD_SHA='a9e20c84733e780f1286161ea8505f15f463cde80f4a467ec0a1d8a064d72ddf';
const registry=root=>JSON.parse(fs.readFileSync(path.join(root,'.agents/protocolledge.json'),'utf8'));
const writeRegistry=(root,value)=>fs.writeFileSync(path.join(root,'.agents/protocolledge.json'),JSON.stringify(value));
function document(root,route,file){
 const turn=openTurn(root,{scope:'documents',actor:'test-t15'});
 const delivery=deliverContext(root,turn.turn_id,{route,file});
 const raw=draft(delivery,{title:'Prova de retirada',description:'Evidència portable de compatibilitat en retirar una ruta documental.'}).replaceAll('[pendent]','Resultat comprovat amb evidència.');
 return {root,turn,delivery,file,raw};
}
function legacy(t,name='261029_0608_pla_legacy.md'){
 const root=fixture(t),reg=registry(root),bytes=fs.readFileSync(path.join(REPO,ARCHIVE));
 assert.equal(sha(bytes),OLD_SHA,'arxiu byte-idèntic a la plantilla retirada');
 fs.writeFileSync(path.join(root,OLD),bytes);
 reg.rutes.push({id:'planificacio',plantilla:OLD,tipus:'document',lectures:[],version:'2.0.0',seccions:['Registre','Acte reflex','Historial','Resultat final','Fases','Verificació','Riscos','Vincles'],destins:[DESK],blocsFixos:[]});
 writeRegistry(root,reg);
 const doc=document(root,'planificacio',`${DESK}/${name}`);
 const id=doc.delivery.reflex.split(':').at(-1),turnFile=path.join(root,'.agents/runtime/turns',`${doc.turn.turn_id}.json`);
 const turn=JSON.parse(fs.readFileSync(turnFile,'utf8')),receipt=turn.receipts[id];
 const snapshot=path.join(root,'.agents/runtime/contracts',`${receipt.contractSnapshot}.json`),snapshotBytes=fs.readFileSync(snapshot);
 const retire=()=>{writeRegistry(root,{...reg,rutes:reg.rutes.filter(r=>r.id!=='planificacio')});fs.unlinkSync(path.join(root,OLD));};
 const mutateReceipt=update=>{const value=JSON.parse(fs.readFileSync(turnFile,'utf8'));Object.assign(value.receipts[id],update);fs.writeFileSync(turnFile,JSON.stringify(value));};
 return {...doc,receipt,snapshot,snapshotBytes,retire,mutateReceipt};
}
test('contracte viu té12rutes i rebutja emetre context de planificacio retirada',t=>{
 const root=fixture(t),contract=loadContract(root);assert.equal(contract.router.rutes.length,12);assert.equal(contract.router.rutes.some(r=>r.id==='planificacio'),false);
 assert.throws(()=>resolveRoute(contract,{route:'planificacio'}),/desconeguda/);
 const turn=openTurn(root,{scope:'documents'});assert.throws(()=>deliverContext(root,turn.turn_id,{route:'planificacio',file:`${DESK}/261029_0608_pla_nou.md`}),/desconeguda/);
});
test('noms pla i pla_implementacio nous resolen únicament al contracte canònic',t=>{
 for(const name of ['261029_0608_pla_nou.md','261029_0608_pla_implementacio_nou.md']){
  assert.deepEqual(rutesDelNom(name),['pla.implementacio']);const root=fixture(t),d=document(root,'pla.implementacio',`${DESK}/${name}`);
  assert.deepEqual(inspeccionaText(root,d.file,d.raw).errors,[]);assert.deepEqual(validateDocument(root,d.raw,d.file),[]);
 }
 assert.deepEqual(rutesDelNom('pla_director.md'),['pla.implementacio']);
});
test('retirada conserva bytes i validesa del snapshot d’un rebut legacy ja emés',t=>{
 const d=legacy(t);assert.deepEqual(inspeccionaText(d.root,d.file,d.raw).errors,[]);d.retire();
 assert.equal(fs.existsSync(path.join(d.root,OLD)),false);assert.deepEqual(inspeccionaText(d.root,d.file,d.raw).errors,[]);
 assert.deepEqual(validateDocument(d.root,d.raw,d.file),[]);assert.deepEqual(fs.readFileSync(d.snapshot),d.snapshotBytes);
 assert.equal(readContract(d.root,d.receipt.contractSnapshot).router.rutes.some(r=>r.id==='planificacio'),true);
});
test('compatibilitat legacy no accepta snapshot absent o corrupte',t=>{
 for(const mode of ['absent','corrupte']){const d=legacy(t);d.retire();if(mode==='absent')fs.unlinkSync(d.snapshot);else fs.appendFileSync(d.snapshot,'alterat');
  const r=inspeccionaText(d.root,d.file,d.raw);assert.ok(r.errors.length,mode);assert.ok(r.errors.some(e=>e.includes('contracte del rebut')),r.errors.join('\n'));
 }
});
test('versió o hash de plantilla divergents no obtenen l’excepció legacy',t=>{
 for(const update of [{routeVersion:'999.0.0'},{templateHash:'0'.repeat(64)}]){const d=legacy(t);d.retire();d.mutateReceipt(update);
  assert.ok(inspeccionaText(d.root,d.file,d.raw).errors.some(e=>e.startsWith('ruta:')));assert.ok(validateDocument(d.root,d.raw,d.file).some(e=>e.includes('Plantilla del rebut canviada')));
 }
});
test('ruta legacy sota nom pla_implementacio continua sent incoherent',t=>{
 const d=legacy(t,'261029_0608_pla_implementacio_legacy.md');d.retire();assert.ok(inspeccionaText(d.root,d.file,d.raw).errors.some(e=>e.startsWith('ruta:')));
});
test('acta2.1.0 nova nega Escriptori i accepta només10_actes',t=>{
 const root=fixture(t),contract=loadContract(root),route=resolveRoute(contract,{route:'acta'});assert.equal(route.version,'2.1.0');assert.deepEqual(route.destins,['_wiki_de_poble/10_actes']);
 const turn=openTurn(root,{scope:'documents'});assert.throws(()=>deliverContext(root,turn.turn_id,{route:'acta',file:`${DESK}/261029_0608_acta_nova.md`}),/Destí/);
 const d=document(root,'acta','_wiki_de_poble/10_actes/261029_0608_acta_nova.md');assert.deepEqual(validateDocument(root,d.raw,d.file),[]);
});
test('solucio i pla conserven paritat taxonòmica i projecció de12destinacions',()=>{
 const config=carregaConfig(REPO);assert.equal(config.categories.pla,'pla.implementacio');assert.match(config.categories.solucio,/transitòria/);
 assert.deepEqual(paritat(REPO,config),{valid:true,errors:[]});assert.equal(analitzaNom('261029_0608_solucio_t11.patch',config,{ara:new Date('2026-10-29T06:08:00Z')}).valid,true);
 const projection=projectaDestins(registry(REPO));assert.equal(projection.rutes.length,12);assert.equal(projection.rutes.some(r=>r.id==='planificacio'),false);assert.deepEqual(comprovaDestins(REPO),{ok:true,errors:[]});
});
test('snapshot amb digest correcte però router malformat dona errors, sense excepció del gate',t=>{
 for(const router of [undefined,{rutes:'no-es-una-llista'}]){
  const d=legacy(t);d.retire();const snapshot=JSON.parse(d.snapshotBytes.toString());
  if(router===undefined)delete snapshot.router;else snapshot.router=router;
  const raw=JSON.stringify(snapshot),digest=sha(raw);
  fs.writeFileSync(path.join(d.root,'.agents/runtime/contracts',`${digest}.json`),raw);d.mutateReceipt({contractSnapshot:digest});
  let report;assert.doesNotThrow(()=>{report=inspeccionaText(d.root,d.file,d.raw);});assert.ok(report.errors.length);
 }
});
