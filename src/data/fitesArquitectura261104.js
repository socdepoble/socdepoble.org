/**
 * @file fitesArquitectura261104.js
 * @description Catàleg Editorial Estructurat de les Fites del 04-11-2026 en les 5 llengües oficials
 * (`ca`, `es`, `en`, `eu`, `gl`) · Directiva AH-13 i Tasca P2-18 (Rondes 26 a 30).
 *
 * Segueix l'anatomia editorial de Pedra Seca:
 *   H1 (Títol) → H2 (Subtítol) → Entradeta (Resum inicial) → Seccions H3 amb paràgrafs clars i escanejables.
 *   Zero llatinismes («versus», «per se», «in situ», «a priori», «statu quo»), zero argot opac i
 *   paritat completa entre valencià/català (`ca`), castellà (`es`), anglés (`en`), basc (`eu`) i gallec (`gl`).
 */

export const IDIOMES_OFICIALS_FITES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const IDS_FITES_261104 = Object.freeze([
  'verticals-8-ambits',
  'node0-resiliencia-321',
  'posse-mastodon-simetria',
  'autopia-usuari-estudi-mastodon',
]);

export const METADADES_INSTITUCIONALS_261104 = Object.freeze({
  dataPublicacio: '2026-11-04',
  origenCanonic: 'https://socdepoble.org',
  compteInstitucionalCanonic: 'socdepoble@socdepoble.org',
  webfingerCanonic: 'acct:socdepoble@socdepoble.org',
  node0Domini: 'https://socdepoble.cat',
  node0ActorAcct: 'socdepoble@socdepoble.cat',
  replicaPosseMastodon: '@depoble@mastodont.cat',
  carpetaArrelMirallWorkspace: 'Sóc de Poble · Mirall Sobirà Node 0/',
  entitatsEditorialsVinculades: Object.freeze(['socdepoble', 'elrentonar', 'coordinadora']),
  exclouMercatComercialPosse: true,
});

const RUTES_CANONIQUES_PERMESES = Object.freeze([
  'https://socdepoble.org/control',
  'https://socdepoble.org/notes',
  'https://socdepoble.org/mur',
  'https://socdepoble.org/mercat',
  'https://socdepoble.org/calendari',
  'https://socdepoble.org/mapa',
  'https://socdepoble.org/vehicle',
  'https://socdepoble.org/animalets',
  'https://socdepoble.org/treball',
  'https://socdepoble.org/habitatge',
  'https://socdepoble.org/page/fediversity',
  'https://socdepoble.org/connectar',
]);

const TERMES_PROHIBITS_EDITORIAL = Object.freeze([
  /\bversus\b/i,
  /\bvs\.?\b/i,
  /\bper se\b/i,
  /\bin situ\b/i,
  /\ba priori\b/i,
  /\ba posteriori\b/i,
  /\bstatu quo\b/i,
  /\bmodus operandi\b/i,
  /\blorem ipsum\b/i,
  /\bplaceholder\b/i,
]);

