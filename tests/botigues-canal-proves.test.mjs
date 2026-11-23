/* tests/botigues-canal-proves.test.mjs — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026:
   «actualització automàtica real als mòbils de prova»). El canal de proves del manifest públic
   (public/.well-known/ard.json): testflightIosBuild i latestBuild, que escriu
   scripts/botigues/publica-tot.mjs --sincronitza-proves amb les garanties de --sincronitza-ard (la
   versió de package.json, cap build per damunt de VERSIO_CLIENT_NATIU, mai baixa sense
   --corregeix-ard) i només amb l'evidència del registre de pujades de puja-ios.mjs.
   Onada v1.2.16 (ordre del Mestre 261121: ZERO APK fora de botiga) · L'anunci de l'APK directe
   (apkDirectBuild + apkSha256) es refusa i els anuncis heretats es retiren en escriure.
   v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · Fins a l'inici formal de la ronda amb Beta Testers,
   --sincronitza-proves es refusa i el pla d'iOS no proposa el pas de TestFlight: els casos que escriuen o que
   llegeixen el pas obrin la ronda amb SDP_RONDA_BETA_TESTERS=1, i un cas propi prova el refús sense la variable.
   v1.2.23 · L8-09 (Gauntlet R1) · La variable va a l'entorn que reben main() i resumOmnicanal() (ambRonda), no a
   process.env: un cas propi prova que el process.env obert no obri un entorn injectat tancat, ni al revés.
   Ha d'anar d'acord amb RONDA_BETA_TESTERS_OBERTA de src/config/ardSenseTestFlight.v1223.seguretat.test.js.
   Cap xarxa, cap eina real, cap fitxer del repositori: tot en mkdtemp. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as e from '../scripts/botigues/entorn.mjs';
import * as publica from '../scripts/botigues/publica-tot.mjs';
import { VERSIO_CLIENT_NATIU } from '../scripts/botigues/versio-client.mjs';
import { llegixCanalsManifest } from '../src/config/manifestVersio.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENSE_REPOSITORI = !fs.existsSync(path.join(ARREL, '.git')) && 'còpia sense .git: main() passa per l\'arrel del repositori';
const TEMPORAL = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-v127-proves-')));
process.on('exit', () => fs.rmSync(TEMPORAL, { recursive: true, force: true }));
const VERSIO = publica.versioDelPaquet(ARREL);
const MAXIM = Number(VERSIO_CLIENT_NATIU);
const SHA_A = 'a'.repeat(64);
const BASE = `${JSON.stringify({ version: '1.0.0', androidBuild: 1, iosBuild: 1, entries: [{ identifier: 'x', version: '1.0.0' }] }, null, 2)}\n`;
const proves = (text, opcions) => publica.sincronitzaManifestProves(text, { maximBuild: 20, ...opcions });

/* La pantalla de main, sencera. */
async function ambPantalla(fes) {
  const [eixida, errada] = [process.stdout.write, process.stderr.write];
  let vist = '';
  const captura = (original, flux) => (tros, ...resta) => {
    if (typeof tros !== 'string') return original.call(flux, tros, ...resta);
    vist += tros;
    return true;
  };
  process.stdout.write = captura(eixida, process.stdout);
  process.stderr.write = captura(errada, process.stderr);
  try {
    const codi = await fes();
    return { codi, vist };
  } finally {
    process.stdout.write = eixida;
    process.stderr.write = errada;
  }
}

/* v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · L'entorn amb SDP_RONDA_BETA_TESTERS=valor (valor null:
   sense la variable). v1.2.23 · L8-09 (Gauntlet R1) · Un entorn nou per a main() i resumOmnicanal(): process.env no es
   toca, i la ronda és la de l'entorn que reben. */
function ambRonda(env, valor = '1') {
  const sense = { ...env };
  delete sense.SDP_RONDA_BETA_TESTERS;
  return valor === null ? sense : { ...sense, SDP_RONDA_BETA_TESTERS: valor };
}

/* v1.2.23 · L8-09 (Gauntlet R1) · Només per al cas que prova que process.env no mana: el posa durant la prova i el
   torna com estava ABANS de la primera crida. */
