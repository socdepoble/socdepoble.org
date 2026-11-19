/* IDEA-287 (Llibre Mestre, T3 lot 3) · Pàgina didàctica «Tot el que pots fer a Sóc de Poble, pas a pas».
   Una pàgina de text com /page/la-iaia-sabuda: viu a PAGE_COPY i la pinta PageDetailSection per /page/:slug,
   sense ruta ni component nous. Cada pas és un H3 amb negretes i un sol enllaç intern a la seua eina.
   Les cinc llengües comparteixen la mateixa llista de destins (PASSOS_POTS_FER): una traducció no pot
   perdre ni canviar cap eina.
   Llei 0 · Rebost, Salut i Gestoria enllacen a la seua fitxa /plugin/<id>, que existix en tots els paquets i,
   si eixe paquet no porta l'eina, diu per què no s'obri: /app/nevera/... no existix al paquet monolític de
   WordPress (vite.standalone.config.js). L'Avisador enllaça a /page/avisador, com demana l'ítem: la ruta i
   la fitxa depenen del mateix VITE_SDP_APP_AVISADOR (App.jsx, registrePlugins.js), que cap paquet no posa a '0'
   per defecte. El seu pas porta la condició de la fitxa: només amb la sessió oberta i Sóc de Poble en marxa.
   Unificar les targetes de publicació del Panell en una sola «Publicar» és una decisió posterior del
   Mestre: esta pàgina no toca el Panell ni el Mur (no és a SYSTEM_PAGES). */
export const RUTA_POTS_FER = '/page/tot-el-que-pots-fer';
export const DATA_POTS_FER = '2026-11-19T00:04:47.000Z';
/* La portada és la caricatura de Sóc de Poble que ja servix l'arbre (agentsSeed.js, censImatges.js) i que cap
   altra pàgina de PAGE_COPY porta: cada pàgina pública té una portada pròpia (P0-117). Una vinyeta dedicada
   és decisió del Mestre (core-identitat-visual). */
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

