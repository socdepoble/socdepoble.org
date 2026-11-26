import {describe,it,expect} from 'vitest';
import {FONTS_BANC_LLAVORS,llibresDelBancDeLlavors,entradesDelCataleg} from './bancLlavors.js';
import {rutaCataleg,resolRutaCataleg,presentacioDeLaFont,slugDeFitxa,TITOLS_CURTS_DE_LLIBRE} from './catalegsMultipoble.js';
import {ESPECIES_HERBARI_LA_TORRE_117} from './herbariLaTorre117.js';
import {llibreHerbariLaTorre,modelHerbariWorkspace} from '../../sections/patrimoni/modelHerbariWorkspace.js';
import {elementsDelBancDeLlavors} from '../../sections/patrimoni/BancLlavorsWorkspaceSection.jsx';

/* El segment que escriu CatalegWorkspace (sincronitzaUrl) per a un element del seu model: slugRuta o l'id. */
const segmentDelWorkspace=item=>item.slugRuta||String(item.id);

describe('IDEA-366 · presentacions i rutes compartibles',()=>{
 it('4 fonts, presentació sempre primera, transcripcions intactes',()=>{
  const llibres=llibresDelBancDeLlavors();expect(llibres.map(l=>l.total)).toEqual([46,66,16,4]);
  for(const llibre of llibres){
   expect(llibre.items[0]).toBe(llibre.presentacio);expect(llibre.initialItemId).toBe(llibre.presentacio.id);
   expect(llibre.presentacio).toMatchObject({esPresentacio:true,autoria:expect.any(String),procedencia:expect.any(String),llicencia:expect.any(String),fontOriginal:expect.any(String)});
   expect(llibre.items.slice(1).map(i=>i.id)).toEqual(entradesDelCataleg(llibre.id).map(i=>i.id));
  }
 });

 /* C26-2 #6 · Un sol esquema per llibre i per fitxa: el camí que ja servix CatalegWorkspace, com Arbres. */
 it('C26-2 #6 · els href són el camí del workspace viu; la presentació és la URL del llibre',()=>{
  const llibres=llibresDelBancDeLlavors();
  const delWorkspace=new Map(elementsDelBancDeLlavors().map(item=>[String(item.id),`/page/banc-de-llavors/${segmentDelWorkspace(item)}`]));
  for(const llibre of llibres){
   expect(llibre.href).toBe(`/page/banc-de-llavors/${llibre.id}`);
   expect(llibre.presentacio.href).toBe(llibre.href);
   expect(resolRutaCataleg(llibre.id,llibres)).toEqual({llibre,item:llibre.presentacio,ruta:llibre.href});
   for(const item of llibre.items.slice(1)){
    expect(item.href).toBe(delWorkspace.get(item.id));
    expect(item.href).not.toContain('?');
    const segment=item.href.split('/').at(-1);
    expect(resolRutaCataleg(segment,llibres)).toMatchObject({llibre,item,ruta:item.href});
   }
  }
  // Herbari: el mateix esquema que el model de la seua secció.
  const herbari=llibreHerbariLaTorre();
  expect(herbari.href).toBe('/page/herbari/herbari-la-torre');
  const model=modelHerbariWorkspace({},null);
  expect(herbari.items.slice(1).map(i=>i.href)).toEqual(model.items.map(i=>`/page/herbari/${segmentDelWorkspace(i)}`));
 });

 it('C26-2 #6 · ?cataleg=&fitxa= és només compatibilitat: resol al mateix element i torna el camí canònic',()=>{
  const llibres=llibresDelBancDeLlavors();
  for(const llibre of llibres){
   expect(resolRutaCataleg(`cataleg=${llibre.id}`,llibres)).toMatchObject({item:llibre.presentacio,ruta:llibre.href});
   const fitxa=llibre.items[1];
   expect(resolRutaCataleg(`?cataleg=${llibre.id}&fitxa=${fitxa.id}`,llibres)).toMatchObject({item:fitxa,ruta:fitxa.href});
  }
  expect(resolRutaCataleg('',llibres).item).toBe(llibres[0].presentacio);
  expect(resolRutaCataleg('cataleg=absent',llibres)).toBeNull();
  expect(resolRutaCataleg('absent',llibres)).toBeNull();
 });

 it('una fitxa compartida entre llibres porta el slug <llibre>--<fitxa>, com Arbres',()=>{
  expect(slugDeFitxa('arbres-2020','carrasca')).toBe('carrasca');
  expect(slugDeFitxa('arbres-2020','carrasca',{compartida:true})).toBe('arbres-2020--carrasca');
  expect(rutaCataleg('/page/arbres-monumentals','arbres-2020','carrasca',{compartida:true})).toBe('/page/arbres-monumentals/arbres-2020--carrasca');
 });

 it('Herbari de La Torre és el primer llibre: presentació + 117 plantes',()=>{
  const llibre=llibreHerbariLaTorre();expect(llibre.id).toBe('herbari-la-torre');expect(llibre.items).toHaveLength(118);expect(llibre.items[0].esPresentacio).toBe(true);
 });

 /* C26-2 #7 · IDEA-366 (22:23) · procedència, any i llicència: l'any que diuen les dades, i null només on no en diuen. */
 it('C26-2 #7 · any de la font des de la literalitat; títol curt de les oliveres',()=>{
  const llibres=llibresDelBancDeLlavors();
  expect(llibres.map(l=>l.presentacio.any)).toEqual([null,2020,null,2001]);
  const [,avl,,oliveres]=FONTS_BANC_LLAVORS;
  expect(avl.titol).toContain(String(avl.any));
  expect(oliveres.autoria).toContain(String(oliveres.any));
  expect(llibres.map(l=>l.titolCurt)).toEqual([FONTS_BANC_LLAVORS[0].autoria,FONTS_BANC_LLAVORS[1].autoria,FONTS_BANC_LLAVORS[2].autoria,'Generalitat Valenciana · Oliveres']);
  expect(TITOLS_CURTS_DE_LLIBRE).toEqual({'oliveres-gva-ivia':'Generalitat Valenciana · Oliveres'});
 });

 /* C26-2 #13 · Cap font es cita a si mateixa i cap web sense comprovar fa de font original. */
 it('C26-2 #13 · Herbari: autoria no declarada i el PDF amb la seua SHA-256, mai /page/herbari',()=>{
  const {presentacio}=llibreHerbariLaTorre();
  expect(presentacio.autoria).toBe('Autoria no declarada a la font');
  expect(presentacio.fontOriginal).not.toContain('/page/herbari');
  expect(presentacio.fontOriginal).toBe(`${ESPECIES_HERBARI_LA_TORRE_117[0].font.document} (PDF)`);
  expect(presentacio.sha256).toBe('5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673');
  expect(new Set(ESPECIES_HERBARI_LA_TORRE_117.map(e=>e.font.sha256))).toEqual(new Set([presentacio.sha256]));
 });

 it('C26-2 #13 · les webs del CIEF i de la Fundació Miquel Agustí, sense comprovar: el document fa de font original',()=>{
  const llibres=llibresDelBancDeLlavors();
  const perId=Object.fromEntries(llibres.map(l=>[l.id,l.presentacio]));
  for(const id of ['cataleg-valencia','atles-catalunya']){
   const font=FONTS_BANC_LLAVORS.find(f=>f.id===id);
   expect([id,font.webVerificada]).toEqual([id,false]);
   expect(perId[id]).toMatchObject({fontOriginal:font.document,web:font.web,webVerificada:false});
  }
  for(const id of ['avl-mallorca','oliveres-gva-ivia'])expect(perId[id]).toMatchObject({fontOriginal:expect.stringMatching(/^https:\/\//),webVerificada:true});
 });

 it('no inventa any ni llicència i rebutja rutes malicioses',()=>{
  expect(presentacioDeLaFont({id:'font',titol:'Font'}).any).toBeNull();
  expect(presentacioDeLaFont({id:'font',titol:'Font',any:'2020'}).any).toBeNull();
  expect(presentacioDeLaFont({id:'font',titol:'Font'}).llicencia).toMatch(/^No declarada/);
  for(const bad of ['../runtime','%2e%2e','a/b','__proto__','a?fitxa=x',''])expect(()=>rutaCataleg('/page/herbari',bad)).toThrow();
  expect(()=>rutaCataleg('//evil.test','font')).toThrow();
  expect(()=>rutaCataleg('/page/herbari/x','font')).toThrow();
 });
});
