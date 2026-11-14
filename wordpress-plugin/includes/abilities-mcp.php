<?php
/**
 * Abilities API i pont MCP sobirà per a WordPress 6.9+ / 7.0+ (IDEA-262).
 *
 * En versions anteriors de WordPress on wp_register_ability no existix, este
 * mòdul és un no-op net i manté intacte el sòl mínim del connector.
 *
 * Totes les capacitats registrades són de lectura o de previsualització sense
 * escriptura (dry-run), amb esquemes d'entrada i eixida tancats i control de
 * permisos basat en current_user_can (mai is_admin), també sobre cada objecte
 * que es demana. Cap URL arbitrària, cap secret, cap ordre de sistema, cap
 * importació ni cap publicació: la preimportació torna una proposta acotada.
 *
 * Contracte del nucli (wp-includes/abilities-api, 6.9+): amb input_schema, una
 * entrada absent (null) només es valida si l'esquema porta «default», com fan
 * les abilities del nucli; sense, una crida GET sense «input» fallaria amb
 * ability_invalid_input. L'eixida es valida amb output_schema.
 *
 * Transport: les tres abilities s'exposen per l'API REST del nucli
 * (meta.show_in_rest). El nucli no porta cap servidor MCP, i cap d'elles no
 * declara meta.mcp.public: un adaptador MCP que només publica les marcades no
 * les veurà fins que el Mestre decidisca exposar-les (decisió oberta R26.2).
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/** Caràcters (no bytes) màxims d'un títol, del subtítol i de cada H3 de la proposta. */
const SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL = 300;
/** Caràcters màxims de l'entradilla de la proposta. */
const SOCDEPOBLE_ENXUFE_ABILITY_MAX_ENTRADILLA = 320;
/** Caràcters màxims del resum de la secció de context de la proposta. */
const SOCDEPOBLE_ENXUFE_ABILITY_MAX_RESUM = 2000;

/**
 * Registra la categoria d'abilities de Sóc de Poble a WordPress 6.9+.
 */
function socdepoble_enxufe_registra_categoria_abilities() {
	if ( ! function_exists( 'wp_register_ability_category' ) ) {
		return;
	}
	wp_register_ability_category(
		'socdepoble',
		array(
			'label'       => __( 'Sóc de Poble', 'socdepoble' ),
			'description' => __( 'Read-only diagnostics, accessibility checks and Pedra Seca draft preparation for the Sóc de Poble community portal.', 'socdepoble' ),
		)
	);
}
add_action( 'wp_abilities_api_categories_init', 'socdepoble_enxufe_registra_categoria_abilities' );

/**
 * Permís d'administració real per a les abilities de diagnòstic i auditoria.
 *
 * @return bool
 */
function socdepoble_enxufe_permis_ability_admin() {
	return current_user_can( 'manage_options' );
}

/**
 * Permís d'edició per a preparar un esborrany Pedra Seca sense publicar-lo.
 * El permís sobre l'entrada concreta es comprova a l'execució.
 *
 * @return bool
 */
function socdepoble_enxufe_permis_ability_editor() {
	return current_user_can( 'manage_options' ) || current_user_can( 'edit_posts' );
}

/**
 * Retalla a un nombre de caràcters sense partir cap caràcter UTF-8 (substr
 * en bytes deixaria un JSON invàlid). WordPress definix mb_substr si l'amfitrió
 * no té mbstring (compat.php).
 *
 * @param string $text  Text net.
 * @param int    $limit Caràcters màxims.
 * @return string
 */
function socdepoble_enxufe_ability_retalla( $text, $limit ) {
	return mb_substr( (string) $text, 0, $limit, 'UTF-8' );
}

/**
 * Registra les tres abilities MCP de Sóc de Poble quan el nucli ho suporta.
 */
