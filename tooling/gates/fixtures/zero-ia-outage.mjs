/** Preload for isolated verification only. Preserves non-AI services, including
 * the website/backend on the same Node 0 host. Never stops a real process. */
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';
import { classificaEndpoint } from '../zero-ia-endpoints.mjs';

const state={blocked:0,mode:process.env.SDP_ZERO_IA_MODE==='hang'?'hang':'refuse'};
globalThis[Symbol.for('sdp.zero-ia.outage')]=state;
const unavailable=()=>Object.assign(new Error('AI fixture offline'),{code:'ECONNREFUSED'});
const originalFetch=globalThis.fetch;
if(originalFetch)globalThis.fetch=function(input,options={}) {
  const url=typeof input==='string'||input instanceof URL?String(input):input?.url;
  if(classificaEndpoint(url)!=='ai')return originalFetch.call(this,input,options);
  state.blocked++;
  if(state.mode==='refuse')return Promise.reject(unavailable());
  const signal=options.signal??input?.signal;
  return new Promise((_,reject)=>{
    if(signal?.aborted){reject(signal.reason??unavailable());return;}
    signal?.addEventListener('abort',()=>reject(signal.reason??unavailable()),{once:true});
  });
};
function address(protocol,args) {
  if(typeof args[0]==='string'||args[0] instanceof URL)return String(args[0]);
  const o=args[0]??{};
  return `${o.protocol??protocol}//${o.hostname??o.host??'localhost'}${o.port?`:${o.port}`:''}${o.path??'/'}`;
}
for(const [client,protocol]of [[http,'http:'],[https,'https:']]){
  const request=client.request;
  client.request=function(...args){
    if(classificaEndpoint(address(protocol,args))!=='ai')return request.apply(this,args);
    state.blocked++;
    const req=new EventEmitter();let timer=null,closed=false;
    req.write=()=>true;
    req.destroy=(error)=>{if(closed)return req;closed=true;clearTimeout(timer);queueMicrotask(()=>{if(error)req.emit('error',error);req.emit('close');});return req;};
    req.setTimeout=(ms,callback)=>{if(callback)req.once('timeout',callback);timer=setTimeout(()=>req.emit('timeout'),ms);return req;};
    req.end=()=>{if(state.mode==='refuse')req.destroy(unavailable());return req;};
    const options=typeof args[0]==='object'&&!(args[0]instanceof URL)?args[0]:args[1];
    options?.signal?.addEventListener('abort',()=>req.destroy(options.signal.reason??unavailable()),{once:true});
    return req;
  };
  client.get=function(...args){const req=client.request.apply(this,args);req.end();return req;};
}
syncBuiltinESMExports();
