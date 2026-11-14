<?php
/**
 * Les tres abilities de Sóc de Poble dins del WP_Ability i del validador
 * d'esquemes REAL del nucli de WordPress (6.9+), sense base de dades ni xarxa.
 *
 * Ús: php enxufe-abilities-nucli-runner.php <arrel d'un WordPress 6.9+>
 * Carrega del nucli wp-includes/rest-api.php (rest_validate_value_from_schema),
 * wp-includes/class-wp-filter-sentinel.php (7.1+, si hi és) i
 * wp-includes/abilities-api/class-wp-ability.php; la resta són dobles mínims.
 * Escriu JSON per stdout: per a cada crida, si ha passat el pipeline sencer
 * (normalize → validate_input → permisos → execute → validate_output) o el
 * codi d'error del nucli.
 */
error_reporting( E_ALL );
set_error_handler(
	static function ( $nivell, $missatge, $fitxer, $linia ) {
		throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
	}
);

$nucli = $argv[1] ?? '';
if ( ! is_readable( $nucli . '/wp-includes/rest-api.php' ) || ! is_readable( $nucli . '/wp-includes/abilities-api/class-wp-ability.php' ) ) {
	fwrite( STDERR, "Cal l'arrel d'un WordPress 6.9+\n" );
	exit( 2 );
}

define( 'ABSPATH', $nucli . '/' );

class WP_Error {
	public $code;
	public $message;
	public function __construct( $code = '', $message = '', $data = '' ) {
		$this->code    = $code;
		$this->message = $message;
	}
	public function get_error_message() {
		return $this->message;
	}
	public function get_error_code() {
		return $this->code;
	}
	public function has_errors() {
		return '' !== $this->code;
	}
}
function is_wp_error( $thing ) {
	return $thing instanceof WP_Error;
}
function __( $text, $domain = 'default' ) {
	return $text;
}
function _n( $singular, $plural, $n, $domain = 'default' ) {
	return 1 === $n ? $singular : $plural;
}
function esc_html( $text ) {
	return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
}
function _doing_it_wrong( $funcio, $missatge, $versio ) {
	$GLOBALS['sdp_avisos'][] = $funcio . ': ' . $missatge;
}
function apply_filters( $hook, $valor, ...$args ) {
	return $valor;
}
function do_action( $hook, ...$args ) {
}
function add_action( $hook, $cb, $prio = 10, $args = 1 ) {
	$GLOBALS['sdp_ganxos'][ $hook ][] = $cb;
}
function wp_parse_args( $args, $defaults = array() ) {
	return array_merge( $defaults, is_array( $args ) ? $args : array() );
}
function wp_is_numeric_array( $data ) {
	if ( ! is_array( $data ) ) {
		return false;
	}
	foreach ( array_keys( $data ) as $clau ) {
		if ( ! is_int( $clau ) ) {
			return false;
		}
	}
	return true;
}
function wp_json_encode( $data, $flags = 0, $depth = 512 ) {
	return json_encode( $data, $flags, $depth );
}
function current_user_can( $cap, ...$extra ) {
	return true;
}
function get_option( $name, $default = false ) {
	return array(
		'socdepoble_enxufe_poble'    => 'la-torre-de-les-macanes',
		'socdepoble_enxufe_nompoble' => 'Gent de la Torre',
	)[ $name ] ?? $default;
}
function sanitize_text_field( $str ) {
	return trim( strip_tags( (string) $str ) );
}
function sanitize_title( $str ) {
	return strtolower( preg_replace( '/[^a-zA-Z0-9_-]+/', '-', trim( (string) $str ) ) );
}
function wp_strip_all_tags( $str ) {
	return strip_tags( (string) $str );
}
function home_url( $path = '' ) {
	return 'https://poble.example.org/' . ltrim( $path, '/' );
}
function wp_parse_url( $url, $component = -1 ) {
	return parse_url( $url, $component );
}
function get_posts( $args = array() ) {
	return array(
		(object) array(
			'ID'           => 42,
			'post_title'   => 'Bàndol de reg',
			'post_content' => '<h1>Inici</h1><h3>Salt directe</h3><img src="https://poble.example.org/foto.jpg"><link href="https://fonts.googleapis.com/css?family=Roboto">',
		),
	);
}
function get_post( $id ) {
	if ( 77 !== intval( $id ) ) {
		return null;
	}
	return (object) array(
		'ID'            => 77,
		'post_type'     => 'post',
		'post_status'   => 'publish',
		'post_password' => '',
		'post_title'    => 'Festa de l’Oli Nou',
		'post_content'  => '<h2>Jornada cooperativa a l’almàssera</h2><p>Diumenge a les 10 h esmorzarem.</p><p>a' . str_repeat( 'é', 400 ) . '</p>',
	);
}
// Les peces del connector que no són d'abilities-mcp.php.
function socdepoble_enxufe_manifest_local() {
	return array( 'versio' => '1.1.14' );
}
function socdepoble_enxufe_te_bundle() {
	return true;
}
function socdepoble_enxufe_trossos_sencers() {
	return true;
}
function socdepoble_enxufe_node_inadequat() {
	return false;
}
function socdepoble_enxufe_traduccio_proveidor_actiu() {
	return 'apertium';
}
function socdepoble_enxufe_secrets_wp72_clau_activa() {
	return false;
}
function socdepoble_enxufe_secrets_wp72_disponible() {
	return false;
}
function wp_register_ability_category( $slug, $args ) {
	$GLOBALS['sdp_categories'][ $slug ] = $args;
}
function wp_register_ability( $nom, $args ) {
	$GLOBALS['sdp_abilities'][ $nom ] = $args;
}

