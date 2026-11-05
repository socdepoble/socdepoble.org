import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaIdentificadorClientNodeZero } from '../tooling/node0/client-ingress-node0.mjs';

// Deliberately public test constant; never use in an environment or proxy.
const TEST_SECRET='TEST_ONLY_NOT_A_DEPLOY_SECRET_00000000';
const identify=creaIdentificadorClientNodeZero({proxySecret:TEST_SECRET});
const request=(ip='198.51.100.42',extra={})=>({socket:{remoteAddress:'127.0.0.1'},rawHeaders:['Host','socdepoble.cat','X-Sdp-Proxy-Auth',TEST_SECRET,'X-Sdp-Client-IP',ip],...extra});
const refused=fn=>assert.throws(fn,error=>error.status===503&&error.code==='node0_client_ingress_unavailable'&&error.message==='node0_client_ingress_unavailable');

test('only configured server secrets of at least32 ASCII base64url characters are accepted',()=>{
  for(const proxySecret of [undefined,null,'','x'.repeat(31),'x'.repeat(129),' '.repeat(48),'secret\r\n'+'x'.repeat(48),Buffer.from(TEST_SECRET),'é'.repeat(48)]) assert.throws(()=>creaIdentificadorClientNodeZero({proxySecret}),TypeError);
  assert.equal(typeof creaIdentificadorClientNodeZero({proxySecret:'a'.repeat(32)}),'function');
});
test('local authenticated proxy returns exactly one canonical IPv4 client identity',()=>{
  assert.equal(identify(request()),'198.51.100.42');
  assert.equal(identify(request('192.168.0.42')),'192.168.0.42');
});
test('IPv6 loopback proxy and canonical IPv6 client identity are supported',()=>{
  assert.equal(identify(request('2001:db8::1',{socket:{remoteAddress:'::1'}})),'2001:db8::1');
  assert.equal(identify(request('2606:4700:4700::1111')),'2606:4700:4700::1111');
});
test('direct external sockets cannot authenticate even with all matching headers',()=>{
  for(const remoteAddress of ['198.51.100.1','192.168.0.23','127.0.0.2','::ffff:127.0.0.1','0:0:0:0:0:0:0:1','localhost','',undefined]) refused(()=>identify(request(undefined,{socket:{remoteAddress}})));
  refused(()=>identify({rawHeaders:request().rawHeaders}));
});
test('missing, forged or noncanonical proxy secret refuses before any quota could use an IP',()=>{
  for(const auth of ['WRONG_SECRET_NOT_A_DEPLOY_SECRET_00000',TEST_SECRET+'x',' '+TEST_SECRET,TEST_SECRET+' ',TEST_SECRET+'\r\n']) {
    const req=request();req.rawHeaders[3]=auth;refused(()=>identify(req));
  }
  refused(()=>identify(request(undefined,{rawHeaders:['X-Sdp-Client-IP','198.51.100.42']})));
});
test('duplicate authentication and client IP headers fail despite different casing or same values',()=>{
  for(const headers of [['X-Sdp-Proxy-Auth',TEST_SECRET],['x-sdp-proxy-auth',TEST_SECRET],['X-Sdp-Client-IP','198.51.100.42'],['x-sdp-client-ip','198.51.100.42']]) {
    const req=request();req.rawHeaders.push(...headers);refused(()=>identify(req));
  }
});
test('headers object alone, XFF and Cloudflare headers never establish identity',()=>{
  refused(()=>identify({socket:{remoteAddress:'127.0.0.1'},headers:{'x-sdp-proxy-auth':TEST_SECRET,'x-sdp-client-ip':'198.51.100.42'}}));
  refused(()=>identify(request(undefined,{rawHeaders:['X-Forwarded-For','198.51.100.42','CF-Connecting-IP','198.51.100.42']})));
  const req=request();req.rawHeaders.push('X-Forwarded-For','203.0.113.42','CF-Connecting-IP','203.0.113.42');
  assert.equal(identify(req),'198.51.100.42');
});
test('client header rejects lists, whitespace, CRLF, zones, hostnames and invalid literals',()=>{
  for(const ip of ['', '198.51.100.42, 203.0.113.1','198.51.100.42 203.0.113.1',' 198.51.100.42','198.51.100.42 ','198.51.100.42\r\nX:1','[2001:db8::1]','fe80::1%en0','example.test','1.2.3','999.1.2.3','198.051.100.42','0xc0.0x00.0x02.0x01','3221225985']) refused(()=>identify(request(ip)));
});
test('IPv6 is canonical and never accepted as mapped/embedded IPv4',()=>{
  for(const ip of ['2001:DB8::1','2001:0db8::1','2001:db8:0:0:0:0:0:1','::ffff:198.51.100.42','::ffff:c633:642a','0:0:0:0:0:ffff:c633:642a','::198.51.100.42']) refused(()=>identify(request(ip)));
});
test('malformed raw headers fail closed without leaking input values',()=>{
  for(const rawHeaders of [null,{},['X-Sdp-Proxy-Auth'],[1,TEST_SECRET],['X-Sdp-Proxy-Auth',null],['X-Sdp-Client-IP','SENTINEL\0']]) refused(()=>identify(request(undefined,{rawHeaders})));
});
test('caller configuration mutation cannot change the captured proxy secret',()=>{
  const options={proxySecret:TEST_SECRET};const fn=creaIdentificadorClientNodeZero(options);options.proxySecret='replacement'.repeat(6);
  assert.equal(fn(request()),'198.51.100.42');
});
test('two authenticated external client IPs remain distinct and an error has no quota side effect',()=>{
  let quotaCalls=0;const counted=req=>{const client=identify(req);quotaCalls++;return client;};
  assert.notEqual(counted(request('198.51.100.1')),counted(request('198.51.100.2')));
  const req=request();req.rawHeaders[3]='WRONG_SECRET_NOT_A_DEPLOY_SECRET_00000';refused(()=>counted(req));assert.equal(quotaCalls,2);
});
