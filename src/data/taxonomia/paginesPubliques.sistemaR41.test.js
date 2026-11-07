/** Portable independent oracle. Place at src/data/taxonomia/independentR41.test.js.
 * Expectations are literal editorial fixtures, never CLASSIFICACIO or the
 * production localisation functions. No candidate source is edited by this file. */
import {describe,it,expect} from 'vitest';
import {aplicaClassificacioPaginesPubliques,etiquetesDePaginaPublica} from './classificacioPaginesPubliques.js';
import {localitzaPagina} from '../../sections/text/pageContent.r10.js';
import {PAGE_COPY} from '../../sections/text/pageContent.js';
import {targetesDeSistema} from '../../sections/mur/targetesMur.js';

const LANGUAGES=['ca','es','en','eu','gl'];
const SYSTEM=['Sistema','Sistema','System','Sistema','Sistema'];
const CATEGORIES={
 'defensa-territori':['⚖️ Defensa del Territori, Ecologia i Reivindicació','⚖️ Defensa del Territorio, Ecología y Reivindicación','⚖️ Territory, Ecology and Advocacy','⚖️ Lurraldearen Defentsa, Ekologia eta Aldarrikapena','⚖️ Defensa do Territorio, Ecoloxía e Reivindicación'],
 'recursos-locals':['🌾 Recursos Locals, Agricultura i Sobirania','🌾 Recursos Locales, Agricultura y Soberanía','🌾 Local Resources, Agriculture and Sovereignty','🌾 Tokiko Baliabideak, Nekazaritza eta Burujabetza','🌾 Recursos Locais, Agricultura e Soberanía'],
 'natura-excursions':['🌿 Natura i Patrimoni','🌿 Naturaleza y Patrimonio','🌿 Nature and Heritage','🌿 Natura eta Ondarea','🌿 Natureza e Patrimonio'],
 'patrimoni-cultura':['🎭 Cultura, Música i Llengua','🎭 Cultura, Música y Lengua','🎭 Culture, Music and Language','🎭 Kultura, Musika eta Hizkuntza','🎭 Cultura, Música e Lingua'],
 'comunitat-rural':['🤝 Món Rural','🤝 Mundo Rural','🤝 Rural Communities','🤝 Landa Mundua','🤝 Mundo Rural'],
 'tecnologia-lliure':['💻 Tecnologia Lliure, Dades Obertes i Disseny','💻 Tecnología Libre, Datos Abiertos y Diseño','💻 Free Technology, Open Data and Design','💻 Teknologia Librea, Datu Irekiak eta Diseinua','💻 Tecnoloxía Libre, Datos Abertos e Deseño']
};
// Frozen 49-tag specification, independent of both implementation tables.
const TAGS_49=[
 'Associacionisme','Activitats','Ajuntament de La Torre','Aplec pel Territori','Arbres Monumentals','Bioconstrucció','Brull Viu','Camí de Santiago','Cims per la llengua',
 "Coordinadora d'Estudis Eòlics del Comtat",'Desenvolupament Sostenible','Documentació','El Camí','El Carreró Centre Cultural i Tecnològic',"El Planet Centre Rural d'Experimentació",'El Rentonar','Esports','Rutes','Fadrins','Festes dels Pobles','Font Roja','Fotos','Gent que Fa Música','Gent Sostenible','Incendis','Llibres','Memfotisme','Noticies','Opinió','Patrimoni','Pla Eòlic','Plànols','Pou de neu','Projecte Sóc de Poble','Projectes','Propostes','Radar No','Rentonar Informa','Replantacions','Reunions','Sant Gregori','Serra dels Plans','Trobades','Vídeos','Pedra Seca','Herbari','Llavors','NGI Fediversity','Node 0'
];
const TAG_TRANSLATIONS={
 'Associacionisme':['Asociacionismo','Community associations','Elkartegintza','Asociacionismo'],
 'Activitats':['Actividades','Activities','Jarduerak','Actividades'],
 'Arbres Monumentals':['Árboles Monumentales','Monumental Trees','Zuhaitz Monumentalak','Árbores Monumentais'],
 'Bioconstrucció':['Bioconstrucción','Natural Building','Bioeraikuntza','Bioconstrución'],
 'Desenvolupament Sostenible':['Desarrollo Sostenible','Sustainable Development','Garapen Jasangarria','Desenvolvemento Sostible'],
 'Documentació':['Documentación','Documentation','Dokumentazioa','Documentación'],
 'Esports':['Deportes','Sports','Kirolak','Deportes'],
 'Rutes':['Rutas','Routes','Ibilbideak','Rutas'],
 'Festes dels Pobles':['Fiestas de los Pueblos','Village Celebrations','Herrietako Jaiak','Festas das Aldeas'],
 'Fotos':['Fotos','Photos','Argazkiak','Fotos'],
 'Gent que Fa Música':['Gente que Hace Música','People Making Music','Musika Egiten Duen Jendea','Xente que Fai Música'],
 'Incendis':['Incendios','Wildfires','Suteak','Incendios'],
 'Llibres':['Libros','Books','Liburuak','Libros'],
 'Noticies':['Noticias','News','Albisteak','Novas'],
 'Opinió':['Opinión','Opinion','Iritzia','Opinión'],
 'Patrimoni':['Patrimonio','Heritage','Ondarea','Patrimonio'],
 'Plànols':['Planos','Plans','Planoak','Planos'],
 'Pou de neu':['Pozo de nieve','Snow Well','Elur-zuloa','Pozo de neve'],
 'Projectes':['Proyectos','Projects','Proiektuak','Proxectos'],
 'Propostes':['Propuestas','Proposals','Proposamenak','Propostas'],
 'Replantacions':['Replantaciones','Replanting','Birlandaketak','Replantacións'],
 'Reunions':['Reuniones','Meetings','Bilerak','Reunións'],
 'Trobades':['Encuentros','Gatherings','Topaketak','Encontros'],
 'Vídeos':['Vídeos','Videos','Bideoak','Vídeos'],
 'Pedra Seca':['Piedra Seca','Dry Stone','Harri Lehorra','Pedra Seca'],
 'Herbari':['Herbario','Herbarium','Herbarioa','Herbario'],
 'Llavors':['Semillas','Seeds','Haziak','Sementes']
};
const tagText=(tag,language)=>language==='ca'?tag:TAG_TRANSLATIONS[tag]?.[LANGUAGES.indexOf(language)-1]??tag;
const categoryText=(id,language)=>CATEGORIES[id][LANGUAGES.indexOf(language)];

