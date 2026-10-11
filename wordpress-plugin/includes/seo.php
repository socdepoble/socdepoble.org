<?php
/**
 * OpenGraph de la ruta de l'App per a les xarxes (WhatsApp, Telegram,
 * Mastodon…), pre-renderitzat per l'amfitrió.
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 7) · ESBORRANY INERT PER DEFECTE.
 * Encàrrec del Mestre: «Plantejar l'actualització del PHP amfitrió per
 * pre-renderitzar l'OpenGraph segons la ruta, evitant mostrar sempre
 * gentdelatorre.net genèric.»
 *
 * PER QUÈ. La ruta de l'App viu al fragment de la pàgina (#sdp=/mur/123,
 * clàusula dels slugs, marcatge.php) i el fragment no arriba mai al servidor:
 * WhatsApp demana la URL de la pàgina i rep l'OpenGraph genèric que emeten el
 * tema o el connector de SEO. L'App només escriu al <head> en el lloc propi
 * (manageDocumentHead, src/hooks/useSEO.js), mai dins de WordPress, i les
 * xarxes no executen JavaScript. Este fitxer fa el que l'App no pot fer ací:
 * llegir la ruta de la petició i emetre les etiquetes d'eixa ruta.
 *
 * DECISIÓ DE DIRECCIÓ TÈCNICA. Onada 12 (261011; ordres 261011_0130, punt 3,
 * D-19 i D-20): MODE PARÀMETRE ESTRICTE i TAULA ESTÀTICA. La ruta arriba al
 * servidor només per la consulta ?sdp=/ruta (res de reescriptura /sdp/<ruta>,
 * cap regla de rewrite, cap flush_rewrite_rules) i les etiquetes ixen només de
 * la taula del paquet, dist/seo-routes.json (cap GET al node des d'este PHP,
 * cap fitxa dinàmica per publicació). L'interruptor continua sent el filtre,
 * apagat per defecte: encendre'l canvia el que WordPress imprimix i és una
 * decisió de desplegament de cada amfitrió, no d'este fitxer.
 *
 * QUAN ACTUA. Només si es complixen les cinc condicions:
 *   1. el filtre `socdepoble_enxufe_seo` torna exactament true (per defecte,
 *      false: Llei del Píxel, cap pàgina canvia sense ordre);
 *   2. el filtre `socdepoble_enxufe_ruta_a_url` torna 'parametre': amb el
 *      fragment, el de sempre, el servidor no té res a llegir i l'App no obri
 *      la ruta d'un ?sdp=, i les etiquetes dirien una pàgina que no s'obri.
 *      DECISIÓ PENDENT DEL MESTRE: l'ordre diu «activat per filtre», i esta
 *      condició en fa dos. La va afegir Claude (261011) i no és de l'ordre;
 *      llevar-la és esborrar l'última línia de socdepoble_enxufe_seo_actiu();
 *   3. la petició porta ?sdp= UNA sola vegada, amb el nom escrit tal qual, i
 *      amb un text que ja és la ruta sanejada: el valor ha de ser idèntic al
 *      que torna socdepoble_enxufe_ruta() (el sanejador de ruta-inicial). Un
 *      valor que el sanejador hauria de retallar (blancs a les vores, un
 *      fragment), una llista (?sdp[]=), un paràmetre repetit, un nom
 *      codificat (?s%64p=) o un origen no es corregix: es rebutja;
 *   4. la petició és d'una pàgina singular que porta l'App al seu contingut
 *      (el shortcode [socdepoble_app] o el bloc socdepoble/app). Una altra
 *      entrada, un arxiu o la portada amb ?sdp= no canvien;
 *   5. la ruta és a la taula: per àlies, per clau exacta o per la seua secció.
 *      La taula és la llista blanca; fora d'ella no es toca res.
 *
 *   add_filter( 'socdepoble_enxufe_seo', function () { return true; } );
 *   add_filter( 'socdepoble_enxufe_ruta_a_url', function () { return 'parametre'; } );
 *
 * SI NO PASSA RES. Este fitxer calla sempre: no avisa de res, ni a la Salut
 * del lloc (afegir-hi una prova demana textos traduïts a languages/ i el seu
 * nom a la llista de tests/enxufe-plugin.test.mjs; queda proposat, no fet).
 * Les tres maneres d'encendre'l i no veure cap etiqueta:
 *   a. encendre només `socdepoble_enxufe_seo` i deixar el mode per defecte
 *      ('fragment'): falta el segon filtre;
 *   b. un paquet sense dist/seo-routes.json, amb la taula trencada o de més
 *      de 2 MiB: es mira al disc abans d'encendre res;
 *   c. registrar els filtres massa tard. La decisió es pren una vegada, a
 *      l'acció wp amb prioritat 0, i val per a tota la petició: els filtres
 *      han d'estar registrats abans (en carregar un connector, a
 *      functions.php del tema, a init). Un filtre afegit a wp amb prioritat
 *      10, a template_redirect o més tard ja no compta. No es torna a
 *      decidir a wp_head a propòsit: les etiquetes eixirien sense haver
 *      pres el <title> ni llevat els og:* del connector de SEO.
 *
 * LA CAU DE PÀGINA DE L'AMFITRIÓ. Amb el mode 'parametre' cada ?sdp= és una
 * pàgina amb un <head> diferent. Una cau que ignora o lleva els paràmetres
 * que no coneix (per a servir la mateixa còpia a ?utm_…) entregaria les
 * etiquetes de la primera ruta visitada a totes les altres. Qui encén el
 * filtre ha de traure `sdp` d'eixa llista de paràmetres ignorats: o la cau
 * guarda una còpia per valor de `sdp`, o no guarda les peticions que el
 * porten. Este fitxer no envia cap capçalera de cau: és de l'amfitrió.
 *
 * D'ON TRAU LES DADES. De la taula de rutes del paquet, dist/seo-routes.json,
 * que escriu tooling/gates/build-seo-manifest.mjs (només lectura, com el
 * manifest de release de manifest.php):
 *
 *   { "routes":  { "mur": { "title", "description", "image", "index", "type" }, … },
 *     "aliases": { "chat": "xat", … } }
 *
 * Una ruta sense fila pròpia (/mur/<id> d'una publicació que la taula no
 * coneix) rep les etiquetes de la seua secció i l'og:url de la secció. Cap
 * crida a cap backend, cap clau: el plugin no sap on viuen les dades (Model
 * B, decisió A1 del Mestre, 261003).
 *
 * RES DE LA PETICIÓ ES REFLECTIX. El valor de ?sdp= només servix per a triar
 * una fila. Tot el que s'imprimix ix de la taula i del lloc: l'og:url es
 * construïx amb la clau de la fila (la ruta canònica: /chat dona /xat, i
 * /mur/123?dia=2 dona /mur), mai amb el text que ha arribat.
 *
 * QUÈ EMET, en eixa petició i a wp_head amb prioritat 1 (abans que cap tema):
 * el <title> (pel canal de WordPress, pre_get_document_title), la descripció,
 * robots si la fila no és indexable, og:type, og:title, og:description,
 * og:url (la URL canònica amb ?sdp=, en la forma que escriu l'App), og:image
 * (URL absoluta, mai SVG) i les targetes de Twitter. Dels connectors de SEO
 * només es lleven els og:* i els twitter:*, mai el canònic ni el robots: de
 * Yoast SEO, els presentadors d'Open Graph i de Twitter; de Rank Math i de
 * Jetpack, el seu Open Graph; All in One SEO no es toca (vegeu
 * socdepoble_enxufe_seo_prepara). Sempre amb comprovació prèvia que el
 * connector hi és, i només en eixa petició. Un
 * tema clàssic sense title-tag imprimix el seu <title> i no passa pel filtre:
 * les xarxes lligen og:title primer.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Cert si l'amfitrió ha encés l'OpenGraph de la ruta: el filtre
 * `socdepoble_enxufe_seo` torna exactament true (per defecte, false) i la
 * ruta de l'App viu a la consulta (`socdepoble_enxufe_ruta_a_url` torna
 * 'parametre'; per defecte, 'fragment'). Onada 12 (261011; ordres
 * 261011_0130, punt 3, D-19): mode paràmetre estricte. Amb qualsevol altre
 * mode l'App no obri la ruta d'un ?sdp=, i no es promet a les xarxes una
 * pàgina que el navegador no pintarà.
 *
 * @return bool
 */
