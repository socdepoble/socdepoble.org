<?php
/**
 * Proves de Salut del lloc (Eines → Salut del lloc).
 *
 * Diuen en veu alta el que trencaria l'App a qualsevol amfitrió: un paquet
 * sense bundle, sense manifest o segellat contra un backend de
 * desenvolupament. Sollutia rebria exactament el mateix paquet.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registra les proves directes.
 *
 * @param array $proves Proves de Salut del lloc.
 * @return array
 */
function socdepoble_enxufe_proves_salut( $proves ) {
	$proves['direct']['socdepoble_enxufe_paquet'] = array(
		'label' => __( 'Sóc de Poble package', 'socdepoble' ),
		'test'  => 'socdepoble_enxufe_prova_paquet',
	);
	if ( function_exists( 'socdepoble_enxufe_prova_canal' ) ) {
		$proves['direct']['socdepoble_enxufe_canal'] = array(
			'label' => __( 'Sóc de Poble update channel', 'socdepoble' ),
			'test'  => 'socdepoble_enxufe_prova_canal',
		);
	}
	// v1.2.18 · Gauntlet R2 (L3R2-01) · Mana la presència, mai la versió: l'API de la beta 7.2 es
	// va retirar abans de RC1 (r65538), i un 7.2 sense wp_get_secret no rep cap prova de secrets.
	if ( function_exists( 'wp_get_secret' ) || defined( 'WP_SECRETS_KEY' ) ) {
		$proves['direct']['socdepoble_enxufe_secrets'] = array(
			'label' => __( 'Sóc de Poble encrypted secrets (WP 7.2+)', 'socdepoble' ),
			'test'  => 'socdepoble_enxufe_prova_secrets_wp72',
		);
	}
	return $proves;
}
add_filter( 'site_status_tests', 'socdepoble_enxufe_proves_salut' );

/**
 * Resultat de Salut amb la forma que espera WordPress.
 *
 * @param string $prova       Id de la prova.
 * @param string $estat       good, recommended o critical.
 * @param string $etiqueta    Titular (text pla).
 * @param string $descripcio  Explicació (text pla).
 * @return array
 */
function socdepoble_enxufe_resultat_salut( $prova, $estat, $etiqueta, $descripcio ) {
	return array(
		'label'       => $etiqueta,
		'status'      => $estat,
		'badge'       => array(
			'label' => __( 'Sóc de Poble', 'socdepoble' ),
			'color' => 'good' === $estat ? 'blue' : ( 'critical' === $estat ? 'red' : 'orange' ),
		),
		'description' => '<p>' . esc_html( $descripcio ) . '</p>',
		'actions'     => sprintf(
			'<p><a href="%1$s">%2$s</a></p>',
			esc_url( admin_url( 'options-general.php?page=' . SOCDEPOBLE_ENXUFE_SLUG ) ),
			esc_html__( 'Open Settings → Sóc de Poble', 'socdepoble' )
		),
		'test'        => $prova,
	);
}

/**
 * Relleu 261007 (decisió 5 del Mestre) · Cert si el paquet trossejat és
 * sencer al disc: dist/sdp-inventari.json és el que signa el manifest
 * (sha256) i cada mòdul de dist/trossos/ que nomena hi és. Un desplegament
 * parcial (un FTP interromput, una còpia de dist/ a mitges) conserva el
 * carregador i el mòdul d'entrada, i socdepoble_enxufe_te_bundle() el dona
 * per bo; les rutes d'un tros absent fallen en entrar-hi (LazyRouteError).
 * Amb l'IIFE, un sol fitxer garantia que el paquet era sencer.
 *
 * Només ací, a la Salut del lloc, i no a cada pàgina: llig l'inventari i fa
 * un file_exists per tros (uns 260). Sense formatDelPaquet (monolític o
 * manifest d'abans) no hi ha res a comprovar. Amb ell, un inventari absent,
 * il·legible o que no és el del manifest també és un paquet a mitges.
 *
 * @return bool
 */
function socdepoble_enxufe_trossos_sencers() {
	$manifest = socdepoble_enxufe_manifest_local();
	if ( ! isset( $manifest['formatDelPaquet'] ) ) {
		return true;
	}
	$dist      = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . dirname( SOCDEPOBLE_ENXUFE_BUNDLE ) . '/';
	$inventari = $dist . 'sdp-inventari.json';
	if ( ! isset( $manifest['inventari']['sha256'] ) || ! is_readable( $inventari ) ) {
		return false;
	}
	$empremta = hash_file( 'sha256', $inventari );
	if ( ! is_string( $empremta ) || ! hash_equals( $manifest['inventari']['sha256'], $empremta ) ) {
		return false;
	}
	$text  = file_get_contents( $inventari );
	$dades = false === $text ? null : json_decode( $text, true );
	if ( ! is_array( $dades ) || ! is_array( $dades['fitxers'] ?? null ) ) {
		return false;
	}
	foreach ( $dades['fitxers'] as $fitxer ) {
		$cami = is_array( $fitxer ) ? ( $fitxer['cami'] ?? null ) : null;
		// Només mòduls de trossos/, casats sencers: cap camí que puge de carpeta.
		if ( is_string( $cami ) && preg_match( '#^trossos/[A-Za-z0-9_-]+\.js$#D', $cami ) && ! file_exists( $dist . $cami ) ) {
			return false;
		}
	}
	return true;
}

/**
 * El paquet: bundle, manifest i node segellat. «Sense bundle» també compta el
 * paquet trossejat sense el seu mòdul d'entrada (socdepoble_enxufe_te_bundle,
 * decisió 5 del Mestre, 261007) i, relleu 261007, sense algun dels seus
 * trossos (socdepoble_enxufe_trossos_sencers). Fins que el Mestre en fixe un
 * text propi (amb traducció), ho diu la mateixa entrada crítica.
 *
 * @return array
 */
function socdepoble_enxufe_prova_paquet() {
	$prova = 'socdepoble_enxufe_paquet';
	if ( ! socdepoble_enxufe_te_bundle() || ! socdepoble_enxufe_trossos_sencers() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'critical',
			__( 'The Sóc de Poble bundle is missing', 'socdepoble' ),
			__( 'dist/soc-de-poble.standalone.js is not in the plugin folder, so pages with the shortcode or the block show nothing to visitors.', 'socdepoble' )
		);
	}
	if ( null === socdepoble_enxufe_manifest_local() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'The Sóc de Poble package has no valid manifest', 'socdepoble' ),
			__( 'Without dist/sdp-release.json the app still loads, but nobody can tell which data node it uses, and the script loads without integrity.', 'socdepoble' )
		);
	}
	if ( socdepoble_enxufe_node_inadequat() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'critical',
			__( 'The Sóc de Poble package points to a development backend', 'socdepoble' ),
			__( 'It was built against a local backend, without https or in seed mode. Visitors will see the app without data, and any other host would too. Rebuild it as a release with production values.', 'socdepoble' )
		);
	}
	return socdepoble_enxufe_resultat_salut(
		$prova,
		'good',
		__( 'The Sóc de Poble package is ready', 'socdepoble' ),
		__( 'The bundle, its manifest and its sealed data node are consistent with this site.', 'socdepoble' )
	);
}

/**
 * Avís didàctic per a WordPress 7.2+ sobre WP_SECRETS_KEY i la no-rotació amb
 * SALTs, amb l'estat real (IDEA-264). Només diu l'estat: mai el valor, el nom
 * del proveïdor de secrets ni el missatge cru d'un WP_Error. No reescriu cap
 * secret ni genera cap clau: un secret il·legible es recupera restaurant la
 * WP_SECRETS_KEY d'abans, no desant-ne un altre damunt.
 *
 * Cada causa té el seu text: sense la Secrets API al nucli, siga quina siga
 * la versió, la constant no té cap ús; una WP_SECRETS_KEY definida que l'API no
 * pot fer servir; un secret que no es pot desxifrar; un secret llegible amb
 * un valor invàlid (la clau no n'és la causa); l'API desactivada, dient el
 * motor que de veres tradueix; i l'API disponible amb la constant o amb el
 * keyring de l'amfitrió.
 *
 * @return array
 */
