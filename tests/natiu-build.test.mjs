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
  ESQUEMA_GOOGLE_PENDENT,
  FONTS_LOCALS,
  MODE_NATIU,
  ORIGINALS_CITATS_SENSE_RESOLUTOR,
  RECURSOS_QUE_L_APP_NO_LLIG,
  SUBSTITUCIONS_NATIVES,
  cspNativa,
  errorsEntornNatiu,
  errorsGoogleIos,
  heretadesDelLloc,
  indexNatiuPlugin,
  nomsDeclarats,
  politicaDeMitjansNativa,
  transformaIndexNatiu
} from '../vite.natiu.config.js';
import { PROPIS_DEL_LLOC, esHostLocal, politicaDeMitjans, recursosDelPlugin } from '../vite.standalone.config.js';
import { bessonaDe } from '../src/config/politicaDeMitjans.js';
import { esquemaInvertitDeGoogleIos } from '../src/config/publicCredentials.js';

/* El build de l'app nativa (ARQUITECTURA.txt §4.4 i §5, 261003) es prova amb
   FIXTURES, com tests/standalone-build.test.mjs: les peces pures sobre
   l'index.html REAL del repositori i entorns sintètics. Les eixides reals
   (dist-natiu/ i wordpress-plugin/dist/) només es miren si existixen; si no,
   la prova diu per què se l'ha saltat. Mai passen en silenci. Fase D (261020,
   revisió) · Tampoc no passen sobre una eixida més vella que el que proven:
   se salten dient quin fitxer és més nou. */

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

/* Fase D (261020, L10) · Una eixida més vella que la config o que els recursos de
   public/ que viatgen no diu res de l'arbre d'ara: es salta, dient per què.
   Fase D (261020, revisió) · «Viatgen» amb les mateixes regles que el connector
   natiu (vite.natiu.config.js): sense els índexs que l'app no llig
   (RECURSOS_QUE_L_APP_NO_LLIG, que `npm run build` reescriu sempre) ni els
   originals que la política nativa substituïx per la bessona. Abans, un build
   web darrere de build:natiu saltava totes les proves de dist-natiu/. */
function distNatiuVigent(t, arrel = ARREL) {
  const index = path.join(arrel, DIRECTORI_NATIU, 'index.html');
  if (!fs.existsSync(index)) { t.skip('cal npm run build:natiu: dist-natiu/ no existix en este arbre'); return false; }
  const quan = fs.statSync(index).mtimeMs;
  const publicDir = path.join(arrel, 'public');
  let viatgen = [];
  if (fs.existsSync(publicDir)) {
    const substituits = new Set(politicaDeMitjansNativa(politicaDeMitjans('autonom', { directori: publicDir }))?.bessones ?? []);
    viatgen = recursosDelPlugin(publicDir)
      .filter((rel) => !RECURSOS_QUE_L_APP_NO_LLIG.includes(rel) && !substituits.has(rel))
      .map((rel) => path.join(publicDir, rel));
  }
  const mesNou = mesNouQue(quan, [path.join(arrel, 'vite.natiu.config.js'), ...viatgen]);
  if (mesNou) { t.skip(`dist-natiu/ és anterior a ${path.relative(arrel, mesNou)}: torna a compilar`); return false; }
  return true;
}

/** El primer camí d'`entrades` modificat després de `quan` (mtimeMs), o null. */
function mesNouQue(quan, entrades) {
  return entrades.find((f) => fs.statSync(f).mtimeMs > quan) ?? null;
}

/* Fase D (261020, revisió) · Una eixida web (dist/, wordpress-plugin/dist/) més
   vella que la frontera nativa no en pot dir res: les dependències
   (package-lock.json, d'on ve el connector d'entrada social) i el codi de
   src/natiu/ sense les proves. */
function fronteraNativa(arrel = ARREL) {
  const natiu = path.join(arrel, 'src', 'natiu');
  const codi = fs.existsSync(natiu)
    ? fs.readdirSync(natiu).filter((nom) => /\.jsx?$/.test(nom) && !nom.includes('.test.')).sort().map((nom) => path.join(natiu, nom))
    : [];
  return [path.join(arrel, 'package-lock.json'), ...codi].filter((f) => fs.existsSync(f));
}