export const CATALOG_FITES_261104 = Object.freeze({
  'verticals-8-ambits': Object.freeze({
    id: 'verticals-8-ambits',
    dataPublicacio: '2026-11-04',
    ambit: 'mur',
    entitatId: 'socdepoble',
    enllacosCanonics: Object.freeze([
      'https://socdepoble.org/control',
      'https://socdepoble.org/notes',
      'https://socdepoble.org/mur',
      'https://socdepoble.org/mercat',
      'https://socdepoble.org/calendari',
      'https://socdepoble.org/mapa',
      'https://socdepoble.org/vehicle',
      'https://socdepoble.org/animalets',
      'https://socdepoble.org/treball',
      'https://socdepoble.org/habitatge',
    ]),
    idiomes: Object.freeze({
      ca: Object.freeze({
        titol: 'Huit verticals de publicació comunitària des del Panell i el Bloc de Notes',
        subtitol: 'Un sol flux editorial amb edició avançada davall de la barra taronja i fitxes explicatives',
        entradeta:
          'Sóc de Poble unifica la creació de continguts perquè qualsevol veí o associació puga publicar al Mur, al Mercat, al Calendari multi-dia, al Mapa, a Vehicle Compartit, a Animalets, a Treball i a Habitatge amb un sol clic.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Publicació directa als huit àmbits rurals essencials',
            paragrafs: Object.freeze([
              'Des del **Panell de Control** i des del **Bloc de Notes**, el selector d\'àmbit ofereix les **huit verticals comunitàries** amb el **Mur** seleccionat per defecte per facilitar una escriptura ràpida i sense obstacles.',
              'Cada vertical adapta les seues dades a la vida del poble: el **Calendari** admet activitats de diversos dies com els **Cursos de Pedra en Sec**, **Animalets** distingeix entre adopció, perdut i trobat, **Treball** separa oferta i demanda, i **Habitatge** ordena el lloguer i la vivenda rural.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Edició avançada davall de la barra taronja i pàgines per a saber-ne més',
            paragrafs: Object.freeze([
              'L\'apartat desplegable d\'**Edició avançada** se situa just davall de la barra taronja de l\'editor i incorpora un **botó gran de tancament inferior** perquè l\'espai d\'escriptura quede sempre net.',
              'Cada vertical compta amb un accés directe per a **saber-ne més** que obri la seua pàgina explicativa amb exemples reals d\'ús veïnal i botó per a publicar immediatament en eixe àmbit.',
            ]),
          }),
        ]),
      }),
      es: Object.freeze({
        titol: 'Ocho verticales de publicación comunitaria desde el Panel y el Bloc de Notas',
        subtitol: 'Un único flujo editorial con edición avanzada bajo la barra naranja y fichas explicativas',
        entradeta:
          'Sóc de Poble unifica la creación de contenidos para que cualquier vecino o asociación pueda publicar en el Muro, el Mercado, el Calendario de varios días, el Mapa, Vehículo Compartido, Animales, Trabajo y Vivienda con un solo clic.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Publicación directa en los ocho ámbitos rurales esenciales',
            paragrafs: Object.freeze([
              'Desde el **Panel de Control** y desde el **Bloc de Notas**, el selector de ámbito ofrece las **ocho verticales comunitarias** con el **Muro** seleccionado por defecto para facilitar una escritura rápida y sin obstáculos.',
              'Cada vertical adapta sus datos a la vida del pueblo: el **Calendario** admite actividades de varios días como los **Cursos de Piedra en Seco**, **Animales** distingue entre adopción, perdido y encontrado, **Trabajo** separa oferta y demanda, y **Vivienda** ordena el alquiler y el hogar rural.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Edición avanzada bajo la barra naranja y páginas para saber más',
            paragrafs: Object.freeze([
              'El apartado desplegable de **Edición avanzada** se sitúa justo debajo de la barra naranja del editor e incorpora un **botón grande de cierre inferior** para que el espacio de escritura quede siempre despejado.',
              'Cada vertical cuenta con un acceso directo para **saber más** que abre su página explicativa con ejemplos reales de uso vecinal y botón para publicar de inmediato en ese ámbito.',
            ]),
          }),
        ]),
      }),
      en: Object.freeze({
        titol: 'Eight community publishing verticals from the Control Panel and Notebook',
        subtitol: 'A unified editorial flow with advanced editing below the orange toolbar and guide pages',
        entradeta:
          'Sóc de Poble unifies content creation so any neighbor or local association can publish to the Wall, Market, multi-day Calendar, Map, Carpool, Pets, Jobs, and Housing with a single click.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Direct publishing across the eight essential rural areas',
            paragrafs: Object.freeze([
              'From the **Control Panel** and the **Notebook**, the area selector offers all **eight community verticals** with the **Wall** selected by default for fast, frictionless writing.',
              'Each vertical adapts its fields to village life: the **Calendar** supports multi-day activities such as **Dry Stone Courses**, **Pets** distinguishes adoption, lost, and found notices, **Jobs** separates offers and requests, and **Housing** organizes rural rentals and homes.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Advanced editing below the orange bar and learn-more pages',
            paragrafs: Object.freeze([
              'The collapsible **Advanced editing** panel sits right below the orange editor bar and includes a **large bottom close button** so the writing canvas stays clean at all times.',
              'Every vertical includes a **learn more** link that opens its explanatory page with real village examples and a direct button to publish in that area.',
            ]),
          }),
        ]),
      }),
      eu: Object.freeze({
        titol: 'Zortzi argitalpen-ardatz komunitario Kontrol Paneletik eta Ohar Bloketik',
        subtitol: 'Fluxu editorial bateratua barra laranjaren azpiko edizio aurreratuarekin eta azalpen-orriekin',
        entradeta:
          'Sóc de Poblek edukien sorkuntza bateratzen du, edozein bizilagunek edo elkartek Horman, Merkatuan, egun anitzeko Egutegian, Mapan, Ibilgailu Partekatuan, Animalietan, Lanean eta Etxebizitzan klik bakarrean argitaratu dezan.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Zuzeneko argitalpena landa-eremuko zortzi arlo nagusietan',
            paragrafs: Object.freeze([
              '**Kontrol Paneletik** eta **Ohar Bloketik**, eremu-hautatzaileak **zortzi ardatz komunitarioak** eskaintzen ditu, **Horma** lehenetsita utziz idazketa azkar eta erosoa bermatzeko.',
              'Ardatz bakoitzak herriko bizimodura egokitzen ditu datuak: **Egutegiak** egun anitzeko jarduerak onartzen ditu (**Harri Lehorreko Ikastaroak**, esaterako), **Animaliak** atalak adopzioa, galduak eta aurkituak bereizten ditu, **Lana** atalak eskaintza eta eskaria banatzen ditu, eta **Etxebizitzak** alokairua antolatzen du.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Edizio aurreratua barra laranjaren azpian eta gehiago jakiteko orriak',
            paragrafs: Object.freeze([
              '**Edizio aurreratuko** atal tolesgarria editorearen barra laranjaren azpian dago eta **ixteko beheko botoi handi bat** dauka idazteko eremua beti garbi mantentzeko.',
              'Ardatz bakoitzak **gehiago jakiteko** lotura zuzena du, herriko adibide errealekin eta eremu horretan berehala argitaratzeko botoiarekin.',
            ]),
          }),
        ]),
      }),
      gl: Object.freeze({
        titol: 'Oito verticais de publicación comunitaria desde o Panel e o Bloque de Notas',
        subtitol: 'Un fluxo editorial único con edición avanzada debaixo da barra laranxa e fichas explicativas',
        entradeta:
          'Sóc de Poble unifica a creación de contidos para que calquera veciño ou asociación poida publicar no Muro, no Mercado, no Calendario de varios días, no Mapa, en Vehículo Compartido, en Animais, en Traballo e en Vivenda cun só clic.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Publicación directa nos oito ámbitos rurais esenciais',
            paragrafs: Object.freeze([
              'Desde o **Panel de Control** e desde o **Bloque de Notas**, o selector de ámbito ofrece as **oito verticais comunitarias** co **Muro** seleccionado por defecto para facilitar unha escrita rápida e sen atrancos.',
              'Cada vertical adapta os seus datos á vida da aldea: o **Calendario** admite actividades de varios días como os **Cursos de Pedra en Seco**, **Animais** distingue entre adopción, perdido e atopado, **Traballo** separa oferta e demanda, e **Vivenda** ordena o alugueiro rural.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Edición avanzada debaixo da barra laranxa e páxinas para saber máis',
            paragrafs: Object.freeze([
              'O apartado despregable de **Edición avanzada** sitúase xusto debaixo da barra laranxa do editor e incorpora un **botón grande de peche inferior** para que o espazo de escrita quede sempre limpo.',
              'Cada vertical conta cun acceso directo para **saber máis** que abre a súa páxina explicativa con exemplos reais de uso veciñal e botón para publicar de contado nese ámbito.',
            ]),
          }),
        ]),
      }),
    }),
  }),

  'node0-resiliencia-321': Object.freeze({
    id: 'node0-resiliencia-321',
    dataPublicacio: '2026-11-04',
    ambit: 'mur',
    entitatId: 'socdepoble',
    enllacosCanonics: Object.freeze([
      'https://socdepoble.org/control',
      'https://socdepoble.org/page/fediversity',
    ]),
    idiomes: Object.freeze({
      ca: Object.freeze({
        titol: 'Node 0 al Mac mini M4 i Arquitectura de Resiliència Rural 3-2-1',
        subtitol: 'PostgreSQL 17.11 al poble, Time Machine local i Mirall Navegable de 20 TB sota socdepoble@socdepoble.org',
        entradeta:
          'El servidor físic Node 0 batega al poble amb PostgreSQL 17.11 i signatures criptogràfiques Ed25519, protegit per una triple capa que garanteix que, encara que salte la llum a casa amb el forn i el microones, la web mai cau ni es perd cap memòria.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Tres capes de protecció per a la sobirania de dades del poble',
            paragrafs: Object.freeze([
              'La **Capa 1** és el **Node 0 al Mac mini M4** (`socdepoble.cat`) amb **PostgreSQL 17.11** i recuperació automàtica d\'arrancada; la **Capa 2** és la còpia contínua en disc físic local mitjançant **Time Machine**.',
              'La **Capa 3** és el **Mirall Navegable als 20 TB de Google Workspace Drive** sota el compte institucional **`socdepoble@socdepoble.org`** (`Sóc de Poble · Mirall Sobirà Node 0/`), que combina buidats atòmics de base de dades amb carpetes d\'articles i patrimoni llegibles per qualsevol persona.',
            ]),
          }),
          Object.freeze({
            titolH3: ' Continuïtat total davant talls elèctrics domèstics i zero secrets al núvol',
            paragrafs: Object.freeze([
              'Si un tall elèctric domèstic apaga temporalment el Mac mini, el frontal **`socdepoble.org`** continua servint totes les publicacions sense interrupció i l\'arxiu de Google Drive roman 100% consultable des del mòbil o l\'ordinador.',
              'Totes les credencials vives romanen aïllades al dispositiu físic amb permisos estrictes i l\'auditor automàtic impedeix que cap clau privada viatge cap al mirall remot.',
            ]),
          }),
        ]),
      }),
      es: Object.freeze({
        titol: 'Nodo 0 en el Mac mini M4 y Arquitectura de Resiliencia Rural 3-2-1',
        subtitol: 'PostgreSQL 17.11 en el pueblo, Time Machine local y Espejo Navegable de 20 TB bajo socdepoble@socdepoble.org',
        entradeta:
          'El servidor físico Nodo 0 late en el pueblo con PostgreSQL 17.11 y firmas criptográficas Ed25519, protegido por una triple capa que garantiza que, aunque salte la luz en casa con el horno y el microondas, la web nunca cae ni se pierde ninguna memoria.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Tres capas de protección para la soberanía de datos del pueblo',
            paragrafs: Object.freeze([
              'La **Capa 1** es el **Nodo 0 en el Mac mini M4** (`socdepoble.cat`) con **PostgreSQL 17.11** y recuperación automática de arranque; la **Capa 2** es la copia continua en disco físico local mediante **Time Machine**.',
              'La **Capa 3** es el **Espejo Navegable en los 20 TB de Google Workspace Drive** bajo la cuenta institucional **`socdepoble@socdepoble.org`** (`Sóc de Poble · Mirall Sobirà Node 0/`), que combina volcados atómicos de base de datos con carpetas de artículos y patrimonio legibles por cualquier persona.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Continuidad total ante cortes eléctricos domésticos y cero secretos en la nube',
            paragrafs: Object.freeze([
              'Si un corte eléctrico doméstico apaga temporalmente el Mac mini, el frontal **`socdepoble.org`** sigue sirviendo todas las publicaciones sin interrupción y el archivo de Google Drive permanece 100% consultable desde el móvil o el ordenador.',
              'Todas las credenciales vivas permanecen aisladas en el dispositivo físico con permisos estrictos y el auditor automático impide que ninguna clave privada viaje hacia el espejo remoto.',
            ]),
          }),
        ]),
      }),
      en: Object.freeze({
        titol: 'Node 0 on Mac mini M4 and 3-2-1 Rural Resilience Architecture',
        subtitol: 'PostgreSQL 17.11 in the village, local Time Machine, and 20 TB Browsable Mirror under socdepoble@socdepoble.org',
        entradeta:
          'The physical Node 0 server beats in the village with PostgreSQL 17.11 and Ed25519 cryptographic signatures, protected by a three-layer architecture ensuring that even if the home power trips with the oven and microwave, the website never goes down and no memory is lost.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Three layers of protection for village data sovereignty',
            paragrafs: Object.freeze([
              '**Layer 1** is **Node 0 on the Mac mini M4** (`socdepoble.cat`) running **PostgreSQL 17.11** with automatic boot recovery; **Layer 2** is the continuous local physical disk backup via **Time Machine**.',
              '**Layer 3** is the **Browsable Mirror on 20 TB of Google Workspace Drive** under the institutional account **`socdepoble@socdepoble.org`** (`Sóc de Poble · Mirall Sobirà Node 0/`), combining atomic database snapshots with human-readable article and heritage folders.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Full continuity during domestic power outages and zero secrets in the cloud',
            paragrafs: Object.freeze([
              'If a domestic power outage temporarily turns off the Mac mini, **`socdepoble.org`** continues serving all publications without interruption and the Google Drive archive remains fully browsable from any phone or computer.',
              'All live credentials stay isolated on the physical machine with strict permissions, and the automated auditor blocks any private key from ever reaching the remote mirror.',
            ]),
          }),
        ]),
      }),
      eu: Object.freeze({
        titol: '0 Nodoa Mac mini M4an eta 3-2-1 Landa Erresilientzia Arkitektura',
        subtitol: 'PostgreSQL 17.11 herrian, Time Machine lokala eta 20 TB-ko Ispilu Nabigagarria socdepoble@socdepoble.org kontupean',
        entradeta:
          '0 Nodo zerbitzari fisikoak herrian bertan egiten du taupada PostgreSQL 17.11 eta Ed25519 sinadura kriptografikoekin; hiru geruzako babesari esker, etxean labearekin eta mikrouhin-labearekin argia joanda ere, webgunea ez da inoiz erortzen eta ez da oroimenik galtzen.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Hiru babes-geruza herriko datuen burujabetzarako',
            paragrafs: Object.freeze([
              '**1. Geruza** **Mac mini M4ko 0 Nodoa** da (`socdepoble.cat`), **PostgreSQL 17.11** eta abio automatikoarekin; **2. Geruza** disko fisiko lokaleko etengabeko kopia da **Time Machine** bidez.',
              '**3. Geruza** **Google Workspace Driveko 20 TB-etan dagoen Ispilu Nabigagarria** da, **`socdepoble@socdepoble.org`** kontu instituzionalaren pean (`Sóc de Poble · Mirall Sobirà Node 0/`), datu-basearen kopia atomikoak eta edonork irakurtzeko moduko artikulu-karpetak uztartuz.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Erabateko jarraitutasuna etxeko argindar-mozketetan eta zero sekretu hodeian',
            paragrafs: Object.freeze([
              'Etxeko argindar-mozketa batek Mac minia aldi baterako itzaltzen badu, **`socdepoble.org`** atariak argitalpen guztiak etenik gabe zerbitzatzen jarraitzen du eta Google Driveko artxiboa % 100ean kontsultagarri geratzen da mugikorretik.',
              'Kredentzial guztiak gailu fisikoan isolatuta geratzen dira baimen zorrotzekin, eta auditore automatikoak edozein gako pribatu urruneko ispilura igarotzea eragozten du.',
            ]),
          }),
        ]),
      }),
      gl: Object.freeze({
        titol: 'Nodo 0 no Mac mini M4 e Arquitectura de Resiliencia Rural 3-2-1',
        subtitol: 'PostgreSQL 17.11 na aldea, Time Machine local e Espello Navegable de 20 TB baixo socdepoble@socdepoble.org',
        entradeta:
          'O servidor físico Nodo 0 latexa na aldea con PostgreSQL 17.11 e sinaturas criptográficas Ed25519, protexido por unha tripla capa que garante que, aínda que salte a luz na casa co forno e o microondas, a web nunca cae nin se perde ningunha memoria.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Tres capas de protección para a soberanía de datos da aldea',
            paragrafs: Object.freeze([
              'A **Capa 1** é o **Nodo 0 no Mac mini M4** (`socdepoble.cat`) con **PostgreSQL 17.11** e recuperación automática de arranque; a **Capa 2** é a copia continua en disco físico local mediante **Time Machine**.',
              'A **Capa 3** é o **Espello Navegable nos 20 TB de Google Workspace Drive** baixo a conta institucional **`socdepoble@socdepoble.org`** (`Sóc de Poble · Mirall Sobirà Node 0/`), que combina copias atómicas de base de datos con carpetas de artigos e patrimonio lexibles por calquera persoa.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Continuidade total ante cortes eléctricos domésticos e cero segredos na nube',
            paragrafs: Object.freeze([
              'Se un corte eléctrico doméstico apaga temporalmente o Mac mini, o frontal **`socdepoble.org`** segue servindo todas as publicacións sen interrupción e o arquivo de Google Drive permanece 100% consultable desde o móbil ou o ordenador.',
              'Todas as credenciais vivas permanecen illadas no dispositivo físico con permisos estritos e o auditor automático impide que ningunha chave privada viaxe cara ao espello remoto.',
            ]),
          }),
        ]),
      }),
    }),
  }),

  'posse-mastodon-simetria': Object.freeze({
    id: 'posse-mastodon-simetria',
    dataPublicacio: '2026-11-04',
    ambit: 'mur',
    entitatId: 'elrentonar',
    enllacosCanonics: Object.freeze([
      'https://socdepoble.org/control',
      'https://socdepoble.org/mur',
      'https://socdepoble.org/page/fediversity',
    ]),
    idiomes: Object.freeze({
      ca: Object.freeze({
        titol: 'Publicar en casa i replicar al Fedivers amb la Safata de Conformitat POSSE',
        subtitol: 'Sóc de Poble, El Rentonar i Coordinadora enllacen sempre a socdepoble.org des de @depoble@mastodont.cat',
        entradeta:
          'Totes les publicacions noves i tot l\'arxiu històric migrable de WordPress i Blogger tenen com a casa única Sóc de Poble (`https://socdepoble.org`), mentre que Mastodon actua com a altaveu lliure i federat amb confirmació humana.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Safata de publicacions preparades i exclusió del Mercat comercial',
            paragrafs: Object.freeze([
              'En comptes d\'enviar missatges automàtics a cegues, el panell del Node 0 prepara cada peça editorial de **Sóc de Poble**, **El Rentonar** i la **Coordinadora d\'Estudis Eòlics del Comtat** amb el seu títol, resum, imatge i enllaç canònic a **`https://socdepoble.org/...`**.',
              'Els productes comercials del **Mercat** (com les garrafes d\'oli d\'oliva o fitxes amb preu) queden exclosos per defecte del canal editorial perquè el pont mantinga la seua puresa cultural i informativa, i cada peça es publica en prémer el botó **«Confirmar i publicar a Mastodon»**.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Llei de Simetria Universal perquè qualsevol veí connecte el seu compte',
            paragrafs: Object.freeze([
              'La mateixa ferramenta que impulsa **`@depoble@mastodont.cat`** i la identitat **`acct:socdepoble@socdepoble.org`** està oberta a qualsevol persona, associació o col·lectiu del poble.',
              'Qualsevol veí pot vincular el seu propi compte de Mastodon des del seu perfil i triar quines publicacions pròpies vol tindre preparades a la seua safata amb conformitat.',
            ]),
          }),
        ]),
      }),
      es: Object.freeze({
        titol: 'Publicar en casa y replicar en el Fediverso con la Bandeja de Conformidad POSSE',
        subtitol: 'Sóc de Poble, El Rentonar y Coordinadora enlazan siempre a socdepoble.org desde @depoble@mastodont.cat',
        entradeta:
          'Todas las publicaciones nuevas y todo el archivo histórico migrable de WordPress y Blogger tienen como casa única Sóc de Poble (`https://socdepoble.org`), mientras que Mastodon actúa como altavoz libre y federado con confirmación humana.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Bandeja de publicaciones preparadas y exclusión del Mercado comercial',
            paragrafs: Object.freeze([
              'En lugar de enviar mensajes automáticos a ciegas, el panel del Nodo 0 prepara cada pieza editorial de **Sóc de Poble**, **El Rentonar** y la **Coordinadora d\'Estudis Eòlics del Comtat** con su título, resumen, imagen y enlace canónico a **`https://socdepoble.org/...`**.',
              'Los productos comerciales del **Mercado** (como las garrafas de aceite de oliva o fichas con precio) quedan excluidos por defecto del canal editorial para que el puente mantenga su pureza cultural e informativa, y cada pieza se publica al pulsar el botón **«Confirmar y publicar en Mastodon»**.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Ley de Simetría Universal para que cualquier vecino conecte su cuenta',
            paragrafs: Object.freeze([
              'La misma herramienta que impulsa **`@depoble@mastodont.cat`** y la identidad **`acct:socdepoble@socdepoble.org`** está abierta a cualquier persona, asociación o colectivo del pueblo.',
              'Cualquier vecino puede vincular su propia cuenta de Mastodon desde su perfil y elegir qué publicaciones propias quiere tener preparadas en su bandeja con conformidad.',
            ]),
          }),
        ]),
      }),
      en: Object.freeze({
        titol: 'Publish on our own site and syndicate to the Fediverse with the POSSE Confirmation Tray',
        subtitol: 'Sóc de Poble, El Rentonar, and Coordinadora always link back to socdepoble.org from @depoble@mastodont.cat',
        entradeta:
          'All new publications and the entire historical archive migrated from WordPress and Blogger live canonically on Sóc de Poble (`https://socdepoble.org`), while Mastodon serves as an open federated loudspeaker with human confirmation.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Prepared publications tray and exclusion of commercial Market items',
            paragrafs: Object.freeze([
              'Instead of firing blind automated posts, the Node 0 panel prepares each editorial piece from **Sóc de Poble**, **El Rentonar**, and **Coordinadora d\'Estudis Eòlics del Comtat** with its title, summary, image, and canonical link to **`https://socdepoble.org/...`**.',
              'Commercial **Market** products (such as olive oil bottles or priced listings) are excluded by default from the editorial channel so the bridge preserves its cultural purpose, and each item is published only when clicking **“Confirm and publish to Mastodon”**.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Universal Symmetry Law so any neighbor can connect their own account',
            paragrafs: Object.freeze([
              'The exact same tool powering **`@depoble@mastodont.cat`** and the **`acct:socdepoble@socdepoble.org`** identity is available to every person, association, or collective in the village.',
              'Any neighbor can link their own Mastodon account from their profile and choose which of their publications are prepared in their confirmation tray.',
            ]),
          }),
        ]),
      }),
      eu: Object.freeze({
        titol: 'Etxean argitaratu eta Fedibertsoan zabaldu POSSE Adostasun Erretiluarekin',
        subtitol: 'Sóc de Poble, El Rentonar eta Coordinadorak beti socdepoble.org atarira lotzen dute @depoble@mastodont.cat kontutik',
        entradeta:
          'Argitalpen berri guztiek eta WordPress zein Bloggerretik ekarritako artxibo historiko osoak Sóc de Poble (`https://socdepoble.org`) dute etxe nagusi, eta Mastodonek bozgorailu libre eta federatu gisa dihardu giza baieztapenarekin.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Prestatutako argitalpenen erretilua eta Merkatu komertzialaren bazterketa',
            paragrafs: Object.freeze([
              'Mezu automatiko itsuak bidali beharrean, 0 Nodoaren panelak **Sóc de Poble**, **El Rentonar** eta **Coordinadora d\'Estudis Eòlics del Comtat** elkarteen eduki editorial bakoitza prestatzen du izenburu, laburpen, irudi eta **`https://socdepoble.org/...`** esteka kanonikoarekin.',
              '**Merkatuko** produktu komertzialak (olio-botilak edo preziodun fitxak, esaterako) kanpoan geratzen dira lehenespenez kanaleko izaera kulturala zaintzeko, eta ale bakoitza **«Baieztatu eta argitaratu Mastodonen»** botoia sakatzean soilik argitaratzen da.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Simetria Unibertsalaren Legea edozein bizilagunek bere kontua lotu dezan',
            paragrafs: Object.freeze([
              '**`@depoble@mastodont.cat`** eta **`acct:socdepoble@socdepoble.org`** identitatea elikatzen dituen tresna bera herriko edozein pertsona, elkarte edo kolektiboren eskura dago.',
              'Edozein bizilagunek bere Mastodon kontua lotu dezake bere profiletik eta bere zein argitalpen prestatu nahi dituen aukeratu.',
            ]),
          }),
        ]),
      }),
      gl: Object.freeze({
        titol: 'Publicar na casa e replicar no Fediverso coa Bandexa de Conformidade POSSE',
        subtitol: 'Sóc de Poble, El Rentonar e Coordinadora enlazan sempre a socdepoble.org desde @depoble@mastodont.cat',
        entradeta:
          'Todas as publicacións novas e todo o arquivo histórico migrable de WordPress e Blogger teñen como casa única Sóc de Poble (`https://socdepoble.org`), mentres que Mastodon actúa como altofalante libre e federado con confirmación humana.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Bandexa de publicacións preparadas e exclusión do Mercado comercial',
            paragrafs: Object.freeze([
              'En vez de enviar mensaxes automáticas ás cegas, o panel do Nodo 0 prepara cada peza editorial de **Sóc de Poble**, **El Rentonar** e a **Coordinadora d\'Estudis Eòlics del Comtat** co seu título, resumo, imaxe e ligazón canónica a **`https://socdepoble.org/...`**.',
              'Os produtos comerciais do **Mercado** (como as garrafas de aceite de oliva ou fichas con prezo) quedan excluídos por defecto da canle editorial para que a ponte manteña a súa pureza cultural e informativa, e cada peza publícase ao premer o botón **«Confirmar e publicar en Mastodon»**.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Lei de Simetría Universal para que calquera veciño conecte a súa conta',
            paragrafs: Object.freeze([
              'A mesma ferramenta que impulsa **`@depoble@mastodont.cat`** e a identidade **`acct:socdepoble@socdepoble.org`** está aberta a calquera persoa, asociación ou colectivo da aldea.',
              'Calquera veciño pode vincular a súa propia conta de Mastodon desde o seu perfil e escoller que publicacións propias quere ter preparadas na súa bandexa con conformidade.',
            ]),
          }),
        ]),
      }),
    }),
  }),

  'autopia-usuari-estudi-mastodon': Object.freeze({
    id: 'autopia-usuari-estudi-mastodon',
    dataPublicacio: '2026-11-04',
    ambit: 'mur',
    entitatId: 'socdepoble',
    enllacosCanonics: Object.freeze([
      'https://socdepoble.org/control',
      'https://socdepoble.org/connectar',
      'https://socdepoble.org/page/fediversity',
    ]),
    idiomes: Object.freeze({
      ca: Object.freeze({
        titol: 'Autopia d\'Usuari i Sobirania Ciutadana inspirada en el programari lliure de Mastodon',
        subtitol: 'Identitat verificada amb enllaç recíproc, filtres amb caducitat i Oblit Saludable que protegeix el patrimoni',
        entradeta:
          'L\'estudi d\'enginyeria del codi lliure de Mastodon (`AGPLv3`) s\'integra amb la Llei de la Pedra Seca per oferir als veïns i entitats el control total sobre la seua identitat, la seua privacitat i la memòria històrica del poble.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Verificació descentralitzada amb enllaç recíproc i filtres per context',
            paragrafs: Object.freeze([
              'Les fitxes públiques de Sóc de Poble incorporen l\'etiqueta estàndard **`rel="me"`** perquè Mastodon verifique amb el distintiu verd que el perfil pertany legítimament a **`https://socdepoble.org`**, sense dependre de cap autoritat central.',
              'A més, cada persona disposa de **filtres per superfície** (Mur, Notificacions, Converses, Perfils i Fedivers) amb **data de caducitat** i opció d\'avís desplegable o d\'ocultació neta.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Oblit Saludable Rural que blinda les cròniques històriques',
            paragrafs: Object.freeze([
              'La nova política de retenció permet que els avisos efímers ja passats (com un trajecte de **Vehicle Compartit** de la setmana passada) caduquen de manera ordenada per no embossar l\'espai comú.',
              'Al mateix temps, el motor **blinda de manera inviolable** totes les cròniques i arxius de **Sóc de Poble**, **El Rentonar** i la **Coordinadora d\'Estudis Eòlics del Comtat**, així com les publicacions fixades i els marcadors personals.',
            ]),
          }),
        ]),
      }),
      es: Object.freeze({
        titol: 'Autopía de Usuario y Soberanía Ciudadana inspirada en el software libre de Mastodon',
        subtitol: 'Identidad verificada con enlace recíproco, filtros con caducidad y Olvido Saludable que protege el patrimonio',
        entradeta:
          'El estudio de ingeniería del código libre de Mastodon (`AGPLv3`) se integra con la Ley de la Piedra Seca para ofrecer a los vecinos y entidades el control total sobre su identidad, su privacidad y la memoria histórica del pueblo.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Verificación descentralizada con enlace recíproco y filtros por contexto',
            paragrafs: Object.freeze([
              'Las fichas públicas de Sóc de Poble incorporan la etiqueta estándar **`rel="me"`** para que Mastodon verifique con el distintivo verde que el perfil pertenece legítimamente a **`https://socdepoble.org`**, sin depender de ninguna autoridad central.',
              'Además, cada persona dispone de **filtros por superficie** (Muro, Notificaciones, Conversaciones, Perfiles y Fediverso) con **fecha de caducidad** y opción de aviso desplegable o de ocultación limpia.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Olvido Saludable Rural que blinda las crónicas históricas',
            paragrafs: Object.freeze([
              'La nueva política de retención permite que los avisos efímeros ya pasados (como un trayecto de **Vehículo Compartido** de la semana pasada) caduquen de forma ordenada para no saturar el espacio común.',
              'Al mismo tiempo, el motor **blinda de manera inviolable** todas las crónicas y archivos de **Sóc de Poble**, **El Rentonar** y la **Coordinadora d\'Estudis Eòlics del Comtat**, así como las publicaciones fijadas y los marcadores personales.',
            ]),
          }),
        ]),
      }),
      en: Object.freeze({
        titol: 'User Autopia and Citizen Sovereignty inspired by Mastodon free software',
        subtitol: 'Verified identity with reciprocal links, expiring filters, and Healthy Forgetting that protects heritage',
        entradeta:
          'Our engineering study of Mastodon free software (`AGPLv3`) merges with the Dry Stone Law to give neighbors and local entities full control over their identity, privacy, and village historical memory.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Decentralized verification with reciprocal links and context filters',
            paragrafs: Object.freeze([
              'Public profiles on Sóc de Poble emit the standard **`rel="me"`** tag so Mastodon verifies with a green check that the profile legitimately belongs to **`https://socdepoble.org`**, without relying on any central authority.',
              'In addition, every neighbor has **per-surface filters** (Wall, Notifications, Conversations, Profiles, and Fediverse) with an **expiration date** and a choice between a collapsible warning or clean hiding.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Rural Healthy Forgetting that shields historical chronicles',
            paragrafs: Object.freeze([
              'The retention policy lets past ephemeral notices (such as a **Carpool** ride from last week) expire cleanly so the shared space stays uncluttered.',
              'At the same time, the engine **inviolably shields** all chronicles and archives from **Sóc de Poble**, **El Rentonar**, and **Coordinadora d\'Estudis Eòlics del Comtat**, as well as pinned posts and personal bookmarks.',
            ]),
          }),
        ]),
      }),
      eu: Object.freeze({
        titol: 'Erabiltzailearen Autopia eta Herritarren Burujabetza Mastodonen software librean oinarrituta',
        subtitol: 'Esteka elkarrekikoarekin egiaztatutako identitatea, iraungitze-iragazkiak eta ondarea babesten duen Ahazte Osasungarria',
        entradeta:
          'Mastodonen kode librearen (`AGPLv3`) ingeniaritza-azterketa Harri Lehorraren Legearekin uztartzen da, bizilagunei eta elkarteei beren identitatearen, pribatutasunaren eta herriko memoria historikoaren gaineko kontrol osoa emateko.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Egiaztapen deszentralizatua esteka elkarrekikoarekin eta testuinguru-iragazkiak',
            paragrafs: Object.freeze([
              'Sóc de Pobleko fitxa publikoek **`rel="me"`** etiketa estandarra daramate, Mastodonek ikur berdearekin egiaztatu dezan profila **`https://socdepoble.org`** domeinuarena dela, inongo agintaritza zentralen menpe egon gabe.',
              'Horrez gain, pertsona bakoitzak **azalera bakoitzerako iragazkiak** ditu (Horma, Jakinarazpenak, Elkarrizketak, Profilak eta Fedibertsoa) **iraungitze-datarekin** eta abisu tolesgarriaren edo ezkutatze garbiaren aukerarekin.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Kronika historikoak blindatzen dituen Landako Ahazte Osasungarria',
            paragrafs: Object.freeze([
              'Atxikipen-politika berriari esker, igarotako ohar iragankorrak (aurreko asteko **Ibilgailu Partekatuko** bidaia bat, adibidez) modu ordenatuan iraungitzen dira espazio komuna ez betetzeko.',
              'Aldi berean, motorrak **modu bortxaezinean blindatzen ditu** **Sóc de Poble**, **El Rentonar** eta **Coordinadora d\'Estudis Eòlics del Comtat** elkarteen kronika eta artxibo guztiak, baita finkatutako argitalpenak eta laster-markak ere.',
            ]),
          }),
        ]),
      }),
      gl: Object.freeze({
        titol: 'Autopía de Usuario e Soberanía Cidadá inspirada no software libre de Mastodon',
        subtitol: 'Identidade verificada con ligazón recíproca, filtros con caducidade e Esquecemento Saudable que protexe o patrimonio',
        entradeta:
          'O estudo de enxeñaría do código libre de Mastodon (`AGPLv3`) intégrase coa Lei da Pedra Seca para ofrecer aos veciños e entidades o control total sobre a súa identidade, a súa privacidade e a memoria histórica da aldea.',
        seccions: Object.freeze([
          Object.freeze({
            titolH3: 'Verificación descentralizada con ligazón recíproca e filtros por contexto',
            paragrafs: Object.freeze([
              'As fichas públicas de Sóc de Poble incorporan a etiqueta estándar **`rel="me"`** para que Mastodon verifique co distintivo verde que o perfil pertence lexitimamente a **`https://socdepoble.org`**, sen depender de ningunha autoridade central.',
              'Ademais, cada persoa dispón de **filtros por superficie** (Muro, Notificacións, Conversas, Perfís e Fediverso) con **data de caducidade** e opción de aviso despregable ou de ocultación limpa.',
            ]),
          }),
          Object.freeze({
            titolH3: 'Esquecemento Saudable Rural que blinda as crónicas históricas',
            paragrafs: Object.freeze([
              'A nova política de retención permite que os avisos efémeros xa pasados (como un traxecto de **Vehículo Compartido** da semana pasada) caduquen de xeito ordenado para non saturar o espazo común.',
              'Ao mesmo tempo, o motor **blinda de xeito inviolable** todas as crónicas e arquivos de **Sóc de Poble**, **El Rentonar** e a **Coordinadora d\'Estudis Eòlics del Comtat**, así como as publicacións fixadas e os marcadores persoais.',
            ]),
          }),
        ]),
      }),
    }),
  }),
});

