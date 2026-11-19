/* Onada R32.10 · Lot 04 · Coherència Editorial i Didàctica Viva en 5 llengües (ca, es, en, eu, gl) + Llei 32.
 * Documenta amb claredat de poble per a /projecte, /disseny, /page/node-zero i /page/fediversity:
 *   1. Llibre Viu Wiki ↔ Mur (portada quadrada, dates reals, historial Git i opció «Mostrar també al Mur»).
 *   2. Columnes plegades persistents en Wiki de Poble, Bloc de Notes, Disseny i Perfil.
 *   3. Avís d'actualització d'1 toc en mòbils de prova i navegador web preservant esborranys oberts.
 *   4. Geolocalització rural amb el control d'1 toc «Amaga el lloc» (Llei 31).
 *   5. Les 8 escoles locals del Node 0 sobre xip Apple M4 i la Llei 32 («el servidor de Sóc de Poble» /
 *      «els serveis de Sóc de Poble», sense atribuir infraestructura genèrica aliena).
 * Cap menció a botigues o paquets d'altres plataformes mòbils (Regla 2.3.10 d'App Store).
 */

const TARGETA_ANIMA_CA =
  '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">'
  + '<div data-sdp-targeta="pagina:anima" class="sdp-targeta" data-ruta="/anima" data-titol="L&#39;Ànima de la IAIA" data-subtitol="El paper de la IAIA" data-entradilla="La IAIA utilitza l\'imaginari de poble per a explicar la tecnologia. Este manifest presenta el seu paper narratiu, la manera de treballar i les reflexions que han acompanyat el projecte." data-autor="Sóc de Poble" data-autor-ruta="/projecte">'
  + '<a href="/anima" rel="noopener noreferrer nofollow">L&#39;Ànima de la IAIA</a>'
  + '</div></div>';

const TARGETA_ANIMA_TRADUIDA = TARGETA_ANIMA_CA.replace(
  'class="sdp-targeta" data-ruta="/anima"',
  'class="sdp-targeta" data-ruta="/anima" lang="ca"',
);

const infografiesHtml = ([alt1, alt2, alt3, alt4]) => `\n      <div class="">
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-1.jpg" width="1241" height="1754" loading="lazy" alt="${alt1}" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-2.jpg" width="1241" height="1754" loading="lazy" alt="${alt2}" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-3.jpg" width="1241" height="1754" loading="lazy" alt="${alt3}" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-4.jpg" width="1241" height="1754" loading="lazy" alt="${alt4}" class="" />
        </div>
      </div>`;

export const BLOC_PROJECTE_R32_10 = Object.freeze({
  ca: `\n      <h3>Llibre viu, espais que recorden com treballes i privacitat del lloc</h3>
      <p>La <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> i el <a href="/mur"><strong>Mur</strong></a> s’entenen com un <strong>llibre viu</strong> compartit (<code>Wiki ↔ Mur</code>): cada pàgina tècnica o de memòria conserva <strong>portada quadrada</strong>, <strong>dates reals</strong> i <strong>historial de versions en Git</strong>, i des de l’edició avançada es pot marcar <strong>«Mostrar també al Mur»</strong> perquè les explicacions útils arriben al veïnat sense duplicar documents.</p>
      <p>Els espais de treball en columnes —la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, el <a href="/notes"><strong>Bloc de Notes</strong></a>, <a href="/disseny"><strong>Disseny</strong></a> i el <a href="/perfil"><strong>Perfil</strong></a>— recorden al navegador quines <strong>columnes laterals</strong> has deixat <strong>plegades</strong>. Quan tornes a obrir-los, conserven el mateix espai net de lectura, i els <strong>mòbils de prova</strong> i la web mostren un <strong>avís d’actualització d’un toc</strong> que comprova si hi ha <strong>esborranys oberts</strong> abans de carregar la versió nova des dels <strong>serveis de Sóc de Poble</strong>.</p>
      <p>Quan es compartix una publicació o un contingut des del territori, s’acompanya el <strong>context rural del lloc</strong> per situar l’avís al poble, però sempre amb el botó visible d’un sol toc <strong>«Amaga el lloc»</strong> per publicar sense ubicació quan preferixes <strong>discreció</strong>. Al taller local de La Torre de les Maçanes, les <strong>8 escoles locals</strong> del <a href="/page/node-zero"><strong>Node 0</strong></a> revisen el codi i els textos sobre el <strong>xip Apple M4</strong>, mentre les dades compartides continuen custodiades en <strong>el servidor de Sóc de Poble</strong>.</p>\n`,
  es: `\n      <h3>Libro vivo, espacios que recuerdan cómo trabajas y privacidad del lugar</h3>
      <p>La <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> y el <a href="/mur"><strong>Muro</strong></a> conversan como un <strong>libro vivo</strong> compartido (<code>Wiki ↔ Mur</code>): cada documento conserva su <strong>portada cuadrada</strong>, sus <strong>fechas reales</strong> y su <strong>historial de versiones en Git</strong>, y desde la edición avanzada permite activar <strong>«Mostrar también en el Muro»</strong> para acercar las guías clave al vecindario sin duplicar páginas.</p>
      <p>Los espacios de trabajo por columnas —la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, el <a href="/notes"><strong>Bloc de Notas</strong></a>, <a href="/disseny"><strong>Diseño</strong></a> y el <a href="/perfil"><strong>Perfil</strong></a>— guardan en el navegador qué <strong>columnas laterales</strong> dejaste <strong>plegadas</strong>. Al volver, recuperas la misma amplitud de lectura, mientras los <strong>móviles de prueba</strong> y el navegador ofrecen un <strong>aviso de actualización de un toque</strong> que protege los <strong>borradores abiertos</strong> antes de cargar la versión nueva desde los <strong>servicios de Sóc de Poble</strong>.</p>
      <p>Al compartir desde el territorio se acompaña la <strong>geolocalización rural</strong> del aviso, ofreciendo siempre a la vista el botón de un toque <strong>«Ocultar el lugar»</strong> (<code>Amaga el lloc</code>) para publicar sin ubicación cuando prefieres <strong>privacidad</strong>. En el taller de La Torre de les Maçanes, las <strong>8 escuelas locales</strong> del <a href="/page/node-zero"><strong>Node 0</strong></a> auditan código y textos sobre el <strong>chip Apple M4</strong>, mientras los datos compartidos residen hoy en <strong>el servidor de Sóc de Poble</strong>.</p>\n`,
  en: `\n      <h3>Living book, workspaces that remember your layout and place privacy</h3>
      <p>The <a href="/wikidepoble"><strong>Village Wiki</strong></a> and the <a href="/mur"><strong>Wall</strong></a> work together as a shared <strong>living book</strong> (<code>Wiki ↔ Mur</code>): each guide keeps its <strong>square cover</strong>, <strong>real dates</strong> and <strong>Git version history</strong>, and advanced editing includes <strong>“Also show on the Wall”</strong> so key explanations reach neighbours without duplicating files.</p>
      <p>Column workspaces —the <a href="/wikidepoble"><strong>Village Wiki</strong></a>, <a href="/notes"><strong>Notebook</strong></a>, <a href="/disseny"><strong>Design</strong></a> and <a href="/perfil"><strong>Profile</strong></a>— remember in the browser which <strong>side columns</strong> you left <strong>folded</strong>. When you return, your reading room stays just as you left it, while <strong>test phones</strong> and the web show a <strong>one-tap update notice</strong> that safeguards <strong>open drafts</strong> before loading the new release from <strong>Sóc de Poble services</strong>.</p>
      <p>Publishing from the countryside attaches <strong>rural place context</strong> while keeping a clear one-tap <strong>“Hide place”</strong> control (<code>Amaga el lloc</code>) right in view whenever you prefer to post without location. In the La Torre de les Maçanes workshop, the <strong>8 local Node 0 schools</strong> review code and copy on the <strong>Apple M4 chip</strong>, while shared community data lives on <strong>the Sóc de Poble server</strong>.</p>\n`,
  eu: `\n      <h3>Liburu bizia, lan-eremu iraunkorrak eta tokiaren pribatutasuna</h3>
      <p><a href="/wikidepoble"><strong>Herriko Wikiak</strong></a> eta <a href="/mur"><strong>Hormak</strong></a> <strong>liburu bizi</strong> partekatu gisa funtzionatzen dute (<code>Wiki ↔ Mur</code>): orri bakoitzak <strong>azal karratua</strong>, <strong>benetako datak</strong> eta <strong>Git bertsio-historia</strong> gordetzen ditu, eta edizio aurreratuan <strong>«Erakutsi Horman ere»</strong> aktiba daiteke azalpen nagusiak auzotarrei bikoizketarik gabe helarazteko.</p>
      <p>Zutabe bidezko lan-eremuek —<a href="/wikidepoble"><strong>Herriko Wikia</strong></a>, <a href="/notes"><strong>Koadernoa</strong></a>, <a href="/disseny"><strong>Diseinua</strong></a> eta <a href="/perfil"><strong>Profila</strong></a>— nabigatzailean gogoratzen dute zein <strong>alboko zutabe</strong> utzi dituzun <strong>tolestuta</strong>. Itzultzean irakurketa-zabalera bera mantentzen da, eta <strong>proba-mugikorrek</strong> zein webak <strong>ukitu bakarreko eguneratze-abisua</strong> erakusten dute, <strong>irekitako zirriborroak</strong> babestuz <strong>Sóc de Pobleren zerbitzuetatik</strong> bertsio berria kargatu aurretik.</p>
      <p>Lurraldetik argitaratzean <strong>landa-kokapena</strong> gehitzen da testuinguru gisa, baina beti begi-bistan dago ukitu bakarreko <strong>«Ezkutatu lekua»</strong> botoia (<code>Amaga el lloc</code>) kokapenik gabe argitaratzeko. La Torre de les Maçaneseko tailerrean, <a href="/page/node-zero"><strong>0 Nodoaren</strong></a> <strong>8 eskola lokalek</strong> kodea eta testuak berrikusten dituzte <strong>Apple M4 txipean</strong>, datu partekatuak gaur <strong>Sóc de Pobleren zerbitzarian</strong> gordetzen diren bitartean.</p>\n`,
  gl: `\n      <h3>Libro vivo, espazos que lembran como traballas e privacidade do lugar</h3>
      <p>A <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> e o <a href="/mur"><strong>Muro</strong></a> conviven como un <strong>libro vivo</strong> compartido (<code>Wiki ↔ Mur</code>): cada documento conserva <strong>portada cadrada</strong>, <strong>datas reais</strong> e <strong>historial de versións en Git</strong>, e desde a edición avanzada pódese marcar <strong>«Mostrar tamén no Muro»</strong> para achegar as guías útiles á veciñanza sen duplicar ficheiros.</p>
      <p>Os espazos de traballo en columnas —a <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, o <a href="/notes"><strong>Caderno de Notas</strong></a>, <a href="/disseny"><strong>Deseño</strong></a> e o <a href="/perfil"><strong>Perfil</strong></a>— lembran no navegador que <strong>columnas laterais</strong> deixaches <strong>pregadas</strong>. Ao volver, conservas o mesmo espazo limpo de lectura, mentres os <strong>móbiles de proba</strong> e a web amosan un <strong>aviso de actualización dun toque</strong> que protexe os <strong>borradores abertos</strong> antes de cargar a nova versión desde os <strong>servizos de Sóc de Poble</strong>.</p>
      <p>Ao publicar desde o territorio acompáñase a <strong>xeolocalización rural</strong> do aviso, mantendo sempre á vista o control dun toque <strong>«Agochar o lugar»</strong> (<code>Amaga el lloc</code>) para publicar sen localización cando prefires discreción. No obradoiro de La Torre de les Maçanes, as <strong>8 escolas locais</strong> do <a href="/page/node-zero"><strong>Nodo 0</strong></a> revisan código e textos sobre o <strong>chip Apple M4</strong>, mentres os datos compartidos viven hoxe n’<strong>o servidor de Sóc de Poble</strong>.</p>\n`,
});

