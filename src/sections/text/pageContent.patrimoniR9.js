/* Onada R9 (261106; carril C5; IDEA-112, IDEA-113 i IDEA-115) · Tres pàgines de patrimoni amb dades verificades:
   /page/banc-de-llavors, /page/rutes-de-poble i /page/arbres-monumentals. Es publiquen com l'herbari i l'anatomia
   (PageDetailSection, sense ruta nova): el cos és este text breu i la consulta va davall, en un chunk lazy
   (src/sections/patrimoni/*Section.jsx). PAGE_COPY les incorpora al final de pageContent.js. Sense portada pròpia
   (EXCLOSES_DE_PAGE de build-social-manifest): no s'inventa cap imatge. Cada xifra ix de la font que cita la
   pàgina (src/data/patrimoni/*.js, amb camí, SHA-256 i línia). `date`: l'hora en què es va escriure l'entrada
   (no la d'un commit), com les altres pàgines d'esta onada. */
const etiquetes = (categoria, tag) => [
  { text: categoria, className: 'sdp-badge-category' },
  { text: tag, className: 'sdp-badge-tag' }
];

const BANC = {
  ca: {
    title: 'Banc de llavors',
    subtitle: 'Tres catàlegs de varietats tradicionals, amb la seua font',
    lead: '45 varietats del Catàleg valencià de varietats tradicionals d’interés agrari, 65 del Catàleg de llavors 2020 de l’Associació de Varietats Locals de Mallorca i 15 fitxes d’espècie de l’Atles de la Fundació Miquel Agustí.',
    labels: etiquetes('Patrimoni', 'Llavors'),
    html: '\n      <h3>Què hi ha i què no hi ha</h3>\n      <p>Cada fitxa porta el <strong>nom</strong>, el <strong>nom científic</strong> i la <strong>pàgina</strong> del catàleg d’on ix, copiats tal com són a la font.</p>\n      <p>Ací <strong>no s’intercanvien llavors</strong>: no hi ha <strong>custodis</strong>, <strong>lots</strong> ni <strong>reserves</strong>. Les <strong>trobades</strong> del poble es publiquen al <a href="/calendari"><strong>Calendari</strong></a>, i les plantes de La Canaleta són a l’<a href="/page/herbari"><strong>Herbari de La Torre</strong></a>.</p>\n    '
  },
  es: {
    title: 'Banco de semillas',
    subtitle: 'Tres catálogos de variedades tradicionales, con su fuente',
    lead: '45 variedades del Catàleg valencià de varietats tradicionals d’interés agrari, 65 del Catàleg de llavors 2020 de la Associació de Varietats Locals de Mallorca y 15 fichas de especie del Atles de la Fundació Miquel Agustí.',
    labels: etiquetes('Patrimonio', 'Semillas'),
    html: '\n      <h3>Qué hay y qué no hay</h3>\n      <p>Cada ficha lleva el <strong>nombre</strong>, el <strong>nombre científico</strong> y la <strong>página</strong> del catálogo de donde sale, copiados tal como están en la fuente.</p>\n      <p>Aquí <strong>no se intercambian semillas</strong>: no hay <strong>custodios</strong>, <strong>lotes</strong> ni <strong>reservas</strong>. Los <strong>encuentros</strong> del pueblo se publican en el <a href="/calendari"><strong>Calendario</strong></a>, y las plantas de La Canaleta están en el <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  },
  en: {
    title: 'Seed bank',
    subtitle: 'Three catalogues of traditional varieties, with their source',
    lead: '45 varieties from the Valencian catalogue of traditional varieties of agricultural interest, 65 from the 2020 seed catalogue of the Associació de Varietats Locals of Majorca and 15 species records from the Fundació Miquel Agustí atlas.',
    labels: etiquetes('Heritage', 'Seeds'),
    html: '\n      <h3>What is here and what is not</h3>\n      <p>Each record carries the <strong>name</strong>, the <strong>scientific name</strong> and the <strong>page</strong> of the catalogue it comes from, copied exactly as in the source.</p>\n      <p><strong>No seeds are exchanged here</strong>: there are no <strong>custodians</strong>, <strong>lots</strong> or <strong>bookings</strong>. Village <strong>gatherings</strong> are published in the <a href="/calendari"><strong>Calendar</strong></a>, and the plants of La Canaleta are in the <a href="/page/herbari"><strong>La Torre herbarium</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Hazi bankua',
    subtitle: 'Barietate tradizionalen hiru katalogo, beren iturriarekin',
    lead: 'Valentziako barietate tradizionalen katalogoko 45 barietate, Mallorcako Associació de Varietats Locals elkartearen 2020ko hazi katalogoko 65 eta Fundació Miquel Agustí fundazioaren atlaseko 15 espezie fitxa.',
    labels: etiquetes('Ondarea', 'Haziak'),
    html: '\n      <h3>Zer dagoen eta zer ez</h3>\n      <p>Fitxa bakoitzak <strong>izena</strong>, <strong>izen zientifikoa</strong> eta jatorrizko katalogoaren <strong>orrialdea</strong> ditu, iturrian dauden bezala kopiatuta.</p>\n      <p>Hemen <strong>ez da hazirik trukatzen</strong>: ez dago <strong>zaintzailerik</strong>, <strong>loterik</strong> edo <strong>erreserbarik</strong>. Herriko <strong>topaketak</strong> <a href="/calendari"><strong>Egutegian</strong></a> argitaratzen dira, eta La Canaletako landareak <a href="/page/herbari"><strong>La Torreko herbarioan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Banco de sementes',
    subtitle: 'Tres catálogos de variedades tradicionais, coa súa fonte',
    lead: '45 variedades do catálogo valenciano de variedades tradicionais de interese agrario, 65 do catálogo de sementes 2020 da Associació de Varietats Locals de Mallorca e 15 fichas de especie do atlas da Fundació Miquel Agustí.',
    labels: etiquetes('Patrimonio', 'Sementes'),
    html: '\n      <h3>Que hai e que non hai</h3>\n      <p>Cada ficha leva o <strong>nome</strong>, o <strong>nome científico</strong> e a <strong>páxina</strong> do catálogo de onde sae, copiados tal como están na fonte.</p>\n      <p>Aquí <strong>non se intercambian sementes</strong>: non hai <strong>custodios</strong>, <strong>lotes</strong> nin <strong>reservas</strong>. Os <strong>encontros</strong> do pobo publícanse no <a href="/calendari"><strong>Calendario</strong></a>, e as plantas de La Canaleta están no <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  }
};

const RUTES = {
  ca: {
    title: 'Rutes de poble',
    subtitle: 'Els 6 itineraris de La Torre de les Maçanes, d’1,3 a 6 km',
    lead: 'Els itineraris de Gent de La Torre (revisió del 28 d’abril de 2021) en els seus 6 eixos, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» i «Som paisatge», amb les parades, les hores i els quilòmetres de la font.',
    labels: etiquetes('Patrimoni', 'Rutes'),
    html: '\n      <h3>Una plantilla per a cada poble</h3>\n      <p>Cada ruta porta l’<strong>eix</strong>, la <strong>durada</strong>, la <strong>distància</strong> i les <strong>parades</strong> amb l’hora, tal com les publica la font.</p>\n      <p>Un altre <strong>poble</strong> pot omplir la mateixa <strong>forma de dades</strong> amb la seua <strong>font</strong>: ací <strong>només</strong> hi ha La Torre. La <strong>ruta 6</strong> arriba al <strong>Pou de la Neu</strong> del Rentonar; l’esquema d’un pou de neu és a l’<a href="/page/anatomia-rural"><strong>Anatomia rural</strong></a>, i els arbres del terme, als <a href="/page/arbres-monumentals"><strong>Arbres emblemàtics i monumentals</strong></a>.</p>\n    '
  },
  es: {
    title: 'Rutas de pueblo',
    subtitle: 'Los 6 itinerarios de La Torre de les Maçanes, de 1,3 a 6 km',
    lead: 'Los itinerarios de Gent de La Torre (revisión del 28 de abril de 2021) en sus 6 ejes, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» y «Som paisatge», con las paradas, las horas y los kilómetros de la fuente.',
    labels: etiquetes('Patrimonio', 'Rutas'),
    html: '\n      <h3>Una plantilla para cada pueblo</h3>\n      <p>Cada ruta lleva el <strong>eje</strong>, la <strong>duración</strong>, la <strong>distancia</strong> y las <strong>paradas</strong> con la hora, tal como las publica la fuente.</p>\n      <p>Otro <strong>pueblo</strong> puede rellenar la misma <strong>forma de datos</strong> con su <strong>fuente</strong>: aquí <strong>solo</strong> está La Torre. La <strong>ruta 6</strong> llega al <strong>Pou de la Neu</strong> del Rentonar; el esquema de un pozo de nieve está en la <a href="/page/anatomia-rural"><strong>Anatomía rural</strong></a>, y los árboles del término, en los <a href="/page/arbres-monumentals"><strong>Árboles emblemáticos y monumentales</strong></a>.</p>\n    '
  },
  en: {
    title: 'Village routes',
    subtitle: 'The 6 itineraries of La Torre de les Maçanes, from 1.3 to 6 km',
    lead: 'The Gent de La Torre itineraries (revision of 28 April 2021) along their 6 themes, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» and «Som paisatge», with the stops, times and kilometres given in the source.',
    labels: etiquetes('Heritage', 'Routes'),
    html: '\n      <h3>A template for every village</h3>\n      <p>Each route carries its <strong>theme</strong>, <strong>duration</strong>, <strong>distance</strong> and <strong>stops</strong> with their time, exactly as the source publishes them.</p>\n      <p>Another <strong>village</strong> can fill in the same <strong>data shape</strong> with its own <strong>source</strong>: only <strong>La Torre</strong> is here. <strong>Route 6</strong> reaches the <strong>Pou de la Neu</strong> of the Rentonar; a diagram of a snow pit is in <a href="/page/anatomia-rural"><strong>Rural anatomy</strong></a>, and the trees of the municipality, in <a href="/page/arbres-monumentals"><strong>Emblematic and monumental trees</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Herriko ibilbideak',
    subtitle: 'La Torre de les Maçanesko 6 ibilbideak, 1,3 km-tik 6 km-ra',
    lead: 'Gent de La Torre-ren ibilbideak (2021eko apirilaren 28ko berrikuspena) beren 6 ardatzetan, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» eta «Som paisatge», iturriko geldialdi, ordu eta kilometroekin.',
    labels: etiquetes('Ondarea', 'Ibilbideak'),
    html: '\n      <h3>Herri bakoitzarentzako txantiloia</h3>\n      <p>Ibilbide bakoitzak <strong>ardatza</strong>, <strong>iraupena</strong>, <strong>distantzia</strong> eta orduarekin <strong>geldialdiak</strong> ditu, iturriak argitaratzen dituen bezala.</p>\n      <p>Beste <strong>herri</strong> batek <strong>datu forma</strong> bera bete dezake bere <strong>iturriarekin</strong>: hemen <strong>La Torre</strong> bakarrik dago. <strong>6. ibilbidea</strong> Rentonarreko <strong>Pou de la Neu</strong>-ra iristen da; elur-putzu baten eskema <a href="/page/anatomia-rural"><strong>Landa anatomian</strong></a> dago, eta udalerriko zuhaitzak, <a href="/page/arbres-monumentals"><strong>Zuhaitz enblematiko eta monumentaletan</strong></a>.</p>\n    '
  },
  gl: {
    title: 'Rutas de pobo',
    subtitle: 'Os 6 itinerarios de La Torre de les Maçanes, de 1,3 a 6 km',
    lead: 'Os itinerarios de Gent de La Torre (revisión do 28 de abril de 2021) nos seus 6 eixos, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» e «Som paisatge», coas paradas, as horas e os quilómetros da fonte.',
    labels: etiquetes('Patrimonio', 'Rutas'),
    html: '\n      <h3>Un modelo para cada pobo</h3>\n      <p>Cada ruta leva o <strong>eixo</strong>, a <strong>duración</strong>, a <strong>distancia</strong> e as <strong>paradas</strong> coa hora, tal como as publica a fonte.</p>\n      <p>Outro <strong>pobo</strong> pode encher a mesma <strong>forma de datos</strong> coa súa <strong>fonte</strong>: aquí <strong>só</strong> está La Torre. A <strong>ruta 6</strong> chega ao <strong>Pou de la Neu</strong> do Rentonar; o esquema dun pozo de neve está na <a href="/page/anatomia-rural"><strong>Anatomía rural</strong></a>, e as árbores do termo, nas <a href="/page/arbres-monumentals"><strong>Árbores emblemáticas e monumentais</strong></a>.</p>\n    '
  }
};

const ARBRES = {
  ca: {
    title: 'Arbres emblemàtics i monumentals',
    subtitle: 'Els 19 arbres del catàleg de La Torre de les Maçanes',
    lead: 'El Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes tal com el va publicar socdepoble.net el 10 d’abril de 2017: 19 arbres, dos dels quals marcats com a monumentals.',
    labels: etiquetes('Patrimoni', 'Arbres'),
    html: '\n      <h3>Un patrimoni de tot el poble</h3>\n      <p>El catàleg el va elaborar <strong>Pedro Ferrer Rodriguez</strong>, <strong>enginyer tècnic forestal</strong> i <strong>biòleg</strong>, amb la col·laboració de l’associació <strong>El Rentonar</strong>, i cita l’<strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>La pàgina font <strong>no dona mesures</strong> ni <strong>edats</strong> de cap arbre, i ací <strong>tampoc</strong>. Cada nom porta a la seua <strong>fitxa original</strong>; les plantes de La Canaleta són a l’<a href="/page/herbari"><strong>Herbari de La Torre</strong></a>.</p>\n    '
  },
  es: {
    title: 'Árboles emblemáticos y monumentales',
    subtitle: 'Los 19 árboles del catálogo de La Torre de les Maçanes',
    lead: 'El Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes tal como lo publicó socdepoble.net el 10 de abril de 2017: 19 árboles, dos de ellos marcados como monumentales.',
    labels: etiquetes('Patrimonio', 'Árboles'),
    html: '\n      <h3>Un patrimonio de todo el pueblo</h3>\n      <p>Elaboró el catálogo <strong>Pedro Ferrer Rodriguez</strong>, <strong>ingeniero técnico forestal</strong> y <strong>biólogo</strong>, con la colaboración de la asociación <strong>El Rentonar</strong>, y cita la <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>La página fuente <strong>no da medidas</strong> ni <strong>edades</strong> de ningún árbol, y aquí <strong>tampoco</strong>. Cada nombre lleva a su <strong>ficha original</strong>; las plantas de La Canaleta están en el <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  },
  en: {
    title: 'Emblematic and monumental trees',
    subtitle: 'The 19 trees in the La Torre de les Maçanes catalogue',
    lead: 'The catalogue of emblematic and monumental trees of La Torre de les Maçanes as socdepoble.net published it on 10 April 2017: 19 trees, two of them marked as monumental.',
    labels: etiquetes('Heritage', 'Trees'),
    html: '\n      <h3>A heritage of the whole village</h3>\n      <p>The catalogue was prepared by <strong>Pedro Ferrer Rodriguez</strong>, <strong>forestry technical engineer</strong> and <strong>biologist</strong>, with the collaboration of the association <strong>El Rentonar</strong>, and it cites the <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>The source page <strong>gives no measurements</strong> or <strong>ages</strong> for any tree, and <strong>neither</strong> does this page. Each name leads to its <strong>original record</strong>; the plants of La Canaleta are in the <a href="/page/herbari"><strong>La Torre herbarium</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Zuhaitz enblematiko eta monumentalak',
    subtitle: 'La Torre de les Maçanesko katalogoko 19 zuhaitzak',
    lead: 'La Torre de les Maçanesko zuhaitz enblematiko eta monumentalen katalogoa, socdepoble.net-ek 2017ko apirilaren 10ean argitaratu zuen bezala: 19 zuhaitz, horietako bi monumental gisa markatuak.',
    labels: etiquetes('Ondarea', 'Zuhaitzak'),
    html: '\n      <h3>Herri osoaren ondarea</h3>\n      <p>Katalogoa <strong>Pedro Ferrer Rodriguez</strong> <strong>baso ingeniari tekniko</strong> eta <strong>biologoak</strong> egin zuen, <strong>El Rentonar</strong> elkartearen laguntzarekin, eta <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong> aipatzen du.</p>\n      <p>Iturri orriak <strong>ez du neurririk ematen</strong> ezta zuhaitzen <strong>adinik</strong> ere, eta hemen <strong>ere ez</strong>. Izen bakoitzak bere <strong>jatorrizko fitxara</strong> eramaten du; La Canaletako landareak <a href="/page/herbari"><strong>La Torreko herbarioan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Árbores emblemáticas e monumentais',
    subtitle: 'As 19 árbores do catálogo de La Torre de les Maçanes',
    lead: 'O catálogo de árbores emblemáticas e monumentais de La Torre de les Maçanes tal como o publicou socdepoble.net o 10 de abril de 2017: 19 árbores, dúas delas marcadas como monumentais.',
    labels: etiquetes('Patrimonio', 'Árbores'),
    html: '\n      <h3>Un patrimonio de todo o pobo</h3>\n      <p>Elaborou o catálogo <strong>Pedro Ferrer Rodriguez</strong>, <strong>enxeñeiro técnico forestal</strong> e <strong>biólogo</strong>, coa colaboración da asociación <strong>El Rentonar</strong>, e cita a <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>A páxina fonte <strong>non dá medidas</strong> nin <strong>idades</strong> de ningunha árbore, e aquí <strong>tampouco</strong>. Cada nome leva á súa <strong>ficha orixinal</strong>; as plantas de La Canaleta están no <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  }
};

const pagina = (date, textos) => ({
  date,
  ...textos.ca,
  translations: Object.fromEntries(Object.entries(textos).filter(([llengua]) => llengua !== 'ca')),
  contentLanguage: 'ca'
});

export const PAGINES_PATRIMONI_R9 = {
  'banc-de-llavors': pagina('2026-11-06T14:31:00+01:00', BANC),
  'rutes-de-poble': pagina('2026-11-06T14:31:00+01:00', RUTES),
  'arbres-monumentals': pagina('2026-11-06T14:31:00+01:00', ARBRES)
};
