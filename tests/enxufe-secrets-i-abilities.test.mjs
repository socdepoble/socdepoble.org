import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTADOR, fitxersAdaptador } from '../wordpress-plugin/eines/empaqueta.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ARREL, 'wordpress-plugin');
const RUNNER = path.join(ARREL, 'tests/fixtures/enxufe-r25-2-runner.php');
const RUNNER_NUCLI = path.join(ARREL, 'tests/fixtures/enxufe-abilities-nucli-runner.php');
const llig = (rel) => fs.readFileSync(path.join(PLUGIN, rel), 'utf8');
const MU_PLUGIN = 'eines/amfitrio/sdp-manteniment-503-mu-plugin.php';

function resolPhpBin() {
  try {
    execFileSync('php', ['-v'], { stdio: 'ignore' });
    return 'php';
  } catch {
    const candidats = [
      process.env.PHP_BIN,
      path.join(os.homedir(), '.studio/php-bin/8.4.25-studio-1/php'),
      path.join(os.homedir(), '.studio/php-bin/8.2.32-studio-1/php')
    ].filter(Boolean);
    for (const bin of candidats) {
      if (fs.existsSync(bin)) return bin;
    }
    return null;
  }
}

/* El nucli de WordPress 6.9+ per al validador d'esquemes real (SDP_WP_NUCLI o WordPress Studio). */
function resolNucliWp() {
  const candidats = [process.env.SDP_WP_NUCLI, path.join(os.homedir(), '.studio/server-files/wordpress-versions/latest')].filter(Boolean);
  return candidats.find((arrel) => fs.existsSync(path.join(arrel, 'wp-includes/abilities-api/class-wp-ability.php'))) ?? null;
}

const PHP_BIN = resolPhpBin();
const NUCLI_WP = resolNucliWp();

function executaCasPhp(cas, args = [], opcionsPhp = []) {
  const eixida = execFileSync(PHP_BIN, [...opcionsPhp, RUNNER, cas, ...args], {
    encoding: 'utf8',
    env: { ...process.env }
  });
  return JSON.parse(eixida);
}

/* El codi PHP sense comentaris, per a les guardes estàtiques. */
const nomesCodiPhp = (text) => text.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* El cos d'una funció PHP de nivell superior: des de «function nom(» fins a la «}» de la columna 0. */
function cosFuncio(text, nom) {
  const inici = text.indexOf(`\nfunction ${nom}(`);
  assert.ok(inici >= 0, `${nom} no existix`);
  return text.slice(inici, text.indexOf('\n}\n', inici));
}

test('T1 (WP < 6.9 / < 7.2): no-op net sense fatals, fallback a Apertium i refús de desar secrets en clar a wp_options', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp_antic_sense_apis');
  assert.equal(res.secret_llegit, '');
  assert.deepEqual(res.estat, { origen: 'cap', estat: 'no_disponible' });
  assert.equal(res.proveidor, 'apertium');
  assert.equal(res.desa_es_error, true);
  assert.equal(res.desa_codi, 'socdepoble_enxufe_secret_no_disponible');
  assert.equal(res.options_writes, 0, 'mai no pot escriure claus en text pla a wp_options');
  assert.equal(res.abilities_n, 0, 'en WP < 6.9 no registra cap ability ni peta');
  // v1.2.25 · C4B (K-C4B-PROVES) · Motiu del canvi de la llista: salut.php registra sempre l'observació HTTP
  // del directori d'actualitzacions (socdepoble_enxufe_upgrade_http, skip_cron, només manage_options).
  // No és una prova de secrets; l'assert continua exigint que, sense l'API ni WP_SECRETS_KEY, no hi haja
  // socdepoble_enxufe_secrets. La de trossos_http no hi entra perquè el manifest del runner no és «trossos».
  assert.deepEqual(res.salut_proves, ['socdepoble_enxufe_entorn', 'socdepoble_enxufe_paquet', 'socdepoble_enxufe_upgrade_http'], 'sense 7.2 ni WP_SECRETS_KEY, cap prova de secrets a Salut');
});