export const TRADUCCIONS_PROJECTE_R32_10 = Object.freeze({
  es: {
    title: 'El proyecto',
    subtitle: 'Conectar los pueblos',
    lead: 'Sóc de Poble nace del anhelo de compartir información y cuidar la vida en los pueblos. Esta es nuestra historia, las herramientas que tenemos hoy y el futuro que queremos construir.',
    imageAlt: 'Ilustración de un pueblo rural conectado',
    html: `\n      <h3>Una herramienta para el pueblo</h3>
      <p>Sóc de Poble es una <strong>red social</strong> cívica pensada para <strong>conectar</strong> los pueblos y a las personas que viven en ellos. Queremos compartir información <strong>sin depender</strong> de los grandes <strong>monopolios</strong> de datos ni de intermediarios que complican la vida. El objetivo es una herramienta <strong>clara</strong> y <strong>cercana</strong>: que una <strong>persona mayor</strong> toque la pantalla y sepa qué hacer, sin tener que entender la tecnología que hay detrás.</p>
      <p>Nuestro <strong>horizonte</strong> es una <strong>autonomía</strong> sin internet: que los <strong>dispositivos</strong> puedan conservar datos y ponerse de acuerdo cuando vuelva la conexión. Sigue siendo una visión de <strong>futuro</strong>, todavía por construir. Hoy, las funciones compartidas de Sóc de Poble <strong>necesitan conexión</strong>; <strong>no prometemos</strong> una red autónoma que todavía no tenemos.</p>

      <h3>Cómo nos conectamos hoy</h3>
      <p>Construimos la <strong>aplicación</strong> y los <strong>datos</strong> como <strong>piezas separadas</strong>. La pantalla es la <strong>fachada</strong> con la que trabajas; detrás, un <strong>conector</strong> le permite leer y guardar la información. Esta separación ayuda a <strong>mantener</strong> y <strong>adaptar</strong> el proyecto sin rehacer toda la interfaz cada vez que cambia una pieza.</p>
      <p>Hoy, los datos compartidos se guardan en <strong>el servidor de Sóc de Poble</strong> sobre <strong>Supabase</strong>, con los <strong>permisos</strong> de cada persona. Es la única <strong>fuente de verdad</strong> de las <strong>conversaciones</strong>, las publicaciones y los perfiles compartidos. Trabajamos con <strong>conexión</strong> a internet, según la decisión «online-first» ADR-2026-08, para hacer llegar los <strong>cambios</strong> a toda la gente de pueblo.</p>
      <p><strong>Sollutia</strong> es el <strong>anfitrión</strong> y socio de infraestructura: aloja la aplicación, puede pasarle la sesión y le abre su API solo en <strong>lectura</strong>. <strong>No es Supabase</strong> ni sustituye al servidor de datos de Sóc de Poble. <strong>WordPress</strong> y <strong>Joomla</strong> también pueden acoger la aplicación como webs anfitrionas; eso no los convierte en su backend.</p>
      <p>La interfaz habla con los datos a través de un <strong>puerto neutral</strong>. Esto deja abierta la <strong>adaptación</strong> a otros servidores, pero cambiar de <strong>backend</strong> necesita una <strong>decisión propia</strong> de Sóc de Poble, documentada y comprobada. <strong>Alojar</strong> la aplicación en otra web y cambiar el lugar donde guarda los datos son decisiones <strong>distintas</strong>.</p>

      <h3>El conocimiento también se comparte</h3>
      ${TARGETA_ANIMA_TRADUIDA}
      <p>El diseño, la <strong>Wiki</strong>, la <strong>Constitución</strong> y el código explican cómo construimos el proyecto y por qué tomamos cada decisión. Queremos <strong>decisiones escritas</strong> y accesibles, para que el <strong>mantenimiento</strong> no dependa solo del recuerdo de una persona o de una máquina. Este <strong>conocimiento compartido</strong> forma parte del <strong>legado</strong> que dejamos a quien venga después.</p>
      <p>Hoy trabajamos con <strong>inteligencias artificiales</strong> como <a href="/anima">MarIA</a>, Claude o Codex para construir y <strong>programar</strong>. Para ayudarnos bien, deben leer y entender las <strong>normas</strong>, el diseño <strong>Pedra Seca</strong> y el <strong>Trellat</strong>: la manera de hacer las cosas con sentido, cuidado y claridad.</p>
      <p>También preparamos el proyecto para que <strong>cualquier persona</strong> preparada pueda <strong>continuar</strong> el trabajo si las IAs dejan de estar disponibles o se vuelven <strong>demasiado caras</strong>. Las decisiones escritas ayudan a mantener el código <strong>sin depender</strong> de un modelo concreto ni perder la <strong>identidad</strong> del proyecto.</p>

      <h3>Redes abiertas entre pueblos</h3>
      <p><strong>No queremos</strong> una <strong>plataforma gigante</strong> que atrape a todo el mundo. Queremos abrir las puertas al <strong>Fediverso</strong> y facilitar la <strong>comunicación entre comunidades</strong>.</p>
      <p>El <strong>Fediverso</strong> conecta <strong>servidores independientes</strong> que se comunican con <strong>protocolos abiertos</strong>. Imagina que cada pueblo tiene su <strong>plaza</strong> digital y que las personas pueden hablar con las de otra plaza <strong>sin</strong> estar todas bajo el <strong>mismo dueño</strong>. Es la dirección que queremos <strong>explorar</strong>; la federación de Sóc de Poble sigue formando parte de la hoja de ruta.</p>
      <p><strong>Diaspora</strong> exploró una alternativa a <strong>Facebook</strong> con servidores <strong>descentralizados</strong>, y <strong>Mastodon</strong> es otra de las experiencias que nos <strong>orientan</strong> al pensar en redes abiertas para las <strong>comunidades rurales</strong> <strong>sin ceder el control</strong> a una sola empresa.</p>
      <p>Nuestra intención es construir <strong>microrredes</strong> rurales mantenidas por <strong>personas</strong> que entienden la comunicación como una <strong>utilidad social</strong> básica con vocación de pueblo, <strong>sin comercializar</strong> la atención de quien participa.</p>

      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h3>De dónde venimos</h3>
        <p>La <strong>semilla</strong> de esta visión se formuló hacia <strong>2013-2014</strong>, en el <strong>manifiesto</strong> del Portal de Pobles Connectats publicado en <em><strong>socdepoble.net</strong></em>. Conservamos la <strong>cita histórica</strong> en su lengua original:</p>
        <blockquote class="page-content-quote" lang="ca">
          "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
        </blockquote>
        <p>En aquella época, Sóc de Poble ya contaba con más de <strong>160.000 seguidores</strong> en <strong>Facebook</strong>. Aquella comunidad hizo visible tanto la capacidad de <strong>conectar</strong> personas como el <strong>riesgo</strong> de depender de algoritmos privados, impulsando una salida propia con <strong>software libre</strong> y <strong>autonomía</strong> rural.</p>
      </div>

      <h3>Del proyecto a las herramientas</h3>
      <p>Lo que el primer proyecto llamaba «Módulo Social» tiene hoy continuidad en el <strong>Muro</strong> y en el <strong>Chat</strong>. El «Directorio Local» se ha ampliado con el <strong>Mercado</strong>, la <strong>Agenda</strong> y el <strong>Mapa</strong>: son <strong>herramientas de pueblo</strong> conectadas hoy al <strong>servidor de Sóc de Poble</strong>.</p>
      <p>El compromiso con la <strong>privacidad</strong> y el software libre continúa: <strong>sin cookies</strong> comerciales ni <strong>telemetría</strong> invasiva. Los <strong>datos pertenecen</strong> a quien los crea, y cada persona debe entender qué comparte y con quién.</p>

      <h3>Calidad que se prueba en el campo</h3>
      <p>Una aplicación rural debe poder <strong>utilizarse</strong> con <strong>teléfonos humildes</strong> y en situaciones de la <strong>vida real</strong>: leer al <strong>sol</strong>, encontrar <strong>botones</strong> grandes y recibir una <strong>respuesta clara</strong> tras cada toque.</p>
${BLOC_PROJECTE_R32_10.es}
      <h3>Las cuatro infografías históricas</h3>
      <p>Conservamos las cuatro <strong>infografías</strong> históricas porque explican la <strong>semilla</strong> del proyecto: los <strong>valores</strong> compartidos, el mapa colaborativo, el apoyo al <strong>emprendimiento</strong> rural y la vida social de los pueblos. Son documentos de <strong>su momento</strong> y no deben leerse como una lista de funciones ya disponibles.</p>${infografiesHtml([
        'Infografía 1: Valores innegociables y descentralización',
        'Infografía 2: Mapeo colaborativo geolocalizado',
        'Infografía 3: Vivero de emprendedores rurales',
        'Infografía 4: Módulo social rural',
      ])}

      <h3>Para profundizar en el proyecto</h3>
      <p>Esta página presenta la <strong>historia</strong> y la <strong>visión</strong> a quien quiere conocer Sóc de Poble. La <strong>Wiki</strong> explica el <strong>núcleo</strong>, la <strong>arquitectura</strong> y las <strong>decisiones</strong> del proyecto para quienes participan en su desarrollo.</p>
      <div class="sdp-pagina-accio">
        <a class="sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple" href="/wikidepoble?item=el_projecte">Leer el núcleo y la arquitectura del proyecto</a>
      </div>\n`,
  },
  en: {
    title: 'The project',
    subtitle: 'Connecting villages',
    lead: 'Sóc de Poble grows from the desire to share information and care for village life. Here is our story, the tools we have today, and the future we aim to build.',
    imageAlt: 'Illustration of a connected rural village',
    html: `\n      <h3>A tool for the village</h3>
      <p>Sóc de Poble is a civic <strong>social network</strong> built to <strong>connect</strong> villages and the people who live in them. We want to share information <strong>without relying</strong> on big data <strong>monopolies</strong> or middlemen. Our goal is a <strong>clear</strong>, <strong>approachable</strong> tool: an <strong>older neighbour</strong> should tap the screen and know what to do without needing to understand the underlying technology.</p>
      <p>Our <strong>horizon</strong> is offline <strong>autonomy</strong>: enabling <strong>devices</strong> to keep data locally and reconcile changes once connectivity returns. That remains a <strong>future</strong> vision yet to be built. Today, shared features in Sóc de Poble <strong>require an internet connection</strong>; we <strong>do not claim</strong> an autonomous offline network we do not yet have.</p>

      <h3>How we connect today</h3>
      <p>We build the <strong>application</strong> and its <strong>data</strong> as <strong>separate pieces</strong>. The screen is the <strong>front</strong> you interact with; behind it, a <strong>connector</strong> reads and saves information so the project can be <strong>maintained</strong> and <strong>adapted</strong> without rewriting the whole interface.</p>
      <p>Today, shared data is stored on <strong>the Sóc de Poble server</strong> running <strong>Supabase</strong>, enforcing each person’s <strong>permissions</strong>. It is the single <strong>source of truth</strong> for shared <strong>conversations</strong>, posts and profiles under the online-first ADR-2026-08 decision.</p>
      <p><strong>Sollutia</strong> is our infrastructure partner and <strong>host</strong>: it embeds the app, can pass session state and opens its API in <strong>read-only</strong> mode. It <strong>is not Supabase</strong> and does not replace the Sóc de Poble data server. <strong>WordPress</strong> and <strong>Joomla</strong> can also host the app without becoming its backend.</p>
      <p>The interface talks to data through a <strong>neutral port</strong>. Switching <strong>backends</strong> requires a documented, tested decision by Sóc de Poble; <strong>hosting</strong> the app on another website and changing where data lives are <strong>separate</strong> choices.</p>

      <h3>Sharing knowledge as well</h3>
      ${TARGETA_ANIMA_TRADUIDA}
      <p><strong>Design rules</strong>, the <strong>Wiki</strong>, the <strong>Constitution</strong> and <strong>source code</strong> explain how we build the project and why each choice is made. <strong>Written decisions</strong> ensure <strong>maintenance</strong> never depends on a single person’s or machine’s memory.</p>
      <p>Today we collaborate with <strong>artificial intelligence</strong> tools such as <a href="/anima"><strong>MarIA</strong></a>, <strong>Claude</strong> and <strong>Codex</strong>. To help responsibly, they read our <strong>written rules</strong>, <strong>Pedra Seca</strong> design and <strong>Trellat</strong> —working with care, clarity and common sense.</p>
      <p>We also document everything so <strong>any skilled person</strong> can <strong>carry on</strong> the work if AI tools become unavailable or <strong>too expensive</strong>, preserving the project’s <strong>identity</strong> without <strong>vendor lock-in</strong>.</p>

      <h3>Open networks across villages</h3>
      <p>We <strong>do not want</strong> a <strong>giant platform</strong> that traps people’s attention. We aim to open doors to the <strong>Fediverse</strong> and foster <strong>communication across communities</strong>.</p>
      <p>The <strong>Fediverse</strong> links <strong>independent servers</strong> speaking <strong>open protocols</strong>, like digital village <strong>squares</strong> able to converse without a <strong>single owner</strong>. Full federation for Sóc de Poble remains part of our roadmap.</p>
      <p>Projects such as <strong>Diaspora</strong> and <strong>Mastodon</strong> guide how <strong>rural communities</strong> can relate <strong>without surrendering control</strong> to one company.</p>
      <p>Our goal is to nurture rural <strong>micro-networks</strong> maintained by <strong>people</strong> who treat communication as a basic <strong>civic utility</strong>, <strong>never monetising</strong> neighbours’ attention.</p>

      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h3>Where we come from</h3>
        <p>The <strong>seed</strong> of this vision was written around <strong>2013–2014</strong> in the Portal de Pobles Connectats <strong>manifesto</strong> on <em><strong>socdepoble.net</strong></em>, preserved here in its original Valencian:</p>
        <blockquote class="page-content-quote" lang="ca">
          "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
        </blockquote>
        <p>At that time, Sóc de Poble already gathered over <strong>160,000 followers</strong> on <strong>Facebook</strong>, revealing both the power of <strong>connecting</strong> people and the <strong>risk</strong> of depending on private algorithms —sparking an independent path built on <strong>free software</strong> and rural <strong>autonomy</strong>.</p>
      </div>

      <h3>From vision to everyday tools</h3>
      <p>What the early manifesto called the “Social Module” lives today in the <strong>Wall</strong> and <strong>Chat</strong>, while the “Local Directory” has grown into the <strong>Market</strong>, <strong>Calendar</strong> and <strong>Map</strong> —village tools connected today to <strong>the Sóc de Poble server</strong>.</p>
      <p>Our commitment to <strong>privacy</strong> and free software stands firm: <strong>no commercial cookies</strong> and no invasive <strong>telemetry</strong>. Data <strong>belongs</strong> to whoever creates it.</p>

      <h3>Quality tested outdoors</h3>
      <p>A rural app must work on <strong>modest phones</strong> in <strong>real-life conditions</strong>: readable in bright <strong>sunlight</strong>, with generous <strong>buttons</strong> and predictable feedback on every tap.</p>
${BLOC_PROJECTE_R32_10.en}
      <h3>The four historical infographics</h3>
      <p>We keep the four historical <strong>infographics</strong> because they illustrate the project’s <strong>origins</strong>: shared <strong>values</strong>, collaborative mapping, rural <strong>entrepreneurship</strong> and community life. They belong to <strong>their time</strong> and should not be read as a checklist of live features.</p>${infografiesHtml([
        'Infographic 1: Core values and decentralisation',
        'Infographic 2: Geolocated collaborative mapping',
        'Infographic 3: Rural entrepreneurship incubator',
        'Infographic 4: Rural social module',
      ])}

      <h3>Explore the architecture in depth</h3>
      <p>This page introduces the <strong>history</strong> and <strong>vision</strong> of Sóc de Poble. The <strong>Wiki</strong> documents the <strong>core</strong>, <strong>architecture</strong> and engineering <strong>decisions</strong> for contributors.</p>
      <div class="sdp-pagina-accio">
        <a class="sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple" href="/wikidepoble?item=el_projecte">Read the project core and architecture</a>
      </div>\n`,
  },
  eu: {
    title: 'Proiektua',
    subtitle: 'Herriak konektatzea',
    lead: 'Sóc de Poble herrietan informazioa partekatzeko eta bizitza zaintzeko gogotik sortu zen. Hau da gure historia, gaur ditugun tresnak eta eraiki nahi dugun etorkizuna.',
    imageAlt: 'Konektatutako landa-herri baten ilustrazioa',
    html: `\n      <h3>Herriarentzako tresna bat</h3>
      <p>Sóc de Poble herriak eta bertan bizi diren pertsonak <strong>konektatzeko</strong> pentsatutako <strong>sare sozial</strong> zibiko bat da. Informazioa <strong>datu-monopolio</strong> handien menpe egon gabe <strong>partekatu</strong> nahi dugu, <strong>adineko pertsona batek</strong> pantaila ukitu eta zer egin jakin dezan.</p>
      <p>Gure <strong>zeruertza</strong> internetik gabeko <strong>autonomia</strong> da: <strong>gailuek</strong> datuak gorde eta konexioa itzultzean adostea. <strong>Etorkizuneko ikuspegia</strong> da oraindik; gaur egun, Sóc de Pobleren funtzio partekatuek <strong>konexioa behar dute</strong>.</p>

      <h3>Nola konektatzen garen gaur</h3>
      <p><strong>Aplikazioa</strong> eta <strong>datuak</strong> <strong>pieza bereizi</strong> gisa eraikitzen ditugu: pantaila aurrealdea da eta atzean <strong>konektore</strong> batek informazioa irakurri eta gordetzen du.</p>
      <p>Gaur, datu partekatuak <strong>Sóc de Pobleren zerbitzarian</strong> gordetzen dira, <strong>Supabase</strong> gainean, pertsona bakoitzaren <strong>baimenekin</strong>. Hori da elkarrizketa, argitalpen eta profil partekatuen <strong>egiaren iturri</strong> bakarra (ADR-2026-08).</p>
      <p><strong>Sollutia</strong> gure azpiegitura-bazkidea eta <strong>ostalaria</strong> da: aplikazioa hartzen du eta bere APIa <strong>irakurketan</strong> soilik irekitzen du, <strong>Sóc de Pobleren zerbitzaria</strong> ordezkatu gabe. <strong>WordPress</strong> eta <strong>Joomla</strong> webguneek ere aplikazioa har dezakete.</p>
      <p>Interfazeak <strong>ataka neutral</strong> baten bidez hitz egiten du datuekin: aplikazioa beste web batean <strong>ostatatzea</strong> eta datuak gordetzen diren zerbitzaria aldatzea erabaki <strong>desberdinak</strong> dira.</p>

      <h3>Ezagutza ere partekatzen da</h3>
      ${TARGETA_ANIMA_TRADUIDA}
      <p>Diseinuak, <strong>Wikiak</strong>, <strong>Konstituzioak</strong> eta kodeak erabaki bakoitzaren zergatia <strong>idatziz</strong> jasotzen dute, mantentze-lana pertsona edo makina bakarraren oroimenaren menpe gera ez dadin.</p>
      <p>Gaur <a href="/anima">MarIA</a>, Claude edo Codex bezalako <strong>adimen artifizialekin</strong> egiten dugu lan, <strong>Pedra Seca</strong> diseinua eta <strong>Trellat</strong> irizpidea errespetatuz.</p>
      <p>Dokumentazio irekiari esker, prestakuntza duen <strong>edozein pertsonak</strong> lanari <strong>jarraipena</strong> eman diezaioke AA tresnak garestitzen badira ere.</p>

      <h3>Herrien arteko sare irekiak</h3>
      <p><strong>Ez dugu nahi</strong> jendea harrapatuko duen <strong>plataforma erraldoi</strong> bat; <strong>Fedibertsora</strong> ateak ireki eta komunitateen arteko harremana erraztu nahi dugu.</p>
      <p><strong>Fedibertsoak</strong> protokolo irekiekin hitz egiten duten <strong>zerbitzari independenteak</strong> lotzen ditu, jabe bakar baten menpe egon gabe. Sóc de Pobleren federazioa gure ibilbide-orriaren parte da oraindik.</p>
      <p><strong>Diaspora</strong> eta <strong>Mastodon</strong> bezalako esperientziek erakusten digute nola konekta daitezkeen <strong>landa-komunitateak</strong> kontrola enpresa bakar bati eman gabe, arreta <strong>merkaturatu gabe</strong>.</p>

      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h3>Nondik gatozen</h3>
        <p>Ikuspegi honen <strong>hazia</strong> <strong>2013-2014</strong> inguruan idatzi zen <em><strong>socdepoble.net</strong></em> atariko <strong>manifestuan</strong>, eta jatorrizko valentzieraz gordetzen dugu:</p>
        <blockquote class="page-content-quote" lang="ca">
          "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
        </blockquote>
        <p>Garai hartan Sóc de Poblek <strong>160.000 jarraitzaile</strong> baino gehiago zituen <strong>Facebooken</strong>, eta algoritmo pribatuen menpekotasun-arriskuak bide propioa irekitzera bultzatu gintuen, <strong>software librearekin</strong> eta <strong>landa-autonomiarekin</strong>.</p>
      </div>

      <h3>Proiektutik tresnetara</h3>
      <p>Hasierako «Modulu Soziala» gaur <strong>Horman</strong> eta <strong>Txatean</strong> bizi da, eta «Tokiko Direktorioa» <strong>Merkatuarekin</strong>, <strong>Egutegiarekin</strong> eta <strong>Maparekin</strong> zabaldu da, gaur <strong>Sóc de Pobleren zerbitzarira</strong> konektatuta.</p>
      <p><strong>Pribatutasunarekiko</strong> konpromisoak bere horretan dirau: <strong>cookie komertzialik</strong> eta telemetria inbaditzailerik gabe.</p>

      <h3>Landan probatzen den kalitatea</h3>
      <p>Landa-aplikazio batek <strong>telefono xumeetan</strong> eta <strong>eguzkitan</strong> ondo funtzionatu behar du, <strong>botoi</strong> handiekin eta ukitu bakoitzaren ondorio argiarekin.</p>
${BLOC_PROJECTE_R32_10.eu}
      <h3>Lau infografia historikoak</h3>
      <p>Lau <strong>infografia</strong> historikoak gordetzen ditugu proiektuaren <strong>hazia</strong> azaltzen dutelako; beren garaiko dokumentuak dira, ez gaurko funtzio guztien zerrenda.</p>${infografiesHtml([
        '1. infografia: Balio ukaezinak eta deszentralizazioa',
        '2. infografia: Mapa kolaboratibo geolokalizatua',
        '3. infografia: Landa-ekintzaileen haztegia',
        '4. infografia: Landa-modulu soziala',
      ])}

      <h3>Proiektuan sakontzeko</h3>
      <p>Orri honek Sóc de Pobleren <strong>historia</strong> eta <strong>ikuspegia</strong> aurkezten ditu. <strong>Wikiak</strong> proiektuaren <strong>muina</strong>, <strong>arkitektura</strong> eta <strong>erabakiak</strong> biltzen ditu.</p>
      <div class="sdp-pagina-accio">
        <a class="sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple" href="/wikidepoble?item=el_projecte">Irakurri proiektuaren muina eta arkitektura</a>
      </div>\n`,
  },
  gl: {
    title: 'O proxecto',
    subtitle: 'Conectar as vilas e aldeas',
    lead: 'Sóc de Poble nace do anhelo de compartir información e coidar a vida nas vilas e aldeas. Esta é a nosa historia, as ferramentas que temos hoxe e o futuro que queremos construír.',
    imageAlt: 'Ilustración dunha vila rural conectada',
    html: `\n      <h3>Unha ferramenta para a vila</h3>
      <p>Sóc de Poble é unha <strong>rede social</strong> cívica pensada para <strong>conectar</strong> os pobos e as persoas que viven neles. Queremos compartir información <strong>sen depender</strong> dos grandes <strong>monopolios</strong> de datos, cunha ferramenta <strong>clara</strong> e <strong>próxima</strong> para calquera <strong>persoa maior</strong>.</p>
      <p>O noso <strong>horizonte</strong> é unha <strong>autonomía</strong> sen internet: que os <strong>aparellos</strong> garden datos e se poñan de acordo ao volver a conexión. Segue sendo unha visión de <strong>futuro</strong>; hoxe as funcións compartidas <strong>precisan conexión</strong>.</p>

      <h3>Como nos conectamos hoxe</h3>
      <p>Construímos a <strong>aplicación</strong> e os <strong>datos</strong> como <strong>pezas separadas</strong>: a pantalla é a fachada e detrás un <strong>conector</strong> le e garda a información sen refacer toda a interface.</p>
      <p>Hoxe, os datos compartidos gárdanse n’<strong>o servidor de Sóc de Poble</strong> sobre <strong>Supabase</strong>, cos <strong>permisos</strong> de cada persoa como única <strong>fonte de verdade</strong> (ADR-2026-08).</p>
      <p><strong>Sollutia</strong> é o <strong>anfitrión</strong> e socio de infraestrutura: aloxa a aplicación e abre a súa API só en <strong>lectura</strong>, sen substituír o servidor de datos de Sóc de Poble. <strong>WordPress</strong> e <strong>Joomla</strong> tamén poden acoller a aplicación como webs anfitrioas.</p>
      <p>A interface fala cos datos mediante un <strong>porto neutral</strong>: <strong>aloxar</strong> a aplicación noutra web e cambiar onde se gardan os datos son decisións <strong>diferentes</strong>.</p>

      <h3>O coñecemento tamén se comparte</h3>
      ${TARGETA_ANIMA_TRADUIDA}
      <p>O deseño, a <strong>Wiki</strong>, a <strong>Constitución</strong> e o código deixan <strong>decisións escritas</strong> e accesibles para que o <strong>mantemento</strong> non dependa só da memoria dunha persoa ou máquina.</p>
      <p>Hoxe traballamos con <strong>intelixencias artificiais</strong> como <a href="/anima">MarIA</a>, Claude ou Codex baixo as regras de <strong>Pedra Seca</strong> e o <strong>Trellat</strong>.</p>
      <p>Tamén preparamos o proxecto para que <strong>calquera persoa</strong> formada poida <strong>continuar</strong> o traballo sen depender dun modelo concreto nin perder a <strong>identidade</strong> comunitaria.</p>

      <h3>Redes abertas entre pobos</h3>
      <p><strong>Non queremos</strong> unha <strong>plataforma xigante</strong> que atrape a atención: queremos abrir portas ao <strong>Fediverso</strong> e facilitar a <strong>comunicación entre comunidades</strong>.</p>
      <p>O <strong>Fediverso</strong> conecta <strong>servidores independentes</strong> con <strong>protocolos abertos</strong> sen un <strong>mesmo dono</strong>; a federación completa segue na nosa folla de ruta.</p>
      <p>Proxectos como <strong>Diaspora</strong> e <strong>Mastodon</strong> orientan como relacionar as <strong>comunidades rurais</strong> <strong>sen ceder o control</strong> nin comercializar a atención veciñal.</p>

      <div class="sdp-subtargeta" data-sdp-subtargeta="">
        <h3>De onde vimos</h3>
        <p>A <strong>semente</strong> desta visión formulouse cara a <strong>2013-2014</strong> no <strong>manifesto</strong> do Portal de Pobles Connectats en <em><strong>socdepoble.net</strong></em>, conservado aquí no seu valenciano orixinal:</p>
        <blockquote class="page-content-quote" lang="ca">
          "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
        </blockquote>
        <p>Naquela época, Sóc de Poble xa reunía máis de <strong>160.000 seguidores</strong> en <strong>Facebook</strong>, facendo visible tanto a capacidade de <strong>conectar</strong> persoas como o <strong>risco</strong> dos algoritmos privados e impulsando un camiño propio con <strong>software libre</strong> e <strong>autonomía</strong> rural.</p>
      </div>

      <h3>Do proxecto ás ferramentas</h3>
      <p>O antigo «Módulo Social» ten continuidade no <strong>Muro</strong> e no <strong>Chat</strong>, e o «Directorio Local» ampliouse co <strong>Mercado</strong>, a <strong>Axenda</strong> e o <strong>Mapa</strong>, ferramentas conectadas hoxe a <strong>o servidor de Sóc de Poble</strong>.</p>
      <p>O compromiso coa <strong>privacidade</strong> continúa firme: <strong>sen cookies</strong> comerciais nin <strong>telemetría</strong> invasiva.</p>

      <h3>Calidade que se proba no campo</h3>
      <p>Unha aplicación rural ten que funcionar en <strong>teléfonos humildes</strong> e baixo o <strong>sol</strong>, con <strong>botóns</strong> grandes e resposta clara en cada toque.</p>
${BLOC_PROJECTE_R32_10.gl}
      <h3>As catro infografías históricas</h3>
      <p>Conservamos as catro <strong>infografías</strong> históricas porque explican a <strong>semente</strong> do proxecto; son documentos do <strong>seu momento</strong> e non unha lista de funcións xa activas.</p>${infografiesHtml([
        'Infografía 1: Valores innegociables e descentralización',
        'Infografía 2: Mapeo colaborativo xeolocalizado',
        'Infografía 3: Viveiro de emprendemento rural',
        'Infografía 4: Módulo social rural',
      ])}

      <h3>Para profundar no proxecto</h3>
      <p>Esta páxina presenta a <strong>historia</strong> e a <strong>visión</strong> de Sóc de Poble. A <strong>Wiki</strong> recolle o <strong>núcleo</strong>, a <strong>arquitectura</strong> e as <strong>decisións</strong> técnicas.</p>
      <div class="sdp-pagina-accio">
        <a class="sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple" href="/wikidepoble?item=el_projecte">Ler o núcleo e a arquitectura do proxecto</a>
      </div>\n`,
  },
});

