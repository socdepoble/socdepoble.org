import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import configNatiu, {
  DIRECTORI_NATIU,
  ENLLAC_FONTS_LOCALS,
  ENTRADA_NATIVA,
  FONTS_LOCALS,
  MODE_NATIU,
  ORIGINALS_CITATS_SENSE_RESOLUTOR,
  SUBSTITUCIONS_NATIVES,
  cspNativa,
  errorsEntornNatiu,
  heretadesDelLloc,
  indexNatiuPlugin,
  nomsDeclarats,
  politicaDeMitjansNativa,
  transformaIndexNatiu
} from '../vite.natiu.config.js';
import { PROPIS_DEL_LLOC, esHostLocal, politicaDeMitjans, recursosDelPlugin } from '../vite.standalone.config.js';
import { bessonaDe } from '../src/config/politicaDeMitjans.js';

/* El build de l'app nativa (ARQUITECTURA.txt §4.4 i §5, 261003) es prova amb
   FIXTURES, com tests/standalone-build.test.mjs: les peces pures sobre
   l'index.html REAL del repositori i entorns sintètics. Les eixides reals
   (dist-natiu/ i wordpress-plugin/dist/) només es miren si existixen; si no,
   la prova diu per què se l'ha saltat. Mai passen en silenci. */

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = fs.readFileSync(path.join(ARREL, 'index.html'), 'utf8');
const PUBLIC = path.join(ARREL, 'public');
const CLAU_POLITICA = 'import.meta.env.SDP_POLITICA_DE_MITJANS';
const ORIGEN = 'https://abcdefghijklmnop.supabase.co';
const WSS = 'wss://abcdefghijklmnop.supabase.co';
const CLAU = 'sb_publishable_' + 'fixturesintetica';
const TENANT = '11111111-2222-3333-4444-555555555555';
// Compost a trossos: cap porta que llija tests/ no ha de prendre això per un import.
const CAP = ['@capa', 'citor'].join('');

/** Les directives d'una CSP: { nom: [fonts] }. */
function directives(csp) {
  return Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean)
    .map((d) => { const [nom, ...fonts] = d.split(/\s+/); return [nom, fonts]; }));
}

/** El contingut de l'única meta CSP d'un HTML. */
function cspDe(html) {
  const metes = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g)];
  assert.equal(metes.length, 1, 'una sola meta CSP');
  return metes[0][1];
}

/** Camins absoluts de tots els fitxers de `directori` amb una extensió de `extensions`. */
function fitxersAmb(directori, extensions) {
  const eixida = [];
  const recorre = (abs) => {
    for (const entrada of fs.readdirSync(abs, { withFileTypes: true })) {
      const fill = path.join(abs, entrada.name);
      if (entrada.isDirectory()) recorre(fill);
      else if (extensions.some((ext) => entrada.name.endsWith(ext))) eixida.push(fill);
    }
  };
  recorre(directori);
  return eixida.sort();
}

/* ─────────────────────── transformaIndexNatiu ─────────────────────── */

test('index.html real: cada text que el build natiu substituïx hi és, i una sola vegada', () => {
  // 9 des del 261004: el lloc ja porta les fonts de casa i no hi ha Google Fonts a substituir.
  assert.equal(SUBSTITUCIONS_NATIVES.length, 9);
  assert.ok(SUBSTITUCIONS_NATIVES.every(({ cerca }) => !cerca.includes('fonts.g')), 'cap substitució de Google Fonts');
  assert.ok(Object.isFrozen(SUBSTITUCIONS_NATIVES) && SUBSTITUCIONS_NATIVES.every(Object.isFrozen));
  for (const { que, cerca, fins } of SUBSTITUCIONS_NATIVES) {
    assert.equal(INDEX.split(cerca).length, 2, `${que}: «${cerca}»`);
    if (fins) assert.ok(INDEX.indexOf(fins, INDEX.indexOf(cerca)) > -1, `${que} es tanca amb «${fins}»`);
  }
});

