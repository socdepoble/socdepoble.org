<?php
/**
 * Adaptador públic de traducció. La clau i el pressupost viuen al servidor.
 * El text no es registra; el transient només conserva la traducció 7 dies.
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/** Constant de wp-config.php abans que la variable d'entorn del procés PHP.
 *  Un allotjament pot posar getenv a disable_functions: en PHP 8 la funció
 *  deixa d'existir i cridar-la llança Error a cada pàgina amb l'App. */
function socdepoble_enxufe_deepl_clau() {
	if ( defined( 'DEEPL_API_KEY' ) ) {
		$clau = constant( 'DEEPL_API_KEY' );
	} else {
		$clau = function_exists( 'getenv' ) ? getenv( 'DEEPL_API_KEY' ) : false;
	}
	return is_string( $clau ) && ! preg_match( '/[\r\n]/', $clau ) ? trim( $clau ) : '';
}

function socdepoble_enxufe_traduccio_error( $codi, $estat ) {
	// Codis estables per a la UI; mai el cos ni les credencials del proveïdor.
	$missatges = array(
		'limit' => __( 'Translation limit reached. Try again later.', 'socdepoble' ),
		'sense_clau' => __( 'Translation is not configured on this server.', 'socdepoble' ),
		'ocupada' => __( 'Translation is busy. Try again shortly.', 'socdepoble' ),
		'proveidor' => __( 'The translation provider is unavailable. Try again later.', 'socdepoble' ),
	);
	$missatge = $missatges[ $codi ] ?? __( 'The translation request could not be accepted.', 'socdepoble' );
	return new WP_Error( 'sdp_traduccio_' . $codi, $missatge, array( 'status' => $estat ) );
}

function socdepoble_enxufe_traduccio_origen( $url ) {
	$parts = wp_parse_url( $url );
	if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) || isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
		return '';
	}
	$scheme = strtolower( $parts['scheme'] );
	if ( ! in_array( $scheme, array( 'https', 'http' ), true ) ) {
		return '';
	}
	return $scheme . '://' . strtolower( $parts['host'] ) . ':' . ( $parts['port'] ?? ( 'https' === $scheme ? 443 : 80 ) );
}

/** Públic per decisió del Mestre. Origen/JSON prevenen CSRF, no autentiquen. */
function socdepoble_enxufe_traduccio_permis( $request ) {
	$origen = (string) $request->get_header( 'origin' );
	if ( '' !== $origen && ! in_array( socdepoble_enxufe_traduccio_origen( $origen ), array( socdepoble_enxufe_traduccio_origen( home_url() ), socdepoble_enxufe_traduccio_origen( rest_url() ) ), true ) ) {
		return socdepoble_enxufe_traduccio_error( 'origen', 403 );
	}
	if ( 'cross-site' === $request->get_header( 'sec-fetch-site' ) ) {
		return socdepoble_enxufe_traduccio_error( 'origen', 403 );
	}
	if ( ! $request->is_json_content_type() ) {
		return socdepoble_enxufe_traduccio_error( 'json', 415 );
	}
	if ( strlen( $request->get_body() ) > 32768 ) {
		return socdepoble_enxufe_traduccio_error( 'mida', 413 );
	}
	if ( '' === socdepoble_enxufe_deepl_clau() ) {
		return socdepoble_enxufe_traduccio_error( 'sense_clau', 503 );
	}
	return true;
}

/** Els límits 0 desactiven el consum. No s'accepten valors negatius ni no enters. */
function socdepoble_enxufe_traduccio_limit( $nom, $defecte ) {
	$valor = defined( $nom ) ? constant( $nom ) : $defecte;
	return is_int( $valor ) && $valor >= 0 ? $valor : 0;
}

/** Esborra només el nostre lock: un procés antic mai lleva el del següent. */
function socdepoble_enxufe_traduccio_allibera( $valor, $nom = 'sdp_traduccio_lock' ) {
	global $wpdb;
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $nom, $valor ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- pany atòmic: només s'esborra el valor propi; la memòria cau es buida a la línia següent.
	wp_cache_delete( $nom, 'options' );
}

/** INSERT únic, sense l'upsert d'add_option ni dependència de notoptions. */
function socdepoble_enxufe_traduccio_insereix( $nom, $valor ) {
	global $wpdb;
	return $wpdb->query( $wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- INSERT IGNORE atòmic, que add_option() no garantix.
		"INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')",
		$nom, $valor
	) );
}