function socdepoble_enxufe_prova_secrets_wp72() {
	$prova = 'socdepoble_enxufe_secrets';
	// v1.2.18 · Gauntlet R2 (L3R2-01) · Ni «arriben amb WordPress 7.2» ni «encara»: el text no lliga l'API a cap versió.
	if ( ! function_exists( 'wp_get_secret' ) ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'good',
			__( 'This WordPress does not have the secrets API', 'socdepoble' ),
			__( 'Sóc de Poble reads its optional keys from wp-config.php constants or environment variables and never stores them in plain text in the database.', 'socdepoble' )
		);
	}
	$disponible = socdepoble_enxufe_secrets_wp72_disponible();
	if ( ! $disponible && socdepoble_enxufe_secrets_wp72_clau_activa() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'WP_SECRETS_KEY is defined but the WordPress secrets API cannot use it', 'socdepoble' ),
			__( 'Optional Sóc de Poble keys stored as encrypted secrets stay unused, and translation falls back to free Apertium where it is supported. Restore the WP_SECRETS_KEY that was in use before; do not generate a new one over secrets that cannot be read.', 'socdepoble' )
		);
	}
	foreach ( socdepoble_enxufe_secrets_wp72_claus() as $parell ) {
		$estat = socdepoble_enxufe_estat_secret( $parell[0], $parell[1] );
		if ( 'secrets_api' !== $estat['origen'] ) {
			continue;
		}
		if ( 'error' === $estat['estat'] ) {
			return socdepoble_enxufe_resultat_salut(
				$prova,
				'recommended',
				__( 'A stored Sóc de Poble secret cannot be read', 'socdepoble' ),
				__( 'An optional Sóc de Poble key is stored with the WordPress secrets API but cannot be decrypted right now. Translation falls back to free Apertium where it is supported. Restore the WP_SECRETS_KEY that encrypted it and do not save a new key over the existing one.', 'socdepoble' )
			);
		}
		if ( 'invalida' === $estat['estat'] ) {
			return socdepoble_enxufe_resultat_salut(
				$prova,
				'recommended',
				__( 'A stored Sóc de Poble secret has an unusable value', 'socdepoble' ),
				__( 'An optional Sóc de Poble key stored with the WordPress secrets API is empty or contains a line break, so it is ignored. Save it again as a single line. WP_SECRETS_KEY is not the cause.', 'socdepoble' )
			);
		}
	}
	if ( ! $disponible ) {
		if ( 'apertium' !== socdepoble_enxufe_traduccio_proveidor_actiu() ) {
			return socdepoble_enxufe_resultat_salut(
				$prova,
				'good',
				__( 'Sóc de Poble reads its optional keys from wp-config.php or the environment', 'socdepoble' ),
				__( 'WP_SECRETS_KEY is not defined in wp-config.php, so encrypted secrets are disabled. The optional keys in use come from wp-config.php constants or environment variables, never from plain-text options in the database.', 'socdepoble' )
			);
		}
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'good',
			__( 'Sóc de Poble uses free Apertium translation without stored secrets', 'socdepoble' ),
			__( 'WP_SECRETS_KEY is not defined in wp-config.php, so optional encrypted keys are disabled and translation runs safely on free Apertium without saving plain-text keys in the database.', 'socdepoble' )
		);
	}
	if ( ! socdepoble_enxufe_secrets_wp72_clau_activa() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'good',
			__( 'WordPress 7.2 encrypted secrets are active for Sóc de Poble', 'socdepoble' ),
			__( 'The WordPress secrets API is available through the secrets provider set up by the host, without WP_SECRETS_KEY in wp-config.php. The host keeps the encryption key: ask how it is backed up, and never replace it over secrets that cannot be read.', 'socdepoble' )
		);
	}
	return socdepoble_enxufe_resultat_salut(
		$prova,
		'good',
		__( 'WordPress 7.2 encrypted secrets are active for Sóc de Poble', 'socdepoble' ),
		__( 'WP_SECRETS_KEY is active in wp-config.php. Back up this key separately and never rotate WP_SECRETS_KEY when rotating session SALTs, or stored encrypted secrets will become unreadable and fall back to Apertium.', 'socdepoble' )
	);
}
