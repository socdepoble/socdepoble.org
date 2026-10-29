/* QA-H04 (verificació QA local, 261029) · La projecció pública sanejada
   (projeccio-publica.mjs) i la cadena sencera de build:social: un backend
   simulat amb fetch fals (cap xarxa ni credencial real), el snapshot que
   n'ix i el prerender que el consumix sobre un dist/ temporal. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ESCAPADA, entornDelBuild, esPublicada, main, origensDImatge, projeccioPublica, variablesDelBuild} from './projeccio-publica.mjs';
import {buildSocialManifest, llegixSnapshot, MAX_SNAPSHOT} from './build-social-manifest.mjs';
import {prerenderSocial} from './prerender-social.mjs';

const projectRoot=process.env.SDP_PROJECT_ROOT || process.cwd();
const {JSDOM}=createRequire(path.join(projectRoot,'package.json'))('jsdom');
const origin='https://socdepoble.org';
const SUPABASE='https://exemple.supabase.co';
const TENANT='11111111-1111-4111-8111-111111111111';
const b64=objecte=>Buffer.from(JSON.stringify(objecte)).toString('base64url');
const jwt=role=>[b64({alg:'HS256',typ:'JWT'}),b64({iss:'supabase',ref:'exemple',role}),'c2lnbmF0dXJhLWZhbHNh'].join('.');
const ANON=jwt('anon');
const ENTORN=Object.freeze({VITE_SUPABASE_URL:SUPABASE,VITE_SUPABASE_ANON_KEY:ANON,VITE_TENANT_ID:TENANT,VITE_DATA_MODE:'remote'});
const CAMPS=['sectionId','id','visibility','status','title','description','image','imageAlt'];
const FOTO=`${SUPABASE}/storage/v1/object/public/mitjans/${TENANT}/aplec.png`;

/* Les dades del poble a app_content, com les servix PostgREST a l'anònim. */
const DADES=()=>({
  feedPosts:[
    {id:'aplec-2026',title:'Aplec de tardor',entradilla:'La festa del poble',imageSrc:`sdp-media://mitjans/${TENANT}/aplec.png`,content:'<p>COS_SENCER</p>',author:'NO_EXPORTAR_AUTOR'},
    {id:'privada',title:'NO_EXPORTAR',visibility:'private'},
    {id:'esborrany',title:'NO_EXPORTAR',status:'draft'},
    {id:'arxivada',title:'NO_EXPORTAR',status:'arxivat'},
    {id:'signada',title:'Foto signada',post_subtitle:'Una URL temporal',image_url:`${SUPABASE}/storage/v1/object/sign/mitjans/x.jpg?token=abc`},
    {id:'forana',title:'Foto forana',description:'D’un altre servidor',image_url:'https://evil.example/x.jpg'},
    {id:'amb.punt',title:'NO_EXPORTAR'},
    {title:'NO_EXPORTAR sense id'},
    {id:'amb-secret',title:'Clau sb_secret_abcdefghijklmnopqrstuvwxyz'}
  ],
  marketItems:[{id:'samarreta-socdepoble',title:'Samarreta remota',subtitle:'De cotó',images:['/assets/mercat/01-chica-jersey.png'],seller:'NO_EXPORTAR_VENEDOR',price:20}],
  events:[{id:7,title:'Concert',subtitle:'A la plaça',image_url:'/assets/actes/concert.webp',status:'published'}]
});
// Fixtures de release: signada/forana no tenen foto; els casos bloquejats es proven a banda.
const DADES_RELEASE=()=>{const dades=DADES();for(const e of dades.feedPosts)if(['signada','forana'].includes(e.id))delete e.image_url;return dades;};
const json=(cos,{status=200,tipus='application/json; charset=utf-8'}={})=>new Response(typeof cos==='string'?cos:JSON.stringify(cos),{status,headers:{'content-type':tipus}});
/* El backend fals: comprova cada petició (columnes, filtre, límit, clau anon) i en guarda la traça. */
function backend(dades=DADES(),{falla=null}={}) {
  const crides=[];
  const fetchImpl=async (href,opcions={})=>{
    const url=new URL(href);crides.push({url,opcions});
    if(falla){const r=falla(url,crides.length);if(r)return typeof r==='function'?r():r;}
    assert.equal(url.origin,SUPABASE);assert.equal(url.pathname,'/rest/v1/app_content');
    assert.equal(url.searchParams.get('select'),'key,payload');assert.equal(url.searchParams.get('limit'),'1');
    assert.equal(url.searchParams.get('tenant_id'),`eq.${TENANT}`);
    assert.equal(opcions.headers.apikey,ANON);assert.equal(opcions.headers.Authorization,`Bearer ${ANON}`);
    assert.equal(opcions.redirect,'error');assert.ok(opcions.signal,'amb termini');
    const clau=url.searchParams.get('key').replace(/^eq\./,'');
    return json(Object.hasOwn(dades,clau)?[{key:clau,payload:dades[clau]}]:[]);
  };
  return {fetchImpl,crides};
}
const sensePausa=async ()=>{};
const projecta=(extra={})=>projeccioPublica({entorn:entornDelBuild(ENTORN),origin,pausa:sensePausa,...extra});
function carpeta(t,prefix='sdp-projeccio-') {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),prefix));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return fs.realpathSync(dir);
}
const sortida=()=>{let text='';return {write:s=>{text+=s;return true;},get text(){return text;}};};

