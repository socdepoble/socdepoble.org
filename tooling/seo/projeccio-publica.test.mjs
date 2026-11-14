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
import {ESCAPADA, entornDelBuild, esPublicada, main, NOM_DEL_REBUT_DE_PROJECCIO, origensDImatge, projeccioPublica, variablesDelBuild} from './projeccio-publica.mjs';
import {COLUMNES_DIRECTORI, ESCAPADA_DIRECTORI_BUIT, INTERRUPTOR_MUR} from './fonts-veinals.mjs';
import {detectaConvertidor, pngDeProva} from './jpeg-social.mjs';
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
/* P0-SEO-UNIVERSAL (13-11-2026) · Les fitxes del directori porten deu camps; una publicació veïnal del Mur, nou. */
const CAMPS_DE_PERFIL=['sectionId','id','slug','tipus','visibility','status','title','description','image','imageAlt'];
const CAMPS_VEINALS=[...CAMPS,'origen'];
const FORN=Object.freeze({id:'c0c1d2e3-f405-4a16-8b27-c38d49e5a6f7',slug:'forn-de-la-torre',name:'Forn de la Torre',kind:'company',lema:'Pa de llenya cada dia',description:null,logo_url:null,hero_url:null});
const esPerfil=e=>e.sectionId==='perfil';
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
    {id:'amb-secret',title:"Clau sb_" + "secret_abcdefghijklmnopqrstuvwxyz"}
  ],
  marketItems:[{id:'samarreta-socdepoble',title:'Samarreta remota',subtitle:'De cotó',images:['/assets/mercat/01-chica-jersey.png'],seller:'NO_EXPORTAR_VENEDOR',price:20}],
  events:[{id:7,title:'Concert',subtitle:'A la plaça',image_url:'/assets/actes/concert.webp',status:'published'}]
});
// Fixtures de release: signada/forana no tenen foto; els casos bloquejats es proven a banda.
const DADES_RELEASE=()=>{const dades=DADES();for(const e of dades.feedPosts)if(['signada','forana'].includes(e.id))delete e.image_url;return dades;};
const json=(cos,{status=200,tipus='application/json; charset=utf-8'}={})=>new Response(typeof cos==='string'?cos:JSON.stringify(cos),{status,headers:{'content-type':tipus}});
/* El backend fals: comprova cada petició (columnes, filtre, límit, clau anon) i en guarda la traça.
   P0-SEO-UNIVERSAL (13-11-2026) · També respon al directori públic (organization_directory, amb les huit
   columnes explícites, la població, l'ordre per antiguitat i la paginació) i a la RPC del Mur públic, per GET. */
