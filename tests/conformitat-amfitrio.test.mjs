/**
 * Conformitat d'amfitrió (T2b, P1-b) · la MATEIXA bateria per a tots els
 * amfitrions: el marcatge real del plugin de WordPress (PHP local, sense BD)
 * i un amfitrió Sollutia simulat (tests/fixtures/amfitrio-sollutia.mjs).
 *
 * Cada amfitrió dona una pàgina; d'ella es trau una declaració (el global, la
 * cua, cada <soc-de-poble>, el que s'assigna a la seua propietat JS `config`
 * i el paquet) i el validador del contracte
 * sdp.amfitrio.v1 (src/config/contracteAmfitrio.js) la jutja. Les declaracions
 * en línia s'avaluen dins d'un context de node:vm amb una finestra buida: es
 * llig el que l'amfitrió escriu de veritat, no una expressió regular.
 *
 * A1 (decisió pendent del Mestre): WordPress amb un tenantId desat als
 * Ajustos l'empeny per la cua (`configura({config:{tenantId}})`), un canal que
 * el contracte no admet. Ací NO es fabrica cap verd: la prova afirma que el
 * validador ho DETECTA. Quan el Mestre decidisca, o es retira el canal (i la
 * prova passa a exigir conformitat) o es reconeix amb una ADR al contracte.
 *
 * Fixtures locals i sintètiques: cap BD, cap compte, cap URL real.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CONTRACTE_AMFITRIO } from '../vite.standalone.config.js';
import { CONTRACTE_AMFITRIO_V1 as C, validaDeclaracioAmfitrio } from '../src/config/contracteAmfitrio.js';
import { sanejaRuta } from '../src/config/configAmfitrio.js';
import { emetMarcatge } from './fixtures/amfitrio-sollutia.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.join(os.homedir(), '.studio/php-bin');
const PHP = [process.env.PHP_BIN, 'php', ...(fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map((v) => path.join(studio, v, 'php')) : [])]
  .filter(Boolean).find((bin) => spawnSync(bin, ['-v'], { timeout: 5000 }).status === 0);

const UUID_SINTETIC = '66666666-6666-4666-8666-666666666666';

/* ───────────────────────── Pàgina → declaració ───────────────────────── */

/* El que s'avalua dins del context de vm és d'un altre reialme: es passa per
   JSON (és el que és, dades) perquè les comparacions estrictes no tropessen
   amb un Object.prototype distint. */
const aDades = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

/** La declaració que fa una pàgina: el que escriu en línia, els elements, la propietat JS i el paquet. */
function declaracioDe(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  try {
    const doc = dom.window.document;
    const finestra = {};
    const elements = [...doc.querySelectorAll(C.element)];
    /* Canal 6 (WP-R2): el que un script assigna a element.config es registra,
       com a dades. Qualsevol altre node no és cap element de Sóc de Poble. */
    const propietats = [];
    const sonda = (node) => (elements.includes(node) ? { set config(valor) { propietats.push(aDades(valor)); } } : null);
    const documentSimulat = {
      querySelector: (selector) => sonda(doc.querySelector(selector)),
      querySelectorAll: (selector) => [...doc.querySelectorAll(selector)].map(sonda).filter(Boolean),
      getElementById: (id) => sonda(doc.getElementById(id))
    };
    for (const script of doc.querySelectorAll('script:not([src])')) {
      vm.runInNewContext(script.textContent, { window: finestra, document: documentSimulat }, { timeout: 1000 });
    }
    return {
      global: aDades(finestra.SocDePobleConfig),
      cua: aDades(finestra.SocDePobleCua),
      elements: elements.map((element) => ({
        atributs: Object.fromEntries([...element.attributes].map((atribut) => [atribut.name, atribut.value]))
      })),
      ...(propietats.length ? { propietats } : {}),
      scripts: [...doc.querySelectorAll('script[src]')].map((script) => ({
        src: script.getAttribute('src'),
        tipus: script.getAttribute('type') === 'module' ? 'module' : 'classic'
      }))
    };
  } finally {
    dom.window.close();
  }
}

