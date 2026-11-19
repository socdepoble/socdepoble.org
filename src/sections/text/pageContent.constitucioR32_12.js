/* Onada R32.12 · Lot 02 · Constitució de Sóc de Poble en les 5 llengües (ca, es, en, eu, gl)
 * amb Llei 35 (jerarquia <h3> → <h4> → <h5> i 6–8 <strong> d'escaneig per paràgraf),
 * Llei 32 («el servidor de Sóc de Poble» / «els serveis de Sóc de Poble», zero «sobirà» sobre IAIA/Node 0),
 * core-llegibilitat-text §6 i enllaços interns canònics certificats.
 * Zero mencions a botigues o paquets d'altres plataformes mòbils (Regla 2.3.10 d'App Store).
 */

export const TRADUCCIONS_CONSTITUCIO_R32_12 = Object.freeze({
  es: {
    title: 'Constitución',
    subtitle: 'Normas técnicas, éticas y de gobernanza del proyecto',
    lead: 'Estas quince reglas definen cómo se diseña la interfaz, cómo se protegen los datos y cómo trabajan las personas y los agentes de inteligencia artificial dentro de Sóc de Poble.',
    imageAlt: 'Ilustración asociada a la Constitución de Sóc de Poble',
    html: `\n      <h3>Marco Normativo del Proyecto</h3>
      <p>Este documento recoge la <strong>Constitución técnica y cívica</strong> de <a href="/projecte"><strong>Sóc de Poble</strong></a>. Sus <strong>15 artículos</strong> establecen las <strong>reglas obligatorias</strong> que rigen el <strong>código fuente</strong>, el tratamiento de los <strong>datos personales</strong> y la actuación de cualquier persona o <strong>agente de inteligencia artificial</strong> en la plataforma. Cada decisión de arquitectura o de diseño se evalúa según estos <strong>criterios verificables</strong>.</p>

      <h4>Capítulo I: Accesibilidad y Usabilidad Universal</h4>

      <h5>1. Prioridad de las Personas Mayores</h5>
      <p>La <strong>tecnología se adapta</strong> a la persona y, de forma prioritaria, a la <strong>persona mayor</strong>. Muchas plataformas digitales <strong>excluyen a la gente mayor</strong> con <strong>interfaces confusas</strong>, letra pequeña y menús cambiantes; en Sóc de Poble las situamos en el <strong>centro del diseño</strong>. Cualquier cambio que genere <strong>confusión operativa</strong> o dificulte el uso cotidiano a un vecino o vecina se <strong>corrige o se revierte</strong>.</p>

      <h5>2. Legibilidad a Pleno Sol y Áreas Táctiles</h5>
      <p>La estética visual nunca puede reducir la <strong>legibilidad de la pantalla</strong>. Todas las vistas mantienen un <strong>contraste alto</strong> de <strong>nivel WCAG AAA</strong> para leerse con comodidad incluso en el exterior y bajo la <strong>luz del sol</strong>. Se aplica una <strong>tipografía clara</strong> y proporcionada y unas <strong>áreas táctiles mínimas</strong> de <strong>48 × 48 píxeles</strong> en todos los botones y controles interactivos.</p>

      <h5>3. Lenguaje Claro y Didáctico</h5>
      <p>Toda la interfaz, la documentación y las respuestas de los asistentes se redactan en un <strong>valenciano normativo</strong>, directo, didáctico y <strong>fácil de entender</strong>, con <strong>traducción completa</strong> a las <strong>cinco lenguas del sistema</strong>. Se evitan el <strong>lenguaje enrevesado</strong>, los <strong>anglicismos innecesarios</strong> y la <strong>retórica vacía</strong> para explicar con claridad qué hace cada opción.</p>

      <h5>4. Prudencia Operativa y Aprobación Humana</h5>
      <p>Los agentes de inteligencia artificial <strong>no pueden ejecutar</strong> acciones destructivas ni <strong>cambios irreversibles</strong> de forma autónoma. Ningún proceso automatizado tiene permiso para realizar <strong>borrados masivos</strong> de datos ni modificar el <strong>estado de producción</strong> sin una <strong>comprobación previa</strong> en un entorno aislado. Ante cualquier operación delicada, el sistema <strong>se detiene</strong> y solicita la <strong>aprobación explícita</strong> de una persona responsable.</p>

      <h4>Capítulo II: Soberanía de Datos y Privacidad</h4>

      <h5>5. Arquitectura Conectada y Puerto Neutral</h5>
      <p>Las <strong>funcionalidades compartidas</strong> de Sóc de Poble operan sobre una arquitectura <strong>conectada en tiempo real</strong> con la base de datos <strong>PostgreSQL / Supabase</strong> en <strong>el servidor de Sóc de Poble</strong> y el piloto físico <a href="/page/node-zero"><strong>Node 0</strong></a>, detrás de un <strong>puerto de datos neutral</strong> que permite alojar la aplicación en <strong>cualquier anfitrión web</strong> cumpliendo el <strong>Reglamento General de Protección de Datos (RGPD)</strong>.</p>

      <h5>6. Sin Rastreadores Comerciales</h5>
      <p>Tal como detalla <a href="/legal"><strong>Legal y privacidad</strong></a>, Sóc de Poble aplica la <strong>prohibición total</strong> de <strong>rastreadores publicitarios</strong> y perfilado comercial. La plataforma <strong>no incluye píxeles</strong> de seguimiento de anuncios, <strong>excluye herramientas</strong> como <strong>Google Analytics</strong> y rechaza comercializar la atención vecinal; la analítica es <strong>propia, anónima y sin cookies</strong> de terceros en <strong>los servicios de Sóc de Poble</strong>.</p>

      <h5>7. Privacidad de Entrada y Propiedad del Autor</h5>
      <p>Las <strong>notas personales</strong>, borradores y <strong>archivos privados</strong> permanecen <strong>protegidos por permisos de acceso</strong> vinculados a su autor. Todo el contenido creado <strong>pertenece a quien lo escribe</strong>, que decide en cada momento si lo <strong>mantiene privado</strong> o lo publica en el <strong>muro comunitario</strong>. Ningún modelo externo de inteligencia artificial tiene <strong>permiso para entrenarse</strong> con los datos privados de la comunidad.</p>

      <h5>8. Preservación Documental y Archivo Histórico</h5>
      <p>Ningún proceso automático de limpieza puede <strong>eliminar información</strong> comunitaria, <strong>patrimonio local</strong> ni <strong>documentación técnica</strong> sin revisión. Cuando un documento de trabajo deja de estar activo, <strong>no se borra</strong>: se traslada de manera ordenada al <strong>archivo histórico consultable</strong> del proyecto, preservando la <strong>memoria documental</strong> y evitando <strong>pérdidas accidentales</strong> de información.</p>

      <h4>Capítulo III: Arquitectura de Código y Diseño Pedra Seca</h4>

      <h5>9. Estructura HTML5 Semántica</h5>
      <p>La aplicación se construye con <strong>HTML5 semántico</strong>, <strong>accesible por teclado</strong> y <strong>lectores de pantalla</strong>, evitando dependencias innecesarias de <strong>bibliotecas cerradas</strong>. La <strong>estructura del documento</strong> define el significado y la <strong>jerarquía de cada página</strong>, mientras que la <strong>hoja de estilos CSS</strong> gestiona la presentación visual de manera separada y limpia.</p>

      <h5>10. Sistema de Diseño Pedra Seca y Tokens</h5>
      <p>Los <strong>componentes visuales</strong> documentados en <a href="/disseny"><strong>Diseño Pedra Seca</strong></a> se organizan en <strong>capas claras</strong> y utilizan un conjunto unificado de <strong>variables de diseño</strong> (los <strong>tokens <code>--sdp-</code></strong>) para colores, espaciados y tipografía. Queda <strong>prohibido</strong> mezclar <strong>clases de utilidad</strong> como Tailwind CSS o <strong>colores fijos</strong> fuera de los tokens declarados.</p>

      <h5>11. Separación de Estilos sin Atributos en Línea</h5>
      <p>Para garantizar que todas las vistas mantengan la <strong>coherencia visual</strong> tanto en <strong>tema claro</strong> como en <strong>tema oscuro</strong>, no se utilizan <strong>estilos en línea</strong> (<code>style</code>) dentro de los componentes para fijar <strong>colores o tamaños estáticos</strong>. Todas las reglas visuales residen en los <strong>archivos CSS</strong> del sistema de diseño y se <strong>validan automáticamente</strong>.</p>

      <h5>12. Intervención Mínima y Preservación del Código Probado</h5>
      <p>Todo cambio sobre el <strong>código existente</strong> debe ser <strong>acotado y preciso</strong>, respetuoso con las funcionalidades que ya están <strong>en marcha</strong> y <strong>verificadas con pruebas</strong>. Las correcciones van directamente a la <strong>causa real del problema</strong>, evitando <strong>reescrituras masivas</strong> innecesarias que puedan <strong>introducir regresiones</strong> en otras partes de la aplicación.</p>

      <h4>Capítulo IV: Gobernanza, Auditoría y Continuidad</h4>

      <h5>13. Dirección y Aprobación Humana</h5>
      <p>Los <strong>agentes de inteligencia artificial</strong> aportan <strong>capacidad de análisis</strong>, desarrollo y <strong>verificación automatizada</strong>, pero la <strong>decisión final</strong> corresponde siempre a la <strong>dirección humana</strong> del proyecto. Los cambios de arquitectura o de contenido estructural se preparan en <strong>entornos aislados</strong> y requieren <strong>validación humana explícita</strong> antes de entrar en producción.</p>

      <h5>14. Trazabilidad, Auditoría Criptográfica y Registro Documental</h5>
      <p>Ningún cambio relevante de infraestructura o de código se aplica sin <strong>trazabilidad completa</strong>. Toda intervención requiere un <strong>plan de implementación</strong> previo, paquetes verificados con <strong>huella criptográfica SHA-256</strong>, ejecución de las <strong>puertas de calidad</strong> automatizadas e <strong>informes de auditoría</strong> donde quedan registradas las <strong>decisiones técnicas</strong> y las <strong>pruebas superadas</strong>.</p>

      <h5>15. Evolución Tecnológica y Memoria del Territorio</h5>
      <p>La <strong>documentación abierta</strong> de la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> y el <strong>patrimonio recogido</strong> garantizan la <strong>continuidad del proyecto</strong> a largo plazo. Mientras el código y la infraestructura <strong>evolucionan continuamente</strong> con <strong>estándares libres y federados</strong>, Sóc de Poble mantiene intacta su <strong>misión fundacional</strong> de servicio público rural, impulso cooperativo y <strong>conexión entre pueblos</strong>.</p>\n    `,
  },
  en: {
    title: 'Constitution',
    subtitle: 'Technical, ethical and governance rules of the project',
    lead: 'These fifteen rules define how the interface is designed, how data is protected, and how people and artificial intelligence agents work together inside Sóc de Poble.',
    imageAlt: 'Illustration associated with the Sóc de Poble Constitution',
    html: `\n      <h3>Project Regulatory Framework</h3>
      <p>This document sets out the <strong>technical and civic Constitution</strong> of <a href="/projecte"><strong>Sóc de Poble</strong></a>. Its <strong>15 articles</strong> establish the <strong>mandatory rules</strong> governing the <strong>source code</strong>, the handling of <strong>personal data</strong> and the operation of every contributor or <strong>artificial intelligence agent</strong> across the platform. Every architectural or design decision is checked against these <strong>verifiable criteria</strong>.</p>

      <h4>Chapter I: Universal Accessibility and Usability</h4>

      <h5>1. Priority for Older Neighbours</h5>
      <p><strong>Technology adapts</strong> to people and, above all, to <strong>older neighbours</strong>. Many digital platforms <strong>exclude elders</strong> through <strong>confusing interfaces</strong>, tiny type and shifting menus; in Sóc de Poble we place them at the <strong>centre of design</strong>. Any change that causes <strong>operational confusion</strong> or hinders everyday village use is <strong>fixed or reverted</strong>.</p>

      <h5>2. Outdoor Sunlight Readability and Touch Targets</h5>
      <p>Visual aesthetics may never compromise <strong>screen readability</strong>. Every view maintains <strong>high contrast</strong> meeting <strong>WCAG AAA standards</strong> so it remains comfortable to read outdoors under <strong>direct sunlight</strong>. We enforce <strong>clear typography</strong> and generous <strong>minimum touch targets</strong> of <strong>48 × 48 pixels</strong> across all interactive buttons and controls.</p>

      <h5>3. Plain and Didactic Language</h5>
      <p>The entire interface, documentation and assistant replies are written in <strong>standard Valencian</strong> that is direct, didactic and <strong>easy to understand</strong>, alongside <strong>full localisation</strong> across all <strong>five system languages</strong>. We avoid <strong>convoluted jargon</strong>, unnecessary <strong>buzzwords</strong> and <strong>empty rhetoric</strong> so every option states clearly what it does.</p>

      <h5>4. Operational Prudence and Human Approval</h5>
      <p>Artificial intelligence agents <strong>may never execute</strong> destructive actions or <strong>irreversible changes</strong> autonomously. No automated workflow is allowed to perform <strong>bulk data deletion</strong> or alter <strong>production state</strong> without prior <strong>isolated verification</strong>. Whenever a sensitive operation arises, the system <strong>halts immediately</strong> and requests <strong>explicit human approval</strong>.</p>

      <h4>Chapter II: Data Sovereignty and Privacy</h4>

      <h5>5. Connected Architecture and Neutral Port</h5>
      <p>Shared features in Sóc de Poble run on a <strong>real-time connected</strong> architecture backed by <strong>PostgreSQL / Supabase</strong> on <strong>the Sóc de Poble server</strong> and the local <a href="/page/node-zero"><strong>Node 0</strong></a> pilot, behind a <strong>neutral data port</strong> that lets any <strong>host website</strong> embed the application in strict compliance with the European <strong>General Data Protection Regulation (GDPR)</strong>.</p>

      <h5>6. Zero Commercial Trackers</h5>
      <p>As detailed in <a href="/legal"><strong>Legal and privacy</strong></a>, Sóc de Poble enforces a <strong>total ban</strong> on <strong>advertising trackers</strong> and commercial profiling. The platform <strong>embeds no ad pixels</strong>, <strong>excludes tools</strong> such as <strong>Google Analytics</strong> and refuses to monetise neighbours’ attention; usage metrics across <strong>Sóc de Poble services</strong> stay <strong>first-party, anonymous and cookie-free</strong>.</p>

      <h5>7. Privacy from the Start and Author Ownership</h5>
      <p><strong>Personal notes</strong>, drafts and <strong>private files</strong> remain protected by strict <strong>access permissions</strong> bound to their author. Everything created <strong>belongs to its writer</strong>, who decides at every step whether to <strong>keep it private</strong> or publish it to the <strong>community wall</strong>. No external artificial intelligence model has <strong>permission to train</strong> on private community data.</p>

      <h5>8. Documentary Preservation and Historical Archive</h5>
      <p>No automated cleanup job may <strong>delete community records</strong>, <strong>local heritage</strong> or <strong>technical documentation</strong> without review. When a working document finishes its active turn, it is <strong>never erased</strong>: it moves cleanly into the project’s <strong>searchable historical archive</strong>, safeguarding <strong>documentary memory</strong> and preventing <strong>accidental data loss</strong>.</p>

      <h4>Chapter III: Code Architecture and Pedra Seca Design</h4>

      <h5>9. Semantic HTML5 Structure</h5>
      <p>The application is built with <strong>semantic HTML5</strong> that is <strong>keyboard accessible</strong> and friendly to <strong>screen readers</strong>, avoiding unnecessary <strong>closed libraries</strong>. <strong>Document markup</strong> defines the meaning and <strong>heading hierarchy</strong> of every page, while <strong>CSS stylesheets</strong> handle visual presentation cleanly and separately.</p>

      <h5>10. Pedra Seca Design System and Tokens</h5>
      <p>Visual components catalogued in <a href="/disseny"><strong>Pedra Seca Design</strong></a> are organised into <strong>explicit layers</strong> and share a unified set of <strong>design variables</strong> (the <strong><code>--sdp-</code> tokens</strong>) for colour, spacing and type. Mixing in <strong>utility frameworks</strong> such as Tailwind CSS or <strong>hardcoded colours</strong> outside declared tokens is <strong>strictly forbidden</strong>.</p>

      <h5>11. Style Separation without Inline Attributes</h5>
      <p>To keep <strong>visual consistency</strong> across both <strong>light theme</strong> and <strong>dark theme</strong>, components do not use <strong>inline styles</strong> (<code>style</code>) to set <strong>static colours or sizes</strong>. Every visual rule lives inside the design system’s <strong>CSS stylesheets</strong> and is checked by <strong>automated quality gates</strong>.</p>

      <h5>12. Minimal Intervention and Tested Code Preservation</h5>
      <p>Every change to <strong>existing code</strong> must stay <strong>focused and surgical</strong>, respecting features already <strong>running live</strong> and <strong>verified by tests</strong>. Fixes address the <strong>root cause</strong> directly, avoiding unnecessary <strong>wholesale rewrites</strong> that could <strong>introduce regressions</strong> elsewhere in the application.</p>

      <h4>Chapter IV: Governance, Auditing and Continuity</h4>

      <h5>13. Human Direction and Approval</h5>
      <p><strong>Artificial intelligence agents</strong> contribute <strong>analytical capacity</strong>, engineering and <strong>automated verification</strong>, yet the <strong>final decision</strong> always belongs to <strong>human leadership</strong>. Architectural or structural content changes are prepared in <strong>isolated clones</strong> and require <strong>explicit human sign-off</strong> before reaching production.</p>

      <h5>14. Traceability, Cryptographic Auditing and Documentary Ledger</h5>
      <p>No significant infrastructure or code change lands without <strong>end-to-end traceability</strong>. Every wave requires a prior <strong>implementation plan</strong>, packages sealed with <strong>SHA-256 cryptographic hashes</strong>, passing <strong>automated quality gates</strong> and <strong>audit reports</strong> recording all <strong>technical decisions</strong> and <strong>verified test suites</strong>.</p>

      <h5>15. Technological Evolution and Territorial Memory</h5>
      <p><strong>Open documentation</strong> in the <a href="/wikidepoble"><strong>Village Wiki</strong></a> and <strong>shared heritage</strong> ensure the project’s <strong>long-term continuity</strong>. As code and infrastructure <strong>evolve steadily</strong> on <strong>free and federated standards</strong>, Sóc de Poble preserves its <strong>founding mission</strong> of rural public service, cooperative strength and <strong>connection across villages</strong>.</p>\n    `,
  },
  eu: {
    title: 'Konstituzioa',
    subtitle: 'Proiektuaren arau tekniko, etiko eta gobernantzakoak',
    lead: 'Hamabost arau hauek zehazten dute nola diseinatzen den interfazea, nola babesten diren datuak eta nola egiten duten lan pertsonek zein adimen artifizialeko agenteek Sóc de Poblen.',
    imageAlt: 'Sóc de Pobleren Konstituzioarekin lotutako ilustrazioa',
    html: `\n      <h3>Proiektuaren Arau Esparrua</h3>
      <p>Dokumentu honek <a href="/projecte"><strong>Sóc de Pobleren</strong></a> <strong>Konstituzio tekniko eta zibikoa</strong> biltzen du. Bere <strong>15 artikuluek</strong> <strong>nahitaezko arauak</strong> ezartzen dituzte <strong>iturburu-kodea</strong>, <strong>datu pertsonalen</strong> tratamendua eta edozein pertsona zein <strong>adimen artifizialeko agenteren</strong> jarduna gidatzeko. Arkitektura edo diseinu erabaki oro <strong>irizpide egiaztagarri</strong> hauen arabera neurtzen da.</p>

      <h4>I. Kapitulua: Irisgarritasun eta Erabilgarritasun Unibertsala</h4>

      <h5>1. Adineko Pertsonen Lehentasuna</h5>
      <p><strong>Teknologia pertsonari</strong> egokitzen zaio eta, batez ere, <strong>adineko pertsonari</strong>. Plataforma digital askok <strong>adinekoak baztertzen</strong> dituzte <strong>interfaze nahasiekin</strong>, letra txikiarekin eta menu aldakorrekin; Sóc de Poblen <strong>diseinuaren erdigunean</strong> jartzen ditugu. Eguneroko erabilera zailtzen edo <strong>nahasmena sortzen</strong> duen edozein aldaketa <strong>zuzendu edo leheneratzen</strong> da.</p>

      <h5>2. Eguzkitan Irakurtzeko Argitasuna eta Ukitze Eremuak</h5>
      <p>Estetikak ezin du inoiz <strong>pantailaren irakurgarritasuna</strong> murriztu. Ikuspegi guztiek <strong>WCAG AAA mailako</strong> <strong>kontraste altua</strong> mantentzen dute kanpoaldean eta <strong>eguzki-argitan</strong> eroso irakurtzeko. <strong>Tipografia argia</strong> eta gutxienez <strong>48 × 48 pixeleko</strong> <strong>ukitze-eremuak</strong> ezartzen dira botoi eta kontrol elkarreragile guztietan.</p>

      <h5>3. Hizkera Argia eta Didaktikoa</h5>
      <p>Interfaze osoa, dokumentazioa eta laguntzaileen erantzunak <strong>valentziera arautuan</strong>, zuzenean eta <strong>ulertzeko errazean</strong> idazten dira, sistemaren <strong>bost hizkuntzetara</strong> egindako <strong>itzulpen osoarekin</strong>. <strong>Hizkera korapilatsua</strong>, alferrikako <strong>anglismoak</strong> eta <strong>erretorika hutsa</strong> baztertzen dira aukera bakoitzak zer egiten duen argi azaltzeko.</p>

      <h5>4. Zuhurtzia Operatiboa eta Giza Onespena</h5>
      <p>Adimen artifizialeko agenteek <strong>ezin dute exekutatu</strong> ekintza suntsitzailerik ezta <strong>aldaketa itzulezinik</strong> ere beren kabuz. Prozesu automatizatu batek ere ez du <strong>ezabatze masiboak</strong> egiteko edo <strong>produkzio-egoera</strong> ukitzeko baimenik ingurune isolatuan <strong>aurrez egiaztatu gabe</strong>. Eragiketa sentikor baten aurrean, sistema <strong>gelditu egiten da</strong> eta arduradun baten <strong>onespen espresua</strong> eskatzen du.</p>

      <h4>II. Kapitulua: Datuen Burujabetza eta Pribatutasuna</h4>

      <h5>5. Arkitektura Konektatua eta Ataka Neutrala</h5>
      <p>Sóc de Pobleren <strong>funtzio partekatuek</strong> denbora errealean <strong>konektatutako arkitekturan</strong> dihardute, <strong>Sóc de Pobleren zerbitzarian</strong> dagoen <strong>PostgreSQL / Supabase</strong> datu-basearekin eta <a href="/page/node-zero"><strong>0 Nodoa</strong></a> pilotu fisikoarekin, aplikazioa <strong>edozein web ostalaritan</strong> txertatzea ahalbidetzen duen <strong>ataka neutral</strong> baten atzean eta Europako <strong>DBEO araudia</strong> betez.</p>

      <h5>6. Iragarki Jarraitzailerik Gabe</h5>
      <p><a href="/legal"><strong>Lege oharra eta pribatutasuna</strong></a> atalak azaltzen duenez, Sóc de Poblek <strong>erabat debekatzen</strong> ditu <strong>publizitate-jarraitzaileak</strong> eta profil komertzialak. Plataformak <strong>ez du iragarki-pixelik</strong>, <strong>Google Analytics</strong> bezalako tresnak <strong>baztertzen ditu</strong> eta ez du auzotarren arreta merkaturatzen; <strong>Sóc de Pobleren zerbitzuetako</strong> neurketa <strong>propioa, anonimoa eta cookierik gabea</strong> da.</p>

      <h5>7. Hasieratik Pribatua eta Egilearen Jabetza</h5>
      <p><strong>Ohar pertsonalak</strong>, zirriborroak eta <strong>fitxategi pribatuak</strong> egileari lotutako <strong>sarbide-baimenek</strong> babesten dituzte. Sortutako eduki oro <strong>idazten duenarena da</strong>, eta berak erabakitzen du une oro <strong>pribatuan gorde</strong> edo <strong>herriko horman</strong> argitaratu. Kanpoko adimen artifizialeko ezein ereduk ez du komunitatearen datu pribatuekin <strong>entrenatzeko baimenik</strong>.</p>

      <h5>8. Dokumentuen Zaintza eta Artxibo Historikoa</h5>
      <p>Garbiketa-prozesu automatiko batek ere ezin du <strong>herriko informazioa</strong>, <strong>tokiko ondarea</strong> edo <strong>dokumentazio teknikoa</strong> berrikuspenik gabe ezabatu. Laneko dokumentu batek bere txanda amaitzen duenean, <strong>ez da ezabatzen</strong>: modu ordenatuan proiektuaren <strong>artxibo historiko kontsultagarrira</strong> eramaten da, <strong>memoria dokumentala</strong> babestuz eta <strong>ustekabeko galerak</strong> saihestuz.</p>

      <h4>III. Kapitulua: Kode Arkitektura eta Pedra Seca Diseinua</h4>

      <h5>9. HTML5 Egitura Semantikoa</h5>
      <p>Aplikazioa <strong>HTML5 semantikoarekin</strong> eraikitzen da, <strong>teklatuz irisgarria</strong> eta <strong>pantaila-irakurleekin</strong> bateragarria, beharrezkoak ez diren <strong>liburutegi itxiak</strong> saihestuz. <strong>Dokumentuaren egiturak</strong> finkatzen du orri bakoitzaren esanahia eta <strong>izenburuen hierarkia</strong>, eta <strong>CSS estilo-orriek</strong> aurkezpen bisuala garbi bereizten dute.</p>

      <h5>10. Pedra Seca Diseinu Sistema eta Tokenak</h5>
      <p><a href="/disseny"><strong>Pedra Seca Diseinua</strong></a> katalogoko <strong>osagai bisualak</strong> <strong>geruza argitan</strong> antolatzen dira eta <strong>diseinu-aldagai bateratuak</strong> (<strong><code>--sdp-</code> tokenak</strong>) erabiltzen dituzte kolore, tarte eta tipografiarako. Erabat <strong>debekatuta dago</strong> Tailwind CSS bezalako <strong>baliagarritasun-klaseak</strong> edo tokenetatik kanpoko <strong>kolore finkoak</strong> nahastea.</p>

      <h5>11. Estiloen Banaketa Lerroko Atributurik Gabe</h5>
      <p>Ikuspegi guztiek <strong>gai argian</strong> zein <strong>gai ilunean</strong> <strong>koherentzia bisuala</strong> gorde dezaten, osagaietan ez da <strong>lerroko estilorik</strong> (<code>style</code>) erabiltzen <strong>kolore edo neurri finkoak</strong> ezartzeko. Arau bisual guztiak diseinu-sistemaren <strong>CSS fitxategietan</strong> bizi dira eta <strong>ate automatikoek</strong> egiaztatzen dituzte.</p>

      <h5>12. Esku-hartze Minimoa eta Probatutako Kodearen Zaintza</h5>
      <p><strong>Lehendik dagoen kodearen</strong> gaineko aldaketa oro <strong>zehatza eta neurtua</strong> izan behar da, martxan dauden eta <strong>proben bidez egiaztatutako</strong> funtzioak errespetatuz. Zuzenketak zuzenean <strong>arazoaren erroetara</strong> doaz, aplikazioaren beste atal batzuetan <strong>atzera-pausoak</strong> eragin ditzaketen <strong>berridazketa masiboak</strong> baztertuz.</p>

      <h4>IV. Kapitulua: Gobernantza, Ikuskaritza eta Jarraitutasuna</h4>

      <h5>13. Giza Zuzendaritza eta Onespena</h5>
      <p><strong>Adimen artifizialeko agenteek</strong> <strong>analisi-gaitasuna</strong>, garapena eta <strong>egiaztapen automatizatua</strong> eskaintzen dituzte, baina <strong>azken erabakia</strong> beti proiektuaren <strong>giza zuzendaritzari</strong> dagokio. Arkitektura edo egiturazko eduki aldaketak <strong>ingurune isolatuetan</strong> prestatzen dira eta produkziora pasa aurretik <strong>giza baliozkotze espresua</strong> behar dute.</p>

      <h5>14. Trazabilitatea, Ikuskaritza Kriptografikoa eta Erregistro Dokumentala</h5>
      <p>Azpiegitura edo kode aldaketa garrantzitsurik ez da aplikatzen <strong>trazabilitate osorik</strong> gabe. Esku-hartze bakoitzak aurretiazko <strong>inplementazio-plana</strong>, <strong>SHA-256 hatz kriptografikoz</strong> zigilatutako paketeak, <strong>kalitate-ate</strong> automatizatuak gainditzea eta <strong>erabaki teknikoak</strong> zein <strong>gainditutako probak</strong> jasotzen dituzten <strong>ikuskaritza-txostenak</strong> eskatzen ditu.</p>

      <h5>15. Bilakaera Teknologikoa eta Lurraldearen Memoria</h5>
      <p><a href="/wikidepoble"><strong>Herriko Wikiko</strong></a> <strong>dokumentazio irekiak</strong> eta bildutako <strong>ondareak</strong> proiektuaren <strong>epe luzeko jarraitutasuna</strong> bermatzen dute. Kodea eta azpiegitura <strong>estandar libre eta federatuetan</strong> etengabe <strong>eraldatzen diren</strong> bitartean, Sóc de Poblek osorik mantentzen du landa-zerbitzu publikoaren, bultzada kooperatiboaren eta <strong>herrien arteko loturaren</strong> <strong>sorrerako eginkizuna</strong>.</p>\n    `,
  },
  gl: {
    title: 'Constitución',
    subtitle: 'Normas técnicas, éticas e de gobernanza do proxecto',
    lead: 'Estas quince regras definen como se deseña a interface, como se protexen os datos e como traballan as persoas e os axentes de intelixencia artificial dentro de Sóc de Poble.',
    imageAlt: 'Ilustración asociada á Constitución de Sóc de Poble',
    html: `\n      <h3>Marco Normativo do Proxecto</h3>
      <p>Este documento recolle a <strong>Constitución técnica e cívica</strong> de <a href="/projecte"><strong>Sóc de Poble</strong></a>. Os seus <strong>15 artigos</strong> establecen as <strong>regras obrigatorias</strong> que rexen o <strong>código fonte</strong>, o tratamento dos <strong>datos persoais</strong> e a actuación de calquera persoa ou <strong>axente de intelixencia artificial</strong> na plataforma. Cada decisión de arquitectura ou de deseño avalíase segundo estes <strong>criterios verificables</strong>.</p>

      <h4>Capítulo I: Accesibilidade e Usabilidade Universal</h4>

      <h5>1. Prioridade das Persoas Maiores</h5>
      <p>A <strong>tecnoloxía adáptase</strong> á persoa e, de maneira prioritaria, á <strong>persoa maior</strong>. Moitas plataformas dixitais <strong>exclúen a xente maior</strong> con <strong>interfaces confusas</strong>, letra miúda e menús cambiantes; en Sóc de Poble situámolas no <strong>centro do deseño</strong>. Calquera cambio que xere <strong>confusión operativa</strong> ou dificulte o uso cotián a un veciño ou veciña <strong>corríxese ou revértese</strong>.</p>

      <h5>2. Lexibilidade a Pleno Sol e Áreas Táctiles</h5>
      <p>A estética visual nunca pode reducir a <strong>lexibilidade da pantalla</strong>. Todas as vistas manteñen un <strong>contraste alto</strong> de <strong>nivel WCAG AAA</strong> para lerse con comodidade mesmo no exterior e baixo a <strong>luz do sol</strong>. Aplícase unha <strong>tipografía clara</strong> e proporcionada e unhas <strong>áreas táctiles mínimas</strong> de <strong>48 × 48 píxeles</strong> en todos os botóns e controis interactivos.</p>

      <h5>3. Linguaxe Clara e Didáctica</h5>
      <p>Toda a interface, a documentación e as respostas dos asistentes redáctanse nun <strong>valenciano normativo</strong>, directo, didáctico e <strong>fácil de entender</strong>, con <strong>tradución completa</strong> ás <strong>cinco linguas do sistema</strong>. Evítanse a <strong>linguaxe enrevesada</strong>, os <strong>anglicismos innecesarios</strong> e a <strong>retórica baleira</strong> para explicar con claridade que fai cada opción.</p>

      <h5>4. Prudencia Operativa e Aprobación Humana</h5>
      <p>Os axentes de intelixencia artificial <strong>non poden executar</strong> accións destrutivas nin <strong>cambios irreversibles</strong> de xeito autónomo. Ningún proceso automatizado ten permiso para facer <strong>borrados masivos</strong> de datos nin modificar o <strong>estado de produción</strong> sen unha <strong>comprobación previa</strong> nun contorno illado. Ante calquera operación delicada, o sistema <strong>detense</strong> e pide a <strong>aprobación explícita</strong> dunha persoa responsable.</p>

      <h4>Capítulo II: Soberanía de Datos e Privacidade</h4>

      <h5>5. Arquitectura Conectada e Porto Neutral</h5>
      <p>As <strong>funcionalidades compartidas</strong> de Sóc de Poble operan sobre unha arquitectura <strong>conectada en tempo real</strong> coa base de datos <strong>PostgreSQL / Supabase</strong> n’<strong>o servidor de Sóc de Poble</strong> e o piloto físico <a href="/page/node-zero"><strong>Node 0</strong></a>, detrás dun <strong>porto de datos neutral</strong> que permite aloxar a aplicación en <strong>calquera anfitrión web</strong> cumprindo o <strong>Regulamento Xeral de Protección de Datos (RXPD)</strong>.</p>

      <h5>6. Sen Rastrexadores Comerciais</h5>
      <p>Tal como detalla <a href="/legal"><strong>Legal e privacidade</strong></a>, Sóc de Poble aplica a <strong>prohibición total</strong> de <strong>rastrexadores publicitarios</strong> e perfilado comercial. A plataforma <strong>non inclúe píxeles</strong> de seguimento de anuncios, <strong>exclúe ferramentas</strong> como <strong>Google Analytics</strong> e rexeita comercializar a atención veciñal; a analítica n’<strong>os servizos de Sóc de Poble</strong> é <strong>propia, anónima e sen cookies</strong> de terceiros.</p>

      <h5>7. Privacidade de Entrada e Propiedade do Autor</h5>
      <p>As <strong>notas persoais</strong>, borradores e <strong>ficheiros privados</strong> permanecen <strong>protexidos por permisos de acceso</strong> vinculados ao seu autor. Todo o contido creado <strong>pertence a quen o escribe</strong>, que decide en cada momento se o <strong>mantén privado</strong> ou o publica no <strong>muro comunitario</strong>. Ningún modelo externo de intelixencia artificial ten <strong>permiso para adestrarse</strong> cos datos privados da comunidade.</p>

      <h5>8. Preservación Documental e Arquivo Histórico</h5>
      <p>Ningún proceso automático de limpeza pode <strong>eliminar información</strong> comunitaria, <strong>patrimonio local</strong> nin <strong>documentación técnica</strong> sen revisión. Cando un documento de traballo deixa de estar activo, <strong>non se borra</strong>: trasládase de maneira ordenada ao <strong>arquivo histórico consultable</strong> do proxecto, preservando a <strong>memoria documental</strong> e evitando <strong>perdas accidentais</strong> de información.</p>

      <h4>Capítulo III: Arquitectura de Código e Deseño Pedra Seca</h4>

      <h5>9. Estrutura HTML5 Semántica</h5>
      <p>A aplicación constrúese con <strong>HTML5 semántico</strong>, <strong>accesible por teclado</strong> e <strong>lectores de pantalla</strong>, evitando dependencias innecesarias de <strong>bibliotecas pechadas</strong>. A <strong>estrutura do documento</strong> define o significado e a <strong>xerarquía de cada páxina</strong>, mentres que a <strong>folla de estilos CSS</strong> xestiona a presentación visual de xeito separado e limpo.</p>

      <h5>10. Sistema de Deseño Pedra Seca e Tokens</h5>
      <p>Os <strong>compoñentes visuais</strong> documentados en <a href="/disseny"><strong>Deseño Pedra Seca</strong></a> organízanse en <strong>capas claras</strong> e utilizan un conxunto unificado de <strong>variables de deseño</strong> (os <strong>tokens <code>--sdp-</code></strong>) para cores, espazados e tipografía. Queda <strong>prohibido</strong> mesturar <strong>clases de utilidade</strong> como Tailwind CSS ou <strong>cores fixas</strong> fóra dos tokens declarados.</p>

      <h5>11. Separación de Estilos sen Atributos en Liña</h5>
      <p>Para garantir que todas as vistas manteñan a <strong>coherencia visual</strong> tanto en <strong>tema claro</strong> como en <strong>tema escuro</strong>, non se utilizan <strong>estilos en liña</strong> (<code>style</code>) dentro dos compoñentes para fixar <strong>cores ou tamaños estáticos</strong>. Todas as regras visuais residen nos <strong>ficheiros CSS</strong> do sistema de deseño e <strong>valídanse automaticamente</strong>.</p>

      <h5>12. Intervención Mínima e Preservación do Código Probado</h5>
      <p>Todo cambio sobre o <strong>código existente</strong> debe ser <strong>acoutado e preciso</strong>, respectuoso coas funcionalidades que xa están <strong>en marcha</strong> e <strong>verificadas con probas</strong>. As correccións van directamente á <strong>causa real do problema</strong>, evitando <strong>reescrituras masivas</strong> innecesarias que poidan <strong>introducir regresións</strong> noutras partes da aplicación.</p>

      <h4>Capítulo IV: Gobernanza, Auditoría e Continuidade</h4>

      <h5>13. Dirección e Aprobación Humana</h5>
      <p>Os <strong>axentes de intelixencia artificial</strong> achegan <strong>capacidade de análise</strong>, desenvolvemento e <strong>verificación automatizada</strong>, pero a <strong>decisión final</strong> corresponde sempre á <strong>dirección humana</strong> do proxecto. Os cambios de arquitectura ou de contido estrutural prepáranse en <strong>contornos illados</strong> e requiren <strong>validación humana explícita</strong> antes de entrar en produción.</p>

      <h5>14. Trazabilidade, Auditoría Criptográfica e Rexistro Documental</h5>
      <p>Ningún cambio relevante de infraestrutura ou de código se aplica sen <strong>trazabilidade completa</strong>. Toda intervención require un <strong>plan de implementación</strong> previo, paquetes verificados con <strong>pegada criptográfica SHA-256</strong>, execución das <strong>portas de calidade</strong> automatizadas e <strong>informes de auditoría</strong> onde quedan rexistradas as <strong>decisións técnicas</strong> e as <strong>probas superadas</strong>.</p>

      <h5>15. Evolución Tecnolóxica e Memoria do Territorio</h5>
      <p>A <strong>documentación aberta</strong> da <a href="/wikidepoble"><strong>Wiki de Poble</strong></a> e o <strong>patrimonio recollido</strong> garanten a <strong>continuidade do proxecto</strong> a longo prazo. Mentres o código e a infraestrutura <strong>evolucionan continuamente</strong> con <strong>estándares libres e federados</strong>, Sóc de Poble mantén intacta a súa <strong>misión fundacional</strong> de servizo público rural, impulso cooperativo e <strong>conexión entre vilas e aldeas</strong>.</p>\n    `,
  },
});