const rondaOriginal = new WeakMap();
function rondaDelProces(t, valor) {
  if (!rondaOriginal.has(t)) {
    const abans = process.env.SDP_RONDA_BETA_TESTERS;
    rondaOriginal.set(t, abans);
    t.after(() => {
      if (abans === undefined) delete process.env.SDP_RONDA_BETA_TESTERS;
      else process.env.SDP_RONDA_BETA_TESTERS = abans;
    });
  }
  if (valor === null) delete process.env.SDP_RONDA_BETA_TESTERS;
  else process.env.SDP_RONDA_BETA_TESTERS = valor;
}

test('v1.2.7 · sincronitzaManifestProves: TestFlight i latestBuild, sense tocar les botigues públiques; v1.2.16 · cap APK', () => {
  const tf = JSON.parse(proves(BASE, { versio: '1.0.1', testflightIosBuild: 12 }));
  assert.deepEqual(Object.keys(tf), ['version', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'latestBuild', 'entries']);
  assert.deepEqual([tf.version, tf.androidBuild, tf.iosBuild, tf.testflightIosBuild, tf.latestBuild], ['1.0.1', 1, 1, 12, 12]);
  assert.equal(tf.entries[0].version, '1.0.1', 'cada entrada declara la versió del manifest');
  // El lector del client (config/manifestVersio.js) en llig el mateix, sense cap APK.
  assert.deepEqual(llegixCanalsManifest(tf), {
    versio: '1.0.1', androidBuild: 1, iosBuild: 1, testflightIosBuild: 12, apkDirectBuild: null, apkSha256: null, latestBuild: 12
  });
  // Idempotent.
  const text = `${JSON.stringify(tf, null, 2)}\n`;
  assert.equal(proves(text, { versio: '1.0.1', testflightIosBuild: 12 }), text);
  // --sincronitza-ard (les botigues públiques) conserva el canal de proves i recalcula latestBuild.
  const public1 = JSON.parse(publica.sincronitzaManifestVersio(text, { versio: '1.0.1', androidBuild: 14, maximBuild: 20 }));
  assert.deepEqual([public1.testflightIosBuild, public1.androidBuild, public1.latestBuild], [12, 14, 14]);
  /* v1.2.16 · ZERO APK fora de botiga: un anunci heretat (v1.2.7-v1.2.15) es retira en la pròxima
     escriptura, de les dues ordres, i latestBuild ja no el compta. */
  const heretat = `${JSON.stringify({ ...tf, apkDirectBuild: 13, apkSha256: SHA_A, latestBuild: 13 }, null, 2)}\n`;
  for (const escrit of [proves(heretat, { versio: '1.0.1', testflightIosBuild: 12 }), publica.sincronitzaManifestVersio(heretat, { versio: '1.0.1', androidBuild: 2, maximBuild: 20 })]) {
    const dades = JSON.parse(escrit);
    assert.deepEqual([Object.hasOwn(dades, 'apkDirectBuild'), Object.hasOwn(dades, 'apkSha256'), dades.latestBuild], [false, false, 12]);
  }
  for (const apk of [{ apkDirectBuild: 13, apkSha256: SHA_A }, { apkDirectBuild: 13 }, { apkSha256: SHA_A }]) {
    assert.throws(() => proves(BASE, { versio: '1.0.1', testflightIosBuild: 12, ...apk }), /ZERO APK fora de botiga/, JSON.stringify(apk));
  }
});