function socdepoble_enxufe_traduccio_bloqueja( $nom = 'sdp_traduccio_lock' ) {
	global $wpdb;
	$valor = ( time() + 120 ) . ':' . wp_generate_uuid4();
	if ( 1 === socdepoble_enxufe_traduccio_insereix( $nom, $valor ) ) {
		return $valor;
	}
	$anterior = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $nom ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- lectura fresca del pany, sense memòria cau a propòsit.
	if ( is_string( $anterior ) && (int) $anterior < time() ) {
		socdepoble_enxufe_traduccio_allibera( $anterior, $nom );
		if ( 1 === socdepoble_enxufe_traduccio_insereix( $nom, $valor ) ) {
			return $valor;
		}
	}
	return false;
}

/**
 * Reserva durable dia/mes. CAS SQL evita superar el pressupost inclús si un
 * procés suspés reprén després de caducar el lock. Mai es reembossa una crida
 * fallida: un timeout pot haver sigut facturat. Cache eviction no reinicia quota.
 */
function socdepoble_enxufe_traduccio_reserva( $caracters ) {
	global $wpdb;
	if ( false === socdepoble_enxufe_traduccio_insereix( 'sdp_traduccio_pressupost', '{}' ) ) {
		return socdepoble_enxufe_traduccio_error( 'pressupost', 503 );
	}
	$abans = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", 'sdp_traduccio_pressupost' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- lectura fresca per al CAS del pressupost.
	$estat = is_string( $abans ) ? json_decode( $abans, true ) : null;
	if ( ! is_array( $estat ) ) {
		return socdepoble_enxufe_traduccio_error( 'pressupost', 503 );
	}
	$dia = gmdate( 'Y-m-d' );
	$mes = gmdate( 'Y-m' );
	$diari = ( $estat['dia'] ?? '' ) === $dia ? (int) ( $estat['diari'] ?? 0 ) : 0;
	$mensual = ( $estat['mes'] ?? '' ) === $mes ? (int) ( $estat['mensual'] ?? 0 ) : 0;
	if ( $diari + $caracters > socdepoble_enxufe_traduccio_limit( 'SDP_TRADUCCIO_LIMIT_DIARI', 10000 ) || $mensual + $caracters > socdepoble_enxufe_traduccio_limit( 'SDP_TRADUCCIO_LIMIT_MENSUAL', 100000 ) ) {
		return socdepoble_enxufe_traduccio_error( 'limit', 429 );
	}
	$nou = wp_json_encode( array( 'dia' => $dia, 'mes' => $mes, 'diari' => $diari + $caracters, 'mensual' => $mensual + $caracters ) );
	$resultat = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND option_value = %s", $nou, 'sdp_traduccio_pressupost', $abans ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- CAS atòmic del pressupost; la memòria cau es buida a la línia següent.
	wp_cache_delete( 'sdp_traduccio_pressupost', 'options' );
	return 1 === $resultat ? true : socdepoble_enxufe_traduccio_error( 'ocupada', 503 );
}

/** Cache per text i configuració; originals i clau no apareixen al nom. */
function socdepoble_enxufe_traduccio_cache( $text, $desti, $format, $empremta ) {
	return 'sdp_tr_' . hash_hmac( 'sha256', wp_json_encode( array( 2, 'CA', $desti, $format, $text, $empremta ) ), wp_salt( 'auth' ) );
}

function socdepoble_enxufe_traduccio_lot( $textos, $destinacio, $format, $empremta ) {
	$resultats = array();
	$pendents = array();
	foreach ( $textos as $text ) {
		$id = socdepoble_enxufe_traduccio_cache( $text, $destinacio, $format, $empremta );
		$guardat = get_transient( $id );
		if ( '' === trim( $text ) ) {
			$resultats[ $id ] = $text;
		} elseif ( is_string( $guardat ) && '' !== $guardat ) {
			$resultats[ $id ] = $guardat;
		} else {
			$pendents[ $id ] = $text;
		}
	}
	return array( $resultats, $pendents );
}

function socdepoble_enxufe_traduccio_resposta( $textos, $desti, $format, $empremta, $resultats, $cache ) {
	$traduccions = array();
	foreach ( $textos as $text ) {
		$traduccions[] = $resultats[ socdepoble_enxufe_traduccio_cache( $text, $desti, $format, $empremta ) ];
	}
	return new WP_REST_Response( array( 'traduccions' => $traduccions, 'origen' => 'CA', 'desti' => $desti, 'cache' => $cache ), 200, array( 'Cache-Control' => 'no-store' ) );
}