test('transformaIndexNatiu sobre l\'index.html real: entrada nativa, CSP del §4.4, fonts locals i cap rastre de la PWA', () => {
  const html = transformaIndexNatiu(INDEX, { origenBackend: ORIGEN });
  assert.equal(ENTRADA_NATIVA, '/src/natiu/entrada.jsx');
  assert.equal(html.split('<script type="module" src="/src/natiu/entrada.jsx"></script>').length, 2);
  assert.ok(!html.includes('/src/main.jsx'));

  const d = directives(cspDe(html));
  assert.deepEqual(Object.keys(d).sort(), ['base-uri', 'connect-src', 'default-src', 'font-src', 'frame-src', 'img-src', 'object-src', 'script-src', 'style-src', 'worker-src']);
  assert.deepEqual(d['connect-src'], ["'self'", 'data:', ORIGEN, WSS], 'data: per a les tres pujades amb fetch(dataUrl), i només el backend');
  assert.deepEqual(d['worker-src'], ["'none'"]);
  assert.deepEqual(d['script-src'], ["'self'"]);
  assert.deepEqual(d['style-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(d['default-src'], ["'self'", 'data:', 'blob:']);
  assert.deepEqual(d['img-src'], ["'self'", 'data:', 'blob:', 'https:']);
  assert.deepEqual(d['font-src'], ["'self'", 'data:']);
  assert.deepEqual(d['frame-src'], ["'self'", 'https:']);
  assert.deepEqual(d['object-src'], ["'none'"]);
  assert.deepEqual(d['base-uri'], ["'self'"]);

  for (const vetat of ['fonts.googleapis.com', 'fonts.gstatic.com', 'rel="manifest"', 'manifest.webmanifest', 'apple-mobile-web-app',
    'mobile-web-app-capable', 'display-mode: standalone', 'Fase 0', 'localhost', '127.0.0.1', "'unsafe-eval'"]) {
    assert.ok(!html.includes(vetat), vetat);
  }
  assert.equal(FONTS_LOCALS, '/fonts/noto-sans.css');
  assert.equal(ENLLAC_FONTS_LOCALS, '<link rel="stylesheet" href="/fonts/noto-sans.css" />');
  assert.equal(html.split('<link rel="stylesheet" href="/fonts/noto-sans.css" />').length, 2);

  // La resta queda intacta, també les fonts de casa i el seu preload: només es
  // lleven 9 línies i en canvien 2 (entrada i CSP).
  for (const intacte of ['<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
    '<meta name="theme-color" content="#fff4ef" />', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />', '<title>Sóc de Poble</title>', '<div id="root"></div>',
    ENLLAC_FONTS_LOCALS, '<link rel="preload" href="/fonts/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2" as="font" type="font/woff2" crossorigin />']) {
    assert.ok(html.includes(intacte), intacte);
  }
  const abans = new Set(INDEX.split('\n'));
  const noves = html.split('\n').filter((linia) => !abans.has(linia));
  assert.equal(noves.length, 2, noves.join('\n'));
  assert.equal(INDEX.split('\n').length - html.split('\n').length, 9);
});

test('si index.html canvia, transformaIndexNatiu llança: res de substitucions a cegues', () => {
  // Sense cada un dels textos esperats.
  for (const { que, cerca } of SUBSTITUCIONS_NATIVES) {
    assert.throws(() => transformaIndexNatiu(INDEX.replace(cerca, ''), { origenBackend: ORIGEN }),
      (error) => /index\.html ja no porta/.test(error.message) && error.message.includes(que), que);
  }
  // Un text repetit: la substitució seria ambigua.
  const manifest = '<link rel="manifest" href="/manifest.webmanifest" />';
  assert.throws(() => transformaIndexNatiu(INDEX.replace('</head>', `${manifest}\n</head>`), { origenBackend: ORIGEN }), /més d'una vegada/);
  // Una línia que també porta una altra cosa no es lleva a mitges.
  assert.throws(() => transformaIndexNatiu(INDEX.replace(manifest, `${manifest}<meta name="x" content="y" />`), { origenBackend: ORIGEN }), /no és sol a la seua línia/);
  // Un comentari de la PWA que perd el tancament: no s'empassa el comentari següent.
  const obertura = SUBSTITUCIONS_NATIVES.find((s) => s.fins).cerca;
  const tancament = INDEX.indexOf('-->', INDEX.indexOf(obertura));
  const senseTancar = INDEX.slice(0, tancament) + INDEX.slice(tancament + 3);
  assert.ok(senseTancar.indexOf('<!--', INDEX.indexOf(obertura) + 1) > -1, 'la fixture té un altre comentari després');
  assert.throws(() => transformaIndexNatiu(senseTancar, { origenBackend: ORIGEN }), /no es tanca/);
  // Un altre enllaç a Google Fonts que algú afig: l'eixida el delata.
  assert.throws(() => transformaIndexNatiu(INDEX.replace('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Altra">\n</head>'), { origenBackend: ORIGEN }),
    /encara porta Google Fonts/);
  assert.throws(() => transformaIndexNatiu(INDEX.replace('</head>', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n</head>'), { origenBackend: ORIGEN }),
    /encara porta Google Fonts/);
  // Les fonts de casa: si algú les lleva d'index.html, o les repetix, l'app no es compila.
  assert.throws(() => transformaIndexNatiu(INDEX.replace(ENLLAC_FONTS_LOCALS, ''), { origenBackend: ORIGEN }), /fonts de casa exactament una vegada/);
  assert.throws(() => transformaIndexNatiu(INDEX.replace('</head>', `${ENLLAC_FONTS_LOCALS}\n</head>`), { origenBackend: ORIGEN }), /fonts de casa exactament una vegada/);
  // L'eixida no es pot tornar a transformar: ja no és l'index.html del lloc.
  const natiu = transformaIndexNatiu(INDEX, { origenBackend: ORIGEN });
  assert.throws(() => transformaIndexNatiu(natiu, { origenBackend: ORIGEN }), /ja no porta l'entrada del lloc/);
  assert.throws(() => transformaIndexNatiu(undefined, { origenBackend: ORIGEN }), TypeError);
});

test('origenBackend: només un origen https públic i exacte', () => {
  for (const dolent of [undefined, '', 'no és una URL', 'http://abcdefghijklmnop.supabase.co', `${ORIGEN}/`, `${ORIGEN}/rest/v1`,
    'https://localhost', 'https://127.0.0.1:54321', 'https://192.168.1.10', 'https://node.local', WSS,
    'https://usuari:secret@abcdefghijklmnop.supabase.co']) {
    assert.throws(() => cspNativa(dolent), /origenBackend/, String(dolent));
    assert.throws(() => transformaIndexNatiu(INDEX, { origenBackend: dolent }), /origenBackend/, String(dolent));
    assert.throws(() => indexNatiuPlugin({ origenBackend: dolent }), /origenBackend/, String(dolent));
  }
  assert.throws(() => transformaIndexNatiu(INDEX), /origenBackend/);
  // Amb port: el wss porta el mateix host i port.
  assert.deepEqual(directives(cspNativa('https://node.example.org:8443'))['connect-src'],
    ["'self'", 'data:', 'https://node.example.org:8443', 'wss://node.example.org:8443']);
});

/* ─────────────────────────── errorsEntornNatiu ─────────────────────────── */

test('errorsEntornNatiu: un entorn net no dona cap error, amb o sense tenant', () => {
  const net = { VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU };
  assert.deepEqual(errorsEntornNatiu(net), []);
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_SUPABASE_URL: `${ORIGEN}/` }), []);
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_TENANT_ID: TENANT }), []);
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_TENANT_ID: TENANT.toUpperCase() }), []);
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_TENANT_ID: '  ' }), [], 'un tenant buit és «sense tenant»');
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_UMAMI_HOST: '', VITE_UMAMI_WEBSITE_ID: ' ', VITE_GOOGLE_OAUTH_CLIENT_ID: '' }), [], 'buides valen');
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_GCAL_FONTS: '[]', VITE_DATA_MODE: 'remote' }), [], 'el que no vigila, no ho jutja');
});

