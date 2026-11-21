import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { creaGestor as creaNoticies, esIpNoPublica, imatgesDelFeed } from '../../supabase/functions/noticies/gestor.js';
import { creaGestor as creaPush, igualsEnTempsConstant, enviaAmbLimit } from '../../supabase/functions/notifica-xat/gestor.js';
import { creaEnviadorWeb, classificaWebPush } from '../../supabase/functions/notifica-xat/webpush.js';
import { demanaAccesFcm, classificaApns, classificaFcm } from '../../supabase/functions/notifica-xat/natius.js';
import { creaDespertador } from '../../supabase/functions/notifica-xat-desperta/gestor.js';
import { creaWakePostcommit } from '../../supabase/functions/notifica-xat/postcommit.js';
import { formaDelsLliuraments } from '../../supabase/functions/notifica-xat/leases.js';
const cataleg = JSON.parse(fs.readFileSync(new URL('../../supabase/functions/noticies/fonts.json', import.meta.url)));
const RSS = '<rss><channel><title>Prova</title></channel></rss>';
const BASE = 'https://projecte.example.invalid';
const SECRET = 'synthetic_cron_no_material_real_'.repeat(2);
const SERVICE = 'sb_secret_' + 'synthetic_fixture_only'; // sintètic, compost a trossos perquè la porta de literals no el prenga per real
const env = { SUPABASE_URL: BASE, SUPABASE_SERVICE_ROLE_KEY: SERVICE, SDP_CRON_SECRET: SECRET, SDP_PUSH_ACTIU: 'si' };
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const json = value => Response.json(value);
const never = () => new Promise(() => {});
async function deadline(promise, ms=250) { let clock;try {return await Promise.race([promise,new Promise(resolve=>{clock=setTimeout(()=>resolve('NO_DEADLINE'),ms);})]);}finally{clearTimeout(clock);} }
const quiet = {info(){},warn(){},error(){}};
function fakeBody({ empty=0, text='', stuck=false, stuckCancel=false }={}) {
  let reads=0,cancels=0,released=0;
  const bytes=new TextEncoder().encode(text);
  const reader={read:async()=>{reads++;if(stuck)return never();if(reads<=empty)return {done:false,value:new Uint8Array(0)};if(reads===empty+1)return {done:false,value:bytes};return {done:true};},cancel:()=>{cancels++;return stuckCancel?never():Promise.resolve();},releaseLock:()=>{released++;}};
  const body={locked:false,getReader:()=>reader,cancel:()=>{cancels++;return stuckCancel?never():Promise.resolve();}};
  return {body,headers:new Headers({'content-type':'application/rss+xml'}),ok:true,status:200,get reads(){return reads;},get cancels(){return cancels;},get released(){return released;}};
}
function news(fetchImpl, extra={}) { let expire; const gestor=creaNoticies({cataleg,fetchImpl,empremta:async()=> 'anonymous',temporitzador:{posa:fn=>{expire=fn;return 1;},lleva(){}},...extra});return {demana:()=>gestor(new Request(BASE+'/feed?font=ayudawp')),expire:()=>expire()}; }
const tick = () => new Promise(resolve=>setImmediate(resolve));

test('[DEFECTE N1] noticies enforces cumulative deadline even if fetch ignores AbortSignal and cancels late body',async()=>{
  let finish,cancelled=false;const f=news(()=>new Promise(resolve=>{finish=resolve;}));const pending=f.demana();await tick();f.expire();const r=await deadline(pending);assert.notEqual(r,'NO_DEADLINE');assert.equal(r.status,504);
  finish({status:200,ok:true,headers:new Headers(),body:{locked:false,cancel:async()=>{cancelled=true;}}});await tick();assert.equal(cancelled,true);
});
test('[DEFECTE N2] noticies enforces body-read deadline and never awaits a hanging cancel',async()=>{
  const body=fakeBody({stuck:true,stuckCancel:true});const f=news(async()=>body);const pending=f.demana();await tick();f.expire();const r=await deadline(pending);assert.notEqual(r,'NO_DEADLINE');assert.equal(r.status,504);assert.ok(body.cancels>0);
});
test('[DEFECTE N3] byte cap also bounds empty chunk overhead',async()=>{
  const body=fakeBody({empty:9000,text:RSS});const f=news(async()=>body);const r=await f.demana();assert.equal(r.status,502);assert.ok(body.reads<=8193);assert.ok(body.cancels>0);
});
test('[DEFECTE N4] discarded redirection body cannot hold request beyond deadline',async()=>{
  const body=fakeBody({stuckCancel:true});body.status=302;body.ok=false;body.headers.set('location','/feed2');let calls=0;
  const f=news(async()=>++calls===1?body:new Response(RSS));const r=await deadline(f.demana());assert.notEqual(r,'NO_DEADLINE');assert.equal(r.status,200);
});

