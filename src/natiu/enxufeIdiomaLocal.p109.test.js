import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ARREL = path.resolve(import.meta.dirname, '..', '..');
const IDIOMA_LOCAL_PHP = path.join(ARREL, 'wordpress-plugin', 'includes', 'idioma-local.php');
const IDIOMA_PHP = path.join(ARREL, 'wordpress-plugin', 'includes', 'idioma.php');
const FITXER_PRINCIPAL = path.join(ARREL, 'wordpress-plugin', 'socdepoble-enxufe.php');

function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instalLats = existsSync(studio)
    ? readdirSync(studio).sort().reverse().map((versio) => path.join(studio, versio, 'php'))
    : [];
  return ['php', ...instalLats].find((binari) => spawnSync(binari, ['-v'], { timeout: 5000 }).status === 0);
}

describe('P1-09 (C2120-05) · Pont .l10n.php en WordPress < 6.5 sense WP_Translation_Controller', () => {
  it('protegix amb class_exists(WP_Translation_Controller) i function_exists per a determine_locale / is_locale_switched', () => {
    const php = readFileSync(IDIOMA_LOCAL_PHP, 'utf8');
    expect(php).toContain("class_exists( 'WP_Translation_Controller' )");
    expect(php).toContain("function_exists( 'determine_locale' )");
    expect(php).toContain("function_exists( 'is_locale_switched' )");
    expect(php).toContain("gettext_socdepoble");
    expect(php).toContain("gettext_with_context_socdepoble");
    expect(php).toContain('/^[A-Za-z0-9_-]+$/D');
  });

  it('executa el pont en PHP amb canvi de llengua i guardes opcionals', (ctx) => {
    const binariPhp = cercaPhp();
    if (!binariPhp) {ctx.skip('PHP no disponible: no s’ha executat el pont.');return;}
    for(const opcionals of [true,false]) {
    const scriptPhp = `
      define( 'ABSPATH', ${JSON.stringify(ARREL + '/wordpress-plugin/')} );
      define( 'SOCDEPOBLE_ENXUFE_FITXER', ${JSON.stringify(FITXER_PRINCIPAL)} );
      $GLOBALS['filtres'] = array();
      $GLOBALS['accions'] = array();
      $GLOBALS['pila_locale'] = array();
      $GLOBALS['locale_init'] = 'ca_valencia';

      function plugin_dir_path( $f ) { return dirname( $f ) . '/'; }
      function plugin_basename( $f ) { return 'socdepoble/socdepoble-enxufe.php'; }
      function load_plugin_textdomain( $d, $dep, $rel ) {}
      ${opcionals ? "function determine_locale() { return $GLOBALS['locale_init']; } function is_locale_switched() { return ! empty( $GLOBALS['pila_locale'] ); }" : ''}
      function add_filter( $tag, $cb, $prio = 10, $args = 1 ) { $GLOBALS['filtres'][ $tag ][] = $cb; }
      function add_action( $tag, $cb, $prio = 10, $args = 1 ) { $GLOBALS['accions'][ $tag ][] = $cb; }
      function apply_filters( $tag, $val, ...$resta ) {
        foreach ( $GLOBALS['filtres'][ $tag ] ?? array() as $cb ) {
          $val = $cb( $val, ...$resta );
        }
        return $val;
      }
      function do_action( $tag, ...$args ) {
        foreach ( $GLOBALS['accions'][ $tag ] ?? array() as $cb ) {
          $cb( ...$args );
        }
      }

      require ${JSON.stringify(IDIOMA_PHP)};
      require ${JSON.stringify(IDIOMA_LOCAL_PHP)};
      socdepoble_enxufe_carrega_traduccions();

      $ca = apply_filters( 'gettext_socdepoble', 'View details', 'View details' );
      $context = apply_filters( 'gettext_with_context_socdepoble', 'village', 'village', 'block keyword' );
      $traversal = socdepoble_enxufe_cataleg_local( '../socdepoble-enxufe' );

      $GLOBALS['pila_locale'] = array('ca'); do_action('change_locale', 'en_US');
      $angles = apply_filters('gettext_socdepoble','View details','View details');
      $GLOBALS['pila_locale'] = array(); do_action('change_locale', ${opcionals ? "'ca_valencia'" : "'ca'"});
      $restaurada = apply_filters('gettext_socdepoble','View details','View details');
      $externa = apply_filters('gettext_socdepoble','Traducció externa','View details');
      echo json_encode( array( 'ca' => $ca, 'context' => $context, 'traversal' => $traversal, 'angles'=>$angles, 'restaurada'=>$restaurada, 'externa'=>$externa ) );
    `;
    const sortida = execFileSync(binariPhp, ['-n', '-r', scriptPhp], { encoding: 'utf8' });
    const resultat = JSON.parse(sortida);
    expect(resultat.ca).not.toBe('View details');
    expect(resultat.context).not.toBe('village');
    expect(resultat.traversal).toEqual([]);
    expect(resultat.angles).toBe('View details');
    expect(resultat.restaurada).toBe(resultat.ca);
    expect(resultat.externa).toBe('Traducció externa');
    }
  });
});
