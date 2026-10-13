<?php
/**
 * Canal propi d'actualitzacions, signat.
 *
 * WordPress 5.8+ ho admet de manera oficial: la capçalera `Update URI` fa que
 * wp_update_plugins() cride el filtre `update_plugins_{host}` per a este
 * plugin, però NOMÉS després que api.wordpress.org haja respost 200
 * (wp-includes/update.php). Un lloc que no hi arriba (sense xarxa, o amb
 * WP_HTTP_BLOCK_EXTERNAL) no consulta el canal, i els Ajustos i la Salut ho
 * diuen. Sense biblioteques, sense l'API de GitHub i sense escriure mai el
 * transient update_plugins de WordPress: només s'invalida, com fa
 * «Comprova-ho de nou», en activar el plugin i amb el botó del canal.
 *
 * El canal és el manifest universal del paquet (sdp.release.v1) amb una
 * secció `adaptadors.wordpress` afegida per l'empaquetador, publicat a
 * SOCDEPOBLE_ENXUFE_CANAL amb la signatura Ed25519 al costat (`.sig`, en
 * hexadecimal). El mateix manifest el pot llegir Sollutia per a saber quina
 * versió de l'App ha de servir: WordPress no té cap canal que Sollutia no puga
 * reproduir.
 *
 * Seguretat:
 *   · Sense clau pública (SOCDEPOBLE_ENXUFE_CLAU_PUBLICA) no s'oferix cap
 *     actualització: el commutador d'actualitzacions automàtiques apareix,
 *     però cap paquet s'instal·la fins que el canal verifica; la cel·la
 *     d'Extensions ho diu i enllaça els Ajustos.
 *   · La signatura es torna a verificar cada vegada que es llig el canal
 *     desat: una fila de la base de dades no basta per a colar un paquet.
 *   · WordPress només veu un paquet simbòlic (socdepoble-enxufe:VERSIÓ): si
 *     este fitxer no està carregat, no hi ha res descarregable. El zip real es
 *     descarrega ací (upgrader_pre_download) des del manifest verificat en eixe
 *     moment i ha de tindre la seua mida i el seu sha256. Si no, WP_Error i no
 *     s'instal·la res.
 *   · L'arrel del zip ha de ser socdepoble-enxufe/ (upgrader_source_selection).
 *   · Mai s'envia `autoupdate` ni es filtra auto_update_plugin: l'administrador
 *     decidix. Un paquet segellat contra un backend de desenvolupament no
 *     s'oferix mai a un lloc real.
 *   · Les peticions s'identifiquen com a socdepoble-enxufe, sense l'URL del lloc.
 *
 * Esta és l'única peça que no va a la variant per al directori de
 * WordPress.org: allà les actualitzacions ja són natives.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/* Un lloc pot definir-les abans a wp-config.php (per exemple, un canal de
   proves local o el canal propi d'un poble). */
if ( ! defined( 'SOCDEPOBLE_ENXUFE_CANAL' ) ) {
	define( 'SOCDEPOBLE_ENXUFE_CANAL', 'https://socdepoble.org/enxufe/stable.json' );
}
if ( ! defined( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA' ) ) {
	/* Clau pública Ed25519 del canal, 64 xifres hexadecimals. La genera el
	   Mestre amb `node wordpress-plugin/eines/empaqueta.mjs --genera-clau` i
	   l'empaquetador comprova que coincidix amb la clau que signa. */
	define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', 'e38cf53ce54696af11c597152702580ce51a2e07158282d45dd897cb723ef278' );
}

/* El paquet que veu WordPress és simbòlic: sense este fitxer carregat (plugin
   inactiu o en pausa) download_url() el rebutja i l'actualització falla en
   tancat. La URL real només ix del manifest verificat en el moment de baixar. */
const SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC = 'socdepoble-enxufe:';
const SOCDEPOBLE_ENXUFE_OPCIO_CANAL    = 'socdepoble_enxufe_canal';
const SOCDEPOBLE_ENXUFE_CANAL_VIGENCIA = 43200; // 12 h, com les comprovacions de WordPress.
const SOCDEPOBLE_ENXUFE_CANAL_REINTENT = 3600;  // 1 h després d'un error.
const SOCDEPOBLE_ENXUFE_PAQUET_MAXIM   = 262144000; // 250 MB.

/**
 * Agent de les peticions: identifica el plugin però no el lloc.
 *
 * @return string
 */
function socdepoble_enxufe_agent() {
	return 'socdepoble-enxufe/' . SOCDEPOBLE_ENXUFE_VERSIO;
}

/**
 * Estat desat del canal: cos i signatura de l'últim manifest bo, hora de
 * l'última comprovació i últim error. És de tota la xarxa en multilloc.
 *
 * @return array
 */
function socdepoble_enxufe_estat_canal() {
	$estat = get_site_option( SOCDEPOBLE_ENXUFE_OPCIO_CANAL, array() );
	return is_array( $estat ) ? $estat : array();
}

/**
 * Desa l'estat del canal sense carregar-lo a cada pàgina.
 *
 * @param array $estat Estat del canal.
 */
function socdepoble_enxufe_desa_estat_canal( $estat ) {
	if ( is_multisite() ) {
		update_site_option( SOCDEPOBLE_ENXUFE_OPCIO_CANAL, $estat );
	} else {
		update_option( SOCDEPOBLE_ENXUFE_OPCIO_CANAL, $estat, false );
	}
}

/**
 * Cert per a localhost, *.localhost, 127.x i ::1.
 *
 * @param string $host Host.
 * @return bool
 */
function socdepoble_enxufe_host_local( $host ) {
	$host = strtolower( trim( (string) $host, '[]' ) );
	return 'localhost' === $host || '.localhost' === substr( $host, -10 ) || '::1' === $host || 0 === strpos( $host, '127.' );
}

/**
 * Per què una URL del canal o d'un paquet no es pot usar ('' si es pot):
 * https sempre; http només cap a un host local i en un lloc de
 * desenvolupament (un canal de proves a WordPress Studio).
 *
 * @param string $url URL.
 * @return string
 */
function socdepoble_enxufe_url_no_permesa( $url ) {
	$parts = wp_parse_url( (string) $url );
	if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
		return __( 'The URL is not valid.', 'socdepoble-enxufe' );
	}
	$local = socdepoble_enxufe_host_local( $parts['host'] );
	if ( $local && ! socdepoble_enxufe_lloc_de_desenvolupament() ) {
		return __( 'Local URLs are only allowed on development sites.', 'socdepoble-enxufe' );
	}
	if ( 'https' === $parts['scheme'] || ( 'http' === $parts['scheme'] && $local ) ) {
		return '';
	}
	return __( 'Only https URLs are allowed.', 'socdepoble-enxufe' );
}

