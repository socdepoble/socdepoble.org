import { afterEach, expect, test } from 'vitest';
import { categoriesSistemaPerPublicar } from './publicacioSistema.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../data/identitat.js';
import { creaAdaptadorLocal } from '../data/local/adaptadorLocal.js';
import { mapSectionSubmissionToItem } from '../data/mapejadorSeccions.js';
import { destinsDeProducte } from '../data/taxonomia/destinsDeProducte.js';
import { propsDeTargetaDeProducte } from '../sections/mercat/targetaDeProducte.js';

afterEach(() => esborraSessio({abast:'tot'}));

/* C26-2 #3 (Gauntlet c13) · Canvi intencionat, IDEA-365 (21:40, regla 1): mentre el Mur mostre
   productes, el destí per defecte de publicar a 'mercat' és Mur + Mercat, la font única de
   destinsDeProducte.js (abans d'esta correcció, [Mercat] en publicar i [Mur, Mercat] en llegir). */
test('C26-1 · el destí de publicació es deriva de l’àmbit o de la secció, sense importar registres grans', () => {
  for (const [ambit, noms] of Object.entries({mur:['Mur'],mercat:['Mur','Mercat'],calendari:['Calendari'],mapa:['Mapa'],vehicle:['Transport'],animalets:['Animalets'],treball:['Treball'],habitatge:['Habitatge']})) {
    const original={title:'Publicació',ambit};
    const result=categoriesSistemaPerPublicar(original,ambit === 'mercat' ? 'mercat' : 'mur');
    expect(result.categoriesSistema).toEqual(noms);
    expect(original).not.toHaveProperty('categoriesSistema');
  }
  expect(categoriesSistemaPerPublicar({},'events').categoriesSistema).toEqual(['Calendari']);
  expect(categoriesSistemaPerPublicar({},'mercat').categoriesSistema).toEqual(['Mur','Mercat']);
  expect(categoriesSistemaPerPublicar({mostrarAlMur:false},'mercat').categoriesSistema).toEqual(['Mercat']);
  expect(categoriesSistemaPerPublicar({ambit:'constructor'},'mur').categoriesSistema).toEqual(['Mur']);
  expect(categoriesSistemaPerPublicar({ambit:'mercat'},'mur').categoriesSistema).toEqual(['Mur']);
  const privat={categoriesSistema:[]};
  expect(categoriesSistemaPerPublicar(privat,'notes')).toBe(privat);
});

test('C26-1 · llevar totes les categories explícitament o injectar tipus/noms invàlids és un error', () => {
  for (const categoriesSistema of [[],null,undefined,{},'Mur',['Inventada'],['Mur',{}],['mur']]) expect(() => categoriesSistemaPerPublicar({categoriesSistema},'mur')).toThrow('Categoria de Sistema');
  expect(categoriesSistemaPerPublicar({categoriesSistema:['Mur','Mercat','Mur']},'mur').categoriesSistema).toEqual(['Mur','Mercat']);
});

test('C26-1 · forats, índexs heretats i getters no poden simular un destí', () => {
  let lectures=0;
  const accessor=[];
  Object.defineProperty(accessor,'0',{get(){lectures++;return 'Mur';},enumerable:true});
  const heretada=new Array(1);
  Object.setPrototypeOf(heretada,{0:'Mur'});
  for (const categoriesSistema of [new Array(1),Object.assign(new Array(2),{1:'Mur'}),heretada,accessor]) expect(() => categoriesSistemaPerPublicar({categoriesSistema},'mur')).toThrow('Categoria de Sistema');
  const font={};
  Object.defineProperty(font,'categoriesSistema',{enumerable:true,get(){lectures++;return ['Mur'];}});
  expect(() => categoriesSistemaPerPublicar(font,'mur')).toThrow('Categoria de Sistema');
  expect(lectures).toBe(0);
});

test('C26-1 · el port local desa el destí i refusa el buidatge sense modificar la publicació original', async () => {
  const id='77000000-0000-4000-8000-000000000026', persona='33000000-0000-4000-8000-000000000026';
  const a=creaAdaptadorLocal({mode:'local',ara:() => new Date('2026-11-26T02:00:00Z')});
  configuraBackendSessio(a.configuracio);
  expect(desaSessio({access_token:'testimoni-local',user:{id:persona,email:'proves@poble.invalid',user_metadata:{}}})).toBe(true);
  const saved=await a.appendSectionSubmissionNetworkOnly({id,sectionId:'mur',payload:{title:'Faena',ambit:'treball',dades:{modalitat:'oferisc_ofici',ofici:'Fuster'}}});
  expect(saved.payload.categoriesSistema).toEqual(['Treball']);
  await expect(a.appendSectionSubmissionNetworkOnly({id,sectionId:'mur',payload:{title:'No ha de substituir',categoriesSistema:[]}})).rejects.toMatchObject({codi:'SDP-TAXONOMIA-DESTI'});
  const {feedPosts}=await a.loadMur(persona,{});
  expect(feedPosts.find(p => p.id === id)).toMatchObject({title:'Faena',categoriesSistema:['Treball']});
  a.dispose?.();
});

