/** Oracles independents dels residus C2-01/02/04/05 sobre el consolidat R46. */
import {createHash} from 'node:crypto';
import {cleanup,render} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
vi.mock('../../app/contexts/RouterContext',async()=>{
 const {createElement:h}=await import('react');
 return {useNavigate:()=>vi.fn(),Link:({to,children,...rest})=>h('a',{href:to,...rest},children)};
});
vi.mock('@/components/universal/NotificationContext.jsx',()=>({useToast:()=>({showToast:vi.fn()})}));
vi.mock('../mur/MurContext',()=>({useMur:()=>({status:'ready',feedPosts:[],events:[],marketItems:[]})}));
vi.mock('../../app/contexts/CoreContentContext',()=>({useCoreContent:()=>({status:'ready',towns:[]})}));
vi.mock('../multimedia/MultimediaContext',()=>({useMultimedia:()=>({status:'ready',mediaItems:[]})}));
vi.mock('../../app/contexts/UIContext',()=>({useUIActions:()=>({t:(_,fallback)=>fallback})}));
import {paginaDElement} from './elementDeSeccio.js';
import {buildEventsDetailSectionMeta,buildMurDetailSectionMeta,buildMercatDetailSectionMeta,buildPoblesDetailSectionMeta} from './detailSectionMeta.jsx';
import {EventCard} from '../../components/universal/EventCard.jsx';
import {PageFrame} from '../../components/universal/PageFrame.jsx';
import {acteAEsdeveniment} from '../mur/agendaMur.js';
import {CALENDAR_EVENTS} from '../mur/eventsSeed.js';
import {MANIFEST_DE_POBLE_POST} from '../mur/feedSeed.js';
import {FACETA_4_ETIQUETES_SKOS,ARTICLES_SIMULADOR_IA_425} from '../../data/taxonomia/tesaurusDoctoralSocDePoble.js';

const t=(_,fallback)=>fallback;
const agenda=buildEventsDetailSectionMeta({events:[],t});
const mur=buildMurDetailSectionMeta({feedPosts:[],t});
const mercat=buildMercatDetailSectionMeta({marketItems:[],t});
const aplec=CALENDAR_EVENTS.find(row=>row.wp_id===16880);
const dateLink='/calendari?vista=mes&date=2023-01-29';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
afterEach(cleanup);

test('C26-2 · Aplec té Mur+Calendari i etiqueta Aplec; el corpus d’importació conserva els tres SKOS històrics',()=>{
 expect(aplec.categoriesSistema).toEqual(['Mur','Calendari']);
 expect(aplec.tags).toEqual(['Aplec']);
 expect(ARTICLES_SIMULADOR_IA_425.find(row=>row.id===16880).etiquetesNetes).toEqual(['Aplec pel Territori','Incendis','Associacionisme']);
 const {container}=render(<EventCard item={aplec} esdeveniment={acteAEsdeveniment(aplec)}/>);
 const links=[...container.querySelectorAll('.sp-card-labels a')];
 expect(links.filter(link=>link.getAttribute('href')===dateLink)).toHaveLength(1);
 // G26-2 · Canvi intencionat, IDEA-365 (21:40, regla 3: «píndoles 100 % clicables arreu»): l'etiqueta
 // «Aplec» ja no és text inert; porta a la seua pàgina editorial (/etiqueta/aplec), darrere dels destins.
 expect(links.filter(link=>link.getAttribute('href')!==dateLink).map(link=>link.getAttribute('href'))).toEqual(['/mur','/calendari','/etiqueta/aplec']);
 expect(links.find(link=>link.getAttribute('href')==='/etiqueta/aplec').textContent).toBe('Aplec');
 expect(links.find(link=>link.getAttribute('href')===dateLink).textContent).toBe('⚖️ Defensa del Territori, Ecologia i Reivindicació');
 expect([...container.querySelectorAll('.sp-card-labels .sdp-badge-tag')].map(node=>node.textContent)).toEqual(['Aplec']);
});

