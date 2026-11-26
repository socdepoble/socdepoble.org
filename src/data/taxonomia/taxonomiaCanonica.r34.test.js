import {expect,test} from 'vitest';
import {CATEGORIES_CANONIQUES,IDIOMES_TAXONOMIA,NOMS_ETIQUETES_CANONIQUES_49,localitzaCategoriesMares,nomCategoriaCanonica,nomEtiquetaCanonica,nomEstructural,slugTaxonomia} from './taxonomiaCanonica.js';
import {CLASSIFICACIO_PAGINES_PUBLIQUES,etiquetesDePaginaPublica} from './classificacioPaginesPubliques.js';
import {FACETA_4_ETIQUETES_SKOS,ARTICLES_SIMULADOR_IA_425,CLAU_STORAGE_TAXONOMIA_ADMIN,llegeixEstatTaxonomiaAdmin,desaEstatTaxonomiaAdmin} from './tesaurusDoctoralSocDePoble.js';
import {MAX_TEXT,validaTaxonomia,aplicaPersonalitzacio,categoriesBase,etiquetesBase} from '../personalitzacio.js';
import {PAGE_COPY} from '../../sections/text/pageContent.js';
import {localitzaPagina} from '../../sections/text/pageContent.r10.js';
import {DESTINS_CONTROL} from '../../sections/control/destinsControl.js';
import {ETIQUETES_COMUNES,ETIQUETES_LOCALS_SEED,TRIATGE_ETIQUETES_1_49} from './taxonomiaPublicacio.js';

test('R34 · el catàleg tanca6 mares/49 noms amb49 registres SKOS actius diferents',()=>{
 expect(CATEGORIES_CANONIQUES.map(c=>c.id)).toEqual(['defensa-territori','recursos-locals','natura-excursions','patrimoni-cultura','comunitat-rural','tecnologia-lliure']);
 const active=FACETA_4_ETIQUETES_SKOS.filter(t=>t.canonica);
 expect(active).toHaveLength(49);expect(new Set(active.map(t=>t.name)).size).toBe(49);
 expect(active.map(t=>t.name).sort()).toEqual([...NOMS_ETIQUETES_CANONIQUES_49].sort());
 for(const name of['Pedra Seca','Herbari','Llavors','Arbres Monumentals','Pou de neu','NGI Fediversity','Node 0'])expect(active.some(t=>t.name===name)).toBe(true);
});

test('R34 · es conserva el nom original dels425 articles i es projecten sols etiquetes canòniques',()=>{
 expect(ARTICLES_SIMULADOR_IA_425).toHaveLength(425);
 const example=ARTICLES_SIMULADOR_IA_425.find(a=>a.id===17360);
 expect(example.etiquetesOriginals).toContain('Reivindicant');expect(example.etiquetesOriginals).toContain('Posant en Valor els Recursos Locals');
 const route=ARTICLES_SIMULADOR_IA_425.find(a=>a.etiquetesOriginals.includes('Excursions'));expect(route).toBeTruthy();expect(route.etiquetesNetes).toContain('Rutes');
 for(const article of ARTICLES_SIMULADOR_IA_425)for(const name of article.etiquetesNetes)expect(NOMS_ETIQUETES_CANONIQUES_49).toContain(name);
});

test('R34 · l’estat admin antic no reactiva termes retirats ni incorpora claus desconegudes',()=>{
 const state={categoriesActives:{inventada:true,'defensa-territori':false},etiquetesActives:{reivindicant:true,'posant-en-valor-els-recursos-locals':true,esdeveniments:true,'node-0':false,inventada:true}};
 const storage={value:null,getItem(key){expect(key).toBe(CLAU_STORAGE_TAXONOMIA_ADMIN);return this.value;},setItem(key,value){expect(key).toBe(CLAU_STORAGE_TAXONOMIA_ADMIN);this.value=value;}};
 desaEstatTaxonomiaAdmin(state,storage);const restored=llegeixEstatTaxonomiaAdmin(storage);
 expect(restored.categoriesActives['defensa-territori']).toBe(false);expect(Object.hasOwn(restored.categoriesActives,'inventada')).toBe(false);
 expect(restored.etiquetesActives['node-0']).toBe(false);expect(Object.hasOwn(restored.etiquetesActives,'inventada')).toBe(false);
 for(const tag of FACETA_4_ETIQUETES_SKOS.filter(t=>!t.canonica))expect(restored.etiquetesActives[tag.slug]).toBe(false);
});