/**
 * Executa una crida HTTP deixant passar, NOMÉS durant la crida, el host local
 * i el port d'una URL de proves. wp_safe_remote_get() els rebutja sempre, i
 * el canal de proves de WordPress Studio en necessita un. Qualsevol altra URL
 * passa pels controls de sempre.
 *
 * @param string   $url   URL de la crida.
 * @param callable $crida Funció sense arguments que fa la crida.
 * @return mixed El que torne la crida.
 */
function socdepoble_enxufe_amb_xarxa_local( $url, $crida ) {
	$host = (string) wp_parse_url( $url, PHP_URL_HOST );
	if ( ! socdepoble_enxufe_host_local( $host ) || ! socdepoble_enxufe_lloc_de_desenvolupament() ) {
		return $crida();
	}
	$port   = (int) wp_parse_url( $url, PHP_URL_PORT );
	$extern = static function ( $es_extern, $host_demanat ) use ( $host ) {
		return $es_extern || strtolower( (string) $host_demanat ) === strtolower( $host );
	};
	$ports  = static function ( $permesos ) use ( $port ) {
		if ( $port > 0 ) {
			$permesos[] = $port;
		}
		return $permesos;
	};
	add_filter( 'http_request_host_is_external', $extern, 10, 2 );
	add_filter( 'http_allowed_safe_ports', $ports );
	try {
		return $crida();
	} finally {
		remove_filter( 'http_request_host_is_external', $extern, 10 );
		remove_filter( 'http_allowed_safe_ports', $ports );
	}
}

/**
 * GET d'un text petit: el manifest o la seua signatura.
 *
 * @param string $url    URL.
 * @param int    $maxim  Bytes màxims.
 * @return string|WP_Error
 */
function socdepoble_enxufe_llig_url( $url, $maxim ) {
	$resposta = socdepoble_enxufe_amb_xarxa_local(
		$url,
		static function () use ( $url, $maxim ) {
			return wp_safe_remote_get(
				$url,
				array(
					'timeout'             => 10,
					'redirection'         => 3,
					'limit_response_size' => $maxim,
					'user-agent'          => socdepoble_enxufe_agent(),
				)
			);
		}
	);
	if ( is_wp_error( $resposta ) ) {
		return $resposta;
	}
	$codi = (int) wp_remote_retrieve_response_code( $resposta );
	if ( 200 !== $codi ) {
		/* translators: 1: URL, 2: HTTP status code. */
		return new WP_Error( 'socdepoble_enxufe_http', sprintf( __( '%1$s answered HTTP %2$d.', 'socdepoble-enxufe' ), $url, $codi ) );
	}
	return (string) wp_remote_retrieve_body( $resposta );
}

/**
 * La clau pública configurada, en hexadecimal, o '' si no n'hi ha cap de
 * vàlida.
 *
 * @return string
 */
function socdepoble_enxufe_clau_publica() {
	$clau = strtolower( trim( (string) SOCDEPOBLE_ENXUFE_CLAU_PUBLICA ) );
	return preg_match( '/^[0-9a-f]{64}$/', $clau ) ? $clau : '';
}

/**
 * Verifica la signatura Ed25519 (separada, hexadecimal) dels bytes exactes
 * del manifest amb la clau pública del plugin. Sodium hi és sempre: natiu o
 * per la còpia de sodium_compat que porta WordPress.
 *
 * @param string $cos       Bytes del manifest tal com s'han servit.
 * @param string $signatura Signatura en hexadecimal (128 xifres).
 * @return bool
 */
function socdepoble_enxufe_signatura_valida( $cos, $signatura ) {
	$clau      = socdepoble_enxufe_clau_publica();
	$signatura = strtolower( trim( (string) $signatura ) );
	if ( '' === $clau || ! preg_match( '/^[0-9a-f]{128}$/', $signatura ) || ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return false;
	}
	try {
		return sodium_crypto_sign_verify_detached( hex2bin( $signatura ), (string) $cos, hex2bin( $clau ) );
	} catch ( \Throwable $error ) {
		return false;
	}
}

/**
 * Valida un manifest de canal descodificat: el manifest universal més la
 * secció adaptadors.wordpress. Torna la part que usa l'actualitzador.
 *
 * @param mixed $dades Manifest descodificat.
 * @return array|null
 */
function socdepoble_enxufe_valida_canal( $dades ) {
	$base = socdepoble_enxufe_valida_manifest( $dades );
	if ( null === $base ) {
		return null;
	}
	$wp = $dades['adaptadors']['wordpress'] ?? null;
	if ( ! is_array( $wp ) || SOCDEPOBLE_ENXUFE_SLUG !== ( $wp['slug'] ?? null ) ) {
		return null;
	}
	$versio = $wp['versio'] ?? null;
	if ( ! is_string( $versio ) || ! preg_match( '/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/', $versio ) ) {
		return null;
	}
	foreach ( array( 'requires', 'requires_php', 'tested' ) as $clau ) {
		if ( ! is_string( $wp[ $clau ] ?? null ) || ! preg_match( '/^\d+(?:\.\d+){0,2}$/', $wp[ $clau ] ) ) {
			return null;
		}
	}
	$paquet = $wp['paquet'] ?? null;
	if ( ! is_array( $paquet ) ) {
		return null;
	}
	$url    = $paquet['url'] ?? null;
	$sha256 = $paquet['sha256'] ?? null;
	$mida   = $paquet['mida'] ?? null;
	if ( ! is_string( $url ) || '' !== socdepoble_enxufe_url_no_permesa( $url ) ) {
		return null;
	}
	if ( ! is_string( $sha256 ) || ! preg_match( '/^[0-9a-f]{64}$/', $sha256 ) ) {
		return null;
	}
	if ( ! is_int( $mida ) || $mida < 1 || $mida > SOCDEPOBLE_ENXUFE_PAQUET_MAXIM ) {
		return null;
	}
	// Un paquet de desenvolupament no s'oferix mai a un lloc real.
	if ( ( $base['node']['desenvolupament'] || 'remote' !== $base['node']['mode'] ) && ! socdepoble_enxufe_lloc_de_desenvolupament() ) {
		return null;
	}
	$notes = $dades['notes'] ?? '';
	return array(
		'versio'    => $versio,
		'node'      => $base['node'],
		'generat'   => is_string( $dades['generat'] ?? null ) ? sanitize_text_field( $dades['generat'] ) : '',
		'notes'     => is_string( $notes ) ? esc_url_raw( $notes, array( 'https' ) ) : '',
		'wordpress' => array(
			'versio'       => $versio,
			'requires'     => $wp['requires'],
			'requires_php' => $wp['requires_php'],
			'tested'       => $wp['tested'],
			'paquet'       => array(
				'url'    => $url,
				'sha256' => $sha256,
				'mida'   => $mida,
			),
		),
	);
}