/** El .js més recent d'una eixida: quan es va compilar per última vegada. */
const compilatAl = (js) => Math.max(...js.map((f) => fs.statSync(f).mtimeMs));

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
  assert.deepEqual(Object.keys(d).sort(), ['base-uri', 'connect-src', 'default-src', 'font-src', 'frame-src', 'img-src', 'media-src', 'object-src', 'script-src', 'style-src', 'worker-src']);
  assert.deepEqual(d['connect-src'], ["'self'", 'data:', ORIGEN, WSS], 'data: per a les tres pujades amb fetch(dataUrl), i només el backend');
  assert.deepEqual(d['worker-src'], ["'none'"]);
  assert.deepEqual(d['script-src'], ["'self'"]);
  assert.deepEqual(d['style-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(d['default-src'], ["'self'", 'data:', 'blob:']);
  assert.deepEqual(d['img-src'], ["'self'", 'data:', 'blob:', 'https:']);
  // Gauntlet 261022_0225 (crítica Claude, MEDIA-2) · Les notes de veu i els vídeos del xat (URL signades del Storage).
  assert.deepEqual(d['media-src'], ["'self'", 'data:', 'blob:', 'https:']);
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

/* Fase D (261020, tasques 1 i 5) · Els clients OAuth de Google de l'entrada nativa:
   públics, opcionals i mai a VITE_GOOGLE_OAUTH_CLIENT_ID (que continua buida). */
const GOOGLE_WEB = '123-webabc.apps.googleusercontent.com';
const GOOGLE_IOS = '123-iosabc.apps.googleusercontent.com';

test('errorsEntornNatiu: els clients natius de Google, si hi són, amb la forma d\'un client, l\'iOS amb el web i diferents', () => {
  const net = { VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU };
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS }), [], 'els dos, bons');
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB }), [], 'només el web (Android)');
  assert.deepEqual(errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: '', VITE_NATIU_GOOGLE_IOS_CLIENT_ID: '  ' }), [], 'buides');
  for (const [clau, dolent] of [['VITE_NATIU_GOOGLE_WEB_CLIENT_ID', 'web.apps.googleusercontent.com'], ['VITE_NATIU_GOOGLE_IOS_CLIENT_ID', '123-ABC.apps.googleusercontent.com']]) {
    const errors = errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS, [clau]: dolent });
    assert.equal(errors.length, 1, clau);
    assert.match(errors[0], new RegExp(`^${clau} no té la forma`));
    assert.ok(!errors[0].includes(dolent), 'l\'error no porta el valor');
  }
  const senseWeb = errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS });
  assert.equal(senseWeb.length, 1);
  assert.match(senseWeb[0], /VITE_NATIU_GOOGLE_IOS_CLIENT_ID sense VITE_NATIU_GOOGLE_WEB_CLIENT_ID/);
  const mateix = errorsEntornNatiu({ ...net, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: ` ${GOOGLE_WEB} ` });
  assert.equal(mateix.length, 1);
  assert.match(mateix[0], /dos clients diferents/);
});

test('esquemaInvertitDeGoogleIos: l\'esquema d\'un client d\'iOS ben format, o null', () => {
  assert.equal(esquemaInvertitDeGoogleIos(GOOGLE_IOS), 'com.googleusercontent.apps.123-iosabc');
  assert.equal(esquemaInvertitDeGoogleIos(`  ${GOOGLE_IOS}\n`), 'com.googleusercontent.apps.123-iosabc', 'sense espais');
  for (const dolent of ['123-ABC.apps.googleusercontent.com', '123-abc', '123-abc.apps.googleusercontent.com/x', 'abc.apps.googleusercontent.com',
    'x123-abc.apps.googleusercontent.com', '', null, undefined, 123, {}]) {
    assert.equal(esquemaInvertitDeGoogleIos(dolent), null, String(dolent));
  }
});

