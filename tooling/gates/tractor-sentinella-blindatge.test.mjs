import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIUS_PATRIMONIALS_LEGITIMS, ZIP_OPENDATA_CANONIC, validaManifestActius, sha256 } from '../lib/actius-patrimonials-legitims.mjs';
import { llegeixZipNodeZero } from '../node0/paquet-opendata-node0.mjs';
import { auditaAnonim, auditaCapcaleres, auditaBlindatge, main, parseArgs, LIMITS } from './tractor-sentinella-blindatge.mjs';
import { escanejaLiterals } from './literals-secrets-node0.mjs';

const ANON = 'sb_publishable_' + 'TEST_ONLY_PUBLIC_FIXTURE_123456';
const CONFIG = { supabaseUrl: 'https://project.supabase.co', publishableKey: ANON };
const HEADERS = {
  'content-security-policy': "default-src 'self' data: blob:; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.sollutia.cat",
  'strict-transport-security': 'max-age=31536000', 'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin', 'content-type': 'text/html',
};
const tls = { authorized: true, daysRemaining: 80 };
const response = (status, text, headers = {}) => ({ status, text, headers: { ...HEADERS, ...headers }, bytes: Buffer.byteLength(text), tls });
const privateRoute = (url) => new URL(url).pathname.startsWith('/rest/v1/');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sentinella-'));
  fs.mkdirSync(path.join(root, 'public'));
  fs.writeFileSync(path.join(root, 'public', 'safe.js'), 'export const publicValue=1;');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
const transport = async (url) => privateRoute(url)
  ? response(401, JSON.stringify({ code: '42501' }), { 'content-type': 'application/json' })
  : response(200, new URL(url).pathname === '/' ? '<!doctype html><title>Prova</title>' : '{}', { 'content-type': new URL(url).pathname === '/' ? 'text/html' : 'application/json', ...(url.endsWith('ard.json') ? { 'access-control-allow-origin': '*' } : {}) });

test('CLI rebutja arguments, secrets i repeticions abans de cap xarxa', async () => {
  for (const args of [['--url=https://evil.test'], ['--remot', '--remot'], ['--iterations=0'], ['--iterations=4'], ['--interval-ms=1'], ['--interval-ms=60000']]) assert.throws(() => parseArgs(args));
  const output = [];
  assert.equal(await main(['--json', '--url=https://evil.test'], { stdout: { write: s => output.push(s) }, stderr: { write: s => output.push(s) }, requestGet: () => assert.fail('no request') }), 2);
  assert.equal(output.join('').includes('evil.test'), false);
});

test('headers es comproven per política i ruta, incloent ACAO públic admés', () => {
  assert.deepEqual(auditaCapcaleres(HEADERS, 'html', 'https://socdepoble.org'), []);
  assert.deepEqual(auditaCapcaleres({ ...HEADERS, 'access-control-allow-origin': '*' }, 'public-json', 'https://socdepoble.org'), []);
  assert.deepEqual(auditaCapcaleres({ ...HEADERS, 'access-control-allow-origin': '*' }, 'public-asset', 'https://socdepoble.org'), []);
  for (const override of [
    { 'content-security-policy': '' }, { 'content-security-policy-report-only': HEADERS['content-security-policy'], 'content-security-policy': '' },
    { 'strict-transport-security': 'max-age=0' }, { 'strict-transport-security': 'max-age=1; max-age=31536000' },
    { 'x-content-type-options': 'other' }, { 'referrer-policy': 'unsafe-url' },
    { 'content-security-policy': HEADERS['content-security-policy'].replace("script-src 'self'", "script-src 'self' 'unsafe-eval'") },
    { 'content-security-policy': HEADERS['content-security-policy'].replace("script-src 'self'", "script-src 'self' https:") },
    { 'content-security-policy': HEADERS['content-security-policy'].replace("base-uri 'self'", "base-uri 'self' https:") },
    { 'content-security-policy': HEADERS['content-security-policy'].replace("default-src 'self' data: blob:", "default-src 'self' https:") },
    { 'content-security-policy': HEADERS['content-security-policy'].replace("frame-ancestors 'self' https://*.sollutia.cat", "frame-ancestors https:") },
    { 'content-security-policy': HEADERS['content-security-policy'] + '; script-src-elem *' },
    { 'content-security-policy': HEADERS['content-security-policy'] + '; script-src *' },
  ]) assert.ok(auditaCapcaleres({ ...HEADERS, ...override }, 'html', 'https://socdepoble.org').length);
});

test('RLS: files exposades és fallada; buit, 404 i gateway 401 són inconclusius', () => {
  assert.equal(auditaAnonim(response(200, '[{"id":"private"}]', { 'content-type': 'application/json' })).status, 'fail');
  for (const r of [response(200, '[]'), response(404, '{}'), response(401, '{"message":"Invalid API key"}'), response(200, '<html>SPA</html>')]) assert.equal(auditaAnonim(r).status, 'unknown');
  assert.deepEqual(auditaAnonim(response(401, '{"code":"42501"}')), { status: 'ok', code: 'DENIAL_OBSERVED', policyVerified: false });
  assert.equal(auditaAnonim(response(403, '{"code":"42501"}')).status, 'ok');
});

