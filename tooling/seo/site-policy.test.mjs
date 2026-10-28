import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {buildSitePolicy} from './build-site-policy.mjs';
import {applySitePolicy,validateSitePolicy} from './apply-site-policy.mjs';
import {prepareShell} from './prepare-social-shell.mjs';
import {createSocialHandler} from './social-edge.mjs';
const root=process.env.SDP_PROJECT_ROOT || process.cwd();
const {JSDOM}=createRequire(path.join(root,'package.json'))('jsdom');
const source=await fs.readFile(path.join(root,'firebase.json'),'utf8');
const configuration=JSON.parse(source);
const policy=buildSitePolicy(source);
const csp=configuration.hosting.headers.find(r=>r.source==='**').headers.find(h=>h.key==='Content-Security-Policy').value;
const origin='https://socdepoble.org';
const req=(pathname,method='GET')=>new Request(origin+pathname,{method});
const body='<!doctype html><html><head><title>Base</title><meta property="og:title" content="Base"></head><body><div id="root"></div></body></html>';

test('projecció exacta de Firebase: CSP i tres CORS, amb hash dels bytes font',()=>{
  assert.equal(policy.sourceSha256,createHash('sha256').update(source).digest('hex'));
  assert.deepEqual(policy.globalHeaders,{'content-security-policy':csp});
  assert.deepEqual(policy.assets.headers,Object.fromEntries(configuration.hosting.headers.find(r=>r.source==='/assets/**').headers.map(h=>[h.key.toLowerCase(),h.value])));
  assert.equal(JSON.stringify(policy).includes('Cache-Control'),false);
});
test('font absent, ambigua o sense tots els CORS falla abans de generar política',()=>{
  assert.throws(()=>buildSitePolicy('{}'));
  const duplicate=structuredClone(configuration);duplicate.hosting.headers.push({source:'**',headers:[{key:'content-security-policy',value:csp}]});
  assert.throws(()=>buildSitePolicy(JSON.stringify(duplicate)),/ambigua/);
  const missing=structuredClone(configuration);missing.hosting.headers.find(r=>r.source==='/assets/**').headers.pop();
  assert.throws(()=>buildSitePolicy(JSON.stringify(missing)),/invàlid/);
});
test('shape i capçaleres arbitràries, Cache-Control i CRLF són rebutjats',()=>{
  for(const mutate of [p=>p.globalHeaders['cache-control']='public',p=>p.assets.prefix='/',p=>p.assets.headers['access-control-allow-origin']='*\r\nInjected: yes',p=>p.sourceSha256='short',p=>p.extra=true,p=>p.globalHeaders={}]){
    const bad=structuredClone(policy);mutate(bad);assert.throws(()=>validateSitePolicy(bad));
  }
});
test('helper adjunta CSP a HTML i conserva no-store i headers del core',async()=>{
  const original=new Response(body,{status:200,headers:{'Content-Type':'text/html','Cache-Control':'no-store','X-SDP-Social':'public','X-Custom':'kept'}});
  const response=applySitePolicy(req('/projecte'),original,policy);
  assert.equal(response.headers.get('Content-Security-Policy'),csp);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('X-SDP-Social'),'public');assert.equal(response.headers.get('X-Custom'),'kept');
  assert.equal(response.headers.has('Access-Control-Allow-Origin'),false);
  assert.equal(original.headers.has('Content-Security-Policy'),false);
  assert.equal(await response.text(),body);
});
test('helper aplica CORS només al prefix /assets/ i preserva status/body de HEAD i OPTIONS',async()=>{
  for(const [pathname,method,status,content] of [['/assets/x.png','GET',200,'PNG'],['/assets/x.png','HEAD',200,null],['/assets/x.png','OPTIONS',204,null],['/assets-other/x.png','GET',200,'PNG'],['/fonts/x.woff2','GET',200,'FONT']]){
    const response=applySitePolicy(req(pathname,method),new Response(content,{status,headers:{'Cache-Control':'public, max-age=300'}}),policy);
    assert.equal(response.status,status);assert.equal(response.headers.get('Content-Security-Policy'),csp);assert.equal(response.headers.get('Cache-Control'),'public, max-age=300');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),pathname.startsWith('/assets/')?'*':null);
    assert.equal(await response.text(),content||'');
  }
});
/* Pla 261028_1526 (P1-61, Fase 2) · Decisió 2 del Mestre: cap Cloudflare en
   este torn, i l'adaptador Worker (social-worker.mjs) no es desplega. La
   mateixa composició que faria qualsevol edge (el nucli social i, damunt, la
   política de la release), amb un origen d'assets sense CSP. */
test('edge adormit: el nucli social amb la política del lloc per a HTML, asset, HEAD i OPTIONS',async()=>{
  const key='/projecte';
  const manifest={schema:'sdp.social-manifest.v1',origin,aliases:{},routes:{[key]:{title:'El projecte',description:'La presentació pública',image:{url:origin+'/assets/x.png',alt:'Paisatge'},type:'website',canonical:origin+key,index:true}}};
  const calls=[];
  const assets=async request=>{
    calls.push(request);
    if(request.method==='OPTIONS')return new Response(null,{status:204});
    const asset=new URL(request.url).pathname.startsWith('/assets/');
    return new Response(request.method==='HEAD'?null:asset?'PNG':body,{status:200,headers:{'Content-Type':asset?'image/png':'text/html','Cache-Control':'public, max-age=300'}});
  };
  const handler=createSocialHandler({manifest,shell:prepareShell(body,JSDOM),fetchOrigin:assets});
  const edge=async request=>applySitePolicy(request,await handler(request),policy);
  const get=await edge(req('/projecte'));assert.equal(get.headers.get('Content-Security-Policy'),csp);assert.equal(get.headers.get('Cache-Control'),'no-store');assert.match(await get.text(),/El projecte/);
  const asset=await edge(req('/assets/x.png'));assert.equal(asset.headers.get('Content-Security-Policy'),csp);assert.equal(asset.headers.get('Access-Control-Allow-Origin'),'*');assert.equal(await asset.text(),'PNG');
  const head=await edge(req('/projecte','HEAD'));assert.equal(head.headers.get('Content-Security-Policy'),csp);assert.equal(head.headers.get('Cache-Control'),'no-store');assert.equal(await head.text(),'');assert.equal(calls.at(-1).method,'GET');
  const options=await edge(req('/assets/x.png','OPTIONS'));assert.equal(options.status,204);assert.equal(options.headers.get('Content-Security-Policy'),csp);assert.equal(options.headers.get('Access-Control-Allow-Headers'),'Range');assert.equal(await options.text(),'');assert.equal(calls.at(-1).method,'OPTIONS');
});
