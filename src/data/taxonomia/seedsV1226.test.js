import {describe,it,expect} from 'vitest';
import {PAGE_COPY} from '../../sections/text/pageContent.js';
import {localitzaPagina} from '../../sections/text/pageContent.r10.js';
import {targetesDeSistema} from '../../sections/mur/targetesMur.js';
import {CALENDAR_EVENTS,CURSOS_PEDRA_EN_SEC_2026_EVENT} from '../../sections/mur/eventsSeed.js';
import {propsDeTargetaDeProducte} from '../../sections/mercat/targetaDeProducte.js';
import {paginaDElement} from '../../sections/detail/elementDeSeccio.js';
import {preparaCapitolsWiki} from '../wikiAlMur.js';
import {classificaProducte} from './destinsDeProducte.js';
import {NOVES_TECNOLOGIES_CULTURA_RURAL_POST} from '../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import {COPIES_SEGURETAT_SOC_DE_POBLE_POST} from '../../sections/mur/articles/copiesSeguretatSocDePobleContent.js';
import {LA_VEU_DE_SOC_DE_POBLE_POST} from '../../sections/mur/articles/laVeuDeSocDePobleContent.js';
const systems=p=>p.labels.filter(l=>l.className==='sdp-badge-system').map(l=>l.text);
describe('Classificació Mestre v1.2.26',()=>{
 it('4 tècniques i Pou 3D tenen destins exactes',()=>{
  expect(systems(COPIES_SEGURETAT_SOC_DE_POBLE_POST)).toEqual(['Sistema','Mur']);expect(systems(LA_VEU_DE_SOC_DE_POBLE_POST)).toEqual(['Sistema','Mur']);
  expect(systems(NOVES_TECNOLOGIES_CULTURA_RURAL_POST)).toEqual(['Mur']);
  expect(systems(PAGE_COPY.fediversity)).toEqual(['Sistema','Mur']);
  const nervios=preparaCapitolsWiki([{id:'sistema_nervios_skills_i_repositoris',content:'# Sistema',attributes:{visibility:'public'}}],()=>({titol:'Sistema'}))[0];
  expect(systems(nervios)).toEqual(['Sistema','Mur']);
 });
 it('Aplec i Cursos: mateix model de Card i pàgina',()=>{
  expect(systems(CALENDAR_EVENTS[0])).toEqual(['Mur','Calendari']);expect(CALENDAR_EVENTS[0].tags).toEqual(['Aplec']);
  expect(systems(CURSOS_PEDRA_EN_SEC_2026_EVENT)).toEqual(['Mur','Calendari','Vídeo']);
 });
 it('els destins explícits Mur/Calendari no desapareixen del detall',()=>{
  for(const [item,listPath,label,expected] of [[CALENDAR_EVENTS[0],'/calendari','Calendari',['Mur','Calendari']],[CURSOS_PEDRA_EN_SEC_2026_EVENT,'/calendari','Calendari',['Mur','Calendari','Vídeo']],[COPIES_SEGURETAT_SOC_DE_POBLE_POST,'/mur','Mur',['Sistema','Mur']]]){
   const section={listPath,label,getTitle:i=>i.title,getSubtitle:()=>'',getImage:()=>null};
   expect(systems(paginaDElement(section,item))).toEqual(expected);
  }
 });
 it('5 biblioteques fora Sistema en 5L, i llibre PDF al Mur',()=>{
  const expected=[['Mur','Catàlegs'],['Muro','Catálogos'],['Wall','Catalogues'],['Horma','Katalogoak'],['Muro','Catálogos']];
  for(const key of ['receptes','arbres-monumentals','banc-de-llavors','rutes-de-poble','herbari'])for(const [i,lang] of ['ca','es','en','eu','gl'].entries())expect(systems(localitzaPagina(PAGE_COPY[key],lang))).toEqual(expected[i]);
  expect(PAGE_COPY.receptes.subtitle).toBe('Biblioteca Multipoble de Receptaris Tradicionals');expect(PAGE_COPY['arbres-monumentals'].subtitle).toBe('Biblioteca Multipoble d’Arbres Singulars');
  expect(PAGE_COPY.herbari.llibres[0].title).toBe('Herbari de La Torre');
  const cards=targetesDeSistema(PAGE_COPY,{nativa:false});expect(systems(cards.find(c=>c.id==='que-dinem'))).toEqual(['Mur','Catàlegs','PDF']);
 });
 it('Card i pàgina de producte comparteixen etiquetes humanes i sistema en 5L',()=>{
  const item={id:'oli',title:'Oli de La Torre',category_slug:'oli-verge',tag:'5-litres',labels:[{text:'Antiga',className:'sdp-badge-tag'}]};
  for(const idioma of ['ca','es','en','eu','gl']){
   const t=(_key,fallback)=>fallback;
   const section={listPath:'/mercat',getTitle:i=>i.title,getSubtitle:()=>'',getImage:()=>null};
   expect(paginaDElement(section,item,{idioma,t}).labels).toEqual(propsDeTargetaDeProducte(item,t,{idioma}).labels);
   expect(paginaDElement(section,item,{idioma,t}).labels.filter(l=>l.className==='sdp-badge-system')).toHaveLength(2);
  }
 });
 /* C26-2 #12 (Gauntlet c13) · PENDENT DEL MESTRE. IDEA-365 (21:58, punt 2) demana per a les botelles
    d'Oli l'etiqueta oli-verge i el format «1 litre / 2 litres / 5 litres», però cap camp real de la BD
    ni de les variants no el porta: les fitxes d'Oli de La Torre (public.app_content, clau marketItems)
    només el duen dins del títol, de l'id i de la fila «Format i preu oficial» de la descripció. El camp
    `format` d'esta fixture és sintètic. La prova acredita només el que és cert hui: classificaProducte
    el conserva sense mutar la font, i cap superfície (Card del Mercat, Card del Mur i pàgina, que
    compartixen propsDeTargetaDeProducte) no el pinta. Quan el Mestre fixe la font del format, esta
    prova es reescriu com a paritat Card ↔ pàgina del format en 5L. */
 it('Oli 1L/2L/5L: tag i camps intactes i llevar Mur conserva Mercat; el format encara no el pinta cap superfície (pendent)',()=>{
  for(const litres of [1,2,5]){
   const item={id:`oli-${litres}`,tag:'oli-verge',format:`${litres} L`};const before=structuredClone(item);const result=classificaProducte(item);
   expect(result.categoriesSistema).toEqual(['Mur','Mercat']);expect(result.tag).toBe('oli-verge');expect(result.format).toBe(`${litres} L`);expect(item).toEqual(before);
   const textos=propsDeTargetaDeProducte(result).labels.map(l=>l.text);
   expect(textos).toEqual(['Mur','Mercat','Oli Verge']);
   expect(textos.some(text=>text.includes(`${litres} L`)||/litres?/i.test(text))).toBe(false);
  }
  expect(classificaProducte({categoriesSistema:['Mercat']}).categoriesSistema).toEqual(['Mercat']);
 });
});
