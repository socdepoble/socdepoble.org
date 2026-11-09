/* Onada R14 · /page/receptes: el receptari «Què dinem?» de l'Associació Gastronòmica i Cultural «Fins rebentar com
   Sangonereta» (Muro, El Comtat, 2019). Es publica com les pàgines de patrimoni de l'Onada R9 (PageDetailSection,
   sense ruta nova): el cos és este text breu i la llista de receptes va davall, en un tros diferit
   (src/sections/patrimoni/ReceptesQueDinemSection.jsx). PAGE_COPY la incorpora al final de pageContent.js.
   · Cap xifra escrita a mà: els recomptes (receptes, vídeos i làmines) els calcula la secció a partir de les dades.
   · Cap portada visible: les làmines del llibre fan uns 360 px d'ample i no fan de capçalera. Per a xarxes,
     `og_image` (la imatge que tria l'autor, P1-61) és la variant social de la làmina de l'olleta murera (p. 90 del
     llibre), feta amb tooling/seo/tria-imatge-seo.mjs · generaVariantSocial1200x630 (JPEG 1200x630, ≤ 300.000 B,
     sense APP1). No passa per VARIANTS_SOCIALS (imatgeSocial.js), que viatja a l'entrada del paquet.
   · Etiquetes: com les de R9, la categoria i l'etiqueta; la classificació canònica (CLASSIFICACIO_PAGINES_PUBLIQUES,
     'receptes': patrimoni-cultura + Patrimoni) hi posa «Sistema» i les escriu en cada llengua.
   `date`: l'hora en què es va escriure l'entrada (no la d'un commit), com les pàgines de l'Onada R9. */
const OG_IMAGE = '/assets/uploads/patrimoni/que-dinem/p090-social-1200x630.jpg';

const etiquetes = (categoria, tag) => [
  { text: categoria, className: 'sdp-badge-category' },
  { text: tag, className: 'sdp-badge-tag' }
];

