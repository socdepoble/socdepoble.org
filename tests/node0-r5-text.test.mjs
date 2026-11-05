/** R5 narrow Unicode regression coverage. Synthetic text and local SQL only.
 * This does not claim complete coverage of Gemini AH07 or remote Mastodon.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {generateKeyPairSync,webcrypto} from 'node:crypto';
import {retallaTextFederat,textMastodon,normalitzaEstatMastodon,formataPublicacioMastodon} from '../src/data/federacio/pontMastodon.js';
import {projectaDadesPubliques} from '../tooling/node0/hidrata-publicacions-publiques-node0.mjs';
import {repActivitat} from '../tooling/node0/servidor-node0-soberania.mjs';
import {signaPeticioHttpActivityPub} from '../src/data/federacio/inboxActivityPub.js';
import {sqlText} from '../tooling/node0/postgres-node0.mjs';

const REMOTE='https://mastodont.cat/users/depoble',PUBLIC='https://www.w3.org/ns/activitystreams#Public';
const NOW=Date.parse('2026-11-04T18:30:00Z'),URL_PUBLICA='https://socdepoble.cat/mur/prova-unicode';
const scalars=value=>[...value].length;
const clusters=value=>[...new Intl.Segmenter('und',{granularity:'grapheme'}).segment(value)].map(part=>part.segment);
function status(content){
  return {id:'112233',uri:REMOTE+'/statuses/112233',url:'https://mastodont.cat/@depoble/112233',visibility:'public',created_at:'2026-11-04T18:30:00Z',content,
    account:{id:'42',username:'depoble',acct:'depoble',url:'https://mastodont.cat/@depoble'}};
}
function projected(){
  const entities=['socdepoble','rentonar','olidelatorre'].map((slug,index)=>({id:`00000000-0000-4000-8000-00000000000${index+1}`,slug,kind:'company',name:'e'.repeat(299)+'😀x'}));
  const item={id:'prova-unicode',author_org_id:entities[0].id,title:'t'.repeat(299)+'😀x',subtitle:'s'.repeat(499)+'😀x',lead:'r'.repeat(999)+'😀x',description:'b'.repeat(9999)+'😀x',visibility:'public'};
  const rows=['towns','feedPosts','events','marketItems'].map(key=>({key,version:1,payload:key==='feedPosts'?[item]:[]}));
  const proof={url:'https://socdepoble.org/synthetic-test-only',sha256:'0'.repeat(64),retrievedAt:'2026-11-04T18:30:00Z'};
  return projectaDadesPubliques(rows,entities,{contentProof:proof,entitiesProof:proof});
}

test('scalar budgets include zero,220,10000 and65536 while rejecting invalid ranges',()=>{
  assert.equal(retallaTextFederat('abc',0),'');assert.equal(retallaTextFederat('abc',1),'a');
  for(const limit of[219,220,10000,65536]){const result=retallaTextFederat('a'.repeat(limit+1),limit);assert.equal(result,'a'.repeat(limit));assert.equal(scalars(result),limit);}
  assert.equal(retallaTextFederat(null,220),'');assert.equal(retallaTextFederat({toString:()=>{throw Error('must not coerce');}},220),'');
  for(const limit of[-1,65537,0.5,NaN,Infinity,'220',null])assert.throws(()=>retallaTextFederat('abc',limit),/MASTODON_LIMIT_TEXT_INVALID/);
});
test('emoji consumes one scalar and the220 summary never slices a UTF16 pair',()=>{
  const text='a'.repeat(219)+'😀suffix',post=normalitzaEstatMastodon(status('<p>'+text+'</p>'),{compteId:'42'});
  assert.equal(post.summary,'a'.repeat(219)+'😀');assert.equal(scalars(post.summary),220);assert.equal(post.summary.length,221);assert.equal(post.summary.isWellFormed(),true);
  assert.equal(retallaTextFederat('😀😀',1),'😀');assert.equal(retallaTextFederat('😀😀',2),'😀😀');
  assert.equal(retallaTextFederat('a'.repeat(220)+'😀',220),'a'.repeat(220));
});
test('grapheme boundary keeps ZWJ, modifier, combining and regional-indicator sequences whole',()=>{
  assert.equal(typeof Intl.Segmenter,'function','the current Node test runtime supplies grapheme segmentation');
  for(const cluster of['👩‍🌾','👩🏽‍🌾','👨‍👩‍👧‍👦','e\u0301','🇻🇦','1️⃣']){
    assert.deepEqual(clusters(cluster),[cluster]);const width=scalars(cluster),input='x'+cluster+'z';
    assert.equal(retallaTextFederat(input,width),'x','budget cannot retain only a prefix of the next grapheme');
    assert.equal(retallaTextFederat(input,width+1),'x'+cluster);assert.equal(retallaTextFederat(input,width+2),input);
    const cut=retallaTextFederat('a'.repeat(219)+cluster+'tail',220);
    assert.equal(cut,'a'.repeat(219));assert.equal(cut.isWellFormed(),true);assert.ok(scalars(cut)<=220);
  }
});
test('lone surrogates are replaced before scalar counting, HTML cleaning and JSON output',()=>{
  const invalid='A\ud83dB\udc00C😀D';
  assert.equal(invalid.isWellFormed(),false);assert.equal(retallaTextFederat(invalid,20),'A�B�C😀D');
  assert.equal(retallaTextFederat('x'.repeat(219)+'\ud83d',220),'x'.repeat(219)+'�');
  assert.equal(textMastodon('<p>'+invalid+'</p>'),'A�B�C😀D');
  const post=normalitzaEstatMastodon(status('<p>'+invalid+'</p>'),{compteId:'42'});
  for(const field of['body','text','summary']){assert.equal(post[field].isWellFormed(),true);assert.equal(post[field],'A�B�C😀D');}
  assert.equal(JSON.stringify(post).includes('\\ud83d'),false);assert.equal(JSON.stringify(post).includes('\\udc00'),false);
});
test('outbound formatted text respects scalar100..500 budgets and retains complete URL',()=>{
  const tail='\n\n'+URL_PUBLICA;
  for(const maxim of[100,220,499,500]){
    const available=maxim-scalars(tail),exact='a'.repeat(available);
    const fit=formataPublicacioMastodon({visibility:'public',url:URL_PUBLICA,title:exact},{maxim});
    assert.equal(fit.status,exact+tail);assert.equal(scalars(fit.status),maxim);
    const cut=formataPublicacioMastodon({visibility:'public',url:URL_PUBLICA,title:exact+'😀'},{maxim});
    assert.equal(cut.status,'a'.repeat(available-1)+'…'+tail);assert.equal(scalars(cut.status),maxim);
    for(const sequence of['😀','👩🏽‍🌾','e\u0301','🇻🇦']){
      const post=formataPublicacioMastodon({visibility:'public',url:URL_PUBLICA,title:sequence.repeat(600),summary:'bad\ud800text'},{maxim});
      assert.equal(post.status.isWellFormed(),true);assert.ok(scalars(post.status)<=maxim);assert.equal(post.status.endsWith(tail),true);
      const retained=post.status.slice(0,-tail.length).replace(/…$/u,'');
      assert.ok(clusters(retained).every(cluster=>cluster===sequence),'outbound truncation never leaves part of the repeated grapheme');
    }
  }
  for(const maxim of[99,501,1.5,'500'])assert.throws(()=>formataPublicacioMastodon({visibility:'public',url:URL_PUBLICA,title:'valid'},{maxim}),/MASTODON_LIMIT_INVALID/);
});
test('public hydrator fields use scalar budgets300,500,1000 and10000 without malformed UTF16',()=>{
  const groups=projected(),post=groups.feedPosts[0];
  assert.equal(post.title,'t'.repeat(299)+'😀');assert.equal(post.subtitle,'s'.repeat(499)+'😀');assert.equal(post.summary,'r'.repeat(999)+'😀');assert.equal(post.body,'b'.repeat(9999)+'😀');
  assert.equal(scalars(post.title),300);assert.equal(scalars(post.subtitle),500);assert.equal(scalars(post.summary),1000);assert.equal(scalars(post.body),10000);
  for(const entity of groups.agents){assert.equal(entity.name,'e'.repeat(299)+'😀');assert.equal(entity.name.isWellFormed(),true);}
  for(const value of[post.title,post.subtitle,post.summary,post.body,post.content,post.description])assert.equal(value.isWellFormed(),true);
});

const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('Unicode JSONB and daemon regressions require explicit existing PGlite',{skip:'Set SDP_PGLITE_MODULE; no SQL engine installed or executed implicitly'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const {PGlite}=await import(moduleURL.href);
  test('real PostgreSQL JSONB rejects legacy219ASCII+emoji slice and stores corrected API and hydration DTOs',async()=>{
    const pg=new PGlite();
    try{
      await pg.exec('CREATE TABLE unicode_documents(id text PRIMARY KEY,document jsonb NOT NULL)');
      const input='a'.repeat(219)+'😀suffix',legacy={summary:input.slice(0,220)};
      assert.equal(legacy.summary.isWellFormed(),false);assert.match(JSON.stringify(legacy),/\\ud83d/);
      await assert.rejects(pg.query('INSERT INTO unicode_documents VALUES($1,$2::jsonb)',['legacy',JSON.stringify(legacy)]),error=>error.code==='22P02');
      const api=normalitzaEstatMastodon(status('<p>'+input+'</p>'),{compteId:'42'}),hydration=projected().feedPosts[0];
      await pg.query('INSERT INTO unicode_documents VALUES($1,$2::jsonb),($3,$4::jsonb)',['api',JSON.stringify(api),'hydration',JSON.stringify(hydration)]);
      const saved=(await pg.query("SELECT id,document->>'summary' AS summary,char_length(document->>'summary') AS scalar_length FROM unicode_documents ORDER BY id")).rows;
      assert.deepEqual(saved,[{id:'api',summary:'a'.repeat(219)+'😀',scalar_length:220},{id:'hydration',summary:'r'.repeat(999)+'😀',scalar_length:1000}]);
      assert.equal((await pg.query('SELECT count(*)::int AS count FROM unicode_documents')).rows[0].count,2);
    }finally{await pg.close();}
  });
  test('signed inbound Create persists a220-scalar emoji summary and a5000-scalar body in PostgreSQL',async()=>{
    const pg=new PGlite();
    try{
      await pg.exec('CREATE SCHEMA node0; CREATE ROLE node0_runtime; CREATE TABLE node0.public_documents(kind text NOT NULL,id text NOT NULL,document jsonb NOT NULL,source_uri text,PRIMARY KEY(kind,id));');
      await pg.exec(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8'));
      const keys=generateKeyPairSync('rsa',{modulusLength:2048}),privateKey=await webcrypto.subtle.importKey('pkcs8',keys.privateKey.export({format:'der',type:'pkcs8'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
      const actor={id:REMOTE,type:'Person',preferredUsername:'depoble',inbox:REMOTE+'/inbox',publicKey:{id:REMOTE+'#main-key',owner:REMOTE,publicKeyPem:keys.publicKey.export({format:'pem',type:'spki'})}};
      const content='a'.repeat(219)+'😀'+'b'.repeat(4779)+'😀suffix';
      const activity={id:REMOTE+'/statuses/998877/activity',type:'Create',actor:REMOTE,object:{id:REMOTE+'/statuses/998877',type:'Note',attributedTo:REMOTE,to:[PUBLIC],content:'<p>'+content+'</p>',published:'2026-11-04T18:30:00Z'}};
      const bytes=Buffer.from(JSON.stringify(activity)),headers=await signaPeticioHttpActivityPub({url:'https://socdepoble.cat/ap/inbox',cos:bytes,keyId:REMOTE+'#main-key',clauPrivada:privateKey,ara:NOW,subtle:webcrypto.subtle});
      let actorReads=0;const db={query:async sql=>{const row=(await pg.exec(sql)).findLast(result=>result.rows?.length)?.rows[0];return row?.[Object.keys(row)[0]];}};
      const receipt=await repActivitat({req:{method:'POST',url:'/ap/inbox',headers:{...headers,'content-type':'application/activity+json'}},bytes,db,now:()=>NOW,request:async url=>{actorReads++;assert.equal(url,REMOTE);return new Response(JSON.stringify(actor),{headers:{'content-type':'application/activity+json'}});}});
      assert.equal(receipt.estat,'processada');assert.equal(actorReads,1);
      const saved=(await pg.query("SELECT document,char_length(document->>'summary') AS summary_length,char_length(document->>'body') AS body_length FROM node0.public_documents WHERE id='mastodon:998877'")).rows[0];
      assert.equal(saved.document.summary,'a'.repeat(219)+'😀');assert.equal(saved.summary_length,220);assert.equal(saved.body_length,5000);
      assert.equal(saved.document.body,'a'.repeat(219)+'😀'+'b'.repeat(4779)+'😀');assert.equal(saved.document.body.isWellFormed(),true);assert.equal(saved.document.summary.isWellFormed(),true);
      // The real SQL statement above includes sqlJson/sqlText; retain a literal
      // JSONB check for invalid source surrogates as well, never silent UTF8 loss.
      const repaired=normalitzaEstatMastodon(status('bad\ud800tail'),{compteId:'42'});
      assert.equal((await pg.query(`SELECT ${sqlText(JSON.stringify(repaired))}::jsonb->>'summary' AS summary`)).rows[0].summary,'bad�tail');
    }finally{await pg.close();}
  });
}
