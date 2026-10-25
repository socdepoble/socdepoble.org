<?php
/**
 * Executa el plugin i la plantilla reals sense carregar una BD de WordPress.
 * Els doubles només representen les fronteres del host: consulta, contingut,
 * hooks i cues d'actius. No prova el motor de permisos ni el layout del navegador.
 *
 * Modes ($cas['mode']): pantalla (per defecte), doble (una segona còpia en
 * una altra carpeta, $argv[2]), xarxa (els ganxos d'activació de la còpia,
 * amb $cas['de_xarxa'] com a $network_wide), readme (finestra de detalls),
 * blocs (plantilla de blocs), l10n (el .l10n.php executat), bloc (el registre
 * i el render del bloc com en WordPress 5.8, que no llig el camp "render" de
 * block.json) i idioma (les traduccions: $cas['llengua'], i amb
 * $cas['controlador'] hi ha WP_Translation_Controller, com des de la 6.5;
 * $cas['plugin_locale'] força la llengua del plugin i $cas['canvia'] és un
 * filtre gettext general, d'un tema o d'un plugin, que canvia uns textos).
 * Multilloc: $cas['multisite'], actius (active_plugins per lloc; el 1 és el
 * principal, el de l'administració de xarxa) i xarxa (active_sitewide_plugins).
 */

error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) {
	throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia );
} );

define( 'ABSPATH', __DIR__ . '/' );
define( 'WP_PLUGIN_DIR', dirname( $argv[1] ) );
$cas = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
$hooks = array();
$activacions = array();
$transients_esborrats = array();
$plantilles_blocs = array();
$blocs = array();
$shortcodes = array();
$traduccions_script = array();
$kses = array();
$textdomains = array();
if ( isset( $cas['plantilla_actual'] ) ) {
	$_wp_current_template_id = $cas['plantilla_actual'];
}

