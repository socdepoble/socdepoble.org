<?php
/**
 * Executa el plugin i la plantilla reals sense carregar una BD de WordPress.
 * Els doubles només representen les fronteres del host: consulta, contingut,
 * hooks i cues d'actius. No prova el motor de permisos ni el layout del navegador.
 */

error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) {
	throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
} );

define( 'ABSPATH', __DIR__ . '/' );
$cas = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
$hooks = array();
$scripts = array();
$estils = array();
$cua_scripts = array();
$cua_estils = array();
$inline_scripts = array();
$inline_estils = array();
$esdeveniments = array();
$posicio = 0;
$post = (object) array( 'post_content' => ! empty( $cas['protegit'] ) ? 'CONTINGUT_PROTEGIT_NO_PUBLICABLE' : '[socdepoble_app]' );

function add_filter( $nom, $callback, $prioritat = 10, $arguments = 1 ) {
	$GLOBALS['hooks'][ $nom ][ $prioritat ][] = array( $callback, $arguments );
}
function add_action( $nom, $callback, $prioritat = 10, $arguments = 1 ) { add_filter( $nom, $callback, $prioritat, $arguments ); }
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
function plugin_basename( $fitxer ) { return basename( dirname( $fitxer ) ) . '/' . basename( $fitxer ); }
function plugins_url( $cami, $fitxer ) { return 'https://host.example/plugins/' . basename( dirname( $fitxer ) ) . '/' . $cami; }
function register_activation_hook( $fitxer, $callback ) {}
function __( $text, $domini ) { return $text; }
function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $text ) { return esc_attr( $text ); }
function esc_html__( $text, $domini ) { return esc_attr( $text ); }
function sanitize_text_field( $text ) { return trim( strip_tags( $text ) ); }
function sanitize_title( $text ) { return strtolower( trim( $text ) ); }
function get_option( $nom, $defecte = false ) { return $defecte; }
function wp_json_encode( $valor, $flags = 0 ) { return json_encode( $valor, $flags ); }
function shortcode_atts( $defectes, $atributs, $nom ) { return array_merge( $defectes, array_intersect_key( (array) $atributs, $defectes ) ); }
function current_user_can( $capacitat ) { return false; }
function wp_register_script( $handle, $src, $deps, $versio, $footer ) { $GLOBALS['scripts'][ $handle ] = $src; }
function wp_register_style( $handle, $src, $deps, $versio ) { $GLOBALS['estils'][ $handle ] = $src; }
function wp_enqueue_script( $handle ) { $GLOBALS['cua_scripts'][ $handle ] = true; }
function wp_enqueue_style( $handle ) { $GLOBALS['cua_estils'][ $handle ] = true; }
function wp_add_inline_script( $handle, $codi, $posicio ) { $GLOBALS['inline_scripts'][ $handle ][] = $codi; }
function wp_add_inline_style( $handle, $css ) { $GLOBALS['inline_estils'][ $handle ][] = $css; }
function is_page() { return $GLOBALS['cas']['pagina'] ?? true; }
function get_queried_object_id() { return $GLOBALS['cas']['id'] ?? 7; }
function get_page_template_slug( $id ) { return $GLOBALS['cas']['plantilla'] ?? ''; }
function language_attributes() { echo 'lang="ca"'; }
function bloginfo( $camp ) { echo 'UTF-8'; }
function body_class( $classe ) { echo 'class="' . esc_attr( $classe ) . '"'; }
function have_posts() { return 0 === $GLOBALS['posicio']; }
function the_post() { ++$GLOBALS['posicio']; }
function get_header() { throw new RuntimeException( 'La plantilla ha carregat la capçalera del tema.' ); }
function get_footer() { throw new RuntimeException( 'La plantilla ha carregat el peu del tema.' ); }
function wp_head() {
	$GLOBALS['esdeveniments'][] = 'head';
	echo '<meta name="fixture-head" content="hook-conservat">';
	foreach ( array_keys( $GLOBALS['cua_estils'] ) as $handle ) {
		echo '<style>' . implode( "\n", $GLOBALS['inline_estils'][ $handle ] ?? array() ) . '</style>';
	}
}
function wp_body_open() {
	$GLOBALS['esdeveniments'][] = 'body_open';
	echo '<div data-hook="body-open"></div>';
}
function the_content() {
	$GLOBALS['esdeveniments'][] = 'content';
	// WordPress decidix què es pot publicar; la plantilla ha de delegar-li-ho.
	if ( ! empty( $GLOBALS['cas']['protegit'] ) ) {
		echo '<form class="post-password-form"><input type="password" name="post_password"></form>';
		return;
	}
	for ( $i = 0; $i < ( $GLOBALS['cas']['instancies'] ?? 1 ); ++$i ) {
		echo socdepoble_enxufe_shortcode( array( 'ruta_inicial' => '/disseny' ) );
	}
}
function wp_footer() {
	$GLOBALS['esdeveniments'][] = 'footer';
	foreach ( array_keys( $GLOBALS['cua_scripts'] ) as $handle ) {
		foreach ( $GLOBALS['inline_scripts'][ $handle ] ?? array() as $codi ) {
			echo '<script>' . $codi . '</script>';
		}
		echo '<script src="' . esc_url( $GLOBALS['scripts'][ $handle ] ) . '"></script>';
	}
	echo '<div data-hook="footer"></div>';
}

require $argv[1] . '/socdepoble-enxufe.php';
socdepoble_enxufe_registra_actius();
$plantilla = apply_filters( 'template_include', '/tema/pagina.php' );
$plantilles = apply_filters( 'theme_page_templates', array( 'pagina.php' => 'Tema' ) );
$html = '';
if ( ! empty( $cas['render'] ) ) {
	if ( '/tema/pagina.php' === $plantilla ) {
		throw new RuntimeException( 'La prova de render no ha seleccionat la plantilla.' );
	}
	ob_start();
	require $plantilla;
	$html = ob_get_clean();
}
echo json_encode(
	array(
		'plantilla' => $plantilla,
		'plantilles' => $plantilles,
		'html' => $html,
		'events' => $esdeveniments,
		'scripts' => array_keys( $cua_scripts ),
		'declaracions' => array_sum( array_map( 'count', $inline_scripts ) ),
	),
	JSON_THROW_ON_ERROR
);
