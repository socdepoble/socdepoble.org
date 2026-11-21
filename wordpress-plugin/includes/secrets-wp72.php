<?php
/**
 * Pont condicional cap a la Secrets API (IDEA-264, IDEA-306).
 * L’API de la beta 7.2 es va retirar abans de RC1 (r65538, 17-11-2026).
 * La presència real de les funcions mana, mai la versió de WordPress.
 *
 * Contracte del nucli (dev note de Make WordPress Core, 11-11-2026):
 *   · wp_get_secret( 'connector/nom' ) torna un WP_Secret, null si mai s'ha
 *     desat o un WP_Error si existix però ara no es pot llegir (WP_SECRETS_KEY
 *     canviada o perduda). El valor només ix amb ->reveal(), al punt d'ús.
 *   · Un WP_Secret imprés, registrat o passat a JSON mostra el marcador
 *     «[secret:connector/nom]». El marcador no és mai una credencial.
 *   · wp_is_secrets_api_available() és l'autoritat de disponibilitat: fals
 *     si el drop-in secrets.php no carrega, si WP_SECRETS_KEY falta o no és
 *     usable o si no desxifra la clau arrel desada; «a keyring or provider
 *     from a working drop-in counts as available», encara que wp-config.php
 *     no definisca WP_SECRETS_KEY (l'amfitrió la custodia en un KMS o HSM).
 *   · Les funcions del nucli no comproven capacitats: ho fa qui les crida.
 *
 * Precedència explícita de les claus opcionals de tercers (DeepL i l'extrem
 * propi de traducció). Res no es desa mai en text pla a wp_options:
 *   1r Constant de wp-config.php. Si està definida, mana: buida o invàlida
 *      desactiva la clau, com abans d'IDEA-264, i no es passa a la següent.
 *   2n Variable d'entorn del procés PHP, si getenv no està desactivada i no
 *      és buida.
 *   3r Secrets API de WordPress 7.2+, quan wp_is_secrets_api_available() la
 *      dona per disponible. Només si el nucli no porta eixa funció, la
 *      constant WP_SECRETS_KEY definida i no buida en fa de reserva.
 *   4t Cap clau (''): el lloc continua amb Apertium on hi ha parell.
 * Absent (null), error (WP_Error, excepció, una forma que no és un WP_Secret
 * o un proveïdor que revela el marcador) i invàlida (un WP_Secret llegible el
 * valor del qual és buit o porta un salt de línia o un NUL) són estats
 * distints. Cap estat porta el valor ni el missatge cru de l'error, i res
 * d'ací no registra cap secret, capçalera ni cos.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Les claus opcionals que coneix el connector: la constant (o variable
 * d'entorn) i el nom a la Secrets API, amb el format connector/nom.
 *
 * @return array<string, array{0: string, 1: string}>
 */
function socdepoble_enxufe_secrets_wp72_claus() {
	return array(
		'deepl'         => array( 'DEEPL_API_KEY', 'socdepoble/deepl-api-key' ),
		'traduccio_url' => array( 'SDP_TRADUCCIO_URL_CLAU', 'socdepoble/traduccio-url-clau' ),
	);
}

/**
 * Cert si WP_SECRETS_KEY està definida amb un valor no buit a wp-config.php.
 * No diu si la Secrets API es pot fer servir (vegeu ..._disponible()): un
 * keyring d'amfitrió funciona sense la constant, i una constant definida pot
 * ser la d'exemple, una SALT copiada o una clau que no desxifra la clau arrel.
 *
 * @return bool
 */
function socdepoble_enxufe_secrets_wp72_clau_activa() {
	if ( ! defined( 'WP_SECRETS_KEY' ) ) {
		return false;
	}
	$clau = constant( 'WP_SECRETS_KEY' );
	return is_string( $clau ) && '' !== trim( $clau );
}

/**
 * Cert si la Secrets API de WordPress 7.2+ es pot llegir ara. Amb
 * wp_is_secrets_api_available() al nucli, només ella ho decidix: també compta
 * el keyring o el proveïdor d'un drop-in secrets.php que funciona sense
 * WP_SECRETS_KEY a wp-config.php, i rebutja la clau d'exemple, una SALT
 * copiada i una clau que no desxifra la clau arrel. La constant només en fa
 * de reserva si el nucli porta wp_get_secret però no la funció de
 * disponibilitat.
 *
 * @return bool
 */
