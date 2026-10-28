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
import {buildSocialManifest,LLISTES} from './build-social-manifest.mjs';

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
  // Cap fitxer per a les rutes privades.
  for(const rel of ['notes','xat','disseny','consola','control'])assert.equal(fs.existsSync(path.join(dist,rel)),false,rel);
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

test('dades de veres del repositori: /anima, /fedivers, la samarreta i el Llibre d’Or; la CLI ix amb 1 si torna a passar',async t=>{
  const dist=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-prerender-real-'));t.after(()=>fs.rmSync(dist,{recursive:true,force:true}));
  const {manifest}=await buildSocialManifest({root:projectRoot,origin,estricte:true});
  for(const entrada of Object.values(manifest.routes)) {
    const rel=decodeURIComponent(new URL(entrada.image.url).pathname);
    fs.mkdirSync(path.dirname(path.join(dist,rel)),{recursive:true});fs.copyFileSync(path.join(projectRoot,'public',rel),path.join(dist,rel));
  }
  fs.writeFileSync(path.join(dist,'index.html'),fs.readFileSync(path.join(projectRoot,'index.html')));
  const cli=()=>spawnSync(process.execPath,[SCRIPT,'--root',projectRoot,'--dist',dist,'--origin',origin],{encoding:'utf8'});
  const primer=cli();
  assert.equal(primer.status,0,primer.stderr);
  const rebut=JSON.parse(primer.stdout);
  for(const ruta of ['/anima','/fedivers','/projecte','/mercat/samarreta-socdepoble','/wikidepoble','/wikidepoble/03_llibre_d_or_memoria_episodica'])assert.ok(rebut.routesWritten.includes(ruta),ruta);
  for(const ruta of ['/notes','/xat','/disseny','/consola'])assert.ok(!rebut.routesWritten.includes(ruta),ruta);
  const prop=(rel,nom)=>llig(dist,rel).querySelector(`meta[property="${nom}"]`)?.content??null;
  assert.equal(prop('fedivers/index.html','og:image'),origin+'/assets/ui/plugins/fedivers_vinyeta.webp');
  assert.equal(prop('mercat/samarreta-socdepoble/index.html','og:image'),origin+'/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png');
  assert.equal(prop('mercat/samarreta-socdepoble/index.html','og:image:type'),'image/jpeg');
  assert.equal(prop('wikidepoble/03_llibre_d_or_memoria_episodica/index.html','og:image'),origin+'/assets/system/ui/og-llibre-d-or-1200x630.png');
  assert.equal(prop('wikidepoble/03_llibre_d_or_memoria_episodica/index.html','og:url'),origin+'/wikidepoble/03_llibre_d_or_memoria_episodica');
  assert.equal(llig(dist,'wikidepoble/03_llibre_d_or_memoria_episodica/index.html').querySelector('link[rel="canonical"]').href,origin+'/wikidepoble?item=03_llibre_d_or_memoria_episodica');
  const segon=cli();
  assert.equal(segon.status,1);assert.equal(JSON.parse(segon.stderr.trim()).valid,false);
});

test('les llistes: cada secció continua registrant les claus del seu títol i la seua descripció',()=>{
  for(const [ruta,font,[titol],[descripcio]] of LLISTES) {
    const codi=fs.readFileSync(path.join(projectRoot,font),'utf8');
    assert.match(codi,new RegExp(`useSEO\\(\\{\\s*title: t\\('${titol.replace(/\./g,'\\.')}'`),`${ruta}: ${titol}`);
    assert.match(codi,new RegExp(`description: t\\('${descripcio.replace(/\./g,'\\.')}'`),`${ruta}: ${descripcio}`);
  }
});
