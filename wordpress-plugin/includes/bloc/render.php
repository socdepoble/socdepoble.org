<?php
/**
 * Render del bloc «Sóc de Poble» per al camp "render" de block.json. WordPress
 * hi posa $attributes, $content i $block. El render_callback que passa
 * register_block_type (includes/marcatge.php) trepitja este camp en qualsevol
 * versió, i este fitxer crida la mateixa funció: qui llija block.json tot sol
 * obté el mateix marcatge universal que el shortcode.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

echo socdepoble_enxufe_render_bloc( $attributes ?? array() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- socdepoble_enxufe_render_bloc() ja el passa per wp_kses().
