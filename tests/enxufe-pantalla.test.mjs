/** PHP real sobre el plugin i la plantilla; geometria CSS sobre l'HTML emés.
 * No carrega wp-config.php, cap BD ni el bundle real. La prova de navegador a
 * Studio continua sent necessària per a dvh, scroll i barra d'administració.
 * També el cicle que no es veu en una sola còpia: dues carpetes del plugin en
 * la mateixa petició (activació i desinstal·lació), la finestra de detalls
 * que es servix del readme, la plantilla de blocs, el .l10n.php executat i, com
 * en WordPress 5.8–6.4, el render del bloc i les traduccions sense
 * WP_Translation_Controller. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ARREL, 'wordpress-plugin');
const FIXTURE = path.join(ARREL, 'tests/fixtures/enxufe-pantalla.php');
const FIXTURE_DESINSTALLA = path.join(ARREL, 'tests/fixtures/enxufe-uninstall.php');
const FULLSCREEN = 'socdepoble-enxufe-pantalla-completa';
const CANVAS = '/wp/wp-includes/template-canvas.php';
// Carpeta que crea WordPress amb un zip sense arrel (class-wp-upgrader.php:378).
const NOVA = 'socdepoble-enxufe-v1.0.0-261001_0320';
/* El CSS que la plantilla PHP emetia abans de compartir-lo amb la de blocs:
   la via clàssica no pot canviar ni un caràcter (Llei del Píxel). */
const CSS_CLASSIC = '.socdepoble-enxufe-pantalla{margin:0;padding:0}'
  + '.socdepoble-enxufe-pantalla .socdepoble-enxufe{min-height:0;margin:0}'
  + '.admin-bar .socdepoble-enxufe{height:calc(100vh - 32px);height:calc(100dvh - 32px)}'
  + '@media screen and (max-width:782px){.admin-bar .socdepoble-enxufe{height:calc(100vh - 46px);height:calc(100dvh - 46px)}}';
/* La caixa de qualsevol inserció (marcatge.php): el visor sencer, amb un
   mínim de 32rem que mai passa del visor (Bloc 3.10, pla 261016_1530). */
const CSS_CAIXA = '.socdepoble-enxufe{display:block;height:100vh;height:100dvh;min-height:min(32rem,100vh);min-height:min(32rem,100dvh)}';

function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instal_lats = fs.existsSync(studio)
    ? fs.readdirSync(studio).sort().reverse().map(versio => path.join(studio, versio, 'php'))
    : [];
  return ['php', ...instal_lats].find(binari => spawnSync(binari, ['-v'], { timeout: 5000 }).status === 0);
}

const PHP = cercaPhp();
const OPCIONS = { skip: !PHP && 'PHP absent: instal·la PHP o indica PHP_BIN (també es detecta WordPress Studio).' };

function temporal(t) {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pantalla-'));
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  return carpeta;
}

/** Una còpia del plugin com la deixaria l'instal·lador, amb un bundle de mostra. */
function copiaPlugin(arrel, nom) {
  const plugin = path.join(arrel, nom);
  fs.mkdirSync(plugin);
  for (const rel of ['socdepoble-enxufe.php', 'uninstall.php', 'readme.txt', 'includes', 'templates', 'languages']) {
    fs.cpSync(path.join(PLUGIN, rel), path.join(plugin, rel), { recursive: true });
  }
  fs.mkdirSync(path.join(plugin, 'dist'));
  fs.writeFileSync(path.join(plugin, 'dist/soc-de-poble.standalone.js'), '// fixture\n');
  return plugin;
}

function php(fixture, carpetes, cas) {
  const resultat = spawnSync(PHP, [fixture, ...carpetes], {
    encoding: 'utf8', input: JSON.stringify(cas), timeout: 10000
  });
  assert.equal(resultat.status, 0, resultat.error?.message || resultat.stderr || resultat.stdout);
  assert.equal(resultat.stderr, '');
  return JSON.parse(resultat.stdout);
}

function executa(t, cas, carpetes = ['socdepoble-enxufe']) {
  const arrel = temporal(t);
  const plugins = carpetes.map((nom) => copiaPlugin(arrel, nom));
  return { ...php(FIXTURE, plugins, cas), plugin: plugins[0], plugins };
}