test('[DEFECTE P1] OAuth provider ignores abort but operation settles as typed retry',async()=>{
  const result=await deadline(demanaAccesFcm({jwt:'synthetic',fetch:never,topallMs:10}).then(()=> 'UNEXPECTED_OK',e=>e.codi));assert.equal(result,'reintenta');
});
test('[DEFECTE P2] OAuth body-read/cancel deadline survives hostile reader',async()=>{
  const body=fakeBody({stuck:true,stuckCancel:true});const result=await deadline(demanaAccesFcm({jwt:'synthetic',fetch:async()=>body,topallMs:10}).then(()=> 'UNEXPECTED_OK',e=>e.codi));assert.equal(result,'reintenta');assert.ok(body.cancels>0);
});
test('[DEFECTE P3] OAuth empty-chunk flood is rejected before token acceptance',async()=>{
  const body=fakeBody({empty:9000,text:JSON.stringify({access_token:'synthetic_access_fixture_'.repeat(3),expires_in:3600})});const result=await demanaAccesFcm({jwt:'synthetic',fetch:async()=>body,topallMs:1000}).then(()=> 'UNEXPECTED_OK',e=>e.codi);assert.notEqual(result,'UNEXPECTED_OK');assert.ok(body.reads<=8193);
});
const ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'});const jwk=ec.privateKey.export({format:'jwk'});
const webEnv={SDP_PUSH_VAPID_PUBLICA:Buffer.concat([Buffer.from([4]),Buffer.from(jwk.x,'base64url'),Buffer.from(jwk.y,'base64url')]).toString('base64url'),SDP_PUSH_VAPID_PRIVADA:jwk.d,SDP_PUSH_VAPID_SUBJECTE:'mailto:push@example.invalid'};
test('[DEFECTE P4] WebPush ignores abort but sender settles retry and aborts linked request',async()=>{
  let signal;const web=await creaEnviadorWeb({env:webEnv,fetch:(_url,options)=>{signal=options.signal;return never();},topallMs:10});const result=await deadline(web('https://web.push.apple.com/synthetic'));assert.notEqual(result,'NO_DEADLINE');assert.equal(result.resultat,'reintenta');assert.equal(signal.aborted,true);
});
test('[DEFECTE P5] redirected WebPush response cannot claim delivery',async()=>{
  const response=fakeBody();response.status=201;response.redirected=true;const web=await creaEnviadorWeb({env:webEnv,fetch:async()=>response,topallMs:10});assert.equal((await web('https://web.push.apple.com/synthetic')).resultat,'reintenta');
});
test('[DEFECTE P6] internal constant-time helper never coerces hostile values',async()=>{
  let coerced=false;const hostile={toString(){coerced=true;throw Error('secret sentinel');}};assert.equal(await igualsEnTempsConstant(hostile,SECRET),false);assert.equal(coerced,false);
});
function worker({ack={},repeated=false,flood=false}={}) {
  const claim={id:id(70),lease:id(71)};const batch={protocol:'lease-v2',missatges:1,treballs:1,dispositius:[{id:id(10),tipus:'apns',adreca:'ab'.repeat(32),llengua:'ca',lliuraments:[claim]}]};let claims=0,sends=0,reads=0;
  const fetch=async url=>{if(url.endsWith('xat_push_neteja')){if(flood){const body=fakeBody({empty:9000,text:'{}'});Object.defineProperty(body,'observed',{get:()=>reads=body.reads});return body;}return json({dispositius:0,cua:0});}if(url.endsWith('xat_push_reclama_v2'))return json(++claims<=(repeated?2:1)?batch:{protocol:'lease-v2',missatges:0,treballs:0});if(url.endsWith('xat_push_confirma_v2'))return json(ack);throw Error('unexpected');};
  const gestor=creaPush({env,fetch,registre:quiet,creaEnviadorsNatius:async()=>({apns:async()=>{sends++;return {resultat:'enviat',estat:200};}})});
  return {run:()=>gestor(new Request(BASE,{method:'POST',headers:{'x-sdp-cron':SECRET}})),get sends(){return sends;},get reads(){return reads;}};
}
test('[DEFECTE P7] malformed ACK is unavailable, never reported as completed success',async()=>{
  for(const ack of [{},{acceptats:'1',reintentats:0,expulsats:0},{acceptats:9000,reintentats:0,expulsats:0}]){const w=worker({ack});const r=await w.run();assert.equal(r.status,502);assert.equal(w.sends,1);assert.ok(!(await r.text()).includes(SECRET));}
});
test('[DEFECTE P8] repeated identical lease capability is not sent twice in one pass',async()=>{
  const w=worker({repeated:true,ack:{acceptats:1,reintentats:0,expulsats:0}});await w.run();assert.equal(w.sends,1);
});
test('[DEFECTE P9] fanout helper keeps hard concurrency cap despite oversized requested n',async()=>{
  let live=0,maximum=0;await enviaAmbLimit(Array(30).fill(0),1000,async()=>{live++;maximum=Math.max(maximum,live);await tick();live--;});assert.ok(maximum<=8);
});