test('C26-2 · detall de l’Aplec conserva classificació exacta de la Card i una diana de data',()=>{
 const page=paginaDElement(agenda,aplec);
 expect(page.labels).toEqual(aplec.labels);
 expect(page.labels.filter(label=>label.className==='sdp-badge-system').map(label=>label.text)).toEqual(['Mur','Calendari']);
 expect(page.labels.filter(label=>label.href===dateLink)).toHaveLength(1);
 expect(page.labels.filter(label=>label.href&&label.href!==dateLink).map(label=>label.href)).toEqual(['/mur','/calendari']);
 const {container}=render(<PageFrame {...page}><p>Cos de prova</p></PageFrame>);
 const links=[...container.querySelectorAll('header.page-title a')].filter(link=>link.getAttribute('href')===dateLink);
 expect(links).toHaveLength(1);
 expect(links[0].textContent).toBe(aplec.category);
 expect(aplec.labels.find(label=>label.text===aplec.category).href).toBe(dateLink);
});

test('C2-02 · els49 comptadors actius descriuen el corpus canònic real de425 articles',()=>{
 const active=FACETA_4_ETIQUETES_SKOS.filter(row=>row.canonica);
 expect(active).toHaveLength(49);
 expect(active.flatMap(row=>{
  const actual=ARTICLES_SIMULADOR_IA_425.filter(article=>article.etiquetesNetes.includes(row.name)).length;
  return row.count===actual?[]:[{name:row.name,declared:row.count,actual}];
 })).toEqual([]);
 expect(Object.fromEntries(active.filter(row=>['Associacionisme','Activitats','Aplec pel Territori','Arbres Monumentals','Incendis'].includes(row.name)).map(row=>[row.name,row.count])))
  .toEqual({Associacionisme:2,Activitats:78,'Aplec pel Territori':27,'Arbres Monumentals':23,Incendis:25});
 expect(ARTICLES_SIMULADOR_IA_425.filter(article=>article.etiquetesNetes.includes('Associacionisme')).map(article=>article.id)).toEqual([16893,16880]);
});

test('C2-04 · les10 arestes antigues Excursions resolen a Rutes i no hi ha destins orfes',()=>{
 const names=new Set(FACETA_4_ETIQUETES_SKOS.map(row=>row.name));
 const ids=[159,73,75,269,80,84,255,250,256,258];
 for(const id of ids)expect(FACETA_4_ETIQUETES_SKOS.find(row=>row.id===id).relatedTerms,`terme ${id}`).toContain('Rutes');
 expect(FACETA_4_ETIQUETES_SKOS.flatMap(row=>(row.relatedTerms||[]).filter(term=>!names.has(term)).map(term=>({id:row.id,term})))).toEqual([]);
});

test.each([[mur,'Publicació','7f0c'],[mercat,'Mercat','mel']])('C2-05 · el detall orgànic conserva la classificació estructural de la secció (%s)',(section,label,id)=>{
 const item=Object.freeze({id,title:'Original',content:'<p>Cos privat intacte</p>',labels:Object.freeze([{text:'Categoria inventada',className:'sdp-badge-category'},{text:'Etiqueta inventada',className:'sdp-badge-tag'}])});
 expect(paginaDElement(section,item).labels).toEqual(section.listPath==='/mercat'
  ? [{text:'Mur',className:'sdp-badge-system',href:'/mur'},{text:'Mercat',className:'sdp-badge-system',href:'/mercat'}]
  : [{text:label,className:'sdp-badge-system'}]);
 expect(item.labels[0].text).toBe('Categoria inventada');
 expect(item.content).toBe('<p>Cos privat intacte</p>');
});

test.each(['inventada','constructor','toString','__proto__',''])('C2-05 · un id de mare desconegut no dona pas a etiquetes pròpies (%s)',id=>{
 const item={id:'organic',title:'Original',categoria_tematica_id:id,labels:[{text:'Inventada',className:'sdp-badge-tag'}]};
 expect(paginaDElement(mur,item).labels.map(label=>label.text)).toEqual(['Publicació']);
});

test('C2-05 · una mare heretada del prototip no és una classificació declarada de l’element',()=>{
 const item=Object.assign(Object.create({categoria_tematica_id:'defensa-territori'}),{id:'organic',title:'Original',labels:[{text:'Inventada',className:'sdp-badge-tag'}]});
 expect(paginaDElement(mur,item).labels.map(label=>label.text)).toEqual(['Publicació']);
});

