import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {BASE_IMAGE,buildSocialManifest,FONTS_CONSOLA,FONTS_DEL_ROUTER,FONT_DE_VERTICALS,LLISTA_DEL_DIRECTORI,LLISTES,normalizedKey,PAGINES_INFORMATIVES,plainText} from './build-social-manifest.mjs';
import {sniffImage} from './prerender-social.mjs';
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
  /* Ordre del Mestre (30-10-2026, prompt 2208) · notes i wikidepoble són ara les
     presentacions públiques /page/notes i /page/wikidepoble, i disseny, /disseny:
     el seu copy ja no és cap secret de la fixture. notes_shared (fora de
     l'inventari) continua sense eixir. */
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'El Projecte',lead:'Una xarxa de pobles',subtitle:'Subtítol que no mana',image:'/assets/projecte.jpg',imageAlt:'Bancals'},descarregues:{title:'Descàrregues',lead:'Canals de distribució'},notes:{title:'Bloc de notes',lead:'La fitxa pública del bloc'},notes_shared:{title:'NO_EXPORTAR_COMPARTIDES',lead:'no exportar',image:'/assets/marca.svg'},disseny:{title:'Disseny Pedra Seca',lead:'El catàleg viu'},anima:{title:'L’Ànima',lead:'La IAIA explica'},fedivers:{title:'Nodes i Fedivers',subtitle:'Una xarxa de nodes'},wikidepoble:{title:'Wiki',lead:'La base de coneixement',image:'/assets/wiki.png',imageAlt:'La portada de la Wiki'}};`);
  put('src/config/systemPages.js',`export const SYSTEM_PAGES=[{key:'projecte',href:'/projecte'},{key:'wikidepoble',href:'/wikidepoble'},{key:'descarregues',href:'/page/descarregues'},{key:'notes',href:'/notes'},{key:'disseny',href:'/disseny'}];`);
  put('src/config/sections.js',`import {FileText} from 'lucide-react';\nexport const SECTIONS=[{id:'mur',path:'/mur',icon:FileText,kind:'mur'},{id:'disseny',path:'/disseny',icon:FileText,kind:'text',pageKey:'disseny'},{id:'projecte',path:'/projecte',kind:'text',pageKey:'projecte'},{id:'ia',path:'/anima',icon:FileText,kind:'text',pageKey:'anima'},{id:'fedivers',path:'/fedivers',kind:'text',pageKey:'fedivers'}];`);
  put('public/assets/system/ui/og-socdepoble-1200x630.png','fixture');put('public/assets/projecte.jpg','fixture');put('public/assets/wiki.png','fixture');
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
  /* Ordre del Mestre (30-10-2026, prompt 2208) · Expectatives actualitzades a
     posta: /disseny és pública (i /page/disseny n'és l'àlies, com /page/projecte);
     la llista de la Wiki porta la imatge de la seua portada (QA-VES-02), i
     /page/notes i /page/wikidepoble són presentacions públiques (QA-VES-01).
     Abans: /disseny i /page/wikidepoble absents, i la llista sense imatge. */
  assert.deepEqual(manifest.aliases,{'/descarregues':'/page/descarregues','/page/anima':'/anima','/page/disseny':'/disseny','/page/fedivers':'/fedivers','/page/projecte':'/projecte'});
  assert.deepEqual([manifest.routes['/disseny'].title,manifest.routes['/disseny'].description],['Disseny Pedra Seca','El catàleg viu']);
  assert.deepEqual(manifest.routes['/wikidepoble'].image,{url:origin+'/assets/wiki.png',alt:'La portada de la Wiki'});
  assert.deepEqual(manifest.routes['/page/wikidepoble'].image,manifest.routes['/wikidepoble'].image);
  assert.deepEqual([manifest.routes['/page/notes'].title,manifest.routes['/page/notes'].description],['Bloc de notes','La fitxa pública del bloc']);
  for(const [ruta] of LLISTES)assert.equal(manifest.routes[ruta].index,true,ruta);
  assert.match(evidence.hashSrc,/^[a-f0-9]{64}$/);
  const serial=JSON.stringify(manifest);assert.ok(!/NO_EXPORTAR|Text sencer|attributes|Subtítol que no mana|marca[.]svg/.test(serial));
  // L'eina privada /notes i les claus fora de l'inventari (notes_shared) no ixen mai.
  for(const ruta of ['/notes','/page/notes_shared'])assert.equal(manifest.routes[ruta]??manifest.aliases[ruta],undefined,ruta);
});
/* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · /fediversity,
   l'adreça curta (App.jsx, una redirecció), porta el head de /page/fediversity. */
test('/fediversity és l’àlies de /page/fediversity, com /descarregues',async t=>{
  const {root,put}=fixture(t);
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={projecte:{title:'El Projecte',lead:'Una xarxa de pobles'},fediversity:{title:'Candidatura NLnet',lead:'En avaluació'}};`);
  put('src/config/systemPages.js',`export const SYSTEM_PAGES=[{key:'projecte',href:'/projecte'},{key:'fediversity',href:'/page/fediversity'}];`);
  const {manifest}=await buildSocialManifest({root,origin,policyRoot});
  assert.equal(manifest.routes['/page/fediversity'].title,'Candidatura NLnet');
  assert.equal(manifest.routes['/page/fediversity'].description,'En avaluació');
  assert.equal(manifest.aliases['/fediversity'],'/page/fediversity');
  assert.equal(manifest.routes['/fediversity'],undefined);
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
  for(const secret of ["clau sb_" + "secret_abcdefghijklmnopqrstuvwxyz",'**sb_publishable_abcdefghijklmnop**','`sk-proj-abcdefghijklmnopqrstuvwxyz`'])
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

