<?php
/**
 * Plugin Name:       Sóc de Poble — Enxufe
 * Plugin URI:        https://socdepoble.org/enxufe/
 * Description:       Embeds the Sóc de Poble rural community app with the universal host markup: a shortcode, a block and an optional full-screen template.
 * Version:           0.2.0-dev
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Sóc de Poble
 * Author URI:        https://socdepoble.org
 * License:           AGPL-3.0-or-later
 * License URI:       https://www.gnu.org/licenses/agpl-3.0.html
 * Text Domain:       socdepoble-enxufe
 * Domain Path:       /languages
 * Update URI:        https://socdepoble.org/enxufe/
 *
 * ADAPTADOR PRIM (WordPress és el banc de proves; el destí és Sollutia)
 * -----------------------------------------------------------------------
 * Este plugin no porta cap lògica de l'App. Tradueix la configuració de
 * WordPress al MATEIX marcatge universal que emet qualsevol amfitrió
 * (Sollutia, una pàgina estàtica, MediaWiki):
 *   1. `window.SocDePobleConfig` amb nomPoble i poble, abans del bundle;
 *   2. l'etiqueta <soc-de-poble plugin-url fonts-href [nom-poble] [poble]
 *      [ruta-inicial]>;
 *   3. el bundle dist/soc-de-poble.standalone.js, que ix de `npm run build:wp`.
 * El marcatge es construïx en un sol lloc (includes/marcatge.php) i la pàgina
 * d'ajustos el mostra tal qual perquè qualsevol altre amfitrió el copie.
 * Qualsevol capacitat que només tinga WordPress és un defecte de contracte:
 * el comportament viu al nucli (src/), mai ací.
 *
 * MODEL B. El backend el segella el build: este plugin no emet mai cap URL de
 * backend, clau, tenant ni mode de dades, ni ho accepta als ajustos. Només
 * LLIG el manifest del paquet (dist/sdp-release.json) per a dir a quin node
 * apunta, trencar la memòria cau i posar l'atribut integrity: el mateix
 * manifest que llegirà Sollutia.
 *
 * Peces (includes/):
 *   manifest.php      identitat del paquet (sdp.release.v1), només lectura;
 *   marcatge.php      el marcatge universal, el shortcode i la plantilla;
 *   bloc/             el bloc «Sóc de Poble» (block.json, render.php);
 *   ajustos.php       Ajustos → Sóc de Poble: identitat de l'amfitrió i diagnosi;
 *   salut.php         proves de Salut del lloc;
 *   actualitzador.php canal propi d'actualitzacions signat. És l'ÚNIC fitxer
 *                     que l'empaquetador lleva de la variant per al directori
 *                     de WordPress.org, junt amb la línia Update URI.
 *
 * NO L'ACTIVEU ALHORA QUE EL PLUGIN VELL «soc-de-poble»: els dos bundles
 * escriuen `window.SocDePoble` i definixen la mateixa etiqueta.
 * -----------------------------------------------------------------------
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

const SOCDEPOBLE_ENXUFE_VERSIO    = '0.2.0-dev';
const SOCDEPOBLE_ENXUFE_FITXER    = __FILE__;
const SOCDEPOBLE_ENXUFE_SLUG      = 'socdepoble-enxufe';
const SOCDEPOBLE_ENXUFE_HANDLE    = 'socdepoble-enxufe';
const SOCDEPOBLE_ENXUFE_BUNDLE    = 'dist/soc-de-poble.standalone.js';
const SOCDEPOBLE_ENXUFE_MANIFEST  = 'dist/sdp-release.json';
const SOCDEPOBLE_ENXUFE_FONTS     = 'dist/fonts/noto-sans.css';
const SOCDEPOBLE_ENXUFE_PLANTILLA = 'socdepoble-enxufe-pantalla-completa';
const SOCDEPOBLE_ENXUFE_OPCIO     = 'socdepoble_enxufe';

require_once __DIR__ . '/includes/manifest.php';
require_once __DIR__ . '/includes/marcatge.php';
require_once __DIR__ . '/includes/ajustos.php';
require_once __DIR__ . '/includes/salut.php';

/* El canal propi d'actualitzacions és opcional: la variant del directori de
   WordPress.org no el porta, i sense ell el plugin funciona igual. */
if ( is_readable( __DIR__ . '/includes/actualitzador.php' ) ) {
	require_once __DIR__ . '/includes/actualitzador.php';
}

/**
 * Traduccions locals (languages/). Al directori de WordPress.org les servix
 * translate.wordpress.org i esta crida no fa res de més.
 */
function socdepoble_enxufe_carrega_traduccions() {
	load_plugin_textdomain( 'socdepoble-enxufe', false, dirname( plugin_basename( SOCDEPOBLE_ENXUFE_FITXER ) ) . '/languages' );
}
add_action( 'init', 'socdepoble_enxufe_carrega_traduccions', 1 );
