<?php
/**
 * El marcatge universal de Sóc de Poble, construït en UN sol lloc.
 *
 * El shortcode, el bloc i la pàgina d'ajustos criden estes funcions, i el que
 * emeten és exactament el que ha d'emetre qualsevol amfitrió (Sollutia, una
 * pàgina estàtica): el global `window.SocDePobleConfig` abans del bundle,
 * l'etiqueta <soc-de-poble> i el bundle. Cap clau de backend. El servei opcional
 * traductor-url té contracte HTTP neutre; la referència copiable no el porta.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Text visible d'una sola línia. Un valor que no és escalar no és un nom.
 *
 * @param mixed $valor Valor cru.
 * @return string Buit si no val.
 */
function socdepoble_enxufe_etiqueta( $valor ) {
	return is_scalar( $valor ) ? sanitize_text_field( (string) $valor ) : '';
}

/**
 * Id en forma de slug (minúscules, xifres i guions), amb el mateix patró que
 * sanejaIdentificador (src/config/configAmfitrio.js). sanitize_title() deixa
 * passar '_', octets %xx i fins a 200 caràcters: un valor que el nucli
 * descartaria no s'emet, i així no tapa el poble vàlid d'una capa de davall.
 *
 * @param mixed $valor Valor cru.
 * @return string Buit si no val.
 */
function socdepoble_enxufe_identificador( $valor ) {
	if ( ! is_scalar( $valor ) ) {
		return '';
	}
	$id = sanitize_title( (string) $valor );
	return 1 === preg_match( '/^[a-z0-9][a-z0-9-]{0,62}$/D', $id ) ? $id : '';
}

/**
 * Ruta interna de l'app per a `ruta-inicial` (camí i consulta, sense
 * fragment). Mai un origen: ni '//host', ni esquemes, ni barres invertides, ni
 * blancs, ni segments que pugen. És el mateix criteri de sanejaRuta
 * (src/config/configAmfitrio.js), que el nucli torna a aplicar.
 *
 * @param mixed $valor Valor cru.
 * @return string Buit si no val.
 */
function socdepoble_enxufe_ruta( $valor ) {
	if ( ! is_string( $valor ) ) {
		return '';
	}
	$valor = trim( $valor );
	if ( '' === $valor || '/' !== $valor[0] || 0 === strpos( $valor, '//' ) || strlen( $valor ) > 200 ) {
		return '';
	}
	/* El mateix conjunt que PROHIBIT_A_RUTA del nucli: barra invertida, blancs
	   (els de JS són \s ASCII, \p{Z} i U+FEFF) i controls C0 i C1. Amb UTF-8
	   invàlid preg_match torna false, i també es rebutja. */
	if ( 0 !== preg_match( '/[\\\\\s\p{Z}\x{0}-\x{1F}\x{7F}-\x{9F}\x{FEFF}]/u', $valor ) ) {
		return '';
	}
	$sense_fragment = explode( '#', $valor, 2 )[0];
	$cami           = explode( '?', $sense_fragment, 2 )[0];
	foreach ( explode( '/', $cami ) as $segment ) {
		if ( preg_match( '/^(?:\.|%2e){1,2}$/i', $segment ) ) {
			return '';
		}
	}
	return $sense_fragment;
}

/**
 * Identitat pública de l'amfitrió: només nomPoble i poble. El nucli descarta
 * qualsevol altra clau (backend, credencials, tenantId, mode de dades), i ací
 * tampoc no se'n publica cap altra, perquè tot el que passa per este canal és
 * visible al codi font de la pàgina.
 *
 * `poble` és l'id de l'element de la secció Pobles (la ruta /pobles/<id>), NO
 * el tenantId de Supabase.
 *
 * Capes, de menys a més prioritat: els valors de sempre del banc de proves,
 * els Ajustos → Sóc de Poble i el filtre `socdepoble_enxufe_config`:
 *
 *   add_filter( 'socdepoble_enxufe_config', function ( $config ) {
 *       $config['nomPoble'] = 'Nom visible del poble';
 *       $config['poble']    = 'id-de-l-element-a-pobles';
 *       return $config;
 *   } );
 *
 * @return array Com a màxim les claus nomPoble i poble; les buides no hi són.
 */