test('T1 (WP 7.2 Secrets API + Abilities MCP): precedència 1..4, rotació trencada a prova de bombes i permisos MCP estrictes', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.equal(res.desat_ok, true);
  assert.equal(res.options_writes, 0, 'wp_set_secret mai no toca update_option');

  // Precedència estricta: 1r constant -> 2n getenv -> 3r wp_get_secret -> 4t ''
  assert.equal(res.llegit_wp72, 'deepl-xifrat-wp72-secret-999');
  assert.equal(res.llegit_env, 'deepl-des-de-getenv-222');
  assert.equal(res.llegit_const, 'deepl-des-de-constant-111');
  assert.equal(res.valors['socdepoble/trencat-per-rotacio'], '', 'una excepció de desxifrat cau netament a cadena buida');
  assert.equal(res.valors['socdepoble/error-desxifrat'], '', 'un WP_Error de desxifrat cau netament a cadena buida');

  assert.deepEqual(res.categories, ['socdepoble']);
  assert.deepEqual(res.abilities, [
    'socdepoble/diagnostica-enxufe',
    'socdepoble/audita-accessibilitat-i-privadesa',
    'socdepoble/prepara-importacio-pedra-seca'
  ]);

  // Permisos: mai is_admin, anònim denegat a tot, editor només a prepara-importacio-pedra-seca.
  for (const [id, info] of Object.entries(res.perm_anon)) {
    assert.notEqual(info.callback, 'is_admin', `${id} no pot usar is_admin com a control de permisos`);
    assert.equal(info.resultat, false, `${id} ha de denegar accés sense permisos`);
  }
  assert.equal(res.perm_editor['socdepoble/diagnostica-enxufe'], false);
  assert.equal(res.perm_editor['socdepoble/audita-accessibilitat-i-privadesa'], false);
  assert.equal(res.perm_editor['socdepoble/prepara-importacio-pedra-seca'], true);

  // Diagnòstic MCP: informa del proveïdor actiu sense filtrar mai la clau secreta.
  assert.equal(res.diag.proveidor_traduccio, 'deepl');
  assert.equal(res.diag.wp_secrets_key_activa, true);
  assert.equal(res.diag.secrets_api_disponible, true);
  assert.doesNotMatch(JSON.stringify(res.diag), /deepl-des-de-constant-111|deepl-xifrat-wp72-secret-999|clau-mestra-xifrat/);

  // Auditoria d'accessibilitat i privadesa en només lectura.
  assert.equal(res.audit.elements_revisats, 2);
  assert.deepEqual(res.audit.resum, {
    imatges_sense_alt: 1,
    salts_encapcalament: 1,
    recursos_tercers: 1
  });
  assert.equal(res.audit.incidencies.length, 1);
  assert.equal(res.audit.incidencies[0].post_id, 42);

  // Dry-run d'importació Pedra Seca i protecció IDOR sobre post no llegible.
  assert.equal(res.draft.desti, 'calendari');
  assert.equal(res.draft.h1, 'Festa de l’Oli Nou');
  assert.equal(res.draft.subtitol_h2, 'Jornada cooperativa a l’almàssera');
  assert.equal(res.draft.requerix_revisio_humana, true);
  assert.equal(res.draft.publicat_automaticament, false);
  assert.equal(res.idor_bloquejat, true);

  // Avís didàctic de Salut del lloc: avisa que no es rote WP_SECRETS_KEY amb les SALTs.
  assert.match(res.salut_ok.description, /never rotate WP_SECRETS_KEY when rotating session SALTs/);
});

/* R26 · Contracte real de la Secrets API de WordPress 7.2 (dev note de Make WordPress Core,
   11-11-2026): wp_get_secret torna WP_Secret|null|WP_Error, el valor només ix amb reveal() i
   el WP_Secret imprés o en JSON és el marcador «[secret:nom]». */
test('R26 · Secrets API: WP_Secret amb reveal(), absent i error distints, cap marcador ni forma estranya esdevé credencial', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.deepEqual(res.estat_wp72, { origen: 'secrets_api', estat: 'ok' });
  assert.equal(res.actiu_wp72, 'deepl', 'una clau només a la Secrets API activa DeepL');
  assert.equal(res.proveidor_wp72.nom, 'deepl');

  assert.deepEqual(res.estats.absent, { origen: 'secrets_api', estat: 'absent' }, 'null és absent');
  for (const cas of ['wp_error', 'excepcio', 'cadena', 'objecte', 'mascara']) {
    assert.deepEqual(res.estats[cas], { origen: 'secrets_api', estat: 'error' }, `${cas}: és error, no absent`);
  }
  for (const [nom, valor] of Object.entries(res.valors)) assert.equal(valor, '', `${nom}: cap credencial`);
  assert.doesNotMatch(JSON.stringify(res), /clau-falsa-objecte/, 'un objecte que no és WP_Secret no es converteix mai en cadena');

  assert.equal(res.nom_invalid, '');
  assert.equal(res.crides_nom_invalid, 0, 'un nom sense el format connector/nom no arriba a wp_get_secret');
  assert.match(llig('includes/secrets-wp72.php'), /'deepl'\s*=> array\( 'DEEPL_API_KEY', 'socdepoble\/deepl-api-key' \)/);
  assert.match(llig('includes/secrets-wp72.php'), /'traduccio_url' => array\( 'SDP_TRADUCCIO_URL_CLAU', 'socdepoble\/traduccio-url-clau' \)/);

  assert.deepEqual(res.estat_no_disponible, { origen: 'cap', estat: 'no_disponible' });
  assert.equal(res.llegit_no_disponible, '');
  assert.equal(res.crides_no_disponible, 0, 'amb wp_is_secrets_api_available() fals no es crida wp_get_secret');
  assert.deepEqual(res.estat_env, { origen: 'entorn', estat: 'ok' });
});

test('R26 · precedència explícita: una constant definida mana encara que siga buida i una variable d\'entorn amb salt de línia no passa avall', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.equal(res.constant_buida, '', 'la constant buida desactiva la clau, com abans d\'IDEA-264');
  assert.deepEqual(res.estat_constant_buida, { origen: 'constant', estat: 'absent' });
  assert.equal(res.entorn_crlf, '', 'cap capçalera injectable ni salt a la Secrets API');
  assert.deepEqual(res.estat_entorn_crlf, { origen: 'entorn', estat: 'invalida' });
});

