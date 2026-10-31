import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import * as distSecrets from '../tooling/lib/dist-secrets.mjs';
import {
  findDistSecrets, findDeepLSecrets, findKnownSecretValues, findPrivateKeySecrets, secretsPrivatsDeLEntorn
} from '../tooling/lib/dist-secrets.mjs';
test('documentary role names are not credentials', () => {
  assert.deepEqual(findDistSecrets('Do not expose service_role keys in a browser.'), []);
});
for (const [name, value] of [
  ['secret key', 'sb_secret_' + 'syntheticfixtureonly'],
  ['publishable key', 'sb_publishable_' + 'syntheticfixtureonly'],
  ['JWT', 'eyJ' + 'a'.repeat(24) + '.' + 'b'.repeat(24) + '.fixture'],
  ['project URL', 'https://' + 'a'.repeat(20) + '.supabase.co']
]) test(`detects ${name} without leaking it in diagnostics`, () => {
  const findings = findDistSecrets(`service_role ${value} ${value}`);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 2);
  assert.ok(!JSON.stringify(findings).includes(value));
});


const uuidDeProva = ['00000000', '1111', '2222', '3333', '444444444444'].join('-');
test('DeepL Free i Pro: detecta credencials, no UUIDs de dades', () => {
  assert.deepEqual(findDeepLSecrets(uuidDeProva), []);
  for (const text of [`${uuidDeProva}:fx`, `DeepL-Auth-Key ${uuidDeProva}`, `DEEPL_API_KEY="${uuidDeProva}"`, `define('DEEPL_API_KEY', '${uuidDeProva}')`]) {
    const r = findDeepLSecrets(text);
    assert.equal(r.length, 1);
    assert.ok(!JSON.stringify(r).includes(uuidDeProva));
  }
});

/* Ordre nocturna 261030_0252 (Fase 3, WP) · La clau privada VAPID dels avisos
   push mai al dist. Les claus es generen ací, d'un sol ús, i no s'escriuen
   enlloc: cap diagnòstic les porta. */
const parellVapid = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwkPrivat = parellVapid.privateKey.export({ format: 'jwk' });
const jwkPublic = parellVapid.publicKey.export({ format: 'jwk' });
const pemPrivat = parellVapid.privateKey.export({ format: 'pem', type: 'pkcs8' });
const derPrivat = parellVapid.privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
const clauPublica87 = Buffer.concat([Buffer.from([4]), Buffer.from(jwkPublic.x, 'base64url'), Buffer.from(jwkPublic.y, 'base64url')]).toString('base64url');
const cosPem = pemPrivat.split('\n')[1];
/* Gauntlet c3 (vapid-detector-cec-al-build-real) · Les formes d'un build real:
   el JWK minificat (claus sense cometes), l'objecte d'entorn que Vite incrusta
   quan es llig import.meta.env sencer, i el DER en base64 sense capçalera. */
const sec1Privat = parellVapid.privateKey.export({ format: 'der', type: 'sec1' }).toString('base64');
const derSensePublica = Buffer.concat([Buffer.from('3041020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex'), Buffer.from(jwkPrivat.d, 'base64url')]).toString('base64');
const jwkMinificat = `{kty:"EC",crv:"P-256",x:"${jwkPrivat.x}",y:"${jwkPrivat.y}",d:"${jwkPrivat.d}"}`;
const entornDeVite = (extra = '') => `{BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1,VITE_PUSH_VAPID_PUBLICA:"${clauPublica87}",${extra}VITE_TENANT_ID:"la-torre"}`;
const TOTS_ELS_SECRETS = [jwkPrivat.d, derPrivat, cosPem, sec1Privat, derSensePublica];

