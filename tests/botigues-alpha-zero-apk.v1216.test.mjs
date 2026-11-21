/* tests/botigues-alpha-zero-apk.v1216.test.mjs — Onada v1.2.16 (prompt 261121_0216, T3.1; ordres del
   Mestre 261121 01:32 i 01:55). La pista TANCADA «alpha» de Google Play (els verificadors del grup
   socdepoble-testers) a entorn.mjs, puja-android.mjs, preflight.mjs, puja-ios.mjs i publica-tot.mjs:
   --canal alpha, el «sí» lligat al canal (alpha:V+B), --desplega amb status completed a alpha, la
   guarda de producció intacta (mai completed) i el canal intern de sempre. I ZERO APK fora de botiga:
   cap camí d'eina compila, publica, oferix ni anuncia cap APK directe.
   Cap xarxa de fora: un Google Play local (127.0.0.1) mínim, una clau RSA generada al vol i fitxers a
   mkdtemp. Cap eina real (cap gradle, keytool, apksigner ni docker). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import * as e from '../scripts/botigues/entorn.mjs';
import * as p from '../scripts/botigues/preflight.mjs';
import * as android from '../scripts/botigues/puja-android.mjs';
import * as ios from '../scripts/botigues/puja-ios.mjs';
import * as publica from '../scripts/botigues/publica-tot.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENSE_REPOSITORI = !fs.existsSync(path.join(ARREL, '.git')) && 'còpia sense .git: main() passa per l\'arrel del repositori';
const TEMPORAL = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-v1216-alpha-')));
process.on('exit', () => fs.rmSync(TEMPORAL, { recursive: true, force: true }));
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');
const NO_HI_ES = { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') };

/* La pantalla d'una funció, sencera (els trossos binaris són del corredor de node --test). */
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

/* ───────────── entorn.mjs: el canal ───────────── */