function backend(dades=DADES(),{falla=null,directori=[FORN],mur=[]}={}) {
  const crides=[];
  const fetchImpl=async (href,opcions={})=>{
    const url=new URL(href);crides.push({url,opcions});
    if(falla){const r=falla(url,crides.length);if(r)return typeof r==='function'?r():r;}
    assert.equal(url.origin,SUPABASE);
    assert.equal(opcions.method,'GET');assert.equal(opcions.body,undefined,'mai un cos: només lectures');
    assert.equal(opcions.headers.apikey,ANON);assert.equal(opcions.headers.Authorization,`Bearer ${ANON}`);
    assert.equal(opcions.redirect,'error');assert.ok(opcions.signal,'amb termini');
    if(url.pathname==='/rest/v1/organization_directory') {
      assert.equal(url.searchParams.get('select'),COLUMNES_DIRECTORI.join(','));
      assert.ok(!/\*|correu|presentacio|town_name|tenant_id,|created_at,/.test(url.searchParams.get('select')),'mai select=* ni columnes de més');
      assert.equal(url.searchParams.get('tenant_id'),`eq.${TENANT}`);assert.equal(url.searchParams.get('order'),'created_at.asc,id.asc');
      const limit=Number(url.searchParams.get('limit')),offset=Number(url.searchParams.get('offset'));
      assert.ok(Number.isInteger(limit)&&limit>=1&&limit<=100&&Number.isInteger(offset)&&offset>=0);
      return json(directori.slice(offset,offset+limit));
    }
    if(url.pathname==='/rest/v1/rpc/llig_mur_public') {
      assert.equal(url.searchParams.get('p_tenant_id'),TENANT);assert.equal(url.searchParams.get('p_limit'),'200');
      const [abans,id]=[url.searchParams.get('p_before_created_at'),url.searchParams.get('p_before_id')];
      assert.equal(abans===null,id===null,'el cursor porta els dos camps o cap');
      const inici=abans===null?0:mur.findIndex(f=>f.created_at===abans&&f.id===id)+1;
      assert.ok(abans===null||inici>0,'el cursor és una fila servida');
      return json(mur.slice(inici,inici+200));
    }
    assert.equal(url.pathname,'/rest/v1/app_content');
    assert.equal(url.searchParams.get('select'),'key,payload');assert.equal(url.searchParams.get('limit'),'1');
    assert.equal(url.searchParams.get('tenant_id'),`eq.${TENANT}`);
    const clau=url.searchParams.get('key').replace(/^eq\./,'');
    return json(Object.hasOwn(dades,clau)?[{key:clau,payload:dades[clau]}]:[]);
  };
  return {fetchImpl,crides};
}
const lesDe=(crides,cami)=>crides.filter(c=>c.url.pathname===cami);
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
  /* P0-SEO-UNIVERSAL (13-11-2026) · Expectativa actualitzada a posta: una petició per clau d'app_content i una al
     directori públic (abans, tres); cap a la RPC del Mur sense el seu interruptor. */
  assert.equal(crides.length,4,'una petició per clau i una al directori');
  assert.deepEqual(lesDe(crides,'/rest/v1/app_content').map(c=>c.url.searchParams.get('key')).sort(),['eq.events','eq.feedPosts','eq.marketItems']);
  assert.equal(lesDe(crides,'/rest/v1/organization_directory').length,1);assert.equal(lesDe(crides,'/rest/v1/rpc/llig_mur_public').length,0);
  assert.deepEqual(snapshot.map(e=>`${e.sectionId}/${e.id}`),['events/7','mercat/samarreta-socdepoble','mur/aplec-2026','mur/forana','mur/signada',`perfil/${FORN.id}`]);
  for(const element of snapshot)assert.deepEqual(Object.keys(element),esPerfil(element)?CAMPS_DE_PERFIL:CAMPS);
  assert.deepEqual(snapshot.at(-1),{sectionId:'perfil',id:FORN.id,slug:'forn-de-la-torre',tipus:'entitat',visibility:'public',status:'published',
    title:'Forn de la Torre',description:'Pa de llenya cada dia',image:null,imageAlt:''});
  assert.equal(rebut.murVeinal,'apagat');
  assert.deepEqual([rebut.directori.llegides,rebut.directori.publicades,rebut.directori.tallat],[1,1,false]);
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
  assert.equal(rebut.publicades,6);assert.match(rebut.sha256,/^[a-f0-9]{64}$/);
  assert.ok(!esPublicada({status:'pendent'})&&!esPublicada({visibility:'members'})&&!esPublicada([])&&esPublicada({status:'publicada'}));
});

/* Revisió adversarial (QA-H04) · Cada guarda amb la seua dada: un secret a la
   descripció, un status null, una foto d'un altre bucket del mateix Supabase
   (avatars, mitjans_privats) i dos ids que només canvien en majúscules. */