test('v1.2.7 · sincronitzaManifestProves: les guardes de --sincronitza-ard', () => {
  const tf = proves(BASE, { versio: '1.0.0', testflightIosBuild: 13 });
  assert.throws(() => proves(BASE, { versio: '1.0.0' }), /cal testflightIosBuild/);
  assert.throws(() => proves(BASE, { versio: '1.0', testflightIosBuild: 2 }), /X\.Y\.Z/);
  assert.throws(() => proves(BASE, { versio: '1.0.0', testflightIosBuild: 0 }), /testflightIosBuild ha de ser un enter positiu/);
  assert.throws(() => proves(BASE, { versio: '1.0.0', testflightIosBuild: 21 }), /testflightIosBuild 21 passa de VERSIO_CLIENT_NATIU \(20/);
  assert.throws(() => publica.sincronitzaManifestProves(BASE, { versio: '1.0.0', testflightIosBuild: MAXIM + 1 }), /passa de VERSIO_CLIENT_NATIU/, 'el sostre per defecte és VERSIO_CLIENT_NATIU');
  // Mai baixa: ni la versió, ni el build, llevat de --corregeix-ard.
  assert.throws(() => proves(tf, { versio: '0.9.9', testflightIosBuild: 14 }), /no es baixa a 0\.9\.9 .*--corregeix-ard/);
  assert.throws(() => proves(tf, { versio: '1.0.0', testflightIosBuild: 12 }), /ja publica testflightIosBuild 13: no es baixa a 12/);
  const corregit = JSON.parse(proves(tf, { versio: '1.0.0', testflightIosBuild: 12, corregeix: true }));
  assert.deepEqual([corregit.testflightIosBuild, corregit.latestBuild], [12, 12]);
  assert.throws(() => proves('{"x":1}', { versio: '1.0.0', testflightIosBuild: 2 }), /no té «entries»/);
  assert.throws(() => proves('no', { versio: '1.0.0', testflightIosBuild: 2 }), /no és JSON/);
});

test('v1.2.7 · escriuManifestProves: public/ i la còpia de dist/, totes dues o cap, i només amb la versió de package.json', () => {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'escriu-'));
  const cami = path.join(carpeta, 'public-ard.json');
  const camiDist = path.join(carpeta, 'dist-ard.json');
  fs.writeFileSync(cami, BASE);
  fs.writeFileSync(camiDist, BASE);
  const escriu = (mes = {}) => publica.escriuManifestProves({ arrel: carpeta, versio: '1.0.1', versioPaquet: '1.0.1', maximBuild: 20, cami, camiDist, ...mes });
  assert.deepEqual(escriu({ testflightIosBuild: 5, sec: true }), { codi: e.EIXIDA.BE, canviat: true, escrits: [] });
  assert.equal(fs.readFileSync(cami, 'utf8'), BASE, 'en sec no escriu res');
  const altra = publica.escriuManifestProves({ arrel: carpeta, versio: '1.0.2', versioPaquet: '1.0.1', cami, camiDist, testflightIosBuild: 5 });
  assert.equal(altra.codi, e.EIXIDA.ARBRE);
  assert.match(altra.error, /--versio 1\.0\.2 no és la de package\.json \(1\.0\.1\)/);
  const bo = escriu({ testflightIosBuild: 5 });
  assert.deepEqual(bo, { codi: e.EIXIDA.BE, canviat: true, escrits: ['public/.well-known/ard.json', 'dist/.well-known/ard.json'] });
  assert.equal(fs.readFileSync(cami, 'utf8'), fs.readFileSync(camiDist, 'utf8'));
  assert.equal(JSON.parse(fs.readFileSync(cami, 'utf8')).testflightIosBuild, 5);
  assert.deepEqual(escriu({ testflightIosBuild: 5 }), { codi: e.EIXIDA.BE, canviat: false, escrits: [] });
  // Si la còpia de dist/ no passa les guardes (ja hi ha un build més alt), no s'escriu cap de les dues.
  fs.writeFileSync(camiDist, `${JSON.stringify({ ...JSON.parse(BASE), testflightIosBuild: 9 }, null, 2)}\n`);
  const despresDist = fs.readFileSync(camiDist, 'utf8');
  const abansPublic = fs.readFileSync(cami, 'utf8');
  const mitges = escriu({ testflightIosBuild: 6 });
  assert.equal(mitges.codi, e.EIXIDA.ARBRE);
  assert.match(mitges.error, /^dist\/\.well-known\/ard\.json: ard\.json ja publica testflightIosBuild 9: no es baixa a 6/);
  assert.equal(fs.readFileSync(cami, 'utf8'), abansPublic, 'public/ no ha canviat');
  assert.equal(fs.readFileSync(camiDist, 'utf8'), despresDist, 'dist/ no ha canviat');
  // Sense build fet (cap còpia de dist/), només public/.
  const sola = escriu({ testflightIosBuild: 7, camiDist: null });
  assert.deepEqual(sola.escrits, ['public/.well-known/ard.json']);
  // v1.2.16 · ZERO APK fora de botiga: un anunci de l'APK es refusa (eixida 2) i no s'escriu res.
  const abansApk = fs.readFileSync(cami, 'utf8');
  const apk = escriu({ testflightIosBuild: 8, apkDirectBuild: 8, apkSha256: SHA_A, camiDist: null });
  assert.equal(apk.codi, e.EIXIDA.US);
  assert.match(apk.error, /ZERO APK fora de botiga/);
  assert.equal(fs.readFileSync(cami, 'utf8'), abansApk);
  // Un enllaç no s'escriu.
  const enllac = path.join(carpeta, 'enllac.json');
  fs.symlinkSync(cami, enllac);
  assert.match(escriu({ testflightIosBuild: 8, cami: enllac, camiDist: null }).error, /és un enllaç/);
  assert.ok(!fs.readdirSync(carpeta).some((nom) => nom.endsWith('.tmp')), 'cap temporal');
});