/* IMPORTANT per a onadaR18Carbon.test.jsx:81-86 sobre PAGE_COPY.disseny:
 * PROHIBIT usar: sota demanda, bajo demanda, baixo demanda, lazy-loaded, eskaeraren arabera,
 * per defecte, por defecto, desendollable, desenchufable, paquet(s) de dades, paquetes de datos,
 * data packages, datu-pakete o <code>.sdp-. */
export const BLOC_DISSENY_R32_10 = Object.freeze({
  ca: `\n      <h3>Llibre viu entre la Wiki i el Mur i columnes plegades persistents</h3>
      <p>La <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> adopta la mateixa anatomia editorial que el <a href="/mur"><strong>Mur</strong></a>: <strong>portada quadrada</strong>, <strong>dates reals</strong>, <strong>historial de versions en Git</strong> i l’opció d’edició avançada <strong>«Mostrar també al Mur»</strong> per acostar documents vius al veïnat sense duplicar-los. A més, els espais en columnes (<a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, <a href="/notes"><strong>Bloc de Notes</strong></a>, <strong>Disseny</strong> i <a href="/perfil"><strong>Perfil</strong></a>) recorden al navegador quines <strong>columnes laterals</strong> has deixat <strong>plegades</strong> per conservar l’amplada de lectura.</p>

      <h3>Ubicació rural amb «Amaga el lloc» i avís d’actualització d’un toc</h3>
      <p>D’entrada, quan es publica des del territori s’acompanya el <strong>lloc rural</strong> juntament amb el botó tàctil de <strong>48 × 48 píxels</strong> <strong>«Amaga el lloc»</strong>, que permet retirar la ubicació amb un sol toc abans d’enviar res al <strong>servidor de Sóc de Poble</strong>. I quan els <strong>serveis de Sóc de Poble</strong> publiquen una versió nova, una <strong>barra d’actualització d’un toc</strong> avisa sense finestres emergents i comprova que no es perden els <strong>esborranys oberts</strong>.</p>\n`,
  es: `\n      <h3>Libro vivo entre la Wiki y el Muro y columnas plegadas persistentes</h3>
      <p>La <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> comparte la misma anatomía editorial que el <a href="/mur"><strong>Muro</strong></a>: <strong>portada cuadrada</strong>, <strong>fechas reales</strong>, <strong>historial de versiones en Git</strong> y la casilla de edición avanzada <strong>«Mostrar también en el Muro»</strong> para acercar guías vivas al vecindario sin duplicarlas. Además, los espacios por columnas (<a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, <a href="/notes"><strong>Bloc de Notas</strong></a>, <strong>Diseño</strong> y <a href="/perfil"><strong>Perfil</strong></a>) recuerdan en el navegador qué <strong>columnas laterales</strong> dejaste <strong>plegadas</strong> para mantener limpia la lectura.</p>

      <h3>Ubicación rural con «Ocultar el lugar» y aviso de actualización de un toque</h3>
      <p>De entrada, al publicar desde el territorio se acompaña el <strong>lugar rural</strong> junto al botón táctil de <strong>48 × 48 píxeles</strong> <strong>«Ocultar el lugar»</strong> (<code>Amaga el lloc</code>), que retira la ubicación con un solo toque antes de guardar nada en <strong>el servidor de Sóc de Poble</strong>. Y cuando los <strong>servicios de Sóc de Poble</strong> publican una versión nueva, una <strong>barra de actualización de un toque</strong> avisa sin ventanas modales y preserva los <strong>borradores abiertos</strong>.</p>\n`,
  en: `\n      <h3>Living book across Wiki and Wall and persistent folded columns</h3>
      <p>The <a href="/wikidepoble"><strong>Village Wiki</strong></a> shares the same editorial anatomy as the <a href="/mur"><strong>Wall</strong></a>: a <strong>square cover</strong>, <strong>real dates</strong>, <strong>Git version history</strong> and the advanced-editing toggle <strong>“Also show on the Wall”</strong> so living guides reach neighbours without duplication. Column workspaces (<a href="/wikidepoble"><strong>Village Wiki</strong></a>, <a href="/notes"><strong>Notebook</strong></a>, <strong>Design</strong> and <a href="/perfil"><strong>Profile</strong></a>) also remember in the browser which <strong>side columns</strong> stay <strong>folded</strong> across visits.</p>

      <h3>Rural place context with “Hide place” and one-tap update notice</h3>
      <p>Initially, publishing from the countryside attaches <strong>rural place context</strong> right beside a <strong>48 × 48 pixel</strong> <strong>“Hide place”</strong> button (<code>Amaga el lloc</code>) that clears location in a single tap before saving to <strong>the Sóc de Poble server</strong>. Whenever <strong>Sóc de Poble services</strong> publish a newer version, an inline <strong>one-tap update bar</strong> notifies you without modal pop-ups while protecting <strong>open drafts</strong>.</p>\n`,
  eu: `\n      <h3>Liburu bizia Wikiaren eta Hormaren artean eta tolestutako zutabe iraunkorrak</h3>
      <p><a href="/wikidepoble"><strong>Herriko Wikiak</strong></a> eta <a href="/mur"><strong>Hormak</strong></a> anatomia editorial bera partekatzen dute: <strong>azal karratua</strong>, <strong>benetako datak</strong>, <strong>Git bertsio-historia</strong> eta edizio aurreratuko <strong>«Erakutsi Horman ere»</strong> aukera, dokumentu biziak bikoiztu gabe zabaltzeko. Gainera, zutabe bidezko eremuek (<a href="/wikidepoble"><strong>Herriko Wikia</strong></a>, <a href="/notes"><strong>Koadernoa</strong></a>, <strong>Diseinua</strong> eta <a href="/perfil"><strong>Profila</strong></a>) nabigatzailean gogoratzen dute zein <strong>alboko zutabe</strong> utzi dituzun <strong>tolestuta</strong>.</p>

      <h3>Landa-kokapena «Ezkutatu lekua» botoiarekin eta ukitu bakarreko eguneratzea</h3>
      <p>Hasieratik, lurraldetik argitaratzean <strong>landa-lekua</strong> erakusten da <strong>48 × 48 pixeleko</strong> <strong>«Ezkutatu lekua»</strong> botoiarekin batera (<code>Amaga el lloc</code>), ukitu bakarrean kokapena kentzeko <strong>Sóc de Pobleren zerbitzarian</strong> ezer gorde aurretik. Eta <strong>Sóc de Pobleren zerbitzuek</strong> bertsio berria argitaratzen dutenean, lerroko <strong>eguneratze-barrak</strong> leiho modalik gabe abisatzen du <strong>irekitako zirriborroak</strong> babestuz.</p>\n`,
  gl: `\n      <h3>Libro vivo entre a Wiki e o Muro e columnas pregadas persistentes</h3>
      <p>A <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> comparte a mesma anatomía editorial ca o <a href="/mur"><strong>Muro</strong></a>: <strong>portada cadrada</strong>, <strong>datas reais</strong>, <strong>historial de versións en Git</strong> e a opción de edición avanzada <strong>«Mostrar tamén no Muro»</strong> para achegar guías vivas á veciñanza sen duplicalas. Ademais, os espazos en columnas (<a href="/wikidepoble"><strong>Wiki de Poble</strong></a>, <a href="/notes"><strong>Caderno de Notas</strong></a>, <strong>Deseño</strong> e <a href="/perfil"><strong>Perfil</strong></a>) lembran no navegador que <strong>columnas laterais</strong> deixaches <strong>pregadas</strong>.</p>

      <h3>Localización rural con «Agochar o lugar» e aviso de actualización dun toque</h3>
      <p>De entrada, ao publicar desde o territorio acompáñase o <strong>lugar rural</strong> xunto ao botón táctil de <strong>48 × 48 píxeles</strong> <strong>«Agochar o lugar»</strong> (<code>Amaga el lloc</code>), que retira a localización cun só toque antes de gardar nada n’<strong>o servidor de Sóc de Poble</strong>. E cando os <strong>servizos de Sóc de Poble</strong> publican unha versión nova, unha <strong>barra de actualización dun toque</strong> avisa sen xanelas emerxentes e coida os <strong>borradores abertos</strong>.</p>\n`,
});

