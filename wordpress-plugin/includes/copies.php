<?php
/**
 * Les altres còpies del plugin: altres carpetes amb socdepoble-enxufe.php
 * actives en algun lloc d'esta instal·lació (un zip sense socdepoble/
 * a l'arrel s'instal·la en una carpeta nova, al costat de la vella).
 *
 * El carreguen el fitxer principal, per a refusar l'activació a tota la
 * xarxa, i uninstall.php, per a conservar les opcions compartides. Només
 * declara funcions: uninstall.php l'inclou amb el plugin inactiu, quan no hi
 * ha cap constant del plugin, i el ganxo d'activació el registra el principal.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Rutes relatives (com les d'active_plugins) de les còpies actives que no són
 * $propia: en este lloc i, en multilloc, a tota la xarxa i en cada lloc.
 *
 * @param string $propia Ruta relativa de la còpia que pregunta.
 * @return string[]
 */
function socdepoble_enxufe_altres_copies_actives( $propia ) {
	$sufix  = '/socdepoble-enxufe.php';
	$actius = (array) get_option( 'active_plugins', array() );
	if ( is_multisite() ) {
		$actius = array_merge( $actius, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
		foreach ( get_sites(
			array(
				'fields' => 'ids',
				'number' => 0,
			)
		) as $lloc ) {
			$actius = array_merge( $actius, (array) get_blog_option( $lloc, 'active_plugins', array() ) );
		}
	}
	$altres = array();
	foreach ( $actius as $plugin ) {
		if ( is_string( $plugin ) && $propia !== $plugin && substr( $plugin, -strlen( $sufix ) ) === $sufix ) {
			$altres[] = $plugin;
		}
	}
	return array_values( array_unique( $altres ) );
}

/**
 * Ganxo d'activació: refusa l'activació a tota la xarxa si una altra còpia
 * està activa en algun lloc, abans que WordPress l'afija a
 * active_sitewide_plugins. L'administració de xarxa només carrega els plugins
 * de xarxa i els del lloc principal: una còpia activa només en un lloc
 * secundari no hi entra i la guarda de doble còpia del principal no la veu.
 * Si l'activació passara, cada petició d'eixe lloc carregaria primer esta
 * còpia, de xarxa, i després l'altra; una còpia vella, sense guarda, peta amb
 * «Cannot redeclare». En un sol lloc, l'altra còpia d'eixe lloc o de la xarxa
 * es carrega en la mateixa petició i ja la refusa la guarda.
 *
 * @param bool $network_wide Activació a tota la xarxa.
 */
function socdepoble_enxufe_refusa_xarxa_amb_copies( $network_wide ) {
	if ( ! $network_wide || ! is_multisite() ) {
		return;
	}
	$carpetes = array();
	foreach ( socdepoble_enxufe_altres_copies_actives( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) ) as $plugin ) {
		$carpetes[] = WP_PLUGIN_DIR . '/' . dirname( $plugin );
	}
	if ( array() === $carpetes ) {
		return;
	}
	wp_die(
		esc_html(
			sprintf(
				/* translators: 1: folders of the copies already active, 2: folder of this copy. */
				__( 'Sóc de Poble — Enxufe is already active from the folder %1$s on at least one site of this network. Deactivate that copy on every site before activating this one, in %2$s, for the whole network.', 'socdepoble' ),
				implode( ', ', $carpetes ),
				dirname( SOCDEPOBLE_ENXUFE_FITXER )
			)
		),
		esc_html__( 'Sóc de Poble — Enxufe', 'socdepoble' ),
		array( 'back_link' => true )
	);
}