require $nucli . '/wp-includes/rest-api.php';
if ( is_readable( $nucli . '/wp-includes/class-wp-filter-sentinel.php' ) ) {
	require $nucli . '/wp-includes/class-wp-filter-sentinel.php';
}
require $nucli . '/wp-includes/abilities-api/class-wp-ability.php';
require dirname( __DIR__, 2 ) . '/wordpress-plugin/includes/abilities-mcp.php';

$GLOBALS['sdp_avisos']    = array();
$GLOBALS['sdp_abilities'] = array();
socdepoble_enxufe_registra_categoria_abilities();
socdepoble_enxufe_registra_abilities_mcp();

$abilities = array();
$registre  = array();
foreach ( $GLOBALS['sdp_abilities'] as $nom => $args ) {
	try {
		$abilities[ $nom ] = new WP_Ability( $nom, $args );
		$registre[ $nom ]  = true;
	} catch ( Throwable $error ) {
		$registre[ $nom ] = get_class( $error ) . ': ' . $error->getMessage();
	}
}

$executa = static function ( $nom, $entrada ) use ( $abilities ) {
	if ( ! isset( $abilities[ $nom ] ) ) {
		return 'sense_registre';
	}
	try {
		$resultat = $abilities[ $nom ]->execute( $entrada );
	} catch ( Throwable $error ) {
		return 'excepcio: ' . $error->getMessage();
	}
	if ( is_wp_error( $resultat ) ) {
		return $resultat->get_error_code();
	}
	return false === json_encode( $resultat ) ? 'json_invalid' : 'ok';
};

$diag    = 'socdepoble/diagnostica-enxufe';
$audit   = 'socdepoble/audita-accessibilitat-i-privadesa';
$prepara = 'socdepoble/prepara-importacio-pedra-seca';

echo json_encode(
	array(
		'registre'      => $registre,
		'crides'        => array(
			'diag_sense_entrada'      => $executa( $diag, null ),
			'diag_objecte_buit'       => $executa( $diag, array() ),
			'diag_clau_estranya'      => $executa( $diag, array( 'url' => 'https://evil.invalid/' ) ),
			'audit_sense_entrada'     => $executa( $audit, null ),
			'audit_limit'             => $executa( $audit, array( 'limit' => 5, 'tipus' => 'post' ) ),
			'audit_limit_fora'        => $executa( $audit, array( 'limit' => 500 ) ),
			'audit_clau_estranya'     => $executa( $audit, array( 'sql' => 'DROP TABLE' ) ),
			'prepara_sense_entrada'   => $executa( $prepara, null ),
			'prepara_post'            => $executa( $prepara, array( 'post_id' => 77, 'desti' => 'calendari' ) ),
			'prepara_html'            => $executa( $prepara, array( 'titol' => 'Bàndol', 'contingut_html' => '<p>a' . str_repeat( 'à', 400 ) . '</p>' ) ),
			'prepara_url_estranya'    => $executa( $prepara, array( 'titol' => 'Bàndol', 'url' => 'https://evil.invalid/' ) ),
			'prepara_publica'         => $executa( $prepara, array( 'titol' => 'Bàndol', 'publica' => true ) ),
		),
		'avisos'        => $GLOBALS['sdp_avisos'],
	)
);
