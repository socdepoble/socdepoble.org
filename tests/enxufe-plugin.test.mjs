/** Porta executable del plugin socdepoble-enxufe (torn torn_2c123d78, 260929).
 *  A la màquina no hi ha cap PHP i el hook no deixa executar-ne: ací es
 *  comprova, llegint el codi, el que es pot comprovar sense intèrpret:
 *   · estructura de cada fitxer PHP (obertura, guarda d'accés directe,
 *     parèntesis, claudàtors i claus equilibrats fora de cadenes i comentaris);
 *   · cap funció ni constant del plugin cridada sense definir ni definida dues
 *     vegades, i cap identificador de callback sense funció;
 *   · el contracte d'amfitrió: només els atributs universals a l'element, només
 *     nomPoble i poble al global, cap atribut ni clau de backend;
 *   · capçaleres (plugin, readme, block.json) coherents entre elles i amb el
 *     filtre update_plugins_{host};
 *   · text domain únic i traducció valenciana completa;
 *   · ESLint sense cap missatge i cap caràcter invisible als fitxers del torn.
 *  La sintaxi PHP completa i el comportament a WordPress es verifiquen a
 *  WordPress Studio amb Plugin Check (vegeu l'auditoria del torn). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { CONTRACTE_AMFITRIO } from '../vite.standalone.config.js';
import { requisitsDe, variantDirectoriReadme } from '../wordpress-plugin/eines/empaqueta.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ARREL, 'wordpress-plugin');
const llig = (rel) => fs.readFileSync(path.join(PLUGIN, rel), 'utf8');

function fitxersDe(rel, extensio) {
  const eixida = [];
  const recorre = (actual) => {
    for (const entrada of fs.readdirSync(path.join(PLUGIN, actual), { withFileTypes: true })) {
      const fill = actual ? `${actual}/${entrada.name}` : entrada.name;
      if (fill === 'dist' || entrada.name.startsWith('.')) continue;
      if (entrada.isDirectory()) recorre(fill);
      else if (fill.endsWith(extensio)) eixida.push(fill);
    }
  };
  recorre(rel);
  return eixida.sort();
}

const PHP = fitxersDe('', '.php');

/* ─────────────────────── Tokenitzador PHP mínim ─────────────────────── */

/** Codi PHP sense cadenes ni comentaris (cadenes → '', comentaris → espai) i
 *  sense el text fora de <?php … ?>. Suficient per a equilibrar delimitadors. */
function nomesCodi(text) {
  let eixida = '';
  let i = 0;
  let php = false;
  while (i < text.length) {
    if (!php) {
      const obri = text.indexOf('<?php', i);
      if (obri < 0) break;
      php = true;
      i = obri + 5;
      continue;
    }
    const c = text[i];
    const seguent = text[i + 1];
    if (c === '?' && seguent === '>') { php = false; eixida += ';'; i += 2; continue; }
    if (c === '/' && seguent === '*') { const fi = text.indexOf('*/', i + 2); i = fi < 0 ? text.length : fi + 2; eixida += ' '; continue; }
    if ((c === '/' && seguent === '/') || c === '#') {
      while (i < text.length && text[i] !== '\n' && !(text[i] === '?' && text[i + 1] === '>')) i += 1;
      eixida += ' ';
      continue;
    }
    if (c === '\'' || c === '"') {
      i += 1;
      while (i < text.length && text[i] !== c) i += text[i] === '\\' ? 2 : 1;
      if (i >= text.length) throw new Error('Cadena sense tancar');
      i += 1;
      eixida += '\'\'';
      continue;
    }
    if (c === '<' && text.startsWith('<<<', i)) throw new Error('Heredoc no previst al plugin');
    eixida += c;
    i += 1;
  }
  return eixida;
}

