<?php
/**
 * Doble de la Secrets API de WordPress 7.2 per a enxufe-r25-2-runner.php.
 *
 * Contracte de la dev note de Make WordPress Core (11-11-2026):
 *   · wp_get_secret() torna WP_Secret (valor amb ->reveal()), null (mai desat)
 *     o WP_Error (existix però no es pot llegir);
 *   · un WP_Secret imprés, en JSON o en var_dump mostra «[secret:nom]»;
 *   · wp_is_secrets_api_available() i wp_secrets_provider_is_writable().
 * Els noms «socdepoble/drop-in-*» simulen un drop-in que no complix el
 * contracte (una cadena o un objecte qualsevol): el connector no els ha de
 * convertir mai en credencial.
 */

/** Doble de WP_Secret: el valor només ix amb reveal(). */
final class WP_Secret implements JsonSerializable {
	private $nom;
	private $valor;

	public function __construct( $nom, $valor ) {
		$this->nom   = $nom;
		$this->valor = $valor;
	}

	public function reveal() {
		return $this->valor;
	}

	public function __toString() {
		return '[secret:' . $this->nom . ']';
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return (string) $this;
	}

	public function __debugInfo() {
		return array( 'secret' => (string) $this );
	}
}

// Amb sdp_test_sense_disponibilitat, un nucli que porta wp_get_secret però no la funció de disponibilitat.
if ( empty( $GLOBALS['sdp_test_sense_disponibilitat'] ) ) {
	function wp_is_secrets_api_available() {
		return true === $GLOBALS['sdp_test_api_disponible'];
	}
}

function wp_secrets_provider_is_writable() {
	return true === $GLOBALS['sdp_test_writable'];
}

function wp_get_secret( $name ) {
	$GLOBALS['sdp_test_get_crides'] += 1;
	if ( 'socdepoble/trencat-per-rotacio' === $name ) {
		throw new RuntimeException( 'Decryption failed after key rotation' );
	}
	if ( 'socdepoble/error-desxifrat' === $name || ! empty( $GLOBALS['sdp_test_illegibles'][ $name ] ) ) {
		return new WP_Error( 'secret_decrypt_failed', 'Cannot decrypt' );
	}
	if ( 'socdepoble/drop-in-cadena' === $name ) {
		return '[secret:socdepoble/drop-in-cadena]';
	}
	if ( 'socdepoble/drop-in-objecte' === $name ) {
		return new class() {
			public function reveal() {
				return 'clau-falsa-objecte';
			}
			public function __toString() {
				return 'clau-falsa-objecte';
			}
		};
	}
	if ( 'socdepoble/mascara-revelada' === $name ) {
		return new WP_Secret( $name, '[secret:socdepoble/mascara-revelada]' );
	}
	return isset( $GLOBALS['sdp_test_secrets'][ $name ] ) ? new WP_Secret( $name, $GLOBALS['sdp_test_secrets'][ $name ] ) : null;
}

function wp_set_secret( $name, $value ) {
	$GLOBALS['sdp_test_set_crides'] += 1;
	$GLOBALS['sdp_test_secrets'][ $name ] = $value;
	return true;
}