test('pantalla completa: el selector només substituïx una pàgina que l’ha triada', OPCIONS, t => {
  for (const cas of [
    {},
    { plantilla: 'pagina.php' },
    { plantilla: FULLSCREEN, pagina: false },
    { plantilla: FULLSCREEN, id: 0 }
  ]) {
    assert.equal(executa(t, cas).plantilla, '/tema/pagina.php', JSON.stringify(cas));
  }
  const seleccionada = executa(t, { plantilla: FULLSCREEN });
  assert.equal(seleccionada.plantilla, fs.realpathSync(path.join(seleccionada.plugin, 'templates/pantalla-completa.php')));
  assert.equal(seleccionada.plantilles['pagina.php'], 'Tema');
  assert.ok(seleccionada.plantilles[FULLSCREEN]);
});

test('pantalla completa: conserva hooks i contingut, dos instàncies compartixen bundle i declaració', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true, instancies: 2 });
  assert.deepEqual(resultat.events, ['head', 'body_open', 'content', 'footer']);
  assert.equal(resultat.declaracions, 1);
  assert.equal(resultat.scripts.length, 1);
  const dom = new JSDOM(resultat.html);
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  assert.ok(doc.head.querySelector('meta[name="fixture-head"]'));
  assert.equal(doc.body.firstElementChild.dataset.hook, 'body-open');
  assert.equal(doc.body.lastElementChild.dataset.hook, 'footer');
  assert.equal(doc.querySelectorAll('soc-de-poble').length, 2);
  assert.equal(doc.querySelectorAll('script[src]').length, 1);
  assert.ok(doc.querySelector('script:not([src])').textContent.includes('window.SocDePobleConfig'));
  assert.equal(doc.querySelector('script[src]').previousElementSibling.tagName, 'SCRIPT');
});

test('pantalla completa: delega el contingut protegit a WordPress sense llegir el cos cru', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true, protegit: true });
  assert.deepEqual(resultat.events, ['head', 'body_open', 'content', 'footer']);
  assert.ok(resultat.html.includes('post-password-form'));
  assert.ok(!resultat.html.includes('CONTINGUT_PROTEGIT_NO_PUBLICABLE'));
  assert.deepEqual(resultat.scripts, []);
  assert.equal(resultat.declaracions, 0);
});

test('pantalla completa: la caixa pot baixar de 32rem sense alterar les insercions ordinàries', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true });
  const dom = new JSDOM(resultat.html);
  t.after(() => dom.window.close());
  const { document, getComputedStyle } = dom.window;
  const caixa = document.querySelector('.socdepoble-enxufe');
  assert.equal(parseFloat(getComputedStyle(caixa).minHeight), 0, 'el mínim no pot superar el viewport curt');
  for (const costat of ['Top', 'Right', 'Bottom', 'Left']) {
    assert.equal(parseFloat(getComputedStyle(caixa)[`margin${costat}`]), 0);
    assert.equal(parseFloat(getComputedStyle(document.body)[`margin${costat}`]), 0);
    assert.equal(parseFloat(getComputedStyle(document.body)[`padding${costat}`]), 0);
  }
  document.body.className = '';
  /* Bloc 3.10 (pla 261016_1530) · Fora de la plantilla completa el mínim
     continua sent 32rem, però mai més alt que el visor: en un mòbil en
     horitzontal la caixa ja no sobreïx. Abans esta prova fixava «32rem» sol;
     ara fixa el mínim nou, a posta (jsdom resol l'última declaració). */
  assert.equal(getComputedStyle(caixa).minHeight, 'min(32rem,100dvh)', 'l’override pertany només a la plantilla completa');
  assert.ok(resultat.estils.includes(CSS_CAIXA), 'la caixa ordinària: vh primer per a la base canònica, després dvh');
});

test('pantalla completa clàssica: el CSS compartit és, caràcter a caràcter, el de sempre', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true });
  assert.equal(resultat.estils.filter((css) => css === CSS_CLASSIC).length, 1);
  assert.ok(!resultat.estils.join('').includes('wp-site-blocks'), 'la regla del canvas és només per als temes de blocs');
});