/* Ordre del Mestre (30-10-2026, prompt 2208, T1.1) · Els plugins es lligen de
   l'AST de registrePlugins.js, sense executar-lo: el seu import del router no
   es resol mai. L'entradeta mana sobre el subtítol (metadadesDePlugin, la de
   PluginPage) i la imatge és la de la fàbrica: <IMATGES_PLUGINS>/<id>_vinyeta.<ext>. */
const REGISTRE=plugins=>`import {rutaDeApp} from '../../apps/plataforma/NO_EXISTIX.js';
export const IMATGES_PLUGINS='/assets/ui/plugins';
export const RUTA_PLUGINS='/plugin';
const plugin=(p)=>Object.freeze(p);
export const PLUGINS=Object.freeze([${plugins}]);
`;
test('els plugins: l’AST del registre, l’entradeta primer i la il·lustració de la fàbrica; un descriptor no estàtic és porta roja',async t=>{
  const {root,put}=fixture(t);
  put('public/assets/ui/plugins/prova_vinyeta.webp','fixture');put('public/assets/ui/plugins/altra_vinyeta.jpg','fixture');
  put('src/sections/plugins/registrePlugins.js',REGISTRE(`plugin({id:'prova',titol:'Prova',subtitol:'El subtítol',entradilla:\`L’entradeta\`,imatgeAlt:'Una agulla',extensioImatge:'webp',obrir:rutaDeApp('x')}),
    plugin({id:'altra',titol:'Altra',subtitol:'Només subtítol',imatgeAlt:'Un carter',data:DATA})`));
  const {manifest,evidence}=await buildSocialManifest({root,origin,policyRoot,estricte:true});
  assert.deepEqual(manifest.routes['/plugin/prova'],{title:'Prova',description:'L’entradeta',image:{url:origin+'/assets/ui/plugins/prova_vinyeta.webp',alt:'Una agulla'},
    type:'website',canonical:origin+'/plugin/prova',index:true});
  assert.equal(manifest.routes['/plugin/altra'].description,'Només subtítol');
  assert.deepEqual(manifest.routes['/plugin/altra'].image,{url:origin+'/assets/ui/plugins/altra_vinyeta.jpg',alt:'Un carter'});
  assert.ok(evidence.sources['src/sections/plugins/registrePlugins.js']);
  put('src/sections/plugins/registrePlugins.js',REGISTRE(`plugin(DESCRIPTOR)`));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/no estàtic/);
  /* Ordre del Mestre (30-10-2026, prompt 2208; SEO-CRIT-03) · Un camp de text que
     no és literal, i una propietat estesa o calculada (en pot portar qualsevol),
     també són porta roja, sense estricte: abans es perdien en silenci i el build
     publicava el subtítol (o la .jpg) mentre PluginPage pintava el valor de veres. */
  const BASE=`id:'prova',titol:'Prova',subtitol:'Subtítol vell',extensioImatge:'webp'`;
  for(const descriptor of [
    `{${BASE},entradilla:'Eina en obres: '+'el text que veu el client'}`,
    `{id:'prova',titol:\`Prova \${NOM}\`,subtitol:'S',extensioImatge:'webp'}`,
    `{id:'altra',titol:'Altra',subtitol:'S',extensioImatge:EXTENSIO}`,
    `{${BASE},imatgeAlt}`,
    `{${BASE},entradilla(){return 'x';}}`,
    `{...COMU,id:'prova',titol:'Prova',subtitol:'S'}`,
    `{${BASE},['entradilla']:'x'}`
  ]) {
    put('src/sections/plugins/registrePlugins.js',REGISTRE(`plugin(${descriptor})`));
    await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/Descriptor de plugin no estàtic/,descriptor);
  }
  // Una il·lustració que no es pot servir és porta roja al prerender (estricte), com qualsevol imatge pròpia.
  put('src/sections/plugins/registrePlugins.js',REGISTRE(`plugin({id:'absent',titol:'Absent',subtitol:'Sense fitxer'})`));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot,estricte:true}),/no servible a \/plugin\/absent/);
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T1.2) · L'inventari de /page/<clau>
   és tancat: amb el copy de la fixture, totes les de PAGINES_INFORMATIVES que hi
   són i cap altra clau de PAGE_COPY (notes_shared, amb l'SVG, no hi entra ni fa
   porta roja). */