test('R26 · empremta de cache: separa credencials de la Secrets API i mai usa el marcador emmascarat', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.match(res.proveidor_wp72.empremta, /^[a-f0-9]{64}$/);
  assert.notEqual(res.proveidor_wp72.empremta, res.empremta_rotada, 'una credencial rotada no comparteix cache ni pausa');
  assert.notEqual(res.proveidor_wp72.empremta, res.empremta_mascara, 'el marcador [secret:…] no és mai l\'entrada de l\'empremta');
  assert.notEqual(res.empremta_rotada, res.empremta_mascara);
});

test('R26 · desar secrets: manage_secrets, cap reemplaçament d\'un secret il·legible, proveïdor de només lectura i valors injectables refusats', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.equal(res.desa_anonim_codi, 'socdepoble_enxufe_secret_permis', 'el nucli no comprova capacitats: ho fa el connector');
  assert.equal(res.set_crides_anon, 0);
  assert.equal(res.desa_illegible_codi, 'socdepoble_enxufe_secret_illegible', 'mai damunt d\'una credencial que potser encara és bona');
  assert.equal(res.desa_nom_dolent, 'socdepoble_enxufe_secret_invalid');
  assert.equal(res.desa_crlf, 'socdepoble_enxufe_secret_invalid');
  assert.equal(res.desa_nomes_lectura, 'socdepoble_enxufe_secret_no_disponible');
  assert.equal(res.set_crides_final, 1, 'només el desament vàlid arriba a wp_set_secret');
  assert.equal(res.options_writes, 0);
});

test('R26 · Salut del lloc: estat sanititzat del secret il·legible i de la clau inusable, sense el missatge cru ni el valor', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.equal(res.salut_ok.status, 'good');
  assert.equal(res.salut_illegible.status, 'recommended');
  assert.equal(res.salut_illegible.label, 'A stored Sóc de Poble secret cannot be read');
  assert.match(res.salut_illegible.description, /do not save a new key over the existing one/);
  assert.doesNotMatch(JSON.stringify(res.salut_illegible), /Cannot decrypt|secret_decrypt_failed|deepl-xifrat|socdepoble\/deepl-api-key/, 'cap missatge cru, codi del proveïdor, valor ni nom');
  assert.equal(res.actiu_illegible, 'apertium', 'degradació visible: sense clau llegible, Apertium');
  assert.equal(res.salut_no_disponible.status, 'recommended');
  assert.equal(res.salut_no_disponible.label, 'WP_SECRETS_KEY is defined but the WordPress secrets API cannot use it');
});

test('R26 · preimportació: permís sobre l\'objecte (tipus editorial i contrasenya), proposta acotada en caràcters i JSON vàlid', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_secrets_i_abilities');
  assert.equal(res.tipus_intern, 'socdepoble_enxufe_permis_lectura', 'user_request (correu de privadesa) no és una entrada editorial');
  assert.doesNotMatch(JSON.stringify(res), /veina\.privada@example\.org/);
  assert.equal(res.inexistent, 'socdepoble_enxufe_permis_lectura', 'inexistent i prohibit, el mateix error: cap oracle');
  assert.equal(res.protegit_sense, 'socdepoble_enxufe_permis_lectura', 'una entrada amb contrasenya demana edit_post, no només read_post');
  assert.doesNotMatch(JSON.stringify(res), /Acord reservat/);
  assert.equal(res.protegit_amb, 'Acta reservada de la junta', 'amb edit_post sobre l\'entrada, sí');
  assert.equal(res.draft.entradilla, 'Diumenge a les 10 h esmorzarem pa torrat amb oli primerenc.', 'l\'entradilla no repetix ni enganxa el subtítol');
  assert.deepEqual(res.draft.seccions_h3, [{ titol_h3: 'Programa del matí' }]);

  for (const cas of ['llarg', 'llarg_entrada']) {
    assert.equal(res[`${cas}_json`], true, `${cas}: cap caràcter UTF-8 partit`);
    const m = res[`${cas}_mesures`];
    assert.ok(m.h1 <= 300 && m.subtitol_h2 <= 300 && m.entradilla <= 320, `${cas}: ${JSON.stringify(m)}`);
    for (const s of m.seccions) assert.ok(s.titol_h3 <= 300 && s.resum <= 2000, `${cas}: ${JSON.stringify(s)}`);
  }
  assert.equal(res.llarg_mesures.entradilla, 320);
  assert.equal(res.llarg_mesures.h1, 300);
});

