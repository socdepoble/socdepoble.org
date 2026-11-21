<?php
/**
 * Desinstal·lació: esborra el que el plugin ha desat a la base de dades i
 * res més. Les dades de l'App (comptes, missatges, publicacions) viuen al
 * backend de Sóc de Poble, no a WordPress, i no es toquen.
 *
 * DUES CÒPIES. Les opcions són de la base de dades, no de la carpeta: les
 * compartix qualsevol altra còpia del plugin (un zip sense socdepoble/
 * a l'arrel s'instal·la en una carpeta nova, al costat de la vella). Si una
 * altra còpia continua activa en este lloc, en un altre lloc de la xarxa o a
 * tota la xarxa, esborrar esta carpeta no esborra res: els Ajustos, l'estat
 * del canal i el pressupost del traductor són de la còpia que queda. Les
 * còpies les busca includes/copies.php, el mateix recorregut que refusa
 * l'activació a tota la xarxa.
 * La funció de neteja i l'include van dins d'un if perquè PHP no les vincule
 * dues vegades: esborrar dues còpies alhora inclou dos uninstall.php en la
 * mateixa petició, i sense el if el segon peta amb «Cannot redeclare». Pel
 * mateix motiu, si una còpia nova està carregada, s'usa la seua funció.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

if ( ! function_exists( 'socdepoble_enxufe_altres_copies_actives' ) ) {
	require __DIR__ . '/includes/copies.php';
}

if ( ! function_exists( 'socdepoble_enxufe_neteja_traduccio' ) ) {
	/** Només dades temporals del traductor, mai transients d'altres plugins. */
	function socdepoble_enxufe_neteja_traduccio() {
		global $wpdb;
		delete_option( 'sdp_traduccio_pressupost' );
		delete_option( 'sdp_traduccio_lock' );
		$wpdb->query( $wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- desinstal·lació: transients i panys propis per prefix, que cap API de WordPress no esborra.
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s",
			$wpdb->esc_like( '_transient_sdp_tr_' ) . '%',
			$wpdb->esc_like( '_transient_timeout_sdp_tr_' ) . '%',
			$wpdb->esc_like( 'sdp_tr_lock_' ) . '%'
		) );
	}
}

// Helper independent: una còpia antiga pot haver definit neteja_traduccio en esta petició.
if ( ! function_exists( 'socdepoble_enxufe_neteja_secrets_wp72' ) ) {
	/** Elimina només els dos secrets propis del lloc actual, si l'API existix. */
	function socdepoble_enxufe_neteja_secrets_wp72() {
		if ( function_exists( 'wp_delete_secret' ) ) {
			/* v1.2.18 · Gauntlet R1 (L4-03) · Un proveïdor pot llançar, com preveu secrets-wp72.php:
			   cada secret pel seu compte, i l'excepció no talla l'altre secret, les opcions dels altres
			   llocs, restore_current_blog ni el canal. */
			try {
				wp_delete_secret( 'socdepoble/deepl-api-key' );
			} catch ( Throwable $e ) {}
			try {
				wp_delete_secret( 'socdepoble/traduccio-url-clau' );
			} catch ( Throwable $e ) {}
		}
	}
}

// WP_UNINSTALL_PLUGIN és la ruta relativa de la còpia que s'esborra.
if ( array() !== socdepoble_enxufe_altres_copies_actives( WP_UNINSTALL_PLUGIN ) ) {
	return;
}

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
		socdepoble_enxufe_neteja_secrets_wp72();
		restore_current_blog();
	}
	delete_site_option( 'socdepoble_enxufe_canal' );
} else {
	delete_option( 'socdepoble_enxufe' );
	socdepoble_enxufe_neteja_traduccio();
	socdepoble_enxufe_neteja_secrets_wp72();
	delete_option( 'socdepoble_enxufe_canal' );
}
