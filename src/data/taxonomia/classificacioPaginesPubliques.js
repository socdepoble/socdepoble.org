import {IDIOMES_TAXONOMIA,nomCategoriaCanonica,nomEtiquetaCanonica,nomEstructural} from './taxonomiaCanonica.js';
import {esPublicada} from '../../config/publicationPolicy.js';

/** IDEA-365: P6 derogada. Destins explícits, mai inferits del títol.
 * v1.2.26 (C26-1 #5 i C26-2 #11) · Les etiquetes ja passen pel triatge 1–49 d'IDEA-369 (taxonomiaPublicacio.js ·
 * TRIATGE_ETIQUETES_1_49): #48 «NGI Fediversity» és retirada; #34 «Projecte Sóc de Poble» és l'entitat
 * @Sóc de Poble, que ja signa la boina taronja, i ix de les etiquetes; #30 «Patrimoni» ix per redundància amb la
 * mare Natura i Patrimoni; #5 «Arbres Monumentals» és ara «Arbres»; #46 Receptes és l'etiqueta del receptari, i
 * #33 «Pou de neu» passa a la capa geogràfica (GEOGRAFIA_DE_PAGINA). «Associacionisme» (#1) continua en pausa. */
export const CLASSIFICACIO_PAGINES_PUBLIQUES=Object.freeze({
 projecte:['tecnologia-lliure','Projectes'],
 constitucio:['comunitat-rural','Associacionisme','Documentació'],
 legal:['tecnologia-lliure','Documentació'],
 disseny:['tecnologia-lliure','Disseny','Documentació'],
 anima:['tecnologia-lliure','Node 0','Documentació'],
 notes:['tecnologia-lliure','Documentació'],
 versions:['tecnologia-lliure','Documentació'],
 roadmap:['tecnologia-lliure','Projectes','Documentació'],
 notes_shared:['tecnologia-lliure','Documentació'],
 wikidepoble:['patrimoni-cultura','Documentació'],
 fedivers:['tecnologia-lliure','Node 0'],
 consola:['tecnologia-lliure','Node 0','Documentació'],
 cervell:['tecnologia-lliure','Node 0','Documentació'],
 xat:['comunitat-rural','Associacionisme'],
 'drets-autor':['patrimoni-cultura','Documentació'],
 reconeixements:['tecnologia-lliure','Documentació'],
 descarregues:['tecnologia-lliure','Documentació'],
 fediversity:['tecnologia-lliure','Documentació'],
 'node-zero':['tecnologia-lliure','Node 0'],
 'anatomia-rural':['natura-excursions','Pedra Seca'],
 herbari:['natura-excursions','Herbari'],
 'banc-de-llavors':['recursos-locals','Llavors'],
 'rutes-de-poble':['natura-excursions','Rutes'],
 'arbres-monumentals':['natura-excursions','Arbres'],
 'la-iaia-sabuda':['patrimoni-cultura','Documentació'],
 // Onada R14 · La biblioteca dels receptaris («Què dinem?», Muro, El Comtat, 2019, n'és el primer llibre).
 receptes:['patrimoni-cultura','Receptes'],
 dispositius:['tecnologia-lliure','Documentació'],
 // IDEA-287 · La guia pas a pas de totes les eines (pageContent.potsFer.js).
 'tot-el-que-pots-fer':['comunitat-rural','Documentació'],
 // IDEA-348 · Joc públic viu «Cada cosa al seu lloc» amb les 600 publicacions d'El Rentonar i Sóc de Poble.
 'cada-cosa-al-seu-lloc':['tecnologia-lliure','Documentació']
});

/** IDEA-369 #33 (00:36) · El Pou de neu és un paratge de La Torre (IDEA-360): capa geogràfica en text, no etiqueta. */
export const GEOGRAFIA_DE_PAGINA=Object.freeze({'anatomia-rural':Object.freeze(['Pou de neu'])});

const congela=noms=>Object.freeze(noms);
/* IDEA-365 (Llibre Mestre, línia 3803; regla 1 del 21:40) · Totes les cards que es mostren al /mur porten la
   categoria Mur, i llevar-la-hi la trau del Mur (targetesMur.js · targetesDeSistema). Les 16 pàgines de
   SYSTEM_PAGES que el Mur barreja porten Sistema + Mur; la resta de pàgines tècniques, només Sistema.
   IDEA-365 (22:16, punt 3) i IDEA-367 (23:06, punt 3) · Les 5 biblioteques i «Què dinem?» són FORA Sistema. */
