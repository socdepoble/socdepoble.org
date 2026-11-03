<?php
/**
 * Ajustos → Sóc de Poble.
 *
 * Dos camps i res més: el nom visible i el poble d'aterratge, les dues claus
 * del canal d'amfitrió (`window.SocDePobleConfig`). Cap camp de backend, clau,
 * tenant ni mode de dades: este plugin no n'emet cap i l'App usa els que el
 * build va segellar (Model B). Decisió A1 del Mestre (261003): el camp «Tenant
 * ID» s'ha retirat, i el nucli descarta amb un avís el backend i el tenant que
 * arriben per qualsevol canal d'amfitrió. La pàgina afig la diagnosi del
 * paquet (a quin node apunta, sense dir cap tenant: el plugin és cec a l'abast
 * de dades) i el marcatge universal que qualsevol altre amfitrió ha de copiar
 * per a enxufar exactament la mateixa App.
 *
 * T5.1 (ordre del Mestre, 261029, amb captures de gentdelatorre.net): la
 * benvinguda diu la veritat sobre l'arrel i el primer portal actiu, la guia va
 * en tres passos per a qui no és tècnic, i la fila d'Extensions porta «Mostra
 * els detalls» amb la finestra nativa alimentada des del readme.txt local
 * (plugin_row_meta i plugins_api, més avall), sense cap petició de xarxa.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/** Còpies completes integrades: les variants de WordPress.org també les porten. */