test('pantalla completa amb tema de blocs: respecta template-canvas si la plantilla resolta és la nostra', OPCIONS, t => {
  const nostra = executa(t, { plantilla: FULLSCREEN, entrada: CANVAS, plantilla_actual: `twentytwentyfive//${FULLSCREEN}` });
  assert.equal(nostra.plantilla, CANVAS, 'les edicions de l’Editor del lloc es respecten');
  assert.deepEqual(nostra.classes, ['socdepoble-enxufe-pantalla']);
  assert.ok(nostra.estils.includes(CSS_CLASSIC), 'la mateixa pell que la plantilla PHP');
  assert.ok(nostra.estils.includes('.socdepoble-enxufe-pantalla .wp-site-blocks{padding:0}'));
  assert.ok(nostra.cua_estils.includes('socdepoble'));

  // WordPress 6.5 i 6.6: el canvas pinta la page.html del tema, no la nostra.
  const aliena = executa(t, { plantilla: FULLSCREEN, entrada: CANVAS, plantilla_actual: 'twentytwentyfive//page' });
  assert.equal(aliena.plantilla, fs.realpathSync(path.join(aliena.plugin, 'templates/pantalla-completa.php')));
  assert.deepEqual(aliena.classes, []);

  // Una pàgina que no l'ha triada no rep cap pell encara que l'id case.
  const altra = executa(t, { plantilla: 'page', entrada: CANVAS, plantilla_actual: `twentytwentyfive//${FULLSCREEN}` });
  assert.equal(altra.plantilla, CANVAS);
  assert.deepEqual(altra.classes, []);
  assert.ok(!altra.estils.includes(CSS_CLASSIC));
});

test('plantilla de blocs: mateix slug que l’opció clàssica, només pàgines, i el contingut de la pàgina dins de <main>', OPCIONS, t => {
  const amb = executa(t, { mode: 'blocs', registre_blocs: true });
  assert.ok(amb.init.includes('socdepoble_enxufe_registra_plantilla_blocs'), 'es registra a init');
  const nom = `socdepoble//${FULLSCREEN}`;
  assert.deepEqual(Object.keys(amb.plantilles), [nom]);
  assert.match(nom, /^[a-z0-9_-]+\/\/[a-z0-9_-]+$/, 'el patró que exigix WP_Block_Templates_Registry');
  const args = amb.plantilles[nom];
  assert.deepEqual(args.post_types, ['page'], 'sense post_types, get_by_query l’exclou del selector de pàgines');
  assert.equal(args.title, executa(t, {}).plantilles[FULLSCREEN], 'el mateix títol que a la llista clàssica');
  assert.ok(args.description.length > 0);
  assert.equal(args.content, '<!-- wp:group {"tagName":"main","align":"full","layout":{"type":"default"}} -->'
    + '<main class="wp-block-group alignfull"><!-- wp:post-content {"layout":{"type":"default"}} /--></main>'
    + '<!-- /wp:group -->');

  const sense = executa(t, { mode: 'blocs' });
  assert.deepEqual(sense.plantilles, [], 'WordPress 6.5 i 6.6: sense register_block_template no es crida res');
});

test('doble còpia al sandbox d’activació: la segona no peta i el ganxo d’activació la refusa nomenant les dues carpetes', OPCIONS, t => {
  for (const carpetes of [['socdepoble-enxufe', NOVA], [NOVA, 'socdepoble-enxufe']]) {
    const resultat = executa(t, { mode: 'doble', sandbox: true, capacitats: ['activate_plugins'] }, carpetes);
    const [carregada, nova] = resultat.plugins.map((p) => fs.realpathSync(p));
    assert.equal(resultat.fitxer, path.join(carregada, 'socdepoble-enxufe.php'), 'les constants continuen sent de la primera còpia');
    assert.ok(resultat.activacions.includes(`${carpetes[1]}/socdepoble-enxufe.php`), 'ganxo d’activació de la segona còpia');
    assert.ok(resultat.mort, 'wp_die abans que WordPress l’afija a active_plugins');
    assert.ok(resultat.mort.missatge.includes(carregada) && resultat.mort.missatge.includes(nova), resultat.mort.missatge);
    assert.deepEqual(resultat.mort.args, { back_link: true });
    assert.equal(resultat.mort.titol, 'Sóc de Poble — Enxufe');
    assert.ok(resultat.avis.includes(carregada) && resultat.avis.includes(nova));
  }
});

