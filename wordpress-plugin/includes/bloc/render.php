<?php
/**
 * Render del bloc «Sóc de Poble». WordPress hi posa $attributes, $content i
 * $block. Emet el mateix marcatge universal que el shortcode: el bloc només és
 * una altra manera de triar la instància.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

echo wp_kses(
	socdepoble_enxufe_marcatge(
		array(
			'nomPoble'    => $attributes['nomPoble'] ?? '',
			'poble'       => $attributes['poble'] ?? '',
			'rutaInicial' => $attributes['rutaInicial'] ?? '',
		),
		get_block_wrapper_attributes( array( 'class' => 'socdepoble-enxufe' ) )
	),
	socdepoble_enxufe_html_permes()
);
