<?php
/**
 * Executa el uninstall.php real d'una o de dues carpetes en la mateixa
 * petició, com delete_plugins() quan s'esborren dues còpies alhora. Sense BD:
 * les opcions, els llocs de la xarxa i $wpdb són doubles que anoten què
 * s'esborraria. $cas: plugin (WP_UNINSTALL_PLUGIN), multisite, actius (per
 * lloc) i xarxa (active_sitewide_plugins).
 */

error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) {
	throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
} );

define( 'ABSPATH', __DIR__ . '/' );
$cas = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
define( 'WP_UNINSTALL_PLUGIN', $cas['plugin'] );
$lloc      = 1;
$pila      = array();
$esborrats = array();

function is_multisite() { return ! empty( $GLOBALS['cas']['multisite'] ); }
function get_option( $nom, $defecte = false ) {
	return 'active_plugins' === $nom ? ( $GLOBALS['cas']['actius'][ $GLOBALS['lloc'] ] ?? array() ) : $defecte;
}
function get_site_option( $nom, $defecte = false ) {
	return 'active_sitewide_plugins' === $nom ? ( $GLOBALS['cas']['xarxa'] ?? array() ) : $defecte;
}
function get_sites( $args ) { return array_keys( $GLOBALS['cas']['actius'] ?? array( 1 => array() ) ); }
function switch_to_blog( $id ) {
	$GLOBALS['pila'][] = $GLOBALS['lloc'];
	$GLOBALS['lloc']   = $id;
}
function restore_current_blog() { $GLOBALS['lloc'] = array_pop( $GLOBALS['pila'] ); }
function get_blog_option( $id, $nom, $defecte = false ) {
	switch_to_blog( $id );
	$valor = get_option( $nom, $defecte );
	restore_current_blog();
	return $valor;
}
function delete_option( $nom ) {
	$GLOBALS['esborrats'][] = $GLOBALS['lloc'] . ':' . $nom;
	return true;
}
function delete_site_option( $nom ) {
	$GLOBALS['esborrats'][] = 'xarxa:' . $nom;
	return true;
}

final class FixtureWpdb {
	public $options = 'wp_options';
	public function esc_like( $text ) { return addcslashes( $text, '_%\\' ); }
	public function prepare( $sql, ...$valors ) { return vsprintf( str_replace( '%s', "'%s'", $sql ), $valors ); }
	public function query( $sql ) {
		$GLOBALS['esborrats'][] = $GLOBALS['lloc'] . ':SQL';
		return 0;
	}
}
$wpdb = new FixtureWpdb();

foreach ( array_slice( $argv, 1 ) as $carpeta ) {
	require $carpeta . '/uninstall.php';
}
echo json_encode( array( 'esborrats' => $esborrats ), JSON_THROW_ON_ERROR );