function socdepoble_enxufe_traduir( $request ) {
	$permis = socdepoble_enxufe_traduccio_permis( $request );
	if ( is_wp_error( $permis ) ) {
		return $permis;
	}
	$dades = $request->get_json_params();
	$cru = json_decode( $request->get_body() );
	if ( is_wp_error( $dades ) || ! is_array( $dades ) || ! is_object( $cru ) || ! isset( $cru->textos ) || ! is_array( $cru->textos ) || array_diff( array_keys( $dades ), array( 'textos', 'desti', 'origen', 'format' ) ) ) {
		return socdepoble_enxufe_traduccio_error( 'invalida', 400 );
	}
	$textos = $dades['textos'];
	$desti = $dades['desti'] ?? null;
	$format = $dades['format'] ?? null;
	if ( count( $textos ) < 1 || count( $textos ) > 50 || ! in_array( $desti, array( 'ES', 'EN-GB', 'FR', 'DE' ), true ) || 'CA' !== ( $dades['origen'] ?? null ) || ! in_array( $format, array( 'text', 'html' ), true ) ) {
		return socdepoble_enxufe_traduccio_error( 'invalida', 400 );
	}
	$caracters = 0;
	$bytes = 0;
	$te_text = false;
	foreach ( $textos as $text ) {
		if ( ! is_string( $text ) || 1 !== preg_match( '//u', $text ) ) {
			return socdepoble_enxufe_traduccio_error( 'invalida', 400 );
		}
		$caracters += preg_match_all( '/./us', $text );
		$bytes += strlen( $text );
		$te_text = $te_text || '' !== trim( $text );
	}
	if ( $bytes > 20000 || $caracters > 5000 ) {
		return socdepoble_enxufe_traduccio_error( 'mida', 413 );
	}
	if ( ! $te_text ) {
		return socdepoble_enxufe_traduccio_error( 'invalida', 400 );
	}
	$clau = socdepoble_enxufe_deepl_clau();
	$empremta = hash_hmac( 'sha256', $clau, wp_salt( 'auth' ) );
	list( $resultats, $pendents ) = socdepoble_enxufe_traduccio_lot( $textos, $desti, $format, $empremta );
	if ( ! $pendents ) {
		return socdepoble_enxufe_traduccio_resposta( $textos, $desti, $format, $empremta, $resultats, true );
	}
	$pausa = 'sdp_tr_pause_' . hash_hmac( 'sha256', $clau, wp_salt( 'auth' ) );
	$estat_pausa = get_transient( $pausa );
	if ( $estat_pausa ) {
		return in_array( (int) $estat_pausa, array( 403, 502 ), true ) ? socdepoble_enxufe_traduccio_error( 'proveidor', 502 ) : socdepoble_enxufe_traduccio_error( 'limit', 429 );
	}
	$locks = array();
	$pressupost = false;
	try {
		// Pany per text: lots diferents poden traduir en paral·lel. Les parts
		// compartides no es facturen dues vegades. Mai esperem amb panys presos.
		ksort( $pendents );
		foreach ( array_keys( $pendents ) as $id ) {
			$nom = 'sdp_tr_lock_' . substr( $id, 7 );
			$valor = socdepoble_enxufe_traduccio_bloqueja( $nom );
			if ( false === $valor ) {
				return socdepoble_enxufe_traduccio_error( 'ocupada', 503 );
			}
			$locks[ $nom ] = $valor;
		}
		// Relectura després d'adquirir el lock: un altre procés pot haver traduït.
		list( $resultats, $pendents ) = socdepoble_enxufe_traduccio_lot( $textos, $desti, $format, $empremta );
		if ( ! $pendents ) {
			return socdepoble_enxufe_traduccio_resposta( $textos, $desti, $format, $empremta, $resultats, true );
		}
		$pressupost = socdepoble_enxufe_traduccio_bloqueja();
		if ( false === $pressupost ) {
			return socdepoble_enxufe_traduccio_error( 'ocupada', 503 );
		}
		// REMOTE_ADDR; no confiar en X-Forwarded-For enviat pel visitant.
		$adreca = isset( $_SERVER['REMOTE_ADDR'] ) && is_string( $_SERVER['REMOTE_ADDR'] )
			? filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ), FILTER_VALIDATE_IP ) : false;
		// Una adreça absent o invàlida compartix el límit; mai obri comptadors arbitraris.
		$client = 'sdp_tr_ip_' . hash_hmac( 'sha256', false === $adreca ? 'unknown' : $adreca, wp_salt( 'auth' ) );
		$ritme = get_transient( $client );
		if ( ! is_array( $ritme ) || ( $ritme['fins'] ?? 0 ) <= time() ) {
			$ritme = array( 'fins' => time() + 600, 'peticions' => 0 );
		}
		if ( $ritme['peticions'] >= 30 ) {
			return socdepoble_enxufe_traduccio_error( 'limit', 429 );
		}
		++$ritme['peticions'];
		if ( ! set_transient( $client, $ritme, max( 1, $ritme['fins'] - time() ) ) ) {
			return socdepoble_enxufe_traduccio_error( 'pressupost', 503 );
		}
		$facturables = 0;
		foreach ( $pendents as $text ) {
			$facturables += preg_match_all( '/./us', $text );
		}
		$reserva = socdepoble_enxufe_traduccio_reserva( $facturables );
		socdepoble_enxufe_traduccio_allibera( $pressupost );
		$pressupost = false;
		if ( is_wp_error( $reserva ) ) {
			return $reserva;
		}
		$url = substr( $clau, -3 ) === ':fx' ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
		$cos = array( 'text' => array_values( $pendents ), 'source_lang' => 'CA', 'target_lang' => $desti, 'preserve_formatting' => true );
		if ( 'html' === $format ) {
			$cos['tag_handling'] = 'html';
		}
		$resposta = wp_remote_post( $url, array(
			'timeout' => 15,
			'redirection' => 0,
			'limit_response_size' => 131072,
			'user-agent' => 'SocDePoble-Translation/1.0',
			'headers' => array( 'Authorization' => 'DeepL-Auth-Key ' . $clau, 'Content-Type' => 'application/json' ),
			'body' => wp_json_encode( $cos ),
		) );
		if ( is_wp_error( $resposta ) ) {
			set_transient( $pausa, 502, 60 );
			return socdepoble_enxufe_traduccio_error( 'proveidor', 502 );
		}
		$status = wp_remote_retrieve_response_code( $resposta );
		if ( 403 === $status || 429 === $status || 456 === $status ) {
			set_transient( $pausa, $status, 60 );
			if ( 403 === $status ) {
				return socdepoble_enxufe_traduccio_error( 'proveidor', 502 );
			}
			return socdepoble_enxufe_traduccio_error( 'limit', 429 );
		}
		if ( 200 !== $status ) {
			return socdepoble_enxufe_traduccio_error( 'proveidor', 502 );
		}
		$cos = json_decode( wp_remote_retrieve_body( $resposta ), true );
		$traduccions = is_array( $cos ) ? ( $cos['translations'] ?? null ) : null;
		if ( ! is_array( $traduccions ) || count( $traduccions ) !== count( $pendents ) || array_keys( $traduccions ) !== range( 0, count( $pendents ) - 1 ) ) {
			return socdepoble_enxufe_traduccio_error( 'proveidor', 502 );
		}
		foreach ( $traduccions as $traduccio ) {
			if ( ! is_array( $traduccio ) || ! isset( $traduccio['text'] ) || ! is_string( $traduccio['text'] ) || '' === $traduccio['text'] ) {
				return socdepoble_enxufe_traduccio_error( 'proveidor', 502 );
			}
		}
		foreach ( array_keys( $pendents ) as $i => $id ) {
			$resultats[ $id ] = $traduccions[ $i ]['text'];
			set_transient( $id, $resultats[ $id ], 7 * DAY_IN_SECONDS );
		}
		return socdepoble_enxufe_traduccio_resposta( $textos, $desti, $format, $empremta, $resultats, false );
	} finally {
		if ( false !== $pressupost ) {
			socdepoble_enxufe_traduccio_allibera( $pressupost );
		}
		foreach ( $locks as $nom => $valor ) {
			socdepoble_enxufe_traduccio_allibera( $valor, $nom );
		}
	}
}

function socdepoble_enxufe_registra_traduccio() {
	register_rest_route( 'socdepoble/v1', '/traduir', array(
		'methods' => 'POST',
		'callback' => 'socdepoble_enxufe_traduir',
		'permission_callback' => 'socdepoble_enxufe_traduccio_permis',
	) );

}
add_action( 'rest_api_init', 'socdepoble_enxufe_registra_traduccio' );
