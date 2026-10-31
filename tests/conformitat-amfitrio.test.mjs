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
 * A1 (decidida pel Mestre el 261003: retirar-lo). El plugin ja no té el camp
 * «Tenant ID» ni empeny res per la cua: amb una opció heretada que encara el
 * porta, la pàgina de WordPress ha de ser CONFORME, sense cap cua, i la
 * neteja de l'opció ha d'esborrar només eixa clau. Es prova amb PHP real.
 *
 * Esquelet de càrrega (ordre del Mestre, 261016): les dues eixides de
 * WordPress porten «Carregant el mur...» dins de l'element, i, si hi ha un
 * WordPress a mà, el seu wptexturize real no en toca els tres punts.
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

/** El mateix judici per a qualsevol amfitrió conforme. `optIn` són els
    atributs opcionals que eixe amfitrió declara a posta (Onada 5: la
    instància pròpia de WordPress emet ruta-a-url); per defecte, cap. */
function bateria(decl, amfitrio, { optIn = [] } = {}) {
  const resultat = validaDeclaracioAmfitrio(decl);
  assert.deepEqual(resultat.errors, [], `${amfitrio}: ${JSON.stringify(resultat.errors)}`);
  assert.equal(resultat.ok, true);

  // Una instància, només amb atributs del marcatge universal i els opcionals declarats.
  assert.equal(decl.elements.length, 1, `${amfitrio}: un sol <soc-de-poble>`);
  const { atributs } = decl.elements[0];
  for (const nom of Object.keys(atributs)) {
    assert.ok(C.atributs.includes(nom) || optIn.includes(nom), `${amfitrio}: atribut ${nom} fora de ${C.marcatge}`);
  }
  if (atributs['ruta-a-url'] !== undefined) assert.ok(C.rutaAUrl.modes.includes(atributs['ruta-a-url']), `${amfitrio}: mode de ruta-a-url`);
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
/* TC3.1 (261030) · traduccio.php de veritat: marcatge.php hi demana els destins
   (traductor-llengues). La clau de DeepL i la URL lliure entren com a WordPress. */
function wp_parse_url( $v ) { return parse_url( $v ); }
putenv( 'DEEPL_API_KEY=' . ( $cas['deepl'] ?? '' ) );
foreach ( $cas['constants'] ?? array() as $k => $v ) { define( $k, $v ); }
require $argv[1] . '/wordpress-plugin/includes/manifest.php';
require $argv[1] . '/wordpress-plugin/includes/marcatge.php';
require $argv[1] . '/wordpress-plugin/includes/traduccio.php';
if ( isset( $cas['rutes'] ) ) {
	echo json_encode( array_map( 'socdepoble_enxufe_ruta', $cas['rutes'] ), JSON_THROW_ON_ERROR );
	exit;
}
/* A1 · Ajustos: la neteja de l'opció heretada, el sanejador i la diagnosi. */
if ( isset( $cas['ajustos'] ) ) {
	$desades = array();
	function plugin_basename( $f ) { return 'socdepoble-enxufe/socdepoble-enxufe.php'; }
	function __( $t, $d ) { return $t; }
	function wp_get_environment_type() { return 'production'; }
	function update_option( $nom, $valor ) { $GLOBALS['desades'][] = array( $nom, $valor ); return true; }
	require $argv[1] . '/wordpress-plugin/includes/ajustos.php';
	socdepoble_enxufe_oblida_tenant_heretat();
	echo json_encode( array(
		'desades'  => $desades,
		'sanejada' => socdepoble_enxufe_sanitza_opcio( $cas['opcio'] ?? null ),
		'diagnosi' => socdepoble_enxufe_diagnosi(),
		'manifest' => socdepoble_enxufe_manifest_local(),
	), JSON_THROW_ON_ERROR );
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
  if (cas.manifest) fs.writeFileSync(path.join(dir, 'dist/sdp-release.json'), JSON.stringify(cas.manifest));
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

/* ───────────── Esquelet de càrrega (ordre del Mestre, 261016) ───────────── */

const ESQUELET_DE_CARREGA = 'Carregant el mur...';

/** Els fills de l'únic <soc-de-poble> de la pàgina, llegits amb un analitzador HTML de veritat. */
function fillsDe(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  try {
    const elements = dom.window.document.querySelectorAll(C.element);
    assert.equal(elements.length, 1, 'un sol <soc-de-poble>');
    return [...elements[0].childNodes].map((node) => ({
      tipus: node.nodeType === dom.window.Node.TEXT_NODE ? 'text' : node.nodeName.toLowerCase(),
      text: node.textContent
    }));
  } finally {
    dom.window.close();
  }
}

/* El wptexturize de WordPress, de veritat, si n'hi ha un a mà: WP_INCLUDES o
   un lloc de WordPress Studio (~/Studio/<lloc>/wp-includes). Només es carrega
   formatting.php, amb un registre de filtres mínim, i el marcatge.php del
   plugin, que hi enganxa els seus ganxos com en una petició. */
const llocsStudio = path.join(os.homedir(), 'Studio');
const WP_INCLUDES = [process.env.WP_INCLUDES, ...(fs.existsSync(llocsStudio) ? fs.readdirSync(llocsStudio).sort().map((lloc) => path.join(llocsStudio, lloc, 'wp-includes')) : [])]
  .filter(Boolean).find((dir) => fs.existsSync(path.join(dir, 'formatting.php')));

const TEXTURITZA = `<?php
error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) { throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia ); } );
define( 'ABSPATH', __DIR__ . '/' );
$cas = json_decode( file_get_contents( $argv[3] ), true, 512, JSON_THROW_ON_ERROR );
$filtres = array();
$shortcode_tags = array();
function add_filter( $nom, $callback, $prioritat = 10, $arguments = 1 ) { $GLOBALS['filtres'][ $nom ][] = $callback; return true; }
function add_action( ...$a ) { return true; }
function apply_filters( $nom, $valor, ...$args ) { foreach ( $GLOBALS['filtres'][ $nom ] ?? array() as $callback ) { $valor = $callback( $valor, ...$args ); } return $valor; }
function _x( $text, $context ) { return $text; }
require $argv[2] . '/formatting.php';
if ( $cas['ambPlugin'] ) {
	require $argv[1] . '/wordpress-plugin/includes/marcatge.php';
}
echo json_encode( wptexturize( $cas['html'] ), JSON_THROW_ON_ERROR );
`;

function texturitza(html, ambPlugin, t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-texturitza-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'runner.php'), TEXTURITZA);
  fs.writeFileSync(path.join(dir, 'cas.json'), JSON.stringify({ html, ambPlugin }));
  const proces = spawnSync(PHP, [path.join(dir, 'runner.php'), ARREL, WP_INCLUDES, path.join(dir, 'cas.json')], { encoding: 'utf8', timeout: 10000 });
  assert.equal(proces.status, 0, proces.stderr + proces.stdout);
  return JSON.parse(proces.stdout);
}

