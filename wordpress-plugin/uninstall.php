<?php
/**
 * Desinstal·lació: esborra el que el plugin ha desat a la base de dades i
 * res més. Les dades de l'App (comptes, missatges, publicacions) viuen al
 * backend de Sóc de Poble, no a WordPress, i no es toquen.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

if ( is_multisite() ) {
	foreach ( get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	) as $socdepoble_enxufe_lloc ) {
		switch_to_blog( $socdepoble_enxufe_lloc );
		delete_option( 'socdepoble_enxufe' );
		socdepoble_enxufe_neteja_traduccio();
		restore_current_blog();
	}
	delete_site_option( 'socdepoble_enxufe_canal' );
} else {
	delete_option( 'socdepoble_enxufe' );
	socdepoble_enxufe_neteja_traduccio();
	delete_option( 'socdepoble_enxufe_canal' );
}


/** Només dades temporals del traductor, mai transients d'altres plugins. */
function socdepoble_enxufe_neteja_traduccio() {
	global $wpdb;
	delete_option( 'sdp_traduccio_pressupost' );
	delete_option( 'sdp_traduccio_lock' );
	$wpdb->query( $wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like( '_transient_sdp_tr_' ) . '%',
		$wpdb->esc_like( '_transient_timeout_sdp_tr_' ) . '%',
		$wpdb->esc_like( 'sdp_tr_lock_' ) . '%'
	) );
}
