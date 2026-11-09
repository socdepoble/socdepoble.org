import {test} from 'node:test';import assert from 'node:assert/strict';import {Readable} from 'node:stream';import {EventEmitter} from 'node:events';
import {creaServidor} from '../../tooling/node0/servidor-node0-soberania.mjs';
const requestId='10000000-0000-4000-8000-000000000001';
async function call(server,{method='POST',url='/api/v1/node0/iaia',headers={},body={mode:'direct',requestId,question:'Hola'}}={}){
 const req=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(req,{method,url,headers:{host:'socdepoble.cat',origin:'https://socdepoble.cat','content-type':'application/json',...headers}});
 return new Promise(resolve=>{const res=new EventEmitter();res.setHeader=()=>{};res.writeHead=(status,h)=>{res.status=status;res.headers=h;};res.end=bytes=>resolve({status:res.status,headers:res.headers,body:JSON.parse(bytes)});server.emit('request',req,res);});
}
test('loop4 real HTTP route handles private IAIA before CORS, passes abort, refuses cross-origin/query/content-type',async()=>{
 let calls=0,signal;const handler={handle:async args=>{calls++;signal=args.signal;return {status:200,body:{source:'unavailable',inference:false,requestId}};}};
 const server=creaServidor({db:{},claus:{},auth:{handle(){}},backend:{handle(){}},identificaClient:()=> 'fixture',iaia:handler});
 let result=await call(server);assert.equal(result.status,200);assert.equal(result.body.inference,false);assert.equal(result.headers['Access-Control-Allow-Origin'],undefined);assert.equal(signal.aborted,false);
 assert.equal((await call(server,{headers:{origin:'https://evil.example'}})).status,403);assert.equal((await call(server,{url:'/api/v1/node0/iaia?question=secret'})).status,405);assert.equal((await call(server,{headers:{'content-type':'text/plain'}})).status,415);assert.equal((await call(server,{method:'GET'})).status,405);assert.equal(calls,1);
 const absent=creaServidor({db:{},claus:{}});assert.equal((await call(absent)).status,503);server.close();absent.close();
});