function socdepoble_enxufe_secrets_wp72_disponible() {
	if ( ! function_exists( 'wp_get_secret' ) ) {
		return false;
	}
	if ( ! function_exists( 'wp_is_secrets_api_available' ) ) {
		return socdepoble_enxufe_secrets_wp72_clau_activa();
	}
	try {
		return true === wp_is_secrets_api_available();
	} catch ( Throwable $error ) {
		return false;
	}
}

/**
 * Cert si el nom seguix la regla del nucli: connector/nom, minúscules, xifres,
 * guionets i guions baixos, una sola barra i cap segment que comence o acabe
 * amb guionet o guió baix.
 *
 * @param mixed $nom Nom a la Secrets API.
 * @return bool
 */
function socdepoble_enxufe_secret_wp72_nom_valid( $nom ) {
	return is_string( $nom ) && strlen( $nom ) <= 172 && 1 === preg_match( '/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/D', $nom );
}

/**
 * El valor net d'una credencial, o '' si no en pot ser cap: no és una cadena,
 * porta en qualsevol punt un salt de línia o un NUL (injecció de capçaleres;
 * el mateix criteri que abans d'IDEA-264, sobre el valor cru), és buit o és el
 * marcador emmascarat d'un WP_Secret.
 *
 * @param mixed $valor Valor candidat.
 * @return string
 */
function socdepoble_enxufe_secret_wp72_valor_net( $valor ) {
	if ( ! is_string( $valor ) || 1 === preg_match( '/[\r\n\x00]/', $valor ) ) {
		return '';
	}
	$net = trim( $valor );
	if ( '' === $net || 1 === preg_match( '/^\[secret:[^\]]*\]$/', $net ) ) {
		return '';
	}
	return $net;
}

/**
 * Llig un nom de la Secrets API i en torna l'estat i, només amb «ok», el valor
 * revelat al punt d'ús. Mai fa cap cast d'un objecte a cadena.
 *
 * «error» vol dir que el secret existix però no es pot llegir (o que el
 * proveïdor no complix el contracte): mai s'hi desa res damunt. «invalida» vol
 * dir que s'ha llegit bé però el valor no pot ser cap credencial (buit, salt
 * de línia o NUL): la causa no és la WP_SECRETS_KEY.
 *
 * @param string $nom_secret Nom connector/nom.
 * @return array{estat: string, valor: string} estat: ok, absent, invalida, error o no_disponible.
 */
function socdepoble_enxufe_secret_wp72_resol( $nom_secret ) {
	try {
		$error = array(
			'estat' => 'error',
			'valor' => '',
		);
		if ( ! socdepoble_enxufe_secret_wp72_nom_valid( $nom_secret ) ) {
			return $error;
		}
		if ( ! socdepoble_enxufe_secrets_wp72_disponible() ) {
			return array(
				'estat' => 'no_disponible',
				'valor' => '',
			);
		}
		try {
			$secret = wp_get_secret( $nom_secret );
			if ( null === $secret ) {
				return array(
					'estat' => 'absent',
					'valor' => '',
				);
			}
			// Un WP_Error, una cadena (el marcador d'un drop-in mal fet) o qualsevol altre objecte: error.
			if ( ! class_exists( 'WP_Secret' ) || ! $secret instanceof WP_Secret ) {
				return $error;
			}
			$revelat = $secret->reveal();
		} catch ( Throwable $excepcio ) {
			return $error;
		}
		// Un reveal() que no dona una cadena o que dona el marcador emmascarat: el proveïdor falla.
		if ( ! is_string( $revelat ) || 1 === preg_match( '/^\s*\[secret:[^\]]*\]\s*$/D', $revelat ) ) {
			return $error;
		}
		$valor = socdepoble_enxufe_secret_wp72_valor_net( $revelat );
		if ( '' === $valor ) {
			return array(
				'estat' => 'invalida',
				'valor' => '',
			);
		}
		return array(
			'estat' => 'ok',
			'valor' => $valor,
		);
	} finally {
		if ( function_exists( 'wp_secrets_memzero' ) ) {
			/* v1.2.18 · Gauntlet R1 (L4-04) · Només cadenes: un reveal() que no en dona cap ja torna «error»,
			   i un memzero estil sodium llançaria des del finally i taparia eixe return. */
			if ( isset( $revelat ) && is_string( $revelat ) ) {
				wp_secrets_memzero( $revelat );
			}
			if ( isset( $valor ) && is_string( $valor ) ) {
				wp_secrets_memzero( $valor );
			}
		}
	}
}