function socdepoble_enxufe_seo_actiu() {
	if ( true !== apply_filters( 'socdepoble_enxufe_seo', false ) ) {
		return false;
	}
	return 'parametre' === apply_filters( 'socdepoble_enxufe_ruta_a_url', 'fragment' );
}

/**
 * Cert si la consulta crua porta el paràmetre `sdp` exactament una vegada i
 * escrit tal qual. Onada 12 (261011; correcció S3): l'App pren el PRIMER tros
 * «sdp=» de la consulta crua (llegeixRutaDeLaUrl, src/PedraSecaEmbed.jsx) i
 * PHP es queda l'ÚLTIM, i PHP accepta noms que l'App no veu (amb blancs
 * davant, percent-codificats o amb claudàtors). Amb ?sdp=/mur&sdp=/xat el
 * servidor diria «Xat» i el navegador obriria el Mur. Mode estricte: un sol
 * tros de nom «sdp» i cap altre que PHP acabaria llegint com a sdp. Sense
 * cadena de consulta que mirar, no.
 *
 * @return bool
 */
function socdepoble_enxufe_seo_parametre_unic() {
	if ( ! isset( $_SERVER['QUERY_STRING'] ) || ! is_string( $_SERVER['QUERY_STRING'] ) ) {
		return false;
	}
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- només es compten noms de paràmetre; res d'ací s'imprimix ni es desa.
	$consulta = wp_unslash( $_SERVER['QUERY_STRING'] );
	$exactes  = 0;
	foreach ( explode( '&', $consulta ) as $tros ) {
		$nom = explode( '=', $tros, 2 )[0];
		if ( 'sdp' === $nom ) {
			++$exactes;
			continue;
		}
		// El que PHP faria del nom: el descodifica i li lleva els blancs de davant; «sdp[…]» és una llista de sdp.
		if ( 1 === preg_match( '/^sdp(?:\[|\x00|$)/', ltrim( urldecode( $nom ) ) ) ) {
			return false;
		}
	}
	return 1 === $exactes;
}

