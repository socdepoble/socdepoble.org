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
		__( 'Host identity', 'socdepoble-enxufe' ),
		'socdepoble_enxufe_seccio_amfitrio',
		'socdepoble-enxufe'
	);

	add_settings_field(
		'socdepoble_enxufe_nompoble',
		__( 'Village name', 'socdepoble-enxufe' ),
		'socdepoble_enxufe_camp',
		'socdepoble-enxufe',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'nomPoble',
			'label_for'  => 'socdepoble-enxufe-nompoble',
			'descripcio' => __( 'Shown in the app as the server that hosts it, for example Gent de la Torre.', 'socdepoble-enxufe' ),
		)
	);

	add_settings_field(
		'socdepoble_enxufe_poble',
		__( 'Village id', 'socdepoble-enxufe' ),
		'socdepoble_enxufe_camp',
		'socdepoble-enxufe',
		'socdepoble_enxufe_amfitrio',
		array(
			'clau'       => 'poble',
			'label_for'  => 'socdepoble-enxufe-poble',
			'descripcio' => __( 'Id of the village in the Villages section: visitors land on its page. It is not a data scope.', 'socdepoble-enxufe' ),
		)
	);
}
add_action( 'admin_init', 'socdepoble_enxufe_registra_ajustos' );

/**
 * Text de la secció.
 */
function socdepoble_enxufe_seccio_amfitrio() {
	echo '<p>' . esc_html__( 'Empty fields keep the test bench values. The socdepoble_enxufe_config filter has the last word.', 'socdepoble-enxufe' ) . '</p>';
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
		__( 'Sóc de Poble', 'socdepoble-enxufe' ),
		__( 'Sóc de Poble', 'socdepoble-enxufe' ),
		'manage_options',
		'socdepoble-enxufe',
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
	$ajustos = '<a href="' . esc_url( admin_url( 'options-general.php?page=socdepoble-enxufe' ) ) . '">' . esc_html__( 'Settings', 'socdepoble-enxufe' ) . '</a>';
	array_unshift( $enllacos, $ajustos );
	return $enllacos;
}
add_filter( 'plugin_action_links_' . plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ), 'socdepoble_enxufe_enllac_ajustos' );

/**
 * Files de la diagnosi del paquet: etiqueta => valor (text pla). Cap fila de
 * tenant: l'abast de dades és del paquet i el plugin no el coneix (Model B).
 *
 * @return array
 */
function socdepoble_enxufe_diagnosi() {
	$manifest = socdepoble_enxufe_manifest_local();
	$files    = array();
	if ( null === $manifest ) {
		$files[ __( 'Package manifest', 'socdepoble-enxufe' ) ] = socdepoble_enxufe_te_bundle()
			? __( 'Missing (dist/sdp-release.json). Rebuild the package with npm run build:wp.', 'socdepoble-enxufe' )
			: __( 'Missing, and the bundle is missing too.', 'socdepoble-enxufe' );
		return $files;
	}
	$node = $manifest['node'];
	$files[ __( 'App version', 'socdepoble-enxufe' ) ]      = $manifest['versio'];
	$files[ __( 'Bundle SHA-256', 'socdepoble-enxufe' ) ]   = $manifest['entrada']['sha256'];
	$files[ __( 'Bundle integrity', 'socdepoble-enxufe' ) ] = $manifest['entrada']['integrity'];
	$files[ __( 'Sealed data node', 'socdepoble-enxufe' ) ] = '' !== $node['origen'] ? $node['origen'] : __( 'none', 'socdepoble-enxufe' );
	$files[ __( 'Data mode', 'socdepoble-enxufe' ) ]        = $node['mode'];
	$files[ __( 'Package kind', 'socdepoble-enxufe' ) ]     = $node['desenvolupament'] || 'remote' !== $node['mode']
		? __( 'Development: it only works next to its local backend.', 'socdepoble-enxufe' )
		: __( 'Release: it can serve real visitors, here or in any other host.', 'socdepoble-enxufe' );
	$files[ __( 'Site environment', 'socdepoble-enxufe' ) ] = wp_get_environment_type();
	return $files;
}

/**
 * La pàgina d'ajustos.
 */
function socdepoble_enxufe_pagina() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

		<?php if ( socdepoble_enxufe_node_inadequat() ) : ?>
			<div class="notice notice-error inline"><p><?php esc_html_e( 'This package points to a development backend. Visitors of this site will see the app without data. Rebuild it as a release with production values.', 'socdepoble-enxufe' ); ?></p></div>
		<?php endif; ?>

		<form action="options.php" method="post">
			<?php
			settings_fields( 'socdepoble_enxufe' );
			do_settings_sections( 'socdepoble-enxufe' );
			submit_button();
			?>
		</form>

		<h2><?php esc_html_e( 'Package and data node', 'socdepoble-enxufe' ); ?></h2>
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

		<h2><?php esc_html_e( 'Universal markup', 'socdepoble-enxufe' ); ?></h2>
		<p><?php esc_html_e( 'The three pieces this plugin sends to the page (WordPress adds ?ver= to the script). Any other host (Sollutia, a static page) emits the same three pieces pointing to its own copy of dist/. The box that contains the element needs a height.', 'socdepoble-enxufe' ); ?></p>
		<pre style="white-space:pre-wrap;word-break:break-all"><code><?php echo esc_html( socdepoble_enxufe_marcatge_de_referencia() ); ?></code></pre>
	</div>
	<?php
}
