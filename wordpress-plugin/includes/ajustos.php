<?php
/**
 * Ajustos → Sóc de Poble.
 *
 * Dos camps i res més: el nom visible i el poble d'aterratge, les dues claus
 * del canal d'amfitrió (`window.SocDePobleConfig`). Cap camp de backend, clau,
 * tenant ni mode de dades: este plugin no n'emet cap i l'App usa els que el
 * build va segellar (Model B). Decisió A1 del Mestre (261003): el camp «Tenant
 * ID» s'ha retirat, i el nucli descarta amb un avís el backend i el tenant que
 * arriben per qualsevol canal d'amfitrió. La pàgina afig la diagnosi del
 * paquet (a quin node apunta, sense dir cap tenant: el plugin és cec a l'abast
 * de dades) i el marcatge universal que qualsevol altre amfitrió ha de copiar
 * per a enxufar exactament la mateixa App.
 *
 * T5.1 (ordre del Mestre, 261029, amb captures de gentdelatorre.net): la
 * benvinguda diu la veritat sobre l'arrel i el primer portal actiu, la guia va
 * en tres passos per a qui no és tècnic, i la fila d'Extensions porta «Mostra
 * els detalls» amb la finestra nativa alimentada des del readme.txt local
 * (plugin_row_meta i plugins_api, més avall), sense cap petició de xarxa.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Saneja l'opció desada: només nomPoble i poble, amb els mateixos criteris
 * que el marcatge. La resta de claus es descarta, també el tenantId que hi
 * haja deixat una versió anterior: la propera desada ja no el conserva.
 *
 * @param mixed $valor Valor enviat.
 * @return array
 */
function socdepoble_enxufe_sanitza_opcio( $valor ) {
	$net = array();
	if ( ! is_array( $valor ) ) {
		return $net;
	}
	$nom_poble = socdepoble_enxufe_etiqueta( $valor['nomPoble'] ?? '' );
	$poble     = socdepoble_enxufe_identificador( $valor['poble'] ?? '' );
	if ( '' !== $nom_poble ) {
		$net['nomPoble'] = $nom_poble;
	}
	if ( '' !== $poble ) {
		$net['poble'] = $poble;
	}
	return $net;
}

/**
 * Model B (decisió A1 del Mestre, 261003): el camp «Tenant ID» s'ha retirat i
 * el plugin no llig mai el tenantId que una versió anterior haja desat. Ací se
 * n'esborra la clau, i res més, en la primera petició que dispare admin_init
 * després d'actualitzar: qualsevol pàgina de wp-admin, de qualsevol usuari, i
 * també admin-ajax.php. Va abans de register_setting (prioritat 5): l'opció
 * es reescriu tal qual, sense passar pel sanejador, i les altres claus no es
 * toquen. Sense eixa clau no fa res.
 */
function socdepoble_enxufe_oblida_tenant_heretat() {
	$opcio = get_option( SOCDEPOBLE_ENXUFE_OPCIO, array() );
	if ( ! is_array( $opcio ) || ! array_key_exists( 'tenantId', $opcio ) ) {
		return;
	}
	unset( $opcio['tenantId'] );
	update_option( SOCDEPOBLE_ENXUFE_OPCIO, $opcio );
}
add_action( 'admin_init', 'socdepoble_enxufe_oblida_tenant_heretat', 5 );

/**
 * Registra l'opció, la secció i els camps (API d'Ajustos: el nonce i la
 * capacitat els gestiona options.php).
 */
