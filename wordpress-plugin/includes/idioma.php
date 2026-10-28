<?php
/**
 * La correspondència ca_valencia → ca dels fitxers de traducció.
 *
 * Revisió de WordPress.org (261027) · La càrrega del text domain i la reserva
 * de davall de la 6.5 viuen a idioma-local.php, que la variant del directori
 * no porta. Ací només queda la correspondència, que va a totes dues: al canal
 * propi servix els fitxers de languages/ (idioma-local.php en dona la ruta); al
 * directori, només el JSON de l'editor del bloc d'un paquet 'ca' de
 * translate.wordpress.org. Les cadenes PHP no hi arriben: sense un fitxer de
 * ca_valencia ni una ruta pròpia, WordPress no carrega el domini i el filtre
 * load_textdomain_mofile no s'executa.
 *
 * Viu fora del fitxer principal perquè este no declare cap funció: PHP les
 * vincula en compilar el fitxer, abans que s'execute la guarda de doble còpia,
 * i una segona còpia del plugin acabaria en «Cannot redeclare».
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Les variants del català de WordPress (ca_valencia, «Català (Valencià)»)
 * fan servir els fitxers de 'ca', que ja són en valencià: WordPress busca
 * {domini}-{llengua} i no torna a provar amb 'ca'. Només per al domini del
 * plugin i només si la variant no té fitxer propi (un paquet de
 * translate.wordpress.org, per exemple).
 *
 * Va al filtre load_textdomain_mofile (des de la 6.5, el .mo canviat porta
 * WordPress al .l10n.php germà de 'ca'), al load_script_translation_file de
 * l'editor del bloc i, al canal propi, a la reserva de davall de la 6.5
 * (idioma-local.php).
 *
 * @param string|false $fitxer Ruta d'un fitxer de traducció (.mo, .l10n.php o .json).
 * @param string       $domini Text domain.
 * @return string|false La mateixa ruta o la del fitxer de 'ca'.
 */
function socdepoble_enxufe_fitxer_ca( $fitxer, $domini ) {
	if ( 'socdepoble' !== $domini || ! is_string( $fitxer ) || is_readable( $fitxer ) ) {
		return $fitxer;
	}
	// Des de la 6.5, WordPress prova primer el .l10n.php germà del .mo.
	if ( '.mo' === substr( $fitxer, -3 ) && is_readable( substr( $fitxer, 0, -3 ) . '.l10n.php' ) ) {
		return $fitxer;
	}
	$nom = basename( $fitxer );
	$ca  = preg_replace( '/^socdepoble-ca_[A-Za-z]+(?=[.-])/', 'socdepoble-ca', $nom );
	return is_string( $ca ) && $ca !== $nom ? dirname( $fitxer ) . '/' . $ca : $fitxer;
}
add_filter( 'load_textdomain_mofile', 'socdepoble_enxufe_fitxer_ca', 10, 2 );
add_filter(
	'load_script_translation_file',
	static function ( $fitxer, $handle, $domini ) {
		return socdepoble_enxufe_fitxer_ca( $fitxer, $domini );
	},
	10,
	3
);
