/**
 * Onada R27 · Paritat editorial 1:1 en les 5 llengües per a /page/descarregues.
 * Conserva intacte el cos en valencià de PAGE_COPY.descarregues i n'aporta les
 * quatre traduccions (es, en, eu, gl) amb la mateixa estructura jeràrquica
 * (6 H3, 8 H4 —inclòs l'encapçalament de guia que cerca InstalaLaPwa.jsx—,
 * 3 subtargetes amb H5, el botonaco oficial de l'App Store centrat dins de
 * .sdp-accions i els tres enllaços externs verificats).
 * R28 (carril B, Llei 0) · Paritat de fets 1:1 amb el valencià: cap traducció
 * diu res que el cos en valencià no diga (fora la integració amb WordPress
 * 7.0–7.2 i l'exportació en JSON verificable, que el valencià no afirma), i
 * Google Play, igual que en valencià, promet «l'enllaç a la botiga», no un botó.
 * canalsDeBotiga.test.js passa la guarda B9 de botiga tancada sobre cada llengua.
 * Onada v1.2.16 (ordres del Mestre 261121 01:32 i 01:55: ZERO APK fora de botiga) ·
 * L'H4 de l'APK diu en cada llengua el mateix que el valencià: cap APK fora de Google
 * Play, per què, i que ningú de Sóc de Poble no demanarà mai instal·lar-ne cap.
 */
