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
	$ajustos = '<a href="' . esc_url( admin_url( 'options-general.php?page=socdepoble-enxufe' ) ) . '">' . esc_html__( 'Settings', 'socdepoble' ) . '</a>';
	array_unshift( $enllacos, $ajustos );
	return $enllacos;
}
add_filter( 'plugin_action_links_' . plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ), 'socdepoble_enxufe_enllac_ajustos' );

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
			<p><strong><?php esc_html_e( 'Active village nodes in the network (9 municipalities + historical root):', 'socdepoble' ); ?></strong><br />
			<code>la-torre-de-les-macanes</code> (La Torre de les Maçanes) · <code>penaguila</code> (Penàguila) · <code>benifallim</code> (Benifallim) · <code>sella</code> (Sella) · <code>orxeta</code> (Orxeta) · <code>relleu</code> (Relleu) · <code>alcoleja</code> (Alcoleja) · <code>xixona</code> (Xixona) · <code>tibi</code> (Tibi) · <em>Rentonar (30 anys de llegat rural)</em></p>
			<ol style="margin-bottom:0">
				<li><?php esc_html_e( 'Choose your village identity below (for example: Gent de la Torre and la-torre-de-les-macanes) and save.', 'socdepoble' ); ?></li>
				<li><?php esc_html_e( 'Create or edit any WordPress page and insert the Sóc de Poble block or the [socdepoble_app] shortcode.', 'socdepoble' ); ?></li>
				<li><?php esc_html_e( 'Select the Sóc de Poble · full screen page template so the village plaza fills the entire window.', 'socdepoble' ); ?></li>
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
