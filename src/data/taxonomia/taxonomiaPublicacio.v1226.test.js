import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getSectionListPath } from '../../config/navigation.js';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { PAGINES_EDITORIALS_TAXONOMIA, SISTEMA_CATEGORIES_12, SLUGS_PROTEGITS_SISTEMA, ETIQUETES_COMUNES, ETIQUETES_COMUNES_PENDENTS_5L, ETIQUETES_LOCALS_SEED, ENTITATS_RESERVADES_TAXONOMIA, TESAURUS_ALIES_ETIQUETES, TRIATGE_ETIQUETES_1_49, PILARS_TEMATICS_BASE, categoriesSistemaDe, esEntitatReservadaTaxonomia, esSlugProtegitSistema, etiquetaSegonsContext, labelsSistema, nomCategoriaSistema, resolCategoriaSistema, resolEtiquetaComuna, resolPaginaEditorialTaxonomia, slugTaxonomia, validaDestinsPublicacio, validaSlugPublicUsuari } from './taxonomiaPublicacio.js';
import { agregaEtiquetesEmergents, metadadesTaxonomiaPubliques, taxonomiaEsPublica } from './folksonomiaCurada.js';
import { nomEstructural, nomEtiquetaCanonica } from './taxonomiaCanonica.js';

describe('C26-1 · Categories de Sistema 9+3', () => {
  test('les dotze categories tenen nom i slug en cinc llengües i ruta executable', () => {
    expect(SISTEMA_CATEGORIES_12.map(c => c.nom)).toEqual(['Sistema','Mur','Mercat','Calendari','Mapa','Transport','Animalets','Treball','Habitatge','Catàlegs','Vídeo','PDF']);
    for (const c of SISTEMA_CATEGORIES_12) {
      expect(Object.keys(c.labels)).toEqual(['ca','es','en','eu','gl']);
      for (const idioma of Object.keys(c.labels)) {
        expect(nomEstructural(c.nom, idioma)).toBe(c.labels[idioma]);
        expect(nomCategoriaSistema(c.labels[idioma], 'ca')).toBe(c.nom);
        expect(esSlugProtegitSistema(c.slugs[idioma])).toBe(true);
      }
      expect(c.rutaDedicada.startsWith('/')).toBe(true);
    }
  });
  test('no publica peces sense destí i absorbeix Agenda/Esdeveniments sense duplicats', () => {
    expect(validaDestinsPublicacio([]).valid).toBe(false);
    expect(validaDestinsPublicacio(['Inventada', null, {}]).valid).toBe(false);
    expect(categoriesSistemaDe(['Mur','Agenda','Esdeveniments','Calendar','Mur'])).toEqual(['Mur','Calendari']);
    expect(labelsSistema(['Catàlegs','PDF'], 'en')).toEqual([{text:'Catalogues',className:'sdp-badge-system',href:'/categoria/catalegs'},{text:'PDF',className:'sdp-badge-system',href:'/categoria/pdf'}]);
  });
  test('registre protegit 5L amb denegació estricta de noms d’usuari', () => {
    expect(Object.keys(SLUGS_PROTEGITS_SISTEMA).length).toBeGreaterThan(70);
    for (const slug of ['calendari','esdeveniments','agenda','catalegs','llibres','biblioteques','pdfs','videos','audio','presentacio','multimedia','calendar','catalogues','libraries','liburuak','aurkezpena','axenda']) {
      expect(esSlugProtegitSistema(slug)).toBe(true);
      expect(validaSlugPublicUsuari(slug)).toBe(false);
    }
    expect(validaSlugPublicUsuari('horta-de-maria')).toBe(true);
    for (const slug of [null,{},'../mur','Mur','%6dur','mur/altre','a'.repeat(81),'__proto__']) expect(validaSlugPublicUsuari(slug)).toBe(false);
    expect(esSlugProtegitSistema('__proto__')).toBe(false);
  });
});

