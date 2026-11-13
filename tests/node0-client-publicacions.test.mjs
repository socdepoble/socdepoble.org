/** Client composition only. Real neutral mapper/DOMPurify with a simulated
 * HTTP transport; native SQL authorization is verified by root separately. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const TOWN='ac3bec76-255b-5ca2-8886-28fcceab4267',A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const ID='33333333-3333-4333-8333-333333333333',ID2='44444444-4444-4444-8444-444444444444';
const TIME='2026-11-04T10:20:30.123456+00:00';
const person={id:A,email:'fixture@example.invalid',email_confirmed_at:'2026-11-04T00:00:00Z',user_metadata:{}};
test('private publication composition uses the existing DOM mapper and preserves real pagination authority',async t=>{
  const dom=new JSDOM('<!doctype html>',{url:'https://socdepoble.cat'});
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'window',{configurable:true,value:dom.window});Object.defineProperty(globalThis,'document',{configurable:true,value:dom.window.document});
  t.after(()=>{if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');dom.window.close();});
  const {preparaClientPrivatNodeZero}=await import('../src/data/node0/clientPrivatNodeZero.js');
  const {creaAdaptadorNodeZeroHttp}=await import('../src/data/node0/adaptadorNodeZeroHttp.js');
  const fixture=async(user=person)=>{
    const state={user,privateCalls:[],publicCalls:[],sections:{}};
    const publicAdapter=creaAdaptadorNodeZeroHttp({endpoint:'https://socdepoble.cat/api/v1/node0',tenantId:TOWN,fetchImpl:async(url,init)=>{
      state.publicCalls.push({url,init});
      const value=url.endsWith('/status')?{node:'node0',postgresql:{ok:true},capabilities:{userSessions:true,actorBinding:true,sectionSubmissions:true,paginacioSeccions:true}}
        :url.endsWith('/mur')?{feedPosts:[{id:'seed-public',title:'Verified public seed'}],events:[],marketItems:[]}: {mediaItems:[{id:'seed-media',title:'Verified public media'}]};
      return new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
    }});
    const transport={demanaAuth:async()=>({user:state.user}),async demanaPrivat(action,body,config){
      state.privateCalls.push({action,body,config});assert.equal(config.expectedActor,state.user?.id);
      if(action==='loadSeccioPage')return state.sections[body.sectionId]??{lectura:'membre',rows:[],complete:true,nextCursor:null};
      if(action==='appendSectionSubmissionNetworkOnly'){
        const input=body.submission;
        const row = {id:input.id,section_id:input.sectionId,owner_user_id:state.user.id,author_org_id:null,title:input.title??'',description:input.description??'',
          created_at:TIME,updated_at:TIME,payload:{...input.payload,ownerUserId:state.user.id,author_org_id:null,sectionId:input.sectionId}};
        return input.noteId ? {publicacio:row,nota_revision:input.expectedNoteRevision+1,publicada_revision:input.expectedNoteRevision+1,replay:false} : row;
      }
      assert.fail('Unexpected simulated private operation');
    },destroy(){}};
    return {state,client:await preparaClientPrivatNodeZero({publicAdapter,transport,habilitaPrivat:true,emetCanvi(){}})};
  };
  await t.test('publishing normalizes HTML with DOMPurify and uses returned columns for owner and timestamp',async()=>{
    const {state,client}=await fixture();
    const saved=await client.adapter.appendSectionSubmissionNetworkOnly({id:ID,sectionId:'mur',title:'Fixture',createdAt:'1900-01-01T00:00:00Z',payload:{
      content:'<p>Safe text</p><script>window.bad=true</script><img src="x" onerror="window.bad=true">',ownerUserId:B,author_org_id:B,isSystem:true,created_at:'1900-01-01T00:00:00Z'
    }});
    assert.equal(saved.ownerUserId,A);assert.equal(saved.createdAt,TIME);assert.equal(saved.payload.created_at,TIME);assert.equal(saved.payload.ownerUserId,A);assert.equal(saved.payload.author_org_id,null);
    const wire=state.privateCalls[0].body.submission;
    for(const key of ['ownerUserId','author_org_id','isSystem','created_at','createdAt'])assert.equal(Object.hasOwn(wire.payload,key),false,key);
    assert.match(wire.payload.content,/<p>Safe text<\/p>/);assert.doesNotMatch(wire.payload.content,/<script|onerror=/i);
    assert.equal(state.privateCalls[0].config.expectedActor,A);
  });
  await t.test('loadMur merges only three authenticated pages with the public seed, preserving a microsecond cursor',async()=>{
    const {state,client}=await fixture();
    state.sections.mur={lectura:'membre',rows:[{id:ID,section_id:'mur',owner_user_id:A,author_org_id:null,title:'Persisted',created_at:TIME,updated_at:TIME,payload:{content:'<p>Saved</p>',ownerUserId:B,author_org_id:B,isSystem:true}}],complete:false,nextCursor:{createdAt:TIME,id:ID}};
    const first=await client.adapter.loadMur(A);assert.deepEqual(first.feedPosts.map(value=>value.id),['seed-public',ID]);
    assert.equal(first.feedPosts[1].ownerUserId,A);assert.equal(first.feedPosts[1].author_org_id,null);assert.equal(first.feedPosts[1].isSystem,undefined);
    assert.deepEqual(state.privateCalls.map(call=>call.body.sectionId),['mur','events','mercat']);
    const decoded=JSON.parse(first.paginacio.mur);assert.deepEqual(decoded,[TOWN,A,'mur',TIME,ID]);
    state.sections.mur={lectura:'membre',rows:[{id:ID2,section_id:'mur',owner_user_id:A,author_org_id:null,title:'Older',created_at:'2026-11-04T10:20:30.123455+00:00',updated_at:TIME,payload:{}}],complete:true,nextCursor:null};
    const next=await client.adapter.loadSeccioPage({seccio:'mur',cursor:first.paginacio.mur,limit:17});assert.equal(next.complete,true);assert.equal(next.nextCursor,null);assert.equal(next.elements[0].id,ID2);
    assert.deepEqual(state.privateCalls.at(-1).body.cursor,{createdAt:TIME,id:ID});assert.equal(state.privateCalls.at(-1).body.limit,17);
    const before=state.privateCalls.length;
    await assert.rejects(client.adapter.loadSeccioPage({seccio:'mur',cursor:JSON.stringify([TOWN,B,'mur',TIME,ID])}),error=>error.codi==='NODE0_CURSOR_INVALID');
    assert.equal(state.privateCalls.length,before);
  });
  await t.test('R21 v2 Foraster autenticat mapeja el DTO públic sense exigir ni filtrar owner cru',async()=>{
    const {state,client}=await fixture();
    state.sections.mur={lectura:'public',rows:[{id:ID,section_id:'mur',title:'Públic',created_at:TIME,
      public_content:'Text net',owner_user_id:B,payload:{phone:'PRIVATE',image:'/private.jpg'}}],complete:true,nextCursor:null};
    const item=(await client.adapter.loadMur(A)).feedPosts.find(v=>v.id===ID);
    assert.equal(item._murPublic,true);assert.equal(item.ownerUserId,null);assert.equal(item.image,undefined);
    assert.equal(JSON.stringify(item).includes('PRIVATE'),false);
  });
  await t.test('R21 v2 atomic descriptor preserves note/operation UUID and both receipt revisions without second PATCH',async()=>{
    const {state,client}=await fixture();const noteId='55555555-5555-4555-8555-555555555555',operationId='66666666-6666-4666-8666-666666666666';
    const receipt=await client.adapter.appendSectionSubmissionNetworkOnly({id:ID,noteId,operationId,expectedNoteRevision:2,sectionId:'mur',title:'Atomic',payload:{content:'<p>Safe</p>'}});
    assert.equal(receipt.publicacio.id,ID);assert.equal(receipt.nota_revision,3);assert.equal(receipt.publicada_revision,3);
    assert.equal(state.privateCalls.length,1);assert.equal(state.privateCalls[0].body.submission.noteId,noteId);assert.equal(state.privateCalls[0].body.submission.operationId,operationId);
    await assert.rejects(client.adapter.appendSectionSubmissionNetworkOnly({id:ID,noteId:'bad',operationId,expectedNoteRevision:2,sectionId:'mur',payload:{}}));
    assert.equal(state.privateCalls.length,1);
  });
  await t.test('anonymous read stays on public collections; personal data is never fetched through public GET',async()=>{
    const {state,client}=await fixture(null);const result=await client.adapter.loadMur();assert.equal(result.feedPosts[0].id,'seed-public');
    assert.equal(state.privateCalls.length,0);assert.ok(state.publicCalls.every(call=>call.init.method==='GET'&&call.init.credentials==='omit'));
    await assert.rejects(client.adapter.appendSectionSubmissionNetworkOnly({sectionId:'mur',payload:{}}),error=>error.codi==='sense-permis');
    assert.equal(state.privateCalls.length,0);
  });
  await t.test('multimedia uses its own authenticated page and page corruption never degrades to public-only success',async()=>{
    const {state,client}=await fixture();
    state.sections.multimedia={lectura:'membre',rows:[{id:ID,section_id:'multimedia',owner_user_id:A,author_org_id:null,title:'Private member media',created_at:TIME,updated_at:TIME,payload:{type:'media',title:'Media'}}],complete:true,nextCursor:null};
    const result=await client.adapter.loadMultimedia(A);assert.deepEqual(result.mediaItems.map(value=>value.id),['seed-media',ID]);assert.equal(state.privateCalls.at(-1).body.sectionId,'multimedia');
    state.sections.mur={lectura:'membre',rows:[],complete:false,nextCursor:null};
    await assert.rejects(client.adapter.loadMur(A),error=>error.codi==='BACKEND_RESPOSTA_INVALIDA');
  });
  await t.test('publication accessors and excessive bodies stop before HTTP and without executing a getter',async()=>{
    const {state,client}=await fixture();let accessed=false;const payload={};Object.defineProperty(payload,'content',{enumerable:true,get(){accessed=true;return'<p>Unexpected</p>';}});
    await assert.rejects(client.adapter.appendSectionSubmissionNetworkOnly({sectionId:'mur',payload}),error=>error.codi==='BACKEND_RESPOSTA_INVALIDA');
    await assert.rejects(client.adapter.appendSectionSubmissionNetworkOnly({sectionId:'mur',payload:{content:'x'.repeat(128*1024)}}),error=>error.codi==='NODE0_PUBLICACIO_MASSA_GRAN');
    assert.equal(accessed,false);assert.equal(state.privateCalls.length,0);
  });
});