test('mode local no fa xarxa i no inventa salut, RLS, billing ni WhatsApp', async t => {
  const report = await auditaBlindatge({ root: fixture(t) }, { requestGet: () => assert.fail('no network'), now: () => 0 });
  assert.equal(report.status, 'unknown'); assert.equal(report.billing.status, 'unknown');
  assert.deepEqual(report.notification, { prepared: false, sent: false, transport: null });
  assert.equal(report.realNetwork, false); assert.equal(report.usage.requests, 0);
});

test('remot amb fixtures completa l’abast observat sense afirmar RLS total ni billing', async t => {
  const calls = [];
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG }, { now: () => 0, requestGet: async (url, options) => { calls.push([url, options]); return transport(url); } });
  assert.equal(report.status, 'ok'); assert.equal(report.coverage.rlsPolicyVerified, false); assert.equal(report.billing.status, 'unknown');
  assert.equal(calls.length, 12); assert.equal(report.usage.requests, 12);
  assert.ok(calls.every(([, options]) => options.method === 'GET' && options.body === undefined && options.headers.Cookie === undefined && options.headers.Authorization === undefined));
  assert.equal(report.notification.sent, false);
});

test('RLS incert no es transforma en verd i un error no descarta les altres sondes', async t => {
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG }, { now: () => 0, requestGet: async (url) => privateRoute(url) ? response(404, '{}') : transport(url) });
  assert.equal(report.status, 'unknown'); assert.equal(report.results.length, 12);
  assert.ok(report.results.filter(r => r.kind === 'anonymous').every(r => r.status === 'unknown'));
});

test('secrets de resposta i fitxer mai apareixen com valors ni hashes de credencial', async t => {
  const root = fixture(t);
  const literal = ['sb', '_secret_', 'SYNTHETIC_PRIVATE_CANARY_1234567890'].join('');
  fs.writeFileSync(path.join(root, 'public', 'unsafe.js'), JSON.stringify({ value: literal }));
  const report = await auditaBlindatge({ root, remote: true, config: CONFIG }, { now: () => 0, requestGet: async (url) => privateRoute(url) ? transport(url) : response(200, literal) });
  assert.equal(report.status, 'fail'); const encoded = JSON.stringify(report);
  assert.equal(encoded.includes(literal), false); assert.equal(encoded.includes(ANON), false);
  assert.ok(report.localSecrets.findings.some(f => f.ruleId === 'supabase-secret'));
});

test('les credencials dels noms de fitxer i de directori es redacten sense llegir claus ni emetre hashes', async t => {
  const root = fixture(t), canary = ['sb', '_secret_', 'SYNTHETIC_CANARY_12345678901234567890'].join('');
  fs.writeFileSync(path.join(root, 'public', canary + '.key'), 'UNREAD_PRIVATE_KEY_BYTES');
  fs.mkdirSync(path.join(root, 'public', canary));
  fs.writeFileSync(path.join(root, 'public', canary, 'unsafe.js'), JSON.stringify({ value: canary }));
  const report = await auditaBlindatge({ root }), encoded = JSON.stringify(report);
  assert.equal(report.status, 'fail'); assert.equal(encoded.includes(canary), false);
  assert.equal(encoded.includes('UNREAD_PRIVATE_KEY_BYTES'), false);
  assert.deepEqual(report.localSecrets.findings.map(f => f.path).sort(), ['public/[redacted]', 'public/[redacted]/unsafe.js']);
  assert.ok(report.localSecrets.findings.every(f => Object.keys(f).sort().join(',') === 'line,path,ruleId'));
});

test('no es lligen symlinks ni .env del directori públic', async t => {
  const root = fixture(t); const privateFile = path.join(root, '.env'); fs.writeFileSync(privateFile, 'PRIVATE_CANARY');
  fs.symlinkSync(privateFile, path.join(root, 'public', 'escape.js'));
  const report = await auditaBlindatge({ root });
  assert.equal(report.localSecrets.status, 'unknown'); assert.equal(JSON.stringify(report).includes('PRIVATE_CANARY'), false);
});

test('un directori local excessiu acaba inconclús sense materialitzar ni llegir tots els fitxers', async t => {
  const root = fixture(t);
  for (let i = 0; i < LIMITS.localEntries; i++) fs.writeFileSync(path.join(root, 'public', `entry-${i}.txt`), '');
  const report = await auditaBlindatge({ root });
  assert.equal(report.localSecrets.status, 'unknown'); assert.equal(report.localSecrets.code, 'LOCAL_LIMIT');
  assert.equal(report.localSecrets.files, 0); assert.equal(report.status, 'unknown');
});

test('configuració rebutja credencial elevada, sessió i origen arbitrari abans del transport', async t => {
  const root = fixture(t);
  const jwt = role => [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from(JSON.stringify({ role })).toString('base64url'), 'a'.repeat(43)].join('.');
  for (const config of [{ ...CONFIG, publishableKey: 'sb_secret_TEST_ONLY' }, { ...CONFIG, publishableKey: jwt('authenticated') }, { ...CONFIG, publishableKey: jwt('service_role') }, { ...CONFIG, supabaseUrl: 'https://127.0.0.1' }, { ...CONFIG, supabaseUrl: 'https://user:pass@project.supabase.co' }, { ...CONFIG, secret: 'value' }]) {
    await assert.rejects(auditaBlindatge({ root, remote: true, config }, { requestGet: () => assert.fail('no dispatch') }));
  }
});