function socdepoble_enxufe_registra_ajustos() {
	register_setting(
		'socdepoble_enxufe',
		SOCDEPOBLE_ENXUFE_OPCIO,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'socdepoble_enxufe_sanitza_opcio',
			'default'           => array(),
			'show_in_rest'      => false,
		)
	);

	add_settings_section(
		'socdepoble_enxufe_amfitrio',
		__( 'Host identity', 'socdepoble' ),
		'socdepoble_enxufe_seccio_amfitrio',
		'socdepoble'
	);

	add_settings_field(
		'socdepoble_enxufe_nompoble',
		__( 'Village name', 'socdepoble' ),
		'socdepoble_enxufe_camp',
		'socdepoble',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'nomPoble',
			'label_for'  => 'socdepoble-enxufe-nompoble',
			'descripcio' => __( 'Shown in the app as the server that hosts it, for example Gent de la Torre.', 'socdepoble' ),
		)
	);

	add_settings_field(
		'socdepoble_enxufe_poble',
		__( 'Village id', 'socdepoble' ),
		'socdepoble_enxufe_camp',
		'socdepoble',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'poble',
			'label_for'  => 'socdepoble-enxufe-poble',
			'descripcio' => __( 'Id of the village in the Villages section: visitors land on its page. It is not a data scope.', 'socdepoble' ),
		)
	);
}
add_action( 'admin_init', 'socdepoble_enxufe_registra_ajustos' );

/**
 * Text de la secció.
 */
function socdepoble_enxufe_seccio_amfitrio() {
	echo '<p>' . esc_html__( 'Empty fields keep the test bench values. The socdepoble_enxufe_config filter has the last word.', 'socdepoble' ) . '</p>';
}

/**
 * Un camp de text de l'opció.
 *
 * @param array $args Arguments de add_settings_field (clau, label_for, descripcio).
 */
function socdepoble_enxufe_camp( $args ) {
	$opcio = get_option( SOCDEPOBLE_ENXUFE_OPCIO, array() );
	$valor = is_array( $opcio ) && isset( $opcio[ $args['clau'] ] ) ? (string) $opcio[ $args['clau'] ] : '';
	printf(
		'<input type="text" class="regular-text" id="%1$s" name="%2$s[%3$s]" value="%4$s" />',
		esc_attr( $args['label_for'] ),
		esc_attr( SOCDEPOBLE_ENXUFE_OPCIO ),
		esc_attr( $args['clau'] ),
		esc_attr( $valor )
	);
	printf( '<p class="description">%s</p>', esc_html( $args['descripcio'] ) );
}

/**
 * Afig la pàgina a Ajustos.
 */
function socdepoble_enxufe_afig_pagina() {
	add_options_page(
		__( 'Sóc de Poble', 'socdepoble' ),
		__( 'Sóc de Poble', 'socdepoble' ),
		'manage_options',
		'socdepoble',
		'socdepoble_enxufe_pagina'
	);
}
add_action( 'admin_menu', 'socdepoble_enxufe_afig_pagina' );

/**
 * Enllaç «Ajustos» a la fila del plugin.
 *
 * @param array $enllacos Enllaços d'acció de la fila.
 * @return array
 */
function socdepoble_enxufe_enllac_ajustos( $enllacos ) {
	$ajustos = '<a href="' . esc_url( admin_url( 'options-general.php?page=' . SOCDEPOBLE_ENXUFE_SLUG ) ) . '">' . esc_html__( 'Settings', 'socdepoble' ) . '</a>';
	array_unshift( $enllacos, $ajustos );
	return $enllacos;
}
add_filter( 'plugin_action_links_' . plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ), 'socdepoble_enxufe_enllac_ajustos' );

/**
 * «Mostra els detalls» a la fila del plugin (T5.1, ordre del Mestre, 261029).
 * WordPress només pinta eixe enllaç quan el transient update_plugins porta un
 * slug per al plugin: el del canal propi (actualitzador.php) o, quan el
 * directori el conega, el de WordPress.org. Mentre no n'hi ha cap, la fila
 * només duia «Visita el lloc web de l'extensió», i la finestra nativa amb el
 * bàner, l'autor, la versió i les pestanyes de descripció, instal·lació,
 * preguntes i registre de canvis quedava fora de l'abast. Ací s'afig el mateix
 * enllaç del nucli (ThickBox cap a plugin-install.php) per a l'slug del
 * directori, que socdepoble_enxufe_detalls_plugins_api() respon des del
 * readme.txt local; si el nucli ja l'ha posat (hi ha slug), no se'n duplica
 * cap. La capacitat és la que exigix plugin-install.php.
 *
 * @param string[] $meta        Enllaços de la fila.
 * @param string   $plugin_file Ruta relativa del plugin de la fila.
 * @param array    $plugin_data Capçaleres del plugin (i slug, si WordPress el coneix).
 * @return string[]
 */
