// Proves de la instantània sanejada de la Consola (tooling/vite/instantania-consola.mjs i el
// connector sdp:consola-instantania de tooling/vite/consola-iaia.mjs).
// Decisió del Mestre (31-10-2026) · «Sí, vull que la web publicada mostre una instantània sanejada
// amb totes les dades reals de la Consola a qualsevol usuari». Tres coses:
//   1. La instantània REAL d'este arbre (els mateixos productors que el middleware) o es publica
//      neta, comprovada amb un escàner independent d'esta prova, o atura el build (fail-closed)
//      amb un missatge que no porta el valor.
//   2. Amb fixtures: el que el sanejador emmascara i el que atura el build. La prova del
//      connector passa pel ganxo generateBundle de veres: si algú hi lleva el sanejador, cau.
//   3. El rellotge de la instantània (SOURCE_DATE_EPOCH) i el sobre d'error d'una font.
// Cap xarxa; els .env* es lligen per a buscar-ne els valors, que mai no s'imprimixen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from 'vite';
import {
  CARPETA_INSTANTANIA, CORREUS_PUBLICS, ESQUEMA_ERROR, ErrorInstantania, FONTS_INSTANTANIA, MARQUES, agullesDeLEntorn,
  comprovaPublicabilitat, construeixInstantania, instantDeLaInstantania, sanejaInstantania, sobreDError
} from './instantania-consola.mjs';
import consolaIaia, { BANDERA_INSTANTANIA, governAlRellotge, instantaniaConsola, productorsDeLaInstantania } from './consola-iaia.mjs';
import { PROJECT_DIR } from '../wiki/lib/project_paths.mjs';
import { ESQUEMA_ERROR_INSTANTANIA } from '../../src/sections/consola/fontsConsola.js';
import { caducitatDe } from '../../src/sections/consola/govern/matriuGovern.js';

const usuariDelSistema = (() => { try { return os.userInfo().username; } catch { return null; } })();

/* ── L'escàner independent: regles pròpies, cap import del sanejador ────── */
/* Gauntlet f9 (correus-institucionals-tot-el-domini) · Les adreces del domini propi
   que es poden publicar, llegides de les rutes de WebFinger de firebase.json. */
