#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, createPublicKey } from 'node:crypto';
import { publicRawEd25519,codificaMultikeyEd25519 } from './actor-multikey-ed25519.mjs';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const sha=value=>createHash('sha256').update(value).digest('hex');
export async function main(args=process.argv.slice(2)){
  const out=args.find(a=>a.startsWith('--out='))?.slice(6);if(args.some(a=>a!=='--curl'&&!a.startsWith('--out=')))throw new Error('node0_verification_argument_invalid');
  const curl=args.includes('--curl');
  const results=[];
  async function read(route,{method='GET',body,status=200,asJson=true}={}){
    let r;
    if(curl){
      const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node0-public-probe-')),head=path.join(dir,'headers'),data=path.join(dir,'body');
      try{
        const options=['-sS','--max-time','15','--max-filesize','2097152','--proto','=https','--max-redirs','0','-D',head,'-o',data,'-w','%{http_code}','-X',method,'-H','Accept: application/activity+json, application/json','-H','Cache-Control: no-cache'];
        if(body)options.push('-H','Content-Type: application/activity+json','--data-raw',body);
        options.push('https://socdepoble.cat'+route);
        const code=Number(execFileSync('/usr/bin/curl',options,{encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024}));
        const blocks=fs.readFileSync(head,'utf8').trim().split(/\r?\n\r?\n/),headers={};
        for(const line of blocks.at(-1).split(/\r?\n/).slice(1)){const colon=line.indexOf(':');if(colon>0)headers[line.slice(0,colon).trim()]=line.slice(colon+1).trim();}
        r=new Response(fs.readFileSync(data),{status:code,headers});
      }finally{fs.rmSync(dir,{recursive:true,force:true});}
    }else r=await fetch('https://socdepoble.cat'+route,{method,body,redirect:'error',headers:{Accept:'application/activity+json, application/json','Cache-Control':'no-cache',...(body?{'Content-Type':'application/activity+json'}:{})},signal:AbortSignal.timeout(15000)});
    const text=await r.text();if(Buffer.byteLength(text)>2*1024*1024)throw new Error('node0_verification_response_limit');
    results.push({route,method,status:r.status,contentType:r.headers.get('content-type'),bytes:Buffer.byteLength(text),sha256:sha(text)});
    if(r.status!==status)throw new Error('node0_verification_http_failed');
    if(!asJson)return text;
    try{return JSON.parse(text);}catch{throw new Error('node0_verification_non_json:'+route);}
  }
  const status=await read('/api/v1/node0/status');
  if(status.postgresql?.ok!==true||!/^17\./.test(status.postgresql.version)||status.postgresql.schemaVersion!=='2611032100')throw new Error('node0_postgresql_not_verified');
  const actor=await read('/ap/actors/socdepoble');
  if(actor.id!=='https://socdepoble.cat/ap/actors/socdepoble'||actor.publicKey?.owner!==actor.id||actor.inbox!=='https://socdepoble.cat/ap/inbox')throw new Error('node0_actor_not_verified');
  const fingerprint=sha(createPublicKey(actor.publicKey.publicKeyPem).export({format:'der',type:'spki'}));
  if(fingerprint!==status.ed25519?.fingerprint)throw new Error('node0_public_key_mismatch');
  const assertion=actor.assertionMethod?.find(key=>key?.id===actor.publicKey.id);
  if(status.activitypub?.signatureProfile!=='rfc9421-ed25519'||assertion?.type!=='Multikey'||assertion.controller!==actor.id||assertion.publicKeyMultibase!==codificaMultikeyEd25519(publicRawEd25519(actor.publicKey.publicKeyPem)))throw new Error('node0_rfc9421_profile_not_published');
  const unsigned=await read('/ap/inbox',{method:'POST',body:'{}',status:401});
  if(unsigned.error!=='signature_missing')throw new Error('node0_inbox_unsigned_not_rejected');
  const webfinger=await read('/.well-known/webfinger?resource=acct%3Asocdepoble%40socdepoble.cat');
  if(webfinger.subject!=='acct:socdepoble@socdepoble.cat'||!webfinger.links?.some(link=>link.rel==='self'&&link.href===actor.id))throw new Error('node0_webfinger_mismatch');
  const outbox=await read('/ap/outbox');if(outbox.type!=='OrderedCollection'||!Number.isInteger(outbox.totalItems))throw new Error('node0_outbox_not_verified');
  const mur=await read('/api/v1/node0/mur');
  if(!mur.feedPosts?.some(post=>post.uri?.startsWith('https://mastodont.cat/users/depoble/statuses/')))throw new Error('node0_mastodon_not_persisted');
  const nodeinfo=await read('/.well-known/nodeinfo');if(!nodeinfo.links?.some(link=>link.rel?.includes('nodeinfo')))throw new Error('node0_nodeinfo_invalid');
  const home=await read('/',{asJson:false});if(!home.includes('<!doctype html>')&&!home.includes('<!DOCTYPE html>'))throw new Error('node0_home_not_html');
  const receipt={schema:'sdp.node0.public-verification.v1',checkedAt:new Date().toISOString(),transport:curl?'curl-system-TLS':'node-fetch',realNetwork:true,publicationPerformed:false,postgresql:status.postgresql,activitypub:status.activitypub,ed25519:{fingerprint},mastodon:status.mastodon,capabilities:status.capabilities,results,limits:['Unsigned inbox rejection is not proof of a real signed Mastodon delivery.','Published Multikey and RFC9421 profile do not prove remote activity delivery.','Public reads do not certify local user sessions or default SPA activation.']};
  if(out)fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o644});
  process.stdout.write(JSON.stringify(receipt)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{process.stderr.write((error.stack||String(error)).split('\n').slice(0,4).join('\n')+'\n');process.exitCode=1;});