test('VAPID: detecta la clau privada (nom amb valor, PEM, JWK, JSON escapat, JWK minificat, entorn de Vite, DER en base64) sense filtrar-la al diagnòstic', () => {
  assert.equal(jwkPrivat.d.length, 43);
  assert.equal(clauPublica87.length, 87);
  for (const text of [
    `SDP_PUSH_VAPID_PRIVADA=${jwkPrivat.d}`,
    `export SDP_PUSH_VAPID_PRIVADA="${derPrivat}"`,
    `VAPID_PRIVATE_KEY: "${jwkPrivat.d}"`,
    `{"publicKey":"${clauPublica87}","vapidPrivateKey":"${jwkPrivat.d}"}`,
    `define('SDP_PUSH_VAPID_PRIVADA', '${jwkPrivat.d}')`,
    pemPrivat,
    parellVapid.privateKey.export({ format: 'pem', type: 'sec1' }),
    `const k=${JSON.stringify(pemPrivat)};`,
    JSON.stringify(jwkPrivat),
    JSON.stringify({ d: jwkPrivat.d, crv: 'P-256', kty: 'EC', x: jwkPrivat.x, y: jwkPrivat.y }),
    `const k=${JSON.stringify(JSON.stringify(jwkPrivat))};`,
    jwkMinificat,
    `{d:"${jwkPrivat.d}",crv:"P-256",kty:"EC"}`,
    entornDeVite(`VITE_PUSH_VAPID_PRIVADA:"${jwkPrivat.d}",`),
    entornDeVite(`VITE_VAPID_PRIVADA:"${jwkPrivat.d}",`),
    entornDeVite(`VITE_PUSH_VAPID_PRIVATE_KEY:"${jwkPrivat.d}",`),
    entornDeVite(`VITE_WEBPUSH_SECRET:"${jwkPrivat.d}",`),
    `const k="${derPrivat}"`,
    `const k="${Buffer.from(derPrivat, 'base64').toString('base64url')}"`,
    `const k="${derSensePublica}"`,
    `const k="${sec1Privat}"`
  ]) {
    const r = findDistSecrets(`var a=1;${text};var b=2;`);
    assert.ok(r.length >= 1, text.slice(0, 40));
    for (const { label, count } of r) {
      assert.equal(count, 1, `${label} · ${text.slice(0, 40)}`);
      assert.match(label, /clau privada/);
    }
    assert.deepEqual(findPrivateKeySecrets(`var a=1;${text};var b=2;`), r, text.slice(0, 40));
    const diagnostic = JSON.stringify(r);
    for (const secret of TOTS_ELS_SECRETS) assert.ok(!diagnostic.includes(secret));
  }
});

test('VAPID: el JWK tal com el deixa el minificador de veres (esbuild, el de Vite) es detecta', async () => {
  const { code } = await transformWithEsbuild(`export const jwk = ${JSON.stringify(jwkPrivat)};`, 'jwk.js', { minify: true });
  assert.ok(!code.includes('"kty"'), 'el minificador lleva les cometes de les claus');
  assert.equal(findDistSecrets(code).length, 1);
  assert.match(findDistSecrets(code)[0].label, /clau privada EC \(JWK\)/);
});

test('VAPID: el nom sense valor, la clau pública, un PEM públic, una capçalera PEM sense cos o un JWK sense part privada no hi compten', () => {
  for (const text of [
    'SDP_PUSH_VAPID_PRIVADA (JWK o PKCS#8) viu només als secrets del servidor.',
    'const privada = Deno.env.get("SDP_PUSH_VAPID_PRIVADA"); SDP_PUSH_VAPID_PRIVADA: process.env.SDP_PUSH_VAPID_PRIVADA',
    `VITE_PUSH_VAPID_PUBLICA=${clauPublica87}`,
    `{"publicKey":"${clauPublica87}"}`,
    JSON.stringify(jwkPublic),
    parellVapid.publicKey.export({ format: 'pem', type: 'spki' }),
    'const CAPCALERA = "-----BEGIN PRIVATE KEY-----"; const PEU = "-----END PRIVATE KEY-----";',
    '{"d":"M0-0h24v24H0zM12-2l4-4l4-4l4-4l4-4l4-4lA"}',
    `{"kty":"RSA","d":"${jwkPrivat.d}"}`,
    entornDeVite('VITE_SUPABASE_ANON_KEY:"anon",VITE_SECRET_MODE:!0,'),
    `{kty:"EC",crv:"P-256",x:"${jwkPublic.x}",y:"${jwkPublic.y}"}`,
    `{id:"${jwkPrivat.d}",kty:"EC"}`,
    'Mai poses cap VITE_ALGO_SECRET ni VITE_PUSH_VAPID_PRIVADA al .env: Vite les publica.'
  ]) {
    assert.deepEqual(findDistSecrets(text), [], text.slice(0, 40));
  }
});

