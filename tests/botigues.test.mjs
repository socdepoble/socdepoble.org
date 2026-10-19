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
   repositori, git de només lectura, processos fills de Node, JDK fingits (scripts /bin/sh) i, en
   macOS, «/usr/libexec/java_home -v 21». */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as e from '../scripts/botigues/entorn.mjs';
import * as p from '../scripts/botigues/preflight.mjs';
import * as ios from '../scripts/botigues/puja-ios.mjs';
import * as android from '../scripts/botigues/puja-android.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('botigues: peces pures (fitxer d\'entorn, prohibides, màscares, empremtes, opcions, arguments)', () => {
  const { valors, errors } = e.analitzaEntorn('# comentari\nexport SDP_APP_ID=org.socdepoble.app\nSDP_ASC_KEY_ID="ABC123DEFG" # nota\nSDP_X=\'a b\'\nSDP_Y=valor # inline\nSDP_APP_ID=valorduplicat\nmal\nSDP_Z="valorobert\n\n');
  assert.deepEqual(valors, { SDP_APP_ID: 'org.socdepoble.app', SDP_ASC_KEY_ID: 'ABC123DEFG', SDP_X: 'a b', SDP_Y: 'valor' });
  assert.deepEqual(errors.map((x) => [x.linia, x.nom ?? null]), [[6, 'SDP_APP_ID'], [7, null], [8, 'SDP_Z']]);
  assert.ok(!JSON.stringify(errors).includes('valorduplicat') && !JSON.stringify(errors).includes('valorobert'), 'cap valor als errors');
  // Un identificador només es canvia sencer; una contrasenya, on siga.
  const mixt = { SDP_ANDROID_KEY_ALIAS: 'upload', SDP_ANDROID_KEY_PASSWORD: 'secreta1', SDP_APP_ID: 'org.socdepoble.app' };
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

test('botigues: git ignora .env.botigues.local i no ignora un fitxer d\'entorn d\'un altre nom', () => {
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
    SDP_ANDROID_KEYSTORE_PATH: '/claus/upload.jks', SDP_ANDROID_KEY_ALIAS: 'upload', SDP_ANDROID_KEYSTORE_PASSWORD: 'contrasenya-magatzem', SDP_ANDROID_KEY_PASSWORD: 'contrasenya-clau' };
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
  for (const secret of ['contrasenya-magatzem', 'contrasenya-clau']) assert.ok(!args.includes(secret), 'cap contrasenya a la línia d\'ordres');
  assert.equal(pa.entornDeSignatura().SDP_ANDROID_KEYSTORE_PASSWORD, 'contrasenya-magatzem');
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
  // La plantilla que nomena el missatge és al laboratori: si el laboratori es mou, PLANTILLA_DE_L_ENTORN i REBUTS es mouen amb ell.
  assert.ok(fs.existsSync(path.join(ARREL, e.PLANTILLA_DE_L_ENTORN)), e.PLANTILLA_DE_L_ENTORN);
  assert.ok(fs.existsSync(path.dirname(path.join(ARREL, e.REBUTS))), path.dirname(e.REBUTS));
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