function socdepoble_enxufe_config() {
	$config = array(
		'nomPoble' => 'Gent de la Torre',
		'poble'    => 'la-torre-de-les-macanes',
	);
	$opcio = get_option( SOCDEPOBLE_ENXUFE_OPCIO, array() );
	if ( is_array( $opcio ) ) {
		foreach ( array( 'nomPoble', 'poble' ) as $clau ) {
			if ( isset( $opcio[ $clau ] ) && '' !== $opcio[ $clau ] ) {
				$config[ $clau ] = $opcio[ $clau ];
			}
		}
	}

	$config = apply_filters( 'socdepoble_enxufe_config', $config );
	if ( ! is_array( $config ) ) {
		$config = array();
	}

	$net       = array();
	$nom_poble = socdepoble_enxufe_etiqueta( $config['nomPoble'] ?? '' );
	$poble     = socdepoble_enxufe_identificador( $config['poble'] ?? '' );
	if ( '' !== $nom_poble ) {
		$net['nomPoble'] = $nom_poble;
	}
	if ( '' !== $poble ) {
		$net['poble'] = $poble;
	}
	return $net;
}

/**
 * La declaració `window.SocDePobleConfig = Object.freeze({…});`, o '' si no
 * hi ha res a declarar. JSON_HEX_* escapen < > & ' ": cap valor pot tancar el
 * <script>.
 *
 * @return string
 */
function socdepoble_enxufe_declaracio_amfitrio() {
	$config = socdepoble_enxufe_config();
	if ( empty( $config ) ) {
		return '';
	}
	$json = wp_json_encode(
		$config,
		JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
	);
	return false === $json ? '' : 'window.SocDePobleConfig = Object.freeze(' . $json . ');';
}

/**
 * Registra els actius sense encuar-los: només la pàgina que usa el shortcode o
 * el bloc els demana. La versió de memòria cau ix del manifest del paquet
 * (versió + empremta del bundle), la mateixa que pot usar Sollutia; sense
 * manifest, la data del bundle.
 */
function socdepoble_enxufe_registra_actius() {
	$manifest = socdepoble_enxufe_manifest_local();
	if ( null !== $manifest ) {
		$versio = $manifest['versio'] . '.' . substr( $manifest['entrada']['sha256'], 0, 12 );
	} else {
		$bundle = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . SOCDEPOBLE_ENXUFE_BUNDLE;
		$data   = file_exists( $bundle ) ? filemtime( $bundle ) : false;
		$versio = false !== $data ? (string) $data : SOCDEPOBLE_ENXUFE_VERSIO;
	}

	wp_register_script(
		SOCDEPOBLE_ENXUFE_HANDLE,
		plugins_url( SOCDEPOBLE_ENXUFE_BUNDLE, SOCDEPOBLE_ENXUFE_FITXER ),
		'wordpress' === ( $manifest['runtime']['amfitrio'] ?? null ) ? array( 'react', 'react-dom', 'react-jsx-runtime' ) : array(),
		$versio,
		true
	);

	/* Només reserva l'espai de l'element. Cap color ni cap variable: la pell
	   de l'App viu dins del seu shadow root. 100vh va primer per als
	   navegadors de la base canònica que encara no entenen dvh. Sollutia ha
	   de donar la mateixa caixa amb alçada al seu contenidor. */
	wp_register_style( SOCDEPOBLE_ENXUFE_HANDLE, false, array(), SOCDEPOBLE_ENXUFE_VERSIO );
	wp_add_inline_style(
		SOCDEPOBLE_ENXUFE_HANDLE,
		'.socdepoble-enxufe{display:block;height:100vh;height:100dvh;min-height:32rem}'
	);
}
add_action( 'init', 'socdepoble_enxufe_registra_actius' );

