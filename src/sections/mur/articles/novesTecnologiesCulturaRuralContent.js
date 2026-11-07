/* IDEA-116 + IDEA-119 (Onada R9, carril C2; ordre del Mestre del 261106) ·
   «Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de
   Neu del Rentonar», la primera publicació del Mur.

   Instantània editorial pura (sense imports). R9V-C2-01 · NO va al tros
   `pobles-aplec` (que l'arrencada precarrega) ni a l'entrada: només la
   importen mòduls de trossos diferits (la llavor, data/sectionContent.js; la
   capa de dades, content.js; l'article; /notes; la targeta de /page/fediversity).
   El document sencer és HTML editable des de /notes (P0-25: revisió editorial,
   publicacioEditable.js · CANONICS); el visor del pou i la veu de la IAIA els
   posa l'article (NovesTecnologiesCulturaRuralArticle.jsx), en diferit.

   Honestedat (R7G-15.10, G10-05): cada xifra i cada fet ix de la taula de
   fets del carril (fonts del disc citades una a una): l'article de Josep Mª
   Segura Martí (socdepoble.net, WP 3656), les entrades d'El Rentonar (WP 3653
   i 16761, rentonar.blogspot.com) i, sense cap xifra, l'esbós de Gràfics de Poble
   (76150.jpg). El pou és de propietat privada i d'accés lliure (WP 3653): no
   s'hi nomena cap particular. Cap fotografia: l'esquema el dibuixa el codi.
   Les URL del blog són les del camp `link rel=alternate` del volcat Blogger.

   IDEA-165 (Onada R11 · kit R91 de Gemini, adaptat a la tesi de l'àrbitre):
    · Les mides són les de Segura (Eines 7-8, 1987; corpus del Rentonar,
      l. 974-1063), les mateixes de pouNeuRentonar.js (SEGURA_1987). El mur
      fa 1,50 m (l. 992): 1,55 m és l'amplària de la finestra de l'oest.
    · L'esbós 76150 (sense autor ni escala) no dona cap xifra a l'article: en
      queda la idea pedagògica.
    · L'ofici dels nevaters és el que Segura descriu a Narria (1985) per a les
      muntanyes alacantines en general, no una dada del Rentonar.
    · Els escrits de l'Alcaldia del 12-07-2021 i la fitxa de l'inventari
      (codi 1, 01/09/93) són a les imatges de l'entrada del 25-12-2021.
    · El que només diu la fitxa de treball de la biblioteca del Node 0
      (1.200 m, la saga constructora, Alacant, el gener de 1919, la
      «incoació») es diu com a no confirmat; el nom rebutjat a G10-05 no s'hi
      escriu.
    · Cap equivalència entre els 1.030 m³ de Segura i les 20.000 arroves de
      Rico (1880): són dues estimacions independents.

   Data: el 06-11-2026 a les 14:29 (CET), quan naix este fitxer (stat: naixement
   14:29:18; R9V-C2-06), és a dir, quan s'escriu la publicació (ordre del Mestre
   del 261106, 14:06). Encara no hi ha cap commit que la publique: pendent del
   Mestre confirmar-la o canviar-la per la del desplegament (D-C2-1). */

export const NOVES_TECNOLOGIES_CULTURA_RURAL_ID = 'noves-tecnologies-aplicades-a-la-cultura-rural';

/** El documental (només este vídeo és d'Eugenio Monesma): id i títol del
 *  visor d'anatomia (anatomiaRural.js, estructura POU). */
export const NOVES_TECNOLOGIES_VIDEO = Object.freeze({
  id: '3RQv3xjVr-M',
  titol: 'Los EMPOZADORES y las NEVERAS naturales de HIELO. Conservación ancestral de la NIEVE para el verano'
});

const FORA = 'target="_blank" rel="noopener noreferrer"';
const enllac = (href, text) => `<a href="${href}" ${FORA}><strong>${text}</strong></a>`;

