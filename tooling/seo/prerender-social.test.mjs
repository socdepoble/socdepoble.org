/* Pla 261028_1526 (P1-61, Fase 2) · El prerender estàtic (prerender-social.mjs):
   una fixture amb un dist/ de hashos, i les dades de veres del repositori sobre
   un dist/ temporal amb les imatges que nomena el manifest. Cap xarxa. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {comprovaFirebaseHosting,prerenderSocial,rutaEscrivible,sniffImage} from './prerender-social.mjs';
import {buildSocialManifest,LLISTES,llegixSnapshot} from './build-social-manifest.mjs';

const projectRoot=process.env.SDP_PROJECT_ROOT || process.cwd();
const {JSDOM}=createRequire(path.join(projectRoot,'package.json'))('jsdom');
const origin='https://socdepoble.org';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const SCRIPT=fileURLToPath(new URL('./prerender-social.mjs',import.meta.url));

/* Capçaleres mínimes de cada format, amb les mides que n'ha de llegir sniffImage. */
const png=(w,h)=>{const b=Buffer.alloc(33);Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b);b.writeUInt32BE(13,8);b.write('IHDR',12,'latin1');b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;};
const jpeg=(w,h)=>Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10]),Buffer.alloc(14),Buffer.from([0xff,0xc0,0x00,0x11,0x08,h>>8,h&255,w>>8,w&255,0x03]),Buffer.alloc(12)]);
const webpVp8x=(w,h)=>{const b=Buffer.alloc(30);b.write('RIFF',0,'latin1');b.write('WEBP',8,'latin1');b.write('VP8X',12,'latin1');b.writeUIntLE(w-1,24,3);b.writeUIntLE(h-1,27,3);return b;};
const webpVp8=(w,h)=>{const b=Buffer.alloc(30);b.write('RIFF',0,'latin1');b.write('WEBP',8,'latin1');b.write('VP8 ',12,'latin1');b.writeUInt16LE(w,26);b.writeUInt16LE(h,28);return b;};
const webpVp8l=(w,h)=>{const b=Buffer.alloc(30);b.write('RIFF',0,'latin1');b.write('WEBP',8,'latin1');b.write('VP8L',12,'latin1');b[20]=0x2f;b.writeUInt32LE(((w-1)&0x3fff)|(((h-1)&0x3fff)<<14),21);return b;};

const SHELL=`<!doctype html><html lang="ca"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="script-src 'self'">
<meta name="description" content="Portal de pobles connectats"><meta property="og:title" content="Sóc de Poble">
<meta property="og:site_name" content="Sóc de Poble"><meta property="og:locale" content="ca_ES">
<meta property="og:image" content="https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png"><meta name="twitter:card" content="summary_large_image">
<title>Sóc de Poble</title><script type="application/ld+json">{"@type":"WebSite"}</script>
<script type="module" crossorigin src="/assets/index-AbCdEf12.js"></script><link rel="stylesheet" crossorigin href="/assets/index-XyZw9876.css">
<link rel="manifest" href="/manifest.webmanifest"></head><body><div id="root"></div></body></html>`;

const FIREBASE=Object.freeze({hosting:{public:'dist',cleanUrls:false,trailingSlash:false,rewrites:[{source:'!/@(assets|fonts)/**',destination:'/index.html'}]}});
function fixture(t,{pagina={title:'El Projecte',lead:'Una xarxa de pobles',image:'/assets/projecte.jpg',imageAlt:'Bancals'},imatgeAlDist=true}={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-prerender-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const put=(rel,valor)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,valor);};
  put('package.json','{"type":"module"}');
  put('firebase.json',JSON.stringify(FIREBASE));
  put('src/sections/text/pageContent.js',`export const PAGE_COPY=${JSON.stringify({projecte:pagina,descarregues:{title:'Descàrregues',lead:'Canals'},notes:{title:'Notes',lead:'privat'},disseny:{title:'Disseny',lead:'privat'},xat:{title:'El Xat',lead:'Parlar'}})};`);
  put('src/config/systemPages.js',`export const SYSTEM_PAGES=[{key:'projecte',href:'/projecte'},{key:'wikidepoble',href:'/wikidepoble'},{key:'notes',href:'/notes'},{key:'disseny',href:'/disseny'},{key:'descarregues',href:'/page/descarregues'}];`);
  put('src/data/wikiManifest.js',`export const wikiManifest=${JSON.stringify({categories:[],items:[{id:'03_llibre_d_or_memoria_episodica',title:'x',attributes:{description:'Memòria'},content:'# El Llibre d’Or\n\n## Memòria contrastada'}]})};`);
  put('src/config/socialImages.js',fs.readFileSync(path.join(projectRoot,'src/config/socialImages.js'),'utf8'));
  put('src/sections/mercat/marketSeed.js',`export const MOCK_MARKET_ITEMS=[{id:'samarreta-socdepoble',title:'Samarreta',subtitle:'De cotó',images:['/assets/mercat/01-chica-jersey.png']}];`);
  const base=png(1200,630),llibre=png(1200,630),projecte=jpeg(1024,768),samarreta=jpeg(1024,1024);
  for(const dir of ['public','dist']) {
    put(`${dir}/assets/system/ui/og-socdepoble-1200x630.png`,base);put(`${dir}/assets/system/ui/og-llibre-d-or-1200x630.png`,llibre);
    put(`${dir}/assets/mercat/01-chica-jersey.png`,samarreta);
    if(dir==='public'||imatgeAlDist)put(`${dir}/assets/projecte.jpg`,projecte);
  }
  put('dist/index.html',SHELL);put('dist/assets/index-AbCdEf12.js','console.log(1)');
  return {root,put,dist:path.join(root,'dist')};
}
const run=(root,extra={})=>prerenderSocial({root,dist:'dist',origin,policyRoot:projectRoot,JSDOM,...extra});
const llig=(dist,rel)=>new JSDOM(fs.readFileSync(path.join(dist,rel),'utf8')).window.document;
const fitxers=dir=>fs.readdirSync(dir,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>path.relative(dir,path.join(e.parentPath??e.path,e.name)).split(path.sep).join('/')).sort();