/**
 * Analitza un cos i una signatura: torna [canal|null, motiu].
 *
 * @param string $cos       Bytes del manifest.
 * @param string $signatura Signatura hexadecimal.
 * @return array
 */
function socdepoble_enxufe_analitza_canal( $cos, $signatura ) {
	if ( '' === socdepoble_enxufe_clau_publica() ) {
		return array( null, __( 'No signing key is configured, so no update is offered.', 'socdepoble-enxufe' ) );
	}
	if ( '' === (string) $cos ) {
		return array( null, __( 'The channel has not been read yet.', 'socdepoble-enxufe' ) );
	}
	if ( ! socdepoble_enxufe_signatura_valida( $cos, $signatura ) ) {
		return array( null, __( 'The channel signature does not verify.', 'socdepoble-enxufe' ) );
	}
	$canal = socdepoble_enxufe_valida_canal( json_decode( (string) $cos, true ) );
	if ( null === $canal ) {
		return array( null, __( 'The signed manifest does not follow sdp.release.v1 or does not suit this site.', 'socdepoble-enxufe' ) );
	}
	return array( $canal, '' );
}

/**
 * Llig el canal remot i actualitza l'estat desat. Un manifest que no verifica
 * no esborra l'últim bo; un de versió inferior tampoc no el substituïx.
 *
 * @param array $estat Estat previ.
 * @return array Estat nou.
 */
function socdepoble_enxufe_refresca_canal( $estat ) {
	$estat['comprovat'] = time();
	$url                = SOCDEPOBLE_ENXUFE_CANAL;
	$motiu              = socdepoble_enxufe_url_no_permesa( $url );
	if ( '' === $motiu ) {
		$cos = socdepoble_enxufe_llig_url( $url, 131072 );
		$sig = is_wp_error( $cos ) ? $cos : socdepoble_enxufe_llig_url( $url . '.sig', 1024 );
		if ( is_wp_error( $sig ) ) {
			$motiu = $sig->get_error_message();
		} else {
			list( $canal, $motiu ) = socdepoble_enxufe_analitza_canal( $cos, $sig );
			if ( null !== $canal ) {
				list( $previ ) = socdepoble_enxufe_analitza_canal( $estat['cos'] ?? '', $estat['signatura'] ?? '' );
				if ( null !== $previ && version_compare( $canal['versio'], $previ['versio'], '<' ) ) {
					$motiu = __( 'The channel served an older signed manifest; the newer one is kept.', 'socdepoble-enxufe' );
				} else {
					$estat['cos']       = $cos;
					$estat['signatura'] = trim( $sig );
				}
			}
		}
	}
	$estat['error'] = $motiu;
	socdepoble_enxufe_desa_estat_canal( $estat );
	return $estat;
}

/**
 * El canal verificat (array) o null. Es refresca cada 12 h, o cada hora
 * després d'un error, o si es força.
 *
 * @param bool $forca Llegir el canal remot encara que no haja caducat.
 * @return array|null
 */
function socdepoble_enxufe_canal( $forca = false ) {
	static $canal = null;
	static $llegit = false;
	if ( $llegit && ! $forca ) {
		return $canal;
	}
	$estat     = socdepoble_enxufe_estat_canal();
	$comprovat = isset( $estat['comprovat'] ) ? (int) $estat['comprovat'] : 0;
	$vigencia  = empty( $estat['error'] ) ? SOCDEPOBLE_ENXUFE_CANAL_VIGENCIA : SOCDEPOBLE_ENXUFE_CANAL_REINTENT;
	if ( $forca || time() - $comprovat > $vigencia ) {
		$estat = socdepoble_enxufe_refresca_canal( $estat );
	}
	list( $canal ) = socdepoble_enxufe_analitza_canal( $estat['cos'] ?? '', $estat['signatura'] ?? '' );
	$llegit        = true;
	return $canal;
}

/**
 * Per què esta instal·lació no es pot actualitzar sola ('' si es pot).
 *
 * @param string $plugin_file Ruta relativa del plugin (carpeta/fitxer.php).
 * @return string
 */
function socdepoble_enxufe_bloqueig_instal_lacio( $plugin_file = '' ) {
	if ( '' === $plugin_file ) {
		$plugin_file = plugin_basename( SOCDEPOBLE_ENXUFE_FITXER );
	}
	$carpeta = dirname( $plugin_file );
	if ( SOCDEPOBLE_ENXUFE_SLUG !== $carpeta ) {
		return sprintf(
			/* translators: 1: current folder, 2: expected folder. */
			__( 'The plugin lives in the folder %1$s instead of %2$s, so an update would install a second copy. Reinstall it from a release package.', 'socdepoble-enxufe' ),
			$carpeta,
			SOCDEPOBLE_ENXUFE_SLUG
		);
	}
	if ( is_multisite() ) {
		/* En multilloc WordPress només comprova les actualitzacions al lloc
		   principal i a l'administració de xarxa (wp-includes/update.php). */
		$de_xarxa  = array_key_exists( $plugin_file, (array) get_site_option( 'active_sitewide_plugins', array() ) );
		$principal = in_array( $plugin_file, (array) get_blog_option( get_main_site_id(), 'active_plugins', array() ), true );
		if ( ! $de_xarxa && ! $principal ) {
			return __( 'On a multisite network WordPress only checks for updates on the main site and in the network admin. Activate the plugin network-wide or on the main site so the channel is consulted.', 'socdepoble-enxufe' );
		}
	}
	$cami = trailingslashit( WP_PLUGIN_DIR ) . $carpeta;
	if ( is_link( $cami ) ) {
		return __( 'The plugin folder is a symbolic link to a working copy. Updating it would delete the linked files, so updates stay off.', 'socdepoble-enxufe' );
	}
	if ( file_exists( $cami . '/.git' ) ) {
		return __( 'The plugin folder is a git checkout, so updates stay off to protect it.', 'socdepoble-enxufe' );
	}
	return '';
}