function socdepoble_enxufe_registra_abilities_mcp() {
	if ( ! function_exists( 'wp_register_ability' ) ) {
		return;
	}

	$annotations_lectura = array(
		'readonly'    => true,
		'destructive' => false,
		'idempotent'  => true,
	);

	wp_register_ability(
		'socdepoble/diagnostica-enxufe',
		array(
			'label'               => __( 'Diagnose Sóc de Poble package', 'socdepoble' ),
			'description'         => __( 'Returns the integrity status of the local bundle, chunks, active village and translation provider without exposing any secret key.', 'socdepoble' ),
			'category'            => 'socdepoble',
			// Sense entrada: només {} (o res, per la «default»). Cap «properties» buida, que en
			// JSON seria [] i no un objecte d'esquema.
			'input_schema'        => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'default'              => array(),
			),
			'output_schema'       => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'required'             => array( 'te_bundle', 'trossos_sencers', 'te_manifest', 'node_inadequat', 'poble', 'nom_poble', 'proveidor_traduccio', 'wp_secrets_key_activa', 'secrets_api_disponible' ),
				'properties'           => array(
					'te_bundle'              => array( 'type' => 'boolean' ),
					'trossos_sencers'        => array( 'type' => 'boolean' ),
					'te_manifest'            => array( 'type' => 'boolean' ),
					'node_inadequat'         => array( 'type' => 'boolean' ),
					'poble'                  => array( 'type' => 'string' ),
					'nom_poble'              => array( 'type' => 'string' ),
					'proveidor_traduccio'    => array(
						'type' => 'string',
						'enum' => array( 'deepl', 'motor_propi', 'apertium' ),
					),
					'wp_secrets_key_activa'  => array( 'type' => 'boolean' ),
					'secrets_api_disponible' => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => 'socdepoble_enxufe_ability_diagnostica',
			'permission_callback' => 'socdepoble_enxufe_permis_ability_admin',
			'meta'                => array(
				'show_in_rest' => true,
				'annotations'  => $annotations_lectura,
			),
		)
	);

	wp_register_ability(
		'socdepoble/audita-accessibilitat-i-privadesa',
		array(
			'label'               => __( 'Audit accessibility and privacy', 'socdepoble' ),
			'description'         => __( 'Scans recent published posts and pages in read-only mode to detect missing image alt attributes, heading jumps and third-party trackers or external fonts.', 'socdepoble' ),
			'category'            => 'socdepoble',
			'input_schema'        => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'default'              => array(),
				'properties'           => array(
					'limit' => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 50,
						'default' => 20,
					),
					'tipus' => array(
						'type'    => 'string',
						'enum'    => array( 'post', 'page', 'tots' ),
						'default' => 'tots',
					),
				),
			),
			'output_schema'       => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'required'             => array( 'elements_revisats', 'resum', 'incidencies' ),
				'properties'           => array(
					'elements_revisats' => array(
						'type'    => 'integer',
						'minimum' => 0,
						'maximum' => 50,
					),
					'resum'             => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'required'             => array( 'imatges_sense_alt', 'salts_encapcalament', 'recursos_tercers' ),
						'properties'           => array(
							'imatges_sense_alt'   => array( 'type' => 'integer' ),
							'salts_encapcalament' => array( 'type' => 'integer' ),
							'recursos_tercers'    => array( 'type' => 'integer' ),
						),
					),
					'incidencies'       => array(
						'type'     => 'array',
						'maxItems' => 50,
						'items'    => array(
							'type'                 => 'object',
							'additionalProperties' => false,
							'required'             => array( 'post_id', 'titol', 'imatges_sense_alt', 'salts_encapcalament', 'recursos_tercers', 'codis' ),
							'properties'           => array(
								'post_id'             => array( 'type' => 'integer' ),
								'titol'               => array(
									'type'      => 'string',
									'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL,
								),
								'imatges_sense_alt'   => array( 'type' => 'integer' ),
								'salts_encapcalament' => array( 'type' => 'integer' ),
								'recursos_tercers'    => array( 'type' => 'integer' ),
								'codis'               => array(
									'type'  => 'array',
									'items' => array(
										'type' => 'string',
										'enum' => array( 'imatges_sense_alt', 'salts_encapcalament', 'recursos_tercers' ),
									),
								),
							),
						),
					),
				),
			),
			'execute_callback'    => 'socdepoble_enxufe_ability_audita_a11y_privadesa',
			'permission_callback' => 'socdepoble_enxufe_permis_ability_admin',
			'meta'                => array(
				'show_in_rest' => true,
				'annotations'  => $annotations_lectura,
			),
		)
	);

	wp_register_ability(
		'socdepoble/prepara-importacio-pedra-seca',
		array(
			'label'               => __( 'Prepare Pedra Seca import draft', 'socdepoble' ),
			'description'         => __( 'Builds a normalized Pedra Seca dry-run draft (H1, H2 subtitle, lead paragraph and H3 sections) for human review without publishing anything automatically.', 'socdepoble' ),
			'category'            => 'socdepoble',
			'input_schema'        => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'default'              => array(),
				'properties'           => array(
					'post_id'        => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
					'titol'          => array(
						'type'      => 'string',
						'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL,
					),
					'contingut_html' => array(
						'type'      => 'string',
						'maxLength' => 65536,
					),
					'desti'          => array(
						'type'    => 'string',
						'enum'    => array( 'mur', 'calendari' ),
						'default' => 'mur',
					),
				),
			),
			'output_schema'       => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'required'             => array( 'desti', 'h1', 'subtitol_h2', 'entradilla', 'seccions_h3', 'requerix_revisio_humana', 'publicat_automaticament' ),
				'properties'           => array(
					'desti'                   => array(
						'type' => 'string',
						'enum' => array( 'mur', 'calendari' ),
					),
					'h1'                      => array(
						'type'      => 'string',
						'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL,
					),
					'subtitol_h2'             => array(
						'type'      => 'string',
						'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL,
					),
					'entradilla'              => array(
						'type'      => 'string',
						'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_ENTRADILLA,
					),
					'seccions_h3'             => array(
						'type'     => 'array',
						'maxItems' => 8,
						'items'    => array(
							'type'                 => 'object',
							'additionalProperties' => false,
							'required'             => array( 'titol_h3' ),
							'properties'           => array(
								'titol_h3' => array(
									'type'      => 'string',
									'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL,
								),
								'resum'    => array(
									'type'      => 'string',
									'maxLength' => SOCDEPOBLE_ENXUFE_ABILITY_MAX_RESUM,
								),
							),
						),
					),
					'requerix_revisio_humana' => array(
						'type' => 'boolean',
						'enum' => array( true ),
					),
					'publicat_automaticament' => array(
						'type' => 'boolean',
						'enum' => array( false ),
					),
				),
			),
			'execute_callback'    => 'socdepoble_enxufe_ability_prepara_pedra_seca',
			'permission_callback' => 'socdepoble_enxufe_permis_ability_editor',
			'meta'                => array(
				'show_in_rest' => true,
				'annotations'  => $annotations_lectura,
			),
		)
	);
}
add_action( 'wp_abilities_api_init', 'socdepoble_enxufe_registra_abilities_mcp' );