test('sniffImage llig MIME i mides dels bytes: un .png amb bytes JPEG és image/jpeg; un text, cap',()=>{
  assert.deepEqual(sniffImage(png(1200,630)),{type:'image/png',width:1200,height:630});
  assert.deepEqual(sniffImage(jpeg(1024,768)),{type:'image/jpeg',width:1024,height:768});
  assert.deepEqual(sniffImage(webpVp8x(1024,1024)),{type:'image/webp',width:1024,height:1024});
  assert.deepEqual(sniffImage(webpVp8(800,600)),{type:'image/webp',width:800,height:600});
  assert.deepEqual(sniffImage(webpVp8l(640,480)),{type:'image/webp',width:640,height:480});
  for(const dolent of [Buffer.from('fixture'),Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),Buffer.alloc(0)])assert.equal(sniffImage(dolent),null);
});

test('cada ruta: un sol head marcat, canonical absolut, imatge del dist i els mateixos script i link que el shell',async t=>{
  const {root,dist}=fixture(t);const abans=sha(fs.readFileSync(path.join(dist,'index.html')));
  const rebut=await run(root);
  assert.equal(rebut.valid,true);assert.equal(rebut.shellSha,abans);
  assert.equal(sha(fs.readFileSync(path.join(dist,'index.html'))),abans,'dist/index.html intacte');
  assert.ok(rebut.routesWritten.includes('/projecte')&&rebut.routesWritten.includes('/wikidepoble/03_llibre_d_or_memoria_episodica'));
  for(const rel of ['projecte/index.html','mercat/samarreta-socdepoble/index.html','wikidepoble/03_llibre_d_or_memoria_episodica/index.html','page/descarregues/index.html','descarregues/index.html']) {
    const d=llig(dist,rel);
    for(const s of ['title','meta[name="description"]','meta[property="og:title"]','meta[property="og:image"]','link[rel="canonical"]','meta[property="og:site_name"]'])assert.equal(d.querySelectorAll(s).length,1,`${rel} ${s}`);
    assert.equal(d.querySelector('meta[name="robots"]'),null,rel);
    for(const node of d.head.querySelectorAll('title,meta[name="description"],meta[property^="og:"]:not([property="og:site_name"]):not([property="og:locale"]),meta[name^="twitter:"],link[rel="canonical"]'))
      assert.ok(node.hasAttribute('data-sdp-ssr'),`${rel}: ${node.outerHTML}`);
    assert.equal(d.querySelector('meta[property="og:site_name"]').hasAttribute('data-sdp-ssr'),false);
    assert.match(d.querySelector('link[rel="canonical"]').href,/^https:\/\/socdepoble\.org\//);
    assert.match(d.querySelector('meta[property="og:image"]').content,/^https:\/\/socdepoble\.org\/assets\//);
    assert.deepEqual([...d.querySelectorAll('script[src]')].map(n=>n.getAttribute('src')),['/assets/index-AbCdEf12.js']);
    assert.deepEqual([...d.querySelectorAll('link[href]:not([rel="canonical"])')].map(n=>n.getAttribute('href')),['/assets/index-XyZw9876.css','/manifest.webmanifest']);
    assert.equal(d.querySelectorAll('script[type="application/ld+json"]').length,1);
  }
  const samarreta=llig(dist,'mercat/samarreta-socdepoble/index.html');
  const prop=(d,nom)=>d.querySelector(`meta[property="${nom}"]`)?.content??null;
  assert.equal(prop(samarreta,'og:image'),origin+'/assets/mercat/01-chica-jersey.png');
  assert.deepEqual(['og:image:type','og:image:width','og:image:height'].map(n=>prop(samarreta,n)),['image/jpeg','1024','1024']);
  const llibre=llig(dist,'wikidepoble/03_llibre_d_or_memoria_episodica/index.html');
  assert.equal(llibre.querySelector('link[rel="canonical"]').href,origin+'/wikidepoble?item=03_llibre_d_or_memoria_episodica');
  /* Revisió adversarial (261028) · og:url és l'adreça del fitxer (Facebook la
     seguix i ?item= servix la llista); el canonical continua sent ?item=. */
  assert.equal(prop(llibre,'og:url'),origin+'/wikidepoble/03_llibre_d_or_memoria_episodica');
  assert.equal(prop(llig(dist,'projecte/index.html'),'og:url'),origin+'/projecte');
  assert.equal(prop(llibre,'og:image'),origin+'/assets/system/ui/og-llibre-d-or-1200x630.png');
  assert.equal(prop(llibre,'og:type'),'article');
  // La llista es servix també a ?item=: sense canonical ni og:url.
  const llista=llig(dist,'wikidepoble/index.html');
  assert.equal(llista.querySelector('link[rel="canonical"]'),null);assert.equal(prop(llista,'og:url'),null);
  assert.equal(llista.title,'Wiki de Poble | Sóc de Poble');
  // L'àlies porta el canonical (i l'og:url) del destí.
  assert.equal(llig(dist,'descarregues/index.html').querySelector('link[rel="canonical"]').href,origin+'/page/descarregues');
  assert.equal(prop(llig(dist,'descarregues/index.html'),'og:url'),origin+'/page/descarregues');
  /* Cap fitxer per a les rutes privades. Ordre del Mestre (30-10-2026, prompt
     2208, T2.1) · Expectativa actualitzada a posta: /disseny ja és pública i té
     el seu fitxer; la fixture no porta la Consola (seoConsola.js). Abans,
     'disseny' era a la llista de les privades. */
  for(const rel of ['notes','xat','consola','control'])assert.equal(fs.existsSync(path.join(dist,rel)),false,rel);
  assert.equal(llig(dist,'disseny/index.html').querySelector('link[rel="canonical"]').href,origin+'/disseny');
});

test('cada directori creat porta index.html; els que no són ruta, el shell byte a byte',async t=>{
  const {root,dist}=fixture(t);const shell=fs.readFileSync(path.join(dist,'index.html'));
  const rebut=await run(root);
  assert.deepEqual(rebut.dirsFilled,['page/index.html']);
  assert.ok(fs.readFileSync(path.join(dist,'page/index.html')).equals(shell));
  for(const entrada of fs.readdirSync(dist,{recursive:true,withFileTypes:true})) {
    if(!entrada.isDirectory())continue;
    const dir=path.join(entrada.parentPath??entrada.path,entrada.name);
    if(path.relative(dist,dir).startsWith('assets'))continue;
    assert.ok(fs.existsSync(path.join(dir,'index.html')),path.relative(dist,dir));
  }
});

test('un títol hostil continua sent text: cap node nou al head',async t=>{
  const hostil='"><script>alert(1)</script><title>x</title> & \'';
  const {root,dist}=fixture(t,{pagina:{title:hostil,lead:hostil,image:'/assets/projecte.jpg'}});
  await run(root);
  const d=llig(dist,'projecte/index.html');
  assert.equal(d.querySelectorAll('script').length,2);assert.equal(d.querySelectorAll('title').length,1);
  // El text pla (textPla) ja lleva les etiquetes; la resta s'escapa.
  assert.equal(d.title,'"> x & \' | Sóc de Poble');
  assert.ok(!fs.readFileSync(path.join(dist,'projecte/index.html'),'utf8').includes('<script>alert'));
});

test('camins: cap punt, codi % ni sortida de dist/',()=>{
  const dist=path.join(os.tmpdir(),'dist-fals');
  assert.equal(rutaEscrivible(dist,'/wikidepoble/03_llibre_d_or_memoria_episodica'),path.join(dist,'wikidepoble','03_llibre_d_or_memoria_episodica','index.html'));
  for(const dolent of ['/','','projecte','/a/../b','/../x','/%2e%2e/x','/a.b','/wikidepoble/..','/a//b','/a/b/'])assert.throws(()=>rutaEscrivible(dist,dolent),/no escrivible|fora/,dolent);
});

test('porta roja: imatge absent del dist, bytes que no són imatge, primera imatge SVG i sobreescriure; res escrit',async t=>{
  for(const [opcions,motiu] of [
    [{imatgeAlDist:false},/absent de dist/],
    [{pagina:{title:'P',lead:'L',image:'/assets/marca.svg'}},/bloquejada/]
  ]) {
    const {root,dist}=fixture(t,opcions);const abans=fitxers(dist);
    await assert.rejects(run(root),motiu);
    assert.deepEqual(fitxers(dist),abans,'res escrit');
  }
  const noImatge=fixture(t);noImatge.put('dist/assets/projecte.jpg','fixture');
  await assert.rejects(run(noImatge.root),/no és cap imatge/);
  const sobre=fixture(t);sobre.put('dist/mercat/samarreta-socdepoble/index.html','previ');const abans=fitxers(sobre.dist);
  await assert.rejects(run(sobre.root),/no se sobreescriu/);
  assert.deepEqual(fitxers(sobre.dist),abans);
});

/* Revisió adversarial (261028) · Cap directori del camí d'una ruta, tampoc
   el de la ruta mateixa, no pot ser un enllaç simbòlic: abans, dist/projecte
   apuntant fora de dist/ hi rebia index.html. */
test('porta roja: un enllaç simbòlic al directori de la ruta o a un avantpassat; res escrit, ni dins ni fora',async t=>{
  for(const rel of ['projecte','page','mercat','wikidepoble']) {
    const {root,dist}=fixture(t);
    const fora=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-prerender-fora-'));t.after(()=>fs.rmSync(fora,{recursive:true,force:true}));
    fs.symlinkSync(fora,path.join(dist,rel));
    const abans=fitxers(dist);
    await assert.rejects(run(root),/No és un directori real/,rel);
    assert.deepEqual(fitxers(dist),abans,`${rel}: res escrit a dist/`);
    assert.deepEqual(fs.readdirSync(fora),[],`${rel}: res escrit fora`);
  }
});

/* Revisió adversarial (261028) · Els fitxers de ruta només funcionen amb
   «trailingSlash: false»: el prerender ho exigix al firebase.json de l'arrel. */
test('porta roja: firebase.json absent, sense trailingSlash false o amb cleanUrls; res escrit',async t=>{
  const casos=[
    [null,/absent/],['{',/no és JSON/],[{},/trailingSlash/],
    [{hosting:{...FIREBASE.hosting,trailingSlash:undefined}},/trailingSlash/],
    [{hosting:{...FIREBASE.hosting,trailingSlash:true}},/trailingSlash/],
    [{hosting:{...FIREBASE.hosting,cleanUrls:true}},/cleanUrls/],
    [{hosting:[FIREBASE.hosting,{...FIREBASE.hosting,site:'altre',trailingSlash:'false'}]},/trailingSlash/]
  ];
  for(const [config,motiu] of casos) {
    const {root,dist,put}=fixture(t);
    if(config===null)fs.rmSync(path.join(root,'firebase.json'));
    else put('firebase.json',typeof config==='string'?config:JSON.stringify(config));
    const abans=fitxers(dist);
    await assert.rejects(run(root),motiu,JSON.stringify(config));
    assert.deepEqual(fitxers(dist),abans);
  }
  const multiple=fixture(t);multiple.put('firebase.json',JSON.stringify({hosting:[FIREBASE.hosting,{...FIREBASE.hosting,site:'altre'}]}));
  assert.equal(comprovaFirebaseHosting(multiple.root),undefined);
  // El firebase.json del repositori.
  assert.equal(comprovaFirebaseHosting(projectRoot),undefined);
});

/* Un dist/ temporal per a les dades de veres: el shell del repositori i les
   imatges que nomena el seu manifest (amb el snapshot, si n'hi ha). */
async function distReal(t,publicSnapshot=[]) {
  const dist=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-prerender-real-'));t.after(()=>fs.rmSync(dist,{recursive:true,force:true}));
  const {manifest}=await buildSocialManifest({root:projectRoot,origin,estricte:true,publicSnapshot});
  for(const entrada of Object.values(manifest.routes)) {
    const rel=decodeURIComponent(new URL(entrada.image.url).pathname);
    if(fs.existsSync(path.join(dist,rel)))continue;
    fs.mkdirSync(path.dirname(path.join(dist,rel)),{recursive:true});fs.copyFileSync(path.join(projectRoot,'public',rel),path.join(dist,rel));
  }
  fs.writeFileSync(path.join(dist,'index.html'),fs.readFileSync(path.join(projectRoot,'index.html')));
  return dist;
}

test('dades de veres del repositori: /anima, /fedivers, la samarreta i el Llibre d’Or; la CLI ix amb 1 si torna a passar',async t=>{
  const dist=await distReal(t);
  const cli=()=>spawnSync(process.execPath,[SCRIPT,'--root',projectRoot,'--dist',dist,'--origin',origin],{encoding:'utf8'});
  const primer=cli();
  assert.equal(primer.status,0,primer.stderr);
  const rebut=JSON.parse(primer.stdout);
  for(const ruta of ['/anima','/fedivers','/projecte','/mercat/samarreta-socdepoble','/wikidepoble','/wikidepoble/03_llibre_d_or_memoria_episodica'])assert.ok(rebut.routesWritten.includes(ruta),ruta);
  /* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · Expectativa actualitzada a
     posta: /disseny i /consola ja són públiques i prerenderitzades (abans, a la
     llista de les absents); /notes i /xat continuen fora. */
  for(const ruta of ['/notes','/xat'])assert.ok(!rebut.routesWritten.includes(ruta),ruta);
  for(const ruta of ['/disseny','/consola'])assert.ok(rebut.routesWritten.includes(ruta),ruta);
  /* Ordre del Mestre (30-10-2026, prompt 2208; QA-VES-01 de Codex) · Cobertura
     inventari ↔ head HTML servit: cada ruta nova té el seu fitxer, una sola
     og:image igual a twitter:image, summary_large_image, el títol, la descripció
     i el canonical del manifest, i la imatge és un JPEG o PNG del dist de
     300 000 B com a molt (cap targeta genèrica). */
  const {manifest}=await buildSocialManifest({root:projectRoot,origin,estricte:true});
  const inventari=Object.keys(manifest.routes).filter(ruta=>/^\/(?:page\/(?:publicar_|vehicle_compartit|animalets|treball|habitatge|notes|wikidepoble)|plugin\/|consola(?:\/|$)|disseny$|wikidepoble$)/.test(ruta));
  assert.equal(inventari.length,10+8+1+1+14,inventari.join(' '));
  for(const ruta of inventari) {
    const entrada=manifest.routes[ruta];
    const d=llig(dist,`${ruta.slice(1)}/index.html`);
    const meta=(atribut,nom)=>[...d.querySelectorAll(`meta[${atribut}="${nom}"]`)].map(n=>n.content);
    assert.deepEqual(meta('property','og:image'),[entrada.image.url],ruta);
    assert.deepEqual(meta('name','twitter:image'),[entrada.image.url],ruta);
    assert.deepEqual(meta('name','twitter:card'),['summary_large_image'],ruta);
    assert.equal(d.title,`${entrada.title} | Sóc de Poble`,ruta);
    assert.deepEqual(meta('name','description'),[entrada.description],ruta);
    const canonical=ruta==='/wikidepoble'?null:origin+ruta;
    assert.equal(d.querySelector('link[rel="canonical"]')?.href??null,canonical,ruta);
    const u=new URL(entrada.image.url);
    assert.notEqual(u.pathname,'/assets/system/ui/og-socdepoble-1200x630.png',`${ruta}: la targeta genèrica`);
    const bytes=fs.readFileSync(path.join(dist,decodeURIComponent(u.pathname)));
    assert.ok(bytes.length<=300000,`${ruta}: ${bytes.length} B`);
    assert.match(sniffImage(bytes)?.type??'',/^image\/(?:png|jpeg)$/,ruta);
    assert.deepEqual(meta('property','og:image:type'),[sniffImage(bytes).type],ruta);
  }
  const prop=(rel,nom)=>llig(dist,rel).querySelector(`meta[property="${nom}"]`)?.content??null;
  assert.equal(prop('fedivers/index.html','og:image'),origin+'/assets/ui/plugins/fedivers_vinyeta-social-1200x630.jpg');
  assert.equal(prop('mercat/samarreta-socdepoble/index.html','og:image'),origin+'/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey-social-1200x630.jpg');
  assert.equal(prop('mercat/samarreta-socdepoble/index.html','og:image:type'),'image/jpeg');
  assert.equal(prop('wikidepoble/03_llibre_d_or_memoria_episodica/index.html','og:image'),origin+'/assets/system/ui/og-llibre-d-or-1200x630.png');
  assert.equal(prop('wikidepoble/03_llibre_d_or_memoria_episodica/index.html','og:url'),origin+'/wikidepoble/03_llibre_d_or_memoria_episodica');
  assert.equal(llig(dist,'wikidepoble/03_llibre_d_or_memoria_episodica/index.html').querySelector('link[rel="canonical"]').href,origin+'/wikidepoble?item=03_llibre_d_or_memoria_episodica');
  const segon=cli();
  assert.equal(segon.status,1);assert.equal(JSON.parse(segon.stderr.trim()).valid,false);
});

/* QA-01 de Codex (261028) · El prerender passa el snapshot públic al
   manifest: abans, la publicació remota no tenia fitxer i el rastrejador en
   rebia la targeta genèrica. La projecció és sintètica; les privades, res. */
test('snapshot públic: una publicació remota té el seu fitxer, per l’API i per --snapshot; la privada i la pendent, cap',async t=>{
  const publicSnapshot=[
    {sectionId:'mur',id:'publicacio-sintetica-01',visibility:'public',status:'published',title:'Aplec de prova',description:'Una publicació sintètica del mur',image:'/assets/system/ui/og-llibre-d-or-1200x630.png',imageAlt:'Portada de prova'},
    {sectionId:'mur',id:'remota-storage-01',visibility:'public',status:'published',title:'Foto remota',description:'Una imatge d’un altre origen',image:'https://exemple.supabase.co/storage/v1/object/public/mur/foto.jpg'},
    {sectionId:'mur',id:'privada-01',visibility:'private',status:'published',title:'NO_EXPORTAR',description:'no'},
    {sectionId:'events',id:'pendent-01',visibility:'public',status:'draft',title:'NO_EXPORTAR',description:'no'}];
  const {root,dist}=fixture(t);
  const rebut=await run(root,{publicSnapshot});
  assert.ok(rebut.routesWritten.includes('/mur/publicacio-sintetica-01'),rebut.routesWritten.join(' '));
  const d=llig(dist,'mur/publicacio-sintetica-01/index.html');
  const prop=nom=>d.querySelector(`meta[property="${nom}"]`)?.content??null;
  assert.equal(d.title,'Aplec de prova | Sóc de Poble');
  assert.equal(d.querySelector('meta[name="description"]').content,'Una publicació sintètica del mur');
  assert.deepEqual(['og:type','og:url','og:image','og:image:alt'].map(prop),['article',origin+'/mur/publicacio-sintetica-01',origin+'/assets/system/ui/og-llibre-d-or-1200x630.png','Portada de prova']);
  assert.equal(d.querySelector('link[rel="canonical"]').href,origin+'/mur/publicacio-sintetica-01');
  // Una imatge d'un altre origen (Storage) no és del dist: la targeta genèrica.
  assert.equal(llig(dist,'mur/remota-storage-01/index.html').querySelector('meta[property="og:image"]').content,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  assert.notEqual(llig(dist,'mur/index.html').title,d.title,'la llista /mur conserva el seu head');
  for(const rel of ['mur/privada-01','events/pendent-01'])assert.equal(fs.existsSync(path.join(dist,rel)),false,rel);
  for(const rel of fitxers(dist))assert.ok(!fs.readFileSync(path.join(dist,rel),'utf8').includes('NO_EXPORTAR'),rel);
  // La CLI, amb les dades de veres i el mateix snapshot en un fitxer .json.
  const snapshots=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-prerender-snapshot-'));t.after(()=>fs.rmSync(snapshots,{recursive:true,force:true}));
  const fitxer=path.join(snapshots,'snapshot.json');fs.writeFileSync(fitxer,JSON.stringify(publicSnapshot));
  const distCli=await distReal(t,publicSnapshot);
  const cli=extra=>spawnSync(process.execPath,[SCRIPT,'--root',projectRoot,'--dist',distCli,'--origin',origin,...extra],{encoding:'utf8'});
  // La CLI de release refusa la foto bloquejada; l'API de diagnòstic anterior conserva la reserva.
  const bloquejat=cli(['--snapshot',fitxer]);
  assert.equal(bloquejat.status,1);assert.match(JSON.parse(bloquejat.stderr.trim()).error,/no servible/);
  assert.equal(fs.existsSync(path.join(distCli,'mur/publicacio-sintetica-01')),false);
  fs.writeFileSync(fitxer,JSON.stringify(publicSnapshot.filter(e=>e.id!=='remota-storage-01')));
  const bo=cli(['--snapshot',fitxer]);
  assert.equal(bo.status,0,bo.stderr);
  assert.ok(JSON.parse(bo.stdout).routesWritten.includes('/mur/publicacio-sintetica-01'));
  assert.equal(llig(distCli,'mur/publicacio-sintetica-01/index.html').title,'Aplec de prova | Sóc de Poble');
  // Un snapshot enllaçat o que no és .json: refusat; per la CLI, rebut JSON d'error i cap fitxer nou.
  const enllac=path.join(snapshots,'enllac.json');fs.symlinkSync(fitxer,enllac);
  assert.throws(()=>llegixSnapshot(enllac),/JSON regular/);
  const abans=fitxers(distCli);const txt=path.join(snapshots,'snapshot.txt');fs.writeFileSync(txt,'[]');
  const dolent=cli(['--snapshot',txt]);
  assert.equal(dolent.status,1);assert.match(JSON.parse(dolent.stderr.trim()).error,/snapshot/);
  assert.deepEqual(fitxers(distCli),abans);
});

test('les llistes: cada secció continua registrant les claus del seu títol i la seua descripció',()=>{
  for(const [ruta,font,[titol],[descripcio]] of LLISTES) {
    const codi=fs.readFileSync(path.join(projectRoot,font),'utf8');
    assert.match(codi,new RegExp(`useSEO\\(\\{\\s*title: t\\('${titol.replace(/\./g,'\\.')}'`),`${ruta}: ${titol}`);
    assert.match(codi,new RegExp(`description: t\\('${descripcio.replace(/\./g,'\\.')}'`),`${ruta}: ${descripcio}`);
  }
});

/* QA-H04 (verificació QA local, 261029) · La primera foto real d'una
   publicació remota: el bucket públic de Storage del Supabase del build
   (imageOrigins). No és a dist/: un GET fitat abans d'escriure res, amb el
   MIME i els bytes d'acord; si no es pot servir, la targeta genèrica. */
const SUPABASE='https://exemple.supabase.co';
const PUBLIC=`${SUPABASE}/storage/v1/object/public/mitjans/11111111-1111-4111-8111-111111111111`;
test('una foto remota del bucket públic: la seua URL amb MIME i mides dels bytes; si no es pot servir, la targeta genèrica',async t=>{
  const gran=Buffer.concat([jpeg(4000,3000),Buffer.alloc(600*1024)]);
  const respostes={
    'ok.png':()=>new Response(png(1080,1080),{headers:{'content-type':'image/png'}}),
    'ok.webp':()=>new Response(webpVp8x(800,600),{headers:{'content-type':'image/webp; charset=binary'}}),
    'gran.jpg':()=>new Response(gran,{headers:{'content-type':'image/jpeg'}}),
    'html.png':()=>new Response('<html></html>',{headers:{'content-type':'text/html'}}),
    'menteix.png':()=>new Response(jpeg(800,600),{headers:{'content-type':'image/png'}}),
    'absent.jpg':()=>new Response('no',{status:404,headers:{'content-type':'text/plain'}}),
    'caiguda.png':()=>Promise.reject(new TypeError('fetch failed'))
  };
  const crides=[];
  const fetchImpl=async (href,opcions)=>{crides.push({href,opcions});return respostes[href.split('/').pop()]();};
  const item=(id,image)=>({sectionId:'mur',id,visibility:'public',status:'published',title:`Foto ${id}`,description:'Una foto del servidor',image,imageAlt:`Alt ${id}`});
  const publicSnapshot=[...Object.keys(respostes).map(nom=>item(nom.replace('.','-'),`${PUBLIC}/${nom}`)),
    item('repetida',`${PUBLIC}/ok.png`),
    item('signada',`${SUPABASE}/storage/v1/object/sign/mitjans/x.png?token=abc`),
    item('transformada',`${SUPABASE}/storage/v1/render/image/public/mitjans/x.png`),
    item('codificada',`${PUBLIC}/foto%20nova.png`),
    item('forana','https://evil.example/storage/v1/object/public/mitjans/x.png')];
  const {root,dist}=fixture(t);
  const rebut=await run(root,{publicSnapshot,imageOrigins:[SUPABASE],fetchImpl});
  // Una petició per URL (la repetida, del cau), GET sense redireccions i amb termini; cap per a les altres.
  assert.deepEqual(crides.map(c=>c.href.split('/').pop()).sort(),Object.keys(respostes).sort());
  for(const {opcions} of crides)assert.ok(opcions.method==='GET'&&opcions.redirect==='error'&&opcions.signal);
  assert.deepEqual(rebut.remoteImages,[`${PUBLIC}/ok.png`,`${PUBLIC}/ok.webp`]);
  const og=id=>{const d=llig(dist,`mur/${id}/index.html`);return ['og:image','og:image:type','og:image:width','og:image:height','og:image:alt'].map(n=>d.querySelector(`meta[property="${n}"]`)?.content??null);};
  assert.deepEqual(og('ok-png'),[`${PUBLIC}/ok.png`,'image/png','1080','1080','Alt ok-png']);
  assert.deepEqual(og('repetida'),[`${PUBLIC}/ok.png`,'image/png','1080','1080','Alt repetida']);
  assert.deepEqual(og('ok-webp'),[`${PUBLIC}/ok.webp`,'image/webp','800','600','Alt ok-webp']);
  assert.equal(llig(dist,'mur/ok-png/index.html').querySelector('meta[name="twitter:image"]').content,`${PUBLIC}/ok.png`);
  const generica=origin+'/assets/system/ui/og-socdepoble-1200x630.png';
  for(const id of ['gran-jpg','html-png','menteix-png','absent-jpg','caiguda-png','signada','transformada','codificada','forana'])assert.equal(og(id)[0],generica,id);
  for(const [nom,motiu] of [['gran.jpg',/massa gran/],['html.png',/MIME text\/html/],['menteix.png',/declarada image\/png, els bytes diuen image\/jpeg/],['absent.jpg',/HTTP 404/],['caiguda.png',/fetch failed/]])
    assert.ok(rebut.warnings.some(w=>w.startsWith(`${PUBLIC}/${nom}:`)&&motiu.test(w)&&/targeta genèrica/.test(w)),`${nom}: ${rebut.warnings.join(' | ')}`);
  // Sense imageOrigins (cap Supabase al build), ni una petició: la targeta genèrica.
  const sense=fixture(t);const cap=[];
  await run(sense.root,{publicSnapshot:[item('ok-png',`${PUBLIC}/ok.png`)],fetchImpl:async href=>{cap.push(href);throw new Error('no');}});
  assert.deepEqual(cap,[]);assert.equal(llig(sense.dist,'mur/ok-png/index.html').querySelector('meta[property="og:image"]').content,generica);
});

/* QA-H04 · En producció (remot), el detall d'un id que també és de llavor
   pinta la publicació del servidor: el seu head mana, sense ruta duplicada. */
test('la publicació remota substituïx la llavor del mateix camí',async t=>{
  const {root,dist}=fixture(t);
  const publicSnapshot=[{sectionId:'mercat',id:'samarreta-socdepoble',visibility:'public',status:'published',title:'Samarreta del servidor',description:'La del servidor',image:'/assets/mercat/01-chica-jersey.png',imageAlt:'Samarreta'}];
  const rebut=await run(root,{publicSnapshot});
  assert.equal(rebut.routesWritten.filter(r=>r==='/mercat/samarreta-socdepoble').length,1);
  const d=llig(dist,'mercat/samarreta-socdepoble/index.html');
  assert.equal(d.title,'Samarreta del servidor | Sóc de Poble');
  assert.equal(d.querySelector('meta[property="og:type"]').content,'article');
  assert.equal(d.querySelector('meta[property="og:image"]').content,origin+'/assets/mercat/01-chica-jersey.png');
});

/* Revisió adversarial (QA-H04) · /mur/Aplec i /mur/aplec són el mateix fitxer
   en el disc del Mac (APFS no distingix majúscules): abans, el segon
   writeFileSync petava amb el dist/ a mitges. Ara és una ruta duplicada abans
   d'escriure res, en qualsevol disc; i una remota que només canvia les
   majúscules d'una llavor la substituïx, com la del mateix camí. */
test('majúscules: dues rutes plegades, porta roja sense escriure res; la remota amb altres majúscules substituïx la llavor',async t=>{
  const item=(sectionId,id)=>({sectionId,id,visibility:'public',status:'published',title:`Títol ${id}`,description:'Del servidor',image:null});
  const {root,dist}=fixture(t);const abans=fitxers(dist);
  await assert.rejects(run(root,{publicSnapshot:[item('mur','Aplec'),item('mur','aplec')]}),/Ruta social duplicada: \/mur\/(?:A|a)plec \(i \/mur\/(?:A|a)plec/);
  assert.deepEqual(fitxers(dist),abans,'cap fitxer escrit');
  const llavor=fixture(t);
  // Una llavor amb majúscules (Botijo) i una en minúscules (samarreta): cada remota plegada la substituïx.
  llavor.put('src/sections/mercat/marketSeed.js',`export const MOCK_MARKET_ITEMS=[{id:'samarreta-socdepoble',title:'Samarreta',subtitle:'De cotó',images:['/assets/mercat/01-chica-jersey.png']},{id:'Botijo',title:'Botijo',subtitle:'De fang',images:['/assets/mercat/01-chica-jersey.png']}];`);
  const rebut=await run(llavor.root,{publicSnapshot:[item('mercat','Samarreta-socdepoble'),item('mercat','botijo')]});
  assert.deepEqual(rebut.routesWritten.filter(r=>/samarreta|botijo/i.test(r)),['/mercat/Samarreta-socdepoble','/mercat/botijo']);
  assert.deepEqual(fs.readdirSync(path.join(llavor.dist,'mercat')).filter(n=>/samarreta|botijo/i.test(n)).sort(),['Samarreta-socdepoble','botijo']);
  assert.equal(llig(llavor.dist,'mercat/Samarreta-socdepoble/index.html').title,'Títol Samarreta-socdepoble | Sóc de Poble');
});


test('porta de release: una foto remota no servible atura abans d’escriure cap pàgina',async t=>{
  const item=image=>({sectionId:'mur',id:'primera',visibility:'public',status:'published',title:'Primera foto',description:'Una publicació',image,imageAlt:'Primera'});
  for(const [image,fetchImpl] of [
    [`${PUBLIC}/absent.png`,async()=>new Response('no',{status:404})],
    [`${PUBLIC}/gran.png`,async()=>new Response(Buffer.concat([png(1200,630),Buffer.alloc(600*1024)]),{headers:{'content-type':'image/png'}})],
    [`${PUBLIC}/menteix.png`,async()=>new Response(jpeg(1200,630),{headers:{'content-type':'image/png'}})],
    [`${SUPABASE}/storage/v1/object/sign/mitjans/a.png?token=NO_EXPORTAR_TOKEN`,async()=>{throw new Error('no ha de consultar');}]
  ]) {
    const {root,dist}=fixture(t);const abans=fitxers(dist);
    await assert.rejects(run(root,{strictRemoteImages:true,publicSnapshot:[item(image)],imageOrigins:[SUPABASE],fetchImpl}),/primera imatge remota|no servible/);
    assert.deepEqual(fitxers(dist),abans,'cap HTML parcial ni logotip de substitució');
  }
});


test('cada comprovació de foto remota té el termini contractual de cinc segons',async t=>{
  const terminis=[];
  t.mock.method(AbortSignal,'timeout',ms=>{terminis.push(ms);return new AbortController().signal;});
  const {root}=fixture(t);
  await run(root,{strictRemoteImages:true,imageOrigins:[SUPABASE],publicSnapshot:[{sectionId:'mur',id:'foto',visibility:'public',status:'published',title:'Foto',description:'Foto primera',image:`${PUBLIC}/foto.png`}],fetchImpl:async()=>new Response(png(1200,630),{headers:{'content-type':'image/png'}})});
  assert.deepEqual(terminis,[5000]);
});