/**
 * Escriu `window.SocDePobleConfig` UNA vegada per pàgina, just abans del
 * bundle. Object.freeze impedix que un altre script en mude les claus; el
 * global sencer encara es pot reassignar, i per això el nucli el tracta com a
 * dada de prioritat mínima i en sanitza cada lectura.
 *
 * Res més: ni ordres a la cua de l'App ni cap crida a configura(). El
 * configura() del nucli es pot cridar una sola vegada i és de l'amfitrió que
 * entrega la sessió; el backend i el tenant són del paquet (Model B, A1).
 */
function socdepoble_enxufe_declara_amfitrio() {
	static $declarat = false;
	if ( $declarat ) {
		return;
	}
	$declarat = true;

	$declaracio = socdepoble_enxufe_declaracio_amfitrio();
	if ( '' !== $declaracio ) {
		wp_add_inline_script( SOCDEPOBLE_ENXUFE_HANDLE, $declaracio, 'before' );
	}
}

/**
 * Posa `integrity` i `crossorigin="anonymous"` a l'etiqueta del bundle NOMÉS
 * si el filtre `socdepoble_enxufe_integritat` torna true (per defecte, no).
 * Els connectors de CDN que reescriuen l'HTML de la pàgina (per memòria
 * intermèdia d'eixida) canvien l'origen DESPRÉS d'este filtre, i un <script>
 * d'un altre origen amb integrity i sense CORS es bloqueja. Qui l'activa
 * respon que el bundle es servix amb Access-Control-Allow-Origin. L'empremta
 * és al manifest per a qualsevol amfitrió, WordPress inclòs.
 *
 * @param string $etiqueta HTML de l'etiqueta (pot portar abans l'script en línia).
 * @param string $handle   Handle de l'script.
 * @param string $src      URL de l'script.
 * @return string
 */
function socdepoble_enxufe_integritat( $etiqueta, $handle, $src ) {
	if ( SOCDEPOBLE_ENXUFE_HANDLE !== $handle || ! apply_filters( 'socdepoble_enxufe_integritat', false, $src ) ) {
		return $etiqueta;
	}
	$manifest = socdepoble_enxufe_manifest_local();
	if ( null === $manifest ) {
		return $etiqueta;
	}
	$atribut = ' integrity="' . esc_attr( $manifest['entrada']['integrity'] ) . '" crossorigin="anonymous"';
	// Només l'etiqueta amb src: la declaració en línia que la precedix no en porta.
	return (string) preg_replace( '/<script(?=[^>]*\ssrc=)/', '<script' . $atribut, $etiqueta, 1 );
}
add_filter( 'script_loader_tag', 'socdepoble_enxufe_integritat', 10, 3 );

/**
 * L'etiqueta <soc-de-poble> amb els atributs del contracte. Una instància pot
 * trepitjar nomPoble, poble i rutaInicial; els buits no s'emeten.
 *
 * @param array $instancia Claus opcionals nomPoble, poble i rutaInicial.
 * @return string HTML escapat.
 */
function socdepoble_enxufe_element( $instancia = array(), $amb_serveis = true ) {
	$atributs = sprintf(
		' fonts-href="%1$s" plugin-url="%2$s"',
		esc_url( plugins_url( SOCDEPOBLE_ENXUFE_FONTS, SOCDEPOBLE_ENXUFE_FITXER ) ),
		esc_url( plugins_url( 'dist/', SOCDEPOBLE_ENXUFE_FITXER ) )
	);

	// Servei públic opcional. rest_url conserva subdirectoris i permalinks simples.
	if ( $amb_serveis && '' !== socdepoble_enxufe_deepl_clau() ) {
		$atributs .= ' traductor-url="' . esc_url( rest_url( 'socdepoble/v1/traduir' ) ) . '"';
	}

	$nom_poble = socdepoble_enxufe_etiqueta( $instancia['nomPoble'] ?? '' );
	if ( '' !== $nom_poble ) {
		$atributs .= ' nom-poble="' . esc_attr( $nom_poble ) . '"';
	}
	$poble = socdepoble_enxufe_identificador( $instancia['poble'] ?? '' );
	if ( '' !== $poble ) {
		$atributs .= ' poble="' . esc_attr( $poble ) . '"';
	}
	$ruta = socdepoble_enxufe_ruta( $instancia['rutaInicial'] ?? '' );
	if ( '' !== $ruta ) {
		$atributs .= ' ruta-inicial="' . esc_attr( $ruta ) . '"';
	}

	return '<soc-de-poble' . $atributs . '></soc-de-poble>';
}

