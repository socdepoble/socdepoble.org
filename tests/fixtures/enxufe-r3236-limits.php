<?php
/* Proves locals: les funcions de producció es carreguen intactes. El wrapper
 * només representa un fitxer local canviant entre stat/open; no fa xarxa. */
define( 'ABSPATH', __DIR__ );
define( 'SOCDEPOBLE_ENXUFE_FITXER', 'plugin.php' );
define( 'SOCDEPOBLE_ENXUFE_MANIFEST', 'dist/sdp-release.json' );
define( 'SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js' );
define( 'SOCDEPOBLE_ENXUFE_SEO_RUTES', 'dist/seo-routes.json' );
$root = $argv[1];
$cas = json_decode( stream_get_contents( STDIN ), true );
$stats = array( 'opens' => 0, 'bytes' => 0, 'unslash' => 0, 'filters' => array(), 'warnings' => array() );
set_error_handler( function ( $severity, $message ) use ( &$stats ) { $stats['warnings'][] = $message; return true; } );
class FitxerR3236 {
	public $context;
	private $text = '';
	private $pos = 0;
	public function stream_open( $path, $mode, $options, &$opened_path ) {
		global $cas, $stats;
		if ( ! empty( $cas['open_fails'] ) ) { return false; }
		$index = $stats['opens']++;
		$this->text = $cas['contents'][ min( $index, count( $cas['contents'] ) - 1 ) ];
		return true;
	}
	public function stream_read( $count ) {
		global $stats, $cas;
		if ( ! empty( $cas['read_fails'] ) ) { return false; }
		// Un stream pot tornar lectures parcials sense que siga EOF.
		$count = min( $count, $cas['read_chunk'] ?? $count );
		$text = substr( $this->text, $this->pos, $count );
		$this->pos += strlen( $text ); $stats['bytes'] += strlen( $text );
		return $text;
	}
	public function stream_eof() { return $this->pos >= strlen( $this->text ); }
	public function stream_stat() { return $this->url_stat( '', 0 ); }
	public function url_stat( $path, $flags ) {
		global $cas;
		if ( ! empty( $cas['missing'] ) || ( false !== strpos( $path, '/trossos/' ) && empty( $cas['module_exists'] ) ) ) { return false; }
		return array( 'mode' => 0100444, 'size' => $cas['stat_size'] ?? strlen( $cas['contents'][0] ), 'mtime' => 1 );
	}
}
stream_wrapper_register( 'r3236', FitxerR3236::class );
function plugin_dir_path( $file ) { return 'r3236://plugin/'; }
function plugin_basename( $file ) { return 'socdepoble-enxufe.php'; }
function get_bloginfo( $key ) { global $cas; return $cas['site_name'] ?? 'Poble'; }
function add_action( ...$args ) {}
function add_filter( ...$args ) { global $stats; $stats['filters'][] = $args[0]; }
function apply_filters( $name, $default ) { return 'socdepoble_enxufe_seo' === $name ? true : ( 'socdepoble_enxufe_ruta_a_url' === $name ? 'parametre' : $default ); }
function wp_unslash( $text ) { global $stats; ++$stats['unslash']; return stripslashes( $text ); }
function esc_url_raw( $text, $protocols = array() ) { return preg_match( '#^https?://#', $text ) ? $text : ''; }
function sanitize_text_field( $text ) { return strip_tags( $text ); }
function wp_strip_all_tags( $text ) { return strip_tags( $text ); }
function esc_html( $text ) { return htmlspecialchars( $text, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $text ) { return esc_html( $text ); }
function esc_url( $text ) { return esc_html( $text ); }
function is_singular() { return true; }
function get_post() { return (object) array( 'post_content' => '[socdepoble_app]' ); }
function get_queried_object() { return get_post(); }
function has_shortcode( $text, $tag ) { return true; }
function has_block( $name, $post = null ) { return false; }
if ( 'inventory' === $cas['reader'] ) {
	function socdepoble_enxufe_manifest_local() { global $cas; return array( 'formatDelPaquet' => array( 'format' => 'trossos' ), 'inventari' => array( 'sha256' => $cas['hash'] ) ); }
	require $root . '/wordpress-plugin/includes/salut.php';
	$result = socdepoble_enxufe_trossos_sencers();
} elseif ( 'manifest' === $cas['reader'] ) {
	require $root . '/wordpress-plugin/includes/manifest.php';
	$result = socdepoble_enxufe_manifest_local();
} elseif ( 'readme' === $cas['reader'] ) {
	require $root . '/wordpress-plugin/includes/ajustos.php';
	$result = socdepoble_enxufe_llig_readme();
	if ( isset( $cas['line_canary'] ) ) { $render = socdepoble_enxufe_linia_detalls( $cas['line_canary'] ); }
} else {
	require $root . '/wordpress-plugin/includes/marcatge.php';
	require $root . '/wordpress-plugin/includes/seo.php';
	if ( 'query' === $cas['reader'] ) {
		$_SERVER['QUERY_STRING'] = $cas['query']; $_GET = array( 'sdp' => '/mur' );
		$result = socdepoble_enxufe_seo_parametre_unic();
		$unslash_parser = $stats['unslash'];
		$stats['filters'] = array();
		socdepoble_enxufe_seo_prepara();
		$title = socdepoble_enxufe_seo_titol( 'Títol de l’amfitrió' );
	} else { $result = socdepoble_enxufe_seo_taula(); }
}
echo json_encode( array( 'result' => $result, 'stats' => $stats, 'render' => $render ?? null, 'unslash_parser' => $unslash_parser ?? null, 'host_title' => $title ?? null, 'builtins' => array( function_exists( 'hash' ), function_exists( 'substr_count' ) ) ), JSON_THROW_ON_ERROR );