test('errorsGoogleIos: sense client o sense projecte d\'iOS, res; un client dolent o un Info.plist sense el seu esquema, error sense el valor', () => {
  const ambEsquema = (esquema) => `<plist><dict><key>CFBundleURLSchemes</key><array><string>${esquema}</string></array></dict></plist>`;
  assert.equal(ESQUEMA_GOOGLE_PENDENT, 'com.googleusercontent.apps.pendent');
  assert.equal(esquemaInvertitDeGoogleIos(ESQUEMA_GOOGLE_PENDENT), null, 'la reserva no és cap client');
  assert.deepEqual(errorsGoogleIos(), []);
  assert.deepEqual(errorsGoogleIos({ clientId: '', infoPlist: ambEsquema(ESQUEMA_GOOGLE_PENDENT) }), [], 'sense client, Google no s\'oferix a iOS');
  assert.deepEqual(errorsGoogleIos({ clientId: GOOGLE_IOS, infoPlist: null }), [], 'sense ios/');
  assert.deepEqual(errorsGoogleIos({ clientId: GOOGLE_IOS }), []);
  assert.deepEqual(errorsGoogleIos({ clientId: GOOGLE_IOS, infoPlist: ambEsquema('com.googleusercontent.apps.123-iosabc') }), []);
  const malFormat = errorsGoogleIos({ clientId: 'client-dolent', infoPlist: ambEsquema(ESQUEMA_GOOGLE_PENDENT) });
  assert.equal(malFormat.length, 1);
  assert.match(malFormat[0], /^VITE_NATIU_GOOGLE_IOS_CLIENT_ID no té la forma/);
  for (const infoPlist of [ambEsquema(ESQUEMA_GOOGLE_PENDENT), ambEsquema('com.googleusercontent.apps.999-altre'), '']) {
    const errors = errorsGoogleIos({ clientId: GOOGLE_IOS, infoPlist });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Info\.plist no registra a CFBundleURLTypes/);
    assert.ok(!errors[0].includes('123-iosabc'), 'l\'error no porta el client');
  }
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

const CLAUS_VIGILADES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_TENANT_ID', 'VITE_GOOGLE_OAUTH_CLIENT_ID',
  'VITE_NATIU_GOOGLE_WEB_CLIENT_ID', 'VITE_NATIU_GOOGLE_IOS_CLIENT_ID'];

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
  for (const [nom, contingut] of Object.entries(fitxers)) {
    fs.mkdirSync(path.dirname(path.join(carpeta, nom)), { recursive: true });
    fs.writeFileSync(path.join(carpeta, nom), contingut);
  }
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

test('la config contrasta el client d\'iOS de Google amb ios/App/App/Info.plist: sense el seu esquema no compila; amb ell, o sense ios/, sí', () => {
  const PLIST = 'ios/App/App/Info.plist';
  const plist = (esquema) => `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict><key>CFBundleURLTypes</key><array><dict><key>CFBundleURLSchemes</key><array><string>${esquema}</string></array></dict></array></dict></plist>\n`;
  const entorn = { VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU, VITE_NATIU_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS };
  ambEntornNatiu(entorn, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), (error) => {
      assert.match(error.message, /no es pot fer[\s\S]*CFBundleURLTypes/);
      assert.ok(!error.message.includes('123-iosabc'), 'l\'error no porta el client');
      return true;
    });
  }, { [PLIST]: plist(ESQUEMA_GOOGLE_PENDENT) });
  ambEntornNatiu(entorn, () => {
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'build' }).build.outDir, DIRECTORI_NATIU);
  }, { [PLIST]: plist(esquemaInvertitDeGoogleIos(GOOGLE_IOS)) });
  ambEntornNatiu(entorn, () => {
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'build' }).build.outDir, DIRECTORI_NATIU, 'sense ios/');
  });
  // Sense client d'iOS, la reserva no impedix res; un client mal format es diu una sola vegada.
  ambEntornNatiu({ ...entorn, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: undefined }, () => {
    assert.equal(configNatiu({ mode: MODE_NATIU, command: 'build' }).build.outDir, DIRECTORI_NATIU);
  }, { [PLIST]: plist(ESQUEMA_GOOGLE_PENDENT) });
  ambEntornNatiu({ ...entorn, VITE_NATIU_GOOGLE_IOS_CLIENT_ID: 'client-dolent' }, () => {
    assert.throws(() => configNatiu({ mode: MODE_NATIU, command: 'build' }), (error) => {
      assert.equal(error.message.split('VITE_NATIU_GOOGLE_IOS_CLIENT_ID no té la forma').length, 2);
      return true;
    });
  }, { [PLIST]: plist(ESQUEMA_GOOGLE_PENDENT) });
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
  /* P1-67 (261028) · Tot public/fonts viatja: els dos woff2, el full i
     OFL.txt (la SIL OFL 1.1 demana la llicència amb cada còpia de la font). */
  const fonts = path.join(publicReal, 'fonts');
  if (fs.existsSync(fonts)) {
    const quedenFora = fs.readdirSync(fonts).filter((nom) => !nom.startsWith('.')).map((nom) => `fonts/${nom}`).filter((rel) => !rels.includes(rel));
    assert.deepEqual(quedenFora, [], 'cada fitxer de public/fonts hi va');
  }
});