test('v1.2.16 · entorn: alpha és un canal d\'Android (no d\'iOS) i els missatges de --canal comencen igual', () => {
  assert.deepEqual(e.CANALS, { INTERN: 'intern', PRODUCCIO: 'produccio', ALPHA: 'alpha' });
  assert.deepEqual(e.CANALS_PER_PLATAFORMA, { android: ['intern', 'produccio', 'alpha'], ios: ['intern', 'produccio'] });
  assert.equal(e.canalAdmes('alpha', ['android']), true);
  assert.equal(e.canalAdmes('alpha', ['ios']), false);
  assert.equal(e.canalAdmes('alpha', ['android', 'ios']), false, 'amb les dues plataformes, alpha no val');
  for (const canal of ['intern', 'produccio']) assert.equal(e.canalAdmes(canal, ['android', 'ios']), true, canal);
  for (const dolent of ['beta', 'production', 'internal', '', undefined]) assert.equal(e.canalAdmes(dolent, ['android']), false, String(dolent));
  assert.equal(e.canalAdmes('intern', []), false, 'cap plataforma, cap canal');
  // Les proves de sempre busquen «--canal ha de ser intern o produccio»: els dos textos comencen així.
  assert.match(e.usDelCanal(['android']), /^--canal ha de ser intern o produccio, o alpha \(la prova tancada de Google Play\)$/);
  assert.match(e.usDelCanal(['ios']), /^--canal ha de ser intern o produccio \(alpha és només la prova tancada de Google Play.*TestFlight/);
});

test('v1.2.16 · entorn: el «sí» d\'alpha és alpha:V+B i cap «sí» d\'un altre canal hi val, ni al revés', () => {
  const sha = 'abcdef0123456789'.repeat(4);
  assert.equal(e.confirmacioEsperada('1.2.16', '21', { canal: 'alpha' }), 'alpha:1.2.16+21');
  assert.equal(e.confirmacioEsperada('1.2.16', '21', { canal: 'alpha', sha256: sha }), 'alpha:1.2.16+21', 'alpha no porta sha12');
  const val = (text, canal) => e.analitzaConfirmacio(text, { versio: '1.2.16', build: '21', canal }).valida;
  assert.equal(val('alpha:1.2.16+21', 'alpha'), true);
  for (const dolent of ['1.2.16+21', `produccio:1.2.16+21@${sha.slice(0, 12)}`, 'alpha:1.2.16+22', 'alpha:1.2.15+21', ' alpha:1.2.16+21', 'alpha:1.2.16+21 ', 'ALPHA:1.2.16+21']) {
    assert.equal(val(dolent, 'alpha'), false, dolent);
  }
  assert.equal(val('alpha:1.2.16+21', 'intern'), false, 'un «sí» d\'alpha no val per a la prova interna');
  assert.equal(val('alpha:1.2.16+21', 'produccio'), false, 'ni per a producció');
  assert.equal(val('1.2.16+21', 'intern'), true, 'l\'intern, com sempre');
});

test('v1.2.16 · entorn: el registre de pujades entén alpha i la monotonia promou d\'intern a alpha i d\'alpha a producció', () => {
  const linia = (canal, build) => JSON.stringify({ plataforma: 'android', canal, versio: '1.2.16', build, data: '2026-11-21T02:00:00Z' });
  const { entrades, errors } = e.analitzaRegistre([linia('intern', 20), linia('alpha', 21)].join('\n'));
  assert.deepEqual(errors, []);
  assert.deepEqual(entrades.map((x) => x.canal), ['intern', 'alpha']);
  const problema = (canal, build) => e.problemaDeMonotonia({ plataforma: 'android', canal, versio: '1.2.16', build: String(build) }, entrades);
  assert.match(problema('alpha', 20), /el build 20 ja és a la prova interna .*promou-lo des de Play Console \(RUNBOOK P9\) a la prova tancada \(alpha\)/);
  assert.match(problema('produccio', 21), /el build 21 ja és a la prova tancada \(alpha\) .*promou-lo des de Play Console \(RUNBOOK P9\) a la pista production/);
  assert.match(problema('alpha', 21), /el build 21 ja s'ha pujat \(alpha, .*cada pujada porta un build nou/);
  assert.match(problema('intern', 21), /ja s'ha pujat \(alpha/, 'd\'un canal més obert a un de més tancat, no es repuja');
  assert.equal(problema('alpha', 22), null);
  // I l'iOS, com sempre: cap entrada d'alpha hi pot ser, i la d'intern a producció s'adjunta.
  const iosIntern = e.analitzaRegistre(JSON.stringify({ plataforma: 'ios', canal: 'intern', versio: '1.2.16', build: 21 })).entrades;
  assert.match(e.problemaDeMonotonia({ plataforma: 'ios', canal: 'produccio', versio: '1.2.16', build: '21' }, iosIntern), /adjunta'l a la versió de l'App Store/);
  // La guarda del registre: alpha és com intern (sense SDP_BUILDS_DIR, un avís i no para).
  const guarda = e.guardaDelRegistre({ arrel: TEMPORAL, valors: {}, canal: 'alpha', plataforma: 'android', versio: '1.2.16', build: '21' });
  assert.equal(guarda.codi, e.EIXIDA.BE);
  assert.match(guarda.avisos[0], /falta SDP_BUILDS_DIR/);
});

/* ───────────── puja-android.mjs: la pista alpha ───────────── */

test('v1.2.16 · puja-android: PISTES.alpha = alpha; el pla d\'alpha és draft o, amb --desplega, completed; producció mai completed', () => {
  assert.deepEqual(android.PISTES, { intern: 'internal', produccio: 'production', alpha: 'alpha' });
  const valors = { SDP_APP_ID: 'org.socdepoble.app', SDP_PLAY_JSON_KEY_PATH: '/fora/play.json' };
  const pla = (mes) => android.planAndroid({ arrel: TEMPORAL, valors, ...mes });
  assert.deepEqual([pla({ canal: 'alpha' }).pista, pla({ canal: 'alpha' }).estat], ['alpha', 'draft']);
  assert.deepEqual([pla({ canal: 'alpha', desplega: true }).pista, pla({ canal: 'alpha', desplega: true }).estat], ['alpha', 'completed']);
  // El canal intern, com sempre.
  assert.deepEqual([pla({}).pista, pla({}).estat, pla({ desplega: true }).estat], ['internal', 'draft', 'completed']);
  // Producció: sempre esborrany, també amb --desplega.
  assert.deepEqual([pla({ canal: 'produccio', desplega: true }).pista, pla({ canal: 'produccio', desplega: true }).estat], ['production', 'draft']);
  assert.throws(() => pla({ canal: 'beta' }), /--canal ha de ser intern o produccio, o alpha/);
  assert.match(android.mostraPlaApi(pla({ canal: 'alpha', desplega: true })), /edits\.tracks\.update \(pista alpha, estat completed\)/);
  // El rebut diu la pista tancada.
  const rebut = android.rebut({ segell: null, versio: '1.2.16', build: '21', aab: path.join(TEMPORAL, 'no-hi-es.aab'), pujat: true, canal: 'alpha', estat: 'completed' });
  assert.match(rebut, /pujat a Google Play \(desplegat, pista alpha, la prova tancada\): sí/);
  assert.match(rebut, /canal: alpha/);
});

/* Un Google Play local mínim: token, insert, upload, tracks, validate, commit, delete. */
async function playLocal() {
  const crides = [];
  const servidor = http.createServer((req, res) => {
    const trossos = [];
    req.on('data', (tros) => trossos.push(tros));
    req.on('end', () => {
      const cos = Buffer.concat(trossos);
      crides.push({ metode: req.method, url: req.url, cos: cos.length < 4096 ? cos.toString('utf8') : `<${cos.length} B>` });
      const respon = (estat, dades) => {
        res.writeHead(estat, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(dades === undefined ? '' : JSON.stringify(dades));
      };
      if (req.url === '/token') return respon(200, { access_token: 'ya29.' + 'NOMES_PROVA_LOCAL', token_type: 'Bearer' });
      if (req.method === 'POST' && /\/edits$/.test(req.url)) return respon(200, { id: 'e1' });
      if (req.url.startsWith('/pujada/')) return respon(200, { versionCode: 21, sha256: sha256(cos) });
      if (req.method === 'PUT') return respon(200, JSON.parse(cos.toString('utf8')));
      if (req.method === 'POST' && /:(validate|commit)$/.test(req.url)) return respon(200, { id: 'e1' });
      if (req.method === 'DELETE') return respon(204);
      return respon(404, { error: { code: 404, message: 'ruta desconeguda' } });
    });
  });
  await new Promise((resol) => { servidor.listen(0, '127.0.0.1', resol); });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return {
    crides,
    endpoints: { token: `${base}/token`, api: `${base}/api`, pujada: `${base}/pujada` },
    tanca: () => new Promise((resol) => { servidor.closeAllConnections(); servidor.close(resol); })
  };
}

test('v1.2.16 · pujaAPlay: l\'AAB va a la pista alpha amb status completed; production+completed para abans de cap petició', async () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const clau = p.analitzaClauPlay(JSON.stringify({
    type: 'service_account', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), client_email: 'robot@sdp-proves-v1216.iam.gserviceaccount.com', private_key_id: 'a'.repeat(40)
  }));
  assert.equal(clau.valida, true);
  const aab = path.join(TEMPORAL, 'app-release.aab');
  const octets = crypto.randomBytes(64 * 1024);
  fs.writeFileSync(aab, octets);
  const play = await playLocal();
  const opcions = (mes) => ({
    clau: clau.clau, paquet: 'org.socdepoble.app', aab, sha256: sha256(octets), build: '21', nomVersio: '1.2.16 (21)',
    endpoints: play.endpoints, temps: { peticio: 3_000, pujada: 10_000 }, reintents: { intents: 1, esperaMs: 1 }, espera: async () => {}, registra: () => {}, ...mes
  });
  try {
    const fet = await android.pujaAPlay(opcions({ pista: 'alpha', estat: 'completed' }));
    assert.deepEqual([fet.pujat, fet.pista, fet.estat], [true, 'alpha', 'completed']);
    const pista = play.crides.find((c) => c.metode === 'PUT');
    assert.match(pista.url, /\/edits\/e1\/tracks\/alpha$/);
    assert.deepEqual(JSON.parse(pista.cos), { track: 'alpha', releases: [{ name: '1.2.16 (21)', versionCodes: ['21'], status: 'completed' }] });
    assert.ok(play.crides.some((c) => /:commit$/.test(c.url)), 'un commit');
    // La guarda de producció, intacta: cap petició (ni el token) abans de dir que no.
    play.crides.length = 0;
    await assert.rejects(android.pujaAPlay(opcions({ pista: 'production', estat: 'completed' })), (error) => error.tipus === 'us' && /a producció el llançament és sempre un esborrany/.test(error.message));
    await assert.rejects(android.pujaAPlay(opcions({ pista: 'beta', estat: 'draft' })), (error) => error.tipus === 'us');
    assert.deepEqual(play.crides, [], 'cap petició a Play');
  } finally {
    await play.tanca();
  }
});

test('v1.2.16 · puja-android main: les guardes d\'alpha paren abans de tocar res (cap preflight, cap eina, cap Play)', async () => {
  const cas = async (args, codi, motiu) => {
    const r = await ambPantalla(() => android.main(['--versio', '1.2.16', '--build', '21', ...args], { env: NO_HI_ES, play: { pujaAPlay: async () => { throw new Error('no s\'havia de cridar'); } } }));
    assert.equal(r.codi, codi, `${args.join(' ')}: ${r.vist}`);
    assert.match(r.vist, motiu, args.join(' '));
    assert.doesNotMatch(r.vist, /Fitxer d'entorn/, 'cap preflight');
  };
  await cas(['--canal', 'beta'], e.EIXIDA.US, /--canal ha de ser intern o produccio, o alpha/);
  await cas(['--canal', 'alpha', '--desplega', '--confirma=1.2.16+21'], e.EIXIDA.CONFIRMACIO, /--confirma ha de ser exactament alpha:1\.2\.16\+21.*un «sí» intern o de producció no val per a alpha/);
  await cas(['--canal', 'alpha', '--confirma=produccio:1.2.16+21@abcdef012345'], e.EIXIDA.CONFIRMACIO, /exactament alpha:1\.2\.16\+21/);
  await cas(['--confirma=alpha:1.2.16+21'], e.EIXIDA.CONFIRMACIO, /este és un «sí» de la prova tancada: va amb --canal alpha/);
  await cas(['--canal', 'produccio', '--desplega'], e.EIXIDA.US, /--desplega només val per a la prova interna o la tancada \(alpha\): a producció el llançament és sempre un ESBORRANY/);
  const ajuda = await ambPantalla(() => android.main(['--ajuda']));
  assert.match(ajuda.vist, /--canal intern\|alpha\|produccio/);
  assert.match(ajuda.vist, /--confirma=alpha:X\.Y\.Z\+N/);
});

test('v1.2.16 · iOS i preflight: alpha no és d\'iOS (TestFlight és el canal intern); amb Android, el preflight l\'accepta', async () => {
  const r = await ambPantalla(() => ios.main(['--versio', '1.2.16', '--build', '21', '--canal', 'alpha']));
  assert.equal(r.codi, e.EIXIDA.US, r.vist);
  assert.match(r.vist, /--canal ha de ser intern o produccio \(alpha és només la prova tancada de Google Play.*TestFlight/);
  const preflight = (...args) => spawnSync(process.execPath, [path.join(ARREL, 'scripts/botigues/preflight.mjs'), ...args],
    { encoding: 'utf8', cwd: TEMPORAL, env: { ...process.env, ...NO_HI_ES } });
  const senseIos = preflight('--plataforma', 'ios', '--canal', 'alpha');
  assert.equal(senseIos.status, e.EIXIDA.US, senseIos.stderr);
  assert.match(senseIos.stderr, /alpha és només la prova tancada de Google Play/);
  assert.equal(preflight('--plataforma', 'totes', '--canal', 'alpha').status, e.EIXIDA.US, 'totes porta iOS');
  // Amb Android el canal passa: el preflight arriba al fitxer d'entorn (que no hi és, eixida 3).
  const ambAndroid = preflight('--plataforma', 'android', '--canal', 'alpha');
  assert.notEqual(ambAndroid.status, e.EIXIDA.US, ambAndroid.stderr);
  assert.match(ambAndroid.stdout, /Fitxer d'entorn/);
  assert.match(preflight('--ajuda').stdout, /--canal alpha: la prova tancada de Google Play/);
});

/* ───────────── publica-tot.mjs: alpha i ZERO APK ───────────── */

test('v1.2.16 · publica-tot: el pla d\'alpha puja l\'AAB a la pista alpha amb --desplega, iOS va a TestFlight (intern) i cap pas d\'APK', () => {
  const resum = publica.resumOmnicanal(ARREL, { versio: '1.2.16', build: '21', plataforma: 'totes', canal: 'alpha', env: NO_HI_ES });
  const ordres = resum.passos.map((pas) => pas.ordre);
  assert.ok(ordres.includes('node scripts/botigues/publica-tot.mjs --versio 1.2.16 --build 21 --plataforma android --canal alpha --compila'), ordres.join('\n'));
  assert.ok(ordres.includes('node scripts/botigues/puja-android.mjs --versio 1.2.16 --build 21 --canal alpha --desplega --confirma=<«sí» del Mestre>'), ordres.join('\n'));
  assert.ok(ordres.includes('node scripts/botigues/puja-ios.mjs --versio 1.2.16 --build 21 --canal intern --compila'), 'iOS: TestFlight, el canal intern');
  const pujada = resum.passos.find((pas) => pas.ordre.includes('puja-android.mjs'));
  assert.match(pujada.accio, /API REST v3 \(pista alpha, esborrany; --desplega la deixa desplegada \(completed\) per als verificadors de la prova tancada\)/);
  // Alpha no s'anuncia a ard.json (androidBuild és per a tots els Android: només production «completed»).
  assert.ok(!ordres.some((ordre) => ordre.includes('--sincronitza-ard')), 'cap --sincronitza-ard a alpha');
  assert.ok(ordres.some((ordre) => /--sincronitza-proves --versio 1\.2\.16 --build-testflight 21$/.test(ordre)), 'TestFlight sí');
  // A cada canal i plataforma, cap ordre ni pas d'APK directe.
  for (const canal of ['intern', 'alpha', 'produccio']) {
    for (const plataforma of ['totes', 'android', 'web', 'wordpress']) {
      const r = publica.resumOmnicanal(ARREL, { versio: '1.2.16', build: '21', plataforma, canal, env: NO_HI_ES });
      for (const pas of r.passos) {
        assert.doesNotMatch(pas.ordre, /apk|assembleRelease|descarregues/i, `${canal}/${plataforma}: ${pas.ordre}`);
        assert.doesNotMatch(pas.accio, /APK directe|descarregues|apkDirectBuild|instal·lació directa/i, `${canal}/${plataforma}: ${pas.accio}`);
      }
      assert.deepEqual(r.apkDirecte, { actiu: false, motiu: publica.MOTIU_APK_APAGAT });
    }
  }
});

test('v1.2.16 · publica-tot main: --canal alpha amb iOS es refusa, --desplega passa a alpha, i --publica-apk i --build-apk es refusen sense tocar res', { skip: SENSE_REPOSITORI }, async () => {
  let r = await ambPantalla(() => publica.main(['--versio', '1.2.16', '--build', '21', '--plataforma', 'ios', '--canal', 'alpha'], { env: NO_HI_ES }));
  assert.equal(r.codi, e.EIXIDA.US, r.vist);
  assert.match(r.vist, /alpha és només la prova tancada de Google Play/);
  r = await ambPantalla(() => publica.main(['--versio', '1.2.16', '--build', '21', '--plataforma', 'android', '--canal', 'beta'], { env: NO_HI_ES }));
  assert.equal(r.codi, e.EIXIDA.US);
  assert.match(r.vist, /--canal ha de ser intern o produccio, o alpha/);
  r = await ambPantalla(() => publica.main(['--versio', '1.2.16', '--build', '21', '--plataforma', 'ios', '--desplega', '--compila'], { env: NO_HI_ES }));
  assert.match(r.vist, /--desplega només és d’Android \(la prova interna o la tancada, alpha, de Google Play\)/);
  const manifest = path.join(TEMPORAL, 'ard-apk.json');
  const inicial = '{"version":"1.0.0","androidBuild":1,"entries":[]}\n';
  fs.writeFileSync(manifest, inicial);
  for (const args of [
    ['--publica-apk', '--versio', '1.2.16', '--build', '21'],
    ['--publica-apk'],
    ['--sincronitza-proves', '--versio', '1.2.16', '--build-apk', '21'],
    ['--sincronitza-proves', '--versio', '1.2.16', '--build-testflight', '21', '--build-apk', '21'],
    ['--build-apk', '21']
  ]) {
    r = await ambPantalla(() => publica.main(args, { env: NO_HI_ES, manifest, manifestDist: manifest }));
    assert.equal(r.codi, e.EIXIDA.US, args.join(' '));
    assert.match(r.vist, /ZERO APK fora de botiga \(ordre del Mestre 261121\)/, args.join(' '));
    assert.doesNotMatch(r.vist, /Fitxer d'entorn|no hi ha cap fitxer d'entorn/, 'cap entorn llegit');
  }
  assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'ard.json no canvia');
  const ajuda = await ambPantalla(() => publica.main(['--ajuda']));
  assert.doesNotMatch(ajuda.vist, /--publica-apk|--build-apk/, 'l\'ajuda no oferix cap APK');
  assert.match(ajuda.vist, /--canal intern\|alpha\|produccio/);
});

test('v1.2.16 · ZERO APK: el manifest no anuncia cap APK i cap script de botigues compila, signa, copia ni oferix cap APK', () => {
  assert.throws(() => publica.sincronitzaManifestProves('{"entries":[]}', { versio: '1.2.16', testflightIosBuild: 21, apkDirectBuild: 21, apkSha256: 'a'.repeat(64) }), /ZERO APK fora de botiga/);
  const heretat = `${JSON.stringify({ version: '1.2.15', androidBuild: 1, iosBuild: 1, apkDirectBuild: 20, apkSha256: 'b'.repeat(64), latestBuild: 20, entries: [] })}\n`;
  const net = JSON.parse(publica.sincronitzaManifestVersio(heretat, { versio: '1.2.16', iosBuild: 21, maximBuild: 30 }));
  assert.deepEqual(Object.keys(net), ['version', 'androidBuild', 'iosBuild', 'latestBuild', 'entries']);
  assert.equal(net.latestBuild, 21);
  assert.deepEqual(publica.CLAUS_APK_RETIRADES, ['apkDirectBuild', 'apkSha256']);
  for (const clau of publica.CLAUS_APK_RETIRADES) assert.ok(!publica.CLAUS_DE_VERSIO.includes(clau), clau);
  // Cap camí d'eina: ni gradle assembleRelease, ni l'APK de release, ni apksigner, ni una còpia a dist/descarregues.
  const carpeta = path.join(ARREL, 'scripts', 'botigues');
  for (const nom of fs.readdirSync(carpeta).filter((n) => n.endsWith('.mjs'))) {
    const text = fs.readFileSync(path.join(carpeta, nom), 'utf8');
    assert.doesNotMatch(text, /assembleRelease|app-release\.apk|'outputs', 'apk'|apksigner/, nom);
    assert.doesNotMatch(text, /DESCARREGUES_DIST|publicaApkDirecte|compilaApkDirecte/, nom);
  }
  for (const nom of ['publicaApkDirecte', 'compilaApkDirecte', 'empremtaDeLApk', 'ORDRE_PUBLICA_APK']) assert.equal(Object.hasOwn(publica, nom), false, nom);
});

test('v1.2.16 · --sincronitza-ard: una pista alpha «completed» no és tots els Android (només production)', async () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const fitxer = path.join(TEMPORAL, 'play.json');
  fs.writeFileSync(fitxer, JSON.stringify({ type: 'service_account', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), client_email: 'robot@sdp-proves-v1216.iam.gserviceaccount.com' }), { mode: 0o600 });
  const valors = { SDP_PLAY_JSON_KEY_PATH: fitxer, SDP_APP_ID: 'org.socdepoble.app' };
  const amb = (trobats) => publica.comprovaDisponibilitat({ arrel: ARREL, valors, androidBuild: 21, consulta: async () => trobats });
  let r = await amb([{ pista: 'alpha', status: 'completed' }]);
  assert.equal(r.codi, e.EIXIDA.ARBRE);
  assert.match(r.problemes[0], /no el dona a tots els Android \(alpha: completed\)/);
  r = await amb([]);
  assert.match(r.problemes[0], /a cap pista \(internal, production, alpha\)/);
  r = await amb([{ pista: 'alpha', status: 'completed' }, { pista: 'production', status: 'completed' }]);
  assert.equal(r.codi, e.EIXIDA.BE);
});
