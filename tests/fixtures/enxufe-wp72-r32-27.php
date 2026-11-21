<?php
/** IDEA-306: doubles locals; cap xarxa, base de dades ni credencial real. */
error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) {
	throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
} );
define( 'ABSPATH', __DIR__ . '/' );
define( 'DAY_IN_SECONDS', 86400 );
$cas = $argv[1];
$caps = array();
$demanades = array();
$memzero = array();
$events = array();
$secrets = array();
$http_mode = 'ok';
$http_credencial = false;
$set_crides = 0;

class WP_Error {
	public $code;
	public function __construct( $code, $message = '', $data = array() ) { $this->code = $code; }
}
function __( $text, $domini ) { return $text; }
function is_wp_error( $valor ) { return $valor instanceof WP_Error; }
function current_user_can( $cap ) {
	$GLOBALS['demanades'][] = $cap;
	return ! empty( $GLOBALS['caps'][ $cap ] );
}
function add_action( ...$args ) {}
function wp_salt( $nom ) { return 'sal-fixture'; }
function wp_parse_url( $url ) { return parse_url( $url ); }
function wp_json_encode( $valor ) { return json_encode( $valor, JSON_THROW_ON_ERROR ); }
function set_transient( ...$args ) { return true; }
function wp_remote_retrieve_response_code( $resposta ) { return $resposta['status']; }
function wp_remote_retrieve_body( $resposta ) { return $resposta['body']; }
function get_transient( $nom ) {
	if ( 'cache' === ( $GLOBALS['fase'] ?? '' ) ) { return 'Hola'; }
	return 'pausa' === ( $GLOBALS['fase'] ?? '' ) && 0 === strpos( $nom, 'sdp_tr_pause_' ) ? 429 : false;
}
class WP_REST_Response {
	public $data;
	public function __construct( $data, $status = 200, $headers = array() ) { $this->data = $data; }
}
function wp_remote_post( $url, $peticio ) {
	$GLOBALS['events'][] = 'http';
	$cos = json_decode( $peticio['body'], true );
	$GLOBALS['http_credencial'] = ( $peticio['headers']['Authorization'] ?? '' ) === 'DeepL-Auth-Key fixture:fx'
		|| ( $cos['api_key'] ?? '' ) === 'fixture-lliure';
	if ( 'throw' === $GLOBALS['http_mode'] ) { throw new RuntimeException( 'transport' ); }
	if ( 'error' === $GLOBALS['http_mode'] ) { return new WP_Error( 'transport' ); }
	return array( 'status' => 200, 'body' => json_encode( array( 'translations' => array( array( 'text' => 'Hola' ) ), 'translatedText' => array( 'Hola' ) ) ) );
}

if ( 'sense_api' !== $cas ) {
	final class WP_Secret {
		private $valor;
		public function __construct( $valor ) { $this->valor = $valor; }
		public function reveal() { return $this->valor; }
	}
	function wp_is_secrets_api_available() { return true; }
	function wp_secrets_provider_is_writable() { return true; }
	function wp_get_secret( $nom ) {
		return isset( $GLOBALS['secrets'][ $nom ] ) ? new WP_Secret( $GLOBALS['secrets'][ $nom ] ) : null;
	}
	function wp_set_secret( $nom, $valor ) {
		++$GLOBALS['set_crides'];
		if ( ! empty( $GLOBALS['set_throw'] ) ) { throw new RuntimeException( 'proveidor' ); }
		$GLOBALS['secrets'][ $nom ] = $valor;
		return true;
	}
	if ( 'memzero_sodium' === $cas ) {
		/* v1.2.18 · Gauntlet R1 (L4-04) · Com sodium_memzero i sodium_compat: una no-cadena llança
		   «a PHP string is required». -1 anota que algú li l'ha passada. */
		function wp_secrets_memzero( &$valor ) {
			$GLOBALS['memzero'][] = is_string( $valor ) ? strlen( $valor ) : -1;
			if ( ! is_string( $valor ) ) {
				throw class_exists( 'SodiumException' ) ? new SodiumException( 'a PHP string is required' ) : new TypeError( 'a PHP string is required' );
			}
			$GLOBALS['events'][] = 'zero';
			$valor = '';
		}
	} elseif ( 'sense_memzero' !== $cas ) {
		function wp_secrets_memzero( &$valor ) {
			$GLOBALS['memzero'][] = is_string( $valor ) ? strlen( $valor ) : -1;
			$GLOBALS['events'][] = 'zero';
			$valor = '';
		}
	}
}

