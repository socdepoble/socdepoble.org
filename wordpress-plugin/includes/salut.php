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
			esc_url( admin_url( 'options-general.php?page=socdepoble-enxufe' ) ),
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
