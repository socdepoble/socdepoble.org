/** IDEA-365..371. Catàleg de publicació diferit; el vocabulari històric d'importació és separat. */
const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];
const immutable = value => Object.freeze(value);
const text = value => typeof value === 'string' ? value : '';
export const slugTaxonomia = value => text(value).slice(0, 160).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const noms5 = noms => immutable(Object.fromEntries(IDIOMES.map((lang, index) => [lang, noms[index]])));
const filesSistema = [
  ['sistema', ['Sistema','Sistema','System','Sistema','Sistema'], '/categoria/sistema'],
  ['mur', ['Mur','Muro','Wall','Horma','Muro'], '/mur'],
  ['mercat', ['Mercat','Mercado','Market','Merkatua','Mercado'], '/mercat'],
  ['calendari', ['Calendari','Calendario','Calendar','Egutegia','Calendario'], '/calendari'],
  ['mapa', ['Mapa','Mapa','Map','Mapa','Mapa'], '/mapa'],
  /* v1.2.26 · R2-2 (D1) · Llibre Mestre, IDEA-365 (21:37, punts 6 i 7; línies 3816-3817 i 3820): Transport i
     Animalets porten a la seua pàgina automàtica de categoria, /categoria/<slug>; només /mur, /mercat i /calendari
     tenen ruta pròpia. Les seccions /vehicle i /animalets són de les portes Publicar i Saber-ne més del Panell
     (destinsControl.js · seccio), no de la píndola. És la mateixa ruta que rutaDePindola dona a la UniversalPage. */
  ['transport', ['Transport','Transporte','Transport','Garraioa','Transporte'], null],
  ['animalets', ['Animalets','Animales','Pets','Animaliak','Animaliños'], null],
  ['treball', ['Treball','Trabajo','Work','Lana','Traballo'], '/treball'],
  ['habitatge', ['Habitatge','Vivienda','Housing','Etxebizitza','Vivenda'], '/habitatge'],
  ['catalegs', ['Catàlegs','Catálogos','Catalogues','Katalogoak','Catálogos'], null],
  ['video', ['Vídeo','Vídeo','Video','Bideoa','Vídeo'], null],
  ['pdf', ['PDF','PDF','PDF','PDF','PDF'], null]
];
export const SISTEMA_CATEGORIES_12 = immutable(filesSistema.map(([id, noms, rutaDedicada]) => immutable({
  id, slug: id, nom: noms[0], labels: noms5(noms),
  slugs: noms5(noms.map(slugTaxonomia)), rutaDedicada: rutaDedicada ?? `/categoria/${id}`
})));
const indexSistema = new Map();
for (const categoria of SISTEMA_CATEGORIES_12) for (const nom of [categoria.id, ...Object.values(categoria.labels)]) indexSistema.set(slugTaxonomia(nom), categoria);
/* Àlies d'entrada: Calendari absorbix Agenda i Esdeveniments (IDEA-365, 21:58 #4) i Vehicle compartit és part
   de Transport. C26-1 #7 · Els plurals i singulars que el registre protegit ja reserva (triatge #44 «Vídeos»):
   Vídeos/Videos → Vídeo, PDFs → PDF i Catàleg/Cataleg → Catàlegs, en les 5 llengües. Llibres no: és etiqueta comuna. */
const aliesSistema = [
  ['calendari', ['Agenda','Esdeveniments','Eventos','Events','Ekitaldiak']],
  ['transport', ['Vehicle compartit']],
  ['catalegs', ['Catàleg','Catálogo','Catalogue','Catalog','Catalogs','Katalogoa']],
  ['video', ['Vídeos','Bideoak']],
  ['pdf', ['PDFs','PDFak']]
];
for (const [id, noms] of aliesSistema) for (const nom of noms) indexSistema.set(slugTaxonomia(nom), SISTEMA_CATEGORIES_12.find(c => c.id === id));
export function resolCategoriaSistema(nom) { return indexSistema.get(slugTaxonomia(nom)) ?? null; }
export function nomCategoriaSistema(nom, idioma = 'ca') { return resolCategoriaSistema(nom)?.labels[idioma] ?? resolCategoriaSistema(nom)?.labels.ca ?? null; }
export function categoriesSistemaDe(noms) {
  return Array.isArray(noms) ? [...new Set(noms.map(nom => resolCategoriaSistema(nom)?.nom).filter(Boolean))] : [];
}
export function validaDestinsPublicacio(noms) {
  const categories = categoriesSistemaDe(noms);
  return immutable({ valid: categories.length > 0, categoriesSistema: categories, errors: categories.length ? [] : ['Cal almenys una Categoria de Sistema per publicar.'] });
}
export function labelsSistema(noms, idioma = 'ca') {
  return categoriesSistemaDe(noms).map(nom => { const c = resolCategoriaSistema(nom); return { text: c.labels[idioma] ?? c.nom, className: 'sdp-badge-system', href: c.rutaDedicada }; });
}