/**
 * Retorna totes les cròniques d'actualització del 04-11-2026 en l'idioma sol·licitat
 * (amb reserva segura a `'ca'`).
 *
 * @param {string} [idioma='ca']
 * @returns {Array<Record<string, any>>}
 */
export function obteFitesArquitectura261104(idioma = 'ca') {
  const lang = IDIOMES_OFICIALS_FITES.includes(idioma) ? idioma : 'ca';
  return IDS_FITES_261104.map((idFita) => obteCronicaFita261104(idFita, lang));
}

/**
 * Retorna una crònica concreta del 04-11-2026 localitzada en l'idioma indicat.
 *
 * @param {string} idFita
 * @param {string} [idioma='ca']
 */
export function obteCronicaFita261104(idFita, idioma = 'ca') {
  const fita = CATALOG_FITES_261104[idFita];
  if (!fita) {
    throw new Error(`Fita editorial desconeguda: ${idFita}`);
  }
  const lang = IDIOMES_OFICIALS_FITES.includes(idioma) ? idioma : 'ca';
  const traduccio = fita.idiomes[lang];
  return Object.freeze({
    id: fita.id,
    idioma: lang,
    dataPublicacio: fita.dataPublicacio,
    ambit: fita.ambit,
    entitatId: fita.entitatId,
    compteInstitucionalCanonic: METADADES_INSTITUCIONALS_261104.compteInstitucionalCanonic,
    webfingerCanonic: METADADES_INSTITUCIONALS_261104.webfingerCanonic,
    enllacosCanonics: fita.enllacosCanonics,
    titol: traduccio.titol,
    subtitol: traduccio.subtitol,
    entradeta: traduccio.entradeta,
    seccions: traduccio.seccions,
  });
}