/**
 * Executa socdepoble/diagnostica-enxufe sense revelar mai cap secret.
 *
 * @return array
 */
function socdepoble_enxufe_ability_diagnostica() {
	$manifest = socdepoble_enxufe_manifest_local();
	$poble    = (string) get_option( 'socdepoble_enxufe_poble', '' );
	$nom      = (string) get_option( 'socdepoble_enxufe_nompoble', '' );

	return array(
		'te_bundle'              => (bool) socdepoble_enxufe_te_bundle(),
		'trossos_sencers'        => (bool) socdepoble_enxufe_trossos_sencers(),
		'te_manifest'            => null !== $manifest,
		'node_inadequat'         => (bool) socdepoble_enxufe_node_inadequat(),
		'poble'                  => sanitize_title( $poble ),
		'nom_poble'              => sanitize_text_field( $nom ),
		'proveidor_traduccio'    => socdepoble_enxufe_traduccio_proveidor_actiu(),
		'wp_secrets_key_activa'  => socdepoble_enxufe_secrets_wp72_clau_activa(),
		'secrets_api_disponible' => socdepoble_enxufe_secrets_wp72_disponible(),
	);
}

/**
 * Analitza un fragment d'HTML d'entrada o pàgina per a accessibilitat i privadesa.
 *
 * @param string $html Contingut HTML de l'entrada.
 * @return array{imatges_sense_alt: int, salts_encapcalament: int, recursos_tercers: int, detalls: array<int, string>}
 */
