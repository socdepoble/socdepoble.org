/** Deterministic runtime installer probes: fake HTTPS metadata and tar commands,
 * real filesystem/hash/path checks, no network, no native downloaded binary execution.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { createHash } from 'node:crypto';
import { analitzaChecksum, validaAssetCaddy, main } from '../tooling/node0/prepara-runtime-node0.mjs';
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const NODE_VERSION='v24.1.0',CADDY_VERSION='2.11.8';
const NODE_NAME=`node-${NODE_VERSION}-darwin-arm64.tar.gz`;
const CADDY_NAME=`caddy_${CADDY_VERSION}_mac_arm64.tar.gz`;
const NODE_BASE=`https://nodejs.org/dist/${NODE_VERSION}/`;
const CADDY_BASE=`https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/`;
const bytesNode=Buffer.from('verified-node-archive-fixture');
const bytesCaddy=Buffer.from('verified-caddy-archive-fixture');
const trustedNode=Buffer.from('trusted Node binary, not executable test code\n');
const trustedCaddy=Buffer.from('trusted Caddy binary, not executable test code\n');
const file=(root,name,data)=>{const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data,{mode:0o755});return p;};

async function sandbox(options={},invoke=()=>main(['--apply'])){
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-runtime-adversarial-')));
  const home=path.join(dir,'user');fs.mkdirSync(home);
  const nodeDir=path.join(home,'local',`node-${NODE_VERSION}`),caddyDir=path.join(home,'local',`caddy-${CADDY_VERSION}`);
  if(options.nodeDrift)file(nodeDir,'bin/node','malicious same-version node fixture');
  if(options.caddyDrift)file(caddyDir,'caddy','malicious same-version caddy fixture');
  const saved={fetch:globalThis.fetch,homedir:os.homedir,networkInterfaces:os.networkInterfaces,tmpdir:os.tmpdir,spawnSync:childProcess.spawnSync,stdout:process.stdout.write,platform:Object.getOwnPropertyDescriptor(process,'platform'),arch:Object.getOwnPropertyDescriptor(process,'arch')};
  const fetched=[],commands=[],output=[];
  const response=(body,url,{status=200,headers={}}={})=>{const r=new Response(body,{status,headers});Object.defineProperty(r,'url',{value:url});return r;};
  const release={tag_name:'v'+CADDY_VERSION,assets:[{name:CADDY_NAME,browser_download_url:CADDY_BASE+CADDY_NAME,digest:'sha256:'+hash(bytesCaddy)},{name:`caddy_${CADDY_VERSION}_checksums.txt`,browser_download_url:CADDY_BASE+`caddy_${CADDY_VERSION}_checksums.txt`}]};
  if(options.wrongRepository)release.assets[0].browser_download_url=`https://github.com/attacker/caddy/releases/download/v${CADDY_VERSION}/${CADDY_NAME}`;
  const algorithm=options.checksumAlgorithm||'sha512';
  let caddyDigest=hash(bytesCaddy,algorithm);if(options.checksumTamper)caddyDigest=(caddyDigest[0]==='0'?'1':'0')+caddyDigest.slice(1);
  try{
    Object.defineProperty(process,'platform',{...saved.platform,value:'darwin'});
    Object.defineProperty(process,'arch',{...saved.arch,value:'arm64'});
    os.homedir=()=>home;os.tmpdir=()=>dir;os.networkInterfaces=()=>({fixture:[{address:'192.168.0.23'}]});
    process.stdout.write=function(chunk){output.push(String(chunk));return true;};
    childProcess.spawnSync=(command,args)=>{
      commands.push({command,args:[...args]});
      if(command==='/usr/bin/tar'){
        const out=args[args.indexOf('-C')+1];
        if(args.includes('--strip-components=1')){
          file(out,'bin/node',trustedNode);file(out,'lib/node_modules/npm/bin/npm-cli.js','npm fixture');
          fs.symlinkSync('../lib/node_modules/npm/bin/npm-cli.js',path.join(out,'bin/npm'));
        }else file(out,'caddy',trustedCaddy);
        return{status:0,stdout:'',stderr:''};
      }
      if(command===path.join(nodeDir,'bin/node'))return{status:0,stdout:NODE_VERSION+'\n',stderr:''};
      if(command===path.join(caddyDir,'caddy'))return{status:0,stdout:(options.caddyVersionOutput||'v'+CADDY_VERSION+' h1:fixture')+'\n',stderr:''};
      throw new Error('Unexpected command in isolated runtime test');
    };
    syncBuiltinESMExports();
    globalThis.fetch=async(input,init)=>{
      const url=String(input);fetched.push(url);assert.equal(init.redirect,'manual');
      if(options.badRedirect&&fetched.length===1)return response(null,url,{status:302,headers:{location:'http://127.0.0.1/private'}});
      if(options.redirectLoop)return response(null,url,{status:302,headers:{location:url}});
      if(url==='https://nodejs.org/dist/index.json')return response(JSON.stringify([{version:NODE_VERSION,lts:'Krypton',files:['osx-arm64-tar']}]),url);
      if(url===NODE_BASE+'SHASUMS256.txt')return response(`${hash(bytesNode)}  ${NODE_NAME}\n`,url);
      if(url===NODE_BASE+NODE_NAME)return response(bytesNode,url);
      if(url==='https://api.github.com/repos/caddyserver/caddy/releases/latest')return response(JSON.stringify(release),url);
      if(url===CADDY_BASE+`caddy_${CADDY_VERSION}_checksums.txt`)return response(`${caddyDigest}  ${CADDY_NAME}\n`,url);
      if(url===CADDY_BASE+CADDY_NAME)return response(bytesCaddy,url);
      throw new Error('Unexpected URL in isolated runtime test');
    };
    let error;try{await invoke();}catch(e){error=e;}
    return{dir,home,nodeDir,caddyDir,error,fetched,commands,output};
  }finally{
    globalThis.fetch=saved.fetch;os.homedir=saved.homedir;os.tmpdir=saved.tmpdir;os.networkInterfaces=saved.networkInterfaces;childProcess.spawnSync=saved.spawnSync;process.stdout.write=saved.stdout;
    Object.defineProperty(process,'platform',saved.platform);Object.defineProperty(process,'arch',saved.arch);syncBuiltinESMExports();
  }
}

test('checksum parser accepts exact unique SHA256 record and rejects duplicate/prefix alias',()=>{
  const digest=hash(bytesNode);assert.deepEqual(analitzaChecksum(`${digest}  ${NODE_NAME}\n`,NODE_NAME,{algorithm:'sha256'}),{algorithm:'sha256',digest});
  assert.throws(()=>analitzaChecksum(`${digest}  evil-${NODE_NAME}\n`,NODE_NAME),/entry_invalid/);
  assert.throws(()=>analitzaChecksum(`${digest}  ${NODE_NAME}\n${digest}  ${NODE_NAME}\n`,NODE_NAME),/entry_invalid/);
  assert.throws(()=>analitzaChecksum(`${'g'.repeat(64)}  ${NODE_NAME}`,NODE_NAME),/entry_invalid/);
});
test('SHA512 manifests keep all128 hex digits and cannot downgrade Node SHA256',()=>{
  const digest=hash(bytesCaddy,'sha512');assert.deepEqual(analitzaChecksum(`${digest}  ${CADDY_NAME}`,CADDY_NAME),{algorithm:'sha512',digest});
  assert.throws(()=>analitzaChecksum(`${digest}  ${CADDY_NAME}`,CADDY_NAME,{algorithm:'sha256'}),/algorithm_invalid/);
  assert.throws(()=>analitzaChecksum(`${digest.slice(0,127)}  ${CADDY_NAME}`,CADDY_NAME),/entry_invalid/);
});
test('Caddy asset is pinned to exact HTTPS repository, tag, name and URI',()=>{
  const asset={name:CADDY_NAME,browser_download_url:CADDY_BASE+CADDY_NAME};assert.equal(validaAssetCaddy(asset,CADDY_VERSION,CADDY_NAME),asset.browser_download_url);
  for(const value of [asset.browser_download_url.replace('caddyserver/','attacker/'),asset.browser_download_url.replace('https:','http:'),asset.browser_download_url+'?x=1',asset.browser_download_url+'#x',asset.browser_download_url.replace('/v'+CADDY_VERSION+'/', '/v0.0.1/'),asset.browser_download_url.replace('github.com','github.com.evil.example')])assert.throws(()=>validaAssetCaddy({...asset,browser_download_url:value},CADDY_VERSION,CADDY_NAME),/origin_rejected/);
});
test('main validates SHA512 fixture and installed hashes, preserving relative npm link',async()=>{
  const s=await sandbox();assert.equal(s.error,undefined,s.error?.stack);const receipt=JSON.parse(s.output.join(''));
  assert.equal(receipt.caddy.releaseChecksum.algorithm,'sha512');assert.equal(receipt.caddy.archiveSha256,hash(bytesCaddy));
  assert.equal(receipt.node.binarySha256,hash(trustedNode));assert.equal(receipt.caddy.binarySha256,hash(trustedCaddy));
  assert.equal(fs.readlinkSync(path.join(s.nodeDir,'bin/npm')),'../lib/node_modules/npm/bin/npm-cli.js');
});
test('existing fake Node with same advertised version is refused before execution',async()=>{
  const s=await sandbox({nodeDrift:true});assert.equal(s.error?.message,'node0_node_binary_drift');
  assert.ok(!s.commands.some(c=>c.command===path.join(s.nodeDir,'bin/node')));
  assert.equal(fs.readFileSync(path.join(s.nodeDir,'bin/node'),'utf8'),'malicious same-version node fixture');
});
test('existing fake Caddy with same advertised version is refused before execution',async()=>{
  const s=await sandbox({caddyDrift:true});assert.equal(s.error?.message,'node0_caddy_binary_drift');
  assert.ok(!s.commands.some(c=>c.command===path.join(s.caddyDir,'caddy')));
});
test('one changed SHA512 digit refuses Caddy before extraction or execution',async()=>{
  const s=await sandbox({checksumTamper:true});assert.equal(s.error?.message,'node0_caddy_checksum_failed');
  assert.equal(s.commands.filter(c=>c.command==='/usr/bin/tar').length,1);
  assert.ok(!s.commands.some(c=>c.command===path.join(s.caddyDir,'caddy')));
});
test('alternate Caddy repository is rejected before requesting its URL',async()=>{
  const s=await sandbox({wrongRepository:true});assert.equal(s.error?.message,'node0_caddy_origin_rejected');
  assert.ok(!s.fetched.some(url=>url.includes('/attacker/')));
});
test('insecure/private redirect is rejected before following it',async()=>{
  const s=await sandbox({badRedirect:true});assert.equal(s.error?.message,'node0_runtime_origin_rejected');assert.deepEqual(s.fetched,['https://nodejs.org/dist/index.json']);
});
test('redirect loop stops at four checked network hops',async()=>{
  const s=await sandbox({redirectLoop:true});assert.equal(s.error?.message,'node0_runtime_redirect_limit');assert.equal(s.fetched.length,4);
});
test('Caddy version token rejects a longer lookalike version',async()=>{
  const s=await sandbox({caddyVersionOutput:'v'+CADDY_VERSION+'0 h1:fixture'});assert.equal(s.error?.message,'node0_caddy_version_mismatch');
});
test('default runtime invocation is read-only and has no download or command',async()=>{
  const s=await sandbox({},()=>main([]));assert.equal(s.error,undefined);assert.equal(JSON.parse(s.output.join('')).applied,false);assert.deepEqual(s.fetched,[]);assert.deepEqual(s.commands,[]);assert.equal(fs.existsSync(path.join(s.home,'local')),false);
});