test('errorsEntornNatiu: una URL local, http, absent o invàlida dona error', () => {
  const casos = [
    ['http://localhost:54321', /ha de ser https/],
    ['http://abcdefghijklmnop.supabase.co', /ha de ser https/],
    ['https://localhost', /és local/],
    ['https://127.0.0.1:54321', /és local/],
    ['https://192.168.1.5', /és local/],
    ['https://[::1]:54321', /és local/],
    ['https://node.local', /és local/],
    [undefined, /no és una URL vàlida/],
    ['', /no és una URL vàlida/],
    ['supabase', /no és una URL vàlida/]
  ];
  for (const [url, motiu] of casos) {
    const errors = errorsEntornNatiu({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: CLAU });
    assert.equal(errors.length, 1, String(url));
    assert.match(errors[0], motiu, String(url));
  }
});

test('errorsEntornNatiu: VITE_UMAMI_* i VITE_GOOGLE_OAUTH_CLIENT_ID plens, o un tenant que no és UUID, donen error; tots s\'acumulen', () => {
  const net = { VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU };
  const umami = errorsEntornNatiu({ ...net, VITE_UMAMI_WEBSITE_ID: 'abc', VITE_UMAMI_HOST: 'https://umami.example.org', VITE_UMAMI_SHARE_URL: '' });
  assert.equal(umami.length, 2);
  assert.match(umami[0], /^VITE_UMAMI_HOST /);
  assert.match(umami[1], /^VITE_UMAMI_WEBSITE_ID /);
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_UMAMI_QUALSEVOL: 'x' }).length, 1, 'qualsevol VITE_UMAMI_*');
  const google = errorsEntornNatiu({ ...net, VITE_GOOGLE_OAUTH_CLIENT_ID: '1234-abc.apps.googleusercontent.com' });
  assert.equal(google.length, 1);
  assert.match(google[0], /VITE_GOOGLE_OAUTH_CLIENT_ID/);
  for (const tenant of ['default-tenant', '1234', `${TENANT}x`]) {
    const errors = errorsEntornNatiu({ ...net, VITE_TENANT_ID: tenant });
    assert.equal(errors.length, 1, tenant);
    assert.match(errors[0], /VITE_TENANT_ID/);
  }
  const tot = errorsEntornNatiu({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_UMAMI_HOST: 'https://u.example.org', VITE_GOOGLE_OAUTH_CLIENT_ID: 'x', VITE_TENANT_ID: 'x' });
  assert.equal(tot.length, 4);
  assert.deepEqual(errorsEntornNatiu(), [errorsEntornNatiu({})[0]]);
});