/**
 * Cert si este lloc complix el WordPress i el PHP mínims del paquet nou, amb
 * el mateix criteri que WordPress aplica a les actualitzacions massives
 * (versions RC i beta, i x.y.0 com a x.y). En una actualització individual
 * WordPress no ho torna a comprovar (no hi ha check_package), i per això es
 * mira abans d'oferir-la i abans de baixar-la.
 *
 * @param array $wp Secció wordpress del canal validat.
 * @return bool
 */
function socdepoble_enxufe_compleix_requisits( $wp ) {
	return is_wp_version_compatible( $wp['requires'] ) && is_php_version_compatible( $wp['requires_php'] );
}

/**
 * L'oferta vigent, la MATEIXA per a update_plugins, plugins_api i la baixada:
 * la secció wordpress del canal verificat si esta instal·lació es pot
 * actualitzar, la versió del canal és més nova que la instal·lada i el lloc
 * complix els requisits. Si no, null.
 *
 * @param string $installada  Versió instal·lada.
 * @param string $plugin_file Ruta relativa del plugin ('' = la d'este fitxer).
 * @return array|null
 */
function socdepoble_enxufe_oferta( $installada = SOCDEPOBLE_ENXUFE_VERSIO, $plugin_file = '' ) {
	if ( '' !== socdepoble_enxufe_bloqueig_instal_lacio( $plugin_file ) ) {
		return null;
	}
	$canal = socdepoble_enxufe_canal();
	if ( null === $canal ) {
		return null;
	}
	$wp = $canal['wordpress'];
	if ( ! version_compare( $wp['versio'], (string) $installada, '>' ) || ! socdepoble_enxufe_compleix_requisits( $wp ) ) {
		return null;
	}
	return $wp;
}

/**
 * update_plugins_socdepoble.org — torna SEMPRE un objecte per al nostre
 * plugin: amb la versió instal·lada si no hi ha res nou (WordPress el posa a
 * no_update i mostra el commutador d'actualitzacions automàtiques) o amb la
 * versió i el paquet del canal signat si n'hi ha una de nova.
 *
 * @param array|false $update      Dades d'actualització d'un altre filtre.
 * @param array       $plugin_data Capçaleres del plugin.
 * @param string      $plugin_file Ruta relativa del plugin.
 * @param string[]    $locales     Llengües instal·lades (no s'usen).
 * @return array|false
 */
function socdepoble_enxufe_update_plugins( $update, $plugin_data, $plugin_file, $locales ) {
	unset( $locales );
	if ( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== $plugin_file ) {
		return $update;
	}
	$installada = is_array( $plugin_data ) && ! empty( $plugin_data['Version'] ) ? (string) $plugin_data['Version'] : SOCDEPOBLE_ENXUFE_VERSIO;
	$resposta   = array(
		'slug'    => SOCDEPOBLE_ENXUFE_SLUG,
		'version' => $installada,
		'url'     => 'https://socdepoble.org/enxufe/',
		'package' => '',
	);
	if ( '' !== socdepoble_enxufe_bloqueig_instal_lacio( $plugin_file ) ) {
		return $resposta;
	}
	$canal = socdepoble_enxufe_canal();
	if ( null === $canal ) {
		return $resposta;
	}
	$wp                       = $canal['wordpress'];
	$resposta['tested']       = $wp['tested'];
	$resposta['requires']     = $wp['requires'];
	$resposta['requires_php'] = $wp['requires_php'];
	$oferta                   = socdepoble_enxufe_oferta( $installada, $plugin_file );
	if ( null !== $oferta ) {
		$resposta['version'] = $oferta['versio'];
		$resposta['package'] = SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC . $oferta['versio'];
	}
	return $resposta;
}
add_filter( 'update_plugins_socdepoble.org', 'socdepoble_enxufe_update_plugins', 10, 4 );

/**
 * Seccions del readme.txt instal·lat, en HTML, per a «Mostra els detalls».
 * WordPress no llig mai el readme d'un plugin de fora del directori:
 * plugins_api() només pregunta als filtres o a api.wordpress.org. Només viatja
 * amb el canal propi; al directori, WordPress.org pinta el readme ell mateix.
 *
 * Format mínim de WordPress.org: «== Secció ==», «= Subtítol =», llistes «* »
 * i «1. », `codi` i enllaços https. Com fa WordPress.org, les seccions
 * desconegudes s'afigen a la descripció, i Upgrade Notice i Screenshots no hi
 * van.
 *
 * @return string[] HTML per clau: description, installation, faq i changelog.
 */
function socdepoble_enxufe_seccions_readme() {
	$fitxer = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'readme.txt';
	$text   = is_readable( $fitxer ) ? file_get_contents( $fitxer ) : false; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- fitxer local del mateix plugin.
	if ( ! is_string( $text ) || '' === $text ) {
		return array();
	}
	$alies    = array(
		'description'                => 'description',
		'installation'               => 'installation',
		'frequently asked questions' => 'faq',
		'faq'                        => 'faq',
		'changelog'                  => 'changelog',
	);
	$seccions = array();
	$clau     = '';
	foreach ( preg_split( '/\r\n|\r|\n/', $text ) as $linia ) {
		// «=== Nom ===» no casa: després de «==» ve un altre «=».
		if ( preg_match( '/^==\s*([^=].*?)\s*==\s*$/', $linia, $m ) ) {
			$titol = strtolower( $m[1] );
			if ( isset( $alies[ $titol ] ) ) {
				$clau = $alies[ $titol ];
			} elseif ( in_array( $titol, array( 'upgrade notice', 'screenshots' ), true ) ) {
				$clau = '';
			} else {
				$clau                = 'description';
				$seccions[ $clau ][] = '';
				$seccions[ $clau ][] = '= ' . $m[1] . ' =';
				$seccions[ $clau ][] = '';
			}
			continue;
		}
		if ( '' !== $clau ) {
			$seccions[ $clau ][] = $linia;
		}
	}
	return array_filter( array_map( 'socdepoble_enxufe_html_readme', $seccions ) );
}