test('v1.2.16 · ZERO APK: escriuManifestProves retira de public/ i de dist/ els anuncis heretats de l\'APK directe', () => {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'apk-heretat-'));
  const cami = path.join(carpeta, 'public-ard.json');
  const camiDist = path.join(carpeta, 'dist-ard.json');
  fs.writeFileSync(cami, BASE);
  // La còpia de dist/ d'un desplegament de la v1.2.15, amb l'anunci de l'APK (P0123-01).
  fs.writeFileSync(camiDist, `${JSON.stringify({ ...JSON.parse(BASE), apkDirectBuild: 13, apkSha256: SHA_A, latestBuild: 13 }, null, 2)}\n`);
  const escriu = (mes) => publica.escriuManifestProves({ arrel: carpeta, versio: '1.0.0', versioPaquet: '1.0.0', maximBuild: 20, cami, camiDist, ...mes });
  assert.deepEqual(escriu({ testflightIosBuild: 14 }), { codi: e.EIXIDA.BE, canviat: true, escrits: ['public/.well-known/ard.json', 'dist/.well-known/ard.json'] });
  for (const fitxer of [cami, camiDist]) {
    const dades = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
    assert.deepEqual([dades.testflightIosBuild, dades.latestBuild, Object.hasOwn(dades, 'apkDirectBuild'), Object.hasOwn(dades, 'apkSha256')], [14, 14, false, false], fitxer);
    const llegit = llegixCanalsManifest(dades);
    assert.deepEqual([llegit.apkDirectBuild, llegit.apkSha256], [null, null], 'cap App veu cap APK anunciat');
  }
  // Sense cap canal, cap escriptura; amb l'APK, un refús abans de llegir res.
  assert.match(escriu({}).error, /cal testflightIosBuild/);
  assert.equal(escriu({ apkDirectBuild: 15, apkSha256: SHA_A }).codi, e.EIXIDA.US);
  assert.ok(!fs.readdirSync(carpeta).some((nom) => nom.endsWith('.tmp')), 'cap temporal');
});

/* Un registre de pujades de proves, fora del repositori. */
function escenari({ registre = [] } = {}) {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'escenari-'));
  const builds = path.join(fora, 'builds');
  fs.mkdirSync(builds);
  fs.writeFileSync(path.join(builds, e.REGISTRE_DE_PUJADES), registre.map((linia) => `${JSON.stringify(linia)}\n`).join(''), { mode: 0o600 });
  return { fora, builds, valors: { SDP_BUILDS_DIR: builds } };
}

test('v1.2.7 · comprovaProves: TestFlight només amb la pujada d\'iOS al registre (intern o producció)', async () => {
  const pujada = (canal, versio = VERSIO, build = '12') => ({ plataforma: 'ios', canal, versio, build, sha256: null, commit: null, data: '2026-11-17T12:00:00Z' });
  const comprova = (esc, mes = {}) => publica.comprovaProves({ arrel: ARREL, valors: esc.valors, versio: VERSIO, testflightIosBuild: 12, ...mes });
  let r = await comprova(escenari({ registre: [] }));
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /el build 12 d'iOS no és al registre de pujades/);
  r = await comprova(escenari({ registre: [{ ...pujada('intern'), plataforma: 'android' }] }));
  assert.equal(r.codi, e.EIXIDA.ARBRE, 'una pujada d\'Android no compta');
  for (const canal of ['intern', 'produccio']) {
    r = await comprova(escenari({ registre: [pujada(canal)] }));
    assert.equal(r.codi, e.EIXIDA.BE, canal);
    assert.match(r.avisos[0], new RegExp(`el build 12 d'iOS \\(.*${canal}\\) és al registre de pujades: TestFlight el dona`));
  }
  r = await comprova(escenari({ registre: [pujada('intern', '99.0.0')] }));
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /és de la versió 99\.0\.0, més nova que la/);
  const esc = escenari({ registre: [pujada('intern')] });
  r = await publica.comprovaProves({ arrel: ARREL, valors: {}, versio: VERSIO, testflightIosBuild: 12 });
  assert.equal(r.codi, e.EIXIDA.FALTA);
  assert.match(r.problemes[0], /falta SDP_BUILDS_DIR/);
  r = await publica.comprovaProves({ arrel: ARREL, valors: { SDP_BUILDS_DIR: path.join(ARREL, 'src') }, versio: VERSIO, testflightIosBuild: 12 });
  assert.equal(r.codi, e.EIXIDA.FALTA, 'una carpeta de dins del repositori no val');
  fs.appendFileSync(path.join(esc.builds, e.REGISTRE_DE_PUJADES), 'no és json\n');
  r = await comprova(esc);
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /no es pot llegir sencer/);
});

