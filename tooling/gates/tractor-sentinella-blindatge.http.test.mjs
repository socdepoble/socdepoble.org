import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import tls from 'node:tls';
import { spawnSync } from 'node:child_process';
import { addressAllowed, requestGet } from './tractor-sentinella-blindatge.mjs';

let directory, certificate, server, port;
const sockets = new Set();
before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sentinella-tls-'));
  const key = path.join(directory, 'fixture.key'), cert = path.join(directory, 'fixture.crt'), config = path.join(directory, 'openssl.cnf');
  fs.writeFileSync(config, '[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n[dn]\nCN=socdepoble.org\n[v3]\nsubjectAltName=DNS:socdepoble.org\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n', { mode: 0o600 });
  const result = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '2', '-keyout', key, '-out', cert, '-config', config], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, 'Fixture local: cal OpenSSL.');
  certificate = fs.readFileSync(cert);
  server = https.createServer({ key: fs.readFileSync(key), cert: certificate }, (req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { Location: 'https://127.0.0.1/private' }); res.end(); return; }
    if (req.url === '/upgrade') { res.writeHead(101, { Connection: 'Upgrade', Upgrade: 'fixture' }); res.end(); return; }
    if (req.url === '/oversize') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.write('x'.repeat(128)); res.end(); return; }
    if (req.url === '/slow') { res.writeHead(200); res.flushHeaders(); res.write('started'); return; }
    if (req.url === '/truncated') { res.writeHead(200, { 'Content-Length': '1000' }); res.write('short', () => res.destroy()); return; }
    if (req.url === '/encoded') { res.writeHead(200, { 'Content-Encoding': 'gzip' }); res.end('not decoded'); return; }
    if (req.url === '/headers') { res.writeHead(200, { 'X-Big': 'x'.repeat(20000) }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ method: req.method, host: req.headers.host, authorization: req.headers.authorization || null, cookie: req.headers.cookie || null }));
  });
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  port = server.address().port;
});
after(async () => {
  for (const socket of sockets) socket.destroy();
  if (server) await new Promise(resolve => server.close(resolve));
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

function dependencies({ addresses = ['1.1.1.1'], resolverFactory, trust = true } = {}) {
  const calls = { dns: 0, cancel: 0, requests: 0, pinned: [] }; const agents = [];
  const deps = {
    resolverFactory: resolverFactory || (() => ({
      resolve4: async () => { calls.dns++; return addresses; }, resolve6: async () => { calls.dns++; return []; }, cancel: () => { calls.cancel++; },
    })),
    requestImpl: (url, options, callback) => {
      calls.requests++;
      assert.equal(options.method, 'GET'); assert.equal(options.agent, false); assert.equal(options.rejectUnauthorized, true);
      assert.equal(options.servername, url.hostname); assert.equal(options.checkServerIdentity, tls.checkServerIdentity);
      options.lookup(url.hostname, { family: 4 }, (err, address) => { assert.ifError(err); calls.pinned.push(address); });
      // Exclusivament fixture: el socket local porta SNI/Host reals i CA explícita.
      const agent = new https.Agent({ keepAlive: false }); agents.push(agent);
      agent.createConnection = () => tls.connect({ host: '127.0.0.1', port, servername: url.hostname, rejectUnauthorized: true, ...(trust ? { ca: certificate } : {}) });
      return https.request(url, { ...options, agent }, callback);
    },
  };
  return { deps, calls, close: () => agents.forEach(a => a.destroy()) };
}
async function probe(route, options = {}, settings = {}) {
  const f = dependencies(settings);
  try { return { result: await requestGet('https://socdepoble.org' + route, options, f.deps), calls: f.calls }; }
  finally { f.close(); }
}

test('SSRF rebutja adreces locals, reservades, documentals i túnels IPv6', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '192.168.0.23', '169.254.169.254', '100.64.0.1', '192.0.2.1', '192.88.99.1', '::1', '::ffff:127.0.0.1', '2001:db8::1', '2001::1', '2002:7f00:1::1', '3fff::1']) assert.equal(addressAllowed(ip), false, ip);
  assert.equal(addressAllowed('1.1.1.1'), true); assert.equal(addressAllowed('2606:4700:4700::1111'), true);
});

test('URL, mètode, body i credencials no autoritzats fallen abans de DNS', async () => {
  const deps = { resolverFactory: () => assert.fail('no DNS') };
  for (const url of ['http://socdepoble.org', 'https://socdepoble.org.evil.test/', 'https://name:pass@socdepoble.org', 'https://socdepoble.org:444/', 'https://socdepoble.org/#fragment', 'https://127.0.0.1']) await assert.rejects(requestGet(url, {}, deps), { code: 'ORIGIN_REJECTED' });
  for (const options of [{ method: 'POST' }, { body: '{}' }, { claimed: true }, { maxBytes: 0 }, { maxBytes: -1 }, { maxBytes: Infinity },
    { timeoutMs: 0 }, { timeoutMs: -1 }, { timeoutMs: NaN }, { headers: { Cookie: 'private' } }, { headers: { Authorization: 'Bearer private' } },
    { headers: { apikey: 'sb_secret_private' }, backendOrigin: 'https://project.supabase.co' }]) await assert.rejects(requestGet('https://socdepoble.org/', options, deps));
});

test('DNS mixt amb una sola adreça privada no obri cap socket', async () => {
  const f = dependencies({ addresses: ['1.1.1.1', '127.0.0.1'] });
  await assert.rejects(requestGet('https://socdepoble.org/', {}, f.deps), { code: 'ADDRESS_REJECTED' });
  assert.equal(f.calls.requests, 0); f.close();
});

