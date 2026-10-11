<?php
/**
 * Executa includes/seo.php real (i marcatge.php, d'on pren el sanejador de
 * rutes i d'etiquetes) sense carregar WordPress. Onada 11 (261010; prompt
 * 261010_1730, tasca 7). Els doubles només representen les fronteres del
 * host: ganxos, superglobals, la URL de la pàgina, el nom del lloc i
 * l'escapat. No prova cap tema ni cap connector de SEO real.
 *
 * $argv[1] és la carpeta del plugin: una còpia temporal amb includes/ i, si
 * el cas en porta, dist/seo-routes.json. El cas arriba en JSON per stdin:
 *   filtre   (bool)   registra socdepoble_enxufe_seo → true;
 *   filtreCom (mixed) registra socdepoble_enxufe_seo amb este valor (1, 'true'…),
 *                     per a provar que només val el true estricte;
 *   mode     (string) registra socdepoble_enxufe_ruta_a_url amb este valor
 *                     (Onada 12, 261011, D-19: l'OpenGraph només actua amb
 *                     'parametre'); sense la clau, el valor per defecte de
 *                     marcatge.php ('fragment');
 *   get      (array)  el $_GET de la petició;
 *   singular (bool)   is_singular(); per defecte, cert;
 *   blogname (string) el nom del lloc;
 *   query    (string) la cadena de consulta crua ($_SERVER['QUERY_STRING']); amb
 *                     ella, $_GET ix de parse_str(), com a PHP de veres, i `get`
 *                     no compta. Sense ella, es construïx a partir de `get`;
 *   senseQuery (bool) el servidor no dona QUERY_STRING;
 *   contingut (string) el post_content de la pàgina consultada; per defecte,
 *                     una pàgina amb el shortcode [socdepoble_app];
 *   presentadors (array) noms de classe dels presentadors de Yoast que arriben
 *                     a wpseo_frontend_presenters (es creen buides);
 *   wpIncludes (string) carpeta wp-includes d'un WordPress de veres (el de
 *                     WordPress Studio): es carrega shortcodes.php REAL, i
 *                     has_shortcode() és el del nucli. L'escapat i el sanejat
 *                     continuen sent doubles (vegeu el límit més avall);
 *   wpseo, rankmath, jetpack, aioseo (bool) simulen el connector present;
 *   resol    (array)  rutes per a socdepoble_enxufe_seo_resol();
 *   imatges  (array)  valors per a socdepoble_enxufe_seo_imatge().
 */

error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) {
	throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
} );

define( 'ABSPATH', __DIR__ . '/' );
$cas   = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
$hooks = array();

/** Com wp_magic_quotes(): WordPress afig barres a les superglobals i el codi les lleva amb wp_unslash(). */
function fixture_afig_barres( $valor ) {
	if ( is_array( $valor ) ) {
		return array_map( 'fixture_afig_barres', $valor );
	}
	return is_string( $valor ) ? addslashes( $valor ) : $valor;
}
/* La consulta: $_GET i la cadena crua diuen el mateix, com en una petició de
   veres. WordPress també afig barres a $_SERVER (wp_magic_quotes). */
if ( isset( $cas['query'] ) ) {
	parse_str( $cas['query'], $analitzat );
	$_GET                    = fixture_afig_barres( $analitzat );
	$_SERVER['QUERY_STRING'] = addslashes( $cas['query'] );
} else {
	$_GET                    = fixture_afig_barres( $cas['get'] ?? array() );
	$_SERVER['QUERY_STRING'] = addslashes( http_build_query( $cas['get'] ?? array(), '', '&', PHP_QUERY_RFC3986 ) );
}
if ( ! empty( $cas['senseQuery'] ) ) {
	unset( $_SERVER['QUERY_STRING'] );
}

define( 'SOCDEPOBLE_ENXUFE_FITXER', $argv[1] . '/socdepoble-enxufe.php' );
define( 'SOCDEPOBLE_ENXUFE_SEO_RUTES', 'dist/seo-routes.json' );