test('les presentacions /page/<clau>: l’inventari explícit, ni una clau més',async t=>{
  const {root,put}=fixture(t);
  put('public/assets/mur.jpg','fixture');
  put('src/sections/text/pageContent.js',`export const PAGE_COPY={publicar_mur:{title:'Publicar al Mur',lead:'Al Mur del poble',image:'/assets/mur.jpg',imageAlt:'Veïns'},treball:{title:'Treball',subtitle:'Ofertes',visibility:'private'},notes_shared:{title:'Compartides',lead:'x',image:'/assets/marca.svg'},altra:{title:'Altra',lead:'Sense inventari'}};`);
  const {manifest}=await buildSocialManifest({root,origin,policyRoot,estricte:true});
  assert.deepEqual(manifest.routes['/page/publicar_mur'].image,{url:origin+'/assets/mur.jpg',alt:'Veïns'});
  for(const ruta of ['/page/treball','/page/notes_shared','/page/altra'])assert.equal(manifest.routes[ruta],undefined,ruta);
  // P0-60 / IDEA-191 · + l'herbari, el banc de llavors, les rutes de poble i els arbres monumentals.
  // Onada R14 · + el receptari «Què dinem?» (/page/receptes).
  assert.equal(PAGINES_INFORMATIVES.length,15);
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · La Consola entra amb el head
   del client (seoConsola.js · rutesPubliquesDeLaConsola), amb cada font a
   l'evidència; una primera imatge bloquejada és porta roja. */
test('la Consola: les rutes de seoConsola.js, a l’evidència; una imatge bloquejada és porta roja',async t=>{
  const {root,put}=fixture(t);
  put('public/assets/balanc.jpg','fixture');
  const consola=imatge=>`export function rutesPubliquesDeLaConsola(){return [{ruta:'/consola',title:'Consola',description:'El tauler',imatge:{estat:'absent'},image:null},`
    +`{ruta:'/consola/govern/balanc',title:'Balanç · Consola',description:'Demanat i fet',imatge:${JSON.stringify(imatge)},image:{url:'${origin}/assets/balanc.jpg',alt:'Balança'}}];}`;
  put(FONTS_CONSOLA[0],consola({estat:'triada'}));
  for(const font of FONTS_CONSOLA.slice(1))put(font,'export const res=1;');
  const {manifest,evidence}=await buildSocialManifest({root,origin,policyRoot,estricte:true});
  assert.equal(manifest.routes['/consola'].image.url,origin+BASE_IMAGE);
  assert.deepEqual(manifest.routes['/consola/govern/balanc'],{title:'Balanç · Consola',description:'Demanat i fet',image:{url:origin+'/assets/balanc.jpg',alt:'Balança'},
    type:'website',canonical:origin+'/consola/govern/balanc',index:true});
  for(const font of FONTS_CONSOLA)assert.ok(evidence.sources[font],font);
  put(FONTS_CONSOLA[0],consola({estat:'bloquejada',motiu:'svg',ref:'/assets/x.svg'}));
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/bloquejada a \/consola\/govern\/balanc/);
});

/* Ordre del Mestre (30-10-2026, prompt 2208; QA-VES-01 de Codex) · La cobertura
   sobre l'arbre de veres, inventari ↔ manifest: cada ruta de l'inventari explícit
   (les deu /page/*, els huit plugins de l'ordre, /disseny, /wikidepoble, /consola,
   les nou pàgines i les quatre del Govern) hi és amb una portada pròpia (cap
   targeta genèrica) que WhatsApp pot pintar: un fitxer de public/, PNG o JPEG,
   de 300 000 B com a molt. Les eines privades continuen fora. I a l'inrevés: cada
   clau de PAGE_COPY que PageDetailSection servix a /page/<clau> és al manifest
   (ruta o àlies) o a EXCLOSES_DE_PAGE amb el seu motiu. COMMIT R6 (d79a0b530) ·
   L'Arbre Genealògic (IDEA-100) és el nové plugin del registre: entra a
   l'inventari amb la seua variant social (VARIANTS_SOCIALS). */
/* R21 (COMMIT 1, cadena R18-R20) · L'Avisador entra al registre de plugins com a desé connector. */
const PLUGINS_DE_L_ORDRE=Object.freeze(['mapa','vehicle','animalets','gestoria','rebost','salut','rss','tpv','genealogia','avisador']);
const EXCLOSES_DE_PAGE=Object.freeze({
  notes_shared:'còpia antiga de la fitxa del Bloc de notes (/page/notes), amb el logotip SVG com a imatge: no és cap presentació pròpia',
  'la-iaia-sabuda':'espai de curadoria amb rol verificat i safata privada; no és una presentació pública per a rastrejadors',
  /* P0-SEO-UNIVERSAL (13-11-2026) · El motiu de veres de 'node-zero': pageContent.r10.js i pageContent.fediversityR20.js
     en recomponen l'entradeta en execució, i el productor (AST) en llegiria el literal: un head distint del del client.
     Les tres claus tenen ara la seua exempció amb motiu a tooling/seo/exempcions-socials.mjs (la Porta de cobertura). */
  'node-zero':'article didàctic del servidor local de l’habitació (/page/node-zero), enllaçat bidireccionalment amb /fedivers'
  /* P0-60 / IDEA-191 (ordre del Mestre, 08-11-2026 17:09) · L'herbari, el banc de llavors, les rutes de
     poble i els arbres monumentals ja porten la seua il·lustració Ibáñez (la variant social és a
     VARIANTS_SOCIALS) i entren a PAGINES_INFORMATIVES; /page/anatomia-rural és l'àlies de l'article
     del Pou de Neu al Mur. Cap motiu d'exclusió seguix vigent. */
});
test('cobertura de l’arbre de veres: presentacions inventariades, /disseny, /wikidepoble i la Consola, amb portada pròpia servible',async()=>{
  const {manifest}=await buildSocialManifest({root:policyRoot,origin,policyRoot,estricte:true});
  const importa=rel=>import(pathToFileURL(path.join(policyRoot,rel)).href);
  const [{IDS_PAGINES},{IDS_GOVERN},{PAGE_COPY},{resolvePageSlugPath}]=await Promise.all(['src/sections/consola/consolaPagines.js',
    'src/sections/consola/govern/governConsola.js','src/sections/text/pageContent.js','src/config/navigation.js'].map(importa));
  const inventari=[...PAGINES_INFORMATIVES.map(clau=>`/page/${clau}`),...PLUGINS_DE_L_ORDRE.map(id=>`/plugin/${id}`),'/disseny','/wikidepoble','/consola',
    ...IDS_PAGINES.map(id=>`/consola/${id}`),...IDS_GOVERN.map(id=>`/consola/govern/${id}`)];
  assert.equal(inventari.length,15+10+3+9+4);
  /* P0-60 / IDEA-191 · L'article del Pou de Neu i el Manifest de Poble (llavors del Mur) tenen el seu
     head, amb la variant JPEG de la il·lustració, i /page/anatomia-rural n'és l'àlies. */
  const POU='/mur/noves-tecnologies-aplicades-a-la-cultura-rural';
  inventari.push(POU,'/mur/manifest-de-poble');
  assert.equal(manifest.aliases['/page/anatomia-rural'],POU);
  // Onada R14 · /receptes és l'àlies de /page/receptes (App.jsx, una redirecció), amb la portada de l'olleta murera.
  assert.equal(manifest.aliases['/receptes'],'/page/receptes');
  // P0-115 + P0-117 (ordre del Mestre 261111 05:47) · /page/receptes és la Biblioteca Multipoble: targeta social Ibáñez pròpia.
  assert.equal(manifest.routes['/page/receptes'].image.url,`${origin}/assets/uploads/patrimoni/receptes-ibanez-social-1200x630.jpg`);
  assert.equal(manifest.routes[POU].type,'article');
  assert.equal(manifest.routes[POU].image.url,`${origin}/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez-social-1200x630.jpg`);
  for(const ruta of inventari) {
    const entrada=manifest.routes[ruta];
    assert.ok(entrada,`${ruta}: absent del manifest`);
    assert.equal(entrada.canonical,origin+ruta,ruta);
    assert.ok(entrada.title&&entrada.description,ruta);
    const u=new URL(entrada.image.url);
    assert.equal(u.origin,origin,ruta);assert.notEqual(u.pathname,BASE_IMAGE,`${ruta}: la targeta genèrica`);
    const bytes=fs.readFileSync(path.join(policyRoot,'public',decodeURIComponent(u.pathname)));
    assert.ok(bytes.length<=300000,`${ruta}: ${u.pathname} fa ${bytes.length} B`);
    assert.match(sniffImage(bytes)?.type??'',/^image\/(?:png|jpeg)$/,ruta);
  }
  assert.ok(Object.keys(manifest.routes).filter(ruta=>ruta.startsWith('/plugin/')).every(ruta=>inventari.includes(ruta)),'cap plugin fora de l’ordre');
  for(const ruta of ['/notes','/xat','/el-meu-perfil','/control','/gestoria','/page/notes_shared','/page/la-iaia-sabuda'])assert.equal(manifest.routes[ruta]??manifest.aliases[ruta],undefined,ruta);
  const senseCobertura=Object.keys(PAGE_COPY).filter(clau=>!resolvePageSlugPath(clau)&&!manifest.routes[`/page/${clau}`]&&!manifest.aliases[`/page/${clau}`]
    &&!Object.hasOwn(EXCLOSES_DE_PAGE,clau));
  assert.deepEqual(senseCobertura,[],'claus de /page/ sense head social ni motiu');
});

/* ── P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) ─────────────────────────────────────────
   Tota ruta pública del Router té head propi: les fitxes (identitats del paquet i entitats del
   directori), el directori /perfil sense indexar, les verticals i els àlies de redirecció. */
const UUID_OLI='3073b933-69fc-4c3e-80dc-b0df9c6b8391';
const FAMILIES=Object.freeze(['perfil','gent','empresa','entitats','ajuntament','grup']);
const fitxa=(id,slug,tipus,title,extra={})=>({sectionId:'perfil',id,slug,tipus,visibility:'public',status:'published',title,description:`Lema de ${title}`,image:null,imageAlt:'',...extra});

test('P0-SEO · arbre de veres sense snapshot: les identitats del paquet, /perfil sense indexar, les verticals, les pàgines i els àlies nous',async()=>{
  const {manifest,evidence}=await buildSocialManifest({root:policyRoot,origin,policyRoot,estricte:true});
  // Les quatre adreces netes, amb el seu schema i la seua dada del paquet.
  assert.deepEqual(['/javillinares','/socdepoble','/rentonar','/iaia'].map(r=>[manifest.routes[r]?.title,manifest.routes[r]?.schema,manifest.routes[r]?.index,manifest.routes[r]?.canonical]),
    [['Javi Llinares','Person',true,origin+'/javillinares'],['Sóc de Poble','Organization',true,origin+'/socdepoble'],['Rentonar','Organization',true,origin+'/rentonar'],['IAIA MarIA','SoftwareApplication',true,origin+'/iaia']]);
  assert.equal(manifest.routes['/javillinares'].image.url,origin+'/assets/fotos/javi-llinares-perfil-1200px.jpg');
  assert.equal(manifest.routes['/iaia'].image.url,origin+'/assets/uploads/brain/iaia_maria_avatar-social-1200x630.jpg');
  // La marca de Sóc de Poble és una reserva: la targeta genèrica, mai el quadrat de 256 px.
  for(const ruta of ['/socdepoble','/rentonar'])assert.equal(manifest.routes[ruta].image.url,origin+BASE_IMAGE,ruta);
  // Cada clau declarada pel paquet, en cada família del Router, és un àlies de la canònica.
  for(const [clau,canonica] of [['javillinares','/javillinares'],['0001','/javillinares'],['javi','/javillinares'],['javi-llinares','/javillinares'],
    ['socdepoble','/socdepoble'],['soc-de-poble_official','/socdepoble'],['a240e870-4aef-4d92-b138-e8b4e2f2123a','/socdepoble'],
    ['rentonar','/rentonar'],['b2c87505-53b1-4108-902f-2313e77b9968','/rentonar'],['iaia-maria','/iaia'],['11111111-1a1a-0000-0000-000000000000','/iaia']])
    for(const familia of FAMILIES)assert.equal(manifest.aliases[`/${familia}/${clau}`],canonica,`/${familia}/${clau}`);
  // Sense remot, Oli de La Torre no té fitxa del paquet (R22.1: cap dada real d'entitat al repositori).
  for(const cami of ['/empresa/olidelatorre',`/empresa/${UUID_OLI}`])assert.equal(manifest.routes[cami]??manifest.aliases[cami],undefined,cami);
  // /perfil: OpenGraph específic SENSE indexar (les dos marques), i el text que pinta ProfileSection.
  assert.deepEqual(manifest.routes['/perfil'],{title:'Gent i Entitats',description:'Directori de persones, entitats i col·lectius d’este poble.',
    image:manifest.routes['/mur'].image,type:'website',canonical:origin+'/perfil',index:false,compartible:true,schema:'CollectionPage'});
  assert.match(fs.readFileSync(path.join(policyRoot,LLISTA_DEL_DIRECTORI[1]),'utf8'),/useSEO\(\{ title: titol, description: subtitol \}\)/);
  for(const clau of [LLISTA_DEL_DIRECTORI[2][0],LLISTA_DEL_DIRECTORI[3][0]])assert.ok(fs.readFileSync(path.join(policyRoot,LLISTA_DEL_DIRECTORI[1]),'utf8').includes(`t('${clau}'`),clau);
  // Les cinc verticals, amb el kicker i el subtítol de la secció.
  assert.deepEqual(['/mapa','/vehicle','/animalets','/treball','/habitatge'].map(r=>[manifest.routes[r]?.title,manifest.routes[r]?.index,manifest.routes[r]?.schema]),
    [['Mapa',true,'CollectionPage'],['Compartir cotxe',true,'CollectionPage'],['Animalets',true,'CollectionPage'],['Treball',true,'CollectionPage'],['Habitatge',true,'CollectionPage']]);
  assert.equal(manifest.routes['/mapa'].description,'Punts d’interès, camins, patrimoni i incidències del terme que publica la gent de poble.');
  // Els àlies que el Router redirigix a una ruta del manifest i els de PAGE_ROUTE_MAP que faltaven.
  for(const [cami,desti] of [['/esdeveniments','/calendari'],['/wiki','/wikidepoble'],['/skills','/wikidepoble'],['/ia','/anima'],['/realitat','/iaia'],
    ['/page/el-projecte','/projecte'],['/page/ia','/anima'],['/page/privadesa','/legal'],['/page/projecte-fediversity','/page/fediversity'],['/page/skills','/wikidepoble']])
    assert.equal(manifest.aliases[cami],desti,cami);
  // La safata de curadoria i les eines continuen fora.
  for(const cami of ['/page/la-iaia-sabuda','/page/iaia-sabuda','/page/nodrir-la-iaia','/page/node-zero','/page/dispositius','/panell','/control','/el-meu-perfil','/app/avisador'])
    assert.equal(manifest.routes[cami]??manifest.aliases[cami],undefined,cami);
  // Cada clau del manifest passa el contracte del consumidor; cap ruta sense indexar porta només una marca.
  for(const key of [...Object.keys(manifest.routes),...Object.keys(manifest.aliases)])assert.ok(selectMetadata(manifest,new URL(key,origin)),key);
  for(const [ruta,entrada] of Object.entries(manifest.routes))assert.ok(entrada.index===true||(entrada.index===false&&entrada.compartible===true),ruta);
  // L'evidència: les fonts del Router, de les verticals, de la fitxa i de la llavor, i la classe de cada ruta.
  for(const font of [...FONTS_DEL_ROUTER,FONT_DE_VERTICALS,LLISTA_DEL_DIRECTORI[1]])assert.ok(evidence.sources[font],font);
  for(const font of ['src/config/metadadesDePerfil.js','src/sections/profile/perfilsDelPaquet.js','src/data/identitatsSeed.js','src/data/agentsSeed.js'])assert.ok(evidence.sources[font],font);
  assert.deepEqual(Object.entries(evidence.origens).filter(([,classe])=>classe!=='editorial').sort(),[['/iaia','paquet'],['/javillinares','paquet'],['/rentonar','paquet'],['/socdepoble','paquet']]);
  assert.deepEqual(Object.keys(evidence.origens),Object.keys(manifest.routes));
  assert.deepEqual([evidence.perfils.conflictes,evidence.perfils.avisos],[[],[]]);
  // Cap dada privada de la llavor (el correu de la persona pilot) ni cap id intern d'autor.
  assert.ok(!/@gmail|socdepoblecom|owner_org_id|usuariId/.test(JSON.stringify(manifest)));
});

test('P0-SEO · snapshot amb fitxes del directori: la canònica /empresa/<slug> i /grup/<slug>, i àlies en cada família per slug i per id',async()=>{
  const COLLA='8b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const publicSnapshot=[fitxa(UUID_OLI,'olidelatorre','entitat','Oli de La Torre',{image:'https://exemple.supabase.co/storage/v1/object/public/mitjans/t/u/organitzacions/portada.webp',imageAlt:'Oli de La Torre'}),
    fitxa(COLLA,'colla','grup','La Colla'),
    fitxa('a240e870-4aef-4d92-b138-e8b4e2f2123a','socdepoble','entitat','Sóc de Poble del servidor'),
    {...fitxa('9b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6','no-exportar-a','entitat','NO_EXPORTAR'),visibility:'members'},
    {...fitxa('ab0c1d2e-3f40-4a51-8b62-7c83d94ea5f6','no-exportar-b','entitat','NO_EXPORTAR'),status:'draft'}];
  const {manifest,evidence}=await buildSocialManifest({root:policyRoot,origin,policyRoot,estricte:true,publicSnapshot,imageOrigins:['https://exemple.supabase.co']});
  assert.deepEqual(manifest.routes['/empresa/olidelatorre'],{title:'Oli de La Torre',description:'Lema de Oli de La Torre',
    image:{url:'https://exemple.supabase.co/storage/v1/object/public/mitjans/t/u/organitzacions/portada.webp',alt:'Oli de La Torre'},
    type:'website',canonical:origin+'/empresa/olidelatorre',index:true,schema:'Organization'});
  assert.equal(manifest.routes['/grup/colla'].canonical,origin+'/grup/colla');
  // Dotze adreces per fitxa (sis famílies per slug i per id): una és la canònica i onze, àlies.
  for(const [slug,id,canonica] of [['olidelatorre',UUID_OLI,'/empresa/olidelatorre'],['colla',COLLA,'/grup/colla']]) {
    const camins=FAMILIES.flatMap(f=>[`/${f}/${slug}`,`/${f}/${id}`]);
    assert.deepEqual(camins.filter(c=>manifest.routes[c]),[canonica]);
    assert.deepEqual(camins.filter(c=>manifest.aliases[c]===canonica).length,11,slug);
  }
  // L'entitat pilot amb el seu id declarat: l'adreça neta, amb la dada del servidor (com a l'app).
  assert.equal(manifest.routes['/socdepoble'].title,'Sóc de Poble del servidor');
  assert.equal(evidence.origens['/socdepoble'],'veinal');assert.equal(evidence.origens['/empresa/olidelatorre'],'veinal');
  // Una fitxa que no és pública o no és publicada no genera res.
  assert.ok(!/NO_EXPORTAR|no-exportar|9b0c1d2e|ab0c1d2e/.test(JSON.stringify(manifest)));
  for(const key of [...Object.keys(manifest.routes),...Object.keys(manifest.aliases)])assert.ok(selectMetadata(manifest,new URL(key,origin),['https://exemple.supabase.co']),key);
  // Un element de perfil mal format és un snapshot trencat (la projecció no n'escriu cap): porta roja.
  for(const dolent of [{...fitxa(UUID_OLI,'olidelatorre','persona','Una persona')},{...fitxa('NO-UUID','x','entitat','X')},{...fitxa(UUID_OLI,'Amb Majúscules','entitat','X')},{...fitxa(UUID_OLI,'x','entitat','')}])
    await assert.rejects(buildSocialManifest({root:policyRoot,origin,policyRoot,publicSnapshot:[dolent]}),/Element de perfil invàlid/);
});

