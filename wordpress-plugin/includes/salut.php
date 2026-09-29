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
		'label' => __( 'Sóc de Poble package', 'socdepoble-enxufe' ),
		'test'  => 'socdepoble_enxufe_prova_paquet',
	);
	if ( function_exists( 'socdepoble_enxufe_prova_canal' ) ) {
		$proves['direct']['socdepoble_enxufe_canal'] = array(
			'label' => __( 'Sóc de Poble update channel', 'socdepoble-enxufe' ),
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
			'label' => __( 'Sóc de Poble', 'socdepoble-enxufe' ),
			'color' => 'good' === $estat ? 'blue' : ( 'critical' === $estat ? 'red' : 'orange' ),
		),
		'description' => '<p>' . esc_html( $descripcio ) . '</p>',
		'actions'     => sprintf(
			'<p><a href="%1$s">%2$s</a></p>',
			esc_url( admin_url( 'options-general.php?page=socdepoble-enxufe' ) ),
			esc_html__( 'Open Settings → Sóc de Poble', 'socdepoble-enxufe' )
		),
		'test'        => $prova,
	);
}

/**
 * El paquet: bundle, manifest i node segellat.
 *
 * @return array
 */
function socdepoble_enxufe_prova_paquet() {
	$prova = 'socdepoble_enxufe_paquet';
	if ( ! socdepoble_enxufe_te_bundle() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'critical',
			__( 'The Sóc de Poble bundle is missing', 'socdepoble-enxufe' ),
			__( 'dist/soc-de-poble.standalone.js is not in the plugin folder, so pages with the shortcode or the block show nothing to visitors.', 'socdepoble-enxufe' )
		);
	}
	if ( null === socdepoble_enxufe_manifest_local() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'The Sóc de Poble package has no valid manifest', 'socdepoble-enxufe' ),
			__( 'Without dist/sdp-release.json the app still loads, but nobody can tell which data node it uses, and the script loads without integrity.', 'socdepoble-enxufe' )
		);
	}
	if ( socdepoble_enxufe_node_inadequat() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'critical',
			__( 'The Sóc de Poble package points to a development backend', 'socdepoble-enxufe' ),
			__( 'It was built against a local backend, without https or in seed mode. Visitors will see the app without data, and any other host would too. Rebuild it as a release with production values.', 'socdepoble-enxufe' )
		);
	}
	return socdepoble_enxufe_resultat_salut(
		$prova,
		'good',
		__( 'The Sóc de Poble package is ready', 'socdepoble-enxufe' ),
		__( 'The bundle, its manifest and its sealed data node are consistent with this site.', 'socdepoble-enxufe' )
	);
}