test('doble còpia fora del sandbox: la segona no carrega res, no toca l’activació i avisa només qui pot activar extensions', OPCIONS, t => {
  const admin = executa(t, { mode: 'doble', capacitats: ['activate_plugins'] }, ['socdepoble-enxufe', NOVA]);
  const [carregada, nova] = admin.plugins.map((p) => fs.realpathSync(p));
  assert.equal(admin.mort, null);
  assert.ok(!admin.activacions.includes(`${NOVA}/socdepoble-enxufe.php`));
  assert.equal(admin.avisos, 1);
  assert.match(admin.avis, /^<div class="notice notice-error"><p>[^<]+<\/p><\/div>$/);
  assert.ok(admin.avis.includes(carregada) && admin.avis.includes(nova));

  const editor = executa(t, { mode: 'doble', capacitats: ['edit_posts'] }, ['socdepoble-enxufe', NOVA]);
  assert.equal(editor.avis, '');
});

test('doble còpia, controls negatius: sense la guarda, o amb una funció al fitxer principal, la segona còpia peta', OPCIONS, t => {
  const peta = (transforma) => {
    const arrel = temporal(t);
    const plugins = ['socdepoble-enxufe', NOVA].map((nom) => copiaPlugin(arrel, nom));
    const principal = path.join(plugins[1], 'socdepoble-enxufe.php');
    const text = fs.readFileSync(principal, 'utf8');
    const canviat = transforma(text);
    assert.notEqual(canviat, text, 'el fitxer principal té la forma que la prova espera');
    fs.writeFileSync(principal, canviat);
    const resultat = spawnSync(PHP, [FIXTURE, ...plugins], { encoding: 'utf8', input: JSON.stringify({ mode: 'doble' }), timeout: 10000 });
    assert.notEqual(resultat.status, 0);
    return resultat.stdout + resultat.stderr;
  };
  assert.match(peta((text) => text.replace(/^if \( defined\( 'SOCDEPOBLE_ENXUFE_FITXER' \) \) \{\n[^]*?\n\treturn;\n\}\n/m, '')), /already defined/);
  /* El fatal del lloc: PHP vincula la funció en compilar el fitxer, abans
     d'executar la guarda, i la primera còpia ja l'ha declarada (idioma.php). */
  assert.match(peta((text) => text.replace("defined( 'ABSPATH' ) || exit;\n", "defined( 'ABSPATH' ) || exit;\nfunction socdepoble_enxufe_carrega_traduccions() {}\n")), /Cannot redeclare/);
});

/* L'administració de xarxa només carrega els plugins de xarxa i els del lloc
   principal (wp-settings.php): una còpia activa només al lloc 2 no hi entra i
   la guarda no la veu. Si l'activació passara, a cada petició del lloc 2 esta
   còpia, de xarxa, carregaria primer, i la vella, sense guarda, faria el fatal
   del control negatiu de dalt. */
test('activació a tota la xarxa amb una altra còpia activa en un lloc secundari: la refusa nomenant les dues carpetes, abans de cap altre ganxo', OPCIONS, t => {
  const VELLA = 'wordpress-plugin/socdepoble-enxufe.php';
  const xarxa = (cas) => executa(t, { mode: 'xarxa', multisite: true, de_xarxa: true, ...cas }, [NOVA]);

  const refusada = xarxa({ actius: { 1: ['akismet/akismet.php'], 2: [VELLA] } });
  assert.ok(refusada.mort, 'wp_die abans que WordPress l’afija a active_sitewide_plugins');
  assert.ok(refusada.mort.missatge.includes(path.join(path.dirname(refusada.plugin), 'wordpress-plugin')), refusada.mort.missatge);
  assert.ok(refusada.mort.missatge.includes(fs.realpathSync(refusada.plugin)), refusada.mort.missatge);
  assert.deepEqual(refusada.mort.args, { back_link: true });
  assert.equal(refusada.mort.titol, 'Sóc de Poble — Enxufe');
  assert.deepEqual(refusada.transients, [], 'cap altre ganxo d’activació s’executa abans del refús');

  const deXarxa = xarxa({ actius: { 1: [] }, xarxa: { 'socdepoble-enxufe/socdepoble-enxufe.php': 1790000000 } });
  assert.notEqual(deXarxa.mort, null, 'una altra còpia ja activa a tota la xarxa');

  // La mateixa carpeta activa en un lloc i ara a tota la xarxa no és cap segona còpia.
  const mateixa = xarxa({ actius: { 1: [], 2: [`${NOVA}/socdepoble-enxufe.php`, 'foo/no-socdepoble-enxufe.php'] } });
  assert.equal(mateixa.mort, null);
  assert.deepEqual(mateixa.transients, ['update_plugins'], 'l’activació continua amb el ganxo de l’actualitzador');

  /* En un sol lloc, l'altra còpia d'eixe lloc o de la xarxa es carrega en la
     mateixa petició i la refusa la guarda; la d'un altre lloc no hi coincidix mai. */
  assert.equal(xarxa({ de_xarxa: false, actius: { 1: [], 2: [VELLA] } }).mort, null);
});