/**
 * Cert si el bundle és al paquet.
 *
 * @return bool
 */
function socdepoble_enxufe_te_bundle() {
	return file_exists( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . SOCDEPOBLE_ENXUFE_BUNDLE );
}

/**
 * El marcatge complet d'una instància: encua els actius, declara l'amfitrió i
 * torna l'element dins d'una caixa amb alçada.
 *
 * Sense bundle l'element no s'actualitza mai i quedaria un forat buit de
 * pantalla sencera: qui edita veu per què; la resta no veu res.
 *
 * @param array  $instancia    Claus opcionals nomPoble, poble i rutaInicial.
 * @param string $embolcall    Atributs ja escapats del <div> que conté l'element.
 * @return string HTML escapat. Mai fa echo.
 */
function socdepoble_enxufe_marcatge( $instancia = array(), $embolcall = 'class="socdepoble-enxufe"' ) {
	if ( ! socdepoble_enxufe_te_bundle() ) {
		if ( current_user_can( 'edit_posts' ) ) {
			return '<p>' . esc_html__( 'Sóc de Poble — Enxufe: dist/soc-de-poble.standalone.js is missing. Build it with npm run build:wp.', 'socdepoble-enxufe' ) . '</p>';
		}
		return '';
	}

	wp_enqueue_style( SOCDEPOBLE_ENXUFE_HANDLE );
	wp_enqueue_script( SOCDEPOBLE_ENXUFE_HANDLE );
	socdepoble_enxufe_declara_amfitrio();

	return '<div ' . $embolcall . '>' . socdepoble_enxufe_element( $instancia ) . '</div>';
}

/**
 * Les etiquetes i els atributs que pot portar el marcatge: la llista per a
 * wp_kses quan el bloc l'imprimix.
 *
 * @return array
 */
function socdepoble_enxufe_html_permes() {
	return array(
		'div'          => array(
			'class' => true,
			'id'    => true,
			'style' => true,
		),
		'p'            => array(),
		'soc-de-poble' => array(
			'fonts-href'   => true,
			'plugin-url'   => true,
			'nom-poble'    => true,
			'poble'        => true,
			'ruta-inicial' => true,
			'traductor-url' => true,
		),
	);
}

/**
 * [socdepoble_app] — pinta l'element. Atributs opcionals per instància, que
 * al nucli trepitgen el global:
 *   nom_poble    → nom-poble
 *   poble        → poble
 *   ruta_inicial → ruta-inicial
 *
 * @param array|string $atts Atributs del shortcode ('' si no n'hi ha).
 * @return string HTML escapat. Mai fa echo.
 */
function socdepoble_enxufe_shortcode( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'nom_poble'    => '',
			'poble'        => '',
			'ruta_inicial' => '',
		),
		$atts,
		'socdepoble_app'
	);
	return socdepoble_enxufe_marcatge(
		array(
			'nomPoble'    => $atts['nom_poble'],
			'poble'       => $atts['poble'],
			'rutaInicial' => $atts['ruta_inicial'],
		)
	);
}

/**
 * Registra el shortcode i el bloc. El bloc només és una altra manera de
 * triar la mateixa instància: el seu render crida socdepoble_enxufe_marcatge().
 */
function socdepoble_enxufe_registra_entrades() {
	add_shortcode( 'socdepoble_app', 'socdepoble_enxufe_shortcode' );
	register_block_type( dirname( SOCDEPOBLE_ENXUFE_FITXER ) . '/includes/bloc' );
	/* Traduccions de l'editor del bloc des de languages/: WordPress busca
	   socdepoble-enxufe-{locale}-socdepoble-app-editor-script.json. */
	wp_set_script_translations( 'socdepoble-app-editor-script', 'socdepoble-enxufe', plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'languages' );
}
add_action( 'init', 'socdepoble_enxufe_registra_entrades' );

