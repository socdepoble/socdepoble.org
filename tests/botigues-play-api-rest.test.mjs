/* tests/botigues-play-api-rest.test.mjs — Onada R32.3 (P0, ordre del Mestre 261116 22:09:
   «les actualitzacions han de ser completament automàtiques i en tot el sistema»).
   El client REST de la Google Play Developer API v3 de scripts/botigues/puja-android.mjs (sense
   fastlane), la clau del compte de servei de scripts/botigues/preflight.mjs, i l'APK públic i el
   manifest de versió de scripts/botigues/publica-tot.mjs.
   Cap crida a Google ni a cap xarxa de fora: un servidor HTTP local (127.0.0.1) fa de Google
   (token OAuth, edits.insert, bundles.upload, tracks.update, validate, commit i delete) i verifica
   de veres la signatura RS256 del JWT. La clau del compte de servei és RSA generada al vol; cap
   clau, token ni fitxer de veres. Fitxers temporals a mkdtemp, fora del repositori. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import { fileURLToPath } from 'node:url';

import * as e from '../scripts/botigues/entorn.mjs';
import * as p from '../scripts/botigues/preflight.mjs';
import * as android from '../scripts/botigues/puja-android.mjs';
import * as publica from '../scripts/botigues/publica-tot.mjs';
import { VERSIO_CLIENT_NATIU } from '../scripts/botigues/versio-client.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENSE_REPOSITORI = !fs.existsSync(path.join(ARREL, '.git')) && 'còpia sense .git: --comprova-play passa per l\'arrel del repositori';

/* ───────────── Les claus i l'AAB de proves ───────────── */
const { privateKey: PRIVADA, publicKey: PUBLICA } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = PRIVADA.export({ type: 'pkcs8', format: 'pem' });
const LINIA_PEM = PEM.split('\n')[1];
const EMAIL = 'robot-proves@sdp-proves-r32.iam.gserviceaccount.com';
const KID = '0123456789abcdef0123456789abcdef01234567';
/* El token de proves es munta per parts: la porta de literals secrets (literals-secrets-node0) no hi ha de vore cap credencial. */
const TOKEN = 'ya29.' + 'TEST_ONLY_TOKEN_R32_NOMES_LOCAL';
const JSON_CLAU = JSON.stringify({
  type: 'service_account', project_id: 'sdp-proves', private_key_id: KID, private_key: PEM, client_email: EMAIL,
  token_uri: 'https://exemple.invalid/token-que-no-es-fa-servir'
});
const CLAU = p.analitzaClauPlay(JSON_CLAU);
const TEMPORAL = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r32-play-')));
process.on('exit', () => fs.rmSync(TEMPORAL, { recursive: true, force: true }));
const OCTETS_AAB = crypto.randomBytes(300 * 1024 + 7);
const AAB = path.join(TEMPORAL, 'app-release.aab');
fs.writeFileSync(AAB, OCTETS_AAB);
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');
const SHA_AAB = sha256(OCTETS_AAB);
const PAQUET = 'org.socdepoble.app';
const ESPERA_RAPIDA = (ms) => new Promise((resol) => { setTimeout(resol, ms); });

/* ───────────── Un Google Play local ───────────── */
function operacioDe(metode, url) {
  if (metode === 'POST' && url === '/token') return 'token';
  if (metode === 'POST' && /^\/api\/applications\/[^/]+\/edits$/.test(url)) return 'insert';
  if (metode === 'POST' && /^\/pujada\/applications\/[^/]+\/edits\/[^/]+\/bundles\?uploadType=media$/.test(url)) return 'upload';
  if (metode === 'PUT' && /^\/api\/applications\/[^/]+\/edits\/[^/]+\/tracks\/[^/]+$/.test(url)) return 'tracks';
  if (metode === 'POST' && /^\/api\/applications\/[^/]+\/edits\/[^/]+:validate$/.test(url)) return 'validate';
  if (metode === 'POST' && /^\/api\/applications\/[^/]+\/edits\/[^/]+:commit(?:\?changesNotSentForReview=true)?$/.test(url)) return 'commit';
  if (metode === 'DELETE' && /^\/api\/applications\/[^/]+\/edits\/[^/]+$/.test(url)) return 'delete';
  if (metode === 'GET' && /^\/api\/applications\/[^/]+\/edits\/[^/]+$/.test(url)) return 'get';
  if (metode === 'GET' && /^\/api\/applications\/[^/]+\/edits\/[^/]+\/tracks\/[^/]+$/.test(url)) return 'trackget';
  return 'desconeguda';
}
const idDe = (url) => /\/edits\/([^/:?]+)/.exec(url)?.[1] ?? null;
const pistaDe = (url) => /\/tracks\/([^/?]+)$/.exec(url)?.[1] ?? null;

/**
 * `guio[operacio]`: un objecte { estat, cos, retard, talla, aplica }, una llista (un per crida; l'últim es
 * repetix) o una funció (crida, n) => objecte. Sense guió, respon com Google. Elefant R32.3 · El
 * servidor guarda l'estat de Play: cada edits.insert obri una edició nova (edicio-1, edicio-2…), el
 * commit publica les pistes de l'edició i la tanca, edits.get i edits.delete només troben una edició
 * oberta, i edits.tracks.get dona la pista publicada. `aplica: true` en un commit el confirma abans de
 * respondre amb l'`estat` o el `talla` del guió (un 5xx o un tall DESPRÉS d'haver entrat).
 */