test('P0123-02 · comprovaProves: TestFlight no s\'anuncia mentre una pujada de producció d\'iOS més baixa espera l\'App Store (App Review)', async () => {
  const pujada = (canal, build) => ({ plataforma: 'ios', canal, versio: VERSIO, build: String(build), sha256: null, commit: null, data: '2026-11-17T12:00:00Z' });
  const comprova = (registre, iosBuildPublicat) => publica.comprovaProves({ arrel: ARREL, valors: escenari({ registre }).valors, versio: VERSIO, testflightIosBuild: 13, iosBuildPublicat });
  // La 12 a producció (en revisió), la 13 a TestFlight i ard.json amb iosBuild 11: no.
  let r = await comprova([pujada('produccio', 12), pujada('intern', 13)], 11);
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /el build 12 d'iOS és al registre de producció i ard\.json encara publica iosBuild 11: pot estar en App Review/);
  assert.match(r.problemes[0], new RegExp(`--sincronitza-ard --versio ${VERSIO.replaceAll('.', '\\.')} --build-ios 12`));
  // La més alta de les que esperen, i sense iosBuild al manifest, el sòl és cap.
  r = await comprova([pujada('produccio', 10), pujada('produccio', 12), pujada('intern', 13)], null);
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /el build 12 d'iOS .* iosBuild cap:/);
  // Quan l'App Store ja la dona (iosBuild 12 a ard.json): sí.
  r = await comprova([pujada('produccio', 12), pujada('intern', 13)], 12);
  assert.equal(r.codi, e.EIXIDA.BE, r.problemes.join('; '));
  // La mateixa pujada és la de producció i la de TestFlight, o la de producció és més alta: cap App en revisió veu un build més nou.
  for (const registre of [[pujada('produccio', 13)], [pujada('produccio', 14), pujada('intern', 13)], [pujada('intern', 12), pujada('intern', 13)]]) {
    r = await comprova(registre, 11);
    assert.equal(r.codi, e.EIXIDA.BE, JSON.stringify(registre));
  }
});

test('v1.2.16 · comprovaProves: un apkDirectBuild es refusa (eixida 2, ZERO APK fora de botiga), amb TestFlight o sense', async () => {
  const pujada = { plataforma: 'ios', canal: 'intern', versio: VERSIO, build: '12', sha256: null, commit: null, data: '2026-11-21T01:00:00Z' };
  const esc = escenari({ registre: [pujada] });
  for (const mes of [{ apkDirectBuild: 12 }, { apkDirectBuild: 12, testflightIosBuild: 12 }, { apkSha256: SHA_A }]) {
    const r = await publica.comprovaProves({ arrel: ARREL, valors: esc.valors, versio: VERSIO, ...mes });
    assert.equal(r.codi, e.EIXIDA.US, JSON.stringify(mes));
    assert.match(r.problemes[0], /ZERO APK fora de botiga/);
    assert.equal(Object.hasOwn(r, 'apkSha256'), false, 'cap suma d\'APK');
  }
});