function desequilibris(codi) {
  const parells = { ')': '(', ']': '[', '}': '{' };
  const pila = [];
  let linia = 1;
  for (const c of codi) {
    if (c === '\n') linia += 1;
    if ('([{'.includes(c)) pila.push({ c, linia });
    else if (c in parells) {
      const obert = pila.pop();
      if (!obert || obert.c !== parells[c]) return `«${c}» a la línia ${linia} tanca ${obert ? `«${obert.c}» de la línia ${obert.linia}` : 'res'}`;
    }
  }
  return pila.length ? `«${pila.at(-1).c}» de la línia ${pila.at(-1).linia} sense tancar` : null;
}

test('cada PHP comença per <?php, porta la guarda d\'accés directe i té els delimitadors equilibrats', () => {
  assert.ok(PHP.length >= 10, `esperava tots els PHP del plugin, n'he trobat ${PHP.length}`);
  for (const rel of PHP) {
    const text = llig(rel);
    assert.ok(text.startsWith('<?php\n'), `${rel}: ha de començar per <?php`);
    assert.match(text, /^defined\( 'ABSPATH' \) \|\| exit;$/m, `${rel}: falta la guarda ABSPATH`);
    const problema = desequilibris(nomesCodi(text));
    assert.equal(problema, null, `${rel}: ${problema}`);
    assert.ok(!/\r/.test(text), `${rel}: salts de línia CRLF`);
    assert.ok(text.endsWith('\n'), `${rel}: sense salt de línia final`);
  }
  assert.match(llig('uninstall.php'), /^defined\( 'WP_UNINSTALL_PLUGIN' \) \|\| exit;$/m);
});

/* ──────────────── Funcions, constants i callbacks del plugin ──────────────── */

const codiDe = Object.fromEntries(PHP.map((rel) => [rel, nomesCodi(llig(rel))]));
const textDe = Object.fromEntries(PHP.map((rel) => [rel, llig(rel)]));