/**
 * Renderitza una crònica del 04-11-2026 en format Markdown canònic de Pedra Seca
 * (un sol H1, seguit d'H2, entradeta en bloc destacat, seccions H3 sense salts i vincles finals).
 *
 * @param {string} idFita
 * @param {string} [idioma='ca']
 * @returns {string}
 */
export function renderitzaCronicaMarkdownPedraSeca(idFita, idioma = 'ca') {
  const cronica = obteCronicaFita261104(idFita, idioma);
  const blocsSeccions = cronica.seccions.flatMap((sec) => [
    `### ${sec.titolH3}`,
    '',
    ...sec.paragrafs.flatMap((p) => [p, '']),
  ]);

  const liniesEnllacos = cronica.enllacosCanonics.map((url) => `- [${url}](${url})`);

  return [
    `# ${cronica.titol}`,
    '',
    `## ${cronica.subtitol}`,
    '',
    `> ${cronica.entradeta}`,
    '',
    ...blocsSeccions,
    '### Vincles',
    '',
    ...liniesEnllacos,
    '',
  ].join('\n');
}

/**
 * Valida la paritat en els 5 idiomes oficials (`ca`, `es`, `en`, `eu`, `gl`),
 * l'estructura jeràrquica H1 → H2 → entradeta → H3, la presència de negretes escanejables,
 * l'absència de llatinismes o argot prohibit i la validesa de tots els enllaços canònics.
 *
 * @returns {{ valid: boolean, errors: string[], totalFites: number, idiomesVerificats: string[] }}
 */