const ambWordpress = { skip: (!PHP && 'PHP absent') || (!WP_INCLUDES && 'WordPress absent: indica WP_INCLUDES (també es detecta WordPress Studio)') };

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

  /* Correcció de l'A1 (261003): el relé d'OAuth és un servei propi de Sóc de
     Poble. Un amfitrió que el declara a l'etiqueta no és conforme, i el nucli
     el descarta (src/PedraSecaEmbed.config.test.jsx). */
  test('sonda: un Sollutia que declara el relé d’OAuth a l’etiqueta no passa', () => {
    const decl = declaracioDe(emetMarcatge({ poble: 'sella', desviacions: ['servei'] }));
    const resultat = validaDeclaracioAmfitrio(decl);
    assert.equal(resultat.ok, false);
    assert.deepEqual(resultat.errors.map((e) => `${e.codi}@${e.canal}:${e.clau}`), ['atribut-propi-de-sdp@element:oauth-relay-url']);
    assert.equal(resultat.net.elements[0].atributs['oauth-relay-url'], undefined);
    assert.throws(() => bateria(decl, 'Sollutia amb el relé'));
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
    bateria(decl, 'WordPress', { optIn: C.atributsOptIn });
    assert.deepEqual(decl.global, { nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' });
    // Onada 5: la instància pròpia porta les URL copiables (#sdp=/ruta).
    assert.equal(decl.elements[0].atributs['ruta-a-url'], 'fragment');
    /* IDEA-31 (QA-R2-13): sense clau de DeepL també hi ha servei de
       traducció (Apertium), i la instància pròpia en porta l'URL. */
    assert.equal(decl.elements[0].atributs['traductor-url'], 'https://amfitrio.test/wp-json/socdepoble/v1/traduir');
    // La referència per a copiar en un altre amfitrió continua sense el servei local.
    assert.equal(declaracioDe(eixida.referencia).elements[0].atributs['traductor-url'], undefined);
    /* TC3.1 (261030) · Sense DeepL ni SDP_TRADUCCIO_URL, el servei declara els
       destins d'Apertium: el client no hi demana EU ni DE (cap 503). */
    assert.equal(decl.elements[0].atributs['traductor-llengues'], 'ES GL EN-GB FR');
    assert.equal(declaracioDe(eixida.referencia).elements[0].atributs['traductor-llengues'], undefined);
  });

  test('TC3.1 · traductor-llengues segons el servidor: DeepL els sis, SDP_TRADUCCIO_URL afig EU i DE; conforme', ambPhp, (t) => {
    const destinsDe = (cas) => {
      const decl = declaracioDe(paginaDeWordpress(wordpress(cas, t)));
      bateria(decl, 'WordPress', { optIn: C.atributsOptIn });
      return decl.elements[0].atributs['traductor-llengues'];
    };
    assert.equal(destinsDe({ deepl: 'clau-sintetica-de-prova' }), 'ES GL EU EN-GB FR DE');
    assert.equal(destinsDe({ constants: { SDP_TRADUCCIO_URL: 'https://lliure.example/translate' } }), 'ES GL EU EN-GB FR DE');
    assert.equal(destinsDe({ constants: { SDP_TRADUCCIO_URL: 'http://lliure.example/translate' } }), 'ES GL EN-GB FR');
  });

  test('ajustos i instància (nom, poble i ruta) i el servei de traducció: conforme', ambPhp, (t) => {
    const eixida = wordpress({
      opcio: { nomPoble: 'Gent de Sella', poble: 'sella' },
      instancia: { nomPoble: 'Penàguila', poble: 'penaguila', rutaInicial: '/pobles/penaguila?vista=mapa#portada' },
      deepl: 'clau-sintetica-de-prova'
    }, t);
    const decl = declaracioDe(paginaDeWordpress(eixida));
    bateria(decl, 'WordPress', { optIn: C.atributsOptIn });
    assert.deepEqual(decl.elements[0].atributs, {
      'fonts-href': 'https://amfitrio.test/wp-content/plugins/socdepoble-enxufe/dist/fonts/noto-sans.css',
      'plugin-url': 'https://amfitrio.test/wp-content/plugins/socdepoble-enxufe/dist/',
      'traductor-url': 'https://amfitrio.test/wp-json/socdepoble/v1/traduir',
      'traductor-llengues': 'ES GL EU EN-GB FR DE',
      'nom-poble': 'Penàguila',
      poble: 'penaguila',
      'ruta-inicial': '/pobles/penaguila?vista=mapa',
      'ruta-a-url': 'fragment'
    });
  });

  test('el marcatge de referència per a copiar (ajustos.php) també és conforme', ambPhp, (t) => {
    const eixida = wordpress({ opcio: { nomPoble: 'Gent de Sella', poble: 'sella', tenantId: UUID_SINTETIC } }, t);
    const decl = declaracioDe(eixida.referencia);
    bateria(decl, 'WordPress (referència)');
    // El marcatge per a copiar en un altre amfitrió no porta cap opcional.
    assert.equal(decl.elements[0].atributs['ruta-a-url'], undefined);
  });

  test('esquelet de càrrega: la instància de WordPress i la referència copiable diuen «Carregant el mur...» dins de l’element, i res més', ambPhp, (t) => {
    for (const cas of [{}, {
      opcio: { nomPoble: 'Gent de Sella', poble: 'sella' },
      instancia: { nomPoble: 'Penàguila', poble: 'penaguila', rutaInicial: '/xat' },
      deepl: 'clau-sintetica-de-prova'
    }]) {
      const eixida = wordpress(cas, t);
      const pagina = paginaDeWordpress(eixida);
      for (const [canal, html] of [['instància', pagina], ['referència', eixida.referencia]]) {
        const nom = `${canal} ${JSON.stringify(cas)}`;
        assert.deepEqual(fillsDe(html), [{ tipus: 'text', text: ESQUELET_DE_CARREGA }], nom);
        // Tal qual als bytes: tres punts ASCII, cap entitat, i mai «del poble».
        assert.ok(html.includes(`>${ESQUELET_DE_CARREGA}</soc-de-poble>`), nom);
        assert.doesNotMatch(html, /Carregant el mur(?!\.\.\.<\/soc-de-poble>)|del poble/, nom);
      }
      // El text no és cap atribut ni cap canal: les dues eixides continuen conformes.
      bateria(declaracioDe(pagina), 'WordPress amb l’esquelet', { optIn: C.atributsOptIn });
      bateria(declaracioDe(eixida.referencia), 'WordPress (referència) amb l’esquelet');
    }
  });

  test('esquelet de càrrega amb el wptexturize de WordPress: els tres punts continuen ASCII dins de l’element; sense el plugin, eixirien com a &#8230;', ambWordpress, (t) => {
    const { html } = wordpress({}, t);
    // Com el render del bloc dins de the_content: text de l'autor abans i després.
    const contingut = `<p>Abans...</p>${html}<p>Després...</p>`;
    const sense = texturitza(contingut, false, t);
    assert.ok(sense.includes('>Carregant el mur&#8230;</soc-de-poble>'), 'control: sense el filtre, wptexturize el canvia');
    const amb = texturitza(contingut, true, t);
    assert.deepEqual(fillsDe(amb), [{ tipus: 'text', text: ESQUELET_DE_CARREGA }]);
    assert.ok(amb.includes(`>${ESQUELET_DE_CARREGA}</soc-de-poble>`));
    // Fora de l'element, wptexturize fa el de sempre.
    assert.ok(amb.startsWith('<p>Abans&#8230;</p>') && amb.endsWith('<p>Després&#8230;</p>'), amb);
  });

  test('A1 · amb un tenantId heretat a l’opció, WordPress no l’emet per cap canal: conforme, i sense cua', ambPhp, (t) => {
    const eixida = wordpress({ opcio: { nomPoble: 'Gent de Sella', poble: 'sella', tenantId: UUID_SINTETIC } }, t);
    const pagina = paginaDeWordpress(eixida);
    const decl = declaracioDe(pagina);
    const resultat = bateria(decl, 'WordPress amb una opció heretada', { optIn: C.atributsOptIn });
    assert.deepEqual(resultat.errors, []);
    assert.deepEqual(decl.global, { nomPoble: 'Gent de Sella', poble: 'sella' });
    // Cap cua: el configura() del nucli, que només es pot cridar una vegada, queda per a l'amfitrió.
    assert.equal(decl.cua, undefined);
    assert.deepEqual(eixida.inline.map((i) => i.posicio), ['before']);
    assert.doesNotMatch(eixida.inline[0].codi, /SocDePobleCua|configura/);
    assert.ok(!pagina.includes(UUID_SINTETIC), 'el tenant no apareix enlloc de la pàgina');
  });

  describe('A1 · l’opció heretada als Ajustos', () => {
    const MANIFEST = Object.freeze({
      schema: 'sdp.release.v1', producte: 'soc-de-poble', versio: '1.0.2',
      entrada: { cami: 'soc-de-poble.standalone.js', sha256: 'a'.repeat(64), integrity: `sha384-${'A'.repeat(64)}` },
      node: { origen: 'https://node.amfitrio.test', mode: 'remote', tenant: UUID_SINTETIC, desenvolupament: false }
    });

    test('la neteja esborra només tenantId i desa la resta tal qual; el sanejador ja no el conserva', ambPhp, (t) => {
      const opcio = { nomPoble: 'Gent de Sella', poble: 'sella', tenantId: UUID_SINTETIC, altra: 'clau-heretada' };
      const eixida = wordpress({ ajustos: true, opcio }, t);
      assert.deepEqual(eixida.desades, [['socdepoble_enxufe', { nomPoble: 'Gent de Sella', poble: 'sella', altra: 'clau-heretada' }]]);
      assert.deepEqual(eixida.sanejada, { nomPoble: 'Gent de Sella', poble: 'sella' });
    });

    test('sense tenantId, o amb una opció que no és un array, la neteja no escriu res', ambPhp, (t) => {
      for (const opcio of [{ nomPoble: 'Gent de Sella', poble: 'sella' }, {}, 'text']) {
        assert.deepEqual(wordpress({ ajustos: true, opcio }, t).desades, [], JSON.stringify(opcio));
      }
    });

    test('la diagnosi i el manifest local no porten cap tenant, encara que el paquet en porte un', ambPhp, (t) => {
      const eixida = wordpress({ ajustos: true, opcio: {}, manifest: MANIFEST }, t);
      assert.equal(eixida.diagnosi['Sealed data node'], 'https://node.amfitrio.test');
      assert.equal(eixida.diagnosi['App version'], '1.0.2');
      assert.ok(!JSON.stringify(eixida.diagnosi).includes(UUID_SINTETIC));
      assert.ok(!Object.keys(eixida.diagnosi).some((fila) => /tenant|scope/i.test(fila)));
      assert.deepEqual(Object.keys(eixida.manifest.node).sort(), ['desenvolupament', 'mode', 'origen']);
    });
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