function socdepoble_enxufe_fila_detalls( $meta, $plugin_file, $plugin_data ) {
	if ( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) !== $plugin_file || ! is_array( $meta ) ) {
		return $meta;
	}
	if ( ( is_array( $plugin_data ) && isset( $plugin_data['slug'] ) ) || ! current_user_can( 'install_plugins' ) ) {
		return $meta;
	}
	// Sense la carpeta canònica (socdepoble/), la finestra no trobaria la instal·lació i oferiria «Instal·la ara» sense paquet: cap enllaç, com fa el nucli.
	if ( SOCDEPOBLE_ENXUFE_SLUG !== dirname( $plugin_file ) ) {
		return $meta;
	}
	$nom = is_array( $plugin_data ) && ! empty( $plugin_data['Name'] ) ? (string) $plugin_data['Name'] : __( 'Sóc de Poble', 'socdepoble' );
	$url = add_query_arg(
		array(
			'tab'       => 'plugin-information',
			'plugin'    => SOCDEPOBLE_ENXUFE_SLUG,
			'TB_iframe' => 'true',
			'width'     => 600,
			'height'    => 550,
		),
		network_admin_url( 'plugin-install.php' )
	);
	$meta[] = sprintf(
		'<a href="%1$s" class="thickbox open-plugin-details-modal" aria-label="%2$s" data-title="%3$s">%4$s</a>',
		esc_url( $url ),
		/* translators: %s: plugin name. */
		esc_attr( sprintf( __( 'More information about %s', 'socdepoble' ), $nom ) ),
		esc_attr( $nom ),
		esc_html__( 'View details', 'socdepoble' )
	);
	return $meta;
}
add_filter( 'plugin_row_meta', 'socdepoble_enxufe_fila_detalls', 10, 3 );

/**
 * El readme.txt instal·lat, llegit del disc i sense xarxa: el nom («=== Nom
 * ===»), les capçaleres d'abans de la primera secció (Contributors, Tested up
 * to…) i les seccions en text. És la font de «Mostra els detalls» per a l'slug
 * del directori mentre WordPress.org no respon per ell. Format mínim de
 * WordPress.org: «== Secció ==», «= Subtítol =», llistes «* » i «1. », `codi` i
 * enllaços https. Com fa WordPress.org, les seccions desconegudes van a la
 * descripció; Upgrade Notice i Screenshots, no.
 *
 * @return array|null nom, capcaleres (clau en minúscules => valor) i seccions
 *                    (description, installation, faq, changelog => línies), o
 *                    null si no hi ha cap readme llegible.
 */
function socdepoble_enxufe_llig_readme() {
	$fitxer = plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'readme.txt';
	$text   = is_readable( $fitxer ) ? file_get_contents( $fitxer ) : false; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- fitxer local del mateix plugin.
	if ( ! is_string( $text ) || '' === $text ) {
		return null;
	}
	$alies  = array(
		'description'                => 'description',
		'installation'               => 'installation',
		'frequently asked questions' => 'faq',
		'faq'                        => 'faq',
		'changelog'                  => 'changelog',
	);
	$readme = array(
		'nom'        => '',
		'capcaleres' => array(),
		'seccions'   => array(),
	);
	$clau   = '';
	$dins   = false;
	foreach ( preg_split( '/\r\n|\r|\n/', $text ) as $linia ) {
		if ( ! $dins && preg_match( '/^===\s*(.+?)\s*===\s*$/', $linia, $m ) ) {
			$readme['nom'] = $m[1];
			continue;
		}
		// «=== Nom ===» no casa ací: després de «==» ve un altre «=».
		if ( preg_match( '/^==\s*([^=].*?)\s*==\s*$/', $linia, $m ) ) {
			$dins  = true;
			$titol = strtolower( $m[1] );
			if ( isset( $alies[ $titol ] ) ) {
				$clau = $alies[ $titol ];
			} elseif ( in_array( $titol, array( 'upgrade notice', 'screenshots' ), true ) ) {
				$clau = '';
			} else {
				$clau                          = 'description';
				$readme['seccions'][ $clau ][] = '';
				$readme['seccions'][ $clau ][] = '= ' . $m[1] . ' =';
				$readme['seccions'][ $clau ][] = '';
			}
			continue;
		}
		if ( ! $dins ) {
			if ( preg_match( '/^([A-Za-z][A-Za-z ]*?):\s*(.*?)\s*$/', $linia, $m ) ) {
				$readme['capcaleres'][ strtolower( $m[1] ) ] = $m[2];
			}
			continue;
		}
		if ( '' !== $clau ) {
			$readme['seccions'][ $clau ][] = $linia;
		}
	}
	return $readme;
}

