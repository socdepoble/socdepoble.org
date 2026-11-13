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
    // P1-09 (B10-ESCOMBRADA) · el nom visible és «Sóc de Poble», sense «Enxufe», al títol, al missatge i a l'avís.
    assert.equal(resultat.mort.titol, 'Sóc de Poble');
    assert.ok(resultat.mort.missatge.startsWith('Sóc de Poble is already active from the folder '), resultat.mort.missatge);
    assert.ok(resultat.avis.includes('<p>Sóc de Poble is installed twice and both copies are active.'), resultat.avis);
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
     d'executar la guarda, i la primera còpia ja l'ha declarada (idioma-local.php). */
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
  assert.equal(refusada.mort.titol, 'Sóc de Poble');
  assert.ok(refusada.mort.missatge.startsWith('Sóc de Poble is already active from the folder '), refusada.mort.missatge);
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
  /* T5.3 (261101) · El readme és el valencià publicat a WordPress.org (1.1.10): el registre
     comença per la 1.1.10 (la 1.0.0 ja no hi és), la instal·lació porta un títol davant de la
     llista i les preguntes són les publicades.
     T8 · D-11 (pla 261101_1246) · El registre comença per la 1.1.11, amb la negreta del readme
     ja feta etiqueta, i la 1.1.10 publicada continua darrere com a història. */
  // O6: entrega nova; les entrades1.1.11i1.1.10 es mantenen íntegres.
  /* Onada R21 (v1.2.0) · La 1.1.13 obri el registre amb la negreta del readme ja feta etiqueta, i la 1.1.12
     publicada continua darrere com a història, íntegra. */
  /* Onada R21 (COMMIT 5; v1.2.0 build 5) · La 1.1.14 obri el registre amb la negreta feta etiqueta, i la 1.1.13
     continua darrere, íntegra, com a història. */
  assert.ok(changelog.startsWith('<h4>1.1.14</h4><ul><li><strong>Visor al dia:</strong> el paquet porta el visor compilat'), 'R21 COMMIT 5: la 1.1.14 obri el registre');
  assert.ok(changelog.includes('</ul><h4>1.1.13</h4><ul><li><strong>Traductor més protegit:</strong> el servei de traducció del lloc'), 'R21: la 1.1.13 es queda al registre');
  assert.ok(changelog.includes('</ul><h4>1.1.12</h4><p>Cinc idiomes integrats als ajustos'), 'O6: l’entrega 1.1.12 amb text editorial es conserva');
  assert.ok(changelog.includes('<h4>1.1.11</h4><ul><li><strong>«Mostra els detalls» com a WordPress.org:</strong> la finestra'), 'la història1.1.11 i el seu format es conserven');
  assert.ok(changelog.includes('</ul><h4>1.1.10</h4><ul><li>'), 'la 1.1.10 publicada es queda al registre');
  assert.ok(!changelog.includes('No release notes published.'), 'el readme ja porta les notes');
  assert.ok(description.includes('<h4>External services</h4>'), 'les seccions desconegudes van a la descripció, com a WordPress.org');
  assert.ok(description.includes('<code>&lt;soc-de-poble&gt;</code>'));
  assert.ok(description.includes('<a href="https://socdepoble.org">https://socdepoble.org</a>.'), 'la puntuació final queda fora de l’enllaç');
  assert.ok(installation.startsWith('<h4>Com posar Sóc de Poble a la teua web en 3 passos molt fàcils</h4><ol><li>'));
  assert.ok(faq.includes('<h4>Quin codi he de posar exactament a la meua pàgina: un o dos?</h4>'));
  const tot = Object.values(info.sections).join('');
  assert.ok(!tot.includes('galeria de 10 captures'), 'Upgrade Notice no és cap secció');
  assert.ok(!tot.includes('Vista real del sistema'), 'Screenshots tampoc: les captures només les mostra WordPress.org');
  for (const etiqueta of tot.match(/<[^>]*>/g)) {
    assert.match(etiqueta, /^<(?:\/?(?:p|h4|ul|ol|li|code|a|strong|em)|a href="https:\/\/[^"<>\s]+")>$/, `etiqueta inesperada: ${etiqueta}`);
  }
  /* P2-wp-petits (261101) · La 1.1.10 publicada mostrava literals els ** i * del readme, i cada
     pas numerat tornava a començar per «1.» (wp_kses de plugin-install.php no deixa passar start). */
  for (const [clau, html] of Object.entries(info.sections)) {
    assert.doesNotMatch(html, /\*\*|(?<![*\w])\*[^*\s]/, `${clau}: cap marca de negreta o cursiva crua`);
    const obertes = [];
    for (const [, tanca, nom] of html.matchAll(/<(\/?)([a-z0-9]+)[^>]*>/g)) {
      if (!tanca) obertes.push(nom);
      else assert.equal(obertes.pop(), nom, `${clau}: </${nom}> tanca una altra etiqueta`);
    }
    assert.deepEqual(obertes, [], `${clau}: cap etiqueta sense tancar`);
  }
  assert.ok(description.includes('<strong>') && description.includes('<em>'));
  assert.equal(installation.match(/<ol>/g).length, 1, 'els tres passos són una sola llista numerada');
  assert.ok(installation.includes('<ol><li><strong>Pas 1 · Instal·la el connector i configura el teu poble:</strong><ul><li>Instal·la i activa <strong>Sóc de Poble. Portal de Pobles Connectats</strong> des de <strong>Complements ➔ Afegir complement</strong>.</li>'), 'les etiquetes de WordPress són les del locale ca_valencia (E-03)');
  assert.match(installation, /<\/ul><\/li><li><strong>Pas 2 · [^<]+<\/strong><ul><li><strong>Manera A [^<]+<\/strong> Ves a /, 'la subllista dins del pas, i la línia sagnada continua la seua vinyeta');
  assert.match(installation, /<\/ul><\/li><li><strong>Pas 3 · [^<]+<\/strong><ul><li>/);
  assert.ok(installation.includes('<li>Per obrir directament al <strong>Xat del poble</strong> (entrada per defecte): <code>[socdepoble_app poble=&quot;la-torre-de-les-macanes&quot; ruta_inicial=&quot;/xat&quot;]</code></li><li>Per obrir'), 'el codi va a la mateixa línia del seu text: una sola llista, i WordPress.org no el convertix en un bloc pla (E-02)');
  assert.ok(installation.includes('i pega <strong>un sol</strong> codi com este: <code>[socdepoble_app poble=&quot;la-torre-de-les-macanes&quot;]</code> <em>(Nota:'), 'el codi de la Manera A, dins de la seua línia');

  const capcalera = (fitxer, nom) => fs.readFileSync(path.join(PLUGIN, fitxer), 'utf8').match(new RegExp(`^[ \\t/*#@]*${nom}:[ \\t]*(.+?)[ \\t]*$`, 'mi'))[1];
  assert.equal(info.requires, capcalera('socdepoble-enxufe.php', 'Requires at least'));
  assert.equal(info.requires_php, capcalera('socdepoble-enxufe.php', 'Requires PHP'));
  assert.equal(info.tested, capcalera('readme.txt', 'Tested up to'));
  assert.equal(info.version, capcalera('socdepoble-enxufe.php', 'Version'));
  assert.equal(info.download_link, '', 'sense canal verificat no hi ha res descarregable');
  assert.equal(info.name, 'Sóc de Poble', 'P1-09 · «Mostra els detalls» porta el nom visible, sense «Enxufe»');
});