test('guardes: secret a la descripció, status null, altres buckets i ids repetits en majúscules',async t=>{
  const dades={feedPosts:[
    {id:'Aplec',title:'Aplec',entradilla:'La primera'},
    {id:'aplec',title:'NO_EXPORTAR repetida',entradilla:'La segona'},
    {id:'desc-secreta',title:'Títol net',entradilla:"Clau sb_" + "secret_abcdefghijklmnopqrstuvwxyz"},
    {id:'status-null',title:'NO_EXPORTAR',entradilla:'Sense estat',status:null},
    {id:'avatar',title:'Avatar',entradilla:'Un altre bucket',image_url:`${SUPABASE}/storage/v1/object/public/avatars/u1.png`},
    {id:'privats',title:'Privats',entradilla:'El bucket privat',image_url:`${SUPABASE}/storage/v1/object/public/mitjans_privats/u1/dni.webp`}
  ],marketItems:[],events:[]};
  const {snapshot:sencer,rebut}=await projecta({fetchImpl:backend(dades).fetchImpl});
  const snapshot=sencer.filter(e=>!esPerfil(e));
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
  assert.equal((await projecta({fetchImpl:transitori.fetchImpl})).snapshot.length,6);
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
  assert.equal(escrit.length,6);assert.equal(JSON.parse(bo.stdout.text).publicades,6);
  // P0-SEO-UNIVERSAL · El rebut de la projecció, en fitxer al costat del snapshot (el prerender l'afig al seu).
  const rebutFitxer=path.join(path.dirname(out),NOM_DEL_REBUT_DE_PROJECCIO);
  assert.deepEqual(JSON.parse(fs.readFileSync(rebutFitxer,'utf8')).directori.exclosos,{forma:0,secrets:0,contacteAlNom:0,suplantacio:0,buida:0});
  assert.ok(!fs.readFileSync(rebutFitxer,'utf8').includes(ANON)&&!fs.readFileSync(rebutFitxer,'utf8').includes(SUPABASE));
  assert.ok(!bo.stdout.text.includes(ANON)&&!bo.stdout.text.includes(SUPABASE),'el rebut no porta ni la clau ni l’URL');
  const mal={stdout:sortida(),stderr:sortida()};
  const fetchImpl=async ()=>{throw new Error(`connexió tallada amb apikey=${ANON}`);};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl,pausa:sensePausa,...mal}),1);
  assert.equal(fs.existsSync(out),false,'el snapshot vell no sobreviu');
  assert.equal(fs.existsSync(rebutFitxer),false,'el rebut vell tampoc');
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
  assert.deepEqual(vist,[false,false,false,false],'cap petició amb el snapshot vell al disc');
  for(const valor of ['0','true',' 1']) {
    const b=backend(DADES_RELEASE());
    assert.equal(await main(['--root',root,'--out',out],{env:{[ESCAPADA]:valor},entorn,fetchImpl:b.fetchImpl,pausa:sensePausa,stdout:sortida(),stderr:sortida()}),0,valor);
    assert.equal(b.crides.length,4,`${ESCAPADA}=${JSON.stringify(valor)} no és l’escapada`);
    assert.equal(llegixSnapshot(out).length,6,valor);
  }
  assert.equal(crides.length,4);
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
/* P0-SEO-UNIVERSAL · El convertidor fals de la cadena (el de veres, Pillow aïllat, té la seua prova a jpeg-social.test.mjs):
   un JPEG baseline mínim de 1200x630 amb els segments bàsics. */
const jpegBaseline=cos=>Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10]),Buffer.alloc(14),Buffer.from([0xff,0xdb,0x00,0x03,0x00]),
  Buffer.from([0xff,0xc0,0x00,0x11,0x08,630>>8,630&255,1200>>8,1200&255,0x03]),Buffer.alloc(9),Buffer.from([0xff,0xc4,0x00,0x03,0x00,0xff,0xda,0x00,0x03,0x00]),cos,Buffer.from([0xff,0xd9])]);