test('TLS local verifica CA/hostname i usa el DNS validat al socket', async () => {
  const { result, calls } = await probe('/');
  assert.equal(result.status, 200); assert.deepEqual(calls.pinned, ['1.1.1.1']);
  assert.equal(result.tls.authorized, true); assert.ok(result.tls.daysRemaining >= 1);
  assert.match(result.tls.fingerprint256, /^[A-F0-9:]+$/);
  assert.deepEqual(JSON.parse(result.text), { method: 'GET', host: 'socdepoble.org', authorization: null, cookie: null });
});

test('una CA no confiada i un hostname diferent mai passen la verificació', async () => {
  await assert.rejects(probe('/', {}, { trust: false }));
  const f = dependencies();
  try { await assert.rejects(requestGet('https://socdepoble.cat/', {}, f.deps)); } finally { f.close(); }
});

test('redirecció externa es rebutja després d’una sola petició', async () => {
  const f = dependencies();
  try { await assert.rejects(requestGet('https://socdepoble.org/redirect', {}, f.deps), { code: 'REDIRECT_REJECTED' }); assert.equal(f.calls.requests, 1); } finally { f.close(); }
});

test('oversize, gzip, capçaleres gegants, upgrade i cos truncat no confirmen una resposta', async () => {
  await assert.rejects(probe('/oversize', { maxBytes: 64 }), { code: 'BYTE_LIMIT' });
  await assert.rejects(probe('/encoded'), { code: 'ENCODING_REJECTED' });
  await assert.rejects(probe('/headers'));
  await assert.rejects(probe('/upgrade'), { code: 'UPGRADE_REJECTED' });
  await assert.rejects(probe('/truncated'), { code: 'BODY_INCOMPLETE' });
});

test('deadline cobreix el cos després de rebre bytes i destrueix el transport', async () => {
  await assert.rejects(probe('/slow', { timeoutMs: 250 }), { code: 'TIMEOUT' });
});

test('deadline i abort cancel·len les consultes DNS natives pendents abans de socket', async () => {
  for (const action of ['timeout', 'abort']) {
    const pending = []; let cancelled = 0, dispatched = 0;
    const resolverFactory = () => ({ resolve4: () => new Promise((_, reject) => pending.push(reject)), resolve6: () => new Promise((_, reject) => pending.push(reject)), cancel: () => { cancelled++; pending.splice(0).forEach(reject => reject(Object.assign(new Error('cancel'), { code: 'ECANCELLED' }))); } });
    const control = new AbortController();
    const promise = requestGet('https://socdepoble.org/', { timeoutMs: 35, signal: control.signal }, { resolverFactory, requestImpl: () => { dispatched++; assert.fail('no socket'); } });
    if (action === 'abort') control.abort();
    await assert.rejects(promise, { code: action === 'abort' ? 'ABORTED' : 'TIMEOUT' });
    assert.ok(cancelled); assert.equal(dispatched, 0);
  }
});

test('senyal ja avortat no resol DNS ni toca HTTPS', async () => {
  const signal = AbortSignal.abort();
  await assert.rejects(requestGet('https://socdepoble.org/', { signal }, { resolverFactory: () => assert.fail('no DNS') }), { code: 'ABORTED' });
});

test('pressupost esgotat rebutja abans de DNS i no infla el comptador de peticions', async () => {
  const budget = { requests: 16, maxRequests: 16, acceptedBytes: 0, receivedBytes: 0, maxBytes: 1024, dnsQueries: 0, dns: new Map(), deadline: Date.now() + 60000 };
  await assert.rejects(requestGet('https://socdepoble.org/', { budget }, { resolverFactory: () => assert.fail('no DNS') }), { code: 'REQUEST_LIMIT' });
  assert.equal(budget.requests, 16);
});

test('el límit total de bytes no es reinicia amb un altre cos HTTP', async () => {
  const budget = { requests: 0, maxRequests: 16, acceptedBytes: 60, receivedBytes: 60, maxBytes: 64, dnsQueries: 0, dns: new Map(), deadline: Date.now() + 60000 };
  const f = dependencies();
  try {
    await assert.rejects(requestGet('https://socdepoble.org/', { budget }, f.deps), { code: 'BYTE_LIMIT' });
    assert.equal(budget.acceptedBytes, 60); assert.ok(budget.receivedBytes > 64); assert.equal(f.calls.requests, 1);
  } finally { f.close(); }
});

test('una segona petició amb DNS compartit pendent respecta el seu deadline propi', async () => {
  const pending = [];
  const resolverFactory = () => ({ resolve4: () => new Promise((_, reject) => pending.push(reject)), resolve6: () => new Promise((_, reject) => pending.push(reject)), cancel: () => pending.splice(0).forEach(reject => reject(Object.assign(new Error('cancel'), { code: 'ECANCELLED' }))) });
  const budget = { requests: 0, maxRequests: 16, acceptedBytes: 0, receivedBytes: 0, maxBytes: 65536, dnsQueries: 0, dns: new Map(), deadline: Date.now() + 60000 };
  const control = new AbortController(), deps = { resolverFactory, requestImpl: () => assert.fail('no socket') };
  const first = requestGet('https://socdepoble.org/', { budget, signal: control.signal, timeoutMs: 2000 }, deps).catch(error => error);
  const second = requestGet('https://socdepoble.org/', { budget, timeoutMs: 35 }, deps).catch(error => error);
  let guard;
  try {
    const result = await Promise.race([second, new Promise(resolve => { guard = setTimeout(() => resolve({ code: 'LATE' }), 250); })]);
    assert.equal(result.code, 'TIMEOUT'); assert.equal(budget.dnsQueries, 2);
  } finally { clearTimeout(guard); control.abort(); await first; await second; }
});