/**
 * Cert si la petició és d'una pàgina singular que porta l'App: el shortcode
 * [socdepoble_app] o el bloc socdepoble/app al seu contingut. Onada 12
 * (261011; correcció S1): sense esta guarda, amb els filtres encesos,
 * https://lloc/qualsevol-entrada/?sdp=/mur rebia el títol i els og:* del Mur.
 * Fora d'eixa pàgina (una entrada sense l'App, un arxiu, la portada de
 * notícies, una cerca) no es toca res. Límit conegut, i tanca cap al costat
 * segur: una App posada per un giny, per un patró sincronitzat o per la
 * plantilla del tema, i no pel contingut de la pàgina, no es detecta i no rep
 * etiquetes.
 *
 * @return bool
 */
function socdepoble_enxufe_seo_pagina_amb_app() {
	if ( ! is_singular() ) {
		return false;
	}
	$entrada = get_queried_object();
	if ( ! is_object( $entrada ) || ! isset( $entrada->post_content ) || ! is_string( $entrada->post_content ) ) {
		return false;
	}
	return has_shortcode( $entrada->post_content, 'socdepoble_app' ) || has_block( 'socdepoble/app', $entrada->post_content );
}

/**
 * La ruta de l'App que porta la petició (?sdp=/ruta), o '' si l'amfitrió no
 * ha obert la porta o el valor no té la forma estricta: un sol text que ja és
 * la ruta sanejada. El sanejador (socdepoble_enxufe_ruta, el de ruta-inicial)
 * retalla blancs i lleva el fragment; ací un valor que caldria corregir es
 * rebutja sencer. Es llig sense nonce: és un paràmetre públic de navegació
 * (el que escriu l'App en mode 'parametre'), no cap acció, i només servix
 * per a triar una fila de la taula.
 *
 * @return string
 */