test('entornDelBuild: la clau anon o publishable i un poble UUID; mai service_role ni sb_secret_',()=>{
  assert.deepEqual(entornDelBuild(ENTORN),{dataMode:'remote',supabaseUrl:SUPABASE,anonKey:ANON,tenantId:TENANT});
  assert.equal(entornDelBuild({...ENTORN,VITE_SUPABASE_ANON_KEY:'sb_publishable_abcdefghij',VITE_DATA_MODE:''}).dataMode,'remote');
  for(const [canvi,motiu] of [
    [{VITE_SUPABASE_ANON_KEY:jwt('service_role')},/anon o publishable/],
    [{VITE_SUPABASE_ANON_KEY:'sb_secret_abcdefghijklmnop'},/Format de clau/],
    [{VITE_SUPABASE_URL:''},/Falten VITE_SUPABASE_URL/],
    [{VITE_SUPABASE_URL:'https://exemple.supabase.co/rest/v1'},/origen HTTPS/],
    [{VITE_TENANT_ID:'la-torre'},/UUID/]
  ])assert.throws(()=>entornDelBuild({...ENTORN,...canvi}),motiu,JSON.stringify(canvi));
  // Un paquet de proves no pinta cap publicació remota: ni credencials calen.
  assert.deepEqual(entornDelBuild({VITE_DATA_MODE:'seed'}),{dataMode:'seed'});
});

test('les VITE_* del build: loadEnv de Vite sobre els .env del mode, i l’origen de Storage que n’ix',async t=>{
  const root=carpeta(t);
  fs.writeFileSync(path.join(root,'.env'),`VITE_TENANT_ID=${TENANT}\nNO_VITE=secret\n`);
  fs.writeFileSync(path.join(root,'.env.production.local'),`VITE_SUPABASE_URL=${SUPABASE}\nVITE_SUPABASE_ANON_KEY=${ANON}\n`);
  const env=await variablesDelBuild(root);
  assert.equal(env.NO_VITE,undefined,'només el prefix VITE_');
  assert.deepEqual(entornDelBuild(env),{dataMode:'remote',supabaseUrl:SUPABASE,anonKey:ANON,tenantId:TENANT});
  assert.deepEqual(await origensDImatge({root}),[SUPABASE]);
  assert.deepEqual(await origensDImatge({env:{VITE_SUPABASE_URL:'http://localhost:54321'}}),[]);
  assert.deepEqual(await origensDImatge({env:{}}),[]);
});

test('només el que és públic i publicat, amb els huit camps; les fotos privades o d’altri, cap',async ()=>{
  const {fetchImpl,crides}=backend();
  const {snapshot,rebut}=await projecta({fetchImpl});
  assert.equal(crides.length,3,'una petició per clau');
  assert.deepEqual(crides.map(c=>c.url.searchParams.get('key')).sort(),['eq.events','eq.feedPosts','eq.marketItems']);
  assert.deepEqual(snapshot.map(e=>`${e.sectionId}/${e.id}`),['events/7','mercat/samarreta-socdepoble','mur/aplec-2026','mur/forana','mur/signada']);
  for(const element of snapshot)assert.deepEqual(Object.keys(element),CAMPS);
  const per=Object.fromEntries(snapshot.map(e=>[e.id,e]));
  assert.deepEqual(per['aplec-2026'],{sectionId:'mur',id:'aplec-2026',visibility:'public',status:'published',title:'Aplec de tardor',
    description:'La festa del poble',image:FOTO,imageAlt:'Aplec de tardor'});
  assert.equal(per['samarreta-socdepoble'].image,origin+'/assets/mercat/01-chica-jersey.png');
  assert.equal(per['samarreta-socdepoble'].description,'De cotó');
  assert.equal(per['7'].image,origin+'/assets/actes/concert.webp');
  for(const id of ['signada','forana'])assert.deepEqual([per[id].image,per[id].imageAlt],[null,''],id);
  const serial=JSON.stringify(snapshot);
  assert.ok(!/NO_EXPORTAR|COS_SENCER|sb_secret|evil[.]example|object\/sign|token=/.test(serial),serial);
  assert.ok(!serial.includes(ANON));
  assert.deepEqual(rebut.seccions.mur,{llegides:9,publicades:3,privades:3,id:2,buides:0,secrets:1,duplicades:0,imatges:{triada:1,bloquejada:2,absent:0}});
  assert.equal(rebut.publicades,5);assert.match(rebut.sha256,/^[a-f0-9]{64}$/);
  assert.ok(!esPublicada({status:'pendent'})&&!esPublicada({visibility:'members'})&&!esPublicada([])&&esPublicada({status:'publicada'}));
});

