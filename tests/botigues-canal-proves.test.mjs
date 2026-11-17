/* tests/botigues-canal-proves.test.mjs — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026:
   «actualització automàtica real als mòbils de prova»). Els canals de proves del manifest públic
   (public/.well-known/ard.json): testflightIosBuild, apkDirectBuild + apkSha256 i latestBuild, que
   escriu scripts/botigues/publica-tot.mjs --sincronitza-proves amb les garanties de --sincronitza-ard
   (la versió de package.json, cap build per damunt de VERSIO_CLIENT_NATIU, mai baixa sense
   --corregeix-ard) i només amb l'evidència de cada canal: el registre de pujades de puja-ios.mjs per a
   TestFlight; l'APK que --publica-apk ha deixat a dist/descarregues/, idèntic a l'APK únic de la versió
   i signat amb la clau de pujada, per a l'APK directe.
   Cap xarxa, cap eina real (la signatura es passa), cap fitxer del repositori: tot en mkdtemp. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');
const VERSIO = publica.versioDelPaquet(ARREL);
const MAXIM = Number(VERSIO_CLIENT_NATIU);
const CERT = 'AB'.repeat(32);
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
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

test('v1.2.7 · sincronitzaManifestProves: TestFlight, l\'APK amb la seua suma i latestBuild, sense tocar les botigues públiques', () => {
  const tf = JSON.parse(proves(BASE, { versio: '1.0.1', testflightIosBuild: 12 }));
  assert.deepEqual(Object.keys(tf), ['version', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'latestBuild', 'entries']);
  assert.deepEqual([tf.version, tf.androidBuild, tf.iosBuild, tf.testflightIosBuild, tf.latestBuild], ['1.0.1', 1, 1, 12, 12]);
  assert.equal(tf.entries[0].version, '1.0.1', 'cada entrada declara la versió del manifest');

  const apk = JSON.parse(proves(`${JSON.stringify(tf, null, 2)}\n`, { versio: '1.0.1', apkDirectBuild: 13, apkSha256: SHA_A }));
  assert.deepEqual(Object.keys(apk), ['version', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild', 'apkSha256', 'latestBuild', 'entries']);
  assert.deepEqual([apk.androidBuild, apk.iosBuild, apk.testflightIosBuild, apk.apkDirectBuild, apk.apkSha256, apk.latestBuild], [1, 1, 12, 13, SHA_A, 13]);
  // El lector del client (config/manifestVersio.js) en llig el mateix.
  assert.deepEqual(llegixCanalsManifest(apk), {
    versio: '1.0.1', androidBuild: 1, iosBuild: 1, testflightIosBuild: 12, apkDirectBuild: 13, apkSha256: SHA_A, latestBuild: 13
  });
  // Idempotent.
  const text = `${JSON.stringify(apk, null, 2)}\n`;
  assert.equal(proves(text, { versio: '1.0.1', apkDirectBuild: 13, apkSha256: SHA_A }), text);
  // --sincronitza-ard (les botigues públiques) conserva els canals de proves i recalcula latestBuild.
  const public1 = JSON.parse(publica.sincronitzaManifestVersio(text, { versio: '1.0.1', androidBuild: 14, maximBuild: 20 }));
  assert.deepEqual([public1.testflightIosBuild, public1.apkDirectBuild, public1.apkSha256, public1.androidBuild, public1.latestBuild], [12, 13, SHA_A, 14, 14]);
});

test('v1.2.7 · sincronitzaManifestProves: les guardes de --sincronitza-ard i les de la suma', () => {
  const apk = proves(BASE, { versio: '1.0.0', apkDirectBuild: 13, apkSha256: SHA_A });
  assert.throws(() => proves(BASE, { versio: '1.0.0' }), /cal testflightIosBuild o apkDirectBuild/);
  assert.throws(() => proves(BASE, { versio: '1.0', testflightIosBuild: 2 }), /X\.Y\.Z/);
  assert.throws(() => proves(BASE, { versio: '1.0.0', testflightIosBuild: 0 }), /testflightIosBuild ha de ser un enter positiu/);
  assert.throws(() => proves(BASE, { versio: '1.0.0', testflightIosBuild: 21 }), /testflightIosBuild 21 passa de VERSIO_CLIENT_NATIU \(20/);
  assert.throws(() => publica.sincronitzaManifestProves(BASE, { versio: '1.0.0', apkDirectBuild: MAXIM + 1, apkSha256: SHA_A }), /passa de VERSIO_CLIENT_NATIU/, 'el sostre per defecte és VERSIO_CLIENT_NATIU');
  // La suma: sempre amb l'APK, 64 xifres hexadecimals en minúscula, i mai sola.
  for (const dolenta of [null, '', 'A'.repeat(64), 'a'.repeat(63), `${'a'.repeat(63)}g`]) {
    assert.throws(() => proves(BASE, { versio: '1.0.0', apkDirectBuild: 3, apkSha256: dolenta }), /va sempre amb apkSha256/, String(dolenta));
  }
  assert.throws(() => proves(BASE, { versio: '1.0.0', testflightIosBuild: 3, apkSha256: SHA_A }), /apkSha256 només va amb apkDirectBuild/);
  // Mai baixa: ni la versió, ni cap build, llevat de --corregeix-ard.
  assert.throws(() => proves(apk, { versio: '0.9.9', testflightIosBuild: 2 }), /no es baixa a 0\.9\.9 .*--corregeix-ard/);
  assert.throws(() => proves(apk, { versio: '1.0.0', apkDirectBuild: 12, apkSha256: SHA_B }), /ja publica apkDirectBuild 13: no es baixa a 12/);
  // El mateix build amb una altra suma és un altre fitxer: només amb --corregeix-ard.
  assert.throws(() => proves(apk, { versio: '1.0.0', apkDirectBuild: 13, apkSha256: SHA_B }), /amb una altra SHA-256/);
  const corregit = JSON.parse(proves(apk, { versio: '1.0.0', apkDirectBuild: 12, apkSha256: SHA_B, corregeix: true }));
  assert.deepEqual([corregit.apkDirectBuild, corregit.apkSha256, corregit.latestBuild], [12, SHA_B, 12]);
  assert.throws(() => proves('{"x":1}', { versio: '1.0.0', testflightIosBuild: 2 }), /no té «entries»/);
  assert.throws(() => proves('no', { versio: '1.0.0', testflightIosBuild: 2 }), /no és JSON/);
  // L'assaig en sec sense la suma (abans de llegir l'APK): les guardes de build, sense escriure suma.
  assert.throws(() => proves(apk, { versio: '1.0.0', apkDirectBuild: 12, senseSuma: true }), /no es baixa a 12/);
  assert.doesNotThrow(() => proves(apk, { versio: '1.0.0', apkDirectBuild: 14, senseSuma: true }));
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
  // L'APK necessita la còpia de dist/: sense, ni public/.
  const senseDist = escriu({ apkDirectBuild: 8, apkSha256: SHA_A, camiDist: null });
  assert.equal(senseDist.codi, e.EIXIDA.ARBRE);
  assert.match(senseDist.error, /no hi ha dist\/\.well-known\/ard\.json: l’APK publicat i el seu anunci van en el mateix build/);
  assert.equal(JSON.parse(fs.readFileSync(cami, 'utf8')).apkDirectBuild, undefined);
  // Un enllaç no s'escriu.
  const enllac = path.join(carpeta, 'enllac.json');
  fs.symlinkSync(cami, enllac);
  assert.match(escriu({ testflightIosBuild: 8, cami: enllac, camiDist: null }).error, /és un enllaç/);
  assert.ok(!fs.readdirSync(carpeta).some((nom) => nom.endsWith('.tmp')), 'cap temporal');
});

test('P0123-01 · l\'anunci de l\'APK va NOMÉS a dist/: un npm run build posterior (dist/ buidat, public/ copiat) el retira amb l\'APK', () => {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'apk-dist-'));
  const cami = path.join(carpeta, 'public-ard.json');
  const camiDist = path.join(carpeta, 'dist-ard.json');
  fs.writeFileSync(cami, BASE);
  fs.writeFileSync(camiDist, BASE);
  const escriu = (mes) => publica.escriuManifestProves({ arrel: carpeta, versio: '1.0.0', versioPaquet: '1.0.0', maximBuild: 20, cami, camiDist, ...mes });
  // Només l'APK: public/ no es toca.
  assert.deepEqual(escriu({ apkDirectBuild: 13, apkSha256: SHA_A }), { codi: e.EIXIDA.BE, canviat: true, escrits: ['dist/.well-known/ard.json'] });
  assert.equal(fs.readFileSync(cami, 'utf8'), BASE, 'public/ sense l\'anunci de l\'APK');
  const dist = JSON.parse(fs.readFileSync(camiDist, 'utf8'));
  assert.deepEqual([dist.apkDirectBuild, dist.apkSha256, dist.latestBuild], [13, SHA_A, 13]);
  // TestFlight i l'APK en la mateixa ordre: TestFlight a tots dos; l'APK, només a dist/.
  assert.deepEqual(escriu({ testflightIosBuild: 14, apkDirectBuild: 13, apkSha256: SHA_A }).escrits, ['public/.well-known/ard.json', 'dist/.well-known/ard.json']);
  const pub = JSON.parse(fs.readFileSync(cami, 'utf8'));
  assert.deepEqual([pub.testflightIosBuild, pub.latestBuild, Object.hasOwn(pub, 'apkDirectBuild'), Object.hasOwn(pub, 'apkSha256')], [14, 14, false, false]);
  assert.deepEqual(JSON.parse(fs.readFileSync(camiDist, 'utf8')).apkDirectBuild, 13);
  // Un build posterior: dist/ es buida (l'APK de dist/descarregues/ se'n va) i hi torna public/. L'anunci, també.
  fs.copyFileSync(cami, camiDist);
  const despres = llegixCanalsManifest(JSON.parse(fs.readFileSync(camiDist, 'utf8')));
  assert.deepEqual([despres.apkDirectBuild, despres.apkSha256, despres.testflightIosBuild], [null, null, 14]);
  // Sense cap canal, cap escriptura.
  assert.match(escriu({}).error, /cal testflightIosBuild o apkDirectBuild/);
});

/* Un registre de pujades i un APK publicat de proves, fora del repositori. */
function escenari({ registre = [], apk = true, dosApk = false, sidecarPublicat = null, altreApk = false, build = 12 } = {}) {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'escenari-'));
  const builds = path.join(fora, 'builds');
  fs.mkdirSync(builds);
  fs.writeFileSync(path.join(builds, e.REGISTRE_DE_PUJADES), registre.map((linia) => `${JSON.stringify(linia)}\n`).join(''), { mode: 0o600 });
  const carpeta = path.join(fora, 'android');
  const dist = path.join(fora, 'dist');
  fs.mkdirSync(carpeta);
  fs.mkdirSync(path.join(dist, 'descarregues'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html>');
  const octets = crypto.randomBytes(4096);
  const suma = sha256(octets);
  const unic = path.join(carpeta, `261117_socdepoble_${VERSIO}+${build}.apk`);
  fs.writeFileSync(unic, octets);
  fs.writeFileSync(`${unic}.sha256`, `${suma}  ${publica.NOM_APK_PUBLIC}\n`);
  if (dosApk) {
    const segon = path.join(carpeta, `261118_socdepoble_${VERSIO}+${build}.apk`);
    fs.writeFileSync(segon, octets);
    fs.writeFileSync(`${segon}.sha256`, `${suma}\n`);
  }
  if (apk) {
    const publicat = path.join(dist, 'descarregues', publica.NOM_APK_PUBLIC);
    const octetsPublicats = altreApk ? crypto.randomBytes(4096) : octets;
    fs.writeFileSync(publicat, octetsPublicats);
    fs.writeFileSync(`${publicat}.sha256`, `${sidecarPublicat ?? sha256(octetsPublicats)}  ${publica.NOM_APK_PUBLIC}\n`);
  }
  const valors = { SDP_BUILDS_DIR: builds, SDP_ANDROID_UPLOAD_CERT_SHA256: CERT };
  return { fora, builds, carpeta, dist, suma, valors };
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

test('v1.2.7 · comprovaProves: l\'APK directe només si el publicat és l\'APK únic de la versió, casa amb les sumes i el signa la clau de pujada', async () => {
  const signa = (empremta = CERT) => async () => empremta;
  const comprova = (esc, mes = {}) => publica.comprovaProves({
    arrel: ARREL, valors: esc.valors, versio: VERSIO, apkDirectBuild: 12, carpeta: esc.carpeta, dist: esc.dist, empremta: signa(), ...mes
  });
  const bo = escenari();
  let r = await comprova(bo);
  assert.equal(r.codi, e.EIXIDA.BE, r.problemes.join('; '));
  assert.equal(r.apkSha256, bo.suma, 'la suma és la del fitxer publicat');
  assert.match(r.avisos[0], /signat amb la clau de pujada/);
  for (const [cas, esc, mes, motiu, codi] of [
    ['sense APK publicat', escenari({ apk: false }), {}, /no hi ha cap APK publicat a dist\/descarregues/, e.EIXIDA.ARBRE],
    ['dos APK de la versió', escenari({ dosApk: true }), {}, /hi ha 2 APK/, e.EIXIDA.ARBRE],
    ['el .sha256 publicat no casa', escenari({ sidecarPublicat: 'c'.repeat(64) }), {}, /no casa amb el seu \.sha256/, e.EIXIDA.VERIFICACIO],
    ['el publicat és un altre fitxer', escenari({ altreApk: true }), {}, /l’APK publicat no és 261117_socdepoble_/, e.EIXIDA.VERIFICACIO],
    ['una altra clau', bo, { empremta: signa('CD'.repeat(32)) }, /clau diferent de SDP_ANDROID_UPLOAD_CERT_SHA256/, e.EIXIDA.VERIFICACIO],
    ['apksigner no verifica', bo, { empremta: signa(null) }, /no ha pogut verificar la signatura/, e.EIXIDA.VERIFICACIO],
    ['sense la clau de pujada', bo, { valors: {} }, /falta SDP_ANDROID_UPLOAD_CERT_SHA256/, e.EIXIDA.FALTA],
    ['un altre build', bo, { apkDirectBuild: 13 }, /hi ha 0 APK/, e.EIXIDA.ARBRE]
  ]) {
    r = await comprova(esc, mes);
    assert.equal(r.codi, codi, cas);
    assert.match(r.problemes[0], motiu, cas);
    assert.equal(r.apkSha256, null, cas);
  }
  // dist/descarregues com a enllaç cap a fora de dist/: no hi ha APK publicat.
  const enllacat = escenari({ apk: false });
  fs.rmSync(path.join(enllacat.dist, 'descarregues'), { recursive: true });
  fs.symlinkSync(path.join(bo.dist, 'descarregues'), path.join(enllacat.dist, 'descarregues'));
  r = await comprova(enllacat);
  assert.equal(r.codi, e.EIXIDA.ARBRE);
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
  const esc = escenari({ build, registre: [{ plataforma: 'ios', canal: 'intern', versio: VERSIO, build: String(build), sha256: null, commit: null, data: '2026-11-17T12:00:00Z' }] });
  const manifest = path.join(esc.fora, 'ard.json');
  const manifestDist = path.join(esc.fora, 'ard-dist.json');
  const inicial = `${JSON.stringify({ version: VERSIO, androidBuild: 1, iosBuild: 1, entries: [{ identifier: 'x', version: VERSIO }] }, null, 2)}\n`;
  fs.writeFileSync(manifest, inicial);
  fs.writeFileSync(manifestDist, inicial);
  const env = entornDe({ SDP_BUILDS_DIR: esc.builds, SDP_ANDROID_UPLOAD_CERT_SHA256: CERT });
  const ordre = (args, mes = {}) => ambPantalla(() => publica.main(args, { env, manifest, manifestDist, ...mes }));

  // Les combinacions que no valen: res escrit.
  for (const [args, motiu] of [
    [['--sincronitza-proves', '--versio', VERSIO], /cal --versio X\.Y\.Z explícita i --build-testflight/],
    [['--sincronitza-proves', '--build-testflight', String(build)], /cal --versio X\.Y\.Z explícita/],
    [['--sincronitza-proves', '--versio', VERSIO, '--build-apk', 'x'], /cal --versio/],
    [['--sincronitza-proves', '--publica-apk', '--versio', VERSIO, '--build-apk', String(build)], /sobren: --publica-apk/],
    [['--sincronitza-proves', '--sincronitza-ard', '--versio', VERSIO, '--build-testflight', String(build)], /sobren: --sincronitza-ard/],
    [['--sincronitza-proves', '--versio', VERSIO, '--build', String(build)], /sobren: --build/],
    [['--publica-apk', '--versio', VERSIO, '--build', String(build), '--build-apk', String(build)], /només van amb --sincronitza-proves/],
    [['--sincronitza-ard', '--versio', VERSIO, '--build-testflight', String(build)], /només van amb --sincronitza-proves/]
  ]) {
    const r = await ordre(args);
    assert.equal(r.codi, e.EIXIDA.US, args.join(' '));
    assert.match(r.vist, motiu, args.join(' '));
  }
  // Les guardes pures paren abans de llegir l'entorn: una altra versió, un build per damunt del sostre.
  let r = await ordre(['--sincronitza-proves', '--versio', '99.0.0', '--build-testflight', String(build)], { env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.vist, /no és la de package\.json/);
  r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-testflight', String(MAXIM + 1)], { env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
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

  // L'APK directe: la suma escrita és la del fitxer publicat, i el missatge diu l'ordre del desplegament.
  {
    const publicAbans = fs.readFileSync(manifest, 'utf8');
    r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-apk', String(build)], { proves: { carpeta: esc.carpeta, dist: esc.dist, empremta: async () => CERT } });
    assert.equal(r.codi, e.EIXIDA.BE, r.vist);
    assert.match(r.vist, /rsync de dist\/ al Node 0 \(l’APK\) i DESPRÉS firebase deploy/);
    assert.match(r.vist, /cap npm run build entremig/);
    // P0123-01 · L'anunci de l'APK, NOMÉS a la còpia de dist/ (la de l'APK); public/ no el porta.
    const escrit = JSON.parse(fs.readFileSync(manifestDist, 'utf8'));
    assert.deepEqual([escrit.apkDirectBuild, escrit.apkSha256, escrit.testflightIosBuild, escrit.latestBuild], [build, esc.suma, build, build]);
    assert.equal(fs.readFileSync(manifest, 'utf8'), publicAbans, 'public/ no canvia amb --build-apk');
    assert.equal(Object.hasOwn(JSON.parse(publicAbans), 'apkDirectBuild'), false);
    // Una signatura d'una altra clau: no s'anuncia (ni canvia res).
    const abans = fs.readFileSync(manifestDist, 'utf8');
    r = await ordre(['--sincronitza-proves', '--versio', VERSIO, '--build-apk', String(build)], { proves: { carpeta: esc.carpeta, dist: esc.dist, empremta: async () => 'CD'.repeat(32) } });
    assert.equal(r.codi, e.EIXIDA.VERIFICACIO);
    assert.equal(fs.readFileSync(manifestDist, 'utf8'), abans);
  }

  /* P0123-02 · main llig l'iosBuild de l'ard.json: amb una pujada de producció d'iOS més baixa que encara no dona
     l'App Store (pot estar en App Review), TestFlight no s'anuncia; quan ard.json ja la publica, sí. */
  if (build > 2) {
    const pujadaDe = (canal, b) => ({ plataforma: 'ios', canal, versio: VERSIO, build: String(b), sha256: null, commit: null, data: '2026-11-17T12:00:00Z' });
    const rev = escenari({ build, registre: [pujadaDe('produccio', build - 1), pujadaDe('intern', build)] });
    const unic = path.join(rev.fora, 'ard.json');
    fs.writeFileSync(unic, inicial);
    const envRev = entornDe({ SDP_BUILDS_DIR: rev.builds, SDP_ANDROID_UPLOAD_CERT_SHA256: CERT });
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
  const resum = publica.resumOmnicanal(ARREL, { versio: '1.2.7', build: '12', plataforma: 'ios', env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
  assert.deepEqual(resum.passos.map((pas) => pas.ordre.split(' --versio')[0]), [
    'node scripts/botigues/puja-ios.mjs', 'node scripts/botigues/publica-tot.mjs --sincronitza-proves'
  ]);
  assert.match(resum.passos[1].ordre, /--build-testflight 12$/);
});
