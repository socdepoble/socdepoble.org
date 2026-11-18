import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditaAnonim, auditaCapcaleres, auditaBlindatge, main, parseArgs, LIMITS } from './tractor-sentinella-blindatge.mjs';

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