/* Revisió adversarial (QA-H04) · Cada guarda amb la seua dada: un secret a la
   descripció, un status null, una foto d'un altre bucket del mateix Supabase
   (avatars, mitjans_privats) i dos ids que només canvien en majúscules. */
test('guardes: secret a la descripció, status null, altres buckets i ids repetits en majúscules',async t=>{
  const dades={feedPosts:[
    {id:'Aplec',title:'Aplec',entradilla:'La primera'},
    {id:'aplec',title:'NO_EXPORTAR repetida',entradilla:'La segona'},
    {id:'desc-secreta',title:'Títol net',entradilla:'Clau sb_secret_abcdefghijklmnopqrstuvwxyz'},
    {id:'status-null',title:'NO_EXPORTAR',entradilla:'Sense estat',status:null},
    {id:'avatar',title:'Avatar',entradilla:'Un altre bucket',image_url:`${SUPABASE}/storage/v1/object/public/avatars/u1.png`},
    {id:'privats',title:'Privats',entradilla:'El bucket privat',image_url:`${SUPABASE}/storage/v1/object/public/mitjans_privats/u1/dni.webp`}
  ],marketItems:[],events:[]};
  const {snapshot,rebut}=await projecta({fetchImpl:backend(dades).fetchImpl});
  assert.deepEqual(snapshot.map(e=>e.id),['Aplec','avatar','privats']);
  assert.deepEqual(snapshot.map(e=>e.image),[null,null,null],'cap bucket que no siga mitjans');
  assert.ok(!/NO_EXPORTAR|sb_secret|avatars|mitjans_privats/.test(JSON.stringify(snapshot)));
  assert.deepEqual(rebut.seccions.mur,{llegides:6,publicades:3,privades:1,id:0,buides:0,secrets:1,duplicades:1,imatges:{triada:0,bloquejada:2,absent:1}});
  assert.ok(!esPublicada({status:null})&&!esPublicada({status:''}));
  // La CLI ho avisa: una dada repetida no atura la release, però no passa en silenci.
  const dir=carpeta(t);const r={stdout:sortida(),stderr:sortida()};
  const dadesCLI={...dades,feedPosts:dades.feedPosts.map(e=>{const copia={...e};delete copia.image_url;return copia;})};
  assert.equal(await main(['--root',dir,'--out',path.join(dir,'snapshot.json')],{env:{},entorn:entornDelBuild(ENTORN),fetchImpl:backend(dadesCLI).fetchImpl,pausa:sensePausa,...r}),0);
  assert.match(r.stderr.text,/AVÍS · projecció pública: mur, 1 id repetits si no es miren les majúscules/);
});