/** Les fonts publicades, en ordre de data (data, títol, URL).
 *  G1-N01 (Gauntlet de l'arbre R9) · «les jornades de neteja … (2021 i 2023)»: cada any porta la seua entrada.
 *  La de 2021 és la del volcat Blogger d'El Rentonar (21-06-2021, camp link rel=alternate), com les altres del blog. */
export const NOVES_TECNOLOGIES_FONTS = Object.freeze([
  ['17-04-2020', 'El Pou de la neu del Rentonar', 'https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/'],
  ['30-10-2020', 'La fissura del sostre del pou de neu', 'https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/'],
  ['21-06-2021', 'Jornada de neteja del camí de pujada al Pou de neu', 'https://rentonar.blogspot.com/2021/06/jornada-de-neteja-del-cami-de-pujada-al.html'],
  ['25-12-2021', 'El Pou de Neu del Rentonar front a l’Administració', 'https://socdepoble.net/2021/12/25/el-pou-de-neu-del-rentonar-front-a-ladministracio/'],
  ['28-08-2023', 'Pou de Neu del Rentonar: Esperant amb candeleta', 'https://rentonar.blogspot.com/2023/08/pou-de-neu-del-rentonar-esperant-amb.html'],
  ['22-10-2023', 'Dues jornades de neteja de l’entorn del Pou de Neu', 'https://rentonar.blogspot.com/2023/10/dues-jornades-de-neteja-de-lentorn-del.html'],
  ['26-04-2025', 'Excursió al Pou de Neu del Rentonar amb Anna Garcia Barrachina', 'https://rentonar.blogspot.com/2025/04/excursio-al-pou-de-neu-del-rentonar-amb.html']
].map((fila) => Object.freeze(fila)));