// Els connectors de SEO, només la seua presència: el que seo.php comprova.
if ( ! empty( $cas['wpseo'] ) ) {
	define( 'WPSEO_VERSION', '99.0' );
}
if ( ! empty( $cas['rankmath'] ) ) {
	class RankMath {}
}
if ( ! empty( $cas['jetpack'] ) ) {
	class Jetpack {}
}
if ( ! empty( $cas['aioseo'] ) ) {
	function aioseo() {
		return null;
	}
}

function add_filter( $nom, $callback, $prioritat = 10, $arguments = 1 ) {
	$GLOBALS['hooks'][ $nom ][ $prioritat ][] = array( $callback, $arguments );
}
function add_action( $nom, $callback, $prioritat = 10, $arguments = 1 ) { add_filter( $nom, $callback, $prioritat, $arguments ); }
// Com WordPress: el primer argument arriba al callback ('' si no n'hi ha cap).
function do_action( $nom, ...$arguments ) {
	$arguments = $arguments ? $arguments : array( '' );
	$callbacks = $GLOBALS['hooks'][ $nom ] ?? array();
	ksort( $callbacks );
	foreach ( $callbacks as $grup ) {
		foreach ( $grup as list( $callback, $quants ) ) {
			$callback( ...array_slice( $arguments, 0, $quants ) );
		}
	}
}
function apply_filters( $nom, $valor, ...$arguments ) {
	$callbacks = $GLOBALS['hooks'][ $nom ] ?? array();
	ksort( $callbacks );
	foreach ( $callbacks as $grup ) {
		foreach ( $grup as list( $callback, $quants ) ) {
			$valor = $callback( ...array_slice( array_merge( array( $valor ), $arguments ), 0, $quants ) );
		}
	}
	return $valor;
}
function plugin_dir_path( $fitxer ) { return dirname( $fitxer ) . '/'; }
function plugins_url( $cami, $fitxer ) { return 'https://host.example/plugins/' . basename( dirname( $fitxer ) ) . '/' . $cami; }

/* Onada 12 (261011; correcció S6) · Amb `wpIncludes`, has_shortcode és el de
   WordPress (shortcodes.php es carrega sol: només definix funcions i la taula
   de shortcodes). LÍMIT, provat i abandonat després de dos intents: les
   funcions d'escapat i de sanejat de formatting.php (esc_url, esc_html,
   sanitize_text_field) no es poden carregar soles. Demanen is_utf8_charset(),
   _canonical_charset() i wp_allowed_protocols(), que viuen a functions.php, i
   eixe fitxer arrossega option.php i la base de dades. Per això esc_url,
   sanitize_text_field i add_query_arg continuen sent els doubles de davall:
   més simples que els de veres (esc_url no filtra protocols, sanitize_text_field
   no lleva el contingut de <script>). Una prova amb l'escapat real demana un
   WordPress arrancat (wp-load.php), que esta fixture no fa. */
if ( isset( $cas['wpIncludes'] ) ) {
	require rtrim( $cas['wpIncludes'], '/' ) . '/shortcodes.php';
}
function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
function esc_html( $text ) { return esc_attr( $text ); }
function esc_url( $text ) { return esc_attr( $text ); }
function esc_url_raw( $url, $protocols = null ) {
	$esquema = strtolower( (string) parse_url( $url, PHP_URL_SCHEME ) );
	return ( null === $protocols || in_array( $esquema, $protocols, true ) ) ? $url : '';
}
function sanitize_text_field( $text ) { return trim( strip_tags( (string) $text ) ); }
function sanitize_title( $text ) { return strtolower( trim( $text ) ); }
function wp_unslash( $valor ) {
	if ( is_array( $valor ) ) {
		return array_map( 'wp_unslash', $valor );
	}
	return is_string( $valor ) ? stripslashes( $valor ) : $valor;
}
if ( ! function_exists( 'has_shortcode' ) ) {
	// Sense el nucli: el shortcode amb el seu nom sencer, com el troba get_shortcode_regex().
	function has_shortcode( $contingut, $etiqueta ) {
		return 1 === preg_match( '/\[' . preg_quote( $etiqueta, '/' ) . '(?=[\s\]\/])/', (string) $contingut );
	}
}
// Com el nucli (blocks.php): el comentari del bloc amb el nom sencer i un espai darrere.
function has_block( $nom, $contingut = null ) {
	return is_string( $contingut ) && false !== strpos( $contingut, '<!-- wp:' . $nom . ' ' );
}
function is_singular() { return $GLOBALS['cas']['singular'] ?? true; }
// La pàgina consultada: per defecte, una pàgina amb el shortcode de l'App.
function get_queried_object() {
	return is_singular() ? (object) array( 'post_content' => $GLOBALS['cas']['contingut'] ?? "<p>Benvinguts</p>\n[socdepoble_app]" ) : null;
}
function get_permalink() { return 'https://host.example/comunitat/'; }
function home_url( $cami = '' ) { return 'https://host.example' . $cami; }
function add_query_arg( $clau, $valor, $url ) { return $url . ( false === strpos( $url, '?' ) ? '?' : '&' ) . $clau . '=' . $valor; }
function get_bloginfo( $camp = 'name', $filtre = 'raw' ) { return $GLOBALS['cas']['blogname'] ?? 'Gent de la Torre'; }

