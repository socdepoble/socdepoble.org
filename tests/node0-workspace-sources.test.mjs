import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {seleccionaPublicacions,urlArticlePublic,assetPublic,comprovaMagic,lligGetPublic,preparaFonts,desaPublicCache,NOM_ZIP,validaArrelPublica} from '../tooling/node0/fonts-publiques-mirall-node0.mjs';
import {exportaMunicipiOpenData} from '../src/data/exportaMunicipiOpenData.js';
const H='a'.repeat(64),source={sourceSha256:H,retrievedAt:'2026-11-04T21:00:00.000Z'},sha=b=>createHash('sha256').update(b).digest('hex');
const PUBLIC={id:'cronica',title:'Crònica',visibility:'public',url:'https://socdepoble.org/mur/cronica',body:'Text públic',created_at:'2026-10-29T11:00:00.000Z',image_url:'https://socdepoble.org/assets/photo.jpg'};
test('selection archives public canonical/pending/Mastodon replicas without owners, fabricated dates or POSSE authority',()=>{
  const {articles,coverage}=seleccionaPublicacions({feedPosts:[PUBLIC,{id:'mastodon:123',source:'mastodon',visibility:'public',uri:'https://mastodont.cat/users/depoble/statuses/123',body:'Public text',user_id:'PRIVATE_OWNER'}],events:[{id:'casa-alta',visibility:'public',date:'2023-11-26',summary:'Acte públic',author_org_id:'PRIVATE_OWNER'}],marketItems:[{email:'PRIVATE_EMAIL'}]},source);
  assert.equal(articles.length,3);assert.equal(articles[1].canonicalUrl,null);assert.equal(articles[1].originalSourceUrl,'https://mastodont.cat/users/depoble/statuses/123');assert.equal(articles[2].eventDate,'2023-11-26');assert.equal(articles[2].publishedAt,null);assert.equal(articles[2].updatedAt,null);assert.equal(articles[2].authorDisplayName,'');assert.equal(JSON.stringify(articles).includes('PRIVATE'),false);assert.equal(coverage.completeWorkspaceInventoryVerified,false);assert.equal(coverage.mastodonPublicReplicasArchived,1);
});
test('nonpublic records, malformed sources and fake civil dates do not acquire public provenance',()=>{
  const p=seleccionaPublicacions({feedPosts:[{...PUBLIC,visibility:'private'},{...PUBLIC,id:'mastodon:3',source:'mastodon',uri:'https://evil.test/users/depoble/statuses/3'}],events:[{id:'event',visibility:'public',date:'2026-02-30'}]},source);assert.equal(p.articles.length,1);assert.equal('eventDate'in p.articles[0],false);assert.equal(p.coverage.omissions.length,2);
});
test('asset URLs are fixed public .org paths without queries, aliases, credentials, redirects or unsafe names',()=>{
  assert.equal(assetPublic(PUBLIC.image_url).name,'photo.jpg');assert.equal(urlArticlePublic(PUBLIC.url,'mur'),true);
  for(const u of['http://127.0.0.1/assets/a.jpg','https://socdepoble.org.evil.test/assets/a.jpg','https://socdepoble.org/assets/a.jpg?token=x','https://socdepoble.org/assets/%2fprivate.jpg','https://socdepoble.org/assets/a.svg','https://user:secret@socdepoble.org/assets/a.jpg','https://socdepoble.org/assets/a.jpg\u202e'])assert.equal(assetPublic(u),null);
});
test('MIME, extension and magic must all match before an asset becomes a file descriptor',()=>{
  assert.equal(comprovaMagic(Buffer.from([255,216,255,0]),'image/jpeg','photo.jpg'),true);assert.equal(comprovaMagic(Buffer.from('<html>'),'image/jpeg','photo.jpg'),false);assert.equal(comprovaMagic(Buffer.from('RIFF1234WEBP'),'image/webp','cartell.webp'),true);assert.equal(comprovaMagic(Buffer.from('RIFF1234WEBP'),'image/jpeg','cartell.jpg'),false);
});
test('public GET has no auth/cookies, rejects redirects/limits and never exposes remote diagnostics',async()=>{
  let seen;const result=await lligGetPublic(PUBLIC.image_url,{fetchImpl:async(u,o)=>{seen={u,o};return new Response('public',{headers:{'Content-Type':'text/plain'}});}});assert.equal(result.bytes.toString(),'public');assert.equal(seen.o.method,'GET');assert.equal(seen.o.redirect,'error');assert.deepEqual(Object.keys(seen.o.headers),['Accept']);
  await assert.rejects(lligGetPublic(PUBLIC.image_url,{fetchImpl:async()=>new Response('PRIVATE',{status:302})}),e=>e.code==='mirror_public_get_status'&&!e.message.includes('PRIVATE'));
  await assert.rejects(lligGetPublic(PUBLIC.image_url,{maxBytes:2,fetchImpl:async()=>new Response('larger')}),/limit/);
});
test('GET reader/fetch deadline remains bounded when an injected transport ignores abort',async()=>{
  await assert.rejects(lligGetPublic(PUBLIC.image_url,{deadlineMs:10,fetchImpl:()=>new Promise(()=>{})}),/timeout/);let cancelled=0;
  await assert.rejects(lligGetPublic(PUBLIC.image_url,{deadlineMs:10,fetchImpl:async()=>({status:200,headers:new Headers(),body:{getReader:()=>({read:()=>new Promise(()=>{}),cancel:async()=>{cancelled++;}})}})}),/timeout/);assert.ok(cancelled>0);
  let finishFetch,lateReads=0,lateCancels=0,notifyCancel;const lateCancelled=new Promise(resolve=>{notifyCancel=resolve;});
  await assert.rejects(lligGetPublic(PUBLIC.image_url,{deadlineMs:10,fetchImpl:()=>new Promise(resolve=>{finishFetch=resolve;})}),/timeout/);
  finishFetch({status:200,headers:new Headers(),body:{getReader:()=>({read:()=>{lateReads++;return new Promise(()=>{});},cancel:async()=>{lateCancels++;notifyCancel();}})}});
  let timer;try{await Promise.race([lateCancelled,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('late response stream was not cancelled')),1000);})]);}finally{clearTimeout(timer);}
  assert.equal(lateReads,0);assert.equal(lateCancels,1);
});
test('generated synthetic canonical ZIP plus fixed public feed and validated image create only explicit cache descriptors',async t=>{
  const base=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-mirror-provider-')));t.after(()=>fs.rm(base,{recursive:true,force:true}));const cacheDir=path.join(base,'cache');const workspaceRoot=path.join(base,'workspace');await fs.mkdir(path.join(workspaceRoot,'public/opendata'),{recursive:true});const zip=(await exportaMunicipiOpenData({municipi:{slug:'sella',nom:'Sella'},ara:'2026-11-04T00:00:00Z'})).zip;await fs.writeFile(path.join(workspaceRoot,'public/opendata',NOM_ZIP),zip);const reviewedOpenDataPin={name:NOM_ZIP,sha256:sha(zip)};const photo=Buffer.from([255,216,255,0,1]);const calls=[];
  const prepared=await preparaFonts({cacheDir,workspaceRoot,reviewedOpenDataPin,now:()=>0,fetchImpl:async(u,o)=>{calls.push({u,o});return u.includes('127.0.0.1')?Response.json({feedPosts:[PUBLIC],events:[],marketItems:[]}):new Response(photo,{headers:{'Content-Type':'image/jpeg'}});}});
  const media=await prepared.providers.listPublicMedia();assert.equal(media.length,1);assert.equal(media[0].sha256,sha(photo));assert.equal((await prepared.providers.listPublicOpenData()).length,1);assert.deepEqual(prepared.reviewedSourceRoots,[{kind:'media',root:cacheDir},{kind:'opendata',root:path.join(workspaceRoot,'public/opendata')}]);assert.equal(calls.length,2);assert.equal(prepared.coverage.selectedArticles,1);assert.equal((await fs.stat(path.join(cacheDir,media[0].relativePath))).mode&0o777,0o600);
  await desaPublicCache(cacheDir,media[0].relativePath,photo);await assert.rejects(desaPublicCache(cacheDir,media[0].relativePath,Buffer.from('changed')),/drift/);
});

test('R8 provider rejects sensitive roots before filesystem IO and never grants recipe roots from caller files',async()=>{
  for(const path of['/synthetic/dades/public','/synthetic/.config/socdepoble/public','/synthetic/.cloudflared/public','/synthetic/.ssh/public','/synthetic/Library/public','/synthetic/logs/public'])assert.throws(()=>validaArrelPublica(path),/root_forbidden/);
  await assert.rejects(preparaFonts({cacheDir:'/synthetic/public-cache',workspaceRoot:'/synthetic/workspace',restoreAssets:[{root:'/operator/file-root'}]}),/recipe_root_not_reviewed/);
});