/**
 * HTML d'una secció del readme. Les línies seguides del mateix tipus fan un
 * paràgraf o una llista; una línia buida els tanca. Cada text passa per
 * socdepoble_enxufe_linia_readme(), que l'escapa abans de transformar-lo: cap
 * etiqueta del readme no arriba crua.
 *
 * @param string[] $linies Línies de la secció.
 * @return string
 */
function socdepoble_enxufe_html_readme( $linies ) {
	$grups = array();
	foreach ( $linies as $linia ) {
		$linia = trim( (string) $linia );
		if ( '' === $linia ) {
			$grups[] = array( '', array() );
			continue;
		}
		if ( preg_match( '/^=\s*(.+?)\s*=$/', $linia, $m ) ) {
			$tipus = 'h4';
		} elseif ( preg_match( '/^[*-]\s+(.+)$/', $linia, $m ) ) {
			$tipus = 'ul';
		} elseif ( preg_match( '/^\d+\.\s+(.+)$/', $linia, $m ) ) {
			$tipus = 'ol';
		} else {
			$tipus = 'p';
			$m     = array( $linia, $linia );
		}
		$ultim = count( $grups ) - 1;
		if ( 'h4' !== $tipus && $ultim >= 0 && $tipus === $grups[ $ultim ][0] ) {
			$grups[ $ultim ][1][] = $m[1];
		} else {
			$grups[] = array( $tipus, array( $m[1] ) );
		}
	}
	$html = '';
	foreach ( $grups as list( $tipus, $textos ) ) {
		if ( 'p' === $tipus ) {
			$html .= '<p>' . socdepoble_enxufe_linia_readme( implode( ' ', $textos ) ) . '</p>';
		} elseif ( 'h4' === $tipus ) {
			$html .= '<h4>' . socdepoble_enxufe_linia_readme( $textos[0] ) . '</h4>';
		} elseif ( '' !== $tipus ) {
			$html .= '<' . $tipus . '>';
			foreach ( $textos as $text ) {
				$html .= '<li>' . socdepoble_enxufe_linia_readme( $text ) . '</li>';
			}
			$html .= '</' . $tipus . '>';
		}
	}
	return $html;
}

/**
 * Una línia de readme en HTML: PRIMER s'escapa i després es transformen
 * `codi` i els enllaços. Només https; un enllaç acaba abans d'una entitat que
 * no siga &amp; (cometes, < i > escapats) i no s'endú la puntuació final.
 *
 * @param string $text Text pla.
 * @return string
 */
function socdepoble_enxufe_linia_readme( $text ) {
	$html = (string) preg_replace( '/`([^`]+)`/', '<code>$1</code>', esc_html( $text ) );
	return (string) preg_replace( '#https://(?:[^\s<>&]|&amp;)*[^\s<>&.,;:)]#', '<a href="$0">$0</a>', $html );
}

/**
 * «Mostra els detalls» del plugin: sense este filtre WordPress preguntaria a
 * WordPress.org per l'slug i podria mostrar un plugin aliè. Les seccions i els
 * requisits ixen del readme i de la capçalera instal·lats; si el canal
 * verificat oferix una versió nova, els requisits i les notes són els seus.
 *
 * @param false|object|array $resultat Resultat d'un altre filtre.
 * @param string             $accio    Acció demanada.
 * @param object             $args     Arguments (slug).
 * @return false|object|array
 */
function socdepoble_enxufe_plugins_api( $resultat, $accio, $args ) {
	if ( 'plugin_information' !== $accio || ! is_object( $args ) || empty( $args->slug ) || SOCDEPOBLE_ENXUFE_SLUG !== $args->slug ) {
		return $resultat;
	}
	$canal  = socdepoble_enxufe_canal();
	$wp     = null !== $canal ? $canal['wordpress'] : null;
	$oferta = socdepoble_enxufe_oferta();
	$readme = socdepoble_enxufe_seccions_readme();
	$local  = get_file_data(
		SOCDEPOBLE_ENXUFE_FITXER,
		array(
			'requires'     => 'Requires at least',
			'requires_php' => 'Requires PHP',
		)
	) + get_file_data( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'readme.txt', array( 'tested' => 'Tested up to' ) );

	$seccions = array(
		'description' => '<p>' . esc_html__( 'Embeds the Sóc de Poble rural community app with the universal host markup. WordPress is one host among others: Sollutia or a static page embed exactly the same package.', 'socdepoble-enxufe' ) . '</p>' . ( $readme['description'] ?? '' ),
	);
	foreach ( array( 'installation', 'faq', 'changelog' ) as $clau ) {
		if ( ! empty( $readme[ $clau ] ) ) {
			$seccions[ $clau ] = $readme[ $clau ];
		}
	}
	// La versió oferida encara no és al readme instal·lat: primer, les seues notes.
	if ( '' !== ( $canal['notes'] ?? '' ) ) {
		$seccions['changelog'] = '<p><a href="' . esc_url( $canal['notes'] ) . '">' . esc_html__( 'Release notes', 'socdepoble-enxufe' ) . '</a></p>' . ( $seccions['changelog'] ?? '' );
	}
	if ( empty( $seccions['changelog'] ) ) {
		$seccions['changelog'] = '<p>' . esc_html__( 'No release notes published.', 'socdepoble-enxufe' ) . '</p>';
	}

	$info                = new stdClass();
	$info->name          = esc_html__( 'Sóc de Poble — Enxufe', 'socdepoble-enxufe' );
	$info->slug          = SOCDEPOBLE_ENXUFE_SLUG;
	$info->version       = null !== $oferta ? $oferta['versio'] : SOCDEPOBLE_ENXUFE_VERSIO;
	$info->author        = '<a href="https://socdepoble.org">Sóc de Poble</a>';
	$info->homepage      = 'https://socdepoble.org/enxufe/';
	$info->requires      = null !== $wp ? $wp['requires'] : $local['requires'];
	$info->requires_php  = null !== $wp ? $wp['requires_php'] : $local['requires_php'];
	$info->tested        = null !== $wp ? $wp['tested'] : $local['tested'];
	$info->last_updated  = null !== $canal ? $canal['generat'] : '';
	// Només l'oferta vigent, i simbòlica: cap camí d'instal·lació no baixa el zip sense verificar-lo.
	$info->download_link = null !== $oferta ? SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC . $oferta['versio'] : '';
	$info->external      = true;
	$info->sections      = array_map( 'wp_kses_post', $seccions );
	return $info;
}
add_filter( 'plugins_api', 'socdepoble_enxufe_plugins_api', 10, 3 );

