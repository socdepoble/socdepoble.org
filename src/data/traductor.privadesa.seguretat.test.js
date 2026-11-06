import{expect,test,vi,afterEach}from'vitest';
import{creaTraductor,tradueixTot}from'./traductor.js';
import{creaTraductorApertium}from'./traductorLliure.js';
import{esElementPublic}from'../components/universal/traduccio/visibilitatTraduible.js';
import{blocsTraduibles}from'../components/universal/traduccio/blocsTraduibles.js';
import{renderHook}from'@testing-library/react';
import{tradueixCampsTargeta,useTraduccioTargeta}from'../components/PedraSeca/hooks/useTraduccioTargeta.js';
import{PARAULES_FRASE}from'./xifratXatFormats.js';
import{LLINDAR,MAX_CADUCITAT_MS}from'./xifratXatRecuperacio.js';
import ca from'../config/idiomes/ca.js';import es from'../config/idiomes/es.js';import en from'../config/idiomes/en.js';import eu from'../config/idiomes/eu.js';import gl from'../config/idiomes/gl.js';
afterEach(()=>vi.unstubAllGlobals());
const marques=[{e2ee:true},{seguretat:{xifrat:true}},{xifrat:{ct:'sobre'}},{privat:true},{privat:true,e2ee:true,consentiment:true,consentimentExplicit:true}];
test('R20 API host, Apertium i MyMemory rebutgen secrets abans de fetch fins amb consentiment',async()=>{
 const fetch=vi.fn(async()=>({status:200,json:async()=>({responseStatus:200,responseData:{translatedText:'traduït'}})}));
 const host=creaTraductor({url:'/api/translate',fetch}),lliure=creaTraductorApertium({fetch});
 const resultats=[];
 for(const marca of marques){
  resultats.push(...await Promise.allSettled([host.tradueix(['secret E2EE o entrevista'],'ES',marca),...['ES','EU'].map(desti=>lliure.tradueix(['secret E2EE o entrevista'],desti,marca))]));
 }
 expect(fetch).not.toHaveBeenCalled();
 for(const r of resultats){expect(r.status).toBe('rejected');expect(r.reason).toMatchObject({codi:'traduccio-no-disponible'});}
});
test('R20 agregador i targetes no perden les marques de privadesa en convertir a text',async()=>{
 const tradueix=vi.fn(),traductor={tradueix};
 for(const marca of marques){
  const text={text:'entrevista privada',...marca};
  await expect(tradueixTot(traductor,[text],'ES')).rejects.toMatchObject({codi:'traduccio-no-disponible'});
  await expect(tradueixCampsTargeta({title:'títol secret',...marca},'ES',{traductor})).rejects.toMatchObject({codi:'traduccio-no-disponible'});
  expect(esElementPublic({visibility:'public',...marca})).toBe(false);
 }
 expect(tradueix).not.toHaveBeenCalled();
});
test('R20 extractor DOM exclou cos E2EE i entrevista privada',()=>{
 const arrel=document.createElement('article');
  const obre=(etiqueta,atribut,text)=>{const el=document.createElement(etiqueta);if(atribut)el.setAttribute(...atribut);const p=document.createElement('p');p.textContent=text;el.append(p);return el;};
  arrel.append(obre('div',null,'Text públic'),obre('div',['data-sdp-e2ee','true'],'Secret del xat'),obre('section',['data-privat','true'],'Entrevista privada'));
 expect(blocsTraduibles(arrel).map(b=>b.text).join(' ')).toContain('Text públic');
 expect(JSON.stringify(blocsTraduibles(arrel))).not.toMatch(/Secret|Entrevista/);
 arrel.setAttribute('data-sdp-privat','true');expect(blocsTraduibles(arrel)).toEqual([]);
});
test('R20 cinc diccionaris concorden amb 6 paraules, llindar 3 i màxim 2 hores',()=>{
 expect(PARAULES_FRASE).toBe(6);expect(LLINDAR).toBe(3);expect(MAX_CADUCITAT_MS).toBe(2*3600000);
 for(const dic of [ca,es,en,eu,gl]){const t=dic['perfil.confianca.targeta.subtitol'];expect(t).toContain('6');expect(t.match(/3/g)?.length).toBeGreaterThanOrEqual(3);expect(t).toContain('2');expect(t).not.toMatch(/12|15/);}
});
test('G1-04 · una targeta privada no llança en renderitzar i no ofereix traducció',()=>{
 for(const marca of [{visibility:'private'},{e2ee:true},{xifrat:{}},{privat:true}]){
  const { result } = renderHook(()=>useTraduccioTargeta({id:'t1',titol:'Text',...marca}));
  expect(result.error).toBeUndefined();
  expect(result.current.disponible).toBe(false);
 }
});