/* P2-wp-petits (261101) · L'analitzador del readme de «Mostra els detalls» es carrega sol, amb els
   dobles mínims dels ganxos i un esc_html com el de WordPress, i sense JIT de PCRE, perquè un patró
   que reculara de manera quadràtica es notara.
   Gauntlet 2 · 261101 · Y-WordPress (G2-P03) · N'hi ha un de sol: el d'ajustos.php, que el fitxer
   principal carrega sempre i abans d'actualitzador.php. El canal propi (seccions_readme) el
   reutilitza, i l'arnés carrega els dos fitxers per a comprovar-ho de punta a punta. */
const ARNES_README = String.raw`
define( 'ABSPATH', '/' );
define( 'SOCDEPOBLE_ENXUFE_FITXER', $argv[1] . '/socdepoble-enxufe.php' );
function add_filter() {}
function add_action() {}
function register_activation_hook() {}
function plugin_basename( $fitxer ) { return basename( dirname( $fitxer ) ) . '/' . basename( $fitxer ); }
function plugin_dir_path( $fitxer ) { return dirname( $fitxer ) . '/'; }
function esc_html( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8', false ); }
require $argv[1] . '/includes/ajustos.php';
require $argv[1] . '/includes/actualitzador.php';
$cas    = json_decode( stream_get_contents( STDIN ), true, 512, JSON_THROW_ON_ERROR );
$readme = socdepoble_enxufe_llig_readme();
$mesura = static function ( $text ) {
	$inici = hrtime( true );
	$html  = socdepoble_enxufe_linia_detalls( $text );
	$ms    = ( hrtime( true ) - $inici ) / 1e6;
	return array( 'ms' => $ms, 'error' => preg_last_error(), 'bytes' => strlen( $html ), 'intacta' => $html === $text );
};
echo json_encode(
	array(
		'detalls' => array_map( 'socdepoble_enxufe_html_detalls', $readme['seccions'] ),
		'canal'   => socdepoble_enxufe_seccions_readme(),
		'linies'  => socdepoble_enxufe_html_detalls( $cas['linies'] ?? array() ),
		'llargs'  => array_map( $mesura, $cas['llargs'] ?? array() ),
	),
	JSON_THROW_ON_ERROR
);
`;

