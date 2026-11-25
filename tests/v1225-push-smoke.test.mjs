import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';
import { lligPrivat, revisaMaterialStaged, revisaRebutFum, main } from '../tooling/push/prova-fum.mjs';

const NOW = Date.UTC(2026, 10, 25, 2);
const RUN = '00000000-0000-4000-8000-000000000001';
function envFixture() {
 const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
 const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
 const jwk = ec.privateKey.export({ format: 'jwk' });
 const pem = key => key.export({ format: 'pem', type: 'pkcs8' });
 return { SDP_CRON_SECRET: 'TEST_ONLY_C4_SYNTHETIC_CRON_SECRET_000001', SDP_PUSH_VAPID_PUBLICA: Buffer.concat([Buffer.from([4]),Buffer.from(jwk.x,'base64url'),Buffer.from(jwk.y,'base64url')]).toString('base64url'), SDP_PUSH_VAPID_PRIVADA: jwk.d, SDP_PUSH_VAPID_SUBJECTE: 'mailto:push@example.invalid', SDP_APNS_EQUIP: '9KNUA4JR8P', SDP_APNS_CLAU_ID: 'SYNTH00001', SDP_APNS_CLAU_P8: pem(ec.privateKey), SDP_APNS_TOPIC: 'org.socdepoble.app', SDP_APNS_ENTORN: 'produccio', SDP_FCM_COMPTE_SERVEI: JSON.stringify({ type:'service_account', project_id:'sdp-synthetic', client_email:'synthetic@sdp-synthetic.iam.gserviceaccount.com', private_key:pem(rsa.privateKey), token_uri:'https://oauth2.googleapis.com/token' }) };
}
function receiptFixture() {
 return { format:'sdp.push.smoke-receipt.v1', mode:'real', runId:RUN,
  database:{ table:'public.xat_dispositius_push',rls:true,sessionCascade:true,enqueueTrigger:true,claimRpc:true,ackRpc:true },
  worker:{httpStatus:200,attempted:3,accepted:3,failed:0,unauthorized:0,untried:0,withoutProvider:0},
  channels:['web','ios','android'].map((channel,i)=>({ channel,runId:RUN,messageId:`00000000-0000-4000-8000-00000000000${i+2}`,subscriptionSha256:String(i+1).repeat(64),deviceSha256:String(i+4).repeat(64),relayStatus:202,providerStatus:200,ack:'acceptat',subscribedAt:new Date(NOW-4000).toISOString(),enqueuedAt:new Date(NOW-3000).toISOString(),providerAcceptedAt:new Date(NOW-2000).toISOString(),displayedAt:new Date(NOW-1000).toISOString(),displayedRunId:RUN })) };
}
test('C4 staged signs and independently verifies all three productive payload constructors without network', async () => {
 const env = envFixture(), oldFetch = globalThis.fetch;
 let calls = 0; globalThis.fetch = () => { calls++; throw Error('network forbidden'); };
 try {
  const report = await revisaMaterialStaged(env,{ara:NOW});
  assert.equal(report.ok,true); assert.deepEqual(report.checked,['web','ios','android']); assert.equal(calls,0);
  assert.equal(report.deviceDeliveryVerified,false); assert.equal(report.remoteVerified,false);
  const visible=JSON.stringify(report);
  for(const secret of Object.values(env))assert.equal(visible.includes(secret),false);
 } finally { globalThis.fetch=oldFetch; }
});
test('C4 malformed or mixed VAPID, wrong APNs topic and untrusted FCM OAuth authority fail opaquely', async () => {
 const env=envFixture(), other=envFixture();
 for(const patch of [{SDP_PUSH_VAPID_PRIVADA:other.SDP_PUSH_VAPID_PRIVADA},{SDP_APNS_TOPIC:'wrong.topic'},{SDP_FCM_COMPTE_SERVEI:JSON.stringify({...JSON.parse(env.SDP_FCM_COMPTE_SERVEI),token_uri:'https://attacker.invalid'})}]) {
  const report=await revisaMaterialStaged({...env,...patch},{ara:NOW}); assert.equal(report.ok,false);
  assert.equal(JSON.stringify(report).includes('PRIVATE KEY'),false);assert.equal(JSON.stringify(report).includes('attacker'),false);
 }
});
test('C4 coherent external evidence remains explicitly operator supplied and cannot authorize activation',()=>{
 const result=revisaRebutFum(receiptFixture(),{runId:RUN,ara:NOW});
 assert.equal(result.ok,true);assert.equal(result.deviceEvidencePresent,true);assert.equal(result.deviceDeliveryVerified,false);assert.equal(result.activationAuthorized,false);
});
test('[DEFECTE] C4 HTTP acceptance without device evidence, 401, stale/mixed runs and silent worker failures never pass',()=>{
 const mutations=[r=>{delete r.channels[0].displayedAt;},r=>{r.channels[1].providerStatus=401;},r=>{r.worker.unauthorized=1;},r=>{r.worker.untried=1;},r=>{r.worker.withoutProvider=1;},r=>{r.channels[0].displayedRunId='wrong';},r=>{r.channels[0].displayedAt=new Date(NOW-3600000).toISOString();},r=>{r.channels[0].displayedAt=new Date(NOW+1).toISOString();},r=>{r.mode='fixture';},r=>{r.channels.pop();},r=>{r.channels[1].deviceSha256=r.channels[0].deviceSha256;},r=>{r.database.rls=false;}];
 for(const mutate of mutations){const receipt=receiptFixture();mutate(receipt);const report=revisaRebutFum(receipt,{runId:RUN,ara:NOW});assert.equal(report.ok,false);assert.equal(report.deviceDeliveryVerified,false);assert.equal(report.activationAuthorized,false);}
 assert.equal(revisaRebutFum(null,{runId:RUN,ara:NOW}).ok,false);
 assert.equal(revisaRebutFum(receiptFixture(),{runId:RUN,channels:null,ara:NOW}).ok,false);
});
test('C4 private input refuses shared modes, hardlinks, symlinks and missing real receipt without outputting secrets',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-c4-private-'));
 try{
  const file=path.join(dir,'edge.secrets.env');fs.writeFileSync(file,'SYNTHETIC=private-sentinel',{mode:0o600});assert.equal(lligPrivat(file),'SYNTHETIC=private-sentinel');
  const link=path.join(dir,'linked');fs.symlinkSync(file,link);assert.throws(()=>lligPrivat(link));
  fs.chmodSync(file,0o644);assert.throws(()=>lligPrivat(file));fs.chmodSync(file,0o600);
  const hard=path.join(dir,'hard');fs.linkSync(file,hard);assert.throws(()=>lligPrivat(file));fs.unlinkSync(hard);
  const output=[],write=process.stdout.write;process.stdout.write=chunk=>{output.push(String(chunk));return true;};
  try{assert.equal(await main(['--sense-ia','--staged-dir',dir]),2);}finally{process.stdout.write=write;}
  assert.equal(output.join('').includes('private-sentinel'),false);assert.equal(JSON.parse(output.join('')).receipt.errors[0],'real_device_receipt_missing');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
