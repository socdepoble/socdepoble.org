import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACTE_NUCLI} from '../src/data/contracte.js';
import {creaAdaptadorNodeZeroHttp,CONVIDAT_NODE_ZERO} from '../src/data/node0/adaptadorNodeZeroHttp.js';
import {preparaClientPrivatNodeZero} from '../src/data/node0/clientPrivatNodeZero.js';
const TOWN='ac3bec76-255b-5ca2-8886-28fcceab4267';
const A=Object.freeze({id:'11111111-1111-4111-8111-111111111111',email:'a@example.invalid',email_confirmed_at:'2026-11-04T00:00:00Z',user_metadata:{full_name:'Fixture A',role:'superadmin'}});
const B=Object.freeze({id:'22222222-2222-4222-8222-222222222222',email:'b@example.invalid',email_confirmed_at:'2026-11-04T00:00:00Z',user_metadata:{full_name:'Fixture B'}});
const NOTE='33333333-3333-4333-8333-333333333333';
const row=(id=NOTE)=>({id,revision:2,folder_id:'real-folder',title:'Persisted fixture',content:'Real DTO body',status:'activa',tags:[],categories:[]});
const failure=(status,serverCode)=>Object.assign(new Error('Generic test server failure'),{status,serverCode,codi:'NODE0_HTTP'});
const barrier=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
function fixture({user=A,userSessions=true,actorBinding=true,roleRead=true,createOrganization=true,norms=false}={}){
  const state={user,calls:[],publicCalls:[],events:[],authHook:null,privateHook:null,normsAccepted:new Map()};
  const status={node:'node0',postgresql:{ok:true},capabilities:{userSessions,actorBinding,roleRead,createOrganization,norms}};
  const publicAdapter=creaAdaptadorNodeZeroHttp({endpoint:'https://socdepoble.cat/api/v1/node0',tenantId:TOWN,fetchImpl:async url=>{
    state.publicCalls.push(url);return new Response(JSON.stringify(url.endsWith('/status')?status:{towns:[],pages:[],agents:[]}),{headers:{'Content-Type':'application/json'}});
  }});
  const transport={
    async demanaAuth(action,body={},config={}){
      state.calls.push({kind:'auth',action,body,config:{...config}});
      if(state.authHook){const result=await state.authHook(action,body,config);if(result!==undefined)return result;}
      if(action==='session')return {user:state.user};
      if(action==='policy')return {privacy:{version:'2.4',sha256:'a'.repeat(64),url:'/legal'},normsVersion:'2026-10-24'};
      if(['logout','password','norms','norms-state'].includes(action)&&state.user?.id!==config.expectedActor)throw failure(409,'session_actor_changed');
      if(action==='login'){
        if(body.password==='wrong')throw failure(401,'credentials_invalid');
        state.user=body.email===B.email?B:A;return {user:state.user};
      }
      if(action==='logout'){state.user=null;return {logged_out:true};}
      if(action==='password'){state.user=null;return {password_changed:true,login_required:true};}
      if(action==='register')return {verification_required:true};
      if(action==='norms-state')return {versio:'2026-10-24',acceptada_al:state.normsAccepted.get(state.user.id)??null};
      if(action==='norms'){state.normsAccepted.set(state.user.id,'2026-11-04T00:00:00Z');return {versio:body.version,acceptada_al:state.normsAccepted.get(state.user.id)};}
      throw failure(501,'operation_unavailable');
    },
    async demanaPrivat(action,body,config){
      state.calls.push({kind:'private',action,body,config:{...config}});
      if(state.user?.id!==config.expectedActor)throw failure(409,'session_actor_changed');
      if(state.privateHook){const result=await state.privateHook(action,body,config);if(result!==undefined)return result;}
      if(action==='getProfile'||action==='updateProfile')return {id:state.user.id,bio:'Server-owned profile'};
      if(action==='loadNotes')return {rows:[row()],limit:50};
      if(action==='createNote'||action==='updateNote')return row(body.id??body.input?.id??NOTE);
      if(action==='elMeuRol')return 'usuari';
      if(action==='createOrganization')return {id:NOTE,...body.organization};
      if(action==='listMyOrganizations')return [];
      if(action==='loadFils')return [{id:NOTE,tipus:'directe',ultim_seq:4,no_llegits:2}];
      if(action==='loadMissatges')return [{id:NOTE,fil_id:body.filId,seq:4,usuari_id:state.user.id,cos:'Persisted message',tipus:'text'}];
      if(action==='marcaLlegit')return [{llegit_fins_seq:0,rebut_fins_seq:4}];
      if(action==='enviaMissatge'){
        if(norms&&!state.normsAccepted.has(state.user.id))throw failure(403,'permission_denied');
        return [{id:body.id,fil_id:body.filId,seq:1,usuari_id:state.user.id,cos:body.text,tipus:'text'}];
      }
      throw failure(501,'operation_unavailable');
    },destroy(){state.destroyed=true;}
  };
  return {state,publicAdapter,transport,options:{publicAdapter,transport,habilitaPrivat:true,emetCanvi:event=>state.events.push(event)}};
}
const stale=error=>error.codi==='NODE0_IDENTITAT_CANVIADA';
test('exact opt-in and real server capability gates never load a cookie session accidentally',async()=>{
  const a=fixture();const off=await preparaClientPrivatNodeZero({...a.options,habilitaPrivat:'true'});
  assert.equal(off.adapter,a.publicAdapter);assert.equal(a.state.calls.length,0);assert.equal(a.state.publicCalls.length,0);
  const b=fixture({userSessions:false});const disabled=await preparaClientPrivatNodeZero(b.options);assert.equal(disabled.adapter,b.publicAdapter);assert.equal(b.state.calls.length,0);
});
test('boot awaits server session, caches only verified DTOs and preserves all32 honest core signatures',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options),adapter=client.adapter;
  assert.equal(client.privatActiu,true);assert.deepEqual(f.state.calls.map(x=>x.action),['session']);
  assert.equal(adapter.getCurrentUser().id,A.id);assert.equal(adapter.getCurrentUser(),adapter.getCurrentUser());
  assert.equal(adapter.getCurrentUser().user_metadata.role,undefined);assert.equal(adapter.getCurrentUser().access_token,undefined);assert.ok(Object.isFrozen(adapter.getCurrentUser()));
  for(const name of CONTRACTE_NUCLI)assert.equal(typeof adapter[name],'function',name);
  for(const name of ['appendChatMessages','appendSectionSubmissionNetworkOnly','subscribeToXat','unsubscribeFromXat','loginWithGoogle'])await assert.rejects(adapter[name](),error=>error.codi==='sense-capacitat');
  assert.equal(adapter.operacions.xatTempsReal,false);assert.equal(f.state.calls.length,1);assert.equal(f.state.events.length,0,'boot emits no identity event before host injection');
});
test('unverified or invalid boot identity fails closed instead of manufacturing a session',async()=>{
  const f=fixture({user:{...A,email_confirmed_at:null}});await assert.rejects(preparaClientPrivatNodeZero(f.options),error=>error.codi==='NODE0_SESSIO_INCERTA');
});
test('missing actor binding disables private RPCs and bound logout; role group is never partial',async()=>{
  const f=fixture({actorBinding:false}),client=await preparaClientPrivatNodeZero(f.options);
  assert.equal(client.adapter.refrescaSessio,undefined);assert.equal(client.adapter.elMeuRol,undefined);
  await assert.rejects(client.adapter.createNote({title:'No dispatch'}),error=>error.codi==='sense-capacitat');
  await assert.rejects(client.adapter.logout(),error=>error.codi==='sense-capacitat');assert.equal(f.state.calls.length,1);
});
test('role read is a server RPC with expected actor; profile and note DTO shapes follow the existing signatures',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options),a=client.adapter;
  assert.equal(await a.elMeuRol(),'usuari');assert.equal((await a.getProfile()).id,A.id);
  const notes=await a.loadNotes(A.id);assert.equal(notes.notes[0].folderId,'real-folder');assert.equal(notes.notes[0].revision,2);assert.equal(notes.notes[0].contentLoaded,true);assert.deepEqual(notes.noteFolders,[]);
  const saved=await a.updateNote(NOTE,{content:'Changed'},1);assert.equal(saved.id,NOTE);assert.equal(saved.revision,2);
  const calls=f.state.calls.filter(x=>x.kind==='private');assert.ok(calls.every(call=>call.config.expectedActor===A.id));assert.ok(calls.every(call=>!Object.hasOwn(call.body,'userId')));
  await assert.rejects(a.loadNotes(B.id),error=>error.codi==='NODE0_PROPIETARI_INVALID');
});
test('another tab changing the shared cookie is denied before any old actor data can be exposed',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options);f.state.user=B;
  await assert.rejects(client.adapter.getProfile(),stale);assert.equal(client.inspecta().state,'unknown');
  await assert.rejects(client.adapter.createNote({title:'Must refresh'}),error=>error.codi==='NODE0_AUTH_PENDENT');
  assert.equal(await client.actualitzaSessio(),true);assert.equal(client.adapter.getCurrentUser().id,B.id);
  assert.equal((await client.adapter.getProfile()).id,B.id);
});
test('late actor-A private response is discarded after a verified server refresh to B',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options),started=barrier(),release=barrier();
  f.state.privateHook=async action=>{if(action==='getProfile'){started.resolve();await release.promise;return {id:A.id,bio:'A private text'};}};
  const old=client.adapter.getProfile();const rejection=assert.rejects(old,stale);await started.promise;
  f.state.user=B;await client.actualitzaSessio();release.resolve();await rejection;
  assert.equal(client.adapter.getCurrentUser().id,B.id);
});
test('login mutations serialize; pending logout cannot claim revocation of an unknown cookie',async()=>{
  const f=fixture({user:null}),client=await preparaClientPrivatNodeZero(f.options),started=barrier(),release=barrier();
  f.state.authHook=async(action,body)=>{if(action==='login'){started.resolve();await release.promise;f.state.user=A;return {user:body.email===B.email?B:A};}};
  const login=client.adapter.loginWithPassword(A.email,'correct');const rejected=assert.rejects(login,stale);await started.promise;
  // A logout requires an observed actor. During a changing identity it is
  // denied, rather than pretending it revoked an unknown pending cookie.
  await assert.rejects(client.adapter.logout(),error=>error.codi==='NODE0_AUTH_PENDENT');
  const newer=client.adapter.loginWithPassword(B.email,'correct');const newRejected=assert.rejects(newer,stale);
  release.resolve();await rejected;
  // Simulate another tab replacing the cookie with A before B's session GET.
  await newRejected;assert.equal(client.adapter.getCurrentUser().id,A.id);
  assert.equal(f.state.calls.filter(x=>x.action==='login').length,2);
});
test('wrong login does not force anonymous state while a real B cookie still exists',async()=>{
  const f=fixture({user:B}),client=await preparaClientPrivatNodeZero(f.options);
  await assert.rejects(client.adapter.loginWithPassword(A.email,'wrong'),error=>error.status===401);
  assert.equal(client.adapter.getCurrentUser().id,B.id);assert.equal(client.inspecta().state,'verified');
});
test('an indeterminate auth timeout latches closed and never retries logout/login over a late cookie',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options);
  f.state.authHook=async action=>{if(action==='login')throw Object.assign(new Error('network detail not public'),{codi:'backend-inabastable'});};
  await assert.rejects(client.adapter.loginWithPassword(B.email,'correct'));
  assert.equal(client.inspecta().requiresReload,true);const before=f.state.calls.length;
  await assert.rejects(client.adapter.logout(),error=>error.codi==='NODE0_SESSIO_INCERTA');
  await assert.rejects(client.adapter.loginWithPassword(A.email,'correct'),error=>error.codi==='NODE0_SESSIO_INCERTA');
  assert.equal(f.state.calls.length,before);
});
test('registration never guesses accepted policy version and password change requires current password',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options);let before=f.state.calls.length;
  await assert.rejects(client.adapter.registerWithPassword(A.email,'new',{accepta_rgpd:true}),error=>error.codi==='consent_required');
  await assert.rejects(client.adapter.updateUserPassword('new'),error=>error.codi==='NODE0_CONTRASENYA_ACTUAL');assert.equal(f.state.calls.length,before);
  const policy=await client.lligPoliticaAlta();assert.equal(policy.privacy.version,'2.4');
  const registered=await client.adapter.registerWithPassword(B.email,'new',{accepta_rgpd:true,versio_politica:policy.privacy.version});assert.equal(registered.verification_required,true);
  assert.equal(client.adapter.getCurrentUser().id,A.id,'registration must recheck and preserve a pre-existing cookie actor');
  await client.adapter.updateUserPassword('new',{currentPassword:'current'});assert.equal(client.adapter.getCurrentUser(),null);
  const call=f.state.calls.find(x=>x.action==='password');assert.equal(call.config.expectedActor,A.id);assert.equal(call.body.currentPassword,'current');assert.equal(client.adapter.getDefaultUserId(),CONVIDAT_NODE_ZERO);
});
test('logout does not report success or clear B locally on a stale actor-A intent',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options);f.state.user=B;
  await assert.rejects(client.adapter.logout(),error=>error.status===409);assert.equal(client.adapter.getCurrentUser().id,B.id);
  const call=f.state.calls.find(x=>x.action==='logout');assert.equal(call.config.expectedActor,A.id);
});
test('pending password rotation retains the verified actor so RequireAuth does not abort its own form',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options),started=barrier(),release=barrier();
  f.state.authHook=async action=>{if(action==='password'){started.resolve();await release.promise;f.state.user=null;return {password_changed:true,login_required:true};}};
  const before=client.adapter.getCurrentUser();const changed=client.adapter.updateUserPassword('new',{currentPassword:'current'});await started.promise;
  assert.equal(client.adapter.getCurrentUser(),before);assert.equal(client.inspecta().state,'changing');
  await assert.rejects(client.adapter.getProfile(),error=>error.codi==='NODE0_AUTH_PENDENT');
  release.resolve();assert.equal(await changed,true);assert.equal(client.adapter.getCurrentUser(),null);
});
test('auth events identify the backend and epoch; destroy invalidates every late result',async()=>{
  const f=fixture(),client=await preparaClientPrivatNodeZero(f.options);await client.adapter.loginWithPassword(B.email,'correct');
  assert.ok(f.state.events.length>=2);assert.ok(f.state.events.every(event=>event.backendId==='sdp-node0-http'&&event.backendUrl==='https://socdepoble.cat/api/v1/node0'&&event.tenantId===TOWN&&Number.isInteger(event.epoch)));
  client.adapter.destroy();assert.equal(f.state.destroyed,true);assert.throws(()=>client.adapter.getCurrentUser(),error=>error.codi==='NODE0_TANCAT');
});
test('real norms capability is a complete pair and accepting it never clears the identity epoch',async()=>{
  const f=fixture({norms:true}),client=await preparaClientPrivatNodeZero(f.options),a=client.adapter;
  assert.equal(typeof a.estatNormes,'function');assert.equal(typeof a.acceptaNormes,'function');
  const original=a.getCurrentUser(),epoch=client.inspecta().epoch;
  assert.deepEqual(await a.estatNormes(),{versio:'2026-10-24',acceptadaAl:null});
  await assert.rejects(a.enviaMissatge(NOTE,{id:NOTE,text:'Not yet approved'}),error=>error.status===403);
  await assert.rejects(a.acceptaNormes('2026-10-23'),error=>error.codi==='versio-invalida');
  const accepted=await a.acceptaNormes('2026-10-24');assert.equal(accepted.acceptadaAl,'2026-11-04T00:00:00Z');
  assert.equal(a.getCurrentUser(),original);assert.equal(client.inspecta().epoch,epoch);assert.equal(f.state.events.length,0);
  assert.deepEqual(await a.estatNormes(),accepted);
  assert.equal((await a.enviaMissatge(NOTE,{id:NOTE,text:'Approved now'})).text,'Approved now');
  assert.ok(f.state.calls.filter(call=>['norms','norms-state'].includes(call.action)).every(call=>call.config.expectedActor===A.id));
});
test('anonymous norms reads actual public policy without fabricating an expected user',async()=>{
  const off=fixture(),disabled=await preparaClientPrivatNodeZero(off.options);assert.equal(disabled.adapter.estatNormes,undefined);assert.equal(disabled.adapter.acceptaNormes,undefined);
  const f=fixture({user:null,norms:true}),client=await preparaClientPrivatNodeZero(f.options);
  assert.deepEqual(await client.adapter.estatNormes(),{versio:'2026-10-24',acceptadaAl:null});
  assert.equal(f.state.calls.at(-1).action,'policy');assert.equal(f.state.calls.at(-1).config.expectedActor,undefined);
  await assert.rejects(client.adapter.acceptaNormes('2026-10-24'),error=>error.codi==='sense-permis');
});
