<?php
/**
 * Exemple de mu-plugin sobirà de manteniment HTTP 503 amb Retry-After (IDEA-263).
 *
 * Doctrina Fernando Tellado (VIG-07): el fitxer natiu .maintenance de WordPress
 * no protegix tota la finestra real d'una migració i una pàgina temporal amb
 * 200 OK fa que els cercadors indexen «En manteniment». Quan calga obrir una
 * finestra real de manteniment a l'amfitrió WordPress:
 *   1. Copieu este fitxer a wp-content/mu-plugins/sdp-manteniment-503.php.
 *   2. Definiu a wp-config.php l'hora exacta de fi, amb zona, per exemple:
 *      define( 'SDP_MODE_MANTENIMENT_FINS', '2026-11-15T04:00:00Z' );
 *      Només s'admet un instant absolut: un timestamp Unix (enter o xifres)
 *      o una data ISO 8601 amb Z o desplaçament (+01:00). Una data relativa
 *      («tomorrow 04:00», «+2 hours») es recalcularia a cada petició i el
 *      manteniment no acabaria mai; una data sense zona depén de l'amfitrió.
 *      Qualsevol d'eixes formes deixa el manteniment inactiu.
 *   3. Quan passe eixa hora, el manteniment es desactiva solet encara que
 *      algú oblide llevar la constant, i cada petició torna a respondre el
 *      seu 200 o 404 de sempre.
 *
 * Durant la finestra, les pàgines públiques i l'API REST responen 503 amb
 * Retry-After (60 s – 24 h) i sense memòria cau. Exclusions mínimes:
 *   · /robots.txt, només quan el nucli l'encamina com a tal (is_robots()):
 *     els cercadors lligen les regles. Cap comparació del camí de la petició
 *     (un camí amb %XX, majúscules o un altre directori el normalitzen de
 *     maneres distintes el servidor i el nucli, i eixiria del 503 amb
 *     l'encaminament normal) i cap distinció per User-Agent.
 *   · Qui té manage_options (també a REST, ja autenticat) i WP-CLI (també
 *     quan fa peticions REST internes), per a poder acabar la feina.
 *   · wp-login.php no passa per template_redirect ni per l'API REST: este
 *     fitxer no el toca i no li cal cap exempció per a poder entrar.
 *   · Cap ruta REST per defecte, tampoc tot /wp-json/. Un webhook que no
 *     reintenta s'obri, un per un, amb un prefix exacte a wp-config.php:
 *      define( 'SDP_MANTENIMENT_RUTES_REST', array( '/el-meu-plugin/v1/webhook' ) );
 * No purga cap memòria cau ni toca la base de dades: només respon.
 *
 * Este fitxer és un exemple per a l'amfitrió: viu a wordpress-plugin/eines/ i
 * no viatja al ZIP del connector (llista blanca ADAPTADOR d'eines/empaqueta.mjs),
 * perquè el connector no altera mai el comportament HTTP de l'amfitrió.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Calcula quants segons falten perquè acabe la finestra de manteniment activa.
 *
 * @return int Segons restants (> 0 si el mode manteniment està actiu; 0 altrament).
 */
function socdepoble_enxufe_manteniment_503_segons_restants() {
	if ( ! defined( 'SDP_MODE_MANTENIMENT_FINS' ) ) {
		return 0;
	}
	$restants = socdepoble_enxufe_manteniment_503_fins( constant( 'SDP_MODE_MANTENIMENT_FINS' ) ) - time();
	return $restants > 0 ? $restants : 0;
}

/**
 * L'instant absolut de fi de la finestra (timestamp Unix), o 0 si el valor no
 * n'és cap. Admet un enter, una cadena de xifres o una data ISO 8601 amb zona
 * (AAAA-MM-DDThh:mm[:ss] i Z o ±hh:mm) que existisca al calendari. strtotime()
 * només rep una cadena ja validada com a instant absolut: amb qualsevol altra,
 * «tomorrow 04:00» o «+2 hours» donarien un instant nou a cada petició i la
 * finestra no es tancaria mai.
 *
 * @param mixed $valor Valor de SDP_MODE_MANTENIMENT_FINS.
 * @return int
 */
