import { JPEG_NET } from '../../../tests/helpers/mitjansPublicsNets.js';
import { beforeEach, expect, test, vi } from 'vitest';
const OWNER='11111111-1111-4111-8111-111111111111',TENANT='22222222-2222-4222-8222-222222222222',ID='33333333-3333-4333-8333-333333333333',OP='44444444-4444-4444-8444-444444444444';
const m=vi.hoisted(()=>({tenant:'22222222-2222-4222-8222-222222222222',backend:'https://lab.example.invalid',user:'11111111-1111-4111-8111-111111111111',request:vi.fn(),guard:vi.fn()}));
vi.mock('./runtime.js',()=>({getCurrentUser:()=>({id:m.user}),getResolvedConfig:()=>({runtimeDataMode:'remote',hasSupabaseConfig:true,tenantId:m.tenant,supabaseUrl:m.backend}),request:(...args)=>m.request(...args),generateUUID:vi.fn(),buildSeedAppData:vi.fn(),mapContentRowsToData:vi.fn(),rpc:vi.fn()}));
vi.mock('../identitat.js',()=>({capturaSessio:()=>m.guard}));
vi.mock('./copublicacioMur.js',()=>({comprovaPublicacioNoRetirada:vi.fn(),drenaRevocacionsMur:vi.fn()}));
import { appendSectionSubmissionNetworkOnly as save } from './content.js';
const sub=()=>({id:ID,sectionId:'mur',payload:{title:'LAB',content:'initial'},expectedUpdatedAt:null,operationId:OP});
const ack=()=>({id:ID,tenant_id:TENANT,owner_user_id:OWNER,section_id:'mur',operation_id:OP,created_at:'2026-11-18T01:00:00.123456Z',updated_at:'2026-11-18T01:00:00.123457Z',author_org_id:null,replay:false});
beforeEach(()=>{m.tenant=TENANT;m.backend='https://lab.example.invalid';m.user=OWNER;m.guard.mockReset();m.request.mockReset();m.request.mockResolvedValue(ack());});
test('CAS null=create calls only explicit RPC, preserves exact token and stable body across retries',async()=>{
 const input=sub(); const a=await save(input); const b=await save(input);
 expect(a.updatedAt).toBe(ack().updated_at);expect(b.operationId).toBe(OP);
 expect(m.request).toHaveBeenCalledTimes(2);const [url,,opts]=m.request.mock.calls[0];expect(url).toBe('/rest/v1/rpc/publica_section_submission_cas');expect(opts.body.p_expected_updated_at).toBeNull();
 expect(opts.body).toEqual(m.request.mock.calls[1][2].body);expect(input).toEqual(sub());
 expect(opts.body.p_payload).not.toHaveProperty('created_at');
});
test('strict local input rejects missing operation, wrong token, linked notes and hostile DTO before network',async()=>{
 for(const bad of [{operationId:null},{operationId:'x'},{expectedUpdatedAt:undefined},{expectedUpdatedAt:'invalid'},{noteId:ID},{actor:{tipus:'entitat'}},{payload:[]},{payload:{get content(){throw Error('getter');}}}]){
  await expect(save({...sub(),...bad})).rejects.toBeInstanceOf(TypeError);
 }expect(m.request).not.toHaveBeenCalled();
});
test('missing RPC has one request and no legacy fallback; conflict is actionable',async()=>{
 m.request.mockRejectedValue(Object.assign(Error('missing'),{status:404,postgrestCode:'PGRST202'}));await expect(save(sub())).rejects.toMatchObject({codi:'esquema-absent'});expect(m.request).toHaveBeenCalledTimes(1);
 m.request.mockRejectedValue(Object.assign(Error('SDP-PUB-CAS-003'),{postgrestCode:'40001'}));await expect(save(sub())).rejects.toMatchObject({codi:'conflicte-versio'});
});
test('ACK binds id, tenant, owner, section, op, exact committed token and closed shape',async()=>{
 for(const extra of [{id:OP},{tenant_id:OP},{owner_user_id:OP},{section_id:'events'},{operation_id:ID},{updated_at:0},{updated_at:'2026-11-18'},{created_at:0},{author_org_id:0},{replay:null},{publicacio:{}},{updated_at:'2026-11-18T01:00:00.123456Z'},{updated_at:'2026-11-18T02:00:00.123456+01:00'}]){
  m.request.mockResolvedValue({...ack(),...extra});const input={...sub(),expectedUpdatedAt:ack().created_at};await expect(save(input)).rejects.toBeInstanceOf(TypeError);
 }
});
test.each(['tenant','backend','user','abort','session'])('scope change after RPC %s refuses late ACK',async mode=>{
 const controller=new AbortController();m.request.mockImplementation(async()=>{if(mode==='tenant')m.tenant=OP;if(mode==='backend')m.backend='https://other.example.invalid';if(mode==='user')m.user=OP;if(mode==='abort')controller.abort();if(mode==='session')m.guard.mockImplementation(()=>{throw new DOMException('session','AbortError');});return ack();});
 await expect(save(sub(),{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
});
test('payload and actor captured before await and caller mutation cannot change body',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});m.request.mockImplementation(async()=>{await gate;return ack();});const input=sub();const pending=save(input);input.payload.content='changed';input.operationId=ID;release();await pending;
 expect(m.request.mock.calls[0][2].body.p_payload.content).toBe('initial');expect(m.request.mock.calls[0][2].body.p_operation_id).toBe(OP);
});
test('CC-BY synthetic image keeps local bytes and draft; rights block before RPC in every rendered section',async()=>{
 const blob=new Blob([JPEG_NET],{type:'image/jpeg'});const bytes=await blob.arrayBuffer();
 for(const sectionId of ['mur','mercat','events','multimedia','notes']){const input={...sub(),sectionId,payload:{title:'LAB image',copyright:'CC BY 4.0 LAB',image_url:'/assets/lab-fixture.jpg'}};const before=structuredClone(input);await expect(save(input)).rejects.toMatchObject({codi:'drets-cas-no-disponibles'});expect(input).toEqual(before);}
 expect(await blob.arrayBuffer()).toEqual(bytes);expect(m.request).not.toHaveBeenCalled();
});
test('existing remotely licensed row returns explicit rights error, keeps draft/token/opId and has no fallback',async()=>{
 const input=sub(),before=structuredClone(input);m.request.mockRejectedValue(Object.assign(Error('SDP-PUB-CAS-006'),{postgrestCode:'22023'}));await expect(save(input)).rejects.toMatchObject({codi:'drets-cas-no-disponibles'});expect(input).toEqual(before);expect(m.request).toHaveBeenCalledTimes(1);expect(m.request.mock.calls[0][0]).toContain('/rpc/publica_section_submission_cas');
});