test('R34 · el roundtrip JSON administra mares llargues amb límit64, sense markup ni controls',()=>{
 const categories=CATEGORIES_CANONIQUES.map(c=>c.labels.ca),payload=JSON.parse(JSON.stringify({v:1,categories,etiquetes:NOMS_ETIQUETES_CANONIQUES_49,pagines:{fediversity:{labels:[{text:categories[0],className:'sdp-badge-category'}]}}}));
 expect(MAX_TEXT).toBe(64);expect(validaTaxonomia(payload)).toEqual([]);expect(categoriesBase(payload)).toEqual(expect.arrayContaining(categories));expect(etiquetesBase(payload)).toEqual(NOMS_ETIQUETES_CANONIQUES_49);
 expect(aplicaPersonalitzacio({fediversity:{labels:[]}},payload).fediversity.labels[0].text).toBe(categories[0]);
 for(const text of['x'.repeat(65),'<img src=x onerror=alert(1)>','text\u0000ocult','text\nseparat']){
  expect(validaTaxonomia({v:1,categories:[text]}).length).toBeGreaterThan(0);
  expect(validaTaxonomia({v:1,pagines:{fediversity:{labels:[{text,className:'sdp-badge-tag'}]}}}).length).toBeGreaterThan(0);
 }
});

test('R34 · un config antic migra alias coneguts sense tocar textos privats ni classificar-los per inferència',()=>{
 const payload={v:1,pagines:{notes:{labels:[{text:'Productivitat',className:'sdp-badge-category'},{text:'Tutorial',className:'sdp-badge-tag'},{text:'El meu quadern',className:'sdp-badge-neutral'}]}}};
 const original={notes:{html:'cos intacte',labels:[]}};const result=aplicaPersonalitzacio(original,payload);
 expect(result.notes.labels.map(l=>l.text)).toEqual([nomCategoriaCanonica('tecnologia-lliure'),'Documentació','El meu quadern']);expect(result.notes.html).toBe(original.notes.html);expect(original.notes.labels).toEqual([]);
 const oldCategories=['🥾 Natura, Excursions i Camins','🏛️ Patrimoni, Cultura, Música i Llengua','🤝 Comunitat, Associacionisme i Món Rural'];
 const restored=categoriesBase({v:1,categories:oldCategories});expect(restored).toHaveLength(7);for(const old of oldCategories)expect(restored).not.toContain(old);
 expect(etiquetesBase({v:1,etiquetes:['Noves tecnologies','reivindicant','PROJECTE TIC']})).toEqual(NOMS_ETIQUETES_CANONIQUES_49);
});

