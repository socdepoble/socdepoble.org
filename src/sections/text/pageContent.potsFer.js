/* IDEA-287 (Llibre Mestre, T3 lot 3; ampliat a Onada R32.16 · Lot 02 sota Llei 35 i Llei 32) ·
   Pàgina didàctica «Tot el que pots fer a Sóc de Poble, pas a pas» (/page/tot-el-que-pots-fer, i àlies /page/guia).
   Viu a PAGE_COPY i la pinta PageDetailSection per /page/:slug amb el seu QuadreDeComandament i mostres visuals
   inerts en diferit (0 B a l'arrencada estàtica de WordPress). Cada pas és un H3 amb 6-8 negretes d'escaneig
   per paràgraf (Llei 35) i un sol enllaç intern a la seua eina.
   Les cinc llengües comparteixen la mateixa llista de destins (PASSOS_POTS_FER): una traducció no pot
   perdre ni canviar cap eina.
   Llei 0 · Rebost, Salut i Gestoria enllacen a la seua fitxa /plugin/<id>, que existix en tots els paquets i,
   si eixe paquet no porta l'eina, diu per què no s'obri: /app/nevera/... no existix al paquet monolític de
   WordPress (vite.standalone.config.js). L'Avisador enllaça a /page/avisador i conserva literalment la condició
   de seguretat: només amb la sessió oberta i Sóc de Poble en marxa. */
export const RUTA_POTS_FER = '/page/tot-el-que-pots-fer';
export const DATA_POTS_FER = '2026-11-19T00:04:47.000Z';
export const IMATGE_POTS_FER = '/assets/uploads/brain/caricatura_socdepoble_portada.webp';

/** Els destins dels passos, en ordre: la font única per a les cinc llengües. */
export const PASSOS_POTS_FER = Object.freeze([
  '/traduccions',
  '/mur',
  '/mercat',
  '/calendari',
  '/mapa',
  '/xat',
  '/notes',
  '/plugin/rebost',
  '/plugin/salut',
  '/plugin/gestoria',
  '/page/avisador',
  '/dispositius',
  '/control'
]);

