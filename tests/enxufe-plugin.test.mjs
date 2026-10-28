/** Porta executable del plugin socdepoble-enxufe (torn torn_2c123d78, 260929).
 *  A la màquina no hi ha cap PHP i el hook no deixa executar-ne: ací es
 *  comprova, llegint el codi, el que es pot comprovar sense intèrpret:
 *   · estructura de cada fitxer PHP (obertura, guarda d'accés directe,
 *     parèntesis, claudàtors i claus equilibrats fora de cadenes i comentaris);
 *   · cap funció ni constant del plugin cridada sense definir ni definida dues
 *     vegades, i cap identificador de callback sense funció;
 *   · el contracte d'amfitrió: només els atributs universals a l'element (i,
 *     a la instància de WordPress, l'opt-in ruta-a-url i el config de la
 *     llengua opt-in), només nomPoble i poble al global, cap atribut ni clau
 *     de backend;
 *   · capçaleres (plugin, readme, block.json) coherents entre elles i amb el
 *     filtre update_plugins_{host};
 *   · text domain únic i traducció valenciana completa;
 *   · la taula de versions de WordPress: cap API més nova que el sòl de la
 *     capçalera sense guarda, i el codi ja funciona des de la 5.8;
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
import { CONTRACTE_AMFITRIO_V1 } from '../src/config/contracteAmfitrio.js';
import { SUPPORTED_LANGUAGES } from '../src/config/i18n.js';
import { foraDelDirectori, patronsActualitzadorEn, requisitsDe, variantDirectori, variantDirectoriReadme } from '../wordpress-plugin/eines/empaqueta.mjs';

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
 *  sense el text fora de <?php … ?>. Suficient per a equilibrar delimitadors.
 *  Amb `ambCadenes`, les cadenes es conserven: els noms dels ganxos. */