// Literal editorial matrix: one mandatory tag anchor per page. It detects a
// blanket category or an entry removed from both production tables.
// Arbitratge R46, Loop 3 (L2-04) · P6 (directriu 261003_2325 del Mestre) i P0-40: de les 31 claus de PAGE_COPY,
// 23 es classifiquen i les 8 pàgines d'acció de DESTINS_CONTROL no porten cap etiqueta (ACTION_PAGES).
const PAGES=[
 ['projecte','tecnologia-lliure','Projecte Sóc de Poble'],
 ['constitucio','comunitat-rural','Associacionisme'],
 ['legal','tecnologia-lliure','Documentació'],
 ['disseny','tecnologia-lliure','Pedra Seca'],
 ['anima','tecnologia-lliure','Node 0'],
 ['notes','tecnologia-lliure','Documentació'],
 ['versions','tecnologia-lliure','Documentació'],
 ['roadmap','tecnologia-lliure','Projectes'],
 ['notes_shared','tecnologia-lliure','Documentació'],
 ['wikidepoble','patrimoni-cultura','Documentació'],
 ['fedivers','tecnologia-lliure','NGI Fediversity'],
 ['consola','tecnologia-lliure','Node 0'],
 ['cervell','tecnologia-lliure','Node 0'],
 ['xat','comunitat-rural','Associacionisme'],
 ['drets-autor','patrimoni-cultura','Documentació'],
 ['descarregues','tecnologia-lliure','Documentació'],
 ['fediversity','tecnologia-lliure','NGI Fediversity'],
 ['node-zero','tecnologia-lliure','Node 0'],
 ['anatomia-rural','natura-excursions','Pou de neu'],
 ['herbari','natura-excursions','Herbari'],
 ['banc-de-llavors','recursos-locals','Llavors'],
 ['rutes-de-poble','natura-excursions','Rutes'],
 ['arbres-monumentals','natura-excursions','Arbres Monumentals']
];
// P6 · les huit pàgines d'acció (publicar i saber-ne més del Panell): cap etiqueta, en cap llengua.
const ACTION_PAGES=['publicar_mur','publicar_mercat','publicar_calendari','publicar_mapa','vehicle_compartit','animalets','treball','habitatge'];
// Publicació vigent anterior a R41: 14 documents del sistema + 5 de patrimoni.
const PUBLISHED_19=['projecte','wikidepoble','constitucio','roadmap','notes','disseny','consola','cervell','versions','legal','xat','drets-autor','descarregues','fediversity','anatomia-rural','herbari','banc-de-llavors','rutes-de-poble','arbres-monumentals'];