const RECEPTES = {
  ca: {
    title: 'Què dinem?',
    subtitle: 'El receptari de Muro (El Comtat), amb el text i les làmines del llibre',
    lead: 'Les receptes del llibre «Què dinem?», que l’Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» va editar a Muro el 2019: cada recepta amb els ingredients, l’elaboració i la làmina del llibre i, quan en té, el vídeo del canal de l’associació.',
    labels: etiquetes('🎭 Cultura, Música i Llengua', 'Patrimoni'),
    html: '\n      <h3>Què hi ha i què no hi ha</h3>\n      <p>Cada recepta porta el <strong>títol</strong>, la <strong>pàgina</strong>, els <strong>ingredients</strong>, l’<strong>elaboració</strong> i les <strong>notes</strong> tal com són al llibre, amb la seua <strong>làmina</strong> i, si en té, el <strong>vídeo</strong>. El llibre sencer es pot <strong>descarregar en PDF</strong>.</p>\n      <p>El llibre <strong>no parla d’al·lèrgens</strong> i ací no se n’afig cap: si tens una al·lèrgia, <strong>pregunta-ho a qui cuina</strong>. Les varietats tradicionals d’horta són al <a href="/page/banc-de-llavors"><strong>Banc de llavors</strong></a>.</p>\n    '
  },
  es: {
    title: '¿Qué comemos?',
    subtitle: 'El recetario de Muro (El Comtat), con el texto y las láminas del libro',
    lead: 'Las recetas del libro «Què dinem?», que la Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» editó en Muro en 2019: cada receta con los ingredientes, la elaboración y la lámina del libro y, cuando lo tiene, el vídeo del canal de la asociación.',
    labels: etiquetes('🎭 Cultura, Música y Lengua', 'Patrimonio'),
    html: '\n      <h3>Qué hay y qué no hay</h3>\n      <p>Cada receta lleva el <strong>título</strong>, la <strong>página</strong>, los <strong>ingredientes</strong>, la <strong>elaboración</strong> y las <strong>notas</strong> tal como están en el libro, en su lengua original, con su <strong>lámina</strong> y, si lo tiene, el <strong>vídeo</strong>. El libro completo se puede <strong>descargar en PDF</strong>.</p>\n      <p>El libro <strong>no habla de alérgenos</strong> y aquí no se añade ninguno: si tienes una alergia, <strong>pregúntaselo a quien cocina</strong>. Las variedades tradicionales de huerta están en el <a href="/page/banc-de-llavors"><strong>Banco de semillas</strong></a>.</p>\n    '
  },
  en: {
    title: 'What’s for lunch?',
    subtitle: 'The recipe book of Muro (El Comtat), with the text and plates of the book',
    lead: 'The recipes in «Què dinem?», the book published in Muro in 2019 by the Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»: each recipe with the ingredients, the method and the plate from the book and, when there is one, the video from the association’s channel.',
    labels: etiquetes('🎭 Culture, Music and Language', 'Heritage'),
    html: '\n      <h3>What is here and what is not</h3>\n      <p>Each recipe carries the <strong>title</strong>, the <strong>page</strong>, the <strong>ingredients</strong>, the <strong>method</strong> and the <strong>notes</strong> exactly as in the book, in its original language, with its <strong>plate</strong> and, if it has one, the <strong>video</strong>. The whole book can be <strong>downloaded as a PDF</strong>.</p>\n      <p>The book <strong>does not mention allergens</strong> and none are added here: if you have an allergy, <strong>ask whoever is cooking</strong>. Traditional vegetable varieties are in the <a href="/page/banc-de-llavors"><strong>Seed bank</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Zer bazkalduko dugu?',
    subtitle: 'Muroko errezeta-liburua (El Comtat), liburuaren testuarekin eta irudiekin',
    lead: '«Què dinem?» liburuko errezetak, Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» elkarteak Muron 2019an argitaratua: errezeta bakoitza osagaiekin, prestaketarekin eta liburuko irudiarekin, eta, baldin badu, elkartearen kanaleko bideoarekin.',
    labels: etiquetes('🎭 Kultura, Musika eta Hizkuntza', 'Ondarea'),
    html: '\n      <h3>Zer dagoen eta zer ez</h3>\n      <p>Errezeta bakoitzak <strong>izenburua</strong>, <strong>orrialdea</strong>, <strong>osagaiak</strong>, <strong>prestaketa</strong> eta <strong>oharrak</strong> ditu, liburuan dauden bezala, jatorrizko hizkuntzan, bere <strong>irudiarekin</strong> eta, baldin badu, <strong>bideoarekin</strong>. Liburu osoa <strong>PDFn deskarga</strong> daiteke.</p>\n      <p>Liburuak <strong>ez du alergenoei buruz ezer esaten</strong> eta hemen ez da bat ere gehitzen: alergiaren bat baduzu, <strong>galdetu sukaldatzen duenari</strong>. Baratzeko barietate tradizionalak <a href="/page/banc-de-llavors"><strong>Hazi bankuan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Que xantamos?',
    subtitle: 'O receitario de Muro (El Comtat), co texto e as láminas do libro',
    lead: 'As receitas do libro «Què dinem?», que a Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» editou en Muro en 2019: cada receita cos ingredientes, a elaboración e a lámina do libro e, cando o ten, o vídeo da canle da asociación.',
    labels: etiquetes('🎭 Cultura, Música e Lingua', 'Patrimonio'),
    html: '\n      <h3>Que hai e que non hai</h3>\n      <p>Cada receita leva o <strong>título</strong>, a <strong>páxina</strong>, os <strong>ingredientes</strong>, a <strong>elaboración</strong> e as <strong>notas</strong> tal como están no libro, na súa lingua orixinal, coa súa <strong>lámina</strong> e, se o ten, o <strong>vídeo</strong>. O libro completo pódese <strong>descargar en PDF</strong>.</p>\n      <p>O libro <strong>non fala de alérxenos</strong> e aquí non se engade ningún: se tes unha alerxia, <strong>pregúntallo a quen cociña</strong>. As variedades tradicionais de horta están no <a href="/page/banc-de-llavors"><strong>Banco de sementes</strong></a>.</p>\n    '
  }
};

const pagina = (date, textos) => ({
  date,
  ...textos.ca,
  og_image: OG_IMAGE,
  translations: Object.fromEntries(Object.entries(textos).filter(([llengua]) => llengua !== 'ca')),
  contentLanguage: 'ca'
});

export const PAGINES_PATRIMONI_R14 = {
  receptes: pagina('2026-11-09T00:23:00+01:00', RECEPTES)
};