/** Cada clau reservada porta les llengües que l'han reservada. No decidix autoritat d'usuari. */
const reservats5 = {
  ca: 'calendari esdeveniments agenda sistema mur mercat mapa transport animalets treball habitatge cataleg catalegs llibre llibres biblioteca biblioteques video videos pdf pdfs audio presentacio multimedia',
  es: 'calendario eventos agenda sistema muro mercado mapa transporte animales mascotas trabajo vivienda catalogo catalogos libro libros biblioteca bibliotecas video videos pdf pdfs audio presentacion multimedia',
  en: 'calendar events agenda system wall market map transport pets animals work jobs housing catalogue catalogues catalog catalogs book books library libraries video videos pdf pdfs audio presentation multimedia',
  eu: 'egutegia ekitaldiak agenda sistema horma merkatua mapa garraioa animaliak lana etxebizitza katalogoa katalogoak liburua liburuak liburutegia liburutegiak bideoa bideoak pdf pdfak audioa aurkezpena multimedia',
  gl: 'calendario eventos axenda sistema muro mercado mapa transporte animalinos animais traballo vivenda catalogo catalogos libro libros biblioteca bibliotecas video videos pdf pdfs audio presentacion multimedia'
};
const slugsProtegits = Object.create(null);
for (const [idioma, noms] of Object.entries(reservats5)) for (const slug of noms.split(' ')) {
  if (!slugsProtegits[slug]) slugsProtegits[slug] = [];
  slugsProtegits[slug].push(idioma);
}
export const SLUGS_PROTEGITS_SISTEMA = immutable(Object.fromEntries(Object.entries(slugsProtegits).map(([slug, langs]) => [slug, immutable(langs)])));
export function esSlugProtegitSistema(slug) { return Object.hasOwn(SLUGS_PROTEGITS_SISTEMA, slugTaxonomia(slug)); }
export function validaSlugPublicUsuari(slug) {
  const value = text(slug);
  return value.length > 0 && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !esSlugProtegitSistema(value);
}

export const PILARS_TEMATICS_BASE = immutable(['TIC', 'Natura i Patrimoni', 'Món rural', 'Reivindicant']);
const filesComunes = [
 ['Activitats','Actividades','Activities','Jarduerak','Actividades'],
 ['Aplecs','Encuentros','Gatherings','Topaketak','Encontros'],
 ['Arbres','Árboles','Trees','Zuhaitzak','Árbores'],
 ['Bioconstrucció','Bioconstrucción','Natural building','Bioeraikuntza','Bioconstrución'],
 ['Camí de Sant Jaume','Camino de Santiago','Way of Saint James','Donejakue bidea','Camiño de Santiago'],
 ['Cartografia','Cartografía','Cartography','Kartografia','Cartografía'],
 ['Conferències','Conferencias','Talks','Hitzaldiak','Conferencias'],
 ['Desenvolupament Sostenible','Desarrollo Sostenible','Sustainable Development','Garapen Jasangarria','Desenvolvemento Sostible'],
 ['Disseny','Diseño','Design','Diseinua','Deseño'],
 ['Documentació','Documentación','Documentation','Dokumentazioa','Documentación'],
 ['Esports','Deportes','Sports','Kirolak','Deportes'],
 ['Festes','Fiestas','Celebrations','Jaiak','Festas'],
 ['Herbari','Herbario','Herbarium','Herbarioa','Herbario'],
 ['Idees','Ideas','Ideas','Ideiak','Ideas'],
 ['Incendis','Incendios','Wildfires','Suteak','Incendios'],
 ['Llavors','Semillas','Seeds','Haziak','Sementes'],
 ['Llibres','Libros','Books','Liburuak','Libros'],
 ['Macroplantes','Macroplantas','Industrial energy plants','Energia makroplantak','Macroplantas'],
 ['Memfotisme','Memfotismo','Memfotism','Memfotismoa','Memfotismo'],
 ['Música','Música','Music','Musika','Música'],
 ['Node 0','Nodo 0','Node 0','0 nodoa','Nodo 0'],
 ['Pedra Seca','Piedra Seca','Dry Stone','Harri Lehorra','Pedra Seca'],
 ['Premsa','Prensa','Press','Prentsa','Prensa'],
 ['Projectes','Proyectos','Projects','Proiektuak','Proxectos'],
 ['Replantacions','Replantaciones','Replanting','Birlandaketak','Replantacións'],
 ['Reunions','Reuniones','Meetings','Bilerak','Reunións'],
 ['Rutes','Rutas','Routes','Ibilbideak','Rutas'],
 ['Receptes','Recetas','Recipes','Errezetak','Receitas']
];
export const ETIQUETES_COMUNES = immutable(filesComunes.map(noms => immutable({ nom: noms[0], slug: slugTaxonomia(noms[0]), labels: noms5(noms), ambit: noms[0] === 'Pedra Seca' ? 'patrimoni-bioconstruccio-rural' : 'xarxa', rutaDedicada: noms[0] === 'Disseny' ? '/disseny' : `/etiqueta/${slugTaxonomia(noms[0])}` })));
export const ETIQUETES_LOCALS_SEED = immutable(['Brull Viu','Cims per la llengua','El Carreró','El Planet','Fadrins','Pla Eòlic','Radar No','Sant Gregori','Zona 14'].map(nom => immutable({ nom, slug: slugTaxonomia(nom), ambit: 'local', requereixPropietari: true })));
/** C26-1 #9 · IDEA-369 §1 (00:09) declara comunes de la xarxa estes 9 etiquetes, però encara no tenen les 5 llengües
 * ni pàgina editorial. No es resolen com a comunes ni s'hi inventen traduccions; la safata no les tracta com a emergents. */