test('P0-SEO · una publicació veïnal del Mur entra sense indexar i amb la targeta genèrica; la editorial, com sempre',async t=>{
  const {root}=fixture(t);
  const publicSnapshot=[
    {sectionId:'mur',id:'0b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6',visibility:'public',status:'published',title:'Venc llenya',description:'Llenya de carrasca',image:null,imageAlt:'',origen:'veinal'},
    {sectionId:'mur',id:'editorial',visibility:'public',status:'published',title:'Editorial',description:'Del poble',image:'/assets/projecte.jpg',imageAlt:'Bancals'}];
  const {manifest,evidence}=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  const veinal=manifest.routes['/mur/0b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6'];
  assert.deepEqual([veinal.index,veinal.compartible,veinal.type,veinal.image.url],[false,true,'article',origin+BASE_IMAGE]);
  assert.equal(evidence.origens['/mur/0b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6'],'veinal');
  assert.deepEqual([manifest.routes['/mur/editorial'].index,manifest.routes['/mur/editorial'].compartible,evidence.origens['/mur/editorial']],[true,undefined,'editorial']);
  await assert.rejects(buildSocialManifest({root,origin,policyRoot,publicSnapshot:[{...publicSnapshot[0],origen:'altre'}]}),/Origen de publicació invàlid/);
});