function socdepoble_enxufe_seo_ruta_demanada() {
	if ( ! socdepoble_enxufe_seo_actiu() || ! socdepoble_enxufe_seo_parametre_unic() ) {
		return '';
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- paràmetre públic de navegació, només llegit.
	if ( ! isset( $_GET['sdp'] ) || ! is_string( $_GET['sdp'] ) ) {
		return '';
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- socdepoble_enxufe_ruta() és el sanejador (marcatge.php).
	$crua = wp_unslash( $_GET['sdp'] );
	$ruta = socdepoble_enxufe_ruta( $crua );
	return $ruta === $crua ? $ruta : '';
}

/**
 * La taula de rutes del paquet (dist/seo-routes.json), validada, o null.
 * Mateixa lectura silenciosa que manifest.php: un JSON trencat no llança
 * avisos a cada petició. Es llig una vegada per petició i només quan la
 * petició és activa (socdepoble_enxufe_seo_fila). Onada 12 (261011;
 * correcció S4): sostre de 2 MiB. Qualsevol ?sdp=/x ben format arriba ací, i
 * una taula desbocada no s'ha de llegir i descodificar sencera a cada
 * petició; per damunt del sostre val com si no hi fora. La taula de hui no
 * arriba a 40 KB.
 *
 * @return array|null { routes: array<string, array>, aliases: array<string, string> }
 */
function socdepoble_enxufe_seo_taula() {
	static $carregada = false;
	static $taula     = null;
	if ( $carregada ) {
		return $taula;
	}
	$carregada = true;

	$fitxer = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . SOCDEPOBLE_ENXUFE_SEO_RUTES;
	if ( ! is_readable( $fitxer ) ) {
		return null;
	}
	$sostre = 2 * 1024 * 1024;
	$mida   = filesize( $fitxer );
	if ( false === $mida || $mida > $sostre ) {
		return null;
	}
	$text  = file_get_contents( $fitxer );
	$taula = socdepoble_enxufe_seo_valida_taula( false === $text ? null : json_decode( $text, true ) );
	return $taula;
}

/**
 * Valida la taula descodificada i en torna només el que este fitxer usa, ja
 * sanejat: per ruta, title (obligatori), description, image, index i type;
 * i els àlies que apunten a una ruta existent. La resta es descarta.
 * Onada 12 (261011; D-19): la clau d'una fila és la ruta canònica que
 * s'imprimirà a og:url, i per això ha de ser ella mateixa una ruta neta de
 * l'App, sense barra inicial ni consulta: '/' . clau ha de passar el
 * sanejador sense canvis.
 *
 * @param mixed $dades Taula descodificada com a array associatiu.
 * @return array|null
 */
function socdepoble_enxufe_seo_valida_taula( $dades ) {
	if ( ! is_array( $dades ) || ! is_array( $dades['routes'] ?? null ) ) {
		return null;
	}
	$rutes = array();
	foreach ( $dades['routes'] as $clau => $fila ) {
		if ( ! is_string( $clau ) || '' === $clau || '/' === $clau[0] || ! is_array( $fila ) ) {
			continue;
		}
		if ( false !== strpos( $clau, '?' ) || socdepoble_enxufe_ruta( '/' . $clau ) !== '/' . $clau ) {
			continue;
		}
		$titol = socdepoble_enxufe_etiqueta( $fila['title'] ?? '' );
		if ( '' === $titol ) {
			continue;
		}
		$rutes[ $clau ] = array(
			'title'       => $titol,
			'description' => socdepoble_enxufe_etiqueta( $fila['description'] ?? '' ),
			'image'       => is_string( $fila['image'] ?? null ) ? trim( $fila['image'] ) : '',
			'index'       => false !== ( $fila['index'] ?? true ),
			'type'        => is_string( $fila['type'] ?? null ) ? $fila['type'] : 'WebPage',
		);
	}
	if ( array() === $rutes ) {
		return null;
	}
	$alies = array();
	$crus  = is_array( $dades['aliases'] ?? null ) ? $dades['aliases'] : array();
	foreach ( $crus as $de => $a ) {
		if ( is_string( $de ) && is_string( $a ) && isset( $rutes[ $a ] ) ) {
			$alies[ $de ] = $a;
		}
	}
	return array(
		'routes'  => $rutes,
		'aliases' => $alies,
	);
}

/**
 * La fila de la taula per a una ruta de l'App, o null. Ordre: l'àlies del
 * rewrite (chat → xat), la ruta exacta i, si no, la secció (/mur/<id> → mur).
 * El productor escriu els ids de detall amb encodeURIComponent i l'App els
 * porta igual al seu pathname (?sdp=/mercat/caixa%2520gran: PHP en descodifica
 * una capa i queda caixa%20gran, que casa tal qual). Un id escrit a mà sense
 * codificar (café) el casa la segona candidata, amb rawurlencode per segment.
 * Onada 12 (261011; D-19): la fila torna amb 'clau', la clau de la taula que
 * ha casat (l'àlies ja resolt, la ruta exacta o la secció). És l'única ruta
 * que s'imprimix: el text de la petició no ix d'ací.
 *
 * @param array  $taula Taula validada (socdepoble_enxufe_seo_valida_taula).
 * @param string $ruta  Ruta sanejada de l'App (camí i consulta).
 * @return array|null
 */
function socdepoble_enxufe_seo_resol( $taula, $ruta ) {
	$clau = trim( explode( '?', $ruta, 2 )[0], '/' );
	if ( '' === $clau ) {
		return null;
	}
	$candidates = array( $clau, implode( '/', array_map( 'rawurlencode', explode( '/', $clau ) ) ) );
	foreach ( $candidates as $candidata ) {
		$candidata = $taula['aliases'][ $candidata ] ?? $candidata;
		if ( isset( $taula['routes'][ $candidata ] ) ) {
			return array( 'clau' => $candidata ) + $taula['routes'][ $candidata ];
		}
	}
	$seccio = explode( '/', $clau, 2 )[0];
	$seccio = $taula['aliases'][ $seccio ] ?? $seccio;
	return isset( $taula['routes'][ $seccio ] ) ? array( 'clau' => $seccio ) + $taula['routes'][ $seccio ] : null;
}

/**
 * La fila resolta per a esta petició, o null si la petició no és activa, no
 * hi ha taula o la ruta no hi és. Porta 'ruta': la ruta canònica de la fila
 * ('/' i la seua clau de la taula), no la que ha arribat a la petició.
 * Calculada una vegada: el títol, la capçalera i la preparació la compartixen.
 * Es decidix a l'acció wp, prioritat 0 (socdepoble_enxufe_seo_prepara), i
 * eixa decisió val per a tota la petició: un filtre registrat més tard no la
 * canvia (vegeu «SI NO PASSA RES» a la capçalera del fitxer).
 *
 * @return array|null
 */
function socdepoble_enxufe_seo_fila() {
	static $resolta = false;
	static $fila    = null;
	if ( $resolta ) {
		return $fila;
	}
	$resolta = true;

	$ruta = socdepoble_enxufe_seo_ruta_demanada();
	if ( '' === $ruta ) {
		return null;
	}
	if ( ! socdepoble_enxufe_seo_pagina_amb_app() ) {
		return null;
	}
	$taula = socdepoble_enxufe_seo_taula();
	if ( null === $taula ) {
		return null;
	}
	$fila = socdepoble_enxufe_seo_resol( $taula, $ruta );
	if ( null !== $fila ) {
		$fila['ruta'] = '/' . $fila['clau'];
	}
	return $fila;
}

/**
 * El nom del lloc en text pla (l'opció es desa amb entitats).
 *
 * @return string
 */
function socdepoble_enxufe_seo_nom_del_lloc() {
	return html_entity_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES, 'UTF-8' );
}

/**
 * El títol complet d'una fila, en text pla: «Mur | Gent de la Torre», amb el
 * mateix separador que el nucli (seoHead.js) i el nom d'este lloc.
 *
 * @param array $fila Fila resolta.
 * @return string
 */
function socdepoble_enxufe_seo_titol_complet( $fila ) {
	$lloc = socdepoble_enxufe_seo_nom_del_lloc();
	return '' === $lloc ? $fila['title'] : $fila['title'] . ' | ' . $lloc;
}

/**
 * pre_get_document_title: el <title> de la ruta pel canal de WordPress (el
 * tema amb title-tag l'imprimix a wp_head, prioritat 1). Prioritat 99, després
 * de Yoast i Rank Math. WordPress imprimix el retorn de pre_get_document_title
 * tal qual: el curtcircuit de wp_get_document_title() evita el filtre
 * document_title, on el nucli penja esc_html (default-filters.php). Per això
 * s'escapa ací.
 *
 * @param string $titol El que anava a imprimir WordPress.
 * @return string
 */
function socdepoble_enxufe_seo_titol( $titol ) {
	$fila = socdepoble_enxufe_seo_fila();
	return null === $fila ? $titol : esc_html( socdepoble_enxufe_seo_titol_complet( $fila ) );
}

/**
 * La URL absoluta de la imatge social. Les xarxes no pinten SVG ni baixen
 * res que no siga http(s): un SVG, una imatge buida o un camí que puja de
 * carpeta valen la base de 1200x630, com fa el nucli (useSEO.js). Un camí
 * relatiu viu a dist/ del paquet (public/ viatja amb l'App), no a l'arrel del
 * lloc: es resol contra plugins_url('dist/').
 *
 * @param string $imatge Valor cru de la fila.
 * @return string
 */
function socdepoble_enxufe_seo_imatge( $imatge ) {
	$defecte = 'assets/system/ui/og-socdepoble-1200x630.png';
	if ( '' === $imatge || preg_match( '/\.svgz?(?:[?#]|$)/i', $imatge ) || preg_match( '~(?:^|/)\.\.(?:/|$)~', $imatge ) ) {
		$imatge = $defecte;
	}
	if ( preg_match( '~^https?://~i', $imatge ) ) {
		return esc_url_raw( $imatge, array( 'http', 'https' ) );
	}
	if ( 0 === strpos( $imatge, '//' ) ) {
		return esc_url_raw( 'https:' . $imatge, array( 'https' ) );
	}
	// Un altre esquema (data:, ftp:) no és cap imatge que les xarxes baixen.
	if ( preg_match( '~^[a-z][a-z0-9+.-]*:~i', $imatge ) ) {
		$imatge = $defecte;
	}
	return esc_url_raw( plugins_url( 'dist/' . ltrim( $imatge, '/' ), SOCDEPOBLE_ENXUFE_FITXER ), array( 'http', 'https' ) );
}

/**
 * La URL canònica de la ruta: la pàgina que la servix amb ?sdp=, en la MATEIXA
 * forma que escriu l'App (codificaRuta, src/PedraSecaEmbed.jsx: '/' llegible,
 * la resta codificada), perquè WhatsApp i els cercadors vegen una sola URL.
 * Onada 12 (261011; D-19): rep la ruta canònica de la fila (la clau de la
 * taula), mai el valor de la petició. La base és sempre l'enllaç permanent de
 * la pàgina que porta l'App (correcció S1: ja no hi ha reserva a l'arrel del
 * lloc, perquè fora d'una pàgina singular amb l'App no s'arriba ací).
 *
 * @param string $ruta Ruta canònica de la fila ('/' i la clau de la taula).
 * @return string
 */
function socdepoble_enxufe_seo_url( $ruta ) {
	$base = (string) get_permalink();
	return add_query_arg( 'sdp', str_replace( '%2F', '/', rawurlencode( $ruta ) ), $base );
}

/**
 * El tipus OpenGraph d'un tipus de la taula (schema.org): només 'article' o
 * 'website', que és el que entenen les xarxes.
 *
 * @param string $tipus Tipus de la fila.
 * @return string
 */
function socdepoble_enxufe_seo_tipus_og( $tipus ) {
	return in_array( $tipus, array( 'Article', 'NewsArticle', 'BlogPosting', 'Event' ), true ) ? 'article' : 'website';
}

/**
 * wp_head, prioritat 1: les etiquetes de la ruta. Res si la petició no és
 * activa. Tot el que ix passa per esc_attr o esc_url.
 */
function socdepoble_enxufe_seo_capcalera() {
	$fila = socdepoble_enxufe_seo_fila();
	if ( null === $fila ) {
		return;
	}
	$titol      = socdepoble_enxufe_seo_titol_complet( $fila );
	$descripcio = $fila['description'];
	$imatge     = socdepoble_enxufe_seo_imatge( $fila['image'] );
	$url        = socdepoble_enxufe_seo_url( $fila['ruta'] );
	$lloc       = socdepoble_enxufe_seo_nom_del_lloc();

	echo "\n<!-- Sóc de Poble — Enxufe: OpenGraph de la ruta -->\n";
	if ( '' !== $descripcio ) {
		echo '<meta name="description" content="' . esc_attr( $descripcio ) . '">' . "\n";
	}
	if ( ! $fila['index'] ) {
		echo '<meta name="robots" content="noindex, nofollow">' . "\n";
	}
	echo '<meta property="og:type" content="' . esc_attr( socdepoble_enxufe_seo_tipus_og( $fila['type'] ) ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $titol ) . '">' . "\n";
	if ( '' !== $descripcio ) {
		echo '<meta property="og:description" content="' . esc_attr( $descripcio ) . '">' . "\n";
	}
	echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	echo '<meta property="og:image" content="' . esc_url( $imatge ) . '">' . "\n";
	if ( '' !== $lloc ) {
		echo '<meta property="og:site_name" content="' . esc_attr( $lloc ) . '">' . "\n";
	}
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $titol ) . '">' . "\n";
	if ( '' !== $descripcio ) {
		echo '<meta name="twitter:description" content="' . esc_attr( $descripcio ) . '">' . "\n";
	}
	echo '<meta name="twitter:image" content="' . esc_url( $imatge ) . '">' . "\n";
}
add_action( 'wp_head', 'socdepoble_enxufe_seo_capcalera', 1 );