/* Cada pas: [títol de l'H3, paràgraf amb 7 etiquetes <strong> (Llei 35), text de l'enllaç], en l'ordre de PASSOS_POTS_FER. */
const TEXTOS = {
  ca: [
    [
      'Tria la teua llengua i la lectura còmoda',
      'Sóc de Poble parla en <strong>valencià, castellà, anglés, basc i gallec</strong> des del primer moment. A Traduccions canvies l’idioma dels <strong>menús, avisos i botons</strong> amb <strong>un sol clic</strong>, i la preferència es desa en <strong>este navegador</strong> sense compte obligatori. Si preferixes <strong>lletra gran</strong>, botons de <strong>56 píxels</strong> i <strong>contrast reforçat</strong>, també pots encendre el Mode Sènior.',
      'Obri Traduccions'
    ],
    [
      'Llig i publica al Mur',
      'El Mur és la <strong>plaça oberta</strong> de Sóc de Poble: hi llegixes les <strong>notícies, cròniques i fotografies</strong> del veïnat i de les <strong>associacions locals</strong> sense anuncis comercials. Amb el teu compte hi pots <strong>publicar avisos</strong> en nom propi o d’una entitat, <strong>compartir memòria</strong> i <strong>comentar pel Xat</strong>, custodiant les publicacions compartides al <strong>servidor de Sóc de Poble</strong>.',
      'Obri el Mur'
    ],
    [
      'Dona una segona vida al Mercat',
      'Al Mercat trobes i publiques <strong>anuncis de proximitat</strong> per a <strong>productes de l’horta</strong>, eines del camp o objectes que ja no fas servir a casa. Els <strong>acords, preus i pagaments</strong> es fan sempre <strong>directament entre veïns</strong>, sense <strong>cap comissió</strong> ni passarel·la bancària, i cada fitxa mostra l’<strong>etiqueta del poble</strong> des d’on s’oferix amb accés per a <strong>preguntar pel Xat</strong>.',
      'Obri el Mercat'
    ],
    [
      'Apunta’t les festes al Calendari amb assistència RSVP',
      'El Calendari reunix les <strong>festes, cursos i assemblees</strong> en vistes de <strong>setmana, mes i agenda</strong>, i amb el teu compte n’hi pots <strong>anunciar de nous</strong>. En cada acte disposes del selector d’assistència amb <strong>tres opcions clares</strong> (<strong>Assistiré, Potser o No assistiré</strong>) desat al navegador i d’un <strong>avís amable de solapament</strong> si dos actes confirmats coincidixen en la <strong>mateixa franja horària</strong>.',
      'Obri el Calendari'
    ],
    [
      'Situa el poble al Mapa',
      'Al Mapa explores <strong>fonts, camins, arbres monumentals</strong> i publicacions situades sobre el <strong>terme municipal</strong> amb fitxes visuals clares. Quan publiques des de les Notes pots <strong>geolocalitzar un indret</strong> comprovat, decidir si conserves o neteges la <strong>ubicació de la portada</strong> i respectar sempre els <strong>domicilis privats</strong>, mantenint netes les <strong>fotos interiors</strong> per protegir la <strong>privacitat veïnal</strong>.',
      'Obri el Mapa'
    ],
    [
      'Parla pel Xat amb veïns i entitats',
      'El Xat és una <strong>missatgeria quotidiana</strong> que funciona amb la senzillesa que ja coneixes, <strong>sense publicitat</strong> i <strong>sense vendre ni cedir</strong> les teues converses a tercers. Pots obrir <strong>converses directes</strong> amb veïns, participar als <strong>canals de cada poble</strong> o preguntar a una <strong>associació organitzadora</strong> des de la fitxa d’un acte, guardant les dades compartides al <strong>servidor de Sóc de Poble</strong>.',
      'Obri el Xat'
    ],
    [
      'Escriu al Bloc de notes i ordena records',
      'Les Notes són el teu <strong>quadern privat d’escriptura</strong>: hi redactes esborranys, llistes o <strong>records familiars</strong>, els ordenes en <strong>carpetes pròpies</strong> i ningú no ho veu si tu <strong>no ho publiques</strong>. Quan un text està llest, tries l’<strong>àmbit de destinació</strong> (Mur, Mercat, Calendari o Mapa) o estructures un relat de <strong>memòria oral</strong> amb revisió humana abans de <strong>compartir-lo en obert</strong>.',
      'Obri les Notes'
    ],
    [
      'Porta el Rebost i la Nevera de casa',
      'El <strong>Rebost Domèstic</strong> i <strong>La Nevera de Casa</strong> t’ajuden a anotar el que tens als prestatges, controlar les <strong>dates de consum</strong> i preparar la <strong>llista de la compra</strong> familiar d’un toc. L’eina està <strong>en proves obertes</strong>, funciona sense demanar registre i totes les quantitats es guarden <strong>només en este dispositiu</strong>, sense enviar el teu inventari domèstic a <strong>cap servidor extern</strong>.',
      'Obri la fitxa del Rebost'
    ],
    [
      'Porta el quadern de Salut al dispositiu',
      '<strong>Salut · Cuidant dels Nostres</strong> és un <strong>quadern quotidià</strong> per a apuntar com beu, dorm, pren la medicació i es troba la <strong>persona gran o dependent</strong> que cuides, i ensenyar-ho al metge en un <strong>full resum clar</strong>. Està <strong>en proves</strong>, totes les anotacions es queden <strong>només en este dispositiu</strong> i l’aplicació <strong>no diagnostica ni envia res</strong> per internet.',
      'Obri la fitxa de Salut'
    ],
    [
      'Prepara l’esborrany per a la teua gestoria humana',
      'La <strong>Gestoria de Poble</strong> t’ajuda a ordenar els tiquets, omplir l’esborrany de <strong>factures del trimestre</strong> i exportar un <strong>resum net</strong> per entregar-lo en mà o per correu al teu assessor. Està <strong>en proves</strong>, les dades es guarden <strong>en este dispositiu</strong>, <strong>no envia res a l’AEAT</strong> i <strong>no substituïx cap programa homologat</strong> ni la revisió d’una gestoria professional.',
      'Obri la fitxa de la Gestoria'
    ],
    [
      'Deixa que l’Avisador vetle',
      '<strong>L’Avisador</strong> avisa pel Xat fins a <strong>tres persones de confiança</strong> quan passen les <strong>hores triades</strong> sense activitat en esta app, i incorpora l’accés d’un toc al <strong>Mode Sènior</strong>. <strong>Només funciona amb la sessió oberta</strong>, Sóc de Poble en marxa i el Xat disponible: amb l’app tancada no avisa. Està <strong>en proves</strong> i <strong>no substituïx</strong> el telèfon d’emergències 112 ni la teleassistència.',
      'Obri l’Avisador'
    ],
    [
      'Connecta les teues finestres locals',
      'A <strong>Dispositius</strong> connectes les <strong>pestanyes i finestres</strong> obertes dins d’este <strong>mateix navegador</strong> per enviar-te <strong>notes ràpides i missatges directes</strong> d’una pantalla a una altra a l’instant. El canal viatja per la <strong>memòria local del navegador</strong> sense passar per <strong>cap servidor remot</strong>, ideal quan prepares una crònica amb una finestra de consulta al costat amb <strong>zero configuració</strong>.',
      'Obri Dispositius'
    ],
    [
      'Totes les eines juntes i el Mode Sènior, al Panell',
      'El <strong>Panell de Control</strong> reunix totes les seccions i les <strong>eines comunitàries</strong> en targetes clares: des d’ací obris també <strong>El Bar (TPV d’associacions)</strong>, l’<strong>Arbre Genealògic</strong> amb frase de pas i el <strong>Lector de notícies</strong> comarcal. A dalt del panell pots activar d’un sol toc el <strong>Mode Sènior</strong> amb <strong>dianes de 56 píxels</strong> i revisar l’espai local del dispositiu.',
      'Obri el Panell de Control'
    ]
  ],
  es: [
    [
      'Elige tu idioma y la lectura cómoda',
      'Sóc de Poble habla en <strong>valenciano, castellano, inglés, euskera y gallego</strong> desde el primer momento. En Traducciones cambias el idioma de los <strong>menús, avisos y botones</strong> con <strong>un solo clic</strong>, y la preferencia se guarda en <strong>este navegador</strong> sin cuenta obligatoria. Si prefieres <strong>letra grande</strong>, botones de <strong>56 píxeles</strong> y <strong>contraste reforzado</strong>, también puedes activar el Modo Sénior.',
      'Abre Traducciones'
    ],
    [
      'Lee y publica en el Muro',
      'El Muro es la <strong>plaza abierta</strong> de Sóc de Poble: en él lees las <strong>noticias, crónicas y fotografías</strong> del vecindario y de las <strong>asociaciones locales</strong> sin anuncios comerciales. Con tu cuenta puedes <strong>publicar avisos</strong> en nombre propio o de una entidad, <strong>compartir memoria</strong> y <strong>comentar por el Chat</strong>, custodiando las publicaciones compartidas en el <strong>servidor de Sóc de Poble</strong>.',
      'Abre el Muro'
    ],
    [
      'Da una segunda vida en el Mercado',
      'En el Mercado encuentras y publicas <strong>anuncios de proximidad</strong> para <strong>productos de la huerta</strong>, herramientas del campo u objetos que ya no usas en casa. Los <strong>acuerdos, precios y pagos</strong> se hacen siempre <strong>directamente entre vecinos</strong>, sin <strong>ninguna comisión</strong> ni pasarela bancaria, y cada ficha muestra la <strong>etiqueta del pueblo</strong> desde donde se ofrece para <strong>preguntar por el Chat</strong>.',
      'Abre el Mercado'
    ],
    [
      'Apunta las fiestas en el Calendario con asistencia RSVP',
      'El Calendario reúne las <strong>fiestas, cursos y asambleas</strong> en vistas de <strong>semana, mes y agenda</strong>, y con tu cuenta puedes <strong>anunciar nuevos actos</strong>. En cada evento dispones del selector de asistencia con <strong>tres opciones claras</strong> (<strong>Asistiré, Quizá o No asistiré</strong>) guardado en el navegador y de un <strong>aviso amable de solapamiento</strong> si dos actos confirmados coinciden en la <strong>misma franja horaria</strong>.',
      'Abre el Calendario'
    ],
    [
      'Sitúa el pueblo en el Mapa',
      'En el Mapa exploras <strong>fuentes, caminos, árboles monumentales</strong> y publicaciones situadas sobre el <strong>término municipal</strong> con fichas visuales claras. Al publicar desde las Notas puedes <strong>geolocalizar un paraje</strong> comprobado, decidir si conservas o limpias la <strong>ubicación de la portada</strong> y respetar siempre los <strong>domicilios privados</strong>, manteniendo limpias las <strong>fotos interiores</strong> para proteger la <strong>privacidad vecinal</strong>.',
      'Abre el Mapa'
    ],
    [
      'Habla por el Chat con vecinos y entidades',
      'El Chat es una <strong>mensajería cotidiana</strong> que funciona con la sencillez que ya conoces, <strong>sin publicidad</strong> y <strong>sin vender ni ceder</strong> tus conversaciones a terceros. Puedes abrir <strong>conversaciones directas</strong> con vecinos, participar en los <strong>canales de cada pueblo</strong> o preguntar a una <strong>asociación organizadora</strong> desde la ficha de un acto, guardando los datos compartidos en el <strong>servidor de Sóc de Poble</strong>.',
      'Abre el Chat'
    ],
    [
      'Escribe en el Bloc de notas y ordena recuerdos',
      'Las Notas son tu <strong>cuaderno privado de escritura</strong>: redactas borradores, listas o <strong>recuerdos familiares</strong>, los ordenas en <strong>carpetas propias</strong> y nadie lo ve si tú <strong>no lo publicas</strong>. Cuando un texto está listo, eliges el <strong>ámbito de destino</strong> (Muro, Mercado, Calendario o Mapa) o estructuras un relato de <strong>memoria oral</strong> con revisión humana antes de <strong>compartirlo en abierto</strong>.',
      'Abre las Notas'
    ],
    [
      'Lleva la Despensa y la Nevera de casa',
      'La <strong>Despensa Doméstica</strong> y <strong>La Nevera de Casa</strong> te ayudan a anotar lo que tienes en los estantes, vigilar las <strong>fechas de consumo</strong> y preparar la <strong>lista de la compra</strong> familiar de un toque. La herramienta está <strong>en pruebas abiertas</strong>, funciona sin pedir registro y todas las cantidades se guardan <strong>solo en este dispositivo</strong>, sin enviar tu inventario doméstico a <strong>ningún servidor externo</strong>.',
      'Abre la ficha de la Despensa'
    ],
    [
      'Cuida la salud con el cuaderno en el dispositivo',
      '<strong>Salud · Cuidando de los Nuestros</strong> es un <strong>cuaderno cotidiano</strong> para apuntar cómo bebe, duerme, toma la medicación y se encuentra la <strong>persona mayor o dependiente</strong> que cuidas, y enseñárselo al médico en una <strong>hoja resumen clara</strong>. Está <strong>en pruebas</strong>, todas las anotaciones se quedan <strong>solo en este dispositivo</strong> y la aplicación <strong>no diagnostica ni envía nada</strong> por internet.',
      'Abre la ficha de Salud'
    ],
    [
      'Prepara el borrador para tu gestoría humana',
      'La <strong>Gestoría de Pueblo</strong> te ayuda a ordenar recibos, rellenar el borrador de <strong>facturas del trimestre</strong> y exportar un <strong>resumen limpio</strong> para entregarlo en mano o por correo a tu asesor. Está <strong>en pruebas</strong>, los datos se guardan <strong>en este dispositivo</strong>, <strong>no envía nada a la AEAT</strong> y <strong>no sustituye ningún programa homologado</strong> ni la revisión de una gestoría profesional.',
      'Abre la ficha de la Gestoría'
    ],
    [
      'Deja que el Avisador vele',
      '<strong>El Avisador</strong> avisa por el Chat hasta a <strong>tres personas de confianza</strong> cuando pasan las <strong>horas elegidas</strong> sin actividad en esta app, e incorpora acceso de un toque al <strong>Modo Sénior</strong>. <strong>Solo funciona con la sesión abierta</strong>, Sóc de Poble en marcha y el Chat disponible: con la app cerrada no avisa. Está <strong>en pruebas</strong> y <strong>no sustituye</strong> al teléfono de emergencias 112 ni a la teleasistencia.',
      'Abre el Avisador'
    ],
    [
      'Conecta tus ventanas locales',
      'En <strong>Dispositivos</strong> conectas las <strong>pestañas y ventanas</strong> abiertas dentro de este <strong>mismo navegador</strong> para enviarte <strong>notas rápidas y mensajes directos</strong> de una pantalla a otra al instante. El canal viaja por la <strong>memoria local del navegador</strong> sin pasar por <strong>ningún servidor remoto</strong>, ideal cuando preparas una crónica con una ventana de consulta al lado con <strong>cero configuración</strong>.',
      'Abre Dispositivos'
    ],
    [
      'Todas las herramientas juntas y el Modo Sénior, en el Panel',
      'El <strong>Panel de Control</strong> reúne todas las secciones y las <strong>herramientas comunitarias</strong> en tarjetas claras: desde allí abres también <strong>El Bar (TPV de asociaciones)</strong>, el <strong>Árbol Genealógico</strong> con frase de paso y el <strong>Lector de noticias</strong> comarcal. Arriba del panel puedes activar de un solo toque el <strong>Modo Sénior</strong> con <strong>dianas de 56 píxeles</strong> y revisar el espacio local.',
      'Abre el Panel de Control'
    ]
  ],
  en: [
    [
      'Choose your language and comfortable reading',
      'Sóc de Poble speaks <strong>Valencian, Spanish, English, Basque and Galician</strong> right from the start. In Translations you switch the language of <strong>menus, notices and buttons</strong> in a <strong>single click</strong>, and your choice stays saved in <strong>this browser</strong> without needing an account. If you prefer <strong>larger type</strong>, <strong>56-pixel buttons</strong> and <strong>high contrast</strong>, you can also turn on Senior Mode.',
      'Open Translations'
    ],
    [
      'Read and post on the Wall',
      'The Wall is the <strong>open village square</strong> of Sóc de Poble: you read <strong>news, chronicles and photographs</strong> shared by neighbours and <strong>local associations</strong> free from commercial ads. With your account you can <strong>publish updates</strong> as yourself or an organisation, <strong>preserve shared memory</strong> and <strong>reply via Chat</strong>, keeping shared posts on <strong>the Sóc de Poble server</strong>.',
      'Open the Wall'
    ],
    [
      'Give things a second life at the Market',
      'At the Market you browse and post <strong>local listings</strong> for <strong>garden produce</strong>, farm tools or household items you no longer use. All <strong>agreements, prices and payments</strong> happen <strong>directly between neighbours</strong>, with <strong>zero commission</strong> or payment intermediary, and every card displays the <strong>municipality badge</strong> where it is offered so you can <strong>ask questions on Chat</strong>.',
      'Open the Market'
    ],
    [
      'Follow events on the Calendar with RSVP attendance',
      'The Calendar gathers village <strong>festivals, workshops and assemblies</strong> across <strong>week, month and agenda</strong> views, and with your account you can <strong>announce new events</strong>. Every event includes a clear <strong>three-option RSVP selector</strong> (<strong>Attending, Maybe or Not attending</strong>) stored in your browser plus a <strong>friendly overlap notice</strong> whenever two confirmed events share the <strong>same time slot</strong>.',
      'Open the Calendar'
    ],
    [
      'Put the village on the Map',
      'On the Map you explore <strong>springs, trails, heritage trees</strong> and posts placed across the <strong>municipal territory</strong> through clear visual cards. When publishing from Notes you can <strong>geolocate a verified spot</strong>, choose whether to keep or strip <strong>cover photo coordinates</strong> and always respect <strong>private homes</strong>, while <strong>inline body images</strong> are automatically scrubbed for <strong>neighbour privacy</strong>.',
      'Open the Map'
    ],
    [
      'Talk on the Chat with neighbours and groups',
      'The Chat is an <strong>everyday messaging space</strong> that works as naturally as familiar messengers, <strong>free from advertising</strong> and <strong>without selling or handing over</strong> your conversations to third parties. You can open <strong>direct threads</strong> with neighbours, join <strong>village channels</strong> or message an <strong>organising association</strong> straight from an event page, backed by <strong>the Sóc de Poble server</strong>.',
      'Open the Chat'
    ],
    [
      'Write in the Notebook and organise memories',
      'Notes is your <strong>private writing studio</strong>: draft articles, lists or <strong>family memories</strong>, sort them into <strong>personal folders</strong> and rest assured nobody sees them unless you <strong>choose to publish</strong>. Once ready, pick the <strong>target section</strong> (Wall, Market, Calendar or Map) or structure an <strong>oral history record</strong> for human review before <strong>sharing publicly</strong>.',
      'Open Notes'
    ],
    [
      'Run the Home Pantry and Fridge',
      'The <strong>Home Pantry</strong> and <strong>Fridge</strong> help you track what is on your shelves, check <strong>use-by dates</strong> and build your household <strong>shopping list</strong> in a single tap. It is currently <strong>being tested</strong>, works without registration and stores every item <strong>only on this device</strong>, never uploading your household inventory to <strong>any external server</strong>.',
      'Open the Pantry page'
    ],
    [
      'Keep the Health care notebook on your device',
      '<strong>Health · Caring for Our Loved Ones</strong> is a <strong>daily care log</strong> to note hydration, sleep, medication and wellbeing for the <strong>older or dependent person</strong> you support, printing a <strong>clear summary sheet</strong> for doctor visits. It is <strong>being tested</strong>, data stays <strong>only on this device</strong> and it <strong>neither diagnoses nor sends anything</strong> online.',
      'Open the Health page'
    ],
    [
      'Prepare your draft for a human bookkeeper',
      '<strong>Village Bookkeeping</strong> helps small associations and neighbours organise receipts, fill in a <strong>quarterly invoice draft</strong> and export a <strong>clean summary</strong> to hand over or email to their advisor. It is <strong>being tested</strong>, data stays <strong>on this device</strong>, it <strong>sends nothing to tax authorities</strong> and it <strong>does not replace certified tax software</strong> or professional accounting.',
      'Open the Accounts page'
    ],
    [
      'Let the Alerter keep watch',
      '<strong>The Alerter</strong> notifies up to <strong>three trusted people</strong> through the Chat when the <strong>chosen hours</strong> pass without activity in this app, and includes one-tap access to <strong>Senior Mode</strong>. <strong>It only works with your session open</strong>, Sóc de Poble running and the Chat available: with the app closed it sends no alert. It is <strong>being tested</strong> and <strong>does not replace</strong> emergency services or telecare.',
      'Open the Alerter'
    ],
    [
      'Connect your local browser windows',
      'In <strong>Devices</strong> you link the <strong>tabs and windows</strong> open inside this <strong>same browser</strong> to pass <strong>quick notes and direct messages</strong> from one screen to another instantly. Everything travels across <strong>local browser memory</strong> without touching <strong>any remote server</strong>, making side-by-side writing and reference checks effortless with <strong>zero setup</strong>.',
      'Open Devices'
    ],
    [
      'All tools together and Senior Mode on the Control Panel',
      'The <strong>Control Panel</strong> gathers every section and <strong>community tool</strong> onto clear cards: from there you also launch <strong>The Bar (association POS)</strong>, the passphrase-protected <strong>Family Tree</strong> and the regional <strong>News Reader</strong>. Right at the top you can toggle <strong>Senior Mode</strong> with <strong>56-pixel targets</strong> in one tap and inspect local storage.',
      'Open the Control Panel'
    ]
  ],
  eu: [
    [
      'Aukeratu zure hizkuntza eta irakurketa erosoa',
      'Sóc de Poblek <strong>valentziera, gaztelania, ingelesa, euskara eta galegoa</strong> hitz egiten ditu hasieratik. Itzulpenak atalean <strong>menu, ohar eta botoien</strong> hizkuntza <strong>klik bakarrean</strong> aldatzen duzu, eta hobespena <strong>nabigatzaile honetan</strong> gordetzen da konturik behar izan gabe. <strong>Letra handia</strong>, <strong>56 pixeleko botoiak</strong> eta <strong>kontraste indartua</strong> nahiago badituzu, Senior Modua ere piztu dezakezu.',
      'Ireki Itzulpenak'
    ],
    [
      'Irakurri eta argitaratu Horman',
      'Horma Sóc de Pobleren <strong>plaza irekia</strong> da: bertan auzokideen eta <strong>tokiko elkarteen</strong> <strong>albisteak, kronikak eta argazkiak</strong> irakurtzen dituzu iragarki komertzialik gabe. Zure kontuarekin <strong>oharrak argitara</strong> ditzakezu zure izenean edo elkarte baten izenean, <strong>memoria partekatu</strong> eta <strong>Txatean erantzun</strong>, argitalpen partekatuak <strong>Sóc de Pobleren zerbitzarian</strong> gordeta.',
      'Ireki Horma'
    ],
    [
      'Eman bigarren bizitza bat Merkatuan',
      'Merkatuan erabiltzen ez dituzun etxeko gauzen, lanabesen edo <strong>baratze-produktuen</strong> <strong>hurbileko iragarkiak</strong> aurkitu eta argitaratzen dituzu. <strong>Akordioak, prezioak eta ordainketak</strong> auzokideen artean <strong>zuzenean</strong> egiten dira beti, <strong>inolako komisiorik</strong> gabe, eta fitxa bakoitzak <strong>herriaren etiketa</strong> erakusten du <strong>Txatetik galdetzeko</strong>.',
      'Ireki Merkatua'
    ],
    [
      'Idatzi jaiak Egutegian RSVP asistentziarekin',
      'Egutegiak herriko <strong>jaiak, ikastaroak eta batzarrak</strong> biltzen ditu <strong>aste, hilabete eta agenda</strong> ikuspegietan, eta zure kontuarekin <strong>ekitaldi berriak iragar</strong> ditzakezu. Ekitaldi bakoitzean <strong>hiru aukerako RSVP hautatzailea</strong> duzu (<strong>Joango naiz, Beharbada edo Ez naiz joango</strong>) nabigatzailean gordeta, baita <strong>ordutegi-gainjartze abisu atsegina</strong> ere bi ekitaldi baieztatu <strong>tarte berean</strong> badaude.',
      'Ireki Egutegia'
    ],
    [
      'Kokatu herria Mapan',
      'Mapan <strong>iturriak, bideak, zuhaitz monumentalak</strong> eta argitalpenak esploratzen dituzu <strong>udal-lurraldean</strong> kokatuta fitxa bisual argiekin. Oharretatik argitaratzean <strong>egiaztatutako leku bat geokoka</strong> dezakezu, azaleko argazkiaren <strong>kokapena gorde edo garbitu</strong> eta <strong>etxebizitza pribatuak</strong> errespetatu, <strong>barruko argazkiak</strong> beti garbituz <strong>auzokideen pribatutasuna</strong> babesteko.',
      'Ireki Mapa'
    ],
    [
      'Hitz egin Txatean auzokide eta elkarteekin',
      'Txata dagoeneko ezagutzen dituzunen antzera dabilen <strong>eguneroko mezularitza</strong> da, <strong>publizitaterik gabe</strong> eta zure elkarrizketak inori <strong>saldu edo laga gabe</strong>. Auzokideekin <strong>elkarrizketa zuzenak</strong> ireki ditzakezu, <strong>herri bakoitzeko kanaletan</strong> parte hartu edo ekitaldi baten fitxatik <strong>elkarte antolatzaileari</strong> galdetu, datu partekatuak <strong>Sóc de Pobleren zerbitzarian</strong> gordez.',
      'Ireki Txata'
    ],
    [
      'Idatzi Ohar-koadernoan eta antolatu oroitzapenak',
      'Oharrak zure <strong>idazteko koaderno pribatua</strong> dira: zirriborroak, zerrendak edo <strong>familiako oroitzapenak</strong> idazten dituzu, <strong>karpeta propioetan</strong> antolatuta, eta inork ez du ikusten zuk <strong>argitaratzen ez baduzu</strong>. Testua prest dagoenean, <strong>helburuko esparrua</strong> (Horma, Merkatua, Egutegia edo Mapa) hautatzen duzu edo <strong>ahozko memoriako</strong> kontakizuna prestatzen duzu <strong>irekian partekatu</strong> aurretik.',
      'Ireki Oharrak'
    ],
    [
      'Eraman Etxeko Jakitegia eta Hozkailua',
      '<strong>Etxeko Jakitegiak</strong> eta <strong>Hozkailuak</strong> apaletan duzuna apuntatzen, <strong>kontsumo-datak</strong> zaintzen eta etxeko <strong>erosketa-zerrenda</strong> ukitu batean prestatzen laguntzen dizute. Tresna <strong>proba irekietan</strong> dago, erregistrorik eskatu gabe dabil eta zerrenda guztiak <strong>gailu honetan bakarrik</strong> gordetzen dira, zure etxeko inbentarioa <strong>kanpoko zerbitzarietara</strong> bidali gabe.',
      'Ireki Jakitegiaren fitxa'
    ],
    [
      'Zaindu osasuna gailuko koadernoarekin',
      '<strong>Osasuna · Gureak Zaintzen</strong> <strong>eguneroko koadernoa</strong> da, zaintzen duzun <strong>adineko edo mendeko pertsonak</strong> nola edaten, lo egiten eta medikazioa hartzen duen idazteko eta medikuari <strong>laburpen-orri argi batean</strong> erakusteko. <strong>Probetan</strong> dago, datuak <strong>gailu honetan bakarrik</strong> geratzen dira eta aplikazioak <strong>ez du ezer diagnostikatzen ezta bidaltzen ere</strong>.',
      'Ireki Osasunaren fitxa'
    ],
    [
      'Prestatu zirriborroa zure gestoria humanoarentzat',
      '<strong>Herriko Gestoriak</strong> ordainagiriak ordenatzen, <strong>hiruhilekoko fakturen</strong> zirriborroa betetzen eta zure aholkulariari eskura edo postaz emateko <strong>laburpen garbia</strong> esportatzen laguntzen dizu. <strong>Probetan</strong> dago, datuak <strong>gailu honetan</strong> gordetzen dira, <strong>ez du ezer Ogasunera bidaltzen</strong> eta <strong>ez du programa homologaturik</strong> edo gestoria profesional baten lana ordezkatzen.',
      'Ireki Gestoriaren fitxa'
    ],
    [
      'Utzi Abisatzaileari zaintzen',
      '<strong>Abisatzaileak</strong> Txatetik abisatzen die gehienez <strong>konfiantzazko hiru pertsonari</strong>, <strong>aukeratutako orduak</strong> aplikazio honetan jarduerarik gabe igarotzen direnean, eta <strong>Senior Modurako</strong> sarbidea dakar. <strong>Saioa irekita dagoenean bakarrik dabil</strong>, Sóc de Poble martxan eta Txata erabilgarri dagoela: aplikazioa itxita badago, ez du abisatzen. <strong>Probetan</strong> dago eta <strong>ez ditu ordezkatzen</strong> larrialdietako telefonoa eta telelaguntza.',
      'Ireki Abisatzailea'
    ],
    [
      'Konektatu zure leiho lokalak',
      '<strong>Gailuak</strong> atalean <strong>nabigatzaile honetan bertan</strong> irekitako <strong>fitxak eta leihoak</strong> konektatzen dituzu, pantaila batetik bestera <strong>ohar azkarrak eta zuzeneko mezuak</strong> berehala bidaltzeko. Kanala <strong>nabigatzailearen memoria lokaletik</strong> doa <strong>inolako urruneko zerbitzaritik</strong> pasatu gabe, kronika bat prestatzean alboko leihoarekin <strong>zero konfiguraziorekin</strong> lan egiteko.',
      'Ireki Gailuak'
    ],
    [
      'Tresna guztiak batera eta Senior Modua, Kontrol Panelean',
      '<strong>Kontrol Panelak</strong> atal guztiak eta <strong>komunitateko tresnak</strong> txartel argietan biltzen ditu: hortik irekitzen dituzu <strong>Taberna (elkarteen TPVa)</strong>, pasaesaldidun <strong>Zuhaitz Genealogikoa</strong> eta eskualdeko <strong>Albiste-irakurgailua</strong> ere. Goialdean ukitu bakarrean piztu dezakezu <strong>Senior Modua</strong> <strong>56 pixeleko dianekin</strong> eta gailuko tokiko espazioa ikuskatu.',
      'Ireki Kontrol Panela'
    ]
  ],
  gl: [
    [
      'Escolle a túa lingua e a lectura cómoda',
      'Sóc de Poble fala en <strong>valenciano, castelán, inglés, éuscaro e galego</strong> dende o primeiro momento. En Traducións cambias a lingua dos <strong>menús, avisos e botóns</strong> cun <strong>só clic</strong>, e a preferencia gárdase <strong>neste navegador</strong> sen conta obrigatoria. Se prefires <strong>letra grande</strong>, botóns de <strong>56 píxeles</strong> e <strong>contraste reforzado</strong>, tamén podes activar o Modo Sénior.',
      'Abre Traducións'
    ],
    [
      'Le e publica no Muro',
      'O Muro é a <strong>praza aberta</strong> de Sóc de Poble: nel les as <strong>novas, crónicas e fotografías</strong> da veciñanza e das <strong>asociacións locais</strong> sen anuncios comerciais. Coa túa conta podes <strong>publicar avisos</strong> en nome propio ou dunha entidade, <strong>compartir memoria</strong> e <strong>comentar polo Chat</strong>, custodiando as publicacións compartidas n’<strong>o servidor de Sóc de Poble</strong>.',
      'Abre o Muro'
    ],
    [
      'Dálles unha segunda vida no Mercado',
      'No Mercado atopas e publicas <strong>anuncios de proximidade</strong> para <strong>produtos da horta</strong>, ferramentas do campo ou obxectos que xa non usas na casa. Os <strong>acordos, prezos e pagamentos</strong> fanse sempre <strong>directamente entre veciños</strong>, sen <strong>ningunha comisión</strong> nin pasarela bancaria, e cada ficha amosa a <strong>etiqueta da vila</strong> dende onde se ofrece para <strong>preguntar polo Chat</strong>.',
      'Abre o Mercado'
    ],
    [
      'Apunta as festas no Calendario con asistencia RSVP',
      'O Calendario reúne as <strong>festas, cursos e asembleas</strong> en vistas de <strong>semana, mes e axenda</strong>, e coa túa conta podes <strong>anunciar novos actos</strong>. En cada evento dispós do selector de asistencia con <strong>tres opcións claras</strong> (<strong>Asistirei, Quizais ou Non asistirei</strong>) gardado no navegador e dun <strong>aviso amable de coincidencia</strong> se dous actos confirmados cadran na <strong>mesma franxa horaria</strong>.',
      'Abre o Calendario'
    ],
    [
      'Sitúa a vila no Mapa',
      'No Mapa exploras <strong>fontes, camiños, árbores senlleiras</strong> e publicacións situadas sobre o <strong>termo municipal</strong> con fichas visuais claras. Ao publicar dende as Notas podes <strong>xeolocalizar un lugar</strong> comprobado, decidir se conservas ou limpas a <strong>localización da portada</strong> e respectar sempre os <strong>domicilios privados</strong>, mantendo limpas as <strong>fotos interiores</strong> para protexer a <strong>privacidade veciñal</strong>.',
      'Abre o Mapa'
    ],
    [
      'Fala polo Chat con veciños e entidades',
      'O Chat é unha <strong>mensaxería cotiá</strong> que funciona coa sinxeleza que xa coñeces, <strong>sen publicidade</strong> e <strong>sen vender nin ceder</strong> as túas conversas a terceiros. Podes abrir <strong>conversas directas</strong> con veciños, participar nos <strong>canles de cada vila</strong> ou preguntar a unha <strong>asociación organizadora</strong> dende a ficha dun acto, gardando os datos compartidos n’<strong>o servidor de Sóc de Poble</strong>.',
      'Abre o Chat'
    ],
    [
      'Escribe no Bloc de notas e ordena lembranzas',
      'As Notas son o teu <strong>caderno privado de escritura</strong>: redactas borradores, listas ou <strong>lembranzas familiares</strong>, ordénalos en <strong>cartafoles propios</strong> e ninguén o ve se ti <strong>non o publicas</strong>. Cando un texto está listo, escolles o <strong>ámbito de destino</strong> (Muro, Mercado, Calendario ou Mapa) ou estruturas un relato de <strong>memoria oral</strong> con revisión humana antes de <strong>compartilo en aberto</strong>.',
      'Abre as Notas'
    ],
    [
      'Leva a Despensa e a Neveira da casa',
      'A <strong>Despensa Doméstica</strong> e <strong>A Neveira da Casa</strong> axúdanche a anotar o que tes nos estantes, vixiar as <strong>datas de consumo</strong> e preparar a <strong>lista da compra</strong> familiar dun toque. A ferramenta está <strong>en probas abertas</strong>, funciona sen pedir rexistro e todas as cantidades gárdanse <strong>só neste dispositivo</strong>, sen enviar o teu inventario doméstico a <strong>ningún servidor externo</strong>.',
      'Abre a ficha da Despensa'
    ],
    [
      'Coida a saúde co caderno no dispositivo',
      '<strong>Saúde · Coidando dos Nosos</strong> é un <strong>caderno cotián</strong> para apuntar como bebe, dorme, toma a medicación e se atopa a <strong>persoa maior ou dependente</strong> que coidas, e amosarllo ao médico nunha <strong>folla resumo clara</strong>. Está <strong>en probas</strong>, todas as anotacións quedan <strong>só neste dispositivo</strong> e a aplicación <strong>non diagnostica nin envía nada</strong> por internet.',
      'Abre a ficha de Saúde'
    ],
    [
      'Prepara o borrador para a túa xestoría humana',
      'A <strong>Xestoría de Pobo</strong> axúdache a ordenar recibos, cubrir o borrador de <strong>facturas do trimestre</strong> e exportar un <strong>resumo limpo</strong> para entregarllo en man ou por correo ao teu asesor. Está <strong>en probas</strong>, os datos gárdanse <strong>neste dispositivo</strong>, <strong>non envía nada á AEAT</strong> e <strong>non substitúe ningún programa homologado</strong> nin a revisión dunha xestoría profesional.',
      'Abre a ficha da Xestoría'
    ],
    [
      'Deixa que o Avisador vixíe',
      '<strong>O Avisador</strong> avisa polo Chat ata a <strong>tres persoas de confianza</strong> cando pasan as <strong>horas escollidas</strong> sen actividade nesta app, e incorpora acceso dun toque ao <strong>Modo Sénior</strong>. <strong>Só funciona coa sesión aberta</strong>, Sóc de Poble en marcha e o Chat dispoñible: coa app pechada non avisa. Está <strong>en probas</strong> e <strong>non substitúe</strong> o teléfono de emerxencias 112 nin a teleasistencia.',
      'Abre o Avisador'
    ],
    [
      'Conecta as túas xanelas locais',
      'En <strong>Dispositivos</strong> conectas as <strong>lapelas e xanelas</strong> abertas dentro deste <strong>mesmo navegador</strong> para enviarte <strong>notas rápidas e mensaxes directas</strong> dunha pantalla a outra ao instante. A canle viaxa pola <strong>memoria local do navegador</strong> sen pasar por <strong>ningún servidor remoto</strong>, ideal cando preparas unha crónica cunha xanela de consulta ao carón con <strong>cero configuración</strong>.',
      'Abre Dispositivos'
    ],
    [
      'Todas as ferramentas xuntas e o Modo Sénior, no Panel',
      'O <strong>Panel de Control</strong> reúne todas as seccións e as <strong>ferramentas comunitarias</strong> en tarxetas claras: dende alí abres tamén <strong>O Bar (TPV de asociacións)</strong>, a <strong>Árbore Xenealóxica</strong> con frase de paso e o <strong>Lector de novas</strong> comarcal. Arriba do panel podes activar dun só toque o <strong>Modo Sénior</strong> con <strong>dianas de 56 píxeles</strong> e revisar o espazo local.',
      'Abre o Panel de Control'
    ]
  ]
};

