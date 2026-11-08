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

   P0-47 / IDEA-178 (decisió del Mestre amb MarIA, 07-11-2026) · L'objectiu
   real de la publicació (documentació + tecnologia 3D lliure; el pou, primer
   cas d'estudi), «Què era un pou de neu i per a què servia» i els DOS
   documentals d'Eugenio Monesma. Cada fet nou ix d'una obra que és al disc,
   _cultura_de_poble/grafics_etnografics_de_poble/pou-de-neu/ (text extret amb
   PDFKit; pàgina = foli imprés):
    · Segura Martí 1985 (Industria-nieve-montanas-alicantinas-Segura-Marti-1985.pdf,
      Narria 37-38, p. 2-11): p. 2, rebaixar febres i inflamacions, tallar
      hemorràgies, refrescar begudes, gelats, Ibi i Xixona (finals del s. XIX),
      el consum des del s. XVI i «más de cuatro siglos»; p. 4, el quadre de 76
      dipòsits; p. 9, les fàbriques de gel, la indústria frigorífica cap a
      1920-30 i Alcoleja (sorbets i gelats, anys quaranta); p. 10, orxaters i
      gelaters del s. XIX.
    · Cruz Orozco 2004 (EL_PATRIMONIO_DEL_COMERCIO_VALENCIANO_DE.pdf: «El
      patrimonio del comercio valenciano del frío», Saitabi 54, p. 201-221):
      p. 201-202, Franco (1569) i la conservació i el transport d'aliments;
      p. 203, Almenara (1682), «per les febres que maten»; p. 207, la Nevada
      Grossa de 1926; p. 208, uns 320 dipòsits i la «cava» de Mariola; p. 216,
      les fitxes de Franco (1569) i de Cruz i Segura (1996). Les fonts en
      castellà diuen «Francisco Franco»; l'obra de Franco i el llibre de 1996
      no són al disc: «no consultada».
    · Bejerano Cerdán et al. (Pozos-de-nieve-en-la-provincia-de-Castellón.pdf,
      treball de curs 2018-2019; la portada no nomena cap universitat):
      p. 14, el peix del Camí del Peix; p. 19, la neu per als malalts (1637);
      p. 21, la carn, el peix i els gelats.
    · Els dos vídeos: id, títol i canal tal com els dona l'oEmbed de YouTube
      (consultat el 07-11-2026; «Eugenio Monesma - Documentales»).

   Data (P0-49 / IDEA-180, ordre del Mestre del 07-11-2026): la de hui, a les
   21:20 (CET), l'hora del commit que va demanar el Mestre (P0-49). És la
   mateixa que la d'«Anatomia rural» (PAGE_COPY['anatomia-rural'].date): en un
   empat, el Mur posa l'article primer (MurSection: les publicacions van abans
   que les pàgines, i l'ordenació és estable). Abans,
   el 06-11-2026 a les 14:29, quan naixia este fitxer (R9V-C2-06). */

export const NOVES_TECNOLOGIES_CULTURA_RURAL_ID = 'noves-tecnologies-aplicades-a-la-cultura-rural';

/** Els dos documentals d'Eugenio Monesma sobre els pous de neu (P0-47 / IDEA-178).
 *  El primer és el del visor d'anatomia (anatomiaRural.js, estructura POU); el
 *  segon, el que el Mestre hi afig. Id, títol i canal, els de l'oEmbed de YouTube.
 *  Van al cos com a marcador inert (`div[data-sdp-youtube]` amb l'enllaç de
 *  reserva): VideoEditorial hi posa la façana de clic i l'iframe sense galetes. */
export const NOVES_TECNOLOGIES_VIDEO = Object.freeze({
  id: '3RQv3xjVr-M',
  titol: 'Los EMPOZADORES y las NEVERAS naturales de HIELO. Conservación ancestral de la NIEVE para el verano'
});

export const NOVES_TECNOLOGIES_VIDEO_CONSTRUCCIO = Object.freeze({
  id: 'A3Vgk0rStvU',
  titol: 'POZOS DE NIEVE: construyendo una NEVERA GIGANTE para conservar HIELO EN VERANO (¡SIN electricidad!)'
});

export const NOVES_TECNOLOGIES_VIDEOS = Object.freeze([
  NOVES_TECNOLOGIES_VIDEO,
  NOVES_TECNOLOGIES_VIDEO_CONSTRUCCIO
]);

const FORA = 'target="_blank" rel="noopener noreferrer"';
const enllac = (href, text) => `<a href="${href}" ${FORA}><strong>${text}</strong></a>`;
const aYouTube = ({ id }) => `https://www.youtube.com/watch?v=${id}`;
/* La forma que desa el node TipTap (richText/extensions/videoEditorial.js): fora de l'App, un enllaç. */
const marcadorDeVideo = (video) => `<div data-sdp-youtube="${video.id}" data-titol="${video.titol}"><a href="${aYouTube(video)}" ${FORA}>${video.titol}</a></div>`;

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
  '<p>Les <strong>noves tecnologies</strong> també servixen per a entendre el <strong>patrimoni rural</strong>. Esta publicació vol mostrar què passa quan ajuntem una <strong>bona documentació</strong> (l’arqueologia, els arxius i la memòria de l’associació) amb <strong>tecnologia 3D lliure</strong>, per a ensenyar el nostre patrimoni d’una <strong>manera distinta</strong>. Damunt d’este text, un <strong>sol visor</strong> generat amb codi, sense cap fotografia, mostra el <strong>Pou de Neu del Rentonar</strong>, a <strong>La Torre de les Maçanes</strong>, de tres maneres: <strong>«Dins del pou»</strong>, per a recórrer-lo per dins; <strong>«Tall seccional»</strong>, per a veure’l tallat per la meitat des de fora; i <strong>«Desmuntar en 3D»</strong>, per a separar-ne les peces una a una. Si el navegador no té WebGL2, només hi ha el desmuntatge. Cada xifra porta la seua <strong>font</strong>, i quan dues fonts <strong>no coincidixen</strong>, ho diem.</p>',
  '<p>El visor funciona dins del navegador amb un <strong>motor propi</strong>, de <strong>codi lliure</strong> (llicència AGPL), com la resta del codi de <strong>Sóc de Poble</strong>. El <strong>Pou de Neu del Rentonar</strong> n’és el <strong>primer cas d’estudi</strong>: és el que volem fer també amb la resta d’<strong>artefactes agrícoles</strong> i d’enginyeria tradicional dels nostres pobles (almàsseres, molins fariners, forns de calç, carboneres, cups, sénies i carros) quan en tinguem la <strong>documentació</strong>.</p>',
  '<p><strong>Nota sobre els models:</strong> les mides del visor són les de l’arqueòleg <strong>Josep Mª Segura Martí</strong> (1987). El que cap font no dona (el gruix de la volta, la secció dels arcs, el nombre de graons, la teulada de la primera coberta i el terreny) és <strong>reconstrucció</strong>, i el visor ho diu; les temperatures, la massa i el cabal són estimacions del model, no mesures del monument. Encara estem <strong>provant maneres de fer</strong> les coses dins de <strong>Sóc de Poble</strong>.</p>',
  '<h3>Què era un pou de neu i per a què servia</h3>',
  '<p>Abans de les <strong>fàbriques de gel</strong>, els <strong>pous de neu</strong> (que també es diuen <strong>neveres</strong> i, a la serra de Mariola i els voltants, <strong>caves</strong>) eren dipòsits de pedra on es guardava la <strong>neu de l’hivern</strong> per a vendre-la a l’<strong>estiu</strong>. Segons <strong>Segura Martí</strong> (1985), el consum de neu es fa popular a partir del <strong>segle XVI</strong>, i durant més de <strong>quatre segles</strong> una xarxa comercial (la recollida, el transport i la venda) va abastir de neu pobles i ciutats. Les primeres fàbriques de gel, entre finals del segle XIX i principis del XX, i la indústria frigorífica, ja consolidada cap a <strong>1920-1930</strong>, en van dur l’abandó. <strong>Cruz Orozco</strong> (2004) en dona una data simbòlica: la <strong>Nevada Grossa de 1926</strong>, l’última que es va empouar de manera generalitzada a les comarques del sud valencià.</p>',
  '<p><strong>Per a la salut.</strong> La medicina del Renaixement va recuperar amb força els usos mèdics del fred, i la primera monografia europea sobre el tema, diu <strong>Cruz Orozco</strong>, és d’un metge de Xàtiva, <strong>Francesc Franco</strong>: el <em>Tractado de la nieve y del uso della</em>, publicat el <strong>1569</strong>. Amb la neu es <strong>rebaixaven febres i inflamacions</strong> i es <strong>tallaven hemorràgies</strong> (Segura Martí, 1985). Els pobles també la volien per a la salut de tots: el <strong>1682</strong>, a Almenara, se’n volia tindre prou «per les febres que maten» (Cruz Orozco, 2004), i un contracte d’arrendament de <strong>1637</strong>, que recull l’estudi de les neveres de Castelló, obligava l’arrendatari a servir neu a qui en demanara per als <strong>malalts</strong>, «així de dia com de nit».</p>',
  '<p><strong>Per als aliments.</strong> La neu servia per a <strong>conservar i transportar aliments</strong> (Cruz Orozco, 2004), com la <strong>carn</strong> i el <strong>peix</strong>, i per a <strong>refrescar les begudes</strong>. L’estudi de Castelló conta, per exemple, que les neveres de la Tinença de Benifassà eren importants per al peix que anava del port de Vinaròs a Saragossa pel <strong>Camí del Peix</strong>: per a conservar-lo, sobretot a l’estiu, calia neu.</p>',
  '<p><strong>Per a refrescar-se: orxates i gelats.</strong> Al <strong>segle XIX</strong>, amb més consum de neu, apareixen els <strong>orxaters</strong> i els <strong>gelaters</strong>, que s’establien a les ciutats o venien d’un lloc a l’altre (Segura Martí, 1985). Segons Segura, l’especialització d’<strong>Ibi</strong> i de <strong>Xixona</strong> en la fabricació i la venda de <strong>gelats</strong> arrenca de finals del segle XIX, lligada directament a l’antic ofici dels <strong>nevaters</strong>. I encara als anys quaranta del segle XX, a <strong>Alcoleja</strong>, als peus d’Aitana, s’omplia un clot de neu, i a l’estiu, al bar del mateix poble, la neu servia per a fer <strong>sorbets i gelats</strong>.</p>',
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
  '<h3>Els documentals</h3>',
  ...NOVES_TECNOLOGIES_VIDEOS.map(marcadorDeVideo),
  `<p>Els dos documentals són d’<strong>Eugenio Monesma</strong> i porten el títol original en castellà, tal com el dona YouTube: el primer tracta de l’ofici dels <strong>empouadors</strong> i de les <strong>neveres naturals</strong>; el segon, com diu el títol, de la construcció d’un gran <strong>pou de neu</strong> per a conservar el gel fins a l’estiu, sense electricitat. Dels seus documentals, ací només hi ha els vídeos: les dades del Rentonar són les de les <strong>fonts</strong> d’esta publicació. Si els preferiu obrir directament a YouTube: ${enllac(aYouTube(NOVES_TECNOLOGIES_VIDEO), 'el primer')} i ${enllac(aYouTube(NOVES_TECNOLOGIES_VIDEO_CONSTRUCCIO), 'el segon')}.</p>`,
  '<h3>Les fonts</h3>',
  '<ul>',
  ...NOVES_TECNOLOGIES_FONTS.map(([data, titol, url]) => `<li><strong>${data}</strong> · ${enllac(url, titol)}</li>`),
  '<li><strong>Josep Mª Segura Martí (1987)</strong> · «Els pous i l’antic comerç de la neu a Xixona», <em>Eines</em>, núm. 7 i 8 (Alcoi): les mides, la planta, les seccions A-B i C-D i els documents de 1724 a 1880, tal com els reproduïx l’entrada del 17-04-2020.</li>',
  '<li><strong>Josep Mª Segura Martí (1985)</strong> · «La industria de la nieve en las montañas alicantinas», <em>Narria. Estudios de artes y costumbres populares</em>, núm. 37-38, p. 2-11: l’ofici dels nevaters, el desguàs d’este pou, el quadre per altituds de 76 neveres i pous de la província d’Alacant i de les serres que limiten amb la de València, i els usos de la neu (febres, hemorràgies, begudes i gelats).</li>',
  '<li><strong>Jorge Cruz Orozco (2004)</strong> · «El patrimonio del comercio valenciano del frío», <em>Saitabi</em>, núm. 54, p. 201-221 (Museu Valencià d’Etnologia): els usos mèdics i alimentaris del fred, l’obra de Francesc Franco (1569), la Nevada Grossa de 1926 i els uns 320 dipòsits valencians que es coneixen.</li>',
  '<li><strong>Treball de curs</strong> · Nieves Bejerano Cerdán, Teresa Butil Centelles, Purificación Galindo Herrero, Vicente Pascual Gómez Juan i Rosa Prats Batiste, «Pozos de nieve en la provincia de Castellón. Comercio de la nieve» (assignatura Participación Cultural Activa, curs 2018-2019): la carn i el peix, el Camí del Peix i la neu per als malalts (1637).</li>',
  '<li><strong>Bibliografia no consultada</strong> · Jorge Cruz Orozco i Josep Mª Segura Martí, <em>El comercio de la nieve. La red de pozos de nieve en las tierras valencianas</em> (1996). El títol és el de la bibliografia de Cruz Orozco (2004): no n’hem tret cap xifra.</li>',
  '<li><strong>Bibliografia no consultada</strong> · Francesc Franco, <em>Tractado de la nieve y del uso della</em> (Sevilla, 1569). El coneixem per Cruz Orozco (2004) i pel treball de Castelló.</li>',
  '<li><strong>Esbós divulgatiu</strong> · «Pozo de nieve “EL RENTONAR”», de l’arxiu <strong>Gràfics de Poble</strong>: en prenem la idea pedagògica, no les xifres, perquè no té autor ni escala.</li>',
  '</ul>',
  '<p>El mateix visor del pou és a l’<a href="/page/anatomia-rural"><strong>Anatomia rural</strong></a>, la pàgina on aniran arribant els altres <strong>artefactes agrícoles</strong> quan en tinguem la documentació.</p>'
].join('\n');