/* C26-1 #3 (Gauntlet c13) · «Sistema» és la categoria de les pàgines tècniques de Sóc de Poble
   (IDEA-365, 21:35, punt 3). El client no té cap prova fiable de qui publica (l'autoria la fixa el
   servidor i el mapejador lleva isSystem/type:'sistema'): cap entrada de client no la pot afirmar. */
test('C26-1 #3 · cap persona no es pot posar «Sistema», en cap secció pública', () => {
  for (const sectionId of ['mur','mercat','events','multimedia']) {
    for (const categoriesSistema of [['Sistema'],['Sistema','Mur'],['Mur','Sistema','Vídeo']]) {
      expect(() => categoriesSistemaPerPublicar({title:'veí',categoriesSistema},sectionId)).toThrow('Categoria de Sistema');
    }
  }
  expect(categoriesSistemaPerPublicar({title:'veí'},'mur').categoriesSistema).not.toContain('Sistema');
});

/* C26-1 #3 · IDEA-367 (23:06): «qualsevol arxiu especial incrustat o descarregable» porta la seua
   categoria de format. Vídeo i PDF ixen dels adjunts reals, no de la tria de qui publica. */
test('C26-1 #3 · Vídeo i PDF es deriven dels adjunts reals i no es poden triar sense fitxer', () => {
  expect(categoriesSistemaPerPublicar({title:'veí',categoriesSistema:['Mur','Vídeo','PDF']},'mur').categoriesSistema).toEqual(['Mur']);
  expect(() => categoriesSistemaPerPublicar({categoriesSistema:['Vídeo']},'mur')).toThrow('Categoria de Sistema');
  expect(() => categoriesSistemaPerPublicar({categoriesSistema:['PDF','Vídeo'],video_url:'/v/curs.mp4'},'mur')).toThrow('Categoria de Sistema');
  for (const adjunt of [
    {video_url:'/assets/uploads/cursos/pedra-seca.mp4'},
    {video_url:'https://mitjans.socdepoble.org/cursos/pedra-seca.webm'},
    {video_youtube:{id:'abcDEF12345',titol:'Documental'}},
    {content:'<p>Mira:</p><div data-sdp-youtube="abcDEF12345" data-titol="Pou"><a href="https://youtu.be/abcDEF12345">Pou</a></div>'},
    {description:'<div data-sdp-youtube=\'abcDEF12345\'></div>'}
  ]) expect(categoriesSistemaPerPublicar({title:'Curs',...adjunt},'mur').categoriesSistema).toEqual(['Mur','Vídeo']);
  expect(categoriesSistemaPerPublicar({title:'Curs',categoriesSistema:['Mur','Calendari'],video_url:'/v/curs.mp4'},'events').categoriesSistema).toEqual(['Mur','Calendari','Vídeo']);
  expect(categoriesSistemaPerPublicar({title:'Llibre',pdf:'/assets/uploads/patrimoni/llibre.pdf'},'mur').categoriesSistema).toEqual(['Mur','PDF']);
  // Cap adjunt de veres: ni un text qualsevol, ni data:, ni un camí protocol-relatiu, ni un getter.
  for (const fals of [{video_url:'x'},{video_url:'data:video/mp4;base64,AAAA'},{video_url:'//fora.example/v.mp4'},{video_youtube:{id:'  '}},{pdf:'llibre.txt'},{content:'data-sdp-youtube és una paraula'}]) {
    expect(categoriesSistemaPerPublicar({title:'Fals',...fals},'mur').categoriesSistema).toEqual(['Mur']);
  }
  const ambGetter={title:'Getter'};
  Object.defineProperty(ambGetter,'video_url',{enumerable:true,get(){return '/v/curs.mp4';}});
  expect(categoriesSistemaPerPublicar(ambGetter,'mur').categoriesSistema).toEqual(['Mur']);
});

/* C26-2 (P2, vídeo falsificable) · El marcador només compta com a atribut d'una etiqueta HTML: el mateix text
   escrit dins d'un paràgraf (o d'un atribut d'una altra cosa que no és cap etiqueta) no fabrica «Vídeo». */