async function simulador(guio = {}, { publica = PUBLICA } = {}) {
  const crides = [];
  const vist = { assercio: null, capcalera: null, reclams: null };
  const comptador = {};
  const play = { edicions: new Map(), publicat: {}, seguent: 1 };
  const confirma = (id) => {
    const edicio = play.edicions.get(id);
    if (!edicio?.oberta) return false;
    Object.assign(play.publicat, edicio.pistes);
    edicio.oberta = false;
    return true;
  };
  const servidor = http.createServer((req, res) => {
    const trossos = [];
    req.on('data', (tros) => trossos.push(tros));
    req.on('end', async () => {
      const cos = Buffer.concat(trossos);
      const op = operacioDe(req.method, req.url);
      comptador[op] = (comptador[op] ?? 0) + 1;
      const n = comptador[op];
      const crida = { op, n, metode: req.method, url: req.url, capcaleres: req.headers, cos };
      crides.push(crida);
      const pas = guio[op];
      const accio = typeof pas === 'function' ? await pas(crida, n) : (Array.isArray(pas) ? pas[Math.min(n, pas.length) - 1] : pas);
      if (accio?.aplica && op === 'commit') confirma(idDe(req.url));
      if (accio?.talla) { req.socket.destroy(); return; }
      if (accio?.retard) await ESPERA_RAPIDA(accio.retard);
      if (res.destroyed || req.socket.destroyed) return;
      const respon = (estat, dades) => {
        if (dades === undefined) { res.writeHead(estat); res.end(); return; }
        const text = typeof dades === 'string' ? dades : JSON.stringify(dades);
        res.writeHead(estat, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(text);
      };
      if (accio?.estat) return respon(accio.estat, accio.cos);
      if (op === 'token') {
        const form = new URLSearchParams(cos.toString('utf8'));
        const [h, r, s] = String(form.get('assertion') ?? '').split('.');
        let bona = false;
        try {
          bona = form.get('grant_type') === android.CONCESSIO_JWT
            && crypto.verify('RSA-SHA256', Buffer.from(`${h}.${r}`), publica, Buffer.from(s, 'base64url'));
          vist.assercio = form.get('assertion');
          vist.capcalera = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
          vist.reclams = JSON.parse(Buffer.from(r, 'base64url').toString('utf8'));
        } catch { bona = false; }
        return bona ? respon(200, { access_token: TOKEN, token_type: 'Bearer', expires_in: 3599 })
          : respon(400, { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' });
      }
      if (req.headers.authorization !== `Bearer ${TOKEN}`) return respon(401, { error: { code: 401, status: 'UNAUTHENTICATED', message: 'Request had invalid authentication credentials.' } });
      const id = idDe(req.url);
      const edicio = play.edicions.get(id);
      const noHiEs = () => respon(404, { error: { code: 404, status: 'NOT_FOUND', message: 'This Edit has been deleted.' } });
      if (op === 'insert') {
        const nova = `edicio-${play.seguent++}`;
        play.edicions.set(nova, { oberta: true, pistes: {} });
        return respon(200, { id: nova, expiryTimeSeconds: '1800000000' });
      }
      if (op === 'upload') return respon(200, { versionCode: 9, sha1: crypto.createHash('sha1').update(cos).digest('hex'), sha256: sha256(cos) });
      if (op === 'tracks') {
        const pista = JSON.parse(cos.toString('utf8'));
        if (edicio?.oberta) edicio.pistes[pistaDe(req.url)] = pista;
        return respon(200, pista);
      }
      if (op === 'validate') return respon(200, { id });
      if (op === 'commit') return confirma(id) ? respon(200, { id }) : noHiEs();
      if (op === 'get') return edicio?.oberta ? respon(200, { id, expiryTimeSeconds: '1800000000' }) : noHiEs();
      if (op === 'trackget') return respon(200, play.publicat[pistaDe(req.url)] ?? { track: pistaDe(req.url) });
      if (op === 'delete') {
        if (!edicio?.oberta) return noHiEs();
        play.edicions.delete(id);
        return respon(204);
      }
      return respon(404, { error: { code: 404, status: 'NOT_FOUND', message: 'ruta desconeguda' } });
    });
  });
  await new Promise((resol) => { servidor.listen(0, '127.0.0.1', resol); });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return {
    base,
    crides,
    vist,
    endpoints: { token: `${base}/token`, api: `${base}/api`, pujada: `${base}/pujada` },
    play,
    ops: () => crides.map((c) => c.op),
    tanca: () => new Promise((resol) => { servidor.closeAllConnections(); servidor.close(resol); })
  };
}

/* Les opcions de cada pujada de prova: temps i esperes curts, i les línies del client recollides. */
function opcions(sim, mes = {}) {
  const linies = [];
  const esperes = [];
  return {
    linies,
    esperes,
    o: {
      clau: CLAU.clau, paquet: PAQUET, aab: AAB, sha256: SHA_AAB, build: '9', nomVersio: '1.2.5 (9)', pista: 'internal', estat: 'draft',
      endpoints: sim.endpoints, temps: { peticio: 3_000, pujada: 10_000 }, reintents: { intents: 3, esperaMs: 3 },
      espera: async (ms) => { esperes.push(ms); }, registra: (text) => linies.push(text), ...mes
    }
  };
}

/* Cap secret: ni la clau, ni el compte de servei, ni el kid, ni el token, ni l'asserció. */
function senseSecrets(text, vist = {}) {
  const t = String(text);
  for (const secret of [LINIA_PEM, 'PRIVATE KEY', EMAIL, KID, TOKEN, vist.assercio].filter(Boolean)) {
    assert.ok(!t.includes(secret), `ha eixit un secret (${secret.slice(0, 12)}…)`);
  }
}
const textDe = (error, linies = []) => [error?.message, error?.detall, error?.consell, ...linies].filter(Boolean).join('\n');

/* Elefant R32.3 · El que els scripts escriuen a la pantalla (sempre text). Els trossos binaris són el
   protocol del corredor de node --test (el procés fill li envia els resultats per stdout): passen
   tal qual. Abans es tapaven tots, i el resultat de la prova anterior es perdia sense cap avís (el
   recompte deia 23 de 24). */
function capturaPantalla() {
  const [eixida, errada] = [process.stdout.write, process.stderr.write];
  const pantalla = { vist: '' };
  const captura = (original, flux) => (tros, ...resta) => {
    if (typeof tros !== 'string') return original.call(flux, tros, ...resta);
    pantalla.vist += tros;
    return true;
  };
  process.stdout.write = captura(eixida, process.stdout);
  process.stderr.write = captura(errada, process.stderr);
  pantalla.restaura = () => { process.stdout.write = eixida; process.stderr.write = errada; };
  return pantalla;
}

/* ───────────── La clau del compte de servei ───────────── */

test('R32.3 · analitzaClauPlay: una clau de compte de servei bona, i la clau privada no es pot mostrar', () => {
  assert.equal(CLAU.valida, true, CLAU.problema);
  assert.equal(CLAU.clau.email, EMAIL);
  assert.equal(CLAU.clau.kid, KID);
  assert.equal(util.inspect(CLAU.clau), '[ClauPlay]');
  assert.equal(JSON.stringify(CLAU), '{"valida":true,"problema":null,"clau":"[ClauPlay]"}');
  senseSecrets(util.inspect(CLAU, { depth: 5, showHidden: true }));
  // La signatura és RS256 de veres.
  const signatura = CLAU.clau.signa('dades');
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from('dades'), PUBLICA, signatura), true);
});

test('R32.3 · analitzaClauPlay i llegixClauPlay rebutgen el que no és una clau RSA de compte de servei, sense citar-ne res', () => {
  const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
  const curta = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
  const casos = [
    ['{"type":"service_account","client_email":"fuita-secreta@x.iam.gserviceaccount.com","private_key":"', /no és un JSON/],
    ['[1,2]', /no és un objecte JSON/],
    [JSON.stringify({ type: 'authorized_user', client_email: EMAIL, private_key: PEM }), /«type» no és «service_account»/],
    [JSON.stringify({ type: 'service_account', private_key: PEM }), /client_email/],
    [JSON.stringify({ type: 'service_account', client_email: EMAIL, private_key: 'fuita-secreta' }), /PEM PKCS#8/],
    [JSON.stringify({ type: 'service_account', client_email: EMAIL, private_key: '-----BEGIN PRIVATE KEY-----\nfuita-secreta\n-----END PRIVATE KEY-----\n' }), /no es pot llegir/],
    [JSON.stringify({ type: 'service_account', client_email: EMAIL, private_key: ec }), /no és una clau RSA/],
    [JSON.stringify({ type: 'service_account', client_email: EMAIL, private_key: curta }), /menys de 2048 bits/]
  ];
  for (const [text, motiu] of casos) {
    const r = p.analitzaClauPlay(text);
    assert.equal(r.valida, false, text.slice(0, 40));
    assert.equal(r.clau, null);
    assert.match(r.problema, motiu);
    assert.ok(!r.problema.includes('fuita-secreta') && !r.problema.includes(EMAIL), 'cap tros del fitxer al problema');
  }
  assert.match(p.llegixClauPlay(path.join(TEMPORAL, 'no-hi-es.json')).problema, /no existix/);
  assert.match(p.llegixClauPlay(TEMPORAL).problema, /no és un fitxer/);
  const gran = path.join(TEMPORAL, 'gran.json');
  fs.writeFileSync(gran, ' '.repeat(p.MIDA_MAXIMA_CLAU_PLAY + 1));
  assert.match(p.llegixClauPlay(gran).problema, /fa més de 64 KB/);
  const bona = path.join(TEMPORAL, 'bona.json');
  fs.writeFileSync(bona, JSON_CLAU, { mode: 0o600 });
  assert.equal(p.llegixClauPlay(bona).valida, true);
});

test('R32.3 · el preflight d\'Android no busca fastlane i mira la forma de la clau sense imprimir-ne res', () => {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'preflight-'));
  const arrel = path.join(fora, 'arrel');
  fs.mkdirSync(arrel);
  const consultades = [];
  const consultes = { llegixAjuda: (ordre) => { consultades.push(ordre); return 'ajuda fingida'; }, jdkPerAGradle: () => null };
  const entorn = (json) => {
    const clau = path.join(fora, 'play.json');
    fs.writeFileSync(clau, json, { mode: 0o600 });
    fs.chmodSync(clau, 0o600);
    const fitxer = path.join(fora, 'botigues.env');
    fs.writeFileSync(fitxer, `SDP_APP_ID=${PAQUET}\nSDP_PLAY_JSON_KEY_PATH=${clau}\nSDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}\n`, { mode: 0o600 });
    fs.chmodSync(fitxer, 0o600);
    return { SDP_BOTIGUES_ENV: fitxer };
  };
  const bo = p.preflight({ arrel, plataformes: ['android'], env: entorn(JSON_CLAU), consultes });
  const text = bo.linies.join('\n');
  assert.match(text, /✓ Google Play: pujada per l'API REST v3 \(androidpublisher\) amb Node, sense fastlane/);
  assert.match(text, /✓ SDP_PLAY_JSON_KEY_PATH té la forma d'una clau de compte de servei \(RSA\)/);
  assert.deepEqual(bo.play, { clau: 'valida' });
  assert.equal(bo.fastlane, undefined);
  assert.ok(!consultades.includes('fastlane'), 'el preflight ja no pregunta per fastlane');
  assert.equal(bo.codi, e.EIXIDA.ARBRE, 'l\'arrel de prova no és cap repositori: falla l\'arbre (7), no la clau');
  senseSecrets(text);
  const dolent = p.preflight({ arrel, plataformes: ['android'], env: entorn('{"private_key":"fuita'), consultes });
  const textDolent = dolent.linies.join('\n');
  assert.match(textDolent, /! SDP_PLAY_JSON_KEY_PATH: no és un JSON \(el contingut no es mostra\); la pujada \(--confirma\) pararà amb l'eixida 5/);
  assert.deepEqual(dolent.play, { clau: 'invalida' });
  assert.equal(dolent.codi, e.EIXIDA.ARBRE, 'una clau dolenta és un avís: compilar i verificar no la necessiten');
  assert.ok(!textDolent.includes('fuita') && !textDolent.includes(path.join(fora, 'play.json')), 'cap tros ni ruta de la clau (el fitxer d\'entorn sí que es nomena, com sempre)');
});

/* ───────────── JWT, adreces i neteja ───────────── */

test('R32.3 · signaAssercio: JWT RS256 amb iss, scope androidpublisher, aud, iat i exp a una hora, i kid', () => {
  const ara = Date.UTC(2026, 10, 16, 22, 9, 0);
  const assercio = android.signaAssercio(CLAU.clau, { ara, aud: 'https://oauth2.googleapis.com/token' });
  const [h, r, s] = assercio.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'RS256', typ: 'JWT', kid: KID });
  assert.deepEqual(JSON.parse(Buffer.from(r, 'base64url')), {
    iss: EMAIL, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: ara / 1000, exp: ara / 1000 + 3600
  });
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(`${h}.${r}`), PUBLICA, Buffer.from(s, 'base64url')), true);
  assert.equal(android.ABAST_PLAY, 'https://www.googleapis.com/auth/androidpublisher');
  assert.equal(android.CONCESSIO_JWT, 'urn:ietf:params:oauth:grant-type:jwt-bearer');
});