function socdepoble_enxufe_copies_ajustos() {
	static $copies = array(
		'va' => array(
			'language' => 'Idioma dels ajustos',
			'slogan' => 'Sóc de Poble. Portal de Pobles Connectats',
			'intro' => 'Una <strong>xarxa cívica descentralitzada</strong>, nascuda a les <strong>muntanyes rurals d’Alacant</strong>, per a connectar <strong>veïnat</strong>, <strong>associacions</strong>, <strong>festes</strong>, <strong>comerç local</strong> i <strong>memòria col·lectiva</strong> sense dependència tecnològica.',
			'roots' => 'L’arrel és <strong>Sóc de Poble</strong>: <strong>El Rentonar</strong> i <strong>30 anys d’activisme rural</strong>. El primer portal de poble actiu és <strong>La Torre de les Maçanes</strong> (<code>la-torre-de-les-macanes</code> · <strong>Gent de la Torre</strong>). Els altres pobles del catàleg podran activar <strong>el seu node</strong> quan ho demane la seua comunitat.',
			'guide' => 'Com posar Sóc de Poble a la teua web en tres passos',
			'step1_title' => 'Pas 1 · Identifica el teu poble',
			'step1' => 'Escriu el <strong>nom públic</strong> del portal (per exemple, <strong>Gent de la Torre</strong>) i l’<strong>identificador del poble</strong> (<code>la-torre-de-les-macanes</code>). Revisa els <strong>dos camps</strong> de davall i prem <strong>Guardar els canvis</strong>. Esta identitat indica <strong>qui allotja l’app</strong>; no canvia les dades del servidor.',
			'step2_title' => 'Pas 2 · Posa l’app en una pàgina',
			'step2a' => '<strong>Opció A · Shortcode.</strong> Ves a <strong>Pàgines → Afegir nova pàgina</strong>, posa un <strong>títol</strong> i copia exactament <code>[socdepoble_app]</code> al <strong>cos</strong> de la pàgina. Prem <strong>Publicar</strong> i comprova que apareix <strong>Sóc de Poble</strong>.',
			'step2b' => '<strong>Opció B · Bloc visual.</strong> Dins de l’<strong>editor de pàgines</strong>, prem el botó <strong>+</strong> per <strong>afegir un bloc</strong>, busca <strong>Sóc de Poble</strong> i selecciona’l. Les dues opcions mostren <strong>la mateixa app</strong>; tria’n una.',
			'step3_title' => 'Pas 3 · Pantalla completa i pàgina d’inici',
			'step3' => 'En l’editor, obri <strong>Plantilla</strong> i tria <strong>Sóc de Poble · full screen</strong>. Per fer-la <strong>pàgina d’inici</strong>, ves a <strong>Ajustos → Lectura</strong>, marca <strong>Una pàgina estàtica</strong> i selecciona-la en <strong>Pàgina d’inici</strong>.',
			'host_title' => 'Identitat de l’amfitrió',
			'host_intro' => 'Estos <strong>dos camps</strong> identifiquen l’<strong>amfitrió</strong> i el <strong>poble d’aterratge</strong>. Si els deixes <strong>buits</strong>, es mantenen els valors del <strong>banc de proves</strong>. El filtre <code>socdepoble_enxufe_config</code> té l’<strong>última paraula</strong>.',
			'village_name' => 'Nom públic del portal',
			'village_id' => 'Identificador del poble',
			'name_help' => 'És el <strong>nom visible</strong> del servidor que <strong>allotja l’app</strong>, per exemple <strong>Gent de la Torre</strong>.',
			'id_help' => 'És l’<strong>identificador</strong> de la secció <strong>Pobles</strong>: les visites aterren en la seua <strong>fitxa</strong>. No determina l’<strong>abast de dades</strong>.',
			'save' => 'Guardar els canvis',
			'translation_title' => 'Traducció, quan la necessites',
			'translation_help' => 'La <strong>llengua d’esta guia</strong> no canvia la de <strong>WordPress</strong> ni la de l’<strong>app</strong>. El servei de <strong>traducció de textos</strong> és opcional: usa <strong>Apertium</strong> per defecte o <strong>DeepL</strong> si s’ha configurat al servidor. Les <strong>claus</strong> es queden sempre al servidor.',
			'diagnosis' => 'Diagnosi tècnica i marcatge universal',
			'package_title' => 'Paquet i node de dades',
			'markup_title' => 'Marcatge per a un altre amfitrió',
			'markup_help' => 'El connector envia <strong>tres peces</strong>: la <strong>configuració pública</strong>, l’<strong>element de l’app</strong> i el <strong>carregador</strong>. Un altre amfitrió, com <strong>Sollutia</strong>, usa el mateix marcatge amb la seua còpia de <code>dist/</code>. La caixa necessita <strong>altura</strong>.',
			'development_warning' => 'Este paquet apunta a un <strong>servidor de desenvolupament</strong>. Les visites veuran l’app <strong>sense dades</strong>. Cal reconstruir-lo com a <strong>paquet de producció</strong> abans de publicar-lo.',
			'manifest' => 'Manifest del paquet',
			'missing' => 'Falta el manifest (dist/sdp-release.json). Reconstruïx el paquet amb npm run build:wp.',
			'missing_bundle' => 'Falten el manifest i el carregador de l’app.',
			'app_version' => 'Versió de l’app',
			'bundle_sha' => 'SHA-256 del carregador',
			'bundle_integrity' => 'Integritat del carregador',
			'data_node' => 'Node de dades segellat',
			'none' => 'cap',
			'data_mode' => 'Mode de dades',
			'package_kind' => 'Tipus de paquet',
			'development' => 'Desenvolupament: només funciona al costat del seu servidor local.',
			'release' => 'Producció: pot atendre visites reals ací o en un altre amfitrió.',
			'environment' => 'Entorn del lloc',
		),
		'es' => array(
			'language' => 'Idioma de los ajustes',
			'slogan' => 'Sóc de Poble. Portal de Pobles Connectats',
			'intro' => 'Una <strong>red cívica descentralizada</strong>, nacida en las <strong>montañas rurales de Alicante</strong>, para conectar <strong>vecindario</strong>, <strong>asociaciones</strong>, <strong>fiestas</strong>, <strong>comercio local</strong> y <strong>memoria colectiva</strong> sin dependencia tecnológica.',
			'roots' => 'La raíz es <strong>Sóc de Poble</strong>: <strong>El Rentonar</strong> y <strong>30 años de activismo rural</strong>. El primer portal de pueblo activo es <strong>La Torre de les Maçanes</strong> (<code>la-torre-de-les-macanes</code> · <strong>Gent de la Torre</strong>). Los demás pueblos del catálogo podrán activar <strong>su propio nodo</strong> cuando lo pida su comunidad.',
			'guide' => 'Cómo poner Sóc de Poble en tu web en tres pasos',
			'step1_title' => 'Paso 1 · Identifica tu pueblo',
			'step1' => 'Escribe el <strong>nombre público</strong> del portal (por ejemplo, <strong>Gent de la Torre</strong>) y el <strong>identificador del pueblo</strong> (<code>la-torre-de-les-macanes</code>). Revisa los <strong>dos campos</strong> de abajo y pulsa <strong>Guardar los cambios</strong>. Esta identidad indica <strong>quién aloja la app</strong>; no cambia los datos del servidor.',
			'step2_title' => 'Paso 2 · Pon la app en una página',
			'step2a' => '<strong>Opción A · Shortcode.</strong> Ve a <strong>Páginas → Añadir nueva página</strong>, pon un <strong>título</strong> y copia exactamente <code>[socdepoble_app]</code> en el <strong>cuerpo</strong> de la página. Pulsa <strong>Publicar</strong> y comprueba que aparece <strong>Sóc de Poble</strong>.',
			'step2b' => '<strong>Opción B · Bloque visual.</strong> En el <strong>editor de páginas</strong>, pulsa el botón <strong>+</strong> para <strong>añadir un bloque</strong>, busca <strong>Sóc de Poble</strong> y selecciónalo. Las dos opciones muestran <strong>la misma app</strong>; elige una.',
			'step3_title' => 'Paso 3 · Pantalla completa y página de inicio',
			'step3' => 'En el editor, abre <strong>Plantilla</strong> y elige <strong>Sóc de Poble · full screen</strong>. Para convertirla en <strong>página de inicio</strong>, ve a <strong>Ajustes → Lectura</strong>, marca <strong>Una página estática</strong> y selecciónala en <strong>Página de inicio</strong>.',
			'host_title' => 'Identidad del anfitrión',
			'host_intro' => 'Estos <strong>dos campos</strong> identifican al <strong>anfitrión</strong> y al <strong>pueblo de destino</strong>. Si los dejas <strong>vacíos</strong>, se conservan los valores del <strong>banco de pruebas</strong>. El filtro <code>socdepoble_enxufe_config</code> tiene la <strong>última palabra</strong>.',
			'village_name' => 'Nombre público del portal',
			'village_id' => 'Identificador del pueblo',
			'name_help' => 'Es el <strong>nombre visible</strong> del servidor que <strong>aloja la app</strong>, por ejemplo <strong>Gent de la Torre</strong>.',
			'id_help' => 'Es el <strong>identificador</strong> de la sección <strong>Pueblos</strong>: las visitas llegan a su <strong>ficha</strong>. No determina el <strong>ámbito de datos</strong>.',
			'save' => 'Guardar los cambios',
			'translation_title' => 'Traducción, cuando la necesites',
			'translation_help' => 'El <strong>idioma de esta guía</strong> no cambia el de <strong>WordPress</strong> ni el de la <strong>app</strong>. El servicio de <strong>traducción de textos</strong> es opcional: usa <strong>Apertium</strong> por defecto o <strong>DeepL</strong> si se ha configurado en el servidor. Las <strong>claves</strong> siempre se quedan en el servidor.',
			'diagnosis' => 'Diagnóstico técnico y marcado universal',
			'package_title' => 'Paquete y nodo de datos',
			'markup_title' => 'Marcado para otro anfitrión',
			'markup_help' => 'El conector envía <strong>tres piezas</strong>: la <strong>configuración pública</strong>, el <strong>elemento de la app</strong> y el <strong>cargador</strong>. Otro anfitrión, como <strong>Sollutia</strong>, usa el mismo marcado con su copia de <code>dist/</code>. La caja necesita <strong>altura</strong>.',
			'development_warning' => 'Este paquete apunta a un <strong>servidor de desarrollo</strong>. Las visitas verán la app <strong>sin datos</strong>. Hay que reconstruirlo como <strong>paquete de producción</strong> antes de publicarlo.',
			'manifest' => 'Manifiesto del paquete',
			'missing' => 'Falta el manifiesto (dist/sdp-release.json). Reconstruye el paquete con npm run build:wp.',
			'missing_bundle' => 'Faltan el manifiesto y el cargador de la app.',
			'app_version' => 'Versión de la app',
			'bundle_sha' => 'SHA-256 del cargador',
			'bundle_integrity' => 'Integridad del cargador',
			'data_node' => 'Nodo de datos sellado',
			'none' => 'ninguno',
			'data_mode' => 'Modo de datos',
			'package_kind' => 'Tipo de paquete',
			'development' => 'Desarrollo: solo funciona junto a su servidor local.',
			'release' => 'Producción: puede atender visitas reales aquí o en otro anfitrión.',
			'environment' => 'Entorno del sitio',
		),
		'en' => array(
			'language' => 'Settings language',
			'slogan' => 'Sóc de Poble. Portal of Connected Villages',
			'intro' => 'A <strong>decentralized civic network</strong>, born in the <strong>rural mountains of Alicante</strong>, connecting <strong>neighbours</strong>, <strong>associations</strong>, <strong>local events</strong>, <strong>village shops</strong> and <strong>collective memory</strong> without technological dependence.',
			'roots' => 'The root is <strong>Sóc de Poble</strong>: <strong>El Rentonar</strong> and <strong>30 years of rural activism</strong>. The first live village portal is <strong>La Torre de les Maçanes</strong> (<code>la-torre-de-les-macanes</code> · <strong>Gent de la Torre</strong>). Other villages in the catalogue can activate <strong>their own node</strong> when their community asks for it.',
			'guide' => 'Put Sóc de Poble on your website in three steps',
			'step1_title' => 'Step 1 · Identify your village',
			'step1' => 'Enter the portal’s <strong>public name</strong> (for example, <strong>Gent de la Torre</strong>) and the <strong>village identifier</strong> (<code>la-torre-de-les-macanes</code>). Check the <strong>two fields</strong> below and press <strong>Save Changes</strong>. This identity says <strong>who hosts the app</strong>; it does not change server data.',
			'step2_title' => 'Step 2 · Put the app on a page',
			'step2a' => '<strong>Option A · Shortcode.</strong> Go to <strong>Pages → Add New Page</strong>, enter a <strong>title</strong> and paste exactly <code>[socdepoble_app]</code> into the page <strong>body</strong>. Press <strong>Publish</strong> and check that <strong>Sóc de Poble</strong> appears.',
			'step2b' => '<strong>Option B · Visual block.</strong> In the <strong>page editor</strong>, press the <strong>+</strong> button to <strong>add a block</strong>, search for <strong>Sóc de Poble</strong> and select it. Both options show <strong>the same app</strong>; choose one.',
			'step3_title' => 'Step 3 · Full screen and home page',
			'step3' => 'In the editor, open <strong>Template</strong> and choose <strong>Sóc de Poble · full screen</strong>. To make it your <strong>home page</strong>, go to <strong>Settings → Reading</strong>, select <strong>A static page</strong> and choose it as <strong>Homepage</strong>.',
			'host_title' => 'Host identity',
			'host_intro' => 'These <strong>two fields</strong> identify the <strong>host</strong> and the <strong>landing village</strong>. Leave them <strong>empty</strong> to keep the <strong>test bench values</strong>. The <code>socdepoble_enxufe_config</code> filter has the <strong>last word</strong>.',
			'village_name' => 'Public portal name',
			'village_id' => 'Village identifier',
			'name_help' => 'The <strong>visible name</strong> of the server that <strong>hosts the app</strong>, for example <strong>Gent de la Torre</strong>.',
			'id_help' => 'The <strong>identifier</strong> in the <strong>Villages</strong> section: visitors land on its <strong>page</strong>. It is not a <strong>data scope</strong>.',
			'save' => 'Save Changes',
			'translation_title' => 'Translation, when you need it',
			'translation_help' => 'This <strong>guide’s language</strong> does not change <strong>WordPress</strong> or the <strong>app</strong>. The optional <strong>text translation</strong> service uses <strong>Apertium</strong> by default, or <strong>DeepL</strong> when configured on the server. <strong>Keys</strong> always stay on the server.',
			'diagnosis' => 'Technical diagnosis and universal host markup',
			'package_title' => 'Package and data node',
			'markup_title' => 'Markup for another host',
			'markup_help' => 'The connector sends <strong>three pieces</strong>: <strong>public configuration</strong>, the <strong>app element</strong> and the <strong>loader</strong>. Another host, such as <strong>Sollutia</strong>, uses the same markup with its own copy of <code>dist/</code>. The container needs a <strong>height</strong>.',
			'development_warning' => 'This package points to a <strong>development server</strong>. Visitors will see the app <strong>without data</strong>. Rebuild it as a <strong>production package</strong> before publishing.',
			'manifest' => 'Package manifest',
			'missing' => 'Missing (dist/sdp-release.json). Rebuild the package with npm run build:wp.',
			'missing_bundle' => 'Missing, and the bundle is missing too.',
			'app_version' => 'App version',
			'bundle_sha' => 'Bundle SHA-256',
			'bundle_integrity' => 'Bundle integrity',
			'data_node' => 'Sealed data node',
			'none' => 'none',
			'data_mode' => 'Data mode',
			'package_kind' => 'Package kind',
			'development' => 'Development: it only works next to its local backend.',
			'release' => 'Release: it can serve real visitors, here or in any other host.',
			'environment' => 'Site environment',
		),
		'eu' => array(
			'language' => 'Ezarpenen hizkuntza',
			'slogan' => 'Sóc de Poble. Konektatutako Herrien Ataria',
			'intro' => '<strong>Alacanteko landa-mendietan</strong> sortutako <strong>herritarren sare deszentralizatua</strong>, <strong>bizilagunak</strong>, <strong>elkarteak</strong>, <strong>jaiak</strong>, <strong>tokiko saltokiak</strong> eta <strong>memoria kolektiboa</strong> mendekotasun teknologikorik gabe lotzeko.',
			'roots' => 'Sarearen sustraia <strong>Sóc de Poble</strong> da: <strong>El Rentonar</strong> eta <strong>30 urteko landa-aktibismoa</strong>. Martxan dagoen lehen herri-ataria <strong>La Torre de les Maçanes</strong> da (<code>la-torre-de-les-macanes</code> · <strong>Gent de la Torre</strong>). Katalogoko beste herriek <strong>beren nodoa</strong> aktibatu ahal izango dute komunitateak eskatzen duenean.',
			'guide' => 'Jarri Sóc de Poble zure webgunean hiru urratsetan',
			'step1_title' => '1. urratsa · Identifikatu zure herria',
			'step1' => 'Idatzi atariaren <strong>izen publikoa</strong> (adibidez, <strong>Gent de la Torre</strong>) eta <strong>herriaren identifikatzailea</strong> (<code>la-torre-de-les-macanes</code>). Berrikusi beheko <strong>bi eremuak</strong> eta sakatu <strong>Gorde aldaketak</strong>. Identitate horrek <strong>aplikazioa nork ostatatzen duen</strong> adierazten du; ez ditu zerbitzariko datuak aldatzen.',
			'step2_title' => '2. urratsa · Jarri aplikazioa orrialde batean',
			'step2a' => '<strong>A aukera · Shortcode.</strong> Joan <strong>Orrialdeak → Gehitu orrialde berria</strong> atalera, idatzi <strong>izenburua</strong> eta itsatsi zehazki <code>[socdepoble_app]</code> orrialdearen <strong>gorputzean</strong>. Sakatu <strong>Argitaratu</strong> eta egiaztatu <strong>Sóc de Poble</strong> agertzen dela.',
			'step2b' => '<strong>B aukera · Bloke bisuala.</strong> <strong>Orrialde-editorean</strong>, sakatu <strong>+</strong> botoia <strong>bloke bat gehitzeko</strong>, bilatu <strong>Sóc de Poble</strong> eta hautatu. Bi aukerek <strong>aplikazio bera</strong> erakusten dute; aukeratu bat.',
			'step3_title' => '3. urratsa · Pantaila osoa eta hasiera-orria',
			'step3' => 'Editorean, ireki <strong>Txantiloia</strong> eta aukeratu <strong>Sóc de Poble · full screen</strong>. <strong>Hasiera-orria</strong> izan dadin, joan <strong>Ezarpenak → Irakurketa</strong> atalera, markatu <strong>Orrialde estatiko bat</strong> eta hautatu <strong>Hasiera-orria</strong> eremuan.',
			'host_title' => 'Ostalariaren identitatea',
			'host_intro' => '<strong>Bi eremu</strong> hauek <strong>ostalaria</strong> eta <strong>helmugako herria</strong> identifikatzen dituzte. <strong>Hutsik</strong> uzten badituzu, <strong>proba-inguruneko balioak</strong> mantenduko dira. <code>socdepoble_enxufe_config</code> iragazkiak du <strong>azken hitza</strong>.',
			'village_name' => 'Atariaren izen publikoa',
			'village_id' => 'Herriaren identifikatzailea',
			'name_help' => 'Aplikazioa <strong>ostatatzen duen zerbitzariaren</strong> <strong>izen ikusgaia</strong> da; adibidez, <strong>Gent de la Torre</strong>.',
			'id_help' => '<strong>Herriak</strong> ataleko <strong>identifikatzailea</strong> da: bisitariak haren <strong>fitxara</strong> iristen dira. Ez du <strong>datuen esparrua</strong> zehazten.',
			'save' => 'Gorde aldaketak',
			'translation_title' => 'Itzulpena, behar duzunean',
			'translation_help' => '<strong>Gida honen hizkuntzak</strong> ez du <strong>WordPress</strong> edo <strong>aplikazioaren</strong> hizkuntza aldatzen. Aukerako <strong>testu-itzulpeneko</strong> zerbitzuak <strong>Apertium</strong> erabiltzen du lehenespenez, edo <strong>DeepL</strong> zerbitzarian konfiguratuta badago. <strong>Gakoak</strong> beti zerbitzarian geratzen dira.',
			'diagnosis' => 'Diagnostiko teknikoa eta markaketa unibertsala',
			'package_title' => 'Paketea eta datu-nodoa',
			'markup_title' => 'Beste ostalari baterako markaketa',
			'markup_help' => 'Konektoreak <strong>hiru pieza</strong> bidaltzen ditu: <strong>konfigurazio publikoa</strong>, <strong>aplikazioaren elementua</strong> eta <strong>kargatzailea</strong>. <strong>Sollutia</strong> bezalako beste ostalari batek markaketa bera erabiltzen du bere <code>dist/</code> kopiarekin. Edukiontziak <strong>altuera</strong> behar du.',
			'development_warning' => 'Pakete honek <strong>garapen-zerbitzari</strong> batera jotzen du. Bisitariek aplikazioa <strong>daturik gabe</strong> ikusiko dute. Argitaratu aurretik, berreraiki <strong>produkzio-pakete</strong> gisa.',
			'manifest' => 'Paketearen manifestua',
			'missing' => 'Manifestua falta da (dist/sdp-release.json). Berreraiki paketea npm run build:wp erabiliz.',
			'missing_bundle' => 'Manifestua eta aplikazioaren kargatzailea falta dira.',
			'app_version' => 'Aplikazioaren bertsioa',
			'bundle_sha' => 'Kargatzailearen SHA-256',
			'bundle_integrity' => 'Kargatzailearen osotasuna',
			'data_node' => 'Zigilatutako datu-nodoa',
			'none' => 'bat ere ez',
			'data_mode' => 'Datu-modua',
			'package_kind' => 'Pakete mota',
			'development' => 'Garapena: bere tokiko zerbitzariaren ondoan bakarrik funtzionatzen du.',
			'release' => 'Produkzioa: benetako bisitariak har ditzake hemen edo beste ostalari batean.',
			'environment' => 'Gunearen ingurunea',
		),
		'gl' => array(
			'language' => 'Idioma dos axustes',
			'slogan' => 'Sóc de Poble. Portal de Pobos Conectados',
			'intro' => 'Unha <strong>rede cívica descentralizada</strong>, nacida nas <strong>montañas rurais de Alacant</strong>, para conectar <strong>veciñanza</strong>, <strong>asociacións</strong>, <strong>festas</strong>, <strong>comercio local</strong> e <strong>memoria colectiva</strong> sen dependencia tecnolóxica.',
			'roots' => 'A raíz é <strong>Sóc de Poble</strong>: <strong>El Rentonar</strong> e <strong>30 anos de activismo rural</strong>. O primeiro portal de pobo activo é <strong>La Torre de les Maçanes</strong> (<code>la-torre-de-les-macanes</code> · <strong>Gent de la Torre</strong>). Os demais pobos do catálogo poderán activar <strong>o seu propio nodo</strong> cando o pida a súa comunidade.',
			'guide' => 'Como poñer Sóc de Poble na túa web en tres pasos',
			'step1_title' => 'Paso 1 · Identifica o teu pobo',
			'step1' => 'Escribe o <strong>nome público</strong> do portal (por exemplo, <strong>Gent de la Torre</strong>) e o <strong>identificador do pobo</strong> (<code>la-torre-de-les-macanes</code>). Revisa os <strong>dous campos</strong> de abaixo e preme <strong>Gardar os cambios</strong>. Esta identidade indica <strong>quen aloxa a app</strong>; non cambia os datos do servidor.',
			'step2_title' => 'Paso 2 · Pon a app nunha páxina',
			'step2a' => '<strong>Opción A · Shortcode.</strong> Vai a <strong>Páxinas → Engadir nova páxina</strong>, pon un <strong>título</strong> e copia exactamente <code>[socdepoble_app]</code> no <strong>corpo</strong> da páxina. Preme <strong>Publicar</strong> e comproba que aparece <strong>Sóc de Poble</strong>.',
			'step2b' => '<strong>Opción B · Bloque visual.</strong> No <strong>editor de páxinas</strong>, preme o botón <strong>+</strong> para <strong>engadir un bloque</strong>, busca <strong>Sóc de Poble</strong> e selecciónao. As dúas opcións amosan <strong>a mesma app</strong>; escolle unha.',
			'step3_title' => 'Paso 3 · Pantalla completa e páxina de inicio',
			'step3' => 'No editor, abre <strong>Modelo</strong> e escolle <strong>Sóc de Poble · full screen</strong>. Para facela <strong>páxina de inicio</strong>, vai a <strong>Axustes → Lectura</strong>, marca <strong>Unha páxina estática</strong> e selecciónaa en <strong>Páxina de inicio</strong>.',
			'host_title' => 'Identidade do anfitrión',
			'host_intro' => 'Estes <strong>dous campos</strong> identifican o <strong>anfitrión</strong> e o <strong>pobo de destino</strong>. Se os deixas <strong>baleiros</strong>, consérvanse os valores do <strong>banco de probas</strong>. O filtro <code>socdepoble_enxufe_config</code> ten a <strong>última palabra</strong>.',
			'village_name' => 'Nome público do portal',
			'village_id' => 'Identificador do pobo',
			'name_help' => 'É o <strong>nome visible</strong> do servidor que <strong>aloxa a app</strong>, por exemplo <strong>Gent de la Torre</strong>.',
			'id_help' => 'É o <strong>identificador</strong> da sección <strong>Pobos</strong>: as visitas chegan á súa <strong>ficha</strong>. Non determina o <strong>ámbito de datos</strong>.',
			'save' => 'Gardar os cambios',
			'translation_title' => 'Tradución, cando a necesites',
			'translation_help' => 'O <strong>idioma desta guía</strong> non cambia o de <strong>WordPress</strong> nin o da <strong>app</strong>. O servizo de <strong>tradución de textos</strong> é opcional: usa <strong>Apertium</strong> por defecto ou <strong>DeepL</strong> se está configurado no servidor. As <strong>claves</strong> quedan sempre no servidor.',
			'diagnosis' => 'Diagnóstico técnico e marcado universal',
			'package_title' => 'Paquete e nodo de datos',
			'markup_title' => 'Marcado para outro anfitrión',
			'markup_help' => 'O conector envía <strong>tres pezas</strong>: a <strong>configuración pública</strong>, o <strong>elemento da app</strong> e o <strong>cargador</strong>. Outro anfitrión, como <strong>Sollutia</strong>, usa o mesmo marcado coa súa copia de <code>dist/</code>. A caixa precisa <strong>altura</strong>.',
			'development_warning' => 'Este paquete apunta a un <strong>servidor de desenvolvemento</strong>. As visitas verán a app <strong>sen datos</strong>. Cómpre reconstruílo como <strong>paquete de produción</strong> antes de publicalo.',
			'manifest' => 'Manifesto do paquete',
			'missing' => 'Falta o manifesto (dist/sdp-release.json). Reconstrúe o paquete con npm run build:wp.',
			'missing_bundle' => 'Faltan o manifesto e o cargador da app.',
			'app_version' => 'Versión da app',
			'bundle_sha' => 'SHA-256 do cargador',
			'bundle_integrity' => 'Integridade do cargador',
			'data_node' => 'Nodo de datos selado',
			'none' => 'ningún',
			'data_mode' => 'Modo de datos',
			'package_kind' => 'Tipo de paquete',
			'development' => 'Desenvolvemento: só funciona xunto ao seu servidor local.',
			'release' => 'Produción: pode atender visitas reais aquí ou noutro anfitrión.',
			'environment' => 'Contorno do sitio',
		),
	);
	return $copies;
}

