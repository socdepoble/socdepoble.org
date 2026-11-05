import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {escanejaLiterals,comprovaLiteralsSecrets,LIMITS_LITERAL_SECRETS} from '../tooling/gates/literals-secrets-node0.mjs';
const assignment=(name,value)=>'const '+name+' = '+JSON.stringify(value)+';';
const only='TEST_ONLY_';
function fixture(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-secret-gate-')));fs.mkdirSync(path.join(root,'src'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('known production literals and complete provider credentials produce redacted locations only',()=>{
 const examples=[assignment('KNOWN_'+'PRODUCTION_SECRET_PREFIX',only+'PREFIX'),assignment('MASTODON_'+'ACCESS_TOKEN','synthetic_'+only.toLowerCase()+'credential_0000000'),['ghp','_', 'A'.repeat(36)].join(''),['AGE','-SECRET-KEY-1','Q'.repeat(58)].join(''),['-----BEGIN PRIVATE',' KEY-----\n','A'.repeat(64),'\n-----END PRIVATE',' KEY-----'].join('')];
 for(const text of examples){const result=escanejaLiterals('\n'+text,'src/example.js');assert.ok(result.length);for(const f of result)assert.deepEqual(Object.keys(f),['ruleId','path','line']);assert.equal(result[0].line,2);assert.equal(JSON.stringify(result).includes(text),false);}
});
test('public keys, digests and explicit synthetic assignment values do not become secret findings',()=>{
 const text=[assignment('PUBLIC_KEY','age1'+'q'.repeat(58)),assignment('SHA256','a'.repeat(64)),assignment('MASTODON_'+'ACCESS_TOKEN',only+'SYNTHETIC_CREDENTIAL_000000'),assignment('FIREBASE_API_KEY','AIza'+'A'.repeat(35)),"const token=process.env.MASTODON_ACCESS_TOKEN;"].join('\n');assert.deepEqual(escanejaLiterals(text),[]);
});
test('service-role JWT is identified by decoded role and anonymous publishable JWT is allowed',()=>{
 const jwt=role=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({role})).toString('base64url'),'A'.repeat(43)].join('.');assert.equal(escanejaLiterals(jwt('service_role'))[0].ruleId,'service-role-jwt');assert.deepEqual(escanejaLiterals(jwt('anon')),[]);
});
test('public endpoints, dynamic template fields and a closing dotenv-prefix quote are not credentials',()=>{
 assert.deepEqual(escanejaLiterals("const x={TOKEN:'https://oauth2.googleapis.com/token'};"),[]);
 assert.deepEqual(escanejaLiterals('const body=`DEEPL_API_KEY="${value}"`;'),[]);
 assert.deepEqual(escanejaLiterals("putenv('DEEPL_API_KEY=' . ($cas['token'] ?? ''));"),[]);
});
test('public fallback ignores private logs without reading and fails on symlink sources',t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'src','safe.js'),'export const ok=true;');fs.mkdirSync(path.join(root,'.agents/runtime'),{recursive:true});fs.writeFileSync(path.join(root,'.agents/runtime','antigravity-hook.log'),'not read');assert.equal(comprovaLiteralsSecrets({root,index:false}).ok,true);fs.symlinkSync(path.join(root,'.agents/runtime','antigravity-hook.log'),path.join(root,'src','unsafe.js'));assert.throws(()=>comprovaLiteralsSecrets({root,index:false}),/unsafe_source/);
});
test('index mode reads staged blobs and reports private indexed files without opening them',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 git(['init','--quiet']);fs.writeFileSync(path.join(root,'src','example.js'),assignment('KNOWN_'+'PRODUCTION_PREFIX',only+'PREFIX'));git(['add','src/example.js']);fs.writeFileSync(path.join(root,'src','example.js'),'safe working copy');const value=comprovaLiteralsSecrets({root,index:true});assert.equal(value.ok,false);assert.equal(value.source,'git-index');assert.equal(value.findings[0].ruleId,'known-production-literal');
 fs.writeFileSync(path.join(root,'.env'),'placeholder');git(['add','.env']);fs.chmodSync(path.join(root,'.env'),0);assert.ok(comprovaLiteralsSecrets({root,index:true}).findings.some(f=>f.ruleId==='private-file-indexed'));fs.chmodSync(path.join(root,'.env'),0o600);
});