/**
 * Resol una clau opcional amb la precedència 1..4 de dalt.
 *
 * @param string $nom_constant Constant de wp-config.php o variable d'entorn (ex. DEEPL_API_KEY).
 * @param string $nom_secret   Nom connector/nom a la Secrets API.
 * @return array{origen: string, estat: string, valor: string}
 *         origen: constant, entorn, secrets_api o cap; estat: ok, absent, invalida, error o no_disponible.
 */
function socdepoble_enxufe_resol_secret( $nom_constant, $nom_secret ) {
	if ( is_string( $nom_constant ) && '' !== $nom_constant ) {
		if ( defined( $nom_constant ) ) {
			$cru   = constant( $nom_constant );
			$valor = socdepoble_enxufe_secret_wp72_valor_net( $cru );
			if ( '' !== $valor ) {
				$estat = 'ok';
			} else {
				$estat = is_string( $cru ) && '' === trim( $cru ) ? 'absent' : 'invalida';
			}
			return array(
				'origen' => 'constant',
				'estat'  => $estat,
				'valor'  => $valor,
			);
		}
		// getenv pot estar a disable_functions: en PHP 8 deixa d'existir i cridar-la llança Error.
		$entorn = function_exists( 'getenv' ) ? getenv( $nom_constant ) : false;
		if ( is_string( $entorn ) && '' !== trim( $entorn ) ) {
			$valor = socdepoble_enxufe_secret_wp72_valor_net( $entorn );
			return array(
				'origen' => 'entorn',
				'estat'  => '' !== $valor ? 'ok' : 'invalida',
				'valor'  => $valor,
			);
		}
	}

	$resultat = socdepoble_enxufe_secret_wp72_resol( $nom_secret );
	return array(
		'origen' => 'no_disponible' === $resultat['estat'] ? 'cap' : 'secrets_api',
		'estat'  => $resultat['estat'],
		'valor'  => $resultat['valor'],
	);
}

/**
 * El valor d'una clau opcional, o '' (precedència 1..4).
 *
 * @param string $nom_constant Constant de wp-config.php o variable d'entorn.
 * @param string $nom_secret   Nom connector/nom a la Secrets API.
 * @return string
 */
function socdepoble_enxufe_llig_secret( $nom_constant, $nom_secret ) {
	$resultat = socdepoble_enxufe_resol_secret( $nom_constant, $nom_secret );
	return $resultat['valor'];
}

/**
 * L'origen i l'estat d'una clau opcional, sense el valor: per a Salut del lloc.
 *
 * @param string $nom_constant Constant de wp-config.php o variable d'entorn.
 * @param string $nom_secret   Nom connector/nom a la Secrets API.
 * @return array{origen: string, estat: string}
 */
function socdepoble_enxufe_estat_secret( $nom_constant, $nom_secret ) {
	try {
		$resultat = socdepoble_enxufe_resol_secret( $nom_constant, $nom_secret );
		return array(
			'origen' => $resultat['origen'],
			'estat'  => $resultat['estat'],
		);
	} finally {
		if ( function_exists( 'wp_secrets_memzero' ) && isset( $resultat['valor'] ) ) {
			wp_secrets_memzero( $resultat['valor'] );
		}
	}
}

/**
 * El valor d'una de les claus de socdepoble_enxufe_secrets_wp72_claus(), o ''.
 *
 * @param string $id Identificador de la clau (deepl o traduccio_url).
 * @return string
 */
