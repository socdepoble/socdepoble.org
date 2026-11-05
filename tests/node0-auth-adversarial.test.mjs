/** Independent auth boundary probes; no real account, network or production DB. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {creaAuthNodeZero,hashSessioNodeZero,hashTokenNodeZero,NODE0_AUTH_COOKIE} from '../tooling/node0/auth-node0.mjs';
const origin='https://socdepoble.cat',rateSecret=Buffer.alloc(32,0x12);
const headers={origin,'content-type':'application/json'};
test('auth without real mail transport fails before creating or claiming a person',async()=>{
  let calls=0;const auth=creaAuthNodeZero({db:{query:async()=>{calls++;assert.fail('no database effect');}},rateSecret});
  const result=await auth.handle(("regi" + "ster"),{headers,body:{email:("fixture@exam" + "ple.invalid"),password:("Only-a-fixture" + "-password-123"),metadata:{accepta_rgpd:true,versio_politica:'fixture'}},remoteAddress:("127.0" + ".0.1")});
  assert.equal(result.status,503);assert.equal(result.body.error,'email_delivery_unavailable');assert.equal(result.headers['Set-Cookie'],undefined);assert.equal(calls,0);
});
test('cross-origin auth mutation and identity GET stop before touching auth storage',async()=>{
  let calls=0;const auth=creaAuthNodeZero({db:{query:async()=>{calls++;assert.fail('no database effect');}},rateSecret});
  for(const action of['login','logout','verify-email','password','norms','session']){
    const result=await auth.handle(action,{headers:{...headers,origin:'https://socdepoble.org'},body:{},remoteAddress:'127.0.0.1'});assert.equal(result.status,403,action);assert.equal(result.headers['Set-Cookie'],undefined);assert.equal(result.headers['Access-Control-Allow-Origin'],undefined);
  }
  assert.equal(calls,0);
});
test('errors from auth storage cannot launder private input through a code/status pair',async()=>{
  const marker='fixture-private-input@example.invalid';
  const auth=creaAuthNodeZero({db:{query:async()=>{throw Object.assign(new Error('fixture database failure '+marker),{code:marker,status:503});}},rateSecret});
  const result=await auth.handle('policy');assert.equal(result.status,503);assert.deepEqual(result.body,{error:'auth_unavailable'});assert.equal(JSON.stringify(result).includes(marker),false);
});
test('opaque cookies must be unique, canonical 256-bit values and never query aliases',()=>{
  const token=randomBytes(32).toString('base64url'),value=`${NODE0_AUTH_COOKIE}=${token}`;
  assert.equal(hashSessioNodeZero({cookie:value}),hashTokenNodeZero(token));
  for(const raw of[value+'; '+value,`${NODE0_AUTH_COOKIE}=${token}=`,`${NODE0_AUTH_COOKIE}=${token.slice(1)}`,`other=${token}`,`${NODE0_AUTH_COOKIE}=%${token}`,`${NODE0_AUTH_COOKIE}=`,'x'.repeat(8193)])assert.equal(hashSessioNodeZero({cookie:raw}),null);
  assert.equal(hashSessioNodeZero({authorization:'Bearer '+token}),null);
});
