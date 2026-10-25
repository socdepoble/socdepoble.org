<?php
/**
 * Plugin Name:       Sóc de Poble. Portal de Pobles Connectats
 * Plugin URI:        https://socdepoble.org/enxufe/
 * Description:       Connect to the Sóc de Poble Portal, a Fediverse of Connected Villages! The civic network connecting neighbours, associations, events and local shops. Open Settings ➔ Sóc de Poble to choose your village and activate this node.
 * Version:           1.1.9
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Sóc de Poble
 * Author URI:        https://socdepoble.org
 * License:           AGPL-3.0-or-later
 * License URI:       https://www.gnu.org/licenses/agpl-3.0.html
 * Text Domain:       socdepoble
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
 * El comportament de la UI viu al nucli (src/). La traducció és un servei
 * opcional del host amb contracte HTTP neutre que Sollutia pot implementar:
 * el secret del proveïdor es conserva exclusivament en el servidor.
 *
 * MODEL B. El backend el segella el build: este plugin no emet mai cap URL de
 * backend, clau, tenant ni mode de dades, ni ho accepta als ajustos, ni gasta
 * el configura() de l'App (decisió A1 del Mestre, 261003). Només LLIG el
 * manifest del paquet (dist/sdp-release.json) per a dir a quin node apunta,
 * trencar la memòria cau i posar l'atribut integrity: el mateix manifest que
 * llegirà Sollutia.
 *
 * Peces (includes/):
 *   idioma.php        traduccions locals (languages/);
 *   copies.php        les altres còpies actives (activació de xarxa i
 *                     uninstall.php);
 *   manifest.php      identitat del paquet (sdp.release.v1), només lectura;
 *   marcatge.php      el marcatge universal, el shortcode i la plantilla;
 *   seo.php           l'OpenGraph de la ruta per a les xarxes, des de la taula
 *                     dist/seo-routes.json (Onada 11, 261010; esborrany inert:
 *                     només amb el filtre socdepoble_enxufe_seo i ?sdp=);
 *   bloc/             el bloc «Sóc de Poble» (block.json, render.php);
 *   ajustos.php       Ajustos → Sóc de Poble: identitat de l'amfitrió i diagnosi;
 *   salut.php         proves de Salut del lloc;
 *   traduccio.php     servei opcional DeepL (clau només al servidor);
 *   actualitzador.php canal propi d'actualitzacions signat. És l'ÚNIC fitxer
 *                     que l'empaquetador lleva de la variant per al directori
 *                     de WordPress.org, junt amb la línia Update URI.
 *
 * NO L'ACTIVEU ALHORA QUE EL PLUGIN VELL «soc-de-poble»: els dos bundles
 * escriuen `window.SocDePoble` i definixen la mateixa etiqueta.
 *
 * ESTE FITXER NO DECLARA CAP FUNCIÓ NI CAP CLASSE. PHP les vincula en
 * compilar-lo, abans d'executar la primera línia, i una segona còpia del plugin
 * en una altra carpeta (un zip sense socdepoble/ a l'arrel s'instal·la
 * al costat de la vella) peta amb «Cannot redeclare» abans d'arribar a la
 * guarda de davall. Les funcions viuen a includes/; ací només clausures.
 * -----------------------------------------------------------------------
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

/* DOBLE CÒPIA. Si una altra còpia ja s'ha carregat, esta no carrega res: ni
   constants ni includes, que es tornarien a declarar per una altra ruta.
   · Dins del sandbox d'activació, el ganxo d'activació REFUSA l'activació
     amb wp_die abans que WordPress l'afija a active_plugins. Si quedaren
     actives les dues, l'ordre alfabètic de càrrega posa
     «socdepoble-enxufe-v…/» abans de «socdepoble-enxufe/»: la còpia vella,
     sense esta guarda, faria fatal a cada petició.
   · Sempre, un avís a l'administració amb les dues carpetes (all_admin_notices
     cobrix també l'administració de xarxa).
   La constant ve de la còpia ja carregada i __DIR__ és la d'esta. */
if ( defined( 'SOCDEPOBLE_ENXUFE_FITXER' ) ) {
	if ( defined( 'WP_SANDBOX_SCRAPING' ) && WP_SANDBOX_SCRAPING ) {
		register_activation_hook(
			__FILE__,
			static function () {
				wp_die(
					esc_html(
						sprintf(
							/* translators: 1: folder of the copy already active, 2: folder of this copy. */
							__( 'Sóc de Poble — Enxufe is already active from the folder %1$s. Deactivate that copy in Plugins before activating this one, in %2$s.', 'socdepoble' ),
							dirname( SOCDEPOBLE_ENXUFE_FITXER ),
							__DIR__
						)
					),
					esc_html__( 'Sóc de Poble — Enxufe', 'socdepoble' ),
					array( 'back_link' => true )
				);
			}
		);
	}
	add_action(
		'all_admin_notices',
		static function () {
			if ( ! current_user_can( 'activate_plugins' ) ) {
				return;
			}
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html(
					sprintf(
						/* translators: 1: folder of the copy that is loaded, 2: folder of this copy. */
						__( 'Sóc de Poble — Enxufe is installed twice and both copies are active. The copy in %1$s is loaded and the copy in %2$s is ignored. Deactivate one of them in Plugins.', 'socdepoble' ),
						dirname( SOCDEPOBLE_ENXUFE_FITXER ),
						__DIR__
					)
				)
			);
		}
	);
	return;
}

const SOCDEPOBLE_ENXUFE_VERSIO    = '1.1.9';
const SOCDEPOBLE_ENXUFE_FITXER    = __FILE__;
const SOCDEPOBLE_ENXUFE_SLUG      = 'socdepoble';
const SOCDEPOBLE_ENXUFE_HANDLE    = 'socdepoble';
const SOCDEPOBLE_ENXUFE_BUNDLE    = 'dist/soc-de-poble.standalone.js';
const SOCDEPOBLE_ENXUFE_MANIFEST  = 'dist/sdp-release.json';
const SOCDEPOBLE_ENXUFE_SEO_RUTES = 'dist/seo-routes.json';
const SOCDEPOBLE_ENXUFE_FONTS     = 'dist/fonts/noto-sans.css';
const SOCDEPOBLE_ENXUFE_PLANTILLA = 'socdepoble-enxufe-pantalla-completa';
const SOCDEPOBLE_ENXUFE_OPCIO     = 'socdepoble_enxufe';

require_once __DIR__ . '/includes/idioma.php';
require_once __DIR__ . '/includes/copies.php';
require_once __DIR__ . '/includes/manifest.php';
require_once __DIR__ . '/includes/marcatge.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/traduccio.php';
require_once __DIR__ . '/includes/ajustos.php';
require_once __DIR__ . '/includes/salut.php';

/* Una còpia activa només en un lloc secundari no es carrega a l'administració
   de xarxa i la guarda de dalt no la veu: el refús de l'activació de xarxa és
   un ganxo, i va abans de cap altre (actualitzador.php). */
register_activation_hook( SOCDEPOBLE_ENXUFE_FITXER, 'socdepoble_enxufe_refusa_xarxa_amb_copies' );

/* El canal propi d'actualitzacions és opcional: la variant del directori de
   WordPress.org no el porta, i sense ell el plugin funciona igual. */
if ( is_readable( __DIR__ . '/includes/actualitzador.php' ) ) {
	require_once __DIR__ . '/includes/actualitzador.php';
}