test('política de fallada: xarxa, HTTP, JSON i mida rebutgen; un 503 o la xarxa es reintenten una vegada',async ()=>{
  const xarxa=backend(DADES(),{falla:()=>()=>Promise.reject(new TypeError('fetch failed'))});
  await assert.rejects(projecta({fetchImpl:xarxa.fetchImpl}),/fetch failed/);
  assert.equal(xarxa.crides.length,2,'un reintent i prou');
  const clauDolenta=backend(DADES(),{falla:()=>json({message:'Invalid API key'},{status:401})});
  await assert.rejects(projecta({fetchImpl:clauDolenta.fetchImpl}),/HTTP 401/);
  assert.equal(clauDolenta.crides.length,1,'un 401 no es reintenta');
  const transitori=backend(DADES(),{falla:(url,n)=>n===1?json('',{status:503}):null});
  assert.equal((await projecta({fetchImpl:transitori.fetchImpl})).snapshot.length,5);
  for(const [falla,motiu] of [
    [()=>json('<html>',{tipus:'text/html'}),/sense JSON/],
    [()=>json('[{"key":"feedPosts"',{}),/JSON/],
    [()=>json([{key:'altra',payload:[]}]),/format inesperat/],
    [()=>json([{key:'feedPosts',payload:[]},{key:'feedPosts',payload:[]}]),/format inesperat/]
  ])await assert.rejects(projecta({fetchImpl:backend(DADES(),{falla}).fetchImpl}),motiu);
  await assert.rejects(projecta({fetchImpl:backend().fetchImpl,maxResposta:64}),/massa gran/);
  // Més de 10.000 elements en una clau: es refusa abans de projectar-ne cap.
  await assert.rejects(projecta({fetchImpl:backend({...DADES(),events:Array.from({length:10001},(_,i)=>({id:`e${i}`}))}).fetchImpl}),/events: 10001 elements \(el sostre és 10000\)/);
  // Un payload que no és una llista es pren buit, com el client (llistaDe).
  const {rebut}=await projecta({fetchImpl:backend({...DADES(),events:{no:'llista'}}).fetchImpl});
  assert.equal(rebut.seccions.events.avis,'el payload no és una llista: buida');
});

test('sostre de 8 MiB: el snapshot que el passa es refusa, ací i a llegixSnapshot',async t=>{
  await assert.rejects(projecta({fetchImpl:backend().fetchImpl,maxSnapshot:200}),/Snapshot públic massa gran/);
  const dir=carpeta(t);const gros=path.join(dir,'gros.json');
  fs.writeFileSync(gros,'[]');fs.truncateSync(gros,MAX_SNAPSHOT+1);
  assert.throws(()=>llegixSnapshot(gros),/8MiB/);
  assert.equal(MAX_SNAPSHOT,8*1024*1024);
});

test('la CLI: escriu el snapshot fora de dist/; si falla, cap fitxer (ni el vell) i ix amb 1; la clau no ix mai',async t=>{
  const root=carpeta(t);const out=path.join(root,'node_modules/.cache/sdp-social/snapshot.json');
  const entorn=entornDelBuild(ENTORN);
  const bo={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl:backend(DADES_RELEASE()).fetchImpl,pausa:sensePausa,...bo}),0,bo.stderr.text);
  const escrit=llegixSnapshot(out);
  assert.equal(escrit.length,5);assert.equal(JSON.parse(bo.stdout.text).publicades,5);
  assert.ok(!bo.stdout.text.includes(ANON)&&!bo.stdout.text.includes(SUPABASE),'el rebut no porta ni la clau ni l’URL');
  const mal={stdout:sortida(),stderr:sortida()};
  const fetchImpl=async ()=>{throw new Error(`connexió tallada amb apikey=${ANON}`);};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl,pausa:sensePausa,...mal}),1);
  assert.equal(fs.existsSync(out),false,'el snapshot vell no sobreviu');
  const error=JSON.parse(mal.stderr.text.trim());
  assert.equal(error.valid,false);assert.match(error.error,/\[clau\]/);assert.match(error.ajuda,new RegExp(ESCAPADA));
  assert.ok(!mal.stderr.text.includes(ANON));
  // Sense backend configurat, també ix amb 1 (cap snapshot buit en silenci).
  const sense={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn:null,...sense}),1);
  assert.match(sense.stderr.text,/Falten VITE_SUPABASE_URL/);
  for(const dolent of [path.join(root,'dist','snapshot.json'),path.join(root,'public','snapshot.json'),path.join(root,'snapshot.txt')]) {
    const r={stdout:sortida(),stderr:sortida()};
    assert.equal(await main(['--root',root,'--out',dolent],{env:{},entorn,fetchImpl:backend(DADES_RELEASE()).fetchImpl,...r}),1,dolent);
    assert.equal(fs.existsSync(dolent),false);
  }
});

test(`la CLI amb ${ESCAPADA}=1: cap petició, [] i un avís ben alt; en mode seed, [] sense credencials`,async t=>{
  const root=carpeta(t);const out=path.join(root,'cache','snapshot.json');
  const {fetchImpl,crides}=backend(DADES_RELEASE());
  const r={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{[ESCAPADA]:'1'},fetchImpl,...r}),0);
  assert.deepEqual(llegixSnapshot(out),[]);assert.equal(crides.length,0);
  assert.match(r.stderr.text,/AVÍS · SDP_SOCIAL_SENSE_REMOT=1: este build NO porta cap publicació remota/);
  assert.equal(JSON.parse(r.stdout.text).senseRemot,true);
  const seed={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn:entornDelBuild({VITE_DATA_MODE:'seed'}),fetchImpl,...seed}),0);
  assert.deepEqual(llegixSnapshot(out),[]);assert.equal(crides.length,0);assert.match(seed.stderr.text,/mode seed/);
});