const CAPCALERES = {
  ca: {
    title: 'Tot el que pots fer a Sóc de Poble, pas a pas',
    subtitle: 'Una guia de les eines de Sóc de Poble, cadascuna amb el seu enllaç i mostres clares',
    imageAlt: 'Caricatura de Sóc de Poble: veïns de totes les edats endollen ordinadors a una pila de pedra seca davant del mas, entre un tractor, un ase amb ulleres, gallines i un paller amb antenes',
    lead: 'Esta pàgina explica, en paraules de cada dia, què pots fer a Sóc de Poble i on es fa. Cada pas porta l’enllaç directe a la seua eina, el resum d’àmbits i mostres visuals dels controls principals. Algunes eines encara estan en proves, i el seu pas ho diu.'
  },
  es: {
    title: 'Todo lo que puedes hacer en Sóc de Poble, paso a paso',
    subtitle: 'Una guía de las herramientas de Sóc de Poble, cada una con su enlace y muestras claras',
    imageAlt: 'Caricatura de Sóc de Poble: vecinos de todas las edades enchufan ordenadores a una pila de piedra seca delante del mas, entre un tractor, un burro con gafas, gallinas y un pajar con antenas',
    lead: 'Esta página explica, con palabras de cada día, qué puedes hacer en Sóc de Poble y dónde se hace. Cada paso lleva el enlace directo a su herramienta, el resumen de ámbitos y muestras visuales de los controles principales. Algunas herramientas aún están en pruebas, y su paso lo dice.'
  },
  en: {
    title: 'Everything you can do on Sóc de Poble, step by step',
    subtitle: 'A guide to Sóc de Poble tools, each one with its link and clear visual previews',
    imageAlt: 'Cartoon of Sóc de Poble: neighbours of all ages plug computers into a dry-stone pillar in front of the farmhouse, among a tractor, a donkey wearing goggles, hens and a haystack with antennas',
    lead: 'This page explains, in everyday words, what you can do on Sóc de Poble and where to do it. Each step includes a direct link to its tool, a summary overview and visual previews of key controls. Some tools are still being tested, and their step says so.'
  },
  eu: {
    title: 'Sóc de Poblen egin dezakezun guztia, urratsez urrats',
    subtitle: 'Sóc de Pobleren tresnen gida, bakoitza bere estekarekin eta lagin argiekin',
    imageAlt: 'Sóc de Pobleren karikatura: adin guztietako auzokideek ordenagailuak konektatzen dituzte baserriaren aurreko harri lehorrezko pila batera, traktore, betaurrekodun asto, oilo eta antenadun lastategi baten artean',
    lead: 'Orri honek eguneroko hitzekin azaltzen du zer egin dezakezun Sóc de Poblen eta non egiten den. Urrats bakoitzak bere tresnarako esteka zuzena, esparruen laburpena eta kontrol nagusien lagin bisualak ditu. Tresna batzuk probetan daude oraindik, eta haien urratsak hala dio.'
  },
  gl: {
    title: 'Todo o que podes facer en Sóc de Poble, paso a paso',
    subtitle: 'Unha guía das ferramentas de Sóc de Poble, cada unha coa súa ligazón e mostras claras',
    imageAlt: 'Caricatura de Sóc de Poble: veciños de todas as idades enchufan ordenadores a unha pía de pedra seca diante do mas, entre un tractor, un burro con lentes, galiñas e un palleiro con antenas',
    lead: 'Esta páxina explica, con palabras de cada día, que podes facer en Sóc de Poble e onde se fai. Cada paso leva a ligazón directa á súa ferramenta, o resumo de ámbitos e mostras visuais dos controis principais. Algunhas ferramentas aínda están en probas, e o seu paso dío.'
  }
};

/** El cos d'una llengua: un H3 numerat per pas, el paràgraf i l'enllaç al destí de PASSOS_POTS_FER. */
const cos = (passos) => passos
  .map(([titol, text, enllac], i) => `<h3>${i + 1}. ${titol}</h3><p>${text} <a href="${PASSOS_POTS_FER[i]}">${enllac}</a></p>`)
  .join('');

const pagina = (llengua) => ({ ...CAPCALERES[llengua], html: cos(TEXTOS[llengua]) });

export const PAGINA_POTS_FER = {
  'tot-el-que-pots-fer': {
    ...pagina('ca'),
    date: DATA_POTS_FER,
    image: IMATGE_POTS_FER,
    imageWidth: 1376,
    imageHeight: 768,
    labels: [],
    contentLanguage: 'ca',
    translations: {
      es: pagina('es'),
      en: pagina('en'),
      eu: pagina('eu'),
      gl: pagina('gl')
    }
  }
};