test('nomsDeclarats i heretadesDelLloc: només noms, i només les VITE_* amb valor que cap fitxer natiu ni el procés declara', () => {
  assert.deepEqual(nomsDeclarats('# VITE_COMENTADA=1\nVITE_A=1\n  export VITE_B = "x"\nVITE_C: y\nNO_ES_VITE=2\n\nsense igual\n'),
    ['VITE_A', 'VITE_B', 'VITE_C', 'NO_ES_VITE']);
  assert.deepEqual(nomsDeclarats(''), []);
  assert.deepEqual(nomsDeclarats(), []);
  const base = { VITE_A: '1', VITE_B: 'x', VITE_C: 'local', VITE_D: '', VITE_F: '  ', PATH: '/bin' };
  const natiu = { ...base, VITE_C: 'remot', VITE_E: 'nova' };
  // VITE_C la canvia un fitxer natiu, VITE_E només hi és en natiu, VITE_D i VITE_F són buides, PATH no és VITE_*.
  assert.deepEqual(heretadesDelLloc({ natiu, base }), ['VITE_A', 'VITE_B']);
  assert.deepEqual(heretadesDelLloc({ natiu, base, declarades: ['VITE_A'] }), ['VITE_B'], 'declarada amb el mateix valor');
  assert.deepEqual(heretadesDelLloc({ natiu, base, delProces: { VITE_B: 'x' } }), ['VITE_A'], 'del procés');
  assert.deepEqual(heretadesDelLloc(), []);
});

/* ─────────────────────────── La config sencera ─────────────────────────── */

const CLAUS_VIGILADES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_TENANT_ID', 'VITE_GOOGLE_OAUTH_CLIENT_ID'];

/**
 * Avalua `funcio` amb un entorn controlat: process.env només porta les claus
 * de `valors` (de les que el build vigila), i el directori de treball és una
 * carpeta temporal amb els fitxers .env de `fitxers`. Així la prova no depén
 * dels .env del disc de qui l'executa (Vite llig .env i .env.local en
 * qualsevol mode).
 */
function ambEntornNatiu(valors, funcio, fitxers = {}) {
  const claus = [...new Set([...CLAUS_VIGILADES, ...Object.keys(process.env).filter((k) => k.startsWith('VITE_UMAMI_')), ...Object.keys(valors)])];
  const abans = Object.fromEntries(claus.map((k) => [k, process.env[k]]));
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-'));
  const cwd = process.cwd();
  for (const k of claus) {
    if (valors[k] === undefined) delete process.env[k];
    else process.env[k] = valors[k];
  }
  for (const [nom, contingut] of Object.entries(fitxers)) fs.writeFileSync(path.join(carpeta, nom), contingut);
  process.chdir(carpeta);
  try { return funcio(); } finally {
    process.chdir(cwd);
    for (const [k, v] of Object.entries(abans)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
}

test('la config: dist-natiu buidat, es2022, mode natiu, base /, sense copyPublicDir, amb els recursos del connector i l\'índex natiu', () => {
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    const cfg = configNatiu({ mode: MODE_NATIU, command: 'build' });
    assert.equal(MODE_NATIU, 'natiu');
    assert.equal(cfg.mode, 'natiu');
    assert.equal(cfg.base, '/');
    assert.equal(DIRECTORI_NATIU, 'dist-natiu');
    assert.equal(cfg.build.outDir, 'dist-natiu');
    assert.equal(cfg.build.emptyOutDir, true);
    assert.equal(cfg.build.target, 'es2022');
    assert.equal(cfg.build.copyPublicDir, false);
    assert.ok(!('publicDir' in cfg), 'publicDir no s\'apaga');
    assert.ok(!('lib' in cfg.build), 'és una app, no una llibreria');
    const plugins = cfg.plugins.flat(Infinity).filter(Boolean);
    const recursos = plugins.filter((p) => p.name === 'sdp-recursos-publics');
    assert.equal(recursos.length, 1);
    assert.equal(recursos[0].apply, 'build');
    const index = plugins.filter((p) => p.name === 'sdp-index-natiu');
    assert.equal(index.length, 1);
    assert.equal(index[0].apply, 'build');
    assert.equal(index[0].transformIndexHtml.order, 'pre', 'abans que Vite busque l\'entrada a l\'HTML');
    const html = index[0].transformIndexHtml.handler(INDEX);
    assert.deepEqual(directives(cspDe(html))['connect-src'], ["'self'", 'data:', ORIGEN, WSS], 'el backend de VITE_SUPABASE_URL');
    // La previsualització de dist-natiu/ també val.
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'serve', isPreview: true }).build.outDir, 'dist-natiu');
  });
});