test('readme: «Mostra els detalls» servix les seccions reals, escapades, i els requisits de les capçaleres', OPCIONS, t => {
  const { seccions, info, aliena } = executa(t, { mode: 'readme' });
  assert.equal(aliena, false, 'un altre slug passa intacte');
  for (const clau of ['description', 'installation', 'faq', 'changelog']) assert.ok(seccions[clau]?.length > 0, clau);
  assert.deepEqual(Object.keys(info.sections), ['description', 'installation', 'faq', 'changelog']);
  const { description, installation, faq, changelog } = info.sections;
  assert.ok(changelog.includes('<h4>1.0.0</h4><ul><li>First stable release.</li>'));
  assert.ok(!changelog.includes('No release notes published.'), 'el readme ja porta les notes');
  assert.ok(description.includes('<h4>External services</h4>'), 'les seccions desconegudes van a la descripció, com a WordPress.org');
  assert.ok(description.includes('<code>&lt;soc-de-poble&gt;</code>'));
  assert.ok(description.includes('<a href="https://socdepoble.org">https://socdepoble.org</a>.'), 'la puntuació final queda fora de l’enllaç');
  assert.ok(installation.startsWith('<ol><li>'));
  assert.ok(faq.includes('<h4>The plugin is installed twice. What should I do?</h4>'));
  const tot = Object.values(info.sections).join('');
  assert.ok(!tot.includes('a clear refusal instead'), 'Upgrade Notice no és cap secció');
  for (const etiqueta of tot.match(/<[^>]*>/g)) {
    assert.match(etiqueta, /^<(?:\/?(?:p|h4|ul|ol|li|code|a)|a href="https:\/\/[^"<>\s]+")>$/, `etiqueta inesperada: ${etiqueta}`);
  }

  const capcalera = (fitxer, nom) => fs.readFileSync(path.join(PLUGIN, fitxer), 'utf8').match(new RegExp(`^[ \\t/*#@]*${nom}:[ \\t]*(.+?)[ \\t]*$`, 'mi'))[1];
  assert.equal(info.requires, capcalera('socdepoble-enxufe.php', 'Requires at least'));
  assert.equal(info.requires_php, capcalera('socdepoble-enxufe.php', 'Requires PHP'));
  assert.equal(info.tested, capcalera('readme.txt', 'Tested up to'));
  assert.equal(info.version, capcalera('socdepoble-enxufe.php', 'Version'));
  assert.equal(info.download_link, '', 'sense canal verificat no hi ha res descarregable');
});

test('readme: l’analitzador escapa abans de transformar i només enllaça https', OPCIONS, t => {
  const { html } = executa(t, {
    mode: 'readme',
    linies: [
      '= <b>Títol</b> =',
      '<script>alert(1)</script>',
      '',
      '* <img src=x onerror=alert(1)>',
      '* `<soc-de-poble>` i "https://x.example/"',
      '',
      'javascript:alert(1), http://insegur.example i https://ok.example/a?b=1&c=2.'
    ]
  });
  assert.ok(!/<(?:script|img|b)\b/i.test(html), html);
  assert.ok(html.startsWith('<h4>&lt;b&gt;Títol&lt;/b&gt;</h4><p>&lt;script&gt;'));
  assert.ok(html.includes('<ul><li>&lt;img src=x onerror=alert(1)&gt;</li><li><code>&lt;soc-de-poble&gt;</code>'));
  assert.ok(html.includes('&quot;<a href="https://x.example/">https://x.example/</a>&quot;'), 'l’enllaç acaba abans de la cometa escapada');
  assert.ok(html.includes('<a href="https://ok.example/a?b=1&amp;c=2">https://ok.example/a?b=1&amp;c=2</a>.'));
  assert.equal(html.match(/<a /g).length, 2, 'ni javascript: ni http:// esdevenen enllaços');
});

/* WP-09 (auditoria 261025) · el fitxer que WordPress carrega per al text domain
   'socdepoble', no el de la identitat vella (socdepoble-enxufe-ca.l10n.php,
   domini 'socdepoble-enxufe'), que cap WordPress no llig. */
test('la traducció valenciana s’executa amb PHP i té la forma .l10n.php de WordPress', OPCIONS, t => {
  const l10n = executa(t, { mode: 'l10n' });
  assert.equal(l10n.domain, 'socdepoble');
  assert.equal(l10n.language, 'ca');
  assert.match(l10n['plural-forms'], /^nplurals=2; plural=/);
  const valors = Object.values(l10n.messages);
  assert.ok(valors.length > 50);
  assert.ok(valors.every((v) => typeof v === 'string' && v.trim() !== ''), 'cap traducció buida');
  // La prova i18n llig el fitxer per regex: ha de veure cada clau que torna PHP.
  const text = fs.readFileSync(path.join(PLUGIN, 'languages/socdepoble-ca.l10n.php'), 'utf8');
  const perRegex = [...text.matchAll(/^\t\t'((?:[^'\\]|\\.)*)' => '/gm)].length;
  assert.equal(Object.keys(l10n.messages).filter((clau) => !clau.includes('\u0004')).length, perRegex);
});