const convertidor={convertix:async bytes=>jpegBaseline(Buffer.from(`fals:${bytes.length}`,'latin1'))};
const OG=/^https:\/\/socdepoble\.org\/assets\/og\/[a-f0-9]{24}\.jpg$/;
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
  const rebut=await prerenderSocial({root:primer.root,dist:'dist',origin,policyRoot:projectRoot,JSDOM,publicSnapshot:llegixSnapshot(out),imageOrigins:[SUPABASE],fetchImpl:fotos.fetchImpl,convertidor});
  assert.ok(rebut.routesWritten.includes('/mur/aplec-2026'),rebut.routesWritten.join(' '));
  /* P0-SEO-UNIVERSAL (13-11-2026) · Expectativa actualitzada a posta: la foto remota ja no va al <head> amb la URL de
     Storage; es materialitza a dist/assets/og en JPEG de 1200x630 i el head porta la del propi origen. */
  assert.equal(rebut.remoteImages.length,1);assert.match(rebut.remoteImages[0],OG);
  assert.deepEqual(fotos.crides.map(c=>[c.href,c.opcions.redirect,c.opcions.method]),[[FOTO,'error','GET']]);
  const aplec=llig(primer.dist,'mur/aplec-2026/index.html');
  assert.equal(aplec.title,'Aplec de tardor | Sóc de Poble');
  assert.deepEqual(['og:image','og:image:type','og:image:width','og:image:height','og:image:alt'].map(n=>prop(aplec,n)),[rebut.remoteImages[0],'image/jpeg','1200','630','Aplec de tardor']);
  assert.equal(aplec.querySelector('meta[name="twitter:image"]').content,rebut.remoteImages[0]);
  assert.ok(fs.existsSync(path.join(primer.dist,new URL(rebut.remoteImages[0]).pathname)));
  assert.ok(!fs.readFileSync(path.join(primer.dist,'mur/aplec-2026/index.html'),'utf8').includes(SUPABASE));
  // La signada i la forana: la targeta genèrica, i cap petició per a elles.
  for(const id of ['signada','forana'])assert.equal(prop(llig(primer.dist,`mur/${id}/index.html`),'og:image'),origin+'/assets/system/ui/og-socdepoble-1200x630.png',id);
  for(const id of ['privada','esborrany','arxivada','amb-secret'])assert.equal(fs.existsSync(path.join(primer.dist,'mur',id)),false,id);
  // Revocada al servidor (feta privada): la projecció següent no la porta, i el dist/ net del build següent tampoc.
  const dades=DADES_RELEASE();dades.feedPosts[0]={...dades.feedPosts[0],visibility:'private'};
  assert.equal(await main(['--root',cache,'--out',out],{env:{},entorn,fetchImpl:backend(dades).fetchImpl,pausa:sensePausa,stdout:sortida(),stderr:sortida()}),0);
  assert.ok(!llegixSnapshot(out).some(e=>e.id==='aplec-2026'));
  const segon=lloc(t);
  const rebut2=await prerenderSocial({root:segon.root,dist:'dist',origin,policyRoot:projectRoot,JSDOM,publicSnapshot:llegixSnapshot(out),imageOrigins:[SUPABASE],fetchImpl:imatges().fetchImpl,convertidor});
  assert.deepEqual(rebut2.remoteImages,[],'la foto de la revocada tampoc es materialitza');
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
const entornNet=()=>Object.fromEntries(Object.entries(process.env).filter(([clau])=>!clau.startsWith('VITE_')&&!clau.startsWith('SDP_SOCIAL_')&&clau!==ESCAPADA));
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
test('build:social de veres amb dades remotes: la primera foto de Storage es materialitza i arriba a og:image; la privada, cap pàgina',async t=>{
  /* P0-SEO-UNIVERSAL (13-11-2026) · La CLI del prerender convertix la foto amb el convertidor de veres (Pillow
     aïllat). En una màquina sense ell, la release s'atura a posta (infraestructura): ací, la prova se salta. */
  try { (await detectaConvertidor()).tanca(); } catch (error) { t.skip(`sense convertidor aïllat en esta màquina: ${error.message}`); return; }
  const tmp=carpeta(t,'sdp-projeccio-real-');
  const log=path.join(tmp,'peticions.log');const mock=path.join(tmp,'fetch-fals.mjs');
  const dades={feedPosts:[
    {id:'aplec-2026',title:'Aplec de tardor',entradilla:'La festa del poble',imageSrc:`sdp-media://mitjans/${TENANT}/aplec.png`},
    {id:'privada',title:'NO_EXPORTAR',visibility:'private',image_url:FOTO},
    {id:'avatar',title:'Sense foto',entradilla:'Absència real de foto'}
  ],marketItems:[],events:[]};
  fs.writeFileSync(mock,`import fs from 'node:fs';
const dades=${JSON.stringify(dades)};
const directori=${JSON.stringify([FORN])};
const foto=Buffer.from('${pngDeProva(1200,630).toString('base64')}','base64');
globalThis.fetch=async (href,opcions={})=>{
  const url=new URL(href);fs.appendFileSync(${JSON.stringify(log)},url.origin+url.pathname+'\\n');
  if(opcions.method!=='GET'||opcions.body!==undefined)throw new TypeError('fetch fals: només GET');
  if(url.origin===${JSON.stringify(SUPABASE)}&&url.pathname==='/rest/v1/app_content'){
    if(opcions.headers?.apikey!==${JSON.stringify(ANON)})throw new TypeError('fetch fals: sense la clau anon');
    const clau=url.searchParams.get('key').replace(/^eq[.]/,'');
    return new Response(JSON.stringify(Object.hasOwn(dades,clau)?[{key:clau,payload:dades[clau]}]:[]),{headers:{'content-type':'application/json'}});
  }
  if(url.origin===${JSON.stringify(SUPABASE)}&&url.pathname==='/rest/v1/organization_directory'){
    if(opcions.headers?.apikey!==${JSON.stringify(ANON)}||url.searchParams.get('select')!==${JSON.stringify(COLUMNES_DIRECTORI.join(','))})throw new TypeError('fetch fals: directori mal demanat');
    return new Response(JSON.stringify(directori),{headers:{'content-type':'application/json'}});
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
  assert.match(primer.stderr,/el Mur veïnal \(R21\) està apagat/);
  assert.deepEqual(llegixSnapshot(fitxer).map(e=>[e.id,e.image]),[['aplec-2026',FOTO],['avatar',null],[FORN.id,null]]);
  const segon=executa(prerender,{'--root':projectRoot,'--dist':dist,'--snapshot':fitxer});
  assert.equal(segon.status,0,segon.stderr);
  const rebut=JSON.parse(segon.stdout);
  assert.equal(rebut.remoteImages.length,1);assert.match(rebut.remoteImages[0],OG);
  assert.ok(!/supabase/.test(segon.stdout),'cap URL remota a l’eixida');
  const aplec=llig(dist,'mur/aplec-2026/index.html');
  assert.deepEqual(['og:image','og:image:type','og:image:width','og:image:height'].map(n=>prop(aplec,n)),[rebut.remoteImages[0],'image/jpeg','1200','630']);
  // El fitxer de veres: un JPEG de 1200x630 i 300.000 B com a molt, al dist/ que es desplega.
  const og=fs.readFileSync(path.join(dist,new URL(rebut.remoteImages[0]).pathname));
  assert.ok(og.length<=300000&&og[0]===0xff&&og[1]===0xd8);
  assert.equal(prop(llig(dist,'mur/avatar/index.html'),'og:image'),origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  assert.equal(fs.existsSync(path.join(dist,'mur','privada')),false);
  // La fitxa del directori: la canònica i l'àlies per id, amb el mateix canonical.
  assert.equal(llig(dist,'empresa/forn-de-la-torre/index.html').title,'Forn de la Torre | Sóc de Poble');
  assert.equal(llig(dist,`gent/${FORN.id}/index.html`).querySelector('link[rel="canonical"]').href,origin+'/empresa/forn-de-la-torre');
  // El rebut en fitxer, al costat del snapshot, amb el de la projecció dins.
  const fitxerRebut=JSON.parse(fs.readFileSync(path.join(tmp,'rebut-social.json'),'utf8'));
  assert.deepEqual([fitxerRebut.projeccio.directori.publicades,fitxerRebut.lotVeinal.fitxes.map(f=>f.cami)],[1,['/empresa/forn-de-la-torre']]);
  // Tres lectures d'app_content, una del directori i un sol GET, el de la foto pública: cap a avatars ni a la RPC.
  const peticions=fs.readFileSync(log,'utf8').trim().split('\n');
  assert.deepEqual(peticions.sort(),[...Array(3).fill(`${SUPABASE}/rest/v1/app_content`),`${SUPABASE}/rest/v1/organization_directory`,FOTO].sort());
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
  assert.deepEqual(terminis,[5000,5000,5000,5000]);
});

/* ── P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les fonts veïnals dins del mateix pas ───── */
const filaMur=(n,extra={})=>({id:`0b0c1d2e-3f40-4a51-8b62-${String(n).padStart(12,'0')}`,tenant_id:TENANT,section_id:'mur',title:`Publicació ${n}`,
  description:`Text ${n} [contacte omés]`,public_content:'Cos',created_at:`2026-11-12T10:${String(59-(n%60)).padStart(2,'0')}:00+00:00`,updated_at:'2026-11-12T10:00:00+00:00',
  catalog_font:null,catalog_id:null,catalog_destins:null,destinacio_workspace:null,...extra});

test('el directori buit en mode remot és un error (i esborra el snapshot vell); amb SDP_SOCIAL_DIRECTORI_BUIT=1, ix i avisa',async t=>{
  await assert.rejects(projecta({fetchImpl:backend(DADES(),{directori:[]}).fetchImpl}),/El directori públic ha tornat 0 entitats/);
  const {snapshot,rebut}=await projecta({fetchImpl:backend(DADES(),{directori:[]}).fetchImpl,env:{[ESCAPADA_DIRECTORI_BUIT]:'1'}});
  assert.equal(snapshot.filter(esPerfil).length,0);assert.match(rebut.directori.avis,/cap entitat al directori/);
  for(const valor of ['0','true',' 1'])await assert.rejects(projecta({fetchImpl:backend(DADES(),{directori:[]}).fetchImpl,env:{[ESCAPADA_DIRECTORI_BUIT]:valor}}),/0 entitats/,valor);
  // Per la CLI: 1 i cap snapshot (ni el vell); amb l'escapada, 0 i l'avís.
  const root=carpeta(t);const out=path.join(root,'cache','snapshot.json');const entorn=entornDelBuild(ENTORN);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,'[{"vell":true}]');
  const mal={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl:backend(DADES_RELEASE(),{directori:[]}).fetchImpl,pausa:sensePausa,...mal}),1);
  assert.equal(fs.existsSync(out),false);assert.match(mal.stderr.text,/0 entitats/);
  const bo={stdout:sortida(),stderr:sortida()};
  assert.equal(await main(['--root',root,'--out',out],{env:{[ESCAPADA_DIRECTORI_BUIT]:'1'},entorn,fetchImpl:backend(DADES_RELEASE(),{directori:[]}).fetchImpl,pausa:sensePausa,...bo}),0,bo.stderr.text);
  assert.match(bo.stderr.text,/AVÍS · projecció pública: directori, SDP_SOCIAL_DIRECTORI_BUIT=1/);
  // Una fallada del directori (un 401 de la vista) també esborra el snapshot anterior.
  fs.writeFileSync(out,'[{"vell":true}]');
  const caigut={stdout:sortida(),stderr:sortida()};
  const falla=url=>(url.pathname==='/rest/v1/organization_directory'?json({message:'permission denied'},{status:401}):null);
  assert.equal(await main(['--root',root,'--out',out],{env:{},entorn,fetchImpl:backend(DADES_RELEASE(),{falla}).fetchImpl,pausa:sensePausa,...caigut}),1);
  assert.equal(fs.existsSync(out),false);assert.match(caigut.stderr.text,/HTTP 401 en llegir el directori públic/);
});

test('el Mur veïnal: cap petició sense SDP_SOCIAL_MUR_VEINAL=1; encés, nou camps amb origen veïnal, sense multimedia, i app_content mana',async()=>{
  const mur=[filaMur(1),filaMur(2,{section_id:'multimedia'}),filaMur(3,{section_id:'mercat',title:'Oli nou'}),
    // El mateix id que una publicació d'app_content (events/7 no és UUID: en fem una d'app_content amb id UUID).
    filaMur(4,{id:'0b0c1d2e-3f40-4a51-8b62-00000000aaaa'})];
  const dades=DADES();dades.feedPosts.push({id:'0b0c1d2e-3f40-4a51-8b62-00000000aaaa',title:'La d’app_content',entradilla:'Editorial'});
  for(const env of [{},{[INTERRUPTOR_MUR]:'0'},{[INTERRUPTOR_MUR]:'true'},{[INTERRUPTOR_MUR]:' 1'}]) {
    const apagat=backend(dades,{mur});
    const {snapshot,rebut}=await projecta({fetchImpl:apagat.fetchImpl,env});
    assert.equal(lesDe(apagat.crides,'/rest/v1/rpc/llig_mur_public').length,0,JSON.stringify(env));
    assert.equal(rebut.murVeinal,'apagat');assert.ok(!snapshot.some(e=>e.origen));
  }
  const b=backend(dades,{mur});
  const {snapshot,rebut}=await projecta({fetchImpl:b.fetchImpl,env:{[INTERRUPTOR_MUR]:'1'}});
  assert.equal(b.crides.length,5,'tres claus, el directori i una pàgina de la RPC');
  assert.equal(lesDe(b.crides,'/rest/v1/rpc/llig_mur_public')[0].opcions.method,'GET');
  const veinals=snapshot.filter(e=>e.origen==='veinal');
  assert.deepEqual(veinals.map(e=>`${e.sectionId}/${e.id}`).sort(),[`mercat/${mur[2].id}`,`mur/${mur[0].id}`]);
  for(const element of veinals) {
    assert.deepEqual(Object.keys(element),CAMPS_VEINALS);
    assert.deepEqual([element.image,element.imageAlt,element.visibility,element.status],[null,'','public','published']);
  }
  // L'id que ja és d'app_content no es substituïx: continua sent l'editorial, amb huit camps.
  const editorial=snapshot.find(e=>e.id==='0b0c1d2e-3f40-4a51-8b62-00000000aaaa');
  assert.deepEqual([editorial.title,Object.keys(editorial)],['La d’app_content',CAMPS]);
  assert.deepEqual([rebut.murVeinal.llegides,rebut.murVeinal.publicades,rebut.murVeinal.foraDeSeccio,rebut.murVeinal.repetides,rebut.murVeinal.tallat],[4,2,1,1,false]);
  // Zero files és una llista buida sense error; un 404 PGRST202 (la funció no hi és) és un error.
  const buit=await projecta({fetchImpl:backend(DADES(),{mur:[]}).fetchImpl,env:{[INTERRUPTOR_MUR]:'1'}});
  assert.deepEqual([buit.rebut.murVeinal.llegides,buit.snapshot.filter(e=>e.origen).length],[0,0]);
  const absent=url=>(url.pathname==='/rest/v1/rpc/llig_mur_public'?json({code:'PGRST202',message:'Could not find the function'},{status:404}):null);
  await assert.rejects(projecta({fetchImpl:backend(DADES(),{falla:absent}).fetchImpl,env:{[INTERRUPTOR_MUR]:'1'}}),/HTTP 404 en llegir el Mur públic/);
});

test('el Mur veïnal pagina per clau (els dos camps del cursor junts) i es talla a la cinquena pàgina',async()=>{
  const moltes=Array.from({length:1200},(_,i)=>filaMur(i+1,{created_at:new Date(Date.UTC(2026,10,12,10,0,0)-i*1000).toISOString()}));
  const b=backend(DADES(),{mur:moltes});
  const {snapshot,rebut}=await projecta({fetchImpl:b.fetchImpl,env:{[INTERRUPTOR_MUR]:'1'}});
  const crides=lesDe(b.crides,'/rest/v1/rpc/llig_mur_public');
  assert.equal(crides.length,5,'la sisena pàgina no es demana');
  assert.deepEqual(crides.map(c=>[c.url.searchParams.has('p_before_created_at'),c.url.searchParams.has('p_before_id')]),[[false,false],[true,true],[true,true],[true,true],[true,true]]);
  assert.deepEqual([rebut.murVeinal.llegides,rebut.murVeinal.tallat,snapshot.filter(e=>e.origen==='veinal').length],[1000,true,1000]);
  assert.match(rebut.murVeinal.avis,/més de 1000 publicacions veïnals/);
  // Una pàgina de menys de 200 files acaba la lectura.
  const poques=backend(DADES(),{mur:moltes.slice(0,250)});
  await projecta({fetchImpl:poques.fetchImpl,env:{[INTERRUPTOR_MUR]:'1'}});
  assert.equal(lesDe(poques.crides,'/rest/v1/rpc/llig_mur_public').length,2);
});