test('la config falla abans de compilar: entorn de desenvolupament, telemetria, mode o ordre equivocats', () => {
  ambEntornNatiu({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), /no es pot fer[\s\S]*ha de ser https/);
  });
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU, VITE_UMAMI_HOST: 'https://umami.example.org' }, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), /VITE_UMAMI_HOST/);
  });
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: undefined }, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), /clau pública/);
  });
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    assert.throws(() => configNatiu({ mode: 'production', command: 'build' }), /--mode natiu/);
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'serve' }), /només compila/);
  });
});

test('la config llig els .env com Vite: un .env.local de desenvolupament fa fallar el build, i .env.natiu.local mana sobre ell', () => {
  const desenvolupament = { '.env.local': `VITE_SUPABASE_URL=http://localhost:54321\nVITE_SUPABASE_ANON_KEY=${CLAU}\n` };
  ambEntornNatiu({}, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), /no es pot fer[\s\S]*ha de ser https/);
  }, desenvolupament);
  ambEntornNatiu({}, () => {
    const cfg = configNatiu({ mode: MODE_NATIU, command: 'build' });
    const index = cfg.plugins.flat(Infinity).find((p) => p && p.name === 'sdp-index-natiu');
    assert.deepEqual(directives(cspDe(index.transformIndexHtml.handler(INDEX)))['connect-src'], ["'self'", 'data:', ORIGEN, WSS]);
  }, { ...desenvolupament, '.env.natiu.local': `VITE_SUPABASE_URL=${ORIGEN}\nVITE_SUPABASE_ANON_KEY=${CLAU}\nVITE_TENANT_ID=${TENANT}\n` });
});

/* Revisió adversarial (261003). Vite segella al binari TOTES les VITE_* de
   l'entorn, no només les que es lligen una a una: telemetria.js i
   configFonts.js reben import.meta.env sencer, i el build el substituïx per un
   objecte amb totes (vite/dist/node/chunks/config.js, definePlugin). Abans
   d'esta prova, un .env.natiu.local que només canviava la URL deixava passar
   la clau, el tenant i qualsevol URL local de .env.local. */
test('la config no hereta cap VITE_* de .env ni de .env.local: el binari només segella el que declaren .env.natiu* o el procés', () => {
  const ALTRE = '99999999-8888-4777-8666-555555555555';
  const BOT = 'http://localhost:3001';
  const desenvolupament = { '.env.local': `VITE_SUPABASE_URL=http://localhost:54321\nVITE_SUPABASE_ANON_KEY=${CLAU}\nVITE_TENANT_ID=${ALTRE}\nVITE_BOT_API_URL=${BOT}\n` };
  const vigilades = { VITE_BOT_API_URL: undefined };
  // .env.natiu.local només canvia la URL: la clau, el tenant i el bot de desenvolupament es quedarien dins.
  ambEntornNatiu(vigilades, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), (error) => {
      assert.match(error.message, /de \.env o \.env\.local: VITE_BOT_API_URL, VITE_SUPABASE_ANON_KEY, VITE_TENANT_ID\. .*\.env\.natiu\.local/);
      for (const valor of [CLAU, ALTRE, BOT]) assert.ok(!error.message.includes(valor), 'l\'error no porta cap valor');
      return true;
    });
  }, { ...desenvolupament, '.env.natiu.local': `VITE_SUPABASE_URL=${ORIGEN}\n` });
  // Declarades a .env.natiu.local, amb el mateix valor o buides: val.
  ambEntornNatiu(vigilades, () => {
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'build' }).build.outDir, DIRECTORI_NATIU);
  }, { ...desenvolupament, '.env.natiu.local': `VITE_SUPABASE_URL=${ORIGEN}\nVITE_SUPABASE_ANON_KEY=${CLAU}\nVITE_TENANT_ID=\nexport VITE_BOT_API_URL=\n` });
  // .env.natiu també compta, i el procés també (les variables del procés guanyen a tots els fitxers, com a Vite).
  ambEntornNatiu({ ...vigilades, VITE_SUPABASE_ANON_KEY: CLAU, VITE_TENANT_ID: TENANT }, () => {
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'build' }).build.outDir, DIRECTORI_NATIU);
  }, { ...desenvolupament, '.env.natiu': `VITE_SUPABASE_URL=${ORIGEN}\nVITE_BOT_API_URL=\n` });
});

