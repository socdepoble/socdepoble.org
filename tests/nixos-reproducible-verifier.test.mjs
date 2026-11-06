import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inventariFonts, preparaFontNeta, validaLock, verificaFlake, INPUT_REVISION} from '../tooling/nixos/verifica-flake-reproduible.mjs';
import {preparaEntornNodeZero} from '../nix/start-node0.mjs';
import {main as bootstrap} from '../nix/bootstrap-node0.mjs';
const ROOT = fileURLToPath(new URL('..',import.meta.url));
const digest = 'sha256-'+Buffer.alloc(32,0xaa).toString('base64'); // Deliberately fictional test fixture; never a release lock.
const lock = () => ({version:7,root:'root',nodes:{root:{inputs:{nixpkgs:'nixpkgs'}},nixpkgs:{
  locked:{type:'github',owner:'NixOS',repo:'nixpkgs',rev:INPUT_REVISION,narHash:digest,lastModified:0},
  original:{type:'github',owner:'NixOS',repo:'nixpkgs',rev:INPUT_REVISION}}}});
function fixture(t,{withLock=true}={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-nix-fixture-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const files=['package.json','package-lock.json','index.html','firebase.json','vite.config.js','AGENTS.md','.agents/AGENTS.md',
    'scripts/botigues/associacio-apps.json','scripts/supabase/verifier.mjs','flake.nix','nix/flake.nix','nix/module.nix','nix/node0.nix',
    'nix/containers.nix','nix/start-node0.mjs','nix/bootstrap-node0.mjs','src/public.js','public/public.json','tooling/public.mjs',
    'supabase/migrations/2601010000_test.sql','supabase/ordre_desplegament.json','_wiki_de_poble/01_ser/test.md',
    '_wiki_de_poble/02_saber/test.md','_wiki_de_poble/03_actuar/test.md'];
  for (const file of files) {fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),'fixture\n');}
  for (const file of ['flake.nix','nix/flake.nix']) fs.writeFileSync(path.join(root,file),`inputs.nixpkgs.url = "github:NixOS/nixpkgs/${INPUT_REVISION}";\n`);
  if(withLock)fs.writeFileSync(path.join(root,'nix/flake.lock'),JSON.stringify(lock()));
  return root;
}
const success = stdout => ({status:0,stdout:typeof stdout === 'string' ? stdout : JSON.stringify(stdout),stderr:''});
function fakeNix({alter}={}) {
  const calls=[];
  const runner=async(binary,args)=> {
    calls.push(args); alter?.(calls,args);
    assert.equal(binary,'nix');
    assert.deepEqual(args.slice(0,2),['--extra-experimental-features','nix-command flakes']);
    const command=args[2];
    if(command==='--version')return success('nix (Nix) 2.28.8\n');
    if(command==='flake'&&args[3]==='metadata')return success({locks:lock()});
    if(command==='eval')return success(JSON.stringify(`/nix/store/${'a'.repeat(32)}-${args.at(-1).split('.').at(-2)}.drv`));
    if(command==='build'&&args.includes('--json'))return success([{drvPath:`/nix/store/${'b'.repeat(32)}-web.drv`,outputs:{out:`/nix/store/${'c'.repeat(32)}-web`,integritat:`/nix/store/${'d'.repeat(32)}-integritat`}}]);
    if(command==='hash')return success(digest+'\n');
    return success('');
  };
  return {calls,runner};
}