describe('C26-1 · Triatge i tesaurus', () => {
  test('cobreix cada decisió humana 1..49 i manté els tres pendents', () => {
    expect(TRIATGE_ETIQUETES_1_49.map(e => e.numero)).toEqual(Array.from({length:49},(_,i) => i+1));
    expect(TRIATGE_ETIQUETES_1_49.filter(e => e.tipus === 'pendent').map(e => e.numero)).toEqual([1,13,29]);
    expect(TRIATGE_ETIQUETES_1_49[3]).toMatchObject({tipus:'entitat',desti:'Aplec pel Territori'});
    expect(TRIATGE_ETIQUETES_1_49[40]).toMatchObject({tipus:'local',desti:'Sant Gregori'});
    expect(TRIATGE_ETIQUETES_1_49.filter(e => e.tipus === 'geografia').map(e => e.numero)).toEqual([21,33,42]);
    expect(ETIQUETES_LOCALS_SEED.map(e => e.nom)).toContain('Zona 14');
    expect(PILARS_TEMATICS_BASE).toEqual(['TIC','Natura i Patrimoni','Món rural','Reivindicant']);
    for (const name of ['Aplec pel Territori','El Rentonar','Font Roja','Serra dels Plans','Sant Gregori','NGI Fediversity']) expect(ETIQUETES_COMUNES.some(e => e.nom === name)).toBe(false);
  });
  test('àlies convergents, Disseny UI i Pedra Seca patrimonial són diferents', () => {
    for (const [alies, canonica] of Object.entries(TESAURUS_ALIES_ETIQUETES)) expect(resolPaginaEditorialTaxonomia(alies)?.h1).toBe(canonica);
    expect(resolPaginaEditorialTaxonomia('Trobades')).toMatchObject({slug:'aplecs',alies:expect.arrayContaining(['Trobades'])});
    expect(resolPaginaEditorialTaxonomia('Aplec pel Territori')).toBeNull();
    expect(etiquetaSegonsContext('Pedra Seca','UI')).toBe('Disseny');
    expect(etiquetaSegonsContext('Pedra Seca','patrimoni')).toBe('Pedra Seca');
    expect(resolPaginaEditorialTaxonomia('disseny').rutaDedicada).toBe('/disseny');
    expect(nomEtiquetaCanonica('Idees','en')).toBe('Ideas');
  });
  test('model exacte /etiqueta/idees, esquema complet i edició CMS segura', () => {
    expect(resolPaginaEditorialTaxonomia('/etiqueta/idees')).toEqual({tipus:'etiqueta',slug:'idees',h1:'Idees',h2:'Propostes actives i concretes',entradeta:'Si açò ha funcionat allà, podria valdre per al nostre poble',alies:['Propostes'],rutaDedicada:'/etiqueta/idees'});
    for (const e of [...SISTEMA_CATEGORIES_12,...ETIQUETES_COMUNES]) {
      const p=resolPaginaEditorialTaxonomia(`${'id' in e ? '/categoria/' : '/etiqueta/'}${e.slug}`);
      expect(p).toMatchObject({h1:expect.any(String),h2:expect.any(String),entradeta:expect.any(String),alies:expect.any(Array),rutaDedicada:expect.any(String)});
      expect(p.entradeta).not.toMatch(/[<>*`]/);
    }
    expect(resolPaginaEditorialTaxonomia('idees',{idees:{h2:'Editat per una persona',entradeta:'<script>alert(1)</script>'}})).toMatchObject({h2:'Editat per una persona',entradeta:'Si açò ha funcionat allà, podria valdre per al nostre poble'});
    for (const slug of [null,{},'/etiqueta/../idees','/runtime/idees','/etiqueta/idees/extra','x'.repeat(100000)]) expect(resolPaginaEditorialTaxonomia(slug)).toBeNull();
  });
});

describe('C26-1 · Privadesa simple i safata curada', () => {
  const publicacio = {id:'p1',author_id:'a1',town_id:'t1',visibility:'public',status:'published',categoriesSistema:['Mur'],etiquetes:['Festivals','Festivals','Música','@El Rentonar','Font Roja','PDF']};
  test('un esborrany o privat mai revela categories ni etiquetes', () => {
    expect(taxonomiaEsPublica(publicacio)).toBe(true);
    for (const estat of [{status:'draft'},{estat:'esborrany',status:undefined},{visibility:'private'},{private:true},{esborrany:true},{draft:true},{isDraft:true},{published:false},{is_published:false},{visibility:'friends'},{status:'unknown'},{visibility:undefined,status:undefined}]) {
      const p={...publicacio,...estat};
      expect(taxonomiaEsPublica(p)).toBe(false);
      expect(metadadesTaxonomiaPubliques(p)).toEqual({categoriesSistema:[],etiquetes:[]});
    }
    expect(metadadesTaxonomiaPubliques(publicacio)).toEqual({categoriesSistema:['Mur'],etiquetes:publicacio.etiquetes});
  });
  test('compta autors i pobles diferents, exclou privats/entitats/geografia i deduplica posts', () => {
    const secret={...publicacio,id:'secret',author_id:'secret',town_id:'secret',status:'draft',etiquetes:['Festivals','Secret']};
    expect(agregaEtiquetesEmergents([publicacio,publicacio,{...publicacio,id:'p2',town_id:'t2'},{...publicacio,id:'p3',author_id:'a2',town_id:'t2'},secret])).toEqual([{slug:'festivals',nom:'Festivals',estat:'emergent',local:false,promocionable:true,nombreAutors:2,nombrePobles:2,nombrePublicacions:3}]);
    expect(agregaEtiquetesEmergents([{...publicacio,id:'p2',author_id:{toString:null}},null,{}])).toEqual([]);
    expect(agregaEtiquetesEmergents('secret')).toEqual([]);
  });
  test('estats simultanis contradictoris i visibilitat malformada fallen tancats', () => {
    for (const canvi of [{estat:'esborrany'},{estat:'private'},{estat:'pending'},{estat:{}},{status:{}}, ...[null,{},[],0,false,undefined,''].map(visibility => ({visibility}))]) {
      const p={...publicacio,...canvi};
      expect(taxonomiaEsPublica(p)).toBe(false);
      expect(metadadesTaxonomiaPubliques(p)).toEqual({categoriesSistema:[],etiquetes:[]});
      expect(agregaEtiquetesEmergents([p])).toEqual([]);
    }
    expect(taxonomiaEsPublica({...publicacio,status:'esborrany',estat:'published'})).toBe(false);
    expect(taxonomiaEsPublica({...publicacio,status:'published',estat:'publicat'})).toBe(true);
  });
  test('100k entrades hostils no produeixen errors ni creixement quadràtic del resultat', () => {
    const tags=Array.from({length:100000},(_,i) => i % 2 ? '@' : '#Festivals');
    expect(agregaEtiquetesEmergents([{...publicacio,etiquetes:tags}])).toEqual([{slug:'festivals',nom:'Festivals',estat:'emergent',local:false,promocionable:true,nombreAutors:1,nombrePobles:1,nombrePublicacions:1}]);
  });
});

/* C26-1 · Correccions del Gauntlet c13 (lent c26-1: #6, #7, #8, #9 i #10). */
describe('C26-1 · Gauntlet c13 · reserves, àlies, rutes i safata observadora', () => {
  test('#6 · IDEA-369 #23 · Gent que Fa Música és entitat reservada com Aplec pel Territori; el triatge #23 conserva la procedència', () => {
    expect(ENTITATS_RESERVADES_TAXONOMIA).toEqual(['Aplec pel Territori','Gent que Fa Música']);
    for (const nom of ENTITATS_RESERVADES_TAXONOMIA) {
      expect(esEntitatReservadaTaxonomia(nom)).toBe(true);
      expect(Object.hasOwn(TESAURUS_ALIES_ETIQUETES, nom)).toBe(false);
      expect(resolEtiquetaComuna(nom)).toBeNull();
      expect(resolPaginaEditorialTaxonomia(`/etiqueta/${slugTaxonomia(nom)}`)).toBeNull();
    }
    expect(TRIATGE_ETIQUETES_1_49[22]).toMatchObject({numero:23,original:'Gent que Fa Música',tipus:'comuna',desti:'Música'});
    expect(resolPaginaEditorialTaxonomia('/etiqueta/musica')).toMatchObject({h1:'Música',alies:[]});
    expect(agregaEtiquetesEmergents([{id:'gfm',author_id:'a1',town_id:'t1',status:'published',etiquetes:['Gent que Fa Música','Aplec pel Territori']}])).toEqual([]);
  });

  test('#7 · IDEA-369 #44 · els plurals i singulars reservats entren com a àlies de Vídeo, PDF i Catàlegs; Llibres continua comuna', () => {
    const esperats = {Vídeo:['Vídeos','Videos','Bideoak'],PDF:['PDFs','PDFak'],Catàlegs:['Catàleg','Cataleg','Catálogo','Catalogue','Catalog','Catalogs','Katalogoa']};
    for (const [categoria, noms] of Object.entries(esperats)) for (const nom of noms) {
      expect(resolCategoriaSistema(nom)?.nom, nom).toBe(categoria);
      expect(esSlugProtegitSistema(nom), nom).toBe(true);
    }
    expect(validaDestinsPublicacio(['Vídeos','PDFs','Cataleg'])).toMatchObject({valid:true,categoriesSistema:['Vídeo','PDF','Catàlegs']});
    expect(TRIATGE_ETIQUETES_1_49[43]).toMatchObject({numero:44,original:'Vídeos',tipus:'sistema',desti:'Vídeo'});
    expect(resolCategoriaSistema(TRIATGE_ETIQUETES_1_49[43].original)?.nom).toBe(TRIATGE_ETIQUETES_1_49[43].desti);
    for (const nom of ['Llibres','Llibre','Biblioteca','Biblioteques']) expect(resolCategoriaSistema(nom), nom).toBeNull();
    expect(resolEtiquetaComuna('Llibres')?.nom).toBe('Llibres');
  });

  /* v1.2.26 · R2-2 (D1) · Llibre Mestre, IDEA-365 (21:37, punts 6 i 7; línies 3816-3817 i 3820): Transport i
     Animalets porten a la seua pàgina automàtica de categoria; només /mur, /mercat i /calendari tenen ruta pròpia.
     Esta prova deroga la de C26-1 #8, que els enviava a /vehicle i /animalets. Les seccions continuen existint
     (navigation.js) per a les portes Publicar i Saber-ne més del Panell, no per a la píndola. */
  test('#8 · D1 · Transport i Animalets porten a /categoria/<slug>, la mateixa ruta que rutaDePindola dona a la UniversalPage', () => {
    expect(labelsSistema(['Transport','Animalets'])).toEqual([
      {text:'Transport',className:'sdp-badge-system',href:'/categoria/transport'},
      {text:'Animalets',className:'sdp-badge-system',href:'/categoria/animalets'}
    ]);
    expect(getSectionListPath('vehicle')).toBe('/vehicle');
    expect(getSectionListPath('animalets')).toBe('/animalets');
    expect(resolCategoriaSistema('Vehicle compartit')?.rutaDedicada).toBe('/categoria/transport');
    for (const slug of ['transport','animalets']) {
      const pagina = resolPaginaEditorialTaxonomia(`/categoria/${slug}`);
      expect(pagina, slug).toMatchObject({tipus:'categoria',slug,rutaDedicada:`/categoria/${slug}`});
      // PaginaEditorialEtiqueta.jsx només pinta el botó quan rutaDedicada no és la pròpia pàgina: cap botó cap a /vehicle.
      expect(pagina.rutaDedicada, slug).toBe(`/${pagina.tipus}/${pagina.slug}`);
    }
    expect(PAGINES_EDITORIALS_TAXONOMIA.filter(p => ['/vehicle','/animalets'].includes(p.rutaDedicada))).toEqual([]);
  });

  test('#8 · D1 · la ruta de cada Categoria de Sistema és la de rutaDePindola, la de la card i la de la UniversalPage', () => {
    // Només /mur, /mercat i /calendari tenen ruta pròpia a la línia 3820; /mapa, /treball i /habitatge són les que
    // rutaDePindola.js ja resol (fora d'abast d'R2-2). La resta és la pàgina automàtica /categoria/<slug>.
    for (const c of SISTEMA_CATEGORIES_12) {
      const [label] = labelsSistema([c.nom]);
      expect(label.href, c.nom).toBe(c.rutaDedicada);
      expect(rutaDePindola({text:c.nom,className:'sdp-badge-system'}), c.nom).toBe(c.rutaDedicada);
    }
    expect(Object.fromEntries(SISTEMA_CATEGORIES_12.map(c => [c.id, c.rutaDedicada]))).toEqual({
      sistema:'/categoria/sistema', mur:'/mur', mercat:'/mercat', calendari:'/calendari', mapa:'/mapa',
      transport:'/categoria/transport', animalets:'/categoria/animalets', treball:'/treball', habitatge:'/habitatge',
      catalegs:'/categoria/catalegs', video:'/categoria/video', pdf:'/categoria/pdf'
    });
  });

  test('#8 · les còpies dels 12 noms (publicacioSistema, taxonomiaPagina, migració 140 i motor) no es desfasen', () => {
    // Només llig les fonts: cada llista literal que comença per 'Sistema' i acaba en 'PDF' ha de ser la del motor.
    const motor = SISTEMA_CATEGORIES_12.map(c => c.nom);
    expect(motor).toHaveLength(12);
    for (const fitxer of ['src/utils/publicacioSistema.js', 'src/data/taxonomia/taxonomiaPagina.js', 'supabase/migrations/20261126030500_v1226_taxonomia_pagines.sql']) {
      const codi = readFileSync(resolve(process.cwd(), fitxer), 'utf8');
      const llistes = [...codi.matchAll(/[([]\s*('Sistema'\s*,[^()[\]]*?'PDF')\s*[)\]]/g)].map(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
      expect(llistes.length, fitxer).toBeGreaterThan(0);
      for (const noms of llistes) expect(noms, fitxer).toEqual(motor);
    }
  });

  test('#9 · les 9 comunes d’IDEA-369 §1 sense 5L queden explícites, sense traducció inventada ni pas per la safata', () => {
    expect(ETIQUETES_COMUNES_PENDENTS_5L.map(e => e.nom)).toEqual(['Energia','Solar','Eòlica','Nuclear','Mercadets','Neteja','Mosaic Mediterrani','Macrourbanitzacions','Apps']);
    for (const e of ETIQUETES_COMUNES_PENDENTS_5L) {
      expect(e).toEqual({nom:e.nom,slug:slugTaxonomia(e.nom),estat:'pendent-5L',traca:'IDEA-369 §1'});
      expect(resolEtiquetaComuna(e.nom)).toBeNull();
      expect(ETIQUETES_COMUNES.some(c => c.slug === e.slug)).toBe(false);
    }
    expect(agregaEtiquetesEmergents([{id:'p9',author_id:'a1',town_id:'t1',status:'published',etiquetes:['Solar','Mercadets','#Apps','Festivals']}]).map(e => e.slug)).toEqual(['festivals']);
  });

  test('#10 · IDEA-369 i IDEA-371 §2 · la safata observa els pendents #1, #13 i #29 i marca les locals sense promoure-les', () => {
    const p = (id, autor, poble, etiquetes) => ({id,author_id:autor,town_id:poble,visibility:'public',etiquetes});
    const safata = agregaEtiquetesEmergents([
      p('a','a1','t1',['Opinió','Associacionisme','El Camí','Festivals','El Carreró','Sant Gregori','Zona 14']),
      p('b','a2','t2',['El Carreró Centre Cultural i Tecnològic','Opinió','Festivals'])
    ]);
    const perSlug = Object.fromEntries(safata.map(e => [e.slug, e]));
    expect(Object.keys(perSlug).sort()).toEqual(['associacionisme','el-cami','el-carrero','festivals','opinio','sant-gregori','zona-14']);
    for (const [slug, nom] of [['associacionisme','Associacionisme'],['el-cami','El Camí'],['opinio','Opinió']]) expect(perSlug[slug]).toMatchObject({nom,estat:'pendent',local:false,promocionable:false});
    for (const [slug, nom] of [['el-carrero','El Carreró'],['sant-gregori','Sant Gregori'],['zona-14','Zona 14']]) expect(perSlug[slug]).toMatchObject({nom,estat:'local',local:true,promocionable:false});
    expect(perSlug['el-carrero']).toMatchObject({nombreAutors:2,nombrePobles:2,nombrePublicacions:2});
    expect(perSlug.festivals).toMatchObject({estat:'emergent',local:false,promocionable:true,nombreAutors:2});
    expect(TRIATGE_ETIQUETES_1_49.filter(e => e.tipus === 'pendent').map(e => slugTaxonomia(e.original))).toEqual(['associacionisme','el-cami','opinio']);
  });
});