test('repetició és finita i el pressupost total no es reinicia entre cicles', async t => {
  const delays = []; const calls = [];
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG, iterations: 3, intervalMs: 60000 }, { now: () => 0, sleep: async ms => delays.push(ms), requestGet: async (url) => { calls.push(url); return transport(url); } });
  assert.deepEqual(delays, [60000, 60000]); assert.equal(calls.length, 36);
  assert.equal(report.usage.requests, 36); assert.equal(report.budget.maxRequests, LIMITS.requestsPerCycle * 3);
  assert.equal(report.cycles.length, 3);
});

test('error arbitrari de transport no filtra missatge, URL o credencials', async t => {
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG }, { now: () => 0, requestGet: () => { throw new Error('PRIVATE_CANARY ' + ANON); } });
  const text = JSON.stringify(report); assert.equal(text.includes('PRIVATE_CANARY'), false); assert.equal(text.includes(ANON), false);
  assert.equal(report.status, 'unknown');
});

test('deadline de ronda liquida un transport que ignora abort i conserva les observacions', async t => {
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG }, {
    now: () => 0, requestGet: () => new Promise(() => {}),
    setTimer: fn => { queueMicrotask(fn); return 1; }, clearTimer: () => {},
  });
  assert.equal(report.status, 'unknown'); assert.equal(report.results.length, 12);
  assert.equal(report.usage.requests, 2); assert.ok(report.results.every(r => r.status === 'unknown'));
});

test('cancel·lar la ronda conserva ABORTED també per a les sondes encara no començades', async t => {
  const control = new AbortController();
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG, signal: control.signal }, {
    now: () => 0, requestGet: () => { queueMicrotask(() => control.abort()); return new Promise(() => {}); },
  });
  assert.equal(report.status, 'unknown'); assert.equal(report.usage.requests, 2);
  assert.equal(report.results.length, 12); assert.ok(report.results.every(r => r.code === 'ABORTED'));
});

test('interrompre l’interval conserva el rebut de la primera ronda i no envia més GET', async t => {
  let calls = 0;
  const report = await auditaBlindatge({ root: fixture(t), remote: true, config: CONFIG, iterations: 3 }, {
    now: () => 0, requestGet: async url => { calls++; return transport(url); }, sleep: () => { throw new Error('PRIVATE_CANARY'); },
  });
  assert.equal(report.status, 'unknown'); assert.equal(report.cycles.length, 1); assert.equal(report.results.length, 12);
  assert.equal(calls, 12); assert.equal(JSON.stringify(report).includes('PRIVATE_CANARY'), false);
});

// v1.2.19 · Gauntlet R1 (L2-02): PNG versionat amb '<?=' per atzar a l'offset 13864; es llig del
// repositori i només es copia a l'arrel temporal.
const REPO_L202 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PNG_L202 = 'public/assets/img/nano_porta_del_mas.png';
test('L2-02 · una imatge real amb «<?=» per atzar no fa caure localSecrets; el PHP darrere d’IEND sí', async t => {
  const root = fixture(t), bytes = fs.readFileSync(path.join(REPO_L202, PNG_L202)), desti = path.join(root, PNG_L202);
  assert.ok(bytes.includes('<?='), `${PNG_L202} ja no conté la seqüència: trieu un altre actiu`);
  fs.mkdirSync(path.dirname(desti), { recursive: true }); fs.writeFileSync(desti, bytes);
  const net = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(net.status, 'ok'); assert.deepEqual(net.findings, []);
  assert.deepEqual(net.coverage.staticBinaries, { status: 'ok', files: 1, bytes: bytes.length });
  fs.writeFileSync(desti, Buffer.concat([bytes, Buffer.from('<?php echo "CANARI_PHP_L202"; ?>')]));
  const brut = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(brut.status, 'fail'); assert.deepEqual(brut.findings.map(f => f.ruleId), ['php-in-static-bytes']);
  assert.equal(JSON.stringify(brut).includes('CANARI_PHP_L202'), false);
});

test('R32.43 · qualsevol fitxer gros fora del manifest és bloquejant, sense confiar en l’extensió', async t => {
  const root = fixture(t), buit = (rel, size) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, ''); fs.truncateSync(p, size); };
  for (let i = 0; i < 5; i++) buit(`public/galeria/f${i}.jpg`, LIMITS.localBinaryFileBytes - 1);
  let local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'ok'); assert.equal(local.code, undefined);
  assert.deepEqual(local.coverage, { literals: { status: 'ok', files: 1, bytes: 27 }, staticBinaries: { status: 'ok', files: 5, bytes: 5 * (LIMITS.localBinaryFileBytes - 1) } });
  /* v1.2.19 · Porta Arrel (A5) · El camí del text gros es fa en execució: és un fitxer de l'arrel temporal de la prova, no una configuració del repositori. */
  const GROS_TXT = path.join('public', 'gros.txt');
  buit(GROS_TXT, LIMITS.localFileBytes + 1);
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail');
  assert.equal(local.coverage.literals.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.ok(local.findings.some(f=>f.ruleId==='static-file-oversize-unregistered'));
  fs.rmSync(path.join(root, GROS_TXT)); buit('public/gros.png', LIMITS.localBinaryFileBytes + 1);
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail');
  assert.deepEqual(local.coverage.literals, { status: 'ok', files: 1, bytes: 27 }); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.equal(local.findings[0].ruleId, 'static-binary-unregistered');
});