/** Llengua dels ajustos, independent dels catàlegs de GlotPress. */
function socdepoble_enxufe_llengua_ajustos( $locale = null ) {
	if ( null === $locale ) {
		$locale = function_exists( 'get_user_locale' ) ? get_user_locale() : '';
		if ( ! is_string( $locale ) || '' === $locale ) {
			$locale = function_exists( 'get_locale' ) ? get_locale() : '';
		}
	}
	$locale = is_string( $locale ) ? strtolower( str_replace( '-', '_', $locale ) ) : '';
	if ( preg_match( '/^(?:ca|va)(?:_|$)/', $locale ) ) {
		return 'va';
	}
	foreach ( array( 'es', 'en', 'eu', 'gl' ) as $llengua ) {
		if ( 0 === strpos( $locale, $llengua ) ) {
			return $llengua;
		}
	}
	return 'va';
}

/** Text propi de la guia, no canvia el locale de WordPress ni de l'app. */
function socdepoble_enxufe_text_ajustos( $clau ) {
	$copies = socdepoble_enxufe_copies_ajustos();
	return $copies[ socdepoble_enxufe_llengua_ajustos() ][ $clau ] ?? '';
}

/** El marcatge admés és estàtic i se saneja abans del PHP i del JSON. */
function socdepoble_enxufe_etiqueta_ajustos( $clau, $ric = false ) {
	$text = socdepoble_enxufe_text_ajustos( $clau );
	return '<span data-sdp-' . ( $ric ? 'html' : 'text' ) . '="' . esc_attr( $clau ) . '">'
		. ( $ric ? wp_kses_post( $text ) : esc_html( $text ) ) . '</span>';
}


