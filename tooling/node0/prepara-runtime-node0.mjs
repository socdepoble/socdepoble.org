#!/usr/bin/env node
/** User-local official Node 24 and Caddy, SHA-256 pinned to their official release metadata. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { camiSegur, fitxerRegular } from './fitxers-segurs.mjs';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function analitzaChecksum(text,name,{algorithm}={}){
  const found=[];
  for(const line of text.split('\n')){const parts=line.trim().split(/\s+/);if(parts.length===2&&parts[1]===name&&/^(?:[a-f0-9]{64}|[a-f0-9]{128})$/.test(parts[0]))found.push(parts[0]);}
  if(found.length!==1)throw new Error('node0_checksum_entry_invalid');
  const digest=found[0],alg=digest.length===128?'sha512':'sha256';
  if(algorithm&&alg!==algorithm)throw new Error('node0_checksum_algorithm_invalid');
  return{algorithm:alg,digest};
}
export function validaAssetCaddy(asset,version,name){
  if(asset?.name!==name||asset.browser_download_url!==`https://github.com/caddyserver/caddy/releases/download/v${version}/${name}`)throw new Error('node0_caddy_origin_rejected');
  return asset.browser_download_url;
}
const execute = (cmd,args) => {const r=spawnSync(cmd,args,{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});if(r.status!==0||r.error)throw new Error('node0_runtime_command_failed');return r.stdout.trim();};
async function download(url,maxBytes=80*1024*1024){
  const started=Date.now();let response;
  for(let hop=0;hop<4;hop++){
    const target=new URL(url);
    if(target.protocol!=='https:'||target.username||target.password||!['nodejs.org','api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(target.hostname))throw new Error('node0_runtime_origin_rejected');
    response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(Math.max(1,120000-(Date.now()-started))),headers:{'User-Agent':'socdepoble-node0-installer','Accept':target.hostname==='api.github.com'?'application/vnd.github+json':'application/octet-stream'}});
    if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');await response.body?.cancel();if(!location||hop===3)throw new Error('node0_runtime_redirect_limit');url=new URL(location,target).href;continue;}
    break;
  }
  if(!response.ok)throw new Error('node0_runtime_download_failed');
  const final=new URL(response.url);
  if(final.protocol!=='https:'||!['nodejs.org','api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(final.hostname))throw new Error('node0_runtime_origin_rejected');
  const chunks=[];let count=0;
  for await(const chunk of response.body){count+=chunk.length;if(count>maxBytes)throw new Error('node0_runtime_download_limit');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export async function main(args=process.argv.slice(2)){
  if(args.some(a=>a!=='--apply'))throw new Error('node0_runtime_argument_invalid');
  if(!args.includes('--apply')){process.stdout.write(JSON.stringify({applied:false,node:24,caddy:'official stable mac_arm64',scope:'user-local only'})+'\n');return;}
  if(process.platform!=='darwin'||process.arch!=='arm64'||!Object.values(os.networkInterfaces()).flat().some(a=>a?.address==='192.168.0.23'))throw new Error('node0_wrong_machine');
  const local=camiSegur(path.join(os.homedir(),'local'),{allowMissing:true}),stage=fs.mkdtempSync(path.join(os.tmpdir(),'node0-runtime-'));fs.mkdirSync(local,{recursive:true});
  const index=JSON.parse((await download('https://nodejs.org/dist/index.json',2*1024*1024)).toString('utf8'));
  const version=index.find(r=>/^v24\.\d+\.\d+$/.test(r.version)&&r.lts)?.version;if(!version)throw new Error('node0_node24_release_missing');
  const nodeName=`node-${version}-darwin-arm64.tar.gz`,nodeBase=`https://nodejs.org/dist/${version}/`;
  const nodeChecks=(await download(nodeBase+'SHASUMS256.txt',256*1024)).toString('utf8');
  const expectedNode=analitzaChecksum(nodeChecks,nodeName,{algorithm:'sha256'}).digest;
  const nodeBytes=await download(nodeBase+nodeName);if(!expectedNode||sha(nodeBytes)!==expectedNode)throw new Error('node0_node_checksum_failed');
  const nodeTar=path.join(stage,nodeName);fs.writeFileSync(nodeTar,nodeBytes,{flag:'wx'});
  const trustedNodeDir=path.join(stage,'node');fs.mkdirSync(trustedNodeDir);execute('/usr/bin/tar',['-xzf',nodeTar,'--strip-components=1','-C',trustedNodeDir]);
  const trustedNodeSha=sha(fs.readFileSync(fitxerRegular(path.join(trustedNodeDir,'bin/node')).absolute));
  const nodeDir=path.join(local,`node-${version}`);
  if(!fs.existsSync(nodeDir))fs.cpSync(trustedNodeDir,nodeDir,{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});
  const node=fitxerRegular(path.join(nodeDir,'bin/node')).absolute;
  if(sha(fs.readFileSync(node))!==trustedNodeSha)throw new Error('node0_node_binary_drift');
  if(execute(node,['--version'])!==version)throw new Error('node0_node_version_mismatch');
  const release=JSON.parse((await download('https://api.github.com/repos/caddyserver/caddy/releases/latest',2*1024*1024)).toString('utf8'));
  const caddyVersion=release.tag_name?.replace(/^v/,'');if(!/^\d+\.\d+\.\d+$/.test(caddyVersion))throw new Error('node0_caddy_version_missing');
  const caddyName=`caddy_${caddyVersion}_mac_arm64.tar.gz`;
  const asset=release.assets.find(a=>a.name===caddyName),checks=release.assets.find(a=>a.name===`caddy_${caddyVersion}_checksums.txt`);
  if(!asset||!checks)throw new Error('node0_caddy_asset_missing');
  validaAssetCaddy(asset,caddyVersion,caddyName);validaAssetCaddy(checks,caddyVersion,`caddy_${caddyVersion}_checksums.txt`);
  const checkText=(await download(checks.browser_download_url,256*1024)).toString('utf8');
  const caddyChecksum=analitzaChecksum(checkText,caddyName);
  const caddyBytes=await download(asset.browser_download_url);if(createHash(caddyChecksum.algorithm).update(caddyBytes).digest('hex')!==caddyChecksum.digest)throw new Error('node0_caddy_checksum_failed');
  const expectedCaddy=sha(caddyBytes);
  if(asset.digest&&asset.digest!==`sha256:${expectedCaddy}`)throw new Error('node0_caddy_api_digest_mismatch');
  const caddyTar=path.join(stage,caddyName);fs.writeFileSync(caddyTar,caddyBytes,{flag:'wx'});
  const trustedCaddyDir=path.join(stage,'caddy');fs.mkdirSync(trustedCaddyDir);execute('/usr/bin/tar',['-xzf',caddyTar,'-C',trustedCaddyDir,'caddy']);
  const trustedCaddySha=sha(fs.readFileSync(fitxerRegular(path.join(trustedCaddyDir,'caddy')).absolute));
  const caddyDir=path.join(local,`caddy-${caddyVersion}`);if(!fs.existsSync(caddyDir))fs.cpSync(trustedCaddyDir,caddyDir,{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});
  const caddy=fitxerRegular(path.join(caddyDir,'caddy')).absolute;
  if(sha(fs.readFileSync(caddy))!==trustedCaddySha)throw new Error('node0_caddy_binary_drift');
  const installed=execute(caddy,['version']);if(installed.split(' ')[0]!=='v'+caddyVersion)throw new Error('node0_caddy_version_mismatch');
  const receipt={applied:true,node:{version,archiveSha256:expectedNode,binarySha256:trustedNodeSha,path:node},caddy:{version:caddyVersion,archiveSha256:expectedCaddy,releaseChecksum:caddyChecksum,binarySha256:trustedCaddySha,path:caddy},verification:'official HTTPS release metadata + SHA-256 / release SHA-512, no GPG/cosign authentication claimed'};
  const file=path.join(local,'socdepoble-runtime-receipt.json');fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{mode:0o644});process.stdout.write(JSON.stringify(receipt)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{process.stderr.write('node0_runtime_prepare_failed:'+((error.message||'').startsWith('node0_')?error.message:(error.cause?.code||'unknown'))+'\n');process.exitCode=1;});