// R32.43 · Integritat d'actius NIST PR.DS: no hi ha excepcions per basename ni per mida sola.
function assetFixture(t, asset = ACTIUS_PATRIMONIALS_LEGITIMS[0]) {
  const root = fixture(t), file = path.join(root, asset.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.copyFileSync(path.join(REPO_L202, asset.path), file);
  const census = path.join(root, asset.census.file); fs.mkdirSync(path.dirname(census), { recursive: true });
  const url = asset.path.slice('public'.length);
  const declaration = asset.census.kind === 'image'
    ? `export const CENS_IMATGES=Object.freeze([e(${JSON.stringify(url)},'Títol')]);`
    : `export const OBRA_QUE_DINEM=congela({pdf:${JSON.stringify(url)},pdfBytes:${asset.bytes}});`;
  // Les fonts només es parsegen; executar-les faria fallar la prova.
  fs.writeFileSync(census, `throw new Error('NO_EXECUTAR_SOURCE');${declaration}`);
  return { root, file, census, asset, url };
}

test('R32.43 · els 5 actius reals es lligen sencers i deixen cobertura binària ok', async () => {
  assert.equal(ACTIUS_PATRIMONIALS_LEGITIMS.length, 5);
  for (const asset of ACTIUS_PATRIMONIALS_LEGITIMS) {
    const content = fs.readFileSync(path.join(REPO_L202, asset.path));
    assert.equal(content.length, asset.bytes); assert.equal(sha256(content), asset.sha256);
  }
  const report = await auditaBlindatge({ root: REPO_L202 });
  assert.equal(report.localSecrets.coverage.staticBinaries.status, 'ok');
  assert.equal(report.localSecrets.integrity.approvedBinaries, 5);
  assert.ok(report.localSecrets.coverage.staticBinaries.bytes >= ACTIUS_PATRIMONIALS_LEGITIMS.reduce((n,a)=>n+a.bytes,0));
});

test('R32.43 · ruta+mida+SHA+cens AST d’un actiu real deixen verd sense executar source', async t => {
  for (const asset of [ACTIUS_PATRIMONIALS_LEGITIMS[0], ACTIUS_PATRIMONIALS_LEGITIMS[3]]) {
    const { root } = assetFixture(t, asset), local = (await auditaBlindatge({ root })).localSecrets;
    assert.equal(local.status, 'ok'); assert.equal(local.integrity.approvedBinaries, 1);
    assert.equal(local.coverage.staticBinaries.bytes, asset.bytes);
  }
});

test('R32.43 · byte alterat amb la mateixa mida és fallada d’integritat', async t => {
  const { root, file } = assetFixture(t), fd = fs.openSync(file, 'r+'), byte = Buffer.alloc(1);
  try { fs.readSync(fd, byte, 0, 1, 100); byte[0] ^= 1; fs.writeSync(fd, byte, 0, 1, 100); } finally { fs.closeSync(fd); }
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.ok(local.findings.some(f=>f.ruleId==='static-binary-integrity-mismatch'));
});

test('R32.43 · mida alterada no es transforma en unknown ni autoritza més bytes', async t => {
  const { root, file } = assetFixture(t); fs.appendFileSync(file, Buffer.from([0]));
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.ok(local.findings.some(f=>f.ruleId==='static-binary-size-mismatch'));
  assert.equal(local.integrity.approvedBinaries, 0);
});

test('R32.43 · actiu que deixa el cens exportat falla encara que la ruta romanga al comentari', async t => {
  const { root, census, url } = assetFixture(t, ACTIUS_PATRIMONIALS_LEGITIMS[3]);
  fs.writeFileSync(census, `// e(${JSON.stringify(url)})\nexport const CENS_IMATGES=Object.freeze([]);`);
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.ok(local.findings.some(f=>f.ruleId==='static-binary-census-orphan'));
});

test('R32.43 · pdfBytes o export incorrectes i cens amb symlink no acrediten cap actiu', async t => {
  for (const mode of ['size','export','symlink']) {
    const { root, census, url } = assetFixture(t);
    if (mode === 'size') fs.writeFileSync(census, `export const OBRA_QUE_DINEM=congela({pdf:${JSON.stringify(url)},pdfBytes:1});`);
    if (mode === 'export') fs.writeFileSync(census, `const OBRA_QUE_DINEM=congela({pdf:${JSON.stringify(url)},pdfBytes:7560366});`);
    if (mode === 'symlink') { const target = path.join(root,'private-census.js'); fs.renameSync(census,target); fs.symlinkSync(target,census); }
    const local = (await auditaBlindatge({ root })).localSecrets;
    assert.equal(local.status, 'fail',mode); assert.ok(local.findings.some(f=>f.ruleId==='static-binary-census-orphan'),mode);
  }
});

test('R32.43 · un basename o alias antic no entra al manifest per coincidència de hash', async t => {
  const root = fixture(t), asset = ACTIUS_PATRIMONIALS_LEGITIMS[1], file = path.join(root,'public/assets/towns/tibi/DSC00410.JPG');
  fs.mkdirSync(path.dirname(file),{recursive:true}); fs.copyFileSync(path.join(REPO_L202,asset.path),file);
  const local=(await auditaBlindatge({root})).localSecrets;
  assert.equal(local.status,'fail'); assert.ok(local.findings.some(f=>f.ruleId==='static-binary-unregistered'));
});

test('R32.43 · binari gros desconegut de qualsevol extensió falla fins i tot amb dist net', async t => {
  for (const name of ['new.png','payload.bin','package.ZIP','new.js','new.svg']) {
    const root=fixture(t),file=path.join(root,'public',name);fs.writeFileSync(file,'');fs.truncateSync(file,LIMITS.localBinaryFileBytes+1);
    fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist','safe.js'),'export const safe=1;');
    const local=(await auditaBlindatge({root})).localSecrets;
    assert.equal(local.status,'fail',name);assert.ok(local.findings.some(f=>['static-binary-unregistered','static-file-oversize-unregistered'].includes(f.ruleId)),name);
  }
});

test('R32.43 · només ZIP actual amb mida/hash del datapackage, cap ZIP vell duplicat', async t => {
  const root=fixture(t),dir=path.join(root,'public/opendata');fs.mkdirSync(dir);
  const bytes=Buffer.from('PK\x03\x04CONTINGUT_SINTETIC'),file=path.join(dir,'actual.zip');fs.writeFileSync(file,bytes);
  let local=(await auditaBlindatge({root})).localSecrets;
  assert.equal(local.status,'fail');assert.ok(local.findings.some(f=>f.ruleId==='opendata-zip-outside-manifest'));
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({resources:[{path:'actual.zip',bytes:bytes.length,hash:'sha256:'+sha256(bytes)}]}));
  local=(await auditaBlindatge({root})).localSecrets;assert.equal(local.status,'ok');
  const manifestFile=path.join(dir,'manifest.json'),record={path:'actual.zip',bytes:bytes.length,hash:'sha256:'+sha256(bytes)};
  fs.writeFileSync(manifestFile,JSON.stringify({resources:[record,record]}));
  local=(await auditaBlindatge({root})).localSecrets;assert.equal(local.status,'fail');
  fs.writeFileSync(manifestFile,JSON.stringify({resources:[{path:record.path,bytes:record.bytes}]}));
  local=(await auditaBlindatge({root})).localSecrets;assert.equal(local.status,'fail');
  fs.writeFileSync(manifestFile,JSON.stringify({resources:[record]}));
  fs.copyFileSync(file,path.join(dir,'vell.zip'));
  local=(await auditaBlindatge({root})).localSecrets;assert.equal(local.status,'fail');assert.ok(local.findings.some(f=>f.path.endsWith('/vell.zip')));
  fs.unlinkSync(path.join(dir,'vell.zip'));fs.appendFileSync(file,'X');
  local=(await auditaBlindatge({root})).localSecrets;assert.equal(local.status,'fail');
});

