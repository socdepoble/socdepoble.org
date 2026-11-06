/* Onada R9 · C3 (IDEA-120 / P0-30) · scripts/botigues/estat.mjs i preflight --estat: l'estat honest
   de les botigues llegit dels fitxers, fora de línia. Un projecte sintètic en una carpeta temporal
   (mkdtemp) per a cada lectura, i el projecte de veres només per a la forma de l'eixida. Cap xarxa,
   cap eina de compilació ni de signatura, i cap valor d'un .env a l'eixida. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { estatDeLesBotigues, identificadorsPbxproj, liniesDeLEstat, valorPbxproj } from '../scripts/botigues/estat.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECRET = 'BFakeVapidPublicKeyNeverPrinted0123456789abcdefghijklmnopqrstuvwxyzABCDEFG';

function escriu(arrel, rel, text) {
  const cami = path.join(arrel, ...rel.split('/'));
  fs.mkdirSync(path.dirname(cami), { recursive: true });
  fs.writeFileSync(cami, text, 'utf8');
}

function projecteSintetic({ ambPush = false, ambVapid = false, ambEmpremta = false } = {}) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-estat-'));
  escriu(arrel, 'package.json', JSON.stringify({ version: '9.8.7', dependencies: ambPush ? { '@capacitor/push-notifications': '8.0.0' } : {} }));
  escriu(arrel, 'capacitor.config.json', JSON.stringify({ appId: 'org.exemple.app' }));
  escriu(arrel, 'android/variables.gradle', 'ext {\n    minSdkVersion = 26\n    compileSdkVersion = 36\n    targetSdkVersion = 36\n}\n');
  escriu(arrel, 'android/app/build.gradle', 'android {\n    defaultConfig {\n        applicationId "org.exemple.app"\n        minSdkVersion rootProject.ext.minSdkVersion\n        targetSdkVersion rootProject.ext.targetSdkVersion\n        versionCode 7\n        versionName "9.8.7"\n    }\n}\n');
  escriu(arrel, 'android/app/src/main/AndroidManifest.xml', '<manifest><!-- <uses-permission android:name="android.permission.POST_NOTIFICATIONS" /> --><uses-permission android:name="android.permission.POST_NOTIFICATIONS" /></manifest>');
  escriu(arrel, 'ios/App/App.xcodeproj/project.pbxproj', [
    'MARKETING_VERSION = 9.8.7;', 'CURRENT_PROJECT_VERSION = 7;', 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;', 'PRODUCT_BUNDLE_IDENTIFIER = org.exemple.app;',
    'MARKETING_VERSION = 9.8.7;', 'CURRENT_PROJECT_VERSION = 7;', 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;', 'PRODUCT_BUNDLE_IDENTIFIER = org.exemple.app.compartir;'
  ].join('\n'));
  escriu(arrel, 'ios/App/App/App.entitlements', `<plist><dict><key>com.apple.developer.applesignin</key><array><string>Default</string></array>${ambPush ? '<key>aps-environment</key><string>production</string>' : ''}</dict></plist>`);
  escriu(arrel, 'ios/App/App/Info.plist', '<plist><dict><key>ITSAppUsesNonExemptEncryption</key><false/><key>NSCameraUsageDescription</key><string>x</string></dict></plist>');
  escriu(arrel, 'ios/App/App/PrivacyInfo.xcprivacy', '<plist><dict><key>NSPrivacyTracking</key><false/></dict></plist>');
  escriu(arrel, 'scripts/botigues/associacio-apps.json', JSON.stringify({ android: { sha256_cert_fingerprints: ambEmpremta ? ['AA:BB'] : [] } }));
  escriu(arrel, 'src/sections/text/legalContent.js', 'export const legalContent = { html: `<h5 id="esborra-compte" data-sdp-ancora="esborra-compte">x</h5>` };');
  escriu(arrel, 'src/sections/profile/DetallPrivacitat.jsx', 'import { demanaBaixa } from "x";');
  if (ambVapid) escriu(arrel, '.env.production.local', `ALTRA=1\nVITE_PUSH_VAPID_PUBLICA=${SECRET}\n`);
  return arrel;
}

test('llig les versions, els SDK, els identificadors (amb les extensions) i la conformitat dels fitxers', () => {
  const arrel = projecteSintetic();
  try {
    const e = estatDeLesBotigues(arrel, { env: {} });
    assert.equal(e.versioWeb, '9.8.7');
    assert.deepEqual([e.android.paquet, e.android.versio, e.android.build, e.android.minSdk, e.android.compileSdk, e.android.targetSdk], ['org.exemple.app', '9.8.7', 7, 26, 36, 36]);
    assert.equal(e.android.postNotifications, true);
    assert.equal(e.android.assetlinks, 0);
    assert.deepEqual([e.ios.paquet, e.ios.extensions, e.ios.versio, e.ios.build, e.ios.iosMinim], ['org.exemple.app', ['org.exemple.app.compartir'], '9.8.7', 7, '16.0']);
    assert.deepEqual([e.ios.rastreig, e.ios.xifratgeExempt, e.ios.signInWithApple, e.ios.permisos], [false, true, true, ['NSCameraUsageDescription']]);
    assert.deepEqual([e.ios.apsEnvironment, e.ios.dominisAssociats, e.ios.appleAppSiteAssociation], [null, false, false]);
    assert.deepEqual([e.push.connectorRemot, e.push.clauVapid.te], [false, false]);
    assert.deepEqual(e.baixa, { ancoraPublica: true, dinsDeLApp: true });
  } finally {
    fs.rmSync(arrel, { recursive: true, force: true });
  }
});

test('amb el connector, aps-environment, una empremta i la clau VAPID a un .env: ho diu, i mai el valor de la clau', () => {
  const arrel = projecteSintetic({ ambPush: true, ambVapid: true, ambEmpremta: true });
  try {
    const e = estatDeLesBotigues(arrel, { env: {} });
    assert.deepEqual([e.push.connectorRemot, e.ios.apsEnvironment, e.android.assetlinks], [true, 'production', 1]);
    assert.deepEqual(e.push.clauVapid, { te: true, on: '.env.production.local' });
    const text = liniesDeLEstat(e).join('\n') + JSON.stringify(e);
    assert.equal(text.includes(SECRET), false);
    assert.match(text, /VITE_PUSH_VAPID_PUBLICA amb valor a \.env\.production\.local/);
  } finally {
    fs.rmSync(arrel, { recursive: true, force: true });
  }
});

test('el .pbxproj amb valors que discrepen no inventa cap valor', () => {
  assert.equal(valorPbxproj('MARKETING_VERSION = 1.0;\nMARKETING_VERSION = 1.1;', 'MARKETING_VERSION'), null);
  assert.equal(valorPbxproj('', 'MARKETING_VERSION'), null);
  assert.deepEqual(identificadorsPbxproj('PRODUCT_BUNDLE_IDENTIFIER = a.b;\nPRODUCT_BUNDLE_IDENTIFIER = "a.b";\nPRODUCT_BUNDLE_IDENTIFIER = a.b.c;'), ['a.b', 'a.b.c']);
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-estat-buit-'));
  try {
    const e = estatDeLesBotigues(arrel, { env: {} });
    assert.deepEqual([e.versioWeb, e.android.versio, e.android.minSdk, e.ios.paquet, e.ios.versio, e.ios.rastreig], [null, null, null, null, null, null]);
    assert.match(liniesDeLEstat(e).join('\n'), /no es pot llegir/);
  } finally {
    fs.rmSync(arrel, { recursive: true, force: true });
  }
});

test('preflight --estat: ix amb 0 sense variables d\'entorn ni eines, i --estat no es barreja amb res', () => {
  const sol = spawnSync(process.execPath, [path.join(ARREL, 'scripts/botigues/preflight.mjs'), '--estat'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(sol.status, 0, sol.stderr);
  assert.match(sol.stdout, /^Estat de les botigues \(fora de línia/);
  assert.match(sol.stdout, /Eliminació del compte/);
  const barrejat = spawnSync(process.execPath, [path.join(ARREL, 'scripts/botigues/preflight.mjs'), '--estat', '--push'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.notEqual(barrejat.status, 0);
});

/* Gauntlet R9 · G2-08 · estat.mjs llig els .env del build per a saber si hi ha la clau pública VAPID: la
   capçalera i l'ajuda de --estat ho diuen tal qual, i cap no diu «sense fitxer d'entorn». */
test('G2-08 · la capçalera d\'estat.mjs i l\'ajuda de --estat diuen què es llig dels .env, i res més', () => {
  const FRASE = 'llig els .env de build només per saber si VITE_PUSH_VAPID_PUBLICA hi té valor; no en guarda ni n\'imprimix cap';
  const capcalera = fs.readFileSync(path.join(ARREL, 'scripts/botigues/estat.mjs'), 'utf8').split('*/')[0];
  assert.ok(capcalera.replace(/\n \* /g, ' ').includes(FRASE), 'la capçalera');
  assert.doesNotMatch(capcalera, /sense fitxer d'entorn/);
  const ajuda = spawnSync(process.execPath, [path.join(ARREL, 'scripts/botigues/preflight.mjs'), '--ajuda'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(ajuda.status, 0, ajuda.stderr);
  const estat = ajuda.stdout.split('\n').find((linia) => linia.trim().startsWith('--estat'));
  assert.ok(estat?.includes(FRASE), 'l\'ajuda de --estat');
  assert.doesNotMatch(ajuda.stdout, /sense fitxer d'entorn/);
});