export const ETIQUETES_COMUNES_PENDENTS_5L = immutable(['Energia','Solar','Eòlica','Nuclear','Mercadets','Neteja','Mosaic Mediterrani','Macrourbanitzacions','Apps']
  .map(nom => immutable({ nom, slug: slugTaxonomia(nom), estat: 'pendent-5L', traca: 'IDEA-369 §1' })));
/** C26-1 #6 · Noms reservats com a pàgina o entitat pròpia (`@`), mai àlies públic d'una etiqueta: Aplec pel Territori
 * (IDEA-369, correcció #4 de les 00:28) i Gent que Fa Música (IDEA-369 #23). El triatge #23 continua portant els
 * articles històrics de Gent que Fa Música a Música (procedència), però cap URL /etiqueta/ no resol el nom. */
export const ENTITATS_RESERVADES_TAXONOMIA = immutable(['Aplec pel Territori','Gent que Fa Música']);
const entitatsReservades = new Set(ENTITATS_RESERVADES_TAXONOMIA.map(slugTaxonomia));
export function esEntitatReservadaTaxonomia(nom) { return entitatsReservades.has(slugTaxonomia(nom)); }
export const TESAURUS_ALIES_ETIQUETES = immutable({
  'Trobades':'Aplecs', 'Aplec':'Aplecs', 'Xarrades':'Conferències', 'Plànols':'Cartografia', 'Propostes':'Idees', 'Noticies':'Premsa', 'Notícies':'Premsa',
  'Arbres Monumentals':'Arbres', 'Camí de Santiago':'Camí de Sant Jaume', 'Festes dels Pobles':'Festes', 'Pedra en sec':'Pedra Seca'
});
const indexComunes = new Map();
for (const etiqueta of ETIQUETES_COMUNES) for (const nom of [etiqueta.slug, ...Object.values(etiqueta.labels)]) indexComunes.set(slugTaxonomia(nom), etiqueta);
for (const [alies, nom] of Object.entries(TESAURUS_ALIES_ETIQUETES)) indexComunes.set(slugTaxonomia(alies), indexComunes.get(slugTaxonomia(nom)));
export function resolEtiquetaComuna(nom) { return indexComunes.get(slugTaxonomia(nom)) ?? null; }
export function nomEtiquetaComuna(nom, idioma = 'ca') { const e = resolEtiquetaComuna(nom); return e?.labels[idioma] ?? e?.nom ?? null; }
/** Un context UI explícit no pot rebre l'etiqueta patrimonial Pedra Seca. */
export function etiquetaSegonsContext(nom, context = '') {
  const etiqueta = resolEtiquetaComuna(nom);
  return etiqueta?.nom === 'Pedra Seca' && ['ui','disseny','interficie'].includes(slugTaxonomia(context)) ? 'Disseny' : etiqueta?.nom ?? text(nom);
}