const ADRECES_DE_WEBFINGER = (() => {
  const firebase = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'firebase.json'), 'utf8'));
  const regles = (firebase.hosting?.rewrites ?? []).map((r) => r.regex ?? r.source ?? '').filter((r) => r.includes('webfinger'));
  return regles.map((r) => /acct\(\?::\|%3a\)([a-z0-9-]+)\(\?:@\|%40\)socdepoble\\\\?\.org/.exec(r)?.[1]).filter(Boolean)
    .map((nom) => `${nom}@socdepoble.org`);
})();
const SINTETICS = /@(?:[a-z0-9-]+\.)*example\.(?:com|net|org)$|@[a-z0-9.-]+\.(?:example|test|invalid|localhost)$/i;
const luhnIndependent = (xifres) => [...xifres].reverse().reduce((s, c, i) => s + (i % 2 ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][Number(c)] : Number(c)), 0) % 10 === 0;
function trobadesIndependents(text, { usuari = null, agulles = [] } = {}) {
  const trobades = [];
  const mira = (re, que) => { if (re.test(text)) trobades.push(que); };
  mira(/(?<![\w.~+%-])\\?\/Users\\?\/[A-Za-z0-9_]/i, 'camí /Users/');
  mira(/\beyJ[\w-]{10,}\.[\w-]{10,}/, 'JWT');
  mira(/\bsb_(?:secret|publishable)_\w{6,}/, 'clau sb_');
  mira(/BEGIN [A-Z ]{0,30}PRIVATE KEY/, 'clau privada');
  mira(/\bBearer\s+[\w.~+/-]{12,}/, 'Bearer');
  mira(/\b[a-z][\w+.-]*:\/\/[^\s/:@"]+:[^\s/@"]+@/i, 'credencials en URL');
  // Gauntlet f9 (sanejador-llista-negra-estreta) · Els proveïdors coneguts, cada un amb la seua regla.
  mira(/\bgh[pousr]_\w{20,}|\bgithub_pat_\w{20,}/, 'token de GitHub');
  mira(/\bsk-(?:ant|proj)-[\w-]{16,}|\bsk-[A-Za-z0-9]{32,}/, 'clau sk-');
  mira(/\bAIza[\w-]{35}/, 'clau de Google');
  mira(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, 'clau d’AWS');
  mira(/\bxox[abposr]-|hooks\.slack\.com\/services\/|discord(?:app)?\.com\/api\/webhooks\//, 'Slack o Discord');
  mira(/\b(?:sk|rk)_(?:live|test)_\w{16,}|\bwhsec_\w{20,}/, 'clau de Stripe');
  mira(/\bsyt_[\w-]{16,}/, 'token de Matrix');
  mira(/\bglpat-[\w-]{20,}|\bnpm_[A-Za-z0-9]{36}|\bGOCSPX-[\w-]{20,}|\bhf_[A-Za-z0-9]{30,}/, 'token de proveïdor');
  mira(/[?&](?:access_token|token|api_?key|key|sig|signature|x-amz-signature|x-goog-signature|secret|password)=[^&\s"]{8,}/i, 'token en URL');
  mira(/(?:^|[^\w-])(?:\w+_)?(?:SECRET|PASSWORD|PASS|TOKEN)\s*[:=]\s*["']?(?=[\w+/=.-]*\d)(?=[\w+/=.-]*[A-Za-z])[\w+/=.-]{8,}/i, 'assignació d’un secret');
  mira(/(?<![\w.])(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168|169\.254|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.\d{1,3}\.\d{1,3}(?![\w.])/, 'IP privada');
  mira(/\b(?:DNI|NIF|NIE)\b[\s:.]{0,4}(?:\d{8}|[XYZ]\d{7})\b/, 'document sense lletra');
  mira(/(?<![\w.,/+-])(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}(?![\w])/, 'telèfon');
  mira(/(?<![A-Za-z0-9])ES\d{2}(?: ?\d{4}){5}(?![A-Za-z0-9])/, 'IBAN');
  mira(/(?<![\w.])\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}(?![\w])/, 'CCC');
  for (const m of text.matchAll(/(?<![\w.])(?:\d[ -]?){12,18}\d(?![\w])/g)) {
    const xifres = m[0].replace(/\D/g, '');
    if (/^(?:4|5[1-5]|3[47]|6011|65)/.test(xifres) && luhnIndependent(xifres)) { trobades.push('targeta'); break; }
  }
  for (const m of text.matchAll(/[\w.%+-]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}\b/gi)) {
    if (!SINTETICS.test(m[0]) && !ADRECES_DE_WEBFINGER.includes(m[0].toLowerCase())) { trobades.push('correu'); break; }
  }
  if (usuari && usuari.length >= 4 && text.toLowerCase().includes(usuari.toLowerCase())) trobades.push('usuari del sistema');
  if (agulles.some((a) => text.includes(a))) trobades.push('valor de l’entorn');
  return trobades;
}

/** Les agulles independents: cada valor de TOTS els .env* (arrel, supabase/, supabase/functions/; cap .example) i del procés amb nom de secret. */
function agullesIndependents(arrel) {
  const valors = [];
  const fitxers = ['', 'supabase', 'supabase/functions'].flatMap((carpeta) => {
    try { return fs.readdirSync(path.join(arrel, carpeta)).filter((n) => /^\.env/.test(n) && !/example/i.test(n)).map((n) => path.join(arrel, carpeta, n)); } catch { return []; }
  });
  const entorns = [{ ...loadEnv('production', arrel, ''), ...process.env }, ...fitxers.map((f) => Object.fromEntries(
    fs.readFileSync(f, 'utf8').split('\n').map((l) => /^\s*(?:export\s+)?(\w+)\s*=\s*["']?(.*?)["']?\s*$/.exec(l)).filter(Boolean).map((m) => [m[1], m[2]])
  ))];
  for (const entorn of entorns) {
    for (const [nom, valor] of Object.entries(entorn)) {
      if (!/KEY|SECRET|TOKEN|PASS|PRIV|JWT|CREDENTIAL|SERVICE_ROLE/i.test(nom) || /_(?:PATH|DIR|ID|ALIAS|URL)$/i.test(nom) || typeof valor !== 'string') continue;
      if (valor.trim().length >= (/PASS/i.test(nom) ? 8 : 16)) valors.push(valor.trim());
    }
  }
  return valors;
}

/* ── 1 · La instantània real d'este arbre ─────────────────────────────── */
/* Gauntlet f9 (prova-arbre-real-buida-per-govern, F6) · Una font que atura el build
   per l'usuari del sistema (hui govern.json, per una fila del Llibre) es torna a
   sanejar sense eixa guarda i el seu contingut passa igualment per l'escàner
   independent: la font que porta dades personals no es queda mai sense mirar. Que
   el build web s'aturaria es diu com a diagnòstic (la porta de publicabilitat és
   `node tooling/vite/instantania-consola.mjs --comprova`), no com una fallada: el
   contingut del Llibre no ha de posar roja una prova de no-fuga. */
test('la instantània real de l’arbre: quatre fonts JSON netes, o el build s’atura sense mostrar el valor', async (t) => {
  const ara = Date.parse('2026-10-31T00:00:00.000Z');
  const agulles = agullesIndependents(PROJECT_DIR);
  const agullesDelSanejador = agullesDeLEntorn({ entorn: { ...loadEnv('production', PROJECT_DIR, ''), ...process.env }, arrel: PROJECT_DIR });
  const productors = productorsDeLaInstantania({ arrel: PROJECT_DIR, ara });
  const nomesUna = (font) => Object.fromEntries(FONTS_INSTANTANIA.map((f) => [f, f === font ? productors[f] : () => null]));
  const perFont = await Promise.all(FONTS_INSTANTANIA.map(async (font) => {
    try {
      const { fitxers } = await construeixInstantania({ productors: nomesUna(font), agulles: agullesDelSanejador });
      return { font, text: fitxers.get(`${CARPETA_INSTANTANIA}/${font}.json`) };
    } catch (e) {
      if (!(e instanceof ErrorInstantania) || !/nom d’usuari del sistema/.test(e.tipus)) return { font, error: e };
      const { fitxers } = await construeixInstantania({ productors: nomesUna(font), agulles: agullesDelSanejador, usuari: null });
      return { font, error: e, text: fitxers.get(`${CARPETA_INSTANTANIA}/${font}.json`), senseGuardaDUsuari: true };
    }
  }));
  let escanejades = 0;
  for (const { font, text, error, senseGuardaDUsuari } of perFont) {
    if (error) {
      // Fail-closed: només ErrorInstantania, i el missatge no porta cap valor.
      assert.ok(error instanceof ErrorInstantania, `${font}: ${error?.name}`);
      assert.match(error.message, new RegExp(`a ${font}\\.json`));
      assert.deepEqual(trobadesIndependents(error.message, { usuari: usuariDelSistema, agulles }), [], `${font}: el missatge d'error no porta valors`);
      t.diagnostic(`${font}.json no es pot publicar hui (vite build s'aturaria): ${error.message}`);
      if (!text) continue;
    }
    const valor = JSON.parse(text);
    assert.ok(valor && typeof valor === 'object', `${font}: un objecte JSON`);
    assert.deepEqual(trobadesIndependents(text, { usuari: senseGuardaDUsuari ? null : usuariDelSistema, agulles }), [], `${font}: cap secret ni dada personal`);
    escanejades++;
  }
  assert.equal(escanejades, perFont.filter((f) => f.text).length);
  assert.ok(escanejades >= 3, `s’han escanejat ${escanejades} fonts`);
});

/* ── 2 · Fixtures: què s'emmascara i què atura el build ───────────────── */
const PERSONALS = Object.freeze({
  cami: '/Users/mariaprova/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/LEDGER.md',
  correu: 'maria.prova@gmail.com',
  appleId: 'gentdelaprova@mac.com',
  telefon: '612 345 678',
  telefonInternacional: '+34 612 34 56 78',
  nif: '12345678Z',
  nie: 'X1234567L',
  iban: 'ES91 2100 0418 4502 0005 1332',
  // Gauntlet f9 (sanejador-llista-negra-estreta, correus-institucionals-tot-el-domini)
  ccc: '2100 0418 45 0200051332',
  targeta: '4111 1111 1111 1111',
  ipCasa: '192.168.1.37',
  ipTailscale: '100.101.102.103',
  dniSenseLletra: '48123456',
  bustiaDelDomini: 'pepe.perez@socdepoble.org'
});
const fixtures = () => ({
  consola: () => ({ generat: '2026-10-31T00:00:00.000Z', rebuts: [{ fonts: [{ ruta: PERSONALS.cami }] }], [`clau ${PERSONALS.correu}`]: 1 }),
  mapa: () => ({
    schema: 'sdp.mapa.v1',
    nodes: [{ id: 'script:x', evidencia: `cd ${PERSONALS.cami} i truca al ${PERSONALS.telefon}` }],
    xarxa: `el NAS és a ${PERSONALS.ipCasa} i Tailscale a ${PERSONALS.ipTailscale}; el servidor de proves, a 127.0.0.1 i 8.8.8.8`,
    paquet: 'vite@7.3.6'
  }),
  govern: () => ({
    schema: 'sdp.govern.v1',
    mcr: { requirements: [{ id: 'P0-08b', requirement: `Equip (${PERSONALS.appleId}) · NIF ${PERSONALS.nif}, NIE ${PERSONALS.nie} · DNI ${PERSONALS.dniSenseLletra} · ${PERSONALS.telefonInternacional} · escriu a ${PERSONALS.bustiaDelDomini}` }] },
    contacte: 'socdepoble@socdepoble.org',
    fediverse: 'acct:la-torre-de-les-macanes@socdepoble.org'
  }),
  empaquetats: () => ({
    schema: 'sdp.empaquetats.v1', compte: `IBAN ${PERSONALS.iban} · CCC ${PERSONALS.ccc} · targeta ${PERSONALS.targeta}`,
    artefactes: ['261029_1606_wordpress_directori_v1.1.10.zip'], versio: '1.1.10', build: '1793288187000'
  })
});

test('les dades personals s’emmascaren a totes les fonts, i el que és públic es queda', async () => {
  const { fitxers, recompte, errors } = await construeixInstantania({ productors: fixtures(), usuari: 'mariaprova' });
  assert.deepEqual([...fitxers.keys()], FONTS_INSTANTANIA.map((f) => `__iaia/${f}.json`));
  assert.deepEqual(errors, []);
  const tot = [...fitxers.values()].join('\n');
  for (const [que, valor] of Object.entries(PERSONALS)) assert.equal(tot.includes(valor), false, `${que} no hi és`);
  assert.equal(tot.includes('mariaprova'), false, 'ni el nom d’usuari del camí');
  assert.ok(tot.includes('~/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/LEDGER.md'), 'el camí, relatiu a ~');
  for (const marca of Object.values(MARQUES)) assert.ok(tot.includes(marca), marca);
  assert.ok(tot.includes('socdepoble@socdepoble.org'), 'el correu institucional publicat es queda');
  assert.ok(tot.includes('acct:la-torre-de-les-macanes@socdepoble.org'), 'i el compte del fedivers publicat');
  assert.ok(tot.includes('127.0.0.1') && tot.includes('8.8.8.8'), 'una IP que no és d’una xarxa privada es queda');
  assert.ok(tot.includes('DNI [NIF emmascarat]'), 'el document sense lletra, amb el nom davant');
  assert.ok(tot.includes('vite@7.3.6') && tot.includes('"1793288187000"'), 'un paquet no és cap correu, ni un instant cap targeta');
  assert.ok(recompte.camins >= 2 && recompte.correus >= 3 && recompte.telefons >= 2 && recompte.nifs >= 3 && recompte.ibans === 1
    && recompte.comptes === 1 && recompte.targetes === 1 && recompte.ips === 2, JSON.stringify(recompte));
  assert.deepEqual(trobadesIndependents(tot, { usuari: 'mariaprova' }), []);
});

test('l’escàner independent caça tot el que la instantània emmascara (si el sanejador no hi fóra, la prova cauria)', async () => {
  const brut = await Promise.all(Object.values(fixtures()).map((p) => p())).then((v) => JSON.stringify(v));
  const trobades = trobadesIndependents(brut, { usuari: 'mariaprova' });
  for (const que of ['camí /Users/', 'telèfon', 'IBAN', 'CCC', 'targeta', 'IP privada', 'document sense lletra', 'correu', 'usuari del sistema']) {
    assert.ok(trobades.includes(que), `${que}: ${trobades.join(', ')}`);
  }
});

test('les adreces publicables del domini propi són exactament les de WebFinger de firebase.json', () => {
  assert.deepEqual([...CORREUS_PUBLICS].sort(), [...new Set(ADRECES_DE_WEBFINGER)].sort());
});

const SECRETS = Object.freeze([
  ['JWT', `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.c2lnbmF0dXJh`],
  ['clau sb_secret_', 'sb_secret_AbCdEfGhIjKlMnOpQrSt'],
  ['clau sb_publishable_', 'sb_publishable_AbCdEfGhIjKlMnOpQrSt'],
  ['token Bearer', 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345'],
  ['credencials en una URL', 'postgres://postgres:contrasenya-molt-llarga@db.example.com:5432/postgres'],
  ['clau PEM', '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg'],
  ['clau VAPID JWK', '{"kty":"EC","crv":"P-256","x":"a","y":"b","d":"AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdE"}'],
  ['assignació d’un secret', 'service_role_key=AbCdEfGhIjKlMnOpQrStUvWxYz0123'],
  ['usuari del sistema', 'aprovat per mariaprova a la nit'],
  // Gauntlet f9 (sanejador-llista-negra-estreta) · Els que abans passaven intactes.
  ['token de GitHub', `ghp_${'A1b2C3d4E5'.repeat(4)}`],
  ['token fi de GitHub', `github_pat_11ABCDEFG0${'A1b2C3d4E5'.repeat(4)}`],
  ['clau d’Anthropic', `sk-ant-api03-${'A1b2C3d4E5'.repeat(8)}`],
  ['clau d’OpenAI', `sk-proj-${'A1b2C3d4E5'.repeat(4)}`],
  ['clau d’API de Google', `AIzaSy${'A1b2C3d4E5'.repeat(3)}abc`],
  ['clau d’AWS', 'AKIAIOSFODNN7EXAMPLE'],
  ['token de Slack', `xoxb-1234567890-1234567890123-${'A1b2C3d4'.repeat(3)}`],
  ['webhook de Slack', `https://hooks.slack.com/services/T0000000/B0000000/${'A1b2C3d4'.repeat(3)}`],
  ['clau de Stripe', `sk_live_${'A1b2C3d4E5'.repeat(3)}`],
  ['token de Matrix', `syt_c29jZGVwb2JsZQ_${'A1b2C3d4E5'.repeat(2)}_0aBcDe`],
  ['token de GitLab', `glpat-${'A1b2C3d4E5'.repeat(2)}`],
  ['token en una URL', `https://exemple.org/cb?access_token=${'A1b2C3d4'.repeat(4)}`],
  ['signatura en una URL', `https://bucket.s3.amazonaws.com/x?X-Amz-Signature=${'a1b2c3d4'.repeat(5)}`],
  ['JWT_SECRET=', `JWT_SECRET=${'A1b2C3d4E5'.repeat(4)}`],
  ['SMTP_PASS:', 'SMTP_PASS: Xk3pQz9LmW2v'],
  ['Bearer curt', 'Authorization: Bearer A1b2C3d4E5f6G7h8J9']
]);

for (const [que, secret] of SECRETS) {
  test(`fail-closed: ${que} atura el build, i el missatge no porta el valor`, async () => {
    const productors = { ...fixtures(), govern: () => ({ schema: 'sdp.govern.v1', mcr: { requirements: [{ id: 'P1-01', evidence: secret }] } }) };
    await assert.rejects(construeixInstantania({ productors, usuari: 'mariaprova' }), (e) => {
      assert.ok(e instanceof ErrorInstantania, e?.message);
      assert.match(e.message, /a govern\.json\.mcr\.requirements\[0\]\.evidence/);
      assert.equal(e.message.includes(secret), false);
      assert.equal(e.message.includes(secret.slice(-12)), false);
      return true;
    });
  });
}

test('fail-closed: el valor d’un secret de l’entorn (també en una clau) atura el build', async () => {
  const valor = 'zQ8vN2kL5pR7tY1wX4cB6mJ9';
  const agulles = agullesDeLEntorn({ entorn: { SDP_PUSH_TOKEN: valor, VITE_CANONICAL_URL: 'https://socdepoble.org' } });
  assert.deepEqual(agulles, [valor], 'només els noms de secret; una URL pública no és cap agulla');
  const productors = { ...fixtures(), consola: () => ({ [`x${valor}`]: 1 }) };
  await assert.rejects(construeixInstantania({ productors, agulles, usuari: null }), (e) => e instanceof ErrorInstantania && !e.message.includes(valor));
});

test('el que només ho sembla no atura res: prosa, marcadors de lloc, recomptes i hashes', () => {
  const textos = [
    'secrets: 2.703', 'token: caducat', 'Contrasenya: obligatòria per a tothom', 'SMTP_PASS=${SMTP_PASS}', 'password: process.env.SMTP_PASSWORD',
    'api_key=<la-teua-clau>', 'un token Bearer del navegador', 'tasks-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 'bypass: A1b2C3d4E5f6',
    'core-secretaria-auditoria/SKILL.md', 'https://socdepoble.org/consola?pagina=govern&vista=certificacio', 'sha256 2a72a496da833b5a3da23530acbeec'
  ];
  for (const t of textos) assert.equal(sanejaInstantania({ t }, { usuari: null }).t, t, t);
  assert.deepEqual(sanejaInstantania({ 'core-secretaria-auditoria/SKILL.md': '2a72a496da833b5a3da23530acbeec01' }, { usuari: null }),
    { 'core-secretaria-auditoria/SKILL.md': '2a72a496da833b5a3da23530acbeec01' }, 'una clau que conté «secret» dins d’una paraula');
});

test('fail-closed: un camp amb nom de secret i un valor de secret atura el build', () => {
  for (const camp of [{ password: 'Xk3pQz9LmW2v' }, { SMTP_PASS: 'Xk3pQz9LmW2v' }, { api_key: 'A1b2C3d4E5f6G7h8' }, { client_secret: 'A1b2C3d4E5f6G7h8' }]) {
    assert.throws(() => sanejaInstantania({ config: camp }, { on: 'consola.json', usuari: null }), (e) => e instanceof ErrorInstantania
      && /camp amb nom de secret a consola\.json\.config\./.test(e.message) && !e.message.includes(Object.values(camp)[0]));
  }
  // Un comptador o un estat buit en un camp així no és cap secret.
  assert.deepEqual(sanejaInstantania({ tokens: '1234', access_token: '', password: 'pendent' }, { usuari: null }), { tokens: '1234', access_token: '', password: 'pendent' });
});

/* Gauntlet f9 (cami-error-clau-crua) · El camí de l'error es fa amb la clau ja emmascarada. */
test('fail-closed: el camí de l’error no porta la dada personal d’una clau', () => {
  const clau = 'maria.prova@gmail.com 612345678 12345678Z';
  assert.throws(() => sanejaInstantania({ [clau]: { nota: 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345' } }, { on: 'govern.json', usuari: null }), (e) => {
    assert.ok(e instanceof ErrorInstantania);
    assert.match(e.message, /a govern\.json\._correu_emmascarat_.*\.nota:/);
    for (const tros of ['maria', 'gmail', '612345678', '12345678Z']) assert.equal(e.message.includes(tros), false, tros);
    return true;
  });
  assert.throws(() => sanejaInstantania({ files: { 'pep.garcia@hotmail.es': [`eyJhbGciOiJIUzI1NiJ9.${'a'.repeat(12)}.${'b'.repeat(12)}`] } }, { on: 'consola.json', usuari: null }),
    (e) => e instanceof ErrorInstantania && !/pep|hotmail/.test(e.message));
});

/* Gauntlet f9 (agulles-env-incompletes) · Tots els .env*, no només els que llig loadEnv('production'). */
test('fail-closed: una contrasenya de .env.botigues.local (i de qualsevol .env.<altre>.local) és una agulla', (t) => {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-instantania-env-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const contrasenya = 'Xk3pQz9LmW2vRt7Ny';
  const curta = 'qwerty12';
  fs.writeFileSync(path.join(arrel, '.env.botigues.local'), [
    `SDP_ANDROID_KEYSTORE_PASSWORD=${contrasenya}`, `export SDP_ANDROID_KEY_PASSWORD="${curta}"`,
    'SDP_ASC_KEY_PATH=/Users/mariaprova/claus/AuthKey_ABC.p8', 'SDP_ANDROID_KEY_ALIAS=upload', 'SDP_BUILDS_DIR=../_builds_de_poble'
  ].join('\n'));
  fs.mkdirSync(path.join(arrel, 'supabase'));
  fs.writeFileSync(path.join(arrel, 'supabase', '.env.funcions.local'), 'SDP_PUSH_TOKEN=zQ8vN2kL5pR7tY1wX4cB6mJ9\n');
  fs.writeFileSync(path.join(arrel, '.env.example'), 'SDP_EXEMPLE_SECRET=AquestNoEsUnSecretDeVeritat0\n');
  assert.equal(Object.keys(loadEnv('production', arrel, '')).some((n) => n.startsWith('SDP_ANDROID')), false, 'loadEnv no el llig');
  const agulles = agullesDeLEntorn({ entorn: loadEnv('production', arrel, ''), arrel });
  assert.ok(agulles.includes(contrasenya) && agulles.includes(curta) && agulles.includes('zQ8vN2kL5pR7tY1wX4cB6mJ9'), 'les contrasenyes, també la curta, i el token de supabase/');
  assert.equal(agulles.some((a) => a.includes('AuthKey') || a === 'upload' || a.includes('AquestNo')), false, 'ni camins, ni àlies, ni .env.example');
  for (const valor of [contrasenya, curta]) {
    assert.throws(() => sanejaInstantania({ nota: `la clau del keystore és ${valor}` }, { agulles, usuari: null }),
      (e) => e instanceof ErrorInstantania && /secret de l’entorn/.test(e.message) && !e.message.includes(valor));
  }
});

test('fail-closed: el que no és JSON pla (funcions, cicles, NaN) atura el build', () => {
  const cicle = {}; cicle.jo = cicle;
  for (const brut of [{ f: () => 1 }, cicle, { n: Number.NaN }, { d: new Date(0) }]) {
    assert.throws(() => sanejaInstantania(brut, { usuari: null }), ErrorInstantania);
  }
});

/* El connector del build, amb el ganxo de veres: si algú hi lleva el sanejador, esta prova cau. */
test('el connector del build emet __iaia/<font>.json sanejats i segella la bandera; un secret de .env l’atura', async (t) => {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-instantania-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const connector = instantaniaConsola({ arrel, productors: () => fixtures() });
  assert.equal(connector.apply, 'build');
  assert.deepEqual(connector.config({}), { define: { [BANDERA_INSTANTANIA]: '"1"' } });
  assert.equal(connector.config({ build: { ssr: true } }), undefined, 'un build SSR no la porta');
  const avisos = [];
  const logger = { info: (m) => avisos.push(m), warn: (m) => avisos.push(m) };
  const emet = async () => {
    const emesos = new Map();
    connector.configResolved({ root: arrel, mode: 'production', envDir: arrel, logger, build: {} });
    await connector.generateBundle.call({ emitFile: ({ fileName, source }) => emesos.set(fileName, source) });
    return emesos;
  };
  const emesos = await emet();
  assert.deepEqual([...emesos.keys()], FONTS_INSTANTANIA.map((f) => `__iaia/${f}.json`));
  const tot = [...emesos.values()].join('\n');
  for (const valor of Object.values(PERSONALS)) assert.equal(tot.includes(valor), false);
  assert.match(avisos.join('\n'), /\[sdp:consola-instantania\] 4 fonts a __iaia\/ · emmascarat: /);
  // Un secret de l'entorn del build (.env de l'arrel) que apareix a les dades: el build s'atura.
  const valor = 'pQ3sT6vY9bE2hK5nR8uX1zC4';
  fs.writeFileSync(path.join(arrel, '.env'), `SDP_INTERN_SECRET=${valor}\n`);
  const ambSecret = instantaniaConsola({ arrel, productors: () => ({ ...fixtures(), empaquetats: () => ({ nota: `clau ${valor}` }) }) });
  ambSecret.configResolved({ root: arrel, mode: 'production', envDir: arrel, logger, build: {} });
  // El connector carrega el sanejador pel seu camí amb ?v=<mtime> (una altra instància del mòdul): pel nom.
  await assert.rejects(ambSecret.generateBundle.call({ emitFile: () => { throw new Error('no s’havia d’emetre res'); } }),
    (e) => e?.name === 'ErrorInstantania' && /a empaquetats\.json\.nota/.test(e.message) && !e.message.includes(valor));
});

test('vite.config.js registra consolaIaia(): el connector de la instantània hi va darrere del de desenvolupament', () => {
  assert.deepEqual(consolaIaia().map((c) => [c.name, c.apply]), [['sdp:consola-iaia', 'serve'], ['sdp:consola-instantania', 'build']]);
  assert.match(fs.readFileSync(path.join(PROJECT_DIR, 'vite.config.js'), 'utf8'), /^\s*consolaIaia\(\),$/m);
  // Ni el connector de WordPress ni el natiu no porten instantània.
  for (const config of ['vite.standalone.config.js', 'vite.natiu.config.js']) {
    assert.equal(/consola-iaia|instantania-consola|SDP_CONSOLA_INSTANTANIA/.test(fs.readFileSync(path.join(PROJECT_DIR, config), 'utf8')), false, config);
  }
});

/* ── 3 · Rellotge i sobre d'error ─────────────────────────────────────── */
test('el rellotge: SOURCE_DATE_EPOCH si n’hi ha (build reproduïble), i consola.json el porta a generat i a fonts.*.h', () => {
  assert.equal(instantDeLaInstantania({ SOURCE_DATE_EPOCH: '1793288187' }, 5), 1793288187000);
  assert.equal(instantDeLaInstantania({}, 5), 5);
  const ara = 1793288187000;
  const consola = productorsDeLaInstantania({ arrel: PROJECT_DIR, ara }).consola();
  assert.equal(consola.generat, new Date(ara).toISOString());
  for (const font of Object.values(consola.fonts)) if ('h' in font) assert.equal(font.h, ara);
});

test('una font que falla ix com un sobre d’error amb un text fix: el missatge original (amb camins) no hi va', async () => {
  const errorGovern = Object.assign(new Error('No es troba el Llibre Mestre com a fitxer normal.'), { name: 'ErrorGovern', codi: 'llibre-absent' });
  assert.deepEqual(sobreDError('govern', errorGovern), { schema: ESQUEMA_ERROR, font: 'govern', codi: 'llibre-absent', error: 'No es troba el Llibre Mestre com a fitxer normal.' });
  assert.equal(ESQUEMA_ERROR, ESQUEMA_ERROR_INSTANTANIA, 'el client reconeix el mateix sobre');
  const { fitxers, errors } = await construeixInstantania({
    productors: { ...fixtures(), mapa: () => { throw new Error('ENOENT /Users/mariaprova/secret/mapa'); } },
    usuari: 'mariaprova'
  });
  assert.deepEqual(errors, [{ font: 'mapa', codi: 'intern' }]);
  const mapa = JSON.parse(fitxers.get('__iaia/mapa.json'));
  assert.deepEqual(mapa, { schema: ESQUEMA_ERROR, font: 'mapa', codi: 'intern', error: 'No s’ha pogut compilar el Mapa en fer la instantània.' });
});

/* Gauntlet f9 (F6-prova-de-l-arbre-real-buida) · La porta de publicabilitat: diu quina font
   aturaria el build, i com, sense cap valor. */
test('la porta de publicabilitat: cada font, amb l’estat i el motiu, i cap valor', async () => {
  const neta = await comprovaPublicabilitat({ productors: fixtures(), usuari: 'mariaprova' });
  assert.deepEqual(neta, { publicable: true, fonts: FONTS_INSTANTANIA.map((font) => ({ font, estat: 'ok' })) });
  const secret = `ghp_${'A1b2C3d4E5'.repeat(4)}`;
  const amb = await comprovaPublicabilitat({
    productors: { ...fixtures(), mapa: () => { throw new Error('ENOENT /Users/mariaprova/x'); }, govern: () => ({ mcr: { requirements: [{ id: 'P1-68', requirement: `per mariaprova i ${secret}` }] } }) },
    usuari: 'mariaprova'
  });
  assert.equal(amb.publicable, false);
  assert.deepEqual(amb.fonts.map((f) => [f.font, f.estat, f.codi ?? null]), [['consola', 'ok', null], ['mapa', 'error', 'intern'], ['govern', 'atura', null], ['empaquetats', 'ok', null]]);
  assert.match(amb.fonts[2].missatge, /a govern\.json\.mcr\.requirements\[0\]\.requirement/);
  assert.equal(JSON.stringify(amb).includes(secret) || JSON.stringify(amb).includes('mariaprova'), false);
});

/* Gauntlet f9 (F7-source-date-epoch-pinta-tota-la-matriu-obsoleta) · Amb SOURCE_DATE_EPOCH,
   cap temps de paret de la matriu passa del rellotge de la instantània. */
test('SOURCE_DATE_EPOCH anterior al Llibre: la matriu es fixa al rellotge i no es pinta obsoleta per «data futura»', async () => {
  const epoca = Date.parse('2026-10-29T15:36:27.000Z');
  const mtimeDelLlibre = '2026-10-30T22:19:38.097Z';
  assert.deepEqual(governAlRellotge({ mcr: { at: mtimeDelLlibre, requirements: [] }, trasllat: null }, epoca),
    { mcr: { at: new Date(epoca).toISOString(), requirements: [] }, trasllat: null });
  assert.deepEqual(governAlRellotge({ mcr: { at: '2026-10-28T00:00:00.000Z' } }, epoca).mcr.at, '2026-10-28T00:00:00.000Z', 'un temps anterior no es toca');
  // El productor de veres, amb un compilador fals que data `at` amb un mtime posterior a l'època.
  const compilador = async () => ({ recullGovern: (_arrel, { ara }) => ({ schema: 'sdp.govern.v1', generat: ara.toISOString(), mcr: { at: mtimeDelLlibre, requirements: [] }, trasllat: null }) });
  const vocabulari = async () => ({ estatDeStatus: () => null });
  const govern = await productorsDeLaInstantania({ arrel: PROJECT_DIR, ara: epoca, compilador, vocabulari }).govern();
  assert.equal(govern.mcr.at, govern.generat);
  assert.equal(caducitatDe(govern.mcr, { ara: Date.parse(govern.generat) }).motius.some((m) => m.clau === 'data-futura'), false);
  // I amb l'arbre real (el Llibre d'ara, posterior a l'època del commit d6ab025f4).
  const real = await productorsDeLaInstantania({ arrel: PROJECT_DIR, ara: epoca }).govern().catch((e) => ({ error: e }));
  if (!real.error) {
    assert.ok(Date.parse(real.mcr.at) <= epoca, real.mcr.at);
    assert.equal(caducitatDe(real.mcr, { head: real.head, ara: epoca }).motius.some((m) => m.clau === 'data-futura'), false);
  }
});