/* Revisió adversarial (QA-H04) · El snapshot vell ja no hi és quan ix la primera
   petició (un procés mort a mitja lectura no el deixa viu); l'escapada és
   només «1»; i un --out que, amb els enllaços resolts, cau dins de dist/ es refusa. */
test('la CLI: el vell s’esborra abans de llegir; l’escapada només és «1»; un --out enllaçat cap a dist/, 1',async t=>{
  const root=carpeta(t);const out=path.join(root,'cache','snapshot.json');
  const entorn=entornDelBuild(ENTORN);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,'[{"vell":true}]');
  const {fetchImpl,crides}=backend(DADES_RELEASE());const vist=[];
  const mirant=async (href,opcions)=>{vist.push(fs.existsSync(out));return fetchImpl(href,opcions);};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl:mirant,pausa:sensePausa,stdout:sortida(),stderr:sortida()}),0);
  assert.deepEqual(vist,[false,false,false],'cap petició amb el snapshot vell al disc');
  for(const valor of ['0','true',' 1']) {
    const b=backend(DADES_RELEASE());
    assert.equal(await main(['--root',root,'--out',out],{env:{[ESCAPADA]:valor},entorn,fetchImpl:b.fetchImpl,pausa:sensePausa,stdout:sortida(),stderr:sortida()}),0,valor);
    assert.equal(b.crides.length,3,`${ESCAPADA}=${JSON.stringify(valor)} no és l’escapada`);
    assert.equal(llegixSnapshot(out).length,5,valor);
  }
  assert.equal(crides.length,3);
  // node_modules/.cache/sdp-social → dist: el camí escrit no diu dist/, però hi cau.
  fs.mkdirSync(path.join(root,'dist'));fs.mkdirSync(path.join(root,'node_modules','.cache'),{recursive:true});
  fs.symlinkSync(path.join(root,'dist'),path.join(root,'node_modules','.cache','sdp-social'));
  const enllacat=path.join(root,'node_modules','.cache','sdp-social','snapshot.json');
  for(const env of [{[ESCAPADA]:'1'},{}]) {
    const r={stdout:sortida(),stderr:sortida()};
    assert.equal(await main(['--root',root,'--out',enllacat],{env,entorn,fetchImpl:backend(DADES_RELEASE()).fetchImpl,pausa:sensePausa,...r}),1,JSON.stringify(env));
    assert.match(r.stderr.text,/dins de dist/);
    assert.deepEqual(fs.readdirSync(path.join(root,'dist')),[]);
  }
});

/* La cadena de build:social sobre un dist/ temporal: la projecció, el fitxer
   i el prerender amb --snapshot, la primera foto remota verificada i, en el
   build següent (un dist/ net), la retirada d'una publicació revocada. */