function socdepoble_enxufe_manteniment_503_fins( $valor ) {
	if ( is_int( $valor ) ) {
		return $valor > 0 ? $valor : 0;
	}
	if ( ! is_string( $valor ) ) {
		return 0;
	}
	$net = trim( $valor );
	if ( 1 === preg_match( '/^\d{1,12}$/D', $net ) ) {
		return intval( $net );
	}
	if ( 1 !== preg_match( '/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:Z|[+-](\d{2}):(\d{2}))$/D', $net, $parts ) ) {
		return 0;
	}
	// Rangs: 00-23 h, 00-59 min i s, zona fins a ±14:59.
	$maxims = array( 2 => 23, 3 => 59, 4 => 59, 5 => 14, 6 => 59 );
	foreach ( $maxims as $grup => $maxim ) {
		if ( isset( $parts[ $grup ] ) && intval( $parts[ $grup ] ) > $maxim ) {
			return 0;
		}
	}
	// Un dia que existix: strtotime() passaria el 30 de febrer al març.
	$dia = strtotime( $parts[1] . 'T00:00:00Z' );
	if ( false === $dia || gmdate( 'Y-m-d', $dia ) !== $parts[1] ) {
		return 0;
	}
	$fins = strtotime( $net );
	return false !== $fins && $fins > 0 ? $fins : 0;
}

/**
 * Segons de Retry-After: enter entre 60 i 86400.
 *
 * @param int $restants Segons que queden de finestra.
 * @return int
 */
function socdepoble_enxufe_manteniment_503_retry_after( $restants ) {
	return max( 60, min( 86400, intval( $restants ) ) );
}

/**
 * Capçaleres de la resposta 503, sense les de no-cache del nucli.
 *
 * @param int $retry_after Segons de Retry-After.
 * @return array<string, string>
 */
function socdepoble_enxufe_manteniment_503_capcaleres( $retry_after ) {
	return array(
		'Retry-After'  => (string) socdepoble_enxufe_manteniment_503_retry_after( $retry_after ),
		'Content-Type' => 'text/html; charset=utf-8',
	);
}

/**
 * Cert si s'executa dins de WP-CLI.
 *
 * @return bool
 */
function socdepoble_enxufe_manteniment_503_es_wp_cli() {
	return defined( 'WP_CLI' ) && (bool) constant( 'WP_CLI' );
}

/**
 * Cert si la petició pública actual queda fora del 503: el /robots.txt que
 * encamina el nucli (is_robots()), WP-CLI o qui té manage_options. Cap
 * exempció per camí: REQUEST_URI no es llig.
 *
 * @return bool
 */
function socdepoble_enxufe_manteniment_503_peticio_exempta() {
	if ( function_exists( 'is_robots' ) && is_robots() ) {
		return true;
	}
	if ( socdepoble_enxufe_manteniment_503_es_wp_cli() ) {
		return true;
	}
	return current_user_can( 'manage_options' );
}

/**
 * Cert si una ruta REST (WP_REST_Request::get_route(), p. ex. «/wp/v2/posts»)
 * és a la llista explícita SDP_MANTENIMENT_RUTES_REST: el prefix exacte o una
 * subruta seua. Un prefix buit o «/» no obri res: mai tot /wp-json/.
 *
 * @param string $ruta Ruta REST.
 * @return bool
 */