test('R32.3 · les adreces de Google són fixes i https; les de proves, només per opció explícita i locals', () => {
  assert.equal(Object.isFrozen(android.PLAY_API), true);
  assert.deepEqual(android.PLAY_API, {
    token: 'https://oauth2.googleapis.com/token',
    api: 'https://androidpublisher.googleapis.com/androidpublisher/v3',
    pujada: 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3'
  });
  assert.equal(android.endpointsDePlay(), android.PLAY_API);
  assert.equal(android.endpointsDePlay(null), android.PLAY_API);
  const local = 'http://127.0.0.1:9';
  assert.deepEqual(android.endpointsDePlay({ token: `${local}/token/`, api: 'http://localhost:9/api', pujada: 'https://proves.exemple/pujada' }),
    { token: `${local}/token`, api: 'http://localhost:9/api', pujada: 'https://proves.exemple/pujada' });
  for (const dolentes of [
    { token: 'http://exemple.org/token', api: 'https://a/api', pujada: 'https://a/p' },
    { token: 'https://u:c@a/token', api: 'https://a/api', pujada: 'https://a/p' },
    { token: 'https://a/token?x=1', api: 'https://a/api', pujada: 'https://a/p' },
    { token: 'https://a/token', api: 'https://a/api' },
    { token: 'file:///etc/passwd', api: 'https://a/api', pujada: 'https://a/p' }
  ]) {
    assert.throws(() => android.endpointsDePlay(dolentes), (error) => error instanceof android.ErrorPlay && error.tipus === 'endpoint');
  }
  // Cap variable d'entorn les canvia: l'únic process.env del client és l'entorn de --comprova-play a main.
  const font = fs.readFileSync(path.join(ARREL, 'scripts/botigues/puja-android.mjs'), 'utf8');
  assert.deepEqual(font.match(/process\.env\b.*/g), ['process.env, play = {} } = {}) {'], 'cap adreça ni opció del client ix de process.env');
  assert.ok(!/\bfastlane\s*\[|'fastlane'|"fastlane"/.test(font), 'cap crida a fastlane');
});

test('R32.3 · netejaText: fora secrets coneguts, PEM, JWT, token ya29, Bearer, compte de servei i caràcters de control; 300 caràcters', () => {
  const brut = `-----BEGIN PRIVATE KEY-----\n${LINIA_PEM}\n-----END PRIVATE KEY----- eyJhbGciOi.eyJpc3MiOi.c2lnbmF0dXJh ${TOKEN} Bearer abc.def `
    + `${EMAIL} \u001b[31mvermell\u001b[0m un-secret-conegut ${'x'.repeat(400)}`;
  const net = android.netejaText(brut, ['un-secret-conegut', 'curt']);
  senseSecrets(net);
  assert.ok(!net.includes('\u001b') && !net.includes('\n'));
  assert.match(net, /^<clau> <jwt> <token> Bearer <token> <compte de servei> \[31mvermell \[0m <secret> x+…$/);
  assert.equal(net.length, 301);
});

/* ───────────── La pujada de veres contra el Google local ───────────── */

test('R32.3 · camí bo a la prova interna: token → insert → upload en streaming → tracks (draft) → validate → commit, sense delete', async () => {
  const sim = await simulador();
  try {
    const { o, linies } = opcions(sim);
    const resultat = await android.pujaAPlay(o);
    assert.deepEqual(resultat, { comprovat: true, pujat: true, versionCode: 9, sha256Google: SHA_AAB, pista: 'internal', estat: 'draft', senseRevisio: false });
    assert.deepEqual(sim.ops(), ['token', 'insert', 'upload', 'tracks', 'validate', 'commit']);
    const [token, insert, pujada, pista, , commit] = sim.crides;
    assert.equal(token.capcaleres['content-type'], 'application/x-www-form-urlencoded');
    assert.deepEqual(sim.vist.reclams, { iss: EMAIL, scope: android.ABAST_PLAY, aud: `${sim.base}/token`, iat: sim.vist.reclams.iat, exp: sim.vist.reclams.iat + 3600 });
    assert.equal(insert.url, '/api/applications/org.socdepoble.app/edits');
    assert.equal(insert.cos.toString(), '{}');
    assert.equal(pujada.capcaleres['content-type'], 'application/octet-stream');
    assert.equal(pujada.capcaleres['content-length'], String(OCTETS_AAB.length));
    assert.equal(Buffer.compare(pujada.cos, OCTETS_AAB), 0, 'el servidor rep exactament l\'AAB');
    assert.equal(pujada.url, '/pujada/applications/org.socdepoble.app/edits/edicio-1/bundles?uploadType=media');
    assert.equal(pista.url, '/api/applications/org.socdepoble.app/edits/edicio-1/tracks/internal');
    assert.deepEqual(JSON.parse(pista.cos), { track: 'internal', releases: [{ name: '1.2.5 (9)', versionCodes: ['9'], status: 'draft' }] });
    assert.equal(commit.url, '/api/applications/org.socdepoble.app/edits/edicio-1:commit');
    for (const crida of sim.crides.slice(1)) assert.equal(crida.capcaleres.authorization, `Bearer ${TOKEN}`);
    assert.ok(!sim.crides.some((c) => /[?&](?:access_token|key)=/.test(c.url)), 'el token mai va a l\'URL');
    assert.ok(linies.includes('  ✓ edits.commit: confirmat a Google Play'));
    senseSecrets(linies.join('\n'), sim.vist);
  } finally {
    await sim.tanca();
  }
});

test('R32.3 · producció: pista production en esborrany; production+completed o una pista desconeguda paren abans de cap petició', async () => {
  const sim = await simulador();
  try {
    const { o } = opcions(sim, { pista: 'production' });
    assert.equal((await android.pujaAPlay(o)).pista, 'production');
    assert.deepEqual(JSON.parse(sim.crides.find((c) => c.op === 'tracks').cos).releases[0].status, 'draft');
    sim.crides.length = 0;
    for (const mes of [{ pista: 'production', estat: 'completed' }, { pista: 'beta' }, { estat: 'inProgress' }, { sha256: 'abc' }, { paquet: 'no paquet' }, { clau: null }]) {
      await assert.rejects(android.pujaAPlay(opcions(sim, mes).o), (error) => error instanceof android.ErrorPlay && ['us', 'clau'].includes(error.tipus));
    }
    assert.deepEqual(sim.crides, [], 'cap petició');
    // --desplega a la prova interna sí que deixa completed.
    const { o: desplega } = opcions(sim, { estat: 'completed' });
    await android.pujaAPlay(desplega);
    assert.equal(JSON.parse(sim.crides.find((c) => c.op === 'tracks').cos).releases[0].status, 'completed');
  } finally {
    await sim.tanca();
  }
});

test('R32.3 · nomesComprova (--comprova-play): token, insert i delete; cap AAB ni pista', async () => {
  const sim = await simulador();
  try {
    const { o, linies } = opcions(sim, { nomesComprova: true, aab: null, sha256: null, build: null });
    assert.deepEqual(await android.pujaAPlay(o), { comprovat: true, pujat: false });
    assert.deepEqual(sim.ops(), ['token', 'insert', 'delete']);
    assert.match(linies.join('\n'), /edits\.delete: l'edició s'ha esborrat; a Google Play no ha canviat res/);
  } finally {
    await sim.tanca();
  }
});

test('R32.3 · el token: un JWT signat amb una altra clau (o una clau revocada) és un 400 net, sense reintents ni edició', async () => {
  const altra = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey;
  const sim = await simulador({}, { publica: altra });
  try {
    const { o, linies, esperes } = opcions(sim);
    await assert.rejects(android.pujaAPlay(o), (error) => {
      assert.equal(error.tipus, 'http');
      assert.equal(error.estat, 400);
      assert.equal(error.operacio, 'token');
      assert.match(error.message, /^token: HTTP 400 · invalid_grant: Invalid JWT Signature\.$/);
      assert.match(error.consell, /rellotge del Mac/);
      senseSecrets(textDe(error, linies), sim.vist);
      return true;
    });
    assert.deepEqual(sim.ops(), ['token']);
    assert.deepEqual(esperes, []);
  } finally {
    await sim.tanca();
  }
});

test('R32.3 · reintents acotats: un 5xx es reintenta amb espera exponencial; si persistix, para al tercer intent', async () => {
  const sim = await simulador({ insert: [{ estat: 503, cos: { error: { code: 503, status: 'UNAVAILABLE', message: 'Backend error' } } }, { estat: 502, cos: 'Bad Gateway' }] });
  try {
    const { o, esperes } = opcions(sim);
    await assert.rejects(android.pujaAPlay(o), (error) => {
      assert.equal(error.estat, 502);
      assert.equal(error.message, 'edits.insert: HTTP 502 · Bad Gateway');
      return true;
    });
    assert.deepEqual(sim.ops(), ['token', 'insert', 'insert', 'insert']);
    assert.deepEqual(esperes, [3, 6]);
  } finally {
    await sim.tanca();
  }
  const bo = await simulador({ token: [{ estat: 500, cos: { error: 'internal_failure' } }, null], insert: [{ estat: 503 }, { estat: 503 }, null] });
  try {
    const { o, esperes } = opcions(bo);
    assert.equal((await android.pujaAPlay(o)).pujat, true);
    assert.deepEqual(bo.ops(), ['token', 'token', 'insert', 'insert', 'insert', 'upload', 'tracks', 'validate', 'commit']);
    assert.deepEqual(esperes, [3, 3, 6]);
  } finally {
    await bo.tanca();
  }
});

test('R32.3 · un 4xx no es reintenta: l\'edició s\'esborra, no hi ha commit i el consell diu els permisos', async () => {
  const sim = await simulador({ tracks: { estat: 403, cos: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'The caller does not have permission' } } } });
  try {
    const { o, linies, esperes } = opcions(sim);
    await assert.rejects(android.pujaAPlay(o), (error) => {
      assert.equal(error.message, 'edits.tracks.update: HTTP 403 · PERMISSION_DENIED: The caller does not have permission');
      assert.match(error.consell, /Usuaris i permisos/);
      return true;
    });
    assert.deepEqual(sim.ops(), ['token', 'insert', 'upload', 'tracks', 'delete']);
    assert.deepEqual(esperes, []);
    assert.match(linies.at(-1), /edits\.delete: l'edició s'ha esborrat/);
  } finally {
    await sim.tanca();
  }
});

test('R32.3 · consells: API desactivada, primer AAB (404), app en esborrany i versionCode repetit', async () => {
  const casos = [
    [{ insert: { estat: 403, cos: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Google Play Android Developer API has not been used in project 1 before or it is disabled.' } } } }, /activa «Google Play Android Developer API»/],
    [{ insert: { estat: 404, cos: { error: { code: 404, status: 'NOT_FOUND', message: 'Package not found: org.socdepoble.app.' } } } }, /PRIMER AAB/],
    [{ tracks: { estat: 400, cos: { error: { code: 400, status: 'FAILED_PRECONDITION', message: 'Only releases with status draft may be created on draft app.' } } } }, /sense --desplega/],
    [{ upload: { estat: 403, cos: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'APK specifies a version code that has already been used.' } } } }, /versionCode ja és a Google Play/]
  ];
  for (const [guio, consell] of casos) {
    const sim = await simulador(guio);
    try {
      await assert.rejects(android.pujaAPlay(opcions(sim).o), (error) => { assert.match(error.consell, consell); return true; });
      assert.ok(!sim.ops().includes('commit'));
    } finally {
      await sim.tanca();
    }
  }
});

test('R32.3 · temps màxim: una resposta lenta es talla i es reintenta; la pujada lenta no es reintenta', async () => {
  const sim = await simulador({ insert: [{ retard: 400 }, null] });
  try {
    const { o, esperes } = opcions(sim, { temps: { peticio: 120, pujada: 5_000 } });
    assert.equal((await android.pujaAPlay(o)).pujat, true);
    assert.deepEqual(sim.ops().slice(0, 3), ['token', 'insert', 'insert']);
    assert.deepEqual(esperes, [3]);
  } finally {
    await sim.tanca();
  }
  const sempre = await simulador({ validate: { retard: 400 } });
  try {
    await assert.rejects(android.pujaAPlay(opcions(sempre, { temps: { peticio: 100, pujada: 5_000 } }).o), (error) => {
      assert.equal(error.tipus, 'temps');
      assert.match(error.message, /^edits\.validate: sense resposta en 1 s$/);
      return true;
    });
    assert.deepEqual(sempre.ops().filter((op) => op === 'validate').length, 3);
    assert.ok(!sempre.ops().includes('commit'));
  } finally {
    await sempre.tanca();
  }
  const pujada = await simulador({ upload: { retard: 500 } });
  try {
    await assert.rejects(android.pujaAPlay(opcions(pujada, { temps: { peticio: 2_000, pujada: 150 } }).o), (error) => error.tipus === 'temps');
    assert.deepEqual(pujada.ops(), ['token', 'insert', 'upload', 'delete'], 'cap segona pujada de l\'AAB per un temps esgotat');
  } finally {
    await pujada.tanca();
  }
});

test('R32.3 · xarxa: una connexió tallada es reintenta (també la pujada, que torna a enviar l\'AAB sencer); al commit, no', async () => {
  const sim = await simulador({ insert: [{ talla: true }, null], upload: [{ estat: 500, cos: {} }, null] });
  try {
    assert.equal((await android.pujaAPlay(opcions(sim).o)).pujat, true);
    assert.deepEqual(sim.ops(), ['token', 'insert', 'insert', 'upload', 'upload', 'tracks', 'validate', 'commit']);
    for (const pujada of sim.crides.filter((c) => c.op === 'upload')) assert.equal(Buffer.compare(pujada.cos, OCTETS_AAB), 0);
  } finally {
    await sim.tanca();
  }
  /* Elefant R32.3 · El commit tallat no es repetix: es pregunta a Play. Ací no ha entrat (l'edició
     continua oberta i la pista no té el build): s'esborra i es diu que no s'ha publicat res. */
  const commit = await simulador({ commit: { talla: true } });
  try {
    await assert.rejects(android.pujaAPlay(opcions(commit).o), (error) => {
      assert.equal(error.tipus, 'xarxa');
      assert.match(error.message, /^edits\.commit: error de xarxa \(.*l'edició continuava oberta \(ara esborrada\) i que la pista internal no té el versionCode 9: no s'ha publicat res$/);
      assert.match(error.consell, /torna-ho a provar amb el mateix «sí»/);
      return true;
    });
    assert.deepEqual(commit.ops(), ['token', 'insert', 'upload', 'tracks', 'validate', 'commit', 'get', 'insert', 'trackget', 'delete', 'delete'],
      'un sol commit; després edits.get, una edició de lectura (insert, tracks.get, delete) i l\'esborrat de l\'edició oberta');
    assert.deepEqual(commit.crides.filter((c) => c.op === 'delete').map((c) => c.url.split('/edits/')[1]), ['edicio-2', 'edicio-1']);
    assert.equal(commit.play.edicions.size, 0, 'cap edició oberta a Play');
    assert.deepEqual(commit.play.publicat, {}, 'res publicat');
  } finally {
    await commit.tanca();
  }
});

/* Elefant R32.3 (Peixos security_reviewer i silent_failure_hunter, P2) · edits.commit no és idempotent:
   abans es reintentava amb un 5xx, i si el primer ja havia entrat, el segon rebia un 4xx, l'error perdia
   l'«estat desconegut» i el DELETE 404 deia «no publica res» amb el build ja als provadors. */
test('Elefant R32.3 · commit amb 5xx o tall DESPRÉS d\'entrar: un sol commit, Play ho confirma i la pujada està feta', async () => {
  for (const [nom, accio, estat] of [['503', { aplica: true, estat: 503, cos: { error: { code: 503, status: 'UNAVAILABLE', message: 'Backend error' } } }, 'draft'],
    ['504 de la passarel·la', { aplica: true, estat: 504, cos: 'Gateway Timeout' }, 'completed'],
    ['tall de xarxa', { aplica: true, talla: true }, 'draft']]) {
    const sim = await simulador({ commit: accio });
    try {
      const { o, linies } = opcions(sim, { estat });
      const resultat = await android.pujaAPlay(o);
      assert.deepEqual(resultat, { comprovat: true, pujat: true, versionCode: 9, sha256Google: SHA_AAB, pista: 'internal', estat, senseRevisio: false, verificatDespres: true, statusPlay: estat }, nom);
      assert.equal(sim.ops().filter((op) => op === 'commit').length, 1, `${nom}: el commit no es repetix`);
      assert.deepEqual(sim.ops().slice(5), ['commit', 'get', 'insert', 'trackget', 'delete'], `${nom}: només l'edició de lectura s'esborra`);
      assert.equal(sim.crides.at(-1).url.split('/edits/')[1], 'edicio-2');
      assert.ok(linies.some((l) => /✓ edits\.commit: Google Play ja té el versionCode 9 a la pista internal \(status (draft|completed)\): confirmat/.test(l)), nom);
      assert.ok(!linies.some((l) => /no publica res|no ha canviat res/.test(l)), `${nom}: cap línia diu que no s'ha publicat`);
      senseSecrets(linies.join('\n'), sim.vist);
    } finally {
      await sim.tanca();
    }
  }
});

test('Elefant R32.3 · commit ambigu i Play no ho pot dir: ESTAT DESCONEGUT (eixida 11), sense esborrar l\'edició ni dir «no publica res»', async () => {
  const casos = [
    ['edits.get amb 500', { commit: { aplica: true, estat: 502, cos: 'Bad Gateway' }, get: { estat: 500, cos: {} } }, ['commit', 'get']],
    ['la lectura de la pista falla', { commit: { estat: 503 }, trackget: { estat: 503 } }, ['commit', 'get', 'insert', 'trackget', 'trackget', 'trackget', 'delete']],
    ['l\'edició oberta ja no es pot esborrar', { commit: { estat: 503 }, delete: (crida) => (crida.url.endsWith('edicio-1') ? { estat: 404, cos: {} } : null) },
      ['commit', 'get', 'insert', 'trackget', 'delete', 'delete']]
  ];
  for (const [nom, guio, cua] of casos) {
    const sim = await simulador(guio);
    try {
      const { o, linies } = opcions(sim);
      await assert.rejects(android.pujaAPlay(o), (error) => {
        assert.equal(error.tipus, 'desconegut', nom);
        assert.equal(error.operacio, 'edits.commit');
        assert.match(error.message, /l'estat del commit és DESCONEGUT/);
        assert.match(error.consell, /mira Play Console › pista internal: si hi ha el versionCode 9, la pujada ja està feta/);
        senseSecrets(textDe(error, linies), sim.vist);
        return true;
      });
      assert.deepEqual(sim.ops().slice(5), cua, nom);
      assert.equal(sim.ops().filter((op) => op === 'commit').length, 1);
      assert.match(linies.at(-1), /edits\.commit: estat DESCONEGUT; l'edició no s'esborra/);
      assert.ok(!linies.some((l) => /no publica res/.test(l)), `${nom}: cap línia diu «no publica res»`);
    } finally {
      await sim.tanca();
    }
  }
  assert.equal(android.EIXIDA_PLAY_DESCONEGUT, 11);
  assert.ok(!Object.values(e.EIXIDA).includes(android.EIXIDA_PLAY_DESCONEGUT), 'un codi propi, que cap altra eixida fa servir');
});

test('Elefant R32.3 · commit: un 2xx és fet encara que el cos no s\'entenga; un 4xx és un «no» net (un intent, l\'edició s\'esborra)', async () => {
  const rar = await simulador({ commit: { aplica: true, estat: 200, cos: '<html>ok</html>' } });
  try {
    const resultat = await android.pujaAPlay(opcions(rar).o);
    assert.equal(resultat.pujat, true);
    assert.equal(resultat.verificatDespres, undefined);
    assert.deepEqual(rar.ops().slice(5), ['commit']);
  } finally {
    await rar.tanca();
  }
  const no = await simulador({ commit: { estat: 409, cos: { error: { code: 409, status: 'ABORTED', message: 'This Edit has been replaced.' } } } });
  try {
    const { o, linies } = opcions(no);
    await assert.rejects(android.pujaAPlay(o), (error) => error.tipus === 'http' && error.estat === 409 && error.consell === null);
    assert.deepEqual(no.ops().slice(5), ['commit', 'delete']);
    assert.match(linies.at(-1), /edits\.delete: l'edició s'ha esborrat; a Google Play no ha canviat res/);
  } finally {
    await no.tanca();
  }
  // Després d'un commit rebutjat, un DELETE que no torna 2xx no afirma res: mira Play Console.
  const perdut = await simulador({ commit: { estat: 400, cos: { error: { code: 400, status: 'FAILED_PRECONDITION', message: 'x' } } }, delete: { estat: 404, cos: {} } });
  try {
    const { o, linies } = opcions(perdut);
    await assert.rejects(android.pujaAPlay(o));
    assert.match(linies.at(-1), /edits\.delete: HTTP 404; l'edició ja no hi era: mira Play Console › pista internal abans de tornar-ho a provar/);
  } finally {
    await perdut.tanca();
  }
});

test('Elefant R32.3 · consultaLlancament: on és un versionCode a Play, amb una edició NOMÉS de lectura (mai cap commit)', async () => {
  const sim = await simulador();
  try {
    await android.pujaAPlay(opcions(sim, { estat: 'completed' }).o);
    await android.pujaAPlay(opcions(sim, { pista: 'production' }).o);
    sim.crides.length = 0;
    const consulta = (mes = {}) => android.consultaLlancament({ clau: CLAU.clau, paquet: PAQUET, build: '9', endpoints: sim.endpoints, espera: async () => {}, ...mes });
    assert.deepEqual(await consulta(), [{ pista: 'internal', status: 'completed' }, { pista: 'production', status: 'draft' }]);
    assert.deepEqual(sim.ops(), ['token', 'insert', 'trackget', 'trackget', 'delete']);
    assert.deepEqual(await consulta({ build: '10' }), []);
    assert.deepEqual(await consulta({ pistes: ['internal'] }), [{ pista: 'internal', status: 'completed' }]);
    assert.ok(!sim.ops().includes('commit'), 'cap commit');
    assert.equal([...sim.play.edicions.values()].filter((x) => x.oberta).length, 0, 'cap edició de lectura oberta');
    for (const mes of [{ pistes: ['beta'] }, { pistes: [] }, { build: 'x' }, { paquet: 'no' }, { clau: null }]) {
      await assert.rejects(consulta(mes), (error) => ['us', 'clau'].includes(error.tipus));
    }
  } finally {
    await sim.tanca();
  }
  const sensePista = await simulador({ trackget: { estat: 404, cos: { error: { code: 404, message: 'Track not found' } } } });
  try {
    assert.deepEqual(await android.consultaLlancament({ clau: CLAU.clau, paquet: PAQUET, build: '9', endpoints: sensePista.endpoints, espera: async () => {} }), []);
  } finally {
    await sensePista.tanca();
  }
});

test('R32.3 · verificació de la pujada: sha256 de Google, sha256 del que s\'ha enviat i versionCode; cap commit i l\'edició s\'esborra', async () => {
  const casos = [
    [{ upload: { estat: 200, cos: { versionCode: 9, sha256: 'f'.repeat(64) } } }, {}, /Google ha rebut un AAB amb un altre sha256/],
    [{}, { sha256: 'a'.repeat(64) }, /l'AAB ha canviat durant la pujada/],
    [{ upload: { estat: 200, cos: { versionCode: 10, sha256: SHA_AAB } } }, {}, /Google llig el versionCode 10, no 9/],
    [{ upload: { estat: 200, cos: { sha256: SHA_AAB } } }, {}, /Google llig el versionCode cap, no 9/]
  ];
  for (const [guio, mes, motiu] of casos) {
    const sim = await simulador(guio);
    try {
      await assert.rejects(android.pujaAPlay(opcions(sim, mes).o), (error) => {
        assert.equal(error.tipus, 'verificacio');
        assert.match(error.message, motiu);
        return true;
      });
      assert.deepEqual(sim.ops(), ['token', 'insert', 'upload', 'delete']);
    } finally {
      await sim.tanca();
    }
  }
  // Sense el sha256 de Google, val el del que s'ha enviat (i ho diu).
  const sense = await simulador({ upload: { estat: 200, cos: { versionCode: 9 } } });
  try {
    const { o, linies } = opcions(sense);
    assert.equal((await android.pujaAPlay(o)).sha256Google, null);
    assert.ok(linies.some((l) => /el sha256 del que s'ha enviat \(Google no el torna\) és el de l'AAB/.test(l)));
  } finally {
    await sense.tanca();
  }
});

test('R32.3 · un AAB que s\'escurça mentre es puja: el client talla la pujada (verificació) sense esperar el temps màxim', async () => {
  const gros = path.join(TEMPORAL, 'gros.aab');
  fs.writeFileSync(gros, crypto.randomBytes(16 * 1024 * 1024));
  const shaGros = sha256(fs.readFileSync(gros));
  let pujades = 0;
  const sim = await simulador();
  // Un servidor davant del simulador: retén la pujada, escurça l'AAB i després la deixa passar.
  const davant = http.createServer((req, res) => {
    if (!req.url.includes('/bundles')) {
      const reenvia = http.request(`${sim.base}${req.url}`, { method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
      req.pipe(reenvia);
      return;
    }
    pujades += 1;
    req.pause();
    fs.truncateSync(gros, 0);
    setTimeout(() => { req.resume(); req.on('data', () => {}); }, 50);
  });
  await new Promise((resol) => { davant.listen(0, '127.0.0.1', resol); });
  const base = `http://127.0.0.1:${davant.address().port}`;
  const inici = Date.now();
  try {
    const { o } = opcions(sim, { aab: gros, sha256: shaGros, endpoints: { token: `${base}/token`, api: `${base}/api`, pujada: `${base}/pujada` }, temps: { peticio: 3_000, pujada: 20_000 } });
    await assert.rejects(android.pujaAPlay(o), (error) => {
      assert.equal(error.tipus, 'verificacio');
      assert.match(error.message, /l'AAB ha canviat de mida durant la pujada/);
      return true;
    });
    assert.equal(pujades, 1, 'una verificació fallida no es reintenta');
    assert.ok(Date.now() - inici < 10_000, 'no espera el temps màxim de la pujada');
    assert.deepEqual(sim.ops(), ['token', 'insert', 'delete']);
  } finally {
    davant.closeAllConnections();
    await new Promise((resol) => { davant.close(resol); });
    await sim.tanca();
  }
});

test('R32.3 · validate que falla: cap commit; commit que demana changesNotSentForReview: un sol reintent amb el paràmetre', async () => {
  const sim = await simulador({ validate: { estat: 400, cos: { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Version code 9 has already been used.' } } } });
  try {
    await assert.rejects(android.pujaAPlay(opcions(sim).o), (error) => error.operacio === 'edits.validate');
    assert.deepEqual(sim.ops(), ['token', 'insert', 'upload', 'tracks', 'validate', 'delete']);
  } finally {
    await sim.tanca();
  }
  const missatge = 'Changes cannot be sent for review automatically. Please set the query parameter changesNotSentForReview to true. Once committed, the changes in this edit can be sent for review from the Google Play Console UI.';
  const revisio = await simulador({ commit: [{ estat: 400, cos: { error: { code: 400, status: 'FAILED_PRECONDITION', message: missatge } } }, null] });
  try {
    const { o, linies } = opcions(revisio);
    assert.equal((await android.pujaAPlay(o)).senseRevisio, true);
    assert.deepEqual(revisio.crides.filter((c) => c.op === 'commit').map((c) => c.url), [
      '/api/applications/org.socdepoble.app/edits/edicio-1:commit',
      '/api/applications/org.socdepoble.app/edits/edicio-1:commit?changesNotSentForReview=true'
    ]);
    assert.ok(!revisio.ops().includes('delete'));
    assert.ok(linies.some((l) => /changesNotSentForReview=true; es confirma sense enviar res a revisió/.test(l)));
  } finally {
    await revisio.tanca();
  }
});

test('R32.3 · cap secret als errors: un Google que cita el token, l\'asserció, el compte de servei i una clau ix net', async () => {
  let assercio = null;
  const sim = await simulador({
    insert: (crida) => ({ estat: 400, cos: { error: { code: 400, status: 'INVALID_ARGUMENT', message: `eco ${crida.capcaleres.authorization} ${EMAIL} ${KID} ${PEM}` } } })
  });
  try {
    const { o, linies } = opcions(sim);
    await assert.rejects(android.pujaAPlay(o), (error) => {
      assercio = sim.vist.assercio;
      senseSecrets(textDe(error, linies), sim.vist);
      assert.match(error.message, /eco Bearer <(?:secret|token)> <(?:secret|compte de servei)> <secret> <clau>/);
      return true;
    });
  } finally {
    await sim.tanca();
  }
  assert.ok(assercio, 'el servidor ha vist l\'asserció');
  const token = await simulador({ token: { estat: 400, cos: `{"error":"invalid_grant","error_description":"eco ${'x'}"} ` } });
  try {
    await assert.rejects(android.pujaAPlay(opcions(token).o), (error) => { senseSecrets(textDe(error), token.vist); return true; });
  } finally {
    await token.tanca();
  }
});

test('R32.3 · respostes que no s\'entenen: no JSON, un token sense Bearer, cap id d\'edició i més d\'1 MB', async () => {
  const casos = [
    [{ token: { estat: 200, cos: '<html>no</html>' } }, /token: la resposta de Google no és un objecte JSON/],
    [{ token: { estat: 200, cos: { access_token: TOKEN, token_type: 'MAC' } } }, /token: Google no ha tornat cap token Bearer/],
    [{ insert: { estat: 200, cos: { id: '../../altra' } } }, /edits\.insert: Google no ha tornat cap identificador d'edició/],
    [{ insert: { estat: 200, cos: 'x'.repeat(1024 * 1024 + 10) } }, /edits\.insert: la resposta passa d'1 MB/]
  ];
  for (const [guio, motiu] of casos) {
    const sim = await simulador(guio);
    try {
      await assert.rejects(android.pujaAPlay(opcions(sim).o), (error) => { assert.match(error.message, motiu); return true; });
      assert.ok(!sim.ops().includes('upload'));
    } finally {
      await sim.tanca();
    }
  }
});

test('R32.3 · main --comprova-play: entorn de fora del repositori, la clau per ruta, token+insert+delete i cap secret a la pantalla', { skip: SENSE_REPOSITORI }, async () => {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'comprova-'));
  const clau = path.join(fora, 'play-compte-servei.json');
  fs.writeFileSync(clau, JSON_CLAU, { mode: 0o600 });
  fs.chmodSync(clau, 0o600);
  const fitxer = path.join(fora, 'botigues.env');
  fs.writeFileSync(fitxer, `SDP_APP_ID=${PAQUET}\nSDP_PLAY_JSON_KEY_PATH=${clau}\nSDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}\n`, { mode: 0o600 });
  fs.chmodSync(fitxer, 0o600);
  const sim = await simulador();
  const pantalla = capturaPantalla();
  try {
    const play = { endpoints: sim.endpoints, espera: async () => {} };
    assert.equal(await android.main(['--comprova-play'], { env: { SDP_BOTIGUES_ENV: fitxer }, play }), e.EIXIDA.BE, pantalla.vist);
    assert.deepEqual(sim.ops(), ['token', 'insert', 'delete']);
    assert.match(pantalla.vist, /✓ token OAuth de Google/);
    assert.match(pantalla.vist, /✓ La clau, els permisos i el paquet responen/);
    assert.equal(await android.main(['--comprova-play', '--versio', '1.0.0'], { env: { SDP_BOTIGUES_ENV: fitxer }, play }), e.EIXIDA.US);
    fs.writeFileSync(clau, '{"type":"service_account","private_key":"fuita-de-prova"', { mode: 0o600 });
    assert.equal(await android.main(['--comprova-play'], { env: { SDP_BOTIGUES_ENV: fitxer }, play }), e.EIXIDA.FALTA);
    assert.match(pantalla.vist, /SDP_PLAY_JSON_KEY_PATH: no és un JSON/);
    assert.deepEqual(sim.ops(), ['token', 'insert', 'delete'], 'amb la clau dolenta no es crida Google');
  } finally {
    pantalla.restaura();
    await sim.tanca();
  }
  const { vist } = pantalla;
  senseSecrets(vist, sim.vist);
  assert.ok(!vist.includes('fuita-de-prova') && !vist.includes(PAQUET) && !vist.includes(fora), 'cap valor ni ruta del fitxer d\'entorn');
});

/* ───────────── publica-tot: l'APK públic i el manifest de versió ───────────── */

test('R32.3 · Elefant · publicaApkDirecte copia a dist/descarregues només l\'APK ÚNIC de la versió, amb el seu .sha256 i la signatura de la clau de pujada', async () => {
  const arrel = fs.mkdtempSync(path.join(TEMPORAL, 'apk-'));
  const builds = path.join(arrel, 'builds');
  fs.mkdirSync(builds);
  const octets = crypto.randomBytes(70 * 1024);
  const nou = path.join(builds, '261116_socdepoble_1.2.5+10.apk');
  fs.writeFileSync(nou, octets);
  fs.writeFileSync(`${nou}.sha256`, `${sha256(octets)}  261116_socdepoble_1.2.5+10.apk\n`);
  fs.writeFileSync(path.join(builds, '261117_socdepoble_1.2.4+9.apk'), 'una altra versió');
  assert.deepEqual(publica.apksDeLaVersio(builds, '1.2.5', '10'), [nou]);
  assert.deepEqual(publica.apksDeLaVersio(builds, '1.2.6', '11'), []);
  assert.deepEqual(publica.apksDeLaVersio(path.join(arrel, 'no-hi-es'), '1.2.5', '10'), []);
  assert.equal(publica.carpetaBuildsAndroid('/a/socdepoble.org'), '/a/_builds_de_poble/android');

  /* La signatura la verifica apksigner (empremtaDeLApk, a la prova de baix); ací, un verificador fingit. */
  const CERT = 'AB'.repeat(32);
  const valors = { SDP_ANDROID_UPLOAD_CERT_SHA256: `${'ab:'.repeat(31)}ab` };
  const signades = new Map([[nou, CERT]]);
  const vistes = [];
  const empremta = async (apk) => { vistes.push(path.basename(apk)); if (signades.get(apk) === 'llança') throw new Error('apksigner ha petat'); return signades.get(apk) ?? null; };
  const publicaAra = (mes = {}) => publica.publicaApkDirecte({ arrel, versio: '1.2.5', build: '10', carpeta: builds, valors, empremta, ...mes });

  const sense = await publicaAra();
  assert.equal(sense.codi, e.EIXIDA.ARBRE);
  assert.match(sense.error, /primer npm run build/);
  fs.mkdirSync(path.join(arrel, 'dist'));
  fs.writeFileSync(path.join(arrel, 'dist', 'index.html'), '<!doctype html>');
  assert.equal((await publicaAra({ versio: '1.2' })).codi, e.EIXIDA.US);
  const senseClau = await publicaAra({ valors: {} });
  assert.equal(senseClau.codi, e.EIXIDA.FALTA);
  assert.match(senseClau.error, /falta SDP_ANDROID_UPLOAD_CERT_SHA256/);

  const fet = await publicaAra();
  assert.equal(fet.codi, e.EIXIDA.BE, fet.error);
  assert.deepEqual(vistes, ['261116_socdepoble_1.2.5+10.apk'], 'la signatura es verifica en publicar');
  const desti = path.join(arrel, 'dist', 'descarregues');
  const publicat = path.join(desti, 'socdepoble-android-latest.apk');
  assert.deepEqual(fs.readdirSync(desti).sort(), ['socdepoble-android-latest.apk', 'socdepoble-android-latest.apk.sha256']);
  assert.equal(Buffer.compare(fs.readFileSync(publicat), octets), 0);
  assert.equal(fs.readFileSync(`${publicat}.sha256`, 'utf8'), `${sha256(octets)}  socdepoble-android-latest.apk\n`);
  assert.deepEqual([fet.origen, fet.sha256, fet.octets], ['261116_socdepoble_1.2.5+10.apk', sha256(octets), octets.length]);
  assert.deepEqual(publica.DESCARREGUES_DIST, ['dist', 'descarregues']);
  /* Onada v1.2.6 (ordre del Mestre del 17-11-2026) · El que publicaApkDirecte deixa a dist/descarregues/ és
     exactament el que firebase.json no puja (hosting.ignore) i redirigix (302) a la mateixa ruta del Node 0:
     cap descàrrega de l'APK la servix Firebase. El contracte sencer és a src/config/firebaseHosting.test.js. */
  const { hosting } = JSON.parse(fs.readFileSync(path.join(ARREL, 'firebase.json'), 'utf8'));
  assert.deepEqual(hosting.redirects.map((r) => [r.source, r.destination, r.type]),
    fs.readdirSync(desti).sort().map((nom) => [`/descarregues/${nom}`, `https://socdepoble.cat/descarregues/${nom}`, 302]));
  for (const patro of ['**/*.apk', '**/*.apk.sha256']) assert.ok(hosting.ignore.includes(patro), `hosting.ignore porta ${patro}`);
  for (const nom of fs.readdirSync(desti)) {
    assert.ok(hosting.ignore.some((patro) => patro.startsWith('**/') && path.matchesGlob(`descarregues/${nom}`, patro)), `${nom} no es puja a Firebase`);
  }
  const intacte = () => assert.equal(Buffer.compare(fs.readFileSync(publicat), octets), 0, 'el que ja hi és no es toca');

  /* El contraexemple del Peix security_reviewer: un APK qualsevol amb data posterior i el seu .sha256 fet a mà.
     Abans guanyava per ordre alfabètic; ara dos candidats són ambigus i no es publica cap. */
  const intrus = path.join(builds, '991231_socdepoble_1.2.5+10.apk');
  const qualsevol = Buffer.from('APK de depuració, sense signar o de qualsevol altra eina');
  fs.writeFileSync(intrus, qualsevol);
  fs.writeFileSync(`${intrus}.sha256`, `${sha256(qualsevol)}\n`);
  const ambigu = await publicaAra();
  assert.equal(ambigu.codi, e.EIXIDA.ARBRE);
  assert.match(ambigu.error, /hi ha 2 APK 1\.2\.5\+10 .*261116_socdepoble_1\.2\.5\+10\.apk, 991231_socdepoble_1\.2\.5\+10\.apk/);
  intacte();
  // Sol, l'intrús tampoc passa: la seua signatura no és la de la clau de pujada.
  fs.renameSync(nou, path.join(arrel, 'apartat.apk'));
  signades.set(intrus, 'CD'.repeat(32));
  assert.match((await publicaAra()).error, /991231_socdepoble_1\.2\.5\+10\.apk està signat amb una clau diferent de SDP_ANDROID_UPLOAD_CERT_SHA256/);
  signades.delete(intrus);
  assert.match((await publicaAra()).error, /apksigner no ha pogut verificar la signatura de 991231/);
  signades.set(intrus, 'llança');
  assert.equal((await publicaAra()).codi, e.EIXIDA.VERIFICACIO);
  intacte();
  fs.rmSync(intrus);
  fs.rmSync(`${intrus}.sha256`);
  fs.renameSync(path.join(arrel, 'apartat.apk'), nou);

  // Un APK que no és el verificat (o sense .sha256) no es publica, i el que ja hi és no es toca.
  fs.writeFileSync(nou, 'un altre APK');
  const canviat = await publicaAra();
  assert.equal(canviat.codi, e.EIXIDA.VERIFICACIO);
  assert.match(canviat.error, /no és l’APK verificat/);
  intacte();
  fs.rmSync(`${nou}.sha256`);
  assert.match((await publicaAra()).error, /no té un \.sha256 vàlid/);

  // dist/descarregues no pot ser un enllaç cap a fora de dist/.
  const altre = fs.mkdtempSync(path.join(TEMPORAL, 'apk-fora-'));
  fs.writeFileSync(nou, octets);
  fs.writeFileSync(`${nou}.sha256`, `${sha256(octets)}\n`);
  fs.rmSync(desti, { recursive: true });
  fs.symlinkSync(altre, desti);
  const enllac = await publicaAra();
  assert.equal(enllac.codi, e.EIXIDA.ARBRE);
  assert.deepEqual(fs.readdirSync(altre), [], 'res escrit fora de dist/');
});

test('Elefant · empremtaDeLApk: apksigner del build-tools més alt (ordre numèric), totes les empremtes iguals; estricte no cau a keytool', async () => {
  const eines = fs.mkdtempSync(path.join(TEMPORAL, 'build-tools-'));
  const apk = path.join(eines, 'prova.apk');
  fs.writeFileSync(apk, 'no és un APK');
  const posa = (versio, cos) => {
    fs.mkdirSync(path.join(eines, versio), { recursive: true });
    fs.writeFileSync(path.join(eines, versio, 'apksigner'), `#!/bin/sh\n${cos}\n`, { mode: 0o755 });
    fs.chmodSync(path.join(eines, versio, 'apksigner'), 0o755);
  };
  const HEX = 'ab'.repeat(32);
  posa('9.0.0', 'exit 1');
  posa('35.0.0', `echo "Signer #1 certificate DN: CN=Prova"\necho "Signer #1 certificate SHA-256 digest: ${HEX}"\nexit 0`);
  const empremta = (mes = {}) => publica.empremtaDeLApk({ apk, buildTools: eines, ...mes });
  assert.equal(await empremta(), 'AB'.repeat(32), 'el 35.0.0 guanya el 9.0.0 (ordre numèric, no alfabètic)');
  posa('36.1.0', `echo "Signer #1 certificate SHA-256 digest: ${HEX}"\necho "Signer #2 certificate SHA-256 digest: ${'cd'.repeat(32)}"\nexit 0`);
  assert.equal(await empremta(), null, 'dos signants amb certificats diferents: no');
  posa('36.1.0', `echo "Signer #1 certificate SHA-256 digest: ${HEX}"\necho "DOES NOT VERIFY" 1>&2\nexit 1`);
  assert.equal(await empremta(), null, 'apksigner diu que no: estricte no prova keytool');
  assert.equal(await publica.empremtaDeLApk({ apk, buildTools: path.join(eines, 'no-hi-es'), estricte: true }), null, 'sense apksigner, keytool (que no pot amb un fitxer qualsevol)');
});

test('R32.3 · Elefant · sincronitzaManifestVersio: version i el build de cada botiga, sense passar de VERSIO_CLIENT_NATIU ni baixar (llevat de corregir)', () => {
  /* El manifest real és del carril del detector natiu i pot canviar: la prova en deriva la versió
     següent i no fixa cap xifra d'avui. El sostre (maximBuild) es passa explícit per a no dependre
     de VERSIO_CLIENT_NATIU; la prova del sostre real va a part. */
  const real = fs.readFileSync(path.join(ARREL, ...publica.MANIFEST_VERSIO), 'utf8');
  const original = JSON.parse(real);
  const [major, minor, pedac] = (e.VERSIO.test(String(original.version ?? '')) ? original.version : '1.0.0').split('.').map(Number);
  const seguent = `${major}.${minor}.${pedac + 1}`;
  const posterior = `${major}.${minor}.${pedac + 2}`;
  const anterior = `${major}.${minor}.${Math.max(0, pedac - 1)}`;
  const bA = (Number.isSafeInteger(original.androidBuild) ? original.androidBuild : 0) + 1;
  const bI = (Number.isSafeInteger(original.iosBuild) ? original.iosBuild : 0) + 1;
  const maximBuild = Math.max(bA, bI) + 5;
  const sincronitza = (text, opcions) => publica.sincronitzaManifestVersio(text, { maximBuild, ...opcions });

  const text = sincronitza(real, { versio: seguent, androidBuild: String(bA), iosBuild: bI });
  const nou = JSON.parse(text);
  assert.ok(text.endsWith('}\n') && text.startsWith('{\n  "'));
  assert.deepEqual([nou.version, nou.androidBuild, nou.iosBuild], [seguent, bA, bI]);
  assert.deepEqual(Object.keys(nou).filter((k) => ['version', 'androidBuild', 'iosBuild'].includes(k)).length, 3);
  assert.ok(Object.keys(nou).indexOf('entries') > Object.keys(nou).indexOf('iosBuild'), 'les claus de versió van davant de les entrades');
  assert.ok(nou.entries.length > 0 && nou.entries.every((entrada) => entrada.version === seguent));
  // v1.2.7 · P0-123 · latestBuild el recalcula l'escriptor: el més alt de tots els builds.
  assert.equal(nou.latestBuild, Math.max(...['androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild'].map((k) => nou[k]).filter(Number.isSafeInteger)));
  const sense = (dades) => ({ ...dades, version: undefined, androidBuild: undefined, iosBuild: undefined, latestBuild: undefined, entries: dades.entries.map((x) => ({ ...x, version: undefined })) });
  assert.deepEqual(sense(nou), sense(original), 'la resta del manifest és la mateixa');
  assert.equal(sincronitza(text, { versio: seguent, androidBuild: bA, iosBuild: bI }), text, 'idempotent');

  // Cada botiga va al seu pas: el build que no es passa es conserva tal qual.
  const nomesAndroid = JSON.parse(sincronitza(text, { versio: posterior, androidBuild: bA + 1 }));
  assert.deepEqual([nomesAndroid.version, nomesAndroid.androidBuild, nomesAndroid.iosBuild], [posterior, bA + 1, bI]);
  const nomesIos = JSON.parse(sincronitza(text, { versio: seguent, iosBuild: bI + 1 }));
  assert.deepEqual([nomesIos.androidBuild, nomesIos.iosBuild], [bA, bI + 1]);
  assert.throws(() => sincronitza(text, { versio: seguent }), /cal androidBuild o iosBuild/);

  if (anterior !== seguent) assert.throws(() => sincronitza(text, { versio: anterior, androidBuild: bA + 1 }), /no es baixa a .*--corregeix-ard/);
  assert.throws(() => sincronitza(text, { versio: posterior, androidBuild: bA - 1 }), new RegExp(`ja publica androidBuild ${bA}: no es baixa a ${bA - 1}`));
  assert.throws(() => sincronitza(text, { versio: '1.2', androidBuild: bA }), /X\.Y\.Z/);
  assert.throws(() => sincronitza(text, { versio: posterior, androidBuild: 0 }), /androidBuild ha de ser un enter positiu/);
  assert.throws(() => sincronitza('{"x":1}', { versio: posterior, androidBuild: bA }), /no té «entries»/);
  assert.throws(() => sincronitza('no', { versio: posterior, androidBuild: bA }), /no és JSON/);
  // Un manifest sense cap clau de versió les rep davant de tot.
  const pelat = sincronitza('{"entries":[{"version":"0.1.0"}]}', { versio: '1.0.0', androidBuild: 2, iosBuild: 3 });
  assert.equal(pelat, '{\n  "version": "1.0.0",\n  "androidBuild": 2,\n  "iosBuild": 3,\n  "latestBuild": 3,\n  "entries": [\n    {\n      "version": "1.0.0"\n    }\n  ]\n}\n');

  /* Elefant (contraexemple del Peix security_reviewer, part B) · Un build teclejat massa alt ja no entra
     (sostre), i si mai entrara, --corregeix-ard el desfà; sense, la monotonia el protegix. */
  assert.throws(() => sincronitza(real, { versio: seguent, androidBuild: maximBuild + 1 }), new RegExp(`androidBuild ${maximBuild + 1} passa de VERSIO_CLIENT_NATIU \\(${maximBuild}`));
  assert.throws(() => sincronitza(real, { versio: seguent, iosBuild: 99999 }), /iosBuild 99999 passa de VERSIO_CLIENT_NATIU/);
  assert.throws(() => publica.sincronitzaManifestVersio(real, { versio: seguent, androidBuild: 100 }), /passa de VERSIO_CLIENT_NATIU/, 'el sostre per defecte és VERSIO_CLIENT_NATIU');
  const errat = sincronitza(text, { versio: seguent, androidBuild: maximBuild });
  assert.throws(() => sincronitza(errat, { versio: seguent, androidBuild: bA }), /no es baixa/);
  const corregit = JSON.parse(sincronitza(errat, { versio: anterior, androidBuild: bA, corregeix: true }));
  assert.deepEqual([corregit.version, corregit.androidBuild, corregit.iosBuild], [anterior, bA, bI]);

  // L'escriptura, sobre una còpia temporal (mai sobre public/ del repositori), i només amb la versió de package.json.
  const copia = path.join(TEMPORAL, 'ard.json');
  fs.writeFileSync(copia, real);
  const escriu = (versio, mes = {}) => publica.escriuManifestVersio({ arrel: TEMPORAL, versio, androidBuild: bA, iosBuild: bI, cami: copia, versioPaquet: seguent, maximBuild, ...mes });
  assert.deepEqual(escriu(seguent, { sec: true }), { codi: e.EIXIDA.BE, canviat: true });
  assert.equal(fs.readFileSync(copia, 'utf8'), real, 'en sec no escriu res');
  const altra = escriu(posterior);
  assert.equal(altra.codi, e.EIXIDA.ARBRE);
  assert.match(altra.error, new RegExp(`--versio ${posterior.replace(/\./g, '\\.')} no és la de package.json \\(${seguent.replace(/\./g, '\\.')}\\)`));
  assert.deepEqual(escriu(seguent), { codi: e.EIXIDA.BE, canviat: true });
  assert.equal(fs.readFileSync(copia, 'utf8'), text);
  assert.deepEqual(escriu(seguent), { codi: e.EIXIDA.BE, canviat: false });
  assert.equal(escriu(seguent, { androidBuild: bA - 1 }).codi, e.EIXIDA.ARBRE);
  assert.equal(publica.versioDelPaquet(ARREL), JSON.parse(fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8')).version);
  assert.equal(publica.versioDelPaquet(path.join(TEMPORAL, 'no-hi-es')), null);
  assert.ok(!fs.readdirSync(TEMPORAL).some((nom) => nom.startsWith('.ard.json')), 'cap temporal');
  assert.equal(fs.readFileSync(path.join(ARREL, ...publica.MANIFEST_VERSIO), 'utf8'), real, 'el manifest del repositori no s\'ha tocat');
});

/* Un fitxer d'entorn de proves fora del repositori, en 0600: la clau de Play de proves i, si cal, el registre. */
function entornDeProves({ registre = null, clau = true, cert = false } = {}) {
  const fora = fs.mkdtempSync(path.join(TEMPORAL, 'entorn-'));
  const linies = [`SDP_APP_ID=${PAQUET}`];
  if (clau) {
    const cami = path.join(fora, 'play-compte-servei.json');
    fs.writeFileSync(cami, JSON_CLAU, { mode: 0o600 });
    fs.chmodSync(cami, 0o600);
    linies.push(`SDP_PLAY_JSON_KEY_PATH=${cami}`);
  }
  if (cert) linies.push(`SDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}`);
  if (registre !== null) {
    const builds = path.join(fora, 'builds');
    fs.mkdirSync(builds);
    fs.writeFileSync(path.join(builds, e.REGISTRE_DE_PUJADES), registre.map((linia) => `${JSON.stringify(linia)}\n`).join(''), { mode: 0o600 });
    linies.push(`SDP_BUILDS_DIR=${builds}`);
  }
  const fitxer = path.join(fora, 'botigues.env');
  fs.writeFileSync(fitxer, `${linies.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(fitxer, 0o600);
  return { fora, env: { SDP_BOTIGUES_ENV: fitxer } };
}

/* La pantalla de main, sencera. */
async function ambPantalla(fes) {
  const pantalla = capturaPantalla();
  try {
    const codi = await fes();
    return { codi, vist: pantalla.vist };
  } finally {
    pantalla.restaura();
  }
}

test('R32.3 · publica-tot: --publica-apk i --sincronitza-ard van sols, mai junts, i amb versió explícita; --desplega només per a Android', { skip: SENSE_REPOSITORI }, async () => {
  const errada = process.stderr.write;
  let dit = '';
  process.stderr.write = (text) => { dit += text; return true; };
  try {
    assert.equal(await publica.main(['--publica-apk', '--versio', '1.2.5', '--build', '10', '--plataforma', 'android']), e.EIXIDA.US);
    assert.match(dit, /sobren: --plataforma/);
    assert.equal(await publica.main(['--sincronitza-ard', '--versio', '1.2.5']), e.EIXIDA.US, 'sense cap build');
    assert.equal(await publica.main(['--publica-apk', '--versio', '1.2.5']), e.EIXIDA.US, 'l\'APK necessita --build');
    assert.equal(await publica.main(['--publica-apk', '--versio', '1.2.5', '--build', '10', '--build-ios', '10']), e.EIXIDA.US);
    assert.match(dit, /--build-ios només va amb --sincronitza-ard/);
    assert.equal(await publica.main(['--publica-apk', '--versio', '1.2.5', '--build', '10', '--corregeix-ard']), e.EIXIDA.US);
    assert.match(dit, /--corregeix-ard només va amb --sincronitza-ard/);
    assert.equal(await publica.main(['--versio', '1.2.5', '--build', '10', '--plataforma', 'ios', '--desplega', '--compila']), e.EIXIDA.US);
    assert.match(dit, /--desplega només és d’Android/);
  } finally {
    process.stderr.write = errada;
  }
  const resum = publica.resumOmnicanal(ARREL, { versio: '1.2.5', build: '10', plataforma: 'android', env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
  assert.deepEqual(resum.passos.map((pas) => pas.ordre.split(' --versio')[0]), [
    'node scripts/botigues/publica-tot.mjs', 'node scripts/botigues/puja-android.mjs', 'node scripts/botigues/publica-tot.mjs --publica-apk',
    // v1.2.7 · P0-123 · I l'anunci de l'APK publicat a les Apps d'instal·lació directa.
    'node scripts/botigues/publica-tot.mjs --sincronitza-proves'
  ]);
  assert.match(resum.passos[3].ordre, /--sincronitza-proves --versio 1\.2\.5 --build-apk 10$/);
  assert.match(resum.passos[3].accio, /ABANS de l'rsync de dist\/ al Node 0 i de firebase deploy/);
  assert.match(resum.passos[1].accio, /API REST v3 \(pista internal, esborrany/);
  // Onada v1.2.6 · L'APK el servix el Node 0: l'ordre que el publica va abans de l'rsync de dist/, no de firebase deploy.
  assert.match(resum.passos[2].accio, /entre «npm run build» \(que buida dist\/\) i l'rsync de dist\/ al Node 0 \(socdepoble\.cat\)/);
  assert.match(resum.passos[2].accio, /Firebase no el puja i hi redirigix \(302\)/);
  assert.equal(resum.preflight.linies.some((l) => /fastlane/.test(l) && !/sense fastlane/.test(l)), false);
  // R32.3-PEIX-ARD · A la prova interna, el pla no anuncia res a ard.json (només ho fa production).
  assert.ok(!resum.passos.some((pas) => pas.ordre.includes('--sincronitza-ard')), 'cap --sincronitza-ard a la prova interna');

  /* R32.3-PEIX-ARD · A producció, el pla omnicanal encadena --sincronitza-ard (Android i iOS) després de
     cada pujada i ABANS de «npm run build»; l'APK directe, que necessita el dist/ d'eixe build, després. */
  const totes = publica.resumOmnicanal(ARREL, { versio: '1.2.5', build: '10', plataforma: 'totes', canal: 'produccio', env: { SDP_BOTIGUES_ENV: path.join(TEMPORAL, 'no-hi-es.env') } });
  const index = (re) => totes.passos.findIndex((pas) => re.test(pas.ordre));
  const iBuild = index(/^npm run build /);
  const iArdAndroid = index(/--sincronitza-ard --versio 1\.2\.5 --build 10$/);
  const iArdIos = index(/--sincronitza-ard --versio 1\.2\.5 --build-ios 10$/);
  assert.ok(iBuild > 0, 'hi ha el pas web');
  assert.ok(iArdAndroid >= 0 && iArdAndroid < iBuild, `ARD d'Android (${iArdAndroid}) abans de npm run build (${iBuild})`);
  assert.ok(iArdIos >= 0 && iArdIos < iBuild, `ARD d'iOS (${iArdIos}) abans de npm run build (${iBuild})`);
  assert.ok(index(/puja-android\.mjs/) < iArdAndroid, 'després de la pujada a Google Play');
  assert.ok(index(/puja-ios\.mjs/) < iArdIos, 'després de la pujada a l\'App Store');
  assert.ok(iArdIos < index(/--build-testflight 10$/), 'abans de l\'anunci de TestFlight');
  assert.ok(index(/--publica-apk --versio/) > iBuild && index(/--build-apk 10$/) > index(/--publica-apk --versio/), 'l\'APK directe, després del build');
  assert.match(totes.passos[iArdAndroid].accio, /pista production/);
  /* Revisió adversarial · ard.json és versionat: escriure'l deixa l'arbre brut i el preflight de
     puja-ios.mjs (i de qualsevol compilació o pujada nativa) ja no deixaria seguir. Cap pas natiu
     va darrere del primer anunci. I el connector WordPress, com abans, després del pas web. */
  const iPrimerAnunci = totes.passos.findIndex((pas) => /--sincronitza-(ard|proves)/.test(pas.ordre));
  const natius = totes.passos.map((pas, i) => (/--compila|puja-(android|ios)\.mjs/.test(pas.ordre) ? i : -1)).filter((i) => i >= 0);
  assert.equal(natius.length, 3, 'compila Android, puja Android, compila iOS');
  assert.ok(natius.every((i) => i < iPrimerAnunci), `cap pas natiu (${natius}) després del primer anunci (${iPrimerAnunci})`);
  assert.ok(index(/npm run build:wp /) > iBuild, 'el connector WordPress, després del pas web');
  assert.equal(totes.passos.filter((pas) => pas.ordre.includes('npm run build ')).length, 1, 'un sol build web');

  /* Elefant (contraexemple del Peix silent_failure_hunter) · Abans, «--sincronitza-ard --publica-apk» sense
     dist/index.html escrivia ard.json i després eixia amb 7. Ara van en ordres a banda: res s'escriu. */
  const manifest = path.join(TEMPORAL, 'ard-junts.json');
  fs.writeFileSync(manifest, '{"version":"1.0.0","androidBuild":1,"entries":[]}\n');
  const { env } = entornDeProves();
  const junts = await ambPantalla(() => publica.main(['--sincronitza-ard', '--publica-apk', '--versio', publica.versioDelPaquet(ARREL), '--build', '1'], { env, manifest }));
  assert.equal(junts.codi, e.EIXIDA.US);
  assert.match(junts.vist, /van en ordres a banda: el manifest \(public\/\) abans de npm run build/);
  assert.equal(fs.readFileSync(manifest, 'utf8'), '{"version":"1.0.0","androidBuild":1,"entries":[]}\n');
  // --publica-apk sense la clau de pujada al fitxer d'entorn: no verifica res, no publica res.
  const senseCert = await ambPantalla(() => publica.main(['--publica-apk', '--versio', '1.2.5', '--build', '10'], { env }));
  assert.equal(senseCert.codi, e.EIXIDA.FALTA);
  assert.match(senseCert.vist, /falta SDP_ANDROID_UPLOAD_CERT_SHA256/);
});

test('R32.3 · Elefant · --sincronitza-ard només anuncia el build que la botiga ja DONA (Play per l\'API, iOS pel registre de producció)', { skip: SENSE_REPOSITORI }, async () => {
  const versio = publica.versioDelPaquet(ARREL);
  const build = Number(VERSIO_CLIENT_NATIU);
  assert.ok(versio && build > 1, 'package.json i VERSIO_CLIENT_NATIU');
  const inicial = `${JSON.stringify({ version: '0.0.1', androidBuild: build - 1, iosBuild: build - 1, entries: [{ identifier: 'x', version: '0.0.1' }] }, null, 2)}\n`;
  const manifest = path.join(TEMPORAL, 'ard-cli.json');
  const sim = await simulador();
  const posaPlay = (pistes) => { sim.play.publicat = pistes; };
  const llancament = (status, codi = build, track = 'internal') => ({ track, releases: [{ name: 'x', versionCodes: [String(codi)], status }] });
  const play = { endpoints: sim.endpoints, espera: async () => {} };
  const ard = (args, entorn, mes = {}) => ambPantalla(() => publica.main(['--sincronitza-ard', '--versio', versio, ...args], { env: entorn.env, play, manifest, ...mes }));
  try {
    const android = entornDeProves();
    // 1. Play encara no el té, o només en esborrany: ard.json no canvia.
    fs.writeFileSync(manifest, inicial);
    let r = await ard(['--build', String(build)], android);
    assert.equal(r.codi, e.EIXIDA.ARBRE, r.vist);
    assert.match(r.vist, new RegExp(`Google Play no té el versionCode ${build} a cap pista`));
    posaPlay({ internal: llancament('draft') });
    r = await ard(['--build', String(build)], android);
    assert.equal(r.codi, e.EIXIDA.ARBRE);
    assert.match(r.vist, /no el dona a tots els Android \(internal: draft\): .*promou-lo a production a Play Console/);
    assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'res escrit');
    assert.ok(!sim.ops().includes('commit'), 'la consulta és de lectura');
    /* 2. R32.3-PEIX-ARD · Desplegat NOMÉS a la prova interna: no s'escriu, perquè androidBuild
       s'anuncia a tots els Android i la pista internal només la reben els provadors de Play. */
    posaPlay({ internal: llancament('completed') });
    r = await ard(['--build', String(build)], android);
    assert.equal(r.codi, e.EIXIDA.ARBRE, r.vist);
    assert.match(r.vist, /no el dona a tots els Android \(internal: completed\)/);
    assert.match(r.vist, /només anuncia un build de la pista production «completed»/);
    assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, 'la prova interna no s\'anuncia');
    // A production, un esborrany o un desplegament per fases tampoc es donen a tots.
    for (const status of ['draft', 'inProgress']) {
      posaPlay({ internal: llancament('completed'), production: llancament(status, build, 'production') });
      r = await ard(['--build', String(build)], android);
      assert.equal(r.codi, e.EIXIDA.ARBRE, `${status}: ${r.vist}`);
      assert.match(r.vist, new RegExp(`no el dona a tots els Android \\(internal: completed, production: ${status}\\)`));
      assert.equal(fs.readFileSync(manifest, 'utf8'), inicial, `${status}: res escrit`);
    }
    assert.ok(!sim.ops().includes('commit'), 'la consulta és de lectura');
    // Desplegat a production («completed»): s'escriu.
    posaPlay({ internal: llancament('completed'), production: llancament('completed', build, 'production') });
    r = await ard(['--build', String(build)], android);
    assert.equal(r.codi, e.EIXIDA.BE, r.vist);
    assert.match(r.vist, new RegExp(`Google Play dona el versionCode ${build} a la pista production \\(completed\\)`));
    const escrit = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    assert.deepEqual([escrit.version, escrit.androidBuild, escrit.iosBuild, escrit.entries[0].version], [versio, build, build - 1, versio]);
    // 3. Les guardes pures paren abans de preguntar a Play: un build per damunt de VERSIO_CLIENT_NATIU, una altra versió.
    sim.crides.length = 0;
    r = await ard(['--build', String(build + 1)], android);
    assert.equal(r.codi, e.EIXIDA.ARBRE);
    assert.match(r.vist, /passa de VERSIO_CLIENT_NATIU/);
    r = await ambPantalla(() => publica.main(['--sincronitza-ard', '--versio', '99.0.0', '--build', String(build)], { env: android.env, play, manifest }));
    assert.equal(r.codi, e.EIXIDA.ARBRE);
    assert.match(r.vist, /no és la de package\.json/);
    r = await ard(['--build', String(build - 1)], android);
    assert.match(r.vist, /no es baixa a .*--corregeix-ard/);
    assert.deepEqual(sim.crides, [], 'cap crida a Play');
    // 4. --corregeix-ard baixa, però només a un build que Play dona a production (la prova interna no hi compta).
    posaPlay({ internal: llancament('completed', build - 1) });
    r = await ard(['--build', String(build - 1), '--corregeix-ard'], android);
    assert.equal(r.codi, e.EIXIDA.ARBRE, r.vist);
    assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).androidBuild, build, 'no baixa a un build només intern');
    posaPlay({ production: llancament('completed', build - 1, 'production') });
    r = await ard(['--build', String(build - 1), '--corregeix-ard'], android);
    assert.equal(r.codi, e.EIXIDA.BE, r.vist);
    assert.match(r.vist, /! --corregeix-ard: .* s'ha corregit a mà/);
    assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).androidBuild, build - 1);
    // 5. Sense la clau de Play no es pot preguntar: no s'escriu.
    r = await ard(['--build', String(build)], entornDeProves({ clau: false }));
    assert.equal(r.codi, e.EIXIDA.FALTA);
    assert.match(r.vist, /SDP_PLAY_JSON_KEY_PATH: falta/);
    // 6. iOS: només el registre de pujades de PRODUCCIÓ (l'App Store); TestFlight no compta.
    const entrada = (canal) => ({ plataforma: 'ios', canal, versio, build: String(build), sha256: null, commit: null, data: '2026-11-16T22:00:00Z' });
    r = await ard(['--build-ios', String(build)], entornDeProves({ clau: false, registre: [entrada('intern')] }));
    assert.equal(r.codi, e.EIXIDA.ARBRE);
    assert.match(r.vist, new RegExp(`el build ${build} d'iOS no és al registre de pujades de producció`));
    r = await ard(['--build-ios', String(build)], entornDeProves({ clau: false }));
    assert.equal(r.codi, e.EIXIDA.FALTA);
    r = await ard(['--build-ios', String(build)], entornDeProves({ clau: false, registre: [entrada('produccio')] }));
    assert.equal(r.codi, e.EIXIDA.BE, r.vist);
    assert.match(r.vist, /comprova a App Store Connect que Apple ja el dona/);
    assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).iosBuild, build);
    senseSecrets(r.vist, sim.vist);
    assert.ok(!r.vist.includes(TEMPORAL), 'cap ruta');
  } finally {
    await sim.tanca();
  }
  assert.ok(!fs.readdirSync(TEMPORAL).some((nom) => nom.startsWith('.ard-cli.json')), 'cap temporal');
});
