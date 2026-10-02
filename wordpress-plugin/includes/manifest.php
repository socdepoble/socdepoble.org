<?php
/**
 * Identitat del paquet: dist/sdp-release.json (esquema sdp.release.v1).
 *
 * El build l'escriu al costat del bundle (vite.standalone.config.js) i és el
 * MATEIX fitxer que llegirà Sollutia per a fixar versió i integrity. Ací només
 * es llig i es valida: ni el plugin ni l'amfitrió no n'escriuen res. Si falta o
 * no és vàlid, el plugin funciona igual, sense integrity i amb la data del
 * bundle com a versió de memòria cau.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Manifest local validat, o null si no n'hi ha cap de vàlid.
 *
 * Només torna les claus que el plugin usa, ja validades: versio, entrada
 * (sha256, integrity, mida), node (origen, mode, tenant, desenvolupament),
 * contracte (marcatge) i, si el paquet porta la font, fonts (integrity).
 *
 * @return array|null
 */
function socdepoble_enxufe_manifest_local() {
	static $carregat = false;
	static $manifest = null;
	if ( $carregat ) {
		return $manifest;
	}
	$carregat = true;

	$fitxer = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . SOCDEPOBLE_ENXUFE_MANIFEST;
	if ( ! is_readable( $fitxer ) ) {
		return null;
	}
	/* Lectura i json_decode directes: el descodificador de fitxers JSON de
	   WordPress llança un avís a cada petició amb un JSON trencat, i un
	   manifest invàlid ha de passar en silenci. */
	$text     = file_get_contents( $fitxer );
	$manifest = socdepoble_enxufe_valida_manifest( false === $text ? null : json_decode( $text, true ) );
	return $manifest;
}

/**
 * Valida un manifest sdp.release.v1 descodificat i en torna la part que usa
 * el plugin. Tot el que no quadra amb l'esquema el descarta sencer.
 *
 * @param mixed $dades Manifest descodificat com a array associatiu.
 * @return array|null
 */
function socdepoble_enxufe_valida_manifest( $dades ) {
	if ( ! is_array( $dades ) || 'sdp.release.v1' !== ( $dades['schema'] ?? null ) || 'soc-de-poble' !== ( $dades['producte'] ?? null ) ) {
		return null;
	}
	$versio  = $dades['versio'] ?? null;
	$entrada = $dades['entrada'] ?? null;
	$node    = $dades['node'] ?? null;
	if ( ! is_string( $versio ) || ! preg_match( '/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/', $versio ) ) {
		return null;
	}
	if ( ! is_array( $entrada ) || 'soc-de-poble.standalone.js' !== ( $entrada['cami'] ?? null ) ) {
		return null;
	}
	$sha256    = $entrada['sha256'] ?? null;
	$integrity = $entrada['integrity'] ?? null;
	if ( ! is_string( $sha256 ) || ! preg_match( '/^[0-9a-f]{64}$/', $sha256 ) ) {
		return null;
	}
	if ( ! is_string( $integrity ) || ! preg_match( '#^sha384-[A-Za-z0-9+/]{64}$#', $integrity ) ) {
		return null;
	}
	if ( ! is_array( $node ) ) {
		return null;
	}
	$origen = $node['origen'] ?? null;
	$mode   = $node['mode'] ?? null;
	$tenant = $node['tenant'] ?? null;

	// Els manifests anteriors al doble build eren sempre autònoms.
	$runtime = $dades['runtime'] ?? array( 'amfitrio' => 'autonom', 'dependencies' => array() );
	if ( ! is_array( $runtime ) ) {
		return null;
	}
	$amfitrio = $runtime['amfitrio'] ?? null;
	$deps = $runtime['dependencies'] ?? null;
	if ( 'wordpress' === $amfitrio ) {
		if ( array( 'react', 'react-dom', 'react-jsx-runtime' ) !== $deps || '6.6' !== ( $runtime['wordpressMinim'] ?? null ) ) {
			return null;
		}
	} elseif ( 'autonom' !== $amfitrio || array() !== $deps ) {
		return null;
	}

	$net = array(
		'runtime' => array( 'amfitrio' => $amfitrio ),
		'versio'  => $versio,
		'entrada' => array(
			'sha256'    => $sha256,
			'integrity' => $integrity,
			'mida'      => isset( $entrada['mida'] ) && is_int( $entrada['mida'] ) ? $entrada['mida'] : 0,
		),
		'node'    => array(
			'origen'          => is_string( $origen ) ? esc_url_raw( $origen, array( 'http', 'https' ) ) : '',
			'mode'            => in_array( $mode, array( 'remote', 'seed', 'local' ), true ) ? $mode : 'remote',
			'tenant'          => is_string( $tenant ) && preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $tenant ) ? $tenant : '',
			// Si el manifest no ho diu, el paquet es tracta com de desenvolupament.
			'desenvolupament' => ! isset( $node['desenvolupament'] ) || false !== $node['desenvolupament'],
		),
		'marcatge' => is_string( $dades['contracte']['marcatge'] ?? null ) ? sanitize_text_field( $dades['contracte']['marcatge'] ) : '',
	);

	$fonts = $dades['fonts']['integrity'] ?? null;
	if ( is_string( $fonts ) && preg_match( '#^sha384-[A-Za-z0-9+/]{64}$#', $fonts ) ) {
		$net['fonts'] = array( 'integrity' => $fonts );
	}
	return $net;
}

/**
 * Cert si este lloc és de desenvolupament segons WordPress
 * (WP_ENVIRONMENT_TYPE 'local' o 'development').
 *
 * @return bool
 */
function socdepoble_enxufe_lloc_de_desenvolupament() {
	return in_array( wp_get_environment_type(), array( 'local', 'development' ), true );
}

/**
 * Cert si el paquet instal·lat apunta a un node de desenvolupament (backend
 * local, sense https o en mode llavor) i este lloc NO és de desenvolupament:
 * els visitants reals veurien una app sense dades. És el mateix defecte que
 * patiria Sollutia amb eixe paquet, i per això es diu en veu alta.
 *
 * @return bool
 */
function socdepoble_enxufe_node_inadequat() {
	$manifest = socdepoble_enxufe_manifest_local();
	if ( null === $manifest || socdepoble_enxufe_lloc_de_desenvolupament() ) {
		return false;
	}
	return $manifest['node']['desenvolupament'] || 'remote' !== $manifest['node']['mode'];
}