/* ─────────────────────────── La bateria comuna ─────────────────────────── */

/** El mateix judici per a qualsevol amfitrió conforme. */
function bateria(decl, amfitrio) {
  const resultat = validaDeclaracioAmfitrio(decl);
  assert.deepEqual(resultat.errors, [], `${amfitrio}: ${JSON.stringify(resultat.errors)}`);
  assert.equal(resultat.ok, true);

  // Una instància, només amb atributs del marcatge universal.
  assert.equal(decl.elements.length, 1, `${amfitrio}: un sol <soc-de-poble>`);
  const { atributs } = decl.elements[0];
  for (const nom of Object.keys(atributs)) assert.ok(C.atributs.includes(nom), `${amfitrio}: atribut ${nom} fora de ${C.marcatge}`);
  assert.ok(atributs['plugin-url'] && atributs['fonts-href'], `${amfitrio}: plugin-url i fonts-href`);

  // El global, si n'hi ha, només amb les claus declarades.
  if (decl.global !== undefined) {
    for (const clau of Object.keys(decl.global)) assert.ok(C.claus.includes(clau), `${amfitrio}: clau ${clau} al global`);
    if (decl.global.poble !== undefined) assert.match(decl.global.poble, new RegExp(C.patroPoble));
  }
  if (atributs.poble !== undefined) assert.match(atributs.poble, new RegExp(C.patroPoble));

  // La ruta inicial arriba al nucli tal qual: sanejaRuta la conserva i cap dins del límit.
  if (atributs['ruta-inicial'] !== undefined) {
    assert.equal(sanejaRuta(atributs['ruta-inicial']), atributs['ruta-inicial']);
    assert.ok(atributs['ruta-inicial'].length <= C.limits.rutaInicial);
  }

  // Cap canal no porta backend ni tenant; la cua, si n'hi ha, no porta res.
  assert.deepEqual(decl.cua ?? [], [], `${amfitrio}: cap ordre a la cua`);
  const tot = JSON.stringify({ global: decl.global, atributs, propietats: decl.propietats });
  assert.doesNotMatch(tot, /tenant|supabase|backend|data-mode|dataMode|anon/i);

  // El paquet: un sol <script src> clàssic, darrere de la declaració.
  assert.deepEqual(decl.scripts.map((script) => script.tipus), ['classic'], `${amfitrio}: el paquet és un script clàssic`);
  assert.match(decl.scripts[0].src, /soc-de-poble\.standalone\.js(?:\?|$)/);
  return resultat;
}

/* ───────────────────────── WordPress (PHP local) ───────────────────────── */

/* Runner mínim, com el de tests/enxufe-runtime.test.mjs: les funcions de
   WordPress que toca el marcatge, amb dobles; el marcatge i el manifest, de
   veritat. Qualsevol avís de PHP es converteix en error. */