/* Un fitxer d'entorn de proves fora del repositori, en 0600. */
function entornDe(valors) {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'entorn-'));
  const fitxer = path.join(fora, 'botigues.env');
  fs.writeFileSync(fitxer, `${Object.entries(valors).map(([nom, valor]) => `${nom}=${valor}`).join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(fitxer, 0o600);
  return { SDP_BOTIGUES_ENV: fitxer };
}

test('v1.2.7 · publica-tot --sincronitza-proves: sola, amb versió explícita, i escriu només amb l\'evidència', { skip: SENSE_REPOSITORI }, async () => {
  assert.ok(VERSIO, 'package.json');
  const build = MAXIM;
  const esc = escenari({ registre: [{ plataforma: 'ios', canal: 'intern', versio: VERSIO, build: String(build), sha256: null, commit: null, data: '2026-11-17T12:00:00Z' }] });
  const manifest = path.join(esc.fora, 'ard.json');
  const manifestDist = path.join(esc.fora, 'ard-dist.json');
  const inicial = `${JSON.stringify({ version: VERSIO, androidBuild: 1, iosBuild: 1, entries: [{ identifier: 'x', version: VERSIO }] }, null, 2)}\n`;
  fs.writeFileSync(manifest, inicial);
  fs.writeFileSync(manifestDist, inicial);
  const env = ambRonda(entornDe({ SDP_BUILDS_DIR: esc.builds }));
  const ordre = (args, mes = {}) => ambPantalla(() => publica.main(args, { env, manifest, manifestDist, ...mes }));

  // Les combinacions que no valen: res escrit.
  for (const [args, motiu] of [
    [['--sincronitza-proves', '--versio', VERSIO], /cal --versio X\.Y\.Z explícita i --build-testflight/],
    [['--sincronitza-proves', '--build-testflight', String(build)], /cal --versio X\.Y\.Z explícita/],
    [['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', 'x'], /cal --versio/],
    // v1.2.16 · ZERO APK fora de botiga: --build-apk i --publica-apk es refusen, juntes o soles.
    [['--sincronitza-proves', '--versio', VERSIO, '--build-apk', String(build)], /--build-apk: ZERO APK fora de botiga/],
    [['--sincronitza-proves', '--publica-apk', '--versio', VERSIO, '--build-testflight', String(build)], /--publica-apk: ZERO APK fora de botiga/],
    [['--sincronitza-proves', '--sincronitza-ard', '--versio', VERSIO, '--build-testflight', String(build)], /sobren: --sincronitza-ard/],
    [['--sincronitza-proves', '--versio', VERSIO, '--build', String(build)], /sobren: --build/],
    [['--sincronitza-ard', '--versio', VERSIO, '--build-testflight', String(build)], /només va amb --sincronitza-proves/]
  ]) {
    const r = await ordre(args);
    assert.equal(r.codi, e.EIXIDA.US, args.join(' '));
    assert.match(r.vist, motiu, args.join(' '));
  }
  // Les guardes pures paren abans de llegir l'entorn: una altra versió, un build per damunt del sostre.
  let r = await ordre(['--sincronitza-proves', '--versio', '99.0.0', '--build-testflight', String(build)], { env: ambRonda({ SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') }) });
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.vist, /no és la de package\.json/);
  r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(MAXIM + 1)], { env: ambRonda({ SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') }) });
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.vist, /passa de VERSIO_CLIENT_NATIU/);
  assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'res escrit');

  // Sense evidència (un build que no és al registre): res escrit.
  if (build > 1) {
    r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(build - 1)]);
    assert.equal(r.codi, e.EIXIDA.ARBRE);
    assert.match(r.vist, /no és al registre de pujades/);
    assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'res escrit');
  }

  // TestFlight, amb el registre: public/ i dist/.
  r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(build)]);
  assert.equal(r.codi, e.EIXIDA.BE, r.vist);
  assert.match(r.vist, new RegExp(`testflightIosBuild ${build}`));
  for (const fitxer of [manifest, manifestDist]) {
    const escrit = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
    assert.deepEqual([escrit.version, escrit.androidBuild, escrit.iosBuild, escrit.testflightIosBuild, escrit.latestBuild], [VERSIO, 1, 1, build, build]);
  }

  /* P0123-02 · main llig l'iosBuild de l'ard.json: amb una pujada de producció d'iOS més baixa que encara no dona
     l'App Store (pot estar en App Review), TestFlight no s'anuncia; quan ard.json ja la publica, sí. */
  if (build > 2) {
    const pujadaDe = (canal, b) => ({ plataforma: 'ios', canal, versio: VERSIO, build: String(b), sha256: null, commit: null, data: '2026-11-17T12:00:00Z' });
    const rev = escenari({ registre: [pujadaDe('produccio', build - 1), pujadaDe('intern', build)] });
    const unic = path.join(rev.fora, 'ard.json');
    fs.writeFileSync(unic, inicial);
    const envRev = ambRonda(entornDe({ SDP_BUILDS_DIR: rev.builds }));
    const tf = ['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(build)];
    r = await ambPantalla(() => publica.main(tf, { env: envRev, manifest: unic, manifestDist: null }));
    assert.equal(r.codi, e.EIXIDA.ARBRE, r.vist);
    assert.match(r.vist, new RegExp(`el build ${build - 1} d'iOS és al registre de producció i ard\\.json encara publica iosBuild 1: pot estar en App Review`));
    assert.equal(fs.readFileSync(unic, 'utf8'), inicial, 'res escrit');
    fs.writeFileSync(unic, `${JSON.stringify({ ...JSON.parse(inicial), iosBuild: build - 1 }, null, 2)}\n`);
    r = await ambPantalla(() => publica.main(tf, { env: envRev, manifest: unic, manifestDist: null }));
    assert.equal(r.codi, e.EIXIDA.BE, r.vist);
    assert.equal(JSON.parse(fs.readFileSync(unic, 'utf8')).testflightIosBuild, build);
  }
  assert.deepEqual(fs.readdirSync(path.join(ARREL, 'public', '.well-known')).filter((nom) => nom.endsWith('.tmp')), [], 'cap temporal al repositori');
});

