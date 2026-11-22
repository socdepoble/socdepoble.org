<?php
/** HTTP degradat: cap reintent automàtic ni canvi de la configuració TLS de l'amfitrió. */
defined( 'ABSPATH' ) || exit;

/** Retry-After HTTP: segons o IMF-fixdate; entrada acotada, pausa màxima d'un dia. */
function socdepoble_enxufe_retry_after( $valor, $ara = null ) {
	if ( ! is_string( $valor ) || strlen( $valor ) > 128 ) {
		return 0;
	}
	$valor = trim( $valor );
	$ara   = null === $ara ? time() : $ara;
	if ( preg_match( '/^\d{1,10}$/D', $valor ) ) {
		return max( 1, min( 86400, (int) $valor ) );
	}
	if ( ! preg_match( '/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/D', $valor ) ) {
		return 0;
	}
	$fins = strtotime( $valor );
	if ( false === $fins || gmdate( 'D, d M Y H:i:s \G\M\T', $fins ) !== $valor || $fins <= $ara ) {
		return 0;
	}
	return min( 86400, $fins - $ara );
}