const RUNNER = `<?php
error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) { throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia ); } );
define( 'ABSPATH', __DIR__ . '/' );
define( 'SOCDEPOBLE_ENXUFE_FITXER', __DIR__ . '/socdepoble-enxufe.php' );
define( 'SOCDEPOBLE_ENXUFE_MANIFEST', 'dist/sdp-release.json' );
define( 'SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js' );
define( 'SOCDEPOBLE_ENXUFE_FONTS', 'dist/fonts/noto-sans.css' );
define( 'SOCDEPOBLE_ENXUFE_HANDLE', 'socdepoble-enxufe' );
define( 'SOCDEPOBLE_ENXUFE_VERSIO', '0.0.0-prova' );
define( 'SOCDEPOBLE_ENXUFE_OPCIO', 'socdepoble_enxufe' );
$cas = json_decode( file_get_contents( $argv[2] ), true, 512, JSON_THROW_ON_ERROR );
$inline = array();
$script = null;
function plugin_dir_path( $p ) { return dirname( $p ) . '/'; }
function plugins_url( $p, $f ) { return 'https://amfitrio.test/wp-content/plugins/socdepoble-enxufe/' . $p; }
function rest_url( $p ) { return 'https://amfitrio.test/wp-json/' . $p; }
function esc_attr( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $v ) { return esc_attr( $v ); }
function esc_url_raw( $v, $a = null ) { return $v; }
function esc_html__( $t, $d ) { return esc_attr( $t ); }
function sanitize_text_field( $v ) { return trim( preg_replace( '/[\\r\\n\\t ]+/', ' ', strip_tags( (string) $v ) ) ); }
function sanitize_title( $v ) { return trim( preg_replace( '/[^a-z0-9-]+/', '-', strtolower( trim( (string) $v ) ) ), '-' ); }
function get_option( $nom, $defecte = false ) { return 'socdepoble_enxufe' === $nom ? ( $GLOBALS['cas']['opcio'] ?? $defecte ) : $defecte; }
function apply_filters( $nom, $valor, ...$args ) { return $valor; }
function wp_json_encode( $v, $flags = 0 ) { return json_encode( $v, $flags ); }
function current_user_can( $c ) { return false; }
function add_action( ...$a ) {} function add_filter( ...$a ) {} function add_shortcode( ...$a ) {}
function wp_enqueue_style( ...$a ) {} function wp_enqueue_script( ...$a ) {}
function wp_register_style( ...$a ) {} function wp_add_inline_style( ...$a ) {}
function wp_register_script( ...$a ) { $GLOBALS['script'] = $a; }
function wp_add_inline_script( $h, $codi, $posicio = 'after' ) { $GLOBALS['inline'][] = array( 'codi' => $codi, 'posicio' => $posicio ); }
function socdepoble_enxufe_deepl_clau() { return $GLOBALS['cas']['deepl'] ?? ''; }
require $argv[1] . '/wordpress-plugin/includes/manifest.php';
require $argv[1] . '/wordpress-plugin/includes/marcatge.php';
if ( isset( $cas['rutes'] ) ) {
	echo json_encode( array_map( 'socdepoble_enxufe_ruta', $cas['rutes'] ), JSON_THROW_ON_ERROR );
	exit;
}
socdepoble_enxufe_registra_actius();
$html = socdepoble_enxufe_marcatge( $cas['instancia'] ?? array() );
echo json_encode( array( 'html' => $html, 'inline' => $inline, 'script' => $script, 'referencia' => socdepoble_enxufe_marcatge_de_referencia() ), JSON_THROW_ON_ERROR );
`;

function wordpress(cas, t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-conformitat-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist/soc-de-poble.standalone.js'), '/* paquet sintètic */');
  fs.writeFileSync(path.join(dir, 'runner.php'), RUNNER);
  fs.writeFileSync(path.join(dir, 'cas.json'), JSON.stringify(cas));
  const proces = spawnSync(PHP, [path.join(dir, 'runner.php'), ARREL, path.join(dir, 'cas.json')], { encoding: 'utf8', timeout: 10000 });
  assert.equal(proces.status, 0, proces.stderr + proces.stdout);
  return JSON.parse(proces.stdout);
}

/** La pàgina com la pinta WordPress: el que va «before» del paquet, el marcatge i el paquet. */
function paginaDeWordpress(eixida) {
  const abans = eixida.inline.filter((i) => i.posicio === 'before').map((i) => `<script>${i.codi}</script>`).join('\n');
  const [, src, , , peu] = eixida.script;
  assert.equal(peu, true, 'el paquet va al peu');
  return `${abans}\n${eixida.html}\n<script src="${src}"></script>`;
}

const ambPhp = { skip: !PHP && 'PHP absent' };

/* ─────────────────────────────── Proves ─────────────────────────────── */

describe('el contracte que juga la bateria', () => {
  test('el marcatge del contracte és el que viatja al manifest (vite.standalone.config.js)', () => {
    assert.deepEqual(
      { marcatge: C.marcatge, element: C.element, global: C.global, claus: [...C.claus], atributs: [...C.atributs] },
      { ...CONTRACTE_AMFITRIO, claus: [...CONTRACTE_AMFITRIO.claus], atributs: [...CONTRACTE_AMFITRIO.atributs] }
    );
  });
});