/**
 * Saneja l'opció desada: només nomPoble i poble, amb els mateixos criteris
 * que el marcatge. La resta de claus es descarta, també el tenantId que hi
 * haja deixat una versió anterior: la propera desada ja no el conserva.
 *
 * @param mixed $valor Valor enviat.
 * @return array
 */
function socdepoble_enxufe_sanitza_opcio( $valor ) {
	$net = array();
	if ( ! is_array( $valor ) ) {
		return $net;
	}
	$nom_poble = socdepoble_enxufe_etiqueta( $valor['nomPoble'] ?? '' );
	$poble     = socdepoble_enxufe_identificador( $valor['poble'] ?? '' );
	if ( '' !== $nom_poble ) {
		$net['nomPoble'] = $nom_poble;
	}
	if ( '' !== $poble ) {
		$net['poble'] = $poble;
	}
	return $net;
}

/**
 * Model B (decisió A1 del Mestre, 261003): el camp «Tenant ID» s'ha retirat i
 * el plugin no llig mai el tenantId que una versió anterior haja desat. Ací se
 * n'esborra la clau, i res més, en la primera petició que dispare admin_init
 * després d'actualitzar: qualsevol pàgina de wp-admin, de qualsevol usuari, i
 * també admin-ajax.php. Va abans de register_setting (prioritat 5): l'opció
 * es reescriu tal qual, sense passar pel sanejador, i les altres claus no es
 * toquen. Sense eixa clau no fa res.
 */
function socdepoble_enxufe_oblida_tenant_heretat() {
	$opcio = get_option( SOCDEPOBLE_ENXUFE_OPCIO, array() );
	if ( ! is_array( $opcio ) || ! array_key_exists( 'tenantId', $opcio ) ) {
		return;
	}
	unset( $opcio['tenantId'] );
	update_option( SOCDEPOBLE_ENXUFE_OPCIO, $opcio );
}
add_action( 'admin_init', 'socdepoble_enxufe_oblida_tenant_heretat', 5 );

