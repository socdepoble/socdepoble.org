<?php
/**
 * Dependències de l'script de l'editor del bloc. Sense pas de compilació:
 * editor.js usa directament els globals wp.* que WordPress ja carrega.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

return array(
	'dependencies' => array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n' ),
	'version'      => SOCDEPOBLE_ENXUFE_VERSIO,
);