function socdepoble_enxufe_analitza_html_a11y_privadesa( $html ) {
	$contingut = is_string( $html ) ? $html : '';
	$sense_alt = 0;
	$salts     = 0;
	$tercers   = 0;
	$detalls   = array();

	if ( preg_match_all( '/<img\b[^>]*>/i', $contingut, $imatges ) ) {
		foreach ( $imatges[0] as $etiqueta ) {
			if ( ! preg_match( '/\balt\s*=\s*(["\'])(.*?)\1/is', $etiqueta, $alt_match ) ) {
				$sense_alt += 1;
			} elseif ( '' === trim( $alt_match[2] ) && ! preg_match( '/\b(?:role\s*=\s*["\']presentation["\']|aria-hidden\s*=\s*["\']true["\'])/i', $etiqueta ) ) {
				$sense_alt += 1;
			}
		}
	}
	if ( $sense_alt > 0 ) {
		$detalls[] = 'imatges_sense_alt';
	}

	if ( preg_match_all( '/<h([1-6])\b/i', $contingut, $encapcalaments ) ) {
		$anterior = 0;
		foreach ( $encapcalaments[1] as $nivell_txt ) {
			$nivell = intval( $nivell_txt );
			if ( $anterior > 0 && $nivell > $anterior + 1 ) {
				$salts += 1;
			}
			$anterior = $nivell;
		}
	}
	if ( $salts > 0 ) {
		$detalls[] = 'salts_encapcalament';
	}

	if ( preg_match_all( '/\b(?:src|href)\s*=\s*["\']https?:\/\/([^"\'\/\s]+)/i', $contingut, $urls ) ) {
		$lloc_host = wp_parse_url( home_url(), PHP_URL_HOST );
		$propi     = is_string( $lloc_host ) ? strtolower( $lloc_host ) : '';
		foreach ( $urls[1] as $host_cru ) {
			$host = strtolower( trim( $host_cru ) );
			if ( '' === $host || $host === $propi ) {
				continue;
			}
			if ( preg_match( '/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|googletagmanager\.com|google-analytics\.com|doubleclick\.net|connect\.facebook\.net|youtube\.com|youtu\.be|vimeo\.com)$/i', $host ) ) {
				$tercers += 1;
			}
		}
	}
	if ( $tercers > 0 ) {
		$detalls[] = 'recursos_tercers';
	}

	return array(
		'imatges_sense_alt'   => $sense_alt,
		'salts_encapcalament' => $salts,
		'recursos_tercers'    => $tercers,
		'detalls'             => $detalls,
	);
}

/**
 * Executa socdepoble/audita-accessibilitat-i-privadesa sobre contingut publicat.
 *
 * @param mixed $entrada Arguments de l'ability.
 * @return array
 */