const senseEtiquetaEnCapLlengua=(key,text)=>IDIOMES_TAXONOMIA.every(language=>!localitzaPagina(PAGE_COPY[key],language).labels.some(l=>l.text===nomEtiquetaCanonica(text,language)));
const PENDENTS_DEL_TRIATGE=TRIATGE_ETIQUETES_1_49.filter(t=>t.tipus==='pendent').map(t=>t.original);
const ACTIVES=[...ETIQUETES_COMUNES.map(e=>e.nom),...ETIQUETES_LOCALS_SEED.map(e=>e.nom),...PENDENTS_DEL_TRIATGE];
test('C26-1 #5 · cap etiqueta de pàgina és retirada, entitat, pilar ni paratge del triatge 1–49',()=>{
 const fora=new Map(TRIATGE_ETIQUETES_1_49.filter(t=>['retirada','entitat','pilar','geografia'].includes(t.tipus)).map(t=>[t.original,t.tipus]));
 expect([...fora.keys()]).toEqual(expect.arrayContaining(['NGI Fediversity','Projecte Sóc de Poble','Patrimoni','Pou de neu']));
 for(const [key,[,...tags]] of Object.entries(CLASSIFICACIO_PAGINES_PUBLIQUES))for(const tag of tags)expect([key,tag,fora.get(tag)??null]).toEqual([key,tag,null]);
 // #5 · Arbres Monumentals ja és Arbres, i #46 · el receptari porta Receptes.
 expect(CLASSIFICACIO_PAGINES_PUBLIQUES['arbres-monumentals']).toEqual(['natura-excursions','Arbres']);
 expect(CLASSIFICACIO_PAGINES_PUBLIQUES.receptes).toEqual(['patrimoni-cultura','Receptes']);
 // #33 · El Pou de neu és capa geogràfica (IDEA-360), no etiqueta.
 expect(PAGE_COPY['anatomia-rural'].paratges).toEqual(['Pou de neu']);
 expect(senseEtiquetaEnCapLlengua('anatomia-rural','Pou de neu')).toBe(true);
 expect(PENDENTS_DEL_TRIATGE).toEqual(['Associacionisme','El Camí','Opinió']);
});

test('R32.9 + IDEA-287 + IDEA-340 · les 36 pàgines conserven labels canònics en 5 idiomes; sistema-nervios viu al llibre',()=>{
 expect(Object.keys(PAGE_COPY)).toHaveLength(37); // R32.86 · + «Cada cosa al seu lloc». v1.2.26 · «Què dinem?» és card, no pàgina (C26-2 #4).
 expect(CLASSIFICACIO_PAGINES_PUBLIQUES['tot-el-que-pots-fer']).toEqual(['comunitat-rural','Documentació']);
 expect(PAGE_COPY).not.toHaveProperty('sistema-nervios');
 expect(CLASSIFICACIO_PAGINES_PUBLIQUES).not.toHaveProperty('sistema-nervios');
 expect(PAGE_COPY.dispositius.title).toBe('Compatibilitat de connexió');
 expect(CLASSIFICACIO_PAGINES_PUBLIQUES.dispositius).toEqual(['tecnologia-lliure','Documentació']);
 // Arbitratge R46, Loop 3 (L2-04) · P6 (directriu 261003_2325 del Mestre): les 8 pàgines d'acció de DESTINS_CONTROL no porten cap etiqueta.
 const accio=DESTINS_CONTROL.map(d=>d.pagina);expect(accio).toHaveLength(8);
 expect(Object.keys(CLASSIFICACIO_PAGINES_PUBLIQUES).sort()).toEqual(Object.keys(PAGE_COPY).filter(key=>!accio.includes(key)).sort());
 const destins=['Mur','Mercat','Calendari','Mapa','Transport','Animalets','Treball','Habitatge'];
 for(const language of IDIOMES_TAXONOMIA)for(const [i,key] of accio.entries())expect(localitzaPagina(PAGE_COPY[key],language).labels.map(l=>l.text)).toEqual(['Sistema',destins[i]].map(n=>nomEstructural(n,language)));
 for(const language of IDIOMES_TAXONOMIA)for(const [key,page] of Object.entries(PAGE_COPY)){
  if(accio.includes(key))continue;
  const localized=localitzaPagina(page,language),row=CLASSIFICACIO_PAGINES_PUBLIQUES[key];
  expect(localized.labels.some(l=>l.className==='sdp-badge-category'&&l.text===nomCategoriaCanonica(row[0],language)),`${key}/${language}`).toBe(true);
  /* C26-1 #5 · IDEA-369 (triatge 1–49, 00:24–00:43) · Cada etiqueta és del vocabulari actiu: una comuna de la xarxa
     (ETIQUETES_COMUNES, en la seua llengua) o una local; mai les 49 històriques. Els pendents del triatge (#1, #13, #29)
     continuen en pausa fins a la decisió del Mestre. */
  for(const label of localized.labels.filter(l=>l.className==='sdp-badge-tag'))expect(ACTIVES.some(name=>nomEtiquetaCanonica(name,language)===label.text),`${key}/${language}/${label.text}`).toBe(true);
 }
 for(const language of IDIOMES_TAXONOMIA){const labels=localitzaPagina(PAGE_COPY.notes_shared,language).labels.map(l=>l.text);expect(labels).not.toContain(nomEstructural('Mur',language));expect(labels).toContain(nomEstructural('Sistema',language));}
});