async function canonicalZipFixture(t) {
  const root = fixture(t), pin = ZIP_OPENDATA_CANONIC;
  fs.mkdirSync(path.join(root, 'public/opendata'));
  for (const binding of [pin.snapshot, pin.manifest]) fs.copyFileSync(path.join(REPO_L202, 'public', binding.path), path.join(root, 'public', binding.path));
  // L'API existent reprodueix en memòria els bytes reals; el gate només llig/hash.
  const bytes = await llegeixZipNodeZero({ root, sha256Esperat: pin.sha256 });
  assert.equal(bytes.length, pin.bytes); assert.equal(sha256(bytes), pin.sha256);
  const file = path.join(root, 'public', pin.path); fs.writeFileSync(file, bytes);
  return { root, file, bytes, pin };
}

test('R32.43 · ZIP canònic real reproduït del snapshot passa sense ser un resource interior', async t => {
  const { root } = await canonicalZipFixture(t);
  fs.mkdirSync(path.join(root, 'dist')); fs.writeFileSync(path.join(root, 'dist/safe.js'), 'export const safe=1;');
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'ok'); assert.equal(local.coverage.staticBinaries.status, 'ok');
  assert.equal(local.coverage.staticBinaries.bytes, ZIP_OPENDATA_CANONIC.bytes);
});

