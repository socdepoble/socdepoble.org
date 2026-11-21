<?php
/**
 * Banc de proves CLI en memòria per a Onada R25.2 (Secrets WP 7.2, Abilities MCP i 503).
 * Rep el cas per $argv[1] i escriu JSON net per stdout.
 *
 * Els dobles de la Secrets API seguixen el contracte de la dev note de Make
 * WordPress Core (11-11-2026): wp_get_secret torna WP_Secret, null o WP_Error;
 * el valor només ix amb ->reveal() i el WP_Secret imprés o en JSON és el
 * marcador «[secret:nom]». Cap xarxa.
 */
define( 'ABSPATH', __DIR__ . '/' );
define( 'SOCDEPOBLE_ENXUFE_FITXER', dirname( __DIR__, 2 ) . '/wordpress-plugin/socdepoble-enxufe.php' );
define( 'SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble' );
define( 'SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js' );
define( 'SOCDEPOBLE_ENXUFE_MANIFEST', 'dist/sdp-release.json' );

$cas = $argv[1] ?? 'precedencia_secret';

class WP_Error {
	public $code;
	public $message;
	public $data;
	public function __construct( $code = '', $message = '', $data = '' ) {
		$this->code    = $code;
		$this->message = $message;
		$this->data    = $data;
	}
	public function get_error_message() {
		return $this->message;
	}
}

class WP_REST_Response {
	public $data;
	public $status;
	public $headers;
	public function __construct( $data = null, $status = 200, $headers = array() ) {
		$this->data    = $data;
		$this->status  = $status;
		$this->headers = $headers;
	}
}

/** Petició REST mínima: només la ruta. */
class SDP_Peticio_REST {
	private $ruta;
	public function __construct( $ruta ) {
		$this->ruta = $ruta;
	}
	public function get_route() {
		return $this->ruta;
	}
}

function is_wp_error( $thing ) {
	return $thing instanceof WP_Error;
}
/* Onada R29 · Les traduccions i el locale efectiu del cas ($GLOBALS); sense res, l'anglés d'origen. */
function __( $text, $domain = 'default' ) {
	return $GLOBALS['sdp_test_traduccions'][ $text ] ?? $text;
}
function esc_html__( $text, $domain = 'default' ) {
	return htmlspecialchars( __( $text, $domain ), ENT_QUOTES, 'UTF-8' );
}
function esc_html( $text ) {
	return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
}
function esc_attr( $text ) {
	return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
}
function determine_locale() {
	return $GLOBALS['sdp_test_locale'] ?? 'en_US';
}
function esc_url( $url ) {
	return (string) $url;
}
function admin_url( $path = '' ) {
	return 'https://poble.example.org/wp-admin/' . ltrim( $path, '/' );
}
function home_url( $path = '' ) {
	return 'https://poble.example.org/' . ltrim( $path, '/' );
}
function rest_url( $path = '' ) {
	return 'https://poble.example.org/wp-json/' . ltrim( $path, '/' );
}
function wp_parse_url( $url, $component = -1 ) {
	return parse_url( $url, $component );
}
/* Com el _sanitize_text_fields del nucli (formatting.php de 7.1.1): passa per
   wp_strip_all_tags() si hi ha «<» i també esborra els octets %XX. El doble d'abans no
   ho feia i amagava que un camí sanititzat ja no és el camí. */
