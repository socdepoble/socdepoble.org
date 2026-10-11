// @vitest-environment node
/** Onada 11 (261010; prompt 261010_1730, tasca 7) · SEO dinàmic per a WhatsApp
 *  al plugin de WordPress: wordpress-plugin/includes/seo.php.
 *
 *  A la màquina no hi ha PHP i el hook no en deixa executar: ací es llig el
 *  PHP com a text, com fan tests/enxufe-*.test.mjs, i es fixa la forma que no
 *  pot tornar arrere:
 *   · inert per defecte: res sense el filtre socdepoble_enxufe_seo a true ni
 *     sense ?sdp=, i la ruta passa per socdepoble_enxufe_ruta() (marcatge.php);
 *   · Model B: cap URL de backend, cap clau, cap crida de xarxa; només llig la
 *     taula del paquet (dist/seo-routes.json);
 *   · el que llig de la taula és el que escriu tooling/gates/build-seo-manifest.mjs;
 *   · resolució àlies → ruta exacta → secció, i tota eixida escapada;
 *   · els og:* dels connectors de SEO es lleven amb comprovació i només en
 *     eixa petició.
 *  Viu a tests/*.test.js (vitest, environment node): les proves node de tests/
 *  s'han de classificar a tooling/tests/node-suite-manifest.json, que este
 *  torn no pot escriure. L'estructura PHP (guarda, delimitadors, callbacks
 *  nomenats, traducció) la cobrix tests/enxufe-plugin.test.mjs per a tots els
 *  PHP del plugin, seo.php inclòs.
 *
 *  Onada 12 (261011; ordres 261011_0130, punt 3, D-19 i D-20) · Decisió de
 *  Direcció Tècnica: MODE PARÀMETRE ESTRICTE i TAULA ESTÀTICA. Ací es fixa:
 *   · l'interruptor continua sent el filtre, apagat per defecte, i a més cal
 *     que socdepoble_enxufe_ruta_a_url diga 'parametre' (amb 'fragment' l'App
 *     no obri la ruta d'un ?sdp=);
 *   · el valor de ?sdp= ha de ser JA la ruta sanejada: res es corregix;
 *   · la taula és la llista blanca i res de la petició es reflectix: l'og:url
 *     es fa amb la clau de la fila (la ruta canònica);
 *   · cap reescriptura /sdp/<ruta> ni cap lectura del node: ni regles de
 *     rewrite ni REQUEST_URI ni xarxa. */
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');
const SEO = llig('wordpress-plugin/includes/seo.php');
const PRINCIPAL = llig('wordpress-plugin/socdepoble-enxufe.php');
const PRODUCTOR = llig('tooling/gates/build-seo-manifest.mjs');

/** El codi que PHP executa: sense comentaris de bloc ni de línia (// i phpcs). */
const senseComentaris = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^[ \t]*\/\/.*$/gm, '');
const CODI = senseComentaris(SEO);

/** El cos d'una funció, des de la seua declaració fins a la següent. */
function cosDe(funcio) {
  const inici = SEO.indexOf(`function ${funcio}(`);
  expect(inici, `${funcio}() ha d'existir a seo.php`).toBeGreaterThanOrEqual(0);
  const fi = SEO.indexOf('\nfunction ', inici + 1);
  return SEO.slice(inici, fi < 0 ? SEO.length : fi);
}

