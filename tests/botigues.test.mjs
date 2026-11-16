/* tests/botigues.test.mjs — els scripts de pujada a les botigues («Pregunta Zero», 261003).
   Instal·lat el 261019 (Fase C) des de nous/botigues/botigues.test.mjs.txt del laboratori
   261003_1330_empaquetat_mobil_claude, amb els scripts a scripts/botigues/. Entra a "test:node"
   pel manifest (tooling/tests/node-suite-manifest.json, suite primary).
   El 261003 estes proves (6 de 6 en verd) es van executar contra els fitxers .mjs.txt del
   laboratori, carregats com a mòduls data:, des d'un bloc temporal de tests/natiu-build.test.mjs
   que després es va retirar. En instal·lar-les: el pla d'altool segueix l'altool d'Xcode 27.1,
   projecteIos es prova en una carpeta temporal (l'arbre real tindrà ios/ quan es faça cap add ios)
   i hi ha una prova nova per al JDK de Gradle.
   Cap prova compila, signa ni puja res, ni crida xcodebuild, altool, gradle, keytool ni fastlane
   (el preflight rep consultes fingides): només peces pures, fitxers temporals fora del
   repositori, git de només lectura (i un repositori de mostra en una carpeta temporal, per al
   paquet caducat de BOT-A4), zips fets per la prova, processos fills de Node, JDK fingits
   (scripts /bin/sh) i, en macOS, «/usr/libexec/java_home -v 21».
   Només les proves que miren «l'arbre real» (git, capacitor.config.json) se
   salten en una còpia sense .git, amb el motiu a la vista. La plantilla és
   versionada i obligatòria: es comprova igualment sense laboratori germà.
   El destí extern dels rebuts és un contracte, pot ser un directori futur. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import * as e from '../scripts/botigues/entorn.mjs';
import * as p from '../scripts/botigues/preflight.mjs';
import * as ios from '../scripts/botigues/puja-ios.mjs';
import * as android from '../scripts/botigues/puja-android.mjs';
import * as versioClient from '../scripts/botigues/versio-client.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENSE_REPOSITORI = !fs.existsSync(path.join(ARREL, '.git')) && 'còpia sense .git: esta prova mira l\'arbre real del repositori';

test('botigues: peces pures (fitxer d\'entorn, prohibides, màscares, empremtes, opcions, arguments)', () => {
  const { valors, errors } = e.analitzaEntorn('# comentari\nexport SDP_APP_ID=org.socdepoble.app\nSDP_ASC_KEY_ID="ABC123DEFG" # nota\nSDP_X=\'a b\'\nSDP_Y=valor # inline\nSDP_APP_ID=valorduplicat\nmal\nSDP_Z="valorobert\n\n');
  assert.deepEqual(valors, { SDP_APP_ID: 'org.socdepoble.app', SDP_ASC_KEY_ID: 'ABC123DEFG', SDP_X: 'a b', SDP_Y: 'valor' });
  assert.deepEqual(errors.map((x) => [x.linia, x.nom ?? null]), [[6, 'SDP_APP_ID'], [7, null], [8, 'SDP_Z']]);
  assert.ok(!JSON.stringify(errors).includes('valorduplicat') && !JSON.stringify(errors).includes('valorobert'), 'cap valor als errors');
  // Un identificador només es canvia sencer; una contrasenya, on siga.
  const mixt = { SDP_ANDROID_KEY_ALIAS: 'upload', SDP_ANDROID_KEY_PASSWORD: ("secr" + "eta1"), SDP_APP_ID: ("org.socde" + "poble.app") };
  assert.equal(e.emmascara('--upload-app alias upload; xsecreta1y; org.socdepoble.app://a org.socdepoble.app.debug', mixt),
    '--upload-app alias <SDP_ANDROID_KEY_ALIAS>; x<SDP_ANDROID_KEY_PASSWORD>y; <SDP_APP_ID>://a org.socdepoble.app.debug');
  const pem = '-----BEGIN PRIVATE KEY-----MIGTAgEAMBMG';
  const dolents = e.prohibides({ VITE_SECRET: 'x', SDP_ASC_KEY_PATH: pem, SDP_PLAY_JSON_KEY_PATH: '{"type": "service_account"}', SDP_OK: '/Users/x/k.p8' });
  assert.deepEqual(dolents.map((d) => d.nom), ['VITE_SECRET', 'SDP_ASC_KEY_PATH', 'SDP_PLAY_JSON_KEY_PATH']);
  assert.ok(!JSON.stringify(dolents).includes('MIGTAgEAMBMG'));
  assert.deepEqual(e.desconegudes({ SDP_APP_ID: 'x', ALTRA: 'y' }), ['ALTRA']);
  assert.deepEqual(e.falten({ SDP_APP_ID: 'x', SDP_APPLE_TEAM_ID: ' ' }, ['ios']), ['SDP_APPLE_TEAM_ID', 'SDP_ASC_ISSUER_ID', 'SDP_ASC_KEY_ID', 'SDP_ASC_KEY_PATH', 'SDP_BUILDS_DIR']);
  assert.deepEqual(e.falten({}, ['android']), ['SDP_ANDROID_UPLOAD_CERT_SHA256', 'SDP_APP_ID', 'SDP_PLAY_JSON_KEY_PATH']);
  assert.equal(e.emmascara('clau ABC123DEFG i ABC123DEFG-ext, 1 i x', { K: 'ABC123DEFG', L: 'ABC123DEFG-ext', C: '1' }), 'clau <K> i <L>, 1 i x');
  assert.equal(e.mostraOrdre('xcrun', ['altool', '--apiKey', 'ABC123DEFG', '--file', '/a b/App.ipa'], { SDP_ASC_KEY_ID: 'ABC123DEFG' }), 'xcrun altool --apiKey <SDP_ASC_KEY_ID> --file \'/a b/App.ipa\'');
  assert.equal(e.esDins('/a/b', '/a/b/c'), true);
  assert.equal(e.esDins('/a/b', '/a/b'), true);
  assert.equal(e.esDins('/a/b', '/a/bc'), false);
  assert.equal(e.esDins('/a/b', '/a'), false);
  for (const nom of ['.env', '.env.local', '.env.natiu', '.env.natiu.local', '.env.production.local', '/x/.env.development']) assert.equal(e.esFitxerDeVite(nom), true, nom);
  for (const nom of ['.env.botigues.local', '.env.example', 'botigues.env']) assert.equal(e.esFitxerDeVite(nom), false, nom);
  const hex = 'AB'.repeat(32);
  assert.equal(e.normalitzaEmpremta(hex.match(/../g).join(':').toLowerCase()), hex);
  assert.equal(e.normalitzaEmpremta('12:34'), null);
  assert.equal(e.empremtaDeKeytool(`Signer #1:\nCertificate fingerprints:\n\t SHA1: 11:22\n\t SHA256: ${hex.match(/../g).join(':')}\n`), hex);
  assert.equal(e.empremtaDeKeytool('res'), null);
  assert.equal(e.equipDeCodesign('Executable=/x\nTeamIdentifier=ABCDE12345\nSealed'), 'ABCDE12345');
  assert.equal(e.equipDeCodesign('TeamIdentifier=not set'), null);
  assert.deepEqual(e.opcionsQueFalten('Usage: altool --upload-app -f, --file <file>\n  --apiKey <key>, [--apiIssuer]', ['--upload-app', '--file', '--apiKey', '--apiIssuer', '--validate-app', '--api']), ['--validate-app', '--api']);
  assert.deepEqual(e.opcionsQueFalten(null, ['-x']), ['-x']);
  assert.deepEqual(e.analitzaArguments(['--versio', '1.0.0', '--build=7', '--compila', '--confirma=1.0.0+7'], { versio: true, build: true, compila: false, confirma: true }),
    { opcions: { versio: '1.0.0', build: '7', compila: true, confirma: '1.0.0+7' }, errors: [] });
  assert.equal(e.analitzaArguments(['--x', '--compila=1', '--versio'], { versio: true, compila: false }).errors.length, 3);
  assert.deepEqual(e.versioDeGradle('defaultConfig {\n    versionCode 7\n    versionName "1.0.0"\n}'), { build: '7', versio: '1.0.0' });
  assert.equal(e.confirmacioEsperada('1.0.0', '7'), '1.0.0+7');
  assert.match(e.exportOptionsPlist('ABCDE12345'), /<key>destination<\/key><string>export<\/string>/);
  assert.throws(() => e.exportOptionsPlist('x'), /Team ID/);
});

test('botigues: git ignora .env.botigues.local i no ignora un fitxer d\'entorn d\'un altre nom', { skip: SENSE_REPOSITORI }, () => {
  assert.equal(e.gitIgnora(ARREL, path.join(ARREL, '.env.botigues.local')), true);
  assert.equal(e.gitIgnora(ARREL, path.join(ARREL, 'botigues.env')), false);
  assert.equal(e.gitIgnora(ARREL, path.join(ARREL, 'src', 'natiu', 'claus.env')), false);
});

test('botigues: carregaEntorn i comprovaVariables sobre fitxers reals fora del repositori', () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-'));
  try {
    const fitxer = path.join(carpeta, 'botigues.env');
    const clau = path.join(carpeta, 'AuthKey_ABC123DEFG.p8');
    const json = path.join(carpeta, 'play.json');
    const builds = path.join(carpeta, 'builds');
    fs.mkdirSync(builds);
    fs.writeFileSync(clau, 'no és una clau', { mode: 0o600 });
    fs.writeFileSync(json, '{}', { mode: 0o600 });
    const text = `SDP_APP_ID=org.socdepoble.app\nSDP_APPLE_TEAM_ID=ABCDE12345\nSDP_ASC_KEY_ID=ABC123DEFG\nSDP_ASC_ISSUER_ID=69a6de70-0000-0000-0000-000000000000\nSDP_ASC_KEY_PATH=${clau}\nSDP_BUILDS_DIR=${builds}\nSDP_PLAY_JSON_KEY_PATH=${json}\nSDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}\n`;
    const env = { SDP_BOTIGUES_ENV: fitxer };
    assert.equal(e.carregaEntorn({ arrel: ARREL, env }).codi, e.EIXIDA.FITXER, 'no hi és');
    fs.writeFileSync(fitxer, text, { mode: 0o644 });
    fs.chmodSync(fitxer, 0o644);
    const obert = e.carregaEntorn({ arrel: ARREL, env });
    assert.equal(obert.codi, e.EIXIDA.FITXER);
    assert.match(obert.problemes[0], /chmod 600/);
    fs.chmodSync(fitxer, 0o600);
    const be = e.carregaEntorn({ arrel: ARREL, env });
    assert.equal(be.codi, e.EIXIDA.BE, be.problemes.join(' | '));
    assert.deepEqual(e.comprovaVariables({ arrel: ARREL, valors: be.valors, contextos: ['ios', 'android'] }), { codi: e.EIXIDA.BE, problemes: [] });
    const dinsDelRepo = e.comprovaVariables({ arrel: ARREL, valors: { ...be.valors, SDP_PLAY_JSON_KEY_PATH: path.join(ARREL, 'package.json') }, contextos: ['android'] });
    assert.equal(dinsDelRepo.codi, e.EIXIDA.FALTA);
    assert.match(dinsDelRepo.problemes.join(' '), /SDP_PLAY_JSON_KEY_PATH: és dins del repositori/);
    const nomDolent = e.comprovaVariables({ arrel: ARREL, valors: { ...be.valors, SDP_ASC_KEY_ID: 'ALTRAKEY01' }, contextos: ['ios'] });
    assert.match(nomDolent.problemes.join(' '), /AuthKey_<SDP_ASC_KEY_ID>\.p8/);
    fs.chmodSync(clau, 0o644);
    assert.match(e.comprovaVariables({ arrel: ARREL, valors: be.valors, contextos: ['ios'] }).problemes.join(' '), /SDP_ASC_KEY_PATH: el fitxer té permisos 644/);
    fs.writeFileSync(fitxer, `${text}VITE_SDP_SECRET=x\n`, { mode: 0o600 });
    const vite = e.carregaEntorn({ arrel: ARREL, env });
    assert.equal(vite.codi, e.EIXIDA.PROHIBIDA);
    assert.match(vite.problemes.join(' '), /VITE_SDP_SECRET/);
    assert.equal(e.carregaEntorn({ arrel: ARREL, env: { SDP_BOTIGUES_ENV: path.join(carpeta, '.env.natiu.local') } }).codi, e.EIXIDA.FITXER, 'un fitxer de Vite');
    // Cap missatge porta cap valor.
    for (const resultat of [obert, vite, dinsDelRepo, nomDolent]) {
      for (const valor of ['ABCDE12345', '69a6de70', 'org.socdepoble.app']) assert.ok(!JSON.stringify(resultat.problemes).includes(valor), valor);
    }
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('botigues: plans emmascarats, contrasenyes només a l\'entorn del fill, i executa filtra l\'eixida', async () => {
  const valors = { SDP_APP_ID: 'org.socdepoble.app', SDP_APPLE_TEAM_ID: 'ABCDE12345', SDP_ASC_KEY_ID: 'ABC123DEFG', SDP_ASC_ISSUER_ID: '69a6de70-1111-2222-3333-444455556666',
    SDP_ASC_KEY_PATH: '/claus/AuthKey_ABC123DEFG.p8', SDP_BUILDS_DIR: '/fora/builds', SDP_PLAY_JSON_KEY_PATH: '/claus/play.json',
    SDP_ANDROID_KEYSTORE_PATH: ("/claus/up" + "load.jks"), SDP_ANDROID_KEY_ALIAS: 'upload', SDP_ANDROID_KEYSTORE_PASSWORD: ("TEST_ONLY_KEYS" + "TORE_PASSWORD"), SDP_ANDROID_KEY_PASSWORD: ("contrase" + "nya-clau") };
  const pla = ios.planIos({ arrel: ARREL, valors, versio: '1.0.0', build: '7', projecte: { opcio: '-project', cami: path.join(ARREL, 'ios/App/App.xcodeproj') } });
  const mostrat = [e.mostraOrdre(...pla.arxiva, valors), e.mostraOrdre(...pla.exporta, valors), e.mostraOrdre(...pla.valida('/fora/builds/x/App.ipa'), valors), e.mostraOrdre(...pla.puja('/fora/builds/x/App.ipa'), valors)].join('\n');
  for (const valor of ['ABC123DEFG', '69a6de70', '/claus/', '/fora/builds']) assert.ok(!mostrat.includes(valor), valor);
  assert.match(mostrat, /-authenticationKeyID <SDP_ASC_KEY_ID>/);
  // La forma d'altool 27.0.5 (Xcode 27.1): --validate-app <fitxer>, --upload-app -f <fitxer>, --api-key, --api-issuer,
  // i la clau per la seua ruta (--p8-file-path), no per la busca en carpetes fixes.
  assert.match(mostrat, /altool --validate-app <SDP_BUILDS_DIR>\/x\/App\.ipa --api-key <SDP_ASC_KEY_ID> --api-issuer <SDP_ASC_ISSUER_ID> --p8-file-path <SDP_ASC_KEY_PATH>/);
  assert.match(mostrat, /altool --upload-app -f <SDP_BUILDS_DIR>\/x\/App\.ipa --api-key <SDP_ASC_KEY_ID> --api-issuer <SDP_ASC_ISSUER_ID> --p8-file-path <SDP_ASC_KEY_PATH>/);
  assert.ok(!/--file|--type|--apiKey|--apiIssuer|--auth-string/.test(mostrat), 'cap opció de l\'altool d\'abans, i la clau mai escrita');
  const ajudaAltool = 'altool --upload-app -f <file>\n          Authentication [Options]\naltool --validate-app <file>\n'
    + 'altool --generate-jwt --apiKey <api_key> --apiIssuer <issuer_id>\n          [--auth-string <string> | --p8-file-path <path>]\n'
    + '    --p8-file-path <filepath>     Direct path to JWT p8 authentication file\n    --api-key <string>            API Key\n    --api-issuer <id>             Issuer ID\n';
  assert.deepEqual(e.opcionsQueFalten(ajudaAltool, ios.OPCIONS_ALTOOL), []);
  assert.deepEqual(e.opcionsQueFalten(ajudaAltool, ['--file', '--type']), ['--file', '--type'], 'el pla de 261003 parava amb l\'eixida 6');
  assert.match(mostrat, /MARKETING_VERSION=1\.0\.0 CURRENT_PROJECT_VERSION=7 archive/);
  // Fase C (261019) · SPM sense clauer: la resolució no es queda esperant una credencial de github.com.
  assert.match(mostrat, /-destination generic\/platform=iOS -packageAuthorizationProvider netrc /);
  assert.ok(ios.OPCIONS_XCODEBUILD.includes('-packageAuthorizationProvider'));
  assert.ok(!pla.arxiva[1].includes('upload') && pla.arxiva[1].includes('-project'));
  assert.equal(pla.entornAltool, undefined, 'cap API_PRIVATE_KEYS_DIR: la clau va per --p8-file-path');
  assert.equal(e.mostraOrdre(pla.plist, [], valors), '<SDP_BUILDS_DIR>/sdp-ios-1.0.0-7/ExportOptions.plist');
  const pa = android.planAndroid({ arrel: ARREL, valors });
  const args = [...pa.compila[1], ...pa.certificat[1], ...pa.valida[1], ...pa.puja[1]].join(' ');
  for (const secret of ['TEST_ONLY_KEYSTORE_PASSWORD', 'contrasenya-clau']) assert.ok(!args.includes(secret), 'cap contrasenya a la línia d\'ordres');
  assert.equal(pa.entornDeSignatura().SDP_ANDROID_KEYSTORE_PASSWORD, 'TEST_ONLY_KEYSTORE_PASSWORD');
  assert.deepEqual(pa.entornDeGradle('/jdk/21'), { JAVA_HOME: '/jdk/21', ...pa.entornDeSignatura() }, 'Gradle rep el JDK del preflight per JAVA_HOME');
  assert.deepEqual(pa.compila[1], ['--no-daemon', 'bundleRelease']);
  assert.ok(pa.valida[1].includes('--validate_only') && pa.valida[1].at(-1) === 'true' && pa.puja[1].at(-1) === 'false');
  assert.ok(pa.puja[1].join(' ').includes('--track internal --release_status draft'));
  assert.match(e.mostraOrdre(...pa.puja, valors), /--package_name <SDP_APP_ID> --json_key <SDP_PLAY_JSON_KEY_PATH>/);
  // executa: el fill rep la contrasenya per l'entorn, i el que imprimix ix emmascarat.
  const { codi, eixida } = await e.executa(process.execPath, ['-e', 'console.log("pas:" + process.env.SDP_ANDROID_KEY_PASSWORD); console.error(process.env.SDP_ANDROID_KEY_PASSWORD)'],
    { valors, entornExtra: { SDP_ANDROID_KEY_PASSWORD: valors.SDP_ANDROID_KEY_PASSWORD }, mostra: false });
  assert.equal(codi, 0);
  assert.ok(!eixida.includes('contrasenya-clau'));
  assert.match(eixida, /pas:<SDP_ANDROID_KEY_PASSWORD>/);
  assert.equal((await e.executa('/no/existix/cap/eina', [], { mostra: false })).codi, 127);
  // Les verificacions analitzen el text cru: amb l'emmascarat, l'equip bo es llegiria «<SDP_APPLE_TEAM_ID>».
  const codesign = await e.executa(process.execPath, ['-e', 'console.error("Executable=/x\\nTeamIdentifier=ABCDE12345\\nSealed Resources")'], { valors, mostra: false });
  assert.match(codesign.eixida, /TeamIdentifier=<SDP_APPLE_TEAM_ID>/);
  assert.equal(e.equipDeCodesign(codesign.crua), 'ABCDE12345');
  assert.equal(e.equipDeCodesign(codesign.eixida), '<SDP_APPLE_TEAM_ID>', 'per això el script no analitza l\'emmascarat');
});

test('botigues: la màscara tapa les rutes amb ~ i les relatives tal com les reben les eines, i el Key ID dins d\'AuthKey_', async () => {
  // La forma que recomana el RUNBOOK (H-A1): SDP_ASC_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8.
  const valors = { SDP_APP_ID: 'org.socdepoble.app', SDP_APPLE_TEAM_ID: 'ABCDE12345', SDP_ASC_KEY_ID: 'FAKEKEY001', SDP_ASC_ISSUER_ID: '69a6de70-1111-2222-3333-444455556666',
    SDP_ASC_KEY_PATH: '~/sdp-claus-fals/AuthKey_FAKEKEY001.p8', SDP_BUILDS_DIR: '~/sdp-b', SDP_PLAY_JSON_KEY_PATH: '../sdp-claus-rel-fals/play.json',
    SDP_ANDROID_KEYSTORE_PATH: '../sdp-claus-rel-fals/upload.jks' };
  const fuites = ['FAKEKEY001', 'sdp-claus-fals', 'sdp-b/', 'sdp-claus-rel-fals'];
  const pla = ios.planIos({ arrel: ARREL, valors, versio: '1.0.0', build: '7', projecte: { opcio: '-project', cami: path.join(ARREL, 'ios/App/App.xcodeproj') } });
  const pa = android.planAndroid({ arrel: ARREL, valors });
  const ipa = path.join(pla.exportacio, 'App.ipa');
  const mostrat = [pla.arxiva, pla.exporta, pla.valida(ipa), pla.puja(ipa), pa.puja].map((ordre) => e.mostraOrdre(...ordre, valors, ARREL)).join('\n');
  for (const fuita of fuites) assert.ok(!mostrat.includes(fuita), fuita);
  assert.ok(!mostrat.includes(path.join(os.homedir(), 'sdp-')), 'cap ruta desplegada de la carpeta de l\'usuari');
  assert.match(mostrat, /-archivePath '?<SDP_BUILDS_DIR>\/sdp-ios-1\.0\.0-7\/App\.xcarchive'? /);
  assert.match(mostrat, /-authenticationKeyPath '?<SDP_ASC_KEY_PATH>'? /);
  assert.match(mostrat, /--json_key '?<SDP_PLAY_JSON_KEY_PATH>'? /);
  assert.equal(e.mostraOrdre(pla.plist, [], valors, ARREL).replace(/'/g, ''), '<SDP_BUILDS_DIR>/sdp-ios-1.0.0-7/ExportOptions.plist');
  // Sense l'arrel, el ~ també es desplega; i el Key ID es tapa dins del nom de la clau, vinga d'on vinga la ruta.
  assert.equal(e.emmascara(`${path.join(os.homedir(), 'sdp-b')}/x`, valors), '<SDP_BUILDS_DIR>/x');
  assert.equal(e.emmascara('error: /una/altra/AuthKey_FAKEKEY001.p8 i FAKEKEY001', valors), 'error: /una/altra/AuthKey_<SDP_ASC_KEY_ID>.p8 i <SDP_ASC_KEY_ID>');
  assert.equal(e.emmascara('AuthKey_ABC.p8', { SDP_ASC_KEY_ID: 'ABC' }), 'AuthKey_ABC.p8', 'un valor curt no es tapa');
  // L'eixida d'una eina que escriu les rutes resoltes ix tapada línia a línia.
  const escriu = `console.log(${JSON.stringify(e.rutaDe(ARREL, valors, 'SDP_ANDROID_KEYSTORE_PATH'))}); console.error(${JSON.stringify(e.rutaDe(ARREL, valors, 'SDP_ASC_KEY_PATH'))})`;
  const fill = await e.executa(process.execPath, ['-e', escriu], { valors, arrel: ARREL, mostra: false });
  assert.equal(fill.codi, 0);
  assert.deepEqual(fill.eixida.split('\n').sort(), ['<SDP_ANDROID_KEYSTORE_PATH>', '<SDP_ASC_KEY_PATH>'], 'stdout i stderr poden arribar en qualsevol ordre');
});

test('botigues: projecteIos tria l\'espai de treball (CocoaPods) o el projecte (SPM, Capacitor 8)', () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-ios-'));
  try {
    assert.equal(p.projecteIos(carpeta), null, 'sense ios/');
    fs.mkdirSync(path.join(carpeta, 'ios', 'App', 'App.xcodeproj', 'project.xcworkspace'), { recursive: true });
    assert.deepEqual(p.projecteIos(carpeta), { opcio: '-project', cami: path.join(carpeta, 'ios', 'App', 'App.xcodeproj') }, 'la plantilla SPM: l\'espai intern del projecte no compta');
    fs.mkdirSync(path.join(carpeta, 'ios', 'App', 'App.xcworkspace'));
    assert.deepEqual(p.projecteIos(carpeta), { opcio: '-workspace', cami: path.join(carpeta, 'ios', 'App', 'App.xcworkspace') });
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('botigues: el JDK de Gradle és del 21 al 24, i es mira la versió real de cada candidat', () => {
  assert.equal(e.JDK_MINIM, 21);
  assert.equal(e.JDK_MAXIM, 24, 'el Gradle 8.14.3 de la plantilla android no corre amb Java 25');
  assert.equal(e.versioMajorDeJava('openjdk version "17.0.17" 2025-10-21\nOpenJDK Runtime Environment Temurin-17.0.17+10'), 17);
  assert.equal(e.versioMajorDeJava('openjdk version "21.0.8" 2025-07-15'), 21);
  assert.equal(e.versioMajorDeJava('java version "1.8.0_402"'), 8);
  assert.equal(e.versioMajorDeJava('openjdk version "25" 2025-09-16'), 25);
  assert.equal(e.versioMajorDeJava('res'), null);
  if (process.platform === 'win32') return;
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-jdk-'));
  try {
    // Un «java» fals que respon com un JDK: el script només llig «java -version».
    const jdkFals = (nom, versio) => {
      const home = path.join(carpeta, nom);
      fs.mkdirSync(path.join(home, 'bin'), { recursive: true });
      fs.writeFileSync(path.join(home, 'bin', 'java'), `#!/bin/sh\necho 'openjdk version "${versio}" 2025-07-15' >&2\n`, { mode: 0o755 });
      return home;
    };
    const jdk21 = jdkFals('jdk21', '21.0.8');
    const jdk17 = jdkFals('jdk17', '17.0.17');
    const jdk25 = jdkFals('jdk25', '25');
    assert.deepEqual(e.jdkPerAGradle({ env: { JAVA_HOME: jdk21 } }), { home: jdk21, major: 21 });
    assert.equal(e.candidatsDeJdk({ JAVA_HOME: jdk21 })[0], jdk21, 'JAVA_HOME va primer');
    assert.ok(e.candidatsDeJdk({}).includes(e.JBR_D_ANDROID_STUDIO));
    // Amb els candidats fingits no s'arranca cap JDK de veres.
    assert.deepEqual(e.jdkPerAGradle({ candidats: [jdk17, jdk25, path.join(carpeta, 'no-hi-es'), jdk21] }), { home: jdk21, major: 21 }, 'el 17 i el 25 no valen; el que no hi és, tampoc');
    assert.equal(e.jdkPerAGradle({ candidats: [jdk17, jdk25] }), null);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

/* Les consultes del preflight a eines de fora, fingides: cap eina arranca. */
const fingides = (jdk) => ({ llegixAjuda: () => 'ajuda fingida', jdkPerAGradle: () => jdk });

