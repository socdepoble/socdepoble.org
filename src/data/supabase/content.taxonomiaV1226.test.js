import { beforeEach, expect, test, vi } from 'vitest';
const m=vi.hoisted(() => ({request:vi.fn(),comprova:vi.fn()}));
vi.mock('./runtime.js',() => ({request:m.request,getResolvedConfig:() => ({hasSupabaseConfig:true,tenantId:'11000000-0000-4000-8000-000000000001',runtimeDataMode:'remote'}),getCurrentUser:() => ({id:'33000000-0000-4000-8000-000000000001'}),generateUUID:() => crypto.randomUUID(),buildSeedAppData:vi.fn(),mapContentRowsToData:vi.fn()}));
vi.mock('./xat.js',() => ({enviaMissatge:vi.fn()}));
vi.mock('./copublicacioMur.js',() => ({comprovaPublicacioNoRetirada:(...args) => m.comprova(...args),drenaRevocacionsMur:vi.fn()}));
vi.mock('../identitat.js',async original => ({...await original(),capturaSessio:() => () => {}}));
import { appendSectionSubmissionNetworkOnly } from './content.js';
const sub=() => ({id:'44000000-0000-4000-8000-000000000001',noteId:'55000000-0000-4000-8000-000000000001',operationId:'66000000-0000-4000-8000-000000000001',expectedNoteRevision:7,sectionId:'mur',payload:{title:'Bancal',content:'<p>Cos</p>'}});
beforeEach(() => {m.request.mockReset();m.comprova.mockReset().mockResolvedValue(undefined);});
test('C26-1 · la RPC atòmica rep el destí derivat també en una nota ordinària sense fitxa',async () => {
  const s=sub(), receipt={publicacio:{id:s.id},nota_revision:8,publicada_revision:8,replay:false};
  m.request.mockResolvedValue(receipt);
  expect(await appendSectionSubmissionNetworkOnly(s)).toEqual(receipt);
  expect(m.request.mock.calls[0][2].body.p_payload.payload.categoriesSistema).toEqual(['Mur']);
  expect(s.payload).not.toHaveProperty('categoriesSistema');
});
test('C26-1 · el buidatge explícit falla abans de qualsevol escriptura remota',async () => {
  const s=sub();s.payload.categoriesSistema=[];
  await expect(appendSectionSubmissionNetworkOnly(s)).rejects.toMatchObject({codi:'SDP-TAXONOMIA-DESTI'});
  expect(m.request).not.toHaveBeenCalled();
  const general={id:s.id,operationId:s.operationId,expectedUpdatedAt:null,sectionId:'mur',payload:{title:'No escriure',categoriesSistema:[]}};
  await expect(appendSectionSubmissionNetworkOnly(general)).rejects.toMatchObject({codi:'SDP-TAXONOMIA-DESTI'});
  expect(m.request).not.toHaveBeenCalled();
});
test('C26-1 · consultar un rebut continua sense cos i no crea categories públiques',async () => {
  m.request.mockResolvedValue(null);
  const s={...sub(),consulta:true,payload:{categoriesSistema:[]}};
  expect(await appendSectionSubmissionNetworkOnly(s)).toBeNull();
  expect(m.request.mock.calls[0][2].body.p_payload).toBeNull();
});