if ( ! empty( $cas['filtre'] ) ) {
	add_filter( 'socdepoble_enxufe_seo', static function () { return true; } );
}
if ( array_key_exists( 'filtreCom', $cas ) ) {
	add_filter( 'socdepoble_enxufe_seo', static function () { return $GLOBALS['cas']['filtreCom']; } );
}
if ( isset( $cas['mode'] ) ) {
	add_filter( 'socdepoble_enxufe_ruta_a_url', static function () { return $GLOBALS['cas']['mode']; } );
}

require $argv[1] . '/includes/marcatge.php';
require $argv[1] . '/includes/seo.php';

// Amb el nucli de veres, has_shortcode() només troba els shortcodes registrats (WordPress ho fa a init).
if ( function_exists( 'add_shortcode' ) ) {
	add_shortcode( 'socdepoble_app', 'socdepoble_enxufe_shortcode' );
}

/* Els presentadors de Yoast que el cas demana, amb el seu nom de classe sencer
   (espai de noms inclòs): seo.php els tria pel nom. */
$presentadors = array( 'a', 'b' );
if ( isset( $cas['presentadors'] ) ) {
	$presentadors = array();
	foreach ( $cas['presentadors'] as $classe ) {
		$tall = strrpos( $classe, '\\' );
		// phpcs:ignore Squiz.PHP.Eval.Discouraged -- fixture de proves: declara una classe buida en un espai de noms.
		eval( 'namespace ' . substr( $classe, 0, $tall ) . '; class ' . substr( $classe, $tall + 1 ) . ' {}' );
		$presentadors[] = new $classe();
	}
}

// L'ordre de WordPress: l'acció wp, el títol del document i la capçalera.
do_action( 'wp' );
$titol = apply_filters( 'pre_get_document_title', '' );
ob_start();
do_action( 'wp_head' );
$head = ob_get_clean();

$taula = socdepoble_enxufe_seo_taula();
$resol = array();
foreach ( $cas['resol'] ?? array() as $ruta ) {
	$resol[ $ruta ] = null === $taula ? null : socdepoble_enxufe_seo_resol( $taula, $ruta );
}
$imatges = array();
foreach ( $cas['imatges'] ?? array() as $imatge ) {
	$imatges[ $imatge ] = socdepoble_enxufe_seo_imatge( $imatge );
}

echo json_encode(
	array(
		'ruta'         => socdepoble_enxufe_seo_ruta_demanada(),
		'fila'         => socdepoble_enxufe_seo_fila(),
		'titol'        => $titol,
		'head'         => $head,
		'ganxos'       => array_keys( $hooks ),
		'presentadors' => array_map(
			static function ( $presentador ) { return is_object( $presentador ) ? get_class( $presentador ) : $presentador; },
			array_values( apply_filters( 'wpseo_frontend_presenters', $presentadors ) )
		),
		'rankmath'     => apply_filters( 'rank_math/frontend/show_opengraph', true ),
		'jetpack'      => apply_filters( 'jetpack_enable_open_graph', true ),
		'aioseo'       => apply_filters( 'aioseo_disable', false ),
		'taula'        => $taula,
		'resol'        => $resol,
		'imatges'      => $imatges,
	),
	JSON_THROW_ON_ERROR
);
