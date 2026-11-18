import {IDIOMES_TAXONOMIA,nomCategoriaCanonica,nomEtiquetaCanonica,nomEstructural} from './taxonomiaCanonica.js';
import {esPublicada} from '../../config/publicationPolicy.js';

/** Classificació editorial explícita: mai s'inferix del títol o d'una etiqueta antiga.
 * P6 (directriu 261003_2325 del Mestre, destinsControl.js) · Les huit pàgines d'acció de DESTINS_CONTROL
 * (publicar_mur, publicar_mercat, publicar_calendari, publicar_mapa, vehicle_compartit, animalets, treball i
 * habitatge) no porten cap etiqueta: no entren en esta taula i conserven el seu `labels: []`. Cap d'elles és a
 * SYSTEM_PAGES ni al Mur (targetesMur.js), que són els únics llocs que demanen la clau pública. Arbitratge R46, Loop 3. */
export const CLASSIFICACIO_PAGINES_PUBLIQUES=Object.freeze({
 projecte:['tecnologia-lliure','Projecte Sóc de Poble','Projectes'],
 constitucio:['comunitat-rural','Associacionisme','Documentació'],
 legal:['tecnologia-lliure','Documentació'],
 disseny:['tecnologia-lliure','Pedra Seca','Documentació'],
 anima:['tecnologia-lliure','Node 0','Documentació'],
 notes:['tecnologia-lliure','Documentació'],
 versions:['tecnologia-lliure','Documentació'],
 roadmap:['tecnologia-lliure','Projectes','Documentació'],
 notes_shared:['tecnologia-lliure','Documentació'],
 wikidepoble:['patrimoni-cultura','Documentació'],
 fedivers:['tecnologia-lliure','NGI Fediversity','Node 0'],
 consola:['tecnologia-lliure','Node 0','Documentació'],
 cervell:['tecnologia-lliure','Node 0','Documentació'],
 xat:['comunitat-rural','Associacionisme'],
 'drets-autor':['patrimoni-cultura','Documentació'],
 descarregues:['tecnologia-lliure','Documentació'],
 fediversity:['tecnologia-lliure','NGI Fediversity','Documentació'],
 'node-zero':['tecnologia-lliure','Node 0'],
 'anatomia-rural':['natura-excursions','Patrimoni','Pou de neu','Pedra Seca'],
 herbari:['natura-excursions','Herbari'],
 'banc-de-llavors':['recursos-locals','Llavors'],
 'rutes-de-poble':['natura-excursions','Rutes'],
 'arbres-monumentals':['natura-excursions','Arbres Monumentals'],
 // Onada R14 · El receptari «Què dinem?» (Muro, El Comtat, 2019): cultura i patrimoni del poble.
 'la-iaia-sabuda':['patrimoni-cultura','Documentació'],
 receptes:['patrimoni-cultura','Patrimoni'],
 dispositius:['tecnologia-lliure','Documentació']
});

const clausDePaginesPubliques=new WeakMap();
/** Identitat registrada o context explícit del consumidor públic; mai títols o etiquetes. */
export const clauDePaginaPublica=(page,publicKey)=>{
 if(!esPublicada(page)||page.private===true||page.draft===true||page.isDraft===true||page.published===false||page.is_published===false)return undefined;
 return clausDePaginesPubliques.get(page)??(Object.hasOwn(CLASSIFICACIO_PAGINES_PUBLIQUES,publicKey)?publicKey:undefined);
};

export function etiquetesDePaginaPublica(key,originals=[],idioma='ca'){
 if(!Object.hasOwn(CLASSIFICACIO_PAGINES_PUBLIQUES,key))return originals;
 const row=CLASSIFICACIO_PAGINES_PUBLIQUES[key];
 const language=IDIOMES_TAXONOMIA.includes(idioma)?idioma:'ca';
 // La versió és metadada d’edició, no una segona etiqueta «Sistema» ni un tag editorial.
 const version=key==='versions'?(Array.isArray(originals)?originals:[]).filter(label=>label?.className==='sdp-badge-system'&&/^v\d/.test(label.text)).map(label=>({text:label.text,className:label.className})):[];
 const [category,...tags]=row;
 // Arbitratge R46, Loop 3 · La pastilla de versió va primer, com a HEAD (T8 · D-12, pageContent.versions.test.js).
 const labels=[...version,{text:nomEstructural('Sistema',language),className:'sdp-badge-system'},{text:nomCategoriaCanonica(category,language),className:'sdp-badge-category'},...tags.map(name=>({text:nomEtiquetaCanonica(name,language),className:'sdp-badge-tag'}))];
 return language==='ca'?labels:labels.map(label=>({...label,lang:language}));
}

/** No HTML, dates, autoria ni llengua del cos canvien. Les traduccions existents conserven tots els camps. */
export function aplicaClassificacioPaginesPubliques(copy){
 for(const [key,page] of Object.entries(copy)){
  if(!Object.hasOwn(CLASSIFICACIO_PAGINES_PUBLIQUES,key)||!clauDePaginaPublica(page,key))continue;
  clausDePaginesPubliques.set(page,key);
  const originals=page.labels||[];
  page.labels=etiquetesDePaginaPublica(key,originals);
  for(const [language,translated] of Object.entries(page.translations||{}))translated.labels=etiquetesDePaginaPublica(key,originals,language);
 }
}
