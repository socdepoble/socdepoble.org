/* Carril F-botigues (marató 261101, T6) · Contracte d'Android App Links: el build
   web només publica /.well-known/assetlinks.json amb empremtes reals de Play
   Console, amb la forma exacta de Digital Asset Links, i mai en nom d'un altre
   domini. Les empremtes de les proves són sintètiques (00:01:02…), mai d'una clau. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import associacioApps, {
  CONFIGURACIO, ESQUEMA, FITXER_ASSETLINKS, MAXIM_EMPREMTES, PAQUET_ANDROID, RELACIO,
  comprovaHosting, construeixAssetLinks, fitxersAssociacio, llegixConfiguracio, origenDelBuild,
  origenExacte, serialitza, validaConfiguracio, validaEmpremta
} from './associacio-apps.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ORIGEN = 'https://socdepoble.org';
/* Sintètiques i evidents: 00:01:…:1F i 20:21:…:3F. */
const sintetica = (inici) => Array.from({ length: 32 }, (_, i) => (inici + i).toString(16).toUpperCase().padStart(2, '0')).join(':');
const E1 = sintetica(0);
const E2 = sintetica(32);
const configuracio = (empremtes = [], altres = {}) => ({
  esquema: ESQUEMA,
  android: { package_name: PAQUET_ANDROID, origens: [ORIGEN], sha256_cert_fingerprints: empremtes, ...altres }
});

function arrelTemporal(t, { config = configuracio(), hosting = { appAssociation: 'NONE' } } = {}) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-associacio-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, path.dirname(CONFIGURACIO)), { recursive: true });
  fs.writeFileSync(path.join(arrel, CONFIGURACIO), JSON.stringify(config));
  fs.writeFileSync(path.join(arrel, 'firebase.json'), JSON.stringify({ hosting: { public: 'dist', ...hosting } }));
  return arrel;
}

async function emissions(arrel, env = { VITE_CANONICAL_URL: ORIGEN }, ssr = false) {
  const connector = associacioApps({ arrel });
  connector.configResolved({ root: arrel, env, build: { ssr } });
  const emesos = [];
  await connector.generateBundle.call({ emitFile: (fitxer) => emesos.push(fitxer) });
  return emesos;
}

test('la configuració del repositori és vàlida i nomena el mateix paquet que Capacitor i Gradle', () => {
  const real = llegixConfiguracio(ARREL);
  assert.equal(real.android.package_name, PAQUET_ANDROID);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ARREL, 'capacitor.config.json'), 'utf8')).appId, PAQUET_ANDROID);
  assert.match(fs.readFileSync(path.join(ARREL, 'android/app/build.gradle'), 'utf8'), new RegExp(`applicationId "${PAQUET_ANDROID.replace(/\./g, '\\.')}"`));
  assert.deepEqual([...real.android.origens], [ORIGEN]);
  real.android.sha256_cert_fingerprints.forEach((empremta) => assert.equal(validaEmpremta(empremta), empremta));
});

test('firebase.json del repositori porta appAssociation NONE: Firebase no genera cap fitxer pel seu compte', () => {
  assert.doesNotThrow(() => comprovaHosting(ARREL));
});

test('sense empremtes no es publica res (ni declaracions buides)', (t) => {
  assert.equal(construeixAssetLinks(configuracio(), ORIGEN), null);
  assert.deepEqual(fitxersAssociacio({ arrel: arrelTemporal(t), origen: ORIGEN }), []);
});

test('amb empremtes, la forma exacta de Digital Asset Links i un JSON estable', () => {
  const declaracions = construeixAssetLinks(configuracio([E1, E2]), ORIGEN);
  assert.deepEqual(declaracions, [{
    relation: [RELACIO],
    target: { namespace: 'android_app', package_name: 'org.socdepoble.app', sha256_cert_fingerprints: [E1, E2] }
  }]);
  assert.equal(RELACIO, 'delegate_permission/common.handle_all_urls');
  assert.equal(serialitza(declaracions), `[\n  {\n    "relation": [\n      "delegate_permission/common.handle_all_urls"\n    ],\n    "target": {\n      "namespace": "android_app",\n      "package_name": "org.socdepoble.app",\n      "sha256_cert_fingerprints": [\n        "${E1}",\n        "${E2}"\n      ]\n    }\n  }\n]\n`);
});