/* ───────────── WordPress 5.8 a 6.4: el bloc i les traduccions (WP-02, WP-03) ───────────── */

test('bloc a WordPress 5.8–6.0: el render_callback pinta el marcatge universal sense el camp "render" de block.json, i render.php dona el mateix', OPCIONS, t => {
  const atributs = { nomPoble: 'Penàguila', poble: 'penaguila', rutaInicial: '/mur' };
  const bloc = executa(t, { mode: 'bloc', atributs }, ['socdepoble']);
  assert.equal(bloc.cami, path.join(fs.realpathSync(bloc.plugin), 'includes/bloc'), 'el registre per la ruta de block.json (5.8+)');
  assert.equal(bloc.callback, 'socdepoble_enxufe_render_bloc', 'sense render_callback, de la 5.8 a la 6.0 el bloc ix buit');
  assert.ok(bloc.html, 'el render_callback pinta alguna cosa');
  assert.equal(bloc.render_php, bloc.html, 'el camp "render" (6.1+) i el render_callback, el mateix marcatge');
  const dom = new JSDOM(bloc.html);
  t.after(() => dom.window.close());
  const caixa = dom.window.document.body.firstElementChild;
  assert.deepEqual([...caixa.classList], ['wp-block-socdepoble-app', 'socdepoble-enxufe']);
  const element = caixa.querySelector('soc-de-poble');
  assert.equal(element.getAttribute('nom-poble'), 'Penàguila');
  assert.equal(element.getAttribute('poble'), 'penaguila');
  assert.equal(element.getAttribute('ruta-inicial'), '/mur');
  assert.deepEqual(bloc.kses, [['div', 'p', 'soc-de-poble'], ['div', 'p', 'soc-de-poble']], 'cada render passa per wp_kses amb la llista del marcatge');
  assert.deepEqual(bloc.scripts, ['socdepoble'], 'el bloc encua el bundle, com el shortcode');
  assert.deepEqual(bloc.shortcodes, { socdepoble_app: 'socdepoble_enxufe_shortcode' });
  assert.deepEqual(bloc.traduccions, [['socdepoble-app-editor-script', 'socdepoble', `${fs.realpathSync(bloc.plugin)}/languages`]]);
});