/* Onada R29 · R29-02-6b · En basc, el connector de WordPress és «konektorea», com a la resta de pàgines. */
export const TRADUCCIONS_DESCARREGUES = Object.freeze({
  es: {
    title: 'Descargas y Aplicaciones',
    subtitle: 'El pueblo, en tu dispositivo',
    lead: 'La aplicación para iPhone e iPad ya está en el App Store, y la web está abierta a todo el mundo. Aquí encontrarás cómo instalarla desde la tienda o desde el navegador, y cómo acceder hoy desde Android.',
    imageAlt: 'Ilustración de cómic: en el patio de piedra del pueblo, un caldero de cobre lleno de válvulas, engranajes y cables hierve sobre el fuego y, por un canal, caen a una cesta pequeños robots y cerebros con patitas; un hombre con gorra y una abuela con lupa examinan uno cada uno, el perro mordisquea un aparato y una gallina picotea en el suelo',
    labels: [
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: 'Descargas', className: 'sdp-badge-category' },
      { text: 'Multiplataforma', className: 'sdp-badge-tag' }
    ],
    html: `
      <h3>La misma aplicación, en cada dispositivo</h3>
      <p>Sóc de Poble es una <strong>única aplicación</strong> para el <strong>móvil</strong>, la <strong>tableta</strong> y el <strong>ordenador</strong>, con la <strong>misma cuenta</strong> y conversaciones en todas partes. Aquí te explicamos, sin letra pequeña, cómo puedes tenerla hoy, qué caminos aún <strong>no están abiertos</strong> para todo el mundo y cuáles llegarán después.</p>
      <p>Una <strong>promesa</strong>: esta página <strong>no enlaza tiendas</strong> que todavía <strong>no están abiertas</strong>. Cuando un camino se abra para <strong>todo el mundo</strong>, el enlace aparecerá aquí.</p>

      <h3>Android</h3>
      <h4>Google Play</h4>
      <p>La aplicación para Android ya está dada de alta en <strong>Google Play</strong>, pero todavía <strong>no está publicada</strong> en abierto: de momento solo pueden instalarla las personas del <strong>grupo de verificadores</strong> que hemos <strong>invitado</strong>. Google exige que al menos <strong>12 personas</strong> la instalen desde Google Play y la mantengan <strong>14 días</strong> seguidos antes de publicarla para todo el público. Cuando su ficha sea <strong>pública</strong>, el enlace a la tienda aparecerá en esta página.</p>
      <p>Si tu <strong>cuenta de Google</strong> forma parte del <strong>grupo de verificadores</strong>, sigue estos <strong>tres pasos</strong> desde el <strong>móvil Android</strong>, con la misma cuenta que utilizas en Google Play. La dirección del primer paso <strong>no es la ficha</strong> pública de la tienda: es la página donde Google registra a los verificadores, y solo se abre con una <strong>cuenta invitada</strong>.</p>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>Los tres pasos en Google Play</h5>
        <ol>
          <li><strong>Paso 1 · Pantalla 1.</strong> Entra en <a href="https://play.google.com/apps/testing/org.socdepoble.app" target="_blank" rel="noopener noreferrer">play.google.com/apps/testing/org.socdepoble.app</a> y pulsa el <strong>botón azul grande</strong> «<strong>Become a tester</strong>» (Convertirse en verificador).</li>
          <li><strong>Paso 2 · Pantalla 2, «You're a tester».</strong> <strong>NO</strong> toques el botón inferior, «<strong>Leave the program</strong>»: saldrías del grupo. Toca el <strong>enlace azul</strong> al final del <strong>segundo párrafo</strong>, el que dice «<strong>download it on Google Play</strong>».</li>
          <li><strong>Paso 3 · Pantalla 3, Google Play.</strong> Pulsa «<strong>Instalar</strong>» y deja la aplicación <strong>instalada</strong> en el móvil. Es <strong>imprescindible</strong>: Google solo cuenta entre los <strong>12 verificadores</strong> a quien la mantiene instalada durante los <strong>14 días</strong>.</li>
        </ol>
      </div>
      <p>Si no formas parte del grupo, en Android puedes utilizarla directamente desde el <strong>navegador</strong> e instalarla como una <strong>aplicación web</strong> (te lo explicamos más abajo).</p>
      <h4>Ningún APK fuera de la tienda</h4>
      <p>Sóc de Poble <strong>no ofrece</strong> ningún archivo de instalación de Android (<strong>APK</strong>) fuera de <strong>Google Play</strong>: con la <strong>Protección Avanzada</strong> de Android activada, el teléfono no deja instalar aplicaciones de fuera de la tienda, y desde Google Play la aplicación se <strong>actualiza sola</strong>. <strong>Nadie</strong> de Sóc de Poble te pedirá nunca que instales un APK ni que desactives esa protección.</p>

      <h3>iPhone e iPad</h3>
      <h4>App Store</h4>
      <p>Sóc de Poble ya está en el <strong>App Store</strong> de Apple para <strong>iPhone</strong> e <strong>iPad</strong>, <strong>gratis</strong>: Apple publicó la <strong>versión 1.0</strong> el <strong>6 de noviembre de 2026</strong>, y requiere <strong>iOS o iPadOS 16</strong> o posterior. La encontrarás buscando «Sóc de Poble» en el App Store o con este botón, que lleva directamente a su ficha:</p>
      <div class="sdp-accions"><a class="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href="https://apps.apple.com/es/app/soc-de-poble/id6826441844" target="_blank" rel="noopener noreferrer">Disponible en el App Store</a></div>
      <p>También puedes utilizarla desde <strong>Safari</strong> y añadirla a la <strong>pantalla de inicio</strong> (te lo explicamos más abajo).</p>

      <h3>En el ordenador y desde cualquier navegador</h3>
      <p>Para utilizar Sóc de Poble <strong>no hace falta descargar</strong> nada: abre <strong>socdepoble.org</strong> en un navegador actualizado (Chrome, Edge, Firefox o Safari) y ya estás dentro. Y, si quieres, puedes <strong>instalarla</strong> como una aplicación: es una aplicación web instalable (<strong>PWA</strong>), que se abre en su propia <strong>ventana</strong> y con su <strong>icono</strong>, como cualquier otro programa.</p>
      <h4>Cómo se instala desde el navegador</h4>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>En el ordenador</h5>
        <ul>
          <li><strong>Chrome y Edge (Windows, Mac y Linux):</strong> abre socdepoble.org, pulsa el <strong>menú del navegador</strong> (los <strong>tres puntos</strong> arriba a la derecha) y elige la opción de <strong>instalar</strong> Sóc de Poble como aplicación. Si en la barra de direcciones aparece el <strong>icono de instalar</strong>, también sirve.</li>
          <li><strong>Safari en Mac (macOS Sonoma o posterior):</strong> abre el <strong>menú Archivo</strong> y elige «Añadir al Dock».</li>
          <li><strong>Firefox:</strong> funciona <strong>como web</strong>, aunque según la versión puede <strong>no ofrecerte</strong> instalarla como aplicación.</li>
        </ul>
      </div>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>En el móvil y en la tableta</h5>
        <ul>
          <li><strong>Chrome en Android:</strong> el menú de los <strong>tres puntos</strong> y «Instalar aplicación» o «Añadir a pantalla de inicio».</li>
          <li><strong>Safari en iPhone e iPad:</strong> el <strong>botón Compartir</strong> (el cuadro con la flecha hacia arriba) y «Añadir a pantalla de inicio».</li>
        </ul>
      </div>
      <p>El <strong>nombre exacto</strong> de cada opción <strong>cambia</strong> según la <strong>versión</strong> y el <strong>idioma</strong> del navegador.</p>
      <h4>Windows, Mac y Linux: lo que vendrá</h4>
      <p>Hoy, en el ordenador, la aplicación es la <strong>web instalable</strong>, que ya funciona en <strong>Windows</strong>, <strong>Mac</strong> y <strong>Linux</strong>. Todavía no existe <strong>ningún programa</strong> nativo descargable para estos sistemas: es un camino previsto para el <strong>futuro</strong> y, cuando esté listo, aparecerá aquí.</p>

      <h3>En la web de tu pueblo, con WordPress</h3>
      <p>Si tu ayuntamiento, asociación o colectivo ya tiene una web en <strong>WordPress</strong>, <strong>no hace falta cambiarla</strong>: el <strong>conector</strong> de Sóc de Poble integra la aplicación en una <strong>página</strong> mediante un <strong>código corto</strong> o un <strong>bloque</strong> del editor, tal como ya hace la web de Gent de la Torre.</p>
      <h4>WordPress.org</h4>
      <p>El conector oficial de Sóc de Poble, con el nombre «socdepoble», ya es <strong>público</strong> en el directorio oficial de <strong>WordPress.org</strong>, en la <strong>versión 1.1.12</strong>: <a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>. Un ayuntamiento, asociación o colectivo puede <strong>buscarlo</strong>, <strong>instalarlo</strong> y <strong>activarlo</strong> desde el panel de su WordPress.</p>
      <p>Para mostrar la aplicación en una página <strong>basta</strong> con el <strong>código corto</strong> <code>[socdepoble_app poble="la-torre-de-les-macanes"]</code>, indicando el <strong>identificador</strong> del pueblo (en este ejemplo, La Torre de les Maçanes), y con la <strong>plantilla</strong> «Sóc de Poble · full screen», que se selecciona en el <strong>cuadro Plantilla</strong> de la página. Es lo que ya utiliza <strong>gentdelatorre.net</strong>, la web de Gent de la Torre.</p>

      <h3>Cómo funciona por dentro: hoy y mañana</h3>
      <h4>Hoy: conectada para ir deprisa</h4>
      <p>Hoy Sóc de Poble necesita <strong>internet</strong> para todo lo que compartimos: las conversaciones, el Muro, el Mercado o los perfiles viven en el servidor de datos de Sóc de Poble (<strong>Supabase</strong>), que es la única <strong>fuente de verdad</strong> y permite que lo que publicas llegue enseguida al resto del pueblo. Lo decidimos así a <strong>conciencia</strong> (la decisión de arquitectura «online-first», ADR-2026-08): preferimos una aplicación rápida y <strong>honesta</strong>, que indique con claridad cuándo <strong>no hay red</strong>, antes que prometer uso sin conexión y perder datos.</p>
      <h4>Mañana: autonomía sin red</h4>
      <p>Nuestra <strong>vocación</strong> es que, algún día, Sóc de Poble funcione también <strong>sin internet</strong>: que los datos del pueblo vivan primero en tu <strong>dispositivo</strong> y se sincronicen solos con los del resto cuando vuelva la conexión. La familia de técnicas que puede hacerlo posible se llama <strong>CRDT</strong> (estructuras de datos que pueden <strong>unirse</strong> sin conflictos), y encaja con nuestra forma de construir, la <strong>Pedra Seca</strong>: piezas que se sostienen solas, sin cemento.</p>
      <p>Ahora bien, seamos claros: hoy eso es una <strong>visión</strong>, no una <strong>función activa</strong>. Todavía no está construido, y antes de abordarlo hará falta una nueva <strong>decisión de arquitectura</strong> que revise la actual. Lo que sí existe es la <strong>base</strong> para hacerlo posible: la interfaz habla con los datos mediante un <strong>puerto neutral</strong>, de modo que cambiar el origen de los datos no obliga a rehacer la aplicación, y algunas <strong>herramientas</strong> que solo trabajan con tus datos ya los guardan en tu <strong>dispositivo</strong>.</p>
      <p>Esta página <strong>se actualizará</strong> cada vez que se abra un <strong>camino nuevo</strong>.</p>
    `
  },
  en: {
    title: 'Downloads and Apps',
    subtitle: 'Your village, on your device',
    lead: 'The app for iPhone and iPad is now on the App Store, and the web app is open to everyone. Here you will find how to install it from the store or from your browser, and how to access it on Android today.',
    imageAlt: 'Comic illustration: in the stone courtyard of the village, a copper cauldron full of valves, gears and cables boils over the fire and tiny robots and little brains on legs slide down a chute into a basket; a man in a cap and a grandmother with a magnifying glass inspect one each, a dog chews on a gadget and a hen pecks at the ground',
    labels: [
      { text: 'System', className: 'sdp-badge-system' },
      { text: 'Downloads', className: 'sdp-badge-category' },
      { text: 'Cross-platform', className: 'sdp-badge-tag' }
    ],
    html: `
      <h3>The same application, on every device</h3>
      <p>Sóc de Poble is a <strong>single application</strong> for your <strong>phone</strong>, <strong>tablet</strong> and <strong>computer</strong>, with the <strong>same account</strong> and conversations everywhere. Here we explain, with no fine print, how you can get it today, which channels are <strong>not yet open</strong> to everyone and what will come next.</p>
      <p>One <strong>promise</strong>: this page <strong>never links to stores</strong> that are <strong>not yet open</strong>. Whenever a new channel opens for <strong>everyone</strong>, its link will appear right here.</p>

      <h3>Android</h3>
      <h4>Google Play</h4>
      <p>The Android app is registered on <strong>Google Play</strong>, but it is <strong>not yet published</strong> publicly: for now, only members of the <strong>invited tester group</strong> can install it. Google requires at least <strong>12 people</strong> to install the app from Google Play and keep it installed for <strong>14 consecutive days</strong> before opening public release. Once its listing is <strong>public</strong>, the link to the store will appear on this page.</p>
      <p>If your <strong>Google account</strong> is in the <strong>tester group</strong>, follow these <strong>three steps</strong> on your <strong>Android phone</strong> using the same account signed into Google Play. The first link is <strong>not the public store listing</strong>: it is Google's tester opt-in page, which only opens for an <strong>invited account</strong>.</p>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>The three steps on Google Play</h5>
        <ol>
          <li><strong>Step 1 · Screen 1.</strong> Open <a href="https://play.google.com/apps/testing/org.socdepoble.app" target="_blank" rel="noopener noreferrer">play.google.com/apps/testing/org.socdepoble.app</a> and tap the <strong>large blue button</strong> “<strong>Become a tester</strong>”.</li>
          <li><strong>Step 2 · Screen 2, “You're a tester”.</strong> Do <strong>NOT</strong> tap the bottom button, “<strong>Leave the program</strong>”, or you will leave the group. Tap the <strong>blue link</strong> at the end of the <strong>second paragraph</strong> that says “<strong>download it on Google Play</strong>”.</li>
          <li><strong>Step 3 · Screen 3, Google Play.</strong> Tap “<strong>Install</strong>” and keep the app <strong>installed</strong> on your phone. This is <strong>essential</strong>: Google only counts among the <strong>12 testers</strong> those who keep it installed throughout the <strong>14 days</strong>.</li>
        </ol>
      </div>
      <p>If you are not in the tester group, on Android you can use Sóc de Poble straight from your <strong>browser</strong> and install it as a <strong>web app</strong> (explained below).</p>
      <h4>No APK outside the store</h4>
      <p>Sóc de Poble <strong>offers no</strong> Android installation package (<strong>APK</strong>) outside <strong>Google Play</strong>: with Android's <strong>Advanced Protection</strong> turned on, the phone won't install apps from outside the store, and from Google Play the app <strong>updates itself</strong>. <strong>No one</strong> from Sóc de Poble will ever ask you to install an APK or to turn that protection off.</p>

      <h3>iPhone and iPad</h3>
      <h4>App Store</h4>
      <p>Sóc de Poble is available on Apple's <strong>App Store</strong> for <strong>iPhone</strong> and <strong>iPad</strong>, <strong>free of charge</strong>: Apple published <strong>version 1.0</strong> on <strong>6 November 2026</strong>, requiring <strong>iOS or iPadOS 16</strong> or later. Search for “Sóc de Poble” on the App Store or use this button to go straight to the listing:</p>
      <div class="sdp-accions"><a class="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href="https://apps.apple.com/es/app/soc-de-poble/id6826441844" target="_blank" rel="noopener noreferrer">Download on the App Store</a></div>
      <p>You can also use it in <strong>Safari</strong> and add it to your <strong>Home Screen</strong> (explained below).</p>

      <h3>On your computer and from any browser</h3>
      <p>You <strong>do not need to download</strong> anything to use Sóc de Poble: open <strong>socdepoble.org</strong> in an up-to-date browser (Chrome, Edge, Firefox or Safari) and you are in. If you wish, you can also <strong>install</strong> it as an app: it is an installable Progressive Web App (<strong>PWA</strong>) that opens in its own <strong>window</strong> with its own <strong>icon</strong>, just like any desktop programme.</p>
      <h4>How to install from your browser</h4>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>On a computer</h5>
        <ul>
          <li><strong>Chrome and Edge (Windows, Mac and Linux):</strong> open socdepoble.org, click the <strong>browser menu</strong> (the <strong>three dots</strong> at the top right) and choose the option to <strong>install</strong> Sóc de Poble as an app. If an <strong>install icon</strong> appears in the address bar, that works too.</li>
          <li><strong>Safari on Mac (macOS Sonoma or later):</strong> open the <strong>File menu</strong> and choose “Add to Dock”.</li>
          <li><strong>Firefox:</strong> works <strong>as a website</strong>, though depending on the version it may <strong>not offer</strong> standalone app installation.</li>
        </ul>
      </div>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>On phones and tablets</h5>
        <ul>
          <li><strong>Chrome on Android:</strong> open the <strong>three-dot</strong> menu and tap “Install app” or “Add to Home screen”.</li>
          <li><strong>Safari on iPhone and iPad:</strong> tap the <strong>Share button</strong> (the square with the upward arrow) and choose “Add to Home Screen”.</li>
        </ul>
      </div>
      <p>The <strong>exact wording</strong> of each menu item <strong>varies</strong> depending on your browser <strong>version</strong> and <strong>language</strong>.</p>
      <h4>Windows, Mac and Linux: what is coming</h4>
      <p>Today on desktop computers, the app is the <strong>installable web app</strong>, which already runs on <strong>Windows</strong>, <strong>Mac</strong> and <strong>Linux</strong>. There is not yet a <strong>separate native installer</strong> for these systems: it is planned for the <strong>future</strong>, and when ready it will be listed here.</p>

      <h3>On your village website, with WordPress</h3>
      <p>If your municipality, association or community group already runs a <strong>WordPress</strong> site, <strong>there is no need to replace it</strong>: the Sóc de Poble <strong>plugin</strong> embeds the application on a <strong>page</strong> with a <strong>shortcode</strong> or an editor <strong>block</strong>, just like Gent de la Torre's website does today.</p>
      <h4>WordPress.org</h4>
      <p>The official Sóc de Poble plugin, named “socdepoble”, is <strong>publicly listed</strong> in the official <strong>WordPress.org</strong> directory at <strong>version 1.1.12</strong>: <a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>. A town council, an association or a local group can <strong>search</strong> for it, <strong>install</strong> it and <strong>activate</strong> it from their WordPress dashboard.</p>
      <p>Embedding the app on a page only takes the <strong>shortcode</strong> <code>[socdepoble_app poble="la-torre-de-les-macanes"]</code> with the village <strong>identifier</strong> (here, <strong>La Torre de les Maçanes</strong>) and the “Sóc de Poble · full screen” <strong>template</strong> selected in the page's <strong>Template panel</strong>. That is exactly how <strong>gentdelatorre.net</strong>, the <strong>Gent de la Torre</strong> community site, runs it today.</p>

      <h3>How it works under the hood: today and tomorrow</h3>
      <h4>Today: connected so it stays fast</h4>
      <p>Today Sóc de Poble requires an <strong>internet connection</strong> for everything shared: conversations, the Wall, the Market and profiles live on Sóc de Poble's data server (<strong>Supabase</strong>), the single <strong>source of truth</strong> ensuring that what you post reaches the rest of the village immediately. We chose this <strong>deliberately</strong> (the “online-first” architecture decision, ADR-2026-08): we prefer a fast, <strong>honest</strong> app that states clearly when <strong>offline</strong> rather than one that promises offline sync and loses data.</p>
      <h4>Tomorrow: offline autonomy</h4>
      <p>Our long-term <strong>aim</strong> is for Sóc de Poble to work <strong>offline</strong> as well: keeping village data first on your <strong>device</strong> and merging cleanly when connectivity returns. The family of techniques that could make this possible is called <strong>CRDTs</strong> (conflict-free replicated data types that <strong>merge</strong> without collisions), matching our <strong>Pedra Seca</strong> dry-stone craft: pieces that hold themselves up, without mortar.</p>
      <p>Let us be clear: today that is a <strong>vision</strong>, not a feature. It has not been built yet, and before starting it a new <strong>architecture decision</strong> will have to review the current one. What already exists is the <strong>foundation</strong>: the interface speaks to storage through a <strong>neutral port</strong> so switching data backends does not rewrite the UI, and some <strong>apps</strong> that only work with your own data already keep it on your <strong>device</strong>.</p>
      <p>This page <strong>will be updated</strong> every time a <strong>new channel</strong> opens.</p>
    `
  },
  eu: {
    title: 'Deskargak eta Aplikazioak',
    subtitle: 'Herria, zure gailuan',
    lead: 'iPhone eta iPaderako aplikazioa App Store-n dago jada, eta weba zabalik dago guztiontzat. Hemen aurkituko duzu nola instalatu dendatik edo nabigatzailetik, eta nola sartu gaur egun Androidetik.',
    imageAlt: 'Komiki-ilustrazioa: herriko harrizko patioan, balbulaz, engranaiaz eta kablez betetako kobrezko pertza su gainean irakiten dago eta, erreten batetik, hankadun robot eta garun txikiak saski batera erortzen dira; txapeldun gizon batek eta lupadun amona batek bana aztertzen dute, txakurrak tramankulu bat koskatzen du eta oilo batek lurrean moko-kolpeak ematen ditu',
    labels: [
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: 'Deskargak', className: 'sdp-badge-category' },
      { text: 'Multiplataforma', className: 'sdp-badge-tag' }
    ],
    html: `
      <h3>Aplikazio bera, gailu bakoitzean</h3>
      <p>Sóc de Poble <strong>aplikazio bakarra</strong> da <strong>mugikorrerako</strong>, <strong>tabletarako</strong> eta <strong>ordenagailurako</strong>, <strong>kontu berarekin</strong> eta elkarrizketa berekin leku guztietan. Hemen azaltzen dizugu, letra txikirik gabe, nola eskuratu dezakezun gaur, zein bide <strong>ez dauden oraindik zabalik</strong> guztiontzat eta zeintzuk etorriko diren geroago.</p>
      <p><strong>Promesa</strong> bat: orri honek <strong>ez du loturarik jartzen</strong> oraindik <strong>zabalik ez dauden</strong> dendetara. Bide bat <strong>guztiontzat</strong> irekitzen denean, hemen agertuko da lotura.</p>

      <h3>Android</h3>
      <h4>Google Play</h4>
      <p>Androiderako aplikazioa alta emanda dago jada <strong>Google Play</strong>-n, baina oraindik <strong>ez dago guztiontzat argitaratuta</strong>: oraingoz, <strong>gonbidatu dugun egiaztatzaile-taldeko</strong> pertsonek bakarrik instala dezakete. Googlek eskatzen du gutxienez <strong>12 pertsonak</strong> Google Play-tik instalatzea eta <strong>14 egunez</strong> jarraian instalatuta mantentzea publiko osoari ireki aurretik. Fitxa <strong>publikoa</strong> denean, dendarako lotura orri honetan agertuko da.</p>
      <p>Zure <strong>Google kontua</strong> <strong>egiaztatzaile-taldean</strong> badago, egin <strong>hiru urrats</strong> hauek <strong>Android mugikorretik</strong>, Google Play-n darabilzun kontu berarekin. Lehen urratseko helbidea <strong>ez da dendako fitxa</strong> publikoa: Googlek egiaztatzaileak erregistratzeko duen orria da, eta <strong>gonbidatutako kontu batekin</strong> soilik irekitzen da.</p>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>Google Play-ko hiru urratsak</h5>
        <ol>
          <li><strong>1. urratsa · 1. pantaila.</strong> Sartu <a href="https://play.google.com/apps/testing/org.socdepoble.app" target="_blank" rel="noopener noreferrer">play.google.com/apps/testing/org.socdepoble.app</a> helbidean eta sakatu «<strong>Become a tester</strong>» <strong>botoi urdin handia</strong> (Egiaztatzaile bihurtu).</li>
          <li><strong>2. urratsa · 2. pantaila, «You're a tester».</strong> <strong>EZ</strong> ukitu beheko botoia, «<strong>Leave the program</strong>»: taldetik aterako zinateke. Ukitu <strong>bigarren paragrafoaren</strong> amaierako <strong>lotura urdina</strong>, «<strong>download it on Google Play</strong>» dioena.</li>
          <li><strong>3. urratsa · 3. pantaila, Google Play.</strong> Sakatu «<strong>Instalatu</strong>» eta utzi aplikazioa mugikorrean <strong>instalatuta</strong>. <strong>Ezinbestekoa</strong> da: Googlek <strong>14 egunetan</strong> instalatuta mantentzen dutenak bakarrik zenbatzen ditu <strong>12 egiaztatzaileen</strong> artean.</li>
        </ol>
      </div>
      <p>Talde horretan ez bazaude, Androiden <strong>nabigatzailetik</strong> erabil dezakezu zuzenean eta <strong>web-aplikazio</strong> gisa instalatu (behean azaltzen dizugu nola).</p>
      <h4>Dendatik kanpoko APKrik ez</h4>
      <p>Sóc de Poblek <strong>ez du eskaintzen</strong> Androiderako instalazio-fitxategirik (<strong>APK</strong>) <strong>Google Play</strong>-tik kanpo: Androiden <strong>Babes Aurreratua</strong> aktibatuta dagoenean, telefonoak ez du uzten dendatik kanpoko aplikaziorik instalatzen, eta Google Play-tik aplikazioa <strong>bere kabuz eguneratzen da</strong>. Sóc de Pobleko <strong>inork</strong> ez dizu inoiz eskatuko APK bat instalatzeko edo babes hori desaktibatzeko.</p>

      <h3>iPhone eta iPad</h3>
      <h4>App Store</h4>
      <p>Sóc de Poble eskuragarri dago jada Appleren <strong>App Store</strong>-n <strong>iPhone</strong> eta <strong>iPaderako</strong>, <strong>doan</strong>: Applek <strong>1.0 bertsioa</strong> argitaratu zuen <strong>2026ko azaroaren 6an</strong>, eta <strong>iOS edo iPadOS 16</strong> edo berriagoa behar da. App Store-n «Sóc de Poble» bilatuz edo fitxara zuzenean daraman botoi honekin aurkituko duzu:</p>
      <div class="sdp-accions"><a class="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href="https://apps.apple.com/es/app/soc-de-poble/id6826441844" target="_blank" rel="noopener noreferrer">Eskuragarri App Store-n</a></div>
      <p><strong>Safari</strong>-tik ere erabil dezakezu eta <strong>hasierako pantailan</strong> gehitu (behean azaltzen dizugu nola).</p>

      <h3>Ordenagailuan eta edozein nabigatzailetatik</h3>
      <p>Sóc de Poble erabiltzeko <strong>ez da ezer deskargatu behar</strong>: ireki <strong>socdepoble.org</strong> nabigatzaile eguneratu batean (Chrome, Edge, Firefox edo Safari) eta barruan zaude. Eta, nahi baduzu, aplikazio gisa <strong>instala</strong> dezakezu: web-aplikazio instalagarria da (<strong>PWA</strong>), bere <strong>leiho</strong> propioan eta bere <strong>ikonoarekin</strong> irekitzen dena, beste edozein programa bezala.</p>
      <h4>Nola instalatzen da nabigatzailetik</h4>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>Ordenagailuan</h5>
        <ul>
          <li><strong>Chrome eta Edge (Windows, Mac eta Linux):</strong> ireki socdepoble.org, sakatu <strong>nabigatzailearen menua</strong> (goiko eskuineko <strong>hiru puntuak</strong>) eta aukeratu Sóc de Poble aplikazio gisa <strong>instalatzeko</strong> aukera. Helbide-barran <strong>instalatzeko ikonoa</strong> agertzen bada, horrek ere balio du.</li>
          <li><strong>Safari Mac-en (macOS Sonoma edo berriagoa):</strong> ireki <strong>Fitxategia menua</strong> eta hautatu «Gehitu Dock-ean».</li>
          <li><strong>Firefox:</strong> <strong>web gisa</strong> dabil, baina bertsioaren arabera baliteke aplikazio gisa instalatzeko aukerarik <strong>ez eskaintzea</strong>.</li>
        </ul>
      </div>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>Mugikorrean eta tabletan</h5>
        <ul>
          <li><strong>Chrome Androiden:</strong> sakatu <strong>hiru puntuen</strong> menua eta «Instalatu aplikazioa» edo «Gehitu hasierako pantailan».</li>
          <li><strong>Safari iPhone eta iPaden:</strong> sakatu <strong>Partekatu botoia</strong> (gora begira dagoen gezidun laukia) eta «Gehitu hasierako pantailan».</li>
        </ul>
      </div>
      <p>Aukera bakoitzaren <strong>izen zehatza</strong> nabigatzailearen <strong>bertsioaren</strong> eta <strong>hizkuntzaren</strong> arabera <strong>aldatzen</strong> da.</p>
      <h4>Windows, Mac eta Linux: etorriko dena</h4>
      <p>Gaur egun, ordenagailuan, aplikazioa <strong>web instalagarria</strong> da, eta dagoeneko badabil <strong>Windows</strong>, <strong>Mac</strong> eta <strong>Linux</strong> sistemetan. Oraindik ez dago sistema hauetarako deskargatzeko <strong>programa bereizirik</strong>: <strong>etorkizunerako</strong> pentsatutako bidea da, eta prest dagoenean hemen agertuko da.</p>

      <h3>Zure herriko webgunean, WordPressekin</h3>
      <p>Zure udalak, elkarteak edo kolektiboak dagoeneko <strong>WordPress</strong> webgune bat badu, <strong>ez dago aldatu beharrik</strong>: Sóc de Pobleren <strong>konektoreak</strong> aplikazioa <strong>orri</strong> batean txertatzen du <strong>kode labur</strong> batekin edo editoreko <strong>bloke</strong> batekin, Gent de la Torreren webguneak egiten duen bezala.</p>
      <h4>WordPress.org</h4>
      <p>Sóc de Pobleren konektore ofiziala, «socdepoble» izenekoa, <strong>publikoa</strong> da jada <strong>WordPress.org</strong> direktorio ofizialean, <strong>1.1.12 bertsioan</strong>: <a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>. Edozein udalek, elkartek edo kolektibok bere WordPress paneletik <strong>bilatu</strong>, <strong>instalatu</strong> eta <strong>aktibatu</strong> dezake.</p>
      <p>Aplikazioa orri batean jartzeko <strong>nahikoa</strong> da <code>[socdepoble_app poble="la-torre-de-les-macanes"]</code> <strong>kode laburra</strong> erabiltzea, herriaren <strong>identifikatzailearekin</strong> (adibide honetan, La Torre de les Maçanes), eta orriaren <strong>Txantiloia laukian</strong> «Sóc de Poble · full screen» <strong>txantiloia</strong> hautatzea. Hori da <strong>gentdelatorre.net</strong> webguneak dagoeneko egiten duena.</p>

      <h3>Nola dabil barrutik: gaur eta bihar</h3>
      <h4>Gaur: konektatuta, bizkor ibiltzeko</h4>
      <p>Gaur egun Sóc de Poblek <strong>internet</strong> behar du partekatzen dugun guztirako: elkarrizketak, Horma, Merkatua edo profilak Sóc de Pobleren datu-zerbitzarian (<strong>Supabase</strong>) bizi dira; horixe da <strong>egiaren iturri</strong> bakarra, argitaratzen duzuna herriko gainerakoei berehala iristea bermatzen duena. Horrela erabaki genuen <strong>kontzienteki</strong> («online-first» arkitektura-erabakia, ADR-2026-08): nahiago dugu aplikazio bizkor eta <strong>zintzo</strong> bat, <strong>sarerik ez dagoenean</strong> argi esaten duena, konexiorik gabe dabilela agindu eta datuak galtzen dituena baino.</p>
      <h4>Bihar: sarerik gabeko autonomia</h4>
      <p>Gure <strong>asmoa</strong> da, egun batean, Sóc de Poble <strong>internetik gabe</strong> ere ibiltzea: herriko datuak lehenik zure <strong>gailuan</strong> bizitzea eta konexioa itzultzean gainerakoenekin berez ados jartzea. Hori ahalbidetu dezakeen teknika-familiak badu izena, <strong>CRDT</strong> (gatazkarik gabe <strong>batu</strong> daitezkeen datu-egiturak), eta bat dator gure eraikitzeko moduarekin, <strong>Pedra Seca</strong> harri lehorrarekin: zementurik gabe elkarri eusten dioten piezak.</p>
      <p>Hala ere, izan gaitezen argiak: gaur hori <strong>ikuspegi</strong> bat da, ez <strong>funtzio aktibo</strong> bat. Oraindik ez dago eginda, eta hasi aurretik egungoa berrikusiko duen <strong>arkitektura-erabaki</strong> berri bat beharko da. Badagoena <strong>oinarria</strong> da: interfazeak <strong>ataka neutral</strong> baten bidez hitz egiten du datuekin, datuen jatorria aldatzeak aplikazioa berridaztera behartu ez dezan, eta zure datuekin soilik dabiltzan zenbait <strong>tresnak</strong> dagoeneko zure <strong>gailuan</strong> gordetzen dituzte.</p>
      <p>Orri hau <strong>bide berri bat</strong> irekitzen den bakoitzean <strong>eguneratuko</strong> da.</p>
    `
  },
  gl: {
    title: 'Descargas e Aplicacións',
    subtitle: 'A vila, no teu aparello',
    lead: 'A aplicación para iPhone e iPad xa está na App Store, e a web está aberta a todo o mundo. Aquí atoparás como instalala desde a tenda ou desde o navegador, e como acceder hoxe desde Android.',
    imageAlt: 'Ilustración de banda deseñada: no patio de pedra da vila, un caldeiro de cobre cheo de válvulas, engrenaxes e cables ferve sobre o lume e, por unha canle, caen a unha cesta pequenos robots e cerebros con patiñas; un home con gorra e unha avoa con lupa examinan un cada un, o can rila un aparello e unha galiña peteira no chan',
    labels: [
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: 'Descargas', className: 'sdp-badge-category' },
      { text: 'Multiplataforma', className: 'sdp-badge-tag' }
    ],
    html: `
      <h3>A mesma aplicación, en cada aparello</h3>
      <p>Sóc de Poble é unha <strong>única aplicación</strong> para o <strong>móbil</strong>, a <strong>tableta</strong> e o <strong>ordenador</strong>, coa <strong>mesma conta</strong> e conversas en todas partes. Aquí explicámosche, sen letra pequena, como a podes ter hoxe, que camiños aínda <strong>non están abertos</strong> a todo o mundo e cales virán despois.</p>
      <p>Unha <strong>promesa</strong>: esta páxina <strong>non enlaza tendas</strong> que aínda <strong>non están abertas</strong>. Cando un camiño se abra para <strong>todo o mundo</strong>, a ligazón aparecerá aquí.</p>

      <h3>Android</h3>
      <h4>Google Play</h4>
      <p>A aplicación para Android xa está dada de alta en <strong>Google Play</strong>, pero aínda <strong>non está publicada</strong> en aberto: de momento só a poden instalar as persoas do <strong>grupo de verificadores</strong> que <strong>convidamos</strong>. Google pide que polo menos <strong>12 persoas</strong> a instalen desde Google Play e a manteñan <strong>14 días</strong> seguidos antes de publicala para todo o público. Cando a súa ficha sexa <strong>pública</strong>, a ligazón á tenda sairá nesta páxina.</p>
      <p>Se a túa <strong>conta de Google</strong> está no <strong>grupo de verificadores</strong>, fai estes <strong>tres pasos</strong> desde o <strong>móbil Android</strong>, coa mesma conta que tes en Google Play. O enderezo do primeiro paso <strong>non é a ficha</strong> pública da tenda: é a páxina onde Google rexistra os verificadores, e só abre cunha <strong>conta convidada</strong>.</p>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>Os tres pasos en Google Play</h5>
        <ol>
          <li><strong>Paso 1 · Pantalla 1.</strong> Entra en <a href="https://play.google.com/apps/testing/org.socdepoble.app" target="_blank" rel="noopener noreferrer">play.google.com/apps/testing/org.socdepoble.app</a> e preme o <strong>botón azul grande</strong> «<strong>Become a tester</strong>» (Converterse en verificador).</li>
          <li><strong>Paso 2 · Pantalla 2, «You're a tester».</strong> <strong>NON</strong> toques o botón de abaixo, «<strong>Leave the program</strong>»: sairías do grupo. Toca a <strong>ligazón azul</strong> do final do <strong>segundo parágrafo</strong>, a que di «<strong>download it on Google Play</strong>».</li>
          <li><strong>Paso 3 · Pantalla 3, Google Play.</strong> Preme «<strong>Instalar</strong>» e deixa a aplicación <strong>instalada</strong> no móbil. É <strong>imprescindible</strong>: Google só conta dentro dos <strong>12 verificadores</strong> a quen a ten instalada durante os <strong>14 días</strong>.</li>
        </ol>
      </div>
      <p>Se non formas parte do grupo, en Android pódela empregar desde o <strong>navegador</strong> e instalala como unha <strong>aplicación web</strong> (explicámoscho embaixo).</p>
      <h4>Ningún APK fóra da tenda</h4>
      <p>Sóc de Poble <strong>non ofrece</strong> ningún ficheiro de instalación de Android (<strong>APK</strong>) fóra de <strong>Google Play</strong>: coa <strong>Protección Avanzada</strong> de Android activada, o teléfono non deixa instalar aplicacións de fóra da tenda, e desde Google Play a aplicación <strong>actualízase soa</strong>. <strong>Ninguén</strong> de Sóc de Poble che pedirá nunca que instales un APK nin que desactives esa protección.</p>

      <h3>iPhone e iPad</h3>
      <h4>App Store</h4>
      <p>Sóc de Poble xa está na <strong>App Store</strong> de Apple para <strong>iPhone</strong> e <strong>iPad</strong>, <strong>de balde</strong>: Apple publicou a <strong>versión 1.0</strong> o <strong>6 de novembro de 2026</strong>, e cómpre ter <strong>iOS ou iPadOS 16</strong> ou posterior. Atoparala buscando «Sóc de Poble» na App Store ou con este botón, que leva directamente á súa ficha:</p>
      <div class="sdp-accions"><a class="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href="https://apps.apple.com/es/app/soc-de-poble/id6826441844" target="_blank" rel="noopener noreferrer">Dispoñible na App Store</a></div>
      <p>Tamén a podes empregar desde <strong>Safari</strong> e engadila á <strong>pantalla de inicio</strong> (explicámoscho embaixo).</p>

      <h3>No ordenador e desde calquera navegador</h3>
      <p>Para empregar Sóc de Poble <strong>non cómpre descargar</strong> nada: abre <strong>socdepoble.org</strong> nun navegador actualizado (Chrome, Edge, Firefox ou Safari) e xa estás dentro. E, se queres, pódela <strong>instalar</strong> como unha aplicación: é unha aplicación web instalable (<strong>PWA</strong>), que abre na súa propia <strong>xanela</strong> e coa súa <strong>icona</strong>, como calquera outro programa.</p>
      <h4>Como se instala desde o navegador</h4>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>No ordenador</h5>
        <ul>
          <li><strong>Chrome e Edge (Windows, Mac e Linux):</strong> abre socdepoble.org, preme o <strong>menú do navegador</strong> (os <strong>tres puntos</strong> de arriba á dereita) e escolle a opción de <strong>instalar</strong> Sóc de Poble como aplicación. Se na barra de enderezos aparece a <strong>icona de instalar</strong>, tamén vale.</li>
          <li><strong>Safari no Mac (macOS Sonoma ou posterior):</strong> o <strong>menú Ficheiro</strong> e «Engadir ao Dock».</li>
          <li><strong>Firefox:</strong> funciona <strong>como web</strong>, pero segundo a versión pode <strong>non ofrecerche</strong> instalala como aplicación.</li>
        </ul>
      </div>
      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h5>No móbil e na tableta</h5>
        <ul>
          <li><strong>Chrome en Android:</strong> o menú dos <strong>tres puntos</strong> e «Instalar aplicación» ou «Engadir á pantalla de inicio».</li>
          <li><strong>Safari no iPhone e no iPad:</strong> o <strong>botón Compartir</strong> (o cadro coa frecha cara arriba) e «Engadir á pantalla de inicio».</li>
        </ul>
      </div>
      <p>O <strong>nome exacto</strong> de cada opción <strong>cambia</strong> segundo a <strong>versión</strong> e a <strong>lingua</strong> do navegador.</p>
      <h4>Windows, Mac e Linux: o que virá</h4>
      <p>Hoxe, no ordenador, a aplicación é a <strong>web instalable</strong>, que xa funciona en <strong>Windows</strong>, <strong>Mac</strong> e <strong>Linux</strong>. Aínda non hai <strong>ningún programa</strong> propio para descargar para estes sistemas: é un camiño pensado para o <strong>futuro</strong> e, cando o haxa, sairá aquí.</p>

      <h3>Na web da túa vila, con WordPress</h3>
      <p>Se o teu concello, asociación ou colectivo xa ten unha web en <strong>WordPress</strong>, <strong>non cómpre cambiala</strong>: o <strong>conector</strong> de Sóc de Poble pon a aplicación nunha <strong>páxina</strong>, cun <strong>código curto</strong> ou cun <strong>bloque</strong> do editor, como xa fai a web de Gent de la Torre.</p>
      <h4>WordPress.org</h4>
      <p>O conector oficial de Sóc de Poble, co nome «socdepoble», xa é <strong>público</strong> no directorio oficial de <strong>WordPress.org</strong>, na <strong>versión 1.1.12</strong>: <a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>. Un concello, unha asociación ou un colectivo pódeo <strong>buscar</strong>, <strong>instalar</strong> e <strong>activar</strong> desde o panel do seu WordPress.</p>
      <p>Para poñer a aplicación nunha páxina <strong>abonda</strong> co <strong>código curto</strong> <code>[socdepoble_app poble="la-torre-de-les-macanes"]</code>, co <strong>identificador</strong> da vila (neste exemplo, La Torre de les Maçanes), e co <strong>modelo</strong> «Sóc de Poble · full screen», que se escolle no <strong>cadro Modelo</strong> da páxina. É o que xa fai <strong>gentdelatorre.net</strong>, a web de Gent de la Torre.</p>

      <h3>Como funciona por dentro: hoxe e mañá</h3>
      <h4>Hoxe: conectada para ir axiña</h4>
      <p>Hoxe Sóc de Poble precisa <strong>internet</strong> para todo o que compartimos: as conversas, o Muro, o Mercado ou os perfís viven no servidor de datos de Sóc de Poble (<strong>Supabase</strong>), que é a única <strong>fonte de verdade</strong> e o que fai que o que publicas chegue axiña ao resto da vila. Decidímolo así a <strong>conciencia</strong> (a decisión de arquitectura «online-first», ADR-2026-08): preferimos unha aplicación rápida e <strong>honesta</strong>, que diga claramente cando <strong>non hai rede</strong>, a unha que promete funcionar sen conexión e despois perde datos.</p>
      <h4>Mañá: autonomía sen rede</h4>
      <p>A nosa <strong>vocación</strong> é que, algún día, Sóc de Poble funcione tamén <strong>sen internet</strong>: que os datos da vila vivan primeiro no teu <strong>aparello</strong> e se poñan de acordo sós cos do resto cando volva a conexión. A familia de técnicas que o pode facer posible chámase <strong>CRDT</strong> (estruturas de datos que se poden <strong>xuntar</strong> sen conflitos), e acae coa nosa maneira de construír, a <strong>Pedra Seca</strong>: pezas que se sosteñen soas, sen cemento.</p>
      <p>Agora ben, sexamos claros: hoxe iso é unha <strong>visión</strong>, non unha <strong>función activa</strong>. Aínda non está feito, e antes de comezalo cumprirá unha nova <strong>decisión de arquitectura</strong> que revise a actual. O que si hai é a <strong>base</strong> para que sexa posible: a interface fala cos datos a través dun <strong>porto neutral</strong>, de xeito que cambiar de onde veñen os datos non obriga a refacer a aplicación, e algunhas <strong>ferramentas</strong> que só traballan cos teus datos xa os gardan no teu <strong>aparello</strong>.</p>
      <p>Esta páxina <strong>actualizarase</strong> cada vez que se abra un <strong>camiño novo</strong>.</p>
    `
  }
});