const png=(w,h)=>{const b=Buffer.alloc(33);Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b);b.writeUInt32BE(13,8);b.write('IHDR',12,'latin1');b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;};
const SHELL=`<!doctype html><html lang="ca"><head><meta charset="UTF-8"><meta name="description" content="Portal">
<meta property="og:title" content="Sóc de Poble"><meta property="og:site_name" content="Sóc de Poble">
<title>Sóc de Poble</title><script type="module" crossorigin src="/assets/index-AbCdEf12.js"></script></head><body><div id="root"></div></body></html>`;
function lloc(t) {
  const root=carpeta(t,'sdp-projeccio-lloc-');
  const put=(rel,valor)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,valor);};
  put('package.json','{"type":"module"}');
  put('firebase.json',JSON.stringify({hosting:{public:'dist',trailingSlash:false}}));
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'El Projecte',lead:'Una xarxa de pobles'}};`);
  put('src/config/systemPages.js',`export const SYSTEM_PAGES=[{key:'projecte',href:'/projecte'}];`);
  for(const dir of ['public','dist'])put(`${dir}/assets/system/ui/og-socdepoble-1200x630.png`,png(1200,630));
  put('dist/index.html',SHELL);
  return {root,dist:path.join(root,'dist'),put};
}
const imatges=(bytes=png(1200,630),tipus='image/png')=>{
  const crides=[];
  return {crides,fetchImpl:async (href,opcions)=>{crides.push({href,opcions});return new Response(bytes,{status:200,headers:{'content-type':tipus}});}};
};
const llig=(dist,rel)=>new JSDOM(fs.readFileSync(path.join(dist,rel),'utf8')).window.document;
const prop=(d,nom)=>d.querySelector(`meta[property="${nom}"]`)?.content??null;

test('cadena de release: la publicació remota té la seua pàgina i la seua primera foto; la revocada desapareix en el build següent',async t=>{
  const cache=carpeta(t);const out=path.join(cache,'snapshot.json');
  const entorn=entornDelBuild(ENTORN);
  const r={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',cache,'--out',out],{env:{},entorn,fetchImpl:backend(DADES_RELEASE()).fetchImpl,pausa:sensePausa,...r}),0,r.stderr.text);
  const primer=lloc(t);const fotos=imatges();
  const rebut=await prerenderSocial({root:primer.root,dist:'dist',origin,policyRoot:projectRoot,JSDOM,publicSnapshot:llegixSnapshot(out),imageOrigins:[SUPABASE],fetchImpl:fotos.fetchImpl});
  assert.ok(rebut.routesWritten.includes('/mur/aplec-2026'),rebut.routesWritten.join(' '));
  assert.deepEqual(rebut.remoteImages,[FOTO]);
  assert.deepEqual(fotos.crides.map(c=>[c.href,c.opcions.redirect,c.opcions.method]),[[FOTO,'error','GET']]);
  const aplec=llig(primer.dist,'mur/aplec-2026/index.html');
  assert.equal(aplec.title,'Aplec de tardor | Sóc de Poble');
  assert.deepEqual(['og:image','og:image:type','og:image:width','og:image:height','og:image:alt'].map(n=>prop(aplec,n)),[FOTO,'image/png','1200','630','Aplec de tardor']);
  assert.equal(aplec.querySelector('meta[name="twitter:image"]').content,FOTO);
  // La signada i la forana: la targeta genèrica, i cap petició per a elles.
  for(const id of ['signada','forana'])assert.equal(prop(llig(primer.dist,`mur/${id}/index.html`),'og:image'),origin+'/assets/system/ui/og-socdepoble-1200x630.png',id);
  for(const id of ['privada','esborrany','arxivada','amb-secret'])assert.equal(fs.existsSync(path.join(primer.dist,'mur',id)),false,id);
  // Revocada al servidor (feta privada): la projecció següent no la porta, i el dist/ net del build següent tampoc.
  const dades=DADES_RELEASE();dades.feedPosts[0]={...dades.feedPosts[0],visibility:'private'};
  assert.equal(await main(['--root',cache,'--out',out],{env:{},entorn,fetchImpl:backend(dades).fetchImpl,pausa:sensePausa,stdout:sortida(),stderr:sortida()}),0);
  assert.ok(!llegixSnapshot(out).some(e=>e.id==='aplec-2026'));
  const segon=lloc(t);
  const rebut2=await prerenderSocial({root:segon.root,dist:'dist',origin,policyRoot:projectRoot,JSDOM,publicSnapshot:llegixSnapshot(out),imageOrigins:[SUPABASE],fetchImpl:imatges().fetchImpl});
  assert.ok(!rebut2.routesWritten.includes('/mur/aplec-2026'));
  assert.equal(fs.existsSync(path.join(segon.dist,'mur','aplec-2026')),false);
});

/* La comanda de release tal com la diu package.json, per les CLI de veres i
   sense xarxa: la projecció escriu el fitxer que el prerender llig amb
   --snapshot, fora de dist/. Amb SDP_SOCIAL_SENSE_REMOT=1 la cadena acaba en
   verd (i ho avisa); sense backend ni escapada, la projecció ix amb 1 i
   esborra el snapshot vell, i un prerender sense el fitxer tampoc no passa. */
async function distReal(t) {
  const dist=carpeta(t,'sdp-projeccio-dist-');
  const {manifest}=await buildSocialManifest({root:projectRoot,origin,estricte:true});
  for(const entrada of Object.values(manifest.routes)) {
    const rel=decodeURIComponent(new URL(entrada.image.url).pathname);
    if(fs.existsSync(path.join(dist,rel)))continue;
    fs.mkdirSync(path.dirname(path.join(dist,rel)),{recursive:true});fs.copyFileSync(path.join(projectRoot,'public',rel),path.join(dist,rel));
  }
  fs.writeFileSync(path.join(dist,'index.html'),fs.readFileSync(path.join(projectRoot,'index.html')));
  return dist;
}
/* Els passos de scripts['build:social'] de package.json, cada un com a [node, script, ...args]. */
const passosDeBuildSocial=()=>JSON.parse(fs.readFileSync(path.join(projectRoot,'package.json'),'utf8')).scripts['build:social']
  .split(' && ').map(pas=>pas.trim().split(/\s+/));
/* Els arguments d'un pas amb els valors de `valors` (--root, --out…) i l'script del projecte. */
const canvia=(pas,valors)=>pas.slice(1).map((arg,i,args)=>(i>0&&Object.hasOwn(valors,args[i-1])?valors[args[i-1]]:arg)).map(arg=>arg.startsWith('tooling/')?path.join(projectRoot,arg):arg);
/* L'entorn del procés sense cap VITE_* ni l'escapada. */
const entornNet=()=>Object.fromEntries(Object.entries(process.env).filter(([clau])=>!clau.startsWith('VITE_')&&clau!==ESCAPADA));
test('build:social de package.json: projecció i prerender amb el mateix --snapshot; la fallada atura la cadena',async t=>{
  const passos=passosDeBuildSocial();
  assert.equal(passos.length,2,passos.join(' && '));
  const [projeccio,prerender]=passos;
  assert.deepEqual([projeccio.slice(0,2),prerender.slice(0,2)],[['node','tooling/seo/projeccio-publica.mjs'],['node','tooling/seo/prerender-social.mjs']]);
  const valor=(pas,clau)=>pas[pas.indexOf(clau)+1];
  const out=valor(projeccio,'--out');
  assert.equal(valor(prerender,'--snapshot'),out);assert.equal(valor(projeccio,'--origin'),valor(prerender,'--origin'));
  assert.ok(out.endsWith('.json')&&!/^(?:\.\/)?(?:dist|public)\//.test(out),out);
  // Les CLI de veres, amb els arguments de package.json i els camins temporals; cap VITE_* del procés.
  const cache=carpeta(t);const fitxer=path.join(cache,'snapshot.json');const dist=await distReal(t);
  const entorn=entornNet();
  const executa=(pas,valors,env)=>spawnSync(process.execPath,canvia(pas,valors),{encoding:'utf8',env,cwd:cache});
  const primer=executa(projeccio,{'--root':projectRoot,'--out':fitxer},{...entorn,[ESCAPADA]:'1'});
  assert.equal(primer.status,0,primer.stderr);assert.match(primer.stderr,/AVÍS · SDP_SOCIAL_SENSE_REMOT=1/);
  assert.deepEqual(llegixSnapshot(fitxer),[]);
  const segon=executa(prerender,{'--root':projectRoot,'--dist':dist,'--snapshot':fitxer},entorn);
  assert.equal(segon.status,0,segon.stderr);
  const rebut=JSON.parse(segon.stdout);
  assert.ok(rebut.valid&&rebut.routesWritten.includes('/mercat/samarreta-socdepoble'));assert.deepEqual(rebut.remoteImages,[]);
  // Sense backend ni escapada: 1, el snapshot vell esborrat i cap prerender amb un fitxer absent.
  const buit=carpeta(t);fs.writeFileSync(fitxer,'[{"vell":true}]');
  const falla=executa(projeccio,{'--root':buit,'--out':fitxer},entorn);
  assert.equal(falla.status,1,falla.stdout);assert.equal(JSON.parse(falla.stderr.trim()).valid,false);
  assert.equal(fs.existsSync(fitxer),false);
  const sense=executa(prerender,{'--root':projectRoot,'--dist':await distReal(t),'--snapshot':fitxer},entorn);
  assert.equal(sense.status,1);assert.equal(JSON.parse(sense.stderr.trim()).valid,false);
});

/* Revisió adversarial (QA-H04, major) · La release de veres amb una projecció
   que no és buida: els passos de build:social per les CLI, amb les VITE_* al
   procés i un fetch fals precarregat (--import) que falla davant de qualsevol
   host o camí que no espera. La foto del bucket públic ha d'arribar a og:image
   per l'origen que la CLI del prerender trau de VITE_SUPABASE_URL. */
test('build:social de veres amb dades remotes: la primera foto de Storage arriba a og:image; la privada, cap pàgina',async t=>{
  const tmp=carpeta(t,'sdp-projeccio-real-');
  const log=path.join(tmp,'peticions.log');const mock=path.join(tmp,'fetch-fals.mjs');
  const dades={feedPosts:[
    {id:'aplec-2026',title:'Aplec de tardor',entradilla:'La festa del poble',imageSrc:`sdp-media://mitjans/${TENANT}/aplec.png`},
    {id:'privada',title:'NO_EXPORTAR',visibility:'private',image_url:FOTO},
    {id:'avatar',title:'Sense foto',entradilla:'Absència real de foto'}
  ],marketItems:[],events:[]};
  fs.writeFileSync(mock,`import fs from 'node:fs';
const dades=${JSON.stringify(dades)};
const foto=Buffer.from('${png(1200,630).toString('base64')}','base64');
globalThis.fetch=async (href,opcions={})=>{
  const url=new URL(href);fs.appendFileSync(${JSON.stringify(log)},url.origin+url.pathname+'\\n');
  if(url.origin===${JSON.stringify(SUPABASE)}&&url.pathname==='/rest/v1/app_content'){
    if(opcions.headers?.apikey!==${JSON.stringify(ANON)})throw new TypeError('fetch fals: sense la clau anon');
    const clau=url.searchParams.get('key').replace(/^eq[.]/,'');
    return new Response(JSON.stringify(Object.hasOwn(dades,clau)?[{key:clau,payload:dades[clau]}]:[]),{headers:{'content-type':'application/json'}});
  }
  if(url.href===${JSON.stringify(FOTO)})return new Response(foto,{headers:{'content-type':'image/png'}});
  throw new TypeError('fetch fals: no previst '+url.origin+url.pathname);
};
`);
  const [projeccio,prerender]=passosDeBuildSocial();
  const fitxer=path.join(tmp,'snapshot.json');const dist=await distReal(t);
  const env={...entornNet(),VITE_SUPABASE_URL:SUPABASE,VITE_SUPABASE_ANON_KEY:ANON,VITE_TENANT_ID:TENANT,VITE_DATA_MODE:'remote'};
  const executa=(pas,valors)=>spawnSync(process.execPath,['--import',pathToFileURL(mock).href,...canvia(pas,valors)],{encoding:'utf8',env,cwd:tmp});
  // La projecció, amb --root una carpeta sense .env: només les VITE_* del procés.
  const primer=executa(projeccio,{'--root':tmp,'--out':fitxer});
  assert.equal(primer.status,0,primer.stderr);
  assert.deepEqual(llegixSnapshot(fitxer).map(e=>[e.id,e.image]),[['aplec-2026',FOTO],['avatar',null]]);
  const segon=executa(prerender,{'--root':projectRoot,'--dist':dist,'--snapshot':fitxer});
  assert.equal(segon.status,0,segon.stderr);
  const rebut=JSON.parse(segon.stdout);
  assert.deepEqual(rebut.remoteImages,[FOTO]);assert.deepEqual(rebut.warnings.filter(w=>w.includes('supabase')),[]);
  const aplec=llig(dist,'mur/aplec-2026/index.html');
  assert.deepEqual(['og:image','og:image:type','og:image:width','og:image:height'].map(n=>prop(aplec,n)),[FOTO,'image/png','1200','630']);
  assert.equal(prop(llig(dist,'mur/avatar/index.html'),'og:image'),origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  assert.equal(fs.existsSync(path.join(dist,'mur','privada')),false);
  // Tres lectures d'app_content i un sol GET, el de la foto pública: cap a avatars.
  const peticions=fs.readFileSync(log,'utf8').trim().split('\n');
  assert.deepEqual(peticions.sort(),[...Array(3).fill(`${SUPABASE}/rest/v1/app_content`),FOTO].sort());
});