/**
 * Registra l'opció, la secció i els camps (API d'Ajustos: el nonce i la
 * capacitat els gestiona options.php).
 */
function socdepoble_enxufe_registra_ajustos() {
	register_setting(
		'socdepoble_enxufe',
		SOCDEPOBLE_ENXUFE_OPCIO,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'socdepoble_enxufe_sanitza_opcio',
			'default'           => array(),
			'show_in_rest'      => false,
		)
	);

	add_settings_section(
		'socdepoble_enxufe_amfitrio',
		socdepoble_enxufe_etiqueta_ajustos( 'host_title' ),
		'socdepoble_enxufe_seccio_amfitrio',
		'socdepoble'
	);

	add_settings_field(
		'socdepoble_enxufe_nompoble',
		socdepoble_enxufe_etiqueta_ajustos( 'village_name' ),
		'socdepoble_enxufe_camp',
		'socdepoble',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'nomPoble',
			'label_for'  => 'socdepoble-enxufe-nompoble',
			'descripcio' => __( 'Shown in the app as the server that hosts it, for example Gent de la Torre.', 'socdepoble' ),
		)
	);

	add_settings_field(
		'socdepoble_enxufe_poble',
		socdepoble_enxufe_etiqueta_ajustos( 'village_id' ),
		'socdepoble_enxufe_camp',
		'socdepoble',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'poble',
			'label_for'  => 'socdepoble-enxufe-poble',
			'descripcio' => __( 'Id of the village in the Villages section: visitors land on its page. It is not a data scope.', 'socdepoble' ),
		)
	);
}
add_action( 'admin_init', 'socdepoble_enxufe_registra_ajustos' );

/**
 * Text de la secció.
 */
function socdepoble_enxufe_seccio_amfitrio() {
	echo '<p>' . socdepoble_enxufe_etiqueta_ajustos( 'host_intro', true ) . '</p>';
}

/**
 * Un camp de text de l'opció.
 *
 * @param array $args Arguments de add_settings_field (clau, label_for, descripcio).
 */
function socdepoble_enxufe_camp( $args ) {
	$opcio = get_option( SOCDEPOBLE_ENXUFE_OPCIO, array() );
	$valor = is_array( $opcio ) && isset( $opcio[ $args['clau'] ] ) && is_scalar( $opcio[ $args['clau'] ] ) ? (string) $opcio[ $args['clau'] ] : '';
	printf(
		'<input type="text" class="regular-text" id="%1$s" name="%2$s[%3$s]" value="%4$s" />',
		esc_attr( $args['label_for'] ),
		esc_attr( SOCDEPOBLE_ENXUFE_OPCIO ),
		esc_attr( $args['clau'] ),
		esc_attr( $valor )
	);
	printf( '<p class="description">%s</p>', socdepoble_enxufe_etiqueta_ajustos( 'nomPoble' === $args['clau'] ? 'name_help' : 'id_help', true ) );
}

/**
 * Afig la pàgina a Ajustos.
 */
function socdepoble_enxufe_afig_pagina() {
	add_options_page(
		__( 'Sóc de Poble', 'socdepoble' ),
		__( 'Sóc de Poble', 'socdepoble' ),
		'manage_options',
		'socdepoble',
		'socdepoble_enxufe_pagina'
	);
}
add_action( 'admin_menu', 'socdepoble_enxufe_afig_pagina' );

/**
 * Enllaç «Ajustos» a la fila del plugin.
 *
 * @param array $enllacos Enllaços d'acció de la fila.
 * @return array
 */
function socdepoble_enxufe_enllac_ajustos( $enllacos ) {
	$ajustos = '<a href="' . esc_url( admin_url( 'options-general.php?page=' . SOCDEPOBLE_ENXUFE_SLUG ) ) . '">' . esc_html__( 'Settings', 'socdepoble' ) . '</a>';
	array_unshift( $enllacos, $ajustos );
	return $enllacos;
}
add_filter( 'plugin_action_links_' . plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ), 'socdepoble_enxufe_enllac_ajustos' );

/**
 * «Mostra els detalls» a la fila del plugin (T5.1, ordre del Mestre, 261029).
 * WordPress només pinta eixe enllaç quan el transient update_plugins porta un
 * slug per al plugin: el del canal propi (actualitzador.php) o, quan el
 * directori el conega, el de WordPress.org. Mentre no n'hi ha cap, la fila
 * només duia «Visita el lloc web de l'extensió», i la finestra nativa amb el
 * bàner, l'autor, la versió i les pestanyes de descripció, instal·lació,
 * preguntes i registre de canvis quedava fora de l'abast. Ací s'afig el mateix
 * enllaç del nucli (ThickBox cap a plugin-install.php) per a l'slug del
 * directori, que socdepoble_enxufe_detalls_plugins_api() respon des del
 * readme.txt local; si el nucli ja l'ha posat (hi ha slug), no se'n duplica
 * cap. La capacitat és la que exigix plugin-install.php.
 *
 * @param string[] $meta        Enllaços de la fila.
 * @param string   $plugin_file Ruta relativa del plugin de la fila.
 * @param array    $plugin_data Capçaleres del plugin (i slug, si WordPress el coneix).
 * @return string[]
 */
function socdepoble_enxufe_fila_detalls( $meta, $plugin_file, $plugin_data ) {
	if ( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== $plugin_file || ! is_array( $meta ) ) {
		return $meta;
	}
	if ( ( is_array( $plugin_data ) && isset( $plugin_data['slug'] ) ) || ! current_user_can( 'install_plugins' ) ) {
		return $meta;
	}
	// Sense la carpeta canònica (socdepoble/), la finestra no trobaria la instal·lació i oferiria «Instal·la ara» sense paquet: cap enllaç, com fa el nucli.
	if ( SOCDEPOBLE_ENXUFE_SLUG !== dirname( $plugin_file ) ) {
		return $meta;
	}
	$nom = is_array( $plugin_data ) && ! empty( $plugin_data['Name'] ) ? (string) $plugin_data['Name'] : __( 'Sóc de Poble', 'socdepoble' );
	$url = add_query_arg(
		array(
			'tab'       => 'plugin-information',
			'plugin'    => SOCDEPOBLE_ENXUFE_SLUG,
			'TB_iframe' => 'true',
			'width'     => 600,
			'height'    => 550,
		),
		network_admin_url( 'plugin-install.php' )
	);
	$meta[] = sprintf(
		'<a href="%1$s" class="thickbox open-plugin-details-modal" aria-label="%2$s" data-title="%3$s">%4$s</a>',
		esc_url( $url ),
		/* translators: %s: plugin name. */
		esc_attr( sprintf( __( 'More information about %s', 'socdepoble' ), $nom ) ),
		esc_attr( $nom ),
		esc_html__( 'View details', 'socdepoble' )
	);
	return $meta;
}
add_filter( 'plugin_row_meta', 'socdepoble_enxufe_fila_detalls', 10, 3 );

/**
 * El readme.txt instal·lat, llegit del disc i sense xarxa: el nom («=== Nom
 * ===»), les capçaleres d'abans de la primera secció (Contributors, Tested up
 * to…) i les seccions en text. És la font de «Mostra els detalls» per a l'slug
 * del directori mentre WordPress.org no respon per ell, i també la del canal
 * propi (socdepoble_enxufe_seccions_readme, a actualitzador.php). Format mínim de
 * WordPress.org: «== Secció ==», «= Subtítol =», llistes «* » i «1. », `codi` i
 * enllaços https. Com fa WordPress.org, les seccions desconegudes van a la
 * descripció; Upgrade Notice i Screenshots, no.
 *
 * @return array|null nom, capcaleres (clau en minúscules => valor) i seccions
 *                    (description, installation, faq, changelog => línies), o
 *                    null si no hi ha cap readme llegible.
 */