test('quoted JSON and specific provider assignments detect generated eight-character literals',()=>{
 const canary=Buffer.from(only+'SHORT_CANARY').toString('hex').slice(0,8);
 for(const name of ['MASTODON_ACCESS_TOKEN','SMTP_PASSWORD','PGPASSWORD','SDP_SERVICE_TOKEN','OAUTH_CLIENT_SECRET']){
  for(const text of [assignment(name,canary),JSON.stringify({[name]:canary})])assert.deepEqual(escanejaLiterals(text,'src/generated.json'),[{ruleId:'credential-assignment',path:'src/generated.json',line:1}]);
 }
 assert.deepEqual(escanejaLiterals(assignment('SMTP_PASSWORD',canary.slice(0,7))),[]);
});
test('generic names require a strong complete literal or explicit OAuth client context',()=>{
 const strong=only.toLowerCase()+'Aa7!'.repeat(4),short=Buffer.from(only).toString('hex').slice(0,8);
 for(const name of ['password','PASSWORD','access_token','accessToken','refresh_token','client_secret','token']){
  for(const text of [assignment(name,strong),JSON.stringify({[name]:strong})])assert.equal(escanejaLiterals(text)[0].ruleId,'credential-assignment');
  for(const value of [short,'The access token is unavailable','lowercase_ambiguous_example_value'])assert.deepEqual(escanejaLiterals(assignment(name,value)),[]);
 }
 const oauth=JSON.stringify({client_id:only+'CLIENT',client_secret:short});
 assert.equal(escanejaLiterals(oauth)[0].ruleId,'credential-assignment');
});
test('synthetic exemption is strict and applies only to credential assignments',()=>{
 assert.deepEqual(escanejaLiterals(assignment('password',only+'PUBLIC_TEST_CANARY')),[]);
 for(const value of [only+'lowercase_canary','prefix_'+only+'CANARY',only+'BAD/suffix'])assert.equal(escanejaLiterals(assignment('password',value))[0].ruleId,'credential-assignment');
 assert.equal(escanejaLiterals(assignment('KNOWN_'+'PRODUCTION_STUB',only+'CANARY'))[0].ruleId,'known-production-literal');
 const complete=['ghp','_','A'.repeat(36)].join('');assert.equal(escanejaLiterals(complete)[0].ruleId,'github-token');
});
test('line indexing stays exact over many findings and the per-file finding cap fails closed',()=>{
 const row=assignment('KNOWN_'+'PRODUCTION_STUB',only+'CANARY');
 const result=escanejaLiterals(Array(200).fill(row).join('\n'),'src/generated.js');
 assert.equal(result.length,200);assert.deepEqual(result.map(item=>item.line),Array.from({length:200},(_,i)=>i+1));
 assert.throws(()=>escanejaLiterals(Array(LIMITS_LITERAL_SECRETS.maxFindings+1).fill(row).join('\n')),/secret_gate_finding_limit/);
});
test('finding cap also bounds the total across public source files',t=>{
 const root=fixture(t),row=assignment('KNOWN_'+'PRODUCTION_STUB',only+'CANARY');
 for(const name of ['a.js','b.js'])fs.writeFileSync(path.join(root,'src',name),Array(600).fill(row).join('\n'));
 assert.throws(()=>comprovaLiteralsSecrets({root,index:false}),/secret_gate_finding_limit/);
});
test('batched index scan preserves each path for duplicate blobs and many safe files',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 git(['init','--quiet']);
 for(let i=0;i<128;i++)fs.writeFileSync(path.join(root,'src','safe-'+i+'.js'),'export const safe=true;');
 for(const name of ['a.js','b.js'])fs.writeFileSync(path.join(root,'src',name),assignment('KNOWN_'+'PRODUCTION_STUB',only+'CANARY'));
 git(['add','src']);const result=comprovaLiteralsSecrets({root,index:true});assert.equal(result.files,130);assert.deepEqual(result.findings.map(item=>item.path),['src/a.js','src/b.js']);
});
test('batch size preflight rejects an oversized staged blob before scanning its bytes',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 git(['init','--quiet']);fs.writeFileSync(path.join(root,'src','oversized.txt'),Buffer.alloc(LIMITS_LITERAL_SECRETS.maxFile+1,65));git(['add','src']);
 assert.throws(()=>comprovaLiteralsSecrets({root,index:true}),/secret_gate_resource_limit/);
});

test('concatenated fragments are not complete assignments while full provider shapes remain detected',()=>{
 const generated=only.toLowerCase()+'Aa7!'.repeat(4);
 for(const name of ['token','password','SMTP_PASSWORD'])assert.deepEqual(escanejaLiterals(assignment(name,generated).slice(0,-1)+' + dynamicPart;'),[]);
 const complete=['ghp','_','A'.repeat(36)].join('');
 assert.ok(escanejaLiterals(assignment('password',complete).slice(0,-1)+' + dynamicPart;').some(item=>item.ruleId==='github-token'));
 assert.ok(escanejaLiterals(assignment('KNOWN_'+'PRODUCTION_STUB',only+'CANARY').slice(0,-1)+' + dynamicPart;').some(item=>item.ruleId==='known-production-literal'));
});

