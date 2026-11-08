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
    image: '/assets/uploads/patrimoni/banc-de-llavors-ibanez.webp',
    imageAlt: 'Il·lustració didàctica de còmic d’estil Ibáñez del Banc de llavors tradicional',
    labels: etiquetes('🌾 Recursos Locals, Agricultura i Sobirania', 'Desenvolupament Sostenible'),
    html: '\n      <h3>Què hi ha i què no hi ha</h3>\n      <p>Cada fitxa porta el <strong>nom</strong>, el <strong>nom científic</strong> i la <strong>pàgina</strong> del catàleg d’on ix, copiats tal com són a la font.</p>\n      <p>Ací <strong>no s’intercanvien llavors</strong>: no hi ha <strong>custodis</strong>, <strong>lots</strong> ni <strong>reserves</strong>. Les <strong>trobades</strong> del poble es publiquen al <a href="/calendari"><strong>Calendari</strong></a>, i les plantes del terme són a l’<a href="/page/herbari"><strong>Herbari de La Torre</strong></a>.</p>\n    '
  },
  es: {
    title: 'Banco de semillas',
    subtitle: 'Tres catálogos de variedades tradicionales, con su fuente',
    lead: '45 variedades del Catàleg valencià de varietats tradicionals d’interés agrari, 65 del Catàleg de llavors 2020 de la Associació de Varietats Locals de Mallorca y 15 fichas de especie del Atles de la Fundació Miquel Agustí.',
    labels: etiquetes('🌾 Recursos Locales, Agricultura y Soberanía', 'Desarrollo Sostenible'),
    html: '\n      <h3>Qué hay y qué no hay</h3>\n      <p>Cada ficha lleva el <strong>nombre</strong>, el <strong>nombre científico</strong> y la <strong>página</strong> del catálogo de donde sale, copiados tal como están en la fuente.</p>\n      <p>Aquí <strong>no se intercambian semillas</strong>: no hay <strong>custodios</strong>, <strong>lotes</strong> ni <strong>reservas</strong>. Los <strong>encuentros</strong> del pueblo se publican en el <a href="/calendari"><strong>Calendario</strong></a>, y las plantas del término están en el <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  },
  en: {
    title: 'Seed bank',
    subtitle: 'Three catalogues of traditional varieties, with their source',
    lead: '45 varieties from the Valencian catalogue of traditional varieties of agricultural interest, 65 from the 2020 seed catalogue of the Associació de Varietats Locals of Majorca and 15 species records from the Fundació Miquel Agustí atlas.',
    labels: etiquetes('🌾 Local Resources, Agriculture and Sovereignty', 'Sustainable Development'),
    html: '\n      <h3>What is here and what is not</h3>\n      <p>Each record carries the <strong>name</strong>, the <strong>scientific name</strong> and the <strong>page</strong> of the catalogue it comes from, copied exactly as in the source.</p>\n      <p><strong>No seeds are exchanged here</strong>: there are no <strong>custodians</strong>, <strong>lots</strong> or <strong>bookings</strong>. Village <strong>gatherings</strong> are published in the <a href="/calendari"><strong>Calendar</strong></a>, and the plants of the municipality are in the <a href="/page/herbari"><strong>La Torre herbarium</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Hazi bankua',
    subtitle: 'Barietate tradizionalen hiru katalogo, beren iturriarekin',
    lead: 'Valentziako barietate tradizionalen katalogoko 45 barietate, Mallorcako Associació de Varietats Locals elkartearen 2020ko hazi katalogoko 65 eta Fundació Miquel Agustí fundazioaren atlaseko 15 espezie fitxa.',
    labels: etiquetes('🌾 Tokiko Baliabideak, Nekazaritza eta Burujabetza', 'Garapen Jasangarria'),
    html: '\n      <h3>Zer dagoen eta zer ez</h3>\n      <p>Fitxa bakoitzak <strong>izena</strong>, <strong>izen zientifikoa</strong> eta jatorrizko katalogoaren <strong>orrialdea</strong> ditu, iturrian dauden bezala kopiatuta.</p>\n      <p>Hemen <strong>ez da hazirik trukatzen</strong>: ez dago <strong>zaintzailerik</strong>, <strong>loterik</strong> edo <strong>erreserbarik</strong>. Herriko <strong>topaketak</strong> <a href="/calendari"><strong>Egutegian</strong></a> argitaratzen dira, eta udalerriko landareak <a href="/page/herbari"><strong>La Torreko herbarioan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Banco de sementes',
    subtitle: 'Tres catálogos de variedades tradicionais, coa súa fonte',
    lead: '45 variedades do catálogo valenciano de variedades tradicionais de interese agrario, 65 do catálogo de sementes 2020 da Associació de Varietats Locals de Mallorca e 15 fichas de especie do atlas da Fundació Miquel Agustí.',
    labels: etiquetes('🌾 Recursos Locais, Agricultura e Soberanía', 'Desenvolvemento Sostible'),
    html: '\n      <h3>Que hai e que non hai</h3>\n      <p>Cada ficha leva o <strong>nome</strong>, o <strong>nome científico</strong> e a <strong>páxina</strong> do catálogo de onde sae, copiados tal como están na fonte.</p>\n      <p>Aquí <strong>non se intercambian sementes</strong>: non hai <strong>custodios</strong>, <strong>lotes</strong> nin <strong>reservas</strong>. Os <strong>encontros</strong> do pobo publícanse no <a href="/calendari"><strong>Calendario</strong></a>, e as plantas do termo están no <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  }
};

const RUTES = {
  ca: {
    title: 'Rutes de poble',
    subtitle: 'Els 6 itineraris de La Torre de les Maçanes, d’1,3 a 6 km',
    lead: 'Els itineraris de Gent de La Torre (revisió del 28 d’abril de 2021) en els seus 6 eixos, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» i «Som paisatge», amb les parades, les hores i els quilòmetres de la font.',
    image: '/assets/uploads/patrimoni/rutes-de-poble-ibanez.webp',
    imageAlt: 'Il·lustració didàctica de còmic d’estil Ibáñez de les Rutes de poble i camins de ferradura',
    labels: etiquetes('🌿 Natura i Patrimoni', 'Rutes'),
    html: '\n      <h3>Una plantilla per a cada poble</h3>\n      <p>Cada ruta porta l’<strong>eix</strong>, la <strong>durada</strong>, la <strong>distància</strong> i les <strong>parades</strong> amb l’hora, tal com les publica la font.</p>\n      <p>Un altre <strong>poble</strong> pot omplir la mateixa <strong>forma de dades</strong> amb la seua <strong>font</strong>: ací <strong>només</strong> hi ha La Torre. La <strong>ruta 6</strong> arriba al <strong>Pou de la Neu</strong> del Rentonar; l’esquema d’un pou de neu és a l’<a href="/page/anatomia-rural"><strong>Anatomia rural</strong></a>, i els arbres del terme, als <a href="/page/arbres-monumentals"><strong>Arbres emblemàtics i monumentals</strong></a>.</p>\n    '
  },
  es: {
    title: 'Rutas de pueblo',
    subtitle: 'Los 6 itinerarios de La Torre de les Maçanes, de 1,3 a 6 km',
    lead: 'Los itinerarios de Gent de La Torre (revisión del 28 de abril de 2021) en sus 6 ejes, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» y «Som paisatge», con las paradas, las horas y los kilómetros de la fuente.',
    labels: etiquetes('🌿 Naturaleza y Patrimonio', 'Rutas'),
    html: '\n      <h3>Una plantilla para cada pueblo</h3>\n      <p>Cada ruta lleva el <strong>eje</strong>, la <strong>duración</strong>, la <strong>distancia</strong> y las <strong>paradas</strong> con la hora, tal como las publica la fuente.</p>\n      <p>Otro <strong>pueblo</strong> puede rellenar la misma <strong>forma de datos</strong> con su <strong>fuente</strong>: aquí <strong>solo</strong> está La Torre. La <strong>ruta 6</strong> llega al <strong>Pou de la Neu</strong> del Rentonar; el esquema de un pozo de nieve está en la <a href="/page/anatomia-rural"><strong>Anatomía rural</strong></a>, y los árboles del término, en los <a href="/page/arbres-monumentals"><strong>Árboles emblemáticos y monumentales</strong></a>.</p>\n    '
  },
  en: {
    title: 'Village routes',
    subtitle: 'The 6 itineraries of La Torre de les Maçanes, from 1.3 to 6 km',
    lead: 'The Gent de La Torre itineraries (revision of 28 April 2021) along their 6 themes, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» and «Som paisatge», with the stops, times and kilometres given in the source.',
    labels: etiquetes('🌿 Nature and Heritage', 'Routes'),
    html: '\n      <h3>A template for every village</h3>\n      <p>Each route carries its <strong>theme</strong>, <strong>duration</strong>, <strong>distance</strong> and <strong>stops</strong> with their time, exactly as the source publishes them.</p>\n      <p>Another <strong>village</strong> can fill in the same <strong>data shape</strong> with its own <strong>source</strong>: only <strong>La Torre</strong> is here. <strong>Route 6</strong> reaches the <strong>Pou de la Neu</strong> of the Rentonar; a diagram of a snow pit is in <a href="/page/anatomia-rural"><strong>Rural anatomy</strong></a>, and the trees of the municipality, in <a href="/page/arbres-monumentals"><strong>Emblematic and monumental trees</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Herriko ibilbideak',
    subtitle: 'La Torre de les Maçanesko 6 ibilbideak, 1,3 km-tik 6 km-ra',
    lead: 'Gent de La Torre-ren ibilbideak (2021eko apirilaren 28ko berrikuspena) beren 6 ardatzetan, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» eta «Som paisatge», iturriko geldialdi, ordu eta kilometroekin.',
    labels: etiquetes('🌿 Natura eta Ondarea', 'Ibilbideak'),
    html: '\n      <h3>Herri bakoitzarentzako txantiloia</h3>\n      <p>Ibilbide bakoitzak <strong>ardatza</strong>, <strong>iraupena</strong>, <strong>distantzia</strong> eta orduarekin <strong>geldialdiak</strong> ditu, iturriak argitaratzen dituen bezala.</p>\n      <p>Beste <strong>herri</strong> batek <strong>datu forma</strong> bera bete dezake bere <strong>iturriarekin</strong>: hemen <strong>La Torre</strong> bakarrik dago. <strong>6. ibilbidea</strong> Rentonarreko <strong>Pou de la Neu</strong>-ra iristen da; elur-putzu baten eskema <a href="/page/anatomia-rural"><strong>Landa anatomian</strong></a> dago, eta udalerriko zuhaitzak, <a href="/page/arbres-monumentals"><strong>Zuhaitz enblematiko eta monumentaletan</strong></a>.</p>\n    '
  },
  gl: {
    title: 'Rutas de pobo',
    subtitle: 'Os 6 itinerarios de La Torre de les Maçanes, de 1,3 a 6 km',
    lead: 'Os itinerarios de Gent de La Torre (revisión do 28 de abril de 2021) nos seus 6 eixos, «Som pa, som oli», «Som vincles», «Som aigua», «Som terra», «Som poble» e «Som paisatge», coas paradas, as horas e os quilómetros da fonte.',
    labels: etiquetes('🌿 Natureza e Patrimonio', 'Rutas'),
    html: '\n      <h3>Un modelo para cada pobo</h3>\n      <p>Cada ruta leva o <strong>eixo</strong>, a <strong>duración</strong>, a <strong>distancia</strong> e as <strong>paradas</strong> coa hora, tal como as publica a fonte.</p>\n      <p>Outro <strong>pobo</strong> pode encher a mesma <strong>forma de datos</strong> coa súa <strong>fonte</strong>: aquí <strong>só</strong> está La Torre. A <strong>ruta 6</strong> chega ao <strong>Pou de la Neu</strong> do Rentonar; o esquema dun pozo de neve está na <a href="/page/anatomia-rural"><strong>Anatomía rural</strong></a>, e as árbores do termo, nas <a href="/page/arbres-monumentals"><strong>Árbores emblemáticas e monumentais</strong></a>.</p>\n    '
  }
};

const ARBRES = {
  ca: {
    title: 'Arbres emblemàtics i monumentals',
    subtitle: 'Els 19 arbres del catàleg de La Torre de les Maçanes',
    lead: 'El Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes tal com el va publicar socdepoble.net el 10 d’abril de 2017: 19 arbres, dos dels quals marcats com a monumentals.',
    image: '/assets/uploads/patrimoni/arbres-monumentals-ibanez.webp',
    imageAlt: 'Il·lustració didàctica de còmic d’estil Ibáñez dels Arbres emblemàtics i monumentals',
    labels: etiquetes('🌿 Natura i Patrimoni', 'Arbres Monumentals'),
    html: '\n      <h3>Un patrimoni de tot el poble</h3>\n      <p>El catàleg el va elaborar <strong>Pedro Ferrer Rodriguez</strong>, <strong>enginyer tècnic forestal</strong> i <strong>biòleg</strong>, amb la col·laboració de l’associació <strong>El Rentonar</strong>, i cita l’<strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>La pàgina font <strong>no dona mesures</strong> ni <strong>edats</strong> de cap arbre, i ací <strong>tampoc</strong>. Cada nom porta a la seua <strong>fitxa original</strong>; les plantes del terme són a l’<a href="/page/herbari"><strong>Herbari de La Torre</strong></a>.</p>\n    '
  },
  es: {
    title: 'Árboles emblemáticos y monumentales',
    subtitle: 'Los 19 árboles del catálogo de La Torre de les Maçanes',
    lead: 'El Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes tal como lo publicó socdepoble.net el 10 de abril de 2017: 19 árboles, dos de ellos marcados como monumentales.',
    labels: etiquetes('🌿 Naturaleza y Patrimonio', 'Árboles Monumentales'),
    html: '\n      <h3>Un patrimonio de todo el pueblo</h3>\n      <p>Elaboró el catálogo <strong>Pedro Ferrer Rodriguez</strong>, <strong>ingeniero técnico forestal</strong> y <strong>biólogo</strong>, con la colaboración de la asociación <strong>El Rentonar</strong>, y cita la <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>La página fuente <strong>no da medidas</strong> ni <strong>edades</strong> de ningún árbol, y aquí <strong>tampoco</strong>. Cada nombre lleva a su <strong>ficha original</strong>; las plantas del término están en el <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
  },
  en: {
    title: 'Emblematic and monumental trees',
    subtitle: 'The 19 trees in the La Torre de les Maçanes catalogue',
    lead: 'The catalogue of emblematic and monumental trees of La Torre de les Maçanes as socdepoble.net published it on 10 April 2017: 19 trees, two of them marked as monumental.',
    labels: etiquetes('🌿 Nature and Heritage', 'Monumental Trees'),
    html: '\n      <h3>A heritage of the whole village</h3>\n      <p>The catalogue was prepared by <strong>Pedro Ferrer Rodriguez</strong>, <strong>forestry technical engineer</strong> and <strong>biologist</strong>, with the collaboration of the association <strong>El Rentonar</strong>, and it cites the <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>The source page <strong>gives no measurements</strong> or <strong>ages</strong> for any tree, and <strong>neither</strong> does this page. Each name leads to its <strong>original record</strong>; the plants of the municipality are in the <a href="/page/herbari"><strong>La Torre herbarium</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Zuhaitz enblematiko eta monumentalak',
    subtitle: 'La Torre de les Maçanesko katalogoko 19 zuhaitzak',
    lead: 'La Torre de les Maçanesko zuhaitz enblematiko eta monumentalen katalogoa, socdepoble.net-ek 2017ko apirilaren 10ean argitaratu zuen bezala: 19 zuhaitz, horietako bi monumental gisa markatuak.',
    labels: etiquetes('🌿 Natura eta Ondarea', 'Zuhaitz Monumentalak'),
    html: '\n      <h3>Herri osoaren ondarea</h3>\n      <p>Katalogoa <strong>Pedro Ferrer Rodriguez</strong> <strong>baso ingeniari tekniko</strong> eta <strong>biologoak</strong> egin zuen, <strong>El Rentonar</strong> elkartearen laguntzarekin, eta <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong> aipatzen du.</p>\n      <p>Iturri orriak <strong>ez du neurririk ematen</strong> ezta zuhaitzen <strong>adinik</strong> ere, eta hemen <strong>ere ez</strong>. Izen bakoitzak bere <strong>jatorrizko fitxara</strong> eramaten du; udalerriko landareak <a href="/page/herbari"><strong>La Torreko herbarioan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Árbores emblemáticas e monumentais',
    subtitle: 'As 19 árbores do catálogo de La Torre de les Maçanes',
    lead: 'O catálogo de árbores emblemáticas e monumentais de La Torre de les Maçanes tal como o publicou socdepoble.net o 10 de abril de 2017: 19 árbores, dúas delas marcadas como monumentais.',
    labels: etiquetes('🌿 Natureza e Patrimonio', 'Árbores Monumentais'),
    html: '\n      <h3>Un patrimonio de todo o pobo</h3>\n      <p>Elaborou o catálogo <strong>Pedro Ferrer Rodriguez</strong>, <strong>enxeñeiro técnico forestal</strong> e <strong>biólogo</strong>, coa colaboración da asociación <strong>El Rentonar</strong>, e cita a <strong>Ordenança Municipal de Protecció d’Arbres d’Interès Local</strong>.</p>\n      <p>A páxina fonte <strong>non dá medidas</strong> nin <strong>idades</strong> de ningunha árbore, e aquí <strong>tampouco</strong>. Cada nome leva á súa <strong>ficha orixinal</strong>; as plantas do termo están no <a href="/page/herbari"><strong>Herbario de La Torre</strong></a>.</p>\n    '
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

/* P0-45 / IDEA-176 (decisió del Mestre i MarIA, 261107) · /page/anatomia-rural en les altres quatre llengües de
   la interfície. La pàgina hui només mostra el visor 3D del Pou de la Neu del Rentonar; el valencià és a
   PAGE_COPY['anatomia-rural'] (pageContent.js), que les porta a `translations`, i localitzaPagina (pageContent.r10.js)
   les aplica com a l'herbari. Mateixa estructura que el valencià (2 h3 i 5 paràgrafs) i les mateixes xifres de
   Josep Mª Segura Martí (Eines 7-8, 1987; SEGURA_1987 a iso/pouNeuRentonar.js). Els noms dels modes són els rètols
   del visor (POU_NEU_ETIQUETES_VISOR). Sense `labels`: aplicaClassificacioPaginesPubliques posa les canòniques de
   cada llengua. No es congela: eixa funció hi escriu les etiquetes. */
export const TRADUCCIONS_ANATOMIA = {
  es: {
    title: 'Anatomía rural',
    subtitle: 'El Pozo de Nieve del Rentonar, por dentro, cortado y pieza a pieza',
    lead: 'Un visor 3D del Pozo de Nieve del Rentonar, en La Torre de les Maçanes, con las medidas del arqueólogo Josep Mª Segura Martí (1987): entra en el pozo, córtalo por la mitad y desmóntalo pieza a pieza.',
    html: '\n      <h3>Por dentro de una obra de pueblo</h3>\n      <p>El visor muestra el <strong>Pozo de Nieve del Rentonar</strong>, en <strong>La Torre de les Maçanes</strong>, de tres maneras: <strong>«Dentro del pozo»</strong>, para recorrerlo por dentro; <strong>«Corte seccional»</strong>, para verlo cortado; y <strong>«Desmontar en 3D»</strong>, para separar sus piezas una a una. Cada pieza lleva su <strong>nombre</strong>.</p>\n      <h3>Las medidas de Segura</h3>\n      <p>Según el arqueólogo <strong>Josep Mª Segura Martí</strong> («Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, núm. 7 y 8, 1987), el pozo es un cilindro de <strong>9,80 m de diámetro interior</strong> y <strong>13,75 m de profundidad</strong> desde el nivel de las ventanas hasta el fondo, con un <strong>muro de 1,50 m</strong> de grosor en la ventana del oeste y una <strong>capacidad estimada de 1.030 m³</strong>. Arriba se abren <strong>tres ventanas</strong> (norte, oeste y este), tapiadas con obra salvo la del oeste. Al sur, un <strong>túnel</strong> de <strong>9,10 m</strong> lleva hasta el <strong>ingreso</strong>, a <strong>10 m sobre el fondo</strong>, y al este una <strong>galería de desagüe</strong> recorre <strong>29 m</strong> en línea recta.</p>\n      <p>El pozo ha tenido <strong>dos cubiertas</strong>: la primera, con <strong>dos arcos cruzados</strong> de piedra que sujetarían un tejado de teja; la segunda, la que vemos hoy, es una <strong>falsa bóveda</strong> hemisférica de hiladas de piedra.</p>\n      <p><strong>Nota sobre los modelos:</strong> lo que ninguna fuente da (el grosor de la bóveda, la sección de los arcos, el número de peldaños, el tejado de la 1.ª cubierta y el terreno) es <strong>reconstrucción</strong>, y el visor lo dice. No os asustéis si veis cosas <strong>experimentales</strong>: todavía estamos <strong>probando maneras de hacer</strong> las cosas dentro de <strong>Sóc de Poble</strong>.</p>\n      <p>La historia del pozo, los <strong>dos documentales de Eugenio Monesma</strong> sobre los pozos de nieve y las fuentes están en el artículo del Muro <a href="/mur/noves-tecnologies-aplicades-a-la-cultura-rural"><strong>Noves tecnologies aplicades a la cultura rural</strong></a>.</p>\n    '
  },
  en: {
    title: 'Rural anatomy',
    subtitle: 'The Rentonar snow well, inside, cut open and piece by piece',
    lead: 'A 3D viewer of the Rentonar snow well, in La Torre de les Maçanes, with the measurements of the archaeologist Josep Mª Segura Martí (1987): step inside the well, cut it in half and take it apart piece by piece.',
    html: '\n      <h3>Inside a piece of village engineering</h3>\n      <p>The viewer shows the <strong>Rentonar snow well</strong>, in <strong>La Torre de les Maçanes</strong>, in three ways: <strong>“Inside the well”</strong>, to walk through it; <strong>“Cross-section”</strong>, to see it cut open; and <strong>“Take apart in 3D”</strong>, to separate its pieces one by one. Each piece carries its <strong>name</strong>.</p>\n      <h3>Segura’s measurements</h3>\n      <p>According to the archaeologist <strong>Josep Mª Segura Martí</strong> («Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, nos. 7 and 8, 1987), the well is a cylinder with an <strong>inner diameter of 9.80 m</strong> and a <strong>depth of 13.75 m</strong> from the level of the windows to the bottom, with a <strong>1.50 m wall</strong> at the west window and an <strong>estimated capacity of 1,030 m³</strong>. At the top, <strong>three windows</strong> open (north, west and east), walled up except the west one. To the south, a <strong>9.10 m</strong> <strong>tunnel</strong> leads to the <strong>entrance</strong>, <strong>10 m above the bottom</strong>, and to the east a <strong>drainage gallery</strong> runs <strong>29 m</strong> in a straight line.</p>\n      <p>The well has had <strong>two roofs</strong>: the first, with <strong>two crossed stone arches</strong> that would have held a tiled roof; the second, the one we see today, is a hemispherical <strong>corbelled dome</strong> built of courses of stone.</p>\n      <p><strong>A note on the models:</strong> what no source gives (the vault thickness, the arch section, the number of steps, the 1st roof and the terrain) is <strong>reconstruction</strong>, and the viewer says so. Don’t be alarmed if you see <strong>experimental</strong> things: we are still <strong>trying out ways of doing</strong> things inside <strong>Sóc de Poble</strong>.</p>\n      <p>The history of the well, <strong>Eugenio Monesma’s two documentaries</strong> on snow wells and the sources are in the Wall article <a href="/mur/noves-tecnologies-aplicades-a-la-cultura-rural"><strong>Noves tecnologies aplicades a la cultura rural</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Landa anatomia',
    subtitle: 'Rentonarreko elur-putzua, barrutik, ebakita eta piezaz pieza',
    lead: 'Rentonarreko elur-putzuaren 3D ikusgailua (La Torre de les Maçanes), Josep Mª Segura Martí arkeologoaren neurriekin (1987): sartu putzuan, ebaki erditik eta desmuntatu piezaz pieza.',
    html: '\n      <h3>Herriko obra baten barruan</h3>\n      <p>Ikusgailuak <strong>Rentonarreko elur-putzua</strong> (<strong>La Torre de les Maçanes</strong>) hiru eratara erakusten du: <strong>«Putzuaren barruan»</strong>, barrutik ibiltzeko; <strong>«Sekzio-ebakia»</strong>, ebakita ikusteko; eta <strong>«Desmuntatu 3Dn»</strong>, piezak banan-banan bereizteko. Pieza bakoitzak bere <strong>izena</strong> du.</p>\n      <h3>Seguraren neurriak</h3>\n      <p><strong>Josep Mª Segura Martí</strong> arkeologoaren arabera («Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, 7. eta 8. zk., 1987), putzua zilindro bat da: <strong>9,80 m-ko barne-diametroa</strong> eta <strong>13,75 m-ko sakonera</strong> ditu leihoen mailatik hondoraino, <strong>1,50 m-ko horma</strong> mendebaldeko leihoan, eta <strong>1.030 m³-ko edukiera</strong> kalkulatzen zaio. Goian <strong>hiru leiho</strong> irekitzen dira (iparraldean, mendebaldean eta ekialdean), obraz itxita mendebaldekoa izan ezik. Hegoaldean, <strong>9,10 m-ko</strong> <strong>tunel</strong> batek <strong>sarrerara</strong> darama, hondotik <strong>10 m-ra</strong>, eta ekialdean <strong>drainatze-galeria</strong> batek <strong>29 m</strong> egiten ditu lerro zuzenean.</p>\n      <p>Putzuak <strong>bi estalki</strong> izan ditu: lehenak harrizko <strong>bi arku gurutzatu</strong> zituen, teila-estalkiari eusten ziotenak seguruenik; bigarrena, gaur ikusten duguna, harri-ilaraz egindako <strong>kupula faltsu</strong> hemisferikoa da.</p>\n      <p><strong>Ereduei buruzko oharra:</strong> iturri batek ere ematen ez duena (gangaren lodiera, arkuen sekzioa, mailen kopurua, 1. estalkia eta lurra) <strong>berreraikuntza</strong> da, eta ikusgailuak hala dio. Ez ikaratu zerbait <strong>esperimentala</strong> ikusten baduzu: oraindik gauzak egiteko <strong>moduak probatzen</strong> ari gara <strong>Sóc de Poble</strong>-n.</p>\n      <p>Putzuaren historia, <strong>Eugenio Monesmaren bi dokumentalak</strong> elur-putzuei buruz eta iturriak Hormako <a href="/mur/noves-tecnologies-aplicades-a-la-cultura-rural"><strong>Noves tecnologies aplicades a la cultura rural</strong></a> artikuluan daude.</p>\n    '
  },
  gl: {
    title: 'Anatomía rural',
    subtitle: 'O Pozo de Neve do Rentonar, por dentro, cortado e peza a peza',
    lead: 'Un visor 3D do Pozo de Neve do Rentonar, en La Torre de les Maçanes, coas medidas do arqueólogo Josep Mª Segura Martí (1987): entra no pozo, córtao pola metade e desmóntao peza a peza.',
    html: '\n      <h3>Por dentro dunha obra de vila</h3>\n      <p>O visor amosa o <strong>Pozo de Neve do Rentonar</strong>, en <strong>La Torre de les Maçanes</strong>, de tres maneiras: <strong>«Dentro do pozo»</strong>, para percorrelo por dentro; <strong>«Corte seccional»</strong>, para velo cortado; e <strong>«Desmontar en 3D»</strong>, para separar as súas pezas unha a unha. Cada peza leva o seu <strong>nome</strong>.</p>\n      <h3>As medidas de Segura</h3>\n      <p>Segundo o arqueólogo <strong>Josep Mª Segura Martí</strong> («Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, núm. 7 e 8, 1987), o pozo é un cilindro de <strong>9,80 m de diámetro interior</strong> e <strong>13,75 m de profundidade</strong> desde o nivel das fiestras ata o fondo, cun <strong>muro de 1,50 m</strong> de grosor na fiestra do oeste e unha <strong>capacidade estimada de 1.030 m³</strong>. Arriba ábrense <strong>tres fiestras</strong> (norte, oeste e leste), tapiadas con obra agás a do oeste. Ao sur, un <strong>túnel</strong> de <strong>9,10 m</strong> leva ata o <strong>ingreso</strong>, a <strong>10 m sobre o fondo</strong>, e ao leste unha <strong>galería de drenaxe</strong> percorre <strong>29 m</strong> en liña recta.</p>\n      <p>O pozo tivo <strong>dúas cubertas</strong>: a primeira, con <strong>dous arcos cruzados</strong> de pedra que suxeitarían un tellado de tella; a segunda, a que vemos hoxe, é unha <strong>falsa bóveda</strong> hemisférica de fiadas de pedra.</p>\n      <p><strong>Nota sobre os modelos:</strong> o que ningunha fonte dá (o grosor da bóveda, a sección dos arcos, o número de chanzos, o tellado da 1.ª cuberta e o terreo) é <strong>reconstrución</strong>, e o visor dío. Non vos asustedes se vedes cousas <strong>experimentais</strong>: aínda estamos <strong>probando maneiras de facer</strong> as cousas dentro de <strong>Sóc de Poble</strong>.</p>\n      <p>A historia do pozo, os <strong>dous documentais de Eugenio Monesma</strong> sobre os pozos de neve e as fontes están no artigo do Muro <a href="/mur/noves-tecnologies-aplicades-a-la-cultura-rural"><strong>Noves tecnologies aplicades a la cultura rural</strong></a>.</p>\n    '
  }
};