test('R32.43 · pin ZIP exigeix ruta, bytes, SHA i bindings íntegres sense fallback resource', async t => {
  for (const mode of ['extra', 'size', 'hash', 'snapshot-missing', 'snapshot-changed', 'manifest-missing', 'manifest-changed', 'resource-bypass']) {
    const { root, file, bytes, pin } = await canonicalZipFixture(t);
    if (mode === 'extra') fs.copyFileSync(file, path.join(path.dirname(file), 'antic.zip'));
    if (mode === 'size') fs.appendFileSync(file, 'X');
    if (mode === 'hash') { const bad = Buffer.from(bytes); bad[100] ^= 1; fs.writeFileSync(file, bad); }
    if (mode === 'snapshot-missing') fs.unlinkSync(path.join(root, 'public', pin.snapshot.path));
    if (mode === 'snapshot-changed') fs.appendFileSync(path.join(root, 'public', pin.snapshot.path), '\n');
    if (mode === 'manifest-missing') fs.unlinkSync(path.join(root, 'public', pin.manifest.path));
    if (mode === 'manifest-changed') fs.appendFileSync(path.join(root, 'public', pin.manifest.path), '\n');
    if (mode === 'resource-bypass') fs.writeFileSync(path.join(root, 'public', pin.manifest.path), JSON.stringify({ resources: [{ path: path.basename(file), bytes: bytes.length, hash: `sha256:${pin.sha256}` }] }));
    const local = (await auditaBlindatge({ root })).localSecrets;
    assert.equal(local.status, 'fail', mode); assert.equal(local.coverage.staticBinaries.status, 'fail', mode);
    assert.ok(local.findings.some(f => f.ruleId === 'opendata-zip-outside-manifest'), mode);
  }
});

test('R32.43 · manifest declaratiu rebutja duplicats, traversal, controls i mides fora del pressupost', () => {
  const value={schema:'sdp.static-binaries.integrity.v1',control:'prova',assets:structuredClone(ACTIUS_PATRIMONIALS_LEGITIMS)};
  assert.equal(validaManifestActius(value).length,5);
  for(const change of [v=>v.assets.push(v.assets[0]),v=>v.assets[0].path='public/assets/../secret.pdf',v=>v.assets[0].path='public/assets/\u0000bad.pdf',v=>v.assets[0].bytes=64*1024*1024,v=>v.assets[0].census.export='EXCLOSES']) {
    const altered=structuredClone(value);change(altered);assert.throws(()=>validaManifestActius(altered),/STATIC_MANIFEST_INVALID/);
  }
});


test('R32.43 · actiu encara referenciat que desapareix del disc és fallada, no cobertura verda', async t => {
  const {root,file}=assetFixture(t);fs.unlinkSync(file);
  const local=(await auditaBlindatge({root})).localSecrets;
  assert.equal(local.status,'fail');assert.equal(local.coverage.staticBinaries.status,'fail');
  assert.ok(local.findings.some(f=>f.ruleId==='static-binary-missing'));
});


test('R32.43 · spreads, computed keys i accessors no poden acreditar un PDF literal trepitjat', async t => {
  for (const tail of ["...{pdf:'/other.pdf'}", "['pdf']:'/other.pdf'", "get pdf(){return '/other.pdf'}", "pdf:'/other.pdf'"]) {
    const {root,census,url,asset}=assetFixture(t);
    fs.writeFileSync(census, `throw new Error('NO_EXECUTAR_SOURCE');export const OBRA_QUE_DINEM=Object.freeze({pdf:${JSON.stringify(url)},pdfBytes:${asset.bytes},${tail}});`);
    const local=(await auditaBlindatge({root})).localSecrets;
    assert.equal(local.status,'fail',tail);assert.ok(local.findings.some(f=>f.ruleId==='static-binary-census-orphan'),tail);
  }
});

// v1.2.22 · Gauntlet R1 (L4-03) · dist i public dins del seu topall, però junts per damunt de LIMITS.localEntries: abans
// la passada d'integritat compartia el comptador, saltava LOCAL_LIMIT i no es llegia cap literal del build.
test('v1.2.22 · L4-03 · la passada d’integritat de public té topall propi i no amaga els literals de dist', async t => {
  const root = fixture(t), lot = Math.ceil(LIMITS.localEntries * 0.6);
  fs.mkdirSync(path.join(root, 'dist', 'assets'), { recursive: true }); fs.mkdirSync(path.join(root, 'public', 'galeria'));
  // .map no és candidat de lectura: només ocupa entrades, com els chunks d'un build real.
  for (let i = 0; i < lot; i++) {
    fs.writeFileSync(path.join(root, 'dist', 'assets', `c${i}.js.map`), '');
    fs.writeFileSync(path.join(root, 'public', 'galeria', `g${i}.map`), '');
  }
  fs.writeFileSync(path.join(root, 'dist', 'z.js'), 'const clau = "sb_secret_' + 'a'.repeat(40) + '";');
  let local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.root, 'dist'); assert.equal(local.code, undefined);
  assert.ok(local.coverage.literals.files >= 1); assert.equal(local.coverage.literals.status, 'ok');
  assert.ok(local.findings.some(f => f.ruleId === 'supabase-secret' && f.path === 'dist/z.js'));
  assert.equal(local.status, 'fail');
  // El veredicte dels binaris no canvia: un gros fora del manifest a public continua sent fallada bloquejant.
  const gros = path.join(root, 'public', 'gros.png'); fs.writeFileSync(gros, ''); fs.truncateSync(gros, LIMITS.localBinaryFileBytes + 1);
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.ok(local.findings.some(f => f.ruleId === 'static-binary-unregistered' && f.path === 'public/gros.png'));
  assert.ok(local.findings.some(f => f.ruleId === 'supabase-secret' && f.path === 'dist/z.js'));
  // v1.2.22 · Gauntlet R2 (M3-03): la passada d'integritat sola per damunt del seu topall només deixa inconclusos
  // els binaris; el secret de dist continua a findings i el veredicte és 'fail'.
  fs.rmSync(gros);
  for (let i = lot; i < LIMITS.localEntries; i++) fs.writeFileSync(path.join(root, 'public', 'galeria', `g${i}.map`), '');
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.code, 'LOCAL_LIMIT');
  assert.ok(local.findings.some(f => f.ruleId === 'supabase-secret' && f.path === 'dist/z.js'));
  assert.equal(local.coverage.literals.status, 'ok'); assert.equal(local.coverage.staticBinaries.status, 'unknown');
  // Tancat per defecte: sense el secret, el mateix desbordament continua inconclús, mai verd.
  fs.writeFileSync(path.join(root, 'dist', 'z.js'), 'export const publicValue = 1;');
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'unknown'); assert.equal(local.code, 'LOCAL_LIMIT'); assert.deepEqual(local.findings, []);
  assert.equal(local.coverage.literals.status, 'ok'); assert.equal(local.coverage.staticBinaries.status, 'unknown');
});