function assertClassification(labels,key,category,requiredTag,language){
 expect(Array.isArray(labels)).toBe(true);
 const system=SYSTEM[LANGUAGES.indexOf(language)];
 const systemLabels=labels.filter(label=>label.className==='sdp-badge-system'&&label.text===system);
 const categories=labels.filter(label=>label.className==='sdp-badge-category');
 const tags=labels.filter(label=>label.className==='sdp-badge-tag');
 expect(systemLabels).toHaveLength(1);
 expect(categories.map(label=>label.text)).toEqual([categoryText(category,language)]);
 expect(tags.length).toBeGreaterThanOrEqual(1);
 expect(tags.map(label=>label.text)).toContain(tagText(requiredTag,language));
 const allowedTags=new Set(TAGS_49.map(tag=>tagText(tag,language)));
 for(const tag of tags)expect(allowedTags.has(tag.text),`${key}/${language}: invented tag ${tag.text}`).toBe(true);
 expect(new Set(tags.map(label=>label.text)).size).toBe(tags.length);
 for(const label of labels){
  expect(label.text).not.toMatch(/^(?:mur|muro|wall|horma|general|productivitat|productivity|manual|xarxa|network)$/i);
  if(label.className==='sdp-badge-system'&&label.text!==system){
   expect(key).toBe('versions');expect(label.text).toMatch(/^v\d/);
  }else{
   expect(['sdp-badge-system','sdp-badge-category','sdp-badge-tag']).toContain(label.className);
   if(language==='ca')expect(Object.hasOwn(label,'lang')).toBe(false);
   else expect(label.lang).toBe(language);
  }
 }
}

const withoutLabels=value=>{
 if(Array.isArray(value))return value.map(withoutLabels);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='labels').map(([key,child])=>[key,withoutLabels(child)]));
 return value;
};
const sentinels=()=>({
 title:'Unrelated title, never infer category from this',slug:'custom-slug',html:'<p>El Mur continua viu. <a href="/mur/sentinel">Sistema</a></p>',
 lead:'Original lead',contentLanguage:'ca',section:'mur',area:'municipal',author_id:'owner-A',autoria:{name:'Author sentinel',id:'A'},
 created_at:'2020-01-02T03:04:05Z',published_at:'2020-02-03T04:05:06Z',updated_at:'2020-03-04T05:06:07Z',
 labels:[{text:'MUR',className:'sdp-badge-system'},{text:'General',className:'sdp-badge-tag'},{text:'Improvised label',className:'sdp-badge-category'}],
 translations:{en:{title:'Authored English title',html:'<p>Wall is an authored word.</p>',author_id:'author-EN',labels:[{text:'Manual',className:'sdp-badge-tag'}]}}
});