const escapa = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

test('traduccions a WordPress 5.8–6.4: sense WP_Translation_Controller, el .l10n.php es servix pels filtres gettext, també per a ca_valencia', OPCIONS, t => {
  const { messages } = executa(t, { mode: 'l10n' });
  const TEXT_BLOC = 'Embeds the Sóc de Poble app with the universal host markup.';
  const DESCRIPCIO = `block description\u0004${TEXT_BLOC}`;
  assert.ok(messages['Village name'] && messages['Sóc de Poble · full screen'] && messages[DESCRIPCIO], 'els textos de la prova són al catàleg');

  for (const llengua of ['ca', 'ca_valencia']) {
    const resultat = executa(t, { mode: 'idioma', llengua }, ['socdepoble']);
    assert.deepEqual(resultat.textdomains, [['socdepoble', 'socdepoble/languages']], 'primer, load_plugin_textdomain de sempre');
    assert.equal(resultat.text, messages['Village name'], llengua);
    assert.equal(resultat.escapat, escapa(messages['Sóc de Poble · full screen']), `${llengua}: esc_html__ també`);
    assert.equal(resultat.context, messages[DESCRIPCIO], `${llengua}: les dades del bloc, amb context`);
    assert.equal(resultat.desconegut, 'A text that is not in the catalogue');
    assert.equal(resultat.altre, 'Village name', 'un altre text domain no es toca');
  }

  // De la 6.5 ençà ho fa WordPress, i també si un paquet ja ha carregat el domini.
  for (const cas of [{ controlador: true }, { carregat: true }, { llengua: 'es_ES' }, { llengua: 'ca', plugin_locale: 'es_ES' }]) {
    assert.equal(executa(t, { mode: 'idioma', ...cas }, ['socdepoble']).text, 'Village name', JSON.stringify(cas));
  }
  // La llengua del plugin és la de plugin_locale, com a load_plugin_textdomain.
  assert.equal(executa(t, { mode: 'idioma', llengua: 'es_ES', plugin_locale: 'ca' }, ['socdepoble']).text, messages['Village name']);

  // Un filtre gettext general (un tema, Say What?) va abans i mana, com amb un .mo de veritat.
  const canviat = executa(t, { mode: 'idioma', llengua: 'ca', canvia: { 'Village name': 'Municipi', [TEXT_BLOC]: 'Una altra descripció' } }, ['socdepoble']);
  assert.equal(canviat.text, 'Municipi');
  assert.equal(canviat.context, 'Una altra descripció');
  assert.equal(canviat.escapat, escapa(messages['Sóc de Poble · full screen']), 'la resta, del catàleg');

  /* Sense el pegat de la 6.2.1, wp_lang arriba sense sanejar, i include resol
     els «..» sobre el text de la ruta. is_readable() en POSIX ja para
     «/../socdepoble-ca» (la carpeta languages/socdepoble- no existix), però no
     «x/../socdepoble-ca» si languages/socdepoble-x/ existix: només la guarda
     del codi de llengua ho para. */
  const arrel = temporal(t);
  const plugin = copiaPlugin(arrel, 'socdepoble');
  fs.mkdirSync(path.join(plugin, 'languages/socdepoble-x'));
  for (const llengua of ['/../socdepoble-ca', 'x/../socdepoble-ca']) {
    assert.equal(php(FIXTURE, [plugin], { mode: 'idioma', llengua }).text, 'Village name', llengua);
  }
});