test('R26 · esquemes de les abilities tancats: default a l\'entrada, cap «properties» buida i eixides amb additionalProperties false', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const { esquemes } = executaCasPhp('wp72_secrets_i_abilities');
  const tancat = (esquema, cami) => {
    if (esquema.type === 'object') {
      assert.equal(esquema.additionalProperties, false, `${cami}: objecte obert`);
      if ('properties' in esquema) assert.ok(!Array.isArray(esquema.properties), `${cami}: «properties» és [] en JSON`);
      for (const [nom, fill] of Object.entries(esquema.properties ?? {})) tancat(fill, `${cami}.${nom}`);
    }
    if (esquema.type === 'array') {
      assert.ok(esquema.items, `${cami}: llista sense items`);
      tancat(esquema.items, `${cami}[]`);
    }
  };
  for (const [nom, { input, output }] of Object.entries(esquemes)) {
    assert.equal(input.type, 'object', nom);
    assert.ok('default' in input, `${nom}: sense «default», una crida sense input falla al nucli (ability_invalid_input)`);
    tancat(input, `${nom}.input`);
    tancat(output, `${nom}.output`);
  }
  const prepara = esquemes['socdepoble/prepara-importacio-pedra-seca'].output.properties;
  assert.deepEqual(prepara.publicat_automaticament.enum, [false], 'la proposta no publica mai');
  assert.deepEqual(prepara.requerix_revisio_humana.enum, [true]);
  for (const nom of Object.keys(esquemes)) {
    const props = esquemes[nom].input.properties ?? {};
    for (const vetat of ['url', 'endpoint', 'secret', 'clau', 'command', 'shell', 'publish', 'status']) {
      assert.ok(!(vetat in props), `${nom}: l'entrada no accepta ${vetat}`);
    }
  }
});

test('R26 · abilities dins del WP_Ability i del validador REAL del nucli: crida sense input, claus estranyes i eixides', { skip: (!PHP_BIN && 'PHP CLI no disponible') || (!NUCLI_WP && 'sense WordPress 6.9+ local (SDP_WP_NUCLI o WordPress Studio)') }, () => {
  const res = JSON.parse(execFileSync(PHP_BIN, [RUNNER_NUCLI, NUCLI_WP], { encoding: 'utf8' }));
  for (const [nom, ok] of Object.entries(res.registre)) assert.equal(ok, true, `${nom}: WP_Ability rebutja el registre (${ok})`);
  assert.deepEqual(res.crides, {
    diag_sense_entrada: 'ok',
    diag_objecte_buit: 'ok',
    diag_clau_estranya: 'ability_invalid_input',
    audit_sense_entrada: 'ok',
    audit_limit: 'ok',
    audit_limit_fora: 'ability_invalid_input',
    audit_clau_estranya: 'ability_invalid_input',
    prepara_sense_entrada: 'socdepoble_enxufe_entrada_buida',
    prepara_post: 'ok',
    prepara_html: 'ok',
    prepara_url_estranya: 'ability_invalid_input',
    prepara_publica: 'ability_invalid_input'
  });
  assert.deepEqual(res.avisos, [], 'cap _doing_it_wrong del nucli');
});

/* R26.2 · Exempcions del 503 sense cap camí: el sanitize_text_field real esborra els %XX, i
   un camí comparat en minúscules o per basename deixava eixir del 503 peticions que el nucli
   encamina com a contingut normal (PATH_INFO, ?name=…) o, amb enllaços permanents simples
   darrere de try_files, la portada. wp-login.php no passa per template_redirect ni per REST. */
