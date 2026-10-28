import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {prepareShell} from './prepare-social-shell.mjs';
import {createSocialHandler,sha256} from './social-edge.mjs';
const projectRoot=process.env.SDP_PROJECT_ROOT || process.cwd();
const {JSDOM}=createRequire(path.join(projectRoot,'package.json'))('jsdom');
const origin='https://socdepoble.org';
const html=fs.readFileSync(path.join(projectRoot,'index.html'),'utf8');
const shell=prepareShell(html,JSDOM);
const image={url:origin+'/assets/x.png',alt:'Imatge pública',type:'image/png',width:1200,height:630};
const entry=(key,title)=>({title,description:'Una descripció pública',image,type:'article',canonical:origin+key,index:true});
const manifest={schema:'sdp.social-manifest.v1',origin,routes:{'/wikidepoble?item=a':entry('/wikidepoble?item=a','Document A'),'/wikidepoble?item=b':entry('/wikidepoble?item=b','Document B'),'/projecte':entry('/projecte','El projecte')},aliases:{'/page/projecte':'/projecte'}};
const headers={'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self';",ETag:'"shell-v1"','Last-Modified':'Tue, 27 Oct 2026 04:00:00 GMT','Content-Encoding':'gzip','Content-Length':'12','Content-MD5':'old'};
const create=(extra={})=>createSocialHandler({manifest,shell,fetchOrigin:async()=>new Response(html,{headers}),...extra});
const parse=html=>new JSDOM(html).window.document;
const request=(path,init={})=>new Request(origin+path,init);

test('A/B item i aliases no es pleguen al mateix canonical',async()=>{
  const handle=create();
  for(const [route,title,canonical] of [['/wikidepoble?item=a&utm_source=x','Document A',origin+'/wikidepoble?item=a'],['/wikidepoble/?item=b','Document B',origin+'/wikidepoble?item=b'],['/page/projecte','El projecte',origin+'/projecte']]){
    const response=await handle(request(route)); const document=parse(await response.text());
    assert.equal(document.querySelector('meta[property="og:title"]').content,title+' | Sóc de Poble');
    assert.equal(document.querySelector('link[rel="canonical"]').href,canonical);
  }
});
test('UA i cookies no alteren metadades publiques ni s’envien a origen',async()=>{
  const bodies=[];
  const handle=create({fetchOrigin:async r=>{assert.equal(r.headers.has('cookie'),false);assert.equal(r.headers.has('authorization'),false);return new Response(html,{headers});}});
  for(const ua of ['Mozilla/5.0','WhatsApp/2.0','TelegramBot (like TwitterBot)','nottrustedbot'])bodies.push(await(await handle(request('/wikidepoble?item=a',{headers:{'User-Agent':ua,Cookie:'session=secret',Authorization:'Bearer notsent'}}))).text());
  assert.equal(new Set(bodies).size,1);
});
test('desconegut, privat i item repetit no tenen canonical ni titol específic',async()=>{
  const handle=create();
  for(const route of ['/notes?item=a','/wikidepoble?item=private','/wikidepoble?item=a&item=b','/wikidepoble?item=a&%69tem=b','/wikidepoble?item=__proto__']){
    const response=await handle(request(route));const document=parse(await response.text());
    assert.equal(document.title,'Sóc de Poble');assert.equal(document.querySelector('link[rel="canonical"]'),null);assert.equal(document.querySelector('meta[name="robots"]').content,'noindex, nofollow');
  }
});
test('títols hostils són text i no creen script ni atributs',async()=>{
  const hostile='</title><script>alert(1)</script> "><img src=x onerror=alert(2)> & $&';
  const copy=structuredClone(manifest);copy.routes['/projecte'].title=hostile;copy.routes['/projecte'].description=hostile;
  const body=await(await create({manifest:copy})(request('/projecte'))).text();const document=parse(body);
  assert.equal(document.title,hostile+' | Sóc de Poble');assert.equal(document.querySelector('meta[property="og:description"]').content,hostile);
  assert.equal(document.querySelectorAll('img').length,0);assert.deepEqual([...document.querySelectorAll('script')].map(x=>x.outerHTML),[...parse(html).querySelectorAll('script')].map(x=>x.outerHTML));
});
test('el preparador elimina duplicats, inclosos majúscules i og:image:secure_url; les del lloc, una vegada',()=>{
  const body=html.replace('</head>','<META PROPERTY="OG:TITLE" CONTENT="vell"><meta name="og:title" content="vell2"><meta property="og:image:secure_url" content="https://evil.invalid/x.png"><link rel="alternate canonical" href="https://evil.invalid/"><meta property="og:site_name" content="Duplicat"></head>');
  const prepared=prepareShell(body,JSDOM);const document=parse(prepared.template);
  assert.equal(document.head.querySelectorAll('meta[name^="og:" i],link[rel~="canonical" i],title').length,0);
  // Pla 261028_1526 (P1-61, Fase 2) · og:site_name i og:locale són del lloc: es queden, una vegada.
  assert.deepEqual([...document.head.querySelectorAll('meta[property^="og:" i]')].map(n=>[n.getAttribute('property'),n.getAttribute('content')]),
    [['og:site_name','Sóc de Poble'],['og:locale','ca_ES']]);
});
test('GET i HEAD sense validators ni Range i amb CSP preservada',async()=>{
  const calls=[];const handle=create({fetchOrigin:async r=>{calls.push(r);return new Response(html,{headers});}});
  const get=await handle(request('/projecte',{headers:{'If-None-Match':'"old"','If-Modified-Since':'yesterday',Range:'bytes=1-100'}}));
  const head=await handle(request('/projecte',{method:'HEAD',headers:{'If-None-Match':'"old"',Range:'bytes=1-100'}}));
  assert.equal(await head.text(),'');assert.deepEqual([...get.headers],[...head.headers]);
  assert.equal(get.headers.get('Content-Security-Policy'),headers['Content-Security-Policy']);
  assert.equal(get.headers.get('Cache-Control'),'no-store');
  for(const r of calls){assert.equal(r.method,'GET');for(const h of ['if-none-match','if-modified-since','range'])assert.equal(r.headers.has(h),false);}
  for(const h of ['etag','last-modified','content-length','content-encoding','content-md5'])assert.equal(get.headers.has(h),false);
});
test('non200/nonHTML/SetCookie i POST/asset passen sense reescriptura',async()=>{
  for(const [status,type,cookie] of [[302,'text/html',false],[304,'text/html',false],[404,'text/html',false],[500,'text/html',false],[206,'text/html',false],[200,'application/json',false],[200,'text/html',true]]){
    const original=new Response(status===304?null:'upstream',{status,headers:{'Content-Type':type,...(cookie?{'Set-Cookie':'x=y'}:{})}});
    const handle=create({fetchOrigin:async()=>original});const response=await handle(request('/projecte'));
    assert.equal(response,original);assert.equal(response.headers.has('X-SDP-Social'),false);
  }
  for(const req of [request('/projecte',{method:'POST',body:'x'}),request('/assets/x.png'),request('/api/info')]){
    const handle=create({fetchOrigin:async r=>{assert.equal(r,req);return new Response('passthrough');}});assert.equal(await(await handle(req)).text(),'passthrough');
  }
});
test('shell d’una altra release passa exacte i sense validators',async()=>{
  const handle=create({fetchOrigin:async()=>new Response(html+'\n<!-- nova release -->',{headers})});const response=await handle(request('/projecte'));
  assert.equal(response.headers.get('X-SDP-Social'),'build-mismatch');assert.equal(await response.text(),html+'\n<!-- nova release -->');assert.equal(response.headers.has('etag'),false);
});
test('visibilitat retirada no reutilitza metadata de la request anterior',async()=>{
  const first=await(await create()(request('/wikidepoble?item=a'))).text();assert.match(first,/Document A/);
  const next=structuredClone(manifest);delete next.routes['/wikidepoble?item=a'];const second=await(await create({manifest:next})(request('/wikidepoble?item=a'))).text();assert.doesNotMatch(second,/Document A/);
});
test('SHA del preparador coincideix amb el mateix hash del runtime',async()=>{assert.equal(shell.sourceSha256,await sha256(html));});
test('no-store preval també en directives CDN més específiques',async()=>{
  const handle=create({fetchOrigin:async()=>new Response(html,{headers:{...headers,'CDN-Cache-Control':'public, max-age=86400','Cloudflare-CDN-Cache-Control':'public, max-age=86400','Surrogate-Control':'max-age=86400'}})});
  const response=await handle(request('/projecte'));
  for(const name of ['CDN-Cache-Control','Cloudflare-CDN-Cache-Control','Surrogate-Control'])assert.ok(!response.headers.has(name)||response.headers.get(name)==='no-store',name+' contradiu no-store');
});