function socdepoble_enxufe_llig_readme() {
	$fitxer = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'readme.txt';
	$text   = is_readable( $fitxer ) ? file_get_contents( $fitxer ) : false; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- fitxer local del mateix plugin.
	if ( ! is_string( $text ) || '' === $text ) {
		return null;
	}
	$alies  = array(
		'description'                => 'description',
		'installation'               => 'installation',
		'frequently asked questions' => 'faq',
		'faq'                        => 'faq',
		'changelog'                  => 'changelog',
	);
	$readme = array(
		'nom'        => '',
		'capcaleres' => array(),
		'seccions'   => array(),
	);
	$clau   = '';
	$dins   = false;
	foreach ( preg_split( '/\r\n|\r|\n/', $text ) as $linia ) {
		if ( ! $dins && preg_match( '/^===\s*(.+?)\s*===\s*$/', $linia, $m ) ) {
			$readme['nom'] = $m[1];
			continue;
		}
		// «=== Nom ===» no casa ací: després de «==» ve un altre «=».
		if ( preg_match( '/^==\s*([^=].*?)\s*==\s*$/', $linia, $m ) ) {
			$dins  = true;
			$titol = strtolower( $m[1] );
			if ( isset( $alies[ $titol ] ) ) {
				$clau = $alies[ $titol ];
			} elseif ( in_array( $titol, array( 'upgrade notice', 'screenshots' ), true ) ) {
				$clau = '';
			} else {
				$clau                          = 'description';
				$readme['seccions'][ $clau ][] = '';
				$readme['seccions'][ $clau ][] = '= ' . $m[1] . ' =';
				$readme['seccions'][ $clau ][] = '';
			}
			continue;
		}
		if ( ! $dins ) {
			if ( preg_match( '/^([A-Za-z][A-Za-z ]*?):\s*(.*?)\s*$/', $linia, $m ) ) {
				$readme['capcaleres'][ strtolower( $m[1] ) ] = $m[2];
			}
			continue;
		}
		if ( '' !== $clau ) {
			$readme['seccions'][ $clau ][] = $linia;
		}
	}
	return $readme;
}

/**
 * HTML d'una secció del readme. Les línies seguides del mateix tipus fan un
 * paràgraf o una llista; una línia buida els tanca. Cada text passa per
 * socdepoble_enxufe_linia_detalls(), que l'escapa abans de transformar-lo: cap
 * etiqueta del readme no arriba crua.
 *
 * Com el Markdown de WordPress.org, una línia sagnada just davall d'un element
 * de llista és d'eixe element: una vinyeta li fa una subllista i qualsevol
 * altra línia continua el seu text (o el de la seua última vinyeta). Els
 * passos numerats separats per línies buides són una sola llista: wp_kses()
 * de plugin-install.php no deixa passar l'atribut start, i cada <ol> nova
 * tornaria a començar per 1.
 *
 * @param string[] $linies Línies de la secció.
 * @return string
 */
function socdepoble_enxufe_html_detalls( $linies ) {
	$grups = array();
	foreach ( $linies as $linia ) {
		$sagnada = 1 === preg_match( '/^\s/', (string) $linia );
		$linia   = trim( (string) $linia );
		if ( '' === $linia ) {
			$grups[] = array( '', array(), array() );
			continue;
		}
		$ultim = count( $grups ) - 1;
		if ( $sagnada && $ultim >= 0 && in_array( $grups[ $ultim ][0], array( 'ul', 'ol' ), true ) ) {
			$element = count( $grups[ $ultim ][1] ) - 1;
			if ( preg_match( '/^[*-]\s+(.+)$/', $linia, $m ) ) {
				$grups[ $ultim ][2][ $element ][] = $m[1];
			} elseif ( empty( $grups[ $ultim ][2][ $element ] ) ) {
				$grups[ $ultim ][1][ $element ] .= ' ' . $linia;
			} else {
				$grups[ $ultim ][2][ $element ][ count( $grups[ $ultim ][2][ $element ] ) - 1 ] .= ' ' . $linia;
			}
			continue;
		}
		if ( preg_match( '/^=\s*(.+?)\s*=$/', $linia, $m ) ) {
			$tipus = 'h4';
		} elseif ( preg_match( '/^[*-]\s+(.+)$/', $linia, $m ) ) {
			$tipus = 'ul';
		} elseif ( preg_match( '/^\d+\.\s+(.+)$/', $linia, $m ) ) {
			$tipus = 'ol';
			$previ = $ultim;
			while ( $previ >= 0 && '' === $grups[ $previ ][0] ) {
				--$previ;
			}
			if ( $previ >= 0 && 'ol' === $grups[ $previ ][0] ) {
				$grups = array_slice( $grups, 0, $previ + 1 );
				$ultim = $previ;
			}
		} else {
			$tipus = 'p';
			$m     = array( $linia, $linia );
		}
		if ( 'h4' !== $tipus && $ultim >= 0 && $tipus === $grups[ $ultim ][0] ) {
			$grups[ $ultim ][1][] = $m[1];
		} else {
			$grups[] = array( $tipus, array( $m[1] ), array() );
		}
	}
	$html = '';
	foreach ( $grups as list( $tipus, $textos, $fills ) ) {
		if ( 'p' === $tipus ) {
			$html .= '<p>' . socdepoble_enxufe_linia_detalls( implode( ' ', $textos ) ) . '</p>';
		} elseif ( 'h4' === $tipus ) {
			$html .= '<h4>' . socdepoble_enxufe_linia_detalls( $textos[0] ) . '</h4>';
		} elseif ( '' !== $tipus ) {
			$html .= '<' . $tipus . '>';
			foreach ( $textos as $i => $text ) {
				$html .= '<li>' . socdepoble_enxufe_linia_detalls( $text );
				if ( ! empty( $fills[ $i ] ) ) {
					$html .= '<ul>';
					foreach ( $fills[ $i ] as $fill ) {
						$html .= '<li>' . socdepoble_enxufe_linia_detalls( $fill ) . '</li>';
					}
					$html .= '</ul>';
				}
				$html .= '</li>';
			}
			$html .= '</' . $tipus . '>';
		}
	}
	return $html;
}

/**
 * Una línia de readme en HTML: PRIMER s'escapa i després es transformen
 * `codi`, *cursiva*, **negreta** i els enllaços. La cursiva va abans: els
 * seus límits refusen un asterisc veí o una lletra, i així no es menja la
 * meitat d'una **negreta**. Cap patró no pot recular de manera quadràtica:
 * cap repetició no travessa un asterisc. Només https; un enllaç acaba abans
 * d'una entitat que no siga &amp; (cometes, < i > escapats) i no s'endú la
 * puntuació final.
 *
 * Gauntlet 2 (261101, G2-P02) · El codi és literal, com a WordPress.org: cada
 * tram `codi` es guarda a part i en el seu lloc queda una marca «<N>», que
 * cap text escapat no pot contindre (esc_html no deixa cap «<»). Així els
 * asteriscos d'un codi no obrin cap cursiva ni negreta, cap URL d'un codi no
 * es fa enllaç i cap enllaç no s'empassa el codi del costat, però una cursiva
 * pot embolcallar un codi sencer. Les marques tornen al final amb strtr().
 *
 * @param string $text Text pla.
 * @return string
 */