test('VAPID: cap patró no s\'encalla amb entrades llargues i enganyoses (ReDoS)', () => {
  const trampa = [
    '{"kty":"EC",'.repeat(20000),
    '{kty:"EC",'.repeat(20000),
    '"d":"'.repeat(50000),
    'd:"'.repeat(50000),
    `{"kty":"EC"${' '.repeat(399)}`.repeat(2000),
    'SDP_PUSH_VAPID_PRIVADA= '.repeat(20000),
    'VITE_A_PRIVADA '.repeat(20000),
    `VITE_${'A'.repeat(200000)}`,
    `${'_'.repeat(100000)}VAPID_PRIVAT`,
    '-----BEGIN PRIVATE KEY-----\n'.repeat(5000),
    'a'.repeat(200000)
  ].join(' ; ');
  const inici = performance.now();
  assert.deepEqual(findDistSecrets(trampa), []);
  assert.ok(performance.now() - inici < 2000, 'massa lent');
});

/* Gauntlet c3 (vapid-detector-cec-al-build-real) · El valor inlinat sol, sense
   nom (Vite substituïx import.meta.env.VITE_X pel valor), només es veu buscant
   el valor EXACTE que l'entorn coneix. */
test('valor exacte: les agulles de l\'entorn troben la privada inlinada sense nom, en qualsevol forma, sense filtrar-la', () => {
  const inlinat = `n.setVapidDetails("mailto:a@b",p,"${jwkPrivat.d}")`;
  assert.deepEqual(findDistSecrets(inlinat), [], 'cap patró no la pot veure sense nom');
  const agulles = secretsPrivatsDeLEntorn({ env: { VITE_PUSH_VAPID_PRIVADA: jwkPrivat.d, VITE_PUSH_VAPID_PUBLICA: clauPublica87, PATH: '/usr/bin' } });
  assert.ok(agulles.includes(jwkPrivat.d));
  assert.ok(!agulles.includes(clauPublica87));
  const r = findKnownSecretValues(inlinat, agulles);
  assert.deepEqual(r.map(({ count }) => count), [1]);
  assert.match(r[0].label, /clau privada/);
  for (const secret of TOTS_ELS_SECRETS) assert.ok(!JSON.stringify(r).includes(secret));
  for (const valor of [pemPrivat.replace(/\n/g, '\\n'), JSON.stringify(jwkPrivat), JSON.stringify(jwkPrivat, null, 2), derPrivat, sec1Privat, derSensePublica]) {
    const dEl = secretsPrivatsDeLEntorn({ env: { SDP_PUSH_VAPID_PRIVADA: valor } });
    assert.equal(findKnownSecretValues(`x("${jwkPrivat.d}")`, dEl)[0]?.count, 1, valor.slice(0, 20));
  }
  assert.deepEqual(secretsPrivatsDeLEntorn({ env: { VITE_ALGO_SECRET: 'curt', SDP_PUSH_VAPID_PRIVADA: '-----BEGIN PRIVATE KEY-----', VITE_TENANT_ID: jwkPrivat.d } }), []);
  assert.deepEqual(findKnownSecretValues(inlinat, []), []);
});