/** wp_die() no torna mai: l'excepció en porta els arguments a la prova. */
final class FixtureWpDie extends Exception {
	public $titol;
	public $args;
	public function __construct( $missatge, $titol, $args ) {
		parent::__construct( (string) $missatge );
		$this->titol = $titol;
		$this->args  = $args;
	}
}
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
function plugin_basename( $fitxer ) { return basename( dirname( $fitxer ) ) . '/' . basename( $fitxer ); }
function plugins_url( $cami, $fitxer ) { return 'https://host.example/plugins/' . basename( dirname( $fitxer ) ) . '/' . $cami; }
function register_activation_hook( $fitxer, $callback ) {
	$GLOBALS['activacions'][] = plugin_basename( $fitxer );
	add_action( 'activate_' . plugin_basename( $fitxer ), $callback );
}
function wp_die( $missatge = '', $titol = '', $args = array() ) { throw new FixtureWpDie( $missatge, $titol, $args ); }
// Com translate() de WordPress sense cap domini carregat: el filtre general i, després, el del domini.
function __( $text, $domini ) {
	$traduccio = apply_filters( 'gettext', $text, $text, $domini );
	return apply_filters( 'gettext_' . $domini, $traduccio, $text, $domini );
}
function _x( $text, $context, $domini ) {
	$traduccio = apply_filters( 'gettext_with_context', $text, $text, $context, $domini );
	return apply_filters( 'gettext_with_context_' . $domini, $traduccio, $text, $context, $domini );
}
function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
// Com WordPress: esc_html no torna a escapar les entitats que ja ho estan.
function esc_html( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8', false ); }
function esc_url( $text ) { return esc_attr( $text ); }
function esc_html__( $text, $domini ) { return esc_attr( __( $text, $domini ) ); }
function wp_kses_post( $html ) { return $html; }
function is_multisite() { return ! empty( $GLOBALS['cas']['multisite'] ); }
function trailingslashit( $cami ) { return rtrim( $cami, '/\\' ) . '/'; }
// Canal comprovat ara mateix: cap crida de xarxa; sense clau, el canal és null.
function get_site_option( $nom, $defecte = false ) {
	if ( 'active_sitewide_plugins' === $nom ) {
		return $GLOBALS['cas']['xarxa'] ?? $defecte;
	}
	return 'socdepoble_enxufe_canal' === $nom ? array( 'comprovat' => time() ) : $defecte;
}
function get_sites( $args ) { return array_keys( $GLOBALS['cas']['actius'] ?? array( 1 => array() ) ); }
function get_blog_option( $lloc, $nom, $defecte = false ) {
	return 'active_plugins' === $nom ? ( $GLOBALS['cas']['actius'][ $lloc ] ?? $defecte ) : $defecte;
}
function delete_site_transient( $nom ) {
	$GLOBALS['transients_esborrats'][] = $nom;
	return true;
}
function get_file_data( $fitxer, $capcaleres ) {
	$text   = (string) file_get_contents( $fitxer, false, null, 0, 8192 );
	$valors = array();
	foreach ( $capcaleres as $clau => $nom ) {
		$valors[ $clau ] = preg_match( '/^(?:[ \t]*<\?php)?[ \t\/*#@]*' . preg_quote( $nom, '/' ) . ':(.*)$/mi', $text, $m ) ? trim( $m[1] ) : '';
	}
	return $valors;
}
if ( ! empty( $cas['registre_blocs'] ) ) {
	// WordPress 6.7+; sense el cas, la funció no existix, com en 6.5 i 6.6.
	function register_block_template( $nom, $args ) {
		$GLOBALS['plantilles_blocs'][ $nom ] = $args;
		return true;
	}
}
if ( ! empty( $cas['controlador'] ) ) {
	// WordPress 6.5+; sense el cas, la classe no existix, com de la 5.8 a la 6.4.
	final class WP_Translation_Controller {}
}
// Com WordPress 5.8-6.0: register_block_type només desa els arguments; el camp "render" de block.json no es llig.
function register_block_type( $cami, $args = array() ) {
	$GLOBALS['blocs'][] = array( $cami, $args );
	return true;
}
function add_shortcode( $nom, $callback ) { $GLOBALS['shortcodes'][ $nom ] = $callback; }
function wp_set_script_translations( $handle, $domini, $cami ) { $GLOBALS['traduccions_script'][] = array( $handle, $domini, $cami ); return true; }
function get_block_wrapper_attributes( $extra = array() ) { return 'class="wp-block-socdepoble-app ' . esc_attr( $extra['class'] ?? '' ) . '"'; }
// La llista permesa arriba a la prova; el filtrat real de wp_kses és de WordPress.
function wp_kses( $html, $permes ) {
	$GLOBALS['kses'][] = array_keys( $permes );
	return $html;
}
// Cap .mo enlloc: load_plugin_textdomain no carrega res, com de la 5.8 a la 6.4 amb el paquet.
function load_plugin_textdomain( $domini, $obsolet = false, $cami = false ) {
	$GLOBALS['textdomains'][] = array( $domini, $cami );
	return false;
}
function is_textdomain_loaded( $domini ) { return ! empty( $GLOBALS['cas']['carregat'] ); }
function determine_locale() { return $GLOBALS['cas']['llengua'] ?? 'ca'; }
function sanitize_text_field( $text ) { return trim( strip_tags( $text ) ); }
function sanitize_title( $text ) { return strtolower( trim( $text ) ); }
// L'administració de xarxa és el lloc principal: el seu active_plugins és el del lloc 1.
function get_option( $nom, $defecte = false ) { return 'active_plugins' === $nom ? get_blog_option( 1, $nom, $defecte ) : $defecte; }
function wp_json_encode( $valor, $flags = 0 ) { return json_encode( $valor, $flags ); }
function shortcode_atts( $defectes, $atributs, $nom ) { return array_merge( $defectes, array_intersect_key( (array) $atributs, $defectes ) ); }
function current_user_can( $capacitat ) { return in_array( $capacitat, $GLOBALS['cas']['capacitats'] ?? array(), true ); }
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

/** activate_plugin(): els ganxos d'activació d'una carpeta; null si cap no fa wp_die. */
function fixture_activa( $carpeta, $de_xarxa ) {
	try {
		do_action( 'activate_' . plugin_basename( $carpeta . '/socdepoble-enxufe.php' ), $de_xarxa );
	} catch ( FixtureWpDie $e ) {
		return array( 'missatge' => $e->getMessage(), 'titol' => $e->titol, 'args' => $e->args );
	}
	return null;
}

require $argv[1] . '/socdepoble-enxufe.php';
$mode = $cas['mode'] ?? 'pantalla';

if ( 'xarxa' === $mode ) {
	echo json_encode(
		array(
			'mort'       => fixture_activa( $argv[1], ! empty( $cas['de_xarxa'] ) ),
			'transients' => $transients_esborrats,
		),
		JSON_THROW_ON_ERROR
	);
	exit;
}

if ( 'doble' === $mode ) {
	// La primera còpia ja és carregada; la segona entra com a plugin_sandbox_scrape().
	if ( ! empty( $cas['sandbox'] ) ) {
		define( 'WP_SANDBOX_SCRAPING', true );
	}
	require $argv[2] . '/socdepoble-enxufe.php';
	$mort = fixture_activa( $argv[2], false );
	ob_start();
	do_action( 'all_admin_notices' );
	$avis = ob_get_clean();
	echo json_encode(
		array(
			'fitxer'      => SOCDEPOBLE_ENXUFE_FITXER,
			'activacions' => $activacions,
			'mort'        => $mort,
			'avis'        => $avis,
			'avisos'      => count( $hooks['all_admin_notices'][10] ?? array() ),
		),
		JSON_THROW_ON_ERROR
	);
	exit;
}

if ( 'readme' === $mode ) {
	echo json_encode(
		array(
			'seccions' => socdepoble_enxufe_seccions_readme(),
			// Gauntlet 261025_0545 (MISSED P3) · la fitxa respon per l'slug del canal propi, no pel del directori.
			'info'     => socdepoble_enxufe_plugins_api( false, 'plugin_information', (object) array( 'slug' => SOCDEPOBLE_ENXUFE_SLUG_CANAL ) ),
			'aliena'   => socdepoble_enxufe_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'akismet' ) ),
			'html'     => isset( $cas['linies'] ) ? socdepoble_enxufe_html_readme( $cas['linies'] ) : '',
		),
		JSON_THROW_ON_ERROR
	);
	exit;
}