test('porta de release: una primera foto bloquejada refusa el snapshot; no passa al logotip', async t=>{
  for(const image_url of [`${SUPABASE}/storage/v1/object/sign/mitjans/foto.png?token=NO_EXPORTAR_TOKEN`, `${SUPABASE}/storage/v1/object/public/avatars/a.png`, 'https://evil.example/foto.png']) {
    const root=carpeta(t); const out=path.join(root,'snapshot.json');
    fs.writeFileSync(out,'[{"vell":true}]');
    const r={stdout:sortida(),stderr:sortida()};
    const dades={feedPosts:[{id:'foto',title:'Foto primera',image_url}],marketItems:[],events:[]};
    assert.equal(await main(['--root',root,'--out',out],{env:{},entorn:entornDelBuild(ENTORN),fetchImpl:backend(dades).fetchImpl,pausa:sensePausa,...r}),1);
    assert.equal(fs.existsSync(out),false);
    assert.match(r.stderr.text,/primera imatge bloquejada/);
    assert.ok(!r.stderr.text.includes('NO_EXPORTAR_TOKEN')&&!r.stderr.text.includes(image_url));
  }
});


test('cada petició de projecció té el termini contractual de cinc segons',async t=>{
  const terminis=[];
  t.mock.method(AbortSignal,'timeout',ms=>{terminis.push(ms);return new AbortController().signal;});
  await projecta({fetchImpl:backend().fetchImpl});
  assert.deepEqual(terminis,[5000,5000,5000]);
});