function nomesCodi(text, ambCadenes = false) {
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
      const inici = i;
      i += 1;
      while (i < text.length && text[i] !== c) i += text[i] === '\\' ? 2 : 1;
      if (i >= text.length) throw new Error('Cadena sense tancar');
      i += 1;
      eixida += ambCadenes ? text.slice(inici, i) : '\'\'';
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
    'socdepoble_enxufe_config', 'socdepoble_enxufe_ruta_a_url',                            // filtres públics
    'socdepoble_enxufe_seo',                                                                 // filtre públic (Onada 11, 261010, tasca 7): OpenGraph de la ruta
    'socdepoble_enxufe_idioma',                                                              // filtre públic (pla 261028_1526, TE-05): la llengua opt-in
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

test('l\'element només porta atributs del contracte (universals, l\'opt-in ruta-a-url i el config de la llengua), i el global només nomPoble i poble', () => {
  const marcatge = llig('includes/marcatge.php');
  const cos = marcatge.slice(marcatge.indexOf('function socdepoble_enxufe_element('), marcatge.indexOf('function socdepoble_enxufe_te_bundle('));
  const emesos = [...cos.matchAll(/ ([a-z-]+)="/g)].map((m) => m[1]).sort();
  /* Actualitzada a posta (pla 261028_1526, P1-22, TE-05): motiu, la llengua opt-in
     del lloc va pel JSON de l'atribut config (atributsDeConfig), sense canvi de contracte. */
  assert.deepEqual(emesos, ['config', 'fonts-href', 'nom-poble', 'plugin-url', 'poble', 'ruta-a-url', 'ruta-inicial', 'traductor-url']);
  for (const atribut of emesos) {
    assert.ok(CONTRACTE_AMFITRIO.atributs.includes(atribut) || CONTRACTE_AMFITRIO_V1.atributsOptIn.includes(atribut)
      || (atribut === 'config' && CONTRACTE_AMFITRIO_V1.atributsDeConfig.includes(atribut)), atribut);
  }

  /* Onada 5 (ordre del Mestre, 261009): la instància pròpia de WordPress
     declara la clàusula dels slugs, per defecte al fragment i només amb un
     mode del contracte. El marcatge de referència crida l'element sense
     serveis i es queda en sdp.markup.v1, sense cap opt-in. */
  const nomesWordpress = cos.match(/\n\tif \( \$amb_serveis \) \{\n([^]*?)\n\t\}\n/)?.[1] ?? '';
  assert.match(nomesWordpress, / ruta-a-url="/, 'l\'opt-in només a la instància pròpia de WordPress');
  assert.match(nomesWordpress, /apply_filters\(\s*'socdepoble_enxufe_ruta_a_url',\s*'fragment'\s*\)/, 'per defecte, el fragment: no arriba al servidor');
  const modes = nomesWordpress.match(/in_array\(\s*\$ruta_a_url,\s*array\(([^)]*)\),\s*true\s*\)/)?.[1];
  assert.ok(modes, 'comparació estricta amb in_array');
  assert.deepEqual([...modes.matchAll(/'([a-z]+)'/g)].map((m) => m[1]), [...CONTRACTE_AMFITRIO_V1.rutaAUrl.modes], 'els modes del contracte');
  /* TE-05 · config només a la instància pròpia, només amb un filtre que per defecte no
     tria res (T1: el locale de WordPress no força la llengua), només amb un codi exacte
     del selector i amb un JSON que només porta `language`, escapat dues vegades. */
  assert.equal((cos.match(/ config="/g) ?? []).length, 1);
  assert.match(nomesWordpress, / config="/, 'la llengua només a la instància pròpia de WordPress');
  assert.match(nomesWordpress, /\$idioma = apply_filters\(\s*'socdepoble_enxufe_idioma',\s*''\s*\);/, 'per defecte, cap llengua');
  const codis = nomesWordpress.match(/in_array\(\s*\$idioma,\s*array\(([^)]*)\),\s*true\s*\)/)?.[1];
  assert.ok(codis, 'comparació estricta amb in_array');
  assert.deepEqual([...codis.matchAll(/'([a-z]+)'/g)].map((m) => m[1]), SUPPORTED_LANGUAGES.map((l) => l.code), 'els cinc codis del selector');
  assert.match(nomesWordpress, / config="' \. esc_attr\( wp_json_encode\( array\( 'language' => \$idioma \), JSON_HEX_TAG \| JSON_HEX_AMP \| JSON_HEX_APOS \| JSON_HEX_QUOT \) \) \. '"'/);
  assert.doesNotMatch(marcatge.slice(marcatge.indexOf('function socdepoble_enxufe_config('), marcatge.indexOf('function socdepoble_enxufe_declaracio_amfitrio(')), /language|idioma/, 'el global no porta la llengua');
  const referencia = marcatge.slice(marcatge.indexOf('function socdepoble_enxufe_marcatge_de_referencia('), marcatge.indexOf('function socdepoble_enxufe_afig_plantilla('));
  assert.match(referencia, /socdepoble_enxufe_element\( array\(\), false \)/, 'la referència copiable no porta l\'opt-in');

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

test('ajustos: l\'opció només desa nomPoble i poble, i només hi ha eixos dos camps', () => {
  const ajustos = llig('includes/ajustos.php');
  const sanitza = ajustos.slice(ajustos.indexOf('function socdepoble_enxufe_sanitza_opcio('), ajustos.indexOf('function socdepoble_enxufe_oblida_tenant_heretat('));
  assert.deepEqual([...new Set([...sanitza.matchAll(/\$net\['(\w+)'\]/g)].map((m) => m[1]))].sort(), ['nomPoble', 'poble']);
  assert.deepEqual([...ajustos.matchAll(/'clau'\s*=>\s*'(\w+)'/g)].map((m) => m[1]).sort(), ['nomPoble', 'poble']);
});

/* ─────────────────────────────── Capçaleres ─────────────────────────────── */

const capcalera = (text, nom) => text.match(new RegExp(`^[ \\t/*#@=]*${nom}:[ \\t]*(.+?)[ \\t]*$`, 'mi'))?.[1] ?? null;

/* Plugin Check (Plugin_Readme_Check::check_upgrade_notice) mesura cada avís
   amb strlen, en bytes, sobre el text que ja ha passat per
   Parser::sanitize_text: strip_tags, esc_html i trim. Cada " o ' en fa 6
   (&quot;, &#039;), cada & en fa 5 i cada lletra no ASCII, 2 o 3. Ací tot &
   compta com &amp;, encara que esc_html no torne a escapar una entitat ja
   escrita: la mesura pot passar-se'n, però mai quedar curta. El Plugin Check
   de Studio no porta el Markdown de WordPress.org i l'avís no rep cap <p>. */
const mesuraUpgradeNotice = (text) => Buffer.byteLength(text.trim()
  .replace(/<(?!\s)[^>]*(?:>|$)/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  .trim(), 'utf8');

test('Upgrade Notice: la mesura és la de Plugin Check, no la del text cru', () => {
  assert.equal(mesuraUpgradeNotice('"a" & b — <i>c</i>'), 27, 'cometes, &, no ASCII i etiquetes');
  assert.equal(mesuraUpgradeNotice("\nl'a < b\n"), 15, 'apòstrof, < solt i trim');
  const limit = `${'x'.repeat(285)} "soc-de-poble"`;
  assert.equal(limit.trim().length, 300);
  assert.equal(mesuraUpgradeNotice(limit), 310, 'el text cru en fa 300 i Plugin Check hi posaria upgrade_notice_limit');
});

test('capçaleres coherents: plugin, readme, constant de versió, block.json i filtre update_plugins_{host}', () => {
  const principal = llig('socdepoble-enxufe.php');
  const readme = llig('readme.txt');
  const versio = capcalera(principal, 'Version');
  assert.equal(principal.match(/^const SOCDEPOBLE_ENXUFE_VERSIO\s*=\s*'([^']+)';/m)?.[1], versio);
  assert.equal(capcalera(readme, 'Stable tag'), versio);
  assert.equal(capcalera(principal, 'Text Domain'), 'socdepoble');
  assert.equal(capcalera(principal, 'Domain Path'), '/languages');
  assert.equal(capcalera(principal, 'License'), capcalera(readme, 'License'));
  assert.equal(readme.match(/^=== (.+) ===$/m)?.[1], capcalera(principal, 'Plugin Name'), 'el nom del readme és el del plugin');
  requisitsDe(principal, readme);

  const descripcioCurta = readme.split(/\r?\n\r?\n/)[1];
  assert.ok(descripcioCurta && !descripcioCurta.startsWith('==') && descripcioCurta.length <= 150, 'descripció curta de 150 caràcters com a màxim');
  /* Sostre local, no de WordPress.org: el seu analitzador limita paraules per
     secció (2500; FAQ i Changelog, 5000), no bytes. Ací només evita un readme
     desbocat; la Description extensa i el bloc DeepL en fan uns 13 KB. */
  assert.ok(Buffer.byteLength(readme) < 20480, 'readme de menys de 20 KB');
  const etiquetes = capcalera(readme, 'Tags').split(',').map((e) => e.trim()).filter(Boolean);
  assert.ok(etiquetes.length >= 1 && etiquetes.length <= 5, 'WordPress.org només usa 5 etiquetes');
  const avis = readme.split(/^== Upgrade Notice ==$/m)[1] ?? '';
  const versions = [...avis.matchAll(/^= (.+) =\n([^]*?)(?=^= |(?![^]))/gm)];
  assert.ok(versions.length >= 1, 'Upgrade Notice amb almenys una versió');
  for (const [, versio, text] of versions) {
    const bytes = mesuraUpgradeNotice(text);
    assert.ok(bytes <= 300, `Upgrade Notice ${versio}: ${bytes} de 300 com a màxim, mesurat com Plugin Check`);
  }

  const host = new URL(capcalera(principal, 'Update URI')).hostname;
  assert.match(llig('includes/actualitzador.php'), new RegExp(`add_filter\\(\\s*'update_plugins_${host.replace(/\./g, '\\.')}'`), 'el filtre ha de ser el del host de Update URI');

  const bloc = JSON.parse(llig('includes/bloc/block.json'));
  assert.equal(bloc.name, 'socdepoble/app');
  assert.equal(bloc.textdomain, 'socdepoble');
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
const SENSE_TRADUCCIO = new Set(['Sóc de Poble', 'Sóc de Poble — Enxufe', 'Sóc de Poble. Portal de Pobles Connectats']);

test('un sol text domain i traducció valenciana completa de tots els textos PHP', () => {
  const msgids = new Set();
  for (const [rel, text] of Object.entries(textDe)) {
    if (rel.startsWith('languages/')) continue;
    for (const m of text.matchAll(FUNCIONS_I18N)) {
      assert.equal(m[2], 'socdepoble', `${rel}: text domain «${m[2]}»`);
      msgids.add(m[1].replace(/\\'/g, '\''));
    }
    assert.doesNotMatch(text, /\b(?:__|_e|esc_html__|esc_html_e|esc_attr__|esc_attr_e|_x|_n)\(\s*"/, `${rel}: textos traduïbles entre cometes dobles`);
  }
  for (const m of llig('includes/bloc/editor.js').matchAll(/__\(\s*'[^']*'\s*,\s*'([^']*)'\s*\)/g)) assert.equal(m[1], 'socdepoble');

  const traduccio = llig('languages/socdepoble-ca.l10n.php');
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
  const json = JSON.parse(llig('languages/socdepoble-ca-socdepoble-app-editor-script.json'));
  const missatges = json.locale_data.messages;
  assert.equal(missatges[''].lang, 'ca');
  const idsEditor = [...llig('includes/bloc/editor.js').matchAll(/__\(\s*'([^']*)'\s*,\s*'socdepoble'\s*\)/g)].map((m) => m[1]);
  assert.ok(idsEditor.length >= 8);
  assert.deepEqual(idsEditor.filter((id) => !SENSE_TRADUCCIO.has(id) && !Array.isArray(missatges[id])), [], 'textos de l\'editor sense traducció');
  assert.match(llig('includes/marcatge.php'), /wp_set_script_translations\(\s*'socdepoble-app-editor-script',\s*'socdepoble',/);
});

/* ─────────────── Sòl de WordPress: la versió on naix cada API ───────────────
   WP-07 i WP-10 (auditoria 261025). Cada API de WordPress que crida el plugin,
   amb el @since del nucli o el de la forma que se'n crida (la ruta de
   block.json a register_block_type, l'array d'arguments de register_setting).
   Una API més nova que el sòl de la capçalera només hi cap amb
   function_exists/class_exists al mateix fitxer, inert (en una versió vella no
   es dispara i no trenca res) o amb una reserva que la prova troba al codi; el
   comportament de les reserves s'executa amb PHP a enxufe-pantalla.test.mjs.
   Una crida que no és a cap taula ni és de PHP fa fallar la prova: la taula no
   pot quedar arrere, i el sòl no pot tornar a pujar sense que ningú ho veja. */

const FUNCIONS_WP = {
  __: '2.1', add_action: '1.2', add_filter: '0.71', add_options_page: '1.5', add_query_arg: '1.5',
  add_settings_field: '2.7', add_settings_section: '2.7', add_shortcode: '2.5', admin_url: '2.6',
  apply_filters: '0.71', bloginfo: '0.71', body_class: '2.8', check_admin_referer: '1.2', current_user_can: '2.0',
  delete_option: '1.2', delete_site_option: '2.8', delete_site_transient: '2.9', determine_locale: '5.0',
  do_settings_sections: '2.7', esc_attr: '2.8', esc_html: '2.8', esc_html__: '2.8', esc_html_e: '2.8', esc_url: '2.8',
  esc_url_raw: '2.8', get_admin_page_title: '1.5', get_block_wrapper_attributes: '5.6', get_blog_option: '3.0',
  get_bloginfo: '0.71', get_file_data: '2.9', get_main_site_id: '4.9', get_option: '1.5', get_page_template_slug: '3.4',
  get_permalink: '1.0', get_queried_object: '3.1', get_queried_object_id: '3.1', get_site_option: '2.8',
  get_site_transient: '2.9', get_sites: '4.6', get_transient: '2.8', has_block: '5.0', has_shortcode: '3.6',
  have_posts: '1.5', home_url: '3.0', is_locale_switched: '4.7', is_multisite: '3.0', is_page: '1.5', is_php_version_compatible: '5.2',
  is_singular: '1.5', is_wp_error: '2.1', is_wp_version_compatible: '5.2',
  language_attributes: '2.1', load_plugin_textdomain: '1.5', plugin_basename: '1.5', plugin_dir_path: '2.8',
  plugins_url: '2.6', register_activation_hook: '2.0', register_block_template: '6.7',
  register_block_type: '5.8', // 5.0; amb la ruta de block.json com a primer paràmetre, 5.8
  register_rest_route: '4.4',
  register_setting: '4.7', // 2.7; amb l'array d'arguments (sanitize_callback, default), 4.7
  remove_filter: '1.2', rest_url: '4.4', restore_current_blog: '3.0', sanitize_text_field: '2.9', sanitize_title: '1.0',
  set_transient: '2.8', settings_fields: '2.7', shortcode_atts: '2.5', submit_button: '3.1', switch_to_blog: '3.0',
  the_content: '0.71', the_post: '1.5', trailingslashit: '1.2', untrailingslashit: '2.2', update_option: '1.0',
  update_site_option: '2.8', wp_add_inline_script: '4.5', wp_add_inline_style: '3.3', wp_body_open: '5.2',
  wp_cache_delete: '2.0', wp_date: '5.3', wp_delete_file: '4.2', wp_die: '2.0.4', wp_enqueue_script: '2.1',
  wp_enqueue_style: '2.6', wp_footer: '1.5.1', wp_generate_uuid4: '4.7', wp_get_environment_type: '5.5',
  wp_head: '1.2', wp_json_encode: '4.1', wp_kses: '1.0', wp_kses_post: '2.9', wp_nonce_field: '2.0.4',
  wp_parse_url: '4.7', // 4.4; amb el paràmetre $component (PHP_URL_HOST), 4.7
  wp_register_script: '2.1', wp_register_style: '2.6', wp_remote_post: '2.7', wp_remote_retrieve_body: '2.7',
  wp_remote_retrieve_response_code: '2.7', wp_safe_redirect: '2.3', wp_safe_remote_get: '3.6', wp_salt: '2.5',
  wp_set_script_translations: '5.0', wp_tempnam: '2.6', wp_unslash: '3.6'
};
const CLASSES_WP = { WP_Error: '2.1', WP_Filesystem_Base: '2.5', WP_REST_Response: '4.4' };
// De $wpdb, WP_REST_Request, WP_Error i WP_Filesystem_Base.
const METODES_WP = {
  esc_like: '4.0', get_body: '4.4', get_error_message: '2.1', get_header: '4.4', get_json_params: '4.4',
  get_var: '0.71', is_file: '2.5', is_json_content_type: '5.6', prepare: '2.3', query: '0.71'
};
// Els que el plugin enganxa o aplica; els dinàmics, amb el nom del nucli: {$…} és la part variable.
const GANXOS_WP = {
  admin_init: '2.5', admin_menu: '1.5', 'admin_post_{$action}': '2.6', all_admin_notices: '3.1', body_class: '2.8',
  change_locale: '4.7', // el de switch_to_locale() i restore_*_locale(): la reserva de idioma-local.php seguix la llengua viva (P1-09)
  'delete_site_transient_{$transient}': '3.0', 'gettext_{$domain}': '5.5', 'gettext_with_context_{$domain}': '5.5',
  http_allowed_safe_ports: { des_de: '5.9', inert: 'sense ell, només el canal de proves local en un port no estàndard deixa de respondre' },
  http_request_host_is_external: '3.6', init: '1.5', load_script_translation_file: '5.0.2', load_textdomain_mofile: '2.9',
  no_texturize_tags: '2.8', 'plugin_action_links_{$plugin_file}': '2.7',
  plugin_locale: '3.0', // el de load_plugin_textdomain, que la reserva de idioma-local.php també aplica
  plugins_api: '2.7', pre_get_document_title: '4.4',
  rest_api_init: '4.4', script_loader_tag: '4.1', site_status_tests: '5.2', template_include: '3.0',
  theme_page_templates: '3.9', 'update_plugins_{$hostname}': '5.8', upgrader_pre_download: '3.7',
  upgrader_source_selection: '2.8', wp: '2.1', wp_head: '1.2',
  wp_preload_resources: { des_de: '6.1', inert: 'abans de la 6.1 ningú no hi demana preloads, i no hi ha res a llevar' }
};
// D'altres plugins, cadascun dins de la guarda del seu plugin (seo.php).
const GANXOS_EXTERNS = new Set(['jetpack_enable_open_graph', 'rank_math/frontend/show_opengraph', 'wpseo_frontend_presenters']);
// Els globals wp.* de l'editor del bloc (editor.js, sense pas de compilació).
const EDITOR_WP = {
  'wp.blockEditor.InspectorControls': '5.2', 'wp.blockEditor.useBlockProps': '5.6', 'wp.blocks.registerBlockType': '5.0',
  'wp.components.PanelBody': '5.0', 'wp.components.Placeholder': '5.0', 'wp.components.TextControl': '5.0',
  'wp.element.Fragment': '5.0', 'wp.element.createElement': '5.0', 'wp.i18n.__': '5.0'
};
// Camps de block.json, formats de traducció i dependències d'script.
const DADES_WP = {
  'block.json apiVersion 3': { des_de: '6.3', inert: 'les versions anteriors comparen apiVersion > 1 i la tracten com la 2' },
  'block.json attributes': '5.5', 'block.json category': '5.5', 'block.json description': '5.5',
  'block.json editorScript': '5.5', 'block.json icon': '5.5', 'block.json keywords': '5.5', 'block.json name': '5.5',
  'block.json render': {
    des_de: '6.1',
    reserva: 'el render_callback de register_block_type (WP-02)',
    comprova: (t) => /register_block_type\([^;]*'render_callback'\s*=>\s*'socdepoble_enxufe_render_bloc'/.test(t['includes/marcatge.php'])
  },
  'block.json supports': '5.5', 'block.json textdomain': '5.7', 'block.json title': '5.5', 'block.json version': '5.8',
  'traduccions .l10n.php': {
    des_de: '6.5',
    // Revisió de WordPress.org (261027) · la reserva viatja amb languages/: només al canal propi.
    reserva: 'els filtres gettext_socdepoble de idioma-local.php quan no hi ha WP_Translation_Controller (WP-03)',
    comprova: (t) => /add_filter\(\s*'gettext_socdepoble'/.test(t['includes/idioma-local.php'] ?? '')
  },
  'traduccions .json de l\'editor': '5.0',
  'script react': '5.0', 'script react-dom': '5.0',
  'script react-jsx-runtime': {
    des_de: '6.6',
    reserva: 'només amb el runtime wordpress, i eixe paquet (variant del directori) declara ell mateix el 6.6',
    comprova: (t) => /'wordpress' === \( \$manifest\['runtime'\]\['amfitrio'\] \?\? null \) \? array\( 'react', 'react-dom', 'react-jsx-runtime' \) : array\(\)/.test(t['includes/marcatge.php'])
      && /'6\.6' !== \( \$runtime\['wordpressMinim'\] \?\? null \)/.test(t['includes/manifest.php'])
      && comparaVersions(capcalera(variantDirectori(t['socdepoble-enxufe.php']), 'Requires at least'), '6.6') >= 0
  },
  'script wp-block-editor': '5.2', 'script wp-blocks': '5.0', 'script wp-components': '5.0', 'script wp-element': '5.0',
  'script wp-i18n': '5.0'
};
const TAULA_WP = [
  ...Object.keys(FUNCIONS_WP).map((nom) => `funció ${nom}`), ...Object.keys(CLASSES_WP).map((nom) => `classe ${nom}`),
  ...Object.keys(METODES_WP).map((nom) => `mètode ->${nom}`), ...Object.keys(GANXOS_WP).map((nom) => `ganxo ${nom}`),
  ...Object.keys(EDITOR_WP).map((nom) => `editor ${nom}`), ...Object.keys(DADES_WP)
];

// El que crida el plugin i és de PHP, no de WordPress (comprovat amb get_defined_functions de PHP 8.4).
const PHP_INTERN = new Set([
  'array_diff', 'array_filter', 'array_key_exists', 'array_keys', 'array_map', 'array_merge', 'array_unique', 'array_unshift',
  'array_values', 'basename', 'class_exists', 'clearstatcache', 'constant', 'count', 'define', 'defined', 'dirname', 'explode',
  'file_exists', 'file_get_contents', 'filemtime', 'filesize', 'filter_var', 'function_exists', 'get_class', 'getenv', 'gmdate',
  'hash_equals', 'hash_file', 'hash_hmac', 'hex2bin', 'html_entity_decode', 'implode', 'in_array', 'is_array', 'is_int',
  'is_link', 'is_object', 'is_readable', 'is_scalar', 'is_string', 'json_decode', 'ksort', 'ltrim', 'max', 'ob_get_clean',
  'ob_start', 'preg_match', 'preg_match_all', 'preg_replace', 'preg_split', 'printf', 'range', 'rawurlencode',
  'sodium_crypto_sign_verify_detached', 'sprintf', 'str_replace', 'strlen', 'strpos', 'strtolower', 'substr', 'time', 'trim',
  'urldecode', 'version_compare'
]);
const CLASSES_PHP = new Set(['ZipArchive', 'stdClass']);
const METODES_PHP = new Set(['close', 'count', 'getNameIndex', 'open']); // ZipArchive
// Construccions del llenguatge que s'escriuen com una crida.
const CONSTRUCCIONS = new Set(['array', 'catch', 'die', 'echo', 'elseif', 'empty', 'exit', 'fn', 'for', 'foreach', 'function', 'if', 'include', 'include_once', 'isset', 'list', 'match', 'print', 'require', 'require_once', 'return', 'static', 'switch', 'unset', 'use', 'while']);

/** -1, 0 o 1, com version_compare amb versions de WordPress («0.71», «2.0.4», «5.8»). */
function comparaVersions(a, b) {
  const [x, y] = [a, b].map((versio) => versio.split('.').map(Number));
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0) ? 1 : -1;
  }
  return 0;
}

const desDe = (entrada) => (typeof entrada === 'string' ? entrada : entrada.des_de);
const patroDeGanxo = (clau) => new RegExp(`^${clau.split(/\{\$\w+\}/).map((tros) => tros.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('.+')}$`);
/** El nom del nucli d'un ganxo: el més llarg que hi casa (gettext_with_context_{$domain} abans que gettext_{$domain}). */
const ganxoDelNucli = (nom) => Object.keys(GANXOS_WP).filter((clau) => patroDeGanxo(clau).test(nom)).sort((a, b) => b.length - a.length)[0];

/** Cada crida del plugin a WordPress amb la seua entrada de la taula, i les que no hi són. */
function usosDeWordPress(textos) {
  const usos = [];
  const fora = [];
  const anota = (api, entrada, rel, guarda = false) => {
    if (entrada === undefined) fora.push(`${rel}: ${api}`);
    else usos.push({ api, entrada, rel, guarda });
  };
  const php = Object.entries(textos).filter(([rel]) => rel.endsWith('.php'));
  const definides = new Set(php.flatMap(([, text]) => [...nomesCodi(text).matchAll(/\bfunction\s+&?\s*(\w+)\s*\(/g)].map((m) => m[1])));
  const funcio = (nom, rel, text) => {
    if (definides.has(nom) || PHP_INTERN.has(nom)) return;
    anota(`funció ${nom}`, FUNCIONS_WP[nom], rel, new RegExp(`\\bfunction_exists\\(\\s*'${nom}'\\s*\\)`).test(text));
  };
  for (const [rel, text] of php) {
    const codi = nomesCodi(text);
    const ambCadenes = nomesCodi(text, true);
    for (const [, prefix = '', nom] of codi.matchAll(/(->|::|\bnew\s+|\bfunction\s+&?\s*|\$)?\b([A-Za-z_]\w*)\s*\(/g)) {
      if (prefix.startsWith('function') || prefix === '$' || prefix === '::' || CONSTRUCCIONS.has(nom)) continue;
      if (prefix === '->') {
        if (!METODES_PHP.has(nom)) anota(`mètode ->${nom}`, METODES_WP[nom], rel);
      } else if (!prefix) funcio(nom, rel, text);
    }
    for (const [, nom] of codi.matchAll(/(?:\bnew\s+|\binstanceof\s+|\b(?=\w+::))([A-Za-z_]\w*)/g)) {
      if (!CLASSES_PHP.has(nom)) anota(`classe ${nom}`, CLASSES_WP[nom], rel, new RegExp(`\\bclass_exists\\(\\s*'${nom}'\\s*\\)`).test(text));
    }
    // Callbacks entre cometes que no són del plugin (array_map( 'wp_kses_post' ), …).
    for (const [, nom] of ambCadenes.matchAll(/(?:array_map\(\s*|_callback'\s*=>\s*|add_(?:filter|action)\(\s*'[^']*',\s*|register_activation_hook\(\s*[^,]+,\s*)'(\w+)'/g)) {
      funcio(nom, rel, text);
    }
    // Un nom que continua amb « . » és el prefix fix d'un ganxo dinàmic.
    for (const [, fix, concatena] of ambCadenes.matchAll(/\b(?:(?:add|remove)_(?:filter|action)|apply_filters|do_action)\(\s*'([^']+)'(\s*\.)?/g)) {
      const nom = concatena ? `${fix}…` : fix;
      if (nom.startsWith('socdepoble') || GANXOS_EXTERNS.has(nom)) continue;
      const clau = ganxoDelNucli(nom);
      anota(`ganxo ${clau ?? nom}`, clau && GANXOS_WP[clau], rel);
    }
    for (const [, handle] of ambCadenes.matchAll(/'(react(?:-dom|-jsx-runtime)?|wp-[a-z0-9-]+)'/g)) {
      anota(`script ${handle}`, DADES_WP[`script ${handle}`], rel);
    }
  }
  for (const [, paquet, nom] of textos['includes/bloc/editor.js'].matchAll(/\bwp\.(\w+)\.(\w+)/g)) {
    anota(`editor wp.${paquet}.${nom}`, EDITOR_WP[`wp.${paquet}.${nom}`], 'includes/bloc/editor.js');
  }
  // El $schema només el llegixen els editors de codi.
  for (const [clau, valor] of Object.entries(JSON.parse(textos['includes/bloc/block.json'])).filter(([clau]) => clau !== '$schema')) {
    const api = clau === 'apiVersion' ? `block.json apiVersion ${valor}` : `block.json ${clau}`;
    anota(api, DADES_WP[api], 'includes/bloc/block.json');
  }
  const idiomes = Object.keys(textos).filter((rel) => rel.startsWith('languages/'));
  if (idiomes.some((rel) => rel.endsWith('.l10n.php')) && !idiomes.some((rel) => rel.endsWith('.mo'))) anota('traduccions .l10n.php', DADES_WP['traduccions .l10n.php'], 'languages/');
  if (idiomes.some((rel) => rel.endsWith('.json'))) anota('traduccions .json de l\'editor', DADES_WP['traduccions .json de l\'editor'], 'languages/');
  return { usos, fora };
}

const TEXTOS = Object.fromEntries([...PHP, ...fitxersDe('languages', '.json'), 'includes/bloc/editor.js', 'includes/bloc/block.json'].map((rel) => [rel, llig(rel)]));
/** Els usos que fixen el sòl: sense guarda, sense ser inerts i sense reserva al codi. */
const usosSensePont = (textos) => usosDeWordPress(textos).usos.filter(({ entrada, guarda }) => !guarda && !entrada.inert && !entrada.comprova?.(textos));
/** Les APIs més noves que `sol` sense guarda ni reserva, com a «api (versió) a fitxer». */
const perDamuntDelSol = (sol, textos = TEXTOS) => [...new Set(usosSensePont(textos)
  .filter(({ entrada }) => comparaVersions(desDe(entrada), sol) > 0)
  .map(({ api, entrada, rel }) => `${api} (${desDe(entrada)}) a ${rel}`))].sort();
/** La versió més baixa de WordPress on funciona el codi. */
const solMinim = (textos = TEXTOS) => usosSensePont(textos).map(({ entrada }) => desDe(entrada)).reduce((a, b) => (comparaVersions(a, b) >= 0 ? a : b));

test('sòl de WordPress: cada API que crida el plugin té la seua versió a la taula, i cap no passa del sòl de la capçalera sense guarda', () => {
  assert.equal(comparaVersions('5.8', '5.10'), -1);
  assert.equal(comparaVersions('2.0.4', '2.0'), 1);
  assert.equal(comparaVersions('6.5', '6.5.0'), 0);
  assert.equal(ganxoDelNucli('gettext_with_context_socdepoble'), 'gettext_with_context_{$domain}');
  assert.equal(ganxoDelNucli('gettext_socdepoble'), 'gettext_{$domain}');
  assert.equal(ganxoDelNucli('init_tard'), undefined, 'un ganxo sense part variable casa sencer');

  const { usos, fora } = usosDeWordPress(TEXTOS);
  assert.deepEqual(fora, [], 'crides sense versió: afegiu-les a la taula amb el @since del nucli, o a PHP_INTERN si són de PHP');
  const usades = new Set(usos.map(({ api }) => api));
  assert.deepEqual(TAULA_WP.filter((api) => !usades.has(api)), [], 'entrades de la taula que el plugin ja no crida');
  for (const { api, entrada } of usos) {
    assert.match(desDe(entrada), /^\d+\.\d+(?:\.\d+)?$/, api);
    if (typeof entrada !== 'string') assert.ok(entrada.inert || (entrada.reserva && entrada.comprova), `${api}: sense guarda, la taula diu per què`);
  }
  assert.ok(usos.some(({ api, guarda }) => api === 'funció register_block_template' && guarda), 'register_block_template (6.7) va amb function_exists');

  const sol = capcalera(llig('socdepoble-enxufe.php'), 'Requires at least');
  assert.deepEqual(perDamuntDelSol(sol), [], `APIs més noves que el sòl ${sol} sense guarda`);
});

test('sòl de WordPress 5.8: el codi ja hi funciona, i sense el render_callback o sense la reserva de traduccions tornaria a pujar', () => {
  /* La capçalera continua en 6.5: baixar-la va amb la variant del paquet
     (WP-01), i és decisió del Mestre. Ací només es comprova que el codi ja no
     és el que ho impedix. */
  assert.deepEqual(perDamuntDelSol('5.8'), []);
  assert.equal(solMinim(), '5.8', 'register_block_type amb la ruta de block.json, update_plugins_{$hostname} i el camp version de block.json');
  assert.ok(perDamuntDelSol('5.7').includes('funció register_block_type (5.8) a includes/marcatge.php'));

  // Controls negatius: el codi d'abans de WP-02 i de WP-03.
  const marcatge = TEXTOS['includes/marcatge.php'];
  const senseCallback = marcatge.replace(",\n\t\tarray( 'render_callback' => 'socdepoble_enxufe_render_bloc' )\n\t);", "\n\t);");
  assert.notEqual(senseCallback, marcatge, 'el registre del bloc té la forma que la prova espera');
  assert.deepEqual(perDamuntDelSol('5.8', { ...TEXTOS, 'includes/marcatge.php': senseCallback }), ['block.json render (6.1) a includes/bloc/block.json']);
  assert.equal(solMinim({ ...TEXTOS, 'includes/marcatge.php': senseCallback }), '6.1');

  const idioma = TEXTOS['includes/idioma-local.php'];
  const senseReserva = idioma.replace(/\n\tif \( class_exists\( 'WP_Translation_Controller' \)[^]*?\n\}\nadd_action\( 'init'/, "\n}\nadd_action( 'init'");
  assert.notEqual(senseReserva, idioma, 'la reserva té la forma que la prova espera');
  assert.deepEqual(perDamuntDelSol('5.8', { ...TEXTOS, 'includes/idioma-local.php': senseReserva }), ['traduccions .l10n.php (6.5) a languages/']);
  assert.equal(solMinim({ ...TEXTOS, 'includes/idioma-local.php': senseReserva }), '6.5');
});

/* Revisió de WordPress.org (261027) · La variant del directori no porta languages/ ni
   idioma-local.php (foraDelDirectori de l'empaquetador), i les capçaleres del seu fitxer principal
   són les de variantDirectori() (la taula ja la hi aplica per a react-jsx-runtime). La mateixa taula
   de versions, sobre el que hi viatja de veritat: cap traducció local ni cap load_plugin_textdomain,
   i res per damunt del seu sòl. */
test('sòl de WordPress de la variant del directori: sense traduccions locals ni load_plugin_textdomain, i res per damunt del seu Requires at least', () => {
  const directori = Object.fromEntries(Object.entries(TEXTOS).filter(([rel]) => !foraDelDirectori(rel)));
  const principal = variantDirectori(directori['socdepoble-enxufe.php']);
  assert.ok('includes/idioma-local.php' in TEXTOS && Object.keys(TEXTOS).some((rel) => rel.startsWith('languages/')), 'el canal propi les porta');
  assert.deepEqual(Object.keys(directori).filter((rel) => rel.startsWith('languages/') || rel === 'includes/idioma-local.php'), []);
  const { usos, fora } = usosDeWordPress(directori);
  // Les funcions que només porta el canal propi (actualitzador.php), sempre darrere de function_exists.
  const senseGuarda = fora.filter((entrada) => {
    const [, rel, nom] = entrada.match(/^(.+): funció (socdepoble_enxufe_\w+)$/) ?? [];
    return !nom || !new RegExp(`\\bfunction_exists\\(\\s*'${nom}'\\s*\\)`).test(directori[rel]);
  });
  assert.deepEqual(senseGuarda, [], 'cap crida sense versió ni cap funció absent al directori sense function_exists');
  const apis = new Set(usos.map(({ api }) => api));
  for (const api of ['traduccions .l10n.php', 'traduccions .json de l\'editor', 'funció load_plugin_textdomain', 'ganxo gettext_{$domain}']) {
    assert.ok(!apis.has(api), `${api} no viatja al directori`);
  }
  assert.ok(apis.has('ganxo load_textdomain_mofile') && apis.has('ganxo load_script_translation_file'), 'la correspondència ca_valencia → ca (idioma.php) sí');
  assert.doesNotMatch(Object.values(directori).join('\n'), /load_plugin_textdomain/);
  const sol = capcalera(principal, 'Requires at least');
  assert.equal(sol, '6.6');
  assert.equal(capcalera(principal, 'Domain Path'), null, 'cap Domain Path cap a una carpeta absent');
  assert.equal(capcalera(principal, 'Text Domain'), 'socdepoble');
  assert.deepEqual(perDamuntDelSol(sol, directori), []);
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

/* Gauntlet 261025_0545 (MISSED P3, WP-01 C) · Sense intèrpret, la forma: update_plugins i plugins_api
   parlen amb la identitat del canal propi, mai amb l'slug del directori ('socdepoble', el plugin de
   WordPress.org), i el motiu de l'arrel nomena la carpeta que es comprova. La prova amb PHP real és a
   enxufe-empaqueta.test.mjs. */
test('actualitzador: update_plugins i plugins_api responen per l\'slug del canal propi, no pel del directori', () => {
  const actualitzador = llig('includes/actualitzador.php');
  const canal = actualitzador.match(/^const SOCDEPOBLE_ENXUFE_SLUG_CANAL\s*=\s*'([^']+)';/m)?.[1];
  const directori = llig('socdepoble-enxufe.php').match(/^const SOCDEPOBLE_ENXUFE_SLUG\s*=\s*'([^']+)';/m)?.[1];
  assert.ok(canal, 'falta SOCDEPOBLE_ENXUFE_SLUG_CANAL');
  assert.notEqual(canal, directori, 'la identitat del canal no pot ser l\'slug de WordPress.org');
  assert.ok(actualitzador.includes(`const SOCDEPOBLE_ENXUFE_PAQUET_SIMBOLIC = '${canal}:';`), 'la mateixa identitat que el paquet simbòlic');
  const api = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_plugins_api');
  assert.match(api, /SOCDEPOBLE_ENXUFE_SLUG_CANAL !== \$args->slug/);
  assert.match(api, /\$info->slug\s*=\s*SOCDEPOBLE_ENXUFE_SLUG_CANAL;/);
  assert.doesNotMatch(api, /\bSOCDEPOBLE_ENXUFE_SLUG\b/, 'plugins_api no mira mai l\'slug del directori');
  assert.match(cosDe('includes/actualitzador.php', 'socdepoble_enxufe_update_plugins'), /'slug'\s*=>\s*SOCDEPOBLE_ENXUFE_SLUG_CANAL,/);
  assert.doesNotMatch(actualitzador, /__\(\s*'[^']*socdepoble-enxufe folder/, 'cap missatge nomena una carpeta que no es comprova');
  assert.match(cosDe('includes/actualitzador.php', 'socdepoble_enxufe_motiu_arrel'), /SOCDEPOBLE_ENXUFE_SLUG,/);
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
  const avis = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_avis_automatiques');
  assert.match(avis, /return \$html;/, 'estandarditzat: no altera la cel·la d\'actualitzacions automàtiques');
});

test('readme: el paràgraf del canal explica el commutador en una sola línia, i la variant del directori el lleva sencer', () => {
  const readme = llig('readme.txt');
  const paragraf = readme.match(/^Update channel \(.*$/m)?.[0] ?? '';
  assert.match(paragraf, /Automatic updates remain disabled until enabled/, 'l\'administrador decidix');
  assert.match(paragraf, /with the plugin active; activation clears the update cache/, 'per què el commutador pot tardar i què el fa eixir');
  assert.match(paragraf, /WP-Cron/, 'les automàtiques depenen del cron de WordPress');
  assert.doesNotMatch(variantDirectoriReadme(readme), /Automatic updates remain disabled|WP-Cron/, 'al directori les automàtiques són les natives de WordPress.org');
  assert.equal(readme.match(/^Stable tag:/gm)?.length, 1, 'estampaReadme exigix una sola línia');
  assert.equal(readme.match(/^Update channel \(/gm)?.length, 1, 'variantDirectoriReadme lleva un sol paràgraf');
  assert.deepEqual(patronsActualitzadorEn([{ nom: 'readme.txt', dades: Buffer.from(variantDirectoriReadme(readme)) }]), [], 'fora del paràgraf del canal, cap línia del readme pot casar un patró d\'actualitzador');
});

test('doble còpia: el fitxer principal no declara cap funció ni classe, i la guarda va abans de cap constant', () => {
  const principal = llig('socdepoble-enxufe.php');
  const codi = codiDe['socdepoble-enxufe.php'];
  /* PHP vincula les funcions i classes de nivell superior en compilar el
     fitxer: una segona còpia petaria amb «Cannot redeclare» abans de la guarda. */
  assert.doesNotMatch(codi, /\bfunction\s+&?\s*\w+\s*\(/, 'només clausures al fitxer principal');
  assert.doesNotMatch(codi, /\b(?:class|interface|trait|enum)\s+\w+/);
  const guarda = principal.indexOf("if ( defined( 'SOCDEPOBLE_ENXUFE_FITXER' ) ) {");
  assert.ok(guarda > principal.indexOf("defined( 'ABSPATH' ) || exit;"), 'guarda després de l\'accés directe');
  assert.ok(guarda < principal.search(/^const /m) && guarda < principal.indexOf('require_once'), 'guarda abans de cap constant i de cap include');
  const cos = principal.slice(guarda, principal.search(/^const /m));
  assert.match(cos, /defined\( 'WP_SANDBOX_SCRAPING' \) && WP_SANDBOX_SCRAPING/);
  assert.match(cos, /register_activation_hook\(\s*__FILE__,\s*static function/, 'refusa l\'activació de la segona còpia');
  assert.match(cos, /wp_die\([^]*esc_html\([^]*array\( 'back_link' => true \)/);
  assert.match(cos, /add_action\(\s*'all_admin_notices',\s*static function[^]*current_user_can\( 'activate_plugins' \)/);
  assert.match(cos, /dirname\( SOCDEPOBLE_ENXUFE_FITXER \)[^]*__DIR__/, 'nomena les dues carpetes');
  assert.match(cos, /\n\treturn;\n\}\n+$/, 'la segona còpia no carrega res més');
  assert.match(llig('includes/idioma-local.php'), /^add_action\( 'init', 'socdepoble_enxufe_carrega_traduccions', 1 \);$/m);
  /* Revisió de WordPress.org (261027) · idioma-local.php és opcional, com l'actualitzador, i va
     just després de idioma.php, que definix socdepoble_enxufe_fitxer_ca. */
  const local = "if ( is_readable( __DIR__ . '/includes/idioma-local.php' ) ) {\n\trequire_once __DIR__ . '/includes/idioma-local.php';\n}\n";
  assert.ok(principal.includes(`require_once __DIR__ . '/includes/idioma.php';\n/* `) && principal.includes(local), 'inclusió condicional');
  assert.ok(principal.indexOf(local) > principal.indexOf("require_once __DIR__ . '/includes/idioma.php';") && principal.indexOf(local) < principal.indexOf("require_once __DIR__ . '/includes/copies.php';"));
  assert.match(cosDe('includes/idioma.php', 'socdepoble_enxufe_fitxer_ca'), /socdepoble-ca/);
  assert.doesNotMatch(llig('includes/idioma.php'), /load_plugin_textdomain|socdepoble_enxufe_carrega_traduccions|gettext_socdepoble/, 'idioma.php només porta el que servix a les dues variants');

  /* Activació a tota la xarxa: la còpia d'un lloc secundari no es carrega i
     la guarda no la veu. El refús va abans del ganxo de l'actualitzador. */
  const refus = principal.indexOf("register_activation_hook( SOCDEPOBLE_ENXUFE_FITXER, 'socdepoble_enxufe_refusa_xarxa_amb_copies' );");
  assert.ok(refus > principal.indexOf("require_once __DIR__ . '/includes/copies.php';") && refus < principal.indexOf('/includes/actualitzador.php'));
  assert.match(cosDe('includes/copies.php', 'socdepoble_enxufe_refusa_xarxa_amb_copies'), /wp_die\([^]*esc_html\([^]*array\( 'back_link' => true \)/);
  /* uninstall.php l'inclou amb el plugin inactiu: sense constants ni ganxos. */
  assert.doesNotMatch(codiDe['includes/copies.php'].replace(/\nfunction [^]*?\n\}\n/g, '\n'), /SOCDEPOBLE_ENXUFE_|add_action|add_filter|register_activation_hook/);

  /* uninstall.php: dues còpies esborrades alhora l'inclouen dues vegades. */
  const desinstalla = codiDe['uninstall.php'];
  const declarades = [...desinstalla.matchAll(/\bfunction\s+(\w+)\s*\(/g)].map((m) => m[1]);
  assert.ok(declarades.length >= 1);
  for (const nom of declarades) assert.match(llig('uninstall.php'), new RegExp(`if \\( ! function_exists\\( '${nom}' \\) \\) \\{\\n\\t/\\*\\*[^]*?\\n\\tfunction ${nom}\\(`), `${nom} dins de function_exists`);
  assert.match(llig('uninstall.php'), /^if \( ! function_exists\( 'socdepoble_enxufe_altres_copies_actives' \) \) \{\n\trequire __DIR__ \. '\/includes\/copies\.php';\n\}$/m, 'les còpies es busquen amb la funció de l\'activació de xarxa');
  assert.ok(llig('uninstall.php').indexOf('if ( array() !== socdepoble_enxufe_altres_copies_actives( WP_UNINSTALL_PLUGIN ) ) {') < llig('uninstall.php').search(/^(?:if \( is_multisite|\tdelete_option)/m), 'cap esborrat abans de mirar les altres còpies');
});

test('readme a «Mostra els detalls», plantilla de blocs i getenv protegit', () => {
  const api = cosDe('includes/actualitzador.php', 'socdepoble_enxufe_plugins_api');
  assert.match(api, /socdepoble_enxufe_seccions_readme\(\)/, 'WordPress no llig mai el readme local');
  assert.match(api, /array_map\(\s*'wp_kses_post',\s*\$seccions\s*\)/);
  assert.doesNotMatch(api, /'6\.5'|'7\.4'/, 'els requisits ixen de les capçaleres, no de literals');
  assert.match(api, /get_file_data\(/);
  assert.match(cosDe('includes/actualitzador.php', 'socdepoble_enxufe_linia_readme'), /esc_html\(\s*\$text\s*\)/, 'escapa abans de transformar');

  const registre = cosDe('includes/marcatge.php', 'socdepoble_enxufe_registra_plantilla_blocs');
  assert.match(registre, /if \( ! function_exists\( 'register_block_template' \) \) \{\n\t\treturn;/, 'WordPress 6.5 i 6.6 no el tenen');
  assert.match(registre, /SOCDEPOBLE_ENXUFE_SLUG \. '\/\/' \. SOCDEPOBLE_ENXUFE_PLANTILLA/, 'el mateix slug que l\'opció clàssica');
  assert.match(registre, /'post_types'\s*=>\s*array\( 'page' \)/);
  const tria = cosDe('includes/marcatge.php', 'socdepoble_enxufe_tria_plantilla');
  assert.match(tria, /global \$_wp_current_template_id;/);
  assert.match(tria, /'template-canvas\.php' === basename\(/);
  assert.match(llig('templates/pantalla-completa.php'), /^socdepoble_enxufe_estils_pantalla\(\);$/m, 'un sol CSS per a les dues plantilles');
  assert.equal(capcalera(llig('socdepoble-enxufe.php'), 'Requires at least'), '6.5', 'en 6.5 i 6.6 la plantilla es tria a l\'Edició ràpida (readme)');

  assert.match(cosDe('includes/traduccio.php', 'socdepoble_enxufe_deepl_clau'), /function_exists\( 'getenv' \) \? getenv\( 'DEEPL_API_KEY' \)/, 'getenv pot estar a disable_functions');
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

/* Esquelet de càrrega (ordre del Mestre, 261016): dins de <soc-de-poble> va
   el text literal «Carregant el mur...», amb tres punts ASCII, sense «del
   poble» i sense traducció. Un sol lloc el construïx, i la instància de
   WordPress i la referència copiable el compartixen. La conducta amb PHP real,
   també amb el wptexturize de WordPress, és a tests/conformitat-amfitrio.test.mjs. */
const ESQUELET_DE_CARREGA = 'Carregant el mur...';

test('esquelet de càrrega: l’element diu literalment «Carregant el mur...», sense traduir, i wptexturize no el toca', () => {
  const element = cosDe('includes/marcatge.php', 'socdepoble_enxufe_element');
  assert.match(element, /\n\treturn '<soc-de-poble' \. \$atributs \. '>Carregant el mur\.\.\.<\/soc-de-poble>';\n\}/, 'el text exacte, entre l\'obertura i el tancament de l\'element');
  assert.doesNotMatch(element, /del poble/i, 'mai «del poble»');
  assert.doesNotMatch(element, /…|&#8230;|&hellip;/, 'tres punts ASCII, ni el caràcter ni l\'entitat de l\'el·lipsi');
  assert.doesNotMatch(element, /\b(?:__|_e|_x|esc_html__|esc_html_e|esc_attr__|esc_attr_e)\(\s*'Carregant/, 'literal: cap funció de traducció');

  // Un sol lloc al plugin, una sola vegada, i cap traducció que el canvie.
  assert.deepEqual(PHP.filter((rel) => llig(rel).includes('Carregant')), ['includes/marcatge.php']);
  assert.equal(llig('includes/marcatge.php').split(ESQUELET_DE_CARREGA).length, 2);

  /* El render del bloc (do_blocks, prioritat 9 de the_content) i les
     plantilles de blocs passen per wptexturize després del marcatge, i els
     tres punts eixirien com a &#8230;. */
  assert.match(llig('includes/marcatge.php'), /^add_filter\( 'no_texturize_tags', 'socdepoble_enxufe_sense_texturitzar' \);$/m);
  assert.match(cosDe('includes/marcatge.php', 'socdepoble_enxufe_sense_texturitzar'), /\n\t\$etiquetes\[\] = 'soc-de-poble';\n\treturn \$etiquetes;\n\}/, 'afig l\'element i conserva la llista');
});

/* A1 (decisió del Mestre, 261003): el plugin és cec al tenant. No el desa, no
   l'emet per cap canal, no el mostra i no gasta el configura() de l'App. La
   conducta amb PHP real és a tests/conformitat-amfitrio.test.mjs. */
test('A1 · cap PHP emet ni mostra un tenant, cap empeny la cua, i l’opció heretada es neteja sense tocar res més', () => {
  // Fora de la neteja, cap línia de codi del plugin (sense comentaris ni cadenes) parla de tenant.
  const neteja = 'socdepoble_enxufe_oblida_tenant_heretat';
  for (const [rel, codi] of Object.entries(codiDe)) {
    if (rel.startsWith('languages/')) continue;
    assert.doesNotMatch(codi.replaceAll(neteja, ''), /tenant/i, `${rel}: codi que parla de tenant`);
  }
  for (const rel of PHP.filter((f) => !f.startsWith('languages/'))) {
    const text = llig(rel);
    assert.doesNotMatch(text, /SocDePobleCua/, `${rel}: el plugin no empeny res a la cua`);
    assert.doesNotMatch(text, /tenant-id|'tenant'\s*=>|Tenant ID \(UUID\)|Village data scope/, `${rel}: cap camp, atribut ni fila de tenant`);
  }
  // L'única clau tenantId que nomena el plugin és la que la neteja esborra.
  const ajustos = llig('includes/ajustos.php');
  assert.equal([...ajustos.matchAll(/'tenantId'/g)].length, 2, 'array_key_exists i unset');
  const cos = cosDe('includes/ajustos.php', neteja);
  assert.match(cos, /array_key_exists\( 'tenantId', \$opcio \)/);
  assert.match(cos, /unset\( \$opcio\['tenantId'\] \);\n\tupdate_option\( SOCDEPOBLE_ENXUFE_OPCIO, \$opcio \);/, 'esborra la clau i desa la resta tal qual');
  assert.match(ajustos, /^add_action\( 'admin_init', 'socdepoble_enxufe_oblida_tenant_heretat', 5 \);$/m, 'abans de register_setting: no passa pel sanejador');
  assert.match(ajustos, /^add_action\( 'admin_init', 'socdepoble_enxufe_registra_ajustos' \);$/m);
  // La diagnosi, el manifest local i la declaració de la pàgina ja no porten cap tenant.
  assert.doesNotMatch(cosDe('includes/ajustos.php', 'socdepoble_enxufe_diagnosi'), /tenant|scope/i);
  // Els dos camps que queden no els segella el paquet: el text de la secció ja no ho promet.
  assert.doesNotMatch(cosDe('includes/ajustos.php', 'socdepoble_enxufe_seccio_amfitrio'), /sealed|package/i);
  // La neteja va en admin_init (qualsevol pàgina de wp-admin, també admin-ajax.php): el readme no la lliga a cap administrador.
  assert.doesNotMatch(llig('readme.txt'), /administrator opens the dashboard/);
  assert.equal([...llig('readme.txt').matchAll(/the next time the WordPress admin area loads/g)].length, 2, 'Changelog i Upgrade Notice');
  assert.doesNotMatch(cosDe('includes/manifest.php', 'socdepoble_enxufe_valida_manifest'), /tenant/i);
  assert.doesNotMatch(cosDe('includes/marcatge.php', 'socdepoble_enxufe_declara_amfitrio'), /get_option|configura|Cua/,
    'només el global, a partir de socdepoble_enxufe_config()');
});

/* ───────────────────────── ESLint i caràcters vetats ───────────────────────── */

const JS_DEL_TORN = [
  'wordpress-plugin/includes/bloc/editor.js',
  'wordpress-plugin/eines/empaqueta.mjs',
  'tests/enxufe-plugin.test.mjs',
  'tests/enxufe-empaqueta.test.mjs',
  'tests/enxufe-pantalla.test.mjs',
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