/**
 * El marcatge de referència per a qualsevol altre amfitrió, amb la
 * configuració actual: les tres peces que este plugin fa arribar a la pàgina
 * (WordPress hi afig ?ver=). La pàgina d'ajustos el mostra per a copiar-lo
 * (Sollutia, pàgina estàtica). Sense integrity ni crossorigin: qui el copia
 * pot servir el bundle des d'un altre origen sense CORS; l'empremta és a la
 * diagnosi i al manifest.
 *
 * @return string Text pla (s'ha d'escapar en imprimir-lo).
 */
function socdepoble_enxufe_marcatge_de_referencia() {
	$manifest = socdepoble_enxufe_manifest_local();
	if ( 'wordpress' === ( $manifest['runtime']['amfitrio'] ?? null ) ) {
		return '<!-- WordPress runtime: React, ReactDOM, ReactJSXRuntime. For other hosts, use the autonomous distribution for version ' . $manifest['versio'] . ' and its release manifest. -->';
	}
	$linies     = array();
	$declaracio = socdepoble_enxufe_declaracio_amfitrio();
	if ( '' !== $declaracio ) {
		$linies[] = '<script>' . $declaracio . '</script>';
	}
	$linies[] = '<div class="socdepoble-enxufe">' . socdepoble_enxufe_element( array(), false ) . '</div>';
	$linies[] = '<script src="' . esc_url( plugins_url( SOCDEPOBLE_ENXUFE_BUNDLE, SOCDEPOBLE_ENXUFE_FITXER ) ) . '"></script>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- text per a copiar: ajustos.php l'imprimix amb esc_html() dins de <pre>, mai com a HTML.
	return implode( "\n", $linies );
}

/**
 * Ofereix la plantilla «Sóc de Poble · pantalla completa» al selector de
 * plantilles de les pàgines.
 *
 * @param array $plantilles Plantilles de pàgina del tema.
 * @return array
 */
function socdepoble_enxufe_afig_plantilla( $plantilles ) {
	$plantilles[ SOCDEPOBLE_ENXUFE_PLANTILLA ] = __( 'Sóc de Poble · full screen', 'socdepoble-enxufe' );
	return $plantilles;
}
add_filter( 'theme_page_templates', 'socdepoble_enxufe_afig_plantilla' );

/**
 * Contingut de la plantilla de blocs: només el contingut de la pàgina (on viu
 * el bloc o el shortcode) dins d'un <main> d'amplada completa, sense la
 * capçalera ni el peu del tema. És l'equivalent de templates/pantalla-completa.php.
 *
 * @return string Marcatge de blocs.
 */
function socdepoble_enxufe_contingut_plantilla_blocs() {
	return '<!-- wp:group {"tagName":"main","align":"full","layout":{"type":"default"}} -->'
		. '<main class="wp-block-group alignfull"><!-- wp:post-content {"layout":{"type":"default"}} /--></main>'
		. '<!-- /wp:group -->';
}

/**
 * «Sóc de Poble · pantalla completa» per als temes de blocs (WordPress 6.7+).
 * Amb un tema de blocs, el selector de plantilles de l'editor només llista
 * plantilles de blocs (REST /wp/v2/templates): theme_page_templates només
 * arriba al panell clàssic i a l'Edició ràpida. El nom porta el MATEIX slug
 * que l'opció clàssica: la pàgina desa el mateix _wp_page_template i cap
 * llista no la mostra dues vegades. En 6.5 i 6.6 no hi ha registre: es tria a
 * l'Edició ràpida i la pinta la plantilla PHP.
 */
function socdepoble_enxufe_registra_plantilla_blocs() {
	if ( ! function_exists( 'register_block_template' ) ) {
		return;
	}
	register_block_template(
		SOCDEPOBLE_ENXUFE_SLUG . '//' . SOCDEPOBLE_ENXUFE_PLANTILLA,
		array(
			'title'       => __( 'Sóc de Poble · full screen', 'socdepoble-enxufe' ),
			'description' => __( 'Only the page content, without the theme header or footer, so the Sóc de Poble app fills the window.', 'socdepoble-enxufe' ),
			'content'     => socdepoble_enxufe_contingut_plantilla_blocs(),
			'post_types'  => array( 'page' ),
		)
	);
}
add_action( 'init', 'socdepoble_enxufe_registra_plantilla_blocs' );