test('[DEFECTE W1] wake Auth empty-chunk flood is rejected before background dispatch',async()=>{
  const body=fakeBody({empty:9000,text:JSON.stringify({id:id(1)})});let background=0;const relay=creaDespertador({env,worker:async()=>{},background:()=>background++,fetch:async url=>url.endsWith('/auth/v1/user')?body:json(true)});const r=await relay(new Request(BASE,{method:'POST',headers:{authorization:'Bearer synthetic.user.assertion','content-type':'application/json'},body:JSON.stringify({missatgeId:id(2)})}));assert.equal(r.status,503);assert.equal(background,0);assert.ok(body.reads<=8193);
});
test('[DEFECTE W2] postcommit wake body bounds empty chunks and does not start worker after malformed body',async()=>{
  const body=fakeBody({empty:9000,text:'true'});let calls=0,task;const wake=creaWakePostcommit({env,worker:async()=>calls++,background:p=>task=p,fetch:async()=>body});wake({messageId:id(2),authorId:id(1)});await task;assert.equal(calls,0);assert.ok(body.reads<=8193);
});

test('regression: every redirect rejects private literal or embedded credentials without following',async()=>{
  for(const target of ['https://127.0.0.2/x','https://10.1.2.3/x','https://172.16.0.1/x','https://192.168.1.2/x','https://169.254.169.254/x','https://[::1]/x','https://[fc00::1]/x','https://[fe80::1]/x','https://[::ffff:127.0.0.1]/x','file:///etc/passwd','https://u:p@public.example.org/x']){let fetches=0;const f=news(async()=>{fetches++;return new Response(null,{status:302,headers:{location:target}});});assert.equal((await f.demana()).status,502);assert.equal(fetches,1);}
});
test('regression: nonpublic DNS answers, canonical input and typed provider statuses remain closed',()=>{
  for(const ip of ['127.2.3.4','10.1.1.1','172.31.1.1','192.168.1.1','169.254.2.2','::1','fd12::1','fe80::1','::ffff:8.8.8.8'])assert.equal(esIpNoPublica(ip),true);
  for(const value of [null,1,true,'x',[],{},[{id:[id(1)],lease:id(2)}]])assert.equal(formaDelsLliuraments(value),null);
  for(const status of [429,500,503]){assert.notEqual(classificaWebPush(status),'expulsa');assert.notEqual(classificaApns(status),'expulsa');assert.notEqual(classificaFcm(status),'expulsa');}
  assert.equal(classificaWebPush(410),'expulsa');assert.equal(classificaWebPush(404),'expulsa');assert.equal(classificaApns(410),'expulsa');assert.equal(classificaFcm(404,'UNREGISTERED'),'expulsa');
});
test('regression: pathological unclosed XML retains bounded linear scanner behaviour',()=>{
  for(const n of [50000,100000]){const xml='<rss><channel><item>'+('<content x="'.repeat(n))+'</item></channel></rss>';assert.deepEqual(imatgesDelFeed(xml),[]);}
});


test('[DEFECTE N5] image queue waiting consumes the same six-second request budget', async () => {
  let moment = 0; const timers = [], pending = [];
  const gestor = creaNoticies({ cataleg, ara: () => moment, empremta: async () => 'anonymous',
    temporitzador: { posa: (fn, ms) => { const timer = { fn, ms }; timers.push(timer); return timer; }, lleva() {} },
    fetchImpl: () => new Promise(resolve => pending.push(resolve)) });
  const image = n => gestor(new Request(BASE + '/imatge?u=' + encodeURIComponent('https://ayudawp.com/' + n + '.png')));
  const tasks = Array.from({ length: 9 }, (_, n) => image(n)); await tick();
  assert.equal(pending.length, 8); moment = 5000;
  const png = () => new Response(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]), { headers: { 'content-type': 'image/png' } });
  pending[0](png()); await tick();
  for (const resolve of pending.slice(1)) resolve(png());
  await Promise.all(tasks);
  assert.ok(timers.some(timer => timer.ms === 1000));
});
test('[DEFECTE W3] postcommit commit identifiers are primitives before any network request', async () => {
  let calls = 0, task;
  const wake = creaWakePostcommit({ env, fetch: async () => { calls++; return json(true); }, worker: async () => {}, background: value => { task = value; } });
  wake({ messageId: [id(2)], authorId: id(1) });
  if (task) await task;
  assert.equal(calls, 0);
});