export const NOVES_TECNOLOGIES_CULTURA_RURAL_HTML = [
  '<h3>Per què un pou de neu en 3D</h3>',
  '<p>Les <strong>noves tecnologies</strong> també servixen per a entendre el <strong>patrimoni rural</strong>. Damunt d’este text, un <strong>sol visor</strong> generat amb codi, sense cap fotografia, mostra el <strong>Pou de Neu del Rentonar</strong>, a <strong>La Torre de les Maçanes</strong>, de tres maneres: <strong>«Dins del pou»</strong>, per a recórrer-lo per dins; <strong>«Tall seccional»</strong>, per a veure’l tallat per la meitat des de fora; i <strong>«Desmuntar en 3D»</strong>, per a separar-ne les peces una a una. Si el navegador no té WebGL2, només hi ha el desmuntatge. Cada xifra porta la seua <strong>font</strong>, i quan dues fonts <strong>no coincidixen</strong>, ho diem.</p>',
  '<p><strong>Nota sobre els models:</strong> les mides del visor són les de l’arqueòleg <strong>Josep Mª Segura Martí</strong> (1987). El que cap font no dona (el gruix de la volta, la secció dels arcs, el nombre de graons, la teulada de la primera coberta i el terreny) és <strong>reconstrucció</strong>, i el visor ho diu; les temperatures, la massa i el cabal són estimacions del model, no mesures del monument. Encara estem <strong>provant maneres de fer</strong> les coses dins de <strong>Sóc de Poble</strong>.</p>',
  '<h3>Què diu l’estudi</h3>',
  '<blockquote><p>«autèntics magatzems de neu amb què abastir els pobles durant l’estiu»</p></blockquote>',
  `<p>Així definix els pous de neu <strong>Josep Mª Segura Martí</strong>, del Museu Arqueològic Municipal d’Alcoi, a l’article que ${enllac('https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/', 'Sóc de Poble conserva')}, amb les dades del seu treball «Els pous i l’antic comerç de la neu a Xixona», publicat a la revista <em>Eines</em> (núm. 7 i 8, <strong>1987</strong>). Ja el <strong>1985</strong>, a la revista <em>Narria</em>, havia posat este pou d’exemple d’aprofitament de l’aigua del desgel, perquè té el <strong>desguàs</strong> a nivell inferior. El pou està a <strong>1.160 m</strong>, té un <strong>túnel</strong> d’accés al sud i una <strong>galeria de desguàs</strong> de <strong>29 m</strong>, i els documents en parlen de <strong>1724</strong> a <strong>1880</strong>.</p>`,
  '<h3>L’arquitectura, amb les mides de Segura</h3>',
  '<p>El pou ocupa un ampli coll al <strong>vessant oriental dels Plans</strong>, baix del cim (<strong>1.330 m</strong>), al terme de La Torre de les Maçanes, on fita amb el de Benifallim. El ventisquer mira a <strong>llevant</strong>, i el dipòsit aprofita el desnivell de l’est: les terres de l’excavació, terraplenades darrere d’un <strong>paredó circular</strong> a manera de talús, li donen més altura. A trenta metres a l’oest, Segura hi va veure una petita edificació que encara feia de corral.</p>',
  '<p><strong>Altitud:</strong> Segura el situa a <strong>1.160 m</strong> sobre el nivell de la mar. La fitxa de treball de la biblioteca de Sóc de Poble (Node 0) diu <strong>1.200 m</strong> sense dir de quin document els trau; entre les seues fonts cita la documentació del bé de rellevància local de 2021-2022, que no hem pogut consultar; la fitxa de l’inventari que reproduïx l’associació (1993) no dona cap altitud. Mentre no aparega una font primària amb els 1.200 m, manen els 1.160 m de Segura.</p>',
  '<p>El <strong>pou</strong> és un cilindre de <strong>9,80 m de diàmetre interior</strong> i <strong>13,75 m de fondària</strong> des del nivell de les finestres fins al fons, de maçoneria lluïda amb morter per dins. Segura n’estima la <strong>capacitat en 1.030 m³</strong> (π · 4,90² · 13,75 ≈ 1.037 m³).</p>',
  '<p>Dalt, s’obrin <strong>tres finestres</strong> (nord, oest i est), parcialment derrocades i hui <strong>cegades amb obra</strong>, llevat de la de l’<strong>oest</strong>, l’única oberta: fa <strong>1,55 m d’amplària</strong> i <strong>1,70 m d’altura màxima</strong>, és bastida en carreus i té una volta rebaixada de maçoneria disposada en sardinell. El <strong>gruix del mur</strong>, en eixe punt, és d’<strong>1,50 m</strong>. Segura només mesura al text la de l’oest; als plànols, posa les mateixes cotes a la del nord (1,55 m) i a la de l’est (1,70 m).</p>',
  '<p>Al <strong>sud</strong>, un <strong>túnel</strong> amb volta rebaixada de maçoneria, de <strong>9,10 m</strong> de longitud, fa <strong>2,35 m d’ample</strong> a l’entrada i <strong>va estretint-se</strong> cap a dins fins a l’<strong>ingrés</strong> del pou, d’<strong>1,35 m d’ample</strong> per <strong>1,55 m d’altura</strong>, a <strong>10,00 m damunt del fons</strong>. Per a l’entrada, el text de Segura diu «12,10 m d’altura», que no pot ser l’altura del túnel: probablement és la cota de la clau sobre el fons del pou (10,00 + 2,10 m), i la secció C-D hi dibuixa uns 2,10 m. Davall de l’ingrés, al mur, hi ha <strong>esglaons</strong> buidats.</p>',
  '<p>A l’<strong>est</strong>, on el terreny cau més, ix del punt més baix del pou un <strong>desguàs</strong>, cosa poc freqüent en estos dipòsits: un estret passadís de <strong>0,50 m d’ample</strong> per <strong>0,70 m d’altura</strong> que, amb un cert pendent, recorre <strong>29 m en línia recta</strong> fins a l’exterior. Quasi tot està excavat en la terra, i al principi i al final té el sostre <strong>enllosat</strong> amb grans pedres planes, com un alcavó. A fora, Segura no hi va trobar cap bassa que arreplegara l’aigua del desgel.</p>',
  '<h3>Les dues cobertes</h3>',
  '<p>La <strong>primera coberta</strong> era una volta que, segons Segura, subjectaria un <strong>trespol de teula</strong>. Embotits al mur, entre l’ingrés sud i les finestres, en queden els <strong>quatre estreps</strong> de carreus de <strong>dos arcs creuats</strong> de pedra, l’un de nord-est a sud-oest i l’altre de nord-oest a sud-est: a la planta de Segura són la <strong>X</strong> de línia discontínua.</p>',
  '<p>La <strong>segona coberta</strong>, la que veiem hui, és una <strong>falsa volta</strong>: una coberta <strong>hemisfèrica</strong> perfecta, bastida per aproximació successiva de <strong>filades</strong> de pedra, sense cap arc. Per fora està parcialment <strong>erosionada</strong> i amb molts esbornacs.</p>',
  '<p><strong>Quan es va bastir:</strong> per la tipologia dels estreps dels arcs primitius, Segura data el pou entre els <strong>segles XVII i XVIII</strong>, amb paral·lels a Mariola i al Carrascar d’Alcoi i Ibi documentats en eixe moment, que també van conéixer una segona coberta de maçoneria. La fitxa de l’inventari de 1993, en castellà, diu «Principios del s.XVIII». Cap de les fonts consultades no data la segona coberta.</p>',
  '<h3>El cicle de la neu</h3>',
  '<p>A l’article del Rentonar, Segura només hi esmenta el <strong>tragí dels arriers</strong> que encara recorden els avis: als mesos d’estiu, portaven en <strong>sàrries</strong> la neu dels pous, que a l’hivern s’havia arreplegat als <strong>ventisquers</strong>. Com treballaven els nevaters ho conta per als pous de les <strong>muntanyes alacantines</strong> en general (<em>Narria</em>, 1985):</p>',
  '<p>A l’<strong>hivern</strong>, una quadrilla arreplegava la neu del ventisquer amb pales, aixades i <strong>cabassos d’espart</strong>, i la tirava per les <strong>boques superiors</strong>. Dins del pou, uns altres la comprimien amb <strong>maces de fusta</strong> (a Ibi en deien «pilons») al ritme de cançons de batre, i l’anaven disposant en <strong>tongades</strong> separades per capes de <strong>palla</strong> o de boll d’arròs.</p>',
  '<p>A l’<strong>estiu</strong>, baixaven a <strong>«picar la neu»</strong>, ja convertida en glaç, la pujaven amb cabassos lligats a una corda que passava per una <strong>corriola</strong>, la premsaven en motles de fusta i, a l’ombra, la pesaven amb la <strong>romana</strong>. Embolicada amb palla i mantes, la neu eixia en sàrries a llom de les bèsties: una càrrega feia unes <strong>10 arroves</strong> (uns 115 kg, a 11,5 kg l’arrova) i es portava preferentment a <strong>hores primerenques</strong>, per a perdre’n menys amb la calor.</p>',
  '<h3>La història documentada</h3>',
  '<p><strong>1724.</strong> Les notícies més antigues del pou són de l’any en què <strong>Alcoi</strong> s’abastia de neu per mitjà de <strong>Joseph Giner</strong>, de Cocentaina, aleshores propietari del pou del Rontonar i d’un altre o altres a la serra d’<strong>Aitana</strong> (Arxiu Municipal de Xixona, segons Segura).</p>',
  '<p><strong>1728.</strong> Giner s’obligà a abastir <strong>Xixona</strong> amb la neu del Rontonar i de l’Aitana, però no ho va poder fer, perquè no tenia neu en cap dels seus pous (Arxiu Municipal de Xixona, cabildo del 2 de maig de 1728).</p>',
  '<p><strong>Segle XIX.</strong> Els capítols de l’abast de la neu de Xixona arribaven per edicte a <strong>La Torre de les Maçanes</strong>, Ibi i Tibi, per a trobar licitadors per a l’arrendament de l’abast de maig a octubre. El <strong>1880</strong>, l’il·lustrat alacantí <strong>Manuel Rico García</strong>, fill d’un nevater de Xixona, va publicar a <em>La Unión Democrática</em> (2, 6 i 8 de juliol) la sèrie «Pozos de nieve. Su historia y conservación». Entre els <strong>23 pous de neu</strong> i els <strong>9 de gel</strong> que hi havia en explotació a la província d’Alacant, hi nomena el del Rontonar i li calcula <strong>20.000 arroves</strong> de capacitat: és una estimació seua, independent dels 1.030 m³ de Segura, i no n’és cap equivalència.</p>',
  '<p><strong>Segle XX.</strong> Els arxius en parlen fins al 1880, però Segura pensa que el pou <strong>s’explotaria durant les dues primeres dècades del segle XX</strong>.</p>',
  '<p><strong>El que no podem confirmar:</strong> la fitxa de treball de la biblioteca de Sóc de Poble (Node 0) afig que el pou el va bastir una saga de nevaters d’Alacant, que la neu també anava a Alacant i que la darrera explotació va ser el gener de 1919. Cap dels documents que hem pogut consultar no ho diu, i no ho donem per bo.</p>',
  '<h3>El pou hui</h3>',
  `<p>El pou <strong>no és de titularitat pública</strong>, però és de <strong>lliure accés</strong>. L’<strong>Associació El Rentonar</strong> n’ha documentat la ${enllac('https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/', 'fissura del sostre')} (2020), les ${enllac('https://socdepoble.net/2021/12/25/el-pou-de-neu-del-rentonar-front-a-ladministracio/', 'gestions davant l’Administració')} per l’error d’inscripció com a bé de rellevància local (2020-2022) i les <strong>jornades de neteja</strong> del camí i de l’entorn (2021 i 2023). Segons el blog de l’associació, el <strong>26 d’agost de 2023</strong> l’error encara <strong>no s’havia corregit</strong>.</p>`,
  '<p><strong>L’error d’inscripció:</strong> la fitxa de l’Inventari General del Patrimoni Cultural Valencià (codi 1; autor, Segura; 1 de setembre de 1993) el té com a bé de rellevància local de <strong>Benifallim</strong>, i no de La Torre de les Maçanes. El <strong>12 de juliol de 2021</strong>, dos escrits de l’Alcaldia de La Torre el reconeixen com a <strong>bé de rellevància local per determinació legal</strong> (disposició addicional cinquena de la Llei del Patrimoni Cultural Valencià), n’inicien la comunicació a la Conselleria perquè l’inscriga a la secció segona de l’Inventari i obrin un procediment d’ordre d’execució perquè la propietat el conserve. La protecció, per tant, li ve de la llei: la «incoació» que diu la fitxa de treball de la biblioteca de Sóc de Poble no consta en cap dels documents publicats.</p>',
  '<p><strong>26 d’abril de 2025.</strong> En una excursió de l’associació des de Benifallim i La Torre, l’arqueòloga <strong>Anna Garcia Barrachina</strong> hi va fer una xerrada sobre la història del pou i els antics camins del comerç de la neu.</p>',
  '<h3>El documental</h3>',
  `<div data-sdp-youtube="${NOVES_TECNOLOGIES_VIDEO.id}" data-titol="${NOVES_TECNOLOGIES_VIDEO.titol}"><a href="https://www.youtube.com/watch?v=${NOVES_TECNOLOGIES_VIDEO.id}" ${FORA}>${NOVES_TECNOLOGIES_VIDEO.titol}</a></div>`,
  '<p>Documental d’<strong>Eugenio Monesma</strong>, amb el títol original en castellà: tracta de l’ofici dels <strong>empouadors</strong> i de les <strong>neveres naturals</strong>. Les dades del Rentonar són les de les <strong>fonts</strong> d’esta publicació, i només este vídeo és seu.</p>',
  '<h3>Les fonts</h3>',
  '<ul>',
  ...NOVES_TECNOLOGIES_FONTS.map(([data, titol, url]) => `<li><strong>${data}</strong> · ${enllac(url, titol)}</li>`),
  '<li><strong>Josep Mª Segura Martí (1987)</strong> · «Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, núm. 7 i 8 (Alcoi): les mides, la planta, les seccions A-B i C-D i els documents de 1724 a 1880, tal com els reproduïx l’entrada del 17-04-2020.</li>',
  '<li><strong>Josep Mª Segura Martí (1985)</strong> · «La industria de la nieve en las montañas alicantinas», <em>Narria</em>: l’ofici dels nevaters i el desguàs d’este pou.</li>',
  '<li><strong>Bibliografia no consultada</strong> · Jorge Cruz Orozco i Josep Mª Segura Martí, <em>El comercio de la nieve. La red de pozos de nieve en las tierras valencianas</em> (1996). El títol és el de la biblioteca de Sóc de Poble: no n’hem tret cap xifra.</li>',
  '<li><strong>Esbós divulgatiu</strong> · «Pozo de nieve “EL RENTONAR”», de l’arxiu <strong>Gràfics de Poble</strong>: en prenem la idea pedagògica, no les xifres, perquè no té autor ni escala.</li>',
  '</ul>',
  '<p>Les <strong>nou estructures</strong> de l’enginyeria rural, desmuntades peça a peça, són a l’<a href="/page/anatomia-rural"><strong>Anatomia rural</strong></a>.</p>'
].join('\n');