test('R26.2 · 503: cap exempció per camí (%XX, majúscules, /x/wp-login.php, PATH_INFO) i /robots.txt només amb is_robots()', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const hostils = [
    '/%41robots.txt',
    '/robots.txt%20?p=5',
    '/ROBOTS.TXT',
    '/robots.txt',
    '/hola-mon/wp-login.php?name=hola-mon',
    '/index.php/wp-login.php?name=hola-mon&preview=1',
    '/wp-login.php'
  ];
  for (const uri of hostils) {
    assert.deepEqual(executaCasPhp('manteniment_front_actiu', [uri]), { status: 503, nocache: true, cos_503: true }, `${uri}: sense is_robots(), 503`);
  }
  assert.deepEqual(executaCasPhp('manteniment_front_actiu', ['/robots.txt', 'robots']), { status: 200, nocache: false, cos_503: false }, 'el robots.txt que encamina el nucli queda fora');

  const mu = nomesCodiPhp(llig(MU_PLUGIN));
  assert.doesNotMatch(mu, /REQUEST_URI|sanitize_text_field|\bstrtolower\s*\(|\bbasename\s*\(|wp-login\.php/, 'l\'exempció no depén del camí de la petició');
  assert.deepEqual([...mu.matchAll(/\badd_(?:action|filter)\(\s*'([^']+)'/g)].map((m) => m[1]), ['template_redirect', 'rest_pre_dispatch'], 'cap ganxo que recórrega wp-login.php');
});

test('R26.2 · 503: WP-CLI també queda fora a l\'API REST (rest_do_request en una ordre o migració)', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  assert.deepEqual(executaCasPhp('manteniment_wp_cli'), { rest: null, portada: true, crides_caps: 0 });
});

test('R26.2 · 503: només un instant absolut obri la finestra; una data relativa o sense zona no fa el manteniment perpetu', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('manteniment_dates');
  assert.equal(res.restants_relatiu, 0, '«tomorrow 04:00» es recalcularia a cada petició');
  assert.equal(res.rest_relatiu, null);
  const instant = 1893470400; // 2030-01-01T04:00:00Z
  for (const nom of ['z', 'z_sense_segons', 'desplacament_mes', 'desplacament_menys', 'salt_final', 'xifres', 'enter']) {
    assert.equal(res.fins[nom], instant, nom);
  }
  for (const nom of ['relatiu_dema', 'relatiu_hores', 'relatiu_ara', 'sense_zona_espai', 'sense_zona_t', 'dia_inexistent', 'hora_24', 'zona_fora', 'negatiu', 'decimal', 'exponent', 'llista']) {
    assert.equal(res.fins[nom], 0, `${nom}: manteniment inactiu`);
  }
  const fins = cosFuncio(llig(MU_PLUGIN), 'socdepoble_enxufe_manteniment_503_fins');
  const validacio = fins.indexOf("preg_match( '/^(\\d{4}-");
  assert.ok(validacio > 0 && fins.indexOf('strtotime(') > validacio, 'strtotime() només després de validar l\'instant absolut');
  assert.equal([...nomesCodiPhp(llig(MU_PLUGIN)).matchAll(/\bstrtotime\s*\(/g)].length, 2, 'cap altre strtotime() fora de la validació');
});

/* R26.2 · La dev note de la Secrets API (11-11-2026): «A keyring or provider from a working
   drop-in counts as available». wp_is_secrets_api_available() és l'autoritat; la constant
   WP_SECRETS_KEY només n'és la reserva si el nucli no porta eixa funció. */
test('R26.2 · Secrets API: wp_is_secrets_api_available() mana (keyring de l\'amfitrió sense WP_SECRETS_KEY) i la constant només és reserva', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const { keyring } = executaCasPhp('wp72_keyring_sense_constant');
  assert.equal(keyring.disponible, true);
  assert.equal(keyring.clau_activa, false);
  assert.equal(keyring.llegit, 'deepl-keyring-amfitrio-555');
  assert.deepEqual(keyring.estat, { origen: 'secrets_api', estat: 'ok' });
  assert.equal(keyring.proveidor, 'deepl');
  assert.deepEqual(keyring.diag, { proveidor_traduccio: 'deepl', wp_secrets_key_activa: false, secrets_api_disponible: true }, 'el diagnòstic distingix la constant de la disponibilitat');

  assert.deepEqual(executaCasPhp('wp72_sense_funcio_disponibilitat'), { funcio_absent: true, sense_constant: false, amb_constant: true });
  assert.doesNotMatch(cosFuncio(llig('includes/secrets-wp72.php'), 'socdepoble_enxufe_secrets_wp72_disponible').split("function_exists( 'wp_is_secrets_api_available' )")[0], /clau_activa/, 'la constant no es mira abans de la funció del nucli');
});

test('R26.2 · Salut: cada causa amb el seu text (abans de la 7.2, valor invàlid, keyring i DeepL per constant sense secrets xifrats)', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('wp72_keyring_sense_constant');
  assert.equal(res.keyring.salut.status, 'good');
  assert.doesNotMatch(res.keyring.salut.description, /WP_SECRETS_KEY is active in wp-config\.php/, 'amb el keyring, la constant no hi és');

  for (const [nom, cas] of Object.entries(res.invalides)) {
    assert.deepEqual(cas, { estat: { origen: 'secrets_api', estat: 'invalida' }, valor: '' }, `${nom}: llegible però inservible, no error`);
  }
  assert.equal(res.salut_invalida.status, 'recommended');
  assert.equal(res.salut_invalida.label, 'A stored Sóc de Poble secret has an unusable value');
  assert.doesNotMatch(JSON.stringify(res.salut_invalida), /decrypt|Restore|deepl-bona|X-Injectada/, 'ni desxifrat ni restaurar la clau, ni el valor');
  assert.equal(res.desa_damunt_invalida, true, 'un valor llegible però invàlid sí que es pot reemplaçar');
  assert.equal(res.llegit_despres, 'deepl-nova-777');

  assert.equal(res.proveidor_apertium, 'apertium');
  assert.equal(res.salut_apertium.label, 'Sóc de Poble uses free Apertium translation without stored secrets');
  assert.equal(res.proveidor_constant, 'deepl');
  assert.equal(res.salut_deepl_constant.status, 'good');
  assert.doesNotMatch(JSON.stringify(res.salut_deepl_constant), /Apertium/, 'amb DeepL actiu per constant, Salut no diu que tradueix Apertium');
  assert.doesNotMatch(JSON.stringify(res.salut_deepl_constant), /deepl-des-de-constant-111/);
  assert.equal(res.crides_sense_api, 0, 'sense l\'API disponible, Salut no crida wp_get_secret');

  const antic = executaCasPhp('wp_antic_amb_clau');
  // v1.2.25 · C4B (K-C4B-PROVES) · upgrade_http entra entre el paquet i els secrets (motiu a T1).
  assert.deepEqual(antic.proves, ['socdepoble_enxufe_entorn', 'socdepoble_enxufe_paquet', 'socdepoble_enxufe_upgrade_http', 'socdepoble_enxufe_secrets']);
  assert.equal(antic.salut.status, 'good');
  // v1.2.18 · Gauntlet R2 (L3R2-01) · sense l'API, el text no la promet per a cap versió.
  // v1.2.19 · fusió · R32.29 (lot 02) hi esperava «The optional WordPress secrets API is not available»;
  // salut.php conserva el text de la v1.2.18, i la prova d'entorn del kit queda a la llista de dalt.
  assert.equal(antic.salut.label, 'This WordPress does not have the secrets API');
  assert.doesNotMatch(JSON.stringify(antic.salut), /7\.2|\byet\b|arrive/, 'sense l\'API, cap promesa lligada a una versió');
  assert.doesNotMatch(antic.salut.description, /Restore|cannot use it/, 'sense l\'API no hi ha cap clau a restaurar');
});

