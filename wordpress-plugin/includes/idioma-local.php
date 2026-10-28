<?php
/**
 * Traduccions locals del plugin (languages/), només al canal propi.
 *
 * Revisió de WordPress.org (261027) · Els revisors demanen que la variant del
 * directori no porte traduccions pròpies ni crida load_plugin_textdomain
 * (WordPress la desaconsella des de la 4.6, i Plugin Check ho avisa): les
 * servix translate.wordpress.org i WordPress les carrega soles. Per això l'empaquetador deixa este fitxer i languages/
 * fora de la variant del directori, i el fitxer principal només l'inclou si hi
 * és. El paquet del canal propi, en canvi, porta les traduccions, i WordPress
 * (6.5+) només llig les de languages/ si load_plugin_textdomain li'n dona la
 * ruta: sense, només mira WP_LANG_DIR.
 *
 * Va després de idioma.php, que definix socdepoble_enxufe_fitxer_ca.
 *
 * Viu fora del fitxer principal perquè este no declare cap funció: PHP les
 * vincula en compilar el fitxer, abans que s'execute la guarda de doble còpia,
 * i una segona còpia del plugin acabaria en «Cannot redeclare».
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * El catàleg de languages/ d'una llengua (amb la correspondència
 * ca_valencia → ca de idioma.php), o array() si no n'hi ha cap. Cada llengua
 * es llig una sola vegada per petició.
 *
 * Sense el pegat de la 6.2.1 (CVE-2023-2745), el wp_lang de wp-login.php
 * arriba a determine_locale() sense sanejar, i plugin_locale pot vindre d'un
 * altre plugin, com la llengua d'un switch_to_locale(). include resol els «..»
 * sobre el text de la ruta; is_readable() en POSIX només els para si la
 * carpeta de davant no existix, no si existix ni en Windows: només un codi de
 * llengua entra a la ruta que s'inclou.
 *
 * @param string $llengua Locale del plugin (plugin_locale).
 * @return array Missatges del .l10n.php, per clau.
 */
function socdepoble_enxufe_cataleg_local( $llengua ) {
	static $catalegs = array();
	$llengua = (string) $llengua;
	if ( 1 !== preg_match( '/^[A-Za-z0-9_-]+$/D', $llengua ) ) {
		return array();
	}
	if ( ! array_key_exists( $llengua, $catalegs ) ) {
		$fitxer                = socdepoble_enxufe_fitxer_ca( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'languages/socdepoble-' . $llengua . '.l10n.php', 'socdepoble' );
		$dades                 = is_readable( $fitxer ) ? include $fitxer : null;
		$catalegs[ $llengua ] = is_array( $dades ) && is_array( $dades['messages'] ?? null ) ? $dades['messages'] : array();
	}
	return $catalegs[ $llengua ];
}

/**
 * Carrega el text domain des de languages/.
 *
 * El paquet porta les traduccions en el format .l10n.php, que WordPress només
 * llig des de la 6.5 (WP_Translation_Controller), i cap .mo. Abans, el mateix
 * array es servix pels filtres gettext_socdepoble i
 * gettext_with_context_socdepoble (5.5+): l'administració i les dades del bloc
 * no ixen en anglés de la 5.8 a la 6.4.
 *
 * La llengua és la de load_plugin_textdomain (plugin_locale) i seguix la
 * viva: switch_to_locale() i restore_*_locale() (4.7+) avisen amb
 * change_locale, en els dos sentits (pla 261028_1526, P1-09, GN-R08). Per
 * això els filtres es registren encara que la llengua d'init no tinga
 * catàleg (un lloc en_US que canvia a ca el troba) i encara que un paquet de
 * translate.wordpress.org ja haja carregat el domini: el que el paquet
 * traduïx mana, i el catàleg només posa el que ningú no ha traduït, també en
 * una llengua canviada que el paquet no porta.
 */
function socdepoble_enxufe_carrega_traduccions() {
	load_plugin_textdomain( 'socdepoble', false, dirname( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) ) . '/languages' );
	if ( class_exists( 'WP_Translation_Controller' ) ) {
		return;
	}
	$inicial = (string) apply_filters( 'plugin_locale', determine_locale(), 'socdepoble' );
	$actual  = $inicial;
	/* Tornar a la llengua d'init (la pila buida) és tornar a $inicial, la de
	   determine_locale(), que a l'administració és la de la persona i no la
	   del lloc que porta change_locale. */
	add_action(
		'change_locale',
		static function ( $llengua ) use ( &$actual, $inicial ) {
			$actual = is_locale_switched() ? (string) apply_filters( 'plugin_locale', (string) $llengua, 'socdepoble' ) : $inicial;
		}
	);
	/* Només el que encara no està traduït: el filtre general gettext va
	   abans, i si un tema o un plugin ja hi ha canviat el text, mana el seu,
	   com amb un .mo de veritat. */
	$tradueix = static function ( $traduccio, $text, $clau ) use ( &$actual ) {
		if ( $traduccio !== $text ) {
			return $traduccio;
		}
		$missatges = socdepoble_enxufe_cataleg_local( $actual );
		$valor     = $missatges[ $clau ] ?? null;
		return is_string( $valor ) && '' !== $valor ? $valor : $traduccio;
	};
	add_filter(
		'gettext_socdepoble',
		static function ( $traduccio, $text ) use ( $tradueix ) {
			return $tradueix( $traduccio, $text, $text );
		},
		10,
		2
	);
	// Les claus amb context són «context\4text», com les de WordPress.
	add_filter(
		'gettext_with_context_socdepoble',
		static function ( $traduccio, $text, $context ) use ( $tradueix ) {
			return $tradueix( $traduccio, $text, $context . "\4" . $text );
		},
		10,
		3
	);
}
add_action( 'init', 'socdepoble_enxufe_carrega_traduccions', 1 );
