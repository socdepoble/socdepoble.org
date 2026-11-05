#!/usr/bin/env node
/** Add a user-local Caddy gateway in front of the existing web server.
 * The existing web service on 3350 remains running. Tunnel routing uses CAS.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fitxerRegular, camiSegur } from './fitxers-segurs.mjs';
import { configuraCaddy } from './installa-node0.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=value=>createHash('sha256').update(value).digest('hex');
const xml=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function run(cmd,args,{allowFailure=false}={}){const r=spawnSync(cmd,args,{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});if(!allowFailure&&(r.status!==0||r.error))throw new Error('node0_gateway_command_failed');return r.stdout.trim();}
export function configuraIngress(text){
  let host=null,hostIndent=0,changed=0,already=0;const seen=new Set(),services=new Map();
  const lines=text.split('\n').map(line=>{
    const hostLine=/^(\s*)-\s*hostname:\s*(\S+)\s*$/.exec(line);if(hostLine){host=hostLine[2];hostIndent=hostLine[1].length;if(['socdepoble.cat','www.socdepoble.cat'].includes(host)){if(seen.has(host))throw new Error('node0_tunnel_hosts_missing_or_duplicate');seen.add(host);}return line;}
    const service=/^(\s*)service:(\s*)(\S+)\s*$/.exec(line);
    if(service&&service[1].length===hostIndent+2&&['socdepoble.cat','www.socdepoble.cat'].includes(host)){
      services.set(host,(services.get(host)||0)+1);if(services.get(host)!==1)throw new Error('node0_tunnel_hosts_missing_or_duplicate');
      if(service[3]==='http://127.0.0.1:3350'){changed++;return service[1]+'service:'+service[2]+'http://127.0.0.1:4341';}
      if(service[3]==='http://127.0.0.1:4341'){already++;return line;}
      throw new Error('node0_tunnel_origin_unexpected');
    }
    if(/^\s*-\s*service:/.test(line))host=null;
    return line;
  });
  if(changed+already!==2||seen.size!==2||[...seen].some(value=>services.get(value)!==1))throw new Error('node0_tunnel_hosts_missing_or_duplicate');
  return{candidate:lines.join('\n'),changed,already};
}
export function reemplaçaIngress({file,expectedSha,candidate,afterReplace}){
  const {absolute,stat}=fitxerRegular(file),before=fs.readFileSync(absolute);
  if(sha(before)!==expectedSha)throw new Error('node0_tunnel_preimage_drift');
  if(before.toString('utf8')===candidate)return{changed:false,backup:null};
  const backup=`${absolute}.node0-${expectedSha.slice(0,12)}.backup`;
  if(fs.existsSync(backup)){fitxerRegular(backup);if(sha(fs.readFileSync(backup))!==expectedSha)throw new Error('node0_tunnel_backup_drift');}
  else fs.writeFileSync(backup,before,{flag:'wx',mode:0o600});
  const proposed=Buffer.from(candidate),temp=`${absolute}.node0-${randomBytes(8).toString('hex')}.tmp`;
  fs.writeFileSync(temp,proposed,{flag:'wx',mode:stat.mode&0o777});
  if(sha(fs.readFileSync(absolute))!==expectedSha)throw new Error('node0_tunnel_preimage_drift');
  fs.renameSync(temp,absolute);
  try{afterReplace();}catch(error){
    try{fitxerRegular(absolute);}catch{throw new Error('node0_tunnel_recovery_required');}
    if(sha(fs.readFileSync(absolute))!==sha(proposed))throw new Error('node0_tunnel_recovery_required');
    const restore=`${absolute}.node0-${randomBytes(8).toString('hex')}.tmp`;fs.writeFileSync(restore,before,{flag:'wx',mode:stat.mode&0o777});fs.renameSync(restore,absolute);
    throw error;
  }
  return{changed:true,backup};
}
/** Exercise the legacy web with its PUBLIC Host before moving any tunnel.
 * Otherwise the old web treats loopback Host specially and can hide HTTPS redirect loops.
 */
