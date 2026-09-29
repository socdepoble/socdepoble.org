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
		restore_current_blog();
	}
	delete_site_option( 'socdepoble_enxufe_canal' );
} else {
	delete_option( 'socdepoble_enxufe' );
	delete_option( 'socdepoble_enxufe_canal' );
}