function socdepoble_enxufe_ability_audita_a11y_privadesa( $entrada = array() ) {
	$args  = is_array( $entrada ) ? $entrada : array();
	$limit = isset( $args['limit'] ) ? max( 1, min( 50, intval( $args['limit'] ) ) ) : 20;
	$tipus = isset( $args['tipus'] ) && is_string( $args['tipus'] ) ? $args['tipus'] : 'tots';

	$post_type = array( 'post', 'page' );
	if ( 'post' === $tipus || 'page' === $tipus ) {
		$post_type = array( $tipus );
	}

	$peces = get_posts(
		array(
			'post_type'        => $post_type,
			'post_status'      => 'publish',
			'numberposts'      => $limit,
			'orderby'          => 'date',
			'order'            => 'DESC',
			'suppress_filters' => true,
		)
	);

	$total_alt     = 0;
	$total_salts   = 0;
	$total_tercers = 0;
	$incidencies   = array();

	if ( is_array( $peces ) ) {
		foreach ( $peces as $post ) {
			if ( ! is_object( $post ) ) {
				continue;
			}
			$analisi        = socdepoble_enxufe_analitza_html_a11y_privadesa( isset( $post->post_content ) ? (string) $post->post_content : '' );
			$total_alt     += $analisi['imatges_sense_alt'];
			$total_salts   += $analisi['salts_encapcalament'];
			$total_tercers += $analisi['recursos_tercers'];

			if ( array() !== $analisi['detalls'] ) {
				$incidencies[] = array(
					'post_id'             => isset( $post->ID ) ? intval( $post->ID ) : 0,
					'titol'               => isset( $post->post_title ) ? socdepoble_enxufe_ability_retalla( sanitize_text_field( (string) $post->post_title ), SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL ) : '',
					'imatges_sense_alt'   => $analisi['imatges_sense_alt'],
					'salts_encapcalament' => $analisi['salts_encapcalament'],
					'recursos_tercers'    => $analisi['recursos_tercers'],
					'codis'               => $analisi['detalls'],
				);
			}
		}
	}

	return array(
		'elements_revisats' => is_array( $peces ) ? count( $peces ) : 0,
		'resum'             => array(
			'imatges_sense_alt'   => $total_alt,
			'salts_encapcalament' => $total_salts,
			'recursos_tercers'    => $total_tercers,
		),
		'incidencies'       => $incidencies,
	);
}

/**
 * Cert si l'usuari actual pot fer servir esta entrada com a font d'una
 * proposta. read_post no basta: no mira la contrasenya d'una entrada protegida
 * (la llig qualsevol amb «read») i accepta tipus interns que no són contingut
 * editorial (user_request porta el correu d'una sol·licitud de privadesa). Una
 * entrada inexistent, d'un altre tipus o sense permís torna el mateix error.
 *
 * @param int $post_id Identificador de l'entrada.
 * @return WP_Post|object|null L'entrada, o null si no es pot fer servir.
 */
function socdepoble_enxufe_ability_post_llegible( $post_id ) {
	if ( ! current_user_can( 'read_post', $post_id ) ) {
		return null;
	}
	$post = get_post( $post_id );
	if ( ! is_object( $post ) || ! isset( $post->post_type ) || ! in_array( $post->post_type, array( 'post', 'page' ), true ) ) {
		return null;
	}
	if ( isset( $post->post_password ) && '' !== (string) $post->post_password && ! current_user_can( 'edit_post', $post_id ) ) {
		return null;
	}
	return $post;
}

/**
 * Les etiquetes d'encapçalament d'un HTML en una sola passada lineal, sense
 * PCRE: cada obertura «<hN» (N de 1 a 6, sense distingir majúscules) seguida
 * d'un caràcter que no és de paraula, acabada al primer «>», i cada tancament
 * literal «</hN>». Són els mateixos tokens que els patrons
 * «<h[1-6]\b[^>]*>(.*?)<\/h[1-6]>»is d'abans, que costaven O(n²) en un
 * amfitrió sense PCRE JIT: 64 KiB de «<h2></h>» o de «<h2>» sense tancar eren
 * segons de CPU per crida, a l'abast de qualsevol col·laborador.
 *
 * @param string $html HTML de la proposta.
 * @return array{obertures: array<int, array{0: int, 1: int, 2: int}>, tancaments: array<int, array{0: int, 1: int}>}
 *         obertures: [inici, fi després del «>», nivell]; tancaments: [inici, nivell].
 */