describe('R41 independent public-page contract',()=>{
 it('the fixture covers exactly the original 31 public keys (23 classified + 8 P6 action pages) and the 6/49 normative vocabularies',()=>{
  expect(PAGES).toHaveLength(23);expect(ACTION_PAGES).toHaveLength(8);
  const keys=[...PAGES.map(([key])=>key),...ACTION_PAGES];expect(new Set(keys).size).toBe(31);
  expect(Object.keys(PAGE_COPY).sort()).toEqual(keys.sort());
  expect(Object.keys(CATEGORIES)).toHaveLength(6);expect(new Set(TAGS_49).size).toBe(49);
 });
 describe.each(LANGUAGES)('%s literal 23-page matrix',language=>{
  it.each(PAGES)('%s has one System, its editorial mother and canonical tags',(key,category,tag)=>{
   const localized=localitzaPagina(PAGE_COPY[key],language);
   assertClassification(localized.labels,key,category,tag,language);
  });
  it.each(ACTION_PAGES)('P6 · %s (action page) carries no label',key=>{
   expect(localitzaPagina(PAGE_COPY[key],language).labels??[]).toEqual([]);
   expect(etiquetesDePaginaPublica(key,[],language)).toEqual([]);
  });
 });
 it.each(LANGUAGES)('%s: empty/old/duplicate structural labels cannot suppress or duplicate System',language=>{
  const inputs=[[],[{text:'Mur',className:'sdp-badge-system'}],[{text:'MUR'},{text:'Sistema'},{text:'Sistema'},{text:'System'}],[{text:'General',className:'sdp-badge-category'},{text:'Improvised label',className:'sdp-badge-tag'},{text:'Manual'}]];
  for(const input of inputs){
   const before=structuredClone(input);
   const result=etiquetesDePaginaPublica('projecte',input,language);
   assertClassification(result,'projecte','tecnologia-lliure','Projecte Sóc de Poble',language);
   expect(input).toEqual(before);
   expect(etiquetesDePaginaPublica('projecte',result,language)).toEqual(result);
  }
 });
 it.each(LANGUAGES)('%s: null or malformed backend labels never break public Versions',language=>{
  for(const originals of [null,'legacy text',{},[null,false,'Sistema']]){
   expect(()=>etiquetesDePaginaPublica('versions',originals,language)).not.toThrow();
   assertClassification(etiquetesDePaginaPublica('versions',originals,language),'versions','tecnologia-lliure','Documentació',language);
  }
 });
 it('classification preserves bodies, routes, sections, dates and authors in all 31 pages, and is idempotent',()=>{
  const copy=Object.fromEntries([...PAGES.map(([key])=>key),...ACTION_PAGES].map(key=>[key,sentinels()]));
  const fields=withoutLabels(structuredClone(copy));
  const actionBefore=structuredClone(Object.fromEntries(ACTION_PAGES.map(key=>[key,copy[key]])));
  aplicaClassificacioPaginesPubliques(copy);
  expect(withoutLabels(copy)).toEqual(fields);
  // P6 · la classificació no toca cap pàgina d'acció: ni hi afig etiquetes ni en reescriu cap camp.
  for(const key of ACTION_PAGES)expect(copy[key]).toEqual(actionBefore[key]);
  for(const [key,category,tag] of PAGES)for(const language of LANGUAGES){
   const localized=localitzaPagina(copy[key],language);
   assertClassification(localized.labels,key,category,tag,language);
   const expectedBody=language==='en'?'<p>Wall is an authored word.</p>':fields[key].html;
   expect(localized.html).toBe(expectedBody);
   expect(localized.section).toBe('mur');expect(localized.area).toBe('municipal');
   expect(localized.author_id).toBe(language==='en'?'author-EN':'owner-A');
   expect(localized.contentLanguage).toBe(language==='en'?'en':'ca');
  }
  const once=structuredClone(copy);aplicaClassificacioPaginesPubliques(copy);expect(copy).toEqual(once);
 });
 it('P6 · Animalets (action page) carries no label, even with an unrelated title and no old tags',()=>{
  const copy={animalets:{...sentinels(),labels:[],translations:undefined,title:'A title containing technology words is irrelevant'}};
  aplicaClassificacioPaginesPubliques(copy);
  for(const language of LANGUAGES)expect(localitzaPagina(copy.animalets,language).labels).toEqual([]);
 });
 it.each(LANGUAGES)('%s: a core API clone requires explicit public context and keeps the same body',language=>{
  const clone={...sentinels(),translations:undefined,labels:[{text:'Comunicació',className:'sdp-badge-system'},{text:'Eina',className:'sdp-badge-category'}]};
  const before=structuredClone(clone);
  expect(localitzaPagina(clone,language)).toBe(clone);
  const localized=localitzaPagina(clone,language,'xat');
  assertClassification(localized.labels,'xat','comunitat-rural','Associacionisme',language);
  expect(localized.html).toBe(before.html);expect(localized.contentLanguage).toBe('ca');expect(clone).toEqual(before);
  const privateClone={...clone,private:true};expect(localitzaPagina(privateClone,language,'xat')).toBe(privateClone);
 });
 it.each([
  {visibility:'private'},{visibility:'unlisted'},{status:'draft'},{status:'unpublished'},{status:'arxivat'},{status:'quarantena'},
  {private:true},{draft:true},{isDraft:true},{published:false},{is_published:false}
 ])('private/draft publication state %j never becomes public through route context',state=>{
  const page={...sentinels(),...state,translations:undefined,id:'xat',slug:'xat',isSystem:true,type:'sistema',labels:[{text:'Documentació',className:'sdp-badge-tag'}]};
  const before=structuredClone(page),copy={xat:page};
  expect(localitzaPagina(page,'en','xat')).toBe(page);
  aplicaClassificacioPaginesPubliques(copy);expect(copy.xat).toBe(page);expect(page).toEqual(before);
  expect(targetesDeSistema(copy,{nativa:false,language:'en'})).toEqual([]);
 });
 it('organic id/slug/title/isSystem markers cannot forge registered public provenance',()=>{
  const post={...sentinels(),translations:undefined,title:'Projecte',id:'xat',slug:'xat',isSystem:true,type:'sistema',visibility:'public',status:'published',labels:[{text:'Documentació',className:'sdp-badge-tag'}]};
  const before=structuredClone(post);
  expect(localitzaPagina(post,'en')).toBe(post);
  const copy={organic_note:post};aplicaClassificacioPaginesPubliques(copy);expect(copy.organic_note).toBe(post);expect(post).toEqual(before);
 });
 it.each(LANGUAGES)('%s: the real Mur/Calendar/actor producer reclassifies API clones and leaves their bodies unchanged',language=>{
  const copy=Object.fromEntries(PAGES.map(([key])=>[key,{...structuredClone(PAGE_COPY[key]),labels:[{text:'MUR',className:'sdp-badge-system'},{text:'Eina',className:'sdp-badge-category'}]}]));
  copy['private-note']={private:true,html:'Secret original',labels:[{text:'Eina',className:'sdp-badge-category'}]};
  const before=structuredClone(copy);
  const cards=targetesDeSistema(copy,{nativa:false,language});
  expect(cards.map(card=>card.id).sort()).toEqual([...PUBLISHED_19].sort());
  for(const card of cards){
   const [,category,tag]=PAGES.find(([key])=>key===card.id);
   assertClassification(card.labels,card.id,category,tag,language);
  }
  expect(withoutLabels(cards)).toEqual(withoutLabels(targetesDeSistema(copy,{nativa:false,language:'ca'})));
  expect(copy).toEqual(before);
 });
 it('authored partial headers never claim that the original body has been translated',()=>{
  for(const language of ['es','en','eu','gl']){
   const page={...sentinels(),translations:{[language]:{title:'Authored header '+language,lead:'Authored lead '+language}}};
   const copy={xat:page};aplicaClassificacioPaginesPubliques(copy);
   const localized=localitzaPagina(page,language);
   expect(localized.title).toBe('Authored header '+language);
   expect(localized.html).toBe(page.html);expect(localized.contentLanguage).toBe('ca');
   assertClassification(localized.labels,'xat','comunitat-rural','Associacionisme',language);
   expect(Object.hasOwn(page.translations[language],'html')).toBe(false);
  }
 });
 it.each(['constructor','toString','__proto__','hasOwnProperty','private-unlisted'])('%s is an unknown own key, never an inherited public classification',key=>{
  const originals=[{text:'Documentació',className:'sdp-badge-tag'},{text:'Sistema',className:'sdp-badge-system'}];
  expect(()=>etiquetesDePaginaPublica(key,originals,'en')).not.toThrow();
  expect(etiquetesDePaginaPublica(key,originals,'en')).toEqual(originals);
  const copy=Object.fromEntries([[key,{...sentinels(),private:true,labels:structuredClone(originals)}]]);
  const before=structuredClone(copy);expect(()=>aplicaClassificacioPaginesPubliques(copy)).not.toThrow();expect(copy).toEqual(before);
 });
 it.each(LANGUAGES)('%s: canonical-looking labels do not make a private/custom page public',language=>{
  const privatePage={...sentinels(),title:'Projecte',slug:'projecte',private:true,labels:[{text:'Documentació',className:'sdp-badge-tag'},{text:'Sistema',className:'sdp-badge-system'}]};
  delete privatePage.translations;
  const before=structuredClone(privatePage);
  expect(localitzaPagina(privatePage,language)).toEqual(before);expect(privatePage).toEqual(before);
  const customPage={...before};delete customPage.private;
  expect(localitzaPagina(customPage,language)).toEqual(customPage);
 });
 it('an authored private translation keeps its own labels and old localisation behaviour',()=>{
  const privatePage={...sentinels(),private:true};
  privatePage.translations.en.labels=[{text:'Sistema',className:'personal-label'},{text:'Documentació',className:'my-private-tag'}];
  const before=structuredClone(privatePage);
  expect(localitzaPagina(privatePage,'en')).toEqual({...before,...before.translations.en,contentLanguage:'en'});
  expect(privatePage).toEqual(before);
 });
 it('version metadata remains while exactly one System classifies the Versions page',()=>{
  const page={...sentinels(),labels:[{text:'v1.1.0',className:'sdp-badge-system'},{text:'Mur',className:'sdp-badge-system'}]};
  const copy={versions:page};aplicaClassificacioPaginesPubliques(copy);
  for(const language of LANGUAGES){
   const localized=localitzaPagina(copy.versions,language);
   assertClassification(localized.labels,'versions','tecnologia-lliure','Documentació',language);
   expect(localized.labels.filter(label=>label.text==='v1.1.0')).toHaveLength(1);
  }
 });
});
