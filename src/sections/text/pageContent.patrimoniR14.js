/* Onada R14 · /page/receptes: el receptari «Què dinem?» de l'Associació Gastronòmica i Cultural «Fins rebentar com
   Sangonereta» (Muro, El Comtat, 2019). Es publica com les pàgines de patrimoni de l'Onada R9 (PageDetailSection,
   sense ruta nova): el cos és este text breu i la llista de receptes va davall, en un tros diferit
   (src/sections/patrimoni/ReceptesQueDinemSection.jsx). PAGE_COPY la incorpora al final de pageContent.js.
   · Cap xifra escrita a mà: els recomptes (receptes, vídeos i làmines) els calcula la secció a partir de les dades.
   · Onada R15b (RV-03) · El paràgraf dels al·lèrgens ja no diu «ací no se n’afig cap»: cada recepta porta la proposta
     assistida del lèxic tancat, pendent de validació humana (CandidatsAlergens), i el text ho explica en les cinc
     llengües amb els mateixos símbols del panell. Cap «escandall» (la fitxa pública no en mostra).
   · Onada R15 (P3-2) · Ni el lead ni el cos no diuen que cada recepta porte làmina (n'hi ha una sense: la recepta 126, p. 138)
     ni notes: la làmina, les notes i el vídeo van «quan en té», en les cinc llengües.
   · Onada R16 · La portada visible és PORTADA_IMAGE (portada_que_dinem_muro.webp, 1200×675): la capçalera de la
     pàgina i, per targetesMur.js, la imatge de la seua targeta al Mur, amb el text alternatiu (imageAlt) de cada
     llengua. Les làmines del llibre fan uns 360 px d'ample i no fan de capçalera. Per a xarxes, `og_image` (la
     imatge que tria l'autor, P1-61) continua sent la variant social de la làmina de l'olleta murera (p. 90 del
     llibre), feta amb tooling/seo/tria-imatge-seo.mjs · generaVariantSocial1200x630 (JPEG 1200x630, ≤ 300.000 B,
     sense APP1). No passa per VARIANTS_SOCIALS (imatgeSocial.js), que viatja a l'entrada del paquet.
     El permís que recull src/data/patrimoni/queDinem.js és el del PDF del llibre («amb tots els permisos d'ús de
     text i imatges», declaració del Mestre; camp `permis`: «text i làmines»). La portada no ix del PDF, i el
     repositori no en documenta l'origen: queda pendent que el Mestre ho confirme.
   · Etiquetes: com les de R9, la categoria i l'etiqueta; la classificació canònica (CLASSIFICACIO_PAGINES_PUBLIQUES,
     'receptes': patrimoni-cultura + Patrimoni) hi posa «Sistema» i les escriu en cada llengua.
   `date`: l'hora en què es va escriure l'entrada (no la d'un commit), com les pàgines de l'Onada R9. */
const OG_IMAGE = '/assets/uploads/patrimoni/que-dinem/p090-social-1200x630.jpg';
const PORTADA_IMAGE = '/assets/uploads/patrimoni/portada_que_dinem_muro.webp';

const etiquetes = (categoria, tag) => [
  { text: categoria, className: 'sdp-badge-category' },
  { text: tag, className: 'sdp-badge-tag' }
];

