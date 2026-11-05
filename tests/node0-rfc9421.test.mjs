// RFC9421 public test fixtures: see fixtures/node0-rfc9421/LICENSE_RFC_CODE_COMPONENTS.txt
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto,createHash,createPublicKey,verify,sign,createPrivateKey} from 'node:crypto';
import {serialitzaBaseHttpMessage,signaPeticioHttpMessageActivityPub} from '../tooling/node0/http-message-signatures-ed25519.mjs';
import {actorAmbMultikeyEd25519,codificaMultikeyEd25519,publicRawEd25519} from '../tooling/node0/actor-multikey-ed25519.mjs';

import {provaWireTls} from './fixtures/node0-rfc9421/wire-tls.fixture.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/node0-rfc9421/rfc9421-ed25519.json',import.meta.url),'utf8'));
const publicKey=createPublicKey(fixture.publicKeyPem);
const privateKey=createPrivateKey({key:Buffer.from(fixture.privateKeyPkcs8Base64,'base64'),format:'der',type:'pkcs8'});
const privateCryptoKey=await webcrypto.subtle.importKey('pkcs8',Buffer.from(fixture.privateKeyPkcs8Base64,'base64'),'Ed25519',false,['sign']);
const publicCryptoKey=await webcrypto.subtle.importKey('spki',publicKey.export({format:'der',type:'spki'}),'Ed25519',false,['verify']);
const ARA=Date.parse('2026-11-04T18:00:00Z'),ACTOR='https://socdepoble.cat/ap/actors/socdepoble',KEY=ACTOR+'#ed25519',URL_INBOX='https://mastodont.cat/users/depoble/inbox?via=Node0&case=Mixed';
const body=JSON.stringify({id:'https://socdepoble.cat/ap/activities/offline-test',type:'Create',actor:ACTOR,object:{type:'Note',content:'Oliva 🫒'}});
const input=(overrides={})=>({metode:'POST',url:URL_INBOX,cos:body,actorId:ACTOR,keyId:KEY,clauPrivada:privateCryptoKey,ara:ARA,subtle:webcrypto.subtle,...overrides});
const hash=bytes=>createHash('sha256').update(bytes).digest();

// Independent strict receiver: derives the base itself, never calls the signer
// formatter, uses node:crypto SHA256/verify rather than signer WebCrypto calls.
// Its five-minute replay window is a lab policy, not a Mastodon Rails run.
function independentBase(headers,{url=URL_INBOX,metode='POST',cos=body,keyId=KEY,now=ARA}={}) {
  const matched=/^sig1=\("@method" "@target-uri" "content-digest" "date" "content-type"\);created=(\d+);expires=(\d+);keyid="([^"\\]+)";alg="ed25519"$/.exec(headers['signature-input']);
  if(!matched)return null;
  const created=Number(matched[1]),expires=Number(matched[2]);
  if(!Number.isSafeInteger(created)||!Number.isSafeInteger(expires)||expires-created!==300||now/1000<created-60||now/1000>expires||matched[3]!==keyId)return null;
  const destination=new URL(url);
  if(destination.host!==headers.host)return null;
  const expectedDigest='sha-256=:'+hash(typeof cos==='string'?Buffer.from(cos):cos).toString('base64')+':';
  if(expectedDigest!==headers['content-digest'])return null;
  return ['"@method": '+metode,'"@target-uri": '+destination.href,'"content-digest": '+headers['content-digest'],'"date": '+headers.date,'"content-type": '+headers['content-type'],'"@signature-params": '+headers['signature-input'].slice('sig1='.length)].join('\n');
}
function verifies(headers,options) {
  const base=independentBase(headers,options),signature=/^sig1=:([A-Za-z0-9+/]+={0,2}):$/.exec(headers.signature);
  return Boolean(base&&signature&&verify(null,Buffer.from(base),publicKey,Buffer.from(signature[1],'base64')));
}
function decodeBase58Independent(value) {
  assert.equal(value[0],'z');const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',out=[0];
  for(const char of value.slice(1)){
    let carry=alphabet.indexOf(char);assert.ok(carry>=0);
    for(let i=out.length-1;i>=0;i--){carry+=out[i]*58;out[i]=carry&255;carry>>=8;}
    while(carry){out.unshift(carry&255);carry>>=8;}
  }
  return Uint8Array.from(out);
}

