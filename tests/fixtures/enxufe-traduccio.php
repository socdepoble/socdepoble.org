<?php
/** PHP real, SQL SQLite i dobles de les fronteres WordPress/DeepL. Cap xarxa. */
error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) { throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia ); } );
define( 'ABSPATH', __DIR__ . '/' );
define( 'DAY_IN_SECONDS', 86400 );
$cas = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
foreach ( $cas['constants'] ?? array() as $k => $v ) { define( $k, $v ); }
putenv( 'DEEPL_API_KEY=' . ( $cas['key'] ?? 'fixture-secret:fx' ) );
$_SERVER['REMOTE_ADDR'] = '192.0.2.1';
$traces = array();
$transients = array();
$routes = array();
$respostes = array();
$ara = array();

class WP_Error {
	public $code; public $message; public $data;
	function __construct( $code, $message, $data = array() ) { $this->code = $code; $this->message = $message; $this->data = $data; }
}
class WP_REST_Response {
	public $data; public $status; public $headers;
	function __construct( $data, $status = 200, $headers = array() ) { $this->data = $data; $this->status = $status; $this->headers = $headers; }
}
class SDP_Request {
	public $body; public $headers;
	function __construct( $pas ) { $this->body = $pas['raw'] ?? json_encode( $pas['body'] ?? array( 'textos' => array( 'Bon dia' ), 'desti' => 'ES', 'origen' => 'CA', 'format' => 'text' ), JSON_UNESCAPED_UNICODE ); $this->headers = array_merge( array( 'content-type' => 'application/json', 'origin' => 'https://host.example' ), $pas['headers'] ?? array() ); }
	function get_header( $name ) { return $this->headers[ $name ] ?? null; }
	function get_body() { return $this->body; }
	function is_json_content_type() { return (bool) preg_match( '~^application/(?:[a-z0-9.+-]+\+)?json(?:;|$)~i', $this->get_header( 'content-type' ) ); }
	function get_json_params() { return json_decode( $this->body, true ); }
}
class SDP_DB {
	public $options = 'options'; public $db;
	function __construct() { $this->db = new PDO( 'sqlite::memory:' ); $this->db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION ); $this->db->exec( 'CREATE TABLE options (option_name TEXT PRIMARY KEY, option_value TEXT, autoload TEXT)' ); }
	function prepare( $sql, ...$args ) { foreach ( $args as $v ) { $sql = preg_replace_callback( '/%s/', fn() => $this->db->quote( (string) $v ), $sql, 1 ); } return $sql; }
	function query( $sql ) {
		if ( ! empty( $GLOBALS['ara']['failSql'] ) && 0 === strpos( $sql, 'UPDATE' ) ) { return false; }
		$sql = str_replace( 'INSERT IGNORE INTO', 'INSERT OR IGNORE INTO', $sql );
		return $this->db->exec( $sql );
	}
	function get_var( $sql ) { $v = $this->db->query( $sql )->fetchColumn(); return false === $v ? null : $v; }
}
$wpdb = new SDP_DB();
function add_option( $k, $v, $old = '', $autoload = false ) { global $wpdb; return 1 === $wpdb->query( $wpdb->prepare( 'INSERT INTO options (option_name, option_value) VALUES (%s,%s) ON CONFLICT(option_name) DO UPDATE SET option_value=excluded.option_value', $k, $v ) ); }
function wp_cache_delete( $k, $group ) {}
function wp_generate_uuid4() { return bin2hex( random_bytes( 16 ) ); }
function __( $text, $domain ) { return $text; }
function wp_salt( $type ) { return 'test-salt-only'; }
function wp_json_encode( $v, $flags = 0 ) { return json_encode( $v, $flags ); }
function wp_parse_url( $v ) { return parse_url( $v ); }
function home_url() { return 'https://host.example/subdirectory'; }
function rest_url( $path = '' ) { return 'https://host.example/subdirectory/wp-json/' . $path; }
function is_wp_error( $v ) { return $v instanceof WP_Error; }
function add_action( $hook, $callback ) { if ( 'rest_api_init' === $hook ) { $callback(); } }
function register_rest_route( $namespace, $route, $opts ) { $GLOBALS['routes'][ $namespace . $route ] = $opts; }
function get_transient( $k ) {
	$v = $GLOBALS['transients'][ $k ]['value'] ?? false;
	// WordPress sense cache extern torna escalars de la BD com a cadenes.
	return false === $v || is_array( $v ) ? $v : (string) $v;
}
function set_transient( $k, $v, $ttl ) { if ( ! empty( $GLOBALS['ara']['failTransient'] ) ) return false; $GLOBALS['transients'][ $k ] = array( 'value' => $v, 'ttl' => $ttl ); return true; }
function wp_remote_retrieve_response_code( $r ) { return $r['status']; }
function wp_remote_retrieve_body( $r ) { return $r['body']; }
function wp_remote_post( $url, $args ) {
	$body = json_decode( $args['body'], true );
	$trace = $args;
	$trace['headers']['Authorization'] = explode( ' ', $args['headers']['Authorization'], 2 )[0] . ' <redactada>';
	$trace['url'] = $url;
	$trace['body'] = $body;
	$GLOBALS['traces'][] = $trace;
	$pas = $GLOBALS['ara'];
	if ( ! empty( $pas['reentry'] ) ) {
		$GLOBALS['ara']['reentry'] = false;
		$GLOBALS['nested'] = socdepoble_enxufe_traduir( new SDP_Request( is_array( $pas['reentry'] ) ? $pas['reentry'] : array() ) );
	}
	if ( ! empty( $pas['transport'] ) ) return new WP_Error( 'transport', 'secret diagnostic fixture-secret:fx' );
	$translations = array_map( fn( $t ) => array( 'text' => $body['target_lang'] . ':' . $t, 'detected_source_language' => 'CA' ), $body['text'] );
	return array( 'status' => $pas['status'] ?? 200, 'body' => $pas['upstreamRaw'] ?? json_encode( $pas['upstream'] ?? array( 'translations' => $translations ) ) );
}
require $argv[1];
foreach ( $cas['steps'] ?? array( array() ) as $ara ) {
	if ( isset( $ara['key'] ) ) putenv( 'DEEPL_API_KEY=' . $ara['key'] );
	if ( ! empty( $ara['evict'] ) ) $transients = array();
	if ( isset( $ara['budget'] ) ) {
		$wpdb->query( 'DELETE FROM options WHERE option_name = \'sdp_traduccio_pressupost\'' );
		add_option( 'sdp_traduccio_pressupost', json_encode( $ara['budget'] ) );
	}
	if ( isset( $ara['lock'] ) ) add_option( 'sdp_traduccio_lock', $ara['lock'] );
	$respostes[] = socdepoble_enxufe_traduir( new SDP_Request( $ara ) );
}
$budget = $wpdb->get_var( "SELECT option_value FROM options WHERE option_name = 'sdp_traduccio_pressupost'" );
$lock = $wpdb->get_var( "SELECT option_value FROM options WHERE option_name = 'sdp_traduccio_lock'" );
echo json_encode( array( 'responses' => $respostes, 'calls' => $traces, 'cache' => $transients, 'routes' => $routes, 'budget' => json_decode( $budget ?? 'null', true ), 'lock' => $lock, 'nested' => $GLOBALS['nested'] ?? null ), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR );
