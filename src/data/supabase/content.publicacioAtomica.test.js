import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(()=>({request:vi.fn(),user:'33000000-0000-4000-8000-000000000001',session:1,comprova:vi.fn()}));
vi.mock('./runtime.js',()=>({request:m.request,getResolvedConfig:()=>({hasSupabaseConfig:true,tenantId:'11000000-0000-4000-8000-000000000001',runtimeDataMode:'remote'}),getCurrentUser:()=>({id:m.user}),generateUUID:()=>crypto.randomUUID(),buildSeedAppData:vi.fn(),mapContentRowsToData:vi.fn()}));
vi.mock('./xat.js',()=>({enviaMissatge:vi.fn()}));
vi.mock('./copublicacioMur.js',()=>({comprovaPublicacioNoRetirada:(...args)=>m.comprova(...args),drenaRevocacionsMur:vi.fn()}));
vi.mock('../identitat.js',async original=>({...await original(),capturaSessio:()=>{const entry=m.session;return()=>{if(entry!==m.session)throw new DOMException('Sessió canviada.','AbortError');};}}));
import { appendSectionSubmissionNetworkOnly } from './content.js';
const sub = () => ({id:'44000000-0000-4000-8000-000000000001',noteId:'55000000-0000-4000-8000-000000000001',operationId:'66000000-0000-4000-8000-000000000001',expectedNoteRevision:7,sectionId:'mur',payload:{title:'Bancal',content:'<p>Cos</p>'},actor:{tipus:'entitat',id:'77000000-0000-4000-8000-000000000001'}});
beforeEach(()=>{m.request.mockReset();m.comprova.mockReset().mockResolvedValue(undefined);m.session=1;m.user='33000000-0000-4000-8000-000000000001';});
test('una sola RPC confirma inserció i vincle; l’entitat viatja com a columna validada',async()=>{
 const s=sub();const receipt={publicacio:{id:s.id},nota_revision:8,publicada_revision:8,replay:false};m.request.mockResolvedValue(receipt);
 expect(await appendSectionSubmissionNetworkOnly(s)).toEqual(receipt);
 expect(m.request).toHaveBeenCalledExactlyOnceWith('/rest/v1/rpc/publica_nota_al_mur',{}, {method:'POST',body:expect.objectContaining({p_note_id:s.noteId,p_act_id:s.id,p_operation_id:s.operationId,p_expected_revision:7,p_payload:expect.objectContaining({author_org_id:s.actor.id,payload:expect.objectContaining({content:'<p>Cos</p>'})})})});
});
test.each([null,{}, {publicacio:{id:'different'},nota_revision:8,publicada_revision:8,replay:false}])('cap rebut invàlid %j es disfressa de publicació confirmada',async receipt=>{
 m.request.mockResolvedValue(receipt); await expect(appendSectionSubmissionNetworkOnly(sub())).rejects.toThrow('Rebut');
});
test('la consulta prèvia al flush no porta cos i admet desconegut o retirat',async()=>{
 const s={...sub(),consulta:true};m.request.mockResolvedValueOnce(null).mockResolvedValueOnce({publicacio:null,nota_revision:8,publicada_revision:8,replay:true,retirada:true});
 expect(await appendSectionSubmissionNetworkOnly(s)).toBeNull(); expect((await appendSectionSubmissionNetworkOnly(s)).retirada).toBe(true);
 expect(m.request.mock.calls.every(([, , options])=>options.body.p_payload===null)).toBe(true);
});

test('el canvi A→B mentre es consulta el diari no envia el cos d’A amb la sessió de B',async()=>{
 m.comprova.mockImplementationOnce(async()=>{m.session++;m.user='other';});
 await expect(appendSectionSubmissionNetworkOnly(sub())).rejects.toMatchObject({name:'AbortError'});expect(m.request).not.toHaveBeenCalled();
});
test('un ACK tardà després d’eixir i tornar a A no es lliura com a confirmació',async()=>{
 const s=sub();m.request.mockImplementationOnce(async()=>{m.session+=2;return{publicacio:{id:s.id},nota_revision:8,publicada_revision:8,replay:false};});
 await expect(appendSectionSubmissionNetworkOnly(s)).rejects.toMatchObject({name:'AbortError'});
});

/* Gauntlet R22 (dades-01) · Sense publica_nota_al_mur (2611122200) no s'ha publicat res: ho diu el codi, no una xarxa caiguda. */
test('R22 · sense la RPC atòmica (404 PGRST202): error amb codi esquema-absent, sense cap upsert de reserva',async()=>{
 m.request.mockRejectedValue(Object.assign(new Error('Supabase 404'),{status:404,postgrestCode:'PGRST202'}));
 await expect(appendSectionSubmissionNetworkOnly(sub())).rejects.toMatchObject({codi:'esquema-absent'});
 await expect(appendSectionSubmissionNetworkOnly({...sub(),consulta:true})).rejects.toMatchObject({codi:'esquema-absent'});
 expect(m.request.mock.calls.every(([url])=>url==='/rest/v1/rpc/publica_nota_al_mur')).toBe(true);
 const altre=Object.assign(new Error('Supabase 500'),{status:500});m.request.mockRejectedValueOnce(altre);
 await expect(appendSectionSubmissionNetworkOnly(sub())).rejects.toBe(altre);
});