test('ca_valencia («Català (Valencià)») fa servir els fitxers de ca, si no en té de propis, en qualsevol versió', OPCIONS, t => {
  const valencia = executa(t, { mode: 'idioma', llengua: 'ca_valencia', controlador: true }, ['socdepoble']);
  const llengues = path.join(fs.realpathSync(valencia.plugin), 'languages');
  // Des de la 6.5, WordPress prova primer el .l10n.php germà del .mo que li torna el filtre.
  assert.equal(valencia.mo, path.join(llengues, 'socdepoble-ca.mo'));
  assert.ok(fs.existsSync(path.join(llengues, 'socdepoble-ca.l10n.php')));
  assert.equal(valencia.json, path.join(llengues, 'socdepoble-ca-socdepoble-app-editor-script.json'), 'l’editor del bloc');
  assert.ok(fs.existsSync(valencia.json));
  assert.equal(valencia.mo_altre, path.join(llengues, 'socdepoble-ca_valencia.mo'), 'un altre text domain no es toca');

  for (const llengua of ['ca', 'es_ES']) {
    assert.equal(path.basename(executa(t, { mode: 'idioma', llengua, controlador: true }, ['socdepoble']).mo), `socdepoble-${llengua}.mo`, llengua);
  }

  // Amb una traducció pròpia de ca_valencia (translate.wordpress.org), WordPress carrega la seua.
  const arrel = temporal(t);
  const plugin = copiaPlugin(arrel, 'socdepoble');
  for (const [de, a] of [['socdepoble-ca.l10n.php', 'socdepoble-ca_valencia.l10n.php'], ['socdepoble-ca-socdepoble-app-editor-script.json', 'socdepoble-ca_valencia-socdepoble-app-editor-script.json']]) {
    fs.copyFileSync(path.join(plugin, 'languages', de), path.join(plugin, 'languages', a));
  }
  const propia = php(FIXTURE, [plugin], { mode: 'idioma', llengua: 'ca_valencia', controlador: true });
  assert.equal(path.basename(propia.mo), 'socdepoble-ca_valencia.mo');
  assert.equal(path.basename(propia.json), 'socdepoble-ca_valencia-socdepoble-app-editor-script.json');
});

/* ─────────────── Desinstal·lació amb una altra còpia del plugin ─────────────── */

function desinstalla(t, cas, carpetes = [NOVA]) {
  const arrel = temporal(t);
  // Només el que WordPress inclou: uninstall.php i, des d'ell, includes/copies.php.
  const plugins = carpetes.map((nom) => {
    const plugin = path.join(arrel, nom);
    fs.mkdirSync(path.join(plugin, 'includes'), { recursive: true });
    for (const rel of ['uninstall.php', 'includes/copies.php']) fs.copyFileSync(path.join(PLUGIN, rel), path.join(plugin, rel));
    return plugin;
  });
  return php(FIXTURE_DESINSTALLA, plugins, { plugin: `${carpetes[0]}/socdepoble-enxufe.php`, ...cas }).esborrats;
}

test('desinstal·lació: sense cap altra còpia activa esborra les opcions del plugin i res més', OPCIONS, t => {
  const esborrats = desinstalla(t, { actius: { 1: ['akismet/akismet.php', 'foo/no-socdepoble-enxufe.php', `${NOVA}/socdepoble-enxufe.php`] } });
  assert.deepEqual(esborrats, ['1:socdepoble_enxufe', '1:sdp_traduccio_pressupost', '1:sdp_traduccio_lock', '1:SQL', '1:socdepoble_enxufe_canal']);

  const xarxa = desinstalla(t, { multisite: true, actius: { 1: [], 2: ['akismet/akismet.php'] } });
  assert.ok(xarxa.includes('1:socdepoble_enxufe') && xarxa.includes('2:socdepoble_enxufe') && xarxa.includes('xarxa:socdepoble_enxufe_canal'));
});

test('desinstal·lació: una altra còpia activa (lloc, un altre lloc de la xarxa o tota la xarxa) conserva les opcions compartides', OPCIONS, t => {
  assert.deepEqual(desinstalla(t, { actius: { 1: ['socdepoble-enxufe/socdepoble-enxufe.php'] } }), []);
  assert.deepEqual(desinstalla(t, { multisite: true, actius: { 1: [], 2: ['wordpress-plugin/socdepoble-enxufe.php'] } }), []);
  assert.deepEqual(desinstalla(t, { multisite: true, actius: { 1: [] }, xarxa: { 'socdepoble-enxufe/socdepoble-enxufe.php': 1790000000 } }), []);
});

test('desinstal·lació: esborrar dues còpies en la mateixa petició no acaba en «Cannot redeclare»', OPCIONS, t => {
  const esborrats = desinstalla(t, { actius: { 1: [] } }, [NOVA, 'socdepoble-enxufe']);
  assert.equal(esborrats.filter((e) => e === '1:socdepoble_enxufe').length, 2);
});
