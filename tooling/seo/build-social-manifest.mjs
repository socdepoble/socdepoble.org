#!/usr/bin/env node
/** P1-61 (Fase 2, pla 261028_1526). Sense xarxa ni credencials; no exporta cossos ni attributes.
 * API: buildSocialManifest({root,origin,policyRoot=root,publicSnapshot=[],imageOrigins=[],estricte=false,strictSnapshot=false}).
 * Fonts, totes del repositori (cap dada remota):
 *   · pàgines: SYSTEM_PAGES ∪ les pàgines de text de sections.js (pageKey), amb
 *     PAGE_COPY i la MATEIXA regla que el client (src/config/metadadesSocials.js
 *     · metadadesDePagina): entradeta primer, primeraImatgeSocial('pagina');
 *     filtrades per publicMetadata, publicSeoRoute i esPaginaVisible (web);
 *   · llistes: el títol i la descripció que registra cada secció (LLISTES);
 *   · detalls de llavor (/mercat, /events i /pobles): metadadesDeDetall;
 *   · documents de la Wiki: src/data/wikiManifest.js, el mateix que pinta el
 *     client, amb la regla de src/sections/wiki-de-poble/seoWiki.js;
 *   · /wikidepoble, la llista: el head de la portada de seoWiki, amb la imatge
 *     de la portada (ordre del Mestre, 30-10-2026, prompt 2208; QA-VES-02);
 *   · Ordre del Mestre (30-10-2026, prompt 2208; QA-VES-01 de Codex), amb un
 *     INVENTARI EXPLÍCIT, no totes les claus de PAGE_COPY:
 *       - les presentacions /page/<clau> de PAGINES_INFORMATIVES, amb la regla
 *         de PageDetailSection (cap clau amb ruta pròpia a navigation.js);
 *       - les huit /plugin/<id> de registrePlugins.js (PLUGINS), llegides de
 *         l'AST, amb metadadesDePlugin (la de PluginPage.jsx);
 *       - /consola, les seues nou pàgines i les quatre del Govern del Mestre,
 *         amb src/sections/consola/seoConsola.js (la de ConsolaSection.jsx);
 *       - /disseny, ja pública: entra per SYSTEM_PAGES com /projecte.
 * Una primera imatge 'bloquejada' (SVG, bucket privat, URL signada…) és porta
 * roja sempre. Amb `estricte` (el prerender), també una imatge pròpia que no
 * passa el filtre del lloc (mateix origen, asset a public/, sense signatura);
 * sense, la targeta genèrica, com abans.
 * Snapshot és una projecció explícita de publicacions públiques, MAI notes:
 * [{sectionId:'events'|'mur'|'mercat',id,visibility:'public',status:'published',
 *   title,description,image,imageAlt}]. No és l'esquema SQL del backend; la
 * produïx projeccio-publica.mjs (QA-H04). Una publicació remota mana sobre la
 * llavor del mateix camí, també si només en canvien les majúscules (un disc del
 * Mac no les distingix: seria el mateix fitxer): en producció (remot) el
 * detall pinta la remota.
 * imageOrigins: orígens https d'imatges que no són de l'origen (el Supabase del
 * build): només el bucket públic «mitjans» de Storage
 * (/storage/v1/object/public/mitjans/…, segments nets; la regla d'urlSocialDe),
 * mai un altre bucket, /object/sign/ ni cap altre camí.
 * Retorna {manifest,evidence}; evidence és un rebut LOCAL separat, no publicable.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {textPla} from '../../src/config/metadadesSocials.js';

const sha = text => createHash('sha256').update(text).digest('hex');
export const BASE_IMAGE = '/assets/system/ui/og-socdepoble-1200x630.png';
const MAX_FILE = 2 * 1024 * 1024;
export const MAX_SNAPSHOT = 8 * 1024 * 1024;
const SOCIAL_SECTIONS = new Set(['events','mur','mercat']);
export const ID_DETALL = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
/* QA-H04 · L'únic camí admés d'una imatge d'un altre origen: un objecte del
   bucket públic «mitjans» de Storage, amb cada segment net (sense '%', punts
   al principi ni barres buides). És el PREFIX_PUBLIC_DE_MITJANS d'urlSocialDe
   (src/config/imatgeSocial.js), sensible a les majúscules com ell: cap altre
   bucket (avatars, xat_adjunts, mitjans_privats), ni la signatura
   (/object/sign/), l'autenticat o les transformacions (/render/image/). */