test('R41 · fora de PAGE_COPY la localització no reclassifica pàgines ni inventa traduccions',()=>{
 const local={html:'cos en valencià',contentLanguage:'ca',labels:[{text:nomCategoriaCanonica('tecnologia-lliure'),className:'sdp-badge-category'}]};
 const result=localitzaPagina(local,'en');expect(result).toBe(local);expect(result.html).toBe(local.html);expect(result.contentLanguage).toBe('ca');expect(result.labels[0].text).toBe(nomCategoriaCanonica('tecnologia-lliure'));expect(result.translations).toBeUndefined();
 const external={html:'source',labels:[{text:'Author supplied label',className:'sdp-badge-neutral'}]};expect(localitzaPagina(external,'en')).toBe(external);
});

test('IDEA-365 · P6 derogada: publicar i habitatge reben destins explícits',()=>{
 expect(etiquetesDePaginaPublica('publicar_mur',[]).map(l=>l.text)).toEqual(['Sistema','Mur']);
 for(const language of IDIOMES_TAXONOMIA)expect(etiquetesDePaginaPublica('habitatge',[],language).map(l=>l.text)).toEqual(['Sistema','Habitatge'].map(n=>nomEstructural(n,language)));
});

test('Cadena R11, Loop 3 (L2-09) · les mares del Mur i dels detalls, en la llengua de la interfície; el text lliure, tal qual',()=>{
 const labels=[{text:nomCategoriaCanonica('defensa-territori'),className:'sdp-badge-category sp-card-label--enllac',href:'/calendari?vista=mes&date=2023-01-29'},{text:'Aplec pel Territori',className:'sdp-badge-tag'},{text:'Muro',className:'sdp-badge-tag'},{text:'Planos',className:'sdp-badge-tag'}];
 expect(localitzaCategoriesMares(labels,'ca')).toBe(labels);
 for(const language of IDIOMES_TAXONOMIA.slice(1)){
  const result=localitzaCategoriesMares(labels,language);
  expect(result[0]).toEqual({...labels[0],text:nomCategoriaCanonica('defensa-territori',language)});
  expect(result.slice(1)).toEqual(labels.slice(1));
  // D'una llengua a una altra, també (una mare ja traduïda torna a la de la interfície).
  expect(localitzaCategoriesMares(result,'ca')[0].text).toBe(labels[0].text);
 }
 const lliures=[{text:'Muro',className:'sdp-badge-system'}];expect(localitzaCategoriesMares(lliures,'en')).toBe(lliures);
 // v1.2.26 · Opció A · Sense href, la mare traduïda porta a la pàgina del text cru que l'element porta (el que troba
 // PaginaEditorialEtiqueta), no a /categoria/<text traduït>; en valencià, la píndola de sempre.
 const crua=[{text:nomCategoriaCanonica('defensa-territori'),className:'sdp-badge-category'}];
 expect(localitzaCategoriesMares(crua,'ca')).toBe(crua);
 for(const language of IDIOMES_TAXONOMIA.slice(1)){
  const [mare]=localitzaCategoriesMares(crua,language);
  expect(mare.text).toBe(nomCategoriaCanonica('defensa-territori',language));
  expect(mare.href).toBe(`/categoria/${slugTaxonomia(crua[0].text)}`);
 }
 expect(localitzaCategoriesMares(undefined,'en')).toBeUndefined();
});