/** La primera publicació del Mur. Signa l'entitat Sóc de Poble (com el
 *  Manifest); la data de prova del Mur (datesDeProvaMur.js) la posa dalt de
 *  tot en mode seed, i en remot mana la seua data real. */
export const NOVES_TECNOLOGIES_CULTURA_RURAL_POST = {
  id: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  slug: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  type: 'post',
  title: 'Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de Neu del Rentonar',
  /* P0-47 / IDEA-178 (verificador de contingut R11b, VC-02) · La targeta del Mur
     diu l'objectiu real de la publicació, com el cos: documentació + 3D lliure,
     el pou com a primer cas d'estudi, per a què servia la neu i els dos documentals. */
  post_subtitle: 'Bona documentació i tecnologia 3D lliure: el primer cas d’estudi, amb la font de cada xifra',
  description: 'El Pou de Neu del Rentonar, a La Torre de les Maçanes, explicat pas a pas',
  entradilla: 'Què passa quan ajuntem una bona documentació amb tecnologia 3D lliure? El Pou de Neu del Rentonar, a La Torre de les Maçanes, n’és el primer cas d’estudi: hi entrem, el tallem per la meitat i el desmuntem peça a peça, amb les mides de l’arqueòleg Josep Mª Segura Martí. Contem també per a què servia la neu a l’estiu, amb els dos documentals d’Eugenio Monesma. Cada xifra porta la seua font.',
  image_url: '/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp',
  image_alt: "Il·lustració didàctica de còmic d'estil Ibáñez del Pou de la Neu del Rentonar, l'almàssera i el forn de calç a La Torre de les Maçanes",
  content: NOVES_TECNOLOGIES_CULTURA_RURAL_HTML,
  /* Sense publish_date (la data triada al calendari, que manaria sobre la de
     prova del Mur en mode seed): la data és la de creació. */
  /* P0-49 / IDEA-180 · La data i l'hora de la versió nova (07-11-2026, 21:20 CET, hora del commit). */
  created_at: '2026-11-07T21:20:00+01:00',
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
