<?php
/**
 * Traduccions locals del plugin (languages/). Al directori de WordPress.org
 * les servix translate.wordpress.org i esta crida no fa res de més.
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
 */
function socdepoble_enxufe_carrega_traduccions() {
	load_plugin_textdomain( 'socdepoble', false, dirname( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) ) . '/languages' );
}
add_action( 'init', 'socdepoble_enxufe_carrega_traduccions', 1 );
