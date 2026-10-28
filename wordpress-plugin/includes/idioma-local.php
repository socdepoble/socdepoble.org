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
 * Carrega el text domain des de languages/.
 *
 * El paquet porta les traduccions en el format .l10n.php, que WordPress només
 * llig des de la 6.5 (WP_Translation_Controller), i cap .mo. Abans, si cap
 * altra font (un paquet de translate.wordpress.org) no ha carregat el domini,
 * el mateix array es servix pels filtres gettext_socdepoble i
 * gettext_with_context_socdepoble (5.5+): l'administració i les dades del bloc
 * no ixen en anglés de la 5.8 a la 6.4.
 *
 * La llengua és la de load_plugin_textdomain (plugin_locale), fixada a init:
 * un switch_to_locale() posterior no canvia el catàleg de la reserva.
 */
function socdepoble_enxufe_carrega_traduccions() {
	load_plugin_textdomain( 'socdepoble', false, dirname( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) ) . '/languages' );
	if ( class_exists( 'WP_Translation_Controller' ) || is_textdomain_loaded( 'socdepoble' ) ) {
		return;
	}
	/* Sense el pegat de la 6.2.1 (CVE-2023-2745), el wp_lang de wp-login.php
	   arriba a determine_locale() sense sanejar, i plugin_locale pot vindre
	   d'un altre plugin. include resol els «..» sobre el text de la ruta;
	   is_readable() en POSIX només els para si la carpeta de davant no
	   existix, no si existix ni en Windows: només un codi de llengua entra a
	   la ruta que s'inclou. */
	$llengua = (string) apply_filters( 'plugin_locale', determine_locale(), 'socdepoble' );
	if ( 1 !== preg_match( '/^[A-Za-z0-9_-]+$/D', $llengua ) ) {
		return;
	}
	$fitxer = socdepoble_enxufe_fitxer_ca( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'languages/socdepoble-' . $llengua . '.l10n.php', 'socdepoble' );
	$dades  = is_readable( $fitxer ) ? include $fitxer : null;
	if ( ! is_array( $dades ) || ! is_array( $dades['messages'] ?? null ) ) {
		return;
	}
	$missatges = $dades['messages'];
	/* Només el que encara no està traduït: el filtre general gettext va
	   abans, i si un tema o un plugin ja hi ha canviat el text, mana el seu,
	   com amb un .mo de veritat. */
	$tradueix = static function ( $traduccio, $text, $clau ) use ( $missatges ) {
		if ( $traduccio !== $text ) {
			return $traduccio;
		}
		$valor = $missatges[ $clau ] ?? null;
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