/**
 * Callback de wpseo_frontend_presenters (Yoast SEO 14+): lleva només els
 * presentadors d'Open Graph i de Twitter, que Yoast declara als espais de
 * noms Yoast\WP\SEO\Presenters\Open_Graph i …\Twitter. Onada 12 (261011;
 * correcció S1): abans es tornava una llista buida, i amb ella se n'anaven
 * també el canònic, el robots (una pàgina amb noindex el perdia), la
 * descripció i l'esquema. Si una versió de Yoast canvia eixos noms, este
 * filtre no lleva res: els og:* eixirien dues vegades, però mai es perd el
 * canònic ni el robots.
 *
 * @param mixed $presentadors Els presentadors del <head> de Yoast.
 * @return mixed
 */
function socdepoble_enxufe_seo_sense_xarxes( $presentadors ) {
	if ( ! is_array( $presentadors ) ) {
		return $presentadors;
	}
	$queden = array();
	foreach ( $presentadors as $presentador ) {
		$classe = is_object( $presentador ) ? get_class( $presentador ) : '';
		if ( false !== strpos( $classe, '\\Open_Graph\\' ) || false !== strpos( $classe, '\\Twitter\\' ) ) {
			continue;
		}
		$queden[] = $presentador;
	}
	return $queden;
}