export function validaQualitatEditorialFites261104() {
  const errors = [];

  for (const idFita of IDS_FITES_261104) {
    const fita = CATALOG_FITES_261104[idFita];
    if (!fita) {
      errors.push(`Falta la fita ${idFita}`);
      continue;
    }

    for (const url of fita.enllacosCanonics) {
      if (!RUTES_CANONIQUES_PERMESES.includes(url)) {
        errors.push(`Enllaç no canònic a ${idFita}: ${url}`);
      }
    }

    const nombreSeccionsBase = fita.idiomes.ca?.seccions?.length ?? 0;
    if (nombreSeccionsBase < 2) {
      errors.push(`La fita ${idFita} ha de tindre almenys 2 seccions H3.`);
    }

    for (const lang of IDIOMES_OFICIALS_FITES) {
      const bloc = fita.idiomes[lang];
      if (!bloc) {
        errors.push(`Falta l'idioma ${lang} en la fita ${idFita}`);
        continue;
      }
      if (!bloc.titol || !bloc.subtitol || !bloc.entradeta) {
        errors.push(`Falten H1/H2/entradeta en ${idFita} (${lang})`);
      }
      if (!Array.isArray(bloc.seccions) || bloc.seccions.length !== nombreSeccionsBase) {
        errors.push(`Desajust de seccions H3 en ${idFita} (${lang})`);
      }

      const md = renderitzaCronicaMarkdownPedraSeca(idFita, lang);
      for (const reProhibit of TERMES_PROHIBITS_EDITORIAL) {
        if (reProhibit.test(md)) {
          errors.push(`Terme prohibit (${reProhibit}) detectat en ${idFita} (${lang})`);
        }
      }
      if (!md.includes('**')) {
        errors.push(`Falten negretes escanejables en ${idFita} (${lang})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalFites: IDS_FITES_261104.length,
    idiomesVerificats: [...IDIOMES_OFICIALS_FITES],
  };
}