function socdepoble_enxufe_ability_etiquetes_h( $html ) {
	$obertures  = array();
	$tancaments = array();
	$llarg      = strlen( $html );
	$fi_tag     = -1;
	$pos        = 0;
	while ( $pos < $llarg ) {
		$lt = strpos( $html, '<', $pos );
		if ( false === $lt ) {
			break;
		}
		$pos   = $lt + 1;
		$tanca = $lt + 1 < $llarg && '/' === $html[ $lt + 1 ];
		$h     = $lt + ( $tanca ? 2 : 1 );
		if ( $h + 1 >= $llarg || ( 'h' !== $html[ $h ] && 'H' !== $html[ $h ] ) || false === strpos( '123456', $html[ $h + 1 ] ) ) {
			continue;
		}
		$nivell = intval( $html[ $h + 1 ] );
		if ( $tanca ) {
			if ( $h + 2 < $llarg && '>' === $html[ $h + 2 ] ) {
				$tancaments[] = array( $lt, $nivell );
			}
			continue;
		}
		// El «\b» del patró: després de la xifra, cap [A-Za-z0-9_].
		if ( $h + 2 < $llarg && false !== strpos( 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_', $html[ $h + 2 ] ) ) {
			continue;
		}
		// El primer «>» d'una posició no recula mai: es reaprofita, i el recorregut és lineal.
		if ( $fi_tag < $h + 2 ) {
			$fi_tag = strpos( $html, '>', $h + 2 );
			if ( false === $fi_tag ) {
				break;
			}
		}
		$obertures[] = array( $lt, $fi_tag + 1, $nivell );
	}
	return array(
		'obertures'  => $obertures,
		'tancaments' => $tancaments,
	);
}

/**
 * Els encapçalaments casats com ho feia preg_match_all amb
 * «<h[obertura]\b[^>]*>(.*?)<\/h[tancament]>»is: per a cada obertura admesa,
 * el primer tancament admés que comença després del seu «>», i la cerca
 * continua darrere d'eixe tancament. Els dos índexs només avancen.
 *
 * @param string $html       HTML de la proposta.
 * @param array  $etiquetes  Resultat de socdepoble_enxufe_ability_etiquetes_h().
 * @param int[]  $obertura   Nivells admesos per a l'obertura.
 * @param int[]  $tancament  Nivells admesos per al tancament.
 * @return array<int, array{0: int, 1: int, 2: string}> [inici, fi, contingut].
 */
function socdepoble_enxufe_ability_casa_h( $html, $etiquetes, $obertura, $tancament ) {
	$casats = array();
	$t      = $etiquetes['tancaments'];
	$n      = count( $t );
	$j      = 0;
	$cursor = 0;
	foreach ( $etiquetes['obertures'] as $o ) {
		if ( $o[0] < $cursor || ! in_array( $o[2], $obertura, true ) ) {
			continue;
		}
		while ( $j < $n && ( $t[ $j ][0] < $o[1] || ! in_array( $t[ $j ][1], $tancament, true ) ) ) {
			++$j;
		}
		if ( $j >= $n ) {
			break;
		}
		$casats[] = array( $o[0], $t[ $j ][0] + 5, substr( $html, $o[1], $t[ $j ][0] - $o[1] ) );
		$cursor   = $t[ $j ][0] + 5;
		++$j;
	}
	return $casats;
}

/**
 * El text pla d'un HTML, com wp_strip_all_tags() (fora els blocs <script> i
 * <style> amb el seu contingut, fora les etiquetes, trim) però en temps
 * lineal: el patró del nucli «<(script|style)[^>]*?>.*?</\1>»si també és O(n²)
 * sense PCRE JIT (64 KiB de «<script>» sense tancar, més d'un segon per
 * crida). Casa com ell: cada obertura acaba al primer «>» i es tanca amb el
 * primer «</script>» o «</style>» del mateix nom, sense distingir majúscules.
 *
 * @param string $html HTML.
 * @return string
 */
function socdepoble_enxufe_ability_text_pla( $html ) {
	$text    = (string) $html;
	$minus   = strtolower( $text );
	$llarg   = strlen( $text );
	$net     = '';
	$des_de  = 0;
	$pos     = 0;
	$fi_tag  = -1;
	$tanca   = array(
		'script' => -1,
		'style'  => -1,
	);
	while ( $pos < $llarg ) {
		$lt = strpos( $minus, '<', $pos );
		if ( false === $lt ) {
			break;
		}
		$pos = $lt + 1;
		$nom = 'script' === substr( $minus, $lt + 1, 6 ) ? 'script' : ( 'style' === substr( $minus, $lt + 1, 5 ) ? 'style' : '' );
		if ( '' === $nom || false === $tanca[ $nom ] ) {
			continue;
		}
		$despres_nom = $lt + 1 + strlen( $nom );
		if ( $fi_tag < $despres_nom ) {
			$fi_tag = strpos( $minus, '>', $despres_nom );
			if ( false === $fi_tag ) {
				break;
			}
		}
		// El primer tancament del mateix nom després del «>»; si no n'hi ha, cap obertura d'eixe nom no casarà.
		if ( $tanca[ $nom ] <= $fi_tag ) {
			$tanca[ $nom ] = strpos( $minus, '</' . $nom . '>', $fi_tag + 1 );
			if ( false === $tanca[ $nom ] ) {
				continue;
			}
		}
		$net   .= substr( $text, $des_de, $lt - $des_de );
		$des_de = $tanca[ $nom ] + strlen( $nom ) + 3;
		$pos    = $des_de;
	}
	$net .= substr( $text, $des_de );
	return trim( strip_tags( $net ) );
}

/**
 * Executa socdepoble/prepara-importacio-pedra-seca en mode esborrany (dry-run).
 *
 * @param mixed $entrada Arguments de l'ability.
 * @return array|WP_Error
 */
function socdepoble_enxufe_ability_prepara_pedra_seca( $entrada = array() ) {
	$args  = is_array( $entrada ) ? $entrada : array();
	$desti = isset( $args['desti'] ) && 'calendari' === $args['desti'] ? 'calendari' : 'mur';
	/* sanitize_text_field() passa per wp_strip_all_tags() del nucli, que és O(n²) sense PCRE JIT:
	   el títol (el del post no té cap maxLength) es retalla abans, i l'eixida en té prou. */
	$titol = isset( $args['titol'] ) && is_string( $args['titol'] ) ? sanitize_text_field( socdepoble_enxufe_ability_retalla( $args['titol'], 4 * SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL ) ) : '';
	$html  = isset( $args['contingut_html'] ) && is_string( $args['contingut_html'] ) ? socdepoble_enxufe_ability_retalla( $args['contingut_html'], 65536 ) : '';

	if ( isset( $args['post_id'] ) && intval( $args['post_id'] ) > 0 ) {
		$post = socdepoble_enxufe_ability_post_llegible( intval( $args['post_id'] ) );
		if ( null === $post ) {
			return new WP_Error(
				'socdepoble_enxufe_permis_lectura',
				__( 'You do not have permission to read the requested WordPress post.', 'socdepoble' )
			);
		}
		if ( '' === $titol && isset( $post->post_title ) ) {
			$titol = sanitize_text_field( socdepoble_enxufe_ability_retalla( (string) $post->post_title, 4 * SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL ) );
		}
		if ( '' === $html && isset( $post->post_content ) ) {
			$html = socdepoble_enxufe_ability_retalla( (string) $post->post_content, 65536 );
		}
	}

	if ( '' === $titol && '' === trim( $html ) ) {
		return new WP_Error(
			'socdepoble_enxufe_entrada_buida',
			__( 'Provide either a valid post_id or a title and HTML content to prepare the Pedra Seca draft.', 'socdepoble' )
		);
	}

	// Encapçalaments en temps lineal (vegeu socdepoble_enxufe_ability_etiquetes_h).
	$etiquetes = socdepoble_enxufe_ability_etiquetes_h( $html );
	$tots_h    = array( 1, 2, 3, 4, 5, 6 );
	$h2_4      = array( 2, 3, 4 );

	$subtitol = '';
	$h2       = socdepoble_enxufe_ability_casa_h( $html, $etiquetes, array( 2 ), array( 2 ) );
	if ( isset( $h2[0] ) ) {
		$subtitol = socdepoble_enxufe_ability_retalla( socdepoble_enxufe_ability_text_pla( $h2[0][2] ), SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL );
	}

	/* Els encapçalaments ja són el subtítol i les H3: fora dels blocs, perquè
	   l'entradilla no repetisca el subtítol ni l'enganxe al primer paràgraf. */
	$blocs_nets = array();
	$sense_h    = '';
	$des_de     = 0;
	foreach ( socdepoble_enxufe_ability_casa_h( $html, $etiquetes, $tots_h, $tots_h ) as $encap ) {
		$sense_h .= substr( $html, $des_de, $encap[0] - $des_de ) . ' ';
		$des_de   = $encap[1];
	}
	$sense_h  .= substr( $html, $des_de );
	$fragments = preg_split( '/<\/(?:p|li|blockquote|div)>/i', $sense_h );
	if ( is_array( $fragments ) ) {
		foreach ( $fragments as $fragment ) {
			$net = socdepoble_enxufe_ability_text_pla( $fragment );
			if ( '' !== $net ) {
				$blocs_nets[] = $net;
			}
		}
	}
	if ( array() === $blocs_nets ) {
		$pla = socdepoble_enxufe_ability_text_pla( $html );
		if ( '' !== $pla ) {
			$blocs_nets[] = $pla;
		}
	}

	$entradilla = socdepoble_enxufe_ability_retalla( isset( $blocs_nets[0] ) ? $blocs_nets[0] : $titol, SOCDEPOBLE_ENXUFE_ABILITY_MAX_ENTRADILLA );
	if ( '' === $subtitol ) {
		$subtitol = 'calendari' === $desti
			? __( 'Community event announcement for review', 'socdepoble' )
			: __( 'Municipal chronicle prepared for review', 'socdepoble' );
	}

	$seccions_h3 = array();
	foreach ( array_slice( socdepoble_enxufe_ability_casa_h( $html, $etiquetes, $h2_4, $h2_4 ), 0, 8 ) as $encap ) {
		$h3_net = socdepoble_enxufe_ability_retalla( socdepoble_enxufe_ability_text_pla( $encap[2] ), SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL );
		if ( '' !== $h3_net && $h3_net !== $subtitol ) {
			$seccions_h3[] = array(
				'titol_h3' => $h3_net,
			);
		}
	}
	if ( array() === $seccions_h3 && count( $blocs_nets ) > 1 ) {
		$seccions_h3[] = array(
			'titol_h3' => __( 'Details and context', 'socdepoble' ),
			'resum'    => socdepoble_enxufe_ability_retalla( implode( "\n\n", array_slice( $blocs_nets, 1, 4 ) ), SOCDEPOBLE_ENXUFE_ABILITY_MAX_RESUM ),
		);
	}

	return array(
		'desti'                   => $desti,
		'h1'                      => '' !== $titol ? socdepoble_enxufe_ability_retalla( $titol, SOCDEPOBLE_ENXUFE_ABILITY_MAX_TITOL ) : __( 'Untitled community draft', 'socdepoble' ),
		'subtitol_h2'             => $subtitol,
		'entradilla'              => $entradilla,
		'seccions_h3'             => $seccions_h3,
		'requerix_revisio_humana' => true,
		'publicat_automaticament' => false,
	);
}
