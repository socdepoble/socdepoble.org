// @vitest-environment node
import {describe,test,expect} from 'vitest';
import {creaProtocolXat,nomPanyFil,publiquesDe,TIPUS_FIL,ROL_EPOCA} from './xifratXatProtocol.js';
const A='00000000-0000-4000-8000-000000000001';
const B='00000000-0000-4000-8000-000000000002';
const FIL='00000000-0000-4000-8000-000000000003';
const gate=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
async function setup(){
 let scope={ambitEstable:'scope-A',actorKey:'actor-A',generacio:0};
 const p=creaProtocolXat({cripto:globalThis.crypto,rellotge:()=>1793318400000,ambit:()=>scope});
 const a=await p.creaIdentitat({usuari:A});const b=await p.creaIdentitat({usuari:B});
 await p.directori.fixa(publiquesDe(a));await p.directori.fixa(publiquesDe(b));
 const estat=p.estatFilNou({fil:FIL,tipusFil:TIPUS_FIL.directe});
 const candidate=await p.creaEpoca({estat,jo:a,membres:[{usuari:A,rol:ROL_EPOCA.membre},{usuari:B,rol:ROL_EPOCA.membre}]});
 return{p,a,estat,candidate,setScope:(next)=>{scope=next;}};
}
describe('QA-C2 · guarda abans de la cua del pany',()=>{
 test('actor canvia mentre espera el pany: rebutja sense avançar estat',async()=>{
  const {p,a,estat,candidate,setScope}=await setup();
  const entered=gate();const release=gate();
  const holding=p.panys.ambPany(nomPanyFil(FIL),async()=>{entered.resolve();await release.promise;});
  await entered.promise;
  const pending=p.aplicaEpoca({estat,jo:a,...candidate}).then(value=>({value}),error=>({error}));
  setScope({ambitEstable:'scope-B',actorKey:'actor-B',generacio:1});
  release.resolve();await holding;
  const outcome=await pending;
  expect(outcome.error).toMatchObject({codi:'ambit-canviat'});
  expect(estat.cap).toBeNull();
 });
 test('control sense canvi: esperar el pany conserva una operació vàlida',async()=>{
  const {p,a,estat,candidate}=await setup();
  const entered=gate();const release=gate();
  const holding=p.panys.ambPany(nomPanyFil(FIL),async()=>{entered.resolve();await release.promise;});
  await entered.promise;
  const pending=p.aplicaEpoca({estat,jo:a,...candidate});
  release.resolve();await holding;
  await expect(pending).resolves.toMatchObject({epoca:1,membre:true});
  expect(estat.cap.epoca).toBe(1);
 });
});