/** Decisions humanes 1..49: els pendents continuen pendents, sense promoció automàtica. */
const triatge = [
 ['Associacionisme','pendent',null], ['Activitats','comuna','Activitats'], ['Ajuntament de La Torre','entitat','Ajuntament de La Torre'], ['Aplec pel Territori','entitat','Aplec pel Territori'],
 ['Arbres Monumentals','comuna','Arbres'], ['Bioconstrucció','comuna','Bioconstrucció'], ['Brull Viu','local','Brull Viu'], ['Camí de Santiago','comuna','Camí de Sant Jaume'], ['Cims per la llengua','local','Cims per la llengua'],
 ["Coordinadora d'Estudis Eòlics del Comtat",'entitat',"Coordinadora d'Estudis Eòlics del Comtat"], ['Desenvolupament Sostenible','comuna','Desenvolupament Sostenible'], ['Documentació','comuna','Documentació'], ['El Camí','pendent',null],
 ['El Carreró Centre Cultural i Tecnològic','local','El Carreró'], ["El Planet Centre Rural d'Experimentació",'local','El Planet'], ['El Rentonar','entitat','El Rentonar'], ['Esports','comuna','Esports'], ['Rutes','comuna','Rutes'], ['Fadrins','local','Fadrins'], ['Festes dels Pobles','comuna','Festes'],
 ['Font Roja','geografia','Font Roja'], ['Fotos','retirada',null], ['Gent que Fa Música','comuna','Música'], ['Gent Sostenible','retirada',null], ['Incendis','comuna','Incendis'], ['Llibres','comuna','Llibres'], ['Memfotisme','comuna','Memfotisme'], ['Noticies','alies','Premsa'], ['Opinió','pendent',null], ['Patrimoni','pilar','Natura i Patrimoni'],
 ['Pla Eòlic','local','Pla Eòlic'], ['Plànols','alies','Cartografia'], ['Pou de neu','geografia','Pou de neu'], ['Projecte Sóc de Poble','entitat','Sóc de Poble'], ['Projectes','comuna','Projectes'], ['Propostes','alies','Idees'], ['Radar No','local','Radar No'], ['Rentonar Informa','retirada',null], ['Replantacions','comuna','Replantacions'], ['Reunions','comuna','Reunions'], ['Sant Gregori','local','Sant Gregori'], ['Serra dels Plans','geografia','Serra dels Plans'], ['Trobades','alies','Aplecs'], ['Vídeos','sistema','Vídeo'], ['Pedra Seca','comuna','Pedra Seca'], ['Herbari','comuna','Herbari'], ['Llavors','comuna','Llavors'], ['NGI Fediversity','retirada',null], ['Node 0','comuna','Node 0']
];
export const TRIATGE_ETIQUETES_1_49 = immutable(triatge.map(([original, tipus, desti], index) => immutable({ numero: index + 1, original, tipus, desti })));