/* v1.2.18 · Gauntlet R2 (L3R2-01) · Un WordPress 7.2 (RC1 o final) sense wp_get_secret ni WP_SECRETS_KEY.
   Només salut.php amb els mínims del nucli, i is_wp_version_compatible() sempre cert: la versió no hi pinta res. */
function salutSenseApi({ ambClau }) {
  const codi = [
    "define( 'ABSPATH', '/' ); define( 'SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble' );",
    ambClau ? "define( 'WP_SECRETS_KEY', 'clau-preparada-sense-api' );" : '',
    'function __( $t, $d = null ) { return $t; } function esc_html__( $t, $d = null ) { return $t; } function esc_html( $t ) { return $t; }',
    "function esc_url( $u ) { return $u; } function admin_url( $p = '' ) { return '/wp-admin/' . $p; } function add_filter( ...$a ) {}",
    'function is_wp_version_compatible( $r ) { return true; }',
    // v1.2.25 · C4B (K-C4B-PROVES) · salut.php consulta el manifest local per decidir si registra trossos_http.
    // L'arnés només carrega salut.php: sense manifest (null) el format no és «trossos» i trossos_http no es registra.
    'function socdepoble_enxufe_manifest_local() { return null; }',
    'require $argv[1];',
    '$r = socdepoble_enxufe_prova_secrets_wp72();',
    "echo json_encode( array( 'te_wp_get_secret' => function_exists( 'wp_get_secret' ), 'proves' => array_keys( socdepoble_enxufe_proves_salut( array( 'direct' => array() ) )['direct'] ), 'status' => $r['status'], 'label' => $r['label'] ), JSON_UNESCAPED_UNICODE );"
  ].join('\n');
  return JSON.parse(execFileSync(PHP_BIN, ['-r', codi, '--', path.join(PLUGIN, 'includes/salut.php')], { encoding: 'utf8' }));
}

test('v1.2.18 · Gauntlet R2 (L3R2-01) · Salut: la prova de secrets es registra per presència, mai per la versió 7.2', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const sense = salutSenseApi({ ambClau: false });
  assert.equal(sense.te_wp_get_secret, false);
  // v1.2.19 · fusió · R32.29 (lot 02) registra sempre la prova d'entorn (autoload i memòria cau) davant del paquet.
  // v1.2.25 · C4B (K-C4B-PROVES) · upgrade_http és l'observació HTTP de Salut, no de secrets (motiu a T1).
  assert.deepEqual(sense.proves, ['socdepoble_enxufe_entorn', 'socdepoble_enxufe_paquet', 'socdepoble_enxufe_upgrade_http'], 'un 7.2 sense l\'API ni WP_SECRETS_KEY no rep cap prova de secrets');
  const ambClau = salutSenseApi({ ambClau: true });
  assert.deepEqual(ambClau.proves, ['socdepoble_enxufe_entorn', 'socdepoble_enxufe_paquet', 'socdepoble_enxufe_upgrade_http', 'socdepoble_enxufe_secrets'], 'WP_SECRETS_KEY sí que la registra');
  assert.deepEqual({ status: ambClau.status, label: ambClau.label }, { status: 'good', label: 'This WordPress does not have the secrets API' });
  assert.doesNotMatch(nomesCodiPhp(llig('includes/salut.php')), /\bis_wp_version_compatible\s*\(|\$wp_version\b|get_bloginfo\(\s*'version'/, 'salut.php no inferix l\'API per la versió');
});

test('R26.2 · preimportació: encapçalaments en temps lineal sense PCRE JIT i amb la mateixa semàntica que els patrons d\'abans', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('preimportacio_cost', [], ['-d', 'pcre.jit=0']);
  assert.equal(res.jit, false, 'la mesura és sense JIT, com en molts amfitrions compartits');
  for (const [nom, ms] of Object.entries(res.ms)) {
    assert.ok(ms < 1000, `${nom}: ${ms} ms per a 64 KiB (abans, segons de CPU per crida)`);
    assert.equal(res.ok[nom], true, `${nom}: proposta vàlida`);
  }
  assert.equal(res.diferencies, 0, 'cap diferència amb els patrons <h…>(.*?)</h…> d\'abans');
  assert.equal(res.diferencies_text, 0, 'el text pla lineal casa amb el patró de wp_strip_all_tags() del nucli');
  assert.ok(['h2_tancament_fals', 'h2_sense_tancar', 'script_sense_tancar', 'titol_del_post'].every((nom) => nom in res.ms), 'també <script> sense tancar i el títol del post sense maxLength');
  assert.doesNotMatch(nomesCodiPhp(llig('includes/abilities-mcp.php')), /\.\*\?<\\\/h/, 'cap patró «.*?</h» quadràtic a la proposta');
  assert.doesNotMatch(nomesCodiPhp(cosFuncio(llig('includes/abilities-mcp.php'), 'socdepoble_enxufe_ability_prepara_pedra_seca')), /\bwp_strip_all_tags\s*\(/, 'el patró del nucli també és O(n²) sense JIT');
});

test('T2 (mu-plugin HTTP 503): is_robots i /robots.txt exempts, finestra UTC viva i HTML sense recursos externs', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('manteniment_503');
  assert.equal(res.exempt_is_robots, true);
  assert.equal(res.exempt_robots_uri, true);
  assert.equal(res.exempt_admin, true);
  assert.equal(res.visitant_portada, false);
  assert.ok(res.restants > 800 && res.restants <= 900);
  assert.match(res.html, /<meta name="robots" content="noindex,noarchive">/);
  assert.doesNotMatch(res.html, /https?:\/\//i, 'cap recurs extern durant el manteniment 503');
});

test('R26 · 503: robots només a /robots.txt, Retry-After vàlid, REST tancat per defecte amb exclusions exactes', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const res = executaCasPhp('manteniment_503');
  assert.equal(res.exempt_robots_fals, false, 'un altre camí acabat en robots.txt no és /robots.txt');
  assert.equal(res.visitant_wpjson, false);
  for (const [cas, capcaleres] of Object.entries(res.capcaleres)) assert.match(capcaleres['Retry-After'], /^[1-9]\d*$/, cas);
  assert.equal(res.capcaleres.curt['Retry-After'], '60');
  assert.equal(res.capcaleres.llarg['Retry-After'], '86400');

  const tancades = ['/wp/v2/posts', '/', '/sdp-proves/v1/webhookx', '/sdp-proves/v1'];
  for (const ruta of tancades) {
    const r = res.rest[ruta];
    assert.equal(r?.status, 503, `${ruta}: 503`);
    assert.match(r.headers['Retry-After'], /^[1-9]\d*$/, `${ruta}: Retry-After`);
    assert.match(r.headers['Cache-Control'], /no-store/, `${ruta}: sense memòria cau`);
    assert.ok(!('Last-Modified' in r.headers), `${ruta}: cap capçalera a false`);
  }
  assert.equal(res.rest['/sdp-proves/v1/webhook'], null, 'el prefix exacte declarat continua obert');
  assert.equal(res.rest['/sdp-proves/v1/webhook/stripe'], null, 'i les seues subrutes');
  assert.equal(res.rest_previ, true, 'un resultat previ d\'un altre filtre passa intacte');
  assert.equal(res.rest_admin, null, 'manage_options continua treballant per REST');
});

