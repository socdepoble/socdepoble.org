import {expect,test} from 'vitest';
import {FACETA_3_CATEGORIES_MARES_IA,FACETA_4_ETIQUETES_SKOS,ETIQUETES_DOCTORAL_SKOS_49} from './tesaurusDoctoralSocDePoble.js';
import {validaTaxonomia,categoriesBase,etiquetesBase} from '../personalitzacio.js';
import {PAGE_COPY} from '../../sections/text/pageContent.js';
import {MANIFEST_DE_POBLE_POST} from '../../sections/mur/feedSeed.js';
import {CALENDAR_EVENTS,CURSOS_PEDRA_EN_SEC_2026_EVENT} from '../../sections/mur/eventsSeed.js';
import {NOVES_TECNOLOGIES_CULTURA_RURAL_POST} from '../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import {targetesDeSistema} from '../../sections/mur/targetesMur.js';

const mothers=FACETA_3_CATEGORIES_MARES_IA.map(c=>c.label),ids=new Set(FACETA_3_CATEGORIES_MARES_IA.map(c=>c.id));
const active=new Set(ETIQUETES_DOCTORAL_SKOS_49);
const structural=new Set(['Sistema','Mur']);
const seeds=[MANIFEST_DE_POBLE_POST,...CALENDAR_EVENTS,CURSOS_PEDRA_EN_SEC_2026_EVENT,NOVES_TECNOLOGIES_CULTURA_RURAL_POST];
const cards=targetesDeSistema(PAGE_COPY,{nativa:false});
const invalid=cards.flatMap(card=>(card.labels||[]).filter(l=>!structural.has(l.text)&&(l?.className==='sdp-badge-category'?!mothers.includes(l.text):l?.className==='sdp-badge-tag'&&!active.has(l.text))).map(l=>({id:card.id,text:l.text,type:l.className})));
const payload={v:1,categories:mothers,etiquetes:[...active],pagines:{fediversity:{labels:[{text:mothers[0],className:'sdp-badge-category'}]}}};
const inventory={mothers,activeTags:ETIQUETES_DOCTORAL_SKOS_49,activeCount:active.size,totalSKOS:FACETA_4_ETIQUETES_SKOS.length,systemCards:cards.length,invalidPublicLabels:invalid,adminErrors:validaTaxonomia(payload),missingRoundtripCategories:mothers.filter(c=>!categoriesBase(payload).includes(c)),seedCategoryIds:seeds.map(x=>({id:x.id,categoryId:x.categoria_tematica_id,valid:ids.has(x.categoria_tematica_id)}))};

test('AUDIT R88 · exactament49 etiquetes actives canòniques i cap id/slugs duplicats',()=>{
 expect(ETIQUETES_DOCTORAL_SKOS_49).toHaveLength(49);
 expect(new Set(FACETA_4_ETIQUETES_SKOS.map(t=>t.id)).size).toBe(FACETA_4_ETIQUETES_SKOS.length);
 expect(new Set(FACETA_4_ETIQUETES_SKOS.map(t=>t.slug)).size).toBe(FACETA_4_ETIQUETES_SKOS.length);
});
test('AUDIT R88 · totes les categories dels seeds referencien ids existents',()=>{
 expect(inventory.seedCategoryIds.filter(x=>!x.valid)).toEqual([]);
});
test('AUDIT R88 · les6 mares fan roundtrip per la validació admin i categoriesBase',()=>{
 expect(validaTaxonomia(payload)).toEqual([]);
 expect(categoriesBase(payload)).toEqual(expect.arrayContaining(mothers));
});
test('AUDIT R88 · la unió del Bloc no manté etiquetes antigues fora del conjunt canònic',()=>{
 const result=etiquetesBase({v:1,etiquetes:[...active]});
 expect(result.filter(t=>!active.has(t))).toEqual([]);
});
test('AUDIT R88 · totes les cards realment publicades al Mur tenen categoria/tag canònics, preservant Sistema',()=>{
 expect(invalid.slice(0,25),`${invalid.length} labels antigues en ${cards.length} cards de sistema/patrimoni`).toEqual([]);
});
test('AUDIT R88 · tots els tags dels seeds són noms actius SKOS reals',()=>{
 expect(seeds.flatMap(x=>(x.tags||[]).filter(t=>!active.has(t)).map(t=>({id:x.id,tag:t})))).toEqual([]);
});
test('AUDIT R88 · etiquetes antigues extirpades no reapareixen entre les opcions actives',()=>{
 expect([...active].filter(t=>['Posant en Valor els Recursos Locals','Reivindicant','Esdeveniments'].includes(t))).toEqual([]);
});