describe('Sollutia simulat', () => {
  test('les tres peces amb nom, poble i ruta: conforme', () => {
    const decl = declaracioDe(emetMarcatge({ nomPoble: 'Gent de Sella', poble: 'sella', rutaInicial: '/xat?vista=comunitats' }));
    bateria(decl, 'Sollutia');
    assert.deepEqual(decl.global, { nomPoble: 'Gent de Sella', poble: 'sella' });
  });

  test('sense res a declarar: només l’element i el paquet, conforme', () => {
    const decl = declaracioDe(emetMarcatge());
    assert.equal(decl.global, undefined);
    bateria(decl, 'Sollutia');
  });

  test('límit de la ruta inicial: 200 caràcters s’emeten; 201, no', () => {
    const justa = `/${'a'.repeat(C.limits.rutaInicial - 1)}`;
    const llarga = `${justa}a`;
    assert.equal(declaracioDe(emetMarcatge({ rutaInicial: justa })).elements[0].atributs['ruta-inicial'], justa);
    assert.equal(declaracioDe(emetMarcatge({ rutaInicial: llarga })).elements[0].atributs['ruta-inicial'], undefined);
  });

  test('sonda: un Sollutia desviat (tenant, backend, cua, propietat i mòdul) no passa, i el validador diu per on', () => {
    const decl = declaracioDe(emetMarcatge({ poble: 'sella', desviacions: ['tenant', 'backend', 'cua', 'propietat', 'modul'] }));
    const resultat = validaDeclaracioAmfitrio(decl);
    assert.equal(resultat.ok, false);
    assert.deepEqual(resultat.errors.map((e) => `${e.codi}@${e.canal}`).sort(),
      ['backend@element', 'backend@propietat', 'bundle-modul@script', 'tenant@cua', 'tenant@element', 'tenant@propietat']);
    assert.throws(() => bateria(decl, 'Sollutia desviat'));
  });

  /* WP-R2: la propietat JS és el canal que el codi presenta per a Sollutia.
     Un tenant UUID per ací guanyaria al segellat al paquet. */
  test('sonda: un Sollutia que només es desvia per la propietat JS config tampoc passa', () => {
    const decl = declaracioDe(emetMarcatge({ poble: 'sella', desviacions: ['propietat'] }));
    assert.deepEqual(decl.propietats, [{ tenantId: '55555555-5555-4555-8555-555555555555', supabaseUrl: 'https://backend.sollutia.test' }]);
    const resultat = validaDeclaracioAmfitrio(decl);
    assert.equal(resultat.ok, false);
    assert.deepEqual(resultat.errors.map((e) => `${e.codi}@${e.canal}:${e.clau}`), ['tenant@propietat:tenantId', 'backend@propietat:supabaseUrl']);
    assert.deepEqual(resultat.net.propietats, [{}]);
    assert.throws(() => bateria(decl, 'Sollutia per la propietat'));
  });

  test('la propietat JS config amb claus de l’amfitrió: conforme', () => {
    const decl = declaracioDe(emetMarcatge({ poble: 'sella', propietat: { nomPoble: 'Gent de Sella', apps: 'bar' } }));
    assert.deepEqual(decl.propietats, [{ nomPoble: 'Gent de Sella', apps: 'bar' }]);
    bateria(decl, 'Sollutia amb propietat');
  });
});