/* ─────────────────── La política de mitjans de l'app ───────────────────
   Fase C (261019_2115, tasca 2) · la de l'autònom (D3), sense origen extern
   i sense els originals que l'app cita sense resolutor. */

test('politicaDeMitjansNativa: la de l\'autònom, sense origen ni carpetes externes i sense els exclosos; pura', () => {
  /* Expectativa actualitzada a propòsit (261021, pla 261021_0015 §13, P1-05):
     ORIGINALS_CITATS_SENSE_RESOLUTOR ja és buida, i l'exclòs és de mostra i es
     dona com a `excloses`. De sèrie, cap bessona no es deixa fora. */
  const exclos = 'assets/c/cita-crua.jpg';
  const autonom = Object.freeze({ origen: null, externs: Object.freeze([]), bessones: Object.freeze(['assets/a/u.jpg', exclos, 'assets/b/d.PNG']) });
  assert.deepEqual(politicaDeMitjansNativa(autonom).bessones, autonom.bessones);
  const nativa = politicaDeMitjansNativa(autonom, [exclos]);
  assert.deepEqual(nativa, { origen: null, externs: [], bessones: ['assets/a/u.jpg', 'assets/b/d.PNG'] });
  assert.ok(Object.isFrozen(nativa) && Object.isFrozen(nativa.externs) && Object.isFrozen(nativa.bessones));
  assert.deepEqual(autonom.bessones, ['assets/a/u.jpg', exclos, 'assets/b/d.PNG'], 'no toca la rebuda');
  // Dins de l'app tot és local: una política amb origen extern (la del directori) hi arriba sense ell.
  const directori = { origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: ['assets/uploads/x.jpg'] };
  assert.deepEqual(politicaDeMitjansNativa(directori), { origen: null, externs: [], bessones: ['assets/uploads/x.jpg'] });
  // Sense cap bessona que quede, null, com politicaDeMitjans; `excloses` es pot donar.
  assert.equal(politicaDeMitjansNativa({ origen: null, externs: [], bessones: [exclos] }, [exclos]), null);
  assert.equal(politicaDeMitjansNativa(null), null);
  assert.equal(politicaDeMitjansNativa(undefined), null);
  assert.equal(politicaDeMitjansNativa({}), null);
  assert.deepEqual(politicaDeMitjansNativa(autonom, []).bessones, autonom.bessones);
  assert.deepEqual(politicaDeMitjansNativa(autonom, new Set(['assets/a/u.jpg'])).bessones, [exclos, 'assets/b/d.PNG']);
});

/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-05) · Les dues cites
   crues d'abans (el fons del Xat i la foto de mostra de l'Enquadrament) ja
   citen la bessona .webp: la llista queda buida i els originals (1,2 MB i
   764 KB) se substituïxen com tots. */
const CITES_DE_LA_BESSONA = Object.freeze([
  Object.freeze({ fitxer: 'src/css/tokens.css', cita: "url('/assets/system/ui/xat-bg-map-v2.webp')", bessona: 'assets/system/ui/xat-bg-map-v2.webp' }),
  Object.freeze({ fitxer: 'src/PedraSecaEmbed.jsx', cita: "resolveAsset('assets/system/ui/xat-bg-map-v2.webp')", bessona: 'assets/system/ui/xat-bg-map-v2.webp' }),
  Object.freeze({ fitxer: 'src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx', cita: "const MOSTRA = '/assets/notes/bloc_notes_vintage.webp';", bessona: 'assets/notes/bloc_notes_vintage.webp' })
]);