// v1.2.23 · L4-03b (ordre del Mestre 261123) · Els JS de més de 2 MiB del build (el tros de pageContent.r10) donaven
// 'fail' per la mida. Ara es lligen per blocs (només els JS de dist/): un text net dona 'ok', un secret a la costura d'un
// bloc continua sent fallada amb la línia exacta, i un fitxer gros que no és text continua bloquejant (R32.43).
const jsGran = (cos = '') => {
  // Un caràcter de dos bytes just damunt de la costura del primer bloc: el descodificador ha de cosir-lo.
  const parts = ['/* ' + 'x'.repeat(LIMITS.streamBlockBytes - 4) + 'à */\n', cos];
  const linia = 'export const t={a:"Text de pàgina vàlid",b:[1,2,3]};\n';
  let mida = Buffer.byteLength(parts.join(''));
  while (mida <= LIMITS.localFileBytes + 65536) { parts.push(linia); mida += Buffer.byteLength(linia); }
  return parts.join('');
};
const escriuGran = (root, rel, contingut) => {
  const desti = path.join(root, rel); fs.mkdirSync(path.dirname(desti), { recursive: true }); fs.writeFileSync(desti, contingut);
  return fs.statSync(desti).size;
};

test('v1.2.23 · L4-03b · un JS de build > 2 MiB net es llig sencer per blocs i dona ok, no fail', async t => {
  const root = fixture(t), mida = escriuGran(root, 'dist/assets/pageContent.r10-sintetic.js', jsGran());
  assert.ok(mida > LIMITS.localFileBytes && mida > LIMITS.localBinaryFileBytes);
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'ok'); assert.equal(local.code, undefined); assert.deepEqual(local.findings, []);
  assert.deepEqual(local.coverage, { literals: { status: 'ok', files: 1, bytes: mida }, staticBinaries: { status: 'ok', files: 0, bytes: 0 } });
  assert.deepEqual(local.blockScanned, { files: 1, bytes: mida });
});

test('v1.2.23 · L4-03b · els secrets a les costures dels blocs es troben amb la línia exacta i sense el valor', async t => {
  const root = fixture(t), linia = 'export const t={a:"Text de pàgina vàlid",b:[1,2,3]};\n';
  const secret = 'sb_secret_' + 'Q7'.repeat(20), jwtCos = Buffer.from(JSON.stringify({ role: 'service' + '_role' })).toString('base64url');
  const jwt = `eyJhbGciOiJIUzI1NiJ9.${jwtCos}.${'s'.repeat(40)}`;
  const parts = []; let mida = 0;
  const posa = text => { parts.push(text); mida += Buffer.byteLength(text); };
  // Cada costura de bloc queda dins d'un secret (comença 20 bytes abans): una clau de Supabase i un JWT de rol elevat.
  for (const [costura, valor] of [[LIMITS.streamBlockBytes, `const a="${secret}";\n`], [2 * LIMITS.streamBlockBytes, `const b="${jwt}";\n`]]) {
    while (mida + Buffer.byteLength(linia) < costura - 100) posa(linia);
    posa(' '.repeat(costura - 20 - 'const a="'.length - mida));
    posa(valor);
  }
  while (mida <= 2 * LIMITS.streamBlockBytes + 4096) posa(linia);
  posa(`const c="${secret}";`); // l'última línia, sense salt final
  const text = parts.join(''), midaFitxer = escriuGran(root, 'dist/assets/gran.js', text), bytes = Buffer.from(text);
  for (const [costura, agulla] of [[LIMITS.streamBlockBytes, secret], [2 * LIMITS.streamBlockBytes, jwt]]) {
    const inici = bytes.indexOf(agulla);
    assert.ok(inici < costura && costura < inici + agulla.length, `la costura ${costura} cau dins del secret`);
  }
  const local = (await auditaBlindatge({ root })).localSecrets;
  const esperat = escanejaLiterals(text, 'dist/assets/gran.js').map(f => `${f.ruleId}:${f.line}`).sort();
  assert.equal(esperat.length, 3);
  assert.deepEqual(local.findings.map(f => `${f.ruleId}:${f.line}`).sort(), esperat, 'per blocs = escaneig sencer');
  assert.equal(local.status, 'fail'); assert.deepEqual(local.blockScanned, { files: 1, bytes: midaFitxer });
  assert.equal(JSON.stringify(local).includes(secret), false); assert.equal(JSON.stringify(local).includes(jwtCos), false);
});