test('cap funció del plugin es crida sense definir ni es definix dues vegades', () => {
  const definides = new Map();
  for (const [rel, codi] of Object.entries(codiDe)) {
    for (const m of codi.matchAll(/\bfunction\s+(socdepoble_enxufe_\w+)\s*\(/g)) {
      assert.ok(!definides.has(m[1]), `${m[1]} definida a ${definides.get(m[1])} i a ${rel}`);
      definides.set(m[1], rel);
    }
  }
  const sense = [];
  for (const [rel, codi] of Object.entries(codiDe)) {
    for (const m of codi.matchAll(/(?<!function\s)\b(socdepoble_enxufe_\w+)\s*\(/g)) {
      if (!definides.has(m[1])) sense.push(`${rel}: ${m[1]}()`);
    }
  }
  assert.deepEqual(sense, []);

  /* Identificadors entre cometes: o són funcions (callbacks) o són noms
     declarats ací (opcions, seccions, proves, codis d'error, nonces, filtres). */
  const NO_FUNCIONS = new Set([
    'socdepoble_enxufe_amfitrio', 'socdepoble_enxufe_nompoble', 'socdepoble_enxufe_poble', // secció i camps d'ajustos
    'socdepoble_enxufe_config',                                                              // filtre públic
    'socdepoble_enxufe_canal', 'socdepoble_enxufe_paquet',                                  // opció i proves de Salut
    'socdepoble_enxufe_comprova',                                                            // acció i nonce
    'socdepoble_enxufe_http', 'socdepoble_enxufe_url', 'socdepoble_enxufe_temporal', 'socdepoble_enxufe_arrel', 'socdepoble_enxufe_bloqueig' // codis d'error
  ]);
  const orfes = [];
  for (const [rel, text] of Object.entries(textDe)) {
    for (const m of text.matchAll(/'(socdepoble_enxufe_[a-z_]+)'/g)) {
      if (!definides.has(m[1]) && !NO_FUNCIONS.has(m[1])) orfes.push(`${rel}: '${m[1]}'`);
    }
  }
  assert.deepEqual(orfes, [], 'identificadors sense funció: afegiu-los a NO_FUNCIONS si no són callbacks');

  for (const [rel, text] of Object.entries(textDe)) {
    for (const m of text.matchAll(/add_(?:filter|action)\(\s*'[^']+'\s*,\s*'(\w+)'/g)) {
      assert.ok(definides.has(m[1]), `${rel}: el callback ${m[1]} no existix`);
    }
  }
});

test('cap constant del plugin s\'usa sense definir ni es definix dues vegades', () => {
  const definides = new Map();
  for (const [rel, text] of Object.entries(textDe)) {
    for (const m of text.matchAll(/^\s*const (SOCDEPOBLE_ENXUFE_\w+)\s*=/gm)) {
      assert.ok(!definides.has(m[1]), `${m[1]} dues vegades`);
      definides.set(m[1], rel);
    }
    for (const m of text.matchAll(/\bdefine\(\s*'(SOCDEPOBLE_ENXUFE_\w+)'/g)) definides.set(m[1], rel);
  }
  const sense = [];
  for (const [rel, codi] of Object.entries(codiDe)) {
    for (const m of codi.matchAll(/\b(SOCDEPOBLE_ENXUFE_\w+)\b/g)) if (!definides.has(m[1])) sense.push(`${rel}: ${m[1]}`);
  }
  assert.deepEqual(sense, []);
});

/* ─────────────────────────── Contracte d'amfitrió ─────────────────────────── */

const ATRIBUTS_DE_BACKEND = /\b(supabase-url|supabase-anon-key|backend-url|tenant-id|data-mode|bot-api-url|oauth-relay-url|sollutia-issuer|config-id)\b/;

test('l\'element només porta atributs del contracte universal, i el global només nomPoble i poble', () => {
  const marcatge = llig('includes/marcatge.php');
  const cos = marcatge.slice(marcatge.indexOf('function socdepoble_enxufe_element('), marcatge.indexOf('function socdepoble_enxufe_te_bundle('));
  const emesos = [...cos.matchAll(/ ([a-z-]+)="/g)].map((m) => m[1]).sort();
  assert.deepEqual(emesos, ['fonts-href', 'nom-poble', 'plugin-url', 'poble', 'ruta-inicial', 'traductor-url']);
  for (const atribut of emesos) assert.ok(CONTRACTE_AMFITRIO.atributs.includes(atribut), atribut);

  const permesos = marcatge.slice(marcatge.indexOf("'soc-de-poble' => array("), marcatge.indexOf('function socdepoble_enxufe_shortcode('));
  assert.deepEqual([...permesos.matchAll(/'([a-z-]+)'\s*=>\s*true/g)].map((m) => m[1]).sort(), emesos, 'wp_kses ha de deixar passar exactament els atributs emesos');

  const config = marcatge.slice(marcatge.indexOf('function socdepoble_enxufe_config('), marcatge.indexOf('function socdepoble_enxufe_declaracio_amfitrio('));
  assert.deepEqual([...new Set([...config.matchAll(/\$net\['(\w+)'\]/g)].map((m) => m[1]))].sort(), [...CONTRACTE_AMFITRIO.claus].sort());

  for (const rel of [...PHP, 'includes/bloc/editor.js', 'includes/bloc/block.json']) {
    assert.doesNotMatch(llig(rel), ATRIBUTS_DE_BACKEND, `${rel}: cap atribut de backend`);
  }
  const bloc = JSON.parse(llig('includes/bloc/block.json'));
  assert.deepEqual(Object.keys(bloc.attributes).sort(), ['nomPoble', 'poble', 'rutaInicial']);
});

test('ajustos: l\'opció només desa nomPoble i poble', () => {
  const ajustos = llig('includes/ajustos.php');
  const sanitza = ajustos.slice(ajustos.indexOf('function socdepoble_enxufe_sanitza_opcio('), ajustos.indexOf('function socdepoble_enxufe_registra_ajustos('));
  assert.deepEqual([...new Set([...sanitza.matchAll(/\$net\['(\w+)'\]/g)].map((m) => m[1]))].sort(), ['nomPoble', 'poble']);
  assert.deepEqual([...ajustos.matchAll(/'clau'\s*=>\s*'(\w+)'/g)].map((m) => m[1]).sort(), ['nomPoble', 'poble']);
});

/* ─────────────────────────────── Capçaleres ─────────────────────────────── */

const capcalera = (text, nom) => text.match(new RegExp(`^[ \\t/*#@=]*${nom}:[ \\t]*(.+?)[ \\t]*$`, 'mi'))?.[1] ?? null;

test('capçaleres coherents: plugin, readme, constant de versió, block.json i filtre update_plugins_{host}', () => {
  const principal = llig('socdepoble-enxufe.php');
  const readme = llig('readme.txt');
  const versio = capcalera(principal, 'Version');
  assert.equal(principal.match(/^const SOCDEPOBLE_ENXUFE_VERSIO\s*=\s*'([^']+)';/m)?.[1], versio);
  assert.equal(capcalera(readme, 'Stable tag'), versio);
  assert.equal(capcalera(principal, 'Text Domain'), 'socdepoble-enxufe');
  assert.equal(capcalera(principal, 'Domain Path'), '/languages');
  assert.equal(capcalera(principal, 'License'), capcalera(readme, 'License'));
  assert.equal(readme.match(/^=== (.+) ===$/m)?.[1], capcalera(principal, 'Plugin Name'), 'el nom del readme és el del plugin');
  requisitsDe(principal, readme);

  const descripcioCurta = readme.split(/\r?\n\r?\n/)[1];
  assert.ok(descripcioCurta && !descripcioCurta.startsWith('==') && descripcioCurta.length <= 150, 'descripció curta de 150 caràcters com a màxim');
  assert.ok(Buffer.byteLength(readme) < 10240, 'readme de menys de 10 KB');

  const host = new URL(capcalera(principal, 'Update URI')).hostname;
  assert.match(llig('includes/actualitzador.php'), new RegExp(`add_filter\\(\\s*'update_plugins_${host.replace(/\./g, '\\.')}'`), 'el filtre ha de ser el del host de Update URI');

  const bloc = JSON.parse(llig('includes/bloc/block.json'));
  assert.equal(bloc.name, 'socdepoble/app');
  assert.equal(bloc.textdomain, 'socdepoble-enxufe');
  for (const clau of ['render', 'editorScript']) {
    assert.match(bloc[clau], /^file:\.\//);
    assert.ok(fs.existsSync(path.join(PLUGIN, 'includes/bloc', bloc[clau].slice(7))), `${clau} existix`);
  }
  const deps = [...llig('includes/bloc/editor.asset.php').matchAll(/'(wp-[a-z-]+)'/g)].map((m) => m[1]).sort();
  const usats = [...new Set([...llig('includes/bloc/editor.js').matchAll(/\bwp\.([a-zA-Z]+)\./g)].map((m) => `wp-${m[1].replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`))].sort();
  assert.deepEqual(deps, usats, 'editor.asset.php declara exactament els paquets wp.* que usa editor.js');
});

/* ───────────────────────────────── i18n ───────────────────────────────── */

const FUNCIONS_I18N = /\b(?:__|_e|esc_html__|esc_html_e|esc_attr__|esc_attr_e)\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([^']*)'\s*\)/g;
const SENSE_TRADUCCIO = new Set(['Sóc de Poble', 'Sóc de Poble — Enxufe']);

test('un sol text domain i traducció valenciana completa de tots els textos PHP', () => {
  const msgids = new Set();
  for (const [rel, text] of Object.entries(textDe)) {
    if (rel.startsWith('languages/')) continue;
    for (const m of text.matchAll(FUNCIONS_I18N)) {
      assert.equal(m[2], 'socdepoble-enxufe', `${rel}: text domain «${m[2]}»`);
      msgids.add(m[1].replace(/\\'/g, '\''));
    }
    assert.doesNotMatch(text, /\b(?:__|_e|esc_html__|esc_html_e|esc_attr__|esc_attr_e|_x|_n)\(\s*"/, `${rel}: textos traduïbles entre cometes dobles`);
  }
  for (const m of llig('includes/bloc/editor.js').matchAll(/__\(\s*'[^']*'\s*,\s*'([^']*)'\s*\)/g)) assert.equal(m[1], 'socdepoble-enxufe');

  const traduccio = llig('languages/socdepoble-enxufe-ca.l10n.php');
  const claus = new Set([...traduccio.matchAll(/^\t\t'((?:[^'\\]|\\.)*)' => '/gm)].map((m) => m[1]));
  msgids.add(capcalera(llig('socdepoble-enxufe.php'), 'Description'));
  const falten = [...msgids].filter((id) => !SENSE_TRADUCCIO.has(id) && !claus.has(id));
  assert.deepEqual(falten, [], 'textos sense traducció al valencià');
  const sobren = [...claus].filter((id) => !msgids.has(id));
  assert.deepEqual(sobren, [], 'traduccions de textos que ja no existixen');
  const bloc = JSON.parse(llig('includes/bloc/block.json'));
  assert.ok(traduccio.includes(`"block description\\x04${bloc.description}"`), 'la descripció del bloc, amb el context de block.json');
  for (const paraula of bloc.keywords.filter((k) => !['socdepoble', 'poble'].includes(k))) {
    assert.ok(traduccio.includes(`"block keyword\\x04${paraula}"`), `paraula clau del bloc sense traducció: ${paraula}`);
  }
  assert.match(traduccio, /'language'\s*=>\s*'ca'/);

  /* L'editor del bloc: JSON pel handle que genera WordPress
     (generate_block_asset_handle: socdepoble/app + editorScript). */
  const json = JSON.parse(llig('languages/socdepoble-enxufe-ca-socdepoble-app-editor-script.json'));
  const missatges = json.locale_data.messages;
  assert.equal(missatges[''].lang, 'ca');
  const idsEditor = [...llig('includes/bloc/editor.js').matchAll(/__\(\s*'([^']*)'\s*,\s*'socdepoble-enxufe'\s*\)/g)].map((m) => m[1]);
  assert.ok(idsEditor.length >= 8);
  assert.deepEqual(idsEditor.filter((id) => !SENSE_TRADUCCIO.has(id) && !Array.isArray(missatges[id])), [], 'textos de l\'editor sense traducció');
  assert.match(llig('includes/marcatge.php'), /wp_set_script_translations\(\s*'socdepoble-app-editor-script',\s*'socdepoble-enxufe',/);
});

/* ─────────── Guardes de les correccions de la revisió adversarial ───────────
   Sense intèrpret PHP, la manera que una correcció no torne arrere és fixar-ne
   la forma al codi. Cada asserció nomena la fallada que evita. */

const cosDe = (rel, funcio) => {
  const text = llig(rel);
  const inici = text.indexOf(`function ${funcio}(`);
  assert.ok(inici >= 0, `${rel}: falta ${funcio}()`);
  const fi = text.indexOf('\nfunction ', inici + 1);
  return text.slice(inici, fi < 0 ? text.length : fi);
};

test('actualitzador: paquet simbòlic al transient, URL real només del manifest verificat, arrel via WP_Filesystem', () => {
  const actualitzador = llig('includes/actualitzador.php');
  assert.match(actualitzador, /const SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC\s*=\s*'socdepoble-enxufe:';/);
  const update = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_update_plugins');
  assert.match(update, /\$resposta\['package'\]\s*=\s*SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC/, 'amb el plugin inactiu, WordPress no ha de tindre res descarregable');
  assert.doesNotMatch(update, /\['paquet'\]\['url'\]/);
  assert.doesNotMatch(update, /'autoupdate'/, 'mai es força l\'actualització');
  assert.match(update, /socdepoble_enxufe_oferta\(/, 'una sola condició d\'oferta');
  const api = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_plugins_api');
  assert.doesNotMatch(api, /download_link\s*=[^;]*\['paquet'\]\['url'\]/, '«Instal·la ara» tampoc no baixa el zip sense verificar');
  assert.match(api, /socdepoble_enxufe_oferta\(\)/, 'el modal només anuncia l\'oferta vigent');
  const baixada = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_pre_descarrega');
  assert.match(baixada, /strpos\(\s*\(string\) \$paquet,\s*SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC\s*\)/);
  assert.match(baixada, /socdepoble_enxufe_bloqueig_instal_lacio\(/, 'una oferta rància no s\'instal·la damunt d\'un git ni d\'un enllaç');
  assert.match(baixada, /socdepoble_enxufe_oferta\(/);
  assert.doesNotMatch(baixada, /delete_site_transient\(/, 'el bucle d\'automàtiques continua usant el transient');
  assert.match(baixada, /\$paquet\s*=\s*\$esperat\['url'\];/);
  assert.match(baixada, /hash_equals\(\s*\$esperat\['sha256'\]/);
  assert.match(baixada, /socdepoble_enxufe_error_arrel_zip\(/, 'l\'arrel es mira abans que WordPress desactive el plugin');
  assert.match(cosDe('includes/actualitzador.php', 'socdepoble_enxufe_compleix_requisits'), /is_wp_version_compatible\(.*is_php_version_compatible\(/s);
  const origen = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_seleccio_origen');
  assert.match(origen, /\$wp_filesystem->is_file\(/, 'amb FTP o SSH engabiats la ruta no és local');
  const bloqueig = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_bloqueig_instal_lacio');
  for (const cas of ['is_link(', "'/.git'", 'is_multisite()', 'active_sitewide_plugins']) assert.ok(bloqueig.includes(cas), cas);
  const salut = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_prova_canal');
  assert.doesNotMatch(salut, /socdepoble_enxufe_canal\(/, 'la prova directa de Salut no fa crides de xarxa');
  assert.match(salut, /socdepoble_enxufe_wp_aplica_el_canal\(\)/, 'diu si api.wordpress.org ha deixat aplicar el canal');
  const seccio = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_seccio_canal');
  assert.doesNotMatch(seccio, /socdepoble_enxufe_canal\(/, 'obrir els ajustos no fa crides de xarxa');
  const agent = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_llig_url');
  assert.match(agent, /'user-agent'\s*=>\s*socdepoble_enxufe_agent\(\)/, 'les peticions no porten l\'URL del lloc');
});

test('actualitzador: el commutador d\'automàtiques apareix en activar i la cel·la avisa quan no arribarà cap actualització', () => {
  const actualitzador = llig('includes/actualitzador.php');
  const codi = codiDe['includes/actualitzador.php'];
  assert.match(actualitzador, /^register_activation_hook\(\s*SOCDEPOBLE_ENXUFE_FITXER,\s*'socdepoble_enxufe_en_activar'\s*\);$/m, 'sense ganxo d\'activació la columna ix buida fins que caduca la memòria cau de WordPress');
  const activar = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_en_activar');
  assert.match(activar, /delete_site_transient\(\s*'update_plugins'\s*\)/, 'invalida com «Comprova-ho de nou»');
  assert.doesNotMatch(activar, /wp_update_plugins\(|wp_remote_|wp_safe_remote_|socdepoble_enxufe_canal\(/, 'activar no fa cap crida de xarxa');
  assert.doesNotMatch(codi, /\bset_site_transient\(/, 'el plugin mai no escriu el transient update_plugins');
  assert.doesNotMatch(actualitzador, /add_filter\(\s*'(?:pre_set_site_transient_update_plugins|site_transient_update_plugins|auto_update_plugin|all_plugins)'/, 'ni s\'injecta al transient, ni es força l\'automàtica, ni es fingix update-supported');
  const update = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_update_plugins');
  assert.match(update, /'version'\s*=>\s*\$installada/, 'sempre un objecte amb version: WordPress el posa a no_update i pinta el commutador');
  assert.match(actualitzador, /add_filter\(\s*'plugin_auto_update_setting_html',\s*'socdepoble_enxufe_avis_automatiques',\s*10,\s*2\s*\);/);
  const avis = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_avis_automatiques');
  assert.match(avis, /plugin_basename\(\s*SOCDEPOBLE_ENXUFE_FITXER\s*\)\s*!==\s*\$plugin_file/, 'només la fila d\'este plugin');
  assert.match(avis, /socdepoble_enxufe_prova_canal\(\)/, 'el mateix diagnòstic que Salut');
  assert.doesNotMatch(avis, /socdepoble_enxufe_canal\(|wp_remote_|wp_safe_remote_/, 'pintar Extensions no fa crides de xarxa');
  assert.match(avis, /return \$html \. sprintf\(/, 'afig davall del commutador, no el substituïx');
  assert.match(avis, /esc_url\(/);
  assert.match(avis, /esc_html\(\s*\$prova\['label'\]\s*\)/, 'el nucli fa echo del filtre sense escapar');
});

test('readme: el paràgraf del canal explica el commutador en una sola línia, i la variant del directori el lleva sencer', () => {
  const readme = llig('readme.txt');
  const paragraf = readme.match(/^Update channel \(.*$/m)?.[0] ?? '';
  assert.match(paragraf, /Automatic updates stay off until you turn them on/, 'l\'administrador decidix');
  assert.match(paragraf, /with the plugin active; activating the plugin clears the update cache/, 'per què el commutador pot tardar i què el fa eixir');
  assert.match(paragraf, /WP-Cron/, 'les automàtiques depenen del cron de WordPress');
  assert.doesNotMatch(variantDirectoriReadme(readme), /Automatic updates|WP-Cron/, 'al directori les automàtiques són les natives de WordPress.org');
});

test('marcatge: integrity opcional, referència copiable, identificador i ruta com el nucli, manifest sense avisos', () => {
  const integritat = cosDe('includes/marcatge.php', 'socdepoble_enxufe_integritat');
  assert.match(integritat, /apply_filters\(\s*'socdepoble_enxufe_integritat',\s*false,/, 'per defecte l\'etiqueta és la de sempre (Llei del Píxel)');
  const referencia = cosDe('includes/marcatge.php', 'socdepoble_enxufe_marcatge_de_referencia');
  assert.doesNotMatch(referencia, /integrity|crossorigin/, 'copiat a un altre origen, no ha d\'exigir CORS');
  assert.match(cosDe('includes/marcatge.php', 'socdepoble_enxufe_identificador'), /\^\[a-z0-9\]\[a-z0-9-\]\{0,62\}\$/, 'el mateix patró que sanejaIdentificador');
  const ruta = cosDe('includes/marcatge.php', 'socdepoble_enxufe_ruta');
  assert.match(ruta, /\\p\{Z\}/);
  assert.match(ruta, /\/u'/, 'mode UTF-8');
  assert.match(ruta, /0 !== preg_match/, 'l\'UTF-8 invàlid també es rebutja');
  assert.doesNotMatch(llig('includes/manifest.php'), /wp_json_file_decode\(/, 'un JSON trencat no pot llançar avisos a cada petició');
});

/* ───────────────────────── ESLint i caràcters vetats ───────────────────────── */

const JS_DEL_TORN = [
  'wordpress-plugin/includes/bloc/editor.js',
  'wordpress-plugin/eines/empaqueta.mjs',
  'tests/enxufe-plugin.test.mjs',
  'tests/enxufe-empaqueta.test.mjs',
  'tests/standalone-build.test.mjs',
  'vite.standalone.config.js'
];

test('ESLint: zero missatges als fitxers JS del torn', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(JS_DEL_TORN.map((f) => path.join(ARREL, f)));
  assert.equal(resultats.length, JS_DEL_TORN.length, 'ESLint no ha linat tots els fitxers');
  const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId}] ${m.message}`));
  assert.deepEqual(missatges, []);
});

const car = (cp) => String.fromCodePoint(cp);
const VETATS = new RegExp(`[${[[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]]
  .map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');

test('cap fitxer del torn porta caràcters de control, invisibles ni bidi', () => {
  const fitxers = [
    ...PHP.map((rel) => `wordpress-plugin/${rel}`),
    'wordpress-plugin/readme.txt',
    'wordpress-plugin/includes/bloc/block.json',
    ...JS_DEL_TORN
  ];
  const trobats = fitxers.filter((f) => VETATS.test(fs.readFileSync(path.join(ARREL, f), 'utf8')));
  assert.deepEqual(trobats, []);
});