test('els recursos de public/ que viatgen a l\'app: els del connector, sense worker, manifest ni servidor del lloc', (t) => {
  for (const rel of ['sw.js', 'manifest.webmanifest', 'auth', 'robots.txt', 'sitemap.xml', 'enxufe']) {
    assert.ok(PROPIS_DEL_LLOC.arrel.includes(rel), rel);
  }
  const publicReal = path.join(ARREL, 'public');
  if (!fs.existsSync(publicReal)) { t.skip('sense public/ en este arbre'); return; }
  const rels = recursosDelPlugin(publicReal);
  for (const rel of ['sw.js', 'manifest.webmanifest']) assert.ok(!rels.includes(rel), rel);
  assert.ok(rels.every((rel) => !rel.startsWith('auth/') && !rel.split('/').some((s) => s.startsWith('.'))));
  if (fs.existsSync(path.join(publicReal, 'fonts', 'noto-sans.css'))) assert.ok(rels.includes('fonts/noto-sans.css'), 'les fonts locals hi van');
});

/* ─────────────────── La política de mitjans de l'app ───────────────────
   Fase C (261019_2115, tasca 2) · la de l'autònom (D3), sense origen extern
   i sense els originals que l'app cita sense resolutor. */

test('politicaDeMitjansNativa: la de l\'autònom, sense origen ni carpetes externes i sense els exclosos; pura', () => {
  const [exclos] = ORIGINALS_CITATS_SENSE_RESOLUTOR.map(({ original }) => original);
  const autonom = Object.freeze({ origen: null, externs: Object.freeze([]), bessones: Object.freeze(['assets/a/u.jpg', exclos, 'assets/b/d.PNG']) });
  const nativa = politicaDeMitjansNativa(autonom);
  assert.deepEqual(nativa, { origen: null, externs: [], bessones: ['assets/a/u.jpg', 'assets/b/d.PNG'] });
  assert.ok(Object.isFrozen(nativa) && Object.isFrozen(nativa.externs) && Object.isFrozen(nativa.bessones));
  assert.deepEqual(autonom.bessones, ['assets/a/u.jpg', exclos, 'assets/b/d.PNG'], 'no toca la rebuda');
  // Dins de l'app tot és local: una política amb origen extern (la del directori) hi arriba sense ell.
  const directori = { origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: ['assets/uploads/x.jpg'] };
  assert.deepEqual(politicaDeMitjansNativa(directori), { origen: null, externs: [], bessones: ['assets/uploads/x.jpg'] });
  // Sense cap bessona que quede, null, com politicaDeMitjans; `excloses` es pot donar.
  assert.equal(politicaDeMitjansNativa({ origen: null, externs: [], bessones: [exclos] }), null);
  assert.equal(politicaDeMitjansNativa(null), null);
  assert.equal(politicaDeMitjansNativa(undefined), null);
  assert.equal(politicaDeMitjansNativa({}), null);
  assert.deepEqual(politicaDeMitjansNativa(autonom, []).bessones, autonom.bessones);
  assert.deepEqual(politicaDeMitjansNativa(autonom, new Set(['assets/a/u.jpg'])).bessones, [exclos, 'assets/b/d.PNG']);
});