/* Apartat 4 per a NODE_ZERO_R23 (/page/node-zero): ha de complir estrictament infraccionsT8:
 *   - Cap etiqueta dins d'h3/h4 i cap punt final al títol.
 *   - Cada <p> amb <strong>.
 *   - Enllaços interns a rutes vives sense query string.
 *   - CEV-3: qualsevol menció a escoles locals precedida per 8 / huit / ocho / eight / zortzi / oito. */
export const APARTAT_NODE_ZERO_R32_10 = Object.freeze({
  ca: [
    '4 · Llibre viu Wiki i Mur, actualització d’un toc, columnes persistents i control Amaga el lloc',
    'En les onades R32.5 a R32.10, l’assemblea de les <strong>8 escoles locals</strong> del Mac mini amb <strong>xip Apple M4</strong> (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> i <code>hermes3:8b</code>) acompanya el <strong>llibre viu</strong> entre la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> i el <a href="/mur"><strong>Mur</strong></a>, amb <strong>portada quadrada</strong>, dates reals, historial Git i l’opció <strong>«Mostrar també al Mur»</strong>.',
    'En el mateix cicle es consoliden les <strong>columnes plegades persistents</strong> a la Wiki, <a href="/notes">Bloc de Notes</a>, <a href="/disseny">Disseny</a> i <a href="/perfil">Perfil</a>, l’<strong>avís d’actualització d’un toc</strong> que preserva els <strong>esborranys oberts</strong> en <strong>els serveis de Sóc de Poble</strong> i la <strong>ubicació rural</strong> amb el botó <strong>«Amaga el lloc»</strong>, mentre les dades compartides viuen en <strong>el servidor de Sóc de Poble</strong>.',
  ],
  es: [
    '4 · Libro vivo Wiki y Muro, actualización de un toque, columnas persistentes y control Ocultar el lugar',
    'En las oleadas R32.5 a R32.10, la asamblea de las <strong>8 escuelas locales</strong> del Mac mini con <strong>chip Apple M4</strong> (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> y <code>hermes3:8b</code>) acompaña el <strong>libro vivo</strong> entre la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> y el <a href="/mur"><strong>Muro</strong></a>, con <strong>portada cuadrada</strong>, fechas reales, historial Git y la opción <strong>«Mostrar también en el Muro»</strong>.',
    'En el mismo ciclo se consolidan las <strong>columnas plegadas persistentes</strong> en la Wiki, <a href="/notes">Bloc de Notas</a>, <a href="/disseny">Diseño</a> y <a href="/perfil">Perfil</a>, el <strong>aviso de actualización de un toque</strong> que protege los <strong>borradores abiertos</strong> en <strong>los servicios de Sóc de Poble</strong> y la <strong>ubicación rural</strong> con <strong>«Ocultar el lugar»</strong>, mientras los datos compartidos residen en <strong>el servidor de Sóc de Poble</strong>.',
  ],
  en: [
    '4 · Living Wiki and Wall book, one-tap update notice, persistent columns and Hide place control',
    'Across waves R32.5 to R32.10, the assembly of the <strong>8 local Node 0 schools</strong> on the Mac mini with an <strong>Apple M4 chip</strong> (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> and <code>hermes3:8b</code>) audits the <strong>living book</strong> bridging the <a href="/wikidepoble"><strong>Village Wiki</strong></a> and the <a href="/mur"><strong>Wall</strong></a>, with a <strong>square cover</strong>, real dates, Git history and <strong>“Also show on the Wall”</strong>.',
    'The same cycle delivers <strong>persistent folded columns</strong> across Wiki, <a href="/notes">Notebook</a>, <a href="/disseny">Design</a> and <a href="/perfil">Profile</a>, the <strong>one-tap update notice</strong> safeguarding <strong>open drafts</strong> across <strong>Sóc de Poble services</strong> and <strong>rural place context</strong> with <strong>“Hide place”</strong>, while shared data lives on <strong>the Sóc de Poble server</strong>.',
  ],
  eu: [
    '4 · Wiki eta Horma liburu bizia, ukitu bakarreko eguneratzea, zutabe iraunkorrak eta Ezkutatu lekua kontrola',
    'R32.5etik R32.10era bitarteko olatuetan, <strong>Apple M4 txipa</strong> duen Mac miniko <strong>8 eskola lokalen</strong> batzarrak (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> eta <code>hermes3:8b</code>) <a href="/wikidepoble"><strong>Herriko Wikiaren</strong></a> eta <a href="/mur"><strong>Hormaren</strong></a> arteko <strong>liburu bizia</strong> ikuskatzen du, <strong>azal karratuarekin</strong>, benetako datekin, Git historiarekin eta <strong>«Erakutsi Horman ere»</strong> aukerarekin.',
    'Ziklo berean finkatzen dira <strong>tolestutako zutabe iraunkorrak</strong> Wikian, <a href="/notes">Koadernoan</a>, <a href="/disseny">Diseinuan</a> eta <a href="/perfil">Profilean</a>, <strong>irekitako zirriborroak</strong> babesten dituen <strong>Sóc de Pobleren zerbitzuetako</strong> <strong>ukitu bakarreko eguneratze-abisua</strong> eta <strong>landa-kokapena</strong> <strong>«Ezkutatu lekua»</strong> kontrolarekin, datu partekatuak <strong>Sóc de Pobleren zerbitzarian</strong> gordetzen diren bitartean.',
  ],
  gl: [
    '4 · Libro vivo Wiki e Muro, actualización dun toque, columnas persistentes e control Agochar o lugar',
    'Nas ondas R32.5 a R32.10, a asemblea das <strong>8 escolas locais</strong> do Mac mini con <strong>chip Apple M4</strong> (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> e <code>hermes3:8b</code>) acompaña o <strong>libro vivo</strong> entre a <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> e o <a href="/mur"><strong>Muro</strong></a>, con <strong>portada cadrada</strong>, datas reais, historial Git e a opción <strong>«Mostrar tamén no Muro»</strong>.',
    'No mesmo ciclo consolídanse as <strong>columnas pregadas persistentes</strong> na Wiki, <a href="/notes">Caderno de Notas</a>, <a href="/disseny">Deseño</a> e <a href="/perfil">Perfil</a>, o <strong>aviso de actualización dun toque</strong> que protexe os <strong>borradores abertos</strong> n’<strong>os servizos de Sóc de Poble</strong> e a <strong>localización rural</strong> con <strong>«Agochar o lugar»</strong>, mentres os datos compartidos viven n’<strong>o servidor de Sóc de Poble</strong>.',
  ],
});