function socdepoble_enxufe_manteniment_503_ruta_rest_exempta( $ruta ) {
	if ( ! is_string( $ruta ) || '' === $ruta || ! defined( 'SDP_MANTENIMENT_RUTES_REST' ) ) {
		return false;
	}
	$rutes = constant( 'SDP_MANTENIMENT_RUTES_REST' );
	if ( ! is_array( $rutes ) ) {
		return false;
	}
	foreach ( $rutes as $prefix ) {
		if ( ! is_string( $prefix ) ) {
			continue;
		}
		$prefix = '/' . trim( $prefix, '/' );
		if ( '/' === $prefix ) {
			continue;
		}
		if ( $ruta === $prefix || 0 === strpos( $ruta, $prefix . '/' ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Construeix el document HTML estètic i accessible de manteniment 503.
 *
 * @param int $retry_after Segons estimats per a tornar-ho a provar.
 * @return string
 */
function socdepoble_enxufe_manteniment_503_html( $retry_after ) {
	$minuts   = max( 1, intval( ( $retry_after + 59 ) / 60 ) );
	$titol    = esc_html__( 'Scheduled maintenance in progress', 'socdepoble' );
	$cos      = esc_html__( 'We are performing a brief technical update on the community portal. No external trackers or assets are loaded on this page.', 'socdepoble' );
	$tornada  = sprintf(
		/* translators: %d: estimated minutes remaining */
		esc_html__( 'Estimated time to reopen: %d min.', 'socdepoble' ),
		$minuts
	);

	return "<!doctype html>\n"
		. '<html lang="ca"><head><meta charset="utf-8">'
		. '<meta name="viewport" content="width=device-width,initial-scale=1">'
		. '<meta name="robots" content="noindex,noarchive">'
		. '<title>' . $titol . ' · Sóc de Poble</title>'
		. '<style>body{margin:0;padding:2rem;font-family:system-ui,-apple-system,sans-serif;background:#FAF8F5;color:#1C1917;display:flex;min-height:100vh;align-items:center;justify-content:center}'
		. 'main{max-width:34rem;border:2px solid #292524;padding:2rem;background:#FFF}'
		. 'h1{margin:0 0 .75rem;font-size:1.5rem;line-height:1.25}'
		. 'p{margin:.5rem 0;line-height:1.6}'
		. '.hora{font-weight:700;color:#9A3412}</style></head>'
		. '<body><main role="main"><h1>' . $titol . '</h1>'
		. '<p>' . $cos . '</p>'
		. '<p class="hora">' . $tornada . '</p>'
		. "</main></body></html>\n";
}

/**
 * Intercepta les peticions públiques durant la finestra de manteniment amb 503.
 * Fora de la finestra no fa res més que mirar l'hora.
 */
function socdepoble_enxufe_manteniment_503_resposta() {
	$restants = socdepoble_enxufe_manteniment_503_segons_restants();
	if ( $restants <= 0 || socdepoble_enxufe_manteniment_503_peticio_exempta() ) {
		return;
	}

	$retry_after = socdepoble_enxufe_manteniment_503_retry_after( $restants );
	status_header( 503 );
	nocache_headers();
	if ( ! headers_sent() ) {
		$capcaleres = socdepoble_enxufe_manteniment_503_capcaleres( $retry_after );
		header( 'Retry-After: ' . $capcaleres['Retry-After'] );
		header( 'Content-Type: ' . $capcaleres['Content-Type'] );
	}
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escapada peça per peça a socdepoble_enxufe_manteniment_503_html().
	echo socdepoble_enxufe_manteniment_503_html( $retry_after );
	exit;
}
add_action( 'template_redirect', 'socdepoble_enxufe_manteniment_503_resposta', 0 );

/**
 * L'API REST durant la finestra: 503 amb Retry-After, llevat de WP-CLI (les
 * peticions internes de rest_do_request en una ordre o una migració), de qui
 * té manage_options i de les rutes de SDP_MANTENIMENT_RUTES_REST. La resta de
 * resultats (null o el d'un altre filtre) passen intactes.
 *
 * @param mixed  $resultat Resultat previ del filtre rest_pre_dispatch.
 * @param mixed  $servidor Servidor REST.
 * @param object $peticio  WP_REST_Request.
 * @return mixed
 */
function socdepoble_enxufe_manteniment_503_rest( $resultat, $servidor, $peticio ) {
	if ( null !== $resultat ) {
		return $resultat;
	}
	$restants = socdepoble_enxufe_manteniment_503_segons_restants();
	if ( $restants <= 0 || socdepoble_enxufe_manteniment_503_es_wp_cli() || current_user_can( 'manage_options' ) ) {
		return $resultat;
	}
	$ruta = is_object( $peticio ) && method_exists( $peticio, 'get_route' ) ? $peticio->get_route() : '';
	if ( socdepoble_enxufe_manteniment_503_ruta_rest_exempta( $ruta ) ) {
		return $resultat;
	}

	$retry_after = socdepoble_enxufe_manteniment_503_retry_after( $restants );
	return new WP_REST_Response(
		array(
			'code'    => 'sdp_manteniment',
			'message' => __( 'Scheduled maintenance in progress', 'socdepoble' ),
			'data'    => array( 'status' => 503 ),
		),
		503,
		array_merge(
			// Last-Modified ve a false (el nucli el lleva amb header_remove): fora del mapa.
			array_filter( wp_get_nocache_headers(), 'is_string' ),
			array( 'Retry-After' => (string) $retry_after )
		)
	);
}
add_filter( 'rest_pre_dispatch', 'socdepoble_enxufe_manteniment_503_rest', 0, 3 );
