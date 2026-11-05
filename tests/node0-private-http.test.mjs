import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { creaServidor } from '../tooling/node0/servidor-node0-soberania.mjs';
async function invoke(server,{method='GET',url='/api/v1/node0/auth/session',headers={},body=''}={}){
  const req=Readable.from(body?[Buffer.from(body)]:[]);req.method=method;req.url=url;req.headers={host:'socdepoble.cat',...headers};req.socket={remoteAddress:'127.0.0.1'};
  let resolve;const done=new Promise(r=>{resolve=r;});
  const response={headers:{},headersSent:false,setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(status,headers){this.status=status;for(const[k,v]of Object.entries(headers))this.setHeader(k,v);this.headersSent=true;},end(bytes){this.body=JSON.parse(bytes);resolve(this);}};
  server.emit('request',req,response);return done;
}
const deps={db:{status:async()=>({ok:true})},claus:{fingerprint:'public-test-key'}};
test('unconfigured user endpoints fail closed and never inherit public CORS',async()=>{
  const server=creaServidor(deps);
  for(const url of ['/api/v1/node0/auth/session','/api/v1/node0/private/getProfile']){
    const res=await invoke(server,{url,headers:{origin:'https://socdepoble.org'}});
    assert.equal(res.status,503);assert.equal(res.headers['access-control-allow-origin'],undefined);assert.equal(res.body.error,'node0_user_backend_unavailable');
  }
  assert.equal((await invoke(server,{url:'/api/v1/node0/status'})).body.capabilities.userSessions,false);
});
test('private POST JSON origin, method, query and body limits precede handler effects',async()=>{
  let calls=0;const handler={handle:async()=>{calls++;return {status:200,body:{private:true}};}};
  const server=creaServidor({...deps,auth:handler,backend:handler,identificaClient:()=> '203.0.113.10'});
  const cases=[
    [{method:'GET',url:'/api/v1/node0/private/getProfile'},405],
    [{method:'POST',url:'/api/v1/node0/private/updateProfile',headers:{origin:'https://socdepoble.org','content-type':'application/json'},body:'{}'},403],
    [{method:'POST',url:'/api/v1/node0/private/updateProfile',headers:{origin:'https://socdepoble.cat','content-type':'text/plain'},body:'{}'},415],
    [{url:'/api/v1/node0/auth/session?token=forged'},400],
    [{method:'POST',url:'/api/v1/node0/auth/login',headers:{origin:'https://socdepoble.cat','content-type':'application/json'},body:'not json'},400],
    [{method:'POST',url:'/api/v1/node0/auth/login',headers:{origin:'https://socdepoble.cat','content-type':'application/json','content-length':'16385'}},413]
  ];
  for(const[request,status]of cases){const res=await invoke(server,request);assert.equal(res.status,status);assert.equal(res.headers['access-control-allow-origin'],undefined);}
  assert.equal(calls,0);
});
test('auth mutations cannot use the shared loopback or arbitrary forwarded IP as an account rate identity',async()=>{
  let calls=0;const handler={handle:async()=>{calls++;return {status:200,body:{}};}};
  const server=creaServidor({...deps,auth:handler,backend:handler});
  const res=await invoke(server,{method:'POST',url:'/api/v1/node0/auth/login',headers:{origin:'https://socdepoble.cat','content-type':'application/json','x-forwarded-for':'8.8.8.8'},body:'{}'});
  assert.equal(res.status,503);assert.equal(res.body.error,'trusted_ingress_required');assert.equal(calls,0);
});
test('same-origin session and private requests pass cookies solely to trusted handlers, without CORS',async()=>{
  const received=[];const handler={handle:async(action,args)=>{received.push({action,...args});return {status:200,body:{user:{id:'test-person'}},headers:{'Set-Cookie':'__Host-sdp-node0=opaque; Secure; HttpOnly; SameSite=Strict; Path=/'}};}};
  const server=creaServidor({...deps,auth:handler,backend:handler});
  const session=await invoke(server,{headers:{cookie:'__Host-sdp-node0=opaque'}});
  assert.equal(session.status,200);assert.equal(session.headers['access-control-allow-origin'],undefined);assert.match(session.headers['set-cookie'],/HttpOnly/);
  const privateRead=await invoke(server,{method:'POST',url:'/api/v1/node0/private/getProfile',headers:{origin:'https://socdepoble.cat','content-type':'application/json',cookie:'__Host-sdp-node0=opaque'},body:'{}'});
  assert.equal(privateRead.status,200);assert.equal(privateRead.headers['access-control-allow-origin'],undefined);
  assert.equal(received[1].action,'getProfile');assert.deepEqual(received[1].body,{});assert.equal(received[1].headers.cookie,'__Host-sdp-node0=opaque');
});
