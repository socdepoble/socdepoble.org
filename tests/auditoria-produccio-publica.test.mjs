import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync,rmSync,mkdirSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash,createECDH } from 'node:crypto';
const TOOL=new URL('../tooling/auditoria/inspecciona-produccio-publica.py',import.meta.url).pathname;
const WEB='https://socdepoble.org',BACK='https://'+'a'.repeat(20)+'.supabase.co';
const jwt=role=>[Buffer.from('{"alg":"HS256"}').toString('base64url'),Buffer.from(JSON.stringify({role,private:'PUBLIC_TEST_MARKER'})).toString('base64url'),'fixture_signature'].join('.');
const TOKEN=jwt('anon');
const EDGES=['noticies','notifica-xat','compte-apple','notifica-xat-desperta','purga-fitxers','ap-inbox-verifica','iaia'];
const content=BACK+'/rest/v1/app_content?select=tenant_id,key,payload,version,updated_at&order=tenant_id.asc,key.asc&offset=0&limit=500';
function fixture(){
  const f={};
  f[WEB+'/']={status:200,body:'<script type="module" src="/assets/index-ABCDEFGH.js"></script>'};
  f[WEB+'/assets/index-ABCDEFGH.js']={status:200,body:`const c={supabaseUrl:"${BACK}",supabaseAnonKey:"${TOKEN}"};import("./section-12345678.js");`};
  f[WEB+'/assets/section-12345678.js']={status:200,body:'const descriptive="VITE_PUSH_VAPID_PUBLICA";'};
  f[BACK+'/rest/v1/']={status:401,body:'{"message":"NO_PRIVATE_MESSAGE_OUTPUT"}'};
  f[content]={status:200,body:JSON.stringify([{tenant_id:'synthetic',key:'notes',version:7,payload:[{content:'PRIVATE_SYNTHETIC_NOTE_DO_NOT_PRINT'}]}])};
  for(const n of ['section_submissions','profiles','notes','note_folders'])f[BACK+'/rest/v1/'+n+'?select=*&limit=0']={status:401,body:'{"code":"42501","details":"NEVER_PRINT_DETAILS"}'};
  for(const n of EDGES)f[BACK+'/functions/v1/'+n]={status:404,body:'{"code":"NOT_FOUND"}'};
  return f;
}
function run(t,f,extra=[]){
  const dir=mkdtempSync(join(tmpdir(),'sdp-public-audit-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  mkdirSync(join(dir,'supabase/migrations'),{recursive:true});writeFileSync(join(dir,'supabase/migrations/2611120000_fixture.sql'),'select 1;');
  const file=join(dir,'responses.json');writeFileSync(file,JSON.stringify(f));
  const r=spawnSync('python3',[TOOL,'--fixture',file,'--root',dir,...extra],{encoding:'utf8'});
  assert.equal(r.stderr,'');return {...r,report:JSON.parse(r.stdout)};
}
test('all collected requests are GET; no RPC, env, raw key or payload leaves the report',t=>{
  const r=run(t,fixture());assert.equal(r.status,2);assert.equal(r.report.publicCollectionComplete,true);assert.equal(r.report.fullParityCertified,false);
  assert.equal(r.report.collectionMode,'fixture');assert.equal(r.report.observationAuthority,'controlled-replay');
  assert.equal(r.report.remoteMutations,0);assert.equal(r.report.publicBundle.referencedChunks,2);
  for(const request of r.report.requests){assert.equal(request.method,'GET');assert.ok(!request.path.includes('/rpc/'));}
  for(const marker of [TOKEN,'PRIVATE_SYNTHETIC_NOTE_DO_NOT_PRINT','NEVER_PRINT_DETAILS','NO_PRIVATE_MESSAGE_OUTPUT'])assert.ok(!r.stdout.includes(marker));
  assert.ok(r.report.drift.some(x=>x.code==='public_catalogue_key_outside_boundary'&&x.key==='notes'));
  assert.ok(r.report.unknown.includes('privileged_applied_migration_history'));
});
test('401 is unknown authentication state; only 404 NOT_FOUND proves the Edge route absent',t=>{
  const f=fixture();f[BACK+'/functions/v1/iaia']={status:401,body:'{"code":"JWT_ERROR"}'};f[BACK+'/functions/v1/notifica-xat']={status:405,body:'{"error":"metode"}'};
  const r=run(t,f).report;assert.equal(r.edges.iaia.state,'authentication_or_other_state_unknown');assert.equal(r.edges['notifica-xat'].state,'method_guard_observed_runtime_unknown');
  assert.equal(r.edges.noticies.state,'route_absent');assert.ok(!r.drift.some(x=>x.function==='iaia'));
});
test('87-character text is not a VAPID point; real P-256 public points are validated without printing',t=>{
  const f=fixture();const e=createECDH('prime256v1');e.generateKeys();const pub=e.getPublicKey().toString('base64url');
  const wrong=Buffer.alloc(65,7).toString('base64url');
  f[WEB+'/assets/section-12345678.js'].body=`const falsePositive="${wrong}";const realPublic="${pub}";`;
  const r=run(t,f);assert.equal(r.report.publicBundle.apparent87CharStrings,2);assert.equal(r.report.publicBundle.validP256PointLiterals,1);assert.ok(!r.stdout.includes(pub));
  assert.deepEqual(r.report.publicBundle.vapidPublicFingerprints,[createHash('sha256').update(pub).digest('hex')]);
});
test('same shape with prefix0x04 but an off-curve point is not counted as a public key',t=>{
  const f=fixture(),raw=Buffer.alloc(65);raw[0]=4;f[WEB+'/assets/section-12345678.js'].body=`"${raw.toString('base64url')}"`;
  assert.equal(run(t,f).report.publicBundle.validP256PointLiterals,0);
});
test('foreign/traversal module entry and redirects fail closed before backend requests',t=>{
  for(const src of ['https://evil.example/assets/index-ABCDEFGH.js','/assets/../../index-ABCDEFGH.js']){
    const f=fixture();f[WEB+'/'].body=`<script src="${src}"></script>`;const r=run(t,f);assert.equal(r.status,1);assert.equal(r.report.error,'public_entry_invalid');
  }
  const f=fixture();f[WEB+'/assets/index-ABCDEFGH.js']={status:302,body:'ignored'};
  const r=run(t,f);assert.equal(r.status,1);assert.equal(r.report.error,'public_redirect_refused');
});
test('privileged bundled credential is never used or echoed',t=>{
  const f=fixture(),secret=jwt('service_role');f[WEB+'/assets/index-ABCDEFGH.js'].body=f[WEB+'/assets/index-ABCDEFGH.js'].body.replace(TOKEN,secret);
  const r=run(t,f);assert.equal(r.status,1);assert.equal(r.report.error,'bundled_privileged_credential');assert.ok(!r.stdout.includes(secret));
});
test('VITE literal names are not claimed as enabled build values; good public observations still leave privileged parity unknown',t=>{
  const f=fixture();f[content]={status:200,body:'[]'};for(const n of EDGES)f[BACK+'/functions/v1/'+n]={status:405,body:'{}'};
  const r=run(t,f);assert.equal(r.status,2);assert.equal(r.report.publicBundle.viteValues,'unknown_unless_explicitly_observed');assert.equal(r.report.ok,false);
  assert.equal(r.report.localMigrations[0].remoteAppliedState,'unknown');
});
test('non-GET fixture or excessive response cannot turn truncation into a clean inventory',t=>{
  const f=fixture();f[WEB+'/'].method='POST';let r=run(t,f);assert.equal(r.status,1);assert.equal(r.report.error,'fixture_method_not_get');
  const g=fixture();g[content].body='x'.repeat(8*1024*1024+1);r=run(t,g);assert.equal(r.status,1);assert.equal(r.report.error,'public_body_limit');assert.equal(r.report.publicCollectionComplete,false);
});
test('echoed credential in an invalid catalogue key or OpenAPI path is never exposed',t=>{
  const f=fixture();f[content].body=JSON.stringify([{key:TOKEN,payload:[],version:1}]);f[BACK+'/rest/v1/']={status:200,body:JSON.stringify({paths:{['/'+TOKEN]:{get:{}}}})};
  const r=run(t,f);assert.ok(!r.stdout.includes(TOKEN));assert.equal(r.report.appContent[0].key,'<invalid-key>');assert.deepEqual(r.report.openapi.visiblePaths,[]);
});
test('unknown operator arguments are rejected without echoing an accidental secret',t=>{
  const r=run(t,fixture(),['--accidental-key','SYNTHETIC_PRIVATE_MARKER_NEVER_ECHO']);
  assert.equal(r.status,1);assert.equal(r.report.error,'invalid_arguments');assert.ok(!r.stdout.includes('SYNTHETIC_PRIVATE_MARKER_NEVER_ECHO'));
});
test('bounded asset graph refuses a 601st dependency rather than claiming complete coverage',t=>{
  const f=fixture();f[WEB+'/assets/index-ABCDEFGH.js'].body+= 'import("./node000-12345678.js");';
  for(let i=0;i<601;i++)f[WEB+`/assets/node${String(i).padStart(3,'0')}-12345678.js`]={status:200,body:i<600?`import("./node${String(i+1).padStart(3,'0')}-12345678.js");`:''};
  const r=run(t,f);assert.equal(r.status,1);assert.equal(r.report.error,'public_asset_limit');assert.equal(r.report.publicCollectionComplete,false);
});