/** Les línies de nivell superior que registren ganxos (fora de cap funció). */
const ganxosDeNivellSuperior = () => [...CODI.matchAll(/^add_(?:action|filter)\(\s*'([^']+)',\s*'(\w+)'(?:,\s*(\d+))?\s*\);$/gm)]
  .map((m) => ({ ganxo: m[1], callback: m[2], prioritat: m[3] === undefined ? 10 : Number(m[3]) }));

describe('seo.php · esborrany inert de l’OpenGraph de la ruta', () => {
  test('forma mínima d’un include del plugin i cap text traduïble (el fitxer no pinta res per a persones)', () => {
    expect(SEO.startsWith('<?php\n')).toBe(true);
    expect(SEO).toMatch(/^defined\( 'ABSPATH' \) \|\| exit;$/m);
    expect(SEO.endsWith('\n')).toBe(true);
    expect(SEO).not.toMatch(/\r/);
    expect(CODI).not.toMatch(/\b(?:__|_e|_x|_n|esc_html__|esc_html_e|esc_attr__|esc_attr_e)\(/);
    expect(SEO).toMatch(/Onada 11 \(261010; prompt 261010_1730, tasca 7\)/);
  });

  test('el fitxer principal el requerix després de marcatge.php (d’on pren el sanejador) i declara la ruta de la taula', () => {
    expect(PRINCIPAL).toMatch(/^require_once __DIR__ \. '\/includes\/seo\.php';$/m);
    expect(PRINCIPAL.indexOf("/includes/seo.php'")).toBeGreaterThan(PRINCIPAL.indexOf("/includes/marcatge.php'"));
    expect(PRINCIPAL).toMatch(/^const SOCDEPOBLE_ENXUFE_SEO_RUTES = 'dist\/seo-routes\.json';$/m);
    expect(PRODUCTOR).toMatch(/R\('wordpress-plugin\/dist\/seo-routes\.json'\)/);
    expect(cosDe('socdepoble_enxufe_seo_taula')).toMatch(/plugin_dir_path\( SOCDEPOBLE_ENXUFE_FITXER \) \. SOCDEPOBLE_ENXUFE_SEO_RUTES/);
  });

  test('inert per defecte: el filtre socdepoble_enxufe_seo val false i es mira abans de llegir res de la petició', () => {
    /* Onada 12 (261011; D-19) · La porta és socdepoble_enxufe_seo_actiu(): el
       filtre a true estricte (per defecte, false) i el mode 'parametre' (per
       defecte, 'fragment', el mateix valor per defecte que marcatge.php). */
    const actiu = senseComentaris(cosDe('socdepoble_enxufe_seo_actiu'));
    expect(actiu, 'comparació estricta amb true i false per defecte')
      .toMatch(/if \( true !== apply_filters\(\s*'socdepoble_enxufe_seo',\s*false\s*\) \) \{\n\t\treturn false;/);
    expect(actiu).toMatch(/return 'parametre' === apply_filters\( 'socdepoble_enxufe_ruta_a_url', 'fragment' \);/);
    expect(actiu).not.toMatch(/\$_/);
    expect(llig('wordpress-plugin/includes/marcatge.php')).toMatch(/apply_filters\( 'socdepoble_enxufe_ruta_a_url', 'fragment' \)/);
    // Els dos únics filtres que es consulten, i cap val true per defecte.
    expect([...new Set([...CODI.matchAll(/apply_filters\(\s*'([^']+)',\s*([^)]+?)\s*\)/g)].map((m) => `${m[1]}=${m[2]}`))].sort())
      .toEqual(["socdepoble_enxufe_ruta_a_url='fragment'", 'socdepoble_enxufe_seo=false']);
    const ruta = cosDe('socdepoble_enxufe_seo_ruta_demanada');
    // Correcció S3 · I al costat, que el paràmetre siga un de sol i escrit «sdp» (la consulta crua).
    const porta = ruta.search(/if \( ! socdepoble_enxufe_seo_actiu\(\) \|\| ! socdepoble_enxufe_seo_parametre_unic\(\) \) \{\n\t\treturn '';/);
    expect(porta, 'la porta es mira abans de llegir res de la petició').toBeGreaterThanOrEqual(0);
    expect(porta).toBeLessThan(ruta.indexOf('$_GET'));
    expect(ruta).toMatch(/isset\( \$_GET\['sdp'\] \)/);
    expect(ruta).toMatch(/is_string\( \$_GET\['sdp'\] \)/);
    /* Forma estricta: el sanejador de ruta-inicial (marcatge.php) sobre el
       valor sense barres de WordPress, i només val si no ha hagut de canviar res. */
    expect(ruta).toMatch(/\$crua = wp_unslash\( \$_GET\['sdp'\] \);\n\t\$ruta = socdepoble_enxufe_ruta\( \$crua \);\n\treturn \$ruta === \$crua \? \$ruta : '';/);
    expect(senseComentaris(ruta).match(/\$_GET/g)).toHaveLength(3);
    /* L'únic paràmetre que es llig és la clau del contracte (rutaAUrl.clau =
       'sdp'). Correcció S3 · I la consulta crua, només per a comptar noms de
       paràmetre a socdepoble_enxufe_seo_parametre_unic(). */
    expect([...new Set([...CODI.matchAll(/\$_(GET|POST|REQUEST|COOKIE|SERVER)\['([^']+)'\]/g)].map((m) => `${m[1]}.${m[2]}`))].sort())
      .toEqual(['GET.sdp', 'SERVER.QUERY_STRING']);
    const unic = senseComentaris(cosDe('socdepoble_enxufe_seo_parametre_unic'));
    expect(unic).not.toMatch(/\$_GET|echo|return \$consulta|return \$nom/);
    expect(unic).toMatch(/return 1 === \$exactes;/);
    for (const funcio of ['socdepoble_enxufe_seo_ruta_demanada', 'socdepoble_enxufe_seo_fila', 'socdepoble_enxufe_seo_capcalera', 'socdepoble_enxufe_seo_url']) {
      expect(senseComentaris(cosDe(funcio)), funcio).not.toMatch(/\$_SERVER/);
    }
  });

  test('a nivell de fitxer només hi ha wp_head (prioritat 1) i wp (prioritat 0), i cada callback torna sense fila', () => {
    expect(ganxosDeNivellSuperior()).toEqual([
      { ganxo: 'wp_head', callback: 'socdepoble_enxufe_seo_capcalera', prioritat: 1 },
      { ganxo: 'wp', callback: 'socdepoble_enxufe_seo_prepara', prioritat: 0 }
    ]);
    for (const funcio of ['socdepoble_enxufe_seo_capcalera', 'socdepoble_enxufe_seo_prepara']) {
      const cos = senseComentaris(cosDe(funcio));
      const guarda = cos.search(/null === socdepoble_enxufe_seo_fila\(\)|if \( null === \$fila \) \{\n\t\treturn;/);
      expect(guarda, `${funcio}: la primera cosa és mirar si hi ha fila`).toBeGreaterThanOrEqual(0);
      expect(cos.slice(0, guarda)).not.toMatch(/echo|add_filter|add_action/);
    }
    expect(cosDe('socdepoble_enxufe_seo_titol')).toMatch(/return null === \$fila \? \$titol : /);
  });

  test('la fila es resol una vegada: la ruta de la petició abans que la taula, i la taula només si la petició és activa', () => {
    const fila = cosDe('socdepoble_enxufe_seo_fila');
    expect(fila).toMatch(/static \$resolta = false;/);
    const ruta = fila.indexOf('socdepoble_enxufe_seo_ruta_demanada()');
    const taula = fila.indexOf('socdepoble_enxufe_seo_taula()');
    expect(ruta).toBeGreaterThanOrEqual(0);
    expect(taula).toBeGreaterThan(ruta);
    expect(fila.slice(ruta, taula)).toMatch(/if \( '' === \$ruta \) \{\n\t\treturn null;/);
    // Lectura silenciosa, com manifest.php: cap avís a cada petició per un JSON trencat.
    const lectura = cosDe('socdepoble_enxufe_seo_taula');
    expect(lectura).toMatch(/is_readable\( \$fitxer \)/);
    expect(lectura).toMatch(/json_decode\( \$text, true \)/);
    expect(CODI).not.toMatch(/wp_json_file_decode\(/);
  });

  test('Model B: cap URL de backend, cap clau, cap crida de xarxa; l’únic fitxer que llig és la taula local', () => {
    expect(CODI).not.toMatch(/https?:\/\/[a-z0-9]/i);
    expect(CODI).not.toMatch(/wp_remote_|wp_safe_remote_|curl_|fsockopen|stream_socket|fopen\(/);
    expect(CODI).not.toMatch(/supabase|anon|api_key|apikey|secret|token|getenv\(|\$_ENV|DEEPL/i);
    expect(CODI).not.toMatch(/get_option\(|update_option\(|set_transient\(|get_transient\(/);
    expect([...CODI.matchAll(/file_get_contents\(\s*([^)]+?)\s*\)/g)].map((m) => m[1])).toEqual(['$fitxer']);
    // El mateix patró d'atributs de backend que vigila tests/enxufe-plugin.test.mjs, sobre el text sencer.
    expect(SEO).not.toMatch(/\b(supabase-url|supabase-anon-key|backend-url|tenant-id|data-mode|bot-api-url|oauth-relay-url|sollutia-issuer|config-id)\b/);
    expect(CODI).not.toMatch(/tenant/i);
  });

  test('D-19 i D-20 · mode paràmetre estricte i taula estàtica: cap reescriptura /sdp/<ruta>, cap lectura del camí i la decisió escrita al fitxer', () => {
    // Ni regles de rewrite ni variables de consulta pròpies: la ruta només entra per ?sdp=.
    expect(CODI).not.toMatch(/add_rewrite_|flush_rewrite_rules|rewrite_rules|query_vars|get_query_var|add_rewrite_tag|parse_request/);
    // Del servidor només es mira la consulta crua, per a comptar el paràmetre (correcció S3): mai el camí ni l'amfitrió.
    expect(CODI).not.toMatch(/REQUEST_URI|PATH_INFO|HTTP_HOST|\$wp->|\$wp_query/);
    expect(CODI.match(/\$_SERVER/g)).toHaveLength(3);
    // Correcció S1 · L'abast és la pàgina singular que porta l'App, i l'og:url no té reserva a l'arrel del lloc.
    const pagina = senseComentaris(cosDe('socdepoble_enxufe_seo_pagina_amb_app'));
    expect(pagina).toMatch(/if \( ! is_singular\(\) \) \{\n\t\treturn false;/);
    expect(pagina).toMatch(/return has_shortcode\( \$entrada->post_content, 'socdepoble_app' \) \|\| has_block\( 'socdepoble\/app', \$entrada->post_content \);/);
    expect(llig('wordpress-plugin/includes/marcatge.php')).toMatch(/add_shortcode\( 'socdepoble_app', /);
    expect(JSON.parse(llig('wordpress-plugin/includes/bloc/block.json')).name).toBe('socdepoble/app');
    const filaAmbApp = senseComentaris(cosDe('socdepoble_enxufe_seo_fila'));
    expect(filaAmbApp.indexOf('socdepoble_enxufe_seo_pagina_amb_app()')).toBeGreaterThan(filaAmbApp.indexOf('socdepoble_enxufe_seo_ruta_demanada()'));
    expect(filaAmbApp.indexOf('socdepoble_enxufe_seo_pagina_amb_app()')).toBeLessThan(filaAmbApp.indexOf('socdepoble_enxufe_seo_taula()'));
    expect(CODI).not.toMatch(/home_url\(/);
    // Correcció S2 · El fitxer diu les tres maneres d'encendre'l sense que passe res, i que la condició del mode és decisió pendent.
    expect(SEO).toMatch(/SI NO PASSA RES\./);
    expect(SEO).toMatch(/DECISIÓ PENDENT DEL MESTRE: l'ordre diu «activat per filtre», i esta\n \* {6}condició en fa dos\./);
    expect(PRINCIPAL).not.toMatch(/add_rewrite_|flush_rewrite_rules/);
    // Cap capçalera de cau ni cap redirecció: la cau és de l'amfitrió, i ho diu el fitxer.
    expect(CODI).not.toMatch(/\bheader\(|nocache_headers\(|wp_redirect\(|wp_safe_redirect\(/);
    expect(SEO).toMatch(/Onada 12 \(261011; ordres 261011_0130, punt 3,\n \* D-19 i D-20\): MODE PARÀMETRE ESTRICTE i TAULA ESTÀTICA\./);
    expect(SEO).toMatch(/LA CAU DE PÀGINA DE L'AMFITRIÓ\./);
    expect(SEO).toMatch(/ha de traure `sdp` d'eixa llista de paràmetres ignorats/);
    expect(SEO).toMatch(/RES DE LA PETICIÓ ES REFLECTIX\./);
    /* La ruta que s'imprimix és la clau de la fila, no la de la petició: a
       socdepoble_enxufe_seo_fila no queda cap assignació de $ruta a la fila. */
    const fila = senseComentaris(cosDe('socdepoble_enxufe_seo_fila'));
    expect(fila).toMatch(/\$fila\['ruta'\] = '\/' \. \$fila\['clau'\];/);
    expect(fila).not.toMatch(/\$fila\['ruta'\] = \$ruta/);
    // El readme del plugin (en anglés, com tot ell) diu com s'encén i què ha de fer la cau.
    const readme = llig('wordpress-plugin/readme.txt');
    expect(readme).toMatch(/`socdepoble_enxufe_seo`/);
    expect(readme).toMatch(/dist\/seo-routes\.json/);
    expect(readme).toMatch(/must not ignore or strip the `sdp` query parameter/);
    expect(readme).toMatch(/off by default/i);
  });

  test('llig de la taula exactament el que escriu build-seo-manifest.mjs, amb la mateixa imatge per defecte', () => {
    const bloc = /manifest\.routes\[[^\]]+\] = \{([\s\S]*?)\};/.exec(PRODUCTOR);
    expect(bloc, 'el productor escriu manifest.routes[ruta] = { … }').not.toBeNull();
    const clausDelProductor = [...bloc[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1]);
    expect(clausDelProductor).toEqual(expect.arrayContaining(['title', 'description', 'image', 'index', 'type']));
    const valida = cosDe('socdepoble_enxufe_seo_valida_taula');
    const clausLlegides = [...new Set([...valida.matchAll(/\$fila\['(\w+)'\]/g)].map((m) => m[1]))].sort();
    expect(clausLlegides).toEqual(['description', 'image', 'index', 'title', 'type']);
    for (const clau of clausLlegides) expect(clausDelProductor, `el productor no escriu ${clau}`).toContain(clau);
    expect(valida).toMatch(/\$dades\['routes'\]/);
    expect(valida).toMatch(/\$dades\['aliases'\]/);
    expect(PRODUCTOR).toMatch(/manifest = \{[^}]*routes: \{\}, aliases: \{\}/);
    // El títol és obligatori i tot text passa pel sanejador d'etiquetes del plugin.
    expect(valida).toMatch(/\$titol = socdepoble_enxufe_etiqueta\( \$fila\['title'\] \?\? '' \);\n\t\tif \( '' === \$titol \) \{\n\t\t\tcontinue;/);
    expect(valida).toMatch(/'description' => socdepoble_enxufe_etiqueta\(/);
    // Un àlies només val si apunta a una ruta de la taula.
    expect(valida).toMatch(/isset\( \$rutes\[ \$a \] \)/);
    // Onada 12 (D-19) · La clau és la ruta canònica que s'imprimirà: neta, sense consulta, i passa el sanejador sense canvis.
    expect(valida).toMatch(/if \( false !== strpos\( \$clau, '\?' \) \|\| socdepoble_enxufe_ruta\( '\/' \. \$clau \) !== '\/' \. \$clau \) \{\n\t\t\tcontinue;/);
    // La imatge de reserva és la del productor i la del nucli, i viatja a dist/ (ve de public/).
    const defecte = /IMATGE_DEFECTE = '([^']+)'/.exec(PRODUCTOR)[1];
    expect(cosDe('socdepoble_enxufe_seo_imatge')).toContain(`'${defecte.replace(/^\//, '')}'`);
    expect(fs.existsSync(path.join(ARREL, 'public', defecte))).toBe(true);
    expect(llig('src/hooks/useSEO.js')).toContain(`IMATGE_BASE = '${defecte}'`);
  });

  test('resol àlies, ruta exacta (també amb els ids codificats com el productor) i, si no, la secció, en eixe ordre', () => {
    const resol = cosDe('socdepoble_enxufe_seo_resol');
    expect(resol).toMatch(/\$clau = trim\( explode\( '\?', \$ruta, 2 \)\[0\], '\/' \);/);
    const alies = resol.indexOf("$taula['aliases'][ $candidata ]");
    const exacta = resol.indexOf("$taula['routes'][ $candidata ]");
    const seccio = resol.indexOf("explode( '/', $clau, 2 )[0]");
    expect(alies).toBeGreaterThanOrEqual(0);
    expect(exacta).toBeGreaterThan(alies);
    expect(seccio).toBeGreaterThan(exacta);
    expect(resol.slice(seccio)).toMatch(/\$taula\['aliases'\]\[ \$seccio \]/);
    // Onada 12 (D-19) · Cada eixida porta 'clau', la clau de la taula que ha casat; fora de la taula, null.
    expect(resol).toMatch(/return array\( 'clau' => \$candidata \) \+ \$taula\['routes'\]\[ \$candidata \];/);
    expect(resol.slice(seccio)).toMatch(/return isset\( \$taula\['routes'\]\[ \$seccio \] \) \? array\( 'clau' => \$seccio \) \+ \$taula\['routes'\]\[ \$seccio \] : null;/);
    // encodeURIComponent al productor ↔ rawurlencode per segment ací.
    expect(PRODUCTOR).toMatch(/encodeURIComponent\(String\(item\.id\)\)/);
    expect(resol).toMatch(/array_map\( 'rawurlencode', explode\( '\/', \$clau \) \)/);
  });

  test('tota eixida passa per esc_attr o esc_url; la imatge és absoluta i mai SVG; og:url té la forma que escriu l’App', () => {
    const capcalera = cosDe('socdepoble_enxufe_seo_capcalera');
    const continguts = [...capcalera.matchAll(/content="' \. (\w+)\(/g)].map((m) => m[1]);
    expect(continguts.length).toBeGreaterThanOrEqual(10);
    expect(new Set(continguts)).toEqual(new Set(['esc_attr', 'esc_url']));
    expect(capcalera.match(/content="/g)).toHaveLength(continguts.length + 2); // robots i twitter:card, literals
    for (const etiqueta of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
      expect(capcalera, etiqueta).toContain(`"${etiqueta}"`);
    }
    expect(capcalera).toMatch(/content="' \. esc_url\( \$url \)/);
    expect(capcalera).toMatch(/content="' \. esc_url\( \$imatge \)/);
    const imatge = cosDe('socdepoble_enxufe_seo_imatge');
    expect(imatge).toMatch(/\\\.svgz\?/);
    expect(imatge).toMatch(/plugins_url\( 'dist\/' \. ltrim\( \$imatge, '\/' \), SOCDEPOBLE_ENXUFE_FITXER \)/);
    expect(imatge.match(/esc_url_raw\(/g)).toHaveLength(3);
    // La mateixa forma que codificaRuta (src/PedraSecaEmbed.jsx): '/' llegible, la resta codificada.
    expect(llig('src/PedraSecaEmbed.jsx')).toMatch(/encodeURIComponent\(ruta\)\.replace\(\/%2F\/g, '\/'\)/);
    expect(cosDe('socdepoble_enxufe_seo_url')).toMatch(/add_query_arg\( 'sdp', str_replace\( '%2F', '\/', rawurlencode\( \$ruta \) \), \$base \)/);
    expect(cosDe('socdepoble_enxufe_seo_tipus_og')).toMatch(/\? 'article' : 'website'/);
  });

  test('els connectors de SEO es lleven amb els seus filtres documentats, amb comprovació prèvia i només en la petició activa', () => {
    const prepara = senseComentaris(cosDe('socdepoble_enxufe_seo_prepara'));
    expect(prepara).toMatch(/add_filter\( 'pre_get_document_title', 'socdepoble_enxufe_seo_titol', 99 \);/);
    /* Correcció S1 (261011) · Només Open Graph i Twitter: de Yoast, un filtre
       que tria presentadors pel seu espai de noms (abans, la llista buida, que
       s'emportava el canònic i el robots); All in One SEO ja no es toca. */
    const guardes = [
      ["defined( 'WPSEO_VERSION' )", 'wpseo_frontend_presenters', 'socdepoble_enxufe_seo_sense_xarxes'],
      ["class_exists( 'RankMath' )", 'rank_math/frontend/show_opengraph', 'socdepoble_enxufe_seo_no'],
      ["class_exists( 'Jetpack' )", 'jetpack_enable_open_graph', 'socdepoble_enxufe_seo_no']
    ];
    expect(CODI).not.toMatch(/aioseo|wpseo_canonical|wpseo_robots|rank_math\/frontend\/(?:canonical|robots)/);
    const xarxes = senseComentaris(cosDe('socdepoble_enxufe_seo_sense_xarxes'));
    expect(xarxes).toMatch(/strpos\( \$classe, '\\\\Open_Graph\\\\' \)/);
    expect(xarxes).toMatch(/strpos\( \$classe, '\\\\Twitter\\\\' \)/);
    expect(xarxes).not.toMatch(/return array\(\);/);
    for (const [guarda, filtre, callback] of guardes) {
      const bloc = new RegExp(`if \\( ${guarda.replace(/[()]/g, '\\$&')} \\) \\{\\n\\t\\tadd_filter\\( '${filtre}', '${callback}' \\);\\n\\t\\}`);
      expect(prepara, `${filtre} només si ${guarda}`).toMatch(bloc);
    }
    // Cap d'estos filtres es registra a nivell de fitxer: fora de la petició activa, res canvia.
    for (const [, filtre] of guardes) expect(ganxosDeNivellSuperior().map((g) => g.ganxo)).not.toContain(filtre);
    expect(CODI).not.toMatch(/'__return_\w+'/);
    expect(cosDe('socdepoble_enxufe_seo_no')).toMatch(/return false;/);
  });
});

/* ───────────────── PHP real, com tests/enxufe-pantalla.test.mjs ─────────────────
   El mateix detector: PHP_BIN, php al PATH o el de WordPress Studio. Sense cap,
   es salta: la part de text de dalt continua fixant la forma. */
function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instal_lats = fs.existsSync(studio)
    ? fs.readdirSync(studio).sort().reverse().map((versio) => path.join(studio, versio, 'php'))
    : [];
  return ['php', ...instal_lats].find((binari) => spawnSync(binari, ['-v'], { timeout: 5000 }).status === 0);
}
const PHP = cercaPhp();
/* El nucli de WordPress Studio, si hi és (correcció S6): només per a la prova
   que carrega les funcions reals d'escapat. Sense ell, eixa prova es salta. */
const WP_INCLUDES = [process.env.WP_INCLUDES, path.join(os.homedir(), '.studio/server-files/wordpress-versions/latest/wp-includes')]
  .find((carpeta) => carpeta && fs.existsSync(path.join(carpeta, 'formatting.php')));
const FIXTURE = path.join(ARREL, 'tests/fixtures/enxufe-seo.php');
const PLUGIN_URL = 'https://host.example/plugins/socdepoble-enxufe/';
const IMATGE_BASE = `${PLUGIN_URL}dist/assets/system/ui/og-socdepoble-1200x630.png`;

/** Una taula amb la forma que escriu build-seo-manifest.mjs (status i lastmod sobren). */
const TAULA = {
  generat: '2026-10-10', font: 'tooling/gates/build-seo-manifest.mjs',
  routes: {
    mur: { status: 200, index: true, title: 'Mur', description: 'Mur · Sóc de Poble, la xarxa dels pobles valencians.', image: '/assets/system/ui/og-socdepoble-1200x630.png', type: 'CollectionPage', lastmod: '2026-10-10' },
    xat: { status: 200, index: false, title: 'Xat', description: 'Xat · Sóc de Poble.', image: '/assets/system/ui/og-socdepoble-1200x630.png', type: 'WebPage', lastmod: '2026-10-10' },
    mercat: { status: 200, index: true, title: 'Mercat', description: 'Mercat.', image: '/assets/system/ui/og-socdepoble-1200x630.png', type: 'CollectionPage', lastmod: '2026-10-10' },
    'mercat/caixa%20gran': { status: 200, index: true, title: 'Caixa "gran" <b>de fusta</b>', description: 'Una caixa <script>x</script> gran.', image: '/assets/fotos/caixa.jpg', type: 'Product', lastmod: '2026-10-10' },
    'pobles/la-torre': { status: 200, index: true, title: 'La Torre', description: 'El poble.', image: '/assets/towns/torre.svg', type: 'Place', lastmod: '2026-10-10' },
    'mur/aplec-2023': { status: 200, index: true, title: 'Aplec 2023', description: 'Crònica.', image: 'https://fotos.example/aplec.jpg', type: 'Article', lastmod: '2026-10-10' },
    senseTitol: { status: 200, index: true, title: '', description: 'x', image: '', type: 'WebPage', lastmod: '2026-10-10' }
  },
  aliases: { chat: 'xat', events: 'mur', fantasma: 'no-existix' }
};

/* Onada 12 (261011; D-19) · L'amfitrió de les proves declara el mode
   'parametre', que és el que exigix la forma estricta; un cas pot dir-ne un
   altre amb `mode` (null: no registra el filtre i val el 'fragment' de sempre). */
function executa(casCru, taula = TAULA) {
  const cas = { mode: 'parametre', ...casCru };
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-seo-'));
  try {
    const plugin = path.join(arrel, 'socdepoble-enxufe');
    fs.mkdirSync(path.join(plugin, 'includes'), { recursive: true });
    fs.mkdirSync(path.join(plugin, 'dist'));
    for (const rel of ['includes/marcatge.php', 'includes/seo.php']) {
      fs.copyFileSync(path.join(ARREL, 'wordpress-plugin', rel), path.join(plugin, rel));
    }
    if (taula !== null) fs.writeFileSync(path.join(plugin, 'dist/seo-routes.json'), typeof taula === 'string' ? taula : JSON.stringify(taula));
    const resultat = spawnSync(PHP, [FIXTURE, plugin], { encoding: 'utf8', input: JSON.stringify(cas), timeout: 10000 });
    expect(resultat.status, resultat.error?.message || resultat.stderr || resultat.stdout).toBe(0);
    expect(resultat.stderr).toBe('');
    return JSON.parse(resultat.stdout);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
}

const meta = (head, nom) => {
  const m = new RegExp(`<meta (?:property|name)="${nom}" content="([^"]*)">`).exec(head);
  return m ? m[1] : null;
};

describe.skipIf(!PHP)('seo.php amb PHP real (fixture sense WordPress)', () => {
  test('inert: sense el filtre no es llig ni la ruta; amb el filtre però sense ?sdp=, tampoc; cap ganxo de connector registrat', () => {
    for (const cas of [{ filtre: false, get: { sdp: '/mur' } }, { filtre: true, get: {} }, { filtre: true, get: { pagina: '/mur' } },
      { filtre: false, mode: null, get: { sdp: '/mur' } }]) {
      const r = executa({ ...cas, wpseo: true, rankmath: true });
      expect(r.ruta, JSON.stringify(cas)).toBe('');
      expect(r.fila).toBeNull();
      expect(r.head).toBe('');
      expect(r.titol).toBe('');
      expect(r.ganxos).not.toContain('pre_get_document_title');
      expect(r.ganxos).not.toContain('wpseo_frontend_presenters');
      expect(r.presentadors).toEqual(['a', 'b']);
      expect(r.rankmath).toBe(true);
    }
  });

  test('actiu amb ?sdp=/mur: títol pel canal de WordPress, og:*, twitter, og:url amb ?sdp= com l’App i imatge absoluta de dist/', () => {
    const r = executa({ filtre: true, get: { sdp: '/mur' } });
    expect(r.ruta).toBe('/mur');
    expect(r.fila.title).toBe('Mur');
    expect(r.titol).toBe('Mur | Gent de la Torre');
    expect(meta(r.head, 'og:title')).toBe('Mur | Gent de la Torre');
    expect(meta(r.head, 'og:description')).toBe('Mur · Sóc de Poble, la xarxa dels pobles valencians.');
    expect(meta(r.head, 'description')).toBe('Mur · Sóc de Poble, la xarxa dels pobles valencians.');
    expect(meta(r.head, 'og:type')).toBe('website');
    expect(meta(r.head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mur');
    expect(meta(r.head, 'og:image')).toBe(IMATGE_BASE);
    expect(meta(r.head, 'og:site_name')).toBe('Gent de la Torre');
    expect(meta(r.head, 'twitter:card')).toBe('summary_large_image');
    expect(meta(r.head, 'twitter:title')).toBe('Mur | Gent de la Torre');
    expect(meta(r.head, 'twitter:image')).toBe(IMATGE_BASE);
    expect(meta(r.head, 'robots')).toBeNull();
    expect(r.ganxos).toContain('pre_get_document_title');
    /* Onada 12 (D-19) · Una publicació que la taula no coneix rep les etiquetes
       i l'og:url de la seua secció: ni l'id ni la consulta de la petició
       s'imprimixen. */
    const detall = executa({ filtre: true, get: { sdp: '/mur/123?dia=2' } });
    expect(detall.ruta).toBe('/mur/123?dia=2');
    expect(detall.fila).toMatchObject({ title: 'Mur', clau: 'mur', ruta: '/mur' });
    expect(meta(detall.head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mur');
    expect(detall.head).not.toMatch(/123|dia/);
  });

  /* Onada 12 (261011; correcció S1 del refutador) · Amb els filtres encesos,
     https://lloc/qualsevol-entrada/?sdp=/mur rebia el títol i els og:* del Mur
     i perdia els del seu connector de SEO. Ara només actua la pàgina singular
     que porta l'App (el shortcode [socdepoble_app] o el bloc socdepoble/app). */
  test('S1 · només la pàgina que porta l’App: una entrada sense el shortcode ni el bloc, un arxiu o la portada no canvien ni un byte', () => {
    const SENSE_APP = [
      { contingut: '<p>Una entrada qualsevol</p>' }, { contingut: '' }, { contingut: '[socdepoble_app_antic] [altre]' },
      { contingut: '<!-- wp:socdepoble/apparat /--><!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->' }, { singular: false }
    ];
    for (const cas of SENSE_APP) {
      const r = executa({ filtre: true, get: { sdp: '/mur' }, wpseo: true, rankmath: true, jetpack: true, aioseo: true, ...cas });
      expect(r.fila, JSON.stringify(cas)).toBeNull();
      expect(r.head).toBe('');
      expect(r.titol).toBe('');
      expect(r.ganxos).not.toContain('pre_get_document_title');
      expect(r.presentadors).toEqual(['a', 'b']);
      expect([r.rankmath, r.jetpack, r.aioseo]).toEqual([true, true, false]);
    }
    for (const contingut of ['[socdepoble_app]', 'Hola\n[socdepoble_app poble="la-torre"]', '<!-- wp:socdepoble/app /-->', '<!-- wp:socdepoble/app {"poble":"la-torre"} /-->']) {
      const r = executa({ filtre: true, get: { sdp: '/mur' }, contingut });
      expect(r.fila?.title, contingut).toBe('Mur');
      expect(meta(r.head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mur');
    }
  });

  test('S1 · dels connectors de SEO només es lleven els og:* i els twitter:*: el canònic, el robots, el títol i l’esquema de Yoast es queden, i All in One SEO no es toca', () => {
    const P = 'Yoast\\WP\\SEO\\Presenters\\';
    const queden = [`${P}Title_Presenter`, `${P}Meta_Description_Presenter`, `${P}Canonical_Presenter`, `${P}Robots_Presenter`, `${P}Schema_Presenter`];
    const xarxes = [`${P}Open_Graph\\Title_Presenter`, `${P}Open_Graph\\Url_Presenter`, `${P}Open_Graph\\Image_Presenter`, `${P}Twitter\\Card_Presenter`, `${P}Twitter\\Title_Presenter`];
    const presentadors = [queden[0], xarxes[0], queden[1], queden[2], xarxes[1], queden[3], xarxes[2], xarxes[3], queden[4], xarxes[4]];
    const r = executa({ filtre: true, get: { sdp: '/mur' }, wpseo: true, aioseo: true, presentadors });
    expect(r.fila.title).toBe('Mur');
    expect(r.presentadors).toEqual(queden);
    expect(r.aioseo).toBe(false);
    expect(r.ganxos).not.toContain('aioseo_disable');
    // Fora de la petició activa, tots els presentadors arriben intactes.
    expect(executa({ filtre: true, get: { sdp: '/desconeguda' }, wpseo: true, presentadors }).presentadors).toEqual(presentadors);
  });

  /* Correcció S3 · L'App pren el PRIMER tros «sdp=» de la consulta crua
     (PedraSecaEmbed.jsx · llegeixRutaDeLaUrl) i PHP l'ÚLTIM, i PHP accepta
     noms que l'App no (« sdp», «s%64p», «sdp[]»). Mode estricte: exactament un
     paràmetre escrit «sdp», i cap altre que PHP llegiria com a sdp. */
  test('S3 · un paràmetre duplicat o un nom que no és exactament «sdp» es rebutja: el servidor i l’App no poden triar rutes diferents', () => {
    expect(llig('src/PedraSecaEmbed.jsx')).toMatch(/trossosDeLaUrl\(mode\)\.find\(\(t\) => t\.startsWith\(`\$\{CLAU_RUTA\}=`\)\)/);
    for (const query of ['sdp=/mur&sdp=/xat', 'sdp=/xat&sdp=/mur', 'sdp=/mur&sdp=/mur', '%20sdp=/mur', '+sdp=/mur', 's%64p=/mur', '%73dp=/mur',
      'sdp[]=/xat&sdp=/mur', 'sdp=/mur&sdp[x]=1', 'sdp%5B%5D=/mur', 'a=1&sdp=/mur&%73dp=/xat', 'sdp=/mur&%20sdp=/xat']) {
      const r = executa({ filtre: true, query });
      expect(r.ruta, query).toBe('');
      expect(r.fila).toBeNull();
      expect(r.head).toBe('');
    }
    for (const query of ['sdp=/mur', 'a=1&sdp=/mur&b=2', 'sdp=%2Fmur', 'sdp=/mur%3Fdia%3D2', 'sdpx=/xat&sdp=/mur&xsdp=/xat']) {
      expect(executa({ filtre: true, query }).fila, query).toMatchObject({ clau: 'mur' });
    }
    // Sense cadena de consulta que mirar, no hi ha manera de saber-ho: res.
    expect(executa({ filtre: true, get: { sdp: '/mur' }, senseQuery: true }).head).toBe('');
  });

  /* Correcció S4 · Qualsevol ?sdp=/x ben format feia llegir i descodificar la
     taula sencera, sense límit. Sostre: 2 MiB (la taula de hui no arriba a
     40 KB); per damunt, com si no hi fora. */
  test('S4 · una taula de més de 2 MiB no es llig: res, en silenci; just per davall, sí', () => {
    const ambFarcit = (bytes) => JSON.stringify({ ...TAULA, farcit: 'x'.repeat(bytes) });
    const grossa = executa({ filtre: true, get: { sdp: '/mur' } }, ambFarcit(2 * 1024 * 1024));
    expect(grossa.taula).toBeNull();
    expect(grossa.head).toBe('');
    expect(executa({ filtre: true, get: { sdp: '/mur' } }, ambFarcit(1024 * 1024)).fila.title).toBe('Mur');
    expect(cosDe('socdepoble_enxufe_seo_taula')).toMatch(/\$sostre = 2 \* 1024 \* 1024;/);
    const lectura = senseComentaris(cosDe('socdepoble_enxufe_seo_taula'));
    expect(lectura.indexOf('filesize(')).toBeGreaterThanOrEqual(0);
    expect(lectura.indexOf('filesize(')).toBeLessThan(lectura.indexOf('file_get_contents('));
  });

  /* Correcció S6 · Amb el nucli de WordPress Studio (si hi és), has_shortcode
     és el de veres (wp-includes/shortcodes.php). LÍMIT: l'escapat i el sanejat
     (esc_url, esc_html, sanitize_text_field) i add_query_arg continuen sent
     els doubles simplificats de la fixture: formatting.php no es carrega sol
     (demana functions.php, que arrossega la base de dades). Dos intents, i
     abandonat: la fixture ho explica. */
  test.skipIf(!WP_INCLUDES)('S6 · amb el has_shortcode de WordPress de veres: només el shortcode registrat, amb el nom sencer, fa actuar la pàgina', () => {
    expect(llig('tests/fixtures/enxufe-seo.php')).toMatch(/LÍMIT, provat i abandonat després de dos intents/);
    expect(executa({ filtre: true, get: { sdp: '/mur' }, contingut: '[socdepoble_app]', wpIncludes: WP_INCLUDES }).fila.title).toBe('Mur');
    expect(executa({ filtre: true, get: { sdp: '/mur' }, contingut: '[socdepoble_app_antic]', wpIncludes: WP_INCLUDES }).fila).toBeNull();
    expect(executa({ filtre: true, get: { sdp: '/mur' }, contingut: '<p>x</p>', wpIncludes: WP_INCLUDES }).head).toBe('');
    expect(executa({ filtre: true, get: { sdp: '/mur' }, contingut: '[socdepoble_app poble="x"]', wpIncludes: WP_INCLUDES }).fila.title).toBe('Mur');
  });

  test('D-19 · interruptor: només el true estricte del filtre i només el mode «parametre»; amb «fragment», apagat o absent, res', () => {
    for (const cas of [
      { filtre: true, mode: null }, { filtre: true, mode: 'fragment' }, { filtre: true, mode: 'apagat' }, { filtre: true, mode: 'PARAMETRE' },
      { filtreCom: 1 }, { filtreCom: 'true' }, { filtreCom: 'yes' }, { filtreCom: [true] }, { filtreCom: null }, { filtreCom: false }
    ]) {
      const r = executa({ ...cas, get: { sdp: '/mur' }, wpseo: true });
      expect(r.ruta, JSON.stringify(cas)).toBe('');
      expect(r.fila).toBeNull();
      expect(r.head).toBe('');
      expect(r.titol).toBe('');
      expect(r.ganxos).not.toContain('pre_get_document_title');
      expect(r.presentadors).toEqual(['a', 'b']);
    }
    expect(executa({ filtreCom: true, get: { sdp: '/mur' } }).fila.title).toBe('Mur');
  });

  test('D-19 · forma estricta del paràmetre: el valor ja ha de ser la ruta sanejada; el que caldria corregir es rebutja sencer', () => {
    for (const sdp of [' /mur', '/mur ', '\n/mur', '/mur#comentaris', '/mur?dia=2#x', '#/mur', '/mur ', '/mur﻿', '', '/%2e%2e/mur', '/mur/%2E']) {
      const r = executa({ filtre: true, get: { sdp } });
      expect(r.ruta, JSON.stringify(sdp)).toBe('');
      expect(r.fila).toBeNull();
      expect(r.head).toBe('');
      expect(r.titol).toBe('');
    }
    // Un altre paràmetre o una altra caixa de la clau no és la clau del contracte.
    for (const get of [{ SDP: '/mur' }, { ruta: '/mur' }, { 'sdp ': '/mur' }, { sdp: { 0: '/mur' } }]) {
      expect(executa({ filtre: true, get }).head, JSON.stringify(get)).toBe('');
    }
    // La forma bona, amb consulta: s'accepta sencera per a triar la fila.
    expect(executa({ filtre: true, get: { sdp: '/mur?dia=2' } })).toMatchObject({ ruta: '/mur?dia=2', fila: { clau: 'mur', ruta: '/mur' } });
  });

  test('D-19 i D-20 · llista blanca: res de la petició es reflectix; tot el que s’imprimix ix de la taula i del lloc', () => {
    const MARCA = 'zzINJECCIOzz';
    for (const sdp of [`/mur/${MARCA}`, `/mur?x=${MARCA}`, `/mur/a/b/${MARCA}?c=${MARCA}`, `/mercat/${MARCA}"><script>`, `/chat/${MARCA}`]) {
      const r = executa({ filtre: true, get: { sdp } });
      expect(r.fila, sdp).not.toBeNull();
      expect(`${r.head}${r.titol}`, sdp).not.toContain(MARCA);
      expect(r.head).not.toMatch(/<script/);
      expect(meta(r.head, 'og:url')).toBe(`https://host.example/comunitat/?sdp=${r.fila.ruta}`);
      expect(Object.keys(TAULA.routes)).toContain(r.fila.clau);
    }
    // Fora de la taula (ni ruta ni secció): res, tampoc amb una ruta ben formada.
    for (const sdp of [`/${MARCA}`, `/${MARCA}/mur`, '/senseTitol', '/fantasma/1']) {
      const r = executa({ filtre: true, get: { sdp } });
      expect(r.fila, sdp).toBeNull();
      expect(r.head).toBe('');
    }
    // L'àlies s'imprimix ja resolt: /chat és /xat, i /events/5 és /mur.
    expect(meta(executa({ filtre: true, get: { sdp: '/chat' } }).head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/xat');
    expect(meta(executa({ filtre: true, get: { sdp: '/events/5' } }).head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mur');
    /* Les claus de la taula també passen el sanejador: una clau amb consulta,
       amb blancs, que puja de carpeta o amb un origen no entra a la llista blanca. */
    const bruta = { routes: {
      mur: { title: 'Mur' }, 'mur?x=1': { title: 'Consulta' }, 'mur xat': { title: 'Blanc' }, 'mur/../xat': { title: 'Puja' },
      '/evil.example': { title: 'Origen' }, 'mur#x': { title: 'Fragment' }
    }, aliases: { vell: 'mur?x=1', bo: 'mur' } };
    const neta = executa({ filtre: true, get: { sdp: '/bo' } }, bruta);
    expect(Object.keys(neta.taula.routes)).toEqual(['mur']);
    expect(neta.taula.aliases).toEqual({ bo: 'mur' });
    expect(meta(neta.head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mur');
  });

  test('àlies i noindex: /chat és la fila de xat amb robots noindex; un àlies cap a una ruta absent es descarta', () => {
    const r = executa({ filtre: true, get: { sdp: '/chat' }, resol: ['/events/5', '/fantasma', '/desconeguda', '/mercat/no-hi-es'] });
    expect(r.fila.title).toBe('Xat');
    expect(meta(r.head, 'robots')).toBe('noindex, nofollow');
    expect(r.taula.aliases).toEqual({ chat: 'xat', events: 'mur' });
    expect(r.taula.routes.senseTitol).toBeUndefined();
    expect(r.resol['/events/5'].title).toBe('Mur');
    expect(r.resol['/fantasma']).toBeNull();
    expect(r.resol['/desconeguda']).toBeNull();
    expect(r.resol['/mercat/no-hi-es'].title).toBe('Mercat');
  });

  test('detall: l’id arriba percent-codificat com al pathname de l’App i casa la clau del productor; article → og:type article; text sanejat i escapat', () => {
    /* L'App escriu ?sdp=/mercat/caixa%2520gran (codificaRuta sobre el pathname ja
       codificat) i PHP en descodifica una capa: el sanejador rebutja blancs, així
       que un id amb espai només pot arribar com %20. Un id escrit a mà sense
       codificar (café) el casa la segona candidata, amb rawurlencode. */
    const r = executa({ filtre: true, get: { sdp: '/mercat/caixa%20gran' }, resol: ['/mercat/caixa%20gran', '/pobles/la-torre'] });
    expect(r.fila.title).toBe('Caixa "gran" de fusta');
    expect(meta(r.head, 'og:title')).toBe('Caixa &quot;gran&quot; de fusta | Gent de la Torre');
    expect(meta(r.head, 'og:description')).toBe('Una caixa x gran.');
    expect(meta(r.head, 'og:image')).toBe(`${PLUGIN_URL}dist/assets/fotos/caixa.jpg`);
    expect(meta(r.head, 'og:url')).toBe('https://host.example/comunitat/?sdp=/mercat/caixa%2520gran');
    expect(r.head).not.toMatch(/<script|<b>/);
    expect(r.resol['/pobles/la-torre'].title).toBe('La Torre');
    const article = executa({ filtre: true, get: { sdp: '/mur/aplec-2023' } });
    expect(meta(article.head, 'og:type')).toBe('article');
    expect(meta(article.head, 'og:image')).toBe('https://fotos.example/aplec.jpg');
  });

  test('sanejat de la ruta: orígens, segments que pugen, blancs, controls o un valor que no és text no fan res', () => {
    for (const sdp of ['//evil.example/x', '/..', '/mur/../xat', 'mur', '/mur xat', '/mur\tx', '/mur\\x', ['/mur'], '/'.padEnd(201, 'a')]) {
      const r = executa({ filtre: true, get: { sdp } });
      expect(r.ruta, JSON.stringify(sdp)).toBe('');
      expect(r.head).toBe('');
    }
  });

  test('taula absent, trencada, sense rutes o sense cap fila vàlida: res, en silenci', () => {
    for (const taula of [null, '{trencat', JSON.stringify({ routes: [] }), JSON.stringify({ routes: { mur: { title: '' } } }), JSON.stringify({ routes: { '/mur': { title: 'Mur' } } })]) {
      const r = executa({ filtre: true, get: { sdp: '/mur' } }, taula);
      expect(r.taula, String(taula)).toBeNull();
      expect(r.head).toBe('');
      expect(r.titol).toBe('');
    }
  });

  test('imatges: SVG, buida, un altre esquema o un camí que puja valen la base; http(s) i // es conserven', () => {
    const r = executa({ filtre: true, get: { sdp: '/mur' }, imatges: ['', 'x.svg', 'a/b.SVGZ?v=1', 'https://cdn.example/a.png', 'http://cdn.example/a.png', '//cdn.example/b.png', '/assets/c.png', 'assets/d.png', '../../x.png', 'data:image/png;base64,AAAA', 'ftp://x/y.png'] });
    expect(r.imatges).toEqual({
      '': IMATGE_BASE,
      'x.svg': IMATGE_BASE,
      'a/b.SVGZ?v=1': IMATGE_BASE,
      'https://cdn.example/a.png': 'https://cdn.example/a.png',
      'http://cdn.example/a.png': 'http://cdn.example/a.png',
      '//cdn.example/b.png': 'https://cdn.example/b.png',
      '/assets/c.png': `${PLUGIN_URL}dist/assets/c.png`,
      'assets/d.png': `${PLUGIN_URL}dist/assets/d.png`,
      '../../x.png': IMATGE_BASE,
      'data:image/png;base64,AAAA': IMATGE_BASE,
      'ftp://x/y.png': IMATGE_BASE
    });
    const torre = executa({ filtre: true, get: { sdp: '/pobles/la-torre' } });
    expect(meta(torre.head, 'og:image')).toBe(IMATGE_BASE);
  });

  test('connectors de SEO: els seus og:* es lleven només si el connector hi és i només en la petició activa', () => {
    const tots = executa({ filtre: true, get: { sdp: '/mur' }, wpseo: true, rankmath: true, jetpack: true, aioseo: true });
    // Correcció S1 · De Yoast només ixen els presentadors d'Open Graph i de Twitter (ací no n'hi ha cap), i All in One SEO no es toca.
    expect(tots.ganxos).toContain('wpseo_frontend_presenters');
    expect(tots.presentadors).toEqual(['a', 'b']);
    expect(tots.rankmath).toBe(false);
    expect(tots.jetpack).toBe(false);
    expect(tots.aioseo).toBe(false);
    const cap = executa({ filtre: true, get: { sdp: '/mur' } });
    expect(cap.presentadors).toEqual(['a', 'b']);
    expect(cap.rankmath).toBe(true);
    expect(cap.jetpack).toBe(true);
    expect(cap.aioseo).toBe(false);
    for (const filtre of ['wpseo_frontend_presenters', 'rank_math/frontend/show_opengraph', 'jetpack_enable_open_graph', 'aioseo_disable']) {
      expect(cap.ganxos).not.toContain(filtre);
    }
    const inactiu = executa({ filtre: true, get: { sdp: '/desconeguda' }, wpseo: true, rankmath: true });
    expect(inactiu.fila).toBeNull();
    expect(inactiu.presentadors).toEqual(['a', 'b']);
    expect(inactiu.titol).toBe('');
  });

  test('el nom del lloc es descodifica una vegada i s’escapa en eixir; sense nom, només el títol de la ruta', () => {
    const amb = executa({ filtre: true, get: { sdp: '/mur' }, blogname: 'Gent &amp; Terra' });
    // El retorn de pre_get_document_title s'imprimix tal qual (curtcircuit del nucli): seo.php l'escapa.
    expect(amb.titol).toBe('Mur | Gent &amp; Terra');
    expect(meta(amb.head, 'og:title')).toBe('Mur | Gent &amp; Terra');
    const sense = executa({ filtre: true, get: { sdp: '/mur' }, blogname: '' });
    expect(sense.titol).toBe('Mur');
    expect(meta(sense.head, 'og:site_name')).toBeNull();
  });
});