test('R26 · 503: en desactivar torna el 200/404 normal sense cap comprovació i, actiu, la portada respon 503 sense cache', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const inactiu = executaCasPhp('manteniment_inactiu');
  assert.deepEqual(inactiu, { status: 200, nocache: false, cos: '', rest: null, crides_caps: 0, restants: 0 });
  const actiu = executaCasPhp('manteniment_front_actiu');
  assert.deepEqual(actiu, { status: 503, nocache: true, cos_503: true });
});

/* Onada R29 (wp-503-lang) · El lang diu la llengua en què ix el text (WCAG 3.1.1): l'anglés
   d'origen sense traducció i el locale efectiu, escapat, quan n'hi ha. */
test('Onada R29 · 503: lang="en" sense traducció i el locale del lloc (ca_valencia → ca-valencia) amb traducció, escapat', { skip: !PHP_BIN && 'PHP CLI no disponible' }, () => {
  const { html } = executaCasPhp('manteniment_503_llengua');
  const lang = (doc) => /<html lang="([^"]*)">/.exec(doc)?.[1];
  assert.equal(lang(html.en_us), 'en');
  assert.equal(lang(html.es_sense_trad), 'en', 'sense traducció el text és anglés, encara que el lloc siga es_ES');
  assert.match(html.es_sense_trad, /<h1>Scheduled maintenance in progress<\/h1>/);
  assert.equal(lang(html.ca_traduit), 'ca');
  assert.match(html.ca_traduit, /<h1>Manteniment tècnic programat en curs<\/h1>/);
  assert.equal(lang(html.valencia), 'ca-valencia');
  assert.equal(lang(html.locale_hostil), 'ca&quot;&gt;&lt;script&gt;x&lt;/script&gt;', 'el locale filtrat ix escapat dins de l\'atribut');
  assert.doesNotMatch(html.locale_hostil, /<script>/);
  assert.doesNotMatch(llig(MU_PLUGIN), /<html lang="ca">/, 'cap lang fix');
});