function socdepoble_enxufe_linia_detalls( $text ) {
	$codis = array();
	$html  = (string) preg_replace_callback(
		'/`([^`]+)`/',
		static function ( $m ) use ( &$codis ) {
			$marca           = '<' . count( $codis ) . '>';
			$codis[ $marca ] = '<code>' . $m[1] . '</code>';
			return $marca;
		},
		esc_html( $text )
	);
	$html  = (string) preg_replace( '/(?<![*\w])\*([^*\s](?:[^*]*[^*\s])?)\*(?![*\w])/u', '<em>$1</em>', $html );
	$html  = (string) preg_replace( '/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $html );
	$html  = (string) preg_replace( '#https://(?:[^\s<>&]|&amp;)*[^\s<>&.,;:)]#', '<a href="$0">$0</a>', $html );
	return strtr( $html, $codis );
}

/**
 * Els bàners de la finestra de detalls, només si viatgen amb el paquet: el
 * directori de WordPress.org els guarda a banda i el zip no els porta.
 *
 * @return string[] low i high, o buit.
 */
function socdepoble_enxufe_baners_detalls() {
	$baners = array();
	foreach ( array( 'low' => 'banner-772x250.png', 'high' => 'banner-1544x500.png' ) as $mida => $fitxer ) {
		if ( is_readable( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'assets/' . $fitxer ) ) {
			$baners[ $mida ] = plugins_url( 'assets/' . $fitxer, SOCDEPOBLE_ENXUFE_FITXER );
		}
	}
	return $baners;
}

/**
 * «Mostra els detalls» per a l'slug del directori, alimentat des del readme.txt
 * local (T5.1, ordre del Mestre, 261029). Mentre WordPress.org no respon per
 * «socdepoble», sense este filtre la finestra nativa deia que el plugin no
 * existix. Només intercepta plugin_information per al nostre slug, només si
 * cap altre filtre ha respost abans, i no fa cap petició de xarxa: tot ix del
 * readme, de la capçalera del plugin i dels bàners del paquet, si hi són.
 * Qualsevol altra consulta torna intacta. L'slug del canal propi el continua
 * servint actualitzador.php, l'únic que anuncia un download_link.
 *
 * Relleu de la reserva del Gauntlet 261025_0545 (MISSED P3): per ordre
 * expressa del Mestre, plugin_information de l'slug del directori ja no viatja
 * cap a WordPress.org; com que ací no s'anuncia cap download_link, cap camí
 * d'instal·lació no rep un enllaç buit ni simbòlic. Sense last_updated: ni el
 * readme ni el manifest validat porten cap data, i la del fitxer seria la de
 * la instal·lació.
 *
 * @param false|object|array $resultat Resultat d'un altre filtre.
 * @param string             $accio    Acció demanada.
 * @param object             $args     Arguments (slug).
 * @return false|object|array
 */
function socdepoble_enxufe_detalls_plugins_api( $resultat, $accio, $args ) {
	if ( false !== $resultat || 'plugin_information' !== $accio || ! is_object( $args ) || empty( $args->slug ) || SOCDEPOBLE_ENXUFE_SLUG !== $args->slug ) {
		return $resultat;
	}
	$readme = socdepoble_enxufe_llig_readme();
	if ( null === $readme ) {
		return $resultat;
	}
	$capcalera = get_file_data(
		SOCDEPOBLE_ENXUFE_FITXER,
		array(
			'nom'          => 'Plugin Name',
			'uri'          => 'Plugin URI',
			'autor'        => 'Author',
			'autor_uri'    => 'Author URI',
			'requires'     => 'Requires at least',
			'requires_php' => 'Requires PHP',
		)
	);
	$seccions  = array();
	foreach ( array( 'description', 'installation', 'faq', 'changelog' ) as $seccio ) {
		if ( ! empty( $readme['seccions'][ $seccio ] ) ) {
			$seccions[ $seccio ] = socdepoble_enxufe_html_detalls( $readme['seccions'][ $seccio ] );
		}
	}
	$seccions = array_filter( $seccions );
	if ( array() === $seccions ) {
		return $resultat;
	}

	$info               = new stdClass();
	$info->name         = '' !== $readme['nom'] ? $readme['nom'] : $capcalera['nom'];
	$info->slug         = SOCDEPOBLE_ENXUFE_SLUG;
	$info->version      = SOCDEPOBLE_ENXUFE_VERSIO;
	$info->author       = '' !== $capcalera['autor_uri']
		? '<a href="' . esc_url( $capcalera['autor_uri'] ) . '">' . esc_html( $capcalera['autor'] ) . '</a>'
		: esc_html( $capcalera['autor'] );
	$info->homepage     = esc_url_raw( $capcalera['uri'] );
	$info->requires     = $capcalera['requires'];
	$info->requires_php = $capcalera['requires_php'];
	// Com l'API de WordPress.org («7.1» → «7.1.4»): sense alinear-ho, version_compare( '7.1.4', '7.1', '<=' ) és fals i la finestra avisa «no provat».
	$provat = (string) ( $readme['capcaleres']['tested up to'] ?? '' );
	$wp     = get_bloginfo( 'version' );
	if ( '' !== $provat && ( $wp === $provat || 0 === strpos( $wp, $provat . '.' ) ) ) {
		$provat = $wp;
	}
	$info->tested       = $provat;
	$info->external     = true;
	$info->sections     = array_map( 'wp_kses_post', $seccions );
	// El primer col·laborador del readme és el perfil de WordPress.org de l'autor.
	$contribuidors = explode( ',', $readme['capcaleres']['contributors'] ?? '' );
	$perfil        = sanitize_title( trim( $contribuidors[0] ) );
	if ( '' !== $perfil ) {
		$info->author_profile = 'https://profiles.wordpress.org/' . $perfil . '/';
	}
	$baners = socdepoble_enxufe_baners_detalls();
	if ( array() !== $baners ) {
		$info->banners = $baners;
	}
	return $info;
}
add_filter( 'plugins_api', 'socdepoble_enxufe_detalls_plugins_api', 10, 3 );

/**
 * Files de la diagnosi del paquet: etiqueta => valor (text pla). Cap fila de
 * tenant: l'abast de dades és del paquet i el plugin no el coneix (Model B).
 *
 * Relleu 261007 (decisió 5 del Mestre) · «Bundle SHA-256» i «Bundle
 * integrity» són les empremtes de dist/soc-de-poble.standalone.js. En el
 * paquet trossejat (formatDelPaquet al manifest) eixe fitxer és el carregador
 * de 3 KB, no l'App: els trossos de dist/trossos/ els cobrix l'inventari
 * (dist/sdp-inventari.json), que la Salut del lloc contrasta. Les etiquetes no
 * canvien fins que el Mestre en fixe un text propi, amb traducció.
 *
 * @return array
 */
function socdepoble_enxufe_diagnosi() {
	$manifest = socdepoble_enxufe_manifest_local();
	$files    = array();
	if ( null === $manifest ) {
		$files[ __( 'Package manifest', 'socdepoble' ) ] = socdepoble_enxufe_te_bundle()
			? __( 'Missing (dist/sdp-release.json). Rebuild the package with npm run build:wp.', 'socdepoble' )
			: __( 'Missing, and the bundle is missing too.', 'socdepoble' );
		return $files;
	}
	$node = $manifest['node'];
	$files[ __( 'App version', 'socdepoble' ) ]      = $manifest['versio'];
	$files[ __( 'Bundle SHA-256', 'socdepoble' ) ]   = $manifest['entrada']['sha256'];
	$files[ __( 'Bundle integrity', 'socdepoble' ) ] = $manifest['entrada']['integrity'];
	$files[ __( 'Sealed data node', 'socdepoble' ) ] = '' !== $node['origen'] ? $node['origen'] : __( 'none', 'socdepoble' );
	$files[ __( 'Data mode', 'socdepoble' ) ]        = $node['mode'];
	$files[ __( 'Package kind', 'socdepoble' ) ]     = $node['desenvolupament'] || 'remote' !== $node['mode']
		? __( 'Development: it only works next to its local backend.', 'socdepoble' )
		: __( 'Release: it can serve real visitors, here or in any other host.', 'socdepoble' );
	$files[ __( 'Site environment', 'socdepoble' ) ] = wp_get_environment_type();
	return $files;
}

/**
 * La pàgina d'ajustos.
 *
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 5): el pas 2 de la
 * benvinguda nomena el shortcode que registra includes/marcatge.php,
 * [socdepoble_app]; [socdepoble] no existix i WordPress el deixava com a
 * text literal a la pàgina, sense l'App.
 */
/** Identifica les etiquetes de diagnosi, també si WordPress ja les ha traduïdes. */
function socdepoble_enxufe_clau_diagnosi_ajustos( $valor ) {
	$copies = socdepoble_enxufe_copies_ajustos();
	foreach ( array( 'manifest', 'missing', 'missing_bundle', 'app_version', 'bundle_sha', 'bundle_integrity', 'data_node', 'none', 'data_mode', 'package_kind', 'development', 'release', 'environment' ) as $clau ) {
		$angles = $copies['en'][ $clau ];
		if ( $valor === $angles || $valor === __( $angles, 'socdepoble' ) ) {
			return $clau;
		}
	}
	return false;
}

/** Ajustos traduïbles sense recarregar ni substituir el formulari. */
function socdepoble_enxufe_pagina() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$llengua = socdepoble_enxufe_llengua_ajustos();
	$idiomes = array( 'va' => 'Valencià · VA', 'es' => 'Castellano · ES', 'en' => 'English · EN', 'eu' => 'Euskara · EU', 'gl' => 'Galego · GL' );
	$copies = array_map( static function ( $textos ) { return array_map( 'wp_kses_post', $textos ); }, socdepoble_enxufe_copies_ajustos() );
	?>
	<div class="wrap sdp-ajustos" data-sdp-language="<?php echo esc_attr( $llengua ); ?>" lang="<?php echo 'va' === $llengua ? 'ca-valencia' : esc_attr( $llengua ); ?>">
		<style>
			.sdp-ajustos{font-size:17px;line-height:1.65;color:#1d2327}
			.sdp-ajustos p,.sdp-ajustos li,.sdp-ajustos .description,.sdp-ajustos td,.sdp-ajustos th{font-size:inherit;line-height:inherit}
			.sdp-ajustos h1{font-size:30px;line-height:1.3}.sdp-ajustos h2{font-size:24px;line-height:1.35;margin-top:0}
			.sdp-ajustos h3{font-size:20px;line-height:1.4}.sdp-ajustos .sdp-ajustos-card{background:#fff;border:1px solid #c3c4c7;padding:24px;margin:24px 0}
			.sdp-ajustos .sdp-ajustos-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
			.sdp-ajustos [role=tab]{font:inherit;min-height:44px;padding:8px 16px;border:1px solid #8c8f94;border-radius:0;background:#fff;color:#1d2327;cursor:pointer}
			.sdp-ajustos [role=tab][aria-selected=true]{background:#1d2327;color:#fff;border-color:#1d2327}
			.sdp-ajustos [role=tab]:focus-visible{outline:3px solid #2271b1;outline-offset:3px}
			.sdp-ajustos .form-table input{font:inherit;max-width:100%}.sdp-ajustos .form-table th{width:14rem}
			.sdp-ajustos .button{font-size:16px;min-height:44px}.sdp-ajustos ol{margin-left:1.5em}.sdp-ajustos li+li{margin-top:24px}
			.sdp-ajustos code{font-size:.95em}
			.sdp-ajustos summary{cursor:pointer;font-weight:600}.sdp-ajustos pre,.sdp-ajustos td code{white-space:pre-wrap;overflow-wrap:anywhere}
			@media(max-width:600px){.sdp-ajustos .sdp-ajustos-card{padding:16px}.sdp-ajustos .form-table th{width:auto}.sdp-ajustos [role=tab]{flex-grow:1}}
		</style>
		<h1>Sóc de Poble</h1>
		<div class="sdp-ajustos-tabs" role="tablist" aria-label="<?php echo esc_attr( socdepoble_enxufe_text_ajustos( 'language' ) ); ?>" data-sdp-label="language">
			<?php foreach ( $idiomes as $codi => $nom ) : ?>
				<button type="button" role="tab" id="sdp-ajustos-tab-<?php echo esc_attr( $codi ); ?>" data-sdp-tab="<?php echo esc_attr( $codi ); ?>" aria-controls="sdp-ajustos-panel" aria-selected="<?php echo $llengua === $codi ? 'true' : 'false'; ?>" tabindex="<?php echo $llengua === $codi ? '0' : '-1'; ?>"><?php echo esc_html( $nom ); ?></button>
			<?php endforeach; ?>
		</div>
		<div role="tabpanel" id="sdp-ajustos-panel" aria-labelledby="sdp-ajustos-tab-<?php echo esc_attr( $llengua ); ?>">
			<?php if ( socdepoble_enxufe_node_inadequat() ) : ?>
				<div class="notice notice-error inline"><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'development_warning', true ); ?></p></div>
			<?php endif; ?>
			<section class="sdp-ajustos-card">
				<h2><?php echo socdepoble_enxufe_etiqueta_ajustos( 'slogan' ); ?></h2>
				<p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'intro', true ); ?></p>
				<p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'roots', true ); ?></p>
				<h3><?php echo socdepoble_enxufe_etiqueta_ajustos( 'guide' ); ?></h3>
				<ol>
					<li><h3><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step1_title' ); ?></h3><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step1', true ); ?></p></li>
					<li><h3><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step2_title' ); ?></h3><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step2a', true ); ?></p><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step2b', true ); ?></p></li>
					<li><h3><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step3_title' ); ?></h3><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'step3', true ); ?></p></li>
				</ol>
			</section>
			<form class="sdp-ajustos-card" action="options.php" method="post">
				<?php settings_fields( 'socdepoble_enxufe' ); do_settings_sections( 'socdepoble' ); ?>
				<p class="submit"><button type="submit" name="submit" id="submit" class="button button-primary"><?php echo socdepoble_enxufe_etiqueta_ajustos( 'save' ); ?></button></p>
			</form>
			<section class="sdp-ajustos-card"><h2><?php echo socdepoble_enxufe_etiqueta_ajustos( 'translation_title' ); ?></h2><p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'translation_help', true ); ?></p></section>
			<details class="sdp-ajustos-card">
				<summary><?php echo socdepoble_enxufe_etiqueta_ajustos( 'diagnosis' ); ?></summary>
				<h2><?php echo socdepoble_enxufe_etiqueta_ajustos( 'package_title' ); ?></h2>
				<table class="widefat striped"><tbody>
				<?php foreach ( socdepoble_enxufe_diagnosi() as $etiqueta => $valor ) : ?>
					<tr><th scope="row"><?php $clau = socdepoble_enxufe_clau_diagnosi_ajustos( $etiqueta ); echo false === $clau ? esc_html( $etiqueta ) : socdepoble_enxufe_etiqueta_ajustos( $clau ); ?></th><td><code><?php $clau = socdepoble_enxufe_clau_diagnosi_ajustos( $valor ); echo false === $clau ? esc_html( $valor ) : socdepoble_enxufe_etiqueta_ajustos( $clau ); ?></code></td></tr>
				<?php endforeach; ?>
				</tbody></table>
				<?php if ( function_exists( 'socdepoble_enxufe_seccio_canal' ) ) { socdepoble_enxufe_seccio_canal(); } ?>
				<h2><?php echo socdepoble_enxufe_etiqueta_ajustos( 'markup_title' ); ?></h2>
				<p><?php echo socdepoble_enxufe_etiqueta_ajustos( 'markup_help', true ); ?></p>
				<pre><code><?php echo esc_html( socdepoble_enxufe_marcatge_de_referencia() ); ?></code></pre>
			</details>
		</div>
		<?php
		$json = wp_json_encode( $copies, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
		if ( function_exists( 'wp_print_inline_script_tag' ) ) {
			wp_print_inline_script_tag( $json, array( 'type' => 'application/json', 'data-sdp-copies' => '' ) );
		} else {
			echo '<script type="application/json" data-sdp-copies>' . $json . '</script>';
		}
		ob_start();
		?>
		(() => {
			const root = document.currentScript.closest('.sdp-ajustos');
			const copies = JSON.parse(root.querySelector('[data-sdp-copies]').textContent);
			const tabs = Array.from(root.querySelectorAll('[data-sdp-tab]'));
			function select(code) {
				if (!Object.prototype.hasOwnProperty.call(copies, code)) return;
				const texts = copies[code];
				root.querySelectorAll('[data-sdp-text]').forEach(node => { node.textContent = texts[node.dataset.sdpText]; });
				root.querySelectorAll('[data-sdp-html]').forEach(node => { node.innerHTML = texts[node.dataset.sdpHtml]; });
				root.querySelectorAll('[data-sdp-label]').forEach(node => { node.setAttribute('aria-label', texts[node.dataset.sdpLabel]); });
				tabs.forEach(tab => { const active = tab.dataset.sdpTab === code; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
				root.dataset.sdpLanguage = code;
				root.lang = code === 'va' ? 'ca-valencia' : code;
				root.querySelector('[role=tabpanel]').setAttribute('aria-labelledby', 'sdp-ajustos-tab-' + code);
			}
			tabs.forEach((tab, index) => {
				tab.addEventListener('click', () => select(tab.dataset.sdpTab));
				tab.addEventListener('keydown', event => {
					let next;
					if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
					else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
					else if (event.key === 'Home') next = 0;
					else if (event.key === 'End') next = tabs.length - 1;
					else return;
					event.preventDefault(); tabs[next].focus(); select(tabs[next].dataset.sdpTab);
				});
			});
		})();
		<?php
		$script = ob_get_clean();
		if ( function_exists( 'wp_print_inline_script_tag' ) ) {
			wp_print_inline_script_tag( $script );
		} else {
			echo '<script>' . $script . '</script>';
		}
		?>
	</div>
	<?php
}
