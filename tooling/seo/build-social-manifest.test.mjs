import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildSocialManifest,LLISTES,normalizedKey,plainText} from './build-social-manifest.mjs';
import {selectMetadata} from './social-edge.mjs';
const policyRoot=process.env.SDP_PROJECT_ROOT || process.cwd();
const origin='https://socdepoble.org';
/* Pla 261028_1526 (P1-61, Fase 2) · Els documents de la Wiki ixen de
   src/data/wikiManifest.js, el mateix que pinta el client: la fixture n'escriu
   un. Les pàgines de text de sections.js (/anima, /fedivers) també hi entren. */
const wikiManifest=items=>`export const wikiManifest = ${JSON.stringify({categories:[],items},null,2)};\n`;
const LLIBRE={id:'llibre',title:'llibre',tags:[],attributes:{description:'Memòria contrastada'},content:'# El Llibre d’Or\n\nText sencer que no ha de viatjar.'};
const PRIVATS=[
  {id:'privat',title:'privat',attributes:{visibility:'private',description:'NO_EXPORTAR_PRIVAT'},content:'# Privat'},
  {id:'arxivat',title:'arxivat',attributes:{status:'arxivat',description:'NO_EXPORTAR_ARXIVAT'},content:'# Arxivat'},
  {id:'quarantena',title:'quarantena',attributes:{status:'quarantena',description:'NO_EXPORTAR_QUARANTENA'},content:'# Quarantena'}
];
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'social-fixture-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const put=(rel,text)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
  put('package.json','{"type":"module"}');
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'El Projecte',lead:'Una xarxa de pobles',subtitle:'Subtítol que no mana',image:'/assets/projecte.jpg',imageAlt:'Bancals'},descarregues:{title:'Descàrregues',lead:'Canals de distribució'},notes:{title:'NOTA PRIVADA',lead:'no exportar'},disseny:{title:'DISSENY PRIVAT',lead:'no exportar'},anima:{title:'L’Ànima',lead:'La IAIA explica'},fedivers:{title:'Nodes i Fedivers',subtitle:'Una xarxa de nodes'},wikidepoble:{title:'Wiki',lead:'NO_EXPORTAR_PORTADA'}};`);
  put('src/config/systemPages.js',`export const SYSTEM_PAGES=[{key:'projecte',href:'/projecte'},{key:'wikidepoble',href:'/wikidepoble'},{key:'descarregues',href:'/page/descarregues'},{key:'notes',href:'/notes'},{key:'disseny',href:'/disseny'}];`);
  put('src/config/sections.js',`import {FileText} from 'lucide-react';\nexport const SECTIONS=[{id:'mur',path:'/mur',icon:FileText,kind:'mur'},{id:'disseny',path:'/disseny',icon:FileText,kind:'text',pageKey:'disseny'},{id:'projecte',path:'/projecte',kind:'text',pageKey:'projecte'},{id:'ia',path:'/anima',icon:FileText,kind:'text',pageKey:'anima'},{id:'fedivers',path:'/fedivers',kind:'text',pageKey:'fedivers'}];`);
  put('public/assets/system/ui/og-socdepoble-1200x630.png','fixture');put('public/assets/projecte.jpg','fixture');
  put('src/data/wikiManifest.js',wikiManifest([LLIBRE,...PRIVATS]));
  return {root,put};
}
test('exporta H1 editorial, projecte amb imatge pròpia, pàgines de text i àlies canònics',async t=>{
  const {root}=fixture(t);const {manifest,evidence}=await buildSocialManifest({root,origin,policyRoot});
  assert.equal(manifest.schema,'sdp.social-manifest.v1');
  assert.deepEqual(manifest.routes['/projecte'].image,{url:origin+'/assets/projecte.jpg',alt:'Bancals'});
  // Decisió per defecte D6 · l'entradeta primer, com el client (metadadesDePagina).
  assert.equal(manifest.routes['/projecte'].description,'Una xarxa de pobles');
  assert.equal(manifest.routes['/fedivers'].description,'Una xarxa de nodes');
  assert.equal(manifest.routes['/anima'].title,'L’Ànima');
  assert.equal(manifest.routes['/wikidepoble?item=llibre'].title,'El Llibre d’Or');
  assert.equal(manifest.routes['/wikidepoble?item=llibre'].description,'Memòria contrastada');
  assert.equal(manifest.routes['/wikidepoble?item=llibre'].type,'article');
  assert.equal(manifest.routes['/wikidepoble?item=llibre'].canonical,origin+'/wikidepoble?item=llibre');
  // La llista de la Wiki porta el head de la portada de seoWiki, no el copy de la pàgina.
  assert.equal(manifest.routes['/wikidepoble'].title,'Wiki de Poble');
  assert.deepEqual(manifest.aliases,{'/descarregues':'/page/descarregues','/page/anima':'/anima','/page/fedivers':'/fedivers','/page/projecte':'/projecte'});
  for(const [ruta] of LLISTES)assert.equal(manifest.routes[ruta].index,true,ruta);
  assert.match(evidence.hashSrc,/^[a-f0-9]{64}$/);
  const serial=JSON.stringify(manifest);assert.ok(!/NO_EXPORTAR|Text sencer|NOTA PRIVADA|DISSENY PRIVAT|attributes|Subtítol que no mana/.test(serial));
  for(const ruta of ['/notes','/disseny','/page/wikidepoble'])assert.equal(manifest.routes[ruta]??manifest.aliases[ruta],undefined,ruta);
});
test('només publica la projecció explícita; mai /notes, privats ni pendents',async t=>{
  const {root}=fixture(t);const publicSnapshot=[
    {sectionId:'events',id:'acte',visibility:'public',status:'published',title:'Aplec',description:'Trobada',image:'https://evil.example/x.png'},
    {sectionId:'notes',id:'secret',visibility:'public',status:'published',title:'NO_EXPORTAR',description:'no'},
    {sectionId:'mur',id:'privat',visibility:'private',status:'published',title:'NO_EXPORTAR',description:'no'},
    {sectionId:'mur',id:'draft',visibility:'public',status:'draft',title:'NO_EXPORTAR',description:'no'}];
  const {manifest}=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  assert.equal(manifest.routes['/events/acte'].type,'article');assert.equal(manifest.routes['/events/acte'].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  assert.ok(!/NO_EXPORTAR|evil[.]example/.test(JSON.stringify(manifest)));
});
test('hashSrc determinista i sensibles a canvis de la Wiki pública',async t=>{
  const {root,put}=fixture(t);const a=await buildSocialManifest({root,origin,policyRoot});const b=await buildSocialManifest({root,origin,policyRoot});
  assert.deepEqual(a,b);put('src/data/wikiManifest.js',wikiManifest([{...LLIBRE,attributes:{description:'Descripció nova'},content:'# Títol nou'}]));
  const c=await buildSocialManifest({root,origin,policyRoot});assert.notEqual(a.evidence.hashSrc,c.evidence.hashSrc);assert.notEqual(a.evidence.hashManifest,c.evidence.hashManifest);
  assert.equal(c.manifest.routes['/wikidepoble?item=llibre'].title,'Títol nou');
});
test('la mateixa API rellegix PAGE_COPY i la dependència legal sense ESM cache',async t=>{
  const {root,put}=fixture(t);
  put('src/sections/text/pageContent.js',`import {legalContent} from './legalContent.js';export const PAGE_COPY={projecte:legalContent,descarregues:{title:'Descàrregues',lead:'Canals'}};`);
  put('src/sections/text/legalContent.js',`export const legalContent={title:'Títol primer',lead:'Descripció primera'};`);
  const a=await buildSocialManifest({root,origin,policyRoot});
  put('src/sections/text/legalContent.js',`export const legalContent={title:'Títol segon',lead:'Descripció segona'};`);
  const b=await buildSocialManifest({root,origin,policyRoot});assert.equal(b.manifest.routes['/projecte'].title,'Títol segon');assert.notEqual(a.evidence.hashSrc,b.evidence.hashSrc);
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'Títol tercer',lead:'Descripció tercera'},descarregues:{title:'Descàrregues',lead:'Canals'}};`);
  const c=await buildSocialManifest({root,origin,policyRoot});assert.equal(c.manifest.routes['/projecte'].title,'Títol tercer');
});
test('refusa identitats Wiki duplicades o invàlides i un manifest de la Wiki enllaçat',async t=>{
  const {root,put}=fixture(t);
  put('src/data/wikiManifest.js',wikiManifest([LLIBRE,{...LLIBRE,content:'# Homònim'}]));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/duplicada/);
  put('src/data/wikiManifest.js',wikiManifest([{...LLIBRE,id:'amb.punt'}]));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/invàlida/);
  const real=path.join(root,'fora.js');fs.writeFileSync(real,wikiManifest([LLIBRE]));fs.rmSync(path.join(root,'src/data/wikiManifest.js'));
  fs.symlinkSync(real,path.join(root,'src/data/wikiManifest.js'));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/frontera/);
});
test('clau de cache conserva item i refusa duplicitats i travessies',()=>{
  assert.equal(normalizedKey('/wikidepoble?utm_source=x&item=llibre',origin),'/wikidepoble?item=llibre');
  assert.notEqual(normalizedKey('/wikidepoble?item=llibre',origin),normalizedKey('/wikidepoble?item=altre',origin));
  for(const u of ['/wikidepoble?item=a&item=b','/wikidepoble?item=..%2Fsecret','https://evil.example/projecte','/projecte?mode=privat'])assert.throws(()=>normalizedKey(u,origin));
  for(const id of ['amb accent','amb.','accent_à','a'.repeat(181)])assert.throws(()=>normalizedKey('/wikidepoble?item='+encodeURIComponent(id),origin));
});
test('contracte productor-consumidor: formats i longituds totes acceptades',async t=>{
  const {root,put}=fixture(t);put('public/assets/prova.avif','fixture');put('public/assets/prova.gif','fixture');
  put('src/data/wikiManifest.js',wikiManifest([{...LLIBRE,attributes:{description:'Descripció llarga de reserva'},content:'# El Llibre\n\n## Subtítol editorial breu\n\nText del cos.'}]));
  const publicSnapshot=[
    {sectionId:'mur',id:'avif',visibility:'public',status:'published',title:'🙂'.repeat(160),description:'Descripció',image:'/assets/prova.avif'},
    {sectionId:'mur',id:'gif',visibility:'public',status:'published',title:'GIF',description:'Descripció',image:'/assets/prova.gif'},
    {sectionId:'events',id:'alt-buit',visibility:'public',status:'published',title:'Aplec',description:'Descripció',image:{url:'/assets/projecte.jpg',alt:' '}}];
  const {manifest}=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  assert.equal(manifest.routes['/wikidepoble?item=llibre'].description,'Subtítol editorial breu');
  for(const id of ['avif','gif'])assert.equal(manifest.routes['/mur/'+id].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  assert.equal(plainText('🙂'.repeat(160),160).length,160);
  for(const key of [...Object.keys(manifest.routes),...Object.keys(manifest.aliases)])assert.ok(selectMetadata(manifest,new URL(key,origin)),key);
});
/* Revisió adversarial (261028) · La guarda de secrets mira el text pla del
   client (textPla): quan textPla llevava tots els guions baixos, cap sb_…
   no s'hi reconeixia i es publicava. Els noms amb guió baix són text. */
test('plainText bloqueja les claus amb guió baix i conserva doc_to_app',()=>{
  for(const secret of ['clau sb_secret_abcdefghijklmnopqrstuvwxyz','**sb_publishable_abcdefghijklmnop**','`sk-proj-abcdefghijklmnopqrstuvwxyz`'])
    assert.throws(()=>plainText(secret),/possible secret/,secret);
  assert.equal(plainText('Guia doc_to_app i created_at'),'Guia doc_to_app i created_at');
});
test('SOCIAL_IMAGES és la font única; la imatge pròpia només ix si l’asset existix (i, estricte, no n’hi ha reserva)',async t=>{
  const {root,put}=fixture(t);
  put('src/data/wikiManifest.js',wikiManifest([{id:'03_llibre_d_or_memoria_episodica',title:'x',attributes:{description:'Memòria dels pobles'},content:'# El Llibre d’Or'}]));
  put('src/config/socialImages.js',fs.readFileSync(path.join(policyRoot,'src/config/socialImages.js'),'utf8'));
  const missing=await buildSocialManifest({root,origin,policyRoot});
  const key='/wikidepoble?item=03_llibre_d_or_memoria_episodica';
  assert.equal(missing.manifest.routes[key].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  await assert.rejects(buildSocialManifest({root,origin,policyRoot,estricte:true}),/no servible/);
  put('public/assets/system/ui/og-llibre-d-or-1200x630.png','PNG de prova');
  const present=await buildSocialManifest({root,origin,policyRoot});
  assert.deepEqual(present.manifest.routes[key].image,{url:origin+'/assets/system/ui/og-llibre-d-or-1200x630.png',
    alt:'El Llibre d’Or de Sóc de Poble: memòria contrastada dels pobles',width:1200,height:630,type:'image/png'});
  assert.notEqual(missing.evidence.hashSrc,present.evidence.hashSrc);assert.ok(selectMetadata(present.manifest,new URL(key,origin)));
});
test('una primera imatge bloquejada (SVG) és porta roja, també sense estricte',async t=>{
  const {root,put}=fixture(t);
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'El Projecte',lead:'Una xarxa',image:'/assets/marca.svg'}};`);
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/bloquejada a \/projecte/);
});
test('els detalls de llavor: la primera imatge de la galeria; un id invàlid és porta roja',async t=>{
  const {root,put}=fixture(t);put('public/assets/samarreta.png','fixture');
  put('src/sections/mercat/marketSeed.js',`export const MOCK_MARKET_ITEMS=[{id:'samarreta',title:'Samarreta',subtitle:'De cotó',images:['/assets/samarreta.png','/assets/projecte.jpg'],image_url:'/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png'},{id:'retirada',title:'NO_EXPORTAR',visibility:'private'}];`);
  put('src/sections/pobles/townsSeed.js',`export const MOCK_TOWNS=[{id:'orxeta',title:'Orxeta',content:'Orxeta és un municipi.',image_url:'/assets/projecte.jpg'}];`);
  const {manifest}=await buildSocialManifest({root,origin,policyRoot,estricte:true});
  assert.deepEqual(manifest.routes['/mercat/samarreta'].image,{url:origin+'/assets/samarreta.png',alt:'Samarreta'});
  assert.equal(manifest.routes['/mercat/samarreta'].description,'De cotó');
  assert.equal(manifest.routes['/pobles/orxeta'].title,'Gent d\'Orxeta');
  assert.ok(!JSON.stringify(manifest).includes('NO_EXPORTAR'));
  put('src/sections/mur/eventsSeed.js',`export const CALENDAR_EVENTS=[{id:'../x',title:'Acte'}];`);
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/ID de llavor invàlid/);
});
test('les llistes: el diccionari valencià i, sense, la reserva de la secció',async t=>{
  const {root,put}=fixture(t);
  put('src/config/idiomes/ca.js',`export default {\n  'section.mur.kicker': "Mur viu",\n  'section.mur.subtitle': 'El que passa al poble'\n};\n`);
  const {manifest}=await buildSocialManifest({root,origin,policyRoot});
  assert.deepEqual([manifest.routes['/mur'].title,manifest.routes['/mur'].description],['Mur viu','El que passa al poble']);
  assert.equal(manifest.routes['/mercat'].title,'Mercat');
  assert.equal(manifest.routes['/mur'].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
});
/* QA-H04 (certificació de Codex, 261029) · Una imatge d'un altre origen només
   si és del Supabase del build (imageOrigins) i del camí públic de Storage. */
test('imageOrigins: només el camí públic de Storage; ni signat, ni transformat, ni codificat, ni un altre origen',async t=>{
  const {root}=fixture(t);const supabase='https://exemple.supabase.co';
  const item=(id,image)=>({sectionId:'mur',id,visibility:'public',status:'published',title:`Foto ${id}`,description:'Descripció',image});
  const publicSnapshot=[item('publica',`${supabase}/storage/v1/object/public/mitjans/u1/foto.webp`),
    item('signada',`${supabase}/storage/v1/object/sign/mitjans/u1/foto.webp?token=abc`),
    item('autenticada',`${supabase}/storage/v1/object/authenticated/mitjans/u1/foto.webp`),
    item('transformada',`${supabase}/storage/v1/render/image/public/mitjans/u1/foto.webp`),
    item('codificada',`${supabase}/storage/v1/object/public/mitjans/u1/foto%20nova.webp`),
    item('arrel',`${supabase}/storage/v1/object/public/foto.webp`),
    item('rest',`${supabase}/rest/v1/foto.png`),
    item('forana','https://altre.supabase.co/storage/v1/object/public/mitjans/u1/foto.webp'),
    // Revisió adversarial · Només el bucket «mitjans», com urlSocialDe: cap altre bucket del mateix Supabase.
    item('privats',`${supabase}/storage/v1/object/public/mitjans_privats/u1/dni.webp`),
    item('xat',`${supabase}/storage/v1/object/public/xat_adjunts/fil/x.jpg`),
    item('avatars',`${supabase}/storage/v1/object/public/avatars/u1.png`),
    item('majuscules',`${supabase}/storage/v1/object/public/Mitjans/u1/foto.webp`),
    item('fonda',`${supabase}/storage/v1/object/public/mitjans/u1/mitjans_privats/foto.webp`),
    item('fondaautenticada',`${supabase}/storage/v1/object/public/mitjans/u1/object/authenticated/foto.webp`),
    item('fondasignada',`${supabase}/storage/v1/object/public/mitjans/u1/object/sign/foto.webp`),
    item('fondatransformada',`${supabase}/storage/v1/object/public/mitjans/u1/render/image/foto.webp`),
    item('arrelmitjans',`${supabase}/storage/v1/object/public/mitjans/foto.webp`)];
  const {manifest}=await buildSocialManifest({root,origin,policyRoot,publicSnapshot,imageOrigins:[supabase]});
  assert.deepEqual(manifest.routes['/mur/publica'].image,{url:`${supabase}/storage/v1/object/public/mitjans/u1/foto.webp`,alt:'Foto publica'});
  assert.equal(manifest.routes['/mur/arrelmitjans'].image.url,`${supabase}/storage/v1/object/public/mitjans/foto.webp`);
  for(const id of ['signada','autenticada','transformada','codificada','arrel','rest','forana','privats','xat','avatars','majuscules','fonda','fondaautenticada','fondasignada','fondatransformada'])
    assert.equal(manifest.routes[`/mur/${id}`].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png',id);
  // Mai més ample que el client: cada foto remota que el manifest admet, urlSocialDe també l'admet.
  const {urlSocialDe}=await import(pathToFileURL(path.join(policyRoot,'src/config/imatgeSocial.js')).href);
  for(const {id,image} of publicSnapshot)if(manifest.routes[`/mur/${id}`].image.url===image)assert.equal(urlSocialDe(image,{origen:origin,supabaseUrl:supabase}),image,id);
  // Sense imageOrigins, tampoc la pública.
  const sense=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  assert.equal(sense.manifest.routes['/mur/publica'].image.url,origin+'/assets/system/ui/og-socdepoble-1200x630.png');
  await assert.rejects(buildSocialManifest({root,origin,policyRoot,imageOrigins:['https://exemple.supabase.co/']}),/Origen d’imatge invàlid/);
});