/**
 * Descarrega el paquet del canal per a una actualització del NOSTRE plugin i
 * n'exigix la mida i el sha256 del manifest signat. Qualsevol altra baixada
 * passa intacta.
 *
 * @param false|string|WP_Error $resposta   Resultat d'un altre filtre.
 * @param string                $paquet     URL del paquet.
 * @param WP_Upgrader           $upgrader   L'actualitzador.
 * @param array                 $hook_extra Dades de l'operació (plugin).
 * @return false|string|WP_Error Ruta del fitxer verificat, o WP_Error.
 */
function socdepoble_enxufe_pre_descarrega( $resposta, $paquet, $upgrader, $hook_extra = array() ) {
	unset( $upgrader );
	if ( false !== $resposta || ! is_array( $hook_extra ) || plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== ( $hook_extra['plugin'] ?? '' ) ) {
		return $resposta;
	}
	/* Una oferta rància del transient no pot saltar-se res: es tornen a mirar
	   el bloqueig (enllaç simbòlic, git, carpeta, multilloc), el canal, la versió
	   i els requisits. Sense esborrar el transient ací: el bucle d'automàtiques
	   el continua usant per als plugins següents. Es caduca només el canal. */
	$bloqueig = socdepoble_enxufe_bloqueig_instal_lacio( $hook_extra['plugin'] );
	if ( '' !== $bloqueig ) {
		return new WP_Error( 'socdepoble_enxufe_bloqueig', $bloqueig );
	}
	if ( null === socdepoble_enxufe_canal() ) {
		return new WP_Error( 'socdepoble_enxufe_canal', __( 'The Sóc de Poble update channel could not be verified.', 'socdepoble-enxufe' ) );
	}
	$oferta = socdepoble_enxufe_oferta( SOCDEPOBLE_ENXUFE_VERSIO, $hook_extra['plugin'] );
	if ( 0 !== strpos( (string) $paquet, SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC ) || null === $oferta ) {
		socdepoble_enxufe_caduca_canal();
		return new WP_Error( 'socdepoble_enxufe_url', __( 'The package does not match the signed manifest.', 'socdepoble-enxufe' ) );
	}
	/* Es baixa sempre el paquet del manifest verificat ara, encara que siga més
	   nou que l'oferta del transient: la mida i el sha256 en són la garantia. */
	$esperat = $oferta['paquet'];
	$paquet  = $esperat['url'];

	if ( ! function_exists( 'wp_tempnam' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}
	$fitxer = wp_tempnam( SOCDEPOBLE_ENXUFE_SLUG . '.zip' );
	if ( ! $fitxer ) {
		return new WP_Error( 'socdepoble_enxufe_temporal', __( 'Could not create a temporary file.', 'socdepoble-enxufe' ) );
	}
	$descarrega = socdepoble_enxufe_amb_xarxa_local(
		$paquet,
		static function () use ( $paquet, $fitxer, $esperat ) {
			return wp_safe_remote_get(
				$paquet,
				array(
					'timeout'             => 300,
					'redirection'         => 5,
					'stream'              => true,
					'filename'            => $fitxer,
					'limit_response_size' => $esperat['mida'] + 1,
					'user-agent'          => socdepoble_enxufe_agent(),
				)
			);
		}
	);
	$error = '';
	if ( is_wp_error( $descarrega ) ) {
		$error = $descarrega->get_error_message();
	} elseif ( 200 !== (int) wp_remote_retrieve_response_code( $descarrega ) ) {
		/* translators: %d: HTTP status code. */
		$error = sprintf( __( 'The package download answered HTTP %d.', 'socdepoble-enxufe' ), (int) wp_remote_retrieve_response_code( $descarrega ) );
	} else {
		clearstatcache( true, $fitxer );
		$hash = hash_file( 'sha256', $fitxer );
		if ( filesize( $fitxer ) !== $esperat['mida'] || ! is_string( $hash ) || ! hash_equals( $esperat['sha256'], $hash ) ) {
			$error = __( 'The downloaded package does not match the size and SHA-256 of the signed manifest.', 'socdepoble-enxufe' );
		} else {
			$error = socdepoble_enxufe_error_arrel_zip( $fitxer );
		}
	}
	if ( '' !== $error ) {
		wp_delete_file( $fitxer );
		return new WP_Error( 'socdepoble_enxufe_paquet', $error );
	}
	return $fitxer;
}
add_filter( 'upgrader_pre_download', 'socdepoble_enxufe_pre_descarrega', 10, 4 );

/**
 * Comprova l'arrel del zip ABANS de tornar-lo a WordPress, quan encara no ha
 * desactivat el plugin ni tocat cap fitxer: totes les entrades dins de
 * socdepoble-enxufe/ i el fitxer principal present. Sense ZipArchive no es pot
 * mirar ací, i queda la segona barrera (upgrader_source_selection).
 *
 * @param string $fitxer Zip descarregat i verificat.
 * @return string '' si l'arrel és bona; el motiu si no.
 */
function socdepoble_enxufe_error_arrel_zip( $fitxer ) {
	if ( ! class_exists( 'ZipArchive' ) ) {
		return '';
	}
	$motiu = __( 'The update package must contain the socdepoble-enxufe folder with socdepoble-enxufe.php inside.', 'socdepoble-enxufe' );
	$zip   = new ZipArchive();
	if ( true !== $zip->open( $fitxer ) ) {
		return __( 'The package is not a valid zip file.', 'socdepoble-enxufe' );
	}
	$principal = false;
	$total     = (int) $zip->count();
	for ( $i = 0; $i < $total; $i++ ) {
		$nom = (string) $zip->getNameIndex( $i );
		if ( 0 !== strpos( $nom, SOCDEPOBLE_ENXUFE_SLUG . '/' ) ) {
			$zip->close();
			return $motiu;
		}
		if ( SOCDEPOBLE_ENXUFE_SLUG . '/socdepoble-enxufe.php' === $nom ) {
			$principal = true;
		}
	}
	$zip->close();
	return $principal ? '' : $motiu;
}

/**
 * Segona barrera: l'arrel del zip ha de ser la carpeta socdepoble-enxufe amb
 * el fitxer principal dins. La primera és a la baixada (abans que WordPress
 * desactive el plugin); esta cobrix els llocs sense ZipArchive. Refusar és
 * millor que reanomenar a cegues.
 *
 * @param string|WP_Error $origen       Carpeta desempaquetada.
 * @param string          $origen_remot Carpeta de treball.
 * @param WP_Upgrader     $upgrader     L'actualitzador.
 * @param array           $hook_extra   Dades de l'operació (plugin).
 * @return string|WP_Error
 */
function socdepoble_enxufe_seleccio_origen( $origen, $origen_remot, $upgrader, $hook_extra = array() ) {
	global $wp_filesystem;
	unset( $origen_remot, $upgrader );
	if ( is_wp_error( $origen ) || ! is_array( $hook_extra ) || plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== ( $hook_extra['plugin'] ?? '' ) ) {
		return $origen;
	}
	$carpeta   = untrailingslashit( (string) $origen );
	$principal = $carpeta . '/socdepoble-enxufe.php';
	/* $origen és una ruta del WP_Filesystem de l'actualitzador: amb FTP o SSH
	   engabiats no és la ruta local, i s'ha de preguntar a ell. */
	$existix = $wp_filesystem instanceof WP_Filesystem_Base ? $wp_filesystem->is_file( $principal ) : file_exists( $principal );
	if ( SOCDEPOBLE_ENXUFE_SLUG !== basename( $carpeta ) || ! $existix ) {
		return new WP_Error( 'socdepoble_enxufe_arrel', __( 'The update package must contain the socdepoble-enxufe folder with socdepoble-enxufe.php inside.', 'socdepoble-enxufe' ) );
	}
	return $origen;
}
add_filter( 'upgrader_source_selection', 'socdepoble_enxufe_seleccio_origen', 10, 4 );

/**
 * Quan WordPress buida la seua memòria cau d'actualitzacions (per exemple,
 * «Comprova-ho de nou»), el canal també caduca.
 */
function socdepoble_enxufe_caduca_canal() {
	$estat = socdepoble_enxufe_estat_canal();
	if ( ! empty( $estat['comprovat'] ) ) {
		$estat['comprovat'] = 0;
		socdepoble_enxufe_desa_estat_canal( $estat );
	}
}
add_action( 'delete_site_transient_update_plugins', 'socdepoble_enxufe_caduca_canal' );

/**
 * Botó «Comprova el canal ara» de la pàgina d'ajustos.
 */
function socdepoble_enxufe_comprova_ara() {
	if ( ! current_user_can( 'update_plugins' ) ) {
		wp_die( esc_html__( 'You are not allowed to update plugins.', 'socdepoble-enxufe' ), 403 );
	}
	check_admin_referer( 'socdepoble_enxufe_comprova' );
	delete_site_transient( 'update_plugins' );
	socdepoble_enxufe_canal( true );
	wp_safe_redirect( admin_url( 'options-general.php?page=socdepoble-enxufe' ) );
	exit;
}
add_action( 'admin_post_socdepoble_enxufe_comprova', 'socdepoble_enxufe_comprova_ara' );

/**
 * Activar el plugin buida la memòria cau d'actualitzacions de WordPress.
 *
 * En instal·lar-lo, WordPress comprova les actualitzacions amb el plugin
 * encara inactiu: el filtre update_plugins_{host} no hi és, el plugin no entra
 * ni a response ni a no_update, i la columna «Actualitzacions automàtiques» ix
 * buida. Com que la versió no canvia, la comprovació no es repetix fins que
 * caduca la memòria cau (1 h a Extensions, 12 h a la resta de l'administració;
 * wp-includes/update.php). Esborrar-la és el que ja fan «Comprova-ho de nou» i
 * wp_clean_plugins_cache(): la pròxima pàgina d'administració torna a
 * preguntar amb el plugin carregat, i pel ganxo de més amunt el canal també
 * caduca. No s'hi escriu res. Una activació silenciosa (la reactivació després
 * d'una actualització) no passa per ací.
 */
function socdepoble_enxufe_en_activar() {
	delete_site_transient( 'update_plugins' );
}
register_activation_hook( SOCDEPOBLE_ENXUFE_FITXER, 'socdepoble_enxufe_en_activar' );

/**
 * Cert si l'última comprovació de WordPress ha passat pel nostre filtre (el
 * plugin és a response o a no_update). No hi passa si api.wordpress.org no ha
 * respost 200.
 *
 * @return bool
 */
function socdepoble_enxufe_wp_aplica_el_canal() {
	$actualitzacions = get_site_transient( 'update_plugins' );
	$fitxer          = plugin_basename( SOCDEPOBLE_ENXUFE_FITXER );
	return is_object( $actualitzacions ) && ( isset( $actualitzacions->response[ $fitxer ] ) || isset( $actualitzacions->no_update[ $fitxer ] ) );
}

/**
 * Secció «Canal d'actualitzacions» de la pàgina d'ajustos. Només llig l'estat
 * desat: cap crida de xarxa en obrir la pàgina.
 */
function socdepoble_enxufe_seccio_canal() {
	$estat                 = socdepoble_enxufe_estat_canal();
	list( $canal, $motiu ) = socdepoble_enxufe_analitza_canal( $estat['cos'] ?? '', $estat['signatura'] ?? '' );
	$clau                  = socdepoble_enxufe_clau_publica();
	$comprovat             = isset( $estat['comprovat'] ) ? (int) $estat['comprovat'] : 0;
	$bloqueig              = socdepoble_enxufe_bloqueig_instal_lacio();

	$files = array(
		__( 'Channel', 'socdepoble-enxufe' )                 => SOCDEPOBLE_ENXUFE_CANAL,
		__( 'Signing key', 'socdepoble-enxufe' )             => '' !== $clau ? $clau : __( 'none: no update will be offered', 'socdepoble-enxufe' ),
		__( 'Last check', 'socdepoble-enxufe' )              => $comprovat > 0 ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $comprovat ) : __( 'never', 'socdepoble-enxufe' ),
		__( 'Latest verified release', 'socdepoble-enxufe' ) => null !== $canal ? $canal['versio'] : $motiu,
		__( 'Last error', 'socdepoble-enxufe' )              => ! empty( $estat['error'] ) ? (string) $estat['error'] : __( 'none', 'socdepoble-enxufe' ),
		__( 'WordPress update check', 'socdepoble-enxufe' )  => socdepoble_enxufe_wp_aplica_el_canal() ? __( 'The channel is applied.', 'socdepoble-enxufe' ) : __( 'Not applied yet: WordPress only asks the channel after api.wordpress.org answers its update check.', 'socdepoble-enxufe' ),
		__( 'This installation', 'socdepoble-enxufe' )       => '' !== $bloqueig ? $bloqueig : __( 'Can update itself.', 'socdepoble-enxufe' ),
	);
	?>
	<h2><?php esc_html_e( 'Update channel', 'socdepoble-enxufe' ); ?></h2>
	<p><?php esc_html_e( 'Updates come from the signed Sóc de Poble channel, not from WordPress.org. Automatic updates are off until an administrator turns them on in the Plugins screen.', 'socdepoble-enxufe' ); ?></p>
	<table class="widefat striped" role="presentation">
		<tbody>
		<?php foreach ( $files as $etiqueta => $valor ) : ?>
			<tr>
				<th scope="row"><?php echo esc_html( $etiqueta ); ?></th>
				<td><code><?php echo esc_html( $valor ); ?></code></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<?php if ( current_user_can( 'update_plugins' ) ) : ?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="socdepoble_enxufe_comprova" />
			<?php wp_nonce_field( 'socdepoble_enxufe_comprova' ); ?>
			<?php submit_button( __( 'Check the channel now', 'socdepoble-enxufe' ), 'secondary', 'submit', false ); ?>
		</form>
	<?php endif; ?>
	<?php
}