test('ORIGINALS_CITATS_SENSE_RESOLUTOR: cada cita continua on diu, i cada original té bessona a public/ (si no, l\'excepció sobra)', (t) => {
  assert.ok(Object.isFrozen(ORIGINALS_CITATS_SENSE_RESOLUTOR) && ORIGINALS_CITATS_SENSE_RESOLUTOR.every(Object.isFrozen));
  /* Expectativa actualitzada a propòsit (261021, pla 261021_0015 §13, P1-05):
     abans, ['assets/system/ui/xat-bg-map-v2.jpg', 'assets/notes/bloc_notes_vintage.jpg']. */
  assert.deepEqual(ORIGINALS_CITATS_SENSE_RESOLUTOR.map(({ original }) => original), []);
  for (const { fitxer, cita, bessona } of CITES_DE_LA_BESSONA) {
    const text = fs.readFileSync(path.join(ARREL, fitxer), 'utf8');
    assert.ok(text.includes(cita), `${fitxer} ja no porta «${cita}»`);
    assert.ok(!text.includes(bessona.replace(/\.webp$/, '.jpg')), `${fitxer} torna a citar l'original de ${bessona}`);
    if (fs.existsSync(PUBLIC)) assert.ok(fs.existsSync(path.join(PUBLIC, bessona)), `${bessona} no és a public/`);
  }
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
  /* Expectativa actualitzada a propòsit (261021, pla 261021_0015 §13, P1-05):
     el fons del Xat de tokens.css ja cita la bessona .webp; la prova continua
     veient-lo (també mira els .webp), i cap .webp no té bessona. */
  const citats = fitxersAmb(path.join(ARREL, 'src'), ['.css']).flatMap((f) =>
    [...fs.readFileSync(f, 'utf8').matchAll(/url\(\s*(['"]?)\/?(assets\/[^'")\s]+?\.(?:jpe?g|png|webp))\1\s*\)/gi)]
      .map((m) => ({ fitxer: path.relative(ARREL, f), original: m[2] })));
  assert.ok(citats.some(({ fitxer, original }) => fitxer === path.join('src', 'css', 'tokens.css') && original === 'assets/system/ui/xat-bg-map-v2.webp'),
    'la prova veu el fons del Xat de tokens.css');
  const perduts = citats.filter(({ original }) => ambBessona.has(original) && !exclosos.has(original));
  assert.deepEqual(perduts, [], 'dins de l\'app, eixos url() demanarien un original que no hi viatja: afig-los a ORIGINALS_CITATS_SENSE_RESOLUTOR');
});

test('la config porta la política nativa als dos llocs: el connector de recursos no emet els substituïts i el define la segella', (t) => {
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    const cfg = configNatiu({ mode: MODE_NATIU, command: 'build' });
    const esperada = politicaDeMitjansNativa(politicaDeMitjans('autonom', { directori: PUBLIC }));
    if (!esperada) {
      /* P1-35 · En compilar, el define porta sempre el segell del build
         (import.meta.env.SDP_BUILD): sense bessones, cap altra clau. */
      assert.deepEqual(Object.keys(cfg.define).filter((clau) => clau !== 'import.meta.env.SDP_BUILD'), [], 'sense bessones a public/, cap política');
      t.skip('sense bessones a public/ en este arbre');
      return;
    }
    // El define: la mateixa política, sense origen ni carpetes externes i sense els exclosos.
    const segellada = JSON.parse(cfg.define[CLAU_POLITICA]);
    assert.deepEqual(segellada, esperada);
    assert.equal(segellada.origen, null);
    assert.deepEqual(segellada.externs, []);
    for (const { original } of ORIGINALS_CITATS_SENSE_RESOLUTOR) assert.ok(!segellada.bessones.includes(original), original);
    /* P1-05 (261021, pla 261021_0015 §13) · Els dos originals pesants que
       l'app citava crus ja se substituïxen: a l'app només hi va la bessona.
       Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn
       fase 2, Mòdul B, P0-14) · L'original del fons del Xat ja no és a
       public/ (evacuat a _multimedia_de_poble/originals_raster_public/): no hi
       ha res a substituir, i la .webp, que és la que citen tokens.css i
       PedraSecaEmbed.jsx, hi viatja com qualsevol fitxer. La foto de mostra de
       l'Enquadrament continua substituint-se. Abans: les dues dins de bessones. */
    assert.ok(segellada.bessones.includes('assets/notes/bloc_notes_vintage.jpg'), 'assets/notes/bloc_notes_vintage.jpg');
    const fonsDelXat = 'assets/system/ui/xat-bg-map-v2.webp';
    assert.ok(fs.existsSync(path.join(PUBLIC, fonsDelXat)), `${fonsDelXat} no és a public/`);
    assert.ok(!fs.existsSync(path.join(PUBLIC, fonsDelXat.replace(/\.webp$/, '.jpg'))), 'l\'original del fons del Xat torna a ser a public/');
    assert.ok(!segellada.bessones.some((original) => bessonaDe(original) === fonsDelXat), 'el fons del Xat no pot tornar a ser la bessona de ningú');
    /* El connector: sobre un public/ de mostra, la bessona en lloc d'un
       substituït. Expectativa actualitzada a propòsit (261021, pla
       261021_0015 §13, P1-05): el fons del Xat ja no és cap exclòs i hi viatja
       només la seua bessona; abans hi anava també l'original. Un exclòs
       viatjaria amb la seua: ho prova politicaDeMitjansNativa, dalt.
       Mòdul B (261021) · L'original del fons del Xat ja no és a public/: la
       mostra fa servir l'altre original que l'app citava cru, la foto de
       l'Enquadrament, que continua amb la seua bessona. */
    const fons = 'assets/notes/bloc_notes_vintage.jpg';
    const substituit = esperada.bessones.find((original) => original !== fons);
    const mostra = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-public-'));
    try {
      for (const rel of [substituit, bessonaDe(substituit), fons, bessonaDe(fons), 'assets/sense-bessona.jpg', 'favicon.svg']) {
        fs.mkdirSync(path.dirname(path.join(mostra, rel)), { recursive: true });
        fs.writeFileSync(path.join(mostra, rel), rel);
      }
      const connector = cfg.plugins.flat(Infinity).find((p) => p && p.name === 'sdp-recursos-publics');
      connector.configResolved({ publicDir: mostra });
      const emesos = [];
      connector.generateBundle.call({ emitFile: ({ fileName }) => emesos.push(fileName) });
      assert.deepEqual(emesos.sort(), [bessonaDe(substituit), bessonaDe(fons), 'assets/sense-bessona.jpg', 'favicon.svg'].sort());
    } finally {
      fs.rmSync(mostra, { recursive: true, force: true });
    }
  });
});

/* ─────────── L10 · Els índexs de la Wiki no viatgen a l'app (Fase D, 261020) ─────────── */

test('L10 · l\'app no porta rag-index.json ni slugIndex.json de l\'arrel; el connector sí', () => {
  assert.ok(Object.isFrozen(RECURSOS_QUE_L_APP_NO_LLIG));
  assert.deepEqual([...RECURSOS_QUE_L_APP_NO_LLIG].sort(), ['rag-index.json', 'slugIndex.json']);
  for (const nom of RECURSOS_QUE_L_APP_NO_LLIG) assert.ok(!PROPIS_DEL_LLOC.arrel.includes(nom), `${nom} viatja al connector`);
  ambEntornNatiu({ VITE_SUPABASE_URL: ORIGEN, VITE_SUPABASE_ANON_KEY: CLAU }, () => {
    const cfg = configNatiu({ mode: MODE_NATIU, command: 'build' });
    const mostra = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-l10-'));
    try {
      for (const rel of ['rag-index.json', 'slugIndex.json', 'docs/rag-index.json', 'favicon.svg']) {
        fs.mkdirSync(path.dirname(path.join(mostra, rel)), { recursive: true });
        fs.writeFileSync(path.join(mostra, rel), rel);
      }
      const connector = cfg.plugins.flat(Infinity).find((p) => p && p.name === 'sdp-recursos-publics');
      connector.configResolved({ publicDir: mostra });
      const emesos = [];
      connector.generateBundle.call({ emitFile: ({ fileName }) => emesos.push(fileName) });
      assert.deepEqual(emesos.sort(), ['docs/rag-index.json', 'favicon.svg']);
    } finally {
      fs.rmSync(mostra, { recursive: true, force: true });
    }
  });
});

test('L10 · cap codi de src/ demana els índexs de la Wiki', (t) => {
  if (!fs.existsSync(PUBLIC)) { t.skip('sense public/ en este arbre'); return; }
  for (const nom of RECURSOS_QUE_L_APP_NO_LLIG) assert.ok(fs.existsSync(path.join(PUBLIC, nom)), `${nom} ja no és a public/: L10 sobra`);
  const DEMANA = /(?:fetch\s*\(|import\s*\(|new URL\s*\()\s*[`'"][^`'"]*(?:rag-index|slugIndex)\.json/;
  // wikiManifest.js és prosa de la Wiki compilada: un exemple de codi d'un document no és cap consumidor.
  const generat = path.join(ARREL, 'src', 'data', 'wikiManifest.js');
  const consumidors = fitxersAmb(path.join(ARREL, 'src'), ['.js', '.jsx', '.mjs'])
    .filter((f) => f !== generat && !/\.test\.[cm]?jsx?$/.test(f))
    .filter((f) => DEMANA.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ARREL, f));
  assert.deepEqual(consumidors, [], 'si l\'app els demana, lleva\'ls de RECURSOS_QUE_L_APP_NO_LLIG');
});

test('vite.natiu.config.js no importa res de Capacitor ni de src/natiu/: es pot avaluar abans de la lease', () => {
  const codi = fs.readFileSync(path.join(ARREL, 'vite.natiu.config.js'), 'utf8');
  assert.ok(!codi.includes(CAP), 'cap Capacitor');
  const especificadors = [...codi.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
  assert.deepEqual(especificadors, ['./src/config/publicCredentials.js', './vite.standalone.config.js', '@vitejs/plugin-react', 'fs', 'path', 'url', 'vite']);
});

/* Fase D (261020, revisió) · La frescor de les eixides, sobre un arbre de mostra
   amb dates fixades: el que no viatja a l'app no fa vella dist-natiu/, i una
   eixida web es compara amb la frontera nativa sense les proves. */
test('distNatiuVigent: els índexs que l’app no llig i els originals substituïts no fan vella l’eixida; el que viatja, sí', () => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-vigent-'));
  const abans = new Date('2026-10-20T10:00:00Z');
  const compilat = new Date('2026-10-20T11:00:00Z');
  const despres = new Date('2026-10-20T12:00:00Z');
  const escriu = (rel, quan) => {
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, 'x');
    fs.utimesSync(abs, quan, quan);
  };
  const motius = [];
  const t = { skip: (motiu) => motius.push(motiu) };
  try {
    escriu('vite.natiu.config.js', abans);
    escriu(`${DIRECTORI_NATIU}/index.html`, compilat);
    escriu('public/assets/foto.jpg', despres);
    escriu(`public/${bessonaDe('assets/foto.jpg')}`, abans);
    for (const nom of RECURSOS_QUE_L_APP_NO_LLIG) escriu(`public/${nom}`, despres);
    assert.equal(distNatiuVigent(t, arrel), true);
    assert.deepEqual(motius, []);

    escriu(`public/${bessonaDe('assets/foto.jpg')}`, despres);
    assert.equal(distNatiuVigent(t, arrel), false);
    assert.deepEqual(motius, [`dist-natiu/ és anterior a public/${bessonaDe('assets/foto.jpg')}: torna a compilar`]);
  } finally {
    fs.rmSync(arrel, { recursive: true, force: true });
  }
});

test('fronteraNativa: package-lock.json i el codi de src/natiu/, sense les proves', () => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-natiu-frontera-'));
  try {
    for (const rel of ['package-lock.json', 'src/natiu/entradaSocial.js', 'src/natiu/entrada.jsx', 'src/natiu/entradaSocial.test.js', 'src/natiu/nota.md']) {
      fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
      fs.writeFileSync(path.join(arrel, rel), 'x');
    }
    assert.deepEqual(fronteraNativa(arrel).map((f) => path.relative(arrel, f).split(path.sep).join('/')),
      ['package-lock.json', 'src/natiu/entrada.jsx', 'src/natiu/entradaSocial.js']);
  } finally {
    fs.rmSync(arrel, { recursive: true, force: true });
  }
});

/* ─────────────────────── Eixides reals, si existixen ─────────────────────── */

test('eixida real de dist-natiu/: sense worker, manifest ni servidor del lloc, i el backend segellat no és local', (t) => {
  const dir = path.join(ARREL, DIRECTORI_NATIU);
  if (!distNatiuVigent(t)) return;
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
  if (!distNatiuVigent(t)) return;
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

test('L10 · eixida real de dist-natiu/: sense els índexs de la Wiki', (t) => {
  if (!distNatiuVigent(t)) return;
  for (const nom of RECURSOS_QUE_L_APP_NO_LLIG) {
    assert.equal(fs.existsSync(path.join(ARREL, DIRECTORI_NATIU, nom)), false, `${nom} viatja a l'app`);
  }
});

/* Fase D (261020, tasca 1) · A més del nom, una marca pròpia del connector d'entrada
   social (la clau d'estat del seu OAuth web), composta a trossos. */
const MARQUES_NATIVES = [CAP, ['social', 'login', 'oauth'].join('_')];

test('eixida real del connector (wordpress-plugin/dist/): cap rastre de Capacitor', (t) => {
  const dirs = ['wordpress-plugin/dist', 'wordpress-plugin/builds/directori/dist']
    .map((rel) => path.join(ARREL, rel)).filter((abs) => fs.existsSync(abs));
  if (!dirs.length) { t.skip('cal npm run build:wp: wordpress-plugin/dist/ no existix en este arbre'); return; }
  const totes = dirs.map((dir) => ({ dir, js: fitxersAmb(dir, ['.js']) })).filter(({ js }) => js.length);
  if (!totes.length) { t.skip('cal npm run build:wp: wordpress-plugin/dist/ no porta cap .js'); return; }
  /* Fase D (261020, revisió) · Una eixida anterior a la frontera nativa no es
     compta com a verd: es diu, i si no en queda cap de vigent, se salta. */
  const frontera = fronteraNativa();
  const velles = totes.map((eixida) => ({ ...eixida, mesNou: mesNouQue(compilatAl(eixida.js), frontera) })).filter(({ mesNou }) => mesNou);
  for (const { dir, mesNou } of velles) t.diagnostic(`${path.relative(ARREL, dir)} és anterior a ${path.relative(ARREL, mesNou)}: no es mira`);
  const vigents = totes.filter(({ dir }) => !velles.some((vella) => vella.dir === dir));
  if (!vigents.length) {
    t.skip(`${path.relative(ARREL, velles[0].dir)} és anterior a ${path.relative(ARREL, velles[0].mesNou)}: torna a compilar (npm run build:wp)`);
    return;
  }
  const js = vigents.flatMap((eixida) => eixida.js);
  const amb = js.filter((f) => { const codi = fs.readFileSync(f, 'utf8'); return MARQUES_NATIVES.some((m) => codi.includes(m)); })
    .map((f) => path.relative(ARREL, f));
  assert.deepEqual(amb, []);
});

test('eixida real del web (dist/): cap rastre de Capacitor ni del connector d\'entrada social', (t) => {
  const dir = path.join(ARREL, 'dist');
  if (!fs.existsSync(dir)) { t.skip('cal npm run build: dist/ no existix en este arbre'); return; }
  const js = fitxersAmb(dir, ['.js']);
  if (!js.length) { t.skip('cal npm run build: dist/ no porta cap .js'); return; }
  /* Fase D (261020, revisió) · Un dist/ anterior a la frontera nativa no es compta com a verd. */
  const index = path.join(dir, 'index.html');
  const mesNou = mesNouQue(fs.existsSync(index) ? fs.statSync(index).mtimeMs : compilatAl(js), fronteraNativa());
  if (mesNou) { t.skip(`dist/ és anterior a ${path.relative(ARREL, mesNou)}: torna a compilar (npm run build)`); return; }
  const amb = js.filter((f) => { const codi = fs.readFileSync(f, 'utf8'); return MARQUES_NATIVES.some((m) => codi.includes(m)); })
    .map((f) => path.relative(ARREL, f));
  assert.deepEqual(amb, []);
});