test('C26-2 · data-sdp-youtube escrit com a text no és cap vídeo; com a atribut d’una etiqueta, sí', () => {
  /* Integrador C1-3 (IDEA-367) · El lector només pinta un <div data-sdp-youtube> amb un id d'11 caràcters: una
     altra etiqueta o un id curt no fan «Vídeo». */
  for (const fals of ['<p>data-sdp-youtube=abc</p>','data-sdp-youtube="abc"','<p>Escriu data-sdp-youtube="abc" al cos</p>','< div data-sdp-youtube="abc">','<div>data-sdp-youtube=\'abc\'</div>','<p data-sdp-youtube=abcDEF12345>hola</p>','<span title="a data-sdp-youtube=abcDEF12345">t</span>','<div data-sdp-youtube="abc"></div>','<div data-sdp-youtube="abcDEF123456"></div>']) {
    expect([fals,categoriesSistemaPerPublicar({title:'Fals',content:fals},'mur').categoriesSistema]).toEqual([fals,['Mur']]);
  }
  for (const ver of ['<div data-sdp-youtube="abcDEF12345"></div>','<DIV class="v" data-sdp-youtube=abcDEF12345>','<div\ndata-sdp-youtube = \'abc_DEF-345\'>']) {
    expect([ver,categoriesSistemaPerPublicar({title:'Ver',description:ver},'mur').categoriesSistema]).toEqual([ver,['Mur','Vídeo']]);
  }
});

/* Zero ReDoS (core-seguretat-audit) · Un cos hostil de 120 000 lletres sense cap «>» es revisa en temps lineal:
   amb la classe [^>]* la cerca era quadràtica (DADA del 261126: ~1,9 s en Node). El sostre és ample a propòsit. */
test('C26-2 · un cos hostil sense «>» no bloqueja la publicació (cerca lineal)', () => {
  const hostil = '<a '.repeat(40000);
  const inici = performance.now();
  expect(categoriesSistemaPerPublicar({title:'Hostil',content:hostil},'mur').categoriesSistema).toEqual(['Mur']);
  expect(performance.now() - inici).toBeLessThan(250);
});

/* C26-2 #3 (Gauntlet c13) · El mateix producte, publicat i llegit, té el mateix destí: la font única. */
test('C26-2 #3 · publicar i llegir el mateix producte dona Mur + Mercat a les dues bandes', () => {
  const producte={type:'product',title:'Oli sintètic 1 L',category_slug:'alimentacio',tag:'oli-verge-extra'};
  const publicat=categoriesSistemaPerPublicar(producte,'mercat');
  const llegit=mapSectionSubmissionToItem({id:'oli-1',sectionId:'mercat',createdAt:'2026-11-26T05:00:00.000Z',payload:publicat});
  const llegat=mapSectionSubmissionToItem({id:'oli-1',sectionId:'mercat',createdAt:'2026-11-26T05:00:00.000Z',payload:producte});
  expect(publicat.categoriesSistema).toEqual(['Mur','Mercat']);
  expect(llegit.categoriesSistema).toEqual(publicat.categoriesSistema);
  expect(llegat.categoriesSistema).toEqual(publicat.categoriesSistema);
  expect(destinsDeProducte(producte)).toEqual(publicat.categoriesSistema);
  const sistema=(item)=>propsDeTargetaDeProducte(item).labels.filter((l)=>l.className==='sdp-badge-system').map((l)=>l.text);
  expect(sistema(llegit)).toEqual(['Mur','Mercat']);
  expect(sistema(llegat)).toEqual(sistema(llegit));
  expect(producte).not.toHaveProperty('categoriesSistema');
});

test('C26-2 #3 · el port local publica i torna a llegir el producte amb Mur + Mercat', async () => {
  const id='77000000-0000-4000-8000-000000001226', persona='33000000-0000-4000-8000-000000001226';
  const a=creaAdaptadorLocal({mode:'local',ara:() => new Date('2026-11-26T05:00:00Z')});
  configuraBackendSessio(a.configuracio);
  expect(desaSessio({access_token:'testimoni-local',user:{id:persona,email:'proves@poble.invalid',user_metadata:{}}})).toBe(true);
  const saved=await a.appendSectionSubmissionNetworkOnly({id,sectionId:'mercat',payload:{type:'product',title:'Oli sintètic 2 L',category_slug:'alimentacio',tag:'oli-verge-extra'}});
  expect(saved.payload.categoriesSistema).toEqual(['Mur','Mercat']);
  const {marketItems}=await a.loadMur(persona,{});
  const llegit=marketItems.find((p) => p.id === id);
  expect(llegit).toMatchObject({title:'Oli sintètic 2 L',categoriesSistema:['Mur','Mercat']});
  expect(destinsDeProducte(llegit)).toEqual(saved.payload.categoriesSistema);
  a.dispose?.();
});