test('Nix: no lock and missing executable fail closed, including inspect mode',async t=> {
  const root=fixture(t,{withLock:false});let calls=0;
  const report=await verificaFlake({root,mode:'inspect',runner:async()=>{calls++;return{status:null,stdout:'',stderr:'',error:'nix_unavailable'};}});
  assert.equal(report.verified,false);assert.equal(report.status,'incomplete');assert.equal(calls,1);
  assert.deepEqual(report.issues,['nix_lock_missing','nix_unavailable']);assert.equal(report.checks.length,0);
});
test('Nix: lock graph, pin, algorithm and canonical base64 are all checked',t=> {
  const root=fixture(t);assert.equal(validaLock(root).locked.narHash,digest);
  const cases=[l=>l.version=6,l=>l.nodes.root.inputs.nixpkgs='foreign',l=>l.nodes.extra={},l=>l.nodes.nixpkgs.locked.owner='other',
    l=>l.nodes.nixpkgs.original.rev='1'.repeat(40),l=>l.nodes.nixpkgs.locked.narHash='sha256-invalid',l=>l.nodes.nixpkgs.locked.lastModified=-1];
  for(const mutate of cases){const l=lock();mutate(l);fs.writeFileSync(path.join(root,'nix/flake.lock'),JSON.stringify(l));assert.throws(()=>validaLock(root),/nix_lock_/);}
});
test('Nix: mutable branch and release/façade revision divergence are rejected',t=> {
  const root=fixture(t);fs.writeFileSync(path.join(root,'flake.nix'),'inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";');
  assert.throws(()=>validaLock(root),/nix_input_revision_drift/);
});
test('Nix: allowlist snapshot excludes repository secrets, Git and unrelated data',t=> {
  const root=fixture(t);fs.writeFileSync(path.join(root,'.env'),'secret=do-not-copy');fs.mkdirSync(path.join(root,'.git'));fs.writeFileSync(path.join(root,'.git','config'),'private');
  const before=inventariFonts(root), stage=preparaFontNeta(root,before);t.after(()=>fs.rmSync(stage,{recursive:true,force:true}));
  assert.equal(fs.existsSync(path.join(stage,'.env')),false);assert.equal(fs.existsSync(path.join(stage,'.git')),false);
  assert.equal(inventariFonts(stage).sha256,before.sha256);assert.equal(fs.statSync(path.join(stage,'src/public.js')).mtimeMs,315532800000);
  fs.writeFileSync(path.join(root,'src/public.js'),'altered');assert.throws(()=>preparaFontNeta(root,before),/nix_source_changed_before_copy/);
});
test('Nix: symlinks, special files and secret-like files inside build sources fail closed',t=> {
  const root=fixture(t);fs.symlinkSync(path.join(root,'.env'),path.join(root,'src/link'));
  assert.throws(()=>inventariFonts(root),/nix_source_symlink/);fs.unlinkSync(path.join(root,'src/link'));
  fs.writeFileSync(path.join(root,'src/.env'),'test');assert.throws(()=>inventariFonts(root),/nix_secret_like_source/);
});
test('Nix: full protocol exercises native command plan but test doubles never certify Nix',async t=> {
  const root=fixture(t),{runner,calls}=fakeNix();const report=await verificaFlake({root,runner});
  assert.deepEqual(report.issues,[]);assert.equal(report.verified,false);assert.equal(report.status,'simulated');assert.equal(report.evidenceKind,'test-double');
  assert.equal(report.checks.length,7);assert.ok(calls.some(a=>a.includes('--rebuild')));
  for(const args of calls.filter(a=>['eval','build','flake'].includes(a[2]))) {assert.ok(args.includes('--no-update-lock-file'));assert.ok(args.includes('--no-write-lock-file'));}
  const refs=calls.flat().filter(a=>a.startsWith('path:'));assert.ok(refs.length);assert.ok(refs.every(a=>a.includes('?dir=nix')));assert.ok(refs.every(a=>!a.includes(root)));
});
test('Nix: eval-only cannot certify a build',async t=> {
  const root=fixture(t),{runner,calls}=fakeNix();const report=await verificaFlake({root,runner,mode:'evaluation'});
  assert.equal(report.verified,false);assert.equal(report.checks.length,4);assert.ok(calls.every(a=>a[2]!=='build'));
});
test('Nix: content changing during evaluation invalidates the receipt',async t=> {
  const root=fixture(t),{runner}=fakeNix({alter:(_,args)=>{if(args[2]==='eval')fs.writeFileSync(path.join(root,'src/public.js'),'concurrent edit');}});
  const report=await verificaFlake({root,runner});assert.equal(report.verified,false);assert.ok(report.issues.includes('nix_sources_changed_during_verification'));
});
test('Nix: metadata mismatch and evaluation nondeterminism fail before builds',async t=> {
  const root=fixture(t),base=fakeNix();let n=0;
  const report=await verificaFlake({root,runner:async(bin,args)=>{if(args[2]==='eval')return success(JSON.stringify(`/nix/store/${String(++n).repeat(32)}-test.drv`));return base.runner(bin,args);}});
  assert.ok(report.issues.includes('nix_evaluation_not_reproducible'));assert.equal(report.checks.length,1);assert.ok(base.calls.every(a=>a[2]!=='build'));
  const mismatch=await verificaFlake({root,runner:async(bin,args)=>{if(args[2]==='flake'&&args[3]==='metadata'){const l=lock();l.nodes.nixpkgs.locked.narHash='sha256-'+Buffer.alloc(32).toString('base64');return success({locks:l});}return base.runner(bin,args);}});
  assert.ok(mismatch.issues.includes('nix_metadata_lock_mismatch'));
});
test('Nix: command stderr cannot leak into the receipt',async t=> {
  const root=fixture(t);const report=await verificaFlake({root,runner:async()=>({status:1,stdout:'private-value',stderr:'secret-token'})});
  assert.equal(JSON.stringify(report).includes('secret-token'),false);assert.equal(JSON.stringify(report).includes('private-value'),false);assert.equal(report.verified,false);
});
test('Node0 Nix credential: secrets cannot override PG, identity or activation',()=> {
  const env={CREDENTIALS_DIRECTORY:'/run/credentials/test',NODE0_PSQL:'/nix/store/test/bin/psql',PATH:'/nix/store/test/bin',PGUSER:'postgres',SDP_NODE0_AUTH:'1'};
  const token='a'.repeat(64),result=preparaEntornNodeZero({env,readFile:()=>`SDP_NODE0_ADMIN_TOKEN=${token}\n`});
  assert.equal(result.PGUSER,'node0_runtime');assert.equal(result.PGDATABASE,'socdepoble_node0');assert.equal(result.SDP_NODE0_AUTH,undefined);
  assert.equal(result.SDP_NODE0_KEY_FILE,'/var/lib/socdepoble-node0/node0_ed25519.json');
  for(const extra of ['PGUSER=postgres','SDP_NODE0_AUTH=1','NODE0_PSQL=/bin/false','SDP_NODE0_KEY_FILE=/tmp/key'])assert.throws(()=>preparaEntornNodeZero({env,readFile:()=>`SDP_NODE0_ADMIN_TOKEN=${token}\n${extra}\n`}),/credential_fields/);
  assert.throws(()=>preparaEntornNodeZero({env,readFile:()=>`SDP_NODE0_ADMIN_TOKEN=weak\n`}),/admin_token/);
  assert.throws(()=>preparaEntornNodeZero({env,readFile:()=>`SDP_NODE0_ADMIN_TOKEN=${token}\nMASTODON_ACCESS_TOKEN=a\nSDP_MASTODON_ACCESS_TOKEN=b\n`}),/token_mismatch/);
});
test('Node0 Nix credential: group-readable and symlink files are rejected',t=> {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-nix-secret-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'environment');fs.writeFileSync(file,'SDP_NODE0_ADMIN_TOKEN='+'x'.repeat(64),{mode:0o600});
  assert.equal(preparaEntornNodeZero({env:{CREDENTIALS_DIRECTORY:dir}}).SDP_NODE0_ADMIN_TOKEN.length,64);
  fs.chmodSync(file,0o640);assert.throws(()=>preparaEntornNodeZero({env:{CREDENTIALS_DIRECTORY:dir}}),/credential_permissions/);
  fs.unlinkSync(file);fs.symlinkSync('/dev/null',file);assert.throws(()=>preparaEntornNodeZero({env:{CREDENTIALS_DIRECTORY:dir}}),/credential_permissions/);
});
test('Node0 Nix bootstrap: scope and canonical source-hashed schema, no fabricated data',()=> {
  assert.throws(()=>bootstrap({env:{PGUSER:'postgres',PGDATABASE:'postgres',PGHOST:'/run/postgresql'}}),/bootstrap_scope/);
  const calls=[],receipts=[];bootstrap({env:{PGUSER:'postgres',PGDATABASE:'socdepoble_node0',PGHOST:'/run/postgresql',NODE0_PSQL:'/fixture/psql'},
    run:(bin,args,opts)=>{calls.push({bin,args,opts});return{status:0,stdout:'',stderr:''};},stdout:{write:s=>receipts.push(JSON.parse(s))}});
  assert.equal(calls.length,2);assert.match(calls[0].opts.input,/pg_advisory_lock/);assert.match(calls[0].opts.input,/node0_migration_ledger_drift/);
  assert.equal(calls[0].opts.shell,false);assert.equal(calls[1].args.at(-1),path.join(ROOT,'tooling/node0/schema-node0.sql'));assert.equal(receipts[0].publicDataImported,false);
});
test('Nix CLI: invalid options fail and never write a success receipt',()=> {
  const result=spawnSync(process.execPath,[path.join(ROOT,'tooling/nixos/verifica-flake-reproduible.mjs'),'--unknown'],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/nix_verifier_argument/);
});