if ( 'blocs' === $mode ) {
	socdepoble_enxufe_registra_plantilla_blocs();
	$init = array();
	foreach ( $hooks['init'] ?? array() as $grup ) {
		foreach ( $grup as list( $callback ) ) {
			$init[] = $callback;
		}
	}
	echo json_encode( array( 'plantilles' => $plantilles_blocs, 'init' => $init ), JSON_THROW_ON_ERROR );
	exit;
}

if ( 'l10n' === $mode ) {
	// El fitxer que WordPress carrega per al text domain 'socdepoble'.
	echo json_encode( require $argv[1] . '/languages/socdepoble-ca.l10n.php', JSON_THROW_ON_ERROR );
	exit;
}

if ( 'bloc' === $mode ) {
	socdepoble_enxufe_registra_actius();
	socdepoble_enxufe_registra_entrades();
	list( $cami, $args ) = $blocs[0];
	$callback = $args['render_callback'] ?? null;
	// WordPress passa ($attributes, $content, $block) al render_callback.
	$html = is_callable( $callback ) ? call_user_func( $callback, $cas['atributs'], '', null ) : null;
	// Des de la 6.1, el camp "render" de block.json, amb $attributes a l'abast.
	$attributes = $cas['atributs'];
	ob_start();
	require $argv[1] . '/includes/bloc/render.php';
	$render_php = ob_get_clean();
	echo json_encode(
		array(
			'cami'        => $cami,
			'callback'    => is_string( $callback ) ? $callback : null,
			'html'        => $html,
			'render_php'  => $render_php,
			'kses'        => $kses,
			'scripts'     => array_keys( $cua_scripts ),
			'shortcodes'  => $shortcodes,
			'traduccions' => $traduccions_script,
		),
		JSON_THROW_ON_ERROR
	);
	exit;
}

if ( 'idioma' === $mode ) {
	if ( isset( $cas['plugin_locale'] ) ) {
		add_filter(
			'plugin_locale',
			static function ( $llengua, $domini ) {
				return 'socdepoble' === $domini ? $GLOBALS['cas']['plugin_locale'] : $llengua;
			},
			10,
			2
		);
	}
	$canvia = static function ( $traduccio, $text ) {
		return $GLOBALS['cas']['canvia'][ $text ] ?? $traduccio;
	};
	add_filter( 'gettext', $canvia, 10, 2 );
	add_filter( 'gettext_with_context', $canvia, 10, 2 );
	socdepoble_enxufe_carrega_traduccions();
	$llengues = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'languages/socdepoble-' . determine_locale();
	echo json_encode(
		array(
			'textdomains' => $textdomains,
			'text'        => __( 'Village name', 'socdepoble' ),
			'escapat'     => esc_html__( 'Sóc de Poble · full screen', 'socdepoble' ),
			'context'     => _x( 'Embeds the Sóc de Poble app with the universal host markup.', 'block description', 'socdepoble' ),
			'desconegut'  => __( 'A text that is not in the catalogue', 'socdepoble' ),
			'altre'       => __( 'Village name', 'akismet' ),
			// Els filtres de WordPress amb el fitxer que buscaria per a esta llengua.
			'mo'          => apply_filters( 'load_textdomain_mofile', $llengues . '.mo', 'socdepoble' ),
			'mo_altre'    => apply_filters( 'load_textdomain_mofile', $llengues . '.mo', 'akismet' ),
			'json'        => apply_filters( 'load_script_translation_file', $llengues . '-socdepoble-app-editor-script.json', 'socdepoble-app-editor-script', 'socdepoble' ),
		),
		JSON_THROW_ON_ERROR
	);
	exit;
}

socdepoble_enxufe_registra_actius();
$plantilla = apply_filters( 'template_include', $cas['entrada'] ?? '/tema/pagina.php' );
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
		'classes' => apply_filters( 'body_class', array() ),
		'estils' => $inline_estils[ SOCDEPOBLE_ENXUFE_HANDLE ] ?? array(),
		'cua_estils' => array_keys( $cua_estils ),
	),
	JSON_THROW_ON_ERROR
);