/**
 * Prova de Salut del canal. És directa (síncrona), per això només llig l'estat
 * desat i no fa cap crida de xarxa: la lectura remota és del cicle
 * d'actualitzacions de WordPress i del botó «Comprova el canal ara».
 *
 * @return array
 */
function socdepoble_enxufe_prova_canal() {
	$prova    = 'socdepoble_enxufe_canal';
	$bloqueig = socdepoble_enxufe_bloqueig_instal_lacio();
	if ( '' !== $bloqueig ) {
		return socdepoble_enxufe_resultat_salut( $prova, 'recommended', __( 'Sóc de Poble cannot update itself here', 'socdepoble-enxufe' ), $bloqueig );
	}
	if ( '' === socdepoble_enxufe_clau_publica() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'The Sóc de Poble update channel has no signing key', 'socdepoble-enxufe' ),
			__( 'Updates stay off until the plugin carries the public key of the channel. Install a release package, which always carries it.', 'socdepoble-enxufe' )
		);
	}
	$estat         = socdepoble_enxufe_estat_canal();
	list( $canal ) = socdepoble_enxufe_analitza_canal( $estat['cos'] ?? '', $estat['signatura'] ?? '' );
	if ( null === $canal ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'The Sóc de Poble update channel could not be verified', 'socdepoble-enxufe' ),
			! empty( $estat['error'] ) ? (string) $estat['error'] : __( 'The channel has not been read yet.', 'socdepoble-enxufe' )
		);
	}
	if ( ! socdepoble_enxufe_wp_aplica_el_canal() ) {
		return socdepoble_enxufe_resultat_salut(
			$prova,
			'recommended',
			__( 'WordPress has not asked the Sóc de Poble update channel yet', 'socdepoble-enxufe' ),
			__( 'The channel verifies, but WordPress only consults it after api.wordpress.org answers its update check. If this site blocks api.wordpress.org or has no Internet access, no update will be offered.', 'socdepoble-enxufe' )
		);
	}
	return socdepoble_enxufe_resultat_salut(
		$prova,
		'good',
		__( 'The Sóc de Poble update channel is verified', 'socdepoble-enxufe' ),
		/* translators: %s: version number. */
		sprintf( __( 'The latest signed release is %s.', 'socdepoble-enxufe' ), $canal['versio'] )
	);
}