require __DIR__ . '/../../wordpress-plugin/includes/traduccio.php';
$eixida = array();
if ( 'sense_api' === $cas ) {
	$caps = array( 'manage_options' => true );
	$r = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', 'fixture' );
	$eixida = array( 'codi' => $r->code, 'capacitat' => $demanades, 'sense_memzero' => ! function_exists( 'wp_secrets_memzero' ) );
} elseif ( in_array( $cas, array( 'capacitats', 'sense_memzero' ), true ) ) {
	$caps = array( 'manage_options' => true );
	$r = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', 'fixture' );
	$eixida['nomes_manage_options'] = $r->code;
	$caps = array( 'manage_secrets' => true );
	$eixida['manage_secrets'] = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', 'fixture' );
	$eixida['capacitat'] = $demanades;
	$eixida['limits'] = array(
		socdepoble_enxufe_secret_wp72_nom_valid( 'a/' . str_repeat( 'b', 170 ) ),
		socdepoble_enxufe_secret_wp72_nom_valid( 'a/' . str_repeat( 'b', 171 ) ),
		socdepoble_enxufe_desa_secret_wp72( 'a/' . str_repeat( 'b', 171 ), 'fixture' )->code,
	);
	$eixida['llegit'] = socdepoble_enxufe_llig_secret( '', 'socdepoble/prova' ) === 'fixture';
	$eixida['estat'] = socdepoble_enxufe_estat_secret( '', 'socdepoble/prova' );
	$set_throw = true;
	$eixida['excepcio'] = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', 'fixture-nova' )->code;
	$eixida['set_crides'] = $set_crides;
} elseif ( 'retorns' === $cas ) {
	$request = new class() {
		public function get_header( $nom ) { return ''; }
		public function is_json_content_type() { return true; }
		public function get_body() { return json_encode( $this->get_json_params() ); }
		public function get_json_params() { return array( 'textos' => array( 'Bon dia' ), 'origen' => 'CA', 'desti' => 'DE', 'format' => 'text' ); }
	};
	$r = socdepoble_enxufe_traduir( $request );
	$eixida['sense_proveidor'] = $r->code;
	$secrets['socdepoble/deepl-api-key'] = 'fixture:fx';
	$fase = 'cache';
	$r = socdepoble_enxufe_traduir( $request );
	$eixida['cache'] = $r->data['cache'];
	$fase = 'pausa';
	$r = socdepoble_enxufe_traduir( $request );
	$eixida['pausa'] = $r->code;
	$eixida['secret_intacte'] = $secrets['socdepoble/deepl-api-key'] === 'fixture:fx';
} elseif ( 'memzero_sodium' === $cas ) {
	// v1.2.18 · Gauntlet R1 (L4-04) · Cap excepció del memzero pot eixir d'un finally i tapar el return.
	$prova = static function ( $crida ) {
		try {
			return $crida();
		} catch ( Throwable $e ) {
			return 'excepcio:' . get_class( $e );
		}
	};
	$secrets['socdepoble/deepl-api-key'] = 123;
	$secrets['socdepoble/traduccio-url-clau'] = 'fixture';
	$eixida['resol_no_cadena'] = $prova( static function () { return socdepoble_enxufe_secret_wp72_resol( 'socdepoble/deepl-api-key' ); } );
	$eixida['estat_no_cadena'] = $prova( static function () { return socdepoble_enxufe_estat_secret( '', 'socdepoble/deepl-api-key' ); } );
	$eixida['destins'] = $prova( 'socdepoble_enxufe_traduccio_destins' );
	$eixida['resol_cadena'] = $prova( static function () { return socdepoble_enxufe_secret_wp72_resol( 'socdepoble/traduccio-url-clau' ); } );
	$caps = array( 'manage_secrets' => true );
	foreach ( array( 'enter' => 123, 'nul' => null, 'llista' => array( 'fixture' ) ) as $nom => $valor ) {
		$eixida['desa'][ $nom ] = $prova( static function () use ( $valor ) { return socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', $valor )->code; } );
	}
	$caps = array();
	$eixida['desa']['sense_permis'] = $prova( static function () { return socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova', 123 )->code; } );
	$eixida['set_crides'] = $set_crides;
} else {
	list( $motor, $http_mode ) = explode( ':', $cas );
	try {
		if ( 'deepl' === $motor ) {
			$r = socdepoble_enxufe_traduccio_deepl( 'fixture:fx', array( 'id' => 'Bon dia' ), 'ES', 'text', 'pausa' );
		} else {
			$r = socdepoble_enxufe_traduccio_lliure( array( 'url' => 'https://traductor.invalid', 'clau' => 'fixture-lliure' ), array( 'id' => 'Bon dia' ), 'DE', 'text', 'pausa' );
		}
		$eixida['resultat'] = is_wp_error( $r ) ? $r->code : $r;
	} catch ( RuntimeException $e ) {
		$eixida['resultat'] = 'excepcio';
	}
	$eixida['http_credencial'] = $http_credencial;
}
$eixida['memzero'] = $memzero;
$eixida['events'] = $events;
echo json_encode( $eixida, JSON_THROW_ON_ERROR );