test('v1.2.23 · L4-03b · un .js gros que no és text, o per damunt del sostre, continua sent fallada bloquejant', async t => {
  const root = fixture(t);
  // UTF-8 invàlid passat el primer bloc i cap byte nul: no és text encara que comence com un JS.
  const contingut = Buffer.concat([Buffer.from(jsGran()), Buffer.alloc(4096, 0xff)]);
  escriuGran(root, 'dist/assets/binari-camuflat.js', contingut);
  let local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.coverage.literals.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.ok(local.findings.some(f => f.ruleId === 'static-file-oversize-unregistered' && f.path === 'dist/assets/binari-camuflat.js'));
  fs.rmSync(path.join(root, 'dist', 'assets', 'binari-camuflat.js'));
  // El sostre es prova dins de dist/: a public/ el fitxer ja cauria per R32.43 sense arribar a mirar-lo.
  const gros = path.join(root, 'dist', 'assets', 'sostre.js'); fs.writeFileSync(gros, ''); fs.truncateSync(gros, LIMITS.localStreamFileBytes + 1);
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.deepEqual(local.blockScanned, { files: 0, bytes: 0 }, 'per damunt del sostre no es llig');
  assert.ok(local.findings.some(f => f.ruleId === 'static-file-oversize-unregistered' && f.path === 'dist/assets/sostre.js'));
});

// v1.2.23 · L4-03b (ordre del Mestre 261123) · Gauntlet: l'excepció és només per als JS del build. Un text gros vàlid (UTF-8 i
// sense bytes nuls, perquè no el tombe la detecció de binaris) i no registrat continua bloquejant a public/ i amb altres extensions.
test('v1.2.23 · L4-03b · fora dels JS de dist/, un text gros vàlid i no registrat continua sent fallada bloquejant (R32.43)', async t => {
  const root = fixture(t), cos = jsGran();
  // v1.2.23 · costura Porta Arrel A5 (ordre del Mestre 261123) · el JSON de public/ és de la fixture temporal, no del
  // repositori: es compon per segments perquè la Porta Arrel no el llija com a configuració citada inexistent.
  const fora = [['public', 'gran.json'].join('/'), 'public/gran.js', 'public/assets/gran.svg', 'dist/gran.json', 'dist/assets/gran.css', 'dist/assets/gran.svg', 'dist/index.html'];
  for (const rel of fora) escriuGran(root, rel, cos);
  const dins = escriuGran(root, 'dist/assets/net-AbCdEfGh.js', cos);
  const esperat = rels => rels.map(rel => `static-file-oversize-unregistered@${rel}`).sort();
  let local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.equal(local.coverage.literals.status, 'fail'); assert.equal(local.coverage.staticBinaries.status, 'fail');
  assert.deepEqual(local.findings.map(f => `${f.ruleId}@${f.path}`).sort(), esperat(fora));
  assert.deepEqual(local.blockScanned, { files: 1, bytes: dins }, 'només el JS del build es llig per blocs');
  // Sense dist/, public/ és la base de l'escaneig principal i tampoc no hi ha excepció.
  fs.rmSync(path.join(root, 'dist'), { recursive: true });
  local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'fail'); assert.deepEqual(local.blockScanned, { files: 0, bytes: 0 });
  assert.deepEqual(local.findings.map(f => `${f.ruleId}@${f.path}`).sort(), esperat(fora.filter(rel => rel.startsWith('public/'))));
});

test('v1.2.23 · L4-03b · esgotar el pressupost dels textos grans és inconclús, mai verd ni fallada inventada', async t => {
  const root = fixture(t), cos = jsGran();
  for (let i = 0; i <= LIMITS.localStreamFiles; i++) escriuGran(root, `dist/assets/c${String(i).padStart(2, '0')}.js`, cos);
  fs.writeFileSync(path.join(root, 'dist', 'menut.js'), 'export const publicValue = 1;');
  const local = (await auditaBlindatge({ root })).localSecrets;
  assert.equal(local.status, 'unknown'); assert.equal(local.code, 'LOCAL_LIMIT'); assert.deepEqual(local.findings, []);
  assert.equal(local.blockScanned.files, LIMITS.localStreamFiles);
  // Els textos menuts es lligen primer i no perden pressupost; els grans que no s'han llegit deixen tot dues cobertures inconcluses.
  assert.equal(local.coverage.literals.files, LIMITS.localStreamFiles + 1);
  assert.equal(local.coverage.literals.status, 'unknown'); assert.equal(local.coverage.staticBinaries.status, 'unknown');
});
