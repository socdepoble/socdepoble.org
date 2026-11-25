<?php
/** Arnés local sense WordPress, credencials ni xarxa: cada HTTP és una resposta de la cua. */
$cas = json_decode( stream_get_contents( STDIN ), true );
if ( ! is_array( $cas ) ) { throw new RuntimeException( 'case_required' ); }
define( 'ABSPATH', '/' );
define( 'SOCDEPOBLE_ENXUFE_FITXER', $argv[1] . '/wordpress-plugin/socdepoble-enxufe.php' );
define( 'SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js' );
define( 'SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble' );
$GLOBALS['cas'] = $cas;
$GLOBALS['requests'] = array();
$GLOBALS['filters'] = array();
function __( $s, $d = '' ) { return $s; }
function esc_html__( $s, $d = '' ) { return esc_html( $s ); }
function esc_html( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $s ) { return $s; }
function admin_url( $s ) { return 'https://poble.example/wp-admin/' . $s; }
function add_filter( $hook, $callback ) { $GLOBALS['filters'][] = array( $hook, $callback ); }
function current_user_can( $cap ) { return $GLOBALS['cas']['autoritzat'] ?? true; }
function site_url( $s = '' ) { return ( $GLOBALS['cas']['siteBase'] ?? 'https://poble.example' ) . $s; }
function plugins_url( $s, $f ) { return ( $GLOBALS['cas']['pluginBase'] ?? 'https://poble.example/wp-content/plugins/socdepoble/' ) . $s; }
function content_url( $s ) { return ( $GLOBALS['cas']['contentBase'] ?? 'https://poble.example/wp-content/' ) . $s; }
function wp_parse_url( $url, $part = -1 ) { return parse_url( $url, $part ); }
function socdepoble_enxufe_manifest_local() {
	return array_key_exists( 'manifest', $GLOBALS['cas'] ) ? $GLOBALS['cas']['manifest'] : array( 'formatDelPaquet' => array( 'format' => 'trossos', 'modul' => 'trossos/entrada-abc.js' ) );
}
class WP_Error {}
function is_wp_error( $r ) { return $r instanceof WP_Error; }
function wp_safe_remote_head( $url, $args ) {
	$GLOBALS['requests'][] = array( 'url' => $url, 'args' => $args );
	if ( ! count( $GLOBALS['cas']['responses'] ?? array() ) ) { throw new RuntimeException( 'unexpected_http_request' ); }
	$r = array_shift( $GLOBALS['cas']['responses'] );
	return isset( $r['error'] ) ? new WP_Error() : $r;
}
function wp_remote_retrieve_response_code( $r ) { return $r['code'] ?? 0; }
function wp_remote_retrieve_header( $r, $key ) { return $r['headers'][$key] ?? ''; }
require $argv[1] . '/wordpress-plugin/includes/salut.php';
switch ( $cas['mode'] ?? '' ) {
	case 'register': $result = socdepoble_enxufe_proves_salut( array() ); break;
	case 'module-health': $result = socdepoble_enxufe_prova_trossos_http(); break;
	case 'upgrade-health': $result = socdepoble_enxufe_prova_upgrade_http(); break;
	case 'module': $result = socdepoble_enxufe_diagnostic_http_local( 'tros' ); break;
	case 'upgrade': $result = socdepoble_enxufe_diagnostic_http_local( 'upgrade' ); break;
	default: $result = socdepoble_enxufe_diagnostic_http_local( $cas['mode'] ?? '' ); break;
}
echo json_encode( array( 'result' => $result, 'requests' => $GLOBALS['requests'], 'filters' => $GLOBALS['filters'] ), JSON_THROW_ON_ERROR );