function arnesReadme(cas) {
  const resultat = spawnSync(PHP, ['-d', 'pcre.jit=0', '-r', ARNES_README, '--', PLUGIN], {
    encoding: 'utf8', input: JSON.stringify(cas), timeout: 30000
  });
  assert.equal(resultat.status, 0, resultat.error?.message || resultat.stderr || resultat.stdout);
  assert.equal(resultat.stderr, '');
  return JSON.parse(resultat.stdout);
}

test('readme: l’analitzador escapa abans de transformar i només enllaça https', OPCIONS, () => {
  const { linies: html } = arnesReadme({
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

test('readme: negreta i cursiva escapades, passos numerats en una llista, i el canal propi dona el mateix que el directori', OPCIONS, () => {
  const llargs = [
    '*'.repeat(20000),
    '*a '.repeat(20000),
    '**a '.repeat(20000),
    ' *ab*c'.repeat(20000),
    ' **a**b'.repeat(20000),
    `*${'a '.repeat(20000)}`,
    // G2-P02 · Les marques dels trams de codi no poden fer créixer cap retrocés.
    '`a` '.repeat(15000),
    `*${'`a*` '.repeat(12000)}`
  ];
  const { detalls, canal, linies: html, llargs: mesures } = arnesReadme({
    linies: [
      '1. **Pas 1 · <b>Instal·la</b>:**',
      '   * Activa **Sóc de Poble** des de *Complements > Afegir complement*.',
      '   * **<img src=x onerror=alert(1)>** i *"cometes" & \'apòstrofs\'*',
      '',
      '2. **Pas 2:**',
      '   * **Manera A:**',
      '     Pega `[socdepoble_app]`',
      '     *(Nota: o `[socdepoble_app poble="x"]`).*',
      '',
      '3. **Pas 3** sense subllista',
      '',
      '* Per obrir el **Xat**:',
      '  `[socdepoble_app ruta_inicial="/xat"]`',
      '* 2*3*4, snake_*cas*, cosa*s* i `codi` dins de **https://ok.example/a**',
      '',
      '1. Una llista nova després d\'una vinyeta'
    ],
    llargs
  });

  assert.deepEqual(canal, detalls, 'el readme real: les dos finestres de detalls, idèntiques');
  assert.equal(html, [
    '<ol>',
    '<li><strong>Pas 1 · &lt;b&gt;Instal·la&lt;/b&gt;:</strong><ul>',
    '<li>Activa <strong>Sóc de Poble</strong> des de <em>Complements &gt; Afegir complement</em>.</li>',
    '<li><strong>&lt;img src=x onerror=alert(1)&gt;</strong> i <em>&quot;cometes&quot; &amp; &#039;apòstrofs&#039;</em></li>',
    '</ul></li>',
    '<li><strong>Pas 2:</strong><ul>',
    '<li><strong>Manera A:</strong> Pega <code>[socdepoble_app]</code> <em>(Nota: o <code>[socdepoble_app poble=&quot;x&quot;]</code>).</em></li>',
    '</ul></li>',
    '<li><strong>Pas 3</strong> sense subllista</li>',
    '</ol>',
    '<ul>',
    '<li>Per obrir el <strong>Xat</strong>: <code>[socdepoble_app ruta_inicial=&quot;/xat&quot;]</code></li>',
    '<li>2*3*4, snake_*cas*, cosa*s* i <code>codi</code> dins de <strong><a href="https://ok.example/a">https://ok.example/a</a></strong></li>',
    '</ul>',
    '<ol><li>Una llista nova després d&#039;una vinyeta</li></ol>'
  ].join(''), 'cursiva i negreta sense trepitjar-se, un asterisc enganxat a una lletra és literal i tot ix escapat');
  assert.ok(!/<(?:img|b|script)\b/i.test(html));

  // Cap retrocés quadràtic: sense JIT, un patró que recula sobre tota la línia tarda segons en 60 KB.
  for (const [i, { ms, error, bytes }] of mesures.entries()) {
    assert.equal(error, 0, `llarg ${i}: cap error de PCRE`);
    assert.ok(bytes >= Buffer.byteLength(llargs[i]), `llarg ${i}: la línia no es perd`);
    assert.ok(ms < 250, `llarg ${i}: ${ms.toFixed(1)} ms`);
  }
  assert.equal(mesures[0].intacta, true, '20.000 asteriscos passen intactes');
});

/* Gauntlet 2 · 261101 · Y-WordPress (G2-P02) · El codi és literal, com a WordPress.org (que pinta
   `sdp_og3_*` amb l'asterisc i no enllaça cap URL d'un <code>): dins d'un tram de codi, cap asterisc
   obri cursiva ni negreta i cap URL es fa enllaç; un enllaç no s'empassa el codi del costat; una
   cursiva sí que pot embolcallar un codi sencer, i una marca de tram escrita al readme és text. */
test('readme: el codi és literal, sense cursiva, negreta ni enllaços dins', OPCIONS, () => {
  const { linies: html } = arnesReadme({
    linies: [
      'Dos codis `*a` i `b*` aquí',
      '',
      'El codi `**x**` literal i **negreta** fora',
      '',
      'Codi `https://x.example/` i https://ok.example/`codi` i *cursiva amb `codi*` dins*',
      '',
      '*(Nota: `[socdepoble_app]` dins de la cursiva).*',
      '',
      'Marca falsa <0> i `x`'
    ]
  });
  assert.equal(html, [
    '<p>Dos codis <code>*a</code> i <code>b*</code> aquí</p>',
    '<p>El codi <code>**x**</code> literal i <strong>negreta</strong> fora</p>',
    '<p>Codi <code>https://x.example/</code> i <a href="https://ok.example/">https://ok.example/</a><code>codi</code> i <em>cursiva amb <code>codi*</code> dins</em></p>',
    '<p><em>(Nota: <code>[socdepoble_app]</code> dins de la cursiva).</em></p>',
    '<p>Marca falsa &lt;0&gt; i <code>x</code></p>'
  ].join(''));
});

/* WP-09 (auditoria 261025) · el fitxer que WordPress carrega per al text domain
   'socdepoble', no el de la identitat vella (socdepoble-enxufe-ca.l10n.php,
   domini 'socdepoble-enxufe'), que cap WordPress no llig i que P1-09 (B10) ha retirat. */
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

/* Pla 261028_1526 (P1-22, TE-05) · La llengua opt-in del lloc. Per defecte cap
   (T1: el locale de WordPress no força la llengua); un filtre de
   socdepoble_enxufe_idioma (d'un tema o d'un altre plugin: ací, una línia
   afegida al final de la còpia del plugin) emet config='{"language":"…"}' a
   l'element, només amb un dels cinc codis exactes del selector. */
test('TE-05 · socdepoble_enxufe_idioma: config amb la llengua només amb un codi exacte del selector', OPCIONS, t => {
  const atributs = { nomPoble: 'Penàguila', poble: 'penaguila' };
  const ambFiltre = (idioma) => {
    const plugin = copiaPlugin(temporal(t), 'socdepoble');
    if (idioma !== undefined) {
      fs.appendFileSync(path.join(plugin, 'socdepoble-enxufe.php'),
        "\nadd_filter( 'socdepoble_enxufe_idioma', static function () { return $GLOBALS['cas']['idioma_app']; } );\n");
    }
    const bloc = php(FIXTURE, [plugin], { mode: 'bloc', atributs, idioma_app: idioma });
    const dom = new JSDOM(bloc.html);
    t.after(() => dom.window.close());
    return { bloc, element: dom.window.document.querySelector('soc-de-poble') };
  };
  for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
    const { bloc, element } = ambFiltre(codi);
    assert.equal(element.getAttribute('config'), `{"language":"${codi}"}`, codi);
    assert.ok(bloc.html.includes(` config="{&quot;language&quot;:&quot;${codi}&quot;}"`), 'JSON escapat com a atribut');
    assert.equal(element.getAttribute('poble'), 'penaguila', 'la resta, com sempre');
    assert.equal(bloc.render_php, bloc.html, 'el camp "render" (6.1+) i el render_callback, el mateix marcatge');
  }
  for (const idioma of [undefined, '', 'en-US', 'en_US', 'fr', 'ES', ' es', ['es'], 1]) {
    assert.equal(ambFiltre(idioma).element.hasAttribute('config'), false, `sense config: ${JSON.stringify(idioma)}`);
  }
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

  // De la 6.5 ençà ho fa WordPress; una llengua sense catàleg, en anglés.
  for (const cas of [{ controlador: true }, { llengua: 'es_ES' }, { llengua: 'ca', plugin_locale: 'es_ES' }]) {
    assert.equal(executa(t, { mode: 'idioma', ...cas }, ['socdepoble']).text, 'Village name', JSON.stringify(cas));
  }
  /* P1-09 · Un paquet de translate.wordpress.org ja carregat ($cas['carregat'])
     no apaga la reserva: el que traduïx mana (ací, com el filtre general de
     baix) i el catàleg només posa el que el paquet no porta. */
  assert.equal(executa(t, { mode: 'idioma', carregat: true }, ['socdepoble']).text, messages['Village name']);
  assert.equal(executa(t, { mode: 'idioma', carregat: true, canvia: { 'Village name': 'Del paquet' } }, ['socdepoble']).text, 'Del paquet');
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

/* Pla 261028_1526 (P1-09, GN-R08) · La fixture no porta cap
   WP_Locale_Switcher: com el filtre de TE-05, el subconjunt va al final de la
   còpia del plugin. La pila desa la llengua de determine_locale()
   ($cas['llengua']), is_locale_switched() la llig i change_locale avisa en
   canviar i en tornar, com WordPress. Després de la càrrega d'init, cada pas
   de $cas['canvis'] ('restore' torna a l'anterior) anota el text i el del
   bloc, amb context. */
const DESCRIPCIO_DEL_BLOC = 'Embeds the Sóc de Poble app with the universal host markup.';
const COMMUTADOR = `
$GLOBALS['pila_llengues'] = array();
function is_locale_switched() { return ! empty( $GLOBALS['pila_llengues'] ); }
if ( 'canvis' === ( $GLOBALS['cas']['mode'] ?? '' ) ) {
	if ( isset( $GLOBALS['cas']['plugin_locale'] ) ) {
		add_filter( 'plugin_locale', static function ( $llengua, $domini ) { return 'socdepoble' === $domini ? $GLOBALS['cas']['plugin_locale'] : $llengua; }, 10, 2 );
	}
	socdepoble_enxufe_carrega_traduccions();
	$passos = array();
	foreach ( $GLOBALS['cas']['canvis'] as $pas ) {
		if ( 'restore' === $pas ) {
			$GLOBALS['cas']['llengua'] = array_pop( $GLOBALS['pila_llengues'] );
		} else {
			$GLOBALS['pila_llengues'][] = determine_locale();
			$GLOBALS['cas']['llengua']  = $pas;
		}
		do_action( 'change_locale', determine_locale() );
		$passos[] = array( __( 'Village name', 'socdepoble' ), _x( '${DESCRIPCIO_DEL_BLOC}', 'block description', 'socdepoble' ) );
	}
	echo json_encode( $passos, JSON_THROW_ON_ERROR );
	exit;
}
`;

function canvisDeLlengua(t, cas, { carpetaX = false } = {}) {
  const plugin = copiaPlugin(temporal(t), 'socdepoble');
  fs.appendFileSync(path.join(plugin, 'socdepoble-enxufe.php'), COMMUTADOR);
  if (carpetaX) fs.mkdirSync(path.join(plugin, 'languages/socdepoble-x'));
  return php(FIXTURE, [plugin], { mode: 'canvis', ...cas });
}

test('P1-09 · WordPress 5.8–6.4: la reserva seguix switch_to_locale() i la tornada, en els dos sentits', OPCIONS, t => {
  const { messages } = executa(t, { mode: 'l10n' });
  const EN = ['Village name', DESCRIPCIO_DEL_BLOC];
  const CA = [messages['Village name'], messages[`block description\u0004${DESCRIPCIO_DEL_BLOC}`]];
  assert.ok(CA[0] && CA[1] && CA[0] !== EN[0] && CA[1] !== EN[1], 'el catàleg de ca traduïx els dos textos');
  const passos = (llengua, canvis, extra = {}) => canvisDeLlengua(t, { llengua, canvis, ...extra });

  assert.deepEqual(passos('ca', ['en_US', 'restore']), [EN, CA]);
  assert.deepEqual(passos('en_US', ['ca', 'restore']), [CA, EN], 'un lloc sense catàleg a init també canvia');
  assert.deepEqual(passos('en_US', ['ca_valencia', 'es_ES', 'restore', 'restore']), [CA, EN, CA, EN], 'la pila, i ca_valencia amb el catàleg de ca');
  assert.deepEqual(passos('en_US', ['ca'], { plugin_locale: 'es_ES' }), [EN], 'plugin_locale també a la llengua canviada');
  assert.deepEqual(passos('en_US', ['es_ES'], { plugin_locale: 'ca' }), [CA]);
  assert.deepEqual(passos('es_ES', ['ca', 'restore'], { carregat: true }), [CA, EN], 'un paquet carregat a init no apaga la reserva');
  assert.deepEqual(canvisDeLlengua(t, { llengua: 'en_US', canvis: ['/../socdepoble-ca', 'x/../socdepoble-ca'] }, { carpetaX: true }), [EN, EN], 'la guarda del codi de llengua');
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