/**
 * HTML d'una secció del readme. Les línies seguides del mateix tipus fan un
 * paràgraf o una llista; una línia buida els tanca. Cada text passa per
 * socdepoble_enxufe_linia_detalls(), que l'escapa abans de transformar-lo: cap
 * etiqueta del readme no arriba crua.
 *
 * @param string[] $linies Línies de la secció.
 * @return string
 */
function socdepoble_enxufe_html_detalls( $linies ) {
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
			$html .= '<p>' . socdepoble_enxufe_linia_detalls( implode( ' ', $textos ) ) . '</p>';
		} elseif ( 'h4' === $tipus ) {
			$html .= '<h4>' . socdepoble_enxufe_linia_detalls( $textos[0] ) . '</h4>';
		} elseif ( '' !== $tipus ) {
			$html .= '<' . $tipus . '>';
			foreach ( $textos as $text ) {
				$html .= '<li>' . socdepoble_enxufe_linia_detalls( $text ) . '</li>';
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
function socdepoble_enxufe_linia_detalls( $text ) {
	$html = (string) preg_replace( '/`([^`]+)`/', '<code>$1</code>', esc_html( $text ) );
	return (string) preg_replace( '#https://(?:[^\s<>&]|&amp;)*[^\s<>&.,;:)]#', '<a href="$0">$0</a>', $html );
}

/**
 * Els bàners de la finestra de detalls, només si viatgen amb el paquet: el
 * directori de WordPress.org els guarda a banda i el zip no els porta.
 *
 * @return string[] low i high, o buit.
 */
function socdepoble_enxufe_baners_detalls() {
	$baners = array();
	foreach ( array( 'low' => 'banner-772x250.png', 'high' => 'banner-1544x500.png' ) as $mida => $fitxer ) {
		if ( is_readable( plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'assets/' . $fitxer ) ) {
			$baners[ $mida ] = plugins_url( 'assets/' . $fitxer, SOCDEPOBLE_ENXUFE_FITXER );
		}
	}
	return $baners;
}

/**
 * «Mostra els detalls» per a l'slug del directori, alimentat des del readme.txt
 * local (T5.1, ordre del Mestre, 261029). Mentre WordPress.org no respon per
 * «socdepoble», sense este filtre la finestra nativa deia que el plugin no
 * existix. Només intercepta plugin_information per al nostre slug, només si
 * cap altre filtre ha respost abans, i no fa cap petició de xarxa: tot ix del
 * readme, de la capçalera del plugin i dels bàners del paquet, si hi són.
 * Qualsevol altra consulta torna intacta. L'slug del canal propi el continua
 * servint actualitzador.php, l'únic que anuncia un download_link.
 *
 * Relleu de la reserva del Gauntlet 261025_0545 (MISSED P3): per ordre
 * expressa del Mestre, plugin_information de l'slug del directori ja no viatja
 * cap a WordPress.org; com que ací no s'anuncia cap download_link, cap camí
 * d'instal·lació no rep un enllaç buit ni simbòlic. Sense last_updated: ni el
 * readme ni el manifest validat porten cap data, i la del fitxer seria la de
 * la instal·lació.
 *
 * @param false|object|array $resultat Resultat d'un altre filtre.
 * @param string             $accio    Acció demanada.
 * @param object             $args     Arguments (slug).
 * @return false|object|array
 */
function socdepoble_enxufe_detalls_plugins_api( $resultat, $accio, $args ) {
	if ( false !== $resultat || 'plugin_information' !== $accio || ! is_object( $args ) || empty( $args->slug ) || SOCDEPOBLE_ENXUFE_SLUG !== $args->slug ) {
		return $resultat;
	}
	$readme = socdepoble_enxufe_llig_readme();
	if ( null === $readme ) {
		return $resultat;
	}
	$capcalera = get_file_data(
		SOCDEPOBLE_ENXUFE_FITXER,
		array(
			'nom'          => 'Plugin Name',
			'uri'          => 'Plugin URI',
			'autor'        => 'Author',
			'autor_uri'    => 'Author URI',
			'requires'     => 'Requires at least',
			'requires_php' => 'Requires PHP',
		)
	);
	$seccions  = array();
	foreach ( array( 'description', 'installation', 'faq', 'changelog' ) as $seccio ) {
		if ( ! empty( $readme['seccions'][ $seccio ] ) ) {
			$seccions[ $seccio ] = socdepoble_enxufe_html_detalls( $readme['seccions'][ $seccio ] );
		}
	}
	$seccions = array_filter( $seccions );
	if ( array() === $seccions ) {
		return $resultat;
	}

	$info               = new stdClass();
	$info->name         = '' !== $readme['nom'] ? $readme['nom'] : $capcalera['nom'];
	$info->slug         = SOCDEPOBLE_ENXUFE_SLUG;
	$info->version      = SOCDEPOBLE_ENXUFE_VERSIO;
	$info->author       = '' !== $capcalera['autor_uri']
		? '<a href="' . esc_url( $capcalera['autor_uri'] ) . '">' . esc_html( $capcalera['autor'] ) . '</a>'
		: esc_html( $capcalera['autor'] );
	$info->homepage     = esc_url_raw( $capcalera['uri'] );
	$info->requires     = $capcalera['requires'];
	$info->requires_php = $capcalera['requires_php'];
	// Com l'API de WordPress.org («7.1» → «7.1.4»): sense alinear-ho, version_compare( '7.1.4', '7.1', '<=' ) és fals i la finestra avisa «no provat».
	$provat = (string) ( $readme['capcaleres']['tested up to'] ?? '' );
	$wp     = get_bloginfo( 'version' );
	if ( '' !== $provat && ( $wp === $provat || 0 === strpos( $wp, $provat . '.' ) ) ) {
		$provat = $wp;
	}
	$info->tested       = $provat;
	$info->external     = true;
	$info->sections     = array_map( 'wp_kses_post', $seccions );
	// El primer col·laborador del readme és el perfil de WordPress.org de l'autor.
	$contribuidors = explode( ',', $readme['capcaleres']['contributors'] ?? '' );
	$perfil        = sanitize_title( trim( $contribuidors[0] ) );
	if ( '' !== $perfil ) {
		$info->author_profile = 'https://profiles.wordpress.org/' . $perfil . '/';
	}
	$baners = socdepoble_enxufe_baners_detalls();
	if ( array() !== $baners ) {
		$info->banners = $baners;
	}
	return $info;
}
add_filter( 'plugins_api', 'socdepoble_enxufe_detalls_plugins_api', 10, 3 );

/**
 * Files de la diagnosi del paquet: etiqueta => valor (text pla). Cap fila de
 * tenant: l'abast de dades és del paquet i el plugin no el coneix (Model B).
 *
 * Relleu 261007 (decisió 5 del Mestre) · «Bundle SHA-256» i «Bundle
 * integrity» són les empremtes de dist/soc-de-poble.standalone.js. En el
 * paquet trossejat (formatDelPaquet al manifest) eixe fitxer és el carregador
 * de 3 KB, no l'App: els trossos de dist/trossos/ els cobrix l'inventari
 * (dist/sdp-inventari.json), que la Salut del lloc contrasta. Les etiquetes no
 * canvien fins que el Mestre en fixe un text propi, amb traducció.
 *
 * @return array
 */
function socdepoble_enxufe_diagnosi() {
	$manifest = socdepoble_enxufe_manifest_local();
	$files    = array();
	if ( null === $manifest ) {
		$files[ __( 'Package manifest', 'socdepoble' ) ] = socdepoble_enxufe_te_bundle()
			? __( 'Missing (dist/sdp-release.json). Rebuild the package with npm run build:wp.', 'socdepoble' )
			: __( 'Missing, and the bundle is missing too.', 'socdepoble' );
		return $files;
	}
	$node = $manifest['node'];
	$files[ __( 'App version', 'socdepoble' ) ]      = $manifest['versio'];
	$files[ __( 'Bundle SHA-256', 'socdepoble' ) ]   = $manifest['entrada']['sha256'];
	$files[ __( 'Bundle integrity', 'socdepoble' ) ] = $manifest['entrada']['integrity'];
	$files[ __( 'Sealed data node', 'socdepoble' ) ] = '' !== $node['origen'] ? $node['origen'] : __( 'none', 'socdepoble' );
	$files[ __( 'Data mode', 'socdepoble' ) ]        = $node['mode'];
	$files[ __( 'Package kind', 'socdepoble' ) ]     = $node['desenvolupament'] || 'remote' !== $node['mode']
		? __( 'Development: it only works next to its local backend.', 'socdepoble' )
		: __( 'Release: it can serve real visitors, here or in any other host.', 'socdepoble' );
	$files[ __( 'Site environment', 'socdepoble' ) ] = wp_get_environment_type();
	return $files;
}

/**
 * La pàgina d'ajustos.
 *
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 5): el pas 2 de la
 * benvinguda nomena el shortcode que registra includes/marcatge.php,
 * [socdepoble_app]; [socdepoble] no existix i WordPress el deixava com a
 * text literal a la pàgina, sense l'App.
 */
function socdepoble_enxufe_pagina() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

		<?php if ( socdepoble_enxufe_node_inadequat() ) : ?>
			<div class="notice notice-error inline"><p><?php esc_html_e( 'This package points to a development backend. Visitors of this site will see the app without data. Rebuild it as a release with production values.', 'socdepoble' ); ?></p></div>
		<?php endif; ?>

		<div class="card" style="max-width:56rem;margin-top:1rem;padding:1.25rem 1.5rem;border-left:4px solid #f97316">
			<h2 style="margin-top:0"><?php esc_html_e( 'Welcome to the Sóc de Poble Portal of Connected Villages', 'socdepoble' ); ?></h2>
			<p><?php esc_html_e( 'Sóc de Poble is the decentralized civic network born in the rural mountains of Alicante to connect neighbours, local associations, traditional events, village markets and collective memory without technological dependence.', 'socdepoble' ); ?></p>
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: %1$s: village id of La Torre de les Maçanes, in code markup. */
						esc_html__( 'The root of the network is Sóc de Poble itself (El Rentonar, 30 years of rural activism). The first village portal live in production is La Torre de les Maçanes (%1$s · Gent de la Torre). The other villages of the catalogue are ready to switch on their own node as soon as their community asks for it.', 'socdepoble' ),
						'<code>la-torre-de-les-macanes</code>'
					)
				);
				?>
			</p>
			<h3><?php esc_html_e( 'How to put Sóc de Poble on your website, in three steps', 'socdepoble' ); ?></h3>
			<ol style="margin-bottom:0">
				<li>
					<strong><?php esc_html_e( 'Step 1 · Set up your village here below.', 'socdepoble' ); ?></strong>
					<?php
					echo wp_kses_post(
						sprintf(
							/* translators: %1$s: example portal name, %2$s: example village id, %3$s: the Save Changes button label, all in markup. */
							esc_html__( 'Write the public name of your portal (for example %1$s) and the id of your village (%2$s), then press the blue button %3$s.', 'socdepoble' ),
							'<code>Gent de la Torre</code>',
							'<code>la-torre-de-les-macanes</code>',
							'<strong>«' . esc_html__( 'Save Changes', 'socdepoble' ) . '»</strong>'
						)
					);
					?>
				</li>
				<li>
					<strong><?php esc_html_e( 'Step 2 · Put Sóc de Poble on a page of your website (choose one of the two options).', 'socdepoble' ); ?></strong>
					<ul>
						<li>
							<?php
							echo wp_kses_post(
								sprintf(
									/* translators: %1$s: the Pages ➔ Add New Page menu path, %2$s: the shortcode, %3$s: the Publish button label, all in markup. */
									esc_html__( 'Easy option A (copying the code): in the left menu go to %1$s, give the page a title, type or paste exactly %2$s in the body of the page and press %3$s.', 'socdepoble' ),
									'<strong>' . esc_html__( 'Pages ➔ Add New Page', 'socdepoble' ) . '</strong>',
									'<code>[socdepoble_app]</code>',
									'<strong>«' . esc_html__( 'Publish', 'socdepoble' ) . '»</strong>'
								)
							);
							?>
						</li>
						<li>
							<?php
							echo wp_kses_post(
								sprintf(
									/* translators: %1$s: the + button, %2$s: the Add block label, %3$s: the block name, all in markup. */
									esc_html__( 'Easy option B (with the visual block): inside the page editor press the %1$s button (%2$s), search for %3$s and click it.', 'socdepoble' ),
									'<code>+</code>',
									esc_html__( 'Add block', 'socdepoble' ),
									'<strong>«Sóc de Poble»</strong>'
								)
							);
							?>
						</li>
					</ul>
				</li>
				<li>
					<strong><?php esc_html_e( 'Step 3 · Make it fill the whole screen and be the home page.', 'socdepoble' ); ?></strong>
					<?php
					echo wp_kses_post(
						sprintf(
							/* translators: %1$s: the Template panel name, %2$s: the full screen template name, %3$s: the Settings ➔ Reading menu path, %4$s: the A static page option, %5$s: the Homepage field, all in markup. */
							esc_html__( 'In the right column of the page editor look for the %1$s panel and choose %2$s. If you want that page to be the main home page of your website, go to %3$s, tick %4$s and select it as %5$s.', 'socdepoble' ),
							'<strong>«' . esc_html__( 'Template', 'socdepoble' ) . '»</strong>',
							'<strong>«' . esc_html__( 'Sóc de Poble · full screen', 'socdepoble' ) . '»</strong>',
							'<strong>' . esc_html__( 'Settings ➔ Reading', 'socdepoble' ) . '</strong>',
							'<em>«' . esc_html__( 'A static page', 'socdepoble' ) . '»</em>',
							'<strong>' . esc_html__( 'Homepage', 'socdepoble' ) . '</strong>'
						)
					);
					?>
				</li>
			</ol>
		</div>

		<form action="options.php" method="post">
			<?php
			settings_fields( 'socdepoble_enxufe' );
			do_settings_sections( 'socdepoble' );
			submit_button();
			?>
		</form>

		<details style="max-width:56rem;margin-top:1.5rem;padding:0.75rem 1rem;background:#fff;border:1px solid #c3c4c7">
			<summary style="cursor:pointer;font-weight:600"><?php esc_html_e( 'Technical diagnosis and universal host markup (for developers)', 'socdepoble' ); ?></summary>

			<h2><?php esc_html_e( 'Package and data node', 'socdepoble' ); ?></h2>
			<table class="widefat striped" role="presentation">
				<tbody>
				<?php foreach ( socdepoble_enxufe_diagnosi() as $etiqueta => $valor ) : ?>
					<tr>
						<th scope="row"><?php echo esc_html( $etiqueta ); ?></th>
						<td><code><?php echo esc_html( $valor ); ?></code></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>

			<?php
			if ( function_exists( 'socdepoble_enxufe_seccio_canal' ) ) {
				socdepoble_enxufe_seccio_canal();
			}
			?>

			<h2><?php esc_html_e( 'Universal markup', 'socdepoble' ); ?></h2>
			<p><?php esc_html_e( 'The three pieces this plugin sends to the page (WordPress adds ?ver= to the script). Any other host (Sollutia, a static page) emits the same three pieces pointing to its own copy of dist/. The box that contains the element needs a height.', 'socdepoble' ); ?></p>
			<pre style="white-space:pre-wrap;word-break:break-all"><code><?php echo esc_html( socdepoble_enxufe_marcatge_de_referencia() ); ?></code></pre>
		</details>
	</div>
	<?php
}