export const CAMI_PUBLIC_DE_STORAGE = /^\/storage\/v1\/object\/public\/mitjans\/(?:[a-zA-Z0-9_-][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;
/* El MITJA_PRIVAT del client: on siga del camí, un mitjà privat o temporal. */
const MITJA_PRIVAT = /mitjans_privats|\/object\/(?:sign|authenticated)\/|\/render\/image\//i;
const noSecret = text => !/(?:\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}|\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(text);

/* Les llistes públiques: [ruta, secció que la registra, [clau, reserva] del
   títol i de la descripció de useSEO]. Es resolen amb el diccionari valencià
   (src/config/idiomes/ca.js), com t() al client. prerender-social.test.mjs
   comprova que cada secció continua registrant eixes claus. */
export const LLISTES = Object.freeze([
  ['/mur', 'src/sections/mur/MurSection.jsx', ['section.mur.kicker', 'Mur'], ['section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.']],
  ['/mercat', 'src/sections/mercat/MercatSection.jsx', ['section.mercat.kicker', 'Mercat'], ['section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.']],
  ['/pobles', 'src/sections/pobles/PoblesSection.jsx', ['section.pobles.kicker', 'Pobles'], ['section.pobles.subtitle', 'Explora els pobles i el seu context territorial.']],
  ['/calendari', 'src/sections/calendari/CalendariSection.jsx', ['section.events.calendarMeta', 'Calendari'], ['section.calendari.subtitle', 'Cada publicació, acte i producte, el dia de la seua data.']],
  ['/multimedia', 'src/sections/multimedia/MultimediaSection.jsx', ['section.multimedia.title', 'Arxiu visual'], ['section.multimedia.subtitle', 'Galeria d’imatges i cronologia visual del projecte.']],
  ['/poblacio', 'src/sections/poblacio/PoblacioSection.jsx', ['section.poblacio.title', 'Cens de Població'], ['section.poblacio.subtitle', 'Demografia i nombre d\'habitants dels pobles connectats.']]
].map(entrada => Object.freeze(entrada)));

/* Ordre del Mestre (30-10-2026, prompt 2208, T1.2; QA-VES-01 de Codex) · Les
   presentacions públiques de /page/<clau> que no tenen cap altra porta al
   manifest (ni SYSTEM_PAGES amb un href /page/, ni ruta pròpia a
   navigation.js): PageDetailSection les servix a tothom amb el copy de
   PAGE_COPY. Llista tancada i comprovada (la cobertura és a les proves), no
   totes les claus: notes_shared, amb el logotip SVG, no és cap presentació, i
   /page/notes és la fitxa pública, no l'eina privada /notes. */
export const PAGINES_INFORMATIVES = Object.freeze(['publicar_mur', 'publicar_mercat', 'publicar_calendari', 'publicar_mapa',
  'vehicle_compartit', 'animalets', 'treball', 'habitatge', 'notes', 'wikidepoble']);

/* Ordre del Mestre (30-10-2026, prompt 2208, T1.1 i T2.1) · Les fonts JS de les
   rutes de la Consola: la regla (seoConsola.js) i les dades que llig. Totes
   entren a l'evidència; una font canviada a mig build és porta roja. */
export const FONTS_CONSOLA = Object.freeze(['src/sections/consola/seoConsola.js', 'src/sections/consola/consolaPagines.js',
  'src/sections/consola/govern/governConsola.js', 'src/sections/consola/imatgesConsola.js']);

/* Les llavors del repositori amb detall públic (decisió per defecte del
   261028, D3): [secció, font, exportació]. Una font absent no hi entra. */
export const LLAVORS = Object.freeze([
  ['mercat', 'src/sections/mercat/marketSeed.js', 'MOCK_MARKET_ITEMS'],
  ['events', 'src/sections/mur/eventsSeed.js', 'CALENDAR_EVENTS'],
  ['pobles', 'src/sections/pobles/townsSeed.js', 'MOCK_TOWNS']
].map(entrada => Object.freeze(entrada)));

/* El text pla del client (metadadesSocials.js · textPla) amb les guardes del
   build: una entrada massa gran o amb un possible secret no es publica. */
export function plainText(value,limit=300) {
  if (typeof value !== 'string') return '';
  if(value.length>64000)throw new Error('Metadada d’entrada massa gran.');
  const text=textPla(value,Number.POSITIVE_INFINITY);
  if (!noSecret(text)) throw new Error('Metadada amb possible secret: no es publica.');
  return textPla(text,limit);
}

export function normalizedKey(raw,origin) {
  const u = new URL(raw,origin);
  if(u.origin !== origin || u.username || u.password || u.hash) throw new Error('Ruta social fora de l’origen o amb fragment.');
  if (u.pathname === '/wikidepoble') {
    if (!u.search) return '/wikidepoble';
    const items = u.searchParams.getAll('item');
    if (items.length !== 1 || !/^[a-zA-Z0-9_-]{1,180}$/.test(items[0])) throw new Error('Identificador Wiki invàlid.');
    return `/wikidepoble?${new URLSearchParams({item:items[0]})}`;
  }
  if (u.search) throw new Error('La ruta social no admet paràmetres.');
  if (!/^\/[A-Za-z0-9/_%.-]*$/.test(u.pathname) || /\/(?:\.|\.\.)\//.test(u.pathname)) throw new Error('Ruta social invàlida.');
  return u.pathname;
}

export async function buildSocialManifest({root,origin,policyRoot=root,publicSnapshot=[],imageOrigins=[],estricte=false,strictSnapshot=false}={}) {
  if (!root || !origin) throw new Error('root i origin són obligatoris.');
  root=fs.realpathSync(root);policyRoot=fs.realpathSync(policyRoot);
  const originUrl=new URL(origin);
  if(originUrl.protocol!=='https:'||originUrl.pathname!=='/'||originUrl.search||originUrl.hash||originUrl.username||originUrl.password) throw new Error('origin ha de ser un origen HTTPS net.');
  origin=originUrl.origin;
  const allowedImages = new Set([origin,...imageOrigins.map(o=>{
    const u=new URL(o);if(u.protocol!=='https:'||u.origin!==o) throw new Error('Origen d’imatge invàlid.');return o;
  })]);
  const POLITIQUES=['tooling/wiki/lib/publication-policy.mjs','src/config/imatgeSocial.js','src/config/metadadesSocials.js',
    'src/config/rutaSocial.js','src/config/navigation.js','src/sections/wiki-de-poble/seoWiki.js','src/sections/wiki-de-poble/parseMarkdown.js',
    'src/components/universal/editorial.js','src/sections/pobles/nomsDelPoble.js','src/utils/iniciEditorial.js'];
  const moduleAt = async rel => import(pathToFileURL(path.join(policyRoot,rel)).href);
  const [{publicMetadata,publicSeoRoute,confinedFile},{CAP_SOCIAL_BASE},{metadadesDePagina,metadadesDeDetall,metadadesDePlugin},{idDeDocumentWiki},{resolvePageSlugPath},
    {atributsPublics,metadadesDeDocumentPublic,metadadesDeDocumentWiki,portadaSocialDeLaWiki}]=await Promise.all(POLITIQUES.slice(0,6).map(moduleAt));
  const sources=new Map();
  const sourcePaths=new Map();
  function record(file,bytes,base=root) {
    const rel=path.relative(base,file).split(path.sep).join('/');
    const label=base===root?rel:`policy:${rel}`;
    sources.set(label,sha(bytes));
    sourcePaths.set(file,sha(bytes));
  }
  const sourceFile=rel=>{
    const file=confinedFile(root,path.join(root,rel));
    if(!file) throw new Error(`Font absent o fora de frontera: ${rel}`);
    const stat=fs.statSync(file);if(stat.size>MAX_FILE) throw new Error(`Font massa gran: ${rel}`);
    record(file,fs.readFileSync(file));return file;
  };
  // Una font opcional absent no hi entra; si hi és (també un enllaç simbòlic), passa per la frontera.
  const hiEs=rel=>{try{fs.lstatSync(path.join(root,rel));return true;}catch{return false;}};
  const {parse}=createRequire(path.join(policyRoot,'package.json'))('@babel/parser');
  const staticModules=new Map(),loading=new Set();
  function staticModule(rel) {
    if(staticModules.has(rel))return staticModules.get(rel);
    if(loading.has(rel))throw new Error('Dependència circular de dades estàtiques.');loading.add(rel);
    const file=sourceFile(rel),text=fs.readFileSync(file,'utf8');
    const program=parse(text,{sourceType:'module'}).program;
    const bindings=new Map(),imports=new Map();
    for(const n of program.body) {
      const decl=n.type==='ExportNamedDeclaration'?n.declaration:n;
      if(decl?.type==='VariableDeclaration')for(const d of decl.declarations)if(d.id.type==='Identifier')bindings.set(d.id.name,d.init);
      if(n.type==='ExportDefaultDeclaration'&&n.declaration?.type==='ObjectExpression')bindings.set('default',n.declaration);
      if(n.type==='ImportDeclaration') {
        if(!n.source.value.startsWith('./')||!n.source.value.endsWith('.js'))throw new Error('Import no estàtic en la font de dades.');
        const dep=path.posix.normalize(path.posix.join(path.posix.dirname(rel),n.source.value));
        if(!dep.startsWith('src/sections/text/'))throw new Error('Dependència fora de les dades de text.');
        for(const spec of n.specifiers) {
          if(spec.type!=='ImportSpecifier')throw new Error('Import no anomenat en dades estàtiques.');
          imports.set(spec.local.name,{dep,name:spec.imported.name});
        }
      }
    }
    function literal(n) {
      if(!n)throw new Error('Literal estàtic absent.');
      if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return n.value;
      if(n.type==='NullLiteral')return null;
      if(n.type==='TemplateLiteral'&&!n.expressions.length)return n.quasis.map(q=>q.value.cooked).join('');
      if(n.type==='ArrayExpression')return n.elements.map(literal);
      // Object.freeze(literal) és el mateix literal: no s'executa res.
      if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.type==='Identifier'
        &&n.callee.object.name==='Object'&&n.callee.property.name==='freeze'&&n.arguments.length===1)return literal(n.arguments[0]);
      if(n.type==='ObjectExpression')return Object.fromEntries(n.properties.map(p=>{
        if(p.type!=='ObjectProperty'||p.computed)throw new Error('Objecte no estàtic.');
        return [p.key.type==='Identifier'?p.key.name:p.key.value,literal(p.value)];
      }));
      if(n.type==='Identifier') {
        if(bindings.has(n.name))return literal(bindings.get(n.name));
        const imp=imports.get(n.name);if(imp)return staticModule(imp.dep).get(imp.name);
      }
      throw new Error(`Expressió no estàtica: ${n.type}.`);
    }
    const api={get:name=>literal(bindings.get(name)),node:name=>bindings.get(name),literal};
    staticModules.set(rel,api);loading.delete(rel);return api;
  }
  for(const rel of POLITIQUES) {
    const file=confinedFile(policyRoot,path.join(policyRoot,rel));if(!file)throw new Error(`Mòdul de política absent: ${rel}`);record(file,fs.readFileSync(file),policyRoot);
  }
  const PAGE_COPY=staticModule('src/sections/text/pageContent.js').get('PAGE_COPY');
  const SOCIAL_IMAGES=hiEs('src/config/socialImages.js')
    ? staticModule('src/config/socialImages.js').get('SOCIAL_IMAGES') : {};
  const system=staticModule('src/config/systemPages.js');
  let systemArray=system.node('SYSTEM_PAGES');
  // La font viva és Object.freeze([...].map(page=>Object.freeze(page))). Només
  // es lligen descriptors literals; cap map/callback ni Object.freeze s’executa.
  while(systemArray?.type==='CallExpression') {
    const callee=systemArray.callee;
    if(callee.type==='MemberExpression'&&callee.object.type==='Identifier'&&callee.object.name==='Object'&&callee.property.name==='freeze')systemArray=systemArray.arguments[0];
    else if(callee.type==='MemberExpression'&&callee.property.name==='map')systemArray=callee.object;
    else throw new Error('Forma de SYSTEM_PAGES no reconeguda.');
  }
  if(systemArray?.type!=='ArrayExpression')throw new Error('SYSTEM_PAGES no és una llista estàtica.');
  const SYSTEM_PAGES=systemArray.elements.map(n=>{
    if(n?.type!=='ObjectExpression')throw new Error('Descriptor de sistema no estàtic.');
    return Object.fromEntries(n.properties.filter(p=>p.type==='ObjectProperty'&&['key','href','visibility','status','nomesWeb'].includes(p.key.name||p.key.value)).map(p=>[p.key.name||p.key.value,system.literal(p.value)]));
  });
  if(!PAGE_COPY||!Array.isArray(SYSTEM_PAGES))throw new Error('Fonts de pàgines de sistema invàlides.');
  // esPaginaVisible(clau,{nativa:false}) és sempre cert: la web porta totes les pàgines (nomesWeb inclòs).
  /* Les pàgines de text de sections.js (kind 'text' amb pageKey): /anima i
     /fedivers no són a SYSTEM_PAGES. sections.js importa lucide-react: es
     llig l'AST i només els literals de cada entrada. */
  const textSections=[];
  if(hiEs('src/config/sections.js')) {
    const program=parse(fs.readFileSync(sourceFile('src/config/sections.js'),'utf8'),{sourceType:'module'}).program;
    for(const n of program.body) {
      if(n.type!=='ExportNamedDeclaration'||n.declaration?.type!=='VariableDeclaration')continue;
      for(const d of n.declaration.declarations) {
        if(d.id.name!=='SECTIONS'||d.init?.type!=='ArrayExpression')continue;
        for(const element of d.init.elements) {
          if(element?.type!=='ObjectExpression')continue;
          const s=Object.fromEntries(element.properties.filter(p=>p.type==='ObjectProperty'&&!p.computed&&['StringLiteral'].includes(p.value.type))
            .map(p=>[p.key.name||p.key.value,p.value.value]));
          if(s.kind==='text'&&s.pageKey&&s.path)textSections.push(s);
        }
      }
    }
  }
  /* Ordre del Mestre (30-10-2026, prompt 2208, T1.1) · Els plugins de
     registrePlugins.js, sense executar-lo: RUTA_PLUGINS, IMATGES_PLUGINS i, de
     cada plugin({…}) de PLUGINS (dins d'Object.freeze), els camps de text
     literals que llig metadadesDePagina; la resta (obrir, data, etiquetes) no
     compta. Sense el fitxer, cap. */
  function pluginsDelRegistre() {
    const rel='src/sections/plugins/registrePlugins.js';
    if(!hiEs(rel))return [];
    const program=parse(fs.readFileSync(sourceFile(rel),'utf8'),{sourceType:'module'}).program;
    const text=n=>(n?.type==='StringLiteral'?n.value:n?.type==='TemplateLiteral'&&!n.expressions.length?n.quasis.map(q=>q.value.cooked).join(''):undefined);
    const declarades=new Map();
    for(const n of program.body)if(n.type==='ExportNamedDeclaration'&&n.declaration?.type==='VariableDeclaration')
      for(const d of n.declaration.declarations)if(d.id.type==='Identifier')declarades.set(d.id.name,d.init);
    const [ruta,carpeta]=['RUTA_PLUGINS','IMATGES_PLUGINS'].map(nom=>text(declarades.get(nom)));
    let llista=declarades.get('PLUGINS');
    while(llista?.type==='CallExpression'&&llista.callee.type==='MemberExpression'&&llista.callee.object.name==='Object'
      &&llista.callee.property.name==='freeze'&&llista.arguments.length===1)llista=llista.arguments[0];
    if(!/^\/[a-z]+$/.test(ruta||'')||!/^\/assets\/[a-z0-9/_-]+$/.test(carpeta||'')||llista?.type!=='ArrayExpression')throw new Error('PLUGINS no és una llista estàtica.');
    const CAMPS=['id','titol','subtitol','entradilla','imatgeAlt','extensioImatge'];
    return llista.elements.map(n=>{
      if(n?.type!=='CallExpression'||n.callee.type!=='Identifier'||n.callee.name!=='plugin'||n.arguments.length!==1||n.arguments[0].type!=='ObjectExpression')throw new Error('Descriptor de plugin no estàtic.');
      /* Ordre del Mestre (30-10-2026, prompt 2208; SEO-CRIT-03) · Fail-closed com
         literal(): un camp de CAMPS que no és text literal (concatenació, constant,
         template amb expressions, mètode) i una propietat estesa o calculada (pot
         portar-ne qualsevol) són porta roja. Abans, el camp es perdia en silenci i
         el build publicava un head diferent del de PluginPage. */
      const camps={};
      for(const p of n.arguments[0].properties) {
        if(p.type==='SpreadElement'||p.computed)throw new Error('Descriptor de plugin no estàtic: propietat estesa o calculada.');
        const nom=p.key.type==='Identifier'?p.key.name:p.key.value;
        if(!CAMPS.includes(nom))continue;
        const valor=p.type==='ObjectProperty'?text(p.value):undefined;
        if(valor===undefined)throw new Error(`Descriptor de plugin no estàtic: ${nom}.`);
        camps[nom]=valor;
      }
      if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(camps.id||'')||!/^(?:jpe?g|png|webp)$/.test(camps.extensioImatge||'jpg'))throw new Error('Plugin amb id o extensió invàlids.');
      return {...camps,ruta,imatge:`${carpeta}/${camps.id}_vinyeta.${camps.extensioImatge||'jpg'}`};
    });
  }
  const dictionary=Object.create(null);
  if(hiEs('src/config/idiomes/ca.js')) {
    // Només les entrades de text literal; la resta del diccionari no compta.
    const node=staticModule('src/config/idiomes/ca.js').node('default');
    for(const p of node?.properties||[]) {
      if(p.type!=='ObjectProperty'||p.computed)continue;
      const key=p.key.type==='Identifier'?p.key.name:p.key.value;
      if(p.value.type==='StringLiteral')dictionary[key]=p.value.value;
    }
  }
  const tradueix=([key,fallback])=>(typeof dictionary[key]==='string'&&dictionary[key].trim()?dictionary[key]:fallback);
  const imageOptions={origen:origin,permesos:[]};
  const routes=Object.create(null),aliases=Object.create(null);
  const baseImage=()=>{
    const {alt,type,width,height}=CAP_SOCIAL_BASE.image;
    return {url:new URL(BASE_IMAGE,origin).href,alt,width:Number(width),height:Number(height),type};
  };
  function socialImage(value,alt,{own=false,route=''}={}) {
    const input=typeof value==='string'?{url:value}:value||{};
    if(!confinedFile(root,path.join(root,'public',BASE_IMAGE)))throw new Error('Falta la imatge social de reserva.');
    let u=null;
    try {u=input.url?new URL(input.url,origin):null;} catch {u=null;}
    const invalid = !u || u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!allowedImages.has(u.origin)
      || !/\.(?:png|jpe?g|webp)$/i.test(u.pathname)|| MITJA_PRIVAT.test(u.pathname)
      || (input.type && !/^image\/(?:png|jpeg|webp)$/.test(input.type))
      || (u.origin!==origin && !CAMI_PUBLIC_DE_STORAGE.test(u.pathname))
      || (u.origin===origin && (!u.pathname.startsWith('/assets/')||!confinedFile(root,path.join(root,'public',decodeURIComponent(u.pathname)))));
    if(invalid&&input.url&&own&&estricte)throw new Error(`Imatge social no servible a ${route}.`);
    if(invalid||(u.pathname===BASE_IMAGE&&u.origin===origin))u=new URL(BASE_IMAGE,origin);
    if(u.origin===origin) {
      const asset=confinedFile(root,path.join(root,'public',decodeURIComponent(u.pathname)));
      if(!asset||fs.statSync(asset).size>32*1024*1024)throw new Error('Imatge social absent o massa gran.');
      record(asset,fs.readFileSync(asset));
    }
    if(u.pathname===BASE_IMAGE&&u.origin===origin)return baseImage();
    const image={url:u.href,alt:plainText(input.alt||alt||'Sóc de Poble',160)||plainText(alt,160)||'Sóc de Poble'};
    if(Number.isInteger(input.width)&&input.width>0&&Number.isInteger(input.height)&&input.height>0)Object.assign(image,{width:input.width,height:input.height});
    if(/^image\/(?:png|jpeg|webp)$/.test(input.type||''))image.type=input.type;
    return image;
  }
  function add(route,{title,description,image,imageAlt,type='website',own=false}) {
    const key=normalizedKey(route,origin);if(Object.hasOwn(routes,key))throw new Error(`Ruta social duplicada: ${key}`);
    const titol=plainText(title,160),descripcio=plainText(description,300);
    if(!titol||!descripcio)throw new Error(`Metadada social incompleta: ${key}`);
    routes[key]={title:titol,description:descripcio,image:socialImage(image,imageAlt||titol,{own,route:key}),type,canonical:new URL(key,origin).href,index:true};
  }
  function alias(from,to) {
    from=normalizedKey(from,origin);to=normalizedKey(to,origin);
    if(!Object.hasOwn(routes,to)||Object.hasOwn(routes,from)||Object.hasOwn(aliases,from))throw new Error(`Àlies social invàlid: ${from}`);
    aliases[from]=to;
  }
  const blocked=(route,imatge)=>{
    if(imatge?.estat==='bloquejada')throw new Error(`Imatge social bloquejada a ${route} (${imatge.motiu}): ${imatge.ref}`);
  };
  /* Pàgines: SYSTEM_PAGES i, darrere, les de text de sections.js que no hi
     són. /wikidepoble no és cap pàgina de text: és la llista de la Wiki. */
  const seen=new Set();
  const candidates=[...SYSTEM_PAGES.map(d=>({key:d.key,href:d.href,attrs:d})),
    ...textSections.map(s=>({key:s.pageKey,href:s.path,attrs:Object.fromEntries(['visibility','status'].filter(k=>Object.hasOwn(s,k)).map(k=>[k,s[k]]))}))];
  for(const {key,href,attrs} of candidates) {
    if(key==='wikidepoble'||seen.has(href))continue;seen.add(href);
    const page=Object.hasOwn(PAGE_COPY,key)?PAGE_COPY[key]:null;
    if(!page||!publicMetadata(page)||!publicSeoRoute(href,attrs))continue;
    /* /page/* són fitxes públiques del sistema; les eines /notes i /xat no entren.
       /consola entra més avall per seoConsola.js (ordre del Mestre, 30-10-2026, prompt 2208, T2.1; SEO-CRIT-06). */
    const meta=metadadesDePagina(page,imageOptions);blocked(href,meta.imatge);
    add(href,{title:meta.title,description:meta.description,image:meta.image,own:true});
    // /page/<clau> porta a la ruta pròpia (navigation.js · resolvePageSlugPath): el mateix head.
    const pageRoute=`/page/${key}`;
    if(pageRoute!==href&&resolvePageSlugPath(key)===href)alias(pageRoute,href);
  }
  if(routes['/page/descarregues'])alias('/descarregues','/page/descarregues');
  // Ordre del Mestre (30-10-2026) · /fediversity, l'adreça curta de la candidatura NLnet (App.jsx, una redirecció).
  if(routes['/page/fediversity'])alias('/fediversity','/page/fediversity');
  /* Ordre del Mestre (30-10-2026, prompt 2208, T1.2) · L'inventari de /page/<clau>
     (PAGINES_INFORMATIVES), amb la regla de PageDetailSection: una clau amb ruta
     pròpia (resolvePageSlugPath) hi redirigix i no és cap /page/ (inventari
     trencat: porta roja); esPaginaVisible és cert sempre a la web. */
  for(const key of PAGINES_INFORMATIVES) {
    const route=`/page/${key}`,canonica=resolvePageSlugPath(key);
    if(canonica)throw new Error(`Inventari social: ${route} redirigix a ${canonica}.`);
    const page=Object.hasOwn(PAGE_COPY,key)?PAGE_COPY[key]:null;
    if(!page||Object.hasOwn(routes,route)||!publicMetadata(page)||!publicSeoRoute(route))continue;
    const meta=metadadesDePagina(page,imageOptions);blocked(route,meta.imatge);
    add(route,{title:meta.title,description:meta.description,image:meta.image,own:true});
  }
  /* Ordre del Mestre (30-10-2026, prompt 2208, T1.1) · Les huit /plugin/<id>.
     registrePlugins.js importa el router (registreApps.js): es llig l'AST i
     només els literals de cada plugin({…}); la imatge és la regla de la fàbrica
     plugin(): `${IMATGES_PLUGINS}/${id}_vinyeta.${extensioImatge}`, 'jpg' per
     defecte. La paritat amb el registre de veres la fixa una prova del client
     (src/config/coberturaSocial.test.js). */
  for(const plugin of pluginsDelRegistre()) {
    const route=`${plugin.ruta}/${plugin.id}`;
    if(!publicSeoRoute(route))continue;
    const meta=metadadesDePlugin(plugin,imageOptions);blocked(route,meta.imatge);
    add(route,{title:meta.title,description:meta.description,image:meta.image,own:true});
  }
  /* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · /consola, les nou pàgines
     de la sala de màquines i les quatre del Govern del Mestre: el head del
     client (seoConsola.js · rutesPubliquesDeLaConsola, el que crida
     ConsolaSection). Dades JS del repositori, com les llavors. */
  if(hiEs(FONTS_CONSOLA[0])) {
    const [file]=FONTS_CONSOLA.filter(hiEs).map(sourceFile);
    const {rutesPubliquesDeLaConsola}=await import(`${pathToFileURL(file).href}?sha=${sha(fs.readFileSync(file))}`);
    if(typeof rutesPubliquesDeLaConsola!=='function')throw new Error('seoConsola.js no exporta rutesPubliquesDeLaConsola.');
    for(const {ruta,title,description,imatge,image} of rutesPubliquesDeLaConsola(imageOptions)) {
      if(!publicSeoRoute(ruta))continue;
      blocked(ruta,imatge);
      add(ruta,{title,description,image,own:true});
    }
  }
  const wiki=hiEs('src/data/wikiManifest.js')?staticModule('src/data/wikiManifest.js').get('wikiManifest'):null;
  const wikiItems=Array.isArray(wiki?.items)?wiki.items:[];
  if(wiki&&!Array.isArray(wiki.items))throw new Error('Manifest de la Wiki sense items.');
  if(publicSeoRoute('/wikidepoble')) {
    /* Ordre del Mestre (30-10-2026, prompt 2208, T1.3; QA-VES-02) · La portada que
       pinta la Wiki (PAGE_COPY[COVER_PAGE_KEYS.wiki]) pel selector compartit. */
    const clau=system.node('COVER_PAGE_KEYS')?system.get('COVER_PAGE_KEYS').wiki:'wikidepoble';
    const copyPortada=Object.hasOwn(PAGE_COPY,clau)?PAGE_COPY[clau]:null;
    blocked('/wikidepoble',portadaSocialDeLaWiki(copyPortada,imageOptions).imatge);
    const portada=metadadesDeDocumentWiki(null,'',wikiItems,{portada:copyPortada,...imageOptions});
    add('/wikidepoble',{title:portada.title,description:portada.description,image:portada.image??null,own:true});
  }
  for(const [route,,titleKey,descriptionKey] of LLISTES) {
    if(publicSeoRoute(route))add(route,{title:tradueix(titleKey),description:tradueix(descriptionKey),image:null});
  }
  const deLlavor=new Map();
  for(const [section,rel,name] of LLAVORS) {
    if(!hiEs(rel))continue;
    const file=sourceFile(rel);
    // Les llavors són dades JS del repositori (com les executa el build de Vite).
    const items=(await import(`${pathToFileURL(file).href}?sha=${sha(fs.readFileSync(file))}`))[name];
    if(!Array.isArray(items))throw new Error(`Llavor sense llista: ${rel}#${name}`);
    for(const item of items) {
      if(!item||typeof item!=='object'||!publicMetadata(item))continue;
      if(typeof item.id!=='string'||!ID_DETALL.test(item.id))throw new Error(`ID de llavor invàlid a ${rel}.`);
      const route=`/${section}/${item.id}`;
      const meta=metadadesDeDetall(section,item,imageOptions);blocked(route,meta.imatge);
      add(route,{title:meta.title,description:meta.description,image:meta.image,own:true});
      const key=normalizedKey(route,origin);deLlavor.set(key.toLowerCase(),key);
    }
  }
  const ids=new Set();
  for(const item of wikiItems) {
    const id=idDeDocumentWiki(item?.id);
    if(!id)throw new Error('Identitat Wiki invàlida al manifest.');
    if(ids.has(id))throw new Error(`Identitat Wiki duplicada: ${id}`);ids.add(id);
    if(!atributsPublics(item.attributes))continue;
    // El mateix head que WikiDetail (seoWiki.js): H1, H2 o descripció, i la imatge de SOCIAL_IMAGES.
    const meta=metadadesDeDocumentPublic(item,{imatges:SOCIAL_IMAGES});
    add(`/wikidepoble?${new URLSearchParams({item:id})}`,{title:meta.title,description:meta.description,image:meta.image,type:'article',own:true});
  }
  if(!Array.isArray(publicSnapshot)||publicSnapshot.length>100000)throw new Error('Snapshot públic invàlid.');
  if(Buffer.byteLength(JSON.stringify(publicSnapshot))>MAX_SNAPSHOT)throw new Error('Snapshot públic massa gran.');
  for(const item of publicSnapshot) {
    if(!item||item.visibility!=='public'||item.status!=='published'||!SOCIAL_SECTIONS.has(item.sectionId))continue;
    if(typeof item.id!=='string'||!item.id||item.id.length>160||/[\u0000- /?#\\]/.test(item.id))throw new Error('ID de publicació invàlid.');
    const route=`/${item.sectionId}/${encodeURIComponent(item.id)}`;
    // QA-H04 · La remota substituïx la llavor del mateix camí, també amb altres majúscules (mai una pàgina, una llista ni la Wiki).
    const plegada=normalizedKey(route,origin).toLowerCase();
    if(deLlavor.has(plegada)){delete routes[deLlavor.get(plegada)];deLlavor.delete(plegada);}
    add(route,{title:item.title,description:item.description,image:item.image,imageAlt:item.imageAlt,type:'article',own:strictSnapshot});
  }
  if(publicSnapshot.length)sources.set('projection:public-section-submissions',sha(JSON.stringify(publicSnapshot)));
  for(const [file,digest] of sourcePaths)if(sha(fs.readFileSync(file))!==digest)throw new Error('Una font ha canviat durant el build; regenereu el manifest.');
  const manifest={schema:'sdp.social-manifest.v1',origin,routes:Object.fromEntries(Object.entries(routes).sort(([a],[b])=>a.localeCompare(b))),aliases:Object.fromEntries(Object.entries(aliases).sort(([a],[b])=>a.localeCompare(b)))};
  const inputSources=Object.fromEntries([...sources].sort(([a],[b])=>a.localeCompare(b)));
  const evidence={hashSrc:sha(JSON.stringify(inputSources)),hashManifest:sha(JSON.stringify(manifest)),sources:inputSources};
  return {manifest,evidence};
}

/** El --snapshot de les CLI (aquesta i prerender-social.mjs): un .json regular de 8 MiB com a màxim. */
export function llegixSnapshot(fitxer) {
  const st=fs.lstatSync(fitxer);
  if(!st.isFile()||st.size>MAX_SNAPSHOT||!fitxer.endsWith('.json'))throw new Error('El snapshot ha de ser un JSON regular de 8MiB com a màxim.');
  return JSON.parse(fs.readFileSync(fitxer,'utf8'));
}

async function main(argv) {
  const args={};
  for(let i=0;i<argv.length;i+=2) {
    const k=argv[i];if(!['--root','--origin','--out','--evidence','--snapshot','--policy-root'].includes(k)||!argv[i+1]||args[k])throw new Error('Ús: --root RUTA --origin HTTPS [--out JSON] [--evidence JSON] [--snapshot JSON]');args[k]=argv[i+1];
  }
  const publicSnapshot=args['--snapshot']?llegixSnapshot(args['--snapshot']):[];
  const result=await buildSocialManifest({root:args['--root'],origin:args['--origin'],policyRoot:args['--policy-root']||args['--root'],publicSnapshot});
  const json=JSON.stringify(result.manifest,null,2)+'\n';
  if(args['--out'])fs.writeFileSync(args['--out'],json);else process.stdout.write(json);
  if(args['--evidence'])fs.writeFileSync(args['--evidence'],JSON.stringify(result.evidence,null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