/* Cada pas: [títol de l'H3, paràgraf amb negretes, text de l'enllaç], en l'ordre de PASSOS_POTS_FER. */
const TEXTOS = {
  ca: [
    ['Tria la teua llengua', 'Sóc de Poble parla en <strong>valencià, castellà, anglés, basc i gallec</strong>. A Traduccions canvies l’idioma dels <strong>menús i els botons</strong>, i la preferència es guarda en este navegador.', 'Obri Traduccions'],
    ['Llig i publica al Mur', 'El Mur és la <strong>plaça del poble</strong>: hi llegixes les notícies, els pensaments i les fotografies del veïnat, i amb el teu compte hi pots <strong>publicar</strong> les teues.', 'Obri el Mur'],
    ['Dona una segona vida al Mercat', 'Al Mercat trobes i publiques <strong>anuncis de proximitat</strong> de coses que ja no fas servir. Els <strong>acords i els pagaments</strong> es fan directament entre veïns: la plataforma no hi intervé.', 'Obri el Mercat'],
    ['Apunta’t les festes al Calendari', 'El Calendari reunix les <strong>festes, els esdeveniments i les reunions</strong> del poble, i amb el teu compte n’hi pots <strong>anunciar</strong>.', 'Obri el Calendari'],
    ['Situa el poble al Mapa', 'Al Mapa veus <strong>llocs i publicacions</strong> situats sobre el terme, i hi pots <strong>geolocalitzar</strong> el que publiques.', 'Obri el Mapa'],
    ['Parla pel Xat', 'El Xat és una <strong>missatgeria</strong> que funciona com les que ja coneixes, <strong>sense vendre ni cedir</strong> les teues converses a ningú.', 'Obri el Xat'],
    ['Escriu al Bloc de notes', 'Les Notes són el teu <strong>espai d’escriptura</strong>: hi escrius i t’organitzes, i ningú no ho veu si tu <strong>no ho publiques</strong>.', 'Obri les Notes'],
    ['Porta la casa', 'El <strong>Rebost Domèstic</strong> apunta el que tens a casa i el que cal comprar. Encara està <strong>en proves</strong>, i les llistes es guarden només en este dispositiu.', 'Obri la fitxa del Rebost'],
    ['Porta la salut', '<strong>Salut</strong> és un quadern per a apuntar com beu, dorm i està la persona que cuides, i ensenyar-ho al metge en un full clar. Està <strong>en proves</strong>, les dades es queden en este dispositiu i no diagnostica ni envia res.', 'Obri la fitxa de Salut'],
    ['Prepara els números per a la gestoria', 'La <strong>Gestoria</strong> fa el full de <strong>factures del trimestre</strong>. Està en proves, les dades es guarden en este dispositiu i no envia res: enviar-ho a la gestoria ho fas tu.', 'Obri la fitxa de la Gestoria'],
    ['Deixa que l’Avisador vetle', '<strong>L’Avisador</strong> avisa pel Xat fins a <strong>tres persones de confiança</strong> quan passen les hores triades sense activitat en esta app. <strong>Només funciona amb la sessió oberta</strong>, Sóc de Poble en marxa i el Xat disponible: amb l’app tancada no avisa. Està en proves i <strong>no substituïx</strong> el telèfon d’emergències ni la teleassistència.', 'Obri l’Avisador'],
    ['Connecta les teues finestres', 'A <strong>Dispositius</strong> connectes les pestanyes i les finestres obertes en este mateix navegador i envies <strong>missatges directes</strong> sense passar per cap servidor.', 'Obri Dispositius'],
    ['Totes les eines juntes, al Panell', 'El <strong>Panell de Control</strong> reunix les eines i les aplicacions en <strong>targetes</strong>: des d’ací obris cadascuna.', 'Obri el Panell de Control']
  ],
  es: [
    ['Elige tu idioma', 'Sóc de Poble habla en <strong>valenciano, castellano, inglés, euskera y gallego</strong>. En Traducciones cambias el idioma de los <strong>menús y los botones</strong>, y la preferencia se guarda en este navegador.', 'Abre Traducciones'],
    ['Lee y publica en el Muro', 'El Muro es la <strong>plaza del pueblo</strong>: en él lees las noticias, los pensamientos y las fotografías del vecindario, y con tu cuenta puedes <strong>publicar</strong> los tuyos.', 'Abre el Muro'],
    ['Da una segunda vida en el Mercado', 'En el Mercado encuentras y publicas <strong>anuncios de proximidad</strong> de cosas que ya no usas. Los <strong>acuerdos y los pagos</strong> se hacen directamente entre vecinos: la plataforma no interviene.', 'Abre el Mercado'],
    ['Apunta las fiestas en el Calendario', 'El Calendario reúne las <strong>fiestas, los eventos y las reuniones</strong> del pueblo, y con tu cuenta puedes <strong>anunciar</strong> los tuyos.', 'Abre el Calendario'],
    ['Sitúa el pueblo en el Mapa', 'En el Mapa ves <strong>lugares y publicaciones</strong> situados sobre el término, y puedes <strong>geolocalizar</strong> lo que publicas.', 'Abre el Mapa'],
    ['Habla por el Chat', 'El Chat es una <strong>mensajería</strong> que funciona como las que ya conoces, <strong>sin vender ni ceder</strong> tus conversaciones a nadie.', 'Abre el Chat'],
    ['Escribe en el Bloc de notas', 'Las Notas son tu <strong>espacio de escritura</strong>: escribes y te organizas, y nadie lo ve si tú <strong>no lo publicas</strong>.', 'Abre las Notas'],
    ['Lleva la casa', 'La <strong>Despensa Doméstica</strong> apunta lo que tienes en casa y lo que hay que comprar. Aún está <strong>en pruebas</strong>, y las listas se guardan solo en este dispositivo.', 'Abre la ficha de la Despensa'],
    ['Cuida la salud', '<strong>Salud</strong> es un cuaderno para apuntar cómo bebe, duerme y está la persona que cuidas, y enseñárselo al médico en una hoja clara. Está <strong>en pruebas</strong>, los datos se quedan en este dispositivo y no diagnostica ni envía nada.', 'Abre la ficha de Salud'],
    ['Prepara los números para la gestoría', 'La <strong>Gestoría</strong> hace la hoja de <strong>facturas del trimestre</strong>. Está en pruebas, los datos se guardan en este dispositivo y no envía nada: enviarlo a la gestoría lo haces tú.', 'Abre la ficha de la Gestoría'],
    ['Deja que el Avisador vele', '<strong>El Avisador</strong> avisa por el Chat hasta a <strong>tres personas de confianza</strong> cuando pasan las horas elegidas sin actividad en esta app. <strong>Solo funciona con la sesión abierta</strong>, Sóc de Poble en marcha y el Chat disponible: con la app cerrada no avisa. Está en pruebas y <strong>no sustituye</strong> al teléfono de emergencias ni a la teleasistencia.', 'Abre el Avisador'],
    ['Conecta tus ventanas', 'En <strong>Dispositivos</strong> conectas las pestañas y las ventanas abiertas en este mismo navegador y envías <strong>mensajes directos</strong> sin pasar por ningún servidor.', 'Abre Dispositivos'],
    ['Todas las herramientas juntas, en el Panel', 'El <strong>Panel de Control</strong> reúne las herramientas y las aplicaciones en <strong>tarjetas</strong>: desde allí abres cada una.', 'Abre el Panel de Control']
  ],
  en: [
    ['Choose your language', 'Sóc de Poble speaks <strong>Valencian, Spanish, English, Basque and Galician</strong>. In Translations you change the language of the <strong>menus and buttons</strong>, and your choice is saved in this browser.', 'Open Translations'],
    ['Read and post on the Wall', 'The Wall is the <strong>village square</strong>: you read your neighbours’ news, thoughts and photos, and with your account you can <strong>post</strong> your own.', 'Open the Wall'],
    ['Give things a second life at the Market', 'At the Market you find and post <strong>local listings</strong> for things you no longer use. <strong>Agreements and payments</strong> are made directly between neighbours: the platform takes no part.', 'Open the Market'],
    ['Note the festivities in the Calendar', 'The Calendar gathers the village <strong>festivities, events and meetings</strong>, and with your account you can <strong>announce</strong> your own.', 'Open the Calendar'],
    ['Put the village on the Map', 'On the Map you see <strong>places and posts</strong> located across the municipality, and you can <strong>geolocate</strong> what you post.', 'Open the Map'],
    ['Talk on the Chat', 'The Chat is a <strong>messaging service</strong> that works like the ones you already know, <strong>without selling or handing over</strong> your conversations to anyone.', 'Open the Chat'],
    ['Write in the Notebook', 'Notes is your <strong>writing space</strong>: you write and get organised, and nobody sees it unless you <strong>publish it</strong>.', 'Open Notes'],
    ['Run the house', 'The <strong>Home Pantry</strong> keeps track of what you have at home and what you need to buy. It is still <strong>being tested</strong>, and the lists are saved only on this device.', 'Open the Pantry page'],
    ['Look after health', '<strong>Health</strong> is a notebook to record how the person you care for drinks, sleeps and feels, and to show it to the doctor on a clear sheet. It is <strong>being tested</strong>, the data stays on this device and it neither diagnoses nor sends anything.', 'Open the Health page'],
    ['Get the numbers ready for the accountant', 'The <strong>Accounts</strong> tool builds the <strong>quarterly invoice sheet</strong>. It is being tested, the data is saved on this device and it sends nothing: you send it to your accountant yourself.', 'Open the Accounts page'],
    ['Let the Alerter keep watch', '<strong>The Alerter</strong> notifies up to <strong>three trusted people</strong> through the Chat when the chosen hours pass without activity in this app. <strong>It only works with your session open</strong>, Sóc de Poble running and the Chat available: with the app closed it sends no alert. It is being tested and <strong>does not replace</strong> the emergency number or telecare.', 'Open the Alerter'],
    ['Connect your windows', 'In <strong>Devices</strong> you connect the tabs and windows open in this same browser and send <strong>direct messages</strong> without going through any server.', 'Open Devices'],
    ['All the tools together, on the Control Panel', 'The <strong>Control Panel</strong> gathers the tools and apps on <strong>cards</strong>: from there you open each one.', 'Open the Control Panel']
  ],
  eu: [
    ['Aukeratu zure hizkuntza', 'Sóc de Poblek <strong>valentziera, gaztelania, ingelesa, euskara eta galegoa</strong> hitz egiten ditu. Itzulpenak atalean <strong>menuen eta botoien</strong> hizkuntza aldatzen duzu, eta hobespena nabigatzaile honetan gordetzen da.', 'Ireki Itzulpenak'],
    ['Irakurri eta argitaratu Horman', 'Horma <strong>herriko plaza</strong> da: auzokideen albisteak, gogoetak eta argazkiak irakurtzen dituzu, eta zure kontuarekin zureak <strong>argitara</strong> ditzakezu.', 'Ireki Horma'],
    ['Eman bigarren bizitza bat Merkatuan', 'Merkatuan erabiltzen ez dituzun gauzen <strong>hurbileko iragarkiak</strong> aurkitu eta argitaratzen dituzu. <strong>Akordioak eta ordainketak</strong> auzokideen artean zuzenean egiten dira: plataformak ez du parte hartzen.', 'Ireki Merkatua'],
    ['Idatzi jaiak Egutegian', 'Egutegiak herriko <strong>jaiak, ekitaldiak eta bilerak</strong> biltzen ditu, eta zure kontuarekin zureak <strong>iragar</strong> ditzakezu.', 'Ireki Egutegia'],
    ['Kokatu herria Mapan', 'Mapan udalerrian kokatutako <strong>tokiak eta argitalpenak</strong> ikusten dituzu, eta argitaratzen duzuna <strong>geokoka</strong> dezakezu.', 'Ireki Mapa'],
    ['Hitz egin Txatean', 'Txata dagoeneko ezagutzen dituzunen antzera dabilen <strong>mezularitza</strong> da, zure elkarrizketak inori <strong>saldu edo laga gabe</strong>.', 'Ireki Txata'],
    ['Idatzi Ohar-koadernoan', 'Oharrak zure <strong>idazteko gunea</strong> dira: idatzi eta antolatu egiten zara, eta inork ez du ikusten zuk <strong>argitaratzen ez baduzu</strong>.', 'Ireki Oharrak'],
    ['Eraman etxea', '<strong>Etxeko Jakitegiak</strong> etxean duzuna eta erosi behar dena idazten du. Oraindik <strong>probetan</strong> dago, eta zerrendak gailu honetan bakarrik gordetzen dira.', 'Ireki Jakitegiaren fitxa'],
    ['Zaindu osasuna', '<strong>Osasuna</strong> zaintzen duzun pertsonak nola edaten, lo egiten eta nola dagoen idazteko koadernoa da, medikuari orri argi batean erakusteko. <strong>Probetan</strong> dago, datuak gailu honetan geratzen dira eta ez du ezer diagnostikatzen ezta bidaltzen ere.', 'Ireki Osasunaren fitxa'],
    ['Prestatu zenbakiak gestoriarentzat', '<strong>Gestoriak</strong> <strong>hiruhilekoko fakturen</strong> orria egiten du. Probetan dago, datuak gailu honetan gordetzen dira eta ez du ezer bidaltzen: gestoriari zuk zeuk bidaltzen diozu.', 'Ireki Gestoriaren fitxa'],
    ['Utzi Abisatzaileari zaintzen', '<strong>Abisatzaileak</strong> Txatetik abisatzen die gehienez <strong>konfiantzazko hiru pertsonari</strong>, aukeratutako orduak aplikazio honetan jarduerarik gabe igarotzen direnean. <strong>Saioa irekita dagoenean bakarrik dabil</strong>, Sóc de Poble martxan eta Txata erabilgarri dagoela: aplikazioa itxita badago, ez du abisatzen. Probetan dago eta <strong>ez ditu ordezkatzen</strong> larrialdietako telefonoa eta telelaguntza.', 'Ireki Abisatzailea'],
    ['Konektatu zure leihoak', '<strong>Gailuak</strong> atalean nabigatzaile honetan bertan irekitako fitxak eta leihoak konektatzen dituzu, eta <strong>zuzeneko mezuak</strong> bidaltzen dituzu inolako zerbitzaritik pasatu gabe.', 'Ireki Gailuak'],
    ['Tresna guztiak batera, Kontrol Panelean', '<strong>Kontrol Panelak</strong> tresnak eta aplikazioak <strong>txarteletan</strong> biltzen ditu: hortik irekitzen duzu bakoitza.', 'Ireki Kontrol Panela']
  ],
  gl: [
    ['Escolle a túa lingua', 'Sóc de Poble fala en <strong>valenciano, castelán, inglés, éuscaro e galego</strong>. En Traducións cambias a lingua dos <strong>menús e os botóns</strong>, e a preferencia gárdase neste navegador.', 'Abre Traducións'],
    ['Le e publica no Muro', 'O Muro é a <strong>praza da vila</strong>: nel les as novas, os pensamentos e as fotografías da veciñanza, e coa túa conta podes <strong>publicar</strong> as túas.', 'Abre o Muro'],
    ['Dálles unha segunda vida no Mercado', 'No Mercado atopas e publicas <strong>anuncios de proximidade</strong> de cousas que xa non usas. Os <strong>acordos e os pagamentos</strong> fanse directamente entre veciños: a plataforma non intervén.', 'Abre o Mercado'],
    ['Apunta as festas no Calendario', 'O Calendario reúne as <strong>festas, os eventos e as reunións</strong> da vila, e coa túa conta podes <strong>anunciar</strong> os teus.', 'Abre o Calendario'],
    ['Sitúa a vila no Mapa', 'No Mapa ves <strong>lugares e publicacións</strong> situados sobre o termo, e podes <strong>xeolocalizar</strong> o que publicas.', 'Abre o Mapa'],
    ['Fala polo Chat', 'O Chat é unha <strong>mensaxería</strong> que funciona como as que xa coñeces, <strong>sen vender nin ceder</strong> as túas conversas a ninguén.', 'Abre o Chat'],
    ['Escribe no Bloc de notas', 'As Notas son o teu <strong>espazo de escritura</strong>: escribes e organízaste, e ninguén o ve se ti <strong>non o publicas</strong>.', 'Abre as Notas'],
    ['Leva a casa', 'A <strong>Despensa Doméstica</strong> apunta o que tes na casa e o que cómpre mercar. Aínda está <strong>en probas</strong>, e as listas gárdanse só neste dispositivo.', 'Abre a ficha da Despensa'],
    ['Coida a saúde', '<strong>Saúde</strong> é un caderno para apuntar como bebe, dorme e está a persoa que coidas, e amosarllo ao médico nunha folla clara. Está <strong>en probas</strong>, os datos quedan neste dispositivo e non diagnostica nin envía nada.', 'Abre a ficha de Saúde'],
    ['Prepara os números para a xestoría', 'A <strong>Xestoría</strong> fai a folla de <strong>facturas do trimestre</strong>. Está en probas, os datos gárdanse neste dispositivo e non envía nada: envialo á xestoría faino ti.', 'Abre a ficha da Xestoría'],
    ['Deixa que o Avisador vixíe', '<strong>O Avisador</strong> avisa polo Chat ata a <strong>tres persoas de confianza</strong> cando pasan as horas escollidas sen actividade nesta app. <strong>Só funciona coa sesión aberta</strong>, Sóc de Poble en marcha e o Chat dispoñible: coa app pechada non avisa. Está en probas e <strong>non substitúe</strong> o teléfono de emerxencias nin a teleasistencia.', 'Abre o Avisador'],
    ['Conecta as túas xanelas', 'En <strong>Dispositivos</strong> conectas as lapelas e as xanelas abertas neste mesmo navegador e envías <strong>mensaxes directas</strong> sen pasar por ningún servidor.', 'Abre Dispositivos'],
    ['Todas as ferramentas xuntas, no Panel', 'O <strong>Panel de Control</strong> reúne as ferramentas e as aplicacións en <strong>tarxetas</strong>: desde alí abres cada unha.', 'Abre o Panel de Control']
  ]
};