/**
 * CSS de la pantalla completa, compartit per la plantilla PHP i la de blocs.
 *
 * BARRA D'ADMINISTRACIÓ. WordPress ja empeny <html> 32px (46px a ≤782px) amb
 * !important. No es lluita contra eixe marge: es resta de l'alçada de
 * l'element perquè l'App no quede tallada per baix.
 *
 * CSS mínim, sense colors ni variables: el fons i la pell de l'App viuen dins
 * del seu shadow root, i l'amfitrió no depén de tokens que no controla. S'ha
 * de cridar abans de wp_head() perquè isca a la capçalera.
 */
function socdepoble_enxufe_estils_pantalla() {
	wp_add_inline_style(
		SOCDEPOBLE_ENXUFE_HANDLE,
		'.socdepoble-enxufe-pantalla{margin:0;padding:0}'
		. '.socdepoble-enxufe-pantalla .socdepoble-enxufe{min-height:0;margin:0}'
		. '.admin-bar .socdepoble-enxufe{height:calc(100vh - 32px);height:calc(100dvh - 32px)}'
		. '@media screen and (max-width:782px){.admin-bar .socdepoble-enxufe{height:calc(100vh - 46px);height:calc(100dvh - 46px)}}'
	);
	wp_enqueue_style( SOCDEPOBLE_ENXUFE_HANDLE );
}

/**
 * Classe de body de la pantalla completa quan la pinta template-canvas.php
 * (la plantilla PHP la passa directament a body_class()).
 *
 * @param string[] $classes Classes del body.
 * @return string[]
 */
function socdepoble_enxufe_classe_pantalla( $classes ) {
	$classes[] = 'socdepoble-enxufe-pantalla';
	return $classes;
}

/**
 * Carrega la plantilla pròpia NOMÉS si la pàgina l'ha triada. El shortcode
 * sol no la imposa: el tema de l'amfitrió és seu.
 *
 * Tema de blocs: WordPress ja ha resolt la plantilla de blocs d'este slug (la
 * registrada pel plugin, la del tema o l'editada a l'Editor del lloc), n'ha
 * desat l'id a $_wp_current_template_id i pinta template-canvas.php. Es
 * respecta i només s'hi afig la pell; .wp-site-blocks només existix ací, i el
 * seu padding vertical ve dels estils globals del tema. Si n'ha resolt una
 * altra (WordPress 6.5 i 6.6, sense registre: la page.html del tema), la
 * plantilla PHP de sempre.
 *
 * @param string $plantilla Ruta que WordPress anava a carregar.
 * @return string
 */
function socdepoble_enxufe_tria_plantilla( $plantilla ) {
	global $_wp_current_template_id;
	if ( ! is_page() ) {
		return $plantilla;
	}
	$id = get_queried_object_id();
	if ( ! $id || SOCDEPOBLE_ENXUFE_PLANTILLA !== get_page_template_slug( $id ) ) {
		return $plantilla;
	}
	$sufix = '//' . SOCDEPOBLE_ENXUFE_PLANTILLA;
	if ( 'template-canvas.php' === basename( (string) $plantilla )
		&& is_string( $_wp_current_template_id )
		&& substr( $_wp_current_template_id, -strlen( $sufix ) ) === $sufix ) {
		add_filter( 'body_class', 'socdepoble_enxufe_classe_pantalla' );
		socdepoble_enxufe_estils_pantalla();
		wp_add_inline_style( SOCDEPOBLE_ENXUFE_HANDLE, '.socdepoble-enxufe-pantalla .wp-site-blocks{padding:0}' );
		return $plantilla;
	}
	$propia = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'templates/pantalla-completa.php';
	return file_exists( $propia ) ? $propia : $plantilla;
}
add_filter( 'template_include', 'socdepoble_enxufe_tria_plantilla' );