const SISTEMA_I_MUR=congela(['Sistema','Mur']);
const CATALEG_AL_MUR=congela(['Mur','Catàlegs']);
export const SISTEMES_DE_PAGINA=Object.freeze({
 projecte:SISTEMA_I_MUR, wikidepoble:SISTEMA_I_MUR, constitucio:SISTEMA_I_MUR, roadmap:SISTEMA_I_MUR, notes:SISTEMA_I_MUR,
 disseny:SISTEMA_I_MUR, consola:SISTEMA_I_MUR, cervell:SISTEMA_I_MUR, versions:SISTEMA_I_MUR, legal:SISTEMA_I_MUR,
 xat:SISTEMA_I_MUR, 'drets-autor':SISTEMA_I_MUR, reconeixements:SISTEMA_I_MUR, descarregues:SISTEMA_I_MUR,
 'la-iaia-sabuda':SISTEMA_I_MUR, 'cada-cosa-al-seu-lloc':SISTEMA_I_MUR, fediversity:SISTEMA_I_MUR,
 'que-dinem':congela(['Mur','Catàlegs','PDF']),
 herbari:CATALEG_AL_MUR, 'banc-de-llavors':CATALEG_AL_MUR,
 'rutes-de-poble':CATALEG_AL_MUR, 'arbres-monumentals':CATALEG_AL_MUR, receptes:CATALEG_AL_MUR,
 publicar_mur:congela(['Sistema','Mur']), publicar_mercat:congela(['Sistema','Mercat']), publicar_calendari:congela(['Sistema','Calendari']),
 publicar_mapa:congela(['Sistema','Mapa']), vehicle_compartit:congela(['Sistema','Transport']), animalets:congela(['Sistema','Animalets']),
 treball:congela(['Sistema','Treball']), habitatge:congela(['Sistema','Habitatge'])
});
const NOMES_SISTEMA=congela(['Sistema']);
/** Les Categories de Sistema d'una pàgina pública (IDEA-365): la taula, o només Sistema. Mai del títol. */
export const categoriesSistemaDePagina=key=>(Object.hasOwn(SISTEMES_DE_PAGINA,key)?SISTEMES_DE_PAGINA[key]:NOMES_SISTEMA);
const esClauPublica=key=>Object.hasOwn(CLASSIFICACIO_PAGINES_PUBLIQUES,key)||Object.hasOwn(SISTEMES_DE_PAGINA,key);
const clausDePaginesPubliques=new WeakMap();
/** Identitat registrada o context explícit del consumidor públic; mai títols o etiquetes. */
export const clauDePaginaPublica=(page,publicKey)=>{
 if(!esPublicada(page)||page.private===true||page.draft===true||page.isDraft===true||page.published===false||page.is_published===false)return undefined;
 return clausDePaginesPubliques.get(page)??(esClauPublica(publicKey)?publicKey:undefined);
};

export function etiquetesDePaginaPublica(key,originals=[],idioma='ca'){
 if(!esClauPublica(key))return originals;
 const row=CLASSIFICACIO_PAGINES_PUBLIQUES[key]??[];
 const language=IDIOMES_TAXONOMIA.includes(idioma)?idioma:'ca';
 // La versió és metadada d’edició, no una segona etiqueta «Sistema» ni un tag editorial.
 const version=key==='versions'?(Array.isArray(originals)?originals:[]).filter(label=>label?.className==='sdp-badge-system'&&/^v\d/.test(label.text)).map(label=>({text:label.text,className:label.className})):[];
 const [category,...tags]=row;
 // Arbitratge R46, Loop 3 · La pastilla de versió va primer, com a HEAD (T8 · D-12, pageContent.versions.test.js).
 const labels=[...version,...categoriesSistemaDePagina(key).map(nom=>({text:nomEstructural(nom,language),className:'sdp-badge-system'})),...(category?[{text:nomCategoriaCanonica(category,language),className:'sdp-badge-category'}]:[]),...tags.map(name=>({text:nomEtiquetaCanonica(name,language),className:'sdp-badge-tag'}))];
 return language==='ca'?labels:labels.map(label=>({...label,lang:language}));
}

/** No HTML, dates, autoria ni llengua del cos canvien. Les traduccions existents conserven tots els camps. */
export function aplicaClassificacioPaginesPubliques(copy){
 for(const [key,page] of Object.entries(copy)){
  if(!esClauPublica(key)||!clauDePaginaPublica(page,key))continue;
  clausDePaginesPubliques.set(page,key);
  const originals=page.labels||[];
  page.labels=etiquetesDePaginaPublica(key,originals);
  if(Object.hasOwn(GEOGRAFIA_DE_PAGINA,key)&&!Array.isArray(page.paratges))page.paratges=[...GEOGRAFIA_DE_PAGINA[key]];
  for(const [language,translated] of Object.entries(page.translations||{}))translated.labels=etiquetesDePaginaPublica(key,originals,language);
 }
}