/**
 * Cel·la «Actualitzacions automàtiques» d'Extensions, només per a este plugin:
 * si el canal no pot portar cap actualització, ho diu davall del commutador (o
 * de la cel·la buida) i enllaça els Ajustos. És el mateix diagnòstic que la
 * prova de Salut, sense cap crida de xarxa, i reutilitza les seues etiquetes ja
 * traduïdes. No amaga ni substituïx el commutador de WordPress: l'administrador
 * decidix igualment. Quan el canal està verificat i aplicat, la cel·la queda
 * com la pinta WordPress.
 *
 * @param string $html        HTML de la cel·la, ja escapat per WordPress.
 * @param string $plugin_file Ruta relativa del plugin.
 * @return string
 */
function socdepoble_enxufe_avis_automatiques( $html, $plugin_file ) {
	if ( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== $plugin_file ) {
		return $html;
	}
	$prova = socdepoble_enxufe_prova_canal();
	if ( 'good' === $prova['status'] ) {
		return $html;
	}
	return $html . sprintf(
		'<p class="description"><a href="%1$s">%2$s</a></p>',
		esc_url( admin_url( 'options-general.php?page=socdepoble-enxufe' ) ),
		esc_html( $prova['label'] )
	);
}
add_filter( 'plugin_auto_update_setting_html', 'socdepoble_enxufe_avis_automatiques', 10, 2 );