const editorialsSistema = [
 ['La maquinària compartida','Com funciona Sóc de Poble i com podem millorar el projecte.'],
 ['La vida dels pobles','Notícies, experiències i converses de la gent dels pobles.'],
 ['Productes i serveis de proximitat','Comprem, venem i compartim allò que tenim a prop.'],
 ['Activitats que ens ajunten','Consulta les dates i participa en les activitats dels pobles.'],
 ['El territori a la vista','Descobrix els pobles, els paratges i les rutes al mapa.'],
 ['Camins que podem compartir','Propostes per moure’ns i connectar els pobles.'],
 ['Cuidem els animals','Adopcions, avisos i ajuda per als animals que conviuen amb nosaltres.'],
 ['Faena a prop de casa','Ofertes, demandes i projectes de treball als pobles.'],
 ['Cases per viure als pobles','Habitatges i iniciatives per arrelar al territori.'],
 ['Llibres i col·leccions obertes','Receptaris, herbaris i altres reculls per consultar i compartir.'],
 ['Històries en moviment','Totes les publicacions que inclouen un vídeo.'],
 ['Documents per llegir i descarregar','Totes les publicacions amb documents PDF.']
];
const editorialsEtiquetes = [
 ['Fem coses juntes','Activitats que naixen de la gent i omplin de vida els pobles.'],
 ['Trobades que fan xarxa','Aplecs, trobades i encontres per compartir cultura i territori.'],
 ['Arrels vives del territori','Coneixem, documentem i cuidem els arbres dels pobles.'],
 ['Construir amb el que tenim a prop','Sabers, materials i experiències de construcció respectuosa amb el territori.'],
 ['Un camí compartit','Experiències i itineraris al Camí de Sant Jaume.'],
 ['Llegim el territori','Mapes, plànols i documents per comprendre els nostres camins i paisatges.'],
 ['Paraules que compartim','Conferències i xarrades per aprendre i conversar.'],
 ['Viure sense esgotar el futur','Experiències per cuidar els recursos i la vida dels pobles.'],
 ['Una interfície clara i llegible','Com dissenyem les pàgines i les eines de Sóc de Poble.'],
 ['Coneixement que es pot consultar','Guies i documents per entendre, aprendre i fer.'],
 ['Ens movem en companyia','Pràctiques esportives i activitats físiques als pobles.'],
 ['Celebrem la vida compartida','Festes populars, tradicions i celebracions dels pobles.'],
 ['Les plantes del nostre entorn','Herbaris i fitxes per conéixer la flora dels pobles.'],
 ['Propostes actives i concretes','Si açò ha funcionat allà, podria valdre per al nostre poble'],
 ['Prevenir i cuidar el territori','Informació, memòria i iniciatives davant els incendis.'],
 ['La diversitat que sembrem','Varietats locals, bancs de llavors i coneixements agraris.'],
 ['Lectures que podem compartir','Llibres i publicacions que ens ajuden a conéixer el territori.'],
 ['El territori davant grans instal·lacions','Informació i iniciatives sobre macroplantes energètiques i els seus impactes.'],
 ['Memòria i mirada pròpia','Publicacions vinculades al Memfotisme.'],
 ['Sons que ens ajunten','Música, grups i experiències sonores dels pobles.'],
 ['La infraestructura local del projecte','Coneixement i experiències del Node 0 de Sóc de Poble.'],
 ['Patrimoni construït pedra a pedra','Oficis, construccions i formació de pedra seca rural.'],
 ['Els pobles als mitjans','Notícies i publicacions de premsa relacionades amb els nostres pobles.'],
 ['Del propòsit a la faena','Iniciatives que prenen forma amb la gent i les entitats.'],
 ['Tornem a arrelar el paisatge','Iniciatives i experiències de replantació al territori.'],
 ['Ens asseiem a parlar','Reunions per escoltar, decidir i treballar en comú.'],
 ['Camins per conéixer el territori','Itineraris i excursions dels pobles, amb la seua informació i els seus tracks.'],
 ['La cuina que compartim','Receptes i receptaris que preserven sabers i sabors dels pobles.']
];
export const PAGINES_EDITORIALS_TAXONOMIA = immutable([
 ...SISTEMA_CATEGORIES_12.map((c, index) => immutable({ tipus: 'categoria', slug: c.slug, h1: c.nom, h2: editorialsSistema[index][0], entradeta: editorialsSistema[index][1], alies: immutable(c.id === 'calendari' ? ['Agenda','Esdeveniments'] : []), rutaDedicada: c.rutaDedicada })),
 ...ETIQUETES_COMUNES.map((e, index) => immutable({ tipus: 'etiqueta', slug: e.slug, h1: e.nom, h2: editorialsEtiquetes[index][0], entradeta: editorialsEtiquetes[index][1], alies: immutable(Object.keys(TESAURUS_ALIES_ETIQUETES).filter(nom => TESAURUS_ALIES_ETIQUETES[nom] === e.nom)), rutaDedicada: e.rutaDedicada }))
]);
/** Esquema CMS: es poden editar H1/H2/entradeta sense canviar el motor. */
export function resolPaginaEditorialTaxonomia(slug, edicions = {}) {
  if (typeof slug !== 'string' || slug.length > 160) return null;
  const parts = slug.startsWith('/') ? slug.split('/').slice(1) : [slug];
  if (parts.length > 2 || parts.some(part => !part) || (parts.length === 2 && !['categoria','etiqueta'].includes(parts[0]))) return null;
  const nom = parts.at(-1), tipus = parts.length === 2 ? parts[0] : null;
  const c = tipus !== 'etiqueta' ? resolCategoriaSistema(nom) : null;
  const e = tipus !== 'categoria' ? resolEtiquetaComuna(nom) : null;
  const pagina = PAGINES_EDITORIALS_TAXONOMIA.find(p => p.tipus === (c ? 'categoria' : 'etiqueta') && p.slug === (c?.slug ?? e?.slug));
  if (!pagina) return null;
  const canvi = edicions && typeof edicions === 'object' && Object.hasOwn(edicions, pagina.slug) ? edicions[pagina.slug] : null;
  const resultat = { ...pagina, alies: [...pagina.alies] };
  for (const camp of ['h1','h2','entradeta']) {
    const valor = canvi && typeof canvi === 'object' ? canvi[camp] : null;
    if (typeof valor === 'string' && valor.trim() && valor.length <= 600 && !/[<>*`\u0000-\u001f]/.test(valor)) resultat[camp] = valor.trim();
  }
  return resultat;
}
