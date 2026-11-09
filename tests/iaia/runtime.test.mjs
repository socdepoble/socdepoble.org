import {test} from 'node:test';import assert from 'node:assert/strict';
import {capturaConsultaIAIA,validaRespostaIAIA} from '../../src/data/iaiaProtocol.js';
import {creaModelIAIA} from '../../supabase/functions/iaia/model.js';
import {creaServeiIAIA} from '../../supabase/functions/iaia/service.js';
import {creaGestorIAIA} from '../../supabase/functions/iaia/gestor.js';
import {creaSessioNodeZeroHttp} from '../../src/data/node0/sessioNodeZeroHttp.js';
import {creaServeiIAIANodeZero} from '../../tooling/node0/iaia-node0.mjs';
const R='10000000-0000-4000-8000-000000000001',U='20000000-0000-4000-8000-000000000001',T='30000000-0000-4000-8000-000000000001',F='40000000-0000-4000-8000-000000000001';
const input={mode:'direct',requestId:R,question:'Com funciona?',language:'ca'};
const json=v=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
const fixture=(extra={})=>creaServeiIAIA({authorize:async()=>({userId:U,tenantId:T}),store:{discover:async()=>null},...extra});
test('loop1 strict optional protocol rejects authority, hidden transcript, getters and grant-only success',()=>{
 assert.deepEqual(capturaConsultaIAIA(input),input);for(const extra of [{userId:U},{tenantId:T},{history:[]},{model:'x'},{botId:U}])assert.throws(()=>capturaConsultaIAIA({...input,...extra}));
 assert.throws(()=>capturaConsultaIAIA({...input,question:'x'.repeat(2001)}));assert.throws(()=>capturaConsultaIAIA({...input,get language(){throw Error('getter ran');}}),/IAIA_INVALID/);
 for(const v of [{accepted:true},{source:'model',inference:false,text:'x',requestId:R},{source:'configuration',inference:false,requestId:R},{source:'model',inference:true,text:'x',requestId:U}])assert.throws(()=>validaRespostaIAIA(v,input));
 assert.equal(validaRespostaIAIA({source:'unavailable',inference:false,requestId:R},input).inference,false);
});
test('loop1 real configured model HTTP request is server-only, fixed, bounded and proves completed generation',async()=>{
 let observed;const infer=creaModelIAIA({endpoint:'http://127.0.0.1:11434/api/generate',model:'hermes-test',fetchImpl:async(url,opts)=>{observed={url,opts};return json({done:true,model:'hermes-test',response:'Resposta',eval_count:3});}});
 assert.equal(await infer({question:'Hola',language:'ca',context:['Visible']}),'Resposta');assert.equal(observed.url,'http://127.0.0.1:11434/api/generate');const body=JSON.parse(observed.opts.body);assert.equal(body.stream,false);assert.equal(body.model,'hermes-test');assert.deepEqual(JSON.parse(body.prompt),{question:'Hola',context:['Visible']});assert.equal(observed.opts.redirect,'error');assert.equal(observed.opts.credentials,'omit');assert.equal(creaModelIAIA({}),null);
 assert.throws(()=>creaModelIAIA({endpoint:'http://remote.example/api/generate',model:'x'}));
});
test('loop2 no config, incomplete/grant-only/model-mismatch payload never claims inference; hung transport aborts',async()=>{
 let calls=0;const off=fixture();assert.deepEqual(await off(input,{}),{source:'unavailable',inference:false,requestId:R});assert.equal((await off({mode:'discover'},{})).available,false);
 for(const payload of [{accepted:true},{done:false,model:'m',response:'x',eval_count:1},{done:true,model:'other',response:'x',eval_count:1},{done:true,model:'m',response:'x',eval_count:0}]){
 const infer=creaModelIAIA({endpoint:'https://model.example/api/generate',model:'m',fetchImpl:async()=>{calls++;return json(payload);}});await assert.rejects(infer({question:'Hi'}));}
 const slow=creaModelIAIA({endpoint:'https://model.example/api/generate',model:'m',timeoutMs:15,fetchImpl:()=>new Promise(()=>{})});await assert.rejects(slow({question:'Hi'}),/IAIA_TIMEOUT/);assert.equal(calls,4);
 const abort=new AbortController();abort.abort();await assert.rejects(slow({question:'Hi'},abort.signal));
});
test('loop2 direct request replay/scope switch/abort and nontext inference fail closed',async()=>{
 let calls=0;const service=fixture({infer:async()=>{calls++;return 'Real';}});assert.equal((await service(input,{})).inference,true);await assert.rejects(service(input,{}),/IAIA_REPLAY/);assert.equal(calls,1);
 let auth=0;const scoped=fixture({authorize:async()=>({userId:++auth===1?U:R,tenantId:T}),infer:async()=> 'Wrong scope'});await assert.rejects(scoped(input,{}),/IAIA_SCOPE/);
 const control=new AbortController();const aborted=fixture({infer:async()=>{control.abort();return 'Late';}});await assert.rejects(aborted(input,{},control.signal));await assert.rejects(fixture({infer:async()=>({accepted:true})})(input,{}),/IAIA_MODEL/);
});
test('loop3 persistent group claim controls inference, exact server context, own reply and cancellation',async()=>{
 const group={mode:'group',requestId:R,threadId:F,messageId:U,language:'ca'};let finish=0,cancel=0,received;
 const store={discover:async()=>null,claim:async()=>({state:'claimed',jobId:R,leaseId:U,question:'@iaia hola',context:['same group']}),finish:async(_s,_i,_c,text)=>{finish++;return {replyId:T,text};},cancel:async()=>{cancel++;}};
 const good=fixture({store,infer:async dto=>{received=dto;return 'Answer';}});assert.equal((await good(group,{})).replyId,T);assert.deepEqual(received,{question:'@iaia hola',context:['same group'],language:'ca'});assert.equal(finish,1);
 const bad=fixture({store,infer:async()=>{throw Error('model down');}});await assert.rejects(bad(group,{}));assert.equal(cancel,1);
 const pending=fixture({store:{...store,claim:async()=>({state:'pending'})},infer:()=>{throw Error('must not infer');}});assert.equal((await pending(group,{})).inference,false);
});
test('loop3 Edge verifies real JWT authority before optional config; CORS/body/authority negatives never infer',async()=>{
 let calls=[];const env={SUPABASE_URL:'https://backend.example',SUPABASE_ANON_KEY:'public-key',SDP_IAIA_TENANT:T};const handler=creaGestorIAIA({env,fetchImpl:async(url,opts)=>{calls.push({url,opts});return json({id:U});}});
 const req=(body=input,origin='https://socdepoble.org',token='a'.repeat(30))=>new Request('https://edge.example/iaia',{method:'POST',headers:{Origin:origin,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 let response=await handler(req());assert.equal(response.status,200);assert.equal((await response.json()).inference,false);assert.equal(calls[0].url,'https://backend.example/auth/v1/user');assert.equal(calls[0].opts.headers.Authorization,`Bearer ${'a'.repeat(30)}`);
 assert.equal((await handler(req(input,'https://evil.example'))).status,403);assert.equal((await handler(req(input,undefined,'bad'))).status,401);assert.equal((await handler(req({...input,userId:U}))).status,400);assert.equal(calls.length,1);
});
test('loop4 actual cookie transport uses fixed IAIA route + expected actor; Node service authenticates twice without changing core compiler',async()=>{
 let request;const transport=creaSessioNodeZeroHttp({endpoint:'http://127.0.0.1:4340/api/v1/node0',origin:'http://127.0.0.1:4340',fetchImpl:async(url,opts)=>{request={url,opts};return json({source:'unavailable',inference:false,requestId:R});}});
 await assert.rejects(transport.demanaIAIA(input),/identitat/);await transport.demanaIAIA(input,{expectedActor:U});assert.equal(request.url,'http://127.0.0.1:4340/api/v1/node0/iaia');assert.equal(request.opts.headers['X-SDP-Expected-Actor'],U);assert.equal(request.opts.credentials,'same-origin');transport.destroy();
 let sql=[];const service=creaServeiIAIANodeZero({db:{query:async text=>{sql.push(text);return {userId:U,tenantId:T};}},tenantId:T});
 assert.equal((await service.handle({headers:{origin:'https://evil.example'},body:input})).status,403);assert.equal(sql.length,0);
 const result=await service.handle({headers:{origin:'https://socdepoble.cat',cookie:`__Host-sdp-node0=${Buffer.alloc(32,7).toString('base64url')}`,'x-sdp-expected-actor':U},body:input});
 assert.equal(result.status,200);assert.equal(result.body.inference,false);assert.equal(sql.length,1);assert.match(sql[0],/private.node0_auth_context/);assert.match(sql[0],/SET LOCAL ROLE authenticated/);
 const modelService=creaServeiIAIANodeZero({db:{query:async text=>{sql.push(text);return {userId:U,tenantId:T};}},tenantId:T,env:{SDP_NODE0_IAIA:'1',SDP_IAIA_MODEL_ENDPOINT:'https://model.example/api/generate',SDP_IAIA_MODEL:'m'},fetchImpl:async()=>json({model:'m',done:true,response:'Real',eval_count:1})});
 const real=await modelService.handle({headers:{origin:'https://socdepoble.cat',cookie:`__Host-sdp-node0=${Buffer.alloc(32,7).toString('base64url')}`,'x-sdp-expected-actor':U},body:input});assert.equal(real.body.inference,true);assert.equal(sql.length,3);
});
