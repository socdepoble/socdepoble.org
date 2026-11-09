import {expect,test} from 'vitest';
import {CATEGORIES_CANONIQUES,IDIOMES_TAXONOMIA,NOMS_ETIQUETES_CANONIQUES_49,localitzaCategoriesMares,nomCategoriaCanonica,nomEtiquetaCanonica,nomEstructural} from './taxonomiaCanonica.js';
import {CLASSIFICACIO_PAGINES_PUBLIQUES,etiquetesDePaginaPublica} from './classificacioPaginesPubliques.js';
import {FACETA_4_ETIQUETES_SKOS,ARTICLES_SIMULADOR_IA_425,CLAU_STORAGE_TAXONOMIA_ADMIN,llegeixEstatTaxonomiaAdmin,desaEstatTaxonomiaAdmin} from './tesaurusDoctoralSocDePoble.js';
import {MAX_TEXT,validaTaxonomia,aplicaPersonalitzacio,categoriesBase,etiquetesBase} from '../personalitzacio.js';
import {PAGE_COPY} from '../../sections/text/pageContent.js';
import {localitzaPagina} from '../../sections/text/pageContent.r10.js';
import {DESTINS_CONTROL} from '../../sections/control/destinsControl.js';

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

test('R41 · totes les 32 pàgines (31 + /page/receptes d’R14) i els seus labels són canònics en5 idiomes, amb Sistema i sense Mur',()=>{
 expect(Object.keys(PAGE_COPY)).toHaveLength(32);
 // Arbitratge R46, Loop 3 (L2-04) · P6 (directriu 261003_2325 del Mestre): les 8 pàgines d'acció de DESTINS_CONTROL no porten cap etiqueta.
 const accio=DESTINS_CONTROL.map(d=>d.pagina);expect(accio).toHaveLength(8);
 expect(Object.keys(CLASSIFICACIO_PAGINES_PUBLIQUES).sort()).toEqual(Object.keys(PAGE_COPY).filter(key=>!accio.includes(key)).sort());
 for(const language of IDIOMES_TAXONOMIA)for(const key of accio)expect([key,language,localitzaPagina(PAGE_COPY[key],language).labels]).toEqual([key,language,[]]);
 for(const language of IDIOMES_TAXONOMIA)for(const [key,page] of Object.entries(PAGE_COPY)){
  if(accio.includes(key))continue;
  const localized=localitzaPagina(page,language),row=CLASSIFICACIO_PAGINES_PUBLIQUES[key];
  expect(localized.labels.some(l=>l.className==='sdp-badge-category'&&l.text===nomCategoriaCanonica(row[0],language)),`${key}/${language}`).toBe(true);
  for(const label of localized.labels.filter(l=>l.className==='sdp-badge-tag'))expect(NOMS_ETIQUETES_CANONIQUES_49.some(name=>nomEtiquetaCanonica(name,language)===label.text),`${key}/${language}/${label.text}`).toBe(true);
 }
 for(const language of IDIOMES_TAXONOMIA){const labels=localitzaPagina(PAGE_COPY.notes_shared,language).labels.map(l=>l.text);expect(labels).not.toContain(nomEstructural('Mur',language));expect(labels).toContain(nomEstructural('Sistema',language));}
});

test('R41 · fora de PAGE_COPY la localització no reclassifica pàgines ni inventa traduccions',()=>{
 const local={html:'cos en valencià',contentLanguage:'ca',labels:[{text:nomCategoriaCanonica('tecnologia-lliure'),className:'sdp-badge-category'}]};
 const result=localitzaPagina(local,'en');expect(result).toBe(local);expect(result.html).toBe(local.html);expect(result.contentLanguage).toBe('ca');expect(result.labels[0].text).toBe(nomCategoriaCanonica('tecnologia-lliure'));expect(result.translations).toBeUndefined();
 const external={html:'source',labels:[{text:'Author supplied label',className:'sdp-badge-neutral'}]};expect(localitzaPagina(external,'en')).toBe(external);
});

test('Arbitratge R46, Loop 3 (L2-04) · P6: una pàgina d’acció és fora de la taula i conserva les seues etiquetes tal qual',()=>{
 const originals=[];expect(etiquetesDePaginaPublica('publicar_mur',originals)).toBe(originals);
 for(const language of IDIOMES_TAXONOMIA)expect(etiquetesDePaginaPublica('habitatge',[],language)).toEqual([]);
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
 expect(localitzaCategoriesMares(undefined,'en')).toBeUndefined();
});