test('ORIGINALS_CITATS_SENSE_RESOLUTOR: cada cita continua on diu, i cada original té bessona a public/ (si no, l\'excepció sobra)', (t) => {
  assert.ok(Object.isFrozen(ORIGINALS_CITATS_SENSE_RESOLUTOR) && ORIGINALS_CITATS_SENSE_RESOLUTOR.every(Object.isFrozen));
  assert.deepEqual(ORIGINALS_CITATS_SENSE_RESOLUTOR.map(({ original }) => original),
    ['assets/system/ui/xat-bg-map-v2.jpg', 'assets/notes/bloc_notes_vintage.jpg']);
  for (const { original, que, fitxer, cites } of ORIGINALS_CITATS_SENSE_RESOLUTOR) {
    assert.match(original, /^assets\/(?:[^/]+\/)*[^/]+\.(?:jpe?g|png)$/i, original);
    assert.ok(que && cites.length, original);
    const text = fs.readFileSync(path.join(ARREL, fitxer), 'utf8');
    for (const cita of cites) {
      assert.ok(text.includes(cita), `${fitxer} ja no porta «${cita}»: si la cita passa pel resolutor, lleva ${original} de ORIGINALS_CITATS_SENSE_RESOLUTOR`);
    }
  }
  if (!fs.existsSync(PUBLIC)) { t.skip('sense public/ en este arbre'); return; }
  const autonom = politicaDeMitjans('autonom', { directori: PUBLIC });
  for (const { original } of ORIGINALS_CITATS_SENSE_RESOLUTOR) {
    assert.ok(autonom?.bessones.includes(original), `${original} ja no té bessona a public/: l'excepció sobra`);
  }
});