test('botigues: preflight sobre l\'arbre real ix amb la primera família que falla, sense valors', () => {
  assert.equal(p.ARREL_DEL_SCRIPT, ARREL);
  const r = p.preflight({ arrel: ARREL, plataformes: ['android'], env: { SDP_BOTIGUES_ENV: path.join(os.tmpdir(), 'sdp-no-existix.env') }, consultes: fingides(null) });
  assert.equal(r.codi, e.EIXIDA.FITXER);
  assert.deepEqual(r.valors, {});
  assert.equal(r.jdk, null);
  assert.match(r.linies.join('\n'), /✗ no hi ha cap fitxer d'entorn/);
  assert.ok(r.linies.join('\n').includes(e.PLANTILLA_DE_L_ENTORN), 'el missatge nomena la plantilla instal·lada');
});

test('botigues: la plantilla versionada existix i només conté les dotze variables buides', () => {
  assert.equal(e.PLANTILLA_DE_L_ENTORN, 'scripts/botigues/botigues.env.exemple.txt');
  const fitxer = path.resolve(ARREL, e.PLANTILLA_DE_L_ENTORN);
  assert.ok(fs.existsSync(fitxer), 'falta la plantilla versionada: no depén del laboratori');
  assert.ok(fs.lstatSync(fitxer).isFile(), 'la plantilla ha de ser un fitxer regular');
  const { valors, errors } = e.analitzaEntorn(fs.readFileSync(fitxer, 'utf8'));
  assert.deepEqual(errors, []);
  assert.deepEqual(Object.keys(valors).sort(), Object.keys(e.VARIABLES).sort());
  // Només booleans als errors: una contaminació accidental no exposa valors.
  assert.equal(Object.values(valors).every(valor => valor === ''), true, 'la plantilla no pot portar credencials ni valors d’un entorn');
  assert.deepEqual(e.desconegudes(valors), []);
  assert.deepEqual(e.prohibides(valors), []);
});

test('botigues: el destí dels rebuts és extern i no exigix que el laboratori ja existisca', () => {
  assert.equal(e.REBUTS, '../_investigacio_ia_de_poble/261003_1330_empaquetat_mobil_claude/rebuts');
  assert.equal(path.isAbsolute(e.REBUTS), false);
  assert.equal(e.esDins(ARREL, path.resolve(ARREL, e.REBUTS)), false);
});

test('botigues: sense JDK per a Gradle, --signa para amb l\'eixida 6 i sense --signa és un avís', () => {
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-signa-'));
  try {
    // Una arrel que no és cap repositori (la família de l'arbre falla sempre, amb el 7) i les claus fora d'ella.
    const arrel = path.join(fora, 'arrel');
    fs.mkdirSync(arrel);
    const json = path.join(fora, 'play.json');
    const magatzem = path.join(fora, 'upload.jks');
    for (const fitxer of [json, magatzem]) fs.writeFileSync(fitxer, 'fals', { mode: 0o600 });
    const fitxer = path.join(fora, 'botigues.env');
    fs.writeFileSync(fitxer, `SDP_APP_ID=org.socdepoble.app\nSDP_PLAY_JSON_KEY_PATH=${json}\nSDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}\n`
      + `SDP_ANDROID_KEYSTORE_PATH=${magatzem}\nSDP_ANDROID_KEY_ALIAS=pujada-fals\nSDP_ANDROID_KEYSTORE_PASSWORD=contrasenya-magatzem\nSDP_ANDROID_KEY_PASSWORD=contrasenya-clau\n`, { mode: 0o600 });
    fs.chmodSync(fitxer, 0o600);
    const env = { SDP_BOTIGUES_ENV: fitxer };
    const signa = p.preflight({ arrel, plataformes: ['android'], signa: true, env, consultes: fingides(null) });
    assert.equal(signa.codi, e.EIXIDA.EINA, signa.linies.join('\n'));
    assert.match(signa.linies.join('\n'), /✗ no es troba cap JDK del 21 al 24 per a Gradle/);
    const sec = p.preflight({ arrel, plataformes: ['android'], signa: false, env, consultes: fingides(null) });
    assert.equal(sec.codi, e.EIXIDA.ARBRE, sec.linies.join('\n'));
    assert.match(sec.linies.join('\n'), /! no es troba cap JDK del 21 al 24 per a Gradle/);
    const amb = p.preflight({ arrel, plataformes: ['android'], signa: true, env: { ...env, JAVA_HOME: '/jdk/vell' }, consultes: fingides({ home: '/jdk/fals', major: 21 }) });
    assert.equal(amb.codi, e.EIXIDA.ARBRE);
    assert.equal(amb.jdk.home, '/jdk/fals');
    assert.match(amb.linies.join('\n'), /✓ JDK 21 per a Gradle: \/jdk\/fals/);
    assert.match(amb.linies.join('\n'), /! el JAVA_HOME de l'entorn no és un JDK del 21 al 24/);
    for (const resultat of [signa, sec, amb]) {
      for (const valor of ['org.socdepoble.app', 'pujada-fals', 'contrasenya', json, magatzem]) assert.ok(!resultat.linies.join('\n').includes(valor), valor);
    }
  } finally {
    fs.rmSync(fora, { recursive: true, force: true });
  }
});

/* Un zip mínim (APPNOTE.TXT de PKWARE, §4.3), com els AAB: cada entrada [nom, octets, mètode],
   guardada (0) o amb deflate (8). Sense CRC: llegixDelZip no el mira, i el segell es compara
   sencer amb el de dist-natiu/. */
function zipDe(entrades, comentari = '') {
  const locals = [];
  const centrals = [];
  let desplacament = 0;
  for (const [nom, contingut, metode = 8] of entrades) {
    const dades = metode === 8 ? zlib.deflateRawSync(contingut) : Buffer.from(contingut);
    const delNom = Buffer.from(nom);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(metode, 8);
    local.writeUInt32LE(dades.length, 18);
    local.writeUInt32LE(contingut.length, 22);
    local.writeUInt16LE(delNom.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(metode, 10);
    central.writeUInt32LE(dades.length, 20);
    central.writeUInt32LE(contingut.length, 24);
    central.writeUInt16LE(delNom.length, 28);
    central.writeUInt32LE(desplacament, 42);
    locals.push(local, delNom, dades);
    centrals.push(central, delNom);
    desplacament += local.length + delNom.length + dades.length;
  }
  const directori = Buffer.concat(centrals);
  const final = Buffer.alloc(22);
  final.writeUInt32LE(0x06054b50, 0);
  final.writeUInt16LE(entrades.length, 8);
  final.writeUInt16LE(entrades.length, 10);
  final.writeUInt32LE(directori.length, 12);
  final.writeUInt32LE(desplacament, 16);
  final.writeUInt16LE(Buffer.byteLength(comentari), 20);
  return Buffer.concat([...locals, directori, final, Buffer.from(comentari)]);
}

/* BOT-A4 (261025) · El paquet caducat, com el va reproduir l'auditoria: un repositori de mostra
   amb dist-natiu/ i la còpia d'Android fora de git, un build al commit A, cap sync, i un commit B
   que canvia src/. Abans del segell, el preflight ho donava tot per bo (arbre net, còpia igual) i
   el rebut deia el HEAD, B. El segell d'esta prova l'escriu la prova amb git, no segellDelArbre:
   així el preflight es prova contra la forma, no contra el seu propi productor. A la revisió, el
   binari: un AAB o una app arxivada al commit A no es pugen encara que dist-natiu/ ja siga de B. */
test('botigues: el preflight no accepta un dist-natiu/ d\'un altre commit, compilat amb l\'arbre brut o sense segell', () => {
  /* Dins d'un hook de git, GIT_DIR i GIT_INDEX_FILE apuntarien al repositori de debò. */
  const deGit = Object.fromEntries(Object.entries(process.env).filter(([nom]) => nom.startsWith('GIT_')));
  for (const nom of Object.keys(deGit)) delete process.env[nom];
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-segell-'));
  /* Si TMPDIR és dins d'un repositori, git pujaria fins a ell des de la carpeta temporal. */
  process.env.GIT_CEILING_DIRECTORIES = fs.realpathSync(path.dirname(carpeta));
  try {
    const arrel = path.join(carpeta, 'arrel');
    const git = (...args) => {
      const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-c', 'user.name=prova', '-c', 'user.email=prova@example.invalid', ...args], { cwd: arrel, encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
      return r.stdout.trim();
    };
    const escriu = (rel, text) => {
      fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
      fs.writeFileSync(path.join(arrel, rel), text);
    };
    const DIST = 'dist-natiu';
    const COPIA = 'android/app/src/main/assets/public';
    fs.mkdirSync(arrel);
    git('init', '-q');
    escriu('.gitignore', `/${DIST}/\n/${COPIA}/\n`);
    escriu('android/gradlew', '#!/bin/sh\n');
    escriu('src/app.js', 'export const versio = "A";\n');
    git('add', '-A');
    git('commit', '-q', '--no-verify', '-m', 'A');
    const commitA = git('rev-parse', 'HEAD');
    // El mateix index.html a tots els builds: és el cas en què la còpia semblava la mateixa.
    let builds = 0;
    const compila = () => {
      builds += 1;
      escriu(`${DIST}/index.html`, '<html>app</html>\n');
      const segell = { commit: git('rev-parse', 'HEAD'), arbreNet: git('status', '--porcelain') === '', data: `2026-10-25T10:0${builds}:00.000Z` };
      escriu(`${DIST}/segell.json`, `${JSON.stringify(segell, null, 2)}\n`);
    };
    const sincronitza = () => {
      fs.rmSync(path.join(arrel, COPIA), { recursive: true, force: true });
      fs.cpSync(path.join(arrel, DIST), path.join(arrel, COPIA), { recursive: true });
    };
    // Un fitxer d'entorn bo per a Android, fora del repositori de mostra.
    const json = path.join(carpeta, 'play.json');
    fs.writeFileSync(json, 'fals', { mode: 0o600 });
    const fitxer = path.join(carpeta, 'botigues.env');
    fs.writeFileSync(fitxer, `SDP_APP_ID=org.socdepoble.app\nSDP_PLAY_JSON_KEY_PATH=${json}\nSDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}\n`, { mode: 0o600 });
    fs.chmodSync(fitxer, 0o600);
    const pre = () => p.preflight({ arrel, plataformes: ['android'], env: { SDP_BOTIGUES_ENV: fitxer }, consultes: fingides({ home: '/jdk/fals', major: 21 }) });
    /* Els binaris que farien Gradle i Xcode amb la còpia d'ara: l'AAB porta public/ a
       base/assets/, i l'app arxivada, a App.app/public. */
    const signaAab = (nom) => {
      const aab = path.join(carpeta, `${nom}.aab`);
      const dePublic = fs.readdirSync(path.join(arrel, COPIA)).map((f) => [`base/assets/public/${f}`, fs.readFileSync(path.join(arrel, COPIA, f))]);
      fs.writeFileSync(aab, zipDe([['BundleConfig.pb', Buffer.from('config'), 0], ...dePublic]));
      return aab;
    };
    const arxivaApp = (nom) => {
      const app = path.join(carpeta, nom, 'App.app');
      fs.cpSync(path.join(arrel, COPIA), path.join(app, 'public'), { recursive: true });
      return app;
    };

    compila();
    sincronitza();
    const alDia = pre();
    assert.equal(alDia.codi, e.EIXIDA.BE, alDia.linies.join('\n'));
    assert.match(alDia.linies.join('\n'), new RegExp(`✓ dist-natiu/segell\\.json: compilat des de HEAD \\(${commitA.slice(0, 12)}\\)`));
    assert.equal(alDia.segell.commit, commitA);
    const aabA = signaAab('A');
    const appA = arxivaApp('A');
    assert.equal(android.problemaDeLAab(arrel, aabA), null, 'l\'AAB porta el segell de dist-natiu/');
    assert.equal(ios.problemaDeLApp(arrel, appA), null, 'l\'app arxivada porta el segell de dist-natiu/');

    // El commit B canvia src/: l'arbre torna a estar net, però dist-natiu/ i la còpia són d'A.
    escriu('src/app.js', 'export const versio = "B";\n');
    git('commit', '-q', '--no-verify', '-am', 'B');
    const commitB = git('rev-parse', 'HEAD');
    const caducat = pre();
    const text = caducat.linies.join('\n');
    assert.equal(caducat.codi, e.EIXIDA.ARBRE, text);
    assert.match(text, /✓ git status --porcelain no diu res/, 'git no veu dist-natiu/ ni la còpia');
    assert.match(text, /✓ android: la còpia de dist-natiu\/ és la mateixa/, 'la còpia és la del build, però el build és vell');
    assert.match(text, new RegExp(`✗ dist-natiu/ és del commit ${commitA.slice(0, 12)}, no del HEAD ${commitB.slice(0, 12)}`));

    // Compilat de nou a B, sense cap sync: el mateix index.html, però la còpia porta el segell d'A.
    compila();
    const senseSync = pre();
    assert.equal(senseSync.codi, e.EIXIDA.ARBRE, senseSync.linies.join('\n'));
    assert.match(senseSync.linies.join('\n'), /✗ android: android\/app\/src\/main\/assets\/public\/segell\.json no és el de dist-natiu\/ \(l'index\.html és igual, però la còpia és d'un altre build\): npx cap sync android/);
    assert.doesNotMatch(senseSync.linies.join('\n'), /index\.html no és la de dist-natiu/, 'no nomena el fitxer que sí que casa');
    sincronitza();
    const nou = pre();
    assert.equal(nou.codi, e.EIXIDA.BE, nou.linies.join('\n'));
    /* El cas de la revisió: el preflight ja passa amb B, però l'AAB i l'arxiu que hi ha són d'A
       (signat a mà abans, o --confirma sense --compila). No es pugen. */
    const deA = new RegExp(`porta el segell d'un altre build de dist-natiu/ \\(commit ${commitA.slice(0, 12)}\\)`);
    assert.match(android.problemaDeLAab(arrel, aabA), deA);
    assert.match(android.problemaDeLAab(arrel, aabA), /^app-release\.aab /);
    assert.match(ios.problemaDeLApp(arrel, appA), deA);
    assert.equal(android.problemaDeLAab(arrel, signaAab('B')), null);
    assert.equal(ios.problemaDeLApp(arrel, arxivaApp('B')), null);
    // Un binari d'abans del segell, o una ruta sense res.
    fs.writeFileSync(path.join(carpeta, 'vell.aab'), zipDe([['base/assets/public/index.html', Buffer.from('<html>app</html>\n')]]));
    assert.match(android.problemaDeLAab(arrel, path.join(carpeta, 'vell.aab')), /no porta cap segell\.json/);
    assert.match(android.problemaDeLAab(arrel, path.join(carpeta, 'no-hi-es.aab')), /no porta cap segell\.json/);
    assert.match(ios.problemaDeLApp(arrel, path.join(carpeta, 'cap', 'App.app')), /^l'app arxivada no porta cap segell\.json/);
    // El rebut diu el commit del paquet (el del segell), sencer.
    const rebutAndroid = android.rebut({ segell: nou.segell, versio: '1.0.0', build: '7', aab: path.join(carpeta, 'no-hi-es.aab'), pujat: false });
    assert.match(rebutAndroid, new RegExp(`^  commit: ${commitB} \\(el de dist-natiu/segell\\.json, que porta l'AAB\\)$`, 'm'));
    assert.match(ios.rebut({ segell: alDia.segell, versio: '1.0.0', build: '7', ipa: null, pujat: false }), new RegExp(`^  commit: ${commitA} \\(el de dist-natiu/segell\\.json, que porta l'app arxivada\\)$`, 'm'));
    assert.match(android.rebut({ segell: null, versio: '1.0.0', build: '7', aab: path.join(carpeta, 'no-hi-es.aab'), pujat: false }), /^ {2}commit: desconegut /m);

    // Compilat amb un canvi sense cometre: encara que després es desfaça, el paquet no val.
    escriu('src/app.js', 'export const versio = "C sense cometre";\n');
    compila();
    git('checkout', '--', 'src/app.js');
    sincronitza();
    const brut = pre();
    assert.equal(brut.codi, e.EIXIDA.ARBRE, brut.linies.join('\n'));
    assert.match(brut.linies.join('\n'), /✓ git status --porcelain no diu res/);
    assert.match(brut.linies.join('\n'), /✗ dist-natiu\/ es va compilar amb canvis sense cometre/);

    // Un dist-natiu/ d'abans del segell.
    fs.rmSync(path.join(arrel, DIST, 'segell.json'));
    const senseSegell = pre();
    assert.equal(senseSegell.codi, e.EIXIDA.ARBRE, senseSegell.linies.join('\n'));
    assert.match(senseSegell.linies.join('\n'), /✗ dist-natiu\/segell\.json no hi és/);

    // El productor del build (vite.natiu.config.js, segellNatiuPlugin) fa servir segellDelArbre.
    assert.deepEqual(e.segellDelArbre(arrel, new Date('2026-10-25T10:00:00Z')), { commit: commitB, arbreNet: true, data: '2026-10-25T10:00:00.000Z' });
    escriu('src/app.js', 'brut');
    assert.equal(e.segellDelArbre(arrel).arbreNet, false);
    assert.equal(e.commitDeHead(carpeta), null, 'fora de cap repositori');
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
    delete process.env.GIT_CEILING_DIRECTORIES;
    Object.assign(process.env, deGit);
  }
});

/* BOT-A4 (revisió, 261025) · Com es trau el segell d'un AAB (un zip) sense cap eina, i com es
   contrasta el d'un binari amb el de dist-natiu/. [VERIFICAT 261025 a mà, no ací: llegixDelZip
   dona els mateixos octets que «unzip -p» per a base/assets/public/index.html i tres fitxers més
   de l'AAB de 261023, i per als zips de «zip -0», «zip -9 -z» i «zip -fd» (descriptor de dades).] */
test('botigues: llegixDelZip trau un fitxer d\'un zip, i problemaDelPaquet el contrasta amb dist-natiu/segell.json', () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-zip-'));
  try {
    const segell = Buffer.from('{"commit":"x"}\n');
    const gran = Buffer.from('0123456789'.repeat(5000));
    const aab = path.join(carpeta, 'app.aab');
    fs.writeFileSync(aab, zipDe([['BundleConfig.pb', gran, 0], ['base/assets/public/segell.json', segell], ['base/assets/public/gran.txt', gran]], 'un comentari al final'));
    assert.deepEqual(e.llegixDelZip(aab, 'base/assets/public/segell.json'), segell);
    assert.deepEqual(e.llegixDelZip(aab, 'base/assets/public/gran.txt'), gran, 'amb deflate');
    assert.deepEqual(e.llegixDelZip(aab, 'BundleConfig.pb'), gran, 'guardat');
    assert.equal(e.llegixDelZip(aab, 'base/assets/public/index.html'), null, 'no hi és');
    assert.equal(e.llegixDelZip(aab, 'base/assets/public/segell'), null, 'el nom sencer');
    assert.equal(e.llegixDelZip(path.join(carpeta, 'no-hi-es.aab'), 'x'), null);
    fs.writeFileSync(path.join(carpeta, 'text.aab'), 'no és cap zip, ni té registre final');
    assert.equal(e.llegixDelZip(path.join(carpeta, 'text.aab'), 'x'), null);
    fs.writeFileSync(path.join(carpeta, 'bzip2.aab'), zipDe([['a', segell, 12]]));
    assert.equal(e.llegixDelZip(path.join(carpeta, 'bzip2.aab'), 'a'), null, 'un mètode que no és 0 ni 8');
    fs.writeFileSync(path.join(carpeta, 'tallat.aab'), zipDe([['a', segell]]).subarray(0, 40));
    assert.equal(e.llegixDelZip(path.join(carpeta, 'tallat.aab'), 'a'), null, 'un zip tallat');

    const arrel = path.join(carpeta, 'arrel');
    assert.equal(e.problemaDelPaquet(arrel, segell, 'el paquet'), 'no hi ha dist-natiu/segell.json: npm run build:natiu');
    const delDist = `${JSON.stringify({ commit: 'a'.repeat(40), arbreNet: true, data: '2026-10-25T10:00:00.000Z' }, null, 2)}\n`;
    fs.mkdirSync(path.join(arrel, e.SEGELL[0]), { recursive: true });
    fs.writeFileSync(path.join(arrel, ...e.SEGELL), delDist);
    assert.equal(e.problemaDelPaquet(arrel, Buffer.from(delDist), 'el paquet'), null);
    assert.equal(e.problemaDelPaquet(arrel, new TextEncoder().encode(delDist), 'el paquet'), null, 'qualsevol Uint8Array');
    assert.equal(e.problemaDelPaquet(arrel, null, 'el paquet'), 'el paquet no porta cap segell.json: és d\'un build d\'abans del segell');
    assert.equal(e.problemaDelPaquet(arrel, Buffer.from(delDist.replace('10:00:00', '10:01:00')), 'el paquet'),
      'el paquet porta el segell d\'un altre build de dist-natiu/ (commit aaaaaaaaaaaa), no el de dist-natiu/segell.json', 'el mateix commit, un altre build');
    assert.notEqual(e.problemaDelPaquet(arrel, Buffer.from(delDist.trimEnd()), 'el paquet'), null, 'octet per octet');
    assert.match(e.problemaDelPaquet(arrel, Buffer.from('{'), 'el paquet'), /\(il·legible\)/);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('botigues: problemesDelSegell, pura: forma, arbre brut, HEAD desconegut o un altre commit', () => {
  const head = 'b'.repeat(40);
  const bo = { commit: head, arbreNet: true, data: '2026-10-25T10:00:00.000Z' };
  assert.deepEqual(e.problemesDelSegell(bo, head), []);
  assert.deepEqual(e.problemesDelSegell({ ...bo, commit: 'c'.repeat(64) }, 'c'.repeat(64)), [], 'un repositori SHA-256');
  for (const dolent of [null, 'text', {}, { ...bo, commit: 'abc1234' }, { ...bo, commit: head.toUpperCase() }, { ...bo, commit: undefined }, { ...bo, arbreNet: 'true' },
    { ...bo, data: undefined }, { ...bo, data: 'ahir' }, { ...bo, data: 1761386400000 }]) {
    const problemes = e.problemesDelSegell(dolent, head);
    assert.equal(problemes.length, 1, JSON.stringify(dolent));
    assert.match(problemes[0], /no hi és o no té la forma/);
  }
  assert.match(e.problemesDelSegell({ ...bo, arbreNet: false }, head).join(' '), /sense cometre \(2026-10-25T10:00:00\.000Z\)/);
  assert.deepEqual(e.problemesDelSegell(bo, null), ['git no diu quin és el commit de HEAD']);
  assert.match(e.problemesDelSegell(bo, 'a'.repeat(40)).join(' '), /és del commit bbbbbbbbbbbb, no del HEAD aaaaaaaaaaaa/);
  assert.equal(e.problemesDelSegell({ ...bo, arbreNet: false }, 'a'.repeat(40)).length, 2, 'els dos motius alhora');
  // Un build sense git: segellDelArbre escriu commit null (i arbreNet false); el motiu és este, no la forma.
  assert.deepEqual(e.problemesDelSegell({ ...bo, commit: null, arbreNet: false }, head),
    ['dist-natiu/ es va compilar sense saber de quin commit (git no hi era o no responia, 2026-10-25T10:00:00.000Z): npm run build:natiu dins del repositori']);
});

test('botigues: ús i confirmació paren abans de tocar res', async () => {
  const errada = process.stderr.write;
  process.stderr.write = () => true;
  try {
    for (const modul of [ios, android]) {
      assert.equal(await modul.main([]), e.EIXIDA.US);
      assert.equal(await modul.main(['--versio', '1.0', '--build', '7']), e.EIXIDA.US);
      assert.equal(await modul.main(['--versio', '1.0.0', '--build', '0']), e.EIXIDA.US);
      assert.equal(await modul.main(['--versio', '1.0.0', '--build', '7', '--puja']), e.EIXIDA.US);
      assert.equal(await modul.main(['--versio', '1.0.0', '--build', '7', '--confirma=1.0.0+8']), e.EIXIDA.CONFIRMACIO);
      assert.equal(await modul.main(['--versio', '1.0.0', '--build', '7', '--confirma']), e.EIXIDA.US);
    }
  } finally {
    process.stderr.write = errada;
  }
});

/* P1-08 (pla 261028_1526, §3.6.2) · La sentinella del SDK de Facebook per a iOS, sobre arrels
   temporals: un pin de Package.resolved, un Podfile.lock amb FBSDK, el connector social
   descomentat, un capacitor.config.json que no apaga facebook (o que falta amb el connector) i un
   capacitor.config.ts o .js que el tapa són roges; les línies comentades del connector (com les
   porta capgo 8.5.12), no. */
test('botigues: sdkFacebookIos troba el SDK de Facebook a ios/ i al connector social, però no als comentaris', () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-botigues-facebook-'));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(carpeta, rel)), { recursive: true });
    fs.writeFileSync(path.join(carpeta, rel), text);
  };
  try {
    assert.deepEqual(p.sdkFacebookIos(carpeta), [], 'sense ios/, sense connector i sense capacitor.config.json');
    const connector = 'node_modules/@capgo/capacitor-social-login/Package.swift';
    const resolt = 'ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved';
    escriu(connector, '    dependencies: [\n        .package(url: "https://github.com/google/GoogleSignIn-iOS.git", .upToNextMajor(from: "9.0.0")),\n'
      + '        // .package(url: "https://github.com/facebook/facebook-ios-sdk.git", .upToNextMajor(from: "18.0.3")),  // Disabled via config (compileOnly)\n'
      + '        /* .product(name: "FacebookCore", package: "facebook-ios-sdk"), */\n    ]\n');
    escriu('ios/App/CapApp-SPM/Package.swift', '.package(name: "CapgoCapacitorSocialLogin", path: "../../../node_modules/@capgo/capacitor-social-login")\n');
    escriu(resolt, JSON.stringify({ pins: [{ identity: 'googlesignin-ios', location: 'https://github.com/google/GoogleSignIn-iOS' }], version: 3 }));
    escriu('capacitor.config.json', JSON.stringify({ plugins: { SocialLogin: { providers: { google: true, apple: true, facebook: false } } } }));
    assert.deepEqual(p.sdkFacebookIos(carpeta), [], 'les línies comentades del connector no compten');
    escriu(resolt, JSON.stringify({ pins: [{ identity: 'facebook-ios-sdk', kind: 'remoteSourceControl', location: 'https://github.com/facebook/facebook-ios-sdk', state: { version: '18.0.3' } }], version: 3 }));
    escriu('ios/App/Podfile.lock', 'PODS:\n  - FBSDKCoreKit (18.0.3)\n');
    escriu(connector, '        .package(url: "https://github.com/facebook/facebook-ios-sdk.git", .upToNextMajor(from: "18.0.3")),  // descomentat pel ganxo\n');
    escriu('capacitor.config.json', JSON.stringify({ plugins: { SocialLogin: { providers: { google: true, apple: true } } } }));
    assert.deepEqual(p.sdkFacebookIos(carpeta), [resolt, 'ios/App/Podfile.lock', connector, 'capacitor.config.json'], 'sense la clau, capgo encén facebook');
    escriu('capacitor.config.json', '{ trencat');
    assert.ok(p.sdkFacebookIos(carpeta).includes('capacitor.config.json'), 'un capacitor.config.json il·legible no certifica res');
    // Capacitor llig capacitor.config.ts i .js abans que el .json: amb un dels dos, el .json ja no mana.
    escriu('capacitor.config.json', JSON.stringify({ plugins: { SocialLogin: { providers: { facebook: false } } } }));
    for (const nom of ['capacitor.config.ts', 'capacitor.config.js']) {
      escriu(nom, 'export default { plugins: { SocialLogin: { providers: { google: true } } } };\n');
      const trobats = p.sdkFacebookIos(carpeta);
      assert.ok(trobats.includes(nom) && !trobats.includes('capacitor.config.json'), `${nom} passa davant del .json: ${trobats}`);
      fs.rmSync(path.join(carpeta, nom));
    }
    // Sense cap config i amb el connector instal·lat, capgo encén facebook.
    fs.rmSync(path.join(carpeta, 'capacitor.config.json'));
    assert.deepEqual(p.sdkFacebookIos(carpeta).slice(-1), ['capacitor.config.json'], 'sense capacitor.config.json, capgo encén facebook');
    // Sota «Arbre» i només amb iOS; el preflight no imprimix cap valor ni cap contingut dels fitxers.
    const env = { SDP_BOTIGUES_ENV: path.join(carpeta, 'no-hi-es.env') };
    const ambIos = p.preflight({ arrel: carpeta, plataformes: ['ios'], env, consultes: fingides(null) }).linies.join('\n');
    assert.match(ambIos, /Arbre[\s\S]*✗ SDK de Facebook a ios\/App\/App\.xcodeproj\/project\.xcworkspace\/xcshareddata\/swiftpm\/Package\.resolved, ios\/App\/Podfile\.lock, /);
    assert.ok(!ambIos.includes('18.0.3'));
    const nomesAndroid = p.preflight({ arrel: carpeta, plataformes: ['android'], env, consultes: fingides(null) }).linies.join('\n');
    assert.doesNotMatch(nomesAndroid, /Facebook/);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('botigues: l\'arbre real no porta el SDK de Facebook a ios/ ni al connector social', { skip: SENSE_REPOSITORI }, () => {
  assert.deepEqual(p.sdkFacebookIos(ARREL), []);
  assert.equal(p.SDK_FACEBOOK.test('.product(name: "FacebookLogin", package: "facebook-ios-sdk")'), true);
  assert.equal(p.SDK_FACEBOOK.test('.product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")'), false);
});

/* P0-23 (BOT-A2; revisió 261025) · L'app diu al node VERSIO_CLIENT_NATIU de src/data/contracte.js,
   no el número de la botiga: un build que ixquera amb la constant d'un build d'abans es
   bloquejaria ell mateix quan el mínim del node pujara al seu número. A iOS el --build només viu a
   la línia d'ordres; per això les dues pujades el comparen amb la constant i paren abans del
   preflight, sense escriure res a l'eixida estàndard. Només en sec (sense --compila ni
   --confirma): si la guarda es perdera, la prova no ha de poder arxivar ni pujar res. */
test('botigues: el --build ha de ser VERSIO_CLIENT_NATIU, i si no ho és cap pujada passa del primer pas', async () => {
  const { VERSIO_CLIENT_NATIU, problemaDeVersioClient } = versioClient;
  assert.ok(Number.isSafeInteger(VERSIO_CLIENT_NATIU) && VERSIO_CLIENT_NATIU >= 2);
  assert.equal(problemaDeVersioClient(String(VERSIO_CLIENT_NATIU)), null);
  assert.equal(problemaDeVersioClient('7', 7), null);
  for (const [build, versio] of [['3', 2], ['1', 2], ['12', 1]]) {
    assert.match(problemaDeVersioClient(build, versio), new RegExp(`^el --build ${build} no és VERSIO_CLIENT_NATIU \\(${versio}, src/data/contracte\\.js\\)`));
  }
  const [errada, eixida] = [process.stderr.write, process.stdout.write];
  let dit = '';
  let escrit = '';
  process.stderr.write = (text) => { dit += text; return true; };
  process.stdout.write = (text) => { escrit += text; return true; };
  try {
    const altre = String(VERSIO_CLIENT_NATIU + 1);
    for (const modul of [ios, android]) {
      assert.equal(await modul.main(['--versio', '1.0.0', '--build', altre]), e.EIXIDA.ARBRE);
    }
  } finally {
    process.stderr.write = errada;
    process.stdout.write = eixida;
  }
  assert.equal(escrit, '', 'cap preflight ni cap pla');
  assert.equal(dit.match(/✗ el --build \d+ no és VERSIO_CLIENT_NATIU/g)?.length, 2);
});

/* R24 botigues · D2 (RC-7) · L'escaneig de l'AAB amb un zip de veres (el lector de sempre,
   llegixDelZip): els dex del mòdul base, guardats o amb deflate, i cap classe de com.facebook. */
test('botigues: dexDeLAab llig els dex d\'un AAB de veres i dexAmbFacebook hi troba Lcom/facebook/', () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r24-aab-'));
  try {
    const aab = path.join(carpeta, 'app-release.aab');
    fs.writeFileSync(aab, zipDe([
      ['BundleConfig.pb', Buffer.from('config'), 0],
      ['base/dex/classes.dex', Buffer.from('dex\n035\0Landroidx/credentials/CredentialManager;'), 8],
      ['base/dex/classes2.dex', Buffer.from('dex\n035\0Lcom/facebook/login/LoginManager;'), 0],
      ['base/assets/public/index.html', Buffer.from('<html>app</html>\n'), 8]
    ]));
    const dexs = android.dexDeLAab(aab);
    assert.deepEqual(dexs.map((d) => d.nom), ['base/dex/classes.dex', 'base/dex/classes2.dex']);
    assert.deepEqual(android.dexAmbFacebook(dexs), ['base/dex/classes2.dex']);
    const net = path.join(carpeta, 'net.aab');
    fs.writeFileSync(net, zipDe([['base/dex/classes.dex', Buffer.from('dex\n035\0Lee/forgr/capacitor/social/login/FacebookProvider;'), 8]]));
    assert.deepEqual(android.dexAmbFacebook(android.dexDeLAab(net)), [], 'el stub del connector (sense com.facebook) no compta');
    assert.deepEqual(android.dexDeLAab(path.join(carpeta, 'no-hi-es.aab')), []);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('botigues: Onada R26 · seguretatBotigues i liniesSeguretatBotigues certifiquen l\'arbre real i rebutgen relaxacions d\'ATS, cleartext, allowBackup, associacio-apps.json malformat o .well-known estàtic', () => {
  const real = p.seguretatBotigues(ARREL);
  assert.equal(real.associacioPresent, true);
  assert.equal(real.ios.present, true);
  assert.equal(real.ios.atsSegur, true);
  assert.equal(real.ios.privacitatSenseRastreig, true);
  assert.equal(real.ios.privacitatCa921, true);
  assert.equal(real.ios.aasaEstatica, false);
  assert.equal(real.ios.associacioValida, true);
  assert.equal(real.android.present, true);
  assert.equal(real.android.allowBackupFals, true);
  assert.equal(real.android.cleartextManifestFals, true);
  assert.equal(real.android.referenciaNetworkConfig, true);
  assert.equal(real.android.networkConfigSegura, true);
  assert.equal(real.android.assetlinksEstatic, false);
  assert.equal(real.android.associacioValida, true);
  /* Onada R30 · NAT-04 · L'app real lleva els quatre permisos d'identitat i cap no queda declarat. */
  assert.deepEqual(real.android.identitat.permisos.map(({ nom, llevat, queden }) => [nom, llevat, queden]),
    p.PERMISOS_D_IDENTITAT.map((nom) => [nom, true, []]));

  const intern = p.liniesSeguretatBotigues(real, { plataformes: ['ios', 'android'], produccio: false });
  assert.deepEqual(intern.mal, []);
  /* iOS, Android (R26) i Android (R30 · NAT-04). */
  assert.equal(intern.linies.filter((l) => l.startsWith('  ✓ ')).length, 3);
  assert.ok(intern.linies.some((l) => l.startsWith('  ✓ Android: android/app/src/main/AndroidManifest.xml lleva USE_BIOMETRIC, USE_FINGERPRINT, USE_CREDENTIALS i GET_ACCOUNTS amb tools:node="remove"')));

  const prod = p.liniesSeguretatBotigues(real, { plataformes: ['ios', 'android'], produccio: true });
  assert.deepEqual(prod.mal, []);
  assert.ok(prod.linies.some((l) => l.includes('ios.team_ids buit')));
  assert.ok(prod.linies.some((l) => l.includes('android.sha256_cert_fingerprints buit')));

  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r26-seguretat-'));
  try {
    // Arbre sintètic sense fitxers natius: no genera cap línia ni error.
    assert.deepEqual(p.liniesSeguretatBotigues(p.seguretatBotigues(carpeta), { plataformes: ['ios', 'android'], produccio: true }), { linies: [], mal: [] });

    // Regressió iOS + Android: ATS relaxat, allowBackup="true", cleartextTrafficPermitted="true", .well-known estàtic prohibit i associacio-apps.json invàlid.
    fs.mkdirSync(path.join(carpeta, 'ios', 'App', 'App'), { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'ios', 'App', 'App', 'Info.plist'),
      '<plist><dict><key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><true/></dict></dict></plist>');
    fs.mkdirSync(path.join(carpeta, 'android', 'app', 'src', 'main', 'res', 'xml'), { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
      '<manifest><application android:allowBackup="true" android:usesCleartextTraffic="true"></application></manifest>');
    fs.writeFileSync(path.join(carpeta, 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml'),
      '<network-security-config><base-config cleartextTrafficPermitted="true" /></network-security-config>');
    fs.mkdirSync(path.join(carpeta, 'public', '.well-known'), { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'public', '.well-known', 'apple-app-site-association'), '{}');
    fs.writeFileSync(path.join(carpeta, 'public', '.well-known', 'assetlinks.json'), '[]');
    fs.mkdirSync(path.join(carpeta, 'scripts', 'botigues'), { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'scripts', 'botigues', 'associacio-apps.json'), '{"esquema":"trencat"}');

    const trencat = p.liniesSeguretatBotigues(p.seguretatBotigues(carpeta), { plataformes: ['ios', 'android'], produccio: true });
    /* Les 8 d'R26 i, des d'Onada R30 (NAT-04), una més: el manifest no lleva cap permís d'identitat. */
    assert.equal(trencat.mal.length, 9);
    assert.match(trencat.mal.at(-1), /^Android: android\/app\/src\/main\/AndroidManifest\.xml no lleva USE_BIOMETRIC, USE_FINGERPRINT, USE_CREDENTIALS i GET_ACCOUNTS amb tools:node="remove"/);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

/* Onada R26 (arbitratge de Claude) · La línia «✓ NSAppTransportSecurity estricte / network_security_config»
   ha de dir la veritat: el kit només mirava que les dues claus d'ATS foren false i que no hi haguera
   src="user", i deixava passar excepcions d'ATS, àncores @raw i una associacio-apps.json que el build
   web rebutjaria. Arbres sintètics fets amb els fitxers reals del repositori, cada un amb UNA relaxació. */
test('botigues: Onada R26 · seguretatBotigues rebutja excepcions d’ATS, àncores que no són del sistema i una associacio-apps.json que el build web no acceptaria', () => {
  const REALS = [
    ['ios', 'App', 'App', 'Info.plist'],
    ['ios', 'App', 'App', 'PrivacyInfo.xcprivacy'],
    ['android', 'app', 'src', 'main', 'AndroidManifest.xml'],
    ['android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml'],
    ['scripts', 'botigues', 'associacio-apps.json']
  ];
  const carpetes = [];
  const arbre = (rel, muta) => {
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r26-relaxacio-'));
    carpetes.push(carpeta);
    for (const parts of REALS) {
      fs.mkdirSync(path.join(carpeta, ...parts.slice(0, -1)), { recursive: true });
      fs.copyFileSync(path.join(ARREL, ...parts), path.join(carpeta, ...parts));
    }
    if (rel) {
      const fitxer = path.join(carpeta, ...rel);
      fs.writeFileSync(fitxer, muta(fs.readFileSync(fitxer, 'utf8')));
    }
    return p.seguretatBotigues(carpeta);
  };
  const INFO = ['ios', 'App', 'App', 'Info.plist'];
  const NSC = ['android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml'];
  const ASSOCIACIO = ['scripts', 'botigues', 'associacio-apps.json'];
  const FINAL_ATS = /(<key>NSAllowsArbitraryLoadsInWebContent<\/key>\s*<false\/>)/;
  const ambAts = (afegit) => (text) => {
    assert.match(text, FINAL_ATS);
    return text.replace(FINAL_ATS, `$1\n\t\t${afegit}`);
  };
  const json = (canvi) => (text) => { const cfg = JSON.parse(text); canvi(cfg); return JSON.stringify(cfg, null, 2); };
  try {
    const net = arbre(null);
    assert.equal(net.ios.atsSegur, true);
    assert.equal(net.android.networkConfigSegura, true);
    assert.equal(net.ios.associacioValida, true);
    assert.equal(net.android.associacioValida, true);
    assert.deepEqual(p.liniesSeguretatBotigues(net, { plataformes: ['ios', 'android'], produccio: false }).mal, []);

    const ats = {
      'NSExceptionDomains amb HTTP en clar': ambAts('<key>NSExceptionDomains</key>\n\t\t<dict>\n\t\t\t<key>exemple.invalid</key>\n\t\t\t<dict>\n\t\t\t\t<key>NSExceptionAllowsInsecureHTTPLoads</key>\n\t\t\t\t<true/>\n\t\t\t</dict>\n\t\t</dict>'),
      'NSAllowsLocalNetworking': ambAts('<key>NSAllowsLocalNetworking</key>\n\t\t<true/>'),
      'NSAllowsArbitraryLoadsForMedia': ambAts('<key>NSAllowsArbitraryLoadsForMedia</key>\n\t\t<true/>'),
      'un segon NSAppTransportSecurity': (text) => text.replace('</dict>\n</plist>', '\t<key>NSAppTransportSecurity</key>\n\t<dict>\n\t\t<key>NSAllowsLocalNetworking</key>\n\t\t<true/>\n\t</dict>\n</dict>\n</plist>')
    };
    for (const [nom, muta] of Object.entries(ats)) {
      const estat = arbre(INFO, muta);
      assert.equal(estat.ios.atsSegur, false, nom);
      assert.ok(p.liniesSeguretatBotigues(estat, { plataformes: ['ios'], produccio: false }).mal.length > 0, nom);
    }

    const ancores = {
      'una CA pròpia (@raw) per a un domini': (text) => text.replace('</network-security-config>',
        '    <domain-config>\n        <domain includeSubdomains="true">exemple.invalid</domain>\n        <trust-anchors>\n            <certificates src="@raw/ca_propia" />\n        </trust-anchors>\n    </domain-config>\n</network-security-config>'),
      'CAs addicionals a la base': (text) => text.replace('<certificates src="system" />', '<certificates src="@raw/extracas" />\n            <certificates src="system" />')
    };
    for (const [nom, muta] of Object.entries(ancores)) {
      const estat = arbre(NSC, muta);
      assert.equal(estat.android.networkConfigSegura, false, nom);
      assert.ok(p.liniesSeguretatBotigues(estat, { plataformes: ['android'], produccio: false }).mal.length > 0, nom);
    }

    const associacio = {
      'ios.camins amb «..»': [json((cfg) => { cfg.ios.camins = ['/mur/../privat']; }), 'ios'],
      'ios.team_ids repetit': [json((cfg) => { cfg.ios.team_ids = ['9A8B7C6D5E', '9A8B7C6D5E']; }), 'ios'],
      'ios.origens en http': [json((cfg) => { cfg.ios.origens = ['http://socdepoble.org']; }), 'ios'],
      'android.origens en http': [json((cfg) => { cfg.android.origens = ['http://socdepoble.org']; }), 'android'],
      'clau desconeguda': [json((cfg) => { cfg.android.extra = true; }), 'android']
    };
    for (const [nom, [muta, plataforma]] of Object.entries(associacio)) {
      const estat = arbre(ASSOCIACIO, muta);
      assert.equal(estat[plataforma].associacioValida, false, nom);
      assert.ok(p.liniesSeguretatBotigues(estat, { plataformes: [plataforma], produccio: false }).mal.length > 0, nom);
    }
  } finally {
    for (const carpeta of carpetes) fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

/* Onada R30 · NAT-04 (pla R30 §4, decisió tancada per MarIA) · Cap permís d'identitat ni de biometria a
   Android. Arbres sintètics a mkdtemp amb el manifest real de l'app i un connector fingit que declara
   USE_CREDENTIALS com @capgo/capacitor-social-login: el que queda declarat sense llevar i el que l'app no
   lleva (els AAR no es veuen) són ✗; el micròfon de les notes de veu no hi entra. */
test('botigues: Onada R30 · NAT-04 · permisosDIdentitatAndroid i liniesPermisosDIdentitat paren tot permís d\'identitat o de biometria que quede declarat', () => {
  const MANIFEST = ['android', 'app', 'src', 'main', 'AndroidManifest.xml'];
  const SOCIAL = 'node_modules/@capgo/capacitor-social-login/android/src/main/AndroidManifest.xml';
  const real = fs.readFileSync(path.join(ARREL, ...MANIFEST), 'utf8');
  const LLEVA = /\n[ \t]*<uses-permission android:name="android\.permission\.(?:USE_BIOMETRIC|USE_FINGERPRINT|USE_CREDENTIALS|GET_ACCOUNTS)" tools:node="remove" \/>/g;
  assert.equal(real.match(LLEVA)?.length, 4, 'el manifest real lleva els quatre, un per línia');
  assert.deepEqual(p.PERMISOS_D_IDENTITAT, ['android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT', 'android.permission.USE_CREDENTIALS', 'android.permission.GET_ACCOUNTS']);
  for (const nom of ['INTERNET', 'POST_NOTIFICATIONS', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS']) assert.ok(!p.PERMISOS_D_IDENTITAT.includes(`android.permission.${nom}`), nom);
  const carpetes = [];
  const arbre = ({ manifest = real, social = '<manifest><uses-permission android:name="android.permission.USE_CREDENTIALS" />\n<uses-permission android:name="android.permission.INTERNET"/></manifest>' } = {}) => {
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r30-nat04-'));
    carpetes.push(carpeta);
    const escriu = (rel, text) => {
      fs.mkdirSync(path.dirname(path.join(carpeta, rel)), { recursive: true });
      fs.writeFileSync(path.join(carpeta, rel), text);
    };
    if (manifest !== null) escriu(MANIFEST.join('/'), manifest);
    escriu('android/capacitor.settings.gradle', "include ':capgo-capacitor-social-login'\nproject(':capgo-capacitor-social-login').projectDir = new File('../node_modules/@capgo/capacitor-social-login/android')\n"
      + "// project(':comentat').projectDir = new File('../node_modules/comentat/android')\n");
    if (social !== null) escriu(SOCIAL, social);
    escriu('node_modules/comentat/android/src/main/AndroidManifest.xml', '<manifest><uses-permission android:name="android.permission.GET_ACCOUNTS"/></manifest>');
    return carpeta;
  };
  const mira = (carpeta) => p.liniesPermisosDIdentitat(p.permisosDIdentitatAndroid(carpeta));
  try {
    /* Net: el connector declara USE_CREDENTIALS, l'app el lleva, i el connector comentat no compta. */
    const net = p.permisosDIdentitatAndroid(arbre());
    assert.equal(net.connectors, 1);
    assert.deepEqual(net.permisos.map(({ llevat, queden }) => [llevat, queden.length]), [[true, 0], [true, 0], [true, 0], [true, 0]]);
    const liniesNet = p.liniesPermisosDIdentitat(net);
    assert.deepEqual(liniesNet.mal, []);
    assert.deepEqual(liniesNet.linies, ['  ✓ Android: android/app/src/main/AndroidManifest.xml lleva USE_BIOMETRIC, USE_FINGERPRINT, USE_CREDENTIALS i GET_ACCOUNTS amb tools:node="remove", i ni l\'app ni l\'únic manifest de connectors no en deixen cap sense llevar (NAT-04: cap permís d\'identitat ni de biometria)']);

    /* El manifest d'abans d'R30 (sense les quatre línies): USE_CREDENTIALS queda declarat pel connector, i els altres tres no es lleven. */
    const abans = mira(arbre({ manifest: real.replace(LLEVA, '') }));
    assert.deepEqual(abans.mal, [
      'Android: USE_CREDENTIALS queda declarat a node_modules/@capgo/capacitor-social-login/android/src/main/AndroidManifest.xml: NAT-04 (pla R30 §4) no admet cap permís d\'identitat ni de biometria; posa <uses-permission android:name="android.permission.USE_CREDENTIALS" tools:node="remove" /> a android/app/src/main/AndroidManifest.xml',
      'Android: android/app/src/main/AndroidManifest.xml no lleva USE_BIOMETRIC, USE_FINGERPRINT i GET_ACCOUNTS amb tools:node="remove": cap manifest de l\'arbre no els declara, però una biblioteca (AAR) els pot afegir al manifest fusionat sense que el preflight ho veja (androidx.biometric, que porta androidx.credentials del connector social, hi afig USE_BIOMETRIC i USE_FINGERPRINT); NAT-04, pla R30 §4'
    ]);
    assert.deepEqual(abans.linies, abans.mal.map((text) => `  ✗ ${text}`), 'cap ✓ quan hi ha un ✗');

    /* Una sola línia de llevar comentada ja no compta; el singular del missatge. */
    const comentat = mira(arbre({ manifest: real.replace(/(<uses-permission android:name="android\.permission\.GET_ACCOUNTS" tools:node="remove" \/>)/, '<!-- $1 -->') }));
    assert.deepEqual(comentat.mal, ['Android: android/app/src/main/AndroidManifest.xml no lleva GET_ACCOUNTS amb tools:node="remove": cap manifest de l\'arbre no el declara, però una biblioteca (AAR) el pot afegir al manifest fusionat sense que el preflight ho veja (androidx.biometric, que porta androidx.credentials del connector social, hi afig USE_BIOMETRIC i USE_FINGERPRINT); NAT-04, pla R30 §4']);

    /* L'app que el declara ella mateixa (amb cometes simples) queda declarada encara que també el lleve. */
    const propi = mira(arbre({ manifest: real.replace('</manifest>', "    <uses-permission android:name = 'android.permission.USE_BIOMETRIC' />\n</manifest>") }));
    assert.deepEqual(propi.mal, ['Android: USE_BIOMETRIC queda declarat a android/app/src/main/AndroidManifest.xml: NAT-04 (pla R30 §4) no admet cap permís d\'identitat ni de biometria; lleva\'n la declaració de android/app/src/main/AndroidManifest.xml']);

    /* Un <uses-permission-sdk-23> d'un connector no el lleva el <uses-permission> de l'app: cal un element del mateix tipus. */
    const sdk23 = '<manifest><uses-permission-sdk-23 android:name=\'android.permission.USE_FINGERPRINT\'/></manifest>';
    assert.deepEqual(mira(arbre({ social: sdk23 })).mal, ['Android: USE_FINGERPRINT queda declarat a node_modules/@capgo/capacitor-social-login/android/src/main/AndroidManifest.xml (uses-permission-sdk-23): NAT-04 (pla R30 §4) no admet cap permís d\'identitat ni de biometria; posa <uses-permission-sdk-23 android:name="android.permission.USE_FINGERPRINT" tools:node="remove" /> a android/app/src/main/AndroidManifest.xml']);
    const llevaSdk23 = real.replace('</manifest>', '    <uses-permission-sdk-23 android:name="android.permission.USE_FINGERPRINT" tools:node="remove" />\n</manifest>');
    assert.deepEqual(mira(arbre({ manifest: llevaSdk23, social: sdk23 })).mal, []);

    /* Un connector que lleva ell mateix el permís no el declara; sense cap connector, el ✓ ho diu. */
    assert.deepEqual(mira(arbre({ social: '<manifest xmlns:tools="t"><uses-permission android:name="android.permission.USE_CREDENTIALS" tools:node="remove"/></manifest>' })).mal, []);
    const senseConnectors = arbre({ social: null });
    fs.rmSync(path.join(senseConnectors, 'android', 'capacitor.settings.gradle'));
    assert.match(mira(senseConnectors).linies[0], /^ {2}✓ .*i l'app no en deixa cap sense llevar \(cap manifest de connectors a android\/capacitor\.settings\.gradle\)/);

    /* Sense manifest de l'app (arbre sintètic): cap línia. Dins de la família R26, el ✗ fa fallar la seguretat d'Android. */
    assert.equal(p.permisosDIdentitatAndroid(arbre({ manifest: null })), null);
    assert.deepEqual(p.liniesPermisosDIdentitat(null), { linies: [], mal: [] });
    const familia = p.liniesSeguretatBotigues(p.seguretatBotigues(arbre({ manifest: real.replace(LLEVA, '') })), { plataformes: ['android'], produccio: false });
    assert.equal(familia.mal.filter((text) => text.includes('NAT-04')).length, 2);
    assert.deepEqual(p.liniesSeguretatBotigues(p.seguretatBotigues(arbre({ manifest: real.replace(LLEVA, '') })), { plataformes: ['ios'], produccio: false }).mal, [], 'només amb Android');
  } finally {
    for (const carpeta of carpetes) fs.rmSync(carpeta, { recursive: true, force: true });
  }
});