test('P0-SEO · un arbre sense App.jsx no genera cap ruta de perfil, cap vertical ni cap àlies del Router; un Router il·legible és porta roja',async t=>{
  const {root,put}=fixture(t);
  const publicSnapshot=[fitxa(UUID_OLI,'olidelatorre','entitat','Oli de La Torre')];
  const {manifest,evidence}=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  for(const cami of ['/javillinares','/iaia','/empresa/olidelatorre','/perfil','/mapa','/esdeveniments','/page/el-projecte'])assert.equal(manifest.routes[cami]??manifest.aliases[cami],undefined,cami);
  assert.equal(evidence.perfils,undefined);
  // Amb un Router, la fitxa hi entra; amb una forma de ruta que el lector no coneix, el build s'atura.
  put('src/app/App.jsx',`export default function App(){return <Routes><Route path="empresa/:agentId" element={<PerfilPublicSection />} /><Route path="*" element={<NotFoundPage />} /></Routes>;}`);
  const amb=await buildSocialManifest({root,origin,policyRoot,publicSnapshot});
  assert.equal(amb.manifest.routes['/empresa/olidelatorre'].title,'Oli de La Torre');
  assert.equal(amb.manifest.aliases[`/empresa/${UUID_OLI}`],'/empresa/olidelatorre');
  assert.equal(amb.manifest.aliases['/gent/olidelatorre'],undefined,'només les famílies que el Router d’este arbre accepta');
  put('src/app/App.jsx',`export default function App(){return <Routes>{rutes.map(r=><Route key={r} path={r} element={<X />} />)}</Routes>;}`);
  await assert.rejects(buildSocialManifest({root,origin,policyRoot}),/El Router no es pot llegir amb seguretat/);
});