test('only exact public dotenv templates are scanned and nonempty unquoted credentials are redacted',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 fs.writeFileSync(path.join(root,'.env.example'),'SMTP_PASSWORD=\nPGPASSWORD= # fill locally\nVITE_SUPABASE_URL=https://example.invalid\n');
 assert.equal(comprovaLiteralsSecrets({root,index:false}).ok,true);
 fs.mkdirSync(path.join(root,'scripts/botigues'),{recursive:true});fs.writeFileSync(path.join(root,'scripts/botigues/botigues.env.exemple.txt'),'SMTP_PASSWORD='+only+'UNQUOTED_CANARY\n');
 const found=comprovaLiteralsSecrets({root,index:false});assert.deepEqual(found.findings,[{ruleId:'dotenv-credential-literal',path:'scripts/botigues/botigues.env.exemple.txt',line:1}]);
 git(['init','--quiet']);git(['add','.env.example','scripts/botigues/botigues.env.exemple.txt']);
 assert.deepEqual(comprovaLiteralsSecrets({root,index:true}).findings,found.findings);
 fs.writeFileSync(path.join(root,'.env.other.example'),'not opened');git(['add','.env.other.example']);fs.chmodSync(path.join(root,'.env.other.example'),0);
 assert.ok(comprovaLiteralsSecrets({root,index:true}).findings.some(item=>item.ruleId==='private-file-indexed'&&item.path==='.env.other.example'));
 fs.chmodSync(path.join(root,'.env.other.example'),0o600);
});

test('canonical direct runtime turn and contract JSON receipts are scanned as public evidence',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 for(const directory of ['turns','contracts']){fs.mkdirSync(path.join(root,'.agents/runtime',directory),{recursive:true});fs.writeFileSync(path.join(root,'.agents/runtime',directory,'x.json'),JSON.stringify({schema:'sdp.test',status:'closed',sha256:'a'.repeat(64)}));}
 git(['init','--quiet']);git(['add','.agents/runtime']);
 for(const index of [true,false]){const result=comprovaLiteralsSecrets({root,index});assert.equal(result.ok,true);assert.equal(result.files,2);assert.deepEqual(result.findings,[]);}
});

test('runtime locks, logs, ledgers, pointers, nested JSON and lookalike directories remain forbidden in Git',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 const names=['x.lock','x.log','ledger.json','current.json','turns/x.lock','turns/x.log','turns/nested/x.json','contracts/nested/x.json','contracts_backup/x.json','turns/.env.json'];
 for(const name of names){const file=path.join(root,'.agents/runtime',name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'{}');}
 git(['init','--quiet']);git(['add','.agents/runtime']);
 const found=comprovaLiteralsSecrets({root,index:true});assert.equal(found.ok,false);
 assert.deepEqual(found.findings.map(f=>f.path).sort(),names.map(n=>'.agents/runtime/'+n).sort());
 assert.ok(found.findings.every(f=>f.ruleId==='private-file-indexed'));
});

test('a secret inside staged contract JSON is never exempted, even with a clean working copy',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 const directory=path.join(root,'.agents/runtime/contracts');fs.mkdirSync(directory,{recursive:true});
 const secret=Buffer.from(only+'CONTRACT_CANARY').toString('hex'),file=path.join(directory,'x.json');
 fs.writeFileSync(file,JSON.stringify({['SMTP_'+'PASSWORD']:secret}));
 assert.equal(comprovaLiteralsSecrets({root,index:false}).findings[0].ruleId,'credential-assignment');
 git(['init','--quiet']);git(['add','.agents/runtime/contracts/x.json']);fs.writeFileSync(file,'{}');
 const found=comprovaLiteralsSecrets({root,index:true});assert.equal(found.ok,false);
 assert.deepEqual(found.findings,[{ruleId:'credential-assignment',path:'.agents/runtime/contracts/x.json',line:1}]);
 assert.equal(JSON.stringify(found).includes(secret),false);
});


test('bounded Git batches still scan late receipts and all paths sharing a blob',t=>{
 const root=fixture(t),git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});assert.equal(r.status,0,r.stderr);};
 fs.mkdirSync(path.join(root,'.agents/runtime/turns'),{recursive:true});
 fs.writeFileSync(path.join(root,'.agents/runtime/turns/a.json'),JSON.stringify({body:'x'.repeat(LIMITS_LITERAL_SECRETS.maxBatch-32)}));
 const secret=Buffer.from(only+'LATE_BATCH_CANARY').toString('hex');
 for(const name of ['b','c'])fs.writeFileSync(path.join(root,'.agents/runtime/turns',name+'.json'),JSON.stringify({body:'y'.repeat(1024),['SMTP_'+'PASSWORD']:secret}));
 git(['init','--quiet']);git(['add','.agents/runtime']);const result=comprovaLiteralsSecrets({root,index:true});
 assert.equal(result.files,3);assert.equal(result.ok,false);
 assert.deepEqual(result.findings.map(item=>item.path),['.agents/runtime/turns/b.json','.agents/runtime/turns/c.json']);
 assert.ok(result.findings.every(item=>item.ruleId==='credential-assignment'));assert.equal(JSON.stringify(result).includes(secret),false);
});