/**
 * Callback per als filtres dels connectors de SEO: no (Rank Math, Jetpack).
 *
 * @return bool
 */
function socdepoble_enxufe_seo_no() {
	return false;
}

/**
 * Acció wp, prioritat 0 (ja hi ha consulta i tots els connectors carregats;
 * Jetpack decidix els seus og:* en esta mateixa acció, més tard): si la
 * petició és activa, pren el <title> i lleva els og:* i els twitter:* dels
 * connectors de SEO, cada un només si el connector hi és. Fora d'eixa
 * petició no es registra res: les altres pàgines no canvien.
 * Onada 12 (261011; correcció S1): només Open Graph i Twitter. El canònic, el
 * robots i la resta del <head> de cada connector es queden. All in One SEO no
 * es toca: l'únic filtre que este fitxer coneixia (aioseo_disable) li lleva
 * el <head> sencer, canònic i robots inclosos; amb ell actiu els seus og:*
 * ixen al costat dels d'ací. Els filtres de Rank Math i de Jetpack són
 * d'Open Graph pel seu nom; no s'han pogut contrastar amb el codi d'eixos
 * connectors (no són al disc): si algun no existira, no faria res.
 */
function socdepoble_enxufe_seo_prepara() {
	if ( null === socdepoble_enxufe_seo_fila() ) {
		return;
	}
	add_filter( 'pre_get_document_title', 'socdepoble_enxufe_seo_titol', 99 );
	// Yoast SEO (14+): només els presentadors d'Open Graph i de Twitter.
	if ( defined( 'WPSEO_VERSION' ) ) {
		add_filter( 'wpseo_frontend_presenters', 'socdepoble_enxufe_seo_sense_xarxes' );
	}
	// Rank Math: el seu OpenGraph i les seues targetes de Twitter.
	if ( class_exists( 'RankMath' ) ) {
		add_filter( 'rank_math/frontend/show_opengraph', 'socdepoble_enxufe_seo_no' );
	}
	// Jetpack: els seus og:*.
	if ( class_exists( 'Jetpack' ) ) {
		add_filter( 'jetpack_enable_open_graph', 'socdepoble_enxufe_seo_no' );
	}
}
add_action( 'wp', 'socdepoble_enxufe_seo_prepara', 0 );
