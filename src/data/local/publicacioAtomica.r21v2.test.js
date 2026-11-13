import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
const OWNER='33000000-0000-4000-8000-000000000001',TENANT='11000000-0000-4000-8000-000000000001';
const NOTE='55000000-0000-4000-8000-000000000001',ACT='44000000-0000-4000-8000-000000000001',OP='66000000-0000-4000-8000-000000000001';
const adapters=[];
function node(mode){const a=creaAdaptadorLocal({mode:'local',tenantId:TENANT,persistenciaNotes:mode});adapters.push(a);configuraBackendSessio(a.configuracio);desaSessio({access_token:'testimoni-opac-local',user:{id:OWNER}});return a;}
const descriptor=(revision=0,extra={})=>({id:ACT,noteId:NOTE,operationId:OP,expectedNoteRevision:revision,sectionId:'mur',payload:{title:'Bancal',content:'<p>Primera versió</p>'},...extra});
afterEach(async()=>{await Promise.all(adapters.splice(0).map(a=>a.destroy()));esborraSessio({abast:'tot'});vi.unstubAllGlobals();});
describe.each(['memoria','indexeddb'])('capacitat atòmica absent en adaptador local real (%s)',mode=>{
 test.each([false,true])('descriptor amb consulta=%s es refusa abans de tocar Mur o nota',async consulta=>{
  const idb=creaIdbFalsEstructurat();vi.stubGlobal('indexedDB',idb);const a=node(mode);const note=await a.createNote({id:NOTE,title:'Privada',content:'<p>Privat</p>'});
  const beforeMur=await a.loadMur(), beforeNotes=await a.loadNotes(OWNER,{noteId:NOTE});
  const beforeStore=idb.files('SdpLocalNotes','notes'),operations=[...idb.operacions];
  await expect(a.appendSectionSubmissionNetworkOnly(descriptor(note.revision,{consulta}))).rejects.toMatchObject({code:'no-disponible'});
  expect(idb.operacions).toEqual(operations);expect(idb.files('SdpLocalNotes','notes')).toEqual(beforeStore);
  expect(await a.loadMur()).toEqual(beforeMur);expect(await a.loadNotes(OWNER,{noteId:NOTE})).toEqual(beforeNotes);
 });
 test('consulta d’una operació desconeguda i descriptor incomplet no creen una publicació legacy',async()=>{
  vi.stubGlobal('indexedDB',creaIdbFalsEstructurat());const a=node(mode);const before=await a.loadMur();
  for(const partial of [{consulta:true},{noteId:undefined},{operationId:OP},{expectedNoteRevision:0}]){
   await expect(a.appendSectionSubmissionNetworkOnly({id:ACT,sectionId:'mur',payload:{title:'NO ESCRIURE'},...partial})).rejects.toMatchObject({code:'no-disponible'});
  }
  expect(await a.loadMur()).toEqual(before);
 });
 test.each(['funcio','heretat'])('un descriptor %s tampoc es degrada a publicació legacy',async tipus=>{
  vi.stubGlobal('indexedDB',creaIdbFalsEstructurat());const a=node(mode);const before=await a.loadMur();
  const value=tipus==='funcio'?Object.assign(()=>{},descriptor()):Object.create(descriptor());
  await expect(a.appendSectionSubmissionNetworkOnly(value)).rejects.toMatchObject({code:'no-disponible'});
  expect(await a.loadMur()).toEqual(before);
 });
 test('la publicació legacy sense descriptor manté el contracte i les còpies',async()=>{
  vi.stubGlobal('indexedDB',creaIdbFalsEstructurat());const a=node(mode);
  const saved=await a.appendSectionSubmissionNetworkOnly({id:ACT,sectionId:'mur',payload:{title:'Llegat'}});
  expect(saved.id).toBe(ACT);expect(saved).not.toHaveProperty('nota_revision');saved.payload.title='Mutació de la còpia';
  expect((await a.loadMur()).feedPosts.find(row=>row.id===ACT).title).toBe('Llegat');
 });
});