test('empremtes rebutjades: minúscula, guions, longitud, farciment, repetida i massa', () => {
  for (const dolenta of [E1.toLowerCase(), E1.replace(/:/g, '-'), E1.replace(/:/g, ''), E1.slice(3), `${E1}:20`, Array(32).fill('00').join(':'), Array(32).fill('FF').join(':'), ` ${E1}`, 42, null]) {
    assert.throws(() => validaEmpremta(dolenta), TypeError, String(dolenta));
    assert.throws(() => validaConfiguracio(configuracio([dolenta])), TypeError, String(dolenta));
  }
  assert.throws(() => validaConfiguracio(configuracio([E1, E1])), /repetida/);
  const massa = Array.from({ length: MAXIM_EMPREMTES + 1 }, (_, i) => sintetica(i * 32 % 200 + i));
  assert.throws(() => validaConfiguracio(configuracio(massa)), /com a molt/);
});

test('configuració rebutjada: esquema, paquet, claus desconegudes, origens i llista', () => {
  assert.throws(() => validaConfiguracio({ ...configuracio(), esquema: 'altre' }), /esquema/);
  assert.throws(() => validaConfiguracio({ ...configuracio(), extra: 1 }), /claus desconegudes/);
  assert.throws(() => validaConfiguracio(configuracio([], { package_name: 'org.socdepoble.app.debug' })), /package_name/);
  assert.throws(() => validaConfiguracio(configuracio([], { sha256: [E1] })), /claus desconegudes/);
  assert.throws(() => validaConfiguracio(configuracio([], { sha256_cert_fingerprints: E1 })), /llista/);
  for (const origens of [[], ['http://socdepoble.org'], ['https://socdepoble.org/app'], ['https://SocDePoble.org'], [ORIGEN, `${ORIGEN}/`], 'https://socdepoble.org']) {
    assert.throws(() => validaConfiguracio(configuracio([], { origens })), TypeError, JSON.stringify(origens));
  }
  assert.throws(() => validaConfiguracio([]), TypeError);
  assert.equal(origenExacte(`${ORIGEN}/`), ORIGEN);
});

test('un altre domini (un node germà) no publica res en nom de l’app', () => {
  assert.equal(construeixAssetLinks(configuracio([E1]), 'https://gentdelatorre.net'), null);
  assert.throws(() => construeixAssetLinks(configuracio([E1]), 'http://socdepoble.org'), TypeError);
});

test('amb empremtes i Firebase en AUTO (o sense la clau), el build para', (t) => {
  for (const hosting of [{ appAssociation: 'AUTO' }, {}]) {
    const arrel = arrelTemporal(t, { config: configuracio([E1]), hosting });
    assert.throws(() => fitxersAssociacio({ arrel, origen: ORIGEN }), /appAssociation/);
  }
  const arrel = arrelTemporal(t, { config: configuracio([E1]) });
  assert.deepEqual(fitxersAssociacio({ arrel, origen: ORIGEN }).map(([nom]) => nom), [FITXER_ASSETLINKS]);
});

test('sense el fitxer de configuració, o amb JSON trencat, el build para', (t) => {
  const arrel = arrelTemporal(t);
  fs.writeFileSync(path.join(arrel, CONFIGURACIO), '{');
  assert.throws(() => llegixConfiguracio(arrel), /JSON no vàlid/);
  fs.rmSync(path.join(arrel, CONFIGURACIO));
  assert.throws(() => llegixConfiguracio(arrel), /absent/);
});

test('connector: només al build, cap emissió en SSR, sense empremtes ni per a un altre origen', async (t) => {
  const connector = associacioApps({ arrel: ARREL });
  assert.deepEqual([connector.name, connector.apply], ['sdp:associacio-apps', 'build']);
  const ambEmpremtes = arrelTemporal(t, { config: configuracio([E1]) });
  const emesos = await emissions(ambEmpremtes);
  assert.deepEqual(emesos.map((f) => [f.type, f.fileName]), [['asset', FITXER_ASSETLINKS]]);
  assert.deepEqual(JSON.parse(emesos[0].source)[0].target.sha256_cert_fingerprints, [E1]);
  assert.deepEqual(await emissions(ambEmpremtes, { VITE_CANONICAL_URL: ORIGEN }, true), []);
  assert.deepEqual(await emissions(ambEmpremtes, { VITE_CANONICAL_URL: 'https://gentdelatorre.net' }), []);
  assert.deepEqual(await emissions(arrelTemporal(t)), []);
});

test('l’origen per defecte del build és el de src/config/origenPublic.js', async () => {
  assert.equal(await origenDelBuild({ env: {}, arrel: ARREL }), ORIGEN);
  assert.equal(await origenDelBuild({ env: { VITE_CANONICAL_URL: ' https://gentdelatorre.net/ ' }, arrel: ARREL }), 'https://gentdelatorre.net');
  await assert.rejects(origenDelBuild({ env: { VITE_CANONICAL_URL: 'http://socdepoble.org' }, arrel: ARREL }), TypeError);
});