function sanitize_text_field( $str ) {
	$net = (string) $str;
	if ( false !== strpos( $net, '<' ) ) {
		$net = wp_strip_all_tags( $net );
	}
	$net = trim( preg_replace( '/[\r\n\t ]+/', ' ', $net ) );
	while ( preg_match( '/%[a-f0-9]{2}/i', $net, $octet ) ) {
		$net = str_replace( $octet[0], '', $net );
	}
	return trim( preg_replace( '/ +/', ' ', $net ) );
}
function sanitize_title( $str ) {
	return strtolower( preg_replace( '/[^a-zA-Z0-9_-]+/', '-', trim( (string) $str ) ) );
}
/* El de formatting.php de 7.1.1, amb el mateix patró: el seu cost és part de la mesura. */
function wp_strip_all_tags( $str ) {
	return trim( strip_tags( (string) preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', (string) $str ) ) );
}
function wp_unslash( $value ) {
	return is_string( $value ) ? stripslashes( $value ) : $value;
}
function wp_salt( $scheme = 'auth' ) {
	return 'sal-prova-' . $scheme;
}
function plugin_dir_path( $file ) {
	return rtrim( dirname( $file ), '/' ) . '/';
}
function is_wp_version_compatible( $required ) {
	global $sdp_test_wp_version;
	return version_compare( $sdp_test_wp_version ?? '6.5', $required, '>=' );
}
function wp_get_nocache_headers() {
	return array(
		'Expires'       => 'Wed, 11 Jan 1984 05:00:00 GMT',
		'Cache-Control' => 'no-cache, must-revalidate, max-age=0, no-store, private',
		'Last-Modified' => false,
	);
}

$GLOBALS['sdp_test_hooks']          = array();
$GLOBALS['sdp_test_caps']           = array();
$GLOBALS['sdp_test_caps_objecte']   = array();
$GLOBALS['sdp_test_crides_caps']    = 0;
$GLOBALS['sdp_test_options']        = array(
	'socdepoble_enxufe_poble'    => 'la-torre-de-les-macanes',
	'socdepoble_enxufe_nompoble' => 'Gent de la Torre',
);
$GLOBALS['sdp_test_options_writes'] = 0;
$GLOBALS['sdp_test_secrets']        = array();
$GLOBALS['sdp_test_illegibles']     = array();
$GLOBALS['sdp_test_abilities']      = array();
$GLOBALS['sdp_test_categories']     = array();
$GLOBALS['sdp_test_is_robots']      = false;
$GLOBALS['sdp_test_status']         = 200;
$GLOBALS['sdp_test_nocache']        = false;

function add_action( $hook, $cb, $prio = 10, $args = 1 ) {
	$GLOBALS['sdp_test_hooks'][ $hook ][] = $cb;
}
function add_filter( $hook, $cb, $prio = 10, $args = 1 ) {
	$GLOBALS['sdp_test_hooks'][ $hook ][] = $cb;
}
/** Capacitats globals i, per a «cap:id», per objecte (read_post de 999 sempre denegat). */
function current_user_can( $cap, ...$extra ) {
	$GLOBALS['sdp_test_crides_caps'] += 1;
	if ( isset( $extra[0] ) ) {
		$clau = $cap . ':' . intval( $extra[0] );
		if ( array_key_exists( $clau, $GLOBALS['sdp_test_caps_objecte'] ) ) {
			return (bool) $GLOBALS['sdp_test_caps_objecte'][ $clau ];
		}
		if ( 'read_post' === $cap && 999 === intval( $extra[0] ) ) {
			return false;
		}
	}
	return ! empty( $GLOBALS['sdp_test_caps'][ $cap ] );
}
function get_option( $name, $default = false ) {
	return $GLOBALS['sdp_test_options'][ $name ] ?? $default;
}
function update_option( $name, $value ) {
	$GLOBALS['sdp_test_options_writes'] += 1;
	$GLOBALS['sdp_test_options'][ $name ] = $value;
	return true;
}
function socdepoble_enxufe_manifest_local() {
	return array( 'versio' => '1.1.14' );
}
function socdepoble_enxufe_te_bundle() {
	return true;
}
function socdepoble_enxufe_node_inadequat() {
	return false;
}
function is_robots() {
	return (bool) $GLOBALS['sdp_test_is_robots'];
}
function status_header( $code ) {
	$GLOBALS['sdp_test_status'] = intval( $code );
}
function nocache_headers() {
	$GLOBALS['sdp_test_nocache'] = true;
}
function get_posts( $args = array() ) {
	return array(
		(object) array(
			'ID'           => 42,
			'post_title'   => 'Bàndol de reg',
			'post_content' => '<h1>Inici</h1><h3>Salt directe</h3><img src="https://poble.example.org/foto.jpg"><link href="https://fonts.googleapis.com/css?family=Roboto">',
		),
		(object) array(
			'ID'           => 43,
			'post_title'   => 'Entrada neta',
			'post_content' => '<h1>Títol</h1><h2>Subtítol</h2><img src="https://poble.example.org/a.jpg" alt="Olivera centenària">',
		),
	);
}
function get_post( $id ) {
	$posts = array(
		77 => (object) array(
			'ID'            => 77,
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_password' => '',
			'post_title'    => 'Festa de l’Oli Nou',
			'post_content'  => '<h2>Jornada cooperativa a l’almàssera</h2><p>Diumenge a les 10 h esmorzarem pa torrat amb oli primerenc.</p><h3>Programa del matí</h3><p>Visita guiada i tast obert a tot el veïnat.</p>',
		),
		// Sol·licitud de privadesa del nucli: el títol és el correu de qui la demana.
		78 => (object) array(
			'ID'            => 78,
			'post_type'     => 'user_request',
			'post_status'   => 'request-pending',
			'post_password' => '',
			'post_title'    => 'veina.privada@example.org',
			'post_content'  => '',
		),
		79 => (object) array(
			'ID'            => 79,
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_password' => 'nomes-la-junta',
			'post_title'    => 'Acta reservada de la junta',
			'post_content'  => '<p>Acord reservat sobre el pressupost de reg.</p>',
		),
		// Títol i entradilla més llargs que la proposta: el tall cau dins d'un caràcter de dos bytes.
		80 => (object) array(
			'ID'            => 80,
			'post_type'     => 'page',
			'post_status'   => 'publish',
			'post_password' => '',
			'post_title'    => 'a' . str_repeat( 'à', 400 ),
			'post_content'  => '<p>a' . str_repeat( 'é', 400 ) . '</p><p>' . str_repeat( 'ç', 3000 ) . '</p>',
		),
		// El títol d'una entrada no té cap maxLength: 64 KiB de «<script>» sense tancar.
		81 => (object) array(
			'ID'            => 81,
			'post_type'     => 'post',
			'post_status'   => 'draft',
			'post_password' => '',
			'post_title'    => str_repeat( '<script>', 8192 ),
			'post_content'  => '<p>Contingut curt.</p>',
		),
	);
	return $posts[ intval( $id ) ] ?? null;
}

/** Els doble de la Secrets API de WordPress 7.2 (contracte de la dev note). */
function sdp_test_carrega_secrets_api_wp72() {
	$GLOBALS['sdp_test_api_disponible'] = $GLOBALS['sdp_test_api_disponible'] ?? true;
	$GLOBALS['sdp_test_writable']       = true;
	$GLOBALS['sdp_test_get_crides']     = 0;
	$GLOBALS['sdp_test_set_crides']     = 0;
	require_once __DIR__ . '/enxufe-r25-2-secrets-doble.php';
}

$arrel_wp = dirname( __DIR__, 2 ) . '/wordpress-plugin';

if ( 'wp_antic_sense_apis' === $cas ) {
	$GLOBALS['sdp_test_wp_version'] = '6.5';
	require_once $arrel_wp . '/includes/secrets-wp72.php';
	require_once $arrel_wp . '/includes/traduccio.php';
	require_once $arrel_wp . '/includes/salut.php';
	require_once $arrel_wp . '/includes/abilities-mcp.php';

	socdepoble_enxufe_registra_categoria_abilities();
	socdepoble_enxufe_registra_abilities_mcp();
	$GLOBALS['sdp_test_caps'] = array( 'manage_options' => true );
	$err_desar                = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/deepl-api-key', 'clau-secreta' );
	$GLOBALS['sdp_test_caps'] = array();

	echo json_encode(
		array(
			'secret_llegit'  => socdepoble_enxufe_llig_secret( 'DEEPL_API_KEY', 'socdepoble/deepl-api-key' ),
			'estat'          => socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', 'socdepoble/deepl-api-key' ),
			'proveidor'      => socdepoble_enxufe_traduccio_proveidor_actiu(),
			'desa_es_error'  => is_wp_error( $err_desar ),
			'desa_codi'      => is_wp_error( $err_desar ) ? $err_desar->code : '',
			'options_writes' => $GLOBALS['sdp_test_options_writes'],
			'abilities_n'    => count( $GLOBALS['sdp_test_abilities'] ),
			'salut_proves'   => array_keys( socdepoble_enxufe_proves_salut( array( 'direct' => array() ) )['direct'] ),
		)
	);
	exit( 0 );
}

if ( 'wp72_secrets_i_abilities' === $cas ) {
	$GLOBALS['sdp_test_wp_version'] = '7.2';
	define( 'WP_SECRETS_KEY', 'clau-mestra-xifrat-wp72-demo-32bytes' );
	sdp_test_carrega_secrets_api_wp72();

	function wp_register_ability_category( $slug, $args ) {
		$GLOBALS['sdp_test_categories'][ $slug ] = $args;
	}
	function wp_register_ability( $id, $args ) {
		$GLOBALS['sdp_test_abilities'][ $id ] = $args;
	}

	require_once $arrel_wp . '/includes/secrets-wp72.php';
	require_once $arrel_wp . '/includes/traduccio.php';
	require_once $arrel_wp . '/includes/salut.php';
	require_once $arrel_wp . '/includes/abilities-mcp.php';

	$deepl = 'socdepoble/deepl-api-key';

	// Desar: el nucli no comprova capacitats, el connector sí.
	$desa_anonim     = socdepoble_enxufe_desa_secret_wp72( $deepl, 'deepl-xifrat-wp72-secret-999' );
	$set_crides_anon = $GLOBALS['sdp_test_set_crides'];
	$GLOBALS['sdp_test_caps'] = array( 'manage_options' => true, 'manage_secrets' => true );
	$desat           = socdepoble_enxufe_desa_secret_wp72( $deepl, 'deepl-xifrat-wp72-secret-999' );
	$desa_illegible  = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/error-desxifrat', 'clau-nova-damunt' );
	$desa_nom_dolent = socdepoble_enxufe_desa_secret_wp72( 'socdepoble_deepl_api_key', 'clau' );
	$desa_crlf       = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova-crlf', "clau\r\nX-Injectada: 1" );
	$GLOBALS['sdp_test_writable'] = false;
	$desa_nomes_lectura           = socdepoble_enxufe_desa_secret_wp72( 'socdepoble/prova-lectura', 'clau' );
	$GLOBALS['sdp_test_writable'] = true;
	$set_crides_final             = $GLOBALS['sdp_test_set_crides'];
	$GLOBALS['sdp_test_caps']     = array();

	// Lectura per la Secrets API (sense constant ni entorn): reveal() al punt d'ús.
	$llegit_wp72    = socdepoble_enxufe_llig_secret( 'DEEPL_API_KEY', $deepl );
	$estat_wp72     = socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', $deepl );
	$proveidor_wp72 = socdepoble_enxufe_traduccio_proveidor( 'ES' );
	$actiu_wp72     = socdepoble_enxufe_traduccio_proveidor_actiu();
	$GLOBALS['sdp_test_secrets'][ $deepl ] = 'deepl-rotada-wp72-secret-000';
	$proveidor_rotat                       = socdepoble_enxufe_traduccio_proveidor( 'ES' );
	$GLOBALS['sdp_test_secrets'][ $deepl ] = 'deepl-xifrat-wp72-secret-999';

	// Absent i error són estats distints; cap forma fora de contracte esdevé credencial.
	$estats = array(
		'absent'    => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/mai-desat' ),
		'wp_error'  => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/error-desxifrat' ),
		'excepcio'  => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/trencat-per-rotacio' ),
		'cadena'    => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/drop-in-cadena' ),
		'objecte'   => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/drop-in-objecte' ),
		'mascara'   => socdepoble_enxufe_estat_secret( 'CONSTANT_INEXISTENT', 'socdepoble/mascara-revelada' ),
	);
	$valors = array();
	foreach ( array( 'socdepoble/mai-desat', 'socdepoble/error-desxifrat', 'socdepoble/trencat-per-rotacio', 'socdepoble/drop-in-cadena', 'socdepoble/drop-in-objecte', 'socdepoble/mascara-revelada' ) as $nom ) {
		$valors[ $nom ] = socdepoble_enxufe_llig_secret( 'CONSTANT_INEXISTENT', $nom );
	}
	$crides_abans_nom = $GLOBALS['sdp_test_get_crides'];
	$nom_invalid      = socdepoble_enxufe_llig_secret( 'CONSTANT_INEXISTENT', 'socdepoble_deepl_api_key' );
	$crides_nom       = $GLOBALS['sdp_test_get_crides'] - $crides_abans_nom;

	// Salut: estat sanititzat, mai el missatge cru del WP_Error.
	$salut_ok = socdepoble_enxufe_prova_secrets_wp72();
	$GLOBALS['sdp_test_illegibles'][ $deepl ] = true;
	$salut_illegible     = socdepoble_enxufe_prova_secrets_wp72();
	$actiu_illegible     = socdepoble_enxufe_traduccio_proveidor_actiu();
	$GLOBALS['sdp_test_illegibles'] = array();
	$GLOBALS['sdp_test_api_disponible'] = false;
	$salut_no_disponible = socdepoble_enxufe_prova_secrets_wp72();
	$estat_no_disponible = socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', $deepl );
	$crides_abans_api    = $GLOBALS['sdp_test_get_crides'];
	$llegit_no_disponible = socdepoble_enxufe_llig_secret( 'DEEPL_API_KEY', $deepl );
	$crides_api          = $GLOBALS['sdp_test_get_crides'] - $crides_abans_api;
	$GLOBALS['sdp_test_api_disponible'] = true;

	// Precedència: l'entorn passa per davant de la Secrets API, i la constant per davant de tot.
	putenv( 'DEEPL_API_KEY=deepl-des-de-getenv-222' );
	$llegit_env = socdepoble_enxufe_llig_secret( 'DEEPL_API_KEY', $deepl );
	$estat_env  = socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', $deepl );

	define( 'DEEPL_API_KEY', 'deepl-des-de-constant-111' );
	$llegit_const = socdepoble_enxufe_llig_secret( 'DEEPL_API_KEY', $deepl );

	// Una constant definida i buida mana (desactiva la clau) i no passa a l'entorn ni a l'API.
	$GLOBALS['sdp_test_secrets']['socdepoble/traduccio-url-clau'] = 'lliure-secret-wp72';
	putenv( 'SDP_TRADUCCIO_URL_CLAU=lliure-des-de-getenv' );
	define( 'SDP_TRADUCCIO_URL_CLAU', '' );
	$constant_buida       = socdepoble_enxufe_llig_clau( 'traduccio_url' );
	$estat_constant_buida = socdepoble_enxufe_estat_secret( 'SDP_TRADUCCIO_URL_CLAU', 'socdepoble/traduccio-url-clau' );
	// Una variable d'entorn amb salt de línia també mana: cap pas avall.
	$GLOBALS['sdp_test_secrets']['socdepoble/prova-crlf'] = 'clau-bona-wp72';
	putenv( "SDP_PROVA_ENTORN_CRLF=dolenta\r\nX-Injectada: 1" );
	$entorn_crlf       = socdepoble_enxufe_llig_secret( 'SDP_PROVA_ENTORN_CRLF', 'socdepoble/prova-crlf' );
	$estat_entorn_crlf = socdepoble_enxufe_estat_secret( 'SDP_PROVA_ENTORN_CRLF', 'socdepoble/prova-crlf' );

	socdepoble_enxufe_registra_categoria_abilities();
	socdepoble_enxufe_registra_abilities_mcp();

	// Permisos: sense cap capacitat -> tot fals.
	$perm_anon = array();
	foreach ( $GLOBALS['sdp_test_abilities'] as $id => $cfg ) {
		$cb = $cfg['permission_callback'];
		$perm_anon[ $id ] = array(
			'callback' => $cb,
			'resultat' => call_user_func( $cb ),
		);
	}

	// Permisos: editor només passa a prepara-importacio-pedra-seca.
	$GLOBALS['sdp_test_caps'] = array( 'edit_posts' => true );
	$perm_editor = array();
	foreach ( $GLOBALS['sdp_test_abilities'] as $id => $cfg ) {
		$perm_editor[ $id ] = call_user_func( $cfg['permission_callback'] );
	}

	// Permisos: admin passa a totes.
	$GLOBALS['sdp_test_caps'] = array( 'manage_options' => true, 'edit_posts' => true, 'read_post' => true );
	$prepara = $GLOBALS['sdp_test_abilities']['socdepoble/prepara-importacio-pedra-seca']['execute_callback'];
	$diag    = call_user_func( $GLOBALS['sdp_test_abilities']['socdepoble/diagnostica-enxufe']['execute_callback'] );
	$audit   = call_user_func( $GLOBALS['sdp_test_abilities']['socdepoble/audita-accessibilitat-i-privadesa']['execute_callback'], array( 'limit' => 10 ) );
	$draft   = call_user_func( $prepara, array( 'post_id' => 77, 'desti' => 'calendari' ) );
	$idor    = call_user_func( $prepara, array( 'post_id' => 999 ) );
	$tipus   = call_user_func( $prepara, array( 'post_id' => 78 ) );
	$inexist = call_user_func( $prepara, array( 'post_id' => 12345 ) );
	$protegit_sense = call_user_func( $prepara, array( 'post_id' => 79 ) );
	$GLOBALS['sdp_test_caps_objecte']['edit_post:79'] = true;
	$protegit_amb   = call_user_func( $prepara, array( 'post_id' => 79 ) );
	$llarg          = call_user_func( $prepara, array( 'post_id' => 80 ) );
	$llarg_entrada  = call_user_func( $prepara, array( 'titol' => str_repeat( 'ñ', 299 ) . 'x', 'contingut_html' => '<h2>' . str_repeat( 'ü', 500 ) . '</h2><p>a' . str_repeat( 'ò', 500 ) . '</p>' ) );

	$utf8 = static function ( $resultat ) {
		if ( ! is_array( $resultat ) ) {
			return false;
		}
		return false !== json_encode( $resultat );
	};
	$mesures = static function ( $resultat ) {
		if ( ! is_array( $resultat ) ) {
			return null;
		}
		$seccions = array();
		foreach ( $resultat['seccions_h3'] as $seccio ) {
			$seccions[] = array(
				'titol_h3' => mb_strlen( $seccio['titol_h3'], 'UTF-8' ),
				'resum'    => isset( $seccio['resum'] ) ? mb_strlen( $seccio['resum'], 'UTF-8' ) : 0,
			);
		}
		return array(
			'h1'          => mb_strlen( $resultat['h1'], 'UTF-8' ),
			'subtitol_h2' => mb_strlen( $resultat['subtitol_h2'], 'UTF-8' ),
			'entradilla'  => mb_strlen( $resultat['entradilla'], 'UTF-8' ),
			'seccions'    => $seccions,
		);
	};

	echo json_encode(
		array(
			'desa_anonim_codi'    => is_wp_error( $desa_anonim ) ? $desa_anonim->code : '',
			'set_crides_anon'     => $set_crides_anon,
			'desat_ok'            => true === $desat,
			'desa_illegible_codi' => is_wp_error( $desa_illegible ) ? $desa_illegible->code : '',
			'desa_nom_dolent'     => is_wp_error( $desa_nom_dolent ) ? $desa_nom_dolent->code : '',
			'desa_crlf'           => is_wp_error( $desa_crlf ) ? $desa_crlf->code : '',
			'desa_nomes_lectura'  => is_wp_error( $desa_nomes_lectura ) ? $desa_nomes_lectura->code : '',
			'set_crides_final'    => $set_crides_final,
			'options_writes'      => $GLOBALS['sdp_test_options_writes'],
			'llegit_wp72'         => $llegit_wp72,
			'estat_wp72'          => $estat_wp72,
			'proveidor_wp72'      => array(
				'nom'      => $proveidor_wp72['nom'],
				'empremta' => $proveidor_wp72['empremta'],
			),
			'empremta_rotada'     => $proveidor_rotat['empremta'],
			'empremta_mascara'    => hash_hmac( 'sha256', '[secret:' . $deepl . ']', wp_salt( 'auth' ) ),
			'actiu_wp72'          => $actiu_wp72,
			'estats'              => $estats,
			'valors'              => $valors,
			'nom_invalid'         => $nom_invalid,
			'crides_nom_invalid'  => $crides_nom,
			'salut_ok'            => array( 'status' => $salut_ok['status'], 'label' => $salut_ok['label'], 'description' => $salut_ok['description'] ),
			'salut_illegible'     => array( 'status' => $salut_illegible['status'], 'label' => $salut_illegible['label'], 'description' => $salut_illegible['description'] ),
			'actiu_illegible'     => $actiu_illegible,
			'salut_no_disponible' => array( 'status' => $salut_no_disponible['status'], 'label' => $salut_no_disponible['label'] ),
			'estat_no_disponible' => $estat_no_disponible,
			'llegit_no_disponible' => $llegit_no_disponible,
			'crides_no_disponible' => $crides_api,
			'llegit_env'          => $llegit_env,
			'estat_env'           => $estat_env,
			'llegit_const'        => $llegit_const,
			'constant_buida'      => $constant_buida,
			'estat_constant_buida' => $estat_constant_buida,
			'entorn_crlf'         => $entorn_crlf,
			'estat_entorn_crlf'   => $estat_entorn_crlf,
			'categories'          => array_keys( $GLOBALS['sdp_test_categories'] ),
			'abilities'           => array_keys( $GLOBALS['sdp_test_abilities'] ),
			'esquemes'            => array_map(
				static function ( $cfg ) {
					return array(
						'input'  => $cfg['input_schema'],
						'output' => $cfg['output_schema'],
					);
				},
				$GLOBALS['sdp_test_abilities']
			),
			'perm_anon'           => $perm_anon,
			'perm_editor'         => $perm_editor,
			'diag'                => $diag,
			'audit'               => $audit,
			'draft'               => $draft,
			'idor_bloquejat'      => is_wp_error( $idor ),
			'tipus_intern'        => is_wp_error( $tipus ) ? $tipus->code : $tipus,
			'inexistent'          => is_wp_error( $inexist ) ? $inexist->code : $inexist,
			'protegit_sense'      => is_wp_error( $protegit_sense ) ? $protegit_sense->code : $protegit_sense,
			'protegit_amb'        => is_wp_error( $protegit_amb ) ? $protegit_amb->code : $protegit_amb['h1'],
			'llarg_json'          => $utf8( $llarg ),
			'llarg_mesures'       => $mesures( $llarg ),
			'llarg_entrada_json'  => $utf8( $llarg_entrada ),
			'llarg_entrada_mesures' => $mesures( $llarg_entrada ),
		),
		JSON_PARTIAL_OUTPUT_ON_ERROR
	);
	exit( 0 );
}

if ( 'manteniment_503' === $cas ) {
	define( 'SDP_MODE_MANTENIMENT_FINS', time() + 900 );
	define( 'SDP_MANTENIMENT_RUTES_REST', array( '/sdp-proves/v1/webhook', '/', '', 42 ) );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';

	/* R26.2: l'exempció ja no mira el camí (REQUEST_URI): només is_robots(), WP-CLI i
	   manage_options. Cada cas posa el camí i l'is_robots() que en faria el nucli. */
	$exempta = static function ( $uri, $is_robots ) {
		$_SERVER['REQUEST_URI']        = $uri;
		$GLOBALS['sdp_test_is_robots'] = $is_robots;
		$exempt                        = socdepoble_enxufe_manteniment_503_peticio_exempta();
		$GLOBALS['sdp_test_is_robots'] = false;
		return $exempt;
	};
	$exempt_is_robots   = $exempta( '/', true );
	$exempt_robots_uri  = $exempta( '/robots.txt', true );
	$exempt_robots_fals = $exempta( '/carpeta/robots.txt', false );
	$visitant_portada   = $exempta( '/', false );
	$visitant_wpjson    = $exempta( '/wp-json/wp/v2/posts', false );

	$rest = array();
	foreach ( array( '/wp/v2/posts', '/', '/sdp-proves/v1/webhook', '/sdp-proves/v1/webhook/stripe', '/sdp-proves/v1/webhookx', '/sdp-proves/v1' ) as $ruta ) {
		$resposta = socdepoble_enxufe_manteniment_503_rest( null, null, new SDP_Peticio_REST( $ruta ) );
		$rest[ $ruta ] = $resposta instanceof WP_REST_Response
			? array( 'status' => $resposta->status, 'headers' => $resposta->headers, 'codi' => $resposta->data['code'] )
			: $resposta;
	}
	$previ = new WP_REST_Response( array( 'de' => 'un altre filtre' ), 200 );
	$rest_previ = socdepoble_enxufe_manteniment_503_rest( $previ, null, new SDP_Peticio_REST( '/wp/v2/posts' ) ) === $previ;

	$GLOBALS['sdp_test_caps'] = array( 'manage_options' => true );
	$exempt_admin = socdepoble_enxufe_manteniment_503_peticio_exempta();
	$rest_admin   = socdepoble_enxufe_manteniment_503_rest( null, null, new SDP_Peticio_REST( '/wp/v2/posts' ) );

	$restants = socdepoble_enxufe_manteniment_503_segons_restants();
	$html     = socdepoble_enxufe_manteniment_503_html( $restants );

	echo json_encode(
		array(
			'exempt_is_robots'   => $exempt_is_robots,
			'exempt_robots_uri'  => $exempt_robots_uri,
			'exempt_robots_fals' => $exempt_robots_fals,
			'visitant_portada'   => $visitant_portada,
			'visitant_wpjson'    => $visitant_wpjson,
			'exempt_admin'       => $exempt_admin,
			'rest'               => $rest,
			'rest_previ'         => $rest_previ,
			'rest_admin'         => $rest_admin,
			'restants'           => $restants,
			'capcaleres'         => array(
				'normal' => socdepoble_enxufe_manteniment_503_capcaleres( $restants ),
				'curt'   => socdepoble_enxufe_manteniment_503_capcaleres( 5 ),
				'llarg'  => socdepoble_enxufe_manteniment_503_capcaleres( 900000000 ),
			),
			'html'               => $html,
		)
	);
	exit( 0 );
}

if ( 'manteniment_inactiu' === $cas ) {
	define( 'SDP_MODE_MANTENIMENT_FINS', gmdate( 'Y-m-d\TH:i:s\Z', time() - 60 ) );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	socdepoble_enxufe_manteniment_503_resposta();
	$cos = ob_get_clean();
	$rest = socdepoble_enxufe_manteniment_503_rest( null, null, new SDP_Peticio_REST( '/wp/v2/posts' ) );

	echo json_encode(
		array(
			'status'      => $GLOBALS['sdp_test_status'],
			'nocache'     => $GLOBALS['sdp_test_nocache'],
			'cos'         => $cos,
			'rest'        => $rest,
			'crides_caps' => $GLOBALS['sdp_test_crides_caps'],
			'restants'    => socdepoble_enxufe_manteniment_503_segons_restants(),
		)
	);
	exit( 0 );
}

if ( 'manteniment_front_actiu' === $cas ) {
	define( 'SDP_MODE_MANTENIMENT_FINS', time() + 900 );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
	// $argv[2]: REQUEST_URI cru (per defecte /agenda/); $argv[3] = «robots»: el nucli l'encamina com a robots.txt.
	$_SERVER['REQUEST_URI']        = $argv[2] ?? '/agenda/';
	$GLOBALS['sdp_test_is_robots'] = 'robots' === ( $argv[3] ?? '' );

	// La resposta acaba amb exit: l'estat i el cos es lligen a l'apagada.
	register_shutdown_function(
		static function () {
			$cos = ob_get_clean();
			echo json_encode(
				array(
					'status'  => $GLOBALS['sdp_test_status'],
					'nocache' => $GLOBALS['sdp_test_nocache'],
					'cos_503' => false !== strpos( (string) $cos, '<meta name="robots" content="noindex,noarchive">' ),
				)
			);
		}
	);
	ob_start();
	socdepoble_enxufe_manteniment_503_resposta();
	echo 'NO HAURIA D’ARRIBAR ACÍ';
	exit( 0 );
}

if ( 'manteniment_wp_cli' === $cas ) {
	define( 'WP_CLI', true );
	define( 'SDP_MODE_MANTENIMENT_FINS', time() + 900 );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
	$rest = socdepoble_enxufe_manteniment_503_rest( null, null, new SDP_Peticio_REST( '/wp/v2/posts' ) );
	echo json_encode(
		array(
			'rest'        => $rest instanceof WP_REST_Response ? $rest->status : $rest,
			'portada'     => socdepoble_enxufe_manteniment_503_peticio_exempta(),
			'crides_caps' => $GLOBALS['sdp_test_crides_caps'],
		)
	);
	exit( 0 );
}

if ( 'manteniment_dates' === $cas ) {
	// La constant és una data relativa: el manteniment no s'ha d'activar mai.
	define( 'SDP_MODE_MANTENIMENT_FINS', 'tomorrow 04:00' );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
	$restants_relatiu = socdepoble_enxufe_manteniment_503_segons_restants();
	$rest_relatiu     = socdepoble_enxufe_manteniment_503_rest( null, null, new SDP_Peticio_REST( '/wp/v2/posts' ) );
	$valors           = array(
		'relatiu_dema'      => 'tomorrow 04:00',
		'relatiu_hores'     => '+2 hours',
		'relatiu_ara'       => 'now + 1 day',
		'sense_zona_espai'  => '2030-01-01 04:00:00',
		'sense_zona_t'      => '2030-01-01T04:00:00',
		'z'                 => '2030-01-01T04:00:00Z',
		'z_sense_segons'    => '2030-01-01T04:00Z',
		'desplacament_mes'  => '2030-01-01T05:00:00+01:00',
		'desplacament_menys' => '2030-01-01T00:30:00-03:30',
		'dia_inexistent'    => '2030-02-30T04:00:00Z',
		'hora_24'           => '2030-01-01T24:00:00Z',
		'zona_fora'         => '2030-01-01T04:00:00+15:00',
		'salt_final'        => "2030-01-01T04:00:00Z\n",
		'xifres'            => ' 1893470400 ',
		'enter'             => 1893470400,
		'negatiu'           => -5,
		'decimal'           => 1893470400.5,
		'exponent'          => '1e10',
		'llista'            => array( 1893470400 ),
	);
	$fins = array();
	foreach ( $valors as $nom => $valor ) {
		$fins[ $nom ] = socdepoble_enxufe_manteniment_503_fins( $valor );
	}
	echo json_encode(
		array(
			'restants_relatiu' => $restants_relatiu,
			'rest_relatiu'     => $rest_relatiu,
			'fins'             => $fins,
		)
	);
	exit( 0 );
}

/* Onada R29 · El lang de la pàgina 503 segons el locale del lloc i si el text ix traduït. */
if ( 'manteniment_503_llengua' === $cas ) {
	define( 'SDP_MODE_MANTENIMENT_FINS', time() + 900 );
	require_once $arrel_wp . '/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
	$catala = array( 'Scheduled maintenance in progress' => 'Manteniment tècnic programat en curs' );
	$casos  = array(
		'en_us'          => array( 'en_US', array() ),
		'es_sense_trad'  => array( 'es_ES', array() ),
		'ca_traduit'     => array( 'ca', $catala ),
		'valencia'       => array( 'ca_valencia', $catala ),
		'locale_hostil'  => array( 'ca"><script>x</script>', $catala ),
	);
	$html = array();
	foreach ( $casos as $nom => list( $locale, $traduccions ) ) {
		$GLOBALS['sdp_test_locale']      = $locale;
		$GLOBALS['sdp_test_traduccions'] = $traduccions;
		$html[ $nom ]                    = socdepoble_enxufe_manteniment_503_html( 900 );
	}
	echo json_encode( array( 'html' => $html ) );
	exit( 0 );
}

if ( 'wp72_keyring_sense_constant' === $cas ) {
	// WordPress 7.2 amb el keyring d'un drop-in secrets.php: disponible sense WP_SECRETS_KEY a wp-config.php.
	$GLOBALS['sdp_test_wp_version'] = '7.2';
	sdp_test_carrega_secrets_api_wp72();
	function wp_register_ability_category( $slug, $args ) {}
	function wp_register_ability( $id, $args ) {}
	require_once $arrel_wp . '/includes/secrets-wp72.php';
	require_once $arrel_wp . '/includes/traduccio.php';
	require_once $arrel_wp . '/includes/salut.php';
	require_once $arrel_wp . '/includes/abilities-mcp.php';

	$deepl = 'socdepoble/deepl-api-key';
	$salut = static function () {
		$r = socdepoble_enxufe_prova_secrets_wp72();
		return array( 'status' => $r['status'], 'label' => $r['label'], 'description' => $r['description'] );
	};
	$GLOBALS['sdp_test_secrets'][ $deepl ] = 'deepl-keyring-amfitrio-555';
	$keyring = array(
		'disponible'  => socdepoble_enxufe_secrets_wp72_disponible(),
		'clau_activa' => socdepoble_enxufe_secrets_wp72_clau_activa(),
		'llegit'      => socdepoble_enxufe_deepl_clau(),
		'estat'       => socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', $deepl ),
		'proveidor'   => socdepoble_enxufe_traduccio_proveidor_actiu(),
		'diag'        => array_intersect_key( socdepoble_enxufe_ability_diagnostica(), array_flip( array( 'proveidor_traduccio', 'wp_secrets_key_activa', 'secrets_api_disponible' ) ) ),
		'salut'       => $salut(),
	);

	// Llegible però inservible: buit o amb salt de línia. No és un error de desxifrat.
	$invalides = array();
	foreach ( array( 'crlf' => "deepl-bona\r\nX-Injectada: 1", 'buit' => '', 'espais' => '   ' ) as $nom => $valor ) {
		$GLOBALS['sdp_test_secrets'][ $deepl ] = $valor;
		$invalides[ $nom ] = array(
			'estat' => socdepoble_enxufe_estat_secret( 'DEEPL_API_KEY', $deepl ),
			'valor' => socdepoble_enxufe_deepl_clau(),
		);
	}
	$GLOBALS['sdp_test_secrets'][ $deepl ] = "deepl-bona\r\nX-Injectada: 1";
	$salut_invalida = $salut();
	$GLOBALS['sdp_test_caps'] = array( 'manage_options' => true, 'manage_secrets' => true );
	$desa_damunt_invalida     = socdepoble_enxufe_desa_secret_wp72( $deepl, 'deepl-nova-777' );
	$GLOBALS['sdp_test_caps'] = array();
	$llegit_despres           = socdepoble_enxufe_deepl_clau();

	// Sense l'API disponible ni WP_SECRETS_KEY: el text diu el motor que de veres tradueix.
	$GLOBALS['sdp_test_api_disponible'] = false;
	$crides_abans                       = $GLOBALS['sdp_test_get_crides'];
	$salut_apertium                     = $salut();
	$proveidor_apertium                 = socdepoble_enxufe_traduccio_proveidor_actiu();
	define( 'DEEPL_API_KEY', 'deepl-des-de-constant-111' );
	$salut_deepl_constant = $salut();
	$proveidor_constant   = socdepoble_enxufe_traduccio_proveidor_actiu();
	$crides_sense_api     = $GLOBALS['sdp_test_get_crides'] - $crides_abans;

	echo json_encode(
		array(
			'keyring'              => $keyring,
			'invalides'            => $invalides,
			'salut_invalida'       => $salut_invalida,
			'desa_damunt_invalida' => true === $desa_damunt_invalida ? true : ( is_wp_error( $desa_damunt_invalida ) ? $desa_damunt_invalida->code : $desa_damunt_invalida ),
			'llegit_despres'       => $llegit_despres,
			'salut_apertium'       => $salut_apertium,
			'proveidor_apertium'   => $proveidor_apertium,
			'salut_deepl_constant' => $salut_deepl_constant,
			'proveidor_constant'   => $proveidor_constant,
			'crides_sense_api'     => $crides_sense_api,
		),
		JSON_UNESCAPED_UNICODE
	);
	exit( 0 );
}

if ( 'wp72_sense_funcio_disponibilitat' === $cas ) {
	// Un nucli amb wp_get_secret però sense wp_is_secrets_api_available: la constant en fa de reserva.
	$GLOBALS['sdp_test_wp_version']          = '7.2';
	$GLOBALS['sdp_test_sense_disponibilitat'] = true;
	sdp_test_carrega_secrets_api_wp72();
	require_once $arrel_wp . '/includes/secrets-wp72.php';
	$sense_constant = socdepoble_enxufe_secrets_wp72_disponible();
	define( 'WP_SECRETS_KEY', 'clau-mestra-xifrat-wp72-demo-32bytes' );
	echo json_encode(
		array(
			'funcio_absent'  => ! function_exists( 'wp_is_secrets_api_available' ),
			'sense_constant' => $sense_constant,
			'amb_constant'   => socdepoble_enxufe_secrets_wp72_disponible(),
		)
	);
	exit( 0 );
}

if ( 'wp_antic_amb_clau' === $cas ) {
	// WordPress 6.9 amb WP_SECRETS_KEY ja posada abans d'actualitzar: cap consell de restaurar-la.
	$GLOBALS['sdp_test_wp_version'] = '6.9';
	define( 'WP_SECRETS_KEY', 'clau-preparada-per-a-la-7-2' );
	require_once $arrel_wp . '/includes/secrets-wp72.php';
	require_once $arrel_wp . '/includes/traduccio.php';
	require_once $arrel_wp . '/includes/salut.php';
	$r = socdepoble_enxufe_prova_secrets_wp72();
	echo json_encode(
		array(
			'proves' => array_keys( socdepoble_enxufe_proves_salut( array( 'direct' => array() ) )['direct'] ),
			'salut'  => array( 'status' => $r['status'], 'label' => $r['label'], 'description' => $r['description'] ),
		),
		JSON_UNESCAPED_UNICODE
	);
	exit( 0 );
}

if ( 'preimportacio_cost' === $cas ) {
	/* El cost de la preimportació amb HTML hostil de 64 KiB. Cal executar-ho amb
	   «php -d pcre.jit=0»: sense JIT, els patrons «<h…>(.*?)</h…>» d'abans eren O(n²). */
	$GLOBALS['sdp_test_wp_version'] = '7.2';
	function wp_register_ability_category( $slug, $args ) {}
	function wp_register_ability( $id, $args ) {}
	require_once $arrel_wp . '/includes/secrets-wp72.php';
	require_once $arrel_wp . '/includes/traduccio.php';
	require_once $arrel_wp . '/includes/salut.php';
	require_once $arrel_wp . '/includes/abilities-mcp.php';
	$GLOBALS['sdp_test_caps'] = array( 'edit_posts' => true );

	$GLOBALS['sdp_test_caps'] = array( 'edit_posts' => true, 'read_post' => true );
	$hostils = array(
		'h2_tancament_fals'  => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<h2></h>', 8192 ) ),
		'h2_sense_tancar'    => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<h2>', 16384 ) ),
		'h1_sense_tancar'    => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<h1>', 16384 ) ),
		'obertura_llarga'    => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<h2', 21845 ) . '>' ),
		'tancament_al_final' => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<h3>', 16383 ) . '</h3>' ),
		'script_sense_tancar' => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<script>', 8192 ) ),
		'style_sense_tancar' => array( 'titol' => 'Prova', 'contingut_html' => str_repeat( '<style>', 9362 ) ),
		'titol_del_post'     => array( 'post_id' => 81 ),
	);
	$ms = array();
	$ok = array();
	foreach ( $hostils as $nom => $entrada ) {
		$inici      = hrtime( true );
		$resultat   = socdepoble_enxufe_ability_prepara_pedra_seca( $entrada );
		$ms[ $nom ] = intdiv( hrtime( true ) - $inici, 1000000 );
		$ok[ $nom ] = is_array( $resultat ) && false !== json_encode( $resultat );
	}

	/* Mateixa semàntica que els patrons d'abans: comparació diferencial amb cadenes
	   pseudoaleatòries curtes (llavor fixa), on el cost de PCRE no importa. */
	$diferencies = null;
	if ( function_exists( 'socdepoble_enxufe_ability_etiquetes_h' ) ) {
		$peces = array( '<h1>', '<h2>', '<h3 class="x">', '</h2>', '</h3>', '</H2>', '<H4>', '</h4>', '<h2', '</h', '>', 'a', 'é', '<p>', '</p>', '<h2x>', '<h7>', '</h2 >', "\n", '<h2 t="</h2>">', '<h1-a>', '<h5>', '</h5>', '</h1>', '<', '/', 'h', '2', '<h2_>', '<h6 >', '</h6>', '<h3', '</h3', 'x>', '<<h2>>' );
		mt_srand( 26 );
		$diferencies = 0;
		$tots        = array( 1, 2, 3, 4, 5, 6 );
		for ( $i = 0; $i < 4000; $i++ ) {
			$s   = '';
			$len = mt_rand( 0, 30 );
			for ( $k = 0; $k < $len; $k++ ) {
				$s .= $peces[ mt_rand( 0, count( $peces ) - 1 ) ];
			}
			$et      = socdepoble_enxufe_ability_etiquetes_h( $s );
			$ref_h2  = preg_match( '/<h2\b[^>]*>(.*?)<\/h2>/is', $s, $m ) ? $m[1] : null;
			$h2      = socdepoble_enxufe_ability_casa_h( $s, $et, array( 2 ), array( 2 ) );
			$sense   = '';
			$des_de  = 0;
			foreach ( socdepoble_enxufe_ability_casa_h( $s, $et, $tots, $tots ) as $e ) {
				$sense .= substr( $s, $des_de, $e[0] - $des_de ) . ' ';
				$des_de = $e[1];
			}
			$sense .= substr( $s, $des_de );
			preg_match_all( '/<h[2-4]\b[^>]*>(.*?)<\/h[2-4]>/is', $s, $mm );
			$seccions = array();
			foreach ( socdepoble_enxufe_ability_casa_h( $s, $et, array( 2, 3, 4 ), array( 2, 3, 4 ) ) as $e ) {
				$seccions[] = $e[2];
			}
			if ( $ref_h2 !== ( isset( $h2[0] ) ? $h2[0][2] : null )
				|| preg_replace( '/<h[1-6]\b[^>]*>.*?<\/h[1-6]>/is', ' ', $s ) !== $sense
				|| $mm[1] !== $seccions ) {
				++$diferencies;
			}
		}
	}

	// El text pla lineal contra el patró de wp_strip_all_tags() del nucli.
	$diferencies_text = null;
	if ( function_exists( 'socdepoble_enxufe_ability_text_pla' ) ) {
		$peces = array( '<script>', '<SCRIPT type="x">', '</script>', '</SCRIPT>', '<style>', '</style>', '<style', '<script', '</scrip>', '</script >', '>', 'a', 'ñ', '<p>', '</p>', '<b>', ' ', "\n", '<scripts>', '</styles>', '<', '/', 's', '<!-- c -->', '<script x="</script>">', '<styl>' );
		mt_srand( 262 );
		$diferencies_text = 0;
		for ( $i = 0; $i < 4000; $i++ ) {
			$s   = '';
			$len = mt_rand( 0, 30 );
			for ( $k = 0; $k < $len; $k++ ) {
				$s .= $peces[ mt_rand( 0, count( $peces ) - 1 ) ];
			}
			if ( wp_strip_all_tags( $s ) !== socdepoble_enxufe_ability_text_pla( $s ) ) {
				++$diferencies_text;
			}
		}
	}

	echo json_encode(
		array(
			'jit'              => (bool) ini_get( 'pcre.jit' ),
			'ms'               => $ms,
			'ok'               => $ok,
			'diferencies'      => $diferencies,
			'diferencies_text' => $diferencies_text,
		)
	);
	exit( 0 );
}

fwrite( STDERR, "Cas desconegut: {$cas}\n" );
exit( 2 );