test('v1.2.7 · el pla en sec d\'iOS diu el pas de TestFlight després de la pujada', () => {
  const resum = publica.resumOmnicanal(ARREL, { versio: '1.2.7', build: '12', plataforma: 'ios', env: ambRonda({ SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') }) });
  assert.deepEqual(resum.passos.map((pas) => pas.ordre.split(' --versio')[0]), [
    'node scripts/botigues/puja-ios.mjs', 'node scripts/botigues/publica-tot.mjs --sincronitza-proves'
  ]);
  assert.match(resum.passos[1].ordre, /--build-testflight 12$/);
});

/* v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · Sense la ronda oberta: refús abans de cap guarda,
   res escrit (ni public/ ni dist/), cap lectura de l'entorn; i el pla d'iOS no proposa el pas de TestFlight. */
test('v1.2.23 · D-V1223-BOTO-BETA-OCULT · sense SDP_RONDA_BETA_TESTERS=1, --sincronitza-proves es refusa i el pla no anuncia TestFlight', { skip: SENSE_REPOSITORI }, async () => {
  assert.ok(VERSIO, 'package.json');
  const build = MAXIM;
  const esc = escenari({ registre: [{ plataforma: 'ios', canal: 'intern', versio: VERSIO, build: String(build), sha256: null, commit: null, data: '2026-11-23T12:00:00Z' }] });
  const manifest = path.join(esc.fora, 'ard.json');
  const manifestDist = path.join(esc.fora, 'ard-dist.json');
  const inicial = `${JSON.stringify({ version: VERSIO, androidBuild: 1, iosBuild: 1, entries: [{ identifier: 'x', version: VERSIO }] }, null, 2)}\n`;
  fs.writeFileSync(manifest, inicial);
  fs.writeFileSync(manifestDist, inicial);
  const env = entornDe({ SDP_BUILDS_DIR: esc.builds });
  const tf = ['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(build)];
  // Absent, buida o qualsevol valor que no siga exactament «1»: la ronda continua tancada.
  for (const valor of [null, '', '0', 'true', 'si', ' 1']) {
    const r = await ambPantalla(() => publica.main(tf, { env: ambRonda(env, valor), manifest, manifestDist }));
    assert.equal(r.codi, e.EIXIDA.US, `SDP_RONDA_BETA_TESTERS=${valor}`);
    assert.match(r.vist, /D-V1223-BOTO-BETA-OCULT \(ordre del Mestre 261123\) · la ronda amb Beta Testers no és oberta: testflightIosBuild no s'escriu a ard\.json/);
    assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'public/: res escrit');
    assert.equal(fs.readFileSync(manifestDist, 'utf8'), inicial, 'dist/: res escrit');
  }
  // El refús va abans de les guardes: tampoc no llig un entorn absent.
  const r = await ambPantalla(() => publica.main(tf, { env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') }, manifest, manifestDist }));
  assert.equal(r.codi, e.EIXIDA.US);
  assert.doesNotMatch(r.vist, /entorn/i);
  // El pla d'iOS: la pujada sí, l'anunci de TestFlight no.
  const resum = publica.resumOmnicanal(ARREL, { versio: '1.2.7', build: '12', plataforma: 'ios', env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
  assert.deepEqual(resum.passos.map((pas) => pas.ordre.split(' --versio')[0]), ['node scripts/botigues/puja-ios.mjs']);
  assert.ok(!resum.passos.some((pas) => /--sincronitza-proves|testflightIosBuild/.test(`${pas.ordre} ${pas.accio}`)), 'cap anunci de TestFlight al pla');
  assert.deepEqual(fs.readdirSync(path.join(ARREL, 'public', '.well-known')).filter((nom) => nom.endsWith('.tmp')), [], 'cap temporal al repositori');
});

/* v1.2.23 · L8-09 (Gauntlet R1) · El pany de TestFlight és el de l'entorn que reben main() i resumOmnicanal(), no el de
   process.env: amb process.env obert i un entorn injectat sense la variable, el pla no anuncia TestFlight i
   --sincronitza-proves es refusa sense escriure res; amb process.env tancat i l'entorn injectat obert, el pla l'anuncia. */
test('v1.2.23 · L8-09 · la ronda de Beta Testers es llig de l\'entorn injectat, no de process.env', { skip: SENSE_REPOSITORI }, async (t) => {
  const NO_HI_ES = { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') };
  const anunciaTestFlight = (resum) => resum.passos.some((pas) => /--sincronitza-proves|testflightIosBuild/.test(`${pas.ordre} ${pas.accio}`));
  const pla = (env) => publica.resumOmnicanal(ARREL, { versio: '1.2.7', build: '12', plataforma: 'ios', env });
  const esc = escenari({ registre: [{ plataforma: 'ios', canal: 'intern', versio: VERSIO, build: String(MAXIM), sha256: null, commit: null, data: '2026-11-23T12:00:00Z' }] });
  const manifest = path.join(esc.fora, 'ard.json');
  const manifestDist = path.join(esc.fora, 'ard-dist.json');
  const inicial = `${JSON.stringify({ version: VERSIO, androidBuild: 1, iosBuild: 1, entries: [{ identifier: 'x', version: VERSIO }] }, null, 2)}\n`;
  fs.writeFileSync(manifest, inicial);
  fs.writeFileSync(manifestDist, inicial);
  const tf = ['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(MAXIM)];

  // El pla en sec de main (--json) passa el seu entorn a resumOmnicanal: el mateix pany.
  const plaDeMain = async (env) => {
    const sortida = await ambPantalla(() => publica.main(['--versio', '1.2.7', '--build', '12', '--plataforma', 'ios', '--json'], { env }));
    return JSON.parse(sortida.vist);
  };

  rondaDelProces(t, '1');
  assert.equal(anunciaTestFlight(pla(ambRonda(NO_HI_ES, null))), false, 'process.env obert, entorn injectat tancat: el pla no anuncia TestFlight');
  assert.equal(anunciaTestFlight(await plaDeMain(ambRonda(NO_HI_ES, null))), false, 'main --json: tampoc');
  const r = await ambPantalla(() => publica.main(tf, { env: ambRonda(entornDe({ SDP_BUILDS_DIR: esc.builds }), null), manifest, manifestDist }));
  assert.equal(r.codi, e.EIXIDA.US, r.vist);
  assert.match(r.vist, /la ronda amb Beta Testers no és oberta/);
  assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'public/: res escrit');
  assert.equal(fs.readFileSync(manifestDist, 'utf8'), inicial, 'dist/: res escrit');

  rondaDelProces(t, null);
  assert.equal(anunciaTestFlight(pla(ambRonda(NO_HI_ES))), true, 'process.env tancat, entorn injectat obert: el pla anuncia TestFlight');
  assert.equal(anunciaTestFlight(await plaDeMain(ambRonda(NO_HI_ES))), true, 'main --json: també');
  const oberta = await ambPantalla(() => publica.main(tf, { env: ambRonda(entornDe({ SDP_BUILDS_DIR: esc.builds })), manifest, manifestDist }));
  assert.equal(oberta.codi, e.EIXIDA.BE, oberta.vist);
  assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).testflightIosBuild, MAXIM);
});