const RECEPTES = {
  ca: {
    title: 'Què dinem?',
    subtitle: 'El receptari de Muro (El Comtat), amb el text i les làmines del llibre',
    imageAlt: 'Portada del llibre «Què dinem?» de l’Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, 2019)',
    lead: 'Les receptes del llibre «Què dinem?», que l’Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» va editar a Muro el 2019: cada recepta amb els ingredients i l’elaboració i, quan en té, la làmina del llibre i el vídeo del canal de l’associació.',
    labels: etiquetes('🎭 Cultura, Música i Llengua', 'Patrimoni'),
    html: '\n      <h3>Què hi ha i què no hi ha</h3>\n      <p>Cada recepta porta el <strong>títol</strong>, la <strong>pàgina</strong>, els <strong>ingredients</strong> i l’<strong>elaboració</strong> tal com són al llibre i, si en té, les <strong>notes</strong>, la <strong>làmina</strong> i el <strong>vídeo</strong>. El llibre sencer es pot <strong>descarregar en PDF</strong>.</p>\n      <p>El llibre <strong>no parla d’al·lèrgens</strong>. Cada recepta en mostra una <strong>proposta assistida, pendent de validació humana</strong>, llegida de les paraules del llibre: «•» quan un ingredient el delata, «T» quan és possible i «? Sense dada» quan no se’n sap res; mai diu que no n’hi haja. Si tens una al·lèrgia, <strong>pregunta-ho a qui cuina</strong>. Les varietats tradicionals d’horta són al <a href="/page/banc-de-llavors"><strong>Banc de llavors</strong></a>.</p>\n    '
  },
  es: {
    title: '¿Qué comemos?',
    subtitle: 'El recetario de Muro (El Comtat), con el texto y las láminas del libro',
    imageAlt: 'Portada del libro «Què dinem?» de la Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, 2019)',
    lead: 'Las recetas del libro «Què dinem?», que la Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» editó en Muro en 2019: cada receta con los ingredientes y la elaboración y, cuando los tiene, la lámina del libro y el vídeo del canal de la asociación.',
    labels: etiquetes('🎭 Cultura, Música y Lengua', 'Patrimonio'),
    html: '\n      <h3>Qué hay y qué no hay</h3>\n      <p>Cada receta lleva el <strong>título</strong>, la <strong>página</strong>, los <strong>ingredientes</strong> y la <strong>elaboración</strong> tal como están en el libro, en su lengua original, y, si los tiene, las <strong>notas</strong>, la <strong>lámina</strong> y el <strong>vídeo</strong>. El libro completo se puede <strong>descargar en PDF</strong>.</p>\n      <p>El libro <strong>no habla de alérgenos</strong>. Cada receta muestra una <strong>propuesta asistida, pendiente de validación humana</strong>, leída de las palabras del libro: «•» cuando un ingrediente lo delata, «T» cuando es posible y «? Sin datos» cuando no se sabe nada; nunca dice que no haya. Si tienes una alergia, <strong>pregúntaselo a quien cocina</strong>. Las variedades tradicionales de huerta están en el <a href="/page/banc-de-llavors"><strong>Banco de semillas</strong></a>.</p>\n    '
  },
  en: {
    title: 'What’s for lunch?',
    subtitle: 'The recipe book of Muro (El Comtat), with the text and plates of the book',
    imageAlt: 'Cover of the recipe book «Què dinem?» by the Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, 2019)',
    lead: 'The recipes in «Què dinem?», the book published in Muro in 2019 by the Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»: each recipe with the ingredients and the method and, when it has them, the plate from the book and the video from the association’s channel.',
    labels: etiquetes('🎭 Culture, Music and Language', 'Heritage'),
    html: '\n      <h3>What is here and what is not</h3>\n      <p>Each recipe carries the <strong>title</strong>, the <strong>page</strong>, the <strong>ingredients</strong> and the <strong>method</strong> exactly as in the book, in its original language, and, if it has them, the <strong>notes</strong>, the <strong>plate</strong> and the <strong>video</strong>. The whole book can be <strong>downloaded as a PDF</strong>.</p>\n      <p>The book <strong>does not mention allergens</strong>. Each recipe shows an <strong>assisted proposal, pending human validation</strong>, read from the words of the book: «•» when an ingredient gives it away, «T» when it is possible and «? No data» when nothing is known; it never says there is none. If you have an allergy, <strong>ask whoever is cooking</strong>. Traditional vegetable varieties are in the <a href="/page/banc-de-llavors"><strong>Seed bank</strong></a>.</p>\n    '
  },
  eu: {
    title: 'Zer bazkalduko dugu?',
    subtitle: 'Muroko errezeta-liburua (El Comtat), liburuaren testuarekin eta irudiekin',
    imageAlt: '«Què dinem?» errezeta-liburuaren azala, Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, 2019)',
    lead: '«Què dinem?» liburuko errezetak, Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» elkarteak Muron 2019an argitaratua: errezeta bakoitza osagaiekin eta prestaketarekin, eta, baldin baditu, liburuko irudiarekin eta elkartearen kanaleko bideoarekin.',
    labels: etiquetes('🎭 Kultura, Musika eta Hizkuntza', 'Ondarea'),
    html: '\n      <h3>Zer dagoen eta zer ez</h3>\n      <p>Errezeta bakoitzak <strong>izenburua</strong>, <strong>orrialdea</strong>, <strong>osagaiak</strong> eta <strong>prestaketa</strong> ditu, liburuan dauden bezala, jatorrizko hizkuntzan, eta, baldin baditu, <strong>oharrak</strong>, <strong>irudia</strong> eta <strong>bideoa</strong>. Liburu osoa <strong>PDFn deskarga</strong> daiteke.</p>\n      <p>Liburuak <strong>ez du alergenoei buruz ezer esaten</strong>. Errezeta bakoitzak <strong>proposamen lagundu bat erakusten du, giza balioztatzearen zain</strong>, liburuko hitzetatik irakurria: «•» osagai batek salatzen duenean, «T» posible denean eta «? Daturik ez» ezer ez dakigunean; ez du inoiz esaten ez dagoenik. Alergiaren bat baduzu, <strong>galdetu sukaldatzen duenari</strong>. Baratzeko barietate tradizionalak <a href="/page/banc-de-llavors"><strong>Hazi bankuan</strong></a> daude.</p>\n    '
  },
  gl: {
    title: 'Que xantamos?',
    subtitle: 'O receitario de Muro (El Comtat), co texto e as láminas do libro',
    imageAlt: 'Portada do libro «Què dinem?» da Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, 2019)',
    lead: 'As receitas do libro «Què dinem?», que a Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» editou en Muro en 2019: cada receita cos ingredientes e a elaboración e, cando os ten, a lámina do libro e o vídeo da canle da asociación.',
    labels: etiquetes('🎭 Cultura, Música e Lingua', 'Patrimonio'),
    html: '\n      <h3>Que hai e que non hai</h3>\n      <p>Cada receita leva o <strong>título</strong>, a <strong>páxina</strong>, os <strong>ingredientes</strong> e a <strong>elaboración</strong> tal como están no libro, na súa lingua orixinal, e, se os ten, as <strong>notas</strong>, a <strong>lámina</strong> e o <strong>vídeo</strong>. O libro completo pódese <strong>descargar en PDF</strong>.</p>\n      <p>O libro <strong>non fala de alérxenos</strong>. Cada receita mostra unha <strong>proposta asistida, pendente de validación humana</strong>, lida das palabras do libro: «•» cando un ingrediente o delata, «T» cando é posible e «? Sen datos» cando non se sabe nada; nunca di que non haxa. Se tes unha alerxia, <strong>pregúntallo a quen cociña</strong>. As variedades tradicionais de horta están no <a href="/page/banc-de-llavors"><strong>Banco de sementes</strong></a>.</p>\n    '
  }
};

const pagina = (date, textos) => ({
  date,
  ...textos.ca,
  image: PORTADA_IMAGE,
  imageWidth: 1200,
  imageHeight: 675,
  og_image: OG_IMAGE,
  translations: Object.fromEntries(Object.entries(textos).filter(([llengua]) => llengua !== 'ca')),
  contentLanguage: 'ca'
});

export const PAGINES_PATRIMONI_R14 = {
  receptes: pagina('2026-11-09T00:23:00+01:00', RECEPTES)
};