test('cap url() dels CSS de src/ no cita un original amb bessona que l\'app substituïsca', (t) => {
  if (!fs.existsSync(PUBLIC)) { t.skip('sense public/ en este arbre'); return; }
  const ambBessona = new Set(politicaDeMitjans('autonom', { directori: PUBLIC })?.bessones ?? []);
  const exclosos = new Set(ORIGINALS_CITATS_SENSE_RESOLUTOR.map(({ original }) => original));
  const citats = fitxersAmb(path.join(ARREL, 'src'), ['.css']).flatMap((f) =>
    [...fs.readFileSync(f, 'utf8').matchAll(/url\(\s*(['"]?)\/?(assets\/[^'")\s]+?\.(?:jpe?g|png))\1\s*\)/gi)]
      .map((m) => ({ fitxer: path.relative(ARREL, f), original: m[2] })));
  assert.ok(citats.some(({ original }) => exclosos.has(original)), 'la prova veu el fons del Xat de tokens.css');
  const perduts = citats.filter(({ original }) => ambBessona.has(original) && !exclosos.has(original));
  assert.deepEqual(perduts, [], 'dins de l\'app, eixos url() demanarien un original que no hi viatja: afig-los a ORIGINALS_CITATS_SENSE_RESOLUTOR');
});

test('la config porta la política nativa als dos llocs: el connector de recursos no emet els substituïts i el define la segella', (t) => {
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    const cfg = configNatiu({ mode: MODE_NATIU, command: 'build' });
    const esperada = politicaDeMitjansNativa(politicaDeMitjans('autonom', { directori: PUBLIC }));
    if (!esperada) {
      assert.deepEqual(cfg.define, {}, 'sense bessones a public/, cap política');
      t.skip('sense bessones a public/ en este arbre');
      return;
    }
    // El define: la mateixa política, sense origen ni carpetes externes i sense els exclosos.
    const segellada = JSON.parse(cfg.define[CLAU_POLITICA]);
    assert.deepEqual(segellada, esperada);
    assert.equal(segellada.origen, null);
    assert.deepEqual(segellada.externs, []);
    for (const { original } of ORIGINALS_CITATS_SENSE_RESOLUTOR) assert.ok(!segellada.bessones.includes(original), original);
    // El connector: sobre un public/ de mostra, la bessona en lloc d'un substituït; un exclòs viatja amb la seua.
    const [substituit] = esperada.bessones;
    const exclos = ORIGINALS_CITATS_SENSE_RESOLUTOR[0].original;
    const mostra = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-public-'));
    try {
      for (const rel of [substituit, bessonaDe(substituit), exclos, bessonaDe(exclos), 'assets/sense-bessona.jpg', 'favicon.svg']) {
        fs.mkdirSync(path.dirname(path.join(mostra, rel)), { recursive: true });
        fs.writeFileSync(path.join(mostra, rel), rel);
      }
      const connector = cfg.plugins.flat(Infinity).find((p) => p && p.name === 'sdp-recursos-publics');
      connector.configResolved({ publicDir: mostra });
      const emesos = [];
      connector.generateBundle.call({ emitFile: ({ fileName }) => emesos.push(fileName) });
      assert.deepEqual(emesos.sort(), [bessonaDe(substituit), exclos, bessonaDe(exclos), 'assets/sense-bessona.jpg', 'favicon.svg'].sort());
    } finally {
      fs.rmSync(mostra, { recursive: true, force: true });
    }
  });
});

test('vite.natiu.config.js no importa res de Capacitor ni de src/natiu/: es pot avaluar abans de la lease', () => {
  const codi = fs.readFileSync(path.join(ARREL, 'vite.natiu.config.js'), 'utf8');
  assert.ok(!codi.includes(CAP), 'cap Capacitor');
  const especificadors = [...codi.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
  assert.deepEqual(especificadors, ['./src/config/publicCredentials.js', './vite.standalone.config.js', '@vitejs/plugin-react', 'fs', 'path', 'url', 'vite']);
});

/* ─────────────────────── Eixides reals, si existixen ─────────────────────── */

test('eixida real de dist-natiu/: sense worker, manifest ni servidor del lloc, i el backend segellat no és local', (t) => {
  const dir = path.join(ARREL, DIRECTORI_NATIU);
  if (!fs.existsSync(dir)) { t.skip('cal npm run build:natiu: dist-natiu/ no existix en este arbre'); return; }
  for (const rel of ['sw.js', 'manifest.webmanifest', 'auth', 'robots.txt', 'sitemap.xml', '.htaccess', 'enxufe']) {
    assert.equal(fs.existsSync(path.join(dir, rel)), false, rel);
  }
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  for (const vetat of ['localhost', '127.0.0.1', 'fonts.googleapis.com', 'rel="manifest"', '/src/']) {
    assert.ok(!html.includes(vetat), `index.html: ${vetat}`);
  }
  const d = directives(cspDe(html));
  assert.deepEqual(d['worker-src'], ["'none'"]);
  const origens = d['connect-src'].filter((font) => font.startsWith('https://'));
  assert.equal(origens.length, 1, 'un sol backend a connect-src');
  assert.equal(esHostLocal(new URL(origens[0]).hostname), false);
  // El backend de la CSP és el que el bundle porta segellat (les dues coses ixen de VITE_SUPABASE_URL).
  const js = fitxersAmb(dir, ['.js']);
  assert.ok(js.length > 0, 'el build ha emés JS');
  assert.ok(js.some((f) => fs.readFileSync(f, 'utf8').includes(origens[0])), `cap .js porta ${origens[0]}`);
});

test('eixida real de dist-natiu/: les bessones en lloc dels originals substituïts, els exclosos amb la seua, i la política segellada al JS', (t) => {
  const dir = path.join(ARREL, DIRECTORI_NATIU);
  if (!fs.existsSync(dir)) { t.skip('cal npm run build:natiu: dist-natiu/ no existix en este arbre'); return; }
  if (!fs.existsSync(PUBLIC)) { t.skip('sense public/ en este arbre'); return; }
  const politica = politicaDeMitjansNativa(politicaDeMitjans('autonom', { directori: PUBLIC }));
  if (!politica) { t.skip('sense bessones a public/ en este arbre'); return; }
  const presents = politica.bessones.filter((original) => fs.existsSync(path.join(dir, original)));
  assert.deepEqual(presents, [], 'cap original substituït viatja a l\'app');
  const senseBessona = politica.bessones.filter((original) => !fs.existsSync(path.join(dir, bessonaDe(original))));
  assert.deepEqual(senseBessona, [], 'cada substituït hi té la bessona');
  for (const { original } of ORIGINALS_CITATS_SENSE_RESOLUTOR) {
    assert.ok(fs.existsSync(path.join(dir, original)), `${original}: l'app el cita sense resolutor i hi ha de viatjar`);
  }
  // El define, dins del JS: l'objecte literal amb les mateixes bessones, en el mateix ordre.
  const segellades = fitxersAmb(dir, ['.js']).flatMap((f) =>
    [...fs.readFileSync(f, 'utf8').matchAll(/\{origen:null,externs:\[\],bessones:(\[[^\]]*\])\}/g)].map((m) => JSON.parse(m[1])));
  assert.ok(segellades.length > 0, 'cap .js porta la política segellada');
  for (const bessones of segellades) assert.deepEqual(bessones, politica.bessones);
});

test('eixida real del connector (wordpress-plugin/dist/): cap rastre de Capacitor', (t) => {
  const dirs = ['wordpress-plugin/dist', 'wordpress-plugin/builds/directori/dist']
    .map((rel) => path.join(ARREL, rel)).filter((abs) => fs.existsSync(abs));
  if (!dirs.length) { t.skip('cal npm run build:wp: wordpress-plugin/dist/ no existix en este arbre'); return; }
  const js = dirs.flatMap((dir) => fitxersAmb(dir, ['.js']));
  if (!js.length) { t.skip('cal npm run build:wp: wordpress-plugin/dist/ no porta cap .js'); return; }
  const amb = js.filter((f) => fs.readFileSync(f, 'utf8').includes(CAP)).map((f) => path.relative(ARREL, f));
  assert.deepEqual(amb, []);
});