const CAPCALERES = {
  ca: {
    title: 'Tot el que pots fer a Sóc de Poble, pas a pas',
    subtitle: 'Una guia de les eines del poble, cadascuna amb el seu enllaç',
    imageAlt: 'Caricatura de Sóc de Poble: veïns de totes les edats endollen ordinadors a una pila de pedra seca davant del mas, entre un tractor, un ase amb ulleres, gallines i un paller amb antenes',
    lead: 'Esta pàgina explica, en paraules de cada dia, què pots fer a Sóc de Poble i on es fa. Cada pas porta l’enllaç a la seua eina. Algunes eines encara estan en proves, i el seu pas ho diu.'
  },
  es: {
    title: 'Todo lo que puedes hacer en Sóc de Poble, paso a paso',
    subtitle: 'Una guía de las herramientas del pueblo, cada una con su enlace',
    imageAlt: 'Caricatura de Sóc de Poble: vecinos de todas las edades enchufan ordenadores a una pila de piedra seca delante del mas, entre un tractor, un burro con gafas, gallinas y un pajar con antenas',
    lead: 'Esta página explica, con palabras de cada día, qué puedes hacer en Sóc de Poble y dónde se hace. Cada paso lleva el enlace a su herramienta. Algunas herramientas aún están en pruebas, y su paso lo dice.'
  },
  en: {
    title: 'Everything you can do on Sóc de Poble, step by step',
    subtitle: 'A guide to the village tools, each one with its link',
    imageAlt: 'Cartoon of Sóc de Poble: neighbours of all ages plug computers into a dry-stone pillar in front of the farmhouse, among a tractor, a donkey wearing goggles, hens and a haystack with antennas',
    lead: 'This page explains, in everyday words, what you can do on Sóc de Poble and where to do it. Each step links to its tool. Some tools are still being tested, and their step says so.'
  },
  eu: {
    title: 'Sóc de Poblen egin dezakezun guztia, urratsez urrats',
    subtitle: 'Herriko tresnen gida, bakoitza bere estekarekin',
    imageAlt: 'Sóc de Pobleren karikatura: adin guztietako auzokideek ordenagailuak konektatzen dituzte baserriaren aurreko harri lehorrezko pila batera, traktore, betaurrekodun asto, oilo eta antenadun lastategi baten artean',
    lead: 'Orri honek eguneroko hitzekin azaltzen du zer egin dezakezun Sóc de Poblen eta non egiten den. Urrats bakoitzak bere tresnarako esteka du. Tresna batzuk probetan daude oraindik, eta haien urratsak hala dio.'
  },
  gl: {
    title: 'Todo o que podes facer en Sóc de Poble, paso a paso',
    subtitle: 'Unha guía das ferramentas da vila, cada unha coa súa ligazón',
    imageAlt: 'Caricatura de Sóc de Poble: veciños de todas as idades enchufan ordenadores a unha pía de pedra seca diante do mas, entre un tractor, un burro con lentes, galiñas e un palleiro con antenas',
    lead: 'Esta páxina explica, con palabras de cada día, que podes facer en Sóc de Poble e onde se fai. Cada paso leva a ligazón á súa ferramenta. Algunhas ferramentas aínda están en probas, e o seu paso dío.'
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