export async function verificaWebDelGateway(fetchImpl=globalThis.fetch){
  const options={redirect:'manual',headers:{Host:'socdepoble.cat'},signal:AbortSignal.timeout(5000)};
  const home=await fetchImpl('http://127.0.0.1:4341/',options);
  if(home.status!==200||!(home.headers.get('content-type')||'').startsWith('text/html'))throw new Error('node0_gateway_web_preflight_failed');
  await home.body?.cancel();
  const info=await fetchImpl('http://127.0.0.1:4341/.well-known/nodeinfo',{...options,signal:AbortSignal.timeout(5000)});
  if(info.status!==200||!(info.headers.get('content-type')||'').includes('json'))throw new Error('node0_gateway_nodeinfo_preflight_failed');
  const nodeinfo=await info.json();
  if(!Array.isArray(nodeinfo.links)||!nodeinfo.links.length)throw new Error('node0_gateway_nodeinfo_preflight_failed');
}
export async function main(args=process.argv.slice(2)){
  if(args.some(arg=>arg!=='--apply'))throw new Error('node0_gateway_argument_invalid');
  if(!args.includes('--apply')){process.stdout.write(JSON.stringify({applied:false,listen:'127.0.0.1:4341',api:'127.0.0.1:4340',existingWeb:'127.0.0.1:3350'})+'\n');return;}
  if(process.platform!=='darwin'||!Object.values(os.networkInterfaces()).flat().some(a=>a?.address==='192.168.0.23'))throw new Error('node0_wrong_machine');
  const receiptFile=fitxerRegular(path.join(os.homedir(),'local/socdepoble-runtime-receipt.json')).absolute;
  const runtime=JSON.parse(fs.readFileSync(receiptFile,'utf8')),caddy=fitxerRegular(runtime.caddy.path).absolute;
  if(sha(fs.readFileSync(caddy))!==runtime.caddy.binarySha256)throw new Error('node0_caddy_binary_drift');
  const directory=camiSegur(path.join(os.homedir(),'.config/socdepoble'),{allowMissing:true});fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const fragment=fs.readFileSync(path.join(ROOT,'tooling/node0/Caddy.node0.fragment'),'utf8');
  const config=`{\n  admin 127.0.0.1:2019\n  auto_https off\n}\nhttp://:4341 {\n  bind 127.0.0.1\n${fragment}\n  handle {\n    reverse_proxy 127.0.0.1:3350 {\n      header_up X-Forwarded-Proto https\n    }\n  }\n}\n`;
  const caddyFile=path.join(directory,'Caddyfile.node0');
  if(fs.existsSync(caddyFile)){
    fitxerRegular(caddyFile);
    if(fs.readFileSync(caddyFile,'utf8')!==config){
      const previous=JSON.parse(fs.readFileSync(fitxerRegular(path.join(directory,'gateway-receipt.json')).absolute,'utf8'));
      const candidateFile=path.join(directory,'Caddyfile.node0-candidate-'+randomBytes(8).toString('hex'));
      fs.writeFileSync(candidateFile,config,{flag:'wx',mode:0o600});
      configuraCaddy({original:caddyFile,candidate:candidateFile,expectedSha:previous.caddy.configSha256,caddy});
    }
  }
  else fs.writeFileSync(caddyFile,config,{flag:'wx',mode:0o600});
  run(caddy,['validate','--config',caddyFile,'--adapter','caddyfile']);
  const domain=`gui/${process.getuid()}`,label='cat.socdepoble.caddy-soberania';
  const launchDir=camiSegur(path.join(os.homedir(),'Library/LaunchAgents'));const plist=path.join(launchDir,label+'.plist');
  const contents=`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array><string>${xml(caddy)}</string><string>run</string><string>--config</string><string>${xml(caddyFile)}</string><string>--adapter</string><string>caddyfile</string></array><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>15</integer><key>StandardOutPath</key><string>${xml(path.join(directory,'caddy.stdout.log'))}</string><key>StandardErrorPath</key><string>${xml(path.join(directory,'caddy.stderr.log'))}</string></dict></plist>`;
  if(fs.existsSync(plist)){fitxerRegular(plist);if(fs.readFileSync(plist,'utf8')!==contents)throw new Error('node0_caddy_launch_config_drift');}
  else fs.writeFileSync(plist,contents,{flag:'wx',mode:0o600});
  run('/usr/bin/plutil',['-lint',plist]);
  // Re-running a healthy gateway does not restart it.
  const loaded=spawnSync('/bin/launchctl',['print',`${domain}/${label}`],{stdio:'ignore'}).status===0;
  if(!loaded)run('/bin/launchctl',['bootstrap',domain,plist]);
  let localHealthy=false;
  for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:4341/api/v1/node0/status',{signal:AbortSignal.timeout(1000)});if(r.ok&&(await r.json()).postgresql?.ok===true){localHealthy=true;break;}}catch{/* startup */}await new Promise(resolve=>setTimeout(resolve,250));}
  if(!localHealthy)throw new Error('node0_caddy_local_health_failed');
  await verificaWebDelGateway();
  const cloudflareFile=fitxerRegular(path.join(os.homedir(),'.cloudflared/config.yml')).absolute;
  const before=fs.readFileSync(cloudflareFile),plan=configuraIngress(before.toString('utf8'));
  const candidate=path.join(directory,'cloudflare-node0-candidate.yml');
  if(fs.existsSync(candidate))fitxerRegular(candidate);fs.writeFileSync(candidate,plan.candidate,{mode:0o600});
  const cloudflared=fitxerRegular(path.join(os.homedir(),'local/bin/cloudflared')).absolute;
  run(cloudflared,['tunnel','--config',candidate,'ingress','validate']);
  const restart=()=>run('/bin/launchctl',['kickstart','-k',`${domain}/org.socdepoble.cloudflared-named`]);
  let routing;
  try{routing=reemplaçaIngress({file:cloudflareFile,expectedSha:sha(before),candidate:plan.candidate,afterReplace:restart});}
  catch(error){if(error.message!=='node0_tunnel_recovery_required')restart();throw error;}
  let status;
  for(let i=0;i<40;i++){try{const r=await fetch('https://socdepoble.cat/api/v1/node0/status',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(1000)});if(r.ok&&(r.headers.get('content-type')||'').includes('application/json')){const value=await r.json();if(value.postgresql?.ok===true){status=value;break;}}}catch{/* tunnel reconnect */}await new Promise(resolve=>setTimeout(resolve,500));}
  if(!status)throw new Error('node0_public_health_pending');
  const result={applied:true,checkedAt:new Date().toISOString(),caddy:{version:runtime.caddy.version,listen:'127.0.0.1:4341',configSha256:sha(config)},routing:{...routing,beforeSha256:sha(before),afterSha256:sha(plan.candidate)},publicStatus:status};
  const out=path.join(directory,'gateway-receipt.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{mode:0o600});process.stdout.write(JSON.stringify(result)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{process.stderr.write((error.message?.startsWith('node0_')?error.message:'node0_gateway_failed')+'\n');process.exitCode=1;});