test.each(['defensa-territori','recursos-locals','natura-excursions','patrimoni-cultura','comunitat-rural','tecnologia-lliure'])('C2-05 · una de les6 mares declarades conserva la classificació editorial (%s)',id=>{
 const labels=[{text:'Mare editorial',className:'sdp-badge-category',lang:'ca'},'Etiqueta editorial'];
 expect(paginaDElement(mur,{id:'editorial',title:'Editorial',categoria_tematica_id:id,labels}).labels).toEqual([{text:'Publicació',className:'sdp-badge-system'},...labels]);
 expect(labels).toEqual([{text:'Mare editorial',className:'sdp-badge-category',lang:'ca'},'Etiqueta editorial']);
});

test('C2-05 · Calendar conserva labels propis i metadades; sols lleva href/class de la diana repetida',()=>{
 const labels=Object.freeze([
  Object.freeze({text:'Agenda',className:'sdp-badge-system'}),
  Object.freeze({text:'Fira',className:'sdp-badge-category sp-card-label--enllac extra',href:dateLink,lang:'ca',title:'Títol'}),
  Object.freeze({text:'Una altra ruta',className:'sdp-badge-tag sp-card-label--enllac',href:'/projecte'})
 ]);
 const result=paginaDElement(agenda,{id:'fira',title:'Fira',date:'2023-01-29',labels}).labels;
 expect(result).toEqual([
  {text:'Agenda',className:'sdp-badge-system sp-card-label--enllac',href:dateLink},
  {text:'Fira',className:'sdp-badge-category extra',lang:'ca',title:'Títol'},
  {text:'Una altra ruta',className:'sdp-badge-tag sp-card-label--enllac',href:'/projecte'}
 ]);
 expect(labels[1].href).toBe(dateLink);
 expect(paginaDElement(agenda,{id:'fira',title:'Fira',labels:[{text:'Fira',className:'sdp-badge-tag'}]}).labels).toEqual([{text:'Agenda',className:'sdp-badge-system'},{text:'Fira',className:'sdp-badge-tag'}]);
});

test('regressions · Manifest conserva labels editorials i Pobles conserva província/comarca',()=>{
 expect(paginaDElement(mur,MANIFEST_DE_POBLE_POST).labels.slice(1)).toEqual(MANIFEST_DE_POBLE_POST.labels);
 const poble=buildPoblesDetailSectionMeta({towns:[],t});
 expect(paginaDElement(poble,{id:'torre',title:'La Torre',provincia:'Alacant',comarca:'Alacantí',labels:[{text:'No governar',className:'sdp-badge-tag'}]}).labels.map(label=>label.text)).toEqual(['Poble','Alacant','Alacantí']);
});

test('preservació · els425 registres i les dades editorials/personals de l’Aplec són byte-semànticament iguals a R46',()=>{
 /* Expectativa actualitzada a propòsit: Llibre Mestre, Onada R23 (14-11-2026 01:18), «Canvi Global de
    Categoria a 💻 Tecnologia i Disseny». És l'única diferència amb R46: desfet eixe nom curt, els 425
    registres tornen a fer el hash de R46; amb ell, el de hui.
    Onada R22/R24 · Empremta sincronitzada amb la mare canònica concisa «💻 Tecnologia i Disseny» de vocabulariCanonic.js. */
 const R46=JSON.parse(JSON.stringify(ARTICLES_SIMULADOR_IA_425).replaceAll('💻 Tecnologia i Disseny','💻 Tecnologia Lliure, Dades Obertes i Disseny'));
 expect(hash(R46)).toBe('cbcb113b1de18f3522030d8022edfe938c401f76a1e9ba1a416b2e41259a454b');
 expect(hash(ARTICLES_SIMULADOR_IA_425)).toBe('d94404692f1f39610212c8f49fe841ef445185de8311ee1438b36d4bb1372470');
 expect(aplec.categoriesSistema).toEqual(['Mur','Calendari']);
 const copy={...aplec};delete copy.labels;delete copy.tags;delete copy.categoriesSistema;
 expect(hash(copy)).toBe('3b0dc825093e4774313e91f6d7aa12f31bd6a389daa7bf1bd4f6ce1c0e6918a5');
});