test('valor exacte: es lligen els .env* de l\'arrel, mai .env.example', () => {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-dist-secrets-'));
  try {
    const altra = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ format: 'jwk' }).d;
    writeFileSync(path.join(arrel, '.env.production.local'), `# prova\nVITE_TENANT_ID=la-torre\nVITE_PUSH_VAPID_PRIVADA="${jwkPrivat.d}"\n`);
    writeFileSync(path.join(arrel, '.env.example'), `VITE_PUSH_VAPID_PRIVADA=${altra}\n`);
    const agulles = secretsPrivatsDeLEntorn({ env: {}, arrel });
    assert.ok(agulles.includes(jwkPrivat.d));
    assert.ok(!agulles.includes(altra));
    assert.deepEqual(secretsPrivatsDeLEntorn({ env: {}, arrel: path.join(arrel, 'no-hi-és') }), []);
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
});

/* L9 del tractor del consell: dist, wordpress-plugin/dist i dist-natiu (APK i
   IPA) amb findDistSecretsWeb (Decisió del Mestre, 30-10-2026); tots tres amb
   el valor exacte de l'entorn. */
const TRACTOR = fileURLToPath(new URL('../tooling/scripts/tractor-consell-core.mjs', import.meta.url));

test('L9: una privada a dist-natiu o inlinada sense nom a dist fa caure la porta; la URL de Supabase del natiu no', () => {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-l9-'));
  try {
    mkdirSync(path.join(arrel, 'dist-natiu', 'assets'), { recursive: true });
    mkdirSync(path.join(arrel, 'dist', 'assets'), { recursive: true });
    writeFileSync(path.join(arrel, 'dist-natiu', 'assets', 'index-natiu.js'), `const u="https://${'a'.repeat(20)}.supabase.co";const k=${jwkMinificat};`);
    writeFileSync(path.join(arrel, 'dist', 'assets', 'index-web.js'), `n.setVapidDetails("mailto:a@b",p,"${jwkPrivat.d}");`);
    writeFileSync(path.join(arrel, '.env.production.local'), `VITE_PUSH_VAPID_PRIVADA=${jwkPrivat.d}\n`);
    const r = spawnSync(process.execPath, [TRACTOR, '--root', arrel], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    const eixida = `${r.stdout}${r.stderr}`;
    assert.equal(r.status, 1, eixida);
    assert.match(eixida, /L9 · Cap secret al dist {2}\(3\)/);
    assert.match(eixida, /dist-natiu\/assets\/index-natiu\.js\n\s+↳ clau privada EC \(JWK\)/);
    assert.match(eixida, /dist\/assets\/index-web\.js\n\s+↳ clau privada o secret de l'entorn \(valor exacte\)/);
    assert.doesNotMatch(eixida, /URL del projecte Supabase/);
    for (const secret of TOTS_ELS_SECRETS) assert.ok(!eixida.includes(secret));
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
});

/* La via de fuita més probable: llegir import.meta.env SENCER (com a valor:
   `env = import.meta.env || {}`, `import.meta.env && …`, `import.meta.env[k]`)
   fa que Vite incruste al bundle TOTES les VITE_* de l'entorn, noms i valors.
   Només es permet llegir una clau (`.CLAU`, `?.CLAU`) o el ternari
   `import.meta.env ? import.meta.env.CLAU : …`, que el minificador plega
   (comprovat amb un build de Vite 7). Es lleven els comentaris amb esbuild. */
function produccioDeSrc(directori = 'src') {
  const fitxers = [];
  for (const entrada of readdirSync(directori, { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...produccioDeSrc(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name) && !ruta.includes('/__fixtures__/')) fitxers.push(ruta);
  }
  return fitxers;
}

test('cap fitxer de producció de src/ llig import.meta.env sencer: Vite incrustaria totes les VITE_* (també una privada mal anomenada)', async () => {
  const LECTURA_PERMESA = /^\s*(?:\??\.[A-Za-z_$]|\?\s*import\.meta\.env\.[A-Za-z_$])/;
  const fitxers = produccioDeSrc();
  assert.ok(fitxers.length > 200);
  const sencers = [];
  for (const ruta of fitxers) {
    const text = readFileSync(ruta, 'utf8');
    if (!text.includes('import.meta.env')) continue;
    const { code } = await transformWithEsbuild(text, ruta, { loader: 'jsx', jsx: 'preserve' });
    for (const m of code.matchAll(/import\.meta\.env\b/g)) {
      if (!LECTURA_PERMESA.test(code.slice(m.index + m[0].length, m.index + m[0].length + 60))) sencers.push(ruta);
    }
  }
  assert.deepEqual([...new Set(sencers)], []);
  for (const [codi, permes] of [
    ['f(import.meta.env.VITE_X)', true], ['f(import.meta.env?.VITE_X)', true],
    ['const x = import.meta.env ? import.meta.env.VITE_X : undefined;', true],
    ['function f(env = import.meta.env || {}) {}', false], ['f(import.meta.env && import.meta.env.VITE_X)', false],
    ['f(import.meta.env[k])', false], ['f({ ...import.meta.env })', false], ['f(import.meta.env)', false]
  ]) {
    const despres = codi.slice(codi.indexOf('import.meta.env') + 'import.meta.env'.length);
    assert.equal(LECTURA_PERMESA.test(despres), permes, codi);
  }
});

/* Decisió del Mestre (30-10-2026, «Sí, accepta l'anon») · L9 al web (dist/) i al connector
   (wordpress-plugin/dist/): la URL del projecte i el JWT anon passen; un JWT service_role, un
   d'il·legible, sb_secret_ i sb_publishable_ cauen, sense cap valor al diagnòstic. findDistSecrets
   conserva la política estricta (les proves de dalt). Ordre del Mestre (30-10-2026, prompt 2208) ·
   L6 amb el criteri de src/config/i18n.usades.test.js. */
const b64url = (objecte) => Buffer.from(JSON.stringify(objecte)).toString('base64url');
const jwtDeProva = (role) => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${b64url({ iss: 'supabase', ref: 'fixturefixturefixture', role })}.sintetica`;
const urlDeProva = `https://${'a'.repeat(20)}.supabase.co`;
const jwtIllegible = `eyJ${'a'.repeat(24)}.${'b'.repeat(24)}.c`;
const secretDeProva = `sb_secret_${'z'.repeat(20)}`;
const publicableDeProva = `sb_publishable_${'p'.repeat(20)}`;

test('findDistSecretsWeb: la URL i el JWT anon passen; service_role, un altre rol, il·legible, sb_secret_ i sb_publishable_ cauen sense valor', () => {
  const { findDistSecretsWeb, rolDelJwt } = distSecrets;
  assert.equal(typeof findDistSecretsWeb, 'function', 'findDistSecretsWeb exportada');
  assert.equal(rolDelJwt(jwtDeProva('anon').split('.')[1]), 'anon');
  assert.equal(rolDelJwt('no-es-base64-ni-json'), null);
  assert.deepEqual(findDistSecretsWeb(`const u="${urlDeProva}",k="${jwtDeProva('anon')}";`), []);
  assert.deepEqual(findDistSecretsWeb(`{"node":{"origen":"${urlDeProva}"}}`), []);
  for (const valor of [jwtDeProva('service_role'), jwtDeProva('authenticated'), jwtIllegible, secretDeProva, publicableDeProva]) {
    const r = findDistSecretsWeb(`const a=1;const k="${valor}";const u="${urlDeProva}";`);
    assert.deepEqual(r.map(({ count }) => count), [1], valor.slice(0, 18));
    assert.ok(!JSON.stringify(r).includes(valor));
  }
  const vapid = findDistSecretsWeb(jwkMinificat);
  assert.equal(vapid.length, 1);
  assert.match(vapid[0].label, /clau privada EC \(JWK\)/);
  assert.ok(!JSON.stringify(vapid).includes(jwkPrivat.d));
});

const arrelDelConsell = (fitxers) => {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-consell-'));
  for (const [rel, text] of Object.entries(fitxers)) {
    mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
    writeFileSync(path.join(arrel, rel), text);
  }
  return arrel;
};
const correConsell = (arrel) => {
  try {
    const r = spawnSync(process.execPath, [TRACTOR, '--root', arrel], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    return `${r.stdout}${r.stderr}`;
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
};
const I18N_DE_PROVA = { 'src/config/i18n.js': "export const L=[{ code: 'ca' }];\n", 'src/config/idiomes/ca.js': "export default {\n  'section.a': 'A',\n};\n" };

test('L6: els t() locals i els dobles de les proves no són claus; una clau d’un espai de noms del valencià absent sí', () => {
  const net = correConsell(arrelDelConsell({
    ...I18N_DE_PROVA,
    'src/a.js': "const t = (x) => x; t('.'); t('ingesta.beguda');\n",
    'src/a.test.js': "t('fals'); t('section.nomesEnLaProva');\n",
    'src/b.js': "t('section.a');\n"
  }));
  assert.match(net, /✅ L6 · i18n tancat/);
  const absent = correConsell(arrelDelConsell({ ...I18N_DE_PROVA, 'src/b.js': "t('section.inexistent');\n" }));
  assert.match(absent, /L6 · i18n tancat {2}\(1\)/);
  assert.match(absent, /section\.inexistent/);
});

test('L9: la URL i el JWT anon al web i al connector no fan caure la porta; service_role, un JWT il·legible i sb_secret_ sí, sense cap valor', () => {
  const passa = correConsell(arrelDelConsell({
    ...I18N_DE_PROVA,
    'dist/assets/i.js': `const u="${urlDeProva}",k="${jwtDeProva('anon')}";`,
    'wordpress-plugin/dist/trossos/c.js': `const u="${urlDeProva}",k="${jwtDeProva('anon')}";`,
    'wordpress-plugin/dist/sdp-release.json': `{"node":{"origen":"${urlDeProva}"}}`
  }));
  assert.match(passa, /✅ L9 · Cap secret al dist/);
  const privat = jwtDeProva('service_role');
  const cau = correConsell(arrelDelConsell({
    ...I18N_DE_PROVA,
    'dist/assets/i.js': `const k="${privat}";`,
    'wordpress-plugin/dist/trossos/x.js': `const k="${jwtIllegible}";`,
    'dist/assets/s.js': `const s="${secretDeProva}";`
  }));
  assert.match(cau, /L9 · Cap secret al dist {2}\(3\)/);
  for (const valor of [privat, jwtIllegible, secretDeProva]) assert.ok(!cau.includes(valor));
});

/* Gauntlet f6 (consell-l9-dist-natiu-sense-service-role) · la decisió diu «qualsevol service_role,
   sb_secret_»: també al natiu, el que va a les botigues, sense dependre del .env de la màquina. */
test('L9: un JWT service_role o un sb_secret_ a dist-natiu fan caure la porta; la URL i el JWT anon del natiu no', () => {
  const passa = correConsell(arrelDelConsell({
    ...I18N_DE_PROVA,
    'dist-natiu/assets/i.js': `const u="${urlDeProva}",k="${jwtDeProva('anon')}";`
  }));
  assert.match(passa, /✅ L9 · Cap secret al dist/);
  const privat = jwtDeProva('service_role');
  const cau = correConsell(arrelDelConsell({
    ...I18N_DE_PROVA,
    'dist-natiu/assets/i.js': `const u="${urlDeProva}",a="${jwtDeProva('anon')}",k="${privat}";`,
    'dist-natiu/assets/s.js': `const s="${secretDeProva}";`
  }));
  assert.match(cau, /L9 · Cap secret al dist {2}\(2\)/);
  assert.match(cau, /dist-natiu\/assets\/i\.js\n\s+↳ JWT no anon/);
  assert.match(cau, /dist-natiu\/assets\/s\.js\n\s+↳ clau Supabase secreta \(sb_secret_\)/);
  for (const valor of [privat, secretDeProva]) assert.ok(!cau.includes(valor));
});