test('R26 · 503: cap purga global per petició, cap escriptura i l\'exemple d\'amfitrió no viatja al ZIP del connector', () => {
  const mu = llig(MU_PLUGIN);
  assert.doesNotMatch(mu, /\b(?:wp_cache_flush|flush_rewrite_rules|wp_cache_delete|delete_transient|delete_option|update_option|add_option|set_transient|\$wpdb)\b/, 'el mu-plugin només respon');
  assert.match(mu, /add_action\( 'template_redirect', 'socdepoble_enxufe_manteniment_503_resposta', 0 \);/);
  assert.match(mu, /add_filter\( 'rest_pre_dispatch', 'socdepoble_enxufe_manteniment_503_rest', 0, 3 \);/);
  assert.doesNotMatch(mu, /HTTP_USER_AGENT/, 'cap distinció per User-Agent');

  /* L'exemple és de l'amfitrió (es copia a wp-content/mu-plugins/), no del connector: viu a eines/,
     que H4 (higiene-estructural) admet i la llista blanca ADAPTADOR no empaqueta. */
  assert.ok(!ADAPTADOR.carpetes.includes('eines') && !ADAPTADOR.fitxers.some((rel) => rel.startsWith('eines/')), 'la llista blanca del paquet no porta eines/');
  const rels = fitxersAdaptador(PLUGIN).map((f) => f.rel);
  assert.ok(rels.includes('includes/abilities-mcp.php') && rels.includes('includes/secrets-wp72.php'), 'els includes nous sí que hi viatgen');
  assert.ok(!rels.includes(MU_PLUGIN), 'el mu-plugin d\'exemple no entra al ZIP');
  assert.deepEqual(rels.filter((rel) => /manteniment|mu-plugin/.test(rel)), []);
  for (const rel of rels.filter((r) => r.endsWith('.php'))) {
    assert.doesNotMatch(llig(rel), /\b(?:require|include)(?:_once)?\b[^;]*(?:sdp-manteniment-503|amfitrio\/)/, `${rel}: el connector no carrega cap exemple d'amfitrió`);
  }
});

test('R26 · fitxer principal: els includes nous amb guarda ABSPATH i en ordre (secrets → traducció → Salut → abilities)', () => {
  const principal = llig('socdepoble-enxufe.php');
  const pos = (rel) => principal.indexOf(`\nrequire_once __DIR__ . '/includes/${rel}';\n`);
  for (const rel of ['secrets-wp72.php', 'traduccio.php', 'salut.php', 'abilities-mcp.php']) assert.ok(pos(rel) > 0, `${rel} es carrega sense condició`);
  assert.ok(pos('secrets-wp72.php') < pos('traduccio.php'), 'secrets abans de traducció');
  assert.ok(pos('traduccio.php') < pos('salut.php') && pos('salut.php') < pos('abilities-mcp.php'), 'abilities al final: usa traducció, secrets i Salut');
  assert.ok(principal.indexOf("if ( defined( 'SOCDEPOBLE_ENXUFE_FITXER' ) ) {") < pos('secrets-wp72.php'), 'darrere de la guarda de doble còpia');
  assert.match(llig('includes/traduccio.php'), /^require_once __DIR__ \. '\/secrets-wp72\.php';$/m, 'traduccio.php també es carrega sol (proves i amfitrions)');
  for (const rel of ['includes/secrets-wp72.php', 'includes/abilities-mcp.php', MU_PLUGIN]) {
    const text = llig(rel);
    const guarda = text.indexOf("\ndefined( 'ABSPATH' ) || exit;\n");
    assert.ok(guarda > 0, `${rel}: guarda ABSPATH`);
    assert.doesNotMatch(text.slice(0, guarda).replace(/\/\*[^]*?\*\//g, ''), /\b(?:function|add_action|add_filter|const)\b/, `${rel}: res abans de la guarda`);
  }
  // Cap is_admin() com a autorització, cap registre de secrets ni capçaleres.
  for (const rel of ['includes/secrets-wp72.php', 'includes/abilities-mcp.php', 'includes/traduccio.php', 'includes/salut.php', MU_PLUGIN]) {
    const codi = llig(rel).replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(codi, /\bis_admin\s*\(/, `${rel}: is_admin() no és un permís`);
    assert.doesNotMatch(codi, /\b(?:error_log|var_dump|var_export|print_r|debug_print_backtrace)\s*\(/, `${rel}: cap registre`);
  }
  // La custòdia de WP_SECRETS_KEY és de l'amfitrió: el connector no la definix, no la deriva de les SALTs ni la rota.
  const relsPhp = ['socdepoble-enxufe.php', 'uninstall.php', ...fitxersAdaptador(PLUGIN).map((f) => f.rel).filter((r) => r.startsWith('includes/') && r.endsWith('.php'))];
  const totPhp = relsPhp.map((rel) => llig(rel)).join('\n');
  assert.doesNotMatch(totPhp, /define\(\s*'WP_SECRETS_KEY'/, 'cap WP_SECRETS_KEY definida pel connector');
  assert.doesNotMatch(totPhp, /\b(?:rotate_site_key|wp_retire_secret_version|wp_import_option_as_secret|random_bytes|sodium_crypto_\w*keygen)\s*\(/, 'cap rotació, importació ni clau nova (l’esborrat propi només viu a uninstall.php)');
  /* v1.2.18 · Gauntlet R2 (L3R2-03) · La prohibició només llegia 2 dels 15 PHP que no són
     uninstall.php: un esborrat a Salut, als Ajustos o a les abilities passava. Ara cobrix
     la mateixa llista que el patró global d'abans, menys la desinstal·lació. */
  for (const rel of relsPhp.filter((r) => r !== 'uninstall.php')) assert.doesNotMatch(llig(rel), /\bwp_delete_secret\s*\(/, `${rel}: cap esborrat fora de la desinstal·lació`);
  assert.doesNotMatch(llig('includes/secrets-wp72.php'), /\bwp_salt\s*\(/, 'les SALTs no deriven cap secret');
  assert.doesNotMatch(llig('includes/secrets-wp72.php'), /\b(?:get|update|add)_option\s*\(/, 'cap reserva en text pla a wp_options');
});