test('RFC9421 B.2.6 canonical base and Signature-Input match the official vector byte-for-byte',()=>{
  const result=serialitzaBaseHttpMessage({components:fixture.components,created:fixture.created,keyId:fixture.keyId,label:fixture.label});
  assert.equal(result.base,fixture.signatureBase);
  assert.equal(result.signatureInput,'sig-b26='+fixture.signatureBase.split('"@signature-params": ')[1]);
});
test('RFC9421 B.1.4/B.2.6 published test key reproduces Ed25519 signature exactly',async()=>{
  const bytes=Buffer.from(fixture.signatureBase);
  const signature=await webcrypto.subtle.sign('Ed25519',privateCryptoKey,bytes);
  assert.equal(Buffer.from(signature).toString('base64'),fixture.signatureBase64);
  assert.equal(verify(null,bytes,publicKey,Buffer.from(fixture.signatureBase64,'base64')),true);
  assert.equal(await webcrypto.subtle.verify('Ed25519',publicCryptoKey,signature,bytes),true);
});
test('Mastodon profile verifies with independently derived base and independent crypto interface',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(verifies(headers),true);assert.equal(Object.isFrozen(headers),true);
  const signature=Buffer.from(/^sig1=:([^:]+):$/.exec(headers.signature)[1],'base64');
  assert.equal(await webcrypto.subtle.verify('Ed25519',publicCryptoKey,signature,Buffer.from(independentBase(headers))),true);
  assert.equal(headers['content-type'],'application/activity+json');
  assert.equal(Object.hasOwn(headers,'digest'),false);
});
test('signature is PureEdDSA over the base rather than Ed25519 over a SHA256 prehash',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input()),base=Buffer.from(independentBase(headers));
  const wrong=sign(null,hash(base),privateKey);
  assert.equal(verify(null,base,publicKey,wrong),false);
  assert.notEqual(wrong.toString('base64'),/^sig1=:([^:]+):$/.exec(headers.signature)[1]);
});
test('Content-Digest is RFC9530 byte-sequence syntax over exact UTF-8 bytes',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(headers['content-digest'],'sha-256=:'+hash(Buffer.from(body)).toString('base64')+':');
  assert.equal(headers['content-digest'].split('=').length>=2,true);
  assert.equal(verifies(headers,{cos:body+' '}),false);
});
test('body tamper fails even if attacker recomputes the public Content-Digest',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input()),changed=body.replace('Oliva','Changed');
  const tampered={...headers,'content-digest':'sha-256=:'+hash(Buffer.from(changed)).toString('base64')+':'};
  assert.equal(verifies(tampered,{cos:changed}),false);
});
test('derived target URI binds full query, case and method; Host cannot select another target',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(verifies(headers,{url:URL_INBOX.replace('Mixed','mixed')}),false);
  assert.equal(verifies(headers,{url:URL_INBOX.split('?')[0]}),false);
  assert.equal(verifies(headers,{metode:'GET'}),false);
  assert.equal(verifies({...headers,host:'evil.example'}),false);
});
test('Date, Content-Type, created, expires and keyid are signed and tamper-sensitive',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(verifies({...headers,date:'Thu, 05 Nov 2026 18:00:00 GMT'}),false);
  assert.equal(verifies({...headers,'content-type':'application/json'}),false);
  assert.equal(verifies({...headers,'signature-input':headers['signature-input'].replace(/created=\d+/,'created=1')}),false);
  assert.equal(verifies({...headers,'signature-input':headers['signature-input'].replace(/expires=\d+/,'expires=1')}),false);
  assert.equal(verifies({...headers,'signature-input':headers['signature-input'].replace(KEY,ACTOR+'#other')}),false);
});
test('offline receiver refuses stale/future signatures; no nonce-based anti-replay is claimed',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(verifies(headers,{now:ARA+301000}),false);
  assert.equal(verifies(headers,{now:ARA-61000}),false);
  assert.equal(verifies(headers),true);assert.equal(verifies(headers),true,'same valid signature is replayable without a receiver replay store');
});
test('single signature, fixed components and algorithm resist header-list or algorithm substitution',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input());
  assert.equal(verifies({...headers,signature:headers.signature+', '+headers.signature}),false);
  assert.equal(verifies({...headers,'signature-input':headers['signature-input'].replace('"date" ','')}),false);
  assert.equal(verifies({...headers,'signature-input':headers['signature-input'].replace('ed25519','rsa-v1_5-sha256')}),false);
});
test('GET signs the empty body and full URL without accepting a request body',async()=>{
  const headers=await signaPeticioHttpMessageActivityPub(input({metode:'GET',cos:''}));
  assert.equal(verifies(headers,{metode:'GET',cos:''}),true);
  await assert.rejects(signaPeticioHttpMessageActivityPub(input({metode:'GET'})),TypeError);
});
test('target, method, actor and keyid reject noncanonical or injected input before crypto',async()=>{
  let cryptoCalls=0;const subtle={digest(){cryptoCalls++;throw Error('unexpected');},sign(){cryptoCalls++;throw Error('unexpected');}};
  const bad=[{url:'http://mastodont.cat/inbox'},{url:URL_INBOX+'#fragment'},{url:URL_INBOX+'\r\nX:1'},{url:'https://user:password@mastodont.cat/inbox'},{url:'https://MASTODONT.cat/inbox'},{url:'https://mastodont.cat:443/inbox'},{metode:'post'},{metode:'POST\n'},{keyId:KEY+'\n'},{keyId:ACTOR+'#bad"key'},{keyId:'https://evil.example/actor#key'},{actorId:ACTOR+'?owner=changed'},{headers:{Host:'evil.example'}}];
  for(const overrides of bad)await assert.rejects(signaPeticioHttpMessageActivityPub(input({...overrides,subtle})),TypeError);
  assert.equal(cryptoCalls,0);
});
test('invalid time/key/body inputs fail closed and no mutable body is retained',async()=>{
  for(const ara of [undefined,-1,NaN,Infinity,1.5,8640000000000001])await assert.rejects(signaPeticioHttpMessageActivityPub(input({ara})),TypeError);
  for(const clauPrivada of [null,publicCryptoKey,{}, {type:'private',algorithm:{name:'RSA'},usages:['sign']}])await assert.rejects(signaPeticioHttpMessageActivityPub(input({clauPrivada})),TypeError);
  for(const cos of [{type:'Note'},new Uint8Array(131073),'x'.repeat(131073),'\ud800'])await assert.rejects(signaPeticioHttpMessageActivityPub(input({cos})),TypeError);
});
test('body bytes are snapshotted before the first asynchronous digest',async()=>{
  const bytes=Uint8Array.from(Buffer.from(body));let release,started;
  const barrier=new Promise(r=>{release=r;}),began=new Promise(r=>{started=r;});
  const subtle={async digest(alg,data){started();await barrier;return webcrypto.subtle.digest(alg,data);},sign:webcrypto.subtle.sign.bind(webcrypto.subtle)};
  const pending=signaPeticioHttpMessageActivityPub(input({cos:bytes,subtle}));await began;bytes.fill(0);release();
  assert.equal(verifies(await pending),true);
});
test('SF strings escape quotes/backslashes canonically and reject controls; duplicate components fail',()=>{
  const result=serialitzaBaseHttpMessage({components:[['date','Tue, 20 Apr 2021 02:07:55 GMT']],created:1,keyId:'a"b\\c'});
  assert.ok(result.signatureInput.endsWith(';keyid="a\\"b\\\\c"'));
  for(const keyId of ['bad\nkey','bad\tkey','é'])assert.throws(()=>serialitzaBaseHttpMessage({components:[['date','date']],created:1,keyId}),TypeError);
  assert.throws(()=>serialitzaBaseHttpMessage({components:[['date','date'],['date','date']],created:1,keyId:'key'}),TypeError);
});
test('Multikey independently decodes to codec ed01 plus the exact existing public bytes',()=>{
  const raw=publicRawEd25519(fixture.publicKeyPem),encoded=codificaMultikeyEd25519(raw),decoded=decodeBase58Independent(encoded);
  assert.deepEqual(decoded.slice(0,2),Uint8Array.from([0xed,0x01]));assert.deepEqual(decoded.slice(2),raw);
  const spki=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),decoded.slice(2)]);
  assert.deepEqual(createPublicKey({key:spki,format:'der',type:'spki'}).export({format:'der',type:'spki'}),publicKey.export({format:'der',type:'spki'}));
});
test('actor adds CID Multikey with matching owner/id without changing PEM or input',()=>{
  const actor={'@context':['https://www.w3.org/ns/activitystreams','https://w3id.org/security/v1'],id:ACTOR,type:'Organization',publicKey:{id:KEY,owner:ACTOR,publicKeyPem:fixture.publicKeyPem}};
  const before=JSON.stringify(actor),updated=actorAmbMultikeyEd25519(actor);
  assert.equal(JSON.stringify(actor),before);assert.deepEqual(updated.publicKey,actor.publicKey);
  assert.ok(updated['@context'].includes('https://www.w3.org/ns/cid/v1'));
  assert.deepEqual(updated.assertionMethod[0],{id:KEY,type:'Multikey',controller:ACTOR,publicKeyMultibase:codificaMultikeyEd25519(publicRawEd25519(fixture.publicKeyPem))});
  assert.deepEqual(actorAmbMultikeyEd25519(updated),updated);
});
test('real public Node0 key preserves its pinned sovereignty fingerprint with Multikey',()=>{
  const actor=JSON.parse(fs.readFileSync(new URL('./fixtures/node0-rfc9421/node0-actor-public.json',import.meta.url),'utf8'));
  const before=hash(createPublicKey(actor.publicKey.publicKeyPem).export({format:'der',type:'spki'})).toString('hex');
  assert.equal(before,'f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11');
  const updated=actorAmbMultikeyEd25519(actor),decoded=decodeBase58Independent(updated.assertionMethod[0].publicKeyMultibase);
  assert.equal(updated.id,actor.id);assert.equal(updated.publicKey.publicKeyPem,actor.publicKey.publicKeyPem);
  assert.equal(hash(Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),decoded.slice(2)])).toString('hex'),before);
});
test('actor rejects crossed ownership, mismatched existing material and non-Ed SPKI',()=>{
  const actor={'@context':'https://www.w3.org/ns/activitystreams',id:ACTOR,publicKey:{id:KEY,owner:ACTOR,publicKeyPem:fixture.publicKeyPem}};
  assert.throws(()=>actorAmbMultikeyEd25519({...actor,publicKey:{...actor.publicKey,owner:'https://evil.example/actor'}}),TypeError);
  assert.throws(()=>actorAmbMultikeyEd25519({...actor,publicKey:{...actor.publicKey,id:'https://evil.example/actor#key'}}),TypeError);
  assert.throws(()=>actorAmbMultikeyEd25519({...actor,assertionMethod:[{id:KEY,type:'Multikey',controller:ACTOR,publicKeyMultibase:'zwrong'}]}),TypeError);
  assert.throws(()=>publicRawEd25519(fixture.publicKeyPem.replace('MCow','MAAw')),TypeError);
  assert.throws(()=>codificaMultikeyEd25519(new Uint8Array(31)),TypeError);
});
test('actor accessors cannot execute while projecting public keys',()=>{
  let touched=false;const actor={};Object.defineProperty(actor,'id',{enumerable:true,get(){touched=true;return ACTOR;}});
  assert.throws(()=>actorAmbMultikeyEd25519(actor),TypeError);assert.equal(touched,false);
});
test('actor public DTO rejects accidental private key fields instead of publishing them',()=>{
  const actor={'@context':['https://www.w3.org/ns/activitystreams'],id:ACTOR,type:'Organization',publicKey:{id:KEY,owner:ACTOR,publicKeyPem:fixture.publicKeyPem}};
  for(const field of ['privateKeyPem','privateKey','token','password']) {
    assert.throws(()=>actorAmbMultikeyEd25519({...actor,[field]:'SENTINEL_PRIVATE'}),TypeError);
    assert.throws(()=>actorAmbMultikeyEd25519({...actor,publicKey:{...actor.publicKey,[field]:'SENTINEL_PRIVATE'}}),TypeError);
  }
  const good=actorAmbMultikeyEd25519(actor);
  assert.throws(()=>actorAmbMultikeyEd25519({...good,assertionMethod:[{...good.assertionMethod[0],privateKeyPem:'SENTINEL_PRIVATE'}]}),TypeError);
});
test('actor context arrays reject sparse and accessor elements without executing them',()=>{
  let touched=false;const context=[];Object.defineProperty(context,'0',{enumerable:true,get(){touched=true;return'https://www.w3.org/ns/activitystreams';}});
  const actor={'@context':context,id:ACTOR,type:'Organization',publicKey:{id:KEY,owner:ACTOR,publicKeyPem:fixture.publicKeyPem}};
  assert.throws(()=>actorAmbMultikeyEd25519(actor),TypeError);assert.equal(touched,false);
  assert.throws(()=>actorAmbMultikeyEd25519({...actor,'@context':new Array(2)}),TypeError);
});

test('RFC9421 real TLS wire fixture (loopback only; no Mastodon delivery)',async t=>{const receipt=await provaWireTls();t.diagnostic(JSON.stringify(receipt));});