/* Preàmbul didàctic R32.10 per a /page/fediversity en les 5 llengües (s'inserix ABANS del dossier històric). */
export const FEDIVERSITY_R32_10_PREAMBUL = Object.freeze({
  ca: `\n      <h3>Continuïtat viva R32.5–R32.10 · Llibre viu Wiki ↔ Mur, actualització d’un toc i privacitat rural</h3>
      <p>Sense subvenció externa i per convicció cívica pròpia, el cicle <strong>v1.2.7–v1.2.8</strong> consolida el <strong>llibre viu</strong> entre la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> i el <a href="/mur"><strong>Mur</strong></a> amb <strong>portada quadrada</strong>, dates reals, historial de versions en Git i la casella d’edició avançada <strong>«Mostrar també al Mur»</strong>, juntament amb les <strong>columnes laterals plegades</strong> persistents a la Wiki, <a href="/notes">Bloc de Notes</a>, <a href="/disseny">Disseny</a> i <a href="/perfil">Perfil</a>.</p>
      <p>En paral·lel, els mòbils de prova i el navegador reben un <strong>avís d’actualització d’un toc</strong> que conserva els <strong>esborranys oberts</strong>, les publicacions rurals oferixen el botó visible <strong>«Amaga el lloc»</strong> i l’auditoria passa per les <strong>8 escoles locals</strong> del <a href="/page/node-zero"><strong>Node 0</strong></a> (<code>deepseek-r1:14b</code>, <code>qwen2.5-coder:14b</code>, <code>phi4:14b</code>, <code>mistral-nemo:12b</code>, <code>gemma3:12b</code>, <code>glm4:9b</code>, <code>iaia-maria:latest</code> i <code>hermes3:8b</code>), deixant clar que hui totes les dades compartides operen en <strong>el servidor de Sóc de Poble</strong> i <strong>els serveis de Sóc de Poble</strong>.</p>`,
  es: `\n      <h3>Continuidad viva R32.5–R32.10 · Libro vivo Wiki ↔ Muro, actualización de un toque y privacidad rural</h3>
      <p>Por convicción cívica propia, el ciclo <strong>v1.2.7–v1.2.8</strong> consolida el <strong>libro vivo</strong> entre la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> y el <a href="/mur"><strong>Muro</strong></a> con <strong>portada cuadrada</strong>, fechas reales, historial Git y la opción <strong>«Mostrar también en el Muro»</strong>, junto con la persistencia de <strong>columnas laterales plegadas</strong> en Wiki, <a href="/notes">Bloc de Notas</a>, <a href="/disseny">Diseño</a> y <a href="/perfil">Perfil</a>.</p>
      <p>En paralelo, los móviles de prueba y la web reciben un <strong>aviso de actualización de un toque</strong> que protege los <strong>borradores abiertos</strong>, las publicaciones rurales ofrecen el botón directo <strong>«Ocultar el lugar»</strong> (<code>Amaga el lloc</code>) y la auditoría recorre las <strong>8 escuelas locales</strong> del <a href="/page/node-zero"><strong>Node 0</strong></a>, precisando siempre que los datos compartidos operan hoy en <strong>el servidor de Sóc de Poble</strong> y <strong>los servicios de Sóc de Poble</strong>.</p>`,
  en: `\n      <h3>Living continuity R32.5–R32.10 · Living Wiki ↔ Wall book, one-tap updates and rural privacy</h3>
      <p>Continuing independently, the <strong>v1.2.7–v1.2.8</strong> cycle consolidates the <strong>living book</strong> connecting the <a href="/wikidepoble"><strong>Village Wiki</strong></a> and the <a href="/mur"><strong>Wall</strong></a> with a <strong>square cover</strong>, real dates, Git history and <strong>“Also show on the Wall”</strong>, alongside persistent <strong>folded side columns</strong> across Wiki, <a href="/notes">Notebook</a>, <a href="/disseny">Design</a> and <a href="/perfil">Profile</a>.</p>
      <p>In parallel, test phones and the web show a <strong>one-tap update notice</strong> safeguarding <strong>open drafts</strong>, rural posts offer a visible <strong>“Hide place”</strong> button (<code>Amaga el lloc</code>) and pre-release checks run across the <strong>8 local Node 0 schools</strong> on <a href="/page/node-zero"><strong>Node 0</strong></a>, stating clearly that shared community data runs today on <strong>the Sóc de Poble server</strong> and <strong>Sóc de Poble services</strong>.</p>`,
  eu: `\n      <h3>Jarraipen bizia R32.5–R32.10 · Wiki ↔ Horma liburu bizia, ukitu bakarreko eguneratzea eta landa-pribatutasuna</h3>
      <p>Bere bide propiotik jarraituz, <strong>v1.2.7–v1.2.8</strong> zikloak <a href="/wikidepoble"><strong>Herriko Wikiaren</strong></a> eta <a href="/mur"><strong>Hormaren</strong></a> arteko <strong>liburu bizia</strong> finkatzen du <strong>azal karratuarekin</strong>, benetako datekin, Git historiarekin eta <strong>«Erakutsi Horman ere»</strong> aukerarekin, baita <strong>tolestutako alboko zutabe</strong> iraunkorrak ere Wikian, <a href="/notes">Koadernoan</a>, <a href="/disseny">Diseinuan</a> eta <a href="/perfil">Profilean</a>.</p>
      <p>Aldi berean, proba-mugikorrek eta webak <strong>irekitako zirriborroak</strong> babesten dituen <strong>ukitu bakarreko eguneratze-abisua</strong> jasotzen dute, landa-argitalpenek <strong>«Ezkutatu lekua»</strong> botoia (<code>Amaga el lloc</code>) eskaintzen dute eta <a href="/page/node-zero"><strong>0 Nodoaren</strong></a> <strong>8 eskola lokalek</strong> ikuskaritza osatzen dute, datu partekatuak gaur <strong>Sóc de Pobleren zerbitzarian</strong> eta <strong>Sóc de Pobleren zerbitzuetan</strong> daudela argi utziz.</p>`,
  gl: `\n      <h3>Continuidade viva R32.5–R32.10 · Libro vivo Wiki ↔ Muro, actualización dun toque e privacidade rural</h3>
      <p>Por convicción propia, o ciclo <strong>v1.2.7–v1.2.8</strong> consolida o <strong>libro vivo</strong> entre a <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> e o <a href="/mur"><strong>Muro</strong></a> con <strong>portada cadrada</strong>, datas reais, historial Git e a opción <strong>«Mostrar tamén no Muro»</strong>, xunto coa memoria de <strong>columnas laterais pregadas</strong> na Wiki, <a href="/notes">Caderno de Notas</a>, <a href="/disseny">Deseño</a> e <a href="/perfil">Perfil</a>.</p>
      <p>En paralelo, os móbiles de proba e a web amosan un <strong>aviso de actualización dun toque</strong> que coida os <strong>borradores abertos</strong>, as publicacións rurais ofrecen o botón directo <strong>«Agochar o lugar»</strong> (<code>Amaga el lloc</code>) e a revisión percorre as <strong>8 escolas locais</strong> do <a href="/page/node-zero"><strong>Nodo 0</strong></a>, deixando claro que os datos compartidos viven hoxe n’<strong>o servidor de Sóc de Poble</strong> e n’<strong>os servizos de Sóc de Poble</strong>.</p>`,
});