/** La primera publicació del Mur. Signa l'entitat Sóc de Poble (com el
 *  Manifest); la data de prova del Mur (datesDeProvaMur.js) la posa dalt de
 *  tot en mode seed, i en remot mana la seua data real. */
export const NOVES_TECNOLOGIES_CULTURA_RURAL_POST = {
  id: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  slug: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  type: 'post',
  title: 'Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de Neu del Rentonar',
  post_subtitle: 'Un esquema generat amb codi, capa a capa, amb la font de cada xifra',
  description: 'El Pou de Neu del Rentonar, a La Torre de les Maçanes, explicat pas a pas',
  entradilla: 'Entrem al Pou de Neu del Rentonar, el tallem per la meitat i el desmuntem peça a peça: la cúpula, les finestres, els estreps, el pou, el túnel i la galeria de desguàs. Un sol visor generat amb codi, sense cap fotografia, amb les mides de l’arqueòleg Josep Mª Segura Martí: cada xifra porta la seua font, i es diu quan les fonts no coincidixen.',
  image_url: '/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp',
  image_alt: "Il·lustració didàctica de còmic d'estil Ibáñez del Pou de la Neu del Rentonar, l'almàssera i el forn de calç a La Torre de les Maçanes",
  content: NOVES_TECNOLOGIES_CULTURA_RURAL_HTML,
  /* Sense publish_date (la data triada al calendari, que manaria sobre la de
     prova del Mur en mode seed): la data és la de creació. */
  created_at: '2026-11-06T14:29:00+01:00',
  important: true,
  author_entity_id: 'socdepoble',
  author: 'Sóc de Poble',
  author_name: 'Sóc de Poble',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_location: 'La Torre de les Maçanes',
  town: 'La Torre de les Maçanes',
  town_name: 'La Torre de les Maçanes',
  poble_id: 'la-torre-de-les-macanes',
  categoria_tematica_id: 'natura-excursions',
  category: '🌿 Natura i Patrimoni',
  tags: ['Patrimoni', 'Pou de neu', 'Pedra Seca'],
  labels: [
    { text: '🌿 Natura i Patrimoni', className: 'sdp-badge-category' },
    { text: 'Patrimoni', className: 'sdp-badge-tag' },
    { text: 'Pou de neu', className: 'sdp-badge-tag' },
    { text: 'Pedra Seca', className: 'sdp-badge-tag' }
  ],
  copyright: 'Text i esquema: Sóc de Poble · Dades: les fonts citades a la publicació'
};