describe('WordPress (marcatge.php real, PHP local)', () => {
  test('per defecte: el global del banc de proves, l’element i el paquet; conforme', ambPhp, (t) => {
    const eixida = wordpress({}, t);
    const decl = declaracioDe(paginaDeWordpress(eixida));
    bateria(decl, 'WordPress');
    assert.deepEqual(decl.global, { nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' });
  });

  test('ajustos i instància (nom, poble i ruta) i el servei de traducció: conforme', ambPhp, (t) => {
    const eixida = wordpress({
      opcio: { nomPoble: 'Gent de Sella', poble: 'sella' },
      instancia: { nomPoble: 'Penàguila', poble: 'penaguila', rutaInicial: '/pobles/penaguila?vista=mapa#portada' },
      deepl: 'clau-sintetica-de-prova'
    }, t);
    const decl = declaracioDe(paginaDeWordpress(eixida));
    bateria(decl, 'WordPress');
    assert.deepEqual(decl.elements[0].atributs, {
      'fonts-href': 'https://amfitrio.test/wp-content/plugins/socdepoble-enxufe/dist/fonts/noto-sans.css',
      'plugin-url': 'https://amfitrio.test/wp-content/plugins/socdepoble-enxufe/dist/',
      'traductor-url': 'https://amfitrio.test/wp-json/socdepoble/v1/traduir',
      'nom-poble': 'Penàguila',
      poble: 'penaguila',
      'ruta-inicial': '/pobles/penaguila?vista=mapa'
    });
  });

  test('el marcatge de referència per a copiar (ajustos.php) també és conforme', ambPhp, (t) => {
    const eixida = wordpress({ opcio: { nomPoble: 'Gent de Sella', poble: 'sella', tenantId: UUID_SINTETIC } }, t);
    const decl = declaracioDe(eixida.referencia);
    bateria(decl, 'WordPress (referència)');
  });

  test('A1 · amb un tenantId desat, WordPress l’empeny per la cua i el validador ho DETECTA (decisió pendent del Mestre)', ambPhp, (t) => {
    const eixida = wordpress({ opcio: { nomPoble: 'Gent de Sella', poble: 'sella', tenantId: UUID_SINTETIC } }, t);
    const decl = declaracioDe(paginaDeWordpress(eixida));
    // El que emet de veritat: una ordre `configura` amb l'abast de dades.
    assert.equal(decl.cua.length, 1);
    assert.equal(decl.cua[0][0], 'configura');
    assert.equal(decl.cua[0][1].config.tenantId, UUID_SINTETIC);
    const resultat = validaDeclaracioAmfitrio(decl);
    assert.equal(resultat.ok, false, 'el validador ha de detectar el canal no declarat');
    assert.deepEqual(resultat.errors.map((e) => `${e.codi}@${e.canal}:${e.clau}`), ['tenant@cua:config.tenantId']);
    // La resta de la pàgina és conforme: el net no porta la cua bruta.
    assert.deepEqual(resultat.net.cua, [['configura', { config: {} }]]);
    assert.throws(() => bateria(decl, 'WordPress amb tenantId'));
  });

  test('paritat de la ruta inicial entre PHP i JS: mateixa acceptació fins al límit; per damunt, PHP no l’emet', ambPhp, (t) => {
    const justa = `/${'a'.repeat(C.limits.rutaInicial - 1)}`;
    const candidates = [
      '/xat', '/pobles/sella?vista=mapa', '/mur?filtre=tot#ancora', '/pobles/sàlla', '/xat/', '/',
      '//evil.test/x', 'https://evil.test/', '/a/../admin', '/a/%2e%2e/admin', '/a/%2E./b', '/\\evil.test',
      '/amb espai', '/amb\ttab', `/amb${String.fromCodePoint(0xA0)}nbsp`, `/amb${String.fromCodePoint(0x2028)}ls`,
      `/amb${String.fromCodePoint(0xFEFF)}bom`, `/amb${String.fromCodePoint(0x85)}nel`, 'xat', '',
      justa, `${justa}a`
    ];
    const php = wordpress({ rutes: candidates }, t);
    candidates.forEach((ruta, i) => {
      const acceptaPhp = php[i] !== '';
      const dinsDelLimit = ruta.length <= C.limits.rutaInicial;
      const acceptaJs = sanejaRuta(ruta) !== undefined && dinsDelLimit;
      assert.equal(acceptaPhp, acceptaJs, `${JSON.stringify(ruta)}: PHP ${acceptaPhp}, JS ${acceptaJs}`);
      // El que PHP emet, el nucli no el descarta.
      if (acceptaPhp) assert.notEqual(sanejaRuta(php[i]), undefined, JSON.stringify(ruta));
    });
    // Divergència documentada: sanejaRuta no té límit de longitud; el contracte i PHP, sí.
    assert.equal(sanejaRuta(`${justa}a`), `${justa}a`);
  });
});
