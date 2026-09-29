/**
 * Editor del bloc «Sóc de Poble» (socdepoble/app). Sense pas de compilació:
 * usa els globals wp.* que WordPress ja carrega (vegeu editor.asset.php).
 *
 * A l'editor només es mostra un marcador de posició: l'App real la pinta la
 * pàgina publicada amb el marcatge universal (render.php). Els tres camps
 * són els mateixos atributs d'instància que qualsevol amfitrió pot posar a
 * <soc-de-poble>: nom-poble, poble i ruta-inicial. Cap camp de backend.
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var useBlockProps = wp.blockEditor.useBlockProps;
	var PanelBody = wp.components.PanelBody;
	var Placeholder = wp.components.Placeholder;
	var TextControl = wp.components.TextControl;

	function Edita( props ) {
		var atributs = props.attributes;

		function camp( clau, etiqueta, ajuda ) {
			return el( TextControl, {
				label: etiqueta,
				help: ajuda,
				value: atributs[ clau ] || '',
				onChange: function ( valor ) {
					var canvi = {};
					canvi[ clau ] = valor;
					props.setAttributes( canvi );
				},
				__nextHasNoMarginBottom: true,
				__next40pxDefaultSize: true
			} );
		}

		return el(
			wp.element.Fragment,
			null,
			el(
				InspectorControls,
				null,
				el(
					PanelBody,
					{ title: __( 'Village', 'socdepoble-enxufe' ) },
					camp( 'nomPoble', __( 'Village name', 'socdepoble-enxufe' ), __( 'Shown as the host of this page. Leave it empty to use Settings → Sóc de Poble.', 'socdepoble-enxufe' ) ),
					camp( 'poble', __( 'Village id', 'socdepoble-enxufe' ), __( 'Id of the village in the Villages section, for example la-torre-de-les-macanes.', 'socdepoble-enxufe' ) ),
					camp( 'rutaInicial', __( 'Initial route', 'socdepoble-enxufe' ), __( 'Optional app route to open first, for example /mur.', 'socdepoble-enxufe' ) )
				)
			),
			el(
				'div',
				useBlockProps(),
				el( Placeholder, {
					icon: 'groups',
					label: __( 'Sóc de Poble', 'socdepoble-enxufe' ),
					instructions: __( 'The app appears here on the published page.', 'socdepoble-enxufe' )
				} )
			)
		);
	}

	wp.blocks.registerBlockType( 'socdepoble/app', {
		edit: Edita,
		save: function () {
			return null;
		}
	} );
}( window.wp ) );