function socdepoble_enxufe_llig_clau( $id ) {
	$claus = socdepoble_enxufe_secrets_wp72_claus();
	if ( ! isset( $claus[ $id ] ) ) {
		return '';
	}
	return socdepoble_enxufe_llig_secret( $claus[ $id ][0], $claus[ $id ][1] );
}

/**
 * Desa un secret únicament a través de la Secrets API xifrada de WP 7.2+.
 *
 * El nucli no comprova capacitats: ho fa esta funció (manage_secrets si existix wp_set_secret; manage_options si no). Refusa
 * sense escriure res si l'amfitrió no té l'API disponible o el proveïdor és
 * de només lectura, i no reemplaça mai un secret que existix però ara no es
 * pot llegir (podria ser una credencial bona amb la WP_SECRETS_KEY de sempre).
 * Un secret llegible però amb un valor invàlid sí que es pot reemplaçar.
 * No recorre mai a update_option ni a cap taula en text pla.
 *
 * @param string $nom_secret_wp72 Nom connector/nom a la Secrets API.
 * @param string $valor           Valor secret a xifrar.
 * @return true|WP_Error
 */
function socdepoble_enxufe_desa_secret_wp72( $nom_secret_wp72, $valor ) {
	try {
		$capacitat = function_exists( 'wp_set_secret' ) ? 'manage_secrets' : 'manage_options';
		if ( ! current_user_can( $capacitat ) ) {
			return new WP_Error(
				'socdepoble_enxufe_secret_permis',
				__( 'You do not have permission to manage Sóc de Poble secrets.', 'socdepoble' )
			);
		}

		$net = socdepoble_enxufe_secret_wp72_valor_net( $valor );
		if ( ! socdepoble_enxufe_secret_wp72_nom_valid( $nom_secret_wp72 ) || '' === $net ) {
			return new WP_Error(
				'socdepoble_enxufe_secret_invalid',
				__( 'The secret identifier and value must be non-empty strings.', 'socdepoble' )
			);
		}

		if (
			! socdepoble_enxufe_secrets_wp72_disponible()
			|| ! function_exists( 'wp_set_secret' )
			|| ( function_exists( 'wp_secrets_provider_is_writable' ) && true !== wp_secrets_provider_is_writable() )
		) {
			return new WP_Error(
				'socdepoble_enxufe_secret_no_disponible',
				__( 'Cannot save encrypted secret: WordPress 7.2 Secrets API and WP_SECRETS_KEY in wp-config.php are required. Sóc de Poble never stores API keys in plain text in the database.', 'socdepoble' )
			);
		}

		$actual = socdepoble_enxufe_secret_wp72_resol( $nom_secret_wp72 );
		if ( 'error' === $actual['estat'] ) {
			return new WP_Error(
				'socdepoble_enxufe_secret_illegible',
				__( 'A secret with this name exists but cannot be read now. Restore the WP_SECRETS_KEY that encrypted it before saving a new value.', 'socdepoble' )
			);
		}

		try {
			$resultat = wp_set_secret( $nom_secret_wp72, $net );
		} catch ( Throwable $error ) {
			$resultat = false;
		}
		/* El nucli només documenta el WP_Error de la fallada (i que llavors no desa res).
		   Cap missatge cru del nucli ni del proveïdor: el codi estable i un text propi. */
		if ( is_wp_error( $resultat ) || false === $resultat ) {
			return new WP_Error(
				'socdepoble_enxufe_secret_error',
				__( 'WordPress could not encrypt the secret with the current WP_SECRETS_KEY.', 'socdepoble' )
			);
		}

		return true;
	} finally {
		if ( function_exists( 'wp_secrets_memzero' ) ) {
			// v1.2.18 · Gauntlet R1 (L4-04) · Només cadenes: un $valor que no ho és ja torna WP_Error i no pot llançar ací.
			if ( is_string( $valor ) ) {
				wp_secrets_memzero( $valor );
			}
			if ( isset( $net ) && is_string( $net ) ) {
				wp_secrets_memzero( $net );
			}
			if ( isset( $actual['valor'] ) && is_string( $actual['valor'] ) ) {
				wp_secrets_memzero( $actual['valor'] );
			}
		}
	}
}
